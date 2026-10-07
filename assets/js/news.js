(function () {
  const { TOPICS, JUNK } = window.GQ_NEWS;
  const KEY = 'gq-news-v2', TTL = 3 * 3600e3, DAYS = 45;
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#news-live'); if (!root) return;
  const grid = $('.news-grid', root), stamp = $('#news-stamp', root), status = $('#news-status', root);
  const state = { items: [], topic: 'all', q: '', sort: 'new', src: 'all', shown: 12, origin: '' };
  const dec = (s) => { const d = document.createElement('textarea'); d.innerHTML = s; return d.value; };
  const clean = (s) => dec(dec(String(s || ''))).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const iso = (d) => d.toISOString().slice(0, 10);

  const pick = x => { const today = new Date().toISOString().slice(0, 10), d = x.firstPublicationDate || x.firstIndexDate; return d > today ? (x.firstIndexDate && x.firstIndexDate <= today ? x.firstIndexDate : today) : d; };
async function epmc(t) {
    const from = iso(new Date(Date.now() - DAYS * 864e5));
    const query = `(${t.q}) AND HAS_ABSTRACT:Y AND FIRST_PDATE:[${from} TO 2100-01-01]`;
    const u = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + new URLSearchParams({ query, sort: 'P_PDATE_D desc', format: 'json', pageSize: t.id === 'epitx' ? '40' : '30', resultType: 'core' });
    const r = await fetch(u); if (!r.ok) throw new Error('epmc ' + r.status);
    const d = await r.json();
    return (d.resultList?.result || []).map(x => {
      const pre = x.source === 'PPR';
      const venue = pre ? (x.bookOrReportDetails?.publisher || 'Preprint') : (x.journalInfo?.journal?.title || x.journalTitle || '');
      const link = x.doi ? 'https://doi.org/' + x.doi : `https://europepmc.org/article/${x.source}/${x.id}`;
      return { id: x.doi || x.source + x.id, title: clean(x.title), summary: clean(x.abstractText).slice(0, 320), date: pick(x), url: link,
        source: pre ? 'Preprint' : 'Journal', venue: clean(venue), topics: [t.id] };
    });
  }
  async function trials() {
    const t = TOPICS.find(x => x.id === 'epitx');
    const u = 'https://clinicaltrials.gov/api/v2/studies?' + new URLSearchParams({ 'query.intr': t.ct, 'query.cond': 'cancer OR neoplasm OR leukemia OR lymphoma OR myeloma OR tumor', sort: 'StudyFirstPostDate:desc', pageSize: '20', fields: 'NCTId,BriefTitle,OverallStatus,StudyFirstPostDate,StudyFirstPostDate,Condition,Phase,InterventionName,LeadSponsorName' });
    const r = await fetch(u); if (!r.ok) throw new Error('ctgov ' + r.status);
    const d = await r.json();
    return (d.studies || []).map(s => {
      const p = s.protocolSection, id = p.identificationModule.nctId, st = p.statusModule;
      const ph = (p.designModule?.phases || []).map(x => x.replace('PHASE', 'Phase ').replace('EARLY_', 'Early ')).join('/');
      const drugs = (p.armsInterventionsModule?.interventions || []).map(i => i.name).slice(0, 3).join(', ');
      return { id, title: p.identificationModule.briefTitle, date: st.studyFirstPostDateStruct?.date,
        summary: [ph, st.overallStatus?.replace(/_/g, ' ').toLowerCase(), (p.conditionsModule?.conditions || []).slice(0, 3).join(', '), drugs && 'Interventions: ' + drugs, p.sponsorCollaboratorsModule?.leadSponsor?.name && 'Sponsor: ' + p.sponsorCollaboratorsModule.leadSponsor.name].filter(Boolean).join(' · '),
        url: 'https://clinicaltrials.gov/study/' + id, source: 'Clinical trial', venue: 'ClinicalTrials.gov · ' + id, topics: ['epitx', 'cancer'] };
    });
  }
  function merge(lists) {
    const m = new Map();
    lists.flat().forEach(it => {
      if (!it.title || JUNK.test(it.title)) return;
      const k = (it.id || it.title).toLowerCase();
      if (m.has(k)) m.get(k).topics = [...new Set([...m.get(k).topics, ...it.topics])]; else m.set(k, it);
    });
    return [...m.values()];
  }
  async function live() {
    const res = await Promise.allSettled([...TOPICS.map(epmc), trials()]);
    const ok = res.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!ok.length) throw new Error('all sources failed');
    return merge(ok);
  }
  async function snapshot() { const r = await fetch('data/news.json', { cache: 'no-cache' }); if (!r.ok) throw 0; return r.json(); }

  function render() {
    const q = state.q.toLowerCase();
    let L = state.items.filter(i => (state.topic === 'all' || i.topics.includes(state.topic)) && (state.src === 'all' || i.source === state.src) && (!q || (i.title + ' ' + i.summary + ' ' + i.venue).toLowerCase().includes(q)));
    L.sort((a, b) => state.sort === 'new' ? (b.date || '').localeCompare(a.date || '') : (a.date || '').localeCompare(b.date || ''));
    $('#news-count', root).textContent = L.length + ' items';
    grid.innerHTML = '';
    if (!L.length) { grid.innerHTML = '<p class="news-empty">No items match. Clear the search or pick another topic.</p>'; }
    L.slice(0, state.shown).forEach((i, n) => {
      const a = document.createElement('a'); a.className = 'news-card glass'; a.href = i.url; a.target = '_blank'; a.rel = 'noopener';
      a.style.setProperty('--d', (n % 12) * 40 + 'ms');
      const t = TOPICS.find(t => t.id === i.topics[0]);
      a.style.setProperty('--c', t ? t.color : '#00f5d4');
      a.innerHTML = `<div class="nc-top"><span class="badge src-${i.source.replace(/\s/g, '').toLowerCase()}"></span><time></time></div><h4></h4><p></p><div class="nc-foot"><span class="venue"></span><span class="tags"></span></div>`;
      a.querySelector('.badge').textContent = i.source; a.querySelector('time').textContent = i.date ? new Date(i.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      a.querySelector('h4').textContent = i.title; a.querySelector('p').textContent = i.summary; a.querySelector('.venue').textContent = i.venue;
      a.querySelector('.tags').innerHTML = i.topics.map(id => { const t = TOPICS.find(x => x.id === id); return t ? `<i style="--c:${t.color}" title="${t.label}"></i>` : ''; }).join('');
      grid.appendChild(a);
    });
    $('#news-more', root).hidden = L.length <= state.shown;
  }
  function setStamp(ts, origin) { stamp.textContent = 'Last updated ' + new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' + origin; }
  async function load(force) {
    status.textContent = 'Fetching live feeds…'; root.classList.add('loading');
    let c = null; try { c = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (c && !force && Date.now() - c.ts < TTL) { state.items = c.items; setStamp(c.ts, 'live (cached)'); status.textContent = ''; root.classList.remove('loading'); return render(); }
    if (c) { state.items = c.items; render(); }
    try {
      const items = await live(); state.items = items; const ts = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify({ ts, items })); } catch (e) {}
      setStamp(ts, 'live'); status.textContent = '';
    } catch (e) {
      try { const s = await snapshot(); if (!c) state.items = s.items; setStamp(c ? c.ts : s.generated, c ? 'cached copy' : 'daily snapshot'); status.textContent = 'Live sources unreachable; showing ' + (c ? 'cached' : 'snapshot') + ' items.'; }
      catch (e2) { status.textContent = 'News sources are unreachable right now.'; }
    }
    root.classList.remove('loading'); render();
  }
  // controls
  const chips = $('.chips', root);
  [{ id: 'all', label: 'All', color: '#e6f1ff' }, ...TOPICS].forEach(t => {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = t.label; b.style.setProperty('--c', t.color);
    b.setAttribute('aria-pressed', t.id === 'all'); b.onclick = () => { state.topic = t.id; state.shown = 12; chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); };
    chips.appendChild(b);
  });
  let tm; $('#news-q', root).addEventListener('input', e => { clearTimeout(tm); tm = setTimeout(() => { state.q = e.target.value.trim(); state.shown = 12; render(); }, 150); });
  $('#news-sort', root).onchange = e => { state.sort = e.target.value; render(); };
  $('#news-src', root).onchange = e => { state.src = e.target.value; state.shown = 12; render(); };
  $('#news-more', root).onclick = () => { state.shown += 12; render(); };
  $('#news-refresh', root).onclick = () => load(true);
  load(false);
})();
