/* 3D views for the Chapter 1, Section C examples (1.C.1 – 1.C.4).
   Each view reads st.cur (and the stored path) from the 2D clip with the same id, so both views show the same motion. */
(function(){

// a polyline (THREE.Line) whose points can be replaced; dashed = true gives a dashed line
function polyline(H, color, dashed, parent, width){
  const T = H.THREE, geo = new T.BufferGeometry();
  const mat = dashed ? new T.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08 }) : new T.LineBasicMaterial({ color, linewidth: width || 1 });
  const ln = new T.Line(geo, mat); (parent || H.group()).add(ln);
  return { obj: ln, set(pts){ const a = new Float32Array(pts.length * 3); pts.forEach((p, i) => { a[3 * i] = p[0]; a[3 * i + 1] = p[1]; a[3 * i + 2] = p[2] || 0; });
    geo.setAttribute('position', new T.BufferAttribute(a, 3)); geo.setDrawRange(0, pts.length); geo.computeBoundingSphere(); if (dashed) ln.computeLineDistances(); },
    range(n){ geo.setDrawRange(0, n); } };
}
// a unit circle (LineLoop) in the x–y plane; scale it to the radius
function circleLine(H, color, parent){
  const T = H.THREE, pts = []; for (let k = 0; k < 160; k++){ const a = 2 * Math.PI * k / 160; pts.push(new T.Vector3(Math.cos(a), Math.sin(a), 0)); }
  const ln = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color, dashSize: 0.02, gapSize: 0.02, transparent: true, opacity: 0.8 }));
  ln.computeLineDistances(); (parent || H.group()).add(ln); return ln;
}
const up = (H, v) => new H.THREE.Quaternion().setFromUnitVectors(new H.THREE.Vector3(0, 1, 0), new H.THREE.Vector3(v[0], v[1], v[2] || 0).normalize());

/* ---------- 1.C.1: rocket on its trajectory (1 unit = 50 000 ft; the rocket itself is drawn much larger than to scale) ---------- */
view3d({
  id: 'x1c-1', size: 8.5, target: [0, 0, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const T = H.THREE, G = new T.Group(); H.add(G);
    const floor = H.box(12, 0.04, 4, H.C.ground, G); floor.castShadow = false;
    const full = polyline(H, 0x8b8f98, true, G), done = polyline(H, 0x24406e, false, G);
    const osc = circleLine(H, 0x8a3fd1, G);
    const rocket = new T.Group(); G.add(rocket);
    H.mesh(new T.CylinderGeometry(0.07, 0.07, 0.42, 24), '#d9d4c6', rocket);
    const nose = H.mesh(new T.ConeGeometry(0.07, 0.16, 24), H.C.red, rocket); nose.position.y = 0.29;
    [0, 1, 2, 3].forEach(k => { const fin = H.box(0.012, 0.12, 0.09, H.C.dark, rocket); fin.position.set(0.07 * Math.cos(k * Math.PI / 2), -0.17, 0.07 * Math.sin(k * Math.PI / 2)); fin.rotation.y = -k * Math.PI / 2; });
    const plume = H.mesh(new T.ConeGeometry(0.06, 0.3, 20), H.C.orange, rocket); plume.rotation.x = Math.PI; plume.position.y = -0.36; plume.material.emissive = new T.Color(0xc2410c); plume.material.emissiveIntensity = 0.6;
    rocket.scale.setScalar(2.4);
    const toC = polyline(H, 0x8a3fd1, true, G);
    const aEt = H.arrow(H.C.orange, 1), aEn = H.arrow(H.C.purple, 1), aA = H.arrow(H.C.red, 1), aG = H.arrow(H.C.green, 1);
    const lEt = H.label('ê_t', H.C.orange), lEn = H.label('ê_n', H.C.purple), lA = H.label('a', H.C.red), lG = H.label('g', H.C.green), lC = H.label('center of curvature', '#8a3fd1', 0.14);
    const l0 = H.label('τ = 0', '#7b808c', 0.12), m0 = H.sphere(0.03, H.C.dark, G);
    return { G, floor, full, done, osc, rocket, plume, toC, aEt, aEn, aA, aG, lEt, lEn, lA, lG, lC, l0, m0, ref: null, U: 1 / 50000 };
  },
  update(H, st, o){
    const c = st.cur; if (!c || !st.path) return; const U = o.U;
    if (o.ref !== st.path){ o.ref = st.path;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; st.path.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      o.cx = (x0 + x1) / 2 * U; o.cy = (y0 + y1) / 2 * U; o.G.position.set(-o.cx, -o.cy, 0);
      o.floor.position.set(o.cx, y0 * U - 0.6, 0); o.floor.scale.x = Math.max(1, ((x1 - x0) * U + 3) / 12);
      const pts = st.path.map(p => [p[0] * U, p[1] * U, 0]); o.full.set(pts); o.done.set(pts);
      const i0 = Math.round(st.T / st.h); o.m0.position.set(st.path[i0][0] * U, st.path[i0][1] * U, 0); }
    const i = Math.max(1, Math.min(st.path.length, Math.round((c.tau + st.T) / st.h) + 1)); o.done.range(i);
    const P = [c.p[0] * U, c.p[1] * U, 0], W = v => [v[0] - o.cx, v[1] - o.cy, v[2] || 0];   // W: group coordinates → world (for arrows and labels)
    o.rocket.position.set(...P); o.rocket.quaternion.copy(up(H, c.et)); o.plume.scale.y = 0.8 + 0.3 * Math.sin(performance.now() / 60);
    const C = [P[0] + c.rho * U * c.en[0], P[1] + c.rho * U * c.en[1], 0]; o.osc.position.set(...C); o.osc.scale.set(c.rho * U, c.rho * U, 1);
    o.toC.set([P, C]);
    const ka = 0.07, wp = W(P);
    o.aEt.set(wp, [c.et[0] * 1.6, c.et[1] * 1.6, 0]); o.aEn.set(wp, [c.en[0] * 1.6, c.en[1] * 1.6, 0]);
    o.aA.set(wp, [c.a[0] * ka, c.a[1] * ka, 0]); o.aG.set([wp[0], wp[1], 0.25], [0, -st.V.g * ka, 0]);
    o.lEt.position.set(wp[0] + c.et[0] * 1.85, wp[1] + c.et[1] * 1.85, 0); o.lEn.position.set(wp[0] + c.en[0] * 1.85, wp[1] + c.en[1] * 1.85, 0);
    o.lA.position.set(wp[0] + c.a[0] * ka * 1.2, wp[1] + c.a[1] * ka * 1.2 + 0.1, 0.1); o.lG.position.set(wp[0] + 0.15, wp[1] - st.V.g * ka - 0.15, 0.25);
    const wc = W([P[0] + Math.min(c.rho * U, 3) * c.en[0], P[1] + Math.min(c.rho * U, 3) * c.en[1], 0]); o.lC.position.set(wc[0], wc[1] - 0.15, 0);
    const w0 = W([o.m0.position.x, o.m0.position.y, 0]); o.l0.position.set(w0[0] - 0.3, w0[1] + 0.15, 0);
  }
});

/* ---------- 1.C.2: two slotted guides on a back plate (metres, true size) ---------- */
view3d({
  id: 'x1c-2', size: 0.55, target: [0, -0.02, 0], camera: [-0.45, 0.3, 1],
  build(H){
    const T = H.THREE, yF = -0.29;
    H.floor(-0.45, 0.45, 0.25, yF);
    const back = H.box(0.62, 0.52, 0.02, '#e7e1d2'); back.position.set(0, -0.03, -0.07);
    // side rails for guide B and the bottom rail for guide A, each held off the back plate by two brackets
    [-0.245, 0.245].forEach(x => { const r = H.mesh(new T.CylinderGeometry(0.006, 0.006, 0.42, 16), H.C.steel); r.position.set(x, 0, 0.025);
      [-0.21, 0.21].forEach(y => { const b = H.box(0.03, 0.02, 0.1, H.C.steel); b.position.set(x, y, -0.02); }); });
    const rb = H.mesh(new T.CylinderGeometry(0.006, 0.006, 0.52, 16), H.C.steel); rb.rotation.z = Math.PI / 2; rb.position.set(0, -0.225, 0.0);
    [-0.23, 0.23].forEach(x => { const b = H.box(0.02, 0.03, 0.08, H.C.steel); b.position.set(x, -0.225, -0.03); });
    // guide A: vertical slotted bar on a carriage that rolls on the bottom rail
    const A = new T.Group(); H.add(A);
    [-0.0095, 0.0095].forEach(dx => { const s = H.box(0.009, 0.4, 0.012, '#e9e1c8', A); s.position.set(dx, -0.01, 0); });
    [0.19, -0.205].forEach(y => { const e = H.box(0.028, 0.012, 0.012, '#e9e1c8', A); e.position.set(0, y, 0); });
    const car = H.box(0.06, 0.02, 0.03, '#bfb9aa', A); car.position.set(0, -0.214, 0.0);
    // guide B: horizontal slotted bar whose end blocks slide on the side rails
    const B = new T.Group(); H.add(B);
    [-0.0095, 0.0095].forEach(dy => { const s = H.box(0.47, 0.009, 0.012, '#d9d4c6', B); s.position.set(0, dy, 0.025); });
    [-0.245, 0.245].forEach(x => { const e = H.box(0.024, 0.04, 0.03, '#bfb9aa', B); e.position.set(x, 0, 0.025); });
    // the pin passes through both slots
    const pin = new T.Group(); H.add(pin);
    const shaft = H.disk(0.0065, 0.07, H.C.blue, pin); shaft.position.z = 0.015;
    const head = H.disk(0.012, 0.006, H.C.blue, pin); head.position.z = 0.05;
    const trace = polyline(H, 0x8b8f98, true), done = polyline(H, 0x24406e, false), osc = circleLine(H, 0x8a3fd1);
    const aV = H.arrow(H.C.orange, 0.35), aA = H.arrow(H.C.red, 0.35);
    const lA = H.label('A', '#1c1d21', 0.04), lB = H.label('B', '#1c1d21', 0.04), lP = H.label('P', H.C.blue, 0.04), lV = H.label('v_P', H.C.orange, 0.035), lAc = H.label('a_P', H.C.red, 0.035);
    return { A, B, pin, trace, done, osc, aV, aA, lA, lB, lP, lV, lAc, ref: null };
  },
  update(H, st, o){
    const c = st.cur; if (!c || !st.trace) return;
    if (o.ref !== st.trace){ o.ref = st.trace; const pts = st.trace.map(q => [q[1], q[2], 0.06]); o.trace.set(pts); o.done.set(pts); }
    let n = 0; st.trace.forEach(q => { if (q[0] <= c.t) n++; }); o.done.range(Math.max(1, n));
    const [x, y] = c.p; o.A.position.x = x; o.B.position.y = y; o.pin.position.set(x, y, 0);
    if (isFinite(c.rho) && c.rho < 2){ o.osc.visible = true; o.osc.position.set(x + c.rho * c.en[0], y + c.rho * c.en[1], 0.06); o.osc.scale.set(c.rho, c.rho, 1); } else o.osc.visible = false;
    const kv = 0.4, ka = 0.11, P = [x, y, 0.065];
    o.aV.set(P, [c.v[0] * kv, c.v[1] * kv, 0]); o.aA.set(P, [c.a[0] * ka, c.a[1] * ka, 0]);
    o.lV.position.set(x + c.v[0] * kv * 1.15, y + c.v[1] * kv * 1.15 - 0.012, 0.07); o.lAc.position.set(x + c.a[0] * ka * 1.2, y + c.a[1] * ka * 1.2 + 0.015, 0.07);
    o.lP.position.set(x - 0.025, y + 0.025, 0.07); o.lA.position.set(x + 0.04, -0.19, 0.03); o.lB.position.set(-0.2, y + 0.03, 0.05);
  }
});

/* ---------- 1.C.3: a bead on a turning arm traces the spiral r = 4 + 2θ (metres; the floor is the x–y plane of the 2D view) ---------- */
view3d({
  id: 'x1c-3', size: 14, target: [0, 0, 0], camera: [-0.3, 0.75, 1],
  build(H){
    const T = H.THREE, hA = 0.8;
    H.floor(-20, 20, 18);
    const post = H.mesh(new T.CylinderGeometry(0.35, 0.5, hA + 0.3, 24), H.C.steel); post.position.set(0, (hA + 0.3) / 2, 0);
    const arm = new T.Group(); arm.position.y = hA; H.add(arm);
    const bar = H.box(1, 0.18, 0.3, '#c9a46a', arm); bar.geometry.translate(0.5, 0, 0);   // scaled to length r each frame
    const bead = H.sphere(0.55, H.C.blue);
    const spiral = polyline(H, 0x8b8f98, true), done = polyline(H, 0x24406e, false);
    const pts = []; for (let k = 0; k <= 200; k++){ const q = 2 * Math.PI * k / 200, r = 4 + 2 * q; pts.push([r * Math.cos(q), 0.03, -r * Math.sin(q)]); }
    spiral.set(pts); done.set(pts);
    const aV = H.arrow(H.C.orange, 6), aA = H.arrow(H.C.red, 6), aR = H.arrow('#7b808c', 4), aT = H.arrow('#7b808c', 4);
    const lO = H.label('O', '#1c1d21', 1.2), lP = H.label('P', H.C.blue, 1.2), lV = H.label('v', H.C.orange, 1.2), lA = H.label('a', H.C.red, 1.2), lR = H.label('ê_r', '#7b808c', 1.0), lT = H.label('ê_θ', '#7b808c', 1.0);
    lO.position.set(-1.2, 1.6, 1.2);
    return { arm, bar, bead, done, aV, aA, aR, aT, lP, lV, lA, lR, lT, hA, pts };
  },
  update(H, st, o){
    const c = st.cur; if (!c) return; const th = c.th, r = c.r, h = o.hA;
    o.arm.rotation.y = th; o.bar.scale.x = r + 0.6;
    const P = [r * Math.cos(th), h + 0.55, -r * Math.sin(th)], W = v => [v[0], 0, -v[1]];   // 2D (x, y) → floor (x, −z)
    o.bead.position.set(...P);
    o.done.range(Math.max(1, Math.round(th / (2 * Math.PI) * 200) + 1));
    const kv = 0.18, ka = 0.07, v = W(c.v), a = W(c.a), er = W(c.er), ee = W(c.ee);
    o.aV.set(P, v.map(q => q * kv)); o.aA.set(P, a.map(q => q * ka)); o.aR.set(P, er.map(q => q * 2.6)); o.aT.set(P, ee.map(q => q * 2.6));
    const L = (lab, d, k) => lab.position.set(P[0] + d[0] * k, P[1] + 0.6, P[2] + d[2] * k);
    L(o.lV, v, kv * 1.15); L(o.lA, a, ka * 1.15); L(o.lR, er, 3.3); L(o.lT, ee, 3.3); o.lP.position.set(P[0], P[1] + 1.4, P[2]);
  }
});

/* ---------- 1.C.4: airplane through the bottom of a loop, tracked by a radar dish (1 unit = 100 m) ---------- */
view3d({
  id: 'x1c-4', size: 11, target: [8.5, 4, 0], camera: [-0.2, 0.25, 1],
  build(H){
    const T = H.THREE, U = 0.01;
    H.floor(-3, 21, 7);
    // radar: a base on the ground, a yoke that turns about the vertical axis, and a dish that tilts to elevation θ
    const base = H.mesh(new T.CylinderGeometry(0.35, 0.5, 0.5, 24), H.C.steel); base.position.set(0, 0.25, 0);
    const yoke = new T.Group(); yoke.position.set(0, 0.6, 0); H.add(yoke);
    const dish = new T.Group(); yoke.add(dish);
    const bowl = H.mesh(new T.SphereGeometry(0.55, 32, 16, 0, 2 * Math.PI, 0, Math.PI / 3), '#d9d4c6', dish); bowl.material.side = T.DoubleSide; bowl.rotation.z = -Math.PI / 2; bowl.position.x = -0.35;
    const feed = H.bar(0.5, 0.04, H.C.dark, dish); feed.position.x = -0.1;
    // the airplane
    const plane = new T.Group(); H.add(plane);
    const body = H.mesh(new T.CylinderGeometry(0.11, 0.07, 1.2, 16), '#24406e', plane); body.rotation.z = -Math.PI / 2;
    const nose = H.mesh(new T.ConeGeometry(0.11, 0.25, 16), '#24406e', plane); nose.rotation.z = -Math.PI / 2; nose.position.x = 0.72;
    H.box(0.32, 0.03, 1.5, '#3a5a90', plane).position.set(0.05, 0, 0);
    H.box(0.2, 0.025, 0.55, '#3a5a90', plane).position.set(-0.5, 0, 0);
    H.box(0.2, 0.3, 0.025, '#3a5a90', plane).position.set(-0.52, 0.15, 0);
    plane.scale.setScalar(2.2); base.scale.setScalar(2); yoke.scale.setScalar(2); yoke.position.y = 1.1;
    // the loop (a dashed arc of radius ρ), the line of sight and the vectors
    const loop = polyline(H, 0x8b8f98, true), sight = polyline(H, 0x24406e, true);
    const aV = H.arrow(H.C.orange, 3), aA = H.arrow(H.C.red, 3);
    const lO = H.label('O', '#1c1d21', 0.5), lP = H.label('P', '#24406e', 0.5), lr = H.label('r', '#24406e', 0.5), lV = H.label('v_P', H.C.orange, 0.45), lA = H.label('a_P', H.C.red, 0.45);
    lO.position.set(-0.6, 0.3, 0.8);
    return { U, dish, yoke, plane, loop, sight, aV, aA, lP, lr, lV, lA, rho: null };
  },
  update(H, st, o){
    const c = st.cur; if (!c) return; const U = o.U, V = st.V;
    if (o.rho !== V.rho){ o.rho = V.rho; const pts = []; for (let k = 0; k <= 120; k++){ const u = -0.7 + 1.4 * k / 120; pts.push([(800 + V.rho * Math.sin(u)) * U, (600 + V.rho - V.rho * Math.cos(u)) * U, 0]); } o.loop.set(pts); }
    const P = [c.p[0] * U, c.p[1] * U, 0];
    o.plane.position.set(...P); o.plane.rotation.z = Math.atan2(c.v[1], c.v[0]);
    o.dish.rotation.z = Math.atan2(P[1] - 1.1, P[0]);
    o.sight.set([[0, 1.1, 0], P]);
    o.aV.set(P, [c.v[0] * 0.045, c.v[1] * 0.045, 0]); const am = Math.hypot(c.a[0], c.a[1]) || 1; o.aA.set(P, [c.a[0] / am * 2.6, c.a[1] / am * 2.6, 0]);
    o.lP.position.set(P[0] - 0.3, P[1] - 1.2, 0.3); o.lr.position.set(P[0] / 2 - 0.4, P[1] / 2 + 0.4, 0);
    o.lV.position.set(P[0] + c.v[0] * 0.045 + 0.6, P[1] + c.v[1] * 0.045, 0); o.lA.position.set(P[0] + c.a[0] / am * 3 + 0.3, P[1] + c.a[1] / am * 3, 0);
  }
});

})();
