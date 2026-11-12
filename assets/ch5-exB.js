/* =========================================================
   Chapter 5, Section B examples (work and energy): animations for
   5.B.3, 5.B.5, 5.B.6, 5.B.7, 5.B.8, 5.B.9 and 5.B.10.
   5.B.1 and 5.B.4 use the clips e-b1 and e-b4 in ch5.js.
   Every animation integrates the actual equation of motion of the system.
   ========================================================= */
(function(){
  const GUS = 32.2; // ft/s²
  // energy bars with headroom, so the value labels never touch the title
  const ebarsB = (ctx, x, y, w, h, items, max, title) => ebars(ctx, x, y, w, h, items, max * 1.25, title);

  // one-degree-of-freedom Lagrange system: T = ½ M(q) q̇², potential V(q) (applied constant forces included in V)
  // q̈ = −(½ M'(q) q̇² + V'(q)) / M(q), with derivatives by central differences
  function lagStep(M, V, s, dt, hmax = 0.001, hd = 1e-6){
    const f = y => { const q = y[0], qd = y[1], Mq = M(q), Mp = (M(q + hd) - M(q - hd)) / (2 * hd), Vp = (V(q + hd) - V(q - hd)) / (2 * hd);
      return [qd, (-0.5 * Mp * qd * qd - Vp) / Mq]; };
    return stepN(f, s, dt, hmax);
  }
  // vertical wall with hatching on its left (for a wall-mounted pin)
  function wall(ctx, x, y1, y2){ line(ctx, x, y1, x, y2, COL.fg, 2); hatch(ctx, x, y1, x, y2, 1, 7, 6); }
  // a slider guide made of two hatched walls
  function vGuide(ctx, x, y1, y2, gap){
    line(ctx, x - gap, y1, x - gap, y2, COL.fg, 2); hatch(ctx, x - gap, y1, x - gap, y2, 1, 7, 6);
    line(ctx, x + gap, y1, x + gap, y2, COL.fg, 2); hatch(ctx, x + gap, y2, x + gap, y1, 1, 7, 6);
  }
  const bar = (ctx, x1, y1, x2, y2, w = 10) => { line(ctx, x1, y1, x2, y2, COL.massEdge, w + 4); line(ctx, x1, y1, x2, y2, COL.mass, w); };
  const dot = (ctx, x, y, c) => { ctx.fillStyle = c || COL.fg; ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill(); };
  const lab = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: 'italic 15px Georgia, serif' }, o));
  const small = (ctx, s, x, y, o = {}) => txt(ctx, s, x, y, Object.assign({ font: '12px system-ui', color: COL.muted }, o));
  const status = (ctx, s, x, y, col) => txt(ctx, s, x, y, { font: '600 13px system-ui', color: col || COL.fg });

  /* ---------------- 5.B.3: bar with a spring, swinging from upright to horizontal ---------------- */
  (function(){
    const W = 15, L = 4, m = W / GUS, IO = m * L * L / 3, w1 = 2.9395;
    makeClip({
      id: 'xw-3', speed: 0.5,
      controls: [
        { key: 'w0', label: 'Angular speed at θ = 0, ω_1', min: 0, max: 5, step: 0.01, value: w1, unit: 'rad/s', dec: 4 },
        { key: 'k', label: 'Spring stiffness k', min: 0, max: 8, step: 0.1, value: 3, unit: 'lb/ft', dec: 3 }
      ],
      presets: C => [{ label: 'ω_1 from the solution', apply: () => C.set({ w0: w1, k: 3 }) }, { label: 'A little slower', apply: () => C.set({ w0: 2.5 }) }, { label: 'A little faster', apply: () => C.set({ w0: 3.3 }) }],
      reset(st){ st.s = [0, st.V.w0]; st.lastT = 0; st.hold = undefined; st.end = ''; st.maxTh = 0; },
      step(st){
        if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [0, st.V.w0]; st.hold = undefined; st.end = ''; st.maxTh = 0; } return; }
        const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
        const dV = th => { const l = Math.sqrt(52 - 48 * Math.cos(th)); return -2 * W * Math.sin(th) + V.k * (l - 2) * 24 * Math.sin(th) / l; };
        st.s = stepN(s => [s[1], -dV(s[0]) / IO], st.s, dt, 0.0005);
        st.maxTh = Math.max(st.maxTh, Math.abs(st.s[0]));
        if (Math.abs(st.s[0]) >= Math.PI / 2){ // the bar is stopped when it becomes horizontal
          if (Math.abs(st.s[1]) < 0.05){ st.s = [Math.sign(st.s[0]) * Math.PI / 2, 0]; }
          else { st.s[0] = Math.sign(st.s[0]) * Math.PI / 2; st.hold = st.t; st.end = 'The bar is still turning when it becomes horizontal (θ = 90°), so ω_1 is too large.'; }
        }
        if (st.t > 12){ st.hold = st.t; }
      },
      draw(st){
        const cv = $('xw-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 360, 640), V = st.V, S = 48, ox = 190, oy = 330, th = st.s[0];
        fitView(ctx, w, h, n ? [0, 0, 400, 620] : [0, 0, 720, 360]);
        const bx = ox, by = oy - 6 * S, ax = ox + L * S * Math.sin(th), ay = oy - L * S * Math.cos(th);
        line(ctx, ox, oy, bx, by, COL.axis, 1, [4, 4]);
        springLine(ctx, bx, by, ax, ay, 9, 7);
        ceilingPin(ctx, bx, by, 24);
        pin(ctx, ox, oy, 24);
        bar(ctx, ox, oy, ax, ay); pinDot(ctx, ox, oy); dot(ctx, ax, ay);
        dot(ctx, (ox + ax) / 2, (oy + ay) / 2);
        lab(ctx, 'O', ox - 16, oy - 8); lab(ctx, 'B', bx - 16, by + 10); lab(ctx, 'A', ax + (th >= 0 ? 12 : -12), ay - 8); lab(ctx, 'G', (ox + ax) / 2 + 12, (oy + ay) / 2 + 8);
        const l = Math.sqrt(52 - 48 * Math.cos(th)), Vg = W * 2 * Math.cos(th), Vs = 0.5 * V.k * (l - 2) ** 2, T = 0.5 * IO * st.s[1] ** 2;
        const E0 = W * 2 + 0.5 * IO * V.w0 * V.w0;
        const bx0 = n ? 40 : 420, by0 = n ? 420 : 70;
        ebarsB(ctx, bx0, by0, 280, n ? 160 : 220, [{ label: 'T', val: T, color: COL.c2, num: fmt(T, 3) }, { label: 'V_g', val: Vg, color: COL.c1, num: fmt(Vg, 3) }, { label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 3) }, { label: 'total', val: T + Vg + Vs, color: COL.c3, num: fmt(T + Vg + Vs, 4) }], Math.max(E0, 45), 'Energy (ft·lb)');
        small(ctx, 'V_g is measured from the level of O.', bx0 + 140, by0 + (n ? 190 : 250));
        if (st.end) status(ctx, st.end, n ? 200 : 360, 20, RED);
        statsEvery(st, 'xw-3-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['ω', fmt(Math.abs(st.s[1]), 4) + ' rad/s'], ['largest θ reached', fmt(st.maxTh / RAD, 4) + '°', true], ['spring stretch δ', fmt(l - 2, 4) + ' ft']]);
      }
    });
  })();

  /* ---------------- 5.B.5: two links and a slider, pushed by a horizontal force ---------------- */
  (function(){
    const m = 5, L = 2, th2 = Math.asin(0.8);
    makeClip({
      id: 'xw-5', speed: 0.5,
      controls: [
        { key: 'F', label: 'Force F', min: 0, max: 1500, step: 10, value: 800, unit: 'N', dec: 1 },
        { key: 'M', label: 'Slider mass M', min: 0, max: 40, step: 0.5, value: 10, unit: 'kg', dec: 2 }
      ],
      reset(st){ st.s = [0, 0]; st.lastT = 0; st.hold = undefined; st.end = '';
        const V = st.V, Mc = th => { const s = Math.sin(th), c = Math.cos(th); return m * L * L / 3 + m * L * L * (0.25 * c * c + 2.25 * s * s) + m * L * L / 12 + V.M * 4 * L * L * s * s; };
        const Vf = th => -V.F * L * Math.sin(th) - m * G0 * 0.5 * L * Math.cos(th) - m * G0 * 1.5 * L * Math.cos(th) - V.M * G0 * 2 * L * Math.cos(th);
        st.Mc = Mc; st.Vf = Vf; const E = Vf(0) - Vf(th2); st.w2 = E > 0 ? Math.sqrt(2 * E / Mc(th2)) : NaN; st.vB2 = 2 * L * 0.8 * st.w2;
      },
      step(st){
        if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [0, 0]; st.hold = undefined; st.end = ''; } return; }
        const dt = st.t - st.lastT; st.lastT = st.t;
        st.s = lagStep(st.Mc, st.Vf, st.s, dt);
        if (st.s[0] >= th2){ st.hold = st.t; st.end = 'θ = 53.13°'; }
        else if (st.s[1] < 0 && st.t > 0.05){ st.hold = st.t; st.end = 'The links stop and swing back before θ reaches 53.13°.'; }
        else if (st.t > 10) st.hold = st.t;
      },
      draw(st){
        const cv = $('xw-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 380, 680), V = st.V, S = 72, ox = 170, oy = 50, th = Math.min(st.s[0], th2), thd = st.s[1];
        fitView(ctx, w, h, n ? [0, 0, 400, 660] : [0, 0, 720, 380]);
        const ax = ox + L * S * Math.sin(th), ay = oy + L * S * Math.cos(th), byy = oy + 2 * L * S * Math.cos(th);
        vGuide(ctx, ox, oy + 2 * L * S * 0.55, oy + 2 * L * S + 30, 20);
        line(ctx, ox, oy, ox, oy + 2 * L * S + 30, COL.axis, 1, [4, 4]);
        ceilingPin(ctx, ox, oy, 26);
        block(ctx, ox, byy, 36, 44, 0, '');
        bar(ctx, ox, oy, ax, ay, 8); bar(ctx, ax, ay, ox, byy, 8);
        pinDot(ctx, ox, oy); pinDot(ctx, ax, ay); pinDot(ctx, ox, byy);
        arrow(ctx, ax, ay, ax + 30 + V.F * 0.06, ay, COL.c1, 3); lab(ctx, 'F', ax + 40 + V.F * 0.06, ay - 10, { color: COL.c1 });
        lab(ctx, 'O', ox - 18, oy + 6); lab(ctx, 'A', ax + 12, ay + 14); lab(ctx, 'B', ox - 32, byy);
        if (th > 0.05){ ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(ox, oy, 40, Math.PI / 2 - th, Math.PI / 2); ctx.stroke(); ctx.restore(); lab(ctx, 'θ', ox + 12, oy + 52, { font: 'italic 13px Georgia, serif' }); }
        // energy: work of F, work of gravity, kinetic energy
        const UF = V.F * L * Math.sin(th), Ug = -(m * G0 * 0.5 * L + m * G0 * 1.5 * L + V.M * G0 * 2 * L) * (1 - Math.cos(th)), T = 0.5 * st.Mc(th) * thd * thd;
        const Emax = Math.max(V.F * L * 0.8, 50), bx0 = n ? 40 : 400, by0 = n ? 430 : 70;
        ebarsB(ctx, bx0, by0, 300, n ? 160 : 240, [{ label: 'U_F', val: UF, color: COL.c1, num: fmt(UF, 4) }, { label: 'U_g', val: Ug, color: RED, num: fmt(Ug, 4) }, { label: 'T', val: T, color: COL.c2, num: fmt(T, 4) }], Emax, 'Work and kinetic energy (J)');
        small(ctx, 'U_F + U_g = T at every instant. A faded bar is negative.', bx0 + 150, by0 + (n ? 190 : 270));
        if (st.end) status(ctx, st.end, n ? 200 : 360, 20, st.end.startsWith('θ') ? COL.c3 : RED);
        statsEvery(st, 'xw-5-stats', () => [['θ', fmt(th / RAD, 4) + '°'], ['v_B = 2L sin θ θ̇', fmt(2 * L * Math.sin(th) * thd, 4) + ' m/s'], ['v_B at θ = 53.13°', isFinite(st.vB2) ? fmt(st.vB2, 4) + ' m/s' : 'not reached', true], ['ω_{OA} at θ = 53.13°', isFinite(st.w2) ? fmt(st.w2, 4) + ' rad/s' : '—']]);
      }
    });
  })();

  /* ---------------- 5.B.6: bar pushing a rolling disk (horizontal plane, top view) ---------------- */
  (function(){
    const m = 2, R = 0.2, L = 1.2, d = 0.4;
    makeClip({
      id: 'xw-6', speed: 0.5,
      controls: [{ key: 'F', label: 'Force F', min: 0.5, max: 40, step: 0.5, value: 10, unit: 'N', dec: 2 }],
      reset(st){
        const V = st.V; st.s = [d, 0]; st.lastT = 0; st.hold = undefined;
        st.Mx = x => m * L * L / 3 * Math.pow(R / (x * Math.sqrt(x * x - R * R)), 2) + 1.5 * m;
        st.Vx = x => V.F * L * Math.asin(R / x);
        const p1 = Math.asin(R / d), p2 = Math.asin(R / (2 * d));
        st.vC2 = Math.sqrt(V.F * L * (p1 - p2) / (m * L * L * R * R / (24 * d * d * (4 * d * d - R * R)) + 0.75 * m));
      },
      step(st){
        if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [d, 0]; st.hold = undefined; } return; }
        const dt = st.t - st.lastT; st.lastT = st.t;
        st.s = lagStep(st.Mx, st.Vx, st.s, dt, 0.0005, 1e-7);
        if (st.s[0] >= 2 * d){ st.s[0] = 2 * d; st.hold = st.t; }
      },
      draw(st){
        const cv = $('xw-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 340, 600), V = st.V, S = 330, ox = 50, oy = 230, x = Math.min(st.s[0], 2 * d), xd = st.s[1];
        fitView(ctx, w, h, n ? [0, 0, 470, 600] : [0, 0, 720, 340]);
        small(ctx, 'Top view: everything moves in a horizontal plane.', n ? 235 : 360, 18);
        const phi = Math.asin(R / x), ux = Math.cos(phi), uy = -Math.sin(phi), cx = ox + x * S, cy = oy, Rp = R * S;
        // the straight guide the disk rolls along, and the wall that holds the pin O
        line(ctx, ox + 40, oy + Rp, 700, oy + Rp, COL.fg, 2); hatch(ctx, ox + 40, oy + Rp, 700, oy + Rp, 1, 8, 6);
        wall(ctx, ox - 14, oy - 30, oy + 30); line(ctx, ox - 14, oy, ox, oy, COL.fg, 3);
        wheel(ctx, cx, cy, Rp, (x - d) / R, 'disk');
        const ex = ox + L * S * ux, ey = oy + L * S * uy;
        bar(ctx, ox, oy, ex, ey, 8); pinDot(ctx, ox, oy);
        const lc = Math.sqrt(x * x - R * R) * S; dot(ctx, ox + lc * ux, oy + lc * uy, RED);
        small(ctx, 'smooth contact', ox + lc * ux + 10, oy + lc * uy - 26, { color: RED, align: 'left' });
        const fl = 30 + V.F * 1.5, nx = Math.sin(phi), ny = Math.cos(phi); // F is perpendicular to the bar, turning it clockwise
        arrow(ctx, ex - fl * nx, ey - fl * ny, ex, ey, COL.c1, 3); lab(ctx, 'F', ex - fl * nx - 10, ey - fl * ny - 4, { color: COL.c1, align: 'right' });
        lab(ctx, 'O', ox - 4, oy + 20); lab(ctx, 'C', cx + 8, cy + 16);
        // start and target positions of C
        line(ctx, ox + d * S, oy + Rp + 14, ox + d * S, oy + Rp + 26, COL.muted, 1.5); small(ctx, 'start, x = d', ox + d * S, oy + Rp + 38);
        line(ctx, ox + 2 * d * S, oy + Rp + 14, ox + 2 * d * S, oy + Rp + 26, COL.muted, 1.5); small(ctx, 'x = 2d', ox + 2 * d * S, oy + Rp + 38);
        const UF = V.F * L * (Math.asin(R / d) - phi), dphi = -R / (x * Math.sqrt(x * x - R * R)), Tb = 0.5 * m * L * L / 3 * (dphi * xd) ** 2, Td = 0.75 * m * xd * xd;
        const bx0 = n ? 60 : 470, by0 = n ? 380 : 60;
        ebarsB(ctx, bx0, by0, 230, n ? 150 : 150, [{ label: 'U_F', val: UF, color: COL.c1, num: fmt(UF, 3) }, { label: 'T_{bar}', val: Tb, color: COL.c4, num: fmt(Tb, 3) }, { label: 'T_{disk}', val: Td, color: COL.c2, num: fmt(Td, 3) }], Math.max(V.F * L * (Math.asin(R / d) - Math.asin(R / (2 * d))), 0.1), 'Work and kinetic energy (J)');
        statsEvery(st, 'xw-6-stats', () => [['x_C', fmt(x, 4) + ' m'], ['v_C', fmt(xd, 4) + ' m/s'], ['v_C at x_C = 2d (energy)', fmt(st.vC2, 4) + ' m/s', true], ['bar angle φ', fmt(phi / RAD, 4) + '°']]);
      }
    });
  })();

  /* ---------------- 5.B.7: link with a disk on a pin at C ---------------- */
  (function(){
    const mL = 10, kO = 0.5, L = 1.2, md = 8, r = 0.4, MODES = [['Disk on a smooth pin (as in the problem)', 'pin'], ['Disk welded to the link', 'weld']];
    makeClip({
      id: 'xw-7', speed: 0.5,
      presets: (C, st, reset) => MODES.map(([label, v]) => ({ label, apply: () => { st.mode = v; reset(); } })),
      setup(st){ st.mode = 'pin'; },
      reset(st){
        document.querySelectorAll('#xw-7-pre .chip').forEach((b, i) => b.classList.toggle('on', MODES[i][1] === st.mode));
        st.I = mL * kO * kO + md * L * L + (st.mode === 'weld' ? 0.5 * md * r * r : 0); st.s = [0, 0]; st.lastT = 0;
        st.wv = Math.sqrt(2 * (mL * G0 * 0.3 * L + md * G0 * L) / st.I);
      },
      step(st){
        const dt = st.t - st.lastT; st.lastT = st.t; const K = (mL * 0.3 * L + md * L) * G0;
        st.s = stepN(s => [s[1], K * Math.cos(s[0]) / st.I], st.s, dt);
        if (st.t > 12){ st.t = 0; st.lastT = 0; st.s = [0, 0]; }
      },
      draw(st){
        const cv = $('xw-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 420, 700), S = n ? 115 : 165, ox = n ? 210 : 300, oy = 120, th = st.s[0], c = Math.cos(th), s = Math.sin(th);
        fitView(ctx, w, h, n ? [0, 0, 420, 700] : [0, 0, 720, 420]);
        // O is pinned to a back plate behind the plane of motion (the link swings all the way around, so no wall can sit beside the pin)
        ctx.save(); ctx.fillStyle = COL.panel || '#e9e4d6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(ox - 16, oy - 16, 32, 32); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1; for (let k = -12; k <= 12; k += 6){ ctx.beginPath(); ctx.moveTo(ox + k - 4, oy - 16); ctx.lineTo(ox + k + 4, oy - 22); ctx.stroke(); } ctx.restore();
        const cx = ox + L * S * c, cy = oy + L * S * s, gx = ox + 0.3 * L * S * c, gy = oy + 0.3 * L * S * s;
        // disk: on a smooth pin it does not rotate (no moment about C); welded, it turns with the link
        const rp = r * S, dAng = st.mode === 'weld' ? th : 0;
        ctx.save(); ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.translate(cx, cy); ctx.rotate(dAng); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-rp + 6, 0); ctx.lineTo(rp - 6, 0); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.fillStyle = '#8a8478'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5; ctx.beginPath();
        const px = -s, py = c; ctx.moveTo(ox + 12 * px, oy + 12 * py); ctx.lineTo(cx + 5 * px, cy + 5 * py); ctx.lineTo(cx - 5 * px, cy - 5 * py); ctx.lineTo(ox - 12 * px, oy - 12 * py); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        pinDot(ctx, ox, oy); pinDot(ctx, cx, cy); dot(ctx, gx, gy, '#fff');
        lab(ctx, 'O', ox - 4, oy - 26); lab(ctx, 'G', gx + 26 * px, gy + 26 * py, { color: COL.fg }); lab(ctx, 'C', cx + 26 * px, cy + 26 * py);
        const I = st.I, T = 0.5 * I * st.s[1] ** 2, Vg = -(mL * G0 * 0.3 * L + md * G0 * L) * s;
        const Tl = 0.5 * mL * kO * kO * st.s[1] ** 2, Tdt = 0.5 * md * (L * st.s[1]) ** 2, Tdr = st.mode === 'weld' ? 0.5 * 0.5 * md * r * r * st.s[1] ** 2 : 0;
        const bx0 = n ? 40 : 585, by0 = n ? 460 : 70, Em = (mL * 0.3 * L + md * L) * G0;
        ebarsB(ctx, bx0, by0, n ? 250 : 130, n ? 170 : 240, [{ label: 'T_{link}', val: Tl, color: COL.c4, num: fmt(Tl, 3) }, { label: 'T_{disk}', val: Tdt + Tdr, color: COL.c2, num: fmt(Tdt + Tdr, 3) }, { label: '−V_g', val: -Vg, color: COL.c1, num: fmt(-Vg, 3) }], Em, 'Energy (J)');
        small(ctx, n ? 'The loss of potential energy equals the kinetic energy.' : 'T_{link} + T_{disk} = −V_g', bx0 + (n ? 125 : 65), by0 + (n ? 196 : 266));
        statsEvery(st, 'xw-7-stats', () => [['angle of OC below horizontal', fmt(((th / RAD) % 360 + 360) % 360, 4) + '°'], ['ω_{OC}', fmt(Math.abs(st.s[1]), 4) + ' rad/s'], ['ω_{OC} when OC is vertical', fmt(st.wv, 4) + ' rad/s', true], ['I used, I_O + m_d L² (+ I_C if welded)', fmt(I, 4) + ' kg·m²']]);
      }
    });
  })();

  /* ---------------- 5.B.8: garage door with a spring ---------------- */
  (function(){
    const W = 200, m = W / GUS, k = 40, IG = m * 100 / 12;
    makeClip({
      id: 'xw-8', speed: 0.5,
      controls: [{ key: 'k', label: 'Spring stiffness k', min: 0, max: 120, step: 1, value: k, unit: 'lb/ft', dec: 2 }],
      reset(st){ st.s = [Math.PI / 6, 0]; st.lastT = 0; st.hold = undefined; const V = st.V;
        st.Mq = th => IG + m * Math.pow(5 * Math.cos(th), 2);
        st.Vq = th => -W * 5 * Math.sin(th) + 0.5 * V.k * Math.pow(5 * Math.sin(th) - 2.5, 2);
        const E = st.Vq(Math.PI / 6) - st.Vq(Math.PI / 2); st.vA = E > 0 ? 5 * Math.sqrt(2 * E / IG) : NaN; },
      step(st){
        if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [Math.PI / 6, 0]; st.hold = undefined; } return; }
        const dt = st.t - st.lastT; st.lastT = st.t;
        st.s = lagStep(st.Mq, st.Vq, st.s, dt, 0.0005);
        if (st.s[0] >= Math.PI / 2){ st.s[0] = Math.PI / 2; st.hold = st.t; }
        else if (st.s[1] < 0 && st.t > 0.05){ st.hold = st.t; }
        else if (st.t > 10) st.hold = st.t;
      },
      draw(st){
        const cv = $('xw-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 370, 640), V = st.V, S = 30, Dx = 260, Dy = 40, th = st.s[0], c = Math.cos(th), s = Math.sin(th);
        fitView(ctx, w, h, n ? [0, 0, 420, 640] : [0, 0, 720, 370]);
        // building frame: horizontal guide for A and vertical guide for B, both fixed to the wall
        ctx.save(); ctx.fillStyle = 'rgba(125,119,107,.10)'; ctx.fillRect(Dx - 200, Dy - 22, 230, 10 * S + 30); ctx.restore();
        line(ctx, Dx - 190, Dy - 8, Dx + 8, Dy - 8, COL.fg, 2.5); line(ctx, Dx + 8, Dy - 8, Dx + 8, Dy + 6 * S, COL.fg, 2.5);
        hatch(ctx, Dx + 8, Dy - 8, Dx - 190, Dy - 8, 1, 8, 6); hatch(ctx, Dx + 8, Dy + 6 * S, Dx + 8, Dy - 8, 1, 8, 6);
        const ax = Dx - 5 * S * c, ay = Dy, bx = Dx, by = Dy + 5 * S * s, cx = Dx + 5 * S * c, cy = Dy + 10 * S * s;
        springLine(ctx, Dx, Dy, bx, by, 8, 6);
        bar(ctx, ax, ay, cx, cy, 9);
        pinDot(ctx, ax, ay); pinDot(ctx, bx, by);
        lab(ctx, 'A', ax - 4, ay - 18); lab(ctx, 'B', bx + 18, by + 4); lab(ctx, 'C', cx + 14, cy + 6); lab(ctx, 'D', Dx + 24, Dy - 22, { font: 'italic 13px Georgia, serif', color: COL.muted });
        small(ctx, 'G is at the midpoint B.', Dx - 100, Dy + 10 * S + 18);
        const T = 0.5 * st.Mq(th) * st.s[1] ** 2, Vg = -W * 5 * s, Vs = 0.5 * V.k * (5 * s - 2.5) ** 2, E0 = st.Vq(Math.PI / 6);
        const bx0 = n ? 40 : 440, by0 = n ? 420 : 60;
        ebarsB(ctx, bx0, by0, 260, n ? 160 : 230, [{ label: 'T', val: T, color: COL.c2, num: fmt(T, 4) }, { label: 'V_g', val: Vg, color: COL.c1, num: fmt(Vg, 4) }, { label: 'V_s', val: Vs, color: COL.c4, num: fmt(Vs, 4) }, { label: 'total', val: T + Vg + Vs, color: COL.c3, num: fmt(T + Vg + Vs, 4) }], 1000, 'Energy (ft·lb)');
        small(ctx, 'V_g is measured from the level of the guide AD. A faded bar is negative.', bx0 + 130, by0 + (n ? 188 : 258));
        statsEvery(st, 'xw-8-stats', () => [['θ', fmt(th / RAD, 4) + '°'], ['v_A = 5 sin θ ω', fmt(5 * s * st.s[1], 4) + ' ft/s'], ['v_A when the door is vertical', isFinite(st.vA) ? fmt(st.vA, 4) + ' ft/s' : 'never reached', true], ['ω', fmt(st.s[1], 4) + ' rad/s']]);
      }
    });
  })();

  /* ---------------- 5.B.9: bar with one end on a vertical guide and the other on a circular guide ---------------- */
  (function(){
    const r = 0.5; // sample radius (m); the answer scales with √(g r)
    // geometry: arc centre (0, r), B = (r sin φ, r − r cos φ); A = (2r, y) on the vertical guide; |AB| = 2r
    function phiOf(y){ const f = p => (2 * r - r * Math.sin(p)) ** 2 + (y - r + r * Math.cos(p)) ** 2 - 4 * r * r; let lo = 0, hi = Math.PI / 2;
      for (let i = 0; i < 60; i++){ const mid = 0.5 * (lo + hi); if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } return 0.5 * (lo + hi); }
    function geo(y){ const p = phiOf(y); return { A: [2 * r, y], B: [r * Math.sin(p), r - r * Math.cos(p)] }; }
    function Mq(y){ const hd = 1e-6, g1 = geo(y + hd), g0 = geo(y - hd);
      const vG = [(g1.A[0] + g1.B[0] - g0.A[0] - g0.B[0]) / (4 * hd), (g1.A[1] + g1.B[1] - g0.A[1] - g0.B[1]) / (4 * hd)];
      const ang = gg => Math.atan2(gg.A[1] - gg.B[1], gg.A[0] - gg.B[0]), om = (ang(g1) - ang(g0)) / (2 * hd);
      return vG[0] ** 2 + vG[1] ** 2 + (4 * r * r / 12) * om * om; } // per unit mass
    const Vq = y => { const gg = geo(y); return G0 * (gg.A[1] + gg.B[1]) / 2; };
    const y1 = r * (1 + Math.sqrt(3)), vA2 = Math.sqrt((6 + 3 * Math.sqrt(3)) * G0 * r);
    makeClip({
      id: 'xw-9', speed: 0.25,
      reset(st){ st.s = [y1 - 1e-7, 0]; st.lastT = 0; st.hold = undefined; },
      step(st){
        if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.s = [y1 - 1e-7, 0]; st.hold = undefined; } return; }
        const dt = st.t - st.lastT; st.lastT = st.t;
        st.s = lagStep(Mq, Vq, st.s, dt, 0.0005, 1e-5);
        if (st.s[0] <= 0){ st.s[0] = 0; st.hold = st.t; }
      },
      draw(st){
        const cv = $('xw-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 400, 640), S = 230, ox = 160, oy = 360, X = x => ox + x * S, Y = y => oy - y * S;
        fitView(ctx, w, h, n ? [110, 20, 430, 640] : [0, 0, 720, 400]);
        // guides: circular arc (centre (0, r)) and vertical guide at x = 2r, both mounted to fixed supports
        ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X(0), Y(r), r * S, Math.PI / 2, 0, true); ctx.stroke(); ctx.restore();
        line(ctx, X(0), Y(r), X(0) - 1, Y(r), COL.fg, 1); txt(ctx, '+', X(0), Y(r), { font: '14px system-ui', color: COL.muted });
        line(ctx, X(r), Y(r), X(r), Y(r) - 30, COL.fg, 2.5); hatch(ctx, X(r) + 16, Y(r) - 30, X(r) - 16, Y(r) - 30, 1, 7, 6);
        line(ctx, X(0) - 30, Y(0), X(0) - 6, Y(0), COL.fg, 2.5); hatch(ctx, X(0) - 30, Y(0) - 16, X(0) - 30, Y(0) + 16, 1, 7, 6);
        line(ctx, X(2 * r), Y(r * (1 + Math.sqrt(3))) - 30, X(2 * r), Y(0) + 30, COL.fg, 4);
        hatch(ctx, X(2 * r) + 16, Y(r * (1 + Math.sqrt(3))) - 30, X(2 * r) - 16, Y(r * (1 + Math.sqrt(3))) - 30, 1, 7, 6); hatch(ctx, X(2 * r) - 16, Y(0) + 30, X(2 * r) + 16, Y(0) + 30, 1, 7, 6);
        // position 2 (ghost) and the bar now
        line(ctx, X(0), Y(0), X(2 * r), Y(0), COL.axis, 6); small(ctx, 'position 2', X(r), Y(0) - 14);
        const gg = geo(st.s[0]);
        bar(ctx, X(gg.B[0]), Y(gg.B[1]), X(gg.A[0]), Y(gg.A[1]), 8);
        pinDot(ctx, X(gg.A[0]), Y(gg.A[1])); pinDot(ctx, X(gg.B[0]), Y(gg.B[1])); dot(ctx, X((gg.A[0] + gg.B[0]) / 2), Y((gg.A[1] + gg.B[1]) / 2));
        lab(ctx, 'A', X(gg.A[0]) + 16, Y(gg.A[1])); lab(ctx, 'B', X(gg.B[0]) - 16, Y(gg.B[1]) - 10);
        // velocities of A and B from finite differences of the geometry
        const hd = 1e-5, g1 = geo(st.s[0] + hd), g0 = geo(st.s[0] - hd), yd = st.s[1];
        const vB = [(g1.B[0] - g0.B[0]) / (2 * hd) * yd, (g1.B[1] - g0.B[1]) / (2 * hd) * yd], k = 18;
        if (Math.abs(yd) > 0.02) arrow(ctx, X(gg.A[0]), Y(gg.A[1]), X(gg.A[0]), Y(gg.A[1]) - yd * k, COL.c1, 2.6);
        if (Math.hypot(...vB) > 0.05) arrow(ctx, X(gg.B[0]), Y(gg.B[1]), X(gg.B[0]) + vB[0] * k, Y(gg.B[1]) - vB[1] * k, COL.c2, 2.6);
        const T = 0.5 * Mq(st.s[0]) * yd * yd, drop = Vq(y1) / G0 - Vq(st.s[0]) / G0;
        ebarsB(ctx, n ? 150 : 470, n ? 450 : 80, n ? 240 : 200, n ? 130 : 220, [{ label: 'mg × drop of G', val: G0 * drop, color: COL.c1, num: fmt(G0 * drop, 3) }, { label: 'T', val: T, color: COL.c2, num: fmt(T, 3) }], G0 * r * (1 + Math.sqrt(3) / 2), 'Energy per kg (J/kg)');
        small(ctx, `Sample radius r = ${r} m.`, n ? 270 : 570, n ? 625 : 340);
        statsEvery(st, 'xw-9-stats', () => [['height of A above B’s lowest point', fmt(st.s[0], 4) + ' m'], ['v_A', fmt(Math.abs(yd), 4) + ' m/s'], ['v_B', fmt(Math.hypot(...vB), 4) + ' m/s'], ['v_A at position 2 = √((6 + 3√3) g r)', fmt(vA2, 4) + ' m/s', true]]);
      }
    });
  })();

  /* ---------------- 5.B.10: wheel pulled up an incline by a band ---------------- */
  (function(){
    const Wt = 25, m = Wt / GUS, kG = 1 / 3, r = 0.5, th = Math.atan(0.75), smax = 0.8;
    makeClip({
      id: 'xw-10', speed: 0.25,
      controls: [{ key: 'F', label: 'Band force F', min: 0, max: 40, step: 0.5, value: 20, unit: 'lb', dec: 2 }],
      reset(st){ const V = st.V; st.a = (2 * V.F - Wt * Math.sin(th)) / (m * (1 + kG * kG / (r * r))); st.hold = undefined;
        st.v2 = st.a > 0 ? Math.sqrt(2 * st.a * smax) : NaN; },
      step(st){ if (st.a > 0 && 0.5 * st.a * st.t * st.t >= smax){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.5){ st.t = 0; st.hold = undefined; } }
        else if (st.a <= 0 && st.t > 3){ st.t = 0; } },
      draw(st){
        const cv = $('xw-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
        const n = nar(cv, w, 360, 620), V = st.V, S = 130, tt = st.hold ?? st.t, sx = st.a > 0 ? Math.min(0.5 * st.a * tt * tt, smax) : 0, v = st.a > 0 ? st.a * Math.sqrt(2 * sx / st.a) : 0;
        fitView(ctx, w, h, n ? [0, 0, 440, 620] : [0, 0, 720, 360]);
        // incline rising to the right; the band is fixed at A near the top
        const ux = Math.cos(th), uy = -Math.sin(th), nx = Math.sin(th), ny = Math.cos(th); // up-slope and outward normal (canvas: y down)
        const P0 = [40, 330], Lsl = 3.4, P1 = [P0[0] + Lsl * S * ux, P0[1] + Lsl * S * uy];
        ctx.save(); ctx.fillStyle = 'rgba(125,119,107,.14)'; ctx.strokeStyle = COL.ground; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0], P1[1]); ctx.lineTo(P1[0], P0[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        line(ctx, P0[0] - 10, P0[1], P1[0] + 20, P0[1], COL.fg, 2); hatch(ctx, P0[0] - 10, P0[1], P1[0] + 20, P0[1], 1, 8, 6);
        const at = s => [P0[0] + s * S * ux, P0[1] + s * S * uy];      // point on the slope at distance s (ft)
        const s0 = 0.9, sc = s0 + sx, C = at(sc), Gx = C[0] - r * S * nx, Gy = C[1] - r * S * ny;   // contact point and centre
        const A = at(3.0);
        wheel(ctx, Gx, Gy, r * S, sx / r, 'disk');
        // band: fixed at A, along the slope to the contact point, around the back of the wheel, over the top, then to the pulled end
        const top = [Gx - r * S * nx, Gy - r * S * ny], endS = 0.2 + sx, E = [top[0] + endS * S * ux, top[1] + endS * S * uy];
        ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(C[0], C[1]);
        const aC = Math.atan2(C[1] - Gy, C[0] - Gx); ctx.arc(Gx, Gy, r * S + 1.5, aC, aC + Math.PI, false); ctx.lineTo(E[0], E[1]); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A[0] + 14 * nx, A[1] + 14 * ny); ctx.lineTo(A[0] - 30 * nx, A[1] - 30 * ny); ctx.stroke(); ctx.restore();
        hatch(ctx, A[0] - 30 * nx, A[1] - 30 * ny, A[0] + 14 * nx, A[1] + 14 * ny, 1, 6, 6);
        lab(ctx, 'A', A[0] + 14, A[1] - 34);
        arrow(ctx, E[0], E[1], E[0] + 40 * ux, E[1] + 40 * uy, COL.c1, 3); lab(ctx, 'F', E[0] + 40 * ux + 10, E[1] + 40 * uy + 8, { color: COL.c1, align: 'left' });
        dot(ctx, Gx, Gy); lab(ctx, 'G', Gx - 14, Gy - 12);
        const UF = V.F * 2 * sx, Ug = -Wt * sx * Math.sin(th), T = 0.5 * m * (1 + kG * kG / (r * r)) * v * v;
        const bx0 = n ? 60 : 480, by0 = n ? 400 : 70;
        ebarsB(ctx, bx0, by0, 210, n ? 150 : 200, [{ label: 'U_F', val: UF, color: COL.c1, num: fmt(UF, 3) }, { label: 'U_g', val: Ug, color: RED, num: fmt(Ug, 3) }, { label: 'T', val: T, color: COL.c2, num: fmt(T, 3) }], Math.max(V.F * 2 * smax, 5), 'Work and kinetic energy (ft·lb)');
        small(ctx, 'The band end moves twice as far as G.', bx0 + 105, by0 + (n ? 178 : 228));
        if (st.a <= 0) status(ctx, 'With this force the wheel does not move up the incline.', n ? 220 : 360, 20, RED);
        statsEvery(st, 'xw-10-stats', () => [['distance rolled up the incline', fmt(sx, 4) + ' ft'], ['v_G', fmt(v, 4) + ' ft/s'], ['v_G after 0.8 ft', isFinite(st.v2) ? fmt(st.v2, 4) + ' ft/s' : '—', true], ['speed of the band end', fmt(2 * v, 4) + ' ft/s']]);
      }
    });
  })();

  subLabels();
})();
