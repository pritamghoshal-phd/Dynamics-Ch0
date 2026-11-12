/* =========================================================
   Chapter 2, rigid-body kinematics examples 2.A.1 to 2.A.5
   (2D animations; the 3D views in ch2-3dA1.js read the same clip state)
   ========================================================= */
(function(){

const VIEW = [['Play the motion', 'play'], ['Freeze at the instant in the problem', 'freeze']];
const viewChips = id => (C, st, reset) => chips5(id, VIEW, st, reset, 'mode');
// arrow from (x, y) along the screen vector (dx, dy); label just beyond the head; long arrows are clipped at Lmax
// dashed arrows (components) get their label beside the middle of the arrow, solid arrows beyond the head
function va(ctx, x, y, dx, dy, col, lab, wd = 2.6, dash, Lmax = 1e9, side = 1){
  let L = Math.hypot(dx, dy); if (L < 3) return [x, y];
  if (L > Lmax){ dx *= Lmax / L; dy *= Lmax / L; L = Lmax; }
  ctx.save(); if (dash) ctx.setLineDash(dash); arrow(ctx, x, y, x + dx, y + dy, col, wd); ctx.restore();
  if (lab){ const f = { color: col, font: 'italic 15px Georgia, serif' };
    if (dash) txt(ctx, lab, x + dx / 2 - side * 14 * dy / L, y + dy / 2 + side * 14 * dx / L, f);
    else txt(ctx, lab, x + dx + 14 * dx / L, y + dy + 14 * dy / L, f); }
  return [x + dx, y + dy];
}
// curved arrow around (x, y) for a rotation; dir = +1 counterclockwise, −1 clockwise
function spin(ctx, x, y, r, dir, col, lab){
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2;
  const a0 = -0.35 * Math.PI, a1 = a0 - dir * 0.75 * Math.PI; // canvas angles (y down)
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1, dir > 0); ctx.stroke();
  const hx = x + r * Math.cos(a1), hy = y + r * Math.sin(a1), tx = dir > 0 ? Math.sin(a1) : -Math.sin(a1), ty = dir > 0 ? -Math.cos(a1) : Math.cos(a1);
  ctx.beginPath(); ctx.moveTo(hx + 7 * tx, hy + 7 * ty); ctx.lineTo(hx - 4 * ty, hy + 4 * tx); ctx.lineTo(hx + 4 * ty, hy - 4 * tx); ctx.closePath(); ctx.fill(); ctx.restore();
  if (lab) txt(ctx, lab, x + (r + 14) * Math.cos(a0 + 0.2), y + (r + 14) * Math.sin(a0 + 0.2), { color: col });
}
function axesXY(ctx, x, y, L = 40){
  arrow(ctx, x, y, x + L, y, COL.muted, 1.5); arrow(ctx, x, y, x, y - L, COL.muted, 1.5);
  txt(ctx, 'x', x + L + 9, y, { color: COL.muted, font: 'italic 13px Georgia, serif' }); txt(ctx, 'y', x, y - L - 9, { color: COL.muted, font: 'italic 13px Georgia, serif' });
}
function tlabel(ctx, st, x, y, tStar, t, align = 'right'){
  const at = st.mode === 'freeze' || Math.abs(t - tStar) < 0.004;
  txt(ctx, at ? 'the instant in the problem' : `t − t* = ${fmt(t - tStar, 2)} s`, x, y, { font: '600 12px system-ui', color: at ? RED : COL.muted, align });
}
const ij = (v, d = 3) => `${fmt(Math.abs(v[0]) < 1e-9 ? 0 : v[0], d)} î ${v[1] < 0 ? '−' : '+'} ${fmt(Math.abs(v[1]), d)} ĵ`;

/* ---------- 2.A.1: acceleration of a rim point gives ω and α ---------- */
(function(){
  const r = 0.4, W = Math.sqrt(7.5), AL = -10, TS = 0.12, T = 0.39; // |ω| at the instant, α (rad/s²), instant and loop time (s)
  const DIRS = [['ω counterclockwise (as drawn)', 1], ['ω clockwise', -1]];
  makeClip({
    id: 'x2a-1', speed: 0.25,
    presets: (C, st, reset) => [...chips5('x2a-1', VIEW, st, reset, 'mode'), ...chips5('x2a-1', DIRS, st, reset, 'dir')],
    setup(st){ st.mode = 'play'; st.dir = 1; },
    reset(st){ document.querySelectorAll('#x2a-1-pre .chip').forEach((b, i) => b.classList.toggle('on', i < 2 ? VIEW[i][1] === st.mode : DIRS[i - 2][1] === st.dir)); },
    step(st){ if (st.mode === 'freeze') st.t = TS; else if (st.t > T) st.t = 0; },
    draw(st){
      const cv = $('x2a-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 360, 360); fitView(ctx, w, h, nr ? [40, 20, 460, 360] : [0, 0, 460, 360]);
      const t = st.mode === 'freeze' ? TS : Math.min(st.t, T), tau = t - TS, w0 = st.dir * W, om = w0 + AL * tau, th = Math.PI + w0 * tau + 0.5 * AL * tau * tau;
      st.th = th; st.om = om; st.al = AL; st.tt = t;
      const cx = 210, cy = 185, R = 120, S = R / r;
      // fixed support under the axle (the disk turns about the fixed axis through O)
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx + 13, cy + 26); ctx.lineTo(cx - 13, cy + 26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = 'rgba(201,196,182,.75)'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.rotate(-th); ctx.strokeStyle = 'rgba(60,60,60,.35)'; ctx.lineWidth = 2; for (let k = 1; k < 4; k++){ const a = k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * Math.cos(a), R * Math.sin(a)); ctx.stroke(); }
      ctx.strokeStyle = COL.fg; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.stroke(); ctx.restore();
      line(ctx, cx - R - 25, cy, cx + R + 40, cy, COL.muted, 1, [2, 4]); line(ctx, cx, cy + R + 10, cx, cy - R - 30, COL.muted, 1, [2, 4]);
      txt(ctx, 'x', cx + R + 50, cy, { color: COL.muted, font: 'italic 13px Georgia, serif' }); txt(ctx, 'y', cx, cy - R - 40, { color: COL.muted, font: 'italic 13px Georgia, serif' });
      pinDot(ctx, cx, cy); txt(ctx, 'O', cx + 14, cy - 13);
      const Px = cx + R * Math.cos(th), Py = cy - R * Math.sin(th);
      if (Math.abs(om) > 0.05) spin(ctx, cx, cy, R + 18, Math.sign(om), COL.c1, 'ω');
      // acceleration of P: normal part −ω² r toward O, tangential part α k × r, and their sum
      const k = 15, rx = Math.cos(th), ry = Math.sin(th);
      const an = [-om * om * r * rx, -om * om * r * ry], at = [-AL * r * ry, AL * r * rx], aP = [an[0] + at[0], an[1] + at[1]];
      const e1 = va(ctx, Px, Py, an[0] * k, -an[1] * k, COL.c3, 'ω²r', 1.8, [5, 4], 170);
      va(ctx, e1[0], e1[1], at[0] * k, -at[1] * k, COL.c4, 'αr', 1.8, [5, 4], 170);
      va(ctx, Px, Py, aP[0] * k, -aP[1] * k, RED, 'a_P', 3.2, null, 200);
      ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Px, Py, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
      txt(ctx, 'P', Px - 14 * rx, Py + 14 * ry - 4);
      tlabel(ctx, st, 452, 18, TS, t);
      statsEvery(st, 'x2a-1-stats', () => [['ω (counterclockwise +)', fmt(om, 4) + ' rad/s'], ['α', fmt(AL, 3) + ' rad/s² (clockwise)'], ['a_P', ij(aP) + ' m/s²', true], ['|a_P|', fmt(Math.hypot(...aP), 4) + ' m/s²']], 0.02);
      const pw = []; for (let i = 0; i <= 80; i++){ const q = T * i / 80; pw.push([q, w0 + AL * (q - TS)]); }
      plot($('x2a-1-plot'), { xmin: 0, xmax: T, ymin: -6, ymax: 6, xlabel: 'time t (s)', ylabel: 'ω (rad/s, ccw +)', series: [{ pts: pw, color: COL.c1, width: 2.4 }],
        vlines: [{ x: TS, color: RED, label: 'instant' }], hlines: [{ y: 0, color: COL.muted }], points: [{ x: t, y: om, color: COL.c1, r: 5 }] });
    }
  });
})();

/* ---------- 2.A.2: belt-driven pulley speeding up ---------- */
(function(){
  const Ro = 0.15, Ri = 0.075, TS = 0.05, T = 0.1, W = 20, AL = 300; // clockwise ω and α at the instant
  makeClip({
    id: 'x2a-2', speed: 0.1,
    presets: viewChips('x2a-2'),
    setup(st){ st.mode = 'play'; },
    reset(st){ mark5('x2a-2', st, 'mode', VIEW); },
    step(st){ if (st.mode === 'freeze') st.t = TS; else if (st.t > T + 0.02) st.t = 0; },
    draw(st){
      const cv = $('x2a-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 360, 330); fitView(ctx, w, h, nr ? [50, 40, 470, 330] : [0, 0, 580, 360]);
      const t = st.mode === 'freeze' ? TS : Math.min(st.t, T), tau = t - TS, om = W + AL * tau, phi = W * tau + 0.5 * AL * tau * tau; // clockwise
      st.om = om; st.phi = phi; st.tt = t;
      const cx = 190, cy = 185, S = 110 / Ro, R = Ro * S, r = Ri * S, xe = 560;
      // shaft support
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx + 12, cy + 22); ctx.lineTo(cx - 12, cy + 22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#d3cfc3'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a9a496'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.rotate(phi); ctx.strokeStyle = 'rgba(40,40,40,.45)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(r * Math.cos(a), r * Math.sin(a)); ctx.lineTo(R * Math.cos(a), R * Math.sin(a)); ctx.stroke(); } ctx.restore();
      // belt: bottom run moves left, wraps the left half of the inner disk, top run moves right
      const Lb = xe - cx, La = Math.PI * r, s = (phi + W * TS - 0.5 * AL * TS * TS) * r; // belt travel (px), zero at t = 0
      ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xe, cy + r); ctx.lineTo(cx, cy + r); ctx.arc(cx, cy, r, Math.PI / 2, 3 * Math.PI / 2); ctx.lineTo(xe, cy - r); ctx.stroke(); ctx.restore();
      const beltPt = u => u < Lb ? [xe - u, cy + r, 0] : u < Lb + La ? (a => [cx + r * Math.cos(a), cy + r * Math.sin(a), 1])(Math.PI / 2 + (u - Lb) / r) : [cx + (u - Lb - La), cy - r, 2];
      ctx.save(); ctx.strokeStyle = '#f2d36b'; ctx.lineWidth = 2;
      for (let u = s % 22; u < 2 * Lb + La; u += 22){ const p = beltPt(u); const d = p[2] === 1 ? [Math.cos(Math.PI / 2 + (u - Lb) / r), Math.sin(Math.PI / 2 + (u - Lb) / r)] : [0, 1]; ctx.beginPath(); ctx.moveTo(p[0] - 3 * d[0], p[1] - 3 * d[1]); ctx.lineTo(p[0] + 3 * d[0], p[1] + 3 * d[1]); ctx.stroke(); }
      ctx.restore();
      const xv = nr ? 400 : xe - 50; va(ctx, xv, cy - r - 22, 40, 0, COL.c1, 'v', 2.2); va(ctx, xv + 40, cy + r + 22, -40, 0, COL.c1, 'v', 2.2);
      pinDot(ctx, cx, cy); txt(ctx, 'O', cx + 12, cy + 15);
      spin(ctx, cx, cy, R + 16, -1, COL.c1, 'ω, α');
      // material points A (outer rim, bottom at the instant) and B (inner rim, left at the instant), point C on the top run of the belt
      const k = 1.1, cw = phi, mat = (rad, a0) => { const a = a0 - cw; return [rad * Math.cos(a), rad * Math.sin(a)]; };
      const acc = (p) => [-om * om * p[0] + AL * p[1], -om * om * p[1] - AL * p[0]]; // α = −AL k (clockwise), ω² inward
      const pA = mat(Ro, -Math.PI / 2), pB = mat(Ri, Math.PI), aA = acc(pA), aB = acc(pB), aC = AL * Ri;
      const sc = ([x, y]) => [cx + x * S, cy - y * S];
      const A = sc(pA), B = sc(pB), Cy = cy - r, xC = cx + 150 + phi * r; // C rides on the top run of the belt
      va(ctx, A[0], A[1], aA[0] * k, -aA[1] * k, RED, 'a_A', 3, null, 170); va(ctx, B[0], B[1], aB[0] * k, -aB[1] * k, COL.c2, 'a_B', 3, null, 170); va(ctx, xC, Cy - 9, aC * k, 0, COL.c3, 'a_C', 3, null, 170);
      const ib = [cx - B[0], cy - B[1]], lb = Math.hypot(...ib) || 1, bl = [ib[0] / lb * 0.34 + ib[1] / lb * 0.94, ib[1] / lb * 0.34 - ib[0] / lb * 0.94];
      [[A, 'A', 0, 16], [B, 'B', 17 * bl[0], 17 * bl[1]]].forEach(([p, n, dx, dy]) => { ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); txt(ctx, n, p[0] + dx, p[1] + dy); });
      ctx.save(); ctx.fillStyle = COL.c3; ctx.beginPath(); ctx.arc(xC, Cy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); txt(ctx, 'C', xC, Cy + 17);
      tlabel(ctx, st, nr ? 462 : 572, nr ? 52 : 18, TS, t);
      statsEvery(st, 'x2a-2-stats', () => [['ω (clockwise)', fmt(om, 4) + ' rad/s'], ['α (clockwise)', fmt(AL, 4) + ' rad/s²'], ['|a_A|', fmt(Math.hypot(...aA), 4) + ' m/s²', true],
        ['a_B', ij(aB) + ' m/s²', true], ['a_C', fmt(aC, 4) + ' î m/s²', true]], 0.004);
      const pa = [], pb = []; for (let i = 0; i <= 80; i++){ const q = T * i / 80, o = W + AL * (q - TS); pa.push([q, Math.hypot(o * o * Ro, AL * Ro)]); pb.push([q, Math.hypot(o * o * Ri, AL * Ri)]); }
      plot($('x2a-2-plot'), { xmin: 0, xmax: T, ymin: 0, ymax: 200, xlabel: 'time t (s)', ylabel: 'acceleration (m/s²)', series: [{ pts: pa, color: RED, width: 2.4 }, { pts: pb, color: COL.c2, width: 2 }],
        vlines: [{ x: TS, color: RED, label: 'instant' }], hlines: [{ y: 75, color: COL.muted }], points: [{ x: t, y: Math.hypot(...aA), color: RED, r: 5 }, { x: t, y: Math.hypot(...aB), color: COL.c2, r: 4 }] });
    }
  });
})();

/* ---------- 2.A.3: bent bar turning about a vertical shaft (top view) ---------- */
(function(){
  const rP = [0.5, 0.25], TS = 0.5, T = 1.0, W = 2, AL = 3;
  makeClip({
    id: 'x2a-3', speed: 0.5,
    presets: viewChips('x2a-3'),
    setup(st){ st.mode = 'play'; },
    reset(st){ mark5('x2a-3', st, 'mode', VIEW); },
    step(st){ if (st.mode === 'freeze') st.t = TS; else if (st.t > T + 0.2) st.t = 0; },
    draw(st){
      const cv = $('x2a-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 420, 400); fitView(ctx, w, h, nr ? [80, 10, 520, 400] : [0, 0, 520, 470]);
      const t = st.mode === 'freeze' ? TS : Math.min(st.t, T), tau = t - TS, om = W + AL * tau, th = W * tau + 0.5 * AL * tau * tau;
      st.th = th; st.om = om; st.tt = t;
      const ox = 250, oy = 250, S = 360, c = Math.cos(th), s = Math.sin(th);
      const R = v => [v[0] * c - v[1] * s, v[0] * s + v[1] * c], sc = v => [ox + v[0] * S, oy - v[1] * S];
      // fixed axes and the circle traced by P
      line(ctx, ox - 30, oy, ox + 250, oy, COL.muted, 1, [3, 4]); line(ctx, ox, oy + 30, oy * 0 + ox, oy - 240, COL.muted, 1, [3, 4]);
      txt(ctx, 'x', ox + 258, oy, { color: COL.muted, font: 'italic 13px Georgia, serif' }); txt(ctx, 'y', ox, oy - 248, { color: COL.muted, font: 'italic 13px Georgia, serif' });
      ctx.save(); ctx.strokeStyle = 'rgba(120,120,120,.35)'; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.arc(ox, oy, Math.hypot(...rP) * S, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      // the bent bar: O → corner along the arm, corner → P perpendicular to it
      const K = sc(R([rP[0], 0])), Pp = sc(R(rP));
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(...K); ctx.lineTo(...Pp); ctx.stroke();
      ctx.strokeStyle = COL.mass; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#b8b4a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(...Pp, 9, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#6d6a62'; ctx.strokeStyle = COL.fg; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, 'O', ox - 18, oy + 16);
      { const ux = Pp[0] - ox, uy = Pp[1] - oy, ul = Math.hypot(ux, uy) || 1; txt(ctx, 'P', Pp[0] + 22 * ux / ul, Pp[1] + 22 * uy / ul); }   // outward from O: the bar and a_P point inward, v_P along the circle
      spin(ctx, ox, oy, 32, 1, COL.c1, 'ω, α');
      // velocity and acceleration of P
      const r = R(rP), v = [-om * r[1], om * r[0]], aT = [-AL * r[1], AL * r[0]], aN = [-om * om * r[0], -om * om * r[1]], a = [aT[0] + aN[0], aT[1] + aN[1]];
      const kv = 55, ka = 24;
      va(ctx, Pp[0], Pp[1], v[0] * kv, -v[1] * kv, COL.c2, 'v_P', 3, null, 150);
      const e = va(ctx, Pp[0], Pp[1], aT[0] * ka, -aT[1] * ka, COL.c4, 'α×r', 1.8, [5, 4], 150);
      va(ctx, e[0], e[1], aN[0] * ka, -aN[1] * ka, COL.c3, '−ω²r', 1.8, [5, 4], 170);
      va(ctx, Pp[0], Pp[1], a[0] * ka, -a[1] * ka, RED, 'a_P', 3.2, null, 190);
      txt(ctx, 'top view (looking down the shaft)', nr ? 88 : 10, nr ? 392 : 18, { font: '12px system-ui', color: COL.muted, align: 'left' });
      tlabel(ctx, st, 512, 18, TS, t);
      statsEvery(st, 'x2a-3-stats', () => [['ω (counterclockwise from above)', fmt(om, 4) + ' rad/s'], ['α', fmt(AL, 3) + ' rad/s²'],
        ['v_P', ij(v) + ' m/s', true], ['a_P', ij(a) + ' m/s²', true], ['|v_P|, |a_P|', fmt(Math.hypot(...v), 4) + ' m/s, ' + fmt(Math.hypot(...a), 4) + ' m/s²']], 0.02);
      const pv = [], pa = []; const Lr = Math.hypot(...rP);
      for (let i = 0; i <= 80; i++){ const q = T * i / 80, o = W + AL * (q - TS); pv.push([q, o * Lr]); pa.push([q, Lr * Math.hypot(AL, o * o)]); }
      plot($('x2a-3-plot'), { xmin: 0, xmax: T, ymin: 0, ymax: 8, xlabel: 'time t (s)', ylabel: 'speed (m/s), acceleration (m/s²)', series: [{ pts: pv, color: COL.c2, width: 2.2 }, { pts: pa, color: RED, width: 2.4 }],
        vlines: [{ x: TS, color: RED, label: 'instant' }], points: [{ x: t, y: om * Lr, color: COL.c2, r: 4 }, { x: t, y: Lr * Math.hypot(AL, om * om), color: RED, r: 5 }] });
    }
  });
})();

/* ---------- 2.A.4: compound gear between two racks ---------- */
(function(){
  const r = 0.1, R = 0.16, TS = 0.3, T = 0.6, vB = -0.6;
  const vA = t => 0.2 + 2 * t, xA = t => 0.2 * t + t * t;              // rack A: speed 0.8 m/s at the instant, accelerating at 2 m/s²
  const om = t => (vB - vA(t)) / (R + r), th = t => (vB * t - xA(t)) / (R + r); // counterclockwise +
  const vO = t => vA(t) + om(t) * r, xO = t => xA(t) + th(t) * r, AL = -2 / (R + r), aO = 2 + AL * r;
  makeClip({
    id: 'x2a-4', speed: 0.25,
    presets: viewChips('x2a-4'),
    setup(st){ st.mode = 'play'; },
    reset(st){ mark5('x2a-4', st, 'mode', VIEW); },
    step(st){ if (st.mode === 'freeze') st.t = TS; else if (st.t > T + 0.15) st.t = 0; },
    draw(st){
      const cv = $('x2a-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 330, 300); fitView(ctx, w, h, nr ? [90, 30, 530, 300] : [0, 0, 620, 330]);
      const t = st.mode === 'freeze' ? TS : Math.min(st.t, T), S = 500, x0 = 230, cy = 165;
      const cx = x0 + (xO(t) - xO(TS)) * S, phi = th(t) - th(TS);
      st.xO = xO(t) - xO(TS); st.phi = phi; st.xA = xA(t) - xA(TS); st.xB = vB * (t - TS); st.tt = t;
      // gear: outer gear R behind, inner gear r in front, both turn together
      ctx.save(); ctx.translate(cx, cy);
      const teeth = (rad, n, col) => { ctx.fillStyle = col; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let k = 0; k < n; k++){ const a = -phi + 2 * Math.PI * k / n, d = Math.PI / n; ctx.lineTo((rad - 4) * Math.cos(a - d * 0.5), -(rad - 4) * Math.sin(a - d * 0.5)); ctx.lineTo(rad * Math.cos(a - d * 0.3), -rad * Math.sin(a - d * 0.3)); ctx.lineTo(rad * Math.cos(a + d * 0.3), -rad * Math.sin(a + d * 0.3)); ctx.lineTo((rad - 4) * Math.cos(a + d * 0.5), -(rad - 4) * Math.sin(a + d * 0.5)); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); };
      teeth(R * S, 40, '#d3cfc3'); teeth(r * S, 26, '#a9a496');
      ctx.strokeStyle = 'rgba(40,40,40,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18 * Math.cos(phi), -18 * Math.sin(phi)); ctx.lineTo((R * S - 6) * Math.cos(phi), -(R * S - 6) * Math.sin(phi)); ctx.stroke(); ctx.restore();
      // racks (teeth move with each rack)
      const rack = (y, xs, top, label, col) => { ctx.save(); ctx.fillStyle = '#8b8f98'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; const yb = top ? y - 16 : y; ctx.fillRect(20, yb, 590, 16); ctx.strokeRect(20, yb, 590, 16);
        ctx.fillStyle = '#8b8f98'; for (let x = 20 + ((xs * S) % 12 + 12) % 12; x < 606; x += 12){ ctx.beginPath(); const yt = top ? y : y; ctx.moveTo(x, yt); ctx.lineTo(x + 3, yt + (top ? 4 : -4)); ctx.lineTo(x + 6, yt); ctx.fill(); } ctx.restore();
        txt(ctx, label, nr ? 515 : 600, top ? y - 28 : y + 28, { font: 'italic bold 15px Georgia, serif', color: col }); };
      rack(cy - r * S, xA(t), true, 'A', COL.fg); rack(cy + R * S, vB * t, false, 'B', COL.fg);
      va(ctx, nr ? 400 : 470, cy - r * S - 36, vA(t) * 60, 0, COL.c2, 'v_A', 2.4); va(ctx, nr ? 480 : 530, cy + R * S + 30, vB * 60, 0, COL.c2, 'v_B', 2.4);
      txt(ctx, 'no slip', 120, cy - r * S + 12, { font: 'italic 12px Georgia, serif', color: COL.muted }); txt(ctx, 'no slip', 120, cy + R * S - 12, { font: 'italic 12px Georgia, serif', color: COL.muted });
      pinDot(ctx, cx, cy); txt(ctx, 'O', cx - 14, cy + 15);
      txt(ctx, nr ? 'Rack A is in front of the outer gear (it meshes with the inner gear).' : 'Rack A runs in front of the outer gear and meshes only with the inner gear.', nr ? 95 : 20, 318, { font: '11px system-ui, sans-serif', color: COL.muted, align: 'left' });
      // velocity profile on the vertical diameter: v_A at the top contact, v_O at the center, v_B at the bottom contact
      va(ctx, cx, cy, vO(t) * 60, 0, COL.c1, 'v_O', 2.2);
      // material point P (on the outer rim, to the right of O at the instant)
      const a = phi, p = [R * Math.cos(a), R * Math.sin(a)], o = om(t), vP = [vO(t) - o * p[1], o * p[0]], aP = [aO - AL * p[1] - o * o * p[0], AL * p[0] - o * o * p[1]];
      const Px = cx + p[0] * S, Py = cy - p[1] * S;
      va(ctx, Px, Py, vP[0] * 80, -vP[1] * 80, COL.c2, 'v_P', 3, null, 140); va(ctx, Px, Py, aP[0] * 18, -aP[1] * 18, RED, 'a_P', 3.2, null, 170);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Px, Py, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, 'P', Px + 12, Py + 12, { font: 'italic bold 15px Georgia, serif' });
      tlabel(ctx, st, nr ? 522 : 612, nr ? 40 : 14, TS, t);
      statsEvery(st, 'x2a-4-stats', () => [['ω', fmt(o, 4) + ' rad/s (counterclockwise +)'], ['α', fmt(AL, 4) + ' rad/s²'], ['v_O', fmt(vO(t), 4) + ' î m/s'],
        ['v_P', ij(vP, 4) + ' m/s', true], ['a_P', ij(aP, 4) + ' m/s²', true]], 0.02);
      const pw = []; for (let i = 0; i <= 60; i++){ const q = T * i / 60; pw.push([q, om(q)]); }
      plot($('x2a-4-plot'), { xmin: 0, xmax: T, ymin: -8, ymax: 0, xlabel: 'time t (s)', ylabel: 'ω (rad/s, ccw +)', series: [{ pts: pw, color: COL.c1, width: 2.4 }],
        vlines: [{ x: TS, color: RED, label: 'instant' }], points: [{ x: t, y: o, color: COL.c1, r: 5 }] });
    }
  });
})();

/* ---------- 2.A.5: wheel rolling without slip and slowing down ---------- */
(function(){
  const r = 2, TS = 0.5, T = 0.5 + 5 / 3, v0 = 6.5, a0 = -3;          // ft, s; v_O = 5 ft/s at the instant
  const vO = t => Math.max(0, v0 + a0 * t), xO = t => { const q = Math.min(t, T); return v0 * q + 0.5 * a0 * q * q; };
  const angP = t => Math.PI / 2 - (xO(t) - xO(TS)) / r;                // angle of OP from +x (rolls clockwise)
  makeClip({
    id: 'x2a-5', speed: 0.5,
    presets: viewChips('x2a-5'),
    setup(st){ st.mode = 'play'; },
    reset(st){ mark5('x2a-5', st, 'mode', VIEW); },
    step(st){ if (st.mode === 'freeze') st.t = TS; else if (st.t > T + 0.8) st.t = 0; },
    draw(st){
      const cv = $('x2a-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const t = st.mode === 'freeze' ? TS : Math.min(st.t, T), S = 40, gy = 290, x0 = 70 + r * S;
      const cx = x0 + xO(t) * S, nr = nar(cv, w, 320, 300);
      fitView(ctx, w, h, nr ? [cx - 200, 50, cx + 200, 320] : [0, 0, 640, 320]);
      const cy = gy - r * S, om = -vO(t) / r, al = t < T ? -a0 / r : 0, aOx = t < T ? a0 : 0, ph = angP(t);
      st.xO = xO(t); st.ph = ph; st.tt = t; st.om = om;
      line(ctx, 10, gy, 630, gy, COL.fg, 2); hatch(ctx, 630, gy, 10, gy, -1);
      // path of P (a curtate-free cycloid: P is on the rim)
      ctx.save(); ctx.strokeStyle = 'rgba(138,63,209,.45)'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 120; i++){ const q = T * i / 120, a = angP(q); const X = x0 + xO(q) * S + r * S * Math.cos(a), Y = cy - r * S * Math.sin(a); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(cx, cy); const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, r * S); g.addColorStop(0, '#e7e3d8'); g.addColorStop(1, '#9d988c');
      ctx.fillStyle = g; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * S * Math.cos(ph), -r * S * Math.sin(ph)); ctx.stroke(); ctx.restore();
      pinDot(ctx, cx, cy); txt(ctx, 'O', cx - 17 * Math.cos(ph) - (Math.cos(ph) > 0.7 ? 0 : 6), cy + 17 * Math.sin(ph) + 6);
      if (vO(t) > 0.05) va(ctx, cx, cy, vO(t) * 14, 0, COL.c1, 'v_O', 2.6);
      const p = [r * Math.cos(ph), r * Math.sin(ph)], Px = cx + p[0] * S, Py = cy - p[1] * S, k = 8;
      const aO = [aOx, 0], aT = [-al * p[1], al * p[0]], aN = [-om * om * p[0], -om * om * p[1]], aP = [aO[0] + aT[0] + aN[0], aT[1] + aN[1]];
      let e = va(ctx, Px, Py, aO[0] * k, 0, COL.muted, 'a_O', 1.8, [5, 4]);
      e = va(ctx, e[0], e[1], aT[0] * k, -aT[1] * k, COL.c3, 'α×r', 1.8, [5, 4]);
      va(ctx, e[0], e[1], aN[0] * k, -aN[1] * k, COL.c4, '−ω²r', 1.8, [5, 4]);
      va(ctx, Px, Py, aP[0] * k, -aP[1] * k, RED, 'a_P', 3.2);
      ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Px, Py, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); txt(ctx, 'P', Px + 15 * Math.cos(ph) + 8, Py - 15 * Math.sin(ph) - 6);
      tlabel(ctx, st, nr ? cx + 192 : 632, nr ? 64 : 16, TS, t);
      statsEvery(st, 'x2a-5-stats', () => [['v_O', fmt(vO(t), 4) + ' ft/s'], ['ω', fmt(om, 4) + ' rad/s (counterclockwise +)'], ['α', fmt(al, 4) + ' rad/s²'],
        ['a_P', ij(aP, 4) + ' ft/s²', true], ['|a_P|', fmt(Math.hypot(...aP), 4) + ' ft/s²', true]], 0.03);
      const pa = []; for (let i = 0; i <= 100; i++){ const q = T * i / 100, a = angP(q), o = -vO(q) / r, pp = [r * Math.cos(a), r * Math.sin(a)]; pa.push([q, Math.hypot(a0 - (-a0 / r) * pp[1] - o * o * pp[0], (-a0 / r) * pp[0] - o * o * pp[1])]); }
      plot($('x2a-5-plot'), { xmin: 0, xmax: T, ymin: 0, ymax: 30, xlabel: 'time t (s)', ylabel: 'acceleration of P (ft/s²)', series: [{ pts: pa, color: RED, width: 2.4 }],
        vlines: [{ x: TS, color: RED, label: 'instant' }], points: [{ x: t, y: Math.hypot(...aP), color: RED, r: 5 }] });
    }
  });
})();

subLabels();
})();
