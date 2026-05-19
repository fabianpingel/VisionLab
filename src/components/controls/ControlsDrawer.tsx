/**
 * ============================================================================
 * ControlsDrawer.tsx — Ausklappbares Bedien-Panel (Bottom-Sheet)
 * ============================================================================
 *
 * UI:
 *   - Schwebender Trigger-Button (Zahnrad-Icon, oben rechts neben Stats-Pille)
 *   - Bottom-Sheet schiebt sich beim Klick von unten ins Bild
 *   - Enthält: Modell-Picker, Konfidenz-Slider, Klassen-Filter
 *
 * Implementierung:
 *   - Sichtbarkeits-State lokal in der Komponente (kein Store nötig)
 *   - Framer Motion für die Slide-Animation
 *   - Backdrop-Overlay schließt das Drawer beim Klick darauf
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ConfidenceSlider } from './ConfidenceSlider';
import { ModelPicker } from './ModelPicker';
import { ClassFilter } from './ClassFilter';
import type { ModelSpec } from '@/inference/types';

/**
 * Props des Drawers.
 *
 * Modell-Daten werden von außen reingegeben, weil sie über useInference
 * verwaltet werden (Worker-Anbindung).
 */
type ControlsDrawerProps = {
  models: ModelSpec[];
  currentModelId: string | null;
  onSwitchModel: (modelId: string) => void;
};

/**
 * Drawer-Komponente.
 *
 * @param props Siehe ControlsDrawerProps.
 * @returns Trigger-Button + Drawer (zusammen gerendert, Sichtbarkeit gesteuert).
 */
export function ControlsDrawer({
  models,
  currentModelId,
  onSwitchModel,
}: ControlsDrawerProps): JSX.Element {
  // Lokaler State: ist der Drawer gerade offen?
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      {/* Trigger-Button: schwebt oben rechts.
          Aria-expanded signalisiert Screenreadern, dass es ein
          ausklappbares Element steuert. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Einstellungen öffnen"
        aria-expanded={isOpen}
        className="absolute top-4 right-4 w-12 h-12 rounded-full
                   bg-white/10 backdrop-blur-glass border border-white/20
                   flex items-center justify-center text-white
                   hover:bg-white/15 active:scale-95
                   transition-all duration-200 shadow-lg"
      >
        {/* Inline-SVG-Icon (Heroicons "adjustments-horizontal", MIT-Lizenz) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
      </button>

      {/* Drawer + Backdrop — nur gerendert, wenn isOpen, mit Animation. */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop: halbtransparenter dunkler Hintergrund.
                Klick darauf schließt das Drawer (häufiges UX-Pattern). */}
            <motion.div
              className="absolute inset-0 z-30 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer: schiebt von unten rein.
                z-40 stellt sicher, dass er über dem Backdrop liegt. */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Einstellungen"
              className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh]
                         overflow-y-auto p-4 sm:p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            >
              <GlassPanel elevated className="p-5 sm:p-6 space-y-6">
                {/* Header mit Titel und Schließen-Button */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Einstellungen
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Einstellungen schließen"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15
                               flex items-center justify-center text-white
                               transition-colors"
                  >
                    {/* "x"-Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Sektionen */}
                <ModelPicker
                  models={models}
                  currentModelId={currentModelId}
                  onSwitch={onSwitchModel}
                />
                <ConfidenceSlider />
                <ClassFilter />
              </GlassPanel>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
