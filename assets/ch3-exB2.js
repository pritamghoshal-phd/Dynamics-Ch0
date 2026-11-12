/* =========================================================
   Chapter 3, 3D moving-frame examples 3.B.7 to 3.B.11
   Each clip draws the system in a projected 3D view, shows the vectors of the solution,
   and plots the acceleration components measured from the motion itself (numerical
   second derivative of the position), so the formula answer can be checked at the instant.
   Every clip stores its kinematics in st.K for the 3D view (ch3-3dB2.js).
   ========================================================= */
(function(){

const ROSE = '#a61e4d', ALC = '#8a3fd1';
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => Math.hypot(...a);
const unit = a => mul3(a, 1 / (norm(a) || 1));
const Rx = (g, p) => [p[0], p[1] * Math.cos(g) - p[2] * Math.sin(g), p[1] * Math.sin(g) + p[2] * Math.cos(g)];
const Ry = (g, p) => [p[0] * Math.cos(g) + p[2] * Math.sin(g), p[1], -p[0] * Math.sin(g) + p[2] * Math.cos(g)];
const Rz = (g, p) => [p[0] * Math.cos(g) - p[1] * Math.sin(g), p[0] * Math.sin(g) + p[1] * Math.cos(g), p[2]];
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-9 ? 0 : x, d)).join(', ')})`;
// velocity and acceleration of a position function f(t) by central differences
const deriv = (f, t, h = 1e-3) => { const a = f(t - h), b = f(t), c = f(t + h); return [mul3(sub3(c, a), 1 / (2 * h)), mul3(add3(sub3(c, mul3(b, 2)), a), 1 / (h * h))]; };

// camera for the projected drawings, Y up; returns [screenX, screenY] in design units
function cam(cx, cy, s, az, el){
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  return p => [cx + s * (p[0] * ca - p[2] * sa), cy - s * (-p[0] * sa * se + p[1] * ce - p[2] * ca * se)];
}
function ln3(ctx, Pj, a, b, col, wd = 2, dash){ const [x1, y1] = Pj(a), [x2, y2] = Pj(b); line(ctx, x1, y1, x2, y2, col, wd, dash); }
function ar3(ctx, Pj, a, b, col, label, wd = 3){
  const [x1, y1] = Pj(a), [x2, y2] = Pj(b); if (Math.hypot(x2 - x1, y2 - y1) < 4) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label){ const L = Math.hypot(x2 - x1, y2 - y1); txt(ctx, label, x2 + 17 * (x2 - x1) / L, y2 + 17 * (y2 - y1) / L, { color: col, font: 'italic 14px Georgia, serif' }); }
}
function poly3(ctx, Pj, pts, col, wd = 2, close = false, fill){
  ctx.save(); ctx.beginPath(); pts.forEach((p, i) => { const q = Pj(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); });
  if (close) ctx.closePath(); if (fill){ ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function pdot(ctx, x, y, r, col){ ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
function trail(ctx, Pj, pts, col, wd = 1.6){ if (pts.length < 2) return; poly3(ctx, Pj, pts, col, wd); }
// circle of radius R about center C in the plane spanned by unit vectors u and v
const circ = (C, u, v, R, n = 48) => Array.from({ length: n }, (_, k) => { const a = 2 * Math.PI * k / n; return add3(C, add3(mul3(u, R * Math.cos(a)), mul3(v, R * Math.sin(a)))); });
// fixed bearing block for a vertical shaft (on the floor or hanging from the ceiling)
function bearing(ctx, Pj, x, y, z, s, up){
  const sg = up ? 1 : -1, h = s * 0.8, w = s;
  poly3(ctx, Pj, [[x - w, y + sg * h, z], [x + w, y + sg * h, z], [x + w * 0.45, y, z], [x - w * 0.45, y, z]], COL.fg, 1.4, true, '#e4dfd2');
  const [a1, b1] = Pj([x - 2 * w, y + sg * h, z]), [a2, b2] = Pj([x + 2 * w, y + sg * h, z]);
  line(ctx, a1, b1, a2, b2, COL.fg, 2); hatch(ctx, up ? a1 : a2, b1, up ? a2 : a1, b2, -1, 7, 6);
}
// small coordinate triad (unit vectors e1, e2, e3) at point O with labels
function triad(ctx, Pj, O, E, len, names, col = COL.muted){
  E.forEach((e, k) => ar3(ctx, Pj, O, add3(O, mul3(e, len)), col, names[k], 1.5));
}
const PLAYF = [['▶ Play the motion', false], ['Freeze at the instant in the problem', true]];
const chips = (st, reset) => PLAYF.map(([label, val]) => ({ label, apply: () => { st.freeze = val; reset(); } }));
const markChips = (id, st) => document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', PLAYF[i][1] === st.freeze));

/* plot of the three fixed-axis components of a vector g(τ) (measured from the motion) over [t0, t1];
   the dots at τ = 0 are the formula answers in the same axes. */
function compPlot(cv, g, t0, t1, tau, form, ylabel, names = ['X', 'Y', 'Z']){
  const cols = [COL.c1, COL.c2, COL.c3], S = [[], [], []];
  for (let i = 0; i <= 120; i++){ const t = t0 + (t1 - t0) * i / 120, q = g(t); for (let k = 0; k < 3; k++) S[k].push([t, q[k]]); }
  const all = S.flat().map(p => p[1]).concat(form); let lo = Math.min(...all), hi = Math.max(...all); const sp = Math.max(hi - lo, 1e-3);
  lo -= 0.12 * sp; hi += 0.12 * sp;
  const cur = g(tau);
  plot(cv, { xmin: t0, xmax: t1, ymin: lo, ymax: hi, xlabel: 'time from the instant in the problem, τ (s)', ylabel,
    series: S.map((pts, k) => ({ pts, color: cols[k], width: 2.2 })).concat([{ pts: [[tau, lo], [tau, hi]], color: COL.axis, width: 1, dash: [4, 4], guide: true }]),
    points: form.map((y, k) => ({ x: 0, y, color: cols[k], r: 6 })).concat(cur.map((y, k) => ({ x: tau, y, color: cols[k], r: 3.5 }))) });
}

/* ============================================================ 3.B.7 crane boom */
(function(){
  const L = 12, TH0 = 30 * RAD;
  makeClip({
    id: 'x3b-7', speed: 0.5,
    controls: [
      { key: 'w1', label: 'Cab rate ω_1', min: -1, max: 1, step: 0.01, value: 0.3, unit: 'rad/s', dec: 3 },
      { key: 'thd', label: 'Boom raising rate θ̇', min: -1, max: 1, step: 0.01, value: 0.5, unit: 'rad/s', dec: 3 }
    ],
    presets: (C, st, reset) => chips(st, reset),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('x3b-7', st); st.tau = st.freeze ? 0 : -0.6; st.tr = []; },
    step(st, dt){
      if (st.freeze) return; st.tau += dt;
      const th = TH0 + st.V.thd * st.tau;
      if (st.tau > 1.6 || th > 80 * RAD || th < 4 * RAD){ st.tau = -0.6; st.tr = []; }
    },
    draw(st){
      const cv = $('x3b-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 520, 400]);
      const V = st.V, tau = st.tau, th = TH0 + V.thd * tau, ps = V.w1 * tau;
      const Pf = t => Ry(V.w1 * t, [L * Math.cos(TH0 + V.thd * t), L * Math.sin(TH0 + V.thd * t), 0]);
      const Pj = cam(200, 285, 22, 0.5, 0.28);
      const I = Ry(ps, [1, 0, 0]), K = Ry(ps, [0, 0, 1]), J = [0, 1, 0];
      const iB = add3(mul3(I, Math.cos(th)), mul3(J, Math.sin(th))), jB = add3(mul3(I, -Math.sin(th)), mul3(J, Math.cos(th)));
      // ground, fixed crawler base and the cab, which turns with the boom about the vertical Y axis through O
      poly3(ctx, Pj, [[-7, -3.4, -6], [9, -3.4, -6], [9, -3.4, 6], [-7, -3.4, 6]], COL.grid, 1, true, 'rgba(140,145,156,0.06)');
      const box = (c0, c1, E1, E3) => { const v = []; [c0[0], c1[0]].forEach(a => [c0[1], c1[1]].forEach(y => [c0[2], c1[2]].forEach(c => v.push(add3(add3(mul3(E1, a), [0, y, 0]), mul3(E3, c)))))); return v; };
      const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
      const base = box([-2.6, -3.4, -1.8], [2.6, -2.7, 1.8], [1, 0, 0], [0, 0, 1]); edges.forEach(([a, b]) => ln3(ctx, Pj, base[a], base[b], COL.fg, 1.4));
      const cab = box([-1.6, -2.7, -1.3], [2.0, -0.3, 1.3], I, K); edges.forEach(([a, b]) => ln3(ctx, Pj, cab[a], cab[b], COL.c5, 1.6));
      ln3(ctx, Pj, [0, -3.4, 0], [0, 6.5, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...Pj([0, 7.1, 0]), { color: COL.muted });
      ln3(ctx, Pj, [0, 0, 0], [12.5, 0, 0], COL.axis, 1, [4, 4]); txt(ctx, 'X', ...Pj([13.2, 0, 0]), { color: COL.muted });
      // boom (truss) from O to P
      const P = mul3(iB, L), hw = 0.35;
      [-1, 1].forEach(sg => ln3(ctx, Pj, mul3(jB, sg * hw), add3(P, mul3(jB, sg * hw * 0.3)), COL.fg, 2));
      for (let q = 0; q < 12; q++){ const a = add3(mul3(iB, q), mul3(jB, (q % 2 ? 1 : -1) * hw * (1 - 0.7 * q / L))), b = add3(mul3(iB, q + 1), mul3(jB, (q % 2 ? -1 : 1) * hw * (1 - 0.7 * (q + 1) / L))); ln3(ctx, Pj, a, b, COL.fg, 1); }
      const [ox, oy] = Pj([0, 0, 0]); pdot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 14, oy + 12);
      if (!st.freeze){ st.tr.push(P); if (st.tr.length > 400) st.tr.shift(); }
      trail(ctx, Pj, st.tr, COL.c4);
      const [px, py] = Pj(P); pdot(ctx, px, py, 5, COL.fg); txt(ctx, 'P', px - 14, py - 12);
      // vectors of the solution
      const wv = add3(mul3(J, V.w1), mul3(K, V.thd)), al = mul3(cross3(mul3(J, V.w1), K), V.thd);
      const v = cross3(wv, P), a = add3(cross3(al, P), cross3(wv, cross3(wv, P)));
      ar3(ctx, Pj, [0, 0, 0], mul3(wv, 9), ROSE, 'ω', 3);
      ar3(ctx, Pj, [0, 0, 0], mul3(al, 26), ALC, null, 2.5); { const [tx, ty] = Pj(mul3(al, 26)); if (norm(al) > 1e-6) txt(ctx, 'α', tx + 4, ty - 16, { color: ALC, font: 'italic 14px Georgia, serif' }); }   // above the tip: α lies along the X axis line
      ar3(ctx, Pj, P, add3(P, mul3(v, 0.7)), COL.c3, 'v_P', 3);
      ar3(ctx, Pj, P, add3(P, mul3(a, 1.1)), COL.c2, 'a_P', 3);
      txt(ctx, `θ = ${fmt(th / RAD, 3)}°`, 510, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      st.K = { th, ps, P, v, a, w: wv, al, iB, jB, K };
      const xyz = q => [dot3(q, iB), dot3(q, jB), dot3(q, K)];
      const [vN, aN] = deriv(Pf, tau);
      statsEvery(st, 'x3b-7-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['ω (xyz)', f3(xyz(wv), 4) + ' rad/s'], ['α (xyz)', f3(xyz(al), 4) + ' rad/s²'],
        ['v_P (xyz)', f3(xyz(v), 4) + ' m/s', true], ['a_P (xyz)', f3(xyz(a), 4) + ' m/s²', true], ['|a_P| from the formula', fmt(norm(a), 4) + ' m/s²'], ['|a_P| measured from the path', fmt(norm(aN), 4) + ' m/s²']]);
      // a at the instant in fixed XYZ axes, from the formula
      const w0 = [0, V.w1, 0], th0 = TH0, ib0 = [Math.cos(th0), Math.sin(th0), 0], w00 = add3(w0, [0, 0, V.thd]), al0 = mul3(cross3(w0, [0, 0, 1]), V.thd), P0 = mul3(ib0, L);
      const a0 = add3(cross3(al0, P0), cross3(w00, cross3(w00, P0)));
      compPlot($('x3b-7-plot'), t => deriv(Pf, t)[1], -0.6, 1.6, tau, a0, 'a_P components (m/s²)');
    }
  });
})();

/* ============================================================ 3.B.8 disk on a rotating arm */
(function(){
  const L = 0.5, R = 0.2, T = 1.6;
  makeClip({
    id: 'x3b-8', speed: 0.5,
    controls: [
      { key: 'w1', label: 'Shaft rate ω_1', min: -3, max: 3, step: 0.05, value: 1, unit: 'rad/s', dec: 2 },
      { key: 'w2', label: 'Disk spin ω_2 (relative to the arm)', min: -6, max: 6, step: 0.1, value: 3, unit: 'rad/s', dec: 2 }
    ],
    presets: (C, st, reset) => chips(st, reset),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('x3b-8', st); st.tau = st.freeze ? 0 : -T; st.tr = []; },
    step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > T){ st.tau = -T; st.tr = []; } },
    draw(st){
      const cv = $('x3b-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 520, 400]);
      const V = st.V, tau = st.tau, ph = V.w1 * tau, be = V.w2 * tau;
      const Pf = t => Ry(V.w1 * t, [L - R * Math.sin(V.w2 * t), R * Math.cos(V.w2 * t), 0]);
      const Pj = cam(230, 200, 470, 0.55, 0.3);
      const i = Ry(ph, [1, 0, 0]), k = Ry(ph, [0, 0, 1]), J = [0, 1, 0], A = mul3(i, L), P = Pf(tau);
      // shaft between a ceiling bearing and a floor bearing
      ln3(ctx, Pj, [0, -0.31, 0], [0, 0.31, 0], COL.fg, 5); bearing(ctx, Pj, 0, 0.31, 0, 0.035, true); bearing(ctx, Pj, 0, -0.31, 0, 0.035, false);
      txt(ctx, 'Y', ...Pj([0.06, 0.37, 0]), { color: COL.muted });
      ln3(ctx, Pj, [0, 0, 0], [0.6, 0, 0], COL.axis, 1, [4, 4]); txt(ctx, 'X', ...Pj([0.64, 0, 0]), { color: COL.muted });
      const hub = circ([0, 0, 0], [1, 0, 0], [0, 0, 1], 0.035); poly3(ctx, Pj, hub, COL.fg, 1.4, true, '#d8d2c2');
      // arm OA behind the disk and a short axle along z at A
      ln3(ctx, Pj, [0, 0, 0], add3(A, mul3(k, -0.03)), COL.fg, 6); ln3(ctx, Pj, add3(A, mul3(k, -0.03)), A, COL.fg, 4);
      // disk in the plane of i and J, spinning about k
      const dsk = circ(A, i, J, R); poly3(ctx, Pj, dsk, COL.fg, 1.6, true, 'rgba(201,196,182,0.75)');
      const Pd = add3(A, add3(mul3(i, -R * Math.sin(be)), mul3(J, R * Math.cos(be))));
      ln3(ctx, Pj, A, Pd, COL.c2, 2.5); pdot(ctx, ...Pj(A), 3.5, COL.fg);
      const [ax, ay] = Pj(A), [Ox, Oy] = Pj([0, 0, 0]);
      txt(ctx, 'A', ax + 10, ay + 14); txt(ctx, 'O', Ox - 20, Oy + 16);
      if (!st.freeze){ st.tr.push(P); if (st.tr.length > 500) st.tr.shift(); }
      trail(ctx, Pj, st.tr, COL.c4, 1.4);
      const [px, py] = Pj(P); pdot(ctx, px, py, 5, COL.fg); txt(ctx, 'P', ...Pj(add3(P, mul3(unit(sub3(P, A)), 0.1))));
      const wv = add3(mul3(J, V.w1), mul3(k, V.w2)), al = mul3(cross3(J, k), V.w1 * V.w2);
      const rP = sub3(P, A), vA = cross3(mul3(J, V.w1), A), aA = cross3(mul3(J, V.w1), vA);
      const v = add3(vA, cross3(wv, rP)), a = add3(aA, add3(cross3(al, rP), cross3(wv, cross3(wv, rP))));
      ar3(ctx, Pj, A, add3(A, mul3(wv, 0.06)), ROSE, 'ω', 2.6);
      ar3(ctx, Pj, P, add3(P, mul3(v, 0.25)), COL.c3, 'v_P', 3);
      ar3(ctx, Pj, P, add3(P, mul3(a, 0.12)), COL.c2, 'a_P', 3);
      st.K = { ph, be, A, P, i, k, v, a, w: wv, al };
      const [, aN] = deriv(Pf, tau);
      statsEvery(st, 'x3b-8-stats', () => [['ω (XYZ)', f3(wv, 3) + ' rad/s'], ['α (XYZ)', f3(al, 3) + ' rad/s²'],
        ['v_P (XYZ)', f3(v, 3) + ' m/s', true], ['a_P (XYZ)', f3(a, 3) + ' m/s²', true], ['a_P measured from the path', f3(aN, 3) + ' m/s²']]);
      compPlot($('x3b-8-plot'), t => deriv(Pf, t)[1], -T, T, tau, [-V.w1 * V.w1 * L, -V.w2 * V.w2 * R, 2 * V.w1 * V.w2 * R], 'a_P components (m/s²)');
    }
  });
})();

/* ============================================================ 3.B.9 disk rolling around a vertical axis */
(function(){
  const Rarm = 0.6, r = 0.2;
  makeClip({
    id: 'x3b-9', speed: 0.5,
    controls: [{ key: 'Om', label: 'Arm rate Ω', min: -2, max: 2, step: 0.05, value: 1, unit: 'rad/s', dec: 2 }],
    presets: (C, st, reset) => chips(st, reset),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('x3b-9', st); st.tau = st.freeze ? 0 : -1.5; },
    step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > 4.5) st.tau = -1.5; },
    draw(st){
      const cv = $('x3b-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 520, 380]);
      const V = st.V, tau = st.tau, Om = V.Om, ph = Om * tau, p = -Om * Rarm / r, sp = p * tau;
      const Pj = cam(215, 250, 300, 0.5, 0.42), J = [0, 1, 0];
      const i = Ry(ph, [1, 0, 0]), k = Ry(ph, [0, 0, 1]), O = [0, r, 0], C = add3(O, mul3(i, Rarm));
      const wf = t => add3(mul3(J, Om), mul3(Ry(Om * t, [1, 0, 0]), p));
      // floor with the circle traced by the contact point
      poly3(ctx, Pj, [[-0.85, 0, -0.85], [0.85, 0, -0.85], [0.85, 0, 0.85], [-0.85, 0, 0.85]], COL.grid, 1, true, 'rgba(140,145,156,0.07)');
      poly3(ctx, Pj, circ([0, 0, 0], [1, 0, 0], [0, 0, 1], Rarm, 72), COL.axis, 1, true);
      // fixed post at O and the arm OC
      ln3(ctx, Pj, [0, 0, 0], O, COL.fg, 6); poly3(ctx, Pj, circ([0, 0, 0], [1, 0, 0], [0, 0, 1], 0.05), COL.fg, 1.2, true, '#d8d2c2');
      ln3(ctx, Pj, [0, 0, 0], [0, 0.55, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...Pj([0, 0.6, 0]), { color: COL.muted });
      ln3(ctx, Pj, O, C, COL.fg, 4);
      // disk (plane of J and k) with spokes that show its spin about the arm axis
      const u = J, wv = k; poly3(ctx, Pj, circ(C, u, wv, r), COL.fg, 1.6, true, 'rgba(201,196,182,0.8)');
      for (let q = 0; q < 4; q++){ const a = sp + q * Math.PI / 2; ln3(ctx, Pj, C, add3(C, add3(mul3(J, r * Math.cos(a)), mul3(k, r * Math.sin(a)))), q ? COL.fg : COL.c2, q ? 1.2 : 2.6); }
      const Q = add3(C, [0, -r, 0]);
      pdot(ctx, ...Pj(O), 3.5, COL.fg); pdot(ctx, ...Pj(C), 3.5, COL.fg); pdot(ctx, ...Pj(Q), 3.5, COL.c3);
      const [Ox, Oy] = Pj(O), [cx, cy] = Pj(C), [qx, qy] = Pj(Q);
      txt(ctx, 'O', Ox - 16, Oy - 4); txt(ctx, 'C', ...Pj(add3(C, [0, r + 0.1, 0]))); txt(ctx, 'no slip', qx + 34, qy + 10, { font: '11px system-ui', color: COL.muted });
      const wd = wf(tau), al = mul3(k, Rarm / r * Om * Om), vC = cross3(mul3(J, Om), sub3(C, O));
      ar3(ctx, Pj, C, add3(C, mul3(wd, 0.085)), ROSE, "ω", 2.8);
      ar3(ctx, Pj, C, add3(C, mul3(al, 0.06)), ALC, 'α', 2.8);
      ar3(ctx, Pj, C, add3(C, mul3(vC, 0.5)), COL.c3, 'v_C', 2.4);
      st.K = { ph, sp, C, O, i, k, w: wd, al, vC };
      const [, aN] = deriv(wf, tau);
      statsEvery(st, 'x3b-9-stats', () => [['spin rate relative to the arm, ω_s = −ΩR/r', fmt(p, 3) + ' rad/s'], ['ω (XYZ)', f3(wd, 3) + ' rad/s'],
        ['α = (R/r)Ω² k', f3(al, 3) + ' rad/s²', true], ['|α|', fmt(norm(al), 4) + ' rad/s²', true], ['α measured from ω(t)', f3(aN, 3) + ' rad/s²']]);
      compPlot($('x3b-9-plot'), t => deriv(wf, t)[0], -1.5, 4.5, tau, [0, 0, Rarm / r * Om * Om], 'α components (rad/s²)');
    }
  });
})();

/* ============================================================ 3.B.10 telescoping rod on a rotating arm */
(function(){
  const L0 = 0.12, d = 0.02, Ld = 0.06, T0 = -0.1, T1 = 0.9;
  function clear(V, t){
    const ga = V.w1 * t, de = V.w2 * t, L = L0 + Ld * t, yr = L * Math.cos(de);
    const zC = d * Math.cos(ga), zA = yr * Math.sin(ga) + d * Math.cos(ga), yA = yr * Math.cos(ga) - d * Math.sin(ga);
    return Math.min(zC, zA) > -0.004 && yA > -0.10;
  }
  makeClip({
    id: 'x3b-10', speed: 0.25,
    controls: [
      // ω_1 ≥ 0: with ω_1 < 0 the arm would turn the rod back through the wall over the animation window
      { key: 'w1', label: 'Arm rate ω_1 (about X)', min: 0, max: 2, step: 0.05, value: 1.2, unit: 'rad/s', dec: 2 },
      { key: 'w2', label: 'Rod rate ω_2 (about the arm axis Z)', min: -3, max: 3, step: 0.05, value: 1.5, unit: 'rad/s', dec: 2 }
    ],
    presets: (C, st, reset) => chips(st, reset),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('x3b-10', st); st.tau = st.freeze ? 0 : T0; st.tr = []; },
    // the loop restarts before the arm or the rod would reach the wall (plane Z = −0.012 m, rod half-width 6 mm) or the floor
    step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > T1 || !clear(st.V, st.tau)){ st.tau = T0; st.tr = []; } },
    draw(st){
      const cv = $('x3b-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 520, 400]);
      const V = st.V, tau = st.tau, ga = V.w1 * tau, de = V.w2 * tau, L = L0 + Ld * tau;
      const Af = t => Rx(V.w1 * t, Rz(V.w2 * t, [0, L0 + Ld * t, d]));
      const Pj = cam(330, 270, 1350, -0.75, 0.32);
      const z = Rx(ga, [0, 0, 1]), y = Rx(ga, Rz(de, [0, 1, 0])), x = Rx(ga, Rz(de, [1, 0, 0])), C = mul3(z, d), A = Af(tau);
      // wall (plane Z = −0.012) with a bracket and the pin O whose axis is X
      poly3(ctx, Pj, [[-0.06, -0.08, -0.012], [0.06, -0.08, -0.012], [0.06, 0.2, -0.012], [-0.06, 0.2, -0.012]], COL.fg, 1.2, true, 'rgba(201,196,182,0.35)');
      poly3(ctx, Pj, [[-0.012, -0.012, -0.012], [0.012, -0.012, -0.012], [0.012, 0.012, -0.012], [-0.012, 0.012, -0.012]], COL.fg, 1.2, true, '#e4dfd2');
      ln3(ctx, Pj, [-0.03, 0, 0], [0.03, 0, 0], COL.fg, 3);
      ln3(ctx, Pj, [0, 0, 0], [0, 0.2, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...Pj([0, 0.212, 0]), { color: COL.muted });
      ln3(ctx, Pj, [0, 0, 0], [0, 0, 0.09], COL.axis, 1, [4, 4]); txt(ctx, 'Z', ...Pj([0, 0, 0.1]), { color: COL.muted });
      ln3(ctx, Pj, [0, 0, 0], [0.06, 0, 0], COL.axis, 1, [4, 4]); txt(ctx, 'X', ...Pj([0.068, 0, 0]), { color: COL.muted });
      // arm OC along z and the collar at C
      ln3(ctx, Pj, [0, 0, 0], C, COL.fg, 6); pdot(ctx, ...Pj([0, 0, 0]), 4, COL.fg);
      // rod: outer tube from C (fixed length) and the sliding inner part BA
      const B = add3(C, mul3(y, 0.07));
      ln3(ctx, Pj, C, B, COL.fg, 8); ln3(ctx, Pj, B, A, COL.c5, 4);
      if (!st.freeze){ st.tr.push(A); if (st.tr.length > 400) st.tr.shift(); }
      trail(ctx, Pj, st.tr, COL.c4, 1.4);
      const [Ox, Oy] = Pj([0, 0, 0]), [cx, cy] = Pj(C), [bx, by] = Pj(B), [ax, ay] = Pj(A);
      txt(ctx, 'O', Ox + 14, Oy + 12); txt(ctx, 'C', cx - 14, cy + 12); txt(ctx, 'B', bx - 14, by); pdot(ctx, ax, ay, 4.5, COL.fg); txt(ctx, 'A', ...Pj(add3(A, mul3(y, 0.022))));
      const wv = add3([V.w1, 0, 0], mul3(z, V.w2)), al = mul3(cross3([V.w1, 0, 0], z), V.w2);
      const vrel = mul3(y, Ld), v = add3(cross3(wv, A), vrel), a = add3(add3(cross3(al, A), cross3(wv, cross3(wv, A))), mul3(cross3(wv, vrel), 2));
      ar3(ctx, Pj, [0, 0, 0], mul3(wv, 0.04), ROSE, 'ω', 2.6);
      ar3(ctx, Pj, A, add3(A, mul3(v, 0.35)), COL.c3, 'v_A', 3);
      ar3(ctx, Pj, A, add3(A, mul3(a, 0.18)), COL.c2, 'a_A', 3);
      st.K = { ga, de, L, A, B, C, x, y, z, v, a, w: wv, al };
      const [, aN] = deriv(Af, tau);
      statsEvery(st, 'x3b-10-stats', () => [['L', fmt(L * 1000, 3) + ' mm'], ['ω (XYZ)', f3(wv, 3) + ' rad/s'], ['α (XYZ)', f3(al, 3) + ' rad/s²'],
        ['v_A (XYZ)', f3(v, 4) + ' m/s', true], ['a_A (XYZ)', f3(a, 4) + ' m/s²', true], ['a_A measured from the path', f3(aN, 4) + ' m/s²']]);
      // formula at τ = 0: a_A = α × r + ω × (ω × r) + 2 ω × v_rel with r = (0, L, d)
      const W0 = [V.w1, 0, V.w2], r0 = [0, L0, d], al0 = [0, -V.w1 * V.w2, 0], vr0 = [0, Ld, 0];
      const af = add3(add3(cross3(al0, r0), cross3(W0, cross3(W0, r0))), mul3(cross3(W0, vr0), 2));
      compPlot($('x3b-10-plot'), t => deriv(Af, t)[1], T0, T1, tau, af, 'a_A components (m/s²)');
    }
  });
})();

/* ============================================================ 3.B.11 disk on a spinning arm on a rotating shaft */
(function(){
  const b = 0.5, r = 0.2, T = 1.6;
  makeClip({
    id: 'x3b-11', speed: 0.5,
    controls: [
      { key: 'w1', label: 'Arm spin ω_1 (about its own axis)', min: -3, max: 3, step: 0.05, value: 1, unit: 'rad/s', dec: 2 },
      { key: 'w2', label: 'Shaft rate ω_2 (about Y)', min: -3, max: 3, step: 0.05, value: 1.2, unit: 'rad/s', dec: 2 },
      { key: 'w3', label: 'Disk spin ω_3 (relative to the arm)', min: -6, max: 6, step: 0.1, value: 3, unit: 'rad/s', dec: 2 }
    ],
    presets: (C, st, reset) => chips(st, reset),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('x3b-11', st); st.tau = st.freeze ? 0 : -T; st.tr = []; },
    step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > T){ st.tau = -T; st.tr = []; } },
    draw(st){
      const cv = $('x3b-11-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 520, 400]);
      const V = st.V, tau = st.tau, p2 = V.w2 * tau, p1 = V.w1 * tau, p3 = V.w3 * tau;
      const Af = t => Ry(V.w2 * t, add3([b, 0, 0], Rx(V.w1 * t, Rz(V.w3 * t, [0, r, 0]))));
      const Pj = cam(230, 200, 470, 0.55, 0.3), J = [0, 1, 0];
      const i = Ry(p2, [1, 0, 0]), j = Ry(p2, Rx(p1, [0, 1, 0])), k = Ry(p2, Rx(p1, [0, 0, 1])), B = mul3(i, b), A = Af(tau);
      ln3(ctx, Pj, [0, -0.31, 0], [0, 0.31, 0], COL.fg, 5); bearing(ctx, Pj, 0, 0.31, 0, 0.035, true); bearing(ctx, Pj, 0, -0.31, 0, 0.035, false);
      txt(ctx, 'Y', ...Pj([0.06, 0.37, 0]), { color: COL.muted });
      ln3(ctx, Pj, [0, 0, 0], [0.6, 0, 0], COL.axis, 1, [4, 4]); txt(ctx, 'X', ...Pj([0.64, 0, 0]), { color: COL.muted });
      // collar on the shaft and the arm OB, which spins about its own axis (the stripe shows the spin)
      poly3(ctx, Pj, circ([0, -0.04, 0], [1, 0, 0], [0, 0, 1], 0.04), COL.fg, 1.2, true, '#d8d2c2');
      ln3(ctx, Pj, [0, 0, 0], add3(B, mul3(k, -0.03)), COL.fg, 7);
      ln3(ctx, Pj, add3(mul3(i, 0.12), mul3(j, 0.012)), add3(mul3(i, 0.4), mul3(j, 0.012)), COL.c2, 2);
      ln3(ctx, Pj, add3(B, mul3(k, -0.03)), B, COL.fg, 4);
      // disk in the plane of i and j, spinning about k
      poly3(ctx, Pj, circ(B, i, j, r), COL.fg, 1.6, true, 'rgba(201,196,182,0.75)');
      ln3(ctx, Pj, B, A, COL.c2, 2.5); pdot(ctx, ...Pj(B), 3.5, COL.fg);
      const [bx, by] = Pj(B), [Ox, Oy] = Pj([0, 0, 0]); txt(ctx, 'B', bx + 10, by + 14); txt(ctx, 'O', Ox - 16, Oy + 12);
      if (!st.freeze){ st.tr.push(A); if (st.tr.length > 500) st.tr.shift(); }
      trail(ctx, Pj, st.tr, COL.c4, 1.4);
      const [ax, ay] = Pj(A); pdot(ctx, ax, ay, 5, COL.fg); txt(ctx, 'A', ...Pj(add3(A, mul3(unit(sub3(A, B)), 0.11))));
      const wv = add3(add3(mul3(J, V.w2), mul3(i, V.w1)), mul3(k, V.w3));
      const al = add3(mul3(cross3(J, i), V.w1 * V.w2), mul3(cross3(add3(mul3(J, V.w2), mul3(i, V.w1)), k), V.w3));
      const rA = sub3(A, B), vB = cross3(mul3(J, V.w2), B), aB = cross3(mul3(J, V.w2), vB);
      const v = add3(vB, cross3(wv, rA)), a = add3(aB, add3(cross3(al, rA), cross3(wv, cross3(wv, rA))));
      ar3(ctx, Pj, B, add3(B, mul3(wv, 0.06)), ROSE, 'ω', 2.6);
      ar3(ctx, Pj, A, add3(A, mul3(v, 0.25)), COL.c3, 'v_A', 3);
      ar3(ctx, Pj, A, add3(A, mul3(a, 0.12)), COL.c2, 'a_A', 3);
      st.K = { p1, p2, p3, A, B, i, j, k, v, a, w: wv, al };
      const [, aN] = deriv(Af, tau);
      statsEvery(st, 'x3b-11-stats', () => [['ω (XYZ)', f3(wv, 3) + ' rad/s'], ['α (XYZ)', f3(al, 3) + ' rad/s²'],
        ['v_A (XYZ)', f3(v, 3) + ' m/s', true], ['a_A (XYZ)', f3(a, 3) + ' m/s²', true], ['a_A measured from the path', f3(aN, 3) + ' m/s²']]);
      compPlot($('x3b-11-plot'), t => deriv(Af, t)[1], -T, T, tau,
        [-V.w2 * V.w2 * b + 2 * V.w1 * V.w2 * r, -(V.w1 * V.w1 + V.w3 * V.w3) * r, 2 * V.w2 * V.w3 * r], 'a_A components (m/s²)');
    }
  });
})();

subLabels();
})();
