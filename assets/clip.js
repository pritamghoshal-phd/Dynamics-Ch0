const HEAT = '#a61e4d';
/* =========================================================
   Concept clips: small animations placed next to the ideas
   they explain. Each clip = controls + reset/step/draw.
   ========================================================= */
function makeClip(cfg){
  const root = $(cfg.id); if (!root) return;
  const st = { t: 0, V: {} };
  const reset = () => { st.t = 0; st._lastStat = undefined; cfg.reset && cfg.reset(st); };
  const d = {
    advance(dt){ st.t += dt; cfg.step && cfg.step(st, dt); },
    draw(){ cfg.draw(st); }
  };
  let C = null;
  if (cfg.controls){ C = makeControls(cfg.id + '-ctl', cfg.controls, () => reset()); st.V = C.v; }
  if (cfg.presets) makePresets(cfg.id + '-pre', cfg.presets(C, st, reset));
  if (cfg.buttons !== false) makeButtons(cfg.id + '-btn', d, reset, cfg.speed ?? 0.5, C);
  cfg.setup && cfg.setup(st, reset);
  reset();
  register(root, d);
}
const statsEvery = (st, id, fn, gap = 0.15) => {
  if (st._lastStat !== undefined && Math.abs(st.t - st._lastStat) < gap) return;
  st._lastStat = st.t; setStats(id, fn());
};
const mm = v => fmt(v * 1000) + ' mm';
