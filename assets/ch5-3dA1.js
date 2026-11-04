/* 3D views for examples 5.A.1 – 5.A.8. Each view reads the live state of the 2D clip with the same id,
   so the two pictures always show the same motion. Units are metres except in 5.A.7 (feet, as in the book).
   Forces are drawn in the plane of the motion. Where that plane is hidden inside a body (crate, car), the force
   arrows and G are drawn on the near face, the way a textbook projects them onto the side view. */
(function(){
const V3 = (...a) => new THREE.Vector3(...a);
// cylinder of radius r between two points a and b (arrays) inside a parent
function place(m, a, b){ const A = V3(...a), B = V3(...b); m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, Math.max(A.distanceTo(B), 1e-4), 1); m.quaternion.setFromUnitVectors(V3(0, 1, 0), B.clone().sub(A).normalize()); return m; }
function seg(H, parent, a, b, r, color){ const m = H.mesh(new THREE.CylinderGeometry(r, r, 1, 12), color, parent); return place(m, a, b); }
// a dashed straight line made of short cylinders (reference lines)
function dashed(H, parent, a, b, r, color, dash = 0.05){
  const A = V3(...a), B = V3(...b), L = A.distanceTo(B), n = Math.max(1, Math.floor(L / (2 * dash)));
  for (let i = 0; i < n; i++){ const p = A.clone().lerp(B, (2 * i) / (2 * n)), q = A.clone().lerp(B, (2 * i + 1) / (2 * n)); seg(H, parent, p.toArray(), q.toArray(), r, color).castShadow = false; }
}
// plain floor without a grid plus stripes that scroll, for views that follow a moving body
function road(H, x0, x1, z, sp, color = '#d8d4c8'){
  const f = H.box(x1 - x0, 0.04 * sp, 2 * z, color); f.position.set((x0 + x1) / 2, -0.02 * sp, 0); f.castShadow = false;
  const g = H.group(), n = Math.ceil((x1 - x0) / sp) + 2;
  for (let i = 0; i < n; i++){ const s = H.box(0.06 * sp, 0.004 * sp, 2 * z, '#a9a395', g); s.position.set(x0 + i * sp, 0.002 * sp, 0); s.castShadow = false; }
  return { g, set(X){ g.position.x = -(((X % sp) + sp) % sp); } };
}
// moment arrow: an arc of radius r around (x, y) at depth z, arrowhead pointing clockwise if cw
function momentArc(H, x, y, z, r, color, cw = true, tube = 0.015){
  const g = H.group(), s = 0.25 * Math.PI, a = 1.4 * Math.PI;
  H.ring(r, tube, a, color, g, s).position.set(0, 0, 0);
  const head = H.mesh(new THREE.ConeGeometry(tube * 3, tube * 8, 16), color, g);
  const ang = cw ? s : s + a, dir = cw ? V3(Math.sin(ang), -Math.cos(ang), 0) : V3(-Math.sin(ang), Math.cos(ang), 0);
  head.position.set(r * Math.cos(ang), r * Math.sin(ang), 0); head.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
  g.position.set(x, y, z); g.userData.avoid = true; return g;
}
// force arrows are drawn on top of everything, so a normal force pushing up through an opaque floor stays visible
function farrow(H, color, scale){ const a = H.arrow(color, scale); [a.obj.line, a.obj.cone].forEach(o => { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 8; }); return a; }
const lab = (H, t, color, size = 0.16) => H.label(t, color, size * 1.4);
const put = (sp, x, y, z = 0, show = true) => { sp.position.set(x, y, z); sp.visible = show; };

/* ---------------------------------------------------------
   5.A.1  Crate sliding on two runners (feet A at the front, B at the rear), b = 0.4 m, height 2d = 0.8 (d/b) m.
   --------------------------------------------------------- */
view3d({
  id: 'xa-1', size: 1.75, target: [0.75, 0.5, 0], camera: [-0.35, 0.35, 1],
  build(H){
    H.floor(-1.2, 4.6, 0.9);
    const b = 0.4, foot = 0.073, D = 0.8, zF = D / 2 + 0.02, C = H.C;
    const crate = H.group(), body = H.box(1, 1, D, C.wood, crate);
    const runners = [-b, b].map(x => { const r = H.box(0.12, foot, D, '#8a6a3a', crate); r.position.set(x, foot / 2, 0); return r; });
    const slats = [0.25, 0.5, 0.75].map(() => H.box(1.06, 0.03, 0.02, '#a8834a', crate));
    const G = H.sphere(0.03, C.dark), arr = { NA: farrow(H, C.green), NB: farrow(H, C.green), FA: farrow(H, C.red), FB: farrow(H, C.red), mg: farrow(H, C.blue), v: farrow(H, C.purple) };
    const L = { G: lab(H, 'G'), A: lab(H, 'A'), B: lab(H, 'B'), NA: lab(H, 'N_A', C.green), NB: lab(H, 'N_B', C.green), F: lab(H, 'μ_k N_A', C.red), mg: lab(H, 'mg', C.blue), v: lab(H, 'v', C.purple) };
    return { b, foot, D, zF, crate, body, slats, G, arr, L };
  },
  update(H, st, o){
    const V = st.V; if (!V || st.x === undefined) return;
    const m = 50, mg = m * G0, d = V.r * o.b, Hc = 2 * d, gx = Math.min(st.x, 3.2), k = 0.6 / mg;
    const lift = V.mu * V.r >= 1, moving = st.v > 0 && !lift;
    const NA = moving ? mg / 2 * (1 + V.mu * V.r) : mg / 2, NB = moving ? mg / 2 * (1 - V.mu * V.r) : mg / 2;
    o.crate.position.x = gx;
    o.body.scale.set(2 * (o.b + 0.12), Hc, o.D); o.body.position.y = o.foot + Hc / 2;
    o.slats.forEach((s, i) => s.position.set(0, o.foot + Hc * (i + 1) / 4, o.D / 2 + 0.005));
    const gy = o.foot + d, z = o.zF;
    o.G.position.set(gx, gy, z); put(o.L.G, gx + 0.1, gy + 0.08, z);
    o.arr.mg.set([gx, gy, z], [0, -mg * k * 0.5, 0]); put(o.L.mg, gx + 0.12, gy - 0.28, z);
    put(o.L.A, gx + o.b, -0.1, z + 0.05); put(o.L.B, gx - o.b, -0.1, z + 0.05);
    const xA = gx + o.b, xB = gx - o.b;
    o.arr.NA.set([xA, -NA * k, z], lift ? [0, 0, 0] : [0, NA * k, 0]); o.arr.NB.set([xB, -NB * k, z], lift ? [0, 0, 0] : [0, NB * k, 0]);
    put(o.L.NA, xA + 0.14, -NA * k + 0.05, z, !lift); put(o.L.NB, xB - 0.14, -NB * k + 0.05, z, !lift && NB * k > 0.04);
    const fA = moving ? V.mu * NA * k : 0, fB = moving ? V.mu * NB * k : 0;
    o.arr.FA.set([xA, 0.012, z + 0.02], [-fA, 0, 0]); o.arr.FB.set([xB, 0.012, z + 0.02], [-fB, 0, 0]);
    put(o.L.F, xA - fA - 0.05, 0.12, z + 0.02, fA > 0.02);
    o.arr.v.set([gx - 0.25, o.foot + Hc + 0.15, 0], moving ? [0.5, 0, 0] : [0, 0, 0]); put(o.L.v, gx + 0.35, o.foot + Hc + 0.15, 0, moving);
    o.body.material.color.set(lift ? '#d9a3a3' : H.C.wood);
  }
});

/* ---------------------------------------------------------
   5.A.2  Braking car. The view follows the car, so the road moves. Springs carry the body; the nose dips under braking.
   --------------------------------------------------------- */
(function(){
  const m = 1500, bR = 1.5, bF = 1.1, Lw = bR + bF, kS = 50000, wr = 0.32, base = 0.45, z0R = m * G0 * bF / Lw / kS;
  view3d({
    id: 'xa-2', size: 2.9, target: [0, 0.75, 0], camera: [0.55, 0.3, 1],
    build(H){
      const C = H.C, rd = road(H, -5, 5, 1.6, 1);
      const body = new THREE.Group(); H.add(body);
      const paint = '#e7c95a', glass = '#cfe0ea';
      // the body is narrower than the wheel track (tires outside it, inner tire faces at z = ±0.68 m) and its sill is 0.25 m above the
      // ground, so G (0.55 m up) lies inside the body and the tires never touch it at any suspension travel
      const sill = wr + base - z0R - 0.25, lower = H.box(Lw + 1.75, 0.38 + sill, 1.3, paint, body); lower.position.set((Lw + 0.85 - 0.9) / 2, (0.38 - sill) / 2, 0);
      const cabin = H.box(1.4, 0.42, 1.2, paint, body); cabin.position.set(1.1, 0.59, 0);
      const ws = H.box(1.3, 0.3, 1.22, glass, body); ws.position.set(1.1, 0.6, 0);
      const wheels = [], springs = [];
      [[-bR, 'R'], [bF, 'F']].forEach(([x]) => [-0.78, 0.78].forEach(z => {
        const w = new THREE.Group(); H.add(w); w.position.set(x, wr, z);
        H.disk(wr, 0.2, '#2d2f33', w); const hub = H.disk(0.17, 0.21, '#b9bcc2', w);
        const spoke = H.box(0.3, 0.05, 0.215, '#6c7078', w); wheels.push(w);
        springs.push({ x, z, m: seg(H, null, [x, wr, z * 0.85], [x, wr + 0.3, z * 0.85], 0.045, '#d8d2c2') });
      }));
      const zS = 0.98, G = H.sphere(0.04, C.dark);
      const arr = { NR: farrow(H, C.green), NF: farrow(H, C.green), FR: farrow(H, C.red), FF: farrow(H, C.red), v: farrow(H, C.purple) };
      const L = { G: lab(H, 'G'), NR: lab(H, 'N_R', C.green), NF: lab(H, 'N_F', C.green), F: lab(H, 'braking friction', C.red, 0.12), v: lab(H, 'v', C.purple) };
      return { rd, body, wheels, springs, zS, G, arr, L };
    },
    update(H, st, o){
      const V = st.V; if (!V || st.zF === undefined) return;
      o.rd.set(st.x);
      const yBF = wr + base - st.zF, yBR = wr + base - st.zR, pitch = Math.atan2(yBF - yBR, Lw);
      o.body.position.set(-bR, yBR, 0); o.body.rotation.z = pitch;
      o.wheels.forEach(w => { w.rotation.z = -st.x / wr; });
      o.springs.forEach(s => place(s.m, [s.x, wr, s.z * 0.85], [s.x, (s.x < 0 ? yBR : yBF) - 0.05, s.z * 0.85])); // just outside the body side, between body and tire
      const gyb = V.d - wr - (base - z0R), c = Math.cos(pitch), sn = Math.sin(pitch);
      const gX = -bR + bR * c - gyb * sn, gY = yBR + bR * sn + gyb * c, z = o.zS;
      o.G.position.set(gX, gY, z); put(o.L.G, gX - 0.13, gY + 0.12, z);
      const a2 = st.phase === 'brake' ? V.a : 0, NF = m * (G0 * bR + a2 * V.d) / Lw, NR = m * (G0 * bF - a2 * V.d) / Lw, k = 0.7 / (m * G0);
      o.arr.NR.set([-bR, -NR * k, z], [0, NR * k, 0]); o.arr.NF.set([bF, -NF * k, z], [0, NF * k, 0]);
      put(o.L.NR, -bR - 0.2, -NR * k + 0.08, z); put(o.L.NF, bF + 0.2, -NF * k + 0.08, z);
      const fr = a2 / G0 * NR * k, ff = a2 / G0 * NF * k;
      o.arr.FR.set([-bR, 0.015, z], [-fr, 0, 0]); o.arr.FF.set([bF, 0.015, z], [-ff, 0, 0]);
      put(o.L.F, bF - ff - 0.2, -0.22, z + 0.2, a2 > 0);
      o.arr.v.set([-0.4, 1.35, 0], st.v > 0 ? [0.08 * st.v, 0, 0] : [0, 0, 0]); put(o.L.v, -0.4 + 0.08 * st.v + 0.12, 1.4, 0, st.v > 0);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.3  Bicycle and rider braking with the rear or the front wheel. The view follows the bicycle.
   --------------------------------------------------------- */
(function(){
  const m = 80, bR = 0.6, bF = 0.4, Lw = bR + bF, wr = 0.34;
  view3d({
    id: 'xa-3', size: 1.6, target: [0, 0.75, 0], camera: [-0.5, 0.25, 1],
    build(H){
      const C = H.C, rd = road(H, -3, 3, 0.9, 1);
      const wheels = [-bR, bF].map(x => {
        const w = new THREE.Group(); H.add(w); w.position.set(x, wr, 0);
        H.ring(wr - 0.02, 0.022, 2 * Math.PI, '#2d2f33', w); H.ring(wr - 0.045, 0.008, 2 * Math.PI, '#9aa0a8', w);
        for (let i = 0; i < 6; i++){ const a = i * Math.PI / 6; seg(H, w, [-(wr - 0.05) * Math.cos(a), -(wr - 0.05) * Math.sin(a), 0], [(wr - 0.05) * Math.cos(a), (wr - 0.05) * Math.sin(a), 0], 0.004, '#b9bcc2'); }
        H.disk(0.03, 0.08, C.dark, w);
        const valve = H.box(0.05, 0.05, 0.05, C.orange, w); valve.position.set(wr - 0.05, 0, 0); return w;
      });
      const xr = -bR, xf = bF, yAx = wr, seat = [-0.12, 0.95], bar = [xf - 0.08, 1.0], crank = [-0.05, yAx - 0.02], fc = '#1f3a93';
      const tube = (a, b, r = 0.018, z = 0) => seg(H, null, [a[0], a[1], z], [b[0], b[1], z], r, fc);
      [[xr, yAx], crank, seat].forEach((p, i, A) => tube(p, A[(i + 1) % 3]));
      tube([seat[0], seat[1] - 0.05], [bar[0], bar[1] - 0.05]); tube([bar[0], bar[1] - 0.05], crank); tube([xf, yAx], bar);
      seg(H, null, [bar[0], bar[1], -0.25], [bar[0], bar[1], 0.25], 0.014, C.dark);
      const saddle = H.box(0.2, 0.04, 0.12, C.dark); saddle.position.set(seat[0], seat[1] + 0.02, 0);
      const rc = '#b5306b', hip = [seat[0], seat[1] + 0.05], sh = [0.12, 1.45], hand = [bar[0], bar[1] + 0.02];
      [-0.12, 0.12].forEach((z, i) => {
        const knee = i ? [0.12, 0.55] : [0.02, 0.6], foot = i ? crank : [crank[0] + 0.06, crank[1] + 0.06];
        seg(H, null, [foot[0], foot[1], z * 0.8], [knee[0], knee[1], z * 0.8], 0.04, rc); seg(H, null, [knee[0], knee[1], z * 0.8], [hip[0], hip[1], z * 0.6], 0.05, rc);
        seg(H, null, [sh[0], sh[1], z * 1.4], [hand[0], hand[1], z * 1.8], 0.032, rc);
      });
      seg(H, null, [hip[0], hip[1], 0], [sh[0], sh[1], 0], 0.12, rc);
      const head = H.sphere(0.1, '#e9d0bd'); head.position.set(sh[0] + 0.06, sh[1] + 0.13, 0);
      const helmet = H.sphere(0.105, C.dark); helmet.scale.set(1, 0.6, 1); helmet.position.set(sh[0] + 0.05, sh[1] + 0.19, 0);
      const zS = 0.3, G = H.sphere(0.03, C.dark);
      const arr = { NR: farrow(H, C.green, 0.8), NF: farrow(H, C.green, 0.8), F: farrow(H, C.red, 0.8) };
      const L = { G: lab(H, 'G', '#1c1d21', 0.13), NR: lab(H, 'N_R', C.green, 0.13), NF: lab(H, 'N_F', C.green, 0.13), F: lab(H, 'F', C.red, 0.13), lift: lab(H, 'rear wheel lifts', C.red, 0.11) };
      return { rd, wheels, zS, G, arr, L };
    },
    update(H, st, o){
      const V = st.V, R = st.R; if (!V || !R) return;
      o.rd.set(st.x);
      const ang = st.x / wr, locked = st.phase === 'brake' && R.state === 'skid';
      o.wheels[0].rotation.z = -(locked && st.mode === 'rear' ? st.lockAng : ang);
      o.wheels[1].rotation.z = -(locked && st.mode === 'front' ? st.lockAng : ang);
      const z = o.zS; o.G.position.set(0, V.d, z); put(o.L.G, 0.1, V.d - 0.08, z);
      const braking = st.phase === 'brake' || st.phase === 'flip', a2 = braking ? R.a : 0, k = 0.43 / (m * G0);
      const NF = m * (G0 * bR + a2 * V.d) / Lw, NR = Math.max(0, m * (G0 * bF - a2 * V.d) / Lw);
      o.arr.NR.set([-bR, -NR * k, z], [0, NR * k, 0]); o.arr.NF.set([bF, -NF * k, z], [0, NF * k, 0]);
      put(o.L.NR, -bR - 0.15, -NR * k + 0.06, z, NR * k > 0.03); put(o.L.NF, bF + 0.15, -NF * k + 0.06, z);
      const bx = st.mode === 'rear' ? -bR : bF, fl = m * a2 * k;
      o.arr.F.set([bx, 0.012, z], [-fl, 0, 0]); put(o.L.F, bx - fl - 0.1, 0.2, z, braking && fl > 0.02);
      put(o.L.lift, -bR, 0.85, z, st.phase === 'flip');
    }
  });
})();

/* ---------------------------------------------------------
   5.A.4  Rod leaning on the wall of a frame that accelerates to the right. The view follows the frame.
   --------------------------------------------------------- */
(function(){
  const L = 1.0, iw = 1.12, ih = 1.06, t = 0.08, y0 = 0.18, D = 0.7; // inner height above L: the rod can stand upright under the roof
  view3d({
    id: 'xa-4', size: 1.45, target: [0.56, 0.55, 0], camera: [-0.35, 0.3, 1],
    build(H){
      const C = H.C, rd = road(H, -2.5, 3.5, 0.8, 0.5);
      const fc = '#d5d0c4';
      const flo = H.box(iw + 2 * t, y0 - 0.1, D, fc); flo.position.set(iw / 2, (y0 + 0.1) / 2, 0);
      [-t / 2, iw + t / 2].forEach(x => { const w = H.box(t, ih + t, D, fc); w.position.set(x, y0 + (ih + t) / 2, 0); });
      const roof = H.box(iw + 2 * t, t, D, fc); roof.position.set(iw / 2, y0 + ih + t / 2, 0);
      const back = H.box(iw, ih, 0.03, '#e6e1d6'); back.position.set(iw / 2, y0 + ih / 2, -D / 2 + 0.015); back.castShadow = false;
      const wheels = [];
      [0.12, iw - 0.12].forEach(x => [-D / 2 + 0.08, D / 2 - 0.08].forEach(z => { const w = new THREE.Group(); H.add(w); w.position.set(x, 0.09, z * 1.2);
        H.disk(0.09, 0.06, '#2d2f33', w); const s = H.box(0.12, 0.025, 0.065, '#9aa0a8', w); wheels.push(w); }));
      const rod = H.bar(L, 0.045, H.C.wood, null, 0.045);
      const ends = [H.sphere(0.028, C.dark), H.sphere(0.028, C.dark)], G = H.sphere(0.028, C.dark);
      const arr = { NA: farrow(H, C.green, 0.7), NB: farrow(H, C.green, 0.7), mg: farrow(H, C.blue, 0.7), a: farrow(H, C.purple, 0.8) };
      const Lb = { A: lab(H, 'A', '#1c1d21', 0.11), B: lab(H, 'B', '#1c1d21', 0.11), NA: lab(H, 'N_A', C.green, 0.11), NB: lab(H, 'N_B', C.green, 0.11), mg: lab(H, 'mg', C.blue, 0.11), a: lab(H, 'a', C.purple, 0.12) };
      return { rd, wheels, rod, ends, G, arr, Lb };
    },
    update(H, st, o){
      const V = st.V; if (!V || !st.s) return;
      o.rd.set(st.xf); o.wheels.forEach(w => { w.rotation.z = -st.xf / 0.09; });
      const p = st.s[0], A = [0, y0 + L * Math.sin(p)], B = [L * Math.cos(p), y0];
      const nx = 0.0225 * Math.sin(p), ny = 0.0225 * Math.cos(p); // half the rod thickness, toward the inside, so the rod rests on the wall and floor
      o.rod.position.set(B[0] + nx, B[1] + ny, 0); o.rod.rotation.z = Math.PI - p;
      o.ends[0].position.set(A[0] + nx, A[1] + ny, 0); o.ends[1].position.set(B[0] + nx, B[1] + ny, 0);
      const g = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; o.G.position.set(g[0], g[1], 0);
      const k = 0.2 / G0, NA = Math.max(st.NA ?? V.a, 0), NB = Math.max(st.NB ?? G0, 0);
      o.arr.NA.set([A[0], A[1], 0.02], [NA * k, 0, 0]); o.arr.NB.set([B[0] - 0.05, B[1] - NB * k, 0.02], [0, NB * k, 0]);
      o.arr.mg.set([g[0], g[1], 0.02], [0, -0.2, 0]);
      put(o.Lb.A, A[0] + 0.1, A[1] + 0.08, 0.05); put(o.Lb.B, B[0] + 0.08, B[1] + 0.08, 0.05);
      put(o.Lb.NA, A[0] + NA * k + 0.1, A[1], 0.05, NA * k > 0.03); put(o.Lb.NB, B[0] - 0.14, B[1] - 0.07, 0.25, NB * k > 0.03);
      put(o.Lb.mg, g[0] + 0.1, g[1] - 0.17, 0.05);
      o.arr.a.set([iw / 2 - 0.2, y0 + ih + t + 0.12, 0], V.a > 0 ? [0.4, 0, 0] : [0, 0, 0]); put(o.Lb.a, iw / 2 + 0.3, y0 + ih + t + 0.12, 0, V.a > 0);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.5  Platform carried by two parallel links OA and CB (pairs in front of and behind the platform).
   L = 2 m, OC = AB = 2.6 m. Pins O and C stand on pedestals on the floor. θ increases clockwise.
   --------------------------------------------------------- */
(function(){
  const m = 400, L = 2, ell = 2.6, yP = 0.35, zl = 0.46;
  const pinA = (th, w) => { const c = Math.cos(th), s = Math.sin(th), s2 = Math.sin(2 * th), c2 = Math.cos(2 * th), c3 = Math.cos(3 * th), M = 4000;
    return [(L * m * w * w * s2 / 2 - G0 * m * c / 4 + G0 * m * c3 / 4 - M / L * c2 / 2 + 3 * M / (2 * L)) / (2 * s), -L * m * w * w * s / 2 - G0 * m * c2 / 4 + G0 * m / 4 + M * c / (2 * L)]; };
  view3d({
    id: 'xa-5', size: 2.6, target: [1.2, 1.3, 0], camera: [-0.3, 0.3, 1],
    build(H){
      const C = H.C; H.floor(-2.6, 5, 1.1);
      [0, ell].forEach(x => { [-1, 1].forEach(s => { const p = H.box(0.12, yP + 0.1, 0.05, C.steel); p.position.set(x, (yP + 0.1) / 2, s * (zl + 0.07)); });
        const bp = H.box(0.3, 0.04, 2 * zl + 0.3, C.steel); bp.position.set(x, 0.02, 0);
        H.disk(0.03, 2 * zl + 0.2, C.dark).position.set(x, yP, 0); });
      const links = []; [0, ell].forEach(x => [-1, 1].forEach(s => { const b = H.bar(L, 0.08, '#8d877a', null, 0.05); b.position.set(x, yP, s * zl); links.push(b); }));
      const plat = H.box(ell + 0.2, 0.22, 2 * zl - 0.1, '#6f6a5e');
      const pins = [H.disk(0.03, 2 * zl + 0.12, C.dark), H.disk(0.03, 2 * zl + 0.12, C.dark)];
      const mom = momentArc(H, 0, yP, zl + 0.1, 0.28, C.purple, true);
      const G = H.sphere(0.04, C.dark), zf = zl + 0.06;
      const arr = { F: farrow(H, C.red, 1.6), mg: farrow(H, C.blue, 1.6) };
      const Lb = { O: lab(H, 'O'), C: lab(H, 'C'), A: lab(H, 'A'), B: lab(H, 'B'), M: lab(H, 'M', C.purple), F: lab(H, 'F_A', C.red), mg: lab(H, 'mg', C.blue), G: lab(H, 'G') };
      put(Lb.O, -0.42, yP - 0.05, zl + 0.15); put(Lb.C, ell + 0.22, yP - 0.12, zl + 0.15); put(Lb.M, 0.3, yP + 0.35, zl + 0.12);
      return { links, plat, pins, G, zf, arr, Lb };
    },
    update(H, st, o){
      if (!st.s) return;
      const [th, w] = st.s, A = [-L * Math.cos(th), yP + L * Math.sin(th)], B = [A[0] + ell, A[1]];
      o.links.forEach(b => { b.rotation.z = Math.PI - th; });
      o.plat.position.set(A[0] + ell / 2, A[1], 0); o.pins[0].position.set(A[0], A[1], 0); o.pins[1].position.set(B[0], B[1], 0);
      const g = [A[0] + ell / 2, A[1]], z = o.zf; o.G.position.set(g[0], g[1], z - 0.1);
      const [Fx, Fy] = pinA(th, w), k = 0.6 / (m * G0);
      o.arr.F.set([A[0], A[1], z], [Fx * k, Fy * k, 0]); o.arr.mg.set([g[0], g[1], z - 0.1], [0, -0.6, 0]);
      put(o.Lb.A, A[0] - 0.22, A[1] + 0.2, z); put(o.Lb.B, B[0] + 0.22, B[1] + 0.2, z);
      put(o.Lb.F, A[0] + Fx * k + 0.15 * Math.sign(Fx || 1), A[1] + Fy * k + 0.12, z); put(o.Lb.mg, g[0] + 0.18, g[1] - 0.55, z); put(o.Lb.G, g[0] - 0.15, g[1] + 0.2, z);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.6  Bar pinned to a collar that accelerates to the left along a fixed guide rod held by two walls.
   Guide rod 1.3 m above the floor, bar length 0.8 m.
   --------------------------------------------------------- */
(function(){
  const L = 0.8, yR = 1.3, xw0 = 0, xw1 = 2.36, x0 = xw1 - 0.318;
  view3d({
    id: 'xa-6', size: 1.45, target: [1.1, 1.0, 0], camera: [-0.3, 0.25, 1],
    build(H){
      const C = H.C; H.floor(-0.4, 2.8, 0.6);
      const wl = H.box(0.07, 1.7, 0.5, '#7d776b'); wl.position.set(xw0 - 0.035, 0.85, 0);
      const wr2 = H.box(0.07, 1.7, 0.5, '#7d776b'); wr2.position.set(xw1 + 0.035, 0.85, 0);
      seg(H, null, [xw0, yR, 0], [xw1, yR, 0], 0.018, C.steel);
      const collar = H.box(0.2, 0.14, 0.14, H.C.body), lug = H.box(0.06, 0.08, 0.03, C.steel);
      const pinO = H.disk(0.02, 0.16, C.dark);
      const barG = new THREE.Group(); H.add(barG); H.bar(L, 0.045, '#cfc8b8', barG, 0.04).position.z = 0.09;
      const vert = new THREE.Group(); H.add(vert); dashed(H, vert, [0, 0, 0], [0, -0.55, 0], 0.004, '#8a8578', 0.03);
      const arc = { m: null };
      const arr = { a: farrow(H, C.purple, 0.8), mg: farrow(H, C.blue, 0.8) }, G = H.sphere(0.025, C.dark);
      const Lb = { O: lab(H, 'O', '#1c1d21', 0.13), th: lab(H, 'θ', '#1c1d21', 0.13), a: lab(H, 'a', C.purple, 0.13), mg: lab(H, 'mg', C.blue, 0.12) };
      return { collar, lug, pinO, barG, vert, arc, arr, G, Lb };
    },
    update(H, st, o){
      const V = st.V; if (!V || !st.s) return;
      const ox = x0 - Math.min(st.x, 1.6), th = st.s[0], zb = 0.09; // same travel limit as the 2D clip
      o.collar.position.set(ox, yR, 0); o.lug.position.set(ox, yR - 0.05, zb - 0.03); o.pinO.position.set(ox, yR, zb);
      o.barG.position.set(ox, yR, 0); o.barG.rotation.z = th - Math.PI / 2;
      o.vert.position.set(ox, yR, zb);
      if (!o.arc.m || Math.abs(o.arc.th - th) > 0.004){ if (o.arc.m){ o.arc.m.parent.remove(o.arc.m); o.arc.m.geometry.dispose(); }
        o.arc.m = Math.abs(th) > 0.02 ? H.ring(0.28, 0.005, Math.abs(th), '#8a8578', null, th > 0 ? -Math.PI / 2 : -Math.PI / 2 + th) : null; o.arc.th = th; }
      if (o.arc.m) o.arc.m.position.set(ox, yR, zb);
      put(o.Lb.th, ox + 0.36 * Math.sin(th / 2), yR - 0.36 * Math.cos(th / 2), zb, Math.abs(th) > 0.08);
      const g = [ox + L / 2 * Math.sin(th), yR - L / 2 * Math.cos(th)]; o.G.position.set(g[0], g[1], zb + 0.03);
      o.arr.mg.set([g[0], g[1], zb + 0.03], [0, -0.25, 0]); put(o.Lb.mg, g[0] + 0.12, g[1] - 0.22, zb + 0.03);
      put(o.Lb.O, ox - 0.16, yR - 0.12, zb + 0.05);
      o.arr.a.set([ox + 0.2, yR + 0.2, 0], V.a > 0 ? [-0.4, 0, 0] : [0, 0, 0]); put(o.Lb.a, ox - 0.3, yR + 0.2, 0, V.a > 0);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.7  Ladder (with a person on it) inside a cart that accelerates to the left. Units: feet.
   The view follows the cart, so the ground moves. Wall of the cart at x = 0, cart floor at y = 1.3 ft.
   --------------------------------------------------------- */
(function(){
  const W = 250, L = 15, th0 = 70 * RAD, hG = 10, m = W / 32.2, xA0 = L * Math.cos(th0), base = 1.3, wallT = 0.82, Wd = 3.2;
  view3d({
    id: 'xa-7', size: 14, target: [6, 8, 0], camera: [0.75, 0.3, 0.85],
    build(H){
      const C = H.C, rd = road(H, -20, 40, 6, 5);
      const cart = '#c9c3b5';
      const flo = H.box(26, 0.6, 2 * Wd, cart); flo.position.set(13 - wallT, base - 0.3, 0);
      const wall = H.box(wallT, 16, 2 * Wd, cart); wall.position.set(-wallT / 2, base + 8, 0);
      const wheels = [];
      [0.6, 23.5].forEach(x => [-Wd + 0.4, Wd - 0.4].forEach(z => { const w = new THREE.Group(); H.add(w); w.position.set(x, 0.36, z);
        H.disk(0.36, 0.3, '#2d2f33', w); H.box(0.5, 0.1, 0.32, '#9aa0a8', w); wheels.push(w); }));
      // ladder: local x runs from the foot A to the top B; local y = −n
      const lad = new THREE.Group(); H.add(lad);
      [-0.75, 0.75].forEach(z => H.bar(L, 0.22, '#b49a6a', lad, 0.14).position.z = z);
      for (let i = 1; i < 15; i++) seg(H, lad, [i, 0, -0.75], [i, 0, 0.75], 0.06, '#8d7752');
      const person = { G: H.sphere(0.25, C.dark, lad) };
      const pc = '#5b4a3a';
      person.legs = [-0.25, 0.25].map(z => seg(H, lad, [0, 0, z], [1, 0, z], 0.16, pc));
      person.torso = seg(H, lad, [0, 0, 0], [1, 0, 0], 0.32, '#6b7fa8');
      person.arms = [-0.4, 0.4].map(z => seg(H, lad, [0, 0, z], [1, 0, z], 0.11, '#6b7fa8'));
      person.head = H.sphere(0.4, '#e9d0bd', lad);
      const arr = { NA: farrow(H, C.green, 6), FA: farrow(H, C.red, 6), NB: farrow(H, C.green, 6), FB: farrow(H, C.red, 6), W: farrow(H, C.blue, 6), a: farrow(H, C.purple, 7) };
      const s = 0.95, Lb = { A: lab(H, 'A', '#1c1d21', s), B: lab(H, 'B', '#1c1d21', s), G: lab(H, 'G', '#1c1d21', s), W: lab(H, 'W', C.blue, s), NA: lab(H, 'N_A', C.green, s), FA: lab(H, 'F_A', C.red, s), NB: lab(H, 'N_B', C.green, s), FB: lab(H, 'F_B', C.red, s), a: lab(H, 'a', C.purple, s) };
      return { rd, wheels, lad, person, arr, Lb };
    },
    update(H, st, o){
      const V = st.V; if (!V || st.th === undefined) return;
      const Xc = -0.5 * V.a * Math.min(st.t, 6) ** 2; o.rd.set(Xc); o.wheels.forEach(w => { w.rotation.z = -Xc / 0.36; });
      const t = st.th, E = [-Math.cos(t), Math.sin(t)], N = [Math.sin(t), Math.cos(t)], xA = st.phase === 'tip' ? xA0 : L * Math.cos(t);
      o.lad.position.set(xA + 0.11 * N[0], base + 0.11 * N[1], 0); o.lad.rotation.z = Math.PI - t; // rails are 0.22 ft thick: their outer faces rest on the floor and the wall
      const P = (u, v) => [xA + u * E[0] + v * N[0], base + u * E[1] + v * N[1]]; // body point (u along the ladder, v normal) → world
      const loc = (u, v, z = 0) => [u, -v, z];                                       // body point → ladder-group coordinates
      // the person is drawn rigidly attached to the ladder (feet on a rung, G at (p, q), head above)
      const up0 = [Math.sin(th0), Math.cos(th0)], uF = Math.max(1, st.p - 3.2), Gb = [st.p, st.q], Hd = [st.p + 2.4 * up0[0], st.q + 2.4 * up0[1]], hand = [Math.min(L - 0.3, st.p + 2.2), 0];
      const sh = [(Gb[0] + Hd[0]) / 2 + 0.3 * (Gb[0] - Hd[0]) / 2.4, (Gb[1] + Hd[1]) / 2 + 0.3 * (Gb[1] - Hd[1]) / 2.4];
      const pr = o.person; pr.G.position.set(...loc(Gb[0], Gb[1], 0.45));
      pr.legs.forEach((g, i) => place(g, loc(uF + (i ? 0 : 1), 0, g.position.z > 0 ? 0.25 : -0.25), loc(Gb[0], Gb[1], g.position.z > 0 ? 0.25 : -0.25)));
      place(pr.torso, loc(Gb[0], Gb[1]), loc(Hd[0] - 0.5 * up0[0], Hd[1] - 0.5 * up0[1]));
      pr.arms.forEach((g, i) => place(g, loc(sh[0], sh[1], i ? 0.4 : -0.4), loc(hand[0], hand[1], i ? 0.6 : -0.6)));
      pr.head.position.set(...loc(Hd[0], Hd[1]));
      const A = P(0, 0), B = P(L, 0), G = P(Gb[0], Gb[1]), k = 3.5 / W, z = 0.95; // forces drawn just outside the near rail
      const F = st.phase === 'held' ? st.S0 : st.F;
      o.arr.W.set([G[0], G[1], 0.6], [0, -W * k, 0]); put(o.Lb.W, G[0] + 0.7, G[1] - W * k + 0.4, 0.6); put(o.Lb.G, G[0] - 0.8, G[1] + 0.4, 0.6);
      put(o.Lb.A, A[0] + 0.9, A[1] + 0.7, 1); put(o.Lb.B, B[0] + 0.8, B[1] - 0.6, 1);
      const show = !!F;
      o.arr.NA.set([A[0], A[1] - (show ? F.NA * k : 0), z], show && F.NA > 0.5 ? [0, F.NA * k, 0] : [0, 0, 0]); put(o.Lb.NA, A[0] + 0.8, A[1] - (show ? F.NA * k : 0) + 0.6, z, show && F.NA > 0.5);
      o.arr.FA.set([A[0], A[1] + 0.15, z], show ? [F.FA * k, 0, 0] : [0, 0, 0]); put(o.Lb.FA, A[0] + (show ? F.FA * k : 0) + (show && F.FA < 0 ? -0.9 : 0.9), A[1] + 0.8, z, show && Math.abs(F.FA * k) > 0.2);
      const atWall = show && F.NB > 0.5 && B[0] < 0.3;
      o.arr.NB.set([B[0] + 0.05, B[1], z], atWall ? [F.NB * k, 0, 0] : [0, 0, 0]); put(o.Lb.NB, B[0] + F.NB * k / 2, B[1] + 0.8, z, atWall);
      const fb = show && atWall ? F.FB * k : 0;
      o.arr.FB.set([B[0] + 0.2, fb > 0 ? B[1] - fb : B[1], z], Math.abs(fb) > 0.15 ? [0, fb, 0] : [0, 0, 0]); // friction from the wall, ending at B if it pushes up
      put(o.Lb.FB, B[0] + 1.0, B[1] + (fb > 0 ? -fb / 2 : fb / 2), z, Math.abs(fb) > 0.15);
      o.arr.a.set([22, base + 3, 0], V.a > 0 ? [-4, 0, 0] : [0, 0, 0]); put(o.Lb.a, 17.3, base + 3, 0, V.a > 0);
    }
  });
})();

/* ---------------------------------------------------------
   5.A.8  Thin semicircular ring (R = 0.5 m) pinned at one end O to a bracket under a ceiling, released from rest
   with its diameter horizontal. G lies on the axis of symmetry, 2R/π from the center of curvature C, in the open
   space of the arc.
   --------------------------------------------------------- */
(function(){
  const R = 0.5, rho = R * Math.sqrt(1 + 4 / (Math.PI * Math.PI)), phi0 = -Math.atan(Math.PI / 2), O = [0, 1.7];
  const pdd = p => -G0 * rho / (2 * R * R) * Math.sin(p);
  const reaction = (p, w) => { const rx = rho * Math.sin(p), ry = -rho * Math.cos(p), al = pdd(p); return [(-al * ry - w * w * rx) / G0, (al * rx - w * w * ry) / G0 + 1]; };
  view3d({
    id: 'xa-8', size: 1.15, target: [-0.3, 1.3, 0], camera: [-0.25, 0.15, 1],
    build(H){
      const C = H.C; H.ceiling(-1.4, 1.0, O[1] + 0.3, 0.4); H.floor(-1.4, 1.0, 0.5);
      const pl = H.box(0.06, 0.3, 0.03, C.steel); pl.position.set(O[0], O[1] + 0.15, -0.05);
      H.disk(0.018, 0.14, C.dark).position.set(O[0], O[1], 0);
      const ring = new THREE.Group(); H.add(ring); ring.position.set(O[0], O[1], 0);
      H.ring(R, 0.022, Math.PI, H.C.body, ring, Math.PI).position.set(-R, 0, 0);
      dashed(H, ring, [0, 0, 0], [-2 * R, 0, 0], 0.003, '#8a8578', 0.03);
      dashed(H, ring, [-R, 0, 0], [-R, -2 * R / Math.PI, 0], 0.004, H.C.orange, 0.025);
      const cM = H.sphere(0.012, '#8a8578', ring); cM.position.set(-R, 0, 0);
      const Gm = H.sphere(0.028, C.dark);
      const arr = { O: farrow(H, C.red, 0.8), mg: farrow(H, C.blue, 0.8) };
      const Lb = { O: lab(H, 'O', '#1c1d21', 0.1), G: lab(H, 'G', '#1c1d21', 0.1), C: lab(H, 'C', '#8a8578', 0.1), d: lab(H, '2R/π', C.orange, 0.09), F: lab(H, 'pin force', C.red, 0.08), mg: lab(H, 'mg', C.blue, 0.09) };
      put(Lb.O, O[0] + 0.1, O[1] + 0.05, 0.05);
      return { ring, Gm, arr, Lb };
    },
    update(H, st, o){
      if (!st.s) return;
      const p = st.s[0], rot = p - phi0, c = Math.cos(rot), s = Math.sin(rot);
      o.ring.rotation.z = rot;
      const loc = (u, v) => [O[0] + u * c - v * s, O[1] + u * s + v * c]; // ring-frame point → world
      const g = [O[0] + rho * Math.sin(p), O[1] - rho * Math.cos(p)]; o.Gm.position.set(g[0], g[1], 0);
      put(o.Lb.G, g[0] - 0.08, g[1] + 0.06, 0.05);
      const cc = loc(-R, 0), mm = loc(-R, -R / Math.PI); put(o.Lb.C, cc[0], cc[1] + 0.08, 0.05); put(o.Lb.d, mm[0] + 0.13, mm[1], 0.05);
      const k = 0.3, [Fx, Fy] = reaction(p, st.s[1]);
      o.arr.O.set([O[0], O[1], 0.03], [Fx * k, Fy * k, 0]); put(o.Lb.F, O[0] + Math.max(Fx * k, 0) + 0.25, O[1] + Math.max(Fy * k, 0) * 0.5 + 0.02, 0.05);
      o.arr.mg.set([g[0], g[1], 0.03], [0, -k, 0]); put(o.Lb.mg, g[0] + 0.08, g[1] - k + 0.04, 0.05);
    }
  });
})();

})();
