/* =========================================================
   Chapter 0, Section C examples (scalar kinematics): 0.C.1 to 0.C.4
   Every clip exposes the state read by the 3D views:
     st.s (position), st.v (speed), st.a (acceleration), st.trk = { s0, s1, unit } (track range and unit)
   ========================================================= */
(function(){
const LB = 'italic 14px Georgia, serif';

// the straight path with point P, its velocity (green) and acceleration (red) arrows, and position ticks
function track(ctx, w, y, st, k){
  const { s0, s1 } = st.trk, X = q => 40 + (q - s0) / (s1 - s0) * (w - 80);
  line(ctx, 24, y, w - 24, y, COL.axis, 2);
  const step = st.trk.tick || 1;
  for (let q = Math.ceil(s0 / step) * step; q <= s1 + 1e-9; q += step){ line(ctx, X(q), y - 5, X(q), y + 5, COL.muted, 1.2); txt(ctx, fmt(q, 3), X(q), y + 17, { font: '11px system-ui', color: COL.muted }); }
  txt(ctx, `s (${st.trk.unit})`, w - 26, y - 14, { font: 'italic 12px Georgia, serif', color: COL.muted, align: 'right' });
  const x = X(st.s); ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.fill();
  txt(ctx, 'P', x, y - 18, { font: LB });
  const vl = clamp(Math.abs(st.v) * k.v, 0, 90), al = clamp(Math.abs(st.a) * k.a, 0, 90);
  if (vl > 3){ arrow(ctx, x, y - 34, x + Math.sign(st.v) * vl, y - 34, COL.c3, 2.6); txt(ctx, 'v', x + Math.sign(st.v) * (vl + 10), y - 34, { color: COL.c3, font: LB }); }
  if (al > 3){ arrow(ctx, x, y - 52, x + Math.sign(st.a) * al, y - 52, RED, 2.6); txt(ctx, 'a', x + Math.sign(st.a) * (al + 10), y - 52, { color: RED, font: LB }); }
}
const curve = (f, a, b, n = 300) => { const p = []; for (let i = 0; i <= n; i++){ const x = a + (b - a) * i / n; p.push([x, f(x)]); } return p; };
const range = (pts, pad = 0.12) => { const ys = pts.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), d = (hi - lo) || 1; return [lo - pad * d, hi + pad * d]; };
const loop = (st, Tend, hold, restart) => { if (st.tt >= Tend){ st.hold = st.hold ?? st.t; if (st.t > st.hold + hold){ st.t = 0; st.hold = undefined; restart(); } return true; } return false; };

/* ---------- 0.C.1: v(t) = 3t², so a = 6t (and s = t³ when s(0) = 0) ---------- */
makeClip({
  id: 'x0c-1', speed: 0.5,
  reset(st){ st.tt = 0; st.trk = { s0: 0, s1: 8, unit: 'm', tick: 1 }; st.s = 0; st.v = 0; st.a = 0; st.hold = undefined; },
  step(st, dt){ if (loop(st, 2, 1.2, () => { st.tt = 0; })) return; st.tt = Math.min(2, st.tt + dt); const t = st.tt; st.s = t ** 3; st.v = 3 * t * t; st.a = 6 * t; },
  draw(st){
    const cv = $('x0c-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    track(ctx, w, h - 30, st, { v: 6, a: 6 });
    txt(ctx, `t = ${fmt(st.tt, 3)} s`, 30, 18, { font: '12px system-ui', color: COL.muted, align: 'left' });
    const t = st.tt, vp = curve(q => 3 * q * q, 0, 2), ap = curve(q => 6 * q, 0, 2), dt = 0.35;
    plot($('x0c-1-plot'), { xmin: 0, xmax: 2, ymin: -1, ymax: 13, xlabel: 'time t (s)', ylabel: 'speed v (m/s)',
      series: [{ pts: vp, color: COL.c3, width: 2.4 }, { pts: [[t - dt, st.v - st.a * dt], [t + dt, st.v + st.a * dt]], color: RED, width: 2, dash: [5, 3], guide: true }], points: [{ x: t, y: st.v, color: COL.c3, r: 5 }] });
    plot($('x0c-1-plot2'), { xmin: 0, xmax: 2, ymin: -1, ymax: 13, xlabel: 'time t (s)', ylabel: 'acceleration a (m/s²)', series: [{ pts: ap, color: RED, width: 2.4 }], points: [{ x: t, y: st.a, color: RED, r: 5 }] });
    statsEvery(st, 'x0c-1-stats', () => [['t', fmt(t, 3) + ' s'], ['v = 3t²', fmt(st.v, 4) + ' m/s'], ['a = dv/dt = 6t (slope of the dashed tangent)', fmt(st.a, 4) + ' m/s²', true]]);
  }
});

/* ---------- 0.C.2: v(s) = 5 sin 3s, so a = v dv/ds = 37.5 sin 6s ---------- */
makeClip({
  id: 'x0c-2', speed: 1,
  reset(st){ st.trk = { s0: 0, s1: 1, unit: 'm', tick: 0.2 }; st.s = 0.08; st.tt = 0; st.v = 5 * Math.sin(3 * st.s); st.a = 37.5 * Math.sin(6 * st.s); st.hold = undefined; st.vPrev = null; st.aNum = undefined; },
  step(st, dt){
    const s1 = 0.9 * Math.PI / 3;
    if (st.s >= s1){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.s = 0.08; st.tt = 0; st.hold = undefined; st.vPrev = null; st.aNum = undefined; } return; }
    const h0 = dt * 0.12, n = 20, h = h0 / n, f = s => 5 * Math.sin(3 * s);           // the motion is slowed down 8 times so that it can be followed
    for (let k = 0; k < n; k++){ const k1 = f(st.s), k2 = f(st.s + h / 2 * k1), k3 = f(st.s + h / 2 * k2), k4 = f(st.s + h * k3); st.s += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); }
    st.s = Math.min(st.s, s1); st.tt += h0;
    const vNow = f(st.s); if (st.vPrev !== null && h0 > 0) st.aNum = (vNow - st.vPrev) / h0; st.vPrev = vNow;
    st.v = vNow; st.a = 37.5 * Math.sin(6 * st.s);
  },
  draw(st){
    const cv = $('x0c-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    track(ctx, w, h - 30, st, { v: 12, a: 1.6 });
    const s = st.s, s1 = 0.9 * Math.PI / 3, vp = curve(q => 5 * Math.sin(3 * q), 0, s1), ap = curve(q => 37.5 * Math.sin(6 * q), 0, s1), dv = 15 * Math.cos(3 * s), ds = 0.12;
    plot($('x0c-2-plot'), { xmin: 0, xmax: s1, ymin: -0.5, ymax: 6, xlabel: 'position s (m)', ylabel: 'speed v (m/s)',
      series: [{ pts: vp, color: COL.c3, width: 2.4 }, { pts: [[s - ds, st.v - dv * ds], [s + ds, st.v + dv * ds]], color: COL.c2, width: 2, dash: [5, 3], guide: true }], points: [{ x: s, y: st.v, color: COL.c3, r: 5 }] });
    plot($('x0c-2-plot2'), { xmin: 0, xmax: s1, ymin: -44, ymax: 44, xlabel: 'position s (m)', ylabel: 'acceleration a (m/s²)', series: [{ pts: ap, color: RED, width: 2.4 }], points: [{ x: s, y: st.a, color: RED, r: 5 }] });
    statsEvery(st, 'x0c-2-stats', () => [['s', fmt(s, 4) + ' m'], ['v = 5 sin 3s', fmt(st.v, 4) + ' m/s'], ['dv/ds = 15 cos 3s (slope of the tangent)', fmt(dv, 4) + ' 1/s'],
      ['a = v dv/ds = 37.5 sin 6s', fmt(st.a, 4) + ' m/s²', true], ['a measured from the motion, Δv/Δt', st.aNum !== undefined ? fmt(st.aNum, 3) + ' m/s²' : '—']]);
  }
});

/* ---------- 0.C.3: a(t) = 6 sin 2t with v(0) = 4, so v = 7 − 3 cos 2t (and s = 7t − 1.5 sin 2t when s(0) = 0) ---------- */
makeClip({
  id: 'x0c-3', speed: 1,
  reset(st){ st.trk = { s0: 0, s1: 45, unit: 'm', tick: 5 }; st.tt = 0; st.s = 0; st.v = 4; st.a = 0; st.trail = [[0, 4]]; st.hold = undefined; },
  step(st, dt){
    const T = 2 * Math.PI;
    if (loop(st, T, 1.2, () => { st.tt = 0; st.s = 0; st.v = 4; st.trail = [[0, 4]]; })) return;
    // integrate a(t) step by step (the simulation knows only the acceleration and the starting speed)
    const n = 20, h = Math.min(dt, T - st.tt) / n;
    for (let k = 0; k < n; k++){ const f = (t, y) => [y[1], 6 * Math.sin(2 * t)]; const q = rk4(f, st.tt, [st.s, st.v], h); st.s = q[0]; st.v = q[1]; st.tt += h; }
    st.a = 6 * Math.sin(2 * st.tt); st.trail.push([st.tt, st.v]);
  },
  draw(st){
    const cv = $('x0c-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    track(ctx, w, h - 30, st, { v: 8, a: 8 });
    txt(ctx, `t = ${fmt(st.tt, 3)} s`, 30, 18, { font: '12px system-ui', color: COL.muted, align: 'left' });
    const T = 2 * Math.PI, ex = curve(q => 7 - 3 * Math.cos(2 * q), 0, T), ap = curve(q => 6 * Math.sin(2 * q), 0, T);
    plot($('x0c-3-plot'), { xmin: 0, xmax: T, ymin: 0, ymax: 11, xlabel: 'time t (s)', ylabel: 'speed v (m/s)',
      series: [{ pts: st.trail, color: COL.c3, width: 7, alpha: 0.4 }, { pts: ex, color: COL.c2, width: 2, dash: [6, 4] }], points: [{ x: st.tt, y: st.v, color: COL.c3, r: 5 }] });
    plot($('x0c-3-plot2'), { xmin: 0, xmax: T, ymin: -7.5, ymax: 7.5, xlabel: 'time t (s)', ylabel: 'acceleration a (m/s²)', series: [{ pts: ap, color: RED, width: 2.4 }], points: [{ x: st.tt, y: st.a, color: RED, r: 5 }] });
    statsEvery(st, 'x0c-3-stats', () => [['t', fmt(st.tt, 3) + ' s'], ['a = 6 sin 2t', fmt(st.a, 4) + ' m/s²'], ['v from the simulation', fmt(st.v, 5) + ' m/s', true], ['7 − 3 cos 2t', fmt(7 - 3 * Math.cos(2 * st.tt), 5) + ' m/s', true]]);
  }
});

/* ---------- 0.C.4: a(s) = 8s³ with v(0) = 5, so v = √(25 + 4s⁴) ---------- */
makeClip({
  id: 'x0c-4', speed: 1,
  reset(st){ st.trk = { s0: 0, s1: 2, unit: 'm', tick: 0.5 }; st.s = 0; st.v = 5; st.a = 0; st.trail = [[0, 5]]; st.hold = undefined; },
  step(st, dt){
    if (st.s >= 2){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; st.s = 0; st.v = 5; st.trail = [[0, 5]]; } return; }
    const h0 = dt * 0.1, n = 40, h = h0 / n;                                    // slowed down 10 times
    for (let k = 0; k < n; k++){ const q = rk4((t, y) => [y[1], 8 * y[0] ** 3], 0, [st.s, st.v], h); st.s = q[0]; st.v = q[1]; }
    if (st.s > 2){ st.s = 2; st.v = Math.sqrt(25 + 64); }                       // stop exactly at s = 2
    st.a = 8 * st.s ** 3; st.trail.push([st.s, st.v]);
  },
  draw(st){
    const cv = $('x0c-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    track(ctx, w, h - 30, st, { v: 6, a: 1.2 });
    const ex = curve(q => Math.sqrt(25 + 4 * q ** 4), 0, 2);
    plot($('x0c-4-plot'), { xmin: 0, xmax: 2, ymin: 4, ymax: 10, xlabel: 'position s (m)', ylabel: 'speed v (m/s)',
      series: [{ pts: st.trail, color: COL.c3, width: 7, alpha: 0.4 }, { pts: ex, color: COL.c2, width: 2, dash: [6, 4] }], points: [{ x: st.s, y: st.v, color: COL.c3, r: 5 }] });
    statsEvery(st, 'x0c-4-stats', () => [['s', fmt(st.s, 4) + ' m'], ['a = 8s³', fmt(st.a, 4) + ' m/s²'], ['v from the simulation', fmt(st.v, 5) + ' m/s', true], ['√(25 + 4s⁴)', fmt(Math.sqrt(25 + 4 * st.s ** 4), 5) + ' m/s', true]]);
  }
});

subLabels();
})();
