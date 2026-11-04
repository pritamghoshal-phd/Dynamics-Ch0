/* =========================================================
   Chapter 6 examples: Section A (equations of motion), 6.A.1 to 6.A.3
   Clips x6a-1 … x6a-3. Every animation integrates the equation of motion derived in the solution
   (RK4, pre-computed at each reset), and the drawing is sized from the computed motion range,
   so springs, dashpots, cables and bodies never pass through one another.
   ========================================================= */
(function(){
  /* ---------- shared helpers (Chapter 6 example files) ---------- */
  const GV = 9.81;
  // labels keep a readable size on phones, where fitView shrinks a wide drawing: the font grows as the drawing shrinks (up to 1.8×)
  const grow = ctx => { const k = ctx.getTransform().a / (window.devicePixelRatio || 1); return k >= 1 ? 1 : Math.min(1.8, 1 / Math.max(k, 0.55)); };
  const lab = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: `italic ${(15 * grow(ctx)).toFixed(1)}px Georgia, serif` }, o));
  const small = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: `${(12 * grow(ctx)).toFixed(1)}px system-ui`, color: COL.muted }, o));
  const jn = (v, d = 3) => fmt(Math.abs(v) < 1e-9 ? 0 : v, d);
  const dot = (ctx, x, y, c, r = 3.5) => { ctx.save(); ctx.fillStyle = c || COL.fg; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); };
  // integrate x'' = acc(t, x, v) from (x0, v0) over [0, T] with RK4 (step h), sampled every 'every' steps.
  // stop(x) may end the run early (the motion would leave the drawn hardware); the loop then restarts there.
  function sim(acc, x0, v0, T, h = 0.002, stop){
    const every = 2, out = { t: [0], x: [x0], v: [v0], a: [acc(0, x0, v0)], dt: h * every, T, cut: false };
    let x = x0, v = v0, t = 0; const n = Math.round(T / h);
    for (let i = 1; i <= n; i++){
      const f = (tt, X, Vv) => [Vv, acc(tt, X, Vv)];
      const k1 = f(t, x, v), k2 = f(t + h / 2, x + h / 2 * k1[0], v + h / 2 * k1[1]), k3 = f(t + h / 2, x + h / 2 * k2[0], v + h / 2 * k2[1]), k4 = f(t + h, x + h * k3[0], v + h * k3[1]);
      x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); t += h;
      if (i % every === 0){ out.t.push(t); out.x.push(x); out.v.push(v); out.a.push(acc(t, x, v)); }
      if (stop && stop(x)){ out.T = t; out.cut = true; break; }
    }
    out.xmin = Math.min(...out.x); out.xmax = Math.max(...out.x);
    return out;
  }
  function at(S, t){
    const u = Math.min(Math.max(t, 0), S.T) / S.dt, i = Math.min(Math.floor(u), S.x.length - 2), f = Math.min(1, u - i);
    if (i < 0) return { x: S.x[0], v: S.v[0], a: S.a[0] };
    const L = k => S[k][i] + (S[k][i + 1] - S[k][i]) * f;
    return { x: L('x'), v: L('v'), a: L('a') };
  }
  // curve of key ('x', 'v' or 'a') for the plot, thinned to about 600 points
  function curve(S, key = 'x', scale = 1){ const n = S.t.length, st = Math.max(1, Math.floor(n / 600)), p = []; for (let i = 0; i < n; i += st) p.push([S.t[i], S[key][i] * scale]); p.push([S.t[n - 1], S[key][n - 1] * scale]); return p; }
  // world (metres, y up) to canvas (design pixels, y down)
  const view = (S, ox, oy) => (x, y) => [ox + S * x, oy - S * y];
  // coil spring between two points (world-mapped already), with straight leads
  const spr = (ctx, a, b, n = 9, amp = 7) => springLine(ctx, a[0], a[1], b[0], b[1], n, amp);
  // dashpot: cylinder fixed to end a, rod fixed to end b. cyl = cylinder length, rod = rod length (both in canvas units),
  // chosen by the caller so that the piston always stays inside the cylinder over the whole motion.
  function dashpot(ctx, a, b, cyl, rod, stub = 8, hw = 8){
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) return;
    ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
    ctx.strokeStyle = COL.spring; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(stub, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(160,165,175,0.18)'; ctx.fillRect(stub, -hw, cyl, 2 * hw);
    ctx.beginPath(); ctx.moveTo(stub + cyl, -hw); ctx.lineTo(stub, -hw); ctx.lineTo(stub, hw); ctx.lineTo(stub + cyl, hw); ctx.stroke();
    const p = L - rod; // piston position measured from end a
    ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(p, -hw + 2.5); ctx.lineTo(p, hw - 2.5); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(L, 0); ctx.stroke();
    ctx.restore();
    return p; // for checks
  }
  // hatch() draws its ticks on the side opposite its normal; these wrappers put the ticks inside the material.
  // ground line with hatching below (x1 < x2), wall with hatching on one side
  const ground = (ctx, x1, x2, y) => { hatch(ctx, x2, y, x1, y, -1, 9, 7); line(ctx, x1, y, x2, y, COL.fg, 2); };
  const ceil = (ctx, x1, x2, y) => { hatch(ctx, x2, y, x1, y, 1, 9, 7); line(ctx, x1, y, x2, y, COL.fg, 2); };   // material above
  const wallL = (ctx, x, y1, y2) => { hatch(ctx, x, y1, x, y2, 1, 9, 7); line(ctx, x, y1, x, y2, COL.fg, 2); };   // material to the left
  const wallR = (ctx, x, y1, y2) => { hatch(ctx, x, y2, x, y1, 1, 9, 7); line(ctx, x, y1, x, y2, COL.fg, 2); };   // material to the right
  // small wheels under a cart whose bottom edge is at y (canvas), radius rw (canvas units), rolling angle ang
  function cartWheels(ctx, xs, y, rw, ang){ xs.forEach(x => { ctx.save(); ctx.fillStyle = COL.spring; ctx.beginPath(); ctx.arc(x, y + rw, rw, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + rw); ctx.lineTo(x + rw * 0.8 * Math.cos(ang), y + rw + rw * 0.8 * Math.sin(ang)); ctx.stroke(); ctx.restore(); }); }
  // plot of x(t) (or several series) with the current time marked
  function xplot(id, S, t, o = {}){
    const sc = o.scale || 1, key = o.key || 'x', pts = curve(S, key, sc), cur = at(S, t)[key] * sc;
    let lo = Math.min(...pts.map(p => p[1])), hi = Math.max(...pts.map(p => p[1]));
    (o.hlines || []).forEach(h => { lo = Math.min(lo, h.y); hi = Math.max(hi, h.y); });
    const pad = Math.max(1e-6, 0.12 * (hi - lo || Math.abs(hi) || 1));
    plot($(id), { xmin: 0, xmax: S.T, ymin: lo - pad, ymax: hi + pad, xlabel: 'time t (s)', ylabel: o.ylabel || 'x (m)',
      series: [{ pts, color: o.color || COL.c3, width: 2.2 }].concat((o.hlines || []).map(h => ({ pts: [[0, h.y], [S.T, h.y]], color: h.color || COL.muted, width: 1.2, dash: [5, 4] }))),
      points: [{ x: Math.min(t, S.T), y: cur, color: o.color || COL.c3, r: 5 }] });
  }

  /* ---------------- 6.A.1: particle on a spring and a dashpot, pushed by f(t) ----------------
     x is measured downward from the position where the spring is unstretched.
     EOM: m x'' + c x' + k x = m g − f(t), with f(t) = F₀ sin Ωt acting upward on the particle. */
  makeClip({
    id: 'x6a-1', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass m', min: 0.5, max: 3, step: 0.1, value: 1, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k', min: 40, max: 400, step: 5, value: 100, unit: 'N/m', dec: 0 },
      { key: 'c', label: 'Damping c', min: 0, max: 20, step: 0.5, value: 2, unit: 'N·s/m', dec: 1 },
      { key: 'F0', label: 'Force amplitude F_0', min: 0, max: 10, step: 0.5, value: 0, unit: 'N', dec: 1 },
      { key: 'W', label: 'Force frequency Ω', min: 1, max: 25, step: 0.5, value: 10, unit: 'rad/s', dec: 1 }
    ],
    presets: C => [{ label: 'Released at the unstretched length', apply: () => C.set({ m: 1, k: 100, c: 2, F0: 0 }) },
      { label: 'No damping', apply: () => C.set({ c: 0, F0: 0 }) }, { label: 'Heavy damping', apply: () => C.set({ c: 20, F0: 0 }) },
      { label: 'Harmonic force f(t)', apply: () => C.set({ c: 2, F0: 5, W: 10 }) }],
    reset(st){
      const V = st.V; st.f = t => V.F0 * Math.sin(V.W * t);
      st.S = sim((t, x, v) => (V.m * GV - st.f(t) - V.c * v - V.k * x) / V.m, 0, 0, 6);
      const rng = Math.max(st.S.xmax - st.S.xmin, 1e-3); st.sc = Math.min(600, 105 / rng); st.D = st.sc * rng;
      st.Y0 = 110 + st.D - st.sc * st.S.xmin;   // canvas y of the mass top when x = 0
      st.cur = at(st.S, 0);
    },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); },
    draw(st){
      const cv = $('x6a-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 440, 400]);
      const V = st.V, c = st.cur, top = st.Y0 + st.sc * c.x, D = st.D, xst = V.m * GV / V.k;
      ceil(ctx, 110, 330, 40);
      // dashpot (left) and spring (right), both between the ceiling and the top of the particle
      dashpot(ctx, [190, 40], [190, top], D + 10, 58 + D);
      spr(ctx, [250, 40], [250, top], 10, 9);
      block(ctx, 220, top + 25, 110, 50, 0, 'm');
      lab(ctx, 'c', 168, 40 + 0.35 * (top - 40)); lab(ctx, 'k', 274, 40 + 0.5 * (top - 40));
      // datum (spring unstretched) and static equilibrium
      line(ctx, 280, st.Y0, 345, st.Y0, COL.muted, 1, [4, 3]); small(ctx, 'x = 0', 368, st.Y0, { align: 'left' });
      const ye = st.Y0 + st.sc * xst;
      if (Math.abs(ye - st.Y0) > 14) { line(ctx, 280, ye, 345, ye, COL.c5, 1, [4, 3]); small(ctx, 'equilibrium', 352, ye, { align: 'left', color: COL.c5 }); }
      if (Math.abs(top - st.Y0) > 8) arrow(ctx, 300, st.Y0, 300, top, COL.c3, 1.6);
      lab(ctx, 'x', 312, (st.Y0 + top) / 2, { color: COL.c3 });
      // gravity and the applied force
      arrow(ctx, 60, 70, 60, 120, COL.muted, 1.6); lab(ctx, 'g', 46, 95, { color: COL.muted });
      const fv = st.f(st.t > st.S.T ? 0 : st.t), fl = 34 * fv / Math.max(1, V.F0), bot = top + 50;
      if (Math.abs(fv) > 0.05){ if (fv > 0) arrow(ctx, 220, bot + 4 + fl, 220, bot + 4, COL.c2, 2.4); else arrow(ctx, 220, bot + 4, 220, bot + 4 - fl, COL.c2, 2.4); lab(ctx, 'f(t)', 246, bot + 22, { color: COL.c2 }); }
      xplot('x6a-1-plot', st.S, st.t, { ylabel: 'x (m), downward', hlines: [{ y: xst, color: COL.c5 }] });
      statsEvery(st, 'x6a-1-stats', () => [['x', jn(c.x, 3) + ' m'], ['ẋ', jn(c.v, 3) + ' m/s'], ['ω_n = √(k/m)', fmt(Math.sqrt(V.k / V.m), 3) + ' rad/s', true],
        ['ζ = c/(2√(km))', fmt(V.c / (2 * Math.sqrt(V.k * V.m)), 3), true], ['mg/k', fmt(xst, 3) + ' m']]);
    }
  });

  /* ---------------- 6.A.2: disk rolling between two springs ----------------
     x = position of O, springs unstretched at x = 0. EOM: (3/2) m x'' + 3 k x = 0. */
  makeClip({
    id: 'x6a-2', speed: 0.5,
    controls: [
      { key: 'm', label: 'Disk mass m', min: 1, max: 5, step: 0.1, value: 2, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k', min: 20, max: 200, step: 5, value: 50, unit: 'N/m', dec: 0 },
      { key: 'x0', label: 'Initial position x_0', min: 0.02, max: 0.2, step: 0.01, value: 0.12, unit: 'm', dec: 2 }
    ],
    presets: C => [{ label: 'Book system', apply: () => C.set({ m: 2, k: 50, x0: 0.12 }) }, { label: 'Stiffer springs', apply: () => C.set({ k: 180 }) }, { label: 'Heavier disk', apply: () => C.set({ m: 5 }) }],
    reset(st){ const V = st.V; st.S = sim((t, x) => -3 * V.k * x / (1.5 * V.m), V.x0, 0, 6); st.cur = at(st.S, 0); },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); },
    draw(st){
      const cv = $('x6a-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [30, 26, 730, 290]);
      const V = st.V, c = st.cur, r = 0.16, S = 500, gy = 260, O0 = 380, ox = O0 + S * c.x, oy = gy - S * r, R = S * r;
      ground(ctx, 60, 700, gy); wallL(ctx, 60, 90, gy); wallR(ctx, 700, 90, gy);
      // the disk: rolling to the right turns it clockwise by x/r
      const ph = c.x / r;
      ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      line(ctx, ox, oy, ox + R * Math.cos(ph + Math.PI / 2), oy + R * Math.sin(ph + Math.PI / 2), RED, 2.4);
      // both springs are attached to the axle at O, in front of the disk
      spr(ctx, [60, oy], [ox, oy], 11, 9); spr(ctx, [ox, oy], [700, oy], 11, 9);
      pinDot(ctx, ox, oy);
      lab(ctx, 'O', ox + 12, oy - 16); lab(ctx, 'k', 200, oy - 26); lab(ctx, '2k', 560, oy - 26);
      small(ctx, 'no slip', ox, gy + 18);
      line(ctx, O0, gy - 4, O0, 46, COL.muted, 1, [4, 3]); small(ctx, 'x = 0', O0 - 8, 38, { align: 'right' });
      if (Math.abs(ox - O0) > 8) arrow(ctx, O0, 60, ox, 60, COL.c3, 1.6);
      lab(ctx, 'x', (O0 + ox) / 2, 46, { color: COL.c3 });
      xplot('x6a-2-plot', st.S, st.t);
      statsEvery(st, 'x6a-2-stats', () => [['x', jn(c.x, 3) + ' m'], ['ẋ', jn(c.v, 3) + ' m/s'], ['disk rotation x/r', jn(c.x / r * 180 / Math.PI, 3) + '°'],
        ['ω_n = √(2k/m)', fmt(Math.sqrt(2 * V.k / V.m), 3) + ' rad/s', true]]);
    }
  });

  /* ---------------- 6.A.3: disk under a board that rests on a smooth post ----------------
     The board moves 2x (no slip on top of the disk). EOM: (11/2) m x'' + 5 k x = 0. */
  makeClip({
    id: 'x6a-3', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass m (disk and block)', min: 1, max: 4, step: 0.1, value: 2, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k', min: 20, max: 200, step: 5, value: 40, unit: 'N/m', dec: 0 },
      { key: 'x0', label: 'Initial position x_0', min: 0.02, max: 0.09, step: 0.005, value: 0.07, unit: 'm', dec: 3 }
    ],
    presets: C => [{ label: 'Book system', apply: () => C.set({ m: 2, k: 40, x0: 0.07 }) }, { label: 'Stiffer springs', apply: () => C.set({ k: 160 }) }],
    reset(st){ const V = st.V; st.S = sim((t, x) => -5 * V.k * x / (5.5 * V.m), V.x0, 0, 6); st.cur = at(st.S, 0); },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); },
    draw(st){
      const cv = $('x6a-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [10, 120, 810, 340]);
      const V = st.V, c = st.cur, S = 330, P = view(S, 300, 310), r = 0.15, x = c.x;
      const G6 = { r, xA: 0.62, bc: 0.3, bL: 1.0, bt: 0.07, wl: -0.75, wr: 1.4 };
      const [gx1, gy] = P(-0.8, 0), [gx2] = P(1.45, 0);
      ground(ctx, gx1, gx2, gy);
      const [wlx, wly1] = P(G6.wl, 0.42), [wrx, wry1] = P(G6.wr, 0.5); wallL(ctx, wlx, wly1, gy); wallR(ctx, wrx, wry1, gy);
      // smooth post A: from the ground up to the bottom of the board
      const [ax1, ay1] = P(G6.xA - 0.025, 2 * r), [ax2] = P(G6.xA + 0.025, 0);
      ctx.save(); ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.fillRect(ax1, ay1, ax2 - ax1, gy - ay1); ctx.strokeRect(ax1, ay1, ax2 - ax1, gy - ay1); ctx.restore();
      // left spring from the wall to the center O of the disk
      const O = P(x, r), R = S * r;
      spr(ctx, [wlx, O[1]], O, 10, 8);
      // the disk
      ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(O[0], O[1], R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      const ph = x / r, ca = Math.cos(ph + Math.PI / 2), sa = Math.sin(ph + Math.PI / 2);   // a tick near the rim shows the rotation
      line(ctx, O[0] + 0.55 * R * ca, O[1] + 0.55 * R * sa, O[0] + 0.95 * R * ca, O[1] + 0.95 * R * sa, RED, 3); pinDot(ctx, O[0], O[1]);
      // the board: bottom face on the top of the disk and on post A; it moves 2x
      const xb = G6.bc + 2 * x, [b1x, b1y] = P(xb - G6.bL / 2, 2 * r + G6.bt), [b2x, b2y] = P(xb + G6.bL / 2, 2 * r);
      ctx.save(); ctx.fillStyle = '#cfd8ea'; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.fillRect(b1x, b1y, b2x - b1x, b2y - b1y); ctx.strokeRect(b1x, b1y, b2x - b1x, b2y - b1y); ctx.restore();
      const ym = (b1y + b2y) / 2;
      spr(ctx, [b2x, ym], [wrx, ym], 10, 7);
      lab(ctx, 'm', b1x + 0.18 * (b2x - b1x), b1y - 14);   // the board is thin, so its label sits just above it
      lab(ctx, 'O', O[0] - R, O[1] - 0.62 * R); lab(ctx, 'm', O[0] + R, O[1] - 0.62 * R);   // in the clear gaps beside the disk, under the board
      lab(ctx, 'k', (wlx + O[0]) / 2, O[1] - 24); lab(ctx, 'k', (b2x + wrx) / 2, ym - 24); lab(ctx, 'A', ax2 + 12, ay1 + 14);
      small(ctx, 'smooth', ax2 + 8, ay1 + 46, { align: 'left' }); small(ctx, 'no slip', O[0], gy + 16);
      // the board moves twice as fast as the center of the disk
      const vs = 60 / Math.max(0.05, V.x0 * Math.sqrt(10 * V.k / (11 * V.m)));
      if (Math.abs(c.v * vs) > 6){ const bx = (b1x + b2x) / 2 + 60; arrow(ctx, bx, b1y - 14, bx + 2 * vs * c.v, b1y - 14, COL.c4, 2); lab(ctx, '2v_O', bx + vs * c.v, b1y - 14 - 14 * grow(ctx), { color: COL.c4 }); }
      xplot('x6a-3-plot', st.S, st.t);
      statsEvery(st, 'x6a-3-stats', () => [['x', jn(x, 3) + ' m'], ['board position 2x', jn(2 * x, 3) + ' m'], ['v_O = ẋ', jn(c.v, 3) + ' m/s'], ['board speed 2ẋ', jn(2 * c.v, 3) + ' m/s'],
        ['ω_n = √(10k/11m)', fmt(Math.sqrt(10 * V.k / (11 * V.m)), 3) + ' rad/s', true]]);
    }
  });

  subLabels();
})();
