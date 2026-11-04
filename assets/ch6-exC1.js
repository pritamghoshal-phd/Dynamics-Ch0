/* =========================================================
   Chapter 6, Section C examples (forced response): animations for 6.C.1 to 6.C.6
   (clips x6c-1 ... x6c-6).
   Each clip integrates the full equation of motion M x'' + C x' + K x = P(t) from rest (RK4, tabulated once
   per setting), or shows the exact steady-state (particular) solution. The time plot shows x(t) with the forcing,
   and the frequency-response plot marks the current excitation frequency.
   Displacements are drawn at true scale. Only when a slider makes the response so large that bodies would touch
   their neighbours are ALL displacements (body and base) drawn at a reduced scale st.sd, and the canvas says so.
   The 3D views (ch6-3dC1.js) read st.xd (drawn displacement, m), st.xbd, st.th and st.sd.
   ========================================================= */
(function(){
  const TAU = 2 * Math.PI;
  const MODE = {};                     // 'full' (start from rest) or 'ss' (steady state only), per clip
  const mode = id => MODE[id] || 'full';
  const fk = n => n ? 1.55 : 1;        // larger fonts on phones, where the drawing is scaled down
  const lab = (ctx, s, x, y, n, o = {}) => txt(ctx, s, x, y, Object.assign({ font: `italic ${15 * fk(n)}px Georgia, serif` }, o));
  const small = (ctx, s, x, y, n, o = {}) => txt(ctx, s, x, y, Object.assign({ font: `${12 * fk(n)}px system-ui`, color: COL.muted }, o));
  const ground = (ctx, x1, x2, y) => { line(ctx, x1, y, x2, y, COL.fg, 2); hatch(ctx, x2, y, x1, y, -1, 9, 7); };
  const wall = (ctx, x, y0, y1) => { line(ctx, x, y0, x, y1, COL.fg, 2); hatch(ctx, x, y1, x, y0, -1, 9, 7); };   // hatch on the left (outside)
  const dotAt = (ctx, x, y, c, r = 3.5) => { ctx.save(); ctx.fillStyle = c || COL.fg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); };
  const fArrow = (ctx, x1, y1, x2, y2, col, w = 2.6) => { if (Math.hypot(x2 - x1, y2 - y1) > 3) arrow(ctx, x1, y1, x2, y2, col, w); };
  const mmf = v => Math.abs(v) >= 1 ? fmt(v, 3) + ' m' : fmt(v * 1000, 3) + ' mm';
  const sgn0 = v => Math.abs(v) < 1e-12 ? 0 : v;

  /* ---------- response of M x'' + C x' + K x = P(t), from rest, tabulated ---------- */
  function table(M, K, C, P, T, w){
    const h = Math.min(0.002, TAU / Math.max(w, Math.sqrt(K / M)) / 80), n = Math.ceil(T / h);
    const xs = new Float64Array(n + 1), vs = new Float64Array(n + 1);
    const f = s => [s[1], (P(s[2]) - C * s[1] - K * s[0]) / M, 1];
    let s = [0, 0, 0], mx = 0;
    for (let i = 1; i <= n; i++){ s = rk(f, s, h); xs[i] = s[0]; vs[i] = s[1]; mx = Math.max(mx, Math.abs(s[0])); }
    return { h, xs, vs, n, max: mx };
  }
  function at(tab, t){
    const u = clamp(t / tab.h, 0, tab.n - 1e-9), i = Math.floor(u), a = u - i;
    return [tab.xs[i] + (tab.xs[i + 1] - tab.xs[i]) * a, tab.vs[i] + (tab.vs[i + 1] - tab.vs[i]) * a];
  }
  // steady state of M x'' + C x' + K x = P0 sin wt  ->  x = X sin(wt - phi)
  const ssSine = (M, K, C, P0, w) => ({ X: P0 / Math.hypot(K - M * w * w, C * w), phi: Math.atan2(C * w, K - M * w * w) });

  /* time plot: x(t) and the forcing (in displacement units) over a sliding window */
  function timePlot(cv, st, curves, ylab){
    const W = st.win, t1 = Math.max(st.t, W), t0 = t1 - W, N = 360, ser = [];
    curves.forEach(c => { const pts = []; for (let i = 0; i <= N; i++){ const t = t0 + W * i / N; pts.push([t, t <= st.t + 1e-9 ? c.f(t) * 1000 : NaN]); } ser.push({ pts, color: c.color, dash: c.dash, width: c.width || 2 }); });
    const Y = st.ylim * 1000 * 1.12;
    plot(cv, { xmin: t0, xmax: t1, ymin: -Y, ymax: Y, fixed: true, xlabel: 'time t (s)', ylabel: ylab || 'displacement (mm)', series: ser,
      points: curves.filter(c => c.dot).map(c => ({ x: st.t, y: c.f(st.t) * 1000, color: c.color, r: 4 })) });
  }
  /* frequency response: amplitude (mm) against frequency, with markers at the current frequencies */
  function frfPlot(cv, A, xmax, marks, opt = {}){
    const N = 400, pts = [], ycap = opt.ycap;
    for (let i = 0; i <= N; i++){ const x = xmax * i / N, y = A(x) * 1000; pts.push([x, y > ycap ? NaN : y]); }
    plot(cv, { xmin: 0, xmax, ymin: 0, ymax: ycap, fixed: true, xlabel: opt.xlabel || 'excitation frequency ω (rad/s)', ylabel: opt.ylabel || 'amplitude X (mm)',
      series: [{ pts, color: COL.c1, width: 2 }].concat(opt.extra || []), vlines: opt.vlines || [], hlines: opt.hlines || [],
      points: marks.map(m => ({ x: m.x, y: Math.min(m.y * 1000, ycap), color: m.color || COL.c2, r: 6 })) });
  }
  // presets that switch between the full response and the steady state
  const modeChips = (id, reset) => [
    { label: 'Start from rest (full response)', apply: () => { MODE[id] = 'full'; reset(); } },
    { label: 'Steady state only', apply: () => { MODE[id] = 'ss'; reset(); } }];
  const sdNote = (ctx, st, x, y, n) => { if (st.sd < 0.999) small(ctx, `displacements drawn at ${fmt(st.sd, 2)}× scale so the parts do not touch`, x, y, n, { color: RED, align: 'left' }); };
  // choose the drawing scale: true scale unless the largest drawn excursion would exceed lim (m)
  const pickScale = (st, lim) => { st.sd = Math.min(1, lim / Math.max(st.maxAbs, 1e-9)); };

  /* a disk that rolls without slipping, with a non-rotating axle collar for the spring attachments */
  function rollDisk(ctx, x, y, R, ang){ wheel(ctx, x, y, R, ang, 'disk'); }
  /* a small cart: body on two wheels that roll on the floor */
  function cart(ctx, xl, yFloor, bw, bh, rw, ang, label, n){
    const yb = yFloor - 2 * rw;
    block(ctx, xl + bw / 2, yb - bh / 2, bw, bh, 0, '');
    [xl + bw * 0.22, xl + bw * 0.78].forEach(cx => wheel(ctx, cx, yFloor - rw, rw, ang, 'disk'));
    if (label) lab(ctx, label, xl + bw / 2, yb - bh / 2, n, { fixed: true });
  }

  /* =====================================================================
     6.C.1  Rolling disk, spring to the wall, F0 sin wt at the center O
     (3/2) m x'' + k x = F0 sin wt
     ===================================================================== */
  (function(){
    const id = 'x6c-1', R = 0.15, L0 = 0.55;
    makeClip({
      id, speed: 0.5,
      controls: [
        { key: 'w', label: 'Excitation frequency ω', min: 1, max: 30, step: 0.5, value: 15, unit: 'rad/s', dec: 1 },
        { key: 'm', label: 'Disk mass m', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'kg', dec: 2 },
        { key: 'k', label: 'Spring stiffness k', min: 50, max: 800, step: 10, value: 300, unit: 'N/m', dec: 0 },
        { key: 'F0', label: 'Force amplitude F_0', min: 0, max: 40, step: 1, value: 20, unit: 'N', dec: 0 }],
      presets: (C, st, reset) => [{ label: 'Book values (ω = 15 rad/s)', apply: () => C.set({ w: 15, m: 2, k: 300, F0: 20 }) },
        { label: 'Below resonance (ω = 6 rad/s)', apply: () => C.set({ w: 6 }) }, { label: 'Near resonance (ω = 9.5 rad/s)', apply: () => C.set({ w: 9.5 }) }].concat(modeChips(id, reset)),
      reset(st){
        const V = st.V, M = 1.5 * V.m, K = V.k, w = V.w;
        st.M = M; st.K = K; st.wn = Math.sqrt(K / M); st.ss = ssSine(M, K, 0, V.F0, w);
        st.T = 10; st.win = clamp(10 * TAU / w, 2.5, 6);
        st.tab = mode(id) === 'full' ? table(M, K, 0, t => V.F0 * Math.sin(w * t), st.T, w) : null;
        st.maxAbs = st.tab ? st.tab.max : Math.abs(st.ss.X); st.ylim = Math.max(st.maxAbs, V.F0 / K, 1e-4);
        pickScale(st, 0.6 * (L0 - R));
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T) { st.t = 0; } },
      draw(st){
        const V = st.V, w = V.w, full = mode(id) === 'full';
        const xv = t => full ? at(st.tab, t) : [st.ss.X * Math.sin(w * t - st.ss.phi), st.ss.X * w * Math.cos(w * t - st.ss.phi)];
        const [x, v] = xv(st.t), F = V.F0 * Math.sin(w * st.t), a = (F - st.K * x) / st.M;
        st.x = x; st.v = v; st.xd = st.sd * x; st.th = st.xd / R; st.F = F; st.f = -0.5 * V.m * a;   // friction on the disk (+ to the right)
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 300, 300), S = 640, WX = 40, Yg = 250;
        fitView(ctx, cw, h, n ? [0, 10, 640, 300] : [0, 10, 780, 300]);
        const Rp = R * S, Ox = WX + (L0 + st.xd) * S, Oy = Yg - Rp, O0 = WX + L0 * S;
        ground(ctx, WX, n ? 630 : 760, Yg); wall(ctx, WX, Yg - 175, Yg);
        line(ctx, O0, Yg + 2, O0, Oy - Rp - 26, COL.muted, 1, [4, 4]); small(ctx, 'x = 0', O0, Oy - Rp - 36, n, { fixed: true });
        springLine(ctx, WX, Oy, Ox - Rp * 0.55, Oy, 11, 9); line(ctx, Ox - Rp * 0.55, Oy, Ox, Oy, COL.spring, 2);
        rollDisk(ctx, Ox, Oy, Rp, st.th);
        line(ctx, Ox - Rp * 0.55, Oy, Ox, Oy, COL.spring, 2.4); pinDot(ctx, Ox, Oy);
        lab(ctx, 'k', WX + (Ox - Rp * 0.55 - WX) / 2, Oy - 24, n);
        lab(ctx, 'O', Ox + 12, Oy - 16, n); lab(ctx, 'R', Ox - Rp * 0.5, Oy + Rp * 0.45, n);
        const fs = 95 / Math.max(V.F0, 1e-9);
        fArrow(ctx, Ox, Oy, Ox + F * fs, Oy, COL.c2); if (Math.abs(F) > 0.05 * V.F0) lab(ctx, 'F(t)', Ox + F * fs + Math.sign(F) * 26, Oy - 14, n, { color: COL.c2 });
        const fsc = 95 / Math.max(V.F0, 1e-9);
        fArrow(ctx, Ox, Yg - 3, Ox + st.f * fsc, Yg - 3, RED, 2.2); if (Math.abs(st.f) * fsc > 10) lab(ctx, 'f', Ox + st.f * fsc + Math.sign(st.f) * 12, Yg - 16, n, { color: RED });
        small(ctx, 'no slip', Ox + Rp + 30, Yg - 12, n);
        sdNote(ctx, st, 8, 36, n);
        small(ctx, full ? 'full response from rest' : 'steady state only', n ? 630 : 770, 36, n, { align: 'right', color: COL.fg });
        timePlot($(id + '-t'), st, [{ f: t => V.F0 * Math.sin(w * t) / st.K, color: COL.c2, dash: [5, 4], width: 1.6 }, { f: t => xv(t)[0], color: COL.c1, dot: true }]);
        const A = ww => Math.abs(V.F0 / (st.K - st.M * ww * ww));
        frfPlot($(id + '-f'), A, Math.max(30, 2.2 * st.wn), [{ x: w, y: Math.abs(st.ss.X) }], { ycap: Math.max(4 * V.F0 / st.K, 1.5 * Math.abs(st.ss.X)) * 1000, vlines: [{ x: st.wn, label: 'ωₙ', color: COL.muted }] });
        statsEvery(st, id + '-stats', () => [['ω_n = √(2k/3m)', fmt(st.wn, 3) + ' rad/s'], ['r = ω/ω_n', fmt(w / st.wn, 3)],
          ['steady-state amplitude |X|', mmf(Math.abs(st.ss.X)), true], ['phase', st.wn > w ? 'in phase with F' : 'out of phase with F (180°)', true], ['x now', mmf(x)], ['friction f now', fmt(st.f, 3) + ' N']]);
      }
    });
  })();

  /* =====================================================================
     6.C.2  Cart with spring and damper to the base, f0 sin wt
     ===================================================================== */
  (function(){
    const id = 'x6c-2', L0 = 0.42, BW = 0.24, BH = 0.15, RW = 0.03;
    makeClip({
      id, speed: 0.25,
      controls: [
        { key: 'w', label: 'Excitation frequency ω', min: 2, max: 120, step: 1, value: 40, unit: 'rad/s', dec: 0 },
        { key: 'c', label: 'Damping c', min: 2, max: 300, step: 1, value: 45, unit: 'kg/s', dec: 0 },
        { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 3, unit: 'kg', dec: 2 },
        { key: 'k', label: 'Stiffness k', min: 1000, max: 20000, step: 100, value: 7500, unit: 'N/m', dec: 0 }],
      presets: (C, st, reset) => [{ label: 'Book values', apply: () => C.set({ w: 40, c: 45, m: 3, k: 7500 }) },
        { label: 'At resonance (ω = ω_n)', apply: () => C.set({ w: Math.round(Math.sqrt(C.v.k / C.v.m)) }) },
        { label: 'Heavy damping (c = 250)', apply: () => C.set({ c: 250 }) }].concat(modeChips(id, reset)),
      reset(st){
        const V = st.V, w = V.w, f0 = 75;
        st.f0 = f0; st.wn = Math.sqrt(V.k / V.m); st.z = V.c / (2 * Math.sqrt(V.k * V.m)); st.ss = ssSine(V.m, V.k, V.c, f0, w);
        st.T = 6; st.win = clamp(12 * TAU / w, 0.8, 3);
        st.tab = mode(id) === 'full' ? table(V.m, V.k, V.c, t => f0 * Math.sin(w * t), st.T, w) : null;
        st.maxAbs = st.tab ? st.tab.max : st.ss.X; st.ylim = Math.max(st.maxAbs, f0 / V.k); pickScale(st, 0.3 * L0);   // the damper body is 0.62 L0 long, so the stroke is limited
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T) st.t = 0; },
      draw(st){
        const V = st.V, w = V.w, full = mode(id) === 'full';
        const xv = t => full ? at(st.tab, t) : [st.ss.X * Math.sin(w * t - st.ss.phi), st.ss.X * w * Math.cos(w * t - st.ss.phi)];
        const [x, v] = xv(st.t), F = st.f0 * Math.sin(w * st.t), FT = V.k * x + V.c * v;
        st.x = x; st.v = v; st.xd = st.sd * x; st.F = F; st.FT = FT; st.th = st.xd / RW;
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 300, 300), S = 750, WX = 60, Yg = 250;
        fitView(ctx, cw, h, n ? [0, 20, 660, 300] : [0, 20, 780, 300]);
        const xl = WX + (L0 + st.xd) * S, yb = Yg - 2 * RW * S, ys = yb - BH * S * 0.72, yd = yb - BH * S * 0.28, x0 = WX + L0 * S;
        ground(ctx, WX, n ? 640 : 760, Yg); wall(ctx, WX, Yg - 190, Yg);
        line(ctx, x0, Yg + 2, x0, yb - BH * S - 22, COL.muted, 1, [4, 4]); small(ctx, 'x = 0', x0, yb - BH * S - 32, n, { fixed: true });
        springLine(ctx, WX, ys, xl, ys, 10, 8); damperLine(ctx, WX, yd, xl, yd, L0 * S);
        cart(ctx, xl, Yg, BW * S, BH * S, RW * S, st.th, 'm', n);
        lab(ctx, 'k', WX + 70, ys - 20, n); lab(ctx, 'c', WX + 70, yd + 22, n);
        const fs = 90 / st.f0, xr = xl + BW * S, ym = yb - BH * S / 2;
        if (F >= 0) fArrow(ctx, xr, ym, xr + F * fs, ym, COL.c2); else fArrow(ctx, xr - F * fs, ym, xr, ym, COL.c2);   // a pull, or a push onto the face
        lab(ctx, 'f_0 sin ωt', xr + 70, ym - 22, n, { color: COL.c2 });
        // force transmitted to the base (the wall), drawn on the wall above the spring
        const ft = 90 / Math.max(178, Math.abs(st.ss.X) * Math.hypot(V.k, V.c * w)), ya = yb - BH * S - 45;
        fArrow(ctx, WX + 4, ya, WX + 4 + FT * ft, ya, COL.c3); lab(ctx, 'F_T', WX + 4 + FT * ft + Math.sign(FT || 1) * 18, ya - 14, n, { color: COL.c3 });
        small(ctx, 'force on the base', WX + 6, ya + 18, n, { align: 'left' });
        sdNote(ctx, st, 8, 36, n);
        small(ctx, full ? 'full response from rest' : 'steady state only', n ? 640 : 770, 36, n, { align: 'right', color: COL.fg });
        timePlot($(id + '-t'), st, [{ f: t => st.f0 * Math.sin(w * t) / V.k, color: COL.c2, dash: [5, 4], width: 1.6 }, { f: t => xv(t)[0], color: COL.c1, dot: true }]);
        const A = ww => st.f0 / Math.hypot(V.k - V.m * ww * ww, V.c * ww), xm = Math.max(120, 2.4 * st.wn);
        frfPlot($(id + '-f'), A, xm, [{ x: w, y: st.ss.X }], { ycap: Math.max(Math.min(1.15 * A(st.wn), 12 * st.f0 / V.k), 1.3 * st.ss.X, 2 * st.f0 / V.k) * 1000, vlines: [{ x: st.wn, label: 'ωₙ', color: COL.muted }] });
        const FTmax = st.ss.X * Math.hypot(V.k, V.c * w);
        statsEvery(st, id + '-stats', () => [['ω_n', fmt(st.wn, 3) + ' rad/s'], ['ζ', fmt(st.z, 3)], ['X', mmf(st.ss.X), true], ['φ', fmt(st.ss.phi * 180 / Math.PI, 3) + '°', true],
          ['max force on base', fmt(FTmax, 4) + ' N', true], ['F_T now', fmt(FT, 3) + ' N']]);
      }
    });
  })();

  /* =====================================================================
     6.C.3  Same system driven at w1 and at w2 = 2 w1: find zeta from X1/X2 = 4
     m = 1 kg, k = 400 N/m (w_n = 20 rad/s), f0 = 8 N (f0/k = 20 mm)
     ===================================================================== */
  (function(){
    const id = 'x6c-3', m = 1, k = 400, f0 = 8, wn = 20, L0 = 0.38, BW = 0.2, BH = 0.12, RW = 0.025;
    makeClip({
      id, speed: 0.25,
      controls: [
        { key: 'z', label: 'Damping ratio ζ', min: 0.02, max: 1, step: 0.001, value: 0.2, unit: '', dec: 3 },
        { key: 'r1', label: 'Frequency ratio ω_1/ω_n', min: 0.3, max: 1.5, step: 0.01, value: 1, unit: '', dec: 2 }],
      presets: (C, st, reset) => [{ label: 'Book answer (ω_1 = ω_n, ζ = 0.433)', apply: () => C.set({ z: 0.433, r1: 1 }) },
        { label: 'ω_1 = 0.9 ω_n, ζ = 0.338', apply: () => C.set({ z: 0.338, r1: 0.9 }) }].concat(modeChips(id, reset)),
      reset(st){
        const V = st.V, c = 2 * V.z * Math.sqrt(k * m), w1 = V.r1 * wn, w2 = 2 * w1;
        st.c = c; st.w1 = w1; st.w2 = w2; st.s1 = ssSine(m, k, c, f0, w1); st.s2 = ssSine(m, k, c, f0, w2);
        st.T = 6; st.win = clamp(8 * TAU / w1, 1.2, 4);
        if (mode(id) === 'full'){ st.t1 = table(m, k, c, t => f0 * Math.sin(w1 * t), st.T, w2); st.t2 = table(m, k, c, t => f0 * Math.sin(w2 * t), st.T, w2); st.maxAbs = Math.max(st.t1.max, st.t2.max); }
        else { st.t1 = st.t2 = null; st.maxAbs = Math.max(st.s1.X, st.s2.X); }
        st.ylim = Math.max(st.maxAbs, f0 / k); pickScale(st, 0.3 * L0);
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T) st.t = 0; },
      draw(st){
        const full = mode(id) === 'full';
        const xs = (tab, s, w) => t => full ? at(tab, t)[0] : s.X * Math.sin(w * t - s.phi);
        const x1f = xs(st.t1, st.s1, st.w1), x2f = xs(st.t2, st.s2, st.w2), x1 = x1f(st.t), x2 = x2f(st.t);
        st.x = x1; st.x2 = x2; st.xd = st.sd * x1; st.xd2 = st.sd * x2; st.th = st.xd / RW; st.th2 = st.xd2 / RW;
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 340, 340), S = 600, WX = 60;
        fitView(ctx, cw, h, n ? [0, 10, 640, 340] : [0, 10, 780, 340]);
        [[155, st.xd, st.th, 'ω_1', st.w1, COL.c2], [320, st.xd2, st.th2, 'ω_2 = 2ω_1', st.w2, COL.c4]].forEach(([Yg, xd, th, nm, w, col]) => {
          const xl = WX + (L0 + xd) * S, yb = Yg - 2 * RW * S, ys = yb - BH * S * 0.72, yd = yb - BH * S * 0.28;
          ground(ctx, WX, n ? 640 : 700, Yg); wall(ctx, WX, Yg - 135, Yg);
          springLine(ctx, WX, ys, xl, ys, 10, 7); damperLine(ctx, WX, yd, xl, yd, L0 * S);
          cart(ctx, xl, Yg, BW * S, BH * S, RW * S, th, 'm', n);
          const F = Math.sin(w * st.t), xr = xl + BW * S, ym = yb - BH * S / 2;
          if (F >= 0) fArrow(ctx, xr, ym, xr + F * 60, ym, col); else fArrow(ctx, xr - F * 60, ym, xr, ym, col); lab(ctx, `f_0 sin ${nm.split(' ')[0]}t`, xr + 105, ym - 18, n, { color: col });
          small(ctx, 'driven at ' + nm, WX + 12, Yg - 120, n, { align: 'left', color: COL.fg });
        });
        sdNote(ctx, st, 8, 18, n);
        timePlot($(id + '-t'), st, [{ f: x2f, color: COL.c4, dot: true }, { f: x1f, color: COL.c2, dot: true }]);
        const z = st.V.z, A = r => (f0 / k) / Math.hypot(1 - r * r, 2 * z * r);
        frfPlot($(id + '-f'), A, 3.2, [{ x: st.V.r1, y: st.s1.X, color: COL.c2 }, { x: 2 * st.V.r1, y: st.s2.X, color: COL.c4 }],
          { ycap: Math.max(1.2 * A(Math.min(1, st.V.r1 * 2)), 1.2 * st.s1.X, 2 * f0 / k) * 1000, xlabel: 'frequency ratio r = ω/ωₙ', vlines: [{ x: 1, label: 'ωₙ', color: COL.muted }] });
        const ratio = st.s1.X / st.s2.X;
        statsEvery(st, id + '-stats', () => [['X_1 = X(ω_1)', mmf(st.s1.X)], ['X_2 = X(2ω_1)', mmf(st.s2.X)], ['X_1/X_2', fmt(ratio, 4), true], ['target', '4'], ['ζ', fmt(st.V.z, 3), true]]);
      }
    });
  })();

  /* =====================================================================
     6.C.4  Rolling disk between a wall spring k and a spring 4k to a moving base B
     (3/2) m x'' + 5k x = 4k b sin wt
     ===================================================================== */
  (function(){
    const id = 'x6c-4', R = 0.12, L1 = 0.4, L2 = 0.34;
    makeClip({
      id, speed: 0.5,
      controls: [
        { key: 'w', label: 'Excitation frequency ω', min: 1, max: 60, step: 0.5, value: 15, unit: 'rad/s', dec: 1 },
        { key: 'b', label: 'Base amplitude b', min: 0, max: 40, step: 1, value: 20, unit: 'mm', dec: 0 },
        { key: 'm', label: 'Disk mass m', min: 1, max: 10, step: 0.1, value: 4, unit: 'kg', dec: 2 },
        { key: 'k', label: 'Stiffness k', min: 100, max: 2000, step: 10, value: 800, unit: 'N/m', dec: 0 }],
      presets: (C, st, reset) => [{ label: 'Book values (ω = 15 rad/s)', apply: () => C.set({ w: 15, b: 20, m: 4, k: 800 }) },
        { label: 'Above resonance (ω = 40 rad/s)', apply: () => C.set({ w: 40 }) }].concat(modeChips(id, reset)),
      reset(st){
        const V = st.V, M = 1.5 * V.m, K = 5 * V.k, b = V.b / 1000, w = V.w;
        st.M = M; st.K = K; st.b = b; st.wn = Math.sqrt(K / M); st.ss = ssSine(M, K, 0, 4 * V.k * b, w);
        st.T = 10; st.win = clamp(10 * TAU / w, 2, 6);
        st.tab = mode(id) === 'full' ? table(M, K, 0, t => 4 * V.k * b * Math.sin(w * t), st.T, w) : null;
        st.maxAbs = Math.max(st.tab ? st.tab.max : Math.abs(st.ss.X), b); st.ylim = st.maxAbs;
        pickScale(st, 0.28 * (L2 - R));           // keeps both springs well away from solid length
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T) st.t = 0; },
      draw(st){
        const V = st.V, w = V.w, full = mode(id) === 'full';
        const xv = t => full ? at(st.tab, t) : [st.ss.X * Math.sin(w * t), st.ss.X * w * Math.cos(w * t)];
        const [x] = xv(st.t), xb = st.b * Math.sin(w * st.t);
        st.x = x; st.xb = xb; st.xd = st.sd * x; st.xbd = st.sd * xb; st.th = st.xd / R;
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 300, 300), S = 700, WX = 40, Yg = 250;
        fitView(ctx, cw, h, n ? [0, 10, 680, 300] : [0, 10, 780, 300]);
        const Rp = R * S, Ox = WX + (L1 + st.xd) * S, Oy = Yg - Rp, O0 = WX + L1 * S, Bx = WX + (L1 + L2 + st.xbd) * S, B0 = WX + (L1 + L2) * S;
        ground(ctx, WX, n ? 670 : 760, Yg); wall(ctx, WX, Yg - 170, Yg);
        // base B: a plate driven along a guide fixed to the floor
        ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.fillRect(B0 - 70, Yg - 14, 140, 14); ctx.strokeRect(B0 - 70, Yg - 14, 140, 14); ctx.restore();
        block(ctx, Bx + 6, Oy - 10, 12, Rp * 1.6 + 20, 0, '', '#cfd8ea'); line(ctx, Bx + 6, Oy + Rp * 0.8 + 10, Bx + 6, Yg - 14, COL.fg, 4);
        lab(ctx, 'B', Bx + 26, Oy - Rp - 6, n);
        line(ctx, O0, Yg + 2, O0, Oy - Rp - 24, COL.muted, 1, [4, 4]); small(ctx, 'x = 0', O0, Oy - Rp - 34, n, { fixed: true });
        springLine(ctx, WX, Oy, Ox - Rp * 0.55, Oy, 10, 9); springLine(ctx, Ox + Rp * 0.55, Oy, Bx, Oy, 12, 9);
        rollDisk(ctx, Ox, Oy, Rp, st.th);
        line(ctx, Ox - Rp * 0.55, Oy, Ox + Rp * 0.55, Oy, COL.spring, 2.4); pinDot(ctx, Ox, Oy);
        lab(ctx, 'k', WX + (Ox - Rp * 0.55 - WX) / 2, Oy - 24, n); lab(ctx, '4k', (Ox + Rp * 0.55 + Bx) / 2, Oy - 24, n); lab(ctx, 'O', Ox, Oy - 18, n);
        fArrow(ctx, Bx + 6, Oy - Rp - 32, Bx + 6 + xb / Math.max(st.b, 1e-9) * 50, Oy - Rp - 32, COL.c2, 2.2); lab(ctx, 'x_B(t) = b sin ωt', Bx - 20, Oy - Rp - 52, n, { color: COL.c2 });
        small(ctx, 'no slip', Ox - Rp - 40, Yg - 12, n);
        sdNote(ctx, st, 8, 30, n);
        small(ctx, full ? 'full response from rest' : 'steady state only', n ? 670 : 770, 30, n, { align: 'right', color: COL.fg });
        timePlot($(id + '-t'), st, [{ f: t => st.b * Math.sin(w * t), color: COL.c2, dash: [5, 4], width: 1.6 }, { f: t => xv(t)[0], color: COL.c1, dot: true }]);
        const A = ww => Math.abs(4 * V.k * st.b / (st.K - st.M * ww * ww));
        frfPlot($(id + '-f'), A, Math.max(60, 2.2 * st.wn), [{ x: w, y: Math.abs(st.ss.X) }], { ycap: Math.max(4 * 0.8 * st.b, 1.5 * Math.abs(st.ss.X), 1e-4) * 1000, vlines: [{ x: st.wn, label: 'ωₙ', color: COL.muted }], hlines: [{ y: st.b * 1000, color: COL.c2 }] });
        statsEvery(st, id + '-stats', () => [['ω_n = √(10k/3m)', fmt(st.wn, 4) + ' rad/s'], ['r', fmt(w / st.wn, 3)], ['X = 0.8b/(1 − r²)', mmf(st.ss.X), true],
          ['phase', w < st.wn ? 'in phase with x_B' : 'out of phase with x_B', true], ['x now', mmf(x)], ['x_B now', mmf(xb)]]);
      }
    });
  })();

  /* =====================================================================
     6.C.5  Block A inside box B (smooth floor), springs k on both sides; box moved x_B = b sin wt
     m x'' + 2k x = 2k b sin wt ; sample values m = 2 kg, k = 100 N/m, b = 20 mm
     ===================================================================== */
  (function(){
    const id = 'x6c-5', m = 2, IN = 0.62, BWA = 0.16, BHA = 0.11, RW = 0.03, WALL = 0.025;   // box inner length, block size
    const L0 = (IN - BWA) / 2;                                // unstretched spring length on each side
    makeClip({
      id, speed: 0.5,
      controls: [
        { key: 'w', label: 'Excitation frequency ω', min: 1, max: 25, step: 0.01, value: 7.07, unit: 'rad/s', dec: 2 },
        { key: 'k', label: 'Spring stiffness k', min: 20, max: 300, step: 1, value: 100, unit: 'N/m', dec: 0 },
        { key: 'b', label: 'Box amplitude b', min: 0, max: 40, step: 1, value: 20, unit: 'mm', dec: 0 }],
      presets: (C, st, reset) => [{ label: 'Answer 1: ω = √(k/m) (in phase)', apply: () => C.set({ w: +Math.sqrt(C.v.k / m).toFixed(2) }) },
        { label: 'Answer 2: ω = √(3k/m) (out of phase)', apply: () => C.set({ w: +Math.sqrt(3 * C.v.k / m).toFixed(2) }) }].concat(modeChips(id, reset)),
      reset(st){
        const V = st.V, K = 2 * V.k, b = V.b / 1000, w = V.w;
        st.K = K; st.b = b; st.wn = Math.sqrt(K / m); st.ss = ssSine(m, K, 0, K * b, w);
        st.T = 12; st.win = clamp(8 * TAU / w, 2.5, 6);
        st.tab = mode(id) === 'full' ? table(m, K, 0, t => K * b * Math.sin(w * t), st.T, w) : null;
        // relative motion x - x_B decides whether A could reach a wall of the box
        let rel = 0; if (st.tab){ for (let i = 0; i <= st.tab.n; i += 4) rel = Math.max(rel, Math.abs(st.tab.xs[i] - b * Math.sin(w * i * st.tab.h))); } else rel = Math.abs(st.ss.X - b);
        st.maxAbs = Math.max(st.tab ? st.tab.max : Math.abs(st.ss.X), b); st.ylim = st.maxAbs;
        st.sd = Math.min(1, 0.55 * L0 / Math.max(rel, 1e-9), 0.5 / Math.max(st.maxAbs, 1e-9) * 0.25);
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T) st.t = 0; },
      draw(st){
        const V = st.V, w = V.w, full = mode(id) === 'full';
        const xv = t => full ? at(st.tab, t) : [st.ss.X * Math.sin(w * t), st.ss.X * w * Math.cos(w * t)];
        const [x] = xv(st.t), xb = st.b * Math.sin(w * st.t);
        st.x = x; st.xb = xb; st.xd = st.sd * x; st.xbd = st.sd * xb; st.thB = st.xbd / RW;
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 300, 300), S = 720, Yg = 255, C0 = n ? 320 : 390;
        fitView(ctx, cw, h, n ? [0, 30, 640, 300] : [0, 20, 780, 300]);
        const bx = C0 + st.xbd * S, inL = bx - IN * S / 2, inR = bx + IN * S / 2, wt = WALL * S, yFl = Yg - 2 * RW * S, Hb = 0.2 * S;
        ground(ctx, n ? 0 : 20, n ? 640 : 760, Yg);
        // box B on two wheels: floor slab, two side walls (open top)
        ctx.save(); ctx.fillStyle = '#d6d0c2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
        ctx.fillRect(inL - wt, yFl - wt, IN * S + 2 * wt, wt); ctx.strokeRect(inL - wt, yFl - wt, IN * S + 2 * wt, wt);
        ctx.fillRect(inL - wt, yFl - wt - Hb, wt, Hb); ctx.strokeRect(inL - wt, yFl - wt - Hb, wt, Hb);
        ctx.fillRect(inR, yFl - wt - Hb, wt, Hb); ctx.strokeRect(inR, yFl - wt - Hb, wt, Hb); ctx.restore();
        [inL + 0.12 * S, inR - 0.12 * S].forEach(cx => wheel(ctx, cx, Yg - RW * S, RW * S, st.thB, 'disk'));
        lab(ctx, 'B', inL - wt - 16, yFl - wt - Hb + 8, n);
        const yIn = yFl - wt, xa = C0 + st.xd * S, ya = yIn - BHA * S / 2;      // block A rests on the box floor
        springLine(ctx, inL, ya, xa - BWA * S / 2, ya, 9, 7); springLine(ctx, xa + BWA * S / 2, ya, inR, ya, 9, 7);
        block(ctx, xa, ya, BWA * S, BHA * S, 0, '');
        lab(ctx, 'A', xa, ya, n, { fixed: true }); lab(ctx, 'k', (inL + xa - BWA * S / 2) / 2, ya - 20, n); lab(ctx, 'k', (xa + BWA * S / 2 + inR) / 2, ya - 20, n);
        small(ctx, 'smooth', xa, yIn + 13, n);
        fArrow(ctx, bx, yFl - wt - Hb - 22, bx + xb / Math.max(st.b, 1e-9) * 50, yFl - wt - Hb - 22, COL.c2, 2.2); lab(ctx, 'x_B(t) = b sin ωt', bx, yFl - wt - Hb - 50, n, { color: COL.c2 });
        sdNote(ctx, st, 8, 30, n);
        small(ctx, full ? 'full response from rest' : 'steady state only', n ? 630 : 770, 30, n, { align: 'right', color: COL.fg });
        timePlot($(id + '-t'), st, [{ f: t => st.b * Math.sin(w * t), color: COL.c2, dash: [5, 4], width: 1.6 }, { f: t => xv(t)[0], color: COL.c1, dot: true }]);
        const A = ww => Math.abs(1 / (1 - (ww / st.wn) ** 2)) / 1000;      // ratio |X|/b (frfPlot scales by 1000)
        frfPlot($(id + '-f'), A, Math.max(25, 2.4 * st.wn), [{ x: w, y: Math.abs(st.ss.X) / Math.max(st.b, 1e-9) / 1000 }],
          { ycap: 5, ylabel: 'amplitude ratio |X|/b', hlines: [{ y: 2, color: COL.c3 }], vlines: [{ x: Math.sqrt(V.k / m), label: '√(k/m)', color: COL.c3 }, { x: Math.sqrt(3 * V.k / m), label: '√(3k/m)', color: COL.c3 }, { x: st.wn, color: COL.muted }] });
        const ratio = st.b > 0 ? st.ss.X / st.b : 0;
        statsEvery(st, id + '-stats', () => [['ω_n = √(2k/m)', fmt(st.wn, 4) + ' rad/s'], ['X/b = 1/(1 − r²)', fmt(ratio, 4), true], ['|X|/b', fmt(Math.abs(ratio), 4), true],
          ['√(k/m)', fmt(Math.sqrt(V.k / m), 4) + ' rad/s'], ['√(3k/m)', fmt(Math.sqrt(3 * V.k / m), 4) + ' rad/s']]);
      }
    });
  })();

  /* =====================================================================
     6.C.6  Trailer on a wavy road. Quarter-car model m y'' + k y = k y_B(t), y_B = vertical motion of the wheel center.
     The wheel (radius RW) touches the road profile exactly: its center height is the upper envelope of the road
     offset by RW, so the wheel never cuts into the road. Steady state from a Fourier series of y_B.
     ===================================================================== */
  (function(){
    const id = 'x6c-6', m = 400, k = 75 * 9.81 / 0.003, lam = 1.2, bR = 0.05, RW = 0.09, D0 = 0.42, TRAVEL = 0.25;   // D0: static axle-to-body distance
    const road = (x, wavy) => (wavy || x > 0) ? bR * Math.sin(TAU * x / lam) : 0;     // road height (m); flat before x = 0 when starting from rest
    // height of the wheel center above the mean road line when the center is at horizontal position xc
    function ctr(xc, wavy){ let best = -1e9; for (let i = -40; i <= 40; i++){ const s = xc + RW * i / 40, d = RW * RW - (s - xc) ** 2; best = Math.max(best, road(s, wavy) + Math.sqrt(Math.max(0, d))); } return best - RW; }
    // Fourier series of the periodic wheel-center profile (one wavelength)
    const NF = 128, cof = (() => { const ys = []; for (let i = 0; i < NF; i++) ys.push(ctr(lam * i / NF, true)); const out = [];
      for (let h = 0; h <= 6; h++){ let a = 0, b = 0; ys.forEach((y, i) => { a += y * Math.cos(TAU * h * i / NF); b += y * Math.sin(TAU * h * i / NF); }); out.push([2 * a / NF / (h ? 1 : 2), 2 * b / NF]); } return out; })();
    const wn = Math.sqrt(k / m);
    makeClip({
      id, speed: 0.5,
      controls: [{ key: 'v', label: 'Towing speed v', min: 2, max: 60, step: 0.5, value: 25, unit: 'km/h', dec: 1 }],
      presets: (C, st, reset) => [{ label: 'Book speed (25 km/h)', apply: () => C.set({ v: 25 }) }, { label: 'Critical speed (17.0 km/h)', apply: () => C.set({ v: 17 }) },
        { label: 'Slow (8 km/h)', apply: () => C.set({ v: 8 }) }].concat(modeChips(id, reset)),
      reset(st){
        const v = st.V.v / 3.6, w = TAU * v / lam, full = mode(id) === 'full'; st.vm = v; st.w = w; st.r = w / wn;
        st.x0 = full ? 0.5 : 0;                                         // from rest: the wheel first rolls 0.5 m on flat road
        st.T = 8 + st.x0 / v; st.win = clamp(8 * TAU / w, 2, 5);
        st.yB = t => ctr(v * t - st.x0, !full);
        st.bottom = false; st.tooBig = false;
        if (full){
          st.tab = table(m, k, 0, t => k * st.yB(t), st.T, 7 * w); st.maxAbs = 0;
          // the suspension can only stretch or compress by TRAVEL: stop the motion where the linear model would need more
          for (let i = 0; i <= st.tab.n; i++){ const t = i * st.tab.h, rel = Math.abs(st.tab.xs[i] - st.yB(t)); if (rel > TRAVEL){ st.T = t; st.bottom = true; break; } st.maxAbs = Math.max(st.maxAbs, Math.abs(st.tab.xs[i])); }
        } else { st.tab = null; let mx = 0, rel = 0; for (let i = 0; i < 400; i++){ const t = lam / v * i / 400, yy = ssY(st, t); mx = Math.max(mx, Math.abs(yy)); rel = Math.max(rel, Math.abs(yy - st.yB(t))); } st.maxAbs = mx; st.tooBig = rel > TRAVEL; }
        st.ylim = st.tooBig ? bR : Math.min(Math.max(st.maxAbs, bR), TRAVEL + bR); st.sd = 1;     // true scale
        st.Xbook = bR / Math.abs(1 - st.r * st.r);
      },
      step(st){ if (mode(id) === 'full' && st.t > st.T + (st.bottom ? 2.5 : 0)) st.t = 0; if (st.tooBig) st.t = 0; },
      draw(st){
        const full = mode(id) === 'full', v = st.vm, te = full ? Math.min(st.t, st.T) : st.t;
        const yf = t => st.tooBig ? 0 : full ? at(st.tab, Math.min(t, st.T))[0] : ssY(st, t), y = yf(te), xT = v * te - st.x0;
        st.y = y; st.xd = y; st.xT = xT; st.yC = ctr(xT, !full); st.th = xT / RW; st.wavy = !full;
        const cv = $(id + '-anim'), { ctx, w: cw, h } = fit(cv); ctx.clearRect(0, 0, cw, h);
        const n = nar(cv, cw, 300, 300), S = 260, Yr = 238, Xc = n ? 300 : 390;
        fitView(ctx, cw, h, n ? [40, 40, 560, 300] : [0, 30, 780, 300]);
        // road: drawn in the trailer's frame, so the road moves to the left
        const X = q => Xc + (q - xT) * S, Ys = yy => Yr - yy * S, q0 = xT - 1.4, q1 = xT + 1.4;
        ctx.save(); ctx.beginPath(); ctx.moveTo(X(q0), 300);
        for (let i = 0; i <= 280; i++){ const q = q0 + 2.8 * i / 280; ctx.lineTo(X(q), Ys(road(q, !full))); }
        ctx.lineTo(X(q1), 300); ctx.closePath(); ctx.fillStyle = '#e8e3d6'; ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 280; i++){ const q = q0 + 2.8 * i / 280, px = X(q), py = Ys(road(q, !full)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.restore();
        line(ctx, X(q0), Yr, X(q1), Yr, COL.muted, 1, [3, 4]);
        // one wavelength marked below the road surface (the marks move with the road)
        const vis0 = xT + ((n ? 40 : 0) - Xc) / S + 0.08, vis1 = xT + ((n ? 560 : 780) - Xc) / S - 0.08;   // road visible in the picture
        const c0 = Math.ceil(vis0 / (lam / 2)) * (lam / 2);                    // a crest or a trough
        const msg = (full && st.bottom && st.t >= st.T) || st.tooBig, my = n ? Yr + 52 : 62;
        if ((!full || c0 > 0) && c0 + lam <= vis1 && !(n && msg)){ const yy = Yr + 36; line(ctx, X(c0), yy - 8, X(c0), yy + 8, COL.muted, 1); line(ctx, X(c0 + lam), yy - 8, X(c0 + lam), yy + 8, COL.muted, 1);
          fArrow(ctx, X(c0 + lam / 2), yy, X(c0), yy, COL.muted, 1.2); fArrow(ctx, X(c0 + lam / 2), yy, X(c0 + lam), yy, COL.muted, 1.2); small(ctx, 'λ = 1.2 m', X(c0 + lam / 2), yy + 14, n); }
        if (full && X(0) > X(q0) && X(0) < X(q1)) small(ctx, 'waves start', X(0), Yr + 22, n);
        // wheel (touching the road), spring from the axle to the body, trailer body and tow bar
        const wy = Ys(st.yC + RW), Rp = RW * S, bodyB = Ys(y + RW + D0), bw = 0.9 * S, bh = 0.18 * S;
        wheel(ctx, Xc, wy, Rp, st.th, 'disk', '#5d6068');
        springLine(ctx, Xc, wy, Xc, bodyB, 7, 9);
        block(ctx, Xc, bodyB - bh / 2, bw, bh, 0, '');
        line(ctx, Xc + bw / 2, bodyB - bh * 0.3, Xc + bw / 2 + 0.4 * S, bodyB - bh * 0.3, COL.fg, 4);   // tow bar
        lab(ctx, 'm', Xc, bodyB - bh / 2, n, { fixed: true }); lab(ctx, 'k', Xc - 24, (wy + bodyB) / 2, n);
        const va = bodyB + 22, vx = Xc + bw / 2 + 0.12 * S;                // speed arrow below the tow bar
        fArrow(ctx, vx, va, vx + 60, va, COL.c3, 2.2); lab(ctx, 'v', vx + 74, va, n, { color: COL.c3 });
        if (!n) small(ctx, full ? 'full response: flat road first, then the waves' : 'steady state on the wavy road', 770, 42, n, { align: 'right', color: COL.fg });   // on phones the body can rise into this space
        if (full && st.bottom && st.t >= st.T) small(ctx, n ? 'The suspension would bottom out here.' : 'The suspension would bottom out here. Without damping the response keeps growing.', n ? 60 : 20, my, n, { align: 'left', color: RED });
        if (st.tooBig) small(ctx, n ? 'Steady state too large to animate.' : `The steady state (X = ${fmt(st.Xbook, 3)} m) is far beyond the suspension travel, so it is not animated.`, n ? 60 : 20, my, n, { align: 'left', color: RED });
        const pst = Object.assign({}, st, { t: te });
        timePlot($(id + '-t'), pst, [{ f: st.yB, color: COL.c2, dash: [5, 4], width: 1.6 }, { f: yf, color: COL.c1, dot: true }]);
        const A = vk => { const r = TAU * vk / 3.6 / lam / wn; return bR / Math.abs(1 - r * r); };
        frfPlot($(id + '-f'), A, 60, [{ x: st.V.v, y: st.Xbook }], { ycap: 250, xlabel: 'towing speed v (km/h)', vlines: [{ x: wn * lam / TAU * 3.6, label: 'critical speed', color: COL.muted }], hlines: [{ y: 50, color: COL.c2 }] });
        statsEvery(st, id + '-stats', () => [['k = (75)(9.81)/0.003', fmt(k, 4) + ' N/m'], ['ω_n', fmt(wn, 4) + ' rad/s'], ['ω = 2πv/λ', fmt(st.w, 4) + ' rad/s'],
          ['X = b/|1 − r²|', mmf(st.Xbook), true], ['critical speed', fmt(wn * lam / TAU * 3.6, 4) + ' km/h', true], ['y now', mmf(y)]]);
      }
    });
    function ssY(st, t){ let y = 0; for (let h = 1; h < cof.length; h++){ const g = 1 / (1 - (h * st.w / wn) ** 2), ph = h * st.w * t; y += g * (cof[h][0] * Math.cos(ph) + cof[h][1] * Math.sin(ph)); } return y + cof[0][0]; }
  })();

  subLabels();
})();
