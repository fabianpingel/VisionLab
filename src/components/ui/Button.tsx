/**
 * ============================================================================
 * Button.tsx — Wiederverwendbare Button-Komponente
 * ============================================================================
 *
 * Diese Komponente kapselt das Aussehen aller Buttons in der App und stellt
 * verschiedene "Variants" zur Verfügung:
 *   - primary:   Heller Hintergrund, sehr auffällig — für die wichtigste Aktion
 *   - secondary: Dezenter Hintergrund — für sekundäre Aktionen
 *   - ghost:     Nur Text/Border — für Links und Tertiäraktionen
 *
 * --- React-Konzept: HTMLButtonElement-Props weiterleiten ---
 *
 * Wir wollen, dass dieser Button alle Standard-HTML-Button-Eigenschaften
 * (onClick, disabled, type, ...) entgegen nimmt. Statt sie einzeln aufzuzählen,
 * extenden wir HTMLAttributes<HTMLButtonElement>. Das ist eine TypeScript-
 * Konvention, die in Python keine direkte Entsprechung hat — am ehesten
 * vergleichbar mit **kwargs, die an eine Basis-Funktion durchgereicht werden.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Mögliche Stil-Varianten des Buttons.
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Eigene Props plus alle Standard-HTML-Button-Attribute.
 *
 * Die Schreibweise `extends` ist hier ein TS-Type-Konstrukt:
 * "ButtonProps hat alle Felder von ButtonHTMLAttributes<HTMLButtonElement>
 *  PLUS unsere zusätzlichen Felder."
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Der angezeigte Inhalt — Text oder JSX. */
  children: ReactNode;
  /** Stil-Variante. Default: 'primary'. */
  variant?: ButtonVariant;
};

/**
 * Wiederverwendbarer Button mit konsistentem Styling.
 *
 * @param props.children Anzeigeinhalt.
 * @param props.variant Stilvariante (primary/secondary/ghost).
 * @param props.disabled Wenn true: Button ist nicht klickbar und ausgegraut.
 * @param props.className Zusätzliche Klassen für Sonderfälle.
 * @param props.rest Alle weiteren HTML-Button-Attribute (onClick, type, ...).
 *
 * @example
 * <Button variant="primary" onClick={handleStart}>App starten</Button>
 */
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest // "Rest"-Spread: nimmt alle übrigen Props auf
}: ButtonProps): JSX.Element {
  // Gemeinsame Basis-Klassen für alle Varianten.
  // transition-* und disabled:opacity sorgen für sanftes Feedback.
  const baseClasses = [
    'inline-flex items-center justify-center',
    'px-5 py-2.5 rounded-2xl',
    'font-medium text-sm',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' ');

  // Variant-spezifische Klassen.
  // Primary nutzt jetzt die Brand-Akzentfarbe (Amber-Gold von PINGEL).
  // text-accent-on ist dabei dunkles Navy — bessere Lesbarkeit auf Amber als Weiß.
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-dark active:scale-[0.98]',
    secondary: 'bg-white/10 text-white hover:bg-white/15 active:scale-[0.98]',
    ghost: 'bg-transparent text-white/80 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      // `...rest`-Spread im JSX leitet alle HTML-Button-Attribute weiter.
      // Das ist vergleichbar mit `**kwargs` in Python: alles, was nicht
      // explizit destrukturiert wurde, geht direkt ans <button>.
      {...rest}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
