// In-app alarm sound — a loud, looping two-tone beep synthesized with Web Audio
// (no asset file needed). Used by the check-in alarm overlay so a due check-in
// rings until the worker acknowledges it.
//
// iOS note: an AudioContext starts *suspended* and can only be resumed inside a
// user gesture. We prime it on the first tap/keypress (initAlarmPriming) and
// re-resume when the app returns to the foreground, so a later programmatic
// startAlarm() can actually make sound. This is the hard browser limit behind
// "the alarm only rings while the app is open".

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let beepTimer: number | null = null;
let vibeTimer: number | null = null;
let primed = false;

function getCtx(): AudioContext | null {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Unlock audio on a user gesture (iOS). Safe to call repeatedly.
export function primeAlarmAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (primed) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    g.gain.value = 0.0001; // effectively silent — just to unlock the context
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.02);
    primed = true;
  } catch {
    /* ignore */
  }
}

// Attach one-time global listeners so audio is unlocked the first time the
// worker touches the app, and re-armed whenever the app regains focus.
export function initAlarmPriming(): void {
  const unlock = () => primeAlarmAudio();
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  });
}

// Start the looping alarm. No-op if already ringing.
export function startAlarm(): void {
  const c = getCtx();
  if (!c || beepTimer != null) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!master) {
    master = c.createGain();
    master.gain.value = 0.9;
    master.connect(c.destination);
  }

  let high = false;
  const beep = () => {
    const cc = ctx;
    if (!cc || !master) return;
    const t = cc.currentTime;
    const o = cc.createOscillator();
    const g = cc.createGain();
    o.type = "square";
    o.frequency.value = high ? 988 : 784; // alternating two-tone
    high = !high;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.25);
  };
  beep();
  beepTimer = window.setInterval(beep, 300);

  // haptics — works on Android, silently ignored on iOS
  const buzz = () => {
    try {
      navigator.vibrate?.([400, 180, 400]);
    } catch {
      /* ignore */
    }
  };
  buzz();
  vibeTimer = window.setInterval(buzz, 1600);
}

export function stopAlarm(): void {
  if (beepTimer != null) {
    clearInterval(beepTimer);
    beepTimer = null;
  }
  if (vibeTimer != null) {
    clearInterval(vibeTimer);
    vibeTimer = null;
  }
  try {
    navigator.vibrate?.(0);
  } catch {
    /* ignore */
  }
}
