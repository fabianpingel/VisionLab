/**
 * ============================================================================
 * GlassPanel.tsx — Wiederverwendbares Glassmorphism-Container-Komponente
 * ============================================================================
 *
 * Was ist Glassmorphism?
 *   Ein UI-Stil, bei dem Karten/Panels wie Milchglas aussehen:
 *   halbtransparenter Hintergrund + Backdrop-Blur + leichte Border.
 *   Bekannt aus iOS- und macOS-UI seit Big Sur.
 *
 *   CSS-Technik:
 *     background-color: rgba(255,255,255,0.06);
 *     backdrop-filter: blur(20px);   ← der "Milchglas"-Effekt
 *     border: 1px solid rgba(...);
 *
 * --- React-Konzept: "Props" und "Children" ---
 *
 * Eine Komponente nimmt "Props" entgegen (analog zu Funktionsparametern).
 * `children` ist eine besondere Prop: alles, was zwischen <GlassPanel>...</GlassPanel>
 * steht, landet hier. So lassen sich Container-Komponenten flexibel füllen.
 *
 * Vergleich zu Python: wie eine Decorator-Klasse, die beliebigen Inhalt umschließt.
 */

import type { ReactNode } from 'react';

/**
 * Typ-Definition der Props (= Funktionsparameter dieser Komponente).
 *
 * - children: Der Inhalt, der im Panel angezeigt wird.
 * - className: Zusätzliche Tailwind-Klassen, optional (z.B. für Größe/Position).
 * - elevated: Wenn true, wird ein dezenter Schatten + stärkerer Hintergrund
 *             verwendet — für Modal-Hauptkarten statt nested Panels.
 */
type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

/**
 * Glassmorphism-Container — umschließt beliebigen Inhalt mit Frosted-Glass-Optik.
 *
 * @param props.children Inhalt des Panels (JSX).
 * @param props.className Optionale zusätzliche CSS-Klassen.
 * @param props.elevated Optional, true für stärker hervorgehobene Hauptpanels.
 *
 * @example
 * <GlassPanel elevated className="max-w-md p-6">
 *   <h1>Hallo</h1>
 * </GlassPanel>
 */
export function GlassPanel({
  children,
  className = '',
  elevated = false,
}: GlassPanelProps): JSX.Element {
  // Tailwind-Klassen werden konditional kombiniert.
  // Vorteil dieser Methode: kein externes Klassennamen-Lib nötig.
  const baseClasses = [
    'rounded-glass', // 24px Eckenradius (in tailwind.config.ts definiert)
    'backdrop-blur-glass', // 20px Backdrop-Blur
    'border',
    'border-white/10', // halbtransparente weiße Border (10% Alpha)
  ];
  const surfaceClasses = elevated
    ? // elevated: stärkerer Hintergrund + dezenter Schatten
      ['bg-white/[0.08]', 'shadow-2xl', 'shadow-black/40']
    : // nicht-elevated: schwächerer Hintergrund
      ['bg-white/[0.05]'];

  // Alle Klassen zusammenfügen — Reihenfolge: Basis, Surface, externe.
  const combined = [...baseClasses, ...surfaceClasses, className].join(' ');

  return <div className={combined}>{children}</div>;
}
