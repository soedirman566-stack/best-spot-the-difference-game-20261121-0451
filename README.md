[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/soedirman566-stack/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/soedirman566-stack/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Twin Views — Spot the Difference

An original spot-the-difference game built for the
[make.fun](https://make.fun) bounty
[best-spot-the-difference-game-20261121-0451](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).

Two near-identical pictures sit side by side. Click a difference on either
panel and it is ringed on both; a big counter shows how many are left, and
the clock is always running. A wrong click costs 5 seconds and 25 points.
Each level allows 2 hints (button or the **H** key), which pulse a
difference that is still hiding.

## The three hunts

1. **Sunny Cove Market** — a beach market under the palms. 5 differences,
   120 seconds: bold colour swaps, a vanished beach ball, a visiting crab.
2. **The Clockmaker's Workshop** — lamplight, gears and a sleeping cat.
   6 differences, 110 seconds: a clock telling the wrong time, a lamp gone
   dark, a cat that woke up.
3. **Moonlit Garden** — the subtle set. 7 differences, 100 seconds: a moon
   slimmed to a crescent, a frog on the wrong lily pad, one gold flower in
   a whole patch.

Every scene is drawn procedurally on canvas from data — no image files, no
libraries — and every sound (the pop on a find, the buzz on a miss, the
fanfare) is synthesized with WebAudio. The game is fully static and plays
offline: serve `game/` with any static file server and open `index.html`.

## Layout

- `game/index.html`, `game/style.css` — the page and its look
- `game/src/scenes.js` — the three scenes as data: props plus differences
- `game/src/render.js` — paints a panel from a prop list; rings and pulses
- `game/src/engine.js` — state, timer, scoring, hints, level flow
- `game/src/audio.js` — the WebAudio sound kit
- `game/src/main.js` — page wiring, HUD, overlays, animation loop
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` via `vendor/makefun-game.ts`

Run the hand-in locally with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of the game in headless Chromium, set up
through the game's own URL-parameter hook (`?level=2&found=0,3&time=58`),
never edited or composited.
