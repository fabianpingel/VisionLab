/**
 * ============================================================================
 * tailwind.config.ts — Konfiguration für Tailwind CSS
 * ============================================================================
 *
 * Tailwind ist Utility-First-CSS — statt eigener CSS-Klassen schreibt man
 * Utility-Klassen direkt in JSX/HTML (z.B. `className="bg-accent px-4"`).
 *
 * Diese Datei verbindet unsere CSS-Variablen (src/styles/tokens.css) mit
 * Tailwind, sodass man z.B. `bg-brand-navy` oder `text-accent` schreiben kann.
 *
 * Branding-Quelle: www.fabian-pingel.de (PINGEL AI Solutions).
 */

import type { Config } from 'tailwindcss';

export default {
  // content: Tailwind scannt diese Dateien nach Klassen-Verwendungen
  // und erstellt nur die wirklich genutzten CSS-Regeln (Tree-Shaking).
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      // -----------------------------------------------------------------------
      // Farben — alle als CSS-Variablen referenziert, damit man sie
      // an einer Stelle (tokens.css) ändern kann.
      // -----------------------------------------------------------------------
      colors: {
        // PINGEL Brand-Farben (1:1 von der Marken-Website)
        brand: {
          navy: 'var(--color-brand-navy)',
          amber: 'var(--color-brand-amber)',
          'amber-dark': 'var(--color-brand-amber-dark)',
        },
        // Akzentfarbe (für aktive Buttons, Slider, Highlights)
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          dark: 'var(--color-accent-dark)',
          on: 'var(--color-on-accent)',
        },
        // Hintergrund- und Surface-Farben
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          border: 'var(--color-surface-border)',
        },
      },

      // -----------------------------------------------------------------------
      // Schriftart — Montserrat Variable (selbst gehostet via @fontsource-variable)
      // Tailwind-Klasse: font-sans
      // -----------------------------------------------------------------------
      fontFamily: {
        sans: ['var(--font-sans)'],
      },

      // -----------------------------------------------------------------------
      // Glassmorphism-Eckenradius (für Karten und Modals)
      // -----------------------------------------------------------------------
      borderRadius: {
        glass: '24px',
      },

      // -----------------------------------------------------------------------
      // Backdrop-Blur-Werte für Glaspanels
      // -----------------------------------------------------------------------
      backdropBlur: {
        glass: '20px',
      },
    },
  },

  plugins: [],
} satisfies Config;
