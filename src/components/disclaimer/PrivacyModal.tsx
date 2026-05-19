/**
 * ============================================================================
 * PrivacyModal.tsx — App-spezifische Mini-Datenschutzerklärung als Modal
 * ============================================================================
 *
 * Dieses Modal wird aus dem DisclaimerModal heraus geöffnet (durch Klick auf
 * den "Datenschutz"-Link). Es ist ein "Modal über Modal" — also rein visuell
 * eine weitere Glasebene über dem Disclaimer.
 *
 * Inhalte stammen aus src/content/privacyText.ts (Texte zentral pflegen).
 *
 * --- React-Konzept: "Callback-Props" ---
 *
 * Da Modale typischerweise vom Parent geöffnet/geschlossen werden, geben wir
 * `isOpen` (offen?) und `onClose` (Close-Handler) als Props rein.
 * Das nennt sich "Lifted State" — der Eltern-Komponent hält den Zustand,
 * das Kind reagiert nur auf Events.
 *
 * In Python wäre das vergleichbar mit einem Callback-Argument:
 *   def show_modal(on_close: Callable[[], None]) -> None: ...
 */

import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import {
  PRIVACY_TITLE,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_FOOTER,
  PRIVACY_CLOSE_BUTTON,
} from '@/content/privacyText';

/**
 * Props des PrivacyModal.
 *
 * - isOpen:  Steuert die Sichtbarkeit von außen.
 * - onClose: Wird aufgerufen, wenn der Nutzer das Modal schließt.
 */
type PrivacyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal mit der App-spezifischen Datenschutzerklärung.
 *
 * Verwendung im DisclaimerModal:
 *   <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
 *
 * @param props.isOpen Modal sichtbar?
 * @param props.onClose Handler für Schließen-Aktion.
 */
export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps): JSX.Element {
  return (
    // AnimatePresence sorgt dafür, dass Enter-/Exit-Animationen sauber laufen,
    // auch wenn das Modal aus dem DOM verschwindet. Ohne AnimatePresence
    // würde das Modal abrupt erscheinen/verschwinden.
    <AnimatePresence>
      {isOpen && (
        // Vollbild-Overlay mit dunklerem Hintergrund — der Disclaimer hinter
        // diesem Modal ist dadurch leicht "weiter weg" angemutet.
        <motion.div
          // role="dialog" + aria-modal für Screenreader-Unterstützung
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          // Framer-Motion-Animationen: einblenden und ausblenden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // Klick auf Overlay schließt das Modal (häufiges UX-Pattern)
          onClick={onClose}
        >
          {/* Inneres Panel: nach oben skaliert beim Öffnen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            // stopPropagation: Klicks auf das Panel selbst sollen das Modal
            // NICHT schließen — nur Klicks auf das umliegende Overlay.
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <GlassPanel elevated className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
              {/* Titel */}
              <h2
                id="privacy-title"
                className="text-xl font-semibold text-white mb-4"
              >
                {PRIVACY_TITLE}
              </h2>

              {/* Einleitungstext */}
              <p className="text-sm text-white/80 leading-relaxed mb-6">
                {PRIVACY_INTRO}
              </p>

              {/* Liste der Sektionen — `.map()` ist die JSX-Schleife
                  (in Python: list comprehension `[render(s) for s in sections]`) */}
              <div className="space-y-5">
                {PRIVACY_SECTIONS.map((section) => (
                  // `key` ist Pflicht bei Listen, damit React die Items eindeutig identifiziert.
                  <section key={section.title}>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>

              {/* Fußnote */}
              <p className="text-xs text-white/50 mt-6 leading-relaxed">
                {PRIVACY_FOOTER}
              </p>

              {/* Schließen-Button — rechtsbündig am unteren Rand */}
              <div className="flex justify-end mt-6">
                <Button variant="secondary" onClick={onClose}>
                  {PRIVACY_CLOSE_BUTTON}
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
