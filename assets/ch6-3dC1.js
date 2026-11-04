/* 3D views for Chapter 6 examples 6.C.1 – 6.C.6 (forced response).
   Each view reads the live state of the 2D clip with the same id (x6c-1 … x6c-6 in ch6-exC1.js):
   st.xd / st.xbd are the drawn displacements (m, the same scale as the 2D picture), st.th the rolling angle.
   Geometry is in metres and matches the 2D drawing. Springs are drawn as helices between their attachment points. */
(function(){
const TAU = 2 * Math.PI;

/* ---------- local helpers ---------- */
function spring(H, R, turns, wire, color){
  const T = H.THREE, m = new T.Mesh(new T.BufferGeometry(), H.mat(color || '#6d7480', { metalness: 0.35, roughness: 0.4 }));
  m.castShadow = true; H.add(m); let lastL = -1;
  return { mesh: m, set(a, b){
    const A = new T.Vector3(...a), B = new T.Vector3(...b), L = Math.max(A.distanceTo(B), 1e-3);
    if (Math.abs(L - lastL) > 1e-4){
      lastL = L; const lead = Math.min(0.1 * L, 2 * R), N = Math.round(turns * 16), pts = [new T.Vector3(0, 0, 0), new T.Vector3(0, lead * 0.6, 0)];
      for (let i = 0; i <= N; i++){ const u = i / N, a2 = TAU * turns * u, s = Math.min(1, 4 * u, 4 * (1 - u)); pts.push(new T.Vector3(R * Math.cos(a2) * s, lead + (L - 2 * lead) * u, R * Math.sin(a2) * s)); }
      pts.push(new T.Vector3(0, L - lead * 0.6, 0), new T.Vector3(0, L, 0));
      m.geometry.dispose(); m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), N + 8, wire, 6, false);
    }
    m.position.copy(A); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  } };
}
// damper along +x from a fixed point A: a cylinder fixed at A, a rod fixed to the moving end B
function damper(H, R){
  const T = H.THREE, cyl = H.mesh(new T.CylinderGeometry(R, R, 1, 20), '#8a8f99'), rod = H.mesh(new T.CylinderGeometry(R * 0.28, R * 0.28, 1, 10), '#c9ccd2');
  cyl.rotation.z = Math.PI / 2; rod.rotation.z = Math.PI / 2;
  return { set(a, b, Lc){ const L = b[0] - a[0]; cyl.scale.y = Lc; cyl.position.set(a[0] + Lc / 2, a[1], a[2]); const r0 = a[0] + Lc * 0.6, rl = Math.max(b[0] - r0, 1e-3); rod.scale.y = rl; rod.position.set(r0 + rl / 2, b[1], b[2]); } };
}
// disk that rolls about z with a visible stripe, and a non-rotating collar on the front axle stub for the springs
function rollingDisk(H, R, depth){
  const g = H.group(); H.disk(R, depth, H.C.body, g);
  const s = H.box(R * 0.92, 0.012, depth + 0.004, H.C.dark, g); s.position.set(R * 0.46, 0, 0);
  H.disk(0.012, depth + 0.13, H.C.dark, g);
  return g;
}
const wallPlate = (H, x, y, z) => { const p = H.box(0.012, 0.06, 0.06, H.C.steel); p.position.set(x + 0.006, y, z); return p; };
function cartBody(H, BW, BH, RW, depth){
  const g = H.group(), body = H.box(BW, BH, depth, '#cfd8ea', g); body.position.set(BW / 2, 2 * RW + BH / 2, 0);
  const wheels = [];
  [BW * 0.22, BW * 0.78].forEach(x => [-1, 1].forEach(sz => { const w = H.group(); w.position.set(x, RW, sz * (depth / 2 + 0.012)); H.add(w, g);
    H.disk(RW, 0.018, '#55585f', w); const sp = H.box(RW * 1.6, 0.006, 0.02, H.C.orange, w); sp.position.z = sz * 0.002; wheels.push(w); }));
  return { g, wheels };
}

/* ---------- 6.C.1  rolling disk, spring to the wall, force at O ---------- */
view3d({
  id: 'x6c-1', size: 0.58, target: [0.4, 0.15, 0], camera: [-0.2, 0.35, 1],
  build(H){
    const R = 0.15, L0 = 0.55, zc = 0.09;
    H.floor(-0.05, 1.15, 0.35); H.wall(0, 0, 0.42, 0.35);
    wallPlate(H, 0, R, zc);
    const disk = rollingDisk(H, R, 0.08);
    const collar = H.disk(0.022, 0.03, H.C.steel); const sp = spring(H, 0.022, 9, 0.004);
    const F = H.arrow(H.C.orange, 0.45), f = H.arrow(H.C.red, 0.35);
    const lO = H.label('O', '#1c1d21', 0.05), lk = H.label('k', '#1c1d21', 0.05), lF = H.label('F(t)', H.C.orange, 0.05);
    return { R, L0, zc, disk, collar, sp, F, f, lO, lk, lF };
  },
  update(H, st, o){
    if (st.xd === undefined) return;
    const x = o.L0 + st.xd, F0 = Math.max(st.V.F0, 1e-9);
    o.disk.position.set(x, o.R, 0); o.disk.rotation.z = -st.th;
    o.collar.position.set(x, o.R, o.zc); o.sp.set([0.012, o.R, o.zc], [x - 0.022, o.R, o.zc]);
    o.F.set([x, o.R, o.zc + 0.03], [st.F / F0 * 0.16, 0, 0]); o.f.set([x, 0.004, 0], [st.f / F0 * 0.16, 0, 0]);
    o.lO.position.set(x, o.R + 0.05, o.zc + 0.03); o.lk.position.set(x / 2, o.R + 0.06, o.zc); o.lF.position.set(x + st.F / F0 * 0.16 + Math.sign(st.F || 1) * 0.05, o.R + 0.04, o.zc + 0.03);
    o.lF.visible = Math.abs(st.F) > 0.08 * F0;
  }
});

/* ---------- 6.C.2  cart, spring and damper to the base ---------- */
view3d({
  id: 'x6c-2', size: 0.58, target: [0.4, 0.13, 0], camera: [-0.25, 0.35, 1],
  build(H){
    const L0 = 0.42, BW = 0.24, BH = 0.15, RW = 0.03, D = 0.16;
    H.floor(-0.05, 1.0, 0.3); H.wall(0, 0, 0.36, 0.3);
    const ys = 2 * RW + 0.72 * BH, yd = 2 * RW + 0.28 * BH;
    wallPlate(H, 0, ys, 0); wallPlate(H, 0, yd, 0);
    const cart = cartBody(H, BW, BH, RW, D), sp = spring(H, 0.018, 9, 0.0035), dp = damper(H, 0.016);
    const F = H.arrow(H.C.orange, 0.4), FT = H.arrow(H.C.green, 0.4);
    const lm = H.label('m', '#1c1d21', 0.05), lT = H.label('F_T', H.C.green, 0.05), lk = H.label('k', '#1c1d21', 0.045), lc = H.label('c', '#1c1d21', 0.045);
    return { L0, BW, BH, RW, D, ys, yd, cart, sp, dp, F, FT, lm, lT, lk, lc };
  },
  update(H, st, o){
    if (st.xd === undefined) return;
    const xl = o.L0 + st.xd;
    o.cart.g.position.set(xl, 0, 0); o.cart.wheels.forEach(w => { w.rotation.z = -st.th; });
    o.sp.set([0.012, o.ys, 0], [xl, o.ys, 0]); o.dp.set([0.012, o.yd, 0], [xl, o.yd, 0], 0.62 * o.L0 - 0.012);
    const fs = 0.15 / st.f0, xr = xl + o.BW, ym = 2 * o.RW + o.BH / 2;
    if (st.F >= 0) o.F.set([xr, ym, 0], [st.F * fs, 0, 0]); else o.F.set([xr - st.F * fs, ym, 0], [st.F * fs, 0, 0]);
    const FTs = 0.15 / Math.max(178, Math.abs(st.FT)), ya = 2 * o.RW + o.BH + 0.06;
    o.FT.set([0.012, ya, 0], [st.FT * FTs, 0, 0]);
    o.lm.position.set(xl + o.BW / 2, ym, o.D / 2 + 0.02); o.lT.position.set(0.05, ya + 0.04, 0); o.lk.position.set(xl / 2, o.ys + 0.04, 0.03); o.lc.position.set(xl / 2, o.yd - 0.045, 0.03);
  }
});

/* ---------- 6.C.3  the same system on two parallel tracks, driven at ω1 and 2ω1 ---------- */
view3d({
  id: 'x6c-3', size: 0.68, target: [0.36, 0.1, 0], camera: [-0.3, 0.55, 1],
  build(H){
    const L0 = 0.38, BW = 0.2, BH = 0.12, RW = 0.025, D = 0.13, Z = [-0.17, 0.17];
    H.floor(-0.05, 0.95, 0.36); H.wall(0, 0, 0.3, 0.36);
    const ys = 2 * RW + 0.72 * BH, yd = 2 * RW + 0.28 * BH;
    const sys = Z.map(z => { wallPlate(H, 0, ys, z); wallPlate(H, 0, yd, z); return { z, cart: cartBody(H, BW, BH, RW, D), sp: spring(H, 0.015, 9, 0.003), dp: damper(H, 0.013), F: H.arrow(H.C.orange, 0.35) }; });
    const l1 = H.label('ω_1', H.C.orange, 0.05), l2 = H.label('ω_2 = 2ω_1', H.C.purple, 0.05);
    return { L0, BW, BH, RW, ys, yd, sys, l1, l2 };
  },
  update(H, st, o){
    if (st.xd === undefined) return;
    [[st.xd, st.th, st.w1], [st.xd2, st.th2, st.w2]].forEach(([xd, th, w], i) => {
      const s = o.sys[i], xl = o.L0 + xd;
      s.cart.g.position.set(xl, 0, s.z); s.cart.wheels.forEach(q => { q.rotation.z = -th; });
      s.sp.set([0.012, o.ys, s.z], [xl, o.ys, s.z]); s.dp.set([0.012, o.yd, s.z], [xl, o.yd, s.z], 0.62 * o.L0 - 0.012);
      const F = Math.sin(w * st.t) * 0.12, xr = xl + o.BW, ym = 2 * o.RW + o.BH / 2;
      if (F >= 0) s.F.set([xr, ym, s.z], [F, 0, 0]); else s.F.set([xr - F, ym, s.z], [F, 0, 0]);
    });
    o.l1.position.set(o.L0 + o.BW / 2 + st.xd, 2 * o.RW + o.BH + 0.05, o.sys[0].z); o.l2.position.set(o.L0 + o.BW / 2 + st.xd2, 2 * o.RW + o.BH + 0.05, o.sys[1].z);
  }
});

/* ---------- 6.C.4  rolling disk between a wall spring k and a spring 4k to the moving base B ---------- */
view3d({
  id: 'x6c-4', size: 0.62, target: [0.42, 0.13, 0], camera: [-0.2, 0.4, 1],
  build(H){
    const R = 0.12, L1 = 0.4, L2 = 0.34, zc = 0.08;
    H.floor(-0.05, 1.05, 0.35); H.wall(0, 0, 0.36, 0.35);
    wallPlate(H, 0, R, zc);
    const guide = H.box(0.2, 0.02, 0.3, '#b9b3a4'); guide.position.set(L1 + L2 + 0.01, 0.01, 0);    // guide fixed to the floor
    const plate = H.box(0.02, 0.24, 0.24, '#cfd8ea'); const shoe = H.box(0.06, 0.012, 0.26, H.C.steel);
    const disk = rollingDisk(H, R, 0.07), collar = H.disk(0.02, 0.03, H.C.steel);
    const s1 = spring(H, 0.02, 8, 0.004), s2 = spring(H, 0.02, 10, 0.0045);
    const aB = H.arrow(H.C.orange, 0.35);
    const lB = H.label('B', '#1c1d21', 0.05), lO = H.label('O', '#1c1d21', 0.045), lk = H.label('k', '#1c1d21', 0.045), l4 = H.label('4k', '#1c1d21', 0.045);
    return { R, L1, L2, zc, plate, shoe, disk, collar, s1, s2, aB, lB, lO, lk, l4 };
  },
  update(H, st, o){
    if (st.xd === undefined) return;
    const x = o.L1 + st.xd, xB = o.L1 + o.L2 + st.xbd;
    o.disk.position.set(x, o.R, 0); o.disk.rotation.z = -st.th; o.collar.position.set(x, o.R, o.zc);
    o.plate.position.set(xB + 0.01, 0.02 + 0.006 + 0.12, 0); o.shoe.position.set(xB + 0.01, 0.026, 0);
    o.s1.set([0.012, o.R, o.zc], [x - 0.02, o.R, o.zc]); o.s2.set([x + 0.02, o.R, o.zc], [xB, o.R, o.zc]);
    o.aB.set([xB + 0.01, 0.31, 0], [st.xbd / Math.max(st.b * st.sd, 1e-9) * 0.1, 0, 0]);
    o.lB.position.set(xB + 0.06, 0.26, 0.12); o.lO.position.set(x, o.R + 0.05, o.zc + 0.03); o.lk.position.set(x / 2, o.R + 0.05, o.zc); o.l4.position.set((x + xB) / 2, o.R + 0.05, o.zc);
  }
});

/* ---------- 6.C.5  block A inside box B on a smooth floor; the box is moved ---------- */
view3d({
  id: 'x6c-5', size: 0.62, target: [0, 0.12, 0], camera: [-0.15, 0.55, 1],
  build(H){
    const IN = 0.62, BWA = 0.16, BHA = 0.11, RW = 0.03, WALL = 0.025, D = 0.26, Hb = 0.2;
    const L0 = (IN - BWA) / 2;
    H.floor(-0.75, 0.75, 0.35);
    const box = H.group();
    const fl = H.box(IN + 2 * WALL, WALL, D, '#d6d0c2', box); fl.position.set(0, 2 * RW + WALL / 2, 0);
    [-1, 1].forEach(sx => { const w = H.box(WALL, Hb, D, '#d6d0c2', box); w.position.set(sx * (IN / 2 + WALL / 2), 2 * RW + WALL + Hb / 2, 0); });
    const back = H.box(IN, Hb * 0.6, 0.012, '#e2ddd0', box); back.position.set(0, 2 * RW + WALL + Hb * 0.3, -D / 2 + 0.006);
    const wheels = [];
    [-IN / 2 + 0.12, IN / 2 - 0.12].forEach(x => [-1, 1].forEach(sz => { const w = H.group(); w.position.set(x, RW, sz * (D / 2 + 0.012)); H.add(w, box); H.disk(RW, 0.018, '#55585f', w);
      const sp = H.box(RW * 1.6, 0.006, 0.02, H.C.orange, w); sp.position.z = sz * 0.002; wheels.push(w); }));
    const A = H.box(BWA, BHA, 0.14, '#cfd8ea');
    const s1 = spring(H, 0.018, 8, 0.0035), s2 = spring(H, 0.018, 8, 0.0035), aB = H.arrow(H.C.orange, 0.35);
    const lA = H.label('A', '#1c1d21', 0.05), lB = H.label('B', '#1c1d21', 0.05);
    return { IN, BWA, BHA, RW, WALL, Hb, box, wheels, A, s1, s2, aB, lA, lB };
  },
  update(H, st, o){
    if (st.xd === undefined) return;
    const bx = st.xbd, xa = st.xd, yIn = 2 * o.RW + o.WALL, ya = yIn + o.BHA / 2;
    o.box.position.set(bx, 0, 0); o.wheels.forEach(w => { w.rotation.z = -st.thB; });
    o.A.position.set(xa, ya, 0);
    o.s1.set([bx - o.IN / 2, ya, 0], [xa - o.BWA / 2, ya, 0]); o.s2.set([xa + o.BWA / 2, ya, 0], [bx + o.IN / 2, ya, 0]);
    o.aB.set([bx, yIn + o.Hb + 0.06, 0], [st.xb / Math.max(st.b, 1e-9) * 0.1, 0, 0]);
    o.lA.position.set(xa, ya + o.BHA / 2 + 0.04, 0.08); o.lB.position.set(bx - o.IN / 2 - 0.06, yIn + o.Hb, 0.1);
  }
});

/* ---------- 6.C.6  trailer on a wavy road (the road moves under the trailer) ---------- */
view3d({
  id: 'x6c-6', size: 1.15, target: [0.15, 0.22, 0], camera: [-0.55, 0.35, 1],
  build(H){
    const T = H.THREE, RW = 0.09, half = 2.2, NS = 220, Wz = 0.7;
    // road surface: a strip whose vertices are moved every frame (top surface and a front skirt)
    const geo = new T.PlaneGeometry(2 * half, 2 * Wz, NS, 1); geo.rotateX(-Math.PI / 2);
    const road = new T.Mesh(geo, H.mat('#c9c3b5', { side: T.DoubleSide })); road.receiveShadow = true; H.add(road);
    const sk = new T.PlaneGeometry(2 * half, 1, NS, 1), skirt = new T.Mesh(sk, H.mat('#b3ad9f', { side: T.DoubleSide })); H.add(skirt);
    const marks = []; for (let i = 0; i < 8; i++){ const mk = H.box(0.02, 0.004, 0.2, '#f2efe7'); mk.castShadow = false; marks.push(mk); }
    const body = H.box(1.0, 0.18, 0.9, '#cfd8ea'); const bar = H.box(0.5, 0.03, 0.04, H.C.dark);
    const axle = H.disk(0.012, 1.0, H.C.dark);
    const wheels = [-1, 1].map(sz => { const g = H.group(); g.position.z = sz * 0.45; H.disk(RW, 0.07, '#4b4e55', g); const sp = H.box(RW * 1.7, 0.01, 0.075, H.C.orange, g); return g; });
    const springs = [-1, 1].map(() => spring(H, 0.03, 6, 0.006));
    const lm = H.label('m', '#1c1d21', 0.08), lv = H.label('v', H.C.green, 0.08), av = H.arrow(H.C.green, 0.6), lk = H.label('k', '#1c1d21', 0.07);
    return { RW, half, NS, Wz, geo, sk, marks, body, bar, axle, wheels, springs, lm, lv, av, lk };
  },
  update(H, st, o){
    if (st.xT === undefined) return;
    const lam = 1.2, b = 0.05, road = q => (st.wavy || q > 0) ? b * Math.sin(TAU * q / lam) : 0, xT = st.xT;
    const P = o.geo.attributes.position, Q = o.sk.attributes.position;
    for (let i = 0; i < P.count; i++){ const X = P.getX(i); P.setY(i, road(X + xT)); }
    P.needsUpdate = true; o.geo.computeVertexNormals();
    for (let i = 0; i < Q.count; i++){ const X = Q.getX(i), top = i < Q.count / 2; Q.setY(i, top ? road(X + xT) : -0.25); Q.setZ(i, o.Wz); }
    Q.needsUpdate = true;
    // lane marks every metre, moving with the road
    o.marks.forEach((mk, i) => { const q = Math.floor(xT - o.half) + i * 0.6 + 0.3, X = q - xT; mk.visible = Math.abs(X) < o.half - 0.05; mk.position.set(X, road(q) + 0.003, 0); });
    const yA = st.yC + o.RW, yb = st.y + o.RW + 0.42;          // body bottom: 0.42 m above the axle in the static position (as in 2D)
    o.wheels.forEach(w => { w.position.set(0, yA, w.position.z); w.rotation.z = -st.th; });
    o.axle.position.set(0, yA, 0);
    o.body.position.set(0, yb + 0.09, 0); o.bar.position.set(0.75, yb + 0.12, 0);
    o.springs.forEach((s, i) => s.set([0, yA, (i ? 1 : -1) * 0.33], [0, yb, (i ? 1 : -1) * 0.33]));
    o.lm.position.set(0, yb + 0.24, 0.47); o.lk.position.set(-0.07, (yA + yb) / 2, 0.5);
    o.av.set([0.6, yb + 0.32, 0], [0.3, 0, 0]); o.lv.position.set(0.98, yb + 0.32, 0);
  }
});

})();
