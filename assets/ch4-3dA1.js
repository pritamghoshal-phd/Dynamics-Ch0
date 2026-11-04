/* =========================================================
   3D views for the Chapter 4 Newton's-law examples 4.A.1 to 4.A.8.
   Each view reads the live state of the 2D clip with the same id, so both views show the same motion.
   Units: metres, except 4.A.3 and 4.A.7, which are drawn in feet like the problems.
   ========================================================= */
(function(){
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const tNow = (st, tEnd) => Math.min(st.hold ?? st.t, tEnd);
const put = (sp, x, y, z, vis = true) => { sp.position.set(x, y, z); sp.visible = vis; };
// force arrows drawn on top, so a normal force pushing up through an opaque floor stays visible
function farrow(H, color, scale){ const a = H.arrow(color, scale); [a.obj.line, a.obj.cone].forEach(o => { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 5; }); return a; }
// a prism: a 2D outline in the x–y plane extruded along z (centred on z = 0)
function prism(H, pts, depth, color, parent){
  const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return H.mesh(g, color, parent);
}
// wheel turning about the z axis (with a spoke so the rotation shows)
function wheel3(H, r, depth, parent){ const g = new THREE.Group(); (parent || null) ? parent.add(g) : H.add(g); H.disk(r, depth, H.C.dark, g); const s = H.box(r * 1.6, r * 0.25, depth * 1.05, '#9aa0a8', g); return g; }
// scrolling marker posts along the road (camera stays with the moving object)
function markers(H, n, every, z, ht = 0.5, wd = 0.06){ const list = []; for (let i = 0; i < n; i++){ const p = H.box(wd, ht, wd, '#9a948a'); p.position.z = z; list.push(p); } return { list, set(xw, span){ list.forEach((p, i) => { const k = Math.floor((xw - span) / every) + i, X = k * every - xw; p.position.x = X; p.position.y = p.geometry.parameters.height / 2; p.visible = Math.abs(X) < span; }); } }; }

/* ---------- 4.A.1: braking car (the view follows the car; posts every 10 m pass by) ---------- */
view3d({
  id: 'x4a-1', size: 5, target: [0, 0.8, 0], camera: [0.45, 0.35, 1],
  build(H){
    H.floor(-12, 12, 3);
    const C = H.C, car = H.group();
    const body = H.box(4.6, 0.7, 1.8, '#d9a441', car); body.position.y = 0.75;
    const cab = H.box(2.4, 0.6, 1.6, '#e5c070', car); cab.position.set(-0.2, 1.4, 0);
    const glass = H.box(2.2, 0.45, 1.62, '#cfe0f0', car); glass.position.set(-0.2, 1.42, 0);
    const wh = []; [-1.4, 1.4].forEach(x => [-0.85, 0.85].forEach(z => { const w = wheel3(H, 0.37, 0.25, car); w.position.set(x, 0.37, z); wh.push(w); }));
    const posts = markers(H, 6, 10, -1.9, 0.9, 0.12), flags = [H.box(0.05, 1.6, 0.05, C.purple), H.box(0.05, 1.6, 0.05, C.purple)];
    const lStart = H.label('start', C.purple, 0.35), lStop = H.label('stop', C.purple, 0.35);
    const vA = farrow(H, C.green), fA = farrow(H, C.red), lv = H.label('v', C.green, 0.4), lf = H.label('F_f', C.red, 0.4);
    return { car, wh, posts, flags, lStart, lStop, vA, fA, lv, lf };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.ts === undefined) return;
    const T = Math.min((st.hold ?? st.t) * st.K, st.ts), x = V.v1 * T - 0.5 * st.a * T * T, v = V.v1 - st.a * T;
    o.posts.set(x, 25);
    [[0, o.flags[0], o.lStart], [st.s, o.flags[1], o.lStop]].forEach(([X, f, l]) => { const d = X - x, vis = Math.abs(d) < 11; f.position.set(d, 0.8, -1.9); f.visible = vis; put(l, d, 1.85, -1.9, vis); });
    o.wh.forEach(w => { w.rotation.z = -x / 0.37; });
    o.vA.set([-1.2, 2.2, 0], v > 0.05 ? [Math.min(3, 0.6 + v * 0.03), 0, 0] : [0, 0, 0]); put(o.lv, 2.2, 2.2, 0, v > 0.05);
    o.fA.set([0.6, 0.05, 1.0], v > 0.01 ? [-1.8, 0, 0] : [0, 0, 0]); put(o.lf, -1.5, 0.3, 1.1, v > 0.01);
  }
});

/* ---------- 4.A.2: rope sliding off a rough table over a light pulley (L = 2 m) ---------- */
view3d({
  id: 'x4a-2', size: 2.3, target: [0.4, 1.4, 0], camera: [0.5, 0.45, 1],
  build(H){
    const ty = 2.3, px = 1.2, pr = 0.07;
    H.floor(-1.6, 2.6, 0.9);
    const table = H.box(px - 0.02 + 1.4, 0.08, 0.6, '#d6d1c4'); table.position.set((px - 0.02 - 1.4) / 2, ty - 0.04, 0); // level top
    [-1.3, px - 0.12].forEach(x => [-0.24, 0.24].forEach(z => { const leg = H.box(0.08, ty - 0.08, 0.08, '#8a8478'); leg.position.set(x, (ty - 0.08) / 2, z); }));
    const pul = H.disk(pr, 0.06, H.C.steel); pul.position.set(px, ty + 0.01 - pr + pr, 0); pul.position.y = ty - pr + 0.02;
    const br = H.box(0.04, 0.12, 0.12, H.C.steel); br.position.set(px - 0.02, ty - pr, 0);
    const rope = H.cable([[0, 0, 0], [0, 1, 0]], '#6b4f2a', 0.028);
    const dots = []; for (let i = 1; i < 8; i++) dots.push(H.sphere(0.022, '#f3e3b8'));
    const lc = H.label('C'), lv = H.label('v', H.C.green, 0.16), va = farrow(H, H.C.green, 0.6);
    lc.position.set(px + 0.18, ty + 0.12, 0);
    return { ty, px, pr, rope, dots, lv, va };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    const L = st.L, x = st.x, on = L - x, top = o.ty + 0.02, xr = o.px + o.pr, cyP = o.ty - o.pr + 0.02;
    const pts = []; if (on > 1e-4) pts.push([o.px - on, top, 0]);
    pts.push([o.px, top, 0]); for (let k = 1; k <= 6; k++){ const a = Math.PI / 2 - k * Math.PI / 12; pts.push([o.px + o.pr * Math.cos(a), cyP + o.pr * Math.sin(a), 0]); }
    pts.push([xr, cyP - x, 0]); o.rope.set(pts);
    o.dots.forEach((d, i) => { const q = (i + 1) * 0.25; if (q < on) d.position.set(o.px - on + q, top, 0.02); else d.position.set(xr, cyP - (q - on), 0.02); });
    o.va.set([xr + 0.25, cyP - 0.2, 0], st.v > 0.02 ? [0, -Math.min(0.8, 0.15 + st.v * 0.15), 0] : [0, 0, 0]); put(o.lv, xr + 0.4, cyP - 0.4, 0, st.v > 0.02);
  }
});

/* ---------- 4.A.3: crate sliding up a rough incline (feet) ---------- */
view3d({
  id: 'x4a-3', size: 22, target: [14, 7, 0], camera: [-0.25, 0.25, 1],
  build(H){
    H.floor(-6, 46, 8);
    const wedge = prism(H, [[0, 0], [1, 0], [1, 1]], 10, '#d6d1c4'); // rescaled when θ changes
    const crate = H.group(), box = H.box(2.4, 2.4, 2.4, H.C.wood, crate); box.position.y = 1.2;
    [0.6, 1.2, 1.8].forEach(y => { const s = H.box(2.46, 0.12, 0.08, '#a8834a', crate); s.position.set(0, y, 1.22); });
    const fA = farrow(H, H.C.red, 6), vA = farrow(H, H.C.green, 6), lf = H.label('F_f', H.C.red, 2), lv = H.label('v', H.C.green, 2), lc = H.label('C', '#1c1d21', 2);
    return { wedge, crate, fA, vA, lf, lv, lc, key: '' };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.t1 === undefined) return;
    const th = V.th * RAD, Lw = Math.max(st.smax * 1.15 + 4, 12);
    const key = V.th + '|' + Lw.toFixed(2); if (key !== o.key){ o.key = key; o.wedge.scale.set(Lw * Math.cos(th), Lw * Math.sin(th), 1); }
    const t = tNow(st, st.t2); let s, v;
    if (t <= st.t1){ s = V.v0 * t - 0.5 * st.a1 * t * t; v = V.v0 - st.a1 * t; } else if (st.back){ const u = t - st.t1; s = st.smax - 0.5 * st.a2 * u * u; v = -st.a2 * u; } else { s = st.smax; v = 0; }
    s = Math.max(0, s) + 2;
    const ux = Math.cos(th), uy = Math.sin(th), px = s * ux, py = s * uy;
    o.crate.position.set(px, py, 0); o.crate.rotation.z = th;
    const sg = Math.sign(v), mv = Math.abs(v) > 0.05;
    o.fA.set([px - sg * ux * 0.3, py - sg * uy * 0.3 + 0.1, 1.3], mv ? [-sg * ux * 5, -sg * uy * 5, 0] : [0, 0, 0]); put(o.lf, px - sg * ux * 6.5, py - sg * uy * 6.5 + 1, 1.3, mv);
    const nX = -uy, nY = ux;
    o.vA.set([px + nX * 3.6, py + nY * 3.6, 0], mv ? [sg * ux * Math.min(8, 1 + Math.abs(v) * 0.15), sg * uy * Math.min(8, 1 + Math.abs(v) * 0.15), 0] : [0, 0, 0]); put(o.lv, px + nX * 4.8, py + nY * 4.8, 0, mv);
    put(o.lc, px + nX * 1.2, py + nY * 1.2, 1.6);
  }
});

/* ---------- 4.A.4: collar on a smooth rod in an accelerating frame (the view follows the frame) ---------- */
view3d({
  id: 'x4a-4', size: 1.35, target: [0, 0.5, 0], camera: [-0.3, 0.3, 1],
  build(H){
    H.floor(-3, 3, 1.2);
    const W = 1.5, Hh = 0.9, D = 0.5, t = 0.1, y0 = 0.12, C = H.C, fr = H.group();
    [[0, y0 + t / 2, W, t], [0, y0 + Hh - t / 2, W, t]].forEach(([x, y, w, h]) => { const b = H.box(w, h, D, '#c9c4b6', fr); b.position.set(x, y, 0); });
    [[-W / 2 + t / 2], [W / 2 - t / 2]].forEach(([x]) => { const b = H.box(t, Hh, D, '#c9c4b6', fr); b.position.set(x, y0 + Hh / 2, 0); });
    const back = H.box(W, Hh, 0.02, '#e8e3d6', fr); back.position.set(0, y0 + Hh / 2, -D / 2);
    const wh = []; [-0.55, 0.55].forEach(x => [-0.2, 0.2].forEach(z => { const w = wheel3(H, 0.06, 0.05, fr); w.position.set(x, 0.06, z); wh.push(w); }));
    const rod = H.box(1, 0.035, 0.035, '#7d776b', fr), collar = H.box(0.16, 0.1, 0.12, '#5b5a55', fr);
    const posts = markers(H, 14, 0.5, -0.8, 0.12, 0.04);
    const N = farrow(H, C.green, 0.5), mg = farrow(H, C.orange, 0.5), aA = farrow(H, C.purple, 0.5);
    const lN = H.label('N', C.green, 0.11), lmg = H.label('mg', C.orange, 0.11), la = H.label('a', C.purple, 0.11), lP = H.label('P', '#1c1d21', 0.11);
    return { y0, Hh, W, t, fr, wh, rod, collar, posts, N, mg, aA, lN, lmg, la, lP, key: '' };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.sdd === undefined) return;
    const th = V.th * RAD, t = tNow(st, st.tEnd), X = 0.5 * V.a * t * t, my = o.y0 + o.Hh / 2;
    o.posts.set(X, 3);
    o.wh.forEach(w => { w.rotation.z = -X / 0.06; });
    const iw = o.W - 2 * o.t - 0.02, ih = o.Hh - 2 * o.t - 0.02, half = Math.min(iw / 2 / Math.cos(th), ih / 2 / Math.sin(th));
    o.rod.scale.x = 2 * half; o.rod.position.set(0, my, 0); o.rod.rotation.z = -th;
    const smax = half - 0.1, s = clamp(0.5 * st.sdd * t * t, -smax, smax), cx = s * Math.cos(th), cy = my - s * Math.sin(th);
    o.collar.position.set(cx, cy, 0); o.collar.rotation.z = -th;
    const Nn = G0 * Math.cos(th) + V.a * Math.sin(th), k = 0.022;
    o.N.set([cx, cy, 0.1], [Math.sin(th) * Nn * k, Math.cos(th) * Nn * k, 0]); put(o.lN, cx + Math.sin(th) * Nn * k + 0.06, cy + Math.cos(th) * Nn * k + 0.05, 0.1);
    o.mg.set([cx, cy, 0.1], [0, -G0 * k, 0]); put(o.lmg, cx + 0.09, cy - G0 * k - 0.04, 0.1);
    o.aA.set([-0.25, o.y0 + o.Hh + 0.12, 0], V.a > 0.01 ? [0.5, 0, 0] : [0, 0, 0]); put(o.la, 0.35, o.y0 + o.Hh + 0.12, 0, V.a > 0.01);
    put(o.lP, cx - 0.08, cy + 0.12, 0.12);
  }
});

/* ---------- 4.A.5: cable car pulled up a taut cable (slope 5 : 12) ---------- */
view3d({
  id: 'x4a-5', size: 8, target: [8, 4.5, 0], camera: [-0.35, 0.2, 1],
  build(H){
    H.floor(-2, 19, 3);
    const c = 12 / 13, s = 5 / 13, L = 18, C = H.C;
    // the cable is anchored to two towers standing on the ground
    const cab = H.cable([[0, 1.5, 0], [L * c, 1.5 + L * s, 0]], C.dark, 0.035);
    [[0, 1.5], [L * c, 1.5 + L * s]].forEach(([x, y]) => { const t = H.box(0.3, y + 0.4, 0.3, '#8a8478'); t.position.set(x, (y + 0.4) / 2, 0); });
    const car = H.group(), trolley = H.group();
    const wheels = [-0.9, -0.3, 0.3, 0.9].map(d => { const w = wheel3(H, 0.12, 0.08, trolley); w.position.set(d, 0.15, 0); return w; });
    const plate = H.box(2.1, 0.12, 0.06, C.steel, trolley); plate.position.set(0, 0.05, 0.08);
    const hanger = H.box(0.08, 0.9, 0.08, C.steel, car); hanger.position.set(0, -0.45, 0);
    const cabin = H.box(1.8, 1.4, 1.2, '#c9c4b6', car); cabin.position.set(0, -1.6, 0);
    const win = H.box(1.4, 0.5, 1.22, '#cfe0f0', car); win.position.set(0, -1.3, 0);
    const F = farrow(H, C.red, 3), N = farrow(H, C.blue, 3), lF = H.label('F', C.red, 0.5), lN = H.label('force on the cable', C.blue, 0.4), lC = H.label('C', '#1c1d21', 0.5);
    return { c, s, car, trolley, wheels, F, N, lF, lN, lC };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.a === undefined) return;
    const t = tNow(st, st.tEnd), sp = clamp(8 + 0.5 * st.a * t * t, 1.5, 17), qx = sp * o.c, qy = 1.5 + sp * o.s, be = Math.atan2(5, 12);
    o.trolley.position.set(qx, qy, 0); o.trolley.rotation.z = be; o.wheels.forEach(w => { w.rotation.z = -sp / 0.12; });
    o.car.position.set(qx, qy, 0);
    const kF = 0.0006; o.F.set([qx + 0.9, qy - 1.6, 0], [Math.max(0.01, V.F * kF), 0, 0]); put(o.lF, qx + 1.2 + V.F * kF, qy - 1.6, 0, V.F > 1);
    const kN = 0.0007; o.N.set([qx, qy, 0.15], [o.s * st.N * kN, -o.c * st.N * kN, 0]); put(o.lN, qx + o.s * st.N * kN + 1.4, qy - o.c * st.N * kN - 0.2, 0.15);
    put(o.lC, qx - 1.25, qy - 1.6, 0.7);
  }
});

/* ---------- 4.A.6: block A with a pulley, on block B, on a smooth floor ---------- */
view3d({
  id: 'x4a-6', size: 1.6, target: [1.0, 0.45, 0], camera: [-0.3, 0.35, 1],
  build(H){
    H.floor(-0.6, 3.2, 0.8);
    const C = H.C, B = H.group(), bw = 1.9, bh = 0.32;
    const base = H.box(bw, bh, 0.6, '#c9c4b6', B); base.position.set(bw / 2, 0.12 + bh / 2, 0);
    const up = H.box(0.12, 0.75, 0.6, '#c9c4b6', B); up.position.set(bw - 0.06, 0.12 + bh + 0.375, 0);
    const rol = []; [0.15, bw - 0.15].forEach(x => [-0.22, 0.22].forEach(z => { const w = wheel3(H, 0.06, 0.05, B); w.position.set(x, 0.06, z); rol.push(w); }));
    const A = H.group(), ab = 0.4; const blk = H.box(ab, ab, 0.4, '#e4dfd2', A); blk.position.set(0, ab / 2, 0);
    const arm = H.box(0.1, 0.03, 0.03, C.steel, A); arm.position.set(ab / 2 + 0.05, 0.3, 0);
    const pul = H.disk(0.07, 0.04, C.steel, A); pul.position.set(ab / 2 + 0.14, 0.3, 0);
    const lower = H.cable([[0, 0, 0], [1, 0, 0]], C.dark, 0.008), upper = H.cable([[0, 0, 0], [1, 0, 0]], C.dark, 0.008);
    const F = farrow(H, C.red, 0.6), lF = H.label('F', C.red, 0.14), lA = H.label('A', '#1c1d21', 0.14), lB = H.label('B', '#1c1d21', 0.14);
    return { B, A, bw, bh, rol, lower, upper, F, lF, lA, lB };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.aA === undefined) return;
    const t = tNow(st, st.tEnd), xB = 0.5 * st.aB * t * t, xA = 0.5 * st.aA * t * t, top = 0.12 + o.bh, bx = 0.1 + xB;
    o.B.position.set(bx, 0, 0); o.rol.forEach(w => { w.rotation.z = -xB / 0.06; });
    const ax = bx + 0.45 + (xA - xB);
    o.A.position.set(ax, top, 0);
    const py = top + 0.3, ppx = ax + 0.34, ux = bx + o.bw - 0.12, free = ppx + 0.33 + (xA - xB);
    o.lower.set([[ux, py - 0.07, 0], [ppx, py - 0.07, 0]]); o.upper.set([[ppx, py + 0.07, 0], [free, py + 0.07, 0]]);
    o.F.set([free, py + 0.07, 0], [0.35, 0, 0]); put(o.lF, free + 0.45, py + 0.12, 0);
    put(o.lA, ax, top + 0.52, 0.2); put(o.lB, bx + o.bw - 0.06, top + 0.88, 0.2);
  }
});

/* ---------- 4.A.7: particle on a smooth quarter-circle rod (feet, R = 3 ft) ---------- */
view3d({
  id: 'x4a-7', size: 3.2, target: [1.6, 1.5, 0], camera: [-0.2, 0.25, 1],
  build(H){
    const R = 3, C = H.C;
    H.floor(-1, 5, 1.5);
    H.wall(0, 0, 3.8, 1.5);
    const rod = H.ring(R, 0.04, Math.PI / 2, '#3a3d44'); rod.position.set(0, 0, 0);
    const P = H.sphere(0.13, '#9aa0a8');
    const N = farrow(H, C.green, 1.2), W = farrow(H, C.orange, 1.2), v = farrow(H, C.blue, 1.2);
    const lN = H.label('N', C.green, 0.3), lW = H.label('W', C.orange, 0.3), lv = H.label('v', C.blue, 0.3), lP = H.label('P', '#1c1d21', 0.3), lO = H.label('O', '#1c1d21', 0.3);
    lO.position.set(-0.2, -0.2, 0.2); const O = H.sphere(0.04, C.dark); O.position.set(0, 0, 0);
    return { R, P, N, W, v, lN, lW, lv, lP };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.th === undefined) return;
    const R = o.R, th = st.th, m = V.W / 32.2, px = R * Math.cos(th), py = R * Math.sin(th);
    const vv = Math.sqrt(Math.max(0, st.v02 + 2 * 32.2 * R * (1 - Math.sin(th)))), N = V.W * Math.sin(th) - m * vv * vv / R, k = 0.07;
    o.P.position.set(px, py, 0);
    o.N.set([px, py, 0], [Math.cos(th) * N * k, Math.sin(th) * N * k, 0]); put(o.lN, px + Math.cos(th) * N * k + 0.15, py + Math.sin(th) * N * k + 0.15, 0, Math.abs(N) > 0.05);
    o.W.set([px, py, 0], [0, -V.W * k, 0]); put(o.lW, px + 0.2, py - V.W * k - 0.1, 0);
    const L = Math.min(1.4, 0.2 + vv * 0.05); o.v.set([px, py, 0], [Math.sin(th) * L, -Math.cos(th) * L, 0]); put(o.lv, px + Math.sin(th) * (L + 0.2), py - Math.cos(th) * (L + 0.2), 0);
    put(o.lP, px - 0.25, py + 0.25, 0.1);
  }
});

/* ---------- 4.A.8: blocks in perpendicular guides joined by a light rod (L = 2.5 m) ---------- */
view3d({
  id: 'x4a-8', size: 2.4, target: [-1.0, 1.0, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const C = H.C;
    H.floor(-3.2, 0.8, 0.8);
    const wall = H.box(0.08, 3, 0.8, C.wall); wall.position.set(0.17, 1.5, 0);
    const rail = H.box(0.03, 3, 0.03, C.steel); rail.position.set(0, 1.5, -0.12);
    const track = H.box(3.2, 0.03, 0.03, C.steel); track.position.set(-1.6, 0.0, -0.12);
    const A = H.box(0.22, 0.3, 0.22, '#8a8478'), B = H.box(0.32, 0.14, 0.22, '#8a8478'), rod = H.bar(1, 0.035, '#3a3d44', null, 0.035);
    const F = farrow(H, C.red, 0.8), fA = farrow(H, C.orange, 0.8), fB = farrow(H, C.orange, 0.8);
    const lA = H.label('A', '#1c1d21', 0.2), lB = H.label('B', '#1c1d21', 0.2), lF = H.label('F', C.red, 0.2), lT = H.label('rod force', C.orange, 0.14);
    return { A, B, rod, F, fA, fB, lA, lB, lF, lT };
  },
  update(H, st, o){
    const V = st.V; if (!V || !st.tr) return;
    const L = 2.5, tau = tNow(st, st.tEnd), tt = tau < st.t0 ? tau - st.t0 : tau < st.t0 + 1.2 ? 0 : tau - st.t0 - 1.2;
    let rr = st.tr[0]; for (const r of st.tr){ if (r[0] <= tt) rr = r; else break; }
    const p = rr[1], sA = L * Math.sin(p), sB = L * Math.cos(p), T = rr[3];
    o.A.position.set(0, sA, 0); o.B.position.set(-sB, 0.07, 0);
    o.rod.position.set(-sB, 0.07, 0.13); o.rod.scale.x = Math.hypot(sB, sA - 0.07); o.rod.rotation.z = Math.atan2(sA - 0.07, sB);
    o.F.set([-sB - 0.85, 0.07, 0], [0.65, 0, 0]); put(o.lF, -sB - 0.95, 0.07, 0);
    const ux = Math.cos(p), uy = Math.sin(p), k = 0.015;
    o.fA.set([0, sA, 0.13], [-ux * T * k, -uy * T * k, 0]); o.fB.set([-sB, 0.07, 0.13], [ux * T * k, uy * T * k, 0]);
    put(o.lA, -0.3, sA + 0.15, 0.15); put(o.lB, -sB, 0.32, 0.15); put(o.lT, -sB / 2, sA / 2 + 0.25, 0.15, Math.abs(T) > 0.5);
  }
});

})();
