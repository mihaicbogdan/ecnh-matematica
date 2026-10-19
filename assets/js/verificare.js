/* Verificarea răspunsurilor: compară valori matematice, nu text.
   Acceptă: -2, 0,75, .5, 3/4, 0,(3), 1,2(36),
   √2, 2√3, sqrt(8), 2^3, (1/2+1/3), : pentru împărțire, · sau × pentru înmulțire.
   Funcționează în browser (window.Verificare) și în Node (module.exports). */
(function (root) {
  'use strict';

  const EPS = 1e-9;

  function normalizeaza(s) {
    return String(s)
      .trim()
      .replace(/\s+/g, '')
      .replace(/[−–—]/g, '-')
      .replace(/[·×⋅]/g, '*')
      .replace(/÷|:/g, 'd')
      .replace(/,/g, '.')
      .replace(/√/g, 'r')
      .replace(/sqrt/gi, 'r')
      .replace(/°$/, '');
  }

  function periodica(intreg, neperiodic, perioada) {
    // A,B(C) = A + (BC − B) / (10^|B| · (10^|C| − 1))
    const a = intreg ? parseInt(intreg, 10) : 0;
    const bc = parseInt((neperiodic || '') + perioada, 10);
    const b = neperiodic ? parseInt(neperiodic, 10) : 0;
    const numitor = Math.pow(10, (neperiodic || '').length) * (Math.pow(10, perioada.length) - 1);
    return a + (bc - b) / numitor;
  }

  function tokenizeaza(s) {
    const t = [];
    let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m = rest.match(/^(\d*)\.(\d*)\((\d+)\)/);
      if (m) {
        t.push({ tip: 'n', v: periodica(m[1], m[2], m[3]) });
        i += m[0].length;
        continue;
      }
      m = rest.match(/^(\d+\.?\d*|\.\d+)/);
      if (m) {
        t.push({ tip: 'n', v: parseFloat(m[0]) });
        i += m[0].length;
        continue;
      }
      const c = s[i];
      if ('+-*/^()rd'.includes(c)) {
        t.push({ tip: c });
        i++;
        continue;
      }
      return null;
    }
    return t;
  }

  function evalueaza(text) {
    if (text === null || text === undefined) return NaN;
    const s = normalizeaza(text);
    if (!s) return NaN;
    const t = tokenizeaza(s);
    if (!t) return NaN;
    let p = 0;
    const urm = () => t[p];
    const ia = (tip) => (t[p] && t[p].tip === tip ? t[p++] : null);

    function expr() {
      let v = impartire();
      for (;;) {
        if (ia('+')) v += impartire();
        else if (ia('-')) v -= impartire();
        else return v;
      }
    }
    // „:” leagă mai slab decât „/”: 1:5/6 înseamnă 1 împărțit la fracția 5/6
    function impartire() {
      let v = termen();
      while (ia('d')) v /= termen();
      return v;
    }
    function termen() {
      let v = factor();
      for (;;) {
        if (ia('*')) v *= factor();
        else if (ia('/')) v /= factor();
        else if (urm() && (urm().tip === 'r' || urm().tip === '(' || urm().tip === 'n')) v *= putere();
        else return v;
      }
    }
    function factor() {
      if (ia('-')) return -factor();
      if (ia('+')) return factor();
      return putere();
    }
    function putere() {
      const baza = primar();
      if (ia('^')) return Math.pow(baza, factor());
      return baza;
    }
    function primar() {
      const n = ia('n');
      if (n) return n.v;
      if (ia('(')) {
        const v = expr();
        if (!ia(')')) throw new Error('paranteză');
        return v;
      }
      if (ia('r')) {
        const v = putere();
        return v < 0 ? NaN : Math.sqrt(v);
      }
      throw new Error('simbol');
    }

    try {
      const v = expr();
      if (p !== t.length) return NaN;
      return Number.isFinite(v) ? v : NaN;
    } catch (e) {
      return NaN;
    }
  }

  function cmmdc(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function egale(a, b) {
    return Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function textNormal(s) {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function caLista(x) {
    return Array.isArray(x) ? x : [x];
  }

  function formateaza(v) {
    if (!Number.isFinite(v)) return '';
    const r = Math.round(v * 1e6) / 1e6;
    return String(r).replace('.', ',');
  }

  /* Rezultat: { stare: 'gol' | 'invalid' | 'corect' | 'gresit', mesaj } */
  function verifica(item, raspuns) {
    const gol = raspuns === undefined || raspuns === null || String(raspuns).trim() === '';
    if (gol) return { stare: 'gol', mesaj: '' };

    switch (item.tip) {
      case 'grila':
        return { stare: Number(raspuns) === item.corect ? 'corect' : 'gresit' };
      case 'adevarat-fals':
        return { stare: String(raspuns) === String(item.corect) ? 'corect' : 'gresit' };
      case 'numeric': {
        const v = evalueaza(raspuns);
        if (Number.isNaN(v)) {
          return { stare: 'invalid', mesaj: 'Nu înțeleg numărul. Exemple: 12, -3, 0,75, 3/4, 2√3' };
        }
        const ok = caLista(item.raspuns).some((r) => egale(evalueaza(r), v));
        if (ok && item.ireductibila) {
          const m = normalizeaza(raspuns).match(/^-?(\d+)\/(\d+)$/);
          if (m && cmmdc(+m[1], +m[2]) > 1) {
            return { stare: 'gresit', mesaj: 'Valoarea e corectă, dar fracția se mai poate simplifica.' };
          }
        }
        return { stare: ok ? 'corect' : 'gresit' };
      }
      case 'completare': {
        const u = textNormal(raspuns);
        const ok = caLista(item.raspuns).some((r) => {
          if (textNormal(r) === u) return true;
          const a = evalueaza(r);
          const b = evalueaza(raspuns);
          return !Number.isNaN(a) && !Number.isNaN(b) && egale(a, b);
        });
        return { stare: ok ? 'corect' : 'gresit' };
      }
      default:
        return { stare: 'gol', mesaj: '' };
    }
  }

  /* Interpretare afișată sub câmp, ca elevul să vadă ce a înțeles calculatorul. */
  function interpreteaza(item, raspuns) {
    if (item.tip !== 'numeric' || !String(raspuns ?? '').trim()) return { ok: true, text: '' };
    const v = evalueaza(raspuns);
    if (Number.isNaN(v)) return { ok: false, text: 'Nu înțeleg formatul. Exemple: 12, -3, 0,75, 3/4, 2√3' };
    return { ok: true, text: '≈ ' + formateaza(v) };
  }

  const api = { evalueaza, egale, verifica, interpreteaza, textNormal, formateaza };
  root.Verificare = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
