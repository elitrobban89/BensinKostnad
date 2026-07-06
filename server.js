const express = require('express');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Cache 12 timmar – GlobalPetrolPrices uppdaterar varje måndag
let cache   = null;
let cacheTs = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000;

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

app.get('/health', (_, res) => res.json({ status: 'OK' }));

function resetCache() {
  cache   = null;
  cacheTs = 0;
}

if (require.main === module) {
  app.listen(PORT, () => console.log(`Bilresa server körs på port ${PORT}`));
}

module.exports = { app, fetchPrice, fetchPrices, resetCache, FALLBACK };
