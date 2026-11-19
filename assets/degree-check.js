/* Degree checker: checks one comparison sentence (small / medium / big difference)
   and explains the mistakes in simple English (+ a Ukrainian word where it helps).
   DegreeCheck.check(sentence, {slot:'small'|'medium'|'big'|'any', a:'option A', b:'option B', mode:'statement'|'question', adj:'default adjective'})
   → { ok, errors:[html], tips:[html], fixed:'corrected sentence' | '', model:'example sentence' | '', degree } */
(function(){
const SHORT = ('cheap fast slow big small easy hard safe nice quick long short high low old new young rich poor warm cold hot cool clean dark strong weak busy happy healthy tasty lazy noisy funny early late large wide loud calm sad great tidy dirty lucky risky scary cosy crazy heavy pretty ugly wealthy sunny tough smart deep near fit thin fat wet free close brave cheerful').split(' ').filter(w => w !== 'cheerful');
const IRREG = {good:'better', bad:'worse', far:'further', well:'better', little:'less'};
function er(a){
  if (IRREG[a]) return IRREG[a];
  if (/e$/.test(a)) return a + 'r';
  if (/[^aeiou]y$/.test(a)) return a.slice(0,-1) + 'ier';
  if (/^(big|hot|sad|wet|fit|thin|fat)$/.test(a)) return a + a.slice(-1) + 'er';
  return a + 'er';
}
const BASE = {};               // cheaper -> cheap
SHORT.forEach(a => BASE[er(a)] = a);
Object.keys(IRREG).forEach(a => BASE[IRREG[a]] = BASE[IRREG[a]] || a);
Object.assign(BASE, {quieter:'quiet', simpler:'simple', friendlier:'friendly', cleverer:'clever', narrower:'narrow', lonelier:'lonely', livelier:'lively', gentler:'gentle'});
BASE.worse = 'bad'; BASE.better = 'good'; BASE.farther = 'far'; BASE.further = 'far';
const isShort = a => SHORT.includes(a) || !!IRREG[a];
const isComp = w => Object.prototype.hasOwnProperty.call(BASE, w);
const comp = a => isShort(a) ? er(a) : 'more ' + a;
const NOT_ADJ = /^(and|or|but|than|as|the|a|an|for|to|of|in|on|at|with|it|is|you|me|people|time|money|fun)$/;

const MODS = {
  small: ['almost','nearly','not quite','just about'],
  medium: ['a little bit','a bit','a little','somewhat'],
  both: ['slightly'],
  big: ['much','far','a lot','way','considerably','significantly','lots','not nearly','so much']
};
const MOD_RE = '(?:a little bit|a bit|a little|slightly|somewhat|much|far|a lot|way|considerably|significantly|lots|almost|nearly|not quite|not nearly|just about|so much)';
function degreeOf(mod){
  if (!mod) return '';
  mod = mod.toLowerCase();
  if (MODS.small.includes(mod)) return 'small';
  if (MODS.medium.includes(mod)) return 'medium';
  if (MODS.both.includes(mod)) return 'slightly';
  if (MODS.big.includes(mod)) return 'big';
  return '';
}
const SLOT_WORDS = {
  small: '<b>almost as … as</b> · <b>nearly as … as</b> · <b>slightly more … than</b>',
  medium: '<b>a bit more … than</b> · <b>a little more … than</b> · <b>slightly more … than</b>',
  big: '<b>much more … than</b> · <b>far more … than</b> · <b>a lot more … than</b>'
};
const SLOT_NAME = {small:'a SMALL difference', medium:'a MEDIUM difference', big:'a BIG difference'};
const DEF_MOD = {small:'almost', medium:'a bit', big:'much'};
const VERB_RE = /\b(is|isn't|are|aren't|was|wasn't|were|'s|can|can't|could|will|won't|would|might|may|must|should|feels?|seems?|looks?|sounds?|gets?|makes?|becomes?|tastes?|costs?|takes?|be|am|is not|are not|do|does|did|has|have|had|seem|feel|become|helps?|gives?|brings?)\b/i;

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const tidy = s => s.replace(/\s+/g,' ').replace(/\s+([.?!,])/g,'$1').trim();

function check(raw, o){
  o = o || {};
  const slot = o.slot || 'any', q = o.mode === 'question';
  const errors = [], tips = [];
  let f = tidy(String(raw||'').replace(/[’‘`´]/g,"'"));
  if (f.split(/\s+/).filter(Boolean).length < 4) return {ok:false, errors:['Write a full sentence (at least 4 words).'], tips, fixed:'', model: model(o, o.adj), degree:''};
  let unfixable = false;
  const low = () => f.toLowerCase();
  const err = m => { if (!errors.includes(m)) errors.push(m); };

  /* 1. then → than */
  if (/\bthen\b/i.test(f) && !/\bthan\b/i.test(f)){
    err('<b>then</b> = потім. For comparing we write <b>than</b>: cheaper <b>than</b>.');
    f = f.replace(/\bthen\b/i, 'than');
  }
  /* 2. the most / the cheapest (superlative) */
  let m = low().match(/\bthe (most|least) (\w+)/);
  if (m){ err('<b>the most</b> is for 3 or more things. You compare <b>two</b> options, so use <b>more … than</b>.'); f = f.replace(/\bthe (most|least) /i, (_, w) => (w.toLowerCase() === 'most' ? 'more ' : 'less ')); }
  m = low().match(/\bthe (\w+est)\b/);
  if (m && /^(cheap|fast|easi|health|happi|bigg|small|quick|safe|hard|nic|long|short|old|young|great|strong|bus|tast|noisi|funni|earli|lat|larg|clean|warm|cold|hott|cool|calm|lazi|risk)/.test(m[1])){
    const base = m[1].replace(/iest$/,'y').replace(/(.)\1est$/,'$1').replace(/est$/,'');
    const b2 = SHORT.includes(base) ? base : (SHORT.includes(base + 'e') ? base + 'e' : base);
    err('<b>the ' + esc(m[1]) + '</b> is for 3 or more things. For two options: <b>' + esc(er(b2)) + ' than</b>.');
    f = f.replace(new RegExp('\\bthe ' + m[1] + '\\b','i'), er(b2));
  }
  /* 3. very / so / too / really + more / -er */
  m = low().match(/\b(very|so|too|really)\s+(more|less|\w+)\b/);
  if (m && (m[2] === 'more' || m[2] === 'less' || isComp(m[2])) && !/\bso much\b/.test(m[0])){
    err('We don\'t say <b>' + esc(m[1]) + ' ' + esc(m[2]) + '</b>. Before <b>more</b> or <b>-er</b> we use <b>much / far / a lot</b> (набагато), not <s>' + esc(m[1]) + '</s>.');
    f = f.replace(new RegExp('\\b' + m[1] + '\\s+(?=' + m[2] + '\\b)','i'), 'much ');
  }
  /* 4. a lot of more / lot more */
  if (/\ba lot of (more|less|\w+er)\b/i.test(f)){
    const w = low().match(/\ba lot of (\w+)/)[1];
    if (w === 'more' || w === 'less' || isComp(w)){ err('Before <b>more</b> we say <b>a lot more</b>, without <s>of</s>.'); f = f.replace(/\ba lot of (?=\w)/i, 'a lot '); }
  }
  if (/(^|[^a]\s)lot (more|less)\b/i.test(' ' + f) && !/\ba lot (more|less)\b/i.test(f)){ err('Say <b>a lot more</b> (with <b>a</b>).'); f = f.replace(/\blot (more|less)\b/i, 'a lot $1'); }
  /* 5. much / a bit … + as … as */
  m = low().match(/\b(much|far|a lot|a bit|a little|a little bit|way|slightly)\s+as\s+(\w+)\s+as\b/);
  if (m){
    err('<b>' + esc(m[1]) + '</b> doesn\'t go with <b>as … as</b>. With <b>as … as</b> we use <b>almost / nearly</b>. <b>' + esc(m[1]) + '</b> goes with <b>more … than</b>.');
    const rep = (slot === 'small' || slot === 'any' && /almost|nearly/.test(m[1])) ? 'almost as ' + m[2] + ' as' : m[1] + ' ' + comp(m[2]) + ' than';
    f = f.replace(new RegExp('\\b' + m[1] + '\\s+as\\s+' + m[2] + '\\s+as\\b','i'), rep);
  }
  /* 6. almost / nearly + more … than */
  m = low().match(/\b(almost|nearly)\s+(?:(?:more|less)\s+(\w+)|(\w+))\s+than\b/);
  if (m && (m[2] || isComp(m[3]))){
    const adj = m[2] || BASE[m[3]];
    err('<b>' + esc(m[1]) + '</b> goes with <b>as … as</b>: <b>' + esc(m[1]) + ' as ' + esc(adj) + ' as</b> (not <s>' + esc(m[1]) + ' more … than</s>).');
    f = f.replace(new RegExp('\\b' + m[1] + '\\s+(?:(?:more|less)\\s+' + (m[2]||'') + '|' + (m[3]||'@@') + ')\\s+than\\b','i'), m[1] + ' as ' + adj + ' as');
  }
  /* 7. as cheaper as / as more cheap as */
  m = low().match(/\bas (?:more |less )?(\w+) as\b/);
  if (m && (isComp(m[1]) || /\bas (more|less) /.test(m[0]))){
    const adj = isComp(m[1]) ? BASE[m[1]] : m[1];
    err('Between <b>as … as</b> we use the normal adjective: <b>as ' + esc(adj) + ' as</b> (not <s>' + esc(m[0].replace(/^as | as$/g,'')) + '</s>).');
    f = f.replace(new RegExp('\\bas (?:more |less )?' + m[1] + ' as\\b','i'), 'as ' + adj + ' as');
  }
  /* 7b. so … as → as … as */
  m = low().match(/\b(almost|nearly)?\s*so (\w+) as\b/);
  if (m && !/\b(not|isn't|aren't) so\b/.test(low())){
    err('We say <b>' + (m[1] ? esc(m[1]) + ' ' : '') + 'as ' + esc(m[2]) + ' as</b>, not <s>so ' + esc(m[2]) + ' as</s>.');
    f = f.replace(new RegExp('\\bso ' + m[2] + ' as\\b','i'), 'as ' + m[2] + ' as');
  }
  /* 8. as … than */
  m = low().match(/\bas (\w+(?: \w+)?) than\b/);
  if (m && !/\b(more|less)\b/.test(m[1]) && !isComp(m[1])){
    err('After <b>as ' + esc(m[1]) + '</b> we need the second <b>as</b>: <b>as ' + esc(m[1]) + ' as</b> (not <s>than</s>).');
    f = f.replace(new RegExp('\\bas ' + m[1] + ' than\\b','i'), 'as ' + m[1] + ' as');
  }
  /* 9. more cheaper / less cheaper */
  m = low().match(/\b(more|less) (\w+)\b/);
  if (m && isComp(m[2])){
    const base = BASE[m[2]];
    if (m[1] === 'more'){ err('<b>' + esc(m[2]) + '</b> already means “more ' + esc(base) + '”. Don\'t add <s>more</s>: just <b>' + esc(m[2]) + '</b>.'); f = f.replace(new RegExp('\\bmore ' + m[2] + '\\b','i'), m[2]); }
    else { err('<b>less</b> + the normal adjective: <b>less ' + esc(base) + '</b> (not <s>less ' + esc(m[2]) + '</s>).'); f = f.replace(new RegExp('\\bless ' + m[2] + '\\b','i'), 'less ' + base); }
  }
  /* 10. more + short adjective */
  m = low().match(/\bmore (\w+)\b/);
  if (m && isShort(m[1])){
    err('<b>' + esc(m[1]) + '</b> is a short adjective: we say <b>' + esc(er(m[1])) + '</b>, not <s>more ' + esc(m[1]) + '</s>.');
    f = f.replace(new RegExp('\\bmore ' + m[1] + '\\b','i'), er(m[1]));
  }
  /* 11. much more + plural noun */
  m = low().match(/\bmuch (more|fewer) (\w+s)\b/);
  if (m && !/(ss|ous|us|is)$/.test(m[2])){
    err('<b>' + esc(m[2]) + '</b> is plural (you can count them). Say <b>many more</b> or <b>a lot more ' + esc(m[2]) + '</b>, not <s>much more</s>.');
    f = f.replace(/\bmuch (?=(more|fewer) )/i, 'a lot ');
  }
  /* 12. -ing subject + are */
  const opts = [o.a, o.b].filter(Boolean).map(x => x.toLowerCase());
  m = low().match(/^(.+?)\s(are|aren't)\b/);
  if (m && !/\band\b/.test(m[1]) && (/^\w+ing\b/.test(m[1]) || opts.includes(m[1])) && !/^(are|aren't)$/.test(m[1])){
    err('<b>' + esc(cap(m[1])) + '</b> is one activity, so we say <b>' + (m[2] === 'are' ? 'is' : 'isn\'t') + '</b>, not <s>' + m[2] + '</s>.');
    f = f.replace(new RegExp('^(.+?)\\s' + m[2] + '\\b','i'), '$1 ' + (m[2] === 'are' ? 'is' : 'isn\'t'));
  }

  /* ---------- the structure ---------- */
  const MODLIST = ['a little bit','not quite','not nearly','just about','so much','a bit','a little','a lot','slightly','somewhat','much','far','way','considerably','significantly','lots','almost','nearly'];
  function modBefore(toks, i){           // modifier that ends right before toks[i]
    for (const md of MODLIST){ const p = md.split(' '); if (i - p.length >= 0 && toks.slice(i - p.length, i).join(' ') === md) return md; }
    return '';
  }
  const A = () => { const r = low().match(/\b(?:(a little bit|not quite|not nearly|just about|a bit|a little|slightly|almost|nearly|much|far|a lot|isn't|aren't|not)\s+)?as\s+([\w-]+)\s+as\b/); return r ? {mod: r[1] || '', adj: r[2], text: r[0]} : null; };
  const CP = () => {
    const toks = low().replace(/\b(compared (to|with)|in comparison (to|with))\b/g,'than').replace(/[^\w'\s-]/g,' ').split(/\s+/).filter(Boolean), ti = toks.indexOf('than');
    if (ti < 1) return null;
    for (let i = ti - 1; i >= Math.max(0, ti - 6); i--){
      const w = toks[i];
      if (w === 'more' || w === 'less' || isComp(w)){
        const phrase = toks.slice(i + 1, ti);
        return {mod: modBefore(toks, i), kind: (w === 'more' || w === 'less') ? w : 'er', word: w,
          adj: w === 'more' || w === 'less' ? (phrase.length === 1 ? phrase[0] : '') : BASE[w]};
      }
    }
    return null;
  };
  let as = A(), cp = CP();
  let adj = as ? as.adj : cp ? cp.adj : '';
  if (!adj){
    const g = low().match(/\b(?:more|less) (\w+)(?:\s+than|\s*[.!?]?$)/) || low().match(/\bas (\w+) as/);
    if (g && !NOT_ADJ.test(g[1])) adj = g[1];
    else { const w = low().split(/[^\w']+/).find(isComp); if (w) adj = BASE[w]; }
  }
  if (adj && (NOT_ADJ.test(adj) || /[^s]s$/.test(adj) && !/ous$/.test(adj))) adj = '';
  const which = q && /^which\b/i.test(f) && (/\b(more|less)\s+\w+/.test(low()) || low().split(/[^\w']+/).some(isComp));

  /* missing than */
  if (!as && !cp && !which){
    const hasComp = /\b(more|less)\s+\w+/.test(low()) || low().split(/[^\w']+/).some(isComp);
    if (hasComp){
      const lf = low(), ia = o.a ? lf.indexOf(o.a.toLowerCase()) : -1, ib = o.b ? lf.indexOf(o.b.toLowerCase()) : -1;
      const other = (ib >= 0 && (ia < 0 || ib < ia)) ? o.a : o.b;
      err('You compare two things, so you need <b>than</b> + the other option' + (other ? ': … <b>than ' + esc(other) + '</b>.' : '.'));
      if (other && /(\b(more|less)\s+[\w-]+|\b\w+er)\s*[.!?]?$/i.test(f)) f = f.replace(/\s*([.!?]?)$/, ' than ' + other + '$1');
      else unfixable = true;
      as = A(); cp = CP();
    } else {
      err('I can\'t find the comparison. Use ' + (SLOT_WORDS[slot] || '<b>almost as … as</b> · <b>a bit more … than</b> · <b>much more … than</b>') + '.');
      unfixable = true;
    }
  }

  /* verb */
  if ((as || cp) && !q){
    const key = as ? as.text : (cp.mod ? cp.mod + ' ' : '') + cp.word;
    const at = low().search(new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b'));
    const before = at > 0 ? f.slice(0, at) : '';
    if (at > 0 && !VERB_RE.test(before) && !/^(isn't|aren't)\b/.test(key)){
      err('You need a verb: <b>' + esc(cap(before.trim())) + ' is</b> ' + esc(key) + ' …');
      f = f.slice(0, at).trimEnd() + ' is ' + f.slice(at);
      as = A(); cp = CP();
    }
  }

  /* degree */
  let degree = '';
  if (as){
    const mod = as.mod;
    degree = /^(not|isn't|aren't)$/.test(mod) ? 'notas' : (degreeOf(mod) || (mod ? '' : 'same'));
    if (degree === 'same' && slot !== 'any'){
      err('<b>as ' + esc(as.adj) + ' as</b> alone means “the same”. ' + (slot === 'small' ? 'For a small difference add <b>almost</b> or <b>nearly</b>: <b>almost as ' + esc(as.adj) + ' as</b>.' : 'Here we need ' + SLOT_NAME[slot] + ': ' + SLOT_WORDS[slot] + '.'));
      if (slot === 'small') f = f.replace(new RegExp('\\bas ' + as.adj + ' as\\b','i'), 'almost as ' + as.adj + ' as'); else unfixable = true;
    } else if (slot === 'small' && degree === 'notas'){
      err('<b>not as … as</b> shows a clear difference. For a small difference say <b>almost as … as</b> or <b>not quite as … as</b>.');
      f = f.replace(/\b(not|isn't|aren't) as ([\w-]+) as\b/i, (_, n) => (n.toLowerCase() === 'not' ? 'not' : n) + ' quite as ' + as.adj + ' as');
    } else if ((slot === 'medium' || slot === 'big') && (degree === 'small' || degree === 'slightly')){
      err('<b>' + esc(mod) + ' as … as</b> = a small difference. This line is for ' + SLOT_NAME[slot] + ': ' + SLOT_WORDS[slot] + '.');
      unfixable = true;
    } else if (slot === 'medium' && degree === 'big'){
      err('<b>' + esc(mod) + ' as … as</b> = a big difference. This line is for ' + SLOT_NAME.medium + ': ' + SLOT_WORDS.medium + '.'); unfixable = true;
    }
  } else if (cp){
    const mod = cp.mod;
    degree = degreeOf(mod) || (mod ? '' : 'none');
    const ok = slot === 'any' || (slot === 'small' && (degree === 'small' || degree === 'slightly')) || (slot === 'medium' && (degree === 'medium' || degree === 'slightly')) || (slot === 'big' && degree === 'big');
    if (degree === 'none' && slot !== 'any'){
      err('Show how big the difference is. For ' + SLOT_NAME[slot] + ': ' + SLOT_WORDS[slot] + '.');
      f = f.replace(new RegExp('\\b(?=' + cp.word + '\\b)','i'), (slot === 'small' ? 'slightly' : DEF_MOD[slot]) + ' ');
    } else if (!ok){
      const said = degree === 'small' ? 'a small' : degree === 'medium' ? 'a medium' : degree === 'big' ? 'a big' : 'a small or medium';
      err('<b>' + esc(mod) + '</b> = ' + said + ' difference. This line is for ' + SLOT_NAME[slot] + ': ' + SLOT_WORDS[slot] + '.');
      f = f.replace(new RegExp('\\b' + mod + '\\b(?=\\s+' + cp.word + '\\b)','i'), slot === 'small' ? 'slightly' : DEF_MOD[slot]);
    }
  }

  /* questions */
  if (q){
    const qw = /^(is|isn't|are|aren't|was|do|does|would|which|why|how|what|in your opinion|don't|can)\b/i;
    if (!qw.test(f)){
      const mm = f.match(/^(.+?)\s(is|isn't)\s(.+)$/i);
      err('In a question, <b>is</b> goes first: <b>Is</b> + the activity + … ?');
      if (mm) f = cap(mm[2].toLowerCase()) + ' ' + mm[1].charAt(0).toLowerCase() + mm[1].slice(1) + ' ' + mm[3]; else unfixable = true;
    }
    const dbl = f.match(/^(is|are)\b(.+?)\s(is|are)\s(?=.*\b(than|as)\b)/i);
    if (dbl){ err('Use <b>is</b> only once: <b>Is</b> working from home much … ? (no second <s>is</s>).'); f = f.replace(/^((?:is|are)\b.+?)\s(?:is|are)\s/i, '$1 '); }
    if (!/\?\s*$/.test(f)){ err('A question ends with <b>?</b>'); f = f.replace(/[.!]?\s*$/, '?'); }
  }

  /* small things */
  if (/^[a-z]/.test(f)){ tips.push('Start with a capital letter.'); f = cap(f); }
  if (!q && !/[.!?]\s*$/.test(f)){ tips.push('Put a full stop at the end.'); f = f + '.'; }

  const fixed = tidy(f);
  const changed = fixed.replace(/[.?!]$/,'').toLowerCase() !== tidy(String(raw)).replace(/[’‘`´]/g,"'").replace(/[.?!]$/,'').toLowerCase();
  return {
    ok: !errors.length,
    errors, tips,
    fixed: errors.length && !unfixable && changed ? fixed : '',
    model: errors.length && unfixable ? model(o, adj) : '',
    degree
  };
}
function model(o, adj){
  adj = adj || o.adj || 'interesting';
  const A = cap(o.a || 'This'), B = o.b || 'that', slot = o.slot;
  if (o.mode === 'question') return 'Is ' + (o.a || 'this').toLowerCase() + ' much ' + comp(adj) + ' than ' + B + '?';
  if (slot === 'small') return A + ' is almost as ' + adj + ' as ' + B + '.';
  if (slot === 'medium') return A + ' is a bit ' + comp(adj) + ' than ' + B + '.';
  return A + ' is much ' + comp(adj) + ' than ' + B + '.';
}
window.DegreeCheck = {check, comp};
if (typeof module !== 'undefined') module.exports = window.DegreeCheck;
})();
