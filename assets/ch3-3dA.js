/* 3D views for the Chapter 3, Section A examples (2D moving frames).
   Each view reads the live state of the 2D clip with the same id (st.K holds the kinematics the 2D clip computed),
   so the two views always agree. The moving frame is drawn as two purple axes fixed to the body,
   and the velocity or acceleration terms appear tip to tail at the point, as in the 2D view. */
(function(){

const TC = { base: '#8b8678', al: '#7b3f8c', cen: '#2a7f62', cor: '#a61e4d', rel: '#c2571a', tot: '#1f3a5f' };
const FR = '#7b3f8c';

// purple x and y axes of the moving frame, children of the body group (so they turn with it)
function frameAxes(H, parent, len, z, thick = 0.012){
  const ax = H.bar(len, thick, FR, parent, thick); ax.position.set(0, 0, z);
  const ay = H.bar(len, thick, FR, parent, thick); ay.rotation.z = Math.PI / 2; ay.position.set(0, 0, z);
  const cx = H.mesh(new H.THREE.ConeGeometry(thick * 2.2, thick * 6, 12), FR, parent); cx.rotation.z = -Math.PI / 2; cx.position.set(len, 0, z);
  const cy = H.mesh(new H.THREE.ConeGeometry(thick * 2.2, thick * 6, 12), FR, parent); cy.position.set(0, len, z);
  const lx = H.label('x', FR, 0.1), ly = H.label('y', FR, 0.1);
  return { lx, ly, len, z };
}
function placeFrameLabels(f, group){
  group.updateMatrixWorld(true);
  f.lx.position.set(f.len * 1.18, 0, f.z).applyMatrix4(group.matrixWorld);
  f.ly.position.set(0, f.len * 1.18, f.z).applyMatrix4(group.matrixWorld);
}
// arrows for the terms of the velocity or acceleration equation, tip to tail, plus the total
function chainArrows(H, scale = 1){ return { terms: [0, 1, 2, 3, 4].map(() => null), H, scale, made: {} }; }
function setChain(ch, P, terms, sc, cap, z = 0.1){
  const H = ch.H; let q = [P[0], P[1]], tot = [0, 0];
  terms.forEach(([v]) => { tot = [tot[0] + v[0], tot[1] + v[1]]; });
  const big = Math.max(Math.hypot(...tot), ...terms.map(t => Math.hypot(...t[0]))) * sc, k = big > cap ? cap / big : 1;
  for (let i = 0; i < 5; i++){
    const key = 't' + i, t = terms[i];
    if (!ch.made[key]){ ch.made[key] = H.arrow('#888', ch.scale); }
    const a = ch.made[key];
    if (!t){ a.set([0, 0, 0], [0, 0, 0]); continue; }
    a.obj.setColor(new H.THREE.Color(TC[t[1]]));
    const d = [t[0][0] * sc * k, t[0][1] * sc * k];
    a.set([q[0], q[1], z], [d[0], d[1], 0]); q = [q[0] + d[0], q[1] + d[1]];
  }
  if (!ch.made.tot){ ch.made.tot = H.arrow(TC.tot, ch.scale * 1.25); }
  ch.made.tot.set([P[0], P[1], z + 0.004], [tot[0] * sc * k, tot[1] * sc * k, 0]);
  if (!ch.lab){ ch.lab = H.label('a_P', TC.tot, 0.12); }
  const L = Math.hypot(tot[0], tot[1]) * sc * k;
  ch.lab.visible = L > 0.02;
  if (L > 0.02) ch.lab.position.set(P[0] + tot[0] * sc * k * 1.12, P[1] + tot[1] * sc * k * 1.12, z);
}
const chainOf = (st, K) => (st.show === 'v' ? K.V : K.A).map(([v, key, l]) => [v, key, l]);
function chainLabel(ch, st, base){ const s = (st.show === 'v' ? 'v_' : 'a_') + base; if (ch.lab && ch.lab.userData.txt !== s){ ch.lab.parent && ch.lab.parent.remove(ch.lab); ch.lab = ch.H.label(s, TC.tot, 0.12); ch.lab.userData.txt = s; } }
// a slot: a dark groove with light inner, drawn as two thin rails along local x from x0 to x1
function slot(H, parent, x0, x1, w, z, color = '#2b2f38'){
  const L = x1 - x0;
  [-1, 1].forEach(s => { const r = H.box(L, 0.008, 0.012, color, parent); r.position.set((x0 + x1) / 2, s * w / 2, z); });
  [x0, x1].forEach(x => { const c = H.box(0.008, w, 0.012, color, parent); c.position.set(x, 0, z); });
  const back = H.box(L, w, 0.004, '#fbf7ec', parent); back.position.set((x0 + x1) / 2, 0, z - 0.004);
}

// a floor whose tick marks scroll past, so the rolling disk can stay in the middle of the view
function rollFloor(H, x0, x1, z = 0.5, every = 0.25){
  const f = H.box(x1 - x0, 0.04, 2 * z, '#d8d4c8'); f.position.set((x0 + x1) / 2, -0.02, 0); f.castShadow = false;
  const n = Math.ceil((x1 - x0) / every), ticks = [];
  for (let i = 0; i < n; i++){ const t = H.box(0.02, 0.006, 2 * z - 0.04, '#b8b3a6'); t.position.y = 0.003; ticks.push(t); }
  return { set(x){ ticks.forEach((t, i) => { t.position.x = x0 + ((((i * every - x) % (n * every)) + n * every) % (n * every)); }); } };
}

/* ---------- 3.A.1 disk rolling with a straight slot ---------- */
view3d({
  id: 'x3a-1', size: 1.6, target: [0.1, 0.55, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const r = 0.6, h = 0.2;
    const fl = rollFloor(H, -1.6, 1.8, 0.5);
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(r, 0.12, '#e9d9a8', disk);
    const half = 0.5;   // slot ends well inside the rim (the chord half-length at h = 0.2 m is 0.566 m)
    const sl = new H.THREE.Group(); sl.position.set(0, h, 0); disk.add(sl); slot(H, sl, -half, half, 0.05, 0.059);   // groove flush with the face (z = 0.06)
    const P = H.sphere(0.03, '#1b1a17', disk);
    const f = frameAxes(H, disk, 0.38, 0.075);
    H.disk(0.02, 0.2, '#3a3d44', disk);
    const lo = H.label('O'), lp = H.label('P');
    const ch = chainArrows(H, 0.8);
    return { disk, P, f, lo, lp, ch, r, h, fl };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.fl.set(K.xO); o.disk.position.set(0, o.r, 0); o.disk.rotation.z = K.ang;
    o.P.position.set(K.xp, o.h, 0.075);
    placeFrameLabels(o.f, o.disk);
    o.lo.position.set(-0.1, o.r - 0.1, 0.1);
    const P = [K.rP[0], o.r + K.rP[1]];
    o.lp.position.set(P[0] + 0.02, P[1] + 0.1, 0.1);
    chainLabel(o.ch, st, 'P'); setChain(o.ch, P, chainOf(st, K), st.show === 'v' ? 0.07 : 0.011, 0.75, 0.1);
  }
});

/* ---------- 3.A.2 disk rolling with a curved slot ---------- */
view3d({
  id: 'x3a-2', size: 1.9, target: [0, 0.7, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const R = 0.75;
    const fl = rollFloor(H, -1.8, 1.8, 0.5);
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(R, 0.12, '#e9d9a8', disk);
    const g = H.ring(R, 0.022, Math.PI / 2, '#2b2f38', disk, -Math.PI / 2); g.position.set(-R, R, 0.045);   // groove sunk into the face
    const g2 = H.ring(R, 0.014, Math.PI / 2, '#fbf7ec', disk, -Math.PI / 2); g2.position.set(-R, R, 0.057);
    const P = H.sphere(0.035, '#1b1a17', disk);
    const f = frameAxes(H, disk, 0.42, 0.075);
    H.disk(0.02, 0.2, '#3a3d44', disk);
    const lo = H.label('O'), lp = H.label('P'), ch = chainArrows(H, 0.9);
    return { disk, P, f, lo, lp, ch, R, fl };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.fl.set(K.xO); o.disk.position.set(0, o.R, 0); o.disk.rotation.z = K.ang;
    o.P.position.set(K.pf[0], K.pf[1], 0.07);
    placeFrameLabels(o.f, o.disk);
    o.lo.position.set(0.1, o.R - 0.12, 0.1);
    const P = [K.rP[0], o.R + K.rP[1]];
    o.lp.position.set(P[0] - 0.12, P[1] + 0.08, 0.1);
    chainLabel(o.ch, st, 'P'); setChain(o.ch, P, chainOf(st, K), st.show === 'v' ? 0.09 : 0.012, 0.85, 0.1);
  }
});

/* ---------- 3.A.3 fire truck with a ladder (feet converted to metres) ---------- */
view3d({
  id: 'x3a-3', size: 9.5, target: [3.5, 6.0, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const ft = 0.3048;
    H.floor(-6, 14, 2.4);
    // road stripes that scroll past (the truck stays in view)
    const stripes = []; for (let i = 0; i < 14; i++){ const s = H.box(1.0, 0.012, 0.15, '#f5f1e6'); s.position.y = 0.006; s.position.z = 1.6; stripes.push(s); }
    const truck = new H.THREE.Group(); H.add(truck);
    const bed = H.box(25 * ft, 5.7 * ft, 2.4, '#d9473a', truck); bed.position.set(9.5 * ft, 6.15 * ft, 0); // bottom 3.3 ft, above the wheels
    const cab = H.box(7 * ft, 8.7 * ft, 2.4, '#d9473a', truck); cab.position.set(25.5 * ft, 7.65 * ft, 0);
    const win = H.box(4 * ft, 2.6 * ft, 2.42, '#cfe0ef', truck); win.position.set(25.6 * ft, 10 * ft, 0);
    const wheels = [];
    [1, 25].forEach(x => [-1.05, 1.05].forEach(z => { const w = H.disk(1.6 * ft, 0.35, '#3a3d44', truck); w.position.set(x * ft, 1.6 * ft, z); wheels.push(w);
      const hub = H.box(1.6 * ft, 0.1, 0.36, '#c9c4b6', w); hub.position.set(0, 0, 0); }));
    // ladder rest on the bed behind the cab (the ladder lifts off it; it never goes below it)
    const rest = H.box(0.8 * ft, 2.7 * ft, 0.25, '#8a8478', truck); rest.position.set(17 * ft, 10.35 * ft, 0);
    const restTop = H.box(2 * ft, 0.3 * ft, 0.9, '#8a8478', truck); restTop.position.set(17 * ft, 11.85 * ft, 0);
    const turret = H.disk(0.45, 0.35, '#8a8478'); turret.rotation.x = Math.PI / 2; turret.position.set(0, 9.4 * ft, 0);
    const post = H.box(0.3, 0.9 * ft + 0.2, 0.3, '#8a8478'); post.position.set(0, 9.9 * ft, 0);
    // ladder: base section (17 ft) and a fly section (15 ft) that slides out
    const lad = new H.THREE.Group(); lad.position.set(0, 10.5 * ft, 0); H.add(lad);
    const base = new H.THREE.Group(), fly = new H.THREE.Group(); lad.add(base); lad.add(fly);
    [-0.32, 0.32].forEach(z => { const b = H.bar(17 * ft, 0.12, '#8a8478', base, 0.06); b.position.z = z; });
    for (let s = 1; s < 17; s += 1.4){ const g = H.box(0.035, 0.035, 0.64, '#8a8478', base); g.position.set(s * ft, 0, 0); }
    [-0.22, 0.22].forEach(z => { const b = H.bar(15 * ft, 0.09, '#c9a46a', fly, 0.05); b.position.set(-15 * ft, 0.07, z); });
    for (let s = 0.5; s < 15; s += 1.4){ const g = H.box(0.03, 0.03, 0.44, '#c9a46a', fly); g.position.set(-s * ft, 0.07, 0); }
    const tip = H.sphere(0.09, '#1b1a17', fly); tip.position.set(0, 0.07, 0);
    const f = frameAxes(H, lad, 1.6, 0.42, 0.04);
    const lo = H.label('O', '#1c1d21', 0.4), lp = H.label('P', '#1c1d21', 0.4), ch = chainArrows(H, 3);
    return { ft, stripes, wheels, lad, fly, f, lo, lp, ch };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    const ft = o.ft, xT = K.xT * ft;
    o.stripes.forEach((s, i) => { s.position.x = -6 + (((i * 1.6 - xT) % 22.4) + 22.4) % 22.4 - 2; s.visible = s.position.x > -5.5 && s.position.x < 13.5; });
    o.wheels.forEach(w => { w.rotation.z = -K.xT / 1.6; });
    o.lad.rotation.z = K.th; o.fly.position.x = K.b * ft;
    placeFrameLabels(o.f, o.lad);
    o.lo.position.set(-0.5, 10.5 * ft + 0.2, 0.6);
    const P = [K.b * ft * Math.cos(K.th), 10.5 * ft + K.b * ft * Math.sin(K.th)];
    o.lp.position.set(P[0] + 0.3, P[1] + 0.45, 0.4);
    chainLabel(o.ch, st, 'P');
    setChain(o.ch, P, chainOf(st, K), st.show === 'v' ? 0.06 : 0.9, 3.2, 0.45);
  }
});

/* ---------- 3.A.4 spinning disk, pin in a slot, hanging link AP ---------- */
view3d({
  id: 'x3a-4', size: 0.75, target: [0.08, 0.05, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const r = 0.2, L = 0.3, Rd = 0.33, th = Math.atan2(3, 4);
    H.floor(-0.6, 0.7, 0.35, -0.42);
    const ped = H.box(0.08, 0.42, 0.06, '#9aa0a8'); ped.position.set(0, -0.21, -0.07);
    const pb = H.box(0.22, 0.03, 0.16, '#9aa0a8'); pb.position.set(0, -0.405, -0.07);
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(Rd, 0.03, '#e9d9a8', disk);
    const sl = new H.THREE.Group(); sl.position.set(r, 0, 0); sl.rotation.z = th; disk.add(sl); slot(H, sl, -0.43, 0.08, 0.045, 0.018);
    H.disk(0.012, 0.14, '#3a3d44').position.set(0, 0, -0.05);   // shaft ends just past the disk face, behind the link AP
    const f = frameAxes(H, disk, 0.2, 0.022, 0.006);
    H.ceiling(-0.1, 0.5, 0.42, 0.2);
    const hang = H.box(0.04, 0.12, 0.03, '#9aa0a8'); hang.position.set(r, 0.36, 0.035);
    const link = new H.THREE.Group(); link.position.set(r, L, 0.035); H.add(link);
    const lb = H.bar(L, 0.03, '#d8d2c2', link, 0.012); lb.rotation.z = -Math.PI / 2;
    H.disk(0.009, 0.06, '#3a3d44').position.set(r, L, 0.035);
    const pinP = H.disk(0.012, 0.07, '#1b1a17');
    const la = H.label('A'), lp = H.label('P'), lo = H.label('O'), ch = chainArrows(H, 0.3);
    return { disk, f, link, pinP, la, lp, lo, ch, r, L };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.disk.rotation.z = K.ph; placeFrameLabels(o.f, o.disk);
    const P = K.P; o.pinP.position.set(P[0], P[1], 0.03);
    o.link.rotation.z = Math.atan2(P[0] - o.r, o.L - P[1]);                // the link hangs from A toward P
    o.la.position.set(o.r + 0.05, o.L + 0.03, 0.06); o.lp.position.set(P[0] + 0.04, P[1] - 0.05, 0.08); o.lo.position.set(-0.05, -0.04, 0.06);
    chainLabel(o.ch, st, 'P'); setChain(o.ch, P, chainOf(st, K), st.show === 'v' ? 0.06 : 0.0018, 0.3, 0.07);
  }
});

/* ---------- 3.A.5 link BC with a slot drives link OA ---------- */
view3d({
  id: 'x3a-5', size: 1.15, target: [-0.15, 0.02, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const LBC = 0.86;
    // both links turn all the way around, so the pins are mounted on a back plate (wall); the floor is below the whole sweep
    H.floor(-1.4, 1.1, 0.4, -1.0);
    const plate = H.box(2.4, 1.98, 0.02, '#ddd6c6'); plate.position.set(-0.15, -0.01, -0.11);
    [-0.3, 0].forEach(x => { const boss = H.disk(0.035, 0.05, '#9aa0a8'); boss.position.set(x, 0, -0.075); });
    const bc = new H.THREE.Group(); H.add(bc);
    const body = H.bar(LBC + 0.04, 0.07, '#dbe6ff', bc, 0.025); body.position.set(-0.04, 0, -0.03);
    slot(H, bc, 0.1, LBC - 0.03, 0.035, -0.015);
    const oa = new H.THREE.Group(); oa.position.set(-0.3, 0, 0.02); H.add(oa);
    H.bar(0.5, 0.025, '#c9a46a', oa, 0.012);
    H.disk(0.012, 0.14, '#3a3d44').position.set(-0.3, 0, -0.02); H.disk(0.012, 0.14, '#3a3d44').position.set(0, 0, -0.02);
    const pinA = H.disk(0.014, 0.09, '#1b1a17');
    // the book's frame has its y axis along BC, so the axes sit in a subgroup turned by −90°
    const fg = new H.THREE.Group(); fg.rotation.z = -Math.PI / 2; bc.add(fg);
    const f = frameAxes(H, fg, 0.16, 0.0, 0.006);
    const lo = H.label('O'), lc = H.label('C'), la = H.label('A'), lb = H.label('B'), ch = chainArrows(H, 0.4);
    return { bc, oa, pinA, f, fg, lo, lc, la, lb, ch, LBC };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.bc.rotation.z = K.be;
    placeFrameLabels(o.f, o.fg);
    const A = K.Ap; o.pinA.position.set(A[0], A[1], 0.01);
    o.oa.rotation.z = Math.atan2(A[1], A[0] + 0.3);
    o.lo.position.set(-0.3, -0.13, 0.05); o.lc.position.set(0.0, -0.13, 0.05);
    o.la.position.set(A[0] + 0.05, A[1] + 0.05, 0.06);
    o.lb.position.set(0.92 * Math.cos(K.be), 0.92 * Math.sin(K.be), 0.03);
    chainLabel(o.ch, st, 'A'); setChain(o.ch, A, chainOf(st, K), st.show === 'v' ? 0.12 : 0.008, 0.55, 0.06);
  }
});

/* ---------- 3.A.6 slotted link OD and link CA on walls ---------- */
view3d({
  id: 'x3a-6', size: 0.75, target: [-0.22, -0.18, 0], camera: [-0.25, 0.25, 1],
  build(H){
    const C = [-0.45, -0.225], LOD = 0.47;
    H.wall(0.06, -0.6, 0.15, 0.25); H.wall(C[0] - 0.03, -0.6, 0.15, 0.25);
    H.floor(C[0] - 0.06, 0.06, 0.25, -0.6);
    const bO = H.box(0.06, 0.05, 0.05, '#9aa0a8'); bO.position.set(0.03, 0, -0.02);
    const bC = H.box(0.04, 0.05, 0.05, '#9aa0a8'); bC.position.set(C[0] - 0.01, C[1], -0.02);
    const od = new H.THREE.Group(); H.add(od);
    const body = H.bar(LOD + 0.03, 0.065, '#dbe6ff', od, 0.02); body.position.set(-0.03, 0, -0.02);
    slot(H, od, 0.08, LOD - 0.02, 0.032, -0.008);
    const ca = new H.THREE.Group(); ca.position.set(C[0], C[1], 0.02); H.add(ca); H.bar(0.225, 0.022, '#c9a46a', ca, 0.01);
    H.disk(0.01, 0.1, '#3a3d44').position.set(0, 0, -0.01); H.disk(0.01, 0.1, '#3a3d44').position.set(C[0], C[1], -0.01);
    const pinA = H.disk(0.012, 0.07, '#1b1a17');
    // the book's frame has its x axis along the link, pointing away from D
    const fg = new H.THREE.Group(); fg.rotation.z = Math.PI; od.add(fg);
    const f = frameAxes(H, fg, 0.09, 0.0, 0.005);
    const lo = H.label('O'), lc = H.label('C'), la = H.label('A'), ld = H.label('D'), ch = chainArrows(H, 0.3);
    return { od, ca, pinA, f, fg, lo, lc, la, ld, ch, C, LOD };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    const e = K.e, ang = Math.atan2(e[1], e[0]);
    o.od.rotation.z = ang;
    placeFrameLabels(o.f, o.fg);
    const A = K.Ap; o.pinA.position.set(A[0], A[1], 0.01);
    o.ca.rotation.z = Math.atan2(A[1] - o.C[1], A[0] - o.C[0]);
    o.lo.position.set(0.02, 0.06, 0.05); o.lc.position.set(o.C[0] + 0.01, o.C[1] + 0.06, 0.05);
    o.la.position.set(A[0] + 0.03, A[1] - 0.05, 0.06); o.ld.position.set(e[0] * (o.LOD + 0.05), e[1] * (o.LOD + 0.05), 0.04);
    chainLabel(o.ch, st, 'A'); setChain(o.ch, A, chainOf(st, K), st.show === 'v' ? 0.16 : 0.016, 0.32, 0.06);
  }
});

/* ---------- 3.A.7 rolling disk with pin P in the slot of arm BD ---------- */
view3d({
  id: 'x3a-7', size: 1.0, target: [0.5, 0.05, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const R = 0.2, LBD = 1.12;
    H.floor(-0.1, 1.3, 0.3, -R);
    H.wall(-0.03, -R, 0.35, 0.3);
    const br = H.box(0.05, 0.06, 0.06, '#9aa0a8'); br.position.set(-0.03, 0, 0.0);
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(R, 0.06, '#b9b4a6', disk);
    const sp = H.box(0.012, R - 0.02, 0.062, '#3a3d44', disk); sp.position.set(0, -(R - 0.02) / 2, 0);
    const pinP = H.disk(0.012, 0.12, '#1b1a17', disk); pinP.position.set(0, 0.14, 0.05);
    const arm = new H.THREE.Group(); arm.position.set(0, 0, 0.09); H.add(arm);
    const body = H.bar(LBD + 0.03, 0.055, '#dbe6ff', arm, 0.02); body.position.x = -0.03;
    slot(H, arm, 0.1, LBD - 0.02, 0.028, 0.012);
    H.disk(0.01, 0.16, '#3a3d44').position.set(0, 0, 0.04);
    const f = frameAxes(H, arm, 0.16, 0.02, 0.005);
    const lb = H.label('B'), la = H.label('A'), lp = H.label('P'), ld = H.label('D'), ch = chainArrows(H, 0.35);
    return { disk, arm, pinP, f, lb, la, lp, ld, ch, R, LBD };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.disk.position.set(K.xA, 0, 0); o.disk.rotation.z = -K.ps;
    o.arm.rotation.z = Math.atan2(K.e[1], K.e[0]); placeFrameLabels(o.f, o.arm);
    o.lb.position.set(0.02, -0.08, 0.12); o.la.position.set(K.xA + 0.05, -0.05, 0.06);
    o.lp.position.set(K.P[0] - 0.02, K.P[1] + 0.07, 0.14); o.ld.position.set(K.e[0] * (o.LBD + 0.05), K.e[1] * (o.LBD + 0.05) + 0.04, 0.1);
    chainLabel(o.ch, st, 'P'); setChain(o.ch, K.P, chainOf(st, K), st.show === 'v' ? 0.05 : 0.005, 0.4, 0.16);
  }
});

})();
