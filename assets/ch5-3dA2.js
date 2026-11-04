/* 3D views for examples 5.A.9 – 5.A.17. Each view reads the live state of the 2D clip with the same id. */
(function(){

/* 5.A.11  Stepped drum with a pulley (2D clip 'e-a11' in ch5.js).
   Real geometry: drum centre O at (0, 1.6) m, outer radius R = 0.4 m, inner radius r = 0.2 m.
   Block A hangs from the outer radius on the left; the inner cable leaves the top of the inner drum,
   runs to a fixed pulley at x = 1.6 m and carries block B. Drum rotation θ = ½ α t² (clockwise). */
view3d({
  id: 'e-a11', size: 2.6, target: [0.7, 1.0, 0], camera: [-0.35, 0.3, 1],
  build(H){
    const O = [0, 1.6], R = 0.4, r = 0.2, P = [1.6, 1.8 - 0.06], rp = 0.06;
    H.floor(-1.2, 2.6, 0.6); H.ceiling(-1.2, 2.6, 2.45);
    // drum: two coaxial disks on a shaft held by two pedestals standing on the floor (in front and behind)
    const drum = new H.THREE.Group(); drum.position.set(O[0], O[1], 0); H.add(drum);
    H.disk(R, 0.12, H.C.body, drum).position.z = -0.08; H.disk(r, 0.16, '#d9c58c', drum).position.z = 0.06;
    const mark = H.box(R - r, 0.03, 0.125, H.C.orange, drum); mark.position.set((R + r) / 2, 0, -0.08); // shows the rotation
    H.disk(0.025, 0.5, H.C.dark).position.set(O[0], O[1], 0);
    [-0.24, 0.24].forEach(z => { const p = H.box(0.06, O[1], 0.06, H.C.steel); p.position.set(O[0], O[1] / 2, z); });
    // pulley hanging from the ceiling
    const pul = H.disk(rp, 0.05, H.C.steel); pul.position.set(P[0], P[1], 0.06);
    const hang = H.box(0.03, 2.45 - P[1], 0.03, H.C.steel); hang.position.set(P[0], (2.45 + P[1]) / 2, 0.06);
    const A = H.box(0.22, 0.24, 0.22, '#cfd8ea'), B = H.box(0.22, 0.24, 0.22, '#cfd8ea');
    const la = H.label('A'), lb = H.label('B'), lo = H.label('O');
    lo.position.set(O[0] - 0.12, O[1] + 0.48, 0.1);
    const cA = H.cable([[0, 0, 0], [0, 1, 0]]), cB = H.cable([[0, 0, 0], [0, 1, 0]]);
    return { O, R, r, P, rp, drum, A, B, la, lb, cA, cB };
  },
  update(H, st, o){
    if (st.al === undefined) return;
    const tt = st.hold ?? st.t, th = 0.5 * st.al * tt * tt;            // clockwise drum rotation (rad)
    o.drum.rotation.z = -th;                                               // clockwise seen from the front
    const yA = 0.55 + o.R * th, yB = 0.85 - o.r * th;                      // centres of the blocks (m)
    o.A.position.set(o.O[0] - o.R, yA, -0.08); o.B.position.set(o.P[0] + o.rp, yB, 0.06);
    o.la.position.set(o.O[0] - o.R - 0.2, yA, 0.05); o.lb.position.set(o.P[0] + o.rp + 0.2, yB, 0.1);
    o.cA.set([[o.O[0] - o.R, o.O[1], -0.08], [o.O[0] - o.R, yA + 0.12, -0.08]]);
    o.cB.set([[o.O[0], o.O[1] + o.r, 0.06], [o.P[0], o.P[1] + o.rp, 0.06], [o.P[0] + o.rp, o.P[1], 0.06], [o.P[0] + o.rp, yB + 0.12, 0.06]]);
  }
});

const DEG = Math.PI / 180;
// camera-facing label that draws "N_A" as N with a real subscript A (the shared H.label prints text literally)
function subLabel(H, text, color = '#1c1d21', size = 0.16){
  const T = H.THREE, [main, sub] = text.split('_'), px = 64, cv = document.createElement('canvas'), g = cv.getContext('2d');
  const fM = `italic ${px}px Georgia, serif`, fS = `italic ${Math.round(px * 0.68)}px Georgia, serif`;
  g.font = fM; const wM = g.measureText(main).width; g.font = fS; const wS = sub ? g.measureText(sub).width + 4 : 0;
  cv.width = Math.ceil(wM + wS) + 16; cv.height = px + 34;
  g.fillStyle = color; g.textBaseline = 'middle'; g.font = fM; g.fillText(main, 8, px / 2 + 10);
  if (sub){ g.font = fS; g.fillText(sub, 8 + wM + 2, px / 2 + 10 + px * 0.32); }
  const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: false, transparent: true }));
  sp.scale.set(size * cv.width / (px + 20), size * cv.height / (px + 20), 1); sp.renderOrder = 10; H.add(sp); return sp;
}
// small helpers used by several views
const markerDot = (H, color, r = 0.018, parent) => H.sphere(r, color, parent);
const setArrow = (a, o, v, min = 0.02) => { if (Math.hypot(v[0], v[1], v[2] || 0) < min) a.set(o, [0, 0, 0]); else a.set(o, v); };

/* 5.A.9  Bar on a vertical shaft driven by a moment M (2D clip 'xb-9', drawn there as a top view).
   Real geometry in metres (1 in = 0.0254 m): the bar is 30 in long, 18 in on one side of the shaft and 12 in on the other,
   and G is 3 in from O on the long side. The shaft is vertical (world y) and the bar turns in a horizontal plane.
   The 2D top view maps its "up on the screen" to world −z, so a counterclockwise turn seen from above is +rotation about y. */
view3d({
  id: 'xb-9', size: 0.95, target: [0, 0.45, 0], camera: [-0.45, 0.75, 1],
  build(H){
    const IN = 0.0254, yb = 0.62;
    H.floor(-0.75, 0.75, 0.75);
    const shaft = H.disk(0.022, 0.95, H.C.steel); shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0.475, 0);  // vertical shaft
    const base = H.box(0.16, 0.05, 0.16, H.C.dark); base.position.set(0, 0.025, 0);                                     // fixed thrust bearing on the floor
    const top = H.box(0.1, 0.07, 0.1, '#e4dfd2'); top.position.set(0, yb - 0.075, 0);                                  // fixed bearing housing below the bar
    const bar = new H.THREE.Group(); bar.position.set(0, yb, 0); H.add(bar);
    const b = H.box(30 * IN, 0.035, 0.035, H.C.body, bar); b.position.x = (12 - 18) / 2 * IN;                          // from −18 in to +12 in along the bar
    const g = markerDot(H, H.C.dark, 0.012, bar); g.position.set(-3 * IN, 0.022, 0);
    // moment M: a curved arrow around the shaft (counterclockwise seen from above)
    const mring = H.ring(0.075, 0.006, 1.6 * Math.PI, H.C.orange); mring.rotation.x = -Math.PI / 2; mring.userData.avoid = true; mring.position.set(0, yb + 0.07, 0);
    const mhead = H.mesh(new H.THREE.ConeGeometry(0.018, 0.045, 16), H.C.orange); mhead.position.set(0.075 * Math.cos(1.6 * Math.PI), yb + 0.07, -0.075 * Math.sin(1.6 * Math.PI)); mhead.rotation.set(0, 1.6 * Math.PI, -Math.PI / 2);
    const R = H.arrow(H.C.red, 0.5);
    const lO = H.label('O', '#1c1d21', 0.06), lG = H.label('G', '#1c1d21', 0.06), lM = H.label('M', H.C.orange, 0.07), lR = H.label('R', H.C.red, 0.07);
    lO.position.set(0.05, yb - 0.11, 0.07); lM.position.set(-0.1, yb + 0.13, 0);
    return { IN, yb, bar, R, lG, lR };
  },
  update(H, st, o){
    if (st.al === undefined) return;
    const tt = Math.min(st.hold ?? st.t, Math.sqrt(Math.PI / st.al)), th = 0.5 * st.al * tt * tt, om = st.al * tt, d = 3;
    o.bar.rotation.y = th;
    // G in world coordinates and the bearing force R = m a_G (same formulas as the 2D view, top-view x–y mapped to world x and −z)
    o.lG.position.set(-d * o.IN * Math.cos(th), o.yb + 0.07, d * o.IN * Math.sin(th));
    const rx = -d * Math.cos(th), ry = -d * Math.sin(th), ax = -st.al * ry - om * om * rx, ay = st.al * rx - om * om * ry;
    const Rx = st.m * ax, Ry = st.m * ay, k = 0.26 / (st.R0 * Math.sqrt(1 + Math.PI * Math.PI));
    const v = [k * Rx, 0, -k * Ry]; setArrow(o.R, [0, o.yb, 0], v, 0.004);
    o.lR.position.set(v[0] * 1.25 + 0.02, o.yb + 0.05, v[2] * 1.25);
  }
});

/* 5.A.10  Bar OC pinned at O with a disk on a smooth bearing at C (2D clip 'xb-10').
   L = 2 m, disk radius 0.6 m, G of the bar at 0.3 L. θ is the angle of the bar below the horizontal (clockwise on the screen).
   With the smooth bearing the disk does not turn (its orange line keeps its direction); welded, it turns with the bar. */
view3d({
  id: 'xb-10', size: 2.7, target: [0, 1.7, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const O = [0, 2.9], L = 2, r = 0.6;
    H.ceiling(-2.9, 2.9, O[1] + 0.25, 0.4); H.pinSupport(O[0], O[1], 0.25, 'down', -0.06);
    const bar = new H.THREE.Group(); bar.position.set(O[0], O[1], 0.05); H.add(bar);
    const shape = new H.THREE.Shape(); shape.moveTo(0, -0.055); shape.lineTo(L, -0.03); shape.lineTo(L, 0.03); shape.lineTo(0, 0.055); shape.closePath();
    const geo = new H.THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }); geo.translate(0, 0, -0.025);
    H.mesh(geo, '#7d776b', bar);                                         // tapered bar along +x
    const g = markerDot(H, '#ffffff', 0.025, bar); g.position.set(0.3 * L, 0, 0.03);
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(r, 0.08, '#cfcab9', disk).position.z = -0.06;
    const mark = H.box(r - 0.08, 0.04, 0.02, H.C.orange, disk); mark.position.set(0.04 + (r - 0.08) / 2, 0, -0.015);
    const pinC = H.disk(0.03, 0.2, H.C.dark);
    const lO = H.label('O', '#1c1d21', 0.18), lC = H.label('C', '#1c1d21', 0.18);
    lO.position.set(O[0] - 0.22, O[1] - 0.05, 0.2);
    return { O, L, r, bar, disk, pinC, lC };
  },
  update(H, st, o){
    if (!st.s) return;
    const th = st.s[0], cx = o.O[0] + o.L * Math.cos(th), cy = o.O[1] - o.L * Math.sin(th);
    o.bar.rotation.z = -th;
    o.disk.position.set(cx, cy, 0); o.disk.rotation.z = st.mode === 'weld' ? -th : 0;
    o.pinC.position.set(cx, cy, 0);
    o.lC.position.set(cx + 0.18 * Math.sin(th), cy + 0.18 * Math.cos(th) + 0.05, 0.25);
  }
});

/* 5.A.12  Spool pulled by a cord wound on its hub (2D clip 'xb-12'). R = 0.3 m, r = 0.1 m.
   The cord leaves the lower side of the hub at angle θ above the horizontal. x = ½ a_G t² (clamped as in 2D) and the
   spool turns clockwise by x/R when it rolls. */
view3d({
  id: 'xb-12', size: 1.15, target: [0.3, 0.35, 0], camera: [-0.4, 0.3, 1],
  build(H){
    const R = 0.3, r = 0.1;
    H.floor(-0.9, 1.7, 0.5);
    const sp = new H.THREE.Group(); H.add(sp);
    [-0.1, 0.1].forEach(z => H.disk(R, 0.04, '#cfcab9', sp).position.z = z);   // two flanges
    H.disk(r, 0.16, '#e8e4d8', sp);                                              // the hub
    const mark = H.box(0.02, R - r - 0.01, 0.01, H.C.orange, sp); mark.position.set(0, r + (R - r) / 2, 0.123);
    const cord = H.cable([[0, 0, 0], [1, 0, 0]], H.C.dark, 0.006);
    const F = H.arrow(H.C.blue, 0.6), C = markerDot(H, H.C.red, 0.02);
    const lF = H.label('F', H.C.blue, 0.09), lG = H.label('G', '#1c1d21', 0.08), lC = H.label('C', H.C.red, 0.08);
    return { R, r, sp, cord, F, C, lF, lG, lC };
  },
  update(H, st, o){
    if (st.aG === undefined) return;
    const t = st.V.th * DEG, tt = st.hold ?? st.t, x = Math.max(-0.35, Math.min(0.55, 0.5 * st.aG * tt * tt));
    const gx = x, gy = o.R;
    o.sp.position.set(gx, gy, 0); o.sp.rotation.z = -x / o.R;
    const px = gx + o.r * Math.sin(t), py = gy - o.r * Math.cos(t), ux = Math.cos(t), uy = Math.sin(t), Lc = 0.4, Lf = 0.1 + 0.0025 * st.V.F;
    o.cord.set([[px, py, 0], [px + Lc * ux, py + Lc * uy, 0]]);
    setArrow(o.F, [px + Lc * ux, py + Lc * uy, 0], [Lf * ux, Lf * uy, 0]);
    o.lF.position.set(px + (Lc + Lf + 0.07) * ux, py + (Lc + Lf + 0.07) * uy, 0);
    o.C.position.set(gx, 0.01, 0.13); o.lC.position.set(gx, -0.06, 0.2); o.lG.position.set(gx - 0.05, gy + 0.05, 0.16);
  }
});

/* 5.A.13  Bar sliding on a smooth floor and a smooth wall (2D clip 'xb-13'). m = 30 kg, L = 4 m.
   The wall face is the plane x = 0 and the floor is y = 0. End A slides on the floor and end B on the wall until B leaves it.
   Reaction arrows use the same exact equations as the 2D view, at 0.004 m per newton. */
view3d({
  id: 'xb-13', size: 3.7, target: [-1.9, 1.5, 0], camera: [-0.35, 0.3, 1],
  build(H){
    H.floor(-4.8, 0.4, 0.8);
    const wall = H.box(0.08, 4.4, 1.6, H.C.wall); wall.position.set(0.04, 2.2, 0);
    const bar = new H.THREE.Group(); H.add(bar);
    H.bar(4, 0.09, H.C.body, bar, 0.12);
    const g = markerDot(H, H.C.dark, 0.04, bar); g.position.set(2, 0, 0.07);
    const mg = H.arrow(H.C.orange, 1.6), NA = H.arrow(H.C.green, 1.6), NB = H.arrow(H.C.blue, 1.6);
    const lA = H.label('A', '#1c1d21', 0.22), lB = H.label('B', '#1c1d21', 0.22);
    const lmg = H.label('mg', H.C.orange, 0.2), lNA = subLabel(H, 'N_A', H.C.green, 0.2), lNB = subLabel(H, 'N_B', H.C.blue, 0.2);
    return { bar, mg, NA, NB, lA, lB, lmg, lNA, lNB };
  },
  update(H, st, o){
    if (st.th === undefined) return;
    const m = 30, L = 4, g = G0, th = st.th, c = Math.cos(th), s = Math.sin(th), k = 0.004;
    const xg = st.phase === 1 ? -L / 2 * c : st.xg, ax = xg - L / 2 * c, bx = xg + L / 2 * c, by = L * s;
    o.bar.position.set(ax, 0.045, 0); o.bar.rotation.z = th;
    let a, NB = 0;
    if (st.phase === 1){ a = -1.5 * g / L * c; NB = -m * L / 2 * (s * a + c * st.w * st.w); }
    else { const J = m * L * L * (c * c / 4 + 1 / 12); a = (m * L * L / 4 * c * s * st.w * st.w - m * g * L / 2 * c) / J; }
    const NA = m * (g + L / 2 * (c * a - s * st.w * st.w)), gx = xg, gy = L / 2 * s;
    o.mg.set([gx, gy, 0.1], [0, -k * m * g, 0]); o.lmg.position.set(gx + 0.25, gy - k * m * g + 0.1, 0.1);
    const showA = NA > 1, showB = st.phase === 1 && NB > 1;
    setArrow(o.NA, [ax, -k * NA, 0.1], showA ? [0, k * NA, 0] : [0, 0, 0]); o.lNA.visible = showA; o.lNA.position.set(ax - 0.3, Math.min(k * NA, 0.8) * 0.5 + 0.15, 0.15);
    setArrow(o.NB, [bx - k * NB, by, 0.1], showB ? [k * NB, 0, 0] : [0, 0, 0]); o.lNB.visible = showB; o.lNB.position.set(bx - k * NB * 0.5, by + 0.25, 0.15);
    o.lA.position.set(ax - 0.05, -0.25, 0.3); o.lB.position.set(bx - 0.3, by + 0.05, 0.3);
  }
});

/* 5.A.14  Bar guided by a horizontal slot (end A) and a vertical slot (end B), pushed by P at A (2D clip 'xb-14').
   W = 60 lb, L = 4 ft (drawn at 1 ft = 0.3048 m). θ is the angle of the bar from the vertical. The slots are cut in a
   plate that stands on the floor; the slot corner K is at (0, 1.5) m. Force arrows use 0.008 m per pound. */
view3d({
  id: 'xb-14', size: 1.55, target: [0.55, 0.9, 0], camera: [-0.35, 0.25, 1],
  build(H){
    const FT = 0.3048, L = 4 * FT, K = [0, 1.5];
    H.floor(-0.6, 1.9, 0.5);
    const plate = H.box(1.65, 1.68, 0.04, '#d6d1c4'); plate.position.set(0.62, 0.84, -0.06);
    const sh = H.box(L + 0.2, 0.06, 0.02, '#4a4d55'); sh.position.set((L + 0.2) / 2 - 0.03, K[1], -0.035);   // horizontal slot
    const sv = H.box(0.06, L + 0.1, 0.02, '#4a4d55'); sv.position.set(K[0], K[1] - (L + 0.1) / 2 + 0.03, -0.035); // vertical slot
    const bar = new H.THREE.Group(); H.add(bar);
    H.bar(L, 0.045, '#8a8476', bar, 0.04);
    const pA = H.disk(0.026, 0.1, H.C.dark), pB = H.disk(0.026, 0.1, H.C.dark);
    const W = H.arrow(H.C.orange, 0.7), P = H.arrow(H.C.blue, 0.7), NA = H.arrow(H.C.green, 0.7), NB = H.arrow(H.C.purple, 0.7);
    const lA = H.label('A', '#1c1d21', 0.09), lB = H.label('B', '#1c1d21', 0.09), lW = H.label('W', H.C.orange, 0.09), lP = H.label('P', H.C.blue, 0.09);
    const lNA = subLabel(H, 'N_A', H.C.green, 0.085), lNB = subLabel(H, 'N_B', H.C.purple, 0.085);
    return { L, K, bar, pA, pB, W, P, NA, NB, lA, lB, lW, lP, lNA, lNB };
  },
  update(H, st, o){
    if (!st.s) return;
    const V = st.V, Wt = 60, Lft = 4, m = Wt / 32.2, th = st.s[0], om = st.s[1], c = Math.cos(th), s = Math.sin(th), k = 0.008;
    const A = [o.K[0] + o.L * s, o.K[1]], B = [o.K[0], o.K[1] - o.L * c], G = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    o.bar.position.set(B[0], B[1], 0.01); o.bar.rotation.z = Math.PI / 2 - th;
    o.pA.position.set(A[0], A[1], 0); o.pB.position.set(B[0], B[1], 0);
    const a = (V.P * Lft * c - Wt * Lft / 2 * s) / st.J;
    const NB = m * Lft / 2 * (c * a - s * om * om) - V.P, NA = Wt + m * Lft / 2 * (s * a + c * om * om);
    o.W.set([G[0], G[1], 0.05], [0, -k * Wt, 0]); o.lW.position.set(G[0] + 0.07, G[1] - k * Wt, 0.08);
    setArrow(o.P, [A[0], A[1], 0.05], V.P > 0.5 ? [k * V.P, 0, 0] : [0, 0, 0]); o.lP.visible = V.P > 0.5; o.lP.position.set(A[0] + k * V.P + 0.06, A[1] + 0.05, 0.08);
    setArrow(o.NA, [A[0], A[1], 0.05], Math.abs(NA) > 0.5 ? [0, k * NA, 0] : [0, 0, 0]); o.lNA.visible = Math.abs(NA) > 0.5; o.lNA.position.set(A[0] - 0.1, A[1] + k * NA * 0.6, 0.08);
    setArrow(o.NB, [B[0], B[1], 0.05], Math.abs(NB) > 0.5 ? [k * NB, 0, 0] : [0, 0, 0]); o.lNB.visible = Math.abs(NB) > 0.5; o.lNB.position.set(B[0] + k * NB / 2, B[1] - 0.09, 0.08);
    o.lA.position.set(A[0], A[1] + 0.12, 0.08); o.lB.position.set(B[0] + 0.1, B[1] + 0.03, 0.08);
  }
});

/* 5.A.15  Sphere rolling (or slipping) down an incline (2D clip 'e-a15'). R = 0.15 m, incline 2 m long.
   The bottom of the incline is at (1, 0); the incline angle follows the slider. The sphere carries two painted great circles
   so its rotation is visible; the red arrow is the friction force, scaled to mg. */
view3d({
  id: 'e-a15', size: 1.7, target: [0.1, 0.6, 0], camera: [-0.3, 0.3, 1],
  build(H){
    const Lm = 2, R = 0.15, B = [1, 0];
    H.floor(-1.4, 1.8, 0.6);
    const ramp = new H.THREE.Group(); ramp.position.set(B[0], B[1], 0); H.add(ramp);   // rotated about the foot of the incline
    const slab = H.box(Lm + 0.1, 0.04, 0.6, '#b9b2a3', ramp); slab.position.set(-(Lm + 0.1) / 2, -0.02, 0);
    const side = { mesh: null, th: null };
    const ball = new H.THREE.Group(); H.add(ball);
    H.sphere(R, '#e9d9a8', ball);
    const r1 = H.ring(R * 1.005, 0.008, 2 * Math.PI, H.C.orange, ball); r1.rotation.x = Math.PI / 2;    // meridian in the x–z plane
    const r2 = H.ring(R * 1.005, 0.008, 2 * Math.PI, H.C.blue, ball); r2.rotation.y = Math.PI / 2;      // meridian in the y–z plane
    const f = H.arrow(H.C.red, 0.6), lf = H.label('f', H.C.red, 0.09);
    const lth = H.label('θ', '#1c1d21', 0.1);
    return { Lm, R, B, ramp, side, ball, f, lf, lth };
  },
  update(H, st, o){
    if (st.a === undefined) return;
    const V = st.V, th = Math.max(0, Math.min(80, V.th)) * DEG, T = H.THREE;
    o.ramp.rotation.z = -th;
    if (o.side.th !== th){   // the triangular side of the wedge depends on the angle, so rebuild it when the slider moves
      if (o.side.mesh){ o.side.mesh.geometry.dispose(); o.side.mesh.parent.remove(o.side.mesh); }
      const sh = new T.Shape(), x0 = o.B[0] - o.Lm * Math.cos(th), y0 = o.Lm * Math.sin(th);
      sh.moveTo(o.B[0], 0); sh.lineTo(x0, y0); sh.lineTo(x0, 0); sh.closePath();
      const geo = new T.ExtrudeGeometry(sh, { depth: 0.56, bevelEnabled: false }); geo.translate(0, 0, -0.28);
      o.side.mesh = H.mesh(geo, '#d3ccbc'); o.side.th = th;
      o.lth.position.set(o.B[0] - 0.4, 0.09, 0.32);
    }
    const tt = st.hold ?? st.t, s = Math.min(0.5 * Math.max(st.a, 0) * tt * tt, 0.88 * o.Lm), te = st.a > 0 ? Math.sqrt(2 * s / st.a) : 0, phi = 0.5 * st.al * te * te;
    const top = [o.B[0] - o.Lm * Math.cos(th), o.Lm * Math.sin(th)], u = [Math.cos(th), -Math.sin(th)], n = [Math.sin(th), Math.cos(th)];
    const P = [top[0] + s * u[0], top[1] + s * u[1]];
    o.ball.position.set(P[0] + o.R * n[0], P[1] + o.R * n[1], 0); o.ball.rotation.z = -phi;   // clockwise while rolling down to the right
    const Lf = 0.5 * st.f / (V.m * G0) + 0.03;
    setArrow(o.f, [P[0], P[1] + 0.005, 0.2], [-Lf * u[0], -Lf * u[1], 0]);
    o.lf.position.set(P[0] - (Lf + 0.06) * u[0], P[1] - (Lf + 0.06) * u[1] + 0.06, 0.22);
  }
});

/* 5.A.16  Cart pulled by F on a smooth floor, with a disk rolling on top of it (2D clip 'xb-16').
   Same dimensions as the 2D view: R = 0.2 m, cart 1.6 m long and 0.25 m tall on wheels of radius 0.064 m.
   Cart x = ½ A t², disk centre x = 1.2 m + ½ a_G t², disk rotation ½ α t² counterclockwise. */
view3d({
  id: 'xb-16', size: 1.75, target: [1.7, 0.4, 0], camera: [-0.3, 0.35, 1],
  build(H){
    const R = 0.2, wr = 0.064, ch = 0.25, cl = 1.6, top = 2 * wr + ch;
    H.floor(-0.6, 3.9, 0.6);
    const cart = new H.THREE.Group(); H.add(cart);
    const body = H.box(cl, ch, 0.5, '#8a8476', cart); body.position.set(cl / 2, 2 * wr + ch / 2, 0);
    const wheels = [];
    [0.15 * cl, 0.85 * cl].forEach(x => [-0.27, 0.27].forEach(z => { const w = new H.THREE.Group(); w.position.set(x, wr, z); cart.add(w);
      H.disk(wr, 0.04, '#5f5a50', w); const sp = H.box(wr * 1.7, 0.012, 0.045, '#d8d4c8', w); wheels.push(w); }));
    const disk = new H.THREE.Group(); H.add(disk);
    H.disk(R, 0.12, H.C.body, disk);
    const mk = H.box(R - 0.02, 0.025, 0.125, H.C.orange, disk); mk.position.set((R - 0.02) / 2, 0, 0);
    const F = H.arrow(H.C.blue, 0.8), aG = H.arrow(H.C.green, 0.8), aC = H.arrow('#ffffff', 0.8);
    const lF = H.label('F', H.C.blue, 0.1), lG = subLabel(H, 'a_G', H.C.green, 0.09), lM = H.label('M', '#ffffff', 0.1);
    return { R, wr, ch, cl, top, cart, wheels, disk, F, aG, aC, lF, lG, lM };
  },
  update(H, st, o){
    if (st.A === undefined) return;
    const tt = Math.min(st.hold ?? st.t, st.tEnd), xc = 0.5 * st.A * tt * tt, xg = 0.5 * st.aG * tt * tt, ka = 22 / 140;
    o.cart.position.x = xc; o.wheels.forEach(w => { w.rotation.z = -xc / o.wr; });
    const dx = 0.75 * o.cl + xg, dy = o.top + o.R;
    o.disk.position.set(dx, dy, 0); o.disk.rotation.z = 0.5 * st.al * tt * tt;
    const Lf = (20 + st.V.F * 0.9) / 140, fy = 2 * o.wr + o.ch / 2;
    o.F.set([xc + o.cl, fy, 0], [Lf, 0, 0]); o.lF.position.set(xc + o.cl + Lf + 0.08, fy + 0.06, 0);
    o.aG.set([dx, dy + o.R + 0.09, 0], [ka * st.aG, 0, 0]); o.lG.position.set(dx + ka * st.aG + 0.12, dy + o.R + 0.14, 0);
    o.aC.set([xc + o.cl / 2, fy, 0.26], [ka * st.A, 0, 0]); o.lM.position.set(xc + o.cl - 0.12, fy, 0.27);
  }
});

/* 5.A.17  Ball striking a pinned bar (2D clip 'xb-17'). Bar M = 2 kg, L = 1 m, pinned at its top O = (0, 1.5) m;
   ball radius 0.05 m, arriving from the left at 3 m/s at h = (h/L)·L below O. The bar angle after the impact is st.sw[0];
   for 0.35 s after the hit the arrows show the impulse J of the ball and the pin impulse, as in the 2D view. */
view3d({
  id: 'xb-17', size: 1.25, target: [-0.1, 1.05, 0], camera: [-0.35, 0.2, 1],
  build(H){
    const O = [0, 1.5], L = 1;
    H.floor(-1.3, 1.1, 0.5); H.ceiling(-1.3, 1.1, O[1] + 0.22, 0.35); H.pinSupport(O[0], O[1], 0.22, 'down', -0.05);
    const bar = new H.THREE.Group(); bar.position.set(O[0], O[1], 0.03); H.add(bar);
    const b = H.box(0.045, L, 0.045, H.C.body, bar); b.position.y = -L / 2;
    const cop = H.ring(0.035, 0.006, 2 * Math.PI, H.C.green, bar); cop.position.set(0, -2 / 3 * L, 0.03);   // h = 2L/3 marker
    const ball = H.mesh(new H.THREE.SphereGeometry(0.05, 32, 20), H.C.orange, null, { transparent: true });
    const J = H.arrow(H.C.orange, 0.6), Ox = H.arrow(H.C.red, 0.6);
    const lO = H.label('O', '#1c1d21', 0.08), lJ = H.label('impulse J', H.C.orange, 0.06), lP = H.label('pin impulse', H.C.red, 0.06), lc = H.label('h = 2L/3', H.C.green, 0.05);
    lO.position.set(O[0] - 0.12, O[1] - 0.02, 0.1);
    return { O, L, bar, ball, J, Ox, lJ, lP, lc };
  },
  update(H, st, o){
    if (st.vb1 === undefined) return;
    const t = st.t, tc = st.d0 / st.vb1, R = 0.05, hit = t >= tc, ts = t - tc, th = hit && st.sw ? st.sw[0] : 0, h = st.V.h * o.L;
    o.bar.rotation.z = th;
    const bxm = hit ? -R + st.vb2 * ts : -R - st.vb1 * (tc - t);
    o.ball.position.set(o.O[0] + bxm - 0.024, o.O[1] - h, 0.03);
    o.ball.material.opacity = hit ? Math.max(0, 1 - ts / 1.2) : 1; o.ball.visible = o.ball.material.opacity > 0.01;
    const c2 = 2 / 3 * o.L; o.lc.position.set(o.O[0] + c2 * Math.sin(th) + 0.15, o.O[1] - c2 * Math.cos(th), 0.1);
    const flash = hit && ts < 0.35, k = 0.28 / Math.max(Math.abs(st.J), Math.abs(st.Ix), 1e-9);
    const hy = o.O[1] - h;
    setArrow(o.J, [o.O[0] - 0.024 - k * st.J, hy, 0.03], flash ? [k * st.J, 0, 0] : [0, 0, 0]); o.lJ.visible = flash; o.lJ.position.set(o.O[0] - 0.1 - k * st.J, hy + 0.07, 0.05);
    const showP = flash && Math.abs(st.Ix) * k > 0.012;
    setArrow(o.Ox, [o.O[0], o.O[1] - 0.04, 0.08], showP ? [k * st.Ix, 0, 0] : [0, 0, 0]);
    o.lP.visible = flash; o.lP.position.set(o.O[0] + 0.22, o.O[1] - 0.12, 0.1);
  }
});

})();
