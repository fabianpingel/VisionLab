/**
 * ============================================================================
 * DisclaimerModal.tsx — Hauptmodal mit Disclaimer und Pflicht-Zustimmung
 * ============================================================================
 *
 * Dieses Modal ist die erste Sicht, die ein Nutzer der App sieht. Erst nach
 * Bestätigung der Checkbox + Klick auf "App starten" wird der Disclaimer
 * akzeptiert und die eigentliche App freigeschaltet.
 *
 * Bestandteile:
 *   - PINGEL-Logo (oben)
 *   - Titel & Untertitel
 *   - Disclaimer-Text (mehrere Absätze + Aufzählung)
 *   - Drei Link-Buttons: Datenschutz, Impressum, Quellcode
 *   - Pflicht-Checkbox
 *   - "App starten"-Button (disabled bis Checkbox aktiv)
 *
 * --- React-Konzept: useState ---
 *
 * `useState` ist Reacts Mechanismus für lokalen Komponenten-Zustand.
 *   const [count, setCount] = useState(0);
 *   //     ^---- aktueller Wert    ^---- Setter
 *
 * Wenn `setCount(...)` aufgerufen wird, rendert React die Komponente neu.
 * In Python wäre das vergleichbar mit einem Property mit Observer-Pattern.
 *
 * Wir nutzen hier zwei lokale States:
 *   - hasAcknowledged: Hat der Nutzer die Pflicht-Checkbox gesetzt?
 *   - privacyOpen: Ist das Datenschutz-Modal gerade offen?
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { PrivacyModal } from './PrivacyModal';
import { useDisclaimerStore } from '@/stores/disclaimerStore';
import {
  DISCLAIMER_TITLE,
  DISCLAIMER_SUBTITLE,
  DISCLAIMER_PARAGRAPHS,
  DISCLAIMER_CHECKBOX_LABEL,
  DISCLAIMER_ACCEPT_BUTTON,
  DISCLAIMER_LINK_LABELS,
  EXTERNAL_LINKS,
} from '@/content/disclaimerText';

/**
 * Hauptkomponente des Disclaimers.
 *
 * Diese Komponente nimmt keine Props entgegen — sie liest und schreibt direkt
 * den globalen Disclaimer-Store. Das ist OK, weil sie nur an einer Stelle in
 * der App verwendet wird (Top-Level-Gate).
 *
 * @returns JSX-Element des Disclaimer-Modals.
 */
export function DisclaimerModal(): JSX.Element {
  // Lokaler State: hat der Nutzer die Checkbox angeklickt?
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false);

  // Lokaler State: ist das Datenschutz-Modal aufgeklappt?
  const [privacyOpen, setPrivacyOpen] = useState<boolean>(false);

  // Aktion aus dem Store, die die Zustimmung persistiert.
  // Wir holen NUR die accept-Funktion, nicht den ganzen Store-State,
  // damit die Komponente nicht bei jeder Store-Änderung neu rendert.
  const accept = useDisclaimerStore((state) => state.accept);

  /**
   * Handler für den "App starten"-Button.
   * Speichert die Zustimmung im Store (persistiert in localStorage).
   */
  const handleAccept = (): void => {
    accept();
  };

  return (
    <>
      {/* Vollbild-Overlay mit dunklem Hintergrund — dezent eingeblendet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Modal-Karte: skaliert beim Öffnen leicht hoch */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-xl"
        >
          <GlassPanel elevated className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Logo — zentriert oben */}
            <div className="flex justify-center mb-6">
              {/* Asset-Pfad: Vite serviert public/-Inhalte unter /, also
                  /logo/pingel-logo-original.png. */}
              <img
                src="/logo/pingel-logo-original.png"
                alt="PINGEL AI Solutions"
                // Logo-Größe: ca. 80px hoch, automatische Breite
                className="h-20 w-auto"
              />
            </div>

            {/* Titel und Untertitel */}
            <h1
              id="disclaimer-title"
              className="text-2xl sm:text-3xl font-semibold text-white text-center"
            >
              {DISCLAIMER_TITLE}
            </h1>
            <p className="text-sm text-white/60 text-center mt-1 mb-6">
              {DISCLAIMER_SUBTITLE}
            </p>

            {/* Disclaimer-Absätze (Text + Aufzählung) */}
            <div className="space-y-4 text-sm text-white/80 leading-relaxed">
              {DISCLAIMER_PARAGRAPHS.map((para, idx) => {
                // Type-Narrowing: TypeScript versteht durch das `kind`-Feld,
                // welches Format der `content` hat.
                if (para.kind === 'list') {
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1.5">
                      {(para.content as ReadonlyArray<string>).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={idx}>{para.content as string}</p>;
              })}
            </div>

            {/* Link-Reihe: Datenschutz / Impressum / Quellcode */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {/* Datenschutz öffnet ein internes Modal */}
              <Button variant="ghost" onClick={() => setPrivacyOpen(true)}>
                {DISCLAIMER_LINK_LABELS.privacy}
              </Button>
              {/* Impressum öffnet extern in neuem Tab */}
              <a
                href={EXTERNAL_LINKS.imprint}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl
                           text-sm font-medium text-white/80 hover:text-white hover:bg-white/5
                           transition-all duration-200"
              >
                {DISCLAIMER_LINK_LABELS.imprint}
              </a>
              {/* Quellcode-Link für AGPL-Compliance */}
              <a
                href={EXTERNAL_LINKS.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl
                           text-sm font-medium text-white/80 hover:text-white hover:bg-white/5
                           transition-all duration-200"
              >
                {DISCLAIMER_LINK_LABELS.source}
              </a>
            </div>

            {/* Pflicht-Checkbox + Label */}
            <label
              // flex-Container, damit Checkbox und Text nebeneinander stehen
              className="flex items-start gap-3 mt-6 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                // Größere Checkbox + heller Akzent — Standard-Browser-
                // Styling reicht hier; in Phase 9 ggf. mit eigenem Style ersetzen.
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent
                           text-white focus:ring-white/50 cursor-pointer"
                aria-describedby="disclaimer-checkbox-label"
              />
              <span
                id="disclaimer-checkbox-label"
                className="text-sm text-white/80 leading-relaxed"
              >
                {DISCLAIMER_CHECKBOX_LABEL}
              </span>
            </label>

            {/* "App starten"-Button — disabled bis Checkbox aktiv */}
            <div className="flex justify-center mt-6">
              <Button
                variant="primary"
                onClick={handleAccept}
                disabled={!hasAcknowledged}
                className="min-w-[180px]"
              >
                {DISCLAIMER_ACCEPT_BUTTON}
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>

      {/* Privacy-Modal — wird per State gesteuert geöffnet/geschlossen */}
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
