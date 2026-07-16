const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { app, fetchPrice, resetCache, warmUpCache, FALLBACK, EL_FALLBACK_SPOT, CACHE_TTL, REWARM_INTERVAL } = require('./server');

// Utdrag ur en riktig GlobalPetrolPrices-sida: första SEK-priset (meta/snitt)
// får INTE användas — dagspriset är det som följs av "or USD".
const PAGE_HTML = `
  <meta content="Bensinpriser: Vi visar priserna för Sverige från ... SEK 17.81 ...">
  <p>Bensinpriser: Genomsnittspriset är SEK 16.39 per liter or USD 1.69 per liter.</p>
`;

const AVG_ONLY_HTML = '<meta content="... SEK 17.81 ..."><p>ingen dagsrad här</p>';

function fakeResponse(html, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => html };
}

function fakeJsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

// Timprislista från elprisetjustnu.se där en rad täcker "nu"
function elHours(spotNow = 0.52) {
  const now = Date.now();
  const hourStart = Math.floor(now / 3_600_000) * 3_600_000;
  return [-1, 0, 1].map(offset => ({
    SEK_per_kWh: offset === 0 ? spotNow : 9.99,
    time_start: new Date(hourStart + offset * 3_600_000).toISOString(),
    time_end: new Date(hourStart + (offset + 1) * 3_600_000).toISOString()
  }));
}

// Mockar global fetch för externa pris-URL:er men släpper igenom
// anrop till den lokala testservern.
const realFetch = globalThis.fetch;
let priceHandler;
let elHandler;

beforeEach(() => {
  resetCache();
  priceHandler = null;
  elHandler = null;
  globalThis.fetch = (url, opts) => {
    if (String(url).includes('globalpetrolprices.com')) {
      if (!priceHandler) throw new Error('Testet satte ingen priceHandler');
      return Promise.resolve(priceHandler(String(url)));
    }
    if (String(url).includes('elprisetjustnu.se')) {
      if (!elHandler) throw new Error('Testet satte ingen elHandler');
      return Promise.resolve(elHandler(String(url)));
    }
    return realFetch(url, opts);
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

// Kör en request mot appen på en efemär port och stäng servern efteråt.
async function get(path) {
  const server = app.listen(0);
  try {
    const port = server.address().port;
    const res = await realFetch(`http://127.0.0.1:${port}${path}`);
    return { status: res.status, headers: res.headers, body: await res.json() };
  } finally {
    server.close();
  }
}

// --- fetchPrice: regexparsning ---

test('fetchPrice läser dagspriset, inte tioårssnittet i meta-taggen', async () => {
  priceHandler = () => fakeResponse(PAGE_HTML);
  assert.deepEqual(
    await fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    { value: 16.39, daily: true });
});

test('fetchPrice tar första SEK-priset som reserv om dagsraden saknas', async () => {
  priceHandler = () => fakeResponse(AVG_ONLY_HTML);
  assert.deepEqual(
    await fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    { value: 17.81, daily: false });
});

test('fetchPrice kastar när sidan saknar SEK-pris', async () => {
  priceHandler = () => fakeResponse('<html>inget pris alls</html>');
  await assert.rejects(
    fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    /Hittade inget SEK-pris/
  );
});

test('fetchPrice kastar vid HTTP-fel', async () => {
  priceHandler = () => fakeResponse('', 503);
  await assert.rejects(
    fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    /HTTP 503/
  );
});

// --- /api/fuel-price: lyckat svar, cache och fallback ---

test('/api/fuel-price returnerar bensin och diesel från källan', async () => {
  priceHandler = (url) => fakeResponse(url.includes('diesel')
    ? PAGE_HTML.replace('16.39', '15.85')
    : PAGE_HTML);
  const { status, body } = await get('/api/fuel-price');
  assert.equal(status, 200);
  assert.equal(body.bensin95, 16.39);
  assert.equal(body.diesel, 15.85);
  assert.equal(body._source, 'globalpetrolprices');
  assert.match(body.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test('/api/fuel-price svarar ur cachen vid andra anropet', async () => {
  let calls = 0;
  priceHandler = () => { calls++; return fakeResponse(PAGE_HTML); };
  await get('/api/fuel-price');
  assert.equal(calls, 2); // bensin + diesel
  const { body } = await get('/api/fuel-price');
  assert.equal(calls, 2); // inga nya hämtningar
  assert.equal(body.bensin95, 16.39);
});

test('/api/fuel-price flaggar i _source när reservpriset (snittet) används', async () => {
  priceHandler = () => fakeResponse(AVG_ONLY_HTML);
  const { body } = await get('/api/fuel-price');
  assert.equal(body._source, 'globalpetrolprices-average');
  assert.equal(body.bensin95, 17.81);
});

test('/api/fuel-price faller tillbaka på fasta priser när källan fallerar', async () => {
  priceHandler = () => { throw new Error('nätverksfel'); };
  const { status, body } = await get('/api/fuel-price');
  assert.equal(status, 200);
  assert.deepEqual(body, FALLBACK);
});

test('misslyckad hämtning cachas inte — nästa anrop försöker igen', async () => {
  priceHandler = () => { throw new Error('nätverksfel'); };
  await get('/api/fuel-price');
  priceHandler = () => fakeResponse(PAGE_HTML);
  const { body } = await get('/api/fuel-price');
  assert.equal(body._source, 'globalpetrolprices');
});

// --- /api/electricity-price: spotpris per elområde ---

test('/api/electricity-price returnerar spotpriset för aktuell timme (SE3 default)', async () => {
  elHandler = (url) => {
    assert.match(url, /\/\d{4}\/\d{2}-\d{2}_SE3\.json$/);
    return fakeJsonResponse(elHours(0.52));
  };
  const { status, body } = await get('/api/electricity-price');
  assert.equal(status, 200);
  assert.equal(body.zone, 'SE3');
  assert.equal(body.spot, 0.52);
  assert.equal(body._source, 'elprisetjustnu');
});

test('/api/electricity-price hämtar rätt zon och gemener normaliseras', async () => {
  elHandler = (url) => {
    assert.match(url, /_SE1\.json$/);
    return fakeJsonResponse(elHours(1.10));
  };
  const { body } = await get('/api/electricity-price?zone=se1');
  assert.equal(body.zone, 'SE1');
  assert.equal(body.spot, 1.10);
});

test('/api/electricity-price avvisar ogiltig zon med 400', async () => {
  const { status, body } = await get('/api/electricity-price?zone=SE9');
  assert.equal(status, 400);
  assert.match(body.error, /Ogiltig zon/);
});

test('/api/electricity-price cachar per zon och timme', async () => {
  let calls = 0;
  elHandler = () => { calls++; return fakeJsonResponse(elHours(0.52)); };
  await get('/api/electricity-price?zone=SE3');
  await get('/api/electricity-price?zone=SE3');
  assert.equal(calls, 2); // dagens + morgondagens fil; andra anropet ur cachen
  await get('/api/electricity-price?zone=SE4');
  assert.equal(calls, 4); // annan zon hämtar separat
});

// Timrader med valfria (timoffset, pris)-par relativt aktuell timme
function elRows(spec) {
  const hourStart = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  return spec.map(([offset, price]) => ({
    SEK_per_kWh: price,
    time_start: new Date(hourStart + offset * 3_600_000).toISOString(),
    time_end: new Date(hourStart + (offset + 1) * 3_600_000).toISOString()
  }));
}

test('fetchSpotPrice hittar billigaste kommande timmen över dygnsgränsen', async () => {
  const { fetchSpotPrice } = require('./server');
  let call = 0;
  elHandler = () => {
    call++;
    return call === 1
      ? fakeJsonResponse(elRows([[-1, 9.99], [0, 1.00], [1, 0.80], [2, 0.55]]))
      : fakeJsonResponse(elRows([[26, 0.15]])); // morgondagens natt-timme är billigast
  };
  const data = await fetchSpotPrice('SE3');
  assert.equal(data.spot, 1.00);
  assert.equal(data.cheapest.spot, 0.15);
});

test('fetchSpotPrice klarar att morgondagens fil saknas', async () => {
  const { fetchSpotPrice } = require('./server');
  let call = 0;
  elHandler = () => {
    call++;
    return call === 1
      ? fakeJsonResponse(elRows([[0, 0.52], [1, 0.44]]))
      : fakeJsonResponse({ error: 'not found' }, 404);
  };
  const data = await fetchSpotPrice('SE3');
  assert.equal(data.spot, 0.52);
  assert.equal(data.cheapest.spot, 0.44); // dagens återstående timmar räcker
});

// --- /bensinkostnad.js: Render-serverad kalkylator-frontend ---

test('/bensinkostnad.js serveras med JS-content-type och kort cache', async () => {
  const server = app.listen(0);
  try {
    const port = server.address().port;
    const res = await realFetch(`http://127.0.0.1:${port}/bensinkostnad.js`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /javascript/);
    assert.match(res.headers.get('cache-control'), /max-age=300/);
    const text = await res.text();
    assert.ok(text.includes('bcFetchFastPrice'), 'innehåller kalkylatorkoden');
  } finally {
    server.close();
  }
});

test('/api/electricity-price faller tillbaka på fast pris när källan fallerar', async () => {
  elHandler = () => { throw new Error('nätverksfel'); };
  const { status, body } = await get('/api/electricity-price');
  assert.equal(status, 200);
  assert.equal(body.spot, EL_FALLBACK_SPOT);
  assert.equal(body._source, 'fallback');
});

test('/api/electricity-price faller tillbaka när ingen rad täcker aktuell timme', async () => {
  elHandler = () => fakeJsonResponse([]);
  const { body } = await get('/api/electricity-price');
  assert.equal(body._source, 'fallback');
});

// --- övrigt ---

test('/health svarar OK och CORS-headern är satt', async () => {
  const { status, headers, body } = await get('/health');
  assert.equal(status, 200);
  assert.deepEqual(body, { status: 'OK', priceCache: 'cold' });
  assert.equal(headers.get('access-control-allow-origin'), '*');
});

test('/health rapporterar warm när priscachen är fylld', async () => {
  priceHandler = () => fakeResponse(PAGE_HTML);
  await get('/api/fuel-price');
  const { body } = await get('/health');
  assert.equal(body.priceCache, 'warm');
});

// --- warmUpCache: förvärmning vid serverstart ---

test('warmUpCache fyller cachen så första anropet inte hämtar', async () => {
  let calls = 0;
  priceHandler = () => { calls++; return fakeResponse(PAGE_HTML); };
  await warmUpCache();
  assert.equal(calls, 2); // bensin + diesel
  const { body } = await get('/api/fuel-price');
  assert.equal(calls, 2); // ingen ny hämtning — svar ur förvärmd cache
  assert.equal(body.bensin95, 16.39);
});

test('omvärmningsintervallet ger flera försök innan cachen kallnar', () => {
  // Minst två intervall måste rymmas i TTL-fönstret — annars räcker ett
  // enda misslyckat försök för att /health ska visa cold och larma falskt
  assert.ok(REWARM_INTERVAL * 2 < CACHE_TTL);
});

test('warmUpCache sväljer fel — servern startar ändå och nästa anrop hämtar', async () => {
  priceHandler = () => { throw new Error('nätverksfel'); };
  await warmUpCache(); // får inte kasta
  priceHandler = () => fakeResponse(PAGE_HTML);
  const { body } = await get('/api/fuel-price');
  assert.equal(body._source, 'globalpetrolprices');
});
