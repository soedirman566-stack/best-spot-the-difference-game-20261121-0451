// engine.js — the rules of Twin Views: state, timing, scoring, hints.
//
// The engine owns no DOM. main.js hands it the two panel contexts and calls
// render() from its own animation loop; the engine answers clicks, spends
// hints and reports every change through the onEvent callback so the HUD
// always shows the truth.

import { SCENES } from './scenes.js';
import { paintPanel, paintFoundRing, paintHintPulse } from './render.js';
import { sounds } from './audio.js';

export const MISS_TIME_PENALTY = 5;   // seconds lost on a wrong click
export const FIND_POINTS = 100;       // points for each difference found
export const SECOND_BONUS = 2;        // points per second left at level end
export const MISS_POINT_PENALTY = 25; // points lost on a wrong click

function cloneProps(props) {
  return JSON.parse(JSON.stringify(props));
}

// Functions cannot be cloned with JSON, so a scene's differences are kept
// apart from its props: the right panel is a fresh clone with every
// difference's change() applied, in scene order.
function buildRightProps(scene) {
  const props = cloneProps(scene.props);
  const byId = (id) => props.find((p) => p.id === id);
  for (const diff of scene.differences) diff.change(props, byId);
  return props;
}

export class SpotGame {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.state = 'title'; // title | playing | levelDone | gameDone | timeUp
    this.levelIndex = 0;
    this.score = 0;
    this.totalMistakes = 0;
    this.levelsWon = [];
    this.frozen = false; // set by the screenshot hook: the clock stands still
    this.loadLevel(0);
  }

  get scene() {
    return SCENES[this.levelIndex];
  }

  get sceneCount() {
    return SCENES.length;
  }

  get isLastLevel() {
    return this.levelIndex + 1 >= SCENES.length;
  }

  get remaining() {
    return this.found.filter((f) => !f).length;
  }

  loadLevel(index) {
    this.levelIndex = index;
    const scene = this.scene;
    this.leftProps = cloneProps(scene.props);
    this.rightProps = buildRightProps(scene);
    this.found = scene.differences.map(() => false);
    this.foundAt = scene.differences.map(() => 0);
    this.hintsLeft = scene.hints;
    this.timeLeft = scene.seconds;
    this.mistakes = 0;
    this.levelScore = 0;
    this.hintIndex = -1;
    this.hintUntil = 0;
    this.lastWholeSecond = Math.ceil(this.timeLeft);
  }

  startLevel() {
    this.state = 'playing';
    this.emit('start');
  }

  startGame() {
    this.score = 0;
    this.totalMistakes = 0;
    this.levelsWon = [];
    this.loadLevel(0);
    this.startLevel();
  }

  nextLevel() {
    if (this.levelIndex + 1 >= SCENES.length) {
      this.state = 'gameDone';
      this.emit('gameDone');
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.startLevel();
  }

  // Advance the clock. Called with the elapsed seconds since the last call.
  update(dt, now) {
    if (this.state !== 'playing' || this.frozen) return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const whole = Math.ceil(this.timeLeft);
    if (whole !== this.lastWholeSecond) {
      this.lastWholeSecond = whole;
      if (whole <= 10 && whole > 0) sounds.tick();
      this.emit('tick');
    }
    if (this.hintIndex >= 0 && now > this.hintUntil) this.hintIndex = -1;
    if (this.timeLeft <= 0) {
      this.state = 'timeUp';
      sounds.timeUp();
      this.emit('timeUp');
    }
  }

  // A click on either panel, in panel coordinates. Returns what happened.
  click(x, y, now) {
    if (this.state !== 'playing') return 'idle';
    const scene = this.scene;
    for (let i = 0; i < scene.differences.length; i++) {
      if (this.found[i]) continue;
      const hit = scene.differences[i].hits.some(
        (h) => (x - h.x) ** 2 + (y - h.y) ** 2 <= h.r ** 2,
      );
      if (hit) {
        this.found[i] = true;
        this.foundAt[i] = now;
        if (this.hintIndex === i) this.hintIndex = -1;
        this.score += FIND_POINTS;
        this.levelScore += FIND_POINTS;
        sounds.pop();
        this.emit('found', { index: i });
        if (this.remaining === 0) {
          const bonus = Math.ceil(this.timeLeft) * SECOND_BONUS;
          this.score += bonus;
          this.levelScore += bonus;
          this.levelsWon.push({
            title: scene.title,
            score: this.levelScore,
            mistakes: this.mistakes,
            secondsLeft: Math.ceil(this.timeLeft),
          });
          this.state = 'levelDone';
          sounds.fanfare();
          this.emit('levelDone', { bonus });
        }
        return 'found';
      }
    }
    // No difference there: time and points slip away, and the panels shake.
    this.mistakes += 1;
    this.totalMistakes += 1;
    this.timeLeft = Math.max(0, this.timeLeft - MISS_TIME_PENALTY);
    this.score = Math.max(0, this.score - MISS_POINT_PENALTY);
    sounds.buzz();
    this.emit('miss', { x, y });
    if (this.timeLeft <= 0) {
      this.state = 'timeUp';
      sounds.timeUp();
      this.emit('timeUp');
    }
    return 'miss';
  }

  // Spend one hint: pulse a random difference that is still unfound.
  useHint(now) {
    if (this.state !== 'playing' || this.hintsLeft <= 0) return false;
    const open = this.scene.differences
      .map((_, i) => i)
      .filter((i) => !this.found[i]);
    if (open.length === 0) return false;
    this.hintIndex = open[Math.floor(Math.random() * open.length)];
    this.hintUntil = now + 1600;
    this.hintsLeft -= 1;
    sounds.hint();
    this.emit('hint', { index: this.hintIndex });
    return true;
  }

  // Paint both panels plus the markers earned so far. `now` is a
  // millisecond clock used for the ring breathing and the hint pulse.
  render(leftCtx, rightCtx, now) {
    paintPanel(leftCtx, this.leftProps);
    paintPanel(rightCtx, this.rightProps);
    const scene = this.scene;
    for (const ctx of [leftCtx, rightCtx]) {
      scene.differences.forEach((diff, i) => {
        if (this.found[i]) {
          const age = (now - this.foundAt[i]) / 1000;
          paintFoundRing(ctx, diff.ring, (age % 2.4) / 2.4);
        }
      });
      if (this.hintIndex >= 0) {
        const diff = scene.differences[this.hintIndex];
        const phase = ((now % 800) / 800);
        paintHintPulse(ctx, diff.ring, phase);
      }
    }
  }

  emit(type, data) {
    this.onEvent(type, data || {});
  }
}
