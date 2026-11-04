/* 3D views for Chapter 4 examples 4.C.1 – 4.C.7. Each view reads the live state of the 2D clip with the same id. */
(function(){

/* a floor slab without a grid, with cross ticks that scroll so that the floor appears to move under a body
   that the camera follows. Returns { set(offset) } where offset is the distance travelled. */
function movingFloor(H, x0, x1, step, zHalf, y = 0, color = '#c4bdab'){
  const slab = H.box(x1 - x0, 0.04 * step, 2 * zHalf, color); slab.position.set((x0 + x1) / 2, y - 0.02 * step, 0); slab.castShadow = false;
  const n = Math.ceil((x1 - x0) / step) + 2, ticks = [];
  for (let i = 0; i < n; i++){ const t = H.box(0.025 * step, 0.008 * step, 2 * zHalf * 0.98, '#8f8877'); t.castShadow = false; ticks.push(t); }
  return { set(off){ const f = ((off % step) + step) % step; ticks.forEach((t, i) => t.position.set(x0 + (i - 1) * step + (step - f), y + 0.006 * step, 0)); ticks.forEach(t => { t.visible = t.position.x > x0 && t.position.x < x1; }); } };
}
function setArrow(a, o, v, min = 1e-3){ if (Math.hypot(v[0], v[1], v[2] || 0) < min) a.set(o, [0, 0, 0]); else a.set(o, v); }

/* 4.C.1  Block A (8 kg) on a rough floor, pushed by a force pulse. Metres. */
view3d({
  id: 'x4c-1', size: 2.2, target: [0, 0.35, 0], camera: [-0.5, 0.45, 1],
  build(H){
    const fl = movingFloor(H, -3.5, 3.5, 1, 1.0);
    const A = H.box(0.6, 0.5, 0.5, H.C.body); A.position.set(0, 0.25, 0);
    const lA = H.label('A'); lA.position.set(0, 0.75, 0.3);
    const aF = H.arrow(H.C.blue, 1.2), aFf = H.arrow(H.C.red, 1.2), aV = H.arrow(H.C.green, 1.2);
    const lF = H.label('F', H.C.blue), lFf = H.label('F_f', H.C.red), lV = H.label('v', H.C.green);
    return { fl, aF, aFf, aV, lF, lFf, lV };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    o.fl.set(st.x);
    const kF = 0.025;
    setArrow(o.aF, [-0.3 - st.Fnow * kF, 0.25, 0], [st.Fnow * kF, 0, 0]); o.lF.visible = st.Fnow > 0.05; o.lF.position.set(-0.32 - st.Fnow * kF / 2, 0.42, 0);
    setArrow(o.aFf, [0, 0.02, 0.26], [-st.fnow * kF, 0, 0]); o.lFf.visible = st.fnow > 0.05; o.lFf.position.set(-st.fnow * kF / 2, 0.12, 0.4);
    setArrow(o.aV, [-0.2, 0.75, 0], [st.v * 0.04, 0, 0]); o.lV.position.set(st.v * 0.02, 0.95, 0);
  }
});

/* 4.C.2  Block P (100 lb) that must overcome static friction. Feet. */
view3d({
  id: 'x4c-2', size: 6, target: [0, 1, 0], camera: [-0.5, 0.45, 1],
  build(H){
    const fl = movingFloor(H, -10, 10, 5, 3);
    const P = H.box(2, 1.5, 1.6, H.C.body); P.position.set(0, 0.75, 0);
    const lP = H.label('P', '#1c1d21', 0.5); lP.position.set(0, 2.2, 0.8);
    const aF = H.arrow(H.C.blue, 3), aFf = H.arrow(H.C.red, 3), aV = H.arrow(H.C.green, 3);
    const lF = H.label('F', H.C.blue, 0.5), lFf = H.label('F_f', H.C.red, 0.5), lV = H.label('v', H.C.green, 0.5);
    return { fl, aF, aFf, aV, lF, lFf, lV };
  },
  update(H, st, o){
    if (st.x === undefined) return;
    o.fl.set(st.x);
    const kF = 0.02;
    setArrow(o.aF, [-1 - st.Fnow * kF, 0.75, 0], [st.Fnow * kF, 0, 0]); o.lF.visible = st.Fnow > 0.5; o.lF.position.set(-1 - st.Fnow * kF / 2, 1.3, 0);
    setArrow(o.aFf, [0, 0.05, 0.85], [-st.fnow * kF, 0, 0]); o.lFf.visible = st.fnow > 0.5; o.lFf.position.set(-st.fnow * kF / 2, 0.4, 1.2);
    setArrow(o.aV, [-0.8, 2.2, 0], [Math.min(6, st.v * 0.025), 0, 0]); o.lV.visible = st.v > 0.5; o.lV.position.set(Math.min(6, st.v * 0.025) / 2 - 0.8, 2.7, 0);
  }
});

/* 4.C.3  Tug A and barge B on calm water; the view follows the mass center of the two. Metres. */
view3d({
  id: 'x4c-3', size: 48, target: [-10, 2, 0], camera: [-0.15, 0.45, 1],
  build(H){
    const water = H.box(260, 1, 60, '#7fa3bf'); water.position.set(0, -0.5, 0); water.castShadow = false;
    const marks = []; for (let i = 0; i < 16; i++){ const m = H.box(0.6, 0.15, 6, '#7aa5c4'); m.castShadow = false; marks.push(m); }
    const tug = new H.THREE.Group(); H.add(tug);
    const th = H.box(25, 4, 8, '#c9c4b6', tug); th.position.y = 0.5;
    const cab = H.box(7, 5, 6, '#e9d9a8', tug); cab.position.set(2, 5, 0);
    const drum = H.disk(1.0, 3, '#9aa0a8', tug); drum.position.set(11, 3.5, 0);
    const barge = new H.THREE.Group(); H.add(barge);
    const bh = H.box(60, 3.5, 14, '#b9b2a0', barge); bh.position.y = 0.3;
    const coal = H.mesh(new H.THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#3a3d44', barge); coal.scale.set(26, 4, 6); coal.position.y = 2;
    const cab2 = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.15);
    const lA = H.label('A', '#1c1d21', 4), lB = H.label('B', '#1c1d21', 4), lG = H.label('G', '#1c1d21', 3);
    const gDot = H.sphere(0.8, '#1c1d21');
    const aA = H.arrow(H.C.green, 18), aB = H.arrow(H.C.orange, 18), aT1 = H.arrow(H.C.red, 18), aT2 = H.arrow(H.C.red, 18);
    const lT1 = H.label('T', H.C.red, 3.5), lT2 = H.label('T', H.C.red, 3.5);
    return { marks, tug, drum, barge, cab2, lA, lB, lG, gDot, aA, aB, aT1, aT2, lT1, lT2 };
  },
  update(H, st, o){
    if (st.uA === undefined) return;
    const V = st.V, m = V.m, M = V.M, LT = 25, LB = 60, L0 = 40;
    const uBc = st.uB - LT / 2 - L0 - LB / 2, uG = (m * st.uA + M * uBc) / (m + M), X = u => -(u - uG);   // leftward travel = −x
    o.marks.forEach((mk, i) => { const k = Math.floor((uG - 160) / 20) + i; mk.position.set(X(k * 20), 0.01, ((i * 7) % 5 - 2) * 4); });
    o.tug.position.set(X(st.uA), 0, 0); o.barge.position.set(X(uBc), 0, 0);
    if (st.reel) o.drum.rotation.z = -(st.uB - st.uA) / 1.0;
    const stern = [X(st.uA) + 11, 4.5, 0], bow = [X(uBc) - 30, 2, 0];
    o.cab2.set([stern, bow]);
    o.lA.position.set(X(st.uA), 12, 0); o.lB.position.set(X(uBc), 9, 0);
    o.gDot.position.set(0, 2.5, 7.5); o.lG.position.set(0, 6, 7.5);
    setArrow(o.aA, [X(st.uA) + 6, 1, 8], [-st.vA * 4, 0, 0]); setArrow(o.aB, [X(uBc) + 10, 1, 9], [-st.vB * 4, 0, 0]);
    const on = st.Tnow > 0, s = 10;
    setArrow(o.aT1, stern, on ? [s, -0.6, 0] : [0, 0, 0]); setArrow(o.aT2, bow, on ? [-s, 0.6, 0] : [0, 0, 0]);
    o.lT1.visible = o.lT2.visible = on; o.lT1.position.set(stern[0] + s + 2, stern[1] + 3, 0); o.lT2.position.set(bow[0] - s - 2, bow[1] + 3, 0);
  }
});

/* 4.C.4  Car A runs into car B and they couple. Metres. */
view3d({
  id: 'x4c-4', size: 9, target: [4, 1, 0], camera: [-0.3, 0.4, 1],
  build(H){
    H.floor(-20, 34, 4);
    const road = H.box(54, 0.02, 4, '#c8c2b3'); road.position.set(7, 0.01, 0); road.castShadow = false;
    const car = color => { const g = new H.THREE.Group(); H.add(g); const b = H.box(4.4, 1.0, 1.8, color, g); b.position.y = 0.85;
      const c = H.box(2.4, 0.7, 1.6, color, g); c.position.set(-0.2, 1.7, 0);
      const wh = []; [-1.4, 1.4].forEach(x => [-0.9, 0.9].forEach(z => { const w = H.disk(0.35, 0.25, H.C.dark, g); w.position.set(x, 0.35, z); wh.push(w); })); g.userData.wh = wh; return g; };
    const A = car('#e9d9a8'), B = car('#cfd8ea');
    const lA = H.label('A', '#1c1d21', 0.6), lB = H.label('B', '#1c1d21', 0.6);
    const aA = H.arrow(H.C.green, 4), aB = H.arrow(H.C.orange, 4);
    const flash = H.sphere(0.5, '#f4c542'); flash.material.transparent = true; flash.material.opacity = 0.75;
    return { A, B, lA, lB, aA, aB, flash };
  },
  update(H, st, o){
    if (st.xA === undefined) return;
    o.A.position.x = st.xA; o.B.position.x = st.xB;
    [o.A, o.B].forEach(g => g.userData.wh.forEach(w => { w.rotation.z = -g.position.x / 0.35; }));
    o.lA.position.set(st.xA, 2.8, 0); o.lB.position.set(st.xB, 2.8, 0);
    setArrow(o.aA, [st.xA - 1, 3.5, 0], [st.vA * 0.15, 0, 0]); setArrow(o.aB, [st.xB - 1, 3.5, 0.01], [st.vB * 0.15, 0, 0]);
    o.flash.visible = !!st.flash; o.flash.position.set((st.xA + st.xB) / 2, 0.9, 0);
  }
});

/* 4.C.5  Basketball bouncing off the floor; the impact is shown in slow motion. Feet. */
view3d({
  id: 'x4c-5', size: 3.2, target: [0, 1.3, 0], camera: [-0.2, 0.25, 1],
  build(H){
    H.floor(-3, 3, 1.5);
    const ball = new H.THREE.Group(); H.add(ball);
    H.sphere(0.39, '#d9662b', ball);
    const s1 = H.ring(0.392, 0.008, 2 * Math.PI, '#3a1d0c', ball); s1.rotation.y = Math.PI / 2;
    const s2 = H.ring(0.392, 0.008, 2 * Math.PI, '#3a1d0c', ball); s2.rotation.x = Math.PI / 2;
    const s3 = H.ring(0.392, 0.008, 2 * Math.PI, '#3a1d0c', ball);
    const l1 = H.cable([[0, 0, 0], [1, 1, 0]], '#9a958a', 0.008), l2 = H.cable([[0, 0, 0], [1, 1, 0]], '#9a958a', 0.008);
    const aV = H.arrow(H.C.green, 1.2), aF = H.arrow(H.C.red, 1.2);
    const lV = H.label('v', H.C.green, 0.22), lF = H.label('F_{avg}', H.C.red, 0.22);
    return { ball, l1, l2, aV, aF, lV, lF };
  },
  update(H, st, o){
    if (!st.p) return;
    const V = st.V, a = V.th / 2 * RAD, R = 0.39, L = 4.2;
    o.l1.set([[0, R, 0], [-L * Math.sin(a), R + L * Math.cos(a), 0]]); o.l2.set([[0, R, 0], [L * Math.sin(a), R + L * Math.cos(a), 0]]);
    o.ball.position.set(st.p[0], st.p[1], 0); o.ball.scale.set(1 + 0.25 * st.sq, 1 - 0.28 * st.sq, 1 + 0.25 * st.sq);
    o.ball.rotation.z = st.impact ? 0 : -st.p[0] / R;
    const k = 0.05; setArrow(o.aV, [st.p[0], st.p[1], 0.45], [st.u[0] * k, st.u[1] * k, 0]); o.lV.position.set(st.p[0] + st.u[0] * k, st.p[1] + st.u[1] * k + 0.15, 0.45);
    o.aF.obj.visible = st.impact; o.lF.visible = st.impact;
    if (st.impact){ const kf = 0.006; setArrow(o.aF, [0, 0, 0.45], [st.Fx * kf, st.Fy * kf, 0]); o.lF.position.set(0.45, st.Fy * kf * 0.8, 0.45); }
  }
});

/* 4.C.6  Particle P on a smooth curved rod, block A on a spring. Feet. */
view3d({
  id: 'x4c-6', size: 10, target: [7.5, 5, 0], camera: [-0.2, 0.2, 1],
  build(H){
    const T = H.THREE;
    const flo = H.box(30, 0.1, 4, H.C.ground); flo.position.set(7, -0.35, 0); flo.castShadow = false;   // floor top at y = −0.3 ft: P (radius 0.3 ft) rolls off the rod end onto it
    const ceil = H.box(3, 0.2, 2, H.C.wall);
    const hang = H.box(0.12, 1, 0.12, H.C.steel);
    const post = H.box(0.14, 1, 0.14, H.C.steel);
    const wall = H.box(0.3, 3.2, 3, H.C.wall);
    const A = H.box(0.6, 1.2, 1.2, '#cfd8ea');
    const P = H.sphere(0.3, H.C.ball);
    // a spring coil of unit length along x, stretched to fit between A and the wall
    const pts = []; for (let i = 0; i <= 400; i++){ const s = i / 400, ang = 2 * Math.PI * 9 * s; pts.push(new T.Vector3(s, 0.28 * Math.cos(ang), 0.28 * Math.sin(ang))); }
    const coil = H.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 400, 0.035, 6, false), H.C.steel);
    const lP = H.label('P', '#1c1d21', 0.5), lA = H.label('A', '#1c1d21', 0.5), lk = H.label('k', '#1c1d21', 0.5);
    const aV = H.arrow(H.C.green, 1.6);
    return { ceil, hang, post, wall, A, P, coil, lP, lA, lk, aV, rod: null, rodRef: null };
  },
  update(H, st, o){
    if (!st.rod || st.xP === undefined) return;
    const T = H.THREE, Hh = st.V.h;
    if (o.rodRef !== st.rod){                                     // rebuild the rod when the drop height changes
      if (o.rod){ o.rod.parent.remove(o.rod); o.rod.geometry.dispose(); }
      const curve = new T.CatmullRomCurve3(st.rod.filter((p, i) => i % 4 === 0 || i === st.rod.length - 1).map(p => new T.Vector3(p[0], p[1], 0)));
      o.rod = H.mesh(new T.TubeGeometry(curve, 300, 0.08, 10, false), H.C.dark); o.rodRef = st.rod;
      o.ceil.position.set(0, Hh + 0.9, 0); o.hang.scale.y = 0.8; o.hang.position.set(0, Hh + 0.4, 0);
      const q = st.at(st.Ltot * 0.3); o.post.scale.y = q.y + 0.3; o.post.position.set(q.x, (q.y - 0.3) / 2, 0);   // the post stands on the floor
    }
    const xA0 = st.xA0, xw = st.xw, xa = xA0 + st.d;                // same positions as the 2D clip; A's left face starts where P touches it
    o.wall.position.set(xw + 0.15, 1.3, 0);                          // wall and A stand on the floor (top at −0.3)
    o.A.position.set(xa + 0.3, 0.3, 0);
    o.coil.position.set(xa + 0.6, 0.3, 0); o.coil.scale.x = Math.max(0.1, xw - xa - 0.6);
    const py = st.stuck ? 0 : st.yP; o.P.position.set(st.stuck ? xa - st.rP : st.xP, py, 0);
    o.lP.position.set(o.P.position.x, py + 0.8, 0.3); o.lA.position.set(xa + 0.3, 1.4, 0.6); o.lk.position.set((xa + 0.6 + xw) / 2, 1.0, 0);
    const v = st.vPnow ?? 0;
    if (st.stuck) setArrow(o.aV, [o.P.position.x, py + 0.55, 0.4], [v * 0.08, 0, 0]);
    else { const i = Math.min(st.tr.length - 1, Math.floor(st.tnow / 0.002)), a = st.at(st.tr[i][1]); setArrow(o.aV, [st.xP, py + 0.55, 0.4], [a.tx * v * 0.08, a.ty * v * 0.08, 0]); }
  }
});

/* 4.C.7  Cars A (northbound) and B (westbound) collide at an intersection. Feet; the 2D picture (x east, y north)
   is the ground plane, mapped to 3D as (x, height, −y). */
view3d({
  id: 'x4c-7', size: 38, target: [-4, 0, -8], camera: [0.35, 0.8, 1],
  build(H){
    const g = H.box(140, 0.4, 140, '#a9b98f'); g.position.set(0, -0.2, 0); g.castShadow = false;
    const r1 = H.box(24, 0.05, 140, '#8e8a82'); r1.position.y = 0.03; r1.castShadow = false;
    const r2 = H.box(140, 0.05, 24, '#8e8a82'); r2.position.y = 0.035; r2.castShadow = false;
    const car = (L, W, color) => { const gr = new H.THREE.Group(); H.add(gr); const b = H.box(L, 3, W, color, gr); b.position.y = 2.2;
      const c = H.box(L * 0.5, 2, W * 0.9, color, gr); c.position.y = 4.6; [-1, 1].forEach(sx => [-1, 1].forEach(sz => { const w = H.disk(1.1, 0.8, H.C.dark, gr); w.position.set(sx * L * 0.32, 1.1, sz * W * 0.5); })); return gr; };
    const A = car(15, 6, '#e9d9a8'); A.rotation.y = Math.PI / 2;       // A's long axis along north (−z)
    const B = car(15, 6, '#cfd8ea');
    const lA = H.label('A', '#1c1d21', 3.5), lB = H.label('B', '#1c1d21', 3.5), lN = H.label('north', '#7b808c', 3);
    lN.position.set(0, 1, -62);
    const aA = H.arrow(H.C.green, 14), aB = H.arrow(H.C.orange, 14), aW = H.arrow(H.C.red, 14);
    const lW = H.label('v_2', H.C.red, 4);
    return { A, B, lA, lB, aA, aB, aW, lW };
  },
  update(H, st, o){
    if (!st.A) return;
    const V = st.V, k = 0.8;
    o.A.position.set(st.A[0], 0, -st.A[1]); o.B.position.set(st.B[0], 0, -st.B[1]);
    o.lA.position.set(st.A[0] - 8, 9, -st.A[1]); o.lB.position.set(st.B[0], 10, -st.B[1] - 6);
    if (!st.after){ setArrow(o.aA, [st.A[0] + 6, 4, -st.A[1]], [0, 0, -V.vA * k]); setArrow(o.aB, [st.B[0], 4, -st.B[1] + 6], [-V.vB * k, 0, 0]); setArrow(o.aW, [0, 0, 0], [0, 0, 0]); o.lW.visible = false; }
    else { setArrow(o.aA, [0, 0, 0], [0, 0, 0]); setArrow(o.aB, [0, 0, 0], [0, 0, 0]);
      const c = [(st.A[0] * V.WA + st.B[0] * V.WB) / (V.WA + V.WB), (st.A[1] * V.WA + st.B[1] * V.WB) / (V.WA + V.WB)];
      setArrow(o.aW, [c[0], 8, -c[1]], [st.vx * k, 0, -st.vy * k]); o.lW.visible = true; o.lW.position.set(c[0] + st.vx * k, 11, -c[1] - st.vy * k); }
  }
});

})();
