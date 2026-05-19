# VisionLab

Live-Objekterkennung als Demo-PWA — KI-Inferenz läuft **vollständig lokal im Browser**, keine Daten verlassen Ihr Gerät.

Eine Demo-Anwendung von [PINGEL AI Solutions](https://www.fabian-pingel.de).

🔗 **Live-Demo:** [vision.pingel-ai-solutions.de](https://vision.pingel-ai-solutions.de)

## Features (v1)

- 📷 **Live-Kamerastream** mit Echtzeit-Bounding-Boxes über das Bild
- 🧠 **Lokale Inferenz** via ONNX Runtime Web (WebGPU mit WASM-Fallback)
- 🔄 **Modell-Switcher** zur Laufzeit zwischen mehreren YOLO-Varianten
- 🎚️ **Konfidenz-Slider** und Klassenfilter (deutsche COCO-Labels)
- 📊 **Live-Performance-Anzeige** (FPS, Inferenzzeit, aktives Backend)
- 📱 **PWA** — installierbar auf iOS/Android Home-Bildschirm
- 🛡️ **DSGVO-konform**: kein Tracking, kein Audio, kein Daten-Upload

## Tech-Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Inferenz:** ONNX Runtime Web (WebGPU/WASM), YOLOv11 nano/small
- **PWA:** Workbox via vite-plugin-pwa
- **Hosting:** GitHub Pages mit Cloudflare-DNS

## Entwicklung lokal

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (HTTPS, Port 5173)
npm run dev

# Tests
npm run test

# Production-Build
npm run build
```

Vor dem ersten `npm run dev`: Der Browser warnt vor dem selbstsignierten HTTPS-Zertifikat — einmalig "Trotzdem fortfahren" klicken. Das ist nötig, weil die Kamera-API (`getUserMedia`) nur über HTTPS funktioniert.

## Test auf dem Smartphone

Im selben WLAN: `https://<lokale-IP>:5173` aufrufen (z.B. `https://192.168.1.42:5173`). Beim ersten Start die Zertifikatswarnung bestätigen.

## Lizenz

[AGPL-3.0-only](LICENSE) — der Source-Code dieser App ist offen einsehbar. Wer eine modifizierte Version öffentlich bereitstellt, muss die Änderungen ebenfalls unter AGPL-3.0 verfügbar machen.

Die genutzten YOLO-Modelle stammen von Ultralytics und stehen ebenfalls unter AGPL-3.0.

## Datenschutz

Diese App führt **alle Bildverarbeitung lokal auf Ihrem Gerät** durch. Es findet kein Upload an Server statt. Modelldateien werden im Browser-Cache (IndexedDB) gespeichert. Es werden keine Cookies gesetzt und kein Tracking eingesetzt.

Beim ersten App-Start erscheint ein Disclaimer mit detaillierten Hinweisen, der vor Kameranutzung zu bestätigen ist.
