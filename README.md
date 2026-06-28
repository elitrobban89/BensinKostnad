# Bränslekostnadsberäkning

En interaktiv webbkalkylator för att beräkna resekostnaden för bensin-, diesel- och elbilar. Byggd för WordPress och publicerad på [elitrobban.se/branslekostnad-berakning](https://elitrobban.se/branslekostnad-berakning/).

---

## Funktioner

- **Stöd för bensin, diesel och el** — väljer rätt enheter och formel automatiskt baserat på fordonstyp
- **Automatisk bränsleprishämtning** — hämtar aktuellt bensin/dieselpris från [globalpetrolprices.com](https://www.globalpetrolprices.com/Sweden/) via Bilresa-backend; cachas 6 timmar i localStorage
- **GPS-position** — hämtar användarens position, fyller i närmaste gatuadress och triggar automatisk prisuppdatering
- **Adressautocomplete** — Nominatim-sökning föreslår adresser medan man skriver i startfältet (320 ms debounce, nordiska länder)
- **Automatisk ruttberäkning** — beräknar körsträckan i svenska mil via [OSRM](http://router.project-osrm.org) när destination anges
- **Interaktiv karta** — visar rutten med A/B-markörer via [Leaflet.js](https://leafletjs.com) + OpenStreetMap
- **Fordonsval** — 35+ bilmärken med hundratals motorvarianter (bensin/diesel/el) inklusive DSG/DCT/EAT/EDC-automatlådor
- **Adaptivt gränssnitt** — bränslepriset byter etikett och enhet (SEK/l → SEK/kWh) vid elval
- **Bränsletyp-badges** — visuella indikatorer (Bensin / Diesel / El) som markerar valt drivmedel
- **Count-up animation** — siffrorna räknas upp med mjuk animation när resultaten visas
- **Returresa** — kryssruta som dubblar sträckan för tur- och returresor
- **EV-data caching** — CarAdvice API-svar cachas i localStorage med 24 h TTL
- **Demo-läge** — utloggade användare får 5 gratis sökningar; blockeras därefter med login-CTA
- **Login-medvetenhet** — WPCode JS läser WordPress `body.logged-in`-klass och injicerar demo-banner + login-CTA dynamiskt
- **Promo-kort** — komponent för elbilsladdningssidan med login-medveten visning
- **Gradient-design** — lila/indigo-gradient i header och sidtitel
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
| `src/bensinkostnad-wordpress.html` | HTML + CSS för WordPress Anpassad HTML-block |
| `src/bensinkostnad-wpcode.js` | JavaScript för WPCode-plugin (kalkylatorlogik, GPS, karta, bildata, bränsleprishämtning) |
| `src/elbilsladdning-promo.html` | Promo-kort för elbilsladdningssidan |
| `server.js` | Node.js/Express backend — bränslepris-API |
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
| `GET /health` | Hälsokontroll |

- Priset hämtas från globalpetrolprices.com (statisk HTML, uppdateras varje måndag)
- Cachas 12 timmar på servern + 6 timmar i webbläsarens localStorage
- Faller tillbaka på senast kända priser vid nätverksfel

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
