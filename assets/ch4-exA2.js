/* =========================================================
   Chapter 4, Newton's second law examples 4.A.9 to 4.A.15
   (one clip per example, ids x4a-9 ... x4a-15; the 3D views in ch4-3dA2.js read the same state)
   ========================================================= */
(function(){
const GF = 32.2; // ft/s²

/* small helpers used only in this file */
const dot = (ctx, x, y, r = 4, c) => { ctx.save(); ctx.fillStyle = c || COL.fg; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); };
function farrow(ctx, x, y, dx, dy, col, label, lopt = {}){ // arrow from (x, y) by (dx, dy) in screen units, label near the tip
  const L = Math.hypot(dx, dy); if (L < 3) return;
  arrow(ctx, x, y, x + dx, y + dy, col, 2.6);
  if (label){ const ux = dx / L, uy = dy / L; txt(ctx, label, x + dx + ux * 14 + (lopt.dx || 0), y + dy + uy * 14 + (lopt.dy || 0), { color: col, font: lopt.font || 'italic 15px Georgia, serif' }); }
}
function ccwArc(ctx, x, y, R, b0, b1, col){ // visual angles (radians, counterclockwise from +x), arrow head at b1
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, -b0, -b1, true); ctx.stroke(); ctx.restore();
  const ex = x + R * Math.cos(b1), ey = y - R * Math.sin(b1), tx = -Math.sin(b1), ty = -Math.cos(b1);
  arrow(ctx, ex - tx * 8, ey - ty * 8, ex + tx * 2, ey + ty * 2, col, 2);
}
function roundRectPath(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0); ctx.lineTo(x + w, y + h - r); ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2); ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI); ctx.closePath(); }

/* =========================================================
   4.A.9  Zero-gravity flight: level flight, a 2g pull-up to 45° nose high, a free-fall parabola down to 30° nose low,
   a 2g pull-out, level flight. Speed is constant on the arcs; on the parabola only gravity acts (a = g downward).
   Apparent weight n = |a − g| / g (in units of the passenger's weight).
   ========================================================= */
const ZG = { g: 9.79 };
function zgTraj(V){
  const g = ZG.g, U1 = V / Math.cos(45 * RAD), U2 = V / Math.cos(30 * RAD), r1 = U1 * U1 / g, r2 = U2 * U2 / g; // 2g at the bottom of each arc
  const pts = []; let x = 0, y = 0, t = 0; const dt = 0.1;
  const push = (gam, n, ph, sp) => pts.push({ t, x, y, gam, n, ph, sp });
  // level flight
  for (; t < 6 - 1e-9; t += dt){ push(0, 1, 0, U1); x += U1 * dt; }
  // pull-up arc, center above
  const g1 = 45 * RAD, T1 = r1 * g1 / U1, x1 = x, y1 = y, t1 = t;
  for (let s = 0; s < T1; s += dt){ const gm = U1 * s / r1; t = t1 + s; x = x1 + r1 * Math.sin(gm); y = y1 + r1 * (1 - Math.cos(gm)); push(gm, 2 * Math.cos(gm / 2), 1, U1); }
  // parabola (free fall)
  const tp0 = t1 + T1, xp = x1 + r1 * Math.sin(g1), yp = y1 + r1 * (1 - Math.cos(g1)), Tp = (V + V * Math.tan(30 * RAD)) / g;
  for (let s = 0; s < Tp; s += dt){ t = tp0 + s; x = xp + V * s; y = yp + V * s - 0.5 * g * s * s; const vy = V - g * s; push(Math.atan2(vy, V), 0, 2, Math.hypot(V, vy)); }
  // pull-out arc, center above
  const tq0 = tp0 + Tp, xq = xp + V * Tp, yq = yp + V * Tp - 0.5 * g * Tp * Tp, g2 = 30 * RAD, T2 = r2 * g2 / U2;
  const cx = xq + r2 * Math.sin(g2), cy = yq + r2 * Math.cos(g2);
  for (let s = 0; s < T2; s += dt){ const gm = -g2 + U2 * s / r2; t = tq0 + s; x = cx + r2 * Math.sin(gm); y = cy - r2 * Math.cos(gm); push(gm, 2 * Math.cos(gm / 2), 3, U2); }
  const tl = tq0 + T2; x = cx; y = cy - r2;
  for (let s = 0; s < 6; s += dt){ t = tl + s; push(0, 1, 4, U2); x += U2 * dt; }
  const top = { x: xp + V * V / g, y: yp + V * V / (2 * g), t: tp0 + V / g };
  return { pts, top, tz0: tp0, tz1: tq0, T: t, rho: V * V / g };
}
makeClip({
  id: 'x4a-9', speed: 1,
  controls: [{ key: 'V', label: 'Speed at the top, v_top', min: 120, max: 260, step: 5, value: 230, unit: 'm/s', dec: 0 }],
  reset(st){
    st.tr = zgTraj(st.V.V); st.hold = undefined;
    const tr = st.tr;
    setStats('x4a-9-stats', [['ρ = v_top²/g at the top', fmt(tr.rho, 4) + ' m', true], ['ρ in feet', fmt(tr.rho / 0.3048, 4) + ' ft'],
      ['time in free fall', fmt(tr.tz1 - tr.tz0, 3) + ' s'], ['height gained in free fall', fmt(st.V.V * st.V.V / (2 * ZG.g) / 0.3048, 4) + ' ft']]);
  },
  step(st){ const tau = st.t * 8; if (tau > st.tr.T){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('x4a-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 720, 360]);
    const tr = st.tr, P = tr.pts, tau = Math.min((st.hold ?? st.t) * 8, tr.T - 0.01);
    const i = Math.min(P.length - 1, Math.max(0, Math.round(tau / 0.1))), p = P[i];
    const xs = P.map(q => q.x), ys = P.map(q => q.y), X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys);
    const S = Math.min(660 / (X1 - X0), 230 / (Y1 - Y0)), ox = 30 - X0 * S, oy = 320 + Y0 * S; // one true scale in x and y
    const sx = x => ox + x * S, sy = y => oy - y * S;
    // ground reference and the free-fall part of the path
    line(ctx, 20, 340, 700, 340, COL.muted, 1); txt(ctx, 'true scale (x and altitude)', 700, 352, { font: '11px system-ui', color: COL.muted, align: 'right' });
    ctx.save(); ctx.lineWidth = 2.2; ctx.strokeStyle = COL.muted; ctx.setLineDash([5, 5]); ctx.beginPath(); P.forEach((q, k) => k ? ctx.lineTo(sx(q.x), sy(q.y)) : ctx.moveTo(sx(q.x), sy(q.y))); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.lineWidth = 3.4; ctx.strokeStyle = COL.c3; ctx.beginPath(); P.filter(q => q.ph === 2).forEach((q, k) => k ? ctx.lineTo(sx(q.x), sy(q.y)) : ctx.moveTo(sx(q.x), sy(q.y))); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.lineWidth = 2.6; ctx.strokeStyle = COL.fg; ctx.beginPath(); P.slice(0, i + 1).forEach((q, k) => k ? ctx.lineTo(sx(q.x), sy(q.y)) : ctx.moveTo(sx(q.x), sy(q.y))); ctx.stroke(); ctx.restore();
    // osculating circle at the top: radius ρ = v²/g, drawn to the same scale
    const tx = sx(tr.top.x), ty = sy(tr.top.y), R = tr.rho * S;
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(tx, ty + R, R, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, Math.min(ty + R, 335)); ctx.stroke(); ctx.restore();
    txt(ctx, 'ρ', tx + 10, Math.min(ty + R * 0.5, 300), { color: COL.c4 });
    txt(ctx, 'zero g', sx(tr.top.x), ty - 18, { font: '600 12px system-ui', color: COL.c3 });
    // aircraft icon (not to scale), nose along the velocity
    ctx.save(); ctx.translate(sx(p.x), sy(p.y)); ctx.rotate(-p.gam); ctx.fillStyle = '#dfe3ea'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(10, -4); ctx.lineTo(-16, -4); ctx.lineTo(-20, -11); ctx.lineTo(-24, -11); ctx.lineTo(-22, 2); ctx.lineTo(-16, 4); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-8, 10); ctx.lineTo(-12, 10); ctx.lineTo(-6, 0); ctx.stroke(); ctx.restore();
    // acceleration of the aircraft (green): toward the arc center on the arcs, g downward on the parabola
    const an = p.ph === 1 || p.ph === 3 ? [-Math.sin(p.gam), Math.cos(p.gam)] : p.ph === 2 ? [0, -1] : [0, 0];
    const aMag = p.ph === 0 || p.ph === 4 ? 0 : p.ph === 2 ? 1 : 1; // in units of g (each arc is flown at a = g toward the center)
    if (aMag) farrow(ctx, sx(p.x), sy(p.y), an[0] * 40 * aMag, -an[1] * 40 * aMag, COL.c3, 'a');
    // apparent weight read by a passenger's scale
    const nY = 30;
    ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillRect(20, 14, 190, 50); ctx.strokeRect(20, 14, 190, 50); ctx.restore();
    txt(ctx, 'apparent weight', 30, nY - 4, { font: '12px system-ui', color: COL.muted, align: 'left' });
    ctx.save(); ctx.fillStyle = p.n < 0.05 ? COL.c3 : COL.c2; ctx.fillRect(30, nY + 10, 80 * p.n / 2, 12); ctx.strokeStyle = COL.muted; ctx.strokeRect(30, nY + 10, 80, 12); ctx.restore();
    txt(ctx, fmt(p.n, 2) + ' mg', 120, nY + 16, { font: '13px system-ui', align: 'left' });
    const phase = ['level flight', 'pull-up', 'free fall (zero g)', 'pull-out', 'level flight'][p.ph];
    txt(ctx, phase + ' · t = ' + fmt(p.t, 3) + ' s', 700, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // plots: altitude (ft) and apparent weight versus time
    const alt = P.map(q => [q.t, (q.y + 7300) / 304.8]), nn = P.map(q => [q.t, q.n]);
    const ay = alt.map(q => q[1]), band = [{ x0: tr.tz0, x1: tr.tz1, color: COL.band }];
    plot($('x4a-9-plot'), { xmin: 0, xmax: tr.T, ymin: Math.floor(Math.min(...ay)) - 1, ymax: Math.ceil(Math.max(...ay)) + 2, xlabel: 'maneuver time (s)', ylabel: 'altitude (1000 ft)', bands: band,
      series: [{ pts: alt, color: COL.c1, width: 2.4 }], points: [{ x: p.t, y: (p.y + 7300) / 304.8, color: COL.c1, r: 5 }] });
    plot($('x4a-9-plot2'), { xmin: 0, xmax: tr.T, ymin: 0, ymax: 2.2, xlabel: 'maneuver time (s)', ylabel: 'apparent weight / mg', bands: band,
      series: [{ pts: nn, color: COL.c2, width: 2.4 }], points: [{ x: p.t, y: p.n, color: COL.c2, r: 5 }] });
  }
});

/* =========================================================
   4.A.10  Slider pulled inward along a slotted arm that turns at constant ω in a horizontal plane (top view).
   a_r = r̈ − r ω² = −r ω²,  a_θ = r α + 2 ṙ ω = 2 ṙ ω.  T = m r ω², N = m (2 ṙ ω) along e_θ.
   ========================================================= */
makeClip({
  id: 'x4a-10', speed: 0.5,
  controls: [
    { key: 'om', label: 'Arm rate ω (counterclockwise)', min: 1, max: 8, step: 0.5, value: 5, unit: 'rad/s', dec: 1 },
    { key: 'rd', label: 'Pull rate ṙ', min: -1, max: 1, step: 0.05, value: -0.5, unit: 'ft/s', dec: 2 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ om: 5, rd: -0.5 }) }, { label: 'Pushed outward, ṙ = +0.5 ft/s', apply: () => C.set({ rd: 0.5 }) }, { label: 'Held still, ṙ = 0', apply: () => C.set({ rd: 0 }) }],
  reset(st){
    const V = st.V; st.m = 5 / GF; st.trace = []; st.hold = undefined;
    st.r0 = V.rd < 0 ? 1.6 : V.rd > 0 ? 0.3 : 0.75; st.T = V.rd === 0 ? 3 : 1.3 / Math.abs(V.rd);
    const T = st.m * 0.75 * V.om * V.om, N = st.m * 2 * V.rd * V.om;
    setStats('x4a-10-stats', [['m = W/g', fmt(st.m, 4) + ' slug'], ['T = m r ω² at r = 0.75 ft', fmt(T, 4) + ' lb', true],
      ['N = m(2ṙω) at r = 0.75 ft', fmt(N, 4) + ' lb', true], ['contact side', Math.abs(N) < 1e-9 ? 'none (N = 0)' : N < 0 ? 'side A (leading side)' : 'side B (trailing side)', true]]);
  },
  step(st){ if (st.t > st.T){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; st.trace = []; } } },
  draw(st){
    const cv = $('x4a-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 500, 440]);
    const V = st.V, t = Math.min(st.hold ?? st.t, st.T), r = st.r0 + V.rd * t, ph = V.om * t, S = 120, O = [250, 230];
    st.r = r; st.ph = ph;
    const er = [Math.cos(ph), -Math.sin(ph)], et = [-Math.sin(ph), -Math.cos(ph)]; // screen vectors (y down); e_θ is counterclockwise
    const Px = O[0] + er[0] * r * S, Py = O[1] + er[1] * r * S;
    // path of P seen from the ground, r = r0 + ṙ τ and φ = ω τ for 0 ≤ τ ≤ t
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]); ctx.beginPath();
    for (let q = 0; q <= 160; q++){ const tau = t * q / 160, rr = st.r0 + V.rd * tau, a = V.om * tau, x = O[0] + rr * S * Math.cos(a), y = O[1] - rr * S * Math.sin(a); q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    // the arm with its slot (drawn in the arm frame)
    ctx.save(); ctx.translate(O[0], O[1]); ctx.rotate(-ph);
    ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; roundRectPath(ctx, -0.16 * S, -0.13 * S, 2.0 * S, 0.26 * S, 0.13 * S); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.card; roundRectPath(ctx, 0.12 * S, -0.055 * S, 1.66 * S, 0.11 * S, 0.055 * S); ctx.fill(); ctx.stroke();
    ctx.restore();
    // slider P
    ctx.save(); ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(Px, Py, 0.055 * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    // cord from P to O, then down through the hollow shaft to the free end E
    line(ctx, Px, Py, O[0], O[1], COL.fg, 1.6);
    ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(O[0], O[1], 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); dot(ctx, O[0], O[1], 3);
    txt(ctx, 'O', O[0] - 20, O[1] + 16);
    // labels of the two sides of the slot, A on the leading (+e_θ) side and B on the trailing side
    const sA = [O[0] + er[0] * 1.55 * S + et[0] * 0.3 * S, O[1] + er[1] * 1.55 * S + et[1] * 0.3 * S], sB = [O[0] + er[0] * 1.55 * S - et[0] * 0.3 * S, O[1] + er[1] * 1.55 * S - et[1] * 0.3 * S];
    txt(ctx, 'A', sA[0], sA[1]); txt(ctx, 'B', sB[0], sB[1]);
    txt(ctx, 'P', Px - et[0] * 22 + er[0] * 10, Py - et[1] * 22 + er[1] * 10);
    // rotation arrow ω about O
    ccwArc(ctx, O[0], O[1], 30, ph + 0.5, ph + 2.3, COL.c4);
    txt(ctx, 'ω', O[0] + 44 * Math.cos(ph + 1.4), O[1] - 44 * Math.sin(ph + 1.4), { color: COL.c4 });
    // forces on P, to scale: T toward O and N perpendicular to the arm
    const m = st.m, T = m * r * V.om * V.om, N = m * 2 * V.rd * V.om, k = 14;
    farrow(ctx, Px, Py, -er[0] * Math.min(130, T * k), -er[1] * Math.min(130, T * k), RED, 'T');
    if (Math.abs(N) > 1e-6) farrow(ctx, Px, Py, et[0] * N * k * 3, et[1] * N * k * 3, COL.c3, 'N', { dx: er[0] * 12, dy: er[1] * 12 });
    txt(ctx, 'N is drawn 3 times larger than T', 490, 430, { font: '11px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, `r = ${fmt(r, 3)} ft`, 490, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // T and N as functions of r
    const rs = [], Ts = [], Ns = []; for (let q = 0; q <= 60; q++){ const rr = 0.3 + 1.3 * q / 60; rs.push(rr); Ts.push([rr, m * rr * V.om * V.om]); Ns.push([rr, N]); }
    const yl = Math.max(1, ...Ts.map(q => q[1]), Math.abs(N));
    plot($('x4a-10-plot'), { xmin: 0.3, xmax: 1.6, ymin: Math.min(0, N) * 1.2 - 0.2, ymax: yl * 1.15, xlabel: 'distance r (ft)', ylabel: 'force (lb)', hlines: [{ y: 0 }],
      series: [{ pts: Ts, color: RED, width: 2.4 }, { pts: Ns, color: COL.c3, width: 2.4 }], points: [{ x: r, y: T, color: RED }, { x: r, y: N, color: COL.c3 }],
      vlines: [{ x: 0.75, label: 'r = 0.75 ft' }] });
  }
});

/* =========================================================
   4.A.11  Slotted arm turning at constant ω over a fixed cam R(θ) = R0 − R1 cos 6θ; a spring pushes P onto the cam.
   Spring compression δ = r − 0.2 m (0.2 m when r = 0.4 m). While in contact, N = (m a_r + F_s)/n_r.
   If N would be negative, P leaves the cam and moves under the spring alone until it lands again (plastic re-contact).
   ========================================================= */
const CAM = { R0: 0.5, R1: 0.1, k: 500, m: 0.2 };
const camR = th => CAM.R0 - CAM.R1 * Math.cos(6 * th), camRp = th => 6 * CAM.R1 * Math.sin(6 * th), camRpp = th => 36 * CAM.R1 * Math.cos(6 * th);
function camForces(th, om){ // contact forces when P rides on the cam
  const R = camR(th), Rp = camRp(th), q = Math.hypot(R, Rp), nr = R / q, nt = -Rp / q;
  const Rd = Rp * om, Rdd = camRpp(th) * om * om, ar = Rdd - R * om * om, at = 2 * Rd * om, Fs = CAM.k * (R - 0.2);
  const N = (CAM.m * ar + Fs) / nr, A = CAM.m * at - N * nt;
  return { R, Rd, ar, at, Fs, N, A, nr, nt };
}
makeClip({
  id: 'x4a-11', speed: 0.1,
  controls: [{ key: 'om', label: 'Arm rate ω', min: 2, max: 20, step: 0.5, value: 10, unit: 'rad/s', dec: 1 }],
  presets: C => [{ label: 'Book data, ω = 10 rad/s', apply: () => C.set({ om: 10 }) }, { label: 'Fast: P leaves the cam', apply: () => C.set({ om: 18 }) }],
  reset(st){
    const om = st.V.om; st.r = camR(0); st.rd = 0; st.on = true; st.th = 0; st.lost = 0; st.trace = [];
    const f = camForces(Math.PI / 6, om), wl = Math.sqrt(CAM.k * 0.4 / (CAM.m * (36 * CAM.R1 + 0.6)));
    setStats('x4a-11-stats', [['a_r at the lobe top', fmt(f.ar, 4) + ' m/s²'], ['spring force at the lobe top', fmt(f.Fs, 4) + ' N'],
      ['cam force N at the lobe top', fmt(f.N, 4) + ' N', true], ['P lifts off the lobes when ω >', fmt(wl, 4) + ' rad/s']]);
  },
  step(st, dt){
    const om = st.V.om, n = Math.max(1, Math.ceil(dt / 2e-5));
    for (let i = 0; i < n; i++){
      const h = dt / n; st.th += om * h;
      if (st.on){ const f = camForces(st.th, om); st.r = f.R; st.rd = f.Rd; if (f.N < 0){ st.on = false; st.lost++; } }
      else {
        const rdd = st.r * om * om - CAM.k / CAM.m * (st.r - 0.2); st.rd += rdd * h; st.r += st.rd * h;
        const R = camR(st.th); if (st.r <= R){ st.r = R; st.rd = camRp(st.th) * om; st.on = true; }
      }
    }
    if (st.th > 4 * Math.PI){ st.th -= 2 * Math.PI; }
  },
  draw(st){
    const cv = $('x4a-11-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 520]);
    const om = st.V.om, S = 300, O = [270, 270], th = st.th;
    // fixed cam
    ctx.save(); ctx.fillStyle = '#d7d2c4'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k <= 360; k++){ const a = k * RAD, R = camR(a); const x = O[0] + R * S * Math.cos(a), y = O[1] - R * S * Math.sin(a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'fixed cam', O[0] - 70, O[1] + 120, { font: '12px system-ui', color: COL.muted });
    // arm (in its own frame), spring from P to the outer end of the arm
    const Larm = 0.85, er = [Math.cos(th), -Math.sin(th)], et = [-Math.sin(th), -Math.cos(th)];
    ctx.save(); ctx.translate(O[0], O[1]); ctx.rotate(-th); ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#5b5f68'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; roundRectPath(ctx, -0.05 * S, -0.04 * S, (Larm + 0.09) * S, 0.08 * S, 0.04 * S); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efeadf'; roundRectPath(ctx, 0.05 * S, -0.018 * S, (Larm - 0.07) * S, 0.036 * S, 0.018 * S); ctx.fill(); ctx.restore();
    const Px = O[0] + er[0] * st.r * S, Py = O[1] + er[1] * st.r * S, Ex = O[0] + er[0] * Larm * S, Ey = O[1] + er[1] * Larm * S;
    springLine(ctx, Px + er[0] * 8, Py + er[1] * 8, Ex, Ey, 9, 7);
    ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(O[0], O[1], 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'O', O[0] - 16, O[1] + 18);
    ctx.save(); ctx.fillStyle = st.on ? '#2b2f38' : RED; ctx.beginPath(); ctx.arc(Px, Py, 7, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'P', Px - et[0] * 20, Py - et[1] * 20);
    txt(ctx, 'k', (Px + Ex) / 2 + et[0] * 20, (Py + Ey) / 2 + et[1] * 20);
    // reference line and the angle θ
    line(ctx, O[0] + 0.62 * S, O[1], O[0] + 260, O[1], COL.muted, 1, [4, 4]);
    // forces on P while it touches the cam: N (normal to the cam), the spring force F_s and the arm force A
    if (st.on){
      const f = camForces(th, om), q = Math.hypot(camR(th), camRp(th)), n = [(camR(th) * er[0] - camRp(th) * et[0]) / q, (camR(th) * er[1] - camRp(th) * et[1]) / q], k = 0.25;
      farrow(ctx, Px, Py, n[0] * f.N * k, n[1] * f.N * k, COL.c3, 'N');
      farrow(ctx, Px, Py, -er[0] * f.Fs * k, -er[1] * f.Fs * k, COL.c2); txt(ctx, 'F_s', Px - er[0] * f.Fs * k * 0.5 - et[0] * 30, Py - er[1] * f.Fs * k * 0.5 - et[1] * 30, { color: COL.c2 });
      if (Math.abs(f.A) * k > 4) farrow(ctx, Px, Py, et[0] * f.A * k, et[1] * f.A * k, COL.c1, 'A');
    } else {
      const Fs = CAM.k * (st.r - 0.2); farrow(ctx, Px, Py, -er[0] * Fs * 0.25, -er[1] * Fs * 0.25, COL.c2, 'F_s', { dx: -et[0] * 44 - er[0] * 10, dy: -et[1] * 44 - er[1] * 10 });
      txt(ctx, 'P has left the cam', 550, 500, { font: '600 13px system-ui', color: RED, align: 'right' });
    }
    txt(ctx, `θ = ${fmt((th % (2 * Math.PI)) / RAD, 3)}°`, 550, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // cam force over one lobe (0° to 60°), assuming contact
    const pts = []; let mn = 0, mx = 0; for (let a = 0; a <= 60; a += 0.5){ const N = camForces(a * RAD, om).N; pts.push([a, N]); mn = Math.min(mn, N); mx = Math.max(mx, N); }
    const ang = ((th / RAD) % 60 + 60) % 60, Nn = camForces(th, om).N;
    plot($('x4a-11-plot'), { xmin: 0, xmax: 60, ymin: mn * 1.1 - 10, ymax: mx * 1.1 + 10, xlabel: 'arm angle within one lobe, θ (deg)', ylabel: 'cam force N (N)', hlines: [{ y: 0 }],
      vlines: [{ x: 30, label: 'lobe top' }], series: [{ pts, color: COL.c3, width: 2.4 }], points: st.on ? [{ x: ang, y: Nn, color: COL.c3 }] : [] });
  }
});

/* =========================================================
   4.A.12  Block on a smooth horizontal surface, then over a circular hill of radius R (θ from the vertical).
   On the hill: R θ̈ = g sin θ, N = m (g cos θ − R θ̇²). It leaves the hill when N = 0, then flies as a projectile.
   ========================================================= */
makeClip({
  id: 'x4a-12', speed: 0.5,
  controls: [{ key: 'v0', label: 'Initial speed v_0', min: 0.2, max: 6, step: 0.01, value: 3.13, unit: 'm/s', dec: 2 }],
  presets: C => [{ label: 'Leaves at 36.87°', apply: () => C.set({ v0: 3.13 }) }, { label: 'Almost at rest (latest exit, 48.2°)', apply: () => C.set({ v0: 0.2 }) }, { label: 'Too fast to touch the hill', apply: () => C.set({ v0: 5.5 }) }],
  reset(st){
    const g = G0, R = 2.5, v0 = st.V.v0; st.ph = 0; st.x = -2.6; st.th = 0; st.w = v0 / R; st.px = 0; st.py = 0; st.vx = 0; st.vy = 0; st.hold = undefined; st.trace = [];
    st.thS = Math.acos(Math.min(1, (2 + v0 * v0 / (g * R)) / 3));
    setStats('x4a-12-stats', [['separation angle θ_s', fmt(st.thS / RAD, 4) + '°', true], ['speed at separation', fmt(Math.sqrt(g * R * Math.cos(st.thS)), 4) + ' m/s'],
      ['N on the flat part', fmt(10 * g, 4) + ' N'], ['N just after the edge (θ = 0)', fmt(Math.max(0, 10 * (g - v0 * v0 / R)), 4) + ' N']]);
  },
  step(st, dt){
    const g = G0, R = 2.5, v0 = st.V.v0, n = Math.max(1, Math.ceil(dt / 5e-4)), h = dt / n;
    for (let i = 0; i < n; i++){
      if (st.ph === 0){ st.x += v0 * h; if (st.x >= 0){ st.ph = 1; st.th = 0; st.w = v0 / R; } }
      else if (st.ph === 1){
        const N = g * Math.cos(st.th) - R * st.w * st.w; // per unit mass
        if (N < 0){ st.ph = 2; const v = R * st.w; st.px = R * Math.sin(st.th); st.py = R * Math.cos(st.th); st.vx = v * Math.cos(st.th); st.vy = -v * Math.sin(st.th); continue; }
        st.w += g / R * Math.sin(st.th) * h; st.th += st.w * h;
      } else if (st.ph === 2){ st.vy -= g * h; st.px += st.vx * h; st.py += st.vy * h;
        // the tilted block (0.4 m wide) first touches the ground with its lower corner; it then settles flat on the ground
        if (st.py <= 0.2 * Math.sin(st.thS)){ st.py = 0; st.ph = 3; } }
    }
    if (st.ph === 3 || st.t > 8){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.reset_ = true; } }
  },
  setup(st, reset){ st._reset = reset; },
  draw(st){
    if (st.reset_){ st.reset_ = false; st._reset(); }
    const cv = $('x4a-12-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 660, 360]);
    const g = G0, R = 2.5, S = 80, C = [260, 320], topY = C[1] - R * S, m = 10;
    // horizontal surface, the quarter-circle hill and the ground
    ctx.save(); ctx.fillStyle = '#a7a39a'; ctx.beginPath(); ctx.moveTo(20, topY); ctx.lineTo(C[0], topY); ctx.arc(C[0], C[1], R * S, -Math.PI / 2, 0); ctx.lineTo(C[0] + R * S - 16, C[1]); ctx.arc(C[0], C[1], R * S - 16, 0, -Math.PI / 2, true); ctx.lineTo(20, topY + 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, topY); ctx.lineTo(C[0], topY); ctx.arc(C[0], C[1], R * S, -Math.PI / 2, 0); ctx.stroke(); ctx.restore();
    line(ctx, 20, C[1], 650, C[1], COL.fg, 2); hatch(ctx, 650, C[1], 20, C[1], -1);
    // a post holds up the left end of the track (as in the 3D view)
    ctx.save(); ctx.fillStyle = '#bdb7a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.fillRect(26, topY + 16, 16, C[1] - topY - 16); ctx.strokeRect(26, topY + 16, 16, C[1] - topY - 16); ctx.restore();
    line(ctx, C[0], C[1], C[0], topY, COL.muted, 1, [4, 4]);
    // position of the block
    let bx, by, ang, onHill = false;
    if (st.ph === 0){ bx = C[0] + st.x * S; by = topY; ang = 0; }
    else if (st.ph === 1){ bx = C[0] + R * S * Math.sin(st.th); by = C[1] - R * S * Math.cos(st.th); ang = st.th; onHill = true; }
    else { bx = C[0] + st.px * S; by = C[1] - st.py * S; ang = st.ph === 3 ? 0 : st.thS; }
    // predicted flight after leaving the hill (a parabola from the separation point)
    { const vs = Math.sqrt(g * R * Math.cos(st.thS)), x0 = R * Math.sin(st.thS), y0 = R * Math.cos(st.thS), vx = vs * Math.cos(st.thS), vy = -vs * Math.sin(st.thS);
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.4; ctx.beginPath();
      for (let q = 0; q <= 80; q++){ const tau = q * 0.02, yy = y0 + vy * tau - 0.5 * g * tau * tau; if (yy < 0.15) break; const X = C[0] + (x0 + vx * tau) * S, Y = C[1] - yy * S; q ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore(); }
    // separation point
    const sx = C[0] + R * S * Math.sin(st.thS), sy = C[1] - R * S * Math.cos(st.thS);
    line(ctx, C[0], C[1], sx, sy, COL.c4, 1.2, [5, 4]); dot(ctx, sx, sy, 4, COL.c4); txt(ctx, 'leaves here', sx + 16, sy - 16, { font: '12px system-ui', color: COL.c4, align: 'left' });
    txt(ctx, 'θ_s', C[0] + 26 * Math.sin(st.thS / 2) + 6, C[1] - 60, { color: COL.c4 });
    txt(ctx, 'R', C[0] + R * S * 0.5 * Math.sin(st.thS) - 14, C[1] - R * S * 0.5 * Math.cos(st.thS), { color: COL.c4 });
    // block, sitting on the surface (drawn 0.4 m wide)
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.fillStyle = '#cfd8ea'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.fillRect(-16, -32, 32, 32); ctx.strokeRect(-16, -32, 32, 32); ctx.restore();
    const gx = bx + 16 * Math.sin(ang), gy = by - 16 * Math.cos(ang);
    txt(ctx, 'm', gx - 28 * Math.cos(ang), gy - 28 * Math.sin(ang) - 6);
    // forces: weight and, while touching the surface, the normal force (N per 10 N = 8 px)
    const k = 0.8, N = st.ph === 0 || st.ph === 3 ? m * g : onHill ? Math.max(0, m * (g * Math.cos(st.th) - R * st.w * st.w)) : 0; // resting on the ground after landing: N = mg
    farrow(ctx, gx, gy, 0, m * g * k, COL.c2, 'mg', { dx: 16 });
    if (N > 0.5){ const ux = Math.sin(ang), uy = -Math.cos(ang); farrow(ctx, bx - 5 * Math.cos(ang), by - 5 * Math.sin(ang), ux * N * k, uy * N * k, COL.c3, 'N', { dx: -14 }); }
    const vNow = st.ph === 0 ? st.V.v0 : st.ph === 1 ? R * st.w : Math.hypot(st.vx, st.vy);
    txt(ctx, `v = ${fmt(st.ph === 3 ? 0 : vNow, 3)} m/s   N = ${fmt(N, 3)} N`, 650, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // N(θ) on the hill for this v0
    const v0 = st.V.v0, pts = []; for (let a = 0; a <= 90; a += 0.5){ const q = a * RAD, Nq = m * (g * (3 * Math.cos(q) - 2) - v0 * v0 / R); pts.push([a, Nq]); }
    const nv = pts.map(q => q[1]);
    plot($('x4a-12-plot'), { xmin: 0, xmax: 90, ymin: Math.min(...nv) - 10, ymax: Math.max(10, ...nv) + 10, xlabel: 'angle on the hill θ (deg)', ylabel: 'N(θ) (N)', hlines: [{ y: 0 }],
      vlines: [{ x: st.thS / RAD, label: 'N = 0' }], bands: [{ x0: st.thS / RAD, x1: 90, color: 'rgba(166,30,77,0.08)' }],
      series: [{ pts, color: COL.c3, width: 2.4 }], points: onHill ? [{ x: st.th / RAD, y: N, color: COL.c3 }] : [] });
  }
});

/* =========================================================
   4.A.13  Arm CA turning at constant ω in a vertical plane; P rests on it at r = 3 ft until friction can no longer hold it.
   Held: f = m (g sin θ − r ω²), N = m g cos θ. Sliding: r̈ = r ω² − g sin θ + f/m, f = −μ_k N sign(ṙ), N = m (g cos θ + 2 ṙ ω).
   ========================================================= */
makeClip({
  id: 'x4a-13', speed: 0.5,
  controls: [
    { key: 'mus', label: 'Static friction μ_s', min: 0.4, max: 1.2, step: 0.01, value: 0.712, unit: '', dec: 3 },
    { key: 'muk', label: 'Kinetic friction μ_k (after slipping)', min: 0.1, max: 1, step: 0.01, value: 0.5, unit: '', dec: 2 },
    { key: 'om', label: 'Arm rate ω', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'rad/s', dec: 1 }
  ],
  reset(st){
    const V = st.V, g = GF, r = 3; st.r = r; st.rd = 0; st.slip = false; st.thSlip = null; st.done = ''; st.th = 0; st.hold = undefined;
    // first angle where |g sin θ − r ω²| = μ_s g cos θ
    let a = null; for (let q = 0; q < 89.9; q += 0.01){ const th = q * RAD, f = g * Math.sin(th) - r * V.om * V.om, N = g * Math.cos(th); if (Math.abs(f) > V.mus * N){ a = q; break; } }
    st.pred = a;
    setStats('x4a-13-stats', [['friction needed at θ = 53.13°, f/N', fmt((g * 0.8 - r * 4) / (g * 0.6), 4) + ' (book data)', true],
      ['predicted slip angle for this μ_s', a === null ? 'none below 90°' : fmt(a, 4) + '°', true], ['r ω²', fmt(r * V.om * V.om, 4) + ' ft/s²']]);
  },
  step(st, dt){
    const V = st.V, g = GF, n = Math.max(1, Math.ceil(dt / 1e-3)), h = dt / n;
    for (let i = 0; i < n && !st.done; i++){
      st.th += V.om * h;
      if (!st.slip){
        const f = g * Math.sin(st.th) - st.r * V.om * V.om, N = g * Math.cos(st.th);
        if (Math.abs(f) > V.mus * N){ st.slip = true; st.thSlip = st.th; }
      } else {
        const N = g * Math.cos(st.th) + 2 * st.rd * V.om;
        if (N <= 0){ st.done = 'P leaves the arm'; break; }
        const f = -V.muk * N * Math.sign(st.rd || -1), rdd = st.r * V.om * V.om - g * Math.sin(st.th) + f;
        st.rd += rdd * h; st.r += st.rd * h;
        if (st.r < 0.45){ st.r = 0.45; st.done = 'P reaches the pivot C'; }
      }
      if (st.th > 150 * RAD) st.done = 'stopped at 150°';
    }
    if (st.done){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.again = true; } }
  },
  setup(st, reset){ st._reset = reset; },
  draw(st){
    if (st.again){ st.again = false; st._reset(); }
    const cv = $('x4a-13-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 380]);
    const V = st.V, g = GF, S = 62, C = [270, 330], th = st.th, L = 4.4;
    const e = [Math.cos(th), -Math.sin(th)], n = [-Math.sin(th), -Math.cos(th)]; // along the arm, and the upward normal of its top face
    // ground pin and bracket
    pin(ctx, C[0], C[1], 30); txt(ctx, 'C', C[0] - 22, C[1] + 6);
    // arm
    ctx.save(); ctx.translate(C[0], C[1]); ctx.rotate(-th); ctx.fillStyle = '#6b6f78'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.fillRect(-6, 0, L * S + 6, 9); ctx.strokeRect(-6, 0, L * S + 6, 9); ctx.restore();
    pinDot(ctx, C[0], C[1]);
    const ax = C[0] + e[0] * L * S, ay = C[1] + e[1] * L * S; txt(ctx, 'A', ax + e[0] * 16, ay + e[1] * 16);
    // block P on the top face of the arm
    const bx = C[0] + e[0] * st.r * S, by = C[1] + e[1] * st.r * S;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-th); ctx.fillStyle = st.slip ? '#f2c9b8' : '#cfd8ea'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.fillRect(-13, -24, 26, 24); ctx.strokeRect(-13, -24, 26, 24); ctx.restore();
    const gx = bx + n[0] * 12, gy = by + n[1] * 12;
    txt(ctx, 'P', gx + n[0] * 30 - e[0] * 4, gy + n[1] * 30 - e[1] * 4);
    // ω arrow around C
    ccwArc(ctx, C[0], C[1], 46, th + 0.15, th + 0.95, COL.c4);
    txt(ctx, 'ω', C[0] + 60 * Math.cos(th + 0.5), C[1] - 60 * Math.sin(th + 0.5), { color: COL.c4 });
    // forces on P (per unit mass, drawn at 1.6 px per ft/s²)
    const k = 1.6; let N, f;
    if (!st.slip){ f = g * Math.sin(th) - st.r * V.om * V.om; N = g * Math.cos(th); }
    else if (!st.done){ N = g * Math.cos(th) + 2 * st.rd * V.om; f = -V.muk * N * Math.sign(st.rd || -1); }
    else { N = 0; f = 0; }
    farrow(ctx, gx, gy, 0, g * k, COL.c2, 'mg');
    if (N > 0.2) farrow(ctx, bx - e[0] * 4, by - e[1] * 4, n[0] * N * k, n[1] * N * k, COL.c3, 'N');
    if (Math.abs(f) > 0.2) farrow(ctx, bx, by, e[0] * f * k, e[1] * f * k, RED, 'f');
    line(ctx, C[0], C[1], C[0] + 150, C[1], COL.muted, 1, [4, 4]);
    txt(ctx, `θ = ${fmt(th / RAD, 3)}°`, 550, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, st.done || (st.slip ? `slipping since θ = ${fmt(st.thSlip / RAD, 3)}°` : 'P is held by static friction'), 550, 40, { font: '600 12px system-ui', color: st.slip ? RED : COL.c3, align: 'right' });
    // friction needed f/N while P is held at r = 3 ft
    const pts = []; for (let q = 0; q <= 80; q += 0.5){ const a = q * RAD; pts.push([q, (g * Math.sin(a) - 3 * V.om * V.om) / (g * Math.cos(a))]); }
    const fv = pts.map(q => q[1]);
    plot($('x4a-13-plot'), { xmin: 0, xmax: 80, ymin: Math.min(-V.mus, ...fv) - 0.2, ymax: Math.max(V.mus, ...fv) + 0.2, xlabel: 'arm angle θ (deg)', ylabel: 'friction needed f / N',
      hlines: [{ y: V.mus }, { y: -V.mus }, { y: 0 }], vlines: st.pred !== null ? [{ x: st.pred, label: 'slips' }] : [],
      series: [{ pts, color: RED, width: 2.4 }], points: !st.slip && th < 80 * RAD ? [{ x: th / RAD, y: (g * Math.sin(th) - 3 * V.om * V.om) / (g * Math.cos(th)), color: RED }] : [] });
  }
});

/* =========================================================
   4.A.14  Car on a banked circular turn (radius ρ, bank angle θ).
   N = m (g cos θ + (v²/ρ) sin θ), F = m ((v²/ρ) cos θ − g sin θ) with F positive down the slope (toward the center).
   ========================================================= */
makeClip({
  id: 'x4a-14', speed: 1,
  controls: [
    { key: 'v', label: 'Speed v', min: 0, max: 100, step: 0.5, value: 60.65, unit: 'm/s', dec: 2 },
    { key: 'th', label: 'Bank angle θ', min: 0, max: 60, step: 0.01, value: 36.87, unit: '°', dec: 2 }
  ],
  presets: C => [{ label: 'No friction needed (book)', apply: () => C.set({ v: Math.sqrt(G0 * 500 * Math.tan(C.v.th * RAD)) }) }, { label: 'Slow: friction acts up the slope', apply: () => C.set({ v: 30 }) }, { label: 'Fast: friction acts down the slope', apply: () => C.set({ v: 85 }) }],
  reset(st){
    const V = st.V, g = G0, rho = 500, c = Math.cos(V.th * RAD), s = Math.sin(V.th * RAD), an = V.v * V.v / rho;
    st.N = g * c + an * s; st.F = an * c - g * s; st.vd = Math.sqrt(g * rho * Math.tan(V.th * RAD));
    setStats('x4a-14-stats', [['speed with no friction, v = √(g ρ tan θ)', fmt(st.vd, 4) + ' m/s', true], ['a_n = v²/ρ', fmt(an, 4) + ' m/s²'],
      ['friction needed F/m', (Math.abs(st.F) < 5e-3 ? '0' : fmt(st.F, 4)) + ' m/s² ' + (Math.abs(st.F) < 5e-3 ? '(none)' : st.F > 0 ? '(down the slope)' : '(up the slope)')], ['least μ_s that holds the car', Math.abs(st.F) < 5e-3 ? '0' : fmt(Math.abs(st.F) / st.N, 4)]]);
  },
  draw(st){
    const cv = $('x4a-14-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 340, 600); fitView(ctx, w, h, nr ? [0, 0, 380, 620] : [0, 0, 760, 340]);
    const V = st.V, th = V.th * RAD, g = G0;
    // ---- section view (left): the bank rises toward the outside of the turn (to the left); the center of the turn is to the right
    const Q = [190, 210]; // car contact point on the bank
    const ux = Math.cos(th), uy = Math.sin(th); // direction down the slope toward the center, in screen (x right, y down)
    const base = [Q[0] - ux * 150, Q[1] - uy * 150], foot = [Q[0] + ux * 120, Q[1] + uy * 120];
    ctx.save(); ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(foot[0], foot[1]); ctx.lineTo(foot[0], 320); ctx.lineTo(base[0], 320); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, foot[0], foot[1], foot[0] - 90, foot[1], COL.muted, 1, [4, 4]);
    txt(ctx, 'θ', foot[0] - 40, foot[1] - 10, { color: COL.muted });
    // car (cross-section), wheels on the bank
    ctx.save(); ctx.translate(Q[0], Q[1]); ctx.rotate(th); ctx.fillStyle = '#f2d26b'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
    ctx.fillRect(-34, -48, 68, 36); ctx.strokeRect(-34, -48, 68, 36); ctx.fillStyle = '#2b2f38'; ctx.fillRect(-30, -12, 14, 12); ctx.fillRect(16, -12, 14, 12); ctx.restore();
    const G = [Q[0] + Math.sin(th) * 30, Q[1] - Math.cos(th) * 30];
    dot(ctx, G[0], G[1], 3.5); txt(ctx, 'C', G[0] - 46 * Math.cos(th) - 10, G[1] - 46 * Math.sin(th) - 10);
    // forces per unit mass (4 px per m/s²): mg, N normal to the bank, F along the bank; resultant m v²/ρ toward the center
    const k = 6.5, an = V.v * V.v / 500, Nn = st.N, Ff = st.F;
    farrow(ctx, G[0], G[1], 0, g * k, COL.c2, 'mg');
    farrow(ctx, Q[0], Q[1], Math.sin(th) * Nn * k, -Math.cos(th) * Nn * k, COL.c3, 'N', { dx: -12 });
    if (Math.abs(Ff) * k > 3) farrow(ctx, Q[0], Q[1] + 4, ux * Ff * k, uy * Ff * k, RED, 'F');
    if (an * k > 3){ ctx.save(); ctx.setLineDash([5, 4]); farrow(ctx, G[0], G[1], an * k, 0, COL.c1, 'ma_n', { dy: -10 }); ctx.restore(); }
    txt(ctx, 'to the center of the turn →', 360, 330, { font: '11px system-ui', color: COL.muted, align: 'right' });
    // ---- top view (right): the car drives around the circle of radius ρ = 500 m
    const T0 = nr ? [190, 470] : [570, 170], Rt = 130, ph = (V.v / 500) * st.t * 6; // time sped up 6 times
    ctx.save(); ctx.strokeStyle = '#b9b4a6'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(T0[0], T0[1], Rt, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, T0[0] - 5, T0[1], T0[0] + 5, T0[1], COL.fg, 1.4); line(ctx, T0[0], T0[1] - 5, T0[0], T0[1] + 5, COL.fg, 1.4);
    const cx = T0[0] - Rt * Math.cos(ph), cy = T0[1] + Rt * Math.sin(ph);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ph); ctx.fillStyle = '#f2d26b'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.fillRect(-7, -12, 14, 24); ctx.strokeRect(-7, -12, 14, 24); ctx.restore();
    const vx = Math.sin(ph), vy = Math.cos(ph); // counterclockwise travel
    if (V.v > 0.5) farrow(ctx, cx, cy, vx * 40, vy * 40, COL.fg, 'v');
    farrow(ctx, cx, cy, (T0[0] - cx) / Rt * 36, (T0[1] - cy) / Rt * 36, COL.c1, 'e_n');
    txt(ctx, 'top view', T0[0], T0[1] + Rt + 26, { font: '600 12px system-ui', color: COL.muted });
    txt(ctx, 'ρ', T0[0] + Rt * 0.5 * Math.cos(ph + 1.2), T0[1] - Rt * 0.5 * Math.sin(ph + 1.2));
    line(ctx, T0[0], T0[1], T0[0] + Rt * Math.cos(ph + 1.2), T0[1] - Rt * Math.sin(ph + 1.2), COL.muted, 1, [3, 3]);
    // friction needed versus speed
    const pts = []; for (let v = 0; v <= 100; v += 1){ const a = v * v / 500; pts.push([v, a * Math.cos(th) - g * Math.sin(th)]); }
    plot($('x4a-14-plot'), { xmin: 0, xmax: 100, ymin: -g * Math.sin(th) - 1, ymax: 20 * Math.cos(th) - g * Math.sin(th) + 1, xlabel: 'speed v (m/s)', ylabel: 'F/m (m/s², down the slope +)', hlines: [{ y: 0 }],
      vlines: [{ x: st.vd, label: 'no friction' }], series: [{ pts, color: RED, width: 2.4 }], points: [{ x: V.v, y: Ff, color: RED }] });
  }
});

/* =========================================================
   4.A.15  Conical pendulum: P on a cable of length L moves on a horizontal circle of radius r = L sin β.
   tan β = v²/(g r), T = m g / cos β. Given L and v, solve v² = g L sin β tan β for β.
   ========================================================= */
function coneBeta(L, v){ let a = 1e-6, b = Math.PI / 2 - 1e-6; for (let i = 0; i < 80; i++){ const c = (a + b) / 2; (G0 * L * Math.sin(c) * Math.tan(c) < v * v) ? a = c : b = c; } return (a + b) / 2; }
makeClip({
  id: 'x4a-15', speed: 0.5,
  controls: [
    { key: 'L', label: 'Cable length L', min: 0.5, max: 2, step: 0.05, value: 1, unit: 'm', dec: 2 },
    { key: 'v', label: 'Speed v', min: 0.3, max: 6, step: 0.01, value: 1.68, unit: 'm/s', dec: 2 }
  ],
  reset(st){
    const V = st.V, m = 0.5; st.b = coneBeta(V.L, V.v); st.r = V.L * Math.sin(st.b); st.h = V.L * Math.cos(st.b);
    setStats('x4a-15-stats', [['β (from tan β = v²/(g r))', fmt(st.b / RAD, 4) + '°', true], ['r = L sin β', fmt(st.r, 4) + ' m'], ['h = L cos β', fmt(st.h, 4) + ' m'],
      ['T = m g / cos β (m = 0.5 kg)', fmt(m * G0 / Math.cos(st.b), 4) + ' N'], ['time for one turn', fmt(2 * Math.PI * st.r / V.v, 4) + ' s']]);
  },
  draw(st){
    const cv = $('x4a-15-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [80, 0, 500, 320]);
    const V = st.V, S = 190 / Math.max(1, V.L), O = [290, 40], ph = (V.v / st.r) * st.t, b = st.b;
    // ceiling and the fixed support
    line(ctx, O[0] - 70, O[1] - 14, O[0] + 70, O[1] - 14, COL.fg, 2); hatch(ctx, O[0] + 70, O[1] - 14, O[0] - 70, O[1] - 14, 1);
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(O[0] - 12, O[1] - 14); ctx.lineTo(O[0] + 12, O[1] - 14); ctx.lineTo(O[0], O[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    pinDot(ctx, O[0], O[1]); txt(ctx, 'O', O[0] - 20, O[1] + 2);
    // circle of P seen slightly from above (ellipse) and the axis
    const cy = O[1] + st.h * S, rx = st.r * S, ry = rx * 0.28;
    line(ctx, O[0], O[1], O[0], cy, COL.muted, 1.2, [4, 4]);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.ellipse(O[0], cy, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    const px = O[0] + rx * Math.cos(ph), py = cy + ry * Math.sin(ph), front = Math.sin(ph) > 0;
    line(ctx, O[0], cy, px, py, COL.muted, 1.2);
    line(ctx, O[0], O[1], px, py, COL.fg, 2.6);
    ctx.save(); ctx.fillStyle = front ? '#9aa0a8' : '#c9cdd3'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, front ? 11 : 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px + (Math.cos(ph) >= 0 ? 22 : -22), py + 18);
    // β at O, h and r
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(O[0], O[1], 40, Math.PI / 2 - b, Math.PI / 2, false); ctx.stroke(); ctx.restore();
    txt(ctx, 'β', O[0] + 52 * Math.sin(b / 2) + 4, O[1] + 52 * Math.cos(b / 2) + 4, { color: COL.c4 });
    txt(ctx, 'h', O[0] + (Math.cos(ph) < 0 ? 16 : -16), (O[1] + cy) / 2 + 18, { color: COL.muted });
    // forces on P (drawn on the side view at its current place): T along the cable toward O, and mg
    const m = 0.5, T = m * G0 / Math.cos(b), k = 9;
    const dx = O[0] - px, dy = O[1] - py, dl = Math.hypot(dx, dy);
    const sg = px >= O[0] ? 1 : -1; // put the label on the outer side of the cable
    farrow(ctx, px, py, dx / dl * T * k, dy / dl * T * k, RED, 'T', { dx: sg * Math.abs(dy / dl) * 16, dy: -sg * (dx / dl) * 16 * Math.sign(dy / dl || 1) * 0 });
    farrow(ctx, px, py, 0, m * G0 * k, COL.c2, 'mg');
    txt(ctx, `β = ${fmt(b / RAD, 3)}°`, 495, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
    // β as a function of speed for this cable length
    const pts = []; for (let v = 0.05; v <= 6; v += 0.05) pts.push([v, coneBeta(V.L, v) / RAD]);
    plot($('x4a-15-plot'), { xmin: 0, xmax: 6, ymin: 0, ymax: 90, xlabel: 'speed v (m/s)', ylabel: 'cable angle β (deg)', series: [{ pts, color: COL.c4, width: 2.4 }], points: [{ x: V.v, y: b / RAD, color: COL.c4 }] });
  }
});

subLabels();
})();
