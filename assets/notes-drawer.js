/* Notes drawer: a "📒 Notes" button that opens a side panel with tabs the student can
   check at any moment while doing the homework.
   A page sets, BEFORE this file and before ef-kit.js:
     window.NOTES = { title:'Lesson notes', tabs:[
       { label:'Phrases', html:'<p>…</p>' },                       // read-only notes
       { label:'My notes', edit:'my_notes', ph:'Type here…', send:'My notes from the lesson' } // editable, autosaved (and sent to the teacher if send is set)
     ]};
   Uses the page's --brand / --tint / --tint2 / --line colours (ef-kit.css). */
(function(){
  var N = window.NOTES; if (!N || !N.tabs) return;
  var css = ''
  + '.nd-fab{position:fixed;right:18px;bottom:18px;z-index:25;background:var(--brand);color:#fff;border:0;border-radius:99px;padding:13px 20px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22)}'
  + '.nd-fab:hover{filter:brightness(1.08)}'
  + '.nd{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:100%;background:#fff;border-left:1px solid var(--line);box-shadow:-12px 0 40px rgba(0,0,0,.14);z-index:30;display:flex;flex-direction:column;transform:translateX(105%);transition:transform .4s cubic-bezier(.2,.8,.2,1)}'
  + '.nd.open{transform:none}'
  + '.nd-head{background:var(--brand);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}'
  + '.nd-head b{font-size:19px;flex:1}'
  + '.nd-head button{background:rgba(255,255,255,.18);border:0;color:#fff;border-radius:99px;width:34px;height:34px;font-size:20px;cursor:pointer}'
  + '.nd-tabs{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--tint2);overflow-x:auto}'
  + '.nd-tab{flex:none;border:1.5px solid var(--line);background:#fff;border-radius:99px;padding:5px 13px;font-size:14px;font-weight:700;cursor:pointer;color:var(--ink)}'
  + '.nd-tab.on{background:var(--brand);border-color:var(--brand);color:#fff}'
  + '.nd-body{flex:1;overflow:auto;padding:16px 18px 40px;font-size:15.5px;line-height:1.6}'
  + '.nd-pane{display:none}.nd-pane.on{display:block}'
  + '.nd-pane h3{font-size:16px;margin:16px 0 6px;color:var(--brand)}.nd-pane h3:first-child{margin-top:0}'
  + '.nd-pane p{margin:0 0 10px}.nd-pane ul{margin:0 0 10px;padding-left:20px}.nd-pane li{margin-bottom:4px}'
  + '.nd-pane table{width:100%;border-collapse:collapse;margin:0 0 12px;font-size:14.5px}'
  + '.nd-pane td,.nd-pane th{border-bottom:1px solid var(--line);padding:6px 4px;text-align:left;vertical-align:top}'
  + '.nd-pane th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--soft)}'
  + '.nd-pane .ex{display:block;color:var(--soft);font-style:italic;font-size:14px}'
  + '.nd-pane .box{background:var(--tint2);border-radius:12px;padding:10px 12px;margin:0 0 12px}'
  + '.nd-pane .no{color:#c0392b}'
  + '.nd-pane textarea{width:100%;min-height:58vh;border:2px solid var(--line);border-radius:12px;padding:12px;font:inherit;line-height:1.6;background:#fffdf7;resize:vertical}'
  + '.nd-pane .tip{font-size:13px;color:var(--soft);margin-bottom:8px}'
  + '@media (min-width:1240px){body.nd-open .wrap{margin-left:max(16px,calc((100vw - 440px - 740px)/2))} body.nd-open .nd-fab{display:none}}'
  + '@media (max-width:700px){.nd{top:auto;width:100%;height:62vh;border-left:0;border-top:1px solid var(--line);border-radius:20px 20px 0 0;transform:translateY(105%)} .nd-head{border-radius:20px 20px 0 0} .nd-pane textarea{min-height:34vh}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var esc = function(s){ return String(s||'').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var tabs = N.tabs.map(function(t, i){ return '<button type="button" class="nd-tab' + (i ? '' : ' on') + '" data-i="' + i + '">' + esc(t.label) + '</button>'; }).join('');
  var panes = N.tabs.map(function(t, i){
    var inner = t.edit
      ? (t.tip ? '<div class="tip">' + t.tip + '</div>' : '') + '<textarea data-k="nd_' + esc(t.edit) + '"' + (t.send ? ' data-send="' + esc(t.send) + '"' : '') + ' placeholder="' + esc(t.ph || 'Type your notes here…') + '"></textarea>'
      : t.html;
    return '<div class="nd-pane' + (i ? '' : ' on') + '" data-i="' + i + '">' + inner + '</div>';
  }).join('');
  var box = document.createElement('div');
  box.innerHTML = '<aside class="nd" id="ndDrawer" aria-label="' + esc(N.title || 'Notes') + '"><div class="nd-head"><b>📒 ' + esc(N.title || 'Notes') + '</b><button type="button" id="ndClose" aria-label="Close">×</button></div>'
    + '<div class="nd-tabs">' + tabs + '</div><div class="nd-body">' + panes + '</div></aside>'
    + '<button type="button" class="nd-fab" id="ndFab">📒 ' + esc(N.button || 'Notes') + '</button>';
  while (box.firstChild) document.body.appendChild(box.firstChild);

  var d = document.getElementById('ndDrawer');
  function open(i){ d.classList.add('open'); document.body.classList.add('nd-open'); if (i != null) show(i); }
  function close(){ d.classList.remove('open'); document.body.classList.remove('nd-open'); }
  function show(i){
    [].forEach.call(d.querySelectorAll('.nd-tab'), function(b){ b.classList.toggle('on', +b.dataset.i === +i); });
    [].forEach.call(d.querySelectorAll('.nd-pane'), function(p){ p.classList.toggle('on', +p.dataset.i === +i); });
  }
  document.getElementById('ndFab').onclick = function(){ d.classList.contains('open') ? close() : open(); };
  document.getElementById('ndClose').onclick = close;
  d.querySelector('.nd-tabs').onclick = function(e){ var b = e.target.closest('.nd-tab'); if (b) show(b.dataset.i); };
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  /* any element with data-notes="2" (tab index) opens the drawer on that tab */
  document.addEventListener('click', function(e){ var a = e.target.closest('[data-notes]'); if (a){ e.preventDefault(); open(a.dataset.notes); } });
  window.NotesDrawer = { open: open, close: close, show: show };
})();
