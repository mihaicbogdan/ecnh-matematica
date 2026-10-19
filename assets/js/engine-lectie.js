/* Motorul de lecție: lectie.html?id=<id din curriculum.lectii>
   Structură: De reținut → Exemple rezolvate → Exerciții gradate → Testul lecției. */
(function () {
  'use strict';

  const { $, $$, esc } = App;
  const radacina = $('#continut');
  const NIVELURI = { 1: 'Ușor', 2: 'Mediu', 3: 'Greu' };
  let L, lectieId;
  const inst = {}; // cheie input → item generat
  const incercari = {};

  async function porneste() {
    App.antet('');
    lectieId = App.param('id');
    try {
      const curr = await App.curriculum();
      const intrare = curr.lectii[lectieId];
      if (!intrare || !intrare.fisier) throw new Error('Lecția „' + (lectieId || '') + '” nu există încă.');
      L = await App.incarcaJSON(intrare.fisier);
    } catch (e) {
      App.eroare(radacina, e.message);
      return;
    }
    document.title = L.titlu + ' · ECNH';
    randeaza();
  }

  function htmlRetine() {
    return '<section class="retine"><h2>De reținut</h2><ul>' + L.deRetinut.map((r) => '<li>' + r + '</li>').join('') + '</ul></section>';
  }

  function htmlExemplu(ex, k) {
    return (
      '<article class="foaie apare" style="margin-top:14px" data-exemplu="' + k + '">' +
      '<span class="eticheta">Exemplul ' + (k + 1) + '</span>' + (ex.titlu ? ' <b>' + ex.titlu + '</b>' : '') +
      '<div style="margin-top:8px">' + ex.enunt + '</div>' + App.figura(ex.figura) +
      '<ol class="pasi">' + ex.pasi.map((p, i) => '<li' + (i > 0 ? ' class="ascuns"' : '') + '>' + p + '</li>').join('') + '</ol>' +
      (ex.pasi.length > 1
        ? '<div class="rand-butoane"><button class="btn mic" type="button" data-a="pas">Pasul următor</button>' +
          '<button class="btn secundar mic" type="button" data-a="toti">Arată tot</button></div>'
        : '') +
      '</article>'
    );
  }

  function instanta(item, cheie, samanta) {
    const it = Generatori.aplica(item, samanta ?? Generatori.samantaNoua());
    inst[cheie] = it;
    return it;
  }

  function htmlExercitiu(item0) {
    const cheie = 'e_' + item0.id;
    const item = instanta(item0, cheie);
    const facut = (Progres.stareLectie(lectieId)?.exercitiiCorecte || []).includes(item.id);
    return (
      '<article class="item" data-cheie="' + esc(cheie) + '">' +
      '<div class="item-cap"><span class="item-nr">' + esc(item.id) + '</span><div class="item-enunt">' + item.enunt + '</div>' +
      (facut ? '<span class="eticheta verde">rezolvat ✓</span>' : '') + '</div>' +
      '<div class="item-corp">' + App.figura(item.figura) +
      '<div class="verifica-rand"><div>' + App.controlItem(item, cheie, '') + '</div></div>' +
      '<div class="rand-butoane"><button class="btn mic" type="button" data-a="verifica">Verifică</button>' +
      (item.indiciu ? '<button class="btn secundar mic" type="button" data-a="indiciu">💡 Indiciu</button>' : '') +
      (item.generator ? '<button class="btn secundar mic" type="button" data-a="varianta">🔄 Altă variantă</button>' : '') +
      '</div><div data-zona="feedback"></div></div></article>'
    );
  }

  function htmlTest() {
    const t = L.test;
    return (
      '<section class="foaie cu-margine" style="margin-top:14px" id="testLectie">' +
      '<span class="eticheta rosu">Testul lecției</span>' +
      '<p style="margin-top:8px">Răspunde la toate întrebările, apoi apasă „Verifică testul”. Primești nota pe loc.</p>' +
      t.itemi
        .map((item0, k) => {
          const cheie = 't_' + item0.id;
          const item = instanta(item0, cheie);
          return (
            '<article class="item" data-cheie="' + esc(cheie) + '"><div class="item-cap"><span class="item-nr">' + (k + 1) + '.</span>' +
            '<div class="item-enunt">' + item.enunt + '</div><span class="item-puncte">' + (item.puncte || 1) + 'p</span></div>' +
            '<div class="item-corp">' + App.figura(item.figura) + App.controlItem(item, cheie, '') + '<div data-zona="feedback"></div></div></article>'
          );
        })
        .join('') +
      '<div id="rezTest"></div>' +
      '<div class="rand-butoane"><button class="btn" type="button" data-a="verificaTest">Verifică testul</button></div>' +
      '</section>'
    );
  }

  function randeaza() {
    const stare = Progres.stareLectie(lectieId);
    const niveluri = [1, 2, 3].filter((n) => L.exercitii.some((e) => e.nivel === n));
    radacina.innerHTML =
      '<div style="margin-top:18px"><span class="eticheta">' + esc(L.eticheta || 'Lecție') + '</span>' +
      (stare && stare.nota ? ' <span class="eticheta verde">ultima notă la test: ' + App.nr(stare.nota) + '</span>' : '') +
      '<h1>' + esc(L.titlu) + '</h1>' + (L.introducere ? '<p>' + L.introducere + '</p>' : '') + '</div>' +
      (L.revizuit ? '' : '<p class="mic">⚠ Conținut nerevizuit încă de părinte/profesor.</p>') +
      htmlRetine() +
      (L.exemple && L.exemple.length ? '<h2>Exemple rezolvate</h2>' + L.exemple.map(htmlExemplu).join('') : '') +
      '<h2>Exerciții</h2><div class="foaie cu-margine">' +
      niveluri
        .map(
          (n) =>
            '<div class="nivel-cap"><span class="puncte-nivel">' + [1, 2, 3].map((i) => '<i class="' + (i <= n ? 'plin' : '') + '"></i>').join('') +
            '</span><h3>' + NIVELURI[n] + '</h3></div>' +
            L.exercitii.filter((e) => e.nivel === n).map(htmlExercitiu).join('')
        )
        .join('') +
      '</div>' +
      (L.test ? '<h2>Testul lecției</h2>' + htmlTest() : '') +
      '<div class="rand-butoane"><a class="btn secundar" href="index.html">Înapoi acasă</a></div>' +
      '<button class="btn retine-flotant" type="button" data-a="sertar" aria-expanded="false">📌 De reținut</button>' +
      '<aside class="sertar" id="sertar" aria-label="De reținut">' +
      '<div class="rand-butoane" style="justify-content:flex-end"><button class="btn secundar mic" type="button" data-a="sertar">Închide ✕</button></div>' +
      htmlRetine() + '</aside>';

    App.math(radacina);
    radacina.addEventListener('click', laClick);
    radacina.addEventListener('input', (e) => {
      if (e.target.type === 'text' && inst[e.target.name]) App.actualizeazaInterpretare(e.target, inst[e.target.name]);
    });
  }

  function arataFeedback(art, clasa, html) {
    const z = art.querySelector('[data-zona="feedback"]');
    z.innerHTML = '<div class="feedback ' + clasa + '">' + html + '</div>';
    App.math(z);
  }

  function laClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;

    if (a === 'sertar') {
      const s = $('#sertar');
      s.classList.toggle('deschis');
      $('.retine-flotant').setAttribute('aria-expanded', s.classList.contains('deschis'));
      return;
    }
    if (a === 'pas' || a === 'toti') {
      const ex = b.closest('[data-exemplu]');
      const ascunse = $$('.pasi li.ascuns', ex);
      (a === 'toti' ? ascunse : ascunse.slice(0, 1)).forEach((li) => li.classList.remove('ascuns'));
      if (ascunse.length <= 1 || a === 'toti') b.parentElement.remove();
      return;
    }
    if (a === 'verificaTest') return verificaTest();

    const art = b.closest('[data-cheie]');
    if (!art) return;
    const cheie = art.dataset.cheie;
    const item = inst[cheie];

    if (a === 'indiciu') {
      arataFeedback(art, 'invalid', '💡 ' + item.indiciu);
    } else if (a === 'varianta') {
      // htmlExercitiu generează o instanță nouă din itemul original
      art.innerHTML = htmlExercitiu(L.exercitii.find((x) => x.id === item.id)).replace(/^<article[^>]*>|<\/article>$/g, '');
      incercari[cheie] = 0;
      App.math(art);
    } else if (a === 'verifica') {
      const raspuns = App.citesteRaspuns(art, item, cheie);
      const r = Verificare.verifica(item, raspuns);
      if (r.stare === 'gol') return arataFeedback(art, 'invalid', 'Scrie sau alege un răspuns mai întâi.');
      if (r.stare === 'invalid') return arataFeedback(art, 'invalid', r.mesaj);
      incercari[cheie] = (incercari[cheie] || 0) + 1;
      if (item.tip === 'grila' || item.tip === 'adevarat-fals') App.marcheazaOptiuni(art, item, raspuns);
      const rezolvare = item.rezolvare ? '<details class="rezolvare"><summary>Vezi rezolvarea</summary>' + item.rezolvare + '</details>' : '';
      if (r.stare === 'corect') {
        Progres.exercitiuCorect(lectieId, item.id);
        arataFeedback(art, 'corect', '✅ Corect! ' + (item.generator ? 'Încearcă și o altă variantă.' : '') + rezolvare);
      } else {
        Progres.noteazaGreseala(lectieId + ':' + item.id);
        const dupa2 = incercari[cheie] >= 2;
        arataFeedback(
          art,
          'gresit',
          '❌ ' + (r.mesaj || 'Nu e corect încă.') + ' ' + (dupa2 ? 'Răspunsul corect: ' + App.raspunsCorectText(item) + rezolvare : item.indiciu ? 'Uită-te la indiciu și mai încearcă.' : 'Mai încearcă o dată.')
        );
      }
    }
  }

  function verificaTest() {
    const sect = $('#testLectie');
    let p = 0;
    let max = 0;
    const invalide = [];
    const evaluari = $$('[data-cheie]', sect).map((art) => {
      const item = inst[art.dataset.cheie];
      const raspuns = App.citesteRaspuns(art, item, art.dataset.cheie);
      const r = Verificare.verifica(item, raspuns);
      if (r.stare === 'invalid') invalide.push(art);
      return { art, item, raspuns, r };
    });
    if (invalide.length) {
      invalide.forEach((art) => arataFeedback(art, 'invalid', 'Nu înțeleg formatul. Corectează sau lasă gol.'));
      invalide[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    for (const { art, item, raspuns, r } of evaluari) {
      const pct = item.puncte || 1;
      max += pct;
      if (item.tip === 'grila' || item.tip === 'adevarat-fals') App.marcheazaOptiuni(art, item, raspuns);
      const rezolvare = item.rezolvare ? '<details class="rezolvare"><summary>Rezolvare</summary>' + item.rezolvare + '</details>' : '';
      if (r.stare === 'corect') {
        p += pct;
        arataFeedback(art, 'corect', '✅ Corect' + rezolvare);
      } else {
        Progres.noteazaGreseala(lectieId + ':test:' + item.id);
        arataFeedback(art, 'gresit', (r.stare === 'gol' ? '— fără răspuns. ' : '❌ ') + 'Răspuns corect: ' + App.raspunsCorectText(item) + rezolvare);
      }
    }
    const nota = App.nota(p, max);
    const vechi = Progres.stareLectie(lectieId) || {};
    Progres.actualizeazaLectie(lectieId, {
      titlu: L.titlu,
      terminata: true,
      data: new Date().toISOString(),
      nota,
      puncte: p,
      maxim: max,
      notaMax: Math.max(nota, vechi.notaMax || 0),
    });
    const cat = App.categorie(p / max);
    $('#rezTest').innerHTML =
      '<div class="rezultat-cap" style="margin-top:16px"><div class="nota-mare"><div>' + App.nr(nota) + '<small>nota</small></div></div>' +
      '<div><p class="text-' + cat + '" style="font-weight:700;font-size:1.2rem">' + p + ' din ' + max + ' puncte</p>' +
      '<p>' + (cat === 'verde' ? 'Lecția e stăpânită. Poți merge mai departe! 🎉' : 'Mai exersează exercițiile de mai sus și reia testul.') + '</p>' +
      '<button class="btn secundar mic" type="button" id="reiaTest">Reia testul (variante noi)</button></div></div>';
    $('#reiaTest').addEventListener('click', () => {
      sect.outerHTML = htmlTest();
      App.math($('#testLectie'));
      $('#testLectie').scrollIntoView({ behavior: 'smooth' });
    });
    $('#rezTest').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  porneste();
})();
