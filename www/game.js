(function () {
'use strict';
const S = window.Sudoku, SKY = window.SKY;
const $ = (s) => document.querySelector(s);
const canvas = $('#c'), ctx = canvas.getContext('2d');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- palette ----------------
const P = {
  bg: '#070d19', ink: '#eef2ff', gold: '#d8b25c', cyan: '#5fe3ff', plasma: '#9ff1ff',
  tilt: '#ff4f8b', dim: 'rgba(238,242,255,0.28)', grid: 'rgba(238,242,255,0.16)', gridBold: 'rgba(238,242,255,0.55)',
  given: '#f6f0dc', entered: '#8fe8ff', note: 'rgba(238,242,255,0.55)', sel: 'rgba(95,227,255,0.16)', peer: 'rgba(95,227,255,0.06)'
};
const SERIF = '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const SANS = '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ---------------- levels ----------------
const FIRST = ['Ori','UMa','Cas','Cyg','Sco','Leo','Tau','Gem','Lyr','CMa','Peg','And'];
const ORDER = FIRST.concat(Object.keys(SKY.C).filter(k => !FIRST.includes(k)).sort((a, b) => SKY.C[a].name.localeCompare(SKY.C[b].name)));
const NLEVELS = ORDER.length; // 88

// ================= EASTER EGGS =================
// Real black holes that actually live in these constellations.
const HOLES = {
  Cyg: ['Cygnus X-1', 'the first object astronomers widely accepted as a black hole'],
  Vir: ['M87*', 'the first black hole ever photographed, in 2019'],
  Sgr: ['Sagittarius A*', 'the supermassive black hole at the centre of our own galaxy']
};
// Tappable stars hiding in the constellation strip. [segment, point] into the line data.
const SECRETS = {
  Ori: { seg: 0, pt: 5, id: 'betelgeuse', taps: 3, label: 'Betelgeuse' },
  UMa: { seg: 0, pt: 6, id: 'mizar', taps: 1, label: 'Mizar' },
  Per: { seg: 0, pt: 13, id: 'algol', taps: 1, label: 'Algol' },
  Tau: { seg: 0, pt: 1, id: 'aldebaran', taps: 1, label: 'Aldebaran' }
};
// Annual meteor showers, [month, day, name, radiant constellation]
const SHOWERS = [[1,3,'Quadrantids','Boo'],[4,22,'Lyrids','Lyr'],[8,12,'Perseids','Per'],[10,21,'Orionids','Ori'],[11,17,'Leonids','Leo'],[12,14,'Geminids','Gem']];
function showerToday() {
  const d = new Date();
  for (const [m, dd, name, ab] of SHOWERS) if (d.getMonth() + 1 === m && Math.abs(d.getDate() - dd) <= 1) return { name, ab };
  return null;
}
// Argo Navis: the ancient ship, broken up by Lacaille into Carina, Puppis and Vela.
// Solve all three and the ship sails again as a secret 89th level.
const ARGO = { name: 'Argo Navis', meaning: 'the Ship of the Argonauts',
  facts: ['Argo Navis was the largest constellation ever recorded, the ship that carried Jason and the Argonauts. In the 1750s Nicolas-Louis de Lacaille broke it into three: Carina the keel, Puppis the stern, and Vela the sails. It is the only classical constellation the astronomers retired.'] };
function levelName(l) { return l === 89 ? ARGO.name : (SKY.C[ORDER[l - 1]] ? SKY.C[ORDER[l - 1]].name : 'Unknown'); }
function argoUnlocked() { return ['Car','Pup','Vel'].every(ab => progress.done[ORDER.indexOf(ab) + 1]); }
// build combined line data once
let ARGO_LINES = null;
function argoLines() { if (!ARGO_LINES) ARGO_LINES = [].concat(SKY.C.Car.lines, SKY.C.Pup.lines, SKY.C.Vel.lines); return ARGO_LINES; }
function tierOf(l) { return l <= 30 ? 'Easy' : l <= 60 ? 'Medium' : 'Hard'; }
function cluesOf(l) { return l <= 30 ? 38 - Math.floor((l - 1) / 10) : l <= 60 ? 33 - Math.floor((l - 31) / 10) : 28 - Math.floor((l - 61) / 10); }
function seedOf(l) { return 20260915 + l * 7919; }

// ---------------- persistence ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let progress = store.get('sus.progress', { unlocked: 1, best: {}, done: {}, sound: true });

// ---------------- audio (synthesized) ----------------
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f0, f1, dur, type, gain, when) {
  const ac = audio(); if (!ac || !progress.sound) return;
  const t = ac.currentTime + (when || 0);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  launch: () => tone(320, 880, 0.18, 'triangle', 0.12),
  land: () => { tone(880, 440, 0.09, 'sine', 0.14); tone(1760, 1200, 0.05, 'sine', 0.05); },
  tilt: () => { tone(160, 60, 0.35, 'sawtooth', 0.12); tone(120, 50, 0.4, 'square', 0.05, 0.05); },
  unit: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.22, 'triangle', 0.1, i * 0.06)),
  note: () => tone(600, 700, 0.05, 'sine', 0.06),
  erase: () => tone(400, 200, 0.08, 'sine', 0.06),
  hint: () => [660, 990].forEach((f, i) => tone(f, f, 0.15, 'sine', 0.08, i * 0.08)),
  hole: () => { const ac = audio(); if (!ac || !progress.sound) return; tone(60, 30, 4.5, 'sawtooth', 0.18); tone(200, 2400, 3.5, 'sine', 0.06, 0.6); tone(45, 25, 5, 'sine', 0.2); },
  win: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, 0.5, 'triangle', 0.09, i * 0.09)),
  tap: () => tone(1200, 900, 0.03, 'sine', 0.04)
};

// ---------------- sky geometry ----------------
function projectConst(abbr, size, pad) {
  const RAW = abbr === 'ARGO' ? argoLines() : SKY.C[abbr].lines;
  const segs = RAW.map(seg => {
    const lons = seg.map(p => p[0]);
    const wrap = Math.max(...lons) - Math.min(...lons) > 180;
    return seg.map(p => [wrap && p[0] < 0 ? p[0] + 360 : p[0], p[1]]);
  });
  const all = segs.flat();
  let lon0 = all.reduce((a, p) => a + p[0], 0) / all.length; const lat0 = all.reduce((a, p) => a + p[1], 0) / all.length;
  if (lon0 > 180) lon0 -= 360;
  const la0 = lat0 * Math.PI / 180;
  const proj = (lon, lat) => { const lo = (lon - lon0) * Math.PI / 180, la = lat * Math.PI / 180; return [-(Math.cos(la) * Math.sin(lo)), Math.cos(la0) * Math.sin(la) - Math.sin(la0) * Math.cos(la) * Math.cos(lo)]; };
  const ps = segs.map(s => s.map(p => proj(p[0], p[1])));
  const flat = ps.flat(); const xs = flat.map(p => p[0]), ys = flat.map(p => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const span = Math.max(maxx - minx, maxy - miny, 1e-6), inner = size * (1 - 2 * pad), sc = inner / span;
  const cx0 = (minx + maxx) / 2, cy0 = (miny + maxy) / 2;
  const T = p => [size / 2 + (p[0] - cx0) * sc, size / 2 - (p[1] - cy0) * sc];
  const segsPx = ps.map(s => s.map(T));
  const edges = []; segsPx.forEach(s => { for (let i = 1; i < s.length; i++) edges.push([s[i - 1], s[i]]); });
  const verts = [...new Set(segsPx.flat().map(p => p.join(',')))].map(s => s.split(',').map(Number));
  // background stars in field
  const bg = [];
  for (const st of SKY.S) {
    if (Math.abs(st[1] - lat0) > 60) continue;
    const dl = ((st[0] - lon0 + 540) % 360) - 180;
    if (Math.abs(dl) > 60 / Math.max(Math.cos(la0), 0.2)) continue;
    const [x, y] = T(proj(lon0 + dl, st[1]));
    if (x < -6 || x > size + 6 || y < -6 || y > size + 6) continue;
    bg.push([x, y, st[2]]);
  }
  return { edges, verts, bg, size, T, segsPx };
}

// ---------------- game state ----------------
let G = null;         // current game
let view = 'title';   // title | map | play | win
let layout = {};
let anims = [];       // transient animations
let particles = [];
let shake = 0;
let bgStars = [];
let lastT = performance.now();
let winState = null;
let toast = null;

function newGame(level) {
  const argo = level === 89;
  const abbr = argo ? 'ARGO' : ORDER[level - 1];
  const gen = S.generate(seedOf(level), argo ? 24 : cluesOf(level));
  const facts = argo ? ARGO.facts : SKY.C[abbr].facts;
  const fi = (progress.done[level] || 0) % facts.length;
  G = {
    level, abbr, tier: argo ? 'Legend' : tierOf(level), name: argo ? ARGO.name : SKY.C[abbr].name,
    meaning: argo ? ARGO.meaning : SKY.C[abbr].meaning, fact: facts[fi],
    puzzle: Array.from(gen.puzzle), solution: Array.from(gen.solution), grid: Array.from(gen.puzzle),
    notes: Array.from({ length: 81 }, () => 0), wrong: Array(81).fill(false),
    sel: -1, notesMode: false, score: 0, combo: 0, mistakes: 0, hints: 0,
    unitsDone: new Set(), started: Date.now(), elapsed: 0, lit: 0, popped: Array(81).fill(0), sky: null,
    secret: null, secretTaps: 0, nova: 0, split: 0, shower: showerToday()
  };
  store.set('sus.save', serialize());
}
function serialize() { const g = G; return { level: g.level, grid: g.grid, notes: g.notes, wrong: g.wrong, score: g.score, combo: g.combo, mistakes: g.mistakes, hints: g.hints, unitsDone: [...g.unitsDone], elapsed: g.elapsed + (Date.now() - g.started), fact: g.fact }; }
function resume(sv) {
  newGame(sv.level);
  G.grid = sv.grid; G.notes = sv.notes; G.wrong = sv.wrong; G.score = sv.score; G.combo = sv.combo; G.mistakes = sv.mistakes; G.hints = sv.hints;
  G.unitsDone = new Set(sv.unitsDone); G.elapsed = sv.elapsed; G.started = Date.now(); G.fact = sv.fact || G.fact;
  G.lit = G.unitsDone.size;
}
function save() { if (G && view === 'play') store.set('sus.save', serialize()); }

// ---------------- layout ----------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const safeT = parseFloat(cs.getPropertyValue('--sat')) || 0;
  const safeB = parseFloat(cs.getPropertyValue('--sab')) || 0;
  const pad = 12, header = 58 + safeT;
  const wide = W > H * 1.15;
  layout = { W, H, pad, header, safeT, safeB, wide };

  if (!wide) {
    // ---- portrait: sky, grid, keypad row, tools ----
    let strip = Math.max(88, Math.min(140, H * 0.16));
    const pad9 = Math.min(64, (W - 2 * pad) / 9), padRow = pad9 + 14, tools = 52;
    const gs = Math.min(W - 2 * pad, H - header - strip - padRow - tools - 3 * pad - safeB);
    const extra = Math.max(0, H - safeB - (header + strip + gs + padRow + tools + 3 * pad));
    strip += Math.min(90, extra * 0.55);
    const gap = pad + Math.min(18, extra * 0.15);
    const gx = (W - gs) / 2, gy = header + strip;
    const padY = gy + gs + gap, w9 = (W - 2 * pad) / 9;
    layout.gs = gs; layout.gx = gx; layout.gy = gy; layout.cell = gs / 9;
    layout.stripSize = Math.min(strip - 10, 220);
    layout.stripX = (W - layout.stripSize) / 2; layout.stripY = header + (strip - layout.stripSize) / 2;
    layout.padR = pad9 / 2 - 3;
    layout.padPos = []; for (let n = 1; n <= 9; n++) layout.padPos.push([pad + (n - 1) * w9 + w9 / 2, padY + pad9 / 2 + 4]);
    const ty = padY + padRow + 6 + 20, bw = (W - 2 * pad - 20) / 3;
    layout.tools = [0, 1, 2].map(k => ({ x: pad + k * (bw + 10), y: ty - 18, w: bw, h: 38 }));
    layout.scratch = { x: pad, y: gy + gs + 6, w: W - 2 * pad, h: 0 };
    layout.pauseY = H - safeB - 8;
  } else {
    // ---- landscape / tablet: grid left, sky + keypad right ----
    const gs = Math.min(H - header - 2 * pad - safeB, W * 0.52);
    const gx = pad + Math.max(0, (W * 0.52 - gs) / 2), gy = header + (H - header - safeB - gs) / 2;
    const rx = gx + gs + pad * 2, rw = W - pad - rx;
    layout.gs = gs; layout.gx = gx; layout.gy = gy; layout.cell = gs / 9;
    // give the keypad priority, then spend what is left on the sky
    const toolsH = 46;
    const availH = H - header - safeB - 2 * pad - toolsH;
    layout.stripSize = Math.max(70, Math.min(rw, availH * 0.38, 260));
    const keySide = Math.max(90, Math.min(rw, availH - layout.stripSize - 18));
    layout.stripX = rx + (rw - layout.stripSize) / 2; layout.stripY = header + 4;
    const kx = rx + (rw - keySide) / 2, cellS = keySide / 3;
    const py0 = layout.stripY + layout.stripSize + 18;
    layout.padR = cellS / 2 - 6;
    layout.padPos = [];
    for (let n = 1; n <= 9; n++) { const r = (n - 1) / 3 | 0, c = (n - 1) % 3; layout.padPos.push([kx + c * cellS + cellS / 2, py0 + r * cellS + cellS / 2]); }
    const ty = py0 + keySide + 10, bw = (rw - 20) / 3;
    layout.tools = [0, 1, 2].map(k => ({ x: rx + k * (bw + 10), y: Math.min(ty, H - safeB - 52), w: bw, h: 38 }));
    layout.pauseY = H - safeB - 8;
  }
  if (G) G.sky = projectConst(G.abbr, layout.stripSize, 0.1);
  bgStars = []; const r = S.rng(7);
  for (let i = 0; i < 160; i++) bgStars.push({ x: r() * W, y: r() * H, z: 0.3 + r() * 0.7, tw: r() * 6.28 });
}

// ---------------- helpers ----------------
function unitsOf(i) { const r = i / 9 | 0, c = i % 9; return ['r' + r, 'c' + c, 'b' + S.BOX[i]]; }
function unitCells(u) {
  const k = u[0], n = +u.slice(1), out = [];
  for (let i = 0; i < 81; i++) { if (k === 'r' && (i / 9 | 0) === n) out.push(i); else if (k === 'c' && i % 9 === n) out.push(i); else if (k === 'b' && S.BOX[i] === n) out.push(i); }
  return out;
}
function unitComplete(u) { return unitCells(u).every(i => G.grid[i] && G.grid[i] === G.solution[i]); }
function cellCenter(i) { const r = i / 9 | 0, c = i % 9; return [layout.gx + c * layout.cell + layout.cell / 2, layout.gy + r * layout.cell + layout.cell / 2]; }
function padCenter(n) { return layout.padPos[n - 1]; }
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function fmt(n) { return n.toLocaleString('en-US'); }
function addScore(n) { G.score = Math.max(0, G.score + n); }
function showToast(text, color) { toast = { text, color: color || P.cyan, t: 0 }; }

// ---------------- actions ----------------
function place(n) {
  if (G.sel < 0 || G.puzzle[G.sel]) return;
  const i = G.sel;
  if (G.notesMode) { G.notes[i] ^= (1 << n); if (G.grid[i]) G.grid[i] = 0; SFX.note(); save(); return; }
  if (G.grid[i] === n && !G.wrong[i]) return;
  SFX.launch();
  const [x0, y0] = padCenter(n), [x1, y1] = cellCenter(i);
  anims.push({ kind: 'orb', n, i, x0, y0, x1, y1, t: 0, dur: REDUCED ? 0.01 : 0.34 });
}
function land(a) {
  const i = a.i, n = a.n;
  G.notes[i] = 0;
  if (n === G.solution[i]) {
    G.grid[i] = n; G.wrong[i] = false; G.combo = Math.min(G.combo + 1, 8);
    const pts = 100 * Math.min(G.combo, 5); addScore(pts);
    G.popped[i] = 1; SFX.land();
    burst(a.x1, a.y1, P.cyan, 14);
    anims.push({ kind: 'pts', x: a.x1, y: a.y1 - 10, text: '+' + pts, t: 0, dur: 0.8, color: P.plasma });
    // clear this digit from peer notes
    for (let k = 0; k < 81; k++) if (unitsOf(k).some(u => unitsOf(i).includes(u))) G.notes[k] &= ~(1 << n);
    let newUnits = 0;
    for (const u of unitsOf(i)) if (!G.unitsDone.has(u) && unitComplete(u)) { G.unitsDone.add(u); newUnits++; cascade(u, newUnits); }
    if (newUnits) { addScore(500 * newUnits); SFX.unit(); G.lit = G.unitsDone.size; showToast(newUnits > 1 ? 'Double bumper' : ['Row', 'Column', 'Box'][ 'rcb'.indexOf(G.unitsDone.size ? [...G.unitsDone].pop()[0] : 'r')] + ' complete', P.gold); }
    if (G.grid.every((v, k) => v === G.solution[k])) { G.elapsed += Date.now() - G.started; startWin(); }
  } else {
    G.grid[i] = n; G.wrong[i] = true; G.combo = 0; G.mistakes++; addScore(-200);
    SFX.tilt(); shake = REDUCED ? 0 : 10; burst(a.x1, a.y1, P.tilt, 10);
    anims.push({ kind: 'pts', x: a.x1, y: a.y1 - 10, text: '-200', t: 0, dur: 0.8, color: P.tilt });
    showToast('Tilt', P.tilt);
  }
  save();
}
function cascade(u, k) {
  unitCells(u).forEach((c, j) => anims.push({ kind: 'flash', i: c, t: -j * 0.035 - (k - 1) * 0.2, dur: 0.45 }));
}
function erase() {
  const i = G.sel; if (i < 0 || G.puzzle[i]) return;
  if (!G.grid[i] && !G.notes[i]) return;
  G.grid[i] = 0; G.wrong[i] = false; G.notes[i] = 0; SFX.erase(); save();
}
function hint() {
  const empties = []; for (let i = 0; i < 81; i++) if (!G.grid[i] || G.wrong[i]) empties.push(i);
  if (!empties.length) return;
  const i = G.sel >= 0 && (!G.grid[G.sel] || G.wrong[G.sel]) && !G.puzzle[G.sel] ? G.sel : empties[Math.floor(Math.random() * empties.length)];
  G.sel = i; G.hints++; addScore(-300); G.combo = 0; SFX.hint();
  const [x1, y1] = cellCenter(i);
  anims.push({ kind: 'orb', n: G.solution[i], i, x0: layout.W / 2, y0: layout.header + layout.strip / 2, x1, y1, t: 0, dur: REDUCED ? 0.01 : 0.5, hint: true });
}
function burst(x, y, color, n) {
  if (REDUCED) return;
  for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 160; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, t: 0, color, r: 1.2 + Math.random() * 1.8 }); }
}

// ---------------- win: the black hole ----------------
function startWin() {
  view = 'win'; G.sel = -1;
  const timeBonus = Math.max(0, 3000 - Math.floor(G.elapsed / 1000) * 3);
  const finalScore = G.score + timeBonus + (G.mistakes === 0 ? 1000 : 0);
  winState = { t: 0, phase: 'collapse', timeBonus, finalScore, cells: [], revealT: 0 };
  for (let i = 0; i < 81; i++) { const [x, y] = cellCenter(i); winState.cells.push({ x, y, ang: Math.atan2(y - (layout.gy + layout.gs / 2), x - (layout.gx + layout.gs / 2)), r: Math.hypot(x - (layout.gx + layout.gs / 2), y - (layout.gy + layout.gs / 2)), d: Math.random() * 0.6 }); }
  SFX.hole();
  progress.done[G.level] = (progress.done[G.level] || 0) + 1;
  progress.best[G.level] = Math.max(progress.best[G.level] || 0, finalScore);
  if (G.level <= NLEVELS) progress.unlocked = Math.max(progress.unlocked, Math.min(NLEVELS, G.level + 1));
  store.set('sus.progress', progress); store.set('sus.save', null);
}

// ---------------- drawing ----------------
function drawSky(dt, t) {
  const { W, H } = layout;
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.35, H * 0.7);
  g.addColorStop(0, 'rgba(46,88,130,0.35)'); g.addColorStop(1, 'rgba(7,13,25,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of bgStars) {
    s.y += dt * 4 * s.z; if (s.y > H) s.y -= H;
    const a = 0.25 + 0.55 * s.z * (0.6 + 0.4 * Math.sin(t * 1.5 + s.tw));
    ctx.fillStyle = `rgba(238,242,255,${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, 0.6 + s.z * 1.1, 0, 6.28); ctx.fill();
  }
}
function drawConstellation(sky, ox, oy, litFrac, alpha, glow) {
  ctx.save(); ctx.translate(ox, oy); ctx.globalAlpha = alpha;
  for (const b of sky.bg) { const r = Math.max(0.3, (6.2 - b[2]) * 0.35); ctx.fillStyle = `rgba(238,242,255,${0.25 + (6.2 - b[2]) * 0.1})`; ctx.beginPath(); ctx.arc(b[0], b[1], r, 0, 6.28); ctx.fill(); }
  const nLit = Math.floor(litFrac * sky.edges.length + 1e-6);
  sky.edges.forEach((e, k) => {
    const lit = k < nLit;
    ctx.strokeStyle = lit ? P.cyan : 'rgba(238,242,255,0.22)'; ctx.lineWidth = lit ? 1.8 : 1; ctx.lineCap = 'round';
    if (lit && glow) { ctx.shadowColor = P.cyan; ctx.shadowBlur = 10; } else ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(e[0][0], e[0][1]); ctx.lineTo(e[1][0], e[1][1]); ctx.stroke();
  });
  ctx.shadowBlur = 0;
  for (const v of sky.verts) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(v[0], v[1], 2.2, 0, 6.28); ctx.fill(); }
  ctx.restore();
}
function drawHeader() {
  const { W, header, safeT } = layout;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.ink; ctx.font = `600 20px ${SERIF}`; ctx.textAlign = 'left';
  ctx.fillText(G.name, layout.pad + 2, safeT + 30);
  ctx.fillStyle = P.dim; ctx.font = `13px ${SANS}`;
  ctx.fillText(`${G.meaning}  ·  ${G.level} of ${NLEVELS}  ·  ${G.tier}`, layout.pad + 2, safeT + 49);
  ctx.textAlign = 'right'; ctx.fillStyle = P.gold; ctx.font = `700 24px ${SANS}`;
  ctx.fillText(fmt(G.score), W - layout.pad - 2, safeT + 32);
  ctx.fillStyle = G.combo > 1 ? P.cyan : P.dim; ctx.font = `12px ${SANS}`;
  ctx.fillText(G.combo > 1 ? `combo ×${Math.min(G.combo, 5)}` : 'combo ×1', W - layout.pad - 2, safeT + 49);
  // back button
  ctx.fillStyle = P.dim; ctx.font = `13px ${SANS}`; ctx.textAlign = 'center';
}
function drawGrid(t) {
  const { gx, gy, gs, cell } = layout;
  const g = G;
  // peers + selection
  if (g.sel >= 0) {
    for (let i = 0; i < 81; i++) if (unitsOf(i).some(u => unitsOf(g.sel).includes(u))) { const r = i / 9 | 0, c = i % 9; ctx.fillStyle = P.peer; ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell); }
    const r = g.sel / 9 | 0, c = g.sel % 9; ctx.fillStyle = P.sel; ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell);
    const v = g.grid[g.sel];
    if (v) for (let i = 0; i < 81; i++) if (i !== g.sel && g.grid[i] === v) { const rr = i / 9 | 0, cc = i % 9; ctx.fillStyle = 'rgba(216,178,92,0.14)'; ctx.fillRect(gx + cc * cell, gy + rr * cell, cell, cell); }
  }
  // flashes
  for (const a of anims) if (a.kind === 'flash' && a.t > 0) { const r = a.i / 9 | 0, c = a.i % 9, k = Math.sin(Math.min(1, a.t / a.dur) * Math.PI); ctx.fillStyle = `rgba(95,227,255,${0.55 * k})`; ctx.fillRect(gx + c * cell, gy + r * cell, cell, cell); }
  // lines
  for (let i = 0; i <= 9; i++) {
    const bold = i % 3 === 0; ctx.strokeStyle = bold ? P.gridBold : P.grid; ctx.lineWidth = bold ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(gx, gy + i * cell); ctx.lineTo(gx + gs, gy + i * cell); ctx.moveTo(gx + i * cell, gy); ctx.lineTo(gx + i * cell, gy + gs); ctx.stroke();
  }
  // digits
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 81; i++) {
    const r = i / 9 | 0, c = i % 9, x = gx + c * cell + cell / 2, y = gy + r * cell + cell / 2;
    const v = g.grid[i];
    if (v) {
      let sc = 1; if (g.popped[i] > 0) { g.popped[i] = Math.max(0, g.popped[i] - 0.05); sc = 1 + 0.35 * Math.sin(g.popped[i] * Math.PI); }
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.fillStyle = g.puzzle[i] ? P.given : g.wrong[i] ? P.tilt : P.entered;
      ctx.font = `${g.puzzle[i] ? 600 : 500} ${cell * 0.56}px ${SANS}`; ctx.fillText(v, 0, 1); ctx.restore();
    } else if (g.notes[i]) {
      ctx.fillStyle = P.note; ctx.font = `${cell * 0.24}px ${SANS}`;
      for (let n = 1; n <= 9; n++) if (g.notes[i] & (1 << n)) { const nr = (n - 1) / 3 | 0, nc = (n - 1) % 3; ctx.fillText(n, gx + c * cell + cell * (0.2 + nc * 0.3), gy + r * cell + cell * (0.22 + nr * 0.3)); }
    }
  }
}
function drawPad() {
  const counts = Array(10).fill(0); for (const v of G.grid) counts[v]++;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r = layout.padR;
  for (let n = 1; n <= 9; n++) {
    const [x, y] = layout.padPos[n - 1], done = counts[n] >= 9;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28);
    ctx.fillStyle = done ? 'rgba(238,242,255,0.04)' : 'rgba(95,227,255,0.10)'; ctx.fill();
    ctx.strokeStyle = done ? 'rgba(238,242,255,0.12)' : 'rgba(95,227,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = done ? P.dim : P.ink; ctx.font = `600 ${r * 0.92}px ${SANS}`; ctx.fillText(n, x, y + 1);
  }
  const items = [[G.notesMode ? 'Notes on' : 'Notes', G.notesMode], ['Erase', false], ['Hint \u2212300', false]];
  items.forEach(([label, on], k) => {
    const b = layout.tools[k];
    ctx.fillStyle = on ? 'rgba(216,178,92,0.18)' : 'rgba(238,242,255,0.05)'; roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = on ? P.gold : 'rgba(238,242,255,0.14)'; ctx.lineWidth = 1; roundRect(b.x, b.y, b.w, b.h, 10); ctx.stroke();
    ctx.fillStyle = on ? P.gold : P.ink; ctx.font = `500 ${Math.min(15, b.w / 7)}px ${SANS}`; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  });
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawAnims(dt) {
  for (const a of anims) {
    a.t += dt;
    if (a.kind === 'orb') {
      const k = Math.min(1, a.t / a.dur), e = easeOut(k);
      const mx = (a.x0 + a.x1) / 2 + (a.hint ? 0 : (a.x1 - a.x0) * 0.15), my = Math.min(a.y0, a.y1) - 60;
      const x = (1 - e) * (1 - e) * a.x0 + 2 * (1 - e) * e * mx + e * e * a.x1, y = (1 - e) * (1 - e) * a.y0 + 2 * (1 - e) * e * my + e * e * a.y1;
      if (!REDUCED) particles.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.3, t: 0, color: a.hint ? P.gold : P.cyan, r: 1.5 });
      ctx.shadowColor = a.hint ? P.gold : P.cyan; ctx.shadowBlur = 18; ctx.fillStyle = a.hint ? P.gold : P.plasma;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = P.bg; ctx.font = `700 12px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.n, x, y + 1);
      if (k >= 1) { a.done = true; land(a); }
    } else if (a.kind === 'pts') {
      const k = Math.min(1, a.t / a.dur); ctx.globalAlpha = 1 - k; ctx.fillStyle = a.color; ctx.font = `700 15px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.text, a.x, a.y - 28 * k); ctx.globalAlpha = 1; if (k >= 1) a.done = true;
    } else if (a.kind === 'flash') { if (a.t > a.dur) a.done = true; }
  }
  anims = anims.filter(a => !a.done);
  for (const p of particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; const k = 1 - p.t / p.life; if (k > 0) { ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k + 0.3, 0, 6.28); ctx.fill(); } }
  ctx.globalAlpha = 1; particles = particles.filter(p => p.t < p.life);
  if (toast) { toast.t += dt; const k = Math.min(1, toast.t / 0.15), fade = toast.t > 1.1 ? Math.max(0, 1 - (toast.t - 1.1) / 0.3) : 1; ctx.globalAlpha = fade; ctx.fillStyle = toast.color; ctx.font = `700 ${18 + 6 * (1 - k)}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(toast.text, layout.W / 2, layout.gy - 16); ctx.globalAlpha = 1; if (toast.t > 1.4) toast = null; }
}
function secretPos() {
  const sc = SECRETS[G.abbr]; if (!sc) return null;
  const raw = SKY.C[G.abbr].lines;
  if (!raw[sc.seg] || !raw[sc.seg][sc.pt]) return null;
  // map through the same projection: find matching vertex in segsPx
  const seg = G.sky.segsPx[sc.seg]; if (!seg || !seg[sc.pt]) return null;
  return [layout.stripX + seg[sc.pt][0], layout.stripY + seg[sc.pt][1], sc];
}
function drawStrip(t) {
  const sky = G.sky, ox = layout.stripX, oy = layout.stripY;
  drawConstellation(sky, ox, oy, G.lit / 27, 1, !REDUCED);
  const sp = secretPos();
  if (sp) {
    const [x, y, sc] = sp;
    if (sc.id === 'betelgeuse') {
      // a red supergiant, breathing. Tap it three times and it does what it is going to do anyway.
      if (G.nova > 0) {
        G.nova = Math.min(1, G.nova + 0.012);
        const k = G.nova, R = 4 + 120 * k * k;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(255,255,255,${1 - k * 0.3})`); gr.addColorStop(0.25, `rgba(255,214,150,${0.9 * (1 - k)})`);
        gr.addColorStop(0.6, `rgba(255,120,80,${0.5 * (1 - k)})`); gr.addColorStop(1, 'rgba(255,60,60,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.28); ctx.fill();
        ctx.strokeStyle = `rgba(255,236,200,${1 - k})`; ctx.lineWidth = 2 * (1 - k);
        ctx.beginPath(); ctx.arc(x, y, R * 0.75, 0, 6.28); ctx.stroke();
        if (k >= 1) { G.nova = 0; showToast('Betelgeuse, eventually', P.gold); }
      } else {
        const pulse = 3.2 + Math.sin(t * 1.6) * 0.9 + G.secretTaps * 1.6;
        ctx.fillStyle = '#ff8a5c'; ctx.shadowColor = '#ff6b3d'; ctx.shadowBlur = 10 + G.secretTaps * 8;
        ctx.beginPath(); ctx.arc(x, y, pulse, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
      }
    } else if (sc.id === 'mizar') {
      // Mizar has a faint companion, Alcor. The old eyesight test.
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.28); ctx.fill();
      if (G.split > 0) {
        G.split = Math.min(1, G.split + 0.02);
        const d = 3 + 9 * easeOut(G.split);
        ctx.fillStyle = `rgba(238,242,255,${0.5 + 0.5 * G.split})`; ctx.beginPath(); ctx.arc(x + d, y - d * 0.5, 1.6, 0, 6.28); ctx.fill();
        if (G.split >= 1 && !G.splitShown) { G.splitShown = true; showToast('Alcor — can you see it?', P.cyan); }
      }
    } else if (sc.id === 'algol') {
      // Algol really does dim every 2.87 days as its companion eclipses it.
      const ph = (t % 8) / 8, dim = ph < 0.12 ? 1 - Math.sin(ph / 0.12 * Math.PI) * 0.8 : 1;
      ctx.fillStyle = `rgba(238,242,255,${dim})`; ctx.beginPath(); ctx.arc(x, y, 2.2 + dim, 0, 6.28); ctx.fill();
    } else if (sc.id === 'aldebaran') {
      ctx.fillStyle = '#ffb27a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.28); ctx.fill();
    }
  }
  // meteor shower, on the real nights of the year
  if (G.shower && !REDUCED) drawMeteors(t, G.shower);
}
let meteors = [];
function drawMeteors(t, sh) {
  if (Math.random() < 0.02 && meteors.length < 4) {
    const a = 0.6 + Math.random() * 0.5, spd = 480 + Math.random() * 380;
    meteors.push({ x: Math.random() * layout.W, y: layout.safeT + Math.random() * 60, vx: Math.cos(a) * spd * (Math.random() < 0.5 ? -1 : 1), vy: Math.sin(a) * spd, life: 0.9, t: 0 });
  }
  for (const m of meteors) {
    m.t += 1 / 60; m.x += m.vx / 60; m.y += m.vy / 60;
    const k = 1 - m.t / m.life; if (k <= 0) continue;
    const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.07, m.y - m.vy * 0.07);
    g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 0.07, m.y - m.vy * 0.07); ctx.stroke();
  }
  meteors = meteors.filter(m => m.t < m.life);
}

// ---------------- win drawing ----------------
function drawWin(dt, t) {
  const w = winState; w.t += dt;
  const { W, H, gx, gy, gs } = layout, cx = gx + gs / 2, cy = gy + gs / 2;
  const T = REDUCED ? 0.4 : 1;
  if (w.phase === 'collapse') {
    const k = Math.min(1, w.t / (3.2 * T));
    shake = REDUCED ? 0 : 4 + 10 * k;
    drawHeader(); drawStrip(t);
    // lensing on background stars: pull toward hole
    const R = 40 + 160 * k;
    // gravitational lensing: background stars near the hole are bent outward into an Einstein ring
    if (!REDUCED) for (const s of bgStars) {
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy);
      if (d > R * 4 || d < 1) continue;
      const bend = (R * R * 0.9) / d, nd = d + bend * k;
      const x = cx + dx / d * nd, y = cy + dy / d * nd, a = 0.5 + 0.5 * k;
      ctx.fillStyle = `rgba(238,242,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 1 + s.z * 1.4, 0, 6.28); ctx.fill();
      // mirror image on the far side, the signature of lensing
      ctx.fillStyle = `rgba(95,227,255,${0.35 * k})`; ctx.beginPath(); ctx.arc(cx - dx / d * (R * 1.25), cy - dy / d * (R * 1.25), 0.8 + s.z, 0, 6.28); ctx.fill();
    }
    // accretion disk: hot inner ring, rotating arcs, doppler-bright on one side
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
      const rr = R * (0.95 + i * 0.22), spin = t * (2.4 - i * 0.3) * (i % 2 ? -1 : 1) + i;
      const grad = ctx.createLinearGradient(-rr, 0, rr, 0);
      grad.addColorStop(0, 'rgba(95,227,255,0)'); grad.addColorStop(0.35, `rgba(255,236,190,${0.95 * k})`); grad.addColorStop(0.6, `rgba(255,170,90,${0.7 * k})`); grad.addColorStop(1, 'rgba(255,79,139,0)');
      ctx.strokeStyle = grad; ctx.lineWidth = (9 - i) * (0.6 + 0.4 * k); ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 16 * k;
      ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * (0.22 + i * 0.04), spin, 0, 6.28); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // photon ring
    ctx.strokeStyle = `rgba(255,244,214,${0.9 * k})`; ctx.lineWidth = 2.5; ctx.shadowColor = '#fff2c8'; ctx.shadowBlur = 22 * k;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, 6.28); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
    // cells spiral in
    for (let i = 0; i < 81; i++) {
      const c = w.cells[i], kk = Math.max(0, Math.min(1, (k - c.d * 0.5) / 0.6)), e = kk * kk;
      const r = c.r * (1 - e), ang = c.ang + e * 5.2;
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
      if (r < 6) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.scale(1 - e * 0.5, 1 + e * 1.6);
      ctx.globalAlpha = 1 - e * 0.85; ctx.fillStyle = e > 0.5 ? '#ffd27a' : (G.puzzle[i] ? P.given : P.entered); ctx.font = `600 ${layout.cell * 0.56 * (1 - e * 0.5)}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(G.solution[i], 0, 0); ctx.restore();
    }
    ctx.globalAlpha = 1;
    // event horizon
    ctx.save(); ctx.translate(cx, cy);
    const hg = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.1); hg.addColorStop(0, '#000'); hg.addColorStop(0.7, '#000'); hg.addColorStop(0.85, `rgba(255,220,140,${0.9 * k})`); hg.addColorStop(1, 'rgba(95,227,255,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, R * 1.1, 0, 6.28); ctx.fill(); ctx.restore();
    if (k >= 1) { w.phase = 'flash'; w.t = 0; SFX.win(); }
  } else if (w.phase === 'flash') {
    const k = Math.min(1, w.t / (0.5 * T)); ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.fillRect(0, 0, W, H);
    shake = 0; if (k >= 1) { w.phase = 'reveal'; w.t = 0; }
  }
  if (w.phase === 'reveal' || w.phase === 'flash') {
    const k = w.phase === 'reveal' ? Math.min(1, w.t / (0.8 * T)) : 0;
    const sky = projectConst(G.abbr, Math.min(W * 0.72, 300), 0.08), ox = (W - sky.size) / 2, oy = layout.safeT + 60;
    drawConstellation(sky, ox, oy, 1, k, !REDUCED);
    ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    let y = oy + sky.size + 24;
    ctx.fillStyle = P.ink; ctx.font = `600 30px ${SERIF}`; ctx.fillText(G.name, W / 2, y); y += 24;
    ctx.fillStyle = P.gold; ctx.font = `italic 16px ${SERIF}`; ctx.fillText(G.meaning, W / 2, y); y += 30;
    ctx.fillStyle = P.ink; ctx.font = `15px ${SERIF}`; y = wrapText(G.fact, W / 2, y, W - 56, 22); y += 10;
    const hole = HOLES[G.abbr];
    if (hole) {
      ctx.fillStyle = P.gold; ctx.font = `italic 14px ${SERIF}`;
      y = wrapText(`That was no ordinary collapse. ${hole[0]} is real, and it is here — ${hole[1]}.`, W / 2, y, W - 60, 20); y += 4;
    }
    y += 10;
    ctx.fillStyle = P.dim; ctx.font = `13px ${SANS}`;
    ctx.fillText(`${fmt(G.score)} play  +  ${fmt(w.timeBonus)} speed${G.mistakes === 0 ? '  +  1,000 flawless' : ''}`, W / 2, y); y += 30;
    ctx.fillStyle = P.gold; ctx.font = `700 34px ${SANS}`; ctx.fillText(fmt(w.finalScore), W / 2, y); y += 18;
    ctx.fillStyle = P.dim; ctx.font = `12px ${SANS}`; ctx.fillText(`best ${fmt(progress.best[G.level])}  ·  ${Math.floor(G.elapsed / 60000)}m ${Math.floor(G.elapsed / 1000) % 60}s`, W / 2, y);
    ctx.globalAlpha = 1;
    // buttons
    const by = H - layout.safeB - 96, bw = Math.min(360, W - 48);
    w.buttons = [];
    if (G.level < NLEVELS) { button((W - bw) / 2, by, bw, 48, `Next: ${levelName(G.level + 1)}`, true, k); w.buttons.push({ x: (W - bw) / 2, y: by, w: bw, h: 48, act: 'next' }); }
    else if (G.level === NLEVELS && argoUnlocked() && !progress.done[89]) { button((W - bw) / 2, by, bw, 48, 'A ship is waiting', true, k); w.buttons.push({ x: (W - bw) / 2, y: by, w: bw, h: 48, act: 'argo' }); }
    button((W - bw) / 2, by + 58, bw / 2 - 5, 40, 'Play again', false, k); w.buttons.push({ x: (W - bw) / 2, y: by + 58, w: bw / 2 - 5, h: 40, act: 'again' });
    button((W - bw) / 2 + bw / 2 + 5, by + 58, bw / 2 - 5, 40, 'Star map', false, k); w.buttons.push({ x: (W - bw) / 2 + bw / 2 + 5, y: by + 58, w: bw / 2 - 5, h: 40, act: 'map' });
  }
}
function button(x, y, w, h, label, primary, alpha) {
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.fillStyle = primary ? P.gold : 'rgba(238,242,255,0.07)'; roundRect(x, y, w, h, 12); ctx.fill();
  if (!primary) { ctx.strokeStyle = 'rgba(238,242,255,0.18)'; ctx.lineWidth = 1; roundRect(x, y, w, h, 12); ctx.stroke(); }
  ctx.fillStyle = primary ? P.bg : P.ink; ctx.font = `600 ${primary ? 17 : 15}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + h / 2 + 1); ctx.globalAlpha = 1;
}
function wrapText(text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const wd of words) { const test = line ? line + ' ' + wd : wd; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = test; }
  if (line) { ctx.fillText(line, x, y); y += lh; }
  return y;
}

// ---------------- title & map ----------------
let titleSky = null, mapScroll = 0, mapButtons = [];
function drawTitle(t) {
  const { W, H } = layout;
  if (!titleSky) titleSky = projectConst('Ori', Math.min(W * 0.7, 300), 0.1);
  const ox = (W - titleSky.size) / 2, oy = H * 0.30;
  drawConstellation(titleSky, ox, oy, (Math.sin(t * 0.6) + 1) / 2, 1, !REDUCED);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.gold; ctx.font = `13px ${SANS}`; ctx.fillText('The Lucid Mind Collection', W / 2, H * 0.14);
  ctx.fillStyle = P.ink; ctx.font = `600 40px ${SERIF}`; ctx.fillText('Sudoku', W / 2, H * 0.14 + 52); ctx.fillText('Under the Stars', W / 2, H * 0.14 + 96);
  const sh = showerToday();
  if (sh && !REDUCED) drawMeteors(t, sh);
  ctx.fillStyle = P.dim; ctx.font = `14px ${SANS}`; ctx.fillText('88 constellations. One puzzle each.', W / 2, oy + titleSky.size + 30);
  if (sh) { ctx.fillStyle = P.gold; ctx.font = `italic 13px ${SERIF}`; ctx.fillText(`The ${sh.name} are falling tonight.`, W / 2, oy + titleSky.size + 52); }
  const bw = Math.min(320, W - 48), by = H - layout.safeB - 150;
  const sv = store.get('sus.save', null);
  mapButtons = [];
  if (sv) { button((W - bw) / 2, by - 58, bw, 50, `Continue ${levelName(sv.level)}`, true); mapButtons.push({ x: (W - bw) / 2, y: by - 58, w: bw, h: 50, act: 'continue' }); }
  button((W - bw) / 2, by, bw, 50, progress.unlocked > 1 ? 'Star map' : 'Begin with Orion', !sv); mapButtons.push({ x: (W - bw) / 2, y: by, w: bw, h: 50, act: progress.unlocked > 1 ? 'map' : 'start' });
  button((W - bw) / 2, by + 60, bw, 40, progress.sound ? 'Sound on' : 'Sound off', false); mapButtons.push({ x: (W - bw) / 2, y: by + 60, w: bw, h: 40, act: 'sound' });
}
function drawMap(t) {
  const { W, H, safeT, safeB } = layout;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = P.ink; ctx.font = `600 24px ${SERIF}`; ctx.fillText('Star map', 20, safeT + 40);
  ctx.fillStyle = P.dim; ctx.font = `13px ${SANS}`; const done = Object.keys(progress.done).length; ctx.fillText(`${done} of ${NLEVELS} constellations solved`, 20, safeT + 60);
  ctx.textAlign = 'right'; ctx.fillStyle = P.gold; ctx.fillText('Back', W - 20, safeT + 40);
  mapButtons = [{ x: W - 80, y: safeT + 16, w: 70, h: 36, act: 'title' }];
  const cols = W < 420 ? 3 : 4, cw = (W - 40 - (cols - 1) * 10) / cols, ch = cw * 0.92, top = safeT + 84;
  const argoRow = argoUnlocked() ? ch * 0.9 + 16 : 0;
  const maxScroll = Math.max(0, Math.ceil(NLEVELS / cols) * (ch + 10) + argoRow + top - H + safeB + 20);
  mapScroll = Math.max(0, Math.min(maxScroll, mapScroll));
  ctx.save(); ctx.beginPath(); ctx.rect(0, top - 4, W, H - top - safeB); ctx.clip();
  for (let l = 1; l <= NLEVELS; l++) {
    const r = (l - 1) / cols | 0, c = (l - 1) % cols, x = 20 + c * (cw + 10), y = top + r * (ch + 10) - mapScroll;
    if (y + ch < top - 10 || y > H) continue;
    const unlocked = l <= progress.unlocked, solved = !!progress.done[l], ab = ORDER[l - 1];
    ctx.fillStyle = solved ? 'rgba(216,178,92,0.10)' : unlocked ? 'rgba(95,227,255,0.07)' : 'rgba(238,242,255,0.03)'; roundRect(x, y, cw, ch, 12); ctx.fill();
    ctx.strokeStyle = solved ? 'rgba(216,178,92,0.5)' : unlocked ? 'rgba(95,227,255,0.35)' : 'rgba(238,242,255,0.08)'; ctx.lineWidth = 1; roundRect(x, y, cw, ch, 12); ctx.stroke();
    const sk = mapSky(ab, cw * 0.62); drawConstellation(sk, x + (cw - sk.size) / 2, y + 6, solved ? 1 : 0, unlocked ? 1 : 0.3, false);
    ctx.textAlign = 'center'; ctx.fillStyle = unlocked ? P.ink : P.dim; ctx.font = `${cw < 100 ? 11 : 12}px ${SERIF}`; ctx.fillText(SKY.C[ab].name, x + cw / 2, y + ch - 20);
    ctx.fillStyle = P.dim; ctx.font = `10px ${SANS}`; ctx.fillText(unlocked ? (solved ? fmt(progress.best[l]) : tierOf(l)) : 'Locked', x + cw / 2, y + ch - 7);
    if (unlocked) mapButtons.push({ x, y, w: cw, h: ch, act: 'level', level: l });
  }
  // the ship, reassembled
  if (argoUnlocked()) {
    const rr = Math.ceil(NLEVELS / cols), y = top + rr * (ch + 10) - mapScroll, w = W - 40, h = ch * 0.9;
    ctx.fillStyle = 'rgba(216,178,92,0.12)'; roundRect(20, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(216,178,92,0.65)'; ctx.lineWidth = 1.4; roundRect(20, y, w, h, 12); ctx.stroke();
    const sk = mapSky('ARGO', h * 0.8); drawConstellation(sk, 20 + 12, y + h * 0.1, 1, 1, false);
    ctx.textAlign = 'left'; ctx.fillStyle = P.gold; ctx.font = `600 16px ${SERIF}`;
    ctx.fillText('Argo Navis', 20 + h * 0.8 + 28, y + h * 0.42);
    ctx.fillStyle = P.dim; ctx.font = `11px ${SANS}`;
    ctx.fillText('the ship, made whole again', 20 + h * 0.8 + 28, y + h * 0.42 + 17);
    ctx.fillText(progress.done[89] ? `best ${fmt(progress.best[89])}` : 'Legend  ·  24 clues', 20 + h * 0.8 + 28, y + h * 0.42 + 33);
    mapButtons.push({ x: 20, y, w, h, act: 'level', level: 89 });
  }
  ctx.restore();
}
const skyCache = {};
function mapSky(ab, size) { const k = ab + '|' + Math.round(size); if (!skyCache[k]) { const s = projectConst(ab, size, 0.12); s.bg = []; skyCache[k] = s; } return skyCache[k]; }

// ---------------- main loop ----------------
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; const t = now / 1000;
  ctx.save();
  if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.86; if (shake < 0.3) shake = 0; }
  drawSky(dt, t);
  if (view === 'title') drawTitle(t);
  else if (view === 'map') drawMap(t);
  else if (view === 'play') { drawHeader(); drawStrip(t); drawGrid(t); drawPad(); drawAnims(dt); drawBack(); }
  else if (view === 'win') { drawWin(dt, t); drawAnims(dt); }
  ctx.restore();
  requestAnimationFrame(frame);
}
function drawBack() { ctx.fillStyle = P.dim; ctx.font = `12px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('Pause', layout.W / 2, layout.pauseY); }

// ---------------- input ----------------
let touchY0 = 0, dragged = false;
function hit(x, y, b) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
function onTap(x, y) {
  audio();
  if (view === 'title') { for (const b of mapButtons) if (hit(x, y, b)) return act(b); return; }
  if (view === 'map') { for (const b of mapButtons) if (hit(x, y, b)) return act(b); return; }
  if (view === 'win' && winState && winState.phase === 'reveal' && winState.buttons) { for (const b of winState.buttons) if (hit(x, y, b)) return act(b); return; }
  if (view !== 'play') return;
  const { gx, gy, gs, cell } = layout;
  // secret star in the constellation strip
  const sp = secretPos();
  if (sp) {
    const [sx, sy, sc] = sp;
    if (Math.hypot(x - sx, y - sy) < 26) {
      G.secretTaps++;
      if (sc.id === 'betelgeuse') {
        if (G.secretTaps >= sc.taps) { G.nova = 0.001; G.secretTaps = 0; SFX.hole(); shake = REDUCED ? 0 : 14; burst(sx, sy, '#ff8a5c', 26); }
        else { SFX.tap(); showToast(['Betelgeuse…', 'Betelgeuse……'][G.secretTaps - 1] || 'Betelgeuse', '#ff8a5c'); }
      } else if (sc.id === 'mizar') { if (!G.split) { G.split = 0.001; SFX.hint(); } }
      else if (sc.id === 'algol') { SFX.tap(); showToast('Algol, the Demon Star', P.cyan); }
      else if (sc.id === 'aldebaran') { SFX.tap(); showToast('Aldebaran, the eye of the bull', '#ffb27a'); }
      return;
    }
  }
  if (x >= gx && x < gx + gs && y >= gy && y < gy + gs) { const c = (x - gx) / cell | 0, r = (y - gy) / cell | 0; G.sel = r * 9 + c; SFX.tap(); return; }
  // keypad: nearest circle within a forgiving radius
  const R = layout.padR + 12;
  let bestN = -1, bestD = 1e9;
  for (let n = 1; n <= 9; n++) { const p = layout.padPos[n - 1], d = Math.hypot(x - p[0], y - p[1]); if (d < bestD) { bestD = d; bestN = n; } }
  if (bestD <= R) { place(bestN); return; }
  for (let k = 0; k < 3; k++) {
    const b = layout.tools[k];
    if (x >= b.x && x <= b.x + b.w && y >= b.y - 4 && y <= b.y + b.h + 4) {
      if (k === 0) { G.notesMode = !G.notesMode; SFX.tap(); } else if (k === 1) erase(); else hint();
      return;
    }
  }
  if (y > layout.H - layout.safeB - 30) { save(); view = 'title'; return; }
}
function act(b) {
  SFX.tap();
  if (b.act === 'start') { newGame(1); view = 'play'; }
  else if (b.act === 'continue') { const sv = store.get('sus.save', null); if (sv) { resume(sv); view = 'play'; } }
  else if (b.act === 'map') { view = 'map'; }
  else if (b.act === 'title') { view = 'title'; }
  else if (b.act === 'sound') { progress.sound = !progress.sound; store.set('sus.progress', progress); }
  else if (b.act === 'level') { newGame(b.level); view = 'play'; }
  else if (b.act === 'next') { newGame(G.level + 1); view = 'play'; }
  else if (b.act === 'again') { newGame(G.level); view = 'play'; }
  else if (b.act === 'argo') { newGame(89); view = 'play'; }
  resize();
}
canvas.addEventListener('pointerdown', e => { touchY0 = e.clientY; dragged = false; });
canvas.addEventListener('pointermove', e => { if (view === 'map' && e.buttons) { const dy = e.clientY - touchY0; if (Math.abs(dy) > 4) { dragged = true; mapScroll -= dy; touchY0 = e.clientY; } } });
canvas.addEventListener('pointerup', e => { if (!dragged) onTap(e.clientX, e.clientY); });
canvas.addEventListener('wheel', e => { if (view === 'map') mapScroll += e.deltaY; }, { passive: true });
window.addEventListener('keydown', e => {
  if (view !== 'play') return;
  if (e.key >= '1' && e.key <= '9') place(+e.key);
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') erase();
  else if (e.key.toLowerCase() === 'n') G.notesMode = !G.notesMode;
  else if (e.key.toLowerCase() === 'h') hint();
  else if (e.key.startsWith('Arrow') && G.sel >= 0) { const r = G.sel / 9 | 0, c = G.sel % 9; const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]; G.sel = Math.max(0, Math.min(8, r + d[0])) * 9 + Math.max(0, Math.min(8, c + d[1])); }
});
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

resize();
requestAnimationFrame(frame);
})();
