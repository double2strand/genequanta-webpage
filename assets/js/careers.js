(() => {
document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const CFG = window.GQ_CAREERS || {}, JOBS = window.GQ_JOBS || [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
/* shared chrome: nav, year, background */
const burger = $('.burger'), ul = $('#navlinks');
burger.onclick = () => { const o = ul.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear() || 2026;
(() => { const c = $('#bg-net'), x = c.getContext('2d'), D = Math.min(devicePixelRatio || 1, 2); let W, H, P = [];
  const init = () => { W = innerWidth; H = innerHeight; c.width = W * D; c.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); P = Array.from({ length: Math.min(55, Math.floor(W * H / 26000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2 })); };
  const draw = () => { x.clearRect(0, 0, W, H); for (const p of P) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y); if (d < 130) { x.strokeStyle = `rgba(47,91,255,${(1 - d / 130) * .18})`; x.beginPath(); x.moveTo(P[i].x, P[i].y); x.lineTo(P[j].x, P[j].y); x.stroke(); } }
    x.fillStyle = 'rgba(0,169,157,.45)'; for (const p of P) { x.beginPath(); x.arc(p.x, p.y, 1.3, 0, 7); x.fill(); } if (!RM) requestAnimationFrame(draw); };
  init(); addEventListener('resize', init); draw(); })();

/* roles list */
$('#roles-count').textContent = JOBS.length + (JOBS.length === 1 ? ' role' : ' roles');
$('#roles-list').innerHTML = JOBS.length ? JOBS.map(j => `<a class="role glass" href="#${esc(j.id)}"><div><h3>${esc(j.title)}</h3><p>${esc(j.summary)}</p><div class="meta"><span>${esc(j.location)}</span><span>${esc(j.type)}</span><span>${esc(j.seniority)}</span><span class="hot">${esc(j.workplace)}</span></div></div><span class="btn btn-ghost go">View role →</span></a>`).join('')
  : '<p class="muted">There are no open roles right now. You are welcome to send a speculative note to <a href="mailto:' + esc(CFG.FALLBACK_EMAIL) + '">' + esc(CFG.FALLBACK_EMAIL) + '</a>.</p>';

/* detail */
let job = null;
function route() {
  const id = decodeURIComponent(location.hash.slice(1)); const j = JOBS.find(x => x.id === id);
  if (!j) { $('#job').hidden = true; $('#roles').hidden = false; document.body.classList.remove('detail'); document.title = 'Careers · GeneQuanta'; if (id === 'roles') $('#roles').scrollIntoView(); return; }
  if (job !== j) render(j);
  $('#roles').hidden = true; $('#job').hidden = false; document.body.classList.add('detail'); document.title = j.title + ' · Careers · GeneQuanta';
  if (id && !route.first) scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); route.first = false;
}
route.first = true;
function render(j) {
  job = j;
  $('#job-body').innerHTML = `<p class="eyebrow mono">${esc(j.company)}</p><h1>${esc(j.title)}</h1><p class="sub">${esc(j.location)} · ${esc(j.type)} · ${esc(j.workplace)}</p>` +
    j.sections.map(s => `<section><h2>${esc(s.h)}</h2>${(s.p || []).map(p => `<p>${esc(p)}</p>`).join('')}${s.ul ? `<ul class="ticks">${s.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}</section>`).join('');
  $('#job-facts').innerHTML = `<dl><div><dt>Location</dt><dd>${esc(j.location)}</dd></div><div><dt>Working pattern</dt><dd>${esc(j.workplace)}</dd></div><div><dt>Employment type</dt><dd>${esc(j.type)}</dd></div><div><dt>Seniority</dt><dd>${esc(j.seniority)}</dd></div><div><dt>Posted</dt><dd>${fmtDate(j.posted)}</dd></div></dl><a href="#apply" class="btn" id="to-apply">Apply now</a>${j.linkedin ? `<a class="li link" href="${esc(j.linkedin)}" target="_blank" rel="noopener">View on LinkedIn ↗</a>` : ''}`;
  $('#to-apply').onclick = e => { e.preventDefault(); $('#apply').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(() => $('#apply-form [name=name]').focus({ preventScroll: true }), RM ? 0 : 500); };
  $('#apply-title').textContent = j.title; $('#apply-note').textContent = j.applyNote || '';
  $('#apply-prompts').innerHTML = (j.applyPrompts || []).map(p => `<li>${esc(p)}</li>`).join('');
  $('#apply-form [name=role_id]').value = j.id;
  $('#apply-form').hidden = false; $('#apply-ok').hidden = true;
}
addEventListener('hashchange', () => { if (location.hash === '#apply') return; route(); });
route();

/* form */
const f = $('#apply-form'), MAX = (CFG.MAX_MB || 5) * 1024 * 1024, ENDPOINT = String(CFG.ENDPOINT || '').trim(), MAIL = CFG.FALLBACK_EMAIL || 'yixuan@genequanta.com';
$$('.maxmb').forEach(e => e.textContent = CFG.MAX_MB || 5); $$('.retention').forEach(e => e.textContent = CFG.RETENTION || 'only as long as needed for recruitment');
$$('.fb-mail').forEach(a => { a.href = 'mailto:' + MAIL; a.textContent = MAIL; });
if (!ENDPOINT) { const n = $('#apply-closed'); n.hidden = false; n.innerHTML = `Online applications open soon. For now, the button below opens an email to <a href="mailto:${esc(MAIL)}">${esc(MAIL)}</a> with your details filled in. Please attach your CV to that email.`; $('#submit').textContent = 'Email my application'; }
f.addEventListener('input', e => { $('#form-error').hidden = true; e.target.classList.remove('invalid'); if (e.target.name === 'right_to_work') $('.rtw .seg').classList.remove('invalid'); });
f.addEventListener('change', e => { $('#form-error').hidden = true; e.target.classList.remove('invalid'); if (e.target.name === 'right_to_work') $('.rtw .seg').classList.remove('invalid'); });
const note = f.note; note.addEventListener('input', () => $('#note-count').textContent = note.value.length + ' / 6000');
const OK_EXT = /\.(pdf|docx?)$/i, OK_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ''];
const drop = $('#drop'), cv = $('#cv');
function checkFile(file) {
  drop.classList.remove('ok', 'bad');
  if (!file) { $('#cv-name').textContent = ''; return 'Please attach your CV.'; }
  let err = '';
  if (!OK_EXT.test(file.name) || !OK_TYPES.includes(file.type)) err = 'CV must be a PDF, DOC or DOCX file.';
  else if (file.size > MAX) err = `CV is ${(file.size / 1048576).toFixed(1)} MB; the limit is ${CFG.MAX_MB || 5} MB.`;
  else if (file.size === 0) err = 'That file is empty.';
  drop.classList.add(err ? 'bad' : 'ok'); $('#cv-name').textContent = err || `✓ ${file.name} · ${(file.size / 1024).toFixed(0)} KB`; return err;
}
cv.addEventListener('change', () => checkFile(cv.files[0]));
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => { const fl = e.dataTransfer.files; if (fl && fl[0]) { const dt = new DataTransfer(); dt.items.add(fl[0]); cv.files = dt.files; checkFile(fl[0]); } });
const showErr = msg => { const e = $('#form-error'); e.textContent = msg; e.hidden = !msg; };
function validate() {
  $$('.invalid', f).forEach(e => e.classList.remove('invalid')); const errs = [];
  const need = (el, msg) => { el.classList.add('invalid'); errs.push(msg); };
  if (!f.name.value.trim()) need(f.name, 'your name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) need(f.email, 'a valid email');
  if (f.links.value.trim() && !/^https?:\/\/\S+\.\S+/.test(f.links.value.trim())) need(f.links, 'a full URL starting with https:// (or leave it blank)');
  if (!f.location.value.trim()) need(f.location, 'your location');
  if (!f.querySelector('[name=right_to_work]:checked')) { $('.rtw .seg').classList.add('invalid'); errs.push('your right-to-work answer'); }
  if (!note.value.trim()) need(note, 'a cover note');
  if (ENDPOINT) { const fe = checkFile(cv.files[0]); if (fe) { drop.classList.add('bad'); errs.push(fe === 'Please attach your CV.' ? 'your CV' : 'a valid CV (' + fe.replace(/\.$/, '') + ')'); } }
  if (!f.consent.checked) { f.consent.classList.add('invalid'); errs.push('your consent'); }
  return errs;
}
const b64 = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
f.addEventListener('submit', async e => {
  e.preventDefault(); showErr('');
  const errs = validate(); if (errs.length) { showErr('Please add ' + errs.join(', ') + '.'); const first = $('.invalid', f); if (first && first.focus) first.focus(); return; }
  if (f.website.value) { done('ok', { id: '' }); return; } // honeypot: silently pretend success
  const d = { role_id: job.id, role_title: job.title, name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), links: f.links.value.trim(), location: f.location.value.trim(), right_to_work: f.querySelector('[name=right_to_work]:checked').value, note: note.value.trim(), consent: true };
  if (!ENDPOINT) { // fallback: email draft
    const body = `Role: ${d.role_title}\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nLinks: ${d.links}\nLocation: ${d.location}\nRight to work in UK: ${d.right_to_work}\n\n${d.note}\n\n(CV attached)`;
    location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Application: ' + d.role_title + ' - ' + d.name)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
    $('#submit-hint').textContent = 'Your email app should open. Remember to attach your CV.'; return; }
  const btn = $('#submit'); btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span> Sending…'; $('#submit-hint').textContent = 'Uploading your CV, this can take a few seconds.';
  try {
    const file = cv.files[0];
    d.cv = { name: file.name, type: file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : /\.docx$/i.test(file.name) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword'), size: file.size, data: await b64(file) };
    d.website = ''; d.page = location.href; d.user_agent = navigator.userAgent; d.submitted_at = new Date().toISOString();
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 60000);
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d), signal: ctl.signal, redirect: 'follow' });
    clearTimeout(tm);
    let out = null; try { out = await res.json(); } catch (_) {}
    if (out && out.ok) done('ok', out); else throw new Error((out && out.error) || 'Unexpected response (' + res.status + ')');
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Submit application'; $('#submit-hint').textContent = '';
    showErr(`Sorry, we couldn't confirm your application (${err.name === 'AbortError' ? 'timed out' : err.message}). Please try again, or email your CV to ${MAIL}.`);
  }
});
function done(_, out) {
  f.hidden = true; const ok = $('#apply-ok'); ok.hidden = false; $('#ok-name').textContent = f.name.value.trim().split(' ')[0] || 'there'; $('#ok-role').textContent = job ? job.title : '';
  $('#ok-ref').textContent = out && out.id ? 'Reference: ' + out.id : ''; ok.focus(); ok.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
})();
