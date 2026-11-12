/* =========================================================
   Chapter 0 animations: vectors, free-body diagrams, scalar kinematics
   ========================================================= */
const RAD = Math.PI / 180;
const v2 = (m, deg) => [m * Math.cos(deg * RAD), m * Math.sin(deg * RAD)];
const f2 = (v, d = 3) => `(${fmt(v[0], d)}, ${fmt(v[1], d)})`;
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-12 ? 0 : x, d)).join(', ')})`;
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => Math.hypot(...a);

/* Clips whose only input is a slider would otherwise sit still. These sweep one slider smoothly back and forth so the
   figure moves on its own; touching a slider or a value preset stops the sweep there, and the "↻ Animate" chip restarts it. */
const SWEEP = { 'c-add': ['ba', 20, 170], 'c-dot': ['th', 5, 175], 'c-moment': ['al', 60, 240], 'c-basis': ['th', -40, 95] };
{
  const mk0 = makeClip;
  makeClip = function(cfg){
    const sw = SWEEP[cfg.id]; if (!sw) return mk0(cfg);
    const [key, lo, hi] = sw, mid = (lo + hi) / 2, amp = (hi - lo) / 2;
    const presets0 = cfg.presets, setup0 = cfg.setup, step0 = cfg.step, reset0 = cfg.reset;
    cfg.presets = (C, st, reset) => {
      st._C = C;
      const base = (presets0 ? presets0(C, st, reset) : []).map(p => ({ ...p, apply: () => {
        const before = JSON.stringify(st.V); st.own = true; p.apply(); st.own = false;
        if (JSON.stringify(st.V) !== before){ st.sweep = false; reset(); } } }));   // a value preset stops the sweep; a mode chip does not
      return [{ label: '↻ Animate', apply: () => { st.sweep = true; st.ts = Math.asin(Math.max(-1, Math.min(1, ((st.V[key] ?? mid) - mid) / amp))) / 0.5; } }, ...base];
    };
    cfg.setup = (st, reset) => { st.sweep = true; st.ts = Math.asin(Math.max(-1, Math.min(1, (cfg.controls.find(c => c.key === key).value - mid) / amp))) / 0.5; setup0 && setup0(st, reset); };
    cfg.step = (st, dt) => {
      step0 && step0(st, dt);
      if (st.sweep && st._C){ st.ts += dt; st.own = true; st._C.set({ [key]: +(mid + amp * Math.sin(0.5 * st.ts)).toFixed(2) }); st.own = false; }
    };
    cfg.reset = st => { if (st.ready && !st.own) st.sweep = false; st.ready = true; reset0 && reset0(st); };
    return mk0(cfg);
  };
}

// a 2D "graph paper" view: returns a mapper from world units to canvas pixels
function grid2D(ctx, w, h, span, opts = {}){
  const s = Math.min(w, h) / (2 * span), cx = opts.cx ?? w / 2, cy = opts.cy ?? h / 2;
  const P = (x, y) => [cx + x * s, cy - y * s];
  ctx.save(); ctx.lineWidth = 1;
  for (let i = -Math.ceil(w / s); i <= Math.ceil(w / s); i++){
    ctx.strokeStyle = i === 0 ? COL.axis : COL.grid;
    const [x] = P(i, 0); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let j = -Math.ceil(h / s); j <= Math.ceil(h / s); j++){
    ctx.strokeStyle = j === 0 ? COL.axis : COL.grid;
    const [, y] = P(0, j); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
  return { P, s };
}
function vecArrow(ctx, P, from, to, col, label, wd = 3, dash){
  const [x1, y1] = P(...from), [x2, y2] = P(...to);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  if (dash){ ctx.save(); ctx.setLineDash(dash); }
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (dash) ctx.restore();
  if (label){
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny) || 1;
    txt(ctx, label, mx + nx / L * 14, my + ny / L * 14, { color: col, font: 'italic 15px Georgia, serif' });
  }
}
// simple 3D projection with a slowly turning camera
function proj3(cx, cy, s, az, el = 22 * RAD){
  return p => { const u = p[0] * Math.cos(az) - p[1] * Math.sin(az), wv = p[0] * Math.sin(az) + p[1] * Math.cos(az);
    return [cx + s * u, cy - s * (p[2] * Math.cos(el) + wv * Math.sin(el))]; };
}
function axes3(ctx, Pj, L){
  [['x', [L, 0, 0]], ['y', [0, L, 0]], ['z', [0, 0, L]]].forEach(([n, e]) => {
    const [x1, y1] = Pj([0, 0, 0]), [x2, y2] = Pj(e);
    line(ctx, x1, y1, x2, y2, COL.axis, 1.2, [4, 3]);
    txt(ctx, n, x2 + (x2 - x1) * 0.06, y2 + (y2 - y1) * 0.06, { font: 'italic 13px Georgia, serif', color: COL.muted });
  });
}
function arrow3(ctx, Pj, a, b, col, label, wd = 3){
  const [x1, y1] = Pj(a), [x2, y2] = Pj(b);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label) txt(ctx, label, x2 + 10, y2 - 8, { color: col, font: 'italic 15px Georgia, serif', align: 'left' });
}
function chips(id, items, st, reset, key){
  return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } }));
}
function markChips(id, st, key, items){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', items[i] && items[i][1] === st[key]));
}

/* =========================================================
   A. VECTORS
   ========================================================= */
// --- parallelogram rule
(function(){
  const MODES = [['a + b', 'add'], ['a − b', 'sub']];
  makeClip({
    id: 'c-add', buttons: false,
    controls: [
      { key: 'am', label: '|a|', min: 0.5, max: 5, step: 0.1, value: 3, unit: '', dec: 2 },
      { key: 'aa', label: 'angle of a', min: -180, max: 180, step: 1, value: 15, unit: '°', dec: 1 },
      { key: 'bm', label: '|b|', min: 0.5, max: 5, step: 0.1, value: 2.2, unit: '', dec: 2 },
      { key: 'ba', label: 'angle of b', min: -180, max: 180, step: 1, value: 80, unit: '°', dec: 1 }
    ],
    presets: (C, st, reset) => chips('c-add', MODES, st, reset, 'mode'),
    setup(st){ st.mode = 'add'; },
    reset(st){
      markChips('c-add', st, 'mode', MODES);
      const a = v2(st.V.am, st.V.aa), b = v2(st.V.bm, st.V.ba), r = st.mode === 'add' ? [a[0] + b[0], a[1] + b[1]] : [a[0] - b[0], a[1] - b[1]];
      setStats('c-add-stats', [['a', f2(a)], ['b', f2(b)], [st.mode === 'add' ? 'a + b' : 'a − b', f2(r), true], ['magnitude', fmt(Math.hypot(...r)), true]]);
    },
    draw(st){
      const cv = $('c-add-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const a = v2(st.V.am, st.V.aa), b = v2(st.V.bm, st.V.ba), o = [0, 0];
      const bb = st.mode === 'add' ? b : [-b[0], -b[1]], r = [a[0] + bb[0], a[1] + bb[1]];
      const ext = Math.max(2, ...[a, b, bb, r].flatMap(q => [Math.abs(q[0]) * h / w, Math.abs(q[1])]));
      const { P } = grid2D(ctx, w, h, ext * 1.2);
      ctx.save(); ctx.fillStyle = 'rgba(42,127,98,.08)'; ctx.beginPath();
      [o, a, r, bb].forEach((p, i) => { const q = P(...p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.closePath(); ctx.fill(); ctx.restore();
      vecArrow(ctx, P, bb, r, COL.c5, '', 1.5, [4, 4]); vecArrow(ctx, P, o, bb, COL.c5, '', 1.5, [4, 4]);
      if (st.mode === 'sub') vecArrow(ctx, P, o, b, COL.c2, 'b', 2, [2, 3]);
      vecArrow(ctx, P, o, a, COL.c1, 'a');
      vecArrow(ctx, P, a, r, COL.c2, st.mode === 'add' ? 'b' : '−b');
      vecArrow(ctx, P, o, r, COL.c3, st.mode === 'add' ? 'a + b' : 'a − b', 3.5);
    }
  });
})();

// --- dot product as a projection
makeClip({
  id: 'c-dot', buttons: false,
  controls: [
    { key: 'am', label: '|a|', min: 1, max: 5, step: 0.1, value: 4, unit: '', dec: 2 },
    { key: 'bm', label: '|b|', min: 0.5, max: 5, step: 0.1, value: 3, unit: '', dec: 2 },
    { key: 'th', label: 'angle θ between them', min: 0, max: 180, step: 1, value: 50, unit: '°', dec: 1 }
  ],
  presets: C => [{ label: 'θ = 30°', apply: () => C.set({ th: 30 }) }, { label: 'θ = 90°', apply: () => C.set({ th: 90 }) }, { label: 'θ = 150°', apply: () => C.set({ th: 150 }) }],
  reset(st){
    const a = [st.V.am, 0], b = v2(st.V.bm, st.V.th), d = a[0] * b[0] + a[1] * b[1];
    setStats('c-dot-stats', [['|a||b| cos θ', fmt(d), true], ['aₓbₓ + a_yb_y', fmt(d)], ['projection of b onto a', fmt(st.V.bm * Math.cos(st.V.th * RAD)), true],
      ['sign', Math.abs(d) < 1e-9 ? 'zero: perpendicular' : d > 0 ? 'positive: θ < 90°' : 'negative: θ > 90°']]);
  },
  draw(st){
    const cv = $('c-dot-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const { P } = grid2D(ctx, w, h, Math.max(st.V.am, st.V.bm, 1.5) * 0.85, { cx: w / 2, cy: h * 0.62 });
    const a = [st.V.am, 0], b = v2(st.V.bm, st.V.th), pr = st.V.bm * Math.cos(st.V.th * RAD);
    vecArrow(ctx, P, [Math.min(0, pr), 0], [Math.max(0, pr), 0], pr >= 0 ? COL.c3 : '#a61e4d', '', 8);
    const [fx, fy] = P(pr, 0), [bx, by] = P(...b); line(ctx, bx, by, fx, fy, COL.muted, 1.4, [4, 3]);
    vecArrow(ctx, P, [0, 0], a, COL.c1, 'a'); vecArrow(ctx, P, [0, 0], b, COL.c2, 'b');
    if (pr < 0) line(ctx, P(0, 0)[0], P(0, 0)[1], P(pr, 0)[0], P(pr, 0)[1], COL.axis, 1, [2, 3]);
    const [ox, oy] = P(0, 0); ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, oy, 26, -st.V.th * RAD, 0); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', ox + 34 * Math.cos(st.V.th * RAD / 2), oy - 34 * Math.sin(st.V.th * RAD / 2), { color: COL.muted });
    txt(ctx, `projection = |b| cos θ = ${fmt(pr)}`, fx, fy + 40, { font: '12px system-ui', color: pr >= 0 ? COL.c3 : '#a61e4d' });
  }
});

// --- cross product in 3D
(function(){
  const ORD = [['a × b', 'ab'], ['b × a', 'ba']];
  makeClip({
    id: 'c-cross', speed: 1,
    controls: [
      { key: 'am', label: '|a|', min: 0.5, max: 3, step: 0.1, value: 2.5, unit: '', dec: 2 },
      { key: 'bm', label: '|b|', min: 0.5, max: 3, step: 0.1, value: 2, unit: '', dec: 2 },
      { key: 'th', label: 'angle θ from a to b', min: 0, max: 180, step: 1, value: 60, unit: '°', dec: 1 }
    ],
    presets: (C, st, reset) => chips('c-cross', ORD, st, reset, 'ord'),
    setup(st){ st.ord = 'ab'; },
    reset(st){
      markChips('c-cross', st, 'ord', ORD);
      const a = [st.V.am, 0, 0], b = [st.V.bm * Math.cos(st.V.th * RAD), st.V.bm * Math.sin(st.V.th * RAD), 0];
      const c = st.ord === 'ab' ? cross3(a, b) : cross3(b, a);
      setStats('c-cross-stats', [[st.ord === 'ab' ? 'a × b' : 'b × a', f3(c), true], ['|a||b| sin θ', fmt(st.V.am * st.V.bm * Math.sin(st.V.th * RAD)), true],
        ['= area of the parallelogram', 'yes'], ['direction', Math.abs(c[2]) < 1e-9 ? 'none (parallel vectors)' : c[2] > 0 ? '+z (right-hand rule)' : '−z']]);
    },
    draw(st){
      const cv = $('c-cross-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const Lx = Math.max(st.V.am, st.V.bm) + 0.5;
      const Pj = proj3(w / 2, h * 0.62, (h * 0.5) / Lx, -0.6 + 0.35 * st.t, 30 * RAD);
      axes3(ctx, Pj, Lx);
      const a = [st.V.am, 0, 0], b = [st.V.bm * Math.cos(st.V.th * RAD), st.V.bm * Math.sin(st.V.th * RAD), 0];
      const c = st.ord === 'ab' ? cross3(a, b) : cross3(b, a), cs = c.map(x => x * 0.45);
      ctx.save(); ctx.fillStyle = 'rgba(42,127,98,.14)'; ctx.beginPath();
      [[0, 0, 0], a, [a[0] + b[0], a[1] + b[1], 0], b].forEach((p, i) => { const q = Pj(p); if (i) ctx.lineTo(...q); else ctx.moveTo(...q); }); ctx.closePath(); ctx.fill(); ctx.restore();
      arrow3(ctx, Pj, [0, 0, 0], a, COL.c1, 'a'); arrow3(ctx, Pj, [0, 0, 0], b, COL.c2, 'b');
      arrow3(ctx, Pj, [0, 0, 0], cs, COL.c3, st.ord === 'ab' ? 'a × b' : 'b × a', 3.5);
      txt(ctx, 'shaded area = |a × b|   (arrow drawn at 0.45 scale)', w / 2, h - 12, { font: '12px system-ui', color: COL.muted });
    }
  });
})();

// --- moment of a force about a point
makeClip({
  id: 'c-moment', buttons: false,
  controls: [
    { key: 'F', label: 'Force F', min: 0.5, max: 6, step: 0.1, value: 4, unit: 'N', dec: 2 },
    { key: 'al', label: 'direction of F', min: -180, max: 180, step: 1, value: 150, unit: '°', dec: 1 },
    { key: 'px', label: 'P, x position', min: -4, max: 4, step: 0.1, value: 3, unit: 'm', dec: 2 },
    { key: 'py', label: 'P, y position', min: -3, max: 3, step: 0.1, value: 1, unit: 'm', dec: 2 }
  ],
  reset(st){
    const r = [st.V.px, st.V.py, 0], F = [...v2(st.V.F, st.V.al), 0], M = cross3(r, F)[2], d = Math.abs(M) / st.V.F;
    setStats('c-moment-stats', [['M_O = (r × F)·k', fmt(M) + ' N·m', true], ['sense', Math.abs(M) < 1e-9 ? 'none: line of action passes through O' : M > 0 ? 'counterclockwise' : 'clockwise', true],
      ['lever arm d', fmt(d) + ' m'], ['F · d', fmt(st.V.F * d) + ' N·m']]);
  },
  draw(st){
    const cv = $('c-moment-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const ext = Math.max(2.5, Math.abs(st.V.px) * h / w + 1, Math.abs(st.V.py) + 1, st.V.F * 0.5 + 1);
    const { P, s } = grid2D(ctx, w, h, ext * 1.15);
    const p = [st.V.px, st.V.py], F = v2(st.V.F * 0.5, st.V.al), u = v2(1, st.V.al);
    const t = -(p[0] * u[0] + p[1] * u[1]), foot = [p[0] + t * u[0], p[1] + t * u[1]];
    const [l1x, l1y] = P(p[0] - 12 * u[0], p[1] - 12 * u[1]), [l2x, l2y] = P(p[0] + 12 * u[0], p[1] + 12 * u[1]);
    line(ctx, l1x, l1y, l2x, l2y, COL.axis, 1, [6, 4]);
    const [ox, oy] = P(0, 0), [fx, fy] = P(...foot);
    line(ctx, ox, oy, fx, fy, COL.c4, 2); txt(ctx, 'd', (ox + fx) / 2 + 8, (oy + fy) / 2 - 8, { color: COL.c4 });
    vecArrow(ctx, P, [0, 0], p, COL.c1, 'r', 2.5);
    vecArrow(ctx, P, p, [p[0] + F[0], p[1] + F[1]], COL.c2, 'F', 3.5);
    const M = p[0] * F[1] - p[1] * F[0];
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'O', ox - 14, oy + 14);
    if (Math.abs(M) > 1e-6){
      const R = 26 + Math.min(Math.abs(M) * 4, 30), a0 = -0.4, a1 = a0 + 1.6 * Math.PI * Math.min(1, 0.25 + Math.abs(M) / 15);
      ctx.save(); ctx.strokeStyle = '#a61e4d'; ctx.lineWidth = 2.5; ctx.beginPath();
      if (M > 0) ctx.arc(ox, oy, R, -a0, -a1, true); else ctx.arc(ox, oy, R, -a1, -a0, false);
      ctx.stroke(); ctx.restore();
      const ang = M > 0 ? a1 : a0, tip = [ox + R * Math.cos(ang), oy - R * Math.sin(ang)], dir = M > 0 ? 1 : -1;
      arrow(ctx, tip[0] - dir * 8 * -Math.sin(ang), tip[1] - dir * 8 * -Math.cos(ang), tip[0], tip[1], '#a61e4d', 2.5);
      txt(ctx, 'M_O', ox + R + 18, oy - R, { color: '#a61e4d', font: 'italic 14px Georgia, serif' });
    }
  }
});

// --- changing to a rotated set of unit vectors (used by a concept clip and by Example 0.A.2)
function makeBasisClip(id, opts){
  makeClip({
    id, buttons: false,
    controls: [
      { key: 'aX', label: 'a_X (along Î)', min: -5, max: 5, step: 0.1, value: opts.aX, unit: '', dec: 3 },
      { key: 'aY', label: 'a_Y (along Ĵ)', min: -5, max: 5, step: 0.1, value: opts.aY, unit: '', dec: 3 },
      { key: 'th', label: 'rotation θ of the xy axes', min: -180, max: 180, step: 0.01, value: opts.th, unit: '°', dec: 2 }
    ],
    presets: opts.presets,
    reset(st){
      const c = Math.cos(st.V.th * RAD), s = Math.sin(st.V.th * RAD), ax = st.V.aX * c + st.V.aY * s, ay = -st.V.aX * s + st.V.aY * c;
      setStats(id + '-stats', [['a in XY', `${fmt(st.V.aX)} Î + ${fmt(st.V.aY)} Ĵ`], ['aₓ = a·î = a_X cos θ + a_Y sin θ', fmt(ax, 4), true], ['a_y = a·ĵ = −a_X sin θ + a_Y cos θ', fmt(ay, 4), true], ['|a| (unchanged)', fmt(Math.hypot(ax, ay), 4)]]);
    },
    draw(st){
      const cv = $(id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const { P, s: sc } = grid2D(ctx, w, h, Math.max(2, Math.hypot(st.V.aX, st.V.aY)) * 1.25);
      const Ll = (Math.min(w, h) / 2 - 14) / sc;
      const th = st.V.th * RAD, i = [Math.cos(th), Math.sin(th)], j = [-Math.sin(th), Math.cos(th)], a = [st.V.aX, st.V.aY];
      const L = 50; [[i, 'x'], [j, 'y']].forEach(([e, n]) => { const [x1, y1] = P(-L * e[0], -L * e[1]), [x2, y2] = P(L * e[0], L * e[1]); line(ctx, x1, y1, x2, y2, COL.c4, 1.5); const [lx, ly] = P(Ll * e[0], Ll * e[1]); txt(ctx, n, lx + 10 * e[1], ly + 10 * e[0], { color: COL.c4, font: 'italic 15px Georgia, serif' }); });
      vecArrow(ctx, P, [0, 0], i, COL.c4, 'î', 2.5); vecArrow(ctx, P, [0, 0], j, COL.c4, 'ĵ', 2.5);
      const ax = a[0] * i[0] + a[1] * i[1], ay = a[0] * j[0] + a[1] * j[1];
      const pi = [ax * i[0], ax * i[1]], pj = [ay * j[0], ay * j[1]];
      const [Ax, Ay] = P(...a); [pi, pj].forEach(q => { const [qx, qy] = P(...q); line(ctx, Ax, Ay, qx, qy, COL.muted, 1.2, [4, 3]); });
      vecArrow(ctx, P, [0, 0], pi, COL.c3, 'aₓ î', 4); vecArrow(ctx, P, [0, 0], pj, COL.c3, 'a_y ĵ', 4);
      vecArrow(ctx, P, [0, 0], a, COL.c2, 'a', 3.5);
      txt(ctx, 'X, Y: grey grid   x, y: purple axes', w - 10, 14, { font: '12px system-ui', color: COL.muted, align: 'right' });
    }
  });
}
makeBasisClip('c-basis', { aX: 3, aY: 2, th: 25, presets: C => [{ label: 'θ = 0°', apply: () => C.set({ th: 0 }) }, { label: 'θ = 30°', apply: () => C.set({ th: 30 }) }, { label: 'θ = 90°', apply: () => C.set({ th: 90 }) }] });

/* =========================================================
   B. FREE-BODY DIAGRAMS
   ========================================================= */
// --- choose the system: internal vs external forces
(function(){
  const SYS = [['A alone', 'A'], ['B alone', 'B'], ['A + B together', 'AB']];
  makeClip({
    id: 'c-system',
    controls: [
      { key: 'P', label: 'Pull force P', min: 1, max: 30, step: 0.5, value: 12, unit: 'N', dec: 2 },
      { key: 'mA', label: 'Mass of A', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 },
      { key: 'mB', label: 'Mass of B', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'kg', dec: 2 }
    ],
    presets: (C, st, reset) => chips('c-system', SYS, st, reset, 'sys'),
    setup(st){ st.sys = 'A'; },
    reset(st){
      markChips('c-system', st, 'sys', SYS);
      const V = st.V; st.ok = V.mA > 0 && V.mB > 0;
      if (!st.ok) return;
      st.a = V.P / (V.mA + V.mB); st.T = V.mA * st.a;
      const rows = { A: [['Horizontal forces on A', `T = ${fmt(st.T)} N →`]], B: [['Horizontal forces on B', `P = ${fmt(V.P)} N →, T = ${fmt(st.T)} N ←`]], AB: [['Horizontal forces on A + B', `P = ${fmt(V.P)} N → only (T is internal)`]] }[st.sys];
      setStats('c-system-stats', [['Acceleration a = P / (m_A + m_B)', fmt(st.a) + ' m/s²', true], ['Rope tension T = m_A a', fmt(st.T) + ' N', true], ...rows]);
    },
    step(st){ if (st.ok && 0.5 * st.a * st.t * st.t > 2.2) st.t = 0; },
    draw(st){
      const cv = $('c-system-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'Masses must be positive'); return; }
      const nr = w < 560; fitView(ctx, w, h, nr ? [10, 20, 520, 330] : [0, 0, 700, 330]);
      const d = 0.5 * st.a * st.t * st.t * (nr ? 25 : 60), V = st.V;
      hatch(ctx, 20, 120, nr ? 510 : 680, 120, 1);
      const xA = (nr ? 70 : 120) + d, xB = (nr ? 230 : 330) + d;
      block(ctx, xA, 92, 70, 56, 0, 'A'); block(ctx, xB, 92, 90, 56, 0, 'B');
      line(ctx, xA + 35, 92, xB - 45, 92, COL.fg, 2.4);
      const pl = nr ? 25 + V.P : 40 + V.P * 2; arrow(ctx, xB + 45, 92, xB + 45 + pl, 92, COL.c2, 3); txt(ctx, 'P', xB + 55 + pl, 84, { color: COL.c2 });
      const box = { A: [xA - 48, xA + 55], B: [xB - 62, xB + 62], AB: [xA - 48, xB + 62] }[st.sys];
      ctx.save(); ctx.strokeStyle = '#a61e4d'; ctx.setLineDash([7, 5]); ctx.lineWidth = 2; ctx.strokeRect(box[0], 50, box[1] - box[0], 84); ctx.restore();
      txt(ctx, 'cut here', box[0] + 4, 42, { font: '12px system-ui', color: '#a61e4d', align: 'left' });
      // FBD panel
      const cx = nr ? 265 : 350; txt(ctx, 'Free-body diagram of the chosen system', cx, 175, { font: '600 13px system-ui' });
      const bw = st.sys === 'AB' ? 190 : st.sys === 'A' ? 70 : 90;
      block(ctx, cx, 245, bw, 56, 0, st.sys === 'AB' ? 'A + B' : st.sys);
      const W = st.sys === 'A' ? V.mA : st.sys === 'B' ? V.mB : V.mA + V.mB;
      arrow(ctx, cx, 273, cx, 318, COL.c2, 2.5); txt(ctx, `${fmt(W * 9.81, 3)} N (weight)`, cx + 8, 312, { font: '12px system-ui', color: COL.c2, align: 'left' });
      arrow(ctx, cx - bw / 2 + 12, 318, cx - bw / 2 + 12, 273, COL.muted, 2.5); txt(ctx, 'N', cx - bw / 2 + 2, 300, { color: COL.muted, align: 'right' });
      if (st.sys === 'A' || st.sys === 'AB'){ /* no force on A's left */ }
      if (st.sys === 'A'){ arrow(ctx, cx + 35, 245, cx + 115, 245, COL.c3, 3); txt(ctx, 'T', cx + 122, 240, { color: COL.c3, align: 'left' }); }
      if (st.sys === 'B'){ arrow(ctx, cx - 45, 245, cx - 125, 245, COL.c3, 3); txt(ctx, 'T', cx - 132, 240, { color: COL.c3, align: 'right' });
        arrow(ctx, cx + 45, 245, cx + 125, 245, COL.c2, 3); txt(ctx, 'P', cx + 132, 240, { color: COL.c2, align: 'left' }); }
      if (st.sys === 'AB'){ arrow(ctx, cx + 95, 245, cx + 175, 245, COL.c2, 3); txt(ctx, 'P', cx + 182, 240, { color: COL.c2, align: 'left' });
        txt(ctx, 'the rope force T is internal: it does not appear', cx, 200, { font: '12px system-ui', color: COL.muted }); }
    }
  });
})();

// --- static vs kinetic friction
makeClip({
  id: 'c-friction', speed: 1,
  controls: [
    { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 },
    { key: 'ms', label: 'Static μₛ', min: 0.05, max: 1, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'mk', label: 'Kinetic μₖ', min: 0.05, max: 1, step: 0.01, value: 0.35, unit: '', dec: 3 }
  ],
  reset(st){
    const V = st.V; st.ok = V.m > 0 && V.ms > 0 && V.mk > 0;
    st.N = V.m * 9.81; st.Pmax = 1.6 * V.ms * st.N; st.T = 8; st.x = 0; st.v = 0; st.slip = false; st.hist = []; st.lastT = 0;
    const notes = []; if (V.mk > V.ms) notes.push({ level: 'warn', html: 'Usually μₖ ≤ μₛ: once something is sliding, it takes <em>less</em> force to keep it sliding than it took to start it.' });
    showNotes('c-friction-notes', notes);
  },
  step(st){
    if (!st.ok) return;
    if (st.t > st.T + 1){ st.t = 0; st.x = 0; st.v = 0; st.slip = false; st.hist = []; st.lastT = 0; return; }
    const V = st.V, t = Math.min(st.t, st.T), dt = t - st.lastT; st.lastT = t;
    const P = st.Pmax * t / st.T;
    let f;
    if (!st.slip){ if (P <= V.ms * st.N){ f = P; } else { st.slip = true; f = V.mk * st.N; } }
    else f = V.mk * st.N;
    if (st.slip){ st.v += (P - f) / V.m * dt; st.x += st.v * dt; }
    st.hist.push([P, f]); st.P = P; st.f = f;
  },
  draw(st){
    const cv = $('c-friction-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Values must be positive'); return; }
    fitView(ctx, w, h, [0, 0, 600, 200]);
    const V = st.V, P = st.P || 0, f = st.f || 0, x = 150 + Math.min(st.x * 40, 330);
    hatch(ctx, 20, 150, 580, 150, 1);
    block(ctx, x, 115, 80, 70, 0, 'm');
    const sc = 110 / st.Pmax;
    if (P * sc > 2) arrow(ctx, x + 40, 115, x + 40 + P * sc, 115, COL.c2, 3);
    txt(ctx, `P = ${fmt(P, 3)} N`, x + 46 + P * sc, 102, { font: '12px system-ui', color: COL.c2, align: 'left' });
    if (f * sc > 2) arrow(ctx, x, 150 - 4, x - f * sc, 150 - 4, '#a61e4d', 3);
    txt(ctx, `friction = ${fmt(f, 3)} N`, x - f * sc - 6, 138, { font: '12px system-ui', color: '#a61e4d', align: 'right' });
    txt(ctx, st.slip ? 'SLIDING: friction = μₖN' : 'STUCK: friction = P (up to μₛN)', 300, 24, { font: '600 13px system-ui', color: st.slip ? '#a61e4d' : COL.c3 });
    plot($('c-friction-plot'), {
      xmin: 0, xmax: st.Pmax, ymin: 0, ymax: Math.max(V.ms, V.mk) * st.N * 1.25, xlabel: 'applied force P (N)', ylabel: 'friction force (N)',
      hlines: [{ y: V.ms * st.N, color: COL.c3 }, { y: V.mk * st.N, color: '#a61e4d' }],
      series: [{ pts: st.hist, color: COL.c1, width: 2.4 }], points: [{ x: P, y: f, color: COL.c2, r: 5 }]
    });
    statsEvery(st, 'c-friction-stats', () => [['Normal force N = mg', fmt(st.N) + ' N'], ['Breakaway force μₛN', fmt(V.ms * st.N) + ' N', true], ['Sliding friction μₖN', fmt(V.mk * st.N) + ' N', true]]);
  }
});

/* =========================================================
   C. SCALAR KINEMATICS
   ========================================================= */
// --- s, v and a: slopes and areas
(function(){
  const MOT = [['Constant acceleration', 'const'], ['Oscillation', 'osc'], ['Speed up, cruise, brake', 'trip']];
  const motion = {
    const: { T: 4, a: t => 1.5 },
    osc:   { T: 6, a: t => -6.75 * Math.sin(1.5 * t), v0: 4.5 },
    trip:  { T: 6, a: t => t < 2 ? 2 : t < 3.5 ? 0 : t < 5.5 ? -2 : 0 }
  };
  makeClip({
    id: 'c-sva', speed: 1,
    presets: (C, st, reset) => chips('c-sva', MOT, st, reset, 'mot'),
    setup(st){ st.mot = 'const'; },
    reset(st){
      markChips('c-sva', st, 'mot', MOT);
      const M = motion[st.mot], N = 600, dt = M.T / N; let s = 0, v = M.v0 || 0;
      st.tab = [[0, s, v, M.a(0)]];
      for (let i = 1; i <= N; i++){ const t0 = (i - 1) * dt, a0 = M.a(t0), a1 = M.a(t0 + dt); s += v * dt + 0.5 * a0 * dt * dt * 0 + (a0 + a1) / 4 * dt * dt; v += (a0 + a1) / 2 * dt; st.tab.push([i * dt, s, v, a1]); }
      st.T = M.T;
    },
    step(st){ if (st.t > st.T + 1) st.t = 0; },
    draw(st){
      const t = Math.min(st.t, st.T), i = Math.round(t / st.T * (st.tab.length - 1)), [, s, v, a] = st.tab[i];
      const cv = $('c-sva-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const smin = Math.min(...st.tab.map(r => r[1])), smax = Math.max(...st.tab.map(r => r[1]));
      const X = q => 30 + (q - smin) / Math.max(smax - smin, 1e-9) * (w - 60);
      line(ctx, 20, h / 2, w - 20, h / 2, COL.axis, 2);
      ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(X(s), h / 2, 9, 0, 2 * Math.PI); ctx.fill();
      if (Math.abs(v) > 1e-3) arrow(ctx, X(s), h / 2 - 18, X(s) + Math.sign(v) * Math.min(18 + Math.abs(v) * 10, 70), h / 2 - 18, COL.c2, 2.5);
      txt(ctx, 'P', X(s), h / 2 + 22, { font: 'italic 14px Georgia, serif' });
      const col = (k) => st.tab.map(r => [r[0], r[k]]);
      const tan = (k, slope) => { const y0 = st.tab[i][k], dT = st.T * 0.12; return [[t - dT, y0 - slope * dT], [t + dT, y0 + slope * dT]]; };
      const area = (k) => st.tab.slice(0, i + 1).map(r => [r[0], r[k]]);
      const rng = k => { const ys = st.tab.map(r => r[k]); const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys); const p = (hi - lo) * 0.12 || 1; return [lo - p, hi + p]; };
      const shade = (cvs, k, color) => ({ cvs, k, color });
      [['c-sva-s', 1, 's (m)', tan(1, v), null], ['c-sva-v', 2, 'v (m/s)', tan(2, a), 1], ['c-sva-a', 3, 'a (m/s²)', null, 2]].forEach(([id, k, lab, tg, nextK]) => {
        const [lo, hi] = rng(k);
        const ser = [];
        ser.push({ pts: col(k), color: COL.c1, width: 2.2 });
        if (tg) ser.push({ pts: tg, color: COL.c2, width: 2, dash: [5, 3], guide: true });
        const g = plot($(id), { xmin: 0, xmax: st.T, ymin: lo, ymax: hi, xlabel: k === 3 ? 'time t (s)' : '', ylabel: lab, series: ser, vlines: [{ x: t, color: COL.axis }], points: [{ x: t, y: st.tab[i][k], color: COL.c2, r: 5 }] });
        if (k >= 2){ // fill area under the curve from 0 to t (this is the change in the quantity above)
          const c2 = $(id).getContext('2d'); c2.save(); c2.globalAlpha = 0.18; c2.fillStyle = COL.c3; c2.beginPath();
          c2.moveTo(g.X(0), g.Y(0)); st.tab.slice(0, i + 1).forEach(r => c2.lineTo(g.X(r[0]), g.Y(r[k]))); c2.lineTo(g.X(t), g.Y(0)); c2.closePath(); c2.fill(); c2.restore();
        }
      });
      statsEvery(st, 'c-sva-stats', () => [['t', fmt(t, 3) + ' s'], ['s', fmt(s, 3) + ' m'], ['v = ds/dt (slope of s)', fmt(v, 3) + ' m/s', true], ['a = dv/dt (slope of v)', fmt(a, 3) + ' m/s²', true], ['Δv = area under a', fmt(v - st.tab[0][2], 3) + ' m/s'], ['Δs = area under v', fmt(s, 3) + ' m']]);
    }
  });
})();

// --- chain rule: a = v dv/ds (used by a concept clip and by Example 0.C.2)
function makeChainClip(id, opts){
  makeClip({
    id, speed: 1,
    presets: opts.presets ? (C, st, reset) => chips(id, opts.presets, st, reset, 'fn') : undefined,
    setup(st){ st.fn = opts.presets ? opts.presets[0][1] : 0; },
    reset(st){
      if (opts.presets) markChips(id, st, 'fn', opts.presets);
      st.F = opts.fns[st.fn]; st.s = st.F.s0; st.lastT = 0; st.trail = []; st.vPrev = null; st.aNum = undefined;
    },
    step(st){
      const F = st.F, dt = (st.t - st.lastT) * (F.slow || 1); st.lastT = st.t;
      if (st.s >= F.s1){ st.tEnd = st.tEnd ?? st.t; if (st.t > st.tEnd + 1){ st.t = 0; st.s = F.s0; st.lastT = 0; st.trail = []; st.vPrev = null; st.aNum = undefined; st.tEnd = undefined; } return; }
      const n = 20, h = dt / n;
      for (let k = 0; k < n; k++){ const k1 = F.v(st.s), k2 = F.v(st.s + h / 2 * k1), k3 = F.v(st.s + h / 2 * k2), k4 = F.v(st.s + h * k3); st.s += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
      if (st.s > F.s1) st.s = F.s1; // stop exactly at the end of the track
      const vNow = F.v(st.s);
      if (st.vPrev !== null && dt > 0) st.aNum = (vNow - st.vPrev) / dt;
      st.vPrev = vNow; st.trail.push([st.s, vNow]);
    },
    draw(st){
      const F = st.F, s = st.s, v = F.v(s), dv = F.dv(s), a = v * dv;
      const cv = $(id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const X = q => 30 + (q - F.s0) / (F.s1 - F.s0) * (w - 60);
      line(ctx, 20, h / 2, w - 20, h / 2, COL.axis, 2);
      ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(X(s), h / 2, 9, 0, 2 * Math.PI); ctx.fill();
      txt(ctx, 'P', X(s), h / 2 + 22, { font: 'italic 14px Georgia, serif' });
      if (Math.abs(v) > 1e-3) arrow(ctx, X(s), h / 2 - 18, X(s) + Math.sign(v) * Math.min(16 + Math.abs(v) * 6, 70), h / 2 - 18, COL.c2, 2.5);
      const pts = [], apts = []; let lo = 0, hi = 0;
      for (let k = 0; k <= 400; k++){ const q = F.s0 + (F.s1 - F.s0) * k / 400, vv = F.v(q), aa = vv * F.dv(q); pts.push([q, vv]); apts.push([q, aa]); lo = Math.min(lo, vv); hi = Math.max(hi, vv); }
      const ds = (F.s1 - F.s0) * 0.12;
      plot($(id + '-plot'), {
        xmin: F.s0, xmax: F.s1, ymin: lo - (hi - lo) * 0.15, ymax: hi + (hi - lo) * 0.15 + 1e-6, xlabel: 'position s', ylabel: 'speed v',
        series: [{ pts, color: COL.c1, width: 2.4 }, { pts: [[s - ds, v - dv * ds], [s + ds, v + dv * ds]], color: COL.c2, width: 2, dash: [5, 3], guide: true }],
        points: [{ x: s, y: v, color: COL.c2, r: 6 }]
      });
      if ($(id + '-plot2')){ let alo = Math.min(...apts.map(p => p[1])), ahi = Math.max(...apts.map(p => p[1])); const pad = (ahi - alo) * 0.15 || 1;
        plot($(id + '-plot2'), { xmin: F.s0, xmax: F.s1, ymin: alo - pad, ymax: ahi + pad, xlabel: 'position s', ylabel: 'acceleration a', series: [{ pts: apts, color: COL.c4, width: 2.4 }], points: [{ x: s, y: a, color: COL.c2, r: 6 }] }); }
      statsEvery(st, id + '-stats', () => [['s', fmt(s, 4)], ['v(s)', fmt(v, 4)], ['dv/ds (slope, dashed)', fmt(dv, 4)], ['a = v · dv/ds', fmt(a, 4), true], ['a measured from the motion (Δv/Δt)', st.aNum !== undefined ? fmt(st.aNum, 3) : '—']]);
    }
  });
}
makeChainClip('c-chain', {
  presets: [['v = 1 + s', 'lin'], ['v = 2√s', 'sqrt'], ['v = 4 − s²/4', 'cap']],
  fns: {
    lin:  { s0: 0, s1: 3.5, T: 8, v: s => 1 + s, dv: s => 1 },
    sqrt: { s0: 0.05, s1: 6, T: 8, v: s => 2 * Math.sqrt(Math.max(s, 0)), dv: s => 1 / Math.sqrt(Math.max(s, 1e-9)) },
    cap:  { s0: 0, s1: 3.9, T: 8, v: s => 4 - s * s / 4, dv: s => -s / 2 }
  }
});

/* =========================================================
   WORKED-EXAMPLE ANIMATIONS
   ========================================================= */
// Example 0.A.1: vector operations in 3D
(function(){
  const OPS = [['a + b', 'add'], ['a − b', 'sub'], ['a · b', 'dot'], ['a × b', 'ab'], ['b × a', 'ba']];
  const a = [1, -3, 5], b = [-2, -4, 6];
  makeClip({
    id: 'e-a1', speed: 1,
    presets: (C, st, reset) => chips('e-a1', OPS, st, reset, 'op'),
    setup(st){ st.op = 'add'; },
    reset(st){
      markChips('e-a1', st, 'op', OPS);
      const res = { add: f3([a[0] + b[0], a[1] + b[1], a[2] + b[2]]), sub: f3([a[0] - b[0], a[1] - b[1], a[2] - b[2]]), dot: fmt(dot3(a, b)), ab: f3(cross3(a, b)), ba: f3(cross3(b, a)) }[st.op];
      setStats('e-a1-stats', [['a', '(1, −3, 5)'], ['b', '(−2, −4, 6)'], [OPS.find(o => o[1] === st.op)[0], res, true]]);
    },
    draw(st){
      const cv = $('e-a1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const shown = { add: a.map((x, i) => x + b[i]), sub: a.map((x, i) => x - b[i]), dot: a, ab: cross3(a, b).map(x => x * 0.35), ba: cross3(a, b).map(x => x * 0.35) }[st.op];
      const az = 0.6 + 0.3 * st.t, P1 = proj3(0, 0, 1, az), pts = [[0, 0, 0], a, b, shown, [9, 0, 0], [0, 9, 0], [0, 0, 9]].map(P1);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const sc = Math.min((w - 120) / (x1 - x0), (h - 60) / (y1 - y0));
      const Pj = proj3(w / 2 - sc * (x0 + x1) / 2, h / 2 - sc * (y0 + y1) / 2, sc, az);
      axes3(ctx, Pj, 9);
      const o = [0, 0, 0];
      arrow3(ctx, Pj, o, a, COL.c1, 'a'); arrow3(ctx, Pj, o, b, COL.c2, 'b');
      if (st.op === 'add'){ const r = a.map((x, i) => x + b[i]); arrow3(ctx, Pj, a, r, COL.c5, '', 1.5); arrow3(ctx, Pj, o, r, COL.c3, 'a + b', 3.5); }
      if (st.op === 'sub'){ const r = a.map((x, i) => x - b[i]); arrow3(ctx, Pj, b, a, COL.c5, '', 1.5); arrow3(ctx, Pj, o, r, COL.c3, 'a − b', 3.5); }
      if (st.op === 'dot'){ const u = a.map(x => x / norm(a)), p = dot3(b, u), f = u.map(x => x * p); const [x1, y1] = Pj(b), [x2, y2] = Pj(f); line(ctx, x1, y1, x2, y2, COL.muted, 1.2, [4, 3]); arrow3(ctx, Pj, o, f, COL.c3, 'projection of b on a', 3.5); }
      if (st.op === 'ab' || st.op === 'ba'){ const c = st.op === 'ab' ? cross3(a, b) : cross3(b, a); arrow3(ctx, Pj, o, c.map(x => x * 0.35), COL.c3, (st.op === 'ab' ? 'a × b' : 'b × a') + ' (×0.35)', 3.5);
        txt(ctx, `perpendicular to both: (a×b)·a = ${fmt(dot3(cross3(a, b), a))}, (a×b)·b = ${fmt(dot3(cross3(a, b), b))}`, w / 2, h - 12, { font: '12px system-ui', color: COL.muted }); }
    }
  });
})();

// Example 0.A.2: XY → xy components
makeBasisClip('e-a2', { aX: -2, aY: 4, th: 0, presets: C => [{ label: 'θ = 0° (axes aligned)', apply: () => C.set({ th: 0 }) }, { label: 'θ = 36.87° (the problem)', apply: () => C.set({ th: 36.87 }) }] });

// Example 0.B.1: block pushed by an inclined force on a rough floor
makeClip({
  id: 'e-b1', speed: 1,
  controls: [
    { key: 'F', label: 'Force F', min: 0, max: 60, step: 1, value: 30, unit: 'N', dec: 1 },
    { key: 'th', label: 'Angle θ below horizontal', min: 0, max: 80, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 3, unit: 'kg', dec: 2 },
    { key: 'mk', label: 'Kinetic μₖ', min: 0, max: 1, step: 0.01, value: 0.3, unit: '', dec: 3 }
  ],
  reset(st){
    const V = st.V; st.ok = V.m > 0; if (!st.ok) return;
    st.N = V.m * 9.81 + V.F * Math.sin(V.th * RAD); st.fr = V.mk * st.N;
    st.a = (V.F * Math.cos(V.th * RAD) - st.fr) / V.m; st.x = 0; st.v = 1.5; st.lastT = 0; st.stopped = false;
    setStats('e-b1-stats', [['N = mg + F sin θ', fmt(st.N) + ' N', true], ['Friction μₖN (opposes sliding)', fmt(st.fr) + ' N', true], ['a = (F cos θ − μₖN)/m', fmt(st.a) + ' m/s²'],
      ['Note', 'pushing downward at an angle increases N, and therefore friction']]);
  },
  step(st){
    if (!st.ok) return;
    const dt = st.t - st.lastT; st.lastT = st.t;
    if (st.x > 6 || st.t > 6){ st.t = 0; st.lastT = 0; st.x = 0; st.v = 1.5; st.stopped = false; return; }
    if (!st.stopped){ st.v += st.a * dt; if (st.v <= 0){ st.v = 0; st.stopped = true; } st.x += st.v * dt; }
  },
  draw(st){
    const cv = $('e-b1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Mass must be positive'); return; }
    const narrow = w < 560; cv.dataset.h0 = narrow ? '640' : '300'; fitView(ctx, w, h, narrow ? [0, 0, 450, 520] : [0, 0, 760, 260]);
    const V = st.V, th = V.th * RAD, x = 160 + Math.min(st.x * 50, 240);
    hatch(ctx, 20, 160, 440, 160, 1);
    block(ctx, x, 125, 70, 70, 0, 'A');
    const L = 30 + V.F * 1.2; arrow(ctx, x - 35 - L * Math.cos(th), 90 - L * Math.sin(th) + 0, x - 35, 90, COL.c2, 3);
    txt(ctx, 'F', x - 40 - L * Math.cos(th), 80 - L * Math.sin(th), { color: COL.c2 });
    txt(ctx, st.stopped ? 'stopped (friction won)' : `v = ${fmt(st.v, 3)} m/s`, x, 200, { font: '12px system-ui', color: COL.muted });
    // FBD
    if (narrow){ ctx.translate(-395, 270); line(ctx, 420, 0, 800, 0, COL.axis, 1); } else line(ctx, 470, 20, 470, 250, COL.axis, 1);
    txt(ctx, 'Free-body diagram (sliding right)', 615, 18, { font: '600 13px system-ui' });
    const cx = 615, cy = 135; block(ctx, cx, cy, 64, 64, 0, 'A');
    const s = 2.5;
    arrow(ctx, cx - 32 - L * Math.cos(th) * 0.9, cy - 32 - L * Math.sin(th) * 0.9, cx - 32, cy - 32, COL.c2, 3); txt(ctx, 'F', cx - 40 - L * Math.cos(th) * 0.9, cy - 40 - L * Math.sin(th) * 0.9, { color: COL.c2 });
    arrow(ctx, cx - 6, cy + 32, cx - 6, cy + 32 + 50, COL.c2, 2.5); txt(ctx, 'mg', cx - 12, cy + 74, { color: COL.c2, align: 'right' });
    arrow(ctx, cx + 20, cy + 32 + 50, cx + 20, cy + 32, COL.muted, 2.5); txt(ctx, 'N', cx + 28, cy + 66, { color: COL.muted, align: 'left' });
    const fl = clamp(st.fr * s, 14, 90); arrow(ctx, cx - 32, cy + 32, cx - 32 - fl, cy + 32, '#a61e4d', 3); txt(ctx, 'μₖN', cx - 36 - fl, cy + 20, { color: '#a61e4d', align: 'right' });
  }
});

// Example 0.B.2: block, pulleys and hanging block: choose the FBD
(function(){
  const SYS = [['(a) A alone', 'a'], ['(b) B + lower pulley', 'b'], ['(c) Upper pulley', 'c'], ['(d) Whole system', 'd']];
  makeClip({
    id: 'e-b2', speed: 1,
    controls: [
      { key: 'm', label: 'Mass of A, m', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 },
      { key: 'M', label: 'Mass of B, M', min: 0.5, max: 20, step: 0.1, value: 6, unit: 'kg', dec: 2 },
      { key: 'mk', label: 'Kinetic μₖ', min: 0, max: 1, step: 0.01, value: 0.2, unit: '', dec: 3 }
    ],
    presets: (C, st, reset) => chips('e-b2', SYS, st, reset, 'sys'),
    setup(st){ st.sys = 'a'; },
    reset(st){
      markChips('e-b2', st, 'sys', SYS);
      const V = st.V, g = 9.81; st.ok = V.m > 0 && V.M > 0; if (!st.ok) return;
      // A: m aA = T − μk m g ; B (down +): M aB = M g − 2T ; aB = aA / 2
      st.aA = (V.M - 2 * V.mk * V.m) * g / (V.M / 2 + 2 * V.m); st.T = V.m * st.aA + V.mk * V.m * g;
      const moves = st.aA > 0;
      if (!moves){ st.aA = 0; st.T = V.M * g / 2; }
      setStats('e-b2-stats', [['a_A', fmt(st.aA) + ' m/s²', true], ['a_B = a_A / 2 (down)', fmt(st.aA / 2) + ' m/s²'], ['Tension T', fmt(st.T) + ' N', true],
        ['Check', moves ? 'B is heavy enough to drag A' : 'B is too light: friction holds A, so T = Mg/2']]);
    },
    step(st){ if (st.ok && 0.5 * st.aA * st.t * st.t > 2.4) st.t = 0; },
    draw(st){
      const cv = $('e-b2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'Masses must be positive'); return; }
      const narrow = w < 560; cv.dataset.h0 = narrow ? '720' : '340'; fitView(ctx, w, h, narrow ? [0, 0, 400, 680] : [0, 0, 780, 330]);
      const d = Math.min(0.5 * st.aA * st.t * st.t * 50, 120), xA = 110 + d, Cx = 330, Cy = 80, r = 14, r2 = r, xR = Cx + r, Qx = Cx, Qy = 190 + d / 2;
      hatch(ctx, 20, 105, 312, 105, 1);
      block(ctx, xA, 78, 64, 54, 0, 'A');
      cable(ctx, () => { ctx.moveTo(xA + 32, 66); ctx.lineTo(Cx, 66); ctx.arc(Cx, Cy, r, -Math.PI / 2, 0); ctx.lineTo(xR, Qy); ctx.arc(Qx, Qy, r2, 0, Math.PI); ctx.lineTo(Qx - r2, Cy); });
      line(ctx, Cx, Cy, 312, 105, COL.ground, 2);
      pulley(ctx, Cx, Cy, r); pulley(ctx, Qx, Qy, r2);
      line(ctx, Qx, Qy, Qx, Qy + 14, COL.spring, 2); block(ctx, Qx, Qy + 36, 52, 44, 0, 'B');
      txt(ctx, 'O', Cx + 22, Cy - 16, { font: 'italic 14px Georgia, serif' });
      const boxes = { a: [xA - 42, 40, 84, 72], b: [Qx - 40, Qy - 18, 80, 84], c: [Cx - 24, Cy - 24, 48, 48], d: [20, 30, 360, Qy + 60 - 30] };
      const bx = boxes[st.sys]; ctx.save(); ctx.strokeStyle = '#a61e4d'; ctx.setLineDash([7, 5]); ctx.lineWidth = 2; ctx.strokeRect(...bx); ctx.restore();
      // FBD panel
      if (narrow){ ctx.translate(-400, 340); line(ctx, 420, 0, 780, 0, COL.axis, 1); } else line(ctx, 420, 20, 420, 320, COL.axis, 1);
      const cx = 600, cy = 165;
      txt(ctx, 'Free-body diagram', cx, 18, { font: '600 13px system-ui' });
      const A = (x1, y1, x2, y2, col, lab, lx, ly, al = 'center') => { arrow(ctx, x1, y1, x2, y2, col, 2.6); txt(ctx, lab, lx, ly, { color: col, align: al }); };
      if (st.sys === 'a'){ block(ctx, cx, cy, 70, 56, 0, 'A');
        A(cx + 35, cy, cx + 110, cy, COL.c3, 'T', cx + 118, cy - 4, 'left'); A(cx - 35, cy + 28, cx - 110, cy + 28, '#a61e4d', 'μₖN', cx - 118, cy + 24, 'right');
        A(cx - 6, cy + 28, cx - 6, cy + 95, COL.c2, 'mg', cx - 12, cy + 88, 'right'); A(cx + 20, cy + 95, cx + 20, cy + 28, COL.muted, 'N', cx + 28, cy + 76, 'left'); }
      if (st.sys === 'b'){ pulley(ctx, cx, cy - 40, 12); line(ctx, cx, cy - 40, cx, cy - 20, COL.spring, 2); block(ctx, cx, cy + 6, 60, 50, 0, 'B');
        A(cx - 12, cy - 40, cx - 12, cy - 115, COL.c3, 'T', cx - 22, cy - 110, 'right'); A(cx + 12, cy - 40, cx + 12, cy - 115, COL.c3, 'T', cx + 22, cy - 110, 'left');
        A(cx, cy + 31, cx, cy + 100, COL.c2, 'Mg', cx + 8, cy + 94, 'left'); }
      if (st.sys === 'c'){ pulley(ctx, cx, cy, 20);
        A(cx, cy - 20, cx - 90, cy - 20, COL.c3, 'T (to A)', cx - 96, cy - 26, 'right'); A(cx + 20, cy, cx + 20, cy + 90, COL.c3, 'T', cx + 30, cy + 84, 'left'); A(cx - 20, cy, cx - 20, cy + 90, COL.c3, 'T', cx - 28, cy + 84, 'right');
        A(cx, cy, cx + 90, cy - 50, COL.muted, 'O_x, O_y (pin)', cx + 96, cy - 54, 'left'); txt(ctx, 'massless: forces balance', cx, cy + 120, { font: '12px system-ui', color: COL.muted }); }
      if (st.sys === 'd'){ ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.strokeRect(cx - 120, cy - 90, 240, 190); ctx.restore();
        txt(ctx, 'A + B + both pulleys', cx, cy - 70, { font: '12px system-ui', color: COL.muted });
        A(cx - 60, cy, cx - 140, cy, '#a61e4d', 'μₖN', cx - 146, cy - 6, 'right'); A(cx - 60, cy + 10, cx - 60, cy + 70, COL.c2, 'mg', cx - 52, cy + 66, 'left');
        A(cx - 40, cy + 120, cx - 40, cy + 60, COL.muted, 'N', cx - 32, cy + 108, 'left'); A(cx + 60, cy + 40, cx + 60, cy + 120, COL.c2, 'Mg', cx + 68, cy + 112, 'left');
        A(cx + 60, cy - 30, cx + 140, cy - 80, COL.muted, 'O_x, O_y', cx + 146, cy - 84, 'left'); txt(ctx, 'every T is internal and cancels', cx, cy + 140, { font: '12px system-ui', color: COL.muted }); }
    }
  });
})();

// Example 0.C.2: v(s) = 5 sin 3s
makeChainClip('e-c2', { fns: { 0: { s0: 0.08, s1: 0.9 * Math.PI / 3, T: 6, slow: 0.08, v: s => 5 * Math.sin(3 * s), dv: s => 15 * Math.cos(3 * s) } } });

// Example 0.C.4: a(s) = 8 s³ with v(0) = 5
makeClip({
  id: 'e-c4', speed: 1,
  reset(st){ st.s = 0; st.v = 5; st.lastT = 0; st.trail = [[0, 5]]; st.tEnd = undefined; },
  step(st){
    const dt = (st.t - st.lastT) * 0.1; st.lastT = st.t;
    if (st.s > 2){ st.tEnd = st.tEnd ?? st.t; if (st.t > st.tEnd + 1.2) { st.t = 0; st.lastT = 0; st.s = 0; st.v = 5; st.trail = [[0, 5]]; st.tEnd = undefined; } return; }
    const n = 40, h = dt / n;
    for (let k = 0; k < n; k++){ const f = q => [q[1], 8 * q[0] ** 3]; const q = rk4((t, y) => f(y), 0, [st.s, st.v], h); st.s = q[0]; st.v = q[1]; }
    if (st.s > 2){ st.s = 2; st.v = Math.sqrt(25 + 4 * 16); } // stop exactly at s = 2
    st.trail.push([st.s, st.v]);
  },
  draw(st){
    const cv = $('e-c4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const X = q => 30 + Math.min(q, 2) / 2 * (w - 130);
    line(ctx, 20, h / 2, w - 20, h / 2, COL.axis, 2);
    ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(X(st.s), h / 2, 9, 0, 2 * Math.PI); ctx.fill();
    arrow(ctx, X(st.s), h / 2 - 18, X(st.s) + Math.min(14 + st.v * 5, 80), h / 2 - 18, COL.c2, 2.5);
    txt(ctx, 'P', X(st.s), h / 2 + 22, { font: 'italic 14px Georgia, serif' });
    const exact = []; for (let k = 0; k <= 200; k++){ const q = 2 * k / 200; exact.push([q, Math.sqrt(25 + 4 * q ** 4)]); }
    plot($('e-c4-plot'), { xmin: 0, xmax: 2, ymin: 4, ymax: 10, xlabel: 'position s', ylabel: 'speed v',
      series: [{ pts: st.trail, color: COL.c1, width: 7, alpha: 0.45 }, { pts: exact, color: COL.c2, width: 2, dash: [6, 4] }], points: [{ x: Math.min(st.s, 2), y: st.v, color: COL.c1, r: 6 }] });
    statsEvery(st, 'e-c4-stats', () => [['s', fmt(st.s, 4)], ['v from the simulation', fmt(st.v, 5), true], ['√(25 + 4s⁴)', fmt(Math.sqrt(25 + 4 * st.s ** 4), 5), true]]);
  }
});
