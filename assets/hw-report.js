/* Homework reporter — saves a "snapshot" of every exercise the moment the student
   checks it for the first time (red/green marks included), and sends the whole
   homework to the Results dashboard (Google Apps Script + Google Sheet).
   Homework pages only need:  <script src="assets/hw-report.js"></script>
   and  HWR.snap('ex1')  right after the first score is saved. */
(function(){
  /* ====== SETTINGS: paste the web-app URL of the "Homework Results" script here ====== */
  var RESULTS_URL = '';
  var KEY = 'moody-hw-2026';
  /* ================================================================================== */

  var snaps = {};          // id -> {html, title, s, max, at}
  var origFetch = window.fetch ? window.fetch.bind(window) : null;

  function titleOf(el){
    var h = el.querySelector('h2,h3,.ex-title,.title,.tag');
    return h ? h.textContent.replace(/\s+/g,' ').trim().slice(0,120) : el.id;
  }

  function capture(el){
    var c = el.cloneNode(true);
    var o = el.querySelectorAll('input,select,textarea'), k = c.querySelectorAll('input,select,textarea');
    for (var i=0;i<o.length;i++){
      var a=o[i], b=k[i]; if(!b) continue;
      if (a.tagName==='SELECT'){
        var ops=b.querySelectorAll('option');
        for (var j=0;j<ops.length;j++){ if(j===a.selectedIndex) ops[j].setAttribute('selected',''); else ops[j].removeAttribute('selected'); }
      } else if (a.type==='checkbox' || a.type==='radio'){
        if (a.checked) b.setAttribute('checked',''); else b.removeAttribute('checked');
      } else if (a.tagName==='TEXTAREA'){
        b.textContent = a.value;
      } else {
        b.setAttribute('value', a.value);
      }
      b.setAttribute('disabled','');
    }
    var drop = c.querySelectorAll('script,iframe,video,source,canvas');
    for (var d=0; d<drop.length; d++) drop[d].remove();
    var aud = c.querySelectorAll('audio');
    for (var x=0; x<aud.length; x++){ var sp=document.createElement('div'); sp.textContent='🎧 audio'; sp.style.cssText='font-size:13px;color:#888'; aud[x].replaceWith(sp); }
    var all = c.querySelectorAll('*');
    for (var n=0;n<all.length;n++){
      var at = all[n].attributes;
      for (var m=at.length-1;m>=0;m--){ if(/^on/i.test(at[m].name)) all[n].removeAttribute(at[m].name); }
    }
    c.removeAttribute('hidden');
    c.classList.remove('hidden','locked');
    return c.outerHTML.replace(/\s{2,}/g,' ');
  }

  function scoreOf(id){
    try { if (typeof scores!=='undefined' && scores[id]) return scores[id]; } catch(e){}
    return null;
  }

  function take(id){
    var el = document.getElementById(id); if(!el) return;
    var sc = scoreOf(id);
    snaps[id] = { id:id, title:titleOf(el), html:capture(el), s: sc?sc.s:null, max: sc?sc.max:null, at:new Date().toISOString() };
  }

  /* Exercises that were never "checked" (open tasks, writing) are captured at send time. */
  function finalSnaps(){
    var secs = document.querySelectorAll('section[id], .card[id]');
    for (var i=0;i<secs.length;i++){
      var id = secs[i].id;
      if (/^(nameCard|gate|results|intro)$/i.test(id)) continue;
      if (secs[i].classList.contains('final')) continue;
      if (!snaps[id]) take(id);
      else { var sc=scoreOf(id); if(sc){ snaps[id].s=sc.s; snaps[id].max=sc.max; } }
    }
    var order = Array.prototype.map.call(secs, function(s){ return s.id; });
    return Object.keys(snaps).sort(function(a,b){ return order.indexOf(a)-order.indexOf(b); })
      .map(function(k){ return snaps[k]; });
  }

  function buildPayload(old){
    var hw = old.homework || old.HOMEWORK || document.title;
    var score = old.score!=null ? old.score : 0;
    var max = old.max!=null ? old.max : (old.total!=null ? old.total : 0);
    var breakdown = old.breakdown || '';
    var open = old.open || '';
    if (old.details && !breakdown) breakdown = String(old.details);
    if (old.answers && !open) open = String(old.answers);
    return {
      v:2, key:KEY, homework:hw, student:old.student||'', score:score, max:max,
      breakdown:breakdown, open:open, page:location.href.split('?')[0].split('#')[0],
      snaps: finalSnaps()
    };
  }

  window.HWR = {
    snap: function(id){ setTimeout(function(){ take(id); }, 0); },
    snaps: snaps,
    enabled: function(){ return !!RESULTS_URL; }
  };

  if (!origFetch) return;
  window.fetch = function(url, opts){
    try {
      var u = String(url||'');
      if (RESULTS_URL && /script\.google(usercontent)?\.com\/macros/.test(u) && u!==RESULTS_URL && opts && opts.body){
        var old = JSON.parse(opts.body);
        var body = JSON.stringify(buildPayload(old));
        return origFetch(RESULTS_URL, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:body});
      }
    } catch(e){ /* fall through to the original request */ }
    return origFetch(url, opts);
  };
})();
