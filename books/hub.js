/* Homework Library — shared engine.
   A book page only defines window.BOOK and window.HOMEWORK, then loads this file.
   Each homework object:
   {
     unit:  'Unit 7',             // groups cards into sections
     code:  '7.3',                // small label on the card (optional)
     title: 'Who gets to learn online?',
     topic: 'Online learning',
     skill: 'Listening',          // Vocabulary | Grammar | Reading | Listening | Speaking | Writing | Global skills | Review
     desc:  'One-line description for the front of the card',
     tasks: ['Task 1 …', 'Task 2 …'],   // shown on the back
     note:  'Optional extra line on the back',
     file:  'u7-3-listening.html',      // file name in the repo root
     isNew: true                        // optional ribbon
   }
*/
(function(){
  const B = window.BOOK || {}, H = window.HOMEWORK || [];
  const ROOT = B.root || '../../';
  const SKILL_COLOR = {
    'vocabulary':'var(--vocabulary)','grammar':'var(--grammar)','reading':'var(--reading)',
    'listening':'var(--listening)','global skills':'var(--global)','speaking':'var(--speaking)',
    'writing':'var(--writing)','review':'var(--review)'
  };
  const col = s => SKILL_COLOR[(s||'').toLowerCase()] || 'var(--accent)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  document.title = (B.title || 'Homework') + ' · Homework';
  if (B.color) document.documentElement.style.setProperty('--accent', B.color);

  const app = document.getElementById('app');
  const skills = [...new Set(H.map(h => h.skill).filter(Boolean))];
  let active = 'All', query = '';

  app.innerHTML = `
    <a class="back-link" href="../">← All books</a>
    <header class="hero">
      <div class="cover">${esc(B.short || B.title)}</div>
      <div><h1>${esc(B.title)}</h1><p>${esc(B.subtitle || 'Homework collection')}</p></div>
    </header>
    <div class="toolbar" role="toolbar" aria-label="Filter by skill">
      ${['All', ...skills].map(s => `<button class="chip" data-skill="${esc(s)}" aria-pressed="${s==='All'}">${
        s==='All' ? '' : `<span class="dot" style="background:${col(s)}"></span>`}${esc(s)}</button>`).join('')}
      <input class="search" type="search" placeholder="Search topic or title…" aria-label="Search">
    </div>
    <p class="count" aria-live="polite"></p>
    <main id="list"></main>`;

  const list = app.querySelector('#list'), count = app.querySelector('.count');

  function card(h){
    const tasks = (h.tasks||[]).map(t => `<li>${esc(t)}</li>`).join('');
    return `
    <div class="fc" tabindex="0" role="button" aria-label="${esc(h.title)}. Tap for details" style="--c:${col(h.skill)}">
      <div class="fc-inner">
        <div class="face front">
          <div class="body">
            <div class="meta"><span class="unit">${esc(h.code || h.unit || '')}${h.isNew ? '<span class="new">NEW</span>' : ''}</span><span class="skill">${esc(h.skill||'')}</span></div>
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

  function render(){
    const q = query.trim().toLowerCase();
    const shown = H.filter(h => (active==='All' || h.skill===active) &&
      (!q || [h.title,h.topic,h.desc,h.unit,h.code,h.skill].join(' ').toLowerCase().includes(q)));
    count.textContent = `${shown.length} homework${shown.length===1?'':'s'}`;
    if (!shown.length){ list.innerHTML = '<p class="empty">Nothing here yet.</p>'; return; }
    const units = [];
    shown.forEach(h => { const u = h.unit || 'Other'; let g = units.find(x => x.u===u); if(!g) units.push(g={u,items:[]}); g.items.push(h); });
    list.innerHTML = units.map(g => `
      <h2 class="unit-title">${esc(g.u)} ${B.units && B.units[g.u] ? `<small>${esc(B.units[g.u])}</small>` : ''}</h2>
      <div class="grid">${g.items.map(card).join('')}</div>`).join('');
  }

  app.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip){ active = chip.dataset.skill;
      app.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c===chip)); render(); return; }
    if (e.target.closest('.open')) return;               // let the link work
    const fc = e.target.closest('.fc'); if (fc) fc.classList.toggle('flipped');
  });
  app.addEventListener('keydown', e => {
    const fc = e.target.closest && e.target.closest('.fc');
    if (fc && e.target===fc && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); fc.classList.toggle('flipped'); }
  });
  app.querySelector('.search').addEventListener('input', e => { query = e.target.value; render(); });
  render();
})();
