/* =========================================================
   Chapter 5 examples 5.A.9 – 5.A.17 (Newton–Euler)
   Uses the helpers defined in common.js, clip.js and ch5.js.
   ========================================================= */
(function(){
const DEG = Math.PI / 180;
const fmtN = (v, d = 3) => fmt(Math.abs(v) < 1e-9 ? 0 : v, d);
// a wall drawn as a hatched vertical line (side = which side the hatching is on)
function wallV(ctx, x, y1, y2, left = true){ line(ctx, x, y1, x, y2, COL.fg, 2); hatch(ctx, x, left ? y2 : y1, x, left ? y1 : y2, 1, 8, 6); }

/* ---------------------------------------------------------
   5.A.9  Bar on a vertical shaft driven by a moment (top view)
   --------------------------------------------------------- */
makeClip({
  id: 'xb-9', speed: 0.5,
  controls: [
    { key: 'M', label: 'Applied moment M', min: 10, max: 300, step: 5, value: 100, unit: 'lb·in', dec: 1 },
    { key: 'W', label: 'Weight of the bar W', min: 2, max: 60, step: 1, value: 20, unit: 'lb', dec: 1 }
  ],
  reset(st){
    const V = st.V, g = 386.4, L = 30, d = 3; st.m = V.W / g; st.IO = st.m * (L * L / 12 + d * d); st.al = V.M / st.IO; st.hold = undefined;
    st.R0 = V.M * d / (L * L / 12 + d * d);
  },
  step(st){ const th = 0.5 * st.al * st.t * st.t; if (th > Math.PI / 2){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('xb-9-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 360]);
    const V = st.V, S = 7, ox = 280, oy = 185, tt = Math.min(st.hold ?? st.t, Math.sqrt(Math.PI / st.al)), th = 0.5 * st.al * tt * tt, om = st.al * tt, d = 3;
    txt(ctx, 'Top view. The shaft is vertical and passes through O.', 280, 18, { font: '12px system-ui', color: COL.muted });
    // fixed bearing housing around the shaft
    ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.rect(ox - 16, oy - 16, 32, 32); ctx.fill(); ctx.stroke(); ctx.restore();
    // the bar: 18 in to one side of O, 12 in to the other (counterclockwise rotation as seen from above)
    const ux = Math.cos(th), uy = -Math.sin(th);
    line(ctx, ox - 18 * S * ux, oy - 18 * S * uy, ox + 12 * S * ux, oy + 12 * S * uy, COL.massEdge, 12);
    line(ctx, ox - 18 * S * ux, oy - 18 * S * uy, ox + 12 * S * ux, oy + 12 * S * uy, COL.mass, 8);
    const gx = ox - d * S * ux, gy = oy - d * S * uy;
    pinDot(ctx, ox, oy); txt(ctx, 'O', ox + 14, oy + 22, { font: 'italic 14px Georgia, serif' });
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 2 * Math.PI); ctx.fill();
    momentArrow(ctx, ox, oy, 44, true, COL.c2, ''); txt(ctx, 'M', ox - 54, oy - 40, { color: COL.c2 });
    // bearing force on the bar = m a_G (the moment M is a couple and the weight is vertical)
    // G is at r = -d u from O; a_G = alpha x r - omega^2 r (counterclockwise alpha in the plane)
    const rx = -d * Math.cos(th), ry = -d * Math.sin(th);      // G relative to O, math coordinates (y up), inches
    const ax = -st.al * ry - om * om * rx, ay = st.al * rx - om * om * ry;   // in/s^2
    const k = 150 / (st.R0 * Math.sqrt(1 + Math.PI * Math.PI)); // pixels per lb, so the largest force (after a quarter turn) fits
    const Rx = st.m * ax, Ry = st.m * ay;
    if (Math.hypot(Rx, Ry) > 0.05){ arrow(ctx, ox, oy, ox + k * Rx, oy - k * Ry, RED, 3); txt(ctx, 'R', ox + k * Rx + 10 * Math.sign(Rx || 1), oy - k * Ry - 10, { color: RED, font: 'italic 15px Georgia, serif' }); }
    statsEvery(st, 'xb-9-stats', () => [['I_O = (W/g)(L²/12 + d²)', fmt(st.IO, 4) + ' lb·in·s²'], ['α = M / I_O', fmt(st.al, 4) + ' rad/s²'], ['R at release = (W/g) α d', fmt(st.R0, 4) + ' lb', true], ['R now (grows as ω builds up)', fmt(Math.hypot(Rx, Ry), 4) + ' lb'], ['ω now', fmt(om, 3) + ' rad/s']]);
  }
});

/* ---------------------------------------------------------
   5.A.10  Bar OC with a disk on a smooth bearing at C
   --------------------------------------------------------- */
(function(){
  const MODES = [['Smooth bearing at C (the book)', 'free'], ['Disk welded to the bar', 'weld']];
  makeClip({
    id: 'xb-10', speed: 0.5,
    presets: (C, st, reset) => MODES.map(([label, v]) => ({ label, apply: () => { st.mode = v; reset(); } })),
    setup(st){ st.mode = 'free'; },
    reset(st){
      document.querySelectorAll('#xb-10-pre .chip').forEach((b, i) => b.classList.toggle('on', MODES[i][1] === st.mode));
      const m = 10, L = 2, kG = 0.4, M = 15, r = 0.6;
      st.I = m * (kG * kG + 0.36) + M * L * L + (st.mode === 'weld' ? 0.5 * M * r * r : 0);
      st.Q = m * G0 * 0.3 * L + M * G0 * L; st.s = [0, 0]; st.lastT = 0;
      setStats('xb-10-stats', [['moment of inertia about O', fmt(st.I, 4) + ' kg·m²'], ['moment of gravity about O at release', fmt(st.Q, 4) + ' N·m'], ['α at release (clockwise)', fmt(st.Q / st.I, 4) + ' rad/s²', true]]);
    },
    step(st){ const dt = st.t - st.lastT; st.lastT = st.t; st.s = stepN(s => [s[1], st.Q * Math.cos(s[0]) / st.I], st.s, dt); },
    draw(st){
      const cv = $('xb-10-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      fitView(ctx, w, h, [0, 0, 640, 400]);
      const S = 80, ox = 320, oy = 70, th = st.s[0], L = 2, r = 0.6;
      ceilingPin(ctx, ox, oy, 30);
      const ux = Math.cos(th), uy = Math.sin(th), cx = ox + L * S * ux, cy = oy + L * S * uy;
      // disk (drawn first, the bar lies on top of it)
      const spin = st.mode === 'weld' ? th : 0;
      ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#cfcab9'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.rotate(spin); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(r * S - 4, 0); ctx.stroke(); ctx.restore();
      // tapered bar from O to C
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(th); ctx.fillStyle = '#7d776b'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(L * S, -5); ctx.lineTo(L * S, 5); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      pinDot(ctx, ox, oy); pinDot(ctx, cx, cy);
      const gx = ox + 0.3 * L * S * ux, gy = oy + 0.3 * L * S * uy;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 2 * Math.PI); ctx.fill();
      txt(ctx, 'O', ox - 22, oy - 4, { font: 'italic 14px Georgia, serif' });
      txt(ctx, 'C', cx + 12 * uy, cy - 12 * ux - 4, { font: 'italic 14px Georgia, serif' });
      txt(ctx, st.mode === 'weld' ? 'The welded disk turns with the bar.' : 'The orange line keeps its direction. The disk translates without turning.', 320, 392, { font: '12px system-ui', color: COL.muted });
    }
  });
})();

/* ---------------------------------------------------------
   5.A.12  Spool pulled by a cord from its hub: alpha(theta)
   --------------------------------------------------------- */
makeClip({
  id: 'xb-12', speed: 0.5,
  controls: [
    { key: 'th', label: 'Cord angle θ', min: 0, max: 90, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'F', label: 'Force F', min: 0, max: 120, step: 1, value: 60, unit: 'N', dec: 1 }
  ],
  presets: C => [{ label: 'θ = 0°', apply: () => C.set({ th: 0 }) }, { label: 'θ = 70.5° (no rotation)', apply: () => C.set({ th: Math.acos(1 / 3) / DEG }) }, { label: 'θ = 90°', apply: () => C.set({ th: 90 }) }],
  reset(st){
    const V = st.V, m = 30, kG = 0.25, R = 0.3, r = 0.1, IC = m * (kG * kG + R * R), t = V.th * DEG;
    st.al = V.F * (R * Math.cos(t) - r) / IC; st.aG = R * st.al; st.f = m * st.aG - V.F * Math.cos(t); st.N = m * G0 - V.F * Math.sin(t); st.hold = undefined;
    setStats('xb-12-stats', [['α (clockwise +) = F(R cos θ − r)/I_C', fmt(st.al, 4) + ' rad/s²', true], ['a_G = Rα', fmt(st.aG, 4) + ' m/s²'], ['friction on the spool (positive to the right)', fmt(st.f, 4) + ' N'], ['normal force', fmt(st.N, 4) + ' N'], ['smallest μ_s for no slip', st.N > 0 ? fmt(Math.abs(st.f) / st.N, 3) : '—']]);
    showNotes('xb-12-notes', st.N < 0 ? [{ level: 'warn', html: 'The vertical part of the force exceeds the weight, so the spool would lift off the floor.' }] : []);
  },
  step(st){ const x = 0.5 * st.aG * st.t * st.t; if (x > 0.55 || x < -0.35 || st.t > 6){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('xb-12-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 480, 300]);
    const V = st.V, S = 300, R = 0.3 * S, r = 0.1 * S, fy = 250, t = V.th * DEG, tt = st.hold ?? st.t;
    const x = Math.max(-0.35, Math.min(0.55, 0.5 * st.aG * tt * tt)), gx = 200 + x * S, gy = fy - R;
    line(ctx, 10, fy, 470, fy, COL.fg, 2); hatch(ctx, 10, fy, 470, fy, 1);
    ctx.save(); ctx.translate(gx, gy); ctx.fillStyle = '#cfcab9'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(x / 0.3); ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r - 3); ctx.lineTo(0, -R + 4); ctx.stroke(); ctx.restore();
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 3, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx - 12, gy - 10, { font: 'italic 13px Georgia, serif' });
    // cord leaves the hub tangentially from its lower side
    const px = gx + r * Math.sin(t), py = gy + r * Math.cos(t), ux = Math.cos(t), uy = -Math.sin(t);
    line(ctx, px - 300 * ux, py - 300 * uy, px + 300 * ux, py + 300 * uy, COL.axis, 1, [5, 5]);
    cable(ctx, () => { ctx.moveTo(px, py); ctx.lineTo(px + 120 * ux, py + 120 * uy); });
    arrow(ctx, px + 120 * ux, py + 120 * uy, px + 170 * ux, py + 170 * uy, COL.c1, 3); txt(ctx, 'F', px + 184 * ux, py + 184 * uy, { color: COL.c1 });
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(gx, fy, 3.5, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'C', gx, fy + 16, { font: 'italic 13px Georgia, serif', color: RED });
    txt(ctx, Math.abs(st.al) < 1e-6 ? 'The line of action of F passes through C.' : st.al > 0 ? 'The line of action of F passes above C.' : 'The line of action of F passes below C.', 240, 20, { font: '600 13px system-ui' });
    const pts = []; for (let i = 0; i <= 180; i++){ const q = 90 * i / 180 * DEG; pts.push([90 * i / 180, V.F * (0.3 * Math.cos(q) - 0.1) / (30 * (0.0625 + 0.09))]); }
    plot($('xb-12-plot'), { xmin: 0, xmax: 90, ymin: -3, ymax: 5.5, xlabel: 'cord angle θ (°)', ylabel: 'α, clockwise (rad/s²)', series: [{ pts, color: COL.c1, width: 2.4 }], vlines: [{ x: Math.acos(1 / 3) / DEG, color: COL.c3, label: 'α = 0' }], points: [{ x: V.th, y: st.al, color: COL.c2, r: 6 }] });
  }
});

/* ---------------------------------------------------------
   5.A.13  Bar sliding on a smooth floor and a smooth wall
   --------------------------------------------------------- */
makeClip({
  id: 'xb-13', speed: 0.5,
  controls: [{ key: 'th0', label: 'Release angle θ_0', min: 10, max: 85, step: 0.01, value: 36.87, unit: '°', dec: 2 }],
  reset(st){ st.phase = 1; st.th = st.V.th0 * DEG; st.w = 0; st.xg = 0; st.vgx = 0; st.lastT = 0; st.hold = undefined; st.leave = null; },
  step(st){
    const m = 30, L = 4, g = G0; let dt = st.t - st.lastT; st.lastT = st.t;
    if (st.hold !== undefined){ if (st.t > st.hold + 1.2){ st.phase = 1; st.th = st.V.th0 * DEG; st.w = 0; st.t = 0; st.lastT = 0; st.hold = undefined; st.leave = null; } return; }
    const hs = 2e-4;
    while (dt > 1e-12){
      const hh = Math.min(hs, dt); dt -= hh;
      const c = Math.cos(st.th), s = Math.sin(st.th);
      if (st.phase === 1){
        const a = -1.5 * g / L * c, axg = L / 2 * (s * a + c * st.w * st.w), NB = -m * axg;
        if (NB < 0){ st.phase = 2; st.xg = -L / 2 * c; st.vgx = L / 2 * s * st.w; st.leave = st.th; continue; }
        st.w += a * hh; st.th += st.w * hh;
      } else {
        const J = m * L * L * (c * c / 4 + 1 / 12), a = (m * L * L / 4 * c * s * st.w * st.w - m * g * L / 2 * c) / J;
        st.w += a * hh; st.th += st.w * hh; st.xg += st.vgx * hh;
      }
      if (st.th <= 0){ st.th = 0; st.hold = st.t; break; }
    }
  },
  draw(st){
    const cv = $('xb-13-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 600, 360]);
    const m = 30, L = 4, g = G0, S = 75, wx = 470, fy = 320, th = st.th, c = Math.cos(th), s = Math.sin(th);
    let xg = st.phase === 1 ? -L / 2 * c : st.xg;
    const ax = wx + (xg - L / 2 * c) * S, ay = fy, bx = wx + (xg + L / 2 * c) * S, by = fy - L * s * S;
    line(ctx, 10, fy, wx, fy, COL.fg, 2); hatch(ctx, 10, fy, wx, fy, 1);
    line(ctx, wx, fy, wx, 20, COL.fg, 2); hatch(ctx, wx, fy, wx, 20, 1, 8, 6);
    // the bar is a 10 px thick strip whose lower edge runs from A (on the floor) to B (on the wall): it rests on both surfaces without entering them
    { const T = 10, nx = -s * T, ny = -c * T; ctx.save(); ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + nx, by + ny); ctx.lineTo(ax + nx, ay + ny); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    const gx = (ax + bx) / 2 - s * 5, gy = (ay + by) / 2 - c * 5; ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 2 * Math.PI); ctx.fill();
    txt(ctx, 'A', ax - 4, ay + 16, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', bx - 16, by - 6, { font: 'italic 14px Georgia, serif' });
    // reactions from the exact equations at this instant
    let a, NA, NB = 0;
    if (st.phase === 1){ a = -1.5 * g / L * c; NB = -m * L / 2 * (s * a + c * st.w * st.w); }
    else { const J = m * L * L * (c * c / 4 + 1 / 12); a = (m * L * L / 4 * c * s * st.w * st.w - m * g * L / 2 * c) / J; }
    NA = m * (g + L / 2 * (c * a - s * st.w * st.w));
    const k = 0.25; // pixels per newton
    arrow(ctx, gx, gy, gx, gy + k * m * g, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, gy + k * m * g - 6, { color: COL.c2, align: 'left' });
    if (NA > 1){ arrow(ctx, ax, ay + k * NA, ax, ay, COL.c3, 2.6); txt(ctx, 'N_A', ax + 8, ay + Math.min(k * NA, 30) - 4, { color: COL.c3, align: 'left' }); }
    if (st.phase === 1 && NB > 1){ arrow(ctx, bx + k * NB, by, bx, by, COL.c1, 2.6); txt(ctx, 'N_B', bx + 10, by - 12, { color: COL.c1, align: 'left' }); }
    const msg = st.phase === 1 ? 'Both ends touch. N_A and N_B act.' : `End B left the wall at θ = ${fmt(st.leave / DEG, 3)}°. Only the floor pushes now.`;
    txt(ctx, msg, 250, 18, { font: '600 13px system-ui', color: st.phase === 1 ? COL.fg : RED });
    statsEvery(st, 'xb-13-stats', () => [['θ', fmt(th / DEG, 3) + '°'], ['α = θ̈ (counterclockwise +)', fmt(a, 4) + ' rad/s²', true], ['N_A', fmt(NA, 4) + ' N'], ['N_B', st.phase === 1 ? fmt(NB, 4) + ' N' : '0 (no contact)'], ['α at release = −(3g/2L) cos θ_0', fmt(-1.5 * g / L * Math.cos(st.V.th0 * DEG), 4) + ' rad/s²', true]]);
  }
});

/* ---------------------------------------------------------
   5.A.14  Bar guided by a horizontal and a vertical slot, pushed at A
   --------------------------------------------------------- */
makeClip({
  id: 'xb-14', speed: 0.5,
  controls: [
    { key: 'P', label: 'Horizontal force P at A', min: 0, max: 80, step: 1, value: 30, unit: 'lb', dec: 1 },
    { key: 'th0', label: 'Release angle θ_0', min: 5, max: 85, step: 1, value: 30, unit: '°', dec: 1 }
  ],
  reset(st){
    const V = st.V, W = 60, L = 4, g = 32.2, m = W / g; st.J = m * L * L / 3; st.s = [V.th0 * DEG, 0]; st.lastT = 0; st.hold = undefined;
    const t = V.th0 * DEG, a0 = (V.P * L * Math.cos(t) - W * L / 2 * Math.sin(t)) / st.J;
    st.a0 = a0; st.NA0 = W + m * L / 2 * Math.sin(t) * a0; st.NB0 = m * L / 2 * Math.cos(t) * a0 - V.P;
  },
  step(st){
    if (st.hold !== undefined){ if (st.t > st.hold + 1.2){ st.t = 0; st.lastT = 0; st.hold = undefined; st.s = [st.V.th0 * DEG, 0]; } return; }
    const V = st.V, W = 60, L = 4, dt = st.t - st.lastT; st.lastT = st.t;
    st.s = stepN(s => [s[1], (V.P * L * Math.cos(s[0]) - W * L / 2 * Math.sin(s[0])) / st.J], st.s, dt);
    if (st.s[0] <= 0.5 * DEG || st.s[0] >= 89.5 * DEG){ st.s[0] = clamp(st.s[0], 0.5 * DEG, 89.5 * DEG); st.s[1] = 0; st.hold = st.t; }
    if (st.t > 12) st.hold = st.t;
  },
  draw(st){
    const cv = $('xb-14-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 520, 380]);
    const V = st.V, W = 60, L = 4, g = 32.2, m = W / g, S = 70, x0 = 110, y0 = 140, th = st.s[0], om = st.s[1], c = Math.cos(th), s = Math.sin(th);
    // support plate with the two slots cut into it
    ctx.save(); ctx.fillStyle = '#d6d1c4'; ctx.fillRect(x0 - 45, y0 - 40, 4 * S + 110, 4 * S + 60); ctx.fillStyle = COL.card;
    ctx.fillRect(x0 - 9, y0 - 9, 4 * S + 50, 18); ctx.fillRect(x0 - 9, y0 - 9, 18, 4 * S + 20); ctx.restore();
    const ax = x0 + L * s * S, ay = y0, bx = x0, by = y0 + L * c * S;
    line(ctx, ax, ay, bx, by, COL.massEdge, 12); line(ctx, ax, ay, bx, by, '#8a8476', 8);
    pinDot(ctx, ax, ay); pinDot(ctx, bx, by);
    txt(ctx, 'A', ax + 2, ay - 22, { font: 'italic 14px Georgia, serif' }); txt(ctx, 'B', bx + 18, by + 6, { font: 'italic 14px Georgia, serif' });
    const gx = (ax + bx) / 2, gy = (ay + by) / 2; ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 3.5, 0, 2 * Math.PI); ctx.fill();
    // forces at this instant (exact equations)
    const a = (V.P * L * c - W * L / 2 * s) / st.J;
    const NB = m * L / 2 * (c * a - s * om * om) - V.P, NA = W + m * L / 2 * (s * a + c * om * om), k = 1.6;
    arrow(ctx, gx, gy, gx, gy + k * W, COL.c2, 2.4); txt(ctx, 'W', gx + 8, gy + k * W - 6, { color: COL.c2, align: 'left' });
    if (V.P > 0.5){ arrow(ctx, ax, ay, ax + k * V.P, ay, COL.c1, 3); txt(ctx, 'P', ax + k * V.P + 8, ay - 10, { color: COL.c1, align: 'left' }); }
    if (Math.abs(NA) > 0.5){ arrow(ctx, ax, ay, ax, ay - k * NA, COL.c3, 2.6); txt(ctx, 'N_A', ax - 8, ay - k * NA * 0.6, { color: COL.c3, align: 'right' }); }
    if (Math.abs(NB) > 0.5){ arrow(ctx, bx, by, bx + k * NB, by, COL.c4, 2.6); txt(ctx, 'N_B', bx + k * NB / 2, by + 18, { color: COL.c4 }); }
    statsEvery(st, 'xb-14-stats', () => [['θ', fmt(th / DEG, 3) + '°'], ['α at release (clockwise +)', fmt(st.a0, 4) + ' rad/s²', true], ['N_A at release (upward)', fmt(st.NA0, 4) + ' lb', true], ['N_B at release (positive to the right)', fmt(st.NB0, 4) + ' lb', true], ['equilibrium angle tan θ = 2P/W', fmt(Math.atan(2 * V.P / W) / DEG, 3) + '°']]);
  }
});

/* ---------------------------------------------------------
   5.A.16  Cart pushed by F with a disk rolling on top
   --------------------------------------------------------- */
makeClip({
  id: 'xb-16', speed: 0.5,
  controls: [
    { key: 'F', label: 'Force F', min: 1, max: 100, step: 1, value: 30, unit: 'N', dec: 1 },
    { key: 'M', label: 'Cart mass M', min: 1, max: 40, step: 0.5, value: 10, unit: 'kg', dec: 2 },
    { key: 'm', label: 'Disk mass m', min: 0.5, max: 40, step: 0.5, value: 5, unit: 'kg', dec: 2 }
  ],
  reset(st){
    const V = st.V, R = 0.2; st.A = 3 * V.F / (3 * V.M + V.m); st.aG = V.F / (3 * V.M + V.m); st.al = 2 * st.aG / R; st.f = V.m * st.aG; st.hold = undefined;
    st.tEnd = Math.sqrt(2 * 0.96 / (st.A - st.aG));
    setStats('xb-16-stats', [['a_G = F/(3M + m)', fmt(st.aG, 4) + ' m/s²', true], ['cart acceleration A = 3F/(3M + m)', fmt(st.A, 4) + ' m/s²'], ['α of the disk (counterclockwise) = 2a_G/R', fmt(st.al, 4) + ' rad/s²'], ['friction on the disk = m a_G', fmt(st.f, 4) + ' N']]);
  },
  step(st){ if (st.t > st.tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('xb-16-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const S = 140, R = 0.2 * S, tt = Math.min(st.hold ?? st.t, st.tEnd), xc = 0.5 * st.A * tt * tt, xg = 0.5 * st.aG * tt * tt;
    const n = nar(cv, w, 260, 300), span = 0.5 * st.A * st.tEnd * st.tEnd * S + 1.6 * S + 120;
    fitView(ctx, w, h, [0, 0, Math.max(span + 40, 560), 260]);
    const fy = 215, wr = 9, ch = 0.25 * S, cl = 1.6 * S, x0 = 40 + xc * S, top = fy - 2 * wr - ch;
    line(ctx, 0, fy, Math.max(span + 40, 560), fy, COL.fg, 2); hatch(ctx, 0, fy, Math.max(span + 40, 560), fy, 1);
    for (let k = 0; k < 20; k++){ const mx = 40 + k * 0.5 * S; line(ctx, mx, fy, mx, fy - 6, COL.muted, 1); }
    // cart on wheels (smooth floor; the wheels are light)
    ctx.save(); ctx.fillStyle = '#8a8476'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.fillRect(x0, top, cl, ch); ctx.strokeRect(x0, top, cl, ch); ctx.restore();
    [x0 + 0.15 * cl, x0 + 0.85 * cl].forEach(x => wheel(ctx, x, fy - wr, wr, xc * S / wr, 'disk', '#5f5a50'));
    txt(ctx, 'M', x0 + cl - 14, top + ch / 2, { color: '#fff' });
    // disk rolls on the cart; it rolls backward relative to the cart (counterclockwise)
    const dx = 40 + 0.75 * cl + xg * S, dy = top - R;
    wheel(ctx, dx, dy, R, -0.5 * st.al * tt * tt, 'disk');
    txt(ctx, 'G', dx + 10, dy - 10, { font: 'italic 13px Georgia, serif' });
    arrow(ctx, x0 + cl, top + ch / 2, x0 + cl + 20 + st.V.F * 0.9, top + ch / 2, COL.c1, 3); txt(ctx, 'F', x0 + cl + 30 + st.V.F * 0.9, top + ch / 2 - 10, { color: COL.c1 });
    const ka = 22; // pixels per m/s^2
    arrow(ctx, dx, dy - R - 12, dx + ka * st.aG, dy - R - 12, COL.c3, 2.4); txt(ctx, 'a_G', dx + ka * st.aG + 6, dy - R - 22, { color: COL.c3, align: 'left' });
    arrow(ctx, x0 + cl / 2, top + ch + 2 + 0, x0 + cl / 2 + ka * st.A, top + ch + 2, '#fff', 2.4);
    txt(ctx, 'The disk moves forward, but more slowly than the cart, so it rolls toward the back.', Math.max(span + 40, 560) / 2, 18, { font: '600 12px system-ui' });
  }
});

/* ---------------------------------------------------------
   5.A.17  Ball striking a pinned bar: forces during the impact
   The contact is a stiff spring, so the force history is computed, not assumed.
   --------------------------------------------------------- */
makeClip({
  id: 'xb-17', speed: 0.25,
  controls: [{ key: 'h', label: 'Impact point h / L', min: 0.1, max: 1, step: 0.01, value: 0.4, unit: '', dec: 3 }],
  presets: C => [{ label: 'h = 0.4L', apply: () => C.set({ h: 0.4 }) }, { label: 'h = 2L/3', apply: () => C.set({ h: 2 / 3 }) }, { label: 'h = L', apply: () => C.set({ h: 1 }) }],
  reset(st){
    // M = 2 kg, L = 1 m bar pinned at its top; ball m = 0.5 kg at 3 m/s; contact stiffness 2e5 N/m
    st.sw = null; st.lastT = 0; st.d0 = 0.5; st.vb1 = 3; // the ball starts 0.5 m from the bar at 3 m/s
    const M = 2, L = 1, m = 0.5, k = 2e5, h = st.V.h * L, IO = M * L * L / 3;
    let th = 0, w = 0, xb = -0.02, vb = 3, t = 0; const dt = 2e-6, hist = [];
    while (t < 0.05){
      const pen = xb - h * Math.sin(th) + 0; // ball centre ahead of the contact line on the bar (small angles during contact)
      const F = pen > 0 ? k * pen : 0;
      const al = (F * h * Math.cos(th) - M * G0 * L / 2 * Math.sin(th)) / IO;
      const Ox = M * L / 2 * (Math.cos(th) * al - Math.sin(th) * w * w) - F;
      if (F > 0 || hist.length) hist.push([t, F, Ox]);
      vb += -F / m * dt; xb += vb * dt; w += al * dt; th += w * dt; t += dt;
      if (hist.length && F === 0 && pen < -1e-4) break;
    }
    const t0 = hist.length ? hist[0][0] : 0; st.hist = hist.map(([t, F, Ox]) => [(t - t0) * 1000, F, Ox]);
    st.Tc = st.hist.length ? st.hist[st.hist.length - 1][0] : 1; st.w2 = w; st.vb2 = vb; st.th2 = th;
    st.J = st.hist.reduce((s, p, i) => s + (i ? (p[0] - st.hist[i - 1][0]) / 1000 * p[1] : 0), 0);
    st.Ix = st.hist.reduce((s, p, i) => s + (i ? (p[0] - st.hist[i - 1][0]) / 1000 * p[2] : 0), 0);
    st.Fmax = Math.max(...st.hist.map(p => p[1]));
    setStats('xb-17-stats', [['peak contact force F', fmt(st.Fmax, 4) + ' N'], ['peak pin force O_x', fmt(Math.max(...st.hist.map(p => Math.abs(p[2]))), 4) + ' N'], ['O_x / F = 3h/(2L) − 1', fmt(1.5 * st.V.h - 1, 3), true], ['contact time', fmt(st.Tc, 3) + ' ms']]);
  },
  step(st){
    // one clock for everything (slow motion via the speed menu). The contact lasts well under a millisecond,
    // so at this time scale the bar starts to turn at the very instant the ball reaches it.
    const tc = st.d0 / st.vb1;                                   // time at which the ball reaches the bar
    if (st.t > tc + 2.4){ st.t = 0; st.sw = null; st.lastT = 0; return; }
    if (st.t >= tc){
      if (!st.sw){ st.sw = [st.th2, st.w2]; st.lastT = tc; }
      const dt = st.t - st.lastT; st.lastT = st.t; st.sw = stepN(s => [s[1], -1.5 * G0 * Math.sin(s[0])], st.sw, dt);
    }
  },
  draw(st){
    const cv = $('xb-17-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 400, 330]);
    const V = st.V, S = 250, ox = 220, oy = 50, t = st.t, tc = st.d0 / st.vb1, R = 0.05;   // ball radius 0.05 m
    const hit = t >= tc, ts = t - tc, th = hit && st.sw ? st.sw[0] : 0;
    // ball: approaches at its true speed, then leaves with its speed after the impact
    const bxm = hit ? -R + st.vb2 * ts : -R - st.vb1 * (tc - t);                       // centre, metres from the bar
    ceilingPin(ctx, ox, oy, 30);
    const tx = ox + S * Math.sin(th), ty = oy + S * Math.cos(th);
    line(ctx, ox, oy, tx, ty, COL.massEdge, 12); line(ctx, ox, oy, tx, ty, COL.mass, 8); pinDot(ctx, ox, oy);
    txt(ctx, 'O', ox - 22, oy - 4, { font: 'italic 14px Georgia, serif' });
    const hy = oy + S * V.h;
    ctx.fillStyle = COL.c2; ctx.globalAlpha = hit ? Math.max(0, 1 - ts / 1.2) : 1; ctx.beginPath(); ctx.arc(ox + bxm * S - 6, hy, R * S, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    const cpy = oy + S * 2 / 3 * Math.cos(th), cpx = ox + S * 2 / 3 * Math.sin(th);
    ctx.save(); ctx.strokeStyle = COL.c3; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cpx, cpy, 6, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    txt(ctx, 'h = 2L/3', cpx + 12, cpy, { font: '11px system-ui', color: COL.c3, align: 'left' });
    // for a short while after the hit, show the impulses that acted during the (very short) contact
    const flash = hit && ts < 0.35;
    if (flash){ const k = 70 / Math.max(Math.abs(st.J), Math.abs(st.Ix), 1e-9);
      arrow(ctx, ox - 6 - k * st.J, hy, ox - 6, hy, COL.c2, 3); txt(ctx, 'impulse J', ox - 10 - k * st.J, hy - 14, { font: '600 12px system-ui', color: COL.c2, align: 'right' });
      if (Math.abs(st.Ix) * k > 3) arrow(ctx, ox, oy + 2, ox + k * st.Ix, oy + 2, RED, 3);
      txt(ctx, Math.abs(st.Ix) * k > 3 ? `pin impulse = ${fmt(st.Ix, 3)} N·s` : 'pin impulse ≈ 0', ox + 16, oy + 26, { font: '600 12px system-ui', color: RED, align: 'left' }); }
    txt(ctx, !hit ? 'The ball approaches the hanging bar.' : flash ? `Impact. The contact lasted only ${fmt(st.Tc, 2)} ms.` : 'The bar swings away from the moment of impact.', 200, 312, { font: '600 13px system-ui' });
    // the force histories inside the contact: the marker sweeps through them while the impulse arrows are shown
    const ix = !hit ? 0 : flash ? st.Tc * ts / 0.35 : st.Tc;
    plot($('xb-17-plot'), { xmin: 0, xmax: st.Tc, ymin: -st.Fmax * 1.1, ymax: st.Fmax * 1.1, xlabel: 'time during the contact (ms)', ylabel: 'force (N)',
      series: [{ pts: st.hist.map(p => [p[0], p[1]]), color: COL.c2, width: 2.4 }, { pts: st.hist.map(p => [p[0], p[2]]), color: RED, width: 2.4 }], vlines: [{ x: ix, color: COL.axis }] });
  }
});

subLabels();
})();
