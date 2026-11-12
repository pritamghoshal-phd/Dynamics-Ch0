/* =========================================================
   Chapter 6 examples: Section B (free vibration), 6.B.1 to 6.B.4
   Clips x6b-1 … x6b-4. Every animation integrates the equation of motion derived in the solution
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

  // world-to-canvas map with a fixed scale, plus the matching canvas box for fitView
  function frame(S, bb){ const X0 = bb[0], Y1 = bb[3]; return { P: (x, y) => [S * (x - X0), S * (Y1 - y)], box: [0, 0, S * (bb[2] - bb[0]), S * (bb[3] - bb[1])], S }; }
  const polyFill = (ctx, pts, fill, stroke) => { ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke || COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
  const rblock = (ctx, F, cx, cy, w, h, ang, label, fill) => { const [px, py] = F.P(cx, cy); block(ctx, px, py, F.S * w, F.S * h, -ang, label, fill); };
  const circ = (ctx, c, r, fill) => { ctx.save(); ctx.fillStyle = fill || COL.card; ctx.strokeStyle = COL.spring; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); };
  const rope = (ctx, pts) => { ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2.4; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore(); };
  const ropeArc = (ctx, c, r, a0, a1, ccw) => { ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(c[0], c[1], r, a0, a1, ccw); ctx.stroke(); ctx.restore(); };

  /* ---------------- 6.B.1: block on a smooth incline, spring and a cable with a movable pulley ----------------
     x = displacement of A up the incline from the unstretched spring position; B moves down x/2.
     EOM: (5/4) m x'' + k x = f(t)/2 + m g (1/2 − sin θ). */
  const B1 = { L: 1.4, bw: 0.2, bh: 0.12, rF: 0.08, s0: 0.6 };
  function b1geom(th, x){
    const u = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)], W = [-B1.L * u[0], -B1.L * u[1]];
    const sc = B1.s0 + x, st = B1.L + 0.16, off = B1.bh / 2 - B1.rF;
    const A = [W[0] + sc * u[0] + B1.bh / 2 * n[0], W[1] + sc * u[1] + B1.bh / 2 * n[1]];
    const Pc = [W[0] + st * u[0] + off * n[0], W[1] + st * u[1] + off * n[1]];
    const yM = Pc[1] - 0.55 - x / 2, M = [Pc[0] + B1.rF / 2, yM], Btop = yM - B1.rF / 2 - 0.06;
    return { u, n, W, A, Pc, M, Btop, sc };
  }
  makeClip({
    id: 'x6b-1', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass of A and of B, m', min: 1, max: 4, step: 0.1, value: 2, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k', min: 40, max: 200, step: 5, value: 80, unit: 'N/m', dec: 0 },
      { key: 'th', label: 'Incline angle θ', min: 15, max: 60, step: 1, value: 30, unit: '°', dec: 0 },
      { key: 'X0', label: 'Release offset from equilibrium', min: 0, max: 0.1, step: 0.005, value: 0.06, unit: 'm', dec: 3 },
      { key: 'F0', label: 'Force amplitude F_0', min: 0, max: 10, step: 0.5, value: 0, unit: 'N', dec: 1 },
      { key: 'W', label: 'Force frequency Ω', min: 2, max: 15, step: 0.5, value: 6, unit: 'rad/s', dec: 1 }
    ],
    presets: C => [{ label: 'Free vibration, θ = 30°', apply: () => C.set({ th: 30, F0: 0, X0: 0.06 }) }, { label: 'Steeper incline', apply: () => C.set({ th: 50, F0: 0 }) },
      { label: 'Harmonic force on B', apply: () => C.set({ X0: 0, F0: 4, W: 6 }) }],
    reset(st){
      const V = st.V, th = V.th * RAD; st.f = t => V.F0 * Math.sin(V.W * t); st.xeq = V.m * GV * (0.5 - Math.sin(th)) / V.k;
      st.S = sim((t, x) => (st.f(t) / 2 + V.m * GV * (0.5 - Math.sin(th)) - V.k * x) / (1.25 * V.m), st.xeq + V.X0, 0, 8, 0.002, x => x < -0.36 || x > 0.66);
      const g0 = b1geom(th, st.S.xmax), gl = b1geom(th, 0), yg = Math.min(gl.W[1] - 0.15, g0.Btop - 0.14 - 0.25);
      st.yg = yg; st.F = frame(260, [gl.W[0] - 0.2, yg - 0.06, gl.Pc[0] + 0.32, Math.max(gl.W[1] + 0.3, gl.Pc[1] + 0.2, 0.25)]);
      st.cur = at(st.S, 0); st.geo = b1geom(th, st.cur.x);
    },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); st.geo = b1geom(st.V.th * RAD, st.cur.x); },
    draw(st){
      const cv = $('x6b-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const F = st.F, P = F.P, S = F.S; fitView(ctx, w, h, F.box);
      const V = st.V, th = V.th * RAD, g = st.geo, c = st.cur;
      // the incline body (fixed), resting on the ground
      ground(ctx, P(g.W[0] - 0.15, st.yg)[0], P(g.Pc[0] + 0.3, st.yg)[0], P(0, st.yg)[1]);
      polyFill(ctx, [P(...g.W), P(0, 0), P(0, st.yg), P(g.W[0], st.yg)], '#e6e1d4');
      // wall at the lower end, perpendicular to the incline; spring along the incline
      const wa = [g.W[0] - 0.03 * g.n[0], g.W[1] - 0.03 * g.n[1]], wb = [g.W[0] + 0.28 * g.n[0], g.W[1] + 0.28 * g.n[1]];
      line(ctx, ...P(...wa), ...P(...wb), COL.fg, 2.4); hatch(ctx, ...P(...wb), ...P(...wa), 1, 8, 6);
      const sp1 = [g.W[0] + B1.bh / 2 * g.n[0], g.W[1] + B1.bh / 2 * g.n[1]], sp2 = [g.A[0] - B1.bw / 2 * g.u[0], g.A[1] - B1.bw / 2 * g.u[1]];
      spr(ctx, P(...sp1), P(...sp2), 9, 7);
      rblock(ctx, F, g.A[0], g.A[1], B1.bw, B1.bh, th, 'm');
      // pulley bracket fixed to the vertical face of the incline body
      line(ctx, ...P(0, Math.min(-0.04, g.Pc[1] - 0.12)), ...P(...g.Pc), COL.spring, 4);
      // cable: block face → top of pulley (parallel to the incline) → down the right side → under the movable pulley → up to the axle
      const Q = [g.A[0] + B1.bw / 2 * g.u[0], g.A[1] + B1.bw / 2 * g.u[1]], T1 = [g.Pc[0] + B1.rF * g.n[0], g.Pc[1] + B1.rF * g.n[1]];
      const pc = P(...g.Pc), rf = S * B1.rF, pm = P(...g.M), rm = S * B1.rF / 2;
      circ(ctx, pc, rf); circ(ctx, pm, rm);
      rope(ctx, [P(...Q), P(...T1)]); ropeArc(ctx, pc, rf, -(Math.PI / 2 + th), 0, false);
      rope(ctx, [[pc[0] + rf, pc[1]], [pm[0] + rm, pm[1]]]); ropeArc(ctx, pm, rm, 0, Math.PI, false); rope(ctx, [[pm[0] - rm, pm[1]], pc]);
      pinDot(ctx, ...pc); pinDot(ctx, ...pm);
      // block B hangs from the movable pulley
      const bt = P(g.M[0], g.Btop); line(ctx, pm[0], pm[1], bt[0], bt[1], COL.spring, 2.2);
      block(ctx, bt[0], bt[1] + S * 0.07, S * 0.16, S * 0.14, 0, 'm');
      const fv = st.f(st.t); if (Math.abs(fv) > 0.05){ const y0 = bt[1] + S * 0.14 + 4, L = 40 * fv / Math.max(1, V.F0); if (fv > 0) arrow(ctx, bt[0], y0, bt[0], y0 + L, COL.c2, 2.4); else arrow(ctx, bt[0], y0 - L, bt[0], y0, COL.c2, 2.4); lab(ctx, 'f(t)', bt[0] + 28, y0 + 16, { color: COL.c2 }); }
      lab(ctx, 'A', ...P(g.A[0] + 0.05 * g.n[0] - 0.02, g.A[1] + 0.13)); lab(ctx, 'B', bt[0] + S * 0.12, bt[1] + S * 0.07);
      lab(ctx, 'k', ...P((sp1[0] + sp2[0]) / 2 + 0.09 * g.n[0], (sp1[1] + sp2[1]) / 2 + 0.09 * g.n[1]));
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; const a0 = P(g.W[0] + 0.35 * g.u[0], g.W[1] + 0.35 * g.u[1]); ctx.beginPath(); ctx.arc(...P(...g.W), S * 0.35, -th, 0); ctx.stroke(); ctx.restore();
      line(ctx, ...P(...g.W), ...P(g.W[0] + 0.45, g.W[1]), COL.muted, 1, [4, 3]); lab(ctx, 'θ', ...P(g.W[0] + 0.42, g.W[1] + 0.08), { color: COL.muted });
      if (st.S.cut && st.t > st.S.T - 0.05) small(ctx, 'stopped: A would reach the end of the incline', F.box[2] / 2, 16, { color: RED });
      xplot('x6b-1-plot', st.S, st.t, { ylabel: 'x (m), up the incline', hlines: [{ y: st.xeq, color: COL.c5 }] });
      statsEvery(st, 'x6b-1-stats', () => [['x', jn(c.x, 3) + ' m'], ['B moves down x/2', jn(c.x / 2, 3) + ' m'], ['x_eq = mg(½ − sin θ)/k', jn(st.xeq, 3) + ' m'],
        ['ω_n = √(4k/5m)', fmt(Math.sqrt(4 * V.k / (5 * V.m)), 3) + ' rad/s', true]]);
    }
  });

  /* ---------------- 6.B.2: block A on a smooth ledge, block B (3m) on a movable pulley, two springs ----------------
     x = position of A, springs unstretched at x = 0; B moves down x/2. EOM: 7 m x'' + 13 k x = 6 m g. */
  const B2 = { rF: 0.08, yM0: -0.45, yg: -1.3 };
  makeClip({
    id: 'x6b-2', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass m (B has 3m)', min: 0.5, max: 2, step: 0.1, value: 1, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k (springs 3k and k)', min: 40, max: 150, step: 5, value: 60, unit: 'N/m', dec: 0 },
      { key: 'x0', label: 'Initial position x_0', min: -0.1, max: 0.2, step: 0.01, value: 0, unit: 'm', dec: 2 }
    ],
    presets: C => [{ label: 'Released with the springs unstretched', apply: () => C.set({ x0: 0 }) }, { label: 'Released at equilibrium + 5 cm', apply: () => { const V = C.v; C.set({ x0: Math.round((6 * V.m * GV / (13 * V.k) + 0.05) * 100) / 100 }); } }],
    reset(st){
      const V = st.V; st.xeq = 6 * V.m * GV / (13 * V.k);
      st.S = sim((t, x) => (6 * V.m * GV - 13 * V.k * x) / (7 * V.m), V.x0, 0, 8, 0.002, x => x < -0.25 || x > 0.5);
      st.F = frame(270, [-1.32, B2.yg - 0.06, 0.4, 0.42]); st.cur = at(st.S, 0);
    },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); },
    draw(st){
      const cv = $('x6b-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const F = st.F, P = F.P, S = F.S, V = st.V, c = st.cur, x = c.x; fitView(ctx, w, h, F.box);
      const gy = P(0, B2.yg)[1];
      ground(ctx, P(-1.3, 0)[0], P(0.38, 0)[0], gy);
      polyFill(ctx, [P(-1.0, 0), P(0, 0), P(0, B2.yg)], '#8b8f98', COL.fg);
      // wall for the spring 3k, standing on the ground
      const wx = P(-1.2, 0)[0]; wallL(ctx, wx, P(0, 0.36)[1], gy);
      const xA = -0.61 + x, A = P(xA, 0.07);
      spr(ctx, [wx, A[1]], P(xA - 0.09, 0.07), 10, 8);
      rblock(ctx, F, xA, 0.07, 0.18, 0.14, 0, 'm');
      // pulley on a bracket fixed to the vertical face
      const Pc = [0.1, 0.07 - B2.rF], pc = P(...Pc), rf = S * B2.rF;
      line(ctx, ...P(0, -0.06), ...pc, COL.spring, 4);
      const yM = B2.yM0 - x / 2, pm = P(0.1 + B2.rF / 2, yM), rm = S * B2.rF / 2;
      circ(ctx, pc, rf); circ(ctx, pm, rm);
      rope(ctx, [P(xA + 0.09, 0.07), P(0.1, 0.07)]); ropeArc(ctx, pc, rf, -Math.PI / 2, 0, false);
      rope(ctx, [[pc[0] + rf, pc[1]], [pm[0] + rm, pm[1]]]); ropeArc(ctx, pm, rm, 0, Math.PI, false); rope(ctx, [[pm[0] - rm, pm[1]], pc]);
      pinDot(ctx, ...pc); pinDot(ctx, ...pm);
      // B hangs from the movable pulley; spring k from B down to the ground
      const btop = yM - B2.rF / 2 - 0.05, bt = P(0.14, btop), bb = P(0.14, btop - 0.16);
      line(ctx, pm[0], pm[1], bt[0], bt[1], COL.spring, 2.2);
      block(ctx, bt[0], bt[1] + S * 0.08, S * 0.16, S * 0.16, 0, '3m');
      spr(ctx, bb, [bb[0], gy], 8, 7);
      lab(ctx, 'A', A[0], A[1] - S * 0.13); lab(ctx, 'B', bt[0] + S * 0.13, bt[1] + S * 0.08);
      lab(ctx, '3k', (wx + A[0]) / 2 - 20, A[1] - 24); lab(ctx, 'k', bb[0] + 22, (bb[1] + gy) / 2);
      const x0p = P(-0.61, 0.07)[0]; line(ctx, x0p, A[1] - S * 0.09, x0p, A[1] - S * 0.26, COL.muted, 1, [4, 3]);
      if (Math.abs(A[0] - x0p) > 8) arrow(ctx, x0p, A[1] - S * 0.22, A[0], A[1] - S * 0.22, COL.c3, 1.6); lab(ctx, 'x', (x0p + A[0]) / 2, A[1] - S * 0.3, { color: COL.c3 });
      xplot('x6b-2-plot', st.S, st.t, { hlines: [{ y: st.xeq, color: COL.c5 }] });
      statsEvery(st, 'x6b-2-stats', () => [['x', jn(x, 3) + ' m'], ['B moves down x/2', jn(x / 2, 3) + ' m'], ['x_eq = 6mg/(13k)', fmt(st.xeq, 3) + ' m'],
        ['ω_n = √(13k/7m)', fmt(Math.sqrt(13 * V.k / (7 * V.m)), 3) + ' rad/s', true]]);
    }
  });

  /* ---------------- 6.B.3: block between two springs above and one below, passing equilibrium at v₀ ----------------
     x is measured downward from static equilibrium. EOM: m x'' + 5 k x = 0; a_max = ω_n v₀. */
  makeClip({
    id: 'x6b-3', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass m', min: 10, max: 100, step: 1, value: 50, unit: 'kg', dec: 0 },
      { key: 'k', label: 'Stiffness k', min: 200, max: 2000, step: 50, value: 1000, unit: 'N/m', dec: 0 },
      { key: 'v0', label: 'Speed at equilibrium v_0', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'm/s', dec: 1 }
    ],
    presets: C => [{ label: 'Older book data (k = 1000 N/m, m = 50 kg, v₀ = 2 m/s)', apply: () => C.set({ m: 50, k: 1000, v0: 2 }) }, { label: 'Stiffer springs', apply: () => C.set({ k: 2000 }) }],
    reset(st){
      const V = st.V, wn = Math.sqrt(5 * V.k / V.m); st.wn = wn; st.X = V.v0 / wn;
      st.S = sim((t, x) => -5 * V.k * x / V.m, 0, V.v0, 3 * 2 * Math.PI / wn, 0.001);
      st.L0 = Math.max(0.45, 2.6 * st.X); st.cur = at(st.S, 0);
      st.F = frame(Math.min(260, 300 / (2 * st.L0 + 0.3)), [-0.6, -(st.L0 + 0.2), 0.6, st.L0 + 0.2]);
    },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); },
    draw(st){
      const cv = $('x6b-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const F = st.F, P = F.P, S = F.S, c = st.cur, V = st.V, L0 = st.L0; fitView(ctx, w, h, F.box);
      const yc = -c.x, top = yc + 0.15, bot = yc - 0.15, yCe = L0 + 0.15, flo = -(L0 + 0.15);
      ceil(ctx, P(-0.4, 0)[0], P(0.4, 0)[0], P(0, yCe)[1]);
      ground(ctx, P(-0.4, 0)[0], P(0.4, 0)[0], P(0, flo)[1]);
      spr(ctx, P(-0.17, yCe), P(-0.17, top), 9, 7); spr(ctx, P(0.17, yCe), P(0.17, top), 9, 7); spr(ctx, P(0, bot), P(0, flo), 9, 8);
      rblock(ctx, F, 0, yc, 0.5, 0.3, 0, 'm');
      lab(ctx, 'k', ...P(-0.29, (yCe + top) / 2)); lab(ctx, 'k', ...P(0.29, (yCe + top) / 2)); lab(ctx, '3k', ...P(0.13, (bot + flo) / 2));
      const eq = P(0.3, 0); line(ctx, eq[0], eq[1], eq[0] + 50, eq[1], COL.c5, 1, [4, 3]); small(ctx, 'equilibrium', eq[0] + 54, eq[1], { align: 'left', color: COL.c5 });
      const cy = P(0.3, yc); if (Math.abs(cy[1] - eq[1]) > 8) arrow(ctx, eq[0] + 20, eq[1], eq[0] + 20, cy[1], COL.c3, 1.6); lab(ctx, 'x', eq[0] + 32, (eq[1] + cy[1]) / 2, { color: COL.c3 });
      // acceleration arrow on the block (always toward equilibrium)
      const as = 46 / (st.wn * V.v0); if (Math.abs(c.a * as) > 5){ const p0 = P(-0.33, yc); arrow(ctx, p0[0], p0[1], p0[0], p0[1] + c.a * as, RED, 2.2); lab(ctx, 'a', p0[0] - 14, p0[1] + c.a * as / 2, { color: RED }); }
      xplot('x6b-3-x', st.S, st.t, { ylabel: 'x (m), downward', hlines: [{ y: st.X, color: COL.muted }, { y: -st.X, color: COL.muted }] });
      xplot('x6b-3-a', st.S, st.t, { key: 'a', ylabel: 'ẍ (m/s²)', color: RED, hlines: [{ y: st.wn * V.v0, color: COL.muted }, { y: -st.wn * V.v0, color: COL.muted }] });
      statsEvery(st, 'x6b-3-stats', () => [['ω_n = √(5k/m)', fmt(st.wn, 3) + ' rad/s'], ['amplitude X = v₀/ω_n', fmt(st.X, 3) + ' m'], ['ẍ now', jn(c.a, 3) + ' m/s²'],
        ['|ẍ|_max = ω_n v₀', fmt(st.wn * V.v0, 3) + ' m/s²', true]]);
    }
  });

  /* ---------------- 6.B.4: two carts linked to a light inverted bar pinned at its lower end ----------------
     x = displacement of the top cart. Small motions: EOM (5/4) m x'' + (5/4) k x = 0, so ω_n = √(k/m).
     The drawing uses the exact link geometry, so every link keeps its length. */
  const B4 = { L: 1, l1: 0.5, l2: 0.5, cw: 0.3, ch: 0.2, rw: 0.03, wall: 1.35 };
  function b4geom(x){
    const L = B4.L, ph = Math.asin(Math.max(-0.99, Math.min(0.99, x / L))), T = [L * Math.sin(ph), L * Math.cos(ph)], Mi = [T[0] / 2, T[1] / 2];
    const x1 = T[0] + Math.sqrt(B4.l1 ** 2 - (L - T[1]) ** 2), x2 = Mi[0] - Math.sqrt(B4.l2 ** 2 - (L / 2 - Mi[1]) ** 2);
    return { ph, T, Mi, c1: [x1, L], c2: [x2, L / 2] };
  }
  makeClip({
    id: 'x6b-4', speed: 0.5,
    controls: [
      { key: 'm', label: 'Mass of each cart m', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'kg', dec: 1 },
      { key: 'k', label: 'Stiffness k', min: 20, max: 200, step: 5, value: 50, unit: 'N/m', dec: 0 },
      { key: 'x0', label: 'Initial displacement x_0', min: 0.02, max: 0.12, step: 0.01, value: 0.08, unit: 'm', dec: 2 }
    ],
    presets: C => [{ label: 'Book system (L = 1 m)', apply: () => C.set({ m: 2, k: 50, x0: 0.08 }) }, { label: 'Stiffer springs', apply: () => C.set({ k: 180 }) }],
    reset(st){ const V = st.V; st.S = sim((t, x) => -V.k * x / V.m, V.x0, 0, 6); st.F = frame(255, [-1.42, -0.2, 1.42, 1.32]); st.cur = at(st.S, 0); st.geo = b4geom(st.cur.x); },
    step(st){ if (st.t > st.S.T) st.t = 0; st.cur = at(st.S, st.t); st.geo = b4geom(st.cur.x); },
    draw(st){
      const cv = $('x6b-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const F = st.F, P = F.P, S = F.S, g = st.geo, c = st.cur, V = st.V; fitView(ctx, w, h, F.box);
      const L = B4.L, h2 = B4.ch / 2, pf1 = L - h2 - 2 * B4.rw, pf2 = L / 2 - h2 - 2 * B4.rw;
      ground(ctx, P(-0.3, 0)[0], P(0.3, 0)[0], P(0, -0.08)[1]);   // the pin O sits on a bracket 8 cm above the ground
      // platforms (fixed), walls and springs
      ground(ctx, P(0.3, 0)[0], P(B4.wall, 0)[0], P(0, pf1)[1]); wallR(ctx, P(B4.wall, 0)[0], P(0, L + 0.25)[1], P(0, pf1)[1]);
      ground(ctx, P(-B4.wall, 0)[0], P(-0.3, 0)[0], P(0, pf2)[1]); wallL(ctx, P(-B4.wall, 0)[0], P(0, L / 2 + 0.25)[1], P(0, pf2)[1]);
      spr(ctx, P(g.c1[0] + B4.cw / 2, L), P(B4.wall, L), 10, 8); spr(ctx, P(-B4.wall, L / 2), P(g.c2[0] - B4.cw / 2, L / 2), 10, 8);
      // carts on wheels; the wheels roll without slipping
      [[g.c1, 0.5, 1], [g.c2, -0.5, -1]].forEach(([cc, x0, sd]) => { rblock(ctx, F, cc[0], cc[1], B4.cw, B4.ch, 0, ''); lab(ctx, 'm', ...P(cc[0] + sd * 0.085, cc[1]));   // the link pin is at the centre, so the label sits on the far side
        const yb = P(0, cc[1] - h2)[1]; cartWheels(ctx, [P(cc[0] - 0.08, 0)[0], P(cc[0] + 0.08, 0)[0]], yb, S * B4.rw, (cc[0] - x0) / B4.rw); });
      // the light bar, pinned to a bracket on the ground; the links
      const O = P(0, 0), Tp = P(...g.T), Mp = P(...g.Mi);
      line(ctx, O[0], O[1], Tp[0], Tp[1], COL.massEdge, 12); line(ctx, O[0], O[1], Tp[0], Tp[1], '#d9dce2', 9);
      line(ctx, ...Tp, ...P(...g.c1), COL.fg, 2.2); line(ctx, ...Mp, ...P(...g.c2), COL.fg, 2.2);
      pin(ctx, O[0], O[1], S * 0.08); pinDot(ctx, ...Tp); pinDot(ctx, ...Mp); dot(ctx, ...P(...g.c1)); dot(ctx, ...P(...g.c2));
      lab(ctx, 'k', ...P((g.c1[0] + 0.15 + B4.wall) / 2, L + 0.12)); lab(ctx, 'k', ...P((g.c2[0] - 0.15 - B4.wall) / 2, L / 2 + 0.12));
      lab(ctx, 'L/2', ...P(-0.14, L * 0.75)); lab(ctx, 'L/2', ...P(-0.14, L * 0.22)); lab(ctx, 'O', O[0] + 16, O[1] - 12);
      const x0p = P(0.5, L + 0.2); line(ctx, x0p[0], P(0, L + h2)[1], x0p[0], x0p[1] - 4, COL.muted, 1, [4, 3]);
      const cx1 = P(g.c1[0], 0)[0]; if (Math.abs(cx1 - x0p[0]) > 8) arrow(ctx, x0p[0], x0p[1], cx1, x0p[1], COL.c3, 1.6); lab(ctx, 'x', (x0p[0] + cx1) / 2, x0p[1] - 12, { color: COL.c3 });
      xplot('x6b-4-plot', st.S, st.t);
      statsEvery(st, 'x6b-4-stats', () => [['x', jn(c.x, 3) + ' m'], ['bar angle', jn(g.ph / RAD, 3) + '°'], ['lower cart moves', jn(g.c2[0] + 0.5, 3) + ' m'],
        ['ω_n = √(k/m)', fmt(Math.sqrt(V.k / V.m), 3) + ' rad/s', true]]);
    }
  });

  subLabels();
})();
