/* =========================================================
   Shared kit for the worked-example pages of every chapter
   (loaded after common.js and clip.js, before the chapter's example files).
   - labels with real subscripts ("v_B" draws v with subscript B) and a true minus sign
   - automatic label placement: every label queued while a clip draws is placed afterwards,
     away from other labels and from the drawing, and kept inside the canvas
   - CLIP_ST / DEMO_BY_ID: live state of every clip by id, read by the 3D views (view3d.js)
   - small drawing helpers: wheel, pins on brackets, wedge, ebars, rk/stepN integrators
   The same code also sits at the top of ch5.js for the Chapter 5 pages.
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

/* render subscripts in slider labels and preset chips; example files call subLabels() again after building their clips */
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
window.addEventListener('load', subLabels);
