/* 3D views for the free-body-diagram examples 0.B.1 – 0.B.3. Each view reads the live state of the 2D clip with the same id. */
(function(){

// solid arrow (cylinder shaft + cone head); set(origin, vector)
function fatArrow(H, color, r = 0.014){
  const T = H.THREE, g = new T.Group(); H.add(g);
  const shaft = H.mesh(new T.CylinderGeometry(r, r, 1, 12), color, g), head = H.mesh(new T.ConeGeometry(r * 2.6, 1, 16), color, g);
  [shaft, head].forEach(m => { m.material.depthTest = false; m.renderOrder = 5; m.castShadow = false; });   // forces are drawn on top, so arrows that start below the floor stay visible
  const up = new T.Vector3(0, 1, 0);
  return { obj: g, set(o, v){ const L = Math.hypot(v[0], v[1], v[2] || 0); g.visible = L > 1e-4; if (!g.visible) return;
    const hl = Math.min(r * 8, 0.45 * L); g.position.set(o[0], o[1], o[2] || 0);
    g.quaternion.setFromUnitVectors(up, new T.Vector3(v[0] / L, v[1] / L, (v[2] || 0) / L));
    shaft.scale.set(1, L - hl, 1); shaft.position.y = (L - hl) / 2; head.scale.set(1, hl, 1); head.position.y = L - hl / 2; } };
}
// dashed red box that marks the system that is cut free
function sysBox(H){
  const T = H.THREE, geo = new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), m = new T.LineSegments(geo, new T.LineDashedMaterial({ color: 0xb42346, dashSize: 0.04, gapSize: 0.03 }));
  m.computeLineDistances(); H.add(m);
  return { set(c, s){ m.position.set(...c); m.scale.set(...s); m.computeLineDistances(); } };
}

/* 0.B.1  Block A (0.3 m cube) sliding on a rough floor, pushed at its upper left corner by F at θ below the horizontal.
   The arrows are the forces of the free-body diagram, drawn on the near face (0.02 m per newton). */
view3d({
  id: 'x0b-1', size: 1.9, target: [0.1, 0.35, 0], camera: [-0.2, 0.3, 1],
  build(H){
    H.floor(-2.6, 2.8, 0.7);
    const A = H.box(0.5, 0.5, 0.5, H.C.wood); const la = H.label('A');
    const aF = fatArrow(H, H.C.blue, 0.018), aW = fatArrow(H, H.C.orange, 0.018), aN = fatArrow(H, H.C.green, 0.018), aFr = fatArrow(H, H.C.red, 0.018);
    const lF = H.label('F', H.C.blue), lW = H.label('mg', H.C.orange), lN = H.label('N', H.C.green), lFr = H.label('μ_k N', H.C.red), lv = H.label('', '#7b808c');
    return { A, la, aF, aW, aN, aFr, lF, lW, lN, lFr };
  },
  update(H, st, o){
    if (st.x === undefined || !st.V) return;
    const V = st.V, th = V.th * Math.PI / 180, k = 0.016, x = -2.1 + st.x, z = 0.26;
    o.A.position.set(x, 0.25, 0); o.la.position.set(x, 0.62, 0);
    const LF = 0.1 + V.F * k, c = [x - 0.25, 0.5, z];
    o.aF.set([c[0] - LF * Math.cos(th), c[1] + LF * Math.sin(th), z], [LF * Math.cos(th), -LF * Math.sin(th), 0]); o.lF.position.set(c[0] - LF * Math.cos(th) - 0.08, c[1] + LF * Math.sin(th) + 0.06, z);
    const W = V.m * G0 * k, N = st.N * k;
    o.aW.set([x - 0.06, 0.25, z], [0, -W, 0]); o.lW.position.set(x - 0.18, 0.25 - W * 0.6, z);
    o.aN.set([x + 0.12, -N, z], [0, N, 0]); o.lN.position.set(x + 0.24, -N * 0.5, z);
    const fr = st.stopped ? Math.min(V.F * Math.cos(th), V.mk * st.N) : st.fr, L = fr * k;
    o.aFr.set([x - 0.25, 0.005, z], [-L, 0, 0]); o.lFr.position.set(x - 0.25 - L - 0.14, 0.07, z); o.lFr.visible = L > 0.01;
  }
});

/* 0.B.2  Table (top at 1.5 m), block A, pulley O on a bracket at the corner, lower pulley with block B.
   A moves d to the right and B drops d/2. */
view3d({
  id: 'x0b-2', size: 2.4, target: [-0.5, 0.85, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const ty = 1.5, T = H.THREE;
    H.floor(-2.6, 1.0, 0.7);
    const top = H.box(2.2, 0.06, 0.6, '#9db7e0'); top.position.set(-1.1, ty - 0.03, 0);
    [[-2.1, -0.22], [-2.1, 0.22], [-0.1, -0.22], [-0.1, 0.22]].forEach(([x, z]) => { const l = H.box(0.05, ty - 0.06, 0.05, H.C.steel); l.position.set(x, (ty - 0.06) / 2, z); });
    const O = [0.12, ty + 0.07], r = 0.07;
    const br = H.box(0.2, 0.025, 0.12, H.C.steel); br.position.set(0.05, ty + 0.035, -0.06); br.rotation.z = Math.atan2(0.07, 0.12);
    H.disk(r, 0.04, H.C.steel).position.set(O[0], O[1], 0); H.disk(0.012, 0.16, H.C.dark).position.set(O[0], O[1], -0.04);
    const lowP = H.disk(r / 2, 0.035, H.C.steel), A = H.box(0.3, 0.26, 0.3, H.C.wood), B = H.box(0.24, 0.24, 0.24, '#cfd8ea'), hook = H.box(0.012, 0.13, 0.012, H.C.dark);
    const rope = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.006);
    const la = H.label('A'), lb = H.label('B'), lo = H.label('O');
    lo.position.set(O[0] + 0.12, O[1] + 0.1, 0);
    const box = sysBox(H);
    return { ty, O, r, lowP, A, B, hook, rope, la, lb, box };
  },
  update(H, st, o){
    if (st.d === undefined) return;
    const xA = -1.85 + st.d, yq = 1.2 - st.d / 2, xq = o.O[0] + o.r / 2, r = o.r;
    o.A.position.set(xA, o.ty + 0.13, 0); o.la.position.set(xA, o.ty + 0.36, 0);
    o.lowP.position.set(xq, yq, 0); o.hook.position.set(xq, yq - 0.065, 0); o.B.position.set(xq, yq - 0.25, 0); o.lb.position.set(xq + 0.24, yq - 0.25, 0);
    // rope: A -> top of O -> down the right side -> around the lower pulley -> up to the axle of O
    const pts = [[xA + 0.15, o.O[1] + r, 0], [o.O[0], o.O[1] + r, 0]];
    for (let k = 1; k <= 6; k++){ const a = Math.PI / 2 - k * Math.PI / 12; pts.push([o.O[0] + r * Math.cos(a), o.O[1] + r * Math.sin(a), 0]); }
    pts.push([o.O[0] + r, yq, 0]);
    for (let k = 1; k <= 6; k++){ const a = -k * Math.PI / 6; pts.push([xq + (r / 2) * Math.cos(a), yq + (r / 2) * Math.sin(a), 0]); }
    pts.push([o.O[0], o.O[1], 0]);
    o.rope.set(pts);
    const S = { a: [[xA, o.ty + 0.13, 0], [0.42, 0.38, 0.42]], b: [[xq, yq - 0.14, 0], [0.34, 0.5, 0.34]], c: [[o.O[0], o.O[1], 0], [0.22, 0.22, 0.22]],
      d: [[(xA - 0.2 + o.O[0] + 0.15) / 2, (o.ty + 0.32 + yq - 0.4) / 2, 0], [o.O[0] + 0.15 - xA + 0.2, o.ty + 0.32 - yq + 0.4, 0.5]] }[st.sys || 'a'];
    o.box.set(...S);
  }
});

/* 0.B.3  Piston, connecting rod and crankshaft (real size: r = 0.10 m, L = 0.34 m, crank disk radius 0.16 m).
   The crank center C is at (0, 0.4) on a pedestal; the piston slides on a smooth guide plate at the height of C. */
view3d({
  id: 'x0b-3', size: 0.62, target: [-0.18, 0.38, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const T = H.THREE, C = [0, 0.4];
    H.floor(-0.9, 0.5, 0.4);
    const crank = new T.Group(); crank.position.set(C[0], C[1], -0.05); H.add(crank);
    H.disk(0.16, 0.05, '#cfcac0', crank); const mark = H.box(0.1, 0.02, 0.052, H.C.dark, crank); mark.position.set(0.05, 0, 0);
    const ped = H.box(0.08, C[1], 0.06, H.C.steel); ped.position.set(C[0], C[1] / 2, -0.12); H.disk(0.012, 0.16, H.C.dark).position.set(C[0], C[1], -0.06);
    const guide = H.box(0.52, 0.02, 0.16, '#9db7e0'); guide.position.set(-0.46, C[1] - 0.06, 0.03);
    const gl = H.box(0.04, C[1] - 0.07, 0.1, H.C.steel); gl.position.set(-0.46, (C[1] - 0.07) / 2, 0.03);
    const piston = H.box(0.09, 0.08, 0.09, H.C.wood); const rod = H.box(1, 0.022, 0.018, '#efe7d2');
    const pinA = H.disk(0.01, 0.12, H.C.dark), pinO = H.disk(0.01, 0.12, H.C.dark);
    const aF = fatArrow(H, H.C.blue, 0.008), lF = H.label('F', H.C.blue, 0.06), la = H.label('A', '#1c1d21', 0.06), lo = H.label('O', '#1c1d21', 0.06), lc = H.label('C', '#1c1d21', 0.06);
    lc.position.set(C[0] + 0.05, C[1] - 0.05, 0.04);
    const box = sysBox(H);
    return { C, crank, piston, rod, pinA, pinO, aF, lF, la, lo, box };
  },
  update(H, st, o){
    if (!st.geo) return;
    const g = st.geo, C = o.C, A = [C[0] + g.xA, C[1]], O = [C[0] + g.xO, C[1] + g.yO];
    o.crank.rotation.z = st.phi;
    o.piston.position.set(A[0] - 0.02, A[1] - 0.01, 0.03);   // bottom face rests on the guide top (C_y − 0.05) o.pinA.position.set(A[0], A[1], 0.03); o.pinO.position.set(O[0], O[1], 0.0);
    const L = Math.hypot(O[0] - A[0], O[1] - A[1]); o.rod.scale.set(L, 1, 1); o.rod.position.set((A[0] + O[0]) / 2, (A[1] + O[1]) / 2, 0.015); o.rod.rotation.z = Math.atan2(O[1] - A[1], O[0] - A[0]);
    const LF = 0.04 + st.V.F * 0.003; o.aF.set([A[0] - 0.065 - LF, A[1], 0.03], [LF, 0, 0]); o.lF.position.set(A[0] - 0.08 - LF, A[1] + 0.04, 0.03);
    o.la.position.set(A[0] - 0.02, A[1] + 0.08, 0.06); o.lo.position.set(O[0] + 0.035 * Math.cos(st.phi), O[1] + 0.035 * Math.sin(st.phi), 0.05);
    const S = { a: [[A[0] - 0.02, A[1], 0.03], [0.14, 0.13, 0.14]], b: [[C[0], C[1], -0.05], [0.36, 0.36, 0.1]], c: [[(A[0] + O[0]) / 2, (A[1] + O[1]) / 2, 0.015], [Math.abs(O[0] - A[0]) + 0.06, Math.abs(O[1] - A[1]) + 0.06, 0.06]],
      d: [[(A[0] - 0.08 + C[0] + 0.17) / 2, C[1], 0], [C[0] + 0.17 - A[0] + 0.08, 0.38, 0.2]] }[st.sys || 'a'];
    o.box.set(...S);
  }
});

})();
