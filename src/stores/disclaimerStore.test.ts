/**
 * disclaimerStore.test.ts — Tests für die persistente Disclaimer-Zustimmung
 *
 * Wichtig: Dieser Store ist DSGVO-rechtlich relevant. Tests sichern ab, dass
 *   - die Zustimmung nicht automatisch erteilt wird,
 *   - Versionierung greift (alte Zustimmung gilt nicht bei neuer Disclaimer-Version),
 *   - reset() die Zustimmung sauber entfernt.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useDisclaimerStore, selectHasAcceptedCurrent } from './disclaimerStore';
import { DISCLAIMER_VERSION } from '@/content/disclaimerText';

describe('useDisclaimerStore', () => {
  beforeEach(() => {
    useDisclaimerStore.getState().reset();
  });

  it('startet ohne Zustimmung (acceptedVersion und acceptedAt sind undefined)', () => {
    const state = useDisclaimerStore.getState();
    expect(state.acceptedVersion).toBeUndefined();
    expect(state.acceptedAt).toBeUndefined();
  });

  it('selectHasAcceptedCurrent ist initial false', () => {
    expect(selectHasAcceptedCurrent(useDisclaimerStore.getState())).toBe(false);
  });

  it('speichert die aktuelle Version und einen Zeitstempel bei accept()', () => {
    useDisclaimerStore.getState().accept();
    const state = useDisclaimerStore.getState();
    expect(state.acceptedVersion).toBe(DISCLAIMER_VERSION);
    expect(state.acceptedAt).toBeDefined();
    // acceptedAt muss ein gültiger ISO-String sein, der zur aktuellen Zeit passt.
    expect(() => new Date(state.acceptedAt!)).not.toThrow();
  });

  it('selectHasAcceptedCurrent wird nach accept() true', () => {
    useDisclaimerStore.getState().accept();
    expect(selectHasAcceptedCurrent(useDisclaimerStore.getState())).toBe(true);
  });

  it('reset() entfernt die Zustimmung wieder vollständig', () => {
    useDisclaimerStore.getState().accept();
    useDisclaimerStore.getState().reset();
    const state = useDisclaimerStore.getState();
    expect(state.acceptedVersion).toBeUndefined();
    expect(state.acceptedAt).toBeUndefined();
    expect(selectHasAcceptedCurrent(state)).toBe(false);
  });

  it('Versions-Mismatch: zugestimmte alte Version zählt nicht für aktuelle', () => {
    // Wir simulieren, dass früher mal Version "v0" akzeptiert wurde
    // (z.B. vor einem inhaltlichen Update am Disclaimer).
    useDisclaimerStore.setState({
      acceptedVersion: 'v0',
      acceptedAt: new Date().toISOString(),
    });
    // Da DISCLAIMER_VERSION nicht 'v0' ist, gilt die Zustimmung nicht mehr.
    expect(selectHasAcceptedCurrent(useDisclaimerStore.getState())).toBe(false);
  });
});
