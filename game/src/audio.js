// audio.js — every sound in Twin Views is synthesized with WebAudio.
// No audio files exist; each effect is a small envelope of oscillators.

let ctx = null;

function ensureContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One tone with a pitch glide and a soft exponential decay.
function tone({ type = 'sine', from = 440, to = from, start = 0, dur = 0.18, gain = 0.16 }) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sounds = {
  // A find: a bright two-step pop, up a happy fifth.
  pop() {
    tone({ type: 'sine', from: 620, to: 880, dur: 0.1, gain: 0.2 });
    tone({ type: 'sine', from: 930, to: 1240, start: 0.055, dur: 0.14, gain: 0.16 });
  },
  // A miss: a soft, low buzz that says "not there" without scolding.
  buzz() {
    tone({ type: 'sawtooth', from: 140, to: 110, dur: 0.22, gain: 0.07 });
    tone({ type: 'square', from: 98, to: 82, dur: 0.22, gain: 0.045 });
  },
  // A hint being spent: a gentle sparkle.
  hint() {
    tone({ type: 'triangle', from: 1320, to: 1760, dur: 0.16, gain: 0.1 });
  },
  // The last seconds ticking away.
  tick() {
    tone({ type: 'sine', from: 1050, to: 1050, dur: 0.05, gain: 0.06 });
  },
  // Level cleared: a short rising arpeggio.
  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone({ type: 'triangle', from: f, to: f, start: i * 0.09, dur: 0.22, gain: 0.14 }));
  },
  // Out of time: a small descending sigh.
  timeUp() {
    tone({ type: 'triangle', from: 392, to: 330, dur: 0.25, gain: 0.12 });
    tone({ type: 'triangle', from: 330, to: 262, start: 0.2, dur: 0.4, gain: 0.12 });
  },
};
