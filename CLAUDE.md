# CLAUDE.md — Projekt-spezifische Anweisungen für VisionLab

## Projekt-Kontext

**Was:** PWA für lokale Echtzeit-Objekterkennung im Browser (ONNX Runtime Web + WebGPU + YOLO).

**Wofür:** Demo-App für Kunden-Erstgespräche von PINGEL AI Solutions. Fabian Pingel zeigt sie auf Handy/Tablet, um zu demonstrieren, was mit KI möglich ist.

**Hosting:** GitHub Pages unter `vision.pingel-ai-solutions.de`. Public Repo unter AGPL-3.0.

## Kommentar-Konvention (wichtig!)

**Diese Regel überschreibt die globale CLAUDE.md für dieses Projekt:**

Fabian programmiert ausschließlich Python. Damit er den TypeScript-/React-/CSS-Code mitlesen und warten kann, ist **ausführliche deutsche Kommentierung Pflicht**:

1. **Jede Funktion bekommt einen JSDoc/TSDoc-Block auf Deutsch** im Lehrbuch-Stil (analog zum Python-Docstring-Standard der globalen CLAUDE.md).
2. **Inline-Kommentare bei jeder nicht-trivialen Operation** — auch wenn der Code für einen TS-erfahrenen Entwickler offensichtlich wäre.
3. **Framework-Konzepte erklären:** `useEffect`, `useRef`, JSX-Spread, Destructuring, Promise-Chains, Web-Worker-`postMessage`, etc. — gerne mit Python-Analogie.
4. **Konfig-Dateien** (`vite.config.ts`, `tailwind.config.ts`, `package.json`, GitHub-Actions-YAMLs) ebenfalls reichlich kommentiert.

Lieber zu viel als zu wenig erklären. Fabian kann redundante Kommentare leicht überlesen — fehlende Erklärungen kosten ihn Zeit.

## Code-Sprache

- **Bezeichner** (Variablen, Funktionen, Komponenten, Module): **Englisch**
- **Kommentare** (`//`, `/* */`, JSDoc): **Deutsch**
- **UI-Strings** (Button-Texte, Labels, Fehlermeldungen): **Deutsch** (Zielgruppe ist DACH-Mittelstand)
- **COCO-Klassennamen**: deutsche Übersetzung in `src/models/coco-labels-de.ts`

## TypeScript-Standards

- **Strict-Mode aktiv** (siehe `tsconfig.app.json`) — keine `any` ohne Begründung
- **Moderne Syntax:** `import type { ... }`, `satisfies`, Template-Literal-Types wo sinnvoll
- **Funktionssignaturen vollständig annotieren**: Rückgabetypen, alle Parameter
- **`null` vs `undefined`:** wir bevorzugen `undefined`; `null` nur für DOM-APIs, die es zurückgeben

## Projektstruktur

```
D:\VisionLab\
├── public/              # Statische Assets (Modelle, Icons, Logo)
├── src/
│   ├── app/             # App-Wurzelkomponente
│   ├── components/      # UI-Komponenten (camera, overlay, controls, stats, ui)
│   ├── hooks/           # React-Hooks (useCamera, useInference, ...)
│   ├── inference/       # ONNX-Worker, Pre-/Postprocess
│   ├── models/          # Modell-Registry, COCO-Labels
│   ├── lib/             # Utility-Funktionen
│   ├── styles/          # globals.css, tokens.css
│   └── test/            # Test-Setup
├── scripts/             # Python-Skripte (YOLO-Export via uv)
├── tests/               # Unit-/Komponententests + manuelle Checkliste
└── .github/workflows/   # GitHub Actions (CI/CD)
```

## Test-Gates vor jedem Git-Push

In dieser Reihenfolge müssen alle grün sein:

1. `npm run typecheck` — TypeScript-Fehler
2. `npm run lint` — ESLint-Warnungen
3. `npm run test` — Vitest
4. `npm run build` — sauberer Production-Build
5. Manueller Smoke-Test: `npm run dev`, App lädt, Kamera startet, Boxen erscheinen

## DSGVO & Lizenz-Compliance

- **Niemals Audio anfordern:** `getUserMedia({ video: true, audio: false })` — strikt.
- **Niemals Analytics, Tracking, Drittanbieter-Scripts** einbauen.
- **Keine Server-Calls** zur Laufzeit außer für statische Assets vom eigenen Origin.
- **Disclaimer-Modal** muss vor jeder Kamera-Permission-Anfrage erscheinen.
- **AGPL-Compliance:** sichtbarer Quellcode-Link in der App, LICENSE-Datei im Repo, NOTICE für Drittanbieter-Bibliotheken.

## Was NICHT bauen

- Kein User-Account-System
- Keine Cloud-Speicherung
- Keine Service-Worker-Strategien, die HTML-Seiten cachen, ohne den Disclaimer zu invalidieren
- Keine Frame-Aufzeichnung/Video-Mitschnitt (verschoben auf v1.1)
