/* =========================================================
   Chapter 2, rigid-body kinematics examples 2.A.6 to 2.A.10
   Each clip stores its geometry (world units) in st.g, which the 3D views read.
   ========================================================= */
(function(){
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const kx = (w, r) => [-w * r[1], w * r[0]], len = a => Math.hypot(a[0], a[1]);
const solve2 = (a, b, c, d, e, f) => { const D = a * d - b * c; return [(e * d - b * f) / D, (a * f - e * c) / D]; }; // [a b; c d] x = [e; f]
const sense = w => Math.abs(w) < 1e-6 ? '' : w > 0 ? ' (counterclockwise)' : ' (clockwise)';
// world-to-canvas mapping that keeps the aspect ratio; b = [xmin, xmax, ymin, ymax]
function view(w, h, b, pad = 18){
  const s = Math.min((w - 2 * pad) / (b[1] - b[0]), (h - 2 * pad) / (b[3] - b[2]));
  const ox = (w - s * (b[1] - b[0])) / 2, oy = (h - s * (b[3] - b[2])) / 2;
  return { s, P: (x, y) => [ox + (x - b[0]) * s, oy + (b[3] - y) * s] };
}
function autoH(cv, w, h, b, pad = 18){
  if (!cv.dataset.h0) cv.dataset.h0 = String(h);
  const want = Math.round(Math.min(+cv.dataset.h0, (b[3] - b[2]) / (b[1] - b[0]) * (w - 2 * pad) + 2 * pad));
  if (Math.abs(want - h) > 3) cv.style.height = want + 'px';
}
// vector arrow from world point p along v (scaled by k world units per unit), with a label at its tip
function warr(ctx, P, p, v, k, col, label, dash){
  const [x1, y1] = P(...p), [x2, y2] = P(p[0] + v[0] * k, p[1] + v[1] * k), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 4) return;
  if (dash){ ctx.save(); ctx.setLineDash([6, 4]); }
  arrow(ctx, x1, y1, x2, y2, col, 2.6);
  if (dash) ctx.restore();
  if (label && L >= 26){ // beyond the tip (a very short arrow gets no label), nudged sideways toward the upper side so it clears a link along the arrow
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L; let nx = uy, ny = -ux; if (ny > 0 || (ny === 0 && nx < 0)){ nx = -nx; ny = -ny; }
    const a = uy > 0.6 ? -8 : 12, n = uy > 0.6 ? 16 : 12;   // a downward arrow gets its label beside the tip, not below it
    txt(ctx, label, x2 + ux * a + nx * n, y2 + uy * a + ny * n, { color: col, font: 'italic 14px Georgia, serif' });
  }
}
function link(ctx, P, a, b, wpx = 12){
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = COL.massEdge; ctx.lineWidth = wpx + 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = COL.mass; ctx.lineWidth = wpx; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
function hole(ctx, P, p, label, dx = 12, dy = -12){
  const [x, y] = P(...p); pinDot(ctx, x, y);
  if (label) txt(ctx, label, x + dx, y + dy, { font: 'italic 15px Georgia, serif' });
}
function groundPin(ctx, P, p, label, dx, dy, yGround){ const [x, y] = P(...p), hg = yGround === undefined ? 24 : P(p[0], yGround)[1] - y; pin(ctx, x, y, hg); if (label) txt(ctx, label, x + dx, y + dy, { font: 'italic 15px Georgia, serif' }); }
function angArc(ctx, P, c, r, a0, a1, label, col = COL.muted){ // a0, a1 in radians (CCW from +x), r in px
  const [x, y] = P(...c); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, r, -a0, -a1, a1 > a0); ctx.stroke(); ctx.restore();
  const m = (a0 + a1) / 2; txt(ctx, label, x + (r + 11) * Math.cos(m), y - (r + 11) * Math.sin(m), { color: col, font: 'italic 14px Georgia, serif' });
}
// circle–circle intersection nearest to a previous point (keeps the linkage on one branch)
function cc(A, b, D, c, near){
  const d = len(sub(D, A)); if (d > b + c || d < Math.abs(b - c) || d < 1e-12) return null;
  const a = (b * b - c * c + d * d) / (2 * d), hh = Math.sqrt(Math.max(b * b - a * a, 0)), u = mul(sub(D, A), 1 / d), m = add(A, mul(u, a));
  const p1 = add(m, mul([-u[1], u[0]], hh)), p2 = add(m, mul([u[1], -u[0]], hh));
  return len(sub(p1, near)) <= len(sub(p2, near)) ? p1 : p2;
}
const freezePresets = (st, extra = []) => () => [{ label: 'Freeze at the instant in the problem', apply: () => { st.freeze = true; } }, { label: 'Play the motion', apply: () => { st.freeze = false; } }, ...extra];
const INSTANT = 'the instant in the problem';

/* ---------- 2.A.6: spool pulled by a cable from the bottom of its hub ---------- */
makeClip({
  id: 'x2a-6', speed: 0.5,
  controls: [
    { key: 'vA', label: 'Speed of end A, v_A', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'm/s', dec: 2 },
    { key: 'r', label: 'Hub radius r', min: 0.1, max: 0.7, step: 0.05, value: 0.4, unit: 'm', dec: 2 },
    { key: 'R', label: 'Outer radius R', min: 0.5, max: 1.2, step: 0.05, value: 0.8, unit: 'm', dec: 2 }
  ],
  presets: (C, st) => [{ label: 'Freeze', apply: () => { st.freeze = true; } }, { label: 'Play the motion', apply: () => { st.freeze = false; } }],
  reset(st){ st.freeze = false; },
  step(st){
    const V = st.V, R = V.R, r = Math.min(V.r, 0.9 * R), w = V.vA / (R - r), vO = w * R;
    if (st.freeze) st.t = 0;
    if (3 - (vO - V.vA) * st.t < 0.35 || vO * st.t > (st.narrow ? 3.4 : 6)) st.t = 0;     // restart before the spool reaches the end of the cable or leaves the view
  },
  draw(st){
    const V = st.V, cv = $('x2a-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const R = V.R, r = Math.min(V.r, 0.9 * R), om = V.vA / (R - r), vO = om * R, t = st.t;
    const xO = -0.2 + vO * t, phi = -xO / R;            // phi: counterclockwise angle of the spool (it turns clockwise)
    const xa = -0.2 + 3 + V.vA * t;
    st.narrow = w < 560; const b = st.narrow ? [-1.3, 4.6, -0.35, 2.75] : [-1.4, 7.6, -0.35, 2.75]; autoH(cv, w, h, b); const { P, s } = view(w, h, b);
    st.g = { xO, xA: xa, phi, R, r, vO, vA: V.vA, om };
    const [g0x, gy] = P(b[0], 0), [g1x] = P(b[1], 0); line(ctx, g0x, gy, g1x, gy, COL.fg, 2); hatch(ctx, g0x, gy, g1x, gy, 1);
    // spool: outer disk, hub and four marks that show the rotation
    const [ox, oy] = P(xO, R);
    ctx.save(); ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, R * s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efe9d8'; ctx.beginPath(); ctx.arc(ox, oy, r * s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++){ const a = phi + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(ox + r * s * Math.cos(a), oy - r * s * Math.sin(a)); ctx.lineTo(ox + R * s * 0.95 * Math.cos(a), oy - R * s * 0.95 * Math.sin(a)); ctx.stroke(); }
    ctx.restore();
    // cable from the bottom of the hub to end A
    const yc = R - r, [cx0, cy0] = P(xO, yc), [ax, ay] = P(xa, yc);
    // the cable runs between the two flanges: the part behind the front flange is a hidden (dashed) line
    const xe = xO + Math.sqrt(R * R - r * r), [ex] = P(Math.min(xe, xa), yc);
    line(ctx, cx0, cy0, ex, cy0, COL.fg, 1.4, [4, 3]); if (xa > xe) line(ctx, ex, cy0, ax, ay, COL.fg, 3);
    ctx.save(); ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'A', ax, ay - 16, { font: 'italic 15px Georgia, serif' });
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox - 14, oy - 12, { font: 'italic 15px Georgia, serif' });
    // instant center C and the velocity profile along the vertical line through C
    const [qx, qy] = P(xO, 0); ctx.save(); ctx.fillStyle = HEAT; ctx.beginPath(); ctx.arc(qx, qy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    txt(ctx, 'C', qx - 14, qy + 14, { font: 'italic 15px Georgia, serif', color: HEAT });
    const k = 0.32;                                    // world metres per (m/s) of drawn velocity
    const [tx, ty] = P(xO + 2 * vO * k, 2 * R); ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = HEAT; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
    warr(ctx, P, [xO, 2 * R], [2 * vO, 0], k, COL.muted);
    warr(ctx, P, [xO, R], [vO, 0], k, COL.c1);
    { const [lx, ly] = P(xO + vO * k, R); txt(ctx, 'v_O', lx + 12, ly + 15, { color: COL.c1, font: 'italic 14px Georgia, serif' }); }   // below right of the tip, clear of the dashed profile line
    warr(ctx, P, [xa, yc], [V.vA, 0], k, COL.c2, 'v_A');
    txt(ctx, 'no slip', P(xO, 0)[0] + 52, gy + 14, { font: '12px system-ui', color: COL.muted });
    setStats('x2a-6-stats', [['ω = v_A / (R − r)', fmt(om, 4) + ' rad/s (clockwise)', true], ['v_O = ω R', fmt(vO, 4) + ' m/s to the right', true], ['cable winds onto the hub at', fmt(vO - V.vA, 4) + ' m/s']]);
  }
});

/* ---------- 2.A.7: link sliding on a wall and a floor ---------- */
(function(){
  const TH0 = 75 * RAD, TH1 = 20 * RAD, THI = Math.atan2(3, 4);   // 36.87°
  const geo = (V, tau) => { const L = V.L, xB = L * Math.cos(THI) + V.vB * tau, th = Math.acos(Math.min(1, Math.max(-1, xB / L))); return { L, xB, th, yA: L * Math.sin(th) }; };
  const rates = (V, th) => { const om = V.vB / (V.L * Math.sin(th)), al = V.vB * V.vB * Math.cos(th) / (V.L * V.L * Math.sin(th) ** 3); return { om, al, vA: -V.vB / Math.tan(th) }; };
  makeClip({
    id: 'x2a-7', speed: 0.05,
    controls: [
      { key: 'vB', label: 'Speed of B, v_B', min: 0.5, max: 5, step: 0.1, value: 3, unit: 'm/s', dec: 2 },
      { key: 'L', label: 'Length L', min: 0.3, max: 1, step: 0.05, value: 0.5, unit: 'm', dec: 2 }
    ],
    presets: (C, st) => freezePresets(st)(),
    reset(st){ st.freeze = false; st.t = 0; },
    step(st){
      const V = st.V, L = V.L, t0 = (L * Math.cos(TH0) - L * Math.cos(THI)) / V.vB, t1 = (L * Math.cos(TH1) - L * Math.cos(THI)) / V.vB;
      st.tau = st.freeze ? 0 : t0 + st.t; if (st.tau > t1){ st.t = 0; st.tau = t0; }
    },
    draw(st){
      const V = st.V, cv = $('x2a-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const tau = st.tau ?? 0, G = geo(V, tau), L = G.L, th = G.th, R = rates(V, th), A = [0, G.yA], B = [G.xB, 0];
      st.g = { L, xB: G.xB, yA: G.yA, th, om: R.om, al: R.al };
      const b = [-0.42 * L, 1.55 * L, -0.22 * L, 1.18 * L]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      const [ox, oy] = P(0, 0), [fx] = P(1.5 * L, 0), [, ty] = P(0, 1.12 * L);
      line(ctx, ox, oy, fx, oy, COL.fg, 2); hatch(ctx, ox, oy, fx, oy, 1); line(ctx, ox, ty, ox, oy, COL.fg, 2); hatch(ctx, ox, oy, ox, ty, -1);
      // the position of B at the instant in the problem
      const [mx, my] = P(L * Math.cos(THI), 0); line(ctx, mx, my - 7, mx, my + 7, HEAT, 2);
      link(ctx, P, A, B, 11); hole(ctx, P, A, 'A', 16, -10); hole(ctx, P, B, 'B', 4, 20);
      const [bx, by] = P(...B); ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(bx, by, 28, Math.PI, Math.PI + th, false); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', bx - 40 * Math.cos(th / 2), by - 40 * Math.sin(th / 2), { color: COL.muted, font: 'italic 14px Georgia, serif' });
      const k = 0.07 * L;
      warr(ctx, P, B, [V.vB, 0], k, COL.c1, 'v_B'); warr(ctx, P, [0.05 * L, A[1]], [0, R.vA], k, COL.c2, 'v_A');
      if (Math.abs(tau) < 1e-9) txt(ctx, INSTANT + ': θ = 36.87°', w / 2, 14, { font: '12px system-ui', color: HEAT });
      // ω and α against θ
      const pw = [], pa = []; for (let i = 0; i <= 80; i++){ const q = TH1 + (TH0 - TH1) * i / 80, r = rates(V, q); pw.push([q / RAD, r.om]); pa.push([q / RAD, r.al]); }
      const RI = rates(V, THI);
      plot($('x2a-7-plot'), { xmin: 20, xmax: 75, xstep: 10, ymin: 0, ymax: Math.max(...pw.map(p => p[1])) * 1.08, xlabel: 'θ (deg)', ylabel: 'ω of AB (rad/s)', series: [{ pts: pw, color: COL.c3, width: 2.4 }],
        vlines: [{ x: 36.87, color: HEAT, label: 'instant' }], points: [{ x: th / RAD, y: R.om, color: COL.c3, r: 5 }] });
      plot($('x2a-7-plot2'), { xmin: 20, xmax: 75, xstep: 10, ymin: 0, ymax: Math.max(...pa.map(p => p[1])) * 1.08, xlabel: 'θ (deg)', ylabel: 'α of AB (rad/s²)', series: [{ pts: pa, color: COL.c2, width: 2.4 }],
        vlines: [{ x: 36.87, color: HEAT, label: 'instant' }], points: [{ x: th / RAD, y: R.al, color: COL.c2, r: 5 }] });
      statsEvery(st, 'x2a-7-stats', () => [['θ', fmt(th / RAD, 4) + '°'], ['ω_AB', fmt(R.om, 4) + ' rad/s (counterclockwise)', true], ['α_AB', fmt(R.al, 4) + ' rad/s² (counterclockwise)', true], ['v_A', fmt(-R.vA, 4) + ' m/s downward']], 0.002);
    }
  });
})();

/* ---------- 2.A.8: flywheel, connecting rod and piston ---------- */
(function(){
  // θ is measured clockwise from the vertical; B = (r sin θ, r cos θ) with O at the origin; A slides along y = −d
  function state(r, d, L, th, w){
    const B = [r * Math.sin(th), r * Math.cos(th)], dy = -d - B[1]; if (Math.abs(dy) > L) return null;
    const A = [B[0] + Math.sqrt(L * L - dy * dy), -d], rAB = sub(A, B);
    const wk = -w;                                       // clockwise rotation is a negative k component
    const vB = kx(wk, B), aB = mul(B, -w * w);
    const wAB = -vB[1] / rAB[0], vA = vB[0] - wAB * rAB[1];
    const alAB = -(aB[1] - wAB * wAB * rAB[1]) / rAB[0], aA = aB[0] - alAB * rAB[1] - wAB * wAB * rAB[0];
    return { B, A, vB, aB, wAB, vA, alAB, aA };
  }
  makeClip({
    id: 'x2a-8', speed: 0.15,
    controls: [
      { key: 'w', label: 'Flywheel speed (clockwise)', min: 2, max: 20, step: 0.5, value: 10, unit: 'rad/s', dec: 2 },
      { key: 'L', label: 'Rod length L', min: 0.3, max: 0.8, step: 0.01, value: 0.45, unit: 'm', dec: 3 },
      { key: 'd', label: 'Offset d', min: 0, max: 0.3, step: 0.01, value: 0.2, unit: 'm', dec: 3 }
    ],
    presets: (C, st) => freezePresets(st)(),
    reset(st){ st.freeze = false; },
    step(st){ if (st.freeze) st.t = 0; },
    draw(st){
      const V = st.V, r = 0.1, cv = $('x2a-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const th = Math.PI / 2 + V.w * st.t, S = state(r, V.d, V.L, th, V.w);
      const yF = Math.min(-V.d - 0.05, -0.2), b = [-0.24, 0.98, yF - 0.06, 0.24]; autoH(cv, w, h, b); const { P, s } = view(w, h, b);
      if (!S){ drawMessage(cv, 'The rod is too short to reach the piston guide. Increase L or reduce d.'); return; }
      st.g = { r, d: V.d, L: V.L, th, B: S.B, A: S.A, yF };
      const [g0x, gy] = P(b[0], yF), [g1x] = P(b[1], yF); line(ctx, g0x, gy, g1x, gy, COL.fg, 2); hatch(ctx, g0x, gy, g1x, gy, 1);
      // the piston guide: a platform at the height of the piston's bottom face
      const yG = -V.d - 0.05, [p0x, py] = P(0.22, yG), [p1x] = P(0.98, yG);
      if (yG > yF + 0.005){ ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.fillRect(p0x, py, p1x - p0x, gy - py); ctx.strokeRect(p0x, py, p1x - p0x, gy - py); ctx.restore(); }
      // flywheel on a pedestal standing on the floor
      const [ox, oy] = P(0, 0);
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox - 8, oy); ctx.lineTo(ox + 8, oy); ctx.lineTo(ox + 26, gy); ctx.lineTo(ox - 26, gy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#cfc8b5'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, 1.45 * r * s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      const [bx, by] = P(...S.B); line(ctx, ox, oy, bx, by, COL.massEdge, 3);
      // piston block (0.16 m long, 0.1 m high) with the wrist pin A at its center
      const [axp, ayp] = P(...S.A); ctx.save(); ctx.fillStyle = '#d5dbe8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.fillRect(axp - 0.08 * s, ayp - 0.05 * s, 0.16 * s, 0.1 * s); ctx.strokeRect(axp - 0.08 * s, ayp - 0.05 * s, 0.16 * s, 0.1 * s); ctx.restore();
      link(ctx, P, S.B, S.A, 9);
      hole(ctx, P, [0, 0], 'O', -16, 16); hole(ctx, P, S.B, 'B', 4, -16); hole(ctx, P, S.A, 'A', 0, -0.05 * s - 14);
      // θ from the vertical
      const [vx0, vy0] = P(0, 0.2); ctx.save(); ctx.setLineDash([4, 4]); line(ctx, ox, oy, vx0, vy0, COL.muted, 1); ctx.restore();
      const thm = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(ox, oy, 0.06 * s, -Math.PI / 2, -Math.PI / 2 + thm, false); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', ox + 0.085 * s * Math.sin(thm / 2), oy - 0.085 * s * Math.cos(thm / 2), { color: COL.muted, font: 'italic 14px Georgia, serif' });
      const k = 0.08;
      warr(ctx, P, S.B, S.vB, k, COL.c1, 'v_B'); warr(ctx, P, S.A, [S.vA, 0], k, COL.c2, 'v_A');
      warr(ctx, P, S.A, [S.aA, 0], 0.012, COL.c3, 'a_A', true);
      if (st.freeze) txt(ctx, INSTANT + ': θ = 90°', w / 2, 14, { font: '12px system-ui', color: HEAT });
      const pv = [], pa = []; for (let i = 0; i <= 120; i++){ const q = 2 * Math.PI * i / 120, z = state(r, V.d, V.L, q, V.w); if (z){ pv.push([q / RAD, z.vA]); pa.push([q / RAD, z.aA]); } }
      const span = a => { const m = Math.max(...a.map(p => Math.abs(p[1]))) * 1.1 || 1; return [-m, m]; };
      const [v0, v1] = span(pv), [a0, a1] = span(pa);
      plot($('x2a-8-plot'), { xmin: 0, xmax: 360, xstep: 90, ymin: v0, ymax: v1, xlabel: 'θ (deg)', ylabel: 'velocity of A (m/s, right +)', series: [{ pts: pv, color: COL.c2, width: 2.4 }], vlines: [{ x: 90, color: HEAT, label: 'instant' }], points: [{ x: thm / RAD, y: S.vA, color: COL.c2, r: 5 }] });
      plot($('x2a-8-plot2'), { xmin: 0, xmax: 360, xstep: 90, ymin: a0, ymax: a1, xlabel: 'θ (deg)', ylabel: 'acceleration of A (m/s², right +)', series: [{ pts: pa, color: COL.c3, width: 2.4 }], vlines: [{ x: 90, color: HEAT, label: 'instant' }], points: [{ x: thm / RAD, y: S.aA, color: COL.c3, r: 5 }] });
      statsEvery(st, 'x2a-8-stats', () => [['θ', fmt(thm / RAD, 4) + '°'], ['ω_AB', fmt(S.wAB, 4) + ' rad/s' + sense(S.wAB)], ['α_AB', fmt(S.alAB, 4) + ' rad/s²' + sense(S.alAB), true], ['a_A', fmt(S.aA, 4) + ' m/s² (right +)', true]], 0.01);
    }
  });
})();

/* ---------- 2.A.9: links driven by a hydraulic cylinder ---------- */
(function(){
  const O = [0, 0.4], LOB = 0.5, LAB = 0.3, T0 = -0.58, T1 = 0.39;
  const yA = t => 0.4 * t - 0.05 * t * t, vAy = t => 0.4 - 0.1 * t, aAy = -0.1;
  function state(t, near){
    const A = [0, yA(t)], B = cc(A, LAB, O, LOB, near || [0.3, 0]); if (!B) return null;
    const rBA = sub(B, A), rBO = sub(B, O), vA = [0, vAy(t)];
    // vA + wAB k×rBA = wOB k×rBO  →  wAB(−rBA_y, rBA_x) − wOB(−rBO_y, rBO_x) = −vA
    const [wAB, wOB] = solve2(-rBA[1], rBO[1], rBA[0], -rBO[0], -vA[0], -vA[1]);
    const aA = [0, aAy], rhs = sub(add(mul(rBA, wAB * wAB), mul(rBO, -wOB * wOB)), aA);
    const [alAB, alOB] = solve2(-rBA[1], rBO[1], rBA[0], -rBO[0], rhs[0], rhs[1]);
    return { A, B, vA, vB: kx(wOB, rBO), wAB, wOB, alAB, alOB };
  }
  makeClip({
    id: 'x2a-9', speed: 0.25,
    presets: (C, st) => freezePresets(st)(),
    reset(st){ st.freeze = false; st.Bp = [0.3, 0]; },
    step(st){ st.tau = st.freeze ? 0 : T0 + st.t; if (st.tau > T1){ st.t = 0; st.tau = T0; } },
    draw(st){
      const cv = $('x2a-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const tau = st.tau ?? 0, S = state(tau, st.Bp); if (!S) return; st.Bp = S.B;
      st.g = { O, A: S.A, B: S.B };
      const b = [-0.42, 0.62, -0.62, 0.55]; autoH(cv, w, h, b); const { P, s } = view(w, h, b);
      // wall plate on the left that carries pin O, and the cylinder C bolted to it
      const [wx, wy0] = P(-0.13, 0.5), [, wy1] = P(-0.13, -0.6); line(ctx, wx, wy0, wx, wy1, COL.fg, 2); hatch(ctx, wx, wy1, wx, wy0, -1, 8, 6);
      const [ox, oy] = P(...O); ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(wx, oy - 14); ctx.lineTo(ox, oy - 6); ctx.lineTo(ox, oy + 6); ctx.lineTo(wx, oy + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      const [cx0, cy0] = P(-0.05, -0.33), [cx1, cy1] = P(0.05, -0.58);
      ctx.save(); ctx.fillStyle = '#c9cdd6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0); ctx.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0); ctx.restore();
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.fillRect(wx, P(0, -0.36)[1], cx0 - wx, 0.2 * s); ctx.strokeStyle = COL.fg; ctx.strokeRect(wx, P(0, -0.36)[1], cx0 - wx, 0.2 * s); ctx.restore();
      txt(ctx, 'C', cx1 + 14, (cy0 + cy1) / 2, { font: 'italic 15px Georgia, serif' });
      const [ax, ay] = P(...S.A); line(ctx, ax, ay, ax, cy0, COL.massEdge, 5);
      // dashed vertical line through O and A, and the angle θ between it and AB
      ctx.save(); ctx.setLineDash([3, 4]); line(ctx, ox, oy, ox, cy0, COL.muted, 1); ctx.restore();
      link(ctx, P, O, S.B, 11); link(ctx, P, S.A, S.B, 11);
      hole(ctx, P, O, 'O', 14, -14); hole(ctx, P, S.B, 'B', 16, 8); hole(ctx, P, S.A, 'A', -16, 6);
      const th = Math.atan2(S.B[0] - S.A[0], S.B[1] - S.A[1]);   // from the upward vertical, clockwise
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(ax, ay, 30, -Math.PI / 2, -Math.PI / 2 + th, false); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', ax + 42 * Math.sin(th / 2), ay - 42 * Math.cos(th / 2), { color: COL.muted, font: 'italic 14px Georgia, serif' });
      const k = 0.35;
      warr(ctx, P, S.A, S.vA, k, COL.c2, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c1, 'v_B');
      if (st.freeze) txt(ctx, INSTANT + ': θ = 90°', w / 2, 14, { font: '12px system-ui', color: HEAT });
      const pab = [], pob = []; let Bn = [0.3, 0];
      for (let i = 0; i <= 80; i++){ const q = T0 + (T1 - T0) * i / 80, z = state(q, Bn); if (!z) continue; Bn = z.B; pab.push([q, z.wAB]); pob.push([q, z.wOB]); }
      plot($('x2a-9-plot'), { xmin: T0, xmax: T1, ymin: -3, ymax: 1, xlabel: 'time from the instant (s)', ylabel: 'angular velocity (rad/s)', series: [{ pts: pab, color: COL.c3, width: 2.4, label: 'ω_AB' }, { pts: pob, color: COL.c1, width: 2.4, label: 'ω_OB' }],
        vlines: [{ x: 0, color: HEAT, label: 'instant' }], points: [{ x: tau, y: S.wAB, color: COL.c3, r: 5 }, { x: tau, y: S.wOB, color: COL.c1, r: 5 }] });
      statsEvery(st, 'x2a-9-stats', () => [['θ', fmt(th / RAD, 4) + '°'], ['ω_AB', fmt(S.wAB, 4) + ' rad/s' + sense(S.wAB), true], ['ω_OB', fmt(S.wOB, 4) + ' rad/s' + sense(S.wOB), true], ['α_AB', fmt(S.alAB, 4) + ' rad/s²' + sense(S.alAB)], ['α_OB', fmt(S.alOB, 4) + ' rad/s²' + sense(S.alOB)]], 0.01);
    }
  });
})();

/* ---------- 2.A.10: four-bar linkage through the position with OA and BD horizontal ---------- */
(function(){
  const L = 0.5;
  function setup(V){
    const D = [L + Math.sqrt(L * L - V.d * V.d) + L, V.d];
    // the crank can only reach angles for which |A − D| ≤ 2L
    let lo = 0, hi = 0; for (let q = 0; q > -Math.PI; q -= 0.002){ if (len(sub([L * Math.cos(q), L * Math.sin(q)], D)) > 2 * L - 1e-3) break; lo = q; }
    for (let q = 0; q < Math.PI; q += 0.002){ if (len(sub([L * Math.cos(q), L * Math.sin(q)], D)) > 2 * L - 1e-3) break; hi = q; }
    const amp = 0.85 * Math.min(-lo, hi);
    return { D, amp, Om: V.w / amp };
  }
  function state(V, Su, t, near){
    const phi = Su.amp * Math.sin(Su.Om * t), w1 = Su.amp * Su.Om * Math.cos(Su.Om * t), a1 = -Su.amp * Su.Om * Su.Om * Math.sin(Su.Om * t);
    const A = [L * Math.cos(phi), L * Math.sin(phi)], B = cc(A, L, Su.D, L, near); if (!B) return null;
    const rA = A, rBA = sub(B, A), rBD = sub(B, Su.D), vA = kx(w1, rA);
    const [w2, w3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], -vA[0], -vA[1]);
    const aA = sub(kx(a1, rA), mul(rA, w1 * w1)), rhs = sub(add(mul(rBA, w2 * w2), mul(rBD, -w3 * w3)), aA);
    const [a2, a3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], rhs[0], rhs[1]);
    return { phi, w1, A, B, vA, vB: kx(w3, rBD), w2, w3, a2, a3 };
  }
  makeClip({
    id: 'x2a-10', speed: 0.2,
    controls: [
      { key: 'w', label: 'ω_OA at the instant', min: 1, max: 6, step: 0.5, value: 3, unit: 'rad/s', dec: 2 },
      { key: 'd', label: 'Height d', min: 0.15, max: 0.45, step: 0.01, value: 0.4, unit: 'm', dec: 3 }
    ],
    presets: (C, st) => freezePresets(st)(),
    reset(st){ st.freeze = false; st.Su = setup(st.V); st.Bp = [L + Math.sqrt(L * L - st.V.d * st.V.d), st.V.d]; },
    step(st){ if (st.freeze) st.t = 0; const T = 2 * Math.PI / st.Su.Om; if (st.t > T) st.t -= T; },
    draw(st){
      const V = st.V, Su = st.Su, cv = $('x2a-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const S = state(V, Su, st.t, st.Bp); if (!S) return; st.Bp = S.B;
      st.g = { O: [0, 0], A: S.A, B: S.B, D: Su.D };
      const b = [-0.3, Su.D[0] + 0.25, -0.62, 0.95]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      // pin O stands on a pedestal on the floor, low enough for A to pass above it; pin D hangs from a bracket on a wall at its right
      groundPin(ctx, P, [0, 0], 'O', -20, -6, -0.3);
      const [dx, dy] = P(...Su.D), [wx] = P(Su.D[0] + 0.12, 0), [, wy0] = P(0, Su.D[1] + 0.25), [, wy1] = P(0, Su.D[1] - 0.25);
      line(ctx, wx, wy0, wx, wy1, COL.fg, 2); hatch(ctx, wx, wy0, wx, wy1, -1, 8, 6);
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(wx, dy - 14); ctx.lineTo(dx, dy - 6); ctx.lineTo(dx, dy + 6); ctx.lineTo(wx, dy + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      link(ctx, P, [0, 0], S.A, 11); link(ctx, P, S.A, S.B, 11); link(ctx, P, S.B, Su.D, 11);
      pinDot(ctx, ...P(0, 0)); hole(ctx, P, S.A, 'A', 16, 16); hole(ctx, P, S.B, 'B', -8, -16); hole(ctx, P, Su.D, 'D', 2, -18);
      const k = 0.09;
      warr(ctx, P, S.A, S.vA, k, COL.c1, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c2, 'v_B');
      if (Math.abs(S.phi) < 1e-9) txt(ctx, INSTANT + ': OA and BD horizontal', w / 2, 14, { font: '12px system-ui', color: HEAT });
      const T = 2 * Math.PI / Su.Om, p2 = [], p3 = []; let Bn = [L + Math.sqrt(L * L - V.d * V.d), V.d];
      for (let i = 0; i <= 120; i++){ const q = T * i / 120, z = state(V, Su, q, Bn); if (!z) continue; Bn = z.B; p2.push([q, z.w2]); p3.push([q, z.w3]); }
      const m = Math.max(...p2.concat(p3).map(p => Math.abs(p[1]))) * 1.1 || 1;
      plot($('x2a-10-plot'), { xmin: 0, xmax: T, ymin: -m, ymax: m, xlabel: 'time (s)', ylabel: 'angular velocity (rad/s)', series: [{ pts: p2, color: COL.c3, width: 2.4, label: 'ω_AB' }, { pts: p3, color: COL.c2, width: 2.4, label: 'ω_BD' }],
        vlines: [{ x: 0, color: HEAT, label: 'instant' }], points: [{ x: st.t, y: S.w2, color: COL.c3, r: 5 }, { x: st.t, y: S.w3, color: COL.c2, r: 5 }] });
      statsEvery(st, 'x2a-10-stats', () => [['ω_OA', fmt(S.w1, 4) + ' rad/s' + sense(S.w1)], ['ω_AB', fmt(S.w2, 4) + ' rad/s' + sense(S.w2)], ['ω_BD', fmt(S.w3, 4) + ' rad/s' + sense(S.w3)], ['α_AB', fmt(S.a2, 4) + ' rad/s²' + sense(S.a2), true], ['α_BD', fmt(S.a3, 4) + ' rad/s²' + sense(S.a3), true]], 0.02);
    }
  });
})();

subLabels();
})();
