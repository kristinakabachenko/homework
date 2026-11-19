/* Task type "shift" for the English File kit (needs assets/degree-check.js).
   { type:'shift', cards:[{a, b, emoji, adj, ideas:[...]}], need: 5, choose: true, ask: 'label for a question row' (optional) }
   choose:true  → a deck: the student picks cards, one at a time; need = how many cards must be finished.
   choose:false → every card is shown; all must be finished.
   Each card: 3 sentences (small / medium / big difference), checked one by one with explanations.
   The first try of every sentence is saved and sent to the teacher with the final version. */
(function(){
window.HW_EXT = window.HW_EXT || {};
const ROWS = [
  {slot:'small', label:'Small difference', dot:'s'},
  {slot:'medium', label:'Medium difference', dot:'m'},
  {slot:'big', label:'Big difference', dot:'b'}
];
const css = `
.deck{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 16px}
.dcard{position:relative;text-align:left;border:2px solid var(--line);background:#fffdf9;border-radius:16px;padding:12px 12px 10px;cursor:pointer;font-size:14px;line-height:1.3;font-weight:700;color:var(--ink);transition:transform .15s,border-color .15s}
.dcard:hover{transform:translateY(-2px);border-color:var(--accent)}
.dcard .de{font-size:26px;display:block;margin-bottom:6px}
.dcard .vs{display:block;font-size:11px;font-weight:800;color:var(--accent);letter-spacing:.08em;margin:3px 0}
.dcard.on{border-color:var(--brand);box-shadow:0 0 0 3px var(--tint)}
.dcard.go::after{content:'…';position:absolute;top:8px;right:10px;color:var(--accent);font-weight:800}
.dcard.ok{border-color:var(--ok);background:var(--okbg)}
.dcard.ok::after{content:'✓';position:absolute;top:6px;right:10px;color:var(--ok);font-size:18px;font-weight:800}
.dcount{font-weight:800;font-size:15px;margin:0 0 10px;color:var(--soft)}
.dcount b{color:var(--ink)}
.ws{border:2px solid var(--line);border-radius:18px;padding:16px;margin-bottom:14px;background:#fff}
.ws.ok{border-color:var(--ok)}
.vsb{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin-bottom:14px}
.vsb .side{background:var(--tint2);border-radius:14px;padding:14px 12px;text-align:center;font-weight:800;font-size:17px;line-height:1.25;display:flex;align-items:center;justify-content:center}
.vsb .side.b{background:var(--tint)}
.vsb .mid{display:grid;place-items:center;font-size:24px}
@media (max-width:520px){ .vsb .side{font-size:15px;padding:10px 8px} }
details.ideas{margin:-4px 0 12px;font-size:14px}
details.ideas summary{cursor:pointer;color:var(--soft);font-weight:700}
details.ideas .chips{margin:8px 0 0}
.srow{margin-bottom:14px}
.srow label{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px;margin-bottom:6px}
.srow label i{width:14px;height:14px;border-radius:50%;display:inline-block;flex:none}
.srow label i.s{background:#E8C9A0}.srow label i.m{background:#D98A3D}.srow label i.b{background:#8A3B12}.srow label i.q{background:#5E8C9A}
.srow label .meter3{display:inline-flex;gap:2px;margin-left:2px}
.srow label .meter3 u{width:7px;height:12px;border-radius:2px;background:var(--line);display:inline-block;text-decoration:none}
.srow label .meter3 u.f{background:var(--brand)}
.srow textarea{display:block;width:100%;min-height:58px;border:2px solid var(--line);border-radius:12px;padding:9px 12px;background:#fffdf9;resize:vertical;line-height:1.45}
.srow textarea:focus{outline:none;border-color:var(--accent);background:#fff}
.srow textarea.ok{border-color:var(--ok);background:var(--okbg)}
.srow textarea.bad{border-color:var(--bad);background:#fffaf8}
.sfb{font-size:15px;line-height:1.45;margin-top:6px}
.sfb .yes{color:var(--ok);font-weight:800}
.sfb ul{margin:4px 0 0;padding-left:20px;color:var(--bad)}
.sfb ul li{margin-bottom:3px}
.sfb ul li b{color:var(--ink)}
.sfb .fix{margin-top:6px;background:var(--okbg);border-radius:10px;padding:7px 11px;color:var(--ink)}
.sfb .fix span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ok);display:block}
.sfb .fix.mdl{background:var(--tint2)}
.sfb .fix.mdl span{color:var(--brand)}
.sfb .tipx{color:var(--soft);font-size:14px}
.ws .act .btn.next{background:var(--ok)}
`;
function addCss(){ if (document.getElementById('shiftcss')) return; const st = document.createElement('style'); st.id = 'shiftcss'; st.textContent = css; document.head.appendChild(st); }
const plain = h => String(h).replace(/<s>(.*?)<\/s>/g,'~$1~').replace(/<[^>]+>/g,'');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

window.HW_EXT.shift = {
  build(t, kit){
    addCss();
    const e = kit.esc, rows = ROWS.concat(t.ask ? [{slot:'any', label:t.ask, dot:'q', q:true}] : []);
    const deck = t.choose ? '<p class="dcount" id="' + t.id + '_cnt"></p><div class="deck">' + t.cards.map((c, i) =>
      '<button type="button" class="dcard" data-card="' + i + '"><span class="de">' + (c.emoji||'🃏') + '</span>' + e(cap(c.a)) + '<span class="vs">VS</span>' + e(cap(c.b)) + '</button>').join('') + '</div>' : '<p class="dcount" id="' + t.id + '_cnt"></p>';
    const ws = t.cards.map((c, i) => '<div class="ws" id="' + t.id + '_c' + i + '"' + (t.choose ? ' hidden' : '') + '>' +
      '<div class="vsb"><div class="side">' + e(cap(c.a)) + '</div><div class="mid">' + (c.emoji||'🆚') + '</div><div class="side b">' + e(cap(c.b)) + '</div></div>' +
      (c.ideas ? '<details class="ideas"><summary>Need an adjective? Tap here</summary><div class="chips">' + c.ideas.map(w => '<span>' + e(w) + '</span>').join('') + '</div></details>' : '') +
      rows.map((r, j) => '<div class="srow"><label for="' + t.id + '_c' + i + '_r' + j + '"><i class="' + r.dot + '"></i>' + e(r.label) +
        (r.q ? '' : '<span class="meter3">' + [0,1,2].map(k => '<u' + (k <= j ? ' class="f"' : '') + '></u>').join('') + '</span>') + '</label>' +
        '<textarea id="' + t.id + '_c' + i + '_r' + j + '" data-k="' + t.id + '_c' + i + '_r' + j + '" spellcheck="false" placeholder="' + e(r.q ? (c.qph || 'Is … ?') : (j === 0 ? cap(c.a) + ' is …' : j === 1 ? cap(c.b) + ' is …' : 'Write your sentence…')) + '"></textarea><div class="sfb" id="' + t.id + '_c' + i + '_f' + j + '"></div></div>').join('') +
      '<div class="act"><button class="btn" data-check="' + i + '">Check</button><span class="fb" id="' + t.id + '_c' + i + '_fb"></span></div></div>').join('');
    return kit.wrapSec(t, deck + ws + '<input type="hidden" data-k="' + t.id + '_state"><div class="act"><span class="fb" id="' + t.id + '_fb"></span></div>', false);
  },
  init(t, sec, kit){
    const $ = id => document.getElementById(id), e = kit.esc;
    const rows = ROWS.concat(t.ask ? [{slot:'any', label:t.ask, dot:'q', q:true}] : []);
    const need = t.choose ? (t.need || 5) : t.cards.length;
    const hid = sec.querySelector('[data-k="' + t.id + '_state"]');
    let st = {first:{}, last:{}, ok:{}, open:null};
    const persist = () => { hid.value = JSON.stringify(st); kit.save(); };
    const doneCards = () => Object.keys(st.ok).filter(k => st.ok[k]).map(Number);

    function paintCount(){
      const n = doneCards().length;
      $(t.id + '_cnt').innerHTML = t.choose ? 'Cards finished: <b>' + n + ' / ' + need + '</b>' + (n >= need ? ' 🎉 You can do more if you want!' : ' · tap a card') : 'Finished: <b>' + n + ' / ' + need + '</b>';
      sec.querySelectorAll('.dcard').forEach(b => { const i = +b.dataset.card; b.classList.toggle('ok', !!st.ok[i]); b.classList.toggle('go', !st.ok[i] && !!st.first[i]); b.classList.toggle('on', st.open === i); });
    }
    function open(i){
      if (!t.choose) return;
      st.open = i;
      t.cards.forEach((_, k) => { $(t.id + '_c' + k).hidden = k !== i; });
      paintCount(); persist();
      const w = $(t.id + '_c' + i); w.scrollIntoView({behavior:'smooth', block:'start'});
      setTimeout(() => { const ta = w.querySelector('textarea'); if (ta && !ta.value) ta.focus({preventScroll:true}); }, 350);
    }
    sec.querySelectorAll('.dcard').forEach(b => b.onclick = () => open(+b.dataset.card));

    function showRow(i, j, r){
      const ta = $(t.id + '_c' + i + '_r' + j), box = $(t.id + '_c' + i + '_f' + j);
      ta.classList.remove('ok','bad');
      if (!r){ box.innerHTML = ''; return; }
      ta.classList.add(r.ok ? 'ok' : 'bad');
      if (r.ok){
        box.innerHTML = '<span class="yes">✓ Correct!' + (rows[j].q ? '' : ' That\'s ' + (rows[j].slot === 'small' ? 'a small' : rows[j].slot === 'medium' ? 'a medium' : 'a big') + ' difference.') + '</span>' +
          (r.tips.length ? ' <span class="tipx">Small thing: ' + r.tips.join(' ') + '</span>' : '');
      } else {
        box.innerHTML = '<ul>' + r.errors.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
          (r.fixed ? '<div class="fix"><span>Correct version</span>' + e(r.fixed) + '</div>' : '') +
          (r.model ? '<div class="fix mdl"><span>For example</span>' + e(r.model) + '</div>' : '') +
          '<div class="tipx" style="margin-top:4px">Now rewrite your sentence and press <b>Check</b> again.</div>';
      }
    }
    function run(i, j){
      const c = t.cards[i], v = $(t.id + '_c' + i + '_r' + j).value.trim();
      if (!v) return null;
      return DegreeCheck.check(v, {slot: rows[j].slot, a: c.a, b: c.b, adj: c.adj, mode: rows[j].q ? 'question' : 'statement'});
    }
    function writeNotes(){
      const lines = Object.keys(st.first).map(Number).sort((x, y) => x - y).map(i => {
        const c = t.cards[i];
        return '🃏 ' + cap(c.a) + ' vs ' + c.b + (st.ok[i] ? ' ✓' : ' (not finished)') + '\n' + rows.map((r, j) => {
          const f = (st.first[i] || {})[j], l = (st.last[i] || {})[j];
          if (!f && !l) return '';
          const fin = l ? l.text : '';
          return '  ' + (r.q ? 'Question' : cap(r.slot)) + ': ' + fin + (f && !f.ok ? '\n     first try ✗: ' + f.text + '\n     (' + f.why + ')' : (f ? '  [right first time]' : ''));
        }).filter(Boolean).join('\n');
      });
      const fs = doneCards().reduce((a, i) => a + rows.filter((_, j) => st.first[i] && st.first[i][j] && st.first[i][j].ok).length, 0);
      kit.notes[t.id] = 'TASK ' + t.n + ' · ' + t.title.replace(/<[^>]+>/g,'') + ' — right first time: ' + fs + ' of ' + doneCards().length * rows.length + ' sentences\n\n' + lines.join('\n\n');
    }
    sec.querySelectorAll('[data-check]').forEach(b => b.onclick = () => {
      const i = +b.dataset.check, fbId = t.id + '_c' + i + '_fb';
      const empty = rows.findIndex((_, j) => !$(t.id + '_c' + i + '_r' + j).value.trim());
      const res = rows.map((_, j) => run(i, j));
      st.first[i] = st.first[i] || {}; st.last[i] = st.last[i] || {};
      res.forEach((r, j) => {
        if (!r) return;
        const text = $(t.id + '_c' + i + '_r' + j).value.trim();
        if (!st.first[i][j]) st.first[i][j] = {text, ok: r.ok, why: r.errors.map(plain).join(' / ')};
        st.last[i][j] = {text, ok: r.ok};
        showRow(i, j, r);
      });
      if (empty >= 0){ $(t.id + '_c' + i + '_r' + empty).focus(); kit.fb(fbId, 'Write all ' + rows.length + ' sentences, then check.', 'warn'); }
      const all = empty < 0 && res.every(r => r && r.ok);
      st.ok[i] = all;
      $(t.id + '_c' + i).classList.toggle('ok', all);
      if (all) kit.fb(fbId, t.choose ? '🎉 Card finished! Choose the next card above.' : '🎉 Finished!', 'good');
      else if (empty < 0) kit.fb(fbId, 'Fix the red sentences and check again.', 'warn');
      writeNotes(); paintCount();
      if (doneCards().length >= need && !kit.done[t.id]){
        const ds = doneCards().slice(0, need);
        const s = ds.reduce((a, k) => a + rows.filter((_, j) => st.first[k][j] && st.first[k][j].ok).length, 0);
        kit.record(t, s, need * rows.length);
        kit.fb(t.id + '_fb', 'Task done! Right first time: ' + s + ' of ' + need * rows.length + ' sentences.', 'good');
      }
      persist();
      if (all && t.choose) setTimeout(() => sec.querySelector('.deck').scrollIntoView({behavior:'smooth', block:'start'}), 900);
    });
    kit.AFTER.push(() => {
      try { const d = JSON.parse(hid.value || 'null'); if (d) st = Object.assign(st, d); } catch(x){}
      Object.keys(st.last).forEach(i => rows.forEach((_, j) => { if (st.last[i][j] && $(t.id + '_c' + i + '_r' + j).value.trim()) showRow(+i, j, run(+i, j)); }));
      Object.keys(st.ok).forEach(i => $(t.id + '_c' + i).classList.toggle('ok', !!st.ok[i]));
      if (t.choose && st.open != null) t.cards.forEach((_, k) => { $(t.id + '_c' + k).hidden = k !== st.open; });
      paintCount();
    });
    paintCount();
  }
};
})();
