/* 3D views for examples 2.A.6 – 2.A.10. Each view reads the geometry that the 2D clip with the same id stores in st.g. */
(function(){
const T = () => THREE;
// a link of unit length along +x (scaled to the real length every frame) and a helper that places it between two points
function linkMesh(H, color, thick, depth, z){ const m = H.bar(1, thick, color, null, depth); m.position.z = z; return m; }
function place(m, a, b){ const dx = b[0] - a[0], dy = b[1] - a[1]; m.position.x = a[0]; m.position.y = a[1]; m.rotation.z = Math.atan2(dy, dx); m.scale.x = Math.max(Math.hypot(dx, dy), 1e-4); }
function pinAt(H, r, depth, z){ const p = H.disk(r, depth, H.C.dark); p.position.z = z; return p; }
// wall bracket (a plate on the wall at x = xw and a tapered arm out to the pin) for a pin at (x, y)
function wallBracket(H, xw, x, y, z){
  const g = H.group(), arm = H.box(Math.abs(x - xw), 0.05, 0.04, H.C.steel, g); arm.position.set((x + xw) / 2, y, z);
  const plate = H.box(0.02, 0.16, 0.14, H.C.steel, g); plate.position.set(xw + 0.01, y, z); return g;
}

/* 2.A.6  Spool on the floor, cable from the bottom of the hub to end A (clip x2a-6). */
view3d({
  id: 'x2a-6', size: 3.2, target: [2.2, 0.8, 0], camera: [-0.3, 0.32, 1],
  build(H){
    H.floor(-1.6, 8, 0.9);
    const sp = new (T().Group)(); H.add(sp);
    const outer = [-0.24, 0.24].map(z => { const d = H.disk(1, 0.08, '#d9d4c6', sp); d.position.z = z; return d; });
    const hub = H.disk(1, 0.4, '#efe9d8', sp);
    const marks = [0, 1, 2, 3].map(k => { const m = H.box(1, 0.04, 0.085, H.C.orange, sp); m.position.z = 0.24; m.userData.k = k; return m; });
    const handle = H.sphere(0.05, H.C.orange), cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.012);
    const lO = H.label('O'), lA = H.label('A'), lC = H.label('C', '#b42346');
    const cdot = H.sphere(0.035, '#b42346');
    const vO = H.arrow(H.C.blue, 1.4), vA = H.arrow(H.C.orange, 1.4), lvO = H.label('v_O', H.C.blue), lvA = H.label('v_A', H.C.orange);
    return { sp, outer, hub, marks, handle, cab, lO, lA, lC, cdot, vO, vA, lvO, lvA };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const { xO, xA, phi, R, r } = g, yc = R - r;
    o.sp.position.set(xO, R, 0); o.sp.rotation.z = phi;
    o.outer.forEach(d => d.scale.set(R, R, 1)); o.hub.scale.set(r, r, 1);
    o.marks.forEach(m => { const a = m.userData.k * Math.PI / 2, L = R - r - 0.02; m.scale.x = L; m.position.set((r + L / 2) * Math.cos(a), (r + L / 2) * Math.sin(a), 0.24); m.rotation.z = a; });
    o.cab.set([[xO, yc, 0], [xA, yc, 0]]); o.handle.position.set(xA, yc, 0);
    o.cdot.position.set(xO, 0.02, 0.3);
    o.lO.position.set(xO - 0.15, R + 0.2, 0.35); o.lA.position.set(xA, yc + 0.22, 0); o.lC.position.set(xO, -0.15, 0.45);
    const k = 0.3; o.vO.set([xO, R, 0.32], [g.vO * k, 0, 0]); o.vA.set([xA + 0.05, yc, 0], [g.vA * k, 0, 0]);
    o.lvO.position.set(xO + g.vO * k + 0.2, R, 0.32); o.lvA.position.set(xA + 0.05 + g.vA * k + 0.2, yc, 0);
  }
});

/* 2.A.7  Link sliding on a wall and a floor (clip x2a-7). */
view3d({
  id: 'x2a-7', size: 0.85, target: [0.28, 0.2, 0], camera: [0.35, 0.3, 1],
  build(H){
    H.floor(-0.15, 1.1, 0.3); H.wall(0, 0, 0.75, 0.3);
    const bar = linkMesh(H, H.C.wood, 0.03, 0.05, 0);
    const sA = H.box(0.03, 0.06, 0.07, H.C.steel), sB = H.box(0.06, 0.03, 0.07, H.C.steel);
    const pA = pinAt(H, 0.008, 0.09, 0), pB = pinAt(H, 0.008, 0.09, 0);
    const lA = H.label('A'), lB = H.label('B');
    const vB = H.arrow(H.C.blue, 0.4), vA = H.arrow(H.C.orange, 0.4), lvB = H.label('v_B', H.C.blue), lvA = H.label('v_A', H.C.orange);
    return { bar, sA, sB, pA, pB, lA, lB, vB, vA, lvB, lvA };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const A = [0.015, g.yA], B = [g.xB, 0.015];
    place(o.bar, A, B); o.sA.position.set(0.015, g.yA, 0); o.sB.position.set(g.xB, 0.015, 0);
    o.pA.position.set(A[0], A[1], 0); o.pB.position.set(B[0], B[1], 0);
    o.lA.position.set(0.09, g.yA + 0.05, 0.05); o.lB.position.set(g.xB, -0.06, 0.08);
    const k = 0.03 * g.L / 0.5, vB = 3 * k, vA = -3 / Math.tan(g.th) * k;
    o.vB.set([g.xB + 0.04, 0.05, 0], [vB, 0, 0]); o.lvB.position.set(g.xB + 0.04 + vB + 0.05, 0.05, 0);
    o.vA.set([0.06, g.yA, 0], [0, vA, 0]); o.lvA.position.set(0.11, g.yA + vA * 0.6, 0);
  }
});

/* 2.A.8  Flywheel on a pedestal, connecting rod and piston on a guide (clip x2a-8). */
view3d({
  id: 'x2a-8', size: 0.62, target: [0.36, -0.08, 0], camera: [-0.25, 0.3, 1],
  build(H){
    H.floor(-0.3, 1.05, 0.3, -0.25);
    const ped = H.box(0.08, 1, 0.06, '#c9c3b5'); ped.position.z = -0.06;
    const fly = new (T().Group)(); H.add(fly);
    H.disk(0.145, 0.035, '#cfc8b5', fly); const mark = H.box(0.1, 0.012, 0.038, H.C.orange, fly); mark.position.set(0.05, 0, 0);
    pinAt(H, 0.012, 0.16, -0.02);
    const pB = pinAt(H, 0.009, 0.07, 0.04);
    const rod = linkMesh(H, H.C.wood, 0.022, 0.02, 0.055);
    const guide = H.box(1, 1, 0.16, '#e4dfd2');
    const piston = H.box(0.16, 0.1, 0.1, '#cfd8ea'); const pA = pinAt(H, 0.009, 0.14, 0.04);
    const lO = H.label('O'), lB = H.label('B'), lA = H.label('A');
    return { ped, fly, pB, rod, guide, piston, pA, lO, lB, lA };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const yF = -0.25;
    o.ped.scale.y = -yF; o.ped.position.set(0, yF / 2, -0.06);
    o.fly.rotation.z = Math.PI / 2 - g.th;                      // the mark points from O to B
    o.pB.position.set(g.B[0], g.B[1], 0.04);
    place(o.rod, g.B, g.A);
    const yG = -g.d - 0.05, hG = Math.max(yG - yF, 0.001);
    o.guide.visible = yG - yF > 0.003; o.guide.scale.set(0.8, hG, 1); o.guide.position.set(0.6, yF + hG / 2, 0.02);
    o.piston.position.set(g.A[0], g.A[1], 0.02); o.pA.position.set(g.A[0], g.A[1], 0.04);
    o.lO.position.set(-0.05, 0.05, 0.1); o.lB.position.set(g.B[0] + 0.03, g.B[1] + 0.05, 0.1); o.lA.position.set(g.A[0], g.A[1] + 0.1, 0.1);
  }
});

/* 2.A.9  Two links driven by a hydraulic cylinder mounted on a wall (clip x2a-9). */
view3d({
  id: 'x2a-9', size: 0.75, target: [0.08, -0.05, 0], camera: [0.4, 0.25, 1],
  build(H){
    H.floor(-0.2, 0.7, 0.3, -0.62); H.wall(-0.13, -0.62, 0.55, 0.3);
    wallBracket(H, -0.13, 0, 0.4, 0);
    const cyl = new (T().Mesh)(new (T().CylinderGeometry)(0.05, 0.05, 0.25, 32), H.mat('#c9cdd6')); cyl.castShadow = true; cyl.position.set(0, -0.455, 0); H.add(cyl);
    const mount = H.box(0.09, 0.12, 0.08, H.C.steel); mount.position.set(-0.085, -0.455, 0);
    const prod = new (T().Mesh)(new (T().CylinderGeometry)(0.012, 0.012, 1, 16), H.mat(H.C.steel)); H.add(prod);
    const OB = linkMesh(H, H.C.wood, 0.03, 0.025, -0.02), AB = linkMesh(H, '#d9c58c', 0.03, 0.025, 0.02);
    const pO = pinAt(H, 0.01, 0.08, 0), pB = pinAt(H, 0.01, 0.09, 0), pA = pinAt(H, 0.01, 0.08, 0);
    const lO = H.label('O'), lA = H.label('A'), lB = H.label('B'), lC = H.label('C');
    lO.position.set(0.06, 0.45, 0.05); lC.position.set(0.1, -0.45, 0.05);
    return { prod, OB, AB, pO, pB, pA, lA, lB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    place(o.OB, g.O, g.B); place(o.AB, g.A, g.B);
    o.pO.position.set(g.O[0], g.O[1], 0); o.pB.position.set(g.B[0], g.B[1], 0); o.pA.position.set(g.A[0], g.A[1], 0);
    const top = -0.33, L = g.A[1] - top; o.prod.scale.y = Math.max(L, 1e-3); o.prod.position.set(0, top + L / 2, 0);
    o.lA.position.set(-0.07, g.A[1] + 0.02, 0.05); o.lB.position.set(g.B[0] + 0.07, g.B[1], 0.05);
  }
});

/* 2.A.10  Four-bar linkage: O on a floor pedestal, D on a wall bracket (clip x2a-10). */
view3d({
  id: 'x2a-10', size: 1.0, target: [0.68, 0.12, 0], camera: [-0.2, 0.3, 1],
  build(H){
    H.floor(-0.4, 1.7, 0.35, -0.3);
    H.pinSupport(0, 0, 0.3, 'up', -0.06);
    const OA = linkMesh(H, H.C.wood, 0.035, 0.025, 0.0), AB = linkMesh(H, '#d9c58c', 0.035, 0.025, 0.035), BD = linkMesh(H, H.C.wood, 0.035, 0.025, 0.0);
    const wallBr = new (T().Group)(); H.add(wallBr);
    const pA = pinAt(H, 0.01, 0.09, 0.02), pB = pinAt(H, 0.01, 0.09, 0.02), pD = pinAt(H, 0.012, 0.1, -0.02);
    const lO = H.label('O'), lA = H.label('A'), lB = H.label('B'), lD = H.label('D');
    lO.position.set(-0.1, 0.08, 0.05);
    return { OA, AB, BD, pA, pB, pD, lA, lB, lD, wallBr, wx: null };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const wx = g.D[0] + 0.12;
    if (o.wx !== wx){                                       // wall and bracket for D (rebuilt when the height d changes)
      while (o.wallBr.children.length) o.wallBr.remove(o.wallBr.children[0]);
      const w = H.box(0.04, 1.2, 0.7, H.C.wall, o.wallBr); w.position.set(wx + 0.02, 0.3, 0);
      const arm = H.box(0.12, 0.05, 0.04, H.C.steel, o.wallBr); arm.position.set(g.D[0] + 0.06, g.D[1], -0.04);
      o.wx = wx;
    }
    place(o.OA, g.O, g.A); place(o.AB, g.A, g.B); place(o.BD, g.D, g.B);
    o.pA.position.set(g.A[0], g.A[1], 0.02); o.pB.position.set(g.B[0], g.B[1], 0.02); o.pD.position.set(g.D[0], g.D[1], -0.02);
    o.lA.position.set(g.A[0], g.A[1] - 0.09, 0.06); o.lB.position.set(g.B[0] - 0.05, g.B[1] + 0.08, 0.06); o.lD.position.set(g.D[0], g.D[1] + 0.09, 0.06);
  }
});

})();
