/* 3D views for the Chapter 4 work–energy examples 4.B.1 – 4.B.8.
   Each view reads the live state of the 2D clip with the same id (x4b-1 … x4b-8 in ch4-exB.js),
   so the physics is computed once. Here only positions are derived from the clip's coordinates.
   Lengths are in metres, except 4.B.4, which is drawn in feet like the problem. */
(function(){

/* ---------- local helpers ---------- */
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
const grp = (H, parent) => { const g = new H.THREE.Group(); H.add(g, parent); return g; };
// prism from a 2D outline (x–y) extruded along z and centred in z
function prism(H, pts, depth, color, parent){
  const T = H.THREE, s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return H.mesh(g, color, parent);
}
const G = 9.81;

/* ---------- 4.B.1  rod with particle P turned by a normal force (clip 'x4b-1') ----------
   Pin O 1.5 m above the floor on a post behind the rod; P at 0.6L = 1.2 m on one side, F at 0.4L = 0.8 m on the other. */
view3d({
  id: 'x4b-1', size: 2.4, target: [0, 1.15, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const O = [0, 1.5];
    H.floor(-1.8, 1.4, 0.6);
    const post = H.box(0.1, O[1], 0.1, H.C.steel); post.position.set(0, O[1] / 2, -0.16);
    const base = H.box(0.32, 0.04, 0.3, H.C.steel); base.position.set(0, 0.02, -0.16);
    H.disk(0.03, 0.3, H.C.dark).position.set(O[0], O[1], -0.06);
    const arm = grp(H); arm.position.set(O[0], O[1], 0);
    const rod = H.bar(2.0, 0.035, H.C.body, arm, 0.035); rod.position.x = -1.2;
    const P = H.sphere(0.09, H.C.ball, arm); P.position.x = -1.2;
    const fA = H.arrow(H.C.blue, 1.2), vA = H.arrow(H.C.green, 1.2);
    const lO = H.label('O'), lP = H.label('P'), lF = H.label('F', H.C.blue), lv = H.label('v_P', H.C.green);
    lO.position.set(-0.12, O[1] + 0.16, 0.1);
    return { O, arm, fA, vA, lP, lF, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], c = Math.cos(th), s = Math.sin(th), O = o.O;
    o.arm.rotation.z = th;
    const E = [O[0] + 0.8 * c, O[1] + 0.8 * s], P = [O[0] - 1.2 * c, O[1] - 1.2 * s], n = [-s, c];
    const fl = 0.006 * st.V.F;
    o.fA.set([E[0] - fl * n[0], E[1] - fl * n[1], 0], [fl * n[0], fl * n[1], 0]);
    o.lF.position.set(E[0] - fl * n[0] + 0.1, E[1] - fl * n[1], 0.05); o.lF.visible = fl > 0.02;
    const v = 1.2 * st.s[1], vl = Math.min(0.9, 0.09 * v);
    o.vA.set([P[0], P[1], 0], [vl * s, -vl * c, 0]);
    o.lv.position.set(P[0] + vl * s + 0.12, P[1] - vl * c - 0.08, 0.05); o.lv.visible = vl > 0.05;
    o.lP.position.set(P[0] - 0.18, P[1] + 0.1, 0.1);
  }
});

/* ---------- 4.B.2  block on a rough incline sliding into a spring (clip 'x4b-2') ----------
   Incline at 53.13°; the spring stop is fixed and the block starts d + ℓ0 up the slope from it. */
view3d({
  id: 'x4b-2', size: 1.8, target: [0.45, 0.7, 0], camera: [0.35, 0.25, 1],
  build(H){
    const sn = 0.8, cs = 0.6, Ls = 2.0, stop = [1.2, 0.0 + 0.0];
    // slope surface runs from the top point down to the stop; the wedge is under it
    const top = [stop[0] - Ls * cs, stop[1] + Ls * sn];
    H.floor(-0.9, 1.7, 0.55);
    prism(H, [[top[0], 0], [stop[0], 0], [top[0], top[1]]], 0.6, '#e2dccb');
    const plate = H.box(0.04, 0.3, 0.4, H.C.dark); plate.rotation.z = -Math.atan2(sn, cs);
    const blk = H.box(0.24, 0.16, 0.24, H.C.body); blk.rotation.z = -Math.atan2(sn, cs);
    const sp = spring(H, 0.045, 7, 0.008); const cap = H.box(0.02, 0.14, 0.14, H.C.dark); cap.rotation.z = -Math.atan2(sn, cs);
    const mark = H.box(0.01, 0.2, 0.62, H.C.green); mark.rotation.z = -Math.atan2(sn, cs);
    const lb = H.label('m'), lk = H.label('k');
    return { sn, cs, stop, blk, sp, cap, mark, lb, lk, plate };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    const V = st.V, l0 = 0.6, sn = o.sn, cs = o.cs, u = [cs, -sn], nrm = [sn, cs];        // u: down the slope, nrm: out of the slope
    const S = s => [o.stop[0] - (V.d + l0 - s) * cs, o.stop[1] + (V.d + l0 - s) * sn];   // slope point at distance s from the start
    const c = Math.max(0, st.x - V.d), f = S(st.x), h = 0.08;
    o.plate.position.set(o.stop[0] + 0.15 * nrm[0], o.stop[1] + 0.15 * nrm[1], 0);
    o.blk.position.set(f[0] - 0.12 * u[0] + h * nrm[0], f[1] - 0.12 * u[1] + h * nrm[1], 0);
    const q = S(V.d + c), st0 = o.stop;
    o.sp.set([st0[0] + 0.08 * nrm[0], st0[1] + 0.08 * nrm[1], 0], [q[0] + 0.08 * nrm[0], q[1] + 0.08 * nrm[1], 0]);
    o.cap.position.set(q[0] + 0.08 * nrm[0] + 0.011 * u[0], q[1] + 0.08 * nrm[1] + 0.011 * u[1], 0);   // the cap sits on the spring side of the contact, touching the block's lower face
    const Fd = 5 * G * (sn - V.mu * cs), dp = Fd > 0 ? (Fd + Math.sqrt(Fd * Fd + 2 * V.k * Fd * V.d)) / V.k : 0, g = S(V.d + dp);
    o.mark.visible = Fd > 0; o.mark.position.set(g[0] + 0.1 * nrm[0], g[1] + 0.1 * nrm[1], 0);
    o.lb.position.set(f[0] - 0.12 * u[0] + 0.25 * nrm[0], f[1] - 0.12 * u[1] + 0.25 * nrm[1], 0.15);
    o.lk.position.set((st0[0] + q[0]) / 2 + 0.2 * nrm[0], (st0[1] + q[1]) / 2 + 0.2 * nrm[1], 0.1);
  }
});

/* ---------- 4.B.3  particle launched vertically (clip 'x4b-3') ---------- */
view3d({
  id: 'x4b-3', size: 4.2, target: [0, 2.8, 0], camera: [-0.4, 0.15, 1],
  build(H){
    H.floor(-1.4, 1.4, 1.0);
    const tube = H.mesh(new H.THREE.CylinderGeometry(0.16, 0.2, 0.35, 32), H.C.steel); tube.position.set(0, 0.175, 0);
    const pole = H.box(0.05, 12, 0.05, '#c9c3b5'); pole.position.set(-0.7, 6, -0.3);
    for (let k = 1; k <= 12; k++){ const t = H.box(0.16, 0.02, 0.02, H.C.dark); t.position.set(-0.64, 0.47 + k, -0.3); }
    const labs = []; [1, 2, 3, 4, 5, 6, 8, 10, 12].forEach(k => { const l = H.label(k + ' m', '#5b5a55', 0.17); l.position.set(-1.0, 0.47 + k, -0.3); l.userData.k = k; labs.push(l); });
    const ball = H.sphere(0.12, H.C.ball);
    const hp = H.mesh(new H.THREE.PlaneGeometry(1.4, 0.9), H.C.green, null, { transparent: true, opacity: 0.18, side: H.THREE.DoubleSide }); hp.rotation.x = -Math.PI / 2;
    const ring = H.ring(0.45, 0.012, 2 * Math.PI, H.C.green); ring.rotation.x = Math.PI / 2;
    const vA = H.arrow(H.C.green, 1.4), lh = H.label('h', H.C.green), lv = H.label('v', H.C.green);
    return { ball, hp, ring, vA, lh, lv, labs };
  },
  update(H, st, o){
    if (st.y === undefined) return;
    const h = st.V.v0 * st.V.v0 / (2 * G), y = 0.47 + st.y;
    const top = h * 1.15 + 0.5; o.labs.forEach(l => { l.visible = l.userData.k <= Math.max(2, top) && (l.userData.k <= 6 || l.userData.k % 2 === 0) && (top < 7 || l.userData.k % 2 === 0); });
    o.ball.position.set(0, y, 0); o.hp.position.set(0, 0.47 + h, 0); o.ring.position.set(0, 0.47 + h, 0); o.lh.position.set(0.62, 0.47 + h, 0.1);
    const vl = Math.max(-1.5, Math.min(1.5, 0.12 * st.v)); o.vA.set([0.3, y, 0], [0, vl, 0]);
    o.lv.position.set(0.48, y + vl / 2, 0.05); o.lv.visible = Math.abs(vl) > 0.08;
  }
});

/* ---------- 4.B.4  block with a bumper spring hits a wall (clip 'x4b-4'), drawn in feet ---------- */
view3d({
  id: 'x4b-4', size: 6.5, target: [-2.6, 1.2, 0], camera: [-0.3, 0.3, 1],
  build(H){
    H.floor(-9, 1.5, 3); H.wall(0, 0, 4.5, 3);
    const car = grp(H);
    const body = H.box(4, 2, 2.6, H.C.body, car); body.position.set(-2, 1.4, 0);
    [[-3.2, 1.05], [-0.8, 1.05], [-3.2, -1.05], [-0.8, -1.05]].forEach(([x, z]) => { const w = H.disk(0.3, 0.18, H.C.dark, car); w.position.set(x, 0.3, z * 1.343); /* beside the body (half-depth 1.3) */ });
    const sp = spring(H, 0.2, 7, 0.035); const cap = H.box(0.08, 0.9, 0.9, H.C.dark);
    const vA = H.arrow(H.C.green, 3), fA = H.arrow(H.C.blue, 3), lc = H.label('C', '#1c1d21', 0.5), lk = H.label('k', '#1c1d21', 0.45), lv = H.label('v', H.C.green, 0.45), lf = H.label('kδ', H.C.blue, 0.45);
    return { car, sp, cap, vA, fA, lc, lk, lv, lf };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    const l0 = 1.5, c = Math.max(0, st.x), end = Math.min(st.x, 0), front = end - (l0 - c);
    o.car.position.x = front; o.sp.set([front, 1.4, 0], [end - 0.14, 1.4, 0]); o.cap.position.set(end - 0.10, 1.4, 0);   // mounting plate bolted to the wall face (x = −0.06)
    o.lc.position.set(front - 3.6, 2.7, 1.4); o.lk.position.set((front + end) / 2, 2.15, 0.5);
    const vl = Math.max(-2.5, Math.min(2.5, 0.18 * st.v)); o.vA.set([front - 2, 3.0, 0], [vl, 0, 0]); o.lv.position.set(front - 2 + vl + Math.sign(vl) * 0.4, 3.2, 0); o.lv.visible = Math.abs(vl) > 0.1;
    const fl = Math.min(3, st.V.k * c / 8000); o.fA.set([0, 0.6, 1.0], [-fl, 0, 0]); o.lf.position.set(-fl - 0.5, 0.6, 1.0); o.lf.visible = fl > 0.05;
  }
});

/* ---------- 4.B.5  slider on a curved rod pulled by a cord (clip 'x4b-5') ----------
   Circular arc through position 1 (0, 0), position 2 (1.2, 0.7) and the right foot (2.4, 0); guide tip at (1.5, 0.3). */
view3d({
  id: 'x4b-5', size: 2.2, target: [1.2, 0.35, 0], camera: [-0.2, 0.35, 1],
  build(H){
    const yc = (0.49 - 1.44) / 1.4, R = 0.7 - yc, xc = 1.2, ps1 = Math.atan2(-yc, -1.2), TIP = [1.5, 0.3];
    H.floor(-0.4, 2.8, 0.5, -0.06);
    const arc = H.ring(R, 0.018, 2 * ps1 - Math.PI, H.C.dark, null, Math.PI - ps1); arc.position.set(xc, yc, 0);
    [0, 2.4].forEach(x => { const f = H.box(0.16, 0.06, 0.16, H.C.steel); f.position.set(x, -0.03, 0); });
    const post = H.mesh(new H.THREE.CylinderGeometry(0.012, 0.05, 0.36, 16), '#bdb6a3'); post.position.set(TIP[0], TIP[1] - 0.18, 0);
    const sl = H.box(0.11, 0.06, 0.08, H.C.body);
    const cord = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.005), wt = H.box(0.08, 0.1, 0.08, '#cfd8ea');
    const fA = H.arrow(H.C.red, 0.7), vA = H.arrow(H.C.green, 0.8);
    const l1 = H.label('1', '#5b5a55', 0.12), l2 = H.label('2', '#5b5a55', 0.12), lP = H.label('P'), lF = H.label('F', H.C.red);
    l1.position.set(-0.1, 0.12, 0.1); l2.position.set(1.2, 0.85, 0.05);
    return { yc, R, xc, TIP, sl, cord, wt, fA, vA, lP, lF, l1x: Math.hypot(TIP[0], TIP[1]) };
  },
  update(H, st, o){
    if (st.p === undefined) return;
    const p = st.p, x = o.xc + o.R * Math.cos(p), y = o.yc + o.R * Math.sin(p), tx = -Math.sin(p), ty = Math.cos(p);
    o.sl.position.set(x, y, 0); o.sl.rotation.z = Math.atan2(-ty, -tx);
    const take = o.l1x - Math.hypot(o.TIP[0] - x, o.TIP[1] - y), endY = o.TIP[1] - 0.18 - take * 0.3;
    o.cord.set([[x, y, 0], [o.TIP[0], o.TIP[1] + 0.01, 0], [o.TIP[0] + 0.02, o.TIP[1] - 0.02, 0], [o.TIP[0] + 0.02, endY, 0]]);
    o.wt.visible = false;
    const fl = 0.012 * st.V.F; o.fA.set([o.TIP[0] + 0.02, endY, 0], [0, -fl, 0]); o.lF.position.set(o.TIP[0] + 0.14, endY - fl / 2, 0.05); o.lF.visible = fl > 0.02;
    const v = o.R * Math.abs(st.pd), vl = Math.min(0.6, 0.07 * v); o.vA.set([x, y, 0], [vl * Math.sin(p), -vl * Math.cos(p), 0]);
    o.lP.position.set(x - 0.1 * tx + 0.12 * Math.cos(p), y - 0.1 * ty + 0.12 * Math.sin(p) + 0.04, 0.1);
  }
});

/* ---------- 4.B.6  falling particle E turns pulley O with two welded bars (clip 'x4b-6') ----------
   Pulleys C and O hang from the ceiling, 1.05 m apart; r = 0.1 m; OA = 2L = 1.0 m, OB = L = 0.5 m. */
view3d({
  id: 'x4b-6', size: 2.4, target: [0.0, 1.5, 0], camera: [-0.3, 0.2, 1],
  build(H){
    const O = [0, 2.2], C = [-1.05, 2.2], r = 0.1;
    H.floor(-1.8, 1.6, 0.6); H.ceiling(-1.8, 1.6, 2.55, 0.35);
    [C, O].forEach(p => { H.pinSupport(p[0], p[1], 0.35, 'down', -0.1); });
    const pc = H.disk(r, 0.05, H.C.steel); pc.position.set(C[0], C[1], 0);
    const rot = grp(H); rot.position.set(O[0], O[1], 0);
    H.disk(r, 0.05, H.C.steel, rot); const mk = H.box(0.012, r * 0.9, 0.055, H.C.orange, rot); mk.position.set(0, r * 0.45, 0);
    // OA points straight down at θ = 0, OB points to the left
    const a = H.bar(1.0, 0.03, H.C.body, rot, 0.03); a.rotation.z = -Math.PI / 2; a.position.z = 0.05;
    const b = H.bar(0.5, 0.03, H.C.body, rot, 0.03); b.rotation.z = Math.PI; b.position.z = 0.05;
    const A = H.sphere(0.06, H.C.ball, rot); A.position.set(0, -1.0, 0.05);
    const B = H.sphere(0.075, H.C.ball, rot); B.position.set(-0.5, 0, 0.05);
    const E = H.box(0.2, 0.16, 0.2, '#cfd8ea');
    const cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.006);
    const lA = H.label('A'), lB = H.label('B'), lE = H.label('E'), lO = H.label('O'), lC = H.label('C');
    lO.position.set(O[0] + 0.16, O[1] + 0.12, 0.1); lC.position.set(C[0] + 0.16, C[1] - 0.12, 0.1);
    return { O, C, r, rot, E, cab, lA, lB, lE };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], s = Math.sin(th), c = Math.cos(th), O = o.O, C = o.C, r = o.r;
    o.rot.rotation.z = th;
    const yE = C[1] - 0.95 - r * th;
    o.E.position.set(C[0] - r, yE, 0);
    const pts = [[O[0], O[1] + r, 0]]; for (let k = 0; k <= 8; k++){ const a = Math.PI / 2 + k * Math.PI / 16; pts.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a), 0]); } pts.push([C[0] - r, yE + 0.08, 0]);
    o.cab.set(pts);
    o.lA.position.set(O[0] + 1.0 * s + 0.14, O[1] - 1.0 * c, 0.1); o.lB.position.set(O[0] - 0.5 * c - 0.05, O[1] - 0.5 * s - 0.16, 0.1); o.lE.position.set(C[0] - r - 0.22, yE, 0.1);
  }
});

/* ---------- 4.B.7  bar AB launched by two springs under A (clip 'x4b-7') ----------
   O on a post 0.25 m above the floor; OA = 2L = 0.2 m, OB = L = 0.1 m; θ is measured below the horizontal for A. */
view3d({
  id: 'x4b-7', size: 0.55, target: [0.06, 0.25, 0], camera: [-0.3, 0.25, 1],
  build(H){
    const O = [0, 0.27], L = 0.1;
    H.floor(-0.3, 0.42, 0.18);
    const post = H.box(0.025, O[1], 0.025, H.C.steel); post.position.set(0, O[1] / 2, -0.04);
    H.disk(0.008, 0.07, H.C.dark).position.set(0, O[1], -0.015);
    const arm = grp(H); arm.position.set(O[0], O[1], 0);
    const bar = H.bar(3 * L, 0.012, H.C.body, arm, 0.012); bar.position.x = -L;
    const A = H.sphere(0.018, H.C.ball, arm); A.position.x = 2 * L;
    const B = H.sphere(0.022, H.C.ball, arm); B.position.x = -L;
    const plat = H.box(0.12, 0.008, 0.08, H.C.dark);
    const s1 = spring(H, 0.012, 6, 0.0025), s2 = spring(H, 0.012, 6, 0.0025);
    const ghost = H.sphere(0.018, '#ffffff'); ghost.material.transparent = true; ghost.material.opacity = 0.25; ghost.position.set(0, O[1] + 2 * L, 0);
    const lA = H.label('A', '#1c1d21', 0.035), lB = H.label('B', '#1c1d21', 0.035), lO = H.label('O', '#1c1d21', 0.035);
    lO.position.set(-0.025, O[1] + 0.025, 0.03);
    return { O, L, arm, plat, s1, s2, lA, lB };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], c = Math.cos(th), s = Math.sin(th), O = o.O, L = o.L;
    o.arm.rotation.z = -th;
    const pl = Math.max(0, 2 * L * Math.sin(Math.max(th, 0))), py = O[1] - 0.018 - pl, px = O[0] + 0.19;
    o.plat.position.set(px, py - 0.004, 0);
    o.s1.set([px, 0, -0.025], [px, py - 0.008, -0.025]); o.s2.set([px, 0, 0.025], [px, py - 0.008, 0.025]);
    o.lA.position.set(O[0] + 2 * L * c + 0.03, O[1] - 2 * L * s + 0.02, 0.03); o.lB.position.set(O[0] - L * c - 0.03, O[1] + L * s + 0.02, 0.03);
  }
});

/* ---------- 4.B.8  block driven up a smooth slot against a spring (clip 'x4b-8') ----------
   O at (0, 0.03) on a small base; position 1 = O + 0.15 (−0.8, 0.6); the slot runs along (0.6, 0.8). */
view3d({
  id: 'x4b-8', size: 0.55, target: [-0.03, 0.18, 0], camera: [-0.3, 0.2, 1],
  build(H){
    const O = [0, 0.03], h0 = 0.15, u = [0.6, 0.8], n = [-0.8, 0.6], P1 = [O[0] + h0 * n[0], O[1] + h0 * n[1]];
    H.floor(-0.4, 0.3, 0.18);
    const base = H.box(0.06, 0.03, 0.06, H.C.steel); base.position.set(O[0], 0.015, 0);
    H.disk(0.006, 0.05, H.C.dark).position.set(O[0], O[1], 0);
    // slot: two rails along u, held by a back plate standing on the floor
    const ang = Math.atan2(u[1], u[0]), gap = 0.032, a = [P1[0] - 0.12 * u[0], P1[1] - 0.12 * u[1]];
    [-1, 1].forEach(sg => { const r = H.bar(0.44, 0.008, H.C.dark, null, 0.06); r.position.set(a[0] + sg * gap * n[0], a[1] + sg * gap * n[1], 0); r.rotation.z = ang; });
    const back = H.box(0.5, 0.42, 0.01, '#d8d2c2'); back.position.set(-0.08, 0.21, -0.045);
    const stop = H.box(0.012, 0.072, 0.06, H.C.dark); stop.position.set(P1[0] - 0.047 * u[0], P1[1] - 0.047 * u[1], 0); stop.rotation.z = ang;
    const blk = H.box(0.07, 0.05, 0.05, H.C.body); blk.rotation.z = ang;
    const sp = spring(H, 0.008, 9, 0.0018);
    const ghost = H.box(0.07, 0.05, 0.05, '#ffffff'); ghost.material.transparent = true; ghost.material.opacity = 0.25; ghost.rotation.z = ang; ghost.position.set(P1[0] + 0.2 * u[0], P1[1] + 0.2 * u[1], 0);
    const fA = H.arrow(H.C.red, 0.3), lF = H.label('F', H.C.red, 0.035), lA = H.label('A', '#1c1d21', 0.035), lO = H.label('O', '#1c1d21', 0.035), l2 = H.label('2', '#5b5a55', 0.03);
    lO.position.set(O[0] + 0.03, O[1] - 0.015, 0.04); l2.position.set(P1[0] + 0.2 * u[0] + 0.05, P1[1] + 0.2 * u[1] + 0.03, 0.03);
    return { O, P1, u, blk, sp, fA, lF, lA };
  },
  update(H, st, o){
    if (!st.s) return;
    const s = st.s[0], p = [o.P1[0] + s * o.u[0], o.P1[1] + s * o.u[1]];
    o.blk.position.set(p[0], p[1], 0); o.sp.set([o.O[0], o.O[1], 0], [p[0], p[1], 0]);
    const fl = 0.0003 * st.V.F; o.fA.set([p[0] - 0.045 - fl, p[1], 0], [fl, 0, 0]); o.lF.position.set(p[0] - 0.06 - fl, p[1] + 0.015, 0.03); o.lF.visible = fl > 0.005;
    o.lA.position.set(p[0] - 0.03, p[1] + 0.05, 0.04);
  }
});

})();
