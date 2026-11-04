/* =========================================================
   Chapter 5 animations: planar rigid-body kinetics
   (Newton–Euler, work–energy, impulse–momentum)
   ========================================================= */
const RAD = Math.PI / 180, G0 = 9.81;
const RED = '#a61e4d';
/* ---------- proper subscripts ----------
   In labels, "v_B" or "v_{b1}" is drawn as v with a subscript (canvas) or v<sub>B</sub> (HTML). */
const SUB_RE = /_(\{[^}]*\}|[A-Za-z0-9\u0370-\u03FF]+)/g;   // Latin or Greek subscripts
const MINUS = s => String(s).replace(/(^|[\s(=])-(?=\d)/g, '$1−');
function htmlSub(s){ return MINUS(s).replace(SUB_RE, (m, g) => '<sub>' + g.replace(/[{}]/g, '') + '</sub>'); }
function subParts(s){
  const out = []; let last = 0; String(s).replace(SUB_RE, (m, g, i) => { if (i > last) out.push([s.slice(last, i), 0]); out.push([g.replace(/[{}]/g, ''), 1]); last = i + m.length; return m; });
  if (last < String(s).length) out.push([String(s).slice(last), 0]);
  return out;
}
// canvas text with subscripts (replaces the plain helper from common.js on Chapter 5 pages)
// a label wider than its canvas (long captions on phones) is drawn in a smaller font so it fits
function fitFont(ctx, s, font){
  const px = parseFloat((font.match(/(\d+(?:\.\d+)?)px/) || [0, 15])[1]), sub = font.replace(/(\d+(?:\.\d+)?)px/, Math.round(px * 0.72) + 'px');
  let W = 0; subParts(MINUS(s)).forEach(([t, b]) => { ctx.font = b ? sub : font; W += ctx.measureText(t).width; });
  const T = ctx.getTransform(), maxW = ctx.canvas.width / (Math.hypot(T.a, T.b) || 1) - 8;
  return W > maxW && maxW > 0 ? font.replace(/(\d+(?:\.\d+)?)px/, Math.max(8, px * maxW / W).toFixed(1) + 'px') : font;
}
function txtNow(ctx, s, x, y, opt = {}){
  s = MINUS(s);
  ctx.save(); ctx.fillStyle = opt.color || COL.fg; const font = fitFont(ctx, s, opt.font || 'italic 15px Georgia, serif');
  const px = parseFloat((font.match(/(\d+(?:\.\d+)?)px/) || [0, 15])[1]), subFont = font.replace(/(\d+(?:\.\d+)?)px/, Math.round(px * 0.72) + 'px');
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const parts = subParts(s);
  const widths = parts.map(([t, sub]) => { ctx.font = sub ? subFont : font; return ctx.measureText(t).width; });
  const W = widths.reduce((a, b) => a + b, 0), al = opt.align || 'center';
  let cx = al === 'center' ? x - W / 2 : al === 'right' ? x - W : x;
  parts.forEach(([t, sub], i) => { ctx.font = sub ? subFont : font; ctx.fillText(t, cx, sub ? y + px * 0.3 : y); cx += widths[i]; });
  ctx.restore();
  return { x0: al === 'center' ? x - W / 2 : al === 'right' ? x - W : x, w: W, y0: y - px * 0.62, h: px * 1.4 };
}
/* ---------- automatic label placement ----------
   While an animation frame is drawn, txt() only records each label. When the frame is complete, every label is
   placed at its intended spot if that spot is clear. If lines, arrows or other text are in the way, or the label
   would leave the canvas, it moves to the nearest clear spot (and stays there while that spot remains clear). */
const LBL = { queue: null, memo: new Map() };
function txt(ctx, s, x, y, opt = {}){
  if (LBL.queue && !opt.fixed){ LBL.queue.push({ ctx, s, x, y, opt, T: ctx.getTransform(), alpha: ctx.globalAlpha }); return; }
  return txtNow(ctx, s, x, y, opt);
}
function labelBox(it){ // the label's box in device pixels
  const { ctx, s, x, y, opt, T } = it; ctx.save(); ctx.setTransform(T);
  const font = fitFont(ctx, s, opt.font || 'italic 15px Georgia, serif'), px = parseFloat((font.match(/(\d+(?:\.\d+)?)px/) || [0, 15])[1]);
  const subFont = font.replace(/(\d+(?:\.\d+)?)px/, Math.round(px * 0.72) + 'px');
  let W = 0; subParts(MINUS(s)).forEach(([t, sub]) => { ctx.font = sub ? subFont : font; W += ctx.measureText(t).width; });
  ctx.restore();
  const al = opt.align || 'center', lx = al === 'center' ? x - W / 2 : al === 'right' ? x - W : x;
  const pts = [[lx - 1, y - px * 0.6], [lx + W + 1, y - px * 0.6], [lx - 1, y + px * 0.72], [lx + W + 1, y + px * 0.72]].map(([u, v]) => [T.a * u + T.c * v + T.e, T.b * u + T.d * v + T.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function boxScore(ctx, b, placed){
  const cv = ctx.canvas, x0 = Math.floor(b.x0), y0 = Math.floor(b.y0), x1 = Math.ceil(b.x1), y1 = Math.ceil(b.y1);
  const out = Math.max(0, -x0) + Math.max(0, -y0) + Math.max(0, x1 - cv.width) + Math.max(0, y1 - cv.height);
  if (out > 0) return 10 + out;
  const w = x1 - x0, h = y1 - y0; if (w < 1 || h < 1) return 0;
  const D = ctx.getImageData(x0, y0, w, h).data; let n = w * h, s = 0, mr = 0, mg = 0, mb = 0;
  for (let i = 0; i < D.length; i += 4) if (D[i + 3] > 60){ s++; mr += D[i]; mg += D[i + 1]; mb += D[i + 2]; }
  let clutter = s;
  if (s >= 0.9 * n){ // the label sits wholly inside one filled (possibly shaded) shape: only lines or edges inside it count
    mr /= s; mg /= s; mb /= s; clutter = 0;
    for (let i = 0; i < D.length; i += 4) if (D[i + 3] > 60 && Math.abs(D[i] - mr) + Math.abs(D[i + 1] - mg) + Math.abs(D[i + 2] - mb) > 60) clutter++;
  }
  let ov = 0; placed.forEach(p => { const ix = Math.min(b.x1, p.x1) - Math.max(b.x0, p.x0), iy = Math.min(b.y1, p.y1) - Math.max(b.y0, p.y0); if (ix > 0 && iy > 0) ov += ix * iy; });
  return clutter / n + 2 * ov / n;
}
const RINGS = (() => { const c = [[0, 0]]; [5, 9, 13, 18, 24, 31, 39, 48].forEach(r => { const n = r < 10 ? 8 : r < 30 ? 12 : 16; for (let k = 0; k < n; k++){ const a = 2 * Math.PI * k / n - Math.PI / 2; c.push([r * Math.cos(a), r * Math.sin(a)]); } }); return c; })();
function placeLabels(q, id){
  const placedBy = new Map(), count = new Map(), dpr = window.devicePixelRatio || 1;
  q.forEach(it => {
    const cv = it.ctx.canvas; if (!placedBy.has(cv)) placedBy.set(cv, []); const placed = placedBy.get(cv);
    const key0 = id + '|' + cv.id + '|' + it.s, n = (count.get(key0) || 0) + 1; count.set(key0, n); const key = key0 + '|' + n;
    const b = labelBox(it);
    // shift needed to keep the label inside the canvas
    let sx = 0, sy = 0; if (b.x0 < 2) sx = 2 - b.x0; if (b.x1 > cv.width - 2) sx = cv.width - 2 - b.x1; if (b.y0 < 2) sy = 2 - b.y0; if (b.y1 > cv.height - 2) sy = cv.height - 2 - b.y1;
    const shifted = d => ({ x0: b.x0 + sx + d[0], x1: b.x1 + sx + d[0], y0: b.y0 + sy + d[1], y1: b.y1 + sy + d[1] });
    const cands = it.s.length <= 16 ? RINGS : RINGS.slice(0, 1 + 8 + 8 + 12 + 12); // sentences move less far
    let best = null, bestS = Infinity;
    const prev = LBL.memo.get(key), tryD = d => { const dd = [d[0] * dpr, d[1] * dpr], sc2 = boxScore(it.ctx, shifted(dd), placed); if (sc2 < bestS){ bestS = sc2; best = dd; } return sc2; };
    if (!(prev && tryD(prev) < 0.06)){ for (const d of cands){ if (tryD(d) < 0.06) break; } }
    LBL.memo.set(key, [best[0] / dpr, best[1] / dpr]);
    const fb = shifted(best); placed.push(fb);
    const ox = sx + best[0], oy = sy + best[1], T = it.T, det = T.a * T.d - T.b * T.c || 1;
    const dx = (T.d * ox - T.c * oy) / det, dy = (-T.b * ox + T.a * oy) / det; // device shift -> local shift
    it.ctx.save(); it.ctx.setTransform(it.T); it.ctx.globalAlpha = it.alpha; txtNow(it.ctx, it.s, it.x + dx, it.y + dy, it.opt); it.ctx.restore();
  });
}
// every clip on Chapter 5 pages draws its labels last, through placeLabels()
// live state of every clip and its animation loop entry, by clip id (used by the 3D views in ch5-3d.js)
const CLIP_ST = {}, DEMO_BY_ID = {};
{ const r0 = register; register = function(el, d){ if (el && el.id) DEMO_BY_ID[el.id] = d; return r0(el, d); }; }
{ const mk0 = makeClip; makeClip = function(cfg){ if (cfg.draw){ const d0 = cfg.draw; cfg.draw = st => { CLIP_ST[cfg.id] = st; LBL.queue = []; try { d0(st); } finally { const q = LBL.queue; LBL.queue = null; placeLabels(q, cfg.id); } }; } return mk0(cfg); }; }
function setStats(id, items){
  $(id).innerHTML = items.map(it => `<span class="stat${it[2] ? ' hl' : ''}">${htmlSub(it[0])} = <b>${htmlSub(it[1])}</b></span>`).join('');
}
const tiny = (v, d = 3) => Math.abs(v) < 1e-9 ? '0' : fmt(v, d);
function chips5(id, items, st, reset, key){
  return items.map(([label, val]) => ({ label, apply: () => { st[key] = val; reset(); } }));
}
function mark5(id, st, key, items){
  document.querySelectorAll(`#${id}-pre .chip`).forEach((b, i) => b.classList.toggle('on', items[i] && items[i][1] === st[key]));
}
// RK4 on a state array with derivative f(s)
function rk(f, s, h){
  const a = f(s), b = f(s.map((x, i) => x + h / 2 * a[i])), c = f(s.map((x, i) => x + h / 2 * b[i])), d = f(s.map((x, i) => x + h * c[i]));
  return s.map((x, i) => x + h / 6 * (a[i] + 2 * b[i] + 2 * c[i] + d[i]));
}
function stepN(f, s, dt, hmax = 0.002){
  const n = Math.max(1, Math.min(4000, Math.ceil(Math.abs(dt) / hmax))), h = dt / n;
  for (let i = 0; i < n; i++) s = rk(f, s, h);
  return s;
}
// a wheel / disk / ring / sphere with a spoke so that rotation is visible. ang = canvas rotation (clockwise +)
function wheel(ctx, x, y, R, ang, kind = 'disk', col){
  ctx.save(); ctx.translate(x, y);
  ctx.lineWidth = 2; ctx.strokeStyle = COL.massEdge;
  if (kind === 'sphere'){
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R);
    g.addColorStop(0, '#fffaf0'); g.addColorStop(1, col || COL.mass);
    ctx.fillStyle = g;
  } else ctx.fillStyle = col || COL.mass;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI);
  if (kind === 'ring'){ ctx.arc(0, 0, R * 0.78, 0, 2 * Math.PI, true); ctx.fill('evenodd'); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, 2 * Math.PI); ctx.stroke(); }
  else { ctx.fill(); ctx.stroke(); }
  ctx.rotate(ang);
  ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R * (kind === 'ring' ? 0.78 : 0.92)); ctx.stroke();
  ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(0, -R * (kind === 'ring' ? 0.89 : 0.7), Math.max(2.5, R * 0.09), 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 2 * Math.PI); ctx.fill();
  ctx.restore();
}
// vertical energy bars
function ebars(ctx, x, y, w, h, items, max, title){
  const n = items.length, bw = Math.min(46, (w - 10) / n - 10);
  if (title) txt(ctx, title, x + w / 2, y - 14, { font: '600 12px system-ui' });
  line(ctx, x, y + h, x + w, y + h, COL.axis, 1);
  items.forEach((it, i) => {
    const cx = x + (i + 0.5) * w / n, v = it.val, hh = clamp(Math.abs(v) / (max || 1), 0, 1) * h;
    ctx.save(); ctx.fillStyle = it.color; ctx.globalAlpha = 0.85;
    if (v >= 0) ctx.fillRect(cx - bw / 2, y + h - hh, bw, hh); else { ctx.globalAlpha = 0.35; ctx.fillRect(cx - bw / 2, y + h - hh, bw, hh); }
    ctx.restore();
    txt(ctx, it.label, cx, y + h + 13, { font: '11px system-ui', color: COL.muted });
    if (it.num !== undefined) txt(ctx, it.num, cx, y + h - hh - 9, { font: '11px system-ui', color: COL.fg });
  });
}
function nar(cv, w, hw, hn){ const n = w < 560; cv.dataset.h0 = String(n ? hn : hw); return n; }
// pin supports. The bracket is fixed to the ground (or ceiling); draw it before the body and the pin dot after it.
function pinDot(ctx, x, y){ ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore(); }
function pin(ctx, x, y, hgt = 26){ // bracket standing on the ground below the pin
  ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x - 14, y + hgt); ctx.lineTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x + 14, y + hgt); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  line(ctx, x - 30, y + hgt, x + 30, y + hgt, COL.fg, 2); hatch(ctx, x - 30, y + hgt, x + 30, y + hgt, 1, 7, 6);
  pinDot(ctx, x, y);
}
// a solid incline (wedge) resting on the ground. (x, y) is the top of the slope.
function wedge(ctx, x, y, L, th){
  const xb = x + L * Math.cos(th), yb = y + L * Math.sin(th);
  ctx.save(); ctx.fillStyle = 'rgba(125,119,107,.14)'; ctx.strokeStyle = COL.ground; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xb, yb); ctx.lineTo(x, yb); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  line(ctx, x - 14, yb, xb + 24, yb, COL.fg, 2); hatch(ctx, x - 14, yb, xb + 24, yb, 1, 8, 6);
  return [xb, yb];
}
function ceilingPin(ctx, x, y, hgt = 26){ // bracket hanging from the ceiling above the pin
  ctx.save(); ctx.fillStyle = '#e4dfd2'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x - 14, y - hgt); ctx.lineTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x + 14, y - hgt); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  line(ctx, x - 30, y - hgt, x + 30, y - hgt, COL.fg, 2); hatch(ctx, x + 30, y - hgt, x - 30, y - hgt, 1, 7, 6);
  pinDot(ctx, x, y);
}

/* =========================================================
   A. NEWTON–EULER
   ========================================================= */
// --- Newton for G, Euler for rotation: same force, different point of application
makeClip({
  id: 'c-ne', speed: 0.5,
  controls: [
    { key: 'F', label: 'Force F', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'N', dec: 2 },
    { key: 'e', label: 'Offset e of the push', min: -0.2, max: 0.2, step: 0.01, value: 0.15, unit: 'm', dec: 3 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 }
  ],
  presets: C => [{ label: 'Push through G', apply: () => C.set({ e: 0 }) }, { label: 'Push near the edge', apply: () => C.set({ e: 0.2 }) }, { label: 'Push below G', apply: () => C.set({ e: -0.15 }) }],
  reset(st){
    const V = st.V; st.ok = V.m > 0;
    st.I = V.m * (0.8 * 0.8 + 0.4 * 0.4) / 12; st.s = [0, 0]; st.lastT = 0; st.hold = undefined;
  },
  step(st){
    if (!st.ok) return;
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    const aG = V.F / V.m, x = 0.5 * aG * st.t * st.t;
    if (x > 4.6){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.lastT = 0; st.s = [0, 0]; st.hold = undefined; } return; }
    // body 2: theta'' = (r x F)/I with r = R(theta)(0, e), F = (F, 0)  ->  -e F cos(theta) / I   (CCW +)
    st.s = stepN(s => [s[1], -V.e * V.F * Math.cos(s[0]) / st.I], st.s, dt);
  },
  draw(st){
    const cv = $('c-ne-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'The mass must be positive.'); return; }
    const n = nar(cv, w, 330, 340), Wd = n ? 420 : 720;
    fitView(ctx, w, h, [0, 0, Wd, 330]);
    const V = st.V, aG = V.F / V.m, x = Math.min(0.5 * aG * st.t * st.t, 4.6), S = n ? 70 : 120, X0 = n ? 45 : 70;
    txt(ctx, 'Top view of a frictionless table. Gravity acts out of the plane.', Wd / 2, 14, { font: '12px system-ui', color: COL.muted });
    [[95, 0, 'Pushed through G'], [235, st.s[0], 'Pushed at a distance e from G']].forEach(([yc, th, lab], k) => {
      line(ctx, 20, yc, Wd - 20, yc, COL.grid, 1, [4, 4]);
      txt(ctx, lab, 24, yc - 62, { font: '12px system-ui', color: COL.muted, align: 'left' });
      const gx = X0 + x * S * 0.8; // same scale as the plate (0.8 S pixels per metre)
      line(ctx, X0, yc, gx, yc, COL.c3, 2);
      block(ctx, gx, yc, 0.8 * S * 0.8, 0.4 * S * 0.8, -th, '');
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, yc, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx + 9, yc + 11, { font: 'italic 13px Georgia, serif' });
      const e = k === 0 ? 0 : V.e, px = gx - e * S * 0.8 * Math.sin(th), py = yc - e * S * 0.8 * Math.cos(th);
      const L = 60 + V.F * 6; arrow(ctx, px - L, py, px, py, COL.c2, 3); txt(ctx, 'F', px - L - 6, py + (py > yc + 1 ? 12 : -12), { color: COL.c2, align: 'right' });
      if (k === 1 && Math.abs(V.e) > 1e-6){ // curved arrow showing the sense of the angular acceleration
        const ccw = -V.e * Math.cos(th) > 0, r0 = 0.32 * S + 14, a0 = ccw ? -0.3 : -2.4, a1 = ccw ? -2.4 : -0.3;
        ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, yc, r0, a0, a1, ccw); ctx.stroke(); ctx.restore();
        const ex = gx + r0 * Math.cos(a1), ey = yc + r0 * Math.sin(a1), tg = ccw ? [Math.sin(a1), -Math.cos(a1)] : [-Math.sin(a1), Math.cos(a1)];
        arrow(ctx, ex - 9 * tg[0], ey - 9 * tg[1], ex, ey, COL.c4, 2);
        txt(ctx, 'α', gx, yc - r0 - 12, { color: COL.c4 });
      }
    });
    statsEvery(st, 'c-ne-stats', () => [['a_G = F/m (both bodies)', fmt(aG) + ' m/s²', true], ['I_G', fmt(st.I) + ' kg·m²'], ['α of the offset body = −eF cos θ / I_G', fmt(-V.e * V.F * Math.cos(st.s[0]) / st.I) + ' rad/s²', true], ['angle turned so far', fmt(Math.abs(st.s[0]) / RAD, 3) + '°']]);
  }
});

// --- where is the pivot? I_O = I_G + m d², and the angular acceleration on release
makeClip({
  id: 'c-pivot', speed: 0.5,
  controls: [
    { key: 'd', label: 'Pivot distance d from G', min: 0, max: 0.5, step: 0.005, value: 0.3, unit: 'm', dec: 3 },
    { key: 'L', label: 'Bar length L', min: 0.3, max: 2, step: 0.05, value: 1, unit: 'm', dec: 2 }
  ],
  presets: C => [{ label: 'Pivot at G', apply: () => C.set({ d: 0 }) }, { label: 'Pivot at the end', apply: () => C.set({ d: C.v.L / 2 }) }, { label: 'd = L/√12 (fastest start)', apply: () => C.set({ d: C.v.L / Math.sqrt(12) }) }],
  reset(st){
    const V = st.V; st.ok = V.L > 0 && V.d >= 0;
    st.s = [Math.PI / 2, 0]; st.lastT = 0;
    if (V.d > V.L / 2) showNotes('c-pivot-notes', [{ level: 'warn', html: 'The pivot now lies beyond the end of the bar. Imagine a light arm that connects the bar to the pivot.' }]); else showNotes('c-pivot-notes', []);
  },
  step(st){
    if (!st.ok) return;
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    const IO = V.L * V.L / 12 + V.d * V.d; // per unit mass
    st.s = stepN(s => [s[1], -G0 * V.d * Math.sin(s[0]) / IO], st.s, dt);
  },
  draw(st){
    const cv = $('c-pivot-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Use a positive length and a distance d ≥ 0.'); return; }
    fitView(ctx, w, h, [0, 0, 360, 340]);
    const V = st.V, S = 150 / Math.max(V.d + V.L / 2, 0.3), ox = 180, oy = 170, th = st.s[0];
    const gx = ox + V.d * S * Math.sin(th), gy = oy + V.d * S * Math.cos(th), ux = Math.sin(th), uy = Math.cos(th);
    ceilingPin(ctx, ox, oy, 40);
    line(ctx, gx - ux * V.L / 2 * S, gy - uy * V.L / 2 * S, gx + ux * V.L / 2 * S, gy + uy * V.L / 2 * S, COL.massEdge, 12);
    line(ctx, gx - ux * V.L / 2 * S, gy - uy * V.L / 2 * S, gx + ux * V.L / 2 * S, gy + uy * V.L / 2 * S, COL.mass, 8);
    if (V.d > V.L / 2) line(ctx, ox, oy, gx - ux * V.L / 2 * S, gy - uy * V.L / 2 * S, COL.muted, 2, [3, 3]);
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx + 10, gy + 10, { font: 'italic 13px Georgia, serif' });
    ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = RED; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    txt(ctx, 'O', ox + 22, oy - 14, { font: 'italic 14px Georgia, serif', color: RED });
    const IO = V.L * V.L / 12 + V.d * V.d, a0 = G0 * V.d / IO, dmax = V.L / Math.sqrt(12);
    const pts = []; for (let i = 0; i <= 200; i++){ const dd = 0.5 * V.L * i / 200 * 1.0; pts.push([dd, G0 * dd / (V.L * V.L / 12 + dd * dd)]); }
    plot($('c-pivot-plot'), { xmin: 0, xmax: V.L / 2, ymin: 0, ymax: G0 / (2 * dmax) * 1.15, xlabel: 'pivot distance d from G (m)', ylabel: 'α on release (rad/s²)',
      series: [{ pts, color: COL.c1, width: 2.4 }], vlines: [{ x: dmax, color: COL.c3, label: 'L/√12' }], points: [{ x: Math.min(V.d, V.L / 2), y: a0, color: COL.c2, r: 6 }] });
    statsEvery(st, 'c-pivot-stats', () => [['I_G / m = L²/12', fmt(V.L * V.L / 12) + ' m²'], ['I_O / m = L²/12 + d²', fmt(IO) + ' m²', true], ['α on release = g d / (I_O/m)', fmt(a0) + ' rad/s²', true],
      ['small-swing period', V.d > 0 ? fmt(2 * Math.PI * Math.sqrt(IO / (G0 * V.d))) + ' s' : '∞ (balanced)']]);
  }
});

// --- rolling race: hoop, disk, sphere, frictionless block
(function(){
  const RACERS = [['hoop', 'ring', 1, 'Hoop (k² = R²)'], ['disk', 'disk', 0.5, 'Disk (k² = R²/2)'], ['sphere', 'sphere', 0.4, 'Sphere (k² = 2R²/5)'], ['block', 'block', 0, 'Sliding block (no friction)']];
  makeClip({
    id: 'c-race', speed: 0.5,
    controls: [{ key: 'th', label: 'Incline angle θ', min: 3, max: 30, step: 0.5, value: 15, unit: '°', dec: 1 }],
    reset(st){ st.hold = undefined; },
    step(st){
      const a = G0 * Math.sin(st.V.th * RAD), tEnd = Math.sqrt(2 * 2 / (a * 0.5)); // slowest (hoop) finishes at tEnd
      if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } }
    },
    draw(st){
      const cv = $('c-race-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const n = nar(cv, w, 380, 800), th = clamp(st.V.th, 0.5, 60) * RAD, L = 270, ux = Math.cos(th), uy = Math.sin(th), cellH = L * uy + 95;
      fitView(ctx, w, h, n ? [0, 0, 360, 4 * cellH] : [0, 0, 720, 2 * cellH]);
      const a = G0 * Math.sin(th), Lm = 2, S = L / Lm, R = 0.12 * S, tt = st.hold !== undefined ? st.hold : st.t;
      RACERS.forEach(([key, kind, k2, label], i) => {
        const col = n ? 0 : i % 2, row = n ? i : Math.floor(i / 2), xA = 30 + col * 360, yA = row * cellH + 50;
        txt(ctx, label, xA, yA - 30, { font: '600 12px system-ui', align: 'left' });
        const [xB, yB] = wedge(ctx, xA, yA, L, th);
        line(ctx, xB, yB - 30, xB, yB, RED, 2.5);
        // reference point: the contact point of a roller, the front face of the block; each travels Lm = 2 m to the line
        const acc = a / (1 + k2), s = Math.min(0.5 * acc * tt * tt, Lm), px = s * S;
        if (kind === 'block') block(ctx, xA + (px - 14) * ux + 14 * uy, yA + (px - 14) * uy - 14 * ux, 28, 28, th, '');
        else wheel(ctx, xA + px * ux + R * uy, yA + px * uy - R * ux, R, s / 0.12, kind);
        if (s >= Lm - 1e-9) txt(ctx, `${fmt(Math.sqrt(2 * Lm / acc), 3)} s`, xB + 8, yB - 40, { font: '600 12px system-ui', align: 'left', color: COL.c3 });
      });
      statsEvery(st, 'c-race-stats', () => RACERS.map(([key, kind, k2, label]) => [label.split(' (')[0] + ': a = g sin θ/(1 + k²/R²)', fmt(a / (1 + k2), 3) + ' m/s²', key === 'sphere']));
    }
  });
})();

/* =========================================================
   B. WORK–ENERGY
   ========================================================= */
// --- energy split for a rolling body
(function(){
  const SH = [['Hoop', 1], ['Disk', 0.5], ['Sphere', 0.4]];
  makeClip({
    id: 'c-energy', speed: 0.5,
    controls: [{ key: 'th', label: 'Incline angle θ', min: 3, max: 30, step: 0.5, value: 20, unit: '°', dec: 1 }, { key: 'm', label: 'Mass m', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'kg', dec: 2 }],
    presets: (C, st, reset) => chips5('c-energy', SH, st, reset, 'k2'),
    setup(st){ st.k2 = 0.5; },
    reset(st){ mark5('c-energy', st, 'k2', SH); st.hold = undefined; },
    step(st){
      const a = G0 * Math.sin(st.V.th * RAD) / (1 + st.k2), tEnd = Math.sqrt(2 * 2 / a);
      if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } }
    },
    draw(st){
      const cv = $('c-energy-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const n = nar(cv, w, 320, 620), V = st.V, th = clamp(V.th, 0.5, 60) * RAD, Lm = 2, L = 400, S = L / Lm, R = 0.15 * S, x0 = 30, y0 = 40, Hi = y0 + L * Math.sin(th) + 40;
      fitView(ctx, w, h, n ? [0, 0, 460, Hi + 250] : [0, 0, 720, Math.max(320, Hi)]);
      const a = G0 * Math.sin(th) / (1 + st.k2), tt = st.hold ?? st.t, s = Math.min(0.5 * a * tt * tt, Lm), v = Math.sqrt(2 * a * s);
      const ux = Math.cos(th), uy = Math.sin(th), xB = x0 + L * ux, yB = y0 + R * 1.1 + L * uy;
      wedge(ctx, x0, y0 + R * 1.1, L, th);
      wheel(ctx, x0 + s * S * ux + R * uy, y0 + R * 1.1 + s * S * uy - R * ux, R, s / 0.15, ['ring', 'disk', 'sphere'][[1, 0.5, 0.4].indexOf(st.k2)]);
      const hgt = (Lm - s) * Math.sin(th), m = V.m, Vg = m * G0 * hgt, Tt = 0.5 * m * v * v, Tr = 0.5 * m * st.k2 * v * v, E = m * G0 * Lm * Math.sin(th);
      ebars(ctx, n ? 40 : 470, n ? Hi + 30 : 60, n ? 380 : 230, n ? 180 : 200, [{ label: 'V = mgh', val: Vg, color: COL.c1, num: fmt(Vg, 3) }, { label: '½mv²', val: Tt, color: COL.c2, num: fmt(Tt, 3) }, { label: '½I_Gω²', val: Tr, color: COL.c4, num: fmt(Tr, 3) }, { label: 'total', val: Vg + Tt + Tr, color: COL.c3, num: fmt(Vg + Tt + Tr, 3) }], E, 'Energy (J)');
      statsEvery(st, 'c-energy-stats', () => [['v_G', fmt(v, 3) + ' m/s'], ['ω = v/R (R = 0.15 m)', fmt(v / 0.15, 3) + ' rad/s'], ['share of KE that is rotational', fmt(100 * st.k2 / (1 + st.k2), 3) + ' %', true], ['T + V', fmt(Vg + Tt + Tr, 4) + ' J (constant)', true]]);
    }
  });
})();

// --- friction at a no-slip contact does no work; slipping friction does
makeClip({
  id: 'c-slip', speed: 0.5,
  controls: [
    { key: 'th', label: 'Incline angle θ', min: 5, max: 60, step: 0.5, value: 30, unit: '°', dec: 1 },
    { key: 'mu', label: 'Friction coefficient μ', min: 0, max: 0.6, step: 0.01, value: 0.25, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Rolls (μ = 0.25)', apply: () => C.set({ mu: 0.25 }) }, { label: 'Slips (μ = 0.08)', apply: () => C.set({ mu: 0.08 }) }, { label: 'Ice (μ = 0)', apply: () => C.set({ mu: 0 }) }],
  reset(st){
    const V = st.V, th = V.th * RAD; st.ok = V.mu >= 0;
    st.roll = V.mu >= 2 / 7 * Math.tan(th);
    st.a = st.roll ? 5 / 7 * G0 * Math.sin(th) : G0 * (Math.sin(th) - V.mu * Math.cos(th));
    st.al = st.roll ? st.a / 0.15 : 5 * V.mu * G0 * Math.cos(th) / (2 * 0.15); // R = 0.15 m
    st.hold = undefined; st.hist = [];
  },
  step(st){
    const tEnd = Math.sqrt(2 * 2 / st.a);
    if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; st.hist = []; } }
  },
  draw(st){
    const cv = $('c-slip-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const n = nar(cv, w, 320, 620), V = st.V, th = V.th * RAD, Lm = 2, L = 380, S = L / Lm, R = 0.15 * S, x0 = 30, y0 = 40, m = 1, Hi = y0 + L * Math.sin(th) + 50;
    fitView(ctx, w, h, n ? [0, 0, 440, Hi + 250] : [0, 0, 720, Math.max(320, Hi)]);
    const tt = st.hold ?? st.t, s = Math.min(0.5 * st.a * tt * tt, Lm), te = Math.sqrt(2 * s / st.a), v = st.a * te, om = st.al * te, phi = 0.5 * st.al * te * te;
    const ux = Math.cos(th), uy = Math.sin(th);
    wedge(ctx, x0, y0 + R * 1.1, L, th);
    const cx = x0 + s * S * ux + R * uy, cy = y0 + R * 1.1 + s * S * uy - R * ux;
    wheel(ctx, cx, cy, R, phi, 'sphere');
    const slipV = v - 0.15 * om;
    txt(ctx, st.roll ? 'The sphere rolls, so its contact point is at rest.' : `The sphere slips. Its contact point slides at ${fmt(slipV, 2)} m/s.`, n ? 220 : 360, 16, { font: '600 13px system-ui', color: st.roll ? COL.c3 : RED });
    const hgt = (Lm - s) * Math.sin(th), Vg = m * G0 * hgt, Tt = 0.5 * m * v * v, Tr = 0.5 * 0.4 * m * 0.0225 * om * om, E0 = m * G0 * Lm * Math.sin(th), lost = E0 - Vg - Tt - Tr;
    ebars(ctx, n ? 30 : 450, n ? Hi + 30 : 70, n ? 380 : 260, n ? 180 : 190, [{ label: 'V', val: Vg, color: COL.c1, num: fmt(Vg, 3) }, { label: '½mv²', val: Tt, color: COL.c2, num: fmt(Tt, 3) }, { label: '½I_Gω²', val: Tr, color: COL.c4, num: fmt(Tr, 3) }, { label: 'heat', val: Math.max(lost, 0), color: RED, num: fmt(Math.max(lost, 0), 3) }], E0, 'Energy per kg (J)');
    statsEvery(st, 'c-slip-stats', () => [['rolls if μ ≥ (2/7) tan θ', fmt(2 / 7 * Math.tan(th), 3)], ['a_G', fmt(st.a, 3) + ' m/s²', true], ['friction work so far', fmt(-Math.max(lost, 0), 3) + ' J/kg', true], ['T + V', fmt(Vg + Tt + Tr, 4) + ' J/kg']]);
  }
});

/* =========================================================
   C. IMPULSE–MOMENTUM
   ========================================================= */
// --- conservation of angular momentum: masses pulled in on a spinning frame
makeClip({
  id: 'c-spin', speed: 0.5,
  controls: [
    { key: 'm', label: 'Each sliding mass m', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'I0', label: 'Frame inertia I₀', min: 0.05, max: 3, step: 0.05, value: 0.4, unit: 'kg·m²', dec: 3 }
  ],
  presets: (C, st) => [{ label: 'Pull the masses in', apply: () => { st.target = 0.15; } }, { label: 'Let them out', apply: () => { st.target = 0.8; } }],
  setup(st){ st.target = 0.8; },
  reset(st){ st.r = 0.8; st.target = 0.8; st.ang = 0; st.lastT = 0; st.H = (st.V.I0 + 2 * st.V.m * 0.64) * 2; },
  step(st){
    const dt = st.t - st.lastT; st.lastT = st.t;
    const dr = st.target - st.r; st.r += Math.sign(dr) * Math.min(Math.abs(dr), 0.35 * dt);
    st.om = st.H / (st.V.I0 + 2 * st.V.m * st.r * st.r); st.ang += st.om * dt;
  },
  draw(st){
    const cv = $('c-spin-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 340, 340]);
    const V = st.V, S = 150, cx = 170, cy = 170, a = -st.ang;
    txt(ctx, 'top view', 170, 10, { font: '12px system-ui', color: COL.muted });
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = COL.card; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    line(ctx, -0.95 * S, 0, 0.95 * S, 0, COL.spring, 5);
    [-1, 1].forEach(sg => block(ctx, sg * st.r * S, 0, 28, 28, 0, ''));
    ctx.restore();
    [-1, 1].forEach(sg => txt(ctx, 'm', cx + sg * st.r * S * Math.cos(a), cy + sg * st.r * S * Math.sin(a)));
    ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 58, -0.4, -1.6, true); ctx.stroke(); ctx.restore();
    arrow(ctx, cx + 58 * Math.cos(-1.45), cy + 58 * Math.sin(-1.45), cx + 58 * Math.cos(-1.6), cy + 58 * Math.sin(-1.6), COL.c4, 2);
    txt(ctx, 'ω', cx + 70 * Math.cos(-1), cy + 70 * Math.sin(-1), { color: COL.c4 });
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
    const I = V.I0 + 2 * V.m * st.r * st.r, pts = [];
    for (let i = 0; i <= 100; i++){ const r = 0.1 + 0.8 * i / 100; pts.push([r, st.H / (V.I0 + 2 * V.m * r * r)]); }
    plot($('c-spin-plot'), { xmin: 0.1, xmax: 0.9, ymin: 0, ymax: st.H / (V.I0 + 2 * V.m * 0.01) * 1.05, xlabel: 'radius r of the masses (m)', ylabel: 'ω (rad/s)', series: [{ pts, color: COL.c1, width: 2.4 }], points: [{ x: st.r, y: st.om, color: COL.c2, r: 6 }] });
    statsEvery(st, 'c-spin-stats', () => [['I = I₀ + 2mr²', fmt(I) + ' kg·m²'], ['ω', fmt(st.om) + ' rad/s', true], ['H_O = Iω', fmt(I * st.om, 4) + ' kg·m²/s (constant)', true], ['T = ½Iω²', fmt(0.5 * I * st.om * st.om) + ' J']]);
  }
});

// --- center of percussion
makeClip({
  id: 'c-perc', speed: 0.25,
  controls: [{ key: 'h', label: 'Impact point h (from pivot)', min: 0.05, max: 1, step: 0.01, value: 0.4, unit: '× L', dec: 3 }],
  presets: C => [{ label: 'h = 0.4L', apply: () => C.set({ h: 0.4 }) }, { label: 'h = 2L/3', apply: () => C.set({ h: 2 / 3 }) }, { label: 'h = L (the tip)', apply: () => C.set({ h: 1 }) }],
  reset(st){ st.s = [0, 0]; st.lastT = 0; st.hit = false; },
  step(st){
    const V = st.V, L = 1, M = 1, J = 1, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.t < 0.6) return;
    if (!st.hit){ st.hit = true; st.s = [0, 3 * J * V.h * L / (M * L * L)]; st.tHit = st.t; }
    st.s = stepN(s => [s[1], -1.5 * G0 / L * Math.sin(s[0])], st.s, dt);
    if (st.t > 4.5){ st.t = 0; st.lastT = 0; st.hit = false; st.s = [0, 0]; }
  },
  draw(st){
    const cv = $('c-perc-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 380, 340]);
    const V = st.V, S = 250, ox = 160, oy = 50, th = st.s[0], R = V.h * 1.5 - 1; // R/J
    ceilingPin(ctx, ox, oy);
    const tx = ox + S * Math.sin(th), ty = oy + S * Math.cos(th);
    line(ctx, ox, oy, tx, ty, COL.massEdge, 12); line(ctx, ox, oy, tx, ty, COL.mass, 8);
    ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    const cpx = ox + S * 2 / 3 * Math.sin(th), cpy = oy + S * 2 / 3 * Math.cos(th);
    ctx.save(); ctx.strokeStyle = COL.c3; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cpx, cpy, 6, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    txt(ctx, 'center of percussion', cpx + 12, cpy, { font: '11px system-ui', color: COL.c3, align: 'left' });
    const hx = ox + S * V.h * Math.sin(th), hy = oy + S * V.h * Math.cos(th);
    if (!st.hit){ const bx = ox - 150 + (st.t / 0.6) * (150 - 12); ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(bx, oy + S * V.h, 10, 0, 2 * Math.PI); ctx.fill(); }
    else {
      const since = st.t - st.tHit;
      if (since < 0.35){ ctx.fillStyle = COL.c2; ctx.globalAlpha = 1 - since / 0.35; ctx.beginPath(); ctx.arc(hx - 14, hy, 10, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
        arrow(ctx, hx - 60, hy, hx - 6, hy, COL.c2, 3); txt(ctx, 'impulse J', hx - 64, hy - 14, { font: '12px system-ui', color: COL.c2, align: 'right' });
        if (Math.abs(R) > 0.02) arrow(ctx, ox, oy + 2, ox + 70 * R, oy + 2, RED, 3.5);
        txt(ctx, Math.abs(R) > 0.02 ? `pin impulse R = ${fmt(R, 2)} J` : 'pin impulse R ≈ 0', ox + 14, oy + 30, { font: '600 12px system-ui', color: RED, align: 'left' });
      }
    }
    const pts = [[0, -1], [1, 0.5]];
    plot($('c-perc-plot'), { xmin: 0, xmax: 1, ymin: -1.1, ymax: 0.6, xlabel: 'impact point h / L', ylabel: 'pin reaction impulse / J', series: [{ pts, color: COL.c1, width: 2.4 }], vlines: [{ x: 2 / 3, color: COL.c3, label: '2L/3' }], points: [{ x: V.h, y: R, color: COL.c2, r: 6 }] });
    statsEvery(st, 'c-perc-stats', () => [['ω after impact = 3Jh/(ML²)', fmt(3 * V.h) + ' rad/s (J = 1 N·s, M = 1 kg, L = 1 m)'], ['pin impulse R = J(3h/2L − 1)', fmt(R, 3) + ' N·s', true], ['direction', Math.abs(R) < 0.01 ? 'none, because the bar was struck at the center of percussion' : R < 0 ? 'opposite to J (the pin holds the top back)' : 'same as J (the pin pulls the top along)']]);
  }
});

/* =========================================================
   WORKED-EXAMPLE ANIMATIONS
   ========================================================= */
// helper: stepped drum
function drum(ctx, x, y, R, r, ang){
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.card; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
  ctx.rotate(ang);
  ctx.strokeStyle = COL.c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r + 3, 0); ctx.lineTo(R - 3, 0); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
  txt(ctx, 'O', x - 12, y + 14, { font: 'italic 13px Georgia, serif' });
}

// Example 5.A.11: stepped drum, block A on the outer radius, block B over a pulley from the inner radius
makeClip({
  id: 'e-a11', speed: 0.5,
  controls: [
    { key: 'mA', label: 'Mass of A, m_A', min: 1, max: 50, step: 1, value: 10, unit: 'kg', dec: 2 },
    { key: 'mB', label: 'Mass of B, m_B', min: 1, max: 50, step: 1, value: 30, unit: 'kg', dec: 2 },
    { key: 'M', label: 'Drum mass M', min: 0, max: 60, step: 1, value: 20, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Radius of gyration k_O', min: 0.05, max: 0.4, step: 0.01, value: 0.25, unit: 'm', dec: 3 }
  ],
  reset(st){
    const V = st.V, r = 0.2, R = 0.4; st.ok = V.mA >= 0 && V.mB >= 0 && V.M >= 0 && (V.M * V.k * V.k + V.mA * R * R + V.mB * r * r) > 0;
    if (!st.ok) return;
    st.al = G0 * (V.mB * r - V.mA * R) / (V.M * V.k * V.k + V.mA * R * R + V.mB * r * r); // clockwise +
    st.TA = V.mA * (G0 + R * st.al); st.TB = V.mB * (G0 - r * st.al); st.hold = undefined;
    setStats('e-a11-stats', [['α (clockwise +)', fmt(st.al, 4) + ' rad/s²', true], ['α as a vector', `${fmt(-st.al, 4)} k̂ rad/s²`, true], ['a_A = Rα (upward)', fmt(R * st.al) + ' m/s²'], ['a_B = rα (downward)', fmt(r * st.al) + ' m/s²'], ['T_A', fmt(st.TA) + ' N'], ['T_B', fmt(st.TB) + ' N']]);
  },
  step(st){
    if (!st.ok) return;
    const th = 0.5 * st.al * st.t * st.t;
    if (Math.abs(0.4 * th) > 0.45 || st.t > 6){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; } }
  },
  draw(st){
    const cv = $('e-a11-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'The masses must be zero or positive, and the system must have some inertia.'); return; }
    const nr = nar(cv, w, 420, 520); fitView(ctx, w, h, nr ? [105, 40, 585, 400] : [0, 0, 640, 420]);
    const tt = st.hold ?? st.t, th = 0.5 * st.al * tt * tt, S = 200, R = 80, r = 40, ox = 220, oy = 130;
    // drum support
    pin(ctx, ox, oy, 250);
    const yA = 330 - 0.4 * th * S, yB = 250 + 0.2 * th * S, px = 520, pr = 15, py = oy - r + pr;
    cable(ctx, () => { ctx.moveTo(ox - R, oy); ctx.lineTo(ox - R, yA - 25); });
    cable(ctx, () => { ctx.moveTo(ox, oy - r); ctx.lineTo(px, py - pr); ctx.arc(px, py, pr, -Math.PI / 2, 0); ctx.lineTo(px + pr, yB - 25); });
    drum(ctx, ox, oy, R, r, th);
    line(ctx, px, py, px, py - 55, COL.ground, 4); hatch(ctx, px + 30, py - 55, px - 30, py - 55, 1, 7, 6);
    pulley(ctx, px, py, pr);
    block(ctx, ox - R, yA, 46, 50, 0, 'A'); block(ctx, px + pr, yB, 46, 50, 0, 'B');
    txt(ctx, 'R = 0.4 m,  r = 0.2 m', ox + 34, oy + R + 34, { font: '12px system-ui', color: COL.muted, align: 'left' });
    const dir = st.al > 1e-9 ? 'clockwise ↻' : st.al < -1e-9 ? 'counterclockwise ↺' : 'balanced';
    txt(ctx, `drum turns ${dir}`, 470, 380, { font: '600 13px system-ui', color: COL.c2 });
  }
});

// Example 5.A.15: sphere rolling down an incline
makeClip({
  id: 'e-a15', speed: 0.5,
  controls: [
    { key: 'th', label: 'Incline angle θ', min: 5, max: 60, step: 0.5, value: 30, unit: '°', dec: 1 },
    { key: 'mu', label: 'Static friction μ_s', min: 0, max: 1, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'm', label: 'Mass m', min: 0.5, max: 20, step: 0.1, value: 5, unit: 'kg', dec: 2 }
  ],
  reset(st){
    const V = st.V, th = V.th * RAD; st.roll = V.mu >= 2 / 7 * Math.tan(th);
    st.a = st.roll ? 5 / 7 * G0 * Math.sin(th) : G0 * (Math.sin(th) - V.mu * Math.cos(th));
    st.f = st.roll ? 2 / 7 * V.m * G0 * Math.sin(th) : V.mu * V.m * G0 * Math.cos(th);
    st.al = st.roll ? st.a / 0.15 : 5 * st.f / (2 * V.m * 0.15);
    st.hold = undefined;
    setStats('e-a15-stats', [['a_G', fmt(st.a, 4) + ' m/s²' + (st.roll ? ' = (5/7) g sin θ' : ' (slipping)'), true], ['friction f (up the slope)', fmt(st.f, 4) + ' N' + (st.roll ? ' = (2/7) mg sin θ' : ' = μN'), true], ['N = mg cos θ', fmt(V.m * G0 * Math.cos(th)) + ' N'], ['rolling requires μ_s ≥ (2/7) tan θ', fmt(2 / 7 * Math.tan(th), 3) + (st.roll ? ' (satisfied)' : ' (not satisfied, so it slips)')]]);
  },
  step(st){ const tEnd = Math.sqrt(2 * 1.8 / Math.max(st.a, 1e-6)); if (st.t > tEnd){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('e-a15-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const V = st.V, th = clamp(V.th, 0, 80) * RAD, Lm = 2, L = 400, S = L / Lm, R = 0.15 * S, x0 = 30, y0 = 70;
    const n = nar(cv, w, 380, 700), Hs = y0 + L * Math.sin(th) + 40;
    // the scene: incline and rolling sphere
    fitView(ctx, w, h, n ? [0, 0, 470, Hs + 330] : [0, 0, 740, Math.max(Hs, 360)]);
    const tt = st.hold ?? st.t, s = Math.min(0.5 * Math.max(st.a, 0) * tt * tt, 0.88 * Lm), te = st.a > 0 ? Math.sqrt(2 * s / st.a) : 0, phi = 0.5 * st.al * te * te;
    const ux = Math.cos(th), uy = Math.sin(th), nx = uy, ny = -ux;
    const xB = x0 + L * ux, yB = y0 + L * uy;
    ctx.save(); ctx.fillStyle = 'rgba(125,119,107,.12)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xB, yB); ctx.lineTo(x0, yB); ctx.closePath(); ctx.fill(); ctx.restore();
    line(ctx, x0, y0, xB, yB, COL.ground, 2); line(ctx, x0, yB, xB + 20, yB, COL.ground, 1.6);
    ctx.save(); ctx.strokeStyle = COL.muted; ctx.beginPath(); ctx.arc(xB, yB, 46, Math.PI, Math.PI + th); ctx.stroke(); ctx.restore();
    txt(ctx, 'θ', xB - 60 * Math.cos(th / 2), yB - 60 * Math.sin(th / 2));
    const px = x0 + s * S * ux, py = y0 + s * S * uy;
    wheel(ctx, px + R * nx, py + R * ny, R, phi, 'sphere');
    txt(ctx, st.roll ? 'The sphere rolls without slipping.' : 'μ_s is too small, so the sphere slips.', n ? 235 : 230, 24, { font: '600 13px system-ui', color: st.roll ? COL.c3 : RED });
    // the free-body diagram, drawn separately (the body is cut free from the incline)
    const fx = n ? 235 : 610, fy = n ? Hs + 140 : 170, Rf = 40, Lw = 125, mgN = V.m * G0;
    if (n) line(ctx, 20, Hs + 10, 450, Hs + 10, COL.axis, 1); else line(ctx, 470, 40, 470, Math.max(Hs, 360) - 20, COL.axis, 1);
    txt(ctx, 'Free-body diagram', fx, n ? Hs + 34 : 52, { font: '600 13px system-ui' });
    ctx.save(); ctx.strokeStyle = COL.massEdge; ctx.fillStyle = COL.mass; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx, fy, Rf, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, 2 * Math.PI); ctx.fill();
    txt(ctx, 'G', fx - 12, fy - 10, { font: 'italic 14px Georgia, serif' });
    const cx = fx - Rf * nx, cy = fy - Rf * ny; // contact point C
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI); ctx.fill();
    txt(ctx, 'C', cx + 12 * ux - 6 * nx, cy + 12 * uy - 6 * ny + 4, { font: 'italic 13px Georgia, serif', color: COL.muted });
    const Lmg = Lw, LN = Lw * Math.cos(th), Lf = Math.max(Lw * st.f / mgN, 10);
    arrow(ctx, fx, fy, fx, fy + Lmg, COL.c2, 2.6); txt(ctx, 'mg', fx + 8, fy + Lmg - 6, { color: COL.c2, align: 'left' });
    arrow(ctx, cx - LN * nx, cy - LN * ny, cx, cy, COL.c1, 2.6); txt(ctx, 'N', cx - (LN * 0.6) * nx - 14 * ux, cy - (LN * 0.6) * ny - 14 * uy, { color: COL.c1 });
    arrow(ctx, cx, cy, cx - Lf * ux, cy - Lf * uy, RED, 2.6); txt(ctx, 'f', cx - (Lf + 12) * ux + 8 * nx, cy - (Lf + 12) * uy + 8 * ny, { color: RED });
    // axes
    const ax = n ? fx + 120 : fx + 70, ay = n ? fy - 60 : fy - 95;
    arrow(ctx, ax, ay, ax + 34 * ux, ay + 34 * uy, COL.muted, 1.6); txt(ctx, 'x', ax + 44 * ux, ay + 44 * uy, { font: 'italic 13px Georgia, serif', color: COL.muted });
    arrow(ctx, ax, ay, ax + 34 * nx, ay + 34 * ny, COL.muted, 1.6); txt(ctx, 'y', ax + 44 * nx, ay + 44 * ny, { font: 'italic 13px Georgia, serif', color: COL.muted });
    txt(ctx, 'Arrow lengths are to scale.', fx, n ? fy + 150 : fy + 170, { font: '11px system-ui', color: COL.muted });
  }
});

// Example 5.B.1: stepped drum with both blocks hanging
makeClip({
  id: 'e-b1', speed: 0.5,
  controls: [
    { key: 'mA', label: 'Mass of A, m_A', min: 1, max: 50, step: 1, value: 10, unit: 'kg', dec: 2 },
    { key: 'mB', label: 'Mass of B, m_B', min: 1, max: 50, step: 1, value: 30, unit: 'kg', dec: 2 },
    { key: 'M', label: 'Drum mass M', min: 0, max: 60, step: 1, value: 20, unit: 'kg', dec: 2 },
    { key: 'd', label: 'Drop of B', min: 0.2, max: 1.5, step: 0.05, value: 1.5, unit: 'm', dec: 3 }
  ],
  reset(st){
    const V = st.V, r = 0.2, R = 0.4, k = 0.25; st.Ieff = V.M * k * k + V.mA * R * R + V.mB * r * r; st.ok = st.Ieff > 0 && V.d > 0;
    if (!st.ok) return;
    st.net = G0 * (V.mB * r - V.mA * R); st.al = st.net / st.Ieff; st.hold = undefined;
    const th = V.d / r, om2 = 2 * st.net * th / st.Ieff; st.vB = om2 > 0 ? r * Math.sqrt(om2) : NaN;
    const notes = st.net <= 0 ? [{ level: 'warn', html: 'With these masses m<sub>A</sub>R ≥ m<sub>B</sub>r, so block B does not drop. The drum either stays balanced or turns the other way, and B rises.' }] : [];
    showNotes('e-b1-notes', notes);
  },
  step(st){
    if (!st.ok) return;
    const V = st.V, sB = 0.5 * 0.2 * st.al * st.t * st.t;
    if (Math.abs(sB) >= V.d || st.t > 8){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.3){ st.t = 0; st.hold = undefined; } }
  },
  draw(st){
    const cv = $('e-b1-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Please enter positive values.'); return; }
    const n = nar(cv, w, 460, 700);
    fitView(ctx, w, h, n ? [20, 30, 420, 720] : [0, 0, 720, 470]);
    const V = st.V, r = 0.2, R = 0.4, tt = st.hold ?? st.t;
    let th = 0.5 * st.al * tt * tt; if (Math.abs(r * th) > V.d) th = Math.sign(th) * V.d / r;
    // one scale for everything (90 px per metre), so the cables wind on and off the drum exactly as the blocks move
    const Sb = 90, ox = 180, oy = 75, Rp = R * Sb, rp = r * Sb, up = st.net >= 0;
    ceilingPin(ctx, ox, oy, 45);
    const yA0 = up ? 420 : 150, yB0 = up ? 160 : 295, yA = yA0 - R * th * Sb, yB = yB0 + r * th * Sb;
    cable(ctx, () => { ctx.moveTo(ox - Rp, oy); ctx.lineTo(ox - Rp, yA - 22); });
    cable(ctx, () => { ctx.moveTo(ox + rp, oy); ctx.lineTo(ox + rp, yB - 22); });
    drum(ctx, ox, oy, Rp, rp, th);
    block(ctx, ox - Rp, yA, 40, 44, 0, 'A'); block(ctx, ox + rp, yB, 40, 44, 0, 'B');
    line(ctx, ox + rp + 26, yB0, ox + rp + 46, yB0, COL.muted, 1, [3, 3]);
    txt(ctx, 'start of B', ox + rp + 50, yB0, { font: '11px system-ui', color: COL.muted, align: 'left' });
    line(ctx, ox - Rp - 46, yA0, ox - Rp - 26, yA0, COL.muted, 1, [3, 3]);
    txt(ctx, 'start of A', ox - Rp - 50, yA0, { font: '11px system-ui', color: COL.muted, align: 'right' });
    const omega = Math.sign(st.al) * Math.sqrt(Math.max(0, 2 * st.al * th)); // constant α from rest: ω² = 2αθ
    const vA = R * omega, vB = r * omega, TA = 0.5 * V.mA * vA * vA, TB = 0.5 * V.mB * vB * vB, TD = 0.5 * V.M * 0.0625 * omega * omega;
    const UB = V.mB * G0 * r * th, UA = -V.mA * G0 * R * th, Emax = Math.max(Math.abs(V.mB * G0 * V.d), Math.abs(V.mA * G0 * R * V.d / r), 1);
    const bx = n ? 70 : 360, by = n ? 500 : 70; ebars(ctx, bx, by, 340, n ? 170 : 300, [{ label: 'U_B', val: UB, color: COL.c3, num: fmt(UB, 3) }, { label: 'U_A', val: UA, color: RED, num: fmt(UA, 3) }, { label: 'T_A', val: TA, color: COL.c1, num: fmt(TA, 3) }, { label: 'T_B', val: TB, color: COL.c2, num: fmt(TB, 3) }, { label: 'T_{drum}', val: TD, color: COL.c4, num: fmt(TD, 3) }], Emax, 'Work done and kinetic energy (J)');
    txt(ctx, 'U = work done by a weight, T = kinetic energy.', bx + 170, by + (n ? 202 : 334), { font: '11px system-ui', color: COL.muted });
    txt(ctx, 'A faded bar means negative work.', bx + 170, by + (n ? 218 : 350), { font: '11px system-ui', color: COL.muted });
    statsEvery(st, 'e-b1-stats', () => [['B has dropped', fmt(r * th, 3) + ' m'], ['v_B now', fmt(Math.abs(vB), 4) + ' m/s'], [`v_B after ${fmt(V.d, 3)} m`, isFinite(st.vB) ? fmt(st.vB, 4) + ' m/s' : 'B never drops', true], ['U_{1→2} − (T_2 − T_1)', (Math.abs(UB + UA - TA - TB - TD) < 1e-6 ? '0' : fmt(UB + UA - TA - TB - TD, 3)) + ' J']]);
  }
});

// Example 5.B.4: rectangular plate swinging about a corner pin
makeClip({
  id: 'e-b4', speed: 0.5,
  controls: [
    { key: 'd', label: 'Plate height d', min: 0.1, max: 2, step: 0.05, value: 1, unit: 'm', dec: 3 },
    { key: 'r', label: 'Width / height ratio', min: 0.3, max: 3, step: 0.05, value: 1.5, unit: '', dec: 3 }
  ],
  reset(st){
    const V = st.V; st.ok = V.d > 0 && V.r > 0; if (!st.ok) return;
    const b = V.r * V.d; st.rho = Math.hypot(b / 2, V.d / 2); st.IO = (b * b + V.d * V.d) / 12 + st.rho * st.rho; // per unit mass
    st.phi0 = -Math.atan2(b / 2, V.d / 2); st.s = [st.phi0, 0]; st.lastT = 0; st.hist = [];
    st.wmax = Math.sqrt(2 * G0 * (st.rho - V.d / 2) / st.IO);
  },
  step(st){
    if (!st.ok) return;
    const dt = st.t - st.lastT; st.lastT = st.t;
    st.s = stepN(s => [s[1], -G0 * st.rho / st.IO * Math.sin(s[0])], st.s, dt);
    st.hist.push([(st.s[0] - st.phi0) / RAD, st.s[1]]); if (st.hist.length > 1500) st.hist.shift();
  },
  draw(st){
    const cv = $('e-b4-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Please enter positive values.'); return; }
    fitView(ctx, w, h, [0, 0, 600, 340]);
    const V = st.V, b = V.r * V.d, S = 285 / Math.hypot(b, V.d), ox = 300, oy = 40, rot = st.s[0] - st.phi0; // CCW + in world
    ceilingPin(ctx, ox, oy - 0);
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(-rot);
    ctx.fillStyle = 'rgba(125,119,107,.55)'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
    ctx.fillRect(-b * S, 0, b * S, V.d * S); ctx.strokeRect(-b * S, 0, b * S, V.d * S);
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(-b * S / 2, V.d * S / 2, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
    ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    txt(ctx, 'O', ox + 18, oy + 8, { font: 'italic 14px Georgia, serif' });
    line(ctx, ox, oy, ox, oy + st.rho * S + 20, COL.muted, 1, [4, 4]);
    const amp = -st.phi0 / RAD * 2, pts = []; for (let i = 0; i <= 200; i++){ const ph = st.phi0 + (2 * -st.phi0) * i / 200; const w2 = 2 * G0 * st.rho * (Math.cos(ph) - Math.cos(st.phi0)) / st.IO; pts.push([(ph - st.phi0) / RAD, Math.sqrt(Math.max(w2, 0))]); }
    plot($('e-b4-plot'), { xmin: 0, xmax: amp, ymin: -st.wmax * 1.15, ymax: st.wmax * 1.15, xlabel: 'rotation of the plate (°)', ylabel: 'ω (rad/s)', series: [{ pts, color: COL.c2, width: 2, dash: [5, 4] }, { pts: pts.map(p => [p[0], -p[1]]), color: COL.c2, width: 2, dash: [5, 4] }, { pts: st.hist, color: COL.c1, width: 2.4 }],
      hlines: [{ y: st.wmax, color: COL.c3 }], vlines: [{ x: -st.phi0 / RAD, color: COL.c3, label: 'G below O' }], points: [{ x: (st.s[0] - st.phi0) / RAD, y: st.s[1], color: COL.c1, r: 6 }] });
    statsEvery(st, 'e-b4-stats', () => [['I_O = m(b² + d²)/12 + mρ²', fmt(st.IO / (V.d * V.d), 4) + ' m d²'], ['ω now', fmt(Math.abs(st.s[1]), 4) + ' rad/s'], ['ω_max = √(2mg(ρ − d/2)/I_O)', fmt(st.wmax, 4) + ' rad/s', true], ['ω_max √(d/g)', fmt(st.wmax * Math.sqrt(V.d / G0), 4), true]]);
  }
});

// Example 5.C.5: bullet into a pendulum
makeClip({
  id: 'e-c5', speed: 0.1,
  controls: [
    { key: 'vb', label: 'Bullet speed v_{b1}', min: 50, max: 2000, step: 10, value: 1500, unit: 'ft/s', dec: 1 },
    { key: 'h', label: 'Impact distance h', min: 0.5, max: 4.5, step: 0.05, value: 4, unit: 'ft', dec: 3 },
    { key: 'm', label: 'Bullet mass m', min: 0.01, max: 0.5, step: 0.01, value: 0.1, unit: 'slug', dec: 3 },
    { key: 'M', label: 'Pendulum mass M', min: 0.5, max: 10, step: 0.1, value: 2, unit: 'slug', dec: 3 }
  ],
  reset(st){
    const V = st.V, kO = 3, Lg = 3, g = 32.2; st.ok = V.m > 0 && V.M > 0;
    if (!st.ok) return;
    st.IO = V.M * kO * kO + V.m * V.h * V.h; st.w2 = V.m * V.vb * V.h / st.IO;
    st.K = (V.M * g * Lg + V.m * g * V.h); st.s = [0, 0]; st.hit = false; st.lastT = 0;
    const over = 0.5 * st.IO * st.w2 * st.w2 > 2 * st.K;
    const thmax = over ? null : Math.acos(1 - 0.5 * st.IO * st.w2 * st.w2 / st.K) / RAD;
    const T1 = 0.5 * V.m * V.vb * V.vb, T2 = 0.5 * st.IO * st.w2 * st.w2;
    setStats('e-c5-stats', [['ω_2 = m v_{b1} h / (M k_O² + m h²)', fmt(st.w2, 4) + ' rad/s', true], ['I_O after impact', fmt(st.IO, 4) + ' slug·ft²'], ['KE lost in the impact', fmt(100 * (1 - T2 / T1), 3) + ' %'], ['after impact', over ? 'enough energy to swing over the top' : `swings up to ${fmt(thmax, 3)}°`]]);
  },
  step(st){
    if (!st.ok) return;
    const dt = st.t - st.lastT; st.lastT = st.t;
    if (st.t < 0.06) return;
    if (!st.hit){ st.hit = true; st.s = [0, st.w2]; }
    st.s = stepN(s => [s[1], -st.K / st.IO * Math.sin(s[0])], st.s, dt, 0.0005);
    if (st.t > 1.6){ st.t = 0; st.lastT = 0; st.hit = false; st.s = [0, 0]; }
  },
  draw(st){
    const cv = $('e-c5-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'The masses must be positive.'); return; }
    fitView(ctx, w, h, [10, 15, 490, 400]);
    const V = st.V, S = 38, ox = 230, oy = 205, th = st.s[0], Ltot = 4.8;
    ceilingPin(ctx, ox, oy, 30);
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(th);
    ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = COL.fg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(18, Ltot * S); ctx.lineTo(-18, Ltot * S); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(0, 3 * S, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(0, V.h * S, 4, 0, 2 * Math.PI); ctx.fill();
    if (st.hit){ ctx.fillStyle = COL.fg; ctx.fillRect(0, V.h * S - 4, 10, 8); }
    ctx.restore();
    // labels drawn upright, beside the rotating pendulum
    const W = (d, off) => [ox - d * S * Math.sin(th) + off * Math.cos(th), oy + d * S * Math.cos(th) + off * Math.sin(th)];
    const [gxL, gyL] = W(3, -30); txt(ctx, 'G', gxL, gyL, { font: 'italic 14px Georgia, serif' });
    const [axL, ayL] = W(V.h, 32); txt(ctx, 'A', axL, ayL, { font: 'italic 14px Georgia, serif', color: COL.c2 });
    pinDot(ctx, ox, oy);
    txt(ctx, 'O', ox - 26, oy - 4, { font: 'italic 14px Georgia, serif' });
    if (!st.hit){ const bx = ox + 260 - st.t / 0.06 * (260 - 14); ctx.fillStyle = COL.fg; ctx.fillRect(bx, oy + V.h * S - 4, 16, 8); arrow(ctx, bx + 60, oy + V.h * S - 16, bx + 24, oy + V.h * S - 16, COL.c1, 2); txt(ctx, 'v_{b1}', bx + 64, oy + V.h * S - 26, { font: 'italic 13px Georgia, serif', color: COL.c1, align: 'left' }); }
    txt(ctx, 'Slow motion. The bullet’s flight is not to scale in time.', 250, 394, { font: '11px system-ui', color: COL.muted });
  }
});

// Example 5.C.6: square block hits a small step and tips
makeClip({
  id: 'e-c6', speed: 0.5,
  controls: [
    { key: 'a', label: 'Block side a', min: 0.2, max: 1, step: 0.01, value: 0.5, unit: 'm', dec: 3 },
    { key: 'v', label: 'Speed v before impact', min: 0.2, max: 5, step: 0.01, value: 2, unit: 'm/s', dec: 3 }
  ],
  presets: C => [{ label: 'v = 0.95 v_crit', apply: () => C.set({ v: 0.95 * Math.sqrt(8 * G0 * C.v.a * (Math.SQRT2 - 1) / 3) }) }, { label: 'v = v_crit', apply: () => C.set({ v: 1.0005 * Math.sqrt(8 * G0 * C.v.a * (Math.SQRT2 - 1) / 3) }) }, { label: 'v = 1.2 v_crit', apply: () => C.set({ v: 1.2 * Math.sqrt(8 * G0 * C.v.a * (Math.SQRT2 - 1) / 3) }) }],
  reset(st){
    const V = st.V; st.ok = V.a > 0 && V.v > 0; if (!st.ok) return;
    st.vc = Math.sqrt(8 * G0 * V.a * (Math.SQRT2 - 1) / 3); st.w = 3 * V.v / (4 * V.a);
    st.s = [Math.PI / 4, 0]; st.phase = 0; st.lastT = 0; st.hold = undefined; st.outcome = '';
    setStats('e-c6-stats', [['v_{crit} = √(8ga(√2 − 1)/3)', fmt(st.vc, 4) + ' m/s', true], ['ω just after impact = 3v/(4a)', fmt(st.w, 4) + ' rad/s', true], ['KE lost in the impact', '62.5 % (always)'], ['v / v_{crit}', fmt(V.v / st.vc, 4)]]);
  },
  step(st){
    if (!st.ok) return;
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    if (st.hold !== undefined){ if (st.t > st.hold + 1.2){ st.t = 0; st.lastT = 0; st.s = [Math.PI / 4, 0]; st.phase = 0; st.hold = undefined; st.outcome = ''; } return; }
    if (st.t < 0.5) return;
    if (st.phase === 0){ st.phase = 1; st.s = [Math.PI / 4, st.w]; }
    const k = 3 * G0 / (2 * Math.SQRT2 * V.a);
    st.s = stepN(s => [s[1], -k * Math.cos(s[0])], st.s, dt);
    if (st.s[0] >= 3 * Math.PI / 4){ st.s = [3 * Math.PI / 4, 0]; st.hold = st.t; st.outcome = 'The block tipped over the step.'; }
    else if (st.s[0] <= Math.PI / 4 && st.s[1] < 0){ st.s = [Math.PI / 4, 0]; st.hold = st.t; st.outcome = 'The block fell back.'; }
    st.maxphi = Math.max(st.maxphi || 0, st.s[0]);
  },
  draw(st){
    const cv = $('e-c6-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Please enter positive values.'); return; }
    const V = st.V, S = 200, ox = 300, oy = 290, A = V.a * S, rho = A / Math.SQRT2, n = w < 560;
    fitView(ctx, w, h, n ? [Math.max(0, ox - 1.5 * A - 20), Math.max(0, oy - 1.5 * A - 40), Math.min(640, ox + 2.2 * A + 20), 320] : [0, 0, 640, 320]);
    hatch(ctx, 20, oy, 620, oy, 1);
    ctx.save(); ctx.fillStyle = '#7d776b'; ctx.fillRect(ox - 24, oy - 7, 24, 7); ctx.restore(); // the small step, fixed to the floor
    txt(ctx, 'O', ox - 4, oy + 14, { font: 'italic 13px Georgia, serif' }); txt(ctx, 'smooth', 520, oy - 10, { font: 'italic 12px Georgia, serif', color: COL.muted });
    let cx, cy, ang;
    if (st.phase === 0){ const x = V.v * Math.max(0.5 - st.t, 0) * S; cx = ox + A / 2 + x; cy = oy - A / 2; ang = 0;
      arrow(ctx, cx + 40, cy - A / 2 - 20, cx - 10, cy - A / 2 - 20, COL.c1, 2.5); txt(ctx, 'v', cx + 48, cy - A / 2 - 22, { color: COL.c1, align: 'left' }); }
    else { const p = st.s[0]; cx = ox + rho * Math.cos(p); cy = oy - rho * Math.sin(p); ang = -(p - Math.PI / 4); }
    block(ctx, cx, cy, A, A, ang, '');
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', cx + 10, cy - 8, { font: 'italic 13px Georgia, serif' });
    line(ctx, ox, oy, ox, oy - Math.SQRT2 * A * 0.5 - 30, COL.c3, 1, [4, 4]);
    const msg = st.outcome || (st.phase === 1 ? 'The block rotates about O.' : 'The block slides toward the step.');
    txt(ctx, msg, n ? ox : 320, n ? Math.max(14, oy - 1.5 * A - 26) : 20, { font: '600 13px system-ui', color: st.outcome === 'The block tipped over the step.' ? COL.c2 : COL.fg });
  }
});

/* =========================================================
   More Newton–Euler concept clips
   ========================================================= */
// small helper: curved moment arrow around (x, y). ccw = counterclockwise on screen
function momentArrow(ctx, x, y, r, ccw, col, label){
  const a0 = ccw ? 0.5 : -3.6, a1 = ccw ? -3.6 : 0.5;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, r, a0, a1, ccw); ctx.stroke(); ctx.restore();
  const ex = x + r * Math.cos(a1), ey = y + r * Math.sin(a1), tg = ccw ? [Math.sin(a1), -Math.cos(a1)] : [-Math.sin(a1), Math.cos(a1)];
  arrow(ctx, ex - 9 * tg[0], ey - 9 * tg[1], ex, ey, col, 2.2);
  if (label) txt(ctx, label, x, y - r - 12, { color: col });
}

// --- 1. moment of inertia: the same torque on two rotors with different mass placement
makeClip({
  id: 'c-inertia', speed: 0.5,
  controls: [
    { key: 'M', label: 'Applied moment M', min: 0.1, max: 3, step: 0.05, value: 0.5, unit: 'N·m', dec: 3 },
    { key: 'm', label: 'Each sliding mass m', min: 0.1, max: 3, step: 0.05, value: 0.5, unit: 'kg', dec: 3 },
    { key: 'r1', label: 'Radius r_1 (left rotor)', min: 0.03, max: 0.5, step: 0.01, value: 0.1, unit: 'm', dec: 3 },
    { key: 'r2', label: 'Radius r_2 (right rotor)', min: 0.03, max: 0.5, step: 0.01, value: 0.4, unit: 'm', dec: 3 }
  ],
  presets: C => [{ label: 'Equal radii', apply: () => C.set({ r1: 0.25, r2: 0.25 }) }, { label: 'Radius doubled', apply: () => C.set({ r1: 0.2, r2: 0.4 }) }, { label: 'Near the hub vs. at the tip', apply: () => C.set({ r1: 0.05, r2: 0.5 }) }],
  reset(st){
    const V = st.V, I0 = 0.01; st.ok = V.m >= 0;
    st.I1 = I0 + 2 * V.m * V.r1 * V.r1; st.I2 = I0 + 2 * V.m * V.r2 * V.r2; st.a1 = V.M / st.I1; st.a2 = V.M / st.I2; st.hold = undefined;
    setStats('c-inertia-stats', [['I_1 = I_{hub} + 2m r_1²', fmt(st.I1, 4) + ' kg·m²'], ['I_2 = I_{hub} + 2m r_2²', fmt(st.I2, 4) + ' kg·m²'], ['α_1 = M / I_1', fmt(st.a1, 4) + ' rad/s²', true], ['α_2 = M / I_2', fmt(st.a2, 4) + ' rad/s²', true], ['α_1 / α_2', fmt(st.a1 / st.a2, 3)]]);
  },
  step(st){
    const slow = Math.min(st.a1, st.a2), tEnd = Math.sqrt(2 * 2 * Math.PI * 1.5 / slow);
    if (st.t > Math.min(tEnd, 9)){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1.2){ st.t = 0; st.hold = undefined; } }
  },
  draw(st){
    const cv = $('c-inertia-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const n = nar(cv, w, 320, 600), V = st.V, tt = st.hold ?? st.t, S = 230;
    fitView(ctx, w, h, n ? [0, 0, 360, 620] : [0, 0, 720, 320]);
    [[st.a1, V.r1, 'r_1', 1], [st.a2, V.r2, 'r_2', 2]].forEach(([al, r, rl, k], i) => {
      const cx = n ? 180 : 180 + 360 * i, cy = n ? 160 + 300 * i : 170, th = 0.5 * al * tt * tt;
      txt(ctx, `Rotor ${k}: masses at ${rl} = ${fmt(r, 3)} m`, cx, cy - 145, { font: '600 13px system-ui' });
      ctx.save(); ctx.strokeStyle = COL.grid; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(cx, cy, r * S, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
      pin(ctx, cx, cy, 120);
      momentArrow(ctx, cx, cy, 34, true, COL.c2, '');
      txt(ctx, 'M', cx - 46, cy - 30, { color: COL.c2 });
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-th);
      line(ctx, -0.52 * S, 0, 0.52 * S, 0, COL.spring, 5);
      [-1, 1].forEach(sg => { ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(sg * r * S, 0, 7 + 6 * Math.sqrt(V.m), 0, 2 * Math.PI); ctx.fill(); });
      ctx.restore();
      ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      txt(ctx, `${fmt(th / (2 * Math.PI), 2)} turns`, cx, cy + 138, { font: '12px system-ui', color: COL.muted });
    });
  }
});

// --- 2. forces at a pin: a bar released from rest, pinned at one end
makeClip({
  id: 'c-pinforce', speed: 0.5,
  controls: [
    { key: 'th0', label: 'Release angle θ_0 below horizontal', min: 0, max: 80, step: 1, value: 0, unit: '°', dec: 1 },
    { key: 'L', label: 'Bar length L', min: 0.3, max: 2, step: 0.05, value: 1, unit: 'm', dec: 2 }
  ],
  reset(st){ st.s = [st.V.th0 * RAD, 0]; st.lastT = 0; },
  step(st){
    const V = st.V, dt = st.t - st.lastT; st.lastT = st.t;
    st.s = stepN(s => [s[1], 1.5 * G0 / V.L * Math.cos(s[0])], st.s, dt);
  },
  draw(st){
    const cv = $('c-pinforce-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 380, 360]);
    const V = st.V, th = st.s[0], th0 = V.th0 * RAD, S = 140, ox = 190, oy = 120;
    // reactions per unit mg (canvas coordinates, y down)
    const reac = q => { const w2 = 3 * G0 / V.L * (Math.sin(q) - Math.sin(th0)), al = 1.5 * G0 / V.L * Math.cos(q);
      const Or = -(V.L / 2) * w2 / G0 - Math.sin(q), Ot = (V.L / 2) * al / G0 - Math.cos(q);
      return [Or * Math.cos(q) - Ot * Math.sin(q), Or * Math.sin(q) + Ot * Math.cos(q)]; };
    const [Ox, Oy] = reac(th);
    ceilingPin(ctx, ox, oy, 30);
    const ex = ox + S * Math.cos(th), ey = oy + S * Math.sin(th), gx = ox + S / 2 * Math.cos(th), gy = oy + S / 2 * Math.sin(th);
    line(ctx, ox, oy, ex, ey, COL.massEdge, 12); line(ctx, ox, oy, ex, ey, COL.mass, 8);
    pinDot(ctx, ox, oy);
    txt(ctx, 'O', ox - 24, oy - 6, { font: 'italic 14px Georgia, serif' });
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 2 * Math.PI); ctx.fill();
    const k = 45; // pixels per mg
    arrow(ctx, gx, gy, gx, gy + k, COL.c2, 2.6); { const lt = Math.cos(th) > 0; txt(ctx, 'mg', gx + (lt ? -8 : 8), gy + k - 4, { color: COL.c2, align: lt ? 'right' : 'left' }); }
    const mag = Math.hypot(Ox, Oy);
    if (mag > 0.02){ arrow(ctx, ox, oy, ox + k * Ox, oy + k * Oy, RED, 3); txt(ctx, 'pin force', ox + k * Ox + (Ox >= 0 ? 8 : -8), oy + k * Oy - 10, { font: '600 12px system-ui', color: RED, align: Ox >= 0 ? 'left' : 'right' }); }
    // plot of the vertical pin force over the swing
    const pts = [], pts2 = [];
    for (let i = 0; i <= 200; i++){ const q = th0 + (Math.PI - 2 * th0) * i / 200, [a, b] = reac(q); pts.push([q / RAD, -b]); pts2.push([q / RAD, a]); }
    plot($('c-pinforce-plot'), { xmin: th0 / RAD, xmax: 180 - th0 / RAD, ymin: -1.6, ymax: 2.8, xlabel: 'angle of the bar below horizontal θ (°)', ylabel: 'pin force / mg',
      series: [{ pts, color: COL.c1, width: 2.4 }, { pts: pts2, color: COL.c3, width: 2, dash: [5, 4] }], hlines: [{ y: 1, color: COL.c2 }],
      points: [{ x: th / RAD, y: -Oy, color: COL.c1, r: 6 }, { x: th / RAD, y: Ox, color: COL.c3, r: 5 }] });
    statsEvery(st, 'c-pinforce-stats', () => [['θ', fmt(th / RAD, 3) + '°'], ['upward pin force O_y', fmt(-Oy, 3) + ' mg', true], ['horizontal pin force O_x', fmt(Ox, 3) + ' mg', true], ['size of the pin force |O|', fmt(Math.hypot(Ox, Oy), 3) + ' mg']]);
  }
});

// --- 3. a pushed crate: it slides, or it tips about its front edge (full rigid-body simulation)
// Crate: mass m, width b, height H. Push P is horizontal and acts on the rear face at height hH.
// Phase 'flat': both bottom edges touch the floor, no rotation. Phase 'tip': only the front edge C touches.
// Friction: one coefficient μ for sticking and sliding. Angles: psi = forward tilt (clockwise on screen).
const TIP = { m: 20, b: 0.6, H: 1.0 };
TIP.IG = TIP.m * (TIP.b * TIP.b + TIP.H * TIP.H) / 12;
function tipFlat(st){
  const V = st.V, { m, b, H } = TIP, mg = m * G0;
  let f, a;
  if (st.vx > 1e-9){ f = V.mu * mg; a = (V.P - f) / m; }
  else if (V.P > V.mu * mg){ f = V.mu * mg; a = (V.P - f) / m; }
  else { f = V.P; a = 0; }
  const D = (2 / b) * (V.P * (V.h * H - H / 2) + f * H / 2);
  return { f, a, N1: (mg - D) / 2, N2: (mg + D) / 2 };
}
function tipSolve(st){
  // returns accelerations and contact forces at the front edge C for the tipping phase
  const V = st.V, { m, b, H, IG } = TIP, mg = m * G0, c = Math.cos(st.psi), s = Math.sin(st.psi), w = st.w;
  const rx = -b / 2 * c + H / 2 * s, ry = b / 2 * s + H / 2 * c;          // G relative to C
  const rPy = b * s + V.h * H * c;                                          // height of the push point above C
  const stick = () => { const pdd = (rx * mg + rPy * V.P) / (IG + m * (rx * rx + ry * ry));
    return { pdd, xdd: 0, F: m * pdd * ry - m * w * w * rx - V.P, N: mg - m * pdd * rx - m * w * w * ry }; };
  const slide = sg => { const k = -rx - sg * V.mu * ry;
    const pdd = (k * (mg - m * w * w * ry) - (rPy - ry) * V.P) / (k * m * rx - IG);
    const N = mg - m * pdd * rx - m * w * w * ry, F = -sg * V.mu * N;
    return { pdd, N, F, xdd: (V.P + F) / m - pdd * ry + w * w * rx }; };
  if (Math.abs(st.vx) > 1e-6) return slide(Math.sign(st.vx));
  const S = stick(); if (Math.abs(S.F) <= V.mu * S.N + 1e-9) return S;
  return slide(-Math.sign(S.F));
}
makeClip({
  id: 'c-tip', speed: 0.5,
  controls: [
    { key: 'P', label: 'Push P', min: 0, max: 300, step: 1, value: 120, unit: 'N', dec: 1 },
    { key: 'h', label: 'Height of the push h / H', min: 0, max: 1, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'mu', label: 'Friction coefficient μ', min: 0, max: 1, step: 0.01, value: 0.3, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Push low', apply: () => C.set({ h: 0.2 }) }, { label: 'Push at mid-height', apply: () => C.set({ h: 0.5 }) }, { label: 'Push at the top', apply: () => C.set({ h: 1, P: 150 }) }],
  reset(st){ st.phase = 'flat'; st.xc = 0; st.vx = 0; st.psi = 0; st.w = 0; st.lastT = 0; st.hold = undefined; st.endMsg = ''; },
  step(st){
    if (st.hold !== undefined){ if (st.t > st.hold + 1.5){ st.t = 0; st.lastT = 0; st.phase = 'flat'; st.xc = 0; st.vx = 0; st.psi = 0; st.w = 0; st.hold = undefined; st.endMsg = ''; } return; }
    let dt = st.t - st.lastT; st.lastT = st.t;
    const hs = 5e-4;
    while (dt > 1e-12){
      const h = Math.min(hs, dt); dt -= h;
      if (st.phase === 'flat'){
        const F = tipFlat(st);
        if (F.N1 < 0){ st.phase = 'tip'; continue; }
        st.vx += F.a * h; st.xc += st.vx * h;
      } else if (st.phase === 'air'){
        const V = st.V, c = Math.cos(st.psi), sn = Math.sin(st.psi), rx = -TIP.b / 2 * c + TIP.H / 2 * sn, ry = TIP.b / 2 * sn + TIP.H / 2 * c, rPy = TIP.b * sn + V.h * TIP.H * c;
        st.vgx += V.P / TIP.m * h; st.vgy -= G0 * h; st.gx += st.vgx * h; st.gy += st.vgy * h;
        st.w += (rPy - ry) * V.P / TIP.IG * h; st.psi += st.w * h;
        // check the four corners against the floor, using the updated orientation
        const sp = Math.sin(st.psi), cp = Math.cos(st.psi), rx2 = -TIP.b / 2 * cp + TIP.H / 2 * sp, ry2 = TIP.b / 2 * sp + TIP.H / 2 * cp;
        const down = [[0, 0], [-TIP.b, 0], [0, TIP.H], [-TIP.b, TIP.H]].map(([u, v]) => { const qx = u * cp + v * sp - rx2, qy = -u * sp + v * cp - ry2; return st.gy + qy < -2e-4 && st.vgy - st.w * qx < 0; });
        st.xc = st.gx - rx2;
        if (down[2] || down[3]){ st.hold = st.t; st.endMsg = 'The crate has fallen onto its front face.'; break; }
        const hit = down.indexOf(true);
        if (hit === 0){
          // the front edge C touches down again: plastic impact at C, angular momentum about C is conserved
          const Hc = TIP.IG * st.w + TIP.m * (ry * st.vgx - rx * st.vgy);
          st.w = Hc / (TIP.IG + TIP.m * (rx * rx + ry * ry)); st.vx = 0; st.phase = 'tip';
        } else if (hit > 0){ st.hold = st.t; st.endMsg = hit === 1 ? 'The crate lands back on its base. The simulation stops at the impact.' : 'The crate has fallen onto its front face.'; break; }
      } else {
        const A = tipSolve(st);
        if (st.psi >= Math.PI / 2){ st.psi = Math.PI / 2; st.w = 0; st.hold = st.t; st.endMsg = 'The crate has fallen onto its front face.'; break; }
        if (A.N < 0){ // the floor cannot pull: the crate leaves the floor and flies freely
          const c = Math.cos(st.psi), sn = Math.sin(st.psi), rx = -TIP.b / 2 * c + TIP.H / 2 * sn, ry = TIP.b / 2 * sn + TIP.H / 2 * c;
          st.phase = 'air'; st.gx = st.xc + rx; st.gy = ry; st.vgx = st.vx + st.w * ry; st.vgy = -st.w * rx; continue;
        }
        st.w += A.pdd * h; st.psi += st.w * h; st.vx += A.xdd * h; st.xc += st.vx * h;
        if (Math.abs(st.vx) < 1e-6 && Math.abs(A.xdd) < 1e-9) st.vx = 0;
        if (st.psi <= 0 && st.w < 0){ st.psi = 0; st.w = 0; st.phase = 'flat'; }
        if (st.psi >= Math.PI / 2){ st.psi = Math.PI / 2; st.w = 0; st.hold = st.t; st.endMsg = 'The crate has fallen onto its front face.'; break; }
      }
      if (st.xc > 2.3 || st.t > 7){ st.hold = st.t; break; }
    }
  },
  draw(st){
    const cv = $('c-tip-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 340, 440); fitView(ctx, w, h, nr ? [120, 0, 620, 340] : [0, 0, 720, 340]);
    const V = st.V, S = 170, b = TIP.b * S, H = TIP.H * S, fy = 290, mg = TIP.m * G0, k = 70 / mg;
    hatch(ctx, 20, fy, 700, fy, 1);
    const psi = st.psi, c = Math.cos(psi), s = Math.sin(psi);
    let yC = 0; if (st.phase === 'air'){ const ry = TIP.b / 2 * s + TIP.H / 2 * c; yC = st.gy - ry; }
    const cx = 200 + b + st.xc * S * 0.75, cyC = fy - yC * S;
    // body point (u right, v up from the front-bottom edge C) -> canvas
    const P2 = (u, v) => [cx + u * c + v * s, cyC - (-u * s + v * c)];
    ctx.save(); ctx.translate(cx, cyC); ctx.rotate(psi); block(ctx, -b / 2, -H / 2, b, H, 0, ''); ctx.restore();
    const [gx, gy] = P2(-b / 2, H / 2);
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'G', gx + 12, gy - 10, { font: 'italic 14px Georgia, serif' });
    arrow(ctx, gx, gy, gx, gy + 60, COL.c2, 2.4); txt(ctx, 'mg', gx + 8, gy + 54, { color: COL.c2, align: 'left' });
    const [px, py] = P2(-b, V.h * H), L = 30 + V.P * 0.3;
    if (V.P > 0){ arrow(ctx, px - L, py, px, py, COL.c1, 3); txt(ctx, 'P', px - L - 8, py - 4, { color: COL.c1, align: 'right' }); }
    let stats;
    if (st.phase === 'air'){
      st.msg = 'The push has lifted the crate completely off the floor. No floor forces act now.';
      stats = [['phase', 'in the air (no contact)'], ['tilt angle', fmt(psi / RAD, 3) + '°'], ['forces', 'only P and mg']];
    } else if (st.phase === 'flat'){
      const F = tipFlat(st), rx = cx - b;
      if (F.N1 > 0.5){ arrow(ctx, rx + 6, fy + k * F.N1, rx + 6, fy, COL.c3, 2.6); txt(ctx, 'N_1', rx - 2, fy + k * F.N1 - 4, { color: COL.c3, align: 'right' }); }
      if (F.N2 > 0.5){ arrow(ctx, cx - 6, fy + k * F.N2, cx - 6, fy, COL.c3, 2.6); txt(ctx, 'N_2', cx + 2, fy + k * F.N2 - 4, { color: COL.c3, align: 'left' }); }
      // friction acts along the floor at each edge, in proportion to the normal force there
      [[rx + 6, F.N1, 'f_1'], [cx - 6, F.N2, 'f_2']].forEach(([x, N, lab]) => { const fl = F.f * k * Math.max(N, 0) / mg; if (fl > 3){ arrow(ctx, x, fy - 3, x - fl, fy - 3, RED, 2.4); } });
      if (F.f > 0.5) txt(ctx, 'f', rx - 14, fy - 14, { color: RED, align: 'right' });
      st.msg = F.N1 < 0 ? '' : st.vx > 1e-9 ? 'Both edges touch the floor. The crate slides without rotating.' : 'Both edges touch the floor. Friction holds the crate at rest.';
      stats = [['phase', 'flat on the floor (α = 0)'], ['a_G', fmt(F.a, 3) + ' m/s²'], ['rear normal force N_1', fmt(Math.max(F.N1, 0), 4) + ' N', true], ['front normal force N_2', fmt(F.N2, 4) + ' N', true], ['total friction f', fmt(F.f, 4) + ' N']];
    } else {
      const A = tipSolve(st);
      // only the front edge C touches the floor, so N and F act there and nowhere else
      if (A.N > 0.5){ arrow(ctx, cx, fy + k * A.N, cx, fy, COL.c3, 2.6); txt(ctx, 'N', cx + 8, fy + k * A.N - 4, { color: COL.c3, align: 'left' }); }
      const fl = A.F * k; if (Math.abs(fl) > 3){ arrow(ctx, cx, fy - 3, cx + fl, fy - 3, RED, 2.6); txt(ctx, 'F', cx + fl + (fl > 0 ? 8 : -8), fy - 14, { color: RED, align: fl > 0 ? 'left' : 'right' }); }
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx, fy, 3.5, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'C', cx + 4, fy + 16, { font: 'italic 13px Georgia, serif', color: RED });
      st.msg = Math.abs(st.vx) > 1e-6 ? 'The rear edge has lifted. Only the front edge C touches, and it slides.' : 'The rear edge has lifted. The crate pivots about its front edge C.';
      stats = [['phase', 'tipping about the front edge C'], ['tilt angle', fmt(psi / RAD, 3) + '°'], ['normal force at C', fmt(A.N, 4) + ' N', true], ['friction at C', fmt(A.F, 4) + ' N', true], ['front edge', Math.abs(st.vx) > 1e-6 ? 'sliding' : 'not sliding']];
    }
    txt(ctx, st.endMsg || st.msg, nr ? 370 : 360, 22, { font: '600 13px system-ui', color: st.phase === 'flat' ? COL.c3 : RED });
    statsEvery(st, 'c-tip-stats', () => stats);
  }
});

// --- 4. the spool paradox: which way does a pulled spool roll?
makeClip({
  id: 'c-spool', speed: 0.5,
  controls: [
    { key: 'phi', label: 'Angle φ of the string', min: 0, max: 90, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'T', label: 'Pull T', min: 0, max: 15, step: 0.5, value: 6, unit: 'N', dec: 2 },
    { key: 'q', label: 'Hub radius r / R', min: 0.2, max: 0.9, step: 0.01, value: 0.5, unit: '', dec: 3 }
  ],
  presets: C => [{ label: 'Shallow pull', apply: () => C.set({ phi: 20 }) }, { label: 'Critical angle', apply: () => C.set({ phi: Math.acos(C.v.q) / RAD }) }, { label: 'Steep pull', apply: () => C.set({ phi: 75 }) }],
  reset(st){
    const V = st.V, m = 2, R = 0.2, r = V.q * R, k2 = 0.15 * 0.15, IC = m * (k2 + R * R), ph = V.phi * RAD;
    st.a = V.T * R * (R * Math.cos(ph) - r) / IC; st.F = m * st.a - V.T * Math.cos(ph); st.N = m * G0 - V.T * Math.sin(ph); st.hold = undefined;
    const sense = Math.abs(st.a) < 1e-6 ? 'it does not roll' : st.a > 0 ? 'toward the pull' : 'away from the pull';
    setStats('c-spool-stats', [['a_G = TR(R cos φ − r) / I_C', fmt(st.a, 3) + ' m/s²', true], ['the spool rolls', sense, true], ['critical angle φ_c = cos⁻¹(r/R)', fmt(Math.acos(V.q) / RAD, 3) + '°'], ['friction F (positive toward the pull)', fmt(st.F, 3) + ' N'], ['smallest μ_s for rolling, |F| / N', st.N > 0 ? fmt(Math.abs(st.F) / st.N, 3) : '—'], ['normal force N', fmt(st.N, 3) + ' N']]);
    showNotes('c-spool-notes', st.N < 0 ? [{ level: 'warn', html: 'The vertical part of the pull exceeds the weight, so the spool would lift off the floor. Reduce the pull or the angle.' }] : []);
  },
  step(st){ const x = 0.5 * st.a * st.t * st.t; if (Math.abs(x) > 0.9 || st.t > 6){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 1){ st.t = 0; st.hold = undefined; } } },
  draw(st){
    const cv = $('c-spool-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nr = nar(cv, w, 320, 420); fitView(ctx, w, h, nr ? [90, 0, 610, 300] : [0, 0, 720, 320]);
    const V = st.V, S = 450, R = 0.2 * S, r = V.q * R, fy = 270, tt = st.hold ?? st.t, ph = V.phi * RAD;
    const x = Math.max(-0.9, Math.min(0.9, 0.5 * st.a * tt * tt)), gx = 300 + x * 200, gy = fy - R;
    hatch(ctx, 20, fy, 700, fy, 1);
    // spool: outer rims and hub
    ctx.save(); ctx.translate(gx, gy);
    ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9d4c6'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.rotate(x * 200 / R); ctx.strokeStyle = COL.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R * 0.92); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(gx, gy, 3, 0, 2 * Math.PI); ctx.fill();
    // string leaves the bottom of the hub tangentially
    const px = gx + r * Math.sin(ph), py = gy + r * Math.cos(ph), ux = Math.cos(ph), uy = -Math.sin(ph);
    line(ctx, px - 400 * ux, py - 400 * uy, px + 400 * ux, py + 400 * uy, COL.axis, 1, [6, 5]);
    cable(ctx, () => { ctx.moveTo(px, py); ctx.lineTo(px + 150 * ux, py + 150 * uy); });
    arrow(ctx, px + 150 * ux, py + 150 * uy, px + 200 * ux, py + 200 * uy, COL.c2, 3); txt(ctx, 'T', px + 196 * ux + 16 * uy, py + 196 * uy - 16 * ux, { color: COL.c2 }); // beside the line of action, not on it
    const cx = gx, cy = fy; ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'C', cx - 12, cy + 14, { font: 'italic 14px Georgia, serif', color: RED });
    const side = Math.abs(st.a) < 1e-6 ? 'passes through C' : st.a > 0 ? 'passes above C' : 'passes below C';
    const l1 = `The line of action of T ${side},`, l2 = `so the spool ${Math.abs(st.a) < 1e-6 ? 'does not roll' : st.a > 0 ? 'rolls toward the pull' : 'rolls away from the pull'}.`;
    if (nr){ txt(ctx, l1, 350, 22, { font: '600 13px system-ui' }); txt(ctx, l2, 350, 40, { font: '600 13px system-ui' }); } else txt(ctx, l1 + ' ' + l2, 360, 22, { font: '600 13px system-ui' });
  }
});

// --- 5. a bowling ball: skidding turns into rolling
(function(){
  const PRE = [['No spin', 0], ['Backspin, Rω_0 = −v_0', -1], ['Strong backspin, Rω_0 = −3v_0', -3], ['Topspin, Rω_0 = 2v_0', 2]];
  makeClip({
    id: 'c-bowl', speed: 0.25,
    controls: [
      { key: 'v0', label: 'Initial speed v_0', min: 0.5, max: 10, step: 0.1, value: 5, unit: 'm/s', dec: 2 },
      { key: 'mu', label: 'Kinetic friction μ_k', min: 0.05, max: 0.6, step: 0.01, value: 0.2, unit: '', dec: 3 }
    ],
    presets: (C, st, reset) => PRE.map(([label, k]) => ({ label, apply: () => { st.k = k; reset(); } })),
    setup(st){ st.k = 0; },
    reset(st){
      document.querySelectorAll('#c-bowl-pre .chip').forEach((b, i) => b.classList.toggle('on', PRE[i][1] === st.k));
      const V = st.V, g = G0, s0 = V.v0 - st.k * V.v0; // slip velocity of the contact point
      st.w0 = st.k * V.v0; st.sg = Math.sign(s0); st.ts = Math.abs(s0) / (3.5 * V.mu * g);
      st.vs = (5 * V.v0 + 2 * st.w0) / 7; st.T = st.ts + 2;
      const at = t => { const tc = Math.min(t, st.ts), v = V.v0 - st.sg * V.mu * g * tc, Rw = st.w0 + st.sg * 2.5 * V.mu * g * tc;
        const x = V.v0 * tc - 0.5 * st.sg * V.mu * g * tc * tc + (t > st.ts ? st.vs * (t - st.ts) : 0);
        const phi = (st.w0 * tc + 0.5 * st.sg * 2.5 * V.mu * g * tc * tc + (t > st.ts ? st.vs * (t - st.ts) : 0)); return { v, Rw, x, phi }; };
      st.at = at; let lo = 0, hi = 0; for (let i = 0; i <= 200; i++){ const q = at(st.T * i / 200).x; lo = Math.min(lo, q); hi = Math.max(hi, q); } st.xr = [lo, hi]; st.hold = undefined;
      setStats('c-bowl-stats', [['skidding lasts t_s = |v_0 − Rω_0| / (3.5 μ_k g)', fmt(st.ts, 3) + ' s', true], ['final rolling speed v_f = (5v_0 + 2Rω_0)/7', fmt(st.vs, 3) + ' m/s', true], ['fraction of v_0 kept', fmt(st.vs / V.v0, 3)]]);
    },
    step(st){ if (st.t > st.T){ st.hold = st.hold ?? st.t; if (st.t > st.hold + 0.8){ st.t = 0; st.hold = undefined; } } },
    draw(st){
      const cv = $('c-bowl-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const nr = nar(cv, w, 230, 260); fitView(ctx, w, h, nr ? [160, 0, 560, 230] : [0, 0, 720, 230]);
      // one true scale for the ball and the lane (R = 0.11 m), with the camera following the ball
      const V = st.V, tt = Math.min(st.hold ?? st.t, st.T), q = st.at(tt), Rm = 0.11, Sc = 330, R = Rm * Sc, fy = 175, X0 = 360;
      const X = x => X0 + (x - q.x) * Sc;
      line(ctx, 0, fy, 720, fy, COL.fg, 2); hatch(ctx, 0, fy, 720, fy, 1, 9, 6);
      for (let m = Math.floor(q.x - 1.5); m <= q.x + 1.5; m += 0.5){ const x = X(m); if (x < -10 || x > 730) continue;
        line(ctx, x, fy, x, fy - (Math.abs(m % 1) < 1e-9 ? 10 : 6), COL.muted, 1.5);
        if (Math.abs(m % 1) < 1e-9) txt(ctx, `${m} m`, x, fy + 44, { font: '11px system-ui', color: COL.muted }); }
      // path of a point on the rim over the last second: a straight smear while skidding without spin, a cycloid when rolling
      ctx.save(); ctx.strokeStyle = COL.c4; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.beginPath();
      for (let i = 0; i <= 120; i++){ const tau = Math.max(0, tt - 1.2) + Math.min(tt, 1.2) * i / 120, p = st.at(tau), ang = p.phi / Rm;
        const px = X(p.x) + R * Math.sin(ang), py = fy - R - R * Math.cos(ang); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
      const cx = X0, cy = fy - R, ang = q.phi / Rm;
      wheel(ctx, cx, cy, R, ang, 'sphere');
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.fillStyle = COL.c4; ctx.beginPath(); ctx.arc(0, -R, 4, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
      const skid = tt < st.ts - 1e-9, slip = q.v - q.Rw, ks = 14; // pixels per m/s
      // velocity of the center and velocity of the contact point
      if (Math.abs(q.v) > 0.02){ arrow(ctx, cx, cy, cx + q.v * ks, cy, COL.c1, 2.8); txt(ctx, 'v_G', cx + q.v * ks + (q.v > 0 ? 8 : -8), cy - 12, { color: COL.c1, align: q.v > 0 ? 'left' : 'right' }); }
      if (skid){
        const sl = Math.sign(slip) * Math.min(Math.abs(slip) * ks, 150); // capped so the arrow stays on screen
        arrow(ctx, cx, fy - 6, cx + sl, fy - 6, RED, 2.8);
        txt(ctx, 'v_C (slip)', slip > 0 ? Math.max(cx + sl, cx + R) + 8 : Math.min(cx + sl, cx - R) - 8, fy - 12, { font: '12px system-ui', color: RED, align: slip > 0 ? 'left' : 'right' });
        const fl = 40 * Math.sign(slip); arrow(ctx, cx, fy + 6, cx - fl, fy + 6, COL.c2, 2.8);
        txt(ctx, 'friction μ_k mg', cx - fl - Math.sign(fl) * 8, fy + 16, { font: '12px system-ui', color: COL.c2, align: fl > 0 ? 'right' : 'left' });
      } else { ctx.fillStyle = COL.c3; ctx.beginPath(); ctx.arc(cx, fy, 4, 0, 2 * Math.PI); ctx.fill(); txt(ctx, 'v_C = 0', cx + 12, fy + 22, { font: '12px system-ui', color: COL.c3, align: 'left' }); }
      txt(ctx, skid ? 'Skidding. The contact point C slides, so kinetic friction acts.' : 'Rolling without slipping. C is at rest, so friction is zero.', nr ? 360 : 360, 20, { font: '600 13px system-ui', color: skid ? RED : COL.c3 });
      txt(ctx, `t = ${fmt(tt, 3)} s`, nr ? 540 : 700, 44, { font: '12px system-ui', color: COL.muted, align: 'right' });
      const pv = [], pw = []; for (let i = 0; i <= 200; i++){ const t = st.T * i / 200, s = st.at(t); pv.push([t, s.v]); pw.push([t, s.Rw]); }
      const ys = pv.concat(pw).map(p => p[1]), lo = Math.min(0, ...ys), hi = Math.max(...ys), pad = (hi - lo) * 0.1 || 1;
      plot($('c-bowl-plot'), { xmin: 0, xmax: st.T, ymin: lo - pad, ymax: hi + pad, xlabel: 'time t (s)', ylabel: 'speed (m/s)', series: [{ pts: pv, color: COL.c1, width: 2.4 }, { pts: pw, color: COL.c4, width: 2.4, dash: [6, 4] }],
        vlines: [{ x: st.ts, color: COL.c3, label: 'rolling starts' }], points: [{ x: tt, y: q.v, color: COL.c1, r: 5 }, { x: tt, y: q.Rw, color: COL.c4, r: 5 }] });
    }
  });
})();


/* render subscripts in slider labels and preset chips. Example files loaded after this one call subLabels() again. */
function subLabels(){
  document.querySelectorAll('.ctl .nm, .chip').forEach(el => { if (/_/.test(el.textContent) && !el.querySelector('sub')) el.innerHTML = htmlSub(el.textContent); });
  // plain-text notes, titles and cards: "a_t" becomes a with subscript t (text that holds TeX is left for MathJax)
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  document.querySelectorAll('.concept-note, .demo-title span, .cardlink p, .try li, .notes, .legendrow span').forEach(el => {
    if (/[$\\]/.test(el.textContent)) return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => { if (!/[A-Za-z\u0370-\u03FF]_[A-Za-z0-9{\u0370-\u03FF]/.test(n.textContent)) return;
      const sp = document.createElement('span'); sp.innerHTML = htmlSub(esc(n.textContent)); n.replaceWith(sp); });
  });
}
subLabels();
