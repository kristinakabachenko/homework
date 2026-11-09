/* "← All my homework" link back to the student's results dashboard.
   Works from the dashboard (referrer or ?d=token) and remembers the token for later visits. */
(function(){
  var q = new URLSearchParams(location.search), href = '', ref = document.referrer || '';
  try {
    if (q.get('d')) localStorage.setItem('hw:dash', q.get('d'));
    if (/\/results\/(index\.html)?(\?|$)/.test(ref.split('#')[0])) href = ref.split('#')[0] + '#side';
    else { var d = q.get('d') || localStorage.getItem('hw:dash'); if (d) href = 'results/?s=' + encodeURIComponent(d) + '#side'; }
  } catch(e){}
  if (!href) href = 'results/';
  var a = document.createElement('a');
  a.href = href; a.className = 'homebtn'; a.textContent = '← All my homework';
  a.style.cssText = 'flex:none;text-decoration:none;font-weight:800;font-size:14px;border-radius:11px;padding:6px 12px;background:#fff;border:1.5px solid rgba(0,0,0,.12);color:inherit;white-space:nowrap';
  var bar = document.querySelector('.bar .prog');
  if (bar) bar.insertBefore(a, bar.firstChild); else document.body.insertBefore(a, document.body.firstChild);
  var nav = document.querySelector('.nav');
  if (nav) { var b = a.cloneNode(true); b.className = 'btn ghost homebtn'; b.style.cssText = ''; b.textContent = '🏠 All my homework';
    var row = document.createElement('div'); row.style.cssText = 'text-align:center;margin:-6px 0 18px'; row.appendChild(b);
    nav.parentNode.insertBefore(row, nav.nextSibling); }
})();
