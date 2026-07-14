# Bränslekostnadsberäkning

[![Build & Test](https://github.com/elitrobban89/BensinKostnad/actions/workflows/node.yml/badge.svg)](https://github.com/elitrobban89/BensinKostnad/actions/workflows/node.yml)

En interaktiv webbkalkylator för att beräkna resekostnaden för bensin-, diesel- och elbilar. Byggd för WordPress och publicerad på [elitrobban.se/branslekostnad-berakning](https://elitrobban.se/branslekostnad-berakning/).

---

## Funktioner

- **Stöd för bensin, diesel och el** — väljer rätt enheter och formel automatiskt baserat på fordonstyp
- **Automatisk bränsleprishämtning** — hämtar aktuellt bensin/dieselpris från [globalpetrolprices.com](https://www.globalpetrolprices.com/Sweden/) via Bilresa-backend; cachas 6 timmar i localStorage
- **Automatiskt elpris** — spotpriset hämtas från [elprisetjustnu.se](https://www.elprisetjustnu.se) för rätt elområde (SE1–SE4 väljs via GPS-latitud); fältet fylls med ett uppskattat hemmaladdningspris (spot × 1,25 moms + schablon 1,25 kr för energiskatt, nätavgift och påslag), cachas 1 timme
- **Glödande källbadges** — pulserande LIVE-badge under prisfältet visar datakällan (grön för globalpetrolprices, violett för elprisetjustnu, bärnsten för reservpris); respekterar `prefers-reduced-motion`
- **Laddningsval-chips** — i elläget väljs 🏠 Hemmaladdning (spotbaserat) eller ⚡ Snabbladdare, plus länk till [elbilsladdning-appen](https://elitrobban.se/elbilsladdning/) för operatörspriser. Snabbladdarpriset hämtas från Elbilsladdning-backendens `GET /api/charging-price`: med position (GPS/vald startort) priset hos **närmaste DC-station med känd operatör** — hinten visar operatör och avstånd, badgen säger NÄRMASTE SNABBLADDARE — annars riksgenomsnittet av operatörstabellen. Konstanten `BC_EL_FAST_AVG` (4,75 kr/kWh) är sista reserv vid nätverksfel; 30 min localStorage-cache per position
- **Bränslejämförelse** — under resultatet visas vad samma resa kostar med de andra drivmedlen (genomsnittsbil: 0,75 l/10km bensin, 0,60 diesel, 1,7 kWh/mil el) med aktuella priser och billigare/dyrare-badge i procent
- **CO₂ per resa** — resultatgriden får en CO₂-ruta (bensin 2,36 kg/l, diesel 2,68 kg/l vid förbränning; el 0,04 kg/kWh svensk elmix) och jämförelseraderna visar ~CO₂ per alternativ
- **Delbara länkar** — "🔗 Dela beräkningen" kopierar en URL (mobil: delningsmenyn) med hela beräkningen i hashen (`#bc=start=...&mode=el...`); mottagaren får fälten ifyllda och resultatet uträknat direkt. Hashen når aldrig servern och stör inte WordPress-cachen; adressfältets URL hålls också delbar via `history.replaceState`
- **GPS-position** — hämtar användarens position, fyller i närmaste gatuadress och triggar automatisk prisuppdatering
- **Adressautocomplete** — Nominatim-sökning föreslår adresser medan man skriver i startfältet (320 ms debounce, nordiska länder)
- **Automatisk ruttberäkning** — beräknar körsträckan i svenska mil via [OSRM](http://router.project-osrm.org) när destination anges
- **Interaktiv karta** — visar rutten med A/B-markörer via [Leaflet.js](https://leafletjs.com) + OpenStreetMap
- **Fordonsval** — 35+ bilmärken med hundratals motorvarianter (bensin/diesel/el) inklusive DSG/DCT/EAT/EDC-automatlådor
- **Adaptivt gränssnitt** — bränslepriset byter etikett och enhet (SEK/l → SEK/kWh) vid elval
- **Klickbara bränsletyp-badges** — Bensin / Diesel / El markerar valt drivmedel och kan klickas för att byta läge direkt; pris- och förbrukningsfält rensas vid byte el ↔ fossilt eftersom enheterna inte är utbytbara
- **Count-up animation** — siffrorna räknas upp med mjuk animation när resultaten visas
- **Returresa** — kryssruta som dubblar sträckan; uppdaterar resultaten dynamiskt utan ny sökning
- **EV-data caching** — CarAdvice API-svar cachas i localStorage med 24 h TTL
- **Serverdata för bensin/diesel/hybrid** — förbrukningssiffror hämtas från CarAdvice `/api/ice-consumption` (~950 varianter ur `ice_consumption`-tabellen) vid sidladdning, 24 h localStorage-cache; den statiska databasen i JS:en är fallback när API:et inte svarar
- **Demo-läge** — utloggade användare får 5 gratis sökningar; blockeras därefter med login-CTA
- **Login-medvetenhet** — WPCode JS läser WordPress `body.logged-in`-klass och injicerar demo-banner + login-CTA dynamiskt
- **Promo-kort** — komponent för elbilsladdningssidan med login-medveten visning
- **Aurora-design** — långsamt driftande lila/indigo-gradient i header med glödande blobbar, hover-lyft på kort, animerad gradient + glow på beräkna-knappen och totalkostnadskortet, entré-animationer för karta/resultat; allt stängs av vid `prefers-reduced-motion`
- **Responsiv design** — fungerar på mobil och desktop

---

## Fordonsdata

| Typ | Enhet | Exempel |
|-----|-------|---------|
| Bensinbil | l/10km | Golf 0,65 · Golf DSG 0,68 · Kamiq 110 hk DSG 0,69 · XC90 1,02 |
| Dieselbil | l/10km | Golf TDI 0,52 · Tucson CRDi 0,62 · XC60 D (diesel) 0,62 |
| Elbil | kWh/mil | ID.3 1,65 · Tesla Model Y 1,70 · IONIQ 5 1,80 |

**35+ märken** med detaljerade motorvarianter för den svenska marknaden, bl.a.:

Abarth, Alfa Romeo, Alpine, Audi, BMW, BYD, Citroën, Cupra, Dacia, DS, Fiat, Ford, Genesis, Honda, Hyundai, Jaguar, Jeep, Kia, Lancia, Land Rover, Lexus, Mazda, Mercedes-Benz, MG, Mini, Mitsubishi, Nio, Nissan, Opel, Peugeot, Polestar, Porsche, Renault, Rolls-Royce, Saab, SEAT, Skoda, Smart, Subaru, Suzuki, Tesla, Toyota, Volkswagen, Volvo, VinFast, Xpeng, Zeekr

Automatlådsvarianter (DSG, DCT, EAT8, EDC, CVT) finns inkluderade för alla populära modeller.

---

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `src/bensinkostnad-wordpress.html` | HTML + CSS för WordPress Anpassad HTML-block (enda HTML-varianten — äldre generationer är borttagna) |
| `src/bensinkostnad-wpcode.js` | JavaScript för WPCode-plugin (kalkylatorlogik, GPS, karta, bildata, prishämtning, jämförelse, CO₂, delbara länkar) |
| `src/elbilsladdning-promo.html` | Promo-kort för elbilsladdningssidan |
| `src/projekt-kort.html` | Projekt-kort för hemsidan |
| `src/bilresa-effekter-wpcode.js` / `.html` / `-shortcode.php` | Effekt-snippets för Bilresa-sidan |
| `src/hemssida-effekter-wpcode.js` | Effekt-snippet för startsidan |
| `server.js` | Node.js/Express backend — bränsle- och elpris-API |
| `server.test.js` | Backend-testsvit (19 tester) |
| `frontend.test.js` | Frontend-testsvit — kör WPCode-snippetet i DOM-stubbad vm-kontext (18 tester) |
| `.github/workflows/node.yml` | CI: syntaxkontroll + testsvit på varje push |
| `package.json` | Node.js-beroenden |
| `Dockerfile` | Docker-konfiguration för Render.com |

---

## Teknisk stack

| Teknologi | Användning |
|-----------|-----------|
| HTML / CSS / JavaScript | Frontend |
| [Leaflet.js](https://leafletjs.com) | Interaktiv karta |
| [OpenStreetMap](https://www.openstreetmap.org) | Kartdata |
| [Nominatim](https://nominatim.org) | Geocoding + adressautocomplete |
| [OSRM](http://router.project-osrm.org) | Ruttberäkning |
| [elprisetjustnu.se](https://www.elprisetjustnu.se) | Spotpris el per elområde (öppet API) |
| Node.js + Express | Bilresa backend (bilresa.onrender.com) |
| [globalpetrolprices.com](https://www.globalpetrolprices.com) | Bränsleprisdata (scraping, uppdateras varje måndag) |
| WordPress + WPCode | CMS och JavaScript-injektion |
| Docker + Render.com | Backend-hosting |

---

## Backend

Ett minimalt Node.js/Express-API körs på `https://bilresa.onrender.com`:

| Endpoint | Beskrivning |
|----------|-------------|
| `GET /api/fuel-price` | Returnerar aktuellt bensin95 + dieselpris för Sverige |
| `GET /api/electricity-price?zone=SE3` | Aktuellt spotpris (SEK/kWh exkl moms) för ett elområde, från elprisetjustnu.se; cachas per zon och timme |
| `GET /health` | Hälsokontroll — `priceCache: warm/cold` visar om prisskrapningen fungerar |

- Priset hämtas från globalpetrolprices.com (statisk HTML, uppdateras varje måndag)
- Cachas 12 timmar på servern + 6 timmar i webbläsarens localStorage
- Priscachen förvärms vid serverstart — första besökaren efter en deploy slipper vänta på skrapningen
- Faller tillbaka på senast kända priser vid nätverksfel; elpriset faller tillbaka på ett fast spotpris (flaggas med `_source: 'fallback'`)
- Övervakas med UptimeRobot mot `/health`; nyckelordsövervakning på `warm` kan även larma om skrapningen slutar fungera

Kör lokalt:
```bash
npm install
node server.js
```

Bygg och kör med Docker:
```bash
docker build -t bilresa-server .
docker run -p 3000:3000 bilresa-server
```

---

## Tester & CI

37 tester med Nodes inbyggda testrunner — inga extra beroenden.

**Backend (`server.test.js`, 19 st):**

- **Prisparsningen** — dagspriset ("SEK X per liter or USD") väljs, inte tioårssnittet i meta-taggarna; reservmönstret när dagsraden saknas; fel när SEK-pris saknas helt; HTTP-fel kastar
- **`/api/fuel-price`** — bensin + diesel ur källan, 12h-cache (andra anropet hämtar inte om), fallback-priser vid nätverksfel, misslyckad hämtning cachas inte, `_source: 'globalpetrolprices-average'` flaggar när reservpriset används (sidlayouten har ändrats)
- **`/api/electricity-price`** — spotpriset för aktuell timme, zonval + normalisering, 400 vid ogiltig zon, cache per zon och timme, fallback vid nätverksfel eller när prisraden saknas
- **`/health`** — status OK + CORS-headern; `priceCache` rapporterar `cold` före och `warm` efter en lyckad prishämtning
- **`warmUpCache`** — förvärmningen fyller cachen vid start så första anropet svarar direkt; fel sväljs så servern startar ändå

**Frontend (`frontend.test.js`, 18 st):** kör `bensinkostnad-wpcode.js` i en DOM-stubbad vm-kontext —

- **Elzoner** — latitud → SE1–SE4 (Kiruna/Umeå/Sundsvall/Gävle/Stockholm/Malmö), null → SE3
- **CO₂** — faktor per bränsleläge; rutan skapas med rätt enhetsetikett (elmix/förbränning)
- **Bildataparsning** — märken, tvåordsmärken (Alfa Romeo, Land Rover), (el)-suffix, MG-prefixnormalisering utan dubblering, okända märken/nollvärden hoppas över, statiska värden skrivs inte över; ICE-datans märkesprefix + dieselsuffix
- **Delbara länkar** — hash → fält → återbyggd URL blir identisk; no-op utan hash
- **Prishämtning** — hemmaladdningspris = spot × 1,25 + schablon; cache före fetch; fallback vid nätverksfel (el + bensin/diesel)
- **Jämförelsen** — visar de två andra drivmedlen med rätt kostnad/CO₂ och billigare/dyrare-badge
- **Lägesbyte** — priset rensas vid el ↔ fossilt men behålls bensin ↔ diesel
- **Demo-räknaren** — 5 → 0, stannar på 0; `ca_status=active` räknas som inloggad
- **`bcDoCalculate`** — hela kedjan med returresa: mil, liter, kostnad, CO₂ och dela-knappen

```bash
npm test
```

GitHub Actions ([node.yml](.github/workflows/node.yml)) syntaxkontrollerar och kör testsviten på varje push — badgen överst visar status.

---

## Formel

**Bensin / Diesel**
```
Liter åtgång  = antal mil × förbrukning (l/10km)
Total kostnad = liter åtgång × pris (SEK/liter)
```

**Elbil**
```
kWh åtgång    = antal mil × förbrukning (kWh/mil)
Total kostnad = kWh åtgång × laddningspris (SEK/kWh)
```

---

## WordPress-installation

### 1. HTML + CSS
Klistra in innehållet från `bensinkostnad-wordpress.html` i ett **Anpassad HTML**-block på sidan. Inkludera allt fram till och med `<script src=".../leaflet.js"></script>` — men **inte** det egna `<script>`-blocket.

### 2. JavaScript
Installera pluginet [WPCode](https://wordpress.org/plugins/insert-headers-and-footers/) och lägg till `bensinkostnad-wpcode.js` som ett JavaScript-snippet som körs på bensinkostnad-sidan.

### 3. Leaflet
Leaflet laddas automatiskt via CDN i HTML-blocket — ingen extra installation krävs.

---

## Licens

MIT
