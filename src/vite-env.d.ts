/// <reference types="vite/client" />
/**
 * vite-env.d.ts — TypeScript-Deklarationen für Vite-spezifische APIs
 *
 * Die `/// <reference>`-Kommentar-Direktive sagt TypeScript:
 * "Lade die Typdefinitionen von vite/client" — damit `import.meta.env`
 * und Asset-Imports (z.B. logo.png) korrekt typisiert sind.
 */

// @fontsource-variable/montserrat ist ein reiner Side-Effect-CSS-Import.
// Es liefert keine eigenen TypeScript-Definitionen mit — wir deklarieren
// das Modul hier als leer, damit TS den Import akzeptiert.
declare module '@fontsource-variable/montserrat';
