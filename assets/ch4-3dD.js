/* 3D views for the Chapter 4 angular impulse–momentum examples 4.D.1 – 4.D.7.
   Each view reads the live state of the 2D clip with the same id (st.g holds the geometry).
   Mapping: for top-view problems the 2D plane (X right, Y up on the screen) is the horizontal plane, drawn as (X, height, −Y),
   so a counterclockwise turn seen from above is a positive rotation about the 3D y axis. */
(function(){
const T = () => THREE;
function dashedLine(H, pts, color = '#2a7f62', dash = 0.04){
  const g = new (T().BufferGeometry)().setFromPoints(pts.map(p => new (T().Vector3)(...p)));
  const l = new (T().Line)(g, new (T().LineDashedMaterial)({ color, dashSize: dash, gapSize: dash * 0.7 })); l.computeLineDistances(); H.add(l); return l;
}
function polyLine(H, n, color = '#8b8678'){
  const g = new (T().BufferGeometry)(); g.setAttribute('position', new (T().BufferAttribute)(new Float32Array(3 * n), 3));
  const l = new (T().Line)(g, new (T().LineBasicMaterial)({ color })); H.add(l); l.frustumCulled = false; return l;
}
function bearing(H, x, z, w = 0.16, h = 0.1){ const b = H.box(w, h, w, '#8a8478'); b.position.set(x, h / 2, z); return b; }
function vshaft(H, x, z, y0, y1, r = 0.02, color){ const m = H.mesh(new (T().CylinderGeometry)(r, r, y1 - y0, 20), color || H.C.steel); m.position.set(x, (y0 + y1) / 2, z); return m; }
// horizontal spin arrow around the vertical axis at height y (counterclockwise seen from above when ccw)
function curl(H, R, y, color, ccw = true){
  const g = H.group(), arc = 1.45 * Math.PI; H.ring(R, 0.006, arc, color, g);
  const cone = H.mesh(new (T().ConeGeometry)(0.02, 0.05, 12), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0);
  cone.quaternion.setFromUnitVectors(new (T().Vector3)(0, 1, 0), new (T().Vector3)(-Math.sin(arc), Math.cos(arc), 0));
  g.rotation.x = ccw ? -Math.PI / 2 : Math.PI / 2; g.position.y = y; g.userData.avoid = true; return g;
}
const IN = 0.0254;

/* 4.D.1  arm on a vertical shaft; P moves along a straight line (inches converted to metres) */
view3d({
  id: 'x4d-1', size: 0.8, target: [0.22, 0.3, -0.3], camera: [0.15, 1.1, 0.9],
  build(H){
    const hA = 0.3; H.floor(-0.4, 0.9, 0.85); bearing(H, 0, 0); vshaft(H, 0, 0, 0.1, hA + 0.04, 0.012, H.C.dark);
    const arm = H.group(); arm.position.y = hA; H.bar(26 * IN, 0.016, '#8a8478', arm, 0.016);
    H.mesh(new (T().CylinderGeometry)(0.022, 0.022, 0.04, 20), '#8a8478', arm);   // hub clamped to the shaft
    const P = H.sphere(0.022, '#d9662b');
    const path = dashedLine(H, [[0, 0, 0], [0, 0, -1]]);
    const sp = curl(H, 0.06, hA + 0.06, H.C.orange);
    const lO = H.label('O'), lP = H.label('P'), lw = H.label('ω', H.C.orange);
    lO.position.set(-0.06, hA + 0.03, 0.05); lw.position.set(0.09, hA + 0.09, 0);
    const v = H.arrow(H.C.blue, 0.5), lv = H.label('v', H.C.blue);
    return { hA, arm, P, path, lP, v, lv };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.arm.rotation.y = g.th;
    const x = g.x * IN, z = -g.y * IN;
    o.P.position.set(x, o.hA + 0.03, z); o.lP.position.set(x + 0.05, o.hA + 0.07, z);   // rests on the arm (half thickness 0.008)
    o.path.geometry.setFromPoints([new (T().Vector3)(st.V.R1 * IN, o.hA + 0.002, 0), new (T().Vector3)(st.V.R1 * IN, o.hA + 0.002, -24.5 * IN)]); o.path.computeLineDistances();
    o.v.set([x, o.hA + 0.03, z], [0, 0, -0.12]); o.lv.position.set(x + 0.03, o.hA + 0.04, z - 0.14);
  }
});

/* 4.D.2  two particles on a symmetric arm; stops at 2r */
view3d({
  id: 'x4d-2', size: 0.9, target: [0, 0.35, 0], camera: [-0.4, 0.55, 1],
  build(H){
    const hA = 0.6; H.floor(-0.7, 0.7, 0.7); bearing(H, 0, 0, 0.2, 0.12); vshaft(H, 0, 0, 0.12, hA, 0.018);
    const arm = H.group(); arm.position.y = hA;
    const bar = H.box(1, 0.018, 0.018, '#8a8478', arm);
    H.mesh(new (T().CylinderGeometry)(0.03, 0.03, 0.05, 20), '#8a8478', arm);   // hub clamped to the shaft
    const stops = [-1, 1].map(() => H.box(0.012, 0.045, 0.04, H.C.dark, arm));
    const balls = [0, 1].map(() => H.sphere(0.025, '#d9662b', arm));
    curl(H, 0.07, hA - 0.12, H.C.orange); const lw = H.label('ω', H.C.orange); lw.position.set(0.11, hA - 0.1, 0);
    const lm = [H.label('m'), H.label('m')];
    return { hA, arm, bar, stops, balls, lm };
  },
  update(H, st, o){
    const g = st.g; if (!g) return; const r = g.r;
    o.arm.rotation.y = g.ph; o.bar.scale.x = 2 * (2 * r + 0.05);
    o.stops.forEach((s, i) => s.position.set((i ? 1 : -1) * (2 * r + 0.025 + 0.006), 0.015, 0));   // a ball (radius 0.025) at 2r touches the stop
    o.balls.forEach((b, i) => b.position.set((i ? 1 : -1) * g.s, 0.035, 0));
    o.lm.forEach((l, i) => { const sg = i ? 1 : -1; l.position.set(sg * g.s * Math.cos(g.ph), o.hA + 0.1, -sg * g.s * Math.sin(g.ph)); });
  }
});

/* 4.D.3  puck on a smooth table, rubber band to a peg.
   The peg O is a post standing up out of the table (its axis is vertical, the direction of H_O); the puck slides on the table top,
   so the puck, the band, the path and the R = 1.5 m circle all lie in one horizontal plane just above the table surface. */
view3d({
  id: 'x4d-3', size: 2.2, target: [0, 0.8, 0], camera: [-0.5, 0.42, 0.9],
  build(H){
    const TOP = 0.75, PH = 0.07, YM = TOP + PH / 2;                     // table top height, puck thickness, plane of motion
    H.floor(-3.9, 3.9, 3.9);
    // the table is larger than the whole path (largest distance from O is about 2.7 m)
    const top = H.box(6.4, 0.06, 6.4, '#e7e1d2'); top.position.set(0, TOP - 0.03, 0);
    [[-3.0, -3.0], [3.0, -3.0], [-3.0, 3.0], [3.0, 3.0]].forEach(([x, z]) => { const l = H.box(0.08, TOP - 0.06, 0.08, '#8a8478'); l.position.set(x, (TOP - 0.06) / 2, z); });
    const peg = H.mesh(new (T().CylinderGeometry)(0.04, 0.04, 0.22, 16), H.C.dark); peg.position.set(0, TOP + 0.11, 0);
    const axis = dashedLine(H, [[0, TOP + 0.22, 0], [0, TOP + 0.95, 0]], '#8a8478', 0.04);
    const puck = H.mesh(new (T().CylinderGeometry)(0.14, 0.14, PH, 32), '#c9c4b6'); puck.position.y = YM;
    const band = H.cable([[0, YM, 0], [1, YM, 0]], '#b8742a', 0.012);
    const trail = polyLine(H, 4001, '#5b5a55');
    const c15 = dashedLine(H, Array.from({ length: 121 }, (_, i) => [1.5 * Math.cos(i * Math.PI / 60), TOP + 0.003, -1.5 * Math.sin(i * Math.PI / 60)]), '#2a7f62', 0.08);
    const v = H.arrow(H.C.blue, 1.4), F = H.arrow(H.C.red, 1.2), Hv = H.arrow(H.C.purple, 1.2);
    const lO = H.label('O'), lP = H.label('P'), lv = H.label('v', H.C.blue), l15 = H.label('R = 1.5 m', '#2a7f62', 0.14), lH = H.label('H_O', H.C.purple, 0.15);
    lO.position.set(-0.16, TOP + 0.2, 0.1); l15.position.set(0, TOP + 0.05, 1.68);
    return { TOP, YM, puck, band, trail, v, F, Hv, lP, lv, lH, tr: null };
  },
  update(H, st, o){
    const g = st.g; if (!g || !st.tr) return;
    if (o.tr !== st.tr){ const a = o.trail.geometry.attributes.position.array; st.tr.forEach((q, j) => { if (j < 4001){ a[3 * j] = q[1] * Math.cos(q[3]); a[3 * j + 1] = o.TOP + 0.004; a[3 * j + 2] = -q[1] * Math.sin(q[3]); } });
      o.trail.geometry.attributes.position.needsUpdate = true; o.tr = st.tr; }
    const t = Math.min(st.hold ?? st.t, st.tEnd), i = Math.min(st.tr.length - 1, Math.floor(t / 0.0005)); o.trail.geometry.setDrawRange(0, i + 1);
    const c = Math.cos(g.th), s = Math.sin(g.th), x = g.R * c, z = -g.R * s, Y = o.YM;
    o.puck.position.set(x, Y, z); o.lP.position.set(x + 0.2, Y + 0.16, z);
    const r0 = 0.04, r1 = Math.max(r0 + 0.01, g.R - 0.14);               // peg surface → rim of the puck, at the puck's mid-height
    if (!g.slack) o.band.set([[r0 * c, Y, -r0 * s], [r1 * c, Y, -r1 * s]]);
    else { const n = 16, amp = Math.min(0.12, Math.sqrt(Math.max(0, 0.36 - g.R * g.R)) * 0.35), pts = [];
      for (let j = 0; j <= n; j++){ const q = j / n, rr = r0 + (r1 - r0) * q, w = amp * Math.sin(3 * Math.PI * q) * Math.min(1, 4 * q * (1 - q) + 0.2);
        pts.push([rr * c + s * w, Y - 0.01, -rr * s + c * w]); } o.band.set(pts); }
    const vx = g.vR * c - g.vT * s, vy = g.vR * s + g.vT * c, k = 0.07;
    o.v.set([x, Y + 0.05, z], [vx * k, 0, -vy * k]); o.lv.position.set(x + vx * k * 1.15, Y + 0.1, z - vy * k * 1.15);
    const Fm = g.slack ? 0 : st.V.k * (g.R - 0.6); o.F.set([x, Y + 0.05, z], [-c * Fm * 0.03, 0, s * Fm * 0.03]);
    // H_O = m R v_θ along the peg's axis: constant, because the band force passes through O
    const Hm = 0.2 * g.R * g.vT; o.Hv.set([0, o.TOP + 0.24, 0], [0, Math.sign(Hm) * Math.min(0.6, 0.12 * Math.abs(Hm) + 0.1), 0]);
    o.lH.position.set(0.22, o.TOP + 0.62, 0);
  }
});

/* 4.D.4  shaft between a floor bearing and a ceiling bearing, arm OC, pulley at O, A on the arm, B on the shaft */
view3d({
  id: 'x4d-4', size: 2.6, target: [0.5, 1.2, 0], camera: [-0.35, 0.35, 1],
  build(H){
    const hO = 2.0; H.floor(-1.5, 2.6, 1.2); H.ceiling(-1.5, 2.6, 2.6, 0.8);
    bearing(H, 0, 0, 0.24, 0.12); const top = H.box(0.24, 0.1, 0.24, '#8a8478'); top.position.set(0, 2.55, 0);
    vshaft(H, 0, 0, 0.12, 2.5, 0.035, '#d8d2c2');
    const arm = H.group(); arm.position.y = hO; H.bar(2.2, 0.05, '#8a8478', arm, 0.05);
    // pulley on a small bracket on the side of the arm (z = +0.06), so the cord drops beside the arm and clear of the shaft
    const pul = H.disk(0.05, 0.03, H.C.steel, arm); pul.position.set(0.1, 0.09, 0.06);
    const post = H.box(0.02, 0.07, 0.02, H.C.dark, arm); post.position.set(0.1, 0.055, 0.035);
    const axle = H.disk(0.008, 0.06, H.C.dark, arm); axle.position.set(0.1, 0.09, 0.055);
    const hub = H.mesh(new (T().CylinderGeometry)(0.06, 0.06, 0.08, 24), '#8a8478', arm);   // hub clamped to the shaft
    const A = H.box(0.16, 0.12, 0.12, '#cfd8ea', arm);
    const B = H.box(0.16, 0.16, 0.16, '#cfd8ea');
    const cord = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.006);
    curl(H, 0.14, 0.5, H.C.orange);
    const lA = H.label('A'), lB = H.label('B'), lO = H.label('O'), lC = H.label('C'), lw = H.label('ω', H.C.orange);
    lw.position.set(0.22, 0.55, 0); lO.position.set(-0.15, hO + 0.18, 0);
    const vB = H.arrow(H.C.green, 0.8);
    return { hO, arm, A, B, cord, lA, lB, lC, vB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.arm.rotation.y = g.ph; o.A.position.set(g.R, 0.085, 0);
    const c = Math.cos(g.ph), s = Math.sin(g.ph), yB = o.hO - 0.3 - g.dropB;
    o.B.position.set(0, yB, 0); o.B.rotation.y = g.ph;                  // collar B is keyed to the shaft: it slides and turns with it
    const W = (x, y, z) => [x * c + z * s, o.hO + y, -x * s + z * c];   // arm-local point → world (rotation about y by ph)
    const pts = [W(g.R - 0.08, 0.14, 0.06)];                           // inner face of A, at the height of the pulley top
    for (let j = 0; j <= 6; j++){ const a = Math.PI / 2 + j * Math.PI / 12; pts.push(W(0.1 + 0.05 * Math.cos(a), 0.09 + 0.05 * Math.sin(a), 0.06)); }   // wraps the pulley
    pts.push(W(0.05, yB + 0.08 - o.hO, 0.06));                          // straight down beside the arm to the top of B
    o.cord.set(pts);
    o.lA.position.set(g.R * c, o.hO + 0.25, -g.R * s); o.lB.position.set(0.2, yB, 0.1); o.lC.position.set(2.3 * c, o.hO + 0.15, -2.3 * s);
    o.vB.set([0.13, yB, 0.13], [0, g.vB * 0.25, 0]);
  }
});

/* 4.D.5  bar pinned to a post, A and B, bullet in the vertical plane */
view3d({
  id: 'x4d-5', size: 4.2, target: [0, 2.2, 0], camera: [-0.35, 0.2, 1],
  build(H){
    const hO = 3.45; H.floor(-3.6, 3.6, 1.2);
    const post = H.box(0.18, hO + 0.1, 0.18, '#d9d3c4'); post.position.set(0, (hO + 0.1) / 2, -0.3);   // behind the spheres (radius 0.15), so they clear it
    H.disk(0.035, 0.5, H.C.dark).position.set(0, hO, -0.13);
    const bar = H.group(); bar.position.set(0, hO, 0); const b = H.bar(3, 0.06, '#8a8478', bar, 0.06); b.rotation.z = -Math.PI / 2;
    const B = H.sphere(0.14, '#d9662b', bar); B.position.set(0, -1.5, 0); const A = H.sphere(0.15, '#d9662b', bar); A.position.set(0, -3, 0);
    const bul = H.sphere(0.05, H.C.dark); const vb = H.arrow(H.C.blue, 1.4); const J = H.arrow(H.C.red, 1.6);
    const lO = H.label('O'), lA = H.label('A'), lB = H.label('B'), lP = H.label('P'), lJ = H.label('pin impulse', H.C.red, 0.18);
    lO.position.set(-0.3, hO + 0.25, 0);
    return { hO, bar, bul, vb, J, lA, lB, lP, lJ };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.bar.rotation.z = g.th;
    const ax = 3 * Math.sin(g.th), ay = o.hO - 3 * Math.cos(g.th), bx = 1.5 * Math.sin(g.th), by = o.hO - 1.5 * Math.cos(g.th);
    o.lA.position.set(ax + 0.35, ay, 0.1); o.lB.position.set(bx + 0.35, by, 0.1);
    const appr = g.phase === 'approach'; o.bul.visible = appr; o.vb.obj.visible = appr; o.lP.visible = appr;
    if (appr){ const d = (1 - g.u) * 0.4, px = -0.6 * d, py = o.hO - 3 - 0.8 * d; o.bul.position.set(px, py, 0); o.vb.set([px, py, 0], [0.36, 0.48, 0]); o.lP.position.set(px - 0.25, py - 0.15, 0); }
    else o.vb.set([0, 0, 0], [0, 0, 0]);
    o.lJ.visible = g.J; if (g.J){ o.J.set([0, o.hO, 0.1], [st.J[0] * 0.012, st.J[1] * 0.012, 0]); o.lJ.position.set(0.5, o.hO - 0.4, 0.1); } else o.J.set([0, 0, 0], [0, 0, 0]);
  }
});

/* 4.D.6  rod pinned at O in a horizontal plane; C strikes B and sticks */
view3d({
  id: 'x4d-6', size: 1.5, target: [0, 0.3, 0], camera: [-0.3, 0.85, 1],
  build(H){
    const h = 0.3; H.floor(-1.8, 1.4, 1.1);
    const post = H.mesh(new (T().CylinderGeometry)(0.03, 0.05, h, 16), H.C.steel); post.position.set(0, h / 2, 0);
    const rod = H.group(); rod.position.y = h + 0.02;
    const bar = H.box(1, 0.02, 0.02, H.C.dark, rod);
    const A = H.box(0.12, 0.12, 0.12, '#cfd8ea', rod), B = H.box(0.09, 0.09, 0.09, '#cfd8ea', rod);
    const C = H.sphere(0.035, '#8a8478');
    const v = H.arrow(H.C.blue, 0.7), sp = curl(H, 0.12, h + 0.1, H.C.orange, false);
    const lA = H.label('A'), lB = H.label('B'), lC = H.label('C'), lO = H.label('O'), lv = H.label('v_1', H.C.blue);
    lO.position.set(0, h - 0.1, 0.12);
    return { h, rod, bar, A, B, C, v, sp, lA, lB, lC, lv };
  },
  update(H, st, o){
    const g = st.g; if (!g) return; const L = st.V.L;
    o.rod.rotation.y = g.ph; o.bar.scale.x = 3 * L; o.bar.position.x = -0.5 * L; o.A.position.x = -2 * L; o.B.position.x = L;
    const c = Math.cos(g.ph), s = Math.sin(g.ph), y = o.h + 0.02;
    o.lA.position.set(-2 * L * c, y + 0.17, 2 * L * s); o.lB.position.set(L * c, y + 0.15, -L * s);
    if (!g.after){ o.C.position.set(L, y, -g.yC - 0.08); o.v.set([L + 0.1, y, -g.yC - 0.3], [0, 0, 0.2]); o.lv.visible = true; o.lv.position.set(L + 0.22, y + 0.05, -g.yC - 0.25); o.lC.position.set(L - 0.12, y + 0.08, -g.yC - 0.07); }
    else { o.C.position.set(L * c - 0.08 * s, y, -L * s - 0.08 * c); /* C stays on the face of B that it hit */ o.v.set([0, 0, 0], [0, 0, 0]); o.lv.visible = false; o.lC.position.set(L * c - 0.08 * s, y + 0.15, -L * s - 0.08 * c); }
    o.sp.visible = g.after;
  }
});

/* 4.D.7  particle on a smooth table, cord through the hole at O, pulled from below */
view3d({
  id: 'x4d-7', size: 6.5, target: [0, 1.0, 0], camera: [-0.55, 0.45, 1],
  build(H){
    const h = 1.7; H.floor(-6, 6, 7.5);
    const sh = new (T().Shape)(); sh.moveTo(-4, -6.75); sh.lineTo(4, -6.75); sh.lineTo(4, 6.75); sh.lineTo(-4, 6.75); sh.lineTo(-4, -6.75);
    const hl = new (T().Path)(); hl.absarc(0, 0, 0.08, 0, 2 * Math.PI, true); sh.holes.push(hl);   // the hole the cord runs through
    const tg = new (T().ExtrudeGeometry)(sh, { depth: 0.06, bevelEnabled: false, curveSegments: 24 }); tg.rotateX(Math.PI / 2);
    const top = H.mesh(tg, '#d8d2c2'); top.position.set(0, h, 0);
    top.material.transparent = true; top.material.opacity = 0.55; top.material.depthWrite = false; top.castShadow = false; // see-through, so the cord below the table stays visible
    [[-3.8, -6.5], [3.8, -6.5], [-3.8, 6.5], [3.8, 6.5]].forEach(([x, z]) => { const l = H.box(0.12, h - 0.06, 0.12, '#8a8478'); l.position.set(x, (h - 0.06) / 2, z); });
    const hole = H.ring(0.085, 0.008, 2 * Math.PI, H.C.dark); hole.rotation.x = Math.PI / 2; hole.position.set(0, h + 0.002, 0);   // rim of the hole
    dashedLine(H, Array.from({ length: 121 }, (_, i) => [3 * Math.cos(i * Math.PI / 60), h + 0.005, -6 * Math.sin(i * Math.PI / 60)]), '#8b8678', 0.15);
    const P = H.sphere(0.16, '#d9662b');
    const cord = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.02);
    const T1 = H.arrow(H.C.red, 2.4), v = H.arrow(H.C.blue, 2.4);
    const lA = H.label('A'), lB = H.label('B'), lO = H.label('O'), lT = H.label('T', H.C.red, 0.3), lv = H.label('v', H.C.blue, 0.3);
    lA.position.set(3.4, h + 0.3, 0); lB.position.set(0.4, h + 0.3, -6.3); lO.position.set(-0.4, h + 0.3, 0.3);
    return { h, P, cord, T1, v, lT, lv };
  },
  update(H, st, o){
    const g = st.g; if (!g) return; const r = Math.hypot(g.x, g.y), yEnd = o.h - (8 - r) * 0.12 - 0.1;
    o.P.position.set(g.x, o.h + 0.16, -g.y);
    o.cord.set([[g.x, o.h + 0.12, -g.y], [0, o.h + 0.04, 0], [0, yEnd, 0]]);
    o.T1.set([0, yEnd, 0], [0, -0.25 - g.T * 0.02, 0]); o.lT.position.set(0.35, yEnd - 0.4, 0);
    o.v.set([g.x, o.h + 0.16, -g.y], [g.vx * 0.15, 0, -g.vy * 0.15]); o.lv.position.set(g.x + g.vx * 0.17, o.h + 0.45, -g.y - g.vy * 0.17);
  }
});

})();
