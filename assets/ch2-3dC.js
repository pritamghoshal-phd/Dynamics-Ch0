/* 3D views for examples 2.C.1 and 2.C.2. Each view reads the geometry that the 2D clip with the same id stores in st.g. */
(function(){
const T = () => THREE;
function linkMesh(H, color, thick, depth, z){ const m = H.bar(1, thick, color, null, depth); m.position.z = z; return m; }
function place(m, a, b){ const dx = b[0] - a[0], dy = b[1] - a[1]; m.position.x = a[0]; m.position.y = a[1]; m.rotation.z = Math.atan2(dy, dx); m.scale.x = Math.max(Math.hypot(dx, dy), 1e-4); }
function pinAt(H, r, depth, z){ const p = H.disk(r, depth, H.C.dark); p.position.z = z; return p; }

/* 2.C.1  Wheel rolling on the floor, rod AB, slider B running in a channel (clip x2c-1, lengths in ft). */
view3d({
  id: 'x2c-1', size: 2.2, target: [0.9, 0.3, 0], camera: [-0.3, 0.35, 1],
  build(H){
    // upper floor on the wheel side, and the lower floor of the channel in which the slider runs
    const up = H.box(2.4, 0.06, 1.4, H.C.ground); up.position.set(-0.9, -0.03, 0); up.castShadow = false;
    const low = H.box(4.0, 0.06, 1.4, H.C.ground); low.position.set(2.3, -0.23, 0); low.castShadow = false;
    const step = H.box(0.04, 0.2, 1.4, H.C.wall); step.position.set(0.32, -0.1, 0);   // between the wheel's contact range and the slider's range
    const wheel = new (T().Group)(); H.add(wheel);
    H.disk(0.5, 0.16, '#cfc8b5', wheel);
    [0, 1].forEach(k => { const s = H.box(0.95, 0.04, 0.17, H.C.edge, wheel); s.rotation.z = k * Math.PI / 2; });
    const pA = pinAt(H, 0.025, 0.2, 0.08), pO = pinAt(H, 0.03, 0.24, 0);
    const rod = linkMesh(H, H.C.wood, 0.07, 0.05, 0.17);
    const slider = H.box(0.4, 0.4, 0.4, '#cfd8ea'); const pB = pinAt(H, 0.025, 0.5, 0.05);
    const lO = H.label('O'), lA = H.label('A'), lB = H.label('B');
    const vB = H.arrow(H.C.orange, 2), lvB = H.label('v_B', H.C.orange);
    return { wheel, pA, pO, rod, slider, pB, lO, lA, lB, vB, lvB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    o.wheel.position.set(g.xO, g.r, 0); o.wheel.rotation.z = g.phi; o.pO.position.set(g.xO, g.r, 0);
    o.pA.position.set(g.A[0], g.A[1], 0.08);
    place(o.rod, g.A, [g.xB, 0]);
    o.slider.position.set(g.xB, -0.0, 0.05); o.pB.position.set(g.xB, 0, 0.05);
    o.lO.position.set(g.xO - 0.15, g.r + 0.2, 0.3); o.lA.position.set(g.A[0], g.A[1] + 0.22, 0.2); o.lB.position.set(g.xB, 0.4, 0.3);
    o.vB.set([g.xB - 0.22, 0.1, 0.3], [-0.5, 0, 0]); o.lvB.position.set(g.xB - 0.9, 0.1, 0.3);
  }
});

/* 2.C.2  Four-bar linkage with both ground pins on pedestals (clip x2c-2, drawn with L = 1 m). */
view3d({
  id: 'x2c-2', size: 2.6, target: [1.0, 0.55, 0], camera: [-0.3, 0.3, 1],
  build(H){
    H.floor(-1.4, 3.4, 0.6, -1.25);
    H.pinSupport(0, 0, 1.25, 'up', -0.07); H.pinSupport(2, 0, 1.25, 'up', -0.07);   // tall pedestals: the crank OA sweeps below O
    const OA = linkMesh(H, H.C.wood, 0.07, 0.04, 0.0), AB = linkMesh(H, '#d9c58c', 0.07, 0.04, 0.05), BD = linkMesh(H, H.C.wood, 0.07, 0.04, 0.0);
    const pA = pinAt(H, 0.02, 0.14, 0.03), pB = pinAt(H, 0.02, 0.14, 0.03);
    const lO = H.label('O'), lD = H.label('D'), lA = H.label('A'), lB = H.label('B');
    lO.position.set(-0.2, 0.12, 0.1); lD.position.set(2.2, 0.12, 0.1);
    return { OA, AB, BD, pA, pB, lA, lB };
  },
  update(H, st, o){
    const g = st.g; if (!g) return;
    place(o.OA, g.O, g.A); place(o.AB, g.A, g.B); place(o.BD, g.D, g.B);
    o.pA.position.set(g.A[0], g.A[1], 0.03); o.pB.position.set(g.B[0], g.B[1], 0.03);
    o.lA.position.set(g.A[0] - 0.2, g.A[1] + 0.12, 0.1); o.lB.position.set(g.B[0] + 0.2, g.B[1] + 0.12, 0.1);
  }
});

})();
