/* =========================================================
   Chapter 3, 3D moving reference frames: examples 3.B.1 to 3.B.6
   Each clip draws the mechanism in an oblique 3D projection, with the fixed XYZ axes,
   the moving xyz axes of the observer, and the vectors ω (purple) and α (red).
   The plot under each picture shows the fixed-axis components of ω (or of a_P) over the motion.
   Tangent lines at the current instant show that α is the time derivative of ω.
   The live state st.G is read by the 3D views in ch3-3dB1.js.
   ========================================================= */
(function(){

/* ---------- small vector helpers ---------- */
const A3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], S3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const M3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k], D3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const X3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const N3 = a => Math.hypot(a[0], a[1], a[2]), U3 = a => { const n = N3(a) || 1; return M3(a, 1 / n); };
const L3 = (...terms) => terms.reduce((s, [k, v]) => A3(s, M3(v, k)), [0, 0, 0]);   // linear combination
const I3 = [1, 0, 0], J3 = [0, 1, 0], K3 = [0, 0, 1];
const eY = p => [Math.cos(p), 0, -Math.sin(p)];   // body direction that starts along X, turned by p about +Y
const kY = p => [Math.sin(p), 0, Math.cos(p)];    // body direction that starts along Z, turned by p about +Y
const W_COL = '#8a3fd1', AL_COL = '#b42346', V_COL = '#2457d6', A_COL = '#17915a', FR_COL = '#3a3d44';
const f3 = (v, d = 3, u = ['Î', 'Ĵ', 'K̂']) => {
  const parts = []; v.forEach((c, i) => { if (Math.abs(c) < 5e-4 * Math.max(1, N3(v))) return; const s = fmt(Math.abs(c), d);
    parts.push((parts.length ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + s + ' ' + u[i]); });
  return parts.length ? parts.join('') : '0';
};
const fx = (v, d) => f3(v, d, ['î', 'ĵ', 'k̂']);
const comps = (v, fr) => [D3(v, fr.i), D3(v, fr.j), D3(v, fr.k)];

/* ---------- oblique projection fitted to a design box ---------- */
function projector(bounds, W0, H0, az, el, mx = 46, my = 34){
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  const u = p => [p[0] * ca - p[2] * sa, -(-p[0] * sa * se + p[1] * ce - p[2] * ca * se)];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  bounds.forEach(p => { const q = u(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  const s = Math.min((W0 - 2 * mx) / (x1 - x0 || 1), (H0 - 2 * my) / (y1 - y0 || 1));
  const ox = W0 / 2 - s * (x0 + x1) / 2, oy = H0 / 2 - s * (y0 + y1) / 2;
  const P = p => { const q = u(p); return [ox + s * q[0], oy + s * q[1]]; };
  P.s = s; return P;
}
// drawing primitives in world coordinates
const seg = (ctx, P, a, b, col = COL.fg, w = 2, dash) => { const [x1, y1] = P(a), [x2, y2] = P(b); line(ctx, x1, y1, x2, y2, col, w, dash); };
function vec(ctx, P, o, v, col, label, w = 3, off = 11){
  const [x1, y1] = P(o), [x2, y2] = P(A3(o, v)); if (Math.hypot(x2 - x1, y2 - y1) < 4) return;
  arrow(ctx, x1, y1, x2, y2, col, w);
  if (label){ const L = Math.hypot(x2 - x1, y2 - y1); txt(ctx, label, x2 + off * (x2 - x1) / L, y2 + off * (y2 - y1) / L, { color: col, font: 'italic 14px Georgia, serif' }); }
}
function poly(ctx, P, pts, fill, col = COL.fg, w = 1.5, close = true){
  ctx.save(); ctx.beginPath(); pts.forEach((p, i) => { const q = P(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
  if (close) ctx.closePath(); if (fill){ ctx.fillStyle = fill; ctx.fill(); } if (col){ ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke(); } ctx.restore();
}
const circle3 = (c, a, b, r, n = 48, u0 = 0, u1 = 2 * Math.PI) => { const pts = []; for (let k = 0; k <= n; k++){ const u = u0 + (u1 - u0) * k / n; pts.push(L3([1, c], [r * Math.cos(u), a], [r * Math.sin(u), b])); } return pts; };
function basisFor(n){ const t = Math.abs(n[1]) < 0.9 ? J3 : I3; const a = U3(X3(t, n)); return [a, X3(n, a)]; }   // a × b = n
function disk(ctx, P, c, n, r, fill = 'rgba(233,217,168,.75)', col = '#8a6a12'){ const [a, b] = basisFor(n); poly(ctx, P, circle3(c, a, b, r), fill, col, 1.8); }
// curved arrow around an axis (right-hand sense when sense > 0)
function curl(ctx, P, c, axis, r, sense, col, label){
  const [a, b] = basisFor(U3(axis)); const pts = circle3(c, a, b, r, 40, sense > 0 ? 0.35 : 5.9, sense > 0 ? 5.9 : 0.35);
  poly(ctx, P, pts, null, col, 2, false);
  const q1 = P(pts[pts.length - 3]), q2 = P(pts[pts.length - 1]); arrow(ctx, q1[0], q1[1], q2[0], q2[1], col, 2);
  if (label){ const q = P(A3(c, M3(a, r * 1.35))); txt(ctx, label, q[0], q[1], { color: col, font: 'italic 14px Georgia, serif' }); }
}
function dot(ctx, P, p, label, col = COL.fg, r = 3.5, dx = 10, dy = -10){ const [x, y] = P(p); ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); if (label) txt(ctx, label, x + dx, y + dy, { font: 'italic 14px Georgia, serif', color: col }); }
function triad(ctx, P, o, fr, len, col, names){
  const Ls = Array.isArray(len) ? len : [len, len, len];
  [fr.i, fr.j, fr.k].forEach((d, n) => { if (!d) return; vec(ctx, P, o, M3(d, Ls[n]), col, names[n], 1.6, 16); });
}
// a box given by a centre and three half-edge vectors
function box3(ctx, P, c, u, v, w, fill, col = COL.fg){
  const V = (a, b, d) => L3([1, c], [a, u], [b, v], [d, w]);
  const faces = [[V(-1, -1, 1), V(1, -1, 1), V(1, 1, 1), V(-1, 1, 1)], [V(-1, 1, -1), V(1, 1, -1), V(1, 1, 1), V(-1, 1, 1)], [V(1, -1, -1), V(1, 1, -1), V(1, 1, 1), V(1, -1, 1)],
    [V(-1, -1, -1), V(-1, 1, -1), V(-1, 1, 1), V(-1, -1, 1)], [V(-1, -1, -1), V(1, -1, -1), V(1, -1, 1), V(-1, -1, 1)], [V(-1, -1, -1), V(1, -1, -1), V(1, 1, -1), V(-1, 1, -1)]];
  faces.forEach(f => poly(ctx, P, f, fill, col, 1.1));
}
function ground(ctx, P, y, x0, x1, z0, z1){ poly(ctx, P, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], 'rgba(200,195,180,.35)', COL.axis, 1); }

/* ---------- generic clip for one moving-frame problem ----------
   cfg: id, controls, speed, W0, H0, az, el, range(V) -> [t0, t1], geom(V, t) -> G (G.fr = moving frame {o,i,j,k}, G.w, G.al),
        bounds(V) -> points to frame the view, scene(ctx, P, G, V), wScale, alScale, triad, plot(V, G, t0, t1) -> plot options, stats(V, G) */
function frameClip(cfg){
  makeClip({
    id: cfg.id, speed: cfg.speed ?? 0.25, controls: cfg.controls,
    presets: (C, st, reset) => [['▶ Play the motion', false], ['Freeze at the instant in the problem', true]].map(([label, v]) => ({ label, apply: () => { st.freeze = v; reset(); } })),
    setup(st){ st.freeze = !!cfg.startFrozen; },
    reset(st){ document.querySelectorAll(`#${cfg.id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', (i === 1) === st.freeze)); st._lastStat = undefined; },
    draw(st){
      const V = st.V, [t0, t1] = cfg.range(V), span = t1 - t0;
      const tt = st.freeze ? 0 : t0 + ((st.t + (cfg.phase ?? 0.5) * span) % span + span) % span;
      const G = cfg.geom(V, tt); G.t = tt; G.t0 = t0; G.t1 = t1; G.frozen = st.freeze; st.G = G; st.tt = tt;
      const cv = $(cfg.id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, cfg.W0, cfg.H0]);
      const P = projector(cfg.bounds(V), cfg.W0, cfg.H0, cfg.az ?? 0.5, cfg.el ?? 0.32);
      cfg.scene(ctx, P, G, V, st);
      if (G.fr && cfg.triad) triad(ctx, P, G.fr.o, G.fr, cfg.triad, FR_COL, ['x', 'y', 'z']);
      if (G.wAt && cfg.wScale) vec(ctx, P, G.wAt, M3(G.w, cfg.wScale), W_COL, 'ω', 3.2);
      if (G.wAt && cfg.alScale) vec(ctx, P, G.wAt, M3(G.al, cfg.alScale), AL_COL, 'α', 3.2);
      txt(ctx, st.freeze ? 'the instant in the problem' : `t = ${fmt(tt, 3)} s`, cfg.W0 - 12, 18, { font: '12px system-ui', color: COL.muted, align: 'right' });
      const po = cfg.plot(V, G, t0, t1); if (po) plot($(cfg.id + '-plot'), po);
      statsEvery(st, cfg.id + '-stats', () => cfg.stats(V, G));
    }
  });
}
// plot of the fixed-axis components of a vector function over the motion, with tangent lines at the current time
function compPlot(fn, dfn, G, t0, t1, ylabel, names){
  const cols = [COL.c1, COL.c2, COL.c3], N = 160, series = [], points = [];
  const pts = [[], [], []];
  for (let k = 0; k <= N; k++){ const t = t0 + (t1 - t0) * k / N, v = fn(t); for (let c = 0; c < 3; c++) pts[c].push([t, v[c]]); }
  const all = pts.flat().map(p => p[1]); let lo = Math.min(0, ...all), hi = Math.max(0, ...all); const pad = 0.12 * (hi - lo || 1); lo -= pad; hi += pad;
  const v0 = fn(G.t), d0 = dfn ? dfn(G.t) : null, hw = 0.1 * (t1 - t0);
  for (let c = 0; c < 3; c++){
    series.push({ pts: pts[c], color: cols[c], width: 2.2 });
    points.push({ x: G.t, y: v0[c], color: cols[c], r: 4.5 });
    if (d0) series.push({ pts: [[G.t - hw, v0[c] - d0[c] * hw], [G.t + hw, v0[c] + d0[c] * hw]], color: cols[c], width: 1.4, dash: [5, 4], guide: true });
  }
  return { xmin: t0, xmax: t1, ymin: lo, ymax: hi, xlabel: 'time t (s), with t = 0 at the instant in the problem', ylabel, series, points, vlines: [{ x: 0, color: COL.muted }] };
}

/* =================================================================== 3.B.1  bar BC pinned to a rotating arm AB */
{
  const R = 0.5, L = 0.9;
  const rng = V => { const T = Math.abs(V.td) > 0.05 ? (Math.PI / 2) / Math.abs(V.td) : (Math.abs(V.Om) > 0.05 ? Math.PI / Math.abs(V.Om) : 1); return [-T, T]; };
  const omega = (V, t) => A3(M3(J3, V.Om), M3(kY(V.Om * t), V.td));
  const alpha = (V, t) => M3(eY(V.Om * t), V.Om * V.td);
  frameClip({
    id: 'x3b-1', W0: 440, H0: 400, az: 0.55, el: 0.3, speed: 0.25, triad: [1.1, 0.32, 0.32], wScale: 0.06, alScale: 0.02,
    controls: [{ key: 'Om', label: 'Rate of arm AB, Ω', min: -8, max: 8, step: 0.5, value: 5, unit: 'rad/s', dec: 2 },
               { key: 'td', label: 'Rate of the angle, θ̇', min: -8, max: 8, step: 0.5, value: 4, unit: 'rad/s', dec: 2 }],
    range: rng,
    geom(V, t){
      const ps = V.Om * t, th = Math.PI / 2 + V.td * t, e = eY(ps), k = kY(ps), B = M3(e, R), i = L3([Math.cos(th), e], [Math.sin(th), J3]);
      const fr = { o: B, i, j: L3([-Math.sin(th), e], [Math.cos(th), J3]), k };
      return { ps, th, e, k, B, C: A3(B, M3(i, L)), fr, w: omega(V, t), al: alpha(V, t), wAt: B };
    },
    bounds: () => [[-0.4, -0.45, -0.5], [1.4, 1.3, 0.5], [-1.4, 1.3, -0.5], [0.4, -0.45, 1.4], [-0.4, -0.45, 1.4], [0.4, 1.3, -1.4]],
    scene(ctx, P, G, V){
      ground(ctx, P, -0.45, -0.5, 0.5, -0.5, 0.5);
      seg(ctx, P, [0, -0.45, 0], [0, 1.0, 0], '#7b808c', 5);                                  // fixed vertical shaft
      [[0, -0.35, 0], [0, 0.88, 0]].forEach(c => box3(ctx, P, c, [0.09, 0, 0], [0, 0.06, 0], [0, 0, 0.09], '#cfcabd'));   // bearings
      seg(ctx, P, [0, 1.0, 0], [0, 1.22, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...P([0, 1.29, 0]), { color: COL.muted });
      curl(ctx, P, [0, 0.6, 0], J3, 0.16, Math.sign(V.Om) || 1, W_COL, 'Ω');
      seg(ctx, P, [0, 0, 0], G.B, '#8a6a12', 6); seg(ctx, P, [0, 0, 0], G.B, '#e9d9a8', 3);  // arm AB
      seg(ctx, P, G.B, G.C, '#8a6a12', 7); seg(ctx, P, G.B, G.C, '#d9c58c', 4);              // bar BC
      // the angle θ, measured in the plane of the arm from the arm's direction
      const arc = []; for (let k = 0; k <= 24; k++){ const a = G.th * k / 24; arc.push(L3([1, G.B], [0.2 * Math.cos(a), G.e], [0.2 * Math.sin(a), J3])); }
      seg(ctx, P, G.B, A3(G.B, M3(G.e, 0.32)), COL.muted, 1, [4, 4]); poly(ctx, P, arc, null, COL.muted, 1.2, false);
      const q = P(L3([1, G.B], [0.3 * Math.cos(G.th / 2), G.e], [0.3 * Math.sin(G.th / 2), J3])); txt(ctx, 'θ', q[0], q[1], { color: COL.muted, font: 'italic 14px Georgia, serif' });
      dot(ctx, P, [0, 0, 0], 'A'); dot(ctx, P, G.B, 'B'); dot(ctx, P, G.C, 'C');
    },
    plot: (V, G, t0, t1) => compPlot(t => omega(V, t), t => alpha(V, t), G, t0, t1, 'ω components in XYZ (rad/s)'),
    stats: (V, G) => [['θ', fmt(G.th / RAD, 3) + '°'], ['ω = Ω Ĵ + θ̇ k̂', f3(G.w) + ' rad/s'], ['α = Ω θ̇ (Ĵ × k̂)', f3(G.al) + ' rad/s²', true],
      ['ω in xyz (on BC)', fx(comps(G.w, G.fr)) + ' rad/s'], ['α in xyz (on BC)', fx(comps(G.al, G.fr)) + ' rad/s²']]
  });
}

/* =================================================================== 3.B.2  radar antenna */
{
  const TH0 = Math.atan2(3, 4);
  const rng = V => [(5 * RAD - TH0) / V.td, (80 * RAD - TH0) / V.td];
  const omega = (V, t) => A3(M3(J3, V.Om), M3(kY(V.Om * t), V.td));
  const alpha = (V, t) => M3(eY(V.Om * t), V.Om * V.td);
  frameClip({
    id: 'x3b-2', W0: 460, H0: 420, az: 0.6, el: 0.28, speed: 1, triad: [1.15, 1.1, 0.55], wScale: 1.5, alScale: 6, phase: (TH0 - 5 * RAD) / (75 * RAD),
    controls: [{ key: 'Om', label: 'Rate about the vertical axis, Ω', min: -1, max: 1, step: 0.05, value: 0.2, unit: 'rad/s', dec: 2 },
               { key: 'td', label: 'Elevation rate, θ̇', min: 0.1, max: 1.5, step: 0.05, value: 0.5, unit: 'rad/s', dec: 2 }],
    range: rng,
    geom(V, t){
      const ps = V.Om * t, th = TH0 + V.td * t, e = eY(ps), k = kY(ps), i = L3([Math.cos(th), e], [Math.sin(th), J3]);
      const fr = { o: [0, 0, 0], i, j: L3([-Math.sin(th), e], [Math.cos(th), J3]), k };
      return { ps, th, e, k, fr, w: omega(V, t), al: alpha(V, t), wAt: [0, 0, 0], P: M3(i, 1.6) };
    },
    bounds: () => [[-1.1, -1.4, -1.2], [1.9, 1.9, 1.2], [-1.1, 1.9, -1.2], [1.9, -1.4, 1.2], [0, 2.1, 0]],
    scene(ctx, P, G, V){
      ground(ctx, P, -1.4, -1.0, 1.0, -1.0, 1.0);
      box3(ctx, P, [0, -1.25, 0], [0.3, 0, 0], [0, 0.15, 0], [0, 0, 0.3], '#cfcabd');      // base on the ground
      seg(ctx, P, [0, -1.1, 0], [0, -0.1, 0], '#7b808c', 7);                                  // pedestal
      seg(ctx, P, [0, -0.1, 0], [0, 1.9, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...P([0, 2.0, 0]), { color: COL.muted });
      curl(ctx, P, [0, -0.55, 0], J3, 0.2, Math.sign(V.Om) || 1, W_COL, 'Ω');
      // yoke turning with the antenna, and the dish on the elevation pin O
      seg(ctx, P, [0, -0.1, 0], A3([0, -0.1, 0], M3(G.k, 0.25)), '#7b808c', 4); seg(ctx, P, A3([0, -0.1, 0], M3(G.k, 0.25)), M3(G.k, 0.25), '#7b808c', 4);
      seg(ctx, P, M3(G.k, -0.25), M3(G.k, 0.25), FR_COL, 3);                                   // elevation pin along k
      const c = M3(G.fr.i, 0.45); disk(ctx, P, c, G.fr.i, 0.95, 'rgba(160,160,170,.2)', '#55585f');
      const [a, b] = basisFor(G.fr.i); [0, 1, 2, 3].forEach(n => { const u = n * Math.PI / 2 + 0.4; seg(ctx, P, L3([1, c], [0.95 * Math.cos(u), a], [0.95 * Math.sin(u), b]), G.P, '#55585f', 1.2); });
      seg(ctx, P, [0, 0, 0], c, FR_COL, 3);
      dot(ctx, P, [0, 0, 0], 'O'); dot(ctx, P, G.P, 'P');
      const arc = []; for (let n = 0; n <= 20; n++){ const u = G.th * n / 20; arc.push(L3([0.75 * Math.cos(u), G.e], [0.75 * Math.sin(u), J3])); }
      seg(ctx, P, [0, 0, 0], M3(G.e, 1.0), COL.muted, 1, [4, 4]); poly(ctx, P, arc, null, COL.muted, 1.2, false);
      const q = P(L3([0.86 * Math.cos(G.th / 2), G.e], [0.86 * Math.sin(G.th / 2), J3])); txt(ctx, 'θ', q[0], q[1], { color: COL.muted, font: 'italic 14px Georgia, serif' });
    },
    plot: (V, G, t0, t1) => compPlot(t => omega(V, t), t => alpha(V, t), G, t0, t1, 'ω components in XYZ (rad/s)'),
    stats: (V, G) => [['θ', fmt(G.th / RAD, 4) + '°'], ['ω = Ω Ĵ + θ̇ k̂', f3(G.w, 4) + ' rad/s'], ['α = Ω θ̇ (Ĵ × k̂)', f3(G.al, 4) + ' rad/s²', true],
      ['ω in xyz (on the dish)', fx(comps(G.w, G.fr), 4) + ' rad/s'], ['α in xyz (on the dish)', fx(comps(G.al, G.fr), 4) + ' rad/s²']]
  });
}

/* =================================================================== 3.B.3  disk spinning on a rotating arm */
{
  const L = 0.6, Hc = 0.45, r = 0.25;
  const rng = V => { const T = Math.abs(V.w2) > 0.05 ? Math.PI / Math.abs(V.w2) : 0.5; return [-T, T]; };
  const omega = (V, t) => A3(M3(J3, V.w2), M3(kY(V.w2 * t), -V.w1));
  const alpha = (V, t) => M3(eY(V.w2 * t), -V.w1 * V.w2);
  const geom = (V, t) => {
    const ps = V.w2 * t, e = eY(ps), k = kY(ps), C = L3([L, e], [Hc, J3]), ph = -V.w1 * t;
    const i = L3([Math.cos(ph), e], [Math.sin(ph), J3]), j = L3([-Math.sin(ph), e], [Math.cos(ph), J3]);
    return { ps, ph, e, k, C, Pp: A3(C, M3(i, -r)), fr: { o: C, i, j, k }, w: omega(V, t), al: alpha(V, t), wAt: C };
  };
  frameClip({
    id: 'x3b-3', W0: 460, H0: 400, az: 0.55, el: 0.3, speed: 0.1, triad: 0.36, wScale: 0.02, alScale: 0.004,
    controls: [{ key: 'w1', label: 'Spin of the disk relative to the arm, ω_1 (clockwise)', min: 0, max: 30, step: 1, value: 20, unit: 'rad/s', dec: 1 },
               { key: 'w2', label: 'Rate of arm OC, ω_2', min: -8, max: 8, step: 0.5, value: 5, unit: 'rad/s', dec: 2 }],
    range: rng, geom,
    bounds: () => [[-0.75, -0.6, -0.75], [0.75, 0.95, 0.75], [-0.75, 0.95, -0.75], [0.75, -0.6, 0.75], [-0.75, 0.95, 0.75], [0.75, -0.6, -0.75]],
    scene(ctx, P, G, V){
      ground(ctx, P, -0.6, -0.5, 0.5, -0.5, 0.5);
      box3(ctx, P, [0, -0.52, 0], [0.12, 0, 0], [0, 0.08, 0], [0, 0, 0.12], '#cfcabd');
      seg(ctx, P, [0, -0.45, 0], [0, 0.15, 0], '#7b808c', 5); box3(ctx, P, [0, 0, 0], [0.06, 0, 0], [0, 0.07, 0], [0, 0, 0.06], '#cfcabd');
      seg(ctx, P, [0, 0.15, 0], [0, 0.9, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...P([0, 0.97, 0]), { color: COL.muted });
      curl(ctx, P, [0, -0.25, 0], J3, 0.12, Math.sign(V.w2) || 1, W_COL, 'ω_2');
      const elbow = M3(G.e, L); seg(ctx, P, [0, 0, 0], elbow, '#55585f', 7); seg(ctx, P, elbow, G.C, '#55585f', 7);
      // path of P over one turn of the arm
      const [t0, t1] = rng(V), path = []; for (let n = 0; n <= 240; n++) path.push(geom(V, t0 + (t1 - t0) * n / 240).Pp);
      poly(ctx, P, path, null, 'rgba(36,87,214,.35)', 1.2, false);
      disk(ctx, P, G.C, G.k, r, 'rgba(225,210,160,.8)');
      seg(ctx, P, G.C, G.Pp, '#c2410c', 2.5);                                            // a radius of the disk, to show the spin
      dot(ctx, P, [0, 0, 0], 'O'); const cr = 0.25 * P.s + 14; dot(ctx, P, G.C, 'C', COL.fg, 3.5, 0.7 * cr, 0.7 * cr); dot(ctx, P, G.Pp, 'P', V_COL);
      curl(ctx, P, G.C, G.k, r * 1.3, -1, '#c2410c', null);
      { const q = P(L3([1, G.C], [r * 1.5, J3], [0.12, G.k])); txt(ctx, 'ω_1', q[0], q[1], { color: '#c2410c', font: 'italic 14px Georgia, serif' }); }
    },
    plot: (V, G, t0, t1) => compPlot(t => omega(V, t), t => alpha(V, t), G, t0, t1, 'ω components in XYZ (rad/s)'),
    stats: (V, G) => [['ω = ω_2 Ĵ − ω_1 k̂', f3(G.w) + ' rad/s'], ['α = −ω_1 ω_2 (Ĵ × k̂)', f3(G.al) + ' rad/s²', true],
      ['ω in xyz (on the disk)', fx(comps(G.w, G.fr)) + ' rad/s'], ['α in xyz (on the disk)', fx(comps(G.al, G.fr)) + ' rad/s²']]
  });
}

/* =================================================================== 3.B.4  tank turret, barrel and shell (ft) */
{
  const r = 3, L = 15, TH0 = 30 * RAD;
  const rng = V => { const td = Math.max(0.05, Math.abs(V.td)); return V.td >= 0 ? [(10 * RAD - TH0) / td, (60 * RAD - TH0) / td] : [-(60 * RAD - TH0) / td, -(10 * RAD - TH0) / td]; };
  const omega = (V, t) => A3(M3(J3, V.Om), M3(kY(V.Om * t), V.td));
  const alpha = (V, t) => M3(eY(V.Om * t), V.Om * V.td);
  const terms = (V, G) => {
    const Rv = M3(G.fr.i, L), Vr = M3(G.fr.i, V.vr);
    const aC = M3(G.e, -V.Om * V.Om * r), aAl = X3(G.al, Rv), aCo = M3(X3(G.w, Vr), 2), aCe = X3(G.w, X3(G.w, Rv));
    return { aC, aAl, aCo, aCe, a: A3(A3(aC, aAl), A3(aCo, aCe)) };
  };
  frameClip({
    id: 'x3b-4', W0: 580, H0: 420, az: 0.5, el: 0.3, speed: 0.5, triad: 4, wScale: 8, alScale: 0, phase: (TH0 - 10 * RAD) / (50 * RAD),
    controls: [{ key: 'Om', label: 'Turret rate, Ω', min: -1, max: 1, step: 0.05, value: 0.4, unit: 'rad/s', dec: 2 },
               { key: 'td', label: 'Barrel raising rate, θ̇', min: -1, max: 1, step: 0.05, value: 0.4, unit: 'rad/s', dec: 2 },
               { key: 'vr', label: 'Muzzle speed relative to the barrel, v_rel', min: 0, max: 400, step: 10, value: 200, unit: 'ft/s', dec: 0 }],
    range: rng,
    geom(V, t){
      const ps = V.Om * t, th = TH0 + V.td * t, e = eY(ps), k = kY(ps), C = M3(e, r), i = L3([Math.cos(th), e], [Math.sin(th), J3]);
      const G = { ps, th, e, k, C, Pm: A3(C, M3(i, L)), fr: { o: C, i, j: L3([-Math.sin(th), e], [Math.cos(th), J3]), k }, w: omega(V, t), al: alpha(V, t), wAt: C };
      G.T = terms(V, G); return G;
    },
    bounds: () => [[-9, -5, -8], [17, 14, 8], [-9, 14, 8], [17, -5, -8], [9, -5, 8], [-9, -5, -8]],
    scene(ctx, P, G, V, st){
      ground(ctx, P, -5, -11, 11, -7, 7);
      box3(ctx, P, [0, -3.4, 0], [8, 0, 0], [0, 1.4, 0], [0, 0, 4.5], '#a9ad94');               // hull (does not turn)
      [-5.5, -2, 1.5, 5].forEach(x => [-4.6, 4.6].forEach(z => disk(ctx, P, [x, -4.1, z], K3, 0.9, 'rgba(70,72,78,.8)', '#2e3036')));
      box3(ctx, P, A3(M3(G.e, 0.4), [0, -1, 0]), M3(G.e, 3.6), [0, 1, 0], M3(G.k, 2.8), '#c3c7ad');   // turret (turns with Ω)
      seg(ctx, P, [0, -2, 0], [0, 12, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...P([0, 12.8, 0]), { color: COL.muted });
      curl(ctx, P, [0, 6, 0], J3, 1.6, Math.sign(V.Om) || 1, W_COL, 'Ω');
      seg(ctx, P, G.C, G.Pm, '#3b3e33', 8); seg(ctx, P, G.C, G.Pm, '#7d8270', 4);                 // barrel
      const s = L * ((st.t * 0.7) % 1); dot(ctx, P, A3(G.C, M3(G.fr.i, s)), null, '#c2410c', 4.5);   // a shell, in slow motion
      dot(ctx, P, [0, 0, 0], 'O'); dot(ctx, P, G.C, 'C'); dot(ctx, P, G.Pm, 'P');
      vec(ctx, P, G.Pm, M3(G.T.aCo, 0.03), AL_COL, null, 2.6);
      vec(ctx, P, G.Pm, M3(G.T.a, 0.03), A_COL, 'a_P', 3.4);
    },
    plot(V, G, t0, t1){
      const N = 120, aP = [], co = [], ce = [];
      for (let n = 0; n <= N; n++){ const t = t0 + (t1 - t0) * n / N, g = this_geom(V, t); aP.push([g.th / RAD, N3(g.T.a)]); co.push([g.th / RAD, N3(g.T.aCo)]); ce.push([g.th / RAD, N3(A3(A3(g.T.aC, g.T.aAl), g.T.aCe))]); }
      const hi = Math.max(10, ...aP.map(p => p[1]), ...co.map(p => p[1])) * 1.12;
      return { xmin: 10, xmax: 60, ymin: 0, ymax: hi, xlabel: 'barrel angle θ (degrees)', ylabel: 'size of the term (ft/s²)',
        series: [{ pts: aP, color: A_COL, width: 2.4 }, { pts: co, color: AL_COL, width: 2, dash: [6, 4] }, { pts: ce, color: COL.c1, width: 2 }],
        points: [{ x: G.th / RAD, y: N3(G.T.a), color: A_COL, r: 5 }, { x: G.th / RAD, y: N3(G.T.aCo), color: AL_COL, r: 4 }], vlines: [{ x: 30, color: COL.muted }] };
    },
    stats: (V, G) => [['θ', fmt(G.th / RAD, 3) + '°'], ['ω in xyz', fx(comps(G.w, G.fr), 4) + ' rad/s'], ['α in xyz', fx(comps(G.al, G.fr), 4) + ' rad/s²'],
      ['a_C', fx(comps(G.T.aC, G.fr), 3)], ['α × r', fx(comps(G.T.aAl, G.fr), 3)], ['2ω × v_rel', fx(comps(G.T.aCo, G.fr), 4)], ['ω × (ω × r)', fx(comps(G.T.aCe, G.fr), 3)],
      ['a_P in xyz', fx(comps(G.T.a, G.fr), 4) + ' ft/s²', true], ['|a_P|', fmt(N3(G.T.a), 4) + ' ft/s²', true]]
  });
  // geometry for the plot (the clip's geom is not reachable from inside plot(), so rebuild it here)
  function this_geom(V, t){ const ps = V.Om * t, th = TH0 + V.td * t, e = eY(ps), k = kY(ps), i = L3([Math.cos(th), e], [Math.sin(th), J3]);
    const G = { th, e, fr: { i, j: L3([-Math.sin(th), e], [Math.cos(th), J3]), k }, w: omega(V, t), al: alpha(V, t) }; G.T = terms(V, G); return G; }
}

/* =================================================================== 3.B.5  gyroscope */
{
  const a = 0.42, hD = 0.38, rD = 0.26;
  const rng = V => { const T = Math.abs(V.w1) > 0.05 ? Math.PI / Math.abs(V.w1) : 0.5; return [-T, T]; };
  const w2r = V => V.w2 * 2 * Math.PI / 60;
  const omega = (V, t) => A3(M3(J3, V.w1), M3(eY(V.w1 * t), w2r(V)));
  const alpha = (V, t) => M3(kY(V.w1 * t), -V.w1 * w2r(V));
  frameClip({
    id: 'x3b-5', W0: 440, H0: 400, az: 0.5, el: 0.3, speed: 0.1, triad: 0.36, wScale: 0.006, alScale: 0.0007,
    controls: [{ key: 'w1', label: 'Rate of the gimbal, ω_1', min: -15, max: 15, step: 0.5, value: 10, unit: 'rad/s', dec: 2 },
               { key: 'w2', label: 'Spin of the disk, ω_2', min: 0, max: 1200, step: 50, value: 600, unit: 'rev/min', dec: 0 }],
    range: rng,
    geom(V, t){
      const ps = V.w1 * t, ph = w2r(V) * t, e = eY(ps), k = kY(ps), D = [0, hD, 0];
      const j = L3([Math.cos(ph), J3], [Math.sin(ph), k]), kk = L3([-Math.sin(ph), J3], [Math.cos(ph), k]);
      return { ps, ph, e, k, D, fr: { o: D, i: e, j, k: kk }, w: omega(V, t), al: alpha(V, t), wAt: D };
    },
    bounds: () => [[-0.6, -0.42, -0.6], [0.6, 0.8, 0.6], [-0.6, 0.8, -0.6], [0.6, -0.42, 0.6], [-0.6, 0.8, 0.6], [0.6, -0.42, -0.6]],
    scene(ctx, P, G, V){
      ground(ctx, P, -0.42, -0.5, 0.5, -0.5, 0.5);
      box3(ctx, P, [0, -0.36, 0], [0.1, 0, 0], [0, 0.06, 0], [0, 0, 0.1], '#cfcabd');
      seg(ctx, P, [0, -0.3, 0], [0, 0, 0], '#7b808c', 5);
      seg(ctx, P, [0, 0.62, 0], [0, 0.8, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...P([0, 0.86, 0]), { color: COL.muted });
      curl(ctx, P, [0, -0.16, 0], J3, 0.1, Math.sign(V.w1) || 1, W_COL, 'ω_1');
      // gimbal frame: base bar and two uprights that carry the disk's axle
      const e = G.e; seg(ctx, P, M3(e, -a), M3(e, a), '#55585f', 6);
      [-a, a].forEach(s => seg(ctx, P, M3(e, s), L3([s, e], [hD, J3]), '#55585f', 6));
      seg(ctx, P, L3([-a, e], [hD, J3]), L3([a, e], [hD, J3]), FR_COL, 3);                        // axle along the disk's own axis
      disk(ctx, P, G.D, e, rD, 'rgba(205,205,212,.85)', '#55585f');
      seg(ctx, P, G.D, A3(G.D, M3(G.fr.j, rD)), '#c2410c', 2.5);                                  // a radius of the disk, to show the spin
      curl(ctx, P, A3(G.D, M3(e, a + 0.15)), e, 0.07, 1, '#c2410c', null);
      { const q = P(L3([1, G.D], [a + 0.22, e], [-0.13, J3])); txt(ctx, 'ω_2', q[0], q[1], { color: '#c2410c', font: 'italic 14px Georgia, serif' }); }
      dot(ctx, P, G.D, null);
    },
    plot: (V, G, t0, t1) => compPlot(t => omega(V, t), t => alpha(V, t), G, t0, t1, 'ω components in XYZ (rad/s)'),
    stats: (V, G) => [['ω_2', fmt(w2r(V), 4) + ' rad/s'], ['ω = ω_1 Ĵ + ω_2 î', f3(G.w, 4) + ' rad/s'], ['α = ω_1 ω_2 (Ĵ × î)', f3(G.al, 4) + ' rad/s²', true],
      ['ω in xyz (on the disk)', fx(comps(G.w, G.fr), 4) + ' rad/s'], ['α in xyz (on the disk)', fx(comps(G.al, G.fr), 4) + ' rad/s²']]
  });
}

/* =================================================================== 3.B.6  disk on a shaft OA carried by shaft BD (inches) */
{
  const R = 6, d = 4, XB = -15, XD = 15;
  const rng = V => { const T = Math.abs(V.w1) > 0.05 ? Math.PI / Math.abs(V.w1) : (Math.abs(V.w2) > 0.05 ? Math.PI / Math.abs(V.w2) : 1); return [-T, T]; };
  const Rx = (b, v) => [v[0], Math.cos(b) * v[1] - Math.sin(b) * v[2], Math.sin(b) * v[1] + Math.cos(b) * v[2]];
  const posP = (V, t) => Rx(V.w1 * t, [-R * Math.sin(V.w2 * t), R * Math.cos(V.w2 * t), d]);
  const accP = (V, t) => { const h = 1e-4; return M3(A3(S3(posP(V, t + h), M3(posP(V, t), 2)), posP(V, t - h)), 1 / (h * h)); };
  const velP = (V, t) => { const h = 1e-5; return M3(S3(posP(V, t + h), posP(V, t - h)), 1 / (2 * h)); };
  frameClip({
    id: 'x3b-6', W0: 580, H0: 400, az: 0.55, el: 0.32, speed: 0.25, triad: 4, wScale: 0, alScale: 0,
    controls: [{ key: 'w1', label: 'Rate of shaft BD, ω_1', min: -10, max: 10, step: 0.5, value: 5, unit: 'rad/s', dec: 2 },
               { key: 'w2', label: 'Spin of the disk relative to OA, ω_2', min: -15, max: 15, step: 0.5, value: 8, unit: 'rad/s', dec: 2 }],
    range: rng,
    geom(V, t){
      const b = V.w1 * t, n = Rx(b, K3), jj = Rx(b, J3), O = M3(n, d), Pp = posP(V, t);
      return { b, n, O, Pp, fr: { o: [0, 0, 0], i: I3, j: jj, k: n }, w: [V.w1, 0, 0], al: [0, 0, 0], vP: velP(V, t), aP: accP(V, t), wAt: null };
    },
    bounds: () => [[XB - 3, -10, -10], [XD + 3, 10, 10], [XB - 3, 10, 10], [XD + 3, -10, -10]],
    scene(ctx, P, G, V){
      [XB, XD].forEach((x, n) => { const s = n ? 1 : -1;
        box3(ctx, P, [x + s * 2.6, 0, 0], [0.4, 0, 0], [0, 5, 0], [0, 0, 4.5], 'rgba(185,179,163,.85)');                        // wall plates
        box3(ctx, P, [x + s * 1.2, 0, 0], [1, 0, 0], [0, 2.2, 0], [0, 0, 2.2], '#cfcabd'); });                                // bearings
      seg(ctx, P, [XB, 0, 0], [XD, 0, 0], '#7b808c', 6);                                                           // shaft BD
      seg(ctx, P, [0, 0, 0], G.O, '#7b808c', 5);                                                                    // shaft OA
      disk(ctx, P, G.O, G.n, R, 'rgba(205,205,212,.8)', '#55585f');
      seg(ctx, P, G.O, G.Pp, '#c2410c', 2.5);
      curl(ctx, P, [XD - 4, 0, 0], I3, 2.2, Math.sign(V.w1) || 1, W_COL, 'ω_1');
      curl(ctx, P, A3(G.O, M3(G.n, 0.6)), G.n, R + 1.8, Math.sign(V.w2) || 1, '#c2410c', 'ω_2');
      dot(ctx, P, [XB, 0, 0], 'B'); dot(ctx, P, [XD, 0, 0], 'D'); dot(ctx, P, [0, 0, 0], 'A'); dot(ctx, P, G.O, 'O'); dot(ctx, P, G.Pp, 'P', V_COL, 3.5, -16, -18);
      vec(ctx, P, G.Pp, M3(G.vP, 0.1), V_COL, 'v_P', 2.6);
      vec(ctx, P, G.Pp, M3(G.aP, 0.012), A_COL, 'a_P', 3.2);
    },
    plot: (V, G, t0, t1) => compPlot(t => accP(V, t), null, G, t0, t1, 'a_P components in XYZ (in/s²)'),
    stats: (V, G) => [['v_P', f3(G.vP) + ' in/s'], ['a_P', f3(G.aP) + ' in/s²', true], ['|a_P|', fmt(N3(G.aP), 4) + ' in/s²'],
      ['at the instant in the problem, a_P = −(ω_1² + ω_2²) R Ĵ − ω_1² d K̂', f3([0, -(V.w1 ** 2 + V.w2 ** 2) * R, -(V.w1 ** 2) * d]) + ' in/s²']]
  });
}

subLabels();
})();
