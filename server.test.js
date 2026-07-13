const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { app, fetchPrice, resetCache, warmUpCache, FALLBACK } = require('./server');

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

// Mockar global fetch för globalpetrolprices-URL:er men släpper igenom
// anrop till den lokala testservern.
const realFetch = globalThis.fetch;
let priceHandler;

beforeEach(() => {
  resetCache();
  priceHandler = null;
  globalThis.fetch = (url, opts) => {
    if (String(url).includes('globalpetrolprices.com')) {
      if (!priceHandler) throw new Error('Testet satte ingen priceHandler');
      return Promise.resolve(priceHandler(String(url)));
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

test('warmUpCache sväljer fel — servern startar ändå och nästa anrop hämtar', async () => {
  priceHandler = () => { throw new Error('nätverksfel'); };
  await warmUpCache(); // får inte kasta
  priceHandler = () => fakeResponse(PAGE_HTML);
  const { body } = await get('/api/fuel-price');
  assert.equal(body._source, 'globalpetrolprices');
});
