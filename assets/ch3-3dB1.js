/* 3D views for examples 3.B.1 – 3.B.6 (moving reference frames in three dimensions).
   Each view reads the live state of the 2D clip with the same id (st.G holds the angles, the moving frame and the vectors),
   so the two views always agree. Purple arrow: ω. Red arrow: α. Dark arrows x, y, z: the observer's moving axes. */
(function(){
const W_COL = '#8a3fd1', AL_COL = '#b42346', V_COL = '#2457d6', A_COL = '#17915a', FR_COL = '#3a3d44';
const M3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k], A3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ---------- helpers used only in this file ---------- */
function rod(H, r, color, parent, segs = 20){ const g = new H.THREE.CylinderGeometry(r, r, 1, segs); return H.mesh(g, color, parent); }   // unit length along y
function placeRod(T, m, a, b){ const A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B); m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, Math.max(L, 1e-4), 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m; }
// moving axes x, y, z of the observer
function triad(H, sc, len){
  const ar = [0, 1, 2].map(() => H.arrow(FR_COL, sc)), lb = ['x', 'y', 'z'].map(s => H.label(s, FR_COL, 0.13 * sc));
  return { set(o, fr){ [fr.i, fr.j, fr.k].forEach((d, n) => { ar[n].set(o, M3(d, len)); lb[n].position.set(...A3(o, M3(d, len * 1.18))); }); } };
}
// a labelled vector arrow
function lvec(H, color, sc, name){
  const a = H.arrow(color, sc), l = H.label(name, color, 0.16 * sc);
  return { set(o, v){ a.set(o, v); const L = Math.hypot(...v); l.visible = L > 1e-3; l.position.set(...A3(o, M3(v, 1 + 0.12 * sc / Math.max(L, 0.05)))); } };
}
// curved arrow around an axis (a torus arc with a cone), drawn in the local x–y plane of the returned group
function spinArrow(H, R, color, tube, parent){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.5 * Math.PI; H.ring(R, tube, arc, color, g);
  const cone = H.mesh(new T.ConeGeometry(tube * 3, tube * 8, 16), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0);
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.userData.avoid = true; return g;
}
function aroundY(g, y){ g.rotation.x = -Math.PI / 2; g.position.y = y; return g; }   // turn a spin arrow so that it circles the vertical axis (counterclockwise from above)
const st3 = st => st && st.G;

/* =================================================================== 3.B.1 */
view3d({
  id: 'x3b-1', size: 1.6, target: [0.25, 0.35, 0], camera: [0.55, 0.42, 1],
  build(H){
    const T = H.THREE, R = 0.5, L = 0.9;
    H.floor(-0.9, 0.9, 0.9, -0.45);
    placeRod(T, rod(H, 0.025, H.C.steel), [0, -0.45, 0], [0, 1.0, 0]);
    [-0.35, 0.88].forEach(y => { H.box(0.14, 0.08, 0.14, '#cfcabd').position.set(0, y, 0); });
    H.box(0.3, 0.04, 0.3, '#cfcabd').position.set(0, -0.43, 0);
    aroundY(spinArrow(H, 0.13, W_COL, 0.008), 0.62);
    const arm = new T.Group(); H.add(arm);
    const ab = H.bar(R, 0.04, '#e9d9a8', arm, 0.04);
    H.box(0.08, 0.1, 0.08, '#b9b3a3', arm);                                     // collar on the shaft
    const bcG = new T.Group(); bcG.position.set(R, 0, 0); arm.add(bcG);
    H.bar(L, 0.045, '#d9c58c', bcG, 0.045);
    H.disk(0.02, 0.12, H.C.dark, bcG);                                          // pin at B, along k
    const la = H.label('A'), lc = H.label('C'), lO = H.label('Ω', W_COL);
    lO.position.set(0.2, 0.62, 0.1);
    return { arm, bcG, la, lc, tri: triad(H, 0.6, 0.22), w: lvec(H, W_COL, 0.7, 'ω'), al: lvec(H, AL_COL, 0.7, 'α') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.arm.rotation.y = G.ps; o.bcG.rotation.z = G.th;
    o.la.position.set(-0.08, 0.1, 0.06); o.lc.position.set(...A3(G.C, [0, 0.08, 0]));
    o.tri.set(G.B, G.fr); o.w.set(G.B, M3(G.w, 0.075)); o.al.set(G.B, M3(G.al, 0.017));
  }
});

/* =================================================================== 3.B.2 */
view3d({
  id: 'x3b-2', size: 2.4, target: [0.4, 0.1, 0], camera: [0.65, 0.35, 1],
  build(H){
    const T = H.THREE;
    H.floor(-1.4, 1.4, 1.4, -1.4);
    H.box(0.6, 0.3, 0.6, '#cfcabd').position.set(0, -1.25, 0);
    placeRod(T, rod(H, 0.07, H.C.steel), [0, -1.1, 0], [0, -0.1, 0]);
    aroundY(spinArrow(H, 0.2, W_COL, 0.012), -0.55);
    const base = new T.Group(); H.add(base);                                   // yoke: turns with Ω
    [-0.25, 0.25].forEach(z => { placeRod(T, rod(H, 0.03, '#7b808c', base), [0, -0.1, 0], [0, -0.1, z]); placeRod(T, rod(H, 0.03, '#7b808c', base), [0, -0.1, z], [0, 0, z]); });
    const pinM = placeRod(T, rod(H, 0.025, H.C.dark, base), [0, 0, -0.28], [0, 0, 0.28]);
    const dish = new T.Group(); base.add(dish);                                  // elevation θ about the pin (local z)
    const prof = []; for (let k = 0; k <= 24; k++){ const rr = 0.95 * k / 24; prof.push(new T.Vector2(rr, 0.25 * (rr / 0.95) ** 2)); }
    const lg = new T.LatheGeometry(prof, 48); lg.rotateZ(-Math.PI / 2); lg.translate(0.2, 0, 0);
    const dm = H.mesh(lg, '#b9bbc4', dish, { side: T.DoubleSide, metalness: 0.2 });
    placeRod(T, rod(H, 0.03, FR_COL, dish), [0, 0, 0], [1.6, 0, 0]);
    [0, 1, 2, 3].forEach(n => { const u = n * Math.PI / 2 + 0.4; placeRod(T, rod(H, 0.008, '#55585f', dish), [0.45, 0.95 * Math.cos(u), 0.95 * Math.sin(u)], [1.6, 0, 0]); });
    const P = H.sphere(0.05, '#3a3d44'); dish.add(P); P.position.set(1.6, 0, 0);
    const lp = H.label('P'), lO = H.label('Ω', W_COL); lO.position.set(0.32, -0.55, 0.1);
    return { base, dish, lp, tri: triad(H, 1, 0.55), w: lvec(H, W_COL, 1, 'ω'), al: lvec(H, AL_COL, 1, 'α') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.base.rotation.y = G.ps; o.dish.rotation.z = G.th;
    o.lp.position.set(...A3(G.P, [0, 0.12, 0]));
    o.tri.set([0, 0, 0], G.fr); o.w.set([0, 0, 0], M3(G.w, 1.5)); o.al.set([0, 0, 0], M3(G.al, 6));
  }
});

/* =================================================================== 3.B.3 */
view3d({
  id: 'x3b-3', size: 1.3, target: [0.15, 0.25, 0], camera: [0.5, 0.4, 1],
  build(H){
    const T = H.THREE, L = 0.6, Hc = 0.45, r = 0.25;
    H.floor(-0.75, 0.75, 0.75, -0.6);
    H.box(0.24, 0.16, 0.24, '#cfcabd').position.set(0, -0.52, 0);
    placeRod(T, rod(H, 0.022, H.C.steel), [0, -0.45, 0], [0, 0.15, 0]);
    H.box(0.12, 0.14, 0.12, '#cfcabd').position.set(0, 0, 0);
    aroundY(spinArrow(H, 0.11, W_COL, 0.007), -0.25);
    const arm = new T.Group(); H.add(arm);
    H.bar(L, 0.05, '#55585f', arm, 0.05); const up = H.bar(Hc, 0.05, '#55585f', arm, 0.05); up.rotation.z = Math.PI / 2; up.position.set(L, 0, 0);
    H.disk(0.015, 0.14, H.C.dark, arm).position.set(L, Hc, 0.03);              // axle of the disk
    const dg = new T.Group(); dg.position.set(L, Hc, 0.06); arm.add(dg);
    H.disk(r, 0.03, '#e2d2a0', dg);
    const rad = H.bar(r, 0.012, '#c2410c', dg, 0.034); rad.rotation.z = Math.PI;   // radius toward P
    const P = H.sphere(0.02, V_COL, dg); P.position.set(-r, 0, 0.02);
    const trail = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0x7d9be0 })); H.add(trail);
    const lo = H.label('O'), lp = H.label('P', V_COL), lO = H.label('ω_2', W_COL); lO.position.set(0.18, -0.25, 0.1);
    return { arm, dg, trail, key: '', lo, lp, L, Hc, r, tri: triad(H, 0.5, 0.22), w: lvec(H, W_COL, 0.55, 'ω'), al: lvec(H, AL_COL, 0.55, 'α') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.arm.rotation.y = G.ps; o.dg.rotation.z = G.ph;
    const key = st.V.w1 + '|' + st.V.w2;
    if (key !== o.key){ o.key = key; const pts = [];
      for (let n = 0; n <= 360; n++){ const t = G.t0 + (G.t1 - G.t0) * n / 360, ps = st.V.w2 * t, ph = -st.V.w1 * t, e = [Math.cos(ps), 0, -Math.sin(ps)], k = [Math.sin(ps), 0, Math.cos(ps)];
        const i = A3(M3(e, Math.cos(ph)), M3([0, 1, 0], Math.sin(ph))), C = A3(M3(e, o.L), [0, o.Hc, 0]); const p = A3(A3(C, M3(i, -o.r)), M3(k, 0.06)); pts.push(new H.THREE.Vector3(...p)); }
      o.trail.geometry.setFromPoints(pts); }
    o.lo.position.set(-0.08, 0.08, 0.06);
    o.lp.position.set(...A3(G.Pp, [0, 0.06, 0.06]));
    o.tri.set(G.C, G.fr); o.w.set(G.C, M3(G.w, 0.024)); o.al.set(G.C, M3(G.al, 0.0035));
  }
});

/* =================================================================== 3.B.4 (ft) */
view3d({
  id: 'x3b-4', size: 22, target: [3, 2, 0], camera: [0.5, 0.35, 1],
  build(H){
    const T = H.THREE, r = 3, L = 15;
    H.floor(-14, 20, 10, -5, '#d8d4c8');
    H.box(16, 2.8, 9, '#a9ad94').position.set(0, -3.4, 0);                     // hull
    [-5.5, -2, 1.5, 5].forEach(x => [-4.7, 4.7].forEach(z => H.disk(0.9, 0.5, '#46484e').position.set(x, -4.1, z)));
    const tur = new T.Group(); H.add(tur);                                     // turret turns with Ω
    H.box(7.2, 2, 5.6, '#c3c7ad', tur).position.set(0.4, -1, 0);
    const brl = new T.Group(); brl.position.set(r, 0, 0); tur.add(brl);         // barrel: elevation θ about the pin at C
    const b = rod(H, 0.35, '#5b5f4e', brl); b.rotation.z = -Math.PI / 2; b.scale.set(1, L, 1); b.position.set(L / 2, 0, 0);
    H.disk(0.25, 1.8, H.C.dark, brl);                                          // pin at C
    const shell = H.sphere(0.45, '#c2410c'); brl.add(shell);
    placeRod(T, rod(H, 0.05, '#9a958a'), [0, -2, 0], [0, 12, 0]);              // the vertical axis (drawn as a thin rod)
    aroundY(spinArrow(H, 1.6, W_COL, 0.1), 6);
    const lo = H.label('O'), lc = H.label('C'), lp = H.label('P'), lO = H.label('Ω', W_COL, 0.9); lO.position.set(2.3, 6, 0.5);
    [lo, lc, lp].forEach(l => l.scale.multiplyScalar(5));
    return { tur, brl, shell, lo, lc, lp, L, tri: triad(H, 5, 4), w: lvec(H, W_COL, 5, 'ω'), al: lvec(H, AL_COL, 5, 'α'), aP: lvec(H, A_COL, 5, 'a_P'), co: lvec(H, AL_COL, 5, '2ω × v_rel') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.tur.rotation.y = G.ps; o.brl.rotation.z = G.th;
    o.shell.position.set(o.L * ((st.t * 0.7) % 1), 0, 0);
    o.lo.position.set(-0.8, 0.8, 0.5); o.lc.position.set(...A3(G.C, [0, -1.2, 0.5])); o.lp.position.set(...A3(G.Pm, [0.6, -1, 0]));
    o.tri.set(G.C, G.fr); o.w.set(G.C, M3(G.w, 8)); o.al.set(G.C, M3(G.al, 20));
    o.aP.set(G.Pm, M3(G.T.a, 0.03)); o.co.set(G.Pm, M3(G.T.aCo, 0.03));
  }
});

/* =================================================================== 3.B.5 */
view3d({
  id: 'x3b-5', size: 1.0, target: [0, 0.2, 0], camera: [0.5, 0.4, 1],
  build(H){
    const T = H.THREE, a = 0.42, hD = 0.38, rD = 0.26;
    H.floor(-0.55, 0.55, 0.55, -0.42);
    H.box(0.2, 0.12, 0.2, '#cfcabd').position.set(0, -0.36, 0);
    placeRod(T, rod(H, 0.02, H.C.steel), [0, -0.3, 0], [0, 0, 0]);
    aroundY(spinArrow(H, 0.09, W_COL, 0.006), -0.16);
    const gim = new T.Group(); H.add(gim);                                     // gimbal: turns with ω₁
    placeRod(T, rod(H, 0.018, '#55585f', gim), [-a, 0, 0], [a, 0, 0]);
    [-a, a].forEach(x => placeRod(T, rod(H, 0.018, '#55585f', gim), [x, 0, 0], [x, hD, 0]));
    placeRod(T, rod(H, 0.008, FR_COL, gim), [-a, hD, 0], [a, hD, 0]);           // axle
    const dg = new T.Group(); dg.position.set(0, hD, 0); gim.add(dg);           // disk: spins about the axle (local x)
    const dk = H.disk(rD, 0.05, '#c9cad2', dg); dk.rotation.y = Math.PI / 2;
    const rad = H.bar(rD, 0.012, '#c2410c', dg, 0.012); rad.rotation.z = Math.PI / 2; rad.position.x = 0.028;
    const sp = spinArrow(H, 0.06, '#c2410c', 0.005, gim); sp.rotation.y = Math.PI / 2; sp.position.set(a + 0.07, hD, 0);
    const lO = H.label('ω_1', W_COL); lO.position.set(0.14, -0.16, 0.05);
    return { gim, dg, a, hD, tri: triad(H, 0.4, 0.16), w: lvec(H, W_COL, 0.45, 'ω'), al: lvec(H, AL_COL, 0.45, 'α') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.gim.rotation.y = G.ps; o.dg.rotation.x = G.ph;
    o.tri.set(G.D, G.fr); o.w.set(G.D, M3(G.w, 0.0055)); o.al.set(G.D, M3(G.al, 0.00045));
  }
});

/* =================================================================== 3.B.6 (inches) */
view3d({
  id: 'x3b-6', size: 26, target: [0, 0, 1], camera: [0.55, 0.42, 1],
  build(H){
    const T = H.THREE, R = 6, d = 4, XB = -15, XD = 15;
    // the disk reaches √(d² + R²) = 7.2 in from the BD axis, so the floor sits 8.5 in below it and the walls stand on it
    [[XB, -1], [XD, 1]].forEach(([x, s]) => { H.box(0.8, 17, 9, '#b9b3a3').position.set(x + s * 2.6, 0, 0); H.box(2, 4.4, 4.4, '#cfcabd').position.set(x + s * 1.2, 0, 0); });
    H.floor(-20, 20, 10, -8.5, '#d8d4c8');
    const fr = new T.Group(); H.add(fr);                                        // shafts BD and OA: turn with ω₁ about X
    const bd = rod(H, 0.6, '#7b808c', fr); bd.rotation.z = Math.PI / 2; bd.scale.set(1, XD - XB, 1);
    placeRod(T, rod(H, 0.5, '#7b808c', fr), [0, 0, 0], [0, 0, d]);
    const dg = new T.Group(); dg.position.set(0, 0, d); fr.add(dg);             // disk: spins with ω₂ about OA (local z)
    H.disk(R, 0.8, '#c9cad2', dg);
    const rad = H.bar(R, 0.25, '#c2410c', dg, 0.85); rad.rotation.z = Math.PI / 2;
    const P = H.sphere(0.45, V_COL, dg); P.position.set(0, R, 0.45);
    const s1 = spinArrow(H, 2.2, W_COL, 0.15); s1.rotation.y = Math.PI / 2; s1.position.set(XD - 4, 0, 0);
    const lb = H.label('B'), ld = H.label('D'), la = H.label('A'), lp = H.label('P', V_COL), l1 = H.label('ω_1', W_COL);
    lb.position.set(XB, 2, 0); ld.position.set(XD, 2, 0); la.position.set(0, 1.4, -0.8); l1.position.set(XD - 4, 3, 0);
    [lb, ld, la, lp, l1].forEach(l => l.scale.multiplyScalar(6));
    return { fr, dg, lp, tri: triad(H, 6, 4), v: lvec(H, V_COL, 6, 'v_P'), a: lvec(H, A_COL, 6, 'a_P') };
  },
  update(H, st, o){
    const G = st3(st); if (!G) return;
    o.fr.rotation.x = G.b; o.dg.rotation.z = st.V.w2 * G.t;
    o.lp.position.set(...A3(G.Pp, M3(G.n, 1.2)));
    o.tri.set([0, 0, 0], G.fr); o.v.set(G.Pp, M3(G.vP, 0.1)); o.a.set(G.Pp, M3(G.aP, 0.012));
  }
});

})();
