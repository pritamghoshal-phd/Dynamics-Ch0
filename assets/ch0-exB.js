/* =========================================================
   Chapter 0, Section B examples (free-body diagrams): 0.B.1 to 0.B.3
   ========================================================= */
(function(){
const LB = 'italic 15px Georgia, serif';
const boundary = (ctx, x, y, w, h) => { ctx.save(); ctx.strokeStyle = RED; ctx.setLineDash([7, 5]); ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.restore(); };

/* ---------- 0.B.1: block pushed by an inclined force on a rough floor ----------
   state: x (m, displacement of A), v (m/s), N, fr (friction), a, stopped */
makeClip({
  id: 'x0b-1', speed: 1,
  controls: [
    { key: 'F', label: 'Force F', min: 0, max: 60, step: 1, value: 30, unit: 'N', dec: 1 },
    { key: 'th', label: 'Angle θ below the horizontal', min: 0, max: 80, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 3, unit: 'kg', dec: 2 },
    { key: 'mk', label: 'Kinetic friction coefficient μ_k', min: 0, max: 1, step: 0.01, value: 0.3, unit: '', dec: 3 }
  ],
  reset(st){
    const V = st.V; st.ok = V.m > 0; if (!st.ok) return;
    st.N = V.m * G0 + V.F * Math.sin(V.th * RAD); st.fr = V.mk * st.N;
    st.a = (V.F * Math.cos(V.th * RAD) - st.fr) / V.m; st.x = 0; st.v = 1.5; st.stopped = false;
    setStats('x0b-1-stats', [['N = mg + F sin θ', fmt(st.N, 4) + ' N', true], ['friction μ_k N (opposes the sliding)', fmt(st.fr, 4) + ' N', true],
      ['a = (F cos θ − μ_k N)/m', fmt(st.a, 4) + ' m/s²']]);
  },
  step(st, dt){
    if (!st.ok) return;
    if (st.x > 4.4 || st.t > 6){ st.t = 0; st.x = 0; st.v = 1.5; st.stopped = false; return; }
    if (!st.stopped){ st.v += st.a * dt; if (st.v <= 0){ st.v = 0; st.stopped = true; } st.x += st.v * dt; }
  },
  draw(st){
    const cv = $('x0b-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'The mass must be positive.'); return; }
    const nr = nar(cv, w, 300, 600); fitView(ctx, w, h, nr ? [0, 0, 450, 560] : [0, 0, 780, 270]);
    const V = st.V, th = V.th * RAD, x = 120 + Math.min(st.x * 55, 245), fy = 170;
    line(ctx, 20, fy, 440, fy, COL.fg, 2); hatch(ctx, 20, fy, 440, fy, 1);
    block(ctx, x, fy - 35, 70, 70, 0, 'A');
    const L = 30 + V.F * 1.2; arrow(ctx, x - 35 - L * Math.cos(th), fy - 70 - L * Math.sin(th) + 4, x - 35, fy - 66, COL.c1, 3);
    txt(ctx, 'F', x - 44 - L * Math.cos(th), fy - 74 - L * Math.sin(th), { color: COL.c1, font: LB });
    txt(ctx, st.stopped ? 'A has stopped: friction won' : `v = ${fmt(st.v, 3)} m/s`, x, fy + 26, { font: '12px system-ui', color: COL.muted });
    // free-body diagram of A, drawn to scale with the forces of this instant
    if (nr){ ctx.translate(-395, 300); line(ctx, 420, -10, 820, -10, COL.axis, 1); } else line(ctx, 470, 20, 470, 250, COL.axis, 1);
    txt(ctx, st.stopped ? 'Free-body diagram (at rest)' : 'Free-body diagram (sliding to the right)', 615, 18, { font: '600 13px system-ui' });
    const cx = 615, cy = 128, s = 1.6; block(ctx, cx, cy, 64, 64, 0, 'A');
    const LF = 20 + V.F * s * 0.9;
    arrow(ctx, cx - 32 - LF * Math.cos(th), cy - 32 - LF * Math.sin(th), cx - 32, cy - 32, COL.c1, 3); txt(ctx, 'F', cx - 42 - LF * Math.cos(th), cy - 40 - LF * Math.sin(th), { color: COL.c1, font: LB });
    const Lw = clamp(V.m * G0 * s, 14, 90), LN = clamp(st.N * s * (st.stopped ? 1 : 1), 14, 110);
    arrow(ctx, cx - 8, cy, cx - 8, cy + Lw + 32, '#c2410c', 2.8); txt(ctx, 'mg', cx - 16, cy + Lw + 26, { color: '#c2410c', font: LB, align: 'right' });
    arrow(ctx, cx + 18, cy + 32 + LN, cx + 18, cy + 32, '#17915a', 2.8); txt(ctx, 'N', cx + 26, cy + 32 + LN - 6, { color: '#17915a', font: LB, align: 'left' });
    // friction: kinetic while sliding; at rest the static friction balances F cos θ (if it can)
    const frNow = st.stopped ? Math.min(V.F * Math.cos(th), V.mk * st.N) : st.fr;
    if (frNow > 0.05){ const fl = clamp(frNow * s, 14, 100); arrow(ctx, cx - 32, cy + 32, cx - 32 - fl, cy + 32, RED, 3); txt(ctx, st.stopped ? 'F_f' : 'μ_k N', cx - 36 - fl, cy + 18, { color: RED, font: LB, align: 'right' }); }
  }
});

/* ---------- 0.B.2: block A, two pulleys and block B ----------
   state: d (m, displacement of A to the right; B drops d/2), aA, T, sys */
(function(){
  const SYS = [['(a) A alone', 'a'], ['(b) B and the lower pulley', 'b'], ['(c) Upper pulley alone', 'c'], ['(d) Whole system', 'd']];
  makeClip({
    id: 'x0b-2', speed: 1,
    controls: [
      { key: 'm', label: 'Mass of A, m', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 },
      { key: 'M', label: 'Mass of B, M', min: 0.5, max: 20, step: 0.1, value: 6, unit: 'kg', dec: 2 },
      { key: 'mk', label: 'Kinetic friction coefficient μ_k', min: 0, max: 1, step: 0.01, value: 0.2, unit: '', dec: 3 }
    ],
    presets: (C, st, reset) => chips5('x0b-2', SYS, st, reset, 'sys'),
    setup(st){ st.sys = 'a'; },
    reset(st){
      mark5('x0b-2', st, 'sys', SYS);
      const V = st.V, g = G0; st.ok = V.m > 0 && V.M > 0; if (!st.ok) return;
      st.aA = (V.M - 2 * V.mk * V.m) * g / (V.M / 2 + 2 * V.m); st.T = V.m * st.aA + V.mk * V.m * g;
      st.moves = st.aA > 0; if (!st.moves){ st.aA = 0; st.T = V.M * g / 2; }
      st.d = 0;
      setStats('x0b-2-stats', [['a_A', fmt(st.aA, 4) + ' m/s² (to the right)', true], ['a_B = a_A / 2', fmt(st.aA / 2, 4) + ' m/s² (down)'], ['rope tension T', fmt(st.T, 4) + ' N', true],
        ['pin force at O', `O_x = ${fmt(st.T, 3)} N, O_y = ${fmt(2 * st.T, 3)} N`]]);
    },
    step(st){ if (!st.ok) return; st.d = Math.min(0.5 * st.aA * st.t * st.t, 1.6); if (st.d >= 1.6 && st.t > Math.sqrt(3.2 / Math.max(st.aA, 1e-6)) + 1) st.t = 0; if (!st.moves && st.t > 3) st.t = 0; },
    draw(st){
      const cv = $('x0b-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (!st.ok){ drawMessage(cv, 'The masses must be positive.'); return; }
      const nr = nar(cv, w, 350, 720); fitView(ctx, w, h, nr ? [0, 0, 400, 690] : [0, 0, 790, 340]);
      const S = 50, d = st.d * S, xA = 100 + d, Cx = 330, Cy = 82, r = 14, rq = r / 2, Qx = Cx + rq, Qy = 190 + d / 2, ty = 106;
      // table with the bracket that holds pulley O at its corner
      ctx.save(); ctx.fillStyle = '#9db7e0'; ctx.fillRect(20, ty, 292, 12); ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.strokeRect(20, ty, 292, 12); ctx.restore();
      hatch(ctx, 20, ty + 12, 312, ty + 12, 1);
      line(ctx, Cx, Cy, 312, ty, COL.fg, 3);
      block(ctx, xA, ty - 28, 64, 56, 0, 'A');
      // rope: A -> top of O -> down the right side -> around the lower pulley -> up to the axle of O
      cable(ctx, () => { ctx.moveTo(xA + 32, Cy - r); ctx.lineTo(Cx, Cy - r); ctx.arc(Cx, Cy, r, -Math.PI / 2, 0); ctx.lineTo(Cx + r, Qy); ctx.arc(Qx, Qy, rq, 0, Math.PI); ctx.lineTo(Cx, Cy); });
      pulley(ctx, Cx, Cy, r); pulley(ctx, Qx, Qy, rq);
      line(ctx, Qx, Qy, Qx, Qy + 16, COL.fg, 2); block(ctx, Qx, Qy + 38, 52, 44, 0, 'B');
      txt(ctx, 'O', Cx + 24, Cy - 18, { font: LB });
      if (st.sys){ const bx = { a: [xA - 42, 40, 84, 72], b: [Qx - 36, Qy - 14, 72, 80], c: [Cx - 24, Cy - 24, 48, 48], d: [70, 34, 300, Qy + 66 - 34] }[st.sys]; boundary(ctx, ...bx); }
      // free-body diagram of the chosen system (arrow lengths follow the forces of this instant)
      if (nr){ ctx.translate(-400, 350); line(ctx, 420, -10, 790, -10, COL.axis, 1); } else line(ctx, 420, 20, 420, 320, COL.axis, 1);
      const cx = 600, cy = 165, V = st.V, k = 1.4, Lf = f => clamp(f * k, 18, 95);
      txt(ctx, 'Free-body diagram', cx, 18, { font: '600 13px system-ui' });
      const A = (x1, y1, x2, y2, col, lab, lx, ly, al = 'center') => { arrow(ctx, x1, y1, x2, y2, col, 2.6); txt(ctx, lab, lx, ly, { color: col, align: al, font: LB }); };
      const W = '#c2410c', Nc = '#17915a', Tc = COL.c1, fr = st.moves ? V.mk * V.m * G0 : st.T;
      if (st.sys === 'a'){ block(ctx, cx, cy, 70, 56, 0, 'A');
        A(cx + 35, cy - 14, cx + 35 + Lf(st.T), cy - 14, Tc, 'T', cx + 45 + Lf(st.T), cy - 20, 'left');
        if (fr > 0.01) A(cx - 35, cy + 28, cx - 35 - Lf(fr), cy + 28, RED, st.moves ? 'μ_k N' : 'F_f', cx - 41 - Lf(fr), cy + 16, 'right');
        A(cx - 8, cy, cx - 8, cy + 28 + Lf(V.m * G0), W, 'mg', cx - 16, cy + 22 + Lf(V.m * G0), 'right'); A(cx + 18, cy + 28 + Lf(V.m * G0), cx + 18, cy + 28, Nc, 'N', cx + 26, cy + 22 + Lf(V.m * G0), 'left'); }
      if (st.sys === 'b'){ pulley(ctx, cx, cy - 40, 12); line(ctx, cx, cy - 40, cx, cy - 20, COL.fg, 2); block(ctx, cx, cy + 6, 60, 50, 0, 'B');
        A(cx - 12, cy - 40, cx - 12, cy - 40 - Lf(st.T), Tc, 'T', cx - 22, cy - 34 - Lf(st.T), 'right'); A(cx + 12, cy - 40, cx + 12, cy - 40 - Lf(st.T), Tc, 'T', cx + 22, cy - 34 - Lf(st.T), 'left');
        A(cx, cy + 31, cx, cy + 31 + Lf(V.M * G0), W, 'Mg', cx + 10, cy + 25 + Lf(V.M * G0), 'left'); }
      if (st.sys === 'c'){ pulley(ctx, cx, cy, 20);
        A(cx, cy - 20, cx - Lf(st.T), cy - 20, Tc, 'T', cx - 10 - Lf(st.T), cy - 30, 'right'); A(cx + 20, cy, cx + 20, cy + Lf(st.T), Tc, 'T', cx + 30, cy + Lf(st.T) - 6, 'left');
        A(cx, cy, cx, cy + Lf(st.T), Tc, 'T', cx - 10, cy + Lf(st.T) - 6, 'right');
        A(cx + 70, cy - 40, cx + 70 + Lf(st.T) * 0.6, cy - 40, Nc, 'O_x', cx + 80 + Lf(st.T) * 0.6, cy - 46, 'left'); A(cx + 70, cy - 40, cx + 70, cy - 40 - Lf(2 * st.T) * 0.6, Nc, 'O_y', cx + 60, cy - 46 - Lf(2 * st.T) * 0.6, 'right');
        txt(ctx, 'pin force on the pulley (shown to the side)', cx + 70, cy - 18, { font: '11px system-ui', color: COL.muted }); }
      if (st.sys === 'd'){ ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.strokeRect(cx - 115, cy - 90, 230, 190); ctx.restore();
        txt(ctx, 'A, B and both pulleys', cx, cy - 76, { font: '12px system-ui', color: COL.muted });
        if (fr > 0.01) A(cx - 60, cy + 30, cx - 60 - Lf(fr), cy + 30, RED, st.moves ? 'μ_k N' : 'F_f', cx - 66 - Lf(fr), cy + 18, 'right');
        A(cx - 50, cy - 20, cx - 50, cy - 20 + Lf(V.m * G0), W, 'mg', cx - 42, cy - 26 + Lf(V.m * G0), 'left');
        A(cx - 20, cy + 96, cx - 20, cy + 96 - Lf(V.m * G0), Nc, 'N', cx - 12, cy + 88, 'left'); A(cx + 60, cy + 10, cx + 60, cy + 10 + Lf(V.M * G0), W, 'Mg', cx + 68, cy + 4 + Lf(V.M * G0), 'left');
        A(cx + 70, cy - 50, cx + 70 + Lf(st.T) * 0.6, cy - 50, Nc, 'O_x', cx + 80 + Lf(st.T) * 0.6, cy - 56, 'left'); A(cx + 70, cy - 50, cx + 70, cy - 50 - Lf(2 * st.T) * 0.4, Nc, 'O_y', cx + 60, cy - 54 - Lf(2 * st.T) * 0.4, 'right');
        txt(ctx, 'every rope tension is internal', cx, cy + 116, { font: '12px system-ui', color: COL.muted }); }
    }
  });
})();

/* ---------- 0.B.3: piston, connecting rod and crankshaft ----------
   In-line slider crank. Crank center C at the origin, crank pin O at radius r, rod OA of length L, piston pin A on the line y = 0.
   The motion follows from the equation of motion of this one-degree-of-freedom system under the constant force F:
     M(φ) φ̈ + ½ M′(φ) φ̇² + V′(φ) = 0,  M = m_p x_A′² + m_rod |r_G′|² + I_rod β′² + I_C,  V = −F x_A + m_rod g y_G.
   The pin forces then follow from Newton's law for each body (the same free-body diagrams as in the solution).
   state: phi (rad, counterclockwise), w (rad/s), geo (positions in m), forces {Ax, Ay, Ox, Oy, Cx, Cy, N} */
(function(){
  const SYS = [['(a) Piston', 'a'], ['(b) Crankshaft', 'b'], ['(c) Connecting rod', 'c'], ['(d) Whole system', 'd']];
  const P = { r: 0.10, L: 0.34, Rc: 0.16, mp: 2, mr: 1, mc: 8 };
  const geo = phi => { const xO = P.r * Math.cos(phi), yO = P.r * Math.sin(phi), b = Math.asin(yO / P.L), xA = xO - P.L * Math.cos(b);
    return { xO, yO, b, xA, xG: (xO + xA) / 2, yG: yO / 2 }; };
  const d1 = (phi, k) => { const e = 1e-5; return (geo(phi + e)[k] - geo(phi - e)[k]) / (2 * e); };
  const d2 = (phi, k) => { const e = 1e-4; return (geo(phi + e)[k] - 2 * geo(phi)[k] + geo(phi - e)[k]) / (e * e); };
  const Irod = P.mr * P.L * P.L / 12, IC = 0.5 * P.mc * P.Rc * P.Rc;
  const Mass = phi => P.mp * d1(phi, 'xA') ** 2 + P.mr * (d1(phi, 'xG') ** 2 + d1(phi, 'yG') ** 2) + Irod * d1(phi, 'b') ** 2 + IC;
  makeClip({
    id: 'x0b-3', speed: 0.5,
    controls: [
      { key: 'F', label: 'Force F on the piston', min: 0, max: 60, step: 1, value: 20, unit: 'N', dec: 1 },
      { key: 'w0', label: 'Crank speed ω_0 at the start', min: 4, max: 20, step: 0.5, value: 12, unit: 'rad/s', dec: 1 }
    ],
    presets: (C, st, reset) => chips5('x0b-3', SYS, st, () => { st.keep = true; reset(); }, 'sys'),
    setup(st){ st.sys = 'a'; },
    reset(st){
      mark5('x0b-3', st, 'sys', SYS);
      if (!st.keep){ st.phi = Math.PI; st.w = st.V.w0; } st.keep = false;   // start with the crank pin O on the left (piston at the far left)
      st.P = P; st.geo = geo(st.phi); st.F = forces(st, 0);
    },
    step(st, dt){
      const V = st.V, f = s => { const phi = s[0], w = s[1], e = 1e-4, M = Mass(phi), Mp = (Mass(phi + e) - Mass(phi - e)) / (2 * e);
        const Vp = -V.F * d1(phi, 'xA') + P.mr * G0 * d1(phi, 'yG');
        return [w, -(0.5 * Mp * w * w + Vp) / M]; };
      let s = [st.phi, st.w]; const n = Math.max(1, Math.ceil(dt / 0.002)), h = dt / n;
      for (let k = 0; k < n; k++) s = rk(f, s, h);
      st.al = f(s)[1]; st.phi = s[0]; st.w = s[1]; st.geo = geo(st.phi); st.F = forces(st, st.al);
      if (st.t > 12){ st.t = 0; st.phi = Math.PI; st.w = V.w0; }
    },
    draw(st){
      const cv = $('x0b-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 330, 640); fitView(ctx, w, h, nr ? [-40, 0, 440, 640] : [-40, 0, 820, 320]);
      const S = 600, Cx = 340, Cy = 165, X = x => Cx + x * S, Y = y => Cy - y * S, g = st.geo;
      // ground, the smooth guide under the piston and the bearing at C
      ctx.save(); ctx.fillStyle = '#9db7e0'; ctx.fillRect(-10, Cy + 36, 220, 10); ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.strokeRect(-10, Cy + 36, 220, 10); ctx.restore();   // longer than the piston's whole stroke
      hatch(ctx, -10, Cy + 46, 210, Cy + 46, 1);
      // bearing post at C, drawn first so it stands behind the disk
      line(ctx, Cx - 22, Cy + P.Rc * S + 10, Cx + 22, Cy + P.Rc * S + 10, COL.fg, 2); line(ctx, Cx, Cy + 9, Cx, Cy + P.Rc * S + 10, '#6b665c', 4); hatch(ctx, Cx - 22, Cy + P.Rc * S + 10, Cx + 22, Cy + P.Rc * S + 10, 1, 7, 6); txt(ctx, 'smooth', 175, Cy + 60, { font: '12px system-ui', color: COL.muted });
      // crankshaft disk (mass m_c) turning about the fixed bearing C
      ctx.save(); ctx.fillStyle = '#cfcac0'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Cx, Cy, P.Rc * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(Cx, Cy); ctx.lineTo(X(g.xO), Y(g.yO)); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#6b665c'; ctx.fillRect(Cx - 9, Cy - 9, 18, 18); ctx.restore(); pinDot(ctx, Cx, Cy);
      // piston A (mass m_p)
      const xa = X(g.xA); block(ctx, xa - 30, Cy + 6, 60, 60, 0, ''); txt(ctx, 'A', xa - 46, Cy - 20, { font: LB });
      // connecting rod
      ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xa, Cy); ctx.lineTo(X(g.xO), Y(g.yO)); ctx.stroke();
      ctx.strokeStyle = '#efe7d2'; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
      pinDot(ctx, xa, Cy); pinDot(ctx, X(g.xO), Y(g.yO));
      txt(ctx, 'O', X(g.xO) + 14 * Math.cos(st.phi), Y(g.yO) - 14 * Math.sin(st.phi), { font: LB }); txt(ctx, 'C', Cx + 16, Cy + 18, { font: LB });
      arrow(ctx, xa - 104, Cy + 6, xa - 62, Cy + 6, COL.c1, 3); txt(ctx, 'F', xa - 84, Cy - 14, { color: COL.c1, font: LB, align: 'right' });
      if (st.sys){ const bx = { a: [xa - 66, Cy - 30, 72, 72], b: [Cx - P.Rc * S - 8, Cy - P.Rc * S - 8, 2 * P.Rc * S + 16, 2 * P.Rc * S + 16],
        c: [Math.min(xa, X(g.xO)) - 12, Math.min(Cy, Y(g.yO)) - 12, Math.abs(X(g.xO) - xa) + 24, Math.abs(Y(g.yO) - Cy) + 24], d: [xa - 70, Cy - P.Rc * S - 12, Cx + P.Rc * S + 12 - (xa - 70), 2 * P.Rc * S + 24] }[st.sys]; boundary(ctx, ...bx); }
      // live pin forces on the chosen system (the forces that a free-body diagram of it shows)
      if (nr){ ctx.translate(-430, 330); line(ctx, 440, -10, 830, -10, COL.axis, 1); } else line(ctx, 520, 15, 520, 305, COL.axis, 1);
      const Fz = st.F, lines = { a: [['F', st.V.F], ['m_p g', P.mp * G0], ['N (smooth floor)', Fz.N], ['A_x (from the rod)', Fz.Ax], ['A_y (from the rod)', Fz.Ay]],
        b: [['m_c g', P.mc * G0], ['O_x (from the rod)', -Fz.Ox], ['O_y (from the rod)', -Fz.Oy], ['C_x (bearing)', Fz.Cx], ['C_y (bearing)', Fz.Cy]],
        c: [['m_rod g', P.mr * G0], ['at A (from the piston)', `${fmt(-Fz.Ax, 3)}, ${fmt(-Fz.Ay, 3)}`], ['at O (from the crank)', `${fmt(Fz.Ox, 3)}, ${fmt(Fz.Oy, 3)}`]],
        d: [['F', st.V.F], ['N', Fz.N], ['C_x', Fz.Cx], ['C_y', Fz.Cy], ['weights', (P.mp + P.mr + P.mc) * G0]] }[st.sys];
      txt(ctx, 'Forces on this system right now (N)', 670, 30, { font: '600 13px system-ui' });
      lines.forEach(([n, v], i) => { txt(ctx, n, 545, 66 + i * 30, { font: '13px system-ui', align: 'left' }); txt(ctx, typeof v === 'number' ? fmt(v, 3) : v, 805, 66 + i * 30, { font: '13px system-ui', align: 'right', color: COL.c1 }); });
      txt(ctx, `ω = ${fmt(st.w, 3)} rad/s`, 545, 66 + 5 * 30 + 6, { font: '12px system-ui', color: COL.muted, align: 'left' });
      if (Fz.N < 0) txt(ctx, 'N < 0: the rod would lift the piston off the surface', 545, 66 + 7 * 30 - 4, { font: '600 12px system-ui', color: RED, align: 'left' });
      txt(ctx, 'components: x to the right, y up', 545, 66 + 6 * 30, { font: '12px system-ui', color: COL.muted, align: 'left' });
    }
  });
  // Newton's law for each body with the accelerations of this instant.
  // Forces on the piston from the rod: (Ax, Ay); on the rod from the crank at O: (Ox, Oy); on the crank from the bearing: (Cx, Cy).
  function forces(st, al){
    const phi = st.phi, w = st.w, acc = k => d2(phi, k) * w * w + d1(phi, k) * al, V = st.V, g = geo(phi);
    const aA = acc('xA'), aGx = acc('xG'), aGy = acc('yG'), alr = acc('b');
    const Ax = P.mp * aA - V.F;                                  // piston, x
    // rod: forces −(Ax, Ay) at A and (Ox, Oy) at O, weight at G. Unknowns Ay, Ox, Oy.
    //  x: −Ax + Ox = m aGx ;  y: −Ay + Oy − m g = m aGy ;  moment about G: rA × (−A) + rO × O = I α
    const Ox = P.mr * aGx + Ax, rAx = g.xA - g.xG, rAy = -g.yG, rOx = g.xO - g.xG, rOy = g.yO - g.yG;
    // moment: rAx(−Ay) − rAy(−Ax) + rOx Oy − rOy Ox = I α, with Oy = m aGy + m g + Ay
    const Ay = (Irod * alr + rAy * (-Ax) + rOy * Ox - rOx * (P.mr * aGy + P.mr * G0)) / (rOx - rAx);
    const Oy = P.mr * aGy + P.mr * G0 + Ay;
    const N = P.mp * G0 - Ay;                                    // piston, y (no vertical acceleration)
    const Cx = Ox, Cy = Oy + P.mc * G0;                          // crank: mass center fixed at C (rotation is balanced by the bearing)
    return { Ax, Ay, Ox, Oy, Cx, Cy, N };
  }
})();

subLabels();
})();
