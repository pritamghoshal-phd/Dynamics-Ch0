/* =========================================================
   Chapter 5 worked examples 5.A.1 – 5.A.8 (Newton–Euler)
   Uses the helpers in common.js, clip.js and ch5.js.
   ========================================================= */
(function(){
const sgn = x => (x > 0) - (x < 0);
// tick marks on the ground for scenes where the camera follows a moving body
function groundTicks(ctx, x0, x1, y, xWorld0, S, spacing, label){
  // xWorld0 = world coordinate (m) shown at canvas x = x0
  const first = Math.ceil(xWorld0 / spacing) * spacing;
  for (let xw = first; x0 + (xw - xWorld0) * S <= x1; xw += spacing){
    const px = x0 + (xw - xWorld0) * S;
    line(ctx, px, y, px, y - 8, COL.muted, 1.4);
    if (label) txt(ctx, `${fmt(xw, 3)} ${label}`, px, y + 26, { font: '11px system-ui', color: COL.muted });
  }
}
function upArrow(ctx, x, y, len, col, lab, side = 1){ // force pushing up on a point (x, y) from below
  if (len < 2) return;
  arrow(ctx, x, y + len, x, y, col, 2.6);
  if (lab) txt(ctx, lab, x + side * 8, y + len - 6, { color: col, align: side > 0 ? 'left' : 'right' });
}
function hArrow(ctx, x, y, len, col, lab, dy = -12){ // horizontal force with its tail at x, pointing by len
  if (Math.abs(len) < 2) return;
  arrow(ctx, x, y, x + len, y, col, 2.6);
  if (lab) txt(ctx, lab, x + len + sgn(len) * 8, y + dy, { color: col, align: len > 0 ? 'left' : 'right' });
}

/* ---------------------------------------------------------
   5.A.1  Crate sliding on two feet
   --------------------------------------------------------- */
makeClip({
  id: 'xa-1', speed: 0.5,
  controls: [
    { key: 'mu', label: 'Kinetic friction μ_k', min: 0, max: 1, step: 0.01, value: 0.4, unit: '', dec: 3 },
    { key: 'r', label: 'Height ratio d / b', min: 0.2, max: 3, step: 0.05, value: 1, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Low crate, d = 0.5b', apply: () => C.set({ r: 0.5 }) }, { label: 'Tall crate, d = 2b', apply: () => C.set({ r: 2 }) }, { label: 'μ_k d = b (limit)', apply: () => C.set({ r: 1 / Math.max(C.v.mu, 0.01) }) }],
  reset(st){ st.x = 0; st.v = 3; st.lastT = 0; st.hold = undefined; st.stopT = undefined; },
  step(st){
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.hold !== undefined){ if (st.t > st.hold + 1.3){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 3; st.hold = undefined; st.stopT = undefined; } return; }
    if (V.mu * V.r >= 1){ if (st.t > 2) st.hold = st.t; return; } // the rear foot would lift: analysis does not apply
    if (st.v > 0){ st.v = Math.max(0, st.v - V.mu * G0 * dt); st.x += st.v * dt; if (st.v === 0) st.stopT = st.t; }
    if ((st.stopT !== undefined && st.t > st.stopT + 1.2) || st.x > 3.2) st.hold = st.t;
  },
  draw(st){
    const cv = $('xa-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 320, 380); fitView(ctx, w, h, nr ? [80, 0, 580, 330] : [0, 0, 720, 330]);
    const V = st.V, m = 50, mg = m * G0, b = 0.4, d = V.r * b, S = 110, fy = 270, k = 70 / mg;
    const lift = V.mu * V.r >= 1, moving = st.v > 0 && !lift;
    const NA = moving ? mg / 2 * (1 + V.mu * V.r) : mg / 2, NB = moving ? mg / 2 * (1 - V.mu * V.r) : mg / 2;
    line(ctx, 20, fy, 700, fy, COL.fg, 2); hatch(ctx, 20, fy, 700, fy, 1, 9, 6);
    const gx = 150 + Math.min(st.x, 3.2) * S, W2 = (b + 0.12) * S, Hc = 2 * d * S, foot = 8;
    // crate body on two feet A (front, right) and B (rear, left)
    ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
    ctx.fillRect(gx - W2, fy - foot - Hc, 2 * W2, Hc); ctx.strokeRect(gx - W2, fy - foot - Hc, 2 * W2, Hc);
    [gx - b * S, gx + b * S].forEach(x => { ctx.fillRect(x - 6, fy - foot, 12, foot); ctx.strokeRect(x - 6, fy - foot, 12, foot); });
    ctx.restore();
    const gy = fy - foot - d * S;
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx + 12, gy - 10, { font: 'italic 14px Georgia, serif' });
    arrow(ctx, gx, gy, gx, gy + 45, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, gy + 40, { color: COL.c2, align: 'left' });
    txt(ctx, 'A', gx + b * S, fy + 44, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', gx - b * S, fy + 44, { font: 'italic 14px Georgia, serif' });
    if (!lift){
      upArrow(ctx, gx + b * S, fy, NA * k, COL.c3, 'N_A', 1); upArrow(ctx, gx - b * S, fy, NB * k, COL.c3, 'N_B', -1);
      if (moving){ hArrow(ctx, gx + b * S, fy - 2, -V.mu * NA * k, RED, ''); hArrow(ctx, gx - b * S, fy - 2, -V.mu * NB * k, RED, ''); txt(ctx, 'μ_k N_A', gx + b * S - V.mu * NA * k - 4, fy - 14, { color: RED, align: 'right', font: 'italic 13px Georgia, serif' }); }
      if (moving) arrow(ctx, gx - 30, fy - foot - Hc - 18, gx + 30, fy - foot - Hc - 18, COL.c1, 2.4);
    }
    const msg = lift ? 'μ_k d ≥ b, so the rear foot B would lift. This sliding analysis no longer applies.' : moving ? 'Sliding to the right. Friction acts to the left at both feet.' : 'The crate has stopped. Friction is now zero and N_A = N_B.';
    txt(ctx, msg, nr ? 330 : 360, 22, { font: (nr ? '600 15px' : '600 13px') + ' system-ui', color: lift ? RED : COL.fg });
    statsEvery(st, 'xa-1-stats', () => lift ? [['μ_k d / b', fmt(V.mu * V.r, 3) + ' (must be less than 1)', true]] :
      [['N_A = (mg/2)(1 + μ_k d/b)', fmt(mg / 2 * (1 + V.mu * V.r), 4) + ' N', true], ['N_B = (mg/2)(1 − μ_k d/b)', fmt(mg / 2 * (1 - V.mu * V.r), 4) + ' N', true], ['friction at A, μ_k N_A', fmt(V.mu * mg / 2 * (1 + V.mu * V.r), 4) + ' N'], ['friction at B, μ_k N_B', fmt(V.mu * mg / 2 * (1 - V.mu * V.r), 4) + ' N'], ['a_G = −μ_k g', fmt(-V.mu * G0, 3) + ' m/s²'], ['speed', fmt(st.v, 3) + ' m/s']]);
  }
});

/* ---------------------------------------------------------
   5.A.2  Braking car: load transfer and nose dive
   --------------------------------------------------------- */
(function(){
  const m = 1500, bR = 1.5, bF = 1.1, Lw = bR + bF, kS = 50000, wr = 0.32; // kS: suspension stiffness per axle (N/m)
  makeClip({
    id: 'xa-2', speed: 0.5,
    controls: [
      { key: 'a', label: 'Braking deceleration a', min: 0, max: 9, step: 0.1, value: 6, unit: 'm/s²', dec: 2 },
      { key: 'd', label: 'Height d of G', min: 0.3, max: 1.0, step: 0.01, value: 0.55, unit: 'm', dec: 3 }
    ],
    presets: C => [{ label: 'Gentle stop', apply: () => C.set({ a: 2 }) }, { label: 'Hard stop', apply: () => C.set({ a: 8 }) }, { label: 'Tall vehicle', apply: () => C.set({ d: 1.0 }) }],
    reset(st){ st.x = 0; st.v = 14; st.lastT = 0; st.zF = m * G0 * bR / Lw / kS; st.zR = m * G0 * bF / Lw / kS; st.vF = 0; st.vR = 0; st.phase = 'cruise'; st.tStop = undefined; },
    step(st){
      const V = st.V; let dt = st.t - st.lastT; st.lastT = st.t;
      while (dt > 1e-9){
        const h = Math.min(dt, 0.002); dt -= h;
        if (st.phase === 'cruise' && st.t > 0.8) st.phase = 'brake';
        const acc = st.phase === 'brake' ? V.a : 0;
        if (st.phase === 'brake'){ st.v -= acc * h; if (st.v <= 0){ st.v = 0; st.phase = 'stopped'; st.tStop = st.t; } }
        st.x += st.v * h;
        // each axle's spring settles toward its load N / k with a well-damped response (natural frequency 8 rad/s, damping ratio 0.7)
        const a2 = st.phase === 'brake' ? V.a : 0, NF = m * (G0 * bR + a2 * V.d) / Lw, NR = m * (G0 * bF - a2 * V.d) / Lw, wn = 8, z = 0.7;
        st.vF += (wn * wn * (NF / kS - st.zF) - 2 * z * wn * st.vF) * h; st.zF += st.vF * h;
        st.vR += (wn * wn * (NR / kS - st.zR) - 2 * z * wn * st.vR) * h; st.zR += st.vR * h;
      }
      if (st.tStop !== undefined && st.t > st.tStop + 2){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 14; st.phase = 'cruise'; st.tStop = undefined; st.zF = m * G0 * bR / Lw / kS; st.zR = m * G0 * bF / Lw / kS; st.vF = 0; st.vR = 0; }
    },
    draw(st){
      const cv = $('xa-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 350, 380); fitView(ctx, w, h, [0, 0, 720, 375]);
      const V = st.V, S = 150, fy = 270, cx = 360, mg = m * G0, k = 55 / (mg / 2);
      line(ctx, 0, fy, 720, fy, COL.fg, 2); hatch(ctx, 0, fy, 720, fy, 1, 9, 6);
      groundTicks(ctx, 0, 720, fy, st.x - cx / S, S, 1, '');
      const xr = cx - bR * S, xf = cx + bF * S, ang = st.x / wr;
      // static ride height: body reference at the axle height plus the spring length
      const z0F = m * G0 * bR / Lw / kS, z0R = m * G0 * bF / Lw / kS, base = 0.45; // free spring length 0.45 m above the axle
      const yAx = fy - wr * S, yBF = yAx - (base - st.zF) * S, yBR = yAx - (base - st.zR) * S; // body attachment points
      const pitch = Math.atan2(yBF - yBR, xf - xr);
      // suspension springs
      wheel(ctx, xr, yAx, wr * S, ang, 'disk', '#3a3a3a'); wheel(ctx, xf, yAx, wr * S, ang, 'disk', '#3a3a3a');
      const keep = COL.spring; COL.spring = '#d8d2c2'; springLine(ctx, xr, yAx, xr, yBR, 6, 9); springLine(ctx, xf, yAx, xf, yBF, 6, 9); COL.spring = keep; // light springs, visible against the tires
      // car body, rigidly attached at the two spring tops
      ctx.save(); ctx.translate(xr, yBR); ctx.rotate(pitch);
      const Lpx = Math.hypot(xf - xr, yBF - yBR);
      ctx.fillStyle = '#e7c95a'; ctx.strokeStyle = '#8a6a12'; ctx.lineWidth = 2; ctx.beginPath();
      // body with a sill 0.25 m above the ground (static) and wheel arches: each arch is centred on its wheel's static position and is
      // 0.12 m larger than the tire, more than the largest suspension travel, so the tires never touch the body
      const yS = (wr + base - z0R - 0.25) * S, RA = (wr + 0.12) * S, arches = [[Lpx, (base - z0F) * S], [0, (base - z0R) * S]];
      ctx.moveTo(-0.9 * S, yS); ctx.lineTo(-0.9 * S, -0.35 * S); ctx.lineTo(0.1 * S, -0.42 * S); ctx.lineTo(0.55 * S, -0.85 * S); ctx.lineTo(1.65 * S, -0.85 * S); ctx.lineTo(2.1 * S, -0.45 * S);
      ctx.lineTo(Lpx + 0.85 * S, -0.35 * S); ctx.lineTo(Lpx + 0.85 * S, yS);
      arches.forEach(([ax, ay]) => { const dy = yS - ay, hc = Math.sqrt(Math.max(RA * RA - dy * dy, 0)), a1 = Math.atan2(dy, hc); ctx.lineTo(ax + hc, yS); ctx.arc(ax, ay, RA, a1, Math.PI - a1, true); });
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#cfe0ea'; ctx.beginPath(); ctx.moveTo(0.65 * S, -0.78 * S); ctx.lineTo(1.6 * S, -0.78 * S); ctx.lineTo(1.95 * S, -0.48 * S); ctx.lineTo(0.35 * S, -0.48 * S); ctx.closePath(); ctx.fill();
      // G: horizontally b_R ahead of the rear axle, height d above the ground in the static position
      const gxb = bR * S, gyb = -(V.d - wr - (base - z0R)) * S;
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gxb, gyb, 4.5, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
      const gX = xr + bR * S * Math.cos(pitch) - (-(V.d - wr - (base - z0R)) * S) * Math.sin(pitch), gY = yBR + bR * S * Math.sin(pitch) + (-(V.d - wr - (base - z0R)) * S) * Math.cos(pitch);
      txt(ctx, 'G', gX - 12, gY - 12, { font: 'italic 14px Georgia, serif' });
      // tire forces from the ground (to scale)
      const a2 = st.phase === 'brake' ? V.a : 0, NF = m * (G0 * bR + a2 * V.d) / Lw, NR = m * (G0 * bF - a2 * V.d) / Lw;
      upArrow(ctx, xr, fy, NR * k, COL.c3, 'N_R', -1); upArrow(ctx, xf, fy, NF * k, COL.c3, 'N_F', 1);
      if (a2 > 0){ hArrow(ctx, xr, fy - 3, -a2 / G0 * NR * k, RED, ''); hArrow(ctx, xf, fy - 3, -a2 / G0 * NF * k, RED, 'braking friction', -14); }
      const msg = st.phase === 'cruise' ? 'Cruising at constant speed. Each axle carries its static share of the weight.' : st.phase === 'brake' ? 'Braking. Load moves to the front axle, so the front springs compress and the nose dips.' : 'Stopped. The loads return to their static values and the body levels out.';
      txt(ctx, msg, 360, 14, { font: '600 13px system-ui', color: st.phase === 'brake' ? RED : COL.fg });
      statsEvery(st, 'xa-2-stats', () => [['N_F = m(g b_R + a d)/(b_R + b_F)', fmt(NF, 4) + ' N', true], ['N_R = m(g b_F − a d)/(b_R + b_F)', fmt(NR, 4) + ' N', true], ['load moved to the front, m a d/(b_R + b_F)', fmt(m * a2 * V.d / Lw, 4) + ' N'], ['pitch angle (nose down +)', fmt(-pitch / RAD, 3) + '°'], ['speed', fmt(st.v, 3) + ' m/s']]);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.3  Bicycle: rear-wheel or front-wheel braking
   --------------------------------------------------------- */
(function(){
  const m = 80, bR = 0.6, bF = 0.4, Lw = bR + bF, wr = 0.34;
  const MODES = [['Rear brake only', 'rear'], ['Front brake only', 'front']];
  function analyse(V, mode){
    const aFlip = G0 * bF / V.d;
    if (mode === 'rear'){
      const aSkid = V.mu * G0 * bF / (Lw + V.mu * V.d);
      if (V.a <= aSkid) return { a: V.a, state: 'ok', aSkid, aFlip };
      return { a: aSkid, state: 'skid', aSkid, aFlip };
    }
    const aSkid = Lw > V.mu * V.d ? V.mu * G0 * bR / (Lw - V.mu * V.d) : Infinity;
    if (V.a <= Math.min(aSkid, aFlip)) return { a: V.a, state: 'ok', aSkid, aFlip };
    if (aSkid < aFlip) return { a: aSkid, state: 'skid', aSkid, aFlip };
    return { a: aFlip, state: 'flip', aSkid, aFlip };
  }
  makeClip({
    id: 'xa-3', speed: 0.5,
    controls: [
      { key: 'a', label: 'Deceleration the rider asks for', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'm/s²', dec: 2 },
      { key: 'mu', label: 'Tire friction μ', min: 0.2, max: 1, step: 0.01, value: 0.7, unit: '', dec: 3 },
      { key: 'd', label: 'Height d of G', min: 0.8, max: 1.3, step: 0.01, value: 1.0, unit: 'm', dec: 3 }
    ],
    presets: (C, st, reset) => MODES.map(([label, val]) => ({ label, apply: () => { st.mode = val; reset(); } })),
    setup(st){ st.mode = 'rear'; },
    reset(st){
      document.querySelectorAll('#xa-3-pre .chip').forEach((b, i) => b.classList.toggle('on', MODES[i][1] === st.mode));
      st.x = 0; st.v = 7; st.lastT = 0; st.phase = 'cruise'; st.tStop = undefined; st.R = analyse(st.V, st.mode);
    },
    step(st){
      let dt = st.t - st.lastT; st.lastT = st.t;
      if (st.phase === 'cruise' && st.t > 0.7){ st.phase = st.R.state === 'flip' ? 'flip' : 'brake'; st.lockAng = st.x / wr; }
      if (st.phase === 'flip'){ if (st.t > 3.5){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 7; st.phase = 'cruise'; } return; }
      if (st.phase === 'brake'){ st.v -= st.R.a * dt; if (st.v <= 0){ st.v = 0; st.phase = 'stopped'; st.tStop = st.t; } }
      st.x += st.v * dt;
      if (st.tStop !== undefined && st.t > st.tStop + 1.5){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 7; st.phase = 'cruise'; st.tStop = undefined; }
    },
    draw(st){
      const cv = $('xa-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 370, 400); fitView(ctx, w, h, nr ? [170, 0, 560, 380] : [0, 0, 720, 380]);
      const V = st.V, R = st.R, S = 140, fy = 295, cx = 330, mg = m * G0, k = 60 / mg;
      line(ctx, 0, fy, 720, fy, COL.fg, 2); hatch(ctx, 0, fy, 720, fy, 1, 9, 6);
      groundTicks(ctx, 0, 720, fy, st.x - cx / S, S, 1, '');
      const xr = cx - bR * S, xf = cx + bF * S, yAx = fy - wr * S;
      const locked = st.phase === 'brake' && R.state === 'skid', ang = st.x / wr;
      wheel(ctx, xr, yAx, wr * S, locked && st.mode === 'rear' ? st.lockAng : ang, 'ring', '#cfcac0');
      wheel(ctx, xf, yAx, wr * S, locked && st.mode === 'front' ? st.lockAng : ang, 'ring', '#cfcac0');
      // frame and rider (G is the mass center of bicycle and rider together)
      const gx = cx, gy = fy - V.d * S, seat = [cx - 0.12 * S, fy - 0.95 * S], bar = [xf - 0.08 * S, fy - 1.0 * S], crank = [cx - 0.05 * S, yAx + 0.02 * S];
      ctx.save(); ctx.strokeStyle = '#1f3a93'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(xr, yAx); ctx.lineTo(crank[0], crank[1]); ctx.lineTo(seat[0], seat[1]); ctx.lineTo(xr, yAx);
      ctx.moveTo(seat[0], seat[1] + 0.05 * S); ctx.lineTo(bar[0], bar[1] + 0.05 * S); ctx.lineTo(crank[0], crank[1]);
      ctx.moveTo(xf, yAx); ctx.lineTo(bar[0], bar[1]); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = '#b5306b'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      const hip = [seat[0], seat[1] - 0.05 * S], sh = [cx + 0.12 * S, fy - 1.45 * S];
      ctx.moveTo(crank[0], crank[1]); ctx.lineTo(cx + 0.12 * S, fy - 0.55 * S); ctx.lineTo(hip[0], hip[1]); ctx.lineTo(sh[0], sh[1]); ctx.lineTo(bar[0], bar[1] - 0.02 * S); ctx.stroke();
      ctx.fillStyle = '#b5306b'; ctx.beginPath(); ctx.arc(sh[0] + 0.06 * S, sh[1] - 0.13 * S, 0.1 * S, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      txt(ctx, 'G', gx + 12, gy + 14, { font: 'italic 14px Georgia, serif' });
      const braking = st.phase === 'brake' || st.phase === 'flip', a2 = braking ? R.a : 0;
      const NF = m * (G0 * bR + a2 * V.d) / Lw, NR = m * (G0 * bF - a2 * V.d) / Lw;
      upArrow(ctx, xr, fy, NR * k, COL.c3, 'N_R', -1); upArrow(ctx, xf, fy, NF * k, COL.c3, 'N_F', 1);
      if (braking){ const bx = st.mode === 'rear' ? xr : xf, fl = -m * a2 * k; hArrow(ctx, bx, fy - 3, fl, RED, ''); txt(ctx, 'F', bx + fl - 8, fy - 16, { color: RED, align: 'right' }); }
      let msg = 'Riding at constant speed.';
      if (st.phase === 'brake') msg = R.state === 'ok' ? `Braking with the ${st.mode} wheel. The tire grips.` : `The ${st.mode} wheel locks and skids, so the deceleration is limited.`;
      if (st.phase === 'stopped') msg = 'Stopped.';
      if (st.phase === 'flip') msg = 'N_R has reached zero, so the rear wheel lifts. The rider would go over the handlebars.';
      txt(ctx, msg, 360, 22, { font: '600 13px system-ui', color: st.phase === 'flip' || (st.phase === 'brake' && R.state !== 'ok') ? RED : COL.fg });
      statsEvery(st, 'xa-3-stats', () => [['actual deceleration', fmt(a2, 3) + ' m/s²', true], ['N_F', fmt(NF, 4) + ' N'], ['N_R', fmt(Math.max(NR, 0), 4) + ' N'],
        [st.mode === 'rear' ? 'rear skids above μ g b_F / (L + μ d)' : 'front skids above μ g b_R / (L − μ d)', isFinite(R.aSkid) ? fmt(R.aSkid, 3) + ' m/s²' : 'never'], ['rear wheel lifts above g b_F / d', fmt(R.aFlip, 3) + ' m/s²']]);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.4  Rod against the wall of an accelerating frame
   --------------------------------------------------------- */
(function(){
  const L = 1.0;
  makeClip({
    id: 'xa-4', speed: 0.5,
    controls: [
      { key: 'th', label: 'Angle θ of the rod', min: 15, max: 75, step: 0.5, value: 35, unit: '°', dec: 2 },
      { key: 'a', label: 'Acceleration a of the frame', min: 0, max: 30, step: 0.05, value: G0 / Math.tan(35 * RAD), unit: 'm/s²', dec: 3 }
    ],
    presets: C => [{ label: 'a = g cot θ', apply: () => C.set({ a: G0 / Math.tan(C.v.th * RAD) }) }, { label: '5% too small', apply: () => C.set({ a: 0.95 * G0 / Math.tan(C.v.th * RAD) }) }, { label: '5% too large', apply: () => C.set({ a: 1.05 * G0 / Math.tan(C.v.th * RAD) }) }],
    reset(st){ st.s = [st.V.th * RAD, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; st.xf = 0; st.vf = 0; },
    step(st){
      const V = st.V; let dt = st.t - st.lastT; st.lastT = st.t;
      if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [V.th * RAD, 0]; st.hold = undefined; st.msg = ''; st.xf = 0; st.vf = 0; } return; }
      st.vf += V.a * dt; st.xf += st.vf * dt;
      // relative to the frame: (m L²/3) φ'' = (m L / 2)(a sin φ − g cos φ)
      st.s = stepN(s => [s[1], 1.5 / L * (V.a * Math.sin(s[0]) - G0 * Math.cos(s[0]))], st.s, dt, 0.0005);
      const [p, w] = st.s, pdd = 1.5 / L * (V.a * Math.sin(p) - G0 * Math.cos(p));
      st.NA = (-L / 2 * (Math.sin(p) * pdd + Math.cos(p) * w * w) + V.a); st.NB = (L / 2 * (Math.cos(p) * pdd - Math.sin(p) * w * w) + G0); // per unit mass
      if (p <= 0.01){ st.s = [0, 0]; st.hold = st.t; st.msg = 'The rod has slid down and lies flat on the floor.'; }
      else if (p >= Math.PI / 2 - 0.01){ st.s = [Math.PI / 2, 0]; st.hold = st.t; st.msg = 'The rod has swung up and stands against the wall.'; }
      else if (st.NA < 0 || st.NB < 0){ st.hold = st.t; st.msg = 'A contact force would have to pull, so the rod leaves a surface here.'; }
      else if (st.t > 6){ st.hold = st.t; }
    },
    draw(st){
      const cv = $('xa-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 360, 390); fitView(ctx, w, h, nr ? [130, 0, 610, 362] : [0, 0, 720, 362]);
      // the inner height is larger than L, so the rod can stand upright against the wall without reaching the roof
      const V = st.V, S = 200, fy = 322, fx0 = 260, iw = 1.12 * L * S, ih = 1.06 * L * S, wall = 16;
      line(ctx, 0, fy, 720, fy, COL.fg, 2); hatch(ctx, 0, fy, 720, fy, 1, 9, 6);
      groundTicks(ctx, 0, 720, fy, st.xf - 300 / S, S, 0.5, '');
      // frame on wheels
      const ox = fx0, oy = fy - 16; // inner bottom-left corner
      ctx.save(); ctx.fillStyle = '#d5d0c4'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(ox - wall, oy - ih - wall, iw + 2 * wall, ih + 2 * wall); ctx.rect(ox, oy - ih, iw, ih); ctx.fill('evenodd'); ctx.stroke(); ctx.restore();
      [ox + 10, ox + iw - 10].forEach(x => { ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, fy - 8, 8, 0, 2 * Math.PI); ctx.fill(); });
      arrow(ctx, ox + iw / 2 - 30, oy - ih - wall - 18, ox + iw / 2 + 30, oy - ih - wall - 18, COL.c1, 2.6); txt(ctx, 'a', ox + iw / 2 + 40, oy - ih - wall - 20, { color: COL.c1, align: 'left' });
      const p = st.s[0], Ax = ox, Ay = oy - L * Math.sin(p) * S, Bx = ox + L * Math.cos(p) * S, By = oy;
      // the rod (9 px thick) is drawn on the inside of its contact line, so it rests on the wall and floor instead of sinking into them
      const nx = 4.5 * Math.sin(p), ny = -4.5 * Math.cos(p);
      line(ctx, Ax + nx, Ay + ny, Bx + nx, By + ny, COL.massEdge, 9); line(ctx, Ax + nx, Ay + ny, Bx + nx, By + ny, COL.mass, 5);
      [[Ax, Ay], [Bx, By]].forEach(([x, y]) => pinDot(ctx, x + nx, y + ny));
      txt(ctx, 'A', Ax + 14, Ay - 10, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', Bx + 4, By - 16, { font: 'italic 14px Georgia, serif' });
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(Bx, By, 40, Math.PI, Math.PI + p); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', Bx - 52 * Math.cos(p / 2), By - 52 * Math.sin(p / 2) + 4);
      const k = 40 / G0, NA = Math.max(st.NA ?? (V.a), 0), NB = Math.max(st.NB ?? G0, 0);
      hArrow(ctx, Ax - NA * k, Ay, NA * k, COL.c3, ''); txt(ctx, 'N_A', Ax - NA * k - 6, Ay - 12, { color: COL.c3, align: 'right' });
      upArrow(ctx, Bx - 10, By, NB * k, COL.c3, 'N_B', -1);
      const gx = (Ax + Bx) / 2, gy = (Ay + By) / 2; arrow(ctx, gx, gy, gx, gy + 40, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, gy + 36, { color: COL.c2, align: 'left' });
      const exact = Math.abs(V.a - G0 / Math.tan(V.th * RAD)) < 1e-3;
      txt(ctx, st.msg || (exact ? 'With a = g cot θ the rod keeps its orientation.' : 'The acceleration is not g cot θ, so the rod starts to rotate.'), 360, 18, { font: '600 13px system-ui', color: st.msg || !exact ? RED : COL.c3 });
      statsEvery(st, 'xa-4-stats', () => [['g cot θ', fmt(G0 / Math.tan(V.th * RAD), 4) + ' m/s²', true], ['angle of the rod now', fmt(p / RAD, 3) + '°', true], ['N_A / m', fmt(st.NA ?? V.a, 3) + ' N/kg'], ['N_B / m', fmt(st.NB ?? G0, 3) + ' N/kg']]);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.5  Platform raised by parallel links
   --------------------------------------------------------- */
(function(){
  const m = 400, L = 2, M = 4000, ell = 2.6, th0 = Math.atan2(4, 3), w0 = 3;
  const thdd = th => M / (m * L * L) - G0 / L * Math.cos(th); // θ increases while the links turn clockwise
  // force of pin A on the platform (G on the line through the pins), from the Newton–Euler equations
  function pinA(th, w){
    const c = Math.cos(th), s = Math.sin(th), s2 = Math.sin(2 * th), c2 = Math.cos(2 * th), c3 = Math.cos(3 * th);
    const Ax = (L * m * w * w * s2 / 2 - G0 * m * c / 4 + G0 * m * c3 / 4 - M / L * c2 / 2 + 3 * M / (2 * L)) / (2 * s);
    const Ay = -L * m * w * w * s / 2 - G0 * m * c2 / 4 + G0 * m / 4 + M * c / (2 * L);
    return [Ax, Ay];
  }
  // start a little before the given instant so that the animation passes through θ = 53.13°, ω = 3 rad/s
  let start = [th0, w0]; for (let i = 0; i < 80; i++) start = rk(s => [s[1], thdd(s[0])], start, -0.002);
  makeClip({
    id: 'xa-5', speed: 0.25,
    reset(st){ st.s = start.slice(); st.lastT = 0; st.hist = []; st.hold = undefined; },
    step(st){
      let dt = st.t - st.lastT; st.lastT = st.t;
      if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = start.slice(); st.hist = []; st.hold = undefined; } return; }
      st.s = stepN(s => [s[1], thdd(s[0])], st.s, dt, 0.0005);
      if (st.s[0] > 140 * RAD){ st.s[0] = 140 * RAD; st.hold = st.t; } // stop exactly at the end of the plotted range
      const [Ax, Ay] = pinA(st.s[0], st.s[1]); st.hist.push([st.s[0] / RAD, Math.hypot(Ax, Ay)]);
      if (st.s[1] < 0) st.hold = st.t;
    },
    draw(st){
      const cv = $('xa-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 640, 330]);
      const S = 80, fy = 280, ox = 210, cx = ox + ell * S, th = st.s[0], wv = st.s[1];
      line(ctx, 20, fy + 26, 620, fy + 26, COL.muted, 1, [3, 3]);
      const Ax = ox - L * Math.cos(th) * S, Ay = fy - L * Math.sin(th) * S, Bx = Ax + ell * S, By = Ay;
      pin(ctx, ox, fy, 26); pin(ctx, cx, fy, 26);
      line(ctx, ox, fy, Ax, Ay, '#8d877a', 7); line(ctx, cx, fy, Bx, By, '#8d877a', 7);
      ctx.save(); ctx.fillStyle = '#6f6a5e'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.fillRect(Ax - 8, Ay - 9, ell * S + 16, 18); ctx.strokeRect(Ax - 8, Ay - 9, ell * S + 16, 18); ctx.restore();
      pinDot(ctx, ox, fy); pinDot(ctx, cx, fy); pinDot(ctx, Ax, Ay); pinDot(ctx, Bx, By);
      txt(ctx, 'O', ox - 16, fy + 12, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'C', cx + 16, fy + 12, { font: 'italic 14px Georgia, serif' });
      txt(ctx, 'A', Ax - 16, Ay - 14, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', Bx + 16, By - 14, { font: 'italic 14px Georgia, serif' });
      momentArrow(ctx, ox, fy, 28, false, COL.c1, ''); txt(ctx, 'M', ox + 34, fy - 30, { color: COL.c1 });
      const gx = (Ax + Bx) / 2; arrow(ctx, gx, Ay, gx, Ay + 50, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, Ay + 46, { color: COL.c2, align: 'left' });
      const [FAx, FAy] = pinA(th, wv), k = 50 / (m * G0); arrow(ctx, Ax, Ay, Ax + FAx * k, Ay - FAy * k, RED, 3); txt(ctx, 'F_A', Ax + FAx * k + 10, Ay - FAy * k - 6, { color: RED, align: 'left' });
      const at = Math.abs(th - th0) < 0.6 * RAD;
      txt(ctx, at ? 'This is the instant in the problem: θ = 53.13° and ω = 3 rad/s.' : 'The constant moment M on link OA raises the platform.', 320, 20, { font: '600 13px system-ui', color: at ? COL.c3 : COL.fg });
      const pts = []; let lo = 1e9, hi = 0; for (const [x, y] of st.hist){ pts.push([x, y / 1000]); lo = Math.min(lo, y / 1000); hi = Math.max(hi, y / 1000); }
      plot($('xa-5-plot'), { xmin: Math.floor(start[0] / RAD), xmax: 140, ymin: 0, ymax: Math.max(hi * 1.15, 4), xlabel: 'link angle θ (°)', ylabel: 'force at pin A (kN)', series: [{ pts, color: COL.c1, width: 2.4 }], vlines: [{ x: th0 / RAD, color: COL.c3, label: '53.13°' }], points: [{ x: th / RAD, y: Math.hypot(FAx, FAy) / 1000, color: RED, r: 5 }] });
      statsEvery(st, 'xa-5-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['ω (clockwise)', fmt(wv, 3) + ' rad/s'], ['angular acceleration (clockwise)', fmt(thdd(th), 3) + ' rad/s²'], ['|F_A|', fmt(Math.hypot(FAx, FAy), 4) + ' N', true]]);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.6  Bar hanging from an accelerating collar
   --------------------------------------------------------- */
makeClip({
  id: 'xa-6', speed: 0.25,
  controls: [
    { key: 'a', label: 'Acceleration a of the collar (to the left)', min: 0, max: 15, step: 0.01, value: G0 * Math.tan(25 * RAD), unit: 'm/s²', dec: 3 },
    { key: 'th0', label: 'Starting angle θ_0', min: 0, max: 60, step: 0.5, value: 25, unit: '°', dec: 2 }
  ],
  presets: C => [{ label: 'a = g tan 25°', apply: () => C.set({ a: G0 * Math.tan(25 * RAD), th0: 25 }) }, { label: 'a = 0', apply: () => C.set({ a: 0 }) }, { label: 'a = g', apply: () => C.set({ a: G0 }) }],
  reset(st){ st.s = [st.V.th0 * RAD, 0]; st.x = 0; st.v = 0; st.lastT = 0; st.hist = []; },
  step(st){
    const V = st.V, L = 0.8; let dt = st.t - st.lastT; st.lastT = st.t;
    // the collar restarts before it reaches the left wall: collar half-width 22 px plus room for the bar to swing back (S = 220 px/m)
    if (st.x > 1.6 || st.t > 4){ st.t = 0; st.lastT = 0; st.s = [V.th0 * RAD, 0]; st.x = 0; st.v = 0; st.hist = []; return; }
    st.v += V.a * dt; st.x += st.v * dt;
    // about the pin, in the frame of the collar: (m L²/3) θ'' = (m L / 2)(a cos θ − g sin θ)
    st.s = stepN(s => [s[1], 1.5 / L * (V.a * Math.cos(s[0]) - G0 * Math.sin(s[0]))], st.s, dt, 0.0005);
    st.hist.push([st.t, st.s[0] / RAD]);
  },
  draw(st){
    const cv = $('xa-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 320]);
    const V = st.V, S = 220, ry = 80, xr0 = 70, xr1 = 590, ox = xr1 - 70 - Math.min(st.x, 1.6) * S, th = st.s[0], L = 0.8; // never drawn past the restart point, even after a long frame
    // guide rod held by two fixed walls
    [xr0, xr1].forEach((x, i) => { const sg = i ? 1 : -1; ctx.save(); ctx.fillStyle = '#7d776b'; ctx.fillRect(x + (sg > 0 ? 0 : -14), ry - 70, 14, 150); ctx.restore(); hatch(ctx, x + (sg > 0 ? 14 : -14), ry - 70, x + (sg > 0 ? 14 : -14), ry + 80, sg > 0 ? 0 : 1, 8, 6); });
    line(ctx, xr0, ry, xr1, ry, '#b9b3a6', 8); line(ctx, xr0, ry, xr1, ry, COL.fg, 1);
    ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.fillRect(ox - 22, ry - 16, 44, 32); ctx.strokeRect(ox - 22, ry - 16, 44, 32); ctx.restore();
    const ex = ox + L * S * Math.sin(th), ey = ry + L * S * Math.cos(th);
    line(ctx, ox, ry, ex, ey, COL.massEdge, 11); line(ctx, ox, ry, ex, ey, '#cfc8b8', 7);
    pinDot(ctx, ox, ry); txt(ctx, 'O', ox - 30, ry + 26, { font: 'italic 14px Georgia, serif' });
    line(ctx, ox, ry, ox, ry + 120, COL.muted, 1, [4, 4]);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, ry, 70, Math.PI / 2 - th, Math.PI / 2, false); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', ox + 80 * Math.sin(th / 2), ry + 80 * Math.cos(th / 2) + 4);
    if (V.a > 0){ arrow(ctx, ox + 30, ry - 36, ox - 30, ry - 36, COL.c1, 2.6); txt(ctx, 'a', ox - 40, ry - 38, { color: COL.c1, align: 'right' }); }
    const eq = Math.atan(V.a / G0);
    const lo6 = Math.min(0, 2 * eq / RAD - st.V.th0) - 5, hi6 = Math.max(70, st.V.th0 + 5, 2 * eq / RAD - st.V.th0 + 5); // the bar swings symmetrically about its equilibrium angle
    plot($('xa-6-plot'), { xmin: 0, xmax: 4, ymin: lo6, ymax: hi6, xlabel: 'time t (s)', ylabel: 'θ (°)', series: [{ pts: st.hist, color: COL.c1, width: 2.4 }], hlines: [{ y: eq / RAD, color: COL.c3 }], points: [{ x: st.t, y: th / RAD, color: COL.c2, r: 5 }] });
    statsEvery(st, 'xa-6-stats', () => [['θ now', fmt(th / RAD, 3) + '°', true], ['steady angle tan⁻¹(a/g)', fmt(eq / RAD, 3) + '°', true], ['a needed for 25°, g tan 25°', fmt(G0 * Math.tan(25 * RAD), 4) + ' m/s²'], ['collar speed', fmt(st.v, 3) + ' m/s']]);
  }
});

/* ---------------------------------------------------------
   5.A.7  Ladder in an accelerating cart.
   Simulated in the frame of the cart. In that frame every particle also feels m a toward the back of the cart
   (to the right), so the problem is a rigid body under an "effective gravity" (a, −g) per unit mass.
   Phase 'held'  : static friction is enough (μ_s ≥ μ_min). Nothing moves relative to the cart.
   Phase 'slide' : μ_s < μ_min. Both ends stay in contact and slide with kinetic friction μ_k = μ_s (1-DOF in θ).
   Phase 'tip'   : the wall would have to pull (book data, d = 5 ft). The top leaves the wall and the ladder
                   rotates about its foot A while A sticks (checked against μ_s at every step).
   --------------------------------------------------------- */
(function(){
  const W = 250, gUS = 32.2, L = 15, th0 = 70 * RAD, hG = 10, m = W / gUS, kG = 3, IG = m * kG * kG; // kG: sample radius of gyration of ladder + person
  const xA0 = L * Math.cos(th0), yB0 = L * Math.sin(th0);
  const e = t => [-Math.cos(t), Math.sin(t)], n = t => [Math.sin(t), Math.cos(t)];          // along the ladder (A to B) and normal to it
  const ep = t => [Math.sin(t), Math.cos(t)], np = t => [Math.cos(t), -Math.sin(t)];        // d/dθ
  const epp = t => [Math.cos(t), -Math.sin(t)], npp = t => [-Math.sin(t), -Math.cos(t)];    // d²/dθ²
  function solveStatic(V){ // limiting friction at both ends (same equations as the solution steps)
    for (const [sA, sB, how] of [[-1, 1, 'the foot slides away from the wall and the top slides down'], [1, -1, 'the foot slides toward the wall and the top slides up']]){
      const res = mu => { const det = sA * mu * sB * mu - 1, b1 = -m * V.a, b2 = W;
        const NA = (b1 * sB * mu - b2) / det, NB = (sA * mu * b2 - b1) / det, FA = sA * mu * NA, FB = sB * mu * NB;
        const M = (V.d - xA0) * (-W) - hG * (m * V.a) + (-xA0) * FB - yB0 * NB; // moments about A, cart frame
        return { M, NA, NB, FA, FB }; };
      let lo = 1e-6, hi = 3, rlo = res(lo).M, rhi = res(hi).M; if (rlo * rhi > 0) continue;
      for (let i = 0; i < 80; i++){ const mid = (lo + hi) / 2, r = res(mid).M; if (r * rlo > 0){ lo = mid; rlo = r; } else hi = mid; }
      const r = res(lo); if (r.NA > 0 && r.NB > 0) return { ok: true, mu: lo, how, sgn: sA, ...r };
    }
    return { ok: false };
  }
  makeClip({
    id: 'xa-7', speed: 0.5,
    controls: [
      { key: 'a', label: 'Acceleration a of the cart (to the left)', min: 0, max: 15, step: 0.1, value: 5, unit: 'ft/s²', dec: 2 },
      { key: 'd', label: 'Distance d of G from the wall', min: 0.5, max: 5, step: 0.01, value: 1.5, unit: 'ft', dec: 3 },
      { key: 'mu', label: 'Static friction μ_s', min: 0, max: 1, step: 0.01, value: 0.4, unit: '', dec: 3 }
    ],
    presets: C => [{ label: 'G on the ladder (d = 1.5 ft)', apply: () => C.set({ d: 1.5, a: 5, mu: 0.4 }) }, { label: 'Too little friction (μ_s = 0.2)', apply: () => C.set({ d: 1.5, a: 5, mu: 0.2 }) }, { label: 'Book data (d = 5 ft)', apply: () => C.set({ d: 5, a: 5, mu: 0.4 }) }],
    reset(st){
      const V = st.V; st.S0 = solveStatic(V); st.th = th0; st.w = 0; st.xA = xA0; st.lastT = 0; st.hold = undefined; st.end = '';
      const r = [V.d - xA0, hG]; st.p = r[0] * e(th0)[0] + r[1] * e(th0)[1]; st.q = r[0] * n(th0)[0] + r[1] * n(th0)[1];
      st.phase = st.S0.ok ? (V.mu >= st.S0.mu ? 'held' : 'slide') : 'tip'; st.F = null;
    },
    step(st){
      const V = st.V;
      if (st.hold !== undefined){ if (st.t > st.hold + 1.5) this_reset(st); return; }
      let dt = st.t - st.lastT; st.lastT = st.t;
      if (st.phase === 'held'){ if (st.t > 5) st.hold = st.t; return; }
      const hs = 1e-3;
      while (dt > 1e-12){
        const h = Math.min(hs, dt); dt -= h;
        const t = st.th, E = e(t), Nn = n(t), Ep = ep(t), Npp = np(t), Epp = epp(t), Nppp = npp(t), p = st.p, q = st.q;
        if (st.phase === 'slide'){
          // G = (L cos θ, 0) + p e + q n. Unknowns: θ̈, N_A, N_B. Kinetic friction opposes the sliding of each end.
          const Gp = [-L * Math.sin(t) + p * Ep[0] + q * Npp[0], p * Ep[1] + q * Npp[1]];
          const Gpp = [-L * Math.cos(t) + p * Epp[0] + q * Nppp[0], p * Epp[1] + q * Nppp[1]];
          const s = Math.abs(st.w) > 1e-9 ? Math.sign(st.w) : st.S0.sgn; // θ decreasing: foot slides right, top slides down
          const cA = s < 0 ? -V.mu : V.mu, cB = s < 0 ? V.mu : -V.mu;      // F_A = cA N_A, F_B = cB N_B
          const xA = L * Math.cos(t), yB = L * Math.sin(t);
          const G = [xA + p * E[0] + q * Nn[0], p * E[1] + q * Nn[1]];
          const rA = [xA - G[0], -G[1]], rB = [-G[0], yB - G[1]];
          // rows: x-Newton, y-Newton, Euler about G (body angle ψ = π − θ, so ψ̈ = −θ̈)
          const M = [[m * Gp[0], -cA, -1], [m * Gp[1], -1, -cB], [-IG, -(rA[0] * 1 - rA[1] * cA), -(rB[0] * cB - rB[1] * 1)]];
          const b = [m * V.a - m * Gpp[0] * st.w * st.w, -W - m * Gpp[1] * st.w * st.w, 0];
          const sol = solve3(M, b); if (!sol){ st.hold = st.t; break; }
          const [tdd, NA, NB] = sol;
          st.F = { NA, NB, FA: cA * NA, FB: cB * NB };
          if (NB < 0){ st.end = 'The top of the ladder has left the wall. The simulation stops here.'; st.hold = st.t; break; }
          st.w += tdd * h; st.th += st.w * h; st.xA = L * Math.cos(st.th);
          if (st.th < 25 * RAD){ st.end = 'The ladder has slid down to the floor of the cart.'; st.hold = st.t; break; }
        } else { // tip about the foot A, which sticks
          const r = [p * E[0] + q * Nn[0], p * E[1] + q * Nn[1]], IA = IG + m * (r[0] * r[0] + r[1] * r[1]);
          const Mz = r[0] * (-W) - r[1] * (m * V.a);                 // moment about A of the weight and of m a (cart frame)
          const tdd = -Mz / IA;                                      // ψ̈ = Mz / I_A and θ̈ = −ψ̈
          const rp = [p * Ep[0] + q * Npp[0], p * Ep[1] + q * Npp[1]], rpp = [p * Epp[0] + q * Nppp[0], p * Epp[1] + q * Nppp[1]];
          const aG = [rp[0] * tdd + rpp[0] * st.w * st.w, rp[1] * tdd + rpp[1] * st.w * st.w];
          const FA = m * aG[0] - m * V.a, NA = m * aG[1] + W;       // contact force at A from Newton's equation
          st.F = { NA, NB: 0, FA, FB: 0 };
          if (Math.abs(FA) > V.mu * NA){ st.end = 'The foot A would also start to slide here, so the simulation stops.'; st.hold = st.t; break; }
          st.w += tdd * h; st.th += st.w * h;
          const yTop = L * Math.sin(st.th); if (st.th > 90 * RAD && yTop < 1.2){ st.end = 'The ladder has tipped over backward onto the cart floor.'; st.hold = st.t; break; }
        }
      }
    },
    draw(st){
      const cv = $('xa-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 400, 470); fitView(ctx, w, h, nr ? [70, 0, 600, 400] : [0, 0, 640, 400]);
      const V = st.V, S = 17, fy = 372, base = fy - 22, k = 60 / W, wallX = 150;
      // ground scrolls to the right because the cart accelerates to the left (the view follows the cart)
      const Xc = -0.5 * V.a * Math.min(st.t, 6) ** 2;
      line(ctx, 0, fy, 640, fy, COL.fg, 2); hatch(ctx, 0, fy, 640, fy, 1, 9, 6);
      for (let xw = Math.floor((Xc - 20) / 5) * 5; xw < Xc + 40; xw += 5){ const x = wallX + (xw - Xc) * S; if (x > 0 && x < 640) line(ctx, x, fy, x, fy + 8, COL.muted, 1.4); }
      ctx.save(); ctx.fillStyle = '#c9c3b5'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
      ctx.fillRect(wallX - 14, base - 16 * S, 14, 16 * S + 10); ctx.strokeRect(wallX - 14, base - 16 * S, 14, 16 * S + 10);
      ctx.fillRect(wallX - 14, base, 26 * S, 10); ctx.strokeRect(wallX - 14, base, 26 * S, 10); ctx.restore();
      [wallX + 8, wallX + 26 * S - 26].forEach(x => { ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, fy - 6, 6, 0, 2 * Math.PI); ctx.fill(); });
      arrow(ctx, wallX + 23 * S, base - 60, wallX + 19 * S, base - 60, COL.c1, 2.6); txt(ctx, 'a', wallX + 18.6 * S, base - 62, { color: COL.c1, align: 'right' });
      // ladder, person and G in their current position (cart frame)
      const t = st.th, E = e(t), Nn = n(t), xA = st.phase === 'tip' ? xA0 : L * Math.cos(t);
      // the ladder is a 12 px strip whose outer edge runs from A (on the cart floor) to B (on the wall); its mid-plane is 6 px inside,
      // so the rails rest on the floor and the wall instead of entering them
      const off = [6 * Math.sin(t), -6 * Math.cos(t)];
      const P = (u, v) => [wallX + (xA + u * E[0] + v * Nn[0]) * S + off[0], base - (u * E[1] + v * Nn[1]) * S + off[1]]; // body point (mid-plane) → screen
      const Ax = wallX + xA * S, Ay = base, Bx = wallX + (xA + L * E[0]) * S, By = base - L * E[1] * S; // contact points
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = '#8d877a'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Bx + 2 * off[0], By + 2 * off[1]); ctx.lineTo(Ax + 2 * off[0], Ay + 2 * off[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      for (let i = 1; i < 15; i++){ const [x, y] = P(i, 0); ctx.fillStyle = '#8d877a'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 2 * Math.PI); ctx.fill(); }
      // person: feet on a rung, body up through G, head above it (drawn rigidly attached to the ladder)
      const up0 = [Math.sin(th0), Math.cos(th0)], uF = Math.max(1, st.p - 3.2);
      const G = [st.p, st.q], Hd = [st.p + 2.4 * up0[0], st.q + 2.4 * up0[1]], Hand = [Math.min(L - 0.3, st.p + 2.2), 0];
      const [fx, fy2] = P(uF, 0), [gx, gy] = P(G[0], G[1]), [hx, hy] = P(Hd[0], Hd[1]), [nx2, ny2] = P(Hand[0], Hand[1]);
      ctx.save(); ctx.strokeStyle = '#5b4a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx, fy2); ctx.lineTo(gx, gy); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((gx + hx) / 2, (gy + hy) / 2); ctx.lineTo(nx2, ny2); ctx.stroke();
      ctx.fillStyle = '#e9d9c4'; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx + 12, gy - 4, { font: 'italic 14px Georgia, serif' });
      arrow(ctx, gx, gy, gx, gy + W * k, COL.c2, 2.4); txt(ctx, 'W', gx + 8, gy + W * k - 4, { color: COL.c2, align: 'left' });
      txt(ctx, 'A', Ax + 12, Ay - 12, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', Bx + 16, By + 4, { font: 'italic 14px Georgia, serif' });
      // contact forces on the ladder (to scale). In the held case they are the limiting values that need μ_min.
      const F = st.phase === 'held' ? st.S0 : st.F;
      if (F){
        if (F.NA > 0.5) upArrow(ctx, Ax, Ay, F.NA * k, COL.c3, 'N_A', 1);
        hArrow(ctx, Ax, Ay - 3, F.FA * k, RED, 'F_A', 18);
        if (F.NB > 0.5 && By > base - 16 * S - 2){ arrow(ctx, Bx - F.NB * k, By, Bx, By, COL.c3, 2.6); txt(ctx, 'N_B', Bx - F.NB * k / 2, By - 14, { color: COL.c3 }); }
        if (Math.abs(F.FB * k) > 2){ if (F.FB > 0) arrow(ctx, Bx + 3, By + F.FB * k, Bx + 3, By, RED, 2.4); else arrow(ctx, Bx + 3, By, Bx + 3, By - F.FB * k, RED, 2.4); txt(ctx, 'F_B', Bx + 12, By + Math.abs(F.FB * k) / 2 + 8, { color: RED, align: 'left' }); }
      }
      const R = st.S0; let msg, col;
      if (st.end){ msg = st.end; col = RED; }
      else if (st.phase === 'held'){ msg = `μ_s = ${fmt(V.mu, 3)} is at least μ_min = ${fmt(R.mu, 3)}, so the ladder stays put while the cart accelerates.`; col = COL.c3; }
      else if (st.phase === 'slide'){ msg = `μ_s is below μ_min = ${fmt(R.mu, 3)}, so ${R.how}.`; col = RED; }
      else { msg = 'The wall would have to pull on the ladder, so the top leaves the wall and the ladder tips about A.'; col = RED; }
      txt(ctx, msg, nr ? 335 : 330, 16, { font: '600 13px system-ui', color: col });
      if (st.phase === 'held') txt(ctx, 'The forces shown are the limiting values, for which friction is fully used at both ends.', nr ? 335 : 330, 36, { font: '11px system-ui', color: COL.muted });
      statsEvery(st, 'xa-7-stats', () => R.ok ? [['μ_{s,min}', fmt(R.mu, 4), true], ['N_A (limiting)', fmt(R.NA, 4) + ' lb'], ['N_B (limiting)', fmt(R.NB, 4) + ' lb'], ['F_A (limiting)', fmt(R.FA, 4) + ' lb'], ['F_B (limiting)', fmt(R.FB, 4) + ' lb'], ['ladder angle θ', fmt(st.th / RAD, 3) + '°']] :
        [['result', 'no friction coefficient can hold the ladder', true], ['largest d for which the wall still pushes', fmt(xA0 - m * V.a * hG / W, 4) + ' ft'], ['ladder angle θ', fmt(st.th / RAD, 3) + '°']]);
    }
  });
  function this_reset(st){ st.t = 0; st.th = th0; st.w = 0; st.xA = xA0; st.lastT = 0; st.hold = undefined; st.end = ''; st.F = null; }
  function solve3(M, b){ // Cramer's rule
    const det = A => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    const D = det(M); if (Math.abs(D) < 1e-12) return null;
    return [0, 1, 2].map(j => det(M.map((row, i) => row.map((v, c) => c === j ? b[i] : v))) / D);
  }
})();

/* ---------------------------------------------------------
   5.A.8  Semicircular ring pinned at one end
   --------------------------------------------------------- */
(function(){
  const R = 0.5, rho = R * Math.sqrt(1 + 4 / (Math.PI * Math.PI)), phi0 = -Math.atan(Math.PI / 2); // G relative to O = ρ(sin φ, −cos φ)
  const pdd = p => -G0 * rho / (2 * R * R) * Math.sin(p);
  function reaction(p, w){ // pin force on the ring per unit mg, math axes (x right, y up)
    const rx = rho * Math.sin(p), ry = -rho * Math.cos(p), al = pdd(p);
    const ax = -al * ry - w * w * rx, ay = al * rx - w * w * ry;
    return [ax / G0, ay / G0 + 1];
  }
  makeClip({
    id: 'xa-8', speed: 0.5,
    reset(st){ st.s = [phi0, 0]; st.lastT = 0; st.hist = []; },
    step(st){
      let dt = st.t - st.lastT; st.lastT = st.t;
      st.s = stepN(s => [s[1], pdd(s[0])], st.s, dt, 0.0005);
      const [Ox, Oy] = reaction(st.s[0], st.s[1]); st.hist.push([st.t, Ox, Oy]);
      if (st.t > 4.2){ st.t = 0; st.lastT = 0; st.s = [phi0, 0]; st.hist = []; }
    },
    draw(st){
      const cv = $('xa-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [20, 10, 560, 360]);
      const S = 260, ox = 290, oy = 90, p = st.s[0], rot = p - phi0; // rotation of the ring, counterclockwise
      ceilingPin(ctx, ox, oy, 30);
      // the ring: in its starting position the center of curvature C is a distance R to the left of O
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(-rot);
      ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(-R * S, 0, R * S, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = COL.mass; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(-R * S, 0, R * S, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = COL.muted; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2 * R * S, 0); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.muted; ctx.beginPath(); ctx.arc(-R * S, 0, 2.5, 0, 2 * Math.PI); ctx.fill();
      // axis of symmetry from the center of curvature C to G, a distance 2R/π (G lies in the open space of the arc)
      ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(-R * S, 0); ctx.lineTo(-R * S, 2 * R / Math.PI * S); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      { const c = Math.cos(rot), s2 = Math.sin(rot), loc = (u, v) => [ox + u * c + v * s2, oy - u * s2 + v * c]; // rotated ring point → screen
        const [cx, cy] = loc(-R * S, 0), [mx, my] = loc(-R * S, R / Math.PI * S);
        txt(ctx, 'C', cx, cy - 14, { font: 'italic 14px Georgia, serif', color: COL.muted });
        txt(ctx, '2R/π', mx + 26, my, { font: 'italic 13px Georgia, serif', color: COL.c4 }); }
      pinDot(ctx, ox, oy); txt(ctx, 'O', ox + 18, oy + 6, { font: 'italic 14px Georgia, serif' });
      const gx = ox + rho * Math.sin(p) * S, gy = oy + rho * Math.cos(p) * S;
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx - 14, gy - 10, { font: 'italic 14px Georgia, serif' });
      const k = 40; arrow(ctx, gx, gy, gx, gy + k, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, gy + k - 4, { color: COL.c2, align: 'left' });
      const [Ox, Oy] = reaction(p, st.s[1]); arrow(ctx, ox, oy, ox + Ox * k, oy - Oy * k, RED, 3); txt(ctx, 'pin force', ox + Ox * k + 10, oy - Oy * k - 8, { color: RED, align: 'left', font: '600 12px system-ui' });
      plot($('xa-8-plot'), { xmin: 0, xmax: 4.2, ymin: -1.2, ymax: 2.6, xlabel: 'time t (s)', ylabel: 'pin force / mg', series: [{ pts: st.hist.map(r => [r[0], r[2]]), color: COL.c1, width: 2.4 }, { pts: st.hist.map(r => [r[0], r[1]]), color: COL.c3, width: 2, dash: [5, 4] }], hlines: [{ y: 0.5, color: COL.c1 }, { y: 1 / Math.PI, color: COL.c3 }], points: [{ x: st.t, y: Oy, color: COL.c1, r: 5 }, { x: st.t, y: Ox, color: COL.c3, r: 5 }] });
      statsEvery(st, 'xa-8-stats', () => [['α at release = g/(2R)', fmt(G0 / (2 * R), 4) + ' rad/s² (R = 0.5 m)', true], ['O_x at release = mg/π', fmt(1 / Math.PI, 4) + ' mg', true], ['O_y at release = mg/2', '0.5 mg', true], ['O_x now', fmt(Ox, 3) + ' mg'], ['O_y now', fmt(Oy, 3) + ' mg']]);
    }
  });
})();

subLabels();
})();
