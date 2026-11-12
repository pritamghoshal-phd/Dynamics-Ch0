/* 3D views for examples 3.B.7 – 3.B.11. Each view reads the live state of the 2D clip with the same id
   (the clip stores its kinematics in st.K), so the physics is computed once and both views agree.
   Every view shows the moving frame axes (grey triad, labelled x, y, z), the angular velocity ω (red),
   the angular acceleration α (purple), and the velocity (green) and acceleration (orange) of the point. */
(function(){
const T = () => THREE;
const COLW = '#b42346', COLA = '#8a3fd1', COLV = '#17915a', COLAC = '#c2410c', COLF = '#5b606c';

// a small coordinate triad that belongs to a group (it moves and turns with the group)
function triad(H, parent, len, names, color = COLF, rad = 0.012 * len / 0.2){
  const g = new (T().Group)(); parent.add(g); const labs = [];
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((d, k) => {
    const sh = H.mesh(new (T().CylinderGeometry)(rad, rad, len * 0.82, 8), color, g); const cone = H.mesh(new (T().ConeGeometry)(rad * 2.6, len * 0.18, 12), color, g);
    const dir = new (T().Vector3)(...d), up = new (T().Vector3)(0, 1, 0);
    sh.quaternion.setFromUnitVectors(up, dir); sh.position.copy(dir.clone().multiplyScalar(len * 0.41));
    cone.quaternion.setFromUnitVectors(up, dir); cone.position.copy(dir.clone().multiplyScalar(len * 0.91));
    sh.castShadow = cone.castShadow = false;
    const l = H.label(names[k], color, 0.16); labs.push([l, dir.clone().multiplyScalar(len * 1.12)]);
  });
  return { g, update(){ labs.forEach(([l, p]) => { l.position.copy(g.localToWorld(p.clone())); }); } };
}
// trail of a point from the clip's history (st.tr), drawn as a line
function trailLine(H, color, n = 600){
  const geo = new (T().BufferGeometry)(); const pos = new Float32Array(n * 3); geo.setAttribute('position', new (T().BufferAttribute)(pos, 3)); geo.setDrawRange(0, 0);
  const ln = new (T().Line)(geo, new (T().LineBasicMaterial)({ color })); H.add(ln);
  return pts => { const m = Math.min(n, (pts || []).length); for (let k = 0; k < m; k++){ const p = pts[pts.length - m + k]; pos[3 * k] = p[0]; pos[3 * k + 1] = p[1]; pos[3 * k + 2] = p[2]; } geo.attributes.position.needsUpdate = true; geo.setDrawRange(0, m); };
}
const lab = (H, s, c, p, size) => { const l = H.label(s, c, size); if (p) l.position.set(...p); return l; };
const plus = (a, b, s = 1) => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
// put a label just beyond the tip of an arrow drawn from o along v
const atTip = (l, o, v, extra) => { const L = Math.hypot(...v) || 1; l.position.set(...plus(plus(o, v), v, extra / L)); l.visible = L > 1e-3; };
// fixed bearing block for a vertical shaft
function bearing3(H, y, up, s){ const b = H.box(s * 2.2, s * 1.4, s * 2.2, H.C.steel); b.position.set(0, y + (up ? 0.7 : -0.7) * s, 0); return b; }

/* ------------------------------------------------------------ 3.B.7 crane boom (metres) */
view3d({
  id: 'x3b-7', size: 11, target: [4, 2.5, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const g0 = -3.4; H.floor(-5, 13, 5, g0);
    const base = H.box(5.2, 0.7, 3.6, H.C.dark); base.position.set(0, g0 + 0.35, 0);
    [-1.4, 1.4].forEach(z => { const tr = H.box(6, 0.5, 0.8, '#55585f'); tr.position.set(0, g0 + 0.25, z); });
    const cab = new (T().Group)(); H.add(cab);
    const body = H.box(3.6, 2.4, 2.6, '#e2b23a', cab); body.position.set(0.2, -1.5, 0);
    const win = H.box(1.2, 0.9, 2.62, '#9fb6cf', cab); win.position.set(1.5, -1.0, 0);
    [-0.45, 0.45].forEach(z => { const pl = H.box(0.7, 0.6, 0.08, H.C.steel, cab); pl.position.set(0, -0.15, z); });   // pivot brackets at O
    const boom = new (T().Group)(); cab.add(boom);
    // lattice boom: four chords and diagonal braces, from O along local x
    const L = 12, chords = [[0.35, 0.35], [0.35, -0.35], [-0.35, 0.35], [-0.35, -0.35]];
    chords.forEach(([y, z]) => { const c = H.bar(L, 0.08, '#c9a227', boom, 0.08); c.position.set(0, y * 0.9, z * 0.9); });
    for (let q = 0; q < 12; q++){ [-0.31, 0.31].forEach(z => { const d = H.bar(Math.hypot(1, 0.63), 0.05, '#c9a227', boom, 0.05); d.position.set(q, q % 2 ? 0.31 : -0.31, z); d.rotation.z = (q % 2 ? -1 : 1) * Math.atan2(0.63, 1); }); }
    H.sphere(0.25, H.C.dark, boom).position.set(L, 0, 0);
    const hook = H.cable([[0, 0, 0], [0, -1, 0]]);
    const pivot = H.disk(0.12, 1.0, H.C.dark, cab); pivot.position.set(0, 0, 0);
    H.cable([[0, g0, 0], [0, 7, 0]], '#9aa0ab', 0.03);
    const fr = triad(H, boom, 2.2, ['x', 'y', 'z']);
    const aw = H.arrow(COLW, 6), aal = H.arrow(COLA, 6), av = H.arrow(COLV, 6), aa = H.arrow(COLAC, 6);
    const lw = lab(H, 'ω', COLW), lal = lab(H, 'α', COLA), lv = lab(H, 'v_P', COLV), la = lab(H, 'a_P', COLAC);
    lab(H, 'O', '#1c1d21', [-0.7, 0.5, 0.9]); const lP = lab(H, 'P'); lab(H, 'Y', COLF, [0, 7.5, 0]);
    const tr = trailLine(H, '#8a3fd1');
    return { cab, boom, hook, fr, aw, aal, av, aa, lw, lal, lv, la, lP, tr, L };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.cab.rotation.y = K.ps; o.boom.rotation.z = K.th; o.fr.update();
    const P = K.P; o.hook.set([P, plus(P, [0, -1.6, 0])]); o.lP.position.set(...plus(P, [0.2, 1.0, 0]));
    o.aw.set([0, 0, 0], scl(K.w, 9)); atTip(o.lw, [0, 0, 0], scl(K.w, 9), 0.8);
    o.aal.set([0, 0, 0], scl(K.al, 14)); atTip(o.lal, [0, 0, 0], scl(K.al, 14), 0.8);
    o.av.set(P, scl(K.v, 0.7)); atTip(o.lv, P, scl(K.v, 0.7), 0.8);
    o.aa.set(P, scl(K.a, 1.1)); atTip(o.la, P, scl(K.a, 1.1), 0.8);
    o.tr(st.tr);
  }
});

/* ------------------------------------------------------------ 3.B.8 disk on a rotating arm (L = 0.5 m, R = 0.2 m) */
view3d({
  id: 'x3b-8', size: 0.85, target: [0.2, 0, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const L = 0.5, R = 0.2, y0 = 0.34; H.floor(-0.6, 1.0, 0.6, -y0 - 0.05); H.ceiling(-0.4, 0.4, y0 + 0.05, 0.25);
    bearing3(H, -y0, false, 0.035); bearing3(H, y0, true, 0.035);
    const sh = new (T().Group)(); H.add(sh);
    const shaft = new (T().Mesh)(new (T().CylinderGeometry)(0.012, 0.012, 2 * y0, 16), H.mat(H.C.dark)); sh.add(shaft);
    const hub = H.disk(0.035, 0.05, H.C.steel, sh); hub.rotation.x = Math.PI / 2;
    const arm = H.bar(L, 0.025, H.C.steel, sh, 0.025); arm.position.z = -0.045;          // the arm runs behind the disk
    const axle = H.disk(0.012, 0.05, H.C.dark, sh); axle.position.set(L, 0, -0.022);
    const dg = new (T().Group)(); dg.position.set(L, 0, 0); sh.add(dg);
    H.disk(R, 0.016, '#d9cfb1', dg);
    const stripe = H.box(0.012, R, 0.018, H.C.orange, dg); stripe.position.set(0, R / 2, 0.001);
    H.sphere(0.012, '#1c1d21', dg).position.set(0, R, 0.01);
    const fr = triad(H, sh, 0.12, ['x', 'y', 'z']); fr.g.position.set(L, 0, 0.02);
    const aw = H.arrow(COLW, 0.3), av = H.arrow(COLV, 0.3), aa = H.arrow(COLAC, 0.3), aal = H.arrow(COLA, 0.3);
    const lw = lab(H, 'ω', COLW), lv = lab(H, 'v_P', COLV), la = lab(H, 'a_P', COLAC), lal = lab(H, 'α', COLA);
    const lO = lab(H, 'O', '#1c1d21', [-0.05, 0.05, 0.04]), lA = lab(H, 'A'), lP = lab(H, 'P');
    lab(H, 'ω_1', COLF, [0.06, y0 - 0.04, 0]);
    const tr = trailLine(H, '#8a3fd1');
    return { sh, dg, fr, aw, av, aa, aal, lw, lv, la, lal, lA, lP, tr };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.sh.rotation.y = K.ph; o.dg.rotation.z = K.be; o.fr.update();
    const A = K.A, P = K.P, Pf = plus(P, K.k, 0.012);
    o.lA.position.set(...plus(plus(A, K.k, 0.05), [0, -0.04, 0])); o.lP.position.set(...plus(Pf, [0, 0.04, 0]));
    o.aw.set(A, scl(K.w, 0.06)); atTip(o.lw, A, scl(K.w, 0.06), 0.03);
    o.aal.set([0, 0, 0], scl(K.al, 0.05)); atTip(o.lal, [0, 0, 0], scl(K.al, 0.05), 0.03);
    o.av.set(Pf, scl(K.v, 0.25)); atTip(o.lv, Pf, scl(K.v, 0.25), 0.03);
    o.aa.set(Pf, scl(K.a, 0.12)); atTip(o.la, Pf, scl(K.a, 0.12), 0.03);
    o.tr((st.tr || []).map(p => p));
  }
});

/* ------------------------------------------------------------ 3.B.9 disk rolling around a vertical axis (R = 0.6 m, r = 0.2 m) */
view3d({
  id: 'x3b-9', size: 1.15, target: [0.15, 0.15, 0], camera: [-0.35, 0.55, 1],
  build(H){
    const Ra = 0.6, r = 0.2; H.floor(-1.0, 1.0, 1.0);
    const ring = H.ring(Ra, 0.004, 2 * Math.PI, '#9aa0ab'); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; ring.castShadow = false;
    const post = new (T().Mesh)(new (T().CylinderGeometry)(0.025, 0.04, r, 16), H.mat(H.C.steel)); post.position.set(0, r / 2, 0); H.add(post);
    const ag = new (T().Group)(); ag.position.set(0, r, 0); H.add(ag);
    H.bar(Ra - 0.02, 0.025, H.C.steel, ag, 0.025);
    const hubO = H.sphere(0.03, H.C.dark, ag);
    const dg = new (T().Group)(); dg.position.set(Ra, 0, 0); ag.add(dg);
    const disk = H.disk(r, 0.04, '#d9cfb1', dg); disk.rotation.y = Math.PI / 2;
    for (let q = 0; q < 4; q++){ const s = H.box(0.045, r * 0.95, 0.012, q ? H.C.dark : H.C.orange, dg); s.geometry.translate(0, r * 0.475, 0); s.rotation.x = q * Math.PI / 2; s.position.x = 0.001; }
    const fr = triad(H, dg, 0.13, ['x', 'y', 'z']); fr.g.position.set(0.04, 0, 0);
    const Q = H.sphere(0.014, '#17915a', ag); Q.position.set(Ra, -r + 0.01, 0);
    const axisLine = H.cable([[0, r, 0], [Ra, 0, 0]], COLW, 0.003);
    H.cable([[0, 0, 0], [0, 0.6, 0]], '#9aa0ab', 0.004);
    const aw = H.arrow(COLW, 0.35), aal = H.arrow(COLA, 0.35), av = H.arrow(COLV, 0.35);
    const lw = lab(H, 'ω', COLW), lal = lab(H, 'α', COLA), lv = lab(H, 'v_C', COLV), lC = lab(H, 'C'), lQ = lab(H, 'Q', '#17915a');
    lab(H, 'O', '#1c1d21', [-0.07, r + 0.06, 0]); lab(H, 'Ω', COLF, [0.06, 0.6, 0]);
    return { ag, dg, fr, axisLine, aw, aal, av, lw, lal, lv, lC, lQ, Ra, r };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.ag.rotation.y = K.ph; o.dg.rotation.x = K.sp; o.fr.update();
    const C = K.C, Qp = [C[0], 0, C[2]];
    o.axisLine.set([[0, o.r, 0], Qp]);
    o.lC.position.set(...plus(C, [0, 0.27, 0])); o.lQ.position.set(...plus(Qp, K.k, 0.06));
    o.aw.set(C, scl(K.w, 0.08)); atTip(o.lw, C, scl(K.w, 0.08), 0.04);
    o.aal.set(C, scl(K.al, 0.08)); atTip(o.lal, C, scl(K.al, 0.08), 0.04);
    o.av.set(C, scl(K.vC, 0.4)); atTip(o.lv, C, scl(K.vC, 0.4), 0.04);
  }
});

/* ------------------------------------------------------------ 3.B.10 telescoping rod (L = 0.12 m, d = 0.02 m) */
view3d({
  id: 'x3b-10', size: 0.2, target: [0, 0.06, 0.03], camera: [1, 0.35, 0.45],
  build(H){
    const d = 0.02, zw = -0.012;
    const wall = H.box(0.24, 0.34, 0.01, H.C.wall); wall.position.set(0, 0.06, zw - 0.005);
    H.floor(-0.2, 0.2, 0.15, -0.11); wall.position.y = 0.06;
    const br = H.box(0.03, 0.03, 0.012, H.C.steel); br.position.set(0, 0, zw + 0.006);
    const pinM = H.disk(0.004, 0.045, H.C.dark); pinM.rotation.y = Math.PI / 2;
    const ag = new (T().Group)(); H.add(ag);
    const arm = H.box(0.012, 0.012, d, H.C.steel, ag); arm.position.set(0, 0, d / 2);
    const rg = new (T().Group)(); ag.add(rg);
    const collar = H.box(0.024, 0.016, 0.02, H.C.dark, rg); collar.position.set(0, 0, d);
    const tube = H.box(0.012, 0.07, 0.012, '#8a8f99', rg); tube.position.set(0, 0.035, d);
    const inner = H.box(0.007, 1, 0.007, '#d9cfb1', rg); inner.geometry.translate(0, 0.5, 0); inner.position.set(0, 0.03, d);
    H.sphere(0.005, '#1c1d21', rg).name = 'tipA';
    const fr = triad(H, rg, 0.05, ['x', 'y', 'z'], COLF, 0.0016);
    const aw = H.arrow(COLW, 0.09), aal = H.arrow(COLA, 0.09), av = H.arrow(COLV, 0.09), aa = H.arrow(COLAC, 0.09);
    const lw = lab(H, 'ω', COLW), lal = lab(H, 'α', COLA), lv = lab(H, 'v_A', COLV), la = lab(H, 'a_A', COLAC);
    const lA = lab(H, 'A'), lC = lab(H, 'C'); lab(H, 'O', '#1c1d21', [0.006, -0.016, -0.008]);
    const tip = rg.children.find(c => c.name === 'tipA');
    const tr = trailLine(H, '#8a3fd1');
    return { ag, rg, inner, tip, fr, aw, aal, av, aa, lw, lal, lv, la, lA, lC, tr };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.ag.rotation.x = K.ga; o.rg.rotation.z = K.de; o.fr.update();
    o.inner.scale.y = Math.max(0.01, K.L - 0.03); o.tip.position.set(0, K.L, 0.02);
    const A = K.A; o.lA.position.set(...plus(A, K.y, 0.018)); o.lC.position.set(...plus(K.C, [0.004, -0.02, 0.014]));
    o.aw.set([0, 0, 0], scl(K.w, 0.045)); atTip(o.lw, [0, 0, 0], scl(K.w, 0.045), 0.01);
    o.aal.set([0, 0, 0], scl(K.al, 0.03)); atTip(o.lal, [0, 0, 0], scl(K.al, 0.03), 0.01);
    o.av.set(A, scl(K.v, 0.3)); atTip(o.lv, A, scl(K.v, 0.3), 0.01);
    o.aa.set(A, scl(K.a, 0.16)); atTip(o.la, A, scl(K.a, 0.16), 0.01);
    o.tr(st.tr);
  }
});

/* ------------------------------------------------------------ 3.B.11 disk on a spinning arm (b = 0.5 m, r = 0.2 m) */
view3d({
  id: 'x3b-11', size: 0.85, target: [0.2, 0, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const b = 0.5, r = 0.2, y0 = 0.34; H.floor(-0.6, 1.0, 0.6, -y0 - 0.05); H.ceiling(-0.4, 0.4, y0 + 0.05, 0.25);
    bearing3(H, -y0, false, 0.035); bearing3(H, y0, true, 0.035);
    const sh = new (T().Group)(); H.add(sh);
    sh.add(new (T().Mesh)(new (T().CylinderGeometry)(0.012, 0.012, 2 * y0, 16), H.mat(H.C.dark)));
    const collar = H.box(0.07, 0.06, 0.06, H.C.steel, sh);
    const ag = new (T().Group)(); sh.add(ag);
    const armG = new (T().CylinderGeometry)(0.014, 0.014, b - 0.035, 20); armG.rotateZ(-Math.PI / 2); armG.translate((b + 0.035) / 2, 0, -0.045);   // behind the disk
    ag.add(new (T().Mesh)(armG, H.mat(H.C.steel)));
    const stripe = H.box(0.3, 0.006, 0.01, H.C.orange, ag); stripe.position.set(0.25, 0.012, -0.045);
    const axle = H.disk(0.01, 0.05, H.C.dark, ag); axle.position.set(b, 0, -0.022);
    const dg = new (T().Group)(); dg.position.set(b, 0, 0); ag.add(dg);
    H.disk(r, 0.016, '#d9cfb1', dg);
    const ds = H.box(0.012, r, 0.018, H.C.orange, dg); ds.position.set(0, r / 2, 0.001);
    H.sphere(0.012, '#1c1d21', dg).position.set(0, r, 0.01);
    const fr = triad(H, ag, 0.12, ['x', 'y', 'z']); fr.g.position.set(b, 0, 0.02);
    const aw = H.arrow(COLW, 0.3), av = H.arrow(COLV, 0.3), aa = H.arrow(COLAC, 0.3), aal = H.arrow(COLA, 0.3);
    const lw = lab(H, 'ω', COLW), lv = lab(H, 'v_A', COLV), la = lab(H, 'a_A', COLAC), lal = lab(H, 'α', COLA);
    lab(H, 'O', '#1c1d21', [-0.06, 0.06, 0.04]); const lB = lab(H, 'B'), lA = lab(H, 'A');
    lab(H, 'ω_2', COLF, [0.06, y0 - 0.04, 0]);
    const tr = trailLine(H, '#8a3fd1');
    return { sh, ag, dg, fr, aw, av, aa, aal, lw, lv, la, lal, lA, lB, tr };
  },
  update(H, st, o){
    const K = st.K; if (!K) return;
    o.sh.rotation.y = K.p2; o.ag.rotation.x = K.p1; o.dg.rotation.z = K.p3; o.fr.update();
    const B = K.B, A = K.A, Af = plus(A, K.k, 0.012);
    o.lB.position.set(...plus(plus(B, K.k, 0.05), K.j, -0.04)); o.lA.position.set(...plus(Af, K.j, 0.04));
    o.aw.set(B, scl(K.w, 0.06)); atTip(o.lw, B, scl(K.w, 0.06), 0.03);
    o.aal.set([0, 0, 0], scl(K.al, 0.05)); atTip(o.lal, [0, 0, 0], scl(K.al, 0.05), 0.03);
    o.av.set(Af, scl(K.v, 0.25)); atTip(o.lv, Af, scl(K.v, 0.25), 0.03);
    o.aa.set(Af, scl(K.a, 0.12)); atTip(o.la, Af, scl(K.a, 0.12), 0.03);
    o.tr(st.tr);
  }
});

})();
