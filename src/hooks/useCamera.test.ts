/**
 * ============================================================================
 * useCamera.test.ts — Tests für den Kamera-Hook
 * ============================================================================
 *
 * Wir testen zwei Ebenen:
 *   1. Die reine Helfer-Funktion `buildConstraints` (deterministisch, easy)
 *   2. Den `useCamera`-Hook selbst (mit gemocktem getUserMedia)
 *
 * Für Hook-Tests nutzen wir `renderHook` aus @testing-library/react — das
 * rendert eine "leere" Komponente, die nur den Hook aufruft, und gibt
 * dessen Rückgabewert zurück. Sehr praktisch, weil wir keine UI brauchen.
 *
 * --- Vitest-Mock-Konzept ---
 *
 * vi.fn() erzeugt eine Mock-Funktion (wie unittest.mock.Mock in Python).
 * vi.spyOn(obj, 'method') ersetzt eine echte Methode temporär.
 *
 * Wir mocken navigator.mediaDevices.getUserMedia, damit Tests in jsdom
 * laufen — dort existiert keine echte Kamera.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { buildConstraints, useCamera } from './useCamera';

describe('buildConstraints', () => {
  it('erzeugt audio: false (DSGVO — niemals Audio)', () => {
    const constraints = buildConstraints('environment', { width: 1280, height: 720 });
    expect(constraints.audio).toBe(false);
  });

  it('setzt facingMode als "ideal" (nicht "exact"), damit Desktop-Webcams nicht abgelehnt werden', () => {
    const constraints = buildConstraints('environment', { width: 1280, height: 720 });
    // Vorsicht: TS kennt das verschachtelte Schema nicht out-of-box,
    // daher Type-Cast für die Assertion.
    const video = constraints.video as MediaTrackConstraints;
    expect(video.facingMode).toEqual({ ideal: 'environment' });
  });

  it('übernimmt die gewünschte Auflösung als Idealwert', () => {
    const constraints = buildConstraints('user', { width: 640, height: 480 });
    const video = constraints.video as MediaTrackConstraints;
    expect(video.width).toEqual({ ideal: 640 });
    expect(video.height).toEqual({ ideal: 480 });
  });
});

describe('useCamera', () => {
  /**
   * Hilfsfunktion: Erzeugt einen Fake-MediaStream mit stoppbaren Tracks.
   * Wir brauchen einen echten Stream-ähnlichen Objekttyp, damit der Hook
   * `.getTracks().forEach(track => track.stop())` ausführen kann.
   */
  function makeFakeStream(): MediaStream {
    // Wir erstellen ein Minimal-Objekt, das wie ein MediaStream aussieht.
    // Die wenigen Methoden, die wir nutzen, werden gestubbt.
    const fakeTrack = { stop: vi.fn() };
    return {
      getTracks: () => [fakeTrack],
    } as unknown as MediaStream;
  }

  // Vor jedem Test: Mock-Setup für navigator.mediaDevices.
  beforeEach(() => {
    // navigator.mediaDevices existiert in jsdom standardmäßig nicht,
    // daher legen wir es selbst an.
    Object.defineProperty(window.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('startet im Status "idle"', () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('wechselt nach erfolgreichem start() in Status "granted"', async () => {
    // Mock: getUserMedia liefert einen Fake-Stream.
    const fakeStream = makeFakeStream();
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(fakeStream);

    const { result } = renderHook(() => useCamera());

    // act() umschließt async-Operationen, die State-Updates auslösen.
    // Ohne act() warnt React-Testing-Library.
    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.stream).toBe(fakeStream);
    expect(result.current.error).toBeNull();
  });

  it('setzt Status "denied" bei NotAllowedError', async () => {
    // Mock: getUserMedia wirft den typischen Permission-Denied-Fehler.
    const denyError = new Error('User denied permission');
    denyError.name = 'NotAllowedError';
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(denyError);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toBe(denyError);
    expect(result.current.stream).toBeNull();
  });

  it('setzt Status "error" bei NotFoundError (keine Kamera)', async () => {
    const notFoundError = new Error('No camera device');
    notFoundError.name = 'NotFoundError';
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(notFoundError);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(notFoundError);
  });

  it('wechselt facingMode bei switchFacing() von environment zu user', async () => {
    const fakeStream1 = makeFakeStream();
    const fakeStream2 = makeFakeStream();
    vi.mocked(navigator.mediaDevices.getUserMedia)
      .mockResolvedValueOnce(fakeStream1)
      .mockResolvedValueOnce(fakeStream2);

    const { result } = renderHook(() => useCamera({ initialFacing: 'environment' }));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.facingMode).toBe('environment');

    await act(async () => {
      await result.current.switchFacing();
    });

    // Erwartung: 2 getUserMedia-Aufrufe (Initial + Switch), zweiter mit 'user'.
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);

    // Beim Switch-Aufruf sollte der Constraints-Block facingMode: { ideal: 'user' } enthalten.
    const secondCallArgs = vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls[1][0];
    const secondVideo = secondCallArgs?.video as MediaTrackConstraints;
    expect(secondVideo.facingMode).toEqual({ ideal: 'user' });

    // facingMode-State wurde aktualisiert
    await waitFor(() => expect(result.current.facingMode).toBe('user'));
  });

  it('stoppt die Tracks beim Aufruf von stop()', async () => {
    const fakeStream = makeFakeStream();
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(fakeStream);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.start();
    });

    // Stop aufrufen
    act(() => {
      result.current.stop();
    });

    // Tracks wurden gestoppt + State zurückgesetzt
    expect(fakeStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.stream).toBeNull();
  });
});
