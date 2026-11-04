/* =========================================================
   Chapter 6, Section B examples 6.B.5 – 6.B.10 (free response).
   Every animation integrates the equation of motion of the system with RK4 and plots the response as it happens.
   Geometry is drawn to scale (one px-per-metre scale per picture). Piston strokes, spring lengths and
   clearances are chosen so that no body ever overlaps another over the whole slider range.
   ========================================================= */
(function(){
  const lab = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: 'italic 15px Georgia, serif' }, o));
  const small = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: '12px system-ui', color: COL.muted }, o));
  const status = (ctx, s, x, y, col) => txt(ctx, s, x, y, { font: '600 13px system-ui', color: col || COL.fg });
  const dash = (ctx, x1, y1, x2, y2, col) => line(ctx, x1, y1, x2, y2, col || COL.axis, 1, [4, 4]);
  const mmf = v => (Math.abs(v) < 5e-6 ? 0 : v * 1000).toFixed(2) + ' mm';   // fixed decimals, no scientific notation

  // dashpot between a fixed end F (cylinder) and a moving end M (rod). cyl, rod and the lead are in px.
  // The piston sits at a distance |FM| − rod from F; callers choose cyl and rod so it always stays inside the cylinder.
  function dashpot(ctx, fx, fy, mx, my, cyl, rod, hw = 7, lead = 6){
    const L = Math.hypot(mx - fx, my - fy); if (L < 1e-6) return;
    const ux = (mx - fx) / L, uy = (my - fy) / L, nx = -uy, ny = ux, P = (s, t) => [fx + ux * s + nx * t, fy + uy * s + ny * t];
    ctx.save(); ctx.strokeStyle = COL.spring; ctx.lineWidth = 2; ctx.lineCap = 'butt';
    const seg = (a, b) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
    seg(P(0, 0), P(lead, 0));
    ctx.beginPath(); ctx.moveTo(...P(lead + cyl, -hw)); ctx.lineTo(...P(lead, -hw)); ctx.lineTo(...P(lead, hw)); ctx.lineTo(...P(lead + cyl, hw)); ctx.stroke();
    const ps = L - rod; ctx.lineWidth = 3.2; seg(P(ps, -hw + 2.5), P(ps, hw - 2.5)); ctx.lineWidth = 2; seg(P(ps, 0), P(L, 0));
    ctx.restore();
  }
  // fixed anchor plate for a spring or dashpot end on a hatched surface (drawn by the caller)
  const anchor = (ctx, x, y, w = 14) => line(ctx, x - w / 2, y, x + w / 2, y, COL.fg, 3);
  const floorH = (ctx, x1, x2, y) => hatch(ctx, x1, y, x2, y, 1, 8, 6);          // hatching below
  const ceilH = (ctx, x1, x2, y) => hatch(ctx, x2, y, x1, y, 1, 8, 6);           // hatching above
  const wallL = (ctx, x, y1, y2) => hatch(ctx, x, y1, x, y2, 1, 8, 6);           // wall on the left, hatching to the left
  const wallR = (ctx, x, y1, y2) => hatch(ctx, x, y2, x, y1, 1, 8, 6);           // wall on the right, hatching to the right

  /* Free-response clip: integrates m ẍ + c ẋ + k x = 0 (or the rotational analogue) and keeps the history for the plot.
     o.sys(V) -> { m, c, k }, o.init(V) -> [x0, v0], o.T(V, sys) -> plot window (s), o.u -> plot unit factor and label. */
  function freeClip(o){
    makeClip({
      id: o.id, speed: o.speed ?? 0.25, controls: o.controls, presets: o.presets,
      reset(st){ const S = o.sys(st.V); st.S = S; st.s = o.init(st.V, S); st.hist = [[0, st.s[0]]]; st.Tw = o.T(st.V, S); st.lastT = 0; },
      step(st){
        const dt = st.t - st.lastT; st.lastT = st.t; const { m, c, k } = st.S;
        if (st.t > st.Tw + 0.6){ st.t = 0; st.lastT = 0; st.s = o.init(st.V, st.S); st.hist = [[0, st.s[0]]]; return; }
        if (st.t > st.Tw) return;                                     // hold the end of the record for a moment
        st.s = stepN(s => [s[1], -(c * s[1] + k * s[0]) / m], st.s, dt, 0.0004);
        st.hist.push([st.t, st.s[0]]);
      },
      draw(st){
        o.draw(st);
        const { m, c, k } = st.S, wn = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m)), [x0, v0] = o.init(st.V, st.S), U = o.unit[0];
        const A = Math.sqrt(x0 * x0 + m * v0 * v0 / k); let lim = A;
        const series = [{ pts: st.hist.map(p => [p[0], p[1] * U]), color: COL.c1, width: 2.2 }];
        if (z > 0 && z < 1){
          const wd = wn * Math.sqrt(1 - z * z), X = Math.sqrt(x0 * x0 + ((v0 + z * wn * x0) / wd) ** 2); lim = Math.max(lim, X);
          const env = []; for (let i = 0; i <= 200; i++){ const t = st.Tw * i / 200; env.push([t, X * Math.exp(-z * wn * t) * U]); }
          series.unshift({ pts: env, color: COL.c5, dash: [5, 4], width: 1.4 }, { pts: env.map(p => [p[0], -p[1]]), color: COL.c5, dash: [5, 4], width: 1.4 });
        }
        lim = Math.max(lim * U * 1.12, 1e-9);
        plot($(o.id + '-plot'), { xmin: 0, xmax: st.Tw, ymin: -lim, ymax: lim, xlabel: 't (s)', ylabel: o.unit[1], series,
          vlines: [{ x: Math.min(st.t, st.Tw), color: COL.c2 }].concat(o.vlines ? o.vlines(st) : []) });
        if (o.stats) statsEvery(st, o.id + '-stats', () => o.stats(st, wn, z));
      }
    });
  }

  /* ---------------- 6.B.5: pulley with a hanging block and two springs ----------------
     Inner radius r = 0.1 m (block m on the left, spring k1 on the right), outer radius 4r = 0.4 m (spring k2 at the top).
     θ is counterclockwise. The block moves down by rθ, k1 stretches by rθ and k2 stretches by 4rθ. */
  (function(){
    const r = 0.1, S = 300;                                   // px per metre
    const statics = V => { const W = V.m * G0; return { T1: W / 2, T2: W / 8 }; }; // installation: each spring carries half of the weight's moment
    const thMax = V => { const s = statics(V); return 0.95 * Math.min(s.T1 / (V.k1 * r), s.T2 / (4 * r * V.k2)); };
    freeClip({
      id: 'x6b-5', speed: 0.5, unit: [1 / RAD, 'θ (degrees)'],
      controls: [
        { key: 'I', label: 'Pulley inertia I_O', min: 0.2, max: 1.5, step: 0.05, value: 0.6, unit: 'kg·m²', dec: 2 },
        { key: 'm', label: 'Block mass m', min: 5, max: 30, step: 1, value: 20, unit: 'kg', dec: 0 },
        { key: 'k1', label: 'Lower spring k_1', min: 300, max: 3000, step: 50, value: 1000, unit: 'N/m', dec: 0 },
        { key: 'k2', label: 'Upper spring k_2', min: 50, max: 600, step: 10, value: 200, unit: 'N/m', dec: 0 },
        { key: 'th0', label: 'Initial rotation θ_0', min: 2, max: 20, step: 0.5, value: 12, unit: '°', dec: 1 }
      ],
      presets: C => [{ label: 'Stiff k_2', apply: () => C.set({ k2: 600, th0: 6 }) }, { label: 'Heavy pulley', apply: () => C.set({ I: 1.5 }) }, { label: 'Book layout, default values', apply: () => C.set(C.defaults) }],
      sys: V => ({ m: V.I + V.m * r * r, c: 0, k: (V.k1 + 16 * V.k2) * r * r }),
      init: V => [Math.min(V.th0 * RAD, thMax(V)), 0],
      T: (V, s) => Math.min(8, 4 * 2 * Math.PI / Math.sqrt(s.k / s.m)),
      draw(st){
        const cv = $('x6b-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        nar(cv, w, 380, 330); fitView(ctx, w, h, [20, 20, 640, 520]);
        const V = st.V, th = st.s[0], Ox = 200, Oy = 170, R = 4 * r * S, ri = r * S, yF = 500;
        floorH(ctx, 40, 600, yF);
        // pedestal behind the pulley (narrow, so it never shows through the block or spring k1)
        ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(Ox - 6, Oy); ctx.lineTo(Ox + 6, Oy); ctx.lineTo(Ox + 8, yF - 8); ctx.lineTo(Ox + 16, yF - 8); ctx.lineTo(Ox + 16, yF); ctx.lineTo(Ox - 16, yF); ctx.lineTo(Ox - 16, yF - 8); ctx.lineTo(Ox - 8, yF - 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        // pulley: outer and inner discs, rotation mark
        ctx.save(); ctx.fillStyle = '#d9dbe0'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Ox, Oy, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#eceef2'; ctx.beginPath(); ctx.arc(Ox, Oy, ri, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
        const ma = -Math.PI / 4 - th; line(ctx, Ox + (ri + 6) * Math.cos(ma), Oy + (ri + 6) * Math.sin(ma), Ox + (R - 6) * Math.cos(ma), Oy + (R - 6) * Math.sin(ma), COL.c2, 4);
        pinDot(ctx, Ox, Oy);
        // spring k2: cable leaves the top of the outer disc horizontally, spring to the wall on the right
        const xw = Ox + 1.2 * S, ys = Oy - R, xs = Ox + 0.45 * S - 4 * r * th * S;
        line(ctx, Ox, ys, xs, ys, COL.fg, 2.4); springLine(ctx, xs, ys, xw, ys, 9, 8); wallR(ctx, xw, ys - 45, ys + 45);
        // block m on the left of the inner drum: moves down by rθ
        const yTop = Oy + 0.45 * S + r * th * S, bs = 0.12 * S;
        line(ctx, Ox - ri, Oy, Ox - ri, yTop, COL.fg, 2.4); block(ctx, Ox - ri, yTop + bs / 2, bs, bs, 0, 'm');
        // spring k1 on the right of the inner drum: its top moves up by rθ
        const yc = Oy + 0.6 * S - r * th * S;              // the spring starts below the outer disc
        line(ctx, Ox + ri, Oy, Ox + ri, yc, COL.fg, 2.4); springLine(ctx, Ox + ri, yc, Ox + ri, yF, 10, 7); anchor(ctx, Ox + ri, yF, 12);
        // labels and the θ arrow
        lab(ctx, 'O', Ox + 14, Oy - 12); lab(ctx, 'k_2', (xs + xw) / 2, ys - 22); lab(ctx, 'k_1', Ox + ri + 24, (yc + yF) / 2);
        ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Ox, Oy, R + 18, -Math.PI * 0.85, -Math.PI * 0.6); ctx.stroke(); ctx.restore();
        arrow(ctx, Ox + (R + 18) * Math.cos(-Math.PI * 0.62), Oy + (R + 18) * Math.sin(-Math.PI * 0.62), Ox + (R + 18) * Math.cos(-Math.PI * 0.86), Oy + (R + 18) * Math.sin(-Math.PI * 0.86), COL.c4, 2);
        lab(ctx, 'θ', Ox - R - 30, Oy - R + 10, { color: COL.c4 });
        small(ctx, 'r = 0.1 m, outer radius 4r = 0.4 m', 430, 470);
        if (V.th0 * RAD > thMax(V) + 1e-9) status(ctx, 'θ_0 reduced to ' + fmt(thMax(V) / RAD, 3) + '° so that both cables stay taut', 430, 440, RED);
      },
      stats(st, wn){ const V = st.V; return [['θ', (st.s[0] / RAD).toFixed(2) + '°'], ['block displacement rθ', mmf(r * st.s[0])], ['ω_n', fmt(wn, 4) + ' rad/s', true], ['period', fmt(2 * Math.PI / wn, 4) + ' s']]; }
    });
  })();

  /* ---------------- 6.B.6: block hanging from a spring, dashpot to the floor ----------------
     Heights in metres measured down from the ceiling: unstretched spring L0 = 0.12 m, block 0.05 m tall, floor at 0.50 m.
     The rod (0.20 m) hangs from the block; the cylinder (0.20 m) stands on the floor. Over the whole slider range the piston
     stays at least 9 mm inside the cylinder and the block stays above the cylinder. */
  (function(){
    const S = 700, L0 = 0.12, hb = 0.05, yF = 0.5, rod = 0.2, cyl = 0.2, lead = 0.01, top = 0.03;
    freeClip({
      id: 'x6b-6', speed: 0.25, unit: [1000, 'x (mm)'],
      controls: [
        { key: 'm', label: 'Mass m', min: 0.1, max: 0.5, step: 0.01, value: 0.25, unit: 'kg', dec: 2 },
        { key: 'k', label: 'Stiffness k', min: 100, max: 300, step: 5, value: 100, unit: 'N/m', dec: 0 },
        { key: 'c', label: 'Damping c', min: 0, max: 20, step: 0.1, value: 2, unit: 'kg/s', dec: 1 },
        { key: 'x0', label: 'Initial position x_0 (from equilibrium)', min: -50, max: 50, step: 0.5, value: -24.5, unit: 'mm', dec: 1 }
      ],
      presets: (C, st) => [{ label: 'Release at the unstretched length', apply: () => C.set({ x0: -1000 * st.V.m * G0 / st.V.k }) },
        { label: 'Pull down 20 mm', apply: () => C.set({ x0: 20 }) }, { label: 'Critical damping', apply: () => C.set({ c: +(2 * Math.sqrt(st.V.k * st.V.m)).toFixed(1) }) }],
      sys: V => ({ m: V.m, c: V.c, k: V.k }),
      init: V => [V.x0 / 1000, 0],
      T: (V, s) => 6 * 2 * Math.PI / Math.sqrt(s.k / s.m),
      draw(st){
        const cv = $('x6b-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 380); fitView(ctx, w, h, n ? [0, 0, 420, 400] : [-40, 0, 560, 400]);
        const V = st.V, x = st.s[0], dst = V.m * G0 / V.k, Y = v => top * S + v * S, cx = 150;
        ceilH(ctx, cx - 70, cx + 70, Y(0)); floorH(ctx, cx - 70, cx + 70, Y(yF));
        const yb = L0 + dst + x;                                 // top of the block
        springLine(ctx, cx, Y(0), cx, Y(yb), 10, 9); anchor(ctx, cx, Y(0), 12);
        dashpot(ctx, cx, Y(yF), cx, Y(yb + hb), cyl * S, rod * S, 9, lead * S); anchor(ctx, cx, Y(yF), 14);
        block(ctx, cx, Y(yb + hb / 2), 0.1 * S, hb * S, 0, 'm');
        // reference lines: unstretched length and static equilibrium
        const xr = cx + 0.1 * S / 2 + 10;
        // reference marks start beside the block, so they never cross it
        dash(ctx, xr, Y(L0), xr + 160, Y(L0), COL.c5); small(ctx, 'unstretched length', xr + 104, Y(L0) - 9);
        dash(ctx, xr, Y(L0 + dst), xr + 160, Y(L0 + dst), COL.c3); small(ctx, 'static equilibrium', xr + 104, Y(L0 + dst) + 11, { color: COL.c3 });
        line(ctx, xr + 12, Y(L0), xr + 12, Y(L0 + dst), COL.c3, 1.5); lab(ctx, 'δ_st', xr + 32, Y(L0 + dst / 2), { color: COL.c3, font: 'italic 14px Georgia, serif' });
        lab(ctx, 'k', cx - 26, Y(yb / 2)); lab(ctx, 'c', cx - 26, Y(yF - 0.1));
        arrow(ctx, cx + 90, Y(L0 + dst) + 30, cx + 90, Y(L0 + dst) + 62, COL.c1, 2); lab(ctx, 'x', cx + 104, Y(L0 + dst) + 52, { color: COL.c1 });
      },
      stats(st, wn, z){ const V = st.V; return [['x', mmf(st.s[0])], ['δ_st = mg/k', fmt(V.m * G0 / V.k * 1000, 3) + ' mm', true], ['ω_n', fmt(wn, 4) + ' rad/s', true], ['ζ', fmt(z, 3), true]]; }
    });
  })();

  /* ---------------- 6.B.7: spring k above, spring 2k and dashpot c below ----------------
     m = 10 kg, k = 3000 N/m. Heights from the ceiling: upper spring 0.18 m at equilibrium, block 0.12 m tall, floor at 0.52 m.
     The rod (0.12 m) hangs from the block, the cylinder (0.14 m) stands on the floor; for |x| ≤ 30 mm the piston stays inside. */
  (function(){
    const S = 650, m = 10, k = 3000, hb = 0.12, yF = 0.52, top = 0.03;
    freeClip({
      id: 'x6b-7', speed: 0.25, unit: [1000, 'x (mm)'],
      controls: [
        { key: 'c', label: 'Damping c', min: 0, max: 900, step: 5, value: 300, unit: 'kg/s', dec: 0 },
        { key: 'x0', label: 'Initial position x_0', min: -30, max: 30, step: 0.5, value: 25, unit: 'mm', dec: 1 }
      ],
      presets: C => [{ label: '50 % of critical (c = 300 kg/s)', apply: () => C.set({ c: 300 }) }, { label: 'Critical (c = 600 kg/s)', apply: () => C.set({ c: 600 }) }, { label: 'Undamped', apply: () => C.set({ c: 0 }) }],
      sys: V => ({ m, c: V.c, k: 3 * k }),
      init: V => [V.x0 / 1000, 0],
      T: () => 1.3,
      draw(st){
        const cv = $('x6b-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 380); fitView(ctx, w, h, n ? [0, 0, 400, 400] : [-60, 0, 560, 400]);
        const x = st.s[0], Y = v => top * S + v * S, cx = 160, bw = 0.2 * S, yb = 0.18 + x;
        ceilH(ctx, cx - 80, cx + 80, Y(0)); floorH(ctx, cx - 90, cx + 90, Y(yF));
        springLine(ctx, cx, Y(0), cx, Y(yb), 10, 9); anchor(ctx, cx, Y(0), 12);
        const xl = cx - 0.055 * S, xr = cx + 0.055 * S;
        springLine(ctx, xl, Y(yb + hb), xl, Y(yF), 10, 8); anchor(ctx, xl, Y(yF), 12);
        dashpot(ctx, xr, Y(yF), xr, Y(yb + hb), 0.14 * S, 0.12 * S, 9, 0.01 * S); anchor(ctx, xr, Y(yF), 14);
        block(ctx, cx, Y(yb + hb / 2), bw, hb * S, 0, 'm');
        lab(ctx, 'k', cx - 26, Y(yb / 2)); lab(ctx, '2k', xl - 30, Y((yb + hb + yF) / 2)); lab(ctx, 'c', xr + 26, Y((yb + hb + yF) / 2));
        dash(ctx, cx + bw / 2 + 6, Y(0.18), cx + bw / 2 + 150, Y(0.18), COL.c3); small(ctx, 'equilibrium', cx + bw / 2 + 110, Y(0.18) - 10, { color: COL.c3 });
        arrow(ctx, cx + bw / 2 + 40, Y(0.18) + 14, cx + bw / 2 + 40, Y(0.18) + 46, COL.c1, 2); lab(ctx, 'x', cx + bw / 2 + 54, Y(0.18) + 36, { color: COL.c1 });
      },
      stats(st, wn, z){ return [['x', mmf(st.s[0])], ['k_eq = 3k', '9000 N/m'], ['c_cr', '600 kg/s'], ['ζ', fmt(z, 3), true], ['ω_n', fmt(wn, 4) + ' rad/s']]; }
    });
  })();

  /* ---------------- 6.B.8: block on a smooth 30° incline, springs 4k and k, dashpot c ----------------
     Slope coordinate s (metres) up the incline from the lower wall; the block's centre is at s = 0.42 − x (x is down the slope).
     Block 0.16 m long and 0.12 m high. Spring 4k at height 0.10 m and dashpot at 0.03 m connect the lower wall to the block;
     spring k at 0.06 m connects the block to the upper wall at s = 0.9 m. For |x| ≤ 40 mm the piston stays inside its cylinder. */
  (function(){
    const S = 420, m = 10, k = 2000, a = 30 * RAD, Ls = 0.9, sc = 0.42, bl = 0.16, bh = 0.12;
    freeClip({
      id: 'x6b-8', speed: 0.25, unit: [1000, 'x (mm)'],
      controls: [
        { key: 'c', label: 'Damping c', min: 0, max: 950, step: 1, value: 316, unit: 'kg/s', dec: 0 },
        { key: 'x0', label: 'Initial position x_0 (down the slope)', min: -40, max: 40, step: 0.5, value: 30, unit: 'mm', dec: 1 }
      ],
      presets: C => [{ label: '50 % of critical (c = 316 kg/s)', apply: () => C.set({ c: 316 }) }, { label: 'Critical (c = 632 kg/s)', apply: () => C.set({ c: 632 }) }, { label: 'Undamped', apply: () => C.set({ c: 0 }) }],
      sys: V => ({ m, c: V.c, k: 5 * k }),
      init: V => [V.x0 / 1000, 0],
      T: () => 1.2,
      draw(st){
        const cv = $('x6b-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        nar(cv, w, 360, 300); fitView(ctx, w, h, [0, 20, 480, 330]);
        const x = st.s[0], ox = 50, oy = 300, eu = [Math.cos(a), -Math.sin(a)], en = [-Math.sin(a), -Math.cos(a)];
        const P = (s, hh) => [ox + (s * eu[0] + hh * en[0]) * S, oy + (s * eu[1] + hh * en[1]) * S];
        // wedge (fixed) and the two walls, perpendicular to the slope
        const A = P(-0.04, 0), B = P(Ls + 0.04, 0);
        ctx.save(); ctx.fillStyle = '#ece7da'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B[0], oy + 0.04 * Math.sin(a) * S); ctx.lineTo(A[0], oy + 0.04 * Math.sin(a) * S); ctx.closePath(); ctx.fill(); ctx.restore();
        line(ctx, A[0], A[1], B[0], B[1], COL.fg, 2); floorH(ctx, A[0] - 20, B[0] + 20, oy + 0.04 * Math.sin(a) * S);
        const w0a = P(0, 0), w0b = P(0, 0.18), w1a = P(Ls, 0), w1b = P(Ls, 0.18);
        hatch(ctx, w0a[0], w0a[1], w0b[0], w0b[1], -1, 8, 6); hatch(ctx, w1b[0], w1b[1], w1a[0], w1a[1], -1, 8, 6);
        const sb = sc - x, lo = sb - bl / 2, hi = sb + bl / 2;
        // connectors (attached at the wall and at the block faces)
        const s1a = P(0, 0.1), s1b = P(lo, 0.1); springLine(ctx, ...s1a, ...s1b, 9, 7);
        const d1a = P(0, 0.03), d1b = P(lo, 0.03); dashpot(ctx, ...d1a, ...d1b, 0.24 * S, 0.16 * S, 7, 0.01 * S);
        const s2a = P(hi, 0.06), s2b = P(Ls, 0.06); springLine(ctx, ...s2a, ...s2b, 8, 7);
        const C = P(sb, bh / 2); block(ctx, C[0], C[1], bl * S, bh * S, -a, 'm');
        // labels, angle and the x direction (down the slope)
        const l1 = P(lo / 2, 0.15), l2 = P((hi + Ls) / 2, 0.12), l3 = P(0.2, 0.066);
        lab(ctx, '4k', l1[0], l1[1]); lab(ctx, 'k', l2[0], l2[1]); lab(ctx, 'c', l3[0], l3[1]);
        const Q = P(0.62, 0); line(ctx, Q[0], Q[1], Q[0] + 80, Q[1], COL.axis, 1, [4, 4]);     // angle of the incline, marked inside the wedge
        ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(Q[0], Q[1], 56, -a, 0); ctx.stroke(); ctx.restore();
        small(ctx, '30°', Q[0] + 70, Q[1] - 13);
        const q1 = P(sb + 0.02, bh + 0.07), q2 = P(sb - 0.12, bh + 0.07); arrow(ctx, q1[0], q1[1], q2[0], q2[1], COL.c1, 2); lab(ctx, 'x', q2[0] - 8, q2[1] - 14, { color: COL.c1 });
      },
      stats(st, wn, z){ return [['x', mmf(st.s[0])], ['k_eq = 5k', '10 000 N/m'], ['c_cr', '632.5 kg/s'], ['ζ', fmt(z, 3), true], ['ω_n', fmt(wn, 4) + ' rad/s']]; }
    });
  })();

  /* ---------------- 6.B.9: horizontal spring and dashpot, released from x0 = 6 mm ----------------
     The block (0.10 m) slides on a smooth floor. Its left face is 0.20 m from the wall at equilibrium.
     The motion is only a few millimetres, so a ×10 magnified gauge shows x as well. */
  (function(){
    const S = 1300, wb = 0.1, hb = 0.1, face = 0.2;
    freeClip({
      id: 'x6b-9', speed: 0.1, unit: [1000, 'x (mm)'],
      controls: [
        { key: 'c', label: 'Damping c', min: 0, max: 100, step: 1, value: 32, unit: 'kg/s', dec: 0 },
        { key: 'x0', label: 'Initial position x_0', min: -10, max: 10, step: 0.5, value: 6, unit: 'mm', dec: 1 }
      ],
      presets: C => [{ label: 'Book values', apply: () => C.set({ c: 32, x0: 6 }) }, { label: 'Undamped', apply: () => C.set({ c: 0 }) }, { label: 'Critical (c = 80 kg/s)', apply: () => C.set({ c: 80 }) }],
      sys: V => ({ m: 1, c: V.c, k: 1600 }),
      init: V => [V.x0 / 1000, 0],
      T: () => 0.6,
      vlines: () => [],
      draw(st){
        const cv = $('x6b-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 300, 330); fitView(ctx, w, h, n ? [0, 10, 620, 330] : [0, 10, 640, 300]);
        const x = st.s[0], X = v => 40 + v * S, yF = 230, Yh = v => yF - v * S;
        wallL(ctx, X(0), Yh(0.16), yF); floorH(ctx, X(0), X(0.42), yF); small(ctx, 'smooth floor', X(0.36), yF + 16);
        const lf = face + x;
        springLine(ctx, X(0), Yh(0.07), X(lf), Yh(0.07), 9, 8);
        dashpot(ctx, X(0), Yh(0.025), X(lf), Yh(0.025), 0.1 * S, 0.12 * S, 8, 0.01 * S);
        block(ctx, X(lf + wb / 2), Yh(hb / 2), wb * S, hb * S, 0, 'm');
        lab(ctx, 'k', X(0.1), Yh(0.07) - 22); lab(ctx, 'c', X(0.06), Yh(0.025) + 22);
        dash(ctx, X(face), Yh(0.16), X(face), Yh(0.12), COL.c3); arrow(ctx, X(face), Yh(0.145), X(face + 0.04), Yh(0.145), COL.c1, 2); lab(ctx, 'x', X(face + 0.05), Yh(0.145), { color: COL.c1 });
        // ×10 gauge
        const gx = n ? 160 : 390, gy = n ? 290 : 70, gw = n ? 300 : 220, mmpx = gw / 20;
        line(ctx, gx, gy, gx + gw, gy, COL.axis, 1.5);
        for (let i = -10; i <= 10; i += 2){ const px = gx + gw / 2 + i * mmpx; line(ctx, px, gy - (i % 10 ? 4 : 7), px, gy + (i % 10 ? 4 : 7), COL.axis, 1); if (i % 5 === 0 || i === 0) small(ctx, String(i), px, gy + 16); }
        const px = gx + gw / 2 + clamp(x * 1000, -10, 10) * mmpx; ctx.save(); ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.moveTo(px, gy - 3); ctx.lineTo(px - 6, gy - 14); ctx.lineTo(px + 6, gy - 14); ctx.closePath(); ctx.fill(); ctx.restore();
        small(ctx, 'x (mm), gauge magnified ×10', gx + gw / 2, gy - 26);
      },
      stats(st, wn, z){ return [['x', mmf(st.s[0])], ['ω_n', fmt(wn, 4) + ' rad/s'], ['ζ', fmt(z, 3), true], ['ω_d', fmt(wn * Math.sqrt(Math.max(0, 1 - z * z)), 4) + ' rad/s', true]]; }
    });
  })();

  /* ---------------- 6.B.10: the same system without and with damping ----------------
     m = 1 kg, k = 4π² N/m (T_n = 1 s). Both blocks start 50 mm from equilibrium at rest. The damped period is measured
     from the zero crossings of the simulated response. */
  (function(){
    const S = 1000, wb = 0.1, hb = 0.08, face = 0.22, m = 1, k = 4 * Math.PI * Math.PI, Tw = 3;
    makeClip({
      id: 'x6b-10', speed: 0.5,
      controls: [{ key: 'z', label: 'Damping ratio ζ (lower system)', min: 0, max: 0.95, step: 0.01, value: 0.6, dec: 2 }],
      presets: C => [{ label: 'ζ = 0.6 (period +25 %)', apply: () => C.set({ z: 0.6 }) }, { label: 'ζ = 0.2', apply: () => C.set({ z: 0.2 }) }, { label: 'ζ = 0.9', apply: () => C.set({ z: 0.9 }) }],
      reset(st){ st.u = [0.05, 0]; st.d = [0.05, 0]; st.hu = [[0, 0.05]]; st.hd = [[0, 0.05]]; st.zc = []; st.lastT = 0; },
      step(st){
        const dt = st.t - st.lastT; st.lastT = st.t;
        if (st.t > Tw + 0.6){ st.t = 0; st.lastT = 0; st.u = [0.05, 0]; st.d = [0.05, 0]; st.hu = [[0, 0.05]]; st.hd = [[0, 0.05]]; st.zc = []; return; }
        if (st.t > Tw) return;
        const c = 2 * st.V.z * Math.sqrt(k * m), x1 = st.d[0];
        st.u = stepN(s => [s[1], -k * s[0] / m], st.u, dt, 0.0005);
        st.d = stepN(s => [s[1], -(c * s[1] + k * s[0]) / m], st.d, dt, 0.0005);
        if (x1 !== 0 && Math.sign(x1) !== Math.sign(st.d[0]) && st.d[0] !== 0){ const tz = st.t - dt * st.d[0] / (st.d[0] - x1); st.zc.push(tz); }
        st.hu.push([st.t, st.u[0]]); st.hd.push([st.t, st.d[0]]);
      },
      draw(st){
        const cv = $('x6b-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        nar(cv, w, 300, 300); fitView(ctx, w, h, [0, 10, 480, 300]);
        const X = v => 40 + v * S;
        const draw1 = (yF, x, damped, title) => {
          wallL(ctx, X(0), yF - 110, yF); floorH(ctx, X(0), X(0.38), yF);
          const lf = face + x;
          if (damped){ springLine(ctx, X(0), yF - 62, X(lf), yF - 62, 9, 7); dashpot(ctx, X(0), yF - 22, X(lf), yF - 22, 0.155 * S, 0.12 * S, 7, 0.01 * S); }
          else springLine(ctx, X(0), yF - 40, X(lf), yF - 40, 9, 7);
          block(ctx, X(lf + wb / 2), yF - hb * S / 2, wb * S, hb * S, 0, 'm');
          dash(ctx, X(face), yF - 100, X(face), yF - 86, COL.c3);
          small(ctx, title, X(0.34), yF - 96, { color: damped ? COL.c2 : COL.c1 });
        };
        draw1(130, st.u[0], false, 'no damping'); draw1(280, st.d[0], true, 'ζ = ' + fmt(st.V.z, 2));
        // plot both responses and the measured damped period
        const zc = st.zc, vl = zc.slice(0, 3).map(t => ({ x: t, color: COL.c2 }));
        plot($('x6b-10-plot'), { xmin: 0, xmax: Tw, ymin: -60, ymax: 60, xlabel: 't (s)', ylabel: 'x (mm)',
          series: [{ pts: st.hu.map(p => [p[0], p[1] * 1000]), color: COL.c1, width: 2 }, { pts: st.hd.map(p => [p[0], p[1] * 1000]), color: COL.c2, width: 2.2 }],
          vlines: [{ x: Math.min(st.t, Tw), color: COL.axis }].concat(vl) });
        const wn = Math.sqrt(k / m), Td = st.V.z < 1 ? 2 * Math.PI / (wn * Math.sqrt(1 - st.V.z ** 2)) : Infinity;
        statsEvery(st, 'x6b-10-stats', () => [['T_n', '1 s'], ['T_d = T_n/√(1 − ζ²)', fmt(Td, 4) + ' s', true],
          ['T_d measured (2 × gap between zero crossings)', zc.length >= 2 ? fmt(2 * (zc[1] - zc[0]), 4) + ' s' : '…', true], ['T_d / T_n', fmt(Td, 4), true]]);
      }
    });
  })();

  subLabels();
})();
