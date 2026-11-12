/* =========================================================
   Chapter 2 animations: planar rigid body kinematics
   ========================================================= */
const RAD = Math.PI / 180;
const HOT = '#a61e4d';
const f2 = (v, d = 3) => `(${fmt(Math.abs(v[0]) < 1e-12 ? 0 : v[0], d)}, ${fmt(Math.abs(v[1]) < 1e-12 ? 0 : v[1], d)})`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const kx = (w, r) => [-w * r[1], w * r[0]];          // (w k) × r
const len = a => Math.hypot(a[0], a[1]);
const rot = (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)];
const sgnTxt = w => Math.abs(w) < 1e-9 ? '' : w > 0 ? ' (CCW)' : ' (CW)';
const solve2 = (a, b, c, d, e, f) => { const D = a * d - b * c; return [(e * d - b * f) / D, (a * f - e * c) / D]; }; // [a b; c d] x = [e; f]

// world-to-canvas mapping that keeps the aspect ratio; b = [xmin, xmax, ymin, ymax]
function view(w, h, b, pad = 16){
  const s = Math.min((w - 2 * pad) / (b[1] - b[0]), (h - 2 * pad) / (b[3] - b[2]));
  const ox = (w - s * (b[1] - b[0])) / 2, oy = (h - s * (b[3] - b[2])) / 2;
  return { s, P: (x, y) => [ox + (x - b[0]) * s, oy + (b[3] - y) * s] };
}
// adjust canvas height to the drawing's proportions on narrow screens
function autoH(cv, w, h, b, pad = 16){
  if (!cv.dataset.h0) cv.dataset.h0 = String(h);
  const want = Math.round(Math.min(+cv.dataset.h0, (b[3] - b[2]) / (b[1] - b[0]) * (w - 2 * pad) + 2 * pad));
  if (Math.abs(want - h) > 3) cv.style.height = want + 'px';
}
function warr(ctx, P, p, v, k, col, label, wd = 2.6, dash){
  const [x1, y1] = P(...p), [x2, y2] = P(p[0] + v[0] * k, p[1] + v[1] * k);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  if (dash){ ctx.save(); ctx.setLineDash(dash); }
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (dash) ctx.restore();
  if (label){
    const L = Math.hypot(x2 - x1, y2 - y1);
    txt(ctx, label, x2 + (x2 - x1) / L * 12, y2 + (y2 - y1) / L * 12, { color: col, font: 'italic 14px Georgia, serif' });
  }
}
function bar(ctx, P, a, b, wpx = 12, label){
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = COL.massEdge; ctx.lineWidth = wpx + 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = COL.mass; ctx.lineWidth = wpx; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
  if (label) txt(ctx, label, (x1 + x2) / 2 + 10, (y1 + y2) / 2 - 10, { font: 'italic 13px Georgia, serif', color: COL.muted });
}
function pin(ctx, P, p, label, dx = 12, dy = -12, fixed){
  const [x, y] = P(...p);
  if (fixed){ ctx.save(); ctx.fillStyle = COL.spring; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 16); ctx.lineTo(x + 10, y + 16); ctx.closePath(); ctx.fill(); ctx.restore(); hatch(ctx, x - 14, y + 16, x + 14, y + 16, 1, 6, 5); }
  ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
  if (label) txt(ctx, label, x + dx, y + dy, { font: 'italic 15px Georgia, serif' });
}
function dot(ctx, P, p, col, r = 5){ const [x, y] = P(...p); ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
function icMark(ctx, P, p, label = 'IC'){
  const [x, y] = P(...p); if (!isFinite(x) || !isFinite(y)) return;
  ctx.save(); ctx.strokeStyle = HOT; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x + 11, y); ctx.moveTo(x, y - 11); ctx.lineTo(x, y + 11); ctx.stroke(); ctx.restore();
  txt(ctx, label, x + 14, y - 14, { color: HOT, font: '600 12px system-ui', align: 'left' });
}
// a line through p in direction u, drawn long
function infLine(ctx, P, p, u, col = COL.axis, dash = [5, 4]){
  const L = 100, a = P(p[0] - u[0] * L, p[1] - u[1] * L), b = P(p[0] + u[0] * L, p[1] + u[1] * L);
  line(ctx, a[0], a[1], b[0], b[1], col, 1.2, dash);
}
function wheel(ctx, P, c, R, ang, opts = {}){
  const [x, y] = P(...c), s = len(sub(P(c[0] + R, c[1]), [x, y]));
  ctx.save(); ctx.fillStyle = opts.fill || COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  if (opts.hub){ ctx.fillStyle = COL.card; ctx.beginPath(); ctx.arc(x, y, opts.hub * s / R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 1.5;
  for (let k = 0; k < (opts.spokes ?? 4); k++){ const a = ang + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 0.92 * Math.cos(a), y - s * 0.92 * Math.sin(a)); ctx.stroke(); }
  ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.fill();
  ctx.restore();
}
function chipSet(id, items, st, reset, key){
  return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } }));
}
function markChips(id, st, key, items){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', items[i] && items[i][1] === st[key]));
}

/* ---------- linkage solvers ---------- */
// circle–circle intersection: point at distance b from A and c from D; branch = +1/-1 picks the side
function cc(A, b, D, c, branch){
  const d = len(sub(D, A)); if (d > b + c || d < Math.abs(b - c) || d < 1e-12) return null;
  const a = (b * b - c * c + d * d) / (2 * d), hh = Math.sqrt(Math.max(b * b - a * a, 0)), u = mul(sub(D, A), 1 / d);
  return add(add(A, mul(u, a)), mul([-u[1], u[0]], hh * branch));
}
// four-bar O-A-B-D: crank OA (angle phi, rate w1, accel a1) — returns positions, angular velocities and accelerations
function fourbar(O, D, a, b, c, phi, w1, a1, branch){
  const A = add(O, [a * Math.cos(phi), a * Math.sin(phi)]), B = cc(A, b, D, c, branch);
  if (!B) return null;
  const rA = sub(A, O), rBA = sub(B, A), rBD = sub(B, D);
  const vA = kx(w1, rA);
  // wAB k×rBA − wBD k×rBD = −vA
  const [w2, w3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], -vA[0], -vA[1]);
  const aA = sub(kx(a1, rA), mul(rA, w1 * w1));
  const rhs = add(sub(mul(rBA, w2 * w2), mul(rBD, w3 * w3)), mul(aA, -1));
  const [a2, a3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], rhs[0], rhs[1]);
  return { A, B, vA, vB: kx(w3, rBD), w2, w3, a2, a3, aA };
}
// intersection of two lines p + s u and q + t v
function lineX(p, u, q, v){
  const D = u[0] * (-v[1]) - (-v[0]) * u[1]; if (Math.abs(D) < 1e-9) return null;
  const r = sub(q, p), s = (r[0] * (-v[1]) - (-v[0]) * r[1]) / D;
  return add(p, mul(u, s));
}

/* =========================================================
   A. RIGID BODY KINEMATICS
   ========================================================= */
// --- vB = vA + ω × r_B/A on a moving plate
makeClip({
  id: 'c-relvel', speed: 0.5,
  controls: [
    { key: 'vx', label: 'v_A, x part', min: -2, max: 2, step: 0.1, value: 1, unit: 'm/s', dec: 2 },
    { key: 'vy', label: 'v_A, y part', min: -2, max: 2, step: 0.1, value: 0.3, unit: 'm/s', dec: 2 },
    { key: 'w', label: 'angular velocity ω', min: -3, max: 3, step: 0.1, value: 1.2, unit: 'rad/s', dec: 2 },
    { key: 'r', label: 'distance AB', min: 0.3, max: 2, step: 0.05, value: 1.2, unit: 'm', dec: 2 }
  ],
  presets: C => [{ label: 'Pure translation (ω = 0)', apply: () => C.set({ w: 0 }) }, { label: 'Pure rotation about A (v_A = 0)', apply: () => C.set({ vx: 0, vy: 0 }) }, { label: 'Defaults', apply: () => C.set(C.defaults) }],
  reset(st){ st.T = 4; },
  step(st){ st.T = Math.min(4, 3.2 / Math.max(Math.hypot(st.V.vx, st.V.vy), 1e-6)); if (st.t > st.T) st.t = 0; },
  draw(st){
    const cv = $('c-relvel-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, b = [-3.2, 3.2, -1.9, 1.9]; autoH(cv, w, h, b); const { P } = view(w, h, b);
    const tc = st.t - st.T / 2, A = [V.vx * tc, V.vy * tc], th = 0.4 + V.w * tc;
    const rBA = rot([V.r, 0], th), B = add(A, rBA);
    // the plate: a rounded triangle containing A and B
    const C3 = add(A, rot([V.r * 0.35, -0.75], th)), pts = [add(A, rot([-0.45, 0.35], th)), add(B, rot([0.35, 0.3], th)), add(B, rot([0.3, -0.45], th)), add(C3, rot([-0.2, -0.3], th))];
    ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath();
    pts.forEach((p, i) => { const q = P(...p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const [ax, ay] = P(...A), [bx, by] = P(...B); line(ctx, ax, ay, bx, by, COL.muted, 1.4, [4, 3]);
    pin(ctx, P, A, 'A', -14, 12); pin(ctx, P, B, 'B', 4, 16);
    const vA = [V.vx, V.vy], wr = kx(V.w, rBA), vB = add(vA, wr), k = 0.6;
    warr(ctx, P, A, vA, k, COL.c1, 'v_A');
    warr(ctx, P, B, vA, k, COL.c1, '', 1.6, [4, 3]);
    const g0 = add(B, mul(vA, k)); warr(ctx, P, g0, wr, k, COL.c3, '', 2.2);
    { const m = P(...add(g0, mul(wr, k / 2))), d = len(wr) > 1e-9 ? mul(wr, 1 / len(wr)) : [0, 1]; txt(ctx, 'ω×r', m[0] + d[1] * 18, m[1] + d[0] * 18, { color: COL.c3, font: 'italic 14px Georgia, serif' }); }
    warr(ctx, P, B, vB, k, COL.c2, 'v_B', 3.2);
    statsEvery(st, 'c-relvel-stats', () => [['r_B/A', f2(rBA) + ' m'], ['ω × r_B/A', f2(wr) + ' m/s'], ['v_B = v_A + ω × r_B/A', f2(vB) + ' m/s', true],
      ['(ω × r)·r_B/A', fmt(wr[0] * rBA[0] + wr[1] * rBA[1], 3) + ' (always 0: perpendicular)', true]]);
  }
});

// --- relative acceleration: α × r and −ω² r
makeClip({
  id: 'c-relacc', speed: 0.5,
  controls: [
    { key: 'w0', label: 'ω at the start', min: -4, max: 4, step: 0.1, value: 1, unit: 'rad/s', dec: 2 },
    { key: 'al', label: 'angular acceleration α', min: -3, max: 3, step: 0.1, value: 1, unit: 'rad/s²', dec: 2 },
    { key: 'r', label: 'distance AB', min: 0.3, max: 2, step: 0.05, value: 1.5, unit: 'm', dec: 2 }
  ],
  presets: C => [{ label: 'ω = 0 at the start', apply: () => C.set({ w0: 0, al: 1 }) }, { label: 'Constant ω (α = 0)', apply: () => C.set({ w0: 1.5, al: 0 }) }, { label: 'Spinning down', apply: () => C.set({ w0: 3, al: -1.5 }) }],
  reset(st){ st.T = 3; },
  step(st){ if (st.t > st.T) st.t = 0; },
  draw(st){
    const cv = $('c-relacc-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, R = Math.max(V.r, 0.3), b = [-R * 1.6, R * 1.6, -R * 1.3, R * 1.3]; autoH(cv, w, h, b);
    const { P } = view(w, h, b);
    const t = st.t, om = V.w0 + V.al * t, th = 0.3 + V.w0 * t + 0.5 * V.al * t * t;
    const A = [0, 0], r = rot([R, 0], th), B = r;
    const [cx, cy] = P(0, 0), [ex, ey] = P(R, 0); const sp = ex - cx;
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy, sp, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    bar(ctx, P, A, B, 14); pin(ctx, P, A, 'A', -14, 14, true); pin(ctx, P, B, 'B', 14, -14);
    const at = kx(V.al, r), an = mul(r, -om * om), aB = add(at, an);
    const amax = Math.max(len(aB), len(at), len(an), 1e-6), k = R * 0.9 / amax;
    warr(ctx, P, B, at, k, COL.c3, 'α×r', 2.2);
    warr(ctx, P, B, an, k, COL.c4, '−ω²r', 2.2);
    warr(ctx, P, B, aB, k, COL.c2, 'a_B/A', 3.4);
    const ang = Math.atan2(Math.abs(at[0] * r[1] - at[1] * r[0]) / R, -(aB[0] * r[0] + aB[1] * r[1]) / R) / RAD;
    statsEvery(st, 'c-relacc-stats', () => [['ω now', fmt(om, 3) + ' rad/s' + sgnTxt(om)], ['α × r (perpendicular to AB)', fmt(len(at), 3) + ' m/s²'], ['ω² r (toward A)', fmt(len(an), 3) + ' m/s²'],
      ['a_B/A', fmt(len(aB), 3) + ' m/s²', true], ['angle between a_B/A and line BA', fmt(Math.atan2(Math.abs(V.al) * R, om * om * R) / RAD, 3) + '°', true]]);
  }
});

// --- rolling without slipping vs skidding and spinning
(function(){
  const MODES = [['Rolling, no slip', 'roll'], ['Skidding (wheel locked)', 'skid'], ['Spinning in place', 'spin'], ['Spinning too fast', 'fast']];
  makeClip({
    id: 'c-roll', speed: 0.5,
    controls: [{ key: 'v', label: 'speed of center v_O', min: 0.2, max: 3, step: 0.1, value: 1.5, unit: 'm/s', dec: 2 }],
    presets: (C, st, reset) => chipSet('c-roll', MODES, st, reset, 'mode'),
    setup(st){ st.mode = 'roll'; },
    reset(st){ markChips('c-roll', st, 'mode', MODES); st.trail = []; st.x0 = -4.2; },
    step(st){ if (st.trail.length && st.t > 8){ st.t = 0; st.trail = []; } },
    draw(st){
      const cv = $('c-roll-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const R = 0.8, V = st.V, Wd = w < 560 ? 2.6 : 4.6, b = [-Wd, Wd, -0.5, 2.8]; autoH(cv, w, h, b); const { P, s } = view(w, h, b);
      const vO = st.mode === 'spin' ? 0 : V.v, om = { roll: -V.v / R, skid: 0, spin: -V.v / R, fast: -1.8 * V.v / R }[st.mode];
      let x = st.mode === 'spin' ? 0 : -Wd + 0.6 + vO * st.t; if (x > Wd + R){ st.t = 0; st.trail = []; x = -Wd + 0.6; }
      const ang = Math.PI / 2 + om * st.t, O = [x, R];
      const [g1x, g1y] = P(-Wd, 0), [g2x] = P(Wd, 0); hatch(ctx, g1x, g1y, g2x, g1y, 1);
      const mk = add(O, [R * Math.cos(ang), R * Math.sin(ang)]); st.trail.push(mk); if (st.trail.length > 1500) st.trail.shift();
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.6; ctx.beginPath(); st.trail.forEach((p, i) => { const q = P(...p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
      wheel(ctx, P, O, R, ang);
      dot(ctx, P, mk, COL.c4, 6);
      const k = 0.35;
      for (let i = 0; i < 8; i++){ const a = -Math.PI / 2 + i * Math.PI / 4, p = add(O, [R * Math.cos(a), R * Math.sin(a)]), v = add([vO, 0], kx(om, sub(p, O))); warr(ctx, P, p, v, k, COL.c2, '', 2); }
      warr(ctx, P, O, [vO, 0], k, COL.c1, 'v_O', 2.6);
      const vC = vO + om * R;  // x-velocity of contact point
      const [cx, cy] = P(x, 0);
      txt(ctx, Math.abs(vC) < 1e-9 ? 'contact point: v = 0' : `contact point slides: v = ${fmt(vC, 3)} m/s`, cx, cy + 18, { font: '12px system-ui', color: Math.abs(vC) < 1e-9 ? COL.c3 : HOT });
      statsEvery(st, 'c-roll-stats', () => [['v_O', fmt(vO, 3) + ' m/s'], ['ω', fmt(om, 3) + ' rad/s' + sgnTxt(om)], ['v of contact point = v_O + ωR', fmt(vC, 3) + ' m/s', true],
        ['v of top point', fmt(vO - om * R, 3) + ' m/s'], ['acceleration of contact point (steady rolling) = Rω²', fmt(R * om * om, 3) + ' m/s² (up)', true]]);
    }
  });
})();

/* =========================================================
   B. INSTANT CENTERS
   ========================================================= */
// --- sliding link (ladder): used by the concept clip and by Example 2.A.7
function makeLadder(id, o){
  makeClip({
    id, speed: o.speed ?? 0.5,
    controls: o.controls,
    presets: o.presets,
    reset(st){ st.tr = []; },
    step(st){
      const V = st.V, L = V.L, xs = L * Math.cos(o.th0 * RAD), xe = L * Math.cos(o.th1 * RAD);
      st.xB = xs + V.vB * st.t * (o.slow || 1);
      if (st.xB > xe){ st.t = 0; st.tr = []; st.xB = xs; }
    },
    draw(st){
      const V = st.V, L = V.L, cv = $(id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!(L > 0)){ drawMessage(cv, 'Length must be positive'); return; }
      const b = [-0.35 * L, 1.45 * L, -0.2 * L, 1.12 * L]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      const xB = st.xB ?? L * Math.cos(o.th0 * RAD), yA = Math.sqrt(Math.max(L * L - xB * xB, 0)), A = [0, yA], B = [xB, 0], G = [xB / 2, yA / 2];
      const th = Math.atan2(yA, xB), om = V.vB / (L * Math.sin(th)), al = V.vB * Math.cos(th) * om / (L * Math.sin(th) ** 2), vA = [0, -V.vB / Math.tan(th)];
      const [ox, oy] = P(0, 0), [fx] = P(1.4 * L, 0), [, ty] = P(0, 1.1 * L);
      hatch(ctx, ox, oy, fx, oy, 1); hatch(ctx, ox, ty, ox, oy, 1);
      const IC = [xB, yA];
      if (o.ic){
        const [cx0, cy0] = P(0, 0), s = P(L, 0)[0] - cx0;
        ctx.save(); ctx.strokeStyle = HOT; ctx.globalAlpha = 0.35; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx0, cy0, s, -Math.PI / 2, 0); ctx.stroke(); ctx.restore();
        st.tr.push(IC); ctx.save(); ctx.strokeStyle = HOT; ctx.lineWidth = 2; ctx.beginPath(); st.tr.forEach((p, i) => { const q = P(...p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
        infLine(ctx, P, A, [1, 0]); infLine(ctx, P, B, [0, 1]);
        [A, B, G].forEach(p => { const [x1, y1] = P(...IC), [x2, y2] = P(...p); line(ctx, x1, y1, x2, y2, HOT, 1, [2, 3]); });
      }
      bar(ctx, P, A, B, 12); pin(ctx, P, A, 'A', 16, -6); pin(ctx, P, B, 'B', 4, 18);
      if (o.ic){ dot(ctx, P, G, COL.fg, 4); txt(ctx, 'G', P(...G)[0] - 12, P(...G)[1] - 4, { font: 'italic 14px Georgia, serif' }); }
      const k = 0.22 * L / Math.max(V.vB, 1e-6);
      warr(ctx, P, B, [V.vB, 0], k, COL.c1, 'v_B'); warr(ctx, P, A, vA, k, COL.c2, 'v_A');
      if (o.ic){ warr(ctx, P, G, kx(-om, sub(G, IC)), k, COL.c3, 'v_G'); icMark(ctx, P, IC); }
      // angle arc at B
      const [bx, by] = P(...B); ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(bx, by, 26, Math.PI, Math.PI + th, false); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', bx - 36 * Math.cos(th / 2), by - 36 * Math.sin(th / 2), { color: COL.muted });
      if (o.mark){ const thm = o.mark * RAD, xm = L * Math.cos(thm); const [mx, my] = P(xm, 0); line(ctx, mx, my - 6, mx, my + 6, HOT, 2); txt(ctx, `θ = ${o.mark}°`, mx, my + 18, { font: '11px system-ui', color: HOT }); }
      statsEvery(st, id + '-stats', () => o.stats({ th, om, al, vA, L, V, IC }));
    }
  });
}
makeLadder('c-ladder', {
  ic: true, th0: 82, th1: 12, speed: 0.5,
  controls: [{ key: 'vB', label: 'speed of B', min: 0.1, max: 2, step: 0.1, value: 0.5, unit: 'm/s', dec: 2 }, { key: 'L', label: 'length L', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'm', dec: 2 }],
  stats: ({ th, om, vA, L, V }) => [['θ', fmt(th / RAD, 3) + '°'], ['ω = v_B / |r_B/IC|', fmt(om, 3) + ' rad/s (CCW)', true], ['v_A = ω |r_A/IC|', fmt(-vA[1], 3) + ' m/s (down)'], ['v_G = ω · L/2', fmt(om * L / 2, 3) + ' m/s', true]]
});

// --- the velocity field of a body about its instant center
makeClip({
  id: 'c-field', buttons: false,
  controls: [
    { key: 'cx', label: 'IC, x position', min: -3, max: 3, step: 0.1, value: -1.5, unit: 'm', dec: 2 },
    { key: 'cy', label: 'IC, y position', min: -2, max: 2, step: 0.1, value: -1, unit: 'm', dec: 2 },
    { key: 'w', label: 'angular velocity ω', min: -2, max: 2, step: 0.1, value: 0.8, unit: 'rad/s', dec: 2 }
  ],
  presets: C => [{ label: 'IC inside the body', apply: () => C.set({ cx: 0.2, cy: 0.1 }) }, { label: 'IC far away (almost translation)', apply: () => C.set({ cx: 0, cy: -60, w: 0.03 }) }, { label: 'Clockwise', apply: () => C.set({ w: -0.8 }) }],
  draw(st){
    const cv = $('c-field-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, b = [-3.6, 3.6, -2.3, 2.3]; autoH(cv, w, h, b); const { P } = view(w, h, b);
    const IC = [V.cx, V.cy];
    // the body turns about the IC at ω. The motion plays over a short window centred on the drawn position and then repeats,
    // so the body stays on screen even when the IC is far away (the window ends before the body moves about 1.2 m).
    const far = Math.max(0.3, len(IC)), T = Math.min(3.2, 2.4 / Math.max(1e-6, Math.abs(V.w) * far));
    const tau = ((st.t % T) + T) % T - T / 2, phi = V.w * tau, c = Math.cos(phi), s = Math.sin(phi);
    const R = p => [IC[0] + c * (p[0] - IC[0]) - s * (p[1] - IC[1]), IC[1] + s * (p[0] - IC[0]) + c * (p[1] - IC[1])];
    // starting outline (dashed), then the body at its current position: a rounded rectangle turned by φ about the IC
    const body = (fill) => { const [x1, y1] = P(-1.8, 1), [x2, y2] = P(1.8, -1), [ix, iy] = P(...IC);
      ctx.save(); ctx.translate(ix, iy); ctx.rotate(fill ? -phi : -V.w * (-T / 2)); ctx.translate(-ix, -iy);
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x1, y1, x2 - x1, y2 - y1, 14); else ctx.rect(x1, y1, x2 - x1, y2 - y1);
      if (fill){ ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); }
      else { ctx.setLineDash([5, 5]); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.restore(); };
    body(false); body(true);
    const A = R([-1.5, 0.7]), B = R([1.5, -0.6]);
    const vA = kx(V.w, sub(A, IC)), vB = kx(V.w, sub(B, IC));
    const vmax = Math.max(1e-9, ...[[-1.8, 1], [1.8, 1], [-1.8, -1], [1.8, -1]].map(p => len(kx(V.w, sub(p, IC))))), k = 0.55 / vmax;
    for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++){ const p = R([i * 0.55, j * 0.75]); warr(ctx, P, p, kx(V.w, sub(p, IC)), k, COL.c5, '', 1.6); }
    // perpendiculars through A and B meet at IC
    [[A, vA], [B, vB]].forEach(([p, v]) => { if (len(v) > 1e-9) infLine(ctx, P, p, mul(sub(p, IC), 1 / Math.max(len(sub(p, IC)), 1e-9)), HOT, [5, 4]); });
    pin(ctx, P, A, 'A', -12, -12); pin(ctx, P, B, 'B', 12, 14);
    warr(ctx, P, A, vA, k, COL.c2, 'v_A', 3); warr(ctx, P, B, vB, k, COL.c2, 'v_B', 3);
    if (Math.abs(IC[1]) < 3 && Math.abs(IC[0]) < 4) icMark(ctx, P, IC); else txt(ctx, 'IC is off the screen', w - 10, 14, { font: '12px system-ui', color: HOT, align: 'right' });
    setStats('c-field-stats', [['|v_A| = |ω| · |r_A/IC|', fmt(len(vA), 3) + ' m/s'], ['|v_B| = |ω| · |r_B/IC|', fmt(len(vB), 3) + ' m/s'], ['ratio |v_A| / |v_B|', fmt(len(vA) / Math.max(len(vB), 1e-12), 3)], ['= |r_A/IC| / |r_B/IC|', fmt(len(sub(A, IC)) / Math.max(len(sub(B, IC)), 1e-12), 3), true]]);
  }
});

/* =========================================================
   C. MECHANISMS
   ========================================================= */
// --- slider–crank
makeClip({
  id: 'c-slider', speed: 0.5,
  controls: [
    { key: 'w', label: 'crank speed ω_OA', min: -4, max: 4, step: 0.1, value: 2, unit: 'rad/s', dec: 2 },
    { key: 'r', label: 'crank length r', min: 0.1, max: 1, step: 0.05, value: 0.5, unit: 'm', dec: 2 },
    { key: 'l', label: 'rod length ℓ', min: 0.3, max: 3, step: 0.05, value: 1.4, unit: 'm', dec: 2 }
  ],
  presets: C => [{ label: 'Long rod (ℓ = 4r)', apply: () => C.set({ r: 0.4, l: 1.6 }) }, { label: 'Short rod (ℓ = 1.5r)', apply: () => C.set({ r: 0.6, l: 0.9 }) }],
  reset(st){ const V = st.V; st.ok = V.r > 0 && V.l > V.r; showNotes('c-slider-notes', st.ok ? [] : [{ level: 'warn', html: 'The rod must be longer than the crank (ℓ &gt; r), otherwise the crank cannot turn all the way around.' }]); },
  draw(st){
    const cv = $('c-slider-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Choose ℓ > r'); return; }
    const V = st.V, r = V.r, l = V.l, b = [-r - 0.3, r + l + 0.55, -r - 0.3, Math.max(r, 0.35) + 0.45]; autoH(cv, w, h, b); const { P } = view(w, h, b);
    const phi = 0.6 + V.w * st.t, A = [r * Math.cos(phi), r * Math.sin(phi)], dx = Math.sqrt(l * l - A[1] * A[1]), B = [A[0] + dx, 0];
    const rBA = sub(B, A), vA = kx(V.w, A), wAB = -vA[1] / rBA[0], vB = vA[0] - wAB * rBA[1];
    // ground: a fixed back plate with a horizontal slot for the slider; O is pinned to the plate and the crank turns
    // in front of it, so the crank never passes through a floor (the plate stands on the ground below the crank circle)
    const py = r + 0.12, [qx0, qy0] = P(-r - 0.2, py), [qx1, qy1] = P(r + l + 0.45, -py);
    ctx.save(); ctx.fillStyle = '#f6f2e8'; ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.2; ctx.fillRect(qx0, qy0, qx1 - qx0, qy1 - qy0); ctx.strokeRect(qx0, qy0, qx1 - qx0, qy1 - qy0);
    const [sx0, sy0] = P(Math.max(l - r - 0.22, 0.12), 0.15), [sx1, sy1] = P(r + l + 0.25, -0.15);
    ctx.fillStyle = '#e8e1cf'; ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0); ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0); ctx.restore();
    hatch(ctx, qx0 - 10, qy1, qx1 + 10, qy1, 1);
    const [bx, by] = P(...B), [hx] = P(B[0] + 0.15, 0); const bw = (hx - bx) * 2;
    block(ctx, bx, by, bw * 1.3, bw * 0.85, 0, '');
    // instant center of the rod: line OA extended ∩ vertical through B
    const IC = lineX([0, 0], A, B, [0, 1]);
    if (IC && Math.abs(IC[1]) < 6){ infLine(ctx, P, [0, 0], mul(A, 1 / r), HOT); infLine(ctx, P, B, [0, 1], HOT);
      if (IC[0] > b[0] && IC[0] < b[1] && IC[1] > b[2] && IC[1] < b[3]) icMark(ctx, P, IC, 'IC of rod'); else txt(ctx, 'IC of rod is off the picture', w - 10, 14, { font: '12px system-ui', color: HOT, align: 'right' }); }
    bar(ctx, P, [0, 0], A, 10); bar(ctx, P, A, B, 10);
    pin(ctx, P, [0, 0], 'O', -14, 4); pin(ctx, P, A, 'A', 12, -12); pin(ctx, P, B, 'B', 0, -16);
    const k = 0.18 / Math.max(Math.abs(V.w) * r, 1e-6);
    warr(ctx, P, A, vA, k, COL.c1, 'v_A'); warr(ctx, P, B, [vB, 0], k, COL.c2, 'v_B', 3);
    // plot over one revolution
    const N = 240, pv = [], pw = [];
    for (let i = 0; i <= N; i++){ const f = 2 * Math.PI * i / N, a = [r * Math.cos(f), r * Math.sin(f)], d = Math.sqrt(l * l - a[1] * a[1]), va = kx(V.w, a), wab = -va[1] / d; pv.push([f / RAD, va[0] + wab * a[1] * 1]); pw.push([f / RAD, wab]); }
    const fd = (((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / RAD, lim = Math.max(...pv.map(p => Math.abs(p[1])), ...pw.map(p => Math.abs(p[1])), 0.1) * 1.15;
    plot($('c-slider-plot'), { xmin: 0, xmax: 360, xstep: 90, ymin: -lim, ymax: lim, xlabel: 'crank angle φ (deg)', ylabel: 'v_B (m/s), ω_AB (rad/s)',
      series: [{ pts: pv, color: COL.c2, width: 2.4 }, { pts: pw, color: COL.c3, width: 2, dash: [6, 4] }], vlines: [{ x: fd }], points: [{ x: fd, y: vB, color: COL.c2 }, { x: fd, y: wAB, color: COL.c3 }] });
    statsEvery(st, 'c-slider-stats', () => [['φ', fmt(fd, 3) + '°'], ['ω_AB = −v_Ay / (x_B − x_A)', fmt(wAB, 3) + ' rad/s' + sgnTxt(wAB), true], ['v_B', fmt(vB, 3) + ' m/s', true]]);
  }
});

// --- four-bar with all three instant centers (concept)
makeClip({
  id: 'c-fourbar', speed: 0.5,
  controls: [
    { key: 'a', label: 'crank OA', min: 0.3, max: 2, step: 0.05, value: 0.8, unit: 'm', dec: 2 },
    { key: 'b', label: 'coupler AB', min: 0.5, max: 4, step: 0.05, value: 2.4, unit: 'm', dec: 2 },
    { key: 'c', label: 'rocker BD', min: 0.5, max: 4, step: 0.05, value: 1.8, unit: 'm', dec: 2 },
    { key: 'w', label: 'crank speed ω_OA', min: -3, max: 3, step: 0.1, value: 1, unit: 'rad/s', dec: 2 }
  ],
  presets: C => [{ label: 'Crank–rocker', apply: () => C.set({ a: 0.8, b: 2.4, c: 1.8 }) }, { label: 'Parallelogram', apply: () => C.set({ a: 1.2, b: 2.2, c: 1.2 }) }],
  reset(st){ st.phi = 1.2; st.dir = 1; st.lastT = 0; st.br = 1; },
  step(st){
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t; const D = [2.2, 0];
    let nphi = st.phi + st.dir * V.w * dt;
    if (!fourbar([0, 0], D, V.a, V.b, V.c, nphi, 1, 0, st.br)){ st.dir *= -1; nphi = st.phi; }  // reverse at a dead position
    st.phi = nphi;
  },
  draw(st){
    const cv = $('c-fourbar-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, D = [2.2, 0], ext = Math.max(V.a, V.c, 1) + 0.3, b = [-ext, 2.2 + ext, -ext - 0.05, ext + 0.4]; autoH(cv, w, h, b); const { P } = view(w, h, b);
    const S = fourbar([0, 0], D, V.a, V.b, V.c, st.phi, st.dir * V.w, 0, st.br);
    if (!S){ drawMessage(cv, 'These link lengths cannot be assembled. Try the presets.'); return; }
    const IC = lineX([0, 0], S.A, D, sub(S.B, D));
    const [o1x, o1y] = P(0, 0), [d1x] = P(...D);
    line(ctx, o1x, o1y, d1x, o1y, COL.axis, 1, [6, 4]);
    if (IC && len(IC) < 12){ infLine(ctx, P, [0, 0], mul(S.A, 1 / V.a), HOT); infLine(ctx, P, D, mul(sub(S.B, D), 1 / V.c), HOT); }
    // O and D stand on posts whose feet are on a floor below anything the links can reach; the links turn in front of the posts
    const yg = -(Math.max(V.a, V.c) + 0.15), [, gyy] = P(0, yg);
    [[0, 0], D].forEach(q => { const [qx, qy] = P(...q); ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(qx - 6, qy); ctx.lineTo(qx + 6, qy); ctx.lineTo(qx + 12, gyy); ctx.lineTo(qx - 12, gyy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); });
    const [gl] = P(b[0] + 0.1, yg), [gr] = P(b[1] - 0.1, yg); hatch(ctx, gl, gyy, gr, gyy, 1);
    bar(ctx, P, [0, 0], S.A, 10); bar(ctx, P, S.A, S.B, 10); bar(ctx, P, D, S.B, 10);
    pin(ctx, P, [0, 0], 'O', -16, 4); pin(ctx, P, D, 'D', 16, 4); pin(ctx, P, S.A, 'A', -12, -12); pin(ctx, P, S.B, 'B', 12, -12);
    const k = 0.5 / Math.max(len(S.vA), len(S.vB), 1e-6);
    warr(ctx, P, S.A, S.vA, k, COL.c1, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c2, 'v_B');
    if (IC && len(IC) < 12 && IC[0] > b[0] && IC[0] < b[1] && IC[1] > b[2] && IC[1] < b[3]) icMark(ctx, P, IC, 'IC of AB');
    else if (IC && len(IC) < 12) txt(ctx, 'IC of AB is off the picture', w - 10, 14, { font: '12px system-ui', color: HOT, align: 'right' });
    else txt(ctx, 'IC of AB is far away: AB is almost translating', w / 2, 16, { font: '12px system-ui', color: HOT });
    statsEvery(st, 'c-fourbar-stats', () => [['ω_OA', fmt(st.dir * V.w, 3) + ' rad/s'], ['ω_AB (vector method)', fmt(S.w2, 3) + ' rad/s' + sgnTxt(S.w2), true],
      ['ω_AB = |v_A| / |r_A/IC|', IC ? fmt(len(S.vA) / len(sub(S.A, IC)), 3) + ' rad/s' : '0 (no IC: translation)', true], ['ω_BD', fmt(S.w3, 3) + ' rad/s' + sgnTxt(S.w3)]]);
  }
});

/* =========================================================
   WORKED-EXAMPLE ANIMATIONS
   ========================================================= */
// Example 2.A.5: decelerating rolling wheel, acceleration of rim point P
(function(){
  const VIEW = [['Play the motion', 'play'], ['Freeze at the instant', 'freeze']];
  makeClip({
    id: 'e-roll', speed: 0.25,
    presets: (C, st, reset) => chipSet('e-roll', VIEW, st, reset, 'mode'),
    setup(st){ st.mode = 'play'; },
    reset(st){ markChips('e-roll', st, 'mode', VIEW); },
    step(st){ if (st.mode === 'freeze') st.t = 0; if (st.t > 5 / 3 + 0.6) st.t = 0; },
    draw(st){
      const cv = $('e-roll-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const R = 2, b = [-3, 8, -1.3, 5.2]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      const t = Math.min(st.t, 5 / 3), vO = 5 - 3 * t, aO = st.t < 5 / 3 ? -3 : 0, x = 5 * t - 1.5 * t * t, om = -vO / R, al = -aO / R;
      const th = Math.PI / 2 - x / R, O = [x, R], rp = [R * Math.cos(th), R * Math.sin(th)], Pp = add(O, rp);
      const [g1x, g1y] = P(-3, 0), [g2x] = P(8, 0); hatch(ctx, g1x, g1y, g2x, g1y, 1);
      wheel(ctx, P, O, R, th);
      pin(ctx, P, O, 'O', -14, 14); dot(ctx, P, Pp, COL.c4, 6); txt(ctx, 'P', P(...Pp)[0] - 12, P(...Pp)[1] - 12, { color: COL.c4, font: 'italic 15px Georgia, serif' });
      const aT = kx(al, rp), aN = mul(rp, -om * om), aP = add([aO, 0], add(aT, aN)), k = 0.14;
      warr(ctx, P, O, [vO, 0], 0.3, COL.c1, 'v_O');
      warr(ctx, P, Pp, [aO, 0], k, COL.c5, '', 1.8, [3, 3]); warr(ctx, P, add(Pp, mul([aO, 0], k)), aT, k, COL.c3, '', 1.8, [3, 3]);
      warr(ctx, P, add(Pp, mul(add([aO, 0], aT), k)), aN, k, COL.c4, '', 1.8, [3, 3]);
      warr(ctx, P, Pp, aP, k, COL.c2, 'a_P', 3.4);
      if (t === 0) txt(ctx, 'the instant in the problem: θ = 90°, P at the top', w / 2, 14, { font: '12px system-ui', color: HOT });
      statsEvery(st, 'e-roll-stats', () => [['t', fmt(t, 3) + ' s'], ['v_O', fmt(vO, 3) + ' ft/s'], ['ω', fmt(om, 3) + ' rad/s' + sgnTxt(om)], ['α', fmt(al, 3) + ' rad/s²' + sgnTxt(al)],
        ['a_P', f2(aP) + ' ft/s²', true], ['|a_P|', fmt(len(aP), 4) + ' ft/s²', true]], 0.1);
    }
  });
})();

// Example 2.A.7: sliding link
makeLadder('e-ladder', {
  ic: false, th0: 70, th1: 18, slow: 0.05, speed: 1, mark: 36.87,
  controls: [{ key: 'vB', label: 'speed of B, v_B', min: 0.5, max: 6, step: 0.1, value: 3, unit: 'm/s', dec: 2 }, { key: 'L', label: 'length L', min: 0.2, max: 2, step: 0.05, value: 0.5, unit: 'm', dec: 2 }],
  stats: ({ th, om, al, vA }) => [['θ', fmt(th / RAD, 4) + '°'], ['ω_AB', fmt(om, 4) + ' rad/s (CCW)', true], ['α_AB', fmt(al, 4) + ' rad/s² (CCW)', true], ['v_A', fmt(-vA[1], 4) + ' m/s (down)']]
});

// Example 2.B.1: four-bar near the position where IC_AB coincides with D
(function(){
  const O = [0, 0], L = 1, D = [L + 0.75 * L, 0];
  makeClip({
    id: 'e-ic4', speed: 0.25,
    presets: (C, st, reset) => [{ label: 'Freeze at the instant', apply: () => { st.freeze = true; st.t = 0; } }, { label: 'Play', apply: () => { st.freeze = false; } }],
    reset(st){ st.freeze = false; },
    step(st){ if (st.freeze) st.t = 0; },
    draw(st){
      const cv = $('e-ic4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const Phi = 20 * RAD, Om = 3 / Phi, phi = Phi * Math.sin(Om * st.t), wOA = Phi * Om * Math.cos(Om * st.t), aOA = -Phi * Om * Om * Math.sin(Om * st.t);
      const S = fourbar(O, D, L, L, 1.25 * L, phi, wOA, aOA, -1);
      const b = [-0.5, 2.4, -1.6, 0.75]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      if (!S){ drawMessage(cv, 'cannot assemble'); return; }
      const IC = lineX(O, S.A, D, sub(S.B, D));
      if (IC){ infLine(ctx, P, S.A, mul(S.A, 1 / L), HOT); infLine(ctx, P, S.B, mul(sub(S.B, D), 1 / 1.25), HOT); }
      bar(ctx, P, O, S.A, 10); bar(ctx, P, S.A, S.B, 10); bar(ctx, P, D, S.B, 10);
      pin(ctx, P, O, 'O', -16, -6, true); pin(ctx, P, D, 'D', 16, -6, true); pin(ctx, P, S.A, 'A', 0, -16); pin(ctx, P, S.B, 'B', -14, 10);
      const k = 0.12;
      warr(ctx, P, S.A, S.vA, k, COL.c1, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c2, 'v_B');
      if (IC) icMark(ctx, P, IC, 'IC of AB');
      statsEvery(st, 'e-ic4-stats', () => [['crank angle', fmt(phi / RAD, 3) + '°'], ['ω_OA', fmt(wOA, 3) + ' rad/s'], ['ω_AB', fmt(S.w2, 4) + ' rad/s' + sgnTxt(S.w2), true], ['ω_BD', fmt(S.w3, 4) + ' rad/s' + sgnTxt(S.w3), true], ['IC of AB', IC ? f2(IC) + ' (L = 1, D at (1.75, 0))' : '—']], 0.05);
    }
  });
})();

// Example 2.B.3: spool pulled by a cable from its hub
makeClip({
  id: 'e-spool', speed: 0.5,
  controls: [
    { key: 'vA', label: 'cable speed v_A', min: 0.1, max: 2, step: 0.05, value: 0.8, unit: 'm/s', dec: 2 },
    { key: 'r', label: 'hub radius r', min: 0.05, max: 0.85, step: 0.05, value: 0.3, unit: 'm', dec: 2 },
    { key: 'R', label: 'outer radius R', min: 0.3, max: 1.2, step: 0.05, value: 0.9, unit: 'm', dec: 2 }
  ],
  reset(st){ const V = st.V; st.ok = V.R > V.r && V.r > 0; showNotes('e-spool-notes', st.ok ? [] : [{ level: 'warn', html: 'The hub must be smaller than the spool: 0 &lt; r &lt; R.' }]); },
  step(st){ if (st.t > (st.nr ? 2.4 : 4)) st.t = 0; },
  draw(st){
    const cv = $('e-spool-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Choose 0 < r < R'); return; }
    st.nr = w < 560; const V = st.V, R = V.R, r = V.r, om = -V.vA / (R - r), vO = -om * R, b = st.nr ? [-1.5, 4.4, -0.3, 2.4] : [-1.6, 7, -0.3, 2.4]; autoH(cv, w, h, b); const { P } = view(w, h, b);
    const x = -0.4 + vO * st.t, O = [x, R], ang = om * st.t;
    const [g1x, g1y] = P(b[0], 0), [g2x] = P(b[1], 0); hatch(ctx, g1x, g1y, g2x, g1y, 1);
    const xA = Math.max((st.nr ? 2.0 : 2.6) + V.vA * st.t, x + 0.3), A = [xA, R - r];
    wheel(ctx, P, O, R, ang, { hub: r, spokes: 3 });
    const [hx, hy] = P(x, R - r), [ax, ay] = P(...A); line(ctx, hx, hy, ax, ay, COL.fg, 2.6);
    dot(ctx, P, A, COL.fg, 4); txt(ctx, 'A', ax + 4, ay - 14, { font: 'italic 15px Georgia, serif' });
    const C = [x, 0]; icMark(ctx, P, C, 'IC = C');
    const top = [x, 2 * R], k = 0.55;
    [[O, 'v_O', COL.c2], [[x, R - r], '', COL.c1], [top, 'v_top', COL.c5]].forEach(([p, lab, col]) => warr(ctx, P, p, [-om * p[1], 0], k, col, lab, lab === 'v_O' ? 3.2 : 2.2));
    warr(ctx, P, A, [V.vA, 0], k, COL.c1, 'v_A');
    const [cx, cy] = P(...C), [tx, ty] = P(...top); line(ctx, cx, cy, tx, ty, HOT, 1, [3, 3]);
    pin(ctx, P, O, 'O', -14, -12);
    statsEvery(st, 'e-spool-stats', () => [['ω = v_A / (R − r)', fmt(-om, 4) + ' rad/s (CW)', true], ['v_O = ωR', fmt(vO, 4) + ' m/s (right)', true], ['cable winding onto the spool', fmt(vO - V.vA, 4) + ' m/s']]);
  }
});

// Example 2.C.1: wheel, connecting rod and slider
(function(){
  const r = 0.5, L = 2, vB = 5, xB0 = r + Math.sqrt(L * L - r * r);
  const start = () => { let x = 0; for (let k = 1; k <= 10; k++) x = solveX(xB0 + vB * 0.005 * k, x); return x; };
  const Apos = x => { const th = -x / r; return [x + r * Math.cos(th), r + r * Math.sin(th)]; };
  function solveX(xB, x){
    for (let i = 0; i < 30; i++){
      const f = q => { const A = Apos(q); return (A[0] - xB) ** 2 + A[1] ** 2 - L * L; };
      const f0 = f(x), d = (f(x + 1e-7) - f0) / 1e-7; if (Math.abs(d) < 1e-12) break; x -= f0 / d; if (Math.abs(f0) < 1e-13) break;
    }
    return x;
  }
  makeClip({
    id: 'e-wheel', speed: 0.1,
    presets: (C, st, reset) => [{ label: 'Freeze at θ = 0', apply: () => { st.freeze = true; st.t = 0.05; } }, { label: 'Play', apply: () => { st.freeze = false; } }],
    reset(st){ st.x = start(); st.t = 0; st.freeze = false; },
    step(st){
      if (st.freeze) st.t = 0.05;
      if (st.t > 0.5){ st.t = 0; st.x = start(); }
      st.x = solveX(xB0 - vB * (st.t - 0.05), st.x);
    },
    draw(st){
      const cv = $('e-wheel-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const b = [-2.6, 2.9, -0.45, 1.25]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      const tt = st.t - 0.05, xB = xB0 - vB * tt, x = st.x, th = -x / r, O = [x, r], A = Apos(x), B = [xB, 0];
      // rates by finite differences of the exact constraint solution (independent check of the vector method)
      const h1 = 1e-4, xp = solveX(xB - vB * h1, x), xm = solveX(xB + vB * h1, x), vx = (xp - xm) / (2 * h1), ax = (xp - 2 * x + xm) / (h1 * h1);
      const om = -vx / r, al = -ax / r;
      const [g1x, g1y] = P(-2.6, 0), [g2x] = P(2.9, 0); hatch(ctx, g1x, g1y, g2x, g1y, 1);
      wheel(ctx, P, O, r, th, { spokes: 2 });
      bar(ctx, P, A, B, 8);
      const [bx, by] = P(...B), sc = P(1, 0)[0] - P(0, 0)[0]; block(ctx, bx, by - 0.12 * sc, 0.35 * sc, 0.24 * sc, 0, '');
      pin(ctx, P, A, 'A', -2, -16); pin(ctx, P, B, 'B', 14, -18); pin(ctx, P, O, 'O', -12, 12);
      warr(ctx, P, B, [-vB, 0], 0.12, COL.c2, 'v_B'); warr(ctx, P, O, [-om * r, 0], 0.12, COL.c1, 'v_O');
      if (Math.abs(tt) < 0.004) txt(ctx, 'the instant: θ = 0 (A level with O)', w / 2, 14, { font: '12px system-ui', color: HOT });
      statsEvery(st, 'e-wheel-stats', () => [['θ', fmt((((th / RAD) % 360) + 540) % 360 - 180, 3) + '°'], ['ω_wheel', fmt(om, 4) + ' rad/s' + sgnTxt(om), true], ['α_wheel', fmt(al, 4) + ' rad/s²' + sgnTxt(al), true]], 0.02);
    }
  });
})();

// Example 2.C.2: four-bar O-A-B-D passing through the position with OA and BD vertical
(function(){
  const L = 1, O = [0, 0], D = [2 * L, 0], wOA = 0.5;
  makeClip({
    id: 'e-4bar', speed: 1,
    presets: (C, st, reset) => [{ label: 'Freeze at the instant (OA vertical)', apply: () => { st.freeze = true; } }, { label: 'Play', apply: () => { st.freeze = false; } }],
    reset(st){ st.freeze = false; },
    step(st){ if (st.freeze) st.t = (Math.PI / 2 - 0.2) / wOA; },
    draw(st){
      const cv = $('e-4bar-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const phi = 0.2 + wOA * st.t, S = fourbar(O, D, L, Math.sqrt(5) * L, 2 * L, phi, wOA, 0, 1);
      const b = [-1.4, 3.6, -0.6, 2.9]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      if (!S){ drawMessage(cv, 'cannot assemble'); return; }
      const IC = lineX(O, S.A, D, sub(S.B, D));
      if (IC && len(IC) < 12){ infLine(ctx, P, O, mul(S.A, 1 / L), HOT); infLine(ctx, P, D, mul(sub(S.B, D), 1 / (2 * L)), HOT); }
      bar(ctx, P, O, S.A, 10); bar(ctx, P, S.A, S.B, 10); bar(ctx, P, D, S.B, 10);
      pin(ctx, P, O, 'O', -16, -4, true); pin(ctx, P, D, 'D', 16, -4, true); pin(ctx, P, S.A, 'A', -14, -10); pin(ctx, P, S.B, 'B', 14, -10);
      const k = 1.6;
      warr(ctx, P, S.A, S.vA, k, COL.c1, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c2, 'v_B');
      if (IC && len(IC) < 12) icMark(ctx, P, IC, 'IC of AB'); else txt(ctx, 'v_A ∥ v_B: the IC of AB is at infinity, so ω_AB = 0', w / 2, 14, { font: '12px system-ui', color: HOT });
      // plot of angular velocities over one revolution
      const pts2 = [], pts3 = [];
      for (let i = 0; i <= 180; i++){ const f = 2 * Math.PI * i / 180, s = fourbar(O, D, L, Math.sqrt(5) * L, 2 * L, f, wOA, 0, 1); if (s){ pts2.push([f / RAD, s.w2]); pts3.push([f / RAD, s.w3]); } }
      const fd = (((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / RAD;
      plot($('e-4bar-plot'), { xmin: 0, xmax: 360, xstep: 90, ymin: -0.6, ymax: 0.6, xlabel: 'angle of OA (deg)', ylabel: 'angular velocity (rad/s)', series: [{ pts: pts2, color: COL.c3, width: 2.2 }, { pts: pts3, color: COL.c2, width: 2.2 }],
        vlines: [{ x: 90, color: HOT, label: 'the instant' }], points: [{ x: fd, y: S.w2, color: COL.c3 }, { x: fd, y: S.w3, color: COL.c2 }] });
      statsEvery(st, 'e-4bar-stats', () => [['angle of OA', fmt(fd, 3) + '°'], ['ω_AB', fmt(S.w2, 4) + ' rad/s', true], ['ω_BD', fmt(S.w3, 4) + ' rad/s', true], ['α_AB', fmt(S.a2, 4) + ' rad/s²'], ['α_BD', fmt(S.a3, 4) + ' rad/s²']], 0.1);
    }
  });
})();
