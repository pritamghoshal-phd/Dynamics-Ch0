/* =========================================================
   Chapter 4, angular impulse–momentum examples 4.D.1 to 4.D.7
   Clip ids x4d-1 ... x4d-7. Each clip stores its geometry in st.g for the 3D views (ch4-3dD.js).
   ========================================================= */
(function(){
const g0 = 9.81;
function ball(ctx, x, y, r, col){ wheel(ctx, x, y, r, 0, 'sphere', col); }
function dotc(ctx, x, y, r, col){ ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
function arrowL(ctx, x, y, dx, dy, col, label, wd = 2.6, font){
  if (Math.hypot(dx, dy) < 3) return;
  arrow(ctx, x, y, x + dx, y + dy, col, wd);
  if (label){ const L = Math.hypot(dx, dy); txt(ctx, label, x + dx + dx / L * 14, y + dy + dy / L * 14, { color: col, font: font || 'italic 14px Georgia, serif' }); }
}
// top view of a vertical shaft in its bearing
function shaftTop(ctx, x, y, r){
  ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x, y, r * 1.7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
}
// curved arrow showing a rotation about (x, y); ccw on screen when ccw = true
function spin(ctx, x, y, r, ccw, col, label){
  const a0 = ccw ? 0.35 * Math.PI : 0.65 * Math.PI, a1 = ccw ? 1.65 * Math.PI : -0.65 * Math.PI;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
  const n = 30; for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n, px = x + r * Math.cos(a), py = y - r * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  const a = a1, d = ccw ? 1 : -1, tx = -Math.sin(a) * d, ty = -Math.cos(a) * d, hx = x + r * Math.cos(a), hy = y - r * Math.sin(a);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + tx * 8, hy + ty * 8); ctx.lineTo(hx - ty * 5, hy + tx * 5); ctx.lineTo(hx + ty * 5, hy - tx * 5); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (label) txt(ctx, label, x + (r + 14) * Math.cos(0.15 * Math.PI), y - (r + 14) * Math.sin(0.15 * Math.PI), { color: col });
}
const holdLoop = (st, tEnd, hold) => { if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + hold){ st.t = 0; st.hold = undefined; return true; } } return false; };

/* ---------- 4.D.1: particle sliding out along a free, lightweight arm ---------- */
makeClip({
  id: 'x4d-1', speed: 0.1,
  controls: [
    { key: 'w1', label: 'Initial rate of the arm, ω_1', min: 5, max: 40, step: 0.5, value: 20, unit: 'rad/s', dec: 1 },
    { key: 'R1', label: 'Initial distance R_1', min: 1, max: 12, step: 0.5, value: 3, unit: 'in', dec: 1 }
  ],
  reset(st){
    const V = st.V; st.v = V.R1 * V.w1; st.tEnd = Math.sqrt(Math.max(0, 24 * 24 - V.R1 * V.R1)) / st.v; st.hold = undefined;
    st.w2 = V.w1 * (V.R1 / 24) ** 2;
  },
  step(st){ holdLoop(st, st.tEnd, 0.25); },
  draw(st){
    const cv = $('x4d-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 400, 420); fitView(ctx, w, h, [0, 0, 440, 420]);
    const V = st.V, t = Math.min(st.hold ?? st.t, st.tEnd), S = 12.5, ox = 60, oy = 380;
    const x = V.R1, y = st.v * t, R = Math.hypot(x, y), th = Math.atan2(y, x), om = V.R1 * V.R1 * V.w1 / (R * R);
    st.g = { R, th, om, x, y, t };
    // the straight-line path of P, seen from above
    line(ctx, ox + x * S, oy, ox + x * S, oy - 24.5 * S, COL.c3, 1.4, [5, 5]);
    txt(ctx, 'path of P', ox + x * S + 12, oy - 22 * S, { font: '12px system-ui', color: COL.c3, align: 'left' });
    // circle R = 24 in
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(ox, oy, 24 * S, -Math.PI / 2, 0); ctx.stroke(); ctx.restore();
    txt(ctx, 'R = 24 in', ox + 24 * S * 0.71 + 18, oy - 24 * S * 0.71 - 10, { font: '12px system-ui', color: COL.muted });
    // the arm: lightweight, horizontal, turning freely with the vertical shaft at O
    const c = Math.cos(th), s = Math.sin(th);
    line(ctx, ox, oy, ox + 26 * S * c, oy - 26 * S * s, '#8a8478', 6);
    shaftTop(ctx, ox, oy, 7);
    txt(ctx, 'O', ox - 18, oy + 6);
    const px = ox + R * S * c, py = oy - R * S * s;
    // velocity of P and its polar components (v_R along the arm, v_θ across it)
    const k = 85 / st.v, vR = st.v * s, vT = st.v * c;
    arrowL(ctx, px, py, vR * c * k, -vR * s * k, COL.c3, 'v_R', 2.2);
    arrowL(ctx, px, py, -vT * s * k, -vT * c * k, COL.c4, 'v_θ', 2.2);
    arrowL(ctx, px, py, 0, -st.v * k, COL.c1, 'v', 2.6);
    ball(ctx, px, py, 9);
    txt(ctx, 'P', px + 16, py + 12);
    spin(ctx, ox, oy, 26, true, COL.c2, 'ω');
    txt(ctx, 'top view', 420, 405, { font: '12px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, `t = ${fmt(t, 3)} s`, 420, 18, { font: '12px system-ui', color: COL.muted, align: 'right' });
    const pts = []; for (let i = 0; i <= 80; i++){ const r = V.R1 + (24 - V.R1) * i / 80; pts.push([r, V.R1 * V.R1 * V.w1 / (r * r)]); }
    plot($('x4d-1-plot'), { xmin: 0, xmax: 27, ymin: 0, ymax: V.w1 * 1.08, xlabel: 'distance R (in)', ylabel: 'ω (rad/s)', series: [{ pts, color: COL.c2, width: 2.4 }],
      vlines: [{ x: 24, color: COL.c3 }], points: [{ x: R, y: om, color: COL.c2 }] });
    statsEvery(st, 'x4d-1-stats', () => [['R', fmt(R, 3) + ' in'], ['ω = R_1²ω_1 / R²', fmt(om, 4) + ' rad/s'], ['R²ω (constant)', fmt(R * R * om, 4) + ' in²/s'],
      ['speed of P (constant)', fmt(st.v, 4) + ' in/s'], ['ω at R = 24 in', fmt(st.w2, 4) + ' rad/s', true]]);
  }
});

/* ---------- 4.D.2: two particles released on a spinning arm ---------- */
makeClip({
  id: 'x4d-2', speed: 0.25,
  controls: [
    { key: 'w0', label: 'Initial rate ω_0', min: 2, max: 20, step: 0.5, value: 10, unit: 'rad/s', dec: 1 },
    { key: 'r', label: 'Initial distance r', min: 0.1, max: 0.3, step: 0.01, value: 0.2, unit: 'm', dec: 2 }
  ],
  reset(st){ const V = st.V; st.t0 = 0.3; st.tS = st.t0 + Math.sqrt(3) / V.w0; st.tEnd = st.tS + 2.4; st.hold = undefined; },
  step(st){ holdLoop(st, st.tEnd, 0.2); },
  draw(st){
    const cv = $('x4d-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 380, 640); fitView(ctx, w, h, nr ? [0, 0, 420, 640] : [0, 0, 760, 380]);
    const V = st.V, r = V.r, t = Math.min(st.hold ?? st.t, st.tEnd);
    let s, ph, om, phase;
    if (t < st.t0){ s = r; ph = V.w0 * t; om = V.w0; phase = 'held at r'; }
    else if (t < st.tS){ const u = t - st.t0; s = Math.hypot(r, r * V.w0 * u); ph = V.w0 * st.t0 + Math.atan(V.w0 * u); om = V.w0 * r * r / (s * s); phase = 'released, sliding outward'; }
    else { s = 2 * r; om = V.w0 / 4; ph = V.w0 * st.t0 + Math.PI / 3 + om * (t - st.tS); phase = 'against the stops at 2r'; }
    st.g = { s, ph, om, phase, r, t };
    // side view (left): shaft on a base, arm turning about the vertical axis
    const S = 330 / (4.6 * 0.3), sx = 210, ay = 90, rb = 11.5, half = 2 * r + (rb + 10) / S;   // rb: drawn ball radius (px); the stops sit just outside a ball at 2r
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(sx - 26, 340); ctx.lineTo(sx - 14, 300); ctx.lineTo(sx + 14, 300); ctx.lineTo(sx + 26, 340); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, sx - 60, 340, sx + 60, 340, COL.fg, 2); hatch(ctx, sx - 60, 340, sx + 60, 340, 1);
    line(ctx, sx, ay, sx, 300, '#8a8478', 7);
    line(ctx, sx, 40, sx, ay - 10, COL.muted, 1.2, [5, 4]);
    const c = Math.cos(ph), sn = Math.sin(ph);
    line(ctx, sx - half * S * c, ay, sx + half * S * c, ay, '#8a8478', 6);
    [-1, 1].forEach(sg => { const ex = sx + sg * (2 * r * S + rb + 1.5) * c; line(ctx, ex, ay - 20, ex, ay + 3, COL.fg, 3); }); // stops: a ball at 2r touches them
    const order = sn >= 0 ? [-1, 1] : [1, -1]; // draw the far particle first
    order.forEach(sg => { const rr = 10 + 1.5 * sg * sn; ball(ctx, sx + sg * s * S * c, ay - 3 - rr, rr); });   // each ball rests on top of the arm
    spin(ctx, sx, 250, 18, true, COL.c2, 'ω');
    txt(ctx, 'side view', sx, 365, { font: '12px system-ui', color: COL.muted });
    // top view (right): straight paths while sliding
    const tx = nr ? 210 : 590, ty = nr ? 500 : 190, T = 120 / (2.2 * r);
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(tx, ty, 2 * r * T, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    const p0 = V.w0 * st.t0;
    [-1, 1].forEach(sg => { // straight-line path of each particle after release
      const ax = tx + sg * r * T * Math.cos(p0), ay2 = ty - sg * r * T * Math.sin(p0), dx = -Math.sin(p0) * sg, dy = -Math.cos(p0) * sg, L = Math.sqrt(3) * r * T;
      line(ctx, ax, ay2, ax + dx * L, ay2 + dy * L, COL.c3, 1.3, [5, 4]); });
    const hT = 2 * r * T + 13; line(ctx, tx - hT * c, ty + hT * sn, tx + hT * c, ty - hT * sn, '#8a8478', 5);
    [-1, 1].forEach(sg => { const e = 2 * r * T + 9.5; line(ctx, tx + sg * e * c - 6 * sn, ty - sg * e * sn - 6 * c, tx + sg * e * c + 6 * sn, ty - sg * e * sn + 6 * c, COL.fg, 3); }); // stops (top view)
    [-1, 1].forEach(sg => ball(ctx, tx + sg * s * T * c, ty - sg * s * T * sn, 8));
    shaftTop(ctx, tx, ty, 5);
    txt(ctx, 'top view', tx, ty + 2.2 * r * T + 22, { font: '12px system-ui', color: COL.muted });
    txt(ctx, phase, nr ? 210 : 590, 22, { font: '13px system-ui', color: COL.fg });
    const pts = []; for (let i = 0; i <= 200; i++){ const q = st.tEnd * i / 200; let o;
      if (q < st.t0) o = V.w0; else if (q < st.tS){ const u = q - st.t0; o = V.w0 / (1 + (V.w0 * u) ** 2); } else o = V.w0 / 4; pts.push([q, o]); }
    plot($('x4d-2-plot'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: V.w0 * 1.1, xlabel: 'time t (s)', ylabel: 'ω (rad/s)', series: [{ pts, color: COL.c2, width: 2.4 }],
      hlines: [{ y: V.w0 / 4, color: COL.c3 }], points: [{ x: t, y: om, color: COL.c2 }] });
    const KE0 = r * r * V.w0 * V.w0, KE = phase.startsWith('against') ? 4 * r * r * om * om : KE0; // per unit mass, both particles
    statsEvery(st, 'x4d-2-stats', () => [['distance of each particle', fmt(s, 3) + ' m'], ['ω now', fmt(om, 4) + ' rad/s'], ['ω at 2r = ω_0 / 4', fmt(V.w0 / 4, 4) + ' rad/s', true],
      ['kinetic energy / initial', fmt(KE / KE0, 3)]]);
  }
});

/* ---------- 4.D.3: disk on a rubber band (central force that is zero while the band is slack) ---------- */
makeClip({
  id: 'x4d-3', speed: 0.25,
  controls: [
    { key: 'v1', label: 'Initial speed v_P1', min: 5, max: 20, step: 0.5, value: 15, unit: 'm/s', dec: 1 },
    { key: 'k', label: 'Band stiffness k', min: 2, max: 30, step: 0.5, value: 10, unit: 'N/m', dec: 1 }
  ],
  reset(st){
    const V = st.V, m = 0.2, L0 = 0.6, R1 = 0.4, H = R1 * V.v1 * 0.6;
    const f = s => { const R = s[0], F = R > L0 ? V.k * (R - L0) : 0; return [s[1], R * (H / (R * R)) ** 2 - F / m, H / (R * R)]; };
    let s = [R1, V.v1 * 0.8, 0]; const dt = 0.0005, tr = [[0, ...s]]; st.cross = null;
    for (let i = 1; i <= 4000; i++){ const prev = s; s = rk(f, s, dt); tr.push([i * dt, ...s]);
      if (!st.cross && prev[0] < 1.5 && s[0] >= 1.5){ const u = (1.5 - prev[0]) / (s[0] - prev[0]); st.cross = { t: (i - 1 + u) * dt, vR: prev[1] + u * (s[1] - prev[1]), vT: H / 1.5, th: prev[2] + u * (s[2] - prev[2]) }; } }
    st.tr = tr; st.H = H; st.tEnd = 2; st.hold = undefined;
    let x0 = -0.4, x1 = 0.6, y0 = -0.4, y1 = 0.4; tr.forEach(q => { const x = q[1] * Math.cos(q[3]), y = q[1] * Math.sin(q[3]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    st.bb = [x0 - 0.35, y0 - 0.35, x1 + 0.35, y1 + 0.35];
    const v2 = V.v1 ** 2 - V.k * 0.81 / m;
    setStats('x4d-3-stats', [['H_O / m = R_1 v_θ1', fmt(H, 4) + ' m²/s'], ['at R = 1.5 m: v_θ = H_O/(m R)', fmt(H / 1.5, 4) + ' m/s', true],
      ['at R = 1.5 m: v_R', v2 > (H / 1.5) ** 2 ? fmt(Math.sqrt(v2 - (H / 1.5) ** 2), 4) + ' m/s' : 'never reaches 1.5 m', true], ['largest distance', fmt(Math.max(...tr.map(q => q[1])), 3) + ' m']]);
  },
  step(st){ holdLoop(st, st.tEnd, 0.4); },
  draw(st){
    const cv = $('x4d-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const bb = st.bb, S = 100, X = x => (x - bb[0]) * S, Y = y => (bb[3] - y) * S;
    cv.dataset.h0 = w < 560 ? '420' : '440';
    fitView(ctx, w, h, [0, 0, (bb[2] - bb[0]) * S, (bb[3] - bb[1]) * S]);
    const t = Math.min(st.hold ?? st.t, st.tEnd), i = Math.min(st.tr.length - 2, Math.floor(t / 0.0005)), u = t / 0.0005 - i, A = st.tr[i], B = st.tr[i + 1];
    const R = A[1] + u * (B[1] - A[1]), vR = A[2] + u * (B[2] - A[2]), th = A[3] + u * (B[3] - A[3]), vT = st.H / R;
    st.g = { R, th, vR, vT, slack: R <= 0.6 };
    ctx.save(); ctx.fillStyle = '#f2ede0'; ctx.fillRect(0, 0, (bb[2] - bb[0]) * S, (bb[3] - bb[1]) * S); ctx.restore();
    // path travelled so far
    ctx.save(); ctx.strokeStyle = '#d9d2c0'; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let j = 0; j <= i; j += 4){ const q = st.tr[j], x = X(q[1] * Math.cos(q[3])), y = Y(q[1] * Math.sin(q[3])); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
    [[0.6, 'unstretched length 0.6 m'], [1.5, 'R = 1.5 m']].forEach(([rr, lab], j) => { ctx.save(); ctx.strokeStyle = j ? COL.c3 : COL.grid; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(X(0), Y(0), rr * S, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      txt(ctx, lab, X(0), Y(0) + rr * S + (j ? 16 : 12), { font: '11px system-ui', color: j ? COL.c3 : COL.muted }); });
    const px = X(R * Math.cos(th)), py = Y(R * Math.sin(th));
    // rubber band: straight and tight when stretched, wavy when slack
    ctx.save(); ctx.strokeStyle = '#b8742a'; ctx.lineWidth = 2.6; ctx.beginPath();
    if (R > 0.6){ ctx.moveTo(X(0), Y(0)); ctx.lineTo(px, py); }
    else { const n = 40, amp = Math.sqrt(Math.max(0, 0.36 - R * R)) * 0.35 * S, ux = (px - X(0)) / (R * S), uy = (py - Y(0)) / (R * S);
      for (let j = 0; j <= n; j++){ const q = j / n, wv = amp * Math.sin(3 * Math.PI * q); const x = X(0) + ux * R * S * q - uy * wv, y = Y(0) + uy * R * S * q + ux * wv; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }
    ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = '#8a8478'; ctx.strokeStyle = COL.fg; ctx.beginPath(); ctx.arc(X(0), Y(0), 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'O', X(0) - 14, Y(0) - 12);
    const c = Math.cos(th), s = Math.sin(th), kv = 4.2;
    arrowL(ctx, px, py, vR * c * kv, -vR * s * kv, COL.c3, '', 2.2);
    { const sg = vT >= 0 ? -1 : 1; txt(ctx, 'v_R', px + vR * c * kv * 0.55 + sg * s * 16, py - vR * s * kv * 0.55 + sg * c * 16, { color: COL.c3, font: 'italic 14px Georgia, serif' }); }
    arrowL(ctx, px, py, -vT * s * kv, -vT * c * kv, COL.c4, '', 2.2);
    txt(ctx, 'v_θ', px - vT * s * kv * 0.5 - c * 18, py - vT * c * kv * 0.5 + s * 18, { color: COL.c4, font: 'italic 14px Georgia, serif' });
    arrowL(ctx, px, py, (vR * c - vT * s) * kv, -(vR * s + vT * c) * kv, COL.c1, 'v', 2.6);
    if (R > 0.6){ const F = st.V.k * (R - 0.6); arrowL(ctx, px, py, -c * (10 + F * 2.5), s * (10 + F * 2.5), RED, 'F', 2.4); }
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(px, py, 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px + 14, py + 14);
    if (st.cross){ const cx = X(1.5 * Math.cos(st.cross.th)), cy = Y(1.5 * Math.sin(st.cross.th)); dotc(ctx, cx, cy, 4, COL.c3); }
    txt(ctx, R > 0.6 ? 'band stretched' : 'band slack', (bb[2] - bb[0]) * S - 10, 16, { font: '12px system-ui', color: COL.muted, align: 'right' });
    const pr = [], pt = []; st.tr.forEach((q, j) => { if (j % 10 === 0){ pr.push([q[0], q[2]]); pt.push([q[0], st.H / q[1]]); } });
    const lo = Math.min(0, ...pr.map(q => q[1])), hi = Math.max(...pr.map(q => q[1]), ...pt.map(q => q[1]));
    plot($('x4d-3-plot'), { xmin: 0, xmax: st.tEnd, ymin: lo * 1.1 - 0.5, ymax: hi * 1.1 + 0.5, xlabel: 'time t (s)', ylabel: 'velocity components (m/s)',
      series: [{ pts: pr, color: COL.c3, width: 2.2 }, { pts: pt, color: COL.c4, width: 2.2 }], vlines: st.cross ? [{ x: st.cross.t, color: COL.c3, label: 'R = 1.5 m' }] : [],
      points: [{ x: t, y: vR, color: COL.c3 }, { x: t, y: vT, color: COL.c4 }] });
  }
});

/* ---------- 4.D.4: arm, sliding particle A and particle B on the shaft ---------- */
makeClip({
  id: 'x4d-4', speed: 0.25,
  controls: [
    { key: 'w0', label: 'Starting rate ω_1', min: 4, max: 8, step: 0.1, value: 6, unit: 'rad/s', dec: 2 },
    { key: 'R0', label: 'Starting radius R_1', min: 0.5, max: 1.0, step: 0.05, value: 0.8, unit: 'm', dec: 2 }
  ],
  reset(st){ const V = st.V; st.s = [V.R0, 0]; st.ph = 0; st.Hm = V.R0 * V.R0 * V.w0; st.hist = []; st.lastT = 0; st.cross = null; st.hold = undefined; st.done = false; },
  step(st){
    const V = st.V, Hm = st.Hm;
    if (st.hold !== undefined){ if (st.t > st.hold + 0.5){ st.t = 0; st.s = [V.R0, 0]; st.ph = 0; st.hist = []; st.lastT = 0; st.cross = null; st.hold = undefined; } return; }
    const f = s => { const om = Hm / (s[0] * s[0]); return [s[1], (s[0] * om * om - g0) / 2]; };
    const dt = st.t - st.lastT; if (dt <= 0) return; const prev = st.s;
    st.s = stepN(f, st.s, dt, 0.001); st.lastT = st.t; st.ph += Hm / (st.s[0] ** 2) * dt; st.hist.push([st.t, st.s[0]]);
    if (!st.cross && prev[0] < 1.2 && st.s[0] >= 1.2){ const u = (1.2 - prev[0]) / (st.s[0] - prev[0]); st.cross = { t: st.t - dt * (1 - u), vB: prev[1] + u * (st.s[1] - prev[1]), om: Hm / 1.44 }; }
    if (st.t > 2.6 || st.s[0] > 2.1 || st.s[0] < 0.3 || 1.1 - (st.s[0] - V.R0) < 0.25) st.hold = st.t;   // also stop before B is pulled up into the pulley
  },
  draw(st){
    const cv = $('x4d-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 380, 620); fitView(ctx, w, h, nr ? [0, 0, 420, 620] : [0, 0, 800, 380]);
    const V = st.V, R = st.s[0], om = st.Hm / (R * R), S = nr ? 80 : 110, ox = nr ? 210 : 290, oy = 90, c = Math.cos(st.ph), sn = Math.sin(st.ph);
    const zB = oy + 30 + (1.1 - (R - V.R0)) * 120 * (nr ? 0.8 : 1); // B hangs 1.1 m below O when R = R_1
    st.g = { R, ph: st.ph, om, vB: st.s[1], dropB: 1.1 - (R - V.R0) };
    // vertical shaft between a ceiling bearing and a floor bearing
    line(ctx, ox - 40, 20, ox + 40, 20, COL.fg, 2); hatch(ctx, ox + 40, 20, ox - 40, 20, 1);
    line(ctx, ox - 40, 360, ox + 40, 360, COL.fg, 2); hatch(ctx, ox - 40, 360, ox + 40, 360, 1);
    ctx.save(); ctx.fillStyle = '#d8d2c2'; ctx.fillRect(ox - 9, 20, 18, 340); ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.strokeRect(ox - 9, 20, 18, 340); ctx.restore();
    // arm OC seen from the side (its apparent length changes as it turns)
    line(ctx, ox, oy, ox + 2.2 * S * c, oy, '#8a8478', 6);
    const ax = ox + R * S * c;
    line(ctx, ox + 9, oy - 9, ax, oy - 9, COL.fg, 1.6); // cord from A to the pulley
    line(ctx, ox - 9, oy, ox - 9, zB - 16, COL.fg, 1.6); // cord down to B
    pulley(ctx, ox, oy, 9);
    block(ctx, ax, oy - 14, 26, 22, 0, 'A');                      // A rests on top of the arm
    block(ctx, ox, zB, 34, 30, 0, 'B');
    txt(ctx, 'O', ox - 26, oy - 14); txt(ctx, 'C', ox + 2.2 * S * c + 14 * Math.sign(c || 1), oy - 14);
    spin(ctx, ox, 320, 18, true, COL.c2, 'ω');
    if (Math.abs(st.s[1]) > 0.02) arrowL(ctx, ox + 30, zB, 0, -st.s[1] * 30, COL.c3, 'v_B', 2.4);
    txt(ctx, 'side view', ox, 376, { font: '12px system-ui', color: COL.muted });
    // top view
    const tx = nr ? 210 : 680, ty = nr ? 500 : 190, T = 52;
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(tx, ty, 1.2 * T, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, tx, ty, tx + 2.2 * T * c, ty - 2.2 * T * sn, '#8a8478', 5);
    block(ctx, tx + R * T * c, ty - R * T * sn, 18, 14, -st.ph, '');
    shaftTop(ctx, tx, ty, 5);
    txt(ctx, 'top view (dashed circle R = 1.2 m)', tx, ty + 2.2 * T + 18, { font: '12px system-ui', color: COL.muted });
    plot($('x4d-4-plot'), { xmin: 0, xmax: 2.8, ymin: 0, ymax: 2.2, xlabel: 'time t (s)', ylabel: 'R (m)', hlines: [{ y: 1.2, color: COL.c3 }],
      series: [{ pts: st.hist, color: COL.c1, width: 2.4 }], points: st.cross ? [{ x: st.cross.t, y: 1.2, color: COL.c3 }] : [] });
    const R2 = 1.2, om2 = st.Hm / (R2 * R2), E = 0.5 * V.R0 * V.R0 * V.w0 * V.w0 - 0.5 * R2 * R2 * om2 * om2 - g0 * (R2 - V.R0), vB2 = E > 0 ? Math.sqrt(E) : NaN;
    statsEvery(st, 'x4d-4-stats', () => [['R now', fmt(R, 3) + ' m'], ['ω = R_1²ω_1 / R²', fmt(om, 4) + ' rad/s'],
      ['at R = 1.2 m: ω', fmt(om2, 4) + ' rad/s', true], ['at R = 1.2 m: v_B (energy)', isFinite(vB2) ? fmt(vB2, 4) + ' m/s' : 'A never reaches 1.2 m', true],
      ['v_B from the simulation', st.cross ? fmt(st.cross.vB, 4) + ' m/s' : '…']]);
  }
});

/* ---------- 4.D.5: bullet embeds in particle A of a pinned bar ---------- */
makeClip({
  id: 'x4d-5', speed: 0.5,
  controls: [
    { key: 'vP', label: 'Bullet speed v_P1', min: 100, max: 1000, step: 10, value: 700, unit: 'm/s', dec: 0 },
    { key: 'M', label: 'Mass of A and of B, M', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'kg', dec: 1 }
  ],
  reset(st){
    const V = st.V, m = 0.1, L = 3, sx = 0.6, sy = 0.8;
    st.Ho = m * L * V.vP * sx; st.I = V.M * L * L + V.M * L * L / 4 + m * L * L; st.w = st.Ho / st.I; st.Md = (V.M + m) * L + V.M * L / 2;
    st.ta = 0.8; st.tEnd = st.ta + 4; st.s = [0, st.w]; st.lastT = st.ta; st.hist = []; st.hold = undefined;
    const p = (V.M + m) * L * st.w + V.M * L / 2 * st.w;
    st.J = [p - m * V.vP * sx, -m * V.vP * sy];
    setStats('x4d-5-stats', [['H_O before = m L v_P1 sin 36.87°', fmt(st.Ho, 4) + ' kg·m²/s'], ['I_O = M L² + M(L/2)² + m L²', fmt(st.I, 4) + ' kg·m²'],
      ['ω_2 = H_O / I_O', fmt(st.w, 4) + ' rad/s (counterclockwise)', true], ['pin impulse on the bar', `${fmt(st.J[0], 3)} î ${st.J[1] < 0 ? '−' : '+'} ${fmt(Math.abs(st.J[1]), 3)} ĵ N·s`],
      ['kinetic energy kept', fmt(100 * 0.5 * st.I * st.w * st.w / (0.5 * m * V.vP * V.vP), 3) + ' %']]);
  },
  step(st){
    if (holdLoop(st, st.tEnd, 0.3)){ st.s = [0, st.w]; st.lastT = st.ta; st.hist = []; return; }
    if (st.t > st.ta && st.hold === undefined){ const f = s => [s[1], -st.Md * g0 * Math.sin(s[0]) / st.I], dt = st.t - st.lastT;
      if (dt > 0){ st.s = stepN(f, st.s, dt, 0.002); st.lastT = st.t; st.hist.push([st.t - st.ta, st.s[1]]); } }
  },
  draw(st){
    const cv = $('x4d-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 420, 440); fitView(ctx, w, h, [0, 0, 460, 440]);
    const S = 62, ox = 230, oy = 215, L = 3, t = st.hold ?? st.t, th = t < st.ta ? 0 : st.s[0];
    const P = (d) => [ox + d * S * Math.sin(th), oy + d * S * Math.cos(th)];
    st.g = { th, om: t < st.ta ? 0 : st.s[1], phase: t < st.ta ? 'approach' : 'swing', u: Math.min(1, t / st.ta), J: t >= st.ta && t < st.ta + 0.3 };
    // post behind the bar carries the pin, so the bar can swing all the way around
    ctx.save(); ctx.fillStyle = '#ebe6d9'; ctx.fillRect(ox - 10, oy, 20, 3.45 * S); ctx.restore();
    line(ctx, ox - 80, oy + 3.45 * S, ox + 80, oy + 3.45 * S, COL.fg, 2); hatch(ctx, ox - 80, oy + 3.45 * S, ox + 80, oy + 3.45 * S, 1);
    txt(ctx, 'post behind the bar', ox + 16, oy + 3.0 * S, { font: '11px system-ui', color: COL.muted, align: 'left' });
    const [bx, by] = P(L / 2), [axx, ayy] = P(L);
    line(ctx, ox, oy, axx, ayy, '#8a8478', 5);
    ball(ctx, bx, by, 11); ball(ctx, axx, ayy, 12);
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox - 16, oy - 12);
    txt(ctx, 'B', bx + 18, by - 6); txt(ctx, 'A', axx + 20, ayy - 6);
    if (t < st.ta){ // bullet approaching A along its line of flight (shown in slow motion)
      const d = (1 - t / st.ta) * 0.4, bxp = axx - 0.6 * d * S, byp = ayy + 0.8 * d * S;   // starts above the floor
      dotc(ctx, bxp, byp, 5, COL.fg); arrowL(ctx, bxp, byp, 0.6 * 34, -0.8 * 34, COL.c1, 'v_P1', 2.4);
      line(ctx, axx, ayy, axx, ayy + 1.5 * S, COL.muted, 1, [4, 4]);
      txt(ctx, 'bullet shown in slow motion', 450, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    } else {
      dotc(ctx, axx, ayy, 4, COL.fg);
      const om = st.s[1]; spin(ctx, ox, oy, 24, om >= 0, COL.c2, 'ω');
      if (st.g.J){ arrowL(ctx, ox, oy, st.J[0] * 1.2, -st.J[1] * 1.2, RED, 'pin impulse', 2.6, '12px system-ui'); }
      txt(ctx, `ω = ${fmt(om, 3)} rad/s`, 450, 20, { font: '12px system-ui', color: COL.fg, align: 'right' });
    }
    plot($('x4d-5-plot'), { xmin: 0, xmax: 4, ymin: -st.w * 1.1 - 0.5, ymax: st.w * 1.1 + 0.5, xlabel: 'time after impact (s)', ylabel: 'ω (rad/s)', series: [{ pts: st.hist, color: COL.c2, width: 2.4 }],
      hlines: [{ y: st.w, color: COL.c3 }], points: st.hist.length ? [{ x: st.hist[st.hist.length - 1][0], y: st.hist[st.hist.length - 1][1], color: COL.c2 }] : [] });
  }
});

/* ---------- 4.D.6: particle C sticks to B on a pinned rod in a horizontal plane ---------- */
makeClip({
  id: 'x4d-6', speed: 0.25,
  controls: [
    { key: 'v1', label: 'Speed of C, v_1', min: 1, max: 10, step: 0.5, value: 5, unit: 'm/s', dec: 1 },
    { key: 'L', label: 'Length L', min: 0.2, max: 1, step: 0.05, value: 0.5, unit: 'm', dec: 2 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 3, step: 0.1, value: 1, unit: 'kg', dec: 1 }
  ],
  reset(st){ const V = st.V; st.w = V.v1 / (19 * V.L); st.ta = V.L / V.v1; st.tEnd = st.ta + Math.min(3, Math.PI / 2 / st.w); st.hold = undefined;
    setStats('x4d-6-stats', [['H_O before = m v_1 L', fmt(V.m * V.v1 * V.L, 4) + ' kg·m²/s'], ['I_O after = 4m(2L)² + 3m L²', fmt(19 * V.m * V.L * V.L, 4) + ' kg·m²'],
      ['ω = v_1 / (19 L)', fmt(st.w, 4) + ' rad/s (clockwise, top view)', true], ['pin impulse = (24/19) m v_1', fmt(24 / 19 * V.m * V.v1, 4) + ' N·s, opposite to v_1'],
      ['kinetic energy kept', fmt(100 / 19, 3) + ' %']]); },
  step(st){ holdLoop(st, st.tEnd, 0.4); },
  draw(st){
    const cv = $('x4d-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 380, 560); fitView(ctx, w, h, nr ? [0, 0, 420, 560] : [0, 0, 720, 380]);
    const V = st.V, t = st.hold ?? st.t, after = t >= st.ta, ph = after ? -st.w * (t - st.ta) : 0;
    const S = 75 / V.L, ox = nr ? 210 : 360, oy = nr ? 200 : 190;
    const U = d => [ox + d * S * Math.cos(ph), oy - d * S * Math.sin(ph)];
    const yC = after ? 0 : (st.ta - t) * V.v1; // distance of C above B (m)
    st.g = { ph, yC, after, om: after ? st.w : 0 };
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(ox, oy, 2 * V.L * S, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    const [Ax, Ay] = U(-2 * V.L), [Bx, By] = U(V.L);
    line(ctx, Ax, Ay, Bx, By, COL.fg, 3);
    block(ctx, Ax, Ay, 30, 30, -ph, ''); block(ctx, Bx, By, 24, 24, -ph, '');
    const nx = -Math.sin(ph), ny = -Math.cos(ph); // screen normal to the rod
    txt(ctx, 'A', Ax + nx * 30, Ay + ny * 30); txt(ctx, 'B', Bx - nx * 28, By - ny * 28);
    shaftTop(ctx, ox, oy, 5); txt(ctx, 'O', ox, oy + 24);
    if (!after){
      const cy = oy - yC * S - 20; dotc(ctx, Bx, cy, 8, '#8a8478'); txt(ctx, 'C', Bx - 22, cy);   // at the impact C (radius 8) touches B's face (half size 12)
      arrowL(ctx, Bx + 26, cy - 22, 0, 40, COL.c1, 'v_1', 2.4);
      txt(ctx, '2L', (Ax + ox) / 2, oy + 24, { font: 'italic 13px Georgia, serif', color: COL.muted });
      txt(ctx, 'L', (Bx + ox) / 2, oy + 24, { font: 'italic 13px Georgia, serif', color: COL.muted });
    } else {
      dotc(ctx, Bx + nx * 20, By + ny * 20, 8, '#8a8478'); spin(ctx, ox, oy, 30, false, COL.c2, 'ω');   // C stays stuck on the face it hit
      if (t < st.ta + 0.15) arrowL(ctx, ox, oy, 0, -56, RED, 'pin impulse', 2.6, '12px system-ui');
      const k = 60 / (2 * V.L * st.w), sn = Math.sin(ph), cs = Math.cos(ph); // velocity arrows, the one at A is 60 px long
      arrowL(ctx, Bx, By, st.w * V.L * sn * k, st.w * V.L * cs * k, COL.c3, 'v_B', 2.2);
      arrowL(ctx, Ax, Ay, -2 * st.w * V.L * sn * k, -2 * st.w * V.L * cs * k, COL.c3, 'v_A', 2.2);
    }
    txt(ctx, 'top view (horizontal plane)', ox, oy + 2 * V.L * S + 26, { font: '12px system-ui', color: COL.muted });
    // momentum bars: the angular momentum about O is unchanged, the linear momentum is not
    const Hb = V.m * V.v1 * V.L, p1 = V.m * V.v1, p2 = 5 * V.m * V.L * st.w;
    ebars(ctx, nr ? 20 : 20, nr ? 420 : 90, nr ? 180 : 150, nr ? 100 : 180, [
      { label: 'before', val: Hb, color: COL.c2, num: fmt(Hb, 3) }, { label: 'after', val: Hb, color: COL.c2, num: fmt(Hb, 3) }], Hb * 1.15, 'H_O (kg·m²/s)');
    ebars(ctx, nr ? 225 : 555, nr ? 420 : 90, nr ? 180 : 150, nr ? 100 : 180, [
      { label: 'before', val: p1, color: COL.c1, num: fmt(p1, 3) }, { label: 'after', val: p2, color: COL.c1, num: fmt(p2, 3) }], p1 * 1.15, 'p (N·s)');
  }
});

/* ---------- 4.D.7: particle on a cord through a hole, elliptical path ---------- */
makeClip({
  id: 'x4d-7', speed: 0.25,
  controls: [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'kg', dec: 1 },
    { key: 'vA', label: 'Speed at A, v_A', min: 2, max: 20, step: 0.5, value: 10, unit: 'm/s', dec: 1 }
  ],
  reset(st){ const V = st.V; st.om = V.vA / 6; st.tEnd = 2 * Math.PI / st.om; st.hold = undefined;
    setStats('x4d-7-stats', [['H_O = m r_A v_A', fmt(V.m * 3 * V.vA, 4) + ' kg·m²/s'], ['v_B = r_A v_A / r_B', fmt(V.vA / 2, 4) + ' m/s', true],
      ['ρ_B = a²/b', '1.5 m'], ['T at B = m v_B² / ρ_B', fmt(V.m * (V.vA / 2) ** 2 / 1.5, 4) + ' N', true]]); },
  step(st){ if (st.t > st.tEnd) st.t -= st.tEnd; },
  draw(st){
    const cv = $('x4d-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    nar(cv, w, 420, 440); fitView(ctx, w, h, [0, 0, 320, 440]);
    const V = st.V, om = st.om, t = st.t, S = 32, ox = 160, oy = 220, P = (x, y) => [ox + x * S, oy - y * S];
    const x = 3 * Math.cos(om * t), y = 6 * Math.sin(om * t), vx = -3 * om * Math.sin(om * t), vy = 6 * om * Math.cos(om * t), r = Math.hypot(x, y), T = V.m * om * om * r;
    st.g = { x, y, vx, vy, T };
    ctx.save(); ctx.fillStyle = '#f2ede0'; ctx.fillRect(10, 10, 300, 420); ctx.restore();
    line(ctx, ...P(-4.2, 0), ...P(4.2, 0), COL.grid, 1); line(ctx, ...P(0, -6.5), ...P(0, 6.5), COL.grid, 1);
    txt(ctx, 'x', ...P(4.5, 0.4), { font: 'italic 13px Georgia, serif', color: COL.muted }); txt(ctx, 'y', ...P(0.4, 6.6), { font: 'italic 13px Georgia, serif', color: COL.muted });
    ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(ox, oy, 3 * S, 6 * S, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    dotc(ctx, ...P(3, 0), 4, COL.muted); txt(ctx, 'A', ...P(3.5, -0.5)); dotc(ctx, ...P(0, 6), 4, COL.muted); txt(ctx, 'B', ...P(-0.5, 6.4));
    const [px, py] = P(x, y);
    line(ctx, ox, oy, px, py, COL.fg, 1.6);
    ctx.save(); ctx.fillStyle = '#3a3d44'; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); txt(ctx, 'O', ox - 14, oy + 14);
    arrowL(ctx, px, py, -x / r * (12 + T * 1.3), y / r * (12 + T * 1.3), RED, 'T', 2.6);
    arrowL(ctx, px, py, vx * 3.2, -vy * 3.2, COL.c1, 'v', 2.4);
    ball(ctx, px, py, 8);
    const pts = []; for (let i = 0; i <= 120; i++){ const q = st.tEnd * i / 120; pts.push([q, V.m * om * om * Math.hypot(3 * Math.cos(om * q), 6 * Math.sin(om * q))]); }
    plot($('x4d-7-plot'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: V.m * om * om * 6 * 1.1, xlabel: 'time t (s)', ylabel: 'cord force T (N)', series: [{ pts, color: RED, width: 2.4 }],
      vlines: [{ x: Math.PI / 2 / om, color: COL.c3, label: 'at B' }], points: [{ x: t, y: T, color: RED }] });
  }
});

subLabels();
})();
