/* =========================================================
   Chapter 2, Section B examples: instant centers of zero velocity (2.B.1 to 2.B.8)
   Every clip stores its geometry in st.g (metres, y up) so that the 3D views in ch2-3dB.js can mirror it.
   ========================================================= */
(function(){

const VIO = '#8a3fd1', VEL = '#2457d6', VEL2 = '#17915a', ROSE = '#b42346';
const kx = (w, r) => [-w * r[1], w * r[0]];                       // (ω k) × r
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]], add2 = (a, b) => [a[0] + b[0], a[1] + b[1]], mul2 = (a, s) => [a[0] * s, a[1] * s];
const len2 = a => Math.hypot(a[0], a[1]);
const solve2 = (a, b, c, d, e, f) => { const D = a * d - b * c; return [(e * d - b * f) / D, (a * f - e * c) / D]; }; // [a b; c d] x = [e; f]
// intersection of the lines P + s u and Q + t v (null when they are parallel)
function meet(P, u, Q, v){ const D = u[0] * (-v[1]) - (-v[0]) * u[1]; if (Math.abs(D) < 1e-9) return null;
  const s = ((Q[0] - P[0]) * (-v[1]) - (-v[0]) * (Q[1] - P[1])) / D; return [P[0] + s * u[0], P[1] + s * u[1]]; }
// intersection of two circles; side = +1 or −1 picks one of the two solutions (left / right of P→Q)
function circles(P, r1, Q, r2, side){ const d = len2(sub2(Q, P)), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const ex = sub2(Q, P).map(c => c / d), M = add2(P, mul2(ex, a)); return [M[0] - side * hh * ex[1], M[1] + side * hh * ex[0]]; }
const rotSense = w => Math.abs(w) < 1e-9 ? '' : w > 0 ? ' counterclockwise' : ' clockwise';
const freezeChips = (st, reset, extra = []) => [{ label: '▶ Play the motion', apply: () => { st.freeze = false; reset(); } },
  { label: 'Freeze at the instant in the problem', apply: () => { st.freeze = true; reset(); } }, ...extra];

/* ---------- drawing helpers ---------- */
function icDot(ctx, x, y, lab){
  ctx.save(); ctx.fillStyle = VIO; ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(x, y, 11, 0, 2 * Math.PI); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = VIO; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
  if (lab) txt(ctx, lab, x + 18, y - 18, { color: VIO, font: 'italic 14px Georgia, serif', align: 'left' });
}
// velocity arrow from screen point (x, y) for a world velocity (vx, vy) with k px per m/s
function vArrow(ctx, x, y, v, k, col, lab, opt = {}){
  const L = len2(v) * k; if (L < 3) return;
  const ex = x + v[0] * k, ey = y - v[1] * k; arrow(ctx, x, y, ex, ey, col, opt.w || 2.6);
  if (lab && L > 24){ const u = [v[0] / len2(v), -v[1] / len2(v)]; txt(ctx, lab, ex + u[0] * 16 + (opt.dx || 0), ey + u[1] * 16 + (opt.dy || 0), { color: col, font: 'italic 14px Georgia, serif' }); }
}
// small right-angle mark at P between the unit screen directions a and b
function rightMark(ctx, x, y, a, b, s = 8, col = VIO){
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + a[0] * s, y + a[1] * s); ctx.lineTo(x + a[0] * s + b[0] * s, y + a[1] * s + b[1] * s); ctx.lineTo(x + b[0] * s, y + b[1] * s); ctx.stroke(); ctx.restore();
}
// dashed construction line from the IC to a point, with the right-angle mark against the point's velocity
function icRay(ctx, I, P, v){
  line(ctx, I[0], I[1], P[0], P[1], VIO, 1.3, [5, 4]);
  const L = Math.hypot(P[0] - I[0], P[1] - I[1]); if (L < 14 || len2(v) < 1e-6) return;
  const a = [(I[0] - P[0]) / L, (I[1] - P[1]) / L], b = [v[0] / len2(v), -v[1] / len2(v)]; rightMark(ctx, P[0], P[1], a, b);
}
// curved arrow showing a rotation sense around (x, y)
function spin(ctx, x, y, r, ccw, col, lab){
  const a0 = -0.35 * Math.PI, a1 = a0 + 1.35 * Math.PI;
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke();
  const ae = ccw ? a0 : a1, tx = ccw ? Math.sin(ae) : -Math.sin(ae), ty = ccw ? -Math.cos(ae) : Math.cos(ae), px = x + r * Math.cos(ae), py = y + r * Math.sin(ae);
  ctx.beginPath(); ctx.moveTo(px + tx * 9, py + ty * 9); ctx.lineTo(px - ty * 5, py + tx * 5); ctx.lineTo(px + ty * 5, py - tx * 5); ctx.closePath(); ctx.fill(); ctx.restore();
  if (lab) txt(ctx, lab, x + r + 14, y - r * 0.6, { color: col, font: 'italic 14px Georgia, serif', align: 'left' });
}
// link drawn as a rounded bar between two screen points
function link(ctx, P, Q, wd = 12, fill = '#cfc8b4'){
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = wd + 3; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = wd; ctx.stroke(); ctx.restore();
}
// pin bracket fixed to a vertical wall; dir = −1 wall on the left of the pin, +1 on the right
function wallPin(ctx, x, y, dir, gap = 30){
  const wx = x + dir * gap;
  ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath();
  ctx.moveTo(wx, y - 13); ctx.lineTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.lineTo(wx, y + 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  line(ctx, wx, y - 26, wx, y + 26, COL.fg, 2); hatch(ctx, wx, dir > 0 ? y + 26 : y - 26, wx, dir > 0 ? y - 26 : y + 26, 1, 7, 6);
  pinDot(ctx, x, y);
}
function roller(ctx, x, y, r = 8){ ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); pinDot(ctx, x, y); }
const L14 = { font: 'italic 14px Georgia, serif' };
// label placed on the side of point P (screen) away from the given screen directions (links, arrows, walls meeting at P)
function awayTxt(ctx, s, P, dirs, d = 20, opt = L14){
  let ux = 0, uy = 0; dirs.forEach(v => { const L = Math.hypot(v[0], v[1]) || 1; ux += v[0] / L; uy += v[1] / L; });
  let L = Math.hypot(ux, uy); if (L < 0.2){ ux = -dirs[0][1]; uy = dirs[0][0]; L = Math.hypot(ux, uy) || 1; }
  txt(ctx, s, P[0] - ux / L * d, P[1] - uy / L * d, opt);
}

/* =========================================================
   2.B.1  Four-bar linkage: IC of the coupler AB is at the pivot D
   ========================================================= */
makeClip({
  id: 'x2b-1', speed: 0.25,
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 500, 390]);
    const S = 150, ox = 100, oy = 150, X = x => ox + S * x, Y = y => oy - S * y, P = p => [X(p[0]), Y(p[1])];
    const L = 1, D = [1.75, 0], amp = 0.9, w0 = 3, Tp = 2 * Math.PI * amp / w0;
    const tau = st.freeze ? 0 : st.t % Tp, ph = amp * Math.sin(w0 * tau / amp), wOA = w0 * Math.cos(w0 * tau / amp);
    const geo = q => { const A = [L * Math.cos(q), L * Math.sin(q)], B = circles(A, L, D, 1.25, 1), Bl = B[1] < 0 ? B : circles(A, L, D, 1.25, -1); return { A, B: Bl }; };
    const { A, B } = geo(ph), vA = kx(wOA, A);
    const [wAB, wDB] = solve2(kx(1, sub2(B, A))[0], -kx(1, sub2(B, D))[0], kx(1, sub2(B, A))[1], -kx(1, sub2(B, D))[1], -vA[0], -vA[1]);
    const vB = kx(wDB, sub2(B, D)), IC = meet([0, 0], A, D, sub2(B, D));
    st.g = { A, B, D, ph, IC, wAB, wDB, vA, vB };
    // ground: two wall brackets, and the dotted line O–D
    line(ctx, X(0), Y(0), X(D[0]), Y(0), COL.muted, 1, [2, 4]);
    // construction: line OA and line DB, both extended, meet at the IC of AB
    const ext = (Q, R, s) => [Q[0] + (R[0] - Q[0]) * s, Q[1] + (R[1] - Q[1]) * s];
    if (IC && Math.abs(IC[0]) < 6 && Math.abs(IC[1]) < 6){
      const icS = P(IC);
      line(ctx, X(0), Y(0), icS[0], icS[1], VIO, 1.2, [3, 4]); line(ctx, X(D[0]), Y(D[1]), icS[0], icS[1], VIO, 1.2, [3, 4]);
      icRay(ctx, icS, P(A), vA); icRay(ctx, icS, P(B), vB);
      if (icS[0] > -20 && icS[0] < 520 && icS[1] > -20 && icS[1] < 410){ icDot(ctx, icS[0], icS[1]); awayTxt(ctx, 'IC_AB', icS, [[X(0) - icS[0], Y(0) - icS[1]], [X(D[0]) - icS[0], Y(D[1]) - icS[1]], [X(A[0]) - icS[0], Y(A[1]) - icS[1]], [X(B[0]) - icS[0], Y(B[1]) - icS[1]]], 40, { color: VIO, font: 'italic 14px Georgia, serif' }); }
      else txt(ctx, 'IC_AB lies outside the picture', 490, 375, { color: VIO, font: '12px system-ui', align: 'right' });
    } else txt(ctx, 'OA and DB are parallel: IC_AB is at infinity (AB translates)', 490, 375, { color: VIO, font: '12px system-ui', align: 'right' });
    link(ctx, P([0, 0]), P(A)); link(ctx, P(A), P(B)); link(ctx, P(D), P(B));
    wallPin(ctx, X(0), Y(0), -1); wallPin(ctx, X(D[0]), Y(D[1]), 1);
    pinDot(ctx, ...P(A)); pinDot(ctx, ...P(B));
    txt(ctx, 'O', X(0) - 6, Y(0) - 22, L14); txt(ctx, 'D', X(D[0]) + 6, Y(0) - 22, L14);
    const As = P(A), Bs = P(B), Is = IC ? P(IC) : null, dA = [[-As[0] + X(0), -As[1] + Y(0)], [Bs[0] - As[0], Bs[1] - As[1]], [vA[0], -vA[1]]], dB = [[As[0] - Bs[0], As[1] - Bs[1]], [X(D[0]) - Bs[0], Y(D[1]) - Bs[1]], [vB[0], -vB[1]]];
    if (Is && Math.abs(IC[0]) < 6){ dA.push([Is[0] - As[0], Is[1] - As[1]]); dB.push([Is[0] - Bs[0], Is[1] - Bs[1]]); }
    awayTxt(ctx, 'A', As, dA, 26); awayTxt(ctx, 'B', Bs, dB, 30);
    spin(ctx, X(0), Y(0), 22, wOA > 0, COL.fg);
    vArrow(ctx, X(A[0]), Y(A[1]), vA, 22, VEL, 'v_A'); vArrow(ctx, X(B[0]), Y(B[1]), vB, 22, VEL2, 'v_B');
    txt(ctx, st.freeze ? 'the instant in the problem (θ = 36.87°)' : `t = ${fmt(tau, 3)} s`, 490, 16, { font: '12px system-ui', color: COL.muted, align: 'right' });
    setStats('x2b-1-stats', [['angle of OA', fmt(ph / RAD, 3) + '°'], ['ω_OA', fmt(Math.abs(wOA), 3) + ' rad/s' + rotSense(wOA)],
      ['ω_AB', fmt(Math.abs(wAB), 3) + ' rad/s' + rotSense(wAB), true], ['ω_DB', fmt(Math.abs(wDB), 3) + ' rad/s' + rotSense(wDB), true]]);
    const pa = [], pd = []; for (let i = 0; i <= 160; i++){ const q = Tp * i / 160, f = amp * Math.sin(w0 * q / amp), wo = w0 * Math.cos(w0 * q / amp), g = geo(f), va = kx(wo, g.A);
      const s = solve2(kx(1, sub2(g.B, g.A))[0], -kx(1, sub2(g.B, D))[0], kx(1, sub2(g.B, g.A))[1], -kx(1, sub2(g.B, D))[1], -va[0], -va[1]); pa.push([q, s[0]]); pd.push([q, s[1]]); }
    const all = pa.concat(pd).map(p => p[1]);
    plot($('x2b-1-plot'), { xmin: 0, xmax: Tp, ymin: Math.min(...all) - 0.5, ymax: Math.max(...all) + 0.5, xlabel: 'time t (s)', ylabel: 'ω (rad/s, ccw +)',
      series: [{ pts: pa, color: VEL, width: 2.2 }, { pts: pd, color: VEL2, width: 2.2, dash: [6, 4] }], points: [{ x: tau, y: wAB, color: VEL, r: 5 }, { x: tau, y: wDB, color: VEL2, r: 4 }] });
  }
});

/* =========================================================
   2.B.2  Pulley climbing a fixed cable: the IC is the tangent point C
   ========================================================= */
makeClip({
  id: 'x2b-2', speed: 0.1,
  controls: [{ key: 'vA', label: 'Cable speed v_A', min: 0.5, max: 5, step: 0.1, value: 3, unit: 'm/s', dec: 1 }],
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 20, 560, 500]);
    const S = 250, ox = 250, oy = 290, X = x => ox + S * x, Y = y => oy - S * y, P = p => [X(p[0]), Y(p[1])];
    const R = 0.3048, r = 0.1524, vA = st.V.vA, wv = vA / (R + r), vO = wv * R, T = 0.24 * 3 / vA;
    const tau = st.freeze ? 0 : ((st.t % (2 * T)) - T), yO = -0.25 + vO * tau, th = wv * tau, O = [0, yO], top = 0.95;
    const Cpt = [-R, yO], Bp = add2(O, [R * Math.cos(Math.PI / 2 + th), R * Math.sin(Math.PI / 2 + th)]), Ap = [r, yO];
    st.g = { O, R, r, th, B: Bp, top, IC: Cpt };
    // ceiling, the fixed cable on the left and the pulled cable on the right
    line(ctx, X(-0.9), Y(top), X(0.9), Y(top), COL.fg, 2); hatch(ctx, X(0.9), Y(top), X(-0.9), Y(top), 1);
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(-R) - 12, Y(top)); ctx.lineTo(X(-R) + 12, Y(top)); ctx.lineTo(X(-R), Y(top) + 16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    cable(ctx, () => { ctx.moveTo(X(-R), Y(top) + 14); ctx.lineTo(X(-R), Y(yO)); });
    cable(ctx, () => { ctx.moveTo(X(r), Y(yO)); ctx.lineTo(X(r), Y(top) + 40); });
    vArrow(ctx, X(r) + 24, Y(top) + 110, [0, vA], 18, ROSE, 'v_A', { dx: 18 });
    txt(ctx, 'A', X(r) - 14, Y(top) + 70, L14);
    // the path of B over the whole clip (a curtate cycloid traced as the pulley climbs)
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.globalAlpha = 0.5; ctx.setLineDash([2, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
    let pen = false; for (let i = 0; i <= 80; i++){ const q = -T + 2 * T * i / 80, o = -0.25 + vO * q, a = Math.PI / 2 + wv * q, p = P([R * Math.cos(a), o + R * Math.sin(a)]);
      if (Math.hypot(p[0] - X(Bp[0]), p[1] - Y(Bp[1])) < 34){ pen = false; continue; } pen ? ctx.lineTo(...p) : ctx.moveTo(...p); pen = true; }
    ctx.stroke(); ctx.restore();
    // pulley: outer radius R, inner radius r, rotation mark
    ctx.save(); ctx.translate(X(0), Y(yO)); ctx.fillStyle = '#d6d2c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ece8dc'; ctx.beginPath(); ctx.arc(0, 0, r * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(-th); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r * S + 3, 0); ctx.lineTo(R * S - 4, 0); ctx.stroke(); ctx.restore();
    pinDot(ctx, X(0), Y(yO));
    // velocity field: |v| = ω × distance from C, perpendicular to the line from C
    const icS = P(Cpt), k = 22;
    [[Bp, 'v_B', VEL], [O, 'v_O', VEL2]].forEach(([p, lab, col]) => {
      const v = kx(wv, sub2(p, Cpt)); icRay(ctx, icS, P(p), v); vArrow(ctx, X(p[0]), Y(p[1]), v, k, col, lab === 'v_O' ? '' : lab); });
    txt(ctx, 'v_O', X(0) + 15, Y(yO) - 22, { color: VEL2, font: 'italic 14px Georgia, serif' });
    ctx.save(); ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(X(Bp[0]), Y(Bp[1]), 4, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    const vBn = kx(wv, sub2(Bp, Cpt)); awayTxt(ctx, 'B', [X(Bp[0]), Y(Bp[1])], [[X(0) - X(Bp[0]), Y(yO) - Y(Bp[1])], [vBn[0], -vBn[1]], [-vBn[0], vBn[1]], [icS[0] - X(Bp[0]), icS[1] - Y(Bp[1])]], 22); txt(ctx, 'O', X(0) - 13, Y(yO) + 16, L14);
    icDot(ctx, icS[0], icS[1]); txt(ctx, 'C = IC', icS[0] - 22, icS[1] + 18, { color: VIO, font: 'italic 14px Georgia, serif', align: 'right' });
    spin(ctx, X(0), Y(yO), R * S * 0.86, true, COL.fg, 'ω');
    txt(ctx, st.freeze ? 'the instant when B is directly above O' : `t = ${fmt(tau, 3)} s (t = 0: B above O)`, 550, 32, { font: '12px system-ui', color: COL.muted, align: 'right' });
    const vB = kx(wv, sub2(Bp, Cpt));
    setStats('x2b-2-stats', [['ω = v_A/(R + r)', fmt(wv, 4) + ' rad/s counterclockwise', true], ['v_O = ωR', fmt(vO, 4) + ' m/s up'],
      ['v_B now', `(${fmt(vB[0], 3)}, ${fmt(vB[1], 3)}) m/s`], ['|v_B| when B is above O', fmt(wv * R * Math.SQRT2, 4) + ' m/s', true]]);
  }
});

/* =========================================================
   2.B.3  Spool rolling on its outer rims, cable from the hub
   ========================================================= */
makeClip({
  id: 'x2b-3', speed: 0.5,
  controls: [{ key: 'vA', label: 'Cable speed v_A', min: 0.2, max: 1.6, step: 0.05, value: 0.8, unit: 'm/s', dec: 2 }],
  presets: (C, st, reset) => [{ label: 'Cable leaves the bottom of the hub (book)', apply: () => { st.top = false; reset(); } },
    { label: 'Cable leaves the top of the hub', apply: () => { st.top = true; reset(); } }],
  reset(st){ st.top = st.top ?? false; },
  draw(st){
    const cv = $('x2b-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 70, 700, 380]);
    const S = 110, ox = 280, oy = 340, X = x => ox + S * x, Y = y => oy - S * y;
    const R = 0.9, r = 0.3, vA = st.V.vA, hc = st.top ? R + r : R - r, wv = vA / hc, vO = wv * R, T = 1.3 / Math.max(vO, vA) * 1.2;
    const tau = (st.t % (2 * T)) - T, xO = vO * tau, xA = 2.7 + vA * tau, th = wv * tau, yc = st.top ? R + r : R - r;
    st.g = { xO, R, r, th, xA, yc, top: st.top };
    line(ctx, -10, oy, 710, oy, COL.fg, 2); hatch(ctx, -10, oy, 710, oy, 1);
    // spool (canvas rotation clockwise +)
    ctx.save(); ctx.translate(X(xO), Y(R)); ctx.fillStyle = '#d6d2c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ece8dc'; ctx.beginPath(); ctx.arc(0, 0, r * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(th); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r * S - 3); ctx.lineTo(0, -R * S + 4); ctx.stroke(); ctx.restore();
    pinDot(ctx, X(xO), Y(R));
    // the cable runs between the two flanges: the part behind the front flange is a hidden (dashed) line
    const xe = xO + Math.sqrt(Math.max(0, R * R - (yc - R) * (yc - R)));
    line(ctx, X(xO), Y(yc), X(Math.min(xe, xA)), Y(yc), COL.fg, 1.4, [4, 3]); if (xA > xe) cable(ctx, () => { ctx.moveTo(X(xe), Y(yc)); ctx.lineTo(X(xA), Y(yc)); });
    ctx.save(); ctx.fillStyle = ROSE; ctx.beginPath(); ctx.arc(X(xA), Y(yc), 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'A', X(xA) - 2, Y(yc) - 24, L14); vArrow(ctx, X(xA) + 8, Y(yc), [vA, 0], 45, ROSE, 'v_A');
    // velocities along the vertical diameter: linear in the height above C
    const Cs = [X(xO), Y(0)], k = 45;
    [[R, 'v_O', VEL2], [yc, '', COL.muted], [2 * R, '', COL.muted]].forEach(([hh, lab, col]) => vArrow(ctx, X(xO), Y(hh), [wv * hh, 0], k, col, lab, { w: lab ? 2.6 : 1.8 }));
    line(ctx, Cs[0], Cs[1], X(xO) + 2 * R * wv * k, Y(2 * R), VIO, 1.2, [5, 4]);
    icDot(ctx, Cs[0], Cs[1]); txt(ctx, 'C = IC', Cs[0] - 14, Cs[1] + 16, { color: VIO, font: 'italic 14px Georgia, serif', align: 'right' });
    txt(ctx, 'O', X(xO) - 12, Y(R) - 14, L14); spin(ctx, X(xO), Y(R), R * S * 0.62, false, COL.fg, 'ω');
    txt(ctx, vO > vA ? 'The center moves faster than the cable, so the cable winds onto the hub.' : 'The cable moves faster than the center, so the cable unwinds from the hub.',
      690, 84, { font: '12px system-ui', color: COL.muted, align: 'right' });
    setStats('x2b-3-stats', [['height of the cable point above C', fmt(hc, 3) + ' m'], ['ω = v_A / (height)', fmt(wv, 4) + ' rad/s clockwise', true],
      ['v_O = ωR', fmt(vO, 4) + ' m/s to the right', true], ['top of the spool', fmt(2 * R * wv, 4) + ' m/s to the right']]);
  }
});

/* =========================================================
   2.B.4  Link sliding on a wall and a floor
   ========================================================= */
makeClip({
  id: 'x2b-4', speed: 0.5,
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 20, 380, 330]);
    const S = 500, ox = 60, oy = 300, X = x => ox + S * x, Y = y => oy - S * y;
    const L = 0.5, vB = 3, SL = 0.05, x0 = L * Math.cos(75 * RAD), x1 = L * Math.cos(12 * RAD), Tt = (x1 - x0) / vB;
    const tt = st.freeze ? (L * 0.8 - x0) / vB : Math.min((st.t * SL) % (Tt + 0.3 * SL * 4), Tt);
    const xB = x0 + vB * tt, th = Math.acos(xB / L), yA = L * Math.sin(th), wv = vB / yA, vA = [0, -wv * xB];
    st.g = { xB, yA, th, IC: [xB, yA] };
    // wall and floor
    line(ctx, ox, oy, ox + 300, oy, COL.fg, 2); hatch(ctx, ox, oy, ox + 300, oy, 1); line(ctx, ox, oy, ox, 30, COL.fg, 2); hatch(ctx, ox, 30, ox, oy, 1);
    // IC: on the horizontal line through A and the vertical line through B; it moves on a circle of radius L about the corner
    ctx.save(); ctx.strokeStyle = VIO; ctx.globalAlpha = 0.35; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, L * S, -Math.PI / 2, 0); ctx.stroke(); ctx.restore();
    const I = [X(xB), Y(yA)];
    icRay(ctx, I, [X(0) + 9, Y(yA)], vA); icRay(ctx, I, [X(xB), Y(0) - 9], [vB, 0]);
    link(ctx, [X(0) + 9, Y(yA)], [X(xB), Y(0) - 9]);
    roller(ctx, X(0) + 9, Y(yA)); roller(ctx, X(xB), Y(0) - 9);
    icDot(ctx, ...I, 'IC_AB');
    txt(ctx, 'A', X(0) + 24, Y(yA) - 12, L14); txt(ctx, 'B', X(xB) + 4, Y(0) - 28, L14);
    vArrow(ctx, X(xB) + 10, Y(0) - 9, [vB, 0], 22, VEL, 'v_B'); vArrow(ctx, X(0) + 9, Y(yA), vA, 22, VEL2, 'v_A');
    ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(xB), Y(0), 30, Math.PI, Math.PI + th, false); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', X(xB) - 40, Y(0) - 12, L14);
    spin(ctx, (X(0) + X(xB)) / 2, (Y(yA) + Y(0)) / 2, 18, true, COL.fg, 'ω');
    setStats('x2b-4-stats', [['θ', fmt(th / RAD, 3) + '°'], ['distance from IC to B, L sin θ', fmt(yA, 4) + ' m'],
      ['ω = v_B / (L sin θ)', fmt(wv, 4) + ' rad/s counterclockwise', true], ['v_A = ω L cos θ', fmt(wv * xB, 4) + ' m/s down']]);
    const pw = []; for (let d = 12; d <= 75; d += 0.5) pw.push([d, vB / (L * Math.sin(d * RAD))]);
    plot($('x2b-4-plot'), { xmin: 10, xmax: 76, ymin: 0, ymax: 30, xlabel: 'θ (degrees)', ylabel: 'ω (rad/s)', series: [{ pts: pw, color: VEL, width: 2.4 }],
      points: [{ x: th / RAD, y: wv, color: VEL, r: 5 }, { x: 36.87, y: 10, color: ROSE, r: 3.5 }] });
  }
});

/* =========================================================
   2.B.5  Hydraulic cylinder driving link OB through link AB
   ========================================================= */
makeClip({
  id: 'x2b-5', speed: 0.5,
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 440, 520]);
    const S = 500, ox = 170, oy = 50, X = x => ox + S * x, Y = y => oy - S * y, P = p => [X(p[0]), Y(p[1])];
    const OB = 0.4, AB = 0.25, vAs = 4, SL = 0.04, y0 = 0.62, y1 = 0.27, Tt = (y0 - y1) / vAs;
    const yI = 0.25 * Math.sin(45 * RAD) + Math.sqrt(OB * OB - Math.pow(0.25 * Math.sin(45 * RAD), 2));
    const tt = st.freeze ? (y0 - yI) / vAs : Math.min((st.t * SL) % (Tt + 0.6 * SL), Tt);
    const yA = y0 - vAs * tt, A = [0, -yA], B = circles([0, 0], OB, A, AB, 1)[0] > 0 ? circles([0, 0], OB, A, AB, 1) : circles([0, 0], OB, A, AB, -1);
    const vA = [0, vAs], [wAB, wOB] = solve2(kx(1, sub2(B, A))[0], -kx(1, B)[0], kx(1, sub2(B, A))[1], -kx(1, B)[1], -vA[0], -vA[1]);
    const vB = kx(wOB, B), IC = meet(A, [1, 0], [0, 0], B), th = Math.atan2(B[0] - A[0], B[1] - A[1]);
    st.g = { A, B, IC, wOB, wAB };
    // cylinder C fixed to the ground below A
    const cy0 = -0.72, cy1 = -0.9;
    line(ctx, X(-0.15), Y(cy1), X(0.15), Y(cy1), COL.fg, 2); hatch(ctx, X(-0.15), Y(cy1), X(0.15), Y(cy1), 1);
    ctx.save(); ctx.fillStyle = '#b9bcc4'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.fillRect(X(-0.035), Y(cy0), 0.07 * S, (cy0 - cy1) * S); ctx.strokeRect(X(-0.035), Y(cy0), 0.07 * S, (cy0 - cy1) * S); ctx.restore();
    txt(ctx, 'C', X(0.07), Y(cy0 - 0.09), L14);
    line(ctx, X(0), Y(cy0), X(0), Y(-yA), '#6b6e75', 7);
    // fixed pin O on a wall bracket at the top
    line(ctx, X(0), Y(0), X(0), Y(-0.66), COL.muted, 1, [2, 4]);
    if (IC && Math.abs(IC[0]) < 3){ const I = P(IC); line(ctx, X(0), Y(0), I[0], I[1], VIO, 1.2, [3, 4]); line(ctx, X(A[0]), Y(A[1]), I[0], I[1], VIO, 1.2, [3, 4]);
      icRay(ctx, I, P(A), vA); icRay(ctx, I, P(B), vB); if (I[0] < 440) icDot(ctx, ...I, 'IC_AB'); }
    link(ctx, P([0, 0]), P(B), 12); link(ctx, P(A), P(B), 12, '#b9b2a0');
    wallPin(ctx, X(0), Y(0), -1, 34); pinDot(ctx, ...P(A)); pinDot(ctx, ...P(B));
    ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X(A[0]), Y(A[1]), 36, -Math.PI / 2, -Math.PI / 2 + th); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', X(A[0]) + 18, Y(A[1]) - 48, L14);
    txt(ctx, 'O', X(0) + 16, Y(0) - 14, L14); txt(ctx, 'A', X(A[0]) - 18, Y(A[1]) + 8, L14); txt(ctx, 'B', X(B[0]) + 16, Y(B[1]) + 6, L14);
    vArrow(ctx, X(A[0]) - 40, Y(A[1]) + 30, vA, 18, ROSE, 'v_A'); vArrow(ctx, X(B[0]), Y(B[1]), vB, 18, VEL2, 'v_B');
    setStats('x2b-5-stats', [['θ', fmt(th / RAD, 3) + '°'], ['ω_AB', fmt(Math.abs(wAB), 4) + ' rad/s' + rotSense(wAB)],
      ['ω_OB', fmt(Math.abs(wOB), 4) + ' rad/s' + rotSense(wOB), true], ['v_B', fmt(len2(vB), 4) + ' m/s']]);
    const pw = []; for (let i = 0; i <= 120; i++){ const y = y0 - (y0 - y1) * i / 120, a = [0, -y], b0 = circles([0, 0], OB, a, AB, 1), b = b0[0] > 0 ? b0 : circles([0, 0], OB, a, AB, -1);
      const s = solve2(kx(1, sub2(b, a))[0], -kx(1, b)[0], kx(1, sub2(b, a))[1], -kx(1, b)[1], 0, -vAs); pw.push([Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD, s[1]]); }
    const ys = pw.map(p => p[1]), xs = pw.map(p => p[0]);
    plot($('x2b-5-plot'), { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(0, ...ys) - 1, ymax: Math.max(...ys) + 1, xlabel: 'θ (degrees)', ylabel: 'ω of OB (rad/s, ccw +)',
      series: [{ pts: pw, color: VEL2, width: 2.4 }], points: [{ x: th / RAD, y: wOB, color: VEL2, r: 5 }] });
  }
});

/* =========================================================
   2.B.6  Two links between two walls, joined at B on the floor
   ========================================================= */
makeClip({
  id: 'x2b-6', speed: 0.5,
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 30, 430, 330]);
    const S = 600, ox = 230, oy = 300, X = x => ox + S * x, Y = y => oy - S * y, P = p => [X(p[0]), Y(p[1])];
    const L = 0.4, xa = -0.32, xc = 0.24, vAs = 30, SL = 0.002, y0 = 0.33, y1 = 0.12, Tt = (y0 - y1) / vAs;
    const tt = st.freeze ? (y0 - 0.24) / vAs : Math.min((st.t * SL) % (Tt + 0.4 * SL), Tt);
    const yA = y0 - vAs * tt, xB = xa + Math.sqrt(L * L - yA * yA), yC = Math.sqrt(L * L - (xc - xB) * (xc - xB));
    const A = [xa, yA], B = [xB, 0], Cp = [xc, yC], wAB = vAs / (xB - xa), vB = [wAB * yA, 0], wBC = vB[0] / yC, vC = [0, wBC * (xc - xB)];
    st.g = { A, B, C: Cp, IC1: [xB, yA], IC2: [xB, yC] };
    line(ctx, X(xa) - 12, oy, X(xc) + 12, oy, COL.fg, 2); hatch(ctx, X(xa) - 12, oy, X(xc) + 12, oy, 1);
    line(ctx, X(xa), oy, X(xa), 40, COL.fg, 2); hatch(ctx, X(xa), 40, X(xa), oy, 1);
    line(ctx, X(xc), oy, X(xc), 40, COL.fg, 2); hatch(ctx, X(xc), oy, X(xc), 40, 1);
    line(ctx, X(xB), Y(0), X(xB), Y(Math.max(yA, yC)) - 10, VIO, 1, [2, 4]);
    const I1 = P([xB, yA]), I2 = P([xB, yC]);
    icRay(ctx, I1, [X(xa) + 9, Y(yA)], [0, -vAs]); icRay(ctx, I2, [X(xc) - 9, Y(yC)], vC);
    link(ctx, [X(xa) + 9, Y(yA)], [X(xB), Y(0) - 9]); link(ctx, [X(xB), Y(0) - 9], [X(xc) - 9, Y(yC)], 12, '#b9b2a0');
    roller(ctx, X(xa) + 9, Y(yA)); roller(ctx, X(xB), Y(0) - 9); roller(ctx, X(xc) - 9, Y(yC));
    icDot(ctx, ...I1); icDot(ctx, ...I2);
    txt(ctx, 'IC_AB', I1[0] - 14, I1[1] - 14, { color: VIO, font: 'italic 14px Georgia, serif', align: 'right' });
    txt(ctx, 'IC_BC', I2[0] - 14, I2[1] - 14, { color: VIO, font: 'italic 14px Georgia, serif', align: 'right' });
    txt(ctx, 'A', X(xa) + 26, Y(yA) - 12, L14); txt(ctx, 'B', X(xB), Y(0) + 18, L14); awayTxt(ctx, 'C', [X(xc) - 9, Y(yC)], [[X(xB) - X(xc), Y(0) - Y(yC)], [1, 0], [0, -1], [-1, 0]], 24);
    const k = Math.min(3, 105 / Math.max(vAs, vB[0], Math.abs(vC[1]))); vArrow(ctx, X(xa) + 9, Y(yA), [0, -vAs], k, ROSE, 'v_A'); vArrow(ctx, X(xB), Y(0) - 9, vB, k, VEL, 'v_B'); vArrow(ctx, X(xc) - 9, Y(yC), vC, k, VEL2, 'v_C', { dx: -18, dy: 10 });
    setStats('x2b-6-stats', [['φ (AB with the floor)', fmt(Math.asin(yA / L) / RAD, 3) + '°'], ['ω_AB = v_A / (x_B − x_A)', fmt(wAB, 4) + ' rad/s counterclockwise'],
      ['v_B = ω_AB y_A', fmt(vB[0], 4) + ' m/s to the right'], ['ω_BC = v_B / y_C', fmt(wBC, 4) + ' rad/s counterclockwise'], ['v_C', fmt(vC[1], 4) + ' m/s ' + (vC[1] >= 0 ? 'up' : 'down'), true]]);
  }
});

/* =========================================================
   2.B.7  Link with a roller in a 45° guide at A and a roller on a level track at B
   ========================================================= */
makeClip({
  id: 'x2b-7', speed: 0.5,
  presets: (C, st, reset) => freezeChips(st, reset),
  reset(st){ st.freeze = st.freeze ?? false; },
  draw(st){
    const cv = $('x2b-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 50, 560, 490]);
    const S = 400, ox = 140, oy = 260, X = x => ox + S * x, Y = y => oy - S * y, P = p => [X(p[0]), Y(p[1])];
    const L = 0.6, yB = 0.3, vB = 2.5, e = [Math.SQRT1_2, Math.SQRT1_2], SL = 0.1, x0 = 0.2, x1 = 0.95, Tt = (x1 - x0) / vB;
    const xI = L * Math.cos(30 * RAD), tt = st.freeze ? (xI - x0) / vB : Math.min((st.t * SL) % (Tt + 0.5 * SL), Tt);
    const xB = x0 + vB * tt, B = [xB, yB], be = B[0] * e[0] + B[1] * e[1], s = be - Math.sqrt(be * be - (xB * xB + yB * yB) + L * L), A = mul2(e, s);
    const [sA, wv] = solve2(e[0], kx(1, sub2(B, A))[0], e[1], kx(1, sub2(B, A))[1], vB, 0), vA = mul2(e, sA), G = mul2(add2(A, B), 0.5), vG = add2(vA, kx(wv, sub2(G, A)));
    const IC = meet(A, [-e[1], e[0]], B, [0, 1]);
    st.g = { A, B, G, IC, s };
    // guide plate behind the link with a 45° slot for roller A, and the level track for roller B
    const s0 = -0.32, s1 = 0.56, n = [-e[1] * 0.03, e[0] * 0.03];
    ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#ebe6d8'; ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath();
    [[s0, -1], [s1, -1], [s1, 1], [s0, 1]].forEach(([q, sg], i) => { const p = P(add2(mul2(e, q), mul2(n, sg * 2.2))); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d3ccb8'; ctx.beginPath(); [[s0 + 0.03, -1], [s1 - 0.03, -1], [s1 - 0.03, 1], [s0 + 0.03, 1]].forEach(([q, sg], i) => { const p = P(add2(mul2(e, q), mul2(n, sg))); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const g0 = P(add2(mul2(e, s0), mul2(n, -2.2))); line(ctx, g0[0] - 30, g0[1] + 20, g0[0] + 60, g0[1] + 20, COL.fg, 2); hatch(ctx, g0[0] - 30, g0[1] + 20, g0[0] + 60, g0[1] + 20, 1);
    line(ctx, g0[0] + 10, g0[1] + 20, g0[0] + 10, g0[1] - 2, COL.muted, 3);
    line(ctx, X(0.1), Y(yB) + 9, X(1.12), Y(yB) + 9, COL.fg, 2); hatch(ctx, X(0.1), Y(yB) + 9, X(1.12), Y(yB) + 9, 1);
    if (IC){ const I = P(IC); icRay(ctx, I, P(A), vA); icRay(ctx, I, P(B), [vB, 0]); icRay(ctx, I, P(G), vG); icDot(ctx, ...I, 'IC_AB'); }
    link(ctx, P(A), P(B));
    roller(ctx, ...P(A)); roller(ctx, X(xB), Y(yB));
    ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(X(G[0]), Y(G[1]), 4, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'A', X(A[0]) - 18, Y(A[1]) + 6, L14); txt(ctx, 'B', X(xB) + 4, Y(yB) - 22, L14); awayTxt(ctx, 'G', [X(G[0]), Y(G[1])], IC ? [[X(A[0]) - X(G[0]), Y(A[1]) - Y(G[1])], [vG[0], -vG[1]], [P(IC)[0] - X(G[0]), P(IC)[1] - Y(G[1])]] : [[vG[0], -vG[1]]], 20);
    const k = 30; vArrow(ctx, X(xB) + 9, Y(yB), [vB, 0], k, ROSE, 'v_B'); vArrow(ctx, X(A[0]), Y(A[1]), vA, k, VEL, 'v_A'); vArrow(ctx, X(G[0]), Y(G[1]), vG, k, VEL2, 'v_G');
    spin(ctx, X(G[0]), Y(G[1]) + 2, 16, wv > 0, COL.fg);
    txt(ctx, 'guide slot at θ = 45°', X(s0 * e[0]) - 36, Y(s0 * e[1]) + 46, { font: '12px system-ui', color: COL.muted, align: 'left' });
    setStats('x2b-7-stats', [['angle of AB, φ', fmt(Math.atan2(B[1] - A[1], B[0] - A[0]) / RAD, 3) + '°'], ['ω_AB', fmt(Math.abs(wv), 4) + ' rad/s' + rotSense(wv), true],
      ['v_A (along the guide)', fmt(Math.abs(sA), 4) + ' m/s ' + (sA > 0 ? 'up the guide' : 'down the guide'), true], ['v_G', fmt(len2(vG), 4) + ' m/s', true]]);
  }
});

/* =========================================================
   2.B.8  Motion blur on a rolling tire
   ========================================================= */
makeClip({
  id: 'x2b-8', speed: 0.5,
  controls: [{ key: 'v', label: 'Car speed v', min: 2, max: 20, step: 0.5, value: 10, unit: 'm/s', dec: 1 },
    { key: 'E', label: 'Exposure time', min: 2, max: 40, step: 1, value: 16, unit: 'ms', dec: 0 }],
  presets: (C, st, reset) => [{ label: 'Camera fixed to the ground (as in the photo)', apply: () => { st.cam = 0; reset(); } },
    { label: 'Camera moving with the car', apply: () => { st.cam = 1; reset(); } }, { label: 'Show or hide the circles about C', apply: () => { st.circ = !st.circ; } }],
  reset(st){ st.cam = st.cam ?? 0; st.circ = st.circ ?? true; },
  draw(st){
    const cv = $('x2b-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 20, 700, 400]);
    const S = 600, R = 0.26, v = st.V.v, wv = v / R, E = st.V.E / 1000, SL = 0.02, span = 0.9;
    const tau = st.t * SL, xO = st.cam ? 0 : ((v * tau) % span) - span / 2, ox = 350, oy = 360, X = x => ox + S * x, Y = y => oy - S * y;
    const th = wv * tau;                        // clockwise rolling angle
    st.g = { xO, R, th, cam: st.cam, E, wv, v };
    // road with marks so the camera motion is visible
    line(ctx, 0, oy, 700, oy, COL.fg, 2);
    const shift = st.cam ? (v * tau) % 0.2 : 0; for (let x = -0.6; x <= 0.65; x += 0.2) line(ctx, X(x - shift), oy + 4, X(x - shift) - 8, oy + 14, COL.muted, 1.2);
    // circles about the contact point C
    const Cx = X(xO), Cy = oy;
    if (st.circ){ ctx.save(); ctx.strokeStyle = VIO; ctx.globalAlpha = 0.55; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; [0.35, 0.6, 0.85, 1.1, 1.35, 1.6, 1.85].forEach(f => { ctx.beginPath(); ctx.arc(Cx, Cy, f * R * S, Math.PI, 2 * Math.PI); ctx.stroke(); }); ctx.restore(); }
    // tire, rim, and the marks on the sidewall (canvas rotation clockwise +)
    ctx.save(); ctx.translate(X(xO), Y(R)); ctx.fillStyle = '#2e2f33'; ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#9ea2aa'; ctx.beginPath(); ctx.arc(0, 0, R * S * 0.55, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    // marks: positions over the exposure (world, y up). With the camera on the car, the wheel centre stays fixed.
    const marks = 10, rm = 0.8 * R, pos = (k, q) => { const a = Math.PI / 2 - wv * q - 2 * Math.PI * k / marks, xo = st.cam ? 0 : xO - v * (tau - q); return [xo + rm * Math.cos(a), R + rm * Math.sin(a)]; };
    for (let k = 0; k < marks; k++){
      ctx.save(); ctx.strokeStyle = '#f2c230'; ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.globalAlpha = 0.55; ctx.beginPath();
      for (let i = 0; i <= 24; i++){ const p = pos(k, tau - E * (1 - i / 24)); i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); } ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(X(xO), Y(R), R * S * 0.18, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); pinDot(ctx, X(xO), Y(R));
    // velocities of three marks, perpendicular to the line from C (fixed camera) or from O (moving camera)
    const ref = st.cam ? [0, R] : [xO, 0], wsign = -wv;
    [0, 3, 7].forEach(kk => { const p = pos(kk, tau), vv = st.cam ? kx(wsign, sub2(p, [0, R])) : kx(wsign, sub2(p, [xO, 0]));
      const Ps = [X(p[0]), Y(p[1])]; icRay(ctx, [X(ref[0]), Y(ref[1])], Ps, vv); vArrow(ctx, Ps[0], Ps[1], vv, 9, VEL, ''); });
    if (!st.cam){ icDot(ctx, Cx, Cy); txt(ctx, 'C = IC', Cx + 14, Cy + 16, { color: VIO, font: 'italic 14px Georgia, serif', align: 'left' }); }
    else txt(ctx, 'In the car’s frame every point circles O, so the blur follows circles about O.', 690, 34, { font: '12px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, 'O', X(xO) + 12, Y(R) - 14, { font: 'italic 14px Georgia, serif', color: '#ffffff' });
    setStats('x2b-8-stats', [['ω = v / R', fmt(wv, 4) + ' rad/s'], ['rotation during the exposure', fmt(wv * E / RAD, 3) + '°'],
      ['speed of the top of the tire', fmt(2 * v, 3) + ' m/s'], ['speed of the contact point C', '0']]);
  }
});

subLabels();
})();
