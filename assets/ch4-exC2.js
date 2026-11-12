/* =========================================================
   Chapter 4, linear impulse–momentum examples 4.C.8 to 4.C.13
   Every clip stores the positions it draws in st.pos, which the 3D views (ch4-3dC2.js) read.
   ========================================================= */
(function(){
const GFT = 32.2;
const sgn = v => (v < 0 ? '−' : '') + fmt(Math.abs(v), 4);
const SLOW = (ctx, x, y, s) => txt(ctx, s, x, y, { font: '600 12px system-ui', color: COL.muted, align: 'left', fixed: true });
function bullet(ctx, x, y, dir = -1, len = 16){ // dir = −1: nose points left
  ctx.save(); ctx.translate(x, y); ctx.scale(dir < 0 ? 1 : -1, 1);
  ctx.fillStyle = '#7a6a3a'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(-len / 2 + 4, -4, -len / 2 + 7, -4); ctx.lineTo(len / 2, -4); ctx.lineTo(len / 2, 4); ctx.lineTo(-len / 2 + 7, 4); ctx.quadraticCurveTo(-len / 2 + 4, 4, -len / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function flash(ctx, x, y, k){ // short starburst at an impact (k from 1 down to 0)
  if (k <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.strokeStyle = '#e0a020'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++){ const a = i * Math.PI / 5, r1 = 6, r2 = 6 + 14 * k; ctx.beginPath(); ctx.moveTo(x + r1 * Math.cos(a), y + r1 * Math.sin(a)); ctx.lineTo(x + r2 * Math.cos(a), y + r2 * Math.sin(a)); ctx.stroke(); }
  ctx.restore();
}
function ball(ctx, x, y, R, col){
  ctx.save(); const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
}
function ceilingBar(ctx, x0, x1, y){ line(ctx, x0, y, x1, y, COL.fg, 2); hatch(ctx, x1, y, x0, y, 1, 8, 6); }
function floorLine(ctx, x0, x1, y){ line(ctx, x0, y, x1, y, COL.fg, 2); hatch(ctx, x0, y, x1, y, 1, 9, 7); }

/* ---------- 4.C.8: bullet embeds in a block hanging from a cord ---------- */
makeClip({
  id: 'x4c-8', speed: 1,
  controls: [
    { key: 'vB', label: 'Bullet speed v_B1', min: 500, max: 2500, step: 50, value: 1800, unit: 'ft/s', dec: 0 },
    { key: 'w', label: 'Bullet weight w', min: 0.05, max: 0.3, step: 0.01, value: 0.2, unit: 'lb', dec: 2 },
    { key: 'W', label: 'Block weight W', min: 50, max: 150, step: 1, value: 75, unit: 'lb', dec: 0 }
  ],
  reset(st){
    const V = st.V, L = 5, mB = V.w / GFT, mA = V.W / GFT;
    st.L = L; st.v2 = mB * V.vB / (mA + mB); st.h = st.v2 * st.v2 / (2 * GFT); st.thMax = Math.acos(1 - st.h / L);
    st.KE1 = 0.5 * mB * V.vB * V.vB; st.KE2 = 0.5 * (mA + mB) * st.v2 * st.v2;
    st.Ta = 1.0; st.s = [0, st.v2 / L]; st.ts = 0; st.hist = [];
    setStats('x4c-8-stats', [['v_2 = w v_B1/(w + W)', fmt(st.v2, 4) + ' ft/s'], ['h = v_2²/(2g)', fmt(st.h, 4) + ' ft'],
      ['θ_max', fmt(st.thMax / RAD, 4) + '°', true], ['energy lost', fmt(st.KE1 - st.KE2, 5) + ' ft·lb (' + fmt(100 * (1 - st.KE2 / st.KE1), 4) + '%)', true]]);
  },
  step(st){
    if (st.t > st.Ta + 5.2){ st.t = 0; st.s = [0, st.v2 / st.L]; st.ts = 0; st.hist = []; return; }
    if (st.t > st.Ta){ const T = st.t - st.Ta, L = st.L;
      st.s = stepN(s => [s[1], -(GFT / L) * Math.sin(s[0])], st.s, T - st.ts, 0.002); st.ts = T; st.hist.push([T, st.s[0] / RAD]); }
  },
  draw(st){
    const cv = $('x4c-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 330]);
    const S = 44, O = [300, 40], L = st.L * S, th = st.t > st.Ta ? st.s[0] : 0, Ta = st.Ta;
    ceilingBar(ctx, 230, 370, 22); ceilingPin(ctx, O[0], O[1], 18);
    // dashed vertical and the angle
    line(ctx, O[0], O[1], O[0], O[1] + L + 30, COL.muted, 1, [5, 4]);
    const P = [O[0] - L * Math.sin(th), O[1] + L * Math.cos(th)], bs = 40;
    // cord to the top of the block, block hangs along the cord
    cable(ctx, () => { ctx.moveTo(O[0], O[1]); ctx.lineTo(O[0] - (L - bs / 2) * Math.sin(th), O[1] + (L - bs / 2) * Math.cos(th)); });
    pinDot(ctx, O[0], O[1]);
    block(ctx, P[0], P[1], bs, bs, -th, 'A');
    if (st.t >= Ta){ ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(-th); ctx.fillStyle = '#7a6a3a'; ctx.beginPath(); ctx.arc(bs / 2 - 3, 0, 3, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
    if (Math.abs(th) > 0.14){ ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(O[0], O[1], 70, Math.PI / 2, Math.PI / 2 + th, th < 0); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', O[0] - 86 * Math.sin(th / 2) - 10 * Math.sign(th), O[1] + 86 * Math.cos(th / 2)); }
    txt(ctx, 'O', O[0] + 16, O[1] + 4); txt(ctx, 'L', O[0] + 12 - (L / 2) * Math.sin(th), O[1] + L / 2);
    // highest point reached (dashed arc position)
    const Pm = [O[0] - L * Math.sin(st.thMax), O[1] + L * Math.cos(st.thMax)];
    if (Math.abs(th - st.thMax) > 0.12){ ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.translate(Pm[0], Pm[1]); ctx.rotate(-st.thMax); ctx.strokeRect(-bs / 2, -bs / 2, bs, bs); ctx.restore(); }
    let bx = null;
    if (st.t < Ta){ // slow-motion approach of the bullet
      const x0 = 470, x1 = P[0] + bs / 2 + 8; bx = x0 + (x1 - x0) * st.t / Ta; bullet(ctx, bx, P[1]);
      arrow(ctx, bx - 14, P[1] - 18, bx - 50, P[1] - 18, COL.c1, 2.6); txt(ctx, 'v_B1', bx - 32, P[1] - 32, { color: COL.c1 });
      SLOW(ctx, 12, 316, 'Slow motion: the bullet covers this distance in about 2 ms.');
    } else {
      flash(ctx, P[0] + bs / 2, P[1], 1 - (st.t - Ta) / 0.35);
      const v = st.s[1] * st.L; // speed along the path, + to the left
      if (Math.abs(v) > 0.9){ const k = 9, ux = -Math.cos(th), uy = -Math.sin(th);
        arrow(ctx, P[0] + ux * 26 * Math.sign(v), P[1] + uy * 26 * Math.sign(v), P[0] + ux * (26 + k * Math.abs(v)) * Math.sign(v), P[1] + uy * (26 + k * Math.abs(v)) * Math.sign(v), COL.c3, 2.6);
        txt(ctx, 'v', P[0] + ux * (40 + k * Math.abs(v)) * Math.sign(v), P[1] + uy * (40 + k * Math.abs(v)) * Math.sign(v) - 10, { color: COL.c3 }); }
      SLOW(ctx, 12, 316, `Real time after the impact: t = ${fmt(st.t - Ta, 2)} s`);
    }
    st.pos = { th, bx: bx === null ? null : (bx - O[0]) / S, by: st.L, flash: st.t >= Ta ? Math.max(0, 1 - (st.t - Ta) / 0.35) : 0 };
    const tm = st.thMax / RAD, pts = st.hist;
    plot($('x4c-8-plot'), { xmin: 0, xmax: 5.2, ymin: -1.2 * tm, ymax: 1.2 * tm, xlabel: 'time after the impact (s)', ylabel: 'θ (degrees, left +)',
      hlines: [{ y: tm, color: COL.muted, dash: [5, 4] }, { y: -tm, color: COL.muted, dash: [5, 4] }],
      series: [{ pts, color: COL.c2, width: 2.4 }], points: pts.length ? [{ x: pts[pts.length - 1][0], y: pts[pts.length - 1][1], color: COL.c2, r: 5 }] : [] });
  }
});

/* ---------- 4.C.9: bullet passes through a block that then slides on a rough floor ---------- */
makeClip({
  id: 'x4c-9', speed: 1,
  controls: [
    { key: 'v1', label: 'Bullet speed before, v_B1', min: 400, max: 1000, step: 10, value: 800, unit: 'm/s', dec: 0 },
    { key: 'v2', label: 'Bullet speed after, v_B2', min: 100, max: 900, step: 10, value: 350, unit: 'm/s', dec: 0 },
    { key: 'mu', label: 'Friction coefficient μ_k', min: 0.05, max: 0.5, step: 0.01, value: 0.1, unit: '', dec: 2 },
    { key: 'mA', label: 'Block mass m_A', min: 1, max: 20, step: 0.5, value: 5, unit: 'kg', dec: 1 }
  ],
  reset(st){
    const V = st.V, mB = 0.1, v2 = Math.min(V.v2, V.v1);
    st.vA = mB * (V.v1 - v2) / V.mA; st.dec = V.mu * G0; st.T = st.vA / st.dec; st.d = st.vA * st.vA / (2 * st.dec); st.Ta = 1.2; st.vb2 = v2;
    setStats('x4c-9-stats', [['v_A2 = m_B(v_B1 − v_B2)/m_A', fmt(st.vA, 4) + ' m/s'], ['deceleration μ_k g', fmt(st.dec, 4) + ' m/s²'],
      ['sliding time', fmt(st.T, 4) + ' s'], ['d = v_A2²/(2μ_k g)', fmt(st.d, 4) + ' m', true]]);
  },
  step(st){ if (st.t > st.Ta + st.T + 1.5) st.t = 0; },
  draw(st){
    const cv = $('x4c-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 215]);
    const S = 110, Ta = st.Ta, ts = Math.max(0, Math.min(st.t - Ta, st.T)), x = st.vA * ts - 0.5 * st.dec * ts * ts; // distance moved to the left (m)
    const v = st.vA - st.dec * ts, gy = 155, sx = 300, bs = 0.3 * S;            // block drawn at screen x = sx; the floor scrolls
    floorLine(ctx, 0, 480, gy);
    // distance marks every metre, measured from the impact point
    for (let k = Math.floor(x - 2.5); k <= x + 2.5; k++){ const X = sx + (x - k) * S; if (X < 6 || X > 474 || k < 0) continue;
      line(ctx, X, gy, X, gy + 10, COL.muted, 1.2); if (k % 5 === 0 || k === 0) txt(ctx, `${k} m`, X, gy + 24, { font: '11px system-ui', color: COL.muted, fixed: true }); }
    const X0 = sx + x * S; if (X0 < 478){ line(ctx, X0, gy - 70, X0, gy, COL.muted, 1, [4, 4]); txt(ctx, 'impact point', X0 + 4, gy - 78, { font: '11px system-ui', color: COL.muted, align: 'left' }); }
    block(ctx, sx, gy - bs / 2, bs, bs, 0, 'A');
    let bx = null;
    if (st.t < Ta){ // slow motion: the bullet arrives, passes through and leaves
      const tc = 0.55 * Ta, xin = sx + bs / 2, xout = sx - bs / 2;
      if (st.t < tc){ bx = 470 + (xin + 8 - 470) * st.t / tc; bullet(ctx, bx, gy - bs / 2); arrow(ctx, bx - 14, gy - bs / 2 - 26, bx - 52, gy - bs / 2 - 26, COL.c1, 2.4); txt(ctx, 'v_B1', bx - 33, gy - bs / 2 - 40, { color: COL.c1 }); }
      else { const f = (st.t - tc) / (Ta - tc);
        if (f < 0.2){ // inside the block: the bullet moves continuously from the entry face to the exit face (drawn faded)
          bx = (xin + 8) + (xout - 8 - (xin + 8)) * f / 0.2; flash(ctx, xin, gy - bs / 2, 1 - f * 2);
          ctx.save(); ctx.globalAlpha = 0.45; bullet(ctx, bx, gy - bs / 2); ctx.restore(); }
        else { const xo = xout - 8 - (f - 0.2) / 0.8 * 260 * (st.vb2 / 800);
          bx = xo; flash(ctx, xin, gy - bs / 2, 1 - f * 2); if (xo > 0) { bullet(ctx, xo, gy - bs / 2); if (st.vb2 > 1){ arrow(ctx, xo - 14, gy - bs / 2 - 26, xo - 50, gy - bs / 2 - 26, COL.c1, 2.4); txt(ctx, 'v_B2', xo - 32, gy - bs / 2 - 40, { color: COL.c1 }); } } } }
      SLOW(ctx, 12, 204, 'Slow motion: the bullet passes through A in a fraction of a millisecond.');
    } else {
      if (v > 0.05){ arrow(ctx, sx - bs / 2 - 6, gy - bs / 2, sx - bs / 2 - 6 - Math.min(90, 8 * v + 10), gy - bs / 2, COL.c3, 2.6); txt(ctx, 'v_A', sx - bs / 2 - 20 - Math.min(90, 8 * v + 10), gy - bs / 2 - 14, { color: COL.c3 });
        arrow(ctx, sx - 6, gy + 4, sx + 34, gy + 4, COL.c4 || RED, 2.4); txt(ctx, 'F_f', sx + 50, gy - 20, { color: COL.c4 || RED }); }
      SLOW(ctx, 12, 204, `Real time: t = ${fmt(ts, 3)} s after the impact, A has slid ${fmt(x, 3)} m.`);
    }
    // track overview: the whole slide on one strip
    const L0 = 20, L1 = 460, D = Math.max(st.d * 1.08, 1), Y = 22, Xs = q => L1 - (L1 - L0) * q / D;
    line(ctx, L0, Y, L1, Y, COL.axis, 1.4); line(ctx, Xs(0), Y - 6, Xs(0), Y + 6, COL.axis, 1.4); line(ctx, Xs(st.d), Y - 6, Xs(st.d), Y + 6, COL.c2, 2);
    txt(ctx, 'd', Xs(st.d), Y + 16, { color: COL.c2 }); txt(ctx, '0', Xs(0), Y + 16, { font: '11px system-ui', color: COL.muted });
    ctx.save(); ctx.fillStyle = COL.c3; ctx.fillRect(Xs(x) - 5, Y - 5, 10, 10); ctx.restore();
    st.pos = { x, bx: bx === null ? null : (bx - sx) / S, phase: st.t < Ta ? 0 : 1, v };
    const pts = []; for (let i = 0; i <= 80; i++){ const q = st.T * i / 80; pts.push([q, st.vA - st.dec * q]); }
    plot($('x4c-9-plot'), { xmin: 0, xmax: Math.max(st.T, 0.5) * 1.05, ymin: 0, ymax: Math.max(st.vA, 0.5) * 1.12, xlabel: 'time after the impact (s)', ylabel: 'speed of A (m/s)',
      series: [{ pts, color: COL.c3, width: 2.4 }], points: [{ x: ts, y: Math.max(v, 0), color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.C.10: head-on impact that leaves B at rest ---------- */
const BSTOP = V => V.mA * 1.5 * (1 + V.e) / (V.mB - V.e * V.mA);
makeClip({
  id: 'x4c-10', speed: 0.5,
  controls: [
    { key: 'vB', label: 'Speed of B to the left, v_B1', min: 0, max: 5, step: 0.01, value: 1.91, unit: 'm/s', dec: 2 },
    { key: 'e', label: 'Coefficient of restitution e', min: 0, max: 1, step: 0.05, value: 0.4, unit: '', dec: 2 },
    { key: 'mA', label: 'Mass m_A', min: 0.5, max: 6, step: 0.5, value: 2, unit: 'kg', dec: 1 },
    { key: 'mB', label: 'Mass m_B', min: 0.5, max: 6, step: 0.5, value: 3, unit: 'kg', dec: 1 }
  ],
  presets: C => [{ label: 'Book data (B stops)', apply: () => C.set({ mA: 2, mB: 3, e: 0.4, vB: 21 / 11 }) },
    { label: 'Make B stop for these masses and e', apply: () => { const v = BSTOP(C.v); if (v > 0 && v <= 5) C.set({ vB: Math.round(v * 100) / 100 }); } },
    { label: 'Elastic, e = 1', apply: () => C.set({ e: 1 }) }],
  reset(st){
    const V = st.V, vA1 = 1.5, vB1 = -V.vB, mA = V.mA, mB = V.mB, e = V.e;
    const vc = (mA * vA1 + mB * vB1) / (mA + mB);
    st.vA1 = vA1; st.vB1 = vB1; st.vA2 = vc - e * mB / (mA + mB) * (vA1 - vB1); st.vB2 = vc + e * mA / (mA + mB) * (vA1 - vB1); st.tc = 1.2;
    const stop = BSTOP(V);
    setStats('x4c-10-stats', [['v_A2', sgn(st.vA2) + ' m/s (right +)'], ['v_B2', sgn(st.vB2) + ' m/s (right +)', true],
      ['v_B1 that stops B', stop > 0 ? fmt(stop, 4) + ' m/s' : 'none (e m_A ≥ m_B)'],
      ['kinetic energy lost', fmt(0.5 * mA * vA1 * vA1 + 0.5 * mB * vB1 * vB1 - 0.5 * mA * st.vA2 ** 2 - 0.5 * mB * st.vB2 ** 2, 4) + ' J']]);
  },
  step(st){ if (st.t > st.tc + 2.6) st.t = 0; },
  draw(st){
    const cv = $('x4c-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 175]);
    const S = 110, c = 240, gy = 135, bA = 0.36 * S, bB = 0.42 * S, t = st.t - st.tc;
    const xA = t < 0 ? st.vA1 * t : st.vA2 * t, xB = t < 0 ? st.vB1 * t : st.vB2 * t; // contact face at x = 0 at the impact
    floorLine(ctx, 0, 480, gy); txt(ctx, 'smooth', 40, gy + 18, { font: '11px system-ui', color: COL.muted, fixed: true });
    const XA = c + xA * S - bA / 2, XB = c + xB * S + bB / 2;
    const inA = XA > bA / 2 + 2 && XA < 478 - bA / 2, inB = XB > bB / 2 + 2 && XB < 478 - bB / 2; // a block that leaves the frame is not drawn
    if (inA) block(ctx, XA, gy - bA / 2, bA, bA, 0, 'A'); if (inB) block(ctx, XB, gy - bB / 2, bB, bB, 0, 'B');
    flash(ctx, c, gy - bA / 2, 1 - Math.abs(t) / 0.25);
    const va = t < 0 ? st.vA1 : st.vA2, vb = t < 0 ? st.vB1 : st.vB2, k = 22;
    if (inA && Math.abs(va) > 0.02){ arrow(ctx, XA, gy - bA - 14, XA + va * k + Math.sign(va) * 8, gy - bA - 14, COL.c1, 2.6); txt(ctx, t < 0 ? 'v_A1' : 'v_A2', XA + va * k / 2, gy - bA - 30, { color: COL.c1 }); }
    if (inB && Math.abs(vb) > 0.02){ arrow(ctx, XB, gy - bB - 14, XB + vb * k + Math.sign(vb) * 8, gy - bB - 14, COL.c3, 2.6); txt(ctx, t < 0 ? 'v_B1' : 'v_B2', XB + vb * k / 2, gy - bB - 30, { color: COL.c3 }); }
    else if (t >= 0 && inB) txt(ctx, 'B at rest', XB, gy - bB - 26, { font: '12px system-ui', color: COL.c3 });
    txt(ctx, t < 0 ? 'before the impact' : 'after the impact', 12, 18, { font: '600 12px system-ui', color: COL.muted, align: 'left', fixed: true });
    st.pos = { xA: xA - 0.18, xB: xB + 0.21, flash: Math.max(0, 1 - Math.abs(t) / 0.25) };
    const T0 = -st.tc, T1 = 2.6, lo = Math.min(st.vA1, st.vB1, st.vA2, st.vB2, 0), hi = Math.max(st.vA1, st.vB1, st.vA2, st.vB2, 0), pad = 0.15 * (hi - lo) + 0.1;
    plot($('x4c-10-plot'), { xmin: T0, xmax: T1, ymin: lo - pad, ymax: hi + pad, xlabel: 'time relative to the impact (s)', ylabel: 'velocity (m/s, right +)',
      vlines: [{ x: 0, color: COL.muted, dash: [4, 4] }], hlines: [{ y: 0, color: COL.axis }],
      series: [{ pts: [[T0, st.vA1], [0, st.vA1], [0, st.vA2], [T1, st.vA2]], color: COL.c1, width: 2.4 }, { pts: [[T0, st.vB1], [0, st.vB1], [0, st.vB2], [T1, st.vB2]], color: COL.c3, width: 2.4 }],
      points: [{ x: t, y: va, color: COL.c1, r: 5 }, { x: t, y: vb, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.C.11: oblique impact of two spheres (top view) ---------- */
makeClip({
  id: 'x4c-11', speed: 0.5,
  controls: [
    { key: 'e', label: 'Coefficient of restitution e', min: 0, max: 1, step: 0.05, value: 0.6, unit: '', dec: 2 },
    { key: 'vB', label: 'Speed of B, v_B1', min: 0, max: 20, step: 0.5, value: 15, unit: 'm/s', dec: 1 }
  ],
  reset(st){
    const V = st.V, mA = 20, mB = 5, rA = 0.075, rB = 0.048, s = rA / (rA + rB), c = Math.sqrt(1 - s * s);
    const n = [c, -s], tt = [s, c], vA1 = [5, 0], vB1 = [-V.vB, 0], d = (a, b) => a[0] * b[0] + a[1] * b[1];
    const an = d(vA1, n), at = d(vA1, tt), bn = d(vB1, n), bt = d(vB1, tt);
    const an2 = (mA * an + mB * bn + mB * V.e * (bn - an)) / (mA + mB), bn2 = an2 - V.e * (bn - an);
    Object.assign(st, { rA, rB, n, tt, vA1, vB1, vA2: [an2 * n[0] + at * tt[0], an2 * n[1] + at * tt[1]], vB2: [bn2 * n[0] + bt * tt[0], bn2 * n[1] + bt * tt[1]], an, at, bn, bt, an2, bn2, phi: Math.asin(s) });
    const ang = v => fmt(Math.atan2(v[1], v[0]) / RAD, 4) + '°';
    setStats('x4c-11-stats', [['line of impact', fmt(st.phi / RAD, 4) + '° below the x axis'], ['(v_An, v_Bn) after', sgn(an2) + ', ' + sgn(bn2) + ' m/s'],
      ['v_A2', fmt(Math.hypot(...st.vA2), 4) + ' m/s at ' + ang(st.vA2), true], ['v_B2', fmt(Math.hypot(...st.vB2), 4) + ' m/s at ' + ang(st.vB2), true]]);
  },
  step(st){ if (st.t > 3.2) st.t = 0; },
  draw(st){
    const cv = $('x4c-11-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 360]);
    const S = 700, tau = Math.min((st.t - 1.4) * 0.01, 0.01);                       // simulated time (s): 1 s of animation = 10 ms
    const cx = c => [200 + c[0] * S, 140 - c[1] * S];                // contact frame: A's center at the impact is the origin, y up
    const xc = (st.rA + st.rB) * Math.cos(st.phi), Bc = [xc, -st.rA];
    const A = tau < 0 ? [st.vA1[0] * tau, 0] : [st.vA2[0] * tau, st.vA2[1] * tau];
    const B = tau < 0 ? [Bc[0] + st.vB1[0] * tau, Bc[1]] : [Bc[0] + st.vB2[0] * tau, Bc[1] + st.vB2[1] * tau];
    // paths before the impact
    line(ctx, 0, 140, 480, 140, COL.muted, 1, [4, 4]); line(ctx, 0, 140 + st.rA * S, 480, 140 + st.rA * S, COL.muted, 1, [4, 4]);
    // line of impact and the n–t axes at the contact point
    const P = cx([st.rA * st.n[0], st.rA * st.n[1]]);
    line(ctx, P[0] - 150 * st.n[0], P[1] + 150 * st.n[1], P[0] + 150 * st.n[0], P[1] - 150 * st.n[1], COL.c2, 1.2, [6, 4]);
    txt(ctx, 'line of impact', P[0] + 150 * st.n[0] + 6, P[1] - 150 * st.n[1] + 12, { font: '11px system-ui', color: COL.c2, align: 'left' });
    const Q = [420, 80]; // the n–t directions, drawn in a corner so they do not cover the spheres
    arrow(ctx, Q[0], Q[1], Q[0] + 40 * st.n[0], Q[1] - 40 * st.n[1], COL.c2, 2); txt(ctx, 'n', Q[0] + 52 * st.n[0], Q[1] - 52 * st.n[1], { color: COL.c2 });
    arrow(ctx, Q[0], Q[1], Q[0] + 40 * st.tt[0], Q[1] - 40 * st.tt[1], COL.c2, 2); txt(ctx, 't', Q[0] + 52 * st.tt[0], Q[1] - 52 * st.tt[1], { color: COL.c2 });
    if (tau >= 0){ // trails after the impact
      const a0 = cx([0, 0]), a1 = cx(A), b0 = cx(Bc), b1 = cx(B); line(ctx, a0[0], a0[1], a1[0], a1[1], COL.c1, 1.4, [3, 3]); line(ctx, b0[0], b0[1], b1[0], b1[1], COL.c3, 1.4, [3, 3]); }
    const pa = cx(A), pb = cx(B); ball(ctx, pa[0], pa[1], st.rA * S, '#8f8f8f'); ball(ctx, pb[0], pb[1], st.rB * S, '#c8c8c8');
    txt(ctx, 'A', pa[0], pa[1]); txt(ctx, 'B', pb[0], pb[1]);
    flash(ctx, P[0], P[1], 1 - Math.abs(tau) / 0.003);
    const va = tau < 0 ? st.vA1 : st.vA2, vb = tau < 0 ? st.vB1 : st.vB2, k = tau < 0 ? 5 : 3.5;
    const ar = (p, v, r, col, lab) => { const L = Math.hypot(...v); if (L < 0.05) return; const u = [v[0] / L, -v[1] / L];
      arrow(ctx, p[0] + u[0] * (r + 4), p[1] + u[1] * (r + 4), p[0] + u[0] * (r + 10 + k * L), p[1] + u[1] * (r + 10 + k * L), col, 2.6); txt(ctx, lab, p[0] + u[0] * (r + 4 + k * L) - u[1] * 18, p[1] + u[1] * (r + 4 + k * L) + u[0] * 18, { color: col }); };
    if (tau < 0){ // before the impact the velocities are drawn beside the spheres, away from the contact
      arrow(ctx, pa[0] - 30, pa[1] - st.rA * S - 14, pa[0] - 30 + 5 * 5 + 8, pa[1] - st.rA * S - 14, COL.c1, 2.6); txt(ctx, 'v_A1', pa[0] - 30 + k * 2.5, pa[1] - st.rA * S - 30, { color: COL.c1 });
      if (Math.abs(vb[0]) > 0.05){ const x0 = pb[0] + st.rB * S + 8 - k * vb[0]; arrow(ctx, x0, pb[1], pb[0] + st.rB * S + 6, pb[1], COL.c3, 2.6); txt(ctx, 'v_B1', x0 + k * vb[0] / 2, pb[1] - 16, { color: COL.c3 }); }
    } else { ar(pa, va, st.rA * S, COL.c1, 'v_A2'); ar(pb, vb, st.rB * S, COL.c3, 'v_B2'); }
    SLOW(ctx, 12, 14, `Slow motion, top view: t = ${fmt(tau * 1000, 2)} ms (the impact is at t = 0)`);
    st.pos = { A, B, rA: st.rA, rB: st.rB, after: tau >= 0, Bc };
  }
});

/* ---------- 4.C.12: cue ball and object ball, B goes straight to the side pocket (top view) ---------- */
makeClip({
  id: 'x4c-12', speed: 0.5,
  controls: [
    { key: 'e', label: 'Coefficient of restitution e', min: 0, max: 1, step: 0.05, value: 0.9, unit: '', dec: 2 },
    { key: 'th', label: 'Approach angle θ_1', min: 15, max: 75, step: 1, value: 45, unit: '°', dec: 0 }
  ],
  reset(st){
    const V = st.V, v = 2, th = V.th * RAD, e = V.e;
    st.r = 0.0286; st.v = v; st.vA1 = [v * Math.cos(th), v * Math.sin(th)]; st.vA2 = [v * Math.cos(th), (1 - e) / 2 * v * Math.sin(th)]; st.vB2 = [0, (1 + e) / 2 * v * Math.sin(th)];
    st.th2 = Math.atan2(st.vA2[1], st.vA2[0]);
    // A after the impact: if it reaches the cushion (rail at y = Ry) it bounces off it (smooth rail, restitution 0.8),
    // so it never passes through the rail. Aat(τ) gives its position and velocity; the 3D view uses the same function.
    const r = st.r, Ry = 0.30, Ac = [0, -2 * r], eR = 0.8, vx = st.vA2[0], vy = st.vA2[1];
    const tr = vy > 1e-9 ? (Ry - r - Ac[1]) / vy : Infinity; st.tRail = tr;
    st.Aat = tau => { if (tau < 0) return { p: [Ac[0] + st.vA1[0] * tau, Ac[1] + st.vA1[1] * tau], v: st.vA1 };
      if (tau <= tr) return { p: [Ac[0] + vx * tau, Ac[1] + vy * tau], v: st.vA2 };
      return { p: [Ac[0] + vx * tau, Ry - r - eR * vy * (tau - tr)], v: [vx, -eR * vy] }; };
    st.Apath = [0, Math.min(tr, 0.45), 0.45].map(q => st.Aat(q).p);
    setStats('x4c-12-stats', [['tan θ_2 = ((1 − e)/2) tan θ_1', fmt(Math.tan(st.th2), 4)], ['θ_2', fmt(st.th2 / RAD, 4) + '°', true],
      ['v_A2 / v_A1', fmt(Math.hypot(...st.vA2) / v, 4)], ['v_B2 / v_A1', fmt(st.vB2[1] / v, 4)]]);
  },
  step(st){ if (st.t > 3.4) st.t = 0; },
  draw(st){
    const cv = $('x4c-12-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 400]);
    const S = 380, tau = Math.min((st.t - 1.0) * 0.25, 0.45), r = st.r, Ry = 0.30;    // B starts at the origin; the rail is Ry above B
    const cx = p => [200 + p[0] * S, 200 - p[1] * S];
    // cloth, rail and side pocket
    ctx.save(); ctx.fillStyle = '#e3efe6'; ctx.fillRect(0, cx([0, Ry])[1], 480, 400); ctx.restore();
    const ry = cx([0, Ry])[1], pr = 0.055 * S, px0 = cx([0, 0])[0];
    line(ctx, 0, ry, px0 - pr, ry, COL.fg, 2.4); line(ctx, px0 + pr, ry, 480, ry, COL.fg, 2.4); hatch(ctx, px0 - pr, ry, 0, ry, 1, 8, 6); hatch(ctx, 480, ry, px0 + pr, ry, 1, 8, 6);
    ctx.save(); ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(px0, ry, pr, Math.PI, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'side pocket', px0 + pr + 8, ry - 12, { font: '11px system-ui', color: COL.muted, align: 'left', fixed: true });
    const Ac = [0, -2 * r];                                             // A's center at the impact: directly below B, so the line of impact is vertical
    const Anow = st.Aat(tau), A = Anow.p;
    let B = tau < 0 ? [0, 0] : [0, st.vB2[1] * tau], inPocket = B[1] > Ry;
    // dashed path of A before and after
    const a0 = cx([Ac[0] - st.vA1[0] * 0.25, Ac[1] - st.vA1[1] * 0.25]), ac = cx(Ac), ap = st.Apath.map(cx);
    line(ctx, a0[0], a0[1], ac[0], ac[1], COL.muted, 1, [4, 4]); line(ctx, ap[0][0], ap[0][1], ap[1][0], ap[1][1], COL.muted, 1, [4, 4]); line(ctx, ap[1][0], ap[1][1], ap[2][0], ap[2][1], COL.muted, 1, [4, 4]);
    line(ctx, ac[0], ac[1], ac[0] + 70, ac[1], COL.muted, 1); // horizontal reference for θ_2
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ac[0], ac[1], 56, -st.th2, 0); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ_2', ac[0] + 76, ac[1] - 12, { color: COL.muted });
    line(ctx, ac[0] - 70, ac[1], ac[0], ac[1], COL.muted, 1); // the angle θ_1 of the incoming path, at the impact point
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ac[0], ac[1], 44, Math.PI - st.V.th * RAD, Math.PI, false); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ_1', ac[0] + 58 * Math.cos(Math.PI - st.V.th * RAD / 2), ac[1] + 58 * Math.sin(Math.PI - st.V.th * RAD / 2), { color: COL.muted });
    if (!inPocket){ const pb = cx(B); ball(ctx, pb[0], pb[1], r * S, '#c94040'); txt(ctx, 'B', pb[0] + r * S + 12, pb[1]); }
    else txt(ctx, 'B is in the pocket', px0, ry + 22, { font: '12px system-ui', color: COL.c3 });
    const pa = cx(A); ball(ctx, pa[0], pa[1], r * S, '#e8e2d0'); txt(ctx, 'A', pa[0] - r * S - 12, pa[1] + 6);
    flash(ctx, ac[0], ac[1] - r * S, 1 - Math.abs(tau) / 0.05);
    const k = 30, ar = (p, v, col, lab, side = 1) => { const L = Math.hypot(...v); if (L < 0.02) return; const u = [v[0] / L, -v[1] / L];
      arrow(ctx, p[0] + u[0] * (r * S + 3), p[1] + u[1] * (r * S + 3), p[0] + u[0] * (r * S + 8 + k * L), p[1] + u[1] * (r * S + 8 + k * L), col, 2.6);
      txt(ctx, lab, p[0] + u[0] * (r * S + 14 + k * L) + side * u[1] * 16, p[1] + u[1] * (r * S + 14 + k * L) - side * u[0] * 16, { color: col }); };
    ar(pa, Anow.v, COL.c1, tau < 0 ? 'v_A1' : 'v_A2', tau < 0 ? -1 : 1);
    if (tau >= 0 && B[1] < Ry - 0.12) ar(cx(B), st.vB2, COL.c3, 'v_B2');
    SLOW(ctx, 12, 390, `Top view, slow motion (v_A1 = 2 m/s): t = ${fmt(tau, 3)} s`);
    st.pos = { A, vA: Anow.v, B, r, inPocket, Ry };
  }
});

/* ---------- 4.C.13: Newton's cradle with N balls and restitution e ---------- */
makeClip({
  id: 'x4c-13', speed: 0.5,
  controls: [
    { key: 'N', label: 'Number of pendulums N', min: 2, max: 8, step: 1, value: 5, unit: '', dec: 0 },
    { key: 'e', label: 'Coefficient of restitution e', min: 0.5, max: 1, step: 0.01, value: 0.9, unit: '', dec: 2 },
    { key: 'v0', label: 'Speed of ball 1 at impact, v_0', min: 0.3, max: 1.5, step: 0.05, value: 1, unit: 'm/s', dec: 2 }
  ],
  reset(st){
    const V = st.V, N = Math.round(V.N), L = 0.25, r = 0.02, gap = 0.0015;
    st.N = N; st.L = L; st.r = r; st.gap = gap; st.piv = Array.from({ length: N }, (_, i) => (i - (N - 1) / 2) * (2 * r + gap));
    const th0 = Math.acos(1 - V.v0 * V.v0 / (2 * G0 * L));                      // release angle of ball 1 so that it arrives with speed v_0
    st.th = st.piv.map((_, i) => i === 0 ? -th0 : 0); st.w = st.piv.map(() => 0); st.th0 = th0;
    st.vN = Math.pow((1 + V.e) / 2, N - 1) * V.v0; st.hN = st.vN * st.vN / (2 * G0); st.hMax = 0; st.firstDone = false; st.hist = []; st.hit = 0;
    setStats('x4c-13-stats', [['v_N = ((1 + e)/2)^{N−1} v_0', fmt(st.vN, 4) + ' m/s', true], ['h = v_N²/(2g)', fmt(st.hN * 1000, 4) + ' mm', true],
      ['h measured (first swing of N)', '—']]);
  },
  step(st, dt){
    if (st.t > 7){ st.t = 0; st.th = st.piv.map((_, i) => i === 0 ? -st.th0 : 0); st.w = st.piv.map(() => 0); st.hMax = 0; st.firstDone = false; st.hist = []; st.hit = 0; return; }
    const N = st.N, L = st.L, r = st.r, e = st.V.e, h = 2e-4, n = Math.min(400, Math.ceil(dt / h));
    for (let k = 0; k < n; k++){
      for (let i = 0; i < N; i++){ st.w[i] -= (G0 / L) * Math.sin(st.th[i]) * (dt / n); st.th[i] += st.w[i] * (dt / n); }
      for (let it = 0; it < 3 * N; it++){ let any = false;
        for (let i = 0; i < N - 1; i++){
          const xi = st.piv[i] + L * Math.sin(st.th[i]), xj = st.piv[i + 1] + L * Math.sin(st.th[i + 1]);
          const ui = L * st.w[i] * Math.cos(st.th[i]), uj = L * st.w[i + 1] * Math.cos(st.th[i + 1]);
          if (xj - xi <= 2 * r && ui > uj){ // equal masses, restitution e along the horizontal line of impact
            const a = ((1 - e) * ui + (1 + e) * uj) / 2, b = ((1 + e) * ui + (1 - e) * uj) / 2;
            st.w[i] = a / (L * Math.cos(st.th[i])); st.w[i + 1] = b / (L * Math.cos(st.th[i + 1])); any = true; if (i === N - 2) st.hit++;
          } }
        if (!any) break; }
      const hN = L * (1 - Math.cos(st.th[N - 1]));
      if (!st.firstDone && st.hit > 0){ st.hMax = Math.max(st.hMax, hN); if (st.w[N - 1] < 0) st.firstDone = true; }
    }
    st.hist.push([st.t, 1000 * L * (1 - Math.cos(st.th[N - 1]))]);
    if (st.hMax > 0) setStats('x4c-13-stats', [['v_N = ((1 + e)/2)^{N−1} v_0', fmt(st.vN, 4) + ' m/s', true], ['h = v_N²/(2g)', fmt(st.hN * 1000, 4) + ' mm', true],
      ['h measured (first swing of N)', fmt(st.hMax * 1000, 4) + ' mm' + (st.firstDone ? '' : ' (rising)')]]);
  },
  draw(st){
    const cv = $('x4c-13-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 250]);
    const S = 700, N = st.N, L = st.L, r = st.r, top = 30, c = 240;
    ceilingBar(ctx, c + (st.piv[0] - 0.05) * S, c + (st.piv[N - 1] + 0.05) * S, top);
    const P = st.piv.map((p, i) => [c + (p + L * Math.sin(st.th[i])) * S, top + L * Math.cos(st.th[i]) * S]);
    // height reached by ball N (predicted)
    const yH = top + (L - st.hN) * S; line(ctx, c + st.piv[N - 1] * S - 10, yH, c + (st.piv[N - 1] + 0.2) * S, yH, COL.c2, 1.2, [5, 4]);
    txt(ctx, 'h predicted', c + (st.piv[N - 1] + 0.2) * S + 4, yH, { font: '11px system-ui', color: COL.c2, align: 'left' });
    line(ctx, c + (st.piv[0] - 0.05) * S, top + L * S + r * S, c + (st.piv[N - 1] + 0.25) * S, top + L * S + r * S, COL.grid || COL.muted, 1, [2, 4]);
    P.forEach((p, i) => { line(ctx, c + st.piv[i] * S, top, p[0], p[1], COL.fg, 1.4); });
    P.forEach(p => ball(ctx, p[0], p[1], r * S, '#a9aeb8'));
    txt(ctx, '1', P[0][0], P[0][1] + r * S + 14, { font: '12px system-ui' }); txt(ctx, 'N', P[N - 1][0], P[N - 1][1] + r * S + 14, { font: 'italic 13px Georgia, serif' });
    st.pos = { th: st.th.slice(), piv: st.piv, L, r, N };
    const pts = st.hist;
    plot($('x4c-13-plot'), { xmin: 0, xmax: 7, ymin: 0, ymax: 1.3 * Math.max(st.hN * 1000, 5), xlabel: 'time (s)', ylabel: 'height of ball N (mm)',
      hlines: [{ y: st.hN * 1000, color: COL.c2, dash: [5, 4] }], series: [{ pts, color: COL.c3, width: 2 }], points: pts.length ? [{ x: pts[pts.length - 1][0], y: pts[pts.length - 1][1], color: COL.c3, r: 4 }] : [] });
  }
});

subLabels();
})();
