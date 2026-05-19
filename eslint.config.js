/**
 * ============================================================================
 * eslint.config.js — Linter-Konfiguration (ESLint "Flat Config")
 * ============================================================================
 *
 * ESLint = der "ruff check" der JavaScript-Welt: prüft den Code auf
 * Stil- und Logikfehler. Diese Konfig nutzt das moderne "flat config"-Format.
 *
 * Was wird geprüft?
 *   - TypeScript-Regeln (typescript-eslint)
 *   - React-Hook-Regeln (react-hooks)
 *   - Hot-Reload-Verträglichkeit (react-refresh)
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // Dateien/Pfade, die ignoriert werden sollen.
  { ignores: ['dist', 'node_modules', 'coverage'] },

  // Hauptkonfiguration für TS/TSX-Dateien.
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        // Browser-Globals (window, document, navigator, ...)
        ...Object.fromEntries(
          [
            'window', 'document', 'navigator', 'console',
            'fetch', 'localStorage', 'IndexedDB', 'Worker',
            'requestAnimationFrame', 'cancelAnimationFrame',
            'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
            'OffscreenCanvas', 'HTMLVideoElement', 'HTMLCanvasElement',
            'HTMLImageElement', 'HTMLInputElement',
            'MediaStream', 'ImageData',
          ].map((name) => [name, 'readonly']),
        ),
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React Hooks Regeln (z.B. nicht in Conditionals callen)
      ...reactHooks.configs.recommended.rules,

      // Hot-Reload-Verträglichkeit: exportiere nur Komponenten aus
      // einer Datei, sonst bricht das Fast-Refresh.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Ungenutzte Variablen sind Warnung, nicht Error
      // (wäre sonst nervig während der Entwicklung).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
