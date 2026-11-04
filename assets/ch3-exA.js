/* =========================================================
   Chapter 3, Section A examples: 2D moving reference frames (3.A.1 to 3.A.7)
   Each clip shows the moving frame (its x and y axes turn with the body it is attached to)
   and the velocity or acceleration of the point as a chain of separate terms:
     v_P = v_O + ω × r + v_rel
     a_P = a_O + α × r − ω² r + 2 ω × v_rel + a_rel
   ========================================================= */
(function(){

/* ---------- small vector helpers (2D, world coordinates: x right, y up) ---------- */
const kx = v => [-v[1], v[0]];                              // k × v
const add = (...vs) => vs.reduce((s, v) => [s[0] + v[0], s[1] + v[1]], [0, 0]);
const mul = (a, s) => [a[0] * s, a[1] * s], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const nrm = a => Math.hypot(a[0], a[1]), dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const rotv = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
// solve x c1 + y c2 = r for (x, y)
function solve2(c1, c2, r){ const D = c1[0] * c2[1] - c2[0] * c1[1]; return [(r[0] * c2[1] - c2[0] * r[1]) / D, (c1[0] * r[1] - r[0] * c1[1]) / D]; }
const v2s = (v, d = 3, u = 'm/s') => `(${fmt(Math.abs(v[0]) < 1e-9 ? 0 : v[0], d)}, ${fmt(Math.abs(v[1]) < 1e-9 ? 0 : v[1], d)}) ${u}`;
const TC = () => ({ base: COL.c5, al: COL.c4, cen: COL.c3, cor: RED, rel: COL.c2, tot: COL.c1, w: COL.c3 });
const SERIF = 'italic 14px Georgia, serif';

// the moving frame: two axes that turn with the body. p = screen point, ang = frame angle (world, ccw +)
function frameAxes(ctx, p, ang, len, labs = ['x', 'y'], side = 0){
  const col = COL.c4, ex = [Math.cos(ang), -Math.sin(ang)], ey = [-Math.sin(ang), -Math.cos(ang)];
  ctx.save(); ctx.globalAlpha = 0.85;
  arrow(ctx, p[0], p[1], p[0] + ex[0] * len, p[1] + ex[1] * len, col, 1.8);
  arrow(ctx, p[0], p[1], p[0] + ey[0] * len, p[1] + ey[1] * len, col, 1.8);
  ctx.restore();
  txt(ctx, labs[0], p[0] + ex[0] * (len + 11) - ey[0] * side, p[1] + ex[1] * (len + 11) - ey[1] * side, { color: col, font: SERIF });
  txt(ctx, labs[1], p[0] + ey[0] * (len + 11) + ex[0] * side, p[1] + ey[1] * (len + 11) + ex[1] * side, { color: col, font: SERIF });
}
// the two frame axes as line segments (used to keep labels off them)
const fsegs = (p, ang, len) => [[p[0], p[1], p[0] + Math.cos(ang) * (len + 14), p[1] - Math.sin(ang) * (len + 14)], [p[0], p[1], p[0] - Math.sin(ang) * (len + 14), p[1] - Math.cos(ang) * (len + 14)]];
// a thick bar (center line ± half width) and a circle, as obstacle segments for label placement
const thick = (x1, y1, x2, y2, w) => { const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L * w / 2, ny = (x2 - x1) / L * w / 2;
  return [[x1, y1, x2, y2], [x1 + nx, y1 + ny, x2 + nx, y2 + ny], [x1 - nx, y1 - ny, x2 - nx, y2 - ny]]; };
const rim = (c, R, n = 36) => Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n, b = 2 * Math.PI * (i + 1) / n; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), c[0] + R * Math.cos(b), c[1] + R * Math.sin(b)]; });
// a pin mounted on a back plate (wall) behind the moving parts: a bolted bearing boss. Links pinned here can turn all the way around.
function backPin(ctx, x, y){
  ctx.save(); ctx.fillStyle = '#cfc9bb'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(x - 13, y - 13, 26, 26); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.fg; [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.8, 0, 2 * Math.PI); ctx.fill(); });
  ctx.restore(); pinDot(ctx, x, y);
}
// fixed reference axes X, Y in a corner
function fixedAxes(ctx, x, y, len = 34){
  arrow(ctx, x, y, x + len, y, COL.muted, 1.5); arrow(ctx, x, y, x, y - len, COL.muted, 1.5);
  txt(ctx, 'X', x + len + 10, y, { color: COL.muted, font: 'italic 13px Georgia, serif' });
  txt(ctx, 'Y', x, y - len - 10, { color: COL.muted, font: 'italic 13px Georgia, serif' });
}
// a chain of vectors placed tip to tail from point p (screen), then the sum from p in bold.
// terms: [[vector (world units), color, label]]; sc = px per unit; cap = longest arrow drawn (px)
function chain(ctx, p, terms, sc, totLabel, cap = 220, obs = [], ptLab = ''){
  let q = [p[0], p[1]], tot = [0, 0];
  terms.forEach(([v]) => { tot = add(tot, v); });
  const big = Math.max(nrm(tot), ...terms.map(t => nrm(t[0]))) * sc, k = big > cap ? cap / big : 1;
  const segs = [], labs = [];
  terms.forEach(([v, col, lab]) => {
    const d = [v[0] * sc * k, -v[1] * sc * k], L = Math.hypot(d[0], d[1]);
    if (L < 2.5) return;
    segs.push([q[0], q[1], q[0] + d[0], q[1] + d[1], col, L >= 16 ? lab : '', 2.4]);
    q = [q[0] + d[0], q[1] + d[1]];
  });
  const D = [tot[0] * sc * k, -tot[1] * sc * k], LD = Math.hypot(D[0], D[1]);
  if (LD > 2.5) segs.push([p[0], p[1], p[0] + D[0], p[1] + D[1], COL.c1, totLabel, 3.4]);
  segs.forEach(([x1, y1, x2, y2, col, , wd]) => arrow(ctx, x1, y1, x2, y2, col, wd));
  // labels: the first candidate spot whose box clears every arrow of the chain and the labels already placed
  // number of obstacle points inside a box (0 = clear)
  const hits = (b) => { let n = 0; segs.concat(obs).forEach(([x1, y1, x2, y2]) => { for (let i = 0; i <= 24; i++){ const x = x1 + (x2 - x1) * i / 24, y = y1 + (y2 - y1) * i / 24; if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) n++; } });
    labs.forEach(c => { if (!(b[2] < c[0] || b[0] > c[2] || b[3] < c[1] || b[1] > c[3])) n += 50; }); return n; };
  if (ptLab){   // the point's own label: the clearest of eight spots around it
    let best = null, bestN = Infinity;
    for (const r of [20, 28]) for (let i = 0; i < 8; i++){ const a = -Math.PI / 2 + i * Math.PI / 4, cx = p[0] + r * Math.cos(a), cy = p[1] + r * Math.sin(a), b = [cx - 8, cy - 9, cx + 8, cy + 9], n = hits(b); if (n < bestN){ bestN = n; best = [cx, cy, b]; } }
    labs.push(best[2]); txt(ctx, ptLab, best[0], best[1], { font: 'italic 15px Georgia, serif' });
  }
  segs.forEach(([x1, y1, x2, y2, col, lab, wd]) => {
    if (!lab) return;
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, w = 7.2 * lab.replace('_', '').length + 6, h = 18;
    let best = null, bestN = Infinity;
    for (const t of [0.5, 0.35, 0.65, 0.2, 0.8, 1.0]){ for (const dd of [0, 8, 16, 26, 38]){ for (const sg of [1, -1]){
      const off = 6 + dd + 0.5 * (Math.abs(nx) * w + Math.abs(ny) * h), ext = t === 1.0 ? 14 : 0;
      const cx = x1 + (x2 - x1) * t + sg * nx * off + ux * ext, cy = y1 + (y2 - y1) * t + sg * ny * off + uy * ext;
      const b = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], n = hits(b);
      if (n < bestN){ bestN = n; best = [cx, cy, b]; } if (!n) break; } if (!bestN) break; } if (!bestN) break; }
    labs.push(best[2]);
    txt(ctx, lab, best[0], best[1], { color: col, font: wd > 3 ? 'bold 14px Georgia, serif' : '13px Georgia, serif' });
  });
  return k;
}
// curved arrow for an angular velocity around screen point p. ccw = counterclockwise as seen on the screen.
// mid = canvas angle (degrees) of the middle of the arc; the label sits outside the arc there.
function spin(ctx, p, r, ccw, col, lab, mid = -90){
  const m = mid * RAD, h = 105 * RAD, a0 = ccw ? m + h : m - h, a1 = ccw ? m - h : m + h;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], r, a0, a1, ccw); ctx.stroke();
  const hx = p[0] + r * Math.cos(a1), hy = p[1] + r * Math.sin(a1), t = ccw ? [Math.sin(a1), -Math.cos(a1)] : [-Math.sin(a1), Math.cos(a1)];
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(hx + t[0] * 8, hy + t[1] * 8); ctx.lineTo(hx - t[1] * 4.5, hy + t[0] * 4.5); ctx.lineTo(hx + t[1] * 4.5, hy - t[0] * 4.5); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (lab) txt(ctx, lab, p[0] + (r + 13) * Math.cos(m), p[1] + (r + 13) * Math.sin(m), { color: col, font: SERIF });
}
// y limits that contain every series, with a margin
function lims(...arrs){ let lo = Infinity, hi = -Infinity; arrs.forEach(a => a.forEach(q => { if (isFinite(q[1])){ lo = Math.min(lo, q[1]); hi = Math.max(hi, q[1]); } })); const m = 0.08 * (hi - lo || 1); return [lo - m, hi + m]; }
// ground strip with hatching and scrolling ticks (camera follows a moving body). xw = world x of the screen point px0
function ground(ctx, y, x0, x1, px0, xw, S, every, unit){
  line(ctx, x0, y, x1, y, COL.fg, 2); hatch(ctx, x0, y, x1, y, 1);
  const a = xw + (x0 - px0) / S, b = xw + (x1 - px0) / S;
  for (let X = Math.ceil(a / every) * every; X <= b; X += every){ const sx = px0 + (X - xw) * S; line(ctx, sx, y, sx, y - 7, COL.muted, 1.4); }
}

/* ---------- play / freeze and velocity / acceleration chips ---------- */
const VM = [['▶ Play the motion', 'play'], ['Freeze at the instant in the problem', 'freeze']];
const SH = [['Show the velocity terms', 'v'], ['Show the acceleration terms', 'a']];
function chips(id){
  return (C, st) => [...VM.map(([label, v]) => ({ label, apply: () => { st.mode = v; mark(id, st); } })),
                     ...SH.map(([label, v]) => ({ label, apply: () => { st.show = v; mark(id, st); } }))];
}
function mark(id, st){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', i < 2 ? VM[i][1] === st.mode : SH[i - 2][1] === st.show));
}
// the time used for drawing: loops over [a, b] while playing, or sits at the instant t0
const tau = (st, a, b, t0 = 0) => st.mode === 'freeze' ? t0 : a + (st.t % (b - a));
function setupChips(id, show = 'a'){ return st => { st.mode = 'play'; st.show = show; setTimeout(() => mark(id, st), 0); }; }

// obstacles for 3.A.1: frame axes, the slot and the rim of the disk
function ob1(K, O, R, S){
  const half = Math.sqrt(0.36 - 0.04) - 0.03, a = rotv([-half, 0.2], K.ang), b = rotv([half, 0.2], K.ang);
  return fsegs(O, K.ang, 62).concat(thick(O[0] + a[0] * S, O[1] - a[1] * S, O[0] + b[0] * S, O[1] - b[1] * S, 16), rim(O, R));
}
/* =========================================================
   3.A.1  Particle sliding in a straight slot of a rolling disk
   ========================================================= */
{
  const r = 0.6, h = 0.2, T0 = -0.3, T1 = 0.15;   // x_P = 0.2 + 2t stays within ±0.4 m, well inside the 0.5 m slot ends
  function kin(tq){
    const vO = 5 - 2 * tq, xO = 5 * tq - tq * tq, th = xO / r, ang = -th, w = -vO / r, al = 2 / r, xp = 0.2 + 2 * tq;
    const rP = rotv([xp, h], ang), vrel = rotv([2, 0], ang);
    const V = [[[vO, 0], 'base', 'v_O'], [mul(kx(rP), w), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const A = [[[-2, 0], 'base', 'a_O'], [mul(kx(rP), al), 'al', 'α×r'], [mul(rP, -w * w), 'cen', '−ω²r'], [mul(kx(vrel), 2 * w), 'cor', '2ω×v_rel'], [[0, 0], 'rel', 'a_rel']];
    return { vO, xO, th, ang, w, al, xp, rP, V, A, v: add(...V.map(t => t[0])), a: add(...A.map(t => t[0])) };
  }
  makeClip({
    id: 'x3a-1', speed: 0.25, presets: chips('x3a-1'), setup: setupChips('x3a-1'),
    draw(st){
      const cv = $('x3a-1-anim'); const { ctx, w, h: hh } = fit(cv); ctx.clearRect(0, 0, w, hh);
      fitView(ctx, w, hh, [0, 0, 720, 420]);
      const tq = tau(st, T0, T1), K = kin(tq), S = 230, O = [330, 200], R = r * S, gy = O[1] + R, c = TC(); st.K = K;
      ground(ctx, gy, 10, 710, O[0], K.xO, S, 0.25);
      txt(ctx, 'no slip', O[0] - 150, gy + 22, { font: 'italic 12px Georgia, serif', color: COL.muted });
      fixedAxes(ctx, 40, 60);
      // disk, slot and particle, all turning with the disk (canvas rotation is clockwise +)
      ctx.save(); ctx.translate(O[0], O[1]); ctx.rotate(K.th);
      ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      const half = 0.5;
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, 2 * Math.PI); ctx.clip();   // the slot is cut in the disk: it never shows outside the rim
      ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.rect(-half * S, -h * S - 7, 2 * half * S, 14); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(K.xp * S, -h * S, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
      const P = [O[0] + K.rP[0] * S, O[1] - K.rP[1] * S];
      frameAxes(ctx, O, K.ang, 62);
      pinDot(ctx, O[0], O[1]); txt(ctx, 'O', O[0] - 20, O[1] + 20, { font: SERIF });
      spin(ctx, O, 30, false, c.w, 'ω', 160);
      if (st.show === 'v') chain(ctx, P, K.V.map(([v, k, l]) => [v, c[k], l]), 22, 'v_P', 220, ob1(K, O, R, S), 'P');
      else chain(ctx, P, K.A.map(([v, k, l]) => [v, c[k], l]), 3.4, 'a_P', 190, ob1(K, O, R, S), 'P');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (t = 0)' : `t = ${fmt(tq, 2)} s`, 710, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-1-stats', () => [['v_O', fmt(K.vO, 3) + ' m/s'], ['ω (clockwise)', fmt(-K.w, 4) + ' rad/s'], ['x_P (in the disk frame)', fmt(K.xp, 3) + ' m'],
        ['v_P', v2s(K.v)], ['a_P', v2s(K.a, 4, 'm/s²'), true]]);
      const ax = [], ay = []; for (let i = 0; i <= 80; i++){ const q = T0 + (T1 - T0) * i / 80, k = kin(q); ax.push([q, k.a[0]]); ay.push([q, k.a[1]]); }
      const [y0, y1] = lims(ax, ay);
      plot($('x3a-1-plot'), { xmin: T0, xmax: T1, ymin: y0, ymax: y1, xlabel: 'time t (s)', ylabel: 'a_P components (m/s²)',
        vlines: [{ x: 0, label: 'instant' }], series: [{ pts: ax, color: COL.c1, width: 2.2 }, { pts: ay, color: COL.c2, width: 2.2 }],
        points: [{ x: tq, y: K.a[0], color: COL.c1, r: 5 }, { x: tq, y: K.a[1], color: COL.c2, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.2  Particle in a curved slot of a rolling disk
   ========================================================= */
{
  const R = 0.75, T1 = Math.sqrt(4 + 14 * R * Math.PI / 2) / 7 - 2 / 7; // time for P to reach the top of the slot
  function kin(tq){
    const vO = 3 + 5 * tq, xO = 3 * tq + 2.5 * tq * tq, th = xO / R, ang = -th, w = -vO / R, al = -5 / R;
    const u = 2 + 7 * tq, s = 2 * tq + 3.5 * tq * tq, ph = -Math.PI / 2 + s / R;                 // angle of P about the slot center C
    const Cf = [-R, R], pf = add(Cf, [R * Math.cos(ph), R * Math.sin(ph)]), tf = [-Math.sin(ph), Math.cos(ph)], nf = [-Math.cos(ph), -Math.sin(ph)];
    const rP = rotv(pf, ang), vrel = rotv(mul(tf, u), ang), arel = rotv(add(mul(tf, 7), mul(nf, u * u / R)), ang);
    const V = [[[vO, 0], 'base', 'v_O'], [mul(kx(rP), w), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const A = [[[5, 0], 'base', 'a_O'], [mul(kx(rP), al), 'al', 'α×r'], [mul(rP, -w * w), 'cen', '−ω²r'], [mul(kx(vrel), 2 * w), 'cor', '2ω×v_rel'], [arel, 'rel', 'a_rel']];
    return { vO, xO, th, ang, w, u, ph, pf, rP, V, A, v: add(...V.map(t => t[0])), a: add(...A.map(t => t[0])) };
  }
  makeClip({
    id: 'x3a-2', speed: 0.1, presets: chips('x3a-2'), setup: setupChips('x3a-2'),
    draw(st){
      const cv = $('x3a-2-anim'); const { ctx, w, h: hh } = fit(cv); ctx.clearRect(0, 0, w, hh);
      fitView(ctx, w, hh, [0, 0, 720, 420]);
      const tq = tau(st, 0, T1 + 0.25), tc = Math.min(tq, T1), K = kin(tc), S = 150, O = [380, 240], RR = R * S, gy = O[1] + RR, c = TC(); st.K = K;
      ground(ctx, gy, 10, 710, O[0], K.xO, S, 0.25);
      txt(ctx, 'no slip', O[0] - 170, gy + 22, { font: 'italic 12px Georgia, serif', color: COL.muted });
      fixedAxes(ctx, 40, 60);
      ctx.save(); ctx.translate(O[0], O[1]); ctx.rotate(K.th);
      ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, RR, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      // the curved slot: a quarter circle of radius R about C = (−R, R) in the disk frame
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, RR - 1, 0, 2 * Math.PI); ctx.clip();   // the slot is cut in the disk: clip it to the rim
      ctx.lineCap = 'butt'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(-RR, -RR, RR, Math.PI / 2, 0, true); ctx.stroke();
      ctx.strokeStyle = COL.card; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(-RR, -RR, RR, Math.PI / 2 + 0.05, -0.05, true); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(K.pf[0] * S, -K.pf[1] * S, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.restore();
      const P = [O[0] + K.rP[0] * S, O[1] - K.rP[1] * S];
      frameAxes(ctx, O, K.ang, 62);
      pinDot(ctx, O[0], O[1]); txt(ctx, 'O', O[0] - 20, O[1] - 18, { font: SERIF });
      spin(ctx, O, 26, false, c.w, 'ω', 40);
      // keep the labels off the frame axes, the slot and the rim of the disk
      const ob = fsegs(O, K.ang, 62), sp = q => { const w = rotv(q, K.ang); return [O[0] + w[0] * S, O[1] - w[1] * S]; };
      for (let i = 0; i < 12; i++){ const a1 = -Math.PI / 2 + Math.PI / 2 * i / 12, a2 = a1 + Math.PI / 24, p1 = sp([-R + R * Math.cos(a1), R + R * Math.sin(a1)]), p2 = sp([-R + R * Math.cos(a2), R + R * Math.sin(a2)]); ob.push([...p1, ...p2]); }
      for (let i = 0; i < 32; i++){ const a1 = 2 * Math.PI * i / 32, a2 = a1 + 2 * Math.PI / 32; ob.push([O[0] + RR * Math.cos(a1), O[1] + RR * Math.sin(a1), O[0] + RR * Math.cos(a2), O[1] + RR * Math.sin(a2)]); }
      if (st.show === 'v') chain(ctx, P, K.V.map(([v, k, l]) => [v, c[k], l]), 26, 'v_P', 220, ob, 'P');
      else chain(ctx, P, K.A.map(([v, k, l]) => [v, c[k], l]), 2.6, 'a_P', 190, ob, 'P');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (t = 0)' : `t = ${fmt(tc, 2)} s`, 710, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-2-stats', () => [['v_O', fmt(K.vO, 3) + ' m/s'], ['ω (clockwise)', fmt(-K.w, 4) + ' rad/s'], ['u (P relative to the disk)', fmt(K.u, 3) + ' m/s'],
        ['v_P', v2s(K.v)], ['a_P', v2s(K.a, 4, 'm/s²'), true]]);
      const ax = [], ay = []; for (let i = 0; i <= 80; i++){ const q = T1 * i / 80, k = kin(q); ax.push([q, k.a[0]]); ay.push([q, k.a[1]]); }
      const [y0, y1] = lims(ax, ay);
      plot($('x3a-2-plot'), { xmin: 0, xmax: T1, ymin: y0, ymax: y1, xlabel: 'time t (s) after the instant', ylabel: 'a_P components (m/s²)',
        series: [{ pts: ax, color: COL.c1, width: 2.2 }, { pts: ay, color: COL.c2, width: 2.2 }],
        points: [{ x: tc, y: K.a[0], color: COL.c1, r: 5 }, { x: tc, y: K.a[1], color: COL.c2, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.3  Fire-truck ladder: raised and extended while the truck drives
   ========================================================= */
{
  // The window starts at t = -1.2 s, where θ = 30° - 0.3 rad/s × 1.2 s = 9.4°. At earlier times the constant-rate motion
  // would put the ladder below the horizontal, through the cab and the bed, which a real ladder cannot do.
  const T0 = -1.2, T1 = 3, wd = 0.3, bd = 2, vT = 50;
  function kin(tq){
    const th = 30 * RAD + wd * tq, b = 25 + bd * tq, er = [Math.cos(th), Math.sin(th)], et = [-Math.sin(th), Math.cos(th)];
    const rP = mul(er, b), vrel = mul(er, bd);
    const V = [[[vT, 0], 'base', 'v_O'], [mul(kx(rP), wd), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const A = [[[0, 0], 'base', 'a_O'], [[0, 0], 'al', 'α×r'], [mul(rP, -wd * wd), 'cen', '−ω²r'], [mul(kx(vrel), 2 * wd), 'cor', '2ω×v_rel'], [[0, 0], 'rel', 'a_rel']];
    return { th, b, rP, xT: vT * tq, V, A, v: add(...V.map(t => t[0])), a: add(...A.map(t => t[0])) };
  }
  makeClip({
    id: 'x3a-3', speed: 0.5, presets: chips('x3a-3'), setup: setupChips('x3a-3'),
    draw(st){
      const cv = $('x3a-3-anim'); const { ctx, w, h: hh } = fit(cv); ctx.clearRect(0, 0, w, hh);
      fitView(ctx, w, hh, [0, 0, 720, 430]);
      const tq = tau(st, T0, T1), K = kin(tq), S = 8, gy = 400, O = [170, gy - 10.5 * S], c = TC(); st.K = K;
      ground(ctx, gy, 10, 710, O[0], K.xT, S, 10);
      fixedAxes(ctx, 40, 60);
      // truck body (moving right): O is the turntable pivot at the rear of the bed
      const X = x => O[0] + x * S, Y = y => gy - y * S;
      ctx.save(); ctx.fillStyle = '#d9473a'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(X(-3), Y(9), 25 * S, 5.7 * S); ctx.fill(); ctx.stroke();             // bed (bottom at 3.3 ft, clear of the 3.2 ft wheel tops)
      ctx.beginPath(); ctx.moveTo(X(22), Y(3.3)); ctx.lineTo(X(22), Y(12)); ctx.lineTo(X(28), Y(12)); ctx.lineTo(X(30), Y(8)); ctx.lineTo(X(30), Y(3.3)); ctx.closePath(); ctx.fill(); ctx.stroke(); // cab
      ctx.fillStyle = '#cfe0ef'; ctx.beginPath(); ctx.rect(X(23.2), Y(11.2), 4 * S, 2.6 * S); ctx.fill(); ctx.stroke();
      // ladder rest on the bed behind the cab: the stowed ladder lies on it; here the ladder has already lifted off it
      ctx.fillStyle = '#8a8478'; ctx.beginPath(); ctx.rect(X(16.6), Y(11.7), 0.8 * S, 2.7 * S); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(X(16.0), Y(12.0), 2 * S, 0.3 * S); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e4dfd2'; ctx.beginPath(); ctx.moveTo(X(-1.5), Y(9)); ctx.lineTo(X(-0.6), Y(10.5)); ctx.lineTo(X(0.6), Y(10.5)); ctx.lineTo(X(1.5), Y(9)); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      [1, 25].forEach(x => wheel(ctx, X(x), Y(1.6), 1.6 * S, K.xT / 1.6, 'disk', '#6b6f78'));
      // ladder: a base section from O and a fly section that slides out to P
      const e = [Math.cos(K.th), -Math.sin(K.th)], n = [-e[1], e[0]], L0 = 17, Pp = [O[0] + e[0] * K.b * S, O[1] + e[1] * K.b * S];
      const rail = (a, b, off, col, wdt) => line(ctx, O[0] + e[0] * a * S + n[0] * off, O[1] + e[1] * a * S + n[1] * off, O[0] + e[0] * b * S + n[0] * off, O[1] + e[1] * b * S + n[1] * off, col, wdt);
      [-5, 5].forEach(off => rail(0, L0, off, '#8a8478', 3.2));
      for (let s = 1; s < L0; s += 1.4) line(ctx, O[0] + e[0] * s * S + n[0] * 5, O[1] + e[1] * s * S + n[1] * 5, O[0] + e[0] * s * S - n[0] * 5, O[1] + e[1] * s * S - n[1] * 5, '#8a8478', 1.4);
      [-3, 3].forEach(off => rail(K.b - 15, K.b, off, '#c9a46a', 3));
      for (let s = K.b - 14.5; s < K.b; s += 1.4) line(ctx, O[0] + e[0] * s * S + n[0] * 3, O[1] + e[1] * s * S + n[1] * 3, O[0] + e[0] * s * S - n[0] * 3, O[1] + e[1] * s * S - n[1] * 3, '#c9a46a', 1.2);
      pinDot(ctx, O[0], O[1]); txt(ctx, 'O', O[0] - 16, O[1] - 4, { font: SERIF });
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Pp[0], Pp[1], 5, 0, 2 * Math.PI); ctx.fill();
      frameAxes(ctx, O, K.th, 52);
      // the angle θ from the horizontal
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(O[0], O[1], 30, -K.th, 0); ctx.stroke(); ctx.restore();
      line(ctx, O[0], O[1], O[0] + 44, O[1], COL.muted, 1, [4, 3]);
      txt(ctx, 'θ', O[0] + 40, O[1] - 12, { font: 'italic 13px Georgia, serif', color: COL.muted });
      const ob = thick(O[0], O[1], Pp[0], Pp[1], 14).concat(fsegs(O, K.th, 52));
      if (st.show === 'v') chain(ctx, Pp, K.V.map(([v, k, l]) => [v, c[k], l]), 3, 'v_P', 220, ob, 'P');
      else chain(ctx, Pp, K.A.map(([v, k, l]) => [v, c[k], l]), 42, 'a_P', 160, ob, 'P');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (t = 0)' : `t = ${fmt(tq, 2)} s`, 710, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-3-stats', () => [['θ', fmt(K.th / RAD, 3) + '°'], ['b', fmt(K.b, 3) + ' ft'], ['v_P', v2s(K.v, 3, 'ft/s')], ['a_P', v2s(K.a, 4, 'ft/s²'), true], ['|a_P|', fmt(nrm(K.a), 4) + ' ft/s²']]);
      const ax = [], ay = []; for (let i = 0; i <= 80; i++){ const q = T0 + (T1 - T0) * i / 80, k = kin(q); ax.push([q, k.a[0]]); ay.push([q, k.a[1]]); }
      const [y0, y1] = lims(ax, ay);
      plot($('x3a-3-plot'), { xmin: T0, xmax: T1, ymin: y0, ymax: y1, xlabel: 'time t (s)', ylabel: 'a_P components (ft/s²)',
        vlines: [{ x: 0, label: 'instant' }], series: [{ pts: ax, color: COL.c1, width: 2.2 }, { pts: ay, color: COL.c2, width: 2.2 }],
        points: [{ x: tq, y: K.a[0], color: COL.c1, r: 5 }, { x: tq, y: K.a[1], color: COL.c2, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.4  Pin in a slot of a spinning disk, held by a hanging link AP
   Position: P lies on the slot line and on the circle of radius L about A. Solved at every disk angle.
   ========================================================= */
{
  const w = 8, r = 0.2, L = 0.3, th = Math.atan2(3, 4), Rd = 0.33, A = [r, L], PH0 = -2 * RAD, PH1 = 120 * RAD;
  let sPrev = 0;
  function kin(ph, sGuess){
    const Q = rotv([r, 0], ph), e = rotv([Math.cos(th), Math.sin(th)], ph), d = sub(Q, A), B = dot(d, e), D = B * B - (dot(d, d) - L * L);
    if (D < 0) return null;
    const r1 = -B + Math.sqrt(D), r2 = -B - Math.sqrt(D), s = Math.abs(r1 - sGuess) < Math.abs(r2 - sGuess) ? r1 : r2;
    const P = add(Q, mul(e, s)), pa = sub(P, A);
    const [u, wap] = solve2(e, mul(kx(pa), -1), mul(kx(P), -w));
    const vrel = mul(e, u), rhs = add(mul(P, w * w), mul(kx(vrel), -2 * w), mul(pa, -wap * wap));
    const [ud, alap] = solve2(e, mul(kx(pa), -1), rhs);
    const V = [[[0, 0], 'base', 'v_O'], [mul(kx(P), w), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const Ac = [[[0, 0], 'base', 'a_O'], [[0, 0], 'al', 'α×r'], [mul(P, -w * w), 'cen', '−ω²r'], [mul(kx(vrel), 2 * w), 'cor', '2ω×v_rel'], [mul(e, ud), 'rel', 'a_rel']];
    return { ph, s, P, e, u, ud, wap, alap, V, A: Ac, v: add(...V.map(t => t[0])), a: add(...Ac.map(t => t[0])) };
  }
  // precompute along the motion (continuous branch from the instant)
  const TAB = []; { let s = 0; for (let i = 0; i <= 200; i++){ const ph = PH0 + (PH1 - PH0) * i / 200; const k = kin(ph, s); if (k){ TAB.push(k); s = k.s; } } }
  makeClip({
    id: 'x3a-4', speed: 0.1, presets: chips('x3a-4'), setup: setupChips('x3a-4'),
    draw(st){
      const cv = $('x3a-4-anim'); const { ctx, w: W, h: hh } = fit(cv); ctx.clearRect(0, 0, W, hh);
      fitView(ctx, W, hh, [0, 0, 640, 520]);
      const tq = tau(st, PH0 / w, PH1 / w), ph = tq * w;
      let K = TAB[0]; for (const k of TAB){ if (k.ph <= ph) K = k; }
      K = kin(ph, K.s) || K; st.K = K;
      const S = 600, O = [260, 300], X = p => [O[0] + p[0] * S, O[1] - p[1] * S], c = TC(), c0 = Math.cos(th), s0 = Math.sin(th), sm = -0.43, sp = 0.08;
      fixedAxes(ctx, 40, 60);
      // ceiling above A
      const Ap = X(A);
      backPin(ctx, O[0], O[1]);   // bearing on the back plate (hidden behind the disk except at the edge)
      // disk with the slot (both turn with the disk)
      ctx.save(); ctx.translate(O[0], O[1]); ctx.rotate(-ph);
      ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, Rd * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COL.fg; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo((r + sm * c0) * S, -(sm * s0) * S); ctx.lineTo((r + sp * c0) * S, -(sp * s0) * S); ctx.stroke();
      ctx.strokeStyle = COL.card; ctx.lineWidth = 12; ctx.stroke();
      ctx.restore();
      // the disk turns on a shaft held in a bearing on the plate behind it (no support crosses the disk)
      pinDot(ctx, O[0], O[1]);
      frameAxes(ctx, O, ph, 58);
      // link AP from the ceiling bracket
      const Pp = X(K.P);
      line(ctx, Ap[0], Ap[1], Pp[0], Pp[1], '#8a8478', 9); line(ctx, Ap[0], Ap[1], Pp[0], Pp[1], '#d8d2c2', 6);
      ceilingPin(ctx, Ap[0], Ap[1], Ap[1] - 26);
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Pp[0], Pp[1], 6, 0, 2 * Math.PI); ctx.fill();
      txt(ctx, 'A', Ap[0] + 18, Ap[1] + 4, { font: SERIF });
      txt(ctx, 'O', O[0] - 18, O[1] + 4, { font: SERIF });
      spin(ctx, O, 40, true, c.w, 'ω', 135);
      const sw = q => [O[0] + q[0] * S, O[1] - q[1] * S], s1 = sw(add(rotv([r, 0], ph), mul(rotv([c0, s0], ph), sm))), s2 = sw(add(rotv([r, 0], ph), mul(rotv([c0, s0], ph), sp)));
      const ob = thick(s1[0], s1[1], s2[0], s2[1], 18).concat(thick(Ap[0], Ap[1], Pp[0], Pp[1], 10), rim(O, Rd * S), fsegs(O, ph, 58));
      if (st.show === 'v') chain(ctx, Pp, K.V.map(([v, k, l]) => [v, c[k], l]), 60, 'v_P', 170, ob, 'P');
      else chain(ctx, Pp, K.A.map(([v, k, l]) => [v, c[k], l]), 1.2, 'a_P', 170, ob, 'P');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (disk angle 0°)' : `disk angle = ${fmt(ph / RAD, 3)}°`, 630, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-4-stats', () => [['u (P along the slot)', fmt(K.u, 4) + ' m/s'], ['ω_AP (counterclockwise +)', fmt(K.wap, 4) + ' rad/s', true], ['α_AP (counterclockwise +)', fmt(K.alap, 4) + ' rad/s²', true], ['v_P', v2s(K.v)]]);
      const [y0, y1] = lims(TAB.map(k => [k.ph, k.wap]));
      plot($('x3a-4-plot'), { xmin: PH0 / RAD, xmax: PH1 / RAD, ymin: y0, ymax: y1, xlabel: 'disk angle (degrees)', ylabel: 'ω_AP (rad/s)',
        vlines: [{ x: 0, label: 'instant' }], series: [{ pts: TAB.map(k => [k.ph / RAD, k.wap]), color: COL.c1, width: 2.2 }], points: [{ x: ph / RAD, y: K.wap, color: COL.c1, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.5  Link OA drives pin A along the slot of link BC (BC turns at constant ω)
   ========================================================= */
{
  const w = 6, OC = 0.3, OA = 0.5, LBC = 0.86, O = [-OC, 0];
  function kin(be){
    const e = [Math.cos(be), Math.sin(be)], L = -OC * Math.cos(be) + Math.sqrt(OC * OC * Math.cos(be) ** 2 + OA * OA - OC * OC);
    const Ap = mul(e, L), ra = sub(Ap, O);
    const [Ld, wOA] = solve2(e, mul(kx(ra), -1), mul(kx(Ap), -w));
    const vrel = mul(e, Ld), rhs = add(mul(Ap, w * w), mul(kx(vrel), -2 * w), mul(ra, -wOA * wOA));
    const [Ldd, aOA] = solve2(e, mul(kx(ra), -1), rhs);
    const V = [[[0, 0], 'base', 'v_C'], [mul(kx(Ap), w), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const Ac = [[[0, 0], 'base', 'a_C'], [[0, 0], 'al', 'α×r'], [mul(Ap, -w * w), 'cen', '−ω²r'], [mul(kx(vrel), 2 * w), 'cor', '2ω×v_rel'], [mul(e, Ldd), 'rel', 'a_rel']];
    return { be, L, Ap, Ld, Ldd, wOA, aOA, V, A: Ac, v: add(...V.map(t => t[0])), a: add(...Ac.map(t => t[0])) };
  }
  makeClip({
    id: 'x3a-5', speed: 0.25, presets: chips('x3a-5'), setup: setupChips('x3a-5', 'v'),
    draw(st){
      const cv = $('x3a-5-anim'); const { ctx, w: W, h: hh } = fit(cv); ctx.clearRect(0, 0, W, hh);
      fitView(ctx, W, hh, [70, 20, 660, 580]);
      const tq = tau(st, 0, 2 * Math.PI / w), be = 90 * RAD + w * tq, K = kin(be), S = 300, C = [370, 300], X = p => [C[0] + p[0] * S, C[1] - p[1] * S], c = TC(); st.K = K;
      fixedAxes(ctx, 100, 70);
      const Op = X(O), Ap = X(K.Ap), e = [Math.cos(be), -Math.sin(be)], n = [-e[1], e[0]];
      // both links turn all the way around, so the pins at O and C are mounted on a plate (wall) behind the links
      ctx.save(); ctx.fillStyle = 'rgba(160,150,130,0.10)'; ctx.strokeStyle = 'rgba(120,110,90,0.35)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(C[0] - (LBC + 0.08) * S - 0.3 * S, C[1] - (LBC + 0.08) * S, (2 * LBC + 0.16) * S + 0.3 * S, (2 * LBC + 0.16) * S); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, 'back plate (the links turn in front of it)', C[0] + (LBC + 0.04) * S, C[1] + (LBC + 0.04) * S, { font: '11px system-ui', color: COL.muted, align: 'right', fixed: true });
      // link BC: a slotted bar pinned at C
      const Bp = [C[0] + e[0] * LBC * S, C[1] + e[1] * LBC * S];
      line(ctx, C[0] - e[0] * 12, C[1] - e[1] * 12, Bp[0], Bp[1], COL.massEdge, 26); line(ctx, C[0] - e[0] * 12, C[1] - e[1] * 12, Bp[0], Bp[1], COL.mass, 22);
      line(ctx, C[0] + e[0] * 0.12 * S, C[1] + e[1] * 0.12 * S, C[0] + e[0] * (LBC - 0.03) * S, C[1] + e[1] * (LBC - 0.03) * S, COL.fg, 11);
      line(ctx, C[0] + e[0] * 0.12 * S, C[1] + e[1] * 0.12 * S, C[0] + e[0] * (LBC - 0.03) * S, C[1] + e[1] * (LBC - 0.03) * S, COL.card, 8);
      // link OA
      line(ctx, Op[0], Op[1], Ap[0], Ap[1], COL.fg, 6); line(ctx, Op[0], Op[1], Ap[0], Ap[1], '#c9a46a', 3.5);
      backPin(ctx, Op[0], Op[1]); backPin(ctx, C[0], C[1]);
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Ap[0], Ap[1], 6, 0, 2 * Math.PI); ctx.fill();
      txt(ctx, 'O', Op[0] - 24, Op[1] + 20, { font: SERIF }); txt(ctx, 'C', C[0] + 24, C[1] + 20, { font: SERIF });
      txt(ctx, 'B', Bp[0] + e[0] * 26, Bp[1] + e[1] * 26, { font: SERIF });
      frameAxes(ctx, C, be - Math.PI / 2, 56, ['x', 'y'], 22);
      spin(ctx, C, 30, true, c.w, 'ω', 45);
      const ob = thick(C[0], C[1], Bp[0], Bp[1], 28).concat(thick(Op[0], Op[1], Ap[0], Ap[1], 8), fsegs(C, be - Math.PI / 2, 56));
      if (st.show === 'v') chain(ctx, Ap, K.V.map(([v, k, l]) => [v, c[k], l]), 70, 'v_A', 200, ob, 'A');
      else chain(ctx, Ap, K.A.map(([v, k, l]) => [v, c[k], l]), 4, 'a_A', 200, ob, 'A');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (BC vertical)' : `angle of BC = ${fmt(((be / RAD) % 360 + 360) % 360, 3)}°`, 650, 34, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-5-stats', () => [['L', fmt(K.L * 1000, 3) + ' mm'], ['L̇', fmt(K.Ld, 4) + ' m/s', true], ['ω_OA (counterclockwise +)', fmt(K.wOA, 4) + ' rad/s', true], ['v_A', v2s(K.v)]]);
      const pw = [], pl = []; for (let i = 0; i <= 180; i++){ const b = 90 * RAD + 2 * Math.PI * i / 180, k = kin(b); pw.push([90 + 360 * i / 180, k.wOA]); pl.push([90 + 360 * i / 180, k.Ld]); }
      const bd = 90 + ((be / RAD - 90) % 360 + 360) % 360;
      const [y0, y1] = lims(pw, pl);
      plot($('x3a-5-plot'), { xmin: 90, xmax: 450, ymin: y0, ymax: y1, xlabel: 'angle of BC (degrees)', vlines: [{ x: 90, label: 'instant' }], ylabel: 'ω_OA (rad/s), L̇ (m/s)',
        series: [{ pts: pw, color: COL.c1, width: 2.2 }, { pts: pl, color: COL.c2, width: 2.2 }],
        points: [{ x: bd, y: K.wOA, color: COL.c1, r: 5 }, { x: bd, y: K.Ld, color: COL.c2, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.6  Slotted link OD turns clockwise; pin A also moves on link CA
   ========================================================= */
{
  const W0 = -2, L = 0.225, C = [-0.45, -0.225], TH0 = 41 * RAD, TH1 = 87 * RAD, LOD = 0.47;
  function kin(th, dGuess){
    const e = [-Math.sin(th), -Math.cos(th)], B = dot(mul(C, -1), e), D = B * B - (dot(C, C) - L * L);
    if (D < 0) return null;
    const r1 = -B + Math.sqrt(D), r2 = -B - Math.sqrt(D), d = Math.abs(r1 - dGuess) < Math.abs(r2 - dGuess) ? r1 : r2;
    const Ap = mul(e, d), ca = sub(Ap, C);
    const [dd, wCA] = solve2(e, mul(kx(ca), -1), mul(kx(Ap), -W0));
    const vrel = mul(e, dd), rhs = add(mul(Ap, W0 * W0), mul(kx(vrel), -2 * W0), mul(ca, -wCA * wCA));
    const [ddd, aCA] = solve2(e, mul(kx(ca), -1), rhs);
    const V = [[[0, 0], 'base', 'v_O'], [mul(kx(Ap), W0), 'cen', 'ω×r'], [vrel, 'rel', 'v_rel']];
    const Ac = [[[0, 0], 'base', 'a_O'], [[0, 0], 'al', 'α×r'], [mul(Ap, -W0 * W0), 'cen', '−ω²r'], [mul(kx(vrel), 2 * W0), 'cor', '2ω×v_rel'], [mul(e, ddd), 'rel', 'a_rel']];
    return { th, d, e, Ap, dd, ddd, wCA, aCA, V, A: Ac, v: add(...V.map(t => t[0])), a: add(...Ac.map(t => t[0])) };
  }
  const TAB = []; { let d = 0.32; for (let i = 0; i <= 200; i++){ const th = TH0 + (TH1 - TH0) * i / 200, k = kin(th, d); if (k){ TAB.push(k); d = k.d; } } }
  makeClip({
    id: 'x3a-6', speed: 0.1, presets: chips('x3a-6'), setup: setupChips('x3a-6'),
    draw(st){
      const cv = $('x3a-6-anim'); const { ctx, w: Wc, h: hh } = fit(cv); ctx.clearRect(0, 0, Wc, hh);
      fitView(ctx, Wc, hh, [0, 0, 640, 520]);
      const tq = tau(st, (TH0 - 45 * RAD) / 2, (TH1 - 45 * RAD) / 2), th = 45 * RAD + 2 * tq;
      let K = TAB[0]; for (const k of TAB){ if (k.th <= th) K = k; }
      K = kin(th, K.d) || K; st.K = K;
      const S = 820, O = [520, 120], X = p => [O[0] + p[0] * S, O[1] - p[1] * S], c = TC();
      fixedAxes(ctx, 40, 470);
      // walls: O on a wall bracket at the right, C on a wall bracket at the left
      line(ctx, O[0] + 26, O[1] - 60, O[0] + 26, O[1] + 60, COL.fg, 2); hatch(ctx, O[0] + 26, O[1] + 60, O[0] + 26, O[1] - 60, 1);
      const Cp = X(C); line(ctx, Cp[0] - 26, Cp[1] - 50, Cp[0] - 26, Cp[1] + 50, COL.fg, 2); hatch(ctx, Cp[0] - 26, Cp[1] - 50, Cp[0] - 26, Cp[1] + 50, 1);
      const bracket = (p, s) => { ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p[0] + 26 * s, p[1] - 14); ctx.lineTo(p[0], p[1] - 6); ctx.lineTo(p[0], p[1] + 6); ctx.lineTo(p[0] + 26 * s, p[1] + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
      // link OD with its slot
      const e = [K.e[0], -K.e[1]], Dp = [O[0] + e[0] * LOD * S, O[1] + e[1] * LOD * S];
      line(ctx, O[0], O[1], Dp[0], Dp[1], COL.massEdge, 28); line(ctx, O[0], O[1], Dp[0], Dp[1], COL.mass, 24);
      line(ctx, O[0] + e[0] * 0.08 * S, O[1] + e[1] * 0.08 * S, O[0] + e[0] * (LOD - 0.02) * S, O[1] + e[1] * (LOD - 0.02) * S, COL.fg, 12);
      line(ctx, O[0] + e[0] * 0.08 * S, O[1] + e[1] * 0.08 * S, O[0] + e[0] * (LOD - 0.02) * S, O[1] + e[1] * (LOD - 0.02) * S, COL.card, 9);
      const Ap = X(K.Ap);
      line(ctx, Cp[0], Cp[1], Ap[0], Ap[1], COL.fg, 6); line(ctx, Cp[0], Cp[1], Ap[0], Ap[1], '#c9a46a', 3.5);
      bracket(O, 1); pinDot(ctx, O[0], O[1]); bracket(Cp, -1); pinDot(ctx, Cp[0], Cp[1]);
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Ap[0], Ap[1], 6, 0, 2 * Math.PI); ctx.fill();
      txt(ctx, 'O', O[0] - 4, O[1] - 24, { font: SERIF }); txt(ctx, 'C', Cp[0] - 2, Cp[1] - 28, { font: SERIF }); txt(ctx, 'D', Dp[0] - 10, Dp[1] + 24, { font: SERIF });
      // θ from the downward vertical
      line(ctx, O[0], O[1], O[0], O[1] + 90, COL.muted, 1, [4, 3]);
      ctx.save(); ctx.strokeStyle = COL.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(O[0], O[1], 60, Math.PI / 2, Math.PI / 2 + th); ctx.stroke(); ctx.restore();
      txt(ctx, 'θ', O[0] - 60 * Math.sin(th / 2) - 10, O[1] + 60 * Math.cos(th / 2) + 8, { font: 'italic 13px Georgia, serif', color: COL.muted });
      frameAxes(ctx, O, Math.atan2(-K.e[1], -K.e[0]), 54);                  // x axis along the link, away from D
      spin(ctx, O, 30, false, c.w, 'ω', -150);
      const ob = thick(O[0], O[1], Dp[0], Dp[1], 30).concat(thick(Cp[0], Cp[1], Ap[0], Ap[1], 8));
      if (st.show === 'v') chain(ctx, Ap, K.V.map(([v, k, l]) => [v, c[k], l]), 120, 'v_A', 170, ob, 'A');
      else chain(ctx, Ap, K.A.map(([v, k, l]) => [v, c[k], l]), 12, 'a_A', 170, ob, 'A');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (θ = 45°)' : `θ = ${fmt(th / RAD, 3)}°`, 630, 470, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-6-stats', () => [['ḋ (A along the slot, outward +)', fmt(K.dd, 4) + ' m/s'], ['ω_CA (counterclockwise +)', fmt(K.wCA, 4) + ' rad/s'], ['v_A', v2s(K.v, 4), true], ['a_A', v2s(K.a, 4, 'm/s²'), true]]);
      const W2 = TAB.map(k => [k.th / RAD, k.wCA]), [w0, w1] = lims(W2);
      plot($('x3a-6-plot'), { xmin: TH0 / RAD, xmax: TH1 / RAD, ymin: 0, ymax: w1, xlabel: 'θ (degrees)', ylabel: 'ω_CA (rad/s)', vlines: [{ x: 45, label: 'instant' }],
        series: [{ pts: TAB.map(k => [k.th / RAD, k.wCA]), color: COL.c1, width: 2.2 }], points: [{ x: th / RAD, y: K.wCA, color: COL.c1, r: 5 }] });
      const A2 = TAB.map(k => [k.th / RAD, nrm(k.a)]), [z0, z1] = lims(A2);
      plot($('x3a-6-plot2'), { xmin: TH0 / RAD, xmax: TH1 / RAD, ymin: 0, ymax: z1, xlabel: 'θ (degrees)', ylabel: '|a_A| (m/s²)', vlines: [{ x: 45, label: 'instant' }],
        series: [{ pts: TAB.map(k => [k.th / RAD, nrm(k.a)]), color: COL.c2, width: 2.2 }], points: [{ x: th / RAD, y: nrm(K.a), color: COL.c2, r: 5 }] });
    }
  });
}

/* =========================================================
   3.A.7  Pin P on a rolling disk slides in the slot of arm BD
   ========================================================= */
{
  const wd = 20, R = 0.2, r = 0.14, T0 = -0.0575, T1 = 0.1175, LBD = 1.12;
  function kin(tq){
    const xA = 0.48 + wd * R * tq, ps = wd * tq;                                  // ps: clockwise turn of the disk
    const P = [xA + r * Math.sin(ps), r * Math.cos(ps)], vP = [wd * R + wd * r * Math.cos(ps), -wd * r * Math.sin(ps)], aP = [-wd * wd * r * Math.sin(ps), -wd * wd * r * Math.cos(ps)];
    const s = nrm(P), e = mul(P, 1 / s), n = kx(e), sd = dot(vP, e), wa = dot(vP, n) / s;
    const rem = add(aP, mul(P, wa * wa), mul(n, -2 * wa * sd)), sdd = dot(rem, e), aa = dot(rem, n) / s;
    const V = [[[0, 0], 'base', 'v_B'], [mul(kx(P), wa), 'cen', 'ω×r'], [mul(e, sd), 'rel', 'v_rel']];
    const Ac = [[[0, 0], 'base', 'a_B'], [mul(kx(P), aa), 'al', 'α×r'], [mul(P, -wa * wa), 'cen', '−ω²r'], [mul(n, 2 * wa * sd), 'cor', '2ω×v_rel'], [mul(e, sdd), 'rel', 'a_rel']];
    return { xA, ps, P, s, e, sd, wa, sdd, aa, vP, aP, V, A: Ac };
  }
  makeClip({
    id: 'x3a-7', speed: 0.1, presets: chips('x3a-7'), setup: setupChips('x3a-7'),
    draw(st){
      const cv = $('x3a-7-anim'); const { ctx, w: Wc, h: hh } = fit(cv); ctx.clearRect(0, 0, Wc, hh);
      fitView(ctx, Wc, hh, [0, 0, 700, 420]);
      const tq = tau(st, T0, T1), K = kin(tq), S = 500, B = [70, 230], X = p => [B[0] + p[0] * S, B[1] - p[1] * S], c = TC(); st.K = K;
      fixedAxes(ctx, 40, 400);
      const gy = B[1] + R * S; line(ctx, 20, gy, 690, gy, COL.fg, 2); hatch(ctx, 20, gy, 690, gy, 1);
      line(ctx, B[0] - 30, B[1] - 70, B[0] - 30, B[1] + 50, COL.fg, 2); hatch(ctx, B[0] - 30, B[1] - 70, B[0] - 30, B[1] + 50, 1);
      // disk with pin P (the spoke shows the clockwise rotation)
      const Ap = X([K.xA, 0]);
      ctx.save(); ctx.translate(Ap[0], Ap[1]); ctx.rotate(K.ps);
      ctx.fillStyle = '#b9b4a6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      line(ctx, 0, 0, 0, R * S - 4, COL.fg, 2); ctx.restore();
      pinDot(ctx, Ap[0], Ap[1]); txt(ctx, 'A', Ap[0] + 14, Ap[1] + 14, { font: SERIF });
      // arm BD with its slot, pinned to the wall at B
      const e = [K.e[0], -K.e[1]], Dp = [B[0] + e[0] * LBD * S, B[1] + e[1] * LBD * S];
      ctx.save(); ctx.globalAlpha = 0.92;
      line(ctx, B[0] - e[0] * 14, B[1] - e[1] * 14, Dp[0], Dp[1], COL.massEdge, 26); line(ctx, B[0] - e[0] * 14, B[1] - e[1] * 14, Dp[0], Dp[1], COL.mass, 22); ctx.restore();
      line(ctx, B[0] + e[0] * 0.12 * S, B[1] + e[1] * 0.12 * S, B[0] + e[0] * (LBD - 0.03) * S, B[1] + e[1] * (LBD - 0.03) * S, COL.fg, 11);
      line(ctx, B[0] + e[0] * 0.12 * S, B[1] + e[1] * 0.12 * S, B[0] + e[0] * (LBD - 0.03) * S, B[1] + e[1] * (LBD - 0.03) * S, COL.card, 8);
      ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(B[0] - 30, B[1] - 14); ctx.lineTo(B[0], B[1] - 6); ctx.lineTo(B[0], B[1] + 6); ctx.lineTo(B[0] - 30, B[1] + 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      pinDot(ctx, B[0], B[1]); txt(ctx, 'B', B[0] + 2, B[1] + 26, { font: SERIF }); txt(ctx, 'D', Dp[0] + e[0] * 16, Dp[1] + e[1] * 16 - 10, { font: SERIF });
      const Pp = X(K.P); ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(Pp[0], Pp[1], 6, 0, 2 * Math.PI); ctx.fill();
      frameAxes(ctx, B, Math.atan2(K.e[1], K.e[0]), 54);
      spin(ctx, Ap, R * S + 12, false, COL.c5, 'ω_d', 55);
      const ob = thick(B[0], B[1], Dp[0], Dp[1], 28).concat(rim(Ap, R * S), rim(Ap, R * S + 12, 24));
      if (st.show === 'v') chain(ctx, Pp, K.V.map(([v, k, l]) => [v, c[k], l]), 22, 'v_P', 170, ob, 'P');
      else chain(ctx, Pp, K.A.map(([v, k, l]) => [v, c[k], l]), 2.2, 'a_P', 170, ob, 'P');
      txt(ctx, st.mode === 'freeze' ? 'the instant in the problem (P above A)' : `t = ${fmt(tq * 1000, 3)} ms`, 690, 20, { font: '12px system-ui', color: COL.muted, align: 'right' });
      statsEvery(st, 'x3a-7-stats', () => [['ω_BD (counterclockwise +)', fmt(K.wa, 4) + ' rad/s'], ['α_BD (counterclockwise +)', fmt(K.aa, 4) + ' rad/s²'], ['ṡ (P along the slot)', fmt(K.sd, 4) + ' m/s'],
        ['a_rel = s̈ (seen from BD)', fmt(K.sdd, 4) + ' m/s² along the slot', true]]);
      const pa = [], pw = []; for (let i = 0; i <= 120; i++){ const q = T0 + (T1 - T0) * i / 120, k = kin(q); pa.push([q * 1000, k.sdd]); pw.push([q * 1000, k.aa]); }
      const [y0, y1] = lims(pa);
      plot($('x3a-7-plot'), { xmin: T0 * 1000, xmax: T1 * 1000, ymin: y0, ymax: y1, xlabel: 'time t (ms)', ylabel: 's̈, seen from the arm (m/s²)',
        vlines: [{ x: 0, label: 'instant' }], series: [{ pts: pa, color: COL.c2, width: 2.2 }], points: [{ x: tq * 1000, y: K.sdd, color: COL.c2, r: 5 }] });
    }
  });
}

subLabels();
})();
