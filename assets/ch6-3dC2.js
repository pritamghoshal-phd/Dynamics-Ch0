/* 3D views for the forced-vibration examples 6.C.7 – 6.C.12.
   Each view reads st.g of the 2D clip with the same id (ch6-exC2.js): the drawn displacements in metres, so the
   3D motion is exactly the 2D motion (including the drawing magnification noted in the 2D view).
   The geometry uses the same metric layout as the 2D drawings; z points out of the 2D picture. */
(function(){

/* helical spring between two points; rebuilt only when its length changes */
function spring(H, R, turns, wire, color){
  const T = H.THREE, m = new T.Mesh(new T.BufferGeometry(), H.mat(color || '#6d7480', { metalness: 0.35, roughness: 0.4 }));
  m.castShadow = true; H.add(m); let lastL = -1;
  return { mesh: m, set(a, b){
    const A = new T.Vector3(...a), B = new T.Vector3(...b), L = Math.max(A.distanceTo(B), 1e-3);
    if (Math.abs(L - lastL) > 2e-4){
      lastL = L; const lead = Math.min(0.1 * L, 2 * R), N = Math.round(turns * 14), pts = [new T.Vector3(0, 0, 0), new T.Vector3(0, lead * 0.6, 0)];
      for (let i = 0; i <= N; i++){ const u = i / N, a2 = 2 * Math.PI * turns * u, s = Math.min(1, 4 * u, 4 * (1 - u)); pts.push(new T.Vector3(R * Math.cos(a2) * s, lead + (L - 2 * lead) * u, R * Math.sin(a2) * s)); }
      pts.push(new T.Vector3(0, L - lead * 0.6, 0), new T.Vector3(0, L, 0));
      m.geometry.dispose(); m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), N + 8, wire, 6, false);
    }
    m.position.copy(A); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  } };
}
const glass = (H, w, h, d, color, parent) => H.mesh(new H.THREE.BoxGeometry(w, h, d), color, parent, { transparent: true, opacity: 0.32, depthWrite: false });
const arcPts = (cx, cy, r, a0, a1, n = 16, z = 0) => { const p = []; for (let i = 0; i <= n; i++){ const a = a0 + (a1 - a0) * i / n; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); } return p; };

/* ---------- 6.C.7 and 6.C.8: base B – spring – block on wheels – spring – wall ---------- */
function baseBlockWall(id, kL, kR){
  view3d({
    id, size: 0.58, target: [0.32, 0.12, 0], camera: [-0.25, 0.45, 1],
    build(H){
      const L1 = 0.30, bw = 0.20, bh = 0.14, wr = 0.02, L2 = 0.30, xr = L1 + bw + L2;
      H.floor(-0.20, xr + 0.04, 0.22); H.wall(xr + 0.06, 0, 0.32, 0.22);
      const B = H.group(); const sled = H.box(0.08, 0.015, 0.16, '#9aa0a8', B); sled.position.set(-0.015, 0.0075, 0);
      const pl = H.box(0.03, 0.185, 0.16, '#9aa0a8', B); pl.position.set(-0.015, 0.015 + 0.0925, 0);
      const blk = H.group(); const body = H.box(bw, bh, 0.16, H.C.body, blk); body.position.set(bw / 2, 2 * wr + bh / 2, 0);
      const wheels = [];
      [0.045, bw - 0.045].forEach(x => [-0.06, 0.06].forEach(z => { const wg = new H.THREE.Group(); wg.position.set(x, wr, z); blk.add(wg);
        H.disk(wr, 0.02, H.C.dark, wg); const sp = H.box(wr * 0.9, 0.004, 0.022, '#d8d4c8', wg); sp.position.x = wr * 0.45; wheels.push(wg); }));
      const s1 = spring(H, 0.022, 9, 0.003), s2 = spring(H, 0.022, 9, 0.003);
      const lB = H.label('B'), lm = H.label('m'), l1 = H.label(kL, '#5b5a55', 0.07), l2 = H.label(kR, '#5b5a55', 0.07);
      return { L1, bw, xr, B, blk, wheels, s1, s2, lB, lm, l1, l2, wr, cy: 2 * wr + bh / 2 };
    },
    update(H, st, o){
      const g = st.g; if (!g) return;
      o.B.position.x = g.y; o.blk.position.x = o.L1 + g.x;
      o.wheels.forEach(w => { w.rotation.z = -(o.L1 + g.x + w.position.x) / o.wr; });
      o.s1.set([g.y, o.cy, 0], [o.L1 + g.x, o.cy, 0]); o.s2.set([o.L1 + g.x + o.bw, o.cy, 0], [o.xr, o.cy, 0]);
      o.lB.position.set(g.y - 0.015, 0.25, 0.09); o.lm.position.set(o.L1 + g.x + o.bw / 2, o.cy + 0.11, 0.09);
      o.l1.position.set((g.y + o.L1 + g.x) / 2, o.cy + 0.05, 0.03); o.l2.position.set((o.L1 + g.x + o.bw + o.xr) / 2, o.cy + 0.05, 0.03);
    }
  });
}
baseBlockWall('x6c-7', 'k', 'k');
baseBlockWall('x6c-8', 'k', '4k');

/* ---------- 6.C.9: mass on four springs (one at each corner) on a shaker plate ---------- */
view3d({
  id: 'x6c-9', size: 0.85, target: [0, 0.38, 0], camera: [-0.45, 0.35, 1],
  build(H){
    H.floor(-0.45, 0.45, 0.35);
    const hous = H.box(0.18, 0.10, 0.18, '#c9c3b5'); hous.position.set(0, 0.05, 0);
    const rod = H.mesh(new H.THREE.CylinderGeometry(0.012, 0.012, 1, 16), H.C.dark);
    const plate = H.box(0.62, 0.04, 0.40, '#7d776b');
    const mass = H.box(0.60, 0.16, 0.36, H.C.body);
    const corners = [[-0.24, -0.14], [0.24, -0.14], [-0.24, 0.14], [0.24, 0.14]];
    const sp = corners.map(() => spring(H, 0.03, 7, 0.004));
    const lm = H.label('m'), lB = H.label('B'), lk = H.label('k', '#5b5a55', 0.07);
    return { rod, plate, mass, corners, sp, lm, lB, lk };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const pb = 0.20 + g.yb, pt = pb + 0.04, mb = 0.20 + 0.04 + 0.22 + g.x;
    o.rod.scale.y = Math.max(pb - 0.10, 1e-3); o.rod.position.set(0, (0.10 + pb) / 2, 0);
    o.plate.position.set(0, pb + 0.02, 0); o.mass.position.set(0, mb + 0.08, 0);
    o.corners.forEach(([x, z], i) => o.sp[i].set([x, pt, z], [x, mb, z]));
    o.lm.position.set(0, mb + 0.23, 0.2); o.lB.position.set(-0.36, pb + 0.02, 0.2); o.lk.position.set(0.31, (pt + mb) / 2, 0.15);
  }
});

/* ---------- 6.C.10: spring – cable – fixed pulley – movable pulley – block – spring to the floor ---------- */
view3d({
  id: 'x6c-10', size: 0.8, target: [-0.12, 0.40, 0], camera: [-0.3, 0.25, 1],
  build(H){
    const T = H.THREE, P1 = [0, 0.62], R1 = 0.06, r2 = 0.03, c2x = R1 - r2, eyeY = P1[1] - R1 - 0.025;
    H.floor(-0.50, 0.20, 0.22); H.wall(-0.48, 0, 0.80, 0.22);
    // fixed pulley on an axle carried by a yoke; a strut runs from the wall to the axle behind the pulley
    const pul = new H.THREE.Group(); pul.position.set(P1[0], P1[1], 0); H.add(pul); H.disk(R1, 0.03, H.C.steel, pul);
    const spoke = H.box(R1 * 0.9, 0.008, 0.032, H.C.orange, pul); spoke.position.x = R1 * 0.45;
    const axle = H.disk(0.008, 0.07, H.C.dark); axle.position.set(P1[0], P1[1], 0);
    [-0.03, 0.03].forEach(z => { const s = H.box(0.012, P1[1] - eyeY, 0.006, '#7d776b'); s.position.set(0, (P1[1] + eyeY) / 2, z); });
    const eyeBar = H.box(0.012, 0.006, 0.066, '#7d776b'); eyeBar.position.set(0, eyeY, 0);
    const sx0 = -0.47, sy0 = 0.50, dx = P1[0] - sx0, dy = P1[1] - sy0, Ls = Math.hypot(dx, dy);
    const strut = H.box(Ls, 0.014, 0.014, '#7d776b'); strut.position.set((sx0 + P1[0]) / 2, (sy0 + P1[1]) / 2, -0.04); strut.rotation.z = Math.atan2(dy, dx);
    // ledge for B
    const yC = P1[1] + R1, br = 0.008, ledge = yC - 0.03 - 2 * br;
    const shelf = H.box(0.18, 0.012, 0.12, '#7d776b'); shelf.position.set(-0.39, ledge - 0.006, 0);
    const B = H.group(); const bb = H.box(0.05, 0.06, 0.08, '#9aa0a8', B); bb.position.set(0, 0, 0);
    const rollers = [-0.012, 0.012].map(x => { const r = H.disk(br, 0.06, H.C.dark, B); r.position.set(x, -0.03 - br, 0); return r; });
    const pul2 = H.disk(r2, 0.025, H.C.steel); const hang = H.box(0.006, 0.03, 0.006, H.C.dark);
    const mass = H.box(0.08, 0.08, 0.08, H.C.body);
    const s1 = spring(H, 0.014, 8, 0.0025), s2 = spring(H, 0.02, 8, 0.003);
    const c1 = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.003), c2 = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.003);
    const lB = H.label('B'), lm = H.label('m'), lE = H.label('E', '#5b5a55', 0.06);
    return { pul, P1, R1, r2, c2x, eyeY, yC, B, rollers, br, pul2, hang, mass, s1, s2, c1, c2, lB, lm, lE };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const bx = -0.40 + g.xB, Ex = g.Ex, y2 = g.y2;
    o.B.position.set(bx, o.yC, 0); o.rollers.forEach(r => { r.rotation.z = -bx / o.br; });
    o.s1.set([bx + 0.025, o.yC, 0], [Ex, o.yC, 0]);
    o.c1.set([[Ex, o.yC, 0], [0, o.yC, 0]].concat(arcPts(o.P1[0], o.P1[1], o.R1, Math.PI / 2, 0, 12)).concat([[o.P1[0] + o.R1, y2, 0]]));
    o.c2.set(arcPts(o.c2x, y2, o.r2, 0, -Math.PI, 14).concat([[o.c2x - o.r2, o.eyeY, 0]]));
    o.pul2.position.set(o.c2x, y2, 0); o.pul2.rotation.z = -g.x / o.r2; o.pul.rotation.z = -2 * g.x / o.R1;
    const mTop = y2 - o.r2 - 0.03; o.hang.position.set(o.c2x, y2 - o.r2 - 0.015, 0); o.mass.position.set(o.c2x, mTop - 0.04, 0);
    o.s2.set([o.c2x, mTop - 0.08, 0], [o.c2x, 0, 0]);
    o.lB.position.set(bx, o.yC + 0.07, 0.05); o.lm.position.set(o.c2x + 0.09, mTop - 0.04, 0.05); o.lE.position.set(Ex, o.yC + 0.04, 0.03);
  }
});

/* ---------- 6.C.11: bar pinned at O moving in a horizontal plane; base B slides on a rail ----------
   The 2D top view (X, Y) maps to 3D (X, h, −Y), so the vertical pin at O is the 3D y axis. */
view3d({
  id: 'x6c-11', size: 1.1, target: [0.5, 0.05, 0.12], camera: [-0.3, 0.85, 0.7],
  build(H){
    const h = 0.06, L = 1;
    H.floor(-0.20, 1.25, 0.6);
    const wall = H.box(0.06, 0.25, 0.5, H.C.wall); wall.position.set(-0.09, 0.125, 0);
    const brk = H.box(0.06, 0.03, 0.10, '#c9c3b5'); brk.position.set(-0.03, h, 0);
    const pin = H.mesh(new H.THREE.CylinderGeometry(0.008, 0.008, 0.06, 16), H.C.dark); pin.position.set(0, h, 0);
    const bar = H.group(); bar.position.set(0, h, 0); const b = H.box(L, 0.02, 0.04, H.C.body, bar); b.position.x = L / 2;
    const rail = H.box(0.03, 0.01, 0.30, H.C.steel); rail.position.set(L, 0.005, 0.36);
    const B = H.box(0.14, 0.06, 0.03, '#9aa0a8');
    const sp = spring(H, 0.015, 9, 0.0025);
    const lO = H.label('O'), lA = H.label('A'), lB = H.label('B');
    return { h, L, bar, B, sp, lO, lA, lB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.bar.rotation.y = g.th;
    const A = [o.L * Math.cos(g.th), o.h, -o.L * Math.sin(g.th)], zB = 0.36 - g.yb;
    o.B.position.set(o.L, 0.04, zB);
    o.sp.set([A[0], o.h, A[2] + 0.02], [o.L, o.h, zB - 0.015]);
    o.lO.position.set(-0.04, o.h + 0.08, 0.05); o.lA.position.set(A[0] + 0.05, o.h + 0.08, A[2]); o.lB.position.set(o.L + 0.12, 0.08, zB);
  }
});

/* ---------- 6.C.12: frame with a rotating imbalance between rails, springs to two walls ---------- */
view3d({
  id: 'x6c-12', size: 0.45, target: [0, 0, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const bw = 0.20, bh = 0.16, rr = 0.010, railY = bh / 2 + 2 * rr;
    [-1, 1].forEach(s => { const w = H.box(0.03, 0.26, 0.20, H.C.wall); w.position.set(s * (0.38 + 0.015), 0, 0);
      const r = H.box(0.44, 0.012, 0.12, '#7d776b'); r.position.set(0, s * (railY + 0.006), 0); });
    const frame = H.group(); glass(H, bw, bh, 0.12, H.C.body, frame);
    const edge = new H.THREE.LineSegments(new H.THREE.EdgesGeometry(new H.THREE.BoxGeometry(bw, bh, 0.12)), new H.THREE.LineBasicMaterial({ color: 0x8a6a12 })); frame.add(edge);
    const rollers = [];
    [-0.06, 0.06].forEach(x => [1, -1].forEach(s => { const r = H.disk(rr, 0.10, H.C.dark, frame); r.position.set(x, s * (bh / 2 + rr), 0); r.userData.s = s; rollers.push(r); }));
    const ped = H.box(0.028, 0.024, 0.03, '#e4dfd2', frame); ped.position.set(0, -0.022, 0);
    const arm = H.group(); arm.position.set(0, -0.01, 0.02); frame.add(arm);
    const rod = H.box(1, 0.004, 0.004, H.C.dark, arm); const ball = H.sphere(0.008, '#5b5a55', arm);
    const sL = spring(H, 0.02, 9, 0.003), sR = spring(H, 0.02, 9, 0.003);
    const lM = H.label('M'), lm = H.label('m', '#1c1d21', 0.07), lk = H.label('k', '#5b5a55', 0.06), l2k = H.label('2k', '#5b5a55', 0.06);
    return { bw, rr, frame, rollers, arm, rod, ball, sL, sR, lM, lm, lk, l2k };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const e = st.sys ? st.sys.e : 0.02;
    o.frame.position.x = g.x;
    o.rollers.forEach(r => { r.rotation.z = r.userData.s > 0 ? (g.x + r.position.x) / o.rr : -(g.x + r.position.x) / o.rr; });
    o.arm.rotation.z = g.ang; o.rod.scale.x = e; o.rod.position.x = e / 2; o.ball.position.x = e;
    o.sL.set([-0.38, 0, 0], [g.x - o.bw / 2, 0, 0]); o.sR.set([g.x + o.bw / 2, 0, 0], [0.38, 0, 0]);
    o.lM.position.set(g.x - 0.06, -0.05, 0.08); o.lm.position.set(g.x + e * Math.cos(g.ang) + 0.02, -0.01 + e * Math.sin(g.ang) + 0.02, 0.08);
    o.lk.position.set((-0.38 + g.x - o.bw / 2) / 2, 0.04, 0.02); o.l2k.position.set((0.38 + g.x + o.bw / 2) / 2, 0.04, 0.02);
  }
});

})();
