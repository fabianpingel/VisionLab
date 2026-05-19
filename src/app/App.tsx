/**
 * ============================================================================
 * App.tsx — Wurzelkomponente der Anwendung
 * ============================================================================
 *
 * Diese Komponente ist der oberste UI-Knoten. Sie wird von main.tsx in den
 * DOM eingehängt und entscheidet, welche Teil-UI gerade angezeigt wird.
 *
 * In Phase 1 ist sie noch ein Platzhalter — sobald wir den Disclaimer
 * (Phase 2), die Kamera (Phase 3), das Overlay (Phase 6) usw. haben,
 * werden diese hier orchestriert.
 *
 * --- React-Konzepte kurz erklärt (für Python-Entwickler) ---
 *
 * Eine "Komponente" ist eine TypeScript-Funktion, die ein UI-Stück
 * zurückgibt — vergleichbar mit einer Streamlit-Funktion, die `st.write(...)`
 * etc. aufruft. Der Unterschied: React-Komponenten geben JSX zurück (HTML-
 * artige Syntax), und React kümmert sich darum, den echten DOM zu updaten.
 *
 * JSX sieht aus wie HTML, ist aber JavaScript:
 *   - className statt class (weil 'class' ein JS-Schlüsselwort ist)
 *   - {expression} um JS-Werte einzubetten
 */

/**
 * Wurzelkomponente — wird in main.tsx als <App /> gerendert.
 *
 * @returns JSX-Element, das den gesamten App-UI-Baum repräsentiert.
 */
export default function App(): JSX.Element {
  return (
    // <main> = semantisches HTML-Element für den Hauptinhalt der Seite.
    // Die Tailwind-Klassen erzeugen: vollflächig, dunkler Hintergrund,
    // Inhalt zentriert, weißer Text.
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">VisionLab</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Setup erfolgreich — Phase 1 abgeschlossen.
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        PINGEL AI Solutions · vision.pingel-ai-solutions.de
      </p>
    </main>
  );
}
