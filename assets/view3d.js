/* =========================================================
   3D views for the worked examples (all chapters) (three.js, loaded only when a 3D view first scrolls into view).
   Each 3D view mirrors the 2D animation of the same example: it reads that clip's live state (CLIP_ST[id]),
   so the physics is computed once and both views always agree. Sliders and presets drive both.

   Registering a view (in a group file such as ch5-3dA1.js):
     view3d({
       id: 'xa-1',                      // the 2D clip id
       size: 4,                         // rough size of the scene in metres (sets the default camera distance)
       camera: [-0.5, 0.45, 1],         // optional camera direction (x, y, z), scaled by size
       target: [0, 1, 0],               // optional look-at point (metres)
       build(H, st){ ... return objs },  // make meshes once; H holds helpers (see below)
       update(H, st, objs){ ... }        // set positions/rotations from the clip state every frame
     });
   Conventions: the 2D picture plane is the x–y plane (x right, y up, metres); z points out of the screen.
   ========================================================= */
const V3D = { specs: {}, loading: null, lib: null, live: {} };
// CLIP_ST and DEMO_BY_ID are top-level constants in ch5.js (not properties of window), so look them up by name
const clipState = id => (typeof CLIP_ST !== 'undefined' ? CLIP_ST[id] : undefined), clipDemo = id => (typeof DEMO_BY_ID !== 'undefined' ? DEMO_BY_ID[id] : undefined);
function view3d(spec){ V3D.specs[spec.id] = spec; }

function load3d(){
  if (V3D.loading) return V3D.loading;
  const add = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  V3D.loading = (window.THREE ? Promise.resolve() : add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'))
    .then(() => THREE.OrbitControls ? null : add('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'));
  return V3D.loading;
}

/* ---------- helpers handed to build() and update() ---------- */
function make3dHelpers(scene){
  const css = n => getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim();
  const C = { body: '#e9d9a8', edge: '#8a6a12', steel: '#9aa0a8', dark: '#3a3d44', wood: '#c9a46a', ground: '#d8d4c8', wall: '#c9c3b5',
    red: '#b42346', blue: '#2457d6', orange: '#c2410c', green: '#17915a', purple: '#8a3fd1', ball: '#d9662b', person: '#6b5847' };
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...opts });
  const H = {
    C, mat, THREE,
    group(){ const g = new THREE.Group(); scene.add(g); return g; },
    add(obj, parent){ (parent || scene).add(obj); return obj; },
    mesh(geo, color, parent, opts){ const m = new THREE.Mesh(geo, mat(color, opts)); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; },
    // box centred on its origin: w along x, h along y, d along z
    box(w, h, d, color = C.body, parent){ return H.mesh(new THREE.BoxGeometry(w, h, d), color, parent); },
    // cylinder whose axis is z (disks, drums, wheels, pins). depth = thickness along z
    disk(r, depth, color = C.body, parent, segs = 48){ const g = new THREE.CylinderGeometry(r, r, depth, segs); g.rotateX(Math.PI / 2); return H.mesh(g, color, parent); },
    // a slender bar from local (0,0) to (len,0) along x
    bar(len, thick = 0.05, color = C.body, parent, depth){ const m = H.box(len, thick, depth ?? thick, color, parent); m.geometry.translate(len / 2, 0, 0); return m; },
    sphere(r, color = C.ball, parent){ return H.mesh(new THREE.SphereGeometry(r, 32, 20), color, parent); },
    // ring (torus) in the x–y plane; arc in radians starting at +x, counterclockwise
    ring(R, tube, arc = 2 * Math.PI, color = C.body, parent, start = 0){ const g = new THREE.TorusGeometry(R, tube, 16, 80, arc); g.rotateZ(start); return H.mesh(g, color, parent); },
    // straight cable between two points (array of [x,y,z]); returns an object with set(points)
    cable(points, color = C.dark, radius = 0.006){
      const grp = H.group(); const segs = [];
      const set = pts => { while (segs.length < pts.length - 1){ const m = H.mesh(new THREE.CylinderGeometry(radius, radius, 1, 8), color, grp); segs.push(m); }
        segs.forEach((m, i) => { if (i >= pts.length - 1){ m.visible = false; return; } m.visible = true;
          const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), L = a.distanceTo(b);
          m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, Math.max(L, 1e-4), 1);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); }); };
      set(points); return { group: grp, set };
    },
    // floor (y = 0) with a fine grid, a vertical wall, a ceiling slab
    floor(x0, x1, z = 0.6, y = 0, color = C.ground){ const m = H.box(x1 - x0, 0.04, 2 * z, color); m.position.set((x0 + x1) / 2, y - 0.02, 0); m.castShadow = false;
      const grid = new THREE.GridHelper(Math.max(x1 - x0, 2 * z), Math.round(Math.max(x1 - x0, 2 * z) * 4), 0xb8b3a6, 0xcfcabd); grid.position.set((x0 + x1) / 2, y + 0.001, 0); grid.scale.z = (2 * z) / Math.max(x1 - x0, 2 * z); grid.scale.x = (x1 - x0) / Math.max(x1 - x0, 2 * z); scene.add(grid); return m; },
    wall(x, y0, y1, z = 0.6, color = C.wall){ const m = H.box(0.06, y1 - y0, 2 * z, color); m.position.set(x - 0.03, (y0 + y1) / 2, 0); return m; },
    ceiling(x0, x1, y, z = 0.4, color = C.wall){ const m = H.box(x1 - x0, 0.05, 2 * z, color); m.position.set((x0 + x1) / 2, y + 0.025, 0); return m; },
    // pin support: a bracket from the ceiling (dir = 'down') or from the floor (dir = 'up') to a pin at (x, y)
    pinSupport(x, y, len = 0.3, dir = 'down', zOff = -0.08){
      const g = H.group(); const s = dir === 'down' ? 1 : -1;
      const plate = H.box(0.06, len, 0.03, C.steel, g); plate.position.set(x, y + s * len / 2, zOff);
      const base = H.box(0.25, 0.04, 0.2, C.steel, g); base.position.set(x, y + s * len, zOff);
      const pinM = H.disk(0.02, 0.22, C.dark, g); pinM.position.set(x, y, 0.0);
      return g;
    },
    // arrow for a force or velocity (origin and direction in metres); returns an object with set(origin, vector)
    arrow(color = C.red, scale = 1){
      const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.12 * scale, 0.07 * scale); scene.add(a);
      a.line.material.linewidth = 2;
      return { obj: a, set(o, v){ const L = Math.hypot(v[0], v[1], v[2] || 0); a.visible = L > 1e-3; if (!a.visible) return;
        a.position.set(o[0], o[1], o[2] || 0); a.setDirection(new THREE.Vector3(v[0] / L, v[1] / L, (v[2] || 0) / L)); a.setLength(L, Math.min(0.12 * scale, 0.4 * L), Math.min(0.07 * scale, 0.25 * L)); } };
    },
    // text label that always faces the camera. "N_A", "a_G" and "μ_{s,min}" are drawn with real subscripts.
    label(text, color = '#1c1d21', size = 0.16){
      const cv = document.createElement('canvas'), g = cv.getContext('2d'), px = 64, sub = 44;
      const parts = []; String(text).replace(/_\{([^}]*)\}|_([A-Za-z0-9\u0370-\u03FF]+)|([^_]+)/g, (all, a, b, c) => { parts.push(c !== undefined ? [c, 0] : [a ?? b, 1]); return ''; });
      const fnt = s => `${/[a-zA-Zθμω]/.test(text) && text.length < 6 ? 'italic ' : ''}${s ? sub : px}px Georgia, serif`;
      let w = 16; parts.forEach(([t, s]) => { g.font = fnt(s); w += g.measureText(t).width; }); w = Math.ceil(w);
      cv.width = w; cv.height = px + 28; g.fillStyle = color; g.textBaseline = 'middle';
      let x = 8; parts.forEach(([t, s]) => { g.font = fnt(s); g.fillText(t, x, cv.height / 2 - 6 + (s ? 18 : 0)); x += g.measureText(t).width; });
      const tex = new THREE.CanvasTexture(cv); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(size * w / cv.height, size, 1); sp.renderOrder = 10; scene.add(sp); return sp;
    }
  };
  return H;
}

/* ---------- label placement ----------
   Every text sprite keeps its anchor (the position the view gives it). Each frame the labels are projected to the
   screen and pushed apart, away from arrow heads and back inside the frame, by small screen-space offsets.
   Offsets carry over between frames, so labels glide instead of jumping, and they relax back toward the anchor
   when there is room again. This works for any camera angle the student chooses. */
const LBL3 = { PAD: 3, HMIN: 24, HMAX: 34 };   // on-screen height range of a label sprite (px)
// light halo behind the letters, so a label stays readable where it crosses a body or a line
function haloSprite(sp){
  const tex = sp.material.map, cv = tex && tex.image; if (!cv || !cv.getContext || sp.userData.halo === cv) return;
  const tmp = document.createElement('canvas'); tmp.width = cv.width; tmp.height = cv.height; tmp.getContext('2d').drawImage(cv, 0, 0);
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.save(); g.shadowColor = 'rgba(247,244,236,0.95)'; g.shadowBlur = 7;
  for (let k = 0; k < 4; k++) g.drawImage(tmp, 0, 0); g.restore(); g.drawImage(tmp, 0, 0); tex.needsUpdate = true; sp.userData.halo = cv;
}
function textSprites(scene){ const out = []; scene.traverseVisible(o => { if (o.isSprite && o.renderOrder >= 10 && (o.material.opacity ?? 1) > 0.05) out.push(o); }); return out; }
function restoreLabels(scene){ scene.traverse(o => { if (o.isSprite && o.userData.anchor) o.position.copy(o.userData.anchor); }); }
function placeLabels3d(scene, camera, Wpx, Hpx){
  const sps = textSprites(scene), T = THREE, v = new T.Vector3(), cam = camera.position, fwd = new T.Vector3(); camera.getWorldDirection(fwd);
  const right = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), k = 2 * Math.tan(camera.fov * Math.PI / 360) / Hpx;
  const L = [];
  sps.forEach(sp => {
    haloSprite(sp);
    sp.userData.anchor = sp.position.clone();
    const wa = sp.getWorldPosition(new T.Vector3()); v.copy(wa).project(camera); if (v.z > 1 || v.z < -1) return;
    const wpp = Math.max(1e-6, wa.clone().sub(cam).dot(fwd) * k), off = sp.userData.off || (sp.userData.off = { x: 0, y: 0 });
    // keep every label readable but never huge, whatever the scene size or zoom
    if (!sp.userData.s0 || !sp.userData.applied || !sp.scale.equals(sp.userData.applied)) sp.userData.s0 = sp.scale.clone();
    const s0 = sp.userData.s0, hpx = s0.y / wpp, f = Math.min(LBL3.HMAX, Math.max(LBL3.HMIN, hpx)) / hpx;
    sp.scale.set(s0.x * f, s0.y * f, 1); sp.userData.applied = sp.scale.clone();
    L.push({ sp, wa, wpp, off, ax: (v.x + 1) / 2 * Wpx, ay: (1 - v.y) / 2 * Hpx, w: sp.scale.x / wpp * 0.9, h: sp.scale.y / wpp * 0.72 });
  });
  // arrow heads are obstacles: a label should sit beside an arrow tip, not on it
  const obs = [];
  // objects marked userData.avoid (curved moment and spin arrows) are obstacles too, as screen rectangles
  const rects = [], bx = new T.Box3(), c8 = [0, 1].flatMap(i => [0, 1].flatMap(j => [0, 1].map(l => [i, j, l])));
  scene.traverseVisible(o => { if (!o.userData.avoid) return; bx.setFromObject(o); if (bx.isEmpty()) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    c8.forEach(([i, j, l]) => { v.set(i ? bx.max.x : bx.min.x, j ? bx.max.y : bx.min.y, l ? bx.max.z : bx.min.z).project(camera); const x = (v.x + 1) / 2 * Wpx, y = (1 - v.y) / 2 * Hpx; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    rects.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: (x1 - x0) / 2 + 2, hh: (y1 - y0) / 2 + 2 }); });
  scene.traverseVisible(o => { if (o.type === 'ArrowHelper' && o.cone && o.cone.visible){ o.cone.getWorldPosition(v); v.project(camera); if (Math.abs(v.z) <= 1) obs.push({ x: (v.x + 1) / 2 * Wpx, y: (1 - v.y) / 2 * Hpx, r: 7 }); } });
  L.forEach(l => { l.off.x *= 0.96; l.off.y *= 0.96; });                 // relax toward the anchor
  const P = LBL3.PAD;
  for (let it = 0; it < 12; it++){
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++){
      const a = L[i], b = L[j], ax = a.ax + a.off.x, ay = a.ay + a.off.y, bx = b.ax + b.off.x, by = b.ay + b.off.y;
      const ox = (a.w + b.w) / 2 + P - Math.abs(ax - bx), oy = (a.h + b.h) / 2 + P - Math.abs(ay - by);
      if (ox <= 0 || oy <= 0) continue;
      if (ox < oy * 1.4){ const s = (ax < bx || (ax === bx && i < j)) ? -1 : 1; a.off.x += s * ox / 2; b.off.x -= s * ox / 2; }
      else { const s = (ay < by || (ay === by && i < j)) ? -1 : 1; a.off.y += s * oy / 2; b.off.y -= s * oy / 2; }
    }
    L.forEach(l => {
      obs.forEach(o => { const x = l.ax + l.off.x, y = l.ay + l.off.y, ox = l.w / 2 + o.r - Math.abs(x - o.x), oy = l.h / 2 + o.r - Math.abs(y - o.y);
        if (ox > 0 && oy > 0){ if (ox < oy) l.off.x += (x < o.x ? -ox : ox); else l.off.y += (y < o.y ? -oy : oy); } });
      rects.forEach(o => { const x = l.ax + l.off.x, y = l.ay + l.off.y, ox = l.w / 2 + o.hw - Math.abs(x - o.x), oy = l.h / 2 + o.hh - Math.abs(y - o.y);
        if (ox > 0 && oy > 0){ if (ox < oy) l.off.x += (x < o.x ? -ox : ox); else l.off.y += (y < o.y ? -oy : oy); } });
      const x = l.ax + l.off.x, y = l.ay + l.off.y;                         // stay inside the frame
      if (x - l.w / 2 < 4) l.off.x += 4 - (x - l.w / 2); if (x + l.w / 2 > Wpx - 4) l.off.x -= x + l.w / 2 - (Wpx - 4);
      if (y - l.h / 2 < 4) l.off.y += 4 - (y - l.h / 2); if (y + l.h / 2 > Hpx - 4) l.off.y -= y + l.h / 2 - (Hpx - 4);
    });
  }
  L.forEach(l => {
    const w = l.wa.clone().addScaledVector(right, l.off.x * l.wpp).addScaledVector(up, -l.off.y * l.wpp);
    l.sp.position.copy(l.sp.parent ? l.sp.parent.worldToLocal(w) : w);
    l.box = { x0: l.ax + l.off.x - l.w / 2, x1: l.ax + l.off.x + l.w / 2, y0: l.ay + l.off.y - l.h / 2, y1: l.ay + l.off.y + l.h / 2 };
  });
  return { labels: L, obs, rects };
}

/* ---------- one 3D stage ---------- */
function start3d(card){
  const id = card.dataset.clip, spec = V3D.specs[id]; if (!spec) return;
  const stage = card.querySelector('.v3d-stage');
  load3d().then(() => {
    const W = () => stage.clientWidth, Hh = () => stage.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W(), Hh()); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xf7f4ec); stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a0, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75); const S = spec.size || 3; sun.position.set(S * 0.6, S * 1.6, S * 1.2); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -S * 1.5, right: S * 1.5, top: S * 1.5, bottom: -S * 1.5, near: 0.1, far: S * 6 }); scene.add(sun);
    const camera = new THREE.PerspectiveCamera(40, W() / Hh(), 0.01, S * 30);
    const tgt = new THREE.Vector3(...(spec.target || [0, 0, 0])), dir = new THREE.Vector3(...(spec.camera || [-0.45, 0.35, 1])).normalize();
    const far = () => S * 2.1 * Math.min(1.6, Math.max(1, 1.6 * Hh() / W())); // narrow screens (phones) need the camera further back to fit the scene
    camera.position.copy(tgt).add(dir.multiplyScalar(far()));
    const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.target.copy(tgt); controls.enableDamping = true; controls.update();
    const H = make3dHelpers(scene);
    const st0 = clipState(id);
    let objs = null;
    try { objs = spec.build(H, st0 || {}); } catch (e){ console.error(e); }
    let visible = false;
    const live = V3D.live[id] = { scene, camera, controls, tgt, last: null };   // used by the page checks
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(stage);
    card.querySelector('[data-a=reset3d]').onclick = () => { camera.position.copy(tgt).add(new THREE.Vector3(...(spec.camera || [-0.45, 0.35, 1])).normalize().multiplyScalar(far())); controls.target.copy(tgt); controls.update(); };
    const tick = () => {
      requestAnimationFrame(tick);
      if (!visible) return;
      const d = clipDemo(id); if (d) d.visible = true; // keep the 2D clip (and so the physics) running
      const st = clipState(id);
      restoreLabels(scene);
      if (st && objs !== null){ try { spec.update(H, st, objs); } catch (e){ console.error(e); } }
      if (renderer.domElement.width !== Math.round(W() * renderer.getPixelRatio())){ renderer.setSize(W(), Hh()); camera.aspect = W() / Hh(); camera.updateProjectionMatrix(); }
      controls.update(); scene.updateMatrixWorld(); camera.updateMatrixWorld();
      live.last = placeLabels3d(scene, camera, W(), Hh());
      renderer.render(scene, camera);
    };
    tick();
  }).catch(() => { stage.innerHTML = '<p class="small" style="padding:1rem">The 3D view could not be loaded. Check your internet connection and reload the page.</p>'; });
}

window.addEventListener('load', () => {
  document.querySelectorAll('.v3d').forEach(card => {
    if (!V3D.specs[card.dataset.clip]){ card.remove(); return; }
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting){ io.disconnect(); start3d(card); } }, { rootMargin: '200px' });
    io.observe(card);
  });
});
