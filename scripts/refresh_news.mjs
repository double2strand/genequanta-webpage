// Builds data/news.json (fallback snapshot). Run: node scripts/refresh_news.mjs  (Node 18+, no deps)
import { createRequire } from 'module'; import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { TOPICS, JUNK } = require('../assets/js/news-config.js');
const DAYS = 45, iso = d => d.toISOString().slice(0, 10);
const clean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g,'').replace(/\s+/g, ' ').trim();
const pick = x => { const today = new Date().toISOString().slice(0, 10), d = x.firstPublicationDate || x.firstIndexDate; return d > today ? (x.firstIndexDate && x.firstIndexDate <= today ? x.firstIndexDate : today) : d; };
async function epmc(t) {
  const from = iso(new Date(Date.now() - DAYS * 864e5));
  const query = `(${t.q}) AND HAS_ABSTRACT:Y AND FIRST_PDATE:[${from} TO 2100-01-01]`;
  const d = await (await fetch('https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + new URLSearchParams({ query, sort: 'P_PDATE_D desc', format: 'json', pageSize: t.id === 'epitx' ? '40' : '30', resultType: 'core' }))).json();
  return (d.resultList?.result || []).map(x => { const pre = x.source === 'PPR';
    return { id: x.doi || x.source + x.id, title: clean(x.title), summary: clean(x.abstractText).slice(0, 320), date: pick(x), url: x.doi ? 'https://doi.org/' + x.doi : `https://europepmc.org/article/${x.source}/${x.id}`,
      source: pre ? 'Preprint' : 'Journal', venue: clean(pre ? (x.bookOrReportDetails?.publisher || 'Preprint') : (x.journalInfo?.journal?.title || '')), topics: [t.id] }; });
}
async function trials() {
  const t = TOPICS.find(x => x.id === 'epitx');
  const d = await (await fetch('https://clinicaltrials.gov/api/v2/studies?' + new URLSearchParams({ 'query.intr': t.ct, 'query.cond': 'cancer OR neoplasm OR leukemia OR lymphoma OR myeloma OR tumor', sort: 'StudyFirstPostDate:desc', pageSize: '20', fields: 'NCTId,BriefTitle,OverallStatus,StudyFirstPostDate,Condition,Phase,InterventionName,LeadSponsorName' }))).json();
  return (d.studies || []).map(s => { const p = s.protocolSection, id = p.identificationModule.nctId, st = p.statusModule;
    const ph = (p.designModule?.phases || []).map(x => x.replace('PHASE', 'Phase ').replace('EARLY_', 'Early ')).join('/');
    const drugs = (p.armsInterventionsModule?.interventions || []).map(i => i.name).slice(0, 3).join(', ');
    return { id, title: p.identificationModule.briefTitle, date: st.studyFirstPostDateStruct?.date, url: 'https://clinicaltrials.gov/study/' + id, source: 'Clinical trial', venue: 'ClinicalTrials.gov · ' + id, topics: ['epitx', 'cancer'],
      summary: [ph, st.overallStatus?.replace(/_/g, ' ').toLowerCase(), (p.conditionsModule?.conditions || []).slice(0, 3).join(', '), drugs && 'Interventions: ' + drugs, p.sponsorCollaboratorsModule?.leadSponsor?.name && 'Sponsor: ' + p.sponsorCollaboratorsModule.leadSponsor.name].filter(Boolean).join(' · ') }; });
}
// Industry/editorial RSS: not CORS-enabled, so only fetched here (server side), never in the browser.
const FEEDS = [['Nature · Epigenetics', 'https://www.nature.com/subjects/epigenetics.rss', ['epi']], ['GEN', 'https://www.genengnews.com/feed/', null]];
const KW = { epitx: /HDAC|EZH2|DNMT|BET |bromodomain|menin|LSD1|PRMT5|KAT6|epigenetic (drug|therap)|hypomethylat|azacitidine|decitabine/i, ptm: /histone|acetylat|methyltransferase|post-translational|ubiquitin|lactylat/i, tf: /transcription factor|MYC\b|enhancer/i, cancer: /cancer|tumou?r|oncolog|leukaemi|leukemi|lymphoma|myeloma/i, epi: /epigen|methylation|chromatin|epigenom/i };
async function rss([name, url, fixed]) {
  const x = await (await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 GeneQuanta-news-bot' } })).text();
  const items = [...x.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map(m => m[0]);
  const g = (s, tag) => { const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? clean(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : ''; };
  return items.map(s => { const title = g(s, 'title'), summary = (g(s, 'description') || g(s, 'content:encoded')).slice(0, 320), text = title + ' ' + summary;
    const topics = [...new Set([...(fixed || []), ...Object.keys(KW).filter(k => KW[k].test(text))])]; const d = new Date(g(s, 'pubDate') || g(s, 'dc:date') || g(s, 'updated'));
    return { id: g(s, 'link') || title, title, summary, url: g(s, 'link') || (s.match(/<link[^>]*href="([^"]+)"/) || [])[1], date: isNaN(d) ? '' : iso(d), source: 'News', venue: name, topics }; })
    .filter(i => i.topics.length && i.url);
}
const res = await Promise.allSettled([...TOPICS.map(epmc), trials(), ...FEEDS.map(rss)]);
res.forEach((r, i) => r.status === 'rejected' && console.error('source', i, 'failed:', r.reason?.message));
const m = new Map();
res.filter(r => r.status === 'fulfilled').flatMap(r => r.value).forEach(it => { if (!it.title || JUNK.test(it.title)) return; const k = it.id.toLowerCase(); if (m.has(k)) m.get(k).topics = [...new Set([...m.get(k).topics, ...it.topics])]; else m.set(k, it); });
const items = [...m.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
if (items.length < 10) { console.error('Too few items; keeping old snapshot'); process.exit(1); }
writeFileSync(new URL('../data/news.json', import.meta.url), JSON.stringify({ generated: Date.now(), items }, null, 1));
console.log('wrote', items.length, 'items');
