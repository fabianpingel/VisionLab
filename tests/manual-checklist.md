# VisionLab — Manuelle Test-Checkliste

Diese Checkliste wird vor jedem Go-Live (Push auf `main`) abgearbeitet. Sie ergänzt die automatischen Tests (`npm run test`) und prüft das, was nur am echten Gerät verifizierbar ist: Kamera, GPU/WebGPU, Touch-Bedienung, Performance.

## Vorbereitung

```powershell
npm run build      # Produktions-Build erzeugen
npm run preview    # serviert dist/ auf https://localhost:4173
```

Lokale IP herausfinden für Mobile-Test im selben WLAN:

```powershell
ipconfig | findstr IPv4
# Beispiel: 192.168.1.42 → https://192.168.1.42:4173 am Smartphone
```

Beim ersten Aufruf erscheint eine **Zertifikatswarnung** (self-signed). Einmalig „Erweitert → Trotzdem fortfahren". Das ist nur lokal so — auf `vision.pingel-ai-solutions.de` liefert GitHub Pages ein echtes Let's-Encrypt-Zertifikat.

---

## Geräte-Matrix

Mindestens diese Kombinationen vor Go-Live durchprüfen:

| # | Gerät | OS | Browser | Erwartetes Backend |
|---|---|---|---|---|
| 1 | Desktop / Notebook | Windows 11 oder macOS | Chrome (neueste) | WebGPU |
| 2 | iPhone (≥ 12) | iOS 18+ | Safari | WebGPU oder WASM |
| 3 | iPhone älter (SE etc.) | iOS 16/17 | Safari | WASM |
| 4 | iPad | iPadOS 17+ | Safari | WebGPU |
| 5 | Android (Pixel / Samsung) | Android 13+ | Chrome | WebGPU |

---

## Test-Szenarien

Pro Gerät die folgenden Szenarien durchgehen. Bei jedem Schritt: ✅ wenn erwartetes Verhalten erfüllt, ✗ bei Abweichung (dann Notiz).

### 1. Erststart und Disclaimer

- [ ] App lädt — kein Konsolen-Fehler bei `F12 → Console`
- [ ] **Disclaimer-Modal** erscheint zentriert, Logo (PINGEL) sichtbar und proportional
- [ ] „App starten"-Button ist **ausgegraut** (Brand-Gold-Farbe)
- [ ] Klick auf **„Datenschutz"** öffnet zweites Modal mit App-spezifischer Erklärung
- [ ] Klick auf **„Impressum"** öffnet `https://www.fabian-pingel.de/impressum.html` in neuem Tab
- [ ] Klick auf **„Quellcode"** öffnet GitHub-Repo (nach Phase 12 öffentlich)
- [ ] Pflicht-Checkbox aktivieren → Button wird **klickbar** (heller)
- [ ] Klick auf „App starten" → Modal verschwindet, App-Inhalt erscheint

### 2. Kamera-Permission

- [ ] Browser fragt nach Kamera-Erlaubnis (genau einmal)
- [ ] Bei „Erlauben": **Live-Bild** erscheint vollflächig
- [ ] Bei „Verweigern" oder per Browser-Einstellungen blockiert: **Hinweis-Bildschirm** „Kamera-Erlaubnis fehlt" mit Retry-Button
- [ ] Mobile: Bei Rückkamera ist das Bild **nicht gespiegelt** (Welt sieht aus wie sie ist)
- [ ] Bei Front-Kamera-Switch: Bild **gespiegelt** (Selfie-Erwartung)

### 3. Inferenz-Pipeline

- [ ] **Stats-Panel oben links** zeigt nacheinander: „Lade Modell-Liste …" → „Starte Inferenz-Worker …" → „Lade Modell …" → Live-Stats
- [ ] Erststart-Ladezeit: < 30 Sekunden (im WLAN). Bei langsamer Verbindung dauert es länger wegen 26 MB WASM + 10 MB Modell
- [ ] Im Live-Betrieb: **Bounding-Boxes** erscheinen über Objekten
- [ ] Box-Label: **deutscher Klassenname + Konfidenz in Prozent** (z.B. „Person 87%")
- [ ] Hand vor die Kamera halten → eigenes Boxen-Tracking sichtbar, folgt der Bewegung ohne sichtbares Ruckeln
- [ ] Stoppschild zeigen → „Stoppschild XX%"
- [ ] Handy zeigen → „Handy XX%"

### 4. Stats-Panel

- [ ] FPS-Zahl ist plausibel (siehe Erwartungen unten je Backend)
- [ ] **Sparkline** läuft mit, zeigt leichte Schwankungen
- [ ] **Backend-Badge**: ⚡ WebGPU (grün) oder 🔧 WASM (weiß) — sichtbar und passend zum Gerät
- [ ] Modell-Anzeigename (z.B. „YOLO v11 Nano") korrekt
- [ ] Inferenzzeit in ms passt zur FPS (z.B. 30 FPS ≈ ≤33 ms)
- [ ] **Singular/Plural** korrekt: „1 Objekt", „5 Objekte"

#### Erwartete FPS-Bereiche

| Backend | Mindest-FPS | Typisch |
|---|---|---|
| Desktop WebGPU | 20 | 30–60 |
| Desktop WASM | 4 | 6–12 |
| iOS WebGPU (iOS 18+) | 15 | 20–30 |
| iOS WASM (iOS 17) | 4 | 6–10 |
| Android WebGPU | 15 | 20–35 |

### 5. Bedienelemente (Drawer)

- [ ] **Zahnrad-Button** oben rechts sichtbar
- [ ] Klick öffnet **Bottom-Sheet** mit Slide-Animation
- [ ] **Modell-Picker** zeigt YOLO v11 Nano und Small mit Beschreibung und Größe
- [ ] **Aktive Modell-Karte** mit Amber-Schimmer (Brand-Akzent)
- [ ] Klick auf inaktives Modell → kurzer Lade-Hänger (3–10 s) → läuft mit neuem Modell weiter
- [ ] **Konfidenz-Slider**: Daumen in Amber, Wert wird live mitgeschrieben (0.00–1.00)
- [ ] Slider nach rechts → weniger Boxen, nach links → mehr Boxen, **sofort sichtbar**
- [ ] **Klassenfilter** „Alle"/„Keine" Buttons funktionieren
- [ ] Einzelne Klasse deaktivieren (z.B. Person) → Personen werden nicht mehr geboxed
- [ ] Backdrop-Klick oder X-Button schließt das Drawer

### 6. Front-/Rückkamera-Switch

- [ ] Switch-Button (Pfeil-Icon) unten rechts sichtbar
- [ ] Klick wechselt zwischen Front- und Rückkamera
- [ ] Boxen sind nach Switch **korrekt platziert** (kein horizontaler Versatz durch Spiegelung)
- [ ] Stats-Panel zeigt nach Switch weiterhin live FPS

### 7. Orientation-Change (nur Mobile)

- [ ] Hochformat → Querformat: Canvas-Overlay passt sich an, Boxen bleiben korrekt
- [ ] Querformat → Hochformat: keine Layout-Brüche

### 8. Persistenz (Reload)

- [ ] Nach F5/Reload: Disclaimer erscheint **nicht** erneut (localStorage)
- [ ] Klassen-Filter-Auswahl bleibt erhalten
- [ ] Modell-Auswahl bleibt erhalten
- [ ] Konfidenz-Schwelle bleibt erhalten

### 9. PWA-Verhalten

#### Installierbarkeit
- [ ] Desktop Chrome/Edge: „App installieren"-Icon erscheint in Adressleiste nach kurzer Zeit
- [ ] Android Chrome: „Add to Home Screen"-Prompt oder Menü-Eintrag
- [ ] iOS Safari: „Teilen → Zum Home-Bildschirm"

#### Nach Installation
- [ ] Icon auf Homescreen zeigt PINGEL-Logo auf Navy-Hintergrund
- [ ] App öffnet ohne Browser-Chrome (standalone-Modus)
- [ ] App-Name korrekt: „VisionLab"

#### Offline-Test
- [ ] App einmal komplett laden (Modelle inkl.)
- [ ] DevTools → Network → Offline (oder Flugmodus)
- [ ] Reload → App-Shell + Modelle laden weiterhin (aus Service-Worker-Cache)

### 10. DSGVO-/Datenschutz-Verifikation

- [ ] **DevTools → Network** beim Live-Betrieb beobachten:
  - Keine Requests an externe Domains (außer evtl. CDN-Schriftarten, sollten aber lokal gehostet sein!)
  - Keine Analytics-Skripte
  - Keine Tracking-Pixel
- [ ] **DevTools → Application → Local Storage**:
  - Nur eigene Keys (`visionlab.disclaimer.v1`, `visionlab.settings.v1`)
  - Keine `_ga`, `_fbp`, etc.
- [ ] **DevTools → Application → Cookies**: leer
- [ ] App fordert **niemals** Audio-Permission an

---

## Bekannte Limitierungen (kein Blocker für Go-Live)

- Auf iOS 17 ist WebGPU nicht vollständig — FPS deutlich niedriger als auf iOS 18+
- Bei sehr vielen Detektionen (>30 gleichzeitig) können Labels überlappen
- Erste Modell-Ladezeit ist mit 26 MB WASM hoch (einmalig — danach gecacht)

---

## Test-Protokoll-Vorlage

Beim Durchgang abkopieren und ausfüllen:

```
Datum:           ____________
Tester:          ____________
Build-Commit:    ____________

| Gerät       | OS       | Browser   | Backend | FPS  | Auffälligkeiten |
|-------------|----------|-----------|---------|------|-----------------|
| Desktop     |          | Chrome    |         |      |                 |
| iPhone      |          | Safari    |         |      |                 |
| iPad        |          | Safari    |         |      |                 |
| Android     |          | Chrome    |         |      |                 |

Freigabe für Go-Live: [ ] ja  [ ] nein
Bemerkungen: ____________________________________________________
```
