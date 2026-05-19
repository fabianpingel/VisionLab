/**
 * ============================================================================
 * tailwind.config.ts — Konfiguration für Tailwind CSS
 * ============================================================================
 *
 * Tailwind ist ein Utility-First-CSS-Framework: Statt CSS-Klassen wie
 * ".button-primary" zu definieren, schreibt man Utility-Klassen direkt im
 * HTML, z.B. <button class="bg-blue-500 px-4 py-2 rounded">.
 *
 * Diese Datei sagt Tailwind:
 *   - Wo soll nach Klassen-Verwendungen gesucht werden ('content')
 *   - Welche eigenen Design-Tokens stehen zur Verfügung ('theme')
 *
 * Vergleichbar mit dem theme/style.css einer Streamlit-App,
 * nur mit deutlich mehr Konfigurationsmöglichkeiten.
 */

import type { Config } from 'tailwindcss';

export default {
  // content: Tailwind scannt diese Dateien nach Klassen-Verwendungen
  // und erstellt nur die wirklich genutzten CSS-Regeln (Tree-Shaking).
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      // Hier kommen später die Design-Tokens aus pingel-ai-solutions.de.
      // CSS-Variablen werden in src/styles/tokens.css definiert,
      // Tailwind referenziert sie hier.
      colors: {
        // Brand-Farben (Platzhalter — werden in Phase 9 mit echten Werten
        // aus den DevTools der Website ersetzt).
        brand: {
          DEFAULT: 'var(--color-brand)',
          accent: 'var(--color-brand-accent)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
      },
      // Glassmorphism-Eckenradius für Karten und Modals
      borderRadius: {
        glass: '24px',
      },
      // Backdrop-Blur-Werte für Glaspanels
      backdropBlur: {
        glass: '20px',
      },
    },
  },

  plugins: [],
} satisfies Config;
