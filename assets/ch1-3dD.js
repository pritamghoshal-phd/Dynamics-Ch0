/* 3D views for the Chapter 1, Section D examples (1.D.1 to 1.D.6).
   Each view reads the live state of the 2D clip with the same id, so the sliders and buttons drive both views.
   Conventions: x right, y up, z out of the screen. For the top-view problems (1.D.1, 1.D.2) the 2D picture is the
   horizontal ground plane, mapped as (X, Y) -> (X, height, -Y). */
(function(){

const T = () => H0.THREE; let H0 = null;
// points on a circular arc in the x–y plane (angles in radians, measured counterclockwise from +x)
const arcPts = (cx, cy, r, a0, a1, z = 0, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a), z]; });
// a pulley: disk with a darker hub and a mark that shows its rotation (returns the rotating group)
function pulley3(H, r, depth = 0.05, color = H.C.steel){
  const g = new H.THREE.Group(); H.add(g);
  H.disk(r, depth, color, g); H.disk(r * 0.3, depth * 1.6, H.C.dark, g);
  const m = H.box(r * 0.75, r * 0.12, depth * 1.08, H.C.orange, g); m.position.x = r * 0.4;
  return g;
}
// a car seen in 3D: body, cabin and four wheels; heading along +x of the group
function car3(H, color){
  const g = new H.THREE.Group(); H.add(g); g.scale.set(1.8, 1.8, 1.8);
  const b = H.box(0.34, 0.08, 0.17, color, g); b.position.y = 0.07;
  const c = H.box(0.17, 0.07, 0.15, '#dfe7f1', g); c.position.set(-0.02, 0.145, 0);
  [[0.11, 0.09], [0.11, -0.09], [-0.11, 0.09], [-0.11, -0.09]].forEach(([x, z]) => { const w = H.disk(0.04, 0.03, H.C.dark, g); w.position.set(x, 0.04, z); });
  return g;
}
// an airplane: fuselage along +x of the group
function jet3(H, color){
  const T3 = H.THREE, g = new T3.Group(); H.add(g); g.scale.set(1.6, 1.6, 1.6);
  const f = new T3.CylinderGeometry(0.045, 0.03, 0.62, 16); f.rotateZ(-Math.PI / 2); H.mesh(f, color, g);
  const nose = new T3.ConeGeometry(0.045, 0.12, 16); nose.rotateZ(-Math.PI / 2); H.mesh(nose, color, g).position.x = 0.37;
  const wing = H.box(0.16, 0.012, 0.62, color, g); wing.position.x = 0.02;
  const tail = H.box(0.08, 0.01, 0.24, color, g); tail.position.x = -0.27;
  const fin = H.box(0.08, 0.12, 0.01, color, g); fin.position.set(-0.27, 0.06, 0);
  return g;
}
const setArrow = (a, o, v) => a.set(o, Math.hypot(...v) < 1e-3 ? [0, 0, 0] : v);

/* ---------------- 1.D.1  Cars on a straight road and on a curve ----------------
   Ground plane at y = 0, 1 km = 4 units. B's curve has its centre at (-R, 0); A drives on the line x = lane. */
const K1 = 4;
view3d({
  id: 'x1d-1', size: 2.4, target: [-0.4, 0, 0], camera: [0.45, 0.85, 0.75],
  build(H){
    H0 = H;
    H.floor(-4.2, 1.6, 3.4);
    const T3 = H.THREE;
    // roads: a ring for B (rebuilt when ρ changes) and a straight strip for A
    const roadA = H.box(0.4, 0.012, 7.6, '#a39c8e'); roadA.position.set(0.12 * K1, 0.006, 0); roadA.castShadow = false;
    const ringGrp = new T3.Group(); H.add(ringGrp);
    const A = car3(H, '#cfe0f5'), B = car3(H, '#e7d9b0');
    const frame = new T3.Group(); H.add(frame);                       // axes that translate with car A (they never rotate)
    const ax = H.arrow('#5b606c', 1.4), ay = H.arrow('#5b606c', 1.4);
    const vA = H.arrow(H.C.blue, 1.4), vB = H.arrow(H.C.blue, 1.4), aB = H.arrow(H.C.orange, 1.4), aBA = H.arrow(H.C.purple, 1.4);
    const la = H.label('A'), lb = H.label('B'), lab = H.label('a_{B/A}', H.C.purple), laB = H.label('a_B', H.C.orange), lfx = H.label('x', '#5b606c', 0.13), lfy = H.label('y', '#5b606c', 0.13);
    const centre = H.disk(0.05, 0.02, H.C.dark); centre.rotation.x = Math.PI / 2;
    return { ringGrp, A, B, ax, ay, vA, vB, aB, aBA, la, lb, lab, laB, lfx, lfy, centre, R: null };
  },
  update(H, st, o){
    if (st.tau === undefined) return;
    const V = st.V, R = V.R / 1000, lane = 0.12, dA = 10, dB = -10, t = st.tau / 3600;
    if (o.R !== R){                                                     // rebuild B's curved road for a new radius
      o.ringGrp.clear(); const g = new H.THREE.RingGeometry(R * K1 - 0.2, R * K1 + 0.2, 96, 1, -1.25, 2.5); g.rotateX(-Math.PI / 2);
      const m = H.mesh(g, '#a39c8e', o.ringGrp); m.position.set(-R * K1, 0.006, 0); m.castShadow = false; o.R = R;
      o.centre.position.set(-R * K1, 0.01, 0);
    }
    const sA = V.vA * t + 0.5 * dA * t * t, sB = V.vB * t + 0.5 * dB * t * t, ph = sB / R, vBt = V.vB + dB * t, vAt = V.vA + dA * t;
    const P = (x, y, h = 0) => [x * K1, h, -y * K1];
    const pA = [lane, -sA], pB = [-R + R * Math.cos(ph), -R * Math.sin(ph)];
    const tB = [-Math.sin(ph), -Math.cos(ph)], nB = [-Math.cos(ph), Math.sin(ph)];
    o.A.position.set(...P(...pA)); o.A.rotation.y = -Math.PI / 2;        // heading −y of the 2D picture = +z in 3D
    o.B.position.set(...P(...pB)); o.B.rotation.y = Math.atan2(tB[1], tB[0]);
    const kv = 0.012, an = vBt * vBt / R, ka = 0.75 / (V.vB * V.vB / R);
    setArrow(o.vA, P(pA[0], pA[1], 0.3), [0, 0, vAt * kv]);
    setArrow(o.vB, P(pB[0], pB[1], 0.3), [tB[0] * vBt * kv, 0, -tB[1] * vBt * kv]);
    const aBv = [nB[0] * an + tB[0] * dB, nB[1] * an + tB[1] * dB], rel = [aBv[0], aBv[1] + dA];
    setArrow(o.aB, P(pB[0], pB[1], 0.12), [aBv[0] * ka, 0, -aBv[1] * ka]);
    setArrow(o.aBA, P(pB[0], pB[1], 0.42), [rel[0] * ka, 0, -rel[1] * ka]);
    // translating axes carried by car A
    const ao = P(pA[0], pA[1], 0.5); setArrow(o.ax, ao, [0.45, 0, 0]); setArrow(o.ay, ao, [0, 0, -0.45]);
    o.lfx.position.set(ao[0] + 0.55, ao[1], ao[2]); o.lfy.position.set(ao[0], ao[1], ao[2] - 0.55);
    o.la.position.set(...P(pA[0] + 0.07, pA[1], 0.25)); o.lb.position.set(...P(pB[0] + 0.07, pB[1], 0.25));
    o.lab.position.set(...P(pB[0] + rel[0] * ka / K1 - 0.06, pB[1] + rel[1] * ka / K1, 0.55)); o.laB.position.set(...P(pB[0] + aBv[0] * ka / K1 - 0.06, pB[1], 0.12));
  }
});

/* ---------------- 1.D.2  Two jets at cruising altitude ----------------
   Ground far below, jets at height 1.6. Horizontal positions follow the 2D animation (A travels 4 units). */
view3d({
  id: 'x1d-2', size: 3.2, target: [0.6, 1.2, -0.6], camera: [-0.55, 0.55, 0.9],
  build(H){
    H.floor(-2.2, 3.6, 2.8);
    const A = jet3(H, '#cfe0f5'), B = jet3(H, '#e7d9b0');
    const trA = H.cable([[0, 0, 0], [0, 0, 0]], H.C.blue, 0.006), trB = H.cable([[0, 0, 0], [0, 0, 0]], H.C.green, 0.006);
    const vA = H.arrow(H.C.blue, 1.3), vB = H.arrow(H.C.green, 1.3), vAB = H.arrow(H.C.purple, 1.3);
    const la = H.label('A'), lb = H.label('B'), lvab = H.label('v_{A/B}', H.C.purple), lvA = H.label('v_A', H.C.blue), lvB = H.label('v_B', H.C.green);
    const N = H.arrow('#5b606c', 1.6), lN = H.label('north', '#5b606c', 0.14); N.set([-1.8, 0.02, 2.2], [0, 0, -0.8]); lN.position.set(-1.8, 0.1, 1.25);
    return { A, B, trA, trB, vA, vB, vAB, la, lb, lvab, lvA, lvB };
  },
  update(H, st, o){
    if (!st.V || st.V.al === undefined) return;
    const V = st.V, al = V.al * RAD, vA = V.vB / Math.sin(al), U = 4, u = Math.min(st.t, U), k = 4 / (vA * U), Y = 1.6;
    const A0 = [-0.6, 0.3], B0 = [-1.2, -0.3];                        // horizontal (east, north) start positions
    const pA = [A0[0] + vA * Math.cos(al) * k * u, A0[1] + vA * Math.sin(al) * k * u], pB = [B0[0], B0[1] + V.vB * k * u];
    const P = (q, h = Y) => [q[0], h, -q[1]];
    o.A.position.set(...P(pA)); o.A.rotation.y = al; o.B.position.set(...P(pB)); o.B.rotation.y = Math.PI / 2;
    o.trA.set([P(A0), P(pA)]); o.trB.set([P(B0), P(pB)]);
    const kv = 0.9 / vA;
    setArrow(o.vA, P(pA, Y + 0.12), [vA * Math.cos(al) * kv, 0, -vA * Math.sin(al) * kv]);
    setArrow(o.vB, P(pB, Y + 0.12), [0, 0, -V.vB * kv]);
    setArrow(o.vAB, P(pA, Y + 0.32), [vA * Math.cos(al) * kv, 0, 0]);
    o.la.position.set(...P([pA[0] - 0.25, pA[1] - 0.2], Y)); o.lb.position.set(...P([pB[0] + 0.3, pB[1] - 0.1], Y));
    o.lvA.position.set(...P([pA[0] + vA * Math.cos(al) * kv + 0.12, pA[1] + vA * Math.sin(al) * kv], Y + 0.12));
    o.lvB.position.set(...P([pB[0] + 0.12, pB[1] + V.vB * kv + 0.1], Y + 0.12));
    o.lvab.position.set(...P([pA[0] + vA * Math.cos(al) * kv + 0.2, pA[1]], Y + 0.32));
  }
});

/* ---------------- 1.D.3  Blocks, three pulleys and a post ----------------
   Real metres: A is 0.9 m wide, B 0.8 m, both 1.0 m tall and 0.8 m deep. Pulley radius 0.12 m. */
view3d({
  id: 'x1d-3', size: 2.4, target: [1.7, 0.45, 0], camera: [-0.2, 0.45, 1],
  build(H){
    H.floor(-1.4, 5.4, 1.0);
    const A = H.box(0.9, 1.0, 0.8, H.C.body), B = H.box(0.8, 1.0, 0.8, H.C.body);
    const post = H.box(0.08, 0.18, 0.3, H.C.steel); post.position.set(1.64, 0.09, 0);
    const pU = pulley3(H, 0.12), pL = pulley3(H, 0.12), pB = pulley3(H, 0.12);
    const armU = H.box(0.17, 0.03, 0.03, H.C.dark), armL = H.box(0.17, 0.03, 0.03, H.C.dark), armB = H.box(0.2, 0.03, 0.03, H.C.dark);
    const cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.008);
    const la = H.label('A'), lb = H.label('B'), vA = H.arrow(H.C.blue, 1), vB = H.arrow(H.C.blue, 1), lva = H.label('v_A', H.C.blue), lvb = H.label('v_B', H.C.blue);
    return { A, B, pU, pL, pB, armU, armL, armB, cab, la, lb, vA, vB, lva, lvb };
  },
  update(H, st, o){
    if (!st.V || st.V.v0 === undefined) return;
    const V = st.V, t = Math.min(st.t, st.tEnd ?? st.t), dxB = V.v0 * t + 0.5 * V.aB * t * t, dxA = 0.75 * dxB, vB = V.v0 + V.aB * t;
    const r = 0.12, hU = 0.70, hB = 0.46, hL = 0.22, xa = 0.25 + dxA, xBf = 2.3 + dxB, xbp = xBf - 0.2;
    o.A.position.set(-0.35 + dxA, 0.5, 0); o.B.position.set(xBf + 0.4, 0.5, 0);
    o.pU.position.set(xa, hU, 0); o.pL.position.set(xa, hL, 0); o.pB.position.set(xbp, hB, 0);
    o.pU.rotation.z = -(dxB - dxA) / r; o.pB.rotation.z = -(2 * dxA - 2 * dxB) / r; o.pL.rotation.z = -(3 * dxB - 3 * dxA) / r;
    o.armU.position.set(0.1 + dxA + 0.075, hU, 0); o.armL.position.set(0.1 + dxA + 0.075, hL, 0); o.armB.position.set(xbp + 0.1, hB, 0);
    o.cab.set([[xBf, hU + r, 0], ...arcPts(xa, hU, r, Math.PI / 2, 1.5 * Math.PI), ...arcPts(xbp, hB, r, Math.PI / 2, -Math.PI / 2), ...arcPts(xa, hL, r, Math.PI / 2, 1.5 * Math.PI), [1.6, hL - r, 0]]);
    o.la.position.set(-0.35 + dxA, 1.12, 0.45); o.lb.position.set(xBf + 0.4, 1.12, 0.45);
    setArrow(o.vA, [-0.35 + dxA - 0.2, 1.3, 0], [0.75 * vB * 0.25, 0, 0]); setArrow(o.vB, [xBf + 0.2, 1.3, 0], [vB * 0.25, 0, 0]);
    o.lva.position.set(-0.35 + dxA - 0.2 + 0.75 * vB * 0.25 + 0.28, 1.36, 0); o.lvb.position.set(xBf + 0.2 + vB * 0.25 + 0.28, 1.36, 0);
  }
});

/* ---------------- 1.D.4  Incline and movable pulley ----------------
   The 2D drawing is in pixels at 150 px per metre with y down; here x = px/150, y = (470 - py)/150. */
const Q4 = (x, y) => [x / 150, (470 - y) / 150];
view3d({
  id: 'x1d-4', size: 2.2, target: [2.4, 1.6, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const T3 = H.THREE, be = 40 * RAD, d = [Math.cos(be), Math.sin(be)], nUp = [Math.sin(be), -Math.cos(be)], half = 22;
    const Cf = [245, 90], rr = 15, Tp = [Cf[0] + rr * nUp[0], Cf[1] + rr * nUp[1]];
    const s1 = [Tp[0] + d[0] * 150 - nUp[0] * half, Tp[1] + d[1] * 150 - nUp[1] * half], s2 = [Tp[0] + d[0] * 470 - nUp[0] * half, Tp[1] + d[1] * 470 - nUp[1] * half];
    const p1 = Q4(...s1), p2 = Q4(...s2);
    H.floor(0.2, 4.6, 0.8, p2[1]);
    // solid incline (wedge) under the slope, standing on the floor at the bottom of the slope
    const sh = new T3.Shape(); sh.moveTo(p1[0], p1[1]); sh.lineTo(p2[0], p2[1]); sh.lineTo(p1[0], p2[1]); sh.closePath();
    const wg = new T3.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false }); wg.translate(0, 0, -0.4); H.mesh(wg, '#d6cfbd');
    const ceil = Q4(0, 30)[1]; H.ceiling(0.9, 2.2, ceil, 0.45);
    const cf = Q4(...Cf); const fp = pulley3(H, rr / 150, 0.05); fp.position.set(cf[0], cf[1], 0);
    const hang = H.box(0.025, ceil - cf[1], 0.025, H.C.steel); hang.position.set(cf[0], (ceil + cf[1]) / 2, 0);
    const mp = pulley3(H, rr / 150, 0.05), rod = H.box(0.02, 40 / 150, 0.02, H.C.steel), B = H.box(50 / 150, 46 / 150, 0.3, H.C.body), A = H.box(44 / 150, 44 / 150, 0.3, H.C.body);
    A.rotation.z = -be;
    const cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.006);
    const la = H.label('A'), lb = H.label('B');
    return { be, d, nUp, Cf, rr, Tp, ceil, fp, mp, rod, A, B, cab, la, lb };
  },
  update(H, st, o){
    if (!st.V || st.V.aA === undefined) return;
    const t = Math.min(st.t, st.tEnd ?? st.t), xA = 0.5 * st.V.aA * t * t, xB = xA / 2, S = 150, rr = o.rr;
    const Cb = [215, 170 + xB * S], sA = 330 - xA * S, att = [o.Tp[0] + o.d[0] * sA, o.Tp[1] + o.d[1] * sA], cA = [att[0] + o.d[0] * 22, att[1] + o.d[1] * 22];
    const q = p => Q4(...p);
    o.mp.position.set(...q(Cb), 0); o.mp.rotation.z = xB * S / rr; o.fp.rotation.z = -xA * S / rr;
    const cb = q(Cb); o.rod.position.set(cb[0], cb[1] - 20 / 150, 0); o.B.position.set(cb[0], cb[1] - 64 / 150, 0);
    o.A.position.set(...q(cA), 0);
    const cf = q(o.Cf), r = rr / 150, aT = Math.atan2(-o.nUp[1], o.nUp[0]);
    o.cab.set([[cb[0] - r, o.ceil, 0], ...arcPts(cb[0], cb[1], r, Math.PI, 2 * Math.PI), ...arcPts(cf[0], cf[1], r, Math.PI, aT, 0, 16).map(p => p), [...q(att), 0]]);
    o.la.position.set(...q([cA[0] + o.nUp[0] * 40, cA[1] + o.nUp[1] * 40]), 0.2); o.lb.position.set(cb[0] + 0.3, cb[1] - 64 / 150, 0.2);
  }
});

/* ---------------- 1.D.5  Two cables and two movable pulleys ----------------
   The 2D drawing is in pixels at 100 px per metre with y down; here x = px/100, y = (560 - py)/100.
   The shelves for A and B are fixed to a back wall. */
const Q5 = (x, y) => [x / 100, (560 - y) / 100];
view3d({
  id: 'x1d-5', size: 3.8, target: [4.0, 3.2, 0], camera: [-0.25, 0.2, 1],
  build(H){
    H.floor(-0.5, 8.5, 1.0);
    const ceil = Q5(0, 30)[1]; H.ceiling(-0.3, 8.3, ceil, 0.5);
    // shelves (tables) on which A and B slide, standing on the floor
    const top = Q5(0, 84)[1];
    const wall = H.box(8.6, ceil, 0.06, H.C.wall); wall.position.set(4.0, ceil / 2, -0.5);
    [[0.0, 2.68], [4.52, 8.0]].forEach(([x0, x1]) => { const s = H.box(x1 - x0, 0.05, 0.6, '#d6cfbd'); s.position.set((x0 + x1) / 2, top - 0.025, -0.17);
      [x0 + 0.3, x1 - 0.3].forEach(x => { const br = H.box(0.05, 0.25, 0.5, H.C.steel); br.position.set(x, top - 0.17, -0.22); }); });
    const PL = Q5(300, 90), PR = Q5(420, 90);
    [PL, PR].forEach(p => { const hgr = H.box(0.025, ceil - p[1], 0.025, H.C.steel); hgr.position.set(p[0], (ceil + p[1]) / 2, 0); });
    const pl = pulley3(H, 0.22, 0.06), pr = pulley3(H, 0.22, 0.06); pl.position.set(...PL, 0); pr.position.set(...PR, 0);
    const pc = pulley3(H, 0.11, 0.05), pm = pulley3(H, 0.435, 0.07);
    const A = H.box(0.36, 0.3, 0.3, H.C.body), B = H.box(0.36, 0.3, 0.3, H.C.body), M = H.box(0.5, 0.44, 0.35, H.C.body);
    const rodC = H.box(0.02, 0.17, 0.02, H.C.steel), rodM = H.box(0.02, 0.62, 0.02, H.C.steel);
    const c1 = H.cable([[0, 0, 0], [1, 0, 0]], '#c2410c', 0.012), c2 = H.cable([[0, 0, 0], [1, 0, 0]], H.C.blue, 0.012);
    const la = H.label('A'), lb = H.label('B'), lc = H.label('C'), lm = H.label('m');
    return { PL, PR, pl, pr, pc, pm, A, B, M, rodC, rodM, c1, c2, la, lb, lc, lm };
  },
  update(H, st, o){
    if (!st.V || st.V.vA === undefined) return;
    const V = st.V, t = Math.min(st.t, st.tMax || 1), S = 100, vC = -V.vA / 2, vm = (vC - V.vB) / 2;
    const xA = 540 + V.vA * t * S, xB = 260 - V.vB * t * S, yC = 260 + vC * t * S, ym = 420 + vm * t * S, ytop = Q5(0, 68)[1];
    const C = Q5(409, yC), Mc = Q5(365.5, ym), rC = 0.11, rm = 0.435, rp = 0.22;
    o.A.position.set(xA / 100, ytop, 0); o.B.position.set(xB / 100, ytop, 0);
    o.pc.position.set(...C, 0); o.pm.position.set(...Mc, 0);
    o.pl.rotation.z = V.vB * t * S / 22; o.pr.rotation.z = -V.vA * t * S / 22; o.pc.rotation.z = -(V.vA / 2) * t * S / 11; o.pm.rotation.z = -(-V.vB * t - vm * t) * S / 43.5;
    o.rodC.position.set(C[0], C[1] - 0.14, 0); o.rodM.position.set(Mc[0], Mc[1] - 0.31, 0); o.M.position.set(Mc[0], Mc[1] - rm - 0.4, 0);
    o.c1.set([[xB / 100 + 0.18, ytop, 0], ...arcPts(o.PL[0], o.PL[1], rp, Math.PI / 2, 0), ...arcPts(Mc[0], Mc[1], rm, Math.PI, 2 * Math.PI), [C[0], C[1] - rC - 0.06, 0]]);
    o.c2.set([[xA / 100 - 0.18, ytop, 0], ...arcPts(o.PR[0], o.PR[1], rp, Math.PI / 2, Math.PI), ...arcPts(C[0], C[1], rC, Math.PI, 2 * Math.PI), [C[0] + rC, o.PR[1] - rp, 0]]);
    o.la.position.set(xA / 100, ytop + 0.35, 0.2); o.lb.position.set(xB / 100, ytop + 0.35, 0.2); o.lc.position.set(C[0] + 0.3, C[1], 0.1); o.lm.position.set(Mc[0] + 0.45, Mc[1] - rm - 0.4, 0.2);
  }
});

/* ---------------- 1.D.6  Block on a vertical guide (units: feet) ----------------
   D and E are 3 ft on either side of the guide at height 9 ft above the floor. */
const TOP6 = 9;
view3d({
  id: 'x1d-6', size: 6.5, target: [0, 5.2, 0], camera: [-0.3, 0.15, 1],
  build(H){
    H.floor(-6, 6, 2.5); H.ceiling(-4.2, 4.2, TOP6 + 0.6, 1.2);
    [-3, 3].forEach(x => { const b = H.box(0.12, 0.6, 0.12, H.C.steel); b.position.set(x, TOP6 + 0.3, 0); });
    const pd = pulley3(H, 0.17, 0.12), pe = pulley3(H, 0.17, 0.12); pd.position.set(-3, TOP6, 0); pe.position.set(3, TOP6, 0);
    // the vertical guide: two rails standing on the floor
    [-0.45, 0.45].forEach(x => { const r = H.box(0.12, 7.5, 0.5, H.C.wall); r.position.set(x, 3.75, 0); });
    const A = H.box(0.7, 0.7, 0.45, H.C.body), pa = pulley3(H, 0.15, 0.5), B = H.box(0.55, 0.9, 0.55, H.C.body), C = H.box(0.55, 0.9, 0.55, H.C.body);
    const cab = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.03);
    const la = H.label('A', '#1c1d21', 0.5), lb = H.label('B', '#1c1d21', 0.5), lc = H.label('C', '#1c1d21', 0.5), ld = H.label('D', '#1c1d21', 0.5), le = H.label('E', '#1c1d21', 0.5);
    ld.position.set(-3.5, TOP6 + 0.1, 0.3); le.position.set(3.5, TOP6 + 0.1, 0.3);
    const vA = H.arrow(H.C.orange, 4), lva = H.label('v_A', H.C.orange, 0.5);
    return { A, pa, B, C, cab, la, lb, lc, vA, lva };
  },
  update(H, st, o){
    if (!st.V || st.V.vB === undefined || st.k === undefined) return;
    const V = st.V, t = st.tt ?? 0, r0 = Math.sqrt(45), q = r0 - st.k * t, sA = Math.sqrt(Math.max(q * q - 9, 0));
    const sC = 1.5 + V.vC * t, sB = 1.5 + V.vB * t, vA = st.k * q / Math.max(sA, 1e-6);
    const yA = TOP6 - sA;
    o.A.position.set(0, yA, 0); o.pa.position.set(0, yA, 0);
    o.C.position.set(-3, TOP6 - sC - 0.45, 0); o.B.position.set(3, TOP6 - sB - 0.45, 0);
    o.cab.set([[-3, TOP6 - sC, 0], [-3, TOP6, 0], [0, yA, 0], [3, TOP6, 0], [3, TOP6 - sB, 0]]);
    o.la.position.set(0.9, yA - 0.2, 0.4); o.lc.position.set(-3.7, TOP6 - sC - 0.45, 0.3); o.lb.position.set(3.7, TOP6 - sB - 0.45, 0.3);
    setArrow(o.vA, [-1.1, yA, 0.3], [0, Math.min(3, vA * 0.12), 0]); o.lva.position.set(-1.5, yA + Math.min(3, vA * 0.12) * 0.6, 0.3);
  }
});

})();
