/* =========================================================
   Chapter 1, Section C examples (joint description of motion): 1.C.1 to 1.C.4
   Each clip stores its current point, velocity and acceleration in st.cur so the 3D view can draw the same motion.
   ========================================================= */
(function(){
const TAU = 2 * Math.PI;
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const nrm = a => Math.hypot(a[0], a[1]);
const FONT = 'italic 15px Georgia, serif', SMALL = '12px system-ui, sans-serif';
// arrow from (x, y) along screen vector (dx, dy); label placed beyond the head
// side = ±1 puts the label beside the head instead of beyond it (for arrows that lie along another line)
function varrow(ctx, x, y, dx, dy, col, label, wd = 3, dash, side = 0){
  const L = Math.hypot(dx, dy); if (L < 3) return;
  ctx.save(); if (dash) ctx.setLineDash(dash); arrow(ctx, x, y, x + dx, y + dy, col, wd); ctx.restore();
  if (!label) return;
  const ux = dx / L, uy = dy / L;
  if (side) txt(ctx, label, x + dx - ux * 6 - uy * 21 * side, y + dy - uy * 6 + ux * 21 * side, { color: col, font: FONT });
  else txt(ctx, label, x + dx + ux * 14, y + dy + uy * 12, { color: col, font: FONT });
}
// side of a screen vector (dx, dy) on which the screen vector (px, py) lies: +1 or −1
const qa = th => { let q = Math.min(th / 2, 2.4); if (Math.abs(q - Math.PI / 2) < 0.4) q = q < Math.PI / 2 ? Math.PI / 2 - 0.4 : Math.PI / 2 + 0.4; return q; };
const sideOf = (dx, dy, px, py) => (-dy * px + dx * py) >= 0 ? 1 : -1;
function holdChips(st, label, setFn){ return [{ label, apply: () => { setFn(); st.hold = true; } }, { label: '▶ Keep moving', apply: () => { st.hold = false; } }]; }
function rk4(f, s, h){ const k1 = f(s), k2 = f(s.map((x, i) => x + h / 2 * k1[i])), k3 = f(s.map((x, i) => x + h / 2 * k2[i])), k4 = f(s.map((x, i) => x + h * k3[i]));
  return s.map((x, i) => x + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); }
function caption(ctx, s, x, y, col = COL.muted, align = 'left'){ txt(ctx, s, x, y, { font: SMALL, color: col, align }); }
function dashedPath(ctx, pts, col, wd = 1.5, dash = [6, 5], alpha = 0.6){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = alpha; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
}
function angleArc(ctx, x, y, r, a0, a1, col = COL.muted){ // screen angles (rad, y down)
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, r, a0, a1, a1 < a0); ctx.stroke(); ctx.restore();
}

/* ---------- 1.C.1: rocket under thrust and gravity ----------
   The rocket points along its velocity, so a = a_T ê_t − g ĵ. The trajectory is integrated forward and backward
   from the instant in the problem (τ = 0), where the axis makes θ with the vertical. */
makeClip({
  id: 'x1c-1', speed: 1,
  controls: [
    { key: 'th', label: 'Angle θ from the vertical at τ = 0', min: 5, max: 85, step: 0.01, value: 36.87, unit: '°', dec: 2 },
    { key: 'aT', label: 'Thrust acceleration a_T', min: 0, max: 60, step: 0.1, value: 29.3, unit: 'ft/s²', dec: 2 },
    { key: 'g', label: 'Gravity g', min: 5, max: 40, step: 0.1, value: 26.5, unit: 'ft/s²', dec: 2 },
    { key: 'v', label: 'Speed v at τ = 0', min: 1000, max: 5000, step: 10, value: 2800, unit: 'ft/s', dec: 1 }
  ],
  presets: (C, st) => holdChips(st, '⏸ Stop at the instant in the problem (τ = 0)', () => { st.tau = 0; }),
  reset(st){
    const V = st.V, t0 = V.th * Math.PI / 180, T = 120, h = 0.5;
    const f = s => { const sp = Math.hypot(s[2], s[3]) || 1; return [s[2], s[3], V.aT * s[2] / sp, V.aT * s[3] / sp - V.g]; };
    const s0 = [0, 0, V.v * Math.sin(t0), V.v * Math.cos(t0)];
    const fw = [s0], bw = [s0]; let s = s0;
    for (let k = 0; k < T / h; k++){ s = rk4(f, s, h); fw.push(s); }
    s = s0; for (let k = 0; k < T / h; k++){ s = rk4(f, s, -h); bw.push(s); }
    st.path = bw.reverse().concat(fw.slice(1)); st.h = h; st.T = T;   // index i ↔ τ = −T + i h
    // speed and radius of curvature along the path (for the plots)
    st.sp = st.path.map((q, i) => { const v = [q[2], q[3]], a = f(q).slice(2), sp = nrm(v), et = [v[0] / sp, v[1] / sp];
      const at = dot2(a, et), an = Math.abs(a[0] * et[1] - a[1] * et[0]); return [-T + i * h, sp, at, an, sp * sp / an]; });
    if (st.tau === undefined) st.tau = -T; st.last = 0; st.hold = st.hold ?? false;
  },
  step(st){ const dt = st.t - st.last; st.last = st.t; if (!st.hold){ st.tau += dt * 30; if (st.tau > st.T){ st.tau = -st.T; } } },
  draw(st){
    const cv = $('x1c-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const narrow = nar(cv, w, 440, 720); const BB = narrow ? [0, 0, 460, 720] : [0, 0, 760, 440]; fitView(ctx, w, h, BB);
    const V = st.V, path = st.path, i = clamp(Math.round((st.tau + st.T) / st.h), 0, path.length - 1), q = path[i];
    const vel = [q[2], q[3]], sp = nrm(vel), et = [vel[0] / sp, vel[1] / sp], g = V.g;
    const a = [V.aT * et[0], V.aT * et[1] - g], at = dot2(a, et), cr = a[0] * et[1] - a[1] * et[0];   // cr > 0: bends clockwise (to the right of travel)
    const en = cr >= 0 ? [et[1], -et[0]] : [-et[1], et[0]], an = Math.abs(cr), rho = sp * sp / an;
    st.cur = { p: [q[0], q[1]], v: vel, a, et, en, rho, at, an, tau: st.tau };
    // ---------- panel 1: the trajectory (equal scales, y up) ----------
    const P1 = narrow ? [10, 10, 450, 410] : [10, 10, 470, 430];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; path.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    const pad = 28, S = Math.min((P1[2] - P1[0] - 2 * pad) / (x1 - x0), (P1[3] - P1[1] - 2 * pad) / (y1 - y0));
    const cx = (P1[0] + P1[2]) / 2 - S * (x0 + x1) / 2, cy = (P1[1] + P1[3]) / 2 + S * (y0 + y1) / 2, M = p => [cx + S * p[0], cy - S * p[1]];
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.strokeRect(P1[0], P1[1], P1[2] - P1[0], P1[3] - P1[1]); ctx.restore();
    // osculating circle at the current point (clipped to the panel)
    const C = [q[0] + rho * en[0], q[1] + rho * en[1]], [ccx, ccy] = M(C);
    ctx.save(); ctx.beginPath(); ctx.rect(P1[0], P1[1], P1[2] - P1[0], P1[3] - P1[1]); ctx.clip();
    ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ccx, ccy, rho * S, 0, TAU); ctx.stroke(); ctx.restore();
    dashedPath(ctx, path.map(M), COL.axis, 1.5, [6, 5], 0.8);
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.lineWidth = 2.4; ctx.beginPath(); path.slice(0, i + 1).forEach((p, k) => { const m = M(p); k ? ctx.lineTo(...m) : ctx.moveTo(...m); }); ctx.stroke(); ctx.restore();
    const i0 = Math.round(st.T / st.h), m0 = M(path[i0]); ctx.save(); ctx.fillStyle = COL.muted; ctx.beginPath(); ctx.arc(m0[0], m0[1], 3.5, 0, TAU); ctx.fill(); ctx.restore();
    caption(ctx, 'τ = 0', m0[0] + 8, m0[1] + 14);
    // rocket glyph (fixed size) pointing along ê_t, with a flickering plume
    const [rx, ry] = M(q), ang = Math.atan2(-et[1], et[0]);
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(ang); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(10, -5); ctx.lineTo(-14, -5); ctx.lineTo(-14, 5); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-24 - 4 * Math.sin(performance.now() / 60), 0); ctx.lineTo(-14, 4); ctx.fill(); ctx.restore();
    // unit vectors at the rocket, and the direction to the center of curvature
    varrow(ctx, rx, ry, 46 * et[0], -46 * et[1], COL.c2, 'ê_t', 2.4, null, -sideOf(et[0], -et[1], en[0], -en[1]));
    varrow(ctx, rx, ry, 46 * en[0], -46 * en[1], COL.c4, 'ê_n', 2.4);
    // scale bar
    const bar = 50000, bl = bar * S, by = P1[3] - 14; line(ctx, P1[2] - 14 - bl, by, P1[2] - 14, by, COL.muted, 2);
    caption(ctx, '50 000 ft', P1[2] - 20 - bl, by + 4, COL.muted, 'right');
    caption(ctx, `τ = ${fmt(st.tau, 3)} s`, P1[2] - 8, P1[1] + 16, COL.muted, 'right');
    caption(ctx, 'dashed circle: osculating circle (radius ρ)', P1[0] + 10, P1[1] + 16, COL.c4);
    // ---------- panel 2: the acceleration at this instant ----------
    const P2 = narrow ? [10, 420, 450, 710] : [480, 10, 750, 430];
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.strokeRect(P2[0], P2[1], P2[2] - P2[0], P2[3] - P2[1]); ctx.restore();
    const ox = (P2[0] + P2[2]) / 2 - 10, oy = (P2[1] + P2[3]) / 2 + 10, k = 105 / Math.max(V.aT, g, 1);
    caption(ctx, 'Accelerations at this instant', P2[0] + 10, P2[1] + 16);
    line(ctx, ox, oy, ox, oy - 120, COL.axis, 1, [4, 3]);
    const thc = Math.atan2(et[0], et[1]); angleArc(ctx, ox, oy, 54, -Math.PI / 2, -Math.PI / 2 + thc);
    txt(ctx, 'θ', ox + 66 * Math.sin(thc / 2), oy - 66 * Math.cos(thc / 2), { color: COL.muted, font: FONT });
    varrow(ctx, ox, oy, k * V.aT * et[0], -k * V.aT * et[1], COL.c3, 'a_T', 3);
    varrow(ctx, ox, oy, 0, k * g, COL.c3, 'g', 3);
    varrow(ctx, ox, oy, k * at * et[0], -k * at * et[1], RED, 'a_t', 2, [5, 4], -sideOf(et[0], -et[1], en[0], -en[1]));
    varrow(ctx, ox, oy, k * an * en[0], -k * an * en[1], RED, 'a_n', 2, [5, 4]);
    varrow(ctx, ox, oy, k * a[0], -k * a[1], RED, 'a', 3.4);
    ctx.save(); ctx.strokeStyle = RED; ctx.globalAlpha = 0.5; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox + k * a[0], oy - k * a[1]); ctx.lineTo(ox + k * at * et[0], oy - k * at * et[1]); ctx.moveTo(ox + k * a[0], oy - k * a[1]); ctx.lineTo(ox + k * an * en[0], oy - k * an * en[1]); ctx.stroke(); ctx.restore();
    caption(ctx, 'green: given   red: total a and its parts', P2[0] + 10, P2[3] - 12);
    const sp0 = st.sp;
    statsEvery(st, 'x1c-1-stats', () => [['τ', fmt(st.tau, 3) + ' s'], ['θ', fmt(thc * 180 / Math.PI, 4) + '°'], ['speed v', fmt(sp, 4) + ' ft/s'],
      ['v̇ = a_T − g cos θ', fmt(at, 4) + ' ft/s²', true], ['a_n = g sin θ', fmt(an, 4) + ' ft/s²'], ['ρ = v² / a_n', Math.round(rho).toLocaleString('en-US') + ' ft', true]], 0.1);
    const pv = sp0.map(r => [r[0], r[1]]), pr = sp0.map(r => [r[0], r[4] / 1000]);
    const vmin = Math.min(...pv.map(p => p[1])), vmax = Math.max(...pv.map(p => p[1])), rmin = Math.min(...pr.map(p => p[1])), rmax = Math.max(...pr.map(p => p[1]));
    const s0 = sp0[i0], tan = [[-st.T, s0[1] - s0[2] * st.T], [st.T, s0[1] + s0[2] * st.T]];
    plot($('x1c-1-plot'), { xmin: -st.T, xmax: st.T, ymin: vmin - 0.08 * (vmax - vmin + 1), ymax: vmax + 0.08 * (vmax - vmin + 1), xlabel: 'time τ (s)', ylabel: 'speed v (ft/s)',
      series: [{ pts: pv, color: COL.c1, width: 2.2 }, { pts: tan, color: COL.muted, width: 1.2, dash: [5, 4], guide: true }], vlines: [{ x: 0, color: COL.axis }], points: [{ x: st.tau, y: sp, color: COL.c2, r: 5 }] });
    plot($('x1c-1-plot2'), { xmin: -st.T, xmax: st.T, ymin: Math.max(0, rmin - 0.1 * (rmax - rmin + 1)), ymax: rmax + 0.1 * (rmax - rmin + 1), xlabel: 'time τ (s)', ylabel: 'ρ (1000 ft)',
      series: [{ pts: pr, color: COL.c4, width: 2.2 }], vlines: [{ x: 0, color: COL.axis }], points: [{ x: st.tau, y: rho / 1000, color: COL.c4, r: 5 }] });
  }
});

/* ---------- 1.C.2: pin P driven by two slotted guides ----------
   Guide A (vertical slot) moves horizontally, so x_P = x_A. Guide B (horizontal slot) moves vertically, so y_P = y_B.
   x_P = v_A t + ½ v̇_A t²,  y_P = −(v_B t + ½ v̇_B t²)   (t = 0 is the instant in the problem, B moves down) */
makeClip({
  id: 'x1c-2', speed: 0.25,
  controls: [
    { key: 'vA', label: 'Speed of guide A, v_A (right +)', min: -0.4, max: 0.4, step: 0.01, value: 0.2, unit: 'm/s', dec: 3 },
    { key: 'aA', label: 'Rate v̇_A', min: -1.5, max: 1.5, step: 0.05, value: 0.75, unit: 'm/s²', dec: 3 },
    { key: 'vB', label: 'Speed of guide B, v_B (down +)', min: -0.4, max: 0.4, step: 0.01, value: 0.15, unit: 'm/s', dec: 3 },
    { key: 'aB', label: 'Rate v̇_B', min: -1.5, max: 1.5, step: 0.05, value: 0, unit: 'm/s²', dec: 3 }
  ],
  presets: (C, st) => holdChips(st, '⏸ Stop at the instant in the problem (t = 0)', () => { st.tt = 0; }),
  reset(st){
    const V = st.V, X = t => V.vA * t + 0.5 * V.aA * t * t, Y = t => -(V.vB * t + 0.5 * V.aB * t * t), L = 0.15;
    let t1 = 0, t2 = 0; while (t2 < 0.8 && Math.abs(X(t2 + 0.01)) < L && Math.abs(Y(t2 + 0.01)) < L) t2 += 0.01;
    while (t1 > -0.8 && Math.abs(X(t1 - 0.01)) < L && Math.abs(Y(t1 - 0.01)) < L) t1 -= 0.01;
    st.t1 = t1; st.t2 = t2; st.X = X; st.Y = Y; if (st.tt === undefined || !st.hold) st.tt = t1; st.last = 0;
    st.trace = []; for (let k = 0; k <= 120; k++){ const t = t1 + (t2 - t1) * k / 120; st.trace.push([t, X(t), Y(t)]); }
    st.spd = st.trace.map(([t]) => [t, Math.hypot(V.vA + V.aA * t, V.vB + V.aB * t)]);
  },
  step(st){ const dt = st.t - st.last; st.last = st.t; if (!st.hold){ st.tt += dt; if (st.tt > st.t2 + 0.25) st.tt = st.t1; } },
  draw(st){
    const cv = $('x1c-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h); fitView(ctx, w, h, [0, 0, 560, 470]);
    const V = st.V, t = clamp(st.tt, st.t1, st.t2), S = 900, ox = 280, oy = 225, M = (x, y) => [ox + S * x, oy - S * y];
    const x = st.X(t), y = st.Y(t), v = [V.vA + V.aA * t, -(V.vB + V.aB * t)], a = [V.aA, -V.aB], sp = nrm(v);
    const et = sp > 1e-9 ? [v[0] / sp, v[1] / sp] : [1, 0], vd = dot2(a, et), cr = a[0] * et[1] - a[1] * et[0], an = Math.abs(cr);
    const en = cr >= 0 ? [et[1], -et[0]] : [-et[1], et[0]], rho = an > 1e-9 ? sp * sp / an : Infinity;
    st.cur = { p: [x, y], v, a, et, en, rho, t };
    // fixed frame: bottom rail for guide A, two side rails for guide B (all fixed to the ground)
    const yR = oy + 0.215 * S, xL = ox - 0.245 * S, xRr = ox + 0.245 * S;
    line(ctx, ox - 0.25 * S, yR, ox + 0.25 * S, yR, COL.fg, 3); hatch(ctx, ox + 0.25 * S, yR + 14, ox - 0.25 * S, yR + 14, -1, 9, 6);
    [ox - 0.22 * S, ox + 0.22 * S].forEach(px => { line(ctx, px, yR, px, yR + 14, COL.fg, 3); });
    [xL, xRr].forEach(px => { line(ctx, px, oy - 0.2 * S, px, oy + 0.2 * S, COL.fg, 3);
      line(ctx, px - 16, oy - 0.2 * S, px + 16, oy - 0.2 * S, COL.fg, 2.5); hatch(ctx, px - 16, oy - 0.2 * S, px + 16, oy - 0.2 * S, -1, 7, 6);
      line(ctx, px - 16, oy + 0.2 * S, px + 16, oy + 0.2 * S, COL.fg, 2.5); hatch(ctx, px + 16, oy + 0.2 * S, px - 16, oy + 0.2 * S, 1, 7, 6); });
    // guide B: horizontal slotted bar at y = y_P, sliding on the two side rails
    const [, gy] = M(0, y);
    ctx.save(); ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.fillRect(xL - 10, gy - 14, xRr - xL + 20, 28); ctx.strokeRect(xL - 10, gy - 14, xRr - xL + 20, 28);
    ctx.fillStyle = COL.card; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(xL + 18, gy - 5, xRr - xL - 36, 10, 5) : ctx.rect(xL + 18, gy - 5, xRr - xL - 36, 10); ctx.fill(); ctx.stroke(); ctx.restore();
    [xL, xRr].forEach(px => { ctx.save(); ctx.fillStyle = '#bfb9aa'; ctx.strokeStyle = COL.fg; ctx.fillRect(px - 9, gy - 18, 18, 36); ctx.strokeRect(px - 9, gy - 18, 18, 36); ctx.restore(); });
    txt(ctx, 'B', xL + 26, gy - 26, { font: 'italic bold 15px Georgia, serif' });
    // guide A: vertical slotted bar at x = x_P, on a carriage that runs along the bottom rail
    const [gx] = M(x, 0);
    ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = '#e9e1c8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6;
    ctx.fillRect(gx - 14, oy - 0.2 * S, 28, 0.2 * S + (yR - oy) - 10); ctx.strokeRect(gx - 14, oy - 0.2 * S, 28, 0.2 * S + (yR - oy) - 10);
    ctx.fillStyle = COL.card; ctx.fillRect(gx - 5, oy - 0.19 * S, 10, 0.38 * S); ctx.strokeRect(gx - 5, oy - 0.19 * S, 10, 0.38 * S);
    ctx.globalAlpha = 1; ctx.fillStyle = '#bfb9aa'; ctx.fillRect(gx - 26, yR - 18, 52, 14); ctx.strokeRect(gx - 26, yR - 18, 52, 14); ctx.restore();
    wheel(ctx, gx - 15, yR - 4, 4, 0); wheel(ctx, gx + 15, yR - 4, 4, 0);
    txt(ctx, 'A', gx + 34, yR - 26, { font: 'italic bold 15px Georgia, serif' });
    // path of P and the osculating circle at the current point
    dashedPath(ctx, st.trace.map(q => M(q[1], q[2])), COL.axis, 1.5, [5, 4], 0.9);
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.lineWidth = 2.4; ctx.beginPath(); st.trace.filter(q => q[0] <= t).forEach((q, k) => { const m = M(q[1], q[2]); k ? ctx.lineTo(...m) : ctx.moveTo(...m); }); ctx.stroke(); ctx.restore();
    const [px, py] = M(x, y);
    if (isFinite(rho) && rho < 2){ const [ccx, ccy] = M(x + rho * en[0], y + rho * en[1]);
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(ccx, ccy, rho * S, 0, TAU); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = COL.c4; ctx.beginPath(); ctx.arc(ccx, ccy, 3, 0, TAU); ctx.fill(); ctx.restore(); }
    // the pin, with v, a and the path components of a
    const kv = 400, ka = 110;
    varrow(ctx, px, py, kv * v[0], -kv * v[1], COL.c2, 'v_P', 3);
    varrow(ctx, px, py, ka * vd * et[0], -ka * vd * et[1], RED, 'a_t', 2, [5, 4], -sideOf(et[0], -et[1], en[0], -en[1]));
    varrow(ctx, px, py, ka * an * en[0], -ka * an * en[1], RED, 'a_n', 2, [5, 4]);
    varrow(ctx, px, py, ka * a[0], -ka * a[1], RED, 'a_P', 3.2);
    ctx.save(); ctx.fillStyle = COL.c1; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px - 16, py - 14, { font: 'italic bold 15px Georgia, serif', color: COL.c1 });
    caption(ctx, `t = ${fmt(t, 3)} s`, 552, 18, COL.muted, 'right');
    if (st.hold) caption(ctx, 'held at the instant in the problem', 8, 18, COL.c2);
    statsEvery(st, 'x1c-2-stats', () => [['v_P = (v_A, −v_B)', `(${fmt(v[0], 3)}, ${fmt(v[1], 3)}) m/s`], ['speed v', fmt(sp, 4) + ' m/s'],
      ['v̇ = a · ê_t', fmt(vd, 4) + ' m/s²', true], ['a_n = |a × ê_t|', fmt(an, 4) + ' m/s²'], ['ρ = v² / a_n', isFinite(rho) ? fmt(rho, 4) + ' m' : '∞', true]], 0.08);
    const ys = st.spd.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), sp0 = Math.hypot(V.vA, V.vB), vd0 = (V.vA * V.aA + V.vB * V.aB) / (sp0 || 1);
    plot($('x1c-2-plot'), { xmin: st.t1, xmax: st.t2, ymin: Math.max(0, lo - 0.1 * (hi - lo + 0.02)), ymax: hi + 0.1 * (hi - lo + 0.02), xlabel: 'time t (s)', ylabel: 'speed of P (m/s)',
      series: [{ pts: st.spd, color: COL.c1, width: 2.2 }, { pts: [[st.t1, sp0 + vd0 * st.t1], [st.t2, sp0 + vd0 * st.t2]], color: COL.muted, width: 1.2, dash: [5, 4], guide: true }],
      vlines: [{ x: 0, color: COL.axis }], points: [{ x: t, y: sp, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 1.C.3: spiral r = 4 + 2θ with constant θ̇ ---------- */
makeClip({
  id: 'x1c-3', speed: 0.5,
  controls: [{ key: 'w', label: 'Angular rate θ̇ (constant)', min: 1, max: 5, step: 0.1, value: 3, unit: 'rad/s', dec: 2 }],
  presets: (C, st) => holdChips(st, '⏸ Stop at θ = π (the instant in the problem)', () => { st.th = Math.PI; }),
  reset(st){ st.th = st.hold ? Math.PI : 0; st.last = 0; st.pause = 0; },
  step(st){ const dt = st.t - st.last; st.last = st.t; if (st.hold) return;
    if (st.th >= TAU){ st.pause += dt; if (st.pause > 0.5){ st.th = 0; st.pause = 0; } return; }
    st.th = Math.min(TAU, st.th + st.V.w * dt); },
  draw(st){
    const cv = $('x1c-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const narrow = nar(cv, w, 440, 600); fitView(ctx, w, h, narrow ? [0, 0, 460, 600] : [0, 0, 640, 440]);
    const wd = st.V.w, th = st.th, r = 4 + 2 * th, rd = 2 * wd, er = [Math.cos(th), Math.sin(th)], ee = [-Math.sin(th), Math.cos(th)];
    const vr = rd, vt = r * wd, ar = -r * wd * wd, at = 2 * rd * wd, v = [vr * er[0] + vt * ee[0], vr * er[1] + vt * ee[1]], a = [ar * er[0] + at * ee[0], ar * er[1] + at * ee[1]];
    const sp = Math.hypot(vr, vt), vdot = (vr * ar + vt * at) / sp;
    st.cur = { th, r, p: [r * er[0], r * er[1]], v, a, er, ee, vr, vt, ar, at };
    const S = 11.5, ox = narrow ? 230 : 300, oy = narrow ? 215 : 222, M = (x, y) => [ox + S * x, oy - S * y];
    // axes and the full spiral (θ from 0 to 2π)
    line(ctx, ox - 205, oy, ox + 205, oy, COL.axis, 1.2); line(ctx, ox, oy - 205, ox, oy + 205, COL.axis, 1.2);
    txt(ctx, 'x', ox + 214, oy + 4, { font: 'italic 13px Georgia, serif', color: COL.muted }); txt(ctx, 'y', ox + 4, oy - 212, { font: 'italic 13px Georgia, serif', color: COL.muted, align: 'left' });
    const sp0 = [], sp1 = []; for (let k = 0; k <= 200; k++){ const q = TAU * k / 200, rr = 4 + 2 * q, m = M(rr * Math.cos(q), rr * Math.sin(q)); sp0.push(m); if (q <= th) sp1.push(m); }
    dashedPath(ctx, sp0, COL.axis, 1.4, [5, 4], 0.9);
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.lineWidth = 2.4; ctx.beginPath(); sp1.forEach((m, k) => k ? ctx.lineTo(...m) : ctx.moveTo(...m)); ctx.stroke(); ctx.restore();
    const [px, py] = M(r * er[0], r * er[1]);
    line(ctx, ox, oy, px, py, COL.muted, 1.4, [4, 3]); txt(ctx, 'r', (ox + px) / 2 - 17 * ee[0], (oy + py) / 2 + 17 * ee[1], { font: FONT, color: COL.muted });
    angleArc(ctx, ox, oy, 30, 0, -th); if (th > 0.7) txt(ctx, 'θ', ox + 20 * Math.cos(qa(th)), oy - 20 * Math.sin(qa(th)), { font: '13px Georgia, serif', color: COL.muted });
    ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, TAU); ctx.fill(); ctx.restore(); txt(ctx, 'O', ox - 12, oy + 14, { font: 'italic 13px Georgia, serif' });
    const kv = 2.0, ka = 0.6;
    varrow(ctx, px, py, 34 * er[0], -34 * er[1], COL.muted, 'ê_r', 1.8, null, -sideOf(er[0], -er[1], ee[0], -ee[1]));
    varrow(ctx, px, py, 34 * ee[0], -34 * ee[1], COL.muted, 'ê_{θ}', 1.8, null, -sideOf(ee[0], -ee[1], er[0], -er[1]));
    varrow(ctx, px, py, kv * v[0], -kv * v[1], COL.c2, 'v', 3);
    varrow(ctx, px, py, ka * ar * er[0], -ka * ar * er[1], RED, 'a_r', 2, [5, 4]);
    varrow(ctx, px, py, ka * at * ee[0], -ka * at * ee[1], RED, 'a_{θ}', 2, [5, 4]);
    varrow(ctx, px, py, ka * a[0], -ka * a[1], RED, 'a', 3.2);
    ctx.save(); ctx.fillStyle = COL.c1; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 6.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px + 14, py + 16, { font: 'italic bold 15px Georgia, serif', color: COL.c1 });
    if (!narrow){ caption(ctx, 'θ = ' + fmt(th, 3) + ' rad', 632, 20, COL.muted, 'right'); if (st.hold) caption(ctx, 'held at θ = π', 632, 38, COL.c2, 'right'); }
    else { caption(ctx, 'θ = ' + fmt(th, 3) + ' rad' + (st.hold ? '  (held at θ = π)' : ''), 10, 440, COL.muted); }
    statsEvery(st, 'x1c-3-stats', () => [['θ', fmt(th, 4) + ' rad'], ['r = 4 + 2θ', fmt(r, 4) + ' m'], ['v_r = ṙ', fmt(vr, 4) + ' m/s'], ['v_{θ} = r θ̇', fmt(vt, 4) + ' m/s'],
      ['a_r = r̈ − r θ̇²', fmt(ar, 4) + ' m/s²', true], ['a_{θ} = r θ̈ + 2 ṙ θ̇', fmt(at, 4) + ' m/s²', true], ['v̇ = a · ê_t', fmt(vdot, 4) + ' m/s²']], 0.08);
    const pts = []; for (let k = 0; k <= 120; k++){ const q = TAU * k / 120; pts.push([q, Math.hypot(2 * wd, (4 + 2 * q) * wd)]); }
    const top = Math.hypot(2 * wd, (4 + 2 * TAU) * wd);
    plot($('x1c-3-plot'), { xmin: 0, xmax: TAU, ymin: 0, ymax: top * 1.08, xlabel: 'θ (rad)', ylabel: 'speed v (m/s)', series: [{ pts, color: COL.c1, width: 2.2 }],
      vlines: [{ x: Math.PI, color: COL.axis }], points: [{ x: th, y: sp, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 1.C.4: airplane at the bottom of a loop, tracked by radar ----------
   The plane flies at constant speed on a circle of radius ρ whose lowest point is P0 = (800, 600) m.
   τ is the time from the bottom of the loop. */
makeClip({
  id: 'x1c-4', speed: 1,
  controls: [{ key: 'v', label: 'Aircraft speed v_P', min: 20, max: 150, step: 1, value: 75, unit: 'm/s', dec: 1 },
             { key: 'rho', label: 'Radius of curvature ρ', min: 1000, max: 6000, step: 50, value: 3000, unit: 'm', dec: 0 }],
  presets: (C, st) => holdChips(st, '⏸ Stop at the instant in the problem (bottom of the loop)', () => { st.tau = 0; }),
  reset(st){
    const V = st.V; st.T = Math.min(14, 0.35 * V.rho / V.v); if (st.tau === undefined || !st.hold) st.tau = -st.T; st.last = 0;
    st.curve = []; for (let k = 0; k <= 200; k++){ const tau = -st.T + 2 * st.T * k / 200; st.curve.push([tau, ...polar(V, tau)]); }
  },
  step(st){ const dt = st.t - st.last; st.last = st.t; if (!st.hold){ st.tau += dt * 2.5; if (st.tau > st.T) st.tau = -st.T; } },
  draw(st){
    const cv = $('x1c-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h); fitView(ctx, w, h, [0, 0, 560, 380]);
    const V = st.V, [r, th, rd, thd, rdd, thdd, p, vel, acc] = polar(V, st.tau, true), Sx = 0.25, ox = 50, oy = 330, M = (x, y) => [ox + Sx * x, oy - Sx * y];
    st.cur = { p, v: vel, a: acc, r, th, rd, thd, rdd, thdd, tau: st.tau };
    line(ctx, 10, oy, 550, oy, COL.fg, 2); hatch(ctx, 550, oy, 10, oy, 1, 10, 7);
    const C = [800, 600 + V.rho], arc = []; for (let k = 0; k <= 120; k++){ const u = -0.7 + 1.4 * k / 120; arc.push(M(C[0] + V.rho * Math.sin(u), C[1] - V.rho * Math.cos(u))); }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 560, oy - 2); ctx.clip(); dashedPath(ctx, arc, COL.axis, 1.5, [6, 5], 0.9); ctx.restore();
    const [px, py] = M(...p), [cx, cy] = M(...C);
    // line of sight from the radar to the plane, and the polar angle θ
    line(ctx, ox, oy, px, py, COL.c1, 1.6, [5, 4]); txt(ctx, 'r', (ox + px) / 2 - 16 * Math.sin(th), (oy + py) / 2 - 16 * Math.cos(th), { font: FONT, color: COL.c1 });
    angleArc(ctx, ox, oy, 46, 0, -th); txt(ctx, 'θ', ox + 60 * Math.cos(th / 2), oy - 60 * Math.sin(th / 2), { font: FONT, color: COL.muted });
    // radar station: pedestal on the ground and a dish that turns to follow the plane
    ctx.save(); ctx.fillStyle = '#bfb9aa'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox - 12, oy); ctx.lineTo(ox - 4, oy - 12); ctx.lineTo(ox + 4, oy - 12); ctx.lineTo(ox + 12, oy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.translate(ox, oy - 12); ctx.rotate(-th); ctx.fillStyle = '#d9d4c6'; ctx.beginPath(); ctx.ellipse(6, 0, 4, 13, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'O', ox - 4, oy + 18, { font: 'italic bold 14px Georgia, serif' });
    // direction to the center of curvature
    { const kk = (py - 30) / Math.max(1e-6, py - cy); line(ctx, px, py, px + (cx - px) * kk, py + (cy - py) * kk, COL.c4, 1, [2, 4]); }
    caption(ctx, 'dotted line: toward the center of curvature', 10, 18, COL.c4);
    // the plane (pointing along its velocity)
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(-vel[1], vel[0])); ctx.fillStyle = COL.c1; ctx.strokeStyle = COL.card; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(4, -3); ctx.lineTo(-2, -14); ctx.lineTo(-7, -14); ctx.lineTo(-4, -3); ctx.lineTo(-13, -3); ctx.lineTo(-17, -9); ctx.lineTo(-19, -9); ctx.lineTo(-17, 0);
    ctx.lineTo(-19, 9); ctx.lineTo(-17, 9); ctx.lineTo(-13, 3); ctx.lineTo(-4, 3); ctx.lineTo(-7, 14); ctx.lineTo(-2, 14); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px - 24, py - 22, { font: 'italic bold 15px Georgia, serif', color: COL.c1 });
    varrow(ctx, px, py, 0.9 * vel[0], -0.9 * vel[1], COL.c2, 'v_P', 3);
    const ka = 67 / (V.v * V.v / V.rho); varrow(ctx, px, py, ka * acc[0], -ka * acc[1], RED, 'a_P', 3, null, 1);
    caption(ctx, `τ = ${fmt(st.tau, 3)} s from the bottom`, 552, 372, COL.muted, 'right');
    if (st.hold) caption(ctx, 'held at the instant in the problem', 10, 372, COL.c2);
    statsEvery(st, 'x1c-4-stats', () => [['r', fmt(r, 5) + ' m'], ['θ', fmt(th * 180 / Math.PI, 4) + '°'], ['ṙ', fmt(rd, 4) + ' m/s'], ['θ̇', fmt(thd, 4) + ' rad/s'],
      ['r̈', fmt(rdd, 4) + ' m/s²', true], ['θ̈', fmt(thdd, 5) + ' rad/s²', true]], 0.08);
    const c1 = st.curve.map(q => [q[0], q[5]]), c2 = st.curve.map(q => [q[0], q[6] * 1000]);
    const lim = (pts, z) => { const ys = pts.map(q => q[1]).concat(z ? [0] : []), lo = Math.min(...ys), hi = Math.max(...ys), m = 0.1 * (hi - lo + 1e-3); return [lo - m, hi + m]; };
    const [a1, b1] = lim(c1, true), [a2, b2] = lim(c2, true);
    plot($('x1c-4-plot'), { xmin: -st.T, xmax: st.T, ymin: a1, ymax: b1, xlabel: 'time from the bottom of the loop (s)', ylabel: 'r̈ (m/s²)', series: [{ pts: c1, color: COL.c1, width: 2.2 }], vlines: [{ x: 0, color: COL.axis }], points: [{ x: st.tau, y: rdd, color: COL.c2, r: 5 }] });
    plot($('x1c-4-plot2'), { xmin: -st.T, xmax: st.T, ymin: a2, ymax: b2, xlabel: 'time from the bottom of the loop (s)', ylabel: 'θ̈ (10⁻³ rad/s²)', series: [{ pts: c2, color: COL.c4, width: 2.2 }], vlines: [{ x: 0, color: COL.axis }], points: [{ x: st.tau, y: thdd * 1000, color: COL.c4, r: 5 }] });
  }
});
// polar description of the plane's motion at time τ (constant speed on a circle of radius ρ, bottom at (800, 600) m)
function polar(V, tau, full){
  const ph = V.v / V.rho * tau, C = [800, 600 + V.rho];
  const p = [C[0] + V.rho * Math.sin(ph), C[1] - V.rho * Math.cos(ph)], vel = [V.v * Math.cos(ph), V.v * Math.sin(ph)], acc = [-V.v * V.v / V.rho * Math.sin(ph), V.v * V.v / V.rho * Math.cos(ph)];
  const r = nrm(p), er = [p[0] / r, p[1] / r], ee = [-er[1], er[0]], th = Math.atan2(p[1], p[0]);
  const rd = dot2(vel, er), thd = dot2(vel, ee) / r, rdd = dot2(acc, er) + r * thd * thd, thdd = (dot2(acc, ee) - 2 * rd * thd) / r;
  return full ? [r, th, rd, thd, rdd, thdd, p, vel, acc] : [r, th, rd, thd, rdd, thdd];
}

subLabels();
})();
