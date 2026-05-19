/**
 * ClassFilter.test.tsx — Komponententests für den Klassen-Filter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassFilter } from './ClassFilter';
import { useSettingsStore } from '@/stores/settingsStore';

describe('ClassFilter', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('zeigt initial "80 / 80" und alle Klassen aktiviert', () => {
    render(<ClassFilter />);
    expect(screen.getByText(/80 \/ 80/)).toBeInTheDocument();

    // Alle Pills sollten aria-pressed=true haben (alle initial aktiv).
    const pills = screen.getAllByRole('button', { pressed: true });
    // 80 Klassen-Pills + ggf. die "Alle"/"Keine"-Buttons sind getrennte buttons,
    // wir suchen nur die mit pressed-Status.
    expect(pills.length).toBe(80);
  });

  it('deaktiviert alle Klassen über den "Keine"-Button', async () => {
    const user = userEvent.setup();
    render(<ClassFilter />);

    await user.click(screen.getByRole('button', { name: 'Keine' }));

    expect(useSettingsStore.getState().enabledClassIds.length).toBe(0);
    // Header zeigt nun "0 / 80"
    expect(screen.getByText(/0 \/ 80/)).toBeInTheDocument();
  });

  it('aktiviert alle Klassen über den "Alle"-Button', async () => {
    const user = userEvent.setup();
    // Vorher leeren
    useSettingsStore.getState().disableAllClasses();

    render(<ClassFilter />);
    await user.click(screen.getByRole('button', { name: 'Alle' }));

    expect(useSettingsStore.getState().enabledClassIds.length).toBe(80);
  });

  it('toggelt eine einzelne Klasse beim Klick auf die Pill', async () => {
    const user = userEvent.setup();
    render(<ClassFilter />);

    // "Person" ist klar identifizierbar — wir klicken die Pill.
    const personPill = screen.getByRole('button', { name: 'Person', pressed: true });
    await user.click(personPill);

    expect(useSettingsStore.getState().enabledClassIds).not.toContain(0);
  });
});
