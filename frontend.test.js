const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('vm');
const fs = require('fs');

// ── DOM-stubb-harness ────────────────────────────────────────────
// Kör bensinkostnad-wpcode.js i en isolerad vm-kontext med precis så
// mycket webbläsar-API att logiken går att testa utan riktig DOM.
const SNIPPET = new vm.Script(
  fs.readFileSync(require.resolve('./src/bensinkostnad-wpcode.js'), 'utf8'),
  { filename: 'bensinkostnad-wpcode.js' }
);

// Statiska element som finns i WordPress-HTML-blocket — förregistreras.
// Dynamiska element (badge, chips, CO₂-ruta, dela-knapp) skapar koden själv.
const STATIC_IDS = [
  'bc-start', 'bc-dest', 'bc-km', 'bc-cons', 'bc-price', 'bc-returresa',
  'bc-brand', 'bc-model', 'bc-results', 'bc-mapCard', 'bc-error', 'bc-calcStatus',
  'bc-calcBtn', 'bc-gpsBtn', 'bc-gpsBtnLabel', 'bc-gpsHint',
  'bc-priceBtn', 'bc-priceBtnLabel', 'bc-priceHint', 'bc-priceLabel', 'bc-priceUnit',
  'bc-consUnit', 'bc-consHint', 'bc-card3Header',
  'bc-fLabel1', 'bc-fExpr1', 'bc-fExpr2', 'bc-rLitersLabel', 'bc-rLitersUnit',
  'bc-rKm', 'bc-rMil', 'bc-rLiters', 'bc-rCost',
  'bc-t1', 'bc-t2', 'bc-t3', 'bc-t4',
  'bc-demoBanner', 'bc-demoCount', 'bc-loginCta', 'bc-loginCtaCount'
];

function createEnv(opts) {
  opts = opts || {};
  const els = {};

  function makeEl(tag) {
    const el = {
      tagName: (tag || 'div').toUpperCase(),
      _id: '', _html: '', value: '', checked: false, disabled: false,
      textContent: '', placeholder: '',
      style: {}, children: [], listeners: {},
      options: { length: 1 },
      classList: {
        _s: new Set(),
        add(c) { this._s.add(c); },
        remove(c) { this._s.delete(c); },
        toggle(c, f) {
          if (f === undefined) f = !this._s.has(c);
          f ? this._s.add(c) : this._s.delete(c);
          return f;
        },
        contains(c) { return this._s.has(c); }
      },
      addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
      appendChild(c) { this.children.push(c); return c; },
      insertBefore(c) { this.children.push(c); return c; },
      insertAdjacentElement(_pos, c) { this.children.push(c); return c; },
      querySelector() { return null; },
      setAttribute() {}, remove() {}, scrollIntoView() {}, select() {},
      closest() { return null; },
      get parentNode() { return bodyEl; }
    };
    Object.defineProperty(el, 'id', {
      get() { return this._id; },
      set(v) { this._id = v; els[v] = el; }
    });
    // Registrera id:n som skapas via innerHTML (stubben parsar ingen HTML,
    // men koden förväntar sig kunna getElementById:a dem efteråt)
    Object.defineProperty(el, 'innerHTML', {
      get() { return this._html; },
      set(v) {
        this._html = String(v);
        for (const m of this._html.matchAll(/id="([^"]+)"/g)) {
          if (!els[m[1]]) els[m[1]] = makeEl();
        }
      }
    });
    return el;
  }

  const bodyEl = makeEl('body');
  bodyEl.classList._s = new Set(opts.loggedIn ? ['logged-in'] : []);
  STATIC_IDS.forEach(id => { els[id] = makeEl(); els[id]._id = id; });

  // Grid med .bc-big för CO₂-rutan, trace som ankare för jämförelsen
  const gridEl = makeEl('div');
  const bigEl = makeEl('div');
  gridEl.querySelector = sel => (sel === '.bc-big' ? bigEl : null);
  const traceAnchor = makeEl('div');

  const store = {};
  const fetchLog = [];

  const sandbox = {
    els, fetchLog, store,
    document: {
      readyState: 'loading', // gör att bcWireEvents inte körs vid laddning
      addEventListener() {},
      head: { appendChild() {} },
      body: bodyEl,
      getElementById(id) { return els[id] || null; },
      querySelector(sel) {
        if (sel === '#bc-results .bc-trace') return traceAnchor;
        if (sel === '#bc-results .bc-res-grid') return gridEl;
        return null;
      },
      querySelectorAll() { return []; },
      createElement(tag) { return makeEl(tag); }
    },
    window: { addEventListener() {} },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    location: opts.location || {
      origin: 'https://elitrobban.se', pathname: '/branslekostnad-berakning/', search: '', hash: ''
    },
    history: { replaceState() {} },
    navigator: {},
    fetch(url) {
      fetchLog.push(String(url));
      if (!opts.fetchHandler) return Promise.reject(new Error('ingen fetchHandler i testet'));
      return opts.fetchHandler(String(url));
    },
    // Långa timers (delad länk-kalkylen på 300 ms, knapp-återställningar) skulle
    // fyra av efter testets slut — hoppa över dem, korta (fetch-triggers) körs
    setTimeout(fn, ms) { if (!ms || ms < 250) return setTimeout(fn, ms); return 0; },
    clearTimeout,
    URLSearchParams,
    console,
    // Synkron count-up: två steg med stigande timestamp gör animationen klar direkt
    requestAnimationFrame: (function () { let t = 0; return cb => cb(t += 1000); })()
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  SNIPPET.runInContext(ctx);
  return ctx;
}

function jsonResponse(data) {
  return Promise.resolve({ ok: true, json: async () => data });
}

// Vänta ut promise-kedjor (jämförelsen renderar asynkront)
const tick = () => new Promise(r => setTimeout(r, 20));

// ── bcElZoneFromLat: latitud → elområde ──────────────────────────

test('bcElZoneFromLat mappar svenska städer till rätt elområde', () => {
  const ctx = createEnv();
  assert.equal(ctx.bcElZoneFromLat(null),  'SE3'); // ingen GPS → SE3
  assert.equal(ctx.bcElZoneFromLat(67.86), 'SE1'); // Kiruna
  assert.equal(ctx.bcElZoneFromLat(63.83), 'SE1'); // Umeå
  assert.equal(ctx.bcElZoneFromLat(62.39), 'SE2'); // Sundsvall
  assert.equal(ctx.bcElZoneFromLat(60.67), 'SE3'); // Gävle
  assert.equal(ctx.bcElZoneFromLat(59.33), 'SE3'); // Stockholm
  assert.equal(ctx.bcElZoneFromLat(57.71), 'SE3'); // Göteborg
  assert.equal(ctx.bcElZoneFromLat(55.60), 'SE4'); // Malmö
});

// ── CO₂-faktorer ─────────────────────────────────────────────────

test('bcCo2Factor följer valt bränsleläge', () => {
  const ctx = createEnv();
  ctx.bcIsElectric = false; ctx.bcIsDiesel = false;
  assert.equal(ctx.bcCo2Factor(), 2.36);
  ctx.bcIsDiesel = true;
  assert.equal(ctx.bcCo2Factor(), 2.68);
  ctx.bcIsElectric = true; ctx.bcIsDiesel = false;
  assert.equal(ctx.bcCo2Factor(), 0.04);
});

test('bcRenderCo2 skapar rutan och sätter rätt enhetsetikett', () => {
  const ctx = createEnv();
  ctx.bcIsElectric = true;
  ctx.bcRenderCo2(2.04);
  assert.match(ctx.els['bc-co2Item'].innerHTML, /CO₂-utsläpp/);
  assert.equal(ctx.els['bc-rCo2Unit'].textContent, 'kg CO₂ · svensk elmix');
  assert.equal(ctx.els['bc-rCo2'].textContent, '2,04');
  ctx.bcIsElectric = false;
  ctx.bcRenderCo2(53.1);
  assert.equal(ctx.els['bc-rCo2Unit'].textContent, 'kg CO₂ · vid förbränning');
});

// ── bcApplyEvData: parsning av carName från CarAdvice ────────────

test('bcApplyEvData parsar märken, tvåordsmärken och (el)-suffix', () => {
  const ctx = createEnv();
  ctx.bcApplyEvData([
    { carName: 'Volkswagen ID.7 Pro', kwhPerMil: 1.68 },
    { carName: 'Alfa Romeo Junior Elettrica', kwhPerMil: 1.5 },
    { carName: 'Land Rover Range Rover Electric', kwhPerMil: 2.2 },
    { carName: 'Tesla Model 3 (el)', kwhPerMil: 1.4 } // redan suffixat — ska inte dubblas
  ]);
  assert.equal(ctx.BC_CAR_DB['Volkswagen']['ID.7 Pro (el)'], 1.68);
  assert.equal(ctx.BC_CAR_DB['Alfa Romeo']['Junior Elettrica (el)'], 1.5);
  assert.equal(ctx.BC_CAR_DB['Land Rover']['Range Rover Electric (el)'], 2.2);
  assert.equal(ctx.BC_CAR_DB['Tesla']['Model 3 (el)'], 1.4);
});

test('bcApplyEvData normaliserar MG-modeller med MG-prefix', () => {
  const ctx = createEnv();
  ctx.bcApplyEvData([
    { carName: 'MG IM5 Long Range', kwhPerMil: 1.36 },
    { carName: 'MG ZS EV', kwhPerMil: 1.65 },
    { carName: 'MG4 Long Range', kwhPerMil: 1.3 },   // MG4 = märket MG, prefixet kvar i modellen
    { carName: 'MG MG4 XPOWER', kwhPerMil: 1.52 },   // får inte bli "MG MG4 ..."
    { carName: 'MG MGS5 EV 64 kWh', kwhPerMil: 1.29 }
  ]);
  const mg = Object.keys(ctx.BC_CAR_DB['MG']);
  assert.ok(mg.includes('MG IM5 Long Range (el)'));
  assert.ok(mg.includes('MG ZS EV (el)'));
  assert.ok(mg.includes('MG4 Long Range (el)'));
  assert.ok(mg.includes('MG4 XPOWER (el)'));
  assert.ok(mg.includes('MGS5 EV 64 kWh (el)'));
  assert.ok(!mg.some(m => m.indexOf('MG MG') === 0), 'inget dubblerat MG-prefix');
});

test('bcApplyEvData hoppar över okända märken, nollvärden och skriver inte över', () => {
  const ctx = createEnv();
  const before = ctx.BC_CAR_DB['Tesla']['Model Y Long Range AWD (el)'];
  ctx.bcApplyEvData([
    { carName: 'Wuling Air EV', kwhPerMil: 1.1 },              // okänt märke
    { carName: 'Tesla Model 3', kwhPerMil: 0 },                // saknar förbrukning
    { carName: 'Tesla Model Y Long Range AWD', kwhPerMil: 9.9 } // finns redan — behåll statiska värdet
  ]);
  assert.equal(ctx.BC_CAR_DB['Wuling'], undefined);
  assert.equal(ctx.BC_CAR_DB['Tesla']['Model 3 (el)'], undefined);
  assert.equal(ctx.BC_CAR_DB['Tesla']['Model Y Long Range AWD (el)'], before);
});

// ── bcApplyIceData: bensin/diesel från servern ───────────────────

test('bcApplyIceData matchar märkesprefix och sätter dieselsuffix', () => {
  const ctx = createEnv();
  ctx.bcApplyIceData([
    { carName: 'Volvo XC60 B4 Mild-Hybrid', literPerMil: 0.78, fuel: 'petrol' },
    { carName: 'Alfa Romeo Tonale 1.6 Diesel', literPerMil: 0.55, fuel: 'diesel' },
    { carName: 'Nyttmärke Modell X', literPerMil: 0.7, fuel: 'petrol' }
  ]);
  assert.equal(ctx.BC_CAR_DB['Volvo']['XC60 B4 Mild-Hybrid'], 0.78);
  assert.equal(ctx.BC_CAR_DB['Alfa Romeo']['Tonale 1.6 Diesel (diesel)'], 0.55);
  assert.equal(ctx.BC_CAR_DB['Nyttmärke']['Modell X'], 0.7);
});

// ── Delbara länkar ───────────────────────────────────────────────

test('delad länk fyller fälten och bygger identisk URL tillbaka', () => {
  const ctx = createEnv({
    location: {
      origin: 'https://elitrobban.se', pathname: '/branslekostnad-berakning/', search: '',
      hash: '#bc=start=Malm%C3%B6&dest=Stockholm&mil=61.2&mode=el&cons=1.7&pris=2.55&retur=1'
    },
    fetchHandler: () => jsonResponse({ zone: 'SE3', spot: 1.04 })
  });
  assert.equal(ctx.bcApplySharedLink(), true);
  assert.equal(ctx.els['bc-start'].value, 'Malmö');
  assert.equal(ctx.els['bc-dest'].value, 'Stockholm');
  assert.equal(ctx.els['bc-km'].value, '61.2');
  assert.equal(ctx.els['bc-cons'].value, '1.7');
  assert.equal(ctx.els['bc-price'].value, '2.55');
  assert.equal(ctx.els['bc-returresa'].checked, true);
  assert.equal(ctx.bcIsElectric, true);
  assert.equal(ctx.bcBuildShareUrl(), ctx.location.origin + ctx.location.pathname + ctx.location.hash);
});

test('bcApplySharedLink är no-op utan bc-hash', () => {
  const ctx = createEnv();
  assert.equal(ctx.bcApplySharedLink(), false);
  assert.equal(ctx.els['bc-start'].value, '');
});

// ── Prishämtning utan UI-sidoeffekter ────────────────────────────

test('bcGetElHomePriceAsync räknar hemmaladdningspris av spotpriset', async () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse({ zone: 'SE3', spot: 1.04 }) });
  const pris = await ctx.bcGetElHomePriceAsync();
  assert.equal(pris, 1.04 * 1.25 + 1.25); // spot × moms + schablon = 2.55
});

test('bcGetElHomePriceAsync använder cache och faller tillbaka vid fel', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('nere')) });
  ctx.store['bc_el_cache_SE3'] = JSON.stringify({ ts: Date.now(), data: { zone: 'SE3', spot: 0.8 } });
  assert.equal(await ctx.bcGetElHomePriceAsync(), 0.8 * 1.25 + 1.25);
  assert.equal(ctx.fetchLog.length, 0); // cachen räckte
  delete ctx.store['bc_el_cache_SE3'];
  assert.equal(await ctx.bcGetElHomePriceAsync(), 2.00); // BC_EL_FALLBACK_TOTAL
});

test('bcGetFuelPricesAsync faller tillbaka på fasta priser vid nätverksfel', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('nere')) });
  const priser = await ctx.bcGetFuelPricesAsync();
  assert.equal(priser.bensin95, 18.90);
  assert.equal(priser.diesel, 17.50);
});

// ── Bränslejämförelsen ───────────────────────────────────────────

test('bcRenderComparison visar alternativen med kostnad och CO2', async () => {
  const ctx = createEnv({
    fetchHandler: url => url.includes('electricity')
      ? jsonResponse({ zone: 'SE3', spot: 1.04 })
      : jsonResponse({ bensin95: 14.87, diesel: 16.87 })
  });
  ctx.bcIsElectric = true; ctx.bcIsDiesel = false;
  ctx.bcRenderComparison(30, 130); // 30 mil, elbilskostnad 130 kr
  await tick();
  const html = ctx.els['bc-compare'].innerHTML;
  assert.match(html, /Bensinbil/);
  assert.match(html, /Dieselbil/);
  // Aktuellt lage visas inte - men BARA hemmaladdningsraden ar det aktuella laget.
  assert.ok(!html.includes('Elbil (hemmaladdning)'));
  // De publika laddpriserna star kvar aven for en elbilsforare: skillnaden mellan att
  // ladda hemma och vid en stolpe ar hela poangen med raderna.
  assert.ok(html.includes('Elbil (publik laddning 11 kW)'));   // 11 kW ar AC, inte snabbladdning
  assert.ok(html.includes('Elbil (snabbladdning Circle K 400 kW)'));
  assert.match(html, /335 kr/);       // 30 x 0,75 x 14,87
  assert.match(html, /304 kr/);       // 30 x 0,60 x 16,87
  assert.match(html, /242 kr/);       // 30 x 1,70 x 4,75
  assert.match(html, /300 kr/);       // 30 x 1,70 x 5,89
  assert.match(html, /53 kg CO/);     // 30 x 0,75 x 2,36
  assert.match(html, /dyrare/);
  assert.match(html, /inte livscykel/);
  // INGEN rad markeras har: elbilen kostar 130 kr och alla alternativ ar dyrare. En gron
  // 'bast'-markering bredvid en rod '+86 % dyrare'-badge vore tva motsatta besked.
  assert.ok(!html.includes('bc-cmp-row best'));
});

test('bcRenderComparison markerar billigare alternativ med grön badge', async () => {
  const ctx = createEnv({
    fetchHandler: url => url.includes('electricity')
      ? jsonResponse({ zone: 'SE3', spot: 1.04 })
      : jsonResponse({ bensin95: 14.87, diesel: 16.87 })
  });
  ctx.bcIsElectric = false; ctx.bcIsDiesel = false; // bensinläge
  ctx.bcRenderComparison(30, 335);
  await tick();
  const html = ctx.els['bc-compare'].innerHTML;
  assert.match(html, /Elbil \(hemmaladdning\)/);
  assert.match(html, /cheaper/); // elbilen är billigare → grön badge
  // ...och billigaste raden lyfts fram. Hemmaladdning slar bade publik 11 kW och DC.
  const best = html.split('bc-cmp-row best')[1] || '';
  assert.ok(html.includes('bc-cmp-row best'));
  assert.ok(best.includes('Elbil (hemmaladdning)'));
});

// ── Bränslelägesbyte ─────────────────────────────────────────────

test('bcSetFuelMode rensar priset vid byte el ↔ fossilt men inte bensin ↔ diesel', () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse({ zone: 'SE3', spot: 1.04 }) });
  ctx.els['bc-price'].value = '14.87';
  ctx.bcSetFuelMode('diesel');            // fossil → fossil: behåll
  assert.equal(ctx.els['bc-price'].value, '14.87');
  ctx.bcSetFuelMode('electric');          // fossil → el: rensa
  assert.equal(ctx.els['bc-price'].value, '');
  ctx.els['bc-price'].value = '2.55';
  ctx.bcSetFuelMode('petrol');            // el → fossil: rensa
  assert.equal(ctx.els['bc-price'].value, '');
});

// ── Demo-räknaren ────────────────────────────────────────────────

test('demo-räknaren räknar ner från 3 och stannar på 0', () => {
  const ctx = createEnv();
  assert.equal(ctx.bcDemoRemaining(), 3);
  ctx.bcIncrementDemo();
  ctx.bcIncrementDemo();
  assert.equal(ctx.bcDemoRemaining(), 1);
  for (let i = 0; i < 10; i++) ctx.bcIncrementDemo();
  assert.equal(ctx.bcDemoRemaining(), 0);
});

test('ett konto UTAN prenumeration ger inte obegränsat — bara demo', () => {
  // Regressionsvakt för buggen 2026-08-20: åtkomsten gick genom en bcIsLoggedIn() som
  // bara frågade om det fanns ett token, aldrig om subscriptionStatus. Ett gratiskonto
  // fick därför obegränsade sökningar — precis det prenumerationen säljer.
  const ctx = createEnv();
  assert.equal(ctx.bcHasUnlimited(), false);
  ctx.store['ca_token'] = 'nagon-token';
  assert.equal(ctx.bcHasUnlimited(), false);          // token räcker INTE
  ctx.store['ca_status'] = 'inactive';
  assert.equal(ctx.bcHasUnlimited(), false);
  ctx.store['ca_status'] = 'active';
  assert.equal(ctx.bcHasUnlimited(), true);           // prenumeration krävs
});

test('ca_status=active utan giltigt token ger inte tillgång', () => {
  // Går inte att sätta sig själv förbi vakten: serverkollen underkänner token och
  // bcAuthValid=false vinner över det cachade statusvärdet.
  const ctx = createEnv();
  ctx.store['ca_status'] = 'active';
  ctx.bcAuthValid = false;
  assert.equal(ctx.bcHasUnlimited(), false);
});

test('bcVerifyLogin: 401 rensar token och aktiverar demoläget', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.resolve({ ok: false, status: 401 }) });
  ctx.store['ca_token'] = 'gammal-token';
  ctx.store['ca_status'] = 'active';
  assert.equal(ctx.bcHasUnlimited(), true);
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.bcHasUnlimited(), false);
  assert.equal(ctx.store['ca_token'], undefined);
  assert.equal(ctx.store['ca_status'], undefined);
  assert.ok(ctx.fetchLog[0].includes('/api/auth/me'));
});

test('bcVerifyLogin: 200 med active ger obegränsat och sparar status', async () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse({ email: 'a@b.se', subscriptionStatus: 'active' }) });
  ctx.store['ca_token'] = 'giltig-token';
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.bcHasUnlimited(), true);
  assert.equal(ctx.store['ca_status'], 'active');
});

test('bcVerifyLogin: 200 med inactive ger demoläge trots giltigt token', async () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse({ email: 'a@b.se', subscriptionStatus: 'inactive' }) });
  ctx.store['ca_token'] = 'giltig-token';
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.store['ca_status'], 'inactive');
  assert.equal(ctx.bcHasUnlimited(), false);
});

test('bcVerifyLogin: nätverksfel låser inte ute en prenumerant', async () => {
  // Render kallstartar och /api/auth/me svarar inte. En betalande får inte hamna i
  // demoläge för det — cachat ca_status får gälla tills servern säger något annat.
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('offline')) });
  ctx.store['ca_token'] = 'token';
  ctx.store['ca_status'] = 'active';
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.bcHasUnlimited(), true);
});

test('bcVerifyLogin: nätverksfel ger inte en icke-prenumerant tillgång', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('offline')) });
  ctx.store['ca_token'] = 'token';
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.bcHasUnlimited(), false);
});

test('prenumeration tar bort demo-felet och aktiverar knappen', () => {
  const ctx = createEnv();
  ctx.bcShowError('Du har använt alla 3 demosökningar. Prenumerera för obegränsad tillgång.');
  ctx.els['bc-calcBtn'].disabled = true;
  assert.equal(ctx.els['bc-error'].classList.contains('show'), true);
  ctx.store['ca_status'] = 'active';   // nu prenumerant
  ctx.bcUpdateDemoUI();
  assert.equal(ctx.els['bc-error'].classList.contains('show'), false);
  assert.equal(ctx.els['bc-calcBtn'].disabled, false);
});

test('demoblockerad beräkning körs om automatiskt efter inloggning', async () => {
  const ctx = createEnv({ fetchHandler: (url) =>
    url.indexOf('/api/auth/me') !== -1
      ? jsonResponse({ email: 'a@b.se', subscriptionStatus: 'active' })
      : jsonResponse({}) });
  for (let i = 0; i < 3; i++) ctx.bcIncrementDemo();  // fyll demogränsen
  ctx.bcCalculate();                                  // blockeras
  assert.equal(ctx.bcWasDemoBlocked, true);
  ctx.store['ca_token'] = 'token';                    // logga in
  ctx.bcVerifyLogin();
  await tick();
  assert.equal(ctx.bcWasDemoBlocked, false);          // flaggan nollställd = omkörning skedd
});

// ── Snabbladdarpris från Elbilsladdning-backenden ────────────────

test('bcFetchFastPrice visar närmaste station med operatör och avstånd i hinten', async () => {
  const ctx = createEnv({
    fetchHandler: () => jsonResponse({
      source: 'nearest-station', priceKr: 5.99, priceLabel: '~5,99 kr/kWh',
      station: 'Circle K Halmstad', operator: 'Circle K', distanceKm: 2.3,
      maxKw: 150, avgNationalKr: 4.72
    })
  });
  ctx.bcIsElectric = true;
  ctx.bcStartLat = 56.67; ctx.bcStartLon = 12.86;
  ctx.bcFetchFastPrice();
  await tick();
  assert.ok(ctx.fetchLog[0].includes('/api/charging-price?lat=56.67&lon=12.86'));
  assert.equal(ctx.els['bc-price'].value, '5.99');
  assert.match(ctx.els['bc-priceHint'].textContent, /närmaste snabbladdare/i);
  assert.match(ctx.els['bc-priceHint'].textContent, /Circle K/);
  assert.match(ctx.els['bc-priceHint'].textContent, /2,3 km/);
  assert.match(ctx.els['bc-srcBadge'].innerHTML, /NÄRMASTE SNABBLADDARE/);
  assert.match(ctx.els['bc-chipFast'].textContent, /5,99 kr\/kWh/);
});

test('bcFetchFastPrice utan position hämtar riksgenomsnittet', async () => {
  const ctx = createEnv({
    fetchHandler: () => jsonResponse({ source: 'national-average', priceKr: 4.72, avgNationalKr: 4.72 })
  });
  ctx.bcIsElectric = true;
  ctx.bcFetchFastPrice();
  await tick();
  assert.ok(!ctx.fetchLog[0].includes('lat='));
  assert.equal(ctx.els['bc-price'].value, '4.72');
  assert.match(ctx.els['bc-priceHint'].textContent, /Riksgenomsnitt/);
  assert.match(ctx.els['bc-srcBadge'].innerHTML, /SNITTPRIS/);
});

test('bcFetchFastPrice faller tillbaka på konstanten vid nätverksfel', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('nere')) });
  ctx.bcIsElectric = true;
  ctx.bcFetchFastPrice();
  await tick();
  assert.equal(ctx.els['bc-price'].value, '5.89'); // BC_EL_FAST_AVG = BC_LADDPRIS.dc400 (snabbladdning)
  assert.match(ctx.els['bc-priceHint'].textContent, /4–7 kr\/kWh/);
});

test('bcFetchFastPrice använder 30-minuterscachen utan nytt anrop', async () => {
  const ctx = createEnv({ fetchHandler: () => Promise.reject(new Error('ska inte anropas')) });
  ctx.bcIsElectric = true;
  ctx.store['bc_fast_cache_riks'] = JSON.stringify({
    ts: Date.now(), data: { source: 'national-average', priceKr: 4.5 }
  });
  ctx.bcFetchFastPrice();
  await tick();
  assert.equal(ctx.fetchLog.length, 0);
  assert.equal(ctx.els['bc-price'].value, '4.50');
});

// ── Extrarader: milersättning, samåkning, pendling ───────────────

// sv-SE-tusentalsavgränsare är smalt hårt mellanslag (U+202F) — normalisera
const normSp = s => s.replace(/[   ]/g, ' ');

test('bcRenderExtras räknar milersättning och markerar marginal/underskott', () => {
  const ctx = createEnv();
  ctx.bcRenderExtras(61.2, 500); // ersättning 61,2 × 25 = 1 530 kr > 500 kr
  assert.match(normSp(ctx.els['bc-milersRow'].innerHTML), /1 530 kr/);
  assert.match(normSp(ctx.els['bc-milersRow'].innerHTML), /1 030 kr marginal/);
  ctx.bcRenderExtras(10, 500); // ersättning 250 kr < 500 kr
  assert.match(normSp(ctx.els['bc-milersRow'].innerHTML), /250 kr saknas/);
});

test('samåkningschips ger kr/person och pendling ger årskostnad', () => {
  const ctx = createEnv();
  ctx.bcRenderExtras(30, 500);
  assert.equal(ctx.els['bc-perPerson'].innerHTML, ''); // 1 person → ingen rad
  ctx.bcPersons = 4;
  ctx.bcUpdateExtras();
  assert.match(ctx.els['bc-perPerson'].innerHTML, /125,00 kr\/person/);
  assert.ok(ctx.els['bc-pers4'].classList.contains('active'));
  // pendling utan retur-kryss: dagskostnad dubblas → 500 × 2 × 220 = 220 000
  ctx.bcCommute = true;
  ctx.bcUpdateExtras();
  assert.match(normSp(ctx.els['bc-annualCost'].innerHTML), /220 000 kr\/år/);
  // med retur-kryss är kostnaden redan tur & retur → 500 × 220 = 110 000
  ctx.els['bc-returresa'].checked = true;
  ctx.bcUpdateExtras();
  assert.match(normSp(ctx.els['bc-annualCost'].innerHTML), /110 000 kr\/år/);
});

test('delad länk bär med sig personer och pendlingsläge', () => {
  const ctx = createEnv({
    location: {
      origin: 'https://elitrobban.se', pathname: '/branslekostnad-berakning/', search: '',
      hash: '#bc=mil=30&mode=bensin&cons=0.85&pris=14.87&pers=3&pendla=1'
    },
    fetchHandler: () => jsonResponse({ bensin95: 14.87, diesel: 16.87 })
  });
  assert.equal(ctx.bcApplySharedLink(), true);
  assert.equal(ctx.bcPersons, 3);
  assert.equal(ctx.bcCommute, true);
  assert.match(ctx.bcBuildShareUrl(), /pers=3/);
  assert.match(ctx.bcBuildShareUrl(), /pendla=1/);
});

// ── Laddstopp längs rutten ───────────────────────────────────────

const STOPS_DATA = {
  totalDistanceKm: 398.0, stopsNeeded: 1, carName: 'Generisk elbil',
  stops: [{ order: 1, distanceFromStartKm: 199.0, station: {
    name: 'Ionity Mariestad', address: 'E20', distanceKm: 1.2, lat: 58.7, lon: 13.8,
    maxEffKw: 350, stationKw: 350, connectorType: 'CCS Combo 2 (DC)', operator: 'Ionity',
    usageCost: null, chargepricePerKwh: '~6,96 kr/kWh', connectorCount: 6, ocmId: '99'
  }}]
};

test('bcFetchChargeStops hämtar och visar stopp med station, effekt och pris', async () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse(STOPS_DATA) });
  ctx.bcIsElectric = true;
  ctx.els['bc-dest'].value = 'Stockholm';
  ctx.els['bc-km'].value = '40'; // 400 km — över tröskeln
  ctx.bcRouteStartLat = 57.71; ctx.bcRouteStartLon = 11.97;
  ctx.bcRouteEndLat = 59.33;   ctx.bcRouteEndLon = 18.07;
  ctx.bcFetchChargeStops();
  await tick();
  assert.ok(ctx.fetchLog[0].includes('/api/route-stations?startLat=57.71'));
  assert.ok(ctx.fetchLog[0].includes('rangeKm=400'));
  const html = ctx.els['bc-chargeStops'].innerHTML;
  assert.match(html, /Ionity Mariestad/);
  assert.match(html, /199 km från start/);
  assert.match(html, /350 kW/);
  assert.match(html, /~6,96 kr\/kWh/);
});

test('bcFetchChargeStops hoppar över korta resor och fossilläge', () => {
  const ctx = createEnv({ fetchHandler: () => jsonResponse(STOPS_DATA) });
  ctx.els['bc-dest'].value = 'Stockholm';
  ctx.els['bc-km'].value = '40';
  ctx.bcRouteStartLat = 57.71; ctx.bcRouteStartLon = 11.97;
  ctx.bcRouteEndLat = 59.33;   ctx.bcRouteEndLon = 18.07;
  ctx.bcIsElectric = false; // fossilläge — inga stopp
  ctx.bcFetchChargeStops();
  assert.equal(ctx.fetchLog.length, 0);
  ctx.bcIsElectric = true;
  ctx.els['bc-km'].value = '20'; // 200 km — under tröskeln
  ctx.bcFetchChargeStops();
  assert.equal(ctx.fetchLog.length, 0);
});

test('bcRenderChargeStops döljer rutan när inga stopp behövs', () => {
  const ctx = createEnv();
  ctx.bcRenderChargeStops(STOPS_DATA); // skapa rutan först
  ctx.bcRenderChargeStops({ totalDistanceKm: 100, stopsNeeded: 0, stops: [] });
  assert.equal(ctx.els['bc-chargeStops'].style.display, 'none');
});

// ── Billigaste laddtimmen i hemmaladdnings-hinten ────────────────

test('bcFetchElPrice visar billigaste kommande timmen när den är >10 % billigare', async () => {
  const ctx = createEnv({
    fetchHandler: () => jsonResponse({
      zone: 'SE3', spot: 1.00, _source: 'elprisetjustnu',
      cheapest: { start: new Date().toISOString(), spot: 0.30 }
    })
  });
  ctx.bcIsElectric = true;
  ctx.bcFetchElPrice();
  await tick();
  assert.match(ctx.els['bc-priceHint'].textContent, /billigast kl \d\d:\d\d/);
  assert.match(ctx.els['bc-priceHint'].textContent, /0,30 kr\/kWh spot/);
});

test('bcFetchElPrice visar ingen billigast-tips när skillnaden är liten', async () => {
  const ctx = createEnv({
    fetchHandler: () => jsonResponse({
      zone: 'SE3', spot: 1.00, _source: 'elprisetjustnu',
      cheapest: { start: new Date().toISOString(), spot: 0.95 }
    })
  });
  ctx.bcIsElectric = true;
  ctx.bcFetchElPrice();
  await tick();
  assert.doesNotMatch(ctx.els['bc-priceHint'].textContent, /billigast kl/);
});

// ── bcDoCalculate: hela beräkningskedjan ─────────────────────────

test('bcDoCalculate räknar kostnad, CO₂ och returresa rätt', async () => {
  const ctx = createEnv({
    fetchHandler: url => url.includes('electricity')
      ? jsonResponse({ zone: 'SE3', spot: 1.04 })
      : jsonResponse({ bensin95: 14.87, diesel: 16.87 })
  });
  ctx.store['ca_status'] = 'active'; // hoppa över demo-räknaren
  ctx.bcIsElectric = false; ctx.bcIsDiesel = false;
  ctx.els['bc-km'].value = '61.2';
  ctx.els['bc-returresa'].checked = true;
  ctx.bcDoCalculate(0.85, 14.87);
  await tick();
  // 61,2 × 2 = 122,4 mil → 104,04 l → 1 547,07 kr → 245,5 kg CO₂
  const norm = s => s.replace(/[  ]/g, ' ');
  assert.equal(norm(ctx.els['bc-rMil'].textContent), '122,40');
  assert.equal(norm(ctx.els['bc-rLiters'].textContent), '104,04');
  assert.equal(norm(ctx.els['bc-rCost'].textContent), '1 547,07');
  assert.equal(norm(ctx.els['bc-rCo2'].textContent), '245,5');
  assert.ok(ctx.els['bc-results'].classList.contains('show'));
  assert.ok(ctx.els['bc-shareRow'], 'dela-knappen renderas');
});
