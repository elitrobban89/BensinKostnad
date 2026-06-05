# Bränslelkostnadsberäkning

En interaktiv webbkalkylator för att beräkna resekostnaden för bensin-, diesel- och elbilar. Byggd för WordPress och publicerad på [elitrobban.se/bensinkostnad-berakning](https://elitrobban.se/bensinkostnad-berakning/).

---

## Funktioner

- **Stöd för bensin, diesel och el** — väljer rätt enheter och formel automatiskt baserat på fordonstyp
- **GPS-position** — hämtar användarens position och fyller i närmaste gatuadress automatiskt
- **Adresssökning** — stöder fullständiga gatuadresser som startpunkt och destination
- **Automatisk ruttberäkning** — beräknar körsträckan i svenska mil via [OSRM](http://router.project-osrm.org) när destination lämnas
- **Interaktiv karta** — visar rutten med A/B-markörer via [Leaflet.js](https://leafletjs.com) + OpenStreetMap
- **Fordonsval** — 30+ bilmärken med bensin-, diesel- och elbilsmodeller som autofyller förbrukning
- **Adaptivt gränssnitt** — bränslepriset byter etikett och enhet (SEK/l → SEK/kWh) vid elval; formeln och resultaten uppdateras
- **Bränsledtyp-badges** — visuella indikatorer (Bensin / Diesel / El) som markerar valt drivmedel
- **Count-up animation** — siffrorna räknas upp med mjuk animation när resultaten visas
- **Responsiv design** — fungerar på mobil och desktop

---

## Fordonsdata

| Typ | Enhet | Exempel |
|-----|-------|---------|
| Bensinbil | l/10km | Golf 0,65 · Kamiq 0,70 · XC90 1,05 |
| Dieselbil | l/10km | Golf (diesel) 0,52 · XC60 (diesel) 0,62 |
| Elbil | kWh/mil | ID.3 1,65 · Tesla Model Y 1,70 · IONIQ 5 1,80 |

Inkluderar märken: Audi, BMW, BYD, Citroën, Dacia, Fiat, Ford, Honda, Hyundai, Jeep, Kia, Mazda, Mercedes-Benz, MG, Mini, Mitsubishi, Nissan, Opel, Peugeot, Polestar, Renault, Saab, SEAT, Skoda, Subaru, Suzuki, Tesla, Toyota, Volkswagen, Volvo m.fl.

---

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `src/bensinkostnad-wordpress.html` | HTML + CSS för WordPress Anpassad HTML-block |
| `src/bensinkostnad-wpcode.js` | JavaScript för WPCode-plugin (kalkylatorlogik, GPS, karta) |
| `src/bensinkostnad.html` | Fristående HTML-fil för lokal testning |
| `src/projekt-kort.html` | Projektkort-komponent för hemsidan |
| `src/hemssida-effekter-wpcode.js` | Visuella effekter för hemsidans rubriker och sociala länkar |

---

## Teknisk stack

| Teknologi | Användning |
|-----------|-----------|
| HTML / CSS / JavaScript | Frontend |
| [Leaflet.js](https://leafletjs.com) | Interaktiv karta |
| [OpenStreetMap](https://www.openstreetmap.org) | Kartdata |
| [Nominatim](https://nominatim.org) | Geocoding (adress → koordinater) |
| [OSRM](http://router.project-osrm.org) | Ruttberäkning |
| WordPress + WPCode | CMS och JavaScript-injektion |

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

## Lokal testning

Öppna `src/bensinkostnad.html` direkt i en webbläsare. GPS kräver HTTPS i de flesta webbläsare — testa via `localhost` eller en lokal server för full funktionalitet.

---

## Licens

MIT
