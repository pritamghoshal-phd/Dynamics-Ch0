/* 3D views for the vector examples 0.A.1 – 0.A.3. Each view reads the live state of the 2D clip with the same id. */
(function(){

// math axes (x, y, z) with z up  ->  three.js axes: math y -> X (right), math z -> Y (up), math x -> Z (toward the viewer)
const M = (p, s = 1) => [p[1] * s, p[2] * s, p[0] * s];

function axisLine(H, a, b, color = '#8a8478'){
  const c = H.cable([a, b], color, 0.006); return c;
}
function dashed(H, a, b, color = '#8a8478', dash = 0.06){
  const g = H.group(), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.floor(L / (2 * dash)));
  const segs = [];
  for (let k = 0; k < n; k++) segs.push(H.cable([[0, 0, 0], [0, 0.01, 0]], color, 0.004));
  const set = (p, q) => { const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], LL = Math.hypot(...d), m = Math.max(1, Math.floor(LL / (2 * dash)));
    segs.forEach((s, k) => { if (k >= m || LL < 1e-4){ s.group.visible = false; return; } s.group.visible = true;
      const t0 = k / m, t1 = (k + 0.5) / m; s.set([[p[0] + d[0] * t0, p[1] + d[1] * t0, p[2] + d[2] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1, p[2] + d[2] * t1]]); }); };
  set(a, b); return { set };
}

// solid arrow (cylinder shaft + cone head); set(origin, vector)
function fatArrow(H, color, r = 0.014){
  const T = H.THREE, g = new T.Group(); H.add(g);
  const shaft = H.mesh(new T.CylinderGeometry(r, r, 1, 12), color, g), head = H.mesh(new T.ConeGeometry(r * 2.6, 1, 16), color, g);
  const up = new T.Vector3(0, 1, 0);
  return { obj: g, set(o, v){ const L = Math.hypot(v[0], v[1], v[2] || 0); g.visible = L > 1e-4; if (!g.visible) return;
    const hl = Math.min(r * 8, 0.45 * L); g.position.set(o[0], o[1], o[2] || 0);
    g.quaternion.setFromUnitVectors(up, new T.Vector3(v[0] / L, v[1] / L, (v[2] || 0) / L));
    shaft.scale.set(1, L - hl, 1); shaft.position.y = (L - hl) / 2; head.scale.set(1, hl, 1); head.position.y = L - hl / 2; } };
}
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/* 0.A.1  The vectors a = (1, −3, 5) and b = (−2, −4, 6), drawn at 0.15 m per unit, and the chosen operation. */
view3d({
  id: 'x0a-1', size: 1.6, target: [-0.35, 0.65, 0.05], camera: [-1, 0.4, 0.5],
  build(H){
    const s = 0.15, T = H.THREE;
    // the xy plane of the problem (a light square grid) and the three axes
    const grid = new T.GridHelper(2.4, 16, 0xb8b3a6, 0xd9d4c6); grid.position.set(0, 0, 0); H.add(grid);
    [[[7, 0, 0], 'x'], [[0, 7, 0], 'y'], [[0, 0, 12], 'z']].forEach(([e, n]) => { axisLine(H, M(e.map(v => -v * 0.2), s), M(e, s)); H.label(n, '#7b808c', 0.12).position.set(...M(e.map(v => v * 1.07), s)); });
    const aA = fatArrow(H, H.C.blue), aB = fatArrow(H, H.C.red), aR = fatArrow(H, H.C.green, 0.017);
    const la = H.label('a', H.C.blue), lb = H.label('b', H.C.red), lr = {};
    ['a + b', 'a − b', 'projection of b on a', 'a × b (× 0.35)', 'b × a (× 0.35)'].forEach(t => { lr[t] = H.label(t, H.C.green, 0.14); });
    const shA = dashed(H, [0, 0, 0], [0, 0, 0], H.C.blue), shB = dashed(H, [0, 0, 0], [0, 0, 0], H.C.red), dl = dashed(H, [0, 0, 0], [0, 0, 0]);
    const shA2 = dashed(H, [0, 0, 0], [0, 0, 0], H.C.blue), shB2 = dashed(H, [0, 0, 0], [0, 0, 0], H.C.red), aux = fatArrow(H, '#9aa0a8', 0.009);
    return { s, aA, aB, aR, la, lb, lr, shA, shB, shA2, shB2, dl, aux };
  },
  update(H, st, o){
    if (!st.a) return;
    const s = o.s, a = st.a, b = st.b, O = [0, 0, 0];
    o.aA.set(O, M(a, s)); o.aB.set(O, M(b, s));
    o.la.position.set(...M(a.map(v => v * 1.08), s)); o.lb.position.set(...M(b.map(v => v * 1.08), s));
    // shadows of a and b on the xy plane
    o.shA.set(O, M([a[0], a[1], 0], s)); o.shA2.set(M([a[0], a[1], 0], s), M(a, s));
    o.shB.set(O, M([b[0], b[1], 0], s)); o.shB2.set(M([b[0], b[1], 0], s), M(b, s));
    let r, lab, aux = null, dash = null;
    if (st.op === 'add'){ r = a.map((x, i) => x + b[i]); lab = 'a + b'; aux = [a, b]; }
    else if (st.op === 'sub'){ r = a.map((x, i) => x - b[i]); lab = 'a − b'; aux = [b, a.map((x, i) => x - b[i])]; }
    else if (st.op === 'dot'){ const n = Math.hypot(...a), u = a.map(x => x / n), p = dot3(b, u); r = u.map(x => x * p); lab = 'projection of b on a'; dash = [b, r]; }
    else { r = (st.op === 'ab' ? cross3(a, b) : cross3(b, a)).map(x => x * 0.35); lab = st.op === 'ab' ? 'a × b (× 0.35)' : 'b × a (× 0.35)'; }
    o.aR.set(O, M(r, s));
    Object.entries(o.lr).forEach(([t, sp]) => { sp.visible = t === lab; if (sp.visible) sp.position.set(...M(r.map(v => v * 1.1), s)); });
    // the second vector placed at the tip of the first (head-to-tail) for a + b and a − b
    if (aux){ o.aux.set(M(st.op === 'add' ? a : b, s), M(st.op === 'add' ? b : a.map((x, i) => x - b[i]), s)); } else o.aux.set(O, [0, 0, 0]);
    if (dash) o.dl.set(M(dash[0], s), M(dash[1], s)); else o.dl.set(O, O);
  }
});

/* 0.A.2 and 0.A.3  One vector, the fixed XY axes and the xy axes turned by θ about the z axis (out of the page).
   The XY plane is the vertical picture plane; 1 unit = 0.25 m. */
function basisView(id, name, givenXY){
  view3d({
    id, size: 2.4, target: [0, 0.1, 0], camera: [0.45, 0.3, 1],
    build(H){
      const s = 0.3, T = H.THREE;
      const grid = new T.GridHelper(4, 16, 0xb8b3a6, 0xd9d4c6); grid.rotation.x = Math.PI / 2; H.add(grid);
      // a thin translucent plate shows the XY plane
      const plate = H.mesh(new T.PlaneGeometry(4, 4), '#f3efe4', null, { transparent: true, opacity: 0.55, side: T.DoubleSide }); plate.position.z = -0.002; plate.castShadow = false;
      axisLine(H, [-1.95, 0, 0], [1.95, 0, 0]); axisLine(H, [0, -1.95, 0], [0, 1.95, 0]);
      H.label('X', '#7b808c', 0.13).position.set(2.05, -0.08, 0); H.label('Y', '#7b808c', 0.13).position.set(0.08, 2.05, 0);
      // z axis (the axis of the rotation θ), dashed, with a curved arrow
      dashed(H, [0, 0, -0.2], [0, 0, 1.1]); H.label('z', '#7b808c', 0.12).position.set(0.05, 0.05, 1.18);
      const xy = new T.Group(); H.add(xy);
      const lx = H.cable([[-1.7, 0, 0.004], [1.7, 0, 0.004]], H.C.purple, 0.007), ly = H.cable([[0, -1.7, 0.004], [0, 1.7, 0.004]], H.C.purple, 0.007);
      const Lx = H.label('x', H.C.purple, 0.13), Ly = H.label('y', H.C.purple, 0.13);
      const ui = fatArrow(H, H.C.purple, 0.012), uj = fatArrow(H, H.C.purple, 0.012), li = H.label('î', H.C.purple, 0.12), lj = H.label('ĵ', H.C.purple, 0.12);
      const curl = new T.Group(); H.add(curl); curl.userData.avoid = true;
      const ring = H.ring(0.42, 0.008, 1, H.C.purple, curl);
      const head = H.mesh(new T.ConeGeometry(0.025, 0.07, 12), H.C.purple, curl);
      const lth = H.label('θ', H.C.purple, 0.13);
      const av = fatArrow(H, H.C.red, 0.016), c1 = fatArrow(H, H.C.green, 0.014), c2 = fatArrow(H, H.C.green, 0.014);
      const lv = H.label(name, H.C.red), l1 = H.label(givenXY ? name + '_x' : name + '_X', H.C.green, 0.13), l2 = H.label(givenXY ? name + '_y' : name + '_Y', H.C.green, 0.13);
      const d1 = dashed(H, [0, 0, 0], [0, 0, 0]), d2 = dashed(H, [0, 0, 0], [0, 0, 0]);
      return { s, lx, ly, Lx, Ly, ui, uj, li, lj, curl, ring, head, lth, av, c1, c2, lv, l1, l2, d1, d2 };
    },
    update(H, st, o){
      if (st.th === undefined) return;
      const s = o.s, th = st.th, e1 = [Math.cos(th), Math.sin(th), 0], e2 = [-Math.sin(th), Math.cos(th), 0], z = 0.006;
      o.lx.set([[-1.95 * e1[0], -1.95 * e1[1], z], [1.95 * e1[0], 1.95 * e1[1], z]]); o.ly.set([[-1.95 * e2[0], -1.95 * e2[1], z], [1.95 * e2[0], 1.95 * e2[1], z]]);
      o.Lx.position.set(2.07 * e1[0], 2.07 * e1[1], 0); o.Ly.position.set(2.07 * e2[0], 2.07 * e2[1], 0);
      o.ui.set([0, 0, z], e1.map(v => v * 0.5)); o.uj.set([0, 0, z], e2.map(v => v * 0.5));
      o.li.position.set(e1[0] * 0.62, e1[1] * 0.62, 0.02); o.lj.position.set(e2[0] * 0.62, e2[1] * 0.62, 0.02);
      // curved arrow for θ from X toward x
      const A = Math.max(0.05, Math.abs(th)), sg = th >= 0 ? 1 : -1;
      if (o.ring.userData.A !== A){ o.ring.geometry.dispose(); o.ring.geometry = new H.THREE.TorusGeometry(0.42, 0.008, 8, 48, A); o.ring.userData.A = A; }
      o.ring.rotation.z = sg > 0 ? 0 : -A;
      o.head.position.set(0.42 * Math.cos(th), 0.42 * Math.sin(th), 0); o.head.rotation.z = th + (sg > 0 ? 0 : Math.PI);
      o.curl.visible = Math.abs(th) > 0.03; o.lth.visible = o.curl.visible; o.lth.position.set(0.55 * Math.cos(th / 2), 0.55 * Math.sin(th / 2), 0.02);
      const v = [st.vX * s, st.vY * s, 0.012];
      o.av.set([0, 0, 0.012], v); o.lv.position.set(v[0] * 1.1, v[1] * 1.1, 0.03);
      let p1, p2;
      if (givenXY){ p1 = e1.map(q => q * st.vx * s); p2 = e2.map(q => q * st.vy * s); }
      else { p1 = [st.vX * s, 0, 0]; p2 = [0, st.vY * s, 0]; }
      o.c1.set([0, 0, 0.01], p1); o.c2.set([0, 0, 0.01], p2);
      o.l1.position.set(p1[0] * 0.55 + 0.001, p1[1] * 0.55, 0.03); o.l2.position.set(p2[0] * 0.55, p2[1] * 0.55 + 0.001, 0.03);
      o.d1.set([v[0], v[1], 0.01], [p1[0], p1[1], 0.01]); o.d2.set([v[0], v[1], 0.01], [p2[0], p2[1], 0.01]);
    }
  });
}
basisView('x0a-2', 'a', true);
basisView('x0a-3', 'b', false);

})();
