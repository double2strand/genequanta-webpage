/* GeneQuanta strata round: differential-zone schematic, black box, explorer species deep link (#explorer?species=dog) */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  /* Illustrative disease vs control schematic (deterministic, not data) */
  const svg = $('#diffz-svg');
  if (svg) {
    const N = 64, W = 640, x0 = 70, bw = (W - x0 - 10) / N, zones = [[9, 15], [30, 36], [48, 52]];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const frag = document.createDocumentFragment();
    zones.forEach(([a, b], k) => { frag.appendChild(el('rect', { class: 'z', x: x0 + a * bw - 2, y: 4, width: (b - a) * bw + 4, height: 142, rx: 6 }));
      const t = el('text', { class: 'zl', x: x0 + a * bw, y: 16 }); t.textContent = 'ZONE ' + (k + 1); frag.appendChild(t); });
    [['CONTROL', 70], ['DISEASE', 136]].forEach(([l, y]) => { const t = el('text', { x: 0, y: y - 4 }); t.textContent = l; frag.appendChild(t); });
    for (let i = 0; i < N; i++) {
      const base = 10 + rnd() * 22, inZ = zones.some(([a, b]) => i >= a && i < b);
      const dis = inZ ? base + 18 + rnd() * 14 : base + (rnd() - .5) * 6;
      const x = x0 + i * bw + 1, w = Math.max(2, bw - 3), d = Math.min(i * 12, 700) + 'ms';
      const c = el('rect', { class: 'c', x, y: 72 - base, width: w, height: base, rx: 1 }); c.style.transitionDelay = d;
      const r = el('rect', { class: 'd' + (inZ ? ' hot' : ''), x, y: 138 - dis, width: w, height: dis, rx: 1 }); r.style.transitionDelay = d;
      frag.appendChild(c); frag.appendChild(r);
    }
    svg.appendChild(frag);
  }

  /* Black box: opens when scrolled into view; toggle button */
  const box = $('#bbox'), tog = box && $('.bb-toggle', box);
  if (box) {
    const set = o => { box.classList.toggle('open', o); tog.setAttribute('aria-pressed', String(!o)); tog.textContent = o ? 'Close the box' : 'Open the box'; };
    if (RM || !('IntersectionObserver' in window)) set(true);
    else { set(false); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { set(true); io.disconnect(); } }), { threshold: .2, rootMargin: '0px 0px -20% 0px' }); io.observe(box); }
    tog.addEventListener('click', () => set(!box.classList.contains('open')));
  }

  /* Deep link: #explorer?species=dog|cat|human (also #explorer-dog, ?species=dog#explorer) */
  const parse = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    let m = h.match(/^explorer(?:[?&-](?:species=)?([a-z]+))?/i);
    if (!m) return null;
    const q = new URLSearchParams(location.search).get('species');
    return { sp: ((m && m[1]) || q || '').toLowerCase() };
  };
  const go = (smooth) => {
    const r = parse(); if (!r) return;
    const tab = r.sp && document.getElementById('kt-' + r.sp);
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
    const wrap = $('#explorer'); if (!wrap) return;
    wrap.scrollIntoView({ behavior: smooth && !RM ? 'smooth' : 'auto', block: 'start' });
    if (!RM) { wrap.classList.remove('flash'); void wrap.offsetWidth; wrap.classList.add('flash'); }
  };
  addEventListener('hashchange', () => go(true));
  if (location.hash.toLowerCase().startsWith('#explorer')) {
    go(false);
    addEventListener('load', () => setTimeout(() => go(false), 120), { once: true });
  }
})();
