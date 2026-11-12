/* =========================================================
   Chapter 4 animations: particle kinetics
   Newton's laws, work-energy, linear and angular impulse-momentum
   ========================================================= */
const RAD = Math.PI / 180, G = 9.81, GFT = 32.2;
const RED = '#a61e4d';
function chips(items, st, reset, key){ return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } })); }
function markChips(id, st, key, items){ document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', items[i] && items[i][1] === st[key])); }
function dot(ctx, x, y, r, col){ ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = COL.card; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); }
function arrowL(ctx, x, y, dx, dy, col, label, wd = 2.6, lo = {}){
  if (Math.hypot(dx, dy) < 2) return;
  arrow(ctx, x, y, x + dx, y + dy, col, wd);
  if (label){ const L = Math.hypot(dx, dy); txt(ctx, label, x + dx + dx / L * 14 + (lo.dx || 0), y + dy + dy / L * 14 + (lo.dy || 0), { color: col, font: lo.font || 'italic 14px Georgia, serif' }); }
}
// vertical bar chart drawn inside a canvas region; items: [label, value, color]
function bars(ctx, x0, y0, w, h, items, vmax, title){
  const n = items.length, bw = Math.min(46, w / n * 0.6), gap = w / n;
  if (title) txt(ctx, title, x0 + w / 2, y0 - 12, { font: '600 12px system-ui' });
  line(ctx, x0, y0 + h, x0 + w, y0 + h, COL.axis, 1.2);
  items.forEach(([lab, v, col], i) => {
    const cx = x0 + gap * (i + 0.5), bh = clamp(v / vmax, -0.25, 1) * h;
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.85;
    if (bh >= 0) ctx.fillRect(cx - bw / 2, y0 + h - bh, bw, bh); else ctx.fillRect(cx - bw / 2, y0 + h, bw, -bh);
    ctx.restore();
    txt(ctx, lab, cx, y0 + h + 14, { font: '12px system-ui', color: COL.muted });
  });
}
// stopwatch-like loop helper
const loopAfter = (st, T) => { if (st.t > T){ st.t = 0; return true; } return false; };

/* =========================================================
   A. NEWTON'S LAWS
   ========================================================= */
// --- no centrifugal force: the string is the only horizontal force; cut it and the ball goes straight
(function(){
  makeClip({
    id: 'c-circle', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass m', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', dec: 2 },
      { key: 'v', label: 'Speed v', min: 0.5, max: 6, step: 0.1, value: 3, unit: 'm/s', dec: 2 },
      { key: 'r', label: 'String length r', min: 0.3, max: 1.5, step: 0.05, value: 1, unit: 'm', dec: 2 }
    ],
    presets: (C, st, reset) => [{ label: '✂ Cut the string', apply: () => { if (!st.cut){ st.cut = true; st.tc = st.t; } } }, { label: 'Reattach', apply: () => reset() }],
    reset(st){ st.cut = false; st.tc = 0; st.ok = st.V.m > 0 && st.V.r > 0; if (!st.ok) return;
      setStats('c-circle-stats', [['Tension T = m v² / r', fmt(st.V.m * st.V.v ** 2 / st.V.r) + ' N', true], ['Acceleration (toward O) v² / r', fmt(st.V.v ** 2 / st.V.r) + ' m/s²'], ['Forces pointing outward', 'none']]); },
    draw(st){
      const cv = $('c-circle-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'Mass and string length must be positive'); return; }
      const V = st.V, sc = Math.min(w, h) * 0.32 / V.r, ox = w * 0.4, oy = h / 2, om = V.v / V.r;
      const th = (t) => om * t, pos = t => [ox + sc * V.r * Math.cos(th(t)), oy - sc * V.r * Math.sin(th(t))];
      ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(ox, oy, sc * V.r, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      dot(ctx, ox, oy, 5, COL.fg); txt(ctx, 'O', ox - 12, oy + 12);
      let p, vdir;
      if (!st.cut){ p = pos(st.t); const a = th(st.t); vdir = [-Math.sin(a), -Math.cos(a)];
        line(ctx, ox, oy, p[0], p[1], COL.fg, 1.8);
        const T = V.m * V.v ** 2 / V.r, L = clamp(18 + T * 3, 18, 70), u = [(ox - p[0]), (oy - p[1])], n = Math.hypot(...u);
        arrowL(ctx, p[0], p[1], u[0] / n * L, u[1] / n * L, COL.c3, 'T', 3);
      } else {
        const a = th(st.tc), p0 = pos(st.tc); vdir = [-Math.sin(a), -Math.cos(a)];
        const d = V.v * (st.t - st.tc) * sc; p = [p0[0] + vdir[0] * d, p0[1] + vdir[1] * d];
        line(ctx, p0[0], p0[1], p[0], p[1], COL.c1, 1.5, [5, 4]);
        line(ctx, ox, oy, ox + (p0[0] - ox) * 0.5, oy + (p0[1] - oy) * 0.5, COL.fg, 1.8);
        txt(ctx, 'string cut: no horizontal force, so the ball moves in a straight line (tangent)', w / 2, h - 14, { font: '12px system-ui', color: COL.muted });
        if (p[0] < -30 || p[0] > w + 30 || p[1] < -30 || p[1] > h + 30){ st.cut = false; st.t = 0; }
      }
      arrowL(ctx, p[0], p[1], vdir[0] * 40, vdir[1] * 40, COL.c2, 'v', 2.2);
      dot(ctx, p[0], p[1], 10, COL.c1);
      if (!st.cut) txt(ctx, 'FBD (top view): the string pulls in; nothing pushes out', w / 2, h - 14, { font: '12px system-ui', color: COL.muted });
    }
  });
})();

// --- normal force over hills and dips, at constant speed
makeClip({
  id: 'c-hill', speed: 1,
  controls: [
    { key: 'v', label: 'Speed v', min: 1, max: 25, step: 0.5, value: 9, unit: 'm/s', dec: 2 },
    { key: 'A', label: 'Hill height A', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'm', dec: 2 },
    { key: 'L', label: 'Hill-to-hill length', min: 20, max: 120, step: 1, value: 50, unit: 'm', dec: 1 }
  ],
  presets: C => [{ label: 'Gentle', apply: () => C.set({ v: 9 }) }, { label: 'Fast: airborne at the crest', apply: () => C.set({ v: 17 }) }],
  reset(st){ st.x = 0; st.lastT = 0; st.hist = []; st.ok = st.V.L > 0 && st.V.A >= 0 && st.V.v > 0; },
  step(st){
    if (!st.ok) return;
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    const k = 2 * Math.PI / V.L, yp = x => -V.A * k * Math.sin(k * x);
    st.x += V.v * dt / Math.sqrt(1 + yp(st.x) ** 2);
    if (st.x > V.L * 2){ st.x = 0; st.hist = []; }
  },
  draw(st){
    const cv = $('c-hill-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Length and speed must be positive'); return; }
    const V = st.V, k = 2 * Math.PI / V.L, Xw = 2 * V.L;
    const y = x => V.A * Math.cos(k * x), y1 = x => -V.A * k * Math.sin(k * x), y2 = x => -V.A * k * k * Math.cos(k * x);
    const sx = (w - 40) / Xw, sy = Math.min(sx, (h - 80) / (2 * V.A + 1e-9)), X = x => 20 + x * sx, Y = q => h / 2 + 10 - q * sy;
    ctx.save(); ctx.strokeStyle = COL.ground; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 300; i++){ const x = Xw * i / 300; if (i) ctx.lineTo(X(x), Y(y(x))); else ctx.moveTo(X(x), Y(y(x))); } ctx.stroke(); ctx.restore();
    const x = st.x, s1 = y1(x), kap = y2(x) / Math.pow(1 + s1 * s1, 1.5), cphi = 1 / Math.sqrt(1 + s1 * s1);
    const Nmg = cphi + V.v ** 2 * kap / G;   // N / (m g): curvature > 0 means a dip (center above)
    st.hist.push([x, Nmg]); if (st.hist.length > 800) st.hist.shift();
    const px = X(x), py = Y(y(x)), tl = Math.hypot(sx, s1 * sy);
    const nx = -s1 * sy / tl, ny = sx / tl; // screen-space normal (pointing up, ny measured upward)
    const cx = px + nx * 12, cy = py - ny * 12;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.atan(s1 * sy / sx)); block(ctx, 0, 0, 26, 16, 0, '', Nmg < 0 ? '#f3c3c3' : undefined); ctx.restore();
    if (Nmg > 0) arrowL(ctx, px, py, nx * 30 * Nmg, -ny * 30 * Nmg, COL.c3, 'N', 2.6);
    arrowL(ctx, cx, cy, 0, 30, COL.c2, 'mg', 2.4);
    if (Nmg < 0) txt(ctx, 'N would have to pull down: the car leaves the road here', w / 2, 18, { font: '600 13px system-ui', color: RED });
    plot($('c-hill-plot'), { xmin: 0, xmax: Xw, ymin: Math.min(-1, ...st.hist.map(p => p[1])) - 0.2, ymax: Math.max(2, ...st.hist.map(p => p[1])) + 0.2, xlabel: 'distance along the road x (m)', ylabel: 'N / mg',
      hlines: [{ y: 1, color: COL.axis }], series: [{ pts: st.hist, color: COL.c3, width: 2.4 }], points: [{ x, y: Nmg, color: COL.c2, r: 5 }] });
    statsEvery(st, 'c-hill-stats', () => [['N / mg here', fmt(Nmg), true], ['at the crest', fmt(1 - V.v ** 2 * V.A * k * k / G)], ['in the dip', fmt(1 + V.v ** 2 * V.A * k * k / G)], ['speed to lose contact at the crest', fmt(Math.sqrt(G / (V.A * k * k + 1e-12))) + ' m/s']]);
  }
});

// --- system of particles: only external forces move the center of mass
makeClip({
  id: 'c-com', speed: 0.5,
  controls: [
    { key: 'F', label: 'External force F (on A only)', min: 0, max: 20, step: 0.5, value: 4, unit: 'N', dec: 2 },
    { key: 'mA', label: 'Mass of A', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'mB', label: 'Mass of B', min: 0.2, max: 5, step: 0.1, value: 2, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Spring k (internal)', min: 2, max: 200, step: 1, value: 10, unit: 'N/m', dec: 1 }
  ],
  reset(st){ const V = st.V; st.ok = V.mA > 0 && V.mB > 0 && V.k > 0; st.T = 3; st.span = 0.5 * V.F / (V.mA + V.mB) * st.T ** 2 + 2.5; st.Lr = 0.14 * st.span; st.s = [0, 0, -st.Lr, 0]; st.lastT = 0; st.hist = []; },
  step(st){
    if (!st.ok) return; const V = st.V;
    if (st.t > st.T){ st.t = 0; st.lastT = 0; st.s = [0, 0, -st.Lr, 0]; st.hist = []; return; }
    const f = (t, s) => { const fs = V.k * (s[0] - s[2] - st.Lr); return [s[1], (V.F - fs) / V.mA, s[3], fs / V.mB]; };
    [, st.s] = integrate(f, st.lastT, st.s, st.t - st.lastT, 0.002); st.lastT = st.t;
    const M = V.mA + V.mB;
    st.hist.push([st.t, (V.mA * st.s[0] + V.mB * st.s[2]) / M, st.s[0], st.s[2]]);
  },
  draw(st){
    const cv = $('c-com-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Masses and stiffness must be positive'); return; }
    const V = st.V, M = V.mA + V.mB, span = st.span, sc = (w - 60) / span, X = q => 30 + (q + st.Lr + 0.3) * sc, yb = h * 0.55;
    hatch(ctx, 10, yb + 22, w - 10, yb + 22, 1);
    const xA = st.s[0], xB = st.s[2];
    const bw = Math.min(32, st.Lr * sc * 0.4);
    springLine(ctx, X(xB) + bw / 2, yb, X(xA) - bw / 2, yb, 7, 6);
    block(ctx, X(xA), yb, bw, 36, 0, 'A'); block(ctx, X(xB), yb, bw, 36, 0, 'B', '#d9cfae');
    if (V.F > 0) arrowL(ctx, X(xA) + bw / 2, yb, 16 + V.F * 2, 0, COL.c2, 'F', 3);
    const xg = (V.mA * xA + V.mB * xB) / M;
    line(ctx, X(xg), yb - 50, X(xg), yb + 34, COL.c4, 2, [4, 3]); txt(ctx, 'G', X(xg), yb - 60, { color: COL.c4 });
    const xg0 = -V.mB * st.Lr / M, ex = []; for (let i = 0; i <= 100; i++){ const t = st.T * i / 100; ex.push([t, xg0 + 0.5 * V.F / M * t * t]); }
    plot($('c-com-plot'), { xmin: 0, xmax: st.T, ymin: -st.Lr - 0.3, ymax: span - st.Lr - 0.3, xlabel: 'time t (s)', ylabel: 'position (m)',
      series: [{ pts: st.hist.map(p => [p[0], p[2]]), color: COL.c1, width: 1.6, alpha: 0.7 }, { pts: st.hist.map(p => [p[0], p[3]]), color: COL.c5, width: 1.6, alpha: 0.7 },
        { pts: st.hist.map(p => [p[0], p[1]]), color: COL.c4, width: 4, alpha: 0.6 }, { pts: ex, color: COL.c2, width: 2, dash: [6, 4] }] });
    statsEvery(st, 'c-com-stats', () => [['a_G = F / (m_A + m_B)', fmt(V.F / M) + ' m/s²', true], ['spring force', 'internal: it shakes A and B but cannot move G']]);
  }
});

/* =========================================================
   B. WORK AND ENERGY
   ========================================================= */
// --- which forces do work
makeClip({
  id: 'c-work', speed: 0.5,
  controls: [
    { key: 'F', label: 'Pull F', min: 0, max: 60, step: 1, value: 30, unit: 'N', dec: 1 },
    { key: 'al', label: 'Angle α above horizontal', min: -60, max: 80, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 3, unit: 'kg', dec: 2 },
    { key: 'mk', label: 'Kinetic μₖ', min: 0, max: 1, step: 0.01, value: 0.25, unit: '', dec: 3 }
  ],
  reset(st){ const V = st.V; st.ok = V.m > 0; st.x = 0; st.v = 0; st.lastT = 0; st.done = false;
    st.N = Math.max(0, V.m * G - V.F * Math.sin(V.al * RAD)); },
  step(st){
    if (!st.ok) return; const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.x >= 2 || st.t > 8){ if (st.t > (st.tEnd ??= st.t) + 1.5){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 0; st.tEnd = undefined; } return; }
    const Ft = V.F * Math.cos(V.al * RAD), fr = V.mk * st.N;
    // block starts from rest; it moves only if the pull beats friction
    const a = st.v > 1e-9 ? (Ft - fr) / V.m : Math.max(0, Ft - fr) / V.m;
    st.v = Math.max(0, st.v + a * dt); st.x = Math.min(2, st.x + st.v * dt);
  },
  draw(st){
    const cv = $('c-work-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Mass must be positive'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '500' : '280'; fitView(ctx, w, h, narrow ? [0, 0, 420, 470] : [0, 0, 780, 270]);
    const V = st.V, al = V.al * RAD, x = 60 + st.x * 120, yb = 170;
    hatch(ctx, 20, yb, 380, yb, 1);
    line(ctx, 60, yb + 26, 300, yb + 26, COL.axis, 1, [3, 3]); txt(ctx, 'd = 2 m', 180, yb + 38, { font: '12px system-ui', color: COL.muted });
    block(ctx, x + 25, yb - 25, 50, 50, 0, ''); txt(ctx, 'm', x + 13, yb - 12, { font: 'italic 14px Georgia, serif', color: COL.fg }); // corner, clear of the F arrow
    arrowL(ctx, x + 25, yb - 25, Math.cos(al) * (25 + V.F * 1.3), -Math.sin(al) * (25 + V.F * 1.3), COL.c2, 'F', 3);
    arrowL(ctx, x + 25, yb, 0, 40, COL.c1, 'mg', 2.2, { dx: 14, dy: -8 });
    if (st.N > 0) arrowL(ctx, x + 10, yb + 40, 0, -40, COL.c5, 'N', 2.2, { dx: -12, dy: 14 });
    if (V.mk > 0 && st.N > 0) arrowL(ctx, x, yb - 4, -Math.min(14 + V.mk * st.N * 1.3, 70), 0, RED, 'f', 2.6);
    const d = st.x, Ft = V.F * Math.cos(al), fr = V.mk * st.N;
    const W = [['F', Ft * d, COL.c2], ['mg', 0, COL.c1], ['N', 0, COL.c5], ['friction', -fr * d, RED], ['total', (Ft - fr) * d, COL.c3]];
    if (narrow) ctx.translate(-380, 220);
    const vmax = Math.max(10, Math.abs(Ft) * 2, fr * 2);
    bars(ctx, 420, 40, 340, 150, W.map(r => [r[0], r[1], r[2]]), vmax, 'Work done so far (J)');
    W.forEach((r, i) => txt(ctx, fmt(r[1], 3), 420 + 340 / 5 * (i + 0.5), 222, { font: '600 12px system-ui', color: r[2] }));
    statsEvery(st, 'c-work-stats', () => [['distance moved', fmt(d, 3) + ' m'], ['½mv²', fmt(0.5 * V.m * st.v ** 2, 4) + ' J', true], ['total work', fmt((Ft - fr) * d, 4) + ' J', true], ['N = mg − F sin α', fmt(st.N) + ' N']]);
  }
});

// --- path independence of the work of gravity
(function(){
  const PATHS = [
    { name: 'straight ramp', col: () => COL.c1, y: u => 1 - u },
    { name: 'steep start', col: () => COL.c2, y: u => Math.pow(1 - u, 2.6) },
    { name: 'roller coaster', col: () => COL.c3, y: u => (1 - u) * (0.55 + 0.45 * Math.cos(3 * Math.PI * u)) + 0.0 }
  ];
  makeClip({
    id: 'c-paths', speed: 0.5,
    controls: [{ key: 'h', label: 'Drop height h', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'm', dec: 2 }],
    reset(st){ st.ok = st.V.h > 0; st.b = PATHS.map(() => ({ u: 0.002, v: 0, done: null })); st.lastT = 0; st.Lx = 2 * st.V.h; },
    step(st){
      if (!st.ok) return; const V = st.V, dt = st.t - st.lastT; st.lastT = st.t; const Lx = st.Lx;
      PATHS.forEach((P, i) => { const b = st.b[i]; if (b.done !== null) return;
        const n = 20, hh = dt / n;
        for (let k = 0; k < n; k++){
          const yy = V.h * P.y(b.u), v = Math.sqrt(Math.max(0, 2 * G * (V.h - yy))) + 1e-3;
          const du = 1e-4, dy = V.h * (P.y(b.u + du) - P.y(b.u)) / du, ds = Math.sqrt(Lx * Lx + dy * dy);
          b.u += v * hh / ds; b.v = v; if (b.u >= 1){ b.u = 1; b.done = st.t; b.v = Math.sqrt(2 * G * V.h); break; }
        }
      });
      if (st.b.every(b => b.done !== null) && st.t > Math.max(...st.b.map(b => b.done)) + 2){ st.t = 0; st.lastT = 0; st.b = PATHS.map(() => ({ u: 0.002, v: 0, done: null })); }
    },
    draw(st){
      const cv = $('c-paths-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'Height must be positive'); return; }
      const wide = w >= 560; if (!wide) cv.dataset.h0 = cv.dataset.h0; cv.style.height = wide ? '320px' : '460px';
      const pw = wide ? w * 0.62 : w, top = wide ? 40 : 200;
      const V = st.V, s = Math.min((pw - 60) / (2 * V.h), (h - 40 - top) / V.h), X = u => 40 + u * 2 * V.h * s, Y = y => h - 40 - y * s;
      PATHS.forEach((P, i) => { ctx.save(); ctx.strokeStyle = P.col(); ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7; ctx.beginPath();
        for (let k = 0; k <= 200; k++){ const u = k / 200; if (k) ctx.lineTo(X(u), Y(V.h * P.y(u))); else ctx.moveTo(X(u), Y(V.h * P.y(u))); } ctx.stroke(); ctx.restore(); });
      line(ctx, 20, Y(0), X(1) + 20, Y(0), COL.ground, 2);
      txt(ctx, `h = ${fmt(V.h)} m`, 30, Y(V.h) - 14, { font: '12px system-ui', color: COL.muted, align: 'left' });
      st.b.forEach((b, i) => dot(ctx, X(b.u), Y(V.h * PATHS[i].y(b.u)), 8, PATHS[i].col()));
      const bx = wide ? w * 0.66 : 20, bw = wide ? w * 0.32 : w - 40;
      txt(ctx, 'speed (m/s)', bx + bw / 2, 26, { font: '600 12px system-ui' });
      const vmax = Math.sqrt(2 * G * V.h);
      st.b.forEach((b, i) => { const y0 = 50 + i * 46; ctx.save(); ctx.fillStyle = PATHS[i].col(); ctx.fillRect(bx, y0, bw * 0.8 * b.v / vmax, 18); ctx.restore();
        txt(ctx, `${PATHS[i].name}: ${fmt(b.v, 3)}${b.done !== null ? `  (t = ${fmt(b.done, 3)} s)` : ''}`, bx, y0 + 30, { font: '12px system-ui', color: COL.fg, align: 'left' }); });
      line(ctx, bx + bw * 0.8, 44, bx + bw * 0.8, 50 + 3 * 46 - 10, COL.axis, 1, [3, 3]);
      txt(ctx, '√(2gh)', bx + bw * 0.8, 50 + 3 * 46, { font: '12px system-ui', color: COL.muted });
      statsEvery(st, 'c-paths-stats', () => [['√(2gh)', fmt(vmax, 4) + ' m/s', true], ['work done by gravity per kg', fmt(G * V.h) + ' J/kg'], ['the normal force', 'is perpendicular to the path, so it does no work']]);
    }
  });
})();

// --- energy bookkeeping: spring + friction
makeClip({
  id: 'c-energy', speed: 0.5,
  controls: [
    { key: 'm', label: 'Mass m', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 5, max: 200, step: 1, value: 40, unit: 'N/m', dec: 1 },
    { key: 'x0', label: 'Initial stretch x₀', min: -0.5, max: 0.5, step: 0.01, value: 0.4, unit: 'm', dec: 3 },
    { key: 'mk', label: 'Friction μₖ', min: 0, max: 0.5, step: 0.01, value: 0.08, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'No friction', apply: () => C.set({ mk: 0 }) }, { label: 'Some friction', apply: () => C.set({ mk: 0.08 }) }],
  reset(st){ const V = st.V; st.ok = V.m > 0 && V.k > 0; st.x = V.x0; st.v = 0; st.heat = 0; st.lastT = 0; st.stuck = false; st.E0 = 0.5 * V.k * V.x0 ** 2; },
  step(st){
    if (!st.ok) return; const V = st.V, fr = V.mk * V.m * G, n = 40, hh = (st.t - st.lastT) / n; st.lastT = st.t;
    if (st.t > 14){ st.t = 0; st.lastT = 0; st.x = V.x0; st.v = 0; st.heat = 0; st.stuck = false; return; }
    for (let i = 0; i < n; i++){
      if (st.stuck) break;
      if (Math.abs(st.v) < 1e-9 && Math.abs(V.k * st.x) <= fr){ st.v = 0; st.stuck = true; break; }
      const dir = Math.abs(st.v) > 1e-9 ? Math.sign(st.v) : -Math.sign(st.x);
      const a = (-V.k * st.x - fr * dir) / V.m, vn = st.v + a * hh;
      if (Math.sign(vn) !== dir && Math.abs(st.v) > 1e-9){ // velocity reaches zero within this step
        const tz = -st.v / a; st.x += st.v * tz + 0.5 * a * tz * tz; st.heat += fr * Math.abs(st.v * tz + 0.5 * a * tz * tz); st.v = 0; continue; }
      const dx = st.v * hh + 0.5 * a * hh * hh; st.x += dx; st.heat += fr * Math.abs(dx); st.v = vn;
    }
  },
  draw(st){
    const cv = $('c-energy-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Mass and stiffness must be positive'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '460' : '240'; fitView(ctx, w, h, narrow ? [0, 0, 400, 430] : [0, 0, 760, 230]);
    const V = st.V, sc = 200, x0 = 200, yb = 150;
    hatch(ctx, 20, yb, 380, yb, 1); hatch(ctx, 30, yb - 70, 30, yb, 1);
    springLine(ctx, 30, yb - 25, x0 + st.x * sc - 25, yb - 25, 10, 8);
    block(ctx, x0 + st.x * sc, yb - 25, 50, 50, 0, 'm');
    line(ctx, x0, yb + 6, x0, yb + 20, COL.axis, 1.5); txt(ctx, 'unstretched', x0, yb + 32, { font: '11px system-ui', color: COL.muted });
    if (narrow) ctx.translate(-370, 210);
    const T = 0.5 * V.m * st.v ** 2, Vs = 0.5 * V.k * st.x ** 2;
    bars(ctx, 420, 40, 320, 130, [['½mv²', T, COL.c1], ['½kx²', Vs, COL.c3], ['lost to friction', st.heat, RED], ['sum', T + Vs + st.heat, COL.c4]], Math.max(st.E0, 1e-6) * 1.05, 'Energy (J)');
    statsEvery(st, 'c-energy-stats', () => [['T + V', fmt(T + Vs, 4) + ' J', true], ['work done by friction', fmt(-st.heat, 4) + ' J'], ['T + V − U_friction', fmt(T + Vs + st.heat, 4) + ' J (constant)', true]]);
  }
});

/* =========================================================
   C. LINEAR IMPULSE AND MOMENTUM
   ========================================================= */
// --- same impulse, different force histories
makeClip({
  id: 'c-impulse', speed: 0.25,
  controls: [
    { key: 'm', label: 'Egg mass m', min: 0.03, max: 0.1, step: 0.005, value: 0.06, unit: 'kg', dec: 3 },
    { key: 'h', label: 'Drop height h', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'm', dec: 2 },
    { key: 'tau', label: 'Cushion stopping time', min: 0.02, max: 0.3, step: 0.01, value: 0.12, unit: 's', dec: 3 }
  ],
  reset(st){ const V = st.V; st.ok = V.m > 0 && V.h > 0 && V.tau > 0; st.v0 = Math.sqrt(2 * G * V.h); st.tf = Math.sqrt(2 * V.h / G); },
  step(st){ if (st.t > st.tf + Math.max(st.V.tau, 0.005) + 0.6) st.t = 0; },
  draw(st){
    const cv = $('c-impulse-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const V = st.V, taus = [0.005, V.tau], yg = h - 50, sc = (h - 110) / V.h;
    const yAt = (t, tau) => { if (t < st.tf) return V.h - 0.5 * G * t * t;
      const s = Math.min(t - st.tf, tau); // contact: F = Fpk sin(πs/τ) − stopping from v0 exactly at s = τ
      const Fpk = Math.PI * V.m * st.v0 / (2 * tau), a = Fpk / V.m;
      // v(s) = -v0 + (a τ/π)(1 − cos(πs/τ)); y(s) = −v0 s + (aτ/π)(s − (τ/π) sin(πs/τ))
      return -st.v0 * s + (a * tau / Math.PI) * (s - (tau / Math.PI) * Math.sin(Math.PI * s / tau)); };
    [[w * 0.27, 'hard floor', taus[0]], [w * 0.73, 'cushion', taus[1]]].forEach(([cx, lab, tau], i) => {
      const y = yAt(st.t, tau), pad = i ? Math.max(14, -yAt(1e9, tau) * sc + 6) : 0, dip = Math.max(0, -y * sc); // dip: how far the contact has moved (px)
      // the cushion is pressed down by the egg; on the hard floor the egg itself flattens (the floor does not move)
      if (i){ ctx.save(); ctx.fillStyle = '#e8e2cf'; ctx.fillRect(cx - 50, yg - pad + dip, 100, pad - dip); ctx.restore(); }
      hatch(ctx, cx - 70, yg, cx + 70, yg, 1);
      const bottom = i ? yg - pad + dip : yg - Math.max(0, y) * sc, ry = i ? 14 : Math.max(9, 14 - dip), rx = i ? 11 : 11 * 14 / ry;
      const ey = (i ? bottom - Math.max(0, y) * sc : bottom) - ry;
      ctx.save(); ctx.fillStyle = '#fbf6e6'; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, ey, rx, ry, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, lab, cx, h - 20, { font: '600 12px system-ui' });
    });
    const tc = st.t - st.tf, pts = (tau) => { const a = []; for (let i = 0; i <= 120; i++){ const s = -0.02 + (0.34) * i / 120; a.push([s * 1000, s < 0 || s > tau ? 0 : Math.PI * V.m * st.v0 / (2 * tau) * Math.sin(Math.PI * s / tau)]); } return a; };
    const F1 = Math.PI * V.m * st.v0 / (2 * taus[0]), F2 = Math.PI * V.m * st.v0 / (2 * taus[1]);
    plot($('c-impulse-plot'), { xmin: -20, xmax: 320, ymin: 0, ymax: F1 * 1.1, xlabel: 'time since first contact (ms)', ylabel: 'force from the surface (N)',
      series: [{ pts: pts(taus[0]), color: RED, width: 2.4 }, { pts: pts(taus[1]), color: COL.c3, width: 2.4 }], vlines: tc > -0.02 && tc < 0.32 ? [{ x: tc * 1000, color: COL.axis }] : [] });
    statsEvery(st, 'c-impulse-stats', () => [['impact speed', fmt(st.v0) + ' m/s'], ['impulse needed = m v', fmt(V.m * st.v0, 3) + ' N·s', true], ['peak force, hard floor (5 ms)', fmt(F1) + ' N'], ['peak force, cushion', fmt(F2) + ' N', true], ['egg weight', fmt(V.m * G, 3) + ' N']]);
  }
});

// --- central impact with restitution
function makeImpactClip(id, o){
  makeClip({
    id, speed: o.speed ?? 0.5,
    controls: [
      { key: 'mA', label: 'Mass of A', min: 0.2, max: 10, step: 0.1, value: o.mA, unit: 'kg', dec: 2 },
      { key: 'mB', label: 'Mass of B', min: 0.2, max: 10, step: 0.1, value: o.mB, unit: 'kg', dec: 2 },
      { key: 'vA', label: 'v_A1 (→ positive)', min: -3, max: 3, step: 0.05, value: o.vA, unit: 'm/s', dec: 3 },
      { key: 'vB', label: o.vBlabel || 'v_B1 (→ positive)', min: -3, max: 3, step: 0.001, value: o.vB, unit: 'm/s', dec: 3 },
      { key: 'e', label: 'Restitution e', min: 0, max: 1, step: 0.01, value: o.e, unit: '', dec: 3 }
    ],
    presets: o.presets,
    reset(st){
      const V = st.V; st.ok = V.mA > 0 && V.mB > 0 && V.e >= 0 && V.e <= 1;
      const vB = o.vBsign ? -V.vB : V.vB; st.vB1 = vB;
      st.approach = V.vA - vB > 1e-9;
      const M = V.mA + V.mB, p = V.mA * V.vA + V.mB * vB;
      st.vA2 = (p - V.mB * V.e * (V.vA - vB)) / M; st.vB2 = (p + V.mA * V.e * (V.vA - vB)) / M;
      st.gap = 1.2; st.tc = st.approach ? st.gap / (V.vA - vB) : Infinity;
      if (!st.ok){ setStats(id + '-stats', []); return; }
      const T1 = 0.5 * V.mA * V.vA ** 2 + 0.5 * V.mB * vB ** 2, T2 = 0.5 * V.mA * st.vA2 ** 2 + 0.5 * V.mB * st.vB2 ** 2;
      setStats(id + '-stats', st.approach ? [['v_A2', fmt(st.vA2) + ' m/s', true], ['v_B2', fmt(st.vB2) + ' m/s', true], ['momentum before → after', `${fmt(p)} → ${fmt(V.mA * st.vA2 + V.mB * st.vB2)} kg·m/s`], ['kinetic energy before → after', `${fmt(T1)} → ${fmt(T2)} J`]]
        : [['No impact', 'the blocks never meet with these velocities']]);
      o.after && o.after(st);
    },
    step(st){ if (st.t > 4) st.t = 0; },
    draw(st){
      const cv = $(id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'Masses must be positive and 0 ≤ e ≤ 1'); return; }
      const V = st.V, sz = m => 26 + 16 * Math.sqrt(m), wA = sz(V.mA), wB = sz(V.mB);
      const cxm = w / 2, yb = h * 0.62;
      const t = st.t, tc = isFinite(st.tc) ? 1.5 : Infinity, vm = Math.max(Math.abs(V.vA), Math.abs(st.vB1), Math.abs(st.vA2), Math.abs(st.vB2), 0.2);
      const sc = (w / 2 - wA - 20) / (vm * 2.5);
      let fA, fB; // A's right face, B's left face (px)
      if (!isFinite(tc)){ fA = cxm - 30 + V.vA * t * sc; fB = cxm + 30 + st.vB1 * t * sc; }
      else if (t < tc){ fA = cxm + V.vA * (t - tc) * sc; fB = cxm + st.vB1 * (t - tc) * sc; }
      else { fA = cxm + st.vA2 * (t - tc) * sc; fB = cxm + st.vB2 * (t - tc) * sc; }
      const xA = fA - wA / 2, xB = fB + wB / 2;
      hatch(ctx, 10, yb + 24, w - 10, yb + 24, 1);
      block(ctx, xA, yb, wA, 48, 0, 'A'); block(ctx, xB, yb, wB, 48, 0, 'B', '#d9cfae');
      const vAn = t < tc ? V.vA : st.vA2, vBn = t < tc ? st.vB1 : st.vB2;
      if (Math.abs(vAn) > 0.01) arrowL(ctx, xA, yb - 40, vAn * 30, 0, COL.c1, '', 2.4);
      if (Math.abs(vBn) > 0.01) arrowL(ctx, xB, yb - 40, vBn * 30, 0, COL.c2, '', 2.4);
      txt(ctx, `${fmt(vAn, 3)} m/s`, xA, yb - 58, { font: '12px system-ui', color: COL.c1 });
      txt(ctx, Math.abs(vBn) < 1e-3 ? 'at rest' : `${fmt(vBn, 3)} m/s`, xB, yb - 58, { font: '12px system-ui', color: COL.c2 });
      txt(ctx, t < tc ? 'before impact' : 'after impact', w / 2, 20, { font: '600 13px system-ui', color: COL.muted });
    }
  });
}
makeImpactClip('c-impact', { mA: 2, mB: 2, vA: 1.5, vB: 0, e: 1, presets: C => [
  { label: 'Equal masses, e = 1', apply: () => C.set({ mA: 2, mB: 2, vA: 1.5, vB: 0, e: 1 }) },
  { label: 'Perfectly plastic, e = 0', apply: () => C.set({ e: 0 }) },
  { label: 'Light hits heavy', apply: () => C.set({ mA: 0.5, mB: 5, vA: 1.5, vB: 0, e: 0.9 }) },
  { label: 'Heavy hits light', apply: () => C.set({ mA: 5, mB: 0.5, vA: 1.5, vB: 0, e: 0.9 }) }] });

// --- oblique impact with a smooth wall
makeClip({
  id: 'c-oblique', speed: 0.5,
  controls: [
    { key: 'v', label: 'Speed v₁', min: 0.5, max: 5, step: 0.1, value: 3, unit: 'm/s', dec: 2 },
    { key: 'th', label: 'Angle θ₁ from the wall', min: 5, max: 90, step: 1, value: 40, unit: '°', dec: 1 },
    { key: 'e', label: 'Restitution e', min: 0, max: 1, step: 0.01, value: 0.6, unit: '', dec: 3 }
  ],
  reset(st){ const V = st.V; st.ok = V.v > 0 && V.e >= 0;
    const vt = V.v * Math.cos(V.th * RAD), vn = V.v * Math.sin(V.th * RAD), vn2 = V.e * vn;
    st.vt = vt; st.vn = vn; st.vn2 = vn2; st.v2 = Math.hypot(vt, vn2); st.th2 = Math.atan2(vn2, vt) / RAD;
    setStats('c-oblique-stats', [['tangential v_t (unchanged)', fmt(vt) + ' m/s', true], ['normal v_n: before → after', `${fmt(vn)} → ${fmt(vn2)} m/s`, true], ['speed after', fmt(st.v2) + ' m/s'], ['angle after θ₂', fmt(st.th2) + '°']]); },
  step(st){ if (st.t > 3.2) st.t = 0; },
  draw(st){
    const cv = $('c-oblique-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Speed must be positive'); return; }
    const yw = h - 40, sc = Math.min(w, h) / 9, cx = w / 2, T = 1.5;
    ctx.save(); ctx.fillStyle = '#e6dfca'; ctx.fillRect(0, yw, w, 40); ctx.restore(); hatch(ctx, 0, yw, w, yw, -1);
    txt(ctx, 'smooth wall', 70, yw + 22, { font: '12px system-ui', color: COL.muted });
    const p = st.t < T ? [st.vt * (st.t - T), -st.vn * (st.t - T)] : [st.vt * (st.t - T), st.vn2 * (st.t - T)];
    const P = q => [cx + q[0] * sc, yw - 10 - q[1] * sc];
    const s0 = P([-st.vt * T, st.vn * T]), s1 = P([0, 0]);
    line(ctx, s0[0], s0[1], s1[0], s1[1], COL.c1, 1.4, [5, 4]);
    if (st.t >= T){ const s2 = P([st.vt * (st.t - T), st.vn2 * (st.t - T)]); line(ctx, s1[0], s1[1], s2[0], s2[1], COL.c2, 1.4, [5, 4]); }
    line(ctx, cx, yw, cx, 30, COL.axis, 1, [2, 4]); txt(ctx, 'n', cx + 10, 36, { font: 'italic 14px Georgia, serif', color: COL.muted });
    const q = P(p); dot(ctx, q[0], q[1], 10, COL.c1);
    const vv = st.t < T ? [st.vt, -st.vn] : [st.vt, st.vn2];
    arrowL(ctx, q[0], q[1], vv[0] * 22, -vv[1] * 22, st.t < T ? COL.c1 : COL.c2, 'v', 2.4);
  }
});

/* =========================================================
   D. ANGULAR IMPULSE AND MOMENTUM
   ========================================================= */
// --- pulling a cord through a hole: H_O is constant
makeClip({
  id: 'c-hole', speed: 0.5,
  controls: [
    { key: 'r0', label: 'Starting radius r₀', min: 0.4, max: 1.2, step: 0.05, value: 1, unit: 'm', dec: 2 },
    { key: 'v0', label: 'Starting speed v₀', min: 0.2, max: 3, step: 0.05, value: 1, unit: 'm/s', dec: 2 },
    { key: 'rd', label: 'Pull rate |ṙ|', min: 0.02, max: 0.5, step: 0.01, value: 0.12, unit: 'm/s', dec: 3 },
    { key: 'm', label: 'Mass m', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', dec: 2 }
  ],
  reset(st){ const V = st.V; st.ok = V.r0 > 0 && V.v0 > 0 && V.rd > 0 && V.m > 0; st.th = 0; st.lastT = 0; st.trail = []; st.rmin = 0.3 * V.r0; },
  step(st){
    if (!st.ok) return; const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    const r = Math.max(st.rmin, V.r0 - V.rd * st.t); if (r <= st.rmin + 1e-9 && st.t > (V.r0 - st.rmin) / V.rd + 1.5){ st.t = 0; st.lastT = 0; st.th = 0; st.trail = []; return; }
    const n = 10; for (let i = 0; i < n; i++){ const rr = Math.max(st.rmin, V.r0 - V.rd * (st.t - dt + dt * (i + 0.5) / n)); st.th += V.r0 * V.v0 / (rr * rr) * dt / n; }
    st.r = r; st.trail.push([r * Math.cos(st.th), r * Math.sin(st.th)]); if (st.trail.length > 1500) st.trail.shift();
  },
  draw(st){
    const cv = $('c-hole-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const V = st.V, r = st.r ?? V.r0, wide = w >= 560, sc = Math.min(wide ? w * 0.6 : w, h) * 0.45 / V.r0, ox = wide ? w * 0.32 : w / 2, oy = h / 2;
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.4; ctx.beginPath();
    st.trail.forEach((p, i) => { const x = ox + p[0] * sc, y = oy - p[1] * sc; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
    const px = ox + r * Math.cos(st.th) * sc, py = oy - r * Math.sin(st.th) * sc;
    line(ctx, ox, oy, px, py, COL.fg, 1.8); dot(ctx, ox, oy, 5, COL.fg); txt(ctx, 'O (hole)', ox - 8, oy + 18, { font: '12px system-ui', color: COL.muted });
    const vth = V.r0 * V.v0 / r, u = [Math.cos(st.th), Math.sin(st.th)];
    arrowL(ctx, px, py, -u[1] * vth * 18, -u[0] * vth * 18, COL.c2, 'v_θ', 2.4);
    if (r > st.rmin + 1e-6) arrowL(ctx, px, py, -u[0] * (18 + V.rd * 120), u[1] * (18 + V.rd * 120), COL.c4, 'v_r', 2);   // drawn long enough that its label clears the ball
    dot(ctx, px, py, 9, COL.c1);
    // gauges
    const gx = w * 0.66, gw = w * 0.3;
    const H = V.m * r * vth, T = V.m * vth * vth / r;
    if (w >= 560) [['r (m)', r, V.r0, COL.c1], ['speed v_θ (m/s)', vth, V.r0 * V.v0 / st.rmin, COL.c2], ['H_O = m r v_θ', H, H * 1.2, COL.c3]].forEach(([lab, val, mx, col], i) => {
      const y0 = 40 + i * 58; ctx.save(); ctx.fillStyle = COL.grid; ctx.fillRect(gx, y0, gw, 16); ctx.fillStyle = col; ctx.fillRect(gx, y0, gw * clamp(val / mx, 0, 1), 16); ctx.restore();
      txt(ctx, `${lab} = ${fmt(val, 3)}`, gx, y0 + 30, { font: '12px system-ui', align: 'left' }); });
    statsEvery(st, 'c-hole-stats', () => [['H_O = m r v_θ', fmt(H, 4) + ' kg·m²/s (constant)', true], ['speed v_θ = r₀v₀ / r', fmt(vth, 4) + ' m/s', true], ['cord tension ≈ m v_θ² / r', fmt(T, 3) + ' N'], ['kinetic energy', fmt(0.5 * V.m * (vth * vth + V.rd ** 2), 3) + ' J (grows: the pull does work)']]);
  }
});

// --- central-force orbit: equal areas in equal times
makeClip({
  id: 'c-orbit', speed: 1,
  controls: [{ key: 'f', label: 'Launch speed (× circular speed)', min: 0.5, max: 1.35, step: 0.01, value: 1.2, unit: '', dec: 3 }],
  presets: C => [{ label: 'Circle', apply: () => C.set({ f: 1 }) }, { label: 'Ellipse', apply: () => C.set({ f: 1.2 }) }, { label: 'Very eccentric', apply: () => C.set({ f: 0.6 }) }],
  reset(st){ st.s = [1, 0, 0, st.V.f]; st.lastT = 0; st.sectors = []; st.trail = [[1, 0]]; st.seg = 0; st.segIdx = 0; st.ok = st.V.f > 0 && st.V.f < Math.SQRT2; },
  step(st){
    if (!st.ok) return;
    const f = (t, s) => { const r3 = Math.pow(s[0] * s[0] + s[1] * s[1], 1.5); return [s[2], s[3], -s[0] / r3, -s[1] / r3]; };
    const dt = st.t - st.lastT, DT = 0.45;
    [, st.s] = integrate(f, st.lastT, st.s, dt, 0.002); st.lastT = st.t;
    st.trail.push([st.s[0], st.s[1]]); if (st.trail.length > 3000) st.trail.shift();
    const k = Math.floor(st.t / DT);
    if (k > st.seg){ st.sectors.push({ pts: st.trail.slice(st.segIdx) }); st.seg = k; st.segIdx = st.trail.length - 1; }
    if (st.sectors.length > 60) st.sectors.shift();
    if (st.t > 40){ st.t = 0; st.lastT = 0; st.s = [1, 0, 0, st.V.f]; st.sectors = []; st.trail = [[1, 0]]; st.seg = 0; st.segIdx = 0; }
  },
  draw(st){
    const cv = $('c-orbit-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Launch speed must be between 0 and √2 times circular (otherwise the particle escapes)'); return; }
    const f = st.V.f, a = 1 / (2 - f * f), e = Math.abs(f * f - 1), rp = Math.min(1, a * (1 - e)), ra = Math.max(1, a * (1 + e));
    const xmin = f >= 1 ? -ra : -rp, b = a * Math.sqrt(1 - e * e), sc = Math.min((w - 40) / (1 - xmin), (h - 40) / (2 * b)), cxp = w / 2 - sc * (xmin + 1) / 2, oy = h / 2;
    const P = q => [cxp + q[0] * sc, oy - q[1] * sc];
    st.sectors.forEach((s, i) => { ctx.save(); ctx.fillStyle = i % 2 ? 'rgba(42,127,98,.18)' : 'rgba(194,87,26,.16)'; ctx.beginPath(); ctx.moveTo(...P([0, 0])); s.pts.forEach(p => ctx.lineTo(...P(p))); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.globalAlpha = 0.5; ctx.beginPath(); st.trail.forEach((p, i) => { const q = P(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.stroke(); ctx.restore();
    dot(ctx, ...P([0, 0]), 9, COL.c2); txt(ctx, 'O', P([0, 0])[0], P([0, 0])[1] + 20);
    const p = P([st.s[0], st.s[1]]); line(ctx, ...P([0, 0]), ...p, COL.axis, 1.2, [3, 3]); dot(ctx, p[0], p[1], 7, COL.c1);
    arrowL(ctx, p[0], p[1], st.s[2] * 40, -st.s[3] * 40, COL.c3, 'v', 2.2);
    const r = Math.hypot(st.s[0], st.s[1]), H = st.s[0] * st.s[3] - st.s[1] * st.s[2];
    statsEvery(st, 'c-orbit-stats', () => [['r', fmt(r, 3)], ['speed', fmt(Math.hypot(st.s[2], st.s[3]), 3)], ['H_O / m = r × v', fmt(H, 5) + ' (constant)', true], ['area swept per unit time = H_O / 2m', fmt(H / 2, 4)]]);
  }
});

/* =========================================================
   WORKED-EXAMPLE ANIMATIONS
   ========================================================= */
// Example 4.A.3: crate sliding up a rough incline until it stops
makeClip({
  id: 'e-a3', speed: 0.5,
  controls: [
    { key: 'th', label: 'Incline angle θ', min: 0, max: 60, step: 0.01, value: 36.87, unit: '°', dec: 2 },
    { key: 'v0', label: 'Initial speed v₀', min: 5, max: 60, step: 1, value: 40, unit: 'ft/s', dec: 1 },
    { key: 'mk', label: 'Kinetic μₖ', min: 0, max: 1, step: 0.01, value: 0.25, unit: '', dec: 3 }
  ],
  reset(st){ const V = st.V, th = V.th * RAD; st.ok = V.v0 > 0;
    st.a = -GFT * (Math.sin(th) + V.mk * Math.cos(th)); st.ts = V.v0 / -st.a; st.ss = V.v0 * V.v0 / (2 * -st.a);
    setStats('e-a3-stats', [['a = −g(sin θ + μₖ cos θ)', fmt(st.a, 4) + ' ft/s²'], ['time to stop t = v₀ / |a|', fmt(st.ts, 4) + ' s', true], ['distance up the incline', fmt(st.ss, 4) + ' ft']]); },
  step(st){ if (st.t > st.ts + 1.5) st.t = 0; },
  draw(st){
    const cv = $('e-a3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok || !(st.ts > 0)){ drawMessage(cv, 'Speed must be positive and the crate must decelerate'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '540' : '300'; fitView(ctx, w, h, narrow ? [0, 0, 420, 520] : [0, 0, 800, 300]);
    const V = st.V, th = V.th * RAD, t = Math.min(st.t, st.ts), s = V.v0 * t + 0.5 * st.a * t * t, v = V.v0 + st.a * t;
    const L = 340, x0 = 30, y0 = 270, u = [Math.cos(th), -Math.sin(th)], nrm = [-Math.sin(th), -Math.cos(th)];
    const sc = (L - 90) / st.ss;
    hatch(ctx, x0, y0, x0 + L * u[0], y0 + L * u[1], -1);
    line(ctx, x0, y0, x0 + L, y0, COL.axis, 1, [3, 3]);
    txt(ctx, 'θ', x0 + 50, y0 - 12, { font: 'italic 14px Georgia, serif' });
    const d = 30 + s * sc, cx = x0 + u[0] * d + nrm[0] * 22, cy = y0 + u[1] * d + nrm[1] * 22;
    block(ctx, cx, cy, 44, 44, -th, 'C');
    if (v > 0.01) arrowL(ctx, cx + nrm[0] * 34, cy + nrm[1] * 34, u[0] * (15 + v * 1.2), u[1] * (15 + v * 1.2), COL.c2, 'v', 2.4);
    txt(ctx, v > 0.01 ? `v = ${fmt(v, 3)} ft/s` : `stopped at t = ${fmt(st.ts, 4)} s`, 200, 40, { font: '600 13px system-ui', color: v > 0.01 ? COL.c2 : COL.c3 });
    // FBD
    if (narrow) ctx.translate(-330, 250); else line(ctx, 430, 20, 430, 290, COL.axis, 1);
    const fx = 610, fy = 150; txt(ctx, 'FBD (sliding up)', fx, 22, { font: '600 13px system-ui' });
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-th); block(ctx, 0, 0, 56, 56, 0, 'C'); ctx.restore();
    arrowL(ctx, fx, fy, 0, 80, COL.c1, 'W', 2.6);
    arrowL(ctx, fx - nrm[0] * 88, fy - nrm[1] * 88, nrm[0] * 58, nrm[1] * 58, COL.c5, 'N', 2.6, { dx: -14 });
    arrowL(ctx, fx - nrm[0] * 30 - u[0] * 28, fy - nrm[1] * 30 - u[1] * 28, -u[0] * 60, -u[1] * 60, RED, 'μₖN', 2.6);
    arrowL(ctx, fx + nrm[0] * 50, fy + nrm[1] * 50, u[0] * 50, u[1] * 50, COL.c4, 'motion', 1.6, { font: '12px system-ui' });
    plot($('e-a3-plot'), { xmin: 0, xmax: st.ts * 1.15, ymin: 0, ymax: V.v0 * 1.1, xlabel: 't (s)', ylabel: 'v (ft/s)',
      series: [{ pts: [[0, V.v0], [st.ts, 0], [st.ts * 1.15, 0]], color: COL.c1, width: 2.4 }], points: [{ x: t, y: v, color: COL.c2, r: 5 }], vlines: [{ x: st.ts, color: COL.c3, label: 't stop' }] });
  }
});

// Example 4.A.10: slider pulled inward along a rotating slotted arm (top view)
makeClip({
  id: 'e-a10', speed: 0.5,
  controls: [
    { key: 'W', label: 'Weight W', min: 1, max: 20, step: 0.5, value: 5, unit: 'lb', dec: 2 },
    { key: 'om', label: 'Arm rate ω (CCW)', min: 0.5, max: 8, step: 0.1, value: 5, unit: 'rad/s', dec: 2 },
    { key: 'rd', label: 'Pull rate ṙ', min: -1.5, max: -0.05, step: 0.05, value: -0.5, unit: 'ft/s', dec: 3 }
  ],
  reset(st){ st.ok = st.V.W > 0; st.r0 = 1.5; },
  step(st){ const V = st.V; const r = st.r0 + V.rd * st.t; if (r < 0.2) st.t = 0; },
  draw(st){
    const cv = $('e-a10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Weight must be positive'); return; }
    const V = st.V, m = V.W / GFT, r = st.r0 + V.rd * st.t, th = 0.35 + V.om * st.t * 0.25;  // drawing turns at ¼ speed so the arm stays visible
    const narrow = w < 560, ox = narrow ? w / 2 : w * 0.38, oy = h / 2, sc = Math.min(narrow ? w : w * 0.7, h) * 0.42 / 1.6;
    const u = [Math.cos(th), -Math.sin(th)], e = [-Math.sin(th), -Math.cos(th)];
    // arm with slot
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(-th); ctx.fillStyle = '#e8e0c4'; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 1.5;
    ctx.fillRect(-10, -14, 1.75 * sc + 10, 28); ctx.strokeRect(-10, -14, 1.75 * sc + 10, 28);
    ctx.fillStyle = COL.card; ctx.fillRect(0.12 * sc, -6, 1.58 * sc, 12); ctx.restore();
    txt(ctx, 'A', ox + u[0] * 1.6 * sc + e[0] * 24, oy + u[1] * 1.6 * sc + e[1] * 24, { font: 'italic 13px Georgia, serif', color: COL.muted });
    txt(ctx, 'B', ox + u[0] * 1.6 * sc - e[0] * 24, oy + u[1] * 1.6 * sc - e[1] * 24, { font: 'italic 13px Georgia, serif', color: COL.muted });
    dot(ctx, ox, oy, 6, COL.fg); txt(ctx, 'O', ox - 14, oy + 14);
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, 28, -th + 0.4, -th - 1.4, true); ctx.stroke(); ctx.restore();
    const px = ox + u[0] * r * sc, py = oy + u[1] * r * sc;
    line(ctx, ox, oy, px, py, COL.fg, 1.6);
    const T = m * r * V.om * V.om, N = 2 * m * V.rd * V.om; // T toward O; N along +e_θ (negative → pushes toward −e_θ)
    arrowL(ctx, px, py, -u[0] * (16 + T * 6), -u[1] * (16 + T * 6), COL.c3, 'T', 2.6);
    arrowL(ctx, px, py, e[0] * N * 40, e[1] * N * 40, RED, 'N', 2.6);
    dot(ctx, px, py, 8, COL.c1);
    txt(ctx, 'top view (the arm is drawn turning at ¼ speed)', w / 2, h - 12, { font: '12px system-ui', color: COL.muted });
    statsEvery(st, 'e-a10-stats', () => [['r', fmt(r, 3) + ' ft'], ['a_r = r̈ − rω²', fmt(-r * V.om ** 2, 4) + ' ft/s²'], ['a_θ = rα + 2ṙω', fmt(2 * V.rd * V.om, 4) + ' ft/s²'],
      ['cord tension T = m r ω²', fmt(T, 4) + ' lb', true], ['slot force N = 2mṙω', fmt(N, 4) + ' lb (' + (N < 0 ? 'side A pushes toward B' : 'side B pushes toward A') + ')', true]]);
  }
});

// Example 4.B.2: block slides down a rough incline into a spring
makeClip({
  id: 'e-b2', speed: 0.5,
  controls: [
    { key: 'th', label: 'Incline θ', min: 20, max: 70, step: 0.01, value: 53.13, unit: '°', dec: 2 },
    { key: 'd', label: 'Distance to spring d', min: 0.1, max: 1.5, step: 0.05, value: 0.75, unit: 'm', dec: 2 },
    { key: 'm', label: 'Mass m', min: 1, max: 20, step: 0.5, value: 5, unit: 'kg', dec: 2 },
    { key: 'mk', label: 'Kinetic μₖ', min: 0, max: 0.6, step: 0.01, value: 0.3, unit: '', dec: 3 },
    { key: 'k', label: 'Stiffness k', min: 200, max: 3000, step: 50, value: 1000, unit: 'N/m', dec: 0 }
  ],
  reset(st){ const V = st.V, th = V.th * RAD; st.ok = V.m > 0 && V.k > 0 && V.d >= 0;
    st.Fn = V.m * G * (Math.sin(th) - V.mk * Math.cos(th)); // net driving force (sliding down)
    st.dmax = st.Fn > 0 ? (st.Fn + Math.sqrt(st.Fn ** 2 + 2 * V.k * st.Fn * V.d)) / V.k : 0;
    st.s = 0; st.v = 0; st.lastT = 0; st.phase = 0; st.peak = 0;
    setStats('e-b2-stats', st.Fn > 0 ? [['mg(sin θ − μₖ cos θ)', fmt(st.Fn, 4) + ' N'], ['maximum compression δ', fmt(st.dmax, 4) + ' m', true], ['speed when it reaches the spring', fmt(Math.sqrt(2 * st.Fn * V.d / V.m), 4) + ' m/s']] : [['The block', 'does not slide: friction is strong enough to hold it']]); },
  step(st){
    if (!st.ok || st.Fn <= 0) return; const V = st.V, th = V.th * RAD, n = 30, hh = (st.t - st.lastT) / n; st.lastT = st.t;
    if (st.phase === 1){ if (st.t > st.tStop + 1.5){ st.t = 0; st.lastT = 0; st.s = 0; st.v = 0; st.phase = 0; } return; }
    for (let i = 0; i < n; i++){
      const comp = Math.max(0, st.s - V.d), a = (V.m * G * Math.sin(th) - V.mk * V.m * G * Math.cos(th) - V.k * comp) / V.m;
      st.v += a * hh; st.s += st.v * hh; if (st.v <= 0){ st.v = 0; st.phase = 1; st.tStop = st.t; st.peak = st.s - V.d; break; }
    }
  },
  draw(st){
    const cv = $('e-b2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Mass and stiffness must be positive'); return; }
    fitView(ctx, w, h, [0, 0, 560, 330]);
    const V = st.V, th = V.th * RAD, u = [Math.cos(th), Math.sin(th)], nrm = [Math.sin(th), -Math.cos(th)];
    const Ltot = V.d + 0.45, sc = Math.min(330, 250 / Math.sin(th)) / Ltot, A = [60, 300 - (Ltot * sc + 40) * u[1]];
    const at = s => [A[0] + (20 + s * sc) * u[0], A[1] + (20 + s * sc) * u[1]];
    const end = at(Ltot); hatch(ctx, A[0], A[1], end[0] + u[0] * 20, end[1] + u[1] * 20, 1);
    const wall = at(V.d + 0.35);
    line(ctx, wall[0] + nrm[0] * 4, wall[1] + nrm[1] * 4, wall[0] + nrm[0] * 60, wall[1] + nrm[1] * 60, COL.fg, 4);
    const comp = Math.max(0, st.s - V.d), sp0 = at(V.d + comp);
    springLine(ctx, wall[0] + nrm[0] * 24, wall[1] + nrm[1] * 24, sp0[0] + nrm[0] * 24, sp0[1] + nrm[1] * 24, 8, 8);
    const c = at(st.s); const bc = [c[0] - u[0] * 20 + nrm[0] * 22, c[1] - u[1] * 20 + nrm[1] * 22];
    block(ctx, bc[0], bc[1], 40, 44, th, 'm');
    if (st.peak > 0){ const pk = at(V.d + st.peak); line(ctx, pk[0] + nrm[0] * 4, pk[1] + nrm[1] * 4, pk[0] + nrm[0] * 50, pk[1] + nrm[1] * 50, COL.c3, 2, [3, 3]); }
    const s0 = at(0), s1 = at(V.d); line(ctx, s0[0] - nrm[0] * 14, s0[1] - nrm[1] * 14, s1[0] - nrm[0] * 14, s1[1] - nrm[1] * 14, COL.axis, 1, [3, 3]);
    txt(ctx, 'd', (s0[0] + s1[0]) / 2 - nrm[0] * 26, (s0[1] + s1[1]) / 2 - nrm[1] * 26);
    txt(ctx, st.phase ? `maximum compression δ = ${fmt(st.peak, 4)} m` : `v = ${fmt(st.v, 3)} m/s`, 400, 40, { font: '600 13px system-ui', color: st.phase ? COL.c3 : COL.c2 });
  }
});

// Example 4.B.4: car with a bumper spring hits a wall
makeClip({
  id: 'e-b4', speed: 0.25,
  controls: [
    { key: 'W', label: 'Weight mg', min: 500, max: 6000, step: 100, value: 3200, unit: 'lb', dec: 0 },
    { key: 'v0', label: 'Speed v₀', min: 2, max: 20, step: 0.5, value: 10, unit: 'ft/s', dec: 2 },
    { key: 'k', label: 'Spring k', min: 5000, max: 120000, step: 500, value: 39752, unit: 'lb/ft', dec: 0 }
  ],
  presets: C => [{ label: 'Answer: k ≈ 39,750 lb/ft', apply: () => C.set({ k: 39752 }) }, { label: 'Softer spring', apply: () => C.set({ k: 15000 }) }],
  reset(st){ const V = st.V, m = V.W / GFT; st.ok = V.W > 0 && V.k > 0;
    st.dmax = V.v0 * Math.sqrt(m / V.k); st.wn = Math.sqrt(V.k / m); st.tc = 0.6 / V.v0;
    setStats('e-b4-stats', [['m = W / g', fmt(m, 4) + ' slug'], ['½mv₀² = ½kΔ²  ⇒  Δ = v₀√(m/k)', fmt(st.dmax * 12, 4) + ' in', true], ['target', '6 in'], ['peak spring force kΔ', fmt(V.k * st.dmax, 4) + ' lb']]); },
  step(st){ if (st.t > st.tc + Math.PI / st.wn + 0.6 / st.V.v0) st.t = 0; },
  draw(st){
    const cv = $('e-b4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '400' : '240'; fitView(ctx, w, h, narrow ? [180, 0, 600, 380] : [0, 0, 760, 230]);
    const V = st.V, m = V.W / GFT, t = st.t, L0 = 120, sc = Math.min(280, 0.8 * L0 / st.dmax); // px per ft
    let x, v, comp;
    if (t < st.tc){ x = -0.6 + V.v0 * t; v = V.v0; comp = 0; }
    else if (t < st.tc + Math.PI / st.wn){ const s = t - st.tc; comp = st.dmax * Math.sin(st.wn * s); v = V.v0 * Math.cos(st.wn * s); x = comp; }
    else { const s = t - st.tc - Math.PI / st.wn; comp = 0; v = -V.v0; x = -V.v0 * s; }
    const wallX = 560;
    // spring tip touches the wall when x >= 0; car front = wallX - L0 + x*sc, spring length = L0 − comp*sc
    const carFront = wallX - L0 + x * sc, yb = 160;
    ctx.save(); ctx.fillStyle = '#e6dfca'; ctx.fillRect(wallX, 60, 20, 110); ctx.restore(); hatch(ctx, wallX, 60, wallX, 170, -1);
    hatch(ctx, 20, yb + 10, wallX, yb + 10, 1);
    block(ctx, carFront - 70, yb - 30, 140, 60, 0, 'C'); wheels(ctx, carFront - 70, yb, 140);
    springLine(ctx, carFront, yb - 30, Math.min(wallX, carFront + L0), yb - 30, 8, 9);
    arrowL(ctx, carFront - 70, yb - 80, v * 6, 0, COL.c2, '', 2.4); txt(ctx, `v = ${fmt(v, 3)} ft/s`, carFront - 70, yb - 98, { font: '12px system-ui', color: COL.c2 });
    if (comp > 0) txt(ctx, `spring compression ${fmt(comp * 12, 3)} in`, 380, 30, { font: '600 13px system-ui', color: COL.c3 });
    const T = 0.5 * m * v * v, Vs = 0.5 * V.k * comp * comp, E = 0.5 * m * V.v0 ** 2;
    if (narrow) ctx.translate(-260, 210);
    bars(ctx, 620, 50, 130, 110, [['½mv²', T, COL.c1], ['½kδ²', Vs, COL.c3]], E * 1.05, 'Energy');
  }
});

// Example 4.C.7: two cars collide at an intersection and stick
makeClip({
  id: 'e-c7', speed: 0.5,
  controls: [
    { key: 'WA', label: 'Weight of A', min: 1000, max: 6000, step: 100, value: 3000, unit: 'lb', dec: 0 },
    { key: 'WB', label: 'Weight of B', min: 1000, max: 6000, step: 100, value: 4000, unit: 'lb', dec: 0 },
    { key: 'vA', label: 'v_A1 (north, +y)', min: 5, max: 80, step: 1, value: 40, unit: 'mph', dec: 1 },
    { key: 'vB', label: 'v_B1 (west, −x)', min: 5, max: 80, step: 1, value: 25, unit: 'mph', dec: 1 }
  ],
  reset(st){ const V = st.V, M = V.WA + V.WB; st.ok = V.WA > 0 && V.WB > 0 && V.vA > 0 && V.vB > 0;
    st.vx = -V.WB * V.vB / M; st.vy = V.WA * V.vA / M; st.tc = 1.6;
    setStats('e-c7-stats', [['v_x = −W_B v_B1 / (W_A + W_B)', `${fmt(st.vx, 4)} mph = ${fmt(st.vx * 22 / 15, 4)} ft/s`, true], ['v_y = W_A v_A1 / (W_A + W_B)', `${fmt(st.vy, 4)} mph = ${fmt(st.vy * 22 / 15, 4)} ft/s`, true], ['speed after', fmt(Math.hypot(st.vx, st.vy), 4) + ' mph'], ['direction', fmt(Math.atan2(st.vy, -st.vx) / RAD, 4) + '° north of west']]); },
  step(st){ if (st.t > st.tc + 2) st.t = 0; },
  draw(st){
    const cv = $('e-c7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const V = st.V, ox = w * 0.45, oy = h * 0.55, sc = Math.min(w, h) / 70 / 1.6; // px per (mph·s)
    ctx.save(); ctx.fillStyle = '#e9e5da'; ctx.fillRect(ox - 34, 0, 68, h); ctx.fillRect(0, oy - 34, w, 68); ctx.restore();
    line(ctx, ox, 0, ox, h, '#fff', 2, [10, 10]); line(ctx, 0, oy, w, oy, '#fff', 2, [10, 10]);
    const t = st.t, tc = st.tc;
    let A, B, both = t >= tc;
    if (!both){ A = [0, -V.vA * (tc - t)]; B = [V.vB * (tc - t), 0]; } else { A = [st.vx * (t - tc), st.vy * (t - tc)]; B = A; }
    const P = q => [ox + q[0] * sc * 1.5, oy - q[1] * sc * 1.5];
    const pa = P(A), pb = P(B);
    if (!both){
      block(ctx, pa[0], pa[1] + 22, 30, 50, 0, 'A'); block(ctx, pb[0] + 30, pb[1], 56, 30, 0, 'B', '#d9cfae');
      arrowL(ctx, pa[0] + 26, pa[1] + 22, 0, -V.vA * 1.2, COL.c1, 'v_A1', 2.4); arrowL(ctx, pb[0] + 30, pb[1] - 24, -V.vB * 1.2, 0, COL.c2, 'v_B1', 2.4);
    } else {
      block(ctx, pa[0], pa[1] + 22, 30, 50, 0, 'A'); block(ctx, pa[0] + 30, pa[1], 56, 30, 0, 'B', '#d9cfae');
      arrowL(ctx, pa[0], pa[1], st.vx * 1.2 * 1.5, -st.vy * 1.2 * 1.5, COL.c3, 'v', 2.8);
    }
    // momentum vector diagram
    const mx = w - 120, my = h - 40, ps = 60 / Math.max(V.WA * V.vA, V.WB * V.vB);
    txt(ctx, 'momentum (W·v)', mx, 20, { font: '600 12px system-ui' });
    arrowL(ctx, mx, my, 0, -V.WA * V.vA * ps, COL.c1, '', 2.4); arrowL(ctx, mx, my - V.WA * V.vA * ps, -V.WB * V.vB * ps, 0, COL.c2, '', 2.4);
    arrowL(ctx, mx, my, -V.WB * V.vB * ps, -V.WA * V.vA * ps, COL.c3, '', 3);
    txt(ctx, 'A + B = total', mx, my + 16, { font: '11px system-ui', color: COL.muted });
  }
});

// Example 4.C.10: block B stops after the impact
makeImpactClip('e-c10', { mA: 2, mB: 3, vA: 1.5, vB: 21 / 11, e: 0.4, vBsign: true, vBlabel: 'Speed of B to the left, v_B1', speed: 0.5,
  presets: C => [{ label: 'Answer: v_B1 = 1.909 m/s', apply: () => C.set({ mA: 2, mB: 3, vA: 1.5, vB: 21 / 11, e: 0.4 }) }, { label: 'v_B1 = 1 m/s', apply: () => C.set({ vB: 1 }) }] });

// Example 4.D.4: rotating arm, sliding particle A and hanging particle B
makeClip({
  id: 'e-d4', speed: 0.5,
  controls: [
    { key: 'm', label: 'Mass of each particle', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'kg', dec: 2 },
    { key: 'R0', label: 'Starting radius R₁', min: 0.3, max: 1.2, step: 0.05, value: 0.8, unit: 'm', dec: 2 },
    { key: 'w0', label: 'Starting rate ω₁', min: 1, max: 10, step: 0.1, value: 6, unit: 'rad/s', dec: 2 }
  ],
  reset(st){ const V = st.V; st.ok = V.m > 0 && V.R0 > 0; st.s = [V.R0, 0]; st.ph = 0; st.lastT = 0; st.hist = []; st.Hm = V.R0 * V.R0 * V.w0; },
  step(st){
    if (!st.ok) return; const V = st.V, Hm = st.Hm;
    // A on the arm (radial), B on the shaft: 2 R'' = R ω² − g with ω = H/(m R²)
    const f = (t, s) => { const om = Hm / (s[0] * s[0]); return [s[1], (s[0] * om * om - G) / 2]; };
    const dt = st.t - st.lastT; [, st.s] = integrate(f, st.lastT, st.s, dt, 0.001); st.lastT = st.t;
    st.ph += Hm / (st.s[0] ** 2) * dt; st.hist.push([st.t, st.s[0]]);
    if (st.t > 4 || st.s[0] > 2.2 || st.s[0] < 0.1){ st.t = 0; st.lastT = 0; st.s = [V.R0, 0]; st.ph = 0; st.hist = []; }
  },
  draw(st){
    const cv = $('e-d4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '520' : '360'; fitView(ctx, w, h, narrow ? [0, 0, 420, 560] : [0, 0, 640, 360]);
    const V = st.V, R = st.s[0], sc = narrow ? 75 : 120, ox = narrow ? 205 : 120, oy = 90, om = st.Hm / (R * R);
    ctx.save(); ctx.fillStyle = '#e4ddc6'; ctx.fillRect(ox - 9, 20, 18, 320); ctx.restore();
    hatch(ctx, ox - 30, 20, ox + 30, 20, -1); hatch(ctx, ox - 30, 340, ox + 30, 340, 1);
    const cosp = Math.cos(st.ph); // side view: the arm's apparent length changes as it turns
    line(ctx, ox, oy, ox + 2.3 * sc * cosp, oy, COL.fg, 6);
    pulley(ctx, ox, oy, 9);
    const ax = ox + R * sc * cosp; block(ctx, ax, oy, 28, 24, 0, 'A');
    const zB = clamp(oy + 170 - (R - V.R0) * sc, oy + 40, 320);
    line(ctx, ox, oy, ax, oy, COL.fg, 1.5);
    line(ctx, ox - 9, oy, ox - 9, zB - 14, COL.fg, 1.5); block(ctx, ox, zB, 30, 28, 0, 'B');
    txt(ctx, 'O', ox - 24, oy - 12); txt(ctx, 'C', ox + 2.3 * sc * cosp + 12 * Math.sign(cosp || 1), oy - 12);
    txt(ctx, 'side view: the arm spins about the vertical shaft', narrow ? 230 : 330, narrow ? 365 : 340, { font: '12px system-ui', color: COL.muted });
    // top-view inset
    const ix = narrow ? 300 : 470, iy = narrow ? 440 : 120, ir = 70 / 2.3;
    ctx.save(); ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.arc(ix, iy, 2.3 * ir, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, ix, iy, ix + 2.3 * ir * Math.cos(st.ph), iy - 2.3 * ir * Math.sin(st.ph), COL.fg, 3);
    dot(ctx, ix + R * ir * Math.cos(st.ph), iy - R * ir * Math.sin(st.ph), 6, COL.c1); dot(ctx, ix, iy, 4, COL.fg);
    txt(ctx, 'top view', ix, iy + 2.3 * ir + 16, { font: '12px system-ui', color: COL.muted });
    plot($('e-d4-plot'), { xmin: 0, xmax: 4, ymin: 0, ymax: 2.2, xlabel: 't (s)', ylabel: 'R (m)', hlines: [{ y: 1.2, color: COL.c3 }], series: [{ pts: st.hist, color: COL.c1, width: 2.4 }] });
    const R2 = 1.2, om2 = st.Hm / (R2 * R2), E1 = 0.5 * V.m * (V.R0 * V.w0) ** 2, E2rot = 0.5 * V.m * (R2 * om2) ** 2, vB2 = Math.sqrt(Math.max(0, (E1 - E2rot - V.m * G * (R2 - V.R0)) / V.m));
    statsEvery(st, 'e-d4-stats', () => [['R now', fmt(R, 3) + ' m'], ['ω now = R₁²ω₁ / R²', fmt(om, 4) + ' rad/s'], ['H about the shaft / m = R²ω', fmt(R * R * om, 4) + ' (constant)'],
      ['at R = 1.2 m: ω', fmt(om2, 4) + ' rad/s', true], ['at R = 1.2 m: speed of B', fmt(vB2, 4) + ' m/s', true]]);
  }
});

// Example 4.D.7: particle on a cord through a hole, elliptical path
makeClip({
  id: 'e-d7', speed: 0.25,
  controls: [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'kg', dec: 2 },
    { key: 'vA', label: 'Speed at A, v_A', min: 2, max: 20, step: 0.5, value: 10, unit: 'm/s', dec: 2 }
  ],
  reset(st){ const V = st.V; st.ok = V.m > 0 && V.vA > 0; st.om = V.vA / 6; st.trail = []; },
  step(st){ if (st.t > 2 * Math.PI / st.om) { st.t = 0; } },
  draw(st){
    const cv = $('e-d7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    const V = st.V, om = st.om, t = st.t, wide = w >= 560, sc = Math.min((wide ? w * 0.55 : w) / 7.4, h / 13.4), ox = wide ? w * 0.32 : w / 2, oy = h / 2;
    const P = (x, y) => [ox + x * sc, oy - y * sc];
    ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(ox, oy, 3 * sc, 6 * sc, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, ox - 4 * sc, oy, ox + 4 * sc, oy, COL.grid, 1); line(ctx, ox, oy - 6.6 * sc, ox, oy + 6.6 * sc, COL.grid, 1);
    const x = 3 * Math.cos(om * t), y = 6 * Math.sin(om * t), vx = -3 * om * Math.sin(om * t), vy = 6 * om * Math.cos(om * t);
    const [px, py] = P(x, y);
    dot(ctx, ...P(3, 0), 4, COL.muted); txt(ctx, 'A', ...P(3.5, -0.4)); dot(ctx, ...P(0, 6), 4, COL.muted); txt(ctx, 'B', ...P(0.5, 6.4));
    line(ctx, ox, oy, px, py, COL.fg, 1.6); dot(ctx, ox, oy, 5, COL.fg); txt(ctx, 'O', ox - 12, oy + 14);
    const r = Math.hypot(x, y), T = V.m * om * om * r;
    arrowL(ctx, px, py, -x / r * (14 + T * 1.2), y / r * (14 + T * 1.2), COL.c3, 'T', 2.6);
    arrowL(ctx, px, py, vx * 4, -vy * 4, COL.c2, 'v', 2.2);
    dot(ctx, px, py, 8, COL.c1);
    const H = V.m * (x * vy - y * vx);
    const gx = w * 0.62; if (wide) txt(ctx, 'Along the path', gx, 26, { font: '600 12px system-ui', align: 'left' });
    if (wide) [['speed', Math.hypot(vx, vy), 'm/s'], ['r', r, 'm'], ['H_O = m (r × v)', H, 'kg·m²/s'], ['cord force T', T, 'N']].forEach(([l, v, u], i) => txt(ctx, `${l} = ${fmt(v, 4)} ${u}`, gx, 52 + i * 22, { font: '13px system-ui', align: 'left', color: i === 2 ? COL.c3 : COL.fg }));
    statsEvery(st, 'e-d7-stats', () => [['H_O now', fmt(H, 4) + ' kg·m²/s (constant)'], ['cord force now', fmt(T, 4) + ' N'], ['v_B = r_A v_A / r_B', fmt(3 * V.vA / 6, 4) + ' m/s', true], ['radius of curvature at B, ρ = a²/b', '1.5 m'], ['T at B = m v_B² / ρ', fmt(V.m * (V.vA / 2) ** 2 / 1.5, 4) + ' N', true]]);
  }
});
