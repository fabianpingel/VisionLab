/**
 * ============================================================================
 * disclaimerStore.ts — Zustand-Store für Disclaimer-Akzeptanz
 * ============================================================================
 *
 * Was ist ein "Store"?
 *   Ein Store ist ein zentraler Ablageort für App-Zustand, den mehrere
 *   Komponenten lesen/ändern können — ähnlich einer Singleton-Klasse oder
 *   einer globalen Variable mit Reaktivität.
 *
 *   In Python wäre die Analogie z.B. ein `streamlit.session_state` oder
 *   eine globale Pydantic-Instanz, deren Änderungen automatisch alle
 *   Listener informieren.
 *
 * Warum Zustand (die Library, nicht "state")?
 *   Zustand ist sehr schlank (~1 KB), TypeScript-freundlich, und braucht
 *   keinen Provider-Boilerplate wie Redux. Komponenten greifen via Hook auf
 *   den Store zu: `const accepted = useDisclaimerStore(s => s.accepted);`
 *
 * Persistenz:
 *   Wir nutzen das Zustand-`persist`-Middleware, das den Store automatisch
 *   in localStorage spiegelt. Bei Browser-Neustart ist die Zustimmung also
 *   noch da. Versionierung sorgt dafür, dass nach Disclaimer-Update der
 *   Nutzer erneut zustimmen muss.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DISCLAIMER_VERSION } from '@/content/disclaimerText';

/**
 * TypeScript-Interface des Store-Zustands.
 *
 * Felder:
 *   - acceptedVersion: Welche Disclaimer-Version wurde zugestimmt?
 *                      undefined = noch nie zugestimmt.
 *   - acceptedAt:      Zeitstempel der Zustimmung (ISO-String).
 *
 * Methoden:
 *   - accept():        Setzt acceptedVersion auf die aktuelle Version.
 *   - reset():         Löscht die Zustimmung (für Tests oder Reset-Button).
 */
type DisclaimerState = {
  acceptedVersion: string | undefined;
  acceptedAt: string | undefined;
  accept: () => void;
  reset: () => void;
};

/**
 * Hook für den Disclaimer-Store.
 *
 * Verwendung in einer Komponente:
 *   const accepted = useDisclaimerStore((s) => s.acceptedVersion === DISCLAIMER_VERSION);
 *   const accept = useDisclaimerStore((s) => s.accept);
 *
 * Das Selector-Pattern `(s) => s.feld` sorgt dafür, dass die Komponente nur
 * neu rendert, wenn sich genau dieses Feld ändert — ähnlich wie ein
 * fein-granulares Observable.
 */
export const useDisclaimerStore = create<DisclaimerState>()(
  // `persist` wickelt den Store-Creator und spiegelt ihn in localStorage.
  persist(
    (set) => ({
      // Initialwerte
      acceptedVersion: undefined,
      acceptedAt: undefined,

      // Aktion: Zustimmung speichern
      accept: () => {
        set({
          acceptedVersion: DISCLAIMER_VERSION,
          acceptedAt: new Date().toISOString(),
        });
      },

      // Aktion: Zustimmung zurücksetzen
      reset: () => {
        set({ acceptedVersion: undefined, acceptedAt: undefined });
      },
    }),
    {
      // Eindeutiger Key im localStorage. Das `v1`-Suffix sorgt dafür, dass
      // bei zukünftigen Store-Strukturänderungen ein neuer Slot genutzt wird.
      name: 'visionlab.disclaimer.v1',
      // JSON-Serialisierung in localStorage (Standard).
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Helfer-Selector: Hat der Nutzer die AKTUELLE Disclaimer-Version akzeptiert?
 *
 * Wir prüfen nicht nur, ob überhaupt zugestimmt wurde, sondern auch ob die
 * zugestimmte Version mit der aktuellen übereinstimmt. So erzwingen wir bei
 * Disclaimer-Updates eine erneute Bestätigung.
 *
 * @returns true wenn die zugestimmte Version === aktuelle Version, sonst false.
 */
export function selectHasAcceptedCurrent(state: DisclaimerState): boolean {
  return state.acceptedVersion === DISCLAIMER_VERSION;
}
