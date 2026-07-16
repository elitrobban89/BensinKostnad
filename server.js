const express = require('express');
const path = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// ── Kalkylatorns frontend ──────────────────────────────────────────
// Serveras härifrån så att en git push deployar även JS:et — WordPress-
// sidan laddar <script src="https://bilresa.onrender.com/bensinkostnad.js">
// i stället för ett inklistrat WPCode-snippet. Kort cache: utrullning
// inom 5 min utan att varje sidvisning belastar servern.
app.get('/bensinkostnad.js', (_, res) => {
  res.type('application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.sendFile(path.join(__dirname, 'src', 'bensinkostnad-wpcode.js'));
});

// Cache 12 timmar – GlobalPetrolPrices uppdaterar varje måndag
let cache   = null;
let cacheTs = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000;
// Utan besökare på kalkylatorn förnyas cachen aldrig, så efter 12 h visar
// /health "cold" och UptimeRobots nyckelordsövervakning larmar i onödan.
// 4 h ger tre hämtningsförsök per TTL-fönster — "cold" betyder därmed att
// skrapningen faktiskt är trasig, inte att sidan saknat trafik.
const REWARM_INTERVAL = 4 * 60 * 60 * 1000;

const FALLBACK = { bensin95: 18.90, diesel: 17.50, _source: 'fallback' };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8'
};

async function fetchPrice(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Dagspriset står som "SEK 16.39 per liter or USD 1.69 per liter" i brödtexten.
  // Första "SEK X.XX" på sidan är tioårsGENOMSNITTET (i meta-taggarna) — får inte användas.
  const m = html.match(/SEK\s+(\d+\.\d+)\s+per liter or USD/i);
  if (m) return { value: parseFloat(m[1]), daily: true };
  // Reserv om sidlayouten ändras: första SEK-priset (snittet) är bättre än inget,
  // men flaggas i _source så att en layoutändring inte passerar obemärkt
  const avg = html.match(/SEK\s+(\d+\.\d+)/);
  if (!avg) throw new Error('Hittade inget SEK-pris på sidan');
  return { value: parseFloat(avg[1]), daily: false };
}

async function fetchPrices() {
  const [bensin95, diesel] = await Promise.all([
    fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    fetchPrice('https://www.globalpetrolprices.com/Sweden/diesel_prices/')
  ]);
  const allDaily = bensin95.daily && diesel.daily;
  if (!allDaily) console.warn('OBS: dagsprisraden hittades inte — tioårssnittet används. Kolla sidlayouten!');
  return {
    bensin95: bensin95.value,
    diesel: diesel.value,
    updated: new Date().toISOString().split('T')[0],
    _source: allDaily ? 'globalpetrolprices' : 'globalpetrolprices-average'
  };
}

app.get('/api/fuel-price', async (req, res) => {
  if (cache && Date.now() - cacheTs < CACHE_TTL) {
    return res.json(cache);
  }
  try {
    const data = await fetchPrices();
    cache   = data;
    cacheTs = Date.now();
    console.log('Priser hämtade:', data);
    res.json(data);
  } catch (err) {
    console.warn('Fetch misslyckades, använder fallback:', err.message);
    res.json(FALLBACK);
  }
});

// ── Elpris: spotpris per elområde från elprisetjustnu.se ──────────
// Timpriser — cachas per zon och timme. Datumet i URL:en måste vara
// svensk lokaltid (servern kör UTC; kring midnatt skiljer sig dygnen åt).
const EL_ZONES = ['SE1', 'SE2', 'SE3', 'SE4'];
const EL_FALLBACK_SPOT = 0.80; // SEK/kWh exkl moms, ungefärligt
let elCache = {};

function elPriceUrl(zone, now) {
  const [y, m, d] = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' })
    .format(now).split('-');
  return `https://www.elprisetjustnu.se/api/v1/prices/${y}/${m}-${d}_${zone}.json`;
}

async function fetchDayHours(zone, date) {
  const res = await fetch(elPriceUrl(zone, date), { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchSpotPrice(zone, now = new Date()) {
  const hours = await fetchDayHours(zone, now);
  const t = now.getTime();
  const cur = hours.find(h =>
    new Date(h.time_start).getTime() <= t && t < new Date(h.time_end).getTime());
  if (!cur) throw new Error('Ingen prisrad för aktuell timme');

  // Billigaste kommande timmen — morgondagens fil publiceras ~13:00,
  // saknas den räcker dagens återstående timmar
  let all = hours;
  try {
    all = hours.concat(await fetchDayHours(zone, new Date(t + 24 * 3_600_000)));
  } catch (e) {}
  let cheapest = null;
  for (const h of all) {
    if (new Date(h.time_start).getTime() <= t) continue;
    if (!cheapest || h.SEK_per_kWh < cheapest.SEK_per_kWh) cheapest = h;
  }

  const out = { zone, spot: cur.SEK_per_kWh, updated: cur.time_start, _source: 'elprisetjustnu' };
  if (cheapest) out.cheapest = { start: cheapest.time_start, spot: cheapest.SEK_per_kWh };
  return out;
}

app.get('/api/electricity-price', async (req, res) => {
  const zone = String(req.query.zone || 'SE3').toUpperCase();
  if (!EL_ZONES.includes(zone)) {
    return res.status(400).json({ error: 'Ogiltig zon — använd SE1, SE2, SE3 eller SE4' });
  }
  const hourKey = new Date().toISOString().slice(0, 13);
  const hit = elCache[zone];
  if (hit && hit.hourKey === hourKey) return res.json(hit.data);
  try {
    const data = await fetchSpotPrice(zone);
    elCache[zone] = { hourKey, data };
    res.json(data);
  } catch (err) {
    console.warn('Elprishämtning misslyckades, använder fallback:', err.message);
    res.json({ zone, spot: EL_FALLBACK_SPOT, _source: 'fallback' });
  }
});

// priceCache: 'warm'/'cold' — UptimeRobot-nyckelordsövervakning kan larma
// om skrapningen slutat fungera, inte bara om servern är nere
app.get('/health', (_, res) => res.json({
  status: 'OK',
  priceCache: cache && Date.now() - cacheTs < CACHE_TTL ? 'warm' : 'cold'
}));

function resetCache() {
  cache   = null;
  cacheTs = 0;
  elCache = {};
}

// Förvärm cachen vid start så första anropet efter en deploy/omstart
// inte behöver vänta på skrapningen
async function warmUpCache() {
  try {
    cache   = await fetchPrices();
    cacheTs = Date.now();
    console.log('Priscache förvärmd:', cache);
  } catch (err) {
    console.warn('Förvärmning misslyckades, hämtas vid första anropet:', err.message);
  }
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`Bilresa server körs på port ${PORT}`));
  warmUpCache();
  setInterval(warmUpCache, REWARM_INTERVAL);
}

module.exports = { app, fetchPrice, fetchPrices, fetchSpotPrice, resetCache, warmUpCache, FALLBACK, EL_FALLBACK_SPOT, CACHE_TTL, REWARM_INTERVAL };
