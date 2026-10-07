(() => {
document.documentElement.classList.add('js');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DPR = Math.min(devicePixelRatio || 1, 2);
const fit = (c) => { const r = c.getBoundingClientRect(); c.width = r.width * DPR; c.height = r.height * DPR; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return [x, r.width, r.height]; };
const visible = new WeakMap();
const io2 = new IntersectionObserver(es => es.forEach(e => visible.set(e.target, e.isIntersecting)));
function loop(canvas, draw) { // runs draw(t) only while visible
  io2.observe(canvas); let t0 = performance.now();
  const f = (t) => { if (visible.get(canvas) !== false) draw((t - t0) / 1000); if (!RM) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
{ const y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear() || 2026; }
/* nav */
const burger = $('.burger'), ul = $('#navlinks');
burger.onclick = () => { const o = ul.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
$$('#navlinks a').forEach(a => a.onclick = () => { ul.classList.remove('open'); burger.setAttribute('aria-expanded', false); });
const secs = $$('main section[id]');
const nio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('#navlinks a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
secs.forEach(s => nio.observe(s));
/* reveal + counters */
const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; rio.observe(el); });
const cio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; cio.unobserve(e.target); const el = e.target, n = +el.dataset.count, t0 = performance.now();
  const step = t => { const p = RM ? 1 : Math.min(1, (t - t0) / 1600), v = Math.round(n * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en-GB'); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }));
$$('[data-count]').forEach(el => cio.observe(el));
/* tilt + spotlight */
if (!RM && matchMedia('(hover:hover)').matches) $$('.tilt').forEach(el => {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; el.style.transform = `perspective(900px) rotateX(${(.5 - y) * 6}deg) rotateY(${(x - .5) * 8}deg)`; el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%'); });
  el.addEventListener('pointerleave', () => el.style.transform = '');
});
/* background particle network */
(() => { const c = $('#bg-net'); let x, W, H, P = [];
  const init = () => { [x, W, H] = fit(c); const n = Math.min(70, Math.floor(W * H / 22000)); P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 })); };
  init(); addEventListener('resize', init);
  const draw = () => { x.clearRect(0, 0, W, H); for (const p of P) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 140) { x.strokeStyle = `rgba(47,91,255,${(1 - d / 140) * .22})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
    x.fillStyle = 'rgba(0,169,157,.5)'; for (const p of P) { x.beginPath(); x.arc(p.x, p.y, 1.3, 0, 7); x.fill(); } };
  if (RM) draw(); else (function f() { draw(); requestAnimationFrame(f); })();
})();
/* hero DNA helix (pseudo-3D canvas) */
(() => { const c = $('#helix'); let x, W, H; const resize = () => [x, W, H] = fit(c); resize(); addEventListener('resize', resize);
  const N = 46, meth = Array.from({ length: N }, (_, i) => Math.random() < .28), mouse = { x: -1e4, y: -1e4, tx: 0, ty: 0 }; let scrollY = 0, rot = 0;
  c.closest('.hero').addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.tx = (e.clientX / innerWidth - .5); mouse.ty = (e.clientY / innerHeight - .5); });
  c.closest('.hero').addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  c.closest('.hero').addEventListener('click', e => { const r = c.getBoundingClientRect(); let best = -1, bd = 40; pts.forEach((p, i) => { const d = Math.hypot(p[0] - (e.clientX - r.left), p[1] - (e.clientY - r.top)); if (d < bd) { bd = d; best = i; } }); if (best >= 0) meth[best >> 1] = !meth[best >> 1]; });
  addEventListener('scroll', () => scrollY = scrollY * 0 + window.scrollY, { passive: true });
  let pts = [];
  const draw = (t) => { x.clearRect(0, 0, W, H); const mobile = W < 760;
    const cx = mobile ? W * .5 : W * .72, len = mobile ? H * .55 : H * 1.05, top = mobile ? H * .06 : (H - len) / 2, amp = mobile ? Math.min(W * .32, 120) : Math.min(W * .14, 190);
    rot = t * .55 + scrollY * .004 + mouse.tx * 1.2; const tiltX = mouse.ty * .35;
    const S = []; pts = [];
    for (let i = 0; i < N; i++) { const f = i / (N - 1), y = top + f * len, a = f * Math.PI * 4.2 + rot;
      for (let s = 0; s < 2; s++) { const ang = a + s * Math.PI, z = Math.sin(ang), px = cx + Math.cos(ang) * amp + (y - H / 2) * tiltX * .3, py = y + z * 14 * tiltX; S.push({ i, s, x: px, y: py, z }); pts.push([px, py]); } }
    // rungs
    for (let i = 0; i < N; i++) { const a = S[i * 2], b = S[i * 2 + 1], z = (a.z + b.z) / 2, al = .18 + (z + 1) * .2;
      const g = x.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, `rgba(0,169,157,${al})`); g.addColorStop(1, `rgba(109,75,255,${al})`); x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
    // backbones
    for (let s = 0; s < 2; s++) { x.beginPath(); for (let i = 0; i < N; i++) { const p = S[i * 2 + s]; i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y); } x.strokeStyle = s ? 'rgba(109,75,255,.55)' : 'rgba(0,169,157,.55)'; x.lineWidth = 2.5; x.stroke(); }
    // nodes sorted by depth
    S.slice().sort((p, q) => p.z - q.z).forEach(p => { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y), near = Math.max(0, 1 - d / 160), r = 3 + (p.z + 1) * 2.2 + near * 4, m = meth[p.i] && p.s === 0;
      x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fillStyle = m ? `rgba(255,77,109,${.55 + (p.z + 1) * .22})` : (p.s ? `rgba(109,75,255,${.4 + (p.z + 1) * .28})` : `rgba(0,169,157,${.4 + (p.z + 1) * .28})`); x.shadowBlur = m ? 8 : near * 12; x.shadowColor = m ? '#ff4d6d' : (p.s ? '#6d4bff' : '#00a99d'); x.fill(); x.shadowBlur = 0;
      if (m && p.z > .2) { x.font = '500 10px JetBrains Mono, monospace'; x.fillStyle = 'rgba(255,77,109,.85)'; x.fillText('CH₃', p.x + r + 4, p.y + 3); } });
    if (!RM && Math.random() < .015) { const k = Math.floor(Math.random() * N); meth[k] = !meth[k]; }
  };
  RM ? draw(0) : loop(c, draw);
})();
/* service card mini-visuals (SVG) */
(() => { const ns = 'http://www.w3.org/2000/svg', el = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const bars = $('.bars'); for (let i = 0; i < 22; i++) { const h = 15 + Math.abs(Math.sin(i * 1.7) * 70) + (i % 3) * 6; const r = el('rect', { x: 10 + i * 8.3, y: 110 - h, width: 5, height: h, rx: 2, fill: i % 5 === 2 ? '#ff4d6d' : 'url(#bg1)' }); r.innerHTML = RM ? '' : `<animate attributeName="height" values="${h};${h * .6};${h}" dur="${2 + i % 4 * .5}s" repeatCount="indefinite"/><animate attributeName="y" values="${110 - h};${110 - h * .6};${110 - h}" dur="${2 + i % 4 * .5}s" repeatCount="indefinite"/>`; bars.appendChild(r); }
  bars.parentNode.insertAdjacentHTML('afterbegin', '<defs><linearGradient id="bg1" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#6d4bff"/><stop offset="1" stop-color="#00a99d"/></linearGradient></defs>');
  const pl = $('.plate'); for (let r = 0; r < 6; r++) for (let c = 0; c < 12; c++) { const v = (Math.sin(r * 3.1 + c * 1.3) + 1) / 2; const ci = el('circle', { cx: 20 + c * 14.5, cy: 20 + r * 16, r: 5.2, fill: `hsl(${190 + v * 150},85%,${48 + v * 6}%)`, opacity: .35 + v * .6 }); if (!RM) ci.innerHTML = `<animate attributeName="opacity" values="${.3 + v * .6};1;${.3 + v * .6}" dur="${3}s" begin="${(c + r) * .12}s" repeatCount="indefinite"/>`; pl.appendChild(ci); }
  const wv = $('.wave'); [['#00a99d', 0], ['#f59e0b', 1.3], ['#ff4d6d', 2.4]].forEach(([col, ph], k) => { let d = ''; for (let i = 0; i <= 40; i++) { const X = 5 + i * 4.75, Y = 60 + Math.sin(i * .35 + ph) * (18 - k * 4) + Math.sin(i * .9 + ph) * 6; d += (i ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1); } wv.appendChild(el('path', { d, fill: 'none', stroke: col, 'stroke-width': 2, opacity: .85 })); });
  for (let i = 0; i < 6; i++) wv.appendChild(el('line', { x1: 15 + i * 34, x2: 15 + i * 34, y1: 12, y2: 108, stroke: 'rgba(11,21,51,.08)', 'stroke-dasharray': '2 4' }));
})();
/* pipeline explorer */
(() => { const D = [
  { t: 'Time-Course Analysis', d: 'Advanced temporal profiling of epigenetic changes over time periods', b: ['Dynamic Tracking', 'Temporal Patterns', 'Longitudinal Studies'] },
  { t: 'Epigenetic Profiling', d: 'Comprehensive methylation and histone modification analysis', b: ['DNA Methylation', 'Histone Marks', 'Chromatin States'] },
  { t: 'High-Throughput Processing', d: 'Scalable biomarker panel development and analysis', b: ['Batch Processing', 'Quality Control', 'Automated Workflows'] },
  { t: 'Real-Time Analytics', d: 'Instant data processing and visualization capabilities', b: ['Live Updates', 'Interactive Dashboards', 'API Access'] }];
  let cur = 0, timer; const btns = $$('.pipe-steps button'), c = $('#pipe-viz'); let x, W, H; const rs = () => [x, W, H] = fit(c); rs(); addEventListener('resize', rs);
  const set = (i, user) => { cur = i; btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.style.animation = 'none'; }); $('#pp-t').textContent = D[i].t; $('#pp-d').textContent = D[i].d; $('#pp-b').innerHTML = D[i].b.map(s => `<span>${s}</span>`).join(''); if (user) clearInterval(timer); };
  btns.forEach((b, i) => { b.onclick = () => set(i, true); b.onkeydown = e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4; btns[n].focus(); set(n, true); } }; });
  set(0); if (!RM) timer = setInterval(() => { if (visible.get(c)) set((cur + 1) % 4); }, 6000);
  const draw = (t) => { x.clearRect(0, 0, W, H); x.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 32) { x.strokeStyle = 'rgba(11,21,51,.04)'; x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
    if (cur === 0) { // time-course: methylation trajectories across timepoints
      const T = 6; for (let k = 0; k < 5; k++) { x.beginPath(); for (let i = 0; i <= 60; i++) { const X = 30 + i / 60 * (W - 60), v = .5 + .35 * Math.sin(i / 60 * 5 + k * 1.3 + t * .6) * Math.cos(k + i / 30); i ? x.lineTo(X, 30 + v * (H - 60)) : x.moveTo(X, 30 + v * (H - 60)); } x.strokeStyle = ['#00a99d', '#6d4bff', '#ff4d6d', '#f59e0b', '#2f7bff'][k]; x.lineWidth = 2; x.globalAlpha = .8; x.stroke(); x.globalAlpha = 1; }
      for (let i = 0; i < T; i++) { const X = 30 + i / (T - 1) * (W - 60); x.fillStyle = 'rgba(11,21,51,.55)'; x.font = '10px JetBrains Mono'; x.fillText('T' + i, X - 6, H - 10); }
      const sx = 30 + ((t * .15) % 1) * (W - 60); x.strokeStyle = 'rgba(0,169,157,.6)'; x.beginPath(); x.moveTo(sx, 20); x.lineTo(sx, H - 24); x.stroke();
    } else if (cur === 1) { // profiling: CpG lollipop + histone marks
      const n = 28; for (let i = 0; i < n; i++) { const X = 24 + i * (W - 48) / (n - 1), lvl = (Math.sin(i * 2.3) + 1) / 2, on = lvl > .5; x.strokeStyle = 'rgba(11,21,51,.25)'; x.beginPath(); x.moveTo(X, H * .62); x.lineTo(X, H * .38); x.stroke();
        x.beginPath(); x.arc(X, H * .38, 6, 0, 7); x.fillStyle = on ? '#ff4d6d' : '#fff'; x.strokeStyle = on ? '#ff4d6d' : '#2f7bff'; x.fill(); x.stroke(); }
      x.fillStyle = 'rgba(109,75,255,.5)'; x.fillRect(24, H * .62, W - 48, 4);
      for (let i = 0; i < 9; i++) { const X = 40 + i * (W - 80) / 8, r = 14 + Math.sin(t * 2 + i) * 1.5; x.beginPath(); x.arc(X, H * .78, r, 0, 7); x.fillStyle = 'rgba(109,75,255,.25)'; x.strokeStyle = '#6d4bff'; x.fill(); x.stroke(); x.fillStyle = '#f59e0b'; x.font = '9px JetBrains Mono'; x.fillText(['ac', 'me3', 'me1', 'ac', 'me2', 'ub', 'me3', 'ac', 'ph'][i], X - 7, H * .78 + 3); }
      x.fillStyle = 'rgba(11,21,51,.6)'; x.font = '10px JetBrains Mono'; x.fillText('CpG methylation', 24, 20); x.fillText('nucleosomes · histone marks', 24, H - 8);
    } else if (cur === 2) { // HT: plate wells lighting in sequence
      const R = 8, C = 12, cw = (W - 40) / C, ch = (H - 40) / R, k = Math.floor(t * 14) % (R * C);
      for (let r = 0; r < R; r++) for (let cc = 0; cc < C; cc++) { const id = r * C + cc, done = id < k, v = (Math.sin(id * 12.9898) * 43758.5453) % 1; x.beginPath(); x.arc(20 + cw * (cc + .5), 20 + ch * (r + .5), Math.min(cw, ch) * .32, 0, 7);
        x.fillStyle = done ? `hsla(${190 + Math.abs(v) * 150},80%,52%,.9)` : 'rgba(11,21,51,.06)'; x.fill(); if (id === k) { x.strokeStyle = '#0b1533'; x.lineWidth = 2; x.stroke(); x.lineWidth = 1; } }
    } else { // real-time: streaming chart
      x.beginPath(); for (let i = 0; i <= 80; i++) { const X = i / 80 * W, v = Math.sin(i * .25 - t * 3) * .18 + Math.sin(i * .07 - t) * .2 + .5; i ? x.lineTo(X, v * H) : x.moveTo(X, v * H); } x.strokeStyle = '#00a99d'; x.lineWidth = 2; x.stroke(); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,169,157,.25)'); g.addColorStop(1, 'rgba(0,169,157,0)'); x.fillStyle = g; x.fill();
      x.fillStyle = '#ff4d6d'; x.beginPath(); const v = Math.sin(80 * .25 - t * 3) * .18 + Math.sin(80 * .07 - t) * .2 + .5; x.arc(W - 6, v * H, 5, 0, 7); x.fill(); x.fillStyle = 'rgba(11,21,51,.7)'; x.font = '10px JetBrains Mono'; x.fillText('● LIVE  stream', 14, 20);
    } };
  RM ? draw(1) : loop(c, draw);
})();
/* platforms */
(() => { const P = {
  portal: { n: 'portal.genequanta', t: 'Personal Data Portal', d: 'Track your epigenetic assays, monitor test results, and discover personalized insights', f: ['Real-time assay tracking & status updates', 'Interactive test result visualization', 'Personalized health insights dashboard', 'Biomarker trend analysis over time', 'Lifestyle correlation mapping', 'Secure data storage & privacy controls'], m: [['Live', 'Assay tracking'], ['Visual', 'Test results'], ['Trends', 'Over time'], ['Secure', 'Data & privacy']] },
  kit: { n: 'kit.genequanta', t: 'Individual Testing Platform', d: 'Personalized epigenetic analysis connecting genetics to lifestyle', f: ['Saliva-based sample collection', 'Time-course epigenetic profiling', 'Lifestyle correlation analysis', 'Personalized health reports', 'Genetic counseling support', 'Mobile app integration'], m: [['Saliva', 'Sample collection'], ['Time-course', 'Profiling'], ['Lifestyle', 'Correlation'], ['Counseling', 'Support']] } };
  let cur = 'portal'; const c = $('#dash-chart'); let x, W, H; const rs = () => [x, W, H] = fit(c); rs(); addEventListener('resize', rs);
  const set = k => { cur = k; const p = P[k]; $$('[data-p]').forEach(b => b.setAttribute('aria-selected', b.dataset.p === k)); $('#pl-n').textContent = p.n; $('#pl-t').textContent = p.t; $('#pl-d').textContent = p.d; $('#pl-f').innerHTML = p.f.map(s => `<li>${s}</li>`).join(''); $('#pl-m').innerHTML = p.m.map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join(''); };
  $$('[data-p]').forEach(b => b.onclick = () => set(b.dataset.p)); set('portal');
  const draw = t => { x.clearRect(0, 0, W, H); const kit = cur === 'kit';
    for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 50; i++) { const X = 10 + i / 50 * (W - 20), v = kit ? .5 + .3 * Math.sin(i * .2 + k * 2 + t * .8) * Math.exp(-((i - 25) ** 2) / 600) : .55 + .25 * Math.sin(i * .18 + k + t * .7) - k * .1; i ? x.lineTo(X, 15 + v * (H - 30)) : x.moveTo(X, 15 + v * (H - 30)); } x.strokeStyle = ['#00a99d', '#6d4bff', '#ff4d6d'][k]; x.lineWidth = 2; x.stroke(); } };
  RM ? draw(0) : loop(c, draw);
})();
/* karyotype */
(() => { const S = { human: [46, '23 pairs'], dog: [78, '39 pairs'], cat: [38, '19 pairs'] }, svg = $('#k-svg');
  const draw = sp => { const n = S[sp][0] / 2, W = 900, H = 240; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = ''; const perRow = n > 24 ? 20 : n > 20 ? 12 : 10, rows = Math.ceil(n / perRow), cw = W / perRow;
    for (let i = 0; i < n; i++) { const r = Math.floor(i / perRow), c = i % perRow, max = H / rows - 26, len = max * (sp === 'dog' ? (i === n - 1 ? .9 : .9 - i / n * .55) : (1 - i / n * .6)) * (i === n - 1 && sp !== 'dog' ? .7 : 1), x0 = c * cw + cw / 2, y0 = r * (H / rows) + 6 + (max - len);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('tabindex', 0); g.setAttribute('aria-label', (i === n - 1 ? 'Sex chromosomes' : 'Pair ' + (i + 1)));
      const cen = sp === 'dog' && i < n - 1 ? .06 : .35 + (i % 3) * .08, hue = 200 + i / n * 150;
      g.innerHTML = [-6, 3].map(dx => `<rect x="${x0 + dx}" y="${y0}" width="7" height="${len}" rx="3.5" fill="hsl(${hue},78%,52%)" opacity=".9"/>` + [.2, .5, .72].map(f => `<rect x="${x0 + dx}" y="${y0 + len * f}" width="7" height="${len * .06}" fill="rgba(255,255,255,.6)"/>`).join('') + `<rect x="${x0 + dx - 1}" y="${y0 + len * cen}" width="9" height="3" fill="#ffffff"/>`).join('') + `<text x="${x0}" y="${y0 + len + 14}" fill="#5a6785" font-size="10" font-family="JetBrains Mono" text-anchor="middle">${i === n - 1 ? (sp === 'human' ? 'XY' : 'XY') : i + 1}</text>`;
      const on = () => { svg.querySelectorAll('g').forEach(o => o.classList.toggle('dim', o !== g)); g.classList.add('hi'); $('#k-sel').textContent = '▸ ' + g.getAttribute('aria-label'); };
      const off = () => { svg.querySelectorAll('g').forEach(o => o.classList.remove('dim', 'hi')); $('#k-sel').textContent = ''; };
      g.addEventListener('pointerenter', on); g.addEventListener('focus', on); g.addEventListener('pointerleave', off); g.addEventListener('blur', off); svg.appendChild(g); } };
  const set = sp => { $$('[data-s]').forEach(b => b.setAttribute('aria-selected', b.dataset.s === sp)); const el = $('#k-n'), from = +el.textContent, to = S[sp][0], t0 = performance.now();
    const st = t => { const p = RM ? 1 : Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); $('#k-p').textContent = S[sp][1]; draw(sp); };
  $$('[data-s]').forEach(b => b.onclick = () => set(b.dataset.s)); set('human');
})();
/* news tabs */
$$('[data-n]').forEach(b => b.onclick = () => { $$('[data-n]').forEach(o => o.setAttribute('aria-selected', o === b)); $('#news-live').hidden = b.dataset.n !== 'live'; $('#news-co').hidden = b.dataset.n === 'live'; });
/* contact */
(() => { const f = $('#cform'), types = $$('[role=radio]', f); let type = 'General Inquiry';
  const pick = name => types.forEach(b => { const on = b.textContent === name; b.setAttribute('aria-checked', on); if (on) type = name; });
  types.forEach(b => b.onclick = () => pick(b.textContent));
  $$('[data-topic]').forEach(b => b.addEventListener('click', e => { pick(b.dataset.topic); if (b.tagName === 'BUTTON') { e.preventDefault(); $('#contact').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } setTimeout(() => f.first.focus({ preventScroll: true }), 600); }));
  f.onsubmit = e => { e.preventDefault(); const bad = [...f.querySelectorAll('[required]')].filter(i => !i.checkValidity()); f.querySelectorAll('input,textarea').forEach(i => i.style.borderColor = ''); if (bad.length) { bad.forEach(i => i.style.borderColor = '#ff4d6d'); bad[0].focus(); $('#cform-note').textContent = 'Please complete the required fields.'; return; }
    const v = n => f[n].value.trim(), body = `${v('msg')}\n\n— ${v('first')} ${v('last')}${v('org') ? ', ' + v('org') : ''}\n${v('email')}\nInquiry type: ${type}`;
    location.href = `mailto:info@genequanta.com?subject=${encodeURIComponent('[' + type + '] ' + v('subject'))}&body=${encodeURIComponent(body)}`; $('#cform-note').textContent = 'Your email app should open with the message ready to send.'; };
})();
})();
