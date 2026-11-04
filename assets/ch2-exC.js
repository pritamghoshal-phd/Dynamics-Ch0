/* =========================================================
   Chapter 2, mechanism examples 2.C.1 and 2.C.2
   Each clip stores its geometry (world units) in st.g, which the 3D views read.
   ========================================================= */
(function(){
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const kx = (w, r) => [-w * r[1], w * r[0]], len = a => Math.hypot(a[0], a[1]);
const solve2 = (a, b, c, d, e, f) => { const D = a * d - b * c; return [(e * d - b * f) / D, (a * f - e * c) / D]; };
const sense = w => Math.abs(w) < 1e-6 ? '' : w > 0 ? ' (counterclockwise)' : ' (clockwise)';
function view(w, h, b, pad = 18){
  const s = Math.min((w - 2 * pad) / (b[1] - b[0]), (h - 2 * pad) / (b[3] - b[2]));
  const ox = (w - s * (b[1] - b[0])) / 2, oy = (h - s * (b[3] - b[2])) / 2;
  return { s, P: (x, y) => [ox + (x - b[0]) * s, oy + (b[3] - y) * s] };
}
function autoH(cv, w, h, b, pad = 18){
  if (!cv.dataset.h0) cv.dataset.h0 = String(h);
  const want = Math.round(Math.min(+cv.dataset.h0, (b[3] - b[2]) / (b[1] - b[0]) * (w - 2 * pad) + 2 * pad));
  if (Math.abs(want - h) > 3) cv.style.height = want + 'px';
}
function warr(ctx, P, p, v, k, col, label, dash){
  const [x1, y1] = P(...p), [x2, y2] = P(p[0] + v[0] * k, p[1] + v[1] * k), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 4) return;
  if (dash){ ctx.save(); ctx.setLineDash([6, 4]); }
  arrow(ctx, x1, y1, x2, y2, col, 2.6);
  if (dash) ctx.restore();
  if (label && L >= 26){ // beyond the tip (a very short arrow gets no label), nudged sideways toward the upper side so it clears a link along the arrow
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L; let nx = uy, ny = -ux; if (ny > 0 || (ny === 0 && nx < 0)){ nx = -nx; ny = -ny; }
    const a = uy > 0.6 ? -8 : 12, n = uy > 0.6 ? 16 : 12;   // a downward arrow gets its label beside the tip, not below it
    txt(ctx, label, x2 + ux * a + nx * n, y2 + uy * a + ny * n, { color: col, font: 'italic 14px Georgia, serif' });
  }
}
function link(ctx, P, a, b, wpx = 12){
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = COL.massEdge; ctx.lineWidth = wpx + 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = COL.mass; ctx.lineWidth = wpx; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
function hole(ctx, P, p, label, dx = 12, dy = -12){ const [x, y] = P(...p); pinDot(ctx, x, y); if (label) txt(ctx, label, x + dx, y + dy, { font: 'italic 15px Georgia, serif' }); }
function cc(A, b, D, c, near){
  const d = len(sub(D, A)); if (d > b + c || d < Math.abs(b - c) || d < 1e-12) return null;
  const a = (b * b - c * c + d * d) / (2 * d), hh = Math.sqrt(Math.max(b * b - a * a, 0)), u = mul(sub(D, A), 1 / d), m = add(A, mul(u, a));
  const p1 = add(m, mul([-u[1], u[0]], hh)), p2 = add(m, mul([u[1], -u[0]], hh));
  return len(sub(p1, near)) <= len(sub(p2, near)) ? p1 : p2;
}
const INSTANT = 'the instant in the problem';

/* ---------- 2.C.1: wheel rolling without slipping, rod AB and slider B ---------- */
(function(){
  const r = 0.5, L = 2;
  // xO is the position of the wheel center. Rolling without slipping: the wheel's counterclockwise angle is −xO / r,
  // and A starts level with O on the slider side, so A = O + r(cos φ, sin φ) with φ = −xO / r.
  const Apos = x => [x + r * Math.cos(-x / r), r + r * Math.sin(-x / r)];
  const xBof = x => { const A = Apos(x); return A[0] + Math.sqrt(L * L - A[1] * A[1]); };
  const xB0 = xBof(0);
  // the motion shown runs from xB = 2.62 ft to xB = 0.5 ft. To the right of this range the mechanism has a dead point
  // (xB = 2.785 ft) where the wheel would need an unbounded angular velocity. T0 and T1 are the times for v_B = 5 ft/s.
  const T0 = -(2.62 - xB0) / 5, T1 = (xB0 - 0.5) / 5;
  function solveX(xB, x){ for (let i = 0; i < 40; i++){ const f0 = xBof(x) - xB, d = (xBof(x + 1e-7) - xBof(x - 1e-7)) / 2e-7; if (Math.abs(d) < 1e-12) break; x -= f0 / d; if (Math.abs(f0) < 1e-13) break; } return x; }
  function rates(vB, tau, x){
    const hh = 2e-4, xB = xB0 - vB * tau, xp = solveX(xB - vB * hh, x), xm = solveX(xB + vB * hh, x), x0 = solveX(xB, x);
    const vO = (xp - xm) / (2 * hh), aO = (xp - 2 * x0 + xm) / (hh * hh);
    const g = q => { const A = Apos(q); return Math.atan2(-A[1], xBof(q) - A[0]); };
    const wAB = (g(xp) - g(xm)) / (2 * hh), aAB = (g(xp) - 2 * g(x0) + g(xm)) / (hh * hh);
    return { x: x0, om: -vO / r, al: -aO / r, wAB, aAB, vO };
  }
  makeClip({
    id: 'x2c-1', speed: 0.12,
    controls: [{ key: 'vB', label: 'Speed of slider B, v_B (to the left)', min: 1, max: 10, step: 0.5, value: 5, unit: 'ft/s', dec: 2 }],
    presets: (C, st) => [{ label: 'Freeze at the instant in the problem', apply: () => { st.freeze = true; } }, { label: 'Play the motion', apply: () => { st.freeze = false; } }],
    reset(st){ st.freeze = false; st.x = 0; st.t = 0; },
    step(st){
      const V = st.V, T = (T1 - T0) * 5 / V.vB;
      st.tau = st.freeze ? 0 : T0 * 5 / V.vB + st.t; if (st.t > T){ st.t = 0; st.tau = T0 * 5 / V.vB; }
      st.x = solveX(xB0 - V.vB * st.tau, st.x);
    },
    draw(st){
      const V = st.V, cv = $('x2c-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const tau = st.tau ?? 0, R = rates(V.vB, tau, st.x), x = R.x, phi = -x / r, O = [x, r], A = Apos(x), xB = xBof(x), B = [xB, 0];
      st.g = { xO: x, phi, A, xB, r, L };
      const b = [-2.1, 3.9, -0.42, 1.25]; autoH(cv, w, h, b); const { P, s } = view(w, h, b);
      // ground, with a shallow channel in which the slider runs so that pin B is level with the contact point
      const [g0x, gy] = P(b[0], 0), [cx0] = P(0.3, 0),  /* the step sits between the wheel's farthest contact point (x_O ≤ 0.18 ft) and the slider's nearest edge (x_B − 0.2 ≥ 0.42 ft) */ [g1x] = P(b[1], 0), [, chy] = P(0, -0.2);
      line(ctx, g0x, gy, cx0, gy, COL.fg, 2); hatch(ctx, g0x, gy, cx0, gy, 1);
      line(ctx, cx0, gy, cx0, chy, COL.fg, 2); line(ctx, cx0, chy, g1x, chy, COL.fg, 2); hatch(ctx, cx0, chy, g1x, chy, 1);
      // wheel with spokes that show its rotation
      const [ox, oy] = P(...O);
      ctx.save(); ctx.fillStyle = '#cfc8b5'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, r * s, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++){ const a = phi + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 0.9 * r * s * Math.cos(a), oy - 0.9 * r * s * Math.sin(a)); ctx.stroke(); }
      ctx.restore();
      // slider block in the channel, pin B at its center
      const [bx, by] = P(...B); ctx.save(); ctx.fillStyle = '#d5dbe8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.fillRect(bx - 0.2 * s, by - 0.2 * s, 0.4 * s, 0.4 * s); ctx.strokeRect(bx - 0.2 * s, by - 0.2 * s, 0.4 * s, 0.4 * s); ctx.restore();
      link(ctx, P, O, A, 4); link(ctx, P, A, B, 9);
      hole(ctx, P, O, 'O', -14, 14); hole(ctx, P, A, 'A', -4, -18); hole(ctx, P, B, 'B', 4, -30);
      // θ, measured from the horizontal through O to the radius OA
      const th = Math.atan2(A[1] - r, A[0] - x);
      ctx.save(); ctx.setLineDash([3, 4]); line(ctx, ox, oy, ox + 0.75 * r * s, oy, COL.muted, 1); ctx.restore();
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(ox, oy, 0.3 * r * s, 0, -th, th > 0); ctx.stroke(); ctx.restore();
      if (Math.abs(th) > 0.12) txt(ctx, 'θ', ox + 0.42 * r * s * Math.cos(th / 2), oy - 0.42 * r * s * Math.sin(th / 2), { color: COL.muted, font: 'italic 13px Georgia, serif' });
      const k = 0.11;
      warr(ctx, P, B, [-V.vB, 0], k, COL.c2, 'v_B'); warr(ctx, P, O, [R.vO, 0], k, COL.c1, 'v_O');
      txt(ctx, 'no slip', P(x, 0)[0] - 40, gy + 14, { font: '12px system-ui', color: COL.muted });
      if (st.freeze) txt(ctx, INSTANT + ': θ = 0 (A level with O)', w / 2, 14, { font: '12px system-ui', color: HEAT });
      const pw = [], pa = []; let xn = solveX(xB0 - 5 * T0, 0);
      for (let i = 0; i <= 60; i++){ const q = (T0 + (T1 - T0) * i / 60) * 5 / V.vB, z = rates(V.vB, q, xn); xn = z.x; pw.push([q, z.om]); pa.push([q, z.al]); }
      const span = (a, pad) => [Math.min(0, ...a.map(p => p[1])) * 1.1 - pad, Math.max(0, ...a.map(p => p[1])) * 1.1 + pad];
      const [w0, w1] = span(pw, 1), [a0, a1] = span(pa, 5);
      plot($('x2c-1-plot'), { xmin: T0 * 5 / V.vB, xmax: T1 * 5 / V.vB, ymin: w0, ymax: w1, xlabel: 'time from the instant (s)', ylabel: 'ω of the wheel (rad/s)', series: [{ pts: pw, color: COL.c3, width: 2.4 }], vlines: [{ x: 0, color: HEAT, label: 'instant' }], points: [{ x: tau, y: R.om, color: COL.c3, r: 5 }] });
      plot($('x2c-1-plot2'), { xmin: T0 * 5 / V.vB, xmax: T1 * 5 / V.vB, ymin: a0, ymax: a1, xlabel: 'time from the instant (s)', ylabel: 'α of the wheel (rad/s²)', series: [{ pts: pa, color: COL.c2, width: 2.4 }], vlines: [{ x: 0, color: HEAT, label: 'instant' }], points: [{ x: tau, y: R.al, color: COL.c2, r: 5 }] });
      statsEvery(st, 'x2c-1-stats', () => [['θ', fmt(th / RAD, 4) + '°'], ['ω of the wheel', fmt(R.om, 4) + ' rad/s' + sense(R.om), true], ['α of the wheel', fmt(R.al, 4) + ' rad/s²' + sense(R.al), true], ['ω_AB', fmt(R.wAB, 4) + ' rad/s' + sense(R.wAB)], ['α_AB', fmt(R.aAB, 4) + ' rad/s²' + sense(R.aAB)]], 0.005);
    }
  });
})();

/* ---------- 2.C.2: four-bar with OA and BD vertical at the instant ---------- */
(function(){
  const L = 1, O = [0, 0], D = [2 * L, 0], LAB = Math.sqrt(5) * L, LBD = 2 * L;
  function state(phi, w1, near){
    const A = [L * Math.cos(phi), L * Math.sin(phi)], B = cc(A, LAB, D, LBD, near); if (!B) return null;
    const rBA = sub(B, A), rBD = sub(B, D), vA = kx(w1, A);
    const [w2, w3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], -vA[0], -vA[1]);
    const aA = mul(A, -w1 * w1), rhs = sub(add(mul(rBA, w2 * w2), mul(rBD, -w3 * w3)), aA);
    const [a2, a3] = solve2(-rBA[1], rBD[1], rBA[0], -rBD[0], rhs[0], rhs[1]);
    return { A, B, vA, vB: kx(w3, rBD), w2, w3, a2, a3 };
  }
  makeClip({
    id: 'x2c-2', speed: 1.5,
    controls: [{ key: 'w', label: 'ω_OA (counterclockwise)', min: 0.1, max: 2, step: 0.05, value: 0.5, unit: 'rad/s', dec: 2 }],
    presets: (C, st) => [{ label: 'Freeze at the instant in the problem', apply: () => { st.freeze = true; } }, { label: 'Play the motion', apply: () => { st.freeze = false; } }],
    reset(st){ st.freeze = false; st.phi = Math.PI / 2 - 0.6; st.Bp = [2, 2]; st.last = 0; },
    step(st){
      if (st.freeze){ st.phi = Math.PI / 2; st.Bp = [2, 2]; return; }
      st.phi += st.V.w * (st.t - st.last); st.last = st.t;
    },
    draw(st){
      const V = st.V, cv = $('x2c-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      if (st.freeze){ st.last = st.t; }
      const S = state(st.phi, V.w, st.Bp); if (!S) return; st.Bp = S.B;
      st.g = { O, A: S.A, B: S.B, D };
      const b = [-1.45, 3.45, -1.35, 2.95]; autoH(cv, w, h, b); const { P } = view(w, h, b);
      const [ox, oy] = P(...O), [dx, dy] = P(...D), hg = P(0, -1.2)[1] - oy; pin(ctx, ox, oy, hg); pin(ctx, dx, dy, hg);   // tall pedestals: the crank OA sweeps below O
      ctx.save(); ctx.setLineDash([3, 4]); line(ctx, ox, oy, dx, dy, COL.muted, 1); ctx.restore();
      // perpendiculars to v_A and v_B (lines OA and DB): their crossing is the instant center of AB
      const IC = (() => { const u = S.A, v = sub(S.B, D), Dt = u[0] * (-v[1]) + v[0] * u[1]; if (Math.abs(Dt) < 1e-6) return null; const rr = D, s1 = (rr[0] * (-v[1]) + v[0] * rr[1]) / Dt; return mul(u, s1); })();
      link(ctx, P, O, S.A, 10); link(ctx, P, S.A, S.B, 10); link(ctx, P, D, S.B, 10);
      pinDot(ctx, ox, oy); pinDot(ctx, dx, dy); txt(ctx, 'O', ox - 18, oy - 4, { font: 'italic 15px Georgia, serif' }); txt(ctx, 'D', dx + 18, dy - 4, { font: 'italic 15px Georgia, serif' });
      { const u = mul(S.A, 1 / len(S.A)); hole(ctx, P, S.A, 'A', 20 * u[0] - 8, -20 * u[1]); }   // label beyond A, along OA { const u = mul(sub(S.B, D), 1 / len(sub(S.B, D))); hole(ctx, P, S.B, 'B', 22 * u[0] + 10, -22 * u[1]); }   // label beyond B, along DB
      const k = 1.1;
      warr(ctx, P, S.A, S.vA, k, COL.c1, 'v_A'); warr(ctx, P, S.B, S.vB, k, COL.c2, 'v_B');
      if (IC && len(IC) < 6){ const [ix, iy] = P(...IC); if (ix > 0 && ix < w && iy > 0 && iy < h){ ctx.save(); ctx.strokeStyle = HEAT; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, 6, 0, 2 * Math.PI); ctx.stroke(); ctx.restore(); txt(ctx, 'IC of AB', ix + 30, iy - 12, { color: HEAT, font: '600 12px system-ui' }); } }
      const phd = (((st.phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / RAD;
      if (Math.abs(phd - 90) < 0.05) txt(ctx, INSTANT + ': OA and BD vertical, the IC of AB is at infinity', w / 2, 14, { font: '12px system-ui', color: HEAT });
      // follow the same assembly branch as the drawing: start from the instant (B at (2L, 2L)) and step back to OA horizontal
      let Bn = [2, 2]; for (let f = Math.PI / 2; f >= 0; f -= 0.02){ const z = state(f, V.w, Bn); if (z) Bn = z.B; }
      const p2 = [], p3 = [];
      for (let i = 0; i <= 180; i++){ const f = 2 * Math.PI * i / 180, z = state(f, V.w, Bn); if (z){ Bn = z.B; p2.push([f / RAD, z.w2]); p3.push([f / RAD, z.w3]); } }
      const m = Math.max(...p2.concat(p3).map(p => Math.abs(p[1]))) * 1.12;
      plot($('x2c-2-plot'), { xmin: 0, xmax: 360, xstep: 90, ymin: -m, ymax: m, xlabel: 'angle of OA from the horizontal (deg)', ylabel: 'angular velocity (rad/s)', series: [{ pts: p2, color: COL.c3, width: 2.2 }, { pts: p3, color: COL.c2, width: 2.2 }],
        vlines: [{ x: 90, color: HEAT, label: 'instant' }], points: [{ x: phd, y: S.w2, color: COL.c3, r: 5 }, { x: phd, y: S.w3, color: COL.c2, r: 5 }] });
      statsEvery(st, 'x2c-2-stats', () => [['angle of OA', fmt(phd, 4) + '°'], ['ω_AB', fmt(S.w2, 4) + ' rad/s' + sense(S.w2), true], ['ω_BD', fmt(S.w3, 4) + ' rad/s' + sense(S.w3), true], ['α_AB', fmt(S.a2, 4) + ' rad/s²' + sense(S.a2)], ['α_BD', fmt(S.a3, 4) + ' rad/s²' + sense(S.a3)]], 0.1);
    }
  });
})();

subLabels();
})();
