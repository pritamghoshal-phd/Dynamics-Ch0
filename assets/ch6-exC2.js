/* =========================================================
   Chapter 6, forced vibration examples 6.C.7 to 6.C.12
   One engine (forcedClip) integrates the full equation of motion  M q'' + c q' + K q = P(ω) sin(ωt + φ0)
   from rest, or shows the steady-state solution only. Each example supplies its system data and its drawing.
   Every clip stores the drawn coordinates (metres) in st.g, which the 3D views (ch6-3dC2.js) read.
   ========================================================= */
(function(){
const sgn = (v, d = 4) => (v < 0 ? '−' : '') + fmt(Math.abs(v), d);
/* on narrow screens the drawing is scaled down; keep labels and spring coils readable by enlarging them in drawing units */
let SC = 1;
const txt0 = (...a) => window.txt(...a);   // the global label function (this file's own txt below shadows it)
function txt(ctx, s, x, y, opt = {}){
  if (opt.fixed || SC >= 0.95) return txt0(ctx, s, x, y, opt);
  const f = opt.font || 'italic 15px Georgia, serif', px = parseFloat((f.match(/([\d.]+)px/) || [0, 15])[1]);
  return txt0(ctx, s, x, y, Object.assign({}, opt, { font: f.replace(/[\d.]+px/, Math.min(px / SC, px * 2.6).toFixed(1) + 'px') }));
}
function fitV(ctx, w, h, bb){ SC = fitView(ctx, w, h, bb); return SC; }

/* steady-state amplitude and phase lag of  M q'' + c q' + K q = P sin(ωt) */
function ssOf(M, K, c, P, w){ const D = K - M * w * w, X = P / Math.hypot(D, c * w); return { X, psi: Math.atan2(c * w, D) }; }

/* the shared engine: cfg = { id, controls, presets, sys(V) -> system, draw(ctx, w, h, st, sys) } */
function forcedClip(cfg){
  makeClip({
    id: cfg.id, speed: cfg.speed ?? 0.25,
    controls: cfg.controls,
    presets: (C, st, reset) => (cfg.presets ? cfg.presets(C) : []).concat([
      { label: 'Full response from rest', apply: () => { st.mode = 'full'; reset(); } },
      { label: 'Steady state only', apply: () => { st.mode = 'ss'; reset(); } }]),
    setup(st){ st.mode = 'full'; },
    reset(st){
      const S = st.sys = cfg.sys(st.V);
      st.ok = S.ok !== false && S.M > 0 && S.K > 0 && S.w >= 0;
      st.s = [0, 0, 0]; st.hist = []; st.blown = 0; st.note = '';
      if (!st.ok) return;
      S.c = 2 * (st.V.z || 0) * Math.sqrt(S.K * S.M);
      S.wn = Math.sqrt(S.K / S.M); S.r = S.w / S.wn;
      const ss = ssOf(S.M, S.K, S.c, S.P, S.w); S.X = ss.X; S.psi = ss.psi;
      S.noSS = !isFinite(S.X) || S.X * S.drawScale > S.qLim;          // undamped resonance: no bounded steady state
      st.q = 0;
      cfg.stats && setStats(cfg.id + '-stats', [['shown', st.mode === 'ss' ? 'steady state only' : 'full response from rest']].concat(S.drawScale !== 1 ? [['drawing', `displacements drawn ${S.drawScale}× larger`]] : []).concat(cfg.stats(S, st)));
    },
    step(st, dt){
      if (!st.ok) return;
      const S = st.sys;
      if (st.blown){ if (st.t - st.blown > 1.2){ st.t = 0; st.s = [0, 0, 0]; st.hist = []; st.blown = 0; st.note = ''; } return; }
      if (st.mode === 'ss'){
        if (S.noSS){ st.q = 0; st.note = 'Without damping there is no steady state at resonance. Switch to the full response.'; return; }
        st.q = S.X * Math.sin(S.w * st.t + S.phi0 - S.psi);
      } else {
        const f = s => [s[1], (S.P * Math.sin(S.w * s[2] + S.phi0) - S.c * s[1] - S.K * s[0]) / S.M, 1];
        st.s = stepN(f, st.s, st.t - st.s[2], 0.0004); st.q = st.s[0];
        if (Math.abs(st.q) * S.drawScale > S.qLim){ st.blown = st.t; st.note = 'The amplitude keeps growing, so the motion restarts before the parts would collide.'; }
        if (st.t > 16){ st.t = 0; st.s = [0, 0, 0]; st.hist = []; }
      }
      st.hist.push([st.t, st.q * S.unit, S.base ? S.base(st.t) * S.bunit : NaN]);
      while (st.hist.length && st.hist[0][0] < st.t - 2.6) st.hist.shift();
    },
    draw(st){
      const cv = $(cfg.id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, cfg.bad || 'Enter positive values, with amplitudes no larger than the slider maximum.'); return; }
      const S = st.sys;
      cfg.draw(ctx, w, h, st, S);
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0); SC = 1;
      if (st.note) txt(ctx, st.note, w / 2, h - 12, { font: '12px system-ui', color: RED, fixed: true });
      // x(t) plot: response and base motion over the last 2.5 s
      const t1 = Math.max(st.t, 2.5), hs = st.hist.filter(p => p[0] >= t1 - 2.5 && p[0] <= t1);
      const pts = hs.map(p => [p[0], p[1]]), bpts = hs.map(p => [p[0], p[2]]).filter(p => isFinite(p[1]));
      const A = Math.max(1e-9, S.noSS ? 0 : S.X * S.unit, S.bamp || 0, ...pts.map(p => Math.abs(p[1])), ...bpts.map(p => Math.abs(p[1])));
      const ser = [{ pts, color: COL.c2, width: 2.2 }]; if (bpts.length) ser.push({ pts: bpts, color: COL.muted, width: 1.4, dash: [5, 4] });
      plot($(cfg.id + '-xt'), { xmin: t1 - 2.5, xmax: t1, ymin: -1.25 * A, ymax: 1.25 * A, xlabel: 't (s)', ylabel: S.qlabel,
        series: ser, hlines: S.noSS ? [] : [{ y: S.X * S.unit, color: COL.c3 }, { y: -S.X * S.unit, color: COL.c3 }] });
      // frequency response: steady-state amplitude against forcing frequency, current ω marked
      const wmax = S.wmax, top = S.frTop, fr = [];
      for (let i = 0; i <= 400; i++){ const ww = wmax * i / 400, v = S.ratio(ww, S.c); fr.push([ww, v > top ? NaN : v]); }
      const cur = S.ratio(S.w, S.c);
      plot($(cfg.id + '-fr'), { xmin: 0, xmax: wmax, ymin: 0, ymax: top, fixed: true, xlabel: 'forcing frequency ω (rad/s)', ylabel: S.rlabel,
        series: [{ pts: fr, color: COL.c1, width: 2.2 }], bands: S.bands || [], hlines: S.hl || [],
        vlines: [{ x: S.wn, color: COL.muted, label: 'ωₙ' }, { x: S.w, color: COL.c2 }],
        points: isFinite(cur) && cur <= top ? [{ x: S.w, y: cur, color: COL.c2 }] : [] });
    }
  });
}

/* ---------- drawing helpers (drawing units = metres × S) ---------- */
function floorAt(ctx, x0, x1, y){ line(ctx, x0, y, x1, y, COL.fg, 2); hatch(ctx, x1, y, x0, y, -1, 9, 7); }
function wallAt(ctx, x, y0, y1, side){ line(ctx, x, y0, x, y1, COL.fg, 2); hatch(ctx, x, side > 0 ? y1 : y0, x, side > 0 ? y0 : y1, 1, 9, 7); }
function roller(ctx, x, y, r, ang){ ctx.save(); ctx.fillStyle = '#3a3d44'; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#d8d4c8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * Math.cos(ang), y + r * Math.sin(ang)); ctx.stroke(); ctx.restore(); }
function spr(ctx, x1, y1, x2, y2, lbl, n = 9, a = 7){ springLine(ctx, x1, y1, x2, y2, n, SC < 0.95 ? Math.min(a / SC, a * 1.8) : a); if (lbl) txt(ctx, lbl, (x1 + x2) / 2 + (y1 === y2 ? 0 : 16), (y1 + y2) / 2 - (y1 === y2 ? 16 : 0), { color: COL.fg }); }
function motionArrow(ctx, x, y, L, lbl, vertical){ // a fixed reference arrow showing the positive direction
  const off = Math.max(1, 0.8 / Math.min(1, SC));                     // labels grow on narrow screens, so they sit further out
  if (vertical){ arrow(ctx, x, y, x, y - L, COL.muted, 1.6); line(ctx, x - 5, y, x + 5, y, COL.muted, 1.6); txt(ctx, lbl, x + 14 * off, y - L / 2, { color: COL.muted }); }
  else { arrow(ctx, x, y, x + L, y, COL.muted, 1.6); line(ctx, x, y - 5, x, y + 5, COL.muted, 1.6); txt(ctx, lbl, x + L / 2, y - 12 * off, { color: COL.muted }); }
}

/* base B – spring – block – spring – wall (6.C.7 and 6.C.8). All lengths in metres; floor at y = 0.
   B is a plate on two rollers; the block (0.20 m × 0.14 m) rides on two wheels of radius 0.02 m. */
const LAY = { S: 520, bw: 0.20, bh: 0.14, wr: 0.02, L1: 0.30, L2: 0.30, plate: 0.03, ph: 0.20 };
function drawBaseBlockWall(ctx, w, h, st, S, labels){
  const k = LAY.S, sx = v => v * k, sy = v => -v * k;
  fitV(ctx, w, h, [sx(-0.16), sy(0.36), sx(LAY.L1 + LAY.bw + LAY.L2 + 0.06), sy(-0.05)]);
  const y = S.base(st.t) * S.drawScale, x = st.q * S.drawScale;
  st.g = { y, x };
  const xr = LAY.L1 + LAY.bw + LAY.L2;                                  // wall position
  floorAt(ctx, sx(-0.14), sx(xr), sy(0)); wallAt(ctx, sx(xr), sy(0), sy(0.30), 1);
  // base plate B on rollers (its own small rollers on the floor)
  const ft = 0.015, pTop = LAY.ph;                                        // B: an upright plate on a sled that slides on the floor
  ctx.save(); ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
  ctx.fillRect(sx(y - LAY.plate / 2 - 0.04), sy(ft), sx(0.08), sx(ft)); ctx.strokeRect(sx(y - LAY.plate / 2 - 0.04), sy(ft), sx(0.08), sx(ft));
  ctx.fillRect(sx(y - LAY.plate), sy(pTop), sx(LAY.plate), sx(pTop - ft)); ctx.strokeRect(sx(y - LAY.plate), sy(pTop), sx(LAY.plate), sx(pTop - ft)); ctx.restore();
  txt(ctx, 'B', sx(y - LAY.plate / 2), sy(pTop + 0.03));
  // block on wheels
  const bl = LAY.L1 + x, cy = LAY.wr * 2 + LAY.bh / 2, sy0 = cy;
  block(ctx, sx(bl + LAY.bw / 2), sy(cy), sx(LAY.bw), sx(LAY.bh), 0, ''); txt(ctx, 'm', sx(bl + LAY.bw / 2), sy(cy));
  [bl + 0.045, bl + LAY.bw - 0.045].forEach(cx => roller(ctx, sx(cx), sy(LAY.wr), LAY.wr * k, cx / LAY.wr));
  spr(ctx, sx(y), sy(sy0), sx(bl), sy(sy0), labels[0]);
  spr(ctx, sx(bl + LAY.bw), sy(sy0), sx(xr), sy(sy0), labels[1]);
  motionArrow(ctx, sx(-0.10), sy(0.30), 50, S.bname, false); motionArrow(ctx, sx(LAY.L1 + 0.02), sy(0.30), 50, 'x', false);
}

/* ---------- 6.C.7: base excitation, block between two springs ---------- */
forcedClip({
  id: 'x6c-7',
  controls: [
    { key: 'w', label: 'Forcing frequency ω', min: 2, max: 45, step: 0.1, value: 12, unit: 'rad/s', dec: 2 },
    { key: 'y0', label: 'Base amplitude y_0', min: 5, max: 40, step: 1, value: 20, unit: 'mm', dec: 1 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'ω = 12 rad/s (allowed)', apply: () => C.set({ w: 12 }) }, { label: 'ω = 16.33 rad/s (band edge)', apply: () => C.set({ w: 16.33 }) },
    { label: 'ω = 20 rad/s (resonance)', apply: () => C.set({ w: 20 }) }, { label: 'ω = 30 rad/s (allowed)', apply: () => C.set({ w: 30 }) }],
  sys(V){
    const m = 4, k = 800, y0 = V.y0 / 1000;
    const wn = Math.sqrt(2 * k / m), lo = wn * Math.sqrt(2 / 3), hi = wn * Math.sqrt(4 / 3);
    return { M: m, K: 2 * k, P: k * y0, w: V.w, phi0: 0, base: t => y0 * Math.sin(V.w * t), drawScale: 1, qLim: 0.17, unit: 1000, bunit: 1000, bamp: V.y0,
      qlabel: 'x and y (mm)', bname: 'y', ok: y0 > 0 && V.y0 <= 50,
      ratio: (w, c) => k / Math.hypot(2 * k - m * w * w, c * w), rlabel: 'X / y₀', wmax: 45, frTop: 4,
      hl: [{ y: 1.5, color: RED }], bands: [{ x0: 0, x1: lo, color: 'rgba(23,145,90,0.10)' }, { x0: hi, x1: 45, color: 'rgba(23,145,90,0.10)' }], lo, hi };
  },
  stats: (S, st) => [['ω_n = √(2k/m)', fmt(S.wn, 4) + ' rad/s'], ['r = ω/ω_n', fmt(S.r, 3)],
    ['X', S.noSS ? '∞ (resonance)' : fmt(S.X * 1000, 4) + ' mm', true], ['X/y_0', S.noSS ? '∞' : fmt(S.X / (st.V.y0 / 1000), 3), true],
    ['allowed band', 'ω ≤ ' + fmt(S.lo, 4) + ' or ω ≥ ' + fmt(S.hi, 4) + ' rad/s']],
  draw: (ctx, w, h, st, S) => drawBaseBlockWall(ctx, w, h, st, S, ['k', 'k'])
});

/* ---------- 6.C.8: base B, spring k, block, spring 4k, wall ---------- */
forcedClip({
  id: 'x6c-8',
  controls: [
    { key: 'w', label: 'Forcing frequency ω', min: 2, max: 40, step: 0.1, value: 10, unit: 'rad/s', dec: 2 },
    { key: 'b', label: 'Base amplitude b', min: 5, max: 40, step: 1, value: 20, unit: 'mm', dec: 1 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 8, step: 0.1, value: 2, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 20, max: 400, step: 5, value: 100, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Below resonance', apply: () => C.set({ w: 10 }) }, { label: 'Near resonance', apply: () => C.set({ w: Math.sqrt(5 * C.v.k / C.v.m) * 0.97 }) },
    { label: 'Above resonance', apply: () => C.set({ w: Math.sqrt(5 * C.v.k / C.v.m) * 1.6 }) }],
  sys(V){
    const m = V.m, k = V.k, b = V.b / 1000;
    return { M: m, K: 5 * k, P: k * b, w: V.w, phi0: 0, base: t => b * Math.sin(V.w * t), drawScale: 1, qLim: 0.17, unit: 1000, bunit: 1000, bamp: V.b,
      qlabel: 'x and base motion (mm)', bname: 'x_B', ok: m > 0 && k > 0 && b > 0 && V.b <= 50,
      ratio: (w, c) => k / Math.hypot(5 * k - m * w * w, c * w), rlabel: 'X / b', wmax: 40, frTop: 1.2 };
  },
  stats: (S, st) => [['ω_n = √(5k/m)', fmt(S.wn, 4) + ' rad/s'], ['r = ω/ω_n', fmt(S.r, 3)],
    ['X = kb/(5k − mω²)', S.noSS ? '∞ (resonance)' : sgn(st.V.k * st.V.b / (5 * st.V.k - st.V.m * S.w * S.w)) + ' mm', true],
    ['phase', S.noSS ? '—' : (S.r < 1 ? 'in phase with x_B' : 'opposite to x_B')]],
  draw: (ctx, w, h, st, S) => drawBaseBlockWall(ctx, w, h, st, S, ['k', '4k'])
});

/* ---------- 6.C.9: mass on four springs on a vibrating base (vertical) ----------
   Static equilibrium spring length 0.22 m, base plate 0.62 m × 0.04 m on a shaker rod, mass 0.60 m × 0.16 m. */
forcedClip({
  id: 'x6c-9',
  controls: [
    { key: 'w', label: 'Forcing frequency ω', min: 5, max: 80, step: 0.5, value: 50, unit: 'rad/s', dec: 1 },
    { key: 'b', label: 'Base amplitude b', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'mm', dec: 2 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Book: ω = 50 rad/s', apply: () => C.set({ w: 50 }) }, { label: 'Resonance: ω = 24.5 rad/s', apply: () => C.set({ w: 24.49 }) },
    { label: 'Slow: ω = 10 rad/s', apply: () => C.set({ w: 10 }) }],
  sys(V){
    const m = 50, k = 7500, b = V.b / 1000;
    return { M: m, K: 4 * k, P: 4 * k * b, w: V.w, phi0: 0, base: t => b * Math.sin(V.w * t), drawScale: 20, qLim: 0.10, unit: 1000, bunit: 1000, bamp: V.b,
      qlabel: 'x and base motion (mm)', ok: b > 0 && V.b <= 4,
      ratio: (w, c) => 4 * k / Math.hypot(4 * k - m * w * w, c * w), rlabel: 'X / b', wmax: 80, frTop: 5 };
  },
  stats: (S, st) => [['ω_n = √(4k/m)', fmt(S.wn, 4) + ' rad/s'], ['r = ω/ω_n', fmt(S.r, 4)],
    ['X = b/(1 − r²)', S.noSS ? '∞ (resonance)' : sgn(st.V.b / (1 - S.r * S.r)) + ' mm', true], ['|X|', S.noSS ? '∞' : fmt(S.X * 1000, 4) + ' mm', true]],
  draw(ctx, w, h, st, S){
    const k = 400, sx = v => v * k, sy = v => -v * k;
    fitV(ctx, w, h, [sx(-0.42), sy(0.76), sx(0.52), sy(-0.03)]);
    const yb = S.base(st.t) * S.drawScale, x = st.q * S.drawScale;
    st.g = { yb, x };
    const hous = 0.10, plate0 = 0.20, pt = 0.04, L0 = 0.22, mh = 0.16, mw = 0.60;
    floorAt(ctx, sx(-0.40), sx(0.40), sy(0));
    // shaker housing on the floor and the rod that drives the plate
    ctx.save(); ctx.fillStyle = '#c9c3b5'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
    ctx.fillRect(sx(-0.09), sy(hous), sx(0.18), sx(hous)); ctx.strokeRect(sx(-0.09), sy(hous), sx(0.18), sx(hous)); ctx.restore();
    txt(ctx, 'shaker', 0, sy(hous / 2), { font: '12px system-ui', color: COL.muted });
    line(ctx, 0, sy(hous), 0, sy(plate0 + yb), COL.fg, 6);
    const pb = plate0 + yb;                                                   // plate bottom
    ctx.save(); ctx.fillStyle = '#7d776b'; ctx.fillRect(sx(-0.31), sy(pb + pt), sx(0.62), sx(pt)); ctx.restore();
    txt(ctx, 'B', sx(-0.36), sy(pb + pt / 2));
    const mb = pb + pt + L0 + x - yb;                                         // mass bottom = plate top + spring length
    [-0.24, -0.08, 0.08, 0.24].forEach(cx => spr(ctx, sx(cx), sy(pb + pt), sx(cx), sy(mb), '', 7, 7));
    txt(ctx, 'k', sx(0.30), sy((pb + pt + mb) / 2), { color: COL.fg });
    block(ctx, 0, sy(mb + mh / 2), sx(mw), sx(mh), 0, ''); txt(ctx, 'm', 0, sy(mb + mh / 2));
    motionArrow(ctx, sx(0.42), sy(0.58), 50, 'x', true); motionArrow(ctx, sx(0.42), sy(0.20), 50, 'x_B', true);
  }
});

/* ---------- 6.C.10: base B, spring k, cable over a fixed pulley to a movable pulley carrying m, spring k to ground ----------
   Fixed pulley: centre P1 = (0, 0.62), radius 0.06, on a strut from the wall. Movable pulley radius 0.03 hangs below it.
   The dead end of the cable is tied to the becket (eye) under the fixed pulley's yoke. x is positive downward. */
forcedClip({
  id: 'x6c-10',
  controls: [
    { key: 'w', label: 'Forcing frequency ω', min: 2, max: 30, step: 0.1, value: 8, unit: 'rad/s', dec: 2 },
    { key: 'b', label: 'Base amplitude b', min: 5, max: 40, step: 1, value: 20, unit: 'mm', dec: 1 },
    { key: 'm', label: 'Mass m', min: 1, max: 10, step: 0.1, value: 5, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 50, max: 500, step: 5, value: 200, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Below resonance', apply: () => C.set({ w: 8 }) }, { label: 'At resonance', apply: () => C.set({ w: Math.sqrt(5 * C.v.k / C.v.m) }) },
    { label: 'Above resonance', apply: () => C.set({ w: Math.sqrt(5 * C.v.k / C.v.m) * 1.5 }) }],
  speed: 0.5,
  sys(V){
    const m = V.m, k = V.k, b = V.b / 1000;
    return { M: m, K: 5 * k, P: 2 * k * b, w: V.w, phi0: Math.PI / 2, base: t => b * Math.cos(V.w * t), drawScale: 1, qLim: 0.06, unit: 1000, bunit: 1000, bamp: V.b,
      qlabel: 'x and base motion (mm)', ok: m > 0 && k > 0 && b > 0 && V.b <= 40,
      ratio: (w, c) => 2 * k / Math.hypot(5 * k - m * w * w, c * w), rlabel: 'X / b', wmax: 30, frTop: 2 };
  },
  stats: (S, st) => [['resonant frequency √(5k/m)', fmt(S.wn, 4) + ' rad/s', true], ['r = ω/ω_n', fmt(S.r, 3)],
    ['X = 2kb/(5k − mω²)', S.noSS ? '∞ (resonance)' : sgn(2 * st.V.k * st.V.b / (5 * st.V.k - st.V.m * S.w * S.w)) + ' mm', true],
    ['spring end moves', '2x (two cable strands)']],
  draw(ctx, w, h, st, S){
    const k = 480, sx = v => v * k, sy = v => -v * k;
    fitV(ctx, w, h, [sx(-0.50), sy(0.80), sx(0.26), sy(-0.03)]);
    const xB = S.base(st.t), x = st.q;
    const P1 = [0, 0.62], R1 = 0.06, r2 = 0.03, c2x = R1 - r2, eyeY = P1[1] - R1 - 0.025;
    const y2 = 0.40 - x;                                 // movable pulley centre (x down)
    const Ex = -0.16 + 2 * x;                            // spring end on the cable (moves 2x toward the pulley)
    st.g = { xB, x, Ex, y2 };
    // wall at the left, strut to the fixed pulley, ledge for the base B
    wallAt(ctx, sx(-0.48), sy(0.30), sy(0.78), 1);
    line(ctx, sx(-0.48), sy(0.50), sx(P1[0]), sy(P1[1]), '#7d776b', 5);
    // ledge with B on rollers; B's centre is level with the top of the fixed pulley, so spring and cable are horizontal
    const yC = P1[1] + R1, sb = yC, br = 0.008, ledge = yC - 0.03 - 2 * br;
    line(ctx, sx(-0.48), sy(ledge), sx(-0.30), sy(ledge), COL.fg, 3);
    const bx = -0.40 + xB;
    roller(ctx, sx(bx - 0.012), sy(ledge + br), br * k, bx / br); roller(ctx, sx(bx + 0.012), sy(ledge + br), br * k, bx / br);
    block(ctx, sx(bx), sy(sb), sx(0.05), sx(0.06), 0, '', '#9aa0a8'); txt(ctx, 'B', sx(bx), sy(sb));
    // spring from B to the cable end E, cable from E to the top of the fixed pulley
    spr(ctx, sx(bx + 0.025), sy(sb), sx(Ex), sy(sb), 'k', 8, 6);
    cable(ctx, () => { ctx.moveTo(sx(Ex), sy(yC)); ctx.lineTo(sx(P1[0]), sy(yC)); });
    // fixed pulley with its yoke and the becket eye below it
    pulley(ctx, sx(P1[0]), sy(P1[1]), R1 * k);
    ctx.save(); ctx.strokeStyle = '#7d776b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx(P1[0]), sy(eyeY), 4, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, sx(P1[0]), sy(P1[1]), sx(P1[0]), sy(eyeY + 0.006), '#7d776b', 2);
    // cable down the right side, around the movable pulley, up to the eye
    cable(ctx, () => { ctx.arc(sx(P1[0]), sy(P1[1]), R1 * k, -Math.PI / 2, 0); ctx.lineTo(sx(P1[0] + R1), sy(y2)); ctx.arc(sx(c2x), sy(y2), r2 * k, 0, Math.PI); ctx.lineTo(sx(c2x - r2), sy(eyeY - 0.006)); });
    pulley(ctx, sx(c2x), sy(y2), r2 * k);
    // mass hangs from the movable pulley; spring k from the mass to the floor
    const mTop = y2 - r2 - 0.03, mh = 0.08;
    line(ctx, sx(c2x), sy(y2), sx(c2x), sy(mTop), COL.fg, 2.4);
    block(ctx, sx(c2x), sy(mTop - mh / 2), sx(0.08), sx(mh), 0, ''); txt(ctx, 'm', sx(c2x), sy(mTop - mh / 2));
    floorAt(ctx, sx(-0.10), sx(0.16), sy(0));
    spr(ctx, sx(c2x), sy(mTop - mh), sx(c2x), sy(0), 'k', 8, 7);
    motionArrow(ctx, sx(0.17), sy(0.40), -40, 'x', true); motionArrow(ctx, sx(-0.44), sy(0.74), 40, 'x_B', false);
    txt(ctx, 'E', sx(Ex), sy(sb + 0.03), { color: COL.muted });
  }
});

/* ---------- 6.C.11: bar pinned at O in a horizontal plane, spring at A to a moving base B (top view) ---------- */
forcedClip({
  id: 'x6c-11',
  controls: [
    { key: 'w', label: 'Forcing frequency ω', min: 2, max: 35, step: 0.1, value: 10, unit: 'rad/s', dec: 2 },
    { key: 'y0', label: 'Base amplitude y_0', min: 5, max: 50, step: 1, value: 30, unit: 'mm', dec: 1 },
    { key: 'm', label: 'Bar mass m', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 20, max: 400, step: 5, value: 150, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Below resonance', apply: () => C.set({ w: 10 }) }, { label: 'At resonance', apply: () => C.set({ w: Math.sqrt(3 * C.v.k / C.v.m) }) },
    { label: 'Above resonance', apply: () => C.set({ w: Math.sqrt(3 * C.v.k / C.v.m) * 1.5 }) }],
  speed: 0.5,
  sys(V){
    const m = V.m, k = V.k, L = 1, y0 = V.y0 / 1000, I = m * L * L / 3;
    return { M: I, K: k * L * L, P: k * L * y0, w: V.w, phi0: 0, base: t => y0 * Math.sin(V.w * t), drawScale: 1, qLim: 0.16, unit: 1 / RAD, bunit: 1 / (L * RAD), bamp: y0 / L / RAD,
      qlabel: 'θ and y/L (degrees)', ok: m > 0 && k > 0 && y0 > 0 && V.y0 <= 60, L,
      ratio: (w, c) => k * L * L / Math.hypot(k * L * L - I * w * w, c * w), rlabel: 'LΘ / y₀', wmax: 35, frTop: 4 };
  },
  stats: (S, st) => [['ω_n = √(3k/m)', fmt(S.wn, 4) + ' rad/s'], ['r = ω/ω_n', fmt(S.r, 3)],
    ['Θ', S.noSS ? '∞ (resonance)' : fmt(S.X / RAD, 4) + '°', true], ['amplitude of A, LΘ', S.noSS ? '∞' : fmt(S.X * 1000, 4) + ' mm', true]],
  draw(ctx, w, h, st, S){
    const k = 430, sx = v => v * k, sy = v => -v * k, L = S.L;
    fitV(ctx, w, h, [sx(-0.16), sy(0.30), sx(1.22), sy(-0.50)]);
    const th = st.q, yb = S.base(st.t), A = [L * Math.cos(th), L * Math.sin(th)];
    st.g = { th, yb };
    // wall with the pin bracket at O (top view)
    wallAt(ctx, sx(-0.06), sy(0.22), sy(-0.22), -1);
    ctx.save(); ctx.fillStyle = '#c9c3b5'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(sx(-0.06), sy(0.05)); ctx.lineTo(sx(0.0), sy(0.03)); ctx.lineTo(sx(0.0), sy(-0.03)); ctx.lineTo(sx(-0.06), sy(-0.05)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    // bar (width 0.04 m) from O to A
    ctx.save(); ctx.translate(0, 0); ctx.rotate(-th); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(0, -sx(0.02), sx(L), sx(0.04)); ctx.fill(); ctx.stroke(); ctx.restore();
    pinDot(ctx, 0, 0); txt(ctx, 'O', sx(-0.02), sy(-0.08));
    line(ctx, 0, 0, sx(0.5), 0, COL.muted, 1, [5, 4]);
    // base B on a guide rail below A; spring from B to A
    const yB0 = -0.36;
    line(ctx, sx(L), sy(-0.20), sx(L), sy(-0.50), COL.muted, 1, [3, 3]);
    ctx.save(); ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
    ctx.fillRect(sx(L - 0.07), sy(yB0 + yb), sx(0.14), sx(0.03)); ctx.strokeRect(sx(L - 0.07), sy(yB0 + yb), sx(0.14), sx(0.03)); ctx.restore();
    txt(ctx, 'B', sx(L - 0.11), sy(yB0 + yb - 0.015));
    spr(ctx, sx(A[0]), sy(A[1] - 0.02), sx(L), sy(yB0 + yb), 'k', 9, 7);
    pinDot(ctx, sx(A[0]), sy(A[1])); txt(ctx, 'A', sx(A[0] + 0.05), sy(A[1] + 0.04));
    txt(ctx, 'θ', sx(0.26), sy(0.05), { color: COL.fg });
    txt(ctx, 'top view (horizontal plane)', sx(0.5), sy(-0.46), { font: '12px system-ui', color: COL.muted });
    motionArrow(ctx, sx(L + 0.12), sy(-0.42), 40, 'y', true);
  }
});

/* ---------- 6.C.12: frame M with a rotating imbalance m, springs k and 2k, rollers between rails ---------- */
forcedClip({
  id: 'x6c-12',
  controls: [
    { key: 'w', label: 'Rotor speed ω', min: 5, max: 90, step: 0.5, value: 40, unit: 'rad/s', dec: 1 },
    { key: 'e', label: 'Eccentricity e', min: 5, max: 30, step: 1, value: 20, unit: 'mm', dec: 1 },
    { key: 'z', label: 'Added damping ζ', min: 0, max: 0.2, step: 0.005, value: 0, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Book: ω = 40 rad/s', apply: () => C.set({ w: 40 }) }, { label: 'Resonance: ω = 30 rad/s', apply: () => C.set({ w: 30 }) },
    { label: 'Slow: ω = 15 rad/s', apply: () => C.set({ w: 15 }) }, { label: 'Fast: ω = 80 rad/s', apply: () => C.set({ w: 80 }) }],
  sys(V){
    const m = 0.1, M = 4.9, k = 1500, e = V.e / 1000;
    return { M: M + m, K: 3 * k, P: m * e * V.w * V.w, w: V.w, phi0: Math.PI / 2, base: null, drawScale: 10, qLim: 0.10, unit: 1000, bunit: 1000, bamp: 0,
      qlabel: 'x (mm)', ok: e > 0 && V.e <= 30, e,
      ratio: (w, c) => (M + m) * w * w / Math.hypot(3 * k - (M + m) * w * w, c * w), rlabel: 'X(M + m)/(me)', wmax: 90, frTop: 4 };
  },
  stats: (S, st) => [['ω_n = √(3k/(M + m))', fmt(S.wn, 4) + ' rad/s'], ['r = ω/ω_n', fmt(S.r, 4)],
    ['F_0 = meω²', fmt(S.P, 4) + ' N'], ['X', S.noSS ? '∞ (resonance)' : fmt(S.X * 1000, 4) + ' mm', true]],
  draw(ctx, w, h, st, S){
    const k = 900, sx = v => v * k, sy = v => -v * k;
    fitV(ctx, w, h, [sx(-0.40), sy(0.15), sx(0.40), sy(-0.15)]);
    const x = st.q * S.drawScale, ang = S.w * st.t, e = S.e, bw = 0.20, bh = 0.16, rr = 0.010;
    st.g = { x, ang };
    const railY = bh / 2 + 2 * rr;
    // walls and rails
    wallAt(ctx, sx(-0.38), sy(0.12), sy(-0.12), -1); wallAt(ctx, sx(0.38), sy(-0.12), sy(0.12), 1);
    line(ctx, sx(-0.22), sy(railY), sx(0.22), sy(railY), COL.fg, 2); hatch(ctx, sx(-0.22), sy(railY), sx(0.22), sy(railY), -1, 9, 6);
    line(ctx, sx(-0.22), sy(-railY), sx(0.22), sy(-railY), COL.fg, 2); hatch(ctx, sx(0.22), sy(-railY), sx(-0.22), sy(-railY), -1, 9, 6);
    // frame and its four rollers (rolling on the rails)
    block(ctx, sx(x), 0, sx(bw), sx(bh), 0, '', COL.mass);
    txt(ctx, 'M', sx(x - 0.06), sy(-0.05));
    [-0.06, 0.06].forEach(dx => { roller(ctx, sx(x + dx), sy(bh / 2 + rr), rr * k, -(x + dx) / rr); roller(ctx, sx(x + dx), sy(-bh / 2 - rr), rr * k, (x + dx) / rr); });
    spr(ctx, sx(-0.38), 0, sx(x - bw / 2), 0, 'k', 9, 6); spr(ctx, sx(x + bw / 2), 0, sx(0.38), 0, '2k', 9, 6);
    // rotor: pedestal O fixed in the frame, arm e, particle m at P
    const O = [x, -0.01], P = [O[0] + e * Math.cos(ang), O[1] + e * Math.sin(ang)];
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.beginPath();
    ctx.moveTo(sx(O[0] - 0.014), sy(O[1] - 0.024)); ctx.lineTo(sx(O[0] + 0.014), sy(O[1] - 0.024)); ctx.lineTo(sx(O[0] + 0.004), sy(O[1])); ctx.lineTo(sx(O[0] - 0.004), sy(O[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, sx(O[0]), sy(O[1]), sx(P[0]), sy(P[1]), COL.fg, 3);
    pinDot(ctx, sx(O[0]), sy(O[1]));
    ctx.save(); ctx.fillStyle = '#5b5a55'; ctx.beginPath(); ctx.arc(sx(P[0]), sy(P[1]), 0.008 * k, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'O', sx(O[0] - 0.035), sy(O[1] - 0.012)); txt(ctx, 'm', sx(P[0] + 0.022 * Math.cos(ang)), sy(P[1] + 0.022 * Math.sin(ang)));
    motionArrow(ctx, sx(-0.33), sy(-0.075), 40, 'x', false);
  }
});

subLabels();
})();
