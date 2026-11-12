/* 3D views for the Chapter 4 examples 4.A.9 – 4.A.15. Each view reads the live state of the 2D clip with the same id.
   Conventions: x right, y up, z out of the screen. For the top-view problems (4.A.10, 4.A.11, 4.A.14) the 2D picture
   is the horizontal plane, mapped to 3D as (X, Y) → (X, height, −Y), so the vertical axis is the 3D y axis. */
(function(){
// cylinder with its axis along y (shafts, posts)
function post(H, r, len, color, parent){ return H.mesh(new H.THREE.CylinderGeometry(r, r, len, 32), color, parent); }
// prism: a 2D outline (x–y points) extruded along z, centred in z
function prism(H, pts, depth, color, parent){
  const T = H.THREE, s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); geo.translate(0, 0, -depth / 2); return H.mesh(geo, color, parent);
}
// dashed straight line between two points
function dashed(H, a, b, color = '#8a8478', dash = 0.06, radius = 0.006){
  const T = H.THREE, A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B), n = Math.max(1, Math.floor(L / (2 * dash))), g = new T.Group(); H.add(g);
  const dir = B.clone().sub(A).normalize(), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  for (let i = 0; i < n; i++){ const m = new T.Mesh(new T.CylinderGeometry(radius, radius, dash, 6), H.mat(color)); m.quaternion.copy(q); m.position.copy(A).addScaledVector(dir, (2 * i + 0.5) * dash); g.add(m); }
  return g;
}
// force arrows drawn on top of everything (a normal force under a floor stays visible)
function farrow(H, color, scale = 1){ const a = H.arrow(color, scale); [a.obj.line, a.obj.cone].forEach(o => { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 8; }); return a; }
// curved arrow about the vertical axis, counterclockwise seen from above, at height y
function curl(H, R, y, color, parent, tube = 0.012){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.45 * Math.PI; H.ring(R, tube, arc, color, g).castShadow = false;
  const cone = H.mesh(new T.ConeGeometry(tube * 3, tube * 7.5, 16), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0);
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.userData.avoid = true; return g;
}
// curved arrow in the x–y plane about the z axis (counterclockwise seen from the front)
function curlZ(H, R, color, parent, tube = 0.015){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.45 * Math.PI; H.ring(R, tube, arc, color, g);
  const cone = H.mesh(new T.ConeGeometry(tube * 3, tube * 7.5, 16), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0);
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.userData.avoid = true; return g;
}
// a helical spring between two points
function spring3(H, color = '#2b2f38'){
  const T = H.THREE, n = 120, geo = new T.BufferGeometry(), pos = new Float32Array(3 * n); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const ln = new T.Line(geo, new T.LineBasicMaterial({ color })); H.add(ln);
  return { set(a, b, R = 0.03, turns = 9){ const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length(); d.normalize();
    const u = new T.Vector3(0, 1, 0); if (Math.abs(u.dot(d)) > 0.9) u.set(1, 0, 0); const p = u.clone().cross(d).normalize(), q = d.clone().cross(p).normalize();
    for (let i = 0; i < n; i++){ const s = i / (n - 1), ang = 2 * Math.PI * turns * s, rr = (i < 4 || i > n - 5) ? 0 : R;
      const P = A.clone().addScaledVector(d, L * s).addScaledVector(p, rr * Math.cos(ang)).addScaledVector(q, rr * Math.sin(ang)); pos.set([P.x, P.y, P.z], 3 * i); }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere(); } };
}

/* 4.A.9  Zero-gravity flight. The path of the 2D clip (metres) is scaled down 1 : 5000 so that the whole maneuver fits.
   The aircraft model is not to scale. */
view3d({
  id: 'x4a-9', size: 2.6, target: [2.3, 0.8, 0], camera: [-0.2, 0.25, 1],
  build(H){
    H.floor(-0.3, 5.0, 1.0, -0.05);
    const plane = new H.THREE.Group(); H.add(plane); plane.scale.setScalar(2);
    H.mesh(new H.THREE.CylinderGeometry(0.035, 0.03, 0.34, 20), '#dfe3ea', plane).rotation.z = Math.PI / 2;
    const nose = H.mesh(new H.THREE.ConeGeometry(0.035, 0.08, 20), '#dfe3ea', plane); nose.rotation.z = -Math.PI / 2; nose.position.x = 0.21;
    H.box(0.09, 0.012, 0.42, '#c9cdd3', plane).position.x = 0.0;
    H.box(0.05, 0.01, 0.16, '#c9cdd3', plane).position.set(-0.15, 0.0, 0);
    H.box(0.05, 0.07, 0.01, '#c9cdd3', plane).position.set(-0.15, 0.04, 0);
    const path = { obj: null }, free = { obj: null }, osc = { obj: null };
    const lz = H.label('zero g', H.C.green, 0.13), lr = H.label('ρ', H.C.purple, 0.16);
    const a = farrow(H, H.C.green, 0.8);
    return { plane, path, free, osc, lz, lr, a, key: null };
  },
  update(H, st, o){
    const tr = st.tr; if (!tr) return;
    const P = tr.pts, xs = P.map(q => q.x), ys = P.map(q => q.y), x0 = Math.min(...xs), y0 = Math.min(...ys), s = 1 / 5000;
    const W = (x, y) => [(x - x0) * s, (y - y0) * s + 0.25, 0];
    const key = st.V.V;
    if (o.key !== key){ // rebuild the path when the speed changes
      [o.path, o.free, o.osc].forEach(q => { if (q.obj) q.obj.parent.remove(q.obj); });
      const T = H.THREE, mk = (pts, col, r) => { const c = new T.CatmullRomCurve3(pts.map(q => new T.Vector3(...W(q.x, q.y)))); const m = new T.Mesh(new T.TubeGeometry(c, Math.max(20, pts.length), r, 8), H.mat(col)); H.add(m); return m; };
      o.path.obj = mk(P.filter((q, k) => k % 3 === 0), '#8c919c', 0.008);
      o.free.obj = mk(P.filter(q => q.ph === 2), H.C.green, 0.014);
      const R = tr.rho * s, top = W(tr.top.x, tr.top.y);
      const g = new T.Group(); H.add(g); const ring = H.ring(R, 0.006, 1.1, H.C.purple, g, Math.PI / 2 - 0.55); g.position.set(top[0], top[1] - R, 0); o.osc.obj = g;
      o.lz.position.set(top[0], top[1] + 0.18, 0); o.lr.position.set(top[0] + 0.1, top[1] - Math.min(R * 0.5, 0.5), 0);
      o.key = key;
    }
    const tau = Math.min((st.hold ?? st.t) * 8, tr.T - 0.01), i = Math.min(P.length - 1, Math.max(0, Math.round(tau / 0.1))), p = P[i];
    const w = W(p.x, p.y); o.plane.position.set(...w); o.plane.rotation.z = p.gam;
    const an = p.ph === 1 || p.ph === 3 ? [-Math.sin(p.gam), Math.cos(p.gam)] : p.ph === 2 ? [0, -1] : [0, 0];
    o.a.set([w[0], w[1], 0.05], [an[0] * 0.45, an[1] * 0.45, 0]);
  }
});

/* 4.A.10  Slotted arm turning in a horizontal plane on a vertical shaft (feet). The cord runs from P to O and down the
   hollow shaft to its free end E. */
view3d({
  id: 'x4a-10', size: 2.4, target: [0.2, 0.9, 0], camera: [-0.45, 0.55, 1],
  build(H){
    const hA = 1.2;
    H.floor(-1.8, 2.2, 1.8);
    const base = H.box(0.4, 0.12, 0.4, '#8a8478'); base.position.set(0, 0.06, 0);
    const shaft = post(H, 0.06, hA - 0.12, H.C.steel); shaft.position.set(0, 0.12 + (hA - 0.12) / 2, 0);
    const arm = new H.THREE.Group(); arm.position.set(0, hA, 0); H.add(arm);
    // the arm: two rails with the slot between them, a floor plate under the slot, and a hub at O
    [-1, 1].forEach(sd => { const rail = H.box(1.9, 0.12, 0.08, '#d9d4c6', arm); rail.position.set(0.85, 0, sd * 0.1); });
    const plate = H.box(1.9, 0.03, 0.28, '#bdb7a8', arm); plate.position.set(0.85, -0.075, 0);
    post(H, 0.13, 0.16, '#d9d4c6', arm);
    const P = H.mesh(new H.THREE.CylinderGeometry(0.055, 0.055, 0.14, 24), '#9aa0a8');
    const cord = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.008);
    const E = H.sphere(0.03, H.C.dark);
    const lA = H.label('A', '#5b5a55', 0.15), lB = H.label('B', '#5b5a55', 0.15), lP = H.label('P'), lO = H.label('O');
    const w = curl(H, 0.3, hA + 0.18, H.C.purple, null, 0.012), lw = H.label('ω', H.C.purple);
    lw.position.set(0.42, hA + 0.24, 0);
    const T = farrow(H, H.C.red, 0.7), N = farrow(H, H.C.green, 0.7), lT = H.label('T', H.C.red), lN = H.label('N', H.C.green);
    return { hA, arm, P, cord, E, lA, lB, lP, lO, T, N, lT, lN };
  },
  update(H, st, o){
    if (st.r === undefined) return;
    const r = st.r, ph = st.ph, hA = o.hA, er = [Math.cos(ph), 0, -Math.sin(ph)], et = [-Math.sin(ph), 0, -Math.cos(ph)];
    o.arm.rotation.y = ph;
    const P = [er[0] * r, hA, er[2] * r]; o.P.position.set(P[0], hA + 0.012, P[2]);   // the slider rests on the slot floor (plate top at hA − 0.06)
    // the cord drops down the hollow shaft: its free end is lower as P comes closer to O
    const yE = 0.55 - (1.6 - r) * 0.25;
    o.cord.set([P, [0, hA, 0], [0, yE, 0]]); o.E.position.set(0, yE, 0);
    o.lP.position.set(P[0] + et[0] * 0.25, hA + 0.18, P[2] + et[2] * 0.25); o.lO.position.set(-0.2, hA - 0.15, 0.2);
    o.lA.position.set(er[0] * 1.6 + et[0] * 0.28, hA + 0.08, er[2] * 1.6 + et[2] * 0.28); o.lB.position.set(er[0] * 1.6 - et[0] * 0.28, hA + 0.08, er[2] * 1.6 - et[2] * 0.28);
    const m = st.m, om = st.V.om, Tm = m * r * om * om, Nm = m * 2 * st.V.rd * om, k = 0.12;
    o.T.set([P[0], hA + 0.09, P[2]], [-er[0] * Tm * k, 0, -er[2] * Tm * k]); o.N.set([P[0], hA + 0.09, P[2]], [et[0] * Nm * k * 3, 0, et[2] * Nm * k * 3]);
    o.lT.position.set(P[0] - er[0] * (Tm * k + 0.12), hA + 0.2, P[2] - er[2] * (Tm * k + 0.12));
    o.lN.visible = Math.abs(Nm) > 1e-6; o.lN.position.set(P[0] + et[0] * (Nm * k * 3 + Math.sign(Nm) * 0.12), hA + 0.2, P[2] + et[2] * (Nm * k * 3 + Math.sign(Nm) * 0.12));
  }
});

/* 4.A.11  Fixed six-lobed cam, the slotted arm turning above it, the spring and the follower P (metres). */
view3d({
  id: 'x4a-11', size: 1.25, target: [0, 0.15, 0], camera: [-0.25, 0.8, 1],
  build(H){
    const R0 = 0.5, R1 = 0.1, hC = 0.12;
    H.floor(-1.1, 1.1, 1.1);
    const pts = []; for (let k = 0; k < 360; k++){ const a = k * Math.PI / 180, R = R0 - R1 * Math.cos(6 * a); pts.push([R * Math.cos(a), R * Math.sin(a)]); }
    const cam = prism(H, pts, hC, '#d7d2c4'); cam.rotation.x = -Math.PI / 2; cam.position.y = hC / 2 + 0.0; // outline in the horizontal plane, (X, Y) → (X, −Z)
    const shaft = post(H, 0.025, 0.42, H.C.steel); shaft.position.set(0, 0.21, 0);
    const arm = new H.THREE.Group(); arm.position.set(0, hC + 0.05, 0); H.add(arm);
    const bar = H.box(0.94, 0.04, 0.08, '#5b5f68', arm); bar.position.set(0.42, 0.0, 0);
    const slot = H.box(0.78, 0.042, 0.03, '#efeadf', arm); slot.position.set(0.47, 0.0, 0);
    const P = post(H, 0.022, 0.11, '#2b2f38'); const sp = spring3(H);
    const lP = H.label('P'), lO = H.label('O'), lcam = H.label('fixed cam', '#5b5a55', 0.07);
    lO.position.set(-0.1, hC + 0.14, 0.08); lcam.position.set(-0.32, hC + 0.02, 0.42);
    const N = farrow(H, H.C.green, 0.5), Fs = farrow(H, H.C.orange, 0.5), A = farrow(H, H.C.blue, 0.5);
    const lN = H.label('N', H.C.green), lF = H.label('F_s', H.C.orange);
    const w = curl(H, 0.12, hC + 0.2, H.C.purple, null, 0.008), lw = H.label('ω', H.C.purple); lw.position.set(0.17, hC + 0.25, 0);
    return { hC, arm, P, sp, lP, N, Fs, A, lN, lF };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const th = st.th, r = st.r, om = st.V.om, y = o.hC + 0.05, er = [Math.cos(th), 0, -Math.sin(th)], et = [-Math.sin(th), 0, -Math.cos(th)];
    o.arm.rotation.y = th;
    const P = [er[0] * r, o.hC - 0.0, er[2] * r]; o.P.position.set(P[0], o.hC + 0.04, P[2]);
    o.P.material.color.set(st.on ? '#2b2f38' : '#b42346');
    o.sp.set([P[0] + er[0] * 0.03, y + 0.0, P[2] + er[2] * 0.03], [er[0] * 0.86, y, er[2] * 0.86], 0.018, 9);
    o.lP.position.set(P[0] + et[0] * 0.09, y + 0.09, P[2] + et[2] * 0.09);
    const R0 = 0.5, R1 = 0.1, k = 500, m = 0.2, k3 = 0.0009;
    const R = R0 - R1 * Math.cos(6 * th), Rp = 6 * R1 * Math.sin(6 * th), q = Math.hypot(R, Rp), nr = R / q, nt = -Rp / q;
    const Fsp = k * (r - 0.2); o.Fs.set([P[0], y + 0.02, P[2]], [-er[0] * Fsp * k3, 0, -er[2] * Fsp * k3]);
    o.lF.position.set(P[0] - er[0] * (Fsp * k3 + 0.06), y + 0.08, P[2] - er[2] * (Fsp * k3 + 0.06));
    if (st.on){
      const Rd = Rp * om, ar = 36 * R1 * Math.cos(6 * th) * om * om - R * om * om, at = 2 * Rd * om, N = (m * ar + Fsp) / nr, A = m * at - N * nt;
      const n = [nr * er[0] + nt * et[0], 0, nr * er[2] + nt * et[2]];
      o.N.set([P[0], y + 0.02, P[2]], [n[0] * N * k3, 0, n[2] * N * k3]); o.A.set([P[0], y + 0.02, P[2]], [et[0] * A * k3, 0, et[2] * A * k3]);
      o.lN.visible = true; o.lN.position.set(P[0] + n[0] * (N * k3 + 0.06), y + 0.08, P[2] + n[2] * (N * k3 + 0.06));
    } else { o.N.set([0, 0, 0], [0, 0, 0]); o.A.set([0, 0, 0], [0, 0, 0]); o.lN.visible = false; }
  }
});

/* 4.A.12  Smooth flat surface and a quarter-circle hill of radius R = 2.5 m; the block and its normal force. */
view3d({
  id: 'x4a-12', size: 4.2, target: [0.6, 1.5, 0], camera: [-0.2, 0.25, 1],
  build(H){
    const R = 2.5, d = 1.0;
    H.floor(-4, 6, 1.6);
    // the hill: a quarter-circle band on top of a solid support, extruded across the track
    const pts = [[-3.6, R], [0, R]]; for (let k = 1; k <= 30; k++){ const a = k / 30 * Math.PI / 2; pts.push([R * Math.sin(a), R * Math.cos(a)]); }
    pts.push([R - 0.2, 0]); for (let k = 30; k >= 0; k--){ const a = k / 30 * Math.PI / 2; pts.push([(R - 0.2) * Math.sin(a), (R - 0.2) * Math.cos(a)]); } pts.push([-3.6, R - 0.2]);
    prism(H, pts, d, '#a7a39a');
    const leg = H.box(0.2, R - 0.2, d * 0.8, '#bdb7a8'); leg.position.set(-3.4, (R - 0.2) / 2, 0);
    const block = H.box(0.4, 0.4, 0.4, '#cfd8ea');
    const N = farrow(H, H.C.green, 1), W = farrow(H, H.C.orange, 1), lN = H.label('N', H.C.green), lW = H.label('mg', H.C.orange), lm = H.label('m');
    const sep = H.sphere(0.05, H.C.purple), lsep = H.label('leaves here', H.C.purple, 0.16);
    const lR = H.label('R', '#5b5a55'); lR.position.set(0.5, 1.3, 0.55);
    dashed(H, [0, 0, 0.55], [0, R, 0.55]);
    return { R, d, block, N, W, lN, lW, lm, sep, lsep };
  },
  update(H, st, o){
    if (st.ph === undefined) return;
    const R = o.R, g = 9.81, m = 10; let x, y, ang, Nn = 0;
    if (st.ph === 0){ x = st.x; y = R; ang = 0; Nn = m * g; }
    else if (st.ph === 1){ x = R * Math.sin(st.th); y = R * Math.cos(st.th); ang = st.th; Nn = Math.max(0, m * (g * Math.cos(st.th) - R * st.w * st.w)); }
    else { x = st.px; y = st.py; ang = st.ph === 3 ? 0 : st.thS; if (st.ph === 3) Nn = m * g; }
    const c = [x + 0.2 * Math.sin(ang), y + 0.2 * Math.cos(ang), 0];
    o.block.position.set(...c); o.block.rotation.z = -ang;
    const k = 0.012; o.W.set([c[0], c[1], 0.25], [0, -m * g * k, 0]); o.lW.position.set(c[0] + 0.3, c[1] - m * g * k, 0.3);
    o.N.set([x, y, 0.25], [Math.sin(ang) * Nn * k, Math.cos(ang) * Nn * k, 0]); o.lN.visible = Nn > 0.5; o.lN.position.set(x + Math.sin(ang) * (Nn * k + 0.2) - 0.2, y + Math.cos(ang) * (Nn * k + 0.2), 0.3);
    o.lm.position.set(c[0] - 0.35, c[1] + 0.3, 0.2);
    const s = st.thS; o.sep.position.set(R * Math.sin(s), R * Math.cos(s), 0.5); o.lsep.position.set(R * Math.sin(s) + 0.6, R * Math.cos(s) + 0.3, 0.5);
  }
});

/* 4.A.13  Arm CA turning in a vertical plane about a pin C on a ground bracket (feet); block P on the arm. */
view3d({
  id: 'x4a-13', size: 3.6, target: [0.8, 1.6, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const yC = 0.5;
    H.floor(-3, 5, 1.2);
    const plate = H.box(0.12, yC, 0.06, H.C.steel); plate.position.set(0, yC / 2, -0.12); const plate2 = H.box(0.12, yC, 0.06, H.C.steel); plate2.position.set(0, yC / 2, 0.12);
    const base = H.box(0.6, 0.06, 0.5, H.C.steel); base.position.set(0, 0.03, 0);
    const pinM = H.disk(0.04, 0.36, H.C.dark); pinM.position.set(0, yC, 0);
    const arm = new H.THREE.Group(); arm.position.set(0, yC, 0); H.add(arm);
    const bar = H.box(4.5, 0.12, 0.16, '#6b6f78', arm); bar.position.set(2.18, -0.06, 0);
    const blk = H.box(0.36, 0.32, 0.3, '#cfd8ea');
    const lC = H.label('C'), lA = H.label('A'), lP = H.label('P');
    lC.position.set(-0.3, yC + 0.1, 0.2);
    const N = farrow(H, H.C.green, 1), f = farrow(H, H.C.red, 1), W = farrow(H, H.C.orange, 1);
    const lN = H.label('N', H.C.green), lf = H.label('f', H.C.red), lW = H.label('mg', H.C.orange);
    const w = curlZ(H, 0.45, H.C.purple, null, 0.02); w.position.set(0, yC, 0.2); const lw = H.label('ω', H.C.purple); lw.position.set(-0.55, yC + 0.4, 0.2);
    return { yC, arm, blk, lA, lP, N, f, W, lN, lf, lW };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const th = st.th, yC = o.yC, e = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)], g = 32.2, om = st.V.om;
    o.arm.rotation.z = th;
    const B = [e[0] * st.r, yC + e[1] * st.r], c = [B[0] + n[0] * 0.16, B[1] + n[1] * 0.16];
    o.blk.position.set(c[0], c[1], 0); o.blk.rotation.z = th; o.blk.material.color.set(st.slip ? '#f2c9b8' : '#cfd8ea');
    o.lA.position.set(e[0] * 4.65, yC + e[1] * 4.65 + 0.15, 0); o.lP.position.set(c[0] + n[0] * 0.5, c[1] + n[1] * 0.5, 0.2);
    let Nn, ff; if (!st.slip){ ff = g * Math.sin(th) - st.r * om * om; Nn = g * Math.cos(th); } else if (!st.done){ Nn = g * Math.cos(th) + 2 * st.rd * om; ff = -st.V.muk * Nn * Math.sign(st.rd || -1); } else { Nn = 0; ff = 0; }
    const k = 0.025;
    o.W.set([c[0], c[1], 0.2], [0, -g * k, 0]); o.lW.position.set(c[0] + 0.3, c[1] - g * k, 0.2);
    o.N.set([B[0], B[1], 0.2], [n[0] * Math.max(0, Nn) * k, n[1] * Math.max(0, Nn) * k, 0]); o.lN.visible = Nn > 0.2; o.lN.position.set(B[0] + n[0] * (Nn * k + 0.2) - e[0] * 0.25, B[1] + n[1] * (Nn * k + 0.2) - e[1] * 0.25, 0.2);
    o.f.set([B[0], B[1], 0.2], [e[0] * ff * k, e[1] * ff * k, 0]); o.lf.visible = Math.abs(ff) > 0.3; o.lf.position.set(B[0] + e[0] * (ff * k + Math.sign(ff) * 0.2), B[1] + e[1] * (ff * k + Math.sign(ff) * 0.2) - 0.12, 0.2);
  }
});

/* 4.A.14  Banked circular track (drawn with a radius of 6 units instead of 500 m, so the whole turn fits; the bank angle is true).
   The car drives counterclockwise seen from above, with the same phase as the 2D top view. */
view3d({
  id: 'x4a-14', size: 6.2, target: [0, 0.4, 0.8], camera: [-0.15, 0.5, 1],
  build(H){
    H.floor(-8.5, 8.5, 8.5, -0.02);
    const car = new H.THREE.Group(); H.add(car); car.scale.setScalar(1.7);
    H.box(0.42, 0.18, 0.9, '#f2d26b', car).position.set(0, 0.17, 0);
    H.box(0.36, 0.14, 0.45, '#f2d26b', car).position.set(0, 0.33, -0.05);
    [[-0.25, 0.3], [0.25, 0.3], [-0.25, -0.3], [0.25, -0.3]].forEach( /* wheels just outside the body sides */ ([x, z]) => { const wl = H.mesh(new H.THREE.CylinderGeometry(0.09, 0.09, 0.06, 18), '#2b2f38', car); wl.rotation.z = Math.PI / 2; wl.position.set(x, 0.09, z); });
    const lC = H.label('C'), lc = H.label('center of the turn', '#5b5a55', 0.3); lc.position.set(0, 0.5, 0);
    const post0 = H.box(0.05, 0.4, 0.05, H.C.dark); post0.position.set(0, 0.2, 0);
    const N = farrow(H, H.C.green, 2), W = farrow(H, H.C.orange, 2), F = farrow(H, H.C.red, 2), an = farrow(H, H.C.blue, 2);
    const lN = H.label('N', H.C.green, 0.3), lW = H.label('mg', H.C.orange, 0.3), lF = H.label('F', H.C.red, 0.3);
    return { car, lC, N, W, F, an, lN, lW, lF, track: null, key: null, Rt: 6 };
  },
  update(H, st, o){
    if (st.N === undefined) return;
    const th = st.V.th * Math.PI / 180, Rt = o.Rt;
    const a = 0.8;
    if (o.key !== st.V.th){ // banked surface through radius Rt, rising toward the outside of the turn at the angle θ
      if (o.track) o.track.parent.remove(o.track);
      const T = H.THREE, p = [new T.Vector2(Rt - a * Math.cos(th), 0), new T.Vector2(Rt + a * Math.cos(th), 0), new T.Vector2(Rt + a * Math.cos(th), 2 * a * Math.sin(th) + 0.001), new T.Vector2(Rt - a * Math.cos(th), 0)];
      o.track = H.mesh(new T.LatheGeometry(p, 96), '#b9b4a6'); o.track.material.side = T.DoubleSide; o.key = st.V.th;
    }
    // same phase as the 2D top view: (X, Y) = (−Rt cos φ, −Rt sin φ), so in 3D (x, z) = (−Rt cos φ, Rt sin φ); counterclockwise seen from above
    const ph = (st.V.v / 500) * st.t * 6, y = a * Math.sin(th);
    const cx = -Rt * Math.cos(ph), cz = Rt * Math.sin(ph);
    o.car.position.set(cx, y, cz);
    o.car.rotation.set(0, 0, 0); o.car.rotateY(ph); o.car.rotateZ(-th); // nose along the velocity, roof tilted toward the center
    o.lC.position.set(cx * 1.1, y + 0.8, cz * 1.1);
    const inx = -cx / Rt, inz = -cz / Rt, up = [Math.sin(th) * inx, Math.cos(th), Math.sin(th) * inz], down = [Math.cos(th) * inx, -Math.sin(th), Math.cos(th) * inz];
    const g = 9.81, k = 0.12, G = [cx + up[0] * 0.5, y + up[1] * 0.5, cz + up[2] * 0.5];
    o.W.set(G, [0, -g * k, 0]); o.lW.position.set(G[0] - inx * 0.4, G[1] - g * k, G[2] - inz * 0.4);
    o.N.set([cx, y, cz], up.map(c => c * st.N * k)); o.lN.position.set(cx + up[0] * (st.N * k + 0.3), y + up[1] * (st.N * k + 0.3), cz + up[2] * (st.N * k + 0.3));
    o.F.set([cx, y + 0.02, cz], down.map(c => c * st.F * k)); o.lF.visible = Math.abs(st.F) * k > 0.1; o.lF.position.set(cx + down[0] * (st.F * k + Math.sign(st.F) * 0.3), y + down[1] * st.F * k + 0.25, cz + down[2] * (st.F * k + Math.sign(st.F) * 0.3));
    const an = st.V.v * st.V.v / 500; o.an.set(G, [inx * an * k, 0, inz * an * k]);
  }
});

/* 4.A.15  Conical pendulum hanging from a ceiling bracket (metres). */
view3d({
  id: 'x4a-15', size: 2.2, target: [0, 1.0, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const yO = 2.1;
    H.floor(-1.6, 1.6, 1.6); H.ceiling(-0.8, 0.8, yO + 0.12, 0.5);
    const br = H.mesh(new H.THREE.ConeGeometry(0.07, 0.12, 4), H.C.steel); br.position.set(0, yO + 0.06, 0); br.rotation.x = Math.PI;
    H.sphere(0.02, H.C.dark).position.set(0, yO, 0);
    const ball = H.sphere(0.06, '#9aa0a8'), cab = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.006);
    const path = { obj: null }, axis = { obj: null };
    const lO = H.label('O'), lP = H.label('P'), lb = H.label('β', H.C.purple), lh = H.label('h', '#5b5a55'), lr = H.label('r', '#5b5a55');
    lO.position.set(-0.15, yO + 0.02, 0.1);
    const T = farrow(H, H.C.red, 0.6), W = farrow(H, H.C.orange, 0.6), v = farrow(H, H.C.dark, 0.6);
    const lT = H.label('T', H.C.red), lW = H.label('mg', H.C.orange), lv = H.label('v');
    return { yO, ball, cab, path, axis, lP, lb, lh, lr, T, W, v, lT, lW, lv, key: null };
  },
  update(H, st, o){
    if (st.b === undefined) return;
    const yO = o.yO, r = st.r, hh = st.h, yc = yO - hh, ph = (st.V.v / r) * st.t, b = st.b;
    if (o.key !== r){
      [o.path, o.axis].forEach(q => { if (q.obj) q.obj.parent.remove(q.obj); });
      const g = new H.THREE.Group(); H.add(g); const ring = H.ring(r, 0.005, 2 * Math.PI, '#8c919c', g); ring.rotation.x = Math.PI / 2; g.position.set(0, yc, 0); o.path.obj = g;
      o.axis.obj = dashed(H, [0, yO, 0], [0, yc, 0]); o.key = r;
    }
    const P = [r * Math.cos(ph), yc, r * Math.sin(ph)]; // same phase as the 2D view (front of the circle when sin φ > 0)
    o.ball.position.set(...P); o.cab.set([[0, yO, 0], P]);
    o.lP.position.set(P[0] * 1.25, yc - 0.12, P[2] * 1.25);
    o.lb.position.set(0.08, yO - 0.32, 0); o.lh.position.set(-0.1, (yO + yc) / 2, 0); o.lr.position.set(P[0] / 2, yc + 0.08, P[2] / 2);
    const m = 0.5, g = 9.81, Tn = m * g / Math.cos(b), k = 0.05, d = [-P[0], yO - yc, -P[2]], L = Math.hypot(...d);
    o.T.set(P, d.map(c => c / L * Tn * k)); o.lT.position.set(P[0] + d[0] / L * (Tn * k + 0.1), P[1] + d[1] / L * (Tn * k + 0.1), P[2] + d[2] / L * (Tn * k + 0.1));
    o.W.set(P, [0, -m * g * k, 0]); o.lW.position.set(P[0] + 0.12, P[1] - m * g * k, P[2]);
    const tv = [-Math.sin(ph), 0, Math.cos(ph)]; o.v.set(P, tv.map(c => c * st.V.v * 0.1)); o.lv.position.set(P[0] + tv[0] * (st.V.v * 0.1 + 0.1), P[1] + 0.05, P[2] + tv[2] * (st.V.v * 0.1 + 0.1));
  }
});

})();
