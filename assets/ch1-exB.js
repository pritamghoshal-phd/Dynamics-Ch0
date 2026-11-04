/* =========================================================
   Chapter 1, Section B examples (3D descriptions): 1.B.1 – 1.B.2
   Clip ids x1b-1, x1b-2. The 3D views (ch1-3dB.js) read the same clip state.
   ========================================================= */
(function(){
const TAU = 2 * Math.PI;
const nrm = a => Math.hypot(...a);
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-9 ? 0 : x, d)).join(', ')})`;
// oblique 3D projection: az = camera azimuth about z, el = elevation
function proj3(cx, cy, s, az, el = 24 * RAD){
  return p => { const u = p[0] * Math.cos(az) - p[1] * Math.sin(az), wv = p[0] * Math.sin(az) + p[1] * Math.cos(az);
    return [cx + s * u, cy - s * (p[2] * Math.cos(el) + wv * Math.sin(el))]; };
}
function path3(ctx, Pj, pts, col, wd = 1.5, alpha = 0.6, dash){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = alpha; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => { const q = Pj(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
}
function arrow3(ctx, Pj, p, v, k, col, label, maxLen, wd = 3){
  const L = nrm(v) * k, f = maxLen && L > maxLen ? maxLen / L : 1;
  const q = [p[0] + v[0] * k * f, p[1] + v[1] * k * f, p[2] + v[2] * k * f], [x1, y1] = Pj(p), [x2, y2] = Pj(q);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label){ const ux = x2 - x1, uy = y2 - y1, l = Math.hypot(ux, uy) || 1; txt(ctx, label, x2 + ux / l * 13, y2 + uy / l * 11, { color: col, font: 'italic 15px Georgia, serif' }); }
}
function axes3(ctx, Pj, L, labels = ['x', 'y', 'z']){
  [[0, [L, 0, 0]], [1, [0, L, 0]], [2, [0, 0, L]]].forEach(([i, e]) => {
    const [x1, y1] = Pj([0, 0, 0]), [x2, y2] = Pj(e);
    line(ctx, x1, y1, x2, y2, COL.axis, 1.2, [4, 3]);
    txt(ctx, labels[i], x2 + (x2 - x1) * 0.07, y2 + (y2 - y1) * 0.07, { font: 'italic 13px Georgia, serif', color: COL.muted });
  });
}
function dot(ctx, x, y, r = 6, col = COL.c1){ ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.card; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
function caption(ctx, s, x, y, col = COL.muted, align = 'left'){ txt(ctx, s, x, y, { font: '12px system-ui, sans-serif', color: col, align }); }
function fillPoly(ctx, Pj, pts, fill, stroke, wd = 1.5){ ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = wd; ctx.beginPath(); pts.forEach((p, i) => { const q = Pj(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
const ring = (R, z, n = 80) => { const pts = []; for (let i = 0; i <= n; i++){ const u = TAU * i / n; pts.push([R * Math.cos(u), R * Math.sin(u), z]); } return pts; };

/* ---------------------------------------------------------------- 1.B.1
   Mixing device: the disk turns at constant ω about the vertical shaft while the shaft moves as z = z₀ sin 2πnt.
   Point A is on the rim of the disk at radius r. State: st.tau (s, slowed), st.th, st.z. */
makeClip({
  id: 'x1b-1', speed: 0.5,
  controls: [
    { key: 'r', label: 'Radius of A, r', min: 0.04, max: 0.16, step: 0.005, value: 0.1, unit: 'm', dec: 3 },
    { key: 'w', label: 'Spin rate ω', min: 1, max: 20, step: 0.5, value: 10, unit: 'rad/s', dec: 2 },
    { key: 'z0', label: 'Stroke amplitude z₀', min: 0, max: 0.08, step: 0.005, value: 0.05, unit: 'm', dec: 3 },
    { key: 'n', label: 'Stroke frequency n', min: 0.1, max: 4, step: 0.1, value: 2, unit: 'Hz', dec: 2 }
  ],
  reset(st){ st.tr = []; st.hist = []; st.tau = 0; st.th = 0; st.z = 0; },
  step(st, dt){
    st.tau += dt * 0.12; if (st.tau > 3){ st.tau = 0; st.tr = []; st.hist = []; }
    const { w: om, z0, n } = st.V; st.th = om * st.tau; st.z = z0 * Math.sin(TAU * n * st.tau);
  },
  draw(st){
    const { r, w: om, z0, n } = st.V, t = st.tau, th = om * t, z = z0 * Math.sin(TAU * n * t);
    const zdd = -z0 * (TAU * n) ** 2 * Math.sin(TAU * n * t), ah = r * om * om, amag = Math.hypot(ah, zdd), amax = Math.hypot(ah, z0 * (TAU * n) ** 2);
    const cv = $('x1b-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const R = 0.19, Zb = -0.16, Zt = 0.14, az = 0.35, el = 22 * RAD;
    const S = Math.min(w * 0.4 / R, h * 0.82 / (Zt - Zb + 0.16 + R * 0.75)), Pj = proj3(w * 0.36, h * 0.47 + S * 0.03, S, az, el);
    // bowl: bottom disk, back wall, then (after the disk) the front silhouette
    fillPoly(ctx, Pj, ring(R, Zb), '#ece6d6', COL.spring, 1.6);
    [1, -1].forEach(sg => { const e = [sg * R * Math.cos(az), -sg * R * Math.sin(az)]; line(ctx, ...Pj([e[0], e[1], Zb]), ...Pj([e[0], e[1], Zt]), COL.spring, 1.6); });
    path3(ctx, Pj, ring(R, Zt), COL.spring, 1.4, 0.7);
    // fixed crossbar across the rim with a bearing collar the shaft slides and spins in
    line(ctx, ...Pj([-R, 0, Zt]), ...Pj([R, 0, Zt]), COL.fg, 5); const [cbx, cby] = Pj([0, 0, Zt]);
    ctx.save(); ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.fillRect(cbx - 9, cby - 7, 18, 14); ctx.strokeRect(cbx - 9, cby - 7, 18, 14); ctx.restore();
    // shaft and disk
    line(ctx, ...Pj([0, 0, z]), ...Pj([0, 0, Zt + 0.12 + z]), '#6d727c', 7);
    fillPoly(ctx, Pj, ring(r, z), COL.mass, COL.massEdge, 2);
    const mk = [r * Math.cos(th), r * Math.sin(th), z]; line(ctx, ...Pj([0, 0, z]), ...Pj(mk), COL.massEdge, 1.4, [4, 3]);
    const pA = mk; st.tr.push(pA); if (st.tr.length > 260) st.tr.shift();
    path3(ctx, Pj, st.tr, COL.c1, 1.6, 0.7);
    // spin and stroke indicators
    const [sx, sy] = Pj([0, 0, Zt + 0.16 + z]); ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, sy, 22, 7, 0, 0.3, 5.6); ctx.stroke(); ctx.restore();
    arrow(ctx, sx + 22 * Math.cos(5.6), sy + 7 * Math.sin(5.6), sx + 22 * Math.cos(5.9), sy + 7 * Math.sin(5.9), COL.c4, 2); txt(ctx, 'ω', sx + 34, sy - 8, { color: COL.c4 });
    const aV = [-ah * Math.cos(th), -ah * Math.sin(th), zdd];
    arrow3(ctx, Pj, pA, aV, 0.75 * R / Math.max(amax, 1e-9), HEAT, 'a_A');
    const [ax, ay] = Pj(pA); dot(ctx, ax, ay, 6, COL.c2); txt(ctx, 'A', ax + 10, ay + 12, { color: COL.c2 });
    caption(ctx, 'slow motion', 10, 14);
    st.hist.push([t, amag]);
    plot($('x1b-1-plot'), { xmin: 0, xmax: 3, ymin: 0, ymax: amax * 1.2 + 1e-6, xlabel: 'time (s)', ylabel: '|a_A| (m/s²)', hlines: [{ y: amax, color: COL.c2 }], series: [{ pts: st.hist, color: HEAT, width: 2.2 }], points: [{ x: t, y: amag, color: HEAT, r: 5 }] });
    statsEvery(st, 'x1b-1-stats', () => [['horizontal part rω²', fmt(ah) + ' m/s²'], ['vertical part z̈', fmt(zdd) + ' m/s²'], ['|a_A| now', fmt(amag) + ' m/s²'], ['largest |a_A| = √(r²ω⁴ + z₀²(2πn)⁴)', fmt(amax) + ' m/s²', true]], 0.1);
  }
});

/* ---------------------------------------------------------------- 1.B.2
   Particle on the surface z = xy/2 with x = 6 sin 2πt, y = 6 cos 2πt. State: st.tau (s). */
const B2 = t => { const W = TAU;
  return { p: [6 * Math.sin(W * t), 6 * Math.cos(W * t), 9 * Math.sin(2 * W * t)], v: [6 * W * Math.cos(W * t), -6 * W * Math.sin(W * t), 18 * W * Math.cos(2 * W * t)],
           a: [-6 * W * W * Math.sin(W * t), -6 * W * W * Math.cos(W * t), -36 * W * W * Math.sin(2 * W * t)] }; };
makeClip({
  id: 'x1b-2', speed: 0.5,
  presets: (C, st) => [{ label: '⏸ Stop at t = 1 s', apply: () => { st.tau = 1; st.hold = true; } }, { label: '▶ Keep moving', apply: () => { st.hold = false; } }],
  reset(st){ st.tau = 0.6; st.hold = false; },
  step(st, dt){ if (!st.hold) st.tau += dt * 0.12; if (st.tau > 1.6) st.tau = 0.6; },
  draw(st){
    const t = st.tau, { p, v, a } = B2(t);
    const cv = $('x1b-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const Pj = proj3(w / 2, h * 0.52, Math.min(w / 21, h / 25), 0.45, 22 * RAD);
    const sad = (rr, ph) => [rr * Math.cos(ph), rr * Math.sin(ph), rr * rr * Math.cos(ph) * Math.sin(ph) / 2];
    for (let rr = 1.5; rr <= 7.01; rr += 1.375){ const C = []; for (let j = 0; j <= 120; j++) C.push(sad(rr, TAU * j / 120)); path3(ctx, Pj, C, COL.axis, 1, 0.35); }
    for (let j = 0; j < 16; j++){ const Lr = []; for (let rr = 0; rr <= 7; rr += 0.25) Lr.push(sad(rr, TAU * j / 16)); path3(ctx, Pj, Lr, COL.axis, 1, 0.35); }
    axes3(ctx, Pj, 9.5);
    const curve = []; for (let i = 0; i <= 200; i++) curve.push(B2(i / 200).p); path3(ctx, Pj, curve, COL.c1, 2, 0.75);
    // the shadow of the particle on the xy plane (the circle x² + y² = 36)
    const sh = []; for (let i = 0; i <= 100; i++){ const u = TAU * i / 100; sh.push([6 * Math.sin(u), 6 * Math.cos(u), 0]); } path3(ctx, Pj, sh, COL.muted, 1, 0.5, [4, 4]);
    line(ctx, ...Pj([p[0], p[1], 0]), ...Pj(p), COL.muted, 1, [3, 3]);
    arrow3(ctx, Pj, p, v, 0.04, COL.c2, 'v', 6); arrow3(ctx, Pj, p, a, 0.016, HEAT, 'a', 6);
    const [px, py] = Pj(p); dot(ctx, px, py, 7); txt(ctx, 'P', px - 14, py - 14);
    if (st.hold) caption(ctx, 'held at t = 1 s', 10, 14, COL.c2);
    statsEvery(st, 'x1b-2-stats', () => [['t', fmt(t, 3) + ' s'], ['r = (x, y, z)', f3(p, 3)], ['v = (ẋ, ẏ, ż)', f3(v, 4), true], ['a = (ẍ, ÿ, z̈)', f3(a, 4), true]], 0.1);
  }
});

subLabels();
})();
