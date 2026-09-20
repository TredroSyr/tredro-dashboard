let audioContext: AudioContext | null = null;

type Tone = { freq: number; offset: number; duration: number; volume: number };

/**
 * Plays a sequence of sine tones via the Web Audio API. No audio asset needed,
 * and this works the same in a browser tab and inside the Capacitor webview.
 */
const playTones = (tones: Tone[], type: OscillatorType = "sine") => {
  try {
    if (typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext ??= new AudioContextClass();
    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    tones.forEach(({ freq, offset, duration, volume }) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + offset;

      oscillator.type = type;
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  } catch (error) {
    console.error("❌ Failed to play sound:", error);
  }
};

/** Two-tone chime — used for foreground push notifications. */
export const playNotificationSound = () =>
  playTones([
    { freq: 880, offset: 0, duration: 0.18, volume: 0.2 },
    { freq: 1320, offset: 0.12, duration: 0.18, volume: 0.2 },
  ]);

/** Rising two-note "ding" for success toasts. */
export const playSuccessSound = () =>
  playTones([
    { freq: 660, offset: 0, duration: 0.16, volume: 0.18 },
    { freq: 990, offset: 0.1, duration: 0.24, volume: 0.18 },
  ]);

/** Low, falling buzz for error toasts. */
export const playErrorSound = () =>
  playTones(
    [
      { freq: 300, offset: 0, duration: 0.16, volume: 0.15 },
      { freq: 200, offset: 0.14, duration: 0.24, volume: 0.15 },
    ],
    "triangle",
  );
