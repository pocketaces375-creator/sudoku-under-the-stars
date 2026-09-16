// Sudoku engine — deterministic, verified-unique puzzles.
(function (global) {
  'use strict';

  // ---------- seeded RNG (mulberry32) ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const BOX = new Int8Array(81);
  for (let i = 0; i < 81; i++) BOX[i] = ((i / 9 | 0) / 3 | 0) * 3 + ((i % 9) / 3 | 0);
  const popcnt = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

  // ---------- solution counter (bitmask, MRV) ----------
  function countSolutions(g, limit) {
    const rows = new Int16Array(9), cols = new Int16Array(9), boxes = new Int16Array(9);
    for (let i = 0; i < 81; i++) if (g[i]) {
      const b = 1 << g[i]; rows[i / 9 | 0] |= b; cols[i % 9] |= b; boxes[BOX[i]] |= b;
    }
    let count = 0;
    function rec() {
      let best = -1, bestMask = 0, bestN = 10;
      for (let i = 0; i < 81; i++) if (!g[i]) {
        const used = rows[i / 9 | 0] | cols[i % 9] | boxes[BOX[i]];
        const mask = (~used) & 0x3FE;
        const n = popcnt(mask);
        if (n === 0) return;
        if (n < bestN) { bestN = n; best = i; bestMask = mask; if (n === 1) break; }
      }
      if (best === -1) { count++; return; }
      const r = best / 9 | 0, c = best % 9, bi = BOX[best];
      let m = bestMask;
      while (m) {
        const b = m & -m; m ^= b; const v = 31 - Math.clz32(b);
        g[best] = v; rows[r] |= b; cols[c] |= b; boxes[bi] |= b;
        rec();
        g[best] = 0; rows[r] ^= b; cols[c] ^= b; boxes[bi] ^= b;
        if (count >= limit) return;
      }
    }
    rec();
    return count;
  }

  // ---------- full grid ----------
  function fullGrid(r) {
    const g = new Int8Array(81);
    const rows = new Int16Array(9), cols = new Int16Array(9), boxes = new Int16Array(9);
    function rec(i) {
      if (i === 81) return true;
      const rr = i / 9 | 0, c = i % 9, bi = BOX[i];
      const vals = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r);
      for (const v of vals) {
        const b = 1 << v;
        if ((rows[rr] | cols[c] | boxes[bi]) & b) continue;
        g[i] = v; rows[rr] |= b; cols[c] |= b; boxes[bi] |= b;
        if (rec(i + 1)) return true;
        g[i] = 0; rows[rr] ^= b; cols[c] ^= b; boxes[bi] ^= b;
      }
      return false;
    }
    rec(0);
    return g;
  }

  // ---------- puzzle from seed ----------
  // returns {puzzle:Int8Array(81), solution:Int8Array(81), clues}
  function generate(seed, targetClues) {
    const r = rng(seed);
    const sol = fullGrid(r);
    const puz = Int8Array.from(sol);
    let clues = 81;
    const cells = shuffle([...Array(81).keys()], r);
    const tried = new Set();
    // symmetric pass
    for (const i of cells) {
      if (clues <= targetClues) break;
      const j = 80 - i, key = Math.min(i, j) * 100 + Math.max(i, j);
      if (tried.has(key)) continue; tried.add(key);
      if (!puz[i] && !puz[j]) continue;
      const a = puz[i], b = puz[j];
      puz[i] = 0; puz[j] = 0;
      if (countSolutions(Int8Array.from(puz), 2) === 1) clues -= (i === j ? 1 : 2);
      else { puz[i] = a; puz[j] = b; }
    }
    // free pass
    if (clues > targetClues) {
      shuffle(cells, r);
      for (const i of cells) {
        if (clues <= targetClues) break;
        if (!puz[i]) continue;
        const v = puz[i]; puz[i] = 0;
        if (countSolutions(Int8Array.from(puz), 2) === 1) clues--; else puz[i] = v;
      }
    }
    return { puzzle: puz, solution: sol, clues };
  }

  function isValidPlacement(grid, i, v) {
    const r = i / 9 | 0, c = i % 9, bi = BOX[i];
    for (let k = 0; k < 81; k++) {
      if (k === i || grid[k] !== v) continue;
      if ((k / 9 | 0) === r || k % 9 === c || BOX[k] === bi) return false;
    }
    return true;
  }

  global.Sudoku = { generate, countSolutions, isValidPlacement, rng, BOX };
})(typeof window !== 'undefined' ? window : globalThis);
