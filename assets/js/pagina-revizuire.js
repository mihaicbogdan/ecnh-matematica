/* Pagina de revizuire pentru părinte/profesor: revizuire.html?id=<test sau lecție>
   Arată tot conținutul pe o pagină, cu răspunsuri, rezolvări și barem.
   Fără id: lista cu tot conținutul disponibil. */
(function () {
  'use strict';

  const { $, esc } = App;
  const radacina = $('#continut');
  const LITERE = ['a', 'b', 'c', 'd', 'e', 'f'];
  const TIPURI = {
    grila: 'grilă',
    numeric: 'răspuns numeric',
    completare: 'completare',
    'adevarat-fals': 'adevărat / fals',
    rezolvare: 'rezolvare completă (autoevaluare după barem)',
  };
  const NIVELURI = { 1: 'ușor', 2: 'mediu', 3: 'greu' };
  let curr;

  function titluCapitol(id) {
    const c = (curr.capitoleCl6 || []).find((x) => x.id === id);
    return c ? c.titlu : id;
  }

  function stareRevizuit(rev) {
    return rev ? '<span class="eticheta verde">revizuit ✓</span>' : '<span class="eticheta galben">nerevizuit</span>';
  }

  /* Corpul unui item deja generat: variante, răspuns, barem, rezolvare. */
  function corpItem(item) {
    let h = App.figura(item.figura);
    if (item.tip === 'grila') {
      h +=
        '<div class="optiuni blocat">' +
        item.variante
          .map((v, i) => '<div class="optiune' + (i === item.corect ? ' corect' : '') + '"><span class="litera">' + LITERE[i] + '</span><span>' + v + '</span></div>')
          .join('') +
        '</div>';
    } else if (item.tip !== 'rezolvare') {
      const acceptate = Array.isArray(item.raspuns) && item.raspuns.length > 1 ? ' <span class="mic">(se acceptă: ' + item.raspuns.map(esc).join(' · ') + ')</span>' : '';
      h += '<p class="rev-raspuns">Răspuns corect: <b>' + App.raspunsCorectText(item) + '</b>' + acceptate + '</p>';
      if (item.tip === 'numeric') {
        h += '<p class="mic">Se acceptă orice formă cu aceeași valoare (fracție, zecimal, periodic)' +
          (item.ireductibila ? ', dar fracția trebuie să fie ireductibilă.' : '.') + '</p>';
      }
    }
    if (item.barem) {
      h +=
        '<table class="tabel-rez rev-barem"><thead><tr><th>Barem</th><th style="text-align:right">Puncte</th></tr></thead><tbody>' +
        item.barem.map((p) => '<tr><td>' + p.pas + '</td><td style="text-align:right">' + p.puncte + 'p</td></tr>').join('') +
        '<tr><td><b>Total</b></td><td style="text-align:right"><b>' + item.barem.reduce((s, p) => s + p.puncte, 0) + 'p</b></td></tr></tbody></table>';
    }
    if (item.indiciu) h += '<div class="indiciu">💡 <b>Indiciu:</b> ' + item.indiciu + '</div>';
    if (item.rezolvare) h += '<div class="rev-rezolvare"><b>Rezolvare:</b><br>' + item.rezolvare + '</div>';
    return h;
  }

  function descriereGenerator(gen) {
    const v = Object.entries(gen.variabile || {})
      .map(([n, d]) => '$' + n + '$ ' + (Array.isArray(d.din) ? '∈ {' + d.din.join(', ') + '}' : 'de la ' + d.min + ' la ' + d.max))
      .join('; ');
    return '<p class="mic">🔄 <b>Numere generate la fiecare încercare:</b> ' + v + (gen.conditie ? '; condiție: <code>' + esc(gen.conditie) + '</code>' : '') + '. Mai jos sunt 3 exemple.</p>';
  }

  function htmlItem(item0, eticheta, meta) {
    const cap =
      '<div class="item-cap"><span class="item-nr">' + esc(eticheta) + '</span>' +
      '<span class="mic">' + meta + '</span>' + (item0.puncte ? '<span class="item-puncte">' + item0.puncte + 'p</span>' : '') + '</div>';
    if (!item0.generator) {
      const item = Generatori.aplica(item0, 1);
      return '<article class="item rev-item">' + cap + '<div class="item-corp"><div class="rev-enunt">' + item.enunt + '</div>' + corpItem(item) + '</div></article>';
    }
    const variante = [11, 22, 33]
      .map((s, k) => {
        const item = Generatori.aplica(item0, s * 7919);
        return '<div class="rev-varianta"><span class="eticheta">Varianta ' + (k + 1) + '</span><div class="rev-enunt">' + item.enunt + '</div>' + corpItem(item) + '</div>';
      })
      .join('');
    return '<article class="item rev-item">' + cap + '<div class="item-corp">' + descriereGenerator(item0.generator) + variante + '</div></article>';
  }

  function revizuireTest(T) {
    const total = T.subiecte.reduce((s, sub) => s + sub.itemi.reduce((x, i) => x + i.puncte, 0), 0);
    return (
      '<header class="rev-antet"><span class="eticheta">' + esc(T.eticheta || 'Test') + '</span> ' + stareRevizuit(T.revizuit) +
      '<h1>' + esc(T.titlu) + '</h1><p>' + total + ' puncte + 10 din oficiu · ' + T.durataMinute + ' minute · ' +
      T.subiecte.reduce((s, x) => s + x.itemi.length, 0) + ' itemi</p></header>' +
      T.subiecte
        .map(
          (sub) =>
            '<section class="foaie cu-margine rev-sectiune"><h2 style="margin-top:0">' + esc(sub.titlu) + '</h2>' +
            (sub.instructiuni ? '<p class="subiect-instr">' + sub.instructiuni + '</p>' : '') +
            sub.itemi.map((it) => htmlItem(it, it.id, esc(titluCapitol(it.capitol)) + ' · ' + TIPURI[it.tip])).join('') +
            '</section>'
        )
        .join('')
    );
  }

  function revizuireLectie(L) {
    return (
      '<header class="rev-antet"><span class="eticheta">' + esc(L.eticheta || 'Lecție') + '</span> ' + stareRevizuit(L.revizuit) +
      '<h1>' + esc(L.titlu) + '</h1>' + (L.introducere ? '<p>' + L.introducere + '</p>' : '') + '</header>' +
      '<section class="retine"><h2>De reținut</h2><ul>' + L.deRetinut.map((r) => '<li>' + r + '</li>').join('') + '</ul></section>' +
      (L.exemple && L.exemple.length
        ? '<section class="foaie cu-margine rev-sectiune"><h2 style="margin-top:0">Exemple rezolvate</h2>' +
          L.exemple
            .map((ex, k) => '<article class="item"><b>Exemplul ' + (k + 1) + (ex.titlu ? ': ' + ex.titlu : '') + '</b><div>' + ex.enunt + '</div>' + App.figura(ex.figura) +
              '<ol class="pasi">' + ex.pasi.map((p) => '<li>' + p + '</li>').join('') + '</ol></article>')
            .join('') +
          '</section>'
        : '') +
      '<section class="foaie cu-margine rev-sectiune"><h2 style="margin-top:0">Exerciții</h2>' +
      L.exercitii.map((e) => htmlItem(e, e.id, 'nivel ' + NIVELURI[e.nivel] + ' · ' + TIPURI[e.tip])).join('') +
      '</section>' +
      (L.test
        ? '<section class="foaie cu-margine rev-sectiune"><h2 style="margin-top:0">Testul lecției</h2>' +
          L.test.itemi.map((t, k) => htmlItem(t, k + 1 + '.', TIPURI[t.tip])).join('') + '</section>'
        : '')
    );
  }

  async function cuprins() {
    const linii = [];
    for (const [id, t] of Object.entries(curr.teste)) linii.push({ id, titlu: t.titlu, fisier: t.fisier, tip: 'Test' });
    for (const [id, l] of Object.entries(curr.lectii)) if (l.fisier) linii.push({ id, titlu: l.titlu, fisier: l.fisier, tip: 'Lecție' });
    const stari = await Promise.all(linii.map((l) => App.incarcaJSON(l.fisier).then((d) => d.revizuit).catch(() => null)));
    radacina.innerHTML =
      '<h1 style="margin-top:26px">Revizuire conținut</h1>' +
      '<p>Pagina e pentru părinte sau profesor: arată fiecare test și lecție cu răspunsurile, rezolvările și baremul. Când găsești ceva de corectat, notează ID-ul itemului (de ex. <b>II.5</b>).</p>' +
      '<section class="foaie"><ul class="lectii">' +
      linii
        .map((l, i) => '<li><span class="eticheta">' + l.tip + '</span><a href="revizuire.html?id=' + encodeURIComponent(l.id) + '">' + esc(l.titlu) + '</a><span class="stare">' + stareRevizuit(stari[i]) + '</span></li>')
        .join('') +
      '</ul></section>';
  }

  async function porneste() {
    App.antet('');
    try {
      curr = await App.curriculum();
      const id = App.param('id');
      if (!id) return await cuprins();
      const intrare = curr.teste[id] || curr.lectii[id];
      if (!intrare || !intrare.fisier) throw new Error('Nu există conținut cu id-ul „' + id + '”.');
      const date = await App.incarcaJSON(intrare.fisier);
      document.title = 'Revizuire: ' + date.titlu + ' · ECNH';
      radacina.innerHTML =
        '<div class="rand-butoane rev-unelte"><a class="btn secundar mic" href="revizuire.html">← Tot conținutul</a>' +
        '<button class="btn mic" type="button" onclick="window.print()">🖨 Tipărește</button></div>' +
        (curr.teste[id] ? revizuireTest(date) : revizuireLectie(date));
    } catch (e) {
      App.eroare(radacina, e.message);
      return;
    }
    App.math(radacina);
  }

  porneste();
})();
