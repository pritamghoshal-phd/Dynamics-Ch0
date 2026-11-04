/* =========================================================
   Chapter 4, Newton's second law for particles: examples 4.A.1 to 4.A.8
   Every clip computes its motion from the equations derived in the solution.
   ========================================================= */
(function(){
const GF = 32.2;   // g in ft/s²
const hold = (st, tEnd, pause = 1.5) => { if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + pause){ st.t = 0; st.hold = undefined; st.reset && st.reset(); } } };
const tNow = (st, tEnd) => Math.min(st.hold ?? st.t, tEnd);
const tickLabel = { font: '11px system-ui', color: COL.muted };
const small = { font: '12px system-ui', color: COL.muted };
// ground line that scrolls under a camera that follows a moving object (x0 = world position at screen centre)
function scrollGround(ctx, x0w, cx, y, S, x1, x2, every, unit){
  line(ctx, x1, y, x2, y, COL.fg, 2); hatch(ctx, x1, y, x2, y, 1);
  const k0 = Math.floor((x0w - (cx - x1) / S) / every), k1 = Math.ceil((x0w + (x2 - cx) / S) / every);
  for (let k = k0; k <= k1; k++){ const X = cx + (k * every - x0w) * S; if (X < x1 + 4 || X > x2 - 4) continue;
    line(ctx, X, y, X, y - 8, COL.muted, 1.4); if (unit) txt(ctx, `${fmt(k * every, 3)} ${unit}`, X, y + 22, tickLabel); }
}
function car(ctx, cx, by, L, ang, col){
  const H = L * 0.26, r = L * 0.09;
  ctx.save(); ctx.fillStyle = col || '#d9a441'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(cx - L / 2, by - r - 2); ctx.lineTo(cx - L / 2, by - r - H * 0.9); ctx.lineTo(cx - L * 0.28, by - r - H); ctx.lineTo(cx - L * 0.18, by - r - H * 1.75);
  ctx.lineTo(cx + L * 0.2, by - r - H * 1.75); ctx.lineTo(cx + L * 0.32, by - r - H); ctx.lineTo(cx + L / 2, by - r - H * 0.85); ctx.lineTo(cx + L / 2, by - r - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfe0f0'; ctx.beginPath(); ctx.moveTo(cx - L * 0.15, by - r - H * 1.62); ctx.lineTo(cx + L * 0.17, by - r - H * 1.62); ctx.lineTo(cx + L * 0.26, by - r - H * 1.08); ctx.lineTo(cx - L * 0.24, by - r - H * 1.08); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  [cx - L * 0.3, cx + L * 0.3].forEach(x => wheel(ctx, x, by - r, r, ang, 'tire'));
}

/* ---------- 4.A.1: braking car ---------- */
makeClip({
  id: 'x4a-1', speed: 1,
  controls: [
    { key: 'Ff', label: 'Braking force F_f', min: 2000, max: 30000, step: 500, value: 10000, unit: 'N', dec: 0 },
    { key: 'v1', label: 'Initial speed v_1', min: 10, max: 100, step: 1, value: 80, unit: 'm/s', dec: 1 },
    { key: 'm', label: 'Mass m', min: 500, max: 5000, step: 50, value: 2000, unit: 'kg', dec: 0 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ Ff: 10000, v1: 80, m: 2000 }) }, { label: 'Twice the braking force', apply: () => C.set({ Ff: 20000, v1: 80, m: 2000 }) }, { label: 'Highway speed, 30 m/s', apply: () => C.set({ Ff: 10000, v1: 30, m: 2000 }) }],
  reset(st){
    const V = st.V; st.a = V.Ff / V.m; st.ts = V.v1 / st.a; st.s = V.v1 * V.v1 / (2 * st.a); st.K = Math.max(1, st.ts / 5); st.hold = undefined;
    setStats('x4a-1-stats', [['a = F_f / m', fmt(st.a, 4) + ' m/s² (opposite to the motion)'], ['stopping distance s = v_1² / (2a)', fmt(st.s, 4) + ' m', true], ['stopping time t = v_1 / a', fmt(st.ts, 4) + ' s', true]]);
  },
  step(st){ if (st.t * st.K > st.ts){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.5){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('x4a-1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 300, 330); fitView(ctx, w, h, nr ? [100, 0, 600, 330] : [0, 0, 700, 300]);
    const V = st.V, T = Math.min((st.hold ?? st.t) * st.K, st.ts), x = V.v1 * T - 0.5 * st.a * T * T, v = V.v1 - st.a * T;
    const S = 18, cx = 350, gy = 210, every = st.s > 60 ? 10 : 5;
    scrollGround(ctx, x, cx, gy, S, 10, 690, every, 'm');
    // start and stop marks on the road
    [[0, 'start'], [st.s, 'stop']].forEach(([X, l]) => { const px = cx + (X - x) * S; if (px > 20 && px < 680){ line(ctx, px, gy - 70, px, gy, COL.c4, 2, [5, 4]); txt(ctx, l, px, gy - 80, { font: '12px system-ui', color: COL.c4 }); } });
    car(ctx, cx, gy, 4.6 * S, x / 0.37, '#d9a441');
    if (v > 0.05){ arrow(ctx, cx - 40, gy - 105, cx - 40 + Math.min(120, 18 + v * 1.3), gy - 105, COL.c3, 3); txt(ctx, 'v', cx - 52, gy - 105, { color: COL.c3 }); }
    if (v > 0.01){ arrow(ctx, cx + 20, gy + 4, cx - 60, gy + 4, RED, 3.2); txt(ctx, 'F_f', cx - 76, gy + 4, { color: RED }); }
    txt(ctx, `t = ${fmt(T, 3)} s`, 690, 22, { font: '12px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, `distance travelled ${fmt(x, 4)} m`, 690, 42, { font: '12px system-ui', color: COL.muted, align: 'right' });
    txt(ctx, `speed ${fmt(v, 3)} m/s`, 690, 62, { font: '12px system-ui', color: COL.c3, align: 'right' });
    if (st.K > 1.01) txt(ctx, `time runs ${fmt(st.K, 2)}× faster than real time`, 20, 22, { font: '12px system-ui', color: COL.muted, align: 'left' });
    const pv = []; for (let i = 0; i <= 60; i++){ const q = st.ts * i / 60; pv.push([q, V.v1 - st.a * q]); }
    plot($('x4a-1-plot'), { xmin: 0, xmax: st.ts * 1.05, ymin: 0, ymax: V.v1 * 1.08, xlabel: 'time t (s)', ylabel: 'speed v (m/s)', series: [{ pts: pv, color: COL.c3, width: 2.4 }], points: [{ x: T, y: v, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.A.2: rope sliding off a rough table over a pulley ---------- */
makeClip({
  id: 'x4a-2', speed: 0.5,
  controls: [
    { key: 'mu', label: 'Kinetic friction coefficient μ_k', min: 0, max: 0.3, step: 0.01, value: 0.2, dec: 2 },
    { key: 'dL', label: 'Initial overhang d / L', min: 0.05, max: 0.6, step: 0.01, value: 0.2, dec: 2 }
  ],
  presets: C => [{ label: 'Book case, d = 0.2L', apply: () => C.set({ dL: 0.2, mu: 0.2 }) }, { label: 'Smooth table', apply: () => C.set({ dL: 0.2, mu: 0 }) }, { label: 'Too much friction', apply: () => C.set({ dL: 0.2, mu: 0.28 }) }],
  reset(st){
    const V = st.V, L = 2, d = V.dL * L; st.L = L; st.x = d; st.v = 0; st.done = false; st.hold = undefined;
    st.a0 = G0 * (d - V.mu * (L - d)) / L; st.moves = st.a0 > 1e-9;
    st.vEnd = Math.sqrt(Math.max(0, (G0 / L) * ((1 + V.mu) * (L * L - d * d) - 2 * V.mu * L * (L - d))));
    setStats('x4a-2-stats', st.moves ? [['starting acceleration a_0', fmt(st.a0, 4) + ' m/s²'], ['speed when the left end reaches C', fmt(st.vEnd, 4) + ' m/s', true], ['formula', 'v = √(g L(0.96 − 0.64 μ_k)) for d = 0.2L']]
      : [['starting acceleration', 'zero or negative'], ['result', 'the overhang is too short, so friction holds the rope at rest', true]]);
  },
  step(st, dt){
    const V = st.V;
    if (!st.moves){ if (st.t > 2.5) st.t = 0; return; }
    if (st.done){ if (st.t > st.hold + 1.5){ st.t = 0; st.hold = undefined; st.x = V.dL * st.L; st.v = 0; st.done = false; } return; }
    const L = st.L, n = 20, h = dt / n;
    for (let i = 0; i < n && !st.done; i++){ const a = G0 * (st.x - V.mu * (L - st.x)) / L; st.v += a * h; st.x += st.v * h; if (st.x >= L){ st.x = L; st.v = st.vEnd; st.done = true; st.hold = st.t; } }
  },
  draw(st){
    const cv = $('x4a-2-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 500]);
    const V = st.V, L = st.L, S = 190, ty = 90, px = 470, pr = 14, x = st.x, fy = 486;
    // table: a level top on two legs standing on the floor; the pulley C is bracketed to its right edge.
    // The table is taller than the rope, so the fully hanging rope still clears the floor.
    hatch(ctx, 20, fy, 630, fy, 1);
    ctx.save(); ctx.fillStyle = '#d6d1c4'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.rect(40, ty, px - 44, 18); ctx.fill(); ctx.stroke();
    [[60, 14], [px - 34, 14]].forEach(([lx, lw]) => { ctx.beginPath(); ctx.rect(lx, ty + 18, lw, fy - ty - 18); ctx.fill(); ctx.stroke(); });
    ctx.restore();
    txt(ctx, 'rough surface, μ_k', 120, ty - 44, { font: '12px system-ui', color: COL.muted });
    pulley(ctx, px, ty - pr + 2, pr); txt(ctx, 'C', px + 26, ty - 34);
    // rope: the part on the table, the wrap over the pulley, and the hanging part
    const xl = px - (L - x) * S, top = ty - 3, xr = px + pr;
    ctx.save(); ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 6; ctx.lineCap = 'butt'; ctx.beginPath();
    if (L - x > 1e-4){ ctx.moveTo(xl, top); ctx.lineTo(px, top); }
    ctx.moveTo(px, top); ctx.arc(px, ty - pr + 2, pr + 1, -Math.PI / 2, 0); ctx.lineTo(xr + 1, ty - pr + 2 + x * S); ctx.stroke(); ctx.restore();
    // marks every 0.25 m along the rope show that the rope itself moves
    for (let q = 0.25; q < L; q += 0.25){ const on = L - x; let X, Y; if (q < on){ X = xl + q * S; Y = top; } else { X = xr + 1; Y = ty - pr + 2 + (q - on) * S; }
      ctx.save(); ctx.fillStyle = '#f3e3b8'; ctx.beginPath(); ctx.arc(X, Y, 2.6, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
    // overhang dimension and speed
    line(ctx, xr + 40, ty - pr + 2, xr + 40, ty - pr + 2 + x * S, COL.muted, 1.2); txt(ctx, 'x', xr + 54, ty + x * S / 2);
    if (st.v > 0.02){ arrow(ctx, xr + 80, ty + 40, xr + 80, ty + 40 + Math.min(110, 20 + st.v * 20), COL.c3, 3); txt(ctx, 'v', xr + 94, ty + 60, { color: COL.c3 }); }
    txt(ctx, `overhang x = ${fmt(x, 3)} m of L = ${fmt(L, 2)} m`, 120, 200, { ...small, align: 'left' });
    txt(ctx, `speed v = ${fmt(st.v, 3)} m/s`, 120, 220, { font: '12px system-ui', color: COL.c3, align: 'left' });
    if (!st.moves) txt(ctx, 'The rope stays at rest: friction can hold the short overhang.', 320, 250, { font: '13px system-ui', color: RED });
    const pts = [], d = V.dL * L; for (let i = 0; i <= 80; i++){ const q = d + (L - d) * i / 80, v2 = (G0 / L) * ((1 + V.mu) * (q * q - d * d) - 2 * V.mu * L * (q - d)); pts.push([q, Math.sqrt(Math.max(0, v2))]); }
    plot($('x4a-2-plot'), { xmin: 0, xmax: L, ymin: 0, ymax: Math.max(1, st.vEnd * 1.15), xlabel: 'overhang x (m)', ylabel: 'speed v (m/s)', series: st.moves ? [{ pts, color: COL.c3, width: 2.4 }] : [], points: [{ x, y: st.v, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.A.3: crate sliding up a rough incline ---------- */
makeClip({
  id: 'x4a-3', speed: 0.5,
  controls: [
    { key: 'th', label: 'Incline angle θ', min: 5, max: 60, step: 0.5, value: 36.87, unit: '°', dec: 2 },
    { key: 'mu', label: 'Kinetic friction coefficient μ_k', min: 0, max: 1, step: 0.01, value: 0.25, dec: 2 },
    { key: 'v0', label: 'Initial speed v_0', min: 5, max: 60, step: 1, value: 40, unit: 'ft/s', dec: 1 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ th: 36.87, mu: 0.25, v0: 40 }) }, { label: 'Rough enough to stay up (μ_k = 0.8)', apply: () => C.set({ th: 36.87, mu: 0.8, v0: 40 }) }, { label: 'Smooth incline', apply: () => C.set({ th: 36.87, mu: 0, v0: 40 }) }],
  reset(st){
    const V = st.V, th = V.th * RAD; st.a1 = GF * (Math.sin(th) + V.mu * Math.cos(th)); st.t1 = V.v0 / st.a1; st.smax = V.v0 * V.v0 / (2 * st.a1);
    st.back = Math.tan(th) > V.mu; st.a2 = st.back ? GF * (Math.sin(th) - V.mu * Math.cos(th)) : 0; st.t2 = st.back ? st.t1 + Math.sqrt(2 * st.smax / st.a2) : st.t1 + 1.5; st.hold = undefined;
    setStats('x4a-3-stats', [['deceleration on the way up a_1 = g(sin θ + μ_k cos θ)', fmt(st.a1, 4) + ' ft/s²'], ['time to stop t = v_0 / a_1', fmt(st.t1, 4) + ' s', true], ['distance up the incline', fmt(st.smax, 4) + ' ft'],
      ['afterwards', st.back ? `slides back down with ${fmt(st.a2, 3)} ft/s² (if μ_s is also below tan θ)` : 'stays at rest, because μ_k ≥ tan θ']]);
  },
  step(st){ hold(st, st.t2, 1.2); },
  draw(st){
    const cv = $('x4a-3-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, th = V.th * RAD, Lw = Math.max(st.smax * 1.15 + 4, 12), S = Math.min(520 / (Lw * Math.cos(th)), 300 / (Lw * Math.sin(th)));
    fitView(ctx, w, h, [0, 0, 640, 400]);
    const x0 = 60, y0 = 360, xt = x0 + Lw * S * Math.cos(th), yt = y0 - Lw * S * Math.sin(th);
    ctx.save(); ctx.fillStyle = 'rgba(125,119,107,.14)'; ctx.strokeStyle = COL.ground; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xt, yt); ctx.lineTo(xt, y0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    line(ctx, x0 - 30, y0, xt + 30, y0, COL.fg, 2); hatch(ctx, x0 - 30, y0, xt + 30, y0, 1);
    const t = tNow(st, st.t2);
    let s, v; if (t <= st.t1){ s = V.v0 * t - 0.5 * st.a1 * t * t; v = V.v0 - st.a1 * t; } else if (st.back){ const u = t - st.t1; s = st.smax - 0.5 * st.a2 * u * u; v = -st.a2 * u; } else { s = st.smax; v = 0; }
    s = Math.max(0, s);
    const b = 2.2 * S > 46 ? 46 : Math.max(26, 2.2 * S), ux = Math.cos(th), uy = -Math.sin(th), nx = -Math.sin(th), ny = -Math.cos(th);
    const px = x0 + (2 + s) * S * ux, py = y0 + (2 + s) * S * uy, cx = px + nx * b / 2, cy = py + ny * b / 2;
    block(ctx, cx, cy, b, b, -th, 'C');
    // friction acts on the bottom face, opposite to the sliding velocity
    if (Math.abs(v) > 0.05){ const sg = Math.sign(v); arrow(ctx, px - ux * sg * 4, py - uy * sg * 4, px - ux * sg * 60, py - uy * sg * 60, RED, 3); txt(ctx, 'F_f', px - ux * sg * 70 + nx * 16, py - uy * sg * 70 + ny * 16, { color: RED });
      arrow(ctx, cx + nx * (b / 2 + 14), cy + ny * (b / 2 + 14), cx + nx * (b / 2 + 14) + ux * sg * Math.min(90, 14 + Math.abs(v) * 2), cy + ny * (b / 2 + 14) + uy * sg * Math.min(90, 14 + Math.abs(v) * 2), COL.c3, 2.6);
      txt(ctx, 'v', cx + nx * (b / 2 + 30), cy + ny * (b / 2 + 30), { color: COL.c3 }); }
    txt(ctx, 'θ', x0 + 58, y0 - 14);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x0, y0, 40, -th, 0); ctx.stroke(); ctx.restore();
    txt(ctx, `t = ${fmt(t, 3)} s`, 630, 20, { ...small, align: 'right' });
    txt(ctx, t <= st.t1 ? 'sliding up' : st.back ? 'sliding back down' : 'at rest', 630, 40, { ...small, align: 'right' });
    const pts = []; for (let i = 0; i <= 80; i++){ const q = st.t2 * i / 80; pts.push([q, q <= st.t1 ? V.v0 - st.a1 * q : st.back ? -st.a2 * (q - st.t1) : 0]); }
    plot($('x4a-3-plot'), { xmin: 0, xmax: st.t2, ymin: Math.min(0, ...pts.map(p => p[1])) * 1.1 - 1, ymax: V.v0 * 1.1, xlabel: 'time t (s)', ylabel: 'velocity up the incline (ft/s)', series: [{ pts, color: COL.c3, width: 2.4 }], vlines: [{ x: st.t1, color: COL.c4, label: 'stop' }], points: [{ x: t, y: v, color: COL.c3, r: 5 }] });
  }
});

/* ---------- 4.A.4: collar on a smooth rod in an accelerating frame ---------- */
makeClip({
  id: 'x4a-4', speed: 0.5,
  controls: [
    { key: 'a', label: 'Frame acceleration a', min: 0, max: 20, step: 0.05, value: 7.3575, unit: 'm/s²', dec: 2 },
    { key: 'th', label: 'Rod angle θ', min: 10, max: 70, step: 0.5, value: 36.87, unit: '°', dec: 2 }
  ],
  presets: C => [{ label: 'a = g tan θ (collar stays put)', apply: () => C.set({ a: +(G0 * Math.tan(C.v.th * RAD)).toFixed(3) }) }, { label: 'Frame not accelerating', apply: () => C.set({ a: 0 }) }, { label: 'a = 12 m/s²', apply: () => C.set({ a: 12 }) }],
  reset(st){
    const V = st.V, th = V.th * RAD; st.sdd = G0 * Math.sin(th) - V.a * Math.cos(th); st.aReq = G0 * Math.tan(th); st.hold = undefined;
    st.tEnd = 2.2; st.tHit = Math.abs(st.sdd) > 1e-6 ? Math.sqrt(2 * 0.5 / Math.abs(st.sdd)) : Infinity;
    setStats('x4a-4-stats', [['required a = g tan θ', fmt(st.aReq, 4) + ' m/s²', true], ['acceleration of P along the rod, relative to the frame', fmt(st.sdd, 4) + ' m/s² (down the rod +)'],
      ['N / m while P stays put = g / cos θ', fmt(G0 / Math.cos(th), 4) + ' m/s²'], ['collar', Math.abs(st.sdd) < 0.02 ? 'does not slide' : st.sdd > 0 ? 'slides down the rod' : 'slides up the rod']]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4a-4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 360]);
    const V = st.V, th = V.th * RAD, t = tNow(st, st.tEnd), X = 0.5 * V.a * t * t, S = 220, cx = 300, gy = 300;
    scrollGround(ctx, X, cx, gy, S, 10, 630, 0.5, 'm');
    // frame on wheels; inner opening 1.3 m × 0.75 m
    const W = 1.5 * S, Hh = 0.9 * S, fx = cx - W / 2, fy = gy - 12 - Hh, iw = 1.3 * S, ih = 0.7 * S, ix = cx - iw / 2, iy = fy + (Hh - ih) / 2;
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.fillRect(fx, fy, W, Hh); ctx.strokeRect(fx, fy, W, Hh); ctx.fillStyle = COL.card; ctx.fillRect(ix, iy, iw, ih); ctx.strokeRect(ix, iy, iw, ih); ctx.restore();
    [cx - W * 0.38, cx + W * 0.38].forEach(x => wheel(ctx, x, gy - 6, 6, X / 0.03, 'tire'));
    // rod through the centre of the opening, falling to the right at angle θ, clipped to the opening
    const mx = cx, my = iy + ih / 2, ex = Math.cos(th), ey = Math.sin(th); // screen: down-right
    const half = Math.min((iw / 2) / ex, (ih / 2) / ey) - 2;
    ctx.save(); ctx.strokeStyle = '#7d776b'; ctx.lineWidth = 9; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(mx - ex * half, my - ey * half); ctx.lineTo(mx + ex * half, my + ey * half); ctx.stroke(); ctx.restore();
    // collar: slides along the rod with s'' = g sin θ − a cos θ until it reaches an end
    const smax = (half - 22) / S; let s = 0.5 * st.sdd * t * t; s = clamp(s, -smax, smax);
    const pxx = mx + ex * s * S, pyy = my + ey * s * S;
    block(ctx, pxx, pyy, 40, 26, th, '', '#5b5a55'); txt(ctx, 'P', pxx - ey * 30, pyy + ex * 30, { font: 'italic bold 15px Georgia, serif' });
    // the angle θ at the lower-left end of the rod
    const lx = mx - ex * half, ly = my - ey * half;
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 70, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(lx, ly, 52, 0, th); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', lx + 66 * Math.cos(th / 2), ly + 66 * Math.sin(th / 2));
    // normal force on the collar (perpendicular to the rod) and weight
    const Nn = G0 * Math.cos(th) + V.a * Math.sin(th), k = 4.2;
    arrow(ctx, pxx, pyy, pxx + ey * Nn * k, pyy - ex * Nn * k, COL.c2, 2.6); txt(ctx, 'N', pxx + ey * Nn * k + 12, pyy - ex * Nn * k - 8, { color: COL.c2 });
    arrow(ctx, pxx, pyy, pxx, pyy + G0 * k, '#c2410c', 2.6); txt(ctx, 'mg', pxx + 14, pyy + G0 * k + 4, { color: '#c2410c' });
    if (V.a > 0.01){ arrow(ctx, cx - 40, fy - 22, cx + 40, fy - 22, COL.c5 || COL.c4, 3); txt(ctx, 'a', cx + 54, fy - 22, { color: COL.c5 || COL.c4 }); }
    txt(ctx, `t = ${fmt(t, 3)} s`, 630, 20, { ...small, align: 'right' });
    txt(ctx, Math.abs(st.sdd) < 0.02 ? 'P stays at the same place on the rod' : (Math.abs(s) >= smax - 1e-6 ? 'P has reached the end of the rod' : (st.sdd > 0 ? 'P slides down the rod' : 'P slides up the rod')), 630, 40, { ...small, align: 'right' });
    const pts = []; for (let i = 0; i <= 80; i++){ const q = st.tEnd * i / 80; pts.push([q, clamp(0.5 * st.sdd * q * q, -smax, smax)]); }
    plot($('x4a-4-plot'), { xmin: 0, xmax: st.tEnd, ymin: -smax * 1.1, ymax: smax * 1.1, xlabel: 'time t (s)', ylabel: 'position of P on the rod (m)', series: [{ pts, color: COL.c3, width: 2.4 }], points: [{ x: t, y: s, color: COL.c3, r: 5 }], fixed: true });
  }
});

/* ---------- 4.A.5: cable car pulled up a taut cable ---------- */
makeClip({
  id: 'x4a-5', speed: 0.5,
  controls: [
    { key: 'F', label: 'Horizontal force F', min: 0, max: 6000, step: 50, value: 2400, unit: 'N', dec: 0 },
    { key: 'm', label: 'Mass m', min: 50, max: 600, step: 10, value: 200, unit: 'kg', dec: 0 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ F: 2400, m: 200 }) }, { label: 'F just holds the car', apply: () => C.set({ F: +(C.v.m * G0 * 5 / 12).toFixed(1) }) }, { label: 'F = 0', apply: () => C.set({ F: 0 }) }],
  reset(st){
    const V = st.V, c = 12 / 13, s = 5 / 13; st.a = (V.F * c - V.m * G0 * s) / V.m; st.N = V.m * G0 * c + V.F * s; st.hold = undefined;
    st.tEnd = Math.abs(st.a) > 1e-6 ? Math.sqrt(2 * 7 / Math.abs(st.a)) : 2.5; st.tEnd = Math.min(st.tEnd, 3);
    setStats('x4a-5-stats', [['a = (F cos β − mg sin β) / m', fmt(st.a, 4) + ' m/s² (up the cable +)', true], ['force on the cable from the car, N', fmt(st.N, 4) + ' N, perpendicular to the cable', true], ['slope of the cable', 'tan β = 5/12, β = 22.62°']]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4a-5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 680, 420]);
    const V = st.V, S = 34, c = 12 / 13, s5 = 5 / 13, t = tNow(st, st.tEnd), sPos = 0.5 * st.a * t * t;
    const x0 = 40, y0 = 380, x1 = 660, y1 = y0 - (x1 - x0) * 5 / 12;
    line(ctx, x0, y0, x1, y1, COL.fg, 4);
    txt(ctx, 'cable', x1 - 80, y1 - 2, { font: '12px system-ui', color: COL.muted });
    // slope triangle
    line(ctx, 560, 80, 620, 80, COL.muted, 1.2); line(ctx, 620, 80, 620, 55, COL.muted, 1.2); line(ctx, 560, 80, 620, 55, COL.muted, 1.2);
    txt(ctx, '12', 590, 94, { font: '12px system-ui', color: COL.muted }); txt(ctx, '5', 632, 67, { font: '12px system-ui', color: COL.muted });
    // trolley on the cable at distance s0 + sPos along it; the cabin hangs vertically below
    const s0 = 8, sp = clamp(s0 + sPos, 1.5, 17); const qx = x0 + sp * S * c, qy = y0 - sp * S * s5;
    const ux = c, uy = -s5, nx = -s5, ny = -c; // along the cable (screen) and the upward normal (screen)
    [-0.9, -0.3, 0.3, 0.9].forEach(d => { const wx = qx + ux * d * S + nx * 7, wy = qy + uy * d * S + ny * 7; ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(wx, wy, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
      line(ctx, wx, wy, wx + 6, wy + 30, COL.fg, 2.4); });
    const bx = qx + 6, by = qy + 30; // cabin top centre
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 52, by + 30); ctx.lineTo(bx + 46, by - 2 + 0); ctx.lineTo(bx + 46, by + 80); ctx.lineTo(bx - 52, by + 80); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'C', bx - 4, by + 52, { font: 'italic bold 16px Georgia, serif' });
    arrow(ctx, bx + 46, by + 50, bx + 46 + Math.min(130, 10 + V.F / 30), by + 50, RED, 3.2); txt(ctx, 'F', bx + 60 + Math.min(130, 10 + V.F / 30), by + 50, { color: RED });
    // force of the car on the cable: N, perpendicular to the cable, pointing down and to the right
    const kN = 0.03; arrow(ctx, qx + nx * 18 - nx * 0 , qy + ny * 18, qx + nx * 18 - nx * st.N * kN, qy + ny * 18 - ny * st.N * kN, COL.c2, 2.6);
    txt(ctx, 'force on the cable', qx - nx * st.N * kN + 70, qy - ny * st.N * kN + 70, { font: '12px system-ui', color: COL.c2 });
    if (Math.abs(st.a) > 0.01){ const sg = Math.sign(st.a); arrow(ctx, qx - 40 * ux * sg + nx * 46, qy - 40 * uy * sg + ny * 46, qx + 40 * ux * sg + nx * 46, qy + 40 * uy * sg + ny * 46, COL.c4, 2.6); txt(ctx, 'a', qx + 54 * ux * sg + nx * 46, qy + 54 * uy * sg + ny * 46, { color: COL.c4 }); }
    txt(ctx, 'g', 40, 120); arrow(ctx, 40, 60, 40, 108, COL.muted, 1.6);
    txt(ctx, `t = ${fmt(t, 3)} s`, 670, 400, { ...small, align: 'right' });
    const pts = []; for (let i = 0; i <= 60; i++){ const F = 6000 * i / 60; pts.push([F, (F * c - V.m * G0 * s5) / V.m]); }
    plot($('x4a-5-plot'), { xmin: 0, xmax: 6400, ymin: Math.min(...pts.map(p => p[1])) * 1.1 - 0.5, ymax: Math.max(...pts.map(p => p[1])) * 1.1 + 0.5, xlabel: 'force F (N)', ylabel: 'acceleration a (m/s²)', series: [{ pts, color: COL.c4, width: 2.4 }], hlines: [{ y: 0, color: COL.axis }], points: [{ x: V.F, y: st.a, color: COL.c4, r: 5 }] });
  }
});

/* ---------- 4.A.6: block A with a pulley on block B ---------- */
makeClip({
  id: 'x4a-6', speed: 0.25,
  controls: [
    { key: 'F', label: 'Cable force F', min: 0, max: 200, step: 1, value: 60, unit: 'N', dec: 1 },
    { key: 'mu', label: 'Kinetic friction between A and B, μ_k', min: 0, max: 1, step: 0.01, value: 0.5, dec: 2 },
    { key: 'm', label: 'Mass of A, m', min: 5, max: 60, step: 1, value: 20, unit: 'kg', dec: 1 },
    { key: 'M', label: 'Mass of B, M', min: 20, max: 300, step: 5, value: 100, unit: 'kg', dec: 1 }
  ],
  setup(st){ st.rough = false; },
  presets: (C, st, reset) => [{ label: '(a) Smooth surface between A and B', apply: () => { st.rough = false; reset(); } }, { label: '(b) Rough surface, μ_k = 0.5', apply: () => { st.rough = true; C.set({ mu: 0.5, F: 60, m: 20, M: 100 }); } }],
  reset(st){
    const V = st.V, fm = st.rough ? V.mu * V.m * G0 : 0;
    st.slip = true; st.f = fm;
    if (st.rough){ const ac = V.F / (V.m + V.M), need = 2 * V.F - V.m * ac; if (Math.abs(need) <= fm){ st.slip = false; st.f = need; } }
    if (st.slip){ st.aA = (2 * V.F - fm) / V.m; st.aB = (-V.F + fm) / V.M; } else { st.aA = st.aB = V.F / (V.m + V.M); }
    st.ar = st.aA - st.aB; st.tEnd = st.ar > 1e-6 ? Math.sqrt(2 * 0.3 / st.ar) : 2; st.tEnd = Math.min(st.tEnd, 2.5); st.hold = undefined;
    setStats('x4a-6-stats', [['surface', st.rough ? `rough, μ_k = ${fmt(V.mu, 2)}` : 'smooth'], ['a_A', fmt(st.aA, 4) + ' m/s² (right +)', true], ['a_B', fmt(st.aB, 4) + ' m/s² (right +)', true],
      ['friction on A', st.rough ? fmt(st.f, 4) + ' N to the left' + (st.slip ? ' (A slips)' : ' (no slip)') : 'none'], ['check: m a_A + M a_B', fmt(V.m * st.aA + V.M * st.aB, 4) + ' N = F']]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4a-6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 720, 330]);
    const V = st.V, S = 220, t = tNow(st, st.tEnd), xB = 0.5 * st.aB * t * t, xA = 0.5 * st.aA * t * t, gy = 280;
    line(ctx, 10, gy, 710, gy, COL.fg, 2); hatch(ctx, 10, gy, 710, gy, 1); txt(ctx, 'smooth floor', 60, gy + 24, small);
    // block B: a base with an upright at its right end, on rollers
    const bx = 120 + xB * S, bw = 1.9 * S, bh = 0.32 * S, by = gy - 12 - bh, ux = bx + bw - 0.12 * S, uy = by - 0.75 * S;
    [bx + 30, bx + bw - 30].forEach(x => wheel(ctx, x, gy - 6, 6, xB / 0.03, 'tire'));
    ctx.save(); ctx.fillStyle = '#c9c4b6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ux, by); ctx.lineTo(ux, uy); ctx.lineTo(bx + bw, uy); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx, by + bh); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'B', bx + bw - 0.06 * S, uy - 16, { font: 'italic bold 16px Georgia, serif' });
    // block A on top, with its pulley on the right face
    const ab = 0.4 * S, ax = bx + 0.25 * S + (xA - xB) * S, ay = by - ab / 2, pr = 0.07 * S, ppx = ax + ab / 2 + pr + 14, ppy = ay - 4;
    block(ctx, ax, ay, ab, ab, 0, 'A', '#e4dfd2');
    line(ctx, ax + ab / 2, ppy, ppx, ppy, COL.fg, 2);
    // cable: lower strand from the pulley to the upright of B, upper strand is the free end pulled by F
    const free = ppx + 0.15 * S + (xA - xB) * S; // the free end moves twice as far as the pulley, relative to B
    cable(ctx, () => { ctx.moveTo(ux, ppy + pr); ctx.lineTo(ppx, ppy + pr); ctx.moveTo(ppx, ppy - pr); ctx.lineTo(free, ppy - pr); });
    pulley(ctx, ppx, ppy, pr);
    arrow(ctx, free, ppy - pr, free + 60, ppy - pr, RED, 3); txt(ctx, 'F', free + 74, ppy - pr - 2, { color: RED });
    if (st.rough && t < st.tEnd){ arrow(ctx, ax, by - 2, ax - 50, by - 2, COL.c2, 2.4); txt(ctx, 'friction on A', ax - 60, by - 22, { font: '12px system-ui', color: COL.c2 }); }
    txt(ctx, st.rough ? 'rough contact between A and B' : 'smooth contact between A and B', 14, 22, { ...small, align: 'left' });
    txt(ctx, `t = ${fmt(t, 3)} s`, 14, 42, { ...small, align: 'left' });
    const pa = [], pb = []; for (let i = 0; i <= 60; i++){ const q = st.tEnd * i / 60; pa.push([q, st.aA * q]); pb.push([q, st.aB * q]); }
    plot($('x4a-6-plot'), { xmin: 0, xmax: st.tEnd, ymin: Math.min(0, st.aB * st.tEnd) * 1.1 - 0.1, ymax: Math.max(st.aA, st.aB, 0) * st.tEnd * 1.1 + 0.1, xlabel: 'time t (s)', ylabel: 'velocity (m/s, right +)',
      series: [{ pts: pa, color: COL.c1, width: 2.4 }, { pts: pb, color: COL.c2, width: 2.4 }], points: [{ x: t, y: st.aA * t, color: COL.c1, r: 5 }, { x: t, y: st.aB * t, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 4.A.7: particle on a smooth quarter-circle rod ---------- */
makeClip({
  id: 'x4a-7', speed: 0.5,
  controls: [
    { key: 'v', label: 'Speed at θ = 53.13°', min: 7, max: 30, step: 0.5, value: 20, unit: 'ft/s', dec: 1 },
    { key: 'W', label: 'Weight W', min: 1, max: 20, step: 0.5, value: 5, unit: 'lb', dec: 1 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ v: 20, W: 5 }) }, { label: 'Slow, 8 ft/s', apply: () => C.set({ v: 8 }) }, { label: 'N = 0 at the instant', apply: () => C.set({ v: +Math.sqrt(GF * 3 * 0.8).toFixed(2) }) }],
  reset(st){
    const V = st.V, R = 3, ts = 53.13 * RAD; st.v02 = V.v * V.v - 2 * GF * R * (1 - Math.sin(ts)); st.th = Math.PI / 2 - 1e-3; st.phase = 0; st.hold = undefined; st.paused = 0;
    const m = V.W / GF; st.N = V.W * Math.sin(ts) - m * V.v * V.v / R; st.vd = GF * Math.cos(ts);
    setStats('x4a-7-stats', [['N (outward from O +)', fmt(st.N, 4) + ' lb' + (st.N < 0 ? ', so the rod pushes P toward O' : ''), true], ['rate of change of speed v̇ = g cos θ', fmt(st.vd, 4) + ' ft/s²', true], ['speed at the top of the rod', fmt(Math.sqrt(Math.max(0, st.v02)), 4) + ' ft/s']]);
  },
  step(st, dt){
    const V = st.V, R = 3, ts = 53.13 * RAD;
    if (st.phase === 2){ hold(st, st.hold ?? st.t, 1.2); if (st.t === 0){ st.th = Math.PI / 2 - 1e-3; st.phase = 0; } return; }
    if (st.paused > 0){ st.paused -= dt; return; }
    const v = Math.sqrt(Math.max(1e-6, st.v02 + 2 * GF * R * (1 - Math.sin(st.th)))), th1 = st.th - v / R * dt;
    if (st.phase === 0 && th1 <= ts){ st.th = ts; st.phase = 1; st.paused = 1.6; return; }
    // P stops when it reaches the floor at the lower end of the rod (bead radius 0.13 ft), so it never sinks into the floor
    const thEnd = Math.asin(0.13 / R); st.th = th1; if (st.th <= thEnd){ st.th = thEnd; st.phase = 2; st.hold = st.t; }
  },
  draw(st){
    const cv = $('x4a-7-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 380]);
    const V = st.V, R = 3, S = 90, ox = 90, oy = 340, m = V.W / GF, th = st.th;
    // supports: wall at the top end, floor at the right end
    line(ctx, ox, oy - R * S - 40, ox, oy - R * S + 30, COL.fg, 2); hatch(ctx, ox, oy - R * S + 30, ox, oy - R * S - 40, -1);
    line(ctx, ox + R * S - 20, oy, ox + R * S + 40, oy, COL.fg, 2); hatch(ctx, ox + R * S - 20, oy, ox + R * S + 40, oy, 1);
    line(ctx, ox, oy, ox + R * S - 20, oy, COL.muted, 1, [4, 4]); line(ctx, ox, oy, ox, oy - R * S + 30, COL.muted, 1, [4, 4]);
    ctx.save(); ctx.strokeStyle = COL.fg; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ox, oy, R * S, -Math.PI / 2, 0); ctx.stroke(); ctx.restore();
    txt(ctx, 'O', ox - 14, oy + 12);
    const px = ox + R * S * Math.cos(th), py = oy - R * S * Math.sin(th);
    line(ctx, ox, oy, px, py, COL.muted, 1, [3, 4]); txt(ctx, 'R', ox + R * S * 0.42 * Math.cos(th) - 12, oy - R * S * 0.42 * Math.sin(th) - 8);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ox, oy, 46, -th, 0); ctx.stroke(); ctx.restore(); txt(ctx, 'θ', ox + 62, oy - 18);
    const v = Math.sqrt(Math.max(0, st.v02 + 2 * GF * R * (1 - Math.sin(th)))), N = V.W * Math.sin(th) - m * v * v / R, k = 4.5;
    // normal force along the radius (outward +), weight, velocity tangent to the rod (clockwise)
    if (Math.abs(N) > 0.05){ const ex = Math.cos(th), ey = -Math.sin(th); arrow(ctx, px, py, px + ex * N * k, py + ey * N * k, COL.c2, 2.8); txt(ctx, 'N', px + ex * N * k - ey * 14, py + ey * N * k + ex * 14, { color: COL.c2 }); }
    arrow(ctx, px, py, px, py + V.W * k, '#c2410c', 2.6); txt(ctx, 'W', px + 14, py + V.W * k + 2, { color: '#c2410c' });
    if (v > 0.1){ const tx = Math.sin(th), ty = Math.cos(th), L = Math.min(110, 16 + v * 3); arrow(ctx, px, py, px + tx * L, py + ty * L, COL.c3, 2.4); txt(ctx, 'v', px + tx * (L + 12), py + ty * (L + 12), { color: COL.c3 }); }
    ctx.save(); ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 0.13 * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'P', px - 22, py + 18, { font: 'italic bold 15px Georgia, serif' });
    txt(ctx, st.phase === 1 && st.paused > 0 ? 'the instant in the problem, θ = 53.13°' : `θ = ${fmt(th / RAD, 3)}°`, 550, 20, { ...small, align: 'right' });
    txt(ctx, `v = ${fmt(v, 3)} ft/s, N = ${fmt(N, 3)} lb`, 550, 40, { ...small, align: 'right' });
    const pts = []; for (let i = 0; i <= 90; i++){ const q = i * RAD, vv = st.v02 + 2 * GF * R * (1 - Math.sin(q)); pts.push([i, V.W * Math.sin(q) - m * Math.max(0, vv) / R]); }
    plot($('x4a-7-plot'), { xmin: 0, xmax: 90, ymin: Math.min(0, ...pts.map(p => p[1])) * 1.1 - 0.5, ymax: Math.max(0, ...pts.map(p => p[1])) * 1.1 + 0.5, xlabel: 'angle θ (degrees)', ylabel: 'N (lb, outward +)',
      series: [{ pts, color: COL.c2, width: 2.4 }], hlines: [{ y: 0, color: COL.axis }], vlines: [{ x: 53.13, color: COL.c4 }], points: [{ x: th / RAD, y: N, color: COL.c2, r: 5 }] });
  }
});

/* ---------- 4.A.8: blocks in perpendicular guides joined by a light rod ---------- */
const A8 = { L: 2.5, mA: 10, mB: 5 };
function a8acc(F, p, pd){ const { L, mA, mB } = A8, c = Math.cos(p), s = Math.sin(p), M = L * L * (mA * c * c + mB * s * s), Mp = 2 * L * L * s * c * (mB - mA);
  return (F * L * s - mA * G0 * L * c - 0.5 * Mp * pd * pd) / M; }
makeClip({
  id: 'x4a-8', speed: 0.25,
  controls: [
    { key: 'F', label: 'Force F on B', min: 0, max: 150, step: 1, value: 50, unit: 'N', dec: 1 },
    { key: 'vA', label: 'Speed of A at the instant (downward)', min: 0, max: 8, step: 0.1, value: 4, unit: 'm/s', dec: 2 }
  ],
  presets: C => [{ label: 'Book data', apply: () => C.set({ F: 50, vA: 4 }) }, { label: 'No force, F = 0', apply: () => C.set({ F: 0 }) }, { label: 'Large force, F = 120 N', apply: () => C.set({ F: 120 }) }],
  reset(st){
    const V = st.V, { L, mA, mB } = A8, p0 = Math.asin(1.5 / L), pd0 = -V.vA / (L * Math.cos(p0));
    // integrate backward 0.35 s and forward until A reaches the bottom or 1.5 s
    const f = (s) => [s[1], a8acc(V.F, s[0], s[1])];
    const run = (dir) => { const out = []; let s = [p0, pd0], t = 0; const h = 0.0005 * dir;
      for (let i = 0; i < 4000; i++){ const k1 = f(s), k2 = f([s[0] + h / 2 * k1[0], s[1] + h / 2 * k1[1]]), k3 = f([s[0] + h / 2 * k2[0], s[1] + h / 2 * k2[1]]), k4 = f([s[0] + h * k3[0], s[1] + h * k3[1]]);
        s = [s[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; t += h;
        if (i % 10 === 9) out.push([t, s[0], s[1]]); if (s[0] < 0.03 || s[0] > Math.PI / 2 - 0.03 || Math.abs(t) > (dir < 0 ? 0.35 : 1.5)) break; } return out; };
    const back = run(-1).reverse(), fwd = run(1); st.tr = back.concat([[0, p0, pd0]], fwd); st.t0 = -st.tr[0][0]; st.tEnd = st.tr[st.tr.length - 1][0] + st.t0 + 1.2; // 1.2 s pause at the instant
    st.tr.forEach(r => { const [, p, pd] = r, pdd = a8acc(V.F, p, pd), xBdd = L * (Math.cos(p) * pd * pd + Math.sin(p) * pdd); r.push((mB * xBdd - V.F) / Math.cos(p), pdd); });
    const i0 = back.length, r0 = st.tr[i0], sAdd = L * (Math.cos(p0) * r0[4] - Math.sin(p0) * pd0 * pd0), xBdd = L * (Math.cos(p0) * pd0 * pd0 + Math.sin(p0) * r0[4]);
    st.hold = undefined; st.paused = false;
    setStats('x4a-8-stats', [['acceleration of A', fmt(sAdd, 4) + ' m/s² (up +)', true], ['acceleration of B', fmt(xBdd, 4) + ' m/s² (right +)', true], ['rod force', `${fmt(Math.abs(r0[3]), 4)} N ${r0[3] < 0 ? '(compression)' : '(tension)'}`, true], ['speed of B at the instant', fmt(1.5 * V.vA / 2, 4) + ' m/s to the left']]);
  },
  step(st){ hold(st, st.tEnd, 1.2); },
  draw(st){
    const cv = $('x4a-8-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 600, 400]);
    const V = st.V, { L } = A8, S = 150, cx = 480, cy = 350, tau = tNow(st, st.tEnd);
    // the motion pauses for 1.2 s at the instant in the problem (tt = 0)
    const tt = tau < st.t0 ? tau - st.t0 : tau < st.t0 + 1.2 ? 0 : tau - st.t0 - 1.2;
    let rr = st.tr[0]; for (const r of st.tr){ if (r[0] <= tt) rr = r; else break; }
    const at = tau >= st.t0 && tau < st.t0 + 1.2;
    const p = rr[1], sA = L * Math.sin(p), sB = L * Math.cos(p);
    // guides: vertical wall guide for A, horizontal floor guide for B
    line(ctx, cx + 22, 20, cx + 22, cy + 10, COL.fg, 2); hatch(ctx, cx + 22, cy + 10, cx + 22, 20, 1);
    line(ctx, 40, cy + 12, cx - 20, cy + 12, COL.fg, 2); hatch(ctx, 40, cy + 12, cx - 20, cy + 12, 1);
    line(ctx, cx, 20, cx, cy + 40, COL.muted, 1, [4, 4]); line(ctx, 20, cy, cx + 40, cy, COL.muted, 1, [4, 4]);
    const Ax = cx, Ay = cy - sA * S, Bx = cx - sB * S, By = cy;
    line(ctx, Bx, By, Ax, Ay, COL.fg, 3.4);
    block(ctx, Ax, Ay, 34, 46, 0, '', '#8a8478'); block(ctx, Bx, By, 50, 22, 0, '', '#8a8478');
    pinDot(ctx, Ax, Ay); pinDot(ctx, Bx, By);
    txt(ctx, 'A', Ax - 34, Ay - 22, { font: 'italic bold 16px Georgia, serif' }); txt(ctx, 'B', Bx - 6, By - 30, { font: 'italic bold 16px Georgia, serif' });
    txt(ctx, 'L', (Ax + Bx) / 2 - 10, (Ay + By) / 2 - 14);
    arrow(ctx, Bx - 100, By, Bx - 26, By, RED, 3); txt(ctx, 'F', Bx - 112, By - 2, { color: RED });
    // rod force on A and on B (compression pushes them apart)
    const T = rr[3], ux = (Ax - Bx) / (L * S), uy = (Ay - By) / (L * S), k = 1.6;
    if (Math.abs(T) > 0.5){ arrow(ctx, Ax, Ay, Ax - ux * T * k, Ay - uy * T * k, COL.c2, 2.4); arrow(ctx, Bx, By, Bx + ux * T * k, By + uy * T * k, COL.c2, 2.4); }
    txt(ctx, at ? 'the instant in the problem, s_A = 1.5 m' : `s_A = ${fmt(sA, 3)} m`, 20, 20, { ...small, align: 'left' });
    txt(ctx, `rod force ${fmt(Math.abs(T), 3)} N ${T < 0 ? 'compression' : 'tension'}`, 20, 40, { font: '12px system-ui', color: COL.c2, align: 'left' });
    const pts = st.tr.map(r => [r[0] + st.t0, r[3]]);
    plot($('x4a-8-plot'), { xmin: 0, xmax: st.tEnd - 1.2, ymin: Math.min(0, ...pts.map(q => q[1])) * 1.1 - 2, ymax: Math.max(0, ...pts.map(q => q[1])) * 1.1 + 2, xlabel: 'time t (s)', ylabel: 'rod force (N, tension +)',
      series: [{ pts, color: COL.c2, width: 2.4 }], hlines: [{ y: 0, color: COL.axis }], vlines: [{ x: st.t0, color: COL.c4 }], points: [{ x: tt + st.t0, y: T, color: COL.c2, r: 5 }] });
  }
});

subLabels();
})();
