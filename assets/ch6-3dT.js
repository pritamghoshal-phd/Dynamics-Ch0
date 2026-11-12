/* 3D views for the Chapter 6 theory pages (vibrations).
   Each view reads the live state that the 2D demo stores in CLIP_ST, so both views always show the same motion.
   Displacements are drawn on the same relative scale as the 2D picture (the largest motion in the window fills a
   fixed travel), and the spring, damper and supports are sized so that nothing can collide over that travel:
   the damper rod always stays inside its cylinder and the mass never reaches the end of the cylinder. */
(function(){
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// coil spring along +x from the origin, unit length (scale.x sets the length); returns the mesh
function coil(H, R, turns, wire, color, parent){
  const pts = [], n = turns * 24;
  for (let i = 0; i <= n; i++){ const u = i / n, a = 2 * Math.PI * turns * u; pts.push(V3(u, R * Math.cos(a), R * Math.sin(a))); }
  pts.unshift(V3(-0.02, 0, R)); pts.push(V3(1.02, 0, R));
  const curve = new THREE.CatmullRomCurve3(pts);
  return H.mesh(new THREE.TubeGeometry(curve, n * 2, wire, 8, false), color, parent);
}
// a cylinder whose axis is x, from local x = 0 to x = len
function xcyl(H, r, len, color, parent){
  const g = new THREE.CylinderGeometry(r, r, len, 24); g.rotateZ(Math.PI / 2); g.translate(len / 2, 0, 0); return H.mesh(g, color, parent);
}
// place an x-axis object (spring group or cylinder group) from point a to point b
function along(obj, a, b){
  const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  obj.position.set(a[0], a[1], a[2]); obj.quaternion.setFromUnitVectors(V3(1, 0, 0), d.normalize()); return L;
}

/* ---- Horizontal mass–spring–damper on wheels (free, damped and forced demos) ----
   Wall face at x = 0. Mass of width 0.40 m; its left face is 0.90 m from the wall at x = 0.
   Visual travel ±0.20 m, so the gap d runs from 0.70 to 1.10 m.
   Damper: cylinder 0.55 m long on the wall, rod 0.62 m long on the mass. The piston (rod tip) is then at
   d − 0.62, which stays between 0.08 and 0.48 m, inside the cylinder, and the mass face (d ≥ 0.70) never
   reaches the open end of the cylinder at 0.55 m. */
function smd(id, withDamper, withForce){
  view3d({
    id, size: 0.95, target: [0.7, 0.22, 0], camera: [-0.12, 0.4, 1],
    build(H){
      const W = 0.40, Hm = 0.30, D = 0.30, rw = 0.045, base = 2 * rw;   // wheel radius; the mass bottom sits on the wheels
      H.floor(-0.3, 2.0, 0.55);
      H.wall(0, 0, 0.75, 0.4);
      const ySp = withDamper ? base + 0.21 : base + Hm / 2, yDa = base + 0.09;
      const mass = new THREE.Group(); H.add(mass);
      const blk = H.box(W, Hm, D, '#cfd8ea', mass); blk.position.set(W / 2, base + Hm / 2, 0);
      const wheels = [];
      [[0.08, 0.12], [0.08, -0.12], [W - 0.08, 0.12], [W - 0.08, -0.12]].forEach(([x, z]) => { const wh = H.disk(rw, 0.03, H.C.dark, mass); wh.position.set(x, rw, z);
        const sp = H.box(rw * 1.6, 0.008, 0.032, H.C.steel, wh); wheels.push(wh); });
      // spring: wall bracket to the mass face
      const spg = new THREE.Group(); H.add(spg); coil(H, 0.045, 9, 0.006, H.C.steel, spg);
      let cyl = null, rodg = null;
      if (withDamper){
        cyl = xcyl(H, 0.034, 0.55, H.C.dark); cyl.position.set(0, yDa, 0);
        rodg = new THREE.Group(); H.add(rodg, mass); const rod = xcyl(H, 0.012, 0.62, H.C.steel, rodg); rod.position.x = -0.62; rodg.position.set(0, yDa, 0);
        const pist = H.disk(0.03, 0.02, H.C.steel, rodg); pist.rotation.y = Math.PI / 2; pist.position.x = -0.62;
      }
      // equilibrium mark on the floor
      const eq = H.box(0.006, 0.002, 0.6, '#8a8478'); eq.position.set(0.90, 0.002, 0);
      const arr = withForce ? H.arrow(H.C.orange, 1) : null;
      const lm = H.label('m'), lk = H.label('k', '#1c1d21', 0.13), lc = withDamper ? H.label('c', '#1c1d21', 0.13) : null, lf = withForce ? H.label('F(t)', H.C.orange, 0.13) : null;
      const lx = H.label('x = 0', '#8a8478', 0.09); lx.position.set(0.90, 0.03, 0.38);
      return { W, Hm, base, rw, ySp, yDa, mass, wheels, spg, arr, lm, lk, lc, lf };
    },
    update(H, st, o){
      if (st.x === undefined) return;
      const amp = st.amp > 0 && isFinite(st.amp) ? st.amp : 1;
      const xv = Math.max(-0.2, Math.min(0.2, 0.2 * st.x / amp)), d = 0.90 + xv;
      o.mass.position.x = d;
      o.wheels.forEach(w => { w.rotation.z = -xv / o.rw; });          // rolling without slipping
      const L = along(o.spg, [0, o.ySp, 0], [d, o.ySp, 0]); o.spg.scale.set(L, 1, 1);
      o.lm.position.set(d + o.W / 2, o.base + o.Hm + 0.09, 0.05);
      o.lk.position.set(d / 2, o.ySp + 0.1, 0.05);
      if (o.lc) o.lc.position.set(0.3, o.yDa - 0.07, 0.12);
      if (o.arr){ const f = st.force || 0, len = 0.28 * Math.abs(f);
        o.arr.set([d + o.W + (f < 0 ? len : 0), o.base + o.Hm / 2, 0], [f * 0.28, 0, 0]);
        o.lf.visible = len > 0.02; o.lf.position.set(d + o.W + 0.2, o.base + o.Hm / 2 + 0.1, 0.05); }
    }
  });
}
smd('demo-free', false, false);
smd('demo-damped', true, false);
smd('demo-forced', true, true);

/* ---- Base excitation (clip 'demo-base'): a shaker moves the platform, which carries the spring and damper.
   Platform underside rests 0.36 m above the floor; travel of the base and of the mass is ±0.11 m each,
   so the gap d between platform top and mass bottom runs from 0.53 to 0.97 m. Damper cylinder 0.48 m and rod
   0.51 m keep the piston between 0.02 and 0.46 m (inside the cylinder) and the mass above the cylinder.
   The actuator rod (0.24 m) always reaches into the shaker body (0.24 m tall). */
view3d({
  id: 'demo-base', size: 1.2, target: [0, 0.78, 0], camera: [-0.35, 0.25, 1],
  build(H){
    H.floor(-0.9, 0.9, 0.6);
    const body = H.box(0.34, 0.24, 0.3, '#8a8478'); body.position.set(0, 0.12, 0);
    const plat = new THREE.Group(); H.add(plat);
    const top = H.box(0.6, 0.03, 0.4, H.C.steel, plat); top.position.y = 0.015;
    const rod = H.mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 16), H.C.dark, plat); rod.position.y = -0.12;
    const cyl = H.mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.48, 24), H.C.dark, plat); cyl.position.set(0.12, 0.03 + 0.24, 0);
    const mass = new THREE.Group(); H.add(mass);
    const blk = H.box(0.5, 0.26, 0.34, '#cfd8ea', mass); blk.position.y = 0.13;
    const prod = H.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.51, 12), H.C.steel, mass); prod.position.set(0.12, -0.255, 0);
    const pist = H.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20), H.C.steel, mass); pist.position.set(0.12, -0.51, 0);
    const spg = new THREE.Group(); H.add(spg); coil(H, 0.05, 9, 0.006, H.C.steel, spg);
    const lm = H.label('m'), lk = H.label('k', '#1c1d21', 0.13), lc = H.label('c', '#1c1d21', 0.13), ly = H.label('y(t)', H.C.blue, 0.12), lx = H.label('x(t)', H.C.red, 0.12);
    return { plat, mass, spg, lm, lk, lc, ly, lx };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    const amp = st.amp > 0 && isFinite(st.amp) ? st.amp : 1, sc = 0.11 / amp;
    const yv = Math.max(-0.11, Math.min(0.11, sc * st.y)), xv = Math.max(-0.11, Math.min(0.11, sc * st.x));
    const B = 0.36 + yv;                          // platform underside
    o.plat.position.y = B;
    const bot = B + 0.03 + 0.75 + (xv - yv);       // mass bottom = platform top + gap
    o.mass.position.y = bot;
    const L = along(o.spg, [-0.12, B + 0.03, 0], [-0.12, bot, 0]); o.spg.scale.set(L, 1, 1);
    o.lm.position.set(0, bot + 0.36, 0.1); o.lk.position.set(-0.27, (B + bot) / 2 + 0.03, 0.1); o.lc.position.set(0.25, (B + bot) / 2 - 0.05, 0.1);
    o.ly.position.set(0.42, B + 0.02, 0.22); o.lx.position.set(0.38, bot + 0.13, 0.22);
  }
});
/* ---- Hanging mass under gravity (clip 'c-gravity' on the equations-of-motion page).
   The 2D picture's pixel layout is mapped at 4 mm per pixel: ceiling 1.45 m above the floor, unstretched spring 0.22 m,
   the static stretch and the motion drawn on the same scale as in 2D (at most 1.0 m in all), so the block (0.18 m tall)
   always stays at least 0.25 m above the floor. The ceiling plate stands on two posts behind the spring. */
view3d({
  id: 'c-gravity', size: 1.25, target: [0, 0.8, 0], camera: [-0.35, 0.2, 1],
  build(H){
    const Yc = 1.45;
    H.floor(-0.6, 0.6, 0.35);
    const ceil = H.box(0.8, 0.05, 0.4, H.C.wall); ceil.position.set(0, Yc + 0.025, -0.02);
    [-0.36, 0.36].forEach(x => { const p = H.box(0.04, Yc, 0.04, H.C.steel); p.position.set(x, Yc / 2, -0.18); });
    const plate = H.box(0.08, 0.01, 0.08, '#6d7480'); plate.position.set(0, Yc - 0.005, 0);
    const spg = new THREE.Group(); H.add(spg); coil(H, 0.04, 10, 0.006, H.C.steel, spg);
    const blk = H.box(0.28, 0.176, 0.2, '#cfd8ea');
    const mU = H.box(0.5, 0.003, 0.003, '#8a8478'), mE = H.box(0.5, 0.003, 0.003, H.C.green);
    const lm = H.label('m'), lk = H.label('k', '#1c1d21', 0.12), lU = H.label('unstretched', '#8a8478', 0.06), lE = H.label('equilibrium', H.C.green, 0.06);
    return { Yc, spg, blk, mU, mE, lm, lk, lU, lE };
  },
  update(H, st, o){
    if (!st.ok || !st.scaleD) return;
    const px = 0.004, s = 200 / st.scaleD, x = st.a * Math.cos(st.wn * st.t);
    const yU = o.Yc - 55 * px, yE = yU - st.dst * s * px, yM = yE - x * s * px;          // top of the block (m)
    const L = along(o.spg, [0, o.Yc, 0], [0, yM, 0]); o.spg.scale.set(L, 1, 1);
    o.blk.position.set(0, yM - 0.088, 0);
    o.mU.position.set(0.46, yU, 0); o.mE.position.set(0.46, yE, 0);          // reference lines start beside the block (it is 0.28 m wide)
    o.lU.position.set(0.84, yU, 0); o.lE.position.set(0.84, yE, 0);
    o.lm.position.set(0, yM - 0.088, 0.16); o.lk.position.set(0.1, (o.Yc + yM) / 2, 0.05);
  }
});
})();
