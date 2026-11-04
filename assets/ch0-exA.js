/* =========================================================
   Chapter 0, Section A examples (vectors): 0.A.1 to 0.A.3
   ========================================================= */
(function(){
const f3 = (v, d = 3) => `(${v.map(x => fmt(Math.abs(x) < 1e-12 ? 0 : x, d)).join(', ')})`;
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => Math.hypot(...a);
const LBL = 'italic 15px Georgia, serif';

// simple 3D projection: z up on the screen, the camera turns about z by az
function proj3(cx, cy, s, az, el = 22 * RAD){
  return p => { const u = p[0] * Math.cos(az) - p[1] * Math.sin(az), wv = p[0] * Math.sin(az) + p[1] * Math.cos(az);
    return [cx + s * u, cy - s * (p[2] * Math.cos(el) + wv * Math.sin(el))]; };
}
function arrow3(ctx, Pj, a, b, col, label, wd = 3){
  const [x1, y1] = Pj(a), [x2, y2] = Pj(b);
  if (Math.hypot(x2 - x1, y2 - y1) < 3) return;
  arrow(ctx, x1, y1, x2, y2, col, wd);
  if (label){ const L = Math.hypot(x2 - x1, y2 - y1); txt(ctx, label, x2 + (x2 - x1) / L * 14, y2 + (y2 - y1) / L * 14, { color: col, font: LBL }); }
}

/* ---------- 0.A.1: vector operations in 3D ---------- */
const OPS = [['a + b', 'add'], ['a − b', 'sub'], ['a · b', 'dot'], ['a × b', 'ab'], ['b × a', 'ba']];
const A1 = [1, -3, 5], B1 = [-2, -4, 6];
makeClip({
  id: 'x0a-1', speed: 1,
  presets: (C, st, reset) => chips5('x0a-1', OPS, st, reset, 'op'),
  setup(st){ st.op = 'add'; st.a = A1; st.b = B1; },
  reset(st){
    mark5('x0a-1', st, 'op', OPS);
    const a = A1, b = B1;
    st.res = { add: a.map((x, i) => x + b[i]), sub: a.map((x, i) => x - b[i]), dot: null, ab: cross3(a, b), ba: cross3(b, a) }[st.op];
    const val = st.op === 'dot' ? fmt(dot3(a, b)) : f3(st.res);
    const extra = st.op === 'dot' ? [['angle between a and b', fmt(Math.acos(dot3(a, b) / norm(a) / norm(b)) / RAD, 4) + '°']]
      : (st.op === 'ab' || st.op === 'ba') ? [['(a × b) · a', fmt(dot3(cross3(a, b), a))], ['(a × b) · b', fmt(dot3(cross3(a, b), b))]] : [];
    setStats('x0a-1-stats', [['a', '(1, −3, 5)'], ['b', '(−2, −4, 6)'], [OPS.find(o => o[1] === st.op)[0], val, true], ...extra]);
  },
  draw(st){
    const cv = $('x0a-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const a = A1, b = B1, S = 0.35;  // cross products are drawn at 0.35 scale so they fit
    const shown = st.op === 'dot' ? a : (st.op === 'ab' || st.op === 'ba') ? st.res.map(x => x * S) : st.res;
    const az = 0.6 + 0.3 * st.t; st.az = az;
    const P1 = proj3(0, 0, 1, az), pts = [[0, 0, 0], a, b, shown, [9, 0, 0], [0, 9, 0], [0, 0, 9], [-3, -8, 0]].map(P1);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sc = Math.min((w - 110) / (x1 - x0), (h - 70) / (y1 - y0));
    const Pj = proj3(w / 2 - sc * (x0 + x1) / 2, h / 2 + 8 - sc * (y0 + y1) / 2, sc, az);
    [['x', [9, 0, 0]], ['y', [0, 9, 0]], ['z', [0, 0, 9]]].forEach(([n, e]) => {
      const [p, q] = [Pj([0, 0, 0]), Pj(e)]; line(ctx, p[0], p[1], q[0], q[1], COL.axis, 1.2, [4, 3]);
      txt(ctx, n, q[0] + (q[0] - p[0]) * 0.06, q[1] + (q[1] - p[1]) * 0.06, { font: 'italic 13px Georgia, serif', color: COL.muted });
    });
    // shadow of each vector in the xy plane helps to read the 3D direction
    [[a, COL.c1], [b, COL.c2]].forEach(([v, c]) => { const p = Pj([v[0], v[1], 0]), q = Pj(v), o = Pj([0, 0, 0]);
      line(ctx, o[0], o[1], p[0], p[1], c, 1, [2, 3]); line(ctx, p[0], p[1], q[0], q[1], c, 1, [2, 3]); });
    const o = [0, 0, 0];
    arrow3(ctx, Pj, o, a, COL.c1, 'a'); arrow3(ctx, Pj, o, b, COL.c2, 'b');
    if (st.op === 'add'){ arrow3(ctx, Pj, a, st.res, COL.c2, '', 1.5); arrow3(ctx, Pj, o, st.res, COL.c3, 'a + b', 3.5); }
    if (st.op === 'sub'){ arrow3(ctx, Pj, b, a, COL.muted, '', 1.5); arrow3(ctx, Pj, o, st.res, COL.c3, 'a − b', 3.5); }
    if (st.op === 'dot'){ const u = a.map(x => x / norm(a)), p = dot3(b, u), f = u.map(x => x * p), q1 = Pj(b), q2 = Pj(f);
      line(ctx, q1[0], q1[1], q2[0], q2[1], COL.muted, 1.2, [4, 3]); arrow3(ctx, Pj, o, f, COL.c3, 'projection of b on a', 3.5); }
    if (st.op === 'ab' || st.op === 'ba') arrow3(ctx, Pj, o, shown, COL.c3, (st.op === 'ab' ? 'a × b' : 'b × a') + ' (drawn × 0.35)', 3.5);
  }
});

/* ---------- 0.A.2 and 0.A.3: one vector described in two sets of axes ----------
   The xy axes are turned counterclockwise from XY by θ.  mode 'XY': the vector is given in XY (0.A.2);
   mode 'xy': the vector is given in xy (0.A.3). The state exposes the vector in XY (st.vX, st.vY) and θ (st.th, rad). */
// a label on a small patch of background, so that the grid lines behind it do not cross the letters
function tag(ctx, s, x, y, col, font = 'italic 15px Georgia, serif'){
  ctx.save(); ctx.font = font; const wd = ctx.measureText(s.replace(/_/g, '')).width + 10; ctx.fillStyle = COL.card || '#fff'; ctx.fillRect(x - wd / 2, y - 11, wd, 22); ctx.restore();
  txtNow(ctx, s, x, y, { color: col, font });
}
function basisClip(id, mode, name, c1, c2, th0){
  const given = mode === 'XY' ? ['_X', '_Y', 'Î', 'Ĵ'] : ['_x', '_y', 'î', 'ĵ'];
  makeClip({
    id, buttons: false,
    controls: [
      { key: 'c1', label: `${name}${given[0]} (along ${given[2]})`, min: -6, max: 6, step: 0.1, value: c1, unit: '', dec: 3 },
      { key: 'c2', label: `${name}${given[1]} (along ${given[3]})`, min: -6, max: 6, step: 0.1, value: c2, unit: '', dec: 3 },
      { key: 'th', label: 'Rotation θ of the xy axes from XY', min: -180, max: 180, step: 0.01, value: th0, unit: '°', dec: 2 }
    ],
    presets: C => [{ label: 'θ = 0° (axes aligned)', apply: () => C.set({ th: 0 }) }, { label: 'θ = 36.87° (the problem)', apply: () => C.set({ th: 36.87 }) }],
    reset(st){
      const th = st.V.th * RAD, c = Math.cos(th), s = Math.sin(th); st.th = th;
      if (mode === 'XY'){ st.vX = st.V.c1; st.vY = st.V.c2; st.vx = st.vX * c + st.vY * s; st.vy = -st.vX * s + st.vY * c; }
      else { st.vx = st.V.c1; st.vy = st.V.c2; st.vX = st.vx * c - st.vy * s; st.vY = st.vx * s + st.vy * c; }
      const n = name;
      setStats(id + '-stats', mode === 'XY'
        ? [[`${n}_x = ${n} · î = ${n}_X cos θ + ${n}_Y sin θ`, fmt(st.vx, 4), true], [`${n}_y = ${n} · ĵ = −${n}_X sin θ + ${n}_Y cos θ`, fmt(st.vy, 4), true], [`|${n}| (does not change)`, fmt(Math.hypot(st.vx, st.vy), 4)]]
        : [[`${n}_X = ${n} · Î = ${n}_x cos θ − ${n}_y sin θ`, fmt(st.vX, 4), true], [`${n}_Y = ${n} · Ĵ = ${n}_x sin θ + ${n}_y cos θ`, fmt(st.vY, 4), true], [`|${n}| (does not change)`, fmt(Math.hypot(st.vX, st.vY), 4)]]);
    },
    draw(st){
      const cv = $(id + '-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const span = Math.max(2, Math.hypot(st.vX, st.vY)) * 1.22, s = Math.min(w, h) / (2 * span), cx = w / 2, cy = h / 2;
      const P = (x, y) => [cx + x * s, cy - y * s];
      // fixed XY grid (grey)
      ctx.save(); ctx.lineWidth = 1; ctx.globalAlpha = 0.22;   // a faint grid: it shows the XY directions without crossing the labels strongly
      for (let i = -Math.ceil(w / s); i <= Math.ceil(w / s); i++){ ctx.lineWidth = i === 0 ? 2.2 : 1; ctx.strokeStyle = i === 0 ? COL.fg : COL.axis; const [x] = P(i, 0); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let j = -Math.ceil(h / s); j <= Math.ceil(h / s); j++){ ctx.lineWidth = j === 0 ? 2.2 : 1; ctx.strokeStyle = j === 0 ? COL.fg : COL.axis; const [, y] = P(0, j); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.restore();
      const [Xx, Xy] = P(span * 0.95 * w / Math.min(w, h), 0); txt(ctx, 'X', Math.min(Xx, w - 12), Xy + 14, { font: 'italic 14px Georgia, serif', color: COL.muted });
      txt(ctx, 'Y', cx + 14, 12, { font: 'italic 14px Georgia, serif', color: COL.muted });
      const th = st.th, e1 = [Math.cos(th), Math.sin(th)], e2 = [-Math.sin(th), Math.cos(th)], Ll = (Math.min(w, h) / 2 - 16) / s;
      [[e1, 'x'], [e2, 'y']].forEach(([e, n]) => { const p = P(-60 * e[0], -60 * e[1]), q = P(60 * e[0], 60 * e[1]); line(ctx, p[0], p[1], q[0], q[1], COL.c4, 1.5);
        const l = P(Ll * e[0], Ll * e[1]); txt(ctx, n, l[0] + 14 * e[1], l[1] + 14 * e[0], { color: COL.c4, font: LBL }); });
      const o = P(0, 0), U = (v, col, lab, wd, bg) => { const q = P(v[0], v[1]); if (Math.hypot(q[0] - o[0], q[1] - o[1]) < 3) return; arrow(ctx, o[0], o[1], q[0], q[1], col, wd);
        if (lab){ const L = Math.hypot(q[0] - o[0], q[1] - o[1]), ux = (q[0] - o[0]) / L, uy = (q[1] - o[1]) / L;
          if (bg){ // components: the spot beside the arrow that is farthest from every line of the drawing
            const segs = st._segs, dseg = (px, py, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], t = clamp(((px - A[0]) * dx + (py - A[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - A[0] - t * dx, py - A[1] - t * dy); };
            let best = null;
            [0.3, 0.45, 0.6, 0.75].forEach(f => [1, -1].forEach(sd => [20, 28].forEach(off => {
              const x = o[0] + (q[0] - o[0]) * f + sd * uy * off, y = o[1] + (q[1] - o[1]) * f - sd * ux * off;
              const sc = Math.min(...segs.map(([A, B]) => dseg(x, y, A, B))) - (x < 30 || x > w - 30 || y < 14 || y > h - 14 ? 99 : 0);
              if (!best || sc > best[0]) best = [sc, x, y]; })));
            txt(ctx, lab, best[1], best[2], { color: col, font: LBL }); }
          else txt(ctx, lab, q[0] + ux * 22, q[1] + uy * 16, { color: col, font: LBL }); } };
      U(e1, COL.c4, 'î', 2.5); U(e2, COL.c4, 'ĵ', 2.5);
      const v = [st.vX, st.vY], pi = [st.vx * e1[0], st.vx * e1[1]], pj = [st.vy * e2[0], st.vy * e2[1]], q = P(...v);
      { const O = P(0, 0), E = (e, k) => P(k * e[0], k * e[1]), big = 60;
        st._segs = [[E(e1, -big), E(e1, big)], [E(e2, -big), E(e2, big)], [P(-big, 0), P(big, 0)], [P(0, -big), P(0, big)], [O, q],
          ...(mode === 'XY' ? [[O, P(...pi)], [O, P(...pj)], [q, P(...pi)], [q, P(...pj)]] : [[O, P(st.vX, 0)], [O, P(0, st.vY)], [q, P(st.vX, 0)], [q, P(0, st.vY)]])]; }
      if (mode === 'XY'){ [pi, pj].forEach(p => { const r = P(...p); line(ctx, q[0], q[1], r[0], r[1], COL.muted, 1.2, [4, 3]); });
        U(pi, COL.c3, `${name}_x î`, 4, true); U(pj, COL.c3, `${name}_y ĵ`, 4, true); }
      else { const pX = [st.vX, 0], pY = [0, st.vY]; [pX, pY].forEach(p => { const r = P(...p); line(ctx, q[0], q[1], r[0], r[1], COL.muted, 1.2, [4, 3]); });
        U(pX, COL.c3, `${name}_X Î`, 4, true); U(pY, COL.c3, `${name}_Y Ĵ`, 4, true); }
      U(v, COL.c2, '', 3.5);
      { // the vector's name beside its tip, on the side farther from the purple axes
        const L = Math.hypot(st.vX, st.vY) || 1, ux = st.vX / L, uy = st.vY / L, dist = p => Math.min(...[e1, e2].map(e => Math.abs(p[0] * e[1] - p[1] * e[0])));
        const cand = [1, -1].map(sg => [st.vX * 0.82 - sg * uy * 0.55, st.vY * 0.82 + sg * ux * 0.55]).sort((p, q) => dist(q) - dist(p))[0], c = P(...cand);
        txt(ctx, name, c[0], c[1], { color: COL.c2, font: LBL }); }
      // angle θ between X and x
      if (Math.abs(th) > 0.02){ ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(o[0], o[1], 34, 0, -th, th > 0); ctx.stroke(); ctx.restore();
        txt(ctx, 'θ', o[0] + 46 * Math.cos(th / 2), o[1] - 46 * Math.sin(th / 2), { color: COL.c4, font: 'italic 14px Georgia, serif' }); }
    }
  });
}
basisClip('x0a-2', 'XY', 'a', -2, 4, 36.87);
basisClip('x0a-3', 'xy', 'b', 3, -5, 36.87);

subLabels();
})();
