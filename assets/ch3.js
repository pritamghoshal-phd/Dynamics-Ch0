/* =========================================================
   Chapter 3 animations: moving (rotating) reference frames
   ========================================================= */
const RAD = Math.PI / 180;
const ROSE = '#a61e4d';
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => Math.hypot(...a);
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-10 ? 0 : x, d)).join(', ')})`;
const deg = r => fmt(r / RAD, 3) + '°';

function chips(items, st, reset, key){
  return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } }));
}
function markChips(id, st, key, items){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', items[i] && items[i][1] === st[key]));
}
// camera for 3D drawings, Y is up. Returns [screenX, screenY]
function cam(cx, cy, s, az, el){
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  return p => [cx + s * (p[0] * ca - p[2] * sa), cy - s * (-p[0] * sa * se + p[1] * ce - p[2] * ca * se)];
}
function ar3(ctx, Pj, a, b, col, label, wd = 3, lab = {}){
  const [x1, y1] = Pj(a), [x2, y2] = Pj(b);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label) txt(ctx, label, x2 + (lab.dx ?? 8), y2 + (lab.dy ?? -8), { color: col, font: lab.font || 'italic 14px Georgia, serif', align: lab.align || 'left' });
}
function ln3(ctx, Pj, a, b, col, wd = 2, dash){ const [x1, y1] = Pj(a), [x2, y2] = Pj(b); line(ctx, x1, y1, x2, y2, col, wd, dash); }
function poly3(ctx, Pj, pts, col, wd = 2, close = false, fill){
  ctx.save(); ctx.beginPath(); pts.forEach((p, i) => { const q = Pj(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); });
  if (close) ctx.closePath(); if (fill){ ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// arrow in screen pixels from (x,y) with vector (dx,dy) in "up is positive" convention
function parrow(ctx, x, y, dx, dy, col, label, wd = 3, lab = {}){
  if (Math.hypot(dx, dy) < 2) return [x, y];
  arrow(ctx, x, y, x + dx, y - dy, col, wd);
  if (label) txt(ctx, label, x + dx + (lab.dx ?? 6), y - dy + (lab.dy ?? -8), { color: col, font: lab.font || 'italic 13px Georgia, serif', align: lab.align || 'left' });
  return [x + dx, y - dy];
}
function dot(ctx, x, y, r, col){ ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
function trail(ctx, pts, col, wd = 2, dash){
  if (pts.length < 2) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = wd; if (dash) ctx.setLineDash(dash); ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
}
function panelLabel(ctx, s, x, y){ txt(ctx, s, x, y, { font: '600 13px system-ui', color: COL.fg }); }
function stick(ctx, x, y, sc = 1, col){ // a little observer figure standing at (x,y)
  ctx.save(); ctx.strokeStyle = col || COL.fg; ctx.lineWidth = 1.6; ctx.beginPath();
  ctx.arc(x, y - 22 * sc, 5 * sc, 0, 2 * Math.PI); ctx.moveTo(x, y - 17 * sc); ctx.lineTo(x, y - 7 * sc);
  ctx.moveTo(x - 6 * sc, y - 13 * sc); ctx.lineTo(x + 6 * sc, y - 13 * sc);
  ctx.moveTo(x, y - 7 * sc); ctx.lineTo(x - 5 * sc, y); ctx.moveTo(x, y - 7 * sc); ctx.lineTo(x + 5 * sc, y); ctx.stroke(); ctx.restore();
}
// split a canvas into two panels (side by side, or stacked on narrow screens)
function twoPanels(cv, hWide, hNarrow){
  const narrow = cv.clientWidth < 600;
  const want = (narrow ? hNarrow : hWide) + 'px';
  if (cv.style.height !== want) cv.style.height = want;
  const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
  const P = narrow ? [[0, 0, w, h / 2], [0, h / 2, w, h / 2]] : [[0, 0, w / 2, h], [w / 2, 0, w / 2, h]];
  if (narrow) line(ctx, 10, h / 2, w - 10, h / 2, COL.axis, 1); else line(ctx, w / 2, 10, w / 2, h - 10, COL.axis, 1);
  return { ctx, w, h, P, narrow };
}

/* =========================================================
   A. 2D ROTATING FRAMES
   ========================================================= */
// --- the derivative of a rotating unit vector
makeClip({
  id: 'c-unit', speed: 1,
  controls: [{ key: 'thd', label: 'Rotation rate θ̇', min: -1.2, max: 1.2, step: 0.05, value: 0.6, unit: 'rad/s', dec: 3 }],
  reset(st){ st.trail = []; },
  step(st){ if (Math.abs(st.V.thd * st.t) > 2 * Math.PI) { st.t = 0; st.trail = []; } },
  draw(st){
    const cv = $('c-unit-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const th = st.V.thd * st.t, R = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
    line(ctx, cx - R * 1.6, cy, cx + R * 1.6, cy, COL.axis, 1); line(ctx, cx, cy - R * 1.4, cx, cy + R * 1.4, COL.axis, 1);
    txt(ctx, 'X', cx + R * 1.6 + 10, cy, { color: COL.muted }); txt(ctx, 'Y', cx, cy - R * 1.4 - 10, { color: COL.muted });
    const i = [Math.cos(th), Math.sin(th)], j = [-Math.sin(th), Math.cos(th)];
    st.trail.push([cx + R * i[0], cy - R * i[1]]); if (st.trail.length > 600) st.trail.shift();
    trail(ctx, st.trail, COL.c5, 1.5, [4, 3]);
    const [ix, iy] = parrow(ctx, cx, cy, R * i[0], R * i[1], COL.c1, '', 3.5);
    const [jx, jy] = parrow(ctx, cx, cy, R * j[0], R * j[1], COL.c4, '', 3.5);
    // unit-vector names sit just beyond each tip, on the side away from the derivative arrows
    txt(ctx, 'î', ix + 16 * i[0] - 14 * j[0], iy - 16 * i[1] + 14 * j[1], { color: COL.c1, font: 'italic 15px Georgia, serif' });
    txt(ctx, 'ĵ', jx + 16 * j[0] + 14 * i[0], jy - 16 * j[1] - 14 * i[1], { color: COL.c4, font: 'italic 15px Georgia, serif' });
    const s = clamp(st.V.thd, -1.6, 1.6);
    parrow(ctx, ix, iy, R * s * j[0], R * s * j[1], COL.c2, 'dî/dt = ω × î', 2.6);
    parrow(ctx, jx, jy, -R * s * i[0], -R * s * i[1], ROSE, 'dĵ/dt = ω × ĵ', 2.6);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(cx, cy, 24, -th, 0, th < 0); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', cx + 34 * Math.cos(th / 2), cy - 34 * Math.sin(th / 2), { color: COL.muted });
    const hd = 1e-4, num = Math.hypot(Math.cos(st.V.thd * (st.t + hd)) - Math.cos(st.V.thd * (st.t - hd)), Math.sin(st.V.thd * (st.t + hd)) - Math.sin(st.V.thd * (st.t - hd))) / (2 * hd);
    statsEvery(st, 'c-unit-stats', () => [['θ', deg(((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))], ['|dî/dt| from the formula', fmt(Math.abs(st.V.thd)) + ' 1/s', true], ['|dî/dt| measured from the motion', fmt(num) + ' 1/s'], ['dî/dt · î', '0 (always perpendicular)']]);
  }
});

// --- a bead sliding along a rotating rod: velocity seen by two observers
(function(){
  const pos = (V, t) => { const r = V.u >= 0 ? 0.15 + V.u * t : 1.0 + V.u * t; const ph = V.w * t; return { r, ph, x: r * Math.cos(ph), y: r * Math.sin(ph) }; };
  makeClip({
    id: 'c-views', speed: 1,
    controls: [
      { key: 'w', label: 'Rod rate ω', min: -2, max: 2, step: 0.05, value: 0.8, unit: 'rad/s', dec: 3 },
      { key: 'u', label: 'Bead speed along rod', min: -0.5, max: 0.5, step: 0.01, value: 0.2, unit: 'm/s', dec: 3 }
    ],
    reset(st){ st.trF = []; st.trR = []; },
    step(st){ const p = pos(st.V, st.t); if (p.r > 1.0001 || p.r < 0.1499 || st.t > 9){ st.t = 0; st.trF = []; st.trR = []; } },
    draw(st){
      const cv = $('c-views-anim'); const { ctx, P } = twoPanels(cv, 360, 640), V = st.V, p = pos(V, st.t);
      const pan = (k, rotating) => {
        const [x0, y0, pw, ph] = P[k], R = Math.min(pw, ph) * 0.36, cx = x0 + pw / 2, cy = y0 + ph / 2 + 10;
        panelLabel(ctx, rotating ? 'What the observer riding on the rod sees' : 'What a fixed observer sees', cx, y0 + 16);
        const ang = rotating ? 0 : p.ph, e = [Math.cos(ang), Math.sin(ang)], n = [-e[1], e[0]];
        line(ctx, cx - R * 1.1, cy, cx + R * 1.1, cy, COL.grid, 1); line(ctx, cx, cy - R * 1.1, cx, cy + R * 1.1, COL.grid, 1);
        line(ctx, cx, cy, cx + R * 1.05 * e[0], cy - R * 1.05 * e[1], COL.spring, 6);
        dot(ctx, cx, cy, 5, COL.fg);
        if (rotating) stick(ctx, cx + R * 1.05, cy - 3, 0.8, COL.c4);
        const bx = cx + R * p.r * e[0], by = cy - R * p.r * e[1];
        const tr = rotating ? st.trR : st.trF; tr.push([bx, by]);
        trail(ctx, tr, COL.c1, 1.6, [5, 3]);
        dot(ctx, bx, by, 8, COL.c1);
        const vs = R * 0.9; // pixels per (m/s)
        const vr = [V.u * e[0] * vs, V.u * e[1] * vs];
        if (rotating){ parrow(ctx, bx, by, vr[0], vr[1], COL.c3, '(v)rel', 3); }
        else {
          const wr = [V.w * p.r * n[0] * vs, V.w * p.r * n[1] * vs];
          const t1 = parrow(ctx, bx, by, vr[0], vr[1], COL.c3, '', 3);
          parrow(ctx, t1[0], t1[1], wr[0], wr[1], COL.c2, 'ω × r', 3);
          parrow(ctx, bx, by, vr[0] + wr[0], vr[1] + wr[1], COL.c1, 'v', 3.5, { dx: -14, dy: -10, align: 'right' });
          if (Math.abs(V.u) > 0.005) txt(ctx, '(v)rel', t1[0] + 6, t1[1] + 12, { color: COL.c3, font: 'italic 13px Georgia, serif', align: 'left' });
        }
      };
      pan(0, false); pan(1, true);
      const h = 1e-4, a = pos(V, st.t + h), b = pos(V, Math.max(st.t - h, 0)), dt = st.t + h - Math.max(st.t - h, 0);
      statsEvery(st, 'c-views-stats', () => [['r', fmt(p.r, 3) + ' m'], ['(v)rel', fmt(V.u, 3) + ' m/s'], ['|ω × r| = |ω| r', fmt(Math.abs(V.w) * p.r, 3) + ' m/s'],
        ['|v| = √((v)rel² + (ωr)²)', fmt(Math.hypot(V.u, V.w * p.r), 4) + ' m/s', true], ['|v| measured from the fixed-frame path', fmt(Math.hypot(a.x - b.x, a.y - b.y) / dt, 4) + ' m/s']]);
    }
  });
})();

// --- acceleration terms for the bead on a rotating rod
(function(){
  const kin = (V, t) => {
    const r = 0.15 + V.u * t + 0.5 * V.ar * t * t, vr = V.u + V.ar * t, ph = V.w * t + 0.5 * V.al * t * t, w = V.w + V.al * t;
    return { r, vr, ph, w, x: r * Math.cos(ph), y: r * Math.sin(ph) };
  };
  makeClip({
    id: 'c-acc', speed: 1,
    controls: [
      { key: 'w', label: 'Rod rate ω (at start)', min: -2, max: 2, step: 0.05, value: 0.9, unit: 'rad/s', dec: 3 },
      { key: 'al', label: 'Rod angular accel. α', min: -0.5, max: 0.5, step: 0.01, value: 0, unit: 'rad/s²', dec: 3 },
      { key: 'u', label: 'Bead speed along rod (start)', min: 0, max: 0.5, step: 0.01, value: 0.15, unit: 'm/s', dec: 3 },
      { key: 'ar', label: 'Bead accel. along rod', min: -0.1, max: 0.2, step: 0.005, value: 0, unit: 'm/s²', dec: 3 }
    ],
    presets: C => [
      { label: 'Bead sliding out at constant speed', apply: () => C.set({ w: 0.9, al: 0, u: 0.15, ar: 0 }) },
      { label: 'Bead fixed on the rod', apply: () => C.set({ w: 0.9, al: 0, u: 0, ar: 0 }) },
      { label: 'Rod speeding up', apply: () => C.set({ w: 0.3, al: 0.3, u: 0.1, ar: 0 }) }
    ],
    reset(st){ st.tr = []; let m = 0.05;
      for (let t = 0; t < 8; t += 0.05){ const k = kin(st.V, t); if (k.r > 1.0 || k.r < 0.1) break;
        m = Math.max(m, Math.abs(st.V.ar) + Math.abs(st.V.al * k.r) + Math.abs(2 * k.w * k.vr) + k.w * k.w * k.r); }
      st.amax = m; },
    step(st){ const k = kin(st.V, st.t); if (k.r > 1.0 || k.r < 0.1 || st.t > 8){ st.t = 0; st.tr = []; } },
    draw(st){
      const cv = $('c-acc-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const V = st.V, k = kin(V, st.t), R = Math.min(w * 0.45, h * 0.46), cx = w / 2, cy = h / 2; st.k = k;
      const e = [Math.cos(k.ph), Math.sin(k.ph)], n = [-e[1], e[0]];
      line(ctx, cx - R * 1.1, cy, cx + R * 1.1, cy, COL.grid, 1); line(ctx, cx, cy - R * 1.1, cx, cy + R * 1.1, COL.grid, 1);
      line(ctx, cx, cy, cx + R * 1.05 * e[0], cy - R * 1.05 * e[1], COL.spring, 6); dot(ctx, cx, cy, 5, COL.fg);
      const bx = cx + R * k.r * e[0], by = cy - R * k.r * e[1];
      st.tr.push([bx, by]); trail(ctx, st.tr, COL.c1, 1.5, [5, 3]); dot(ctx, bx, by, 8, COL.c1);
      const terms = [
        ['(a)rel', V.ar, 0, COL.c4],
        ['α × r', 0, V.al * k.r, COL.c5],
        ['2ω × (v)rel', 0, 2 * k.w * k.vr, ROSE],
        ['ω × (ω × r)', -k.w * k.w * k.r, 0, COL.c2]
      ];
      const as = R * 0.75 / st.amax; let p = [bx, by], tot = [0, 0];
      terms.forEach(([lab, er, en, col]) => { const vx = (er * e[0] + en * n[0]) * as, vy = (er * e[1] + en * n[1]) * as; tot[0] += vx; tot[1] += vy; p = parrow(ctx, p[0], p[1], vx, vy, col, Math.hypot(vx, vy) > 14 ? lab : '', 2.6); });
      parrow(ctx, bx, by, tot[0], tot[1], COL.c3, 'a', 4, { dx: -12, align: 'right' });
      const hh = 1e-3, A = kin(V, st.t + hh), B = kin(V, st.t), Cc = kin(V, Math.max(st.t - hh, 0));
      const tN = st.t > hh ? Math.hypot(A.x - 2 * B.x + Cc.x, A.y - 2 * B.y + Cc.y) / hh / hh : NaN;
      statsEvery(st, 'c-acc-stats', () => [['(a)rel', fmt(V.ar, 3)], ['α × r', fmt(V.al * k.r, 3)], ['Coriolis 2ω(v)rel', fmt(2 * k.w * k.vr, 3), true], ['centripetal ω²r', fmt(k.w * k.w * k.r, 3)],
        ['|a| from the formula', fmt(Math.hypot(V.ar - k.w * k.w * k.r, V.al * k.r + 2 * k.w * k.vr), 4) + ' m/s²', true], ['|a| measured from the path', isFinite(tN) ? fmt(tN, 4) + ' m/s²' : '…']]);
    }
  });
})();

// --- the merry-go-round: a straight path in the fixed frame looks curved to a rider
(function(){
  makeClip({
    id: 'c-merry', speed: 1,
    controls: [
      { key: 'w', label: 'Platform rate ω', min: -1.5, max: 1.5, step: 0.05, value: 0.6, unit: 'rad/s', dec: 3 },
      { key: 'u', label: 'Puck speed (fixed frame)', min: 0.05, max: 0.6, step: 0.01, value: 0.25, unit: 'm/s', dec: 3 }
    ],
    reset(st){ st.trF = []; st.trR = []; },
    step(st){ if (st.V.u <= 0 || st.V.u * st.t > 1.0 || st.t > 20){ st.t = 0; st.trF = []; st.trR = []; } },
    draw(st){
      const cv = $('c-merry-anim'); const { ctx, P } = twoPanels(cv, 360, 640), V = st.V;
      const r = V.u * st.t, ph = V.w * st.t;
      [0, 1].forEach(k => {
        const rot = k === 1, [x0, y0, pw, ph_] = P[k], R = Math.min(pw, ph_) * 0.38, cx = x0 + pw / 2, cy = y0 + ph_ / 2 + 10;
        panelLabel(ctx, rot ? 'Seen by a rider on the platform' : 'Seen from the ground (fixed)', cx, y0 + 16);
        const spin = rot ? 0 : ph;
        ctx.save(); ctx.fillStyle = 'rgba(207,185,145,.18)'; ctx.strokeStyle = COL.spring; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
        for (let s = 0; s < 6; s++){ const a = spin + s * Math.PI / 3; line(ctx, cx, cy, cx + R * Math.cos(a), cy - R * Math.sin(a), s ? COL.grid : COL.c4, s ? 1 : 2); }
        if (rot) stick(ctx, cx + R * 0.93, cy - 3, 0.8, COL.c4);
        else stick(ctx, cx + R * 0.93 * Math.cos(spin), cy - R * 0.93 * Math.sin(spin) - 3, 0.8, COL.c4);
        // puck: straight along fixed X in the ground frame
        const pf = [r, 0], pr = [r * Math.cos(-ph), r * Math.sin(-ph)], q = rot ? pr : pf;
        const bx = cx + R * q[0], by = cy - R * q[1];
        (rot ? st.trR : st.trF).push([bx, by]); trail(ctx, rot ? st.trR : st.trF, COL.c1, 2, [5, 3]); dot(ctx, bx, by, 8, COL.c1);
        if (rot){ // apparent accelerations: (a)rel = −2ω×(v)rel − ω×(ω×r)
          const vrel = [V.u * Math.cos(-ph) + V.w * r * Math.sin(-ph), V.u * Math.sin(-ph) - V.w * r * Math.cos(-ph)];
          const cor = [2 * V.w * vrel[1], -2 * V.w * vrel[0]], cen = [V.w * V.w * pr[0], V.w * V.w * pr[1]], s = R * 0.9;
          const t1 = parrow(ctx, bx, by, cor[0] * s, cor[1] * s, ROSE, '−2ω × (v)rel', 2.6);
          parrow(ctx, t1[0], t1[1], cen[0] * s, cen[1] * s, COL.c2, '−ω × (ω × r)', 2.6, { dy: 14 });
        } else parrow(ctx, bx, by, V.u * R * 0.9, 0, COL.c3, 'v (constant)', 2.6);
      });
      statsEvery(st, 'c-merry-stats', () => [['t', fmt(st.t, 3) + ' s'], ['acceleration in the ground frame', '0 (straight line, constant speed)', true],
        ['rider sees Coriolis part', fmt(2 * Math.abs(V.w) * Math.hypot(V.u, V.w * r), 3) + ' m/s²'], ['rider sees centrifugal part', fmt(V.w * V.w * r, 3) + ' m/s²']]);
    }
  });
})();

/* =========================================================
   B. 3D ROTATING FRAMES
   ========================================================= */
// --- disk spinning on a rotating U-frame: ω changes direction, so α ≠ 0
makeClip({
  id: 'c-omega', speed: 1,
  controls: [
    { key: 'w1', label: 'Frame rate ω₁ (about fixed Y)', min: 0, max: 1.5, step: 0.05, value: 0.5, unit: 'rad/s', dec: 3 },
    { key: 'w2', label: 'Disk rate ω₂ (about moving x)', min: -3, max: 3, step: 0.05, value: 1.5, unit: 'rad/s', dec: 3 }
  ],
  reset(st){ st.tip = []; },
  draw(st){
    const cv = $('c-omega-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, ps = V.w1 * st.t, phi = V.w2 * st.t, s = Math.min(w, h) / 4.6, Pj = cam(w / 2, h * 0.56, s, 0.55, 0.32);
    const i = [Math.cos(ps), 0, -Math.sin(ps)], J = [0, 1, 0], kk = [Math.sin(ps), 0, Math.cos(ps)];
    ln3(ctx, Pj, [0, -1.9, 0], [0, 1.9, 0], COL.axis, 1, [5, 4]); txt(ctx, 'Y (fixed)', ...Pj([0, 2.05, 0]), { color: COL.muted, font: '12px system-ui' });
    // U-frame
    const a = 1.25, yb = -1.25;
    poly3(ctx, Pj, [mul3(i, a), add3(mul3(i, a), [0, yb, 0]), add3(mul3(i, -a), [0, yb, 0]), mul3(i, -a)], COL.spring, 4);
    ln3(ctx, Pj, [0, yb, 0], [0, -1.8, 0], COL.spring, 5);
    ln3(ctx, Pj, mul3(i, a), mul3(i, -a), COL.spring, 2.5);
    // disk
    const R = 0.9, rim = []; for (let q = 0; q <= 48; q++){ const g = q / 48 * 2 * Math.PI; rim.push(add3(mul3(J, R * Math.cos(g)), mul3(kk, R * Math.sin(g)))); }
    poly3(ctx, Pj, rim, COL.massEdge, 2, true, 'rgba(207,185,145,.35)');
    ln3(ctx, Pj, [0, 0, 0], add3(mul3(J, R * Math.cos(phi)), mul3(kk, R * Math.sin(phi))), COL.c4, 2.5);
    // omega
    const ws = 0.75, W = add3(mul3(J, V.w1 * ws), mul3(i, V.w2 * ws));
    ln3(ctx, Pj, [0, 0, 0], mul3(J, V.w1 * ws), COL.c1, 1.5, [4, 3]); ln3(ctx, Pj, mul3(J, V.w1 * ws), W, COL.c1, 1.5, [4, 3]);
    const tipC = []; for (let q = 0; q <= 64; q++){ const g = q / 64 * 2 * Math.PI; tipC.push([V.w2 * ws * Math.cos(g), V.w1 * ws, -V.w2 * ws * Math.sin(g)]); }
    poly3(ctx, Pj, tipC, COL.c5, 1.2);
    ar3(ctx, Pj, [0, 0, 0], W, ROSE, 'ω', 3.5);
    const alpha = mul3(cross3(J, i), V.w1 * V.w2);
    ar3(ctx, Pj, W, add3(W, mul3(alpha, ws)), COL.c3, 'α = ω₁ω₂ (Ĵ × î)', 3);
    ar3(ctx, Pj, [0, 0, 0], mul3(i, 1.6), COL.c4, 'x', 1.8);
    const hd = 1e-4, Wn = t => add3(mul3(J, V.w1), mul3([Math.cos(V.w1 * t), 0, -Math.sin(V.w1 * t)], V.w2));
    const an = norm(mul3(sub3(Wn(st.t + hd), Wn(st.t - hd)), 1 / (2 * hd)));
    statsEvery(st, 'c-omega-stats', () => [['|ω| = √(ω₁² + ω₂²)', fmt(Math.hypot(V.w1, V.w2)) + ' rad/s (constant)'], ['|α| = ω₁|ω₂|', fmt(V.w1 * Math.abs(V.w2)) + ' rad/s²', true], ['|dω/dt| measured', fmt(an) + ' rad/s²']]);
  }
});

// --- 3D rigid body: every point moves with v = ω × r
(function(){
  const box = []; [-0.7, 0.7].forEach(x => [-0.45, 0.45].forEach(y => [-0.3, 0.3].forEach(z => box.push([x, y, z]))));
  const edges = []; for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++){ const d = sub3(box[a], box[b]); if (d.filter(v => Math.abs(v) > 1e-9).length === 1) edges.push([a, b]); }
  const rot = (p, n, th) => { const c = Math.cos(th), s = Math.sin(th); return add3(add3(mul3(p, c), mul3(cross3(n, p), s)), mul3(n, dot3(n, p) * (1 - c))); };
  makeClip({
    id: 'c-rigid', speed: 1,
    controls: [
      { key: 'wm', label: 'Spin rate |ω|', min: -2, max: 2, step: 0.05, value: 0.8, unit: 'rad/s', dec: 3 },
      { key: 'tilt', label: 'Tilt of ω from vertical', min: 0, max: 90, step: 1, value: 35, unit: '°', dec: 1 }
    ],
    reset(st){ st.tr = []; },
    draw(st){
      const cv = $('c-rigid-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const V = st.V, tl = V.tilt * RAD, n = [Math.sin(tl), Math.cos(tl), 0], th = V.wm * st.t, wv = mul3(n, V.wm);
      const Pj = cam(w / 2, h / 2, Math.min(w, h) / 3.6, 0.6, 0.3);
      ln3(ctx, Pj, mul3(n, -1.5), mul3(n, 1.5), COL.axis, 1.2, [6, 4]);
      const pts = box.map(p => rot(p, n, th));
      edges.forEach(([a, b]) => ln3(ctx, Pj, pts[a], pts[b], COL.massEdge, 2));
      ar3(ctx, Pj, [0, 0, 0], mul3(wv, 0.9), ROSE, 'ω', 3.5);
      const k = 6, P = pts[k], v = cross3(wv, P);
      st.tr.push(Pj(P)); if (st.tr.length > 900) st.tr.shift(); trail(ctx, st.tr, COL.c5, 1.2, [3, 3]);
      ln3(ctx, Pj, [0, 0, 0], P, COL.c1, 1.5, [4, 3]); txt(ctx, 'r', ...Pj(mul3(P, 0.5)), { color: COL.c1 });
      const [px, py] = Pj(P); dot(ctx, px, py, 5, COL.c1); txt(ctx, 'B', px - 10, py + 12, { font: 'italic 14px Georgia, serif' });
      ar3(ctx, Pj, P, add3(P, mul3(v, 0.6)), COL.c3, 'v = ω × r', 3);
      [0, 3, 5].forEach(q => ar3(ctx, Pj, pts[q], add3(pts[q], mul3(cross3(wv, pts[q]), 0.6)), COL.c3, '', 2));
      const hd = 1e-4, num = norm(mul3(sub3(rot(box[k], n, V.wm * (st.t + hd)), rot(box[k], n, V.wm * (st.t - hd))), 1 / (2 * hd)));
      statsEvery(st, 'c-rigid-stats', () => [['v_B = ω × r', f3(v), true], ['|v_B|', fmt(norm(v), 4)], ['|v_B| measured', fmt(num, 4)], ['v · ω', fmt(Math.abs(dot3(v, wv)) < 1e-9 ? 0 : dot3(v, wv))], ['v · r', fmt(Math.abs(dot3(v, P)) < 1e-9 ? 0 : dot3(v, P))]]);
    }
  });
})();

/* =========================================================
   WORKED-EXAMPLE ANIMATIONS
   ========================================================= */
const PLAYF = [['▶ Play the motion', false], ['Freeze at the instant in the problem', true]];

// Example 3.A.3: fire truck ladder
makeClip({
  id: 'e-truck', speed: 0.5,
  controls: [
    { key: 'V', label: 'Truck speed', min: 0, max: 60, step: 1, value: 50, unit: 'ft/s', dec: 2 },
    { key: 'thd', label: 'Raising rate θ̇', min: -0.5, max: 0.5, step: 0.01, value: 0.3, unit: 'rad/s', dec: 3 },
    { key: 'bd', label: 'Extension rate ḃ', min: -4, max: 4, step: 0.1, value: 2, unit: 'ft/s', dec: 2 }
  ],
  presets: (C, st, reset) => chips(PLAYF, st, reset, 'freeze'),
  setup(st){ st.freeze = false; },
  reset(st){ markChips('e-truck', st, 'freeze', PLAYF); st.tau = st.freeze ? 0 : -1.2; st.tr = []; },
  step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > 2) { st.tau = -1.2; st.tr = []; } },
  draw(st){
    const cv = $('e-truck-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, tau = st.tau, th = 30 * RAD + V.thd * tau, b = Math.max(3, 25 + V.bd * tau), X = V.V * tau;
    const s = Math.min(w / 72, h / 44), gy = h - 18, ox = w * 0.3, toS = (x, y) => [ox + (x - X) * s, gy - y * s];
    // ground (scrolls)
    line(ctx, 0, gy, w, gy, COL.ground, 2);
    for (let q = Math.floor((X - ox / s) / 4) * 4; q < X + (w - ox) / s; q += 4){ const [x] = toS(q, 0); line(ctx, x, gy, x - 6, gy + 7, COL.ground, 1); }
    // truck body: pivot O at (X, 9)
    const body = [toS(X - 2, 3), toS(X + 22, 3), toS(X + 22, 11), toS(X + 16, 11), toS(X + 16, 8), toS(X - 2, 8)];
    ctx.save(); ctx.fillStyle = 'rgba(166,30,77,.75)'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); body.forEach((p, k) => k ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8eef5'; const wn = [toS(X + 17.5, 10.3), toS(X + 20.8, 8.6)]; ctx.fillRect(wn[0][0], wn[0][1], wn[1][0] - wn[0][0], wn[1][1] - wn[0][1]); ctx.restore();
    [X + 2.5, X + 17].forEach(cx => { const [x, y] = toS(cx, 1.8); ctx.save(); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, y, 1.8 * s, 0, 2 * Math.PI); ctx.fill(); ctx.fillStyle = COL.c5; ctx.beginPath(); ctx.arc(x, y, 0.7 * s, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); });
    const O = [X, 9], Pw = [X + b * Math.cos(th), 9 + b * Math.sin(th)];
    // ladder: two rails + rungs
    const e = [Math.cos(th), Math.sin(th)], n = [-e[1], e[0]], hw = 0.5;
    [-hw, hw].forEach(o => { const [x1, y1] = toS(O[0] + n[0] * o, O[1] + n[1] * o), [x2, y2] = toS(Pw[0] + n[0] * o, Pw[1] + n[1] * o); line(ctx, x1, y1, x2, y2, COL.fg, 2); });
    for (let q = 1; q < b; q += 1.2){ const c = [O[0] + e[0] * q, O[1] + e[1] * q]; const [x1, y1] = toS(c[0] - n[0] * hw, c[1] - n[1] * hw), [x2, y2] = toS(c[0] + n[0] * hw, c[1] + n[1] * hw); line(ctx, x1, y1, x2, y2, COL.fg, 1); }
    const [oxp, oyp] = toS(...O); dot(ctx, oxp, oyp, 4, COL.fg); txt(ctx, 'O', oxp - 12, oyp + 2);
    st.tr.push(Pw); trail(ctx, st.tr.map(p => toS(...p)), COL.c1, 1.6, [5, 3]);
    const [px, py] = toS(...Pw); dot(ctx, px, py, 6, COL.c1); txt(ctx, 'P', px + 12, py - 12);
    // acceleration terms at P
    const as = 5 * s, wv = V.thd, cen = -b * wv * wv, cor = 2 * wv * V.bd;
    const t1 = parrow(ctx, px, py, cen * e[0] * as, cen * e[1] * as, COL.c2, 'ω×(ω×r)', 2.6, { dx: -4, dy: 16, align: 'right' });
    parrow(ctx, t1[0], t1[1], cor * n[0] * as, cor * n[1] * as, ROSE, '2ω×(v)rel', 2.6, { dx: -8, dy: -20, align: 'right' });
    parrow(ctx, px, py, (cen * e[0] + cor * n[0]) * as, (cen * e[1] + cor * n[1]) * as, COL.c3, 'a_P', 3.5, { dx: -6, dy: 12, align: 'right' });
    const aX = cen * e[0] + cor * n[0], aY = cen * e[1] + cor * n[1];
    const Pf = t => { const tt = 30 * RAD + V.thd * t, bb = 25 + V.bd * t; return [V.V * t + bb * Math.cos(tt), 9 + bb * Math.sin(tt)]; };
    const hh = 1e-3, A1 = Pf(tau + hh), A0 = Pf(tau), A2 = Pf(tau - hh), num = Math.hypot(A1[0] - 2 * A0[0] + A2[0], A1[1] - 2 * A0[1] + A2[1]) / hh / hh;
    statsEvery(st, 'e-truck-stats', () => [['θ', deg(th)], ['b', fmt(b) + ' ft'], ['a_P along ladder (centripetal)', fmt(cen, 4) + ' ft/s²'], ['a_P across ladder (Coriolis)', fmt(cor, 4) + ' ft/s²'],
      ['a_P = aₓ Î + a_y Ĵ', `${fmt(aX, 4)} Î + ${fmt(aY, 4)} Ĵ ft/s²`, true], ['|a_P|', fmt(Math.hypot(aX, aY), 4) + ' ft/s²', true], ['|a_P| measured from the path', fmt(num, 4) + ' ft/s²']]);
  }
});

// Example 3.A.5: pin A in the slot of rotating link BC
(function(){
  const O = [-0.3, 0], ROA = 0.5;
  // A = L u lies on the slot line through C; |A − O| = 0.5 m gives L² − 0.6 L sinφ − 0.16 = 0
  const geo = phi => { const u = [-Math.sin(phi), Math.cos(phi)];
    const L = 0.3 * Math.sin(phi) + Math.sqrt(0.09 * Math.sin(phi) ** 2 + ROA * ROA - 0.09); return { u, L, A: [L * u[0], L * u[1]] }; };
  const solve = (phi, w) => { const { u, L, A } = geo(phi), r = [A[0] - O[0], A[1] - O[1]];
    // wOA(-r.y) - Ld u.x = -w L u.y ;  wOA(r.x) - Ld u.y = w L u.x
    const a11 = -r[1], a12 = -u[0], b1 = -w * L * u[1], a21 = r[0], a22 = -u[1], b2 = w * L * u[0], D = a11 * a22 - a12 * a21;
    return { wOA: (b1 * a22 - a12 * b2) / D, Ld: (a11 * b2 - b1 * a21) / D, u, L, A, r }; };
  makeClip({
    id: 'e-slot', speed: 0.1,
    controls: [{ key: 'w', label: 'Rate of link BC, ω', min: -10, max: 10, step: 0.1, value: 6, unit: 'rad/s', dec: 2 }],
    presets: (C, st, reset) => chips(PLAYF, st, reset, 'freeze'),
    setup(st){ st.freeze = true; },
    reset(st){ markChips('e-slot', st, 'freeze', PLAYF); st.phi = 0; },
    step(st, dt){ if (!st.freeze) st.phi += st.V.w * dt; },
    draw(st){
      const cv = $('e-slot-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [-0.98, -0.98, 0.98, 0.98]);
      ctx.save(); ctx.scale(1, -1); // y up in metres
      const k = solve(st.phi, st.V.w), u = k.u, n = [-u[1], u[0]];
      ctx.lineCap = 'round';
      // ground pins
      [[O[0], 0], [0, 0]].forEach(([x, y]) => { ctx.fillStyle = COL.c5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 0.04, y - 0.05); ctx.lineTo(x + 0.04, y - 0.05); ctx.closePath(); ctx.fill(); });
      ctx.strokeStyle = COL.axis; ctx.lineWidth = 0.004; ctx.setLineDash([0.02, 0.015]); ctx.beginPath(); ctx.moveTo(-0.9, 0); ctx.lineTo(0.9, 0); ctx.stroke(); ctx.setLineDash([]);
      // slotted link BC
      const Lb = 0.9; ctx.strokeStyle = COL.mass; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Lb * u[0], Lb * u[1]); ctx.stroke();
      ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 0.022; ctx.beginPath(); ctx.moveTo(0.06 * u[0], 0.06 * u[1]); ctx.lineTo(0.85 * u[0], 0.85 * u[1]); ctx.stroke();
      ctx.strokeStyle = COL.card; ctx.lineWidth = 0.012; ctx.beginPath(); ctx.moveTo(0.06 * u[0], 0.06 * u[1]); ctx.lineTo(0.85 * u[0], 0.85 * u[1]); ctx.stroke();
      // link OA
      ctx.strokeStyle = COL.fg; ctx.lineWidth = 0.022; ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(k.A[0], k.A[1]); ctx.stroke();
      [[O[0], 0], [0, 0], k.A].forEach(([x, y]) => { ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, y, 0.018, 0, 2 * Math.PI); ctx.fill(); });
      ctx.restore();
      const M = ctx.getTransform(), DP = window.devicePixelRatio || 1, toS = (x, y) => [(M.a * x + M.e) / DP, (-M.d * y + M.f) / DP];
      const sp = M.a / DP; // pixels per metre
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      const [Ax, Ay] = toS(k.A[0], k.A[1]);
      const [Ox, Oy] = toS(O[0], 0), [Cx, Cy] = toS(0, 0), [Bx, By] = toS(0.9 * u[0], 0.9 * u[1]);
      txt(ctx, 'O', Ox, Oy + 26); txt(ctx, 'C', Cx + 4, Cy + 26); txt(ctx, 'A', Ax - 14, Ay - 4); txt(ctx, 'B', Bx + 14 * n[0], By - 14 * n[1]);
      stick(ctx, Bx - 18 * n[0], By + 18 * n[1], 0.7, COL.c4);
      const vs = 0.1 * sp, wr = [-st.V.w * k.L * u[1], st.V.w * k.L * u[0]];
      const t1 = parrow(ctx, Ax, Ay, k.Ld * u[0] * vs, k.Ld * u[1] * vs, COL.c3, '(v)rel', 2.6, { dx: 8, dy: 4 });
      parrow(ctx, t1[0], t1[1], wr[0] * vs, wr[1] * vs, COL.c2, 'ω × r_A/C', 2.6, { dx: -4, dy: -12, align: 'right' });
      const vA = [-k.wOA * k.r[1], k.wOA * k.r[0]];
      parrow(ctx, Ax, Ay, vA[0] * vs, vA[1] * vs, COL.c1, 'v_A', 3.5, { dx: -10, dy: 10, align: 'right' });
      const hd = 1e-5, g1 = geo(st.phi + hd), g0 = geo(st.phi - hd), LdN = (g1.L - g0.L) / (2 * hd) * st.V.w;
      const angA = g => Math.atan2(g.A[1] - O[1], g.A[0] - O[0]); let dA = angA(g1) - angA(g0); dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      statsEvery(st, 'e-slot-stats', () => [['angle of BC from vertical', deg(((st.phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI)], ['L', fmt(k.L * 1000, 4) + ' mm'],
        ['ω_OA', fmt(k.wOA, 4) + ' rad/s ' + (k.wOA >= 0 ? '(CCW)' : '(CW)'), true], ['dL/dt', fmt(k.Ld, 4) + ' m/s', true], ['measured: ω_OA, dL/dt', `${fmt(dA / (2 * hd) * st.V.w, 4)}, ${fmt(LdN, 4)}`]]);
    }
  });
})();

// Example 3.B.7: crane boom
(function(){
  const L = 12;
  makeClip({
    id: 'e-crane', speed: 0.5,
    controls: [
      { key: 'w1', label: 'Cab rate ω₁', min: -1, max: 1, step: 0.01, value: 0.3, unit: 'rad/s', dec: 3 },
      { key: 'thd', label: 'Boom raising rate θ̇', min: -1, max: 1, step: 0.01, value: 0.5, unit: 'rad/s', dec: 3 }
    ],
    presets: (C, st, reset) => chips(PLAYF, st, reset, 'freeze'),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('e-crane', st, 'freeze', PLAYF); st.tau = st.freeze ? 0 : -0.5; st.tr = []; },
    step(st, dt){ if (st.freeze) return; st.tau += dt; if (st.tau > 1.6 || 30 * RAD + st.V.thd * st.tau > 80 * RAD || 30 * RAD + st.V.thd * st.tau < 5 * RAD){ st.tau = -0.5; st.tr = []; if (Math.abs(st.V.thd) > 0.5) st.tau = 0; } },
    draw(st){
      const cv = $('e-crane-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const V = st.V, tau = st.tau, th = 30 * RAD + V.thd * tau, ps = V.w1 * tau;
      const Pj = cam(w * 0.47, h * 0.72, Math.min(w / 30, h / 21), 0.5, 0.28);
      const I = [Math.cos(ps), 0, -Math.sin(ps)], K = [Math.sin(ps), 0, Math.cos(ps)], J = [0, 1, 0];
      const iB = add3(mul3(I, Math.cos(th)), mul3(J, Math.sin(th))), jB = add3(mul3(I, -Math.sin(th)), mul3(J, Math.cos(th)));
      // ground and base
      poly3(ctx, Pj, [[-9, -3, -9], [9, -3, -9], [9, -3, 9], [-9, -3, 9]], COL.grid, 1, true);
      ln3(ctx, Pj, [-9, -3, 0], [12, -3, 0], COL.axis, 1, [4, 4]); txt(ctx, 'X', ...Pj([13, -3, 0]), { color: COL.muted });
      ln3(ctx, Pj, [0, -3, 0], [0, 6, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...Pj([0, 6.8, 0]), { color: COL.muted });
      const cab = []; [-1.5, 2.5].forEach(a => [-2.8, 0.6].forEach(y => [-1.3, 1.3].forEach(c => cab.push(add3(add3(mul3(I, a), [0, y, 0]), mul3(K, c))))));
      [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => ln3(ctx, Pj, cab[a], cab[b], COL.c5, 1.6));
      // boom (truss)
      const P = mul3(iB, L), hw = 0.35;
      [-1, 1].forEach(sg => ln3(ctx, Pj, mul3(jB, sg * hw), add3(P, mul3(jB, sg * hw * 0.3)), COL.fg, 2));
      for (let q = 0; q < 12; q++){ const a = add3(mul3(iB, q), mul3(jB, (q % 2 ? 1 : -1) * hw * (1 - 0.7 * q / L))), b = add3(mul3(iB, q + 1), mul3(jB, (q % 2 ? -1 : 1) * hw * (1 - 0.7 * (q + 1) / L))); ln3(ctx, Pj, a, b, COL.fg, 1); }
      const [ox, oy] = Pj([0, 0, 0]); dot(ctx, ox, oy, 4, COL.fg); txt(ctx, 'O', ox - 12, oy + 10);
      st.tr.push(P); poly3(ctx, Pj, st.tr, COL.c1, 1.5);
      const [px, py] = Pj(P); dot(ctx, px, py, 6, COL.c1); txt(ctx, 'P', px + 10, py - 12);
      // vectors
      const wv = add3(mul3(J, V.w1), mul3(K, V.thd)), al = mul3(cross3(mul3(J, V.w1), K), V.thd);
      ar3(ctx, Pj, [0, 0, 0], mul3(wv, 8), ROSE, 'ω', 3);
      const v = cross3(wv, P), a = add3(cross3(al, P), cross3(wv, cross3(wv, P)));
      ar3(ctx, Pj, P, add3(P, mul3(v, 0.8)), COL.c3, 'v_P', 3);
      ar3(ctx, Pj, P, add3(P, mul3(a, 1.4)), COL.c2, 'a_P', 3, { dy: 14 });
      const xyz = q => [dot3(q, iB), dot3(q, jB), dot3(q, K)];
      const Pf = t => { const tt = 30 * RAD + V.thd * t, pp = V.w1 * t; return [L * Math.cos(tt) * Math.cos(pp), L * Math.sin(tt), -L * Math.cos(tt) * Math.sin(pp)]; };
      const hh = 1e-3, aN = norm(mul3(add3(sub3(Pf(tau + hh), mul3(Pf(tau), 2)), Pf(tau - hh)), 1 / hh / hh));
      statsEvery(st, 'e-crane-stats', () => [['θ', deg(th)], ['ω (xyz)', f3(xyz(wv), 4) + ' rad/s'], ['α (xyz)', f3(xyz(al), 4) + ' rad/s²'],
        ['v_P (xyz)', f3(xyz(v), 4) + ' m/s', true], ['a_P (xyz)', f3(xyz(a), 4) + ' m/s²', true], ['|a_P|', fmt(norm(a), 4) + ' m/s²'], ['|a_P| measured from the path', fmt(aN, 4) + ' m/s²']]);
    }
  });
})();

// Example 3.B.4: tank turret firing a shell
(function(){
  const r = 3, L = 15;
  const terms = (V, th) => {
    const c = Math.cos(th), s = Math.sin(th), Om = V.Om, td = V.thd, vr = V.vr;
    const w = [Om * s, Om * c, td], al = [Om * td * c, -Om * td * s, 0];
    const aC = [-Om * Om * r * c, Om * Om * r * s, 0], R = [L, 0, 0], Vr = [vr, 0, 0];
    const aAl = cross3(al, R), aCo = mul3(cross3(w, Vr), 2), aCe = cross3(w, cross3(w, R));
    return { w, al, aC, aAl, aCo, aCe, a: add3(add3(aC, aAl), add3(aCo, aCe)) };
  };
  makeClip({
    id: 'e-tank', speed: 0.5,
    controls: [
      { key: 'Om', label: 'Turret rate Ω', min: -1, max: 1, step: 0.01, value: 0.4, unit: 'rad/s', dec: 3 },
      { key: 'thd', label: 'Barrel raising rate θ̇', min: -1, max: 1, step: 0.01, value: 0.4, unit: 'rad/s', dec: 3 },
      { key: 'vr', label: 'Muzzle speed (v)rel', min: 0, max: 400, step: 5, value: 200, unit: 'ft/s', dec: 1 }
    ],
    presets: (C, st, reset) => chips([['▶ Play the motion', false], ['Freeze at θ = 30°', true]], st, reset, 'freeze'),
    setup(st){ st.freeze = false; },
    reset(st){ markChips('e-tank', st, 'freeze', [['', false], ['', true]]); st.tau = st.freeze ? 0 : -0.5; },
    step(st, dt){ if (st.freeze) return; st.tau += dt; const th = 30 * RAD + st.V.thd * st.tau; if (st.tau > 1.5 || th > 70 * RAD || th < 5 * RAD) st.tau = -0.5; },
    draw(st){
      const cv = $('e-tank-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const V = st.V, tau = st.tau, th = 30 * RAD + V.thd * tau, ps = V.Om * tau;
      const Pj = cam(w * 0.36, h * 0.8, Math.min(w / 40, h / 30), 0.45, 0.25);
      const I = [Math.cos(ps), 0, -Math.sin(ps)], K = [Math.sin(ps), 0, Math.cos(ps)], J = [0, 1, 0];
      const iB = add3(mul3(I, Math.cos(th)), mul3(J, Math.sin(th))), jB = add3(mul3(I, -Math.sin(th)), mul3(J, Math.cos(th)));
      // hull (fixed) and turret (rotating)
      const hull = []; [-7, 7].forEach(x => [-4, -1.5].forEach(y => [-3.5, 3.5].forEach(z => hull.push([x, y, z]))));
      const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
      E.forEach(([a, b]) => ln3(ctx, Pj, hull[a], hull[b], COL.c5, 1.6));
      const tur = []; [-3, 3.2].forEach(a => [-1.5, 0.5].forEach(y => [-2.5, 2.5].forEach(c => tur.push(add3(add3(mul3(I, a), [0, y, 0]), mul3(K, c))))));
      E.forEach(([a, b]) => ln3(ctx, Pj, tur[a], tur[b], COL.massEdge, 2));
      ln3(ctx, Pj, [0, -4, 0], [0, 8, 0], COL.axis, 1, [4, 4]); txt(ctx, 'Y', ...Pj([0, 8.8, 0]), { color: COL.muted });
      const C = mul3(I, r), P = add3(C, mul3(iB, L));
      ln3(ctx, Pj, C, P, COL.fg, 5);
      const [cx, cy] = Pj(C); dot(ctx, cx, cy, 4, COL.fg); txt(ctx, 'C', cx - 4, cy + 14);
      const [ox, oy] = Pj([0, 0, 0]); dot(ctx, ox, oy, 3, COL.fg); txt(ctx, 'O', ox - 12, oy - 6);
      // shell, drawn in slow motion
      const sp = (performance.now() / 1200) % 1, S = add3(C, mul3(iB, L * sp));
      const [sx, sy] = Pj(S); dot(ctx, sx, sy, 4, ROSE);
      const [px, py] = Pj(P); txt(ctx, 'P', px + 6, py + 14);
      const T = terms(V, th), toW = q => add3(add3(mul3(iB, q[0]), mul3(jB, q[1])), mul3(K, q[2]));
      const sc = 0.03;
      ar3(ctx, Pj, P, add3(P, mul3(toW(T.aCo), sc)), ROSE, '2ω × (v)rel', 2.6);
      ar3(ctx, Pj, P, add3(P, mul3(toW(T.a), sc)), COL.c3, 'a_P', 3.5, { dx: -10, dy: 14, align: 'right' });
      ar3(ctx, Pj, [0, 0, 0], mul3(toW(T.w), 8), COL.c4, 'ω', 2.6);
      const shell = t => { const tt = 30 * RAD + V.thd * t, pp = V.Om * t, s = L + V.vr * (t - tau), rad = r + s * Math.cos(tt); return [rad * Math.cos(pp), s * Math.sin(tt), -rad * Math.sin(pp)]; };
      const hh = 1e-4, aN = norm(mul3(add3(sub3(shell(tau + hh), mul3(shell(tau), 2)), shell(tau - hh)), 1 / hh / hh));
      statsEvery(st, 'e-tank-stats', () => [['θ', deg(th)], ['ω (xyz)', f3(T.w, 4) + ' rad/s'], ['α (xyz)', f3(T.al, 4) + ' rad/s²'],
        ['a_C', f3(T.aC, 3)], ['α × r', f3(T.aAl, 3)], ['2ω × (v)rel', f3(T.aCo, 3)], ['ω × (ω × r)', f3(T.aCe, 3)],
        ['a_P (xyz)', f3(T.a, 4) + ' ft/s²', true], ['|a_P|', fmt(norm(T.a), 4) + ' ft/s²', true], ['|a_P| measured from the shell path', fmt(aN, 4) + ' ft/s²']]);
    }
  });
})();

/* =========================================================
   C. CORIOLIS IN REAL LIFE (theory page coriolis.html)
   All motions here are computed from the true equations: straight lines in the fixed frame,
   or numerical integration (RK4) of Newton's law written in the rotating frame.
   ========================================================= */
// rotate a 2D vector by angle a
const rot2 = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
function rk4v(f, s, h){ const a = f(s), b = f(s.map((v, i) => v + h / 2 * a[i])), c = f(s.map((v, i) => v + h / 2 * b[i])), d = f(s.map((v, i) => v + h * c[i])); return s.map((v, i) => v + h / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i])); }
function platform(ctx, cx, cy, Rp, spin){
  ctx.save(); ctx.fillStyle = 'rgba(207,185,145,.2)'; ctx.strokeStyle = COL.spring; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
  for (let s = 0; s < 8; s++){ const a = spin + s * Math.PI / 4; line(ctx, cx, cy, cx + Rp * Math.cos(a), cy - Rp * Math.sin(a), COL.grid, 1); }
  dot(ctx, cx, cy, 4, COL.fg);
}

// --- C1. Playing catch on a merry-go-round
const THROW = { R: 2, hand: 1.0 };
function throwShot(V, aim){
  const R = THROW.R, w = V.w, u = V.u;
  const solve = b => { const vx = u * Math.cos(b), vy = u * Math.sin(b) - w * R, tf = 2 * R * vx / (vx * vx + vy * vy);
    let d = Math.atan2(vy * tf, -R + vx * tf) - w * tf; d = Math.atan2(Math.sin(d), Math.cos(d)); return { vx, vy, tf, d }; };
  let b = 0, ok = true;
  if (aim){
    let lo = -1.3, hi = 1.3, flo = solve(lo).d, fhi = solve(hi).d;
    if ((flo > 0) === (fhi > 0)){ ok = false; b = Math.abs(flo) < Math.abs(fhi) ? lo : hi; }
    else { for (let k = 0; k < 60; k++){ const m = (lo + hi) / 2, fm = solve(m).d; if ((fm > 0) === (flo > 0)){ lo = m; flo = fm; } else hi = m; } b = (lo + hi) / 2; }
  }
  return { ...solve(b), beta: b, ok };
}
makeClip({
  id: 'c-throw', speed: 0.5,
  controls: [
    { key: 'w', label: 'Platform rate ω', min: -1.5, max: 1.5, step: 0.05, value: 0.8, unit: 'rad/s', dec: 3 },
    { key: 'u', label: 'Throw speed (relative to the thrower)', min: 1, max: 8, step: 0.1, value: 3, unit: 'm/s', dec: 3 }
  ],
  presets: (C, st, reset) => [
    { label: 'Aim straight at the friend', apply: () => { st.aim = false; reset(); } },
    { label: 'Aim with the Coriolis correction', apply: () => { st.aim = true; reset(); } },
    { label: 'Platform at rest', apply: () => { st.aim = false; C.set({ w: 0, u: 3 }); } }
  ],
  setup(st){ st.aim = false; },
  reset(st){ st.sh = throwShot(st.V, st.aim); st.trF = []; st.trR = []; },
  step(st){ if (st.t > st.sh.tf + 1.4){ st.t = 0; st.trF = []; st.trR = []; } },
  draw(st){
    const cv = $('c-throw-anim'); const { ctx, P } = twoPanels(cv, 380, 680), V = st.V, R = THROW.R, sh = st.sh;
    const tb = Math.min(st.t, sh.tf), p = [-R + sh.vx * tb, sh.vy * tb], ph = V.w * st.t, q = rot2(p, -V.w * tb);
    st.ball = { p, tb, ph };
    document.querySelectorAll('#c-throw-pre .chip').forEach((b, i) => b.classList.toggle('on', (i === 0 && !st.aim && V.w !== 0) || (i === 1 && st.aim) || (i === 2 && V.w === 0)));
    [0, 1].forEach(k => {
      const rot = k === 1, [x0, y0, pw, phh] = P[k], Rp = Math.min(pw, phh) * 0.36, cx = x0 + pw / 2, cy = y0 + phh / 2 + 12;
      panelLabel(ctx, rot ? 'Seen by the riders' : 'Seen from the ground', cx, y0 + 16);
      const spin = rot ? 0 : ph; platform(ctx, cx, cy, Rp, spin);
      const A = rot2([-R, 0], spin), B = rot2([R, 0], spin), S = Rp / R;
      stick(ctx, cx + S * A[0], cy - S * A[1] + 10, 0.75, COL.c4); stick(ctx, cx + S * B[0], cy - S * B[1] + 10, 0.75, COL.c2);
      txt(ctx, 'thrower', cx + S * A[0], cy - S * A[1] + 24, { color: COL.c4, font: '12px system-ui' });
      txt(ctx, 'friend', cx + S * B[0], cy - S * B[1] + 24, { color: COL.c2, font: '12px system-ui' });
      if (!rot && V.w !== 0) txt(ctx, V.w > 0 ? 'ω (counterclockwise)' : 'ω (clockwise)', cx, cy + Rp + 18, { color: COL.muted, font: '12px system-ui' });
      // aim line in the rider's frame (where the thrower points)
      if (rot){ const d = [Math.cos(sh.beta), Math.sin(sh.beta)]; line(ctx, cx - Rp, cy, cx - Rp + d[0] * Rp * 0.7, cy - d[1] * Rp * 0.7, COL.muted, 1.2, [4, 4]); }
      const b = rot ? q : p, bx = cx + S * b[0], by = cy - S * b[1];
      const tr = rot ? st.trR : st.trF; if (st.t <= sh.tf + 1e-9) tr.push([bx, by]); trail(ctx, tr, COL.c1, 2, [5, 3]); dot(ctx, bx, by, 7, COL.c1);
      if (st.t < sh.tf){
        if (rot){ // apparent accelerations seen by the riders: −2ω × (v)rel and −ω × (ω × r)
          const vr = rot2([sh.vx + V.w * p[1], sh.vy - V.w * p[0]], -V.w * tb), cor = [2 * V.w * vr[1], -2 * V.w * vr[0]], cen = [V.w * V.w * q[0], V.w * V.w * q[1]];
          const as = Rp * 0.45 / (2 * Math.abs(V.w) * (V.u + Math.abs(V.w) * R) + V.w * V.w * R + 1e-9);
          parrow(ctx, bx, by, cor[0] * as, cor[1] * as, ROSE, 'Coriolis', 2.6);
          parrow(ctx, bx, by, cen[0] * as, cen[1] * as, COL.c5, 'centrifugal', 2.6);
        } else { const vs = Rp * 0.12; parrow(ctx, bx, by, sh.vx * vs, sh.vy * vs, COL.c3, 'v (constant)', 2.6); }
      }
    });
    const miss = R * Math.abs(sh.d);
    statsEvery(st, 'c-throw-stats', () => [['flight time across', fmt(sh.tf, 3) + ' s'],
      ['ball velocity in the ground frame', fmt(Math.hypot(sh.vx, sh.vy), 3) + ' m/s, constant'],
      st.aim ? ['aim to the side of the friend', sh.ok ? fmt(Math.abs(sh.beta) / RAD, 3) + '° ' + (sh.beta > 0 ? 'to the left' : 'to the right') : 'not possible at this speed', true]
             : ['ball misses the friend by', fmt(miss, 3) + ' m along the rim', true],
      ['Coriolis acceleration seen by riders', fmt(2 * Math.abs(V.w) * V.u, 3) + ' m/s² at release']]);
  }
});

// --- C2. Where the factor of two comes from
makeClip({
  id: 'c-two', speed: 1,
  controls: [
    { key: 'w', label: 'Rod rate ω', min: 0.2, max: 1.5, step: 0.05, value: 0.8, unit: 'rad/s', dec: 3 },
    { key: 'u', label: 'Bead speed along the rod u', min: 0.05, max: 0.4, step: 0.01, value: 0.2, unit: 'm/s', dec: 3 },
    { key: 'dt', label: 'Time step Δt', min: 0.05, max: 0.6, step: 0.01, value: 0.4, unit: 's', dec: 3 }
  ],
  reset(st){},
  step(st){ if (0.25 + st.V.u * (st.t + st.V.dt) > 0.95) st.t = 0; },
  draw(st){
    const cv = $('c-two-anim'); const { ctx, P } = twoPanels(cv, 360, 660), V = st.V;
    const r1 = 0.25 + V.u * st.t, r2 = r1 + V.u * V.dt, a1 = V.w * st.t, a2 = a1 + V.w * V.dt;
    const e1 = [Math.cos(a1), Math.sin(a1)], e2 = [Math.cos(a2), Math.sin(a2)], n1 = [-e1[1], e1[0]], n2 = [-e2[1], e2[0]];
    // left: the rod at t (solid) and at t + Δt (faded), with (v)rel and ωr at both times
    { const [x0, y0, pw, ph] = P[0], Rp = Math.min(pw, ph) * 0.4, cx = x0 + pw * 0.38, cy = y0 + ph * 0.62;
      panelLabel(ctx, 'The bead at t and at t + Δt', x0 + pw / 2, y0 + 16);
      const vs = Rp * 1.3;
      [[e2, n2, r2, 0.35], [e1, n1, r1, 1]].forEach(([e, n, r, al]) => { ctx.save(); ctx.globalAlpha = al;
        line(ctx, cx, cy, cx + Rp * e[0], cy - Rp * e[1], COL.spring, 5); const bx = cx + Rp * r * e[0], by = cy - Rp * r * e[1]; dot(ctx, bx, by, 6, COL.c1);
        parrow(ctx, bx, by, V.u * e[0] * vs, V.u * e[1] * vs, COL.c3, al === 1 ? '(v)rel' : '', 2.4);
        parrow(ctx, bx, by, V.w * r * n[0] * vs, V.w * r * n[1] * vs, COL.c2, al === 1 ? 'ωr' : '', 2.4); ctx.restore(); });
      dot(ctx, cx, cy, 4, COL.fg); }
    // right: the two velocity changes, magnified, drawn from one point
    { const [x0, y0, pw, ph] = P[1], cx = x0 + pw * 0.5, cy = y0 + ph * 0.56;
      panelLabel(ctx, 'How the velocity changes during Δt', x0 + pw / 2, y0 + 16);
      const d1 = [V.u * (e2[0] - e1[0]), V.u * (e2[1] - e1[1])];                    // (v)rel turns with the rod
      const g2 = [V.w * (r2 - r1) * n2[0], V.w * (r2 - r1) * n2[1]];                // ωr grows because r grows
      const t2 = [V.w * r1 * (n2[0] - n1[0]), V.w * r1 * (n2[1] - n1[1])];          // ωr turns (centripetal part)
      const big = Math.max(Math.hypot(...d1) + Math.hypot(...g2), Math.hypot(...t2), 1e-6), s = Math.min(pw, ph) * 0.36 / big;
      const p1 = parrow(ctx, cx, cy, d1[0] * s, d1[1] * s, COL.c3, '(v)rel turns', 3);
      parrow(ctx, p1[0], p1[1], g2[0] * s, g2[1] * s, COL.c2, 'ωr grows', 3);
      parrow(ctx, cx, cy, t2[0] * s, t2[1] * s, COL.c5, 'ωr turns (centripetal)', 2.4);
      dot(ctx, cx, cy, 3.5, COL.fg); }
    const k = Math.abs(V.u * 2 * Math.sin(V.w * V.dt / 2)) / V.dt, g = V.w * V.u;
    statsEvery(st, 'c-two-stats', () => [['(v)rel turning, per second', fmt(k, 4) + ' m/s²'], ['ωr growing, per second', fmt(g, 4) + ' m/s²'],
      ['sum (sideways)', fmt(k + g, 4) + ' m/s²', true], ['Coriolis 2ωu', fmt(2 * V.w * V.u, 4) + ' m/s²', true]]);
  }
});

// --- C3. A long-range shell on the rotating Earth
const EARTH_W = 7.2921e-5;
makeClip({
  id: 'c-shell', speed: 1,
  controls: [
    { key: 'lat', label: 'Latitude', min: -80, max: 80, step: 1, value: 45, unit: '°', dec: 2 },
    { key: 'az', label: 'Firing direction (0° = north, 90° = east)', min: 0, max: 359, step: 1, value: 0, unit: '°', dec: 1 },
    { key: 'v', label: 'Muzzle speed', min: 200, max: 1000, step: 10, value: 800, unit: 'm/s', dec: 1 }
  ],
  presets: C => [
    { label: 'Northern hemisphere', apply: () => C.set({ lat: 45 }) },
    { label: 'Equator', apply: () => C.set({ lat: 0 }) },
    { label: 'Southern hemisphere', apply: () => C.set({ lat: -45 }) }
  ],
  reset(st){
    const V = st.V, L = V.lat * RAD, Wy = EARTH_W * Math.cos(L), Wz = EARTH_W * Math.sin(L), az = V.az * RAD, el = 45 * RAD, g = 9.81;
    const d = [Math.sin(az), Math.cos(az)], right = [Math.cos(az), -Math.sin(az)];
    // state [x east, y north, z up, vx, vy, vz]; a = g − 2Ω × v (centrifugal term is part of g)
    const f = s => [s[3], s[4], s[5], 2 * Wz * s[4] - 2 * Wy * s[5], -2 * Wz * s[3], -g + 2 * Wy * s[3]];
    let s = [0, 0, 0, V.v * Math.cos(el) * d[0], V.v * Math.cos(el) * d[1], V.v * Math.sin(el)], t = 0; const h = 0.05; st.path = [[0, 0, 0, 0]];
    while (t < 400){ const n = rk4v(f, s, h); t += h; if (n[2] < 0){ const fr = s[2] / (s[2] - n[2]); s = s.map((v, i) => v + fr * (n[i] - v)); t += (fr - 1) * h; st.path.push([t, s[0] * d[0] + s[1] * d[1], s[0] * right[0] + s[1] * right[1], 0]); break; }
      s = n; if (Math.round(t / h) % 10 === 0) st.path.push([t, s[0] * d[0] + s[1] * d[1], s[0] * right[0] + s[1] * right[1], s[2]]); }
    st.tf = t; st.range = st.path[st.path.length - 1][1]; st.drift = st.path[st.path.length - 1][2];
    st.dmax = Math.max(1, ...st.path.map(q => Math.abs(q[2])));
  },
  step(st){ if (st.t > 6.5) st.t = 0; },
  draw(st){
    const cv = $('c-shell-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, frac = Math.min(st.t / 5, 1), n = Math.max(1, Math.round(frac * (st.path.length - 1)));
    // globe inset: where on Earth we are
    const gx = 64, gy = h - 70, gr = 46; ctx.save(); ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, gx - gr, gy, gx + gr, gy, COL.grid, 1); line(ctx, gx, gy - gr - 10, gx, gy + gr + 10, COL.muted, 1.2, [3, 3]);
    const la = V.lat * RAD; dot(ctx, gx + gr * Math.cos(la), gy - gr * Math.sin(la), 5, ROSE);
    txt(ctx, 'N', gx, gy - gr - 16, { color: COL.muted, font: '12px system-ui' }); txt(ctx, 'Earth', gx, gy + gr + 16, { color: COL.muted, font: '12px system-ui' });
    // flight seen from above, along the aiming line (horizontal) with the sideways drift magnified
    const x0 = 150, x1 = w - 30, ym = h * 0.42, sx = (x1 - x0) / Math.max(st.range, 1), M = (h * 0.28) / st.dmax;
    line(ctx, x0, ym, x1, ym, COL.muted, 1.2, [6, 4]); txt(ctx, 'aiming line (no rotation)', (x0 + x1) / 2, ym + 16, { color: COL.muted, font: '12px system-ui' });
    txt(ctx, 'gun', x0, ym + 16, { color: COL.fg, font: '12px system-ui' });
    const pts = st.path.slice(0, n + 1).map(q => [x0 + sx * q[1], ym + M * q[2]]);  // right of the aim is drawn below the line
    trail(ctx, pts, ROSE, 2.4); const last = pts[pts.length - 1]; dot(ctx, last[0], last[1], 6, ROSE); dot(ctx, x0, ym, 5, COL.fg);
    txt(ctx, 'sideways drift magnified ×' + fmt(M / sx, 2), x0 + 4, 18, { color: COL.muted, font: '12px system-ui', align: 'left' });
    txt(ctx, 'right of the aim ↓', x1, h * 0.42 + h * 0.3, { color: COL.muted, font: '12px system-ui', align: 'right' });
    txt(ctx, 'left of the aim ↑', x1, h * 0.42 - h * 0.3, { color: COL.muted, font: '12px system-ui', align: 'right' });
    const pl = $('c-shell-plot');
    if (pl){ const ser = st.path.map(q => [q[1] / 1000, q[2]]); const m = st.dmax * 1.1;
      plot(pl, { xmin: 0, xmax: st.range / 1000 * 1.02, ymin: -m, ymax: m, xlabel: 'distance along the aim (km)', ylabel: 'drift, + = right (m)',
        series: [{ pts: ser, color: ROSE, width: 2 }], points: [{ x: ser[n][0], y: ser[n][1], color: ROSE }] }); }
    const side = st.drift > 0.5 ? 'to the right' : st.drift < -0.5 ? 'to the left' : '';
    statsEvery(st, 'c-shell-stats', () => [['flight time', fmt(st.tf, 3) + ' s'], ['range', fmt(st.range / 1000, 3) + ' km'],
      ['lands', fmt(Math.abs(st.drift), 3) + ' m ' + side, true], ['vertical component of Earth’s spin, Ω sin λ', fmt(EARTH_W * Math.sin(V.lat * RAD) * 1e5, 3) + ' × 10⁻⁵ rad/s']]);
  }
});

// --- C4. Why storms spin: air flowing into a low-pressure center
makeClip({
  id: 'c-storm', speed: 1,
  controls: [{ key: 'lat', label: 'Latitude', min: -60, max: 60, step: 1, value: 25, unit: '°', dec: 2 }],
  presets: C => [
    { label: 'Northern hemisphere', apply: () => C.set({ lat: 25 }) },
    { label: 'Equator', apply: () => C.set({ lat: 0 }) },
    { label: 'Southern hemisphere', apply: () => C.set({ lat: -25 }) }
  ],
  reset(st){ st.ts = 0; st.P = []; for (let k = 0; k < 12; k++){ const a = 2 * Math.PI * k / 12; st.P.push({ s: [600e3 * Math.cos(a), 600e3 * Math.sin(a), 0, 0], tr: [] }); } },
  step(st, dt){
    const f = 2 * EARTH_W * Math.sin(st.V.lat * RAD), ap = 1.5e-3, c = 3e-5, F = s => { const r = Math.hypot(s[0], s[1]) || 1;
      return [s[2], s[3], -ap * s[0] / r + f * s[3] - c * s[2], -ap * s[1] / r - f * s[2] - c * s[3]]; };
    const span = dt * 30000; let done = 0;                                        // time-lapse: 1 s of animation = 30 000 s ≈ 8.3 h
    while (done < span){ const h = Math.min(300, span - done); st.P.forEach(p => { p.s = rk4v(F, p.s, h); }); done += h; }
    st.ts += span;
    st.P.forEach((p, k) => { p.tr.push([p.s[0], p.s[1]]); if (p.tr.length > 140) p.tr.shift();
      if (Math.hypot(p.s[0], p.s[1]) < 35e3){ const a = 2 * Math.PI * k / 12; p.s = [600e3 * Math.cos(a), 600e3 * Math.sin(a), 0, 0]; p.tr = []; } });
  },
  draw(st){
    const cv = $('c-storm-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 8, S = Math.min(w, h) * 0.42 / 650e3;
    ctx.save(); ctx.strokeStyle = COL.grid; [200e3, 400e3, 600e3].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r * S, 0, 2 * Math.PI); ctx.stroke(); }); ctx.restore();
    txt(ctx, 'L', cx, cy, { color: ROSE, font: '700 22px system-ui' });
    st.P.forEach(p => { trail(ctx, p.tr.map(q => [cx + S * q[0], cy - S * q[1]]), COL.c1, 1.6); dot(ctx, cx + S * p.s[0], cy - S * p.s[1], 4, COL.c1); });
    const lat = st.V.lat, sense = Math.abs(lat) < 0.5 ? 'no spin: the air flows straight in' : lat > 0 ? 'counterclockwise (seen from above)' : 'clockwise (seen from above)';
    txt(ctx, 'low-pressure center, seen from above · north is up', cx, 16, { color: COL.muted, font: '12px system-ui' });
    statsEvery(st, 'c-storm-stats', () => [['latitude', fmt(lat, 3) + '°'], ['Coriolis parameter 2Ω sin λ', fmt(2 * EARTH_W * Math.sin(lat * RAD) * 1e5, 3) + ' × 10⁻⁵ 1/s'],
      ['the storm turns', sense, true], ['elapsed (time-lapse)', fmt(st.ts / 3600, 3) + ' h']]);
  }
});

// --- C5. The Foucault pendulum
makeClip({
  id: 'c-foucault', speed: 1,
  controls: [
    { key: 'lat', label: 'Latitude', min: -90, max: 90, step: 1, value: 49, unit: '°', dec: 2 },
    { key: 'k', label: 'Earth’s spin sped up by', min: 200, max: 3000, step: 50, value: 1500, unit: '×', dec: 1 }
  ],
  presets: C => [
    { label: 'Paris (Panthéon, 48.8° N)', apply: () => C.set({ lat: 49 }) },
    { label: 'North Pole', apply: () => C.set({ lat: 90 }) },
    { label: 'Equator', apply: () => C.set({ lat: 0 }) },
    { label: 'Southern hemisphere (34° S)', apply: () => C.set({ lat: -34 }) }
  ],
  reset(st){ st.s = [0.12, 0, 0, 0]; st.tr = []; st.max = null; st.planeMeas = null; },
  step(st, dt){
    const L = 1, w0 = Math.sqrt(9.81 / L), Wz = st.V.k * EARTH_W * Math.sin(st.V.lat * RAD);
    // small swings, in east (x) and north (y) axes fixed to the ground: a = −ω0² r − 2Ωz k × v
    const F = s => [s[2], s[3], -w0 * w0 * s[0] + 2 * Wz * s[3], -w0 * w0 * s[1] - 2 * Wz * s[2]];
    const n = Math.ceil(dt / 0.004), h = dt / n; for (let i = 0; i < n; i++) st.s = rk4v(F, st.s, h);
    st.tr.push([st.s[0], st.s[1]]); if (st.tr.length > 1600) st.tr.shift();
    const r = Math.hypot(st.s[0], st.s[1]), rd = st.s[0] * st.s[2] + st.s[1] * st.s[3];   // track each extreme of the swing
    if (st.prevRd !== undefined && st.prevRd > 0 && rd <= 0 && r > 0.05){ let a = Math.atan2(st.s[1], st.s[0]); if (Math.cos(a) < 0) a += Math.PI; st.planeMeas = Math.atan2(Math.sin(a), Math.cos(a)); }
    st.prevRd = rd;
    if (Math.abs(Wz * st.t) > Math.PI) st.t = 0, st.s = [0.12, 0, 0, 0], st.tr = [], st.planeMeas = null;
  },
  draw(st){
    const cv = $('c-foucault-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 6, S = Math.min(w, h) * 0.36 / 0.12, V = st.V, Wz = V.k * EARTH_W * Math.sin(V.lat * RAD);
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.arc(cx, cy, 0.125 * S, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    txt(ctx, 'N', cx, cy - 0.125 * S - 12, { color: COL.muted, font: '600 12px system-ui' }); txt(ctx, 'E', cx + 0.125 * S + 12, cy, { color: COL.muted, font: '600 12px system-ui' });
    line(ctx, cx - 0.12 * S, cy, cx + 0.12 * S, cy, COL.muted, 1.2, [5, 4]);                       // the plane at release
    const pa = -Wz * st.t, e = [Math.cos(pa), Math.sin(pa)];                                       // the plane predicted by Ω sin λ
    line(ctx, cx - 0.12 * S * e[0], cy + 0.12 * S * e[1], cx + 0.12 * S * e[0], cy - 0.12 * S * e[1], COL.c2, 2.2);
    trail(ctx, st.tr.map(q => [cx + S * q[0], cy - S * q[1]]), COL.c1, 1.1);
    dot(ctx, cx + S * st.s[0], cy - S * st.s[1], 8, ROSE); dot(ctx, cx, cy, 3, COL.fg);
    txt(ctx, 'swing plane now', cx + 0.12 * S * e[0], cy - 0.12 * S * e[1] - 12, { color: COL.c2, font: '12px system-ui' });
    txt(ctx, 'floor seen from above', cx, 14, { color: COL.muted, font: '12px system-ui' });
    const sl = Math.sin(V.lat * RAD), per = Math.abs(sl) < 1e-3 ? 'never (the plane does not turn)' : fmt(23.934 / Math.abs(sl), 3) + ' h';
    const meas = st.planeMeas === null ? '…' : fmt(((st.planeMeas / RAD) % 180 + 180) % 180, 3) + '°';
    const pred = fmt((((pa / RAD) % 180) + 180) % 180, 3) + '°';
    statsEvery(st, 'c-foucault-stats', () => [['real Earth: the plane turns', fmt(15.041 * Math.abs(sl), 3) + '° per hour ' + (sl > 0 ? '(clockwise)' : sl < 0 ? '(counterclockwise)' : '')],
      ['real Earth: one full turn takes', per, true], ['plane angle predicted, Ω sin λ · t', pred], ['plane angle measured from the swing', meas]]);
  }
});

// --- C6. A robot arm that extends while it turns
(function(){
  const kin = (V, t) => {
    const T = V.T, s = Math.min(Math.max(t / T, 0), 1), Th = V.th * RAD, r0 = V.mode === 'in' ? 1.0 : 0.4, r1 = V.mode === 'in' ? 0.4 : V.mode === 'fixed' ? 0.4 : 1.0;
    const r = r0 + (r1 - r0) * (1 - Math.cos(Math.PI * s)) / 2, rd = s < 1 ? (r1 - r0) * Math.PI / (2 * T) * Math.sin(Math.PI * s) : 0, rdd = s < 1 ? (r1 - r0) * (Math.PI / T) ** 2 / 2 * Math.cos(Math.PI * s) : 0;
    const th = Th * (s - Math.sin(2 * Math.PI * s) / (2 * Math.PI)), w = s < 1 ? Th / T * (1 - Math.cos(2 * Math.PI * s)) : 0, al = s < 1 ? Th / T * 2 * Math.PI / T * Math.sin(2 * Math.PI * s) : 0;
    const m = V.m; return { r, rd, rdd, th, w, al, Fr: m * (rdd - r * w * w), Fa: m * r * al, Fc: m * 2 * rd * w, tq: r * m * (r * al + 2 * rd * w), tq0: r * m * r * al };
  };
  makeClip({
    id: 'c-robot', speed: 0.5,
    controls: [
      { key: 'th', label: 'Turn angle', min: 30, max: 180, step: 5, value: 120, unit: '°', dec: 1 },
      { key: 'T', label: 'Move time', min: 0.8, max: 4, step: 0.1, value: 1.5, unit: 's', dec: 3 },
      { key: 'm', label: 'Payload mass m', min: 1, max: 20, step: 0.5, value: 8, unit: 'kg', dec: 3 }
    ],
    presets: (C, st, reset) => [
      { label: 'Extend while turning', apply: () => { C.v.mode = 'out'; reset(); } },
      { label: 'Retract while turning', apply: () => { C.v.mode = 'in'; reset(); } },
      { label: 'Turn without extending', apply: () => { C.v.mode = 'fixed'; reset(); } }
    ],
    setup(st){ st.V.mode = st.V.mode || 'out'; },
    reset(st){ st.V.mode = st.V.mode || 'out'; let lo = 0, hi = 0; st.cur = [[], []]; st.pk = [0, 0];
      for (let i = 0; i <= 200; i++){ const t = st.V.T * i / 200, k = kin(st.V, t); st.cur[0].push([t, k.tq]); st.cur[1].push([t, k.tq0]); lo = Math.min(lo, k.tq, k.tq0); hi = Math.max(hi, k.tq, k.tq0);
        st.pk[0] = Math.max(st.pk[0], k.tq); st.pk[1] = Math.max(st.pk[1], k.tq0); }
      st.lo = lo; st.hi = hi; st.Fmax = 1e-6; for (let i = 0; i <= 200; i++){ const k = kin(st.V, st.V.T * i / 200); st.Fmax = Math.max(st.Fmax, Math.abs(k.Fr), Math.abs(k.Fa) + Math.abs(k.Fc)); } },
    step(st){ if (st.t > st.V.T + 1.2) st.t = 0; },
    draw(st){
      const cv = $('c-robot-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const V = st.V, k = kin(V, st.t), cx = w / 2, cy = h / 2 + 10, S = Math.min(w, h) * 0.4 / 1.05; st.k = k;
      document.querySelectorAll('#c-robot-pre .chip').forEach((b, i) => b.classList.toggle('on', ['out', 'in', 'fixed'][i] === V.mode));
      const e = [Math.cos(k.th), Math.sin(k.th)], n = [-e[1], e[0]], P = (r, o = 0) => [cx + S * (r * e[0] + o * n[0]), cy - S * (r * e[1] + o * n[1])];
      ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, S * 1.0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      // outer sleeve and sliding inner boom
      const quad = (a, b, wd, col) => { const p = [P(a, -wd), P(b, -wd), P(b, wd), P(a, wd)]; ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
      quad(0.25, k.r, 0.035, '#d9dde3'); quad(-0.08, 0.45, 0.06, '#9aa0a8');
      ctx.save(); ctx.fillStyle = '#5b5a55'; ctx.beginPath(); ctx.arc(cx, cy, 0.1 * S, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
      const [px, py] = P(k.r); ctx.save(); ctx.fillStyle = '#e9d9a8'; ctx.strokeStyle = COL.fg; ctx.fillRect(px - 9, py - 9, 18, 18); ctx.strokeRect(px - 9, py - 9, 18, 18); ctx.restore();
      const fs = S * 0.45 / st.Fmax;
      parrow(ctx, px, py, k.Fr * e[0] * fs, k.Fr * e[1] * fs, COL.c2, 'radial force', 2.6);
      const t1 = parrow(ctx, px, py, k.Fa * n[0] * fs, k.Fa * n[1] * fs, COL.c5, Math.abs(k.Fa * fs) > 16 ? 'mrα' : '', 2.6);
      parrow(ctx, t1[0], t1[1], k.Fc * n[0] * fs, k.Fc * n[1] * fs, ROSE, Math.abs(k.Fc * fs) > 16 ? 'Coriolis 2mṙω' : '', 2.6);
      txt(ctx, 'robot seen from above', cx, 14, { color: COL.muted, font: '12px system-ui' });
      const pl = $('c-robot-plot');
      if (pl) plot(pl, { xmin: 0, xmax: V.T * 1.02, ymin: Math.min(st.lo, 0) * 1.1 - 0.01, ymax: Math.max(st.hi, 0) * 1.1 + 0.01, xlabel: 't (s)', ylabel: 'motor torque (N·m)',
        series: [{ pts: st.cur[0], color: ROSE, width: 2.2 }, { pts: st.cur[1], color: COL.c5, width: 1.8, dash: [5, 4] }],
        points: [{ x: Math.min(st.t, V.T), y: kin(V, Math.min(st.t, V.T)).tq, color: ROSE }] });
      statsEvery(st, 'c-robot-stats', () => [['ω', fmt(k.w, 3) + ' rad/s'], ['ṙ', fmt(k.rd, 3) + ' m/s'], ['Coriolis force 2mṙω', fmt(k.Fc, 3) + ' N'],
        ['peak driving torque, with / without the Coriolis term', fmt(st.pk[0], 3) + ' / ' + fmt(st.pk[1], 3) + ' N·m', true]]);
    }
  });
})();
