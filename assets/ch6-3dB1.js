/* 3D views for the Chapter 6 examples 6.B.1 – 6.B.4 (free vibration).
   Each view reads the live state of the 2D clip with the same id (x6b-1 … x6b-4 in ch6-exB1.js).
   6.B.1 and 6.B.4 use the exact geometry the clip stores in st.geo, so the 2D and 3D pictures match point for point. */
(function(){

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
function prism(H, pts, depth, color){
  const T = H.THREE, s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return H.mesh(g, color);
}
// cable that wraps a pulley: points of an arc (centre c, radius r) from angle a0 to a1 (radians, CCW positive)
const arcPts = (c, r, a0, a1, z, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z]; });

/* ---------- 6.B.1  block A on a smooth incline, cable over a fixed pulley to a movable pulley that carries B ---------- */
view3d({
  id: 'x6b-1', size: 1.3, target: [-0.35, -0.3, 0], camera: [-0.2, 0.25, 1],
  build(H){
    const A = H.box(0.2, 0.12, 0.16, '#cfd8ea'), B = H.box(0.16, 0.14, 0.14, '#cfd8ea');
    const pF = H.disk(0.08, 0.04, H.C.steel), pM = H.disk(0.04, 0.035, H.C.steel), hang = H.box(0.012, 0.06, 0.012, H.C.dark);
    const strut = H.box(1, 0.03, 0.03, H.C.steel), wall = H.box(0.03, 0.3, 0.34, H.C.wall);
    const spr = spring(H, 0.025, 9, 0.004), cab = H.cable([[0, 0, 0], [0, 1, 0]]);
    const lA = H.label('A'), lB = H.label('B'), lk = H.label('k'), lf = H.label('f(t)', H.C.blue), fA = H.arrow(H.C.blue, 1);
    return { A, B, pF, pM, hang, strut, wall, spr, cab, lA, lB, lk, lf, fA, th: null, body: null, flo: null };
  },
  update(H, st, o){
    const g = st.geo; if (!g || !st.V) return;
    const th = st.V.th * Math.PI / 180;
    if (o.th !== th || o.yg !== st.yg){   // rebuild the incline body when the angle changes
      o.th = th; o.yg = st.yg; if (o.body) o.body.parent.remove(o.body); if (o.flo) o.flo.parent.remove(o.flo);
      o.body = prism(H, [g.W, [0, 0], [0, st.yg], [g.W[0], st.yg]], 0.4, '#e6e1d4');
      o.flo = H.box(Math.abs(g.W[0]) + g.Pc[0] + 0.7, 0.04, 0.8, H.C.ground); o.flo.position.set((g.W[0] + g.Pc[0] + 0.3) / 2, st.yg - 0.02, 0);
      const wc = [g.W[0] + 0.12 * g.n[0], g.W[1] + 0.12 * g.n[1]]; o.wall.position.set(wc[0] - 0.015 * g.u[0], wc[1] - 0.015 * g.u[1], 0); o.wall.rotation.z = th;
      const s0 = [0, Math.min(-0.04, g.Pc[1] - 0.12)], d = [g.Pc[0] - s0[0], g.Pc[1] - s0[1]], L = Math.hypot(...d);
      o.strut.scale.x = L; o.strut.position.set((s0[0] + g.Pc[0]) / 2, (s0[1] + g.Pc[1]) / 2, -0.04); o.strut.rotation.z = Math.atan2(d[1], d[0]);
      o.pF.position.set(g.Pc[0], g.Pc[1], 0);
    }
    o.A.position.set(g.A[0], g.A[1], 0); o.A.rotation.z = th;
    const sp1 = [g.W[0] + 0.06 * g.n[0], g.W[1] + 0.06 * g.n[1], 0], sp2 = [g.A[0] - 0.1 * g.u[0], g.A[1] - 0.1 * g.u[1], 0]; o.spr.set(sp1, sp2);
    o.pM.position.set(g.M[0], g.M[1], 0); o.hang.position.set(g.M[0], g.M[1] - 0.04 - 0.03, 0); o.B.position.set(g.M[0], g.Btop - 0.07, 0);
    const Q = [g.A[0] + 0.1 * g.u[0], g.A[1] + 0.1 * g.u[1], 0], rF = 0.08, aT = Math.PI / 2 + th;
    const pts = [Q].concat(arcPts(g.Pc, rF, aT, 0, 0), arcPts(g.M, rF / 2, 0, -Math.PI, 0), [[g.Pc[0], g.Pc[1], 0]]);
    o.cab.set(pts);
    o.lA.position.set(g.A[0] + 0.14 * g.n[0], g.A[1] + 0.14 * g.n[1], 0.1); o.lB.position.set(g.M[0] + 0.15, g.Btop - 0.07, 0.1);
    o.lk.position.set((sp1[0] + sp2[0]) / 2 + 0.1 * g.n[0], (sp1[1] + sp2[1]) / 2 + 0.1 * g.n[1], 0.05);
    const f = st.f ? st.f(st.t) : 0, F0 = Math.max(1, st.V.F0), yb = g.Btop - 0.14;
    if (Math.abs(f) > 0.05){ const L = 0.2 * Math.abs(f) / F0; if (f > 0) o.fA.set([g.M[0], yb - 0.02, 0], [0, -L, 0]); else o.fA.set([g.M[0], yb - 0.02 - L, 0], [0, L, 0]); o.lf.visible = true; o.lf.position.set(g.M[0] + 0.14, yb - 0.12, 0.05); }
    else { o.fA.set([0, 0, 0], [0, 0, 0]); o.lf.visible = false; }
  }
});

/* ---------- 6.B.2  block A on a smooth ledge, B (3m) on a movable pulley, spring k from B to the ground ---------- */
view3d({
  id: 'x6b-2', size: 1.35, target: [-0.45, -0.48, 0], camera: [-0.25, 0.25, 1],
  build(H){
    const yg = -1.3, rF = 0.08;
    const fl = H.box(1.8, 0.04, 0.8, H.C.ground); fl.position.set(-0.45, yg - 0.02, 0);
    prism(H, [[-1.0, 0], [0, 0], [0, yg]], 0.4, '#8b8f98');
    const wall = H.box(0.05, 0.36 - yg, 0.4, H.C.wall); wall.position.set(-1.225, (0.36 + yg) / 2, 0);
    const strut = H.box(0.03, 0.03, 0.03, H.C.steel); const d = [0.1, -0.01 + 0.06], L = Math.hypot(...d);
    strut.scale.x = L / 0.03; strut.position.set(0.05, (-0.06 - 0.01) / 2, -0.04); strut.rotation.z = Math.atan2(d[1], d[0]);
    const pF = H.disk(rF, 0.04, H.C.steel); pF.position.set(0.1, -0.01, 0);
    const A = H.box(0.18, 0.14, 0.16, '#cfd8ea'), B = H.box(0.16, 0.16, 0.16, '#cfd8ea'), pM = H.disk(rF / 2, 0.035, H.C.steel), hang = H.box(0.012, 0.05, 0.012, H.C.dark);
    const s3 = spring(H, 0.03, 10, 0.005), sk = spring(H, 0.03, 8, 0.004), cab = H.cable([[0, 0, 0], [0, 1, 0]]);
    const lA = H.label('A'), lB = H.label('B'), l3 = H.label('3k'), lk = H.label('k');
    return { yg, rF, A, B, pM, hang, s3, sk, cab, lA, lB, l3, lk };
  },
  update(H, st, o){
    if (!st.cur) return; const x = st.cur.x, xA = -0.61 + x, yM = -0.45 - x / 2, Pc = [0.1, -0.01], M = [0.14, yM], btop = yM - 0.04 - 0.05;
    o.A.position.set(xA, 0.07, 0); o.s3.set([-1.2, 0.07, 0], [xA - 0.09, 0.07, 0]);
    o.pM.position.set(M[0], M[1], 0); o.hang.position.set(M[0], yM - 0.04 - 0.025, 0); o.B.position.set(M[0], btop - 0.08, 0);
    o.sk.set([M[0], btop - 0.16, 0], [M[0], o.yg, 0]);
    o.cab.set([[xA + 0.09, 0.07, 0]].concat(arcPts(Pc, o.rF, Math.PI / 2, 0, 0), arcPts(M, o.rF / 2, 0, -Math.PI, 0), [[Pc[0], Pc[1], 0]]));
    o.lA.position.set(xA, 0.23, 0.1); o.lB.position.set(M[0] + 0.16, btop - 0.08, 0.1); o.l3.position.set((xA - 1.2) / 2, 0.17, 0.05); o.lk.position.set(M[0] + 0.1, (btop - 0.16 + o.yg) / 2, 0.08);
  }
});

/* ---------- 6.B.3  block between two springs k above and a spring 3k below ---------- */
view3d({
  id: 'x6b-3', size: 1.3, target: [0, 0, 0], camera: [-0.4, 0.2, 1],
  build(H){
    const ce = H.box(0.9, 0.05, 0.5, H.C.wall), fl = H.box(0.9, 0.04, 0.5, H.C.ground);
    const posts = [-0.42, 0.42].map(xp => H.box(0.05, 1, 0.05, H.C.steel));
    const blk = H.box(0.5, 0.3, 0.3, '#cfd8ea');
    const s1 = spring(H, 0.04, 9, 0.006), s2 = spring(H, 0.04, 9, 0.006), s3 = spring(H, 0.05, 9, 0.007);
    const aA = H.arrow(H.C.red, 1), lm = H.label('m'), la = H.label('a', H.C.red), lk1 = H.label('k'), lk2 = H.label('k'), l3 = H.label('3k');
    return { ce, fl, posts, blk, s1, s2, s3, aA, lm, la, lk1, lk2, l3, L0: null };
  },
  update(H, st, o){
    if (!st.cur || !st.L0) return;
    if (o.L0 !== st.L0){ o.L0 = st.L0; o.yC = st.L0 + 0.15; o.yF = -(st.L0 + 0.15); o.ce.position.set(0, o.yC + 0.025, 0); o.fl.position.set(0, o.yF - 0.02, 0);
      o.posts.forEach((p, i) => { p.scale.y = o.yC - o.yF; p.position.set(i ? 0.42 : -0.42, (o.yC + o.yF) / 2, -0.2); }); }
    const yc = -st.cur.x; o.blk.position.set(0, yc, 0);
    o.s1.set([-0.17, o.yC, 0], [-0.17, yc + 0.15, 0]); o.s2.set([0.17, o.yC, 0], [0.17, yc + 0.15, 0]); o.s3.set([0, yc - 0.15, 0], [0, o.yF, 0]);
    const as = 0.3 / (st.wn * st.V.v0), a = st.cur.a * as; o.aA.set([-0.36, yc, 0.16], [0, -a, 0]); o.la.visible = Math.abs(a) > 0.03; o.la.position.set(-0.45, yc - a / 2, 0.16);
    o.lm.position.set(0, yc, 0.2); o.lk1.position.set(-0.27, (o.yC + yc) / 2 + 0.08, 0.05); o.lk2.position.set(0.27, (o.yC + yc) / 2 + 0.08, 0.05); o.l3.position.set(0.12, (yc - 0.15 + o.yF) / 2, 0.08);
  }
});

/* ---------- 6.B.4  light inverted bar pinned at O; two carts on platforms connected by links ---------- */
view3d({
  id: 'x6b-4', size: 1.25, target: [0, 0.5, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const L = 1, ch = 0.2, rw = 0.03, pf1 = L - ch / 2 - 2 * rw, pf2 = L / 2 - ch / 2 - 2 * rw;
    H.floor(-1.45, 1.45, 0.4, -0.08);
    const base = H.box(0.12, 0.08, 0.16, H.C.steel); base.position.set(0, -0.04, -0.06);
    const pinM = H.disk(0.015, 0.2, H.C.dark); pinM.position.set(0, 0, 0);
    // platforms (fixed) on columns, and walls
    const plat = (x0, x1, y) => { const p = H.box(x1 - x0, 0.04, 0.3, '#8b8f98'); p.position.set((x0 + x1) / 2, y - 0.02, 0);
      [x0 + 0.05, x1 - 0.05].forEach(xc => { const c = H.box(0.05, y + 0.08 - 0.04, 0.05, H.C.steel); c.position.set(xc, (y - 0.04 - 0.08) / 2, -0.1); }); };
    plat(0.3, 1.35, pf1); plat(-1.35, -0.3, pf2);
    const w1 = H.box(0.05, L + 0.25 - pf1 + 0.04, 0.3, H.C.wall); w1.position.set(1.375, (L + 0.25 + pf1 - 0.04) / 2, 0);
    const w2 = H.box(0.05, L / 2 + 0.25 - pf2 + 0.04, 0.3, H.C.wall); w2.position.set(-1.375, (L / 2 + 0.25 + pf2 - 0.04) / 2, 0);
    const bar = new H.THREE.Group(); H.add(bar); const bm = H.box(0.045, L, 0.045, '#d9dce2', bar); bm.position.y = L / 2;
    const cart = () => { const g = new H.THREE.Group(); H.add(g); H.box(0.3, ch, 0.18, '#cfd8ea', g);
      const wh = [-0.08, 0.08].flatMap(dx => [-0.07, 0.07].map(dz => { const w = H.disk(rw, 0.02, H.C.dark, g); w.position.set(dx, -ch / 2 - rw, dz); return w; })); return { g, wh }; };
    const c1 = cart(), c2 = cart();
    const l1 = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.008), l2 = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.008);
    const s1 = spring(H, 0.03, 10, 0.005), s2 = spring(H, 0.03, 10, 0.005);
    // pins through the bar (at the top and the middle) and on the front face of each cart carry the links, which run in front of everything
    const pins = [0, 1, 2, 3].map(() => H.disk(0.012, 0.22, H.C.dark));
    const lO = H.label('O'), lm1 = H.label('m'), lm2 = H.label('m');
    return { L, rw, bar, c1, c2, l1, l2, s1, s2, pins, lO, lm1, lm2 };
  },
  update(H, st, o){
    const g = st.geo; if (!g) return;
    o.bar.rotation.z = -g.ph;
    o.c1.g.position.set(g.c1[0], g.c1[1], 0); o.c2.g.position.set(g.c2[0], g.c2[1], 0);
    o.c1.wh.forEach(w => { w.rotation.z = -(g.c1[0] - 0.5) / o.rw; }); o.c2.wh.forEach(w => { w.rotation.z = -(g.c2[0] + 0.5) / o.rw; });
    o.l1.set([[g.T[0], g.T[1], 0.11], [g.c1[0], g.c1[1], 0.11]]); o.l2.set([[g.Mi[0], g.Mi[1], 0.11], [g.c2[0], g.c2[1], 0.11]]);
    [g.T, g.Mi, g.c1, g.c2].forEach((q, i) => o.pins[i].position.set(q[0], q[1], i < 2 ? 0.02 : 0.03));
    o.s1.set([g.c1[0] + 0.15, g.c1[1], 0], [1.35, g.c1[1], 0]); o.s2.set([-1.35, g.c2[1], 0], [g.c2[0] - 0.15, g.c2[1], 0]);
    o.lO.position.set(0.1, 0.06, 0.12); o.lm1.position.set(g.c1[0], g.c1[1] + 0.18, 0.1); o.lm2.position.set(g.c2[0], g.c2[1] + 0.18, 0.1);
  }
});

})();
