/* Motorul de test: test.html?id=<id din curriculum.teste>
   Etape: intro → lucru → autoevaluare (doar dacă are itemi „rezolvare”) → rezultat.
   Vizualizare rezultat salvat: test.html?id=<id>&rez=<id rezultat> */
(function () {
  'use strict';

  const { $, $$, esc } = App;
  const radacina = $('#continut');
  let T, testId, curr, S, itemi, dupaId, timer, salvareText;

  async function porneste() {
    App.antet('');
    try {
      curr = await App.curriculum();
      testId = App.param('id') || curr.evaluareInitiala[0];
      const intrare = curr.teste[testId];
      if (!intrare) throw new Error('Testul „' + testId + '” nu există în curriculum.');
      T = await App.incarcaJSON(intrare.fisier);
    } catch (e) {
      App.eroare(radacina, e.message);
      return;
    }
    document.title = T.titlu + ' · ECNH';

    const rezId = App.param('rez');
    if (rezId) {
      const rez = Progres.rezultat(rezId);
      if (!rez) return App.eroare(radacina, 'Rezultatul nu a fost găsit pe acest dispozitiv.');
      S = { samanta: rez.samanta, raspunsuri: {}, bife: rez.bife || {} };
      pregatesteItemi();
      return randeazaRezultat(rez);
    }

    S = Progres.ciorna(testId) || stareNoua();
    pregatesteItemi();
    randeaza();
  }

  function stareNoua() {
    return { samanta: Generatori.samantaNoua(), raspunsuri: {}, bife: {}, scursSec: 0, etapa: 'intro', inceput: null };
  }

  function pregatesteItemi() {
    itemi = [];
    T.subiecte.forEach((sub, si) =>
      sub.itemi.forEach((it, ii) => {
        const gen = Generatori.aplica(it, S.samanta + si * 100 + ii);
        itemi.push(Object.assign({}, gen, { _subiect: sub.id }));
      })
    );
    dupaId = Object.fromEntries(itemi.map((i) => [i.id, i]));
  }

  function salveaza() {
    Progres.salveazaCiorna(testId, S);
  }

  function randeaza() {
    clearInterval(timer);
    if (S.etapa === 'lucru') randeazaLucru();
    else if (S.etapa === 'autoevaluare') randeazaAutoevaluare();
    else randeazaIntro();
    window.scrollTo(0, 0);
  }

  function titluCapitol(id) {
    const c6 = (curr.capitoleCl6 || []).find((c) => c.id === id);
    if (c6) return c6.titlu;
    for (const ramura of Object.values(curr.clasa7 || {})) {
      for (const cap of ramura) {
        if (cap.id === id) return cap.titlu;
        const l = (cap.lectii || []).find((x) => x.id === id);
        if (l) return l.titlu;
      }
    }
    return (T.capitole && T.capitole[id]) || id;
  }

  /* ---------- INTRO ---------- */
  function randeazaIntro() {
    const total = itemi.reduce((s, i) => s + i.puncte, 0);
    const areCiorna = !!Progres.ciorna(testId) && S.inceput;
    radacina.innerHTML =
      '<section class="foaie cu-margine apare" style="margin-top:18px">' +
      '<span class="eticheta">' + esc(T.eticheta || 'Test') + '</span>' +
      '<h1>' + esc(T.titlu) + '</h1>' +
      (T.descriere ? '<p>' + T.descriere + '</p>' : '') +
      '<ul>' +
      T.subiecte
        .map((s) => '<li><b>' + esc(s.titlu) + '</b> — ' + s.itemi.reduce((x, i) => x + i.puncte, 0) + ' puncte · ' + esc(s.scurt || '') + '</li>')
        .join('') +
      '</ul>' +
      '<p>Total: <b>' + total + ' puncte</b> + 10 puncte din oficiu. Timp recomandat: <b>' + T.durataMinute + ' de minute</b> (dacă nu termini la timp, poți continua).</p>' +
      '<div class="alerta info"><b>Cum scrii răspunsurile numerice:</b> 12 · -3 · 0,75 · 3/4 · 0,(3) · 2√3. Sub câmp vezi cum a înțeles calculatorul ce ai scris.</div>' +
      (T.revizuit ? '' : '<p class="mic" style="margin-top:12px">⚠ Conținut nerevizuit încă de părinte/profesor.</p>') +
      '<div class="rand-butoane">' +
      '<button class="btn" type="button" id="start">' + (areCiorna ? 'Continuă testul' : 'Încep testul') + '</button>' +
      (areCiorna ? '<button class="btn secundar" type="button" id="dinNou">Începe de la zero</button>' : '') +
      '<a class="btn secundar" href="index.html">Mai târziu</a></div></section>';

    $('#start').addEventListener('click', () => {
      S.etapa = 'lucru';
      S.inceput = S.inceput || new Date().toISOString();
      salveaza();
      randeaza();
    });
    const dn = $('#dinNou');
    if (dn) dn.addEventListener('click', () => {
      S = stareNoua();
      Progres.stergeCiorna(testId);
      pregatesteItemi();
      randeaza();
    });
  }

  /* ---------- LUCRU ---------- */
  const itemiAuto = () => itemi.filter((i) => i.tip !== 'rezolvare');
  const raspunse = () => itemiAuto().filter((i) => String(S.raspunsuri[i.id] ?? '').trim() !== '').length;

  function htmlItem(item, nr) {
    return (
      '<article class="item" id="it-' + esc(item.id) + '" data-id="' + esc(item.id) + '">' +
      '<div class="item-cap"><span class="item-nr">' + esc(nr) + '</span><div class="item-enunt">' + item.enunt + '</div>' +
      '<span class="item-puncte">' + item.puncte + 'p</span></div>' +
      '<div class="item-corp">' + App.figura(item.figura) + App.controlItem(item, 'r_' + item.id, S.raspunsuri[item.id]) + '</div>' +
      '</article>'
    );
  }

  function randeazaLucru() {
    radacina.innerHTML =
      '<div class="bara-test"><span class="cronometru" id="ceas"></span>' +
      '<div class="progres-mini" title="Întrebări cu răspuns"><span id="bara"></span></div>' +
      '<span class="mic" id="contor"></span>' +
      '<button class="btn mic" type="button" data-a="termina">Termină testul</button></div>' +
      '<div class="foaie cu-margine" style="margin-top:16px">' +
      '<h1 style="font-size:1.7rem">' + esc(T.titlu) + '</h1>' +
      T.subiecte
        .map(
          (sub) =>
            '<section class="subiect"><div class="subiect-cap"><h2>' + esc(sub.titlu) + '</h2><span class="mana" style="font-size:1.4rem;color:var(--rosu)">' +
            sub.itemi.reduce((x, i) => x + i.puncte, 0) + ' de puncte</span></div>' +
            (sub.instructiuni ? '<p class="subiect-instr">' + sub.instructiuni + '</p>' : '') +
            sub.itemi.map((it, k) => htmlItem(dupaId[it.id], k + 1 + '.')).join('') +
            '</section>'
        )
        .join('') +
      '<div id="mesajFinal" style="margin-top:20px"></div>' +
      '<div class="rand-butoane"><button class="btn" type="button" data-a="termina">Termină testul</button></div>' +
      '</div>';

    App.math(radacina);
    $$('input[type="text"]', radacina).forEach((inp) => App.actualizeazaInterpretare(inp, dupaId[inp.name.slice(2)]));
    actualizeazaBara();

    radacina.addEventListener('input', laSchimbare);
    radacina.addEventListener('change', laSchimbare);
    radacina.addEventListener('click', laClick);
    // salvare imediată când pagina e închisă/reîncărcată (nu așteptăm debounce-ul)
    window.addEventListener('pagehide', () => S.etapa === 'lucru' && salveaza());
    document.addEventListener('visibilitychange', () => document.hidden && S.etapa === 'lucru' && salveaza());

    tic();
    timer = setInterval(() => {
      S.scursSec++;
      tic();
      if (S.scursSec % 15 === 0) salveaza();
    }, 1000);
  }

  function tic() {
    const ceas = $('#ceas');
    if (!ceas) return;
    const lim = T.durataMinute * 60;
    const depasit = S.scursSec > lim;
    ceas.textContent = '⏱ ' + App.ceas(S.scursSec) + ' / ' + App.ceas(lim) + (depasit ? ' · continuă liniștit' : '');
    ceas.classList.toggle('depasit', depasit);
  }

  function actualizeazaBara() {
    const n = itemiAuto().length;
    const r = raspunse();
    $('#bara').style.width = (n ? (100 * r) / n : 0) + '%';
    $('#contor').textContent = r + ' / ' + n + ' răspunsuri';
  }

  function laSchimbare(e) {
    const inp = e.target;
    if (!inp.name || !inp.name.startsWith('r_') || S.etapa !== 'lucru') return;
    const item = dupaId[inp.name.slice(2)];
    S.raspunsuri[item.id] = inp.value;
    if (inp.type === 'text') {
      App.actualizeazaInterpretare(inp, item);
      clearTimeout(salvareText);
      salvareText = setTimeout(salveaza, 400);
    } else {
      salveaza();
    }
    actualizeazaBara();
  }

  function laClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b || S.etapa !== 'lucru') return;
    if (b.dataset.a === 'termina') incearcaTermina(false);
    if (b.dataset.a === 'confirma') incearcaTermina(true);
    if (b.dataset.a === 'inapoi') $('#mesajFinal').innerHTML = '';
  }

  function incearcaTermina(confirmat) {
    const mesaj = $('#mesajFinal');
    const invalide = itemiAuto().filter((i) => Verificare.verifica(i, S.raspunsuri[i.id]).stare === 'invalid');
    if (invalide.length) {
      mesaj.innerHTML =
        '<div class="alerta"><b>Câteva răspunsuri nu au un format pe care să-l înțeleg:</b> ' +
        invalide.map((i) => '<a href="#it-' + esc(i.id) + '">' + esc(i.id) + '</a>').join(', ') +
        '. Corectează-le sau lasă câmpul gol.</div>';
      mesaj.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const lipsa = itemiAuto().length - raspunse();
    if (lipsa > 0 && !confirmat) {
      mesaj.innerHTML =
        '<div class="alerta"><b>Ai ' + lipsa + (lipsa === 1 ? ' întrebare' : ' întrebări') + ' fără răspuns.</b> Sigur termini testul?' +
        '<div class="rand-butoane"><button class="btn mic" type="button" data-a="confirma">Da, termin</button>' +
        '<button class="btn secundar mic" type="button" data-a="inapoi">Mă mai uit</button></div></div>';
      mesaj.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    clearInterval(timer);
    radacina.removeEventListener('input', laSchimbare);
    radacina.removeEventListener('change', laSchimbare);
    radacina.removeEventListener('click', laClick);
    if (itemi.some((i) => i.tip === 'rezolvare')) {
      S.etapa = 'autoevaluare';
      salveaza();
      randeaza();
    } else {
      finalizeaza();
    }
  }

  /* ---------- AUTOEVALUARE (Subiectul III) ---------- */
  function randeazaAutoevaluare() {
    const deEvaluat = itemi.filter((i) => i.tip === 'rezolvare');
    radacina.innerHTML =
      '<div class="foaie cu-margine apare" style="margin-top:18px">' +
      '<span class="eticheta galben">Autoevaluare</span>' +
      '<h1 style="font-size:1.8rem">Verifică-ți rezolvările de pe caiet</h1>' +
      '<p>Compară fiecare problemă cu rezolvarea de mai jos. <b>Bifează doar pașii pe care i-ai scris corect</b>, ca profesorul care corectează lucrarea. Fii cinstit: așa aflăm exact ce trebuie recapitulat.</p>' +
      deEvaluat
        .map((item) => {
          const bife = S.bife[item.id] || [];
          return (
            '<article class="item" data-id="' + esc(item.id) + '">' +
            '<div class="item-cap"><span class="item-nr">' + esc(item.id) + '</span><div class="item-enunt">' + item.enunt + '</div>' +
            '<span class="item-puncte" data-subtotal="' + esc(item.id) + '"></span></div>' +
            '<div class="item-corp">' + App.figura(item.figura) +
            '<details class="rezolvare" open><summary>Rezolvarea completă</summary>' + item.rezolvare + '</details>' +
            '<ul class="barem">' +
            item.barem
              .map(
                (pas, k) =>
                  '<li><label><input type="checkbox" data-item="' + esc(item.id) + '" data-k="' + k + '"' + (bife[k] ? ' checked' : '') + '>' +
                  '<span>' + pas.pas + '</span><span class="pct">' + pas.puncte + 'p</span></label></li>'
              )
              .join('') +
            '</ul></div></article>'
          );
        })
        .join('') +
      '<div class="rand-butoane"><button class="btn" type="button" id="gata">Vezi nota</button>' +
      '<span class="mana" style="font-size:1.4rem" id="totalBife"></span></div></div>';

    App.math(radacina);
    const actualizeaza = () => {
      let total = 0;
      for (const item of deEvaluat) {
        const b = S.bife[item.id] || [];
        const p = item.barem.reduce((s, pas, k) => s + (b[k] ? pas.puncte : 0), 0);
        total += p;
        $('[data-subtotal="' + CSS.escape(item.id) + '"]').textContent = p + ' / ' + item.puncte + 'p';
      }
      $('#totalBife').textContent = 'Subiectul III: ' + total + ' / ' + deEvaluat.reduce((s, i) => s + i.puncte, 0) + ' puncte';
    };
    radacina.addEventListener('change', (e) => {
      const cb = e.target;
      if (cb.type !== 'checkbox') return;
      const arr = S.bife[cb.dataset.item] || (S.bife[cb.dataset.item] = []);
      arr[Number(cb.dataset.k)] = cb.checked;
      salveaza();
      actualizeaza();
    });
    actualizeaza();
    $('#gata').addEventListener('click', finalizeaza);
  }

  /* ---------- PUNCTARE ---------- */
  function puncteaza() {
    let p = 0;
    let max = 0;
    const capitole = {};
    const it = {};
    for (const item of itemi) {
      let pi = 0;
      if (item.tip === 'rezolvare') {
        const b = S.bife[item.id] || [];
        pi = item.barem.reduce((s, pas, k) => s + (b[k] ? pas.puncte : 0), 0);
      } else if (Verificare.verifica(item, S.raspunsuri[item.id]).stare === 'corect') {
        pi = item.puncte;
      }
      p += pi;
      max += item.puncte;
      const c = item.capitol;
      if (!capitole[c]) capitole[c] = { titlu: titluCapitol(c), p: 0, max: 0 };
      capitole[c].p += pi;
      capitole[c].max += item.puncte;
      it[item.id] = { p: pi, max: item.puncte, raspuns: S.raspunsuri[item.id] ?? '' };
    }
    return { p, max, capitole, it };
  }

  function finalizeaza() {
    const r = puncteaza();
    const rez = {
      id: App.id(),
      testId,
      titlu: T.titlu,
      tip: T.tip || 'test',
      data: new Date().toISOString(),
      durataSec: S.scursSec,
      puncte: r.p,
      maxim: r.max,
      nota: App.nota(r.p, r.max),
      capitole: r.capitole,
      itemi: r.it,
      samanta: S.samanta,
      bife: S.bife,
    };
    for (const item of itemiAuto()) {
      if (r.it[item.id].p === 0) Progres.noteazaGreseala(testId + ':' + item.id);
    }
    Progres.adaugaRezultat(rez);
    Progres.stergeCiorna(testId);
    history.replaceState(null, '', 'test.html?id=' + encodeURIComponent(testId) + '&rez=' + rez.id);
    randeazaRezultat(rez);
  }

  /* ---------- REZULTAT ---------- */
  function incurajare(nota) {
    if (nota >= 9) return 'Excelent! 🌟';
    if (nota >= 7) return 'Foarte bine! 👏';
    if (nota >= 5) return 'Bun început! 🙂';
    return 'Acum știm exact ce avem de recapitulat 💪';
  }

  function htmlRecapitulare(rez) {
    const slabe = App.capitoleSlabe(rez.capitole);
    if (!slabe.length) return '<p>Niciun capitol sub 70%. Poți trece direct la lecțiile de clasa a 7-a! 🎉</p>';
    const capC7 = {};
    for (const ramura of Object.values(curr.clasa7 || {})) for (const c of ramura) capC7[c.id] = c;
    return (
      '<p>Aceste capitole au ieșit sub 70%. Recapitulează-le întâi, de la cel mai slab:</p><ul class="lista-recap">' +
      slabe
        .map((c) => {
          const def = (curr.capitoleCl6 || []).find((x) => x.id === c.id) || {};
          const lectie = def.recapitulare && curr.lectii[def.recapitulare] && curr.lectii[def.recapitulare].fisier;
          const prega = (def.pregateste || []).map((id) => capC7[id] && capC7[id].titlu).filter(Boolean);
          return (
            '<li><div><b>' + esc(c.titlu) + '</b> <span class="text-' + App.categorie(c.proc) + '">' + Math.round(c.proc * 100) + '%</span>' +
            (prega.length ? '<div class="mic">Te ajută la: ' + prega.map(esc).join(' · ') + '</div>' : '') + '</div>' +
            (lectie
              ? '<a class="btn mic" href="lectie.html?id=' + encodeURIComponent(def.recapitulare) + '">Recapitulează</a>'
              : '<span class="eticheta">în curând</span>') +
            '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function htmlCorectura(rez) {
    return T.subiecte
      .map(
        (sub) =>
          '<h3 style="margin-top:22px">' + esc(sub.titlu) + '</h3>' +
          sub.itemi
            .map((it0, k) => {
              const item = dupaId[it0.id];
              const ri = rez.itemi[item.id] || { p: 0, max: item.puncte, raspuns: '' };
              const ok = ri.p === ri.max;
              const partial = ri.p > 0 && !ok;
              const simbol = ok ? '✅' : partial ? '🟡' : '❌';
              return (
                '<article class="item"><div class="item-cap"><span class="item-nr">' + (k + 1) + '. ' + simbol + '</span>' +
                '<div class="item-enunt">' + item.enunt + '</div><span class="item-puncte">' + ri.p + ' / ' + ri.max + 'p</span></div>' +
                '<div class="item-corp">' + App.figura(item.figura) +
                (item.tip === 'rezolvare'
                  ? '<p class="mic">Punctaj acordat la autoevaluare.</p>'
                  : '<p>Răspunsul tău: <b>' + App.raspunsElevText(item, ri.raspuns) + '</b>' +
                    (ok ? '' : '<br>Răspuns corect: <b>' + App.raspunsCorectText(item) + '</b>') + '</p>') +
                (item.rezolvare ? '<details class="rezolvare"' + (ok ? '' : ' open') + '><summary>Rezolvare</summary>' + item.rezolvare + '</details>' : '') +
                '</div></article>'
              );
            })
            .join('')
      )
      .join('');
  }

  // după un test de evaluare, propune următorul test nedat din evaluarea inițială
  function htmlUrmatorulTest() {
    const lista = curr.evaluareInitiala || [];
    if (!lista.includes(testId)) return '';
    const urm = lista.find((id) => id !== testId && !Progres.ultimRezultat(id));
    return urm ? '<a class="btn" href="test.html?id=' + encodeURIComponent(urm) + '">Următorul: ' + esc(curr.teste[urm].titlu.replace('Evaluare inițială — ', '')) + '</a>' : '';
  }

  function randeazaRezultat(rez) {
    const prenume = Progres.prenume();
    radacina.innerHTML =
      '<section class="foaie cu-margine apare" style="margin-top:18px">' +
      '<span class="eticheta verde">Rezultat</span>' +
      '<div class="rezultat-cap" style="margin-top:10px"><div class="nota-mare"><div>' + App.nr(rez.nota) + '<small>nota</small></div></div>' +
      '<div><h1 style="margin:0">' + (prenume ? incurajare(rez.nota).replace('!', ', ' + esc(prenume) + '!') : incurajare(rez.nota)) + '</h1>' +
      '<p>' + esc(rez.titlu) + '<br><span class="mic">' + App.data(rez.data) + ' · ' + App.minute(rez.durataSec) + ' min · ' +
      App.nr(rez.puncte, 0) + ' din ' + rez.maxim + ' puncte (+10 din oficiu)</span></p></div></div>' +
      '<h2>Pe capitole</h2>' + App.bareCapitole(rez.capitole) +
      (rez.tip === 'evaluare' ? '<h2>Recapitulează întâi</h2>' + htmlRecapitulare(rez) : '') +
      '<h2>Trimite părintelui</h2><div id="trimitere"></div>' +
      '</section>' +
      '<section class="foaie cu-margine" style="margin-top:18px"><h2 style="margin-top:0">Corectura</h2>' + htmlCorectura(rez) + '</section>' +
      '<div class="rand-butoane"><a class="btn" href="index.html">Acasă</a><a class="btn secundar" href="progres.html">Progres</a>' +
      htmlUrmatorulTest() +
      '<a class="btn secundar" href="test.html?id=' + encodeURIComponent(testId) + '">Dă testul din nou</a></div>';
    App.panouTrimitere($('#trimitere'), App.raportText(rez, prenume), 'Raport ECNH: ' + rez.titlu);
    App.math(radacina);
    window.scrollTo(0, 0);
  }

  porneste();
})();
