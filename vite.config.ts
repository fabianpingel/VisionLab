/**
 * ============================================================================
 * vite.config.ts — Konfiguration für Vite (Dev-Server + Production-Build + Tests)
 * ============================================================================
 *
 * Vite ist das Build-Tool dieser App. Es übernimmt drei Aufgaben:
 *   1. **Entwicklung:** Startet einen lokalen Dev-Server mit Hot-Module-Reload
 *      (vergleichbar mit `streamlit run` oder `flask run --reload` in Python).
 *   2. **Production-Build:** Optimiert und bündelt den Code in dist/.
 *   3. **Tests:** Vitest nutzt diese Konfig (siehe `test`-Block weiter unten).
 *
 * Diese Datei läuft in Node.js (NICHT im Browser).
 *
 * Plugins werden hier registriert, vergleichbar mit Middleware in Flask/FastAPI.
 */

/// <reference types="vitest" />
// Die obige Direktive aktiviert das `test`-Feld in Vites defineConfig.
// Damit haben wir EINE Konfig für Build UND Tests — offiziell von Vitest empfohlen.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath, URL } from 'node:url';

// `defineConfig` ist nur ein Helper für TypeScript-Autocompletion.
// In Python wäre das vergleichbar mit Pydantic-Model-Validierung der Konfig.
export default defineConfig({
  plugins: [
    // React-Plugin: aktiviert JSX-Verarbeitung und React-Fast-Refresh
    // (entspricht etwa dem Hot-Reload bei `uvicorn --reload`).
    react(),

    // Basic-SSL-Plugin: generiert selbstsignierte HTTPS-Zertifikate.
    // WICHTIG: getUserMedia (Kamera-Zugriff) funktioniert NUR über HTTPS.
    // Browser warnt beim ersten Aufruf — einmalig "Trotzdem fortfahren" klicken.
    basicSsl(),
  ],

  // Pfad-Aliase: '@/components/Foo' statt '../../components/Foo'.
  // Muss synchron mit "paths" in tsconfig.app.json sein.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Dev-Server-Optionen
  server: {
    // host: true → Server hört auf allen Netzwerk-Interfaces.
    // Erlaubt Tests vom Handy im selben WLAN über die lokale IP.
    host: true,
    port: 5173,
    // strictPort: bei Konflikt nicht ausweichen, sondern Fehler werfen.
    strictPort: true,
  },

  // Build-Optionen für Production
  build: {
    // target: welche Browser-Versionen sollen unterstützt werden?
    // 'esnext' = neueste Features (kleineres Bundle, aber nur moderne Browser).
    target: 'esnext',
    // sourcemap: ermöglicht Debugging des Originalcodes im Browser-DevTools.
    sourcemap: true,
  },

  // Optimierung für Dependencies
  optimizeDeps: {
    // ONNX Runtime Web hat eigene WASM-/Worker-Dateien, die nicht
    // pre-bundled werden sollen, damit der Worker korrekt geladen wird.
    exclude: ['onnxruntime-web'],
  },

  // Worker-Format: 'es' = moderner ES-Module-Worker (statt Legacy-Klassik).
  worker: {
    format: 'es',
  },

  // --------------------------------------------------------------------------
  // Test-Konfiguration (Vitest)
  // --------------------------------------------------------------------------
  // Vitest = pytest-Äquivalent. Wir nutzen jsdom als Browser-Simulation,
  // damit Komponenten-Tests `document`, `window`, etc. verwenden können.
  test: {
    // globals: true → `describe`, `it`, `expect` ohne Import nutzbar
    // (wie bei pytest, wo die Fixtures automatisch erkannt werden).
    globals: true,
    // jsdom simuliert einen Browser. Alternative: 'happy-dom' (schneller).
    environment: 'jsdom',
    // Setup-Datei wird vor jedem Test geladen — z.B. für jest-dom-Matcher.
    setupFiles: ['./src/test/setup.ts'],
    // CSS-Imports beim Testen ignorieren.
    css: false,
  },
});
