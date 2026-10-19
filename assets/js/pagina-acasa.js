/* Pagina principală: salut, evaluarea inițială, recapitulare, harta clasei a 7-a. */
(function () {
  'use strict';

  const { $, esc } = App;
  const radacina = $('#continut');

  function htmlSalut() {
    const p = Progres.prenume();
    return (
      '<section class="hero apare"><p class="salut">Salut' + (p ? ', ' + esc(p) : '') + '!</p>' +
      '<h1>Matematica de clasa a 7-a, <em>pas cu pas</em>.</h1>' +
      '<p style="max-width:56ch">Întâi vedem ce ai reținut din clasa a 6-a. Apoi lucrăm fiecare lecție: regulile de reținut, exemple rezolvate, exerciții și un test scurt.</p>' +
      (p
        ? ''
        : '<form class="form-prenume" id="formPrenume"><input type="text" name="prenume" placeholder="Cum te cheamă?" aria-label="Prenume" maxlength="40" required>' +
          '<button class="btn" type="submit">Gata</button></form>') +
      '</section>'
    );
  }

  function htmlEvaluare(curr) {
    const card = (id) => {
      const ult = Progres.ultimRezultat(id);
      const ciorna = Progres.ciorna(id);
      const url = 'test.html?id=' + encodeURIComponent(id);
      let corp;
      if (ciorna && ciorna.inceput) {
        corp =
          '<p>Ai început testul și ai ' + Object.keys(ciorna.raspunsuri || {}).length + ' răspunsuri salvate.</p>' +
          '<div class="rand-butoane"><a class="btn" href="' + url + '">Continuă testul</a></div>';
      } else if (ult) {
        const cat = App.categorie((ult.nota - 1) / 9);
        corp =
          '<p>Ultima dată: <b class="text-' + cat + '">nota ' + App.nr(ult.nota) + '</b> · ' + App.data(ult.data) + '</p>' +
          '<div class="rand-butoane"><a class="btn mic" href="' + url + '&rez=' + ult.id + '">Vezi rezultatul</a>' +
          '<a class="btn secundar mic" href="' + url + '">Dă-l din nou</a></div>';
      } else {
        corp = '<p class="mic">18 întrebări · 50 de minute · Subiectele I, II, III</p><div class="rand-butoane"><a class="btn" href="' + url + '">Începe</a></div>';
      }
      return '<div class="foaie"><h3>' + esc(curr.teste[id].titlu.replace('Evaluare inițială — ', '')) + '</h3>' + corp + '</div>';
    };
    return (
      '<section class="foaie cu-margine apare" style="margin-top:22px">' +
      '<span class="eticheta rosu">Pasul 1</span><h2 style="margin-top:8px">Evaluare inițială — materia clasei a VI-a</h2>' +
      '<p>Două teste în stilul Evaluării Naționale, care trec prin tot manualul de clasa a 6-a. Le poți da în zile diferite.</p>' +
      '<div class="grila-carduri">' + curr.evaluareInitiala.map(card).join('') + '</div></section>'
    );
  }

  function htmlRecapitulare(curr) {
    const capitole = {};
    for (const id of curr.evaluareInitiala) {
      const ult = Progres.ultimRezultat(id);
      if (ult) Object.assign(capitole, ult.capitole);
    }
    const slabe = App.capitoleSlabe(capitole);
    if (!slabe.length) return '';
    return (
      '<section class="foaie cu-margine apare" style="margin-top:18px"><span class="eticheta galben">Pasul 2</span>' +
      '<h2 style="margin-top:8px">Recapitulează lacunele</h2><p class="mic">Subcapitolele din manual care au ieșit sub 70%, de la cel mai slab.</p><ul class="lista-recap">' +
      slabe
        .map((c) => {
          const def = curr.capitoleCl6.find((x) => x.id === c.id) || {};
          const lectie = def.recapitulare && curr.lectii[def.recapitulare];
          const st = def.recapitulare && Progres.stareLectie(def.recapitulare);
          return (
            '<li><span><b>' + esc(c.titlu) + '</b> <span class="text-' + App.categorie(c.proc) + '">' + Math.round(c.proc * 100) + '%</span>' +
            (st && st.nota ? ' · <span class="mic">test lecție: ' + App.nr(st.nota) + '</span>' : '') + '</span>' +
            (lectie && lectie.fisier
              ? '<a class="btn mic" href="lectie.html?id=' + encodeURIComponent(def.recapitulare) + '">Recapitulează</a>'
              : '<span class="eticheta">în curând</span>') +
            '</li>'
          );
        })
        .join('') +
      '</ul></section>'
    );
  }

  function htmlRamura(nume, capitole, curr) {
    return (
      '<div class="foaie apare"><h2 style="margin-top:0">' + nume + '</h2>' +
      capitole
        .map(
          (cap) =>
            '<div class="capitol"><h3><span class="nr">' + cap.nr + '.</span>' + esc(cap.titlu) + '</h3><ul class="lectii">' +
            cap.lectii
              .map((l, i) => {
                const grupa = l.grupa && l.grupa !== (cap.lectii[i - 1] || {}).grupa ? '<li class="grupa">' + esc(l.grupa) + '</li>' : '';
                return grupa + randLectie(l);
              })
              .join('') +
            (cap.test ? '<li><a href="test.html?id=' + encodeURIComponent(cap.test) + '"><b>Test de capitol</b></a></li>' : '') +
            '</ul></div>'
        )
        .join('') +
      '</div>'
    );

    function randLectie(l) {
      const intrare = curr.lectii[l.id];
      const st = Progres.stareLectie(l.id);
      if (!intrare || !intrare.fisier) {
        return '<li class="inactiv"><span>' + esc(l.titlu) + '</span><span class="stare mic">în curând</span></li>';
      }
      return (
        '<li><a href="lectie.html?id=' + encodeURIComponent(l.id) + '">' + esc(l.titlu) + '</a><span class="stare">' +
        (st && st.nota ? '<span class="eticheta ' + App.categorie((st.nota - 1) / 9) + '">' + App.nr(st.nota) + '</span>' : '') +
        '</span></li>'
      );
    }
  }

  async function randeaza() {
    App.antet('acasa');
    let curr;
    try {
      curr = await App.curriculum();
    } catch (e) {
      App.eroare(radacina, e.message);
      return;
    }
    radacina.innerHTML =
      htmlSalut() +
      htmlEvaluare(curr) +
      htmlRecapitulare(curr) +
      '<h2>Clasa a 7-a</h2><div class="coloane-7">' +
      htmlRamura('Algebră', curr.clasa7.algebra, curr) +
      htmlRamura('Geometrie', curr.clasa7.geometrie, curr) +
      '</div>' +
      (Progres.stocareDisponibila()
        ? ''
        : '<p class="alerta" style="margin-top:20px">Browserul nu permite salvarea progresului (poate ești în modul privat). Poți lucra, dar rezultatele nu vor fi păstrate.</p>') +
      '<p class="subsol mic">Progresul se păstrează doar pe acest dispozitiv. Din pagina <a href="progres.html">Progres</a> poți face o copie de siguranță.</p>';

    const f = $('#formPrenume');
    if (f) {
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        Progres.setPrenume(f.prenume.value);
        randeaza();
      });
    }
    App.math(radacina);
  }

  randeaza();
})();
