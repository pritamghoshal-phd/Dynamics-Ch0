/* 3D views for the work–energy examples 5.B.1 and 5.B.3 – 5.B.10.
   Each view reads the live state of the 2D clip with the same id (e-b1, e-b4 in ch5.js; xw-3 … xw-10 in ch5-exB.js),
   so the physics is computed once. Only simple kinematics (positions from the clip's coordinates) is done here.
   Lengths are in the units of the example: metres for SI examples, feet for 5.B.3, 5.B.8 and 5.B.10. */
(function(){

/* ---------- local helpers ---------- */
// helical spring between two points; the coil is rebuilt when its length changes so the wire keeps its thickness
function spring(H, R, turns, wire, color){
  const T = H.THREE, m = new T.Mesh(new T.BufferGeometry(), H.mat(color || '#6d7480', { metalness: 0.35, roughness: 0.4 }));
  m.castShadow = true; H.add(m); let lastL = -1;
  return { mesh: m, set(a, b){
    const A = new T.Vector3(...a), B = new T.Vector3(...b), L = Math.max(A.distanceTo(B), 1e-3);
    if (Math.abs(L - lastL) > 1e-4){
      lastL = L; const lead = Math.min(0.1 * L, 2 * R), N = Math.round(turns * 16), pts = [new T.Vector3(0, 0, 0), new T.Vector3(0, lead * 0.6, 0)];
      for (let i = 0; i <= N; i++){ const u = i / N, a2 = 2 * Math.PI * turns * u; pts.push(new T.Vector3(R * Math.cos(a2) * Math.min(1, 4 * u, 4 * (1 - u)), lead + (L - 2 * lead) * u, R * Math.sin(a2) * Math.min(1, 4 * u, 4 * (1 - u)))); }
      pts.push(new T.Vector3(0, L - lead * 0.6, 0), new T.Vector3(0, L, 0));
      m.geometry.dispose(); m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), N + 8, wire, 6, false);
    }
    m.position.copy(A); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  } };
}
// a group whose local +x runs from p towards q (for links of fixed length)
const aim = (g, p, q, z = 0) => { g.position.set(p[0], p[1], z); g.rotation.z = Math.atan2(q[1] - p[1], q[0] - p[0]); };
const grp = (H, parent) => { const g = new H.THREE.Group(); H.add(g, parent); return g; };
const pinAt = (H, x, y, z, depth, r = 0.025) => { const p = H.disk(r, depth, H.C.dark); p.position.set(x, y, z); return p; };

/* ---------- 5.B.1  stepped drum, both blocks hanging (clip 'e-b1') ----------
   Drum centre O 4.2 m above the floor, outer radius R = 0.4 m (block A, left), inner radius r = 0.2 m (block B, right).
   θ = ½ α t² (clockwise when B drops), limited so that B moves at most d. */
view3d({
  id: 'e-b1', size: 3.5, target: [0, 2.35, 0], camera: [-0.35, 0.15, 1],
  build(H){
    const O = [0, 4.2], R = 0.4, r = 0.2;
    H.floor(-1.6, 1.6, 0.6); H.ceiling(-1.6, 1.6, 4.6, 0.45);
    H.pinSupport(0, O[1], 0.4, 'down', -0.22); H.pinSupport(0, O[1], 0.4, 'down', 0.21);
    pinAt(H, 0, O[1], 0, 0.5);
    const drum = grp(H); drum.position.set(0, O[1], 0);
    H.disk(R, 0.12, H.C.body, drum).position.z = -0.08; H.disk(r, 0.16, '#d9c58c', drum).position.z = 0.06;
    const mk = H.box(R - r - 0.02, 0.035, 0.125, H.C.orange, drum); mk.position.set((R + r) / 2, 0, -0.08);
    const mk2 = H.box(r - 0.03, 0.03, 0.165, H.C.edge, drum); mk2.position.set(-r / 2, 0, 0.06);
    const A = H.box(0.26, 0.26, 0.26, '#cfd8ea'), B = H.box(0.26, 0.26, 0.26, '#e6c9b5');
    const cA = H.cable([[0, 0, 0], [0, 1, 0]]), cB = H.cable([[0, 0, 0], [0, 1, 0]]);
    const la = H.label('A', '#1c1d21', 0.3), lb = H.label('B', '#1c1d21', 0.3), lo = H.label('O', '#1c1d21', 0.3);
    lo.position.set(-0.3, O[1] + 0.55, 0.1);
    const vA = H.arrow(H.C.blue, 1.6), vB = H.arrow(H.C.blue, 1.6), lvA = H.label('vA', H.C.blue, 0.24), lvB = H.label('vB', H.C.blue, 0.24);
    return { O, R, r, drum, A, B, cA, cB, la, lb, vA, vB, lvA, lvB };
  },
  update(H, st, o){
    if (!st.ok || st.al === undefined) return;
    const V = st.V, tt = st.hold ?? st.t; let th = 0.5 * st.al * tt * tt; if (Math.abs(o.r * th) > V.d) th = Math.sign(th) * V.d / o.r;
    const up = st.net >= 0, yA = (up ? 0.35 : 3.3) + o.R * th, yB = (up ? 3.2 : 1.4) - o.r * th;
    o.drum.rotation.z = -th;
    o.A.position.set(-o.R, yA, -0.08); o.B.position.set(o.r, yB, 0.06);
    o.cA.set([[-o.R, o.O[1], -0.08], [-o.R, yA + 0.13, -0.08]]); o.cB.set([[o.r, o.O[1], 0.06], [o.r, yB + 0.13, 0.06]]);
    o.la.position.set(-o.R - 0.32, yA, 0.1); o.lb.position.set(o.r + 0.32, yB + 0.05, 0.1);
    const om = Math.sign(st.al) * Math.sqrt(Math.max(0, 2 * st.al * th)), k = 0.35;
    o.vA.set([-o.R - 0.2, yA, 0.15], [0, o.R * om * k, 0]); o.vB.set([o.r + 0.2, yB, 0.15], [0, -o.r * om * k, 0]);
    o.lvA.visible = Math.abs(om) > 0.3; o.lvB.visible = o.lvA.visible;
    o.lvA.position.set(-o.R - 0.42, yA + o.R * om * k * 0.6, 0.15); o.lvB.position.set(o.r + 0.42, yB - o.r * om * k * 0.6, 0.15);
  }
});

/* ---------- 5.B.4  rectangular plate swinging about a corner pin (clip 'e-b4') ----------
   Pin O hangs from the ceiling 3 m above the floor level; the plate (b × d) starts with O at its upper-right corner.
   The rotation from the start, s − φ₀, is counterclockwise as in the 2D view. */
view3d({
  id: 'e-b4', size: 2.6, target: [0, 2.1, 0], camera: [-0.3, 0.12, 1],
  build(H){
    const O = [0, 3.0];
    H.ceiling(-1.8, 1.8, 3.35, 0.4); H.pinSupport(0, O[1], 0.35, 'down', -0.1);
    pinAt(H, 0, O[1], 0, 0.32, 0.03);
    const g = grp(H); g.position.set(0, O[1], 0);
    const plate = H.box(1, 1, 0.05, '#b9b3a4', g);
    const G = H.sphere(0.035, H.C.dark, g);
    const plumb = H.cable([[0, O[1], -0.01], [0, O[1] - 1, -0.01]], '#9a968c', 0.004);
    const lo = H.label('O', '#1c1d21', 0.16), lg = H.label('G', '#1c1d21', 0.16); lo.position.set(0.16, O[1] + 0.12, 0.1);
    const vG = H.arrow(H.C.blue, 1.2), lv = H.label('vG', H.C.blue, 0.14);
    return { O, g, plate, G, plumb, lg, vG, lv };
  },
  update(H, st, o){
    if (!st.ok || !st.s) return;
    const V = st.V, b = V.r * V.d, d = V.d, rot = st.s[0] - st.phi0;
    o.plate.scale.set(b, d, 1); o.plate.position.set(-b / 2, -d / 2, 0.06); o.G.position.set(-b / 2, -d / 2, 0.1);
    o.g.rotation.z = rot;
    const c = Math.cos(rot), s = Math.sin(rot), gx = -b / 2 * c + d / 2 * s, gy = -b / 2 * s - d / 2 * c;
    o.plumb.set([[0, o.O[1], -0.01], [0, o.O[1] - st.rho - 0.25, -0.01]]);
    o.lg.position.set(gx + 0.12, o.O[1] + gy - 0.1, 0.14);
    const w = st.s[1], k = 0.18; o.vG.set([gx, o.O[1] + gy, 0.12], [-w * gy * k, w * gx * k, 0]);
    o.lv.visible = Math.abs(w) * st.rho > 0.4; o.lv.position.set(gx - w * gy * k * 1.15, o.O[1] + gy + w * gx * k * 1.15 + 0.08, 0.14);
  }
});

/* ---------- 5.B.3  bar OA held by a spring from B (clip 'xw-3'), lengths in feet ----------
   O is a ground pin, B is 6 ft directly above O, the bar is 4 ft long and θ is measured from the vertical. */
view3d({
  id: 'xw-3', size: 6.8, target: [1.6, 3.2, 0], camera: [-0.3, 0.2, 1],
  build(H){
    const O = [0, 0.35], B = [0, 6.35], L = 4;
    H.floor(-2, 5.5, 1.4); H.ceiling(-1.5, 2, 6.55, 0.8);
    H.pinSupport(0, O[1], 0.35, 'up', -0.16); H.pinSupport(0, O[1], 0.35, 'up', 0.16);
    pinAt(H, 0, O[1], 0, 0.5, 0.06);
    const eye = H.box(0.12, 0.2, 0.12, H.C.steel); eye.position.set(0, B[1] + 0.1, 0);
    const g = grp(H); g.position.set(O[0], O[1], 0);
    H.bar(L, 0.16, H.C.wood, g, 0.16);
    const Gm = H.sphere(0.07, H.C.dark, g); Gm.position.set(L / 2, 0, 0.09);
    const sp = spring(H, 0.16, 11, 0.025);
    const la = H.label('A', '#1c1d21', 0.45), lg = H.label('G', '#1c1d21', 0.42), lo = H.label('O', '#1c1d21', 0.45), lb = H.label('B', '#1c1d21', 0.45);
    lo.position.set(-0.55, O[1] + 0.2, 0.2); lb.position.set(-0.45, B[1] - 0.25, 0.2);
    const vA = H.arrow(H.C.blue, 4), lv = H.label('vA', H.C.blue, 0.38);
    return { O, B, L, g, sp, la, lg, vA, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], s = Math.sin(th), c = Math.cos(th), A = [o.O[0] + o.L * s, o.O[1] + o.L * c];
    o.g.rotation.z = Math.PI / 2 - th;
    o.sp.set([o.B[0], o.B[1], 0], [A[0], A[1], 0]);
    o.la.position.set(A[0] + 0.35, A[1] + 0.3, 0.2); o.lg.position.set(o.O[0] + 2 * s + 0.4 * c, o.O[1] + 2 * c - 0.4 * s, 0.2);
    const w = st.s[1], k = 0.18; o.vA.set([A[0], A[1], 0.12], [o.L * w * c * k, -o.L * w * s * k, 0]);
    o.lv.visible = Math.abs(w) > 0.3; o.lv.position.set(A[0] + o.L * w * c * k * 1.1 + 0.2, A[1] - o.L * w * s * k * 1.1 + 0.25, 0.2);
  }
});

/* ---------- 5.B.5  two links and a slider (clip 'xw-5') ----------
   O is a ceiling pin 4.6 m above the floor, OA = AB = 2 m, slider B runs in a vertical guide directly below O. */
view3d({
  id: 'xw-5', size: 3.9, target: [0.5, 2.5, 0], camera: [-0.4, 0.15, 1],
  build(H){
    const O = [0, 4.6], L = 2;
    H.floor(-1.6, 2.8, 0.6); H.ceiling(-1, 1.4, 4.95, 0.35); H.pinSupport(0, O[1], 0.35, 'down', -0.08);
    pinAt(H, 0, O[1], 0.04, 0.28);
    [-0.17, 0.17].forEach(x => { const rl = H.box(0.04, 2.7, 0.3, H.C.steel); rl.position.set(x, 1.35, 0); });
    const slider = H.box(0.3, 0.4, 0.28, '#cfd8ea');
    const gOA = grp(H), gAB = grp(H);
    H.bar(L, 0.07, H.C.wood, gOA, 0.05); H.bar(L, 0.07, '#d8b77d', gAB, 0.05);
    const pA = pinAt(H, 0, 0, 0.16, 0.14), pB = pinAt(H, 0, 0, 0.17, 0.14);
    const F = H.arrow(H.C.red, 1.6), vB = H.arrow(H.C.blue, 1.6);
    const lo = H.label('O', '#1c1d21', 0.2), la = H.label('A'), lb = H.label('B', '#1c1d21', 0.2), lf = H.label('F', H.C.red, 0.2), lv = H.label('vB', H.C.blue, 0.17);
    la.scale.multiplyScalar(1.25); lo.position.set(-0.28, O[1] - 0.05, 0.2);
    return { O, L, slider, gOA, gAB, pA, pB, F, vB, la, lb, lf, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = Math.min(st.s[0], Math.asin(0.8)), s = Math.sin(th), c = Math.cos(th), V = st.V;
    const A = [o.L * s, o.O[1] - o.L * c], B = [0, o.O[1] - 2 * o.L * c];
    aim(o.gOA, o.O, A, 0.12); aim(o.gAB, A, B, 0.2);
    o.pA.position.set(A[0], A[1], 0.16); o.pB.position.set(B[0], B[1], 0.17); o.slider.position.set(0, B[1], 0);
    const fl = 0.25 + V.F / 1500 * 0.8; o.F.set([A[0] + 0.06, A[1], 0.2], [fl, 0, 0]); o.lf.visible = V.F > 0; o.lf.position.set(A[0] + fl + 0.2, A[1] + 0.05, 0.2);
    o.la.position.set(A[0] + 0.12, A[1] - 0.25, 0.25); o.lb.position.set(-0.42, B[1], 0.25);
    const v = 2 * o.L * s * st.s[1], k = 0.06; o.vB.set([0.3, B[1], 0.2], [0, v * k, 0]);
    o.lv.visible = v > 1; o.lv.position.set(0.5, B[1] + v * k * 0.6, 0.2);
  }
});

/* ---------- 5.B.6  bar pushing a rolling disk on a horizontal table (clip 'xw-6') ----------
   The 2D picture is a top view, so here its x axis is the 3D x axis and its upward direction is −z.
   The disk (R = 0.2 m) lies flat and rolls without slipping along the rail at z = +R; the bar (L = 1.2 m) turns about the vertical pin O. */
view3d({
  id: 'xw-6', size: 1.25, target: [0.62, 0, 0.05], camera: [-0.25, 0.95, 0.85],
  build(H){
    const T = H.THREE, R = 0.2, d = 0.4, L = 1.2;
    H.floor(-0.35, 1.6, 0.55);
    const rail = H.box(1.4, 0.07, 0.03, H.C.steel); rail.position.set(0.85, 0.035, R + 0.015);
    const post = H.mesh(new T.CylinderGeometry(0.018, 0.018, 0.12, 20), H.C.dark); post.position.set(0, 0.06, 0);
    const base = H.mesh(new T.CylinderGeometry(0.05, 0.05, 0.01, 24), H.C.steel); base.position.set(0, 0.005, 0);
    const disk = grp(H); disk.position.y = 0.027;
    H.mesh(new T.CylinderGeometry(R, R, 0.05, 48), '#d9d4c6', disk);
    const mk = H.box(2 * R * 0.85, 0.004, 0.025, H.C.blue, disk); mk.position.y = 0.026;
    const bar = grp(H); bar.position.y = 0.027;
    const bm = H.box(L, 0.04, 0.02, H.C.wood, bar); bm.position.set(L / 2, 0, -0.012);
    const contact = H.sphere(0.012, H.C.red);
    [d, 2 * d].forEach(x => { const t = H.box(0.006, 0.004, 0.06, '#6b6a66'); t.position.set(x, 0.002, R + 0.08); });
    const t1 = H.label('x = d', '#6b6a66', 0.045), t2 = H.label('x = 2d', '#6b6a66', 0.045); t1.position.set(d, 0.02, R + 0.15); t2.position.set(2 * d, 0.02, R + 0.15);
    const F = H.arrow(H.C.red, 0.6), vC = H.arrow(H.C.blue, 0.6);
    const lo = H.label('O', '#1c1d21', 0.07), lc = H.label('C', '#1c1d21', 0.07), lf = H.label('F', H.C.red, 0.08), lv = H.label('vC', H.C.blue, 0.07);
    lo.position.set(-0.07, 0.08, 0.06);
    return { R, d, L, disk, bar, contact, F, vC, lc, lf, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const x = Math.min(st.s[0], 2 * o.d), xd = st.s[1], phi = Math.asin(o.R / x), c = Math.cos(phi), s = Math.sin(phi);
    o.disk.position.x = x; o.disk.rotation.y = -(x - o.d) / o.R;
    o.bar.rotation.y = phi;
    const lc = Math.sqrt(x * x - o.R * o.R); o.contact.position.set(lc * c, 0.055, -lc * s);
    const E = [o.L * c, 0.03, -o.L * s], fl = 0.08 + st.V.F * 0.008, dir = [s, 0, c];
    o.F.set([E[0] - dir[0] * fl, E[1], E[2] - dir[2] * fl], [dir[0] * fl, 0, dir[2] * fl]); o.lf.position.set(E[0] - dir[0] * (fl + 0.05), 0.04, E[2] - dir[2] * (fl + 0.05));
    o.lc.position.set(x, 0.1, 0); o.vC.set([x, 0.07, 0], [xd * 0.25, 0, 0]);
    o.lv.visible = xd > 0.15; o.lv.position.set(x + xd * 0.25 + 0.05, 0.09, 0);
  }
});

/* ---------- 5.B.7  link OC with a disk on a pin at C (clip 'xw-7') ----------
   O is a pin on the back wall 1.8 m above the floor, OC = 1.2 m, disk radius 0.4 m, G at 0.3 L from O.
   θ is the angle of OC below the horizontal. On a smooth pin the disk keeps its orientation; welded, it turns with the link. */
view3d({
  id: 'xw-7', size: 2.5, target: [0, 1.25, 0], camera: [-0.35, 0.18, 1],
  build(H){
    const O = [0, 1.8], L = 1.2, r = 0.4;
    H.floor(-1.9, 1.9, 0.6);
    const wl = H.box(3.8, 3.2, 0.06, H.C.wall); wl.position.set(0, 1.6, -0.33); wl.castShadow = false;
    const boss = H.box(0.24, 0.24, 0.05, H.C.steel); boss.position.set(0, O[1], -0.28);
    pinAt(H, 0, O[1], -0.12, 0.36, 0.03);
    const link = grp(H); link.position.set(0, O[1], 0);
    H.bar(L, 0.09, '#8a8478', link, 0.04);
    const G = H.sphere(0.03, '#ffffff', link); G.position.set(0.3 * L, 0, 0.03);
    const disk = grp(H);
    H.disk(r, 0.06, '#d9d4c6', disk).position.z = 0.08;
    const mk = H.box(2 * r - 0.08, 0.035, 0.02, H.C.blue, disk); mk.position.z = 0.115;
    const pC = pinAt(H, 0, 0, 0.05, 0.16, 0.025);
    const lo = H.label('O', '#1c1d21', 0.12), lg = H.label('G', '#1c1d21', 0.11), lc = H.label('C', '#1c1d21', 0.12);
    lo.position.set(-0.14, O[1] + 0.14, 0.1);
    const vC = H.arrow(H.C.blue, 1), lv = H.label('vC', H.C.blue, 0.11);
    return { O, L, r, link, disk, pC, lg, lc, vC, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], c = Math.cos(th), s = Math.sin(th), C = [o.O[0] + o.L * c, o.O[1] - o.L * s];
    o.link.rotation.z = -th;
    o.disk.position.set(C[0], C[1], 0); o.disk.rotation.z = st.mode === 'weld' ? -th : 0;
    o.pC.position.set(C[0], C[1], 0.05);
    o.lg.position.set(o.O[0] + 0.3 * o.L * c + 0.12 * s, o.O[1] - 0.3 * o.L * s + 0.12 * c, 0.1);
    o.lc.position.set(C[0] + 0.12, C[1] + 0.12, 0.2);
    const w = st.s[1], k = 0.12, v = [-o.L * w * s * k, -o.L * w * c * k, 0];
    o.vC.set([C[0], C[1], 0.16], v); o.lv.visible = Math.abs(w) > 0.4; o.lv.position.set(C[0] + v[0] * 1.15, C[1] + v[1] * 1.15 + 0.08, 0.2);
  }
});

/* ---------- 5.B.8  garage door with a spring (clip 'xw-8'), lengths in feet ----------
   Corner D is 10.5 ft above the floor. A rolls in the horizontal tracks, B (the mid-point, = G) rolls in the vertical tracks,
   one track and one spring on each side of the 7 ft wide door. A = D − 5 cos θ x̂, B = D − 5 sin θ ŷ. */
view3d({
  id: 'xw-8', size: 11, target: [-1.2, 6, 0], camera: [-0.75, 0.3, 1],
  build(H){
    const D = [0, 10.5], zs = [-3.8, 3.8];
    H.floor(-8, 6, 6.5);
    // building front: jambs and a lintel framing the opening
    [-5.2, 5.2].forEach(z => { const j = H.box(0.4, 11.6, 2.2, H.C.wall); j.position.set(0.2, 5.8, z); });
    const lin = H.box(0.4, 0.8, 12.6, H.C.wall); lin.position.set(0.2, 11.6, 0);
    zs.forEach(z => {
      const ht = H.box(7.4, 0.16, 0.16, H.C.steel); ht.position.set(-3.6, D[1] + 0.14, z);
      const vt = H.box(0.16, 6.4, 0.16, H.C.steel); vt.position.set(0.14, D[1] - 3.1, z);
      const hg = H.box(0.08, 0.9, 0.08, H.C.steel); hg.position.set(-6.5, D[1] + 0.65, z);
    });
    const door = grp(H); H.box(10, 0.16, 7, H.C.wood, door);
    for (let i = 1; i < 4; i++){ const g = H.box(0.06, 0.17, 7, H.C.edge, door); g.position.x = -5 + 2.5 * i; }
    const rollers = [0, 1, 2, 3].map(() => H.disk(0.2, 0.14, H.C.dark));
    const sp = zs.map(() => spring(H, 0.16, 12, 0.03));
    const la = H.label('A', '#1c1d21', 0.9), lb = H.label('B', '#1c1d21', 0.9), lc = H.label('C', '#1c1d21', 0.9), ld = H.label('D', '#6b6a66', 0.8);
    ld.position.set(0.7, D[1] + 0.7, 4.4);
    const vA = H.arrow(H.C.blue, 6), lv = H.label('vA', H.C.blue, 0.75);
    return { D, zs, door, rollers, sp, la, lb, lc, vA, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], c = Math.cos(th), s = Math.sin(th), A = [o.D[0] - 5 * c, o.D[1]], B = [o.D[0], o.D[1] - 5 * s], C = [o.D[0] + 5 * c, o.D[1] - 10 * s];
    o.door.position.set(B[0], B[1], 0); o.door.rotation.z = -th;
    o.zs.forEach((z, i) => { const zz = z - Math.sign(z) * 0.14; o.rollers[2 * i].position.set(A[0], A[1], zz); o.rollers[2 * i + 1].position.set(B[0], B[1], zz);
      o.sp[i].set([o.D[0] + 0.14, o.D[1], z + Math.sign(z) * 0.32], [B[0] + 0.14, B[1], z + Math.sign(z) * 0.32]); });
    o.la.position.set(A[0], A[1] + 0.75, 4.2); o.lb.position.set(B[0] + 0.75, B[1], 4.4); o.lc.position.set(C[0] + 0.6, C[1] - 0.2, 3.9);
    const v = 5 * s * st.s[1], k = 0.35; o.vA.set([A[0], A[1] + 0.35, 3.8], [v * k, 0, 0]);
    o.lv.visible = v > 1; o.lv.position.set(A[0] + v * k * 0.5, A[1] + 0.95, 3.8);
  }
});

/* ---------- 5.B.9  bar on a vertical guide and a quarter-circle guide (clip 'xw-9') ----------
   r = 0.5 m. Arc centre (0, r), B = (r sin φ, r − r cos φ) on the arc, A = (2r, y) on the vertical guide, |AB| = 2r.
   Both guides are fixed to a back plate standing on the floor; everything is lifted 0.4 m. */
view3d({
  id: 'xw-9', size: 1.7, target: [0.5, 1.05, 0], camera: [-0.3, 0.15, 1],
  build(H){
    const r = 0.5, Y0 = 0.4, y1 = r * (1 + Math.sqrt(3)), T = H.THREE;
    H.floor(-0.6, 1.6, 0.45);
    const plate = H.box(1.7, Y0 + 1.75, 0.04, H.C.wall); plate.position.set(0.45, (Y0 + 1.75) / 2, -0.1); plate.castShadow = false;
    const arc = H.ring(r, 0.016, Math.PI / 2, H.C.steel, null, -Math.PI / 2); arc.position.set(0, Y0 + r, -0.045);
    const vg = H.box(0.035, y1 + 0.35, 0.035, H.C.steel); vg.position.set(2 * r, Y0 + y1 / 2, -0.045);
    const ghost = H.mesh(new T.BoxGeometry(2 * r, 0.05, 0.04), '#8a8478', null, { transparent: true, opacity: 0.28 }); ghost.position.set(r, Y0, 0.02); ghost.castShadow = false;
    const lp = H.label('position 2', '#6b6a66', 0.06); lp.position.set(r, Y0 - 0.1, 0.05);
    const bar = grp(H); H.bar(2 * r, 0.05, H.C.wood, bar, 0.04);
    const Gm = H.sphere(0.018, H.C.dark, bar); Gm.position.set(r, 0, 0.025);
    const pA = pinAt(H, 0, 0, -0.01, 0.1), pB = pinAt(H, 0, 0, -0.01, 0.1);
    const la = H.label('A', '#1c1d21', 0.1), lb = H.label('B', '#1c1d21', 0.1);
    const vA = H.arrow(H.C.blue, 0.8), vB = H.arrow(H.C.green, 0.8), lva = H.label('vA', H.C.blue, 0.08), lvb = H.label('vB', H.C.green, 0.08);
    return { r, Y0, bar, pA, pB, la, lb, vA, vB, lva, lvb };
  },
  update(H, st, o){
    if (!st.s) return;
    const r = o.r, Y0 = o.Y0;
    const phiOf = y => { const f = p => (2 * r - r * Math.sin(p)) ** 2 + (y - r + r * Math.cos(p)) ** 2 - 4 * r * r; let lo = 0, hi = Math.PI / 2;
      for (let i = 0; i < 50; i++){ const mid = 0.5 * (lo + hi); if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; } return 0.5 * (lo + hi); };
    const geo = y => { const p = phiOf(y); return { A: [2 * r, y], B: [r * Math.sin(p), r - r * Math.cos(p)] }; };
    const y = Math.max(st.s[0], 0), g = geo(y), A = [g.A[0], g.A[1] + Y0], B = [g.B[0], g.B[1] + Y0];
    aim(o.bar, B, A, 0.02); o.pA.position.set(A[0], A[1], -0.01); o.pB.position.set(B[0], B[1], -0.01);
    o.la.position.set(A[0] + 0.1, A[1] + 0.04, 0.08); o.lb.position.set(B[0] - 0.09, B[1] + 0.07, 0.08);
    const hd = 1e-5, g1 = geo(y + hd), g0 = geo(Math.max(y - hd, 0)), dy = y + hd - Math.max(y - hd, 0), yd = st.s[1], k = 0.07;
    const vB = [(g1.B[0] - g0.B[0]) / dy * yd, (g1.B[1] - g0.B[1]) / dy * yd];
    o.vA.set([A[0] + 0.05, A[1], 0.06], [0, yd * k, 0]); o.vB.set([B[0], B[1], 0.06], [vB[0] * k, vB[1] * k, 0]);
    o.lva.visible = Math.abs(yd) > 0.5; o.lva.position.set(A[0] + 0.14, A[1] + yd * k * 0.6, 0.08);
    o.lvb.visible = Math.hypot(...vB) > 0.5; o.lvb.position.set(B[0] + vB[0] * k * 1.15, B[1] + vB[1] * k * 1.15 - 0.06, 0.08);
  }
});

/* ---------- 5.B.10  wheel pulled up an incline by a band (clip 'xw-10'), lengths in feet ----------
   Incline tan θ = 3/4, wheel radius 0.5 ft, rolling without slipping. The band is fixed at A (3 ft up the slope),
   runs down the slope to the contact point, wraps behind the wheel to its top and leaves parallel to the slope;
   its free end moves twice as far as G. */
view3d({
  id: 'xw-10', size: 3.2, target: [1.45, 1.15, 0], camera: [-0.3, 0.2, 1],
  build(H){
    const T = H.THREE, th = Math.atan(0.75), Lsl = 3.4, cs = Math.cos(th), sn = Math.sin(th), r = 0.5;
    H.floor(-0.6, 3.6, 0.9);
    const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(Lsl * cs, 0); sh.lineTo(Lsl * cs, Lsl * sn); sh.closePath();
    const wg = new T.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }); wg.translate(0, 0, -0.3);
    H.mesh(wg, '#cfc8b6');
    const at = s => [s * cs, s * sn], n = [-sn, cs], A = at(3.0);
    const post = H.box(0.08, 0.42, 0.34, H.C.steel); post.position.set(A[0] + n[0] * 0.21, A[1] + n[1] * 0.21, 0); post.rotation.z = th;
    const wheel = grp(H);
    H.disk(r, 0.3, '#d9d4c6', wheel); H.disk(0.06, 0.34, H.C.dark, wheel);
    const mk = H.box(2 * r - 0.1, 0.05, 0.02, H.C.blue, wheel); mk.position.z = 0.155;
    const band = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.022);
    const F = H.arrow(H.C.red, 2), vG = H.arrow(H.C.blue, 2);
    const la = H.label('A', '#1c1d21', 0.16), lg = H.label('G', '#1c1d21', 0.16), lf = H.label('F', H.C.red, 0.16), lv = H.label('vG', H.C.blue, 0.14);
    la.position.set(A[0] + n[0] * 0.6, A[1] + n[1] * 0.6, 0.2);
    return { th, cs, sn, r, at, n, A, wheel, band, F, vG, lg, lf, lv };
  },
  update(H, st, o){
    if (st.a === undefined) return;
    const tt = st.hold ?? st.t, sx = st.a > 0 ? Math.min(0.5 * st.a * tt * tt, 0.8) : 0, v = st.a > 0 ? st.a * Math.sqrt(2 * sx / st.a) : 0;
    const u = [o.cs, o.sn], n = o.n, r = o.r, C = o.at(0.9 + sx), Gc = [C[0] + r * n[0], C[1] + r * n[1]];
    o.wheel.position.set(Gc[0], Gc[1], 0); o.wheel.rotation.z = -sx / r;
    const rb = r + 0.022, pts = [[o.A[0] + n[0] * 0.022, o.A[1] + n[1] * 0.022, 0]];
    for (let i = 0; i <= 18; i++){ const p = Math.PI * i / 18; pts.push([Gc[0] + rb * (-Math.cos(p) * n[0] - Math.sin(p) * u[0]), Gc[1] + rb * (-Math.cos(p) * n[1] - Math.sin(p) * u[1]), 0]); }
    const top = pts[pts.length - 1], eS = 0.2 + sx, E = [top[0] + eS * u[0], top[1] + eS * u[1], 0]; pts.push(E);
    o.band.set(pts);
    o.F.set(E, [0.55 * u[0], 0.55 * u[1], 0]); o.lf.position.set(E[0] + 0.7 * u[0], E[1] + 0.7 * u[1] + 0.12, 0.1);
    o.lg.position.set(Gc[0] - 0.12, Gc[1] + 0.08, 0.3);
    o.vG.set([Gc[0], Gc[1], 0.2], [v * 0.35 * u[0], v * 0.35 * u[1], 0]); o.lv.visible = v > 0.3; o.lv.position.set(Gc[0] + v * 0.35 * u[0] * 0.6 - 0.1, Gc[1] + v * 0.35 * u[1] * 0.6 + 0.15, 0.3);
  }
});

})();
