/* Progresul copilului, salvat în localStorage pe dispozitivul lui.
   Toate citirile/scrierile sunt protejate: dacă browserul blochează stocarea,
   site-ul merge mai departe, doar fără memorie. */
(function (root) {
  'use strict';

  const CHEIE = 'ecnh.v1';
  let cache = null;
  let stocareOk = true;

  function gol() {
    return { versiune: 1, profil: { prenume: '' }, rezultate: [], lectii: {}, greseli: {}, ciorne: {} };
  }

  function date() {
    if (cache) return cache;
    try {
      const t = localStorage.getItem(CHEIE);
      cache = t ? Object.assign(gol(), JSON.parse(t)) : gol();
    } catch (e) {
      stocareOk = false;
      cache = gol();
    }
    return cache;
  }

  function salveaza() {
    try {
      localStorage.setItem(CHEIE, JSON.stringify(date()));
      return true;
    } catch (e) {
      stocareOk = false;
      return false;
    }
  }

  const Progres = {
    stocareDisponibila: () => (date(), stocareOk),
    date,

    prenume: () => date().profil.prenume || '',
    setPrenume(n) {
      date().profil.prenume = String(n || '').trim().slice(0, 40);
      salveaza();
    },

    adaugaRezultat(r) {
      date().rezultate.push(r);
      salveaza();
    },
    rezultate(testId) {
      const toate = date().rezultate.slice().sort((a, b) => (a.data < b.data ? 1 : -1));
      return testId ? toate.filter((r) => r.testId === testId) : toate;
    },
    rezultat: (id) => date().rezultate.find((r) => r.id === id) || null,
    ultimRezultat(testId) {
      return Progres.rezultate(testId)[0] || null;
    },

    ciorna: (testId) => date().ciorne[testId] || null,
    salveazaCiorna(testId, c) {
      date().ciorne[testId] = c;
      salveaza();
    },
    stergeCiorna(testId) {
      delete date().ciorne[testId];
      salveaza();
    },

    stareLectie: (id) => date().lectii[id] || null,
    actualizeazaLectie(id, modificari) {
      const d = date();
      d.lectii[id] = Object.assign({ exercitiiCorecte: [] }, d.lectii[id], modificari);
      salveaza();
      return d.lectii[id];
    },
    exercitiuCorect(lectieId, itemId) {
      const l = Progres.actualizeazaLectie(lectieId, {});
      if (!l.exercitiiCorecte.includes(itemId)) l.exercitiiCorecte.push(itemId);
      salveaza();
    },

    noteazaGreseala(cheie) {
      const g = date().greseli;
      g[cheie] = (g[cheie] || 0) + 1;
      salveaza();
    },
    greseliRepetate(min = 2) {
      return Object.entries(date().greseli)
        .filter(([, n]) => n >= min)
        .sort((a, b) => b[1] - a[1]);
    },

    exporta() {
      return JSON.stringify(Object.assign({}, date(), { exportatLa: new Date().toISOString() }), null, 2);
    },
    importa(text) {
      const d = JSON.parse(text);
      if (!d || d.versiune !== 1 || !Array.isArray(d.rezultate)) {
        throw new Error('Fișierul nu pare un export ECNH valid.');
      }
      delete d.exportatLa;
      cache = Object.assign(gol(), d);
      salveaza();
    },
    reseteaza() {
      cache = gol();
      salveaza();
    },
  };

  root.Progres = Progres;
})(typeof globalThis !== 'undefined' ? globalThis : this);
