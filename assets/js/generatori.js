/* Generator de variante: înlocuiește {{nume}} din textele unui item cu numere noi.
   Format în JSON:
   "generator": {
     "variabile": { "a": { "min": 2, "max": 9 }, "b": { "din": [4, 6, 8] } },
     "conditie": "a != b",
     "calcule": { "r": "cmmmc(a, b)" }
   }
   Expresiile din „conditie” și „calcule” sunt JavaScript cu funcțiile ajutătoare de mai jos.
   Conținutul e scris de noi, nu de utilizator, deci evaluarea lor e sigură. */
(function (root) {
  'use strict';

  function rngDinSamanta(samanta) {
    // mulberry32: aceeași sămânță → aceleași numere (testul reluat arată la fel)
    let a = samanta >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const cmmdc = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  const cmmmc = (a, b) => Math.abs(a * b) / cmmdc(a, b);
  // fracție simplificată ca text: fr(6, 8) → "3/4", fr(4, 2) → "2"
  const fr = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const g = cmmdc(n, d) || 1;
    n /= g; d /= g;
    return d === 1 ? String(n) : n + '/' + d;
  };
  // aceeași fracție în LaTeX
  const frTex = (n, d) => {
    const s = fr(n, d);
    if (!s.includes('/')) return s;
    const [a, b] = s.split('/');
    return (a.startsWith('-') ? '-' : '') + '\\frac{' + a.replace('-', '') + '}{' + b + '}';
  };
  // număr cu semn în paranteză dacă e negativ: par(-3) → "(-3)"
  const par = (x) => (x < 0 ? '(' + x + ')' : String(x));
  // termen cu semn: sgn(3) → "+ 3", sgn(-3) → "- 3"
  const sgn = (x) => (x < 0 ? '- ' + Math.abs(x) : '+ ' + x);

  const ajutoare = { cmmdc, cmmmc, fr, frTex, par, sgn, abs: Math.abs, Math };

  function evalExpr(expr, valori) {
    const nume = Object.keys(ajutoare).concat(Object.keys(valori));
    const args = Object.values(ajutoare).concat(Object.values(valori));
    // eslint-disable-next-line no-new-func
    return new Function(...nume, '"use strict"; return (' + expr + ');')(...args);
  }

  function alegeValori(gen, rng) {
    for (let incercare = 0; incercare < 500; incercare++) {
      const v = {};
      for (const [nume, def] of Object.entries(gen.variabile || {})) {
        if (Array.isArray(def.din)) v[nume] = def.din[Math.floor(rng() * def.din.length)];
        else {
          const pas = def.pas || 1;
          const nr = Math.floor((def.max - def.min) / pas) + 1;
          v[nume] = def.min + pas * Math.floor(rng() * nr);
        }
      }
      if (gen.conditie && !evalExpr(gen.conditie, v)) continue;
      for (const [nume, expr] of Object.entries(gen.calcule || {})) v[nume] = evalExpr(expr, v);
      return v;
    }
    throw new Error('Generatorul nu a găsit valori care să respecte condiția');
  }

  function inlocuieste(x, v) {
    if (typeof x === 'string') {
      return x.replace(/\{\{(\w+)\}\}/g, (m, n) => (n in v ? String(v[n]) : m));
    }
    if (Array.isArray(x)) return x.map((e) => inlocuieste(e, v));
    if (x && typeof x === 'object') {
      const o = {};
      for (const [k, val] of Object.entries(x)) o[k] = k === 'generator' ? val : inlocuieste(val, v);
      return o;
    }
    return x;
  }

  /* Întoarce o copie a itemului cu numerele generate (sau itemul neschimbat). */
  function aplica(item, samanta) {
    if (!item.generator) return item;
    const v = alegeValori(item.generator, rngDinSamanta(samanta));
    const nou = inlocuieste(item, v);
    nou._valori = v;
    return nou;
  }

  function samantaNoua() {
    return Math.floor(Math.random() * 2 ** 31);
  }

  const api = { aplica, samantaNoua, rngDinSamanta, ajutoare };
  root.Generatori = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
