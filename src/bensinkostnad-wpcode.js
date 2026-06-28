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
  "Abarth": {
    "500 1.4 T-Jet 135 hk":0.72, "595 1.4 T-Jet 160 hk":0.75, "595 Competizione 1.4 T-Jet 180 hk":0.85, "695 1.4 T-Jet 180 hk":0.88, "695 Biposto 1.4 T-Jet 190 hk":0.95
  },
  "Alfa Romeo": {
    "Giulia 2.0 T 200 hk":0.75, "Giulia 2.0 T 280 hk":0.82, "Giulia Quadrifoglio 2.9 V6 510 hk":1.15,
    "Giulia 2.2 Diesel 160 hk (diesel)":0.56, "Giulia 2.2 Diesel 210 hk (diesel)":0.60,
    "Stelvio 2.0 T 200 hk":0.88, "Stelvio 2.0 T 280 hk":0.95, "Stelvio Quadrifoglio 2.9 V6 510 hk":1.25,
    "Stelvio 2.2 Diesel 160 hk (diesel)":0.62, "Stelvio 2.2 Diesel 210 hk (diesel)":0.68,
    "Tonale 1.5 MHEV 160 hk":0.78, "Tonale Plug-in Hybrid 280 hk":0.45,
    "147 1.6":0.72, "147 2.0":0.82, "147 GTA 3.2":1.05,
    "156 1.8":0.78, "156 2.5 V6":1.00, "159 1.9 TDI (diesel)":0.60
  },
  "Alpine": {
    "A110 1.8 T 252 hk":0.82, "A110 S 1.8 T 292 hk":0.90, "A110 GT 1.8 T 300 hk":0.90, "A110 R 300 hk":0.95,
    "A290 (el)":1.60
  },
  "Audi": {
    "A1 25 TFSI 95 hk":0.58, "A1 30 TFSI 116 hk":0.62, "A1 35 TFSI 150 hk":0.68, "A1 40 TFSI 200 hk":0.78,
    "A3 30 TFSI 110 hk":0.62, "A3 35 TFSI 150 hk":0.68, "A3 40 TFSI 204 hk":0.75,
    "A3 35 TDI 150 hk (diesel)":0.52, "A3 40 TDI 200 hk (diesel)":0.56,
    "A3 45 TFSI e PHEV 245 hk":0.48, "S3 2.0 TFSI 310 hk":0.90, "RS3 2.5 TFSI 400 hk":1.10,
    "A4 35 TFSI 150 hk":0.72, "A4 40 TFSI 204 hk":0.78, "A4 45 TFSI 265 hk":0.88,
    "A4 35 TDI 163 hk (diesel)":0.55, "A4 40 TDI 204 hk (diesel)":0.58, "A4 50 TDI 286 hk (diesel)":0.62,
    "A4 55 TFSI e PHEV 265 hk":0.52, "S4 3.0 TFSI 341 hk":1.00, "RS4 2.9 TFSI 450 hk":1.18,
    "A5 35 TFSI 150 hk":0.74, "A5 40 TFSI 204 hk":0.80, "A5 45 TFSI 265 hk":0.90,
    "A5 35 TDI 163 hk (diesel)":0.56, "A5 40 TDI 204 hk (diesel)":0.60,
    "S5 3.0 TFSI 341 hk":1.02, "RS5 2.9 TFSI 450 hk":1.20,
    "A6 40 TFSI 204 hk":0.82, "A6 45 TFSI 265 hk":0.90, "A6 55 TFSI 340 hk":1.00,
    "A6 35 TDI 163 hk (diesel)":0.58, "A6 40 TDI 204 hk (diesel)":0.62, "A6 50 TDI 286 hk (diesel)":0.68,
    "A6 55 TFSI e PHEV 367 hk":0.55, "S6 2.9 TFSI 450 hk":1.08, "RS6 4.0 TFSI 630 hk":1.30,
    "A7 45 TFSI 265 hk":0.88, "A7 55 TFSI 340 hk":0.98,
    "A7 40 TDI 204 hk (diesel)":0.64, "A7 50 TDI 286 hk (diesel)":0.70,
    "S7 2.9 TFSI 450 hk":1.10, "RS7 4.0 TFSI 630 hk":1.32,
    "A8 55 TFSI 340 hk":1.08, "A8 60 TFSI e PHEV 449 hk":0.70,
    "A8 50 TDI 286 hk (diesel)":0.75, "S8 4.0 TFSI 571 hk":1.30,
    "Q2 35 TFSI 150 hk":0.68, "Q2 35 TDI 150 hk (diesel)":0.54,
    "Q3 35 TFSI 150 hk":0.72, "Q3 45 TFSI 230 hk":0.82,
    "Q3 35 TDI 150 hk (diesel)":0.56, "Q3 40 TDI 200 hk (diesel)":0.60, "RS Q3 2.5 TFSI 400 hk":1.02,
    "Q5 40 TFSI 204 hk":0.88, "Q5 45 TFSI 265 hk":0.95,
    "Q5 40 TDI 204 hk (diesel)":0.65, "Q5 50 TDI 286 hk (diesel)":0.70,
    "Q5 55 TFSI e PHEV 367 hk":0.58, "SQ5 3.0 TFSI 341 hk":1.05,
    "Q7 45 TFSI 340 hk":1.08, "Q7 45 TDI 231 hk (diesel)":0.78, "Q7 50 TDI 286 hk (diesel)":0.82,
    "Q7 60 TFSI e PHEV 462 hk":0.68, "SQ7 4.0 TFSI 507 hk":1.28,
    "Q8 55 TFSI 340 hk":1.15, "Q8 50 TDI 286 hk (diesel)":0.80, "SQ8 4.0 TFSI 507 hk":1.30, "RS Q8 4.0 TFSI 600 hk":1.42,
    "TT 45 TFSI 245 hk":0.80, "TTS 2.0 TFSI 320 hk":0.90, "TT RS 2.5 TFSI 400 hk":1.05,
    "e-tron 50 quattro (el)":2.10, "e-tron 55 quattro (el)":2.20, "e-tron GT (el)":1.95, "RS e-tron GT (el)":2.10,
    "Q4 e-tron 35 (el)":1.65, "Q4 e-tron 40 (el)":1.75, "Q4 e-tron 50 quattro (el)":1.85,
    "Q8 e-tron 50 (el)":2.00, "Q8 e-tron 55 (el)":2.10, "Q8 e-tron S (el)":2.30
  },
  "BMW": {
    "116i 1.5 T 109 hk":0.58, "118i 1.5 T 136 hk":0.62, "120i 2.0 T 178 hk":0.68, "128ti 2.0 T 265 hk":0.80, "M135i xDrive 306 hk":0.88,
    "116d 2.0 D 116 hk (diesel)":0.48, "118d 2.0 D 150 hk (diesel)":0.52, "120d 2.0 D 190 hk (diesel)":0.55,
    "218i Active Tourer 136 hk":0.68, "220i 2.0 T 170 hk":0.72, "230i 2.0 T 245 hk":0.80, "M240i xDrive 374 hk":0.98,
    "218d Active Tourer 150 hk (diesel)":0.52, "220d Active Tourer 190 hk (diesel)":0.56, "225e Active Tourer PHEV":0.45,
    "318i 2.0 T 156 hk":0.62, "320i 2.0 T 184 hk":0.68, "330i 2.0 T 258 hk":0.78, "340i xDrive 3.0 T 374 hk":0.95,
    "316d 2.0 D 116 hk (diesel)":0.48, "318d 2.0 D 150 hk (diesel)":0.52, "320d 2.0 D 190 hk (diesel)":0.55, "330d 3.0 D 286 hk (diesel)":0.62,
    "330e PHEV 292 hk":0.45, "M3 3.0 T 480 hk":1.08, "M3 Competition 510 hk":1.15,
    "420i 2.0 T 184 hk":0.72, "430i 2.0 T 245 hk":0.82, "M440i xDrive 374 hk":0.98,
    "420d 2.0 D 190 hk (diesel)":0.58, "430d 3.0 D 286 hk (diesel)":0.65,
    "430e PHEV 292 hk":0.48, "M4 3.0 T 480 hk":1.10, "M4 Competition 510 hk":1.18,
    "520i 2.0 T 184 hk":0.75, "530i 2.0 T 252 hk":0.85, "540i 3.0 T 340 hk":0.98,
    "518d 2.0 D 150 hk (diesel)":0.55, "520d 2.0 D 190 hk (diesel)":0.60, "530d 3.0 D 286 hk (diesel)":0.65, "540d 3.0 D 340 hk (diesel)":0.72,
    "530e PHEV 292 hk":0.50, "545e xDrive PHEV 394 hk":0.58, "M5 4.4 V8 600 hk":1.28, "M5 Competition 625 hk":1.35,
    "730i 2.0 T 265 hk":0.92, "740i 3.0 T 340 hk":1.05, "750i xDrive 4.4 V8 530 hk":1.25,
    "730d 3.0 D 286 hk (diesel)":0.72, "740d 3.0 D 340 hk (diesel)":0.80,
    "745e PHEV 394 hk":0.68, "M760i xDrive 6.6 V12 585 hk":1.45,
    "X1 sDrive18i 140 hk":0.70, "X1 xDrive20i 192 hk":0.78, "X1 xDrive25i 231 hk":0.85,
    "X1 sDrive18d 150 hk (diesel)":0.55, "X1 xDrive18d 150 hk (diesel)":0.58, "X1 xDrive25d 231 hk (diesel)":0.64, "X1 xDrive25e PHEV":0.50,
    "X1 xDrive30 (el)":1.75,
    "X2 sDrive18i 140 hk":0.72, "X2 xDrive25i 192 hk":0.82, "X2 M35i xDrive 306 hk":0.95,
    "X2 sDrive18d 150 hk (diesel)":0.55, "X2 xDrive18d 150 hk (diesel)":0.58,
    "X3 xDrive20i 184 hk":0.82, "X3 xDrive30i 252 hk":0.90, "X3 M40i 360 hk":1.05,
    "X3 xDrive20d 190 hk (diesel)":0.64, "X3 xDrive30d 286 hk (diesel)":0.70, "X3 M40d 326 hk (diesel)":0.78,
    "X3 xDrive30e PHEV":0.55, "X3 M 3.0 T 510 hk":1.30,
    "X4 xDrive20i 184 hk":0.85, "X4 xDrive30i 252 hk":0.92, "X4 M40i 360 hk":1.08,
    "X4 xDrive20d 190 hk (diesel)":0.66, "X4 xDrive30d 286 hk (diesel)":0.72, "X4 M 3.0 T 510 hk":1.32,
    "X5 xDrive40i 340 hk":1.02, "X5 xDrive50i 4.4 V8 462 hk":1.20,
    "X5 xDrive30d 286 hk (diesel)":0.76, "X5 xDrive40d 340 hk (diesel)":0.82, "X5 M50d 400 hk (diesel)":0.92,
    "X5 xDrive45e PHEV 394 hk":0.65, "X5 M 4.4 V8 600 hk":1.40, "X5 M Competition 625 hk":1.48,
    "X6 xDrive40i 340 hk":1.08, "X6 xDrive30d 286 hk (diesel)":0.80, "X6 xDrive40d 340 hk (diesel)":0.88, "X6 M 4.4 V8 600 hk":1.45,
    "X7 xDrive40i 340 hk":1.12, "X7 xDrive30d 286 hk (diesel)":0.85, "X7 xDrive40d 340 hk (diesel)":0.92, "X7 M60i 4.4 V8 585 hk":1.42,
    "iX xDrive40 (el)":1.90, "iX xDrive50 (el)":2.00, "iX M60 (el)":2.20,
    "i4 eDrive35 (el)":1.55, "i4 eDrive40 (el)":1.65, "i4 xDrive40 (el)":1.75, "i4 M50 (el)":1.90,
    "i5 eDrive40 (el)":1.75, "i5 xDrive40 (el)":1.85, "i5 M60 (el)":2.00,
    "iX3 (el)":1.90, "i7 xDrive60 (el)":2.10, "i7 M70 (el)":2.30
  },
  "BYD": {
    "Dolphin Standard 45 kWh (el)":1.35, "Dolphin 60 kWh (el)":1.45,
    "Seal 82 kWh RWD (el)":1.60, "Seal 82 kWh AWD (el)":1.72,
    "Atto 3 Standard Range (el)":1.65, "Atto 3 Extended Range (el)":1.80,
    "Han 85 kWh RWD (el)":1.75, "Han AWD 100 kWh (el)":1.90,
    "Seal U (el)":1.85, "Tang (el)":2.05
  },
  "Cadillac": {
    "CT5 2.0 Turbo 237 hk":0.98, "CT5-V 3.0 TT 360 hk":1.12, "CT5-V Blackwing 6.2 V8 668 hk":1.55,
    "Escalade 6.2 V8 426 hk":1.55, "Lyriq (el)":2.00
  },
  "Citroën": {
    "C1 1.0 VTi 68 hk":0.48, "C1 1.2 VTi 82 hk":0.52,
    "C3 1.2 PureTech 83 hk":0.55, "C3 1.2 PureTech 110 hk":0.60, "C3 1.2 PureTech 110 hk EAT6":0.63,
    "C3 Aircross 1.2 PureTech 110 hk":0.68, "C3 Aircross 1.2 PureTech 130 hk":0.72,
    "C4 1.2 PureTech 130 hk":0.65, "C4 1.2 PureTech 130 hk EAT8":0.68, "C4 1.5 BlueHDi 130 hk (diesel)":0.52,
    "C5 Aircross 1.2 PureTech 130 hk":0.78, "C5 Aircross 1.2 PureTech 130 hk EAT8":0.81,
    "C5 Aircross 1.5 BlueHDi 130 hk (diesel)":0.60, "C5 Aircross 1.5 BlueHDi 130 hk EAT8 (diesel)":0.63, "C5 Aircross PHEV 225 hk":0.48,
    "Berlingo 1.2 PureTech 110 hk":0.72, "Berlingo 1.2 PureTech 110 hk EAT8":0.75, "Berlingo 1.5 BlueHDi 130 hk (diesel)":0.58,
    "ë-C4 (el)":1.60, "ë-C3 (el)":1.45
  },
  "Cupra": {
    "Born 58 kWh (el)":1.60, "Born 77 kWh (el)":1.65, "Born 82 kWh (el)":1.68,
    "Formentor 1.5 TSI 150 hk":0.78, "Formentor 2.0 TSI 190 hk":0.85, "Formentor 2.0 TSI 300 hk":0.95, "Formentor VZ 2.5 TFSI 390 hk":1.12,
    "Formentor 1.4 e-Hybrid 204 hk":0.48, "Formentor 1.4 e-Hybrid 245 hk":0.50,
    "Leon 1.5 TSI 150 hk":0.65, "Leon 2.0 TSI 190 hk":0.75, "Leon VZ 2.0 TSI 300 hk":0.92,
    "Ateca 1.5 TSI 150 hk":0.75, "Ateca 2.0 TSI 190 hk":0.85, "Ateca 2.0 TSI 300 hk":0.98,
    "Tavascan (el)":1.75
  },
  "Dacia": {
    "Sandero 1.0 SCe 65 hk":0.55, "Sandero 1.0 TCe 90 hk":0.58, "Sandero 1.0 TCe 90 hk CVT":0.61,
    "Sandero Stepway 1.0 TCe 90 hk":0.62, "Sandero Stepway 1.0 TCe 90 hk CVT":0.65,
    "Sandero Stepway 1.0 TCe 110 hk":0.65, "Sandero Stepway 1.0 TCe 110 hk CVT":0.68,
    "Duster 1.0 TCe 90 hk":0.72, "Duster 1.3 TCe 130 hk":0.78, "Duster 1.3 TCe 130 hk EDC":0.82,
    "Duster 1.3 TCe 150 hk 4x4 EDC":0.88, "Duster 1.5 dCi 115 hk (diesel)":0.58,
    "Logan 1.0 SCe 75 hk":0.60, "Jogger 1.0 TCe 110 hk":0.72, "Jogger 1.0 TCe 110 hk CVT":0.75,
    "Jogger 1.6 Hybrid 140 hk":0.68,
    "Spring 27 kWh (el)":1.30, "Spring 33 kWh (el)":1.35, "Bigster 1.2 TCe 140 hk":0.78, "Bigster 1.2 TCe 140 hk EDC":0.81
  },
  "DS": {
    "DS 3 1.2 PureTech 130 hk":0.68, "DS 3 1.5 BlueHDi 130 hk (diesel)":0.54, "DS 3 E-Tense (el)":1.65,
    "DS 4 1.2 PureTech 130 hk":0.72, "DS 4 1.5 BlueHDi 130 hk (diesel)":0.56, "DS 4 PHEV 225 hk":0.48, "DS 4 E-Tense (el)":1.70,
    "DS 7 1.6 PureTech 225 hk":0.82, "DS 7 BlueHDi 180 hk (diesel)":0.64, "DS 7 E-Tense 300 hk PHEV":0.50,
    "DS 9 1.6 PureTech 225 hk":0.88, "DS 9 E-Tense PHEV 360 hk":0.55
  },
  "Fiat": {
    "500 1.0 MHEV 70 hk":0.52, "500 1.4 100 hk":0.60, "500 Abarth 1.4 T-Jet 135 hk":0.72,
    "500e 42 kWh (el)":1.40, "500e 87 kWh (el)":1.48,
    "Punto 1.2 69 hk":0.58, "Tipo 1.4 95 hk":0.65, "Tipo 1.6 MultiJet 120 hk (diesel)":0.52,
    "500X 1.0 120 hk":0.70, "Panda 1.0 MHEV 70 hk":0.48, "600e (el)":1.55
  },
  "Ford": {
    "Fiesta 1.0 EcoBoost 95 hk":0.55, "Fiesta 1.0 EcoBoost 125 hk":0.58, "Fiesta 1.0 EcoBoost 125 hk Auto":0.61,
    "Fiesta ST 1.5 EcoBoost 200 hk":0.82,
    "Focus 1.0 EcoBoost 125 hk":0.62, "Focus 1.0 EcoBoost 125 hk Auto":0.65,
    "Focus 1.0 EcoBoost 155 hk":0.65, "Focus 1.5 EcoBoost 182 hk":0.70, "Focus ST 2.0 EcoBoost 280 hk":0.92,
    "Focus 1.5 EcoBlue 95 hk (diesel)":0.50, "Focus 1.5 EcoBlue 120 hk (diesel)":0.52, "Focus 1.5 EcoBlue 120 hk Auto (diesel)":0.55,
    "Mondeo 1.5 EcoBoost 165 hk":0.78, "Mondeo 2.0 EcoBoost 240 hk":0.88, "Mondeo Hybrid 187 hk":0.62,
    "Mondeo 2.0 EcoBlue 150 hk (diesel)":0.58, "Mondeo 2.0 EcoBlue 180 hk (diesel)":0.62,
    "Mustang 2.3 EcoBoost 290 hk":1.05, "Mustang 5.0 V8 449 hk":1.40,
    "Mustang Mach-E 75 kWh RWD (el)":1.80, "Mustang Mach-E 99 kWh AWD (el)":1.95, "Mustang Mach-E GT (el)":2.10,
    "Kuga 1.5 EcoBoost 150 hk":0.82, "Kuga 1.5 EcoBoost 150 hk Auto":0.85,
    "Kuga 2.5 FHEV 190 hk Hybrid":0.68, "Kuga PHEV 225 hk":0.52, "Kuga 2.0 EcoBlue 150 hk (diesel)":0.63,
    "Explorer 2.3 EcoBoost 249 hk":1.15, "Explorer PHEV 457 hk":0.75,
    "Puma 1.0 EcoBoost 125 hk":0.60, "Puma 1.0 EcoBoost 125 hk Auto":0.63,
    "Puma 1.0 EcoBoost 155 hk":0.62, "Puma ST 1.5 EcoBoost 200 hk":0.85,
    "EcoSport 1.0 EcoBoost 125 hk":0.68, "Capri (el)":1.80
  },
  "Genesis": {
    "G70 2.0 T 252 hk":0.80, "G70 3.3 Twin Turbo 370 hk":1.08, "G70 2.2 D 202 hk (diesel)":0.60,
    "G80 2.5 T 304 hk":0.88, "G80 3.5 T 380 hk":1.05, "G80 2.2 D 202 hk (diesel)":0.68, "G80 (el)":1.90,
    "GV70 2.5 T 304 hk":0.92, "GV70 3.5 T 380 hk":1.10, "GV70 2.2 D 202 hk (diesel)":0.72, "GV70 Electrified (el)":1.95,
    "GV80 2.5 T 300 hk":1.02, "GV80 3.5 T 380 hk":1.18, "GV80 2.2 D 202 hk (diesel)":0.80,
    "GV60 (el)":1.85, "GV60 Performance (el)":2.00
  },
  "Honda": {
    "Jazz 1.5 e:HEV Hybrid 109 hk":0.50, "Civic 1.0 VTEC Turbo 126 hk":0.62, "Civic 1.5 VTEC Turbo 182 hk":0.68,
    "Civic e:HEV 2.0 Hybrid 184 hk":0.52, "Civic Type R 2.0 VTEC Turbo 329 hk":1.02,
    "Accord 2.0 e:HEV Hybrid 215 hk":0.65,
    "CR-V 1.5 VTEC Turbo 193 hk":0.80, "CR-V 2.0 e:HEV Hybrid 184 hk":0.68, "CR-V e:PHEV 184 hk":0.50,
    "HR-V 1.5 e:HEV Hybrid 131 hk":0.65, "ZR-V 2.0 e:HEV Hybrid 184 hk":0.72,
    "e (el)":1.80, "e:Ny1 (el)":1.70
  },
  "Hyundai": {
    "i10 1.0 67 hk":0.50, "i10 1.0 T-GDI 100 hk":0.55, "i10 1.0 T-GDI 100 hk AMT":0.57,
    "i20 1.0 T-GDI 100 hk":0.56, "i20 1.0 T-GDI 100 hk DCT":0.59,
    "i20 1.0 T-GDI 120 hk":0.60, "i20 1.0 T-GDI 120 hk DCT":0.63, "i20 N Line 1.0 T-GDI 120 hk":0.62, "i20 N 1.6 T-GDI 204 hk":0.88,
    "i30 1.0 T-GDI 120 hk":0.62, "i30 1.0 T-GDI 120 hk DCT":0.65,
    "i30 1.5 T-GDI 160 hk":0.68, "i30 1.5 T-GDI 160 hk DCT":0.71,
    "i30 2.0 T-GDI 275 hk N":0.98, "i30 N 2.0 T-GDI 280 hk":0.98,
    "Tucson 1.6 T-GDI 150 hk":0.80, "Tucson 1.6 T-GDI 150 hk DCT":0.83,
    "Tucson 1.6 T-GDI Hybrid 230 hk":0.70, "Tucson 1.6 T-GDI Hybrid 230 hk 4x4":0.75,
    "Tucson 2.0 T-GDI 265 hk 4x4":0.95, "Tucson PHEV 265 hk":0.55,
    "Tucson 1.6 CRDi 115 hk (diesel)":0.62, "Tucson 2.0 CRDi 185 hk (diesel)":0.68,
    "Santa Fe 2.5 T-GDI 277 hk":0.98, "Santa Fe 1.6 T-GDI Hybrid 230 hk":0.82,
    "Santa Fe PHEV 291 hk":0.60, "Santa Fe 2.2 CRDi 202 hk (diesel)":0.72,
    "Kona 1.0 T-GDI 120 hk":0.68, "Kona 1.0 T-GDI 120 hk DCT":0.71,
    "Kona 1.6 T-GDI 198 hk":0.80, "Kona N 2.0 T-GDI 280 hk":1.00,
    "Kona Electric 39 kWh (el)":1.50, "Kona Electric 65 kWh (el)":1.65,
    "IONIQ 5 58 kWh RWD (el)":1.70, "IONIQ 5 72 kWh RWD (el)":1.80, "IONIQ 5 72 kWh AWD (el)":1.90, "IONIQ 5 N (el)":2.10,
    "IONIQ 6 53 kWh RWD (el)":1.50, "IONIQ 6 77 kWh RWD (el)":1.60, "IONIQ 6 77 kWh AWD (el)":1.72,
    "IONIQ 9 110 kWh (el)":2.10
  },
  "Jaguar": {
    "XE 2.0 P250 250 hk":0.80, "XE 2.0 D165 165 hk (diesel)":0.60, "XE 2.0 D204 204 hk (diesel)":0.62,
    "XF 2.0 P250 250 hk":0.85, "XF 2.0 P300 300 hk":0.92, "XF 2.0 D204 204 hk (diesel)":0.65, "XF 3.0 D300 300 hk (diesel)":0.70,
    "F-Pace 2.0 P300 300 hk":0.98, "F-Pace SVR 5.0 V8 550 hk":1.42,
    "F-Pace 2.0 D204 204 hk (diesel)":0.72, "F-Pace 3.0 D300 300 hk (diesel)":0.78,
    "E-Pace 1.5 P160 160 hk":0.82, "F-Type 2.0 P300 300 hk":1.05, "F-Type R 5.0 V8 575 hk":1.45,
    "I-Pace (el)":2.05
  },
  "Jeep": {
    "Renegade 1.3 T4 150 hk":0.80, "Renegade 4xe PHEV 240 hk":0.50,
    "Compass 1.3 T4 150 hk":0.80, "Compass 4xe PHEV 240 hk":0.50,
    "Grand Cherokee 2.0 T 272 hk":1.10, "Grand Cherokee 3.6 V6 293 hk":1.25, "Grand Cherokee 4xe PHEV 380 hk":0.68,
    "Wrangler 2.0 T 272 hk":1.20, "Wrangler 4xe PHEV 380 hk":0.72,
    "Avenger 1.2 T 100 hk":0.72, "Avenger (el)":1.60
  },
  "Kia": {
    "Picanto 1.0 67 hk":0.50, "Picanto 1.0 T-GDI 100 hk":0.55,
    "Picanto 1.0 67 hk":0.50, "Picanto 1.0 T-GDI 100 hk":0.55, "Picanto 1.2 84 hk":0.52,
    "Rio 1.0 T-GDI 100 hk":0.58, "Rio 1.0 T-GDI 100 hk DCT":0.61,
    "Rio 1.0 T-GDI 120 hk":0.62, "Rio 1.0 T-GDI 120 hk DCT":0.65,
    "Ceed 1.0 T-GDI 120 hk":0.62, "Ceed 1.0 T-GDI 120 hk DCT":0.65,
    "Ceed 1.5 T-GDI 160 hk":0.68, "Ceed 1.5 T-GDI 160 hk DCT":0.71,
    "ProCeed 1.5 T-GDI 160 hk":0.70, "ProCeed 1.5 T-GDI 160 hk DCT":0.73, "Ceed GT 1.6 T-GDI 204 hk":0.88,
    "XCeed 1.0 T-GDI 120 hk":0.70, "XCeed 1.5 T-GDI 160 hk DCT":0.75,
    "Stinger 2.0 T-GDI 255 hk":0.95, "Stinger 3.3 T-GDI 370 hk":1.12,
    "Sportage 1.6 T-GDI 150 hk":0.80, "Sportage 1.6 T-GDI 150 hk DCT":0.83,
    "Sportage 1.6 T-GDI HEV 230 hk":0.68, "Sportage 1.6 T-GDI HEV 230 hk 4x4":0.73,
    "Sportage 1.6 T-GDI 230 hk 4x4":0.92, "Sportage PHEV 265 hk":0.55,
    "Sportage 1.6 CRDi 136 hk (diesel)":0.62, "Sportage 2.0 CRDi 185 hk (diesel)":0.68,
    "Sorento 1.6 T-GDI HEV 230 hk":0.78, "Sorento 2.5 T-GDI 281 hk":1.00,
    "Sorento PHEV 291 hk":0.60, "Sorento 2.2 CRDi 202 hk (diesel)":0.78,
    "Niro 1.6 GDI HEV 141 hk":0.62, "Niro PHEV 183 hk":0.48, "Niro EV 65 kWh (el)":1.65,
    "EV6 58 kWh RWD (el)":1.55, "EV6 77 kWh RWD (el)":1.65, "EV6 77 kWh AWD (el)":1.78, "EV6 GT (el)":2.10,
    "EV9 76 kWh RWD (el)":2.00, "EV9 99 kWh AWD (el)":2.10, "EV3 (el)":1.55
  },
  "Lancia": {
    "Ypsilon 1.0 Hybrid 70 hk":0.55, "Ypsilon (el)":1.55
  },
  "Land Rover": {
    "Defender 90 2.0 P300 300 hk":1.10, "Defender 90 3.0 P400 400 hk":1.20, "Defender 90 5.0 V8 525 hk":1.55,
    "Defender 90 2.0 D200 200 hk (diesel)":0.82, "Defender 90 3.0 D300 300 hk (diesel)":0.88,
    "Defender 110 2.0 P300 300 hk":1.15, "Defender 110 3.0 P400 400 hk":1.25,
    "Defender 110 2.0 D200 200 hk (diesel)":0.85, "Defender 110 3.0 D300 300 hk (diesel)":0.92,
    "Discovery 2.0 P300 300 hk":1.12, "Discovery 3.0 D300 300 hk (diesel)":0.88,
    "Discovery Sport 2.0 P250 249 hk":0.95, "Discovery Sport PHEV 309 hk":0.58,
    "Discovery Sport 2.0 D150 150 hk (diesel)":0.70, "Discovery Sport 2.0 D200 200 hk (diesel)":0.75,
    "Range Rover Evoque 2.0 P300 300 hk":0.98, "Range Rover Evoque PHEV 309 hk":0.55,
    "Range Rover Evoque 2.0 D150 150 hk (diesel)":0.68, "Range Rover Evoque 2.0 D200 200 hk (diesel)":0.72,
    "Range Rover Sport 3.0 P360 360 hk":1.12, "Range Rover Sport 4.4 P530 530 hk":1.35, "Range Rover Sport SVR 5.0 V8 575 hk":1.55,
    "Range Rover Sport PHEV 440 hk":0.68, "Range Rover Sport 3.0 D300 300 hk (diesel)":0.85,
    "Range Rover 3.0 P360 360 hk":1.18, "Range Rover 4.4 P530 530 hk":1.42,
    "Range Rover PHEV 510 hk":0.75, "Range Rover 3.0 D300 300 hk (diesel)":0.90
  },
  "Lexus": {
    "IS 300h 2.5 Hybrid 223 hk":0.65, "IS 500 5.0 V8 472 hk":1.20,
    "ES 300h 2.5 Hybrid 218 hk":0.60,
    "NX 250h 2.5 Hybrid 207 hk":0.68, "NX 350h 2.5 Hybrid 244 hk":0.72, "NX 450h+ PHEV 309 hk":0.45,
    "UX 250h 2.0 Hybrid 184 hk":0.55, "UX 300e (el)":1.90,
    "RX 350h 2.5 Hybrid 250 hk":0.78, "RX 450h+ PHEV 309 hk":0.50, "RX 500h 2.4 T Hybrid 371 hk":0.85,
    "LC 500 5.0 V8 477 hk":1.10, "LC 500h 3.5 Hybrid 359 hk":0.90
  },
  "Lotus": {
    "Emira 2.0 T AMG 360 hk":1.02, "Emira V6 3.5 400 hk":1.10,
    "Eletre S (el)":2.15, "Eletre R (el)":2.30, "Emeya (el)":2.00, "Emeya R (el)":2.20
  },
  "Lucid": {
    "Air Pure (el)":1.55, "Air Touring (el)":1.65, "Air Grand Touring (el)":1.75, "Air Sapphire (el)":2.10
  },
  "Maserati": {
    "Ghibli 2.0 Mild Hybrid 330 hk":1.00, "Ghibli 3.0 V6 350 hk":1.10, "Ghibli 3.0 V6 Diesel (diesel)":0.78, "Ghibli Trofeo 3.8 V8 580 hk":1.42,
    "Levante 2.0 Mild Hybrid 330 hk":1.12, "Levante 3.0 V6 350 hk":1.18, "Levante 3.0 V6 275 hk (diesel)":0.88, "Levante Trofeo 3.8 V8 580 hk":1.55,
    "GranTurismo 3.0 Nettuno V6 490 hk":1.30, "GranTurismo Folgore (el)":2.10,
    "Grecale 2.0 MHEV 300 hk":1.00, "Grecale Trofeo 3.0 V6 530 hk":1.28, "Grecale Folgore (el)":2.00
  },
  "Mazda": {
    "Mazda 2 1.5 90 hk":0.52, "Mazda 2 Hybrid 116 hk":0.48,
    "Mazda 3 2.0 Skyactiv-G 122 hk":0.65, "Mazda 3 2.0 Skyactiv-G 122 hk Automat":0.68,
    "Mazda 3 2.0 Skyactiv-G 150 hk":0.68, "Mazda 3 2.0 Skyactiv-G 150 hk Automat":0.71,
    "Mazda 3 2.0 Skyactiv-X 186 hk":0.68, "Mazda 3 Turbo 2.5 265 hk":0.88,
    "Mazda 3 1.8 Skyactiv-D 116 hk (diesel)":0.52, "Mazda 3 2.2 Skyactiv-D 184 hk (diesel)":0.58,
    "Mazda 6 2.0 Skyactiv-G 165 hk":0.75, "Mazda 6 2.5 Skyactiv-G 194 hk":0.82,
    "Mazda 6 2.0 Skyactiv-D 145 hk (diesel)":0.58, "Mazda 6 2.2 Skyactiv-D 175 hk (diesel)":0.62,
    "CX-30 2.0 Skyactiv-G 122 hk":0.68, "CX-30 2.0 Skyactiv-G 150 hk":0.72, "CX-30 2.0 Skyactiv-G 150 hk Automat":0.75,
    "CX-30 2.0 Skyactiv-X 186 hk":0.75, "CX-30 2.0 e-Skyactiv G 150 hk":0.72,
    "CX-5 2.0 Skyactiv-G 165 hk":0.80, "CX-5 2.0 Skyactiv-G 165 hk Automat":0.83,
    "CX-5 2.5 Skyactiv-G 194 hk":0.88, "CX-5 2.5 Skyactiv-G 194 hk Automat":0.91, "CX-5 2.5 Turbo 230 hk":0.95,
    "CX-5 2.2 Skyactiv-D 150 hk (diesel)":0.62, "CX-5 2.2 Skyactiv-D 184 hk (diesel)":0.65,
    "CX-60 2.5 PHEV 327 hk":0.50, "CX-60 e-Skyactiv D 254 hk (diesel)":0.65, "CX-60 3.3 e-Skyactiv D 280 hk (diesel)":0.68,
    "CX-90 3.3 Turbo 254 hk":0.98, "CX-90 PHEV 323 hk":0.62,
    "MX-5 1.5 132 hk":0.68, "MX-5 2.0 184 hk":0.72, "MX-30 (el)":1.70
  },
  "Mercedes-Benz": {
    "A 180 1.3 136 hk":0.65, "A 200 1.3 163 hk":0.68, "A 250 2.0 224 hk":0.78,
    "A 180 d 1.5 116 hk (diesel)":0.52, "A 200 d 2.0 150 hk (diesel)":0.55, "A 220 d 2.0 190 hk (diesel)":0.58,
    "A 250 e PHEV 218 hk":0.45, "A 45 S AMG 2.0 421 hk":1.05,
    "B 180 1.3 136 hk":0.68, "B 200 1.3 163 hk":0.72, "B 250 e PHEV 218 hk":0.48,
    "C 180 1.5 170 hk":0.70, "C 200 1.5 204 hk":0.75, "C 300 2.0 258 hk":0.85,
    "C 180 d 2.0 122 hk (diesel)":0.55, "C 200 d 2.0 163 hk (diesel)":0.58, "C 220 d 2.0 200 hk (diesel)":0.60, "C 300 d 2.0 265 hk (diesel)":0.65,
    "C 300 e PHEV 313 hk":0.50, "C 43 AMG 3.0 T 408 hk":1.00,
    "E 200 2.0 204 hk":0.82, "E 300 2.0 258 hk":0.90, "E 450 3.0 367 hk":1.05,
    "E 200 d 2.0 163 hk (diesel)":0.62, "E 220 d 2.0 200 hk (diesel)":0.64, "E 300 d 2.0 265 hk (diesel)":0.68,
    "E 300 e PHEV 313 hk":0.55, "E 53 AMG 3.0 T 435 hk":1.10, "E 63 AMG S 4.0 V8 612 hk":1.40,
    "S 450 3.0 367 hk":1.10, "S 500 3.0 449 hk":1.20, "S 580 4.0 V8 503 hk":1.35,
    "S 350 d 3.0 286 hk (diesel)":0.80, "S 400 d 3.0 330 hk (diesel)":0.82,
    "S 500 e PHEV 510 hk":0.72, "S 63 AMG 4.0 V8 612 hk":1.48,
    "CLA 180 1.3 136 hk":0.68, "CLA 250 2.0 224 hk":0.82, "CLA 45 S AMG 2.0 421 hk":1.08,
    "GLA 200 1.3 163 hk":0.75, "GLA 250 2.0 224 hk":0.85, "GLA 200 d 2.0 150 hk (diesel)":0.60, "GLA 250 e PHEV 218 hk":0.50, "GLA 45 S AMG 421 hk":1.10,
    "GLB 200 1.3 163 hk":0.80, "GLB 250 2.0 224 hk":0.88, "GLB 200 d 2.0 150 hk (diesel)":0.62, "GLB 250 e PHEV 218 hk":0.52,
    "GLC 200 2.0 204 hk":0.88, "GLC 300 2.0 258 hk":0.95, "GLC 300 e PHEV 313 hk":0.58, "GLC 43 AMG 3.0 T 421 hk":1.10,
    "GLC 200 d 2.0 163 hk (diesel)":0.68, "GLC 220 d 2.0 197 hk (diesel)":0.70, "GLC 300 d 2.0 265 hk (diesel)":0.72,
    "GLE 450 3.0 367 hk":1.08, "GLE 53 AMG 3.0 T 449 hk":1.20, "GLE 63 AMG S 4.0 V8 612 hk":1.50,
    "GLE 300 d 2.0 265 hk (diesel)":0.80, "GLE 400 d 3.0 330 hk (diesel)":0.85,
    "GLS 450 3.0 367 hk":1.18, "GLS 400 d 3.0 330 hk (diesel)":0.90,
    "G 500 4.0 V8 422 hk":1.65, "G 63 AMG 4.0 V8 585 hk":1.90,
    "EQA 250 (el)":1.75, "EQA 300 4MATIC (el)":1.88,
    "EQB 250 (el)":1.80, "EQB 300 4MATIC (el)":1.90,
    "EQC 400 4MATIC (el)":2.10,
    "EQE 300 (el)":1.70, "EQE 350 (el)":1.75, "EQE 500 4MATIC (el)":1.85, "EQE 53 AMG (el)":2.00,
    "EQS 450 (el)":1.75, "EQS 580 4MATIC (el)":1.85, "EQS 53 AMG (el)":2.10
  },
  "MG": {
    "MG3 1.5 106 hk":0.65,
    "MG ZS 1.5 106 hk":0.70, "MG ZS EV Standard Range (el)":1.60, "MG ZS EV Long Range (el)":1.72,
    "MG4 EV Standard 51 kWh (el)":1.48, "MG4 EV Long Range 64 kWh (el)":1.55, "MG4 EV Extended 77 kWh (el)":1.62, "MG4 EV XPOWER AWD (el)":1.75,
    "MG5 EV Standard Range (el)":1.58, "MG5 EV Long Range (el)":1.68,
    "MG Marvel R (el)":1.85, "MG HS 1.5 T 162 hk":0.80, "MG HS PHEV 258 hk":0.50,
    "MG Cyberster (el)":1.80
  },
  "Mini": {
    "Cooper 1.5 136 hk":0.65, "Cooper S 2.0 178 hk":0.75, "Cooper S 2.0 204 hk":0.78, "John Cooper Works 2.0 231 hk":0.92,
    "Cooper SE (el)":1.60, "Cooper C (el)":1.55, "Cooper S (el)":1.65,
    "Clubman Cooper S 2.0 192 hk":0.75,
    "Countryman Cooper S 2.0 192 hk":0.78, "Countryman Cooper SE ALL4 PHEV 224 hk":0.50, "Countryman JCW 2.0 306 hk":1.00, "Countryman (el)":1.75,
    "Aceman (el)":1.60
  },
  "Mitsubishi": {
    "Colt 1.0 T 90 hk":0.58, "Colt 1.3 T 143 hk":0.65,
    "Lancer 1.5 109 hk":0.70, "Lancer EVO X 2.0 Turbo 295 hk":1.15,
    "Eclipse Cross 1.5 T 163 hk":0.82, "Eclipse Cross PHEV 188 hk":0.52,
    "Outlander 2.5 165 hk":0.92, "Outlander PHEV 301 hk":0.55,
    "ASX 1.0 T 101 hk":0.68, "ASX 1.3 T 158 hk":0.75,
    "L200 2.2 D 150 hk (diesel)":0.90, "L200 2.2 D 180 hk (diesel)":0.95
  },
  "Nio": {
    "ET5 75 kWh Standard Range (el)":1.60, "ET5 100 kWh Long Range (el)":1.72, "ET5 Touring (el)":1.72,
    "ET7 75 kWh (el)":1.78, "ET7 100 kWh (el)":1.85,
    "EL6 75 kWh (el)":1.80, "EL6 100 kWh (el)":1.90,
    "EL8 100 kWh (el)":2.00
  },
  "Nissan": {
    "Micra 1.0 IG-T 100 hk":0.55,
    "Juke 1.0 DIG-T 117 hk":0.68, "Juke 1.6 Hybrid 143 hk":0.62,
    "Qashqai 1.3 DIG-T 140 hk":0.75, "Qashqai 1.3 DIG-T 158 hk":0.78, "Qashqai e-POWER 190 hk":0.65,
    "Qashqai 1.5 dCi 115 hk (diesel)":0.58,
    "X-Trail 1.5 T 163 hk":0.85, "X-Trail e-POWER 213 hk":0.72, "X-Trail 2.0 dCi 177 hk (diesel)":0.68,
    "Leaf 40 kWh (el)":1.55, "Leaf e+ 62 kWh (el)":1.65, "Ariya 63 kWh FWD (el)":1.80, "Ariya 87 kWh AWD (el)":2.00,
    "GT-R 3.8 V6 570 hk":1.55
  },
  "Opel": {
    "Corsa 1.2 75 hk":0.55, "Corsa 1.2 T 100 hk":0.58, "Corsa 1.2 T 100 hk AT8":0.61,
    "Corsa 1.2 T 130 hk":0.62, "Corsa 1.2 T 130 hk AT8":0.65, "Corsa 1.5 D 102 hk (diesel)":0.50, "Corsa-e (el)":1.55,
    "Astra 1.2 T 110 hk":0.62, "Astra 1.2 T 130 hk":0.65, "Astra 1.2 T 130 hk AT8":0.68,
    "Astra PHEV 180 hk":0.48, "Astra 1.5 D 130 hk (diesel)":0.52, "Astra-e (el)":1.65,
    "Insignia 1.5 T 140 hk":0.75, "Insignia 2.0 T 200 hk":0.82, "Insignia 2.0 D 170 hk (diesel)":0.60,
    "Mokka 1.2 T 100 hk":0.68, "Mokka 1.2 T 130 hk":0.72, "Mokka 1.2 T 130 hk AT8":0.75,
    "Mokka 1.5 D 110 hk (diesel)":0.55, "Mokka-e (el)":1.65,
    "Grandland 1.2 T 130 hk":0.82, "Grandland 1.2 T 130 hk AT8":0.85,
    "Grandland X 1.2 T 130 hk":0.82, "Grandland X PHEV 225 hk":0.50,
    "Grandland X 1.5 D 130 hk (diesel)":0.62, "Grandland X 1.5 D 130 hk AT8 (diesel)":0.65,
    "Crossland 1.2 T 110 hk":0.68, "Crossland 1.5 D 102 hk (diesel)":0.54
  },
  "Peugeot": {
    "108 1.0 VTi 72 hk":0.48,
    "108 1.0 VTi 72 hk":0.48,
    "208 1.2 PureTech 75 hk":0.55, "208 1.2 PureTech 100 hk":0.58, "208 1.2 PureTech 100 hk EAT8":0.61,
    "208 1.2 PureTech 130 hk":0.62, "208 1.2 PureTech 130 hk EAT8":0.65,
    "208 1.5 BlueHDi 100 hk (diesel)":0.48,
    "e-208 50 kWh (el)":1.45, "e-208 54 kWh (el)":1.48,
    "308 1.2 PureTech 110 hk":0.62, "308 1.2 PureTech 110 hk EAT8":0.65,
    "308 1.2 PureTech 130 hk":0.65, "308 1.2 PureTech 130 hk EAT8":0.68,
    "308 1.6 PureTech 180 hk":0.78, "308 1.6 PureTech 180 hk EAT8":0.81,
    "308 1.5 BlueHDi 130 hk (diesel)":0.52, "308 PHEV 225 hk":0.48, "e-308 (el)":1.60,
    "408 1.2 PureTech 130 hk":0.72, "408 1.2 PureTech 130 hk EAT8":0.75, "408 PHEV 225 hk":0.50, "e-408 (el)":1.68,
    "508 1.6 PureTech 180 hk":0.80, "508 1.6 PureTech 225 hk":0.85, "508 2.0 BlueHDi 160 hk (diesel)":0.60, "508 PHEV 360 hk":0.55,
    "2008 1.2 PureTech 100 hk":0.62, "2008 1.2 PureTech 100 hk EAT8":0.65, "2008 1.2 PureTech 130 hk":0.65, "2008 1.2 PureTech 130 hk EAT8":0.68, "2008 1.2 PureTech 155 hk EAT8":0.72, "2008 1.5 BlueHDi 110 hk (diesel)":0.52, "2008 1.5 BlueHDi 130 hk (diesel)":0.55, "e-2008 50 kWh (el)":1.55, "e-2008 54 kWh (el)":1.60,
    "3008 1.2 PureTech 130 hk":0.78, "3008 1.2 PureTech 130 hk EAT8":0.81,
    "3008 1.6 PureTech 180 hk EAT8":0.90,
    "3008 1.5 BlueHDi 130 hk (diesel)":0.60, "3008 PHEV 225 hk":0.50, "e-3008 73 kWh (el)":1.65, "e-3008 98 kWh (el)":1.72,
    "5008 1.2 PureTech 130 hk":0.85, "5008 1.2 PureTech 130 hk EAT8":0.88,
    "5008 1.5 BlueHDi 130 hk (diesel)":0.65, "5008 1.5 BlueHDi 130 hk EAT8 (diesel)":0.68,
    "5008 2.0 BlueHDi 180 hk (diesel)":0.72
  },
  "Polestar": {
    "Polestar 2 Standard Range Single Motor (el)":1.60, "Polestar 2 Long Range Single Motor (el)":1.68, "Polestar 2 Long Range Dual Motor (el)":1.78,
    "Polestar 3 Long Range Dual Motor (el)":2.00, "Polestar 3 Long Range Dual Motor Performance (el)":2.10,
    "Polestar 4 Long Range Single Motor (el)":1.70, "Polestar 4 Long Range Dual Motor (el)":1.80
  },
  "Porsche": {
    "718 Cayman 2.0 300 hk":0.88, "718 Cayman S 2.5 350 hk":0.98, "718 Cayman GTS 4.0 400 hk":1.05, "718 Cayman GT4 RS 4.0 500 hk":1.20,
    "718 Boxster 2.0 300 hk":0.88, "718 Boxster S 2.5 350 hk":0.98,
    "911 Carrera 3.0 385 hk":0.95, "911 Carrera S 3.0 450 hk":1.02, "911 Carrera 4S 3.0 450 hk":1.08, "911 Turbo S 3.8 650 hk":1.30, "911 GT3 4.0 510 hk":1.15,
    "Macan 2.0 T 265 hk":0.92, "Macan S 2.9 V6 380 hk":1.05, "Macan GTS 2.9 V6 440 hk":1.12, "Macan Turbo 2.9 V6 440 hk":1.15,
    "Macan (el)":1.90, "Macan 4 (el)":1.95, "Macan Turbo (el)":2.10,
    "Panamera 2.9 V6 330 hk":1.00, "Panamera 4 E-Hybrid PHEV 462 hk":0.68, "Panamera GTS 4.0 V8 480 hk":1.22, "Panamera Turbo S E-Hybrid PHEV 700 hk":0.88,
    "Cayenne 3.0 340 hk":1.10, "Cayenne S 2.9 V6 440 hk":1.20, "Cayenne GTS 4.0 V8 460 hk":1.30, "Cayenne Turbo 4.0 V8 550 hk":1.45,
    "Cayenne E-Hybrid PHEV 462 hk":0.65, "Cayenne 3.0 Diesel 262 hk (diesel)":0.82,
    "Taycan (el)":1.95, "Taycan 4S (el)":2.05, "Taycan GTS (el)":2.10, "Taycan Turbo (el)":2.18, "Taycan Turbo S (el)":2.30,
    "Taycan Sport Turismo (el)":1.98, "Taycan Cross Turismo (el)":2.05
  },
  "Renault": {
    "Twingo 1.0 65 hk":0.50, "Twingo Electric (el)":1.35,
    "Twingo 1.0 65 hk":0.50, "Twingo Electric (el)":1.35,
    "Clio 1.0 TCe 90 hk":0.55, "Clio 1.0 TCe 90 hk EDC":0.58,
    "Clio 1.0 TCe 100 hk":0.58, "Clio 1.0 TCe 100 hk EDC":0.61,
    "Clio 1.3 TCe 130 hk":0.62, "Clio 1.3 TCe 130 hk EDC":0.65,
    "Clio E-Tech Hybrid 145 hk":0.52, "Clio RS 1.8 T 220 hk":0.90,
    "Clio 1.5 dCi 85 hk (diesel)":0.50,
    "Megane 1.3 TCe 115 hk":0.62, "Megane 1.3 TCe 115 hk EDC":0.65,
    "Megane 1.3 TCe 140 hk":0.65, "Megane 1.3 TCe 140 hk EDC":0.68,
    "Megane E-Tech PHEV 160 hk":0.48, "Megane RS 1.8 T 280 hk":0.98,
    "Megane 1.5 dCi 110 hk (diesel)":0.52,
    "Megane E-Tech 40 kWh (el)":1.55, "Megane E-Tech 60 kWh (el)":1.62,
    "Captur 1.0 TCe 90 hk":0.65, "Captur 1.0 TCe 90 hk EDC":0.68,
    "Captur 1.3 TCe 140 hk":0.70, "Captur 1.3 TCe 140 hk EDC":0.73, "Captur E-Tech PHEV 160 hk":0.48,
    "Arkana 1.3 TCe 140 hk":0.72, "Arkana E-Tech Hybrid 145 hk":0.62,
    "Kadjar 1.3 TCe 140 hk":0.78, "Kadjar 1.5 dCi 115 hk (diesel)":0.62,
    "Koleos 2.0 dCi 175 hk (diesel)":0.88,
    "Talisman 1.3 TCe 140 hk":0.78, "Talisman E-Tech PHEV 225 hk":0.52,
    "Scenic E-Tech 60 kWh (el)":1.60, "Scenic E-Tech 87 kWh (el)":1.68,
    "Austral E-Tech Hybrid 200 hk":0.68, "Austral E-Tech PHEV 300 hk":0.52,
    "Zoe R110 52 kWh (el)":1.52,
    "5 E-Tech 40 kWh (el)":1.35, "5 E-Tech 52 kWh (el)":1.42
  },
  "Rolls-Royce": {
    "Ghost 6.75 V12 563 hk":2.00, "Ghost Extended 6.75 V12 563 hk":2.10,
    "Phantom 6.75 V12 571 hk":2.20, "Phantom Extended 6.75 V12 571 hk":2.30,
    "Wraith 6.6 V12 632 hk":2.10, "Dawn 6.6 V12 571 hk":2.05,
    "Cullinan 6.75 V12 571 hk":2.25, "Spectre (el)":2.50
  },
  "Saab": {
    "9-3 1.8 122 hk":0.75, "9-3 2.0 T 175 hk":0.85, "9-3 2.0 T Aero 250 hk":1.00, "9-3 2.8 V6 T 280 hk":1.08,
    "9-3 1.9 TiD 120 hk (diesel)":0.60, "9-3 1.9 TTiD 180 hk (diesel)":0.65,
    "9-5 2.0 T 150 hk":0.90, "9-5 2.3 T Aero 260 hk":1.08, "9-5 2.8 V6 T 300 hk":1.15
  },
  "SEAT": {
    "Ibiza 1.0 MPI 80 hk":0.55, "Ibiza 1.0 TSI 95 hk":0.58, "Ibiza 1.0 TSI 95 hk DSG":0.61,
    "Ibiza 1.0 TSI 110 hk":0.60, "Ibiza 1.0 TSI 110 hk DSG":0.63, "Ibiza FR 1.5 TSI 150 hk":0.68, "Ibiza FR 1.5 TSI 150 hk DSG":0.71,
    "Leon 1.0 TSI 90 hk":0.58, "Leon 1.5 TSI 130 hk":0.65, "Leon 1.5 TSI 130 hk DSG":0.68,
    "Leon 1.5 TSI 150 hk":0.68, "Leon 1.5 TSI 150 hk DSG":0.71,
    "Leon 2.0 TSI 190 hk":0.80, "Leon 2.0 TSI 190 hk DSG":0.83, "Leon e-Hybrid PHEV 204 hk":0.48,
    "Leon 2.0 TDI 115 hk (diesel)":0.50, "Leon 2.0 TDI 150 hk (diesel)":0.52,
    "Ateca 1.5 TSI 150 hk":0.75, "Ateca 1.5 TSI 150 hk DSG":0.78,
    "Ateca 2.0 TSI 190 hk":0.85, "Ateca 2.0 TSI 190 hk DSG":0.88, "Ateca 2.0 TSI 300 hk 4x4":0.98, "Ateca 2.0 TDI 150 hk (diesel)":0.60,
    "Tarraco 1.5 TSI 150 hk":0.88, "Tarraco 1.5 TSI 150 hk DSG":0.91,
    "Tarraco 2.0 TSI 190 hk 4x4":0.98, "Tarraco 2.0 TSI 190 hk DSG 4x4":1.01, "Tarraco 2.0 TDI 150 hk (diesel)":0.68,
    "Arona 1.0 TSI 110 hk":0.65, "Arona 1.0 TSI 110 hk DSG":0.68
  },
  "Skoda": {
    "Fabia 1.0 MPI 65 hk":0.52, "Fabia 1.0 TSI 95 hk":0.56, "Fabia 1.0 TSI 95 hk DSG":0.59,
    "Fabia 1.0 TSI 116 hk":0.60, "Fabia 1.0 TSI 116 hk DSG":0.63,
    "Fabia Monte Carlo 1.5 TSI 150 hk":0.70, "Fabia Monte Carlo 1.5 TSI 150 hk DSG":0.73,
    "Octavia 1.0 TSI 110 hk":0.65, "Octavia 1.0 TSI 110 hk DSG":0.68,
    "Octavia 1.5 TSI 150 hk":0.70, "Octavia 1.5 TSI 150 hk DSG":0.73,
    "Octavia 2.0 TSI 180 hk":0.80, "Octavia 2.0 TSI 180 hk DSG":0.83, "Octavia RS 2.0 TSI 245 hk":0.95, "Octavia RS 2.0 TSI 245 hk DSG":0.98,
    "Octavia 2.0 TDI 115 hk (diesel)":0.52, "Octavia 2.0 TDI 150 hk (diesel)":0.55, "Octavia 2.0 TDI 200 hk (diesel)":0.58,
    "Octavia iV PHEV 204 hk":0.48,
    "Superb 1.5 TSI 150 hk":0.78, "Superb 1.5 TSI 150 hk DSG":0.81,
    "Superb 2.0 TSI 200 hk":0.88, "Superb 2.0 TSI 280 hk":0.98, "Superb iV PHEV 218 hk":0.52,
    "Superb 2.0 TDI 150 hk (diesel)":0.58, "Superb 2.0 TDI 200 hk (diesel)":0.62,
    "Scala 1.0 TSI 95 hk":0.62, "Scala 1.0 TSI 95 hk DSG":0.65, "Scala 1.5 TSI 150 hk":0.68, "Scala 1.5 TSI 150 hk DSG":0.71,
    "Kamiq 1.0 TSI 95 hk":0.65, "Kamiq 1.0 TSI 110 hk":0.67, "Kamiq 1.0 TSI 110 hk DSG":0.69, "Kamiq 1.5 TSI 150 hk":0.72, "Kamiq 1.5 TSI 150 hk DSG":0.74, "Kamiq 2.0 TDI 115 hk (diesel)":0.54,
    "Karoq 1.0 TSI 116 hk":0.75, "Karoq 1.0 TSI 116 hk DSG":0.78,
    "Karoq 1.5 TSI 150 hk":0.82, "Karoq 1.5 TSI 150 hk DSG":0.85,
    "Karoq 2.0 TSI 190 hk":0.90, "Karoq 2.0 TDI 116 hk (diesel)":0.60, "Karoq 2.0 TDI 150 hk (diesel)":0.62,
    "Kodiaq 1.5 TSI 150 hk":0.88, "Kodiaq 1.5 TSI 150 hk DSG":0.91,
    "Kodiaq 2.0 TSI 190 hk":0.95, "Kodiaq 2.0 TSI 190 hk DSG":0.98, "Kodiaq RS 2.0 TSI 245 hk":1.05,
    "Kodiaq 2.0 TDI 150 hk (diesel)":0.68, "Kodiaq 2.0 TDI 200 hk (diesel)":0.72,
    "Enyaq 60 (el)":1.72, "Enyaq 80 (el)":1.82, "Enyaq 80x AWD (el)":1.90, "Enyaq RS (el)":2.00,
    "Elroq 50 (el)":1.60, "Elroq 85 (el)":1.65, "Elroq 85x AWD (el)":1.75
  },
  "Smart": {
    "#1 Pure (el)":1.65, "#1 Pro (el)":1.68, "#1 Brabus (el)":1.85,
    "#3 Pro (el)":1.72, "#3 Brabus (el)":1.90
  },
  "Subaru": {
    "Impreza 2.0 150 hk":0.78, "Impreza WRX 2.5 T 268 hk":1.05, "Impreza STI 2.5 T 301 hk":1.18,
    "Legacy 2.5 173 hk":0.88, "Outback 2.5 173 hk":0.95, "Outback 2.0D 150 hk (diesel)":0.72,
    "Forester 2.0 e-BOXER Hybrid 150 hk":0.80, "Forester 2.5 184 hk":0.90,
    "XV 2.0 e-BOXER Hybrid 150 hk":0.75, "BRZ 2.4 234 hk":0.85,
    "WRX 2.4 T 268 hk":1.05, "Solterra (el)":1.90
  },
  "Suzuki": {
    "Alto 1.0 66 hk":0.45, "Swift 1.0 Boosterjet 111 hk":0.55, "Swift 1.2 Hybrid MHEV 90 hk":0.50, "Swift Sport 1.4 Boosterjet 140 hk":0.75,
    "Baleno 1.2 Hybrid 90 hk":0.55, "Vitara 1.4 Boosterjet 129 hk":0.70, "Vitara 1.5 MHEV 102 hk":0.65,
    "SX4 S-Cross 1.4 Boosterjet 129 hk":0.72, "Jimny 1.5 102 hk":0.78,
    "Ignis 1.2 MHEV 83 hk":0.55, "Swace 1.8 Hybrid 122 hk":0.48, "Across PHEV 306 hk":0.55
  },
  "Tesla": {
    "Model 3 Standard Range (el)":1.45, "Model 3 Long Range AWD (el)":1.55, "Model 3 Performance (el)":1.65,
    "Model 3 Highland Long Range (el)":1.52, "Model 3 Highland Performance (el)":1.62,
    "Model Y Standard Range (el)":1.60, "Model Y Long Range AWD (el)":1.70, "Model Y Performance (el)":1.80,
    "Model Y Juniper Long Range (el)":1.68,
    "Model S Long Range (el)":1.70, "Model S Plaid (el)":1.90,
    "Model X Long Range (el)":2.00, "Model X Plaid (el)":2.20,
    "Cybertruck AWD (el)":2.80
  },
  "Toyota": {
    "Aygo X 1.0 72 hk":0.48,
    "Yaris 1.5 Hybrid 116 hk":0.48, "Yaris 1.5 125 hk":0.55,
    "GR Yaris 1.6 Turbo 261 hk":0.82, "GR Yaris 1.6 Turbo 300 hk Circuit":0.88,
    "Yaris Cross 1.5 Hybrid 116 hk":0.52,
    "Corolla 1.8 Hybrid 122 hk":0.55, "Corolla 2.0 Hybrid 184 hk":0.60, "Corolla GR Sport 2.0 Hybrid 197 hk":0.62,
    "Camry 2.5 Hybrid 218 hk":0.68,
    "C-HR 1.8 Hybrid 122 hk":0.62, "C-HR 2.0 Hybrid 197 hk":0.68,
    "Prius 2.5 Hybrid 223 hk":0.52, "Prius 2.0 PHEV 223 hk":0.48,
    "RAV4 2.5 Hybrid 222 hk":0.75, "RAV4 2.5 AWD-i Hybrid 222 hk":0.78, "RAV4 PHEV 306 hk":0.55, "RAV4 2.0 175 hk":0.80,
    "RAV4 2.5 D-4D 204 hk (diesel)":0.65,
    "bZ4X 71 kWh FWD (el)":1.80, "bZ4X 71 kWh AWD (el)":1.92,
    "Land Cruiser 2.8 D 204 hk (diesel)":0.95, "Land Cruiser 3.3 D 309 hk (diesel)":0.98,
    "Highlander 2.5 AWD Hybrid 248 hk":0.88,
    "Crown 2.5 PHEV 300 hk":0.58
  },
  "Volkswagen": {
    "Polo 1.0 MPI 80 hk":0.55, "Polo 1.0 TSI 95 hk":0.58, "Polo 1.0 TSI 95 hk DSG":0.61,
    "Polo 1.0 TSI 110 hk":0.62, "Polo 1.0 TSI 110 hk DSG":0.65, "Polo GTI 2.0 TSI 207 hk":0.88, "Polo GTI 2.0 TSI 207 hk DSG":0.91,
    "Golf 1.0 TSI 110 hk":0.62, "Golf 1.0 TSI 110 hk DSG":0.65,
    "Golf 1.0 eTSI 110 hk MHEV":0.60, "Golf 1.5 TSI 130 hk":0.65, "Golf 1.5 TSI 130 hk DSG":0.68,
    "Golf 1.5 eTSI 150 hk MHEV":0.62,
    "Golf GTI 2.0 TSI 245 hk":0.92, "Golf GTI Clubsport 300 hk":1.00, "Golf R 2.0 TSI 333 hk":1.08,
    "Golf 2.0 TDI 115 hk (diesel)":0.52, "Golf 2.0 TDI 150 hk (diesel)":0.55,
    "Golf eHybrid PHEV 204 hk":0.48, "Golf GTE PHEV 245 hk":0.52,
    "Passat 1.5 TSI 150 hk":0.75, "Passat 1.5 TSI 150 hk DSG":0.78,
    "Passat 2.0 TSI 190 hk":0.85, "Passat 2.0 TSI 190 hk DSG":0.88,
    "Passat 1.5 eTSI MHEV 150 hk":0.72, "Passat GTE PHEV 218 hk":0.52,
    "Passat 2.0 TDI 150 hk (diesel)":0.58, "Passat 2.0 TDI 200 hk (diesel)":0.62,
    "Arteon 2.0 TSI 190 hk":0.85, "Arteon 2.0 TSI 280 hk":0.95, "Arteon 2.0 TDI 150 hk (diesel)":0.65,
    "Tiguan 1.5 TSI 130 hk":0.78, "Tiguan 1.5 TSI 130 hk DSG":0.81,
    "Tiguan 1.5 eTSI MHEV 150 hk":0.75,
    "Tiguan 2.0 TSI 190 hk":0.88, "Tiguan 2.0 TSI 190 hk DSG":0.91, "Tiguan R 2.0 TSI 320 hk":1.02,
    "Tiguan eHybrid PHEV 245 hk":0.55, "Tiguan 2.0 TDI 150 hk (diesel)":0.62, "Tiguan 2.0 TDI 200 hk (diesel)":0.65,
    "T-Roc 1.0 TSI 110 hk":0.72, "T-Roc 1.0 TSI 110 hk DSG":0.75,
    "T-Roc 1.5 TSI 150 hk":0.78, "T-Roc 1.5 TSI 150 hk DSG":0.81,
    "T-Roc 2.0 TSI 190 hk":0.88, "T-Roc R 2.0 TSI 300 hk":1.02,
    "T-Roc 2.0 TDI 150 hk (diesel)":0.62,
    "T-Cross 1.0 TSI 95 hk":0.68, "T-Cross 1.0 TSI 95 hk DSG":0.71,
    "T-Cross 1.0 TSI 110 hk":0.72, "T-Cross 1.0 TSI 110 hk DSG":0.75,
    "Taigo 1.0 TSI 110 hk":0.70, "Taigo 1.0 TSI 110 hk DSG":0.73,
    "Touareg 3.0 V6 TSI 340 hk":1.05, "Touareg eHybrid PHEV 462 hk":0.68, "Touareg 3.0 TDI 231 hk (diesel)":0.78, "Touareg 3.0 TDI 286 hk (diesel)":0.82,
    "ID.3 45 kWh (el)":1.55, "ID.3 58 kWh (el)":1.65, "ID.3 77 kWh (el)":1.72, "ID.3 GTX Performance (el)":1.85,
    "ID.4 52 kWh (el)":1.72, "ID.4 77 kWh RWD (el)":1.82, "ID.4 77 kWh AWD (el)":1.92, "ID.4 GTX (el)":2.00,
    "ID.5 77 kWh (el)":1.85, "ID.5 GTX (el)":2.00,
    "ID.7 77 kWh (el)":1.68, "ID.7 Tourer 77 kWh (el)":1.72, "ID.7 GTX (el)":1.80,
    "ID.Buzz 77 kWh (el)":2.00, "ID.Buzz LWB 7-sits (el)":2.10
  },
  "Volvo": {
    "S60 B3 163 hk":0.68, "S60 B4 197 hk":0.75, "S60 B5 AWD 250 hk":0.82, "S60 T8 PHEV 455 hk":0.55,
    "V60 B3 163 hk":0.70, "V60 B4 197 hk":0.78, "V60 B5 AWD 250 hk":0.85, "V60 T8 PHEV 455 hk":0.55,
    "V60 B4 D (diesel)":0.55, "V60 B5 D AWD (diesel)":0.60,
    "V60 Cross Country B4 197 hk":0.82, "V60 Cross Country B5 AWD 250 hk":0.88,
    "V70 2.0 T 203 hk":0.85, "V70 2.4 D5 163 hk (diesel)":0.65,
    "V90 B4 197 hk":0.80, "V90 B5 AWD 250 hk":0.88, "V90 B6 AWD 300 hk":0.95, "V90 T8 PHEV 455 hk":0.58,
    "V90 B4 D (diesel)":0.58, "V90 B5 D AWD (diesel)":0.62,
    "V90 Cross Country B5 AWD 250 hk":0.92, "V90 Cross Country B5 D AWD (diesel)":0.65,
    "S90 B4 197 hk":0.82, "S90 B5 AWD 250 hk":0.90, "S90 B6 AWD 300 hk":0.98, "S90 T8 PHEV 455 hk":0.58,
    "XC40 B3 163 hk":0.75, "XC40 B4 197 hk":0.80, "XC40 B5 AWD 247 hk":0.88, "XC40 T5 PHEV 262 hk":0.55,
    "XC40 B4 D (diesel)":0.60,
    "XC40 Recharge Single Motor (el)":1.75, "XC40 Recharge Twin Motor AWD (el)":1.90,
    "EX30 Single Motor 272 hk (el)":1.50, "EX30 Single Motor Extended Range (el)":1.55, "EX30 Twin Motor Performance (el)":1.68,
    "EX40 Single Motor (el)":1.75, "EX40 Twin Motor AWD (el)":1.88,
    "EC40 Single Motor (el)":1.78, "EC40 Twin Motor AWD (el)":1.90,
    "EX90 Twin Motor (el)":2.00, "EX90 Twin Motor Performance (el)":2.10,
    "XC60 B4 197 hk":0.85, "XC60 B5 AWD 250 hk":0.92, "XC60 B6 AWD 300 hk":1.00, "XC60 T6 PHEV 340 hk":0.58, "XC60 T8 PHEV 455 hk":0.60,
    "XC60 D4 FWD 190 hk (diesel)":0.62, "XC60 D5 AWD 235 hk (diesel)":0.68,
    "XC70 2.0 T5 AWD 231 hk":0.98, "XC70 D5 AWD 220 hk (diesel)":0.75,
    "XC90 B5 AWD 250 hk":1.02, "XC90 B6 AWD 300 hk":1.10, "XC90 T8 PHEV 455 hk":0.65,
    "XC90 D5 AWD 235 hk (diesel)":0.75,
    "C30 1.6 100 hk":0.62, "C30 T5 230 hk":0.98, "C70 2.0 180 hk":0.85, "EM90 (el)":2.20
  },
  "VinFast": {
    "VF6 (el)":1.75, "VF7 (el)":1.88, "VF8 Standard Range (el)":1.95, "VF9 (el)":2.20
  },
  "Xpeng": {
    "G6 RWD (el)":1.70, "G6 AWD (el)":1.80, "G9 RWD (el)":1.88, "G9 AWD (el)":2.00, "P7 (el)":1.72, "X9 (el)":2.10
  },
  "Zeekr": {
    "001 WE (el)":1.68, "001 FR AWD (el)":1.85, "007 RWD (el)":1.55, "007 AWD (el)":1.65, "X (el)":1.60, "009 100 kWh (el)":2.10
  }
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

  var priceBtn = document.getElementById('bc-priceBtn');
  var priceBtnLbl = document.getElementById('bc-priceBtnLabel');

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
    if (priceBtn)    priceBtn.style.display  = 'none';
  } else if (bcIsDiesel) {
    if (consUnit)    consUnit.textContent    = 'l/10km';
    if (consHint)    consHint.innerHTML      = 'Dieselförbrukning per 10 km. Kompakt ca 0,5 &bull; mellanklass ca 0,55–0,65 &bull; SUV ca 0,65–0,80';
    if (priceLabel)  priceLabel.textContent  = 'Pris per liter (diesel)';
    if (priceUnit)   priceUnit.textContent   = 'SEK/l';
    if (card3Header) card3Header.textContent = 'Dieselpris';
    if (fLabel1)     fLabel1.textContent     = 'Liter åtgång';
    if (fExpr1)      fExpr1.textContent      = 'mil × l/10km';
    if (fExpr2)      fExpr2.textContent      = 'liter × SEK/liter';
    if (rLitersLbl)  rLitersLbl.textContent  = 'Dieselåtgång';
    if (rLitersUnit) rLitersUnit.textContent = 'liter';
    if (priceInput)  priceInput.placeholder  = 't.ex. 18.50';
    if (priceBtn)    priceBtn.style.display  = '';
    if (priceBtnLbl) priceBtnLbl.textContent = 'Hämta pris';
    // Hämta dieselpris om fältet är tomt
    var pEl = document.getElementById('bc-price');
    if (pEl && !pEl.value) setTimeout(bcFetchFuelPrice, 0);
  } else {
    if (consUnit)    consUnit.textContent    = 'l/10km';
    if (consHint)    consHint.innerHTML      = 'Fylls i automatiskt vid fordonsval &mdash; kan justeras manuellt. Liten bil ca 0,5–0,6 &bull; mellanklass ca 0,7–0,9 &bull; SUV ca 0,9–1,2';
    if (priceLabel)  priceLabel.textContent  = 'Pris per liter';
    if (priceUnit)   priceUnit.textContent   = 'SEK/l';
    if (card3Header) card3Header.textContent = 'Bränslepris';
    if (fLabel1)     fLabel1.textContent     = 'Liter åtgång';
    if (fExpr1)      fExpr1.textContent      = 'mil × l/10km';
    if (fExpr2)      fExpr2.textContent      = 'liter × SEK/liter';
    if (rLitersLbl)  rLitersLbl.textContent  = 'Bränsleåtgång';
    if (rLitersUnit) rLitersUnit.textContent = 'liter';
    if (priceInput)  priceInput.placeholder  = 't.ex. 19.50';
    if (priceBtn)    priceBtn.style.display  = '';
    if (priceBtnLbl) priceBtnLbl.textContent = 'Hämta pris';
  }
}

// ── Ladda EV-förbrukning dynamiskt från CarAdvice ────────────────
var BC_EV_CACHE_KEY = 'bc_ev_cache';
var BC_EV_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 timmar

function bcLoadEvConsumption() {
  // Försök läsa från localStorage-cache först
  try {
    var cached = localStorage.getItem(BC_EV_CACHE_KEY);
    if (cached) {
      var obj = JSON.parse(cached);
      if (Date.now() - obj.ts < BC_EV_CACHE_TTL) {
        bcApplyEvData(obj.data);
        return;
      }
    }
  } catch(e) {}

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
      try { localStorage.setItem(BC_EV_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: list })); } catch(e) {}
      bcApplyEvData(list);
    })
    .catch(function() { /* API otillgänglig — statisk DB räcker */ });
}

function bcApplyEvData(list) {
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
  var PREFIX_IN_MODEL = { 'MG4':true,'MG5':true };
  var TWO_WORD = { 'Land Rover':'Land Rover','Alfa Romeo':'Alfa Romeo','Range Rover':'Land Rover','Rolls-Royce':'Rolls-Royce' };

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

// ── Hämta aktuellt bränslepris ────────────────────────
var BC_FUEL_CACHE_KEY = 'bc_fuel_cache';
var BC_FUEL_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 timmar

// Ungefärliga fallback-priser (uppdateras manuellt vid behov)
var BC_FUEL_FALLBACK = { bensin95: 18.90, diesel: 17.50 };

// Senaste kända stad från GPS
var bcCurrentCity = null;
var bcCurrentLat  = null;
var bcCurrentLon  = null;

function bcFetchFuelPrice(city, lat, lon) {
  if (bcIsElectric) return;
  var btn  = document.getElementById('bc-priceBtn');
  var lbl  = document.getElementById('bc-priceBtnLabel');
  var hint = document.getElementById('bc-priceHint');
  if (btn) { btn.disabled = true; btn.classList.add('fetching'); }
  if (lbl) lbl.textContent = 'Hämtar...';
  if (hint) { hint.textContent = 'Hämtar aktuellt pris...'; hint.className = 'bc-hint loading'; }

  // Bygg cache-nyckel per stad (eller global)
  var cacheKey = BC_FUEL_CACHE_KEY + (city ? '_' + city : '');
  var cached = null;
  try {
    var c = localStorage.getItem(cacheKey);
    if (c) {
      var obj = JSON.parse(c);
      if (Date.now() - obj.ts < BC_FUEL_CACHE_TTL) cached = obj.data;
    }
  } catch(e) {}

  function applyPrice(data) {
    var price = bcIsDiesel ? data.diesel : data.bensin95;
    var priceEl = document.getElementById('bc-price');
    if (priceEl) priceEl.value = price.toFixed(2);
    if (hint) {
      var location = data._city ? ' i ' + data._city : '';
      var src = data._source === 'fallback'
        ? 'Ungefärligt rikspris' + location + ' · kan variera lokalt'
        : 'Aktuellt pris' + location + ' · uppdaterat ' + (data.updated || 'idag');
      hint.textContent = src;
      hint.className = 'bc-hint';
    }
    if (btn) { btn.disabled = false; btn.classList.remove('fetching'); }
    if (lbl) lbl.textContent = 'Hämta pris';
  }

  if (cached) { applyPrice(cached); return; }

  // Bygg URL med platsparametrar om de finns
  var url = 'https://bilresa.onrender.com/api/fuel-price';
  var params = [];
  if (city) params.push('city=' + encodeURIComponent(city));
  if (lat)  params.push('lat=' + lat);
  if (lon)  params.push('lon=' + lon);
  if (params.length) url += '?' + params.join('&');

  fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('no data');
      return r.json();
    })
    .then(function(data) {
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: data })); } catch(e) {}
      applyPrice(data);
    })
    .catch(function() {
      var fallback = { bensin95: BC_FUEL_FALLBACK.bensin95, diesel: BC_FUEL_FALLBACK.diesel, _source: 'fallback', _city: city || null };
      applyPrice(fallback);
    });
}

function bcAutoFetchFuelPrice(city, lat, lon) {
  if (bcIsElectric) return;
  bcFetchFuelPrice(city || bcCurrentCity || null, lat || bcCurrentLat || null, lon || bcCurrentLon || null);
}

// ── Autocomplete för startpunkt ───────────────────────
var bcSuggestTimer  = null;
var bcSuggestEl     = null;

function bcInitStartAutocomplete() {
  var startEl = document.getElementById('bc-start');
  if (!startEl) return;
  var wrap = startEl.closest('.bc-input-wrap');
  if (!wrap) return;

  bcSuggestEl = document.createElement('ul');
  bcSuggestEl.className = 'bc-suggestions';
  bcSuggestEl.style.display = 'none';
  wrap.appendChild(bcSuggestEl);

  startEl.addEventListener('input', function() {
    bcStartLat = null; bcStartLon = null;
    var val = startEl.value.trim();
    clearTimeout(bcSuggestTimer);
    if (val.length < 2) { bcHideSuggestions(); return; }
    bcSuggestTimer = setTimeout(function() { bcFetchSuggestions(val); }, 320);
  });

  startEl.addEventListener('blur', function() {
    setTimeout(bcHideSuggestions, 180);
  });

  startEl.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') bcHideSuggestions();
  });
}

function bcFetchSuggestions(query) {
  fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
        '&format=json&limit=5&accept-language=sv&countrycodes=se,no,dk,fi')
    .then(function(r) { return r.json(); })
    .then(bcShowSuggestions)
    .catch(bcHideSuggestions);
}

function bcShowSuggestions(results) {
  if (!bcSuggestEl || !results) { bcHideSuggestions(); return; }
  bcSuggestEl.innerHTML = '';
  if (!results.length) { bcSuggestEl.style.display = 'none'; return; }
  results.forEach(function(item) {
    var li   = document.createElement('li');
    li.className = 'bc-suggestion-item';
    var parts = (item.display_name || '').split(',');
    var label = parts.slice(0, 3).join(',').trim();
    li.textContent = label;
    li.title = item.display_name || '';
    li.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var el = document.getElementById('bc-start');
      if (el) el.value = label;
      bcStartLat = parseFloat(item.lat);
      bcStartLon = parseFloat(item.lon);
      bcHideSuggestions();
      bcAutoRoute();
    });
    bcSuggestEl.appendChild(li);
  });
  bcSuggestEl.style.display = 'block';
}

function bcHideSuggestions() {
  if (bcSuggestEl) bcSuggestEl.style.display = 'none';
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
          // Spara stad och position för priset
          bcCurrentCity = city;
          bcCurrentLat  = bcStartLat;
          bcCurrentLon  = bcStartLon;
          bcSetGpsHint('', '');
          if (btn) { btn.disabled = false; btn.classList.remove('fetching'); }
          var lbl3 = document.getElementById('bc-gpsBtnLabel');
          if (lbl3) lbl3.textContent = 'Hämta GPS';
          bcAutoRoute();
          // Hämta bensinpris automatiskt baserat på stad
          bcAutoFetchFuelPrice(city, bcStartLat, bcStartLon);
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
  return document.body.classList.contains('logged-in') ||
         localStorage.getItem('ca_status') === 'active';
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
    banner.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Demoläge — <strong><span id="bc-demoCount">5</span> av 5</strong> sökningar kvar. <a href="#" onclick="if(window.bcGuardOpenSubscribe){bcGuardOpenSubscribe();}else{window.open(\'https://caradvice.onrender.com/subscribe.html\',\'_blank\',\'width=480,height=650,resizable=yes\');}return false;" style="color:#92400e;font-weight:700">Logga in</a> för obegränsad tillgång.</span>';
    wrap.insertBefore(banner, wrap.firstChild);
  }

  // Login-CTA (läggs in efter results-div)
  if (!document.getElementById('bc-loginCta')) {
    var results = document.getElementById('bc-results');
    if (results) {
      var cta = document.createElement('div');
      cta.id = 'bc-loginCta';
      cta.style.cssText = 'display:none;flex-direction:column;gap:10px;margin-top:14px;background:linear-gradient(135deg,#1a3a5c,#2d1b69);border-radius:16px;padding:24px 22px;font-family:inherit';
      cta.innerHTML = '<div style="font-size:1rem;font-weight:800;color:#fff">Vill du ha obegränsad tillgång?</div><p style="font-size:0.85rem;color:rgba(255,255,255,0.78);line-height:1.5;margin:0">Du kör i demoläge med <span id="bc-loginCtaCount">5</span> sökningar totalt. Logga in som prenumerant för att använda kalkylatorn utan begränsning.</p><a href="#" onclick="if(window.bcGuardOpenSubscribe){bcGuardOpenSubscribe();}else{window.open(\'https://caradvice.onrender.com/subscribe.html\',\'_blank\',\'width=480,height=650,resizable=yes\');}return false;" style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:#fff;color:#1e2a3a;border-radius:10px;font-size:0.88rem;font-weight:700;text-decoration:none;align-self:flex-start">Logga in</a>';
      results.parentNode.insertBefore(cta, results.nextSibling);
    }
  }
}

// ── Event wiring ──────────────────────────────────────
function bcWireEvents() {
  bcInitBrands();
  bcLoadEvConsumption();
  bcInjectDemoUI();
  bcInitStartAutocomplete();
  // Auto-hämta bensinpris vid sidladdning (om fältet är tomt)
  setTimeout(bcAutoFetchFuelPrice, 600);

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

  var priceBtn = document.getElementById('bc-priceBtn');

  if (gpsBtn)   gpsBtn.addEventListener('click', bcFetchGPS);
  if (priceBtn) priceBtn.addEventListener('click', function() { bcFetchFuelPrice(bcCurrentCity, bcCurrentLat, bcCurrentLon); });
  if (brand)    brand.addEventListener('change', bcOnBrandChange);
  if (model)    model.addEventListener('change', bcOnModelChange);
  if (dest)     dest.addEventListener('blur',  bcAutoRoute);
  if (start)    start.addEventListener('blur',  bcAutoRoute);
  if (start)    start.addEventListener('input', function() { bcStartLat = null; bcStartLon = null; });

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
      if (el.id === 'bc-gpsBtn')   { bcFetchGPS();  break; }
      if (el.id === 'bc-calcBtn')  { bcCalculate(); break; }
      if (el.id === 'bc-priceBtn') { bcFetchFuelPrice(bcCurrentCity, bcCurrentLat, bcCurrentLon); break; }
      el = el.parentNode;
    }
  });
  document.addEventListener('change', function(e) {
    if (e.target.id === 'bc-brand') bcOnBrandChange();
    if (e.target.id === 'bc-model') bcOnModelChange();
  });
}

// ── Uppdatera demo-UI efter inloggning via popup ──────
window.addEventListener('message', function(ev) {
  if (!ev.data || !ev.data.type) return;
  if (ev.data.type === 'CA_LOGIN' || ev.data.type === 'CA_SUBSCRIBED') {
    if (ev.data.token) localStorage.setItem('ca_token', ev.data.token);
    if (ev.data.email) localStorage.setItem('ca_email', ev.data.email);
    if (ev.data.status) localStorage.setItem('ca_status', ev.data.status);
    bcUpdateDemoUI();
  }
  if (ev.data.type === 'CA_LOGOUT') {
    localStorage.removeItem('ca_token');
    localStorage.removeItem('ca_email');
    localStorage.removeItem('ca_status');
    bcUpdateDemoUI();
  }
});

// ── Starta när DOM är redo ────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { bcWireEvents(); bcUpdateDemoUI(); });
} else {
  bcWireEvents();
  bcUpdateDemoUI();
}
