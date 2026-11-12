/* =========================================================
   Chapter 4, linear impulse–momentum examples 4.C.1 to 4.C.7
   Clip ids x4c-1 ... x4c-7. Each clip keeps the quantities that its 3D view needs in its state.
   ========================================================= */
(function(){

const GFT = 32.2;
// ground line with hatching and distance ticks that scroll with the camera (world x, scale S px per unit)
function scrollGround(ctx, x0, x1, y, cam, ox, S, step, unit, every = 1){
  const g0 = x0 - 600, g1 = x1 + 600;                                  // the floor runs past both edges of the canvas
  line(ctx, g0, y, g1, y, COL.fg, 2); hatch(ctx, g0, y, g1, y, 1, 9, 7);
  const k0 = Math.floor((cam + (g0 - ox) / S) / step), k1 = Math.ceil((cam + (g1 - ox) / S) / step);
  for (let k = k0; k <= k1; k++){ const X = ox + (k * step - cam) * S;
    line(ctx, X, y, X, y - 7, COL.muted, 1.4);
    if (k % every === 0 && X > x0 + 14 && X < x1 - 14) txt(ctx, `${fmt(k * step, 4)} ${unit}`, X, y + 42, { font: '10px system-ui', color: COL.muted, fixed: true }); }
}
function hold(st, T, pause){ if (st.t > T){ st.hold = st.hold ?? st.t; if (st.t > st.hold + pause){ st.t = 0; st.hold = undefined; st.restart && st.restart(st); } } }

/* ---------- 4.C.1: block pushed by a force pulse on a rough floor ---------- */
makeClip({
  id: 'x4c-1', speed: 0.1,
  controls: [
    { key: 'F0', label: 'Peak force F_0', min: 0, max: 60, step: 1, value: 20, unit: 'N', dec: 1 },
    { key: 'mu', label: 'Kinetic friction μ_k', min: 0, max: 0.5, step: 0.01, value: 0.15, dec: 2 },
    { key: 'v1', label: 'Initial speed v_1', min: 0, max: 30, step: 0.5, value: 15, unit: 'm/s', dec: 1 }
  ],
  reset(st){
    const V = st.V, m = 8, dt = 0.2, f = V.mu * m * G0; st.m = m; st.dt = dt; st.f = f; st.hold = undefined;
    st.F = t => t < dt ? V.F0 : t < 2 * dt ? V.F0 * (2 - t / dt) : 0;
    // integrate once: the block stays at rest when the push cannot overcome friction
    const h = 1e-4, N = Math.round(2 * dt / h); st.tr = [[0, 0, V.v1, V.v1 > 0 ? f : Math.min(f, st.F(0))]];
    let x = 0, v = V.v1;
    for (let i = 1; i <= N; i++){ const t = i * h, F = st.F(t); let ff;
      if (v > 1e-9){ ff = f; } else { ff = Math.min(F, f); v = 0; }
      v = Math.max(0, v + (F - ff) / m * h); x += v * h; st.tr.push([t, x, v, ff]); }
    const vAt = t => st.tr[Math.round(t / h)][2];
    st.va = vAt(dt); st.vb = vAt(2 * dt);
    setStats('x4c-1-stats', [['friction force μ_k m g', fmt(f, 4) + ' N'], ['v at t = Δt', fmt(st.va, 5) + ' m/s', true], ['v at t = 2Δt', fmt(st.vb, 5) + ' m/s', true]]);
  },
  step(st){ hold(st, 2 * st.dt, 0.15); },
  draw(st){
    const cv = $('x4c-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [60, 40, 500, 230]);
    const t = Math.min(st.hold ?? st.t, 2 * st.dt), i = Math.min(st.tr.length - 1, Math.round(t / 1e-4)), [, x, v, ff] = st.tr[i], F = st.F(t);
    st.x = x; st.v = v; st.Fnow = F; st.fnow = ff; st.tnow = t;
    const S = 40, ox = 250, gy = 180, bw = 64, bh = 52;
    scrollGround(ctx, 60, 500, gy, x, ox, S, 1, 'm', 2);
    txt(ctx, 'μ_k', 440, gy - 16, { color: COL.muted });
    block(ctx, ox, gy - bh / 2, bw, bh, 0, 'A');
    if (F > 0.05) { const L = 12 + F * 2.2; arrow(ctx, ox - bw / 2 - L, gy - bh / 2, ox - bw / 2 - 1, gy - bh / 2, COL.c1, 3); txt(ctx, 'F', ox - bw / 2 - L / 2, gy - bh / 2 - 14, { color: COL.c1 }); }
    if (ff > 0.05) { const L = 10 + ff * 2.2; arrow(ctx, ox, gy + 1, ox - L, gy + 1, RED, 3); txt(ctx, 'F_f', ox - L / 2, gy + 20, { color: RED }); }
    if (v > 0.05) { const L = 10 + v * 4; arrow(ctx, ox - L / 2, gy - bh - 22, ox + L / 2, gy - bh - 22, COL.c3, 2.6); txt(ctx, `v = ${fmt(v, 4)} m/s`, ox, gy - bh - 40, { font: '13px system-ui', color: COL.c3 }); }
    txt(ctx, `t = ${fmt(t, 3)} s`, 495, 52, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const pf = [], pfr = [], pv = []; for (let k = 0; k < st.tr.length; k += 20){ const q = st.tr[k]; pf.push([q[0], st.F(q[0])]); pfr.push([q[0], q[3]]); pv.push([q[0], q[2]]); }
    const fmax = Math.max(st.V.F0, st.f, 1), vs = pv.map(p => p[1]);
    plot($('x4c-1-plot'), { xmin: 0, xmax: 2 * st.dt, ymin: 0, ymax: fmax * 1.15, xlabel: 'time t (s)', ylabel: 'force (N)',
      series: [{ pts: pf, color: COL.c1, width: 2.4 }, { pts: pfr, color: RED, width: 2.2, dash: [6, 4] }], vlines: [{ x: st.dt, label: 'Δt' }],
      points: [{ x: t, y: F, color: COL.c1, r: 5 }, { x: t, y: ff, color: RED, r: 4 }] });
    const lo = Math.min(...vs), hi = Math.max(...vs), pad = Math.max(0.2, (hi - lo) * 0.25);
    plot($('x4c-1-plot2'), { xmin: 0, xmax: 2 * st.dt, ymin: Math.max(0, lo - pad), ymax: hi + pad, xlabel: 'time t (s)', ylabel: 'speed v (m/s)',
      series: [{ pts: pv, color: COL.c3, width: 2.4 }], vlines: [{ x: st.dt, label: 'Δt' }], points: [{ x: t, y: v, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.C.2: block at rest, then pushed by a growing force ---------- */
makeClip({
  id: 'x4c-2', speed: 1,
  controls: [
    { key: 'F10', label: 'Force at t = 10 s', min: 0, max: 400, step: 5, value: 200, unit: 'lb', dec: 1 },
    { key: 'ms', label: 'Static friction μ_s', min: 0, max: 1, step: 0.05, value: 0.5, dec: 2 },
    { key: 'mk', label: 'Kinetic friction μ_k', min: 0, max: 1, step: 0.05, value: 0.2, dec: 2 }
  ],
  reset(st){
    const V = st.V, W = 100, m = W / GFT, k = V.F10 / 10, mk = Math.min(V.mk, V.ms);
    st.W = W; st.m = m; st.k = k; st.mk = mk; st.hold = undefined;
    st.t1 = k > 0 ? V.ms * W / k : Infinity;
    const t1 = st.t1;
    st.vel = t => t <= t1 ? 0 : (k / 2 * (t * t - t1 * t1) - mk * W * (t - t1)) / m;
    st.pos = t => t <= t1 ? 0 : (k / 6 * (t ** 3 - t1 ** 3) - k / 2 * t1 * t1 * (t - t1) - mk * W / 2 * (t - t1) ** 2) / m;
    st.fr = t => t <= t1 ? k * t : mk * W;
    setStats('x4c-2-stats', [['P starts to slide at t_1', t1 <= 10 ? fmt(t1, 4) + ' s' : 'never (before 10 s)'], ['kinetic friction μ_k W', fmt(mk * W, 4) + ' lb'],
      ['v at t = 10 s', fmt(st.vel(10), 5) + ' ft/s', true]]);
  },
  step(st){ hold(st, 10, 1.5); },
  draw(st){
    const cv = $('x4c-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [60, 30, 500, 220]);
    const t = Math.min(st.hold ?? st.t, 10), x = st.pos(t), v = st.vel(t), F = st.k * t, ff = st.fr(t);
    st.x = x; st.v = v; st.Fnow = F; st.fnow = ff; st.tnow = t; st.sliding = t > st.t1;
    const S = 3, ox = 260, gy = 170, bw = 70, bh = 52;
    scrollGround(ctx, 60, 500, gy, x, ox, S, 10, 'ft', 5);
    block(ctx, ox, gy - bh / 2, bw, bh, 0, 'P');
    if (F > 0.5){ const L = 8 + F * 0.4; arrow(ctx, ox - bw / 2 - L, gy - bh / 2, ox - bw / 2 - 1, gy - bh / 2, COL.c1, 3); txt(ctx, 'F', ox - bw / 2 - L / 2, gy - bh / 2 - 14, { color: COL.c1 }); }
    if (ff > 0.5){ const L = 8 + ff * 0.4; arrow(ctx, ox, gy + 1, ox - L, gy + 1, RED, 3); txt(ctx, st.sliding ? 'μ_k N' : 'F_s', ox - L / 2, gy + 20, { color: RED }); }
    if (v > 0.5){ const L = 10 + Math.min(110, v * 0.5); arrow(ctx, ox - L / 2, gy - bh - 20, ox + L / 2, gy - bh - 20, COL.c3, 2.6); }
    txt(ctx, st.sliding ? `sliding, v = ${fmt(v, 4)} ft/s` : 'at rest: static friction balances F', ox, gy - bh - 40, { font: '13px system-ui', color: st.sliding ? COL.c3 : COL.muted });
    txt(ctx, `t = ${fmt(t, 3)} s`, 495, 42, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const pf = [], pr = [], pv = []; for (let i = 0; i <= 200; i++){ const q = 10 * i / 200; pf.push([q, st.k * q]); pr.push([q, st.fr(q)]); pv.push([q, st.vel(q)]); }
    plot($('x4c-2-plot'), { xmin: 0, xmax: 10, ymin: 0, ymax: Math.max(10, st.k * 10, st.V.ms * st.W) * 1.12, xlabel: 'time t (s)', ylabel: 'force (lb)',
      series: [{ pts: pf, color: COL.c1, width: 2.4 }, { pts: pr, color: RED, width: 2.2, dash: [6, 4] }], vlines: st.t1 <= 10 ? [{ x: st.t1, label: 't₁' }] : [],
      points: [{ x: t, y: F, color: COL.c1, r: 5 }, { x: t, y: ff, color: RED, r: 4 }] });
    const vmax = Math.max(1, st.vel(10));
    plot($('x4c-2-plot2'), { xmin: 0, xmax: 10, ymin: 0, ymax: vmax * 1.1, xlabel: 'time t (s)', ylabel: 'speed v (ft/s)',
      series: [{ pts: pv, color: COL.c3, width: 2.4 }], points: [{ x: t, y: v, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.C.3: tug and barge, winch takes in the towing cable ---------- */
makeClip({
  id: 'x4c-3', speed: 1,
  controls: [
    { key: 'm', label: 'Tug mass m', min: 10, max: 200, step: 5, value: 40, unit: 't', dec: 1 },
    { key: 'M', label: 'Barge mass M', min: 50, max: 1000, step: 10, value: 400, unit: 't', dec: 1 },
    { key: 'vA1', label: 'Towing speed v_{A1}', min: 1, max: 6, step: 0.1, value: 3, unit: 'm/s', dec: 2 },
    { key: 'vr', label: 'Winch rate v_{B/A}', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'm/s', dec: 2 },
    { key: 'Dt', label: 'Time Δt', min: 1, max: 10, step: 0.5, value: 5, unit: 's', dec: 2 }
  ],
  reset(st){
    const V = st.V, m = V.m * 1000, M = V.M * 1000; st.hold = undefined;
    st.vA2 = V.vA1 - M * V.vr / (m + M); st.vB2 = st.vA2 + V.vr; st.T = m * (V.vA1 - st.vA2) / V.Dt;
    st.t0 = 1.5; st.tEnd = st.t0 + V.Dt + 6;
    setStats('x4c-3-stats', [['tug speed v_{A2}', fmt(st.vA2, 4) + ' m/s', true], ['barge speed v_{B2}', fmt(st.vB2, 4) + ' m/s'],
      ['average tension T', fmt(st.T / 1000, 4) + ' kN', true], ['speed of the mass center', fmt(V.vA1, 4) + ' m/s (unchanged)']]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4c-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 230]);
    const V = st.V, m = V.m, M = V.M, t = Math.min(st.hold ?? st.t, st.tEnd), t0 = st.t0, Dt = V.Dt;
    // distance travelled to the LEFT (positive), constant tension during the winch phase
    const aA = -(V.vA1 - st.vA2) / Dt, aB = (st.vB2 - V.vA1) / Dt;
    const mv = (v1, a, v2, q) => q <= t0 ? v1 * q : q <= t0 + Dt ? v1 * t0 + v1 * (q - t0) + 0.5 * a * (q - t0) ** 2 : v1 * (t0 + Dt) + 0.5 * a * Dt * Dt + v2 * (q - t0 - Dt);
    const vel = (v1, a, v2, q) => q <= t0 ? v1 : q <= t0 + Dt ? v1 + a * (q - t0) : v2;
    const uA = mv(V.vA1, aA, st.vA2, t), uB = mv(V.vA1, aB, st.vB2, t), vA = vel(V.vA1, aA, st.vA2, t), vB = vel(V.vA1, aB, st.vB2, t);
    const LT = 25, LB = 60, L0 = 40, gap = L0 - (uB - uA);            // cable length between tug stern and barge bow (m)
    const uG = (m * uA + M * (uB - LT / 2 - L0 - LB / 2)) / (m + M);
    st.uA = uA; st.uB = uB; st.vA = vA; st.vB = vB; st.gap = gap; st.Tnow = t > t0 && t < t0 + Dt ? st.T : 0; st.tnow = t; st.reel = t > t0;
    // camera follows the mass center of tug + barge, which moves at the constant speed v_A1
    const S = 3.2, cam = uG, wy = 150;
    const X = u => 300 - (u - cam) * S;                                 // screen x of a point that has travelled u to the left
    ctx.fillStyle = 'rgba(70,130,180,0.18)'; ctx.fillRect(-600, wy, 1760, 80);
    for (let k = Math.floor((cam - 300) / 20); k <= Math.ceil((cam + 300) / 20); k++){ const xx = X(k * 20);
      line(ctx, xx - 8, wy + 14, xx + 8, wy + 14, 'rgba(70,130,180,0.7)', 1.6); }
    const xs = X(uA) + LT / 2 * S, xb = X(uB - LT / 2 - L0) ;          // tug stern, barge bow (screen)
    // tug: hull + cabin; barge: long low hull with coal
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
    const tx0 = X(uA) - LT / 2 * S, tx1 = xs;
    ctx.beginPath(); ctx.moveTo(tx0, wy - 14); ctx.lineTo(tx1, wy - 14); ctx.lineTo(tx1 - 6, wy + 8); ctx.lineTo(tx0 + 10, wy + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9d9a8'; ctx.beginPath(); ctx.moveTo(tx0 + 22, wy - 14); ctx.lineTo(tx0 + 30, wy - 40); ctx.lineTo(tx0 + 48, wy - 40); ctx.lineTo(tx0 + 54, wy - 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    const bx0 = xb, bx1 = xb + LB * S;
    ctx.fillStyle = '#b9b2a0'; ctx.beginPath(); ctx.moveTo(bx0, wy - 10); ctx.lineTo(bx1, wy - 10); ctx.lineTo(bx1 - 8, wy + 6); ctx.lineTo(bx0 + 8, wy + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3d44'; ctx.beginPath(); ctx.moveTo(bx0 + 14, wy - 10); ctx.quadraticCurveTo((bx0 + bx1) / 2, wy - 34, bx1 - 14, wy - 10); ctx.closePath(); ctx.fill();
    ctx.restore();
    // winch drum on the stern of the tug; it turns while the cable comes in
    const wx = tx1 - 12, wyy = wy - 22, ang = st.reel ? -(uB - uA) / 1.2 : 0;
    cable(ctx, () => { ctx.moveTo(wx, wyy + 6); ctx.lineTo(bx0 + 4, wy - 12); });
    wheel(ctx, wx, wyy, 7, ang, 'disk', '#9aa0a8');
    txt(ctx, 'A', (tx0 + tx1) / 2, wy - 58); txt(ctx, 'B', (bx0 + bx1) / 2, wy - 42);
    // velocity arrows (to the left) and the tension during the winch phase
    const va = (x0, y, v, col, lab) => { const L = 10 + v * 16; arrow(ctx, x0, y, x0 - L, y, col, 2.6); txt(ctx, lab, x0 - L / 2, y + 15, { color: col, font: '13px system-ui' }); };
    va((tx0 + tx1) / 2 + 20, wy + 34, vA, COL.c3, `v_A = ${fmt(vA, 3)} m/s`); va((bx0 + bx1) / 2 + 30, wy + 34, vB, COL.c2, `v_B = ${fmt(vB, 3)} m/s`);
    if (st.Tnow > 0){ arrow(ctx, wx + 4, wyy + 10, wx + 40, wyy + 14, RED, 2.6); txt(ctx, 'T', wx + 46, wyy + 2, { color: RED });
      arrow(ctx, bx0 + 4, wy - 12, bx0 - 32, wy - 16, RED, 2.6); txt(ctx, 'T', bx0 - 36, wy - 28, { color: RED }); }
    // mass center of the system (stays at the centre of the view)
    ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(300, wy - 4, 4, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); txt(ctx, 'G', 300, wy - 18, { font: 'italic 13px Georgia, serif' });
    const phase = t < t0 ? 'towing at v_{A1}, cable taut' : t < t0 + Dt ? 'winch hauls in the cable (tension T)' : 'cable comes in at v_{B/A}, no tension needed';
    txt(ctx, phase, 280, 18, { font: '13px system-ui', color: COL.muted });
    txt(ctx, `t = ${fmt(t, 3)} s`, 552, 18, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
    const pa = [], pb = [], pt = []; for (let i = 0; i <= 200; i++){ const q = st.tEnd * i / 200; pa.push([q, vel(V.vA1, aA, st.vA2, q)]); pb.push([q, vel(V.vA1, aB, st.vB2, q)]); }
    pt.push([0, 0], [t0, 0], [t0, st.T / 1000], [t0 + Dt, st.T / 1000], [t0 + Dt, 0], [st.tEnd, 0]);
    plot($('x4c-3-plot'), { xmin: 0, xmax: st.tEnd, ymin: Math.min(0, st.vA2) - 0.2, ymax: Math.max(st.vB2, V.vA1) + 0.4, xlabel: 'time t (s)', ylabel: 'speed to the left (m/s)',
      series: [{ pts: pa, color: COL.c3, width: 2.4 }, { pts: pb, color: COL.c2, width: 2.4 }], hlines: [{ y: V.vA1 }],
      points: [{ x: t, y: vA, color: COL.c3, r: 5 }, { x: t, y: vB, color: COL.c2, r: 5 }] });
    plot($('x4c-3-plot2'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: st.T / 1000 * 1.25 + 0.1, xlabel: 'time t (s)', ylabel: 'cable tension T (kN)',
      series: [{ pts: pt, color: RED, width: 2.4 }], points: [{ x: t, y: st.Tnow / 1000, color: RED, r: 5 }] });
  }
});

/* ---------- 4.C.4: car A runs into car B and they couple ---------- */
makeClip({
  id: 'x4c-4', speed: 0.5,
  controls: [
    { key: 'mA', label: 'Mass of car A, m_A', min: 200, max: 3000, step: 50, value: 1500, unit: 'kg', dec: 1 },
    { key: 'mB', label: 'Mass of car B, m_B', min: 200, max: 3000, step: 50, value: 1000, unit: 'kg', dec: 1 },
    { key: 'v', label: 'Speed of A, v_{A1}', min: 2, max: 30, step: 0.5, value: 20, unit: 'm/s', dec: 1 }
  ],
  reset(st){
    const V = st.V; st.v2 = V.mA * V.v / (V.mA + V.mB); st.frac = -V.mB / (V.mA + V.mB); st.hold = undefined;
    st.T1 = 0.5 * V.mA * V.v * V.v; st.T2 = 0.5 * (V.mA + V.mB) * st.v2 * st.v2;
    st.tc = 14 / V.v; st.tEnd = st.tc + 1.6;
    setStats('x4c-4-stats', [['common speed v_2', fmt(st.v2, 4) + ' m/s'], ['T_1', fmt(st.T1 / 1000, 4) + ' kJ'], ['T_2', fmt(st.T2 / 1000, 4) + ' kJ'],
      ['(T_2 − T_1)/T_1 = −m_B/(m_A + m_B)', fmt(st.frac, 4), true]]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4c-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 20, 560, 210]);
    const V = st.V, t = Math.min(st.hold ?? st.t, st.tEnd), after = t >= st.tc;
    const L = 4.4, xB0 = 0;                                       // car length (m); B's rear bumper starts at x = 0
    const xA = after ? -L / 2 + st.v2 * (t - st.tc) - L / 2 : -14 + V.v * t - L;   // centre positions (m)
    const xAc = after ? -L / 2 + st.v2 * (t - st.tc) : -14 + V.v * t - L / 2, xBc = after ? L / 2 + st.v2 * (t - st.tc) : L / 2;
    const vA = after ? st.v2 : V.v, vB = after ? st.v2 : 0;
    st.xA = xAc; st.xB = xBc; st.vA = vA; st.vB = vB; st.after = after; st.flash = after && t - st.tc < 0.12; st.tnow = t;
    const S = 10, ox = 160, gy = 150, X = x => ox + x * S;
    scrollGround(ctx, 10, 550, gy + 10, 0, ox, S, 5, 'm', 2);
    const car = (xc, lab, col) => { block(ctx, X(xc), gy - 14, L * S, 24, 0, lab, col); wheels(ctx, X(xc), gy, L * S); };   // wheels (radius 5 px) touch the road at gy + 10
    car(xAc, 'A', '#e9d9a8'); car(xBc, 'B', '#cfd8ea');
    if (st.flash){ ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2; for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(X(0) + 8 * Math.cos(a), gy - 14 + 8 * Math.sin(a)); ctx.lineTo(X(0) + 18 * Math.cos(a), gy - 14 + 18 * Math.sin(a)); ctx.stroke(); } ctx.restore(); }
    if (vA > 0.05){ const l = 10 + vA * 3.5; arrow(ctx, X(xAc) - l / 2, gy - 46, X(xAc) + l / 2, gy - 46, COL.c3, 2.6); txt(ctx, after ? 'v_2' : 'v_{A1}', X(xAc), gy - 62, { color: COL.c3 }); }
    if (after && !st.flash){ txt(ctx, 'A and B coupled', X((xAc + xBc) / 2), gy - 84, { font: '13px system-ui', color: COL.muted }); }
    // kinetic energy bars: before and now
    const Tn = after ? st.T2 : st.T1;
    ebars(ctx, 420, 40, 130, 80, [{ label: 'T_1', val: st.T1, color: COL.c3, num: fmt(st.T1 / 1000, 3) + ' kJ' }, { label: 'T now', val: Tn, color: after ? RED : COL.c3, num: fmt(Tn / 1000, 3) + ' kJ' }], st.T1, 'Kinetic energy');
    txt(ctx, `t = ${fmt(t, 3)} s`, 30, 18, { font: '12px system-ui', color: COL.muted, align: 'left', fixed: true });
    const pa = [], pb = []; for (let i = 0; i <= 200; i++){ const q = st.tEnd * i / 200; pa.push([q, q < st.tc ? V.v : st.v2]); pb.push([q, q < st.tc ? 0 : st.v2]); }
    plot($('x4c-4-plot'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: V.v * 1.12, xlabel: 'time t (s)', ylabel: 'velocity (m/s)',
      series: [{ pts: pa, color: COL.c3, width: 2.4 }, { pts: pb, color: COL.c2, width: 2.4, dash: [6, 4] }], vlines: [{ x: st.tc, label: 'impact' }],
      points: [{ x: t, y: vA, color: COL.c3, r: 5 }, { x: t, y: vB, color: COL.c2, r: 4 }] });
  }
});

/* ---------- 4.C.5: basketball bouncing off the floor ---------- */
makeClip({
  id: 'x4c-5', speed: 0.5,
  controls: [
    { key: 'v1', label: 'Speed before, v_1', min: 5, max: 40, step: 0.5, value: 20, unit: 'ft/s', dec: 1 },
    { key: 'v2', label: 'Speed after, v_2', min: 0, max: 40, step: 0.5, value: 17, unit: 'ft/s', dec: 1 },
    { key: 'th', label: 'Angle θ between the lines of travel', min: 0, max: 120, step: 1, value: 20, unit: '°', dec: 0 },
    { key: 'dt', label: 'Impact time Δt', min: 0.002, max: 0.05, step: 0.001, value: 0.01, unit: 's', dec: 3 }
  ],
  reset(st){
    const V = st.V, W = 1.3, m = W / GFT, a = V.th / 2 * RAD; st.m = m; st.W = W; st.hold = undefined;
    st.u1 = [V.v1 * Math.sin(a), -V.v1 * Math.cos(a)]; st.u2 = [V.v2 * Math.sin(a), V.v2 * Math.cos(a)];
    st.Fx = m * (st.u2[0] - st.u1[0]) / V.dt; st.Fy = m * (st.u2[1] - st.u1[1]) / V.dt + W; st.Fm = Math.hypot(st.Fx, st.Fy);
    setStats('x4c-5-stats', [['F_x (along the floor)', fmt(st.Fx, 4) + ' lb'], ['F_y (normal)', fmt(st.Fy, 5) + ' lb'], ['|F_{avg}|', fmt(st.Fm, 5) + ' lb', true], ['|F_{avg}|/W', fmt(st.Fm / W, 4), true]]);
  },
  // display timeline: 0–0.6 s flight in, 0.6–1.4 s impact in slow motion, 1.4–2.0 s flight out
  step(st){ hold(st, 2.0, 0.8); },
  draw(st){
    const cv = $('x4c-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 300]);
    const V = st.V, t = Math.min(st.hold ?? st.t, 2.0), R = 0.39, S = 52, gx = 190, gy = 268;   // ball radius (ft), px per ft
    const fly = 0.6, imp = 0.8;
    let p, u, sq = 0, F = false, ph;
    if (t < fly){ const q = fly - t; p = [-st.u1[0] * q * 0.25, R - st.u1[1] * q * 0.25]; u = st.u1; ph = 'before impact'; }
    else if (t < fly + imp){ const s = (t - fly) / imp; sq = Math.sin(Math.PI * s); p = [0, R * (1 - 0.28 * sq)]; u = [st.u1[0] + (st.u2[0] - st.u1[0]) * s, st.u1[1] + (st.u2[1] - st.u1[1]) * s]; F = true; ph = `impact (slow motion: Δt = ${fmt(V.dt, 3)} s)`; }
    else { const q = t - fly - imp; p = [st.u2[0] * q * 0.25, R + st.u2[1] * q * 0.25]; u = st.u2; ph = 'after impact'; }
    st.p = p; st.u = u; st.sq = sq; st.impact = F; st.tnow = t;
    const X = x => gx + x * S, Y = y => gy - y * S;
    line(ctx, -300, gy, 380, gy, COL.fg, 2); hatch(ctx, -300, gy, 380, gy, 1, 9, 7);
    // lines of travel (dashed) and the angle θ between them at the contact point
    const L1 = 4.2, a = V.th / 2 * RAD;
    line(ctx, X(0), Y(R), X(-L1 * Math.sin(a)), Y(R + L1 * Math.cos(a)), COL.muted, 1.2, [5, 4]);
    line(ctx, X(0), Y(R), X(L1 * Math.sin(a)), Y(R + L1 * Math.cos(a)), COL.muted, 1.2, [5, 4]);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(0), Y(R), 120, -Math.PI / 2 - a, -Math.PI / 2 + a); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', X(0), Y(R) - 140, { color: COL.muted });
    // ball (squashed during the impact)
    ctx.save(); ctx.translate(X(p[0]), Y(p[1])); ctx.scale(1 + 0.25 * sq, 1 - 0.28 * sq);
    const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, R * S); g.addColorStop(0, '#f2a25a'); g.addColorStop(1, '#c0571c'); ctx.fillStyle = g; ctx.strokeStyle = '#5a2a0c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-R * S, 0); ctx.lineTo(R * S, 0); ctx.moveTo(0, -R * S); ctx.lineTo(0, R * S); ctx.stroke(); ctx.restore();
    // velocity arrow
    const sp = Math.hypot(u[0], u[1]); if (sp > 0.3){ const k = 3.2; arrow(ctx, X(p[0]), Y(p[1]), X(p[0]) + u[0] * k, Y(p[1]) - u[1] * k, COL.c3, 2.6); txt(ctx, 'v', X(p[0]) + u[0] * k + 10, Y(p[1]) - u[1] * k, { color: COL.c3 }); }
    // average floor force during the impact
    if (F){ const k = 0.3, ex = X(0) + st.Fx * k, ey = gy - 2 - st.Fy * k; arrow(ctx, X(0), gy - 2, ex, ey, RED, 3); txt(ctx, 'F_{avg}', ex + 30, ey + 4, { color: RED }); }
    txt(ctx, ph, 200, 18, { font: '13px system-ui', color: COL.muted });
    // impulse–momentum diagram: m v_1 + (F − W)Δt = m v_2
    const ix = 470, iy = 175, k2 = 2.6;
    txt(ctx, 'impulse–momentum diagram', ix, 30, { font: '600 12px system-ui', fixed: true });
    const p1 = [st.u1[0] * k2, st.u1[1] * k2], p2 = [st.u2[0] * k2, st.u2[1] * k2];
    const O = [ix - p1[0] / 2 - 10, iy - 40];                         // tail of m v_1
    const T1 = [O[0] + p1[0], O[1] - p1[1]];
    arrow(ctx, O[0], O[1], T1[0], T1[1], COL.c3, 2.6); txt(ctx, 'm v_1', (O[0] + T1[0]) / 2 - 26, (O[1] + T1[1]) / 2, { color: COL.c3 });
    const T2 = [O[0] + p2[0], O[1] - p2[1]];
    arrow(ctx, O[0], O[1], T2[0], T2[1], COL.c2, 2.6); txt(ctx, 'm v_2', (O[0] + T2[0]) / 2 + 26, (O[1] + T2[1]) / 2, { color: COL.c2 });
    arrow(ctx, T1[0], T1[1], T2[0], T2[1], RED, 2.6); txt(ctx, '(F − W)Δt', (T1[0] + T2[0]) / 2 + 44, (T1[1] + T2[1]) / 2, { color: RED, font: 'italic 13px Georgia, serif' });
    // force–time history during the impact: average (rectangle) and a smooth pulse with the same impulse
    const pr = [], ps = [], tau = V.dt; for (let i = 0; i <= 100; i++){ const q = tau * i / 100; pr.push([q * 1000, st.Fy]); ps.push([q * 1000, st.Fy * Math.PI / 2 * Math.sin(Math.PI * q / tau)]); }
    const tcur = F ? (t - fly) / imp * tau : (t < fly ? 0 : tau);
    plot($('x4c-5-plot'), { xmin: 0, xmax: tau * 1000, ymin: 0, ymax: st.Fy * 1.75 + 1, xlabel: 'time during the impact (ms)', ylabel: 'normal force (lb)',
      series: [{ pts: pr, color: RED, width: 2.4 }, { pts: ps, color: COL.c1, width: 2, dash: [6, 4] }], points: [{ x: tcur * 1000, y: F ? st.Fy * Math.PI / 2 * Math.sin(Math.PI * tcur / tau) : 0, color: COL.c1, r: 5 }] });
  }
});

/* ---------- 4.C.6: particle slides down a smooth rod and sticks to a block on a spring ---------- */
const C6PTS = [[0, 1], [0.04, 0.82], [0.12, 0.45], [0.24, 0.26], [0.36, 0.34], [0.48, 0.56], [0.58, 0.52], [0.68, 0.24], [0.78, 0.04], [0.88, 0], [1, 0]];
makeClip({
  id: 'x4c-6', speed: 0.5,
  controls: [
    { key: 'h', label: 'Drop height h', min: 4, max: 15, step: 0.5, value: 10, unit: 'ft', dec: 1 },
    { key: 'k', label: 'Spring stiffness k', min: 20, max: 300, step: 5, value: 100, unit: 'lb/ft', dec: 1 },
    { key: 'WA', label: 'Weight of block A, W_A', min: 1, max: 30, step: 0.5, value: 5, unit: 'lb', dec: 1 }
  ],
  reset(st){
    const V = st.V, WP = 10, mP = WP / GFT, mA = V.WA / GFT, XL = 11;              // rod spans 11 ft horizontally
    // rod centreline: Catmull–Rom spline through the control points, sampled with arc length
    const P = C6PTS.map(([u, y]) => [u * XL, y * V.h]), pts = [];
    for (let i = 0; i < P.length - 1; i++){ const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < 40; k++){ const s = k / 40, s2 = s * s, s3 = s2 * s;
        pts.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3))); } }
    pts.push(P[P.length - 1]); const sArr = [0]; for (let i = 1; i < pts.length; i++) sArr.push(sArr[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    st.rod = pts; st.sArr = sArr; st.Ltot = sArr[sArr.length - 1];
    const at = s => { s = clamp(s, 0, st.Ltot); let i = 1; while (i < sArr.length - 1 && sArr[i] < s) i++; const f = (s - sArr[i - 1]) / (sArr[i] - sArr[i - 1] || 1);
      const a = pts[i - 1], b = pts[i]; return { x: a[0] + f * (b[0] - a[0]), y: a[1] + f * (b[1] - a[1]), tx: (b[0] - a[0]) / (sArr[i] - sArr[i - 1] || 1), ty: (b[1] - a[1]) / (sArr[i] - sArr[i - 1] || 1) }; };
    st.at = at;
    // slide: s'' = −g dy/ds (smooth rod), integrated once and stored
    const tr = []; let s = [0.001, 0], tt = 0; const hh = 0.002;
    while (s[0] < st.Ltot && tt < 20){ tr.push([tt, s[0], s[1]]); s = rk(q => [q[1], -GFT * at(q[0]).ty], s, hh); tt += hh; }
    st.tr = tr; st.tSlide = tt;
    st.vP = Math.sqrt(2 * GFT * V.h); st.v2 = mP * st.vP / (mP + mA); st.w = Math.sqrt(V.k / (mP + mA)); st.dmax = st.v2 / st.w;
    st.tEnd = st.tSlide + Math.PI / st.w; st.XL = XL; st.hold = undefined;
    // P has radius rP: at the end of the rod it touches A's left face, and after sticking it rides on that face.
    // The spring is always longer than the largest deflection, so A never reaches the wall.
    st.rP = 0.3; st.xA0 = XL + st.rP; st.Ls = Math.max(3.2, 1.3 * st.dmax + 0.4); st.xw = st.xA0 + 0.6 + st.Ls;
    setStats('x4c-6-stats', [['speed of P at A, √(2gh)', fmt(st.vP, 4) + ' ft/s'], ['speed after sticking, v_2', fmt(st.v2, 4) + ' ft/s'], ['maximum deflection δ_{max}', fmt(st.dmax, 4) + ' ft', true]]);
  },
  step(st){ hold(st, st.tEnd, 1.0); },
  draw(st){
    const cv = $('x4c-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, S = 280 / Math.max(st.XL, 1) * 1.2, ox = 40, gy = 250 + 0, Hs = V.h;
    const sc = Math.min(30, 230 / (Hs + 1.2)), X = x => ox + x * 30, Y = y => gy - y * sc;
    fitView(ctx, w, h, [0, 0, 560, 290]);
    const t = Math.min(st.hold ?? st.t, st.tEnd), xA0 = st.xA0, xw = st.xw, rp = st.rP * 30, yf = gy + rp;   // A's left face starts where P touches it at the rod end; yf: floor
    let xP, yP, vP, d = 0, ph;
    if (t < st.tSlide){ const i = Math.min(st.tr.length - 1, Math.floor(t / 0.002)), q = st.tr[i], a = st.at(q[1]); xP = a.x; yP = a.y; vP = q[2]; ph = 'P slides down the smooth rod'; }
    else { const tt = t - st.tSlide; d = st.dmax * Math.sin(st.w * tt); xP = xA0 + d - st.rP; yP = 0; vP = st.v2 * Math.cos(st.w * tt); ph = vP >= 0 ? 'P and A move together and compress the spring' : 'the spring pushes P and A back'; }
    st.xP = xP; st.yP = yP; st.vPnow = vP; st.d = d; st.tnow = t; st.stuck = t >= st.tSlide;
    // ceiling bracket at the top of the rod, a post under the low part, floor under A
    const top = st.rod[0];
    line(ctx, X(top[0]) - 26, Y(Hs) - 22, X(top[0]) + 26, Y(Hs) - 22, COL.fg, 2); hatch(ctx, X(top[0]) + 26, Y(Hs) - 22, X(top[0]) - 26, Y(Hs) - 22, 1, 7, 6);
    line(ctx, X(top[0]), Y(Hs) - 22, X(top[0]), Y(Hs), COL.fg, 3);
    const pp = st.at(st.Ltot * 0.3); line(ctx, X(pp.x), Y(pp.y), X(pp.x), yf, '#9aa0a8', 4);
    line(ctx, -300, yf, X(xw), yf, COL.fg, 2); hatch(ctx, -300, yf, X(xw), yf, 1, 9, 7);
    ctx.save(); ctx.strokeStyle = '#3a3d44'; ctx.lineWidth = 3.5; ctx.beginPath(); st.rod.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.stroke(); ctx.restore();
    // wall and spring on the right
    const ax = X(xA0 + d);
    line(ctx, X(xw), yf, X(xw), yf - 58, COL.fg, 2.5); hatch(ctx, X(xw), yf - 58, X(xw), yf, -1, 8, 6);
    springLine(ctx, ax + 18, yf - 16, X(xw), yf - 16, 9, 7); txt(ctx, 'k', (ax + 18 + X(xw)) / 2, yf - 38);
    block(ctx, ax + 9, yf - 16, 18, 32, 0, '', '#cfd8ea'); txt(ctx, 'A', ax + 9, yf + 16);
    // particle P
    ctx.save(); const g = ctx.createRadialGradient(X(xP) - 3, Y(yP) - 3, 1, X(xP), Y(yP), rp); g.addColorStop(0, '#fff'); g.addColorStop(1, '#8a8478');
    ctx.fillStyle = g; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(xP), Y(yP), rp, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', X(xP), Y(yP) - 20);
    // drop height dimension
    const dx = X(st.XL * 0.82); line(ctx, X(top[0]) + 10, Y(Hs), dx + 10, Y(Hs), COL.muted, 1, [5, 4]);
    line(ctx, dx, Y(Hs), dx, Y(0), COL.muted, 1.2); txt(ctx, `h = ${fmt(Hs, 3)} ft`, dx + 40, Y(Hs / 2), { font: '13px system-ui', color: COL.muted });
    if (Math.abs(vP) > 0.3){ const L = 10 + Math.abs(vP) * 1.6, a = st.stuck ? { tx: 1, ty: 0 } : st.at(st.tr[Math.min(st.tr.length - 1, Math.floor(t / 0.002))][1]), sg = Math.sign(vP);
      const x0 = X(xP), y0 = Y(yP) - 16; arrow(ctx, x0, y0, x0 + sg * a.tx * L, y0 - sg * a.ty * L, COL.c3, 2.4); }
    txt(ctx, ph, 280, 16, { font: '13px system-ui', color: COL.muted });
    txt(ctx, `|v_P| = ${fmt(Math.abs(vP), 3)} ft/s`, 545, 40, { font: '12px system-ui', color: COL.c3, align: 'right' });
    // plots: speed of P and spring deflection
    const pv = [], pd = []; for (let i = 0; i <= 240; i++){ const q = st.tEnd * i / 240; let v, dd = 0;
      if (q < st.tSlide){ v = st.tr[Math.min(st.tr.length - 1, Math.floor(q / 0.002))][2]; } else { const tt = q - st.tSlide; v = st.v2 * Math.cos(st.w * tt); dd = st.dmax * Math.sin(st.w * tt); }
      pv.push([q, v]); pd.push([q, dd]); }
    plot($('x4c-6-plot'), { xmin: 0, xmax: st.tEnd, ymin: -st.v2 * 1.2, ymax: st.vP * 1.15, xlabel: 'time t (s)', ylabel: 'velocity of P (ft/s)',
      series: [{ pts: pv, color: COL.c3, width: 2.4 }], vlines: [{ x: st.tSlide, label: 'impact' }], points: [{ x: t, y: vP, color: COL.c3, r: 5 }] });
    plot($('x4c-6-plot2'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: st.dmax * 1.2, xlabel: 'time t (s)', ylabel: 'spring deflection (ft)',
      series: [{ pts: pd, color: COL.c2, width: 2.4 }], hlines: [{ y: st.dmax }], points: [{ x: t, y: d, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 4.C.7: two cars collide at an intersection and stick together ---------- */
makeClip({
  id: 'x4c-7', speed: 0.5,
  controls: [
    { key: 'WA', label: 'Weight of car A, W_A', min: 1000, max: 8000, step: 100, value: 3000, unit: 'lb', dec: 1 },
    { key: 'WB', label: 'Weight of car B, W_B', min: 1000, max: 8000, step: 100, value: 4000, unit: 'lb', dec: 1 },
    { key: 'vA', label: 'Speed of A (north), v_{A1}', min: 5, max: 70, step: 1, value: 40, unit: 'mph', dec: 1 },
    { key: 'vB', label: 'Speed of B (west), v_{B1}', min: 5, max: 70, step: 1, value: 25, unit: 'mph', dec: 1 }
  ],
  reset(st){
    const V = st.V, W = V.WA + V.WB; st.vx = -V.WB * V.vB / W; st.vy = V.WA * V.vA / W; st.sp = Math.hypot(st.vx, st.vy);
    st.dir = Math.atan2(st.vy, -st.vx) / RAD; const T1 = V.WA * V.vA ** 2 + V.WB * V.vB ** 2, T2 = W * st.sp ** 2; st.loss = 1 - T2 / T1; st.hold = undefined;
    setStats('x4c-7-stats', [['v_x', `${fmt(st.vx, 4)} mph = ${fmt(st.vx * 22 / 15, 4)} ft/s`, true], ['v_y', `${fmt(st.vy, 4)} mph = ${fmt(st.vy * 22 / 15, 4)} ft/s`, true],
      ['speed after', `${fmt(st.sp, 4)} mph, ${fmt(st.dir, 3)}° north of west`], ['kinetic energy lost', fmt(100 * st.loss, 3) + ' %']]);
  },
  step(st){ hold(st, 2.6, 1.0); },
  draw(st){
    const cv = $('x4c-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 600, 340]);
    const V = st.V, t = Math.min(st.hold ?? st.t, 2.6), tc = 1.1, k = 22 / 15, S = 2.6, cx = 170, cy = 180;   // ft/s per mph, px per ft
    const LA = 15, WD = 6;                                         // car length and width (ft)
    let A, B; const after = t >= tc;
    if (!after){ A = [0, -(WD / 2 + LA / 2) - V.vA * k * (tc - t)]; B = [V.vB * k * (tc - t), 0]; }
    else { const q = t - tc; A = [st.vx * k * q, -(WD / 2 + LA / 2) + st.vy * k * q]; B = [st.vx * k * q, st.vy * k * q]; }
    st.A = A; st.B = B; st.after = after; st.tnow = t; st.flash = after && t - tc < 0.1;
    const X = x => cx + x * S, Y = y => cy - y * S;
    // roads
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.fillRect(X(-12), 10, 24 * S, 320); ctx.fillRect(0, Y(12), 340, 24 * S); ctx.restore();
    line(ctx, X(0), 10, X(0), 330, '#c8b98a', 1.2, [8, 8]); line(ctx, 0, Y(0), 340, Y(0), '#c8b98a', 1.2, [8, 8]);
    line(ctx, X(0), 20, X(0), 70, COL.muted, 1); txt(ctx, 'y (north)', X(0) + 32, 24, { font: '12px system-ui', color: COL.muted });
    txt(ctx, 'x (east)', 320, Y(0) - 12, { font: '12px system-ui', color: COL.muted, align: 'right' });
    const car = (c, vert, lab, col) => { ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
      const wpx = (vert ? WD : LA) * S, hpx = (vert ? LA : WD) * S; ctx.beginPath(); ctx.roundRect(X(c[0]) - wpx / 2, Y(c[1]) - hpx / 2, wpx, hpx, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, lab, X(c[0]) + (vert ? -26 - wpx / 2 : 0), Y(c[1]) + (vert ? 0 : -hpx / 2 - 26)); };
    car(A, true, 'A', '#e9d9a8'); car(B, false, 'B', '#cfd8ea');
    if (st.flash){ ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 2; const px = X(0), py = Y(-WD / 2); for (let j = 0; j < 8; j++){ const a = j * Math.PI / 4; ctx.beginPath(); ctx.moveTo(px + 6 * Math.cos(a), py + 6 * Math.sin(a)); ctx.lineTo(px + 16 * Math.cos(a), py + 16 * Math.sin(a)); ctx.stroke(); } ctx.restore(); }
    const vs = 1.3;
    if (!after){ arrow(ctx, X(A[0]) + 22, Y(A[1]), X(A[0]) + 22, Y(A[1]) - V.vA * vs, COL.c3, 2.6); txt(ctx, 'v_{A1}', X(A[0]) + 44, Y(A[1]) - V.vA * vs / 2, { color: COL.c3 });
      arrow(ctx, X(B[0]), Y(B[1]) + 20, X(B[0]) - V.vB * vs, Y(B[1]) + 20, COL.c2, 2.6); txt(ctx, 'v_{B1}', X(B[0]) + 8, Y(B[1]) + 20, { color: COL.c2, align: 'left' }); }
    else { const c = [(A[0] * V.WA + B[0] * V.WB) / (V.WA + V.WB), (A[1] * V.WA + B[1] * V.WB) / (V.WA + V.WB)];
      arrow(ctx, X(c[0]), Y(c[1]), X(c[0]) + st.vx * vs, Y(c[1]) - st.vy * vs, RED, 2.8); txt(ctx, 'v_2', X(c[0]) + st.vx * vs - 14, Y(c[1]) - st.vy * vs - 8, { color: RED }); }
    // momentum diagram (weights stand in for masses, since g cancels)
    const ox = 520, oy = 230, km = 0.0011;
    txt(ctx, 'momentum diagram', 470, 26, { font: '600 12px system-ui', fixed: true });
    const pA = V.WA * V.vA * km, pB = V.WB * V.vB * km;
    arrow(ctx, ox, oy, ox, oy - pA, COL.c3, 2.6); txt(ctx, 'm_A v_{A1}', ox + 36, oy - pA / 2, { color: COL.c3 });
    arrow(ctx, ox, oy - pA, ox - pB, oy - pA, COL.c2, 2.6); txt(ctx, 'm_B v_{B1}', ox - pB / 2, oy - pA - 14, { color: COL.c2 });
    arrow(ctx, ox, oy, ox - pB, oy - pA, RED, 2.6); txt(ctx, '(m_A + m_B) v_2', ox - pB / 2 - 40, oy - pA / 2 + 22, { color: RED });
    txt(ctx, `t = ${fmt(t - tc, 3)} s after first contact`, 590, 326, { font: '12px system-ui', color: COL.muted, align: 'right', fixed: true });
  }
});

subLabels();
})();
