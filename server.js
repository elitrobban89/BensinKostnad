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
  // Plockar ut första "SEK XX.XX" på sidan = aktuellt veckopris
  const m = html.match(/SEK\s+(\d+\.\d+)/);
  if (!m) throw new Error('Hittade inget SEK-pris på sidan');
  return parseFloat(m[1]);
}

async function fetchPrices() {
  const [bensin95, diesel] = await Promise.all([
    fetchPrice('https://www.globalpetrolprices.com/Sweden/gasoline_prices/'),
    fetchPrice('https://www.globalpetrolprices.com/Sweden/diesel_prices/')
  ]);
  return {
    bensin95,
    diesel,
    updated: new Date().toISOString().split('T')[0],
    _source: 'globalpetrolprices'
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

app.listen(PORT, () => console.log(`Bilresa server körs på port ${PORT}`));
