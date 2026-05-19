# Übersicht der npm-Pakete

Eine Erklärung in deutscher Sprache, wofür jedes Paket in `package.json` da ist.
JSON erlaubt keine Inline-Kommentare, daher diese separate Datei.

## Runtime-Abhängigkeiten (`dependencies`)

Diese Pakete werden beim `npm run build` mit in das App-Bundle gepackt und
laufen im Browser des Nutzers.

| Paket | Zweck |
|---|---|
| `react` | UI-Bibliothek — das Pendant zu Streamlit, nur deklarativ statt prozedural |
| `react-dom` | Rendert React-Komponenten in den echten Browser-DOM |
| `zustand` | Schlanker State-Manager — verwaltet App-Zustand außerhalb der Komponenten (Modell-Auswahl, Klassenfilter, Konfidenz-Schwelle) |
| `onnxruntime-web` | Führt die ONNX-KI-Modelle im Browser aus, primär via WebGPU |
| `framer-motion` | Animationen und Übergänge für die UI (Modale, Drawer) |

## Entwicklungs-Abhängigkeiten (`devDependencies`)

Diese Pakete sind NUR während Entwicklung/Build/Test nötig und gehen NICHT
ins Produktions-Bundle. Vergleichbar mit `dependency-groups.dev` in `pyproject.toml`.

### Build-Tools

| Paket | Zweck |
|---|---|
| `vite` | Dev-Server mit Hot-Reload + Production-Bundler (vergleichbar mit hatchling + uvicorn) |
| `@vitejs/plugin-react` | Vite-Plugin, das JSX und React-Fast-Refresh aktiviert |
| `@vitejs/plugin-basic-ssl` | Generiert selbstsignierte HTTPS-Zertifikate für lokales Entwickeln (nötig für Kamera-API) |
| `vite-plugin-pwa` | Erzeugt Service Worker und Manifest für die PWA-Funktion (Phase 10) |

### TypeScript

| Paket | Zweck |
|---|---|
| `typescript` | Der TypeScript-Compiler `tsc` |
| `@types/react`, `@types/react-dom` | TypeScript-Typdefinitionen für React |
| `@types/node` | Typdefinitionen für Node.js-APIs (z.B. in vite.config.ts) |

### Styling

| Paket | Zweck |
|---|---|
| `tailwindcss` | Utility-First-CSS-Framework |
| `postcss` | CSS-Postprozessor, den Tailwind nutzt |
| `autoprefixer` | Fügt automatisch Browser-Prefixe hinzu (`-webkit-`, `-moz-`) |

### Linting & Formatting

| Paket | Zweck |
|---|---|
| `eslint`, `@eslint/js` | Linter — das `ruff check` für JS/TS |
| `typescript-eslint` | TypeScript-spezifische Lint-Regeln |
| `eslint-plugin-react-hooks` | Erzwingt die Regeln der React-Hooks (Reihenfolge, Conditionals) |
| `eslint-plugin-react-refresh` | Warnt vor Code, der Hot-Reload bricht |
| `prettier` | Automatischer Formatter — das `ruff format` für JS/TS |

### Testing

| Paket | Zweck |
|---|---|
| `vitest`, `@vitest/ui` | Test-Runner — das `pytest` für JS/TS, mit optionaler Web-UI |
| `jsdom` | Browser-Simulation in Node.js, damit Komponenten-Tests laufen |
| `@testing-library/react` | Komponenten-Test-Helpers (`render`, `screen.getByRole`, etc.) |
| `@testing-library/jest-dom` | Zusätzliche Assertions wie `.toBeInTheDocument()` |
| `@testing-library/user-event` | Simuliert realistische User-Interaktionen (Klick, Tippen) |

## Versions-Strategie

- `^x.y.z` — erlaubt npm, kompatible Minor-/Patch-Updates zu nehmen
- `~x.y.z` — nur Patch-Updates erlaubt (für TypeScript bewusst strenger)
- `package-lock.json` wird committet → reproduzierbare Installs
