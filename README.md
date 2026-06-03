# Bensinkostnadsberäkning 🚙

En interaktiv webbkalkylator för att beräkna bränslekostnaden för en bilresa. Byggd för WordPress och publicerad på [elitrobban.se/bensinkostnad-berakning](https://elitrobban.se/bensinkostnad-berakning/).

---

## Funktioner

- **GPS-position** — hämtar användarens position och fyller i närmaste gatuadress automatiskt
- **Adresssökning** — stöder fullständiga gatuadresser som startpunkt och destination (t.ex. *Gatudaddress, stad*)
- **Automatisk ruttberäkning** — beräknar körsträckan i svenska mil via [OSRM](http://router.project-osrm.org) när destination lämnas
- **Interaktiv karta** — visar rutten med A/B-markörer via [Leaflet.js](https://leafletjs.com) + OpenStreetMap
- **Fordonsval** — dropdown med 25+ bilmärken och modeller som autofyller förbrukning (l/10km)
- **Bränsleprisberäkning** — beräknar total kostnad i SEK med steg-för-steg uträkning
- **Count-up animation** — siffrorna räknas upp med mjuk animation när resultaten visas
- **Responsiv design** — fungerar på mobil och desktop

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

```
Antal mil     = körsträcka (km) ÷ 10
Liter åtgång  = antal mil × förbrukning (l/10km)
Total kostnad = liter åtgång × bränslepris (SEK/liter)
```

---

## WordPress-installation

### 1. HTML + CSS
Klistra in innehållet från `bensinkostnad-wordpress.html` i ett **Anpassad HTML**-block på sidan.

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
