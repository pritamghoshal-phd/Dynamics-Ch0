/* 3D views for the Chapter 1 Section A examples (1.A.1 – 1.A.4). Each view reads the live state of the 2D clip with the same id.
   Conventions: x right, y up, z out of the screen. Lengths are scaled to a scene a few units across. */
(function(){
const T = () => THREE;
// a polyline (thin line) that can be updated
function polyline(H, color, opacity = 1, dashed = false){
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * 2), 3));
  const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.04, gapSize: 0.03, transparent: opacity < 1, opacity }) : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const L = new THREE.Line(g, m); H.add(L);
  return { obj: L, set(pts){ const a = new Float32Array(pts.length * 3); pts.forEach((p, i) => { a[3 * i] = p[0]; a[3 * i + 1] = p[1]; a[3 * i + 2] = p[2] || 0; });
    L.geometry.setAttribute('position', new THREE.BufferAttribute(a, 3)); L.geometry.computeBoundingSphere(); if (dashed) L.computeLineDistances(); } };
}
const setA = (a, o, v) => a.set(o, v);

/* ---------------------------------------------------------------- 1.A.1  pin in a fixed elliptical ring and a rising slot
   1 mm = 0.04 scene units. Ring center at (0, Yc, 0). */
view3d({
  id: 'x1a-1', size: 1.0, target: [-0.12, 0.62, 0], camera: [-0.55, 0.3, 1],
  build(H){
    const k = 0.04, Yc = 0.62;
    H.floor(-0.75, 0.55, 0.3);
    // fixed ring on a stand (rebuilt when a or b change)
    const ring = new THREE.Group(); H.add(ring);
    const stand = H.box(0.1, 0.18, 0.12, H.C.steel);
    // guide rod from the floor to a ceiling bracket, a slider and the slotted arm (in front of the ring)
    const rod = H.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 16), H.C.steel);
    const top = H.box(0.16, 0.03, 0.16, H.C.wall);
    const slider = H.box(0.07, 0.09, 0.07, H.C.body);
    const arm = new THREE.Group(); H.add(arm);
    const pin = H.mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 16).rotateX(Math.PI / 2), H.C.dark);
    const vP = H.arrow(H.C.blue, 0.5), aP = H.arrow(H.C.red, 0.5), vS = H.arrow(H.C.green, 0.45);
    const lP = H.label('P', '#1c1d21', 0.07), lv = H.label('v_P', H.C.blue, 0.07), la = H.label('a_P', H.C.red, 0.07), lvs = H.label('v', H.C.green, 0.07);
    return { k, Yc, ring, stand, rod, top, slider, arm, pin, vP, aP, vS, lP, lv, la, lvs, key: '' };
  },
  update(H, st, o){
    if (st.y === undefined || st.x === undefined) return;
    const { a, b, v } = st.V, k = o.k, Yc = o.Yc, key = a + '|' + b;
    if (key !== o.key){ o.key = key;
      while (o.ring.children.length) o.ring.remove(o.ring.children[0]);
      const t = H.ring(a * k, 0.011, 2 * Math.PI, H.C.dark, o.ring); t.scale.set(1, b / a, 1);
      o.ring.position.set(0, Yc, 0);
      const base = Yc - b * k; o.stand.scale.set(1, Math.max(0.1, base) / 0.18, 1); o.stand.position.set(0, base / 2, 0);
      const gx = (-a - 6) * k, top = Yc + (b + 2.4) * k;
      o.rod.scale.set(1, top, 1); o.rod.position.set(gx, top / 2, 0.05); o.top.position.set(gx, top + 0.015, 0.05);
      while (o.arm.children.length) o.arm.remove(o.arm.children[0]);
      const L = (2 * a + 7.5) * k;
      [-0.016, 0.016].forEach(dy => { const r = H.box(L, 0.012, 0.03, '#d9c58c', o.arm); r.position.set(L / 2, dy, 0); });
      o.gx = gx; o.L = L;
    }
    const Y = Yc + st.y * k, X = st.x * k;
    o.slider.position.set(o.gx, Y, 0.05); o.arm.position.set(o.gx + 0.035, Y, 0.06);
    o.pin.position.set(X, Y, 0.03);
    const kv = 0.004, ka = 0.0016;                     // scene units per mm/s and per mm/s²
    setA(o.vP, [X, Y, 0.1], [st.xd * kv, v * kv, 0]); setA(o.aP, [X, Y, 0.1], [st.xdd * ka, 0, 0]);
    setA(o.vS, [o.gx - 0.07, Y - 0.06, 0.05], [0, 0.12, 0]);
    o.lP.position.set(X - 0.05, Y + 0.05, 0.1);
    o.lv.position.set(X + st.xd * kv * 1.1 + 0.02, Y + v * kv * 1.1, 0.1);
    o.la.position.set(X + st.xdd * ka + 0.05, Y - 0.04, 0.1);
    o.lvs.position.set(o.gx - 0.1, Y + 0.03, 0.05);
  }
});

/* ---------------------------------------------------------------- 1.A.2  particle with x = t³ + 10, y = 2 cos 4t (in)
   The path is drawn on a vertical board. 1 in = 0.1 scene units, x measured from x = 10 in. */
const A2 = t => ({ p: [t ** 3 + 10, 2 * Math.cos(4 * t)], v: [3 * t * t, -8 * Math.sin(4 * t)], a: [6 * t, -32 * Math.cos(4 * t)] });
view3d({
  id: 'x1a-2', size: 1.2, target: [0.7, 0.5, 0], camera: [-0.3, 0.25, 1],
  build(H){
    const k = 0.1, X = x => (x - 10) * k, Y = y => 0.5 + y * k;
    H.floor(-0.2, 1.6, 0.35);
    const board = H.box(1.7, 0.75, 0.02, '#f3eee2'); board.position.set(0.7, 0.5, -0.03);
    [0.02, 1.38].forEach(x => { const leg = H.box(0.04, 0.2, 0.04, H.C.steel); leg.position.set(x, 0.06, -0.03); });
    const pts = []; for (let i = 0; i <= 300; i++){ const t = 2.35 * i / 300, q = A2(t).p; pts.push(new THREE.Vector3(X(q[0]), Y(q[1]), 0)); }
    H.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.006, 8), '#8b8f98');
    const axis = polyline(H, 0x9aa0a8); axis.set([[X(9.5), Y(0), -0.015], [X(24), Y(0), -0.015]]);
    const P = H.sphere(0.025, H.C.blue);
    const v = H.arrow(H.C.orange, 0.5), a = H.arrow(H.C.red, 0.5);
    const lP = H.label('P', '#1c1d21', 0.07), lv = H.label('v', H.C.orange, 0.07), la = H.label('a', H.C.red, 0.07);
    [10, 14, 18, 22].forEach(xx => { const l = H.label(xx + ' in', '#7b808c', 0.045); l.position.set(X(xx), Y(-3.2), 0); });
    return { X, Y, P, v, a, lP, lv, la };
  },
  update(H, st, o){
    if (st.tau === undefined) return;
    const { p, v, a } = A2(st.tau), x = o.X(p[0]), y = o.Y(p[1]);
    o.P.position.set(x, y, 0.01);
    const cl = (u, k, m) => { const L = Math.hypot(u[0], u[1]) * k, f = L > m ? m / L : 1; return [u[0] * k * f, u[1] * k * f, 0]; };
    const vv = cl(v, 0.016, 0.3), aa = cl(a, 0.012, 0.3);
    o.v.set([x, y, 0.02], vv); o.a.set([x, y, 0.02], aa);
    o.lP.position.set(x - 0.04, y - 0.05, 0.03); o.lv.position.set(x + vv[0] * 1.15, y + vv[1] * 1.15, 0.03); o.la.position.set(x + aa[0] * 1.15, y + aa[1] * 1.15, 0.03);
  }
});

/* ---------------------------------------------------------------- 1.A.3  jet on a curving path
   1 km = 1 scene unit. The path (from the 2D clip state) lies in a vertical plane above the ground. */
function jetMesh(H){
  const g = new THREE.Group(); H.add(g); const c = '#8f97a6';
  const body = H.mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.09, 16).rotateZ(-Math.PI / 2), c, g);
  const nose = H.mesh(new THREE.ConeGeometry(0.008, 0.025, 16).rotateZ(-Math.PI / 2), c, g); nose.position.x = 0.057;
  const wing = H.box(0.03, 0.003, 0.09, c, g); wing.position.x = -0.002;
  const tail = H.box(0.015, 0.003, 0.035, c, g); tail.position.x = -0.04;
  const fin = H.box(0.016, 0.022, 0.003, c, g); fin.position.set(-0.04, 0.012, 0);
  g.scale.setScalar(2.6); return g;
}
view3d({
  id: 'x1a-3', size: 1.2, target: [0.85, 0.35, 0], camera: [-0.25, 0.25, 1],
  build(H){
    const ground = H.box(2.6, 0.02, 1.0, '#cfd6c4'); ground.position.set(0.85, -0.25, 0);
    const path = polyline(H, 0x5b5a55); const circ = polyline(H, 0x8a3fd1, 0.5);
    const jet = jetMesh(H);
    const at = H.arrow(H.C.green, 0.5), an = H.arrow(H.C.green, 0.5), aa = H.arrow(H.C.red, 0.6);
    const C = H.sphere(0.008, H.C.purple);
    const A = H.sphere(0.008, '#1c1d21');
    const lA = H.label('A', '#1c1d21', 0.06), lC = H.label('C', H.C.purple, 0.05), lt = H.label('a_t', H.C.green, 0.05), ln = H.label('a_n', H.C.green, 0.05), la = H.label('a', H.C.red, 0.06);
    return { path, circ, jet, at, an, aa, C, A, lA, lC, lt, ln, la, last: null };
  },
  update(H, st, o){
    if (!st.path || st.s === undefined) return;
    const k = 0.001, pth = st.path;
    if (o.last !== pth){ o.last = pth; o.path.set(pth.map(p => [p[0] * k, p[1] * k, 0]));
      const n = pth.length - 1, f = st.sA / st.sEnd * n, i = Math.floor(f), q = pth[i]; o.A.position.set(q[0] * k, q[1] * k, 0); o.lA.position.set(q[0] * k + 0.04, q[1] * k - 0.05, 0); }
    const n = pth.length - 1, f = Math.max(0, Math.min(n, st.s / st.sEnd * n)), i = Math.min(n - 1, Math.floor(f)), u = f - i, p = pth[i], q = pth[i + 1];
    const x = (p[0] + (q[0] - p[0]) * u) * k, y = (p[1] + (q[1] - p[1]) * u) * k, th = p[2] + (q[2] - p[2]) * u;
    o.jet.position.set(x, y, 0); o.jet.rotation.set(0, 0, th);
    const kap = st.kA * st.s / st.sA, v = st.sp, an = v * v * kap, at = st.at, et = [Math.cos(th), Math.sin(th)], en = [-Math.sin(th), Math.cos(th)], ka = 0.013;
    o.at.set([x, y, 0.01], [at * et[0] * ka, at * et[1] * ka, 0]); o.an.set([x, y, 0.01], [an * en[0] * ka, an * en[1] * ka, 0]);
    o.aa.set([x, y, 0.01], [(at * et[0] + an * en[0]) * ka, (at * et[1] + an * en[1]) * ka, 0]);
    o.lt.position.set(x + at * et[0] * ka + et[0] * 0.05, y + at * et[1] * ka + et[1] * 0.05, 0.01);
    o.ln.position.set(x + an * en[0] * ka * 0.55 - et[0] * 0.05, y + an * en[1] * ka * 0.55 - et[1] * 0.05, 0.01);
    o.la.position.set(x + (at * et[0] + an * en[0]) * ka * 1.12 + et[0] * 0.03, y + (at * et[1] + an * en[1]) * ka * 1.12 + et[1] * 0.03, 0.01);
    if (kap > 1e-6){ const rho = 1 / kap * k, cx = x + rho * en[0], cy = y + rho * en[1], pts = [];
      for (let j = 0; j <= 120; j++){ const a = 2 * Math.PI * j / 120; pts.push([cx + rho * Math.cos(a), cy + rho * Math.sin(a), 0]); }
      o.circ.set(pts); o.circ.obj.visible = true; const near = rho < 1.4; o.C.visible = near; o.lC.visible = near;   // C is labelled only while it is near the path o.C.position.set(cx, cy, 0); o.lC.position.set(cx + 0.04, cy + 0.04, 0);
    } else { o.circ.obj.visible = false; o.C.visible = false; o.lC.visible = false; }
  }
});

/* ---------------------------------------------------------------- 1.A.4  spiral r = kθ, drawn flat on a table (the plane of the motion is horizontal)
   2D (x, y) → 3D (x, h, −y). 1 m = s scene units, with s chosen so the spiral fits. */
view3d({
  id: 'x1a-4', size: 1.4, target: [-0.1, 0.35, 0], camera: [-0.15, 0.85, 1],
  build(H){
    const h = 0.4;
    const top = H.mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.04, 64), '#efe8d6'); top.position.set(-0.1, h - 0.02, 0.05);
    const leg = H.mesh(new THREE.CylinderGeometry(0.06, 0.09, h - 0.04, 24), H.C.steel); leg.position.set(-0.1, (h - 0.04) / 2, 0.05);
    const ax = polyline(H, 0x9aa0a8); const ay = polyline(H, 0x9aa0a8);
    const spiral = polyline(H, 0x8b8f98, 0.9, true);
    const rad = polyline(H, 0x2457d6);
    const A = H.sphere(0.03, H.C.blue), O = H.sphere(0.012, '#1c1d21');
    const v = H.arrow(H.C.orange, 0.5), a = H.arrow(H.C.red, 0.5), er = H.arrow(H.C.purple, 0.35), et = H.arrow(H.C.purple, 0.35);
    const lA = H.label('A', '#1c1d21', 0.08), lO = H.label('O', '#1c1d21', 0.07), lv = H.label('v', H.C.orange, 0.08), la = H.label('a', H.C.red, 0.08), ler = H.label('ê_r', H.C.purple, 0.07), let_ = H.label('ê_{θ}', H.C.purple, 0.07);
    const lx = H.label('x', '#7b808c', 0.06), ly = H.label('y', '#7b808c', 0.06);
    return { h, ax, ay, spiral, rad, A, O, v, a, er, et, lA, lO, lv, la, ler, let_, lx, ly, key: '' };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const { k, w: om } = st.V, R = k * 1.6 * Math.PI, s = 0.85 / R, h = o.h + 0.005, M = (x, y) => [x * s, h, -y * s];
    if (o.key !== String(k)){ o.key = String(k);
      const pts = []; for (let i = 0; i <= 300; i++){ const u = 1.6 * Math.PI * i / 300; pts.push(M(k * u * Math.cos(u), k * u * Math.sin(u))); } o.spiral.set(pts);
      o.ax.set([M(-R * 1.05, 0), M(R * 0.7, 0)]); o.ay.set([M(0, -R * 0.9), M(0, R * 0.7)]);
      o.lx.position.set(...M(R * 0.76, 0)); o.ly.position.set(...M(0, R * 0.76)); o.O.position.set(...M(0, 0)); o.lO.position.set(...M(-0.05 * R, -0.07 * R));
    }
    const th = st.th, r = k * th, rd = k * om, c = Math.cos(th), sn = Math.sin(th);
    const p = [r * c, r * sn], er = [c, sn], et = [-sn, c], vp = [rd, r * om], ap = [-r * om * om, 2 * rd * om];
    const v = [vp[0] * er[0] + vp[1] * et[0], vp[0] * er[1] + vp[1] * et[1]], a = [ap[0] * er[0] + ap[1] * et[0], ap[0] * er[1] + ap[1] * et[1]];
    const P = M(...p); o.A.position.set(P[0], P[1] + 0.02, P[2]); o.rad.set([M(0, 0), P]);
    const V3 = (u, f) => [u[0] * f, 0, -u[1] * f], Pt = [P[0], P[1] + 0.02, P[2]];
    const fv = 0.3 / (k * om * Math.PI) * R * s, fa = 0.3 / (k * om * om * Math.PI) * R * s;
    o.v.set(Pt, V3(v, fv)); o.a.set(Pt, V3(a, fa)); o.er.set(Pt, V3(er, 0.16)); o.et.set(Pt, V3(et, 0.16));
    const L = (lab, u, f) => lab.position.set(Pt[0] + u[0] * f * 1.15, Pt[1] + 0.03, Pt[2] - u[1] * f * 1.15);
    L(o.lv, v, fv); L(o.la, a, fa); L(o.ler, er, 0.16); L(o.let_, et, 0.16);
    o.lA.position.set(Pt[0] - 0.06, Pt[1] + 0.08, Pt[2]);
  }
});

})();
