/* 3D views for the Chapter 1 Section B examples (1.B.1 – 1.B.2). Each view reads the live state of the 2D clip with the same id.
   The problem's z axis (vertical) is the scene's y axis. */
(function(){
function polyline(H, color, opacity = 1, dashed = false){
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
  const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.05, gapSize: 0.04, transparent: opacity < 1, opacity }) : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const L = new THREE.Line(g, m); H.add(L);
  return { obj: L, set(pts){ const a = new Float32Array(pts.length * 3); pts.forEach((p, i) => { a[3 * i] = p[0]; a[3 * i + 1] = p[1]; a[3 * i + 2] = p[2] || 0; });
    L.geometry.setAttribute('position', new THREE.BufferAttribute(a, 3)); L.geometry.computeBoundingSphere(); if (dashed) L.computeLineDistances(); } };
}

/* ---------------------------------------------------------------- 1.B.1  mixing device (real size, metres)
   Bowl of radius 0.19 m standing on the floor; a crossbar across the rim carries a bearing collar. The shaft slides and
   spins in the collar; the disk (radius r) is fixed to the shaft. Disk height = Y0 + z. */
view3d({
  id: 'x1b-1', size: 0.55, target: [0, 0.2, 0], camera: [-0.35, 0.55, 1],
  build(H){
    const R = 0.19, Hb = 0.3, Y0 = 0.16;
    H.floor(-0.4, 0.4, 0.4);
    const wall = H.mesh(new THREE.CylinderGeometry(R, R, Hb, 64, 1, true), '#cfd8ea', null, { transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    wall.position.y = Hb / 2; wall.castShadow = false;
    const bottom = H.mesh(new THREE.CylinderGeometry(R, R, 0.01, 64), '#d8d2c2'); bottom.position.y = 0.005;
    const rim = H.ring(R, 0.004, 2 * Math.PI, H.C.steel); rim.rotation.x = Math.PI / 2; rim.position.y = Hb;
    const bar = H.box(2 * R + 0.02, 0.015, 0.03, H.C.dark); bar.position.y = Hb + 0.008;
    const collar = H.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 24), H.C.steel); collar.position.y = Hb + 0.02;
    const moving = new THREE.Group(); H.add(moving);       // shaft + disk: translates with z
    const spin = new THREE.Group(); moving.add(spin);        // turns with θ
    const shaft = H.mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 16), '#6d727c', moving); shaft.position.y = 0.18;
    const disk = H.mesh(new THREE.CylinderGeometry(1, 1, 0.012, 64), H.C.body, spin);
    const mark = H.box(1, 0.004, 0.006, H.C.orange, spin); mark.position.y = 0.007;
    const A = H.sphere(0.009, H.C.orange, spin);
    const trail = polyline(H, 0x2457d6, 0.8);
    const aA = H.arrow(H.C.red, 0.3);
    const lA = H.label('A', H.C.orange, 0.045), la = H.label('a_A', H.C.red, 0.045), lw = H.label('ω', H.C.purple, 0.045);
    const curl = H.ring(0.035, 0.003, 1.6 * Math.PI, H.C.purple); curl.rotation.x = -Math.PI / 2; curl.userData.avoid = true;
    return { R, Y0, moving, spin, disk, mark, A, trail, aA, lA, la, lw, curl, tr: [], lastTau: 0 };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const { r, w: om, z0, n } = st.V, z = st.z, th = st.th, t = st.tau;
    o.disk.scale.set(r, 1, r); o.mark.scale.set(r, 1, 1); o.mark.position.x = r / 2; o.A.position.set(r, 0.008, 0);
    o.moving.position.y = o.Y0 + z; o.spin.rotation.y = th;      // CCW seen from above
    const pA = [r * Math.cos(th), o.Y0 + z + 0.008, -r * Math.sin(th)];
    if (t < o.lastTau) o.tr = []; o.lastTau = t; o.tr.push(pA); if (o.tr.length > 300) o.tr.shift(); o.trail.set(o.tr.length > 1 ? o.tr : [pA, pA]);
    const ah = r * om * om, zdd = -z0 * (2 * Math.PI * n) ** 2 * Math.sin(2 * Math.PI * n * t), amax = Math.hypot(ah, z0 * (2 * Math.PI * n) ** 2) || 1, kk = 0.14 / amax;
    const av = [-ah * Math.cos(th) * kk, zdd * kk, ah * Math.sin(th) * kk];
    o.aA.set(pA, av);
    o.lA.position.set(pA[0] * 1.35, pA[1] + 0.03, pA[2] * 1.35); o.la.position.set(pA[0] + av[0] * 1.2, pA[1] + av[1] * 1.2 - 0.01, pA[2] + av[2] * 1.2);
    o.curl.position.y = o.Y0 + z + 0.33; o.lw.position.set(0.06, o.Y0 + z + 0.35, 0);
  }
});

/* ---------------------------------------------------------------- 1.B.2  particle on the saddle z = xy/2
   Problem (x, y, z) → scene (x, z, −y) · s, with s = 0.1. */
view3d({
  id: 'x1b-2', size: 2.05, target: [0, 0.05, 0], camera: [0.55, 0.6, 1],
  build(H){
    const s = 0.1, M = (x, y, z) => [x * s, z * s, -y * s];
    // surface mesh over a disk of radius 7
    const nr = 14, np = 48, pos = [], idx = [];
    for (let i = 0; i <= nr; i++) for (let j = 0; j <= np; j++){ const rr = 6.6 * i / nr, ph = 2 * Math.PI * j / np, x = rr * Math.cos(ph), y = rr * Math.sin(ph); pos.push(...M(x, y, x * y / 2)); }
    for (let i = 0; i < nr; i++) for (let j = 0; j < np; j++){ const a = i * (np + 1) + j, b = a + np + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const surf = H.mesh(g, '#e9d9a8', null, { side: THREE.DoubleSide, transparent: true, opacity: 0.55 }); surf.castShadow = false; surf.receiveShadow = false;
    // grid lines on the surface: circles r = const and radial lines
    for (let rr = 1.75; rr <= 6.61; rr += 1.65){ const L = polyline(H, 0xb8a774, 0.6), q = []; for (let j = 0; j <= 96; j++){ const ph = 2 * Math.PI * j / 96, x = rr * Math.cos(ph), y = rr * Math.sin(ph); q.push(M(x, y, x * y / 2)); } L.set(q); }
    for (let j = 0; j < 16; j++){ const L = polyline(H, 0xb8a774, 0.6), q = [], ph = 2 * Math.PI * j / 16; for (let i = 0; i <= 28; i++){ const rr = 6.6 * i / 28, x = rr * Math.cos(ph), y = rr * Math.sin(ph); q.push(M(x, y, x * y / 2)); } L.set(q); }
    const axes = [[[-9, 0, 0], [9, 0, 0], 'x'], [[0, -9, 0], [0, 9, 0], 'y'], [[0, 0, -12], [0, 0, 12], 'z']];
    axes.forEach(([a, b, l]) => { const L = polyline(H, 0x7b808c); L.set([M(...a), M(...b)]); const lb = H.label(l, '#7b808c', 0.08); lb.position.set(...M(...b.map(c => c * 1.07))); });
    const path = polyline(H, 0x2457d6); const pts = []; for (let i = 0; i <= 240; i++){ const t = i / 240; pts.push(M(6 * Math.sin(2 * Math.PI * t), 6 * Math.cos(2 * Math.PI * t), 9 * Math.sin(4 * Math.PI * t))); } path.set(pts);
    const shadow = polyline(H, 0x9aa0a8, 0.8, true); shadow.set(pts.map(p => [p[0], 0, p[2]]));
    const drop = polyline(H, 0x9aa0a8, 0.8, true);
    const P = H.sphere(0.04, H.C.blue);
    const v = H.arrow(H.C.orange, 0.6), a = H.arrow(H.C.red, 0.6);
    const lP = H.label('P', '#1c1d21', 0.08), lv = H.label('v', H.C.orange, 0.09), la = H.label('a', H.C.red, 0.09);
    return { M, P, v, a, lP, lv, la, drop };
  },
  update(H, st, o){
    if (st.tau === undefined) return;
    const t = st.tau, W = 2 * Math.PI, M = o.M;
    const p = [6 * Math.sin(W * t), 6 * Math.cos(W * t), 9 * Math.sin(2 * W * t)];
    const v = [6 * W * Math.cos(W * t), -6 * W * Math.sin(W * t), 18 * W * Math.cos(2 * W * t)];
    const a = [-6 * W * W * Math.sin(W * t), -6 * W * W * Math.cos(W * t), -36 * W * W * Math.sin(2 * W * t)];
    const P = M(...p); o.P.position.set(...P); o.drop.set([P, [P[0], 0, P[2]]]);
    const cl = (u, k, m) => { const L = Math.hypot(...u) * k, f = L > m ? m / L : 1; return M(u[0] * k * f / 0.1, u[1] * k * f / 0.1, u[2] * k * f / 0.1); };
    const vv = cl(v, 0.004, 0.6), aa = cl(a, 0.0016, 0.6);
    o.v.set(P, vv); o.a.set(P, aa);
    o.lP.position.set(P[0] - 0.08, P[1] + 0.08, P[2]);
    o.lv.position.set(P[0] + vv[0] * 1.12, P[1] + vv[1] * 1.12, P[2] + vv[2] * 1.12); o.la.position.set(P[0] + aa[0] * 1.12, P[1] + aa[1] * 1.12, P[2] + aa[2] * 1.12);
  }
});

})();
