/* English File B1 homework kit.
   A page sets window.HW = { homework, kicker, title, intro, tasks:[...] } and loads this file after assets/hw-report.js.
   Task: { title, sub, type, media, html, help:{label,html}, cover:{label,html}, perfect:true, ...type data }
   Types:
     pick   items:["text {wrong|right*|wrong} text", ...]          (one or more dropdowns per sentence; raw:true = items are HTML)
     gaps   items:["text {answer|alt::hint} text", ...]  bank:[...]  (typed gaps)
     choice items:[{q, opts:[...], a:index, why}]
     match  pairs:[[left,right],...]  pool:[extra rights]
     flip   items:[{q, a, accept:[...]}]                            (type from memory, then see the answer)
     write  prompts:[{q, ph, big}] minWords, keys:[[label,regex]], need, formal:true
     voice  points:[...], tick                                    (Telegram voice message + record yourself)
     shadow count, note                                           (counter)
     checklist items:[...], tick label                            (every box must be ticked)
   write extras: must:[[label,regex]] (all required) · warn:[[label,regex]] (red flags, checked on the raw text)
   Any field with data-send="Label" (e.g. a notes drawer) is sent to the teacher too.
   media: {yt:'id', start, end, title}  or  {link:url, label, note} */
(function(){
const C = window.HW, $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s||'').toLowerCase().replace(/[’‘`´]/g,"'").replace(/[“”]/g,'"').replace(/[.?!,;:"]/g,'').replace(/\s+/g,' ').trim();
const words = t => String(t||'').trim().split(/\s+/).filter(Boolean).length;
const shuffle = (a, seed) => { a = a.slice(); let s = seed || 7; for (let i = a.length-1; i > 0; i--){ s = (s*9301+49297)%233280; const j = Math.floor(s/233280*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const scores = {}, done = {}, notes = {};
window.scores = scores;
const CHECK = {}, RESET = {}, AFTER = [];
const T = C.tasks.map((t, i) => Object.assign({id:'ex'+(i+1), n:i+1}, t));
const OPEN = ['write','voice','shadow'];

/* ---------- page shell ---------- */
document.title = 'Homework: ' + C.title;
document.body.insertAdjacentHTML('afterbegin',
  '<nav class="bar" aria-label="Your progress"><div class="prog"><div id="steps" style="display:flex;gap:6px;align-items:center"></div></div></nav>' +
  '<div class="wrap"><header class="hero"><small>' + esc(C.kicker) + '</small><h1>' + esc(C.title) + '</h1><p>' + (C.intro||'') + '</p>' +
  '<div class="name" id="nameCard"><label for="student">Your name</label><input id="student" data-k="student" placeholder="Type your name"></div></header>' +
  '<div id="tasks"></div>' +
  '<div class="send final"><h2>Ready to send?</h2><p>Finish all the tasks, then send your homework to your teacher.</p><div class="list" id="cl"></div>' +
  '<button class="btn" id="sendBtn" disabled>Send to my teacher</button><div class="fb" id="sendMsg" style="margin-top:12px"></div></div></div>');

function mediaHtml(m){
  if (!m) return '';
  if (m.yt){
    const src = 'https://www.youtube-nocookie.com/embed/' + m.yt + '?rel=0&modestbranding=1' + (m.start ? '&start=' + m.start : '') + (m.end ? '&end=' + m.end : '');
    return '<div class="media"><div class="vid"><iframe src="' + src + '" title="' + esc(m.title||'Video') + '" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' +
      '<a class="alt" href="https://www.youtube.com/watch?v=' + m.yt + (m.start ? '&t=' + m.start + 's' : '') + '" target="_blank" rel="noopener">Video not playing? Open it on YouTube</a>' + (m.note ? '<div class="mnote">' + m.note + '</div>' : '') + '</div>';
  }
  return '<div class="media"><a class="open" href="' + esc(m.link) + '" target="_blank" rel="noopener">' + (m.label||'Open') + ' ↗</a>' + (m.note ? '<div class="mnote">' + m.note + '</div>' : '') + '</div>';
}
function head(t){
  return '<div class="th"><div class="num">' + t.n + '</div><div>' + (t.tag ? '<span class="tag">' + esc(t.tag) + '</span>' : '') + '<h2>' + t.title + '</h2>' + (t.sub ? '<p>' + t.sub + '</p>' : '') + '</div></div>';
}
function wrapSec(t, body, checkable){
  return '<section class="task" id="' + t.id + '">' + head(t) + (t.html||'') +
    (t.cover ? '<details class="cover"><summary>' + t.cover.label + '</summary><div class="in">' + t.cover.html + '</div></details>' : '') +
    mediaHtml(t.media) +
    (t.help ? '<details class="help"><summary>' + t.help.label + '</summary><div class="in">' + t.help.html + '</div></details>' : '') +
    body + (checkable ? '<div class="act"><button class="btn" data-chk>Check</button><button class="btn ghost" data-rst>Try again</button><span class="fb" id="' + t.id + '_fb"></span></div>' : '') + '</section>';
}

/* ---------- builders ---------- */
const B = {
  pick(t){
    let k = 0;
    const lis = t.items.map((s, i) => '<li>' + (t.raw ? s : esc(s)).replace(/\{([^}]+)\}/g, (_, g) => {
      const opts = g.split('|'), right = opts.find(o => /\*$/.test(o)).replace(/\*$/,'');
      const sh = shuffle(opts.map(o => o.replace(/\*$/,'')), i*31+k+3);
      return '<select class="pick" data-k="' + t.id + '_s' + (k++) + '" data-a="' + esc(right) + '"><option value="">…</option>' + sh.map(o => '<option>' + esc(o) + '</option>').join('') + '</select>';
    }) + '<span class="fixk"></span></li>');
    return wrapSec(t, '<ol class="items">' + lis.join('') + '</ol>', true);
  },
  gaps(t){
    let k = 0;
    const lis = t.items.map(s => '<li>' + esc(s).replace(/\{([^}]+)\}/g, (_, g) => {
      const [ans, hint] = g.split('::'), main = ans.split('|')[0];
      return '<input class="gap' + (main.length > 12 ? ' w' : '') + '" data-k="' + t.id + '_g' + (k++) + '" data-a="' + esc(ans) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="gap">' + (hint ? ' <span class="hintb">(' + esc(hint) + ')</span>' : '');
    }) + '<span class="fixk"></span></li>');
    const bank = t.bank ? '<div class="chips">' + t.bank.map(b => '<span>' + esc(b) + '</span>').join('') + '</div>' : '';
    return wrapSec(t, bank + (t.story ? '<div class="story">' + lis.map(l => l.replace(/^<li>|<\/li>$/g,'')).join(' ') + '</div>' : '<ol class="items">' + lis.join('') + '</ol>'), true);
  },
  choice(t){
    const qs = t.items.map((q, i) => '<div class="q" data-i="' + i + '"><p>' + (t.items.length > 1 ? (i+1) + '. ' : '') + q.q + '</p><div class="opts">' +
      q.opts.map((o, j) => '<button type="button" class="opt" data-j="' + j + '">' + o + '</button>').join('') +
      '</div><input type="hidden" data-k="' + t.id + '_c' + i + '"><div class="why"></div></div>');
    return wrapSec(t, '<div class="qs">' + qs.join('') + '</div>', true);
  },
  match(t){
    const rights = shuffle(t.pairs.map(p => p[1]).concat(t.pool||[]), t.n*13);
    const opts = '<option value="">— choose —</option>' + rights.map(r => '<option>' + esc(r) + '</option>').join('');
    return wrapSec(t, t.pairs.map((p, i) => '<div class="mrow"><div class="ml">' + esc(p[0]) + '</div><div><select data-k="' + t.id + '_m' + i + '" data-a="' + esc(p[1]) + '">' + opts + '</select><span class="fixk"></span></div></div>').join(''), true);
  },
  flip(t){
    return wrapSec(t, '<div class="flips">' + t.items.map((f, i) => '<div class="flip"><div class="fq">' + (i+1) + '. ' + f.q + '</div><input data-k="' + t.id + '_f' + i + '" autocomplete="off" placeholder="Type from memory…"><div class="fa"></div></div>').join('') + '</div>', true);
  },
  write(t){
    const ps = t.prompts.map((p, i) => '<div class="wq"><label for="' + t.id + '_w' + i + '">' + p.q + '</label><textarea id="' + t.id + '_w' + i + '" data-k="' + t.id + '_w' + i + '"' + (p.big ? ' class="big"' : '') + ' placeholder="' + esc(p.ph||'') + '"></textarea><div class="wc" id="' + t.id + '_wc' + i + '"></div></div>');
    const meter = t.keys ? '<div class="meter" id="' + t.id + '_m"><small>' + (t.keysLabel || 'Phrases from the lesson') + ' <b id="' + t.id + '_n">0 / ' + t.need + '</b></small><div class="found" id="' + t.id + '_f"><em>They will appear here.</em></div></div>' : '';
    const must = t.must ? '<div class="meter" id="' + t.id + '_mu"><small>' + (t.mustLabel || 'Must have') + ' <b id="' + t.id + '_mun">0 / ' + t.must.length + '</b></small><div class="found" id="' + t.id + '_muf"></div></div>' : '';
    const warn = t.warn ? '<div class="meter full" id="' + t.id + '_wa"><small>' + (t.warnLabel || 'Watch out') + ' <b id="' + t.id + '_wan">0</b></small><div class="found" id="' + t.id + '_waf"><em>Nothing to fix. Good!</em></div></div>' : '';
    const formal = t.formal ? '<div class="meter" id="' + t.id + '_fm"><small>Contractions (not OK in a formal email) <b id="' + t.id + '_fn">0</b></small><div class="found" id="' + t.id + '_ff"><em>None. Good!</em></div></div>' : '';
    return wrapSec(t, ps.join('') + meter + must + warn + formal + '<div class="act"><button class="btn" id="' + t.id + '_save">' + (t.saveLabel || 'Save my answer') + '</button><span class="fb" id="' + t.id + '_fb"></span></div>', false);
  },
  voice(t){
    return wrapSec(t, '<div class="voice"><ul>' + t.points.map(p => '<li>' + p + '</li>').join('') + '</ul>' +
      '<div class="rec"><button class="btn small ghost" id="' + t.id + '_rec">🎙 Practise: record myself</button><span class="hintb" id="' + t.id + '_rs">Optional. Listen to yourself, then record the real message in Telegram.</span><audio id="' + t.id + '_au" controls hidden></audio></div>' +
      '<div class="wq" style="margin-top:12px"><label for="' + t.id + '_note">My plan or notes (optional)</label><textarea id="' + t.id + '_note" data-k="' + t.id + '_note" placeholder="Key words for your message…"></textarea></div>' +
      '<label class="tick"><input type="checkbox" data-k="' + t.id + '_tick"> ' + (t.tick || 'I sent my voice message to my teacher on Telegram') + '</label>' +
      '<div class="act"><button class="btn" id="' + t.id + '_save">Done</button><span class="fb" id="' + t.id + '_fb"></span></div></div>', false);
  },
  checklist(t){
    return wrapSec(t, '<div class="checks">' + t.items.map((it, i) => '<label class="tick"><input type="checkbox" data-k="' + t.id + '_t' + i + '"> ' + it + '</label>').join('') + '</div>' +
      '<div class="act"><button class="btn" id="' + t.id + '_save">' + (t.saveLabel || 'Done') + '</button><span class="fb" id="' + t.id + '_fb"></span></div>', false);
  },
  shadow(t){
    const n = t.count || 3;
    return wrapSec(t, (t.note ? '<p>' + t.note + '</p>' : '') + '<div class="counter"><button class="btn small" id="' + t.id + '_plus">+1 time</button><div class="dots" id="' + t.id + '_dots">' + '<i></i>'.repeat(n) + '</div><button class="btn small ghost" id="' + t.id + '_zero">reset</button><input type="hidden" data-k="' + t.id + '_cnt" value="0"></div><div class="act"><span class="fb" id="' + t.id + '_fb"></span></div>', false);
  }
};
$('tasks').innerHTML = T.map(t => B[t.type](t)).join('');

/* ---------- progress + scoring ---------- */
const fb = (id, txt, c) => { const e = $(id); if (e){ e.textContent = txt; e.className = 'fb ' + (c||''); } };
function progress(){
  $('steps').innerHTML = T.map(t => '<a class="step' + (done[t.id] ? ' y' : '') + '" href="#' + t.id + '"><b>' + (done[t.id] ? '✓' : t.n) + '</b><span>' + esc(t.short || ('Task ' + t.n)) + '</span></a>').join('');
  $('cl').innerHTML = T.map(t => '<span class="' + (done[t.id] ? 'y' : '') + '">' + (done[t.id] ? '✓ ' : '') + esc(t.short || ('Task ' + t.n)) + '</span>').join('');
  $('sendBtn').disabled = T.some(t => !done[t.id]) || sent;
}
function markDone(id){ done[id] = true; $(id).classList.add('done'); progress(); }
function record(t, s, max){
  const first = !scores[t.id];
  if (first){ scores[t.id] = {s, max}; if (window.HWR) HWR.snap(t.id); }
  const perfect = s === max;
  let msg = perfect ? 'Perfect! ' + s + '/' + max + (first ? '' : ' · your first try (' + scores[t.id].s + '/' + max + ') is saved')
    : (first ? 'First try saved: ' + s + '/' + max + '.' : 'Your first try (' + scores[t.id].s + '/' + max + ') is saved.') + ' Fix the red ones and check again.';
  if (t.perfect && !perfect) msg += ' This task is done only when everything is green.';
  fb(t.id + '_fb', msg, perfect ? 'good' : 'warn');
  if (!t.perfect || perfect) markDone(t.id);
}
const okAns = (val, a) => a.split('|').some(x => norm(x) === norm(val));

T.forEach(t => {
  const sec = $(t.id);
  if (t.type === 'pick' || t.type === 'gaps' || t.type === 'match'){
    const els = [...sec.querySelectorAll('[data-a]')];
    els.forEach(e => e.addEventListener(e.tagName === 'SELECT' ? 'change' : 'input', () => e.classList.remove('ok','bad')));
    CHECK[t.id] = () => {
      let n = 0;
      els.forEach(e => { const ok = okAns(e.value, e.dataset.a); e.classList.remove('ok','bad'); e.classList.add(ok ? 'ok' : 'bad'); if (!ok && e.tagName === 'INPUT') e.placeholder = e.dataset.a.split('|')[0]; if (ok) n++; });
      sec.querySelectorAll('li, .mrow').forEach(li => {
        const bad = [...li.querySelectorAll('[data-a]')].filter(e => !e.classList.contains('ok'));
        const k = li.querySelector('.fixk'); if (!k) return;
        k.textContent = bad.length ? '✓ ' + bad.map(e => e.dataset.a.split('|')[0]).join(' · ') : '';
      });
      return [n, els.length];
    };
    RESET[t.id] = () => { els.forEach(e => { e.value = ''; e.placeholder = ''; e.classList.remove('ok','bad'); }); sec.querySelectorAll('.fixk').forEach(k => k.textContent = ''); };
  }
  if (t.type === 'choice'){
    sec.querySelectorAll('.q').forEach(q => {
      const hid = q.querySelector('input'); q.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        hid.value = b.dataset.j; q.querySelectorAll('.opt').forEach(x => x.classList.remove('on','ok','bad')); b.classList.add('on'); q.querySelector('.why').className = 'why'; q.querySelector('.why').textContent = ''; save();
      });
    });
    AFTER.push(() => sec.querySelectorAll('.q').forEach(q => { const v = q.querySelector('input').value; if (v !== '') q.querySelector('.opt[data-j="' + v + '"]').classList.add('on'); }));
    CHECK[t.id] = () => {
      let n = 0;
      sec.querySelectorAll('.q').forEach(q => {
        const it = t.items[+q.dataset.i], v = q.querySelector('input').value, ok = v !== '' && +v === it.a;
        q.querySelectorAll('.opt').forEach(x => x.classList.remove('ok','bad'));
        if (v !== '') q.querySelector('.opt[data-j="' + v + '"]').classList.add(ok ? 'ok' : 'bad');
        const w = q.querySelector('.why');
        if (ok){ n++; w.className = 'why show'; w.innerHTML = it.why ? '✓ ' + it.why : ''; } else { w.className = 'why'; w.textContent = v === '' ? 'Choose an answer.' : 'Not this one. Try again.'; }
      });
      return [n, t.items.length];
    };
    RESET[t.id] = () => sec.querySelectorAll('.q').forEach(q => { q.querySelector('input').value = ''; q.querySelectorAll('.opt').forEach(x => x.classList.remove('on','ok','bad')); q.querySelector('.why').textContent = ''; });
  }
  if (t.type === 'flip'){
    const ins = [...sec.querySelectorAll('.flip input')];
    ins.forEach(i => i.addEventListener('input', () => i.classList.remove('ok','bad')));
    CHECK[t.id] = () => {
      let n = 0;
      ins.forEach((i, k) => {
        const f = t.items[k], v = norm(i.value), ok = !!v && f.accept.some(a => v.includes(norm(a)));
        i.classList.remove('ok','bad'); i.classList.add(ok ? 'ok' : 'bad'); if (ok) n++;
        i.parentNode.querySelector('.fa').textContent = '✓ ' + f.a;
      });
      return [n, ins.length];
    };
    RESET[t.id] = () => ins.forEach(i => { i.value = ''; i.classList.remove('ok','bad'); i.parentNode.querySelector('.fa').textContent = ''; });
  }
  const chk = sec.querySelector('[data-chk]');
  if (chk){
    chk.onclick = () => { const [s, max] = CHECK[t.id](); record(t, s, max); save(); };
    sec.querySelector('[data-rst]').onclick = () => { RESET[t.id](); fb(t.id + '_fb', ''); save(); };
  }

  if (t.type === 'write'){
    const tas = t.prompts.map((_, i) => $(t.id + '_w' + i));
    const scan = () => {
      const all = tas.map(x => x.value).join(' \n ');
      tas.forEach((x, i) => { $(t.id + '_wc' + i).textContent = words(x.value) + ' words' + (t.minWords ? ' (at least ' + t.minWords + ')' : ''); });
      let found = [];
      if (t.keys){
        const low = norm(all);
        found = t.keys.filter(([, re]) => new RegExp(re, 'i').test(low)).map(([l]) => l);
        $(t.id + '_n').textContent = found.length + ' / ' + t.need; $(t.id + '_m').classList.toggle('full', found.length >= t.need);
        $(t.id + '_f').innerHTML = found.length ? found.map(w => '<span>' + esc(w) + '</span>').join('') : '<em>They will appear here.</em>';
      }
      let miss = [], flags = [];
      if (t.must){
        const low = norm(all);
        miss = t.must.filter(([, re]) => !new RegExp(re, 'i').test(low));
        $(t.id + '_mun').textContent = (t.must.length - miss.length) + ' / ' + t.must.length; $(t.id + '_mu').classList.toggle('full', !miss.length);
        $(t.id + '_muf').innerHTML = t.must.map(([l, re]) => '<span' + (miss.some(m => m[0] === l) ? ' class="no"' : '') + '>' + (miss.some(m => m[0] === l) ? '' : '✓ ') + esc(l) + '</span>').join('');
      }
      if (t.warn){
        flags = t.warn.filter(([, re]) => new RegExp(re, 'i').test(all)).map(([l]) => l);
        $(t.id + '_wan').textContent = flags.length; $(t.id + '_wa').classList.toggle('full', !flags.length);
        $(t.id + '_waf').innerHTML = flags.length ? flags.map(w => '<span class="no">' + esc(w) + '</span>').join('') : '<em>Nothing to fix. Good!</em>';
      }
      let con = [];
      if (t.formal){
        con = (all.match(/\b(i'm|i've|i'd|i'll|don't|doesn't|didn't|can't|won't|isn't|aren't|wasn't|weren't|it's|we're|you're|they're|couldn't|wouldn't|shouldn't|haven't|hasn't)\b/gi) || []);
        $(t.id + '_fn').textContent = con.length; $(t.id + '_fm').classList.toggle('full', !con.length);
        $(t.id + '_ff').innerHTML = con.length ? con.map(c => '<span class="no">' + esc(c) + '</span>').join('') : '<em>None. Good!</em>';
      }
      return {found, con, miss, flags};
    };
    sec.addEventListener('input', scan); AFTER.push(scan);
    $(t.id + '_save').onclick = () => {
      const r = scan(), short = tas.findIndex(x => words(x.value) < (t.minWords || 5));
      if (short >= 0){ tas[short].focus(); return fb(t.id + '_fb', 'Write a bit more: at least ' + (t.minWords || 5) + ' words' + (tas.length > 1 ? ' in each answer.' : '.'), 'warn'); }
      if (t.keys && r.found.length < t.need) return fb(t.id + '_fb', 'Use at least ' + t.need + ' of the phrases. You have ' + r.found.length + '.' + (t.help ? ' Open the yellow box for ideas.' : ''), 'warn');
      if (t.must && r.miss.length) return fb(t.id + '_fb', 'Don\'t forget: ' + r.miss.map(m => m[0]).join(', ') + '.', 'warn');
      if (t.formal && r.con.length) return fb(t.id + '_fb', 'Formal email: write ' + r.con[0] + ' in full (e.g. I am, do not).', 'warn');
      notes[t.id] = 'TASK ' + t.n + ' · ' + t.title.replace(/<[^>]+>/g,'') + (r.found.length ? ' (used: ' + r.found.join(', ') + ')' : '') + (r.flags && r.flags.length ? ' [check: ' + r.flags.join(', ') + ']' : '') + '\n' + t.prompts.map((p, i) => (t.prompts.length > 1 ? 'Q: ' + p.q.replace(/<[^>]+>/g,'') + '\nA: ' : '') + tas[i].value.trim()).join('\n\n');
      fb(t.id + '_fb', t.savedMsg || 'Saved! Your teacher will read it.', 'good'); markDone(t.id); save();
    };
  }
  if (t.type === 'voice'){
    $(t.id + '_save').onclick = () => {
      if (!sec.querySelector('[data-k$="_tick"]').checked) return fb(t.id + '_fb', 'Send your voice message on Telegram first, then tick the box.', 'warn');
      const nt = $(t.id + '_note').value.trim();
      notes[t.id] = 'TASK ' + t.n + ' (voice message): sent on Telegram ✓' + (nt ? '\nNotes: ' + nt : '');
      fb(t.id + '_fb', 'Saved. Your teacher will listen to it on Telegram.', 'good'); markDone(t.id); save();
    };
    let mr = null, chunks = [];
    $(t.id + '_rec').onclick = async () => {
      const b = $(t.id + '_rec');
      if (mr && mr.state === 'recording'){ mr.stop(); return; }
      try {
        const st = await navigator.mediaDevices.getUserMedia({audio:true}); chunks = []; mr = new MediaRecorder(st);
        mr.ondataavailable = e => chunks.push(e.data);
        mr.onstop = () => { st.getTracks().forEach(x => x.stop()); const a = $(t.id + '_au'); a.src = URL.createObjectURL(new Blob(chunks)); a.hidden = false; b.textContent = '🎙 Record again'; $(t.id + '_rs').textContent = 'Listen. Happy? Now record it in Telegram.'; };
        mr.start(); b.textContent = '⏹ Stop'; $(t.id + '_rs').textContent = 'Recording…';
      } catch(e){ $(t.id + '_rs').textContent = 'The microphone is not available here. Just record in Telegram.'; }
    };
  }
  if (t.type === 'checklist'){
    $(t.id + '_save').onclick = () => {
      const bx = [...sec.querySelectorAll('input[type=checkbox]')], left = bx.filter(b => !b.checked).length;
      if (left) return fb(t.id + '_fb', left + (left > 1 ? ' boxes are' : ' box is') + ' not ticked yet. Fix your text first, then tick.', 'warn');
      notes[t.id] = 'TASK ' + t.n + ' · ' + t.title.replace(/<[^>]+>/g,'') + ': all ticked ✓';
      fb(t.id + '_fb', t.savedMsg || 'Great, all checked!', 'good'); markDone(t.id); save();
    };
  }
  if (t.type === 'shadow'){
    const n = t.count || 3, hid = sec.querySelector('[data-k$="_cnt"]');
    const paint = () => { const c = +hid.value || 0; [...$(t.id + '_dots').children].forEach((d, i) => d.classList.toggle('on', i < c));
      if (c >= n && !done[t.id]){ notes[t.id] = 'TASK ' + t.n + ' (shadowing): done ' + c + ' times ✓'; fb(t.id + '_fb', 'Great! Done ' + n + ' times.', 'good'); markDone(t.id); } };
    $(t.id + '_plus').onclick = () => { hid.value = Math.min(n, (+hid.value||0) + 1); paint(); save(); };
    $(t.id + '_zero').onclick = () => { hid.value = 0; paint(); save(); };
    AFTER.push(paint);
  }
});

/* ---------- send ---------- */
let sent = false;
const fromLink = new URLSearchParams(location.search).get('s');
if (fromLink){ $('student').value = fromLink; $('nameCard').style.display = 'none'; }
$('sendBtn').onclick = () => {
  const student = $('student').value.trim();
  if (!student){ $('nameCard').style.display = 'flex'; $('student').focus(); window.scrollTo(0,0); return fb('sendMsg', 'Type your name at the top first.', 'warn'); }
  let s = 0, max = 0; const parts = [];
  T.filter(t => scores[t.id]).forEach(t => { s += scores[t.id].s; max += scores[t.id].max; parts.push('Ex' + t.n + ' ' + scores[t.id].s + '/' + scores[t.id].max); });
  $('sendBtn').disabled = true; fb('sendMsg', 'Sending…');
  HWR.send({homework: C.homework, student, score: s, max, breakdown: parts.join(' · '), open: T.filter(t => notes[t.id]).map(t => notes[t.id]).concat([...document.querySelectorAll('[data-send]')].filter(e => e.value.trim()).map(e => e.dataset.send.toUpperCase() + '\n' + e.value.trim())).join('\n\n')})
    .then(() => { sent = true; fb('sendMsg', 'Sent! Your score: ' + s + '/' + max + '. Well done! 🎉', 'good'); $('sendBtn').textContent = 'Sent ✓'; save(); })
    .catch(() => { $('sendBtn').disabled = false; fb('sendMsg', 'Not sent. Check your internet and try again.', 'warn'); });
};

/* ---------- autosave ---------- */
const STORE = 'hw:' + location.pathname + ':' + (fromLink || '');
const fields = () => [...document.querySelectorAll('[data-k]')];
function save(){
  try { localStorage.setItem(STORE, JSON.stringify({v:1, f: Object.fromEntries(fields().map(e => [e.dataset.k, e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value])), scores, done, notes, sent, snaps: window.HWR ? HWR.snaps : {}})); } catch(e){}
}
window.hwSave = save;
(function restore(){
  let d; try { d = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch(e){}
  if (d && d.v){
    fields().forEach(e => { const v = d.f[e.dataset.k]; if (v == null || (e.id === 'student' && fromLink)) return; if (e.type === 'checkbox') e.checked = !!v; else e.value = v; });
    Object.assign(scores, d.scores || {}); Object.assign(notes, d.notes || {}); sent = !!d.sent;
    if (window.HWR && d.snaps) Object.assign(HWR.snaps, d.snaps);
  }
  AFTER.forEach(f => f());
  if (d && d.v){
    T.forEach(t => { if (scores[t.id] && CHECK[t.id]){ CHECK[t.id](); fb(t.id + '_fb', 'Your first try (' + scores[t.id].s + '/' + scores[t.id].max + ') is saved.', scores[t.id].s === scores[t.id].max ? 'good' : 'warn'); } });
    Object.keys(d.done || {}).forEach(k => d.done[k] && $(k) && markDone(k));
    if (sent){ $('sendBtn').textContent = 'Sent ✓'; }
  }
})();
document.addEventListener('input', save);
document.addEventListener('change', save);
progress();
})();
