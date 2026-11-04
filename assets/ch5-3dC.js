/* 3D views for the impulse–momentum examples 5.C.1 – 5.C.9.
   Each view reads the live state of the 2D clip with the same id (e-c5 and e-c6 live in ch5.js, the xi-* clips in ch5-exC.js),
   so the physics is computed once and the two views always agree.
   Conventions: the 2D picture plane is x–y (y up); for the top-view problems (5.C.3, 5.C.4, 5.C.7, 5.C.8) the 2D picture
   is the horizontal plane, mapped to 3D as (X, Y) → (X, height, −Y), so the vertical axis is the 3D y axis. */
(function(){

/* ---------- small helpers used only in this file ---------- */
// a label with an optional subscript: 'v_O', 'v_{b1}', 'Ω'
function lab(H, text, color = '#1c1d21', size = 0.16){
  const T = H.THREE, m = /^(.*?)_\{?([^}]*)\}?(.*)$/.exec(text), main = m ? m[1] : text, sub = m ? m[2] : '', tail = m ? m[3] : '';
  const cv = document.createElement('canvas'), g = cv.getContext('2d'), px = 64, sp = 44, F1 = `italic ${px}px Georgia, serif`, F2 = `${sp}px Georgia, serif`;
  g.font = F1; const w1 = g.measureText(main).width, w3 = g.measureText(tail).width; g.font = F2; const w2 = sub ? g.measureText(sub).width + 4 : 0;
  cv.width = Math.ceil(w1 + w2 + w3) + 16; cv.height = px + 30;
  g.fillStyle = color; g.textBaseline = 'middle'; g.font = F1; g.fillText(main, 8, px / 2 + 8);
  if (sub){ g.font = F2; g.fillText(sub, 8 + w1 + 2, px / 2 + 26); }
  if (tail){ g.font = F1; g.fillText(tail, 8 + w1 + w2, px / 2 + 8); }
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: false, transparent: true }));
  sprite.scale.set(size * cv.width / (px + 8), size * cv.height / (px + 8), 1); sprite.renderOrder = 10; H.add(sprite); return sprite;
}
// plain upright text (not italic) for short notes
function note(H, text, color = '#5b5a55', size = 0.11){
  const T = H.THREE, cv = document.createElement('canvas'), g = cv.getContext('2d'), px = 56, F = `600 ${px}px system-ui, sans-serif`;
  g.font = F; cv.width = Math.ceil(g.measureText(text).width) + 16; cv.height = px + 20; g.font = F; g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 8, cv.height / 2);
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: false, transparent: true }));
  sprite.scale.set(size * cv.width / cv.height, size, 1); sprite.renderOrder = 10; H.add(sprite); return sprite;
}
// prism: a 2D outline (x–y points) extruded along z, centred in z
function prism(H, pts, depth, color, parent){
  const T = H.THREE, s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false }); geo.translate(0, 0, -depth / 2); return H.mesh(geo, color, parent);
}
// cylinder with its axis along y (shafts, posts, vertical pins)
function post(H, r, len, color, parent){ return H.mesh(new H.THREE.CylinderGeometry(r, r, len, 32), color, parent); }
// dashed straight line between two points
function dashed(H, a, b, color = '#8a8478', dash = 0.06, radius = 0.004){
  const T = H.THREE, A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B), n = Math.max(1, Math.floor(L / (2 * dash))), g = new T.Group(); H.add(g);
  const dir = B.clone().sub(A).normalize(), q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  for (let i = 0; i < n; i++){ const m = new T.Mesh(new T.CylinderGeometry(radius, radius, dash, 6), H.mat(color)); m.quaternion.copy(q);
    m.position.copy(A).addScaledVector(dir, (2 * i + 0.5) * dash); g.add(m); }
  return g;
}
// curved arrow of radius R around the vertical axis, counterclockwise seen from above, at height y
function curl(H, R, y, color = H.C.purple, parent){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.45 * Math.PI; H.ring(R, 0.012, arc, color, g).castShadow = false;
  const cone = H.mesh(new T.ConeGeometry(0.035, 0.09, 16), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0); cone.castShadow = false;
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.userData.avoid = true; return g;
}
// curved arrow in the x–y (picture) plane about the z axis; ccw seen from the front
function curlZ(H, R, color, parent){
  const T = H.THREE, g = new T.Group(); (parent || null) ? parent.add(g) : H.add(g);
  const arc = 1.45 * Math.PI; H.ring(R, 0.012, arc, color, g);
  const cone = H.mesh(new T.ConeGeometry(0.035, 0.09, 16), color, g); cone.position.set(R * Math.cos(arc), R * Math.sin(arc), 0);
  cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.userData.avoid = true; return g;
}
// ground bearing: a square housing on the floor around a vertical shaft
function bearing(H, x, z, w = 0.22, h = 0.14){ const b = H.box(w, h, w, '#8a8478'); b.position.set(x, h / 2, z); const c = post(H, w * 0.32, 0.03, H.C.dark); c.position.set(x, h + 0.015, z); return b; }
// rotate a local top-view point about the vertical axis (3D rotation.y = ψ)
const rotY = (x, y, z, ps) => [x * Math.cos(ps) + z * Math.sin(ps), y, -x * Math.sin(ps) + z * Math.cos(ps)];

/* 5.C.1  Drum hoisted by two cable forces F and 2F (clip 'xi-1').
   Drum radius r = 0.4 m; a body of mass M hangs from the axle O. The camera follows O (as in the 2D view), so a fixed
   height scale slides past instead: O is at height y = −4t + ½ a t², and the drum turns θ = ω₁t + ½ α t² (ccw +). */
view3d({
  id: 'xi-1', size: 1.9, target: [0.05, 1.05, 0], camera: [-0.4, 0.25, 1],
  build(H){
    const Yc = 1.25, r = 0.4;
    const drum = new H.THREE.Group(); drum.position.set(0, Yc, 0); H.add(drum);
    H.disk(r, 0.2, '#c9c4b6', drum); H.disk(r * 0.35, 0.22, '#b7b1a2', drum);
    const spoke = H.box(0.035, r - 0.04, 0.205, H.C.orange, drum); spoke.position.set(0, (r - 0.04) / 2 + 0.02, 0);
    const axle = H.disk(0.03, 0.5, H.C.dark); axle.position.set(0, Yc, -0.08);
    // the body M hangs behind the drum from the same axle, on a short clevis
    const body = prism(H, [[-0.127, 0], [0.127, 0], [0.29, -1.0], [-0.29, -1.0]], 0.12, '#8a8478'); body.position.set(0, Yc, -0.25);
    const clev = H.box(0.08, 0.1, 0.12, H.C.steel); clev.position.set(0, Yc - 0.03, -0.25);
    // the two cables leave the drum vertically at x = ±r, in the drum's plane
    [-r, r].forEach(x => H.cable([[x, Yc, 0], [x, Yc + 1.25, 0]]));
    const aF = H.arrow(H.C.red), a2F = H.arrow(H.C.red); aF.set([-r, Yc + 1.25, 0], [0, 0.3, 0]); a2F.set([r, Yc + 1.25, 0], [0, 0.6, 0]);
    lab(H, 'F', H.C.red).position.set(-r - 0.15, Yc + 1.45, 0); lab(H, '2F', H.C.red).position.set(r + 0.2, Yc + 1.7, 0);
    lab(H, 'O').position.set(0.13, Yc - 0.12, 0.2); lab(H, 'M').position.set(0.45, Yc - 0.8, -0.25);
    // fixed height scale (one tick per metre) that slides past the drum
    const pole = H.box(0.03, 3.2, 0.03, '#8a8478'); pole.position.set(-0.95, Yc, 0);
    const ticks = []; for (let i = 0; i < 5; i++) ticks.push(H.box(0.16, 0.02, 0.03, '#5b5a55'));
    const vArr = H.arrow(H.C.green); const vLab = lab(H, 'v_O', H.C.green);
    return { Yc, drum, ticks, tickLab: new Map(), vArr, vLab };
  },
  update(H, st, o){
    if (st.a === undefined || !st.V) return;
    const t = Math.min(st.hold ?? st.t, 10), y = -4 * t + 0.5 * st.a * t * t, v = -4 + st.a * t, th = st.V.w1 * t + 0.5 * st.al * t * t;
    o.drum.rotation.z = th;                                               // counterclockwise +
    const k0 = Math.ceil(y - 1.5); o.tickLab.forEach(s => { s.visible = false; });
    o.ticks.forEach((m, i) => { const k = k0 + i, Y = o.Yc + (k - y); m.visible = Y > o.Yc - 1.55 && Y < o.Yc + 1.55; m.position.set(-0.95 + 0.08, Y, 0);
      if (!m.visible) return; let s = o.tickLab.get(k); if (!s){ s = note(H, `${k} m`, '#5b5a55', 0.1); o.tickLab.set(k, s); }
      s.visible = true; s.position.set(-1.25, Y, 0); });
    const L = Math.min(0.7, 0.11 + Math.abs(v) * 0.014) * Math.sign(v);
    o.vArr.set([0.7, o.Yc, 0], [0, Math.abs(v) > 0.05 ? L : 0, 0]); o.vLab.visible = Math.abs(v) > 0.05; o.vLab.position.set(0.88, o.Yc + L / 2, 0);
  }
});

/* 5.C.2  Spool rolling on a ledge, pulled by block A over a pulley (clip 'xi-2').
   Outer rims R = 0.4 m roll without slip; the cable leaves the top of the hub r = 0.2 m. Spool turns θ = ½ α t² clockwise,
   so O moves R θ toward the pulley and block A drops (R + r) θ. The pulley is bolted to the ledge face. */
view3d({
  id: 'xi-2', size: 2.6, target: [2.3, -0.5, 0], camera: [0.25, 0.6, 1],
  build(H){
    const R = 0.4, r = 0.2, edge = 3.909, pr = 0.109, P = [edge + 0.236, R + r - pr], low = -2.8;
    const ledge = H.box(edge + 0.6, -low, 0.8, H.C.ground); ledge.position.set((edge - 0.6) / 2, low / 2, 0);
    H.floor(-0.6, edge + 1.6, 0.6, low);
    const grid = new H.THREE.GridHelper(edge + 0.6, Math.round((edge + 0.6) * 4), 0xb8b3a6, 0xcfcabd); grid.position.set((edge - 0.6) / 2, 0.001, 0); grid.scale.z = 0.8 / (edge + 0.6); H.add(grid);
    // pulley bracket fixed to the vertical face of the ledge
    const br = H.box(0.3, 0.05, 0.04, H.C.steel); br.position.set(edge + 0.13, P[1], -0.06);
    const br2 = H.box(0.04, 0.35, 0.04, H.C.steel); br2.position.set(edge + 0.02, P[1] - 0.12, -0.06);
    const pul = H.disk(pr, 0.05, H.C.steel); pul.position.set(P[0], P[1], 0); H.disk(0.015, 0.16, H.C.dark).position.set(P[0], P[1], -0.03);
    // spool: two outer rims on a hub; one rim carries an orange mark to show the rotation
    const spool = new H.THREE.Group(); H.add(spool);
    [-0.16, 0.16].forEach(z => { H.disk(R, 0.06, H.C.body, spool).position.z = z; });
    H.disk(r, 0.28, '#d9d4c6', spool); H.disk(0.03, 0.42, H.C.dark, spool);
    const mk = H.box(0.035, R - 0.03, 0.065, H.C.orange, spool); mk.position.set(0, -(R - 0.03) / 2, 0.165);
    const A = H.box(0.33, 0.36, 0.3, '#cfd8ea'); const cab = H.cable([[0, 0, 0], [0, 1, 0]]);
    const lo = lab(H, 'O'), la = lab(H, 'A'); note(H, 'no slip', '#8a8478', 0.1).position.set(0.3, -0.12, 0.55);
    return { R, r, P, pr, spool, A, cab, lo, la };
  },
  update(H, st, o){
    if (st.al === undefined) return;
    const t = Math.min(st.hold ?? st.t, st.tEnd), th = 0.5 * st.al * t * t, xO = 0.4 + o.R * th, yA = o.P[1] - 0.636 - (o.R + o.r) * th;
    o.spool.position.set(xO, o.R, 0); o.spool.rotation.z = -th;            // clockwise
    o.A.position.set(o.P[0] + o.pr, yA, 0);
    o.cab.set([[xO, o.R + o.r, 0], [o.P[0], o.P[1] + o.pr, 0], [o.P[0] + o.pr * 0.7071, o.P[1] + o.pr * 0.7071, 0], [o.P[0] + o.pr, o.P[1], 0], [o.P[0] + o.pr, yA + 0.18, 0]]);
    o.lo.position.set(xO - 0.12, o.R - 0.1, 0.32); o.la.position.set(o.P[0] + o.pr + 0.3, yA, 0.1);
  }
});

/* 5.C.3  Block sliding out along a smooth radial slot of a disk that turns freely about a fixed vertical shaft (clip 'xi-3').
   Disk radius 0.6 m in a horizontal plane; the block's distance r from O and the disk angle φ come from st.s = [r, r′, φ]. */
view3d({
  id: 'xi-3', size: 1.35, target: [0, 0.45, 0], camera: [-0.35, 0.85, 1],
  build(H){
    const hD = 0.7, Rd = 0.6;
    H.floor(-1.0, 1.0, 0.9); bearing(H, 0, 0, 0.24, 0.16);
    post(H, 0.03, hD - 0.16, H.C.steel).position.set(0, 0.16 + (hD - 0.16) / 2, 0);
    const disk = new H.THREE.Group(); disk.position.y = hD; H.add(disk);
    const dm = post(H, Rd, 0.04, H.C.body, disk); dm.position.y = -0.02;
    const groove = H.box(Rd - 0.02, 0.006, 0.07, '#f3eee2', disk); groove.position.set((Rd - 0.02) / 2, 0.003, 0);
    [-0.045, 0.045].forEach(z => { const rail = H.box(Rd - 0.02, 0.03, 0.018, H.C.edge, disk); rail.position.set((Rd - 0.02) / 2, 0.015, z); });
    post(H, 0.045, 0.06, H.C.dark, disk).position.y = 0.01;
    const blk = H.box(0.081, 0.05, 0.065, '#5b5a55', disk);
    dashed(H, [0, 0.05, 0], [0, hD + 0.55, 0]); note(H, 'vertical axis', '#8a8478', 0.08).position.set(0.02, hD + 0.62, 0);
    curl(H, 0.14, hD + 0.2, H.C.purple); lab(H, 'ω', H.C.purple).position.set(0.24, hD + 0.24, 0);
    lab(H, 'O').position.set(-0.12, hD + 0.08, 0.1);
    const lp = lab(H, 'P'), aR = H.arrow(H.C.blue, 0.7), aT = H.arrow(H.C.green, 0.7), aV = H.arrow(H.C.red, 0.8);
    return { hD, disk, blk, lp, aR, aT, aV };
  },
  update(H, st, o){
    if (!st.s || !st.V) return;
    const [r, rd, ph] = st.s, V = st.V, W = (V.I + V.m * 1e-4) * V.w1 / (V.I + V.m * r * r);
    o.disk.rotation.y = ph; o.blk.position.set(r, 0.025, 0);
    const P = [r * Math.cos(ph), o.hD + 0.05, -r * Math.sin(ph)], er = [Math.cos(ph), 0, -Math.sin(ph)], et = [-Math.sin(ph), 0, -Math.cos(ph)], k = 0.2, vt = r * W;
    o.aR.set(P, er.map(c => c * rd * k)); o.aT.set(P, et.map(c => c * vt * k)); o.aV.set(P, er.map((c, i) => (c * rd + et[i] * vt) * k));
    o.lp.position.set(P[0] - er[0] * 0.09 - et[0] * 0.07, P[1] + 0.1, P[2] - er[2] * 0.09 - et[2] * 0.07);   // behind the block, away from its velocity arrows
  }
});

/* 5.C.4  Bar P sliding in a smooth slot at the end A of a massless frame that turns about a fixed vertical axis at O (clip 'xi-4').
   Arm length R = 1 m, slot perpendicular to the arm, bar length d = 0.3 m. st.s = [s, s′, Ω, ψ]; s is measured in the direction of rotation. */
view3d({
  id: 'xi-4', size: 1.35, target: [0.1, 0.35, 0], camera: [-0.25, 0.95, 0.9],
  build(H){
    const R = 1, hA = 0.5;
    H.floor(-1.45, 1.45, 1.45); bearing(H, 0, 0, 0.24, 0.14);
    const frame = new H.THREE.Group(); H.add(frame);
    post(H, 0.035, hA + 0.04 - 0.14, H.C.steel, frame).position.y = 0.14 + (hA + 0.04 - 0.14) / 2;
    const arm = H.bar(R, 0.035, H.C.steel, frame); arm.position.set(0, hA, 0);
    // slot: a channel along the local −z direction (the direction of rotation at A), length 1.1 m
    const base = H.box(0.1, 0.015, 1.1, '#e4dfd2', frame); base.position.set(R, hA - 0.03, 0);
    [-0.045, 0.045].forEach(dx => { const wl = H.box(0.012, 0.06, 1.1, H.C.steel, frame); wl.position.set(R + dx, hA, 0); });
    const bar = H.box(0.07, 0.045, 0.3, H.C.orange, frame);
    dashed(H, [0, 0.15, 0], [0, hA + 0.65, 0]); note(H, 'vertical axis', '#8a8478', 0.08).position.set(0.02, hA + 0.72, 0);
    curl(H, 0.15, hA + 0.18, H.C.purple); lab(H, 'Ω', H.C.purple).position.set(0.26, hA + 0.22, 0);
    lab(H, 'O').position.set(-0.13, hA + 0.06, 0.12);
    const la = lab(H, 'A'), lp = lab(H, 'P');
    return { R, hA, frame, bar, la, lp };
  },
  update(H, st, o){
    if (!st.s) return;
    const [s, , , ps] = st.s; o.frame.rotation.y = ps; o.bar.position.set(o.R, o.hA - 0.005, -s);
    o.la.position.set(...rotY(o.R + 0.15, o.hA + 0.06, 0.12, ps)); o.lp.position.set(...rotY(o.R + 0.15, o.hA + 0.08, -s, ps));
  }
});

/* 5.C.5  Bullet fired into a pendulum (clip 'e-c5', lengths in ft converted to m).
   Pendulum length 4.8 ft, G 3 ft below O, impact at A a distance h below O. The pendulum swings in the picture plane in front of
   a floor-standing post that carries the pin O, so it can swing right over the top without hitting anything. */
view3d({
  id: 'e-c5', size: 1.9, target: [0.4, 1.6, 0], camera: [-0.35, 0.22, 1],
  build(H){
    const f = 0.3048, yO = 1.75, Ltot = 4.8 * f, w0 = 8 / 38 * f, w1 = 18 / 38 * f;
    H.floor(-1.1, 2.6, 0.6);
    const pst = H.box(0.1, yO + 0.08, 0.1, H.C.steel); pst.position.set(0, (yO + 0.08) / 2, -0.2);
    const ft = H.box(0.4, 0.04, 0.4, H.C.steel); ft.position.set(0, 0.02, -0.2);
    H.disk(0.025, 0.36, H.C.dark).position.set(0, yO, -0.08);
    const pend = new H.THREE.Group(); pend.position.set(0, yO, 0); H.add(pend);
    prism(H, [[-w0, 0.04], [w0, 0.04], [w1, -Ltot], [-w1, -Ltot]], 0.1, '#d9d4c6', pend);
    const gdot = H.sphere(0.022, H.C.dark, pend); gdot.position.set(0, -3 * f, 0.055);
    const adot = H.sphere(0.02, H.C.purple, pend);
    const bIn = H.mesh(new H.THREE.CylinderGeometry(0.018, 0.018, 0.1, 16).rotateZ(Math.PI / 2), H.C.dark, pend);
    const bFly = H.mesh(new H.THREE.CylinderGeometry(0.018, 0.018, 0.12, 16).rotateZ(Math.PI / 2), H.C.dark);
    const vb = H.arrow(H.C.red, 0.8), lv = lab(H, 'v_{b1}', H.C.red);
    const lg = lab(H, 'G'), la = lab(H, 'A', H.C.purple); lab(H, 'O').position.set(-0.17, yO + 0.1, 0.1);
    note(H, 'slow motion', '#8a8478', 0.09).position.set(1.6, 0.25, 0.3);
    return { f, yO, pend, adot, bIn, bFly, vb, lv, lg, la };
  },
  update(H, st, o){
    if (!st.ok || !st.V || !st.s) return;
    const th = st.s[0], h = st.V.h * o.f, P = d => [-d * Math.sin(th), o.yO - d * Math.cos(th)];
    o.pend.rotation.z = -th;                                               // the 2D canvas angle is clockwise +
    o.adot.position.set(0, -h, 0.055);
    o.bIn.visible = !!st.hit; o.bIn.position.set(0.035, -h, 0);
    o.bFly.visible = !st.hit;
    if (!st.hit){ const xb = (260 - Math.min(st.t, 0.06) / 0.06 * 246 + 8) / 38 * o.f; o.bFly.position.set(xb, o.yO - h, 0);
      o.vb.set([xb + 0.4, o.yO - h + 0.09, 0], [-0.3, 0, 0]); o.lv.visible = true; o.lv.position.set(xb + 0.52, o.yO - h + 0.2, 0); }
    else { o.vb.set([0, 0, 0], [0, 0, 0]); o.lv.visible = false; }
    const g = P(3 * o.f), a = P(st.V.h * o.f), n = [-Math.cos(th), -Math.sin(th)]; // unit vector to the left of the pendulum
    o.lg.position.set(g[0] + n[0] * 0.22, g[1] + n[1] * 0.22, 0.08); o.la.position.set(a[0] - n[0] * 0.24, a[1] - n[1] * 0.24, 0.08);
  }
});

/* 5.C.6  Square block that slides into a small step at O and tips about the step's corner (clip 'e-c6').
   Side a (st.V.a); before impact the block slides on the smooth floor at speed v; after impact G = O + (a/√2)(cos p, sin p). */
view3d({
  id: 'e-c6', size: 1.6, target: [0.35, 0.45, 0], camera: [-0.3, 0.3, 1],
  build(H){
    H.floor(-1.4, 3.2, 0.7);
    const step = H.box(0.06, 0.004, 1.2, '#5e594f'); step.position.set(-0.03, 0.002, 0);
    const blk = H.box(1, 1, 1, H.C.body);
    const gdot = H.sphere(0.022, H.C.dark);
    const lg = lab(H, 'G'); lab(H, 'O').position.set(-0.06, -0.1, 0.62);
    const vArr = H.arrow(H.C.red), lv = lab(H, 'v', H.C.red);
    note(H, 'smooth floor', '#8a8478', 0.09).position.set(2.2, 0.08, 0.6);
    const msgs = { slide: note(H, 'The block slides toward the step.', '#1c1d21'), rot: note(H, 'The block rotates about O.', '#1c1d21'),
      over: note(H, 'The block tipped over the step.', '#8a3fd1'), back: note(H, 'The block fell back.', '#1c1d21') };
    return { blk, gdot, lg, vArr, lv, msgs };
  },
  update(H, st, o){
    if (!st.ok || !st.V || !st.s) return;
    const a = st.V.a, rho = a / Math.SQRT2; let cx, cy, ang = 0;
    if (st.phase === 0){ cx = a / 2 + st.V.v * Math.max(0.5 - st.t, 0); cy = a / 2; }
    else { const p = st.s[0]; cx = rho * Math.cos(p); cy = rho * Math.sin(p); ang = p - Math.PI / 4; } // counterclockwise about O
    o.blk.scale.set(a, a, a); o.blk.position.set(cx, cy, 0); o.blk.rotation.z = ang;
    o.gdot.position.set(cx, cy, a / 2 + 0.02); o.lg.position.set(cx + 0.1, cy + 0.08, a / 2 + 0.05);
    if (st.phase === 0){ o.vArr.set([cx + 0.25, a + 0.15, 0], [-0.4, 0, 0]); o.lv.visible = true; o.lv.position.set(cx + 0.35, a + 0.28, 0); }
    else { o.vArr.set([0, 0, 0], [0, 0, 0]); o.lv.visible = false; }
    const key = st.outcome === 'The block tipped over the step.' ? 'over' : st.outcome === 'The block fell back.' ? 'back' : st.phase === 1 ? 'rot' : 'slide';
    Object.entries(o.msgs).forEach(([k, s]) => { s.visible = k === key; s.position.set(0.4, Math.max(1.0, 1.25 * a + 0.35), 0); });
  }
});

/* 5.C.7  Bar of length L = 1 m sliding on a smooth horizontal surface strikes a fixed stop at A, a quarter length from G (clip 'xi-7').
   Top view (X toward the stop's right, Y up in the 2D picture) → 3D (X, height, −Y). The bar spins about the vertical axis by φ (ccw from above). */
view3d({
  id: 'xi-7', size: 1.15, target: [0.25, 0, 0.1], camera: [-0.15, 1.0, 0.85],
  build(H){
    H.floor(-0.8, 1.6, 1.1);
    // fixed stop at Y = −L/4 (3D z = +0.25), bolted to the surface; its rounded nose touches the bar's face when G reaches x = 0
    const plate = H.box(0.16, 0.012, 0.3, H.C.steel); plate.position.set(-0.123, 0.006, 0.25);
    const stop = H.box(0.082, 0.1, 0.236, '#8a8478'); stop.position.set(-0.11, 0.062, 0.25);
    const nose = post(H, 0.041, 0.1, '#5b5a55'); nose.position.set(-0.069, 0.062, 0.25);
    [-0.07, 0.07].forEach(dz => post(H, 0.012, 0.02, H.C.dark).position.set(-0.173, 0.02, 0.25 + dz));
    const bar = new H.THREE.Group(); H.add(bar);
    H.box(0.055, 0.04, 1, H.C.body, bar).position.y = 0.02;
    H.sphere(0.018, H.C.dark, bar).position.set(0, 0.05, 0); H.sphere(0.018, H.C.red, bar).position.set(0, 0.05, 0.25);
    const lg = lab(H, 'G'), la = lab(H, 'A', H.C.red);
    const ax = dashed(H, [0, 0, 0], [0, 0.45, 0]);
    const vArr = H.arrow(H.C.blue, 0.7), lv = lab(H, 'v_G', H.C.blue), cw = curl(H, 0.09, 0.14, H.C.purple), lw = lab(H, 'ω', H.C.purple);
    note(H, 'smooth horizontal surface', '#8a8478', 0.07).position.set(1.0, 0.03, 0.75);
    return { bar, lg, la, ax, vArr, lv, cw, lw };
  },
  update(H, st, o){
    if (st.t0 === undefined || !st.V) return;
    const t = st.hold ?? Math.min(st.t, st.t0 + 1.6); let xG, ph = 0, vx;
    if (t < st.t0){ xG = 0.6 - st.V.v * t; vx = -st.V.v; } else { const tau = t - st.t0; xG = st.vG2 * tau; ph = st.w2 * tau; vx = st.vG2; }
    o.bar.position.set(xG, 0, 0); o.bar.rotation.y = ph;
    o.lg.position.set(xG + 0.09, 0.1, -0.05);
    const A = rotY(0, 0.1, 0.25, ph); o.la.position.set(xG + A[0] + 0.07, 0.1, A[2] + 0.06);
    o.vArr.set([xG, 0.3, 0], [Math.abs(vx) > 0.01 ? Math.sign(vx) * Math.min(0.4, 0.08 + Math.abs(vx) * 0.22) : 0, 0, 0]);
    o.lv.visible = Math.abs(vx) > 0.01; o.lv.position.set(xG + Math.sign(vx) * 0.2, 0.42, 0);
    const spin = t >= st.t0 && st.w2 > 1e-3; o.ax.visible = o.cw.visible = o.lw.visible = spin;
    o.ax.position.set(xG, 0, 0); o.cw.position.set(xG, 0.14, 0); o.lw.position.set(xG - 0.17, 0.16, 0.05);
  }
});

/* 5.C.8  Two bars of length 2R pinned at the ends of a cross arm (half-length R = 0.5 m) on a shaft that turns freely about a fixed
   vertical axis (clip 'xi-8'). The bars are raised from hanging (φ = 0) to horizontal (φ = 90°); the frame angle ψ comes from the clip. */
view3d({
  id: 'xi-8', size: 1.75, target: [0, 1.45, 0], camera: [-0.25, 0.4, 1],
  build(H){
    const R = 0.5, top = 2.0;
    H.floor(-1.9, 1.9, 1.9);
    const bb = H.box(0.47, 0.28, 0.47, '#8a8478'); bb.position.set(0, 0.14, 0);
    const frame = new H.THREE.Group(); H.add(frame);
    post(H, 0.06, top - 0.28 + 0.04, '#c9c4b6', frame).position.y = 0.28 + (top - 0.28 + 0.04) / 2;
    const arm = H.box(2 * R + 0.08, 0.06, 0.06, H.C.steel, frame); arm.position.set(0, top, 0);
    const bars = [1, -1].map(sg => {
      const g = new H.THREE.Group(); g.position.set(sg * R, top, 0); frame.add(g);
      const b = H.box(0.06, 2 * R, 0.06, H.C.body, g); b.position.y = -R;
      H.disk(0.022, 0.16, H.C.dark, g);                                // pin with its axis along the arm's normal
      [-0.055, 0.055].forEach(z => { const ear = H.box(0.06, 0.08, 0.012, H.C.steel, frame); ear.position.set(sg * R, top, z); });
      return { g, sg };
    });
    dashed(H, [0, top + 0.05, 0], [0, top + 0.6, 0]); note(H, 'vertical axis', '#8a8478', 0.09).position.set(-0.45, top + 0.58, 0);
    curl(H, 0.2, top + 0.3, H.C.purple); lab(H, 'Ω', H.C.purple).position.set(0.33, top + 0.35, 0);
    const lphi = lab(H, 'φ');
    return { R, top, frame, bars, lphi };
  },
  update(H, st, o){
    if (st.psi === undefined) return;
    const ph = st.phi || 0; o.frame.rotation.y = st.psi;
    o.bars.forEach(({ g, sg }) => { g.rotation.z = sg * ph; });
    const p = rotY(o.R + 0.45 * Math.sin(ph / 2) + 0.12, o.top - 0.42 * Math.cos(ph / 2) + 0.05, 0, st.psi); o.lphi.position.set(...p);
  }
});

/* 5.C.9  Rod of length L = 2 m pinned at A to a block that slides on a smooth floor (clip 'xi-9').
   Block 0.7 m × 0.4 m, pin A on top of its centre. st.s = [x, θ, x′, θ′], θ measured from the vertical. */
view3d({
  id: 'xi-9', size: 1.75, target: [0.4, 0.9, 0], camera: [-0.3, 0.3, 1],
  build(H){
    H.floor(-2.2, 3.0, 0.7);
    const blk = new H.THREE.Group(); H.add(blk);
    H.box(0.7, 0.4, 0.5, '#cfd8ea', blk).position.y = 0.2;
    [-0.06, 0.06].forEach(z => { const ear = H.box(0.08, 0.1, 0.015, H.C.steel, blk); ear.position.set(0, 0.45, z); });
    H.disk(0.02, 0.16, H.C.dark, blk).position.y = 0.45;
    const rod = new H.THREE.Group(); H.add(rod); H.box(0.06, 2, 0.06, H.C.body, rod).position.y = 1;
    const vline = dashed(H, [0, 0, 0], [0, 0.8, 0]);
    const la = lab(H, 'A'), lm = lab(H, 'M'), lt = lab(H, 'θ');
    const vArr = H.arrow(H.C.red), lv = lab(H, 'v_{block}', H.C.red);
    note(H, 'smooth floor', '#8a8478', 0.09).position.set(-1.6, 0.08, 0.6);
    return { blk, rod, vline, la, lm, lt, vArr, lv };
  },
  update(H, st, o){
    if (!st.s) return;
    const [x, th, xd] = st.s, A = [x, 0.45, 0];
    o.blk.position.set(x, 0, 0); o.rod.position.set(...A); o.rod.rotation.z = -th; o.vline.position.set(A[0], A[1], 0);
    o.la.position.set(x - 0.18, 0.55, 0.1); o.lm.position.set(x + 0.2, 0.2, 0.3); o.lt.position.set(x + 0.32 * Math.sin(th / 2) + 0.04, 0.45 + 0.6 * Math.cos(th / 2), 0.05);
    const L = Math.abs(xd) > 0.01 ? Math.sign(xd) * Math.min(0.7, 0.14 + Math.abs(xd) * 0.55) : 0;
    o.vArr.set([x, 0.08, 0.4], [L, 0, 0]); o.lv.visible = L !== 0; o.lv.position.set(x + L + Math.sign(L) * 0.3, 0.15, 0.4);
  }
});

})();
