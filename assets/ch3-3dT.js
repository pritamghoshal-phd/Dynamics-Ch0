/* 3D views for the Chapter 3 theory pages (rotating reference frames).
   Each view reads the live state of the 2D clip with the same id, so both views always show the same motion.
   The 2D clips here are top views: a 2D point (x, y) becomes (x, height, −y) in 3D, and a counterclockwise
   turn seen from above is a positive rotation about the vertical 3D y axis. */
(function(){
const T = () => THREE;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// a polyline that can be refilled every frame
function polyline(H, color, parent, n = 2000){
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * n), 3)); geo.setDrawRange(0, 0);
  const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color })); H.add(ln, parent);
  return { obj: ln, set(pts){ const a = geo.attributes.position.array, m = Math.min(pts.length, n); for (let i = 0; i < m; i++){ a[3 * i] = pts[i][0]; a[3 * i + 1] = pts[i][1]; a[3 * i + 2] = pts[i][2]; }
    geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, m); geo.computeBoundingSphere(); } };
}
function person(H, color, parent){
  const g = new THREE.Group(); H.add(g, parent);
  const body = H.mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.9, 20), color, g); body.position.y = 0.75;
  [-0.08, 0.08].forEach(z => { const leg = H.mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 10), '#3a3d44', g); leg.position.set(0, 0.21, z); });
  const head = H.sphere(0.12, '#e8c9a8', g); head.position.y = 1.32;
  return g;
}
// curved arrow about the vertical axis (spin direction), drawn at height y
function spinArrow(H, R, y, ccw, color){
  const g = new THREE.Group(); H.add(g); const arc = 1.4 * Math.PI;
  H.ring(R, 0.018, arc, color, g); const cone = H.mesh(new THREE.ConeGeometry(0.05, 0.13, 16), color, g);
  cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(-Math.sin(arc), Math.cos(arc), 0));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.userData.avoid = true; g.userData.ccw = ccw; return g;
}

/* ---- Playing catch on a merry-go-round (clip 'c-throw'). Platform radius 2 m, hand height 1.0 m above the deck.
   The ball is thrown so that it is caught at the same height; gravity only bends the path vertically,
   so from above the flight is a straight line in the ground frame. */
view3d({
  id: 'c-throw', size: 4.2, target: [0, 0.9, 0], camera: [-0.2, 0.75, 1],
  build(H){
    const R = 2, deck = 0.35;
    H.floor(-3.4, 3.4, 3.2);
    const base = H.mesh(new THREE.CylinderGeometry(0.35, 0.5, deck - 0.05, 24), H.C.steel); base.position.y = (deck - 0.05) / 2;
    const plat = new THREE.Group(); plat.position.y = deck; H.add(plat);
    const disk = H.mesh(new THREE.CylinderGeometry(R, R, 0.08, 72), '#e9d9a8', plat); disk.position.y = -0.04;
    for (let s = 0; s < 8; s++){ const sp = H.box(R, 0.005, 0.03, s ? '#cbb47a' : H.C.orange, plat); sp.geometry.translate(R / 2, 0, 0); sp.position.y = 0.002; sp.rotation.y = s * Math.PI / 4; }
    const A = person(H, H.C.blue, plat); A.position.set(-R + 0.25, 0, 0);
    const B = person(H, H.C.green, plat); B.position.set(R - 0.25, 0, 0);
    const ball = H.sphere(0.09, H.C.ball);
    const ground = polyline(H, 0xb42346), riders = polyline(H, 0x2457d6, plat);
    const la = H.label('thrower', H.C.blue, 0.2), lb = H.label('friend', H.C.green, 0.2), lw = H.label('ω', H.C.purple, 0.26);
    const spin = spinArrow(H, 0.45, deck + 0.05, true, H.C.purple);
    const v = H.arrow(H.C.red, 1.2);
    return { R, deck, plat, A, B, ball, ground, riders, la, lb, lw, spin, v };
  },
  update(H, st, o){
    if (!st.sh || !st.ball) return;
    const V = st.V, sh = st.sh, R = o.R, tb = st.ball.tb, ph = V.w * st.t, hand = o.deck + 1.0, g = 9.81, vz = g * sh.tf / 2;
    o.plat.rotation.y = ph;
    const P = (x, y, t) => [x, hand + vz * t - g * t * t / 2, -y];
    const p = st.ball.p, q = P(p[0], p[1], tb); o.ball.position.set(...q); o.ball.visible = st.t <= sh.tf + 0.6;
    const n = 60, gpts = [], rpts = [];
    for (let i = 0; i <= n; i++){ const t = tb * i / n, x = -R + sh.vx * t, y = sh.vy * t; gpts.push(P(x, y, t));
      const c = Math.cos(-V.w * t), s = Math.sin(-V.w * t), xr = x * c - y * s, yr = x * s + y * c; rpts.push([xr, 0.01, -yr]); }
    o.ground.set(gpts); o.riders.set(rpts);
    const c = Math.cos(ph), s = Math.sin(ph);
    o.la.position.set(-(R - 0.25) * c, o.deck + 1.75, (R - 0.25) * s); o.lb.position.set((R - 0.25) * c, o.deck + 1.75, -(R - 0.25) * s);
    o.spin.visible = Math.abs(V.w) > 1e-3; o.spin.scale.set(1, V.w >= 0 ? 1 : -1, 1); o.lw.visible = o.spin.visible; o.lw.position.set(0.6, o.deck + 0.25, 0.3);
    if (st.t < sh.tf) o.v.set(q, [sh.vx * 0.18, (vz - g * tb) * 0.18, -sh.vy * 0.18]); else o.v.set(q, [0, 0, 0]);
  }
});

/* ---- Bead sliding along a rod that turns about a vertical shaft (clip 'c-acc', on frames-2d.html).
   Rod length 1.05 m at height 0.8 m; the arrows are the five acceleration terms, added head to tail, and their sum. */
view3d({
  id: 'c-acc', size: 1.0, target: [0, 0.7, 0], camera: [-0.15, 1.4, 1],
  build(H){
    const y = 0.8; H.floor(-1.2, 1.2, 1.2);
    const base = H.box(0.3, 0.12, 0.3, '#8a8478'); base.position.y = 0.06;
    const shaft = H.mesh(new THREE.CylinderGeometry(0.03, 0.03, y + 0.05, 20), H.C.steel); shaft.position.y = (y + 0.05) / 2;
    const rod = new THREE.Group(); rod.position.y = y; H.add(rod);
    const bar = H.mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.05, 16), '#8a6a12', rod); bar.rotation.z = Math.PI / 2; bar.position.x = 0.525;
    const hub = H.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 20), H.C.dark, rod);
    const bead = H.mesh(new THREE.TorusGeometry(0.035, 0.018, 12, 24), H.C.blue);
    const cols = [H.C.purple, '#8c919c', H.C.red, H.C.orange], arr = cols.map(c => H.arrow(c, 0.8)), tot = H.arrow('#17915a', 1.0);
    const labs = ['(a)_{rel}', 'α × r', 'Coriolis', 'centripetal'].map((t, i) => H.label(t, cols[i], 0.075)), lt = H.label('a', '#17915a', 0.1);
    const trail = polyline(H, 0x2457d6);
    const lw = H.label('ω', H.C.purple, 0.1); lw.position.set(0.1, y + 0.2, 0); spinArrow(H, 0.08, y + 0.14, true, H.C.purple).scale.set(0.6, 0.6, 0.6);
    return { y, rod, bead, arr, tot, labs, lt, trail, pts: [] };
  },
  update(H, st, o){
    if (!st.k || !st.amax) return;
    const k = st.k, V = st.V, e = [Math.cos(k.ph), Math.sin(k.ph)], n = [-e[1], e[0]];
    o.rod.rotation.y = k.ph;
    const P = [k.r * e[0], o.y, -k.r * e[1]]; o.bead.position.set(...P); o.bead.rotation.set(0, k.ph, Math.PI / 2);
    if (st.t < 0.03) o.pts = []; o.pts.push(P.slice()); if (o.pts.length > 1500) o.pts.shift(); o.trail.set(o.pts);
    const terms = [[V.ar, 0], [0, V.al * k.r], [0, 2 * k.w * k.vr], [-k.w * k.w * k.r, 0]], s = 0.7 / st.amax;
    let p = P.slice(), sum = [0, 0, 0];
    terms.forEach(([er, en], i) => { const v = [(er * e[0] + en * n[0]) * s, 0, -(er * e[1] + en * n[1]) * s]; o.arr[i].set(p, v);
      const L = Math.hypot(v[0], v[2]); o.labs[i].visible = L > 0.04; o.labs[i].position.set(p[0] + v[0], p[1] + 0.06, p[2] + v[2]);
      p = [p[0] + v[0], p[1], p[2] + v[2]]; sum = [sum[0] + v[0], 0, sum[2] + v[2]]; });
    o.tot.set([P[0], P[1] + 0.003, P[2]], sum); o.lt.position.set(P[0] + sum[0], P[1] - 0.06, P[2] + sum[2]);
  }
});

/* ---- Foucault pendulum (clip 'c-foucault'). Length 1 m, pivot 1.25 m above the floor, swing amplitude 0.12 m.
   The floor (and its compass) turns with the Earth, so the swing plane appears to turn over it. */
view3d({
  id: 'c-foucault', size: 1.3, target: [0, 0.5, 0], camera: [-0.25, 0.7, 1],
  build(H){
    const top = 1.25; H.floor(-0.8, 0.8, 0.8);
    // gantry: two posts standing on the floor and a top beam that carries the pivot
    [-0.55, 0.55].forEach(x => { const p = H.box(0.05, top + 0.06, 0.05, H.C.steel); p.position.set(x, (top + 0.06) / 2, -0.35); const f = H.box(0.16, 0.03, 0.16, '#8a8478'); f.position.set(x, 0.015, -0.35); });
    const beam = H.box(1.16, 0.05, 0.05, H.C.steel); beam.position.set(0, top + 0.06, -0.35);
    const arm = H.box(0.04, 0.04, 0.37, H.C.steel); arm.position.set(0, top + 0.06, -0.165);
    const cap = H.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16), H.C.dark); cap.position.y = top + 0.03;
    const dial = H.mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.004, 64), '#efe9da'); dial.position.y = 0.003;
    const ring = H.ring(0.15, 0.003, 2 * Math.PI, '#8a8478'); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006;
    H.label('N', '#5b5a55', 0.07).position.set(0, 0.02, -0.21); H.label('E', '#5b5a55', 0.07).position.set(0.21, 0.02, 0);
    const start = H.box(0.26, 0.002, 0.004, '#8a8478'); start.position.y = 0.007;                       // plane at release (east–west)
    const plane = H.box(0.3, 0.003, 0.008, H.C.green); plane.position.y = 0.009;                         // predicted plane now
    const bob = H.sphere(0.035, H.C.red), str = H.cable([[0, top, 0], [0, top - 1, 0]], H.C.dark, 0.002);
    const trail = polyline(H, 0x2457d6), shadow = H.mesh(new THREE.CircleGeometry(0.02, 20), '#5b5a55'); shadow.rotation.x = -Math.PI / 2;
    const lp = H.label('swing plane now', H.C.green, 0.06);
    return { top, bob, str, trail, plane, lp, shadow };
  },
  update(H, st, o){
    if (!st.s) return;
    const x = st.s[0], y = st.s[1], L = 1, z = o.top - Math.sqrt(L * L - x * x - y * y);
    o.bob.position.set(x, z, -y); o.str.set([[0, o.top, 0], [x, z, -y]]); o.shadow.position.set(x, 0.008, -y);
    o.trail.set((st.tr || []).map(q => [q[0], 0.01, -q[1]]));
    const Wz = st.V.k * 7.2921e-5 * Math.sin(st.V.lat * RAD), pa = -Wz * st.t; o.plane.rotation.y = pa; o.lp.position.set(0.17 * Math.cos(pa), 0.04, -0.17 * Math.sin(pa));
  }
});

/* ---- Telescoping robot arm turning about a vertical axis (clip 'c-robot'). Arm height 0.9 m; payload on the gripper. */
view3d({
  id: 'c-robot', size: 1.45, target: [0.15, 0.7, -0.25], camera: [0.35, 0.75, 1],
  build(H){
    const y = 0.9; H.floor(-1.4, 1.4, 1.4);
    const base = H.mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 32), '#5b5a55'); base.position.y = 0.06;
    const col = H.mesh(new THREE.CylinderGeometry(0.08, 0.08, y - 0.12, 24), '#9aa0a8'); col.position.y = 0.12 + (y - 0.12) / 2;
    const head = new THREE.Group(); head.position.y = y; H.add(head);
    const sleeve = H.box(0.53, 0.12, 0.12, '#9aa0a8', head); sleeve.geometry.translate(0.53 / 2 - 0.08, 0, 0);
    const boom = H.box(0.5, 0.08, 0.08, '#d9dde3', head); boom.geometry.translate(-0.25, 0, 0);
    const grip = H.box(0.06, 0.16, 0.16, H.C.dark, head);
    const load = H.box(0.14, 0.14, 0.14, '#e9d9a8', head);
    const Fr = H.arrow(H.C.orange, 0.9), Fa = H.arrow('#8c919c', 0.9), Fc = H.arrow(H.C.red, 0.9);
    const lc = H.label('Coriolis', H.C.red, 0.08), lr = H.label('radial', H.C.orange, 0.08);
    return { y, head, boom, grip, load, Fr, Fa, Fc, lc, lr };
  },
  update(H, st, o){
    if (!st.k || !st.Fmax) return;
    const k = st.k, e = [Math.cos(k.th), Math.sin(k.th)], n = [-e[1], e[0]];
    o.head.rotation.y = k.th; o.boom.position.x = k.r - 0.03;
    o.grip.position.x = k.r - 0.02; o.load.position.set(k.r + 0.09, -0.02, 0);
    const P = [(k.r + 0.09) * e[0], o.y + 0.12, -(k.r + 0.09) * e[1]], s = 0.4 / st.Fmax;
    o.Fr.set(P, [k.Fr * e[0] * s, 0, -k.Fr * e[1] * s]);
    const a = [k.Fa * n[0] * s, 0, -k.Fa * n[1] * s]; o.Fa.set(P, a);
    const P2 = [P[0] + a[0], P[1], P[2] + a[2]], c = [k.Fc * n[0] * s, 0, -k.Fc * n[1] * s]; o.Fc.set(P2, c);
    o.lc.visible = Math.hypot(c[0], c[2]) > 0.04; o.lc.position.set(P2[0] + c[0], P[1] + 0.06, P2[2] + c[2]);
    o.lr.visible = Math.abs(k.Fr * s) > 0.04; o.lr.position.set(P[0] + k.Fr * e[0] * s, P[1] + 0.06, P[2] - k.Fr * e[1] * s);
  }
});
})();
