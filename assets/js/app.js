/* Funcții comune tuturor paginilor: antet, temă, încărcare JSON, formule, itemi, raport. */
(function () {
  'use strict';

  const App = {};
  const LITERE = ['a', 'b', 'c', 'd', 'e', 'f'];

  App.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.$ = (sel, el = document) => el.querySelector(sel);
  App.$$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  App.param = (nume) => new URLSearchParams(location.search).get(nume);

  App.incarcaJSON = async (cale) => {
    const r = await fetch(cale, { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' la ' + cale);
    try {
      return await r.json();
    } catch (e) {
      throw new Error('Fișierul ' + cale + ' are o greșeală de format (JSON invalid).');
    }
  };
  let curriculum = null;
  App.curriculum = () => curriculum || (curriculum = App.incarcaJSON('content/curriculum.json'));

  App.math = (el) => {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  };

  App.eroare = (el, mesaj) => {
    el.innerHTML =
      '<div class="eroare"><h2 style="margin-top:0">Ups! Pagina nu a putut fi încărcată.</h2><p>' +
      App.esc(mesaj) +
      '</p><p><a class="btn secundar" href="index.html">Înapoi acasă</a></p></div>';
  };

  /* ---------- formatare ---------- */
  App.nr = (x, zecimale = 2) => Number(x).toFixed(zecimale).replace('.', ',');
  App.nota = (puncte, maxim) => (maxim > 0 ? 1 + (9 * puncte) / maxim : 1);
  App.data = (iso) =>
    new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  App.ceas = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };
  App.minute = (sec) => Math.max(1, Math.round(sec / 60));
  App.categorie = (proc) => (proc >= 0.7 ? 'verde' : proc >= 0.5 ? 'galben' : 'rosu');
  App.id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- temă ---------- */
  function temaCurenta() {
    const t = document.documentElement.dataset.theme;
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function schimbaTema() {
    const noua = temaCurenta() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = noua;
    try { localStorage.setItem('ecnh.tema', noua); } catch (e) { /* fără memorie */ }
    actualizeazaButonTema();
  }
  function actualizeazaButonTema() {
    const b = App.$('.btn-tema');
    if (!b) return;
    const dark = temaCurenta() === 'dark';
    b.textContent = dark ? '☀' : '☾';
    b.title = dark ? 'Temă luminoasă (caiet)' : 'Temă întunecată (tablă)';
    b.setAttribute('aria-label', b.title);
  }

  App.antet = (activ) => {
    const el = App.$('#antet');
    if (!el) return;
    const link = (href, text, cheie) =>
      '<a href="' + href + '"' + (activ === cheie ? ' aria-current="page"' : '') + '>' + text + '</a>';
    el.innerHTML =
      '<header class="antet">' +
      '<a class="marca" href="index.html"><span class="marca-semn">π</span>' +
      '<span class="marca-text">ECNH Matematică<small>clasa a 7-a</small></span></a>' +
      '<nav class="nav">' + link('index.html', 'Acasă', 'acasa') + link('progres.html', 'Progres', 'progres') +
      '<button class="btn-tema" type="button"></button></nav></header>';
    App.$('.btn-tema').addEventListener('click', schimbaTema);
    actualizeazaButonTema();
  };

  /* ---------- itemi (comuni testelor și lecțiilor) ---------- */
  App.figura = (svg) => (svg ? '<div class="figura">' + svg + '</div>' : '');

  App.controlItem = (item, cheie, valoare) => {
    const v = valoare === undefined || valoare === null ? '' : String(valoare);
    switch (item.tip) {
      case 'grila':
        return (
          '<div class="optiuni" role="radiogroup">' +
          item.variante
            .map(
              (txt, i) =>
                '<label class="optiune" data-i="' + i + '"><input type="radio" name="' + cheie + '" value="' + i + '"' +
                (v === String(i) ? ' checked' : '') + '><span class="litera">' + LITERE[i] + '</span><span>' + txt +
                '</span></label>'
            )
            .join('') +
          '</div>'
        );
      case 'adevarat-fals':
        return (
          '<div class="optiuni" role="radiogroup">' +
          [['true', 'A', 'Adevărat'], ['false', 'F', 'Fals']]
            .map(
              ([val, lit, txt]) =>
                '<label class="optiune" data-i="' + val + '"><input type="radio" name="' + cheie + '" value="' + val + '"' +
                (v === val ? ' checked' : '') + '><span class="litera">' + lit + '</span><span>' + txt + '</span></label>'
            )
            .join('') +
          '</div>'
        );
      case 'numeric':
      case 'completare':
        return (
          '<div><input type="text" name="' + cheie + '" value="' + App.esc(v) + '" autocomplete="off" autocapitalize="off" spellcheck="false"' +
          ' placeholder="' + (item.tip === 'numeric' ? 'ex. 3/4 sau 0,75' : 'răspunsul tău') + '" aria-label="Răspuns">' +
          (item.unitate ? ' <span class="mic">' + item.unitate + '</span>' : '') +
          '<div class="interpretare" aria-live="polite"></div></div>'
        );
      case 'rezolvare':
        return '<div class="nota-caiet">✍️ Rezolvă pe caiet, cu toți pașii. După ce termini testul, vei vedea baremul și îți vei acorda singur punctele.</div>';
      default:
        return '';
    }
  };

  App.citesteRaspuns = (radacina, item, cheie) => {
    if (item.tip === 'grila' || item.tip === 'adevarat-fals') {
      const r = radacina.querySelector('input[name="' + cheie + '"]:checked');
      return r ? r.value : '';
    }
    const inp = radacina.querySelector('input[name="' + cheie + '"]');
    return inp ? inp.value : '';
  };

  App.actualizeazaInterpretare = (inp, item) => {
    const box = inp.parentElement.querySelector('.interpretare');
    if (!box) return true;
    const r = window.Verificare.interpreteaza(item, inp.value);
    box.textContent = r.text;
    box.classList.toggle('avertisment', !r.ok);
    inp.classList.toggle('invalid', !r.ok);
    return r.ok;
  };

  App.raspunsCorectText = (item) => {
    if (item.raspunsAfisat) return item.raspunsAfisat;
    if (item.tip === 'grila') return LITERE[item.corect] + ') ' + item.variante[item.corect];
    if (item.tip === 'adevarat-fals') return item.corect ? 'Adevărat' : 'Fals';
    const r = Array.isArray(item.raspuns) ? item.raspuns[0] : item.raspuns;
    return App.esc(r) + (item.unitate ? ' ' + item.unitate : '');
  };

  App.raspunsElevText = (item, raspuns) => {
    if (raspuns === '' || raspuns === undefined || raspuns === null) return '<em>fără răspuns</em>';
    if (item.tip === 'grila') return LITERE[Number(raspuns)] + ') ' + item.variante[Number(raspuns)];
    if (item.tip === 'adevarat-fals') return raspuns === 'true' ? 'Adevărat' : 'Fals';
    return App.esc(raspuns);
  };

  App.marcheazaOptiuni = (radacina, item, raspuns) => {
    App.$$('.optiune', radacina).forEach((o) => {
      const val = o.dataset.i;
      const corecta = item.tip === 'grila' ? Number(val) === item.corect : val === String(item.corect);
      o.classList.toggle('corect', corecta);
      o.classList.toggle('gresit', !corecta && String(raspuns) === val);
    });
  };

  /* ---------- capitole + raport ---------- */
  App.bareCapitole = (capitole) =>
    '<div class="capitole-bare">' +
    Object.values(capitole)
      .map((c) => {
        const p = c.max ? c.p / c.max : 0;
        const cat = App.categorie(p);
        return (
          '<div class="cap-bara-rand"><span>' + App.esc(c.titlu) + '</span><span class="val text-' + cat + '">' +
          Math.round(p * 100) + '%</span><div class="cap-bara"><span class="' + cat + '-bg" style="width:' +
          Math.max(3, p * 100) + '%"></span></div></div>'
        );
      })
      .join('') +
    '</div>';

  App.capitoleSlabe = (capitole, prag = 0.7) =>
    Object.entries(capitole)
      .map(([id, c]) => ({ id, ...c, proc: c.max ? c.p / c.max : 0 }))
      .filter((c) => c.proc < prag)
      .sort((a, b) => a.proc - b.proc);

  App.raportText = (rez, prenume) => {
    const simbol = { verde: '✅', galben: '⚠️', rosu: '🔴' };
    const linii = [
      '📊 Raport ECNH Matematică' + (prenume ? ' — ' + prenume : ''),
      rez.titlu,
      'Data: ' + App.data(rez.data) + ' · durata ' + App.minute(rez.durataSec) + ' min',
      'Nota: ' + App.nr(rez.nota) + ' (' + App.nr(rez.puncte, 0) + ' din ' + rez.maxim + ' puncte)',
      '',
      'Pe capitole:',
    ];
    for (const c of Object.values(rez.capitole)) {
      const p = c.max ? c.p / c.max : 0;
      linii.push(simbol[App.categorie(p)] + ' ' + c.titlu + ' — ' + Math.round(p * 100) + '%');
    }
    const slabe = App.capitoleSlabe(rez.capitole);
    linii.push('');
    linii.push(slabe.length ? 'De recapitulat: ' + slabe.map((c) => c.titlu).join(', ') : 'Nicio lacună importantă. Bravo! 🎉');
    return linii.join('\n');
  };

  App.panouTrimitere = (el, text, subiect) => {
    const enc = encodeURIComponent;
    el.innerHTML =
      '<div class="rand-butoane">' +
      (navigator.share ? '<button class="btn" type="button" data-a="share">📤 Trimite părintelui</button>' : '') +
      '<a class="btn' + (navigator.share ? ' secundar' : '') + '" target="_blank" rel="noopener" href="https://wa.me/?text=' + enc(text) + '">WhatsApp</a>' +
      '<a class="btn secundar" href="mailto:?subject=' + enc(subiect || 'Raport ECNH Matematică') + '&body=' + enc(text) + '">Email</a>' +
      '<button class="btn secundar" type="button" data-a="copy">Copiază textul</button>' +
      '<span class="mic" data-a="stare" aria-live="polite"></span></div>';
    const stare = el.querySelector('[data-a="stare"]');
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'share') {
        try { await navigator.share({ title: subiect || 'Raport ECNH', text }); } catch (err) { /* anulat */ }
      } else if (a.dataset.a === 'copy') {
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          const t = document.createElement('textarea');
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          t.remove();
        }
        stare.textContent = 'Copiat ✓';
      }
    });
  };

  window.App = App;
})();
