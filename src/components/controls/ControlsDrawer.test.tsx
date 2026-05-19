/**
 * ControlsDrawer.test.tsx — Open/Close-Verhalten des Bottom-Sheets
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlsDrawer } from './ControlsDrawer';

describe('ControlsDrawer', () => {
  it('startet geschlossen — Drawer-Inhalt ist NICHT im DOM', () => {
    render(
      <ControlsDrawer models={[]} currentModelId={null} onSwitchModel={() => {}} />,
    );
    // Trigger ist sichtbar
    expect(screen.getByRole('button', { name: /einstellungen öffnen/i }))
      .toBeInTheDocument();
    // Drawer-Inhalt (Überschrift) ist nicht da
    expect(screen.queryByRole('heading', { name: /einstellungen/i })).toBeNull();
  });

  it('öffnet beim Klick auf den Trigger', async () => {
    const user = userEvent.setup();
    render(
      <ControlsDrawer models={[]} currentModelId={null} onSwitchModel={() => {}} />,
    );

    await user.click(screen.getByRole('button', { name: /einstellungen öffnen/i }));

    // Drawer ist jetzt offen — Überschrift sichtbar
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
  });

  it('schließt beim Klick auf den X-Button', async () => {
    const user = userEvent.setup();
    render(
      <ControlsDrawer models={[]} currentModelId={null} onSwitchModel={() => {}} />,
    );

    // Öffnen
    await user.click(screen.getByRole('button', { name: /einstellungen öffnen/i }));
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();

    // Schließen
    await user.click(screen.getByRole('button', { name: /einstellungen schließen/i }));

    // Heading sollte nach Animation aus dem DOM verschwinden — wir lassen
    // Framer Motion eine kurze Zeit für die Exit-Animation.
    // Für den Test reicht es zu prüfen, dass der State-Wechsel erfolgt ist;
    // AnimatePresence rendert nach Exit nichts mehr.
    // queryByRole gibt null zurück, sobald das Element nicht mehr existiert.
    // Wir warten kurz auf das Verschwinden (max 500ms).
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByRole('heading', { name: 'Einstellungen' })).toBeNull();
  });

  it('integriert den Modell-Picker mit den übergebenen Daten', async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    render(
      <ControlsDrawer
        models={[
          {
            id: 'yolo11n-coco',
            name: 'YOLO11N',
            displayName: 'YOLO v11 Nano',
            path: 'yolo11n-coco.onnx',
            inputSize: [1, 3, 640, 640],
            precision: 'fp32',
            sizeBytes: 10_000_000,
            description: 'Nano.',
            classes: [],
          },
        ]}
        currentModelId="yolo11n-coco"
        onSwitchModel={onSwitch}
      />,
    );

    await user.click(screen.getByRole('button', { name: /einstellungen öffnen/i }));
    expect(screen.getByText('YOLO v11 Nano')).toBeInTheDocument();
  });
});
