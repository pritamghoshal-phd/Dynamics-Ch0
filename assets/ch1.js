/* =========================================================
   Chapter 1 animations: particle kinematics
   ========================================================= */
const RAD = Math.PI / 180, TAU = 2 * Math.PI;
const z0 = x => Math.abs(x) < 1e-9 ? 0 : x;
const f2 = (v, d = 3) => `(${fmt(z0(v[0]), d)}, ${fmt(z0(v[1]), d)})`;
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-12 ? 0 : x, d)).join(', ')})`;
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const nrm = a => Math.hypot(...a);
const ijs = (v, d = 3) => `${fmt(v[0], d)} î ${v[1] < 0 ? '−' : '+'} ${fmt(Math.abs(v[1]), d)} ĵ`;

// world → canvas with equal scales, y up. bb = [xmin, xmax, ymin, ymax]
function view(w, h, bb, pad = 18){
  const s = Math.min((w - 2 * pad) / (bb[1] - bb[0]), (h - 2 * pad) / (bb[3] - bb[2]));
  const cx = w / 2 - s * (bb[0] + bb[1]) / 2, cy = h / 2 + s * (bb[2] + bb[3]) / 2;
  return { P: (x, y) => [cx + s * x, cy - s * y], s };
}
function gridLines(ctx, P, bb, step){
  ctx.save(); ctx.lineWidth = 1;
  for (let x = Math.ceil(bb[0] / step) * step; x <= bb[1]; x += step){ ctx.strokeStyle = Math.abs(x) < 1e-9 ? COL.axis : COL.grid; const [a, b] = P(x, bb[2]), [c, d] = P(x, bb[3]); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  for (let y = Math.ceil(bb[2] / step) * step; y <= bb[3]; y += step){ ctx.strokeStyle = Math.abs(y) < 1e-9 ? COL.axis : COL.grid; const [a, b] = P(bb[0], y), [c, d] = P(bb[1], y); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  ctx.restore();
}
// arrow from world point p along world vector v·k, clamped to maxPx pixels
function warrow(ctx, P, s, p, v, k, col, label, maxPx = 140, wd = 3, dash){
  let L = nrm(v) * k * s; if (!(L > 3)) return;
  const f = L > maxPx ? maxPx / L : 1;
  const [x1, y1] = P(p[0], p[1]), x2 = x1 + v[0] * k * s * f, y2 = y1 - v[1] * k * s * f;
  ctx.save(); if (dash) ctx.setLineDash(dash); arrow(ctx, x1, y1, x2, y2, col, wd); ctx.restore();
  if (label){ const ux = (x2 - x1), uy = (y2 - y1), l = Math.hypot(ux, uy) || 1;
    txt(ctx, label, x2 + ux / l * 14, y2 + uy / l * 12, { color: col, font: 'italic 15px Georgia, serif' }); }
}
function dot(ctx, x, y, r = 6, col = COL.c1){ ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.card; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
function trail(ctx, P, pts, col = COL.c1, wd = 1.5, dash){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = 0.55; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
}
// 3D projection: az = camera azimuth, el = elevation
function proj3(cx, cy, s, az, el = 24 * RAD){
  return p => { const u = p[0] * Math.cos(az) - p[1] * Math.sin(az), wv = p[0] * Math.sin(az) + p[1] * Math.cos(az);
    return [cx + s * u, cy - s * (p[2] * Math.cos(el) + wv * Math.sin(el))]; };
}
function axes3(ctx, Pj, L, labels = ['x', 'y', 'z']){
  [[0, [L, 0, 0]], [1, [0, L, 0]], [2, [0, 0, L]]].forEach(([i, e]) => {
    const [x1, y1] = Pj([0, 0, 0]), [x2, y2] = Pj(e);
    line(ctx, x1, y1, x2, y2, COL.axis, 1.2, [4, 3]);
    txt(ctx, labels[i], x2 + (x2 - x1) * 0.07, y2 + (y2 - y1) * 0.07, { font: 'italic 13px Georgia, serif', color: COL.muted });
  });
}
function arrow3(ctx, Pj, p, v, k, col, label, maxLen, wd = 3){
  let L = nrm(v) * k; const f = maxLen && L > maxLen ? maxLen / L : 1;
  const q = [p[0] + v[0] * k * f, p[1] + v[1] * k * f, p[2] + v[2] * k * f];
  const [x1, y1] = Pj(p), [x2, y2] = Pj(q);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label) txt(ctx, label, x2 + 10, y2 - 8, { color: col, font: 'italic 15px Georgia, serif', align: 'left' });
}
function path3(ctx, Pj, pts, col, wd = 1.5, alpha = 0.6, dash){
  if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.globalAlpha = alpha; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => { const q = Pj(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
}
function chips(items, st, reset, key){ return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } })); }
function markChips(id, st, key, items){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', !!items[i] && items[i][1] === st[key]));
}
function caption(ctx, s, x, y, col = COL.muted, align = 'left'){ txt(ctx, s, x, y, { font: '12px system-ui, sans-serif', color: col, align }); }
function legend(ctx, items, x, y){ items.forEach(([col, s], i) => { line(ctx, x, y + i * 18, x + 18, y + i * 18, col, 3); caption(ctx, s, x + 24, y + i * 18); }); }

/* =========================================================
   A. PLANAR KINEMATICS: CARTESIAN, PATH, POLAR
   ========================================================= */
// --- Cartesian: components add independently
(function(){
  const MOT = [['Figure eight', 'eight'], ['Ellipse', 'ell'], ['Projectile', 'proj']];
  const M = {
    eight: { T: 2 * Math.PI / 0.8, f: t => { const w = 0.8; return [3 * Math.sin(w * t), 1.6 * Math.sin(2 * w * t), 3 * w * Math.cos(w * t), 3.2 * w * Math.cos(2 * w * t), -3 * w * w * Math.sin(w * t), -6.4 * w * w * Math.sin(2 * w * t)]; }, bb: [-4.2, 4.2, -2.6, 2.6] },
    ell:   { T: 2 * Math.PI / 0.9, f: t => { const w = 0.9; return [3 * Math.cos(w * t), 1.8 * Math.sin(w * t), -3 * w * Math.sin(w * t), 1.8 * w * Math.cos(w * t), -3 * w * w * Math.cos(w * t), -1.8 * w * w * Math.sin(w * t)]; }, bb: [-4.2, 4.2, -2.6, 2.6] },
    proj:  { T: 2.45, f: t => { const g = 2.2, vx = 2.6, vy = 2.7; return [-3.2 + vx * t, -1.6 + vy * t - g * t * t / 2, vx, vy - g * t, 0, -g]; }, bb: [-4.2, 4.2, -2.6, 2.6] }
  };
  makeClip({
    id: 'c-cart', speed: 0.5,
    presets: (C, st, reset) => chips(MOT, st, reset, 'mot'),
    setup(st){ st.mot = 'eight'; },
    reset(st){ markChips('c-cart', st, 'mot', MOT); st.tr = []; },
    step(st){ if (st.t > M[st.mot].T){ st.t = 0; st.tr = []; } },
    draw(st){
      const m = M[st.mot], [x, y, vx, vy, ax, ay] = m.f(st.t);
      const cv = $('c-cart-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const { P, s } = view(w, h, m.bb); gridLines(ctx, P, [-30, 30, -12, 12], 1);
      st.tr.push([x, y]); trail(ctx, P, st.tr);
      const [px, py] = P(x, y), [ox, oy] = P(0, 0);
      line(ctx, ox, oy, px, py, COL.c1, 1.5, [5, 4]);
      const kv = 0.5, ka = 0.28;
      warrow(ctx, P, s, [x, y], [vx, 0], kv, COL.c2, 'ẋ', 200, 2, [4, 3]); warrow(ctx, P, s, [x, y], [0, vy], kv, COL.c2, 'ẏ', 200, 2, [4, 3]);
      warrow(ctx, P, s, [x, y], [ax, 0], ka, HEAT, 'ẍ', 200, 2, [4, 3]); warrow(ctx, P, s, [x, y], [0, ay], ka, HEAT, 'ÿ', 200, 2, [4, 3]);
      warrow(ctx, P, s, [x, y], [vx, vy], kv, COL.c2, 'v', 200, 3.2); warrow(ctx, P, s, [x, y], [ax, ay], ka, HEAT, 'a', 200, 3.2);
      dot(ctx, px, py, 7);
      legend(ctx, [[COL.c2, 'velocity v and its components'], [HEAT, 'acceleration a and its components']], 12, 16);
      statsEvery(st, 'c-cart-stats', () => [['r', `${fmt(x)} î + ${fmt(y)} ĵ`], ['v = ẋ î + ẏ ĵ', `(${fmt(vx)}, ${fmt(vy)})`, true], ['a = ẍ î + ÿ ĵ', `(${fmt(ax)}, ${fmt(ay)})`, true], ['speed |v|', fmt(Math.hypot(vx, vy))]]);
    }
  });
})();

// --- Path (normal–tangential) description: a car on a winding road
(function(){
  const PRO = [['Constant speed', 'const'], ['Speeding up', 'up'], ['Braking', 'brake']];
  const A = 1.3, K = 0.9, X0 = -6.2, X1 = 6.2;
  const yf = x => A * Math.sin(K * x), y1 = x => A * K * Math.cos(K * x), y2 = x => -A * K * K * Math.sin(K * x);
  // arclength table
  const N = 2000, xs = [], ss = [0];
  for (let i = 0; i <= N; i++) xs.push(X0 + (X1 - X0) * i / N);
  for (let i = 1; i <= N; i++){ const xm = (xs[i] + xs[i - 1]) / 2; ss.push(ss[i - 1] + Math.hypot(1, y1(xm)) * (xs[i] - xs[i - 1])); }
  const xOf = s => { if (s <= 0) return X0; if (s >= ss[N]) return X1; let lo = 0, hi = N; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (ss[m] < s) lo = m; else hi = m; } return xs[lo] + (s - ss[lo]) / (ss[hi] - ss[lo]) * (xs[hi] - xs[lo]); };
  const prof = { const: t => [2, 0], up: t => [0.6 + 0.55 * t, 0.55], brake: t => (3.6 - 0.45 * t > 0.25 ? [3.6 - 0.45 * t, -0.45] : [0.25, 0]) };
  makeClip({
    id: 'c-path', speed: 0.5,
    presets: (C, st, reset) => chips(PRO, st, reset, 'p'),
    setup(st){ st.p = 'const'; },
    reset(st){ markChips('c-path', st, 'p', PRO); st.s = 0; st.lastT = 0; },
    step(st){
      const dt = st.t - st.lastT; st.lastT = st.t;
      const [v] = prof[st.p](st.t); st.s += v * dt;
      if (st.s >= ss[N] - 0.05){ st.t = 0; st.lastT = 0; st.s = 0; }
    },
    draw(st){
      const cv = $('c-path-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const { P, s } = view(w, h, [-6.4, 6.4, -2.4, 2.9]);
      // road
      const road = []; for (let i = 0; i <= 300; i++){ const x = X0 + (X1 - X0) * i / 300; road.push([x, yf(x)]); }
      ctx.save(); ctx.strokeStyle = COL.grid; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); road.forEach((p, i) => { const q = P(...p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
      trail(ctx, P, road, COL.axis, 1.5, [6, 6]);
      const x = xOf(st.s), y = yf(x), d1 = y1(x), d2 = y2(x), L = Math.hypot(1, d1);
      const et = [1 / L, d1 / L], kap = Math.abs(d2) / L ** 3, rho = 1 / Math.max(kap, 1e-9);
      const en = d2 >= 0 ? [-d1 / L, 1 / L] : [d1 / L, -1 / L];
      const [v, vdot] = prof[st.p](st.t), an = v * v * kap, a = [vdot * et[0] + an * en[0], vdot * et[1] + an * en[1]];
      // osculating circle
      if (rho < 8){ const c = [x + rho * en[0], y + rho * en[1]], [cx, cy] = P(...c);
        ctx.save(); ctx.strokeStyle = COL.c4; ctx.globalAlpha = 0.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(cx, cy, rho * s, 0, TAU); ctx.stroke(); ctx.restore();
        line(ctx, ...P(x, y), cx, cy, COL.c4, 1, [2, 3]); dot(ctx, cx, cy, 3, COL.c4); txt(ctx, 'ρ', (P(x, y)[0] + cx) / 2 + 10, (P(x, y)[1] + cy) / 2, { color: COL.c4 }); }
      warrow(ctx, P, s, [x, y], et, 0.9, COL.c4, 'ê_t', 200, 2);
      warrow(ctx, P, s, [x, y], en, 0.9, COL.c4, 'ê_n', 200, 2);
      warrow(ctx, P, s, [x, y], [vdot * et[0], vdot * et[1]], 0.6, HEAT, '', 200, 2, [4, 3]);
      warrow(ctx, P, s, [x, y], [an * en[0], an * en[1]], 0.6, HEAT, '', 200, 2, [4, 3]);
      warrow(ctx, P, s, [x, y], [v * et[0], v * et[1]], 0.6, COL.c2, 'v', 200, 3.2);
      warrow(ctx, P, s, [x, y], a, 0.6, HEAT, 'a', 200, 3.2);
      const [px, py] = P(x, y); ctx.save(); ctx.translate(px, py); ctx.rotate(-Math.atan2(et[1], et[0]));
      ctx.fillStyle = COL.c1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-14, -7, 28, 14, 4); else ctx.rect(-14, -7, 28, 14); ctx.fill(); ctx.restore();
      legend(ctx, [[COL.c2, 'velocity: always along ê_t'], [HEAT, 'acceleration and its v̇, v²/ρ parts'], [COL.c4, 'path unit vectors, curvature circle']], 12, 16);
      statsEvery(st, 'c-path-stats', () => [['speed v', fmt(v)], ['a_t = v̇', fmt(vdot), true], ['ρ', rho > 1e3 ? '∞ (straight)' : fmt(rho)], ['a_n = v²/ρ', fmt(an), true], ['|a|', fmt(Math.hypot(vdot, an))]]);
    }
  });
})();

// --- Polar: bead sliding along a rotating rod
makeClip({
  id: 'c-polar', speed: 0.5,
  controls: [
    { key: 'w', label: 'Rod turn rate dθ/dt', min: -2, max: 2, step: 0.05, value: 0.8, unit: 'rad/s', dec: 2 },
    { key: 'rd', label: 'Sliding rate dr/dt', min: -1, max: 1, step: 0.05, value: 0.35, unit: 'm/s', dec: 2 },
    { key: 'r0', label: 'Start radius r₀', min: 0.2, max: 3, step: 0.1, value: 0.6, unit: 'm', dec: 2 }
  ],
  presets: C => [{ label: 'Spin only', apply: () => C.set({ rd: 0 }) }, { label: 'Slide only', apply: () => C.set({ w: 0 }) }, { label: 'Both', apply: () => C.set({ w: 0.8, rd: 0.35 }) }],
  reset(st){ st.tr = []; },
  step(st){ const r = st.V.r0 + st.V.rd * st.t; if (r > 2.45 || r < 0.05 || st.t > 14){ st.t = 0; st.tr = []; } },
  draw(st){
    const V = st.V, th = V.w * st.t, r = V.r0 + V.rd * st.t;
    const er = [Math.cos(th), Math.sin(th)], eth = [-Math.sin(th), Math.cos(th)];
    const vr = V.rd, vt = r * V.w, ar = -r * V.w * V.w, at = 2 * V.rd * V.w;
    const cv = $('c-polar-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const B = Math.min(2.6, Math.max(1.3, 1.25 * r + 0.5));  // zoom with the bead so the arrows and labels near it have room
    const { P, s } = view(w, h, [-B, B, -B, B]); gridLines(ctx, P, [-30, 30, -12, 12], 1);
    const [ox, oy] = P(0, 0), [ex, ey] = P(2.55 * er[0], 2.55 * er[1]), [bx, by] = P(-0.4 * er[0], -0.4 * er[1]);
    line(ctx, bx, by, ex, ey, COL.spring, 6);
    const p = [r * er[0], r * er[1]]; st.tr.push(p); trail(ctx, P, st.tr);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, oy, 26, 0, -((th % TAU) + TAU) % TAU, true); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', ox + 34, oy - 12, { color: COL.muted });
    warrow(ctx, P, s, p, er, 0.6, COL.c4, 'ê_r', 200, 2); warrow(ctx, P, s, p, eth, 0.6, COL.c4, 'ê_θ', 200, 2);
    const kv = 1.2, ka = 1.1;
    warrow(ctx, P, s, p, [vr * er[0] + vt * eth[0], vr * er[1] + vt * eth[1]], kv, COL.c2, 'v', 180, 3.2);
    warrow(ctx, P, s, p, [ar * er[0], ar * er[1]], ka, HEAT, '−rθ̇²', 160, 2, [4, 3]);
    warrow(ctx, P, s, p, [at * eth[0], at * eth[1]], ka, HEAT, '2ṙθ̇', 160, 2, [4, 3]);
    warrow(ctx, P, s, p, [ar * er[0] + at * eth[0], ar * er[1] + at * eth[1]], ka, HEAT, 'a', 160, 3.2);
    dot(ctx, ...P(...p), 8, COL.c1); dot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 12, oy + 14);
    statsEvery(st, 'c-polar-stats', () => [['r', fmt(r) + ' m'], ['v_r = ṙ', fmt(vr) + ' m/s'], ['v_θ = rθ̇', fmt(vt) + ' m/s', true], ['a_r = r̈ − rθ̇²', fmt(ar) + ' m/s²', true], ['a_θ = rθ̈ + 2ṙθ̇', fmt(at) + ' m/s²', true]]);
  }
});

/* =========================================================
   B. 3D KINEMATICS
   ========================================================= */
// --- 3D Cartesian: the components box
makeClip({
  id: 'c-3d', speed: 0.5,
  controls: [{ key: 'w', label: 'Rate ω', min: 0.2, max: 2, step: 0.05, value: 0.7, unit: 'rad/s', dec: 2 },
             { key: 'H', label: 'Height swing H', min: 0, max: 3, step: 0.1, value: 1.5, unit: 'm', dec: 2 }],
  reset(st){ st.tr = []; },
  step(st){ if (st.V.w * st.t > TAU){ st.t -= TAU / st.V.w; st.tr = []; } },
  draw(st){
    const { w: om, H } = st.V, t = st.t, R = 3;
    const p = [R * Math.cos(om * t), R * Math.sin(om * t), 1.5 + H * Math.sin(2 * om * t)];
    const v = [-R * om * Math.sin(om * t), R * om * Math.cos(om * t), 2 * H * om * Math.cos(2 * om * t)];
    const a = [-R * om * om * Math.cos(om * t), -R * om * om * Math.sin(om * t), -4 * H * om * om * Math.sin(2 * om * t)];
    const cv = $('c-3d-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const Pj = proj3(w / 2, h * 0.68, Math.min(w, h * 1.4) / 11, 0.5 + 0.12 * Math.sin(0.2 * st.t));
    axes3(ctx, Pj, 4.2);
    const full = []; for (let i = 0; i <= 160; i++){ const u = TAU * i / 160; full.push([R * Math.cos(u), R * Math.sin(u), 1.5 + H * Math.sin(2 * u)]); }
    path3(ctx, Pj, full, COL.c1, 1.2, 0.35);
    // component box
    const q = (x, y, z) => Pj([x, y, z]);
    [[[p[0], 0, 0], [p[0], p[1], 0]], [[0, p[1], 0], [p[0], p[1], 0]], [[p[0], p[1], 0], p]].forEach(([u, v2]) => line(ctx, ...q(...u), ...q(...v2), COL.c3, 1.4, [4, 3]));
    txt(ctx, 'x', ...q(p[0] / 2, -0.35, 0), { color: COL.c3 }); txt(ctx, 'y', ...q(p[0] + 0.3, p[1] / 2, 0), { color: COL.c3 }); txt(ctx, 'z', ...q(p[0], p[1], p[2] / 2).map((c, i) => c + (i ? 0 : 12)), { color: COL.c3 });
    line(ctx, ...q(0, 0, 0), ...q(...p), COL.c1, 1.4, [6, 4]);
    arrow3(ctx, Pj, p, v, 0.8, COL.c2, 'v', 5); arrow3(ctx, Pj, p, a, 0.5, HEAT, 'a', 5);
    const [px, py] = Pj(p); dot(ctx, px, py, 7);
    statsEvery(st, 'c-3d-stats', () => [['r = (x, y, z)', f3(p, 2)], ['v = (ẋ, ẏ, ż)', f3(v, 2), true], ['a = (ẍ, ÿ, z̈)', f3(a, 2), true], ['|v|', fmt(nrm(v))]]);
  }
});

// --- Cylindrical coordinates: helix and conical spiral
makeClip({
  id: 'c-cyl', speed: 0.5,
  controls: [
    { key: 'R0', label: 'Start radius R₀', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'm', dec: 2 },
    { key: 'rd', label: 'Radial rate dr/dt', min: -0.3, max: 0.3, step: 0.01, value: 0, unit: 'm/s', dec: 2 },
    { key: 'w', label: 'Turn rate dθ/dt', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'rad/s', dec: 2 },
    { key: 'zd', label: 'Climb rate dz/dt', min: -0.5, max: 0.8, step: 0.05, value: 0.35, unit: 'm/s', dec: 2 }
  ],
  presets: C => [{ label: 'Helix', apply: () => C.set({ R0: 2, rd: 0, w: 1, zd: 0.35 }) }, { label: 'Flat circle', apply: () => C.set({ rd: 0, zd: 0 }) }, { label: 'Widening spiral', apply: () => C.set({ R0: 0.8, rd: 0.2, zd: 0.3 }) }],
  reset(st){ st.tr = []; },
  step(st){ const V = st.V, z = V.zd * st.t, r = V.R0 + V.rd * st.t; if (st.t > 12 || Math.abs(z) > 4.2 || r < 0.1){ st.t = 0; st.tr = []; } },
  draw(st){
    const V = st.V, t = st.t, r = V.R0 + V.rd * t, th = V.w * t, z = V.zd * t + (V.zd < 0 ? 4 : 0);
    const er = [Math.cos(th), Math.sin(th), 0], et = [-Math.sin(th), Math.cos(th), 0], k = [0, 0, 1];
    const comb = (a, b, c) => [0, 1, 2].map(i => a * er[i] + b * et[i] + c * k[i]);
    const vr = V.rd, vt = r * V.w, vz = V.zd, ar = -r * V.w * V.w, at = 2 * V.rd * V.w;
    const p = [r * er[0], r * er[1], z];
    const cv = $('c-cyl-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const Pj = proj3(w / 2, h * 0.84, Math.min(w / 9, h / 6.4), 0.6);
    axes3(ctx, Pj, 4.5);
    st.tr.push(p); path3(ctx, Pj, st.tr, COL.c1, 2, 0.6);
    path3(ctx, Pj, st.tr.map(q => [q[0], q[1], 0]), COL.axis, 1, 0.6, [3, 3]);
    line(ctx, ...Pj([0, 0, 0]), ...Pj([p[0], p[1], 0]), COL.c3, 1.4, [4, 3]); line(ctx, ...Pj([p[0], p[1], 0]), ...Pj(p), COL.c3, 1.4, [4, 3]);
    txt(ctx, 'r', ...Pj([p[0] / 2, p[1] / 2, 0]).map((c, i) => c + (i ? 12 : 0)), { color: COL.c3 });
    arrow3(ctx, Pj, p, er, 0.9, COL.c4, 'ê_r'); arrow3(ctx, Pj, p, et, 0.9, COL.c4, 'ê_θ'); arrow3(ctx, Pj, p, k, 0.9, COL.c4, 'k̂');
    arrow3(ctx, Pj, p, comb(vr, vt, vz), 0.8, COL.c2, 'v', 4); arrow3(ctx, Pj, p, comb(ar, at, 0), 0.8, HEAT, 'a', 4);
    const [px, py] = Pj(p); dot(ctx, px, py, 7);
    if (w < 560){ caption(ctx, 'dashed grey: the shadow on the xy-plane', 10, h - 28); caption(ctx, 'moves exactly as in polar coordinates', 10, h - 12); }
    else caption(ctx, 'dashed grey: the shadow on the xy-plane moves exactly as in polar coordinates', 10, h - 12);
    statsEvery(st, 'c-cyl-stats', () => [['v = (ṙ, rθ̇, ż)', f3([vr, vt, vz], 2), true], ['a = (r̈ − rθ̇², rθ̈ + 2ṙθ̇, z̈)', f3([ar, at, 0], 2), true], ['|v|', fmt(Math.hypot(vr, vt, vz))], ['|a|', fmt(Math.hypot(ar, at))]]);
  }
});

/* =========================================================
   C. JOINT DESCRIPTION
   ========================================================= */
(function(){
  const DES = [['Cartesian', 'cart'], ['Path (t, n)', 'path'], ['Polar (r, θ)', 'pol']];
  // ellipse with non-uniform speed
  const mot = t => { const ph = t + 0.35 * Math.sin(t), pd = 1 + 0.35 * Math.cos(t), pdd = -0.35 * Math.sin(t);
    const x = 3 * Math.cos(ph), y = 1.8 * Math.sin(ph);
    const vx = -3 * Math.sin(ph) * pd, vy = 1.8 * Math.cos(ph) * pd;
    const ax = -3 * Math.cos(ph) * pd * pd - 3 * Math.sin(ph) * pdd, ay = -1.8 * Math.sin(ph) * pd * pd + 1.8 * Math.cos(ph) * pdd;
    return { p: [x + 1, y + 0.6], v: [vx, vy], a: [ax, ay] }; };
  makeClip({
    id: 'c-joint', speed: 0.5,
    presets: (C, st, reset) => chips(DES, st, reset, 'd'),
    setup(st){ st.d = 'cart'; },
    reset(st){ markChips('c-joint', st, 'd', DES); },
    step(st){ if (st.t > TAU) st.t -= TAU; },
    draw(st){
      const { p, v, a } = mot(st.t);
      const cv = $('c-joint-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const { P, s } = view(w, h, [-3, 5, -1.9, 3.9]); gridLines(ctx, P, [-30, 30, -12, 12], 1);
      const ell = []; for (let i = 0; i <= 200; i++){ const u = TAU * i / 200; ell.push([3 * Math.cos(u) + 1, 1.8 * Math.sin(u) + 0.6]); } trail(ctx, P, ell, COL.axis, 1.2);
      let e1, e2, n1, n2;
      if (st.d === 'cart'){ e1 = [1, 0]; e2 = [0, 1]; n1 = ['î', 'ĵ']; }
      else if (st.d === 'path'){ const sp = nrm(v); e1 = [v[0] / sp, v[1] / sp]; const cr = v[0] * a[1] - v[1] * a[0]; e2 = cr >= 0 ? [-e1[1], e1[0]] : [e1[1], -e1[0]]; n1 = ['ê_t', 'ê_n']; }
      else { const r = nrm(p); e1 = [p[0] / r, p[1] / r]; e2 = [-e1[1], e1[0]]; n1 = ['ê_r', 'ê_θ']; const [ox, oy] = P(0, 0), [qx, qy] = P(...p); line(ctx, ox, oy, qx, qy, COL.c1, 1.4, [5, 4]); dot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 12, oy + 14); }
      const kv = 0.6, ka = 0.45;
      const comp = (vec, e) => dot2(vec, e);
      warrow(ctx, P, s, p, e1, 0.9, COL.c4, n1[0], 200, 2); warrow(ctx, P, s, p, e2, 0.9, COL.c4, n1[1], 200, 2);
      [[v, kv, COL.c2], [a, ka, HEAT]].forEach(([vec, kk, col]) => { const c1 = comp(vec, e1), c2 = comp(vec, e2);
        warrow(ctx, P, s, p, [c1 * e1[0], c1 * e1[1]], kk, col, '', 300, 1.8, [4, 3]); warrow(ctx, P, s, p, [c2 * e2[0], c2 * e2[1]], kk, col, '', 300, 1.8, [4, 3]); });
      warrow(ctx, P, s, p, v, kv, COL.c2, 'v', 300, 3.2); warrow(ctx, P, s, p, a, ka, HEAT, 'a', 300, 3.2);
      dot(ctx, ...P(...p), 7);
      if (w < 560){ caption(ctx, 'The solid arrows v and a never change.', 10, h - 28); caption(ctx, 'Only the dashed components do.', 10, h - 12); }
      else caption(ctx, 'The solid arrows v and a never change when you switch descriptions; only the dashed components do.', 10, h - 12);
      statsEvery(st, 'c-joint-stats', () => { const L = { cart: ['x', 'y'], path: ['t', 'n'], pol: ['r', 'θ'] }[st.d];
        return [[`v_${L[0]}`, fmt(comp(v, e1)), true], [`v_${L[1]}`, fmt(comp(v, e2)), true], [`a_${L[0]}`, fmt(comp(a, e1)), true], [`a_${L[1]}`, fmt(comp(a, e2)), true], ['|v| (same in all)', fmt(nrm(v))], ['|a| (same in all)', fmt(nrm(a))]]; });
    }
  });
})();

// --- Radius of curvature of a projectile path
makeClip({
  id: 'c-curv', speed: 0.5,
  controls: [{ key: 'v0', label: 'Launch speed v₀', min: 5, max: 25, step: 0.5, value: 15, unit: 'm/s', dec: 2 },
             { key: 'al', label: 'Launch angle', min: 10, max: 85, step: 1, value: 55, unit: '°', dec: 1 }],
  reset(st){ const V = st.V, g = 9.81; st.T = 2 * V.v0 * Math.sin(V.al * RAD) / g; st.R = V.v0 * V.v0 * Math.sin(2 * V.al * RAD) / g; st.H = (V.v0 * Math.sin(V.al * RAD)) ** 2 / (2 * g); },
  step(st){ if (st.t > st.T + 0.6) st.t = 0; },
  draw(st){
    const V = st.V, g = 9.81, t = Math.min(st.t, st.T), c = Math.cos(V.al * RAD), sn = Math.sin(V.al * RAD);
    const p = [V.v0 * c * t, V.v0 * sn * t - g * t * t / 2], v = [V.v0 * c, V.v0 * sn - g * t], a = [0, -g];
    const sp = nrm(v), et = [v[0] / sp, v[1] / sp], en = [et[1], -et[0]];            // path bends downward (clockwise)
    const at = dot2(a, et), an = dot2(a, en), rho = sp * sp / an;
    const cv = $('c-curv-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const span = Math.max(st.R, 8), bb = [-0.08 * span, span * 1.08, -0.1 * span, Math.max(st.H * 1.25, 0.35 * span)];
    const { P, s } = view(w, h, bb); hatch(ctx, ...P(bb[0], 0), ...P(bb[1], 0), 1);
    const full = []; for (let i = 0; i <= 120; i++){ const u = st.T * i / 120; full.push([V.v0 * c * u, V.v0 * sn * u - g * u * u / 2]); } trail(ctx, P, full, COL.axis, 1.4, [6, 5]);
    const cc = [p[0] + rho * en[0], p[1] + rho * en[1]], [ccx, ccy] = P(...cc);
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.globalAlpha = 0.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(ccx, ccy, rho * s, 0, TAU); ctx.stroke(); ctx.restore();
    line(ctx, ...P(...p), ccx, ccy, COL.c4, 1, [2, 3]);
    const ka = 0.17 * span / 9.81, kv = 0.16 * span / 15;
    warrow(ctx, P, s, p, v, kv, COL.c2, 'v', 160, 3);
    warrow(ctx, P, s, p, [at * et[0], at * et[1]], ka, HEAT, 'a_t', 160, 2, [4, 3]);
    warrow(ctx, P, s, p, [an * en[0], an * en[1]], ka, HEAT, 'a_n', 160, 2, [4, 3]);
    warrow(ctx, P, s, p, a, ka, HEAT, 'g', 160, 3);
    dot(ctx, ...P(...p), 7);
    statsEvery(st, 'c-curv-stats', () => [['speed v', fmt(sp) + ' m/s'], ['a_t = v̇ = −g sin(slope)', fmt(at) + ' m/s²', true], ['a_n', fmt(an) + ' m/s²'], ['ρ = v² / a_n', fmt(rho) + ' m', true], ['at the top: v² / g', fmt((V.v0 * c) ** 2 / g) + ' m']]);
  }
});

/* =========================================================
   D. RELATIVE AND CONSTRAINED MOTION
   ========================================================= */
function planeGlyph(ctx, x, y, heading, col, label, sc = 1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(-heading); ctx.scale(sc, sc); ctx.fillStyle = col; ctx.strokeStyle = COL.card; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(4, -3); ctx.lineTo(-2, -15); ctx.lineTo(-7, -15); ctx.lineTo(-4, -3); ctx.lineTo(-13, -3); ctx.lineTo(-17, -8); ctx.lineTo(-19, -8); ctx.lineTo(-17, 0);
  ctx.lineTo(-19, 8); ctx.lineTo(-17, 8); ctx.lineTo(-13, 3); ctx.lineTo(-4, 3); ctx.lineTo(-7, 15); ctx.lineTo(-2, 15); ctx.lineTo(4, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  if (label) txt(ctx, label, x - 22, y - 18, { color: col, font: 'italic bold 15px Georgia, serif' });
}
(function(){
  const FR = [['Seen from the ground', 'g'], ['Seen from B', 'b']];
  makeClip({
    id: 'c-rel', speed: 0.5,
    controls: [
      { key: 'vA', label: 'Speed of A', min: 0, max: 3, step: 0.1, value: 2, unit: 'm/s', dec: 2 },
      { key: 'thA', label: 'Heading of A', min: -180, max: 180, step: 1, value: 20, unit: '°', dec: 1 },
      { key: 'vB', label: 'Speed of B', min: 0, max: 3, step: 0.1, value: 1.5, unit: 'm/s', dec: 2 },
      { key: 'thB', label: 'Heading of B', min: -180, max: 180, step: 1, value: 90, unit: '°', dec: 1 }
    ],
    presets: (C, st, reset) => chips(FR, st, reset, 'f'),
    setup(st){ st.f = 'g'; },
    reset(st){ markChips('c-rel', st, 'f', FR); st.trA = []; st.trB = []; },
    step(st){ if (st.t > 6){ st.t = 0; st.trA = []; st.trB = []; } },
    draw(st){
      const V = st.V, t = st.t;
      const vA = [V.vA * Math.cos(V.thA * RAD), V.vA * Math.sin(V.thA * RAD)], vB = [V.vB * Math.cos(V.thB * RAD), V.vB * Math.sin(V.thB * RAD)];
      const vAB = [vA[0] - vB[0], vA[1] - vB[1]];
      const A0 = [-2.5, -1.5], B0 = [1.5, -3];
      let pA = [A0[0] + vA[0] * t, A0[1] + vA[1] * t], pB = [B0[0] + vB[0] * t, B0[1] + vB[1] * t];
      const cv = $('c-rel-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      let off = [0, 0]; if (st.f === 'b') off = [pB[0] - B0[0], pB[1] - B0[1]];
      const { P, s } = view(w, h, [-6, 6, -4.6, 4.6]);
      // ground grid moves when viewed from B
      gridLines(ctx, (x, y) => P(x - (off[0] % 1), y - (off[1] % 1)), [-30, 30, -12, 12], 1);
      const Q = q => [q[0] - off[0], q[1] - off[1]];
      st.trA.push(pA); st.trB.push(pB);
      trail(ctx, P, st.trA.map(Q), COL.c1, 2, [5, 4]); trail(ctx, P, st.trB.map(Q), COL.c3, 2, [5, 4]);
      const [ax, ay] = P(...Q(pA)), [bx, by] = P(...Q(pB));
      line(ctx, bx, by, ax, ay, COL.c4, 1.5, [3, 3]); txt(ctx, 'r_A/B', (ax + bx) / 2 + 14, (ay + by) / 2, { color: COL.c4, font: 'italic 13px Georgia, serif' });
      planeGlyph(ctx, ax, ay, V.thA * RAD, COL.c1, 'A'); planeGlyph(ctx, bx, by, V.thB * RAD, COL.c3, 'B');
      if (st.f === 'g'){ warrow(ctx, P, s, Q(pA), vA, 0.9, COL.c2, 'v_A', 200, 3); warrow(ctx, P, s, Q(pB), vB, 0.9, COL.c2, 'v_B', 200, 3); }
      else warrow(ctx, P, s, Q(pA), vAB, 0.9, COL.c2, 'v_A/B', 200, 3);
      // velocity triangle inset
      const nr = w < 560, bw = nr ? 128 : 205, bh = nr ? 104 : 150, k = nr ? 13 : 22, ox = w - bw / 2 - 6, oy = h - bh / 2 - 2;
      ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.grid; ctx.globalAlpha = 0.92; ctx.fillRect(ox - bw / 2, oy - bh / 2 - 8, bw, bh); ctx.strokeRect(ox - bw / 2, oy - bh / 2 - 8, bw, bh); ctx.restore();
      caption(ctx, 'v_A = v_B + v_A/B', ox - bw / 2 + 6, oy - bh / 2 + 4, COL.fg);
      const tB = [ox + vB[0] * k, oy - vB[1] * k], tA = [ox + vA[0] * k, oy - vA[1] * k];
      if (V.vB > 0.05) arrow(ctx, ox, oy, ...tB, COL.c3, 2.4); if (nrm(vAB) > 0.05) arrow(ctx, ...tB, ...tA, COL.c4, 2.4); if (V.vA > 0.05) arrow(ctx, ox, oy, ...tA, COL.c1, 2.4);
      statsEvery(st, 'c-rel-stats', () => [['v_A', f2(vA, 2)], ['v_B', f2(vB, 2)], ['v_A/B = v_A − v_B', f2(vAB, 2), true], ['|v_A/B|', fmt(nrm(vAB)) + ' m/s', true]]);
    }
  });
})();

// --- Constrained motion: n supporting strands
(function(){
  const NS = [['1 strand', 1], ['2 strands', 2], ['3 strands', 3], ['4 strands', 4]];
  makeClip({
    id: 'c-strands', speed: 0.5,
    controls: [{ key: 'u', label: 'Pull speed of the free end', min: 0.1, max: 1, step: 0.05, value: 0.5, unit: 'm/s', dec: 2 }],
    presets: (C, st, reset) => chips(NS, st, reset, 'n'),
    setup(st){ st.n = 2; },
    reset(st){ markChips('c-strands', st, 'n', NS); },
    step(st){ if (st.V.u * st.t > 1.6) st.t = 0; },
    draw(st){
      const n = st.n, u = st.V.u, d = u * st.t;
      const cv = $('c-strands-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [20, 20, 440, 330]);
      const sc = 100;  // px per metre
      hatch(ctx, 60, 30, 420, 30, -1);
      const yB = 250 - d / n * sc, xs = [], gap = 26, x0 = 200 - (n - 1) * gap / 2;
      for (let i = 0; i < n; i++) xs.push(x0 + i * gap);
      // fixed upper block (bolted to the ceiling) and the moving lower block on B, each with real sheaves of radius rs
      const rs = gap / 2, yT = 48 + rs, yL = yB - 20, Bw = Math.max(70, (n - 1) * gap + 40);
      const xF = Math.max(xs[n - 1] + gap, 200 + Bw / 2 + 22), Rf = (xF - xs[n - 1]) / 2;   // free end clears block B
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.2; ctx.fillRect(x0 - 16, 30, xF - x0 + 32, 12); ctx.strokeRect(x0 - 16, 30, xF - x0 + 32, 12); ctx.restore();
      const sheave = (cx, cy, r) => { ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, TAU); ctx.fill(); ctx.restore(); };
      // strands run between the top sheaves (y = yT) and the bottom sheaves (y = yL); neighbouring strands share a sheave
      ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2.4; ctx.beginPath();
      xs.forEach(x => { ctx.moveTo(x, yT); ctx.lineTo(x, yL); });
      for (let k = 0; k < n - 1; k++){ const xr = xs[n - 1 - k], xl = xs[n - 2 - k], cx = (xr + xl) / 2;
        if (k % 2 === 0){ ctx.moveTo(xr, yL); ctx.arc(cx, yL, rs, 0, Math.PI, false); } else { ctx.moveTo(xr, yT); ctx.arc(cx, yT, rs, 0, Math.PI, true); } }
      ctx.moveTo(xs[n - 1], yT); ctx.arc(xs[n - 1] + Rf, 48 + Rf, Rf, Math.PI, 0, false); ctx.lineTo(xF, 120 + d * sc); ctx.stroke(); ctx.restore();
      for (let k = 0; k < n - 1; k++){ const cx = (xs[n - 1 - k] + xs[n - 2 - k]) / 2; sheave(cx, k % 2 === 0 ? yL : yT, rs - 2); }
      sheave(xs[n - 1] + Rf, 48 + Rf, Rf - 2);
      // the dead end of the first strand is fixed to whichever block has no sheave there
      const deadTop = n > 1 && (n - 2) % 2 === 0; ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2.4; ctx.beginPath();
      if (deadTop){ ctx.moveTo(xs[0], yT); ctx.lineTo(xs[0], 42); } else { ctx.moveTo(xs[0], yL); ctx.lineTo(xs[0], yB - 7); } ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(xF, 120 + d * sc, 7, 0, TAU); ctx.fill(); ctx.restore();
      arrow(ctx, xF + 22, 120 + d * sc - 20, xF + 22, 120 + d * sc + 25, COL.c2, 2.4); txt(ctx, 'u', xF + 34, 120 + d * sc, { color: COL.c2 });
      block(ctx, 200, yB + 18, Math.max(70, (n - 1) * gap + 40), 50, 0, 'B');
      arrow(ctx, 120, yB + 40, 120, yB, COL.c3, 2.6); txt(ctx, `u/${n}`, 104, yB + 18, { color: COL.c3, align: 'right' });
      caption(ctx, `cable length = ${n} × (strand length) + (free end)  =  constant`, 30, 318, COL.fg);
      statsEvery(st, 'c-strands-stats', () => [['free end moves down', fmt(d) + ' m'], ['B rises', fmt(d / n) + ' m'], ['v_B = u / n', fmt(u / n) + ' m/s', true]]);
    }
  });
})();

/* =========================================================
   WORKED EXAMPLES
   ========================================================= */
// shared "hold at the problem's instant" chips
function holdChips(st, label, setFn){ return [{ label, apply: () => { setFn(); st.hold = true; } }, { label: '▶ Keep moving', apply: () => { st.hold = false; } }]; }

// Example 1.A.1: pin in an elliptical ring and a moving slot
makeClip({
  id: 'e-a1', speed: 0.5,
  controls: [
    { key: 'a', label: 'Semi-axis a', min: 2, max: 8, step: 0.1, value: 5, unit: 'mm', dec: 2 },
    { key: 'b', label: 'Semi-axis b', min: 4, max: 14, step: 0.1, value: 10, unit: 'mm', dec: 2 },
    { key: 'v', label: 'Slot speed v', min: 5, max: 60, step: 1, value: 30, unit: 'mm/s', dec: 1 }
  ],
  presets: (C, st) => holdChips(st, '⏸ Stop at y = 6 mm', () => { st.y = Math.min(6, 0.97 * st.V.b); }),
  reset(st){ st.ok = st.V.a > 0 && st.V.b > 0; st.y = -0.92 * st.V.b; st.lastT = 0; st.hold = false; },
  step(st){
    const dt = (st.t - st.lastT) * 0.35; st.lastT = st.t;
    if (st.hold || !st.ok) return;
    st.y += st.V.v * dt; if (st.y > 0.92 * st.V.b) st.y = -0.92 * st.V.b;
  },
  draw(st){
    const cv = $('e-a1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'a and b must be positive'); return; }
    const { a, b, v } = st.V, y = st.y, x = -a * Math.sqrt(Math.max(0, 1 - y * y / b / b));
    const xd = -(a * a / b / b) * y * v / x, xdd = -((a * a / b / b) * v * v + xd * xd) / x;
    const { P, s } = view(w, h, [-a - 9, a + 9, -b - 2, b + 2]);
    // ground and ring
    hatch(ctx, ...P(-a - 8, -b), ...P(a + 8, -b), 1);
    const [cx, cy] = P(0, 0); ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, a * s, b * s, 0, 0, TAU); ctx.stroke(); ctx.restore();
    line(ctx, ...P(-a - 6, 0), ...P(a + 6, 0), COL.axis, 1, [4, 3]); line(ctx, ...P(0, -b - 1), ...P(0, b + 1.5), COL.axis, 1, [4, 3]);
    txt(ctx, 'x', ...P(a + 6.6, 0), { color: COL.muted }); txt(ctx, 'y', ...P(0.6, b + 1.6), { color: COL.muted, align: 'left' });
    // guide rod and slider
    const gx = -a - 5; line(ctx, ...P(gx, -b), ...P(gx, b + 1.5), COL.spring, 3);
    const [sx, sy] = P(gx, y); block(ctx, sx, sy, 22, 26, 0, '');
    const [tx] = P(a + 1, y); ctx.save(); ctx.strokeStyle = COL.massEdge; ctx.fillStyle = COL.mass; ctx.lineWidth = 2; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx + 11, sy - 7, tx - sx - 11, 14, 7); else ctx.rect(sx + 11, sy - 7, tx - sx - 11, 14); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, sx + 22, sy, tx - 8, sy, COL.massEdge, 1.2);
    arrow(ctx, sx - 22, sy + 16, sx - 22, sy - 16, COL.c3, 2.4); txt(ctx, 'v', sx - 32, sy, { color: COL.c3 });
    // pin, v and a
    const kv = 0.09, ka = 0.035;
    warrow(ctx, P, s, [x, y], [xd, v], kv, COL.c2, 'v_P', 130, 3.2); warrow(ctx, P, s, [x, y], [xdd, 0], ka, HEAT, 'a_P', 130, 3.2);
    dot(ctx, ...P(x, y), 6, COL.fg); txt(ctx, 'P', P(x, y)[0] - 14, P(x, y)[1] - 14);
    if (st.hold) caption(ctx, 'held at the instant in the problem', 10, 14, COL.c2);
    statsEvery(st, 'e-a1-stats', () => [['y', fmt(y) + ' mm'], ['x (left side)', fmt(x) + ' mm'], ['ẋ', fmt(xd, 4) + ' mm/s', true], ['v_P', `${fmt(xd, 4)} î + ${fmt(v)} ĵ mm/s`], ['ẍ', fmt(xdd, 4) + ' mm/s²', true], ['a_P', `${fmt(xdd, 4)} î mm/s²`]], 0.1);
  }
});

// Example 1.A.4: Archimedean spiral r = kθ, θ̇ constant
makeClip({
  id: 'e-a4', speed: 0.5,
  controls: [{ key: 'k', label: 'Spiral constant k (r = kθ)', min: 1, max: 8, step: 0.5, value: 5, unit: 'm/rad', dec: 2 },
             { key: 'w', label: 'dθ/dt (constant)', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'rad/s', dec: 2 }],
  presets: (C, st) => holdChips(st, '⏸ Stop at θ = π', () => { st.th = Math.PI; }),
  reset(st){ st.th = 0.05; st.lastT = 0; st.hold = false; },
  step(st){ const dt = (st.t - st.lastT) * 0.6; st.lastT = st.t; if (st.hold) return; st.th += st.V.w * dt; if (st.th > 1.6 * Math.PI) st.th = 0.05; },
  draw(st){
    const { k, w: om } = st.V, th = st.th, r = k * th, rd = k * om;
    const er = [Math.cos(th), Math.sin(th)], et = [-Math.sin(th), Math.cos(th)];
    const vp = [rd, r * om], ap = [-r * om * om, 2 * rd * om];
    const v = [vp[0] * er[0] + vp[1] * et[0], vp[0] * er[1] + vp[1] * et[1]], a = [ap[0] * er[0] + ap[1] * et[0], ap[0] * er[1] + ap[1] * et[1]];
    const cv = $('e-a4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const R = k * 1.6 * Math.PI, { P, s } = view(w, h, [-R * 1.1, R * 0.75, -R * 0.85, R * 0.75]);
    gridLines(ctx, P, [-R * 6, R * 6, -R * 2, R * 2], k * 2);
    const sp = []; for (let i = 0; i <= 300; i++){ const u = 1.6 * Math.PI * i / 300; sp.push([k * u * Math.cos(u), k * u * Math.sin(u)]); } trail(ctx, P, sp, COL.axis, 1.4, [6, 4]);
    const p = [r * er[0], r * er[1]], [ox, oy] = P(0, 0), [px, py] = P(...p);
    line(ctx, ox, oy, px, py, COL.c1, 1.4, [5, 4]); txt(ctx, 'r', (ox + px) / 2 + 8, (oy + py) / 2 - 8, { color: COL.c1 });
    const ue = 0.14 * R;
    warrow(ctx, P, s, p, er, ue, COL.c4, 'ê_r', 200, 2); warrow(ctx, P, s, p, et, ue, COL.c4, 'ê_θ', 200, 2);
    warrow(ctx, P, s, p, v, 0.3 * R / (k * om * Math.PI), COL.c2, 'v', 220, 3.2); warrow(ctx, P, s, p, a, 0.3 * R / (k * om * om * Math.PI), HEAT, 'a', 220, 3.2);
    dot(ctx, px, py, 7); dot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 12, oy + 14);
    if (st.hold) caption(ctx, 'held at θ = π', 10, 14, COL.c2);
    statsEvery(st, 'e-a4-stats', () => [['θ', fmt(th, 3) + ' rad'], ['v (polar)', `${fmt(vp[0])} ê_r + ${fmt(vp[1])} ê_θ`, true], ['a (polar)', `${fmt(ap[0])} ê_r + ${fmt(ap[1])} ê_θ`, true], ['v (Cartesian)', ijs(v)], ['a (Cartesian)', ijs(a)], ['|v|, |a|', `${fmt(nrm(v))} m/s, ${fmt(nrm(a))} m/s²`]], 0.1);
  }
});

// Example 1.B.1: mixing device (rotating + oscillating disk)
makeClip({
  id: 'e-b1', speed: 0.5,
  controls: [
    { key: 'r', label: 'Radius of A, r', min: 0.02, max: 0.2, step: 0.005, value: 0.1, unit: 'm', dec: 3 },
    { key: 'w', label: 'Spin rate ω', min: 1, max: 20, step: 0.5, value: 10, unit: 'rad/s', dec: 2 },
    { key: 'z0', label: 'Stroke amplitude z₀', min: 0, max: 0.1, step: 0.005, value: 0.05, unit: 'm', dec: 3 },
    { key: 'n', label: 'Stroke frequency n', min: 0.1, max: 4, step: 0.1, value: 2, unit: 'Hz', dec: 2 }
  ],
  reset(st){ st.tr = []; st.hist = []; st.lastT = 0; st.tau = 0; },
  step(st){ const dt = (st.t - st.lastT) * 0.12; st.lastT = st.t; st.tau += dt; if (st.tau > 3){ st.tau = 0; st.tr = []; st.hist = []; } },
  draw(st){
    const { r, w: om, z0, n } = st.V, t = st.tau, th = om * t, z = z0 * Math.sin(TAU * n * t);
    const zdd = -z0 * (TAU * n) ** 2 * Math.sin(TAU * n * t), ah = r * om * om, amag = Math.hypot(ah, zdd), amax = Math.hypot(ah, z0 * (TAU * n) ** 2);
    const cv = $('e-b1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const R = Math.max(0.14, r + 0.03), Zt = Math.max(0.12, z0 + 0.05), az = 0.35;
    const S = Math.min(w * 0.42 / R, h * 0.8 / (2 * Zt + 0.12 + R * 0.8)), Pj = proj3(w * 0.36, h * 0.5 + S * 0.03, S, az, 22 * RAD);
    // cylinder outline (bowl) and its two silhouette lines
    const ring = zz => { const pts = []; for (let i = 0; i <= 80; i++){ const u = TAU * i / 80; pts.push([R * Math.cos(u), R * Math.sin(u), zz]); } return pts; };
    path3(ctx, Pj, ring(-Zt), COL.spring, 2, 0.6); path3(ctx, Pj, ring(Zt), COL.spring, 1.2, 0.4);
    [1, -1].forEach(sg => { const e = [sg * R * Math.cos(az), -sg * R * Math.sin(az)]; line(ctx, ...Pj([e[0], e[1], -Zt]), ...Pj([e[0], e[1], Zt]), COL.spring, 1.4); });
    // shaft and disk
    line(ctx, ...Pj([0, 0, z]), ...Pj([0, 0, Zt + 0.1]), COL.spring, 6);
    const disk = []; for (let i = 0; i <= 80; i++){ const u = TAU * i / 80; disk.push([r * Math.cos(u), r * Math.sin(u), z]); }
    ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); disk.forEach((p, i) => { const q = Pj(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    const pA = [r * Math.cos(th), r * Math.sin(th), z]; st.tr.push(pA); if (st.tr.length > 260) st.tr.shift();
    path3(ctx, Pj, st.tr, COL.c1, 1.6, 0.7);
    const aV = [-ah * Math.cos(th), -ah * Math.sin(th), zdd];
    arrow3(ctx, Pj, pA, aV, 0.6 * R / Math.max(amax, 1e-9), HEAT, 'a_A');
    const [ax, ay] = Pj(pA); dot(ctx, ax, ay, 6, COL.c2); txt(ctx, 'A', ax + 10, ay + 12, { color: COL.c2 });
    caption(ctx, 'slow motion', 10, 14);
    st.hist.push([t, amag]);
    plot($('e-b1-plot'), { xmin: 0, xmax: 3, ymin: 0, ymax: amax * 1.2 + 1e-6, xlabel: 'time (s)', ylabel: '|a_A| (m/s²)', hlines: [{ y: amax, color: COL.c2 }], series: [{ pts: st.hist, color: HEAT, width: 2.2 }], points: [{ x: t, y: amag, color: HEAT, r: 5 }] });
    statsEvery(st, 'e-b1-stats', () => [['horizontal part rω²', fmt(ah) + ' m/s²'], ['vertical part z̈', fmt(zdd) + ' m/s²'], ['|a_A| now', fmt(amag) + ' m/s²'], ['max |a_A| = √(r²ω⁴ + z₀²(2πn)⁴)', fmt(amax) + ' m/s²', true]], 0.1);
  }
});

// Example 1.B.2: particle on the saddle z = xy/2
makeClip({
  id: 'e-b2', speed: 0.5,
  presets: (C, st) => holdChips(st, '⏸ Stop at t = 1 s', () => { st.tau = 1; }),
  reset(st){ st.tau = 0.6; st.lastT = 0; st.hold = false; },
  step(st){ const dt = (st.t - st.lastT) * 0.12; st.lastT = st.t; if (!st.hold) st.tau += dt; if (st.tau > 1.6) st.tau = 0.6; },
  draw(st){
    const t = st.tau, W = TAU;
    const p = [6 * Math.sin(W * t), 6 * Math.cos(W * t), 9 * Math.sin(2 * W * t)];
    const v = [6 * W * Math.cos(W * t), -6 * W * Math.sin(W * t), 18 * W * Math.cos(2 * W * t)];
    const a = [-6 * W * W * Math.sin(W * t), -6 * W * W * Math.cos(W * t), -36 * W * W * Math.sin(2 * W * t)];
    const cv = $('e-b2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const Pj = proj3(w / 2, h * 0.5, Math.min(w / 20, h / 24), 0.2 + 0.15 * Math.sin(0.15 * st.t), 22 * RAD);
    // saddle mesh, polar so that it stays within the particle's region
    const sad = (rr, ph) => [rr * Math.cos(ph), rr * Math.sin(ph), rr * rr * Math.cos(ph) * Math.sin(ph) / 2];
    for (let rr = 2; rr <= 7; rr += 1.25){ const C = []; for (let j = 0; j <= 120; j++) C.push(sad(rr, TAU * j / 120)); path3(ctx, Pj, C, COL.axis, 1, 0.35); }
    for (let j = 0; j < 16; j++){ const Lr = []; for (let rr = 0; rr <= 7; rr += 0.25) Lr.push(sad(rr, TAU * j / 16)); path3(ctx, Pj, Lr, COL.axis, 1, 0.35); }
    axes3(ctx, Pj, 9);
    const curve = []; for (let i = 0; i <= 200; i++){ const u = i / 200; curve.push([6 * Math.sin(W * u), 6 * Math.cos(W * u), 9 * Math.sin(2 * W * u)]); } path3(ctx, Pj, curve, COL.c1, 2, 0.75);
    arrow3(ctx, Pj, p, v, 0.04, COL.c2, 'v', 6); arrow3(ctx, Pj, p, a, 0.016, HEAT, 'a', 6);
    const [px, py] = Pj(p); dot(ctx, px, py, 7);
    if (st.hold) caption(ctx, 'held at t = 1 s', 10, 14, COL.c2);
    statsEvery(st, 'e-b2-stats', () => [['t', fmt(t, 3) + ' s'], ['r', f3(p, 3)], ['v = (ẋ, ẏ, ż)', f3(v, 4), true], ['a = (ẍ, ÿ, z̈)', f3(a, 4), true]], 0.1);
  }
});

// Example 1.C.1: rocket — split the acceleration into path components
makeClip({
  id: 'e-c1', buttons: false,
  controls: [
    { key: 'th', label: 'Angle θ from vertical', min: 0, max: 90, step: 0.01, value: 36.87, unit: '°', dec: 2 },
    { key: 'aT', label: 'Thrust acceleration a_T', min: 0, max: 60, step: 0.1, value: 29.3, unit: 'ft/s²', dec: 2 },
    { key: 'g', label: 'Gravity g', min: 1, max: 40, step: 0.1, value: 26.5, unit: 'ft/s²', dec: 2 },
    { key: 'v', label: 'Speed v', min: 100, max: 5000, step: 10, value: 2800, unit: 'ft/s', dec: 1 }
  ],
  reset(st){},
  draw(st){
    const { th, aT, g, v } = st.V, t = th * RAD;
    const et = [Math.sin(t), Math.cos(t)], en = [Math.cos(t), -Math.sin(t)];    // n toward the side gravity pulls
    const a = [aT * et[0], aT * et[1] - g], at = dot2(a, et), an = dot2(a, en), rho = v * v / Math.abs(an);
    const cv = $('e-c1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { P, s } = view(w, h, [-40, 40, -34, 40]);
    // rocket body along e_t
    ctx.save(); const [rx, ry] = P(0, 0); ctx.translate(rx, ry); ctx.rotate(t);
    ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; const L = 16 * s, W2 = 2.6 * s;
    ctx.beginPath(); ctx.moveTo(0, -L * 0.55); ctx.lineTo(W2, -L * 0.3); ctx.lineTo(W2, L * 0.5); ctx.lineTo(-W2, L * 0.5); ctx.lineTo(-W2, -L * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.moveTo(-W2 * 0.7, L * 0.5); ctx.lineTo(0, L * 0.5 + (6 + 3 * Math.sin(performance.now() / 70)) * s * 0.4); ctx.lineTo(W2 * 0.7, L * 0.5); ctx.fill(); ctx.restore();
    line(ctx, ...P(0, 0), ...P(0, 36), COL.axis, 1, [4, 3]);
    const [ox, oy] = P(0, 0); ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, oy, 60, -Math.PI / 2, -Math.PI / 2 + t, false); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', ox + 70 * Math.sin(t / 2), oy - 70 * Math.cos(t / 2), { color: COL.muted });
    const k = 1.05;
    warrow(ctx, P, s, [0, 0], [et[0] * 30, et[1] * 30], 1, COL.c2, 'v', 400, 2);
    warrow(ctx, P, s, [0, 0], [aT * et[0], aT * et[1]], k, COL.c3, 'a_T', 400, 3);
    warrow(ctx, P, s, [0, 0], [0, -g], k, COL.c3, 'g', 400, 3);
    warrow(ctx, P, s, [0, 0], [at * et[0], at * et[1]], k, HEAT, 'a_t', 400, 2, [5, 4]);
    warrow(ctx, P, s, [0, 0], [an * en[0], an * en[1]], k, HEAT, 'a_n', 400, 2, [5, 4]);
    warrow(ctx, P, s, [0, 0], a, k, HEAT, 'a', 400, 3.4);
    legend(ctx, [[COL.c3, 'given: thrust and gravity'], [HEAT, 'total a and its path components']], 10, 16);
    setStats('e-c1-stats', [['a_t = v̇ = a_T − g cos θ', fmt(at, 4) + ' ft/s²', true], ['a_n = g sin θ', fmt(an, 4) + ' ft/s²'], ['ρ = v² / a_n', (Math.abs(an) < 1e-9 ? '∞' : Math.round(rho).toLocaleString('en-US')) + ' ft', true]]);
  }
});

// Example 1.C.4: aircraft at the bottom of a loop, tracked by radar
makeClip({
  id: 'e-c4', speed: 1,
  controls: [{ key: 'v', label: 'Aircraft speed v_P', min: 20, max: 150, step: 1, value: 75, unit: 'm/s', dec: 1 },
             { key: 'rho', label: 'Radius of curvature ρ', min: 500, max: 6000, step: 50, value: 3000, unit: 'm', dec: 0 }],
  presets: (C, st) => holdChips(st, '⏸ Stop at the instant in the problem', () => { st.tau = 0; }),
  reset(st){ st.tau = -14; st.lastT = 0; st.hold = false; st.hist = []; },
  step(st){ const dt = (st.t - st.lastT) * 2.5; st.lastT = st.t; if (!st.hold) st.tau += dt; if (st.tau > 14){ st.tau = -14; st.hist = []; } },
  draw(st){
    const { v, rho } = st.V, ph = v / rho * st.tau, C = [800, 600 + rho];
    const p = [C[0] + rho * Math.sin(ph), C[1] - rho * Math.cos(ph)], vel = [v * Math.cos(ph), v * Math.sin(ph)], acc = [-v * v / rho * Math.sin(ph), v * v / rho * Math.cos(ph)];
    const r = nrm(p), er = [p[0] / r, p[1] / r], et = [-er[1], er[0]], th = Math.atan2(p[1], p[0]);
    const rd = dot2(vel, er), thd = dot2(vel, et) / r, rdd = dot2(acc, er) + r * thd * thd, thdd = (dot2(acc, et) - 2 * rd * thd) / r;
    const cv = $('e-c4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { P, s } = view(w, h, [-150, 1850, -120, 1250]);
    const arc = []; for (let i = -60; i <= 60; i++){ const u = 0.45 * i / 60; arc.push([C[0] + rho * Math.sin(u), C[1] - rho * Math.cos(u)]); } trail(ctx, P, arc, COL.axis, 1.5, [6, 5]);
    const [ox, oy] = P(0, 0), [px, py] = P(...p);
    line(ctx, ox, oy, ...P(1800, 0), COL.axis, 1); line(ctx, ox, oy, px, py, COL.c1, 1.6, [5, 4]);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, oy, 40, -th, 0); ctx.stroke(); ctx.restore(); txt(ctx, 'θ', ox + 52, oy - 14, { color: COL.muted });
    txt(ctx, 'r', (ox + px) / 2 - 8, (oy + py) / 2 - 12, { color: COL.c1 });
    // radar dish
    ctx.save(); ctx.fillStyle = COL.spring; ctx.beginPath(); ctx.arc(ox, oy, 9, 0, TAU); ctx.fill(); ctx.restore(); txt(ctx, 'O', ox - 16, oy + 14);
    const cpx = P(C[0], Math.min(C[1], 1240)); line(ctx, px, py, cpx[0], cpx[1], COL.c4, 1, [2, 4]); caption(ctx, 'to center of curvature', cpx[0] + 8, cpx[1] + 10, COL.c4);
    planeGlyph(ctx, px, py, ph, COL.c1, 'P', 1.1);
    warrow(ctx, P, s, p, vel, 2.2, COL.c2, 'v_P', 200, 3); warrow(ctx, P, s, p, acc, 60, HEAT, 'a_P', 200, 3);
    st.hist.push([st.tau, rdd]);
    plot($('e-c4-plot'), { xmin: -14, xmax: 14, ymin: Math.min(0, ...st.hist.map(q => q[1])) - 0.5, ymax: Math.max(4, ...st.hist.map(q => q[1])) + 0.5, xlabel: 'time from the bottom of the loop (s)', ylabel: 'r̈ (m/s²)', series: [{ pts: st.hist, color: COL.c1, width: 2.2 }], vlines: [{ x: 0, color: COL.axis }], points: [{ x: st.tau, y: rdd, color: COL.c2, r: 5 }] });
    if (st.hold) caption(ctx, 'held at the instant in the problem', 10, 14, COL.c2);
    statsEvery(st, 'e-c4-stats', () => [['r', fmt(r, 5) + ' m'], ['θ', fmt(th / RAD, 4) + '°'], ['ṙ', fmt(rd, 4) + ' m/s'], ['θ̇', fmt(thd, 4) + ' rad/s'], ['r̈', fmt(rdd, 4) + ' m/s²', true], ['θ̈', fmt(thdd, 4) + ' rad/s²', true]], 0.1);
  }
});

// Example 1.D.2: two jets — relative velocity
(function(){
  const FR = [['Seen from the ground', 'g'], ['Seen from jet B', 'b']];
  makeClip({
    id: 'e-d2', speed: 1,
    controls: [{ key: 'vB', label: 'Speed of B (north)', min: 100, max: 1000, step: 10, value: 600, unit: 'km/h', dec: 1 },
               { key: 'al', label: 'Angle of v_A above east', min: 5, max: 85, step: 1, value: 30, unit: '°', dec: 1 }],
    presets: (C, st, reset) => chips(FR, st, reset, 'f'),
    setup(st){ st.f = 'g'; },
    reset(st){ markChips('e-d2', st, 'f', FR); st.trA = []; st.trB = []; },
    step(st){ if (st.t > 6){ st.t = 0; st.trA = []; st.trB = []; } },
    draw(st){
      const { vB, al } = st.V, A = al * RAD, vA = vB / Math.sin(A), vAB = vA * Math.cos(A);
      const k = 1 / 1500;  // drawing units per km/h per second of animation
      const VA = [vA * Math.cos(A) * k, vA * Math.sin(A) * k], VB = [0, vB * k];
      const t = st.t, pA = [-3.5 + VA[0] * t, -2.5 + VA[1] * t], pB = [-4.5 + VB[0] * t, -3.5 + VB[1] * t];
      if (Math.abs(pA[0]) > 7 || Math.abs(pA[1]) > 6 || Math.abs(pB[1]) > 6){ st.t = 0; st.trA = []; st.trB = []; }
      const off = st.f === 'b' ? [0, VB[1] * t] : [0, 0], Q = q => [q[0] - off[0], q[1] - off[1]];
      const cv = $('e-d2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const { P, s } = view(w, h, [-6, 6, -4.4, 4.4]);
      gridLines(ctx, (x, y) => P(x - off[0] % 1, y - off[1] % 1), [-30, 30, -12, 12], 1);
      st.trA.push(pA); st.trB.push(pB); trail(ctx, P, st.trA.map(Q), COL.c1, 2, [5, 4]); trail(ctx, P, st.trB.map(Q), COL.c3, 2, [5, 4]);
      const [ax, ay] = P(...Q(pA)), [bx, by] = P(...Q(pB));
      planeGlyph(ctx, ax, ay, A, COL.c1, 'A', 1.2); planeGlyph(ctx, bx, by, Math.PI / 2, COL.c3, 'B', 1.2);
      const kv = 1.6 / 600;
      if (st.f === 'g'){ warrow(ctx, P, s, Q(pA), [vA * Math.cos(A), vA * Math.sin(A)], kv, COL.c2, 'v_A', 260, 3); warrow(ctx, P, s, Q(pB), [0, vB], kv, COL.c2, 'v_B', 260, 3); }
      else { warrow(ctx, P, s, Q(pA), [vAB, 0], kv, COL.c2, 'v_A/B', 260, 3); caption(ctx, 'From B, A slides sideways due east, even though its nose points 30° north of east.', 10, h - 12); }
      txt(ctx, 'N ↑', w - 26, 18, { font: '600 13px system-ui', color: COL.muted });
      statsEvery(st, 'e-d2-stats', () => [['v_A = v_B / sin α', fmt(vA, 5) + ' km/h', true], ['v_A/B = v_A cos α', fmt(vAB, 5) + ' km/h', true], ['check: north part of v_A', fmt(vA * Math.sin(A), 5) + ' km/h = v_B']]);
    }
  });
})();

// Example 1.D.4: block on an incline and a hanging block on a movable pulley
makeClip({
  id: 'e-d4', speed: 1,
  controls: [{ key: 'aA', label: 'Acceleration of A up the incline', min: 0.05, max: 1.5, step: 0.01, value: 0.44, unit: 'm/s²', dec: 3 }],
  reset(st){},
  step(st){ if (0.5 * st.V.aA * st.t * st.t > 1.6) st.t = 0; },
  draw(st){
    const aA = st.V.aA, t = st.t, xA = 0.5 * aA * t * t, xB = xA / 2;
    const cv = $('e-d4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { P, s } = view(w, h, [-1.6, 3.6, -3.6, 0.3]);
    hatch(ctx, ...P(-1.5, 0), ...P(1.0, 0), -1);
    const rr = 0.13, Cf = [0.3, -0.35];                              // fixed pulley
    const yB = -1.5 - xB, Cb = [Cf[0] - 2 * rr, yB];                  // movable pulley under B's strands
    const be = 40 * RAD, dir = [Math.cos(be), -Math.sin(be)];          // incline direction (down the slope)
    const tA0 = [Cf[0] + rr * Math.sin(be), Cf[1] + rr * Math.cos(be)]; // tangent point leaving the pulley
    const L0 = 2.6, sA = L0 - xA, pA = [tA0[0] + dir[0] * sA, tA0[1] + dir[1] * sA];
    // incline surface below A
    const nrmv = [-Math.sin(be), -Math.cos(be)], off = 0.17;
    const i1 = [tA0[0] + dir[0] * 0.9 + nrmv[0] * off, tA0[1] + dir[1] * 0.9 + nrmv[1] * off], i2 = [tA0[0] + dir[0] * 3.7 + nrmv[0] * off, tA0[1] + dir[1] * 3.7 + nrmv[1] * off];
    hatch(ctx, ...P(...i1), ...P(...i2), 1);
    // cable: ceiling → down to left of movable pulley, under it, up to fixed pulley, over, down the incline to A
    const anchor = [Cb[0] - rr, 0];
    cable(ctx, () => { ctx.moveTo(...P(...anchor)); ctx.lineTo(...P(Cb[0] - rr, Cb[1])); const [cx, cy] = P(...Cb); ctx.arc(cx, cy, rr * s, Math.PI, 0, true); ctx.lineTo(...P(Cf[0] - rr, Cf[1])); const [fx, fy] = P(...Cf); ctx.arc(fx, fy, rr * s, Math.PI, Math.PI + (Math.PI / 2 + be), false); ctx.lineTo(...P(...pA)); });
    line(ctx, ...P(...Cf), ...P(Cf[0], 0), COL.spring, 2);
    pulley(ctx, ...P(...Cf), rr * s); pulley(ctx, ...P(...Cb), rr * s);
    line(ctx, ...P(...Cb), ...P(Cb[0], Cb[1] - 0.3), COL.spring, 2);
    block(ctx, ...P(Cb[0], Cb[1] - 0.52), 0.42 * s, 0.4 * s, 0, 'B');
    const [ax, ay] = P(pA[0] - nrmv[0] * 0.0, pA[1]); block(ctx, ax, ay, 0.4 * s, 0.32 * s, be, 'A');
    // coordinate arrows
    warrow(ctx, P, s, [pA[0] + 0.3, pA[1] + 0.35], [-dir[0], -dir[1]], 0.5, COL.c3, 'x_A', 200, 2);
    warrow(ctx, P, s, [Cb[0] - 0.55, -0.4], [0, -1], 0.5, COL.c3, 'x_B', 200, 2);
    const vA = aA * t;
    statsEvery(st, 'e-d4-stats', () => [['A moved up the incline', fmt(xA, 3) + ' m'], ['B moved down', fmt(xB, 3) + ' m'], ['v_A', fmt(vA, 3) + ' m/s'], ['v_B = v_A / 2', fmt(vA / 2, 3) + ' m/s'], ['a_B = a_A / 2', fmt(aA / 2, 4) + ' m/s² (down)', true]], 0.1);
  }
});
