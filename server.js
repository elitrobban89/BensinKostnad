const express = require('express');
const cheerio = require('cheerio');

const app  = express();
const PORT = process.env.PORT || 3000;

// Tillåt anrop från WordPress-sidan
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Cache: 6 timmar (SPBI uppdaterar veckovis)
let cache   = null;
let cacheTs = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

// Fallback om scraping misslyckas (uppdateras manuellt vid behov)
const FALLBACK = { bensin95: 18.90, diesel: 17.50, _source: 'fallback' };

async function fetchSpbiPrices() {
  const res = await fetch('https://spbi.se/statistik/priser/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BilresaBot/1.0; +https://bilresa.onrender.com)' },
    signal: AbortSignal.timeout(12_000)
  });
  if (!res.ok) throw new Error(`SPBI HTTP ${res.status}`);
  const html = await res.text();
  const $    = cheerio.load(html);

  let bensin95 = null;
  let diesel   = null;

  // Strategi 1: leta i tabellrader efter bensin/diesel + pris
  $('tr').each((_, row) => {
    const text  = $(row).text();
    const lower = text.toLowerCase();
    // Pris i formatet "18,90" eller "18.90"
    const m = text.match(/\b(1[5-9]|2[0-5])[,.](\d{2})\b/);
    if (!m) return;
    const price = parseFloat(m[1] + '.' + m[2]);
    if (lower.includes('bensin') || lower.includes('95-oktan') || lower.includes('blyfri')) {
      if (!bensin95) bensin95 = price;
    }
    if (lower.includes('diesel') || lower.includes('mk1')) {
      if (!diesel) diesel = price;
    }
  });

  // Strategi 2: om tabeller inte matchade, sök i brödtexten efter prisblock
  if (!bensin95 || !diesel) {
    const bodyText = $('body').text();
    const blocks   = bodyText.split(/\n/).map(s => s.trim()).filter(Boolean);
    for (const line of blocks) {
      const lower = line.toLowerCase();
      const m     = line.match(/\b(1[5-9]|2[0-5])[,.](\d{2})\b/);
      if (!m) continue;
      const price = parseFloat(m[1] + '.' + m[2]);
      if (!bensin95 && (lower.includes('bensin') || lower.includes('95'))) bensin95 = price;
      if (!diesel   &&  lower.includes('diesel'))                           diesel   = price;
    }
  }

  if (!bensin95 || !diesel) throw new Error('Kunde inte tolka priser från SPBI');

  return {
    bensin95,
    diesel,
    updated: new Date().toISOString().split('T')[0],
    _source: 'spbi'
  };
}

app.get('/api/fuel-price', async (req, res) => {
  if (cache && Date.now() - cacheTs < CACHE_TTL) {
    return res.json(cache);
  }
  try {
    const data = await fetchSpbiPrices();
    cache   = data;
    cacheTs = Date.now();
    console.log('Fuel prices updated from SPBI:', data);
    res.json(data);
  } catch (err) {
    console.warn('SPBI fetch failed, using fallback:', err.message);
    res.json(FALLBACK);
  }
});

app.get('/health', (_, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => console.log(`Bilresa server körs på port ${PORT}`));
