let audioCtx: AudioContext | null = null;

/**
 * Plays a clean two-tone Web Audio API chime for Earthquake Early Warning alerts.
 * Fails silently if browser autoplay blocks audio prior to user gesture.
 */
export function playEEWAlertChime(isCancelled = false): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!audioCtx) {
      audioCtx = new AudioContextCtor();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const notes = isCancelled ? [523.25, 392.0] : [880.0, 1174.66, 880.0, 1174.66];
    const step = isCancelled ? 0.16 : 0.14;

    notes.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isCancelled ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);

      gain.gain.setValueAtTime(0.0001, now + idx * step);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * step + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * step + step - 0.01);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * step);
      osc.stop(now + idx * step + step);
    });
  } catch {
    // Ignore Web Audio errors in headless or restricted environments
  }
}
