/* GeneQuanta — Comparative Chromosome Analysis (interactive karyotype + chromosome detail view).
   Data: assets/js/karyotype-data.js (window.GQ_KARYO), generated from UCSC / NCBI / OMIA — see karyotype_sources.md. */
(() => {
  const D = window.GQ_KARYO, root = document.getElementById('karyo');
  if (!D || !root) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mb = (bp, d = 1) => (bp / 1e6).toFixed(d);
  const CAT = { Disease: { c: '#f08a9c', k: 'dis' }, Lifestyle: { c: '#5ccbb8', k: 'life' }, Longevity: { c: '#d9b660', k: 'long' } };
  // UCSC gieStain order used in the data file: gneg, gpos25, gpos50, gpos75, gpos100, acen, gvar, stalk
  const STAIN = ['#eceef1', '#c3c6cc', '#959aa2', '#666a72', '#383b41', '#c98b97', '#9db3c9', '#d5d8dc'];
  const STAIN_N = ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'acen', 'gvar', 'stalk'];
  const tabs = $$('.seg [data-s]', root), grid = $('#k-grid', root), det = $('#k-detail', root),
    body = $('#k-panel', root), soon = $('#k-soon', root), sel = $('#k-sel', root);
  let sp = 'human', cur = -1, lastBtn = null, uid = 0;

  const S = () => D[sp];
  const nm = (c, short) => sp === 'human' ? (short ? c.id : 'Chromosome ' + c.id) : (D[sp].prefix + ' ' + c.id);
  const cenMid = c => c.cen ? (c.cen[0] + c.cen[1]) / 2 : null;
  const rankOf = c => [...S().chroms].sort((a, b) => b.len - a.len).indexOf(c) + 1;

  /* ---------- small vertical chromosome (grid) ---------- */
  function mini(c, i, h) {
    const w = 22, cw = 7, gap = 2, x0 = (w - 2 * cw - gap) / 2, L = c.len, y = bp => 2 + (bp / L) * (h - 4), id = `kc${++uid}`;
    const cm = cenMid(c), acro = c.cen && c.cen[1] <= L * 0.03, hue = 205 + (i / S().chroms.length) * 140;
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><defs>`;
    for (let k = 0; k < 2; k++) {
      const x = x0 + k * (cw + gap);
      s += `<clipPath id="${id}-${k}">` + (cm && !acro
        ? `<rect x="${x}" y="2" width="${cw}" height="${Math.max(cw, y(cm) - 2)}" rx="${cw / 2}"/><rect x="${x}" y="${y(cm)}" width="${cw}" height="${Math.max(cw, h - 2 - y(cm))}" rx="${cw / 2}"/>`
        : `<rect x="${x}" y="2" width="${cw}" height="${h - 4}" rx="${cw / 2}"/>`) + `</clipPath>`;
    }
    s += `<linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d828b"/><stop offset=".45" stop-color="#eceef0"/><stop offset="1" stop-color="#9a9ea6"/></linearGradient></defs>`;
    for (let k = 0; k < 2; k++) {
      const x = x0 + k * (cw + gap);
      s += `<g clip-path="url(#${id}-${k})">`;
      if (c.bands) c.bands.forEach(b => { s += `<rect x="${x}" y="${y(b[0])}" width="${cw}" height="${Math.max(.6, y(b[1]) - y(b[0]))}" fill="${STAIN[b[3]]}"/>`; });
      else s += `<rect x="${x}" y="0" width="${cw}" height="${h}" fill="url(#${id}-g)"/>`;
      if (acro) s += `<rect x="${x}" y="2" width="${cw}" height="2.2" fill="#2a2c31"/>`;
      s += `</g><g fill="none" stroke="rgba(255,255,255,.3)" stroke-width=".8">` + (cm && !acro
        ? `<rect x="${x}" y="2" width="${cw}" height="${Math.max(cw, y(cm) - 2)}" rx="${cw / 2}"/><rect x="${x}" y="${y(cm)}" width="${cw}" height="${Math.max(cw, h - 2 - y(cm))}" rx="${cw / 2}"/>`
        : `<rect x="${x}" y="2" width="${cw}" height="${h - 4}" rx="${cw / 2}"/>`) + `</g>`;
    }
    const lc = CAT[c.locus.cat].c, sites = c.locus.sites || [[c.locus.start, c.locus.end]];
    sites.forEach(t => { const ly = y((t[0] + t[1]) / 2); s += `<rect class="k-tick" x="${x0 - 1.5}" y="${ly - 1.2}" width="${2 * cw + gap + 3}" height="2.4" rx="1.2" fill="${lc}" stroke="#0b0b0d" stroke-width=".7" paint-order="stroke"/>`; });
    return s + '</svg>';
  }

  function renderGrid() {
    const sd = S(), ch = sd.chroms, n = ch.length, W = grid.clientWidth || 600, maxL = Math.max(...ch.map(c => c.len));
    const minCell = sp === 'dog' ? 25 : 32, maxPer = Math.max(4, Math.floor(W / minCell)), rows = Math.ceil(n / maxPer), per = Math.ceil(n / rows);
    const rowH = rows === 1 ? 200 : rows === 2 ? 128 : W < 420 ? 96 : 110;
    let html = '';
    for (let r = 0; r < rows; r++) {
      html += `<div class="k-row" style="--per:${per}">`;
      ch.slice(r * per, r * per + per).forEach((c, j) => {
        const i = r * per + j, h = Math.max(16, Math.round(rowH * c.len / maxL));
        html += `<button type="button" class="k-chr" data-i="${i}" style="--d:${i * 14}ms" aria-label="${esc(nm(c))}, ${mb(c.len)} megabases. Featured gene ${esc(c.locus.gene)} (${c.locus.cat}). Open detail view.">
          <span class="k-fig" style="height:${rowH}px">${mini(c, i, h)}</span><span class="k-lab mono">${esc(c.id)}</span></button>`;
      });
      html += '</div>';
    }
    grid.innerHTML = html;
    grid.classList.remove('k-in'); void grid.offsetWidth; grid.classList.add('k-in');
    $$('.k-chr', grid).forEach(b => {
      const c = ch[+b.dataset.i];
      const on = () => { grid.classList.add('has-hi'); b.classList.add('hi'); sel.textContent = `▸ ${nm(c)} · ${mb(c.len)} Mb · ${c.locus.gene} (${c.locus.cat})`; };
      const off = () => { grid.classList.remove('has-hi'); b.classList.remove('hi'); sel.textContent = ''; };
      b.addEventListener('pointerenter', on); b.addEventListener('pointerleave', off); b.addEventListener('focus', on); b.addEventListener('blur', off);
      b.addEventListener('click', () => open(+b.dataset.i, b));
    });
  }
  grid.addEventListener('keydown', e => {
    const bs = $$('.k-chr', grid), i = bs.indexOf(document.activeElement); if (i < 0) return;
    const m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (m) { e.preventDefault(); bs[(i + m + bs.length) % bs.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); bs[0].focus(); } else if (e.key === 'End') { e.preventDefault(); bs[bs.length - 1].focus(); }
  });

  /* ---------- large horizontal ideogram (detail) ---------- */
  function ideogram(c, W) {
    const L = 14, R = W - 14, iy = 46, ih = 30, Lb = c.len, x = bp => L + (bp / Lb) * (R - L), id = `kd${++uid}`;
    const cm = cenMid(c), acro = c.cen && c.cen[1] <= Lb * 0.03, lc = CAT[c.locus.cat].c, H = 148;
    const arms = cm && !acro ? [[L, x(cm)], [x(cm), R]] : [[L, R]];
    const caps = arms.map(([a, b]) => `<rect x="${a}" y="${iy}" width="${Math.max(ih, b - a)}" height="${ih}" rx="${ih / 2}"/>`).join('');
    let s = `<svg class="kd-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(nm(c))} ideogram, ${mb(c.len)} megabases, with ${esc(c.locus.gene)} highlighted">
      <defs><clipPath id="${id}-c">${caps}</clipPath>
      <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0f1f3"/><stop offset=".5" stop-color="#b9bcc2"/><stop offset="1" stop-color="#7d828b"/></linearGradient>
      <linearGradient id="${id}-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
      <g class="kd-ideo"><g clip-path="url(#${id}-c)">`;
    if (c.bands) c.bands.forEach(b => { s += `<rect x="${x(b[0])}" y="${iy}" width="${Math.max(.5, x(b[1]) - x(b[0]))}" height="${ih}" fill="${STAIN[b[3]]}"><title>${esc(c.id + b[2])} (${STAIN_N[b[3]]})</title></rect>`; });
    else s += `<rect x="${L}" y="${iy}" width="${R - L}" height="${ih}" fill="url(#${id}-g)"/>`;
    if (acro) s += `<rect x="${L}" y="${iy}" width="7" height="${ih}" fill="#2a2c31"/>`;
    s += `<rect x="${L}" y="${iy}" width="${R - L}" height="${ih}" fill="url(#${id}-sh)"/></g>
      <g fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1">${caps}</g>`;
    // arm / centromere labels
    if (cm && !acro) s += `<text class="kd-arm" x="${(L + x(cm)) / 2}" y="${iy - 6}">p</text><text class="kd-arm" x="${(x(cm) + R) / 2}" y="${iy - 6}">q</text><path d="M${x(cm)} ${iy + ih + 3}l-4 6h8z" fill="rgba(255,255,255,.55)"/>`;
    else if (acro) s += `<text class="kd-arm" x="${L + 2}" y="${iy - 6}" text-anchor="start">cen ▸ q</text>`;
    s += `</g>`;
    // highlight: human = the band(s) containing the gene; others = coordinate window
    const sites = c.locus.sites || [[c.locus.start, c.locus.end]];
    let hs, he;
    if (c.bands) { const hit = c.bands.filter(b => b[0] < c.locus.end && b[1] >= c.locus.start); hs = hit[0][0]; he = hit[hit.length - 1][1]; }
    else { const a = Math.min(...sites.map(t => t[0])), b = Math.max(...sites.map(t => t[1])), m = (a + b) / 2, half = Math.max((b - a) / 2, Lb * 0.008); hs = Math.max(0, m - half); he = Math.min(Lb, m + half); }
    let hx0 = x(hs), hx1 = x(he); if (hx1 - hx0 < 6) { const m = (hx0 + hx1) / 2; hx0 = m - 3; hx1 = m + 3; }
    const xm = x((c.locus.start + c.locus.end) / 2);
    s += `<g class="kd-hl"><rect class="kd-ring" x="${hx0 - 3}" y="${iy - 4}" width="${hx1 - hx0 + 6}" height="${ih + 8}" rx="9" fill="none" stroke="${lc}"/>
      <rect x="${hx0}" y="${iy - 1}" width="${hx1 - hx0}" height="${ih + 2}" rx="5" fill="${lc}" fill-opacity=".22" stroke="${lc}" stroke-width="2"/></g>`;
    // gene markers + label pill
    sites.forEach(t => { const xs = x((t[0] + t[1]) / 2); s += `<path class="kd-mk" d="M${xs} ${iy - 3}l-5 -8h10z" fill="${lc}"/>`; });
    const lab = c.locus.gene, lw = lab.length * 8.4 + 18, lx = Math.min(Math.max(xm - lw / 2, 4), W - lw - 4);
    s += `<g class="kd-pill"><rect x="${lx}" y="6" width="${lw}" height="22" rx="11" fill="${lc}"/><text x="${lx + lw / 2}" y="21" text-anchor="middle">${esc(lab)}</text></g>`;
    // scale bar (Mb)
    const target = W < 520 ? 4 : 7, raw = Lb / 1e6 / target, step = [1, 2, 5, 10, 20, 25, 50, 100].find(v => v >= raw) || 100, by = iy + ih + 16;
    s += `<g class="kd-scale"><line x1="${L}" x2="${R}" y1="${by}" y2="${by}"/>`;
    for (let v = 0; v * 1e6 <= Lb; v += step) { const tx = x(v * 1e6); s += `<line x1="${tx}" x2="${tx}" y1="${by}" y2="${by + 5}"/>`; if (R - tx > 58 || v === 0) s += `<text x="${tx}" y="${by + 17}"${v === 0 ? ' class="st"' : ''}>${v}</text>`; }
    s += `<line x1="${R}" x2="${R}" y1="${by}" y2="${by + 5}"/><text class="en" x="${R}" y="${by + 17}">${mb(Lb)} Mb</text></g>`;
    // leader line from locus to the info card
    const ax = Math.min(Math.max(xm, 34), W - 34), y0 = iy + ih + 5, yk = H - 18;
    s += `<path class="kd-lead" d="M${xm} ${y0} V${yk} H${ax} V${H}" stroke="${lc}" pathLength="1"/><circle class="kd-dot" cx="${xm}" cy="${y0}" r="3" fill="${lc}"/>`;
    return { svg: s + '</svg>', ax, H, cx: W / 2, cy: iy + ih / 2, len: R - L, th: ih };
  }

  function metaLine(c) {
    const sd = S(), parts = [`${mb(c.len)} Mb`, `size rank ${rankOf(c)} of ${sd.chroms.length}`];
    const morph = (c.morph || '').split(';')[0];
    if (sp === 'human') { const m = cenMid(c); parts.push(`p arm ${mb(m)} Mb · q arm ${mb(c.len - m)} Mb`); }
    else if (morph) parts.push(morph + (c.cen && c.cen[1] > c.len * 0.03 ? ` · centromere ≈${mb(cenMid(c))} Mb` : ''));
    parts.push(c.asm ? c.asm.split(' (')[0] : sd.assembly.split(' (')[0]);
    return parts.join(' · ');
  }

  function renderDetail(i) {
    const sd = S(), c = sd.chroms[i], n = sd.chroms.length, lo = c.locus, k = CAT[lo.cat];
    const prev = sd.chroms[(i - 1 + n) % n], next = sd.chroms[(i + 1) % n];
    const W = Math.max(280, det.clientWidth || grid.clientWidth || 600), g = ideogram(c, W);
    const notes = [];
    if (!sd.banded && !/^Position by/.test(lo.note || '')) notes.push('Position by genome coordinate — no reliable G-band map exists for this assembly, so no bands are drawn.');
    if ((c.morph || '').includes(';')) notes.push(c.morph.split(';').slice(1).join(';').trim().replace(/^./, m => m.toUpperCase()) + '.');
    if (lo.note) notes.push(lo.note);
    if (c.asm) notes.push(`This chromosome is drawn from ${c.asm}; Y chromosomes are rich in repeats, so assembled and microscope-based sizes can differ.`);
    det.innerHTML = `
      <div class="kd-top">
        <button type="button" class="kd-back" data-act="close"><span aria-hidden="true">←</span> All chromosomes<span class="sr"> (Escape)</span></button>
        <div class="kd-title"><h4 id="kd-h" tabindex="-1">${esc(nm(c))}</h4><p class="mono small">${esc(metaLine(c))}</p></div>
        <div class="kd-nav">
          <button type="button" data-act="prev" aria-label="Previous: ${esc(nm(prev))}">‹</button>
          <span class="mono small" aria-hidden="true">${i + 1} / ${n}</span>
          <button type="button" data-act="next" aria-label="Next: ${esc(nm(next))}">›</button>
        </div>
      </div>
      <div class="kd-fig">${g.svg}</div>
      <article class="kd-card" style="--ax:${g.ax}px" aria-labelledby="kd-g">
        <div class="kd-card-head"><span id="kd-g" class="kd-gene mono">${esc(lo.gene)}</span><span class="kd-chip ${k.k}">${lo.cat}</span></div>
        <p class="kd-name">${esc(lo.name)}</p>
        <p class="kd-pos mono">${esc(lo.pos)}</p>
        <p class="kd-txt">${esc(lo.text)}</p>
        ${notes.length ? `<p class="kd-note">${notes.map(esc).join(' ')}</p>` : ''}
        <p class="kd-src">Source: ${lo.src.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`).join(' · ')}</p>
      </article>`;
    det.setAttribute('aria-label', `${nm(c)} detail`);
    return g;
  }

  function inView(el) { // keep the detail header clear of the fixed site nav
    const top = el.getBoundingClientRect().top, nav = 84;
    if (top < nav || top > innerHeight * .6) scrollBy({ top: top - nav - 8, behavior: RM ? 'auto' : 'smooth' });
  }
  function reveal() { det.classList.remove('ready'); void det.offsetWidth; requestAnimationFrame(() => det.classList.add('ready')); }

  function open(i, btn) {
    const from = btn && !RM ? $('svg', btn).getBoundingClientRect() : null;
    lastBtn = btn || lastBtn; cur = i;
    grid.hidden = true; det.hidden = false;
    const g = renderDetail(i);
    $('#kd-h', det).focus({ preventScroll: true });
    if (from && det.animate) {
      const svg = $('.kd-svg', det), to = svg.getBoundingClientRect();
      const dx = (from.left + from.width / 2) - (to.left + g.cx), dy = (from.top + from.height / 2) - (to.top + g.cy), s = Math.max(.04, from.height / g.len);
      svg.style.transformOrigin = `${g.cx}px ${g.cy}px`;
      det.classList.add('flying');
      svg.animate([{ transform: `translate(${dx}px,${dy}px) rotate(90deg) scale(${s})`, opacity: .7 }, { transform: 'none', opacity: 1 }],
        { duration: 720, easing: 'cubic-bezier(.2,.75,.15,1)' }).onfinish = () => { det.classList.remove('flying'); reveal(); inView(det); };
    } else { reveal(); inView(det); }
    sel.textContent = `${nm(S().chroms[i])} opened`;
  }
  function go(d) {
    const n = S().chroms.length; cur = (cur + d + n) % n;
    renderDetail(cur);
    const svg = $('.kd-svg', det);
    if (!RM && svg.animate) svg.animate([{ transform: `translateX(${d * 36}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
    reveal();
    $(`[data-act="${d > 0 ? 'next' : 'prev'}"]`, det).focus({ preventScroll: true });
    lastBtn = $(`.k-chr[data-i="${cur}"]`, grid);
  }
  function close() {
    if (det.hidden) return;
    det.hidden = true; det.classList.remove('ready'); det.innerHTML = ''; grid.hidden = false;
    renderGrid();
    const b = $(`.k-chr[data-i="${cur}"]`, grid);
    if (b) { b.focus({ preventScroll: true }); inView(grid); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 900); }
    cur = -1;
  }
  det.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; ({ close, prev: () => go(-1), next: () => go(1) })[a.dataset.act](); });
  root.addEventListener('keydown', e => {
    if (det.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('a,.seg')) { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
  });

  /* ---------- species tabs ---------- */
  let counterRaf = 0;
  function setSpecies(s, focusTab) {
    tabs.forEach(t => { const on = t.dataset.s === s; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focusTab) t.focus(); });
    if (s === 'portal') { body.hidden = true; soon.hidden = false; soon.classList.remove('k-in'); void soon.offsetWidth; soon.classList.add('k-in'); return; }
    body.hidden = false; soon.hidden = true; body.setAttribute('aria-labelledby', 'kt-' + s);
    if (!det.hidden) { det.hidden = true; det.innerHTML = ''; grid.hidden = false; cur = -1; }
    sp = s; const sd = S();
    const el = $('#k-n', root), from = +el.textContent || sd.n2, to = sd.n2, t0 = performance.now();
    cancelAnimationFrame(counterRaf);
    const st = t => { const p = RM ? 1 : Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) counterRaf = requestAnimationFrame(st); };
    counterRaf = requestAnimationFrame(st);
    $('#k-p', root).textContent = `${sd.pairs} pairs · ${sd.auto} autosomes + XX/XY`;
    $('#k-sp', root).innerHTML = `<i>${esc(sd.latin)}</i>`;
    $('#k-cap', root).textContent = 'Click or tap to zoom in.';
    sel.textContent = '';
    renderGrid();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setSpecies(t.dataset.s));
    t.addEventListener('keydown', e => {
      const m = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (m) { e.preventDefault(); setSpecies(tabs[(i + m + tabs.length) % tabs.length].dataset.s, true); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setSpecies(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.s, true); }
    });
  });
  let rz = 0, lastW = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => {
    const w = root.clientWidth; if (w === lastW || body.hidden) return; lastW = w;
    if (!det.hidden && cur >= 0) { renderDetail(cur); det.classList.add('ready'); } else renderGrid();
  }, 150); });
  lastW = root.clientWidth;
  setSpecies('human');
})();
