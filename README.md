# Bränslekostnadsberäkning

En interaktiv webbkalkylator för att beräkna resekostnaden för bensin-, diesel- och elbilar. Byggd för WordPress och publicerad på [elitrobban.se/branslekostnad-berakning](https://elitrobban.se/branslekostnad-berakning/).

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
- **Returresa** — kryssruta som dubblar sträckan för tur- och returresor (av som standard)
- **Demo-läge** — utloggade användare får 5 gratis sökningar via localStorage-counter; blockeras därefter med login-CTA (verifierat i inkognito)
- **Login-medvetenhet** — WPCode JS läser WordPress `body.logged-in`-klass och injicerar demo-banner + login-CTA dynamiskt; HTML-blocket behöver inte uppdateras
- **Promo-kort** — komponent för elbilsladdningssidan som länkar till kalkylatorn; visar olika innehåll för inloggade vs utloggade via JS-detection
- **Gradient-design** — kalkylatorrubrik och sidtitel har lila/indigo-gradient-styling för ett modernt utseende
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
| `src/bensinkostnad-wpcode.js` | JavaScript för WPCode-plugin (kalkylatorlogik, GPS, karta, demo-counter) |
| `src/bensinkostnad.html` | Fristående HTML-fil för lokal testning |
| `src/elbilsladdning-promo.html` | Promo-kort för elbilsladdningssidan — länkar till kalkylatorn med login-medveten visning |
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
