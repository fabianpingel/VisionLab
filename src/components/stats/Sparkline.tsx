/**
 * ============================================================================
 * Sparkline.tsx — Mini-Diagramm für FPS-Verlauf
 * ============================================================================
 *
 * Eine Sparkline ist eine kleine, eingebettete Linien-Grafik ohne Achsen-
 * Beschriftung — sie zeigt nur den Trend einer Zeitreihe.
 * Beispiel: Aktien-Mini-Charts in Listen.
 *
 * Wir nutzen SVG statt Canvas, weil:
 *   - SVG ist deklarativ und mit React sehr gut darstellbar
 *   - Linien bleiben auf Retina-Displays automatisch scharf
 *   - Bei wenigen Datenpunkten (≤30) gibt's keinen Performance-Nachteil
 *
 * Skalierung: das Diagramm wird so skaliert, dass es immer von 0 bis zum
 * aktuellen Maximum reicht — relative Verläufe sind so gut zu sehen.
 */

/**
 * Props der Sparkline.
 */
type SparklineProps = {
  /** Datenpunkte (älteste links, neueste rechts). */
  values: number[];
  /** Breite in CSS-Pixeln. */
  width?: number;
  /** Höhe in CSS-Pixeln. */
  height?: number;
  /** Linienfarbe (CSS-Wert). */
  strokeColor?: string;
};

/**
 * Sparkline-Komponente.
 *
 * @param props Siehe SparklineProps.
 * @returns SVG-Element mit Polyline. Zeigt nichts, wenn weniger als 2 Punkte da sind.
 */
export function Sparkline({
  values,
  width = 80,
  height = 24,
  strokeColor = 'rgba(255, 255, 255, 0.85)',
}: SparklineProps): JSX.Element {
  // Mindestens zwei Punkte nötig, damit eine Linie sinnvoll ist.
  if (values.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        // Leeres SVG als Platzhalter, damit das Layout nicht springt.
        aria-hidden="true"
      />
    );
  }

  // Maximum für die Y-Achsen-Skalierung. Mindestens 1, damit wir nicht
  // durch 0 teilen und damit eine konstante Linie nicht "voll" aussieht.
  const maxValue = Math.max(...values, 1);

  // Punkte ins SVG-Koordinatensystem transformieren.
  // X: gleichmäßig über die Breite verteilt.
  // Y: invertiert (0 = oben in SVG), skaliert auf maxValue.
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      // Padding von 1 px oben und unten, damit die Linie nicht clipped.
      const y = height - 1 - (v / maxValue) * (height - 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      // overflow-visible verhindert, dass die Linie an den Rändern abgeschnitten wird,
      // falls Werte am Anfang oder Ende den maxValue-Range knapp übersteigen.
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
