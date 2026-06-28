const express = require('express');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Cache 6 timmar – SCB publicerar månadsdata
let cache   = null;
let cacheTs = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

// Uppdateras om SCB-anropet misslyckas
const FALLBACK = { bensin95: 18.90, diesel: 17.50, _source: 'fallback' };

// SCB:s öppna API – pumppris på drivmedel (konsumentpris i SEK/liter)
const SCB_URL = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101E/DrivmedelM';

async function fetchScbPrices() {
  // Hämta variabelkoder från SCB-tabellens metadata
  const metaRes = await fetch(SCB_URL, { signal: AbortSignal.timeout(12_000) });
  if (!metaRes.ok) throw new Error(`SCB metadata HTTP ${metaRes.status}`);
  const meta = await metaRes.json();

  const drivVar = meta.variables?.find(v => v.code === 'Drivmedel');
  if (!drivVar) throw new Error('Hittade inte Drivmedel-variabeln');

  let bensinKod = null, dieselKod = null;
  drivVar.values.forEach((kod, i) => {
    const label = (drivVar.valueTexts[i] || '').toLowerCase();
    if (!bensinKod && (label.includes('bensin') || label.includes('95'))) bensinKod = kod;
    if (!dieselKod && label.includes('diesel'))                           dieselKod = kod;
  });
  if (!bensinKod || !dieselKod) throw new Error(`Koder ej funna – tillgängliga: ${drivVar.valueTexts.join(', ')}`);

  // Hämta senaste månadsdata
  const query = {
    query: [
      { code: 'Drivmedel', selection: { filter: 'item',  values: [bensinKod, dieselKod] } },
      { code: 'Tid',       selection: { filter: 'top',   values: ['1'] } }
    ],
    response: { format: 'json' }
  };

  const dataRes = await fetch(SCB_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(query),
    signal:  AbortSignal.timeout(12_000)
  });
  if (!dataRes.ok) throw new Error(`SCB data HTTP ${dataRes.status}`);
  const data = await dataRes.json();

  let bensin95 = null, diesel = null, period = null;
  (data.data || []).forEach(row => {
    const val = parseFloat(row.values?.[0]);
    if (isNaN(val)) return;
    period = period || row.key?.[1];
    if (row.key?.[0] === bensinKod) bensin95 = Math.round(val * 100) / 100;
    if (row.key?.[0] === dieselKod) diesel   = Math.round(val * 100) / 100;
  });

  if (!bensin95 || !diesel) throw new Error('Kunde inte tolka SCB-svar');

  return { bensin95, diesel, updated: period, _source: 'scb' };
}

app.get('/api/fuel-price', async (req, res) => {
  if (cache && Date.now() - cacheTs < CACHE_TTL) {
    return res.json(cache);
  }
  try {
    const data = await fetchScbPrices();
    cache   = data;
    cacheTs = Date.now();
    console.log('Priser hämtade från SCB:', data);
    res.json(data);
  } catch (err) {
    console.warn('SCB-fel, använder fallback:', err.message);
    res.json(FALLBACK);
  }
});

app.get('/health', (_, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => console.log(`Bilresa server körs på port ${PORT}`));
