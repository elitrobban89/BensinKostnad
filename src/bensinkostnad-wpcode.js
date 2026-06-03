// ═══════════════════════════════════════════════════════
//  BENSINKOSTNAD – WPCode JavaScript Snippet
//  Klistra in detta i WPCode → JavaScript Snippet
// ═══════════════════════════════════════════════════════

// ── Global state ─────────────────────────────────────
var bcStartLat = null, bcStartLon = null, bcMap = null, bcRouteLayer = null;

// ── Bildata: förbrukning i l/10km (null = elbil) ─────
var BC_CAR_DB = {
  "Audi":           { "A1":0.60,"A3":0.65,"A4":0.75,"A5":0.80,"A6":0.85,"A7":0.90,"A8":1.10,"Q2":0.65,"Q3":0.75,"Q5":0.90,"Q7":1.10,"Q8":1.20,"TT":0.80,"e-tron (el)":null },
  "BMW":            { "1-serie":0.65,"2-serie":0.70,"3-serie":0.75,"4-serie":0.80,"5-serie":0.85,"7-serie":1.15,"X1":0.75,"X2":0.75,"X3":0.85,"X4":0.90,"X5":1.05,"X6":1.15,"X7":1.30,"iX (el)":null,"i4 (el)":null },
  "Citroën":        { "C1":0.48,"C3":0.58,"C4":0.65,"C5":0.75,"C3 Aircross":0.68,"C5 Aircross":0.80,"Berlingo":0.75 },
  "Dacia":          { "Sandero":0.58,"Duster":0.75,"Logan":0.60,"Jogger":0.70 },
  "Fiat":           { "500":0.52,"Punto":0.60,"Tipo":0.65,"500X":0.70,"Panda":0.50 },
  "Ford":           { "Fiesta":0.55,"Focus":0.65,"Mondeo":0.80,"Mustang":1.25,"Kuga":0.80,"Explorer":1.20,"Puma":0.60,"EcoSport":0.70 },
  "Honda":          { "Jazz":0.55,"Civic":0.65,"Accord":0.75,"CR-V":0.80,"HR-V":0.70,"e (el)":null },
  "Hyundai":        { "i10":0.50,"i20":0.58,"i30":0.65,"i40":0.75,"Tucson":0.80,"Santa Fe":0.95,"Kona":0.70,"IONIQ 5 (el)":null,"IONIQ 6 (el)":null },
  "Jeep":           { "Renegade":0.75,"Compass":0.80,"Cherokee":0.95,"Grand Cherokee":1.15,"Wrangler":1.25 },
  "Kia":            { "Picanto":0.50,"Rio":0.58,"Ceed":0.65,"Sportage":0.80,"Sorento":1.00,"Niro":0.70,"EV6 (el)":null },
  "Mazda":          { "Mazda 2":0.50,"Mazda 3":0.65,"Mazda 6":0.75,"CX-3":0.68,"CX-5":0.80,"CX-60":0.85,"MX-5":0.68 },
  "Mercedes-Benz":  { "A-Klass":0.65,"B-Klass":0.70,"C-Klass":0.75,"E-Klass":0.85,"S-Klass":1.20,"CLA":0.70,"GLA":0.75,"GLB":0.80,"GLC":0.90,"GLE":1.10,"GLS":1.30,"EQA (el)":null,"EQC (el)":null },
  "Mini":           { "Cooper":0.65,"Clubman":0.70,"Countryman":0.75,"Cooper S":0.75 },
  "Mitsubishi":     { "Colt":0.55,"Lancer":0.70,"Outlander":0.90,"Eclipse Cross":0.85,"L200":0.95 },
  "Nissan":         { "Micra":0.55,"Juke":0.70,"Qashqai":0.75,"X-Trail":0.85,"Leaf (el)":null,"Ariya (el)":null },
  "Opel":           { "Corsa":0.55,"Astra":0.65,"Insignia":0.80,"Mokka":0.70,"Grandland X":0.85,"Crossland":0.70 },
  "Peugeot":        { "108":0.48,"208":0.55,"308":0.65,"508":0.80,"2008":0.65,"3008":0.75,"5008":0.85 },
  "Renault":        { "Twingo":0.50,"Clio":0.55,"Megane":0.65,"Talisman":0.80,"Kadjar":0.75,"Captur":0.65,"Koleos":0.90,"Zoe (el)":null },
  "Saab":           { "9-3":0.80,"9-5":0.95 },
  "SEAT":           { "Ibiza":0.55,"Leon":0.65,"Ateca":0.75,"Arona":0.65,"Tarraco":0.90 },
  "Skoda":          { "Fabia":0.55,"Octavia":0.70,"Superb":0.80,"Scala":0.65,"Kamiq":0.70,"Karoq":0.80,"Kodiaq":0.90,"Enyaq (el)":null },
  "Subaru":         { "Impreza":0.75,"Legacy":0.85,"Outback":0.95,"Forester":0.90,"XV":0.80,"BRZ":0.85,"WRX":1.00 },
  "Suzuki":         { "Alto":0.45,"Swift":0.55,"Baleno":0.60,"Vitara":0.70,"SX4 S-Cross":0.75,"Jimny":0.80,"Ignis":0.58 },
  "Toyota":         { "Aygo":0.45,"Yaris":0.50,"Corolla":0.60,"Camry":0.75,"Avensis":0.75,"RAV4":0.75,"Land Cruiser":1.20,"C-HR":0.65,"Prius":0.45,"bZ4X (el)":null },
  "Volkswagen":     { "Polo":0.55,"Golf":0.65,"Jetta":0.70,"Passat":0.75,"Arteon":0.85,"Touareg":1.05,"Tiguan":0.80,"T-Roc":0.75,"T-Cross":0.65,"ID.4 (el)":null,"ID.3 (el)":null },
  "Volvo":          { "V40":0.65,"V60":0.75,"V70":0.80,"V90":0.80,"S60":0.70,"S80":0.90,"S90":0.85,"XC40":0.75,"XC60":0.85,"XC70":0.95,"XC90":1.05,"C30":0.60,"C70":0.80,"XC40 Recharge (el)":null,"XC90 Recharge":0.30 }
};

// ── Dropdown: märken ──────────────────────────────────
function bcInitBrands() {
  var sel = document.getElementById('bc-brand');
  if (!sel) return;
  Object.keys(BC_CAR_DB).sort().forEach(function(b) {
    var o = document.createElement('option');
    o.value = o.textContent = b;
    sel.appendChild(o);
  });
}

function bcOnBrandChange() {
  var brand = document.getElementById('bc-brand').value;
  var modelSel = document.getElementById('bc-model');
  modelSel.innerHTML = '<option value="">Välj modell...</option>';
  document.getElementById('bc-cons').value = '';
  document.getElementById('bc-cons').placeholder = 't.ex. 0.85';
  if (!brand) { modelSel.disabled = true; return; }
  Object.keys(BC_CAR_DB[brand]).sort().forEach(function(m) {
    var o = document.createElement('option');
    o.value = o.textContent = m;
    modelSel.appendChild(o);
  });
  modelSel.disabled = false;
}

function bcOnModelChange() {
  var brand = document.getElementById('bc-brand').value;
  var model = document.getElementById('bc-model').value;
  if (!brand || !model) return;
  var val = BC_CAR_DB[brand][model];
  var field = document.getElementById('bc-cons');
  if (val === null) {
    field.value = '';
    field.placeholder = 'Elbil – ange kWh/10km om du vill';
  } else {
    field.value = val;
  }
}

// ── GPS ───────────────────────────────────────────────
function bcFetchGPS() {
  try {
    if (!navigator.geolocation) {
      bcSetGpsHint('⚠️ GPS stöds inte av din webbläsare. Ange startort manuellt.', 'error');
      return;
    }
    var btn = document.getElementById('bc-gpsBtn');
    if (btn) { btn.disabled = true; btn.classList.add('bc-fetching'); }
    var lbl = document.getElementById('bc-gpsBtnLabel');
    if (lbl) lbl.textContent = 'Hämtar...';
    bcSetGpsHint('📡 Hämtar position — godkänn platsdelning om du tillfrågas...', 'loading');

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        bcStartLat = pos.coords.latitude;
        bcStartLon = pos.coords.longitude;
        fetch(
          'https://nominatim.openstreetmap.org/reverse?lat=' + bcStartLat +
          '&lon=' + bcStartLon + '&format=json&accept-language=sv'
        )
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var a = data.address || {};
          var road = a.road || a.pedestrian || a.footway || '';
          var num  = a.house_number ? ' ' + a.house_number : '';
          var city = a.city || a.town || a.village || a.municipality || a.county || '';
          var fullAddr = road ? (road + num + (city ? ', ' + city : '')) : city;
          var startEl = document.getElementById('bc-start');
          if (startEl) startEl.value = fullAddr;
          bcSetGpsHint('', '');
          if (btn) { btn.disabled = false; btn.classList.remove('bc-fetching'); }
          var lbl3 = document.getElementById('bc-gpsBtnLabel');
          if (lbl3) lbl3.textContent = 'Hämta GPS';
          // Auto-rutt om destination redan är ifylld
          bcAutoRoute();
        })
        .catch(function() {
          bcSetGpsHint('⚠️ Kunde inte hämta ortnamn. Ange startort manuellt.', 'error');
          if (btn) { btn.disabled = false; btn.classList.remove('bc-fetching'); }
          var lbl4 = document.getElementById('bc-gpsBtnLabel');
          if (lbl4) lbl4.textContent = 'Försök igen';
        });
      },
      function(err) {
        var errText = {
          1: '🔒 Åtkomst nekad. Tillåt platsdelning i webbläsarens inställningar.',
          2: '📵 Position ej tillgänglig. Kontrollera att GPS är påslaget.',
          3: '⏱ Timeout. Tryck igen eller ange startort manuellt.'
        };
        bcSetGpsHint(errText[err.code] || '❌ GPS-fel (kod ' + err.code + ').', 'error');
        if (btn) { btn.disabled = false; btn.classList.remove('bc-fetching'); }
        var lbl2 = document.getElementById('bc-gpsBtnLabel');
        if (lbl2) lbl2.textContent = 'Försök igen';
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  } catch(e) {
    bcSetGpsHint('❌ GPS-fel: ' + e.message, 'error');
  }
}

function bcSetGpsHint(msg, type) {
  var el = document.getElementById('bc-gpsHint');
  if (!el) return;
  el.textContent = msg;
  el.className = 'bc-hint' + (type ? ' bc-' + type : '');
}

// ── Auto-rutt (triggas när start eller destination lämnas) ───
function bcAutoRoute() {
  var destEl  = document.getElementById('bc-dest');
  var startEl = document.getElementById('bc-start');
  if (!destEl) return;
  var destVal  = destEl.value.trim();
  var startVal = startEl ? startEl.value.trim() : '';

  // Behöver destination + antingen GPS-koordinater eller en startadress
  if (!destVal || (!startVal && bcStartLat === null)) return;

  bcSetCalcStatus('🗺 Beräknar rutt...');

  // Hämta startkoordinater — GPS om tillgängligt, annars geocoda adressen
  var startPromise = (bcStartLat !== null)
    ? Promise.resolve({ lat: bcStartLat, lon: bcStartLon })
    : bcGeocodeAddress(startVal);

  startPromise
    .then(function(start) {
      return bcGeocodeAddress(destVal)
        .then(function(end) {
          return bcFetchRoute(start.lon, start.lat, end.lon, end.lat)
            .then(function(route) {
              var kmEl = document.getElementById('bc-km');
              if (kmEl) kmEl.value = parseFloat((route.distanceKm / 10).toFixed(1));
              bcShowMapRoute(
                start.lat, start.lon, end.lat, end.lon,
                route.coordinates,
                startVal || 'Start',
                destVal
              );
              bcSetCalcStatus('');
              var mapCard = document.getElementById('bc-mapCard');
              if (mapCard) mapCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });
    })
    .catch(function(e) {
      bcSetCalcStatus('⚠️ ' + e.message);
    });
}

// ── Geocoding & routing ───────────────────────────────
function bcGeocodeAddress(query) {
  return fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=1&accept-language=sv')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.length) throw new Error('Hittade inte "' + query + '" — kontrollera stavningen.');
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    });
}

function bcFetchRoute(sLon, sLat, eLon, eLat) {
  return fetch('https://router.project-osrm.org/route/v1/driving/' + sLon + ',' + sLat + ';' + eLon + ',' + eLat + '?overview=full&geometries=geojson')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.code !== 'Ok') throw new Error('Kunde inte beräkna rutt.');
      return {
        distanceKm: data.routes[0].distance / 1000,
        coordinates: data.routes[0].geometry.coordinates
      };
    });
}

function bcShowMapRoute(sLat, sLon, eLat, eLon, routeCoords, startName, endName) {
  var card = document.getElementById('bc-mapCard');
  if (card) card.classList.add('bc-show');

  if (!bcMap) {
    bcMap = L.map('bc-map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(bcMap);
  } else {
    if (bcRouteLayer) bcMap.removeLayer(bcRouteLayer);
    bcMap.eachLayer(function(l) { if (l instanceof L.Marker) bcMap.removeLayer(l); });
  }

  var latLngs = routeCoords.map(function(c) { return [c[1], c[0]]; });
  bcRouteLayer = L.polyline(latLngs, { color: '#6366f1', weight: 5, opacity: 0.85 }).addTo(bcMap);

  var pinA = L.divIcon({ className: '', html: '<div style="background:#059669;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">A</div>', iconSize:[28,28], iconAnchor:[14,14] });
  var pinB = L.divIcon({ className: '', html: '<div style="background:#dc2626;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">B</div>', iconSize:[28,28], iconAnchor:[14,14] });

  L.marker([sLat, sLon], { icon: pinA }).addTo(bcMap).bindPopup('<b>Start:</b> ' + startName);
  L.marker([eLat, eLon], { icon: pinB }).addTo(bcMap).bindPopup('<b>Destination:</b> ' + endName);

  bcMap.fitBounds(bcRouteLayer.getBounds(), { padding: [24, 24] });
}

// ── Hjälpfunktioner ───────────────────────────────────
function bcShowError(msg) {
  var el = document.getElementById('bc-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('bc-show');
}
function bcClearError() {
  var el = document.getElementById('bc-error');
  if (el) el.classList.remove('bc-show');
}
function bcSetCalcStatus(msg) {
  var el = document.getElementById('bc-calcStatus');
  if (el) el.textContent = msg;
}
function bcFmt(n, d) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function bcTrace(id, text, val) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<span class="bc-tarrow">→</span> ' + text + ' <span class="bc-tval">' + val + '</span>';
}

// ── Count-up animation ────────────────────────────────
function bcCountUp(id, endVal, decimals) {
  var el = document.getElementById(id);
  if (!el) return;
  var startTime = null;
  var duration = 900;
  function step(ts) {
    if (!startTime) startTime = ts;
    var p = Math.min((ts - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = bcFmt(endVal * ease, decimals);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = bcFmt(endVal, decimals);
  }
  requestAnimationFrame(step);
}

// ── Beräkning ─────────────────────────────────────────
function bcCalculate() {
  bcClearError();
  bcSetCalcStatus('');
  document.getElementById('bc-results').classList.remove('bc-show');

  var dest = document.getElementById('bc-dest').value.trim();
  var cons = parseFloat(document.getElementById('bc-cons').value);
  var pris = parseFloat(document.getElementById('bc-price').value);
  var btn  = document.getElementById('bc-calcBtn');

  if (isNaN(cons) || cons <= 0) {
    bcShowError('Ange en giltig förbrukning i l/10km (t.ex. 0.85).');
    return;
  }
  if (isNaN(pris) || pris <= 0) {
    bcShowError('Ange ett giltigt bränslepris i SEK (t.ex. 19.50).');
    return;
  }

  var startVal = document.getElementById('bc-start') ? document.getElementById('bc-start').value.trim() : '';

  if (dest && (bcStartLat !== null || startVal)) {
    if (btn) { btn.disabled = true; btn.textContent = 'Beräknar rutt...'; }
    bcSetCalcStatus('🔍 Söker adresser...');

    var startPromise2 = (bcStartLat !== null)
      ? Promise.resolve({ lat: bcStartLat, lon: bcStartLon })
      : bcGeocodeAddress(startVal);

    startPromise2
      .then(function(start) {
        bcSetCalcStatus('🗺 Ritar rutt...');
        return bcGeocodeAddress(dest)
          .then(function(end) {
            return bcFetchRoute(start.lon, start.lat, end.lon, end.lat)
              .then(function(route) {
                document.getElementById('bc-km').value = parseFloat((route.distanceKm / 10).toFixed(1));
                bcShowMapRoute(start.lat, start.lon, end.lat, end.lon, route.coordinates,
                  startVal || 'Start', dest);
                bcSetCalcStatus('');
              });
          });
      })
      .catch(function(e) {
        bcSetCalcStatus('⚠️ ' + e.message + ' Använder manuellt angiven sträcka.');
      })
      .finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'Räkna ut kostnaden'; }
        bcDoCalculate(cons, pris);
      });
  } else {
    bcDoCalculate(cons, pris);
  }
}

function bcDoCalculate(cons, pris) {
  var mil = parseFloat(document.getElementById('bc-km').value);
  if (isNaN(mil) || mil <= 0) {
    bcShowError('Ange en körsträcka i mil, eller fyll i destination och aktivera GPS för automatisk beräkning.');
    return;
  }
  var km      = mil * 10;
  var liter   = mil * cons;
  var kostnad = liter * pris;

  bcCountUp('bc-rKm',     km,      1);
  bcCountUp('bc-rMil',    mil,     2);
  bcCountUp('bc-rLiters', liter,   2);
  bcCountUp('bc-rCost',   kostnad, 2);

  bcTrace('bc-t1', bcFmt(mil,2) + ' mil = ', bcFmt(km,1) + ' km');
  bcTrace('bc-t2', bcFmt(mil,2) + ' mil × ' + bcFmt(cons,2) + ' l/10km =', bcFmt(liter,2) + ' liter');
  bcTrace('bc-t3', bcFmt(liter,2) + ' l × ' + bcFmt(pris,2) + ' SEK/l =', bcFmt(kostnad,2) + ' SEK');
  bcTrace('bc-t4', 'Kostnad per mil:', bcFmt(kostnad / mil, 2) + ' SEK/mil');

  document.getElementById('bc-results').classList.add('bc-show');
  document.getElementById('bc-mapCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Event wiring ──────────────────────────────────────
function bcWireEvents() {
  bcInitBrands();

  var gpsBtn  = document.getElementById('bc-gpsBtn');
  var calcBtn = document.getElementById('bc-calcBtn');
  var brand   = document.getElementById('bc-brand');
  var model   = document.getElementById('bc-model');
  var dest    = document.getElementById('bc-dest');

  var start   = document.getElementById('bc-start');

  if (gpsBtn)  gpsBtn.addEventListener('click', bcFetchGPS);
  if (brand)   brand.addEventListener('change', bcOnBrandChange);
  if (model)   model.addEventListener('change', bcOnModelChange);
  if (dest)    dest.addEventListener('blur',  bcAutoRoute);
  if (start)   start.addEventListener('blur',  bcAutoRoute);
  // Rensa GPS-koordinater om användaren ändrar startadressen manuellt
  if (start)   start.addEventListener('input', function() {
    bcStartLat = null;
    bcStartLon = null;
  });

  if (calcBtn) calcBtn.addEventListener('click', function(e) {
    var r = document.createElement('span');
    r.className = 'bc-ripple';
    var rect = calcBtn.getBoundingClientRect();
    r.style.left = (e.clientX - rect.left) + 'px';
    r.style.top  = (e.clientY - rect.top)  + 'px';
    calcBtn.appendChild(r);
    setTimeout(function() { r.remove(); }, 700);
    bcCalculate();
  });

  // Event delegation som backup
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.id === 'bc-gpsBtn')  { bcFetchGPS();  break; }
      if (el.id === 'bc-calcBtn') { bcCalculate(); break; }
      el = el.parentNode;
    }
  });
  document.addEventListener('change', function(e) {
    if (e.target.id === 'bc-brand') bcOnBrandChange();
    if (e.target.id === 'bc-model') bcOnModelChange();
  });
}

// ── Starta när DOM är redo ────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bcWireEvents);
} else {
  bcWireEvents();
}
