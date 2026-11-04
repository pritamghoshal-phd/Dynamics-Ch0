/* 3D views for the impulse–momentum examples 4.C.8 – 4.C.13.
   Each view reads the live state of the 2D clip with the same id (the clips store what they draw in st.pos),
   so the 3D motion is always the motion computed by the 2D animation. Metres, y up, z toward the viewer. */
(function(){
const FT = 0.3048;
// a thin horizontal stick along x (for paths and marks) and a translucent horizontal plane
const stickX = (H, x0, x1, y, z, color = '#9a958a', t = 0.004) => { const m = H.box(x1 - x0, t, t, color); m.position.set((x0 + x1) / 2, y, z); m.castShadow = false; return m; };
function plane(H, x0, x1, z0, z1, y, color = '#cfe0d4', opacity = 0.35){
  const m = new H.THREE.Mesh(new H.THREE.PlaneGeometry(x1 - x0, z1 - z0), new H.THREE.MeshStandardMaterial({ color, transparent: true, opacity, side: H.THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); H.add(m);
  const grid = new H.THREE.GridHelper(1, 10, 0xa9b8ad, 0xc3d0c6); grid.scale.set(x1 - x0, 1, z1 - z0); grid.position.set((x0 + x1) / 2, y + 0.0005, (z0 + z1) / 2); H.add(grid);
  return m;
}
function bulletMesh(H, len = 0.07, r = 0.012){
  const g = new H.THREE.Group(); H.add(g);
  const body = H.mesh(new H.THREE.CylinderGeometry(r, r, len * 0.7, 16), '#9c8540', g); body.rotation.z = Math.PI / 2; body.position.x = len * 0.15;
  const nose = H.mesh(new H.THREE.ConeGeometry(r, len * 0.3, 16), '#9c8540', g); nose.rotation.z = Math.PI / 2; nose.position.x = -len * 0.35;
  return g; // nose points to −x
}
function flashMesh(H){ const m = H.mesh(new H.THREE.SphereGeometry(1, 16, 10), '#f2b632', null, { emissive: '#f2b632', emissiveIntensity: 0.9, transparent: true, opacity: 0.7 }); m.castShadow = false; m.visible = false; return m; }

/* 4.C.8  Bullet embeds in a block hanging from a cord (lengths in ft converted to m). O is 2.2 m above the floor. */
view3d({
  id: 'x4c-8', size: 1.9, target: [-0.2, 1.3, 0], camera: [-0.3, 0.25, 1],
  build(H){
    const O = [0, 2.2], L = 5 * FT, b = 40 / 44 * FT;           // same block size as the 2D picture
    H.floor(-1.4, 1.4, 0.7); H.ceiling(-0.7, 0.7, O[1] + 0.25, 0.35);
    H.pinSupport(O[0], O[1], 0.25, 'down', -0.06);
    const blk = new H.THREE.Group(); H.add(blk); H.box(b, b, b, '#e3cf98', blk);
    const hole = H.disk(0.012, 0.01, '#5a4a20', blk); hole.rotation.y = Math.PI / 2; hole.position.set(b / 2 + 0.002, 0, 0);
    const cord = H.cable([[0, 0, 0], [0, 1, 0]], H.C.dark, 0.008);
    const bul = bulletMesh(H, 16 / 44 * FT, 0.012), fl = flashMesh(H), av = H.arrow(H.C.blue, 0.7);   // same length as the 2D bullet, so its nose meets the block face exactly
    const lo = H.label('O'), la = H.label('A'), lb = H.label('B', '#6b5a20', 0.13);
    // dashed outline of the highest position: a wire box
    const ghost = new H.THREE.LineSegments(new H.THREE.EdgesGeometry(new H.THREE.BoxGeometry(b, b, b)), new H.THREE.LineDashedMaterial({ color: 0x8a8478, dashSize: 0.03, gapSize: 0.02 }));
    ghost.computeLineDistances(); H.add(ghost);
    lo.position.set(O[0] + 0.14, O[1] + 0.04, 0.1);
    return { O, L, b, blk, cord, bul, fl, av, la, lb, ghost };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    const th = p.th, cx = o.O[0] - o.L * Math.sin(th), cy = o.O[1] - o.L * Math.cos(th);
    o.blk.position.set(cx, cy, 0); o.blk.rotation.z = -th;
    o.cord.set([[o.O[0], o.O[1], 0], [o.O[0] - (o.L - o.b / 2) * Math.sin(th), o.O[1] - (o.L - o.b / 2) * Math.cos(th), 0]]);
    o.la.position.set(cx, cy + 0.26, 0.2);
    const tm = st.thMax || 0; o.ghost.position.set(o.O[0] - o.L * Math.sin(tm), o.O[1] - o.L * Math.cos(tm), 0); o.ghost.rotation.z = -tm;
    if (p.bx !== null && p.bx !== undefined){
      const bx = o.O[0] + p.bx * FT; o.bul.visible = true; o.bul.position.set(bx, cy, 0); o.lb.visible = true; o.lb.position.set(bx + 0.02, cy - 0.12, 0.1);
      o.av.set([bx - 0.06, cy + 0.1, 0], [-0.3, 0, 0]);
    } else { o.bul.visible = false; o.lb.visible = false; o.av.set([0, 0, 0], [0, 0, 0]); }
    o.fl.visible = p.flash > 0.02; if (o.fl.visible){ const s = 0.03 + 0.12 * p.flash; o.fl.scale.set(s, s, s); o.fl.position.set(cx + o.b / 2, cy, 0); o.fl.material.opacity = 0.7 * p.flash; }
  }
});

/* 4.C.9  Bullet passes through block A, which then slides to rest. The view follows the block, so the floor marks move. */
view3d({
  id: 'x4c-9', size: 1.6, target: [0, 0.2, 0], camera: [-0.2, 0.35, 1],
  build(H){
    const b = 0.3;
    const fl = H.box(5.2, 0.04, 1.2, H.C.ground); fl.position.set(0, -0.02, 0); fl.castShadow = false;
    const marks = new H.THREE.Group(); H.add(marks);
    for (let k = -3; k <= 3; k++){ const m = H.box(0.025, 0.004, 1.1, '#9a958a', marks); m.position.set(k, 0.002, 0); m.castShadow = false; }
    const blk = H.box(b, b, b, '#e3cf98'); blk.position.set(0, b / 2, 0);
    const bul = bulletMesh(H, 16 / 110, 0.012), fla = flashMesh(H);   // same length as the 2D bullet (16 px at 110 px/m)
    const imp = H.box(0.03, 0.5, 0.03, H.C.red); const stop = H.box(0.03, 0.5, 0.03, H.C.green);
    const li = H.label('impact point', H.C.red, 0.1), ld = H.label('stops here (d)', H.C.green, 0.1);
    const la = H.label('A'), lb = H.label('B', '#6b5a20', 0.12), av = H.arrow(H.C.green, 0.7), af = H.arrow(H.C.red, 0.6);
    la.position.set(0, b + 0.12, 0.2);
    return { b, marks, blk, bul, fla, imp, stop, li, ld, lb, av, af };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    const x = p.x; o.marks.position.x = x - Math.floor(x);                      // the floor moves right as the block slides left
    const show = (m, l, X) => { const v = Math.abs(X) < 2.5; m.visible = v; l.visible = v; m.position.set(X, 0.25, -0.35); l.position.set(X, 0.58, -0.35); };
    show(o.imp, o.li, x); show(o.stop, o.ld, x - st.d);
    if (p.bx !== null && p.bx !== undefined && Math.abs(p.bx) < 2.4){ o.bul.visible = true; o.lb.visible = true; o.bul.position.set(p.bx, o.b / 2, 0); o.lb.position.set(p.bx, o.b / 2 + 0.1, 0.1); }
    else { o.bul.visible = false; o.lb.visible = false; }
    o.fla.visible = p.phase === 0 && p.bx !== null && Math.abs(p.bx) < 0.25; if (o.fla.visible){ o.fla.scale.set(0.06, 0.06, 0.06); o.fla.position.set(o.b / 2, o.b / 2, 0); }
    if (p.phase === 1 && p.v > 0.05){ o.av.set([-o.b / 2 - 0.03, o.b / 2, 0], [-Math.min(0.9, 0.08 * p.v + 0.1), 0, 0]); o.af.set([0.02, 0.02, 0.18], [0.35, 0, 0]); }
    else { o.av.set([0, 0, 0], [0, 0, 0]); o.af.set([0, 0, 0], [0, 0, 0]); }
  }
});

/* 4.C.10  Head-on impact of two blocks on a smooth surface. */
view3d({
  id: 'x4c-10', size: 1.7, target: [0, 0.2, 0], camera: [-0.25, 0.35, 1],
  build(H){
    H.floor(-2.4, 2.4, 0.6);
    const A = H.box(0.36, 0.36, 0.36, '#cdd8ec'), B = H.box(0.42, 0.42, 0.42, '#e3cf98'), fl = flashMesh(H);
    const la = H.label('A'), lb = H.label('B'), aA = H.arrow(H.C.blue, 0.7), aB = H.arrow(H.C.green, 0.7);
    return { A, B, fl, la, lb, aA, aB };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    const vis = X => Math.abs(X) < 2.6;
    o.A.visible = vis(p.xA); o.B.visible = vis(p.xB);
    o.A.position.set(p.xA, 0.18, 0); o.B.position.set(p.xB, 0.21, 0);
    o.la.position.set(p.xA, 0.5, 0.1); o.lb.position.set(p.xB, 0.56, 0.1); o.la.visible = o.A.visible; o.lb.visible = o.B.visible;
    const after = st.t >= st.tc, va = after ? st.vA2 : st.vA1, vb = after ? st.vB2 : st.vB1, k = 0.25;
    o.aA.set([p.xA, 0.18, 0.22], Math.abs(va) > 0.02 && o.A.visible ? [k * va, 0, 0] : [0, 0, 0]);
    o.aB.set([p.xB, 0.21, 0.25], Math.abs(vb) > 0.02 && o.B.visible ? [k * vb, 0, 0] : [0, 0, 0]);
    o.fl.visible = p.flash > 0.02; if (o.fl.visible){ const s = 0.03 + 0.1 * p.flash; o.fl.scale.set(s, s, s); o.fl.position.set(0, 0.18, 0); }
  }
});

/* 4.C.11  Oblique impact of two spheres whose centers move in one horizontal plane (y = Y0).
   The 2D top view (x right, y up) maps to (x, Y0, −y). */
view3d({
  id: 'x4c-11', size: 0.55, target: [0.06, 0.6, 0.06], camera: [-0.15, 0.9, 1],
  build(H){
    const Y0 = 0.6;
    H.floor(-0.8, 0.9, 0.7);
    plane(H, -0.35, 0.5, -0.25, 0.35, Y0);
    stickX(H, -0.35, 0.5, Y0, 0); stickX(H, -0.35, 0.5, Y0, 0.075);
    const A = H.sphere(0.075, '#9a9a9a'), B = H.sphere(0.048, '#d0d0d0');
    const li = H.cable([[0, 0, 0], [0, 1, 0]], H.C.red, 0.0025);
    const la = H.label('A', '#1c1d21', 0.07), lb = H.label('B', '#1c1d21', 0.06), ln = H.label('line of impact', H.C.red, 0.035), lp = H.label('horizontal plane', '#5e6f62', 0.035);
    lp.position.set(-0.28, Y0 + 0.01, -0.22);
    const aA = H.arrow(H.C.blue, 0.25), aB = H.arrow(H.C.green, 0.25);
    return { Y0, A, B, li, la, lb, ln, aA, aB };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    const P = q => [q[0], o.Y0, -q[1]];
    o.A.position.set(...P(p.A)); o.B.position.set(...P(p.B));
    o.la.position.set(p.A[0], o.Y0 + 0.11, -p.A[1]); o.lb.position.set(p.B[0], o.Y0 + 0.08, -p.B[1]);
    const c = [st.rA * st.n[0], st.rA * st.n[1]], n = st.n;
    o.li.set([P([c[0] - 0.2 * n[0], c[1] - 0.2 * n[1]]), P([c[0] + 0.25 * n[0], c[1] + 0.25 * n[1]])]);
    o.ln.position.set(...P([c[0] + 0.27 * n[0], c[1] + 0.27 * n[1]]));
    const va = p.after ? st.vA2 : st.vA1, vb = p.after ? st.vB2 : st.vB1, k = 0.012;
    const dir = (q, v, r) => { const L = Math.hypot(v[0], v[1]) || 1; return [q[0] + v[0] / L * r, q[1] + v[1] / L * r]; };
    o.aA.set(P(dir(p.A, va, 0.08)), [k * va[0], 0, -k * va[1]]); o.aB.set(P(dir(p.B, vb, 0.052)), [k * vb[0], 0, -k * vb[1]]);
  }
});

/* 4.C.12  Cue ball and object ball near the side pocket. Table cloth at y = 0.8; the 2D top view (x, y) maps to (x, 0.8 + r, −y). */
view3d({
  id: 'x4c-12', size: 0.75, target: [0.1, 0.8, -0.05], camera: [-0.2, 0.9, 1],
  build(H){
    const Yc = 0.8, Ry = 0.30, pr = 0.055;
    const cloth = H.box(1.4, 0.06, 0.75, '#5f9a72'); cloth.position.set(0.15, Yc - 0.03, 0.04);
    const legs = [[-0.5, -0.28], [0.8, -0.28], [-0.5, 0.36], [0.8, 0.36]]; legs.forEach(([x, z]) => { const l = H.box(0.06, Yc - 0.06, 0.06, H.C.wood); l.position.set(x, (Yc - 0.06) / 2, z); });
    H.floor(-0.9, 1.2, 0.6);
    // cushion (rail) along the far edge, with a gap for the side pocket at x = 0
    [[-0.55, -pr], [pr, 0.85]].forEach(([x0, x1]) => { const r = H.box(x1 - x0, 0.045, 0.05, '#3f6e4f'); r.position.set((x0 + x1) / 2, Yc + 0.022, -Ry - 0.025); const w = H.box(x1 - x0, 0.06, 0.06, H.C.wood); w.position.set((x0 + x1) / 2, Yc + 0.03, -Ry - 0.08); });
    const pocket = H.disk(pr, 0.002, '#141414'); pocket.rotation.x = Math.PI / 2; pocket.position.set(0, Yc + 0.001, -Ry);
    const A = H.sphere(0.0286, '#f1ecdc'), B = H.sphere(0.0286, '#c43c3c');
    const pathA = H.cable([[0, 0, 0], [0, 1, 0]], '#7d8a80', 0.0015), pathA2 = H.cable([[0, 0, 0], [0, 1, 0]], '#7d8a80', 0.0015);
    const la = H.label('A', '#1c1d21', 0.05), lb = H.label('B', '#1c1d21', 0.05), lp = H.label('side pocket', '#5b5a55', 0.035);
    lp.position.set(0, Yc + 0.08, -Ry - 0.05);
    const aA = H.arrow(H.C.blue, 0.25), aB = H.arrow(H.C.green, 0.25);
    return { Yc, Ry, A, B, la, lb, pathA, pathA2, aA, aB };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    const y = o.Yc + p.r, P = q => [q[0], y, -q[1]];
    o.A.position.set(...P(p.A)); o.la.position.set(p.A[0], y + 0.07, -p.A[1]);
    o.B.visible = !p.inPocket; o.lb.visible = !p.inPocket; o.B.position.set(...P(p.B)); o.lb.position.set(p.B[0] + 0.05, y + 0.06, -p.B[1]);
    const Ac = [0, -2 * p.r]; o.pathA.set([P([Ac[0] - st.vA1[0] * 0.25, Ac[1] - st.vA1[1] * 0.25]), P(Ac)]); o.pathA2.set(st.Apath.map(P));   // the path after the impact includes the bounce off the cushion
    const after = p.B[1] > 0 || p.A[0] > 1e-6, va = p.vA || (after ? st.vA2 : st.vA1), k = 0.06;
    o.aA.set([p.A[0], y + 0.035, -p.A[1]], [k * va[0], 0, -k * va[1]]);
    o.aB.set([p.B[0], y + 0.035, -p.B[1]], after && !p.inPocket ? [0, 0, -k * st.vB2[1]] : [0, 0, 0]);
  }
});

/* 4.C.13  Newton's cradle. Each ball hangs from two cords (a V) attached to the front and back top bars, so it swings in the x–y plane. */
view3d({
  id: 'x4c-13', size: 0.6, target: [0, 0.2, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const Y0 = 0.34, zb = 0.09, X = 0.36, NMAX = 8;
    const base = H.box(2 * X + 0.08, 0.03, 2 * zb + 0.1, '#3a3d44'); base.position.set(0, 0.015, 0);
    [-X, X].forEach(x => [-zb, zb].forEach(z => { const p = H.box(0.012, Y0, 0.012, H.C.steel); p.position.set(x, Y0 / 2 + 0.03, z); }));
    [-zb, zb].forEach(z => { const t = H.box(2 * X, 0.012, 0.012, H.C.steel); t.position.set(0, Y0 + 0.03, z); });
    const balls = [], cords = [];
    for (let i = 0; i < NMAX; i++){ balls.push(H.sphere(0.02, '#b9bec8')); cords.push(H.cable([[0, 0, 0], [0, 1, 0], [0, 0, 1]], '#555', 0.0012)); }
    balls.forEach(b => { b.material.metalness = 0.6; b.material.roughness = 0.25; });
    const l1 = H.label('1', '#1c1d21', 0.04), lN = H.label('N', '#1c1d21', 0.045);
    return { Y0: Y0 + 0.03, zb, balls, cords, l1, lN };
  },
  update(H, st, o){
    const p = st.pos; if (!p) return;
    o.balls.forEach((b, i) => {
      const on = i < p.N; b.visible = on; o.cords[i].group.visible = on; if (!on) return;
      const x = p.piv[i] + p.L * Math.sin(p.th[i]), y = o.Y0 - p.L * Math.cos(p.th[i]);
      b.position.set(x, y, 0);
      o.cords[i].set([[p.piv[i], o.Y0, -o.zb], [x, y, 0], [p.piv[i], o.Y0, o.zb]]);
      if (i === 0) o.l1.position.set(x, y - 0.045, 0.03);
      if (i === p.N - 1) o.lN.position.set(x, y - 0.045, 0.03);
    });
  }
});

})();
