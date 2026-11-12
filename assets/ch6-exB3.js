/* =========================================================
   Chapter 6, free-vibration examples 6.B.11 to 6.B.15
   Clip ids x6b-11 ... x6b-15. Each clip stores its geometry in st.g for the 3D views (ch6-3dB3.js).
   Every motion is the exact solution of the equation of motion used in the solution (6.B.15 integrates the
   nonlinear pendulum equation). Lengths are drawn at true scale. Each dashpot has a cylinder of fixed length and
   a rod of fixed length, and the layout is computed from the actual range of motion, so the piston always stays
   inside its cylinder and no part ever runs into another one, for every slider value.
   ========================================================= */
(function(){
const g0 = 9.81, DEG = Math.PI / 180;

/* ---------- shared helpers ---------- */
// cylinder and rod lengths for a dashpot whose end-to-end distance D varies between Dmin and Dmax.
// The cylinder (length Lc) is fixed to the base, the rod (length Lr) to the moving body. With these lengths the piston
// stays at least e inside both ends of the cylinder, and the cylinder never touches the moving body (requires Dmin ≥ Dmax − Dmin + 3e).
function dashGeom(Dmin, Dmax, e){ return { Lr: Dmax - Dmin + 2 * e, Lc: Dmin - e }; }
// smallest rest distance G that makes a dashpot fit when the moving end travels from G + lo to G + hi (lo ≤ 0 ≤ hi)
const restGap = (lo, hi, e) => (hi - lo) + 3 * e - lo;
// draw a dashpot from a fixed base point (bx, by) to a moving point (mx, my); Lc, Lr, hw in drawing units
function dashpot(ctx, bx, by, mx, my, Lc, Lr, hw, lab){
  const D = Math.hypot(mx - bx, my - by); if (D < 1e-6) return;
  const ux = (mx - bx) / D, uy = (my - by) / D, nx = -uy, ny = ux, p = D - Lr;
  ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = COL.fg;
  ctx.fillStyle = '#ece6d6';
  ctx.beginPath(); ctx.moveTo(bx + nx * hw, by + ny * hw); ctx.lineTo(bx + ux * Lc + nx * hw, by + uy * Lc + ny * hw);
  ctx.lineTo(bx + ux * Lc - nx * hw, by + uy * Lc - ny * hw); ctx.lineTo(bx - nx * hw, by - ny * hw); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx + ux * Lc + nx * hw, by + uy * Lc + ny * hw); ctx.lineTo(bx + nx * hw, by + ny * hw);
  ctx.lineTo(bx - nx * hw, by - ny * hw); ctx.lineTo(bx + ux * Lc - nx * hw, by + uy * Lc - ny * hw); ctx.stroke();
  // rod and piston
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(bx + ux * p, by + uy * p); ctx.lineTo(mx, my); ctx.stroke();
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(bx + ux * p + nx * (hw - 2.5), by + uy * p + ny * (hw - 2.5)); ctx.lineTo(bx + ux * p - nx * (hw - 2.5), by + uy * p - ny * (hw - 2.5)); ctx.stroke();
  ctx.restore();
  if (lab) txt(ctx, lab, bx + ux * Lc * 0.5 + nx * (hw + 12), by + uy * Lc * 0.5 + ny * (hw + 12), { color: COL.muted });
}
function arrowL(ctx, x, y, dx, dy, col, label, wd = 2.4){
  if (Math.hypot(dx, dy) < 3) return;
  arrow(ctx, x, y, x + dx, y + dy, col, wd);
  if (label){ const L = Math.hypot(dx, dy); txt(ctx, label, x + dx + dx / L * 13, y + dy + dy / L * 13, { color: col }); }
}
function rectW(ctx, x, y, w, h, fill, stroke = COL.fg){ ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.8; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.restore(); }
const holdLoop = (st, tEnd, hold) => { if (st.t > tEnd + hold){ st.t = 0; return true; } return false; };
// sampled free response of m x'' + c x' + k x = 0
function sample(m, c, k, x0, v0, T, n){ const out = []; for (let i = 0; i <= n; i++){ const t = T * i / n; out.push([t, lin2(t, m, c, k, x0, v0)[0]]); } return out; }
function props(m, c, k){ const wn = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m)), wd = z < 1 ? wn * Math.sqrt(1 - z * z) : 0; return { wn, z, wd }; }
// amplitude of the envelope ±A e^(−ζωn t) for an underdamped free response
function envA(m, c, k, x0, v0){ const { wn, z, wd } = props(m, c, k); return z < 1 ? Math.hypot(x0, (v0 + z * wn * x0) / wd) : NaN; }
// local maxima of a sampled curve (refined with a parabola through the three samples)
function peaks(pts){ const out = []; for (let i = 1; i < pts.length - 1; i++){ const a = pts[i - 1][1], b = pts[i][1], c = pts[i + 1][1];
  if (b > a && b >= c){ const den = a - 2 * b + c, d = den ? 0.5 * (a - c) / den : 0, h = pts[1][0] - pts[0][0]; out.push([pts[i][0] + d * h, b - 0.25 * (a - c) * d]); } } return out; }

/* =========================================================
   6.B.11  Reading the damping coefficient from a free-response plot
   M = 2 kg; the book's curve is reproduced exactly by K = 2 N/m, C = 0.4 N·s/m, x(0) = 1, ẋ(0) = 1.
   Horizontal block on a smooth floor; x to the right from the position where the spring is unstretched.
   ========================================================= */
makeClip({
  id: 'x6b-11', speed: 1,
  controls: [
    { key: 'C', label: 'Damping coefficient C', min: 0, max: 1.6, step: 0.02, value: 0.4, unit: 'N·s/m', dec: 2 },
    { key: 'K', label: 'Spring stiffness K', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'N/m', dec: 2 }
  ],
  presets: C => [{ label: 'The system in the book', apply: () => C.set({ C: 0.4, K: 2 }) }, { label: 'Twice the damping', apply: () => C.set({ C: 0.8, K: 2 }) },
    { label: 'No damping', apply: () => C.set({ C: 0, K: 2 }) }, { label: 'Stiffer spring', apply: () => C.set({ C: 0.4, K: 5 }) }],
  reset(st){
    const V = st.V, M = 2; st.M = M; st.pts = sample(M, V.C, V.K, 1, 1, 30, 1500);
    const xs = st.pts.map(p => p[1]); st.lo = Math.min(0, ...xs); st.hi = Math.max(0, ...xs);
    st.pk = peaks(st.pts).filter(p => p[1] > 0.02);
    const e = 0.08; st.G = restGap(st.lo, st.hi, e); st.dg = dashGeom(st.G + st.lo, st.G + st.hi, e);
    st.A = envA(M, V.C, V.K, 1, 1);
  },
  step(st){ holdLoop(st, 30, 1.5); },
  draw(st){
    const cv = $('x6b-11-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 230, 250), DW = nr ? 440 : 800, V = st.V, M = st.M;
    const t = Math.min(st.t, 30), x = lin2(t, M, V.C, V.K, 1, 1)[0], bw = 0.5, bh = 0.4;
    const W = st.G + st.hi + bw + 0.6, S = (DW - 60) / W, x0 = 30, yF = nr ? 120 : 170;  // design units: S px per metre, wall at x0, floor at yF
    fitView(ctx, w, h, [0, 0, DW, yF + 60]);
    const X = q => x0 + q * S, bx = X(st.G + x);
    st.g = { x, G: st.G, Lc: st.dg.Lc, Lr: st.dg.Lr, bw, bh, lo: st.lo, hi: st.hi };
    hatch(ctx, x0, yF - Math.max(bh * S + 30, 60), x0, yF, 1); hatch(ctx, x0, yF, X(W), yF, 1);
    line(ctx, X(st.G), yF + 4, X(st.G), yF + 22, COL.muted, 1.2, [3, 3]); txt(ctx, 'x = 0', X(st.G), yF + 34, { font: '12px system-ui', color: COL.muted });
    const ys = yF - bh * S * (nr ? 0.8 : 0.72), yd = yF - bh * S * (nr ? 0.3 : 0.28);  // on phones the block is small: keep the coils clear of the cylinder
    springLine(ctx, x0, ys, bx, ys, 12, nr ? 3 : 6); txt(ctx, 'K', (x0 + bx) / 2, ys - 16, { color: COL.muted });
    dashpot(ctx, x0, yd, bx, yd, st.dg.Lc * S, st.dg.Lr * S, nr ? 4 : 7, 'C');
    rectW(ctx, bx, yF - bh * S, bw * S, bh * S, COL.mass, COL.massEdge); txt(ctx, 'M', bx + bw * S / 2, yF - bh * S / 2, { fixed: true });
    arrowL(ctx, bx + bw * S + 8, yF - bh * S - 14, 40, 0, COL.c3, 'x');
    txt(ctx, `t = ${fmt(t, 3)} s`, DW - 10, 16, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    txt(ctx, 'smooth floor', X(W) - 6, yF + 34, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // plot: the book's axes, the curve, its envelope and the peaks used for the logarithmic decrement
    const cur = st.pts.filter(p => p[0] <= t + 1e-9), ser = [{ pts: st.pts, color: COL.grid, width: 1.6 }, { pts: cur, color: HEAT, width: 2.6 }];
    if (isFinite(st.A) && V.C > 0){ const { wn, z } = props(M, V.C, V.K), env = []; for (let i = 0; i <= 150; i++){ const q = 30 * i / 150; env.push([q, st.A * Math.exp(-z * wn * q)]); }
      ser.push({ pts: env, color: COL.muted, width: 1.2, dash: [5, 4], guide: true }, { pts: env.map(p => [p[0], -p[1]]), color: COL.muted, width: 1.2, dash: [5, 4], guide: true }); }
    const pk = st.pk.slice(0, 5);
    plot($('x6b-11-plot'), { xmin: 0, xmax: 30, ymin: -1.5, ymax: 1.5, xlabel: 'time (s)', ylabel: 'x(t)', series: ser,
      points: pk.map((p, i) => ({ x: p[0], y: p[1], color: i === 0 || i === pk.length - 1 ? COL.c3 : COL.c1, r: 4.5 })).concat([{ x: t, y: x, color: HEAT }]) });
    statsEvery(st, 'x6b-11-stats', () => {
      const out = [['x', fmt(x, 3)]];
      if (pk.length >= 2){ const n = pk.length - 1, Td = (pk[n][0] - pk[0][0]) / n, dl = Math.log(pk[0][1] / pk[n][1]) / n, z = dl / Math.sqrt(4 * Math.PI ** 2 + dl * dl), wn = 2 * Math.PI / (Td * Math.sqrt(1 - z * z));
        out.push([`T_d from peaks 1 to ${n + 1}`, fmt(Td, 4) + ' s'], ['δ = ln(x_1/x_' + (n + 1) + ')/' + n, fmt(dl, 4)], ['ζ from δ', fmt(z, 4)], ['C = 2ζω_n M', fmt(2 * z * wn * M, 4) + ' N·s/m', true]); }
      else out.push(['peaks', 'not enough for δ']);
      return out; });
  }
});

/* =========================================================
   6.B.12  Block released from rest under gravity: overshoot past static equilibrium
   y = displacement down from the position where the spring is unstretched (released there from rest).
   ========================================================= */
makeClip({
  id: 'x6b-12', speed: 0.5,
  controls: [
    { key: 'm', label: 'Mass m', min: 1, max: 10, step: 0.1, value: 5, unit: 'kg', dec: 2 },
    { key: 'c', label: 'Damping c', min: 0, max: 60, step: 0.5, value: 6, unit: 'N·s/m', dec: 1 },
    { key: 'k', label: 'Stiffness k', min: 60, max: 500, step: 5, value: 180, unit: 'N/m', dec: 0 }
  ],
  presets: C => [{ label: 'Book values', apply: () => C.set({ m: 5, c: 6, k: 180 }) }, { label: 'No damping', apply: () => C.set({ c: 0 }) },
    { label: 'Critical damping', apply: () => C.set({ c: Math.round(2 * Math.sqrt(C.v.k * C.v.m) * 2) / 2 }) }],
  reset(st){
    const V = st.V; st.dst = V.m * g0 / V.k; st.T0 = 0.6; st.T = 8;
    st.pts = sample(V.m, V.c, V.k, -st.dst, 0, st.T, 1600);                      // x = y − δ_st (from equilibrium, down positive)
    const ys = st.pts.map(p => p[1] + st.dst); st.lo = Math.min(0, ...ys); st.hi = Math.max(0, ...ys);
    const e = 0.03; st.L0 = Math.max(0.25, restGap(st.lo, st.hi, e)); st.dg = dashGeom(st.L0 + st.lo, st.L0 + st.hi, e);
    const { wn, z, wd } = props(V.m, V.c, V.k); Object.assign(st, { wn, z, wd });
    st.os = z < 1 ? st.dst * Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)) : 0;
    st.osMeas = Math.max(...st.pts.map(p => p[1]));
  },
  step(st){ holdLoop(st, st.T0 + st.T, 1.2); },
  draw(st){
    const cv = $('x6b-12-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 360, 380), V = st.V, DW = nr ? 420 : 520, DH = 360;
    const tau = Math.max(0, st.t - st.T0), x = st.t < st.T0 ? -st.dst : lin2(Math.min(tau, st.T), V.m, V.c, V.k, -st.dst, 0)[0], y = x + st.dst;
    const bw = 0.3, bh = 0.22, Htot = st.L0 + st.hi + bh + 0.15, S = (DH - 50) / Htot, yC = 26, cx = DW * 0.42;
    fitView(ctx, w, h, [0, 0, DW, DH]);
    const Y = q => yC + q * S, top = Y(st.L0 + y);
    st.g = { y, L0: st.L0, Lc: st.dg.Lc, Lr: st.dg.Lr, bw, bh, dst: st.dst, hi: st.hi };
    hatch(ctx, cx - 90, yC, cx + 90, yC, -1);
    const xd = cx - bw * S * 0.28, xs = cx + bw * S * 0.28;
    dashpot(ctx, xd, yC, xd, top, st.dg.Lc * S, st.dg.Lr * S, 7);
    springLine(ctx, xs, yC, xs, top, 10, 6);
    txt(ctx, 'c', xd - 22, yC + st.dg.Lc * S * 0.5, { color: COL.muted }); txt(ctx, 'k', xs + 22, yC + (top - yC) * 0.5, { color: COL.muted });
    rectW(ctx, cx - bw * S / 2, top, bw * S, bh * S, COL.mass, COL.massEdge); txt(ctx, 'm', cx, top + bh * S / 2, { fixed: true });
    // reference levels: unstretched spring (release) and static equilibrium
    const yU = Y(st.L0), yE = Y(st.L0 + st.dst), xr = cx + bw * S / 2 + 14;
    line(ctx, xr, yU, xr + 70, yU, COL.muted, 1.2, [4, 4]); txt(ctx, 'released here', xr + 74, yU, { font: '12px system-ui', color: COL.muted, align: 'left' });
    line(ctx, xr, yE, xr + 70, yE, COL.c3, 1.4, [4, 4]); txt(ctx, 'static equilibrium', xr + 74, yE, { font: '12px system-ui', color: COL.c3, align: 'left' });
    const yO = Y(st.L0 + st.dst + st.osMeas); line(ctx, xr, yO, xr + 70, yO, HEAT, 1.4, [2, 3]); txt(ctx, 'largest overshoot', xr + 74, yO, { font: '12px system-ui', color: HEAT, align: 'left' });
    arrowL(ctx, cx - bw * S / 2 - 30, top, 0, 36, COL.c4, 'x');
    txt(ctx, st.t < st.T0 ? 'held at rest' : `t = ${fmt(tau, 3)} s`, DW - 8, 14, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const cur = st.pts.filter(p => p[0] <= tau + 1e-9), ser = [{ pts: st.pts, color: COL.grid, width: 1.6 }, { pts: st.t < st.T0 ? [] : cur, color: HEAT, width: 2.6 }];
    if (st.z < 1 && V.c > 0){ const env = []; for (let i = 0; i <= 120; i++){ const q = st.T * i / 120; env.push([q, st.dst * Math.exp(-st.z * st.wn * q) / Math.sqrt(1 - st.z * st.z)]); }
      ser.push({ pts: env, color: COL.muted, width: 1.2, dash: [5, 4] }, { pts: env.map(p => [p[0], -p[1]]), color: COL.muted, width: 1.2, dash: [5, 4] }); }
    const ym = st.dst * 1.15 / Math.max(Math.sqrt(1 - Math.min(st.z, 0.9) ** 2), 0.4);
    plot($('x6b-12-plot'), { xmin: 0, xmax: st.T, ymin: -ym, ymax: ym, xlabel: 'time after release (s)', ylabel: 'x (m), down from equilibrium', series: ser,
      hlines: [{ y: st.osMeas, color: HEAT }], points: [{ x: Math.min(tau, st.T), y: x, color: HEAT }] });
    statsEvery(st, 'x6b-12-stats', () => [['δ_st = mg/k', fmt(st.dst, 4) + ' m'], ['ω_n', fmt(st.wn, 4) + ' rad/s'], ['ζ', fmt(st.z, 4)],
      ['overshoot (formula)', fmt(st.os, 4) + ' m', true], ['overshoot (simulation)', fmt(Math.max(0, st.osMeas), 4) + ' m'], ['x', fmt(x, 4) + ' m']]);
  }
});

/* =========================================================
   6.B.13  Block A (2m) slides along B's smooth base and sticks to B's upright; B (m) is held by k and c to the wall.
   x = displacement of B to the LEFT from its rest position (spring unstretched). Approach shown in slow motion.
   ========================================================= */
makeClip({
  id: 'x6b-13', speed: 0.5,
  controls: [
    { key: 'v', label: 'Speed of A, v', min: 5, max: 40, step: 0.5, value: 30, unit: 'm/s', dec: 1 },
    { key: 'k', label: 'Stiffness k', min: 600, max: 6000, step: 50, value: 3000, unit: 'N/m', dec: 0 },
    { key: 'c', label: 'Damping c', min: 0, max: 300, step: 1, value: 30, unit: 'N·s/m', dec: 0 },
    { key: 'm', label: 'Mass m of B', min: 5, max: 20, step: 0.5, value: 10, unit: 'kg', dec: 1 }
  ],
  presets: C => [{ label: 'Book values', apply: () => C.set({ v: 30, k: 3000, c: 30, m: 10 }) }, { label: 'Heavier damping', apply: () => C.set({ c: 150 }) }],
  reset(st){
    const V = st.V, M = 3 * V.m; st.V0 = 2 * V.v / 3; st.Ta = 1.0; st.gap = 1.1; st.T = 8;          // display time of the approach, initial gap A–post (m)
    st.pts = sample(M, V.c, V.k, 0, st.V0, st.T, 2400);
    const xs = st.pts.map(p => p[1]); st.xL = Math.max(0, ...xs); st.xR = -Math.min(0, ...xs);
    const e = 0.08; st.G = restGap(-st.xL, st.xR, e); st.dg = dashGeom(st.G - st.xL, st.G + st.xR, e);
    Object.assign(st, props(M, V.c, V.k)); st.Amp = st.z < 1 ? st.V0 / st.wd : NaN;
  },
  step(st){ holdLoop(st, st.Ta + st.T, 1.2); },
  draw(st){
    const cv = $('x6b-13-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 220, 230), V = st.V, DW = nr ? 440 : 820, M = 3 * V.m;
    const pre = st.t < st.Ta, tau = pre ? 0 : Math.min(st.t - st.Ta, st.T), x = pre ? 0 : lin2(tau, M, V.c, V.k, 0, st.V0)[0], xd = pre ? 0 : lin2(tau, M, V.c, V.k, 0, st.V0)[1];
    const tp = 0.08, ph = 0.62, Lp = 1.7, pt = 0.06, aS = 0.32;                         // upright thickness and height, plate length and thickness, size of A
    const W = st.G + st.xR + Lp + st.gap + aS + 0.5, S = (DW - 50) / W, x0 = 26, yF = 66 + ph * S, DH = yF + 64;
    fitView(ctx, w, h, [0, 0, DW, DH]);
    const X = q => x0 + q * S, post = st.G - x;                                         // left face of the upright (m from the wall)
    const aL = pre ? post + tp + st.gap * (1 - st.t / st.Ta) : post + tp;               // left face of A
    st.g = { x, post, aL, G: st.G, Lc: st.dg.Lc, Lr: st.dg.Lr, tp, ph, Lp, pt, aS, stuck: !pre, W };
    hatch(ctx, x0, yF - ph * S - 20, x0, yF, 1); hatch(ctx, x0, yF, X(W), yF, 1);
    const yS = yF - ph * S * (nr ? 0.8 : 0.75), yD = yF - ph * S * (nr ? 0.3 : 0.32);
    springLine(ctx, x0, yS, X(post), yS, 14, nr ? 3 : 6); txt(ctx, 'k', (x0 + X(post)) / 2, yS - 16, { color: COL.muted });
    dashpot(ctx, x0, yD, X(post), yD, st.dg.Lc * S, st.dg.Lr * S, nr ? 4 : 7, 'c');
    // B: an L-shaped carriage (upright + base plate) on the smooth floor
    ctx.save(); ctx.fillStyle = '#c9ccd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath();
    ctx.moveTo(X(post), yF - ph * S); ctx.lineTo(X(post + tp), yF - ph * S); ctx.lineTo(X(post + tp), yF - pt * S); ctx.lineTo(X(post + Lp), yF - pt * S);
    ctx.lineTo(X(post + Lp), yF); ctx.lineTo(X(post), yF); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'B (m)', X(post + tp / 2), yF - ph * S - 14);
    rectW(ctx, X(aL), yF - (pt + aS) * S, aS * S, aS * S, '#8f97a6');
    if (aS * S >= 24){ txt(ctx, 'A', X(aL + aS / 2), yF - (pt + aS / 2) * S, { fixed: true, color: '#fff' }); txt(ctx, '2m', X(aL + aS) + 16, yF - (pt + aS * 0.5) * S); }
    else txt(ctx, 'A (2m)', X(aL + aS / 2), yF - (pt + aS) * S - 30);              // block too small on phones for a label inside it
    if (pre) arrowL(ctx, X(aL + aS), yF - (pt + aS) * S - 12, -40, 0, COL.c1, 'v');
    else arrowL(ctx, X(post + tp / 2), yF - ph * S - 36, -Math.max(-60, Math.min(60, xd * 3)), 0, COL.c1, 'ẋ');
    line(ctx, X(st.G), yF + 4, X(st.G), yF + 20, COL.muted, 1.2, [3, 3]); txt(ctx, 'x = 0', X(st.G), yF + 32, { font: '12px system-ui', color: COL.muted });
    arrowL(ctx, X(st.G) - 8, yF + 46, -34, 0, COL.c3, '+x');
    txt(ctx, pre ? `approach in slow motion (×${fmt(st.gap / V.v / st.Ta, 2)})` : `after impact, t = ${fmt(tau, 3)} s`, DW - 8, 16, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const cur = pre ? [] : st.pts.filter(p => p[0] <= tau + 1e-9), ser = [{ pts: st.pts, color: COL.grid, width: 1.6 }, { pts: cur, color: HEAT, width: 2.4 }];
    if (isFinite(st.Amp) && V.c > 0){ const env = []; for (let i = 0; i <= 120; i++){ const q = st.T * i / 120; env.push([q, st.Amp * Math.exp(-st.z * st.wn * q)]); }
      ser.push({ pts: env, color: COL.muted, width: 1.2, dash: [5, 4] }, { pts: env.map(p => [p[0], -p[1]]), color: COL.muted, width: 1.2, dash: [5, 4] }); }
    const ym = 1.08 * Math.max(st.xL, st.xR, isFinite(st.Amp) ? st.Amp : 0, 0.05);
    plot($('x6b-13-plot'), { xmin: 0, xmax: st.T, ymin: -ym, ymax: ym, xlabel: 'time after impact (s)', ylabel: 'x (m), left positive', series: ser, points: pre ? [] : [{ x: tau, y: x, color: HEAT }] });
    statsEvery(st, 'x6b-13-stats', () => [['V_0 = 2v/3', fmt(st.V0, 4) + ' m/s'], ['ω_n = √(k/3m)', fmt(st.wn, 4) + ' rad/s'], ['ζ', fmt(st.z, 4)],
      ['amplitude V_0/ω_d', isFinite(st.Amp) ? fmt(st.Amp, 4) + ' m' : '—', true], ['x', fmt(x, 4) + ' m'], ['energy lost at impact', '1/3 of ½(2m)v²']]);
  }
});

/* =========================================================
   6.B.14  Bar pinned at O moving in a horizontal plane, spring at a, dashpot at the end b (top view)
   Linearized EOM (⅓mb²)θ'' + c b² θ' + k a² θ = 0.  θ counterclockwise; the anchor rail is on the +θ side.
   ========================================================= */
makeClip({
  id: 'x6b-14', speed: 0.25,
  controls: [
    { key: 'm', label: 'Bar mass m', min: 1, max: 10, step: 0.1, value: 3, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 50, max: 600, step: 5, value: 200, unit: 'N/m', dec: 0 },
    { key: 'a', label: 'Spring position a', min: 0.3, max: 1.0, step: 0.02, value: 0.7, unit: 'm', dec: 2 },
    { key: 'c', label: 'Damping c', min: 0, max: 60, step: 0.1, value: 16.5, unit: 'N·s/m', dec: 2 },
    { key: 'th0', label: 'Initial angle θ_0', min: 2, max: 10, step: 0.5, value: 8, unit: '°', dec: 1 }
  ],
  presets: C => { const ccr = () => 2 * C.v.a / 1.2 * Math.sqrt(C.v.k * C.v.m / 3);
    return [{ label: '¼ c_cr', apply: () => C.set({ c: +(ccr() / 4).toFixed(2) }) }, { label: 'c_cr (critical)', apply: () => C.set({ c: +ccr().toFixed(2) }) }, { label: '2 c_cr', apply: () => C.set({ c: +(2 * ccr()).toFixed(2) }) }]; },
  reset(st){
    const V = st.V, b = 1.2; st.b = b; st.T = 3;
    const me = V.m * b * b / 3, ce = V.c * b * b, ke = V.k * V.a * V.a; Object.assign(st, { me, ce, ke }, props(me, ce, ke));
    st.ccr = 2 * V.a / b * Math.sqrt(V.k * V.m / 3);
    st.pts = sample(me, ce, ke, V.th0 * DEG, 0, st.T, 1200);
    const ths = st.pts.map(p => p[1]); st.tmin = Math.min(0, ...ths); st.tmax = Math.max(0, ...ths);
    // rail distance H: smallest value for which the dashpot at the bar's end fits over the whole motion (exact geometry)
    const e = 0.03, Dof = (H, th) => Math.hypot(b - b * Math.cos(th), H - b * Math.sin(th));
    let H = 0.2; for (let it = 0; it < 200; it++){ const Ds = ths.map(th => Dof(H, th)), lo = Math.min(...Ds), hi = Math.max(...Ds); if (lo >= hi - lo + 3 * e) break; H += 0.01; }
    st.H = H; const Ds = ths.map(th => Dof(H, th)); st.dg = dashGeom(Math.min(...Ds), Math.max(...Ds), e);
  },
  step(st){ holdLoop(st, st.T, 1.0); },
  draw(st){
    const cv = $('x6b-14-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 300, 320), V = st.V, DW = nr ? 420 : 560, DH = 300, b = st.b;
    const t = Math.min(st.t, st.T), th = lin2(t, st.me, st.ce, st.ke, V.th0 * DEG, 0)[0];
    const S = (DW - 110) / (b + 0.15), ox = 56, oy = 60 + st.H * S, P = (q, r) => [ox + q * S, oy - r * S];
    fitView(ctx, w, h, [0, 0, DW, DH]);
    st.g = { th, H: st.H, a: V.a, b, Lc: st.dg.Lc, Lr: st.dg.Lr };
    hatch(ctx, ox - 22, oy - 40, ox - 22, oy + 40, 1);                                   // wall with the pin bracket at O
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox - 22, oy - 18); ctx.lineTo(ox, oy - 8); ctx.lineTo(ox, oy + 8); ctx.lineTo(ox - 22, oy + 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const [rx0, ry] = P(V.a - 0.25, st.H), [rx1] = P(b + 0.12, st.H); hatch(ctx, Math.min(rx0, P(b - 0.3, 0)[0]), ry, rx1, ry, -1);   // anchor rail
    const c = Math.cos(th), s = Math.sin(th), A = P(V.a * c, V.a * s), B = P(b * c, b * s);
    springLine(ctx, P(V.a, st.H)[0], ry, A[0], A[1], 10, 6); txt(ctx, 'k', P(V.a, st.H)[0] - 18, (ry + A[1]) / 2, { color: COL.muted });
    dashpot(ctx, P(b, st.H)[0], ry, B[0], B[1], st.dg.Lc * S, st.dg.Lr * S, 7); txt(ctx, 'c', P(b, st.H)[0] + 22, ry + st.dg.Lc * S * 0.5, { color: COL.muted });
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(-th); ctx.fillStyle = '#c9ccd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
    ctx.fillRect(-6, -7, b * S + 6, 14); ctx.strokeRect(-6, -7, b * S + 6, 14); ctx.restore();
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox - 4, oy + 26);
    // θ: angle from the rest position (dashed)
    line(ctx, ox, oy, ox + b * S + 10, oy, COL.muted, 1.2, [4, 4]);
    txt(ctx, `θ = ${fmt(th / DEG, 2)}°`, ox + b * S * 0.55, oy + 28, { color: COL.c2 });
    txt(ctx, 'top view (horizontal plane)', DW - 8, DH - 10, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    txt(ctx, `t = ${fmt(t, 3)} s`, DW - 8, 14, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const cur = st.pts.filter(p => p[0] <= t + 1e-9);
    plot($('x6b-14-plot'), { xmin: 0, xmax: st.T, ymin: -V.th0 * 1.05, ymax: V.th0 * 1.1, xlabel: 'time (s)', ylabel: 'θ (degrees)',
      series: [{ pts: st.pts.map(p => [p[0], p[1] / DEG]), color: COL.grid, width: 1.6 }, { pts: cur.map(p => [p[0], p[1] / DEG]), color: COL.c2, width: 2.6 }],
      hlines: [{ y: 0, color: COL.axis }], points: [{ x: t, y: th / DEG, color: COL.c2 }] });
    statsEvery(st, 'x6b-14-stats', () => [['c_cr = (2a/b)√(km/3)', fmt(st.ccr, 4) + ' N·s/m', true], ['c / c_cr = ζ', fmt(V.c / st.ccr, 4)],
      ['ω_n = (a/b)√(3k/m)', fmt(st.wn, 4) + ' rad/s'], ['regime', st.z < 0.995 ? 'underdamped' : st.z > 1.005 ? 'overdamped' : 'critically damped'], ['θ', fmt(th / DEG, 3) + '°']]);
  }
});

/* =========================================================
   6.B.15  Baseball bat swinging about a pin O through its knob: centre of percussion from the period
   The bat is a solid of revolution (34 in, ash-like wood); m, d and I_O are computed from its profile.
   Nonlinear EOM I_O θ'' = −m g d sin θ − c_t θ'.
   ========================================================= */
const BAT = (() => {
  const L = 0.864, rho = 620, sO = 0.03, N = 2000;
  const r = s => { if (s < 0.016) return 0.0235; if (s < 0.30) return 0.0122 + 0.0013 * (s - 0.016) / 0.284;
    if (s < 0.62){ const u = (s - 0.30) / 0.32; return 0.0135 + (0.0325 - 0.0135) * (3 * u * u - 2 * u * u * u); }
    if (s < 0.85) return 0.0325; return 0.0325 * Math.sqrt(Math.max(0, 1 - 0.6 * ((s - 0.85) / 0.016) ** 2)); };
  let m = 0, ms = 0, I = 0; const ds = L / N;
  for (let i = 0; i <= N; i++){ const s = i * ds, rr = r(s), wgt = (i === 0 || i === N) ? 0.5 : 1, dm = rho * Math.PI * rr * rr * ds * wgt; m += dm; ms += dm * s; I += dm * ((s - sO) ** 2 + rr * rr / 4); }
  const sG = ms / m, d = sG - sO, h = I / (m * d);
  const prof = []; for (let i = 0; i <= 60; i++){ const s = L * i / 60; prof.push([s, r(s)]); }
  return { L, sO, m, I, d, h, sG, r, prof };
})();
window.BAT6B15 = BAT;   // shared with the 3D view
makeClip({
  id: 'x6b-15', speed: 1,
  controls: [
    { key: 'th0', label: 'Release angle θ_0', min: 3, max: 45, step: 1, value: 15, unit: '°', dec: 0 },
    { key: 'ct', label: 'Pivot friction (damping) c_t', min: 0, max: 0.05, step: 0.001, value: 0, unit: 'N·m·s', dec: 3 }
  ],
  presets: C => [{ label: 'Small swing (15°)', apply: () => C.set({ th0: 15, ct: 0 }) }, { label: 'Large swing (45°)', apply: () => C.set({ th0: 45, ct: 0 }) }, { label: 'With a little friction', apply: () => C.set({ th0: 15, ct: 0.02 }) }],
  reset(st){
    const V = st.V, B = BAT, T = 12, dt = 1 / 400; st.T = T;
    const f = (t, s) => [s[1], (-B.m * g0 * B.d * Math.sin(s[0]) - V.ct * s[1]) / B.I];
    let s = [V.th0 * DEG, 0]; st.pts = [[0, s[0]]];
    for (let i = 1; i <= T / dt; i++){ s = rk4(f, (i - 1) * dt, s, dt); st.pts.push([i * dt, s[0]]); }
    st.wn = Math.sqrt(B.m * g0 * B.d / B.I);
    // measured period: time between downward zero crossings of θ
    const zc = []; for (let i = 1; i < st.pts.length; i++){ const a = st.pts[i - 1][1], b = st.pts[i][1]; if (a > 0 && b <= 0) zc.push(st.pts[i - 1][0] + dt * a / (a - b)); }
    st.Tm = zc.length >= 2 ? (zc[zc.length - 1] - zc[0]) / (zc.length - 1) : NaN;
  },
  step(st){ holdLoop(st, st.T, 0.6); },
  draw(st){
    const cv = $('x6b-15-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 360, 380), V = st.V, B = BAT, DW = nr ? 400 : 480, DH = 360;
    const t = Math.min(st.t, st.T), i = Math.min(st.pts.length - 1, Math.round(t * 400)), th = st.pts[i][1];
    const S = (DH - 60) / (B.L + 0.02), ox = DW * 0.45, oy = 34;
    fitView(ctx, w, h, [0, 0, DW, DH]);
    st.g = { th };
    // ceiling bracket with a horizontal pin through the knob
    hatch(ctx, ox - 70, oy - 22, ox + 70, oy - 22, -1);
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox - 16, oy - 22); ctx.lineTo(ox - 6, oy); ctx.lineTo(ox + 6, oy); ctx.lineTo(ox + 16, oy - 22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, ox, oy, ox, oy + (B.L - B.sO) * S + 10, COL.muted, 1.2, [4, 4]);
    // the bat outline, rotated by θ about O (s measured from the knob; O at s = sO)
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(-th); ctx.fillStyle = '#d8b07a'; ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.4; ctx.beginPath();
    B.prof.forEach(([s, r], k) => { const yy = (s - B.sO) * S, xx = r * S; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
    B.prof.slice().reverse().forEach(([s, r]) => ctx.lineTo(-r * S, (s - B.sO) * S)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox - 22, oy + 4);
    const at = q => [ox + Math.sin(th) * q * S, oy + Math.cos(th) * q * S], Gp = at(B.d), Pp = at(B.h);
    ctx.save(); ctx.fillStyle = COL.fg; [Gp, Pp].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 2 * Math.PI); ctx.fill(); }); ctx.restore();
    txt(ctx, 'G', Gp[0] + 18 * Math.cos(th), Gp[1] - 18 * Math.sin(th)); txt(ctx, 'P', Pp[0] + 18 * Math.cos(th), Pp[1] - 18 * Math.sin(th), { color: HEAT });
    txt(ctx, `θ = ${fmt(th / DEG, 2)}°`, ox + 70, oy + 34, { color: COL.c2 });
    txt(ctx, `t = ${fmt(t, 3)} s`, DW - 8, DH - 10, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const cur = st.pts.filter((p, k) => k % 4 === 0 && p[0] <= t + 1e-9).map(p => [p[0], p[1] / DEG]), lin = [];
    for (let k = 0; k <= 300; k++){ const q = st.T * k / 300; lin.push([q, V.th0 * Math.cos(st.wn * q)]); }
    plot($('x6b-15-plot'), { xmin: 0, xmax: st.T, ymin: -V.th0 * 1.1, ymax: V.th0 * 1.1, xlabel: 'time (s)', ylabel: 'θ (degrees)',
      series: [{ pts: lin, color: COL.muted, width: 1.2, dash: [5, 4] }, { pts: st.pts.filter((p, k) => k % 4 === 0).map(p => [p[0], p[1] / DEG]), color: COL.grid, width: 1.6 }, { pts: cur, color: COL.c2, width: 2.6 }],
      points: [{ x: t, y: th / DEG, color: COL.c2 }] });
    statsEvery(st, 'x6b-15-stats', () => [['m', fmt(B.m, 4) + ' kg'], ['d = OG', fmt(B.d, 4) + ' m'], ['I_O', fmt(B.I, 4) + ' kg·m²'],
      ['ω_n = √(mgd/I_O)', fmt(st.wn, 4) + ' rad/s'], ['period from the swing', fmt(st.Tm, 4) + ' s'], ['h = gT²/4π² (measured)', fmt(g0 * st.Tm ** 2 / (4 * Math.PI ** 2), 4) + ' m', true], ['h = I_O/(md)', fmt(B.h, 4) + ' m']]);
  }
});

subLabels();
})();
