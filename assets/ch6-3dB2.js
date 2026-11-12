/* 3D views for examples 6.B.5 – 6.B.10. Each view reads the live state of the 2D clip with the same id (x6b-5 … x6b-10 in
   ch6-exB2.js), so the motion is computed once. Lengths are in metres and match the 2D pictures. */
(function(){

/* ---------- local helpers ---------- */
// helical spring between two points; rebuilt when its length changes so the wire keeps its thickness
function spring(H, R, turns, wire, color){
  const T = H.THREE, m = new T.Mesh(new T.BufferGeometry(), H.mat(color || '#5b6270', { metalness: 0.35, roughness: 0.4 }));
  m.castShadow = true; H.add(m); let lastL = -1;
  return { mesh: m, set(a, b){
    const A = new T.Vector3(...a), B = new T.Vector3(...b), L = Math.max(A.distanceTo(B), 1e-3);
    if (Math.abs(L - lastL) > 2e-4){
      lastL = L; const lead = Math.min(0.08 * L, 1.5 * R), N = Math.round(turns * 16), pts = [new T.Vector3(0, 0, 0), new T.Vector3(0, lead * 0.6, 0)];
      for (let i = 0; i <= N; i++){ const u = i / N, a2 = 2 * Math.PI * turns * u, f = Math.min(1, 4 * u, 4 * (1 - u)); pts.push(new T.Vector3(R * Math.cos(a2) * f, lead + (L - 2 * lead) * u, R * Math.sin(a2) * f)); }
      pts.push(new T.Vector3(0, L - lead * 0.6, 0), new T.Vector3(0, L, 0));
      m.geometry.dispose(); m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), N + 8, wire, 6, false);
    }
    m.position.copy(A); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  } };
}
// dashpot: a see-through cylinder fixed at F, a rod of fixed length hanging from the moving end M, a piston at the rod's end.
// lead, cyl and rod (metres) are the same as in the 2D picture, so the piston stays inside the cylinder for the whole motion.
function dashpot(H, Rc, lead, cyl, rod){
  const T = H.THREE, g = new T.Group(); H.add(g);
  const geo = new T.CylinderGeometry(Rc, Rc, cyl, 24, 1, true); geo.translate(0, lead + cyl / 2, 0);
  const tube = new T.Mesh(geo, H.mat('#9aa0a8', { transparent: true, opacity: 0.45, side: T.DoubleSide, metalness: 0.3 })); g.add(tube);
  const cap = H.disk(Rc, 0.004, '#6d7480', g); cap.rotation.x = Math.PI / 2; cap.position.y = lead;
  const stem = H.mesh(new T.CylinderGeometry(Rc * 0.25, Rc * 0.25, lead, 8), '#3a3d44', g); stem.position.y = lead / 2;
  const piston = H.disk(Rc * 0.86, 0.006, '#3a3d44', g); piston.rotation.x = Math.PI / 2;
  const rodM = H.mesh(new T.CylinderGeometry(Rc * 0.22, Rc * 0.22, 1, 8), '#3a3d44', g);
  return { group: g, set(F, M){
    const A = new T.Vector3(...F), B = new T.Vector3(...M), L = A.distanceTo(B);
    g.position.copy(A); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    piston.position.y = L - rod; rodM.scale.y = rod; rodM.position.y = L - rod / 2;
  } };
}
const plate = (H, w, d, color = '#6d7480') => H.box(w, 0.01, d, color);

/* ---------- 6.B.5  stepped pulley (clip 'x6b-5') ----------
   O is 1.1 m above the floor. Outer disc (R = 0.4 m) in the plane z ≈ −0.04, inner drum (r = 0.1 m) in front of it at z ≈ 0.04,
   so the two cables from the inner drum hang in front of the outer disc. The axle rests on a post standing behind the pulley. */
view3d({
  id: 'x6b-5', size: 1.7, target: [0.35, 0.8, 0], camera: [-0.3, 0.25, 1],
  build(H){
    const Oy = 1.1, R = 0.4, r = 0.1;
    H.floor(-0.7, 1.45, 0.45); H.wall(1.26, 0, 1.9, 0.3);
    const post = H.box(0.05, Oy, 0.05, H.C.steel); post.position.set(0, Oy / 2, -0.2);
    plate(H, 0.2, 0.16).position.set(0, 0.005, -0.2);
    H.disk(0.016, 0.33, H.C.dark).position.set(0, Oy, -0.05);
    const pul = new H.THREE.Group(); pul.position.set(0, Oy, 0); H.add(pul);
    H.disk(R, 0.06, '#d9dbe0', pul).position.z = -0.04; H.disk(r, 0.1, '#eceef2', pul).position.z = 0.04;          // touches the outer disc (one rigid pulley)
    const mk = H.box(R - r - 0.04, 0.03, 0.006, H.C.orange, pul); mk.position.set((R + r) / 2, 0, -0.007);
    const blk = H.box(0.12, 0.12, 0.09, '#cfd8ea');   // 0.09 deep, so it hangs entirely in front of the outer disc
    const k1 = spring(H, 0.025, 9, 0.004), k2 = spring(H, 0.03, 9, 0.004);
    const cm = H.cable([[0, 0, 0], [0, 1, 0]]), c1 = H.cable([[0, 0, 0], [0, 1, 0]]), c2 = H.cable([[0, 0, 0], [0, 1, 0]]);
    plate(H, 0.06, 0.06).position.set(r, 0.005, 0.04);
    H.label('m').position.set(-0.28, 0.4, 0.1); H.label('O').position.set(0.1, Oy + 0.1, 0.14);
    const l1 = H.label('k_1'), l2 = H.label('k_2');
    return { Oy, R, r, pul, blk, k1, k2, cm, c1, c2, l1, l2 };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], { Oy, R, r } = o;
    o.pul.rotation.z = th;
    const yTop = Oy - 0.45 - r * th; o.blk.position.set(-r, yTop - 0.06, 0.04);
    o.cm.set([[-r, Oy, 0.04], [-r, yTop, 0.04]]);
    const yc = Oy - 0.6 + r * th; o.c1.set([[r, Oy, 0.04], [r, yc, 0.04]]); o.k1.set([r, yc, 0.04], [r, 0.01, 0.04]);
    const xs = 0.45 - 4 * r * th; o.c2.set([[0, Oy + R, -0.04], [xs, Oy + R, -0.04]]); o.k2.set([xs, Oy + R, -0.04], [1.2, Oy + R, -0.04]);
    o.l1.position.set(r + 0.1, yc / 2, 0.1); o.l2.position.set((xs + 1.2) / 2, Oy + R + 0.1, -0.04);
  }
});

/* ---------- 6.B.6  hanging block, dashpot to the floor (clip 'x6b-6') ----------
   Heights as in the 2D picture: ceiling 0.5 m above the floor, unstretched spring 0.12 m, block 0.05 m tall,
   cylinder 0.20 m standing on the floor (10 mm stem), rod 0.20 m. */
view3d({
  id: 'x6b-6', size: 0.5, target: [0, 0.27, 0], camera: [-0.35, 0.2, 1],
  build(H){
    H.floor(-0.3, 0.3, 0.2); H.ceiling(-0.3, 0.3, 0.5, 0.15);
    plate(H, 0.05, 0.05).position.set(0, 0.495, 0); plate(H, 0.05, 0.05).position.set(0, 0.005, 0);
    const blk = H.box(0.1, 0.05, 0.08, '#cfd8ea'), k = spring(H, 0.018, 10, 0.0025), c = dashpot(H, 0.013, 0.01, 0.2, 0.2);
    const ref = H.box(0.16, 0.002, 0.002, H.C.green); const lab = H.label('equilibrium', H.C.green, 0.025);
    H.label('m').position.set(-0.09, 0.3, 0.06); H.label('k').position.set(-0.06, 0.44, 0.05); H.label('c').position.set(-0.05, 0.12, 0.05);
    return { blk, k, c, ref, lab };
  },
  update(H, st, o){
    if (!st.s) return;
    const dst = st.V.m * G0 / st.V.k, yTop = 0.5 - (0.12 + dst + st.s[0]);
    o.blk.position.set(0, yTop - 0.025, 0); o.k.set([0, 0.5, 0], [0, yTop, 0]); o.c.set([0, 0, 0], [0, yTop - 0.05, 0]);
    o.ref.position.set(0.14, 0.5 - 0.12 - dst, 0); o.lab.position.set(0.27, 0.5 - 0.12 - dst, 0);
  }
});

/* ---------- 6.B.7  spring k above, spring 2k and dashpot below (clip 'x6b-7') ----------
   Ceiling 0.52 m above the floor, upper spring 0.18 m at equilibrium, block 0.20 × 0.12 m, lower spring at x = −0.055 m and
   dashpot at x = +0.055 m (cylinder 0.14 m on a 10 mm stem, rod 0.12 m). */
view3d({
  id: 'x6b-7', size: 0.55, target: [0, 0.27, 0], camera: [-0.35, 0.2, 1],
  build(H){
    H.floor(-0.3, 0.3, 0.2); H.ceiling(-0.3, 0.3, 0.52, 0.15);
    [[0, 0.515], [-0.055, 0.005], [0.055, 0.005]].forEach(([x, y]) => plate(H, 0.045, 0.045).position.set(x, y, 0));
    const blk = H.box(0.2, 0.12, 0.12, '#cfd8ea'), k = spring(H, 0.02, 10, 0.003), k2 = spring(H, 0.02, 9, 0.003), c = dashpot(H, 0.016, 0.01, 0.14, 0.12);
    H.label('m').position.set(-0.15, 0.28, 0.08); H.label('k').position.set(-0.06, 0.44, 0.04); H.label('2k').position.set(-0.12, 0.1, 0.04); H.label('c').position.set(0.11, 0.1, 0.04);
    return { blk, k, k2, c };
  },
  update(H, st, o){
    if (!st.s) return;
    const yTop = 0.52 - (0.18 + st.s[0]), yBot = yTop - 0.12;
    o.blk.position.set(0, yTop - 0.06, 0); o.k.set([0, 0.52, 0], [0, yTop, 0]);
    o.k2.set([-0.055, 0, 0], [-0.055, yBot, 0]); o.c.set([0.055, 0, 0], [0.055, yBot, 0]);
  }
});

/* ---------- 6.B.8  block on a smooth 30° incline (clip 'x6b-8') ----------
   Slope coordinate s up the incline from the lower wall, height t above the surface: P(s, t) = s ê + t n̂ + (0, 0.06).
   Block 0.16 m along the slope, 0.12 m high, centre at s = 0.42 − x. Spring 4k at t = 0.10, dashpot at t = 0.03 (cylinder 0.24 m,
   rod 0.16 m), spring k at t = 0.06 to the upper wall at s = 0.9 m. */
view3d({
  id: 'x6b-8', size: 0.85, target: [0.38, 0.28, 0], camera: [-0.25, 0.35, 1],
  build(H){
    const T = H.THREE, a = 30 * RAD, e = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)], Ls = 0.9;
    const h0 = 0.06, P = (s, t) => [s * e[0] + t * n[0], h0 + s * e[1] + t * n[1]];   // the incline starts 0.06 m above the floor
    H.floor(-0.2, 1.0, 0.3);
    const B = P(Ls + 0.04, 0), A = P(-0.04, 0), sh = new T.Shape(); sh.moveTo(A[0], 0); sh.lineTo(B[0], 0); sh.lineTo(B[0], B[1]); sh.lineTo(A[0], A[1]); sh.closePath();  // top edge is exactly the slope
    const wg = new T.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }); wg.translate(0, 0, -0.15);
    H.mesh(wg, '#e2dccd');
    [[0, -1], [Ls, 1]].forEach(([s, side]) => { const w = H.box(0.02, 0.2, 0.3, H.C.wall); const c = P(s + side * 0.01, 0.1); w.position.set(c[0], c[1], 0); w.rotation.z = a; });
    const blk = H.box(0.16, 0.12, 0.14, '#cfd8ea'); blk.rotation.z = a;
    const k4 = spring(H, 0.018, 9, 0.003), k1 = spring(H, 0.016, 9, 0.003), c = dashpot(H, 0.015, 0.01, 0.24, 0.16);
    H.label('m').position.set(...P(0.42, 0.2), 0.08); H.label('4k').position.set(...P(0.15, 0.16), 0.03); H.label('k').position.set(...P(0.68, 0.13), 0.03); H.label('c').position.set(...P(0.12, -0.01), 0.1);
    return { P, a, blk, k4, k1, c, Ls };
  },
  update(H, st, o){
    if (!st.s) return;
    const P = o.P, sb = 0.42 - st.s[0], lo = sb - 0.08, hi = sb + 0.08, C = P(sb, 0.06);
    o.blk.position.set(C[0], C[1], 0);
    o.k4.set([...P(0, 0.1), 0], [...P(lo, 0.1), 0]); o.c.set([...P(0, 0.03), 0], [...P(lo, 0.03), 0]); o.k1.set([...P(hi, 0.06), 0], [...P(o.Ls, 0.06), 0]);
  }
});

/* ---------- 6.B.9  horizontal spring and dashpot (clip 'x6b-9') ----------
   Wall at x = 0, block 0.10 m on a smooth floor, left face 0.20 m from the wall at equilibrium. Spring at a height of 0.07 m,
   dashpot at 0.025 m (cylinder 0.10 m, rod 0.12 m). */
view3d({
  id: 'x6b-9', size: 0.42, target: [0.17, 0.06, 0], camera: [-0.2, 0.35, 1],
  build(H){
    H.floor(-0.03, 0.42, 0.14); H.wall(0, 0, 0.18, 0.14);
    const blk = H.box(0.1, 0.1, 0.1, '#cfd8ea'), k = spring(H, 0.015, 9, 0.0025), c = dashpot(H, 0.012, 0.01, 0.1, 0.12);
    H.label('m').position.set(0.25, 0.13, 0.06); H.label('k').position.set(0.1, 0.105, 0.03); H.label('c').position.set(0.06, 0.0, 0.06);
    H.label('smooth floor', '#7b808c', 0.018).position.set(0.36, 0.01, 0.12);
    return { blk, k, c };
  },
  update(H, st, o){
    if (!st.s) return;
    const f = 0.2 + st.s[0];
    o.blk.position.set(f + 0.05, 0.05, 0); o.k.set([0, 0.07, 0], [f, 0.07, 0]); o.c.set([0, 0.025, 0], [f, 0.025, 0]);
  }
});

/* ---------- 6.B.10  the same system without and with damping (clip 'x6b-10') ----------
   Two identical blocks side by side on one smooth floor: undamped at z = +0.12 m, damped at z = −0.12 m. */
view3d({
  id: 'x6b-10', size: 0.42, target: [0.2, 0.05, 0], camera: [-0.25, 0.45, 1],
  build(H){
    H.floor(-0.03, 0.42, 0.22); H.wall(0, 0, 0.14, 0.22);
    const bu = H.box(0.1, 0.08, 0.08, '#cfd8ea'), bd = H.box(0.1, 0.08, 0.08, '#f3d9c6');
    const ku = spring(H, 0.014, 9, 0.0025), kd = spring(H, 0.014, 9, 0.0025), c = dashpot(H, 0.011, 0.01, 0.155, 0.12);
    H.label('no damping', '#2457d6', 0.024).position.set(0.3, 0.13, 0.14); const lz = H.label('damped', '#e2621b', 0.024); lz.position.set(0.3, 0.13, -0.12);
    return { bu, bd, ku, kd, c };
  },
  update(H, st, o){
    if (!st.u) return;
    const fu = 0.22 + st.u[0], fd = 0.22 + st.d[0];
    o.bu.position.set(fu + 0.05, 0.04, 0.12); o.ku.set([0, 0.04, 0.12], [fu, 0.04, 0.12]);
    o.bd.position.set(fd + 0.05, 0.04, -0.12); o.kd.set([0, 0.058, -0.12], [fd, 0.058, -0.12]); o.c.set([0, 0.018, -0.12], [fd, 0.018, -0.12]);
  }
});

})();
