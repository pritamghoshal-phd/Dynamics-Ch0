/* =========================================================
   Chapter 1, Section D examples: relative motion and constrained (cable) motion, 1.D.1 to 1.D.6
   Clip ids x1d-1 ... x1d-6. Loaded after common.js, clip.js and kit.js.
   ========================================================= */
(function(){

const F_SANS = '12px system-ui', F_BOLD = '600 13px system-ui', F_IT = 'italic 15px Georgia, serif', F_ITS = 'italic 13px Georgia, serif';
// arrow from (x, y) along (dx, dy) with a label just beyond the tip
function vec(ctx, x, y, dx, dy, col, label, wd = 2.6, off = 14){
  const L = Math.hypot(dx, dy); if (L < 2) return;
  arrow(ctx, x, y, x + dx, y + dy, col, wd);
  if (label) txt(ctx, label, x + dx + dx / L * off, y + dy + dy / L * off, { color: col, font: F_IT });
}
// small car seen from above, heading = screen angle of travel
function car(ctx, x, y, head, col, label, side = -1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(head);
  ctx.fillStyle = col; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
  ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-13, -7, 26, 14, 4); else ctx.rect(-13, -7, 26, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d7e3f2'; ctx.fillRect(2, -5, 6, 10); ctx.fillRect(-9, -5, 4, 10);
  ctx.restore();
  if (label) txt(ctx, label, x + side * 22, y, { font: 'italic 15px Georgia, serif' });
}
// airplane seen from above; head = screen angle the nose points to
function plane(ctx, x, y, head, col, sz = 1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(head); ctx.scale(sz, sz);
  ctx.fillStyle = col; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(14, -3); ctx.lineTo(4, -3); ctx.lineTo(-4, -20); ctx.lineTo(-10, -20); ctx.lineTo(-6, -3);
  ctx.lineTo(-16, -3); ctx.lineTo(-21, -9); ctx.lineTo(-24, -9); ctx.lineTo(-21, 0); ctx.lineTo(-24, 9); ctx.lineTo(-21, 9); ctx.lineTo(-16, 3);
  ctx.lineTo(-6, 3); ctx.lineTo(-10, 20); ctx.lineTo(-4, 20); ctx.lineTo(4, 3); ctx.lineTo(14, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function dashedPath(ctx, pts, col, wd = 1.6){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.setLineDash([5, 4]);
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
}
function panelFrame(ctx, x, y, w, h, title){
  ctx.save(); ctx.strokeStyle = COL.grid || '#e6e2d6'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); ctx.restore();
  txt(ctx, title, x + 10, y + 16, { font: F_BOLD, align: 'left' });
}
// rotating mark on a pulley (angle in radians, clockwise positive on screen)
function pulleyMark(ctx, x, y, r, ang){
  pulley(ctx, x, y, r);
  ctx.save(); ctx.strokeStyle = COL.c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r - 2) * Math.cos(ang - Math.PI / 2), y + (r - 2) * Math.sin(ang - Math.PI / 2)); ctx.stroke(); ctx.restore();
}
function ceilingBar(ctx, x1, x2, y){ line(ctx, x1, y, x2, y, COL.fg, 2); hatch(ctx, x2, y, x1, y, 1, 8, 6); }
function floorBar(ctx, x1, x2, y){ line(ctx, x1, y, x2, y, COL.fg, 2); hatch(ctx, x1, y, x2, y, 1, 8, 6); }
// hold the motion for a moment at the instant of the problem, then continue
function holdAt(st, dt, key, target, dur = 1.4){
  if (st.hold > 0){ st.hold -= dt; return true; }
  return false;
}

/* ---------- 1.D.1: what a passenger in car A sees car B doing ---------- */
makeClip({
  id: 'x1d-1', speed: 1,
  controls: [
    { key: 'vA', label: 'Speed of car A, v_A', min: 40, max: 120, step: 5, value: 80, unit: 'km/h', dec: 0 },
    { key: 'vB', label: 'Speed of car B, v_B', min: 20, max: 100, step: 5, value: 50, unit: 'km/h', dec: 0 },
    { key: 'R', label: 'Radius of B’s curve, ρ', min: 300, max: 1000, step: 50, value: 500, unit: 'm', dec: 0 }
  ],
  reset(st){
    const V = st.V, R = V.R / 1000;
    st.T = Math.min(40, 0.85 / Math.max(V.vA, V.vB) * 3600, 1.15 * R / V.vB * 3600); // half-window in seconds
    st.rate = 2 * st.T / 8; st.tau = -st.T; st.hold = 0; st.did = false;
    const an = V.vB * V.vB / R, aBA = [-an, 10 + 10];
    setStats('x1d-1-stats', [['a_B (normal part) = v_B²/ρ', fmt(an, 4) + ' km/h² = ' + fmt(an * 1000 / 3600 / 3600, 3) + ' m/s²'],
      ['a_{B/A} at the instant shown', `(${fmt(aBA[0], 4)} î + ${fmt(aBA[1], 3)} ĵ) km/h²`, true], ['|a_{B/A}|', fmt(Math.hypot(...aBA) * 1000 / 3600 / 3600, 4) + ' m/s²', true]]);
  },
  step(st, dt){
    if (st.hold > 0){ st.hold -= dt; return; }
    st.tau += dt * st.rate;
    if (!st.did && st.tau >= 0){ st.tau = 0; st.hold = 1.5; st.did = true; }
    if (st.tau > st.T){ st.tau = -st.T; st.did = false; }
  },
  draw(st){
    const cv = $('x1d-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 400, 760); fitView(ctx, w, h, nr ? [0, 0, 360, 800] : [0, 0, 720, 400]);
    const V = st.V, R = V.R / 1000, lane = 0.12, S = 200, S2 = 320, dA = 10, dB = -10;
    const pos = tau => { const t = tau / 3600, sA = V.vA * t + 0.5 * dA * t * t, sB = V.vB * t + 0.5 * dB * t * t, ph = sB / R;
      return { A: [lane, -sA], B: [-R + R * Math.cos(ph), -R * Math.sin(ph)], ph, vA: V.vA + dA * t, vB: V.vB + dB * t }; };
    const p = pos(st.tau), t = st.tau / 3600;
    // ---- ground panel: origin (0, 0) km at pixel (250, 200), y up
    const G = (q, ox = 250, oy = 200) => [ox + q[0] * S, oy - q[1] * S];
    panelFrame(ctx, 0, 0, 360, 400, 'Seen from the ground');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 24, 360, 376); ctx.clip();
    // roads: B on a circle of radius ρ centred at (−ρ, 0), A on a straight road
    ctx.save(); ctx.strokeStyle = 'rgba(120,108,80,0.2)'; ctx.lineWidth = 14; ctx.beginPath(); const c = G([-R, 0]); ctx.arc(c[0], c[1], R * S, -1.4, 1.4); ctx.stroke();
    ctx.beginPath(); const a1 = G([lane, 2]), a2 = G([lane, -2]); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); ctx.restore();
    dashedPath(ctx, Array.from({ length: 61 }, (_, i) => { const q = -1.4 + 2.8 * i / 60; return [c[0] + R * S * Math.cos(q), c[1] + R * S * Math.sin(q)]; }), 'rgba(80,70,50,0.22)', 1);
    line(ctx, a1[0], a1[1], a2[0], a2[1], 'rgba(80,70,50,0.22)', 1, [5, 4]);
    // centre of B's curve (if in view) and the radius
    if (c[0] > 8){ pinDot(ctx, c[0], c[1]); txt(ctx, 'centre', c[0] + 4, c[1] + 16, { font: F_SANS, color: COL.muted, align: 'left' }); }
    const pb = G(p.B), pa = G(p.A);
    const tB = [-Math.sin(p.ph), -Math.cos(p.ph)], nB = [-Math.cos(p.ph), Math.sin(p.ph)]; // unit tangent (direction of travel) and inward normal, y up
    car(ctx, pb[0], pb[1], Math.atan2(-tB[1], tB[0]), '#e7d9b0', 'B'); car(ctx, pa[0], pa[1], Math.PI / 2, '#cfe0f5', 'A', 1);
    const kv = 0.55, an = p.vB * p.vB / R, ka = 52 / (V.vB * V.vB / R);
    vec(ctx, pb[0] - 26, pb[1], tB[0] * p.vB * kv, -tB[1] * p.vB * kv, COL.c1, 'v_B');
    vec(ctx, pa[0] + 26, pa[1], 0, p.vA * kv, COL.c1, 'v_A');
    vec(ctx, pb[0], pb[1], (nB[0] * an + tB[0] * dB) * ka, -(nB[1] * an + tB[1] * dB) * ka, COL.c2, 'a_B');
    ctx.restore();
    txt(ctx, `t = ${st.tau >= 0 ? '+' : ''}${fmt(st.tau, 2)} s`, 350, 16, { font: F_SANS, color: COL.muted, align: 'right' });
    if (st.hold > 0) txt(ctx, 'the instant shown in the problem', 180, 388, { font: F_BOLD, color: COL.c2 });
    // ---- relative panel (translating with car A): A fixed at pixel (300, 200) of the panel
    const ox = nr ? 0 : 360, oy = nr ? 400 : 0;
    ctx.save(); ctx.translate(ox, oy);
    panelFrame(ctx, 0, 0, 360, 400, 'Seen by a passenger in car A');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 24, 360, 376); ctx.clip();
    const Q = q => [300 + q[0] * S2, 200 - q[1] * S2];
    const rel = []; for (let i = 0; i <= 80; i++){ const q = pos(-st.T + 2 * st.T * i / 80); rel.push(Q([q.B[0] - q.A[0], q.B[1] - q.A[1]])); }
    dashedPath(ctx, rel, COL.c4, 1.6);
    const rp = Q([p.B[0] - p.A[0], p.B[1] - p.A[1]]);
    car(ctx, 300, 200, Math.PI / 2, '#cfe0f5'); txt(ctx, 'A', 322, 200, { font: F_IT });
    car(ctx, rp[0], rp[1], Math.atan2(-tB[1], tB[0]), '#e7d9b0', 'B', 1);
    const aBA = [nB[0] * an + tB[0] * dB - 0, nB[1] * an + tB[1] * dB + dA];
    vec(ctx, rp[0], rp[1], aBA[0] * ka, -aBA[1] * ka, COL.c4, 'a_{B/A}');
    ctx.restore();
    txt(ctx, 'dashed: path of B relative to A', 350, 388, { font: F_SANS, color: COL.c4, align: 'right' });
    ctx.restore();
  }
});

/* ---------- 1.D.2: jet A seen from the ground and from jet B ---------- */
makeClip({
  id: 'x1d-2', speed: 1,
  controls: [
    { key: 'vB', label: 'Speed of jet B (north), v_B', min: 200, max: 1000, step: 10, value: 600, unit: 'km/h', dec: 0 },
    { key: 'al', label: 'Angle of v_A north of east, θ', min: 10, max: 80, step: 1, value: 30, unit: '°', dec: 0 }
  ],
  reset(st){
    const V = st.V, A = V.al * RAD, vA = V.vB / Math.sin(A);
    setStats('x1d-2-stats', [['v_A = v_B / sin θ', fmt(vA, 4) + ' km/h', true], ['v_{A/B} = v_A cos θ', fmt(vA * Math.cos(A), 4) + ' km/h (due east)', true], ['north part of v_A', fmt(vA * Math.sin(A), 4) + ' km/h = v_B']]);
  },
  step(st){ if (st.t > 4.6) st.t = 0; },
  draw(st){
    const cv = $('x1d-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 400, 760); fitView(ctx, w, h, nr ? [0, 0, 360, 800] : [0, 0, 720, 400]);
    const V = st.V, A = V.al * RAD, vA = V.vB / Math.sin(A), vAB = vA * Math.cos(A), U = 4, u = Math.min(st.t, U);
    const k = 200 / (vA * U);                    // px per (km/h · s) so that A always travels 200 px
    const grid = (ox, oy, sx, sy) => { ctx.save(); ctx.strokeStyle = 'rgba(150,135,100,0.2)'; ctx.lineWidth = 1;
      for (let x = ((ox % 40) + 40) % 40; x < 360; x += 40){ ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x, 400); ctx.stroke(); }
      for (let y = 24 + ((oy % 40) + 40) % 40; y < 400; y += 40){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(360, y); ctx.stroke(); } ctx.restore(); };
    // ---- ground panel
    panelFrame(ctx, 0, 0, 360, 400, 'Seen from the ground');
    grid(0, 0);
    const A0 = [90, 300], B0 = [50, 350];
    const pA = [A0[0] + vA * Math.cos(A) * k * u, A0[1] - vA * Math.sin(A) * k * u], pB = [B0[0], B0[1] - V.vB * k * u];
    dashedPath(ctx, [A0, pA], COL.c1, 1.4); dashedPath(ctx, [B0, pB], COL.c3, 1.4);
    plane(ctx, pA[0], pA[1], -A, '#cfe0f5'); plane(ctx, pB[0], pB[1], -Math.PI / 2, '#e7d9b0');
    txt(ctx, 'A', pA[0] - 30, pA[1] + 14, { font: F_IT }); txt(ctx, 'B', pB[0] + 26, pB[1] + 14, { font: F_IT });
    const kv = 50 / vA;
    vec(ctx, pA[0] + 24 * Math.cos(A), pA[1] - 24 * Math.sin(A), vA * kv * Math.cos(A), -vA * kv * Math.sin(A), COL.c1, 'v_A');
    vec(ctx, pB[0], pB[1] - 26, 0, -V.vB * kv, COL.c3, 'v_B');
    // velocity triangle v_A = v_B + v_A/B
    const T0 = [236, 380], s3 = 100 / vA, tB = [T0[0], T0[1] - V.vB * s3], tA = [T0[0] + vAB * s3, tB[1]];
    vec(ctx, T0[0], T0[1], 0, tB[1] - T0[1], COL.c3, '', 2.2); vec(ctx, tB[0], tB[1], tA[0] - tB[0], 0, COL.c4, '', 2.2); vec(ctx, T0[0], T0[1], tA[0] - T0[0], tA[1] - T0[1], COL.c1, '', 2.2);
    txt(ctx, 'v_B', T0[0] - 16, (T0[1] + tB[1]) / 2, { font: F_ITS, color: COL.c3 }); txt(ctx, 'v_{A/B}', (tB[0] + tA[0]) / 2, tB[1] - 12, { font: F_ITS, color: COL.c4 });
    txt(ctx, 'v_A', (T0[0] + tA[0]) / 2 + 16, (T0[1] + tA[1]) / 2 + 8, { font: F_ITS, color: COL.c1 });
    txt(ctx, 'N ↑', 346, 16, { font: F_BOLD, color: COL.muted, align: 'right' });
    // ---- view from B: B fixed, the ground moves south at v_B
    const ox = nr ? 0 : 360, oy = nr ? 400 : 0;
    ctx.save(); ctx.translate(ox, oy);
    panelFrame(ctx, 0, 0, 360, 400, 'Seen by the passengers on jet B');
    grid(0, V.vB * k * u);
    const B1 = [40, 330], R0 = [A0[0] - B0[0], A0[1] - B0[1]], pR = [B1[0] + R0[0] + vAB * k * u, B1[1] + R0[1]];
    dashedPath(ctx, [[B1[0] + R0[0], B1[1] + R0[1]], pR], COL.c4, 1.4);
    plane(ctx, B1[0], B1[1], -Math.PI / 2, '#e7d9b0'); txt(ctx, 'B', B1[0] + 26, B1[1] + 14, { font: F_IT });
    plane(ctx, pR[0], pR[1], -A, '#cfe0f5'); txt(ctx, 'A', pR[0] - 30, pR[1] + 14, { font: F_IT });
    vec(ctx, pR[0] - 60, pR[1] + 30, 55, 0, COL.c4, 'v_{A/B}');
    txt(ctx, 'A drifts due east, nose pointing θ north of east', 350, 388, { font: F_SANS, color: COL.muted, align: 'right' });
    ctx.restore();
  }
});

/* ---------- 1.D.3: block A pulled by a cable wound between A, B and a post ---------- */
makeClip({
  id: 'x1d-3', speed: 0.25,
  controls: [
    { key: 'v0', label: 'Velocity of B at the instant shown, v_B', min: 0, max: 4, step: 0.1, value: 2, unit: 'm/s', dec: 2 },
    { key: 'aB', label: 'Acceleration of B, a_B', min: 0, max: 6, step: 0.1, value: 3, unit: 'm/s²', dec: 2 }
  ],
  reset(st){
    const V = st.V;                                              // B may move 1.55 m (0.8 m on narrow screens) before A's pulleys reach the post
    const tFor = D => { let t = V.aB > 1e-6 ? (-V.v0 + Math.sqrt(V.v0 * V.v0 + 2 * V.aB * D)) / V.aB : D / Math.max(V.v0, 1e-6); return (!isFinite(t) || t > 6) ? 6 : t; };
    st.tW = tFor(1.55); st.tN = tFor(0.8); st.tEnd = st.nr ? st.tN : st.tW; st.hold = 0;
    setStats('x1d-3-stats', [['v_A = ¾ v_B', fmt(0.75 * V.v0, 4) + ' m/s (right)', true], ['a_A = ¾ a_B', fmt(0.75 * V.aB, 4) + ' m/s² (right)', true]]);
  },
  step(st, dt){ if (st.t > st.tEnd){ st.hold += dt; if (st.hold > 0.3){ st.t = 0; st.hold = 0; } } },
  draw(st){
    const cv = $('x1d-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    st.nr = nar(cv, w, 250, 250); st.tEnd = st.nr ? st.tN : st.tW; fitView(ctx, w, h, st.nr ? [0, 70, 590, 272] : [0, 70, 720, 272]);
    const V = st.V, t = Math.min(st.t, st.tEnd), dxB = V.v0 * t + 0.5 * V.aB * t * t, dxA = 0.75 * dxB, vB = V.v0 + V.aB * t, vA = 0.75 * vB;
    const S = 120, X = x => 110 + x * S, Y = y => 260 - y * S, r = 0.12, hU = 0.70, hB = 0.46, hL = 0.22;
    const xa = 0.25 + dxA, xBf = 2.3 + dxB, xbp = xBf - 0.2, post = 1.6;
    floorBar(ctx, 0, 720, 260);
    // post fixed to the floor
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.fillRect(X(post), Y(0.18), 10, 0.18 * S); ctx.strokeRect(X(post), Y(0.18), 10, 0.18 * S); ctx.restore();
    // blocks
    block(ctx, X(-0.35 + dxA), Y(0.5), 0.9 * S, 1.0 * S, 0, 'A');
    block(ctx, X(xBf + 0.4), Y(0.5), 0.8 * S, 1.0 * S, 0, 'B');
    // pulley arms
    line(ctx, X(0.1 + dxA), Y(hU), X(xa), Y(hU), COL.spring, 2); line(ctx, X(0.1 + dxA), Y(hL), X(xa), Y(hL), COL.spring, 2); line(ctx, X(xbp), Y(hB), X(xBf), Y(hB), COL.spring, 2);
    // the cable: B's face → around A's upper pulley → around B's pulley → around A's lower pulley → post
    cable(ctx, () => {
      ctx.moveTo(X(xBf), Y(hU + r)); ctx.lineTo(X(xa), Y(hU + r)); ctx.arc(X(xa), Y(hU), r * S, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(X(xbp), Y(hB + r)); ctx.arc(X(xbp), Y(hB), r * S, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineTo(X(xa), Y(hL + r)); ctx.arc(X(xa), Y(hL), r * S, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(X(post), Y(hL - r));
    });
    // pulley rotations from the speed of the cable relative to each pulley (clockwise +)
    pulleyMark(ctx, X(xa), Y(hU), r * S, (dxB - dxA) / r); pulleyMark(ctx, X(xbp), Y(hB), r * S, (2 * dxA - 2 * dxB) / r); pulleyMark(ctx, X(xa), Y(hL), r * S, (3 * dxB - 3 * dxA) / r);
    // strand numbers
    [[hU + r, '1'], [hB + r, '2'], [hL + r, '3']].forEach(([y, n]) => txt(ctx, n, X((xa + xbp) / 2 + 0.3), Y(y) - 10, { font: '600 11px system-ui', color: COL.muted }));
    txt(ctx, '4', X((xa + post) / 2), Y(hL - r) - 10, { font: '600 11px system-ui', color: COL.muted });
    vec(ctx, X(-0.35 + dxA) - 30, Y(1.15), vA * 30, 0, COL.c1, 'v_A'); vec(ctx, X(xBf + 0.4) - 30, Y(1.15), vB * 30, 0, COL.c1, 'v_B');
    vec(ctx, X(xBf + 0.4) - 30, Y(1.34), V.aB * 18, 0, COL.c2, 'a_B');
    txt(ctx, `t = ${fmt(t, 3)} s`, st.nr ? 580 : 710, 84, { font: F_SANS, color: COL.muted, align: 'right' });
    const pv = [], pa = []; for (let i = 0; i <= 60; i++){ const q = st.tEnd * i / 60; pv.push([q, V.v0 + V.aB * q]); pa.push([q, 0.75 * (V.v0 + V.aB * q)]); }
    const vmax = V.v0 + V.aB * st.tEnd;
    plot($('x1d-3-plot'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: Math.max(1, vmax * 1.12), xlabel: 'time t (s)', ylabel: 'speed (m/s)',
      series: [{ pts: pv, color: COL.c3, width: 2.4, label: 'v_B' }, { pts: pa, color: COL.c1, width: 2.4, label: 'v_A' }],
      points: [{ x: t, y: vB, color: COL.c3, r: 5 }, { x: t, y: vA, color: COL.c1, r: 5 }] });
  }
});

/* ---------- 1.D.4: block on an incline and a block on a movable pulley ---------- */
makeClip({
  id: 'x1d-4', speed: 1,
  controls: [{ key: 'aA', label: 'Acceleration of A up the incline, a_A', min: 0.1, max: 1.5, step: 0.01, value: 0.44, unit: 'm/s²', dec: 2 }],
  reset(st){ st.tEnd = Math.sqrt(2 * 1.0 / st.V.aA); st.hold = 0;
    setStats('x1d-4-stats', [['a_B = a_A / 2', fmt(st.V.aA / 2, 4) + ' m/s² (downward)', true], ['ratio a_B / a_A', '1/2']]); },
  step(st, dt){ if (st.t > st.tEnd){ st.hold += dt; if (st.hold > 1.2){ st.t = 0; st.hold = 0; } } },
  draw(st){
    const cv = $('x1d-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [80, 10, 640, 470]);
    const V = st.V, t = Math.min(st.t, st.tEnd), xA = 0.5 * V.aA * t * t, xB = xA / 2, vA = V.aA * t, S = 150;
    const be = 40 * RAD, d = [Math.cos(be), Math.sin(be)], nUp = [Math.sin(be), -Math.cos(be)];
    const rr = 15, Cf = [245, 90], ceil = 30;                      // fixed pulley hung from the ceiling
    const yb0 = 170, Cb = [215, yb0 + xB * S];                     // movable pulley carrying B (x_B measured down)
    const Tp = [Cf[0] + rr * nUp[0], Cf[1] + rr * nUp[1]];          // where the cable leaves the fixed pulley toward A
    const sA = 330 - xA * S, att = [Tp[0] + d[0] * sA, Tp[1] + d[1] * sA], half = 22;
    const cA = [att[0] + d[0] * half, att[1] + d[1] * half];         // centre of A (cable attaches at the middle of its upper face)
    // incline surface: parallel to the cable, half a block below it
    const s1 = [Tp[0] + d[0] * 150 - nUp[0] * half, Tp[1] + d[1] * 150 - nUp[1] * half], s2 = [Tp[0] + d[0] * 470 - nUp[0] * half, Tp[1] + d[1] * 470 - nUp[1] * half];
    line(ctx, s1[0], s1[1], s2[0], s2[1], COL.fg, 2); hatch(ctx, s1[0], s1[1], s2[0], s2[1], 1, 8, 7);
    ceilingBar(ctx, 160, 300, ceil);
    line(ctx, Cf[0], ceil, Cf[0], Cf[1], COL.spring, 2);
    cable(ctx, () => { ctx.moveTo(Cb[0] - rr, ceil); ctx.lineTo(Cb[0] - rr, Cb[1]); ctx.arc(Cb[0], Cb[1], rr, Math.PI, 0, true); ctx.lineTo(Cf[0] - rr, Cf[1]);
      ctx.arc(Cf[0], Cf[1], rr, Math.PI, Math.atan2(nUp[1], nUp[0]), false); ctx.lineTo(att[0], att[1]); });
    pulleyMark(ctx, Cf[0], Cf[1], rr, xA * S / rr); pulleyMark(ctx, Cb[0], Cb[1], rr, -xB * S / rr);
    line(ctx, Cb[0], Cb[1], Cb[0], Cb[1] + 40, COL.spring, 2); block(ctx, Cb[0], Cb[1] + 64, 50, 46, 0, 'B');
    block(ctx, cA[0], cA[1], 44, 44, be, 'A');
    // coordinates measured from fixed points
    line(ctx, 110, ceil + 4, 140, ceil + 4, COL.muted, 1); arrow(ctx, 125, ceil + 4, 125, ceil + 4 + 110, COL.muted, 1.4); txt(ctx, 'x_B', 108, ceil + 70, { font: F_ITS, color: COL.muted });
    const e0 = [s2[0] + nUp[0] * 70, s2[1] + nUp[1] * 70];
    arrow(ctx, e0[0], e0[1], e0[0] - d[0] * 90, e0[1] - d[1] * 90, COL.muted, 1.4); txt(ctx, 'x_A', e0[0] - d[0] * 50 + nUp[0] * 16, e0[1] - d[1] * 50 + nUp[1] * 16, { font: F_ITS, color: COL.muted });
    line(ctx, e0[0] - nUp[0] * 8, e0[1] - nUp[1] * 8, e0[0] + nUp[0] * 8, e0[1] + nUp[1] * 8, COL.muted, 1);
    if (vA > 0.02){ vec(ctx, cA[0] + nUp[0] * 40, cA[1] + nUp[1] * 40, -d[0] * vA * 70, -d[1] * vA * 70, COL.c1, 'v_A'); vec(ctx, Cb[0] + 50, Cb[1] + 64, 0, vA / 2 * 70, COL.c1, 'v_B'); }
    txt(ctx, `t = ${fmt(t, 3)} s`, 630, 24, { font: F_SANS, color: COL.muted, align: 'right' });
    const pa = [], pb = []; for (let i = 0; i <= 50; i++){ const q = st.tEnd * i / 50; pa.push([q, V.aA * q]); pb.push([q, V.aA * q / 2]); }
    plot($('x1d-4-plot'), { xmin: 0, xmax: st.tEnd, ymin: 0, ymax: V.aA * st.tEnd * 1.12, xlabel: 'time t (s)', ylabel: 'speed (m/s)',
      series: [{ pts: pa, color: COL.c1, width: 2.4, label: 'v_A' }, { pts: pb, color: COL.c3, width: 2.4, label: 'v_B' }],
      points: [{ x: t, y: vA, color: COL.c1, r: 5 }, { x: t, y: vA / 2, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 1.D.5: two cables, two movable pulleys ---------- */
makeClip({
  id: 'x1d-5', speed: 0.25,
  controls: [
    { key: 'vA', label: 'Speed of A to the right, v_A', min: -1, max: 2.5, step: 0.1, value: 2, unit: 'm/s', dec: 2 },
    { key: 'vB', label: 'Speed of B to the left, v_B', min: -1, max: 2.5, step: 0.1, value: 2, unit: 'm/s', dec: 2 }
  ],
  reset(st){ const V = st.V, vC = -V.vA / 2, vm = (vC - V.vB) / 2; st.hold = 0;
    setStats('x1d-5-stats', [['ẋ_C = −ẋ_A / 2', fmt(vC, 4) + ' m/s (down +)'], ['ẋ_m = (ẋ_C − ẋ_B) / 2', fmt(vm, 4) + ' m/s (down +)', true], ['speed of m', fmt(Math.abs(vm), 4) + ' m/s ' + (vm < 0 ? 'upward' : vm > 0 ? 'downward' : ''), true]]); },
  step(st, dt){ if (st.t > (st.tMax || 1)){ st.hold += dt; if (st.hold > 0.3){ st.t = 0; st.hold = 0; } } },
  draw(st){
    const cv = $('x1d-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 480, 480); st.tMax = nr ? 0.6 : 1; fitView(ctx, w, h, nr ? [120, 10, 700, 560] : [0, 10, 800, 560]);
    const V = st.V, t = Math.min(st.t, st.tMax), S = 100, vC = -V.vA / 2, vm = (vC - V.vB) / 2;
    const xA = 540 + V.vA * t * S, xB = 260 - V.vB * t * S, yC = 260 + vC * t * S, ym = 420 + vm * t * S, ytop = 68;
    const PL = [300, 90], PR = [420, 90], rp = 22, rC = 11, cxC = 409, cxm = 365.5, rm = 43.5;
    ceilingBar(ctx, 250, 470, 30); line(ctx, PL[0], 30, PL[0], PL[1], COL.spring, 2); line(ctx, PR[0], 30, PR[0], PR[1], COL.spring, 2);
    // shelves on which A and B slide
    floorBar(ctx, nr ? 120 : 0, 268, 84); floorBar(ctx, 452, nr ? 700 : 800, 84);
    // cable 1: B → over the left pulley → down, under the pulley of m → up to the axle of C
    cable(ctx, () => { ctx.moveTo(xB + 18, ytop); ctx.lineTo(PL[0], ytop); ctx.arc(PL[0], PL[1], rp, -Math.PI / 2, 0, false); ctx.lineTo(cxm - rm, ym);
      ctx.arc(cxm, ym, rm, Math.PI, 0, true); ctx.lineTo(cxC, yC + rC + 6); });
    // cable 2: A → over the right pulley → down, under C → up to the bracket of the right pulley
    cable(ctx, () => { ctx.moveTo(xA - 18, ytop); ctx.lineTo(PR[0], ytop); ctx.arc(PR[0], PR[1], rp, -Math.PI / 2, -Math.PI, true); ctx.lineTo(cxC - rC, yC);
      ctx.arc(cxC, yC, rC, Math.PI, 0, true); ctx.lineTo(cxC + rC, PR[1] + rp - 2); });
    const dA = V.vA * t, dB = V.vB * t, dC = vC * t, dm = vm * t;
    pulleyMark(ctx, PL[0], PL[1], rp, -dB * S / rp); pulleyMark(ctx, PR[0], PR[1], rp, dA * S / rp);
    pulleyMark(ctx, cxC, yC, rC, (V.vA / 2) * t * S / rC);
    pulleyMark(ctx, cxm, ym, rm, (-dB - dm) * S / rm);
    ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cxC + rC, PR[1] + rp, 3, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    line(ctx, cxC, yC, cxC, yC + rC + 6, COL.spring, 2);
    line(ctx, cxm, ym, cxm, ym + rm + 18, COL.spring, 2); block(ctx, cxm, ym + rm + 40, 50, 44, 0, 'm');
    block(ctx, xA, ytop, 36, 30, 0, 'A'); block(ctx, xB, ytop, 36, 30, 0, 'B');
    txt(ctx, 'C', cxC + 24, yC + 4, { font: F_IT });
    // velocity arrows
    const kv = 32;
    if (Math.abs(V.vA) > 0.05) vec(ctx, xA, 40, V.vA * kv, 0, COL.c1, 'v_A');
    if (Math.abs(V.vB) > 0.05) vec(ctx, xB, 40, -V.vB * kv, 0, COL.c1, 'v_B');
    if (Math.abs(vC) > 0.05) vec(ctx, cxC + 44, yC, 0, vC * kv, COL.c3, 'v_C');
    if (Math.abs(vm) > 0.05) vec(ctx, cxm + 50, ym + rm + 40, 0, vm * kv, COL.c3, 'v_m');
    // coordinates measured down from the ceiling
    arrow(ctx, 470, 96, 470, 96 + 70, COL.muted, 1.3); txt(ctx, 'x_C', 488, 130, { font: F_ITS, color: COL.muted });
    arrow(ctx, 250, 96, 250, 96 + 150, COL.muted, 1.3); txt(ctx, 'x_m', 232, 170, { font: F_ITS, color: COL.muted });
    txt(ctx, `t = ${fmt(t, 3)} s`, nr ? 690 : 790, 24, { font: F_SANS, color: COL.muted, align: 'right' });
    const pc = [[0, 0], [st.tMax, vC * st.tMax]], pm = [[0, 0], [st.tMax, vm * st.tMax]];
    const lo = Math.min(0, vC, vm), hi = Math.max(0, vC, vm);
    plot($('x1d-5-plot'), { xmin: 0, xmax: st.tMax, ymin: lo * st.tMax - 0.2, ymax: hi * st.tMax + 0.2, xlabel: 'time t (s)', ylabel: 'displacement (m, down +)',
      series: [{ pts: pc, color: COL.c4, width: 2.4, label: 'Δx_C' }, { pts: pm, color: COL.c3, width: 2.4, label: 'Δx_m' }],
      points: [{ x: t, y: dC, color: COL.c4, r: 5 }, { x: t, y: dm, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 1.D.6: block A on a vertical guide, lifted by one cable from B and C ---------- */
makeClip({
  id: 'x1d-6', speed: 0.1,
  controls: [
    { key: 'vB', label: 'Speed of B (down), v_B', min: 1, max: 30, step: 1, value: 6, unit: 'ft/s', dec: 0 },
    { key: 'vC', label: 'Speed of C (down), v_C', min: 1, max: 30, step: 1, value: 18, unit: 'ft/s', dec: 0 }
  ],
  reset(st){
    const V = st.V, k = (V.vB + V.vC) / 2, r0 = Math.sqrt(45);
    st.k = k; st.tStar = (r0 - 5) / k; st.tEnd = (r0 - Math.sqrt(9 + 1.5 * 1.5)) / k; st.hold = 0; st.did = false; st.tt = 0;
    const vA = (V.vB + V.vC) * 5 / (2 * 4);
    setStats('x1d-6-stats', [['ṡ_A at s_A = 4 ft', '−' + fmt(vA, 4) + ' ft/s', true], ['A moves', 'upward at ' + fmt(vA, 4) + ' ft/s', true]]);
  },
  step(st, dt){
    if (st.hold > 0){ st.hold -= dt; return; }
    st.tt += dt;
    if (!st.did && st.tt >= st.tStar){ st.tt = st.tStar; st.hold = 0.15; st.did = true; }
    if (st.tt > st.tEnd){ st.tt = 0; st.did = false; st.hold = 0.05; }
  },
  draw(st){
    const cv = $('x1d-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [20, 10, 560, 470]);
    const V = st.V, t = st.tt, S = 40, r0 = Math.sqrt(45), q = r0 - st.k * t, sA = Math.sqrt(Math.max(q * q - 9, 0));
    const sC = 1.5 + V.vC * t, sB = 1.5 + V.vB * t, vA = st.k * q / sA;   // speed of A, upward
    const D = [100, 70], E = [340, 70], X0 = 220, yA = D[1] + sA * S;
    ceilingBar(ctx, 75, 125, 40); ceilingBar(ctx, 315, 365, 40); line(ctx, D[0], 40, D[0], D[1], COL.spring, 3); line(ctx, E[0], 40, E[0], E[1], COL.spring, 3);
    // vertical guide for A
    [X0 - 22, X0 + 22].forEach((x, i) => { line(ctx, x, 120, x, 420, COL.fg, 2); hatch(ctx, x, i ? 420 : 120, x, i ? 120 : 420, 1, 8, 7); });
    line(ctx, X0, 50, X0, 430, COL.muted, 1, [4, 4]);
    cable(ctx, () => { ctx.moveTo(D[0], D[1] + sC * S - 2); ctx.lineTo(D[0], D[1]); ctx.lineTo(X0, yA); ctx.lineTo(E[0], E[1]); ctx.lineTo(E[0], E[1] + sB * S - 2); });
    pulley(ctx, D[0], D[1], 7); pulley(ctx, E[0], E[1], 7);
    block(ctx, X0, yA + 4, 34, 34, 0); pulley(ctx, X0, yA, 6); txt(ctx, 'A', X0 + 44, yA + 34, { font: F_IT });
    block(ctx, D[0], D[1] + sC * S + 18, 26, 36, 0, 'C'); block(ctx, E[0], E[1] + sB * S + 18, 26, 36, 0, 'B');
    txt(ctx, 'D', D[0] - 22, D[1] - 6, { font: F_IT }); txt(ctx, 'E', E[0] + 22, E[1] - 6, { font: F_IT });
    // dimensions
    line(ctx, D[0], 22, X0, 22, COL.muted, 1); line(ctx, X0, 22, E[0], 22, COL.muted, 1); txt(ctx, '3 ft', (D[0] + X0) / 2, 14, { font: F_ITS, color: COL.muted }); txt(ctx, '3 ft', (X0 + E[0]) / 2, 14, { font: F_ITS, color: COL.muted });
    line(ctx, X0 + 36, D[1], X0 + 36, yA, COL.muted, 1); txt(ctx, 's_A', X0 + 54, (D[1] + yA) / 2, { font: F_ITS, color: COL.muted });
    vec(ctx, X0 - 46, yA, 0, -Math.min(110, vA * 3.2), COL.c2, 'v_A');
    vec(ctx, D[0] - 28, D[1] + sC * S + 18, 0, V.vC * 3, COL.c1, 'v_C'); vec(ctx, E[0] + 28, E[1] + sB * S + 18, 0, V.vB * 3, COL.c1, 'v_B');
    txt(ctx, `s_A = ${fmt(sA, 3)} ft`, 550, 24, { font: F_BOLD, align: 'right', color: Math.abs(sA - 4) < 0.02 ? COL.c2 : COL.fg });
    if (st.hold > 0 && st.did) txt(ctx, 'the instant in the problem', 550, 46, { font: F_BOLD, color: COL.c2, align: 'right' });
    const pts = []; for (let i = 0; i <= 80; i++){ const s = 1.5 + 4.5 * i / 80; pts.push([s, (V.vB + V.vC) / 2 * Math.sqrt(9 + s * s) / s]); }
    plot($('x1d-6-plot'), { xmin: 1.5, xmax: 6, ymin: 0, ymax: Math.max(...pts.map(p => p[1])) * 1.08, xlabel: 'distance of A below D and E (ft)', ylabel: 'upward speed of A (ft/s)',
      series: [{ pts, color: COL.c2, width: 2.4 }], points: [{ x: 4, y: (V.vB + V.vC) * 5 / 8, color: COL.muted, r: 4 }, { x: sA, y: vA, color: COL.c2, r: 5 }] });
  }
});

subLabels();
})();
