/**
 * postcss.config.js — Konfiguration für PostCSS
 *
 * PostCSS ist ein CSS-Prozessor (vergleichbar mit Babel für JS).
 * Es nimmt unsere CSS-Dateien entgegen und transformiert sie:
 *   - tailwindcss: ersetzt die @tailwind-Direktiven durch echtes CSS
 *   - autoprefixer: fügt automatisch Browser-Prefixe hinzu (z.B. -webkit-)
 *
 * Diese Datei ist im CommonJS-Format (module.exports) statt ESM,
 * weil einige Plugins das noch erwarten.
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
