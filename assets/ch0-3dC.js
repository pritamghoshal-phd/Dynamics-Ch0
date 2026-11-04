/* 3D views for the scalar-kinematics examples 0.C.1 – 0.C.4: point P (a small cart) on a straight rail,
   with its velocity (green) and acceleration (red) arrows. Each view reads the live state of the 2D clip with the same id
   (st.s, st.v, st.a and the track range st.trk). The rail is 3 m long in the view; the tick labels give the problem's s. */
(function(){

function fatArrow(H, color, r = 0.014){
  const T = H.THREE, g = new T.Group(); H.add(g);
  const shaft = H.mesh(new T.CylinderGeometry(r, r, 1, 12), color, g), head = H.mesh(new T.ConeGeometry(r * 2.6, 1, 16), color, g);
  const up = new T.Vector3(0, 1, 0);
  return { obj: g, set(o, v){ const L = Math.hypot(v[0], v[1], v[2] || 0); g.visible = L > 1e-4; if (!g.visible) return;
    const hl = Math.min(r * 8, 0.45 * L); g.position.set(o[0], o[1], o[2] || 0);
    g.quaternion.setFromUnitVectors(up, new T.Vector3(v[0] / L, v[1] / L, (v[2] || 0) / L));
    shaft.scale.set(1, L - hl, 1); shaft.position.y = (L - hl) / 2; head.scale.set(1, hl, 1); head.position.y = L - hl / 2; } };
}

// vmax, amax: largest speed and acceleration of each example (the arrows are scaled so the largest is 0.7 m long)
const CFG = { 'x0c-1': [12, 12], 'x0c-2': [5, 37.5], 'x0c-3': [10, 6], 'x0c-4': [9.5, 64] };
Object.entries(CFG).forEach(([id, [vmax, amax]]) => view3d({
  id, size: 2.1, target: [0, 0.25, 0], camera: [-0.2, 0.45, 1],
  build(H){
    H.floor(-1.9, 1.9, 0.5);
    // rail on short posts
    const rail = H.box(3.3, 0.03, 0.06, H.C.steel); rail.position.set(0, 0.12, 0);
    [-1.5, 0, 1.5].forEach(x => { const p = H.box(0.04, 0.1, 0.04, H.C.dark); p.position.set(x, 0.05, 0); });
    const cart = new H.THREE.Group(); H.add(cart);
    const body = H.box(0.16, 0.08, 0.12, H.C.blue, cart); body.position.y = 0.19;
    [-0.05, 0.05].forEach(x => [-0.05, 0.05].forEach(z => { const wh = H.disk(0.025, 0.015, H.C.dark, cart); wh.position.set(x, 0.155, z); }));
    const aV = fatArrow(H, H.C.green, 0.012), aA = fatArrow(H, H.C.red, 0.012), lv = H.label('v', H.C.green, 0.12), la = H.label('a', H.C.red, 0.12), lp = H.label('P', '#1c1d21', 0.12);
    return { cart, aV, aA, lv, la, lp, ticks: null };
  },
  update(H, st, o){
    if (!st.trk) return;
    const { s0, s1 } = st.trk, X = q => -1.5 + 3 * (q - s0) / (s1 - s0);
    if (!o.ticks){                                     // tick marks and labels, made once the range is known
      o.ticks = []; const step = st.trk.tick || 1;
      for (let q = Math.ceil(s0 / step) * step; q <= s1 + 1e-9; q += step){ const t = H.box(0.008, 0.008, 0.1, H.C.dark); t.position.set(X(q), 0.14, 0.05); const l = H.label(String(+q.toFixed(3)), '#7b808c', 0.07); l.position.set(X(q), 0.06, 0.12); o.ticks.push(t, l); }
      H.label(`s (${st.trk.unit})`, '#7b808c', 0.08).position.set(1.75, 0.06, 0.12);
    }
    const x = X(st.s); o.cart.position.x = x; o.lp.position.set(x, 0.3, 0.08);
    const kv = 0.7 / vmax, ka = 0.7 / amax, Lv = st.v * kv, La = st.a * ka;
    o.aV.set([x, 0.36, 0], [Lv, 0, 0]); o.lv.position.set(x + Lv + Math.sign(Lv || 1) * 0.06, 0.36, 0); o.lv.visible = Math.abs(Lv) > 0.01;
    o.aA.set([x, 0.48, 0], [La, 0, 0]); o.la.position.set(x + La + Math.sign(La || 1) * 0.06, 0.48, 0); o.la.visible = Math.abs(La) > 0.01;
  }
}));

})();
