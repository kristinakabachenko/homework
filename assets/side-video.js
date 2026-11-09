/* Side skill: video in parts — watch a part, write what you hear, shadow it 3 times.
   The page sets window.SV = { homework, store, progress, video, parts:[...], extra:[...], seed:{...} } before loading this file.
   part = { title, lab, start, end, about, write:true|false, wordsMin }
   extra step = { title, lab, html, done:{taskId: () => bool}, setup(), refresh(), text() } */
(function(){
const C = window.SV, $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mmss = s => Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
const words = t => String(t||'').trim().split(/\s+/).filter(Boolean).length;

/* ---------- saved state (seed = what the student already did before) ---------- */
let S = null;
try { const o = JSON.parse(localStorage.getItem(C.store) || 'null'); if (o && o.v) S = o; } catch(e){}
const who = new URLSearchParams(location.search).get('s') || '';
const seedOk = !C.seedFor || C.seedFor.test(who);          // earlier work belongs only to that student
if (!S) S = { v: Object.assign({}, seedOk ? C.seed : {}), tab: seedOk && C.startTab || 1 };
const V = k => (S.v[k] == null ? '' : S.v[k]);
window.SVS = { V, S, set:(k,v) => { S.v[k] = v; update(); }, esc };

/* ---------- build ---------- */
const embed = p => 'https://www.youtube-nocookie.com/embed/' + C.video + '?rel=0&modestbranding=1&cc_load_policy=0&start=' + p.start + (p.end ? '&end=' + p.end : '');
const task = (id, label, body) => `<div class="task" data-t="${id}"><div class="tk"><span class="chk" aria-hidden="true"></span><div class="tl">${label}</div></div><div class="tb">${body}</div></div>`;
const DONE = {};
const STEPS = C.parts.map((p, i) => {
  const n = i + 1, min = p.wordsMin || 20;
  let html = `<p class="about">${p.about || ''}</p>
    <div class="vid"><iframe id="yt${n}" data-src="${embed(p)}" title="${esc(p.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
    <div class="vrow">⏱ ${mmss(p.start)}${p.end ? ' – ' + mmss(p.end) : ''} <button class="btn small ghost" data-replay="${n}">↺ Play this part again</button> <span>Tip: ⚙ in the video → Playback speed 0.75</span></div>`;
  if (p.write !== false) {
    DONE['w' + n] = () => words(V('w' + n)) >= min;
    html += task('w' + n, 'Write the sentences you hear. Pause the video after each sentence.',
      `<textarea class="f" data-k="w${n}" data-l="Part ${n} — my sentences" placeholder="I've just woken up…"></textarea><div class="hint" id="wh${n}"></div>`);
  }
  DONE['s' + n] = () => (+V('c' + n) || 0) >= 3;
  html += task('s' + n, 'Shadow this part 3 times: play it and speak <b>together with</b> the speaker. Copy the speed and the intonation.',
    `<div class="counter"><button class="btn small" data-plus="${n}">+1 time</button><div class="big3" id="c3_${n}"><i></i><i></i><i></i></div><button class="btn small ghost" data-zero="${n}">reset</button></div>
     <div class="rec"><button class="btn small ghost" data-rec="${n}">🎙 Record myself</button><span class="hint" id="rs${n}"></span><audio id="ra${n}" controls hidden></audio></div>`);
  return { title: p.title, lab: p.lab, time: mmss(p.start), html };
});
(C.extra || []).forEach(x => { Object.assign(DONE, x.done); STEPS.push({ title: x.title, lab: x.lab, html: x.html, extra: x }); });

$('steps').innerHTML = STEPS.map((s,i) =>
  `<section class="card step" id="step${i+1}" hidden><div class="head"><div class="num">${i+1}</div><div><h2>${s.extra ? '' : 'Part ' + (i+1) + ' — '}${s.title}</h2>${s.time ? '<div class="sub">▶ from ' + s.time + '</div>' : ''}</div></div>${s.html}</section>`).join('');
$('tabs').innerHTML = STEPS.map((s,i) => `<button class="tab" data-s="${i+1}"><span class="n"><span>${i+1}</span></span><span class="lab">${s.lab}</span></button>`).join('');
const stepTasks = STEPS.map((_,i) => [...document.querySelectorAll('#step'+(i+1)+' .task')].map(t => t.dataset.t));
const TOTAL = stepTasks.flat().length;

document.querySelectorAll('[data-k]').forEach(el => {
  const k = el.dataset.k;
  if (el.type === 'checkbox') el.checked = V(k) === true; else el.value = V(k);
  el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => { S.v[k] = el.type === 'checkbox' ? el.checked : el.value; update(); });
});
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.plus) { const k = 'c' + b.dataset.plus; S.v[k] = Math.min(3, (+V(k)||0) + 1); update(); }
  if (b.dataset.zero) { S.v['c' + b.dataset.zero] = 0; update(); }
  if (b.dataset.replay) { const f = $('yt' + b.dataset.replay); f.src = f.dataset.src + '&autoplay=1'; }
  if (b.dataset.rec) record(b);
});
(C.extra || []).forEach(x => x.setup && x.setup());

/* recorder (just for listening to yourself) */
let rec = null, chunks = [], recBtn = null;
async function record(b){
  if (rec && rec.state === 'recording') { rec.stop(); return; }
  const n = b.dataset.rec;
  try {
    const st = await navigator.mediaDevices.getUserMedia({audio:true});
    rec = new MediaRecorder(st); chunks = []; recBtn = b;
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => { st.getTracks().forEach(t => t.stop()); const a = $('ra' + n); a.src = URL.createObjectURL(new Blob(chunks, {type: rec.mimeType})); a.hidden = false;
      recBtn.textContent = '🎙 Record again'; $('rs' + n).textContent = 'Listen and compare with the video ↓'; };
    rec.start(); b.textContent = '⏹ Stop'; $('rs' + n).innerHTML = '<span class="recdot"></span> recording…';
  } catch(e){ $('rs' + n).textContent = 'Microphone is not available here.'; }
}

/* tabs */
function goTop(){ const y = $('steps').getBoundingClientRect().top + window.scrollY - document.querySelector('.bar').offsetHeight - 10; window.scrollTo({top:y, behavior:'smooth'}); }
function show(n){
  S.tab = Math.max(1, Math.min(STEPS.length, n));
  document.querySelectorAll('.step').forEach((s,i) => {
    s.hidden = i+1 !== S.tab;
    const f = s.querySelector('iframe[data-src]');
    if (f) { if (i+1 === S.tab) { if (!f.src) f.src = f.dataset.src; } else if (f.src) f.removeAttribute('src'); }   // stop other parts
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', +t.dataset.s === S.tab));
  const on = document.querySelector('.tab.on'); if (on) on.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
  $('prev').disabled = S.tab === 1;
  $('next').textContent = S.tab === STEPS.length ? 'Go to send ↓' : 'Next →';
  save();
}
$('tabs').onclick = e => { const t = e.target.closest('.tab'); if (t) { show(+t.dataset.s); goTop(); } };
$('prev').onclick = () => { show(S.tab - 1); goTop(); };
$('next').onclick = () => { if (S.tab === STEPS.length) { document.querySelector('.final').scrollIntoView({behavior:'smooth'}); return; } show(S.tab + 1); goTop(); };

/* update */
window.scores = {};
const counts = () => stepTasks.map(ids => ({ s: ids.filter(id => DONE[id]()).length, max: ids.length }));
function save(){ try { localStorage.setItem(C.store, JSON.stringify(S)); } catch(e){} }
let sending = false;
function update(){
  document.querySelectorAll('textarea.f,input.f').forEach(el => el.classList.toggle('filled', String(el.value).trim().length >= 2));
  C.parts.forEach((p,i) => { const n = i+1, h = $('wh' + n);
    if (h) { const w = words(V('w'+n)), min = p.wordsMin || 20; h.textContent = w ? (w >= min ? '✓ ' + w + ' words' : w + ' words — keep going (at least ' + min + ')') : ''; h.className = 'hint ' + (w >= min ? 'ok' : w ? 'no' : ''); }
    $('c3_' + n).querySelectorAll('i').forEach((d,j) => d.classList.toggle('on', j < (+V('c'+n)||0))); });
  (C.extra || []).forEach(x => x.refresh && x.refresh());
  document.querySelectorAll('.task').forEach(t => t.classList.toggle('done', DONE[t.dataset.t]()));
  const c = counts(), done = c.reduce((x,y) => x + y.s, 0);
  window.scores = {}; c.forEach((x,i) => window.scores['step'+(i+1)] = x);
  document.querySelectorAll('.tab').forEach((t,i) => { t.classList.toggle('full', c[i].s === c[i].max); t.classList.toggle('part', c[i].s > 0 && c[i].s < c[i].max); });
  $('fill').style.width = (done / TOTAL * 100) + '%';
  $('cnt').textContent = done + '/' + TOTAL + ' tasks';
  $('sum').innerHTML = c.map((x,i) => `<span class="${x.s === x.max ? 'full' : x.s ? 'part' : ''}">${STEPS[i].extra ? STEPS[i].lab : 'Part ' + (i+1)} · ${x.s}/${x.max}</span>`).join('');
  $('sendBtn').textContent = done === TOTAL ? 'Send my homework ✓' : 'Send my progress (' + done + '/' + TOTAL + ')';
  $('sendBtn').disabled = done === 0 || sending;
  save();
  try { localStorage.setItem(C.progress, JSON.stringify({done, total:TOTAL, at:new Date().toISOString(), sentAt:S.sentAt || ''})); } catch(e){}
  $('saved').textContent = 'Saved on this device ✓' + (S.sentAt ? ' · last sent ' + new Date(S.sentAt).toLocaleString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '');
}

/* name + send */
const fromLink = new URLSearchParams(location.search).get('s');
if (fromLink) { $('student').value = fromLink; $('nameCard').style.display = 'none'; }
else if (S.name) $('student').value = S.name;
$('student').addEventListener('input', () => { S.name = $('student').value; save(); });

function openText(){
  const out = [];
  C.parts.forEach((p,i) => { const n = i+1, l = [];
    if (p.write !== false && String(V('w'+n)).trim()) l.push(String(V('w'+n)).trim());
    l.push('Shadowing: ' + (+V('c'+n)||0) + '/3 times');
    out.push('PART ' + n + ' — ' + p.title.toUpperCase() + '\n' + l.join('\n')); });
  (C.extra || []).forEach(x => { const t = x.text && x.text(); if (t) out.push(x.title.toUpperCase() + '\n' + t); });
  return out.join('\n\n');
}
$('sendBtn').onclick = () => {
  const student = $('student').value.trim();
  if (!student) { $('nameCard').style.display = 'block'; window.scrollTo({top:0, behavior:'smooth'}); $('student').focus();
    $('fbS').className = 'fb warn'; $('fbS').textContent = 'Please type your name at the top first.'; return; }
  update();
  const c = counts(), done = c.reduce((x,y) => x + y.s, 0);
  Object.keys(HWR.snaps).forEach(k => delete HWR.snaps[k]);
  sending = true; $('sendBtn').disabled = true; $('fbS').className = 'fb'; $('fbS').textContent = 'Sending…';
  HWR.send({ homework: C.homework, student, score: done, max: TOTAL,
    breakdown: c.map((x,i) => (STEPS[i].extra ? STEPS[i].lab : 'Part ' + (i+1)) + ' ' + x.s + '/' + x.max).join(' · '), open: openText() })
  .then(() => { S.sentAt = new Date().toISOString(); $('fbS').className = 'fb good';
    $('fbS').textContent = done === TOTAL ? 'Sent! 🎉 Great job — see you in the lesson.' : 'Sent ✓ Keep going — you can send again later.'; })
  .catch(() => { $('fbS').className = 'fb warn'; $('fbS').textContent = 'Not sent. Check your internet and try again.'; })
  .finally(() => { sending = false; update(); });
};

window.SVupdate = update;
update();
show(S.tab || 1);
})();
