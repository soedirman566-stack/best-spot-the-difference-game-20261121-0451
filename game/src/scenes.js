// scenes.js — the three picture pairs of Twin Views, described as data.
//
// Every scene is a list of props (plain objects with a kind and a position)
// that render.js knows how to paint. The left panel paints the props as they
// are; the right panel paints a copy after each difference's change() has
// edited it. A difference also carries the ring the player earns (drawn on
// both panels once found) and one or more hit circles a click may land in.

function byId(props, id) {
  return props.find((p) => p.id === id);
}

function without(props, id) {
  const at = props.findIndex((p) => p.id === id);
  if (at >= 0) props.splice(at, 1);
}

// ---------------------------------------------------------------- scene one
// Sunny Cove Market: a beach stall under the palms. Five differences, the
// gentlest set — bold colour swaps and one vanished beach ball.

const coveMarket = {
  id: 'cove-market',
  title: 'Sunny Cove Market',
  subtitle: 'Level 1 · 5 differences',
  seconds: 120,
  hints: 2,
  props: [
    { id: 'sky', kind: 'sky', top: '#8ed8f8', bottom: '#dff6ff' },
    { id: 'sun', kind: 'sun', x: 70, y: 62, r: 30, face: 'shades' },
    { id: 'cloud-a', kind: 'cloud', x: 208, y: 48, s: 1.05, tint: '#ffffff' },
    { id: 'cloud-b', kind: 'cloud', x: 402, y: 86, s: 0.8, tint: '#f4fbff' },
    { id: 'cloud-c', kind: 'cloud', x: 505, y: 38, s: 0.55, tint: '#ffffff' },
    { id: 'sea', kind: 'sea', y: 148, h: 74, color: '#2aa7c9' },
    { id: 'gull-a', kind: 'gull', x: 296, y: 96, s: 1 },
    { id: 'gull-b', kind: 'gull', x: 344, y: 112, s: 0.7 },
    { id: 'boat', kind: 'boat', x: 428, y: 178, s: 1, sail: '#ffffff', flag: true },
    { id: 'sand', kind: 'sand', y: 222, h: 198, color: '#f6dd9a' },
    { id: 'palm-a', kind: 'palm', x: 50, y: 330, s: 1.12, lean: -6, coconuts: 2 },
    { id: 'palm-b', kind: 'palm', x: 516, y: 322, s: 0.95, lean: 7, coconuts: 3 },
    { id: 'stall', kind: 'stall', x: 118, y: 238, w: 150, awning: '#e2483d' },
    { id: 'crate-a', kind: 'crate', x: 128, y: 356, fruit: 'orange' },
    { id: 'crate-b', kind: 'crate', x: 188, y: 356, fruit: 'apple' },
    { id: 'crate-c', kind: 'crate', x: 158, y: 322, fruit: 'melon' },
    { id: 'umbrella', kind: 'umbrella', x: 336, y: 316, s: 1, color: '#ff7b54', tilt: -9 },
    { id: 'ball', kind: 'ball', x: 396, y: 372, r: 15, a: '#ffd23f', b: '#e2483d' },
    { id: 'bucket', kind: 'bucket', x: 300, y: 384, color: '#2a9d8f' },
    { id: 'star-a', kind: 'starfish', x: 92, y: 392, r: 13, color: '#ff9f43', rot: 0.4 },
    { id: 'star-b', kind: 'starfish', x: 472, y: 400, r: 11, color: '#ff6b9d', rot: -0.3 },
  ],
  differences: [
    {
      note: 'The sun lost its sunglasses',
      ring: { x: 70, y: 62, r: 40 },
      hits: [{ x: 70, y: 62, r: 40 }],
      change(props) { byId(props, 'sun').face = 'smile'; },
    },
    {
      note: 'The stall awning changed colour',
      ring: { x: 193, y: 252, r: 46 },
      hits: [{ x: 193, y: 252, r: 48 }],
      change(props) { byId(props, 'stall').awning = '#2a9d8f'; },
    },
    {
      note: 'The beach ball vanished',
      ring: { x: 396, y: 372, r: 24 },
      hits: [{ x: 396, y: 372, r: 26 }],
      change(props) { without(props, 'ball'); },
    },
    {
      note: 'A crab wandered in',
      ring: { x: 456, y: 356, r: 26 },
      hits: [{ x: 456, y: 356, r: 28 }],
      change(props) { props.push({ id: 'crab', kind: 'crab', x: 456, y: 356, s: 1, color: '#e2483d' }); },
    },
    {
      note: 'The sail turned yellow',
      ring: { x: 428, y: 138, r: 32 },
      hits: [{ x: 428, y: 140, r: 34 }],
      change(props) { byId(props, 'boat').sail = '#ffd23f'; },
    },
  ],
};

// --------------------------------------------------------------- scene two
// The Clockmaker's Workshop: lamplight, gears and a sleeping cat. Six
// differences, smaller and quieter than the beach set.

const clockWorkshop = {
  id: 'clock-workshop',
  title: "The Clockmaker's Workshop",
  subtitle: 'Level 2 · 6 differences',
  seconds: 110,
  hints: 2,
  props: [
    { id: 'room', kind: 'room', wall: '#8a6248', floor: '#5f4433', floorY: 300 },
    { id: 'window', kind: 'window', x: 56, y: 52, w: 108, h: 128 },
    { id: 'clock', kind: 'clock', x: 300, y: 94, r: 35, hour: 3, minute: 0 },
    { id: 'shelf', kind: 'shelf', x: 392, y: 96, w: 148 },
    { id: 'jar-a', kind: 'jar', x: 408, y: 96, color: '#ffb347', h: 30 },
    { id: 'jar-b', kind: 'jar', x: 440, y: 96, color: '#57c4ad', h: 24 },
    { id: 'book-a', kind: 'book', x: 472, y: 96, w: 13, h: 34, color: '#c44536', lean: 0 },
    { id: 'book-b', kind: 'book', x: 488, y: 96, w: 12, h: 30, color: '#3e6fb0', lean: 0 },
    { id: 'book-c', kind: 'book', x: 503, y: 96, w: 12, h: 32, color: '#7fb069', lean: 6 },
    { id: 'lamp-a', kind: 'lamp', x: 150, y: 0, drop: 52, glow: '#ffd98a' },
    { id: 'lamp-b', kind: 'lamp', x: 468, y: 0, drop: 52, glow: '#ffd98a' },
    { id: 'gear-a', kind: 'gear', x: 118, y: 208, r: 27, teeth: 9, color: '#c9973f', rot: 0.2 },
    { id: 'gear-b', kind: 'gear', x: 176, y: 224, r: 18, teeth: 8, color: '#8d99ae', rot: 0.7 },
    { id: 'gear-c', kind: 'gear', x: 84, y: 246, r: 14, teeth: 7, color: '#8d99ae', rot: 1.1 },
    { id: 'bench', kind: 'bench', x: 40, y: 300, w: 480 },
    { id: 'mug', kind: 'mug', x: 118, y: 300, color: '#3e6fb0', steam: true },
    { id: 'toolbox', kind: 'toolbox', x: 226, y: 300, color: '#c44536' },
    { id: 'gear-d', kind: 'gear', x: 336, y: 284, r: 16, teeth: 8, color: '#c9973f', rot: 0.4 },
    { id: 'plant', kind: 'plant', x: 448, y: 300, s: 1, pot: '#b56545' },
    { id: 'rug', kind: 'rug', x: 268, y: 356, w: 220, h: 44, color: '#a44a3f' },
    { id: 'cat', kind: 'cat', x: 372, y: 372, s: 1, eyes: 'closed', collar: '#c44536' },
    { id: 'stool', kind: 'stool', x: 84, y: 330, color: '#7a4f2c' },
  ],
  differences: [
    {
      note: 'The clock tells a different time',
      ring: { x: 300, y: 94, r: 42 },
      hits: [{ x: 300, y: 94, r: 42 }],
      change(props) { const c = byId(props, 'clock'); c.hour = 7; c.minute = 25; },
    },
    {
      note: 'A jar left the shelf',
      ring: { x: 440, y: 82, r: 22 },
      hits: [{ x: 440, y: 82, r: 24 }],
      change(props) { without(props, 'jar-b'); },
    },
    {
      note: 'The cat woke up',
      ring: { x: 372, y: 364, r: 30 },
      hits: [{ x: 372, y: 364, r: 32 }],
      change(props) { byId(props, 'cat').eyes = 'open'; },
    },
    {
      note: 'One lamp went dark',
      ring: { x: 468, y: 62, r: 28 },
      hits: [{ x: 468, y: 62, r: 30 }],
      change(props) { byId(props, 'lamp-b').glow = 'off'; },
    },
    {
      note: 'The big gear turned to iron',
      ring: { x: 118, y: 208, r: 34 },
      hits: [{ x: 118, y: 208, r: 34 }],
      change(props) { byId(props, 'gear-a').color = '#8d99ae'; },
    },
    {
      note: 'The mug stopped steaming',
      ring: { x: 118, y: 272, r: 20 },
      hits: [{ x: 118, y: 276, r: 22 }],
      change(props) { byId(props, 'mug').steam = false; },
    },
  ],
};

// -------------------------------------------------------------- scene three
// Moonlit Garden: the hardest set — seven differences under starlight,
// several of them a single flower or a flipped crescent away.

const moonGarden = {
  id: 'moon-garden',
  title: 'Moonlit Garden',
  subtitle: 'Level 3 · 7 differences',
  seconds: 100,
  hints: 2,
  props: [
    { id: 'night', kind: 'night', top: '#1d2c55', bottom: '#0d1734' },
    { id: 'stars', kind: 'stars', seed: 7, count: 70 },
    { id: 'moon', kind: 'moon', x: 478, y: 60, r: 27, phase: 'full' },
    { id: 'hill', kind: 'hill', y: 238, color: '#14291b' },
    { id: 'fence', kind: 'fence', y: 246, color: '#3a2c20' },
    { id: 'ground', kind: 'ground', y: 262, color: '#1b3a24' },
    { id: 'tree', kind: 'tree', x: 66, y: 262, s: 1.25, swing: true },
    { id: 'owl', kind: 'owl', x: 132, y: 148, s: 1 },
    { id: 'pond', kind: 'pond', x: 336, y: 356, rx: 148, ry: 40, color: '#2a4d75' },
    { id: 'lily-a', kind: 'lily', x: 282, y: 348, r: 17, flower: true },
    { id: 'lily-b', kind: 'lily', x: 378, y: 364, r: 15, flower: false },
    { id: 'frog', kind: 'frog', x: 378, y: 354, s: 1 },
    { id: 'lantern-a', kind: 'lantern', x: 186, y: 306, color: '#ffb347' },
    { id: 'lantern-b', kind: 'lantern', x: 472, y: 300, color: '#ffb347' },
    { id: 'lantern-c', kind: 'lantern', x: 250, y: 322, color: '#ffb347' },
    { id: 'patch-a', kind: 'flowers', x: 36, y: 376, cols: 6, rows: 2, main: '#ff5d8f', alt: '#c77dff' },
    { id: 'patch-b', kind: 'flowers', x: 428, y: 380, cols: 5, rows: 2, main: '#c77dff', alt: '#ff5d8f' },
    { id: 'shroom-a', kind: 'mushroom', x: 522, y: 336, s: 1, color: '#e2483d' },
    { id: 'shroom-b', kind: 'mushroom', x: 498, y: 348, s: 0.7, color: '#e8e3d9' },
    { id: 'stones', kind: 'stones', x: 300, y: 330 },
    { id: 'can', kind: 'can', x: 214, y: 392, color: '#57c4ad' },
    { id: 'fireflies', kind: 'fireflies', seed: 3, count: 14, color: '#ffe066' },
  ],
  differences: [
    {
      note: 'The full moon slimmed to a crescent',
      ring: { x: 478, y: 60, r: 36 },
      hits: [{ x: 478, y: 60, r: 36 }],
      change(props) { byId(props, 'moon').phase = 'crescent'; },
    },
    {
      note: 'The owl flew away',
      ring: { x: 132, y: 148, r: 26 },
      hits: [{ x: 132, y: 148, r: 28 }],
      change(props) { without(props, 'owl'); },
    },
    {
      note: 'A lantern glows pink instead of amber',
      ring: { x: 472, y: 292, r: 24 },
      hits: [{ x: 472, y: 292, r: 26 }],
      change(props) { byId(props, 'lantern-b').color = '#ff8fab'; },
    },
    {
      note: 'The frog hopped to the other lily pad',
      ring: { x: 282, y: 340, r: 26 },
      hits: [{ x: 378, y: 354, r: 27 }, { x: 282, y: 340, r: 27 }],
      change(props) { const f = byId(props, 'frog'); f.x = 282; f.y = 338; },
    },
    {
      note: 'One flower turned gold',
      ring: { x: 96, y: 376, r: 17 },
      hits: [{ x: 96, y: 376, r: 19 }],
      change(props) { byId(props, 'patch-a').special = { col: 3, row: 0, color: '#ffd23f' }; },
    },
    {
      note: 'The swing is gone from the tree',
      ring: { x: 104, y: 216, r: 28 },
      hits: [{ x: 104, y: 216, r: 30 }],
      change(props) { byId(props, 'tree').swing = false; },
    },
    {
      note: 'The tall mushroom turned violet',
      ring: { x: 522, y: 330, r: 22 },
      hits: [{ x: 522, y: 330, r: 24 }],
      change(props) { byId(props, 'shroom-a').color = '#8b5cf6'; },
    },
  ],
};

export const SCENES = [coveMarket, clockWorkshop, moonGarden];
export const PANEL_W = 560;
export const PANEL_H = 420;
