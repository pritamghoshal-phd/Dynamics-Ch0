/* 3D views for the Chapter 6 examples 6.A.1 – 6.A.3 (equations of motion).
   Each view reads the live state of the 2D clip with the same id (x6a-1 … x6a-3 in ch6-exA.js): st.cur.x is the
   coordinate x of the problem, st.S the computed motion (used to size the hardware so nothing passes through anything). */
(function(){

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
// vertical cylinder of unit height (scaled along y), centred on its origin
const vcyl = (H, r, color, opts) => { const T = H.THREE; const m = new T.Mesh(new T.CylinderGeometry(r, r, 1, 28), H.mat(color, opts)); m.castShadow = true; H.add(m); return m; };
// a disk that rolls in the x–y plane, with a coloured stripe so its rotation shows
function rollingDisk(H, r, depth, color){
  const g = new H.THREE.Group(); H.add(g);
  H.disk(r, depth, color || H.C.body, g);
  const s = H.box(0.02, r * 0.95, depth + 0.004, H.C.red, g); s.position.y = -r * 0.47;
  return g;
}

/* ---------- 6.A.1  particle hung from a spring and a dashpot, force f(t) from below ---------- */
view3d({
  id: 'x6a-1', size: 1.0, target: [0, 0.75, 0], camera: [-0.45, 0.2, 1],
  build(H){
    H.floor(-0.7, 0.7, 0.45);
    const ceil = H.box(0.9, 0.05, 0.5, H.C.wall);
    const post1 = H.box(0.05, 1, 0.05, H.C.steel), post2 = H.box(0.05, 1, 0.05, H.C.steel);   // frame posts that hold the ceiling plate
    const blk = H.box(0.24, 0.12, 0.2, '#cfd8ea');
    const spr = spring(H, 0.035, 9, 0.005);
    const cyl = vcyl(H, 0.03, '#c9ccd2', { transparent: true, opacity: 0.55 }), rod = vcyl(H, 0.006, H.C.dark), pis = vcyl(H, 0.026, H.C.dark), cap = H.box(0.012, 0.03, 0.012, H.C.dark);
    const fA = H.arrow(H.C.blue, 1); const lm = H.label('m'), lk = H.label('k'), lc = H.label('c'), lf = H.label('f(t)', H.C.blue);
    return { ceil, post1, post2, blk, spr, cyl, rod, pis, cap, fA, lm, lk, lc, lf, S: null };
  },
  update(H, st, o){
    if (!st.S || !st.cur) return;
    if (o.S !== st.S){   // size the frame and the dashpot from the computed motion range
      o.S = st.S; const D = st.S.xmax - st.S.xmin; o.L0 = Math.max(0.35, 0.16 + D - st.S.xmin); o.D = D;
      o.Hc = o.L0 + st.S.xmax + 0.12 + 0.35; o.ceil.position.set(0, o.Hc + 0.025, 0);
      [o.post1, o.post2].forEach((p, i) => { p.scale.y = o.Hc; p.position.set(i ? 0.42 : -0.42, o.Hc / 2, -0.2); });
      o.cylLen = D + 0.07; o.cyl.scale.y = o.cylLen; o.cyl.position.set(-0.06, o.Hc - 0.03 - o.cylLen / 2, 0);
      o.cap.position.set(-0.06, o.Hc - 0.015, 0); o.R = o.L0 + st.S.xmin - 0.06;   // rod length: piston stays inside the cylinder
    }
    const x = st.cur.x, top = o.Hc - (o.L0 + x);
    o.blk.position.set(0, top - 0.06, 0);
    o.spr.set([0.06, o.Hc, 0], [0.06, top, 0]);
    const pisY = top + o.R; o.pis.scale.y = 0.008; o.pis.position.set(-0.06, pisY, 0); o.rod.scale.y = o.R; o.rod.position.set(-0.06, top + o.R / 2, 0);
    o.lm.position.set(0.19, top - 0.06, 0.12); o.lk.position.set(0.15, (o.Hc + top) / 2, 0.05); o.lc.position.set(-0.16, o.Hc - 0.1, 0.05);
    const f = st.f ? st.f(st.t) : 0, F0 = Math.max(1, st.V.F0), bot = top - 0.12;
    if (Math.abs(f) > 0.05){ const L = 0.18 * Math.abs(f) / F0; if (f > 0) o.fA.set([0, bot - 0.02 - L, 0], [0, L, 0]); else o.fA.set([0, bot - 0.02, 0], [0, -L, 0]); o.lf.visible = true; o.lf.position.set(0.1, bot - 0.12, 0.05); }
    else { o.fA.set([0, 0, 0], [0, 0, 0]); o.lf.visible = false; }
  }
});

/* ---------- 6.A.2  disk rolling between springs k and 2k, both attached to the axle at O ---------- */
view3d({
  id: 'x6a-2', size: 0.85, target: [0, 0.2, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const r = 0.16;
    H.floor(-0.75, 0.75, 0.35); H.wall(-0.64, 0, 0.42, 0.3); const wr = H.box(0.06, 0.42, 0.6, H.C.wall); wr.position.set(0.67, 0.21, 0);
    const disk = rollingDisk(H, r, 0.06);
    const axle = H.disk(0.012, 0.24, H.C.dark);
    const sL = spring(H, 0.025, 11, 0.004), sR = spring(H, 0.025, 11, 0.004);
    const lO = H.label('O'), lk = H.label('k'), l2 = H.label('2k');
    return { r, disk, axle, sL, sR, lO, lk, l2 };
  },
  update(H, st, o){
    if (!st.cur) return; const x = st.cur.x;
    o.disk.position.set(x, o.r, 0); o.disk.rotation.z = -x / o.r; o.axle.position.set(x, o.r, 0);
    o.sL.set([-0.64, o.r, 0.11], [x, o.r, 0.11]); o.sR.set([x, o.r, -0.11], [0.64, o.r, -0.11]);   // springs on the two ends of the axle
    o.lO.position.set(x, o.r + 0.21, 0.12); o.lk.position.set((x - 0.64) / 2, o.r + 0.09, 0.14); o.l2.position.set((x + 0.64) / 2, o.r + 0.09, -0.08);
  }
});

/* ---------- 6.A.3  disk under a board that rests on a smooth post A; the board moves 2x ---------- */
view3d({
  id: 'x6a-3', size: 1.15, target: [0.32, 0.2, 0], camera: [-0.25, 0.4, 1],
  build(H){
    const r = 0.15;
    H.floor(-0.85, 1.5, 0.35); H.wall(-0.75, 0, 0.42, 0.3); const wr = H.box(0.06, 0.5, 0.6, H.C.wall); wr.position.set(1.43, 0.25, 0);
    const post = H.box(0.05, 2 * r, 0.2, H.C.steel); post.position.set(0.62, r, 0);
    const disk = rollingDisk(H, r, 0.06); const axle = H.disk(0.012, 0.2, H.C.dark);
    const board = H.box(1.0, 0.07, 0.2, '#cfd8ea');
    const sL = spring(H, 0.025, 10, 0.004), sR = spring(H, 0.022, 10, 0.004);
    const vO = H.arrow(H.C.green, 0.9), vB = H.arrow(H.C.green, 0.9), lO = H.label('O'), lA = H.label('A'), lvO = H.label('v_O', H.C.green), lvB = H.label('2v_O', H.C.green);
    return { r, disk, axle, board, sL, sR, vO, vB, lO, lA, lvO, lvB };
  },
  update(H, st, o){
    if (!st.cur) return; const x = st.cur.x, v = st.cur.v, r = o.r, xb = 0.3 + 2 * x;
    o.disk.position.set(x, r, 0); o.disk.rotation.z = -x / r; o.axle.position.set(x, r, 0);
    o.board.position.set(xb, 2 * r + 0.035, 0);
    o.sL.set([-0.75, r, 0.09], [x, r, 0.09]); o.sR.set([xb + 0.5, 2 * r + 0.035, 0], [1.4, 2 * r + 0.035, 0]);
    const vs = 0.35 / Math.max(0.05, st.V.x0 * Math.sqrt(10 * st.V.k / (11 * st.V.m)));
    o.vO.set([x, r, 0.14], [v * vs, 0, 0]); o.vB.set([xb + 0.15, 2 * r + 0.12, 0], [2 * v * vs, 0, 0]);
    const show = Math.abs(v * vs) > 0.03; o.lvO.visible = o.lvB.visible = show;
    o.lvO.position.set(x + v * vs + Math.sign(v) * 0.07, r, 0.15); o.lvB.position.set(xb + 0.15 + 2 * v * vs + Math.sign(v) * 0.09, 2 * r + 0.12, 0);
    o.lO.position.set(x - 0.05, r + 0.05, 0.12); o.lA.position.set(0.7, 0.12, 0.12);
  }
});

})();
