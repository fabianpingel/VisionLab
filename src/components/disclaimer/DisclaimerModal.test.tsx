/**
 * ============================================================================
 * DisclaimerModal.test.tsx — Komponententests für den Disclaimer
 * ============================================================================
 *
 * Wir prüfen die Verhaltensregeln, die rechtlich/UX-kritisch sind:
 *   1. "App starten"-Button ist disabled, solange die Checkbox nicht aktiv ist.
 *   2. Nach Klick auf die Checkbox wird der Button klickbar.
 *   3. Klick auf "Datenschutz" öffnet das Privacy-Modal.
 *   4. Klick auf "App starten" persistiert die Zustimmung im Store.
 *
 * --- Testing-Library-Konzept ---
 *
 * `render(...)` rendert eine Komponente in eine simulierte DOM (jsdom).
 * `screen.getByRole(...)` sucht Elemente wie ein Screenreader würde —
 * also nach semantischen Rollen ('button', 'checkbox', ...) statt nach
 * CSS-Klassen. Das macht Tests robust gegen Style-Änderungen.
 *
 * `userEvent` simuliert echte Nutzer-Interaktionen (Klicks, Tastendrücke).
 * Vorteil gegenüber `fireEvent`: realistischere Timings und Side-Effects.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisclaimerModal } from './DisclaimerModal';
import { useDisclaimerStore } from '@/stores/disclaimerStore';
import {
  DISCLAIMER_ACCEPT_BUTTON,
  DISCLAIMER_CHECKBOX_LABEL,
  DISCLAIMER_LINK_LABELS,
} from '@/content/disclaimerText';
import { PRIVACY_TITLE } from '@/content/privacyText';

describe('DisclaimerModal', () => {
  // Vor jedem Test: Store auf Initialzustand zurücksetzen.
  // Sonst würden die Tests sich gegenseitig beeinflussen.
  beforeEach(() => {
    useDisclaimerStore.getState().reset();
  });

  it('startet mit deaktiviertem "App starten"-Button', () => {
    // Komponente in den simulierten DOM rendern
    render(<DisclaimerModal />);

    // Button suchen — `getByRole('button', { name: ... })` findet den
    // Button anhand seines Anzeigetextes.
    const startButton = screen.getByRole('button', { name: DISCLAIMER_ACCEPT_BUTTON });

    // Erwartung: Der Button ist initial disabled.
    expect(startButton).toBeDisabled();
  });

  it('aktiviert den "App starten"-Button nach Klick auf die Checkbox', async () => {
    // userEvent.setup() liefert eine Test-Instanz mit modernem API
    const user = userEvent.setup();
    render(<DisclaimerModal />);

    // Die Checkbox finden — sie ist mit dem Label verknüpft, daher per Rolle.
    const checkbox = screen.getByRole('checkbox', { name: DISCLAIMER_CHECKBOX_LABEL });
    const startButton = screen.getByRole('button', { name: DISCLAIMER_ACCEPT_BUTTON });

    // Vorher: disabled
    expect(startButton).toBeDisabled();

    // Checkbox aktivieren
    await user.click(checkbox);

    // Nachher: enabled
    expect(startButton).toBeEnabled();
  });

  it('öffnet das Datenschutz-Modal beim Klick auf den Datenschutz-Link', async () => {
    const user = userEvent.setup();
    render(<DisclaimerModal />);

    // Datenschutz-Link finden und klicken
    const privacyLink = screen.getByRole('button', { name: DISCLAIMER_LINK_LABELS.privacy });
    await user.click(privacyLink);

    // Erwartung: Der Titel des Privacy-Modals ist jetzt sichtbar.
    expect(screen.getByText(PRIVACY_TITLE)).toBeInTheDocument();
  });

  it('persistiert die Zustimmung im Store nach Klick auf "App starten"', async () => {
    const user = userEvent.setup();
    render(<DisclaimerModal />);

    // Vorher: keine Zustimmung im Store
    expect(useDisclaimerStore.getState().acceptedVersion).toBeUndefined();

    // Checkbox aktivieren und Button klicken
    const checkbox = screen.getByRole('checkbox', { name: DISCLAIMER_CHECKBOX_LABEL });
    await user.click(checkbox);
    const startButton = screen.getByRole('button', { name: DISCLAIMER_ACCEPT_BUTTON });
    await user.click(startButton);

    // Nachher: Zustimmung ist im Store gespeichert
    const state = useDisclaimerStore.getState();
    expect(state.acceptedVersion).toBeDefined();
    expect(state.acceptedAt).toBeDefined();
  });
});
