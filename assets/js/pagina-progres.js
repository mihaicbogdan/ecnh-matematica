/* Pagina Progres: evoluția notelor, istoricul testelor, lecții, backup. */
(function () {
  'use strict';

  const { $, esc } = App;
  const radacina = $('#continut');

  function graficNote(rez) {
    const pct = rez.slice().reverse(); // cronologic
    if (pct.length < 2) return '';
    const W = 600, H = 200, st = 34, dr = 14, sus = 14, jos = 30;
    const x = (i) => st + (i * (W - st - dr)) / (pct.length - 1);
    const y = (n) => sus + ((10 - n) * (H - sus - jos)) / 9;
    const axe = [1, 5, 10]
      .map((n) => '<line class="axa" x1="' + st + '" x2="' + (W - dr) + '" y1="' + y(n) + '" y2="' + y(n) + '"/><text x="' + (st - 8) + '" y="' + (y(n) + 4) + '" text-anchor="end">' + n + '</text>')
      .join('');
    const linie = pct.map((r, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(r.nota).toFixed(1)).join(' ');
    const puncte = pct
      .map((r, i) => '<circle class="punct" cx="' + x(i) + '" cy="' + y(r.nota) + '" r="5"><title>' + esc(r.titlu) + ' · ' + App.data(r.data) + ' · nota ' + App.nr(r.nota) + '</title></circle>')
      .join('');
    const etichete = pct
      .map((r, i) => '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + App.data(r.data).slice(0, 5) + '</text>')
      .join('');
    return (
      '<section class="foaie apare" style="margin-top:18px"><h2 style="margin-top:0">Evoluția notelor</h2>' +
      '<div class="grafic-note"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evoluția notelor la teste">' +
      axe + '<path class="linie" d="' + linie + '"/>' + puncte + etichete + '</svg></div></section>'
    );
  }

  function tabelRezultate(rez) {
    if (!rez.length) {
      return '<p>Încă nu ai dat niciun test. <a href="test.html?id=diagnostic-cl6">Începe cu evaluarea inițială</a>.</p>';
    }
    return (
      '<div class="tabel-scroll"><table class="tabel-rez"><thead><tr><th>Data</th><th>Test</th><th>Nota</th><th>Durata</th><th></th></tr></thead><tbody>' +
      rez
        .map((r) => {
          const cat = App.categorie((r.nota - 1) / 9);
          return (
            '<tr><td>' + App.data(r.data) + '</td><td>' + esc(r.titlu) + '</td>' +
            '<td><b class="text-' + cat + '">' + App.nr(r.nota) + '</b></td><td>' + App.minute(r.durataSec) + ' min</td>' +
            '<td style="white-space:nowrap"><a class="btn secundar mic" href="test.html?id=' + encodeURIComponent(r.testId) + '&rez=' + r.id + '">Detalii</a> ' +
            '<button class="btn secundar mic" type="button" data-trimite="' + r.id + '">Trimite</button></td></tr>' +
            '<tr class="ascuns" data-panou="' + r.id + '"><td colspan="5">' + App.bareCapitole(r.capitole) + '<div data-zona="trimitere"></div></td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div>'
    );
  }

  function listaLectii() {
    const l = Object.entries(Progres.date().lectii).filter(([, v]) => v.terminata);
    if (!l.length) return '<p class="mic">Nicio lecție terminată încă.</p>';
    return (
      '<ul class="lectii">' +
      l
        .map(
          ([id, v]) =>
            '<li><a href="lectie.html?id=' + encodeURIComponent(id) + '">' + esc(v.titlu || id) + '</a><span class="stare">' +
            '<span class="eticheta ' + App.categorie((v.nota - 1) / 9) + '">' + App.nr(v.nota) + '</span> <span class="mic">' + App.data(v.data) + '</span></span></li>'
        )
        .join('') +
      '</ul>'
    );
  }

  function randeaza() {
    App.antet('progres');
    const rez = Progres.rezultate();
    const greseli = Progres.greseliRepetate(2);
    const prenume = Progres.prenume();
    radacina.innerHTML =
      '<h1 style="margin-top:26px">Progres' + (prenume ? ' — ' + esc(prenume) : '') + '</h1>' +
      graficNote(rez) +
      '<section class="foaie apare" style="margin-top:18px"><h2 style="margin-top:0">Teste date</h2>' + tabelRezultate(rez) + '</section>' +
      '<section class="foaie apare" style="margin-top:18px"><h2 style="margin-top:0">Lecții terminate</h2>' + listaLectii() +
      (greseli.length
        ? '<h3 style="margin-top:18px">Greșite de mai multe ori</h3><p class="mic">' +
          greseli.map(([k, n]) => esc(k.replace(/:/g, ' · ')) + ' (' + n + '×)').join(' · ') + '</p>'
        : '') +
      '</section>' +
      '<section class="foaie apare" style="margin-top:18px"><h2 style="margin-top:0">Copie de siguranță</h2>' +
      '<p>Progresul e salvat doar în browserul de pe acest dispozitiv. Dacă se șterg datele browserului, se pierde. Descarcă din când în când o copie. Cu același fișier poți muta progresul pe alt dispozitiv.</p>' +
      '<div class="rand-butoane"><button class="btn" type="button" id="export">Descarcă copia</button>' +
      '<label class="btn secundar" style="cursor:pointer">Încarcă o copie<input type="file" id="import" accept="application/json,.json" class="ascuns"></label>' +
      '<button class="btn secundar" type="button" id="reset">Șterge tot progresul</button></div>' +
      '<div id="mesajBackup" style="margin-top:12px" aria-live="polite"></div></section>';

    radacina.addEventListener('click', laClick);
    $('#import').addEventListener('change', laImport);
    App.math(radacina);
  }

  function laClick(e) {
    const t = e.target.closest('[data-trimite]');
    if (t) {
      const id = t.dataset.trimite;
      const rand = $('[data-panou="' + id + '"]');
      rand.classList.toggle('ascuns');
      const zona = rand.querySelector('[data-zona="trimitere"]');
      if (!zona.innerHTML) {
        const r = Progres.rezultat(id);
        App.panouTrimitere(zona, App.raportText(r, Progres.prenume()), 'Raport ECNH: ' + r.titlu);
      }
      return;
    }
    const m = $('#mesajBackup');
    if (e.target.id === 'export') {
      const blob = new Blob([Progres.exporta()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ecnh-progres-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      m.innerHTML = '<p class="text-verde">Copia a fost descărcată ✓</p>';
    } else if (e.target.id === 'reset') {
      m.innerHTML =
        '<div class="alerta">Sigur ștergi tot progresul de pe acest dispozitiv? Nu se poate anula.' +
        '<div class="rand-butoane"><button class="btn mic" type="button" id="resetDa">Da, șterge</button>' +
        '<button class="btn secundar mic" type="button" id="resetNu">Renunț</button></div></div>';
    } else if (e.target.id === 'resetDa') {
      Progres.reseteaza();
      radacina.removeEventListener('click', laClick);
      randeaza();
    } else if (e.target.id === 'resetNu') {
      m.innerHTML = '';
    }
  }

  function laImport(e) {
    const f = e.target.files[0];
    if (!f) return;
    const citire = new FileReader();
    citire.onload = () => {
      try {
        Progres.importa(citire.result);
        radacina.removeEventListener('click', laClick);
        randeaza();
        $('#mesajBackup').innerHTML = '<p class="text-verde">Progresul a fost încărcat ✓</p>';
      } catch (err) {
        $('#mesajBackup').innerHTML = '<p class="text-rosu">' + esc(err.message) + '</p>';
      }
    };
    citire.readAsText(f);
  }

  randeaza();
})();
