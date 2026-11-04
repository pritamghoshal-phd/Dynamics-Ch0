/* 3D views for examples 2.A.1 – 2.A.5. Each view reads the live state of the 2D clip with the same id.
   Conventions: x right, y up, z out of the 2D picture (metres). For 2.A.3 the problem's vertical z axis is the 3D y axis. */
(function(){

const dot = (H, r, color, parent) => H.sphere(r, color, parent);
// curved arrow about the z axis (for ω and α); dir = +1 counterclockwise, −1 clockwise
function curl(H, R, color, dir = 1, parent){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.3 * Math.PI, start = dir > 0 ? 0.2 : 0.2 + arc;
  H.ring(R, 0.008, arc, color, g, 0.2);
  const cone = H.mesh(new T.ConeGeometry(0.022, 0.06, 14), color, g), a = dir > 0 ? 0.2 + arc : 0.2;
  cone.position.set(R * Math.cos(a), R * Math.sin(a), 0);
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(a) * dir, Math.cos(a) * dir, 0));
  return g;   // large arcs around a whole body are not label obstacles
}

/* 2.A.1  Disk on a fixed axle; P on the rim (clip 'x2a-1'). r = 0.4 m, α = −10 rad/s². */
view3d({
  id: 'x2a-1', size: 1.5, target: [0, 0.65, 0], camera: [-0.35, 0.3, 1],
  build(H){
    const r = 0.4, O = [0, 0.7];
    H.floor(-0.9, 0.9, 0.5);
    // axle on a pedestal behind the disk
    const ped = H.box(0.1, O[1], 0.08, H.C.steel); ped.position.set(0, O[1] / 2, -0.12);
    H.disk(0.025, 0.24, H.C.dark).position.set(0, O[1], -0.04);
    const disk = new H.THREE.Group(); disk.position.set(0, O[1], 0); H.add(disk);
    H.disk(r, 0.04, '#d3cfc3', disk);
    for (let k = 0; k < 4; k++){ const s = H.box(r - 0.03, 0.012, 0.042, '#8a8478', disk); s.position.set((r - 0.03) / 2 * Math.cos(k * Math.PI / 2), (r - 0.03) / 2 * Math.sin(k * Math.PI / 2), 0); s.rotation.z = k * Math.PI / 2; }
    const P = dot(H, 0.022, H.C.dark); const lP = H.label('P'), lO = H.label('O'); lO.position.set(0.07, O[1] + 0.07, 0.06);
    const aP = H.arrow(H.C.red, 0.8), an = H.arrow(H.C.green, 0.6), at = H.arrow(H.C.purple, 0.6), la = H.label('a_P', H.C.red);
    const om = curl(H, r + 0.07, H.C.blue, 1); om.position.set(0, O[1], 0.03);
    return { r, O, disk, P, lP, aP, an, at, la, om };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const c = Math.cos(st.th), s = Math.sin(st.th), k = 0.085, AL = st.al ?? -10;
    o.disk.rotation.z = st.th - Math.PI;
    const p = [o.r * c, o.O[1] + o.r * s, 0.03]; o.P.position.set(...p); o.lP.position.set(p[0] - 0.08 * c, p[1] - 0.08 * s, 0.05);
    const an = [-st.om * st.om * o.r * c, -st.om * st.om * o.r * s], at = [-AL * o.r * s, AL * o.r * c];
    o.an.set(p, [an[0] * k, an[1] * k, 0]); o.at.set([p[0] + an[0] * k, p[1] + an[1] * k, p[2]], [at[0] * k, at[1] * k, 0]);
    o.aP.set(p, [(an[0] + at[0]) * k, (an[1] + at[1]) * k, 0]);
    o.la.position.set(p[0] + (an[0] + at[0]) * k + 0.04, p[1] + (an[1] + at[1]) * k + 0.04, 0.05);
    o.om.scale.y = st.om >= 0 ? 1 : -1;  // mirror the curved arrow when the disk turns clockwise
  }
});

/* 2.A.2  Belt-driven stepped pulley (clip 'x2a-2'). Inner pulley r = 0.075 m carries the belt, disk R = 0.15 m.
   The belt runs to a drive pulley on a motor so that it forms a closed loop. φ is the clockwise rotation. */
view3d({
  id: 'x2a-2', size: 0.75, target: [0.22, 0.32, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const R = 0.15, r = 0.075, O = [0, 0.32], D = 0.55, zb = 0.035;
    H.floor(-0.35, 0.8, 0.3);
    const ped = H.box(0.05, O[1], 0.05, H.C.steel); ped.position.set(0, O[1] / 2, -0.1);
    H.disk(0.012, 0.2, H.C.dark).position.set(0, O[1], -0.02);
    const pul = new H.THREE.Group(); pul.position.set(0, O[1], 0); H.add(pul);
    H.disk(R, 0.025, '#d3cfc3', pul).position.z = -0.025; H.disk(r, 0.04, '#a9a496', pul).position.z = zb;
    for (let k = 0; k < 6; k++){ const s = H.box(R - r, 0.01, 0.027, '#6d6a62', pul); const a = k * Math.PI / 3; s.position.set((R + r) / 2 * Math.cos(a), (R + r) / 2 * Math.sin(a), -0.025); s.rotation.z = a; }
    // drive pulley on a motor at x = D
    const mot = H.box(0.12, 0.1, 0.1, '#5b5a55'); mot.position.set(D, O[1], -0.08);
    const mstand = H.box(0.1, O[1] - 0.05, 0.1, H.C.steel); mstand.position.set(D, (O[1] - 0.05) / 2, -0.08);
    const drv = new H.THREE.Group(); drv.position.set(D, O[1], 0); H.add(drv); H.disk(r, 0.04, '#a9a496', drv).position.z = zb;
    const ds = H.box(r * 1.6, 0.01, 0.042, '#6d6a62', drv); ds.position.z = zb;
    // belt: two straight runs and two half loops
    const bc = '#2b2b2b', bw = 0.03;
    [r, -r].forEach(y => { const run = H.box(D, 0.006, bw, bc); run.position.set(D / 2, O[1] + y, zb); });
    const l1 = H.ring(r, 0.004, Math.PI, bc, null, Math.PI / 2); l1.position.set(0, O[1], zb); l1.scale.z = bw / 0.008;
    const l2 = H.ring(r, 0.004, Math.PI, bc, null, -Math.PI / 2); l2.position.set(D, O[1], zb); l2.scale.z = bw / 0.008;
    const A = dot(H, 0.012, H.C.dark), B = dot(H, 0.012, H.C.dark), C = dot(H, 0.014, H.C.green);
    const lA = H.label('A', '#1c1d21', 0.07), lB = H.label('B', '#1c1d21', 0.07), lC = H.label('C', '#1c1d21', 0.07), lO = H.label('O', '#1c1d21', 0.07);
    lO.position.set(0.03, O[1] - 0.04, 0.06);
    const aA = H.arrow(H.C.red, 0.4), aB = H.arrow(H.C.orange, 0.4), aC = H.arrow(H.C.green, 0.4);
    return { R, r, O, D, zb, pul, drv, A, B, C, lA, lB, lC, aA, aB, aC };
  },
  update(H, st, o){
    if (st.phi === undefined) return;
    const ph = st.phi, om = st.om, AL = 300, k = 0.0022;
    o.pul.rotation.z = -ph; o.drv.rotation.z = -ph;
    const mat = (rad, a0) => { const a = a0 - ph; return [rad * Math.cos(a), rad * Math.sin(a)]; };
    const acc = p => [-om * om * p[0] + AL * p[1], -om * om * p[1] - AL * p[0]];
    const pA = mat(o.R, -Math.PI / 2), pB = mat(o.r, Math.PI);
    const A = [pA[0], o.O[1] + pA[1], -0.01], B = [pB[0], o.O[1] + pB[1], o.zb + 0.022];
    o.A.position.set(...A); o.B.position.set(...B);
    const xC = 0.2045 + ph * o.r, C = [xC, o.O[1] + o.r + 0.008, o.zb]; o.C.position.set(...C);
    const aA = acc(pA), aB = acc(pB);
    o.aA.set(A, [aA[0] * k, aA[1] * k, 0]); o.aB.set(B, [aB[0] * k, aB[1] * k, 0]); o.aC.set(C, [AL * o.r * k, 0, 0]);
    o.lA.position.set(A[0] + 0.03, A[1] - 0.03, 0.04); o.lB.position.set(B[0] - 0.035, B[1], 0.06); o.lC.position.set(C[0], C[1] + 0.035, 0.05);
  }
});

/* 2.A.3  Bent bar on a vertical shaft (clip 'x2a-3'). Problem axes (x, y, z up) map to 3D as (x, z, −y). */
view3d({
  id: 'x2a-3', size: 1.25, target: [0.15, 0.3, -0.1], camera: [0.55, 0.75, 1],
  build(H){
    const hb = 0.35, T = H.THREE;
    H.floor(-0.8, 0.9, 0.8);
    const brg = H.box(0.14, 0.08, 0.14, '#8a8478'); brg.position.set(0, 0.04, 0);
    const sh = H.mesh(new T.CylinderGeometry(0.02, 0.02, hb + 0.25, 24), H.C.steel); sh.position.set(0, (hb + 0.25) / 2, 0);
    const arm = new T.Group(); arm.position.set(0, hb, 0); H.add(arm);
    const b1 = H.box(0.5, 0.03, 0.04, H.C.body, arm); b1.position.set(0.25, 0, 0);
    const b2 = H.box(0.04, 0.03, 0.25, H.C.body, arm); b2.position.set(0.5, 0, -0.125 + 0.02);
    const post = H.mesh(new T.CylinderGeometry(0.012, 0.012, 0.05, 16), '#b8b4a8', arm); post.position.set(0.5, 0.04, -0.25);
    const hub = H.mesh(new T.CylinderGeometry(0.035, 0.035, 0.06, 24), H.C.dark, arm);
    const P = dot(H, 0.014, H.C.dark, arm); P.position.set(0.5, 0.065, -0.25);
    // dashed vertical axis and the ω, α curved arrow around it
    for (let y = hb + 0.27; y < hb + 0.55; y += 0.05){ const d = H.box(0.006, 0.025, 0.006, '#8a8478'); d.position.set(0, y, 0); }
    const g = new T.Group(); g.position.set(0, hb + 0.42, 0); g.rotation.x = -Math.PI / 2; H.add(g);
    H.ring(0.08, 0.006, 1.4 * Math.PI, H.C.blue, g); const cone = H.mesh(new T.ConeGeometry(0.018, 0.05, 12), H.C.blue, g);
    const a = 1.4 * Math.PI; cone.position.set(0.08 * Math.cos(a), 0.08 * Math.sin(a), 0); cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(a), Math.cos(a), 0)); g.userData.avoid = true;
    const lw = H.label('ω, α', H.C.blue, 0.07); lw.position.set(0.14, hb + 0.45, 0);
    const lO = H.label('O', '#1c1d21', 0.07); lO.position.set(-0.07, hb, 0.05);
    const lP = H.label('P', '#1c1d21', 0.07), vP = H.arrow(H.C.orange, 0.6), aP = H.arrow(H.C.red, 0.6), lv = H.label('v_P', H.C.orange, 0.07), la = H.label('a_P', H.C.red, 0.07);
    return { hb, arm, P, lP, vP, aP, lv, la };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const th = st.th, om = st.om, AL = 3, c = Math.cos(th), s = Math.sin(th);
    o.arm.rotation.y = th;
    const r = [0.5 * c - 0.25 * s, 0.5 * s + 0.25 * c];             // horizontal position of P in problem axes
    const v = [-om * r[1], om * r[0]], a = [-AL * r[1] - om * om * r[0], AL * r[0] - om * om * r[1]];
    const to3 = q => [q[0], 0, -q[1]], P = [r[0], o.hb + 0.065, -r[1]], kv = 0.2, ka = 0.09;
    o.vP.set(P, to3(v).map(x => x * kv)); o.aP.set(P, to3(a).map(x => x * ka));
    o.lP.position.set(P[0], P[1] + 0.06, P[2]);
    o.lv.position.set(P[0] + v[0] * kv * 1.15, P[1] + 0.03, P[2] - v[1] * kv * 1.15); o.la.position.set(P[0] + a[0] * ka * 1.12, P[1] + 0.03, P[2] - a[1] * ka * 1.12);
  }
});

/* 2.A.4  Compound gear between two racks (clip 'x2a-4'). Rack A meshes with the inner gear (front plane),
   rack B with the outer gear (back plane). Rack B slides on the floor guide, rack A in guides fixed to a back wall. */
view3d({
  id: 'x2a-4', size: 0.7, target: [0.03, 0.27, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const R = 0.16, r = 0.1, yO = 0.27, zi = 0.03, zo = -0.03, T = H.THREE;
    H.floor(-0.65, 0.65, 0.3, yO - R - 0.04);
    const back = H.box(1.3, 0.55, 0.03, H.C.wall); back.position.set(0, yO - R - 0.04 + 0.31, -0.2);
    const gear = new T.Group(); gear.position.set(0, yO, 0); H.add(gear);
    H.disk(R - 0.008, 0.03, '#d3cfc3', gear).position.z = zo; H.disk(r - 0.008, 0.04, '#a9a496', gear).position.z = zi;
    for (let k = 0; k < 40; k++){ const a = 2 * Math.PI * k / 40, t = H.box(0.016, 0.012, 0.03, '#b8b3a6', gear); t.position.set((R - 0.004) * Math.cos(a), (R - 0.004) * Math.sin(a), zo); t.rotation.z = a; }
    for (let k = 0; k < 26; k++){ const a = 2 * Math.PI * k / 26, t = H.box(0.016, 0.012, 0.04, '#8f8a7d', gear); t.position.set((r - 0.004) * Math.cos(a), (r - 0.004) * Math.sin(a), zi); t.rotation.z = a; }
    H.disk(0.012, 0.12, H.C.dark, gear);
    const mk = H.box(R - 0.03, 0.01, 0.032, H.C.orange, gear); mk.position.set((R - 0.03) / 2 + 0.015, 0, zo + 0.002);
    const rack = (y, z, top) => { const g = new T.Group(); H.add(g); const b = H.box(1.1, 0.03, 0.04, '#8b8f98', g); b.position.set(0, y + (top ? 0.015 + 0.004 : -0.015 - 0.004), z);
      for (let x = -0.54; x < 0.55; x += 0.025){ const t = H.box(0.01, 0.008, 0.04, '#8b8f98', g); t.position.set(x, y, z); } return g; };
    const rA = rack(yO + r, zi, true), rB = rack(yO - R, zo, false);
    // guides for rack A: two brackets from the back wall
    [-0.45, 0.45].forEach(x => { const arm = H.box(0.04, 0.03, 0.2, H.C.steel); arm.position.set(x, yO + r + 0.05, -0.08); const lip = H.box(0.06, 0.012, 0.05, H.C.steel); lip.position.set(x, yO + r + 0.04, zi); });
    const lA = H.label('A', '#1c1d21', 0.08), lB = H.label('B', '#1c1d21', 0.08); lA.position.set(0.5, yO + r + 0.07, zi); lB.position.set(0.5, yO - R - 0.06, zo + 0.05);
    const P = dot(H, 0.012, '#ffffff'), lP = H.label('P', '#1c1d21', 0.07), lO = H.label('O', '#1c1d21', 0.07);
    const vP = H.arrow(H.C.orange, 0.5), aP = H.arrow(H.C.red, 0.5), vO = H.arrow(H.C.blue, 0.5);
    return { R, r, yO, zi, zo, gear, rA, rB, P, lP, lO, vP, aP, vO };
  },
  update(H, st, o){
    if (st.phi === undefined) return;
    const t = st.tt, vA = 0.2 + 2 * t, om = (-0.6 - vA) / (o.R + o.r), vO = vA + om * o.r, AL = -2 / (o.R + o.r), aO = 2 + AL * o.r;
    o.gear.position.x = st.xO; o.gear.rotation.z = st.phi; o.rA.position.x = st.xA; o.rB.position.x = st.xB;
    const c = Math.cos(st.phi), s = Math.sin(st.phi), p = [o.R * c, o.R * s], P = [st.xO + p[0], o.yO + p[1], o.zo + 0.02];
    o.P.position.set(...P); o.lP.position.set(P[0] + 0.04, P[1] + 0.03, 0.06); o.lO.position.set(st.xO - 0.03, o.yO - 0.035, 0.07);
    const v = [vO - om * p[1], om * p[0]], a = [aO - AL * p[1] - om * om * p[0], AL * p[0] - om * om * p[1]];
    o.vP.set(P, [v[0] * 0.15, v[1] * 0.15, 0]); o.aP.set(P, [a[0] * 0.035, a[1] * 0.035, 0]); o.lP.visible = true; o.vO.set([st.xO, o.yO, 0.09], [vO * 0.15, 0, 0]);
  }
});

/* 2.A.5  Wheel rolling on the ground and slowing down (clip 'x2a-5'). Lengths in ft are shown in metres (1 ft = 0.3048 m). */
view3d({
  id: 'x2a-5', size: 2.2, target: [1.1, 0.5, 0], camera: [-0.25, 0.3, 1],
  build(H){
    const F = 0.3048, r = 2 * F, T = H.THREE;
    H.floor(-0.6, 3.2, 0.6);
    const wheel = new T.Group(); H.add(wheel);
    H.disk(r, 0.12, '#b8b3a6', wheel); H.disk(r * 0.25, 0.16, '#6d6a62', wheel);
    const tyre = H.ring(r - 0.02, 0.03, 2 * Math.PI, '#3a3d44', wheel); tyre.scale.z = 2;
    const sp = H.box(r - 0.05, 0.03, 0.13, H.C.orange, wheel); sp.position.set((r - 0.05) / 2, 0, 0);
    // path of P (cycloid) computed from the same motion as the 2D clip
    const v0 = 6.5, a0 = -3, TS = 0.5, Tend = 0.5 + 5 / 3, xO = t => { const q = Math.min(t, Tend); return v0 * q + 0.5 * a0 * q * q; };
    const pts = []; for (let i = 0; i <= 160; i++){ const t = Tend * i / 160, ph = Math.PI / 2 - (xO(t) - xO(TS)) / 2; pts.push(new T.Vector3((xO(t) + 2 * Math.cos(ph)) * F, (2 + 2 * Math.sin(ph)) * F, 0.07)); }
    H.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0x8a3fd1, dashSize: 0.04, gapSize: 0.03 }))).computeLineDistances();
    const P = dot(H, 0.025, H.C.dark), lP = H.label('P'), lO = H.label('O'), aP = H.arrow(H.C.red, 0.9), vO = H.arrow(H.C.blue, 0.9), la = H.label('a_P', H.C.red), lv = H.label('v_O', H.C.blue);
    return { F, r, wheel, P, lP, lO, aP, vO, la, lv };
  },
  update(H, st, o){
    if (st.xO === undefined) return;
    const F = o.F, x = st.xO * F, ph = st.ph, c = Math.cos(ph), s = Math.sin(ph), stopped = st.tt >= 0.5 + 5 / 3 - 1e-9;
    o.wheel.position.set(x, o.r, 0); o.wheel.rotation.z = ph;
    const P = [x + o.r * c, o.r + o.r * s, 0.08]; o.P.position.set(...P); o.lP.position.set(P[0] + 0.1 * c, P[1] + 0.1 * s, 0.1);
    o.lO.position.set(x - 0.08, o.r - 0.08, 0.12);
    const om = st.om, al = stopped ? 0 : 1.5, aO = stopped ? 0 : -3, p = [2 * c, 2 * s];
    const a = [aO - al * p[1] - om * om * p[0], al * p[0] - om * om * p[1]], k = 0.025;
    o.aP.set(P, [a[0] * k, a[1] * k, 0]); o.la.position.set(P[0] + a[0] * k * 1.1 - 0.05, P[1] + a[1] * k * 1.1, 0.1);
    const v = -om * 2; o.vO.set([x, o.r, 0.12], [v * 0.06, 0, 0]); o.lv.position.set(x + v * 0.06 + 0.08, o.r + 0.05, 0.12);
  }
});

})();
