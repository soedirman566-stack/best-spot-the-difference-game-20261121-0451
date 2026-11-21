// render.js — paints one panel of a scene onto a canvas context.
//
// A panel is painted from a prop list (see scenes.js). The left panel gets
// the list untouched; the right panel gets the edited copy. Markers for
// found differences and the hint pulse are painted here too, so both panels
// always agree about what the player has earned.

import { PANEL_W, PANEL_H } from './scenes.js';

// Small deterministic random generator, so stars and fireflies sit in the
// same place on both panels and on every frame.
export function seededRandom(seed) {
  let a = seed * 2654435761 >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function softShadow(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.fillStyle = 'rgba(60, 40, 10, 0.18)';
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.restore();
}

function gradientBand(ctx, y, h, top, bottom) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, PANEL_W, h);
}

// ------------------------------------------------------------- the painters
// One function per prop kind. Each takes the prop and paints it at its own
// coordinates; the panel is 560 by 420.

const painters = {
  sky(ctx, p) {
    gradientBand(ctx, 0, PANEL_H, p.top, p.bottom);
  },

  night(ctx, p) {
    gradientBand(ctx, 0, PANEL_H, p.top, p.bottom);
  },

  room(ctx, p) {
    ctx.fillStyle = p.wall;
    ctx.fillRect(0, 0, PANEL_W, p.floorY);
    ctx.fillStyle = p.floor;
    ctx.fillRect(0, p.floorY, PANEL_W, PANEL_H - p.floorY);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let x = 24; x < PANEL_W; x += 56) ctx.fillRect(x, p.floorY + 8, 2, PANEL_H - p.floorY - 16);
    ctx.fillStyle = '#4c3423';
    ctx.fillRect(0, p.floorY - 4, PANEL_W, 6);
  },

  sun(ctx, p) {
    ctx.save();
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * (p.r + 6), p.y + Math.sin(a) * (p.r + 6));
      ctx.lineTo(p.x + Math.cos(a) * (p.r + 16), p.y + Math.sin(a) * (p.r + 16));
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(p.x - 8, p.y - 8, 6, p.x, p.y, p.r);
    g.addColorStop(0, '#ffe66d');
    g.addColorStop(1, '#ffc93f');
    ctx.fillStyle = g;
    circle(ctx, p.x, p.y, p.r);
    ctx.fill();
    ctx.fillStyle = '#7a4b00';
    if (p.face === 'shades') {
      ctx.fillRect(p.x - 20, p.y - 10, 17, 11);
      ctx.fillRect(p.x + 3, p.y - 10, 17, 11);
      ctx.fillRect(p.x - 4, p.y - 7, 8, 3);
      ctx.strokeStyle = '#7a4b00';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, 11, 0.25, Math.PI - 0.25);
      ctx.stroke();
    } else {
      circle(ctx, p.x - 10, p.y - 6, 3);
      ctx.fill();
      circle(ctx, p.x + 10, p.y - 6, 3);
      ctx.fill();
      ctx.strokeStyle = '#7a4b00';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 2, 11, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
    ctx.restore();
  },

  moon(ctx, p) {
    ctx.save();
    const g = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, p.r * 2.1);
    g.addColorStop(0, 'rgba(240, 244, 200, 0.35)');
    g.addColorStop(1, 'rgba(240, 244, 200, 0)');
    ctx.fillStyle = g;
    circle(ctx, p.x, p.y, p.r * 2.1);
    ctx.fill();
    ctx.fillStyle = '#f2eed8';
    circle(ctx, p.x, p.y, p.r);
    ctx.fill();
    if (p.phase === 'crescent') {
      ctx.fillStyle = '#16244a';
      circle(ctx, p.x + p.r * 0.55, p.y - p.r * 0.2, p.r * 0.86);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(180, 175, 150, 0.5)';
      circle(ctx, p.x - 9, p.y - 6, 5);
      ctx.fill();
      circle(ctx, p.x + 8, p.y + 9, 4);
      ctx.fill();
      circle(ctx, p.x + 11, p.y - 12, 3);
      ctx.fill();
    }
    ctx.restore();
  },

  stars(ctx, p) {
    const rand = seededRandom(p.seed);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < p.count; i++) {
      const x = rand() * PANEL_W;
      const y = rand() * 200;
      const r = 0.8 + rand() * 1.5;
      ctx.globalAlpha = 0.35 + rand() * 0.65;
      circle(ctx, x, y, r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  cloud(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = p.tint;
    ellipse(ctx, 0, 0, 34, 15);
    ctx.fill();
    ellipse(ctx, -22, 5, 22, 11);
    ctx.fill();
    ellipse(ctx, 24, 5, 24, 12);
    ctx.fill();
    ellipse(ctx, 2, -10, 22, 13);
    ctx.fill();
    ctx.restore();
  },

  sea(ctx, p) {
    gradientBand(ctx, p.y, p.h, '#3ec1dd', p.color);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let row = 0; row < 3; row++) {
      const y = p.y + 14 + row * 20;
      for (let x = 14 + row * 22; x < PANEL_W - 20; x += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 9, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    }
  },

  sand(ctx, p) {
    gradientBand(ctx, p.y, p.h, p.color, '#eed083');
    ctx.fillStyle = 'rgba(190, 150, 70, 0.35)';
    const rand = seededRandom(11);
    for (let i = 0; i < 26; i++) {
      circle(ctx, rand() * PANEL_W, p.y + 12 + rand() * (p.h - 20), 1.6);
      ctx.fill();
    }
  },

  hill(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, p.y + 26);
    ctx.quadraticCurveTo(150, p.y - 34, 320, p.y + 8);
    ctx.quadraticCurveTo(450, p.y + 34, PANEL_W, p.y + 2);
    ctx.lineTo(PANEL_W, PANEL_H);
    ctx.lineTo(0, PANEL_H);
    ctx.closePath();
    ctx.fill();
  },

  ground(ctx, p) {
    gradientBand(ctx, p.y, PANEL_H - p.y, p.color, '#0f2716');
  },

  fence(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.fillRect(0, p.y + 12, PANEL_W, 5);
    for (let x = 14; x < PANEL_W; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, p.y + 30);
      ctx.lineTo(x + 5, p.y);
      ctx.lineTo(x + 10, p.y + 30);
      ctx.closePath();
      ctx.fill();
    }
  },

  gull(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = '#38618c';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-8, 0, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 0, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  },

  boat(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = '#7a4f2c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -62);
    ctx.stroke();
    ctx.fillStyle = p.sail;
    ctx.beginPath();
    ctx.moveTo(4, -60);
    ctx.lineTo(4, -12);
    ctx.lineTo(38, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 70, 40, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f4f1e6';
    ctx.beginPath();
    ctx.moveTo(-4, -56);
    ctx.lineTo(-4, -14);
    ctx.lineTo(-30, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (p.flag) {
      ctx.fillStyle = '#e2483d';
      ctx.beginPath();
      ctx.moveTo(0, -62);
      ctx.lineTo(15, -57);
      ctx.lineTo(0, -52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#9c6642';
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(42, 0);
    ctx.lineTo(30, 16);
    ctx.lineTo(-30, 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a4f2c';
    ctx.fillRect(-42, 0, 84, 5);
    ctx.restore();
  },

  palm(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.quadraticCurveTo(p.lean * 0.4, 0, p.lean, -58);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(p.lean * 0.2 - 5, 34 - i * 22);
      ctx.lineTo(p.lean * 0.2 + 6, 30 - i * 22);
      ctx.stroke();
    }
    const topX = p.lean;
    const topY = -62;
    ctx.strokeStyle = '#2e9e4f';
    ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      const a = -0.25 - i * 0.5;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(a) * 30, topY + Math.sin(a) * 26 - 8,
        topX + Math.cos(a) * 52, topY + Math.sin(a) * 40 + 14,
      );
      ctx.stroke();
    }
    ctx.fillStyle = '#6f4a1f';
    for (let i = 0; i < p.coconuts; i++) {
      circle(ctx, topX - 8 + i * 9, topY + 8, 6);
      ctx.fill();
    }
    ctx.restore();
  },

  stall(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(4, 26, 7, 84);
    ctx.fillRect(p.w - 11, 26, 7, 84);
    // striped awning
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-8, 30);
    ctx.lineTo(p.w + 8, 30);
    ctx.lineTo(p.w - 4, 2);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.clip();
    const stripeW = 19;
    for (let x = -8, i = 0; x < p.w + 8; x += stripeW, i++) {
      ctx.fillStyle = i % 2 === 0 ? p.awning : '#fdf6e3';
      ctx.fillRect(x, 0, stripeW, 32);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(90, 50, 20, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 30);
    ctx.lineTo(p.w + 8, 30);
    ctx.lineTo(p.w - 4, 2);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.stroke();
    // counter and goods
    ctx.fillStyle = '#a9713f';
    ctx.fillRect(0, 78, p.w, 12);
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(0, 90, p.w, 22);
    ctx.fillStyle = '#ff9f43';
    for (let i = 0; i < 5; i++) { circle(ctx, 22 + i * 16, 70, 8); ctx.fill(); }
    ctx.fillStyle = '#e2483d';
    for (let i = 0; i < 4; i++) { circle(ctx, 92 + i * 15, 70, 7); ctx.fill(); }
    ctx.restore();
  },

  crate(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#b07f45';
    ctx.fillRect(0, 0, 52, 36);
    ctx.strokeStyle = '#7a4f2c';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 49, 33);
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(52, 12);
    ctx.stroke();
    const fruitColor = { orange: '#ff8c1a', apple: '#d7263d', melon: '#7fb069' }[p.fruit];
    ctx.fillStyle = fruitColor;
    for (let i = 0; i < 4; i++) { circle(ctx, 10 + i * 11, 2, 7); ctx.fill(); }
    if (p.fruit === 'melon') {
      ctx.strokeStyle = '#4c7a3f';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(10 + i * 11, 2, 7, -0.6, 0.9);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  umbrella(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.tilt * Math.PI) / 180);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = '#e8e3d9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 66);
    ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-52, 8);
    ctx.quadraticCurveTo(0, -44, 52, 8);
    ctx.quadraticCurveTo(26, -2, 0, 8);
    ctx.quadraticCurveTo(-26, -2, -52, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-26, -8);
    ctx.quadraticCurveTo(0, -40, 26, -8);
    ctx.quadraticCurveTo(12, -12, 0, -6);
    ctx.quadraticCurveTo(-12, -12, -26, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  ball(ctx, p) {
    ctx.save();
    softShadow(ctx, p.x, p.y + p.r + 3, p.r, 4);
    ctx.fillStyle = p.a;
    circle(ctx, p.x, p.y, p.r);
    ctx.fill();
    ctx.save();
    circle(ctx, p.x, p.y, p.r);
    ctx.clip();
    ctx.fillStyle = p.b;
    ctx.beginPath();
    ctx.moveTo(p.x - p.r, p.y - p.r);
    ctx.lineTo(p.x - 2, p.y);
    ctx.lineTo(p.x - p.r, p.y + p.r);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + p.r, p.y - p.r);
    ctx.lineTo(p.x + 2, p.y);
    ctx.lineTo(p.x + p.r, p.y + p.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    circle(ctx, p.x - 5, p.y - 6, 4);
    ctx.fill();
    ctx.restore();
  },

  bucket(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    softShadow(ctx, 8, 26, 16, 4);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(29, 0);
    ctx.lineTo(24, 26);
    ctx.lineTo(-8, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-13, 0, 42, 5);
    ctx.strokeStyle = '#5f4433';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(8, 0, 15, Math.PI, Math.PI * 2);
    ctx.stroke();
    // a little sandcastle beside it
    ctx.fillStyle = '#eecf7f';
    ctx.fillRect(38, 12, 22, 14);
    ctx.fillRect(44, 4, 10, 9);
    ctx.restore();
  },

  starfish(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? p.r : p.r * 0.48;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    circle(ctx, 0, 0, 2.2);
    ctx.fill();
    circle(ctx, -4, 3, 1.4);
    ctx.fill();
    circle(ctx, 4, 3, 1.4);
    ctx.fill();
    ctx.restore();
  },

  crab(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(side * 10, 4 + i * 2);
        ctx.lineTo(side * (18 + i * 2), 10 + i * 4);
        ctx.stroke();
      }
      ctx.fillStyle = p.color;
      circle(ctx, side * 20, -8, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      circle(ctx, side * 20, -8, 3);
      ctx.fill();
    }
    ctx.fillStyle = p.color;
    ellipse(ctx, 0, 2, 15, 10);
    ctx.fill();
    ctx.fillStyle = '#402020';
    circle(ctx, -5, -6, 2.2);
    ctx.fill();
    circle(ctx, 5, -6, 2.2);
    ctx.fill();
    ctx.restore();
  },

  window(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#5f4433';
    ctx.fillRect(-6, -6, p.w + 12, p.h + 12);
    const g = ctx.createLinearGradient(0, 0, 0, p.h);
    g.addColorStop(0, '#aee3f5');
    g.addColorStop(1, '#e8f7d9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.moveTo(0, p.h);
    ctx.quadraticCurveTo(p.w * 0.3, p.h * 0.55, p.w * 0.62, p.h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.w * 0.45, p.h);
    ctx.quadraticCurveTo(p.w * 0.75, p.h * 0.62, p.w, p.h * 0.8);
    ctx.lineTo(p.w, p.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    circle(ctx, p.w - 24, 24, 11);
    ctx.fill();
    ctx.fillStyle = '#5f4433';
    ctx.fillRect(p.w / 2 - 3, 0, 6, p.h);
    ctx.fillRect(0, p.h / 2 - 3, p.w, 6);
    ctx.restore();
  },

  clock(ctx, p) {
    ctx.save();
    softShadow(ctx, p.x, p.y + p.r + 8, p.r * 0.8, 5);
    ctx.fillStyle = '#5f4433';
    circle(ctx, p.x, p.y, p.r + 6);
    ctx.fill();
    ctx.fillStyle = '#fdf6e3';
    circle(ctx, p.x, p.y, p.r);
    ctx.fill();
    ctx.fillStyle = '#5f4433';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      circle(ctx, p.x + Math.cos(a) * (p.r - 7), p.y + Math.sin(a) * (p.r - 7), i % 3 === 0 ? 2.4 : 1.3);
      ctx.fill();
    }
    const hourA = (((p.hour % 12) + p.minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    const minA = (p.minute / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#33302a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(hourA) * p.r * 0.52, p.y + Math.sin(hourA) * p.r * 0.52);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(minA) * p.r * 0.78, p.y + Math.sin(minA) * p.r * 0.78);
    ctx.stroke();
    ctx.fillStyle = '#c44536';
    circle(ctx, p.x, p.y, 3.4);
    ctx.fill();
    ctx.restore();
  },

  shelf(ctx, p) {
    ctx.fillStyle = '#6e4f30';
    ctx.fillRect(p.x, p.y, p.w, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x + 8, p.y + 8, 6, 14);
    ctx.fillRect(p.x + p.w - 14, p.y + 8, 6, 14);
  },

  jar(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    roundedRect(ctx, -11, -p.h, 22, p.h, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-7, -p.h + 4, 5, p.h - 10);
    ctx.fillStyle = '#5f4433';
    ctx.fillRect(-9, -p.h - 6, 18, 7);
    ctx.restore();
  },

  book(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.lean * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-p.w / 2, -p.h + 5, p.w, 3);
    ctx.restore();
  },

  lamp(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.glow !== 'off') {
      const g = ctx.createRadialGradient(0, p.drop + 12, 4, 0, p.drop + 12, 62);
      g.addColorStop(0, 'rgba(255, 214, 130, 0.5)');
      g.addColorStop(1, 'rgba(255, 214, 130, 0)');
      ctx.fillStyle = g;
      circle(ctx, 0, p.drop + 12, 62);
      ctx.fill();
    }
    ctx.strokeStyle = '#33302a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, p.drop);
    ctx.stroke();
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.moveTo(-20, p.drop + 14);
    ctx.lineTo(0, p.drop - 6);
    ctx.lineTo(20, p.drop + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.glow === 'off' ? '#6b7a80' : p.glow;
    circle(ctx, 0, p.drop + 13, 7);
    ctx.fill();
    ctx.restore();
  },

  gear(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    for (let i = 0; i < p.teeth; i++) {
      const a = (i / p.teeth) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.fillRect(p.r - 3, -4.5, 9, 9);
      ctx.restore();
    }
    circle(ctx, 0, 0, p.r);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    circle(ctx, 0, 0, p.r * 0.42);
    ctx.fill();
    ctx.fillStyle = '#8a6248';
    circle(ctx, 0, 0, p.r * 0.2);
    ctx.fill();
    ctx.restore();
  },

  bench(ctx, p) {
    ctx.fillStyle = '#7a4f2c';
    ctx.fillRect(p.x, p.y, p.w, 14);
    ctx.fillStyle = '#654023';
    ctx.fillRect(p.x + 10, p.y + 14, 12, 56);
    ctx.fillRect(p.x + p.w - 22, p.y + 14, 12, 56);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(p.x, p.y, p.w, 4);
  },

  mug(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.steam) {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (const off of [-6, 5]) {
        ctx.beginPath();
        ctx.moveTo(off, -34);
        ctx.quadraticCurveTo(off - 5, -42, off, -50);
        ctx.quadraticCurveTo(off + 5, -56, off, -64);
        ctx.stroke();
      }
    }
    ctx.fillStyle = p.color;
    roundedRect(ctx, -13, -26, 26, 26, 4);
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(17, -14, 7, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = '#5f4433';
    ellipse(ctx, 0, -26, 13, 3.4);
    ctx.fill();
    ctx.restore();
  },

  toolbox(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    roundedRect(ctx, -30, -24, 60, 24, 4);
    ctx.fill();
    ctx.strokeStyle = '#7c2d22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -24, 11, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e8c15a';
    ctx.fillRect(-5, -15, 10, 7);
    ctx.restore();
  },

  plant(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.strokeStyle = '#2e7d46';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    for (const a of [-0.6, -0.2, 0.25, 0.65]) {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(Math.sin(a) * 12, -26, Math.sin(a) * 20, -36 - Math.cos(a) * 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#3fa55c';
    for (const [lx, ly] of [[-16, -34], [0, -42], [16, -34]]) {
      ellipse(ctx, lx, ly, 7, 4);
      ctx.fill();
    }
    ctx.fillStyle = p.pot;
    ctx.beginPath();
    ctx.moveTo(-13, -16);
    ctx.lineTo(13, -16);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  rug(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    roundedRect(ctx, 0, 0, p.w, p.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.5)';
    ctx.lineWidth = 3;
    roundedRect(ctx, 9, 9, p.w - 18, p.h - 18, 7);
    ctx.stroke();
    ctx.restore();
  },

  cat(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    softShadow(ctx, 0, 14, 46, 7);
    // tail curled around the body
    ctx.strokeStyle = '#5b4a42';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(6, 4, 34, 0.5, 2.2);
    ctx.stroke();
    ctx.fillStyle = '#6e5a50';
    ellipse(ctx, 0, 2, 42, 17);
    ctx.fill();
    circle(ctx, -34, -6, 15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-46, -16);
    ctx.lineTo(-42, -28);
    ctx.lineTo(-34, -19);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24, -19);
    ctx.lineTo(-18, -29);
    ctx.lineTo(-12, -17);
    ctx.closePath();
    ctx.fill();
    // collar
    ctx.strokeStyle = p.collar;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-27, 0, 12, 0.6, 2.4);
    ctx.stroke();
    // face
    ctx.strokeStyle = '#2e2320';
    ctx.lineWidth = 2;
    if (p.eyes === 'closed') {
      ctx.beginPath();
      ctx.arc(-39, -7, 3.4, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-27, -7, 3.4, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffd23f';
      circle(ctx, -39, -7, 3.4);
      ctx.fill();
      circle(ctx, -27, -7, 3.4);
      ctx.fill();
      ctx.fillStyle = '#2e2320';
      circle(ctx, -39, -7, 1.5);
      ctx.fill();
      circle(ctx, -27, -7, 1.5);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-33, -1);
    ctx.lineTo(-30, 1.6);
    ctx.stroke();
    ctx.restore();
  },

  stool(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillRect(-22, 0, 44, 9);
    ctx.fillRect(-18, 9, 7, 34);
    ctx.fillRect(11, 9, 7, 34);
    ctx.fillRect(-18, 28, 36, 5);
    ctx.restore();
  },

  tree(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = '#4a3520';
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.quadraticCurveTo(-6, -60, -14, -104);
    ctx.lineTo(6, -104);
    ctx.quadraticCurveTo(2, -56, 12, 0);
    ctx.closePath();
    ctx.fill();
    // long branch reaching right, the owl and swing hang from it
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -96);
    ctx.quadraticCurveTo(40, -108, 84, -100);
    ctx.stroke();
    const canopy = (cx, cy, r, c) => { ctx.fillStyle = c; circle(ctx, cx, cy, r); ctx.fill(); };
    canopy(-16, -128, 42, '#1e4630');
    canopy(26, -118, 36, '#256b3f');
    canopy(-44, -106, 28, '#256b3f');
    canopy(52, -96, 24, '#1e4630');
    canopy(4, -146, 30, '#2c7a47');
    if (p.swing) {
      const sx = 34;
      const topY = -102;
      ctx.strokeStyle = '#cbb98a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(sx - 11, topY);
      ctx.lineTo(sx - 11, topY + 52);
      ctx.moveTo(sx + 11, topY);
      ctx.lineTo(sx + 11, topY + 52);
      ctx.stroke();
      ctx.fillStyle = '#8a5a33';
      ctx.fillRect(sx - 17, topY + 52, 34, 6);
    }
    ctx.restore();
  },

  owl(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = '#8a6a4a';
    ellipse(ctx, 0, 0, 13, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(-8, -20);
    ctx.lineTo(-3, -13);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(11, -12);
    ctx.lineTo(8, -20);
    ctx.lineTo(3, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4ead2';
    circle(ctx, -5, -5, 5.4);
    ctx.fill();
    circle(ctx, 5, -5, 5.4);
    ctx.fill();
    ctx.fillStyle = '#2e2320';
    circle(ctx, -5, -5, 2.4);
    ctx.fill();
    circle(ctx, 5, -5, 2.4);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.moveTo(-2.6, -1);
    ctx.lineTo(2.6, -1);
    ctx.lineTo(0, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6e5236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(-6, 19);
    ctx.moveTo(6, 16);
    ctx.lineTo(6, 19);
    ctx.stroke();
    ctx.restore();
  },

  pond(ctx, p) {
    ctx.save();
    const g = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.rx);
    g.addColorStop(0, '#3d6ea5');
    g.addColorStop(1, p.color);
    ctx.fillStyle = g;
    ellipse(ctx, p.x, p.y, p.rx, p.ry);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(p.x - 30, p.y - 6, 52, 10, 0, Math.PI * 1.15, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(p.x + 44, p.y + 10, 40, 8, 0, Math.PI * 0.2, Math.PI * 0.65);
    ctx.stroke();
    ctx.restore();
  },

  lily(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#2e7d46';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, p.r, 0.5, Math.PI * 2 - 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(-4, -3, p.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (p.flower) {
      ctx.fillStyle = '#ffb7d5';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(ctx, Math.cos(a) * 4.4, Math.sin(a) * 4.4 - 2, 4, 2.6);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd23f';
      circle(ctx, 0, -2, 2.6);
      ctx.fill();
    }
    ctx.restore();
  },

  frog(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = '#4caf50';
    ellipse(ctx, 0, 0, 12, 8.4);
    ctx.fill();
    circle(ctx, -6, -8, 4.6);
    ctx.fill();
    circle(ctx, 6, -8, 4.6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, -6, -8.6, 2.8);
    ctx.fill();
    circle(ctx, 6, -8.6, 2.8);
    ctx.fill();
    ctx.fillStyle = '#1d2b1d';
    circle(ctx, -6, -8.6, 1.4);
    ctx.fill();
    circle(ctx, 6, -8.6, 1.4);
    ctx.fill();
    ctx.strokeStyle = '#2e6b30';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -1, 6, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.restore();
  },

  lantern(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(-3, -34, 6, 40);
    ctx.fillRect(-14, 4, 28, 5);
    const g = ctx.createRadialGradient(0, -44, 2, 0, -44, 30);
    g.addColorStop(0, 'rgba(255, 220, 150, 0.55)');
    g.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = g;
    circle(ctx, 0, -44, 30);
    ctx.fill();
    ctx.fillStyle = p.color;
    roundedRect(ctx, -9, -56, 18, 24, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-5, -52, 4, 16);
    ctx.fillStyle = '#2c2118';
    ctx.fillRect(-6, -60, 12, 5);
    ctx.restore();
  },

  flowers(ctx, p) {
    const rand = seededRandom(p.x * 3 + p.y);
    for (let row = 0; row < p.rows; row++) {
      for (let col = 0; col < p.cols; col++) {
        const fx = p.x + col * 19 + (row % 2) * 8;
        const fy = p.y + row * 22;
        let color = (col + row) % 3 === 0 ? p.alt : p.main;
        if (p.special && p.special.col === col && p.special.row === row) color = p.special.color;
        ctx.strokeStyle = '#2e7d46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy + 12);
        ctx.lineTo(fx, fy + 3);
        ctx.stroke();
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + rand() * 0.4;
          circle(ctx, fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3.4);
          ctx.fill();
        }
        ctx.fillStyle = '#fff3b0';
        circle(ctx, fx, fy, 2.2);
        ctx.fill();
      }
    }
  },

  mushroom(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = '#e8e3d9';
    ctx.fillRect(-4, -8, 8, 12);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, -8, 14, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    circle(ctx, -6, -14, 2.6);
    ctx.fill();
    circle(ctx, 4, -17, 2);
    ctx.fill();
    circle(ctx, 8, -11, 1.6);
    ctx.fill();
    ctx.restore();
  },

  stones(ctx, p) {
    ctx.fillStyle = '#5a6b5e';
    const spots = [[-24, 6, 15], [8, 16, 18], [-8, 30, 13], [26, 34, 15]];
    for (const [dx, dy, r] of spots) {
      ellipse(ctx, p.x + dx, p.y + dy, r, r * 0.42);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ellipse(ctx, p.x + 6, p.y + 12, 9, 3.4);
    ctx.fill();
  },

  can(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(10, -18);
    ctx.lineTo(13, 4);
    ctx.lineTo(-9, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -14);
    ctx.quadraticCurveTo(26, -20, 24, -30);
    ctx.lineTo(18, -28);
    ctx.quadraticCurveTo(18, -22, 9, -19);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.quadraticCurveTo(-22, -8, -19, 2);
    ctx.stroke();
    ctx.restore();
  },

  fireflies(ctx, p) {
    const rand = seededRandom(p.seed);
    for (let i = 0; i < p.count; i++) {
      const x = 20 + rand() * (PANEL_W - 40);
      const y = 120 + rand() * 240;
      const g = ctx.createRadialGradient(x, y, 0.5, x, y, 8);
      g.addColorStop(0, 'rgba(255, 224, 102, 0.9)');
      g.addColorStop(1, 'rgba(255, 224, 102, 0)');
      ctx.fillStyle = g;
      circle(ctx, x, y, 8);
      ctx.fill();
      ctx.fillStyle = p.color;
      circle(ctx, x, y, 1.8);
      ctx.fill();
    }
  },
};

// Paint a whole panel: every prop in order, clipped to the panel frame.
export function paintPanel(ctx, props) {
  ctx.save();
  ctx.clearRect(0, 0, PANEL_W, PANEL_H);
  ctx.beginPath();
  ctx.rect(0, 0, PANEL_W, PANEL_H);
  ctx.clip();
  for (const prop of props) {
    const paint = painters[prop.kind];
    if (paint) paint(ctx, prop);
  }
  ctx.restore();
}

// The ring a found difference earns: a bold gold ring with a soft white
// halo and a small check, gently breathing via the phase value (0..1).
export function paintFoundRing(ctx, ring, phase) {
  const grow = 1 + Math.sin(phase * Math.PI * 2) * 0.045;
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  circle(ctx, ring.x, ring.y, ring.r * grow + 2);
  ctx.stroke();
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = '#ffb703';
  circle(ctx, ring.x, ring.y, ring.r * grow);
  ctx.stroke();
  ctx.fillStyle = '#ffb703';
  circle(ctx, ring.x + ring.r * 0.72, ring.y - ring.r * 0.72, 9);
  ctx.fill();
  ctx.strokeStyle = '#5c3d00';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ring.x + ring.r * 0.72 - 4.4, ring.y - ring.r * 0.72);
  ctx.lineTo(ring.x + ring.r * 0.72 - 1.2, ring.y - ring.r * 0.72 + 3.4);
  ctx.lineTo(ring.x + ring.r * 0.72 + 4.6, ring.y - ring.r * 0.72 - 3.6);
  ctx.stroke();
  ctx.restore();
}

// The hint pulse: expanding cyan rings around a difference still unfound.
export function paintHintPulse(ctx, ring, phase) {
  ctx.save();
  for (let i = 0; i < 2; i++) {
    const t = (phase + i * 0.5) % 1;
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22d3ee';
    circle(ctx, ring.x, ring.y, ring.r * (0.55 + t * 0.85));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = '#22d3ee';
  circle(ctx, ring.x, ring.y, ring.r * 0.55);
  ctx.stroke();
  ctx.restore();
}
