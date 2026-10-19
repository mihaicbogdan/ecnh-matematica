// Validează tot conținutul — rulează: node tools/valideaza.js
// Verifică: fișierele din curriculum există și sunt JSON valid, câmpurile obligatorii,
// grilele au răspunsul corect în listă, baremul se adună la punctaj,
// generatorii produc răspunsuri numerice valide (200 de variante fiecare).
'use strict';
const fs = require('fs');
const path = require('path');
const V = require('../assets/js/verificare.js');
const G = require('../assets/js/generatori.js');

const RAD = path.join(__dirname, '..');
const erori = [];
const avertismente = [];
const err = (loc, m) => erori.push(loc + ': ' + m);

function citeste(rel) {
  const p = path.join(RAD, rel);
  if (!fs.existsSync(p)) {
    err(rel, 'fișierul lipsește');
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    err(rel, 'JSON invalid: ' + e.message);
    return null;
  }
}

function verificaItem(item, loc, cuPuncte) {
  const l = loc + ' ' + (item.id || '?');
  if (!item.id) err(l, 'lipsește id');
  if (!item.enunt) err(l, 'lipsește enunt');
  if (cuPuncte && !(item.puncte > 0)) err(l, 'lipsește puncte');
  const tipuri = ['grila', 'numeric', 'completare', 'adevarat-fals', 'rezolvare'];
  if (!tipuri.includes(item.tip)) return err(l, 'tip necunoscut „' + item.tip + '”');

  if (item.tip === 'grila') {
    if (!Array.isArray(item.variante) || item.variante.length < 2) err(l, 'grila are nevoie de minim 2 variante');
    else if (!(item.corect >= 0 && item.corect < item.variante.length)) err(l, 'corect în afara variantelor');
    if (new Set(item.variante).size !== (item.variante || []).length) err(l, 'variante duplicate');
  }
  if (item.tip === 'adevarat-fals' && typeof item.corect !== 'boolean') err(l, 'corect trebuie să fie true/false');
  if (item.tip === 'rezolvare') {
    if (!Array.isArray(item.barem) || !item.barem.length) err(l, 'lipsește baremul');
    else {
      const s = item.barem.reduce((x, p) => x + p.puncte, 0);
      if (s !== item.puncte) err(l, 'baremul însumează ' + s + 'p, dar itemul are ' + item.puncte + 'p');
    }
    if (!item.rezolvare) err(l, 'lipsește rezolvarea completă');
  }
  if ((item.tip === 'numeric' || item.tip === 'completare') && item.raspuns === undefined) err(l, 'lipsește raspuns');

  const variante = item.generator ? 200 : 1;
  for (let s = 1; s <= variante; s++) {
    let x;
    try {
      x = G.aplica(item, s * 7919);
    } catch (e) {
      return err(l, 'generator: ' + e.message);
    }
    const text = JSON.stringify(x);
    const m = text.match(/\{\{\w+\}\}/);
    if (m) return err(l, 'variabilă neînlocuită ' + m[0]);
    if (x.tip === 'numeric') {
      const rs = Array.isArray(x.raspuns) ? x.raspuns : [x.raspuns];
      for (const r of rs) {
        if (Number.isNaN(V.evalueaza(r))) return err(l, 'răspunsul „' + r + '” nu e un număr valid' + (item.generator ? ' (sămânța ' + s + ')' : ''));
        if (V.verifica(x, r).stare !== 'corect') return err(l, 'propriul răspuns „' + r + '” nu trece verificarea');
      }
    }
  }
  if (!item.rezolvare) avertismente.push(l + ': fără rezolvare');
}

const curr = citeste('content/curriculum.json');
if (!curr) {
  console.error(erori.join('\n'));
  process.exit(1);
}

let nrFisiere = 0;
let nrItemi = 0;

for (const [id, t] of Object.entries(curr.teste)) {
  const T = citeste(t.fisier);
  if (!T) continue;
  nrFisiere++;
  if (T.id !== id) err(t.fisier, 'id „' + T.id + '” diferit de cheia din curriculum „' + id + '”');
  const ids = new Set();
  let total = 0;
  for (const sub of T.subiecte) {
    let ts = 0;
    for (const item of sub.itemi) {
      if (ids.has(item.id)) err(t.fisier, 'id duplicat ' + item.id);
      ids.add(item.id);
      if (!item.capitol) err(t.fisier + ' ' + item.id, 'lipsește capitol');
      verificaItem(item, t.fisier, true);
      ts += item.puncte;
      nrItemi++;
    }
    total += ts;
  }
  if (T.tip === 'evaluare' && total !== 90) err(t.fisier, 'total ' + total + 'p (format Evaluare Națională: 90p + 10 din oficiu)');
  if (!T.revizuit) avertismente.push(t.fisier + ': nerevizuit');
}

for (const [id, l] of Object.entries(curr.lectii)) {
  if (!l.fisier) continue;
  const L = citeste(l.fisier);
  if (!L) continue;
  nrFisiere++;
  if (L.id !== id) err(l.fisier, 'id „' + L.id + '” diferit de cheia din curriculum „' + id + '”');
  if (!Array.isArray(L.deRetinut) || !L.deRetinut.length) err(l.fisier, 'lipsește caseta „De reținut”');
  if (!Array.isArray(L.exercitii) || !L.exercitii.length) err(l.fisier, 'lipsesc exercițiile');
  const ids = new Set();
  for (const ex of L.exercitii || []) {
    if (ids.has(ex.id)) err(l.fisier, 'id duplicat ' + ex.id);
    ids.add(ex.id);
    if (![1, 2, 3].includes(ex.nivel)) err(l.fisier + ' ' + ex.id, 'nivel trebuie să fie 1, 2 sau 3');
    if (ex.tip === 'rezolvare') err(l.fisier + ' ' + ex.id, 'exercițiile de lecție trebuie să fie auto-corectabile');
    verificaItem(ex, l.fisier, false);
    nrItemi++;
  }
  for (const it of (L.test && L.test.itemi) || []) {
    if (it.tip === 'rezolvare') err(l.fisier + ' ' + it.id, 'testul lecției trebuie să fie auto-corectabil');
    verificaItem(it, l.fisier + ' test', false);
    nrItemi++;
  }
  if (!L.revizuit) avertismente.push(l.fisier + ': nerevizuit');
}

for (const c of curr.capitoleCl6) {
  if (c.recapitulare && !curr.lectii[c.recapitulare]) err('curriculum', c.id + ' trimite la recapitularea inexistentă ' + c.recapitulare);
}

// acoperire: fiecare subcapitol din manualul de clasa a 6-a are cel puțin un item în evaluarea inițială
const acoperire = {};
for (const id of curr.evaluareInitiala || []) {
  const T = curr.teste[id] && citeste(curr.teste[id].fisier);
  if (!T) continue;
  for (const sub of T.subiecte) for (const it of sub.itemi) (acoperire[it.capitol] = acoperire[it.capitol] || []).push(id.replace('diagnostic-cl6-', '') + ' ' + it.id);
}
const idsCl6 = new Set(curr.capitoleCl6.map((c) => c.id));
for (const c of curr.capitoleCl6) {
  if (!acoperire[c.id]) err('acoperire', 'subcapitolul ' + c.titlu + ' nu are niciun item în evaluarea inițială');
}
for (const cap of Object.keys(acoperire)) if (!idsCl6.has(cap)) err('acoperire', 'capitol necunoscut ' + cap + ' (' + acoperire[cap].join(', ') + ')');
console.log('Acoperire manual cl. 6:\n  ' + curr.capitoleCl6.map((c) => c.titlu + ' → ' + (acoperire[c.id] || ['—']).join(', ')).join('\n  '));

if (avertismente.length) console.log('Avertismente:\n  ' + avertismente.join('\n  '));
if (erori.length) {
  console.error('\n✗ ' + erori.length + ' erori:\n  ' + erori.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Conținut valid: ' + nrFisiere + ' fișiere, ' + nrItemi + ' itemi.');
