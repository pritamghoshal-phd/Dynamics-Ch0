/* =========================================================
   Chapter 6 · Vibrations: theory-page animations, challenges and badges
   (ported from the Linear Vibrations Lab). Loaded after common.js, clip.js and labels.js.
   ========================================================= */
/* =========================================================
   Challenges and badges
   ========================================================= */
const CHALLENGES = [
  { id: 'pend5',  ctl: 'pend-ctl', page: 'eom.html',    demo: 'demo-pend',   icon: '🕰️', title: 'Galileo was (almost) right', task: 'Set L = 0.5 m, then find the release angle at which the <em>exact</em> period is 1.50 s (±0.01 s).' },
  { id: 'tick1',  ctl: 'free-ctl', page: 'free.html',   demo: 'demo-free',   icon: '⏱️', title: 'One-hertz clock', task: 'Using a 2.5 kg mass, choose k so the oscillator ticks at 1.000 Hz (±0.5%). Calculate k first, then check.' },
  { id: 'crit',   ctl: 'damp-ctl', page: 'damped.html', demo: 'demo-damped', icon: '🚪', title: 'Perfect door closer', task: 'Release from rest (v₀ = 0) with critical damping (ζ between 0.98 and 1.02), and choose m and k so the mass is within 2% of equilibrium in under 0.5 s.' },
  { id: 'logdec', ctl: 'damp-ctl', page: 'damped.html', demo: 'demo-damped', icon: '🔬', title: 'Lab technician', task: 'Make each peak exactly half the previous one (peak ratio 0.50 ± 0.01). Work out ζ from the log decrement first.' },
  { id: 'res10',  ctl: 'frc-ctl', page: 'forced.html', demo: 'demo-forced', icon: '📈', title: 'Resonance hunter', task: 'With ζ = 0.05, find a frequency ratio where the steady amplitude is exactly 8× the static deflection (±2%). There are two answers; find either.' },
  { id: 'calm',   ctl: 'frc-ctl', page: 'forced.html', demo: 'demo-forced', icon: '🧘', title: 'Too heavy to care', task: 'With ζ = 0.3, find the frequency ratio where the steady amplitude is one-tenth of the static deflection (±3%). (Type values beyond the slider.)' },
  { id: 'iso',    ctl: 'base-ctl', page: 'base.html',   demo: 'demo-base',   icon: '🛡️', title: 'Vibration isolator', task: 'Keep ζ ≥ 0.1 and get the transmissibility below 0.05. How soft must the mounts be? (Type values beyond the slider.)' },
  { id: 'shake',  ctl: 'base-ctl', page: 'base.html',   demo: 'demo-base',   icon: '🎸', title: 'Shake, rattle and roll', task: 'With ζ = 0.1 and the base below resonance (r &lt; 1), make the mass move exactly 3× as much as the base (TR = 3 ± 2%).' },
  { id: 'pend1',  ctl: 'pend-ctl', page: 'eom.html',    demo: 'demo-pend',   icon: '📐', title: 'How small is small?', task: 'Find the largest release angle (within 1°) for which the linear model’s period error stays below 1%.' },
  { id: 'over',   ctl: 'damp-ctl', page: 'damped.html', demo: 'demo-damped', icon: '🎢', title: 'Overdamped overshoot', task: 'With ζ ≥ 2 (heavily overdamped), pick x₀ and v₀ so the mass still crosses x = 0 once before settling.' },
  { id: 'beats',  ctl: 'frc-ctl',  page: 'forced.html', demo: 'demo-forced', icon: '🥁', title: 'Beat it', task: 'With ζ = 0 and ωₙ = 10 rad/s (±1%), choose r so the beat period is 5.0 s (±2%).' },
  { id: 'sqrt2',  ctl: 'base-ctl', page: 'base.html',   demo: 'demo-base',   icon: '⚖️', title: 'The crossover point', task: 'With ζ ≥ 0.3, find the frequency ratio where TR = 1 (within 0.005). Then change ζ: does it move?' },
  { id: 'isochron', ctl: 'free-ctl', page: 'free.html',   demo: 'demo-free',   icon: '⏳', title: 'Amplitude-proof clock', task: 'Show the period doesn’t depend on amplitude: keep m, k and x₀ = 0 fixed, and use only v₀ to try two amplitudes at least 5× apart.' },
  { id: 'split',    ctl: 'free-ctl', page: 'free.html',   demo: 'demo-free',   icon: '☯️', title: 'Half and half', task: 'Start with exactly 0.5 J of total energy (±5%), split evenly between the spring and the mass (within 5%).' },
  { id: 'scale',    ctl: 'free-ctl', page: 'free.html',   demo: 'demo-free',   icon: '✖️', title: 'Triple the pitch', task: 'Triple the natural frequency by changing only the mass. By what factor did m have to change, and why?' },
  { id: 'pump',     ctl: 'damp-ctl', page: 'damped.html', demo: 'demo-damped', icon: '🎈', title: 'Energy pump', task: 'Make each peak exactly 1.5× the previous one (ratio 1.50 ± 0.03). What sign does the damping need?' },
  { id: 'wd',       ctl: 'damp-ctl', page: 'damped.html', demo: 'demo-damped', icon: '🐢', title: 'Damping slows the clock', task: 'Make the damped period exactly 25% longer than the undamped period (±1%).' },
  { id: 'phase90',  ctl: 'frc-ctl',  page: 'forced.html', demo: 'demo-forced', icon: '↪️', title: 'Three-eighths of a cycle behind', task: 'With ζ = 0.2, find the frequency ratio where the displacement lags the force by 135° (±1°). Is it above or below resonance?' },
  { id: 'peak',     ctl: 'frc-ctl',  page: 'forced.html', demo: 'demo-forced', icon: '⛰️', title: 'The peak isn’t at resonance', task: 'With ζ between 0.3 and 0.6, find the frequency ratio of the largest steady amplitude to within 0.005. Is it above or below r = 1?' },
  { id: 'dhurts',   ctl: 'base-ctl', page: 'base.html',   demo: 'demo-base',   icon: '🧱', title: 'When damping hurts', task: 'At r = 3, find the damping ratio that makes the transmissibility exactly 0.2 (±2%). Compare it with ζ = 0.05.' }
];
const WHERE = { 'eom.html': 'Equations of motion', 'free.html': 'Free vibration', 'damped.html': 'Damped vibration', 'forced.html': 'Forced vibration', 'base.html': 'Base excitation' };
const whereName = pg => WHERE[pg] || (pg.startsWith('example-') ? 'Example ' + pg.replace(/\D/g, '') : pg);
try { localStorage.removeItem('vlab-badges'); } catch (e){}
/* ---- Name sign-in: any name or username; the same name brings back the same badges ---- */
function getUser(){ try { const u = JSON.parse(localStorage.getItem('vlab-user') || 'null'); return u && u.login ? u : null; } catch (e){ return null; } }
function setUser(u){ try { if (u) localStorage.setItem('vlab-user', JSON.stringify(u)); else localStorage.removeItem('vlab-user'); } catch (e){} }
const badgeKey = () => { const u = getUser(); return u ? 'vlab-badges:' + u.login.toLowerCase() : null; };
function getBadges(){ const k = badgeKey(); if (!k) return {}; try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e){ return {}; } }
function saveBadge(id){ const k = badgeKey(); if (!k) return; try { const b = getBadges(); b[id] = Date.now(); localStorage.setItem(k, JSON.stringify(b)); } catch (e){} }
const escH = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const initials = name => { const w = name.replace(/<[^>]*>/g, ' ').match(/[\p{L}\p{N}]+/gu) || []; return (w.slice(0, 2).map(x => [...x][0]).join('') || '🙂').toUpperCase(); };
function knownNames(){
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith('vlab-badges:')) out.push(k.slice(12)); } } catch (e){}
  return out;
}
function openSignIn(){
  if ($('signin-modal')) return;
  const m = document.createElement('div'); m.id = 'signin-modal'; m.className = 'modal';
  m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="si-title">
    <h3 id="si-title">👋 Sign in</h3>
    <p class="small">Type your name or any username you like. To get your badges back later, sign in with the same name.</p>
    <form id="si-form"><input id="si-name" type="text" maxlength="40" autocomplete="nickname" spellcheck="false" placeholder="e.g. Jane Doe or vibe_master" aria-label="Your name or username">
    <div id="si-msg" class="small" role="alert"></div>
    <div class="modal-actions"><button type="button" class="btn" id="si-cancel">Cancel</button><button type="submit" class="btn primary" id="si-go">Sign in</button></div></form>
    <p class="small" style="margin-bottom:0">Names aren’t case-sensitive. No account or password needed; badges are saved in this browser.</p></div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.addEventListener('click', e => { if (e.target === m) close(); });
  $('si-cancel').onclick = close;
  m.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const inp = $('si-name'), msg = $('si-msg');
  setTimeout(() => inp.focus(), 30);
  $('si-form').onsubmit = e => {
    e.preventDefault();
    const login = inp.value.replace(/\s+/g, ' ').trim();
    if (!login){ msg.textContent = 'Please type a name.'; return; }
    if (login.length > 40){ msg.textContent = 'Please keep it to 40 characters or fewer.'; return; }
    const returning = knownNames().includes(login.toLowerCase());
    setUser({ login });
    close(); refreshUserUI();
    const n = CHALLENGES.filter(c => getBadges()[c.id]).length;
    toast(returning ? `👋 Welcome back, <b>${escH(login)}</b>! You have ${n} badge${n === 1 ? '' : 's'}.`
                    : `👋 Hi <b>${escH(login)}</b>! Complete challenges to earn badges.`);
  };
}
function signOut(){ setUser(null); refreshUserUI(); toast('Signed out. Your badges are saved for next time.'); }
function renderUserBox(){
  const bar = document.querySelector('.topbar .wrap'); if (!bar) return;
  let box = $('userbox');
  if (!box){ box = document.createElement('div'); box.id = 'userbox'; bar.appendChild(box); }
  const u = getUser();
  if (u){
    const n = CHALLENGES.filter(c => getBadges()[c.id]).length;
    box.innerHTML = `<a class="userchip" href="badges.html" title="My badges"><span class="avatar">${escH(initials(u.login))}</span><span>${escH(u.login)}</span><span class="count">🏅 ${n}/${CHALLENGES.length}</span></a><button class="btn small-btn" id="signout">Sign out</button>`;
    $('signout').onclick = signOut;
  } else {
    box.innerHTML = '<button class="btn primary" id="signin">👋 Sign in</button>';
    $('signin').onclick = openSignIn;
  }
}
function refreshUserUI(){
  renderUserBox(); renderBadgeShelf(); renderTrophy();
  const earned = getBadges(), signed = !!getUser();
  CHALLENGES.forEach(c => {
    const el = $('ch-' + c.id); if (!el) return;
    el.classList.remove('done');
    el.querySelector('.ch-status').innerHTML = signed ? '' : '<button class="linkbtn">Sign in to earn</button>';
    const m = el.querySelector('.ch-msg'); if (m){ m.className = 'ch-msg'; m.textContent = ''; }
    const lb = el.querySelector('.linkbtn'); if (lb) lb.onclick = openSignIn;
    if (earned[c.id]) markDone(el);
  });
}
const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(html){
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = html;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
}
function confetti(x, y){
  if (reducedMotion()) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti';
  document.body.appendChild(cv);
  const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const cols = [COL.c1, COL.c2, COL.c3, COL.c4, '#f2c230'];
  const P = Array.from({ length: 90 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 5 + Math.random() * 7;
    return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
             w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, c: cols[Math.floor(Math.random() * cols.length)] };
  });
  let frame = 0;
  (function step(){
    ctx.clearRect(0, 0, W, H);
    for (const p of P){
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, 1 - frame / 110); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (++frame < 110) requestAnimationFrame(step); else cv.remove();
  })();
}
function markDone(el){
  el.classList.add('done');
  el.querySelector('.ch-status').textContent = '🏅 Earned';
}
const WRONG = [
  'Not quite! Even Galileo needed a few swings. 🕯️',
  'Newton is gently shaking his head. Check your math! 🍎',
  'That answer is overdamped: slow, and nowhere near the target. 🐌',
  'Close, but your answer is out of phase with reality. 🔄',
  'The spring rejected your answer. It’s under a lot of tension right now. 🌀',
  'Error 404: correct answer not found. 🔍',
  'Resonance says no. Your amplitude of correctness is a bit low. 📉',
  'That was a linear guess for a nonlinear problem. 😅',
  'Your answer has been damped out. Try again! 💤',
  'Almost! The transmissibility of that answer is less than 1. 📏',
  'Hmm, you’re beating around the bush. 🥁',
  'The free-body diagram of that answer has a few forces missing. ✏️',
  'Plot twist: that’s not it. Calculate first, then slide! 🧮',
  'So close the pendulum is still swinging. Have another go! ⏳'
];
let lastWrong = -1;
const funny = () => { let i; do { i = Math.floor(Math.random() * WRONG.length); } while (i === lastWrong && WRONG.length > 1); lastWrong = i; return WRONG[i]; };
function awardBadge(c, el){
  saveBadge(c.id); markDone(el); renderUserBox();
  const msg = el.querySelector('.ch-msg'); msg.className = 'ch-msg good'; msg.textContent = 'Correct! Nicely done.';
  const r = el.getBoundingClientRect();
  confetti(r.left + 30, r.top + r.height / 2);
  if (CHALLENGES.every(x => getBadges()[x.id])){
    setTimeout(() => confetti(innerWidth / 2, innerHeight * 0.6), 500);
    toast(`🎓 All ${CHALLENGES.length} badges earned! <a href="badges.html" style="color:inherit"><b>See your certificate →</b></a>`);
  } else toast(`${c.icon} Badge earned: <b>${c.title}</b>`);
}
function submitChallenge(c, el){
  if (el.classList.contains('done')) return;
  if (!getUser()){ openSignIn(); toast('Sign in first, so your badge has somewhere to live. 👋'); return; }
  const ctl = CONTROLS[c.ctl];
  let ok = false; try { ok = !!(ctl && ctl._touched) && !!CHECKS[c.id](); } catch (e){}
  if (ok){ awardBadge(c, el); return; }
  const msg = el.querySelector('.ch-msg'), btn = el.querySelector('.ch-submit');
  msg.className = 'ch-msg bad'; msg.textContent = funny();
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  el.dataset.tries = String((+el.dataset.tries || 0) + 1);
  el.querySelector('.ch-status').textContent = `Tries: ${el.dataset.tries}`;
  btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 1500);   // no rapid-fire guessing
}
function mountChallenges(){
  const byDemo = {};
  CHALLENGES.forEach(c => { if ($(c.demo) && CHECKS[c.id]) (byDemo[c.demo] = byDemo[c.demo] || []).push(c); });
  for (const demo in byDemo){
    const box = document.createElement('div'); box.className = 'challenges';
    box.innerHTML = '<div class="ch-head">🎯 Challenges <span>Set up the simulation, then press <b>Submit</b> to check your answer. Sign in with your name to keep your badges; they are collected on your <a href="badges.html">badge page</a>.</span></div>' +
      byDemo[demo].map(c => `<div class="ch" id="ch-${c.id}"><span class="ch-icon" aria-hidden="true">${c.icon}</span><div class="ch-body"><b>${c.title}</b><div class="ch-task">${c.task}</div><div class="ch-msg" aria-live="polite"></div></div><div class="ch-side"><span class="ch-status"></span><button class="btn ch-submit">Submit</button></div></div>`).join('');
    $(demo).appendChild(box);
    byDemo[demo].forEach(c => { const el = $('ch-' + c.id); el.querySelector('.ch-submit').onclick = () => submitChallenge(c, el); });
  }
  refreshUserUI();
  // challenges that compare against earlier settings need the history of what was tried
  setInterval(() => { if (typeof CH_TRACK === 'function') CH_TRACK(); }, 250);
}
function renderBadgeShelf(){
  const shelf = $('badge-shelf'); if (!shelf) return;
  const u = getUser();
  if (!u){
    shelf.innerHTML = `<p class="small">Sign in with your name to earn badges. There are ${CHALLENGES.length} challenges, found under the simulations in each chapter.</p>` +
      '<div class="shelf">' + CHALLENGES.map(c => `<a class="badge" href="${c.page}" title="${c.task}"><span>❔</span>${c.title}</a>`).join('') + '</div>' +
      '<button class="btn primary" id="shelf-signin" style="margin-top:.7rem">👋 Sign in</button>';
    $('shelf-signin').onclick = openSignIn;
    return;
  }
  const earned = getBadges(), n = CHALLENGES.filter(c => earned[c.id]).length;
  shelf.innerHTML = `<p class="small"><b>${escH(u.login)}</b>: ${n} of ${CHALLENGES.length} earned${n === CHALLENGES.length ? ' — you have mastered the lab! 🎉' : '. Challenges appear under the simulations in each chapter.'}</p>` +
    '<p class="small" style="margin-top:0"><a href="badges.html">Open my badge page' + (n === CHALLENGES.length ? ' and certificate' : '') + ' →</a></p>' + '<div class="shelf">' + CHALLENGES.map(c => earned[c.id]
      ? `<a class="badge got" href="${c.page}" title="${c.task}"><span>${c.icon}</span>${c.title}</a>`
      : `<a class="badge" href="${c.page}" title="${c.task}"><span>❔</span>${c.title}</a>`).join('') + '</div>' +
    (n ? '<button class="btn" id="badge-reset" style="margin-top:.6rem">Reset my badges</button>' : '');
  const rb = $('badge-reset');
  if (rb) rb.onclick = () => { if (confirm('Remove all of your badges?')){ try { localStorage.removeItem(badgeKey()); } catch (e){} refreshUserUI(); } };
}

/* ---------- My badges page / certificate ---------- */
const nameKey = () => { const u = getUser(); return u ? 'vlab-name:' + u.login.toLowerCase() : null; };
function getDisplayName(){ const u = getUser(); if (!u) return ''; try { return localStorage.getItem(nameKey()) || u.login; } catch (e){ return u.login; } }
const esc = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmtDate = ms => new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
let trophyCelebrated = false;
function renderTrophy(){
  const box = $('trophy'); if (!box) return;
  const u = getUser();
  if (!u){
    box.innerHTML = `<div class="card" style="text-align:center;padding:2rem 1.2rem">
      <div style="font-size:2.6rem">🏅</div>
      <h3>Sign in to see your badges</h3>
      <p class="small" style="margin:0 auto 1rem">Sign in with the same name you used before and your badges will be here.</p>
      <button class="btn primary" id="trophy-signin">👋 Sign in</button></div>`;
    $('trophy-signin').onclick = openSignIn;
    return;
  }
  const earned = getBadges(), n = CHALLENGES.filter(c => earned[c.id]).length, N = CHALLENGES.length, all = n === N;
  const name = getDisplayName();
  const tiles = CHALLENGES.map(c => earned[c.id]
    ? `<div class="tile got"><div class="ti">${c.icon}</div><b>${c.title}</b><span>Earned ${fmtDate(earned[c.id])}</span></div>`
    : `<a class="tile" href="${c.page}"><div class="ti">🔒</div><b>${c.title}</b><span>${c.task}</span><em>Find it in ${whereName(c.page)} →</em></a>`).join('');
  const nameEditor = `<div class="nameedit noprint"><label for="cert-name">Name on ${all ? 'certificate' : 'this page'}</label>
    <input id="cert-name" type="text" maxlength="60" value="${esc(name)}"><span class="small">Defaults to the name you signed in with.</span></div>`;
  if (all){
    const done = Math.max(...CHALLENGES.map(c => earned[c.id]));
    box.innerHTML = `<div class="cert">
        <div class="cert-inner">
          <div class="cert-kicker">Linear Vibrations Lab</div>
          <div class="cert-title">Certificate of Completion</div>
          <div class="cert-small">This certifies that</div>
          <div class="cert-name" id="cert-name-out">${esc(name)}</div>
          <div class="cert-small">has earned all ${N} badges in the Linear Vibrations Lab,<br>from equations of motion to vibration isolation.</div>
          <div class="tiles cert-tiles">${tiles}</div>
          <div class="cert-foot"><span>Completed ${fmtDate(done)}</span>${name.toLowerCase() !== u.login.toLowerCase() ? `<span>Signed in as ${esc(u.login)}</span>` : ''}</div>
        </div>
      </div>
      <div class="bar noprint" style="justify-content:center;margin-top:1rem"><button class="btn primary" id="cert-print">🖨️ Print or save as PDF</button></div>
      ${nameEditor}`;
    $('cert-print').onclick = () => window.print();
    if (!trophyCelebrated){ trophyCelebrated = true; setTimeout(() => confetti(innerWidth / 2, innerHeight * 0.45), 400); }
  } else {
    box.innerHTML = `<div class="card">
        <div class="trophy-head"><div><div class="cert-kicker">Badge collection</div><div class="trophy-name" id="cert-name-out">${esc(name)}</div></div>
        <div class="trophy-count"><b>${n}</b>/${N}</div></div>
        <div class="progress" aria-label="${n} of ${N} badges"><div style="width:${n / N * 100}%"></div></div>
        <p class="small">${n === 0 ? 'No badges yet. ' : ''}Earn all ${N} to unlock your certificate. Challenges are under the simulations in each chapter.</p>
        <div class="tiles">${tiles}</div>
      </div>${nameEditor}`;
  }
  const inp = $('cert-name');
  inp.oninput = () => {
    const v = inp.value.trim();
    try { if (v && v !== u.login) localStorage.setItem(nameKey(), v); else localStorage.removeItem(nameKey()); } catch (e){}
    $('cert-name-out').textContent = v || u.login;
  };
}

window.addEventListener('load', () => { mountChallenges(); if (!$('ch-' + CHALLENGES[0].id)) refreshUserUI(); });


/* =========================================================
   Physically consistent spring–mass–damper pictures for this chapter (they replace the versions in common.js on
   the Chapter 6 pages only). The drawn travel is limited so that, over the whole stroke, the spring never collapses,
   the damper rod keeps a fixed length with its piston inside the cylinder, and the mass never touches the cylinder.
   ========================================================= */
function drawSMD(cv, o){
  // o: x (m), y base (m), amp (m, sets scale), damper, force (N), forceScale (px/N), baseMoves
  const { ctx, w, h } = fit(cv);
  ctx.clearRect(0, 0, w, h);
  const gy = h - 26;
  const bw = clamp(w * 0.13, 56, 86), bh = 62;
  const wall0 = 44;
  const amp = (o.amp > 0 && isFinite(o.amp)) ? o.amp : 1;
  if (!isFinite(o.x)) o.x = 0;
  if (!isFinite(o.y || 0)) o.y = 0;
  const eqC = w * 0.6, nb = o.baseMoves ? 2 : 1;
  // Largest relative travel R (px) that keeps the picture physical: the spring never collapses, the damper piston
  // stays inside its cylinder and the mass never reaches the cylinder. The drawn motion is limited to |x|, |y| <= amp.
  const left0 = eqC - bw / 2 - wall0, Rmax = o.damper ? (left0 - 30) / 3 : left0 - 24;
  const scale = Math.min(w * (o.baseMoves ? 0.22 : 0.27), Rmax) / (nb * amp);
  const xd = clamp(o.x, -amp, amp), yd = clamp(o.y || 0, -amp, amp);
  const wallX = wall0 + yd * scale;
  const cx = eqC + xd * scale;
  const by = gy - 7 - bh, cy = by + bh / 2;

  // ground
  ctx.strokeStyle = COL.ground; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(o.baseMoves ? wallX : 0, gy); ctx.lineTo(w, gy); ctx.stroke();
  ctx.lineWidth = 1;
  for (let x = (o.baseMoves ? wallX : 0); x < w; x += 12){ ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x - 8, gy + 8); ctx.stroke(); }

  // equilibrium line
  ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(eqC, by - 22); ctx.lineTo(eqC, gy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = COL.muted; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('x = 0', eqC, by - 26);

  // wall / base
  ctx.fillStyle = COL.ground;
  ctx.fillRect(wallX - 14, by - 18, 14, bh + 25 + (o.baseMoves ? 0 : 0));
  ctx.strokeStyle = COL.ground; ctx.lineWidth = 1;
  for (let yy = by - 18; yy < gy + 7; yy += 10){ ctx.beginPath(); ctx.moveTo(wallX - 14, yy); ctx.lineTo(wallX - 24, yy + 8); ctx.stroke(); }
  if (o.baseMoves){
    ctx.fillStyle = COL.muted; ctx.textAlign = 'center'; ctx.fillText('base y(t)', wallX - 7, by - 24);
  }

  // spring and damper
  const left = cx - bw / 2;
  ctx.strokeStyle = COL.spring; ctx.lineWidth = 2;
  const sy = o.damper ? cy - 15 : cy;
  drawSpring(ctx, wallX, left, sy, 9, 9);
  if (o.damper){
    const R = nb * amp * scale, dy = cy + 16, cylX = wallX + 18, cylL = 2 * R + 8, cylH = 16;
    const rodLen = (eqC - bw / 2) - (wall0 + 18 + cylL / 2);   // fixed rod: the piston sits mid-cylinder at equilibrium
    const pist = left - rodLen;                                  // always between cylX + 4 and cylX + cylL - 4
    ctx.beginPath(); ctx.moveTo(wallX, dy); ctx.lineTo(cylX, dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cylX + cylL, dy - cylH / 2); ctx.lineTo(cylX, dy - cylH / 2);
    ctx.lineTo(cylX, dy + cylH / 2); ctx.lineTo(cylX + cylL, dy + cylH / 2); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pist, dy - cylH / 2 + 3); ctx.lineTo(pist, dy + cylH / 2 - 3); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pist, dy); ctx.lineTo(left, dy); ctx.stroke();
  }

  // block + wheels
  ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(left, by, bw, bh, 8); else ctx.rect(left, by, bw, bh);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.fg; ctx.font = 'italic 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('m', cx, cy);
  ctx.fillStyle = COL.card; ctx.strokeStyle = COL.ground; ctx.lineWidth = 1.5;
  [left + 14, left + bw - 14].forEach(wx => { ctx.beginPath(); ctx.arc(wx, gy - 3.5, 3.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); });

  // displacement indicator
  if (Math.abs(cx - eqC) > 3){
    arrow(ctx, eqC, by - 10, cx, by - 10, COL.c1, 1.8);
  }
  ctx.fillStyle = COL.c1; ctx.font = '12px system-ui'; ctx.textBaseline = 'alphabetic';
  // force arrow
  if (o.force != null){
    const len = o.force * o.forceScale;
    const fy = cy;
    const x0 = cx + bw / 2 + 6;
    if (Math.abs(len) > 2){
      if (len > 0) arrow(ctx, x0, fy, x0 + len, fy, COL.c2, 3);
      else arrow(ctx, x0 - len, fy, x0, fy, COL.c2, 3);
    }
    txt(ctx, 'F(t)', Math.min(x0 + 2, w - 28), fy - 16, { font: 'italic 13px Georgia, serif', color: COL.c2, align: 'left' });   // placed clear of the arrow
  }
}

function drawBaseV(cv, o){
  // o: x (mass displacement, + up), y (base displacement, + up), amp (m)
  const { ctx, w, h } = fit(cv);
  ctx.clearRect(0, 0, w, h);
  const amp = (o.amp > 0 && isFinite(o.amp)) ? o.amp : 1;
  const x = clamp(isFinite(o.x) ? o.x : 0, -amp, amp), y = clamp(isFinite(o.y) ? o.y : 0, -amp, amp);
  const gap = 125, mh = 52, mw = 112, pw = 190, pth = 14;
  // the gap d between platform and mass changes by at most 2 * travel; the damper cylinder (4 * travel + 6 long) then
  // always holds the piston, and the mass (d >= gap - 2 * travel) stays above the open end of the cylinder
  const travel = Math.min(h * 0.09, (gap - 10) / 6), scale = travel / amp;
  const cx = Math.round(w * 0.42);
  const gy = h - 6;                      // fixed floor
  const yB0 = h - 80, yB = yB0 - y * scale;          // platform top
  const yM0 = yB0 - gap, yM = yM0 - x * scale;       // mass bottom

  // floor + shaker body
  ctx.strokeStyle = COL.ground; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 150, gy); ctx.lineTo(cx + 150, gy); ctx.stroke();
  ctx.lineWidth = 1;
  for (let xx = cx - 150; xx < cx + 150; xx += 12){ ctx.beginPath(); ctx.moveTo(xx, gy); ctx.lineTo(xx - 6, gy + 6); ctx.stroke(); }
  ctx.fillStyle = COL.ground;
  ctx.fillRect(cx - 34, gy - 20, 68, 20);
  ctx.fillStyle = COL.muted; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = COL.card; ctx.fillText('shaker', cx, gy - 10);
  // actuator rod
  ctx.strokeStyle = COL.ground; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(cx, gy - 20); ctx.lineTo(cx, yB + pth); ctx.stroke();
  // platform
  ctx.fillStyle = COL.ground; ctx.fillRect(cx - pw / 2, yB, pw, pth);
  ctx.strokeStyle = COL.card; ctx.lineWidth = 1;
  for (let xx = cx - pw / 2 + 4; xx < cx + pw / 2; xx += 10){ ctx.beginPath(); ctx.moveTo(xx, yB + pth - 2); ctx.lineTo(xx + 6, yB + 2); ctx.stroke(); }

  // spring (left) and damper (right)
  ctx.strokeStyle = COL.spring; ctx.lineWidth = 2;
  drawSpringV(ctx, cx - 30, yM, yB, 8, 11);
  const dx = cx + 30, cylL = 4 * travel + 6, cylW = 18;
  ctx.beginPath(); ctx.moveTo(dx - cylW / 2, yB - cylL); ctx.lineTo(dx - cylW / 2, yB); ctx.lineTo(dx + cylW / 2, yB); ctx.lineTo(dx + cylW / 2, yB - cylL); ctx.stroke();
  const rodLen = gap - cylL / 2;
  const py = yM + rodLen;   // fixed rod length: the piston stays inside the cylinder over the whole stroke
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx - cylW / 2 + 3, py); ctx.lineTo(dx + cylW / 2 - 3, py); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx, yM); ctx.lineTo(dx, py); ctx.stroke();

  // mass
  ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - mw / 2, yM - mh, mw, mh, 8); else ctx.rect(cx - mw / 2, yM - mh, mw, mh);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.fg; ctx.font = 'italic 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('m', cx, yM - mh / 2);

  // equilibrium reference lines + displacement arrows (to the right)
  const nar = w < 560, refX0 = cx + pw / 2 + 14, refX1 = refX0 + (nar ? 40 : 70);
  const ref = (yy, label, col, disp) => {
    ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + mw / 2 + 4, yy); ctx.lineTo(refX1, yy); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = COL.muted; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, refX1 + 6, yy);
    if (Math.abs(disp) > 2) arrow(ctx, refX0 + 30, yy, refX0 + 30, yy - disp, col, 2);
  };
  ref(yM0 - mh / 2, nar ? 'x = 0' : 'x = 0 (mass)', COL.c1, x * scale);
  ref(yB0 + pth / 2, nar ? 'y = 0' : 'y = 0 (base)', COL.c5, y * scale);
  ctx.fillStyle = COL.c1; ctx.font = 'italic 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('x(t)', refX0 + 36, yM0 - mh / 2 - 14);
  ctx.fillStyle = COL.muted;
  ctx.fillText('y(t)', refX0 + 36, yB0 + pth / 2 - 14);
}

/* ======================= concept clips ======================= */

/* ---------------------------------------------------------
   Ch1 · Newton's law, live: forces on a vibrating mass
   --------------------------------------------------------- */
makeClip({
  id: 'c-fbd',
  controls: [{ key: 'z', label: 'Damping ratio ζ', min: 0, max: 0.5, step: 0.01, value: 0.1, unit: '', dec: 3 }],
  reset(st){
    st.m = 1; st.k = 40; st.x0 = 0.1;
    st.c = 2 * st.V.z * Math.sqrt(st.k * st.m);
    const rt = roots(st.m, st.c, st.k);
    st.tmax = rt.sigma < -1e-6 ? Math.min(5 / -rt.sigma, 14) : 14;
    st._lastStat = undefined;
  },
  step(st){ if (st.t > st.tmax + 1) st.t = 0; },
  draw(st){
    const cv = $('c-fbd-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 600, 250]);
    const t = Math.min(st.t, st.tmax);
    const [x, v] = lin2(t, st.m, st.c, st.k, st.x0, 0);
    const Fs = -st.k * x, Fd = -st.c * v, ma = Fs + Fd;
    const s = 1200, eq = 300, bw = 70, cx = eq + x * s, left = cx - bw / 2, fs = 30;
    hatch(ctx, 20, 20, 20, 130, 1); hatch(ctx, 20, 130, 580, 130, 1);
    springLine(ctx, 20, 88, left, 88, 9, 8);
    damperLine(ctx, 20, 113, left, 113, eq - bw / 2 - 20);
    line(ctx, eq, 64, eq, 130, COL.axis, 1, [4, 4]); txt(ctx, 'x = 0', eq, 140, { font: '11px system-ui', color: COL.muted });
    block(ctx, cx, 105, bw, 50, 0, 'm');   // resting on the floor at y = 130
    const arr = (y, F, col, lab) => {
      const L = F * fs;
      if (Math.abs(L) > 2){ if (L > 0) arrow(ctx, cx, y, cx + L, y, col, 3); else arrow(ctx, cx - L, y, cx, y, col, 3); }
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, y, 3, 0, 2 * Math.PI); ctx.fill(); }
      txt(ctx, lab, cx + (L >= 0 ? L + 8 : L - 8), y, { font: '12px system-ui', color: col, align: L >= 0 ? 'left' : 'right' });
    };
    arr(55, Fs, COL.c1, 'spring −kx');
    arr(35, Fd, COL.c4, 'damper −cẋ');
    // balance panel
    const y0 = 175, zx = 300;
    line(ctx, zx, y0 - 12, zx, y0 + 62, COL.axis, 1);
    const bar = (y, F, col, lab) => {
      ctx.fillStyle = col; ctx.globalAlpha = 0.85;
      ctx.fillRect(Math.min(zx, zx + F * fs), y - 7, Math.abs(F * fs), 14); ctx.globalAlpha = 1;
      txt(ctx, lab, 20, y, { font: '12px system-ui', color: COL.fg, align: 'left' });
      txt(ctx, fmt(F, 2) + ' N', 580, y, { font: '12px system-ui', color: COL.muted, align: 'right' });
    };
    bar(y0, Fs, COL.c1, 'Spring force −kx');
    bar(y0 + 22, Fd, COL.c4, 'Damper force −cẋ');
    bar(y0 + 50, ma, COL.c3, 'Sum = m ẍ');
    line(ctx, 150, y0 + 36, 450, y0 + 36, COL.border || COL.axis, 1);
  }
});

/* ---------------------------------------------------------
   Ch1 · Why gravity disappears
   --------------------------------------------------------- */
makeClip({
  id: 'c-gravity',
  controls: [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 20, max: 300, step: 5, value: 100, unit: 'N/m', dec: 1 },
    { key: 'g', label: 'Gravity g', min: 0, max: 25, step: 0.01, value: 9.81, unit: 'm/s²', dec: 2 }
  ],
  presets: C => [
    { label: 'No gravity', apply: () => C.set({ g: 0 }) },
    { label: 'Moon (1.62)', apply: () => C.set({ g: 1.62 }) },
    { label: 'Earth (9.81)', apply: () => C.set({ g: 9.81 }) },
    { label: 'Jupiter (24.8)', apply: () => C.set({ g: 24.79 }) }
  ],
  reset(st){
    const V = st.V; st.ok = V.m > 0 && V.k > 0; st.hist = [];
    if (!st.ok){ setStats('c-gravity-stats', [['Note', 'm and k must be positive']]); return; }
    st.wn = Math.sqrt(V.k / V.m); st.dst = V.m * V.g / V.k; st.a = 0.05;
    st.scaleD = Math.max(V.m * 25 / V.k, Math.abs(st.dst)) + st.a;   // fixed for this m, k so changing g visibly moves the mass
    setStats('c-gravity-stats', [
      ['Static stretch δ_{st} = mg/k', fmt(st.dst) + ' m', true],
      ['ωₙ = √(k/m)', fmt(st.wn) + ' rad/s', true],
      ['Period', fmt(2 * Math.PI / st.wn) + ' s'],
      ['Does the period depend on g?', 'No']
    ]);
  },
  step(st){
    if (!st.ok) return;
    st.hist.push([st.t, st.a * Math.cos(st.wn * st.t)]);
    while (st.hist.length > 2 && st.hist[0][0] < st.t - 6) st.hist.shift();
  },
  draw(st){
    const cv = $('c-gravity-anim'), pv = $('c-gravity-plot');
    if (!st.ok){ drawMessage(cv, 'Enter a positive mass and stiffness'); drawMessage(pv, ''); return; }
    const V = st.V, x = st.a * Math.cos(st.wn * st.t);
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 380, 330]);
    const top = 18, L0 = 55, s = 200 / st.scaleD, cx = 110;
    const yU = top + L0, yE = yU + st.dst * s, yM = yE + x * s;
    hatch(ctx, cx - 55, top, cx + 55, top, -1);
    springLine(ctx, cx, top, cx, yM, 10, 10);
    block(ctx, cx, yM + 22, 70, 44, 0, 'm');
    // reference lines
    const ref = (y, lab, col) => { line(ctx, cx + 40, y, 370, y, col, 1.2, [4, 4]); txt(ctx, lab, 370, y - 9, { font: '11px system-ui', color: col, align: 'right' }); };
    if (Math.abs(yE - yU) < 4) ref(yU, 'unstretched = equilibrium (no gravity)', COL.c3);
    else { ref(yU, 'spring unstretched', COL.muted); ref(yE, 'static equilibrium: x = 0', COL.c3); }
    if (Math.abs(yE - yU) > 14){
      arrow(ctx, cx - 62, yU + 8, cx - 62, yE, COL.muted, 1.2); arrow(ctx, cx - 62, yE - 8, cx - 62, yU, COL.muted, 1.2);
      txt(ctx, 'δ_{st}', cx - 76, (yU + yE) / 2, { font: 'italic 13px Georgia, serif', color: COL.muted, align: 'right' });
    }
    // forces on the mass (downward positive)
    const cy = yM + 22, fs = 55 / Math.max(V.m * Math.abs(V.g), V.k * st.a, 1e-9);
    const W = V.m * V.g, kd = V.k * st.dst, kx = -V.k * x;
    const vArrow = (X, F, col, lab, side) => {
      const L = F * fs; if (Math.abs(L) < 2) return;
      arrow(ctx, X, cy, X, cy + L, col, 2.5);
      txt(ctx, lab, X + side * 6, cy + L / 2, { font: '12px system-ui', color: col, align: side > 0 ? 'left' : 'right' });
    };
    vArrow(cx + 48, W, COL.c2, 'mg', 1);
    vArrow(cx + 62, -kd, COL.c5, 'kδ_{st}', 1);
    vArrow(cx - 48, kx, COL.c1, '−kx', -1);
    if (Math.abs(W) * fs > 2) txt(ctx, 'mg and kδ_{st} cancel', cx + 48, cy + Math.max(W * fs, 0) + 18, { font: '11px system-ui', color: COL.muted, align: 'left' });
    const t0 = Math.max(0, st.t - 6), t1 = Math.max(6, st.t);
    const lo = Math.min(-st.a, st.dst - st.a) * 1.25, hi = Math.max(st.a, st.dst + st.a) * 1.25;
    plot(pv, {
      xmin: t0, xmax: t1, ymin: lo, ymax: hi, xlabel: 'time t (s)', ylabel: 'downward position (m)',
      hlines: [{ y: st.dst, color: COL.c3 }],
      series: [{ pts: st.hist.map(p => [p[0], p[1] + st.dst]), color: COL.c2, width: 2, dash: [6, 4] }, { pts: st.hist, color: COL.c1, width: 2.2 }]
    });
  }
});

/* ---------------------------------------------------------
   Ch1 · Springs in parallel and series vs. the equivalent spring
   --------------------------------------------------------- */
makeClip({
  id: 'c-springs',
  controls: [
    { key: 'k1', label: 'Stiffness k₁', min: 10, max: 200, step: 5, value: 100, unit: 'N/m', dec: 1 },
    { key: 'k2', label: 'Stiffness k₂', min: 10, max: 200, step: 5, value: 50, unit: 'N/m', dec: 1 },
    { key: 'F', label: 'Pull force F', min: 1, max: 20, step: 0.5, value: 10, unit: 'N', dec: 2 }
  ],
  presets: (C, st, reset) => [
    { label: 'Parallel', apply: () => { st.mode = 'par'; reset(); } },
    { label: 'Series', apply: () => { st.mode = 'ser'; reset(); } }
  ],
  setup(st){ st.mode = 'par'; },
  reset(st){
    const V = st.V; st.ok = V.k1 > 0 && V.k2 > 0 && V.F > 0;
    document.querySelectorAll('#c-springs-pre .chip').forEach(b => b.classList.toggle('on', (b.textContent === 'Parallel') === (st.mode === 'par')));
    $('c-springs-why').innerHTML = st.mode === 'par'
      ? '<b>Parallel:</b> both springs are fixed to the same plate, so they <b>share the displacement</b>. Each pushes back with its own force, and the forces add: F = k₁δ + k₂δ = (k₁ + k₂)δ. The combination is <b>stiffer than either spring</b>.'
      : '<b>Series:</b> the same force passes through each spring (the joint between them is massless), so they <b>share the force</b>. Each stretches by its own amount, and the stretches add: δ = F/k₁ + F/k₂. The combination is <b>softer than either spring</b>.';
    st._lastStat = undefined;
  },
  draw(st){
    const cv = $('c-springs-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    if (!st.ok){ drawMessage(cv, 'Stiffnesses and force must be positive'); return; }
    fitView(ctx, w, h, [0, 0, 560, 330]);
    const V = st.V, F = V.F * 0.5 * (1 - Math.cos(1.1 * st.t));
    const s = 150 / (V.F * (1 / V.k1 + 1 / V.k2)), fs = 70 / V.F, wall = 30;
    const keq = st.mode === 'par' ? V.k1 + V.k2 : 1 / (1 / V.k1 + 1 / V.k2);
    const plate = (x, y0, y1) => { ctx.fillStyle = COL.spring; ctx.fillRect(x, y0, 8, y1 - y0); };
    const pull = (x, y) => { if (F * fs > 2) arrow(ctx, x + 8, y, x + 8 + F * fs, y, COL.c2, 3); txt(ctx, 'F', x + 16 + F * fs, y - 12, { color: COL.c2 }); };
    const lab = (s1, x, y) => txt(ctx, s1, x, y, { font: '12px system-ui', color: COL.muted });
    const labL = (s1, y) => txt(ctx, s1, wall + 14, y, { font: '12px system-ui', color: COL.muted, align: 'left' });
    txt(ctx, st.mode === 'par' ? 'Two springs in parallel' : 'Two springs in series', 10, 14, { font: '600 13px system-ui', align: 'left' });
    let endTop;
    if (st.mode === 'par'){
      const L0 = 120, d = F / keq, px = wall + L0 + d * s;
      hatch(ctx, wall, 45, wall, 150, 1);
      springLine(ctx, wall, 70, px, 70, 8, 8); springLine(ctx, wall, 125, px, 125, 8, 8);
      plate(px, 52, 143); pull(px, 97);
      labL(`k₁: stretch ${mm(d)}, force ${fmt(V.k1 * d, 3)} N`, 48);
      labL(`k₂: stretch ${mm(d)}, force ${fmt(V.k2 * d, 3)} N`, 154);
      line(ctx, wall + L0, 40, wall + L0, 160, COL.axis, 1, [3, 3]);
      endTop = px;
      statsEvery(st, 'c-springs-stats', () => [['k_eq = k₁ + k₂', fmt(keq) + ' N/m', true], ['Shared stretch', mm(d)], ['Forces add', `${fmt(V.k1 * d, 3)} + ${fmt(V.k2 * d, 3)} = ${fmt(F, 3)} N`]]);
    } else {
      const L0 = 85, d1 = F / V.k1, d2 = F / V.k2, n1 = wall + L0 + d1 * s, px = n1 + 14 + L0 + d2 * s;
      hatch(ctx, wall, 60, wall, 135, 1);
      springLine(ctx, wall, 97, n1, 97, 7, 8);
      ctx.fillStyle = COL.c5; ctx.fillRect(n1, 85, 14, 24);
      springLine(ctx, n1 + 14, 97, px, 97, 7, 8);
      plate(px, 70, 124); pull(px, 97);
      lab(`k₁: force ${fmt(F, 3)} N, stretch ${mm(d1)}`, (wall + n1) / 2, 66);
      lab(`k₂: force ${fmt(F, 3)} N, stretch ${mm(d2)}`, (n1 + 14 + px) / 2, 134);
      line(ctx, wall + 2 * L0 + 14, 40, wall + 2 * L0 + 14, 160, COL.axis, 1, [3, 3]);
      endTop = px;
      statsEvery(st, 'c-springs-stats', () => [['k_eq = 1/(1/k₁ + 1/k₂)', fmt(keq) + ' N/m', true], ['Shared force', fmt(F, 3) + ' N'], ['Stretches add', `${mm(d1)} + ${mm(d2)} = ${mm(d1 + d2)}`]]);
    }
    // equivalent spring
    const L0e = st.mode === 'par' ? 120 : 184, de = F / keq, pe = wall + L0e + de * s;
    txt(ctx, 'Equivalent single spring', 10, 200, { font: '600 13px system-ui', align: 'left' });
    hatch(ctx, wall, 225, wall, 300, 1);
    springLine(ctx, wall, 262, pe, 262, st.mode === 'par' ? 12 : 9, 8);
    plate(pe, 240, 285); pull(pe, 262);
    labL(`k_eq = ${fmt(keq)} N/m: stretch ${mm(de)}`, 302);
    line(ctx, endTop + 4, 160, pe + 4, 238, COL.c3, 1.2, [5, 4]);
    txt(ctx, 'same F, same motion', endTop + 14, 205, { font: '11px system-ui', color: COL.c3, align: 'left' });
  }
});

/* ---------------------------------------------------------
   Ch1 · Why small angles: sin θ vs θ
   --------------------------------------------------------- */
makeClip({
  id: 'c-lin', buttons: false,
  controls: [{ key: 'th', label: 'Angle θ', min: 0, max: 120, step: 1, value: 30, unit: '°', dec: 1 }],
  reset(st){
    const th = st.V.th * Math.PI / 180, sn = Math.sin(th);
    setStats('c-lin-stats', [
      ['θ', fmt(th, 4) + ' rad'], ['sin θ', fmt(sn, 4)],
      ['Linear model overstates the restoring moment by', Math.abs(sn) < 1e-9 ? (th === 0 ? '0 %' : '∞') : fmt((th - sn) / sn * 100, 3) + ' %', true]
    ]);
  },
  draw(st){
    const th = st.V.th * Math.PI / 180;
    const cv = $('c-lin-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 300, 260]);
    const P = [150, 30], L = 160, bx = P[0] + L * Math.sin(th), by = P[1] + L * Math.cos(th);
    hatch(ctx, 110, 30, 190, 30, -1);
    line(ctx, P[0], P[1], P[0], P[1] + L + 10, COL.axis, 1, [3, 4]);
    line(ctx, P[0], P[1], bx, by, COL.spring, 2);
    ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, 14, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    // tangential restoring "forces": exact ∝ sin θ, linear ∝ θ
    const tx = -Math.cos(th), ty = Math.sin(th), sc = 105;
    const tan = (mag, col, off, lab) => {
      const ox = bx + off * Math.sin(th), oy = by + off * Math.cos(th), L2 = mag * sc;
      if (L2 > 2) arrow(ctx, ox, oy, ox + tx * L2, oy + ty * L2, col, 2.6);
      txt(ctx, lab, ox + tx * L2 - 6, oy + ty * L2 + (off > 0 ? 14 : -10), { font: '12px system-ui', color: col, align: 'right' });
    };
    tan(Math.sin(th), COL.c1, 18, 'exact ∝ sin θ');
    tan(th, COL.c2, -18, 'linear ∝ θ');
    txt(ctx, `θ = ${fmt(st.V.th)}°`, P[0] + 30, P[1] + 40, { font: 'italic 14px Georgia, serif', color: COL.muted, align: 'left' });
    const pts1 = [], pts2 = [];
    for (let i = 0; i <= 120; i++){ const a = i * Math.PI / 180; pts1.push([i, a]); pts2.push([i, Math.sin(a)]); }
    plot($('c-lin-plot'), {
      xmin: 0, xmax: 120, ymin: 0, ymax: 2.2, xlabel: 'angle θ (degrees)', ylabel: 'restoring term',
      vlines: [{ x: st.V.th, color: COL.axis }],
      series: [{ pts: pts1, color: COL.c2, width: 2.2 }, { pts: pts2, color: COL.c1, width: 2.2 }],
      points: [{ x: st.V.th, y: th, color: COL.c2 }, { x: st.V.th, y: Math.sin(th), color: COL.c1 }]
    });
  }
});

/* ---------------------------------------------------------
   Ch2 · Circles make sines (rotating vector)
   --------------------------------------------------------- */
makeClip({
  id: 'c-phasor',
  controls: [
    { key: 'x0', label: 'Initial x₀', min: -0.2, max: 0.2, step: 0.01, value: 0.08, unit: 'm', dec: 3 },
    { key: 'v0', label: 'Initial v₀', min: -1, max: 1, step: 0.05, value: 0.3, unit: 'm/s', dec: 2 },
    { key: 'wn', label: 'Natural freq. ωₙ', min: 1, max: 8, step: 0.1, value: 2.5, unit: 'rad/s', dec: 2 }
  ],
  reset(st){
    const V = st.V; st.ok = V.wn > 0;
    if (!st.ok){ setStats('c-phasor-stats', [['Note', 'ωₙ must be positive']]); return; }
    st.B = V.v0 / V.wn; st.X = Math.hypot(V.x0, st.B); st.phi = Math.atan2(st.B, V.x0);
    setStats('c-phasor-stats', [['A = x₀', fmt(V.x0) + ' m'], ['B = v₀/ωₙ', fmt(st.B) + ' m'], ['X = √(A² + B²)', fmt(st.X) + ' m', true], ['φ = atan2(B, A)', fmt(st.phi * 180 / Math.PI) + '°', true], ['Period', fmt(2 * Math.PI / V.wn) + ' s']]);
  },
  draw(st){
    const cv = $('c-phasor-anim');
    if (!st.ok){ drawMessage(cv, 'ωₙ must be positive'); return; }
    if (!(st.X > 0)){ drawMessage(cv, 'With x₀ = 0 and v₀ = 0 there is nothing to rotate: give it a displacement or a velocity'); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 260]);
    const V = st.V, cx = 130, cy = 130, R = 95, k = R / st.X;
    const al = V.wn * st.t - st.phi, tipX = cx - R * Math.sin(al), tipY = cy - R * Math.cos(al);
    ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, cx - R - 10, cy, 625, cy, COL.axis, 1); line(ctx, cx, cy - R - 10, cx, cy + R + 10, COL.axis, 1);
    // initial-condition components
    const ix = cx + st.B * k, iy = cy - V.x0 * k;
    line(ctx, cx, cy, cx, iy, COL.c5, 1.5, [3, 3]); line(ctx, cx, iy, ix, iy, COL.c5, 1.5, [3, 3]);
    txt(ctx, 'x₀', cx + 12, (cy + iy) / 2, { font: '12px system-ui', color: COL.muted, align: 'left' });
    txt(ctx, 'v₀/ωₙ', (cx + ix) / 2, iy - 10, { font: '12px system-ui', color: COL.muted });
    // rotating vector and projection
    arrow(ctx, cx, cy, tipX, tipY, COL.accent || COL.c1, 3);
    { const L = Math.hypot(tipX - cx, tipY - cy) || 1, nx = (tipY - cy) / L, ny = -(tipX - cx) / L;   // offset perpendicular to the phasor
      txt(ctx, 'X', (cx + tipX) / 2 + 13 * nx, (cy + tipY) / 2 + 13 * ny, { font: 'italic 15px Georgia, serif', color: COL.c1 }); }
    const x0px = 270, Tw = 2 * 2 * Math.PI / V.wn, pps = (625 - x0px) / Tw;
    line(ctx, tipX, tipY, x0px, tipY, COL.c2, 1.3, [4, 3]);
    ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.save(); ctx.strokeStyle = COL.c1; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 220; i++){
      const tau = Tw * i / 220, tt = st.t - tau; if (tt < 0) break;
      const y = cy - st.X * Math.cos(V.wn * tt - st.phi) * k, X = x0px + tau * pps;
      if (i === 0) ctx.moveTo(X, y); else ctx.lineTo(X, y);
    }
    ctx.stroke(); ctx.restore();
    ctx.fillStyle = COL.c1; ctx.beginPath(); ctx.arc(x0px, tipY, 4.5, 0, 2 * Math.PI); ctx.fill();
    txt(ctx, 'x(t) = X cos(ωₙt − φ)', 450, 18, { font: 'italic 14px Georgia, serif', color: COL.fg });
    txt(ctx, '← now        earlier →', 330, 250, { font: '11px system-ui', color: COL.muted });
  }
});

/* ---------------------------------------------------------
   Ch2 · Oscillator race: m, 4m, 4k
   --------------------------------------------------------- */
makeClip({
  id: 'c-race',
  controls: [
    { key: 'm', label: 'Base mass m', min: 0.2, max: 4, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Base stiffness k', min: 5, max: 200, step: 5, value: 20, unit: 'N/m', dec: 1 }
  ],
  reset(st){ st.ok = st.V.m > 0 && st.V.k > 0; },
  draw(st){
    const cv = $('c-race-anim');
    if (!st.ok){ drawMessage(cv, 'Mass and stiffness must be positive'); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 620, 270]);
    const V = st.V;
    const lanes = [
      { m: V.m, k: V.k, lab: 'm, k', note: 'baseline' },
      { m: 4 * V.m, k: V.k, lab: '4m, k', note: '½ the frequency' },
      { m: V.m, k: 4 * V.k, lab: 'm, 4k', note: '2× the frequency' }
    ];
    lanes.forEach((L, i) => {
      const y = 50 + i * 85, wn = Math.sqrt(L.k / L.m), x = 0.1 * Math.cos(wn * st.t);
      const eq = 330, bw = i === 1 ? 64 : 44, cx = eq + x * 900;
      txt(ctx, L.lab, 10, y - 8, { font: 'italic 15px Georgia, serif', align: 'left' });
      txt(ctx, `T = ${fmt(2 * Math.PI / wn)} s`, 10, y + 12, { font: '12px system-ui', color: COL.muted, align: 'left' });
      hatch(ctx, 120, y - 22, 120, y + 22, 1); hatch(ctx, 120, y + 22, 520, y + 22, 1);
      springLine(ctx, 120, y, cx - bw / 2, y, 8, i === 2 ? 6 : 8);
      line(ctx, eq, y - 26, eq, y + 22, COL.axis, 1, [3, 3]);
      block(ctx, cx, y + 4, bw, 36, 0, '');   // resting on the floor at y + 22
      txt(ctx, `cycles: ${Math.floor(wn * st.t / (2 * Math.PI))}`, 610, y - 8, { font: '600 13px system-ui', align: 'right' });
      txt(ctx, L.note, 610, y + 12, { font: '12px system-ui', color: COL.muted, align: 'right' });
    });
  }
});

/* ---------------------------------------------------------
   Ch3 · Roots in the complex plane
   --------------------------------------------------------- */
makeClip({
  id: 'c-splane',
  controls: [{ key: 'z', label: 'Damping ratio ζ', min: 0, max: 2, step: 0.01, value: 0.3, unit: '', dec: 3 }],
  presets: C => [
    { label: 'ζ = 0', apply: () => C.set({ z: 0 }) }, { label: 'ζ = 0.2', apply: () => C.set({ z: 0.2 }) },
    { label: 'ζ = 1', apply: () => C.set({ z: 1 }) }, { label: 'ζ = 2', apply: () => C.set({ z: 2 }) }
  ],
  reset(){},
  draw(st){
    const sweep = $('c-splane-sweep') && $('c-splane-sweep').checked;
    const z = sweep ? 1 - Math.cos(0.35 * st.t) : st.V.z;
    let r1, r2;
    if (Math.abs(z) < 1){ const b = Math.sqrt(1 - z * z); r1 = [-z, b]; r2 = [-z, -b]; }
    else { const q = Math.sqrt(z * z - 1); r1 = [-z + q, 0]; r2 = [-z - q, 0]; }
    const circ = []; for (let i = 0; i <= 120; i++){ const a = i / 120 * 2 * Math.PI; circ.push([Math.cos(a), Math.sin(a)]); }
    plot($('c-splane-plot'), {
      xmin: -4.2, xmax: 1, ymin: -1.5, ymax: 1.5, xzero: true, xlabel: 'real part (decay rate, ×ωₙ)', ylabel: 'imag. part (×ωₙ)',
      bands: [{ x0: 0, x1: 1, color: 'rgba(198,40,40,.08)' }],
      series: [{ pts: circ, color: COL.axis, width: 1, dash: [4, 4] }],
      points: [{ x: r1[0], y: r1[1], color: COL.c2, r: 7 }, { x: r2[0], y: r2[1], color: COL.c2, r: 7 }]
    });
    const pts = []; let mx = 1.1;
    for (let i = 0; i <= 400; i++){ const tau = 20 * i / 400, x = lin2(tau, 1, 2 * z, 1, 1, 0)[0]; pts.push([tau, x]); if (isFinite(x)) mx = Math.max(mx, Math.min(Math.abs(x) * 1.05, 20)); }
    plot($('c-splane-resp'), { xmin: 0, xmax: 20, ymin: -mx, ymax: mx, xlabel: 'ωₙ t', ylabel: 'x / x₀', series: [{ pts, color: COL.c1, width: 2.2 }] });
    const reg = z < 0 ? 'unstable (roots in the right half)' : z === 0 ? 'undamped (roots on the imaginary axis)' : z < 1 ? 'underdamped (complex pair on the circle)' : Math.abs(z - 1) < 0.005 ? 'critically damped (double real root)' : 'overdamped (two real roots)';
    const fr = r => (Math.abs(r[1]) < 1e-9 ? fmt(r[0], 3) : `${fmt(r[0], 3)} ${r[1] >= 0 ? '+' : '−'} ${fmt(Math.abs(r[1]), 3)}i`);
    statsEvery(st, 'c-splane-stats', () => [['ζ', fmt(z, 3), true], ['Roots s/ωₙ', fr(r1) + ',  ' + fr(r2)], ['Behavior', reg, true]], 0.1);
  }
});

/* ---------------------------------------------------------
   Ch3 · Where does the energy go?
   --------------------------------------------------------- */
makeClip({
  id: 'c-heat',
  controls: [{ key: 'z', label: 'Damping ratio ζ', min: 0, max: 0.5, step: 0.01, value: 0.08, unit: '', dec: 3 }],
  reset(st){
    st.m = 1; st.k = 40; st.x0 = 0.1; st.c = 2 * st.V.z * Math.sqrt(st.k * st.m); st.E0 = 0.5 * st.k * st.x0 * st.x0;
    const rt = roots(st.m, st.c, st.k);
    st.tmax = rt.sigma < -1e-6 ? Math.min(4 / -rt.sigma, 20) : 12; st.hist = [];
  },
  step(st){
    if (st.t > st.tmax + 1.2){ st.t = 0; st.hist = []; return; }
    const t = Math.min(st.t, st.tmax), [x, v] = lin2(t, st.m, st.c, st.k, st.x0, 0);
    const E = 0.5 * st.m * v * v + 0.5 * st.k * x * x;
    if (st.t <= st.tmax) st.hist.push([t, E / st.E0, 1 - E / st.E0]);
  },
  draw(st){
    const t = Math.min(st.t, st.tmax), [x, v] = lin2(t, st.m, st.c, st.k, st.x0, 0);
    drawSMD($('c-heat-anim'), { x, amp: st.x0, damper: true });
    const KE = 0.5 * st.m * v * v / st.E0, PE = 0.5 * st.k * x * x / st.E0, Q = Math.max(0, 1 - KE - PE);
    const cv = $('c-heat-bar'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    const nar = w < 500, x0 = nar ? 8 : 120, W = w - x0 - 16, y = 14, hh = 26;
    const segs = [[KE, COL.c2, 'kinetic'], [PE, COL.c1, 'spring'], [Q, HEAT, 'heat in damper']];
    let xx = x0;
    segs.forEach(([f, col]) => { ctx.fillStyle = col; ctx.fillRect(xx, y, Math.max(0, f) * W, hh); xx += Math.max(0, f) * W; });
    ctx.strokeStyle = COL.axis; ctx.strokeRect(x0, y, W, hh);
    ctx.fillStyle = COL.fg; ctx.font = '600 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; if (!nar) ctx.fillText('Initial energy', 8, y + hh / 2);
    // on phones the legend uses short names and divides the width into three equal columns
    ctx.font = nar ? '11px system-ui' : '12px system-ui'; let lx = x0; const step = nar ? (w - 16) / 3 : 150;
    segs.forEach(([f, col, lab]) => { ctx.fillStyle = col; ctx.fillRect(lx, y + hh + 10, 10, 10); ctx.fillStyle = COL.muted; ctx.fillText(`${nar ? lab.replace('heat in damper', 'heat') : lab} ${Math.round(f * 100)}%`, lx + 14, y + hh + 15); lx += step; });
    plot($('c-heat-plot'), {
      xmin: 0, xmax: st.tmax, ymin: 0, ymax: 1.05, xlabel: 'time t (s)', ylabel: 'fraction of initial energy',
      series: [{ pts: st.hist.map(p => [p[0], p[1]]), color: COL.c1, width: 2.2 }, { pts: st.hist.map(p => [p[0], p[2]]), color: HEAT, width: 2.2 }]
    });
  }
});

/* ---------------------------------------------------------
   Ch4 · Force balance phasors
   --------------------------------------------------------- */
makeClip({
  id: 'c-phasors',
  controls: [
    { key: 'r', label: 'Frequency ratio r', min: 0, max: 3, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'z', label: 'Damping ratio ζ', min: 0.02, max: 1, step: 0.01, value: 0.2, unit: '', dec: 3 }
  ],
  presets: C => [
    { label: 'Below resonance (r = 0.5)', apply: () => C.set({ r: 0.5 }) },
    { label: 'At resonance (r = 1)', apply: () => C.set({ r: 1 }) },
    { label: 'Above resonance (r = 2)', apply: () => C.set({ r: 2 }) }
  ],
  reset(st){
    const r = Math.abs(st.V.r), z = st.V.z, D = Math.hypot(1 - r * r, 2 * z * r);
    st.ok = D > 0;
    if (!st.ok){ $('c-phasors-why').textContent = 'With ζ = 0 at r = 1 there is no steady state: nothing can balance the force.'; return; }
    st.X = 1 / D; st.phi = Math.atan2(2 * z * r, 1 - r * r); st.r = r; st.z = z;
    $('c-phasors-why').innerHTML = r < 0.9
      ? '<b>Below resonance:</b> the spring force is the big arrow. It almost balances F on its own, so the displacement stays nearly in step with the force (small lag).'
      : r <= 1.1
        ? '<b>Near resonance:</b> the spring and inertia arrows are nearly equal and opposite, so they cancel. Only the damper is left to balance F, which forces a <b>90° lag</b> and a large amplitude (1/2ζ).'
        : '<b>Above resonance:</b> the inertia arrow dominates. To balance F it must point along F, so the displacement points the <b>opposite way</b> (lag near 180°).';
    setStats('c-phasors-stats', [['X / δ_{st}', fmt(st.X), true], ['Phase lag φ', fmt(st.phi * 180 / Math.PI) + '°', true], ['Spring kX', fmt(st.X) + ' F₀'], ['Damper cωX', fmt(2 * z * r * st.X) + ' F₀'], ['Inertia mω²X', fmt(r * r * st.X) + ' F₀']]);
  },
  draw(st){
    const cv = $('c-phasors-anim');
    if (!st.ok){ drawMessage(cv, 'No steady state at undamped resonance'); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 640, 300]);
    const O = [190, 150], X = st.X, r = st.r, z = st.z;
    const sc = 135 / Math.max(1, X * Math.hypot(1, 2 * z * r), X * r * r);
    const Th = 0.5 * st.t, ax = Th - st.phi;
    const P = (p, mag, ang) => [p[0] + mag * sc * Math.cos(ang), p[1] - mag * sc * Math.sin(ang)];
    line(ctx, O[0] - 170, O[1], O[0] + 170, O[1], COL.axis, 1); line(ctx, O[0], O[1] - 145, O[0], O[1] + 145, COL.axis, 1);
    const dx = P(O, 140 / sc, ax);
    line(ctx, O[0], O[1], dx[0], dx[1], COL.c5, 1, [5, 4]);
    txt(ctx, 'x direction', dx[0], dx[1] - 10, { font: '11px system-ui', color: COL.muted });
    const P1 = P(O, X, ax), P2 = P(P1, 2 * z * r * X, ax + Math.PI / 2), P3 = P(P2, r * r * X, ax + Math.PI);
    const seg = (a, b, col, wd) => { if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 3) arrow(ctx, a[0], a[1], b[0], b[1], col, wd); };
    seg(O, P1, COL.c1, 3); seg(P1, P2, COL.c4, 3); seg(P2, P3, COL.c3, 3);
    const PF = P(O, 1, Th); seg(O, PF, COL.c2, 4);
    // legend
    const items = [[COL.c2, 'applied force F₀'], [COL.c1, 'spring  kX  (along x)'], [COL.c4, 'damper  cωX  (90° ahead of x)'], [COL.c3, 'inertia  mω²X  (opposite x)']];
    items.forEach(([c, s1], i) => { ctx.fillStyle = c; ctx.fillRect(420, 40 + i * 28, 22, 5); txt(ctx, s1, 450, 42 + i * 28, { font: '13px system-ui', align: 'left' }); });
    txt(ctx, 'The three arrows always add up to F₀', 420, 175, { font: '12px system-ui', color: COL.muted, align: 'left' });
    txt(ctx, `lag of x behind F: ${fmt(st.phi * 180 / Math.PI)}°`, 420, 200, { font: '600 13px system-ui', align: 'left' });
  }
});

/* ---------------------------------------------------------
   Ch4 · Sweeping through resonance
   --------------------------------------------------------- */
makeClip({
  id: 'c-sweep', speed: 1,
  controls: [
    { key: 'z', label: 'Damping ratio ζ', min: 0.02, max: 0.5, step: 0.01, value: 0.1, unit: '', dec: 3 },
    { key: 'T', label: 'Sweep duration', min: 3, max: 180, step: 1, value: 30, unit: 's', dec: 1 }
  ],
  presets: C => [{ label: 'Slow sweep (90 s)', apply: () => C.set({ T: 90 }) }, { label: 'Fast sweep (6 s)', apply: () => C.set({ T: 6 }) }],
  reset(st){
    const z = st.V.z, T = st.V.T;
    st.wn = 6; st.r0 = 0.5; st.r1 = 1.5; st.sim = 0; st.hist = []; st.nextRec = 0; st.peak = 0;
    st.ok = T > 0 && z >= 0;
    if (!st.ok) return;
    // start already in the steady state at r0, so there is no start-up transient
    const r = st.r0, M0 = 1 / Math.hypot(1 - r * r, 2 * z * r), ph = Math.atan2(2 * z * r, 1 - r * r);
    st.s = [M0 * Math.cos(-ph), -M0 * r * st.wn * Math.sin(-ph), 0];   // [x, v, phase ψ]
    st.tau = z > 0 ? 1 / (z * st.wn) : Infinity;                     // build-up time
    st.band = 2 * z * T / (st.r1 - st.r0);                           // time spent crossing the resonance band
  },
  step(st, dt){
    if (!st.ok) return;
    const T = st.V.T;
    if (st.sim >= T){ if (st.t > T + 1.5) st.reset(); return; }
    const z = st.V.z, wn = st.wn, r0 = st.r0, r1 = st.r1;
    const f = (tt, s) => [s[1], wn * wn * (Math.cos(s[2]) - s[0]) - 2 * z * wn * s[1], wn * (r0 + (r1 - r0) * tt / T)];
    const span = Math.min(dt, T - st.sim), n = Math.max(1, Math.ceil(span / 0.002)), h = span / n;
    for (let i = 0; i < n; i++){
      st.s = rk4(f, st.sim, st.s, h); st.sim += h;
      st.peak = Math.max(st.peak, Math.abs(st.s[0]));
      if (st.sim >= st.nextRec){ st.hist.push([r0 + (r1 - r0) * st.sim / T, st.s[0]]); st.nextRec += 0.01; }
    }
  },
  setup(st, reset){ st.reset = reset; },
  draw(st){
    if (!st.ok){ drawMessage($('c-sweep-anim'), 'Check the values'); return; }
    const z = st.V.z, Mp = z > 0 && z < Math.SQRT1_2 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1;
    const Y = Math.min(Math.max(Mp, 1.2) * 1.15, 30);
    const rNow = st.r0 + (st.r1 - st.r0) * Math.min(st.sim / st.V.T, 1);
    drawSMD($('c-sweep-anim'), { x: st.s[0], amp: Y / 1.15, damper: true, force: Math.cos(st.s[2]), forceScale: 45 });
    const env = [], envN = [];
    for (let i = 0; i <= 300; i++){ const r = st.r0 + (st.r1 - st.r0) * i / 300, M = 1 / Math.hypot(1 - r * r, 2 * z * r); env.push([r, M]); envN.push([r, -M]); }
    plot($('c-sweep-plot'), {
      xmin: st.r0, xmax: st.r1, ymin: -Y, ymax: Y, xlabel: 'current frequency ratio r = ω/ωₙ', ylabel: 'x / δₛₜ',
      vlines: [{ x: 1, color: COL.axis }, { x: rNow, color: COL.c2 }],
      series: [{ pts: env, color: COL.c2, width: 1.5, dash: [5, 4] }, { pts: envN, color: COL.c2, width: 1.5, dash: [5, 4] }, { pts: st.hist, color: COL.c1, width: 1.2 }]
    });
    const verdict = st.band > 5 * st.tau ? 'slow: follows the steady-state curve' : st.band > st.tau ? 'moderate: lags a little' : 'fast: no time to build up';
    statsEvery(st, 'c-sweep-stats', () => [
      ['Current r', fmt(rNow, 3), true],
      ['Build-up time 1/(ζωₙ)', fmt(st.tau) + ' s'],
      ['Time spent crossing resonance', fmt(st.band) + ' s'],
      ['This sweep is', verdict, true],
      ['Largest response so far', fmt(st.peak) + ' δ_{st} (' + fmt(st.peak / Mp * 100, 3) + '% of steady peak)']
    ]);
  }
});

/* ---------------------------------------------------------
   Ch5 · Force transmitted to the floor
   --------------------------------------------------------- */
makeClip({
  id: 'c-floor',
  controls: [
    { key: 'r', label: 'Frequency ratio r', min: 0.1, max: 4, step: 0.01, value: 0.3, unit: '', dec: 3 },
    { key: 'z', label: 'Damping ratio ζ', min: 0.02, max: 1, step: 0.01, value: 0.1, unit: '', dec: 3 }
  ],
  presets: C => [
    { label: 'Stiff mounts (r = 0.3)', apply: () => C.set({ r: 0.3 }) },
    { label: 'Resonance (r = 1)', apply: () => C.set({ r: 1 }) },
    { label: 'Soft mounts (r = 3)', apply: () => C.set({ r: 3 }) }
  ],
  reset(st){
    const r = Math.abs(st.V.r), z = st.V.z, D = Math.hypot(1 - r * r, 2 * z * r);
    st.ok = D > 0; st.hist = [];
    if (!st.ok) return;
    st.r = r; st.z = z; st.M = 1 / D; st.phi = Math.atan2(2 * z * r, 1 - r * r);
    st.TR = Math.hypot(1, 2 * z * r) / D; st.w = 3 * r;
    setStats('c-floor-stats', [['Machine amplitude X / (F₀/k)', fmt(st.M)], ['Force on floor / F₀ = TR', fmt(st.TR), true], ['Floor feels', fmt(st.TR * 100) + ' % of the shaking force', true]]);
  },
  step(st){
    if (!st.ok) return;
    const th = st.w * st.t - st.phi;
    st.hist.push([st.t, Math.sin(st.w * st.t), st.M * (Math.sin(th) + 2 * st.z * st.r * Math.cos(th))]);
    const W = 3 * 2 * Math.PI / Math.max(st.w, 0.3);
    while (st.hist.length > 2 && st.hist[0][0] < st.t - W) st.hist.shift();
  },
  draw(st){
    const cv = $('c-floor-anim'), pv = $('c-floor-plot');
    if (!st.ok){ drawMessage(cv, 'No steady state at undamped resonance'); drawMessage(pv, ''); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 420, 320]);
    const th = st.w * st.t - st.phi, x = st.M * Math.sin(th), FT = st.M * (Math.sin(th) + 2 * st.z * st.r * Math.cos(th)), F = Math.sin(st.w * st.t);
    const s = 34 / Math.max(st.M, 0.4), floor = 240, mb = 160 - x * s, cx = 170;
    hatch(ctx, 40, floor, 300, floor, 1);
    springLine(ctx, cx - 45, floor, cx - 45, mb, 7, 9);
    damperLine(ctx, cx + 45, floor, cx + 45, mb, 80);
    block(ctx, cx, mb - 32, 150, 64, 0, '');
    // harmonic shaker inside the machine: force of fixed amplitude F0 sin ωt (not a rotating imbalance, see Section 5b)
    ctx.save(); ctx.strokeStyle = COL.c2; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 60; i++){ const u = i / 60, X = cx - 45 + 90 * u, Y = mb - 32 - 12 * Math.sin(2 * Math.PI * 1.5 * u + st.w * st.t); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
    ctx.stroke(); ctx.restore();
    txt(ctx, 'machine: F₀ sin ωt (fixed amplitude)', cx, mb - 50 - 32, { font: '12px system-ui', color: COL.muted });
    // applied force (up positive) and floor force
    const fs = 50, Fl = F * fs, Tl = clamp(FT * fs, -150, 150);
    if (Math.abs(Fl) > 2) arrow(ctx, 340, 110, 340, 110 - Fl, COL.c2, 3);
    txt(ctx, 'shaking force', 340, 40, { font: '12px system-ui', color: COL.c2 });
    // force the mounts exert on the floor = +(kx + c xdot), up positive: up when the machine is above equilibrium
    const L = Math.abs(Tl) * 0.45;
    if (L > 2){ if (Tl > 0) arrow(ctx, cx, floor + 8 + L, cx, floor + 8, HEAT, 4); else arrow(ctx, cx, floor + 8, cx, floor + 8 + L, HEAT, 4); }
    txt(ctx, 'force on floor (↑ pulled up, ↓ pushed down)', cx + 18, floor + 30, { font: '12px system-ui', color: HEAT, align: 'left' });
    const W = 3 * 2 * Math.PI / Math.max(st.w, 0.3), t0 = Math.max(0, st.t - W), t1 = Math.max(W, st.t), Y = Math.max(1, st.TR) * 1.2;
    plot(pv, {
      xmin: t0, xmax: t1, ymin: -Y, ymax: Y, xlabel: 'time t (s)', ylabel: 'force / F₀',
      series: [{ pts: st.hist.map(p => [p[0], p[1]]), color: COL.c2, width: 2 }, { pts: st.hist.map(p => [p[0], p[2]]), color: HEAT, width: 2.4 }]
    });
  }
});


/* =========================================================
   More concept clips (uses makeClip from concepts.js)
   ========================================================= */

/* ---------------------------------------------------------
   Ch1 · Which way do spring and dashpot forces point?
   --------------------------------------------------------- */
makeClip({
  id: 'c-signs',
  reset(st){
    st.m = 1; st.k = 40; st.c = 1.6; st.x0 = 0.1;
    st.wn = Math.sqrt(st.k / st.m); st.tmax = 14;
  },
  step(st){ if (st.t > st.tmax) st.t = 0; },
  draw(st){
    const cv = $('c-signs-anim'); const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 660, 300]);
    const [x, v] = lin2(st.t, st.m, st.c, st.k, st.x0, 0);
    const Fs = -st.k * x, Fd = -st.c * v;
    const eq = 250, s = 900, bw = 70, cx = eq + x * s, left = cx - bw / 2;
    hatch(ctx, 20, 30, 20, 175, 1); hatch(ctx, 20, 175, 400, 175, 1);
    springLine(ctx, 20, 105, left, 105, 9, 8);
    damperLine(ctx, 20, 150, left, 150, eq - bw / 2 - 20);
    line(ctx, eq, 70, eq, 175, COL.axis, 1, [4, 4]); txt(ctx, 'x = 0', eq, 190, { font: '11px system-ui', color: COL.muted });
    block(ctx, cx, 135, bw, 80, 0, 'm');   // resting on the floor at y = 175; spring (y = 105) and damper (y = 150) meet its face
    txt(ctx, 'What the forces really do', 200, 16, { font: '600 13px system-ui' });
    const fs1 = 75 / (st.k * st.x0), fs2 = 75 / (st.c * st.x0 * st.wn);
    const real = (y, F, sc, col, words) => {
      const L = F * sc;
      if (Math.abs(L) > 2){ if (L > 0) arrow(ctx, cx, y, cx + L, y, col, 3); else arrow(ctx, cx - L, y, cx, y, col, 3); }
      txt(ctx, words, cx + (L >= 0 ? Math.max(L, 0) + 8 : L - 8), y, { font: '12px system-ui', color: col, align: L >= 0 ? 'left' : 'right' });
    };
    const sw = x > 1e-4 ? 'stretched: pulls' : x < -1e-4 ? 'compressed: pushes' : 'unstretched';
    const dw = v > 1e-3 ? 'lengthening: pulls' : v < -1e-3 ? 'shortening: pushes' : 'at rest';
    real(62, Fs, fs1, COL.c1, 'spring ' + sw);
    real(40, Fd, fs2, COL.c4, 'dashpot ' + dw);
    // FBD drawn once, for x > 0 and xdot > 0
    line(ctx, 430, 20, 430, 285, COL.border || COL.axis, 1);
    txt(ctx, 'FBD drawn once (x > 0, ẋ > 0)', 545, 16, { font: '600 13px system-ui' });
    block(ctx, 575, 100, 70, 64, 0, 'm');
    arrow(ctx, 540, 85, 470, 85, COL.c1, 3); txt(ctx, 'kx', 462, 78, { color: COL.c1, align: 'right' });
    arrow(ctx, 540, 115, 470, 115, COL.c4, 3); txt(ctx, 'cẋ', 462, 122, { color: COL.c4, align: 'right' });
    const say = (y, val, sym, col) => {
      const sgn = val >= 0 ? 'positive' : 'negative';
      txt(ctx, `${sym} = ${fmt(val, 2)} N  (${sgn})`, 445, y, { font: '12.5px system-ui', color: col, align: 'left' });
      txt(ctx, val >= 0 ? '→ acts left, as drawn' : '→ the math flips it: acts right', 445, y + 17, { font: '12px system-ui', color: COL.muted, align: 'left' });
    };
    say(185, st.k * x, 'kx', COL.c1);
    say(235, st.c * v, 'cẋ', COL.c4);
  }
});

/* ---------------------------------------------------------
   Ch3 · Same standard form, same motion
   --------------------------------------------------------- */
makeClip({
  id: 'c-same',
  controls: [
    { key: 'z', label: 'Damping ratio ζ', min: 0, max: 0.9, step: 0.01, value: 0.15, unit: '', dec: 3 },
    { key: 'wn', label: 'Natural freq. ωₙ', min: 2, max: 12, step: 0.1, value: 6, unit: 'rad/s', dec: 2 }
  ],
  reset(st){
    const z = st.V.z, wn = st.V.wn;
    st.ok = wn > 0 && z >= 0 && z < 1;
    if (!st.ok){ setStats('c-same-stats', [['Note', 'use 0 ≤ ζ < 1 and ωₙ > 0 for this clip']]); return; }
    st.tmax = z > 0 ? Math.min(5 / (z * wn), 14) : 10;
    // three physically different systems, each tuned to the same ζ and ωₙ
    st.sys = [
      { name: 'Block', meq: 2, mlabel: 'm = 2 kg' },
      { name: 'Rolling disk', meq: 1.5 * 4, mlabel: 'm = 4 kg, M_eq = 3m/2 = 6 kg' },
      { name: 'Heavy block, two springs', meq: 8, mlabel: 'm = 8 kg, k split in two' }
    ].map(s => Object.assign(s, { k: wn * wn * s.meq, c: 2 * z * wn * s.meq }));
    setStats('c-same-stats', [['ζ', fmt(z, 3), true], ['ωₙ', fmt(wn) + ' rad/s', true], ['All three obey', 'ẍ + 2ζωₙẋ + ωₙ²x = 0']]);
  },
  step(st){ if (st.ok && st.t > st.tmax + 1) st.t = 0; },
  draw(st){
    const cv = $('c-same-anim');
    if (!st.ok){ drawMessage(cv, 'Use 0 ≤ ζ < 1 and ωₙ > 0'); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 680, 300]);
    const t = Math.min(st.t, st.tmax), x = lin2(t, 1, 2 * st.V.z * st.V.wn, st.V.wn * st.V.wn, 0.1, 0)[0];
    st.sys.forEach((S, i) => {
      const y = 55 + i * 92, eq = 360, d = x * 800;
      txt(ctx, S.name, 10, y - 22, { font: '600 13px system-ui', align: 'left' });
      txt(ctx, S.mlabel, 10, y - 4, { font: '12px system-ui', color: COL.muted, align: 'left' });
      txt(ctx, `k = ${fmt(S.k)} N/m`, 10, y + 13, { font: '12px system-ui', color: COL.muted, align: 'left' });
      txt(ctx, `c = ${fmt(S.c)} N·s/m`, 10, y + 30, { font: '12px system-ui', color: COL.muted, align: 'left' });
      hatch(ctx, 200, y - 30, 200, y + 32, 1); hatch(ctx, 200, y + 32, 560, y + 32, 1);
      line(ctx, eq, y - 34, eq, y + 32, COL.axis, 1, [3, 3]);
      if (i === 1){
        const R = 30, cx = eq + d, cy = y + 2;
        springLine(ctx, 200, y - 8, cx - R - 4, y - 8, 8, 7); damperLine(ctx, 200, y + 14, cx - R - 4, y + 14, eq - R - 4 - 200);
        line(ctx, cx - R - 4, y - 8, cx, cy, COL.spring, 2); line(ctx, cx - R - 4, y + 14, cx, cy, COL.spring, 2);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(d / R);
        ctx.fillStyle = COL.mass; ctx.strokeStyle = COL.massEdge; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.restore();
      } else {
        const bw = i === 2 ? 76 : 50, cx = eq + d;
        if (i === 2){ springLine(ctx, 200, y - 14, cx - bw / 2, y - 14, 7, 6); springLine(ctx, 200, y + 2, cx - bw / 2, y + 2, 7, 6); }
        else springLine(ctx, 200, y - 8, cx - bw / 2, y - 8, 8, 7);
        damperLine(ctx, 200, y + 18, cx - bw / 2, y + 18, eq - bw / 2 - 200);
        block(ctx, cx, i === 2 ? y + 4 : y + 10, bw, i === 2 ? 56 : 44, 0, '');   // resting on the floor at y + 32
      }
    });
    txt(ctx, 'same ζ and ωₙ, released from the same x₀', 670, 290, { font: '12px system-ui', color: COL.muted, align: 'right' });
  }
});

/* ---------------------------------------------------------
   Ch4 · Undamped forced response: the sign of A
   --------------------------------------------------------- */
makeClip({
  id: 'c-undamped',
  controls: [{ key: 'r', label: 'Frequency ratio r', min: 0, max: 3, step: 0.01, value: 0.6, unit: '', dec: 4 }],
  presets: C => [
    { label: 'r = 0.6', apply: () => C.set({ r: 0.6 }) },
    { label: 'Jump to the mirror frequency', apply: () => { const r = C.v.r; if (r < Math.SQRT2 && Math.abs(r - 1) > 1e-6) C.set({ r: parseFloat(Math.sqrt(2 - r * r).toFixed(4)) }); } },
    { label: 'r = 2', apply: () => C.set({ r: 2 }) }
  ],
  reset(st){
    const r = Math.abs(st.V.r); st.r = r; st.ok = Math.abs(1 - r * r) > 1e-9;
    st.A = st.ok ? 1 / (1 - r * r) : Infinity; st.w = 3 * r;
    const mir = r < Math.SQRT2 && st.ok ? Math.sqrt(2 - r * r) : null;
    setStats('c-undamped-stats', [
      ['A / (F₀/K)', st.ok ? fmt(st.A) : '∞', true],
      ['Response', !st.ok ? 'resonance: grows without bound' : r === 0 ? 'static deflection' : st.A > 0 ? 'in phase with the force' : '180° out of phase', true],
      ['Mirror frequency (same |A|, opposite sign)', mir !== null && Math.abs(mir - r) > 1e-6 ? 'r = ' + fmt(mir, 4) : 'none']
    ]);
  },
  draw(st){
    const cv = $('c-undamped-anim');
    if (!st.ok){ drawMessage(cv, 'At r = 1 the undamped response has no steady state: it grows without bound'); }
    else {
      const A = st.A, x = A * Math.cos(st.w * st.t), amp = Math.min(Math.max(Math.abs(A), 1), 8);
      drawSMD(cv, { x: clamp(x, -amp, amp), amp, damper: false, force: Math.cos(st.w * st.t), forceScale: 45 });
    }
    const pts = [[], []];
    for (let i = 0; i <= 600; i++){ const r = 3 * i / 600, a = 1 / (1 - r * r); (r < 1 ? pts[0] : pts[1]).push([r, a]); }
    const P = [];
    if (st.ok) P.push({ x: st.r, y: clamp(st.A, -6, 6), color: COL.c2, r: 7 });
    if (st.ok && st.r < Math.SQRT2){ const m = Math.sqrt(2 - st.r * st.r); if (Math.abs(m - st.r) > 1e-6) P.push({ x: m, y: clamp(1 / (1 - m * m), -6, 6), color: COL.c4, r: 5 }); }
    plot($('c-undamped-plot'), {
      xmin: 0, xmax: 3, ymin: -6, ymax: 6, xlabel: 'r = ω/ωₙ', ylabel: 'A / (F₀/K)',
      vlines: [{ x: 1, color: COL.axis, label: 'resonance' }], hlines: [{ y: 1, color: COL.c3 }],
      bands: [{ x0: 1, x1: 3, color: 'rgba(166,30,77,.06)' }],
      // the response curves go to infinity at resonance, so they are trimmed at the frame (guide) instead of widening the axes
      series: [{ pts: pts[0], color: COL.c1, width: 2.4, guide: true }, { pts: pts[1], color: COL.c1, width: 2.4, guide: true }], points: P
    });
  }
});

/* ---------------------------------------------------------
   Ch5 · Rotating imbalance
   --------------------------------------------------------- */
makeClip({
  id: 'c-imbalance',
  controls: [
    { key: 'r', label: 'Speed ratio r = ω/ωₙ', min: 0, max: 4, step: 0.01, value: 0.5, unit: '', dec: 3 },
    { key: 'z', label: 'Damping ratio ζ', min: 0.02, max: 1, step: 0.01, value: 0.1, unit: '', dec: 3 }
  ],
  presets: C => [
    { label: 'Slow (r = 0.5)', apply: () => C.set({ r: 0.5 }) },
    { label: 'Resonance (r = 1)', apply: () => C.set({ r: 1 }) },
    { label: 'Fast (r = 3)', apply: () => C.set({ r: 3 }) }
  ],
  reset(st){
    const r = Math.abs(st.V.r), z = st.V.z, D = Math.hypot(1 - r * r, 2 * z * r);
    st.ok = D > 0; if (!st.ok) return;
    st.r = r; st.z = z; st.N = r * r / D; st.phi = Math.atan2(2 * z * r, 1 - r * r); st.w = 3 * r;
    setStats('c-imbalance-stats', [
      ['Force amplitude m e ω² (relative to its value at r = 1)', fmt(r * r) + '×'],
      ['X (M + m) / (m e)', fmt(st.N), true],
      ['Phase lag φ', fmt(st.phi * 180 / Math.PI) + '°', true],
      ['Regime', r < 0.7 ? 'slow: little force, little motion' : r < 1.4 ? 'near resonance' : 'fast: X → m e / (M + m)']
    ]);
  },
  draw(st){
    const cv = $('c-imbalance-anim');
    if (!st.ok){ drawMessage(cv, 'No steady state'); return; }
    const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
    fitView(ctx, w, h, [0, 0, 560, 250]);
    const th = st.w * st.t, x = st.N * Math.cos(th - st.phi);
    const s = 45 / Math.max(st.N, 1), eq = 330, bw = 170, cx = eq + x * s, left = cx - bw / 2;
    hatch(ctx, 20, 40, 20, 215, 1); hatch(ctx, 20, 215, 540, 215, 1);
    springLine(ctx, 20, 95, left, 95, 9, 8);
    damperLine(ctx, 20, 175, left, 175, eq - bw / 2 - 20);
    txt(ctx, 'k', (20 + left) / 2, 74); txt(ctx, 'c', (20 + left) / 2, 197);
    line(ctx, eq, 30, eq, 215, COL.axis, 1, [4, 4]);
    block(ctx, cx, 135, bw, 120, 0, '');
    // the frame rolls on two wheels that touch the block (bottom at y = 195) and the floor (y = 215)
    [cx - 55, cx + 55].forEach(wx => { ctx.save(); ctx.fillStyle = COL.card; ctx.strokeStyle = COL.fg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(wx, 205, 10, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx - 10 * Math.cos(x * s / 10), 205 + 10 * Math.sin(x * s / 10)); ctx.lineTo(wx + 10 * Math.cos(x * s / 10), 205 - 10 * Math.sin(x * s / 10)); ctx.stroke(); ctx.restore(); });
    txt(ctx, 'M', cx + 60, 92, { font: 'italic 16px Georgia, serif' });
    // rotor: point mass m at radius e, rotating at ω
    const O = [cx - 10, 140], e = 32, P = [O[0] + e * Math.cos(th), O[1] - e * Math.sin(th)];
    ctx.save(); ctx.strokeStyle = COL.axis; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(O[0], O[1], e, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
    line(ctx, O[0], O[1], P[0], P[1], COL.spring, 2.5);
    ctx.fillStyle = COL.spring; ctx.beginPath(); ctx.arc(O[0], O[1], 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = COL.c2; ctx.beginPath(); ctx.arc(P[0], P[1], 8, 0, 2 * Math.PI); ctx.fill();
    txt(ctx, 'm', P[0] + 12, P[1] - 10, { font: 'italic 13px Georgia, serif', color: COL.c2 });
    // force on the frame: m e ω², outward along O→P, growing with ω²
    const L = 14 + 26 * Math.min(st.r * st.r, 4);
    if (st.r > 0.05) arrow(ctx, O[0], O[1], O[0] + (L + e) * Math.cos(th), O[1] - (L + e) * Math.sin(th), COL.c2, 2.5);
    txt(ctx, 'm e ω²', cx - 48, 92, { font: 'italic 13px Georgia, serif', color: COL.c2 });   // top-left corner, clear of the rotor circle (y 108–172)
    // frequency-response curves
    const refs = [0.05, 0.1, 0.25, 0.5, 1].map(z => { const p = []; for (let i = 0; i <= 400; i++){ const r = 4 * i / 400; p.push([r, r * r / Math.hypot(1 - r * r, 2 * z * r)]); } return { pts: p, color: COL.c5, width: 1, alpha: 0.6 }; });
    const cur = []; for (let i = 0; i <= 600; i++){ const r = 4 * i / 600; cur.push([r, r * r / Math.hypot(1 - r * r, 2 * st.z * r)]); }
    plot($('c-imbalance-plot'), {
      xmin: 0, xmax: 4, ymin: 0, ymax: 6, xlabel: 'r = ω/ωₙ', ylabel: 'X (M+m) / (m e)',
      vlines: [{ x: 1, color: COL.axis }], hlines: [{ y: 1, color: COL.c3 }],
      series: [...refs.map(r => ({ ...r, guide: true })), { pts: cur, color: COL.c1, width: 2.6, guide: true }],   // peaks are trimmed at the frame
      points: [{ x: st.r, y: Math.min(st.N, 6), color: COL.c2, r: 6 }]
    });
  }
});


/* ======================= main demos ======================= */
/* =========================================================
   1. Pendulum: nonlinear vs linear
   ========================================================= */
if (document.getElementById('demo-pend')) (function(){
  const g = 9.81;
  const C = makeControls('pend-ctl', [
    { key: 'th0', label: 'Release angle θ₀', min: 2, max: 170, step: 1, value: 30, unit: '°', dec: 1 },
    { key: 'L', label: 'Length L', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'm', dec: 2 }
  ], () => reset());
  const V = C.v;
  let t, sN, sL, hist, ok, Tl, wn, slow, L;
  const fN = (t, s) => [s[1], -g / L * Math.sin(s[0])];
  const fL = (t, s) => [s[1], -g / L * s[0]];
  const agm = (a, b) => { for (let i = 0; i < 40; i++){ const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; } return a; };
  const wrapDeg = a => ((a + 180) % 360 + 360) % 360 - 180;
  function reset(){
    t = 0; L = V.L;
    const notes = [];
    ok = L > 0;
    if (!ok){
      notes.push({ level: 'error', html: '<b>The length must be positive.</b> A pendulum with L ≤ 0 has no physical meaning. Enter a value greater than 0.' });
      showNotes('pend-notes', notes); setStats('pend-stats', []); return;
    }
    const th = V.th0 * Math.PI / 180; sN = [th, 0]; sL = [th, 0];
    hist = [[0, V.th0, V.th0]];
    wn = Math.sqrt(g / L); Tl = 2 * Math.PI / wn; slow = slowFactor(wn);
    const thw = wrapDeg(V.th0), thwr = thw * Math.PI / 180;
    const kk = Math.abs(Math.sin(thwr / 2));
    const Tn = kk >= 1 - 1e-12 ? Infinity : 4 / wn * Math.PI / (2 * agm(1, Math.sqrt(1 - kk * kk)));
    const sinErr = Math.abs(thwr) < 1e-12 ? 0 : Math.abs(Math.sin(thwr)) < 1e-9 ? Infinity : (thwr - Math.sin(thwr)) / Math.sin(thwr) * 100;
    const perr = (Tn / Tl - 1) * 100;
    setStats('pend-stats', [
      ['Linear period 2π√(L/g)', fmt(Tl) + ' s'],
      ['Exact period', isFinite(Tn) ? fmt(Tn) + ' s' : '∞'],
      ['Period error', isFinite(Tn) ? fmt(Math.abs(perr) < 1e-6 ? 0 : perr, 2) + ' %' : '∞', true],
      ['θ₀ vs sin θ₀ error', fmt(sinErr, 2) + ' %']
    ]);
    if (V.th0 === 0) notes.push({ level: 'info', html: 'Released at θ₀ = 0, the pendulum is already at rest at the bottom, so nothing moves. Vibration needs an initial disturbance.' });
    if (Math.abs(V.th0) > 180) notes.push({ level: 'info', html: `Angles beyond ±180° wrap around: the real pendulum starts at the same position as θ₀ = ${fmt(thw)}° and swings about the nearest full turn. The linear model takes ${fmt(V.th0)}° literally and swings through ±${fmt(Math.abs(V.th0))}°, another way linearization breaks down.` });
    if (Math.abs(thw) > 179.99) notes.push({ level: 'warn', html: '<b>Released upside-down.</b> The exact pendulum is balanced at an <em>unstable</em> equilibrium. In theory it stays there forever (infinite period); in practice the tiniest disturbance, here round-off error, eventually tips it over.' });
    if (slow < 1) notes.push(slowNote(wn, slow));
    showNotes('pend-notes', notes);
  }
  const d = {
    advance(dt){
      if (!ok) return;
      const simDt = dt * slow, h = Math.min(0.002, Tl / 200);
      let t1; [t1, sN] = integrate(fN, t, sN, simDt, h); [t, sL] = integrate(fL, t, sL, simDt, h);
      hist.push([t, sN[0] * 180 / Math.PI, sL[0] * 180 / Math.PI]);
      const W = 4 * Tl;
      while (hist.length > 2 && hist[0][0] < t - W) hist.shift();
    },
    draw(){
      if (!ok){ drawMessage($('pend-anim'), 'Enter a positive length L'); drawMessage($('pend-plot'), 'No simulation: L must be greater than 0'); return; }
      const cv = $('pend-anim'); const { ctx, w, h } = fit(cv);
      ctx.clearRect(0, 0, w, h);
      const px = w / 2, py = h * 0.47, R = Math.min(h * 0.4, w * 0.4);
      ctx.strokeStyle = COL.axis; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + R + 16); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.ground; ctx.fillRect(px - 30, py - 6, 60, 6);
      const draw1 = (th, col, alpha) => {
        const bx = px + R * Math.sin(th), by = py + R * Math.cos(th);
        ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(bx, by, 13, 0, 2 * Math.PI); ctx.fill();
        ctx.globalAlpha = 1;
      };
      draw1(sL[0], COL.c2, 0.75);
      draw1(sN[0], COL.c1, 0.95);
      ctx.fillStyle = COL.fg; ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = COL.muted; ctx.font = '12px system-ui'; ctx.textAlign = 'left';
      ctx.fillText('t = ' + fmt(t) + ' s', 10, 18);

      const W = 4 * Tl, t0 = Math.max(0, t - W), t1 = Math.max(W, t);
      let A = Math.abs(V.th0);
      for (const p of hist) A = Math.max(A, Math.abs(p[1]), Math.abs(p[2]));
      A = (A || 1) * 1.15;
      plot($('pend-plot'), {
        xmin: t0, xmax: t1, ymin: -A, ymax: A, xlabel: 'time t (s)', ylabel: 'θ (deg)',
        series: [
          { pts: hist.map(p => [p[0], p[2]]), color: COL.c2, width: 2, alpha: 0.85 },
          { pts: hist.map(p => [p[0], p[1]]), color: COL.c1, width: 2.2 }
        ]
      });
    }
  };
  makeButtons('pend-btn', d, reset, 0.5, C);
  reset();
  register($('demo-pend'), d);
})();

/* =========================================================
   2. Free undamped vibration
   ========================================================= */
if (document.getElementById('demo-free')) (function(){
  const C = makeControls('free-ctl', [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 10, max: 200, step: 1, value: 25, unit: 'N/m', dec: 1 },
    { key: 'x0', label: 'Initial x₀', min: -0.2, max: 0.2, step: 0.01, value: 0.1, unit: 'm', dec: 3 },
    { key: 'v0', label: 'Initial v₀', min: -1, max: 1, step: 0.05, value: 0, unit: 'm/s', dec: 2 }
  ], () => reset());
  const V = C.v;
  let t, ok, halted, m, k, x0, v0, rate, slow, Om, A, hist, trail, yR, pR, W, limit, xc, vc, notes;
  function reset(){
    t = 0; halted = false; m = V.m; k = V.k; x0 = V.x0; v0 = V.v0;
    notes = [];
    ok = m > 0;
    if (!ok){ notes.push(MASS_ERROR); showNotes('free-notes', notes); setStats('free-stats', []); return; }
    rate = refRate(m, 0, k); slow = slowFactor(rate);
    Om = k !== 0 ? Math.sqrt(Math.abs(k) / m) : 1;
    W = 8 * 2 * Math.PI / rate;
    A = k > 0 ? Math.hypot(x0, v0 / Om) : 0;
    limit = 1e6 * Math.max(Math.abs(x0), Math.abs(v0) / rate, 1e-3);
    xc = x0; vc = v0;
    hist = [[0, x0]]; trail = [[x0, v0 / Om]];
    yR = Math.max(Math.abs(x0), A); pR = Math.max(Math.abs(x0), Math.abs(v0 / Om), A);
    const E = 0.5 * m * v0 * v0 + 0.5 * k * x0 * x0;
    if (k > 0){
      setStats('free-stats', [
        ['ωₙ = √(k/m)', fmt(Om) + ' rad/s', true],
        ['fₙ', fmt(Om / 2 / Math.PI) + ' Hz'],
        ['Period τₙ', fmt(2 * Math.PI / Om) + ' s'],
        ['Amplitude X', fmt(A) + ' m'],
        ['Phase φ', fmt(Math.atan2(v0 / Om, x0) * 180 / Math.PI) + '°'],
        ['Energy E', fmt(E) + ' J']
      ]);
    } else {
      setStats('free-stats', [
        ['Regime', regimeText(m, 0, k), true],
        ...(k < 0 ? [['Growth rate √(|k|/m)', fmt(Om) + ' 1/s']] : [['Speed', fmt(v0) + ' m/s (constant)']]),
        ['Energy E', fmt(E) + ' J']
      ]);
    }
    notes.push(...systemNotes(m, 0, k));
    if (x0 === 0 && v0 === 0) notes.push({ level: 'info', html: 'Both initial conditions are zero, so the mass stays at rest. Free vibration needs an initial disturbance: a displacement, a velocity, or both.' });
    if (slow < 1) notes.push(slowNote(rate, slow));
    showNotes('free-notes', notes);
  }
  const d = {
    advance(dt){
      if (!ok || halted) return;
      const tn = t + dt * slow;
      const [x, v] = lin2(tn, m, 0, k, x0, v0);
      if (!isFinite(x) || Math.abs(x) > limit){ halted = true; notes.push(haltNote(limit)); showNotes('free-notes', notes); return; }
      t = tn; xc = x; vc = v;
      hist.push([t, x]); trail.push([x, v / Om]);
      while (hist.length > 2 && hist[0][0] < t - W) hist.shift();
      if (trail.length > 400) trail.shift();
    },
    draw(){
      if (!ok){ ['free-anim', 'free-plot', 'free-phase'].forEach(id => drawMessage($(id), 'Enter a positive mass m')); return; }
      yR = Math.max(yR, Math.abs(xc)); pR = Math.max(pR, Math.abs(xc), Math.abs(vc / Om));
      const amp = yR || 0.01, pa = pR || 0.01;
      drawSMD($('free-anim'), { x: xc, amp, damper: false });
      CLIP_ST['demo-free'] = { x: xc, amp, damper: false, force: 0 };   // read by the 3D view
      const t0 = Math.max(0, t - W), t1 = Math.max(W, t);
      plot($('free-plot'), {
        xmin: t0, xmax: t1, ymin: -amp * 1.2, ymax: amp * 1.2, xlabel: 'time t (s)', ylabel: 'x (m)',
        hlines: A > 0 ? [{ y: A, color: COL.c3 }, { y: -A, color: COL.c3 }] : [],
        series: [{ pts: hist, color: COL.c1, width: 2.2 }],
        points: [{ x: t, y: xc, color: COL.c1, r: 4 }]
      });
      const circ = [];
      if (k > 0) for (let i = 0; i <= 100; i++){ const a = i / 100 * 2 * Math.PI; circ.push([A * Math.cos(a), A * Math.sin(a)]); }
      plot($('free-phase'), {
        xmin: -pa * 1.25, xmax: pa * 1.25, ymin: -pa * 1.25, ymax: pa * 1.25, xzero: true,
        xlabel: 'x (m)', ylabel: k > 0 ? 'ẋ/ωₙ (m)' : k < 0 ? 'ẋ/√(|k|/m) (m)' : 'ẋ (m/s)',
        series: [{ pts: circ, color: COL.axis, width: 1, dash: [4, 4] }, { pts: trail, color: COL.c1, width: 2 }],
        points: [{ x: xc, y: vc / Om, color: COL.c2, r: 5 }]
      });
      const KE = 0.5 * m * vc * vc, PE = 0.5 * k * xc * xc, E = KE + PE;
      const sc = Math.max(KE, Math.abs(PE), Math.abs(E), 1e-300);
      $('free-ke').style.width = clamp(KE / sc * 100, 0, 100) + '%';
      $('free-pe').style.width = clamp(Math.abs(PE) / sc * 100, 0, 100) + '%';
      $('free-te').style.width = clamp(Math.abs(E) / sc * 100, 0, 100) + '%';
      $('free-ke-v').textContent = fmt(KE, 2) + ' J';
      $('free-pe-v').textContent = fmt(PE, 2) + ' J';
      $('free-te-v').textContent = fmt(E, 2) + ' J';
    }
  };
  makeButtons('free-btn', d, reset, 0.5, C);
  reset();
  register($('demo-free'), d);
})();

/* =========================================================
   3. Damped free vibration
   ========================================================= */
if (document.getElementById('demo-damped')) (function(){
  const C = makeControls('damp-ctl', [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 10, max: 200, step: 1, value: 40, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Damping ratio ζ', min: 0, max: 2.5, step: 0.01, value: 0.1, unit: '', dec: 3 },
    { key: 'x0', label: 'Initial x₀', min: -0.2, max: 0.2, step: 0.01, value: 0.1, unit: 'm', dec: 3 },
    { key: 'v0', label: 'Initial v₀', min: -2, max: 2, step: 0.05, value: 0, unit: 'm/s', dec: 2 }
  ], () => reset());
  const V = C.v;
  makePresets('damp-pre', [
    { label: 'Undamped ζ=0', apply: () => C.set({ z: 0 }) },
    { label: 'Light ζ=0.05', apply: () => C.set({ z: 0.05 }) },
    { label: 'Underdamped ζ=0.3', apply: () => C.set({ z: 0.3 }) },
    { label: 'Critical ζ=1', apply: () => C.set({ z: 1 }) },
    { label: 'Overdamped ζ=2', apply: () => C.set({ z: 2 }) },
    { label: 'Negative damping ζ=−0.05', apply: () => C.set({ z: -0.05 }) }
  ]);
  let t, ok, m, k, c, tmax, pts, env, ymax, peaks, slow;
  function reset(){
    t = 0; m = V.m; k = V.k;
    const notes = [];
    ok = m > 0;
    if (!ok){ notes.push(MASS_ERROR); showNotes('damp-notes', notes); setStats('damp-stats', []); setStats('damp-peaks', []); return; }
    c = dampingC(V.z, m, k);
    const rate = refRate(m, c, k); slow = slowFactor(rate);
    const { sigma, beta } = roots(m, c, k);
    const Tq = 2 * Math.PI / rate, eps = 1e-9 * rate;
    if (sigma < -eps) tmax = 5 / -sigma;
    else if (sigma > eps) tmax = 6 / sigma;
    else tmax = beta > 0 ? 12 * 2 * Math.PI / beta : 10 * Tq;
    if (beta > 0) tmax = clamp(tmax, 3 * 2 * Math.PI / beta, 12 * 2 * Math.PI / beta);
    tmax = Math.min(tmax, 60 * Tq);
    if (!(tmax > 0) || !isFinite(tmax)) tmax = 10 * Tq;

    const N = 1500;
    pts = []; ymax = 0;
    for (let i = 0; i <= N; i++){ const tt = tmax * i / N, x = lin2(tt, m, c, k, V.x0, V.v0)[0]; pts.push([tt, x]); if (isFinite(x)) ymax = Math.max(ymax, Math.abs(x)); }
    if (!(ymax > 0)) ymax = 0.01;
    env = null;
    if (beta > 0 && c !== 0){
      const Xe = Math.hypot(V.x0, (V.v0 - sigma * V.x0) / beta);
      env = [];
      for (let i = 0; i <= 200; i++){ const tt = tmax * i / 200; env.push([tt, Xe * Math.exp(sigma * tt)]); }
    }
    peaks = [];
    for (let i = 1; i < N; i++){
      if (pts[i][1] > ymax * 1e-9 && pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1]) peaks.push(pts[i]);
      if (peaks.length >= 5) break;
    }
    const st = [['Regime', regimeText(m, c, k), true]];
    if (k > 0) st.push(['ωₙ', fmt(Math.sqrt(k / m)) + ' rad/s']);
    st.push(['c', fmt(c) + ' N·s/m']);
    if (k > 0) st.push(['c_cr = 2√(km)', fmt(2 * Math.sqrt(k * m)) + ' N·s/m']);
    if (beta > 0){
      st.push(['ω_d', fmt(beta) + ' rad/s']);
      st.push(['δ (theory)', fmt(-2 * Math.PI * sigma / beta)]);
    }
    setStats('damp-stats', st);
    if (peaks.length >= 2){
      const dl = Math.log(peaks[0][1] / peaks[1][1]);
      const zest = dl / Math.sqrt(4 * Math.PI * Math.PI + dl * dl);
      setStats('damp-peaks', [
        ...peaks.slice(0, 3).map((p, i) => [`peak ${i + 1}`, fmt(p[1]) + ' m @ ' + fmt(p[0]) + ' s']),
        ['δ = ln(x₁/x₂)', fmt(dl)],
        ['ζ from δ', fmt(zest), true]
      ]);
    } else {
      setStats('damp-peaks', [['Peaks', 'fewer than two positive peaks, so there is no oscillation to measure']]);
    }
    notes.push(...systemNotes(m, c, k, V.z));
    if (V.x0 === 0 && V.v0 === 0) notes.push({ level: 'info', html: 'Both initial conditions are zero, so the mass stays at rest. Give it a displacement or a velocity.' });
    if (peaks.length >= 2 && c < 0 && k > 0) notes.push({ level: 'info', html: 'With negative damping the peaks <em>grow</em>, so the measured log decrement δ is negative and returns a negative ζ.' });
    if (slow < 1) notes.push(slowNote(rate, slow));
    showNotes('damp-notes', notes);
    drawCmp();
  }
  function drawCmp(){
    const zs = [0, 0.1, 0.3, 1, 2];
    const cols = [COL.c5, COL.c3, COL.c4, COL.c2, COL.fg];
    const series = zs.map((z, j) => {
      const p = []; for (let i = 0; i <= 400; i++){ const tau = 25 * i / 400; p.push([tau, lin2(tau, 1, 2 * z, 1, 1, 0)[0]]); }
      return { pts: p, color: cols[j], width: 1.4, alpha: 0.55 };
    });
    const ks = Math.sign(V.k), cn = ks === 0 ? 0 : 2 * V.z;
    const pc = []; let mx = 1.1;
    for (let i = 0; i <= 400; i++){ const tau = 25 * i / 400, x = lin2(tau, 1, cn, ks, 1, 0)[0]; pc.push([tau, x]); if (isFinite(x)) mx = Math.max(mx, Math.abs(x) * 1.05); }
    series.push({ pts: pc, color: COL.c1, width: 3 });
    d.cmpSeries = series; d.cmpY = Math.min(mx, 50);
    $('damp-cmp-leg').innerHTML = zs.map((z, j) => `<span><span class="sw" style="background:${cols[j]};opacity:.7"></span>ζ = ${z}</span>`).join('') +
      `<span><span class="sw" style="background:${COL.c1}"></span><b>your ζ = ${fmt(V.z)}${ks <= 0 ? ' (k ≤ 0)' : ''}</b></span>`;
  }
  const d = {
    advance(dt){ if (!ok) return; t += dt * slow; if (t > tmax * 1.08) t = 0; },
    draw(){
      if (!ok){ ['damp-anim', 'damp-plot', 'damp-cmp'].forEach(id => drawMessage($(id), 'Enter a positive mass m')); return; }
      const tc = Math.min(t, tmax);
      const x = lin2(tc, m, c, k, V.x0, V.v0)[0];
      drawSMD($('damp-anim'), { x: isFinite(x) ? x : 0, amp: ymax, damper: true });
      CLIP_ST['demo-damped'] = { x: isFinite(x) ? x : 0, amp: ymax, damper: true, force: 0 };
      const traced = pts.filter(p => p[0] <= tc);
      traced.push([tc, x]);
      const series = [{ pts, color: COL.c1, width: 1.2, alpha: 0.2 }];
      if (env){
        series.push({ pts: env, color: COL.c2, width: 1.5, dash: [5, 4] });
        series.push({ pts: env.map(p => [p[0], -p[1]]), color: COL.c2, width: 1.5, dash: [5, 4] });
      }
      series.push({ pts: traced, color: COL.c1, width: 2.2 });
      plot($('damp-plot'), {
        xmin: 0, xmax: tmax, ymin: -ymax * 1.15, ymax: ymax * 1.15, xlabel: 'time t (s)', ylabel: 'x (m)',
        series,
        points: [...peaks.map(p => ({ x: p[0], y: p[1], color: COL.c4, r: 4 })), { x: tc, y: x, color: COL.c1, r: 4 }]
      });
      plot($('damp-cmp'), {
        xmin: 0, xmax: 25, ymin: -d.cmpY, ymax: d.cmpY, xlabel: 'dimensionless time ωₙt', ylabel: 'x / x₀',
        series: d.cmpSeries
      });
    }
  };
  makeButtons('damp-btn', d, () => { t = 0; }, 0.5, C);
  reset();
  register($('demo-damped'), d);
})();

/* =========================================================
   4. Forced harmonic vibration
   ========================================================= */
if (document.getElementById('demo-forced')) (function(){
  const C = makeControls('frc-ctl', [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 10, max: 200, step: 1, value: 100, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Damping ratio ζ', min: 0, max: 1, step: 0.01, value: 0.1, unit: '', dec: 3 },
    { key: 'F0', label: 'Force amplitude F₀', min: 1, max: 50, step: 1, value: 10, unit: 'N', dec: 2 },
    { key: 'r', label: 'Frequency ratio r = ω/ωₙ', min: 0, max: 3, step: 0.01, value: 0.5, unit: '', dec: 3 }
  ], () => reset());
  const V = C.v;
  makePresets('frc-pre', [
    { label: 'Quasi-static r=0.2', apply: () => C.set({ r: 0.2, z: 0.1 }) },
    { label: 'Resonance r=1', apply: () => C.set({ r: 1, z: 0.1 }) },
    { label: 'Mass-controlled r=2.5', apply: () => C.set({ r: 2.5, z: 0.1 }) },
    { label: 'Beats (ζ=0, r=0.9)', apply: () => C.set({ r: 0.9, z: 0 }) },
    { label: 'Undamped resonance', apply: () => C.set({ r: 1, z: 0 }) }
  ]);
  const cbSS = $('frc-ss'), cbF = $('frc-f'), cbTr = $('frc-tr');
  let t, s, hist, ok, halted, m, k, c, F0, w, Om, X, phi, yR, rate, slow, W, limit, notes;
  const Mg = (r, z, sg) => 1 / Math.sqrt((sg - r * r) ** 2 + (2 * z * r) ** 2);
  const Pg = (r, z, sg) => Math.atan2(2 * z * r, sg - r * r) * 180 / Math.PI;
  const xss = tt => isFinite(X) ? X * Math.cos(w * tt - phi) : NaN;
  const f = (tt, st) => [st[1], (F0 * Math.cos(w * tt) - c * st[1] - k * st[0]) / m];
  function reset(){
    t = 0; s = [0, 0]; halted = false; m = V.m; k = V.k; F0 = V.F0;
    notes = [];
    ok = m > 0;
    if (!ok){ notes.push(MASS_ERROR); showNotes('frc-notes', notes); setStats('frc-stats', []); return; }
    c = dampingC(V.z, m, k);
    Om = k !== 0 ? Math.sqrt(Math.abs(k) / m) : 1;
    w = Math.abs(V.r) * Om;   // cos(-ωt) = cos(ωt): only |r| matters
    const D = Math.hypot(k - m * w * w, c * w);
    X = D > 0 ? F0 / D : (F0 === 0 ? 0 : Infinity);
    phi = Math.atan2(c * w, k - m * w * w);
    rate = refRate(m, c, k, w); slow = slowFactor(rate); W = 10 * 2 * Math.PI / rate;
    const dst = k !== 0 ? F0 / k : NaN;
    const base = Math.max(isFinite(dst) ? Math.abs(dst) : 0, isFinite(X) ? Math.abs(X) : 0, 1e-3);
    limit = 1e6 * base; yR = base * 1.2;
    hist = [[0, 0, F0, xss(0)]];
    const stable = k > 0 && c >= 0, ra = Math.abs(V.r);
    const st = [];
    st.push(k > 0 ? ['ωₙ', fmt(Om) + ' rad/s'] : k < 0 ? ['Reference √(|k|/m)', fmt(Om) + ' 1/s'] : ['Reference frequency', '1 rad/s (no spring)']);
    st.push(['ω', fmt(w) + ' rad/s']);
    st.push(['c', fmt(c) + ' N·s/m']);
    if (k !== 0) st.push(['δ_st = F₀/k', fmt(dst) + ' m']);
    if (k > 0) st.push(['M = X/δ_st', F0 === 0 ? '—' : fmt(Math.abs(X / dst)), true]);
    st.push(['Steady X', isFinite(X) ? fmt(Math.abs(X)) + ' m' : '∞ (grows without bound)']);
    st.push(['Phase lag φ', D > 0 ? fmt(phi * 180 / Math.PI) + '°' : '— (no steady state)', true]);
    st.push(['Regime', stable ? (ra < 0.6 ? 'stiffness-controlled' : ra < 1.4 ? (c === 0 ? 'near resonance (undamped)' : 'near resonance (damping-controlled)') : 'mass-controlled') : k === 0 && c >= 0 ? 'No spring: purely mass-controlled' : regimeText(m, c, k)]);
    setStats('frc-stats', st);

    notes.push(...systemNotes(m, c, k, V.z));
    if (k < 0 || c < 0) notes.push({ level: 'warn', html: 'Because this system is unstable, the transient grows and swamps everything else. The steady-state curve is still a valid particular solution of the equation, but the motion never settles onto it.' });
    if (k === 0 && c >= 0 && F0 !== 0 && w !== 0) notes.push({ level: 'info', html: 'With no spring only inertia (and damping) resists the force, so the steady-state amplitude is about F₀/(mω²): this is the r ≫ 1, mass-controlled limit with nothing else left.' });
    if (k > 0 && c === 0 && !isFinite(X)) notes.push({ level: 'warn', html: '<b>Undamped resonance.</b> The force is exactly in step with the natural motion and nothing removes energy, so there is no steady state: the amplitude grows linearly, x(t) = (F₀ / 2mωₙ) t sin ωₙt.' });
    else if (k > 0 && c === 0) notes.push({ level: 'info', html: 'With no damping the transient never dies out, so the response is a permanent mix of the natural frequency and the forcing frequency (near r = 1 this mix produces beats).' });
    if (F0 === 0) notes.push({ level: 'info', html: 'With F₀ = 0 there is no force, and the mass starts at rest, so nothing moves.' });
    if (F0 < 0) notes.push({ level: 'info', html: 'A negative F₀ just flips the force by 180°: it is the same as a positive force starting half a cycle later.' });
    if (V.r < 0) notes.push({ level: 'info', html: 'A negative frequency ratio gives exactly the same force, because cos(−ωt) = cos ωt. Only |r| matters.' });
    if (V.r === 0 && k > 0) notes.push({ level: 'info', html: 'r = 0 means a constant force F₀. After the transient, the mass settles at the static deflection F₀/k.' });
    if (slow < 1) notes.push(slowNote(rate, slow));
    showNotes('frc-notes', notes);
  }
  const d = {
    advance(dt){
      if (!ok || halted) return;
      const [tn, sn] = integrate(f, t, s, dt * slow, 2 * Math.PI / rate / 120);
      if (!sn.every(isFinite) || Math.abs(sn[0]) > limit){ halted = true; notes.push(haltNote(limit)); showNotes('frc-notes', notes); return; }
      t = tn; s = sn;
      hist.push([t, s[0], F0 * Math.cos(w * t), xss(t)]);
      while (hist.length > 2 && hist[0][0] < t - W) hist.shift();
    },
    draw(){
      if (!ok){ ['frc-anim', 'frc-plot', 'frc-mag', 'frc-phs'].forEach(id => drawMessage($(id), 'Enter a positive mass m')); return; }
      const dst = k !== 0 ? Math.abs(F0 / k) : 0;
      let target = Math.max(dst * 0.5, 1e-3);
      for (const p of hist){
        target = Math.max(target, Math.abs(p[1]));
        if (cbF.checked && k !== 0) target = Math.max(target, Math.abs(p[2] / k));
        if (cbSS.checked && isFinite(p[3])) target = Math.max(target, Math.abs(p[3]));
      }
      target *= 1.15;
      yR = target > yR ? target : yR + (target - yR) * 0.08;
      const F = F0 * Math.cos(w * t);
      drawSMD($('frc-anim'), { x: s[0], amp: yR / 1.15, damper: true, force: F, forceScale: 55 / Math.max(Math.abs(F0), 1e-12) });
      CLIP_ST['demo-forced'] = { x: s[0], amp: yR / 1.15, damper: true, force: F / Math.max(Math.abs(F0), 1e-12) };
      const t0 = Math.max(0, t - W), t1 = Math.max(W, t);
      const series = [];
      if (cbF.checked && k !== 0) series.push({ pts: hist.map(p => [p[0], p[2] / k]), color: COL.c5, width: 1.5, dash: [6, 4] });
      if (cbSS.checked) series.push({ pts: hist.map(p => [p[0], p[3]]), color: COL.c2, width: 1.6, alpha: 0.9 });
      if (cbTr.checked) series.push({ pts: hist.map(p => [p[0], p[1] - (isFinite(p[3]) ? p[3] : 0)]), color: COL.c3, width: 1.6 });
      series.push({ pts: hist.map(p => [p[0], p[1]]), color: COL.c1, width: 2.2 });
      plot($('frc-plot'), { xmin: t0, xmax: t1, ymin: -yR, ymax: yR, xlabel: 'time t (s)', ylabel: 'x (m)', series });

      const sg = Math.sign(k), ra = Math.abs(V.r), xmax = clamp(ra * 1.1, 3, 50);
      const key = V.z + '|' + sg + '|' + xmax;
      if (!d.fr || d.fr.key !== key){
        const grid = n => Array.from({ length: n + 1 }, (_, i) => xmax * i / n);
        const refs = [0.05, 0.1, 0.25, 0.5, 1].map(z => ({ m: grid(400).map(r => [r, Mg(r, z, 1)]), p: grid(400).map(r => [r, Pg(r, z, 1)]) }));
        const cm = sg !== 0 ? grid(800).map(r => [r, Mg(r, V.z, sg)]) : [];
        const cp = sg !== 0 ? grid(800).map(r => [r, Pg(r, V.z, sg)]) : [];
        d.fr = { key, refs, cm, cp, xmax };
      }
      const pts = sg !== 0;
      plot($('frc-mag'), {
        xmin: 0, xmax: d.fr.xmax, ymin: 0, ymax: 6, xlabel: 'r = ω/ωₙ', ylabel: 'M = X/δₛₜ',
        vlines: [{ x: 1, color: COL.axis }],
        series: [...d.fr.refs.map(rf => ({ pts: rf.m, color: COL.c5, width: 1, alpha: 0.6, guide: true })), { pts: d.fr.cm, color: COL.c1, width: 2.6, guide: true }],   // peaks are trimmed at the frame
        points: pts ? [{ x: ra, y: Math.min(Mg(ra, V.z, sg), 6), color: COL.c2, r: 6 }] : []
      });
      const pmin = V.z < 0 ? -180 : 0;
      plot($('frc-phs'), {
        xmin: 0, xmax: d.fr.xmax, ymin: pmin, ymax: 180, ystep: 45, xlabel: 'r = ω/ωₙ', ylabel: 'φ (deg)',
        vlines: [{ x: 1, color: COL.axis }], hlines: [{ y: 90, color: COL.axis }],
        series: [...d.fr.refs.map(rf => ({ pts: rf.p, color: COL.c5, width: 1, alpha: 0.6 })), { pts: d.fr.cp, color: COL.c1, width: 2.6 }],
        points: pts ? [{ x: ra, y: Pg(ra, V.z, sg), color: COL.c2, r: 6 }] : []
      });
    }
  };
  makeButtons('frc-btn', d, reset, 0.5, C);
  reset();
  register($('demo-forced'), d);
})();

/* =========================================================
   5. Base excitation
   ========================================================= */
if (document.getElementById('demo-base')) (function(){
  const C = makeControls('base-ctl', [
    { key: 'm', label: 'Mass m', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg', dec: 2 },
    { key: 'k', label: 'Stiffness k', min: 10, max: 200, step: 1, value: 100, unit: 'N/m', dec: 1 },
    { key: 'z', label: 'Damping ratio ζ', min: 0, max: 1, step: 0.01, value: 0.1, unit: '', dec: 3 },
    { key: 'r', label: 'Frequency ratio r', min: 0.1, max: 4, step: 0.01, value: 3, unit: '', dec: 3 },
    { key: 'Y', label: 'Base amplitude Y', min: 0.01, max: 0.05, step: 0.005, value: 0.03, unit: 'm', dec: 4 }
  ], () => reset());
  const V = C.v;
  const TRn = (r, z, sg) => Math.sqrt((1 + (2 * z * r) ** 2) / ((sg - r * r) ** 2 + (2 * z * r) ** 2));
  let t, s, hist, ok, halted, m, k, c, Y, w, Om, yR, rate, slow, W, limit, notes;
  const yb = tt => Y * Math.sin(w * tt), ybd = tt => Y * w * Math.cos(w * tt);
  const f = (tt, st) => [st[1], (-c * (st[1] - ybd(tt)) - k * (st[0] - yb(tt))) / m];
  function reset(){
    t = 0; s = [0, 0]; halted = false; m = V.m; k = V.k; Y = V.Y;
    notes = [];
    ok = m > 0;
    if (!ok){ notes.push(MASS_ERROR); showNotes('base-notes', notes); setStats('base-stats', []); return; }
    c = dampingC(V.z, m, k);
    Om = k !== 0 ? Math.sqrt(Math.abs(k) / m) : 1;
    w = V.r * Om;
    rate = refRate(m, c, k, w); slow = slowFactor(rate); W = 10 * 2 * Math.PI / rate;
    const num = Math.hypot(k, c * w), den = Math.hypot(k - m * w * w, c * w);
    const TR = den > 0 ? num / den : (num > 0 ? Infinity : NaN);
    const base = Math.max(Math.abs(Y), isFinite(TR) ? TR * Math.abs(Y) : 0, 1e-3);
    limit = 1e6 * base; yR = base * 1.2;
    hist = [[0, 0, 0]];
    const stable = k > 0 && c >= 0;
    setStats('base-stats', [
      k > 0 ? ['ωₙ', fmt(Om) + ' rad/s'] : k < 0 ? ['Reference √(|k|/m)', fmt(Om) + ' 1/s'] : ['Reference frequency', '1 rad/s (no spring)'],
      ['ω', fmt(w) + ' rad/s'],
      ['TR = X/Y', fmt(TR), true],
      ['Steady X', isFinite(TR) ? fmt(TR * Math.abs(Y)) + ' m' : '∞'],
      ['Result', stable ? (Math.abs(V.r) > Math.SQRT2 ? 'isolation (TR < 1)' : 'amplification (TR ≥ 1)') : (k === 0 && c === 0) ? 'mass not connected to base' : (k === 0 && c > 0) ? 'damper only: no spring' : regimeText(m, c, k), true]
    ]);
    notes.push(...systemNotes(m, c, k, V.z));
    if (k < 0 || c < 0) notes.push({ level: 'warn', html: 'Because this system is unstable, the motion grows on its own and the transmissibility (a steady-state idea) does not describe what you see.' });
    if (k === 0 && c === 0) notes.push({ level: 'info', html: 'With k = 0 and no damping, the mass is not connected to the base at all, so the base motion has no effect on it.' });
    if (Y === 0) notes.push({ level: 'info', html: 'With Y = 0 the base does not move, so nothing excites the mass.' });
    if (V.r < 0) notes.push({ level: 'info', html: 'A negative frequency ratio is the same motion shifted by half a cycle. Only |r| matters for TR.' });
    if (slow < 1) notes.push(slowNote(rate, slow));
    showNotes('base-notes', notes);
    d.fr = null;
  }
  const d = {
    advance(dt){
      if (!ok || halted) return;
      const [tn, sn] = integrate(f, t, s, dt * slow, 2 * Math.PI / rate / 120);
      if (!sn.every(isFinite) || Math.abs(sn[0]) > limit){ halted = true; notes.push(haltNote(limit)); showNotes('base-notes', notes); return; }
      t = tn; s = sn;
      hist.push([t, s[0], yb(t)]);
      while (hist.length > 2 && hist[0][0] < t - W) hist.shift();
    },
    draw(){
      if (!ok){ ['base-anim', 'base-plot', 'base-tr'].forEach(id => drawMessage($(id), 'Enter a positive mass m')); return; }
      let target = Math.max(Math.abs(Y), 1e-3);
      for (const p of hist) target = Math.max(target, Math.abs(p[1]));
      target *= 1.15; yR = target > yR ? target : yR + (target - yR) * 0.08;
      drawBaseV($('base-anim'), { x: s[0], y: yb(t), amp: yR / 1.15 });
      CLIP_ST['demo-base'] = { x: s[0], y: yb(t), amp: yR / 1.15 };
      const t0 = Math.max(0, t - W), t1 = Math.max(W, t);
      plot($('base-plot'), {
        xmin: t0, xmax: t1, ymin: -yR, ymax: yR, xlabel: 'time t (s)', ylabel: 'displacement (m)',
        series: [{ pts: hist.map(p => [p[0], p[2]]), color: COL.c5, width: 1.8, dash: [6, 4] }, { pts: hist.map(p => [p[0], p[1]]), color: COL.c1, width: 2.2 }]
      });
      const sg = Math.sign(k), ra = Math.abs(V.r), xmax = clamp(ra * 1.1, 4, 50);
      if (!d.fr || d.fr.xmax !== xmax){
        const grid = n => Array.from({ length: n + 1 }, (_, i) => xmax * i / n);
        const refs = [0.05, 0.1, 0.25, 0.5, 1].map(z => grid(400).map(r => [r, TRn(r, z, 1)]));
        const cur = sg !== 0 ? grid(800).map(r => [r, TRn(r, V.z, sg)]) : [];
        d.fr = { refs, cur, xmax };
      }
      plot($('base-tr'), {
        xmin: 0, xmax: d.fr.xmax, ymin: 0, ymax: 5, xlabel: 'r = ω/ωₙ', ylabel: 'TR = X/Y',
        bands: [{ x0: Math.SQRT2, x1: d.fr.xmax, color: COL.band }],
        vlines: [{ x: Math.SQRT2, color: COL.c3, label: 'r = √2' }], hlines: [{ y: 1, color: COL.axis }],
        series: [...d.fr.refs.map(p => ({ pts: p, color: COL.c5, width: 1, alpha: 0.6, guide: true })), { pts: d.fr.cur, color: COL.c1, width: 2.6, guide: true }],   // peaks are trimmed at the frame
        points: sg !== 0 ? [{ x: ra, y: Math.min(TRn(ra, V.z, sg), 5), color: COL.c2, r: 6 }] : []
      });
    }
  };
  makeButtons('base-btn', d, reset, 0.25, C);
  reset();
  register($('demo-base'), d);
})();


/* =========================================================
   Challenge checks (see CHALLENGES in common.js)
   ========================================================= */
(function(){
  const V = id => CONTROLS[id] || {};
  const pos = (...a) => a.every(v => v > 0);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const g = 9.81;
  const pendErr = th0 => {               // % by which the exact period exceeds the linear one
    const th = Math.abs((((th0 + 180) % 360) + 360) % 360 - 180) * Math.PI / 180, kk = Math.sin(th / 2);
    if (kk >= 1) return Infinity;
    let a = 1, b = Math.sqrt(1 - kk * kk); for (let i = 0; i < 40; i++){ const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
    return (1 / a - 1) * 100;
  };
  let th1pct = null;
  const threshold1 = () => { if (th1pct === null){ let lo = 1, hi = 90; for (let i = 0; i < 60; i++){ const mid = (lo + hi) / 2; if (pendErr(mid) < 1) lo = mid; else hi = mid; } th1pct = lo; } return th1pct; };
  const seen = {};
  const visits = id => {
    const p = V(id);
    if (!seen[id]) seen[id] = [Object.assign({}, p._defaults)];
    const cur = Object.assign({}, p), last = seen[id][seen[id].length - 1];
    if (Object.keys(cur).some(k => cur[k] !== last[k])){ seen[id].push(cur); if (seen[id].length > 400) seen[id].shift(); }
    return seen[id];
  };
  window.CH_TRACK = () => { if (CONTROLS['free-ctl'] && CONTROLS['free-ctl']._touched) visits('free-ctl'); };
  const M = (r, z) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
  const TR = (r, z) => Math.sqrt((1 + (2 * z * r) ** 2) / ((1 - r * r) ** 2 + (2 * z * r) ** 2));

  // Chapter 1
  CHECKS.pend5 = () => { const p = V('pend-ctl'); if (!near(p.L, 0.5, 0.005)) return false;
    const T = 2 * Math.PI * Math.sqrt(p.L / g) * (1 + pendErr(p.th0) / 100); return near(T, 1.5, 0.01); };
  CHECKS.pend1 = () => { const p = V('pend-ctl'); return pos(p.L) && pendErr(p.th0) < 1 && Math.abs(Math.abs(p.th0) - threshold1()) <= 1; };
  // Chapter 2
  CHECKS.tick1 = () => { const p = V('free-ctl'); if (!near(p.m, 2.5, 0.01) || !pos(p.k)) return false;
    return near(Math.sqrt(p.k / p.m) / (2 * Math.PI), 1, 0.005); };
  CHECKS.isochron = () => {
    const p = V('free-ctl'); if (!pos(p.m, p.k) || p.x0 !== 0 || p.v0 === 0) return false;
    return visits('free-ctl').some(q => q.m === p.m && q.k === p.k && q.x0 === 0 && q.v0 !== 0 && Math.max(Math.abs(p.v0 / q.v0), Math.abs(q.v0 / p.v0)) >= 5 - 1e-9);
  };
  CHECKS.split = () => {
    const p = V('free-ctl'); if (!pos(p.m, p.k) || p.x0 === 0 || p.v0 === 0) return false;
    const KE = 0.5 * p.m * p.v0 * p.v0, PE = 0.5 * p.k * p.x0 * p.x0;
    return near(KE + PE, 0.5, 0.025) && near(KE / PE, 1, 0.05);
  };
  CHECKS.scale = () => { const p = V('free-ctl'); if (!pos(p.m, p.k)) return false;
    return visits('free-ctl').some(q => q.k === p.k && q.m > 0 && near(Math.sqrt(q.m / p.m), 3, 0.06)); };
  // Chapter 3
  CHECKS.crit = () => { const p = V('damp-ctl'); if (!pos(p.m, p.k) || p.v0 !== 0 || p.x0 === 0 || p.z < 0.98 || p.z > 1.02) return false;
    return 5.834 / Math.sqrt(p.k / p.m) <= 0.5; };
  CHECKS.logdec = () => { const p = V('damp-ctl'); if (!pos(p.m, p.k) || !(p.z > 0 && p.z < 1)) return false;
    return near(Math.exp(-2 * Math.PI * p.z / Math.sqrt(1 - p.z * p.z)), 0.5, 0.01); };
  CHECKS.over = () => {
    const p = V('damp-ctl'); if (!pos(p.m, p.k) || !(p.z >= 2) || p.x0 === 0) return false;
    const wn = Math.sqrt(p.k / p.m), q = Math.sqrt(p.z * p.z - 1), s1 = wn * (-p.z + q), s2 = wn * (-p.z - q);
    return (p.v0 - s2 * p.x0) / (s1 - s2) * p.x0 < 0;
  };
  CHECKS.pump = () => { const p = V('damp-ctl'); if (!pos(p.m, p.k) || !(p.z < 0 && p.z > -1) || (p.x0 === 0 && p.v0 === 0)) return false;
    return near(Math.exp(-2 * Math.PI * p.z / Math.sqrt(1 - p.z * p.z)), 1.5, 0.03); };
  CHECKS.wd = () => { const p = V('damp-ctl'); return pos(p.m, p.k) && p.z > 0 && p.z < 1 && near(1 / Math.sqrt(1 - p.z * p.z), 1.25, 0.0125); };
  // Chapter 4
  CHECKS.res10 = () => { const p = V('frc-ctl'); return pos(p.m, p.k) && p.F0 !== 0 && near(p.z, 0.05, 0.001) && near(M(Math.abs(p.r), p.z), 8, 0.16); };
  CHECKS.calm = () => { const p = V('frc-ctl'); return pos(p.m, p.k) && p.F0 !== 0 && near(p.z, 0.3, 0.005) && near(M(Math.abs(p.r), p.z), 0.1, 0.003); };
  CHECKS.beats = () => { const p = V('frc-ctl'); if (!pos(p.m, p.k) || p.z !== 0 || p.F0 === 0) return false;
    const wn = Math.sqrt(p.k / p.m); if (!near(wn, 10, 0.1)) return false;
    const dw = wn * Math.abs(1 - Math.abs(p.r)); return dw > 0 && near(2 * Math.PI / dw, 5, 0.1); };
  CHECKS.phase90 = () => { const p = V('frc-ctl'); if (!pos(p.m, p.k) || !near(p.z, 0.2, 0.005)) return false;
    const r = Math.abs(p.r); return near(Math.atan2(2 * p.z * r, 1 - r * r) * 180 / Math.PI, 135, 1); };
  CHECKS.peak = () => { const p = V('frc-ctl'); if (!pos(p.m, p.k) || p.z < 0.3 || p.z > 0.6) return false;
    return near(Math.abs(p.r), Math.sqrt(1 - 2 * p.z * p.z), 0.005); };
  // Chapter 5
  CHECKS.iso = () => { const p = V('base-ctl'); return pos(p.m, p.k) && p.Y !== 0 && p.z >= 0.1 && TR(Math.abs(p.r), p.z) < 0.05; };
  CHECKS.shake = () => { const p = V('base-ctl'); const r = Math.abs(p.r); return pos(p.m, p.k) && p.Y !== 0 && near(p.z, 0.1, 0.002) && r < 1 && near(TR(r, p.z), 3, 0.06); };
  CHECKS.sqrt2 = () => { const p = V('base-ctl'); return pos(p.m, p.k) && p.z >= 0.3 && near(Math.abs(p.r), Math.SQRT2, 0.005); };
  CHECKS.dhurts = () => { const p = V('base-ctl'); return pos(p.m, p.k) && near(Math.abs(p.r), 3, 0.01) && near(TR(3, p.z), 0.2, 0.004); };
})();
