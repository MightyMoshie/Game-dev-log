let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const a = ac();
  if (a && a.state === "suspended") void a.resume();
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.06, at = 0): void {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(a.destination);
  const t = a.currentTime + at;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function click(): void {
  beep(520, 0.05, "square", 0.04);
}

export function yank(): void {
  beep(180, 0.12, "sawtooth", 0.07);
  beep(90, 0.18, "square", 0.05, 0.04);
}

export function ride(): void {
  beep(440, 0.08, "square", 0.045);
  beep(660, 0.1, "square", 0.04, 0.07);
}

export function bell(): void {
  beep(880, 0.25, "triangle", 0.07);
  beep(1320, 0.35, "triangle", 0.05, 0.12);
  beep(660, 0.4, "sine", 0.04, 0.2);
}

export function tick(): void {
  beep(1400, 0.02, "square", 0.015);
}
