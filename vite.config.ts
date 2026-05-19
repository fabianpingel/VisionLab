/**
 * ============================================================================
 * vite.config.ts — Konfiguration für Vite (Dev-Server, Build, Tests, PWA)
 * ============================================================================
 *
 * Vier Verantwortlichkeiten:
 *   1. Dev-Server mit HMR (npm run dev)
 *   2. Production-Build (npm run build)
 *   3. Test-Runner-Konfig für Vitest (npm run test)
 *   4. PWA-Setup ab Phase 10 (Service Worker, Manifest, Offline-Cache)
 *
 * Diese Datei läuft in Node.js — Browser-APIs sind hier NICHT verfügbar.
 */

/// <reference types="vitest" />
// Die obige Direktive aktiviert das `test`-Feld in Vites defineConfig.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),

    // ------------------------------------------------------------------------
    // PWA-Plugin: erzeugt Manifest + Service Worker via Workbox.
    // ------------------------------------------------------------------------
    VitePWA({
      // 'autoUpdate': Service-Worker prüft im Hintergrund auf Updates und
      // aktiviert sie beim nächsten App-Start automatisch.
      registerType: 'autoUpdate',

      // Welche statischen Files sollen vom Plugin ins SW-Precache?
      // (Werden mit der App ausgeliefert und sind sofort verfügbar.)
      // Wir lassen Manifest + Modelle BEWUSST raus — die sind groß
      // (10-38 MB) und werden runtime per CacheFirst gecacht.
      includeAssets: ['favicon-32.png', 'favicon-64.png', 'apple-touch-icon.png'],

      // ----------------------------------------------------------------------
      // PWA-Manifest — wird zu /manifest.webmanifest gerendert
      // ----------------------------------------------------------------------
      manifest: {
        name: 'VisionLab – PINGEL AI Solutions',
        short_name: 'VisionLab',
        description:
          'Live-Objekterkennung im Browser. Eine Demo von PINGEL AI Solutions.',
        // Brand-Farben (siehe src/styles/tokens.css)
        theme_color: '#0b1024',
        background_color: '#0b1024',
        // standalone = App öffnet ohne Browser-Chrome (wie native App)
        display: 'standalone',
        // Hochkant-Orientierung als Vorgabe — Querformat funktioniert trotzdem.
        orientation: 'portrait-primary',
        // start_url + scope sorgen dafür, dass die App von der Wurzel startet
        // und sich nicht auf irgendwelche Unterpfade beschränkt.
        start_url: '/',
        scope: '/',
        lang: 'de',
        categories: ['productivity', 'utilities'],
        // App-Icons — von scripts/generate_icons.py erzeugt
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Maskable-Icon: für Android Adaptive-Icons (Logo bleibt
            // sichtbar auch nach Crop in Kreis/Squircle).
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Workbox-Konfiguration: Cache-Strategien für unterschiedliche Routen
      // ----------------------------------------------------------------------
      workbox: {
        // App-Shell-Files, die beim Install des SW vorab gecacht werden.
        // Vite-Plugin-PWA findet sie automatisch im dist/-Output.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Maximale Größe einer einzelnen vorgecachten Datei (Default ist 2 MB,
        // unsere ORT-WASM ist 26 MB).
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,

        // Runtime-Caching-Regeln: was geschieht mit großen Files, die NICHT
        // im Precache landen sollen?
        runtimeCaching: [
          {
            // ONNX-Modelle (10-38 MB) — werden beim ersten Start
            // einmalig geladen, dann permanent gecacht.
            urlPattern: /\/models\/.*\.onnx$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'visionlab-models-v1',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Tage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Modell-Manifest — kann sich häufiger ändern.
            // StaleWhileRevalidate liefert den Cache sofort und holt
            // im Hintergrund Updates.
            urlPattern: /\/models\/manifest\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'visionlab-manifest-v1',
            },
          },
        ],
      },

      // Beim Klick auf "Refresh" im Update-Prompt sofort den neuen SW
      // aktivieren — gibt's hier zwar nicht als UI, ist aber gute Hygiene.
      devOptions: {
        // PWA wird auch im Dev-Server aktiviert (sonst nur in Production).
        // Praktisch, um Service-Worker-Verhalten lokal zu testen.
        enabled: false, // Standardmäßig aus, sonst stört es beim Entwickeln.
      },
    }),
  ],

  // Pfad-Aliase: '@/components/Foo' statt '../../components/Foo'.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Dev-Server-Optionen
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },

  // Build-Optionen
  build: {
    target: 'esnext',
    sourcemap: true,
  },

  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },

  worker: {
    format: 'es',
  },

  // Test-Konfiguration (Vitest)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
