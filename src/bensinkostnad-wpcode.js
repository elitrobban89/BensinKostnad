// ═══════════════════════════════════════════════════════
//  BENSINKOSTNAD – WPCode JavaScript Snippet
//  Klistra in detta i WPCode → JavaScript Snippet
// ═══════════════════════════════════════════════════════

// ── Global state ─────────────────────────────────────
var bcStartLat = null, bcStartLon = null, bcMap = null, bcRouteLayer = null;
var bcIsElectric = false, bcIsDiesel = false;

// ── Bildata: l/10km för bensin/diesel, kWh/mil för elbilar (el) ──
// EV-förbrukning kompletteras automatiskt från CarAdvice /api/ev-consumption vid laddning
var BC_CAR_DB = {
  "Abarth":         { "500":0.70,"595":0.75,"695":0.78 },
  "Alfa Romeo":     { "Giulia":0.78,"Giulia (diesel)":0.58,"Stelvio":0.90,"Stelvio (diesel)":0.65,"Tonale":0.80,"147":0.75,"156":0.80,"159":0.85 },
  "Alpine":         { "A110":0.85,"A290 (el)":1.60 },
  "Audi":           { "A1":0.60,"A3":0.65,"A4":0.75,"A4 (diesel)":0.55,"A5":0.80,"A6":0.85,"A6 (diesel)":0.60,"A7":0.90,"A8":1.10,"Q2":0.65,"Q3":0.75,"Q5":0.90,"Q5 (diesel)":0.65,"Q7":1.10,"Q7 (diesel)":0.78,"Q8":1.20,"TT":0.80,"e-tron (el)":2.20,"Q4 e-tron (el)":1.80,"Q8 e-tron (el)":2.10 },
  "BMW":            { "1-serie":0.65,"2-serie":0.70,"3-serie":0.75,"3-serie (diesel)":0.55,"4-serie":0.80,"5-serie":0.85,"5-serie (diesel)":0.60,"7-serie":1.15,"X1":0.75,"X2":0.75,"X3":0.85,"X3 (diesel)":0.65,"X4":0.90,"X5":1.05,"X5 (diesel)":0.78,"X6":1.15,"X7":1.30,"iX (el)":2.00,"i4 (el)":1.65,"i5 (el)":1.85,"iX1 (el)":1.75,"iX3 (el)":1.90,"i7 (el)":2.10 },
  "BYD":            { "Atto 3 (el)":1.80,"Han (el)":1.75,"Seal (el)":1.65,"Dolphin (el)":1.50,"Seal U (el)":1.85,"Tang (el)":2.05 },
  "Citroën":        { "C1":0.48,"C3":0.58,"C4":0.65,"C5":0.75,"C3 Aircross":0.68,"C5 Aircross":0.80,"Berlingo":0.75,"ë-C4 (el)":1.60,"ë-C3 (el)":1.45 },
  "Cupra":          { "Born (el)":1.65,"Formentor":0.80,"Formentor (el)":1.80,"Leon":0.68,"Ateca":0.78,"Tavascan (el)":1.75 },
  "Cadillac":       { "Escalade":1.50,"CT5":1.00,"Lyriq (el)":2.00 },
  "Dacia":          { "Sandero":0.58,"Duster":0.75,"Logan":0.60,"Jogger":0.70,"Spring (el)":1.35,"Bigster":0.78 },
  "DS":             { "DS 3":0.68,"DS 4":0.72,"DS 7":0.82,"DS 3 E-Tense (el)":1.65,"DS 4 E-Tense (el)":1.70 },
  "Fiat":           { "500":0.52,"500e (el)":1.40,"Punto":0.60,"Tipo":0.65,"500X":0.70,"Panda":0.50,"600e (el)":1.55 },
  "Ford":           { "Fiesta":0.55,"Focus":0.65,"Focus (diesel)":0.50,"Mondeo":0.80,"Mondeo (diesel)":0.58,"Mustang":1.25,"Mustang Mach-E (el)":1.90,"Kuga":0.80,"Kuga (diesel)":0.60,"Explorer":1.20,"Puma":0.60,"EcoSport":0.70,"Capri (el)":1.80 },
  "Genesis":        { "G70":0.80,"G70 (diesel)":0.60,"G80":0.90,"G80 (diesel)":0.68,"GV70":0.92,"GV70 (diesel)":0.72,"GV80":1.05,"GV80 (diesel)":0.80,"GV60 (el)":1.85,"G80 (el)":1.90 },
  "Honda":          { "Jazz":0.55,"Civic":0.65,"Accord":0.75,"CR-V":0.80,"HR-V":0.70,"e (el)":1.80,"e:Ny1 (el)":1.70,"ZR-V":0.78 },
  "Hyundai":        { "i10":0.50,"i20":0.58,"i30":0.65,"i40":0.75,"Tucson":0.80,"Tucson (diesel)":0.65,"Santa Fe":0.95,"Santa Fe (diesel)":0.75,"Kona":0.70,"Kona Electric (el)":1.65,"IONIQ 5 (el)":1.80,"IONIQ 6 (el)":1.60,"IONIQ 9 (el)":2.10 },
  "Jaguar":         { "F-Pace":0.95,"F-Pace (diesel)":0.72,"E-Pace":0.85,"F-Type":1.10,"XE":0.78,"XF":0.85,"XF (diesel)":0.62,"I-Pace (el)":2.05 },
  "Jeep":           { "Renegade":0.75,"Compass":0.80,"Cherokee":0.95,"Grand Cherokee":1.15,"Wrangler":1.25,"Avenger (el)":1.60 },
  "Kia":            { "Picanto":0.50,"Rio":0.58,"Ceed":0.65,"Sportage":0.80,"Sportage (diesel)":0.65,"Sorento":1.00,"Sorento (diesel)":0.80,"Niro":0.70,"Niro Electric (el)":1.65,"EV6 (el)":1.65,"EV9 (el)":2.10 },
  "Lancia":         { "Ypsilon":0.55,"Ypsilon (el)":1.55 },
  "Land Rover":     { "Defender":1.10,"Defender (diesel)":0.82,"Discovery":1.15,"Discovery (diesel)":0.88,"Discovery Sport":0.92,"Discovery Sport (diesel)":0.72,"Range Rover":1.22,"Range Rover (diesel)":0.90,"Range Rover Sport":1.12,"Range Rover Sport (diesel)":0.85,"Range Rover Evoque":0.90,"Range Rover Evoque (diesel)":0.70,"Freelander":0.85 },
  "Lexus":          { "IS 300h":0.65,"ES 300h":0.60,"NX 300h":0.72,"NX 450h":0.70,"UX 250h":0.58,"RX 450h":0.80,"LC 500":1.05,"UX 300e (el)":1.90 },
  "Lotus":          { "Emira":1.05,"Eletre (el)":2.20,"Emeya (el)":2.00 },
  "Lucid":          { "Air (el)":1.65 },
  "Maserati":       { "Ghibli":1.05,"Ghibli (diesel)":0.78,"Levante":1.15,"Levante (diesel)":0.88,"GranTurismo":1.30,"Grecale":1.00,"GranTurismo Folgore (el)":2.10 },
  "Mazda":          { "Mazda 2":0.50,"Mazda 3":0.65,"Mazda 6":0.75,"Mazda 6 (diesel)":0.58,"CX-3":0.68,"CX-5":0.80,"CX-5 (diesel)":0.65,"CX-60":0.85,"CX-60 (diesel)":0.68,"CX-90":0.95,"MX-5":0.68,"MX-30 (el)":1.70 },
  "Mercedes-Benz":  { "A-Klass":0.65,"B-Klass":0.70,"C-Klass":0.75,"C-Klass (diesel)":0.58,"E-Klass":0.85,"E-Klass (diesel)":0.62,"S-Klass":1.20,"CLA":0.70,"GLA":0.75,"GLB":0.80,"GLC":0.90,"GLC (diesel)":0.68,"GLE":1.10,"GLE (diesel)":0.78,"GLS":1.30,"EQA (el)":1.80,"EQB (el)":1.85,"EQC (el)":2.10,"EQE (el)":1.75,"EQS (el)":1.80 },
  "MG":             { "MG 5 (el)":1.65,"MG ZS EV (el)":1.70,"MG4 EV (el)":1.55,"MG Marvel R (el)":1.85,"MG HS":0.82,"Cyberster (el)":1.80 },
  "Mini":           { "Cooper":0.65,"Clubman":0.70,"Countryman":0.75,"Cooper S":0.75,"Cooper SE (el)":1.60,"Aceman (el)":1.60,"Countryman (el)":1.75 },
  "Mitsubishi":     { "Colt":0.55,"Lancer":0.70,"Outlander":0.90,"Eclipse Cross":0.85,"L200":0.95,"ASX":0.72 },
  "Nio":            { "ET5 (el)":1.70,"ET7 (el)":1.85,"EL6 (el)":1.90,"ET5 Touring (el)":1.72 },
  "Nissan":         { "Micra":0.55,"Juke":0.70,"Qashqai":0.75,"Qashqai (diesel)":0.60,"X-Trail":0.85,"X-Trail (diesel)":0.68,"Leaf (el)":1.55,"Ariya (el)":1.90 },
  "Opel":           { "Corsa":0.55,"Astra":0.65,"Astra (diesel)":0.52,"Insignia":0.80,"Insignia (diesel)":0.60,"Mokka":0.70,"Grandland X":0.85,"Crossland":0.70,"Corsa-e (el)":1.55,"Mokka-e (el)":1.65,"Astra-e (el)":1.65 },
  "Peugeot":        { "108":0.48,"208":0.55,"308":0.65,"308 (diesel)":0.52,"408":0.72,"508":0.80,"508 (diesel)":0.60,"2008":0.65,"3008":0.75,"3008 (diesel)":0.62,"5008":0.85,"e-208 (el)":1.45,"e-2008 (el)":1.60,"e-308 (el)":1.60,"e-3008 (el)":1.65 },
  "Polestar":       { "Polestar 2 (el)":1.70,"Polestar 3 (el)":2.00,"Polestar 4 (el)":1.75 },
  "Porsche":        { "911":0.95,"Cayenne":1.10,"Cayenne (diesel)":0.82,"Macan":0.90,"Macan (el)":1.90,"Panamera":1.05,"Panamera (diesel)":0.78,"Taycan (el)":1.95,"Cayenne Turbo":1.30 },
  "Rolls-Royce":    { "Ghost":2.00,"Cullinan":2.20,"Spectre (el)":2.50 },
  "Renault":        { "Twingo":0.50,"Clio":0.55,"Megane":0.65,"Megane (diesel)":0.52,"Talisman":0.80,"Talisman (diesel)":0.62,"Kadjar":0.75,"Kadjar (diesel)":0.62,"Captur":0.65,"Koleos":0.90,"Zoe (el)":1.55,"Megane E-Tech (el)":1.60,"Scenic E-Tech (el)":1.65 },
  "Saab":           { "9-3":0.80,"9-5":0.95 },
  "SEAT":           { "Ibiza":0.55,"Leon":0.65,"Ateca":0.75,"Arona":0.65,"Tarraco":0.90 },
  "Skoda":          { "Fabia":0.55,"Octavia":0.70,"Octavia (diesel)":0.52,"Superb":0.80,"Superb (diesel)":0.58,"Scala":0.65,"Kamiq":0.70,"Karoq":0.80,"Kodiaq":0.90,"Kodiaq (diesel)":0.68,"Enyaq (el)":1.80,"Elroq (el)":1.65 },
  "Smart":          { "#1 (el)":1.70,"#3 (el)":1.75 },
  "Subaru":         { "Impreza":0.75,"Legacy":0.85,"Outback":0.95,"Forester":0.90,"XV":0.80,"BRZ":0.85,"WRX":1.00,"Solterra (el)":1.90 },
  "Suzuki":         { "Alto":0.45,"Swift":0.55,"Baleno":0.60,"Vitara":0.70,"SX4 S-Cross":0.75,"Jimny":0.80,"Ignis":0.58,"Swace":0.48 },
  "Tesla":          { "Model 3 (el)":1.55,"Model Y (el)":1.70,"Model S (el)":1.75,"Model X (el)":2.05,"Cybertruck (el)":3.00 },
  "Toyota":         { "Aygo":0.45,"Yaris":0.50,"Corolla":0.60,"Camry":0.75,"Avensis":0.75,"RAV4":0.75,"RAV4 (diesel)":0.65,"Land Cruiser":1.20,"Land Cruiser (diesel)":0.95,"C-HR":0.65,"Prius":0.45,"bZ4X (el)":1.85,"Yaris Cross":0.52,"GR Yaris":0.72 },
  "Volkswagen":     { "Polo":0.55,"Golf":0.65,"Golf (diesel)":0.52,"Jetta":0.70,"Passat":0.75,"Passat (diesel)":0.58,"Arteon":0.85,"Touareg":1.05,"Touareg (diesel)":0.78,"Tiguan":0.80,"Tiguan (diesel)":0.62,"T-Roc":0.75,"T-Cross":0.65,"Taigo":0.68,"ID.4 (el)":1.85,"ID.3 (el)":1.65,"ID.7 (el)":1.70,"ID.5 (el)":1.90,"ID.Buzz (el)":2.00 },
  "Volvo":          { "V40":0.65,"V60":0.75,"V60 (diesel)":0.55,"V70":0.80,"V90":0.80,"V90 (diesel)":0.58,"S60":0.70,"S80":0.90,"S90":0.85,"XC40":0.75,"XC60":0.85,"XC60 (diesel)":0.62,"XC70":0.95,"XC90":1.05,"XC90 (diesel)":0.75,"C30":0.60,"C70":0.80,"XC40 Recharge (el)":1.85,"EX30 (el)":1.55,"EX40 (el)":1.80,"EC40 (el)":1.80,"EX90 (el)":2.05 },
  "VinFast":        { "VF8 (el)":2.00,"VF9 (el)":2.20,"VF6 (el)":1.75 },
  "Xpeng":          { "G9 (el)":1.95,"P7 (el)":1.70,"G6 (el)":1.75 },
  "Zeekr":          { "001 (el)":1.75,"007 (el)":1.60,"X (el)":1.65 }
};

// ── Bränsleläge ───────────────────────────────────────
function bcSetFuelMode(mode) {
  bcIsElectric = mode === 'electric';
  bcIsDiesel   = mode === 'diesel';

  // Aktivera rätt badge
  var badges = document.querySelectorAll('.bc-fuel-badge');
  for (var i = 0; i < badges.length; i++) badges[i].classList.remove('active');
  var active = document.querySelectorAll('.bc-fuel-badge.' + mode);
  for (var j = 0; j < active.length; j++) active[j].classList.add('active');

  var consUnit    = document.getElementById('bc-consUnit');
  var consHint    = document.getElementById('bc-consHint');
  var priceLabel  = document.getElementById('bc-priceLabel');
  var priceUnit   = document.getElementById('bc-priceUnit');
  var priceHint   = document.getElementById('bc-priceHint');
  var card3Header = document.getElementById('bc-card3Header');
  var fLabel1     = document.getElementById('bc-fLabel1');
  var fExpr1      = document.getElementById('bc-fExpr1');
  var fExpr2      = document.getElementById('bc-fExpr2');
  var rLitersLbl  = document.getElementById('bc-rLitersLabel');
  var rLitersUnit = document.getElementById('bc-rLitersUnit');
  var priceInput  = document.getElementById('bc-price');

  if (bcIsElectric) {
    if (consUnit)    consUnit.textContent    = 'kWh/mil';
    if (consHint)    consHint.textContent    = 'En elbil drar i genomsnitt 1,5 till 2,0 kWh per mil. Ange din bils förbrukning i kWh/mil.';
    if (priceLabel)  priceLabel.textContent  = 'Pris per kWh';
    if (priceUnit)   priceUnit.textContent   = 'SEK/kWh';
    if (priceHint)   priceHint.textContent   = 'Hemmaladdning ca 1–2 SEK/kWh · Snabbladdning ca 3–6 SEK/kWh';
    if (card3Header) card3Header.textContent = 'Laddningspris';
    if (fLabel1)     fLabel1.textContent     = 'kWh åtgång';
    if (fExpr1)      fExpr1.textContent      = 'mil × kWh/mil';
    if (fExpr2)      fExpr2.textContent      = 'kWh × SEK/kWh';
    if (rLitersLbl)  rLitersLbl.textContent  = 'Energiåtgång';
    if (rLitersUnit) rLitersUnit.textContent = 'kWh';
    if (priceInput)  priceInput.placeholder  = 't.ex. 2.50';
  } else if (bcIsDiesel) {
    if (consUnit)    consUnit.textContent    = 'l/10km';
    if (consHint)    consHint.innerHTML      = 'Dieselförbrukning per 10 km. Kompakt ca 0,5 &bull; mellanklass ca 0,55–0,65 &bull; SUV ca 0,65–0,80';
    if (priceLabel)  priceLabel.textContent  = 'Pris per liter (diesel)';
    if (priceUnit)   priceUnit.textContent   = 'SEK/l';
    if (priceHint)   priceHint.textContent   = 'Dieselpriset i Sverige ligger vanligtvis ca 1–2 kr lägre än bensin.';
    if (card3Header) card3Header.textContent = 'Dieselpris';
    if (fLabel1)     fLabel1.textContent     = 'Liter åtgång';
    if (fExpr1)      fExpr1.textContent      = 'mil × l/10km';
    if (fExpr2)      fExpr2.textContent      = 'liter × SEK/liter';
    if (rLitersLbl)  rLitersLbl.textContent  = 'Dieselåtgång';
    if (rLitersUnit) rLitersUnit.textContent = 'liter';
    if (priceInput)  priceInput.placeholder  = 't.ex. 18.50';
  } else {
    if (consUnit)    consUnit.textContent    = 'l/10km';
    if (consHint)    consHint.innerHTML      = 'Fylls i automatiskt vid fordonsval &mdash; kan justeras manuellt. Liten bil ca 0,5–0,6 &bull; mellanklass ca 0,7–0,9 &bull; SUV ca 0,9–1,2';
    if (priceLabel)  priceLabel.textContent  = 'Pris per liter';
    if (priceUnit)   priceUnit.textContent   = 'SEK/l';
    if (priceHint)   priceHint.textContent   = '';
    if (card3Header) card3Header.textContent = 'Bränslepris';
    if (fLabel1)     fLabel1.textContent     = 'Liter åtgång';
    if (fExpr1)      fExpr1.textContent      = 'mil × l/10km';
    if (fExpr2)      fExpr2.textContent      = 'liter × SEK/liter';
    if (rLitersLbl)  rLitersLbl.textContent  = 'Bränsleåtgång';
    if (rLitersUnit) rLitersUnit.textContent = 'liter';
    if (priceInput)  priceInput.placeholder  = 't.ex. 19.50';
  }
}

// ── Ladda EV-förbrukning dynamiskt från CarAdvice ────────────────
function bcLoadEvConsumption() {
  // Mappar första ordet i carName → märkesnamn i BC_CAR_DB
  var BRAND_MAP = {
    'Abarth':'Abarth','Alfa':'Alfa Romeo','Alpine':'Alpine',
    'Audi':'Audi','BMW':'BMW','BYD':'BYD',
    'Cadillac':'Cadillac',
    'Citroën':'Citroën','Citroen':'Citroën','CitroÃ«n':'Citroën',
    'CUPRA':'Cupra','Cupra':'Cupra',
    'Dacia':'Dacia','DS':'DS','Fiat':'Fiat','Ford':'Ford',
    'Genesis':'Genesis','Honda':'Honda','Hyundai':'Hyundai',
    'Jaguar':'Jaguar','Jeep':'Jeep','Kia':'Kia',
    'Lancia':'Lancia','Lexus':'Lexus','Lotus':'Lotus','Lucid':'Lucid',
    'Maserati':'Maserati','Mazda':'Mazda',
    'Mercedes-Benz':'Mercedes-Benz','Mercedes':'Mercedes-Benz',
    'MG':'MG','MG4':'MG','MG5':'MG',
    'MINI':'Mini','Mini':'Mini',
    'Mitsubishi':'Mitsubishi','NIO':'Nio','Nio':'Nio',
    'Nissan':'Nissan','Opel':'Opel','Peugeot':'Peugeot',
    'Polestar':'Polestar','Porsche':'Porsche','Renault':'Renault',
    'Rolls-Royce':'Rolls-Royce',
    'SEAT':'SEAT','Seat':'SEAT',
    'Skoda':'Skoda','Škoda':'Skoda','Å koda':'Skoda',
    'Smart':'Smart','Subaru':'Subaru','Suzuki':'Suzuki','Tesla':'Tesla',
    'Toyota':'Toyota','VinFast':'VinFast',
    'Volkswagen':'Volkswagen','VW':'Volkswagen',
    'Volvo':'Volvo','XPENG':'Xpeng','Xpeng':'Xpeng',
    'Zeekr':'Zeekr'
  };
  // Märken vars prefix-ord ingår i modellnamnet (t.ex. "MG4 Long Range" → märke MG, modell "MG4 Long Range")
  var PREFIX_IN_MODEL = { 'MG4':true,'MG5':true };
  var TWO_WORD = { 'Land Rover':'Land Rover','Alfa Romeo':'Alfa Romeo','Range Rover':'Land Rover','Rolls-Royce':'Rolls-Royce' };

  fetch('https://caradvice.onrender.com/api/ev-consumption')
    .then(function(r) { return r.json(); })
    .then(function(list) {
      var added = 0;
      list.forEach(function(entry) {
        var name = (entry.carName || '').trim();
        if (!name || !entry.kwhPerMil) return;
        var parts = name.split(' ');
        var brand = null, modelParts = null;

        if (parts.length >= 2) {
          var two = parts[0] + ' ' + parts[1];
          if (TWO_WORD[two]) { brand = TWO_WORD[two]; modelParts = parts.slice(2); }
        }
        if (!brand && BRAND_MAP[parts[0]]) {
          brand = BRAND_MAP[parts[0]];
          modelParts = PREFIX_IN_MODEL[parts[0]] ? parts : parts.slice(1);
        }
        if (!brand || !modelParts || !modelParts.length) return;

        var model = modelParts.join(' ').replace(/\s*\(el\)\s*$/i, '').trim() + ' (el)';
        if (!BC_CAR_DB[brand]) BC_CAR_DB[brand] = {};
        if (!BC_CAR_DB[brand][model]) { BC_CAR_DB[brand][model] = entry.kwhPerMil; added++; }
      });
      if (added > 0) bcInitBrands();
    })
    .catch(function() { /* API otillgänglig — statisk DB räcker */ });
}

// ── Dropdown: märken ──────────────────────────────────
function bcInitBrands() {
  var sel = document.getElementById('bc-brand');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  Object.keys(BC_CAR_DB).sort().forEach(function(b) {
    var o = document.createElement('option');
    o.value = o.textContent = b;
    sel.appendChild(o);
  });
}

function bcOnBrandChange() {
  var brand    = document.getElementById('bc-brand').value;
  var modelSel = document.getElementById('bc-model');
  modelSel.innerHTML = '<option value="">Välj modell...</option>';
  document.getElementById('bc-cons').value = '';
  bcSetFuelMode('petrol');
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
  var val   = BC_CAR_DB[brand][model];
  var field = document.getElementById('bc-cons');
  field.value = val;
  if (model.indexOf('(el)') !== -1) {
    field.placeholder = 't.ex. 1.75';
    bcSetFuelMode('electric');
  } else if (model.indexOf('(diesel)') !== -1) {
    field.placeholder = 't.ex. 0.55';
    bcSetFuelMode('diesel');
  } else {
    field.placeholder = 't.ex. 0.85';
    bcSetFuelMode('petrol');
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
    if (btn) { btn.disabled = true; btn.classList.add('fetching'); }
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
          if (btn) { btn.disabled = false; btn.classList.remove('fetching'); }
          var lbl3 = document.getElementById('bc-gpsBtnLabel');
          if (lbl3) lbl3.textContent = 'Hämta GPS';
          bcAutoRoute();
        })
        .catch(function() {
          bcSetGpsHint('⚠️ Kunde inte hämta ortnamn. Ange startort manuellt.', 'error');
          if (btn) { btn.disabled = false; btn.classList.remove('fetching'); }
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
        if (btn) { btn.disabled = false; btn.classList.remove('fetching'); }
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
  el.className = 'bc-hint' + (type ? ' ' + type : '');
}

// ── Auto-rutt (triggas när start eller destination lämnas) ───
function bcAutoRoute() {
  var destEl  = document.getElementById('bc-dest');
  var startEl = document.getElementById('bc-start');
  if (!destEl) return;
  var destVal  = destEl.value.trim();
  var startVal = startEl ? startEl.value.trim() : '';

  if (!destVal || (!startVal && bcStartLat === null)) return;

  bcSetCalcStatus('🗺 Beräknar rutt...');

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
  if (card) card.classList.add('show');

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
  el.classList.add('show');
}
function bcClearError() {
  var el = document.getElementById('bc-error');
  if (el) el.classList.remove('show');
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
  var duration  = 900;
  function step(ts) {
    if (!startTime) startTime = ts;
    var p    = Math.min((ts - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = bcFmt(endVal * ease, decimals);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = bcFmt(endVal, decimals);
  }
  requestAnimationFrame(step);
}

// ── Demo-counter (localStorage, max 5 för utloggade) ──────────────
var BC_DEMO_MAX = 5;

function bcIsLoggedIn() {
  return document.body.classList.contains('logged-in');
}
function bcDemoRemaining() {
  var used = parseInt(localStorage.getItem('bc_demo_count') || '0', 10);
  return Math.max(0, BC_DEMO_MAX - used);
}
function bcUpdateDemoUI() {
  var banner   = document.getElementById('bc-demoBanner');
  var loginCta = document.getElementById('bc-loginCta');

  if (bcIsLoggedIn()) {
    if (banner)   banner.style.display   = 'none';
    if (loginCta) loginCta.style.display = 'none';
    return;
  }

  if (banner) banner.style.display = 'flex';

  var rem = bcDemoRemaining();
  var countEl = document.getElementById('bc-demoCount');
  if (countEl) countEl.textContent = rem;
  var ctaCountEl = document.getElementById('bc-loginCtaCount');
  if (ctaCountEl) ctaCountEl.textContent = BC_DEMO_MAX;
  var btn = document.getElementById('bc-calcBtn');
  if (rem === 0 && btn) btn.disabled = true;
}
function bcIncrementDemo() {
  var used = parseInt(localStorage.getItem('bc_demo_count') || '0', 10);
  localStorage.setItem('bc_demo_count', Math.min(used + 1, BC_DEMO_MAX));
  bcUpdateDemoUI();
}

// ── Beräkning ─────────────────────────────────────────
function bcCalculate() {
  bcClearError();
  bcSetCalcStatus('');
  document.getElementById('bc-results').classList.remove('show');

  // Blockera om demo-gränsen är nådd
  if (!bcIsLoggedIn() && bcDemoRemaining() === 0) {
    bcShowError('Du har använt alla 5 demosökningar. Logga in för obegränsad tillgång.');
    var loginCta = document.getElementById('bc-loginCta');
    if (loginCta) loginCta.style.display = 'flex';
    return;
  }

  var dest = document.getElementById('bc-dest').value.trim();
  var cons = parseFloat(document.getElementById('bc-cons').value);
  var pris = parseFloat(document.getElementById('bc-price').value);
  var btn  = document.getElementById('bc-calcBtn');

  if (isNaN(cons) || cons <= 0) {
    if (bcIsElectric) {
      bcShowError('Ange en giltig förbrukning i kWh/mil (t.ex. 1.75). En elbil drar i genomsnitt 1,5–2,0 kWh/mil.');
    } else {
      bcShowError('Ange en giltig förbrukning i l/10km (t.ex. 0.85).');
    }
    return;
  }
  if (isNaN(pris) || pris <= 0) {
    if (bcIsElectric) {
      bcShowError('Ange ett giltigt laddningspris i SEK/kWh (t.ex. 2.50).');
    } else {
      bcShowError('Ange ett giltigt bränslepris i SEK (t.ex. 19.50).');
    }
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
  var milOneWay = parseFloat(document.getElementById('bc-km').value);
  if (isNaN(milOneWay) || milOneWay <= 0) {
    bcShowError('Ange en körsträcka i mil, eller fyll i destination och aktivera GPS för automatisk beräkning.');
    return;
  }
  var returresaEl = document.getElementById('bc-returresa');
  var returresa = returresaEl && returresaEl.checked;
  var mil = returresa ? milOneWay * 2 : milOneWay;
  var km     = mil * 10;
  var amount = mil * cons; // liter eller kWh
  var kostnad = amount * pris;

  bcCountUp('bc-rKm',     km,      1);
  bcCountUp('bc-rMil',    mil,     2);
  bcCountUp('bc-rLiters', amount,  2);
  bcCountUp('bc-rCost',   kostnad, 2);

  if (returresa) {
    bcTrace('bc-t1', bcFmt(milOneWay,2) + ' mil × 2 (tur & retur) =', bcFmt(mil,2) + ' mil (' + bcFmt(km,1) + ' km)');
  } else {
    bcTrace('bc-t1', bcFmt(mil,2) + ' mil =', bcFmt(km,1) + ' km');
  }
  if (bcIsElectric) {
    bcTrace('bc-t2', bcFmt(mil,2) + ' mil × ' + bcFmt(cons,2) + ' kWh/mil =', bcFmt(amount,2) + ' kWh');
    bcTrace('bc-t3', bcFmt(amount,2) + ' kWh × ' + bcFmt(pris,2) + ' SEK/kWh =', bcFmt(kostnad,2) + ' SEK');
  } else {
    bcTrace('bc-t2', bcFmt(mil,2) + ' mil × ' + bcFmt(cons,2) + ' l/10km =', bcFmt(amount,2) + ' liter');
    bcTrace('bc-t3', bcFmt(amount,2) + ' l × ' + bcFmt(pris,2) + ' SEK/l =', bcFmt(kostnad,2) + ' SEK');
  }
  bcTrace('bc-t4', 'Kostnad per mil:', bcFmt(kostnad / mil, 2) + ' SEK/mil');

  document.getElementById('bc-results').classList.add('show');
  document.getElementById('bc-mapCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Räkna upp demo-counter om utloggad
  if (!bcIsLoggedIn()) {
    bcIncrementDemo();
    if (bcDemoRemaining() === 0) {
      bcShowError('Du har nu använt alla 5 demosökningar. Logga in för obegränsad tillgång.');
    }
  }
}

// ── Injicera demo-UI om det saknas i HTML-blocket ────────────────
function bcInjectDemoUI() {
  var wrap = document.querySelector('.bc-wrap');
  if (!wrap) return;

  // Demo-banner
  if (!document.getElementById('bc-demoBanner')) {
    var banner = document.createElement('div');
    banner.id = 'bc-demoBanner';
    banner.style.cssText = 'display:none;align-items:center;gap:10px;background:rgba(251,191,36,0.08);border:1.5px solid rgba(251,191,36,0.35);border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:0.84rem;color:#92400e;line-height:1.4;font-family:inherit';
    banner.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Demoläge — <strong><span id="bc-demoCount">5</span> av 5</strong> sökningar kvar. <a href="/logga-in/" style="color:#92400e;font-weight:700">Logga in</a> för obegränsad tillgång.</span>';
    wrap.insertBefore(banner, wrap.firstChild);
  }

  // Login-CTA (läggs in efter results-div)
  if (!document.getElementById('bc-loginCta')) {
    var results = document.getElementById('bc-results');
    if (results) {
      var cta = document.createElement('div');
      cta.id = 'bc-loginCta';
      cta.style.cssText = 'display:none;flex-direction:column;gap:10px;margin-top:14px;background:linear-gradient(135deg,#1a3a5c,#2d1b69);border-radius:16px;padding:24px 22px;font-family:inherit';
      cta.innerHTML = '<div style="font-size:1rem;font-weight:800;color:#fff">Vill du ha obegränsad tillgång?</div><p style="font-size:0.85rem;color:rgba(255,255,255,0.78);line-height:1.5;margin:0">Du kör i demoläge med <span id="bc-loginCtaCount">5</span> sökningar totalt. Logga in som prenumerant för att använda kalkylatorn utan begränsning.</p><a href="/logga-in/" style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:#fff;color:#1e2a3a;border-radius:10px;font-size:0.88rem;font-weight:700;text-decoration:none;align-self:flex-start">Logga in</a>';
      results.parentNode.insertBefore(cta, results.nextSibling);
    }
  }
}

// ── Event wiring ──────────────────────────────────────
function bcWireEvents() {
  bcInitBrands();
  bcLoadEvConsumption();
  bcInjectDemoUI();

  // Style the page h1 title
  try {
    document.querySelectorAll('h1').forEach(function(el) {
      if (el.textContent.trim().toLowerCase().indexOf('bränslekostnad') !== -1 && !el.querySelector('.bc-page-title')) {
        el.innerHTML = '<span class="bc-page-title">' + el.textContent + '</span>';
      }
    });
  } catch(e) {}

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
  document.addEventListener('DOMContentLoaded', function() { bcWireEvents(); bcUpdateDemoUI(); });
} else {
  bcWireEvents();
  bcUpdateDemoUI();
}
