/**
 * ============================================================================
 * main.tsx — Einstiegspunkt der React-App
 * ============================================================================
 *
 * Diese Datei ist das, was in einer Python-Flask-App `if __name__ == "__main__":`
 * mit `app.run()` wäre: Sie startet die Anwendung.
 *
 * Was passiert hier konkret?
 *   1. Wir importieren React und unsere Wurzelkomponente <App />.
 *   2. Wir holen das <div id="root"> aus dem HTML.
 *   3. Wir sagen React: "Bitte rendere <App /> in dieses div hinein."
 *
 * StrictMode ist ein Development-Helfer: Er führt manche Funktionen doppelt
 * aus, um Bugs aufzuspüren (z.B. fehlerhafte Cleanup-Funktionen). In
 * Production hat er KEINEN Performance-Einfluss — wird automatisch entfernt.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
// Schriftart Montserrat Variable, selbst gehostet (kein CDN, kein Drittland).
// Wird vom Vite-Bundler in die App eingebaut und unter /assets/ ausgeliefert.
import '@fontsource-variable/montserrat';
// CSS-Import: Wirkt für die GESAMTE App. Tailwind-Regeln werden hier geladen.
import './styles/globals.css';

// Das Root-Element aus index.html holen.
// Das `!` am Ende sagt TypeScript: "Vertraue mir, das ist nicht null."
// (Wir wissen, dass das div in index.html existiert.)
const rootElement = document.getElementById('root')!;

// React 18+ API: createRoot ersetzt das alte ReactDOM.render.
const root = createRoot(rootElement);

// Den App-Komponenten-Baum in den Root einhängen ("rendern").
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
