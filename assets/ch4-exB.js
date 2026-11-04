/* =========================================================
   Chapter 4, Section B examples (work and energy for particles):
   animations for 4.B.1 to 4.B.8 (clips x4b-1 ... x4b-8).
   Every animation integrates the equation of motion of the system, and the
   energy bars are computed from the simulated state, so they check the work–energy principle.
   ========================================================= */
(function(){
  const GUS = 32.2;
  const lab = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: 'italic 15px Georgia, serif' }, o));
  const small = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: '12px system-ui', color: COL.muted }, o));
  const status = (ctx, s, x, y, col) => txt(ctx, s, x, y, { font: '600 13px system-ui', color: col || COL.fg });
  const dot = (ctx, x, y, c, r = 4) => { ctx.fillStyle = c || COL.fg; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); };
  const ball = (ctx, x, y, r) => { ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); };
  const rod = (ctx, x1, y1, x2, y2, w = 6) => { line(ctx, x1, y1, x2, y2, COL.massEdge, w + 3); line(ctx, x1, y1, x2, y2, COL.mass, w); };
  const ground = (ctx, x1, x2, y) => { line(ctx, x1, y, x2, y, COL.fg, 2); hatch(ctx, x2, y, x1, y, -1, 9, 7); };
  // a pin carried by a plate fixed to a back wall: the moving parts pass in front of it
  const wallPin = (ctx, x, y) => { ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.rect(x - 15, y - 15, 30, 30); ctx.fill(); ctx.stroke();
    [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + a, y + b, 1.8, 0, 2 * Math.PI); ctx.stroke(); }); ctx.restore(); pinDot(ctx, x, y); };
  // energy bars with headroom so the value labels never touch the title
  const bars = (ctx, n, items, max, title) => n ? ebars(ctx, 40, 470, 340, 170, items, max * 1.25, title) : ebars(ctx, 480, 70, 270, 230, items, max * 1.25, title);
  const holdDone = (st, wait = 1.8) => st.hold !== undefined && st.t > st.hold + wait;
  const jn = (v, d = 3) => fmt(Math.abs(v) < 1e-9 ? 0 : v, d);
  // integrate over dt in small RK steps, stopping exactly where the event function ev(s) reaches zero (from below)
  function adv(f, s, dt, ev, h = 0.0005){
    const n = Math.max(1, Math.ceil(dt / h)), hh = dt / n;
    for (let i = 0; i < n; i++){
      const s1 = rk(f, s, hh);
      if (ev(s1) >= 0){ let lo = 0, hi = hh; for (let k = 0; k < 40; k++){ const m = (lo + hi) / 2; if (ev(rk(f, s, m)) >= 0) hi = m; else lo = m; } return { s: rk(f, s, hi), hit: true }; }
      s = s1;
    }
    return { s, hit: false };
  }

  /* ---------------- 4.B.1: rod and particle turned by a normal force ---------------- */
  (function(){
    const L = 2;
    makeClip({
      id: 'x4b-1', speed: 0.5,
      controls: [
        { key: 'F', label: 'Force F', min: 0, max: 200, step: 1, value: 100, unit: 'N', dec: 0 },
        { key: 'm', label: 'Mass of P, m', min: 1, max: 12, step: 0.5, value: 6, unit: 'kg', dec: 1 }
      ],
      presets: C => [{ label: 'Book data', apply: () => C.set({ F: 100, m: 6 }) }, { label: 'Gravity only (F = 0)', apply: () => C.set({ F: 0 }) }, { label: 'Heavier particle', apply: () => C.set({ m: 12 }) }],
      reset(st){ st.s = [0, 0]; st.lastT = 0; st.hold = undefined; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st)) { st.t = 0; st.s = [0, 0]; st.lastT = 0; st.hold = undefined; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        const I = V.m * (0.6 * L) ** 2;
        const r = adv(s => [s[1], (V.F * 0.4 * L + V.m * G0 * 0.6 * L * Math.cos(s[0])) / I], st.s, dt, s => s[0] - Math.PI / 2);
        st.s = r.s; if (r.hit){ st.s[0] = Math.PI / 2; st.hold = st.t; }
      },
      draw(st){
        const cv = $('x4b-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 680), V = st.V, th = st.s[0], S = 92;
        fitView(ctx, w, h, n ? [0, 0, 420, 680] : [0, 0, 780, 380]);
        const ox = 230, oy = 150, c = Math.cos(th), s = Math.sin(th);
        const ex = ox + 0.4 * L * S * c, ey = oy - 0.4 * L * S * s, px = ox - 0.6 * L * S * c, py = oy + 0.6 * L * S * s;
        line(ctx, ox, oy, ox + 95, oy, COL.axis, 1, [4, 4]);
        ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, 52, -th, 0); ctx.stroke(); ctx.restore();
        if (th > 0.12) lab(ctx, 'θ', ox + 64 * Math.cos(th / 2), oy - 64 * Math.sin(th / 2), { color: COL.muted });
        // the path of P (quarter circle) and the start and end positions
        ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(ox, oy, 0.6 * L * S, Math.PI / 2, Math.PI); ctx.stroke(); ctx.restore();
        // the back plate stands on a post fixed to the floor, behind the plane of the rod (as in the 3D view)
        ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#c9c3b5'; ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.fillRect(ox - 8, oy + 12, 16, 300 - oy - 12); ctx.strokeRect(ox - 8, oy + 12, 16, 300 - oy - 12); ctx.restore();
        line(ctx, ox - 70, 300, ox + 70, 300, COL.fg, 2); hatch(ctx, ox + 70, 300, ox - 70, 300, -1);
        wallPin(ctx, ox, oy);
        rod(ctx, px, py, ex, ey, 6); pinDot(ctx, ox, oy); ball(ctx, px, py, 12);
        lab(ctx, 'O', ox - 4, oy - 26); lab(ctx, 'P', px - 22, py + 14);
        // F is normal to the rod at its end
        const fl = 0.55 * V.F; if (fl > 2) { arrow(ctx, ex + fl * s, ey + fl * c, ex, ey, COL.c1, 3); lab(ctx, 'F', ex + fl * s + 12, ey + fl * c, { color: COL.c1 }); }
        const w1 = st.s[1], v = 0.6 * L * Math.abs(w1), vl = Math.min(120, 9 * v);
        if (vl > 3) { arrow(ctx, px, py, px + vl * s, py + vl * c, COL.c3, 2.5); lab(ctx, 'v_P', px + vl * s + 10, py + vl * c + 12, { color: COL.c3 }); }
        small(ctx, 'O is pinned to a fixed back plate.', ox, 340);
        const UF = V.F * 0.4 * L * th, Ug = V.m * G0 * 0.6 * L * s, T = 0.5 * V.m * v * v, Emax = V.F * 0.4 * L * Math.PI / 2 + V.m * G0 * 0.6 * L;
        bars(ctx, n, [{ label: 'U of F', val: UF, color: COL.c1, num: fmt(UF, 3) }, { label: 'U of mg', val: Ug, color: COL.c2, num: fmt(Ug, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Math.max(Emax, 1), 'Work and kinetic energy (J)');
        if (st.hold !== undefined) status(ctx, 'θ = 90°: position 2 reached', n ? 210 : 230, 24, COL.c3);
        statsEvery(st, 'x4b-1-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['speed of P', fmt(v, 4) + ' m/s', true], ['U of F + U of mg', fmt(UF + Ug, 4) + ' J'], ['T', fmt(T, 4) + ' J']]);
      }
    });
  })();

  /* ---------------- 4.B.2: block on a rough incline sliding into a spring ---------------- */
  (function(){
    // spring free length 0.6 m: longer than the largest compression any slider setting can produce (0.49 m), so the block never reaches the stop
    const m = 5, th = Math.asin(0.8), sn = 0.8, cs = 0.6, l0 = 0.6;
    makeClip({
      id: 'x4b-2', speed: 0.5,
      controls: [
        { key: 'mu', label: 'Friction coefficient μ_k', min: 0, max: 1.5, step: 0.01, value: 0.3, dec: 2 },
        { key: 'd', label: 'Distance to the spring d', min: 0.2, max: 1.2, step: 0.01, value: 0.75, unit: 'm', dec: 2 },
        { key: 'k', label: 'Spring stiffness k', min: 550, max: 3000, step: 10, value: 1000, unit: 'N/m', dec: 0 }
      ],
      presets: C => [{ label: 'Book data', apply: () => C.set({ mu: 0.3, d: 0.75, k: 1000 }) }, { label: 'No friction', apply: () => C.set({ mu: 0 }) }, { label: 'Too rough to slide (μ_k = 1.4)', apply: () => C.set({ mu: 1.4 }) }],
      reset(st){ st.x = 0; st.v = 0; st.lastT = 0; st.hold = undefined; st.Wf = 0; st.cmax = 0; st.stuck = false; st.msg = ''; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 2)) { st.t = 0; st.x = 0; st.v = 0; st.lastT = 0; st.hold = undefined; st.Wf = 0; st.cmax = 0; st.stuck = false; st.msg = ''; } return; }
        const V = st.V; let dt = st.t - st.lastT; st.lastT = st.t;
        const N = m * G0 * cs, fmax = V.mu * N;
        const h = 0.00005;
        while (dt > 1e-9){
          const ds = Math.min(h, dt); dt -= ds;
          const c = Math.max(0, st.x - V.d), drive = m * G0 * sn - V.k * c;
          if (Math.abs(st.v) < 1e-6){ // at rest: does static friction hold the block?
            if (Math.abs(drive) <= fmax){ st.v = 0; if (st.t > 0.05 || st.x === 0){ st.stuck = true; } continue; }
            st.v = 1e-6 * Math.sign(drive);
          }
          const a = (drive - fmax * Math.sign(st.v)) / m, v1 = st.v + a * ds;
          if (Math.sign(v1) !== Math.sign(st.v) && v1 !== 0){ // the block stops during this substep
            const tt = Math.abs(st.v / a); st.x += st.v * tt / 2; st.Wf += fmax * Math.abs(st.v) * tt / 2; st.v = 0; continue; }
          const dx = (st.v + v1) / 2 * ds; st.x += dx; st.Wf += fmax * Math.abs(dx); st.v = v1;
          st.cmax = Math.max(st.cmax, st.x - V.d);
        }
        if (st.stuck){ st.hold = st.t; st.msg = st.x === 0 ? 'Friction is strong enough to hold the block: it does not slide.' : 'The block has come to rest.'; }
        else if (st.t > 7){ st.hold = st.t; }
      },
      draw(st){
        const cv = $('x4b-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 680), V = st.V; let S = 150;
        fitView(ctx, w, h, n ? [0, 0, 420, 680] : [0, 0, 780, 380]);
        // incline: the spring base (stop) sits at distance d + l0 down the slope from the start
        const ux = cs, uy = sn, L = V.d + l0 + 0.06; S = Math.min(260, 290 / (L * uy)); const x0 = 210 - (L * S * ux) / 2 - 20, y0 = 40;
        const P = s => [x0 + s * S * ux, y0 + s * S * uy];                     // point on the slope surface
        const nx = sn, ny = -cs;                                                  // outward normal (screen)
        const [ax, ay] = P(-0.15), [bx, by] = P(L);
        // incline body
        ctx.save(); ctx.fillStyle = '#e9e3d4'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(ax, by); ctx.closePath(); ctx.fill(); ctx.restore();
        line(ctx, ax, ay, bx, by, COL.fg, 2); ground(ctx, ax - 20, bx + 30, by);
        // stop at the bottom of the slope and the spring
        const [sx, sy] = P(V.d + l0); line(ctx, sx, sy, sx + 24 * nx * 2.2, sy + 24 * ny * 2.2, COL.fg, 4);
        const c = Math.max(0, st.x - V.d), [qx, qy] = P(V.d + c);
        springLine(ctx, sx + 14 * nx, sy + 14 * ny, qx + 14 * nx, qy + 14 * ny, 8, 7);
        line(ctx, qx + 2 * nx, qy + 2 * ny, qx + 30 * nx, qy + 30 * ny, COL.fg, 3);
        // predicted maximum compression
        const Fd = m * G0 * (sn - V.mu * cs), dpred = Fd > 0 ? (Fd + Math.sqrt(Fd * Fd + 2 * V.k * Fd * V.d)) / V.k : 0;
        if (Fd > 0){ const [gx, gy] = P(V.d + dpred); line(ctx, gx + 2 * nx, gy + 2 * ny, gx + 40 * nx, gy + 40 * ny, COL.c3, 2, [4, 3]); }
        // block (its front face is at x along the slope)
        const bw = 0.24 * S, bh = 0.16 * S, [fx, fy] = P(st.x - 0.12);
        block(ctx, fx + nx * bh / 2, fy + ny * bh / 2, bw, bh, th, 'm');
        // angle mark
        ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, 40, Math.PI, Math.PI + th); ctx.stroke(); ctx.restore();
        lab(ctx, 'θ', bx - 54, by - 20, { color: COL.muted });
        lab(ctx, 'k', sx + 20 * nx - 50, sy + 20 * ny - 10);
        const Ug = m * G0 * sn * st.x, Vs = 0.5 * V.k * c * c, T = 0.5 * m * st.v * st.v;
        const Emax = Fd > 0 ? m * G0 * sn * (V.d + dpred) : m * G0 * sn * V.d;
        bars(ctx, n, [{ label: 'U of mg', val: Ug, color: COL.c2, num: fmt(Ug, 3) }, { label: 'friction loss', val: st.Wf, color: RED, num: fmt(st.Wf, 3) }, { label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Math.max(Emax, 1), 'Energy (J)');
        if (st.msg) status(ctx, st.msg, n ? 210 : 390, n ? 440 : 352, st.x === 0 ? RED : COL.fg);
        statsEvery(st, 'x4b-2-stats', () => [['spring compression δ', fmt(c, 3) + ' m'], ['largest δ so far', fmt(Math.max(0, st.cmax), 4) + ' m', true], ['predicted δ_max', Fd > 0 ? fmt(dpred, 4) + ' m' : 'no sliding'], ['speed', fmt(Math.abs(st.v), 3) + ' m/s']]);
      }
    });
  })();

  /* ---------------- 4.B.3: particle launched vertically ---------------- */
  (function(){
    makeClip({
      id: 'x4b-3', speed: 1,
      controls: [
        { key: 'v0', label: 'Launch speed v_0', min: 2, max: 15, step: 0.1, value: 10, unit: 'm/s', dec: 1 },
        { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 1 }
      ],
      presets: C => [{ label: 'v_0 = 10 m/s', apply: () => C.set({ v0: 10 }) }, { label: 'Double the speed', apply: () => C.set({ v0: 15 }) }, { label: 'Heavier particle', apply: () => C.set({ m: 5 }) }],
      reset(st){ st.y = 0; st.v = st.V.v0; st.lastT = 0; st.hold = undefined; st.ymax = 0; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 1.2)) { st.t = 0; st.y = 0; st.v = st.V.v0; st.lastT = 0; st.hold = undefined; st.ymax = 0; } return; }
        const tt = st.t, V = st.V, T = 2 * V.v0 / G0;
        if (tt >= T){ st.y = 0; st.v = -V.v0; st.hold = st.t; return; }
        st.y = V.v0 * tt - 0.5 * G0 * tt * tt; st.v = V.v0 - G0 * tt; st.ymax = Math.max(st.ymax, st.y);
      },
      draw(st){
        const cv = $('x4b-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 680), V = st.V, H = V.v0 * V.v0 / (2 * G0);
        fitView(ctx, w, h, n ? [0, 0, 420, 680] : [0, 0, 780, 380]);
        // heights are measured from the launch point (the ball's centre as it leaves the launcher), as in the solution
        const gy = 340, top = 50, y0 = gy - 26 - 11, S = (y0 - top) / Math.max(H * 1.08, 1), x = 210;
        ground(ctx, 60, 360, gy);
        // launcher tube
        ctx.save(); ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = COL.muted; ctx.fillRect(x - 16, gy - 26, 32, 26); ctx.strokeRect(x - 16, gy - 26, 32, 26); ctx.restore();
        // height scale (y = 0 at the launch point)
        const stp = niceStep(H * 1.08, 5); line(ctx, 110, y0, 110, y0 - H * 1.08 * S, COL.axis, 1); line(ctx, 110, y0, x - 18, y0, COL.axis, 1, [2, 3]);
        for (let k = 0; k * stp <= H * 1.08 + 1e-9; k++){ const yy = y0 - k * stp * S; line(ctx, 104, yy, 110, yy, COL.axis, 1); small(ctx, fmt(k * stp, 3) + ' m', 82, yy); }
        const yh = y0 - H * S; line(ctx, 130, yh, 330, yh, COL.c3, 1.5, [5, 4]); lab(ctx, 'h', 342, yh, { color: COL.c3 });
        const by = y0 - st.y * S; ball(ctx, x, by, 11);
        const vl = 6 * st.v; if (Math.abs(vl) > 3) { arrow(ctx, x + 22, by, x + 22, by - vl, COL.c3, 2.5); lab(ctx, 'v', x + 36, by - vl / 2, { color: COL.c3 }); }
        const T = 0.5 * V.m * st.v * st.v, Vg = V.m * G0 * st.y, E = 0.5 * V.m * V.v0 * V.v0;
        bars(ctx, n, [{ label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }, { label: 'V = mgy', val: Vg, color: COL.c2, num: fmt(Vg, 3) }, { label: 'T + V', val: T + Vg, color: COL.c1, num: fmt(T + Vg, 4) }], E, 'Energy (J)');
        statsEvery(st, 'x4b-3-stats', () => [['height y', fmt(st.y, 3) + ' m'], ['speed', fmt(Math.abs(st.v), 3) + ' m/s'], ['highest point so far', fmt(st.ymax, 4) + ' m', true], ['v_0²/2g', fmt(H, 4) + ' m']]);
      }
    });
  })();

  /* ---------------- 4.B.4: block with a bumper spring hits a wall (U.S. units) ---------------- */
  (function(){
    const W = 3200, m = W / GUS, l0 = 1.5, bw = 4;
    makeClip({
      id: 'x4b-4', speed: 0.25,
      controls: [
        { key: 'v0', label: 'Speed v_0', min: 2, max: 20, step: 0.5, value: 10, unit: 'ft/s', dec: 1 },
        { key: 'k', label: 'Spring stiffness k', min: 20500, max: 120000, step: 250, value: 39750, unit: 'lb/ft', dec: 0 } // k ≥ 20 500 lb/ft keeps δ below the 1.5 ft spring length at 20 ft/s
      ],
      presets: C => [{ label: 'k from the solution', apply: () => C.set({ v0: 10, k: 39750 }) }, { label: 'Softer spring', apply: () => C.set({ k: 20500 }) }, { label: 'Twice as fast', apply: () => C.set({ v0: 20 }) }],
      reset(st){ st.x = -2; st.v = st.V.v0; st.lastT = 0; st.hold = undefined; st.cmax = 0; st.Fmax = 0; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 0.8)) { st.t = 0; st.x = -2; st.v = st.V.v0; st.lastT = 0; st.hold = undefined; st.cmax = 0; st.Fmax = 0; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        const f = s => { const c = Math.max(0, s[0]); return [s[1], -V.k * c / m]; };
        const s = stepN(f, [st.x, st.v], dt, 0.00005); st.x = s[0]; st.v = s[1];
        st.cmax = Math.max(st.cmax, st.x); st.Fmax = Math.max(st.Fmax, V.k * Math.max(0, st.x));
        if (st.x < -2 && st.v < 0){ st.x = -2; st.hold = st.t; } // back at the start: never drift past it, so the car stays on the drawn floor
      },
      draw(st){
        const cv = $('x4b-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 300, 600), V = st.V, S = 38;
        fitView(ctx, w, h, n ? [0, 0, 420, 600] : [0, 0, 780, 300]);
        const wx = 400, gy = 220, c = Math.max(0, st.x);
        // x is the compression coordinate: x = 0 when the spring end touches the wall
        const end = wx + Math.min(st.x, 0) * S, front = end - (l0 - c) * S, cx = front - bw * S / 2;
        ground(ctx, 10, wx, gy); line(ctx, wx, gy, wx, gy - 140, COL.fg, 3); hatch(ctx, wx, gy - 140, wx, gy, -1, 9, 7);
        block(ctx, cx, gy - 12 - 1.0 * S, bw * S, 2 * S, 0, '');
        lab(ctx, 'C', cx - bw * S / 2 + 16, gy - 12 - 1.6 * S);
        [cx - 1.2 * S, cx + 1.2 * S].forEach(x => { ctx.save(); ctx.fillStyle = COL.spring; ctx.beginPath(); ctx.arc(x, gy - 6, 6, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); });
        const sy = gy - 12 - 1.0 * S;
        springLine(ctx, front, sy, end - 3, sy, 7, 8); line(ctx, end - 3, sy - 14, end - 3, sy + 14, COL.fg, 3);
        lab(ctx, 'k', (front + end) / 2, sy - 24);
        const vl = 5 * st.v; if (Math.abs(vl) > 3) { arrow(ctx, cx, sy - 1.6 * S, cx + vl, sy - 1.6 * S, COL.c3, 2.5); lab(ctx, 'v', cx + vl + Math.sign(vl) * 12, sy - 1.6 * S - 2, { color: COL.c3 }); }
        if (c > 0) { const fl = Math.min(140, V.k * c / 120); arrow(ctx, wx - 1, sy + 26, wx - 1 - fl, sy + 26, COL.c1, 2.5); lab(ctx, 'kδ', wx - fl - 18, sy + 40, { color: COL.c1 }); }
        const T = 0.5 * m * st.v * st.v, Vs = 0.5 * V.k * c * c, E = 0.5 * m * V.v0 * V.v0;
        bars(ctx, n, [{ label: 'T', val: T, color: COL.c3, num: fmt(T, 4) }, { label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 4) }, { label: 'T + V_s', val: T + Vs, color: COL.c1, num: fmt(T + Vs, 4) }], E, 'Energy (ft·lb)');
        statsEvery(st, 'x4b-4-stats', () => [['compression δ', fmt(c * 12, 3) + ' in'], ['largest δ', fmt(st.cmax * 12, 4) + ' in', true], ['predicted Δ_max = v_0√(m/k)', fmt(V.v0 * Math.sqrt(m / V.k) * 12, 4) + ' in'], ['peak spring force', fmt(st.Fmax, 4) + ' lb']]);
      }
    });
  })();

  /* ---------------- 4.B.5: slider on a curved rod pulled by a constant cord tension ---------------- */
  (function(){
    // rod: circular arc through position 1 (0, 0), position 2 (1.2, 0.7) and the right foot (2.4, 0)
    const yc = (0.49 - 1.44) / 1.4, R = 0.7 - yc, xc = 1.2, TIP = [1.5, 0.3];
    const ps1 = Math.atan2(-yc, -1.2);                       // angle of position 1 seen from the center
    const pos = p => [xc + R * Math.cos(p), yc + R * Math.sin(p)];
    makeClip({
      id: 'x4b-5', speed: 0.5,
      controls: [
        { key: 'F', label: 'Cord tension F', min: 0, max: 40, step: 0.5, value: 20, unit: 'N', dec: 1 },
        { key: 'm', label: 'Mass m', min: 0.2, max: 2, step: 0.05, value: 0.6, unit: 'kg', dec: 2 }
      ],
      presets: C => [{ label: 'Book data', apply: () => C.set({ F: 20, m: 0.6 }) }, { label: 'Weaker pull (F = 6 N)', apply: () => C.set({ F: 6 }) }, { label: 'Heavier slider', apply: () => C.set({ m: 1.5 }) }],
      reset(st){ st.p = ps1; st.pd = 0; st.lastT = 0; st.hold = undefined; st.msg = ''; st.l1 = Math.hypot(TIP[0], TIP[1]); },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 2)) { st.t = 0; st.p = ps1; st.pd = 0; st.lastT = 0; st.hold = undefined; st.msg = ''; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        // generalized coordinate p (angle on the arc); speed = R |ṗ|; tangential force from F and mg
        const f = s => { const [x, y] = pos(s[0]), tx = -R * Math.sin(s[0]), ty = R * Math.cos(s[0]), dx = TIP[0] - x, dy = TIP[1] - y, L = Math.hypot(dx, dy);
          const Q = V.F * (dx * tx + dy * ty) / L - V.m * G0 * ty; return [s[1], Q / (V.m * R * R)]; };
        const r = adv(f, [st.p, st.pd], dt, s => Math.PI / 2 - s[0]); st.p = r.s[0]; st.pd = r.s[1];
        if (st.p > ps1){ st.p = ps1; st.pd = 0; st.hold = st.t; st.msg = st.t < 0.1 ? 'The slider cannot start: the pull along the rod is smaller than the weight component.' : 'The slider falls back to position 1 without reaching position 2.'; }
        else if (r.hit){ st.p = Math.PI / 2; st.hold = st.t; st.msg = 'Position 2 reached'; }
        else if (st.t > 8){ st.hold = st.t; st.msg = 'The slider does not reach position 2.'; }
      },
      draw(st){
        const cv = $('x4b-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 680), V = st.V, S = 155, X = x => 30 + x * S, Y = y => 290 - y * S;
        fitView(ctx, w, h, n ? [0, 0, 420, 680] : [0, 0, 780, 380]);
        ground(ctx, X(-0.1), X(2.5), Y(-0.08));
        // the rod and its two feet
        ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(X(xc), Y(yc), R * S, -ps1, -(Math.PI - ps1), false); ctx.stroke(); ctx.restore();
        [0, 2.4].forEach(x => { ctx.save(); ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.moveTo(X(x) - 16, Y(-0.08)); ctx.lineTo(X(x) - 9, Y(-0.02)); ctx.lineTo(X(x) + 9, Y(-0.02)); ctx.lineTo(X(x) + 16, Y(-0.08)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); });
        // guide post with its tip
        ctx.save(); ctx.fillStyle = '#cfcab9'; ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.moveTo(X(TIP[0]) - 9, Y(-0.08)); ctx.lineTo(X(TIP[0]) - 3, Y(TIP[1])); ctx.lineTo(X(TIP[0]) + 3, Y(TIP[1])); ctx.lineTo(X(TIP[0]) + 9, Y(-0.08)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        const [x, y] = pos(st.p), tx = -Math.sin(st.p), ty = Math.cos(st.p);
        // cord from P to the tip, then down to the hanging pull F
        const dl = (Math.hypot(TIP[0] - x, TIP[1] - y) - st.l1);    // cord taken up at the tip (negative)
        const endY = Y(TIP[1]) + 34 - dl * S * 0.3, tx0 = X(TIP[0]) + 4;
        cable(ctx, () => { ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(TIP[0]), Y(TIP[1]) - 2); ctx.lineTo(tx0, Y(TIP[1]) + 2); ctx.lineTo(tx0, endY); });
        if (V.F > 0.2) { arrow(ctx, tx0, endY, tx0, endY + 8 + 0.6 * V.F, RED, 3); lab(ctx, 'F', tx0 + 16, endY + 14, { color: RED }); }
        // positions 1 and 2
        [[0, 0, '1'], [1.2, 0.7, '2']].forEach(([a, b, s]) => { ctx.save(); ctx.strokeStyle = COL.muted; ctx.setLineDash([3, 3]); ctx.strokeRect(X(a) - 7, Y(b) - 7, 14, 14); ctx.restore(); small(ctx, s, X(a) - 18, Y(b) - 16, { font: '13px system-ui' }); });
        block(ctx, X(x), Y(y), 26, 16, -Math.atan2(ty, tx), '');
        lab(ctx, 'P', X(x) - 24 * ty - 6, Y(y) - 24 * tx - 6);
        const v = R * Math.abs(st.pd), vl = Math.min(100, 9 * v);
        if (vl > 3) { arrow(ctx, X(x), Y(y), X(x) - vl * tx, Y(y) + vl * ty, COL.c3, 2.5); }
        const lnow = Math.hypot(TIP[0] - x, TIP[1] - y), UF = V.F * (st.l1 - lnow), Ug = -V.m * G0 * y, T = 0.5 * V.m * v * v;
        const Emax = Math.max(V.F * (st.l1 - 0.5), V.m * G0 * 0.7, 1);
        bars(ctx, n, [{ label: 'U of F', val: UF, color: COL.c1, num: fmt(UF, 3) }, { label: 'U of mg', val: Ug, color: COL.c2, num: jn(Ug, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Emax, 'Work and kinetic energy (J)');
        if (st.msg) status(ctx, st.msg, n ? 210 : 390, n ? 445 : 24, st.msg.startsWith('Position') ? COL.c3 : RED);
        statsEvery(st, 'x4b-5-stats', () => [['height above position 1', fmt(y, 3) + ' m'], ['speed', fmt(v, 4) + ' m/s', true], ['cord shortening ℓ_1 − ℓ', fmt(st.l1 - lnow, 4) + ' m'], ['U of F + U of mg − T', jn(UF + Ug - T, 2) + ' J']]);
      }
    });
  })();

  /* ---------------- 4.B.6: falling particle E turns pulley O with two welded bars ---------------- */
  (function(){
    const r = 0.1, L = 0.5;
    makeClip({
      id: 'x4b-6', speed: 0.5,
      controls: [
        { key: 'mE', label: 'Mass of E, m_E', min: 10, max: 150, step: 1, value: 80, unit: 'kg', dec: 0 },
        { key: 'mB', label: 'Mass of B, m_B', min: 0, max: 40, step: 1, value: 20, unit: 'kg', dec: 0 },
        { key: 'mA', label: 'Mass of A, m_A', min: 0, max: 30, step: 0.5, value: 5, unit: 'kg', dec: 1 }
      ],
      presets: C => [{ label: 'Book data', apply: () => C.set({ mE: 80, mB: 20, mA: 5 }) }, { label: 'Without B', apply: () => C.set({ mB: 0 }) }, { label: 'Heavy A (it stops early)', apply: () => C.set({ mB: 0, mA: 20, mE: 40 }) }],
      reset(st){ st.s = [0, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 2)) { st.t = 0; st.s = [0, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        const M = V.mE * r * r + V.mB * L * L + V.mA * 4 * L * L;
        const rr = adv(s => [s[1], G0 * (V.mE * r + V.mB * L * Math.cos(s[0]) - 2 * V.mA * L * Math.sin(s[0])) / M], st.s, dt, s => s[0] - Math.PI / 2);
        st.s = rr.s;
        if (rr.hit){ st.s[0] = Math.PI / 2; st.hold = st.t; st.msg = 'θ = 90°: position 2 reached'; }
        else if (st.s[1] < 0 && st.t > 0.1){ st.hold = st.t; st.msg = 'The system stops before θ = 90°.'; }
        else if (st.t > 8) st.hold = st.t;
      },
      draw(st){
        const cv = $('x4b-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 400, 700), V = st.V, th = st.s[0], S = 180;
        fitView(ctx, w, h, n ? [0, 0, 420, 700] : [0, 0, 780, 400]);
        const cy = 60, ox = 225, cx = 40, rp = r * S, c = Math.cos(th), s = Math.sin(th);
        line(ctx, 10, 18, 400, 18, COL.fg, 2); hatch(ctx, 400, 18, 10, 18, 1, 9, 7);
        [cx, ox].forEach(x => { ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10, 18); ctx.lineTo(x - 4, cy); ctx.lineTo(x + 4, cy); ctx.lineTo(x + 10, 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); });
        // pulleys
        [cx, ox].forEach(x => pulley(ctx, x, cy, rp));
        const mk = th + Math.PI / 2; line(ctx, ox, cy, ox + rp * 0.9 * Math.cos(mk), cy - rp * 0.9 * Math.sin(mk), COL.c2, 3);
        // bars (A on OA of length 2L, B on OB of length L), angle θ from the downward vertical, counterclockwise
        const ax = ox + 2 * L * S * s, ay = cy + 2 * L * S * c, bx = ox - L * S * c, by = cy + L * S * s;
        rod(ctx, ox, cy, ax, ay, 6); rod(ctx, ox, cy, bx, by, 6); pinDot(ctx, ox, cy); pinDot(ctx, cx, cy);
        ball(ctx, ax, ay, 11); ball(ctx, bx, by, 10);
        // cable: top of O to top of C, over C, down to E
        const yE = cy + 0.55 * S + r * th * S;
        cable(ctx, () => { ctx.moveTo(ox, cy - rp); ctx.lineTo(cx, cy - rp); ctx.arc(cx, cy, rp, -Math.PI / 2, Math.PI, true); ctx.lineTo(cx - rp, yE - 14); });
        block(ctx, cx - rp, yE, 34, 28, 0, 'E');
        lab(ctx, 'A', ax + 20, ay + 4); lab(ctx, 'B', bx - 6, by + 22); lab(ctx, 'O', ox + 22, cy - 14); lab(ctx, 'C', cx + 24, cy + 4);
        line(ctx, ox, cy, ox, cy + 75, COL.axis, 1, [4, 4]);
        if (th > 0.15) { ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, cy, 60, Math.PI / 2 - th, Math.PI / 2); ctx.stroke(); ctx.restore(); lab(ctx, 'θ', ox + 72 * Math.sin(th / 2), cy + 72 * Math.cos(th / 2), { color: COL.muted }); }
        const w1 = st.s[1], vE = r * w1, T = 0.5 * (V.mE * r * r + V.mB * L * L + V.mA * 4 * L * L) * w1 * w1;
        const UE = V.mE * G0 * r * th, UB = V.mB * G0 * L * s, UA = -V.mA * G0 * 2 * L * (1 - c);
        const Emax = Math.max(V.mE * G0 * r * Math.PI / 2 + V.mB * G0 * L, 1);
        bars(ctx, n, [{ label: 'U of m_E g', val: UE, color: COL.c2, num: fmt(UE, 3) }, { label: 'U of m_B g', val: UB, color: COL.c5, num: fmt(UB, 3) }, { label: 'U of m_A g', val: UA, color: RED, num: jn(UA, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Emax, 'Work and kinetic energy (J)');
        if (st.msg) status(ctx, st.msg, n ? 210 : 600, n ? 445 : 352, st.msg.startsWith('θ') ? COL.c3 : RED);
        statsEvery(st, 'x4b-6-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['v_E', fmt(Math.abs(vE), 4) + ' m/s', true], ['v_A', fmt(Math.abs(2 * L * w1), 4) + ' m/s'], ['v_B', fmt(Math.abs(L * w1), 4) + ' m/s']]);
      }
    });
  })();

  /* ---------------- 4.B.7: bar AB launched by two springs under A ---------------- */
  (function(){
    const L = 0.1, th1 = Math.atan2(3, 4);
    makeClip({
      id: 'x4b-7', speed: 0.5,
      controls: [
        { key: 'k', label: 'Stiffness of each spring k', min: 10, max: 300, step: 1, value: 100, unit: 'N/m', dec: 0 },
        { key: 'mB', label: 'Mass of B', min: 10, max: 40, step: 0.5, value: 20, unit: 'kg', dec: 1 }
      ],
      presets: C => [{ label: 'Book data (m_B = 2m)', apply: () => C.set({ k: 100, mB: 20 }) }, { label: 'Figure label (m_B = 3m)', apply: () => C.set({ mB: 30 }) }, { label: 'Weak springs', apply: () => C.set({ k: 25, mB: 20 }) }],
      reset(st){ st.s = [th1, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 2)) { st.t = 0; st.s = [th1, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; } return; }
        const V = st.V, m = 10, dt = st.t - st.lastT; st.lastT = st.t;
        const I = m * 4 * L * L + V.mB * L * L;
        // θ is measured below the horizontal for A; V(θ) = −2mgL sinθ + m_B gL sinθ + k(2L sinθ)² while θ > 0
        const f = s => { const t = s[0], dV = -2 * m * G0 * L * Math.cos(t) + V.mB * G0 * L * Math.cos(t) + (t > 0 ? 2 * V.k * (2 * L * Math.sin(t)) * (2 * L * Math.cos(t)) : 0); return [s[1], -dV / I]; };
        const r = adv(f, st.s, dt, s => -Math.PI / 2 - s[0], 0.0002);
        st.s = r.s;
        if (r.hit){ st.s[0] = -Math.PI / 2; st.hold = st.t; st.msg = 'A is directly above O: position 2'; }
        else if (st.t > 8){ st.hold = st.t; st.msg = 'A does not reach the top.'; }
      },
      draw(st){
        const cv = $('x4b-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 400, 700), V = st.V, th = st.s[0], S = 850;
        fitView(ctx, w, h, n ? [0, 0, 420, 700] : [0, 0, 780, 400]);
        const ox = 170, oy = 200, gy = oy + 0.21 * S, c = Math.cos(th), s = Math.sin(th);
        const ax = ox + 2 * L * S * c, ay = oy + 2 * L * S * s, bx = ox - L * S * c, by = oy - L * S * s;
        ground(ctx, 20, 400, gy);
        // post behind the bar carrying the pin O
        ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.rect(ox - 8, oy, 16, gy - oy); ctx.fill(); ctx.stroke(); ctx.restore();
        // spring platform under A: it follows A down to the compressed position and stops at the unstretched height
        const pl = Math.max(0, 2 * L * Math.sin(Math.max(th, 0))), py = oy + 11 + pl * S, px0 = ox + 0.13 * S, px1 = ox + 0.25 * S;
        [px0 + 14, px1 - 14].forEach(x => springLine(ctx, x, gy, x, py + 4, 7, 7));
        line(ctx, px0, py + 3, px1, py + 3, COL.fg, 4);
        // positions 1 and 2 (dashed circles)
        ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(ox, oy - 2 * L * S, 11, 0, 2 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(ox, oy, 2 * L * S, -Math.PI / 2, th1); ctx.stroke(); ctx.restore();
        small(ctx, '2', ox + 22, oy - 2 * L * S - 6, { font: '13px system-ui' });
        rod(ctx, bx, by, ax, ay, 6); pinDot(ctx, ox, oy); ball(ctx, ax, ay, 11); ball(ctx, bx, by, 13);
        lab(ctx, 'A', ax + 18 * c + 8, ay + 18 * s - 6); lab(ctx, 'B', bx - 22 * c, by - 22 * s - 8); lab(ctx, 'O', ox - 18, oy - 18);
        const w1 = st.s[1], m = 10, T = 0.5 * (m * 4 * L * L + V.mB * L * L) * w1 * w1, Vs = pl > 0 ? V.k * pl * pl : 0;
        const Vg = m * G0 * (-2 * L * s) + V.mB * G0 * (L * s), Vg1 = m * G0 * (-2 * L * Math.sin(th1)) + V.mB * G0 * (L * Math.sin(th1));
        const Vs1 = V.k * (2 * L * Math.sin(th1)) ** 2;
        bars(ctx, n, [{ label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 3) }, { label: 'ΔV_g', val: Vg - Vg1, color: COL.c2, num: jn(Vg - Vg1, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Math.max(Vs1, Math.abs(Vg1) * 2, 1), 'Energy (J)');
        if (st.msg) status(ctx, st.msg, n ? 210 : 600, n ? 445 : 352, st.msg.startsWith('A is') ? COL.c3 : RED);
        statsEvery(st, 'x4b-7-stats', () => [['θ (A below the horizontal)', fmt(th / RAD, 3) + '°'], ['v_A', fmt(Math.abs(2 * L * w1), 4) + ' m/s', true], ['v_B', fmt(Math.abs(L * w1), 4) + ' m/s'], ['spring compression', fmt(pl * 1000, 3) + ' mm']]);
      }
    });
  })();

  /* ---------------- 4.B.8: block driven up a smooth slot against a spring ---------------- */
  (function(){
    const m = 5, d = 0.2, sn = 0.8, cs = 0.6, h0 = 0.15;
    makeClip({
      id: 'x4b-8', speed: 0.25,
      controls: [
        { key: 'F', label: 'Horizontal force F', min: 0, max: 400, step: 1, value: 300, unit: 'N', dec: 0 },
        { key: 'k', label: 'Spring stiffness k', min: 0, max: 2000, step: 5, value: 50, unit: 'N/m', dec: 0 }
      ],
      presets: C => [{ label: 'Book data', apply: () => C.set({ F: 300, k: 50 }) }, { label: 'F = 66 N (just moves)', apply: () => C.set({ F: 66, k: 50 }) }, { label: 'Stiff spring (k = 1500 N/m)', apply: () => C.set({ F: 300, k: 1500 }) }],
      reset(st){ st.s = [0, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; st.smax = 0; },
      step(st){
        if (st.hold !== undefined){ if (holdDone(st, 2)) { st.t = 0; st.s = [0, 0]; st.lastT = 0; st.hold = undefined; st.msg = ''; st.smax = 0; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        const acc = s => { const l = Math.hypot(h0, s); return (V.F * cs - m * G0 * sn - V.k * (l - h0) * s / l) / m; };
        if (st.s[0] <= 0 && st.s[1] <= 0 && acc(0) <= 0){ st.s = [0, 0]; st.hold = st.t; st.msg = 'F is too small to move the block up the slot, so it stays at position 1.'; return; }
        const r = adv(s => [s[1], acc(s[0])], st.s, dt, s => s[0] - d, 0.0002); st.s = r.s; st.smax = Math.max(st.smax, st.s[0]);
        if (r.hit){ st.s[0] = d; st.hold = st.t; st.msg = 'A is directly above O: position 2'; }
        else if (st.s[0] < 0){ st.s = [0, 0]; st.hold = st.t; st.msg = 'A turns back before position 2 and returns to position 1.'; }
        else if (st.t > 8){ st.hold = st.t; }
      },
      draw(st){
        const cv = $('x4b-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 400, 700), V = st.V, S = 900, sp = st.s[0];
        fitView(ctx, w, h, n ? [0, 0, 420, 700] : [0, 0, 780, 400]);
        const ox = 250, oy = 345, X = (x, y) => [ox + x * S, oy - y * S];
        const p1 = [-cs * 0 - sn * h0, cs * h0];                       // position 1 = O + h0 * n, n = (−0.8, 0.6)
        const P = s => [p1[0] + s * cs, p1[1] + s * sn];
        // slot: two walls on either side of the line through P(−0.1) … P(0.32)
        const nx = -sn, ny = cs, gap = 0.032;
        [[-1], [1]].forEach(([sg]) => { const a = P(-0.12), b = P(0.32); const [x1, y1] = X(a[0] + sg * gap * nx, a[1] + sg * gap * ny), [x2, y2] = X(b[0] + sg * gap * nx, b[1] + sg * gap * ny);
          line(ctx, x1, y1, x2, y2, COL.fg, 2); hatch(ctx, sg > 0 ? x1 : x2, sg > 0 ? y1 : y2, sg > 0 ? x2 : x1, sg > 0 ? y2 : y1, -1, 9, 6); });
        // end stop at the lower end of the slot
        { const a = P(-0.035 - 0.012); const [x1, y1] = X(a[0] - gap * nx, a[1] - gap * ny), [x2, y2] = X(a[0] + gap * nx, a[1] + gap * ny); line(ctx, x1, y1, x2, y2, COL.fg, 3); }
        // anchor O on a small base on the ground
        ground(ctx, ox - 60, ox + 60, oy + 14); pin(ctx, ox, oy, 14);
        // position 2 (dashed spring) and the block
        const p2 = P(d), [q2x, q2y] = X(p2[0], p2[1]);
        line(ctx, ox, oy, q2x, q2y, COL.axis, 1, [4, 4]); small(ctx, '2', q2x + 26, q2y - 18, { font: '13px system-ui' });
        const [p1x, p1y] = X(p1[0], p1[1]); small(ctx, '1', p1x - 30, p1y - 26, { font: '13px system-ui' });
        const pp = P(sp), [bx, by] = X(pp[0], pp[1]);
        springLine(ctx, ox, oy, bx, by, 9, 6);
        block(ctx, bx, by, 0.07 * S, 0.05 * S, -Math.atan2(sn, cs), 'A');
        if (V.F > 1) { const fl = Math.min(110, 0.3 * V.F); arrow(ctx, bx - 34 - fl, by, bx - 34, by, RED, 3); lab(ctx, 'F', bx - 46 - fl, by - 4, { color: RED }); }
        lab(ctx, 'O', ox + 18, oy + 4); lab(ctx, 'k', (ox + bx) / 2 + 16, (oy + by) / 2 + 6);
        const l = Math.hypot(h0, sp), UF = V.F * cs * sp, Ug = -m * G0 * sn * sp, Vs = 0.5 * V.k * (l - h0) ** 2, T = 0.5 * m * st.s[1] ** 2;
        bars(ctx, n, [{ label: 'U of F', val: UF, color: RED, num: fmt(UF, 3) }, { label: 'U of mg', val: Ug, color: COL.c2, num: jn(Ug, 3) }, { label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 3) }, { label: 'T', val: T, color: COL.c3, num: fmt(T, 3) }], Math.max(V.F * cs * d, m * G0 * sn * d, 1), 'Work and energy (J)');
        if (st.msg) status(ctx, st.msg, n ? 210 : 600, n ? 445 : 352, st.msg.startsWith('A is') ? COL.c3 : RED);
        statsEvery(st, 'x4b-8-stats', () => [['distance up the slot s', fmt(sp * 1000, 3) + ' mm'], ['speed of A', fmt(Math.abs(st.s[1]), 4) + ' m/s', true], ['spring stretch', fmt((l - h0) * 1000, 3) + ' mm'], ['U of F + U of mg − ΔV_s − T', jn(UF + Ug - Vs - T, 2) + ' J']]);
      }
    });
  })();

  subLabels();
})();
