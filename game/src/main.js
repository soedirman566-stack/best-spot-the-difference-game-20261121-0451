// main.js — wires the Twin Views engine to the page: canvases, HUD,
// overlays, keyboard, and the animation loop. It also carries the
// screenshot hook: URL parameters such as ?level=2&found=0,3&time=58 set
// up a frozen mid-game scene so the entry's screenshots are real renders
// of exactly the state they show.

import { SpotGame } from './engine.js';
import { PANEL_W, PANEL_H } from './scenes.js';

const leftCanvas = document.getElementById('panel-left');
const rightCanvas = document.getElementById('panel-right');
const leftCtx = leftCanvas.getContext('2d');
const rightCtx = rightCanvas.getContext('2d');

const stage = document.getElementById('stage');
const levelName = document.getElementById('level-name');
const counterNumber = document.getElementById('counter-number');
const timerText = document.getElementById('timer-text');
const timerFill = document.getElementById('timer-fill');
const scoreNumber = document.getElementById('score-number');
const hintButton = document.getElementById('hint-button');
const hintCount = document.getElementById('hint-count');
const missFlash = document.getElementById('miss-flash');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayBody = document.getElementById('overlay-body');
const overlayStats = document.getElementById('overlay-stats');
const overlayButton = document.getElementById('overlay-button');

const game = new SpotGame(onGameEvent);
window.__twinViews = game; // play-test hook: the state, readable from tests

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function refreshHud() {
  levelName.textContent = `${game.scene.title} — ${game.scene.subtitle.split('·')[0].trim()}`;
  counterNumber.textContent = String(game.remaining);
  timerText.textContent = formatTime(game.timeLeft);
  const low = game.timeLeft <= 15;
  timerText.classList.toggle('low', low);
  timerFill.classList.toggle('low', low);
  timerFill.style.width = `${(game.timeLeft / game.scene.seconds) * 100}%`;
  scoreNumber.textContent = String(game.score);
  hintCount.textContent = String(game.hintsLeft);
  hintButton.disabled = game.hintsLeft <= 0 || game.state !== 'playing';
}

function showOverlay(title, body, stats, buttonLabel) {
  overlayTitle.textContent = title;
  overlayBody.innerHTML = body;
  overlayStats.innerHTML = stats || '';
  overlayButton.textContent = buttonLabel;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function levelStats(bonus) {
  const won = game.levelsWon[game.levelsWon.length - 1];
  if (!won) return '';
  return `⏱ ${won.secondsLeft}s to spare · ⭐ time bonus +${bonus}<br>` +
    `🎯 mistakes this level: ${won.mistakes} · 🏆 level score ${won.score}`;
}

function finalStats() {
  const rows = game.levelsWon
    .map((w, i) => `Level ${i + 1} · ${w.title} — ${w.score} pts (${w.mistakes} mistakes)`)
    .join('<br>');
  return `${rows}<br><br>⭐ Final score: <b>${game.score}</b> · 🎯 total mistakes: ${game.totalMistakes}`;
}

function onGameEvent(type, data) {
  refreshHud();
  if (type === 'miss') {
    stage.classList.remove('shake');
    void stage.offsetWidth; // restart the shake animation
    stage.classList.add('shake');
    missFlash.classList.add('on');
    setTimeout(() => missFlash.classList.remove('on'), 180);
  }
  if (type === 'levelDone') {
    const last = game.levelIndex + 1 >= game.sceneCount;
    showOverlay(
      '🎉 Level complete!',
      `You found every difference in <b>${game.scene.title}</b>.`,
      levelStats(data.bonus),
      last ? 'See your score' : 'Next level →',
    );
  }
  if (type === 'gameDone') {
    showOverlay('🏆 You finished Twin Views!', 'Every picture pair solved. Sharp eyes!', finalStats(), 'Play again');
  }
  if (type === 'timeUp') {
    showOverlay(
      '⏰ Time up!',
      `The clock beat you in <b>${game.scene.title}</b> with ${game.remaining} difference(s) still hiding.`,
      `⭐ Score so far: <b>${game.score}</b>`,
      'Try again',
    );
  }
}

// ------------------------------------------------------------ player input

function panelPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * PANEL_W,
    y: ((event.clientY - rect.top) / rect.height) * PANEL_H,
  };
}

for (const canvas of [leftCanvas, rightCanvas]) {
  canvas.addEventListener('click', (event) => {
    const { x, y } = panelPoint(canvas, event);
    game.click(x, y, performance.now());
    refreshHud();
  });
}

hintButton.addEventListener('click', () => {
  game.useHint(performance.now());
  refreshHud();
});

overlayButton.addEventListener('click', () => {
  hideOverlay();
  if (game.state === 'title' || game.state === 'timeUp' || game.state === 'gameDone') {
    game.startGame();
  } else if (game.state === 'levelDone') {
    game.nextLevel();
  }
  refreshHud();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'h' || event.key === 'H') {
    game.useHint(performance.now());
    refreshHud();
  }
  if ((event.key === 'Enter' || event.key === ' ') && !overlay.classList.contains('hidden')) {
    event.preventDefault();
    overlayButton.click();
  }
});

// ------------------------------------------------------------ the loop

let lastStamp = performance.now();
function frame(stamp) {
  const dt = Math.min(0.05, (stamp - lastStamp) / 1000);
  lastStamp = stamp;
  game.update(dt, stamp);
  game.render(leftCtx, rightCtx, stamp);
  if (game.state === 'playing') refreshHud();
  requestAnimationFrame(frame);
}

// ------------------------------------------------- screenshot / test hook
// ?level=N (1-based) &found=0,2 &time=73 &hint=4 &state=complete
// Freezes the clock and pre-marks finds so screenshots show a real
// mid-game moment. With no parameters the game starts at its title card.

function applyScreenshotHook() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) return false;
  const level = Math.max(1, parseInt(params.get('level') || '1', 10));
  game.loadLevel(level - 1);
  game.state = 'playing';
  game.frozen = true;
  const foundList = (params.get('found') || '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n));
  const now = performance.now();
  for (const i of foundList) {
    if (i >= 0 && i < game.found.length) {
      game.found[i] = true;
      game.foundAt[i] = now - 900;
      game.score += 100;
      game.levelScore += 100;
    }
  }
  if (params.has('time')) game.timeLeft = parseFloat(params.get('time'));
  if (params.has('hint')) {
    const idx = parseInt(params.get('hint'), 10);
    if (Number.isInteger(idx) && !game.found[idx]) {
      game.hintIndex = idx;
      game.hintUntil = Number.POSITIVE_INFINITY;
      game.hintsLeft = Math.max(0, game.hintsLeft - 1);
    }
  }
  hideOverlay();
  if (params.get('state') === 'complete') {
    game.found = game.found.map(() => true);
    game.foundAt = game.foundAt.map(() => now - 900);
    const finds = game.found.length - foundList.length;
    game.score += finds * 100;
    game.levelScore += finds * 100;
    const bonus = Math.ceil(game.timeLeft) * 2;
    game.levelsWon.push({
      title: game.scene.title,
      score: game.levelScore + bonus,
      mistakes: 1,
      secondsLeft: Math.ceil(game.timeLeft),
    });
    game.state = 'levelDone';
    showOverlay(
      '🎉 Level complete!',
      `You found every difference in <b>${game.scene.title}</b>.`,
      levelStats(bonus),
      game.isLastLevel ? 'See your score' : 'Next level →',
    );
  }
  refreshHud();
  return true;
}

if (!applyScreenshotHook()) {
  showOverlay(
    '👀 Twin Views',
    'Two pictures, side by side — but not quite twins. ' +
      'Find every difference before the clock runs out.<br><br>' +
      '🖱 Click a difference on either picture · ❌ a wrong click costs <b>5 seconds</b> · ' +
      '💡 you get <b>2 hints</b> per level (key <b>H</b>) · ⭐ each find is worth 100 points, plus a time bonus.',
    '',
    'Start hunting',
  );
}
refreshHud();
requestAnimationFrame(frame);
