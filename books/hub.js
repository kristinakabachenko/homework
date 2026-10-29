/* Homework Library — shared engine.
   A book page defines window.BOOK (title, theme, units) and window.HOMEWORK, then loads this file.

   Unit:      { id: '7', name: 'Education', topics: ['Online learning', 'Wishes'] }
   Homework:  {
     unit:  '7',                 // must match a unit id
     code:  '7.3',               // small label (optional)
     skill: 'Listening',         // Vocabulary | Grammar | Reading | Listening | Speaking | Writing | Global skills | Test | Revision
     title: 'Who gets to learn online?',
     topic: 'Online learning',
     desc:  'One line for the front of the card',
     tasks: ['…', '…'],          // back of the card
     note:  'Optional extra line',
     file:  'u7-3-listening.html',
     isNew: true                 // optional
   }
*/
(function(){
  const B = window.BOOK || {}, H = window.HOMEWORK || [], U = B.units || [];
  const T = B.theme || {};
  const ROOT = B.root || '../../';
  const OUTLINE = ['test','revision'];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // readable text colour on any background
  function onColor(hex){
    const m = /^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return '#fff';
    const n = parseInt(m[1],16), ch = [n>>16, n>>8&255, n&255].map(v => { v/=255; return v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4; });
    const L = .2126*ch[0] + .7152*ch[1] + .0722*ch[2];
    return L > .38 ? (T.ink || '#2b1f16') : '#fff';
  }
  const skillColor = s => (T.skills && (T.skills[s] || T.skills[(s||'').toLowerCase()])) || T.primary || '#5a1d22';

  // apply theme
  const root = document.documentElement.style;
  [['bg','--bg'],['surface','--surface'],['ink','--ink'],['muted','--muted'],['line','--line'],
   ['primary','--primary'],['secondary','--secondary'],['tertiary','--tertiary']]
    .forEach(([k,v]) => T[k] && root.setProperty(v, T[k]));
  root.setProperty('--on-primary', onColor(T.primary));

  const app = document.getElementById('app');

  function tag(h){
    const s = h.skill || '';
    return OUTLINE.includes(s.toLowerCase()) ? `<span class="tag outline">${esc(s)}</span>` : `<span class="tag">${esc(s)}</span>`;
  }

  function card(h){
    const c = skillColor(h.skill);
    const tasks = (h.tasks||[]).map(t => `<li>${esc(t)}</li>`).join('');
    return `
    <div class="fc" tabindex="0" role="button" aria-label="${esc(h.title)} — tap for details" style="--c:${c};--on-c:${onColor(c)}">
      <div class="fc-inner">
        <div class="face front">
          <div class="band"></div>
          <div class="body">
            <div class="meta"><span class="code">${esc(h.code||'')}${h.isNew?'<span class="new">NEW</span>':''}</span>${tag(h)}</div>
            <h3>${esc(h.title)}</h3>
            ${h.topic ? `<p class="topic">${esc(h.topic)}</p>` : ''}
            <p class="desc">${esc(h.desc||'')}</p>
            <div class="hint">↻ Tap to see what's inside</div>
          </div>
        </div>
        <div class="face back">
          <div class="body">
            <h4>What's inside</h4>
            ${tasks ? `<ol>${tasks}</ol>` : ''}
            ${h.note ? `<p class="note">${esc(h.note)}</p>` : ''}
          </div>
          <div class="foot">
            <button class="flipback" type="button" aria-label="Flip back">↺</button>
            <a class="open" href="${esc(ROOT + h.file)}" target="_blank" rel="noopener">Open homework →</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- home: list of units ---------- */
  function home(){
    document.title = (B.title || 'Homework') + ' · Homework';
    app.innerHTML = `
      <nav class="crumbs"><a href="../">All books</a></nav>
      <header class="masthead">
        <p class="kicker">${esc(B.kicker || 'Homework collection')}</p>
        <h1>${esc(B.title)}</h1>
        ${B.subtitle ? `<p>${esc(B.subtitle)}</p>` : ''}
      </header>
      <p class="section-label">Units</p>
      <div class="units">${U.map(u => {
        const hw = H.filter(h => String(h.unit)===String(u.id));
        const skills = [...new Set(hw.map(h => h.skill))];
        return `<a class="unit-card" href="#unit-${encodeURIComponent(u.id)}">
          <div class="unit-num"><small>Unit</small>${esc(u.id)}</div>
          <h2>${esc(u.name)}</h2>
          <ul class="topics">${(u.topics||[]).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="unit-foot"><span>${hw.length} homework${hw.length===1?'':'s'} →</span>
            <span class="dots">${skills.map(s => `<i title="${esc(s)}" style="background:${skillColor(s)}"></i>`).join('')}</span></div>
        </a>`; }).join('') || '<p class="empty">No units yet.</p>'}</div>`;
    window.scrollTo(0,0);
  }

  /* ---------- unit page: homework cards ---------- */
  let active = 'All';
  function unitPage(id){
    const u = U.find(x => String(x.id)===String(id));
    if (!u) return home();
    const hw = H.filter(h => String(h.unit)===String(u.id));
    const skills = [...new Set(hw.map(h => h.skill))];
    document.title = `Unit ${u.id} · ${B.title}`;
    app.innerHTML = `
      <nav class="crumbs"><a href="../">All books</a><span>/</span><a href="#">${esc(B.title)}</a></nav>
      <header class="unit-head">
        <div class="unit-num"><small>Unit</small>${esc(u.id)}</div>
        <div><h1>${esc(u.name)}</h1><ul class="topics">${(u.topics||[]).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </header>
      ${skills.length > 1 ? `<div class="toolbar" aria-label="Filter">${['All',...skills].map(s =>
        `<button class="chip" data-skill="${esc(s)}" aria-pressed="${s===active}">${s==='All'?'':`<span class="dot" style="background:${skillColor(s)}"></span>`}${esc(s)}</button>`).join('')}</div>` : ''}
      <div class="grid" id="grid"></div>`;
    const draw = () => {
      const shown = hw.filter(h => active==='All' || h.skill===active);
      app.querySelector('#grid').innerHTML = shown.map(card).join('') || '<p class="empty">Nothing here yet.</p>';
    };
    draw();
    app.onclickChip = draw;
    window.scrollTo(0,0);
  }

  function route(){
    const m = /^#unit-(.+)$/.exec(location.hash);
    active = 'All';
    m ? unitPage(decodeURIComponent(m[1])) : home();
  }

  app.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip){ active = chip.dataset.skill;
      app.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c===chip)); app.onclickChip && app.onclickChip(); return; }
    if (e.target.closest('.open')) return;
    const fc = e.target.closest('.fc'); if (fc) fc.classList.toggle('flipped');
  });
  app.addEventListener('keydown', e => {
    if (e.target.classList && e.target.classList.contains('fc') && (e.key==='Enter' || e.key===' ')){
      e.preventDefault(); e.target.classList.toggle('flipped'); }
  });
  window.addEventListener('hashchange', route);
  route();
})();
