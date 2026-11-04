/* 3D views for the Chapter 2 instant-center examples 2.B.1 – 2.B.8.
   Each view reads st.g, the geometry that the 2D clip with the same id computes every frame (metres, y up),
   so the two views always show the same configuration. The picture plane is x–y; z points out of the screen. */
(function(){

const VIO = '#8a3fd1';
// a box of unit length along x (from 0 to 1); place(m, P, Q) stretches it from P to Q
function unitBar(H, thick, color, depth, parent){ return H.bar(1, thick, color, parent, depth); }
function place(m, P, Q, z = 0){ const dx = Q[0] - P[0], dy = Q[1] - P[1]; m.position.set(P[0], P[1], z); m.rotation.z = Math.atan2(dy, dx); m.scale.x = Math.max(1e-4, Math.hypot(dx, dy)); }
// the instant center: a violet sphere with a label, and thin violet construction lines to chosen points
function icMarker(H, text = 'IC'){ const s = H.sphere(0.022, VIO); s.material.emissive = new H.THREE.Color(VIO); s.material.emissiveIntensity = 0.35; const l = H.label(text, VIO, 0.11); return { s, l }; }
function setIC(ic, P, dx = 0.07, dy = 0.07, z = 0){ const ok = P && isFinite(P[0]) && Math.abs(P[0]) < 50; ic.s.visible = ic.l.visible = !!ok; if (!ok) return; ic.s.position.set(P[0], P[1], z); ic.l.position.set(P[0] + dx, P[1] + dy, z); }
function thinLine(H){ return H.cable([[0, 0, 0], [0, 0.01, 0]], VIO, 0.0035); }
function pinAxle(H, r, len, color){ return H.disk(r, len, color || H.C.dark); }
const V = (k, v) => [v[0] * k, v[1] * k, 0];

/* ---------- 2.B.1  four-bar O–A–B–D (L = 1 m) ---------- */
view3d({
  id: 'x2b-1', size: 2.6, target: [0.85, -0.45, 0], camera: [-0.35, 0.3, 1],
  build(H){
    const D = [1.75, 0];
    H.floor(-0.8, 2.7, 0.5, -1.65);
    const back = H.box(3.3, 2.45, 0.04, H.C.wall); back.position.set(0.95, -0.42, -0.24);   // wall that carries both pin brackets
    [[0, 0], D].forEach(p => { const br = H.box(0.12, 0.12, 0.2, H.C.steel); br.position.set(p[0], p[1], -0.13); pinAxle(H, 0.022, 0.42).position.set(p[0], p[1], 0); });
    const OA = unitBar(H, 0.07, H.C.body, 0.05), AB = unitBar(H, 0.07, '#d9c58c', 0.05), DB = unitBar(H, 0.07, H.C.body, 0.05);
    const pA = pinAxle(H, 0.02, 0.24), pB = pinAxle(H, 0.02, 0.24);
    const labs = ['O', 'A', 'B', 'D'].map(t => H.label(t)); labs[0].position.set(-0.12, 0.12, 0.1); labs[3].position.set(D[0] + 0.12, 0.12, 0.1);
    const ic = icMarker(H, 'IC_AB'), l1 = thinLine(H), l2 = thinLine(H);
    const aA = H.arrow(H.C.blue, 1), aB = H.arrow(H.C.green, 1), lvA = H.label('v_A', H.C.blue, 0.12), lvB = H.label('v_B', H.C.green, 0.12);
    return { D, OA, AB, DB, pA, pB, labs, ic, l1, l2, aA, aB, lvA, lvB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    place(o.OA, [0, 0], g.A, 0.07); place(o.AB, g.A, g.B, 0); place(o.DB, o.D, g.B, 0.07);
    o.pA.position.set(g.A[0], g.A[1], 0.03); o.pB.position.set(g.B[0], g.B[1], 0.03);
    o.labs[1].position.set(g.A[0] - 0.1, g.A[1] + 0.12, 0.1); o.labs[2].position.set(g.B[0] - 0.12, g.B[1] - 0.12, 0.1);
    const near = g.IC && Math.hypot(g.IC[0] - 0.9, g.IC[1] + 0.4) < 2.2; setIC(o.ic, near ? g.IC : null, 0.12, -0.1, 0.1);
    o.l1.group.visible = o.l2.group.visible = !!near;
    if (near){ o.l1.set([[0, 0, 0.1], [g.IC[0], g.IC[1], 0.1]]); o.l2.set([[o.D[0], o.D[1], 0.1], [g.IC[0], g.IC[1], 0.1]]); }
    const k = 0.14; o.aA.set([g.A[0], g.A[1], 0.1], V(k, g.vA)); o.aB.set([g.B[0], g.B[1], 0.1], V(k, g.vB));
    o.lvA.position.set(g.A[0] + g.vA[0] * k * 1.15 + 0.06, g.A[1] + g.vA[1] * k * 1.15, 0.1); o.lvB.position.set(g.B[0] + g.vB[0] * k * 1.15, g.B[1] + g.vB[1] * k * 1.15 - 0.06, 0.1);
    o.lvA.visible = Math.hypot(...g.vA) > 0.3; o.lvB.visible = Math.hypot(...g.vB) > 0.3;
  }
});

/* ---------- 2.B.2  pulley climbing a fixed cable ---------- */
view3d({
  id: 'x2b-2', size: 1.45, target: [0, 0.05, 0], camera: [-0.4, 0.2, 1],
  build(H){
    const R = 0.3048, r = 0.1524, top = 0.95;
    H.ceiling(-0.8, 0.8, top, 0.3);
    const anchor = H.box(0.06, 0.05, 0.06, H.C.steel); anchor.position.set(-R, top - 0.025, -0.03);
    const pul = new H.THREE.Group(); H.add(pul);
    H.disk(R, 0.04, H.C.body, pul).position.z = -0.03; H.disk(r, 0.1, '#d9c58c', pul).position.z = 0.02;
    H.disk(R * 0.98, 0.012, H.C.edge, pul).position.z = -0.056;
    const mark = H.box(R - r, 0.02, 0.045, H.C.orange, pul); mark.position.set((R + r) / 2, 0, -0.03);
    H.disk(0.018, 0.16, H.C.dark, pul);
    const cL = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.006), cR = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.006);
    const B = H.sphere(0.018, H.C.orange), lB = H.label('B'), lO = H.label('O'), lA = H.label('A');
    const ic = icMarker(H, 'C = IC'), aB = H.arrow(H.C.blue, 0.6), aO = H.arrow(H.C.green, 0.6), aA = H.arrow(H.C.red, 0.6);
    return { R, r, top, pul, cL, cR, B, lB, lO, lA, ic, aB, aO, aA };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const y = g.O[1], wv = st.V.vA / (o.R + o.r), k = 0.06;
    o.pul.position.set(0, y, 0); o.pul.rotation.z = g.th;
    o.cL.set([[-o.R, o.top - 0.05, -0.03], [-o.R, y, -0.03]]); o.cR.set([[o.r, y, 0.04], [o.r, o.top - 0.12, 0.04]]);
    o.B.position.set(g.B[0], g.B[1], -0.005); o.lB.position.set(g.B[0] - 0.07, g.B[1] + 0.07, 0.05);
    o.lO.position.set(0.07, y - 0.07, 0.1); o.lA.position.set(o.r + 0.07, o.top - 0.25, 0.06);
    setIC(o.ic, [-o.R, y], -0.12, -0.08, -0.03);
    const vB = [-wv * (g.B[1] - y), wv * (g.B[0] + o.R)];
    o.aB.set([g.B[0], g.B[1], 0.0], V(k, vB)); o.aO.set([0, y, 0.1], [0, wv * o.R * k, 0]); o.aA.set([o.r + 0.05, o.top - 0.42, 0.04], [0, st.V.vA * k, 0]);
  }
});

/* ---------- 2.B.3  spool rolling on its rims ---------- */
view3d({
  id: 'x2b-3', size: 3.4, target: [0.9, 0.6, 0], camera: [-0.55, 0.45, 0.8],
  build(H){
    const R = 0.9, r = 0.3;
    H.floor(-3, 4.4, 0.8);
    const spool = new H.THREE.Group(); H.add(spool);
    [-0.22, 0.22].forEach(z => { H.disk(R, 0.07, H.C.body, spool).position.z = z; });
    H.disk(r, 0.38, '#d9c58c', spool); H.disk(0.04, 0.6, H.C.dark, spool);
    const mk = H.box(0.05, R - r - 0.03, 0.075, H.C.orange, spool); mk.position.set(0, (R + r) / 2, 0.22);
    const cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.012);
    const A = H.sphere(0.05, H.C.red), lA = H.label('A'), lO = H.label('O');
    const ic = icMarker(H, 'C = IC'), aO = H.arrow(H.C.green, 1.4), aA = H.arrow(H.C.red, 1.4), aT = H.arrow(H.C.blue, 1.4);
    return { R, r, spool, cab, A, lA, lO, ic, aO, aA, aT };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const wv = st.V.vA / (g.top ? o.R + o.r : o.R - o.r), k = 0.45;
    o.spool.position.set(g.xO, o.R, 0); o.spool.rotation.z = -g.th;
    o.cab.set([[g.xO, g.yc, 0], [g.xA, g.yc, 0]]); o.A.position.set(g.xA, g.yc, 0); o.lA.position.set(g.xA, g.yc + 0.2, 0);
    o.lO.position.set(g.xO - 0.15, o.R + 0.15, 0.3);
    setIC(o.ic, [g.xO, 0], -0.25, -0.12, 0.3);
    o.aO.set([g.xO, o.R, 0.32], [wv * o.R * k, 0, 0]); o.aT.set([g.xO, 2 * o.R, 0.25], [2 * wv * o.R * k, 0, 0]); o.aA.set([g.xA + 0.06, g.yc, 0], [st.V.vA * k, 0, 0]);
  }
});

/* ---------- 2.B.4  link sliding on a wall and a floor ---------- */
view3d({
  id: 'x2b-4', size: 0.8, target: [0.22, 0.22, 0], camera: [0.35, 0.3, 1],
  build(H){
    H.floor(-0.05, 0.75, 0.25); H.wall(0, 0, 0.6, 0.25);
    const bar = unitBar(H, 0.03, H.C.body, 0.03), rA = H.disk(0.015, 0.05, H.C.steel), rB = H.disk(0.015, 0.05, H.C.steel);
    const lA = H.label('A'), lB = H.label('B'), ic = icMarker(H, 'IC_AB'), l1 = thinLine(H), l2 = thinLine(H);
    const aA = H.arrow(H.C.green, 0.45), aB = H.arrow(H.C.blue, 0.45);
    return { bar, rA, rB, lA, lB, ic, l1, l2, aA, aB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const A = [0.015, g.yA], B = [g.xB, 0.015], k = 0.025, w = 3 / g.yA;
    place(o.bar, A, B, 0); o.rA.position.set(A[0], A[1], 0); o.rB.position.set(B[0], B[1], 0);
    o.lA.position.set(0.06, g.yA + 0.05, 0.05); o.lB.position.set(g.xB + 0.05, 0.06, 0.05);
    setIC(o.ic, g.IC, 0.07, 0.04, 0); o.l1.set([[A[0], A[1], 0], [g.IC[0], g.IC[1], 0]]); o.l2.set([[B[0], B[1], 0], [g.IC[0], g.IC[1], 0]]);
    o.aB.set([B[0], B[1], 0.04], [3 * k, 0, 0]); o.aA.set([A[0], A[1], 0.04], [0, -w * g.xB * k, 0]);
  }
});

/* ---------- 2.B.5  hydraulic cylinder, links AB and OB ---------- */
view3d({
  id: 'x2b-5', size: 0.95, target: [0.1, -0.38, 0], camera: [-0.3, 0.25, 1],
  build(H){
    H.floor(-0.5, 0.8, 0.35, -0.9);
    const wallO = H.box(0.04, 0.3, 0.3, H.C.wall); wallO.position.set(-0.1, 0, -0.02);
    const br = H.box(0.1, 0.05, 0.08, H.C.steel); br.position.set(-0.05, 0, -0.05); pinAxle(H, 0.012, 0.16).position.set(0, 0, 0);
    const cyl = H.mesh(new H.THREE.CylinderGeometry(0.035, 0.035, 0.18, 24), '#b9bcc4'); cyl.position.set(0, -0.81, 0);
    const rod = H.mesh(new H.THREE.CylinderGeometry(0.012, 0.012, 1, 16), H.C.steel);
    const OB = unitBar(H, 0.03, H.C.body, 0.025), AB = unitBar(H, 0.03, '#d9c58c', 0.025), pA = pinAxle(H, 0.01, 0.1), pB = pinAxle(H, 0.01, 0.1);
    const labs = ['O', 'A', 'B', 'C'].map(t => H.label(t)); labs[0].position.set(0.06, 0.06, 0.05); labs[3].position.set(0.08, -0.8, 0.05);
    const ic = icMarker(H, 'IC_AB'), l1 = thinLine(H), l2 = thinLine(H), aA = H.arrow(H.C.red, 0.5);
    return { cyl, rod, OB, AB, pA, pB, labs, ic, l1, l2, aA };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    place(o.OB, [0, 0], g.B, 0.025); place(o.AB, g.A, g.B, -0.025);
    o.pA.position.set(g.A[0], g.A[1], 0); o.pB.position.set(g.B[0], g.B[1], 0);
    const yb = -0.72, L = g.A[1] - yb; o.rod.scale.y = L; o.rod.position.set(0, yb + L / 2, -0.025);
    o.labs[1].position.set(-0.07, g.A[1], 0.05); o.labs[2].position.set(g.B[0] + 0.07, g.B[1], 0.05);
    const ok = g.IC && Math.abs(g.IC[0]) < 3; setIC(o.ic, ok ? g.IC : null, 0.08, -0.05, 0);
    o.l1.group.visible = o.l2.group.visible = !!ok; if (ok){ o.l1.set([[g.A[0], g.A[1], 0], [g.IC[0], g.IC[1], 0]]); o.l2.set([[0, 0, 0], [g.IC[0], g.IC[1], 0]]); }
    o.aA.set([-0.08, g.A[1] - 0.05, 0], [0, 0.16, 0]);
  }
});

/* ---------- 2.B.6  two links between two walls ---------- */
view3d({
  id: 'x2b-6', size: 0.75, target: [-0.04, 0.18, 0], camera: [-0.25, 0.3, 1],
  build(H){
    H.floor(-0.4, 0.32, 0.2); H.wall(-0.32, 0, 0.45, 0.2);
    const wR = H.box(0.03, 0.45, 0.4, H.C.wall); wR.position.set(0.255, 0.225, 0);
    const AB = unitBar(H, 0.022, H.C.body, 0.02), BC = unitBar(H, 0.022, '#d9c58c', 0.02);
    const rA = H.disk(0.012, 0.05, H.C.steel), rB = H.disk(0.012, 0.07, H.C.steel), rC = H.disk(0.012, 0.05, H.C.steel);
    const labs = ['A', 'B', 'C'].map(t => H.label(t)), ic1 = icMarker(H, 'IC_AB'), ic2 = icMarker(H, 'IC_BC'), vl = thinLine(H);
    return { AB, BC, rA, rB, rC, labs, ic1, ic2, vl };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const A = [g.A[0] + 0.012, g.A[1]], B = [g.B[0], 0.012], C = [g.C[0] - 0.012, g.C[1]];
    place(o.AB, A, B, 0.012); place(o.BC, B, C, -0.012);
    o.rA.position.set(...A, 0.012); o.rB.position.set(...B, 0); o.rC.position.set(...C, -0.012);
    o.labs[0].position.set(A[0] + 0.05, A[1] + 0.04, 0.03); o.labs[1].position.set(B[0], -0.04, 0.05); o.labs[2].position.set(C[0] - 0.05, C[1] + 0.04, 0.03);
    setIC(o.ic1, g.IC1, 0.08, -0.03, 0.03); setIC(o.ic2, g.IC2, -0.08, 0.04, 0.03);
    o.vl.set([[g.B[0], 0, 0.03], [g.B[0], Math.max(g.A[1], g.C[1]) + 0.04, 0.03]]);
  }
});

/* ---------- 2.B.7  roller A in a 45° guide slot, roller B on a level track ---------- */
view3d({
  id: 'x2b-7', size: 1.4, target: [0.35, -0.05, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const fy = -0.62, e = [Math.SQRT1_2, Math.SQRT1_2];
    H.floor(-0.6, 1.4, 0.35, fy);
    // guide plate with the slot, standing on the floor behind the link
    const plate = H.box(0.95, 0.2, 0.02, '#e3dccb'); plate.position.set(0.12 * e[0] + 0, 0.12 * e[1], -0.06); plate.rotation.z = Math.PI / 4;
    const slot = H.box(0.88, 0.05, 0.022, '#9a927d'); slot.position.copy(plate.position); slot.position.z = -0.055; slot.rotation.z = Math.PI / 4;
    const leg = H.box(0.06, 0.38, 0.06, H.C.steel); leg.position.set(-0.22, fy + 0.19, -0.06);
    // level track for B, on two posts
    const track = H.box(1.0, 0.025, 0.12, H.C.steel); track.position.set(0.62, 0.3 - 0.028, 0);
    [0.18, 1.06].forEach(x => { const p = H.box(0.04, 0.3 - fy - 0.04, 0.04, H.C.steel); p.position.set(x, (fy + 0.26) / 2, 0); });
    const bar = unitBar(H, 0.03, H.C.body, 0.025), rA = H.disk(0.016, 0.17, H.C.steel), rB = H.disk(0.016, 0.12, H.C.steel), G = H.sphere(0.012, H.C.dark);
    const labs = ['A', 'B', 'G'].map(t => H.label(t)), ic = icMarker(H, 'IC_AB'), ls = [thinLine(H), thinLine(H), thinLine(H)];
    const aB = H.arrow(H.C.red, 0.6), aA = H.arrow(H.C.blue, 0.6), aG = H.arrow(H.C.green, 0.6);
    return { bar, rA, rB, G, labs, ic, ls, aB, aA, aG };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    place(o.bar, g.A, g.B, 0.07); o.rA.position.set(g.A[0], g.A[1], 0.0); o.rB.position.set(g.B[0], g.B[1], 0.03); o.G.position.set(g.G[0], g.G[1], 0.09);
    o.labs[0].position.set(g.A[0] - 0.08, g.A[1], 0.05); o.labs[1].position.set(g.B[0], g.B[1] + 0.08, 0.05); o.labs[2].position.set(g.G[0], g.G[1] + 0.07, 0.05);
    setIC(o.ic, g.IC, 0.09, 0, 0.07);
    [g.A, g.B, g.G].forEach((P, i) => o.ls[i].set([[P[0], P[1], 0.07], [g.IC[0], g.IC[1], 0.07]]));
    // velocities from the IC: v = ω × r with ω = −v_B / (y_B − y_IC)
    const w = -2.5 / (g.B[1] - g.IC[1]), vel = P => [-w * (P[1] - g.IC[1]), w * (P[0] - g.IC[0]), 0], k = 0.07;
    o.aB.set([g.B[0], g.B[1], 0.09], V(k, vel(g.B))); o.aA.set([g.A[0], g.A[1], 0.09], V(k, vel(g.A))); o.aG.set([g.G[0], g.G[1], 0.09], V(k, vel(g.G)));
  }
});

/* ---------- 2.B.8  rolling tire with exposure streaks ---------- */
view3d({
  id: 'x2b-8', size: 0.8, target: [0, 0.26, 0], camera: [-0.25, 0.2, 1],
  build(H){
    const R = 0.26, T = H.THREE;
    H.floor(-1.2, 1.2, 0.4);
    const road = []; for (let i = 0; i < 12; i++){ const m = H.box(0.1, 0.004, 0.02, '#b8b3a6'); m.position.set(-1.1 + 0.2 * i, 0.002, 0.3); road.push(m); }
    const wheel = new T.Group(); H.add(wheel);
    const tire = H.mesh(new T.TorusGeometry(R - 0.055, 0.055, 20, 64), '#2e2f33', wheel); tire.scale.z = 1.6;
    H.disk(R - 0.1, 0.14, '#9ea2aa', wheel); H.disk(0.03, 0.2, '#c9ccd2', wheel);
    const marks = []; for (let k = 0; k < 10; k++){ const m = H.box(0.035, 0.018, 0.006, '#f2c230', wheel); const a = Math.PI / 2 - 2 * Math.PI * k / 10; m.position.set(0.8 * R * Math.cos(a), 0.8 * R * Math.sin(a), 0.09); m.rotation.z = a; marks.push(m); }
    const trails = []; for (let k = 0; k < 10; k++){ const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(25 * 3), 3));
      const ln = new T.Line(geo, new T.LineBasicMaterial({ color: 0xf2c230, transparent: true, opacity: 0.85 })); H.add(ln); trails.push(ln); }
    const ic = icMarker(H, 'C = IC'), lO = H.label('O');
    return { R, wheel, trails, ic, lO, road };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const R = o.R, tau = g.th / g.wv;
    o.wheel.position.set(g.xO, R, 0); o.wheel.rotation.z = -g.th;
    o.road.forEach((m, i) => { m.position.x = g.cam ? (((-1.1 + 0.2 * i - g.v * tau) % 2.4) + 3.6) % 2.4 - 1.2 : -1.1 + 0.2 * i; });
    o.trails.forEach((ln, k) => { const a = ln.geometry.attributes.position;
      for (let i = 0; i < 25; i++){ const q = tau - g.E * (1 - i / 24), an = Math.PI / 2 - g.wv * q - 2 * Math.PI * k / 10, xo = g.cam ? 0 : g.xO - g.v * (tau - q);
        a.setXYZ(i, xo + 0.8 * R * Math.cos(an), R + 0.8 * R * Math.sin(an), 0.095); }
      a.needsUpdate = true; });
    setIC(o.ic, g.cam ? null : [g.xO, 0], 0.12, -0.05, 0.12); o.lO.position.set(g.xO + 0.06, R + 0.06, 0.14);
  }
});

})();
