/* 3D views for the Chapter 6 free-vibration examples 6.B.11 – 6.B.15.
   Each view reads the live state of the 2D clip with the same id (x6b-11 … x6b-15 in ch6-exB3.js): the displacement
   and the layout (rest gaps, dashpot cylinder and rod lengths) come from st.g, so both views always agree.
   Lengths are in metres. The 2D picture plane is x–y; 6.B.14 is a top view, mapped to the horizontal x–z plane. */
(function(){

/* ---------- local helpers ---------- */
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
// dashpot: a cylinder of length Lc fixed to the base point and a rod of length Lr fixed to the moving point (same lengths as in 2D)
function dashpot(H, rc, color){
  const T = H.THREE, g = new T.Group(); H.add(g);
  const cylG = new T.CylinderGeometry(rc, rc, 1, 24, 1, true); cylG.translate(0, 0.5, 0);
  const cyl = H.mesh(cylG, color || '#c9c3b5', g, { side: T.DoubleSide, transparent: true, opacity: 0.55 });
  const cap = H.mesh(new T.CylinderGeometry(rc, rc, 0.012, 24), '#8a8478', g);
  const rodG = new T.CylinderGeometry(rc * 0.28, rc * 0.28, 1, 12); rodG.translate(0, -0.5, 0);
  const rod = H.mesh(rodG, H.C.steel, g);
  const pist = H.mesh(new T.CylinderGeometry(rc * 0.9, rc * 0.9, 0.014, 24), H.C.dark, g);
  return { group: g, set(a, b, Lc, Lr){
    const A = new T.Vector3(...a), B = new T.Vector3(...b), u = B.clone().sub(A), D = u.length(); u.normalize();
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), u);
    cyl.position.copy(A); cyl.quaternion.copy(q); cyl.scale.set(1, Lc, 1);
    cap.position.copy(A).addScaledVector(u, 0.006); cap.quaternion.copy(q);
    rod.position.copy(B); rod.quaternion.copy(q); rod.scale.set(1, Lr, 1);
    pist.position.copy(A).addScaledVector(u, D - Lr); pist.quaternion.copy(q);
  } };
}
const grp = (H, parent) => { const g = new H.THREE.Group(); H.add(g, parent); return g; };

/* ---------- 6.B.11  block M with spring K and dashpot C to the wall (clip 'x6b-11') ----------
   Wall at x = 0, block of 0.5 × 0.4 × 0.4 m on a smooth floor; spring at mid-height of its upper part, dashpot below. */
view3d({
  id: 'x6b-11', size: 2.2, target: [2.3, 0.35, 0], camera: [-0.2, 0.3, 1],
  build(H){
    H.floor(-0.3, 7.5, 0.7); H.wall(0, 0, 1.0, 0.7);
    const blk = H.box(0.5, 0.4, 0.4, '#e9d9a8');
    const sp = spring(H, 0.05, 12, 0.008), dp = dashpot(H, 0.035);
    const lM = H.label('M'), lK = H.label('K', '#5b5a55'), lC = H.label('C', '#5b5a55'), ar = H.arrow(H.C.green, 0.8);
    return { blk, sp, dp, lM, lK, lC, ar };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const xb = g.G + g.x, ys = 0.4 * 0.72, yd = 0.4 * 0.28;
    o.blk.position.set(xb + 0.25, 0.2, 0);
    o.sp.set([0, ys, 0], [xb, ys, 0]); o.dp.set([0, yd, 0], [xb, yd, 0], g.Lc, g.Lr);
    o.lM.position.set(xb + 0.25, 0.55, 0.15); o.lK.position.set(xb * 0.5, ys + 0.13, 0.05); o.lC.position.set(g.Lc * 0.5, yd - 0.1, 0.12);
    o.ar.set([xb + 0.55, 0.5, 0], [0.4, 0, 0]);
  }
});

/* ---------- 6.B.12  block hanging from a spring and a dashpot (clip 'x6b-12') ----------
   The ceiling height adapts to the layout so the block never reaches the floor; dashpot on the left, spring on the right. */
view3d({
  id: 'x6b-12', size: 1.5, target: [0, 0.9, 0], camera: [-0.3, 0.2, 1],
  build(H){
    H.floor(-0.8, 0.8, 0.6);
    const ceil = H.box(1.2, 0.05, 0.8, H.C.wall);
    const blk = H.box(0.3, 0.22, 0.3, '#e9d9a8');
    const sp = spring(H, 0.035, 10, 0.006), dp = dashpot(H, 0.028);
    const lm = H.label('m'), lc = H.label('c', '#5b5a55'), lk = H.label('k', '#5b5a55');
    const eq = H.box(0.36, 0.004, 0.004, H.C.green);                      // marks the top of the block at static equilibrium
    return { ceil, blk, sp, dp, lm, lc, lk, eq };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const Y0 = g.L0 + g.hi + g.bh + 0.35;                         // ceiling height above the floor
    o.ceil.position.set(0, Y0 + 0.025, 0);
    const top = Y0 - g.L0 - g.y, xd = -0.084, xs = 0.084;
    o.blk.position.set(0, top - g.bh / 2, 0);
    o.dp.set([xd, Y0, 0], [xd, top, 0], g.Lc, g.Lr); o.sp.set([xs, Y0, 0], [xs, top, 0]);
    o.lm.position.set(0, top - g.bh / 2, 0.2); o.lc.position.set(xd - 0.1, Y0 - g.Lc / 2, 0.05); o.lk.position.set(xs + 0.1, (Y0 + top) / 2, 0.05);
    const ye = Y0 - g.L0 - g.dst; o.eq.position.set(0.36, ye, 0);   // top of the block at static equilibrium
  }
});

/* ---------- 6.B.13  block A sticks to the L-shaped carriage B (clip 'x6b-13') ----------
   Wall at x = 0; x of the clip is to the LEFT, so B's upright is at post = G − x. Spring and dashpot side by side in z. */
view3d({
  id: 'x6b-13', size: 2.9, target: [4.0, 0.35, 0], camera: [-0.15, 0.3, 1],
  build(H){
    H.floor(-0.3, 10.5, 0.7); H.wall(0, 0, 1.1, 0.7);
    const B = grp(H);
    const up = H.box(0.08, 0.62, 0.5, '#c9ccd2', B); up.position.set(0.04, 0.31, 0);
    const pl = H.box(1.7, 0.06, 0.5, '#c9ccd2', B); pl.position.set(0.85, 0.03, 0);
    const A = H.box(0.32, 0.32, 0.32, '#8f97a6');
    const sp = spring(H, 0.05, 14, 0.008), dp = dashpot(H, 0.035);
    const lA = H.label('A'), lB = H.label('B'), lk = H.label('k', '#5b5a55'), lc = H.label('c', '#5b5a55'), ar = H.arrow(H.C.blue, 0.8);
    return { B, A, sp, dp, lA, lB, lk, lc, ar };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.B.position.set(g.post, 0, 0);
    o.A.position.set(g.aL + g.aS / 2, g.pt + g.aS / 2, 0);
    const yS = g.ph * 0.75, yD = g.ph * 0.32;
    o.sp.set([0, yS, 0.12], [g.post, yS, 0.12]); o.dp.set([0, yD, -0.12], [g.post, yD, -0.12], g.Lc, g.Lr);
    o.lA.position.set(g.aL + g.aS / 2, g.pt + g.aS + 0.14, 0); o.lB.position.set(g.post + 0.04, g.ph + 0.14, 0);
    o.lk.position.set(g.post / 2, yS + 0.13, 0.12); o.lc.position.set(g.Lc / 2, yD - 0.1, -0.2);
    o.ar.set([g.aL + g.aS + 0.1, g.pt + g.aS + 0.1, 0], g.stuck ? [0, 0, 0] : [-0.5, 0, 0]);
  }
});

/* ---------- 6.B.14  bar pinned at O moving in a horizontal plane (clip 'x6b-14') ----------
   Top-view (x, y) maps to (x, height, −y). Bar at 0.8 m above the floor on a vertical pin in a wall bracket;
   the anchor rail at y = H is a beam on two floor posts. */
view3d({
  id: 'x6b-14', size: 1.5, target: [0.6, 0.65, -0.25], camera: [-0.15, 0.85, 1],
  build(H){
    const hB = 0.8;
    H.floor(-0.3, 1.7, 1.0); H.wall(-0.05, 0, 1.3, 0.5);
    // clevis: two plates fixed to the wall, one above and one below the bar, with a vertical pin through them
    [-1, 1].forEach(sg => { const p = H.box(0.08, 0.012, 0.07, H.C.steel); p.position.set(-0.01, hB + sg * 0.035, 0); });
    const pinV = H.mesh(new H.THREE.CylinderGeometry(0.01, 0.01, 0.1, 16), H.C.dark); pinV.position.set(0, hB, 0);
    const bar = grp(H); bar.position.set(0, hB, 0);
    const bm = H.box(1.2, 0.05, 0.05, '#c9ccd2', bar); bm.position.set(0.6, 0, 0);
    const rail = H.box(1, 0.06, 0.06, '#8a8478'), posts = [H.box(0.06, hB, 0.06, H.C.steel), H.box(0.06, hB, 0.06, H.C.steel)];
    const sp = spring(H, 0.03, 10, 0.006), dp = dashpot(H, 0.025);
    const lO = H.label('O'), lk = H.label('k', '#5b5a55'), lc = H.label('c', '#5b5a55'), lt = H.label('θ', H.C.purple);
    return { hB, bar, rail, posts, sp, dp, lO, lk, lc, lt };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    const h = o.hB, c = Math.cos(g.th), s = Math.sin(g.th), zR = -g.H;
    o.bar.rotation.y = g.th;                                                        // counterclockwise seen from above
    const x0 = g.a - 0.25, x1 = g.b + 0.12; o.rail.scale.x = x1 - x0; o.rail.position.set((x0 + x1) / 2, h, zR - 0.03);
    o.posts[0].position.set(x0 + 0.03, h / 2, zR - 0.03); o.posts[1].position.set(x1 - 0.03, h / 2, zR - 0.03);
    o.sp.set([g.a, h, zR], [g.a * c, h, -g.a * s]); o.dp.set([g.b, h, zR], [g.b * c, h, -g.b * s], g.Lc, g.Lr);
    o.lO.position.set(0.06, h + 0.12, 0.08); o.lk.position.set(g.a + 0.08, h + 0.08, zR / 2); o.lc.position.set(g.b + 0.1, h + 0.08, zR + g.Lc / 2);
    o.lt.position.set(0.45, h + 0.1, 0.08);
  }
});

/* ---------- 6.B.15  baseball bat on a pin through its knob (clip 'x6b-15') ----------
   The bat is a lathe of the same profile as in 2D (window.BAT6B15); the pin O is 1.5 m above the floor in a ceiling clevis. */
view3d({
  id: 'x6b-15', size: 1.0, target: [0, 1.1, 0], camera: [-0.25, 0.12, 1],
  build(H){
    const T = H.THREE, B = window.BAT6B15, yO = 1.5;
    H.floor(-0.8, 0.8, 0.5); H.ceiling(-0.5, 0.5, 1.68, 0.3);
    [-0.04, 0.04].forEach(z => { const p = H.box(0.06, 0.21, 0.012, H.C.steel); p.position.set(0, yO + 0.075, z); });   // clevis plates on either side of the knob
    const pin = H.disk(0.008, 0.11, H.C.dark); pin.position.set(0, yO, 0);
    const bat = grp(H); bat.position.set(0, yO, 0);
    if (B){ const pts = B.prof.map(([s, r]) => new T.Vector2(Math.max(r, 1e-4), -(s - B.sO))); pts.unshift(new T.Vector2(1e-4, B.sO)); pts.push(new T.Vector2(1e-4, -(B.L - B.sO)));
      H.mesh(new T.LatheGeometry(pts, 40), '#d8b07a', bat); }
    const mk = r => H.sphere(0.009, H.C.dark, bat);
    const G = mk(), P = mk(); if (B){ G.position.set(0, -B.d, 0.034); P.position.set(0, -B.h, 0.034); }
    const lO = H.label('O'), lG = H.label('G'), lP = H.label('P', H.C.red);
    const plumb = H.box(0.003, 0.9, 0.003, '#8a8478'); plumb.position.set(0, yO - 0.45, -0.06);
    return { bat, G, P, lO, lG, lP, yO };
  },
  update(H, st, o){
    const g = st.g, B = window.BAT6B15; if (!g || !B) return;
    o.bat.rotation.z = g.th;
    const at = q => [Math.sin(g.th) * q, o.yO - Math.cos(g.th) * q];
    const pG = at(B.d), pP = at(B.h);
    o.lO.position.set(-0.1, o.yO + 0.02, 0.05); o.lG.position.set(pG[0] - 0.08, pG[1], 0.05); o.lP.position.set(pP[0] - 0.08, pP[1] - 0.02, 0.05);
  }
});

})();
