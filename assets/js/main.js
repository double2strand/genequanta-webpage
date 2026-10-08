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
/* hero: DNA double helix with docking PTM-modified proteins (pseudo-3D canvas) */
(() => { const c = $('#helix'), hero = c.closest('.hero'); let x, W, H; const resize = () => [x, W, H] = fit(c); resize(); addEventListener('resize', resize);
  const MK = { Ac: { col: '#00a99d', tf: 'TF · acetyl-K', h: 'Histone H3 · K27ac' }, Me: { col: '#6d4bff', tf: 'TF · methyl-R', h: 'Histone H3 · K4me3' }, P: { col: '#e08a00', tf: 'TF · phospho-S', h: 'Histone H3 · S10ph' }, Ub: { col: '#e0336a', tf: 'TF · ubiquitin-K', h: 'Histone H2A · K119ub' } };
  const ORDER = ['Ac', 'Me', 'P', 'Ub'], N = 56, mouse = { x: -1e4, y: -1e4, tx: 0, ty: 0 };
  let scrollY = 0, rot = 0, hover = null, last = 0, pts = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  // proteins: nucleosomes sit on the helix axis, TFs clamp onto a strand
  const P = [
    { k: 'nuc', f: .3, marks: ['Ac', 'Me'] }, { k: 'tf', f: .45, side: 1, marks: ['P'] }, { k: 'nuc', f: .63, marks: ['Ub', 'Me'] },
    { k: 'tf', f: .78, side: -1, marks: ['Ac'] }, { k: 'tf', f: .9, side: 1, marks: ['Me', 'P'] }, { k: 'tf', f: .17, side: -1, marks: ['Ub'] }
  ].map((p, i) => Object.assign(p, { b: RM ? 1 : (i % 3 === 2 ? 0 : 1), st: RM ? 'on' : (i % 3 === 2 ? 'off' : 'on'), tmr: rnd(5, 12), dir: i % 2 ? 1 : -1, sx: 0, sy: 0, r: 0 }));
  hero.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; if (RM) draw(last); });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; hover = null; hero.style.cursor = ''; if (RM) draw(last); });
  hero.addEventListener('click', e => { if (e.target.closest('a,button')) return; const r = c.getBoundingClientRect(); const p = hit(e.clientX - r.left, e.clientY - r.top);
    if (p) { const i = ORDER.indexOf(p.marks[0]); p.marks[0] = ORDER[(i + 1) % 4]; p.tmr = Math.max(p.tmr, 3); hover = p; if (RM) draw(last); } });
  addEventListener('scroll', () => scrollY = window.scrollY, { passive: true });
  const hit = (mx, my) => P.find(p => p.b > .6 && Math.hypot(p.sx - mx, p.sy - my) < p.r + 8) || null;
  const blob = (cx, cy, r, c1, c2, a) => { const g = x.createRadialGradient(cx - r * .35, cy - r * .4, r * .1, cx, cy, r); g.addColorStop(0, c1); g.addColorStop(1, c2); x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.globalAlpha = 1; };
  const chip = (cx, cy, m, a, big) => { const t = m, col = MK[m].col; x.font = `600 ${big ? 11 : 10}px JetBrains Mono, monospace`; const w = x.measureText(t).width + 10, h = big ? 18 : 16;
    x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, cx, cy + .5); x.globalAlpha = 1; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; };
  function draw(t) { last = t; const dt = Math.min(.05, t - (draw.t || t)); draw.t = t; x.clearRect(0, 0, W, H); const mobile = W < 760;
    const cx = mobile ? W * .5 : W * .72, len = mobile ? H * .58 : H * 1.05, top = mobile ? H * .05 : (H - len) / 2, amp = mobile ? Math.min(W * .26, 100) : Math.min(W * .11, 150), sc = mobile ? .8 : 1;
    rot = t * .45 + scrollY * .004 + mouse.tx * 1.2; const tilt = mouse.ty * .35;
    const S = []; for (let i = 0; i < N; i++) { const f = i / (N - 1), y = top + f * len, a = f * Math.PI * 5 + rot; for (let s = 0; s < 2; s++) { const ang = a + s * Math.PI, z = Math.sin(ang); S.push({ x: cx + Math.cos(ang) * amp + (y - H / 2) * tilt * .3, y: y + z * 12 * tilt, z }); } }
    const at = f => { const i = Math.min(N - 2, Math.floor(f * (N - 1))), u = f * (N - 1) - i, A = S[i * 2], B = S[(i + 1) * 2], A2 = S[i * 2 + 1], B2 = S[(i + 1) * 2 + 1]; return [{ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u, z: A.z }, { x: A2.x + (B2.x - A2.x) * u, y: A2.y + (B2.y - A2.y) * u, z: A2.z }]; };
    // binding dynamics
    for (const p of P) { if (RM) break; p.tmr -= dt;
      if (p.st === 'on' && p.tmr <= 0 && p !== hover) { if (P.filter(q => q.st === 'on').length > 4) p.st = 'leaving'; else p.tmr = rnd(1, 3); } if (p.st === 'leaving') { p.b -= dt * .7; if (p.b <= 0) { p.b = 0; p.st = 'off'; p.tmr = rnd(1.5, 4); } }
      if (p.st === 'off' && p.tmr <= 0) { p.st = 'docking'; p.marks[0] = ORDER[Math.floor(Math.random() * 4)]; } if (p.st === 'docking') { p.b += dt * .6; if (p.b >= 1) { p.b = 1; p.st = 'on'; p.tmr = rnd(5, 10); } } }
    // back strands, rungs
    for (let i = 0; i < N; i++) { const a = S[i * 2], b = S[i * 2 + 1], al = .14 + ((a.z + b.z) / 2 + 1) * .14; const g = x.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, `rgba(0,169,157,${al})`); g.addColorStop(1, `rgba(109,75,255,${al})`); x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
    for (let s = 0; s < 2; s++) { x.beginPath(); for (let i = 0; i < N; i++) { const p = S[i * 2 + s]; i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y); } x.strokeStyle = s ? 'rgba(109,75,255,.6)' : 'rgba(0,169,157,.65)'; x.lineWidth = 3; x.stroke(); }
    for (let i = 0; i < N; i++) for (let s = 0; s < 2; s++) { const p = S[i * 2 + s]; x.beginPath(); x.arc(p.x, p.y, 1.8 + (p.z + 1) * 1.4, 0, 7); x.fillStyle = s ? `rgba(109,75,255,${.35 + (p.z + 1) * .3})` : `rgba(0,169,157,${.35 + (p.z + 1) * .3})`; x.fill(); }
    // proteins
    let hv = null;
    for (const p of P) { if (p.b <= 0) continue; const e = RM ? 1 : (p.b < 1 ? (p.st === 'docking' ? 1 - Math.pow(1 - p.b, 3) : p.b * p.b) : 1), off = (1 - e) * 140 * p.dir * sc, a = Math.min(1, e * 1.2);
      const [s0, s1] = at(p.f);
      if (p.k === 'nuc') { const R = 50 * sc, px = cx + off + (s0.x + s1.x - 2 * cx) * .15, py = (s0.y + s1.y) / 2; p.sx = px; p.sy = py; p.r = R + 6;
        x.save(); x.shadowColor = 'rgba(11,21,51,.16)'; x.shadowBlur = 18; x.shadowOffsetY = 6; blob(px, py, R * 1.02, `rgba(238,236,255,${a})`, `rgba(150,138,255,${a})`, 1); x.restore();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([u, v], j) => blob(px + u * R * .4, py + v * R * .36, R * .48, '#f4f2ff', j % 2 ? '#8c7dff' : '#6f8dff', a));
        // DNA wrapping (~1.7 turns) in front of the octamer
        x.globalAlpha = a; x.lineWidth = 7 * sc; x.lineCap = 'round'; const wg = x.createLinearGradient(px - R, py, px + R, py); wg.addColorStop(0, '#00a99d'); wg.addColorStop(.5, '#0b8fb0'); wg.addColorStop(1, '#00a99d'); x.strokeStyle = wg; x.shadowColor = 'rgba(11,21,51,.25)'; x.shadowBlur = 4;
        for (let k = 0; k < 2; k++) { x.beginPath(); x.ellipse(px, py + (k - .5) * R * .5, R * 1.08, R * .32, -.12, -.15 * Math.PI, 1.15 * Math.PI, true); x.stroke(); }
        x.globalAlpha = 1; x.lineCap = 'butt'; x.shadowBlur = 0;
        p.marks.forEach((m, j) => { const ang = -Math.PI * .75 + j * Math.PI * .5 + Math.sin(t * 1.4 + j) * .06, tx = px + Math.cos(ang) * R * 1.55, ty = py + Math.sin(ang) * R * 1.35;
          x.strokeStyle = `rgba(11,21,51,${.35 * a})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px + Math.cos(ang) * R * .8, py + Math.sin(ang) * R * .75); x.quadraticCurveTo(px + Math.cos(ang + .3) * R * 1.25, py + Math.sin(ang + .3) * R * 1.1, tx, ty); x.stroke(); chip(tx, ty, m, a, !mobile); });
      } else { const s = p.side > 0 ? s0 : s1, R = 21 * sc, px = s.x + off, py = s.y; p.sx = px; p.sy = py; p.r = R * 1.6;
        x.save(); x.shadowColor = 'rgba(11,21,51,.14)'; x.shadowBlur = 12; x.shadowOffsetY = 4; blob(px - R * .55, py - R * .35, R, '#fff1f3', '#ff6f8c', a); blob(px + R * .55, py + R * .35, R, '#fff6ea', '#ffa94d', a); x.restore();
        x.globalAlpha = a; x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1.5; x.beginPath(); x.arc(px - R * .55, py - R * .35, R, 0, 7); x.stroke(); x.beginPath(); x.arc(px + R * .55, py + R * .35, R, 0, 7); x.stroke(); x.globalAlpha = 1;
        p.marks.forEach((m, j) => { const tx = px + (j ? -1 : 1) * R * 1.9, ty = py - R * 1.5 - j * 4; x.strokeStyle = `rgba(11,21,51,${.3 * a})`; x.lineWidth = 1.3; x.beginPath(); x.moveTo(px + (j ? -1 : 1) * R * .7, py - R * .6); x.lineTo(tx, ty + 6); x.stroke(); chip(tx, ty, m, a, !mobile); }); }
      if (p.b > .6 && Math.hypot(p.sx - mouse.x, p.sy - mouse.y) < p.r + 8) hv = p; }
    hover = hv; hero.style.cursor = hv ? 'pointer' : '';
    if (hv) { const lab = hv.k === 'nuc' ? MK[hv.marks[0]].h : MK[hv.marks[0]].tf, sub = hv.k === 'nuc' ? 'Nucleosome · click to change PTM' : 'Transcription factor · click to change PTM';
      x.font = '600 12px Inter, sans-serif'; const w = Math.max(x.measureText(lab).width, (x.font = '11px Inter, sans-serif', x.measureText(sub).width)) + 24; let tx = hv.sx + hv.r + 10, ty = Math.max(80, Math.min(H - 56, hv.sy - 26)); if (tx + w > W - 8) tx = hv.sx - hv.r - 10 - w;
      x.save(); x.shadowColor = 'rgba(11,21,51,.18)'; x.shadowBlur = 16; x.shadowOffsetY = 4; x.fillStyle = 'rgba(255,255,255,.97)'; x.beginPath(); x.roundRect(tx, ty, w, 46, 10); x.fill(); x.restore();
      x.fillStyle = MK[hv.marks[0]].col; x.beginPath(); x.arc(tx + 13, ty + 16, 4, 0, 7); x.fill(); x.fillStyle = '#0b1533'; x.font = '600 12px Inter, sans-serif'; x.fillText(lab, tx + 22, ty + 20); x.fillStyle = '#4d5a78'; x.font = '11px Inter, sans-serif'; x.fillText(sub, tx + 12, ty + 36); }
  }
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
  { t: 'Epigenetic Profiling', d: 'Mapping active epigenetic zones into longevity and lifestyle profiles', b: ['Active Epigenetic Zones', 'Longevity & Lifestyle Profiles'] },
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
    } else if (cur === 1) { // profiling: PTM-modified proteins bound along DNA + occupancy track
      const PK = [{ u: .12, k: 'tf', m: 'P' }, { u: .3, k: 'nuc', m: 'Ac' }, { u: .5, k: 'tf', m: 'Me' }, { u: .68, k: 'nuc', m: 'Ub' }, { u: .86, k: 'nuc', m: 'Me' }];
      const MC = { Ac: '#00a99d', Me: '#6d4bff', P: '#e08a00', Ub: '#e0336a' }, L = 24, Rr = W - 24, dy = H * .66, tb = H * .36;
      // occupancy track
      const occ = X => PK.reduce((a, p, i) => a + (p.k === 'nuc' ? .9 : .7) * (0.85 + .15 * Math.sin(t * 1.6 + i)) * Math.exp(-(((X - L) / (Rr - L) - p.u) ** 2) / (p.k === 'nuc' ? .0016 : .0007)), 0) + .04;
      x.beginPath(); x.moveTo(L, tb); for (let X = L; X <= Rr; X += 3) x.lineTo(X, tb - occ(X) * (tb - 34)); x.lineTo(Rr, tb); x.closePath();
      const og = x.createLinearGradient(L, 0, Rr, 0); PK.forEach(p => og.addColorStop(p.u, MC[p.m])); x.globalAlpha = .22; x.fillStyle = og; x.fill(); x.globalAlpha = 1;
      x.beginPath(); for (let X = L; X <= Rr; X += 3) { const Y = tb - occ(X) * (tb - 34); X === L ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.strokeStyle = og; x.lineWidth = 2; x.stroke();
      x.strokeStyle = 'rgba(11,21,51,.15)'; x.lineWidth = 1; x.beginPath(); x.moveTo(L, tb); x.lineTo(Rr, tb); x.stroke();
      // DNA double strand
      for (let s2 = 0; s2 < 2; s2++) { x.beginPath(); for (let X = L; X <= Rr; X += 3) { const Y = dy + Math.sin((X - L) * .09 + t * 1.2 + s2 * Math.PI) * 7; X === L ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.strokeStyle = s2 ? 'rgba(109,75,255,.7)' : 'rgba(0,169,157,.75)'; x.lineWidth = 2.5; x.stroke(); }
      for (let X = L; X <= Rr; X += 9) { x.strokeStyle = 'rgba(11,21,51,.10)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X, dy - 6); x.lineTo(X, dy + 6); x.stroke(); }
      // bound proteins with PTM chips
      PK.forEach((p, i) => { const X = L + p.u * (Rr - L), bob = Math.sin(t * 1.6 + i) * 1.5;
        x.strokeStyle = 'rgba(11,21,51,.12)'; x.setLineDash([2, 3]); x.beginPath(); x.moveTo(X, tb + 2); x.lineTo(X, dy - 24); x.stroke(); x.setLineDash([]);
        x.save(); x.shadowColor = 'rgba(11,21,51,.16)'; x.shadowBlur = 8; x.shadowOffsetY = 3;
        if (p.k === 'nuc') { const r = 19; const g = x.createRadialGradient(X - 6, dy - 6 + bob, 2, X, dy + bob, r); g.addColorStop(0, '#f1efff'); g.addColorStop(1, '#8c7dff'); x.fillStyle = g; x.beginPath(); x.arc(X, dy + bob, r, 0, 7); x.fill(); x.restore();
          x.strokeStyle = '#00a99d'; x.lineWidth = 3.5; x.lineCap = 'round'; for (let k = 0; k < 2; k++) { x.beginPath(); x.ellipse(X, dy + bob + (k - .5) * 9, r * 1.1, 5, -.1, Math.PI * 1.05, Math.PI * -.05, true); x.stroke(); } x.lineCap = 'butt'; }
        else { const r = 10; [[-6, -3, '#ff6f8c'], [6, 3, '#ffa94d']].forEach(([ox, oy, c2]) => { const g = x.createRadialGradient(X + ox - 3, dy - 10 + oy - 3 + bob, 1, X + ox, dy - 10 + oy + bob, r); g.addColorStop(0, '#fff'); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.arc(X + ox, dy - 10 + oy + bob, r, 0, 7); x.fill(); }); x.restore(); }
        const cy = dy - (p.k === 'nuc' ? 34 : 34) + bob; x.font = '600 10px JetBrains Mono'; const w = x.measureText(p.m).width + 10; x.fillStyle = MC[p.m]; x.beginPath(); x.roundRect(X - w / 2 + (p.k === 'nuc' ? 14 : 12), cy - 8, w, 16, 8); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.m, X + (p.k === 'nuc' ? 14 : 12), cy + .5); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; });
      x.fillStyle = 'rgba(11,21,51,.62)'; x.font = '10px JetBrains Mono'; x.fillText('modified-protein occupancy', 24, 18);
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
/* karyotype: see assets/js/karyotype.js */
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
