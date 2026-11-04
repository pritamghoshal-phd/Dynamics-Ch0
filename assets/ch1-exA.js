/* =========================================================
   Chapter 1, Section A examples (planar descriptions): 1.A.1 – 1.A.4
   Clip ids x1a-1 … x1a-4. The 3D views (ch1-3dA.js) read the same clip state.
   ========================================================= */
(function(){
const TAU = 2 * Math.PI;
const nrm = a => Math.hypot(...a);
// world → canvas with equal scales, y up. bb = [xmin, xmax, ymin, ymax]
function view(w, h, bb, pad = 22){
  const s = Math.min((w - 2 * pad) / (bb[1] - bb[0]), (h - 2 * pad) / (bb[3] - bb[2]));
  const cx = w / 2 - s * (bb[0] + bb[1]) / 2, cy = h / 2 + s * (bb[2] + bb[3]) / 2;
  return { P: (x, y) => [cx + s * x, cy - s * y], s };
}
// arrow from world point p along world vector v·k (k in world units per unit of v), clamped to maxPx pixels
function warrow(ctx, P, s, p, v, k, col, label, maxPx = 150, wd = 3){
  const L = nrm(v) * k * s; if (!(L > 3)) return;
  const f = L > maxPx ? maxPx / L : 1;
  const [x1, y1] = P(p[0], p[1]), x2 = x1 + v[0] * k * s * f, y2 = y1 - v[1] * k * s * f;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label){ const ux = x2 - x1, uy = y2 - y1, l = Math.hypot(ux, uy) || 1; txt(ctx, label, x2 + ux / l * 14, y2 + uy / l * 12, { color: col, font: 'italic 15px Georgia, serif' }); }
}
function dot(ctx, x, y, r = 6, col = COL.c1){ ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.card; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
function poly(ctx, P, pts, col, wd = 1.5, alpha = 1, dash){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = alpha; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
}
function caption(ctx, s, x, y, col = COL.muted, align = 'left'){ txt(ctx, s, x, y, { font: '12px system-ui, sans-serif', color: col, align }); }
function holdChips(st, label, setFn){ return [{ label, apply: () => { setFn(); st.hold = true; } }, { label: '▶ Keep moving', apply: () => { st.hold = false; } }]; }
const vstr = (v, u, d = 4) => `${fmt(v[0], d)} î ${v[1] < 0 ? '−' : '+'} ${fmt(Math.abs(v[1]), d)} ĵ ${u}`;

/* ---------------------------------------------------------------- 1.A.1
   Pin P on a fixed elliptical ring x²/a² + y²/b² = 1 and in a horizontal slot that rises at constant speed v.
   P is on the left half of the ring (x < 0). State: st.y (mm), st.x, st.xd, st.xdd. */
makeClip({
  id: 'x1a-1', speed: 0.5,
  controls: [
    { key: 'a', label: 'Semi-axis a', min: 2, max: 8, step: 0.1, value: 5, unit: 'mm', dec: 2 },
    { key: 'b', label: 'Semi-axis b', min: 4, max: 14, step: 0.1, value: 10, unit: 'mm', dec: 2 },
    { key: 'v', label: 'Slot speed v', min: 5, max: 60, step: 1, value: 30, unit: 'mm/s', dec: 1 }
  ],
  presets: (C, st) => holdChips(st, '⏸ Stop at y = 6 mm', () => { st.y = Math.min(6, 0.95 * st.V.b); }),
  reset(st){ st.y = -0.95 * st.V.b; st.hold = false; },
  step(st, dt){
    if (!st.hold){ st.y += st.V.v * dt * 0.35; if (st.y > 0.95 * st.V.b) st.y = -0.95 * st.V.b; }
    const { a, b, v } = st.V, y = st.y; st.x = -a * Math.sqrt(Math.max(0, 1 - y * y / b / b));
    st.xd = -(a * a / b / b) * y * v / st.x; st.xdd = -((a * a / b / b) * v * v + st.xd * st.xd) / st.x;
  },
  draw(st){
    const cv = $('x1a-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { a, b, v } = st.V, y = st.y;
    if (st.x === undefined){ st.x = -a * Math.sqrt(Math.max(0, 1 - y * y / b / b)); st.xd = -(a * a / b / b) * y * v / st.x; st.xdd = -((a * a / b / b) * v * v + st.xd * st.xd) / st.x; }
    const x = st.x, xd = st.xd, xdd = st.xdd, gx = -a - 6;
    const { P, s } = view(w, h, [gx - 4, a + 6, -b - 2.5, b + 3]);
    // ground, the fixed ring on its stand, the guide rod fixed to the ground and to the ceiling bracket
    const [g0x, g0y] = P(gx - 3, -b - 1), [g1x] = P(a + 5, -b - 1);
    line(ctx, g0x, g0y, g1x, g0y, COL.fg, 2); hatch(ctx, g1x, g0y, g0x, g0y, -1);
    const [cx, cy] = P(0, 0);
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; const [sx0, sy0] = P(-1.2, -b - 1), [sx1, sy1] = P(1.2, -b + 0.15);
    ctx.fillRect(sx0, sy1, sx1 - sx0, sy0 - sy1); ctx.strokeRect(sx0, sy1, sx1 - sx0, sy0 - sy1); ctx.restore();
    ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, a * s, b * s, 0, 0, TAU); ctx.stroke(); ctx.restore();
    line(ctx, ...P(-a - 1.5, 0), ...P(a + 4, 0), COL.axis, 1, [4, 3]); line(ctx, ...P(0, -b - 0.5), ...P(0, b + 2.2), COL.axis, 1, [4, 3]);
    txt(ctx, 'x', ...P(a + 4.6, 0), { color: COL.muted }); txt(ctx, 'y', ...P(0.7, b + 2.4), { color: COL.muted });
    txt(ctx, 'fixed ring', ...P(a + 2.2, -b + 1.2), { font: 'italic 12px Georgia, serif', color: COL.muted });
    line(ctx, ...P(gx, -b - 1), ...P(gx, b + 2.4), COL.spring, 3);
    const [bx, by] = P(gx, b + 2.4); line(ctx, bx - 18, by, bx + 18, by, COL.fg, 2); hatch(ctx, bx - 18, by, bx + 18, by, -1, 7, 6);
    // slider on the guide and the slotted arm (slot from the slider past the ring)
    const [px, py] = P(gx, y), [tx] = P(a + 1.5, y);
    block(ctx, px, py, 22, 28, 0, '');
    ctx.save(); ctx.strokeStyle = COL.massEdge; ctx.fillStyle = COL.mass; ctx.lineWidth = 2; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px + 11, py - 8, tx - px - 11, 16, 8); else ctx.rect(px + 11, py - 8, tx - px - 11, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.card; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(px + 18, py - 4, tx - px - 26, 8, 4); else ctx.rect(px + 18, py - 4, tx - px - 26, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    arrow(ctx, px - 26, py + 16, px - 26, py - 16, COL.c3, 2.4); txt(ctx, 'v', px - 38, py, { color: COL.c3 });
    // pin P with its velocity, the components of the velocity, and its acceleration
    const kv = 0.16, ka = 0.045, pP = [x, y];
        warrow(ctx, P, s, pP, [xd, v], kv, COL.c2, 'v_P', 150, 3.2); warrow(ctx, P, s, pP, [xdd, 0], ka, HEAT, '', 150, 3.2); { const L = Math.min(150, Math.abs(xdd) * ka * s), [qx0, qy0] = P(x, y); if (L > 3) txt(ctx, 'a_P', qx0 + L * 0.75, qy0 + 18, { color: HEAT }); }
    const [qx, qy] = P(x, y); dot(ctx, qx, qy, 6, COL.fg); txt(ctx, 'P', qx + (xd > 0 ? -20 : 20), qy - 22);
    if (st.hold) caption(ctx, 'held at the instant in the problem', 10, 14, COL.c2);
    statsEvery(st, 'x1a-1-stats', () => [['y', fmt(y) + ' mm'], ['x (left half)', fmt(x) + ' mm'], ['ẋ', fmt(xd, 4) + ' mm/s', true], ['v_P', vstr([xd, v], 'mm/s')], ['ẍ', fmt(xdd, 4) + ' mm/s²', true], ['a_P', `${fmt(xdd, 4)} î mm/s²`]], 0.1);
  }
});

/* ---------------------------------------------------------------- 1.A.2
   x(t) = t³ + 10, y(t) = 2 cos 4t (inches, seconds). State: st.tau (s). */
const A2 = { tmax: 2.35 };
const a2 = t => ({ p: [t ** 3 + 10, 2 * Math.cos(4 * t)], v: [3 * t * t, -8 * Math.sin(4 * t)], a: [6 * t, -32 * Math.cos(4 * t)] });
const a2ang = t => { const { v, a } = a2(t), c = (v[0] * a[0] + v[1] * a[1]) / (nrm(v) * nrm(a) || 1); return Math.acos(Math.max(-1, Math.min(1, c))) / RAD; };
makeClip({
  id: 'x1a-2', speed: 0.5,
  presets: (C, st) => holdChips(st, '⏸ Stop at t = 2 s', () => { st.tau = 2; }),
  reset(st){ st.tau = 0; st.hold = false; },
  step(st, dt){ if (!st.hold){ st.tau += dt * 0.35; if (st.tau > A2.tmax) st.tau = 0; } },
  draw(st){
    const t = st.tau, { p, v, a } = a2(t);
    const cv = $('x1a-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { P, s } = view(w, h, [8.5, 24.5, -4.6, 4.6]);
    // x axis with tick marks every 2 in
    line(ctx, ...P(9, 0), ...P(24, 0), COL.axis, 1);
    for (let X = 10; X <= 24; X += 2){ const [tx, ty] = P(X, 0); line(ctx, tx, ty - 4, tx, ty + 4, COL.axis, 1); }
    for (let X = 10; X <= 22; X += 4) txt(ctx, String(X), ...P(X, -0.7), { font: '11px system-ui, sans-serif', color: COL.muted });
    txt(ctx, 'x (in)', ...P(23.4, 0.7), { font: '12px system-ui, sans-serif', color: COL.muted });
    const path = []; for (let i = 0; i <= 300; i++){ const u = A2.tmax * i / 300; path.push(a2(u).p); } poly(ctx, P, path, COL.axis, 1.5, 0.8, [6, 4]);
    const done = []; for (let i = 0; i <= 120; i++){ const u = t * i / 120; done.push(a2(u).p); } poly(ctx, P, done, COL.c1, 2.2, 0.8);
    const kv = 0.16, ka = 0.12;
    warrow(ctx, P, s, p, v, kv, COL.c2, 'v', 170, 3.2); warrow(ctx, P, s, p, a, ka, HEAT, 'a', 170, 3.2);
    // angle between v and a
    const [px, py] = P(...p), av = Math.atan2(-v[1], v[0]), aa = Math.atan2(-a[1], a[0]);
    if (nrm(v) > 0.5 && nrm(a) > 0.5){ let d = aa - av; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 26, av, av + d, d < 0); ctx.stroke(); ctx.restore();
      txt(ctx, 'φ', px + 40 * Math.cos(av + d / 2), py + 40 * Math.sin(av + d / 2), { color: COL.c4 }); }
    dot(ctx, px, py, 6); txt(ctx, 'P', px - 12, py + 16);
    if (st.hold) caption(ctx, 'held at t = 2 s', 10, 14, COL.c2);
    const hist = []; for (let i = 1; i <= 200; i++){ const u = A2.tmax * i / 200; hist.push([u, a2ang(u)]); }
    plot($('x1a-2-plot'), { xmin: 0, xmax: A2.tmax, ymin: 0, ymax: 180, xlabel: 'time t (s)', ylabel: 'angle φ between v and a (°)', vlines: [{ x: 2, color: COL.c2 }],
      series: [{ pts: hist, color: COL.c4, width: 2 }], points: t > 0.005 ? [{ x: t, y: a2ang(t), color: COL.c4, r: 5 }] : [] });
    statsEvery(st, 'x1a-2-stats', () => [['t', fmt(t, 3) + ' s'], ['r', vstr(p, 'in', 3)], ['v', vstr(v, 'in/s'), true], ['a', vstr(a, 'in/s²'), true], ['|v|, |a|', `${fmt(nrm(v))} in/s, ${fmt(nrm(a))} in/s²`], ['angle φ', fmt(t > 0.005 ? a2ang(t) : 0) + '°']], 0.1);
  }
});

/* ---------------------------------------------------------------- 1.A.3
   A jet on a curving path. The path is a clothoid (curvature grows linearly with distance) whose curvature at A
   is the value found in the problem, κ_A = a_n / v_A². The jet speeds up at a constant rate a_t.
   State: st.s (distance along the path, m), st.sp (speed, m/s), st.path (points), st.sA. */
function jetGlyph(ctx, x, y, heading, sc = 1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(-heading); ctx.scale(sc, sc); ctx.fillStyle = '#8f97a6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(10, -3); ctx.lineTo(0, -4); ctx.lineTo(-6, -16); ctx.lineTo(-11, -16); ctx.lineTo(-8, -4); ctx.lineTo(-16, -4); ctx.lineTo(-21, -10); ctx.lineTo(-24, -10); ctx.lineTo(-22, 0);
  ctx.lineTo(-24, 10); ctx.lineTo(-21, 10); ctx.lineTo(-16, 4); ctx.lineTo(-8, 4); ctx.lineTo(-11, 16); ctx.lineTo(-6, 16); ctx.lineTo(0, 4); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
const A3 = {
  build(st){
    const V = st.V, vA = V.v / 3.6, a = V.ng * 9.81, at = Math.min(V.at, 0.98 * a), an = Math.sqrt(a * a - at * at);
    st.vA = vA; st.at = at; st.an = an; st.kA = an / (vA * vA); st.rhoA = 1 / st.kA;
    st.sA = 2 * (30 * RAD) / st.kA; st.sEnd = 1.45 * st.sA;      // the heading at A is 30°
    st.v0 = Math.sqrt(Math.max(1, vA * vA - 2 * at * st.sA));
    const pts = []; let x = 0, y = 0; const n = 600, ds = st.sEnd / n;
    for (let i = 0; i <= n; i++){ const s = i * ds, th = st.kA * s * s / (2 * st.sA); pts.push([x, y, th, s]); const tm = st.kA * (s + ds / 2) ** 2 / (2 * st.sA); x += Math.cos(tm) * ds; y += Math.sin(tm) * ds; }
    st.path = pts;
  },
  at(st, s){ const n = st.path.length - 1, f = Math.max(0, Math.min(n, s / st.sEnd * n)), i = Math.min(n - 1, Math.floor(f)), u = f - i, p = st.path[i], q = st.path[i + 1];
    return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u]; }
};
makeClip({
  id: 'x1a-3', speed: 0.5,
  controls: [
    { key: 'v', label: 'Speed at A, v_A', min: 300, max: 900, step: 10, value: 600, unit: 'km/h', dec: 1 },
    { key: 'ng', label: 'Acceleration at A, |a| (in g)', min: 1, max: 6, step: 0.1, value: 2.5, unit: 'g', dec: 2 },
    { key: 'at', label: 'Tangential acceleration a_t', min: 0, max: 15, step: 0.5, value: 5, unit: 'm/s²', dec: 1 }
  ],
  presets: (C, st) => holdChips(st, '⏸ Stop at A', () => { st.s = st.sA; st.sp = st.vA; }),
  reset(st){ A3.build(st); st.s = 0; st.sp = st.v0; st.hold = false; },
  step(st, dt){
    if (st.hold) return;
    const h = dt * 1.6; st.s += st.sp * h + 0.5 * st.at * h * h; st.sp += st.at * h;
    if (st.s > st.sEnd){ st.s = 0; st.sp = st.v0; }
  },
  draw(st){
    if (!st.path) A3.build(st);
    const cv = $('x1a-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const ends = st.path.map(p => p[0]), ys = st.path.map(p => p[1]), xmin = Math.min(...ends), xmax = Math.max(...ends), ymax = Math.max(...ys);
    const sp = xmax - xmin, { P, s: sc } = view(w, h, [xmin - 0.04 * sp, xmax + 0.16 * sp, -0.1 * sp, ymax + 0.14 * sp]);
    const [x, y, th] = A3.at(st, st.s), kap = st.kA * st.s / st.sA, v = st.sp, an = v * v * kap, at = st.at;
    const et = [Math.cos(th), Math.sin(th)], en = [-Math.sin(th), Math.cos(th)];
    // ground far below, the path, point A
    poly(ctx, P, st.path, COL.axis, 1.6, 0.9, [7, 5]);
    const [Ax, Ay] = P(...A3.at(st, st.sA)); dot(ctx, Ax, Ay, 4, COL.fg); txt(ctx, 'A', Ax + 12, Ay + 14, { font: 'italic bold 15px Georgia, serif' });
    txt(ctx, 'path of the jet', ...P(xmin + 0.2 * sp, -0.05 * sp), { font: 'italic 12px Georgia, serif', color: COL.muted });
    // osculating circle at the jet: center C = r + ρ ê_n
    if (kap > 1e-6){ const rho = 1 / kap, C = [x + rho * en[0], y + rho * en[1]], [Cx, Cy] = P(...C);
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(Cx, Cy, rho * sc, 0, TAU); ctx.stroke(); ctx.restore();
      if (Cx > 0 && Cx < w && Cy > 0 && Cy < h){ dot(ctx, Cx, Cy, 3.5, COL.c4); txt(ctx, 'C', Cx + 12, Cy - 10, { color: COL.c4 });
        line(ctx, ...P(x, y), Cx, Cy, COL.c4, 1, [3, 3]); txt(ctx, 'ρ', (P(x, y)[0] + Cx) / 2 + 10, (P(x, y)[1] + Cy) / 2, { color: COL.c4 }); } }
    // jet, unit vectors and acceleration (components and total)
    const [jx, jy] = P(x, y), ue = 34 / sc;
    const narrow = w < 560;
    if (!narrow){ warrow(ctx, P, sc, [x, y], et, ue, COL.muted, 'ê_t', 200, 1.6); warrow(ctx, P, sc, [x, y], en, ue, COL.muted, 'ê_n', 200, 1.6); }
    const ka = 4.4 / sc;               // 4.4 px per m/s²
    warrow(ctx, P, sc, [x, y], [at * et[0], at * et[1]], ka, COL.c3, narrow ? '' : 'a_t', 200, 2.4);
    warrow(ctx, P, sc, [x, y], [an * en[0], an * en[1]], ka, COL.c3, narrow ? '' : 'a_n', 200, 2.4);
    warrow(ctx, P, sc, [x, y], [at * et[0] + an * en[0], at * et[1] + an * en[1]], ka, HEAT, 'a', 200, 3.2);
    jetGlyph(ctx, jx, jy, th, narrow ? 0.7 : 1);
    if (st.hold) caption(ctx, 'held at A', 10, 14, COL.c2);
    statsEvery(st, 'x1a-3-stats', () => [['speed v', fmt(v * 3.6, 4) + ' km/h = ' + fmt(v, 4) + ' m/s'], ['a_t', fmt(at) + ' m/s²'], ['a_n = v²/ρ', fmt(an, 4) + ' m/s²'], ['|a|', fmt(Math.hypot(at, an) / 9.81, 3) + ' g'],
      ['ρ now', kap > 1e-6 ? fmt(1 / kap, 4) + ' m' : '∞ (straight)'], ['ρ at A = v_A²/a_n', fmt(st.rhoA, 4) + ' m', true]], 0.1);
  }
});

/* ---------------------------------------------------------------- 1.A.4
   Spiral r = kθ with constant θ̇. State: st.th (rad). */
makeClip({
  id: 'x1a-4', speed: 0.5,
  controls: [{ key: 'k', label: 'Spiral constant k (r = kθ)', min: 1, max: 8, step: 0.5, value: 5, unit: 'm/rad', dec: 2 },
             { key: 'w', label: 'Rate θ̇ (constant)', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'rad/s', dec: 2 }],
  presets: (C, st) => holdChips(st, '⏸ Stop at θ = π', () => { st.th = Math.PI; }),
  reset(st){ st.th = 0.8; st.hold = false; },
  step(st, dt){ if (st.hold) return; st.th += st.V.w * dt * 0.6; if (st.th > 1.6 * Math.PI) st.th = 0.8; },
  draw(st){
    const { k, w: om } = st.V, th = st.th, r = k * th, rd = k * om;
    const er = [Math.cos(th), Math.sin(th)], et = [-Math.sin(th), Math.cos(th)];
    const vp = [rd, r * om], ap = [-r * om * om, 2 * rd * om];
    const v = [vp[0] * er[0] + vp[1] * et[0], vp[0] * er[1] + vp[1] * et[1]], a = [ap[0] * er[0] + ap[1] * et[0], ap[0] * er[1] + ap[1] * et[1]];
    const cv = $('x1a-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const R = k * 1.6 * Math.PI, { P, s } = view(w, h, [-R * 1.15, R * 0.8, -R * 0.95, R * 0.8]);
    line(ctx, ...P(-R * 1.1, 0), ...P(R * 0.75, 0), COL.axis, 1); line(ctx, ...P(0, -R * 0.9), ...P(0, R * 0.75), COL.axis, 1);
    txt(ctx, 'x', ...P(R * 0.72, -0.06 * R), { color: COL.muted }); txt(ctx, 'y', ...P(0.05 * R, R * 0.72), { color: COL.muted });
    const sp = []; for (let i = 0; i <= 300; i++){ const u = 1.6 * Math.PI * i / 300; sp.push([k * u * Math.cos(u), k * u * Math.sin(u)]); } poly(ctx, P, sp, COL.axis, 1.4, 0.8, [6, 4]);
    const p = [r * er[0], r * er[1]], [ox, oy] = P(0, 0), [px, py] = P(...p);
    line(ctx, ox, oy, px, py, COL.c1, 1.4, [5, 4]); { const L = Math.hypot(px - ox, py - oy) || 1, nx = (py - oy) / L, ny = -(px - ox) / L; txt(ctx, 'r', (ox + px) / 2 + 17 * nx, (oy + py) / 2 + 17 * ny, { color: COL.c1 }); }
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, 22, 0, -(th % TAU), true); ctx.stroke(); ctx.restore();
    { const ha = -(th % TAU) / 2 - 0.4; txt(ctx, 'θ', ox + 40 * Math.cos(ha), oy + 40 * Math.sin(ha), { color: COL.muted }); }
    const ue = 0.13 * R;
    warrow(ctx, P, s, p, er, ue, COL.c4, 'ê_r', 200, 2); warrow(ctx, P, s, p, et, ue, COL.c4, 'ê_{θ}', 200, 2);
    warrow(ctx, P, s, p, v, 0.3 * R / (k * om * Math.PI), COL.c2, 'v', 200, 3.2); warrow(ctx, P, s, p, a, 0.3 * R / (k * om * om * Math.PI), HEAT, 'a', 200, 3.2);
    dot(ctx, px, py, 7); txt(ctx, 'A', px - 14, py - 14); dot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 12, oy + 14);
    if (st.hold) caption(ctx, 'held at θ = π', 10, 14, COL.c2);
    statsEvery(st, 'x1a-4-stats', () => [['θ', fmt(th, 3) + ' rad'], ['v (polar)', `${fmt(vp[0])} ê_r + ${fmt(vp[1])} ê_{θ} m/s`, true], ['a (polar)', `${fmt(ap[0])} ê_r + ${fmt(ap[1])} ê_{θ} m/s²`, true], ['v (Cartesian)', vstr(v, 'm/s', 3)], ['a (Cartesian)', vstr(a, 'm/s²', 3)], ['|v|, |a|', `${fmt(nrm(v))} m/s, ${fmt(nrm(a))} m/s²`]], 0.1);
  }
});

subLabels();
})();
