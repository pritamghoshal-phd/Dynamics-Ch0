/* =========================================================
   Chapter 5, impulse–momentum examples 5.C.1 to 5.C.9
   (5.C.5 and 5.C.6 use the clips e-c5 and e-c6 in ch5.js)
   ========================================================= */
(function(){

/* ---------- 5.C.1: drum hoisted by two cable forces ---------- */
makeClip({
  id: 'xi-1', speed: 0.25,
  controls: [
    { key: 'F', label: 'Force F', min: 0, max: 400, step: 5, value: 100, unit: 'N', dec: 1 },
    { key: 'w1', label: 'Initial spin ω_1 (counterclockwise +)', min: -20, max: 20, step: 0.5, value: 2, unit: 'rad/s', dec: 2 }
  ],
  reset(st){
    const V = st.V, m = 20, M = 30, r = 0.4, k = 0.4, g = G0;
    st.a = (3 * V.F - (m + M) * g) / (m + M); st.al = V.F * r / (m * k * k); st.hold = undefined;
    setStats('xi-1-stats', [['a_O = (3F − (m + M)g)/(m + M)', fmt(st.a, 4) + ' m/s² (up +)'], ['α = F r / (m k_O²)', fmt(st.al, 4) + ' rad/s²'],
      ['v_O at t = 10 s', fmt(-4 + st.a * 10, 4) + ' m/s (up +)', true], ['ω at t = 10 s', fmt(V.w1 + st.al * 10, 4) + ' rad/s (counterclockwise +)', true]]);
  },
  step(st){ if (st.t > 10){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.5){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('xi-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 420, 380]);
    const V = st.V, t = Math.min(st.hold ?? st.t, 10), S = 110, r = 0.4 * S, ox = 210, oy = 190;
    const y = -4 * t + 0.5 * st.a * t * t, v = -4 + st.a * t, th = V.w1 * t + 0.5 * st.al * t * t; // y up +, θ counterclockwise +
    // a fixed height scale behind the moving drum (the camera follows O): one tick per metre
    for (let k = Math.floor(y - 2); k <= y + 2; k++){ const Y = oy - (k - y) * S; if (Y < 0 || Y > 380) continue;
      line(ctx, 20, Y, 44, Y, COL.muted, 1.5); txt(ctx, `${k} m`, 50, Y, { font: '11px system-ui', color: COL.muted, align: 'left' }); }
    line(ctx, 20, 0, 20, 380, COL.muted, 1);
    // hanging body of mass M, pinned to the drum axle at O
    ctx.save(); ctx.fillStyle = '#8a8478'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ox - 14, oy); ctx.lineTo(ox + 14, oy); ctx.lineTo(ox + 32, oy + 110); ctx.lineTo(ox - 32, oy + 110); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'M', ox + 44, oy + 90, { font: 'italic 14px Georgia, serif' });
    // cables leave the left and right sides of the drum vertically
    cable(ctx, () => { ctx.moveTo(ox - r, oy); ctx.lineTo(ox - r, 40); }); cable(ctx, () => { ctx.moveTo(ox + r, oy); ctx.lineTo(ox + r, 40); });
    arrow(ctx, ox - r, 60, ox - r, 14, COL.c1, 3); txt(ctx, 'F', ox - r - 12, 22, { color: COL.c1, align: 'right' });
    arrow(ctx, ox + r, 60, ox + r, 14, COL.c1, 3); txt(ctx, '2F', ox + r + 12, 22, { color: COL.c1, align: 'left' });
    // drum (canvas rotation is clockwise +, so use −θ)
    ctx.save(); ctx.translate(ox, oy); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(-th); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r + 4); ctx.stroke(); ctx.restore();
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox + 12, oy + 14, { font: 'italic 13px Georgia, serif' });
    txt(ctx, `t = ${fmt(t, 3)} s`, 410, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    if (Math.abs(v) > 0.05) arrow(ctx, ox + 70, oy, ox + 70, oy - Math.sign(v) * Math.min(80, 12 + Math.abs(v) * 1.5), COL.c3, 2.6);
    txt(ctx, `v_O = ${fmt(Math.abs(v), 3)} m/s ${v < 0 ? 'down' : 'up'}`, ox + 82, oy - 10, { font: '12px system-ui', color: COL.c3, align: 'left' });
    const pv = [], pw = []; for (let i = 0; i <= 100; i++){ const q = 10 * i / 100; pv.push([q, -4 + st.a * q]); pw.push([q, V.w1 + st.al * q]); }
    const vr = pv.map(p => p[1]), wr = pw.map(p => p[1]);
    plot($('xi-1-plot'), { xmin: 0, xmax: 10, ymin: Math.min(0, ...vr) * 1.1 - 1, ymax: Math.max(0, ...vr) * 1.1 + 1, xlabel: 'time t (s)', ylabel: 'v_O (m/s, up +)', series: [{ pts: pv, color: COL.c3, width: 2.4 }], points: [{ x: t, y: v, color: COL.c3, r: 5 }] });
    plot($('xi-1-plot2'), { xmin: 0, xmax: 10, ymin: Math.min(0, ...wr) * 1.1 - 1, ymax: Math.max(0, ...wr) * 1.1 + 1, xlabel: 'time t (s)', ylabel: 'ω (rad/s, ccw +)', series: [{ pts: pw, color: COL.c2, width: 2.4 }], points: [{ x: t, y: V.w1 + st.al * t, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 5.C.2: rolling spool pulled by a hanging block ---------- */
makeClip({
  id: 'xi-2', speed: 0.5,
  controls: [
    { key: 'm', label: 'Mass of block A, m', min: 1, max: 40, step: 1, value: 10, unit: 'kg', dec: 1 },
    { key: 'M', label: 'Spool mass M', min: 1, max: 60, step: 1, value: 20, unit: 'kg', dec: 1 }
  ],
  reset(st){
    const V = st.V, r = 0.2, R = 0.4, k = 0.25, IC = V.M * (k * k + R * R);
    st.al = V.m * G0 * (R + r) / (IC + V.m * (R + r) * (R + r));
    st.T = (V.M * R * R + V.M * k * k) * st.al / (R + r); st.F = V.M * R * st.al - st.T;
    st.tEnd = Math.sqrt(2 * 1.4 / (R * st.al)); st.hold = undefined;
    setStats('xi-2-stats', [['α = m g (R + r) / (I_C + m(R + r)²)', fmt(st.al, 4) + ' rad/s² (clockwise)'], ['ω at t = 10 s', fmt(st.al * 10, 4) + ' rad/s', true],
      ['cable tension T', fmt(st.T, 4) + ' N'], ['friction on the spool', fmt(st.F, 4) + ' N (toward the pulley)']]);
  },
  step(st){ if (st.t > st.tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('xi-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 430, 470); fitView(ctx, w, h, nr ? [20, 0, 560, 470] : [0, 0, 720, 470]);
    const S = 110, R = 0.4 * S, r = 0.2 * S, fy = 160, edge = 520, t = Math.min(st.hold ?? st.t, st.tEnd);
    const th = 0.5 * st.al * t * t, x = 0.4 * th, cx = 90 + R + x * S, cy = fy - R; // rolling: x_O = R θ (θ clockwise)
    // floor ledge, its vertical face, and the pulley bracket fixed to the ledge
    line(ctx, 20, fy, edge, fy, COL.fg, 2); hatch(ctx, 20, fy, edge, fy, 1);
    line(ctx, edge, fy, edge, 460, COL.fg, 2); hatch(ctx, edge, 460, edge, fy, -1);
    const px = edge + 26, py = fy - R - r + 0; // top of the hub is at height R + r
    const pr = 12, pcy = cy - r + pr;
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(edge, fy - 10); ctx.lineTo(px, pcy); ctx.lineTo(edge, pcy - 26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    // block A hangs from the pulley; it drops (R + r) θ
    const yA = pcy + 70 + (0.6 * th) * S;
    cable(ctx, () => { ctx.moveTo(cx, cy - r); ctx.lineTo(px, cy - r); ctx.arc(px, pcy, pr, -Math.PI / 2, 0); ctx.lineTo(px + pr, yA - 20); });
    pulley(ctx, px, pcy, pr);
    block(ctx, px + pr, yA, 36, 40, 0, 'A');
    // spool: outer rim R, hub r, spoke rotates clockwise
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9d4c6'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(th); ctx.strokeStyle = COL.fg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, R - 3); ctx.stroke(); ctx.restore();
    pinDot(ctx, cx, cy); txt(ctx, 'O', cx - 12, cy + 14, { font: 'italic 13px Georgia, serif' });
    txt(ctx, 'no slip', 60, fy + 26, { font: 'italic 12px Georgia, serif', color: COL.muted });
    txt(ctx, `t = ${fmt(t, 3)} s,  ω = ${fmt(st.al * t, 3)} rad/s`, nr ? 290 : 360, 22, { font: '600 13px system-ui' });
    plot($('xi-2-plot'), { xmin: 0, xmax: 10, ymin: 0, ymax: st.al * 10 * 1.1, xlabel: 'time t (s)', ylabel: 'ω (rad/s)', series: [{ pts: [[0, 0], [10, st.al * 10]], color: COL.c2, width: 2.4 }], points: [{ x: t, y: st.al * t, color: COL.c2, r: 5 }, { x: 10, y: st.al * 10, color: COL.c1, r: 5 }] });
  }
});

/* ---------- 5.C.3: block sliding outward in a smooth slot of a spinning disk ---------- */
makeClip({
  id: 'xi-3', speed: 0.25,
  controls: [
    { key: 'I', label: 'Disk inertia I_O', min: 0.05, max: 3, step: 0.05, value: 0.5, unit: 'kg·m²', dec: 3 },
    { key: 'm', label: 'Block mass m', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'w1', label: 'Initial spin ω_1', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'rad/s', dec: 2 }
  ],
  reset(st){ st.s = [0.01, 0, 0]; st.lastT = 0; st.hold = undefined; },
  step(st){
    const V = st.V, H = (V.I + V.m * 1e-4) * V.w1, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.hold !== undefined){ if (st.t > st.hold + 1.2){ st.t = 0; st.lastT = 0; st.s = [0.01, 0, 0]; st.hold = undefined; } return; }
    // r'' = r ω² (smooth slot: no radial force), ω = H / (I_O + m r²), φ' = ω
    st.s = stepN(s => { const W = H / (V.I + V.m * s[0] * s[0]); return [s[1], s[0] * W * W, W]; }, st.s, dt, 0.0005);
    if (st.s[0] >= 0.57){ st.s[0] = 0.57; st.hold = st.t; }
  },
  draw(st){
    const cv = $('xi-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 380, 380]);
    const V = st.V, S = 270, cx = 190, cy = 190, [r, rd, ph] = st.s, H = (V.I + V.m * 1e-4) * V.w1, W = H / (V.I + V.m * r * r);
    txt(ctx, 'Top view. The disk turns freely about a fixed vertical shaft at O.', 190, 12, { font: '12px system-ui', color: COL.muted });
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ph);
    ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 0.6 * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.card; ctx.fillRect(0, -9, 0.6 * S - 4, 18); ctx.strokeRect(0, -9, 0.6 * S - 4, 18);
    block(ctx, r * S, 0, 22, 16, 0, '');
    ctx.restore();
    // fixed shaft (bearing) at O
    ctx.save(); ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); pinDot(ctx, cx, cy);
    txt(ctx, 'O', cx - 14, cy + 16, { font: 'italic 13px Georgia, serif' });
    // velocity of the block: radial part r', transverse part rω (drawn at 25 px per m/s)
    const bx = cx + r * S * Math.cos(ph), by = cy - r * S * Math.sin(ph), er = [Math.cos(ph), -Math.sin(ph)], et = [-Math.sin(ph), -Math.cos(ph)], k = 25;
    const vr = rd, vt = r * W; const kk = 55;
    if (vr * kk > 3) arrow(ctx, bx, by, bx + er[0] * vr * kk, by + er[1] * vr * kk, COL.c3, 2.4);
    if (vt * kk > 3) arrow(ctx, bx, by, bx + et[0] * vt * kk, by + et[1] * vt * kk, COL.c4, 2.4);
    arrow(ctx, bx, by, bx + (er[0] * vr + et[0] * vt) * kk, by + (er[1] * vr + et[1] * vt) * kk, COL.c1, 3);
    txt(ctx, 'P', bx - et[0] * 18, by - et[1] * 18, { font: 'italic 13px Georgia, serif' });
    momentArrow(ctx, cx, cy, 40, true, COL.c2, '');
    const pr = [], pt = []; for (let i = 1; i <= 100; i++){ const q = 0.6 * i / 100; pr.push([q, V.w1 * q * Math.sqrt(V.I / (V.I + V.m * q * q))]); pt.push([q, V.I * V.w1 * q / (V.I + V.m * q * q)]); }
    const hi = Math.max(...pr.map(p => p[1]), ...pt.map(p => p[1]));
    plot($('xi-3-plot'), { xmin: 0, xmax: 0.6, ymin: 0, ymax: hi * 1.15, xlabel: 'distance r of the block from O (m)', ylabel: 'speed (m/s)', series: [{ pts: pr, color: COL.c3, width: 2.2 }, { pts: pt, color: COL.c4, width: 2.2, dash: [6, 4] }], points: [{ x: r, y: vr, color: COL.c3, r: 5 }, { x: r, y: vt, color: COL.c4, r: 5 }] });
    statsEvery(st, 'xi-3-stats', () => [['r', fmt(r, 3) + ' m'], ['ω = I_O ω_1 / (I_O + m r²)', fmt(W, 4) + ' rad/s', true], ['radial speed r′ (simulated)', fmt(vr, 4) + ' m/s'],
      ['formula ω_1 r √(I_O / (I_O + m r²))', fmt(V.w1 * r * Math.sqrt(V.I / (V.I + V.m * r * r)), 4) + ' m/s'], ['transverse speed r ω', fmt(vt, 4) + ' m/s']]);
  }
});

/* ---------- 5.C.4: bar sliding in a slot at the end of a massless rotating frame ---------- */
(function(){
  const PRE = [['Bar slides ahead (in the direction of rotation)', 1], ['Bar slides behind', -1]];
  const m = 3, R = 1, d = 0.3, IG = m * d * d / 12;
  makeClip({
    id: 'xi-4', speed: 0.25,
    controls: [{ key: 'W1', label: 'Initial rate Ω_1', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'rad/s', dec: 2 }],
    presets: (C, st, reset) => PRE.map(([label, k]) => ({ label, apply: () => { st.dir = k; reset(); } })),
    setup(st){ st.dir = 1; },
    reset(st){
      document.querySelectorAll('#xi-4-pre .chip').forEach((b, i) => b.classList.toggle('on', PRE[i][1] === st.dir));
      st.s = [st.dir * 2e-4, 0, st.V.W1, 0]; st.lastT = 0; st.hold = undefined;
      st.H = (IG + m * R * R) * st.V.W1; st.E = 0.5 * (IG + m * R * R) * st.V.W1 * st.V.W1;
    },
    step(st){
      const dt = st.t - st.lastT; st.lastT = st.t;
      if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [st.dir * 2e-4, 0, st.V.W1, 0]; st.hold = undefined; } return; }
      // s'' + Ω' R − Ω² s = 0 (no force along the smooth slot) and d/dt[(I_G + m(R² + s²))Ω + m R s'] = 0
      st.s = stepN(y => { const [s, sd, W] = y, Wd = -(2 * m * s * sd * W + m * R * W * W * s) / (IG + m * s * s); return [sd, W * W * s - Wd * R, Wd, W]; }, st.s, dt, 0.0002);
      if (Math.abs(st.s[0]) >= d){ st.s[0] = Math.sign(st.s[0]) * d; st.hold = st.t; }
    },
    draw(st){
      const cv = $('xi-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 460, 460]);
      const [s, sd, W, ph] = st.s, S = 170, ox = 230, oy = 230;
      txt(ctx, 'Top view (horizontal plane). The frame is pinned to the ground at O.', 230, 12, { font: '12px system-ui', color: COL.muted });
      // fixed ground bearing at O
      ctx.save(); ctx.fillStyle = '#8a8478'; ctx.fillRect(ox - 12, oy - 12, 24, 24); ctx.restore(); hatch(ctx, ox - 12, oy + 12, ox + 12, oy + 12, 1, 6, 5);
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(-ph);
      line(ctx, 0, 0, R * S, 0, COL.spring, 6);                                      // arm OA (massless)
      ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.fillRect(R * S - 8, -0.55 * S, 16, 1.1 * S); ctx.strokeRect(R * S - 8, -0.55 * S, 16, 1.1 * S); // slot
      ctx.fillStyle = '#5b5a55'; ctx.fillRect(R * S - 5, -(s + d / 2) * S, 10, d * S);   // bar P (s measured in the direction of rotation)
      ctx.restore();
      pinDot(ctx, ox, oy); txt(ctx, 'O', ox - 18, oy + 18, { font: 'italic 13px Georgia, serif' });
      const ax = ox + R * S * Math.cos(ph), ay = oy - R * S * Math.sin(ph); txt(ctx, 'A', ax + 16 * Math.cos(ph), ay - 16 * Math.sin(ph), { font: 'italic 13px Georgia, serif' });
      momentArrow(ctx, ox, oy, 34, true, COL.c2, ''); txt(ctx, 'Ω', ox + 44, oy - 34, { color: COL.c2 });
      const H = (IG + m * (R * R + s * s)) * W + m * R * sd, E = 0.5 * IG * W * W + 0.5 * m * (W * W * s * s + (sd + W * R) * (sd + W * R));
      statsEvery(st, 'xi-4-stats', () => [['position of G along the slot, s', fmt(s, 4) + ' m'], ['Ω', fmt(W, 4) + ' rad/s', true], ['sliding speed s′', fmt(sd, 4) + ' m/s'],
        ['H_O (stays constant)', fmt(H, 5) + ' kg·m²/s'], ['kinetic energy (stays constant)', fmt(E, 5) + ' J']]);
    }
  });
})();

/* ---------- 5.C.7: bar strikes a fixed stop off its center ---------- */
makeClip({
  id: 'xi-7', speed: 0.5,
  controls: [
    { key: 'e', label: 'Coefficient of restitution e', min: 0, max: 1, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'v', label: 'Approach speed v_{G1}', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'm/s', dec: 2 }
  ],
  presets: C => [{ label: 'e = 0 (no bounce)', apply: () => C.set({ e: 0 }) }, { label: 'e = 3/4', apply: () => C.set({ e: 0.75 }) }, { label: 'e = 1 (elastic)', apply: () => C.set({ e: 1 }) }],
  reset(st){
    const V = st.V, L = 1, m = 1; st.J = 4 / 7 * m * (1 + V.e) * V.v; st.vG2 = V.v * (4 * V.e - 3) / 7; st.w2 = 12 / 7 * (1 + V.e) * V.v / L; st.hold = undefined; st.msg = '';
    st.t0 = 0.6 / V.v; // time to reach the stop
    const KE1 = 0.5 * m * V.v * V.v, KE2 = 0.5 * m * st.vG2 * st.vG2 + 0.5 * (m * L * L / 12) * st.w2 * st.w2;
    setStats('xi-7-stats', [['v_{G2} = (4e − 3) v_{G1} / 7', fmt(st.vG2, 4) + ' m/s (positive = away from the stop)', true], ['ω_2 = 12(1 + e) v_{G1} / (7L)', fmt(st.w2, 4) + ' rad/s counterclockwise (L = 1 m)', true],
      ['impulse of the stop', fmt(st.J, 4) + ' N·s per kg of bar'], ['kinetic energy lost', fmt(100 * (1 - KE2 / KE1), 3) + ' %']]);
  },
  step(st){
    if (st.hold !== undefined){ if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; st.msg = ''; } return; }
    if (st.t > st.t0 + 1.6){ st.hold = st.t; return; }
    const tau = st.t - st.t0;
    if (tau > 0.05){ // second contact check: any point of the bar inside the stop (lengths in metres, y downward)
      const S = 220, L = 1, ph = st.w2 * tau, xg = st.vG2 * tau, ux = -Math.sin(ph), uy = -Math.cos(ph), pad = 6 / S;
      for (let i = 0; i <= 40; i++){ const u = -L / 2 + L * i / 40, x = xg + ux * u, y = uy * u;
        if (x > -26 / S - pad && x < pad && Math.abs(y - L / 4) < 26 / S + pad){ st.hold = st.t; st.msg = 'The rotating bar reaches the stop again here, so the animation stops.'; return; } }
    }
  },
  draw(st){
    const cv = $('xi-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 380, 420); fitView(ctx, w, h, nr ? [40, 0, 500, 380] : [0, 0, 600, 380]);
    const V = st.V, S = 220, L = 1, stopX = 120, gy = 160, t = st.hold ?? Math.min(st.t, st.t0 + 1.6);
    txt(ctx, 'Top view of a smooth horizontal surface.', nr ? 270 : 300, 14, { font: '12px system-ui', color: COL.muted });
    // fixed stop, anchored to the ground
    const Ay0 = gy + L / 4 * S; ctx.save(); ctx.fillStyle = '#8a8478'; ctx.fillRect(stopX - 26, Ay0 - 26, 18, 52); ctx.restore(); hatch(ctx, stopX - 26, Ay0 + 26, stopX - 26, Ay0 - 26, -1, 7, 6);
    ctx.save(); ctx.fillStyle = '#5b5a55'; ctx.beginPath(); ctx.arc(stopX - 8, Ay0, 9, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.restore();
    // bar: x of G (left is toward the stop), angle φ (counterclockwise +)
    let xG, ph = 0, vx;
    if (t < st.t0){ xG = stopX + 0.6 * S - V.v * t * S; vx = -V.v; } else { const tau = t - st.t0; xG = stopX + st.vG2 * tau * S; ph = st.w2 * tau; vx = st.vG2; }
    const ux = -Math.sin(ph), uy = -Math.cos(ph); // unit vector along the bar toward its top end (canvas)
    line(ctx, xG - ux * L / 2 * S, gy - uy * L / 2 * S, xG + ux * L / 2 * S, gy + uy * L / 2 * S, COL.massEdge, 12);
    line(ctx, xG - ux * L / 2 * S, gy - uy * L / 2 * S, xG + ux * L / 2 * S, gy + uy * L / 2 * S, COL.mass, 8);
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(xG, gy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', xG + 14, gy - 6, { font: 'italic 13px Georgia, serif' });
    const ax = xG - ux * L / 4 * S, ay = gy - uy * L / 4 * S; ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'A', ax + 14, ay + 4, { font: 'italic 13px Georgia, serif', color: RED });
    if (Math.abs(vx) > 0.01) arrow(ctx, xG, gy - 40, xG + Math.sign(vx) * Math.min(90, 20 + Math.abs(vx) * 50), gy - 40, COL.c1, 2.6);
    txt(ctx, st.msg || (t < st.t0 ? 'Before the impact the bar translates.' : 'After the impact the bar translates and rotates.'), nr ? 270 : 300, 350, { font: nr ? '600 11px system-ui' : '600 13px system-ui', color: t < st.t0 ? COL.fg : COL.c2 });
  }
});

/* ---------- 5.C.8: bars raised on a spinning frame ---------- */
makeClip({
  id: 'xi-8', speed: 0.5,
  controls: [{ key: 'W1', label: 'Initial rate Ω_1', min: 1, max: 12, step: 0.5, value: 8, unit: 'rad/s', dec: 2 }],
  reset(st){ st.psi = 0; st.lastT = 0; },
  step(st){
    const dt = st.t - st.lastT; st.lastT = st.t; const T = 16, u = (st.t % T) / T;
    st.phi = Math.PI / 2 * (u < 0.4 ? u / 0.4 : u < 0.5 ? 1 : u < 0.9 ? 1 - (u - 0.5) / 0.4 : 0); // raised slowly, held, lowered slowly
    st.W = st.V.W1 / (1 + 2 * Math.sin(st.phi) + 4 / 3 * Math.sin(st.phi) ** 2); st.psi += st.W * dt;
  },
  draw(st){
    const cv = $('xi-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 360]);
    const S = 120, R = 0.5, cx = 320, top = 100, base = 340, ph = st.phi || 0, ps = st.psi;
    // ground, base block and vertical shaft (fixed bearing)
    line(ctx, 160, base, 480, base, COL.fg, 2); hatch(ctx, 160, base, 480, base, 1);
    ctx.save(); ctx.fillStyle = '#8a8478'; ctx.fillRect(cx - 28, base - 34, 56, 34); ctx.restore();
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.fillRect(cx - 7, top, 14, base - 34 - top); ctx.strokeRect(cx - 7, top, 14, base - 34 - top); ctx.restore();
    // oblique view: radial direction at angle ψ about the vertical axis; depth drawn as a small vertical shift
    const P = (rho, y, sgn) => [cx + sgn * rho * Math.cos(ps) * S, top - y * S + sgn * rho * Math.sin(ps) * S * 0.22];
    const draw = sgn => { const [px, py] = P(R, 0, sgn), [ex, ey] = P(R + 2 * R * Math.sin(ph), -2 * R * Math.cos(ph), sgn);
      line(ctx, px, py, ex, ey, COL.massEdge, 10); line(ctx, px, py, ex, ey, COL.mass, 6); pinDot(ctx, px, py); };
    const back = Math.sin(ps) < 0 ? 1 : -1; draw(back);
    const [ax, ay] = P(R, 0, 1), [bx, by] = P(R, 0, -1); line(ctx, ax, ay, bx, by, COL.spring, 6);
    draw(-back);
    txt(ctx, `bar angle from vertical = ${fmt(ph / RAD, 3)}°`, 320, 22, { font: '600 13px system-ui' });
    const pts = []; for (let i = 0; i <= 100; i++){ const q = Math.PI / 2 * i / 100; pts.push([q / RAD, st.V.W1 / (1 + 2 * Math.sin(q) + 4 / 3 * Math.sin(q) ** 2)]); }
    plot($('xi-8-plot'), { xmin: 0, xmax: 90, ymin: 0, ymax: st.V.W1 * 1.1, xlabel: 'bar angle from vertical (°)', ylabel: 'Ω (rad/s)', series: [{ pts, color: COL.c2, width: 2.4 }], points: [{ x: ph / RAD, y: st.W, color: COL.c2, r: 6 }] });
    statsEvery(st, 'xi-8-stats', () => [['I about the axis', fmt(2 * (1 + 2 * Math.sin(ph) + 4 / 3 * Math.sin(ph) ** 2), 4) + ' m R²'], ['Ω', fmt(st.W, 4) + ' rad/s', true], ['Ω_2 at 90° = 3Ω_1/13', fmt(3 * st.V.W1 / 13, 4) + ' rad/s', true]]);
  }
});

/* ---------- 5.C.9: rod falling on a block that slides on a smooth floor ---------- */
makeClip({
  id: 'xi-9', speed: 0.5,
  controls: [
    { key: 'm', label: 'Rod mass m', min: 1, max: 50, step: 1, value: 10, unit: 'kg', dec: 1 },
    { key: 'M', label: 'Block mass M', min: 1, max: 100, step: 1, value: 30, unit: 'kg', dec: 1 },
    { key: 'th0', label: 'Release angle θ_0', min: 2, max: 80, step: 1, value: 30, unit: '°', dec: 1 }
  ],
  reset(st){ st.s = [0, st.V.th0 * RAD, 0, 0]; st.lastT = 0; st.hold = undefined; },
  step(st){
    const V = st.V, L = 2, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [0, V.th0 * RAD, 0, 0]; st.hold = undefined; } return; }
    // Lagrange equations for the block position x and the rod angle θ (from vertical)
    const f = y => { const [x, th, xd, thd] = y, a11 = V.M + V.m, a12 = V.m * L / 2 * Math.cos(th), a22 = V.m * L * L / 3;
      const b1 = V.m * L / 2 * Math.sin(th) * thd * thd, b2 = V.m * G0 * L / 2 * Math.sin(th), D = a11 * a22 - a12 * a12;
      return [xd, thd, (b1 * a22 - a12 * b2) / D, (a11 * b2 - a12 * b1) / D]; };
    let left = dt;
    while (left > 1e-12){ const hh = Math.min(0.0005, left); left -= hh; const prev = st.s, next = rk(f, prev, hh);
      if (next[1] >= Math.PI / 2){ const u = (Math.PI / 2 - prev[1]) / (next[1] - prev[1]); st.s = prev.map((p, i) => p + u * (next[i] - p)); st.hold = st.t; break; }
      st.s = next; }
  },
  draw(st){
    const cv = $('xi-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 340]);
    const V = st.V, L = 2, S = 110, fy = 300, bw = 0.7 * S, bh = 0.4 * S, [x, th, xd, thd] = st.s;
    line(ctx, 20, fy, 620, fy, COL.fg, 2); hatch(ctx, 20, fy, 620, fy, 1); txt(ctx, 'smooth floor', 90, fy + 22, { font: 'italic 12px Georgia, serif', color: COL.muted });
    const bx = 240 + x * S; block(ctx, bx, fy - bh / 2, bw, bh, 0, 'M');
    const ax = bx, ay = fy - bh; // pin A on top of the block
    const ex = ax + L * S * Math.sin(th), ey = ay - L * S * Math.cos(th);
    line(ctx, ax, ay, ex, ey, COL.massEdge, 12); line(ctx, ax, ay, ex, ey, COL.mass, 8);
    pinDot(ctx, ax, ay); txt(ctx, 'A', ax - 16, ay - 8, { font: 'italic 13px Georgia, serif' });
    line(ctx, ax, ay, ax, ay - 0.8 * S, COL.muted, 1, [4, 4]); txt(ctx, 'θ', ax + 16, ay - 0.55 * S, { font: 'italic 14px Georgia, serif' });
    if (Math.abs(xd) > 0.01){ const ax2 = bx + Math.sign(xd) * Math.min(80, 15 + Math.abs(xd) * 60); arrow(ctx, bx, fy + 34, ax2, fy + 34, COL.c1, 2.6); txt(ctx, 'v_{block}', ax2 + Math.sign(xd) * 8, fy + 34, { font: 'italic 13px Georgia, serif', color: COL.c1, align: xd > 0 ? 'left' : 'right' }); }
    const vGx = xd + L / 2 * Math.cos(th) * thd, P = (V.M + V.m) * xd + V.m * L / 2 * Math.cos(th) * thd;
    const E = 0.5 * V.M * xd * xd + 0.5 * V.m * (vGx * vGx + (L / 2 * Math.sin(th) * thd) ** 2) + 0.5 * V.m * L * L / 12 * thd * thd + V.m * G0 * L / 2 * Math.cos(th);
    txt(ctx, st.hold !== undefined ? 'The rod is horizontal (θ = 90°).' : 'The rod falls and the block slides.', 320, 22, { font: '600 13px system-ui' });
    statsEvery(st, 'xi-9-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['ω of the rod', fmt(thd, 4) + ' rad/s', true], ['velocity of the block', fmt(Math.abs(xd) < 1e-4 ? 0 : xd, 4) + ' m/s', true],
      ['horizontal momentum (stays 0)', fmt(Math.abs(P) < 1e-3 ? 0 : P, 3) + ' kg·m/s'], ['total energy (stays constant)', fmt(E, 5) + ' J']]);
  }
});

subLabels();
})();
