// Teste pentru assets/js/verificare.js — rulează: node tools/test-verificare.js
'use strict';
const V = require('../assets/js/verificare.js');

let ok = 0;
let esec = 0;
function egal(text, asteptat) {
  const v = V.evalueaza(text);
  const bine = Number.isNaN(asteptat) ? Number.isNaN(v) : V.egale(v, asteptat);
  if (bine) ok++;
  else {
    esec++;
    console.error('✗ evalueaza(' + JSON.stringify(text) + ') = ' + v + ', așteptat ' + asteptat);
  }
}
function stare(item, raspuns, asteptat) {
  const r = V.verifica(item, raspuns).stare;
  if (r === asteptat) ok++;
  else {
    esec++;
    console.error('✗ verifica(' + JSON.stringify(item) + ', ' + JSON.stringify(raspuns) + ') = ' + r + ', așteptat ' + asteptat);
  }
}

// numere și formate
egal('12', 12);
egal('-3', -3);
egal('−3', -3);
egal('0,75', 0.75);
egal('0.75', 0.75);
egal('.5', 0.5);
egal(' 3 / 4 ', 0.75);
egal('-3/4', -0.75);
egal('6:8', 0.75);
egal('2·3', 6);
egal('2×3', 6);
egal('2^3', 8);
egal('(-2)^3', -8);
egal('-2^2', -4);
egal('1/2+1/3', 5 / 6);
egal('(1/2+1/3):5/6', 1);
egal('3/4:9/8', 2 / 3);
egal('12:2:3', 2);
// periodice
egal('0,(3)', 1 / 3);
egal('0,1(6)', 1 / 6);
egal('1,2(36)', 1.2 + 36 / 990); // 1,2363636…
egal('-0,(6)', -2 / 3);
// radicali
egal('√2', Math.SQRT2);
egal('2√3', 2 * Math.sqrt(3));
egal('sqrt(8)', 2 * Math.SQRT2);
egal('√(9)', 3);
egal('3√2/2', (3 * Math.SQRT2) / 2);
// invalide
egal('abc', NaN);
egal('', NaN);
egal('2+', NaN);
egal('(2', NaN);
egal('1/0', NaN);
egal('√-4', NaN);

// verificare item numeric
const it = { tip: 'numeric', raspuns: '11/12' };
stare(it, '11/12', 'corect');
stare(it, '22/24', 'corect');
stare(it, '0,91(6)', 'corect');
stare(it, '0,91', 'gresit');
stare(it, 'unsprezece', 'invalid');
stare(it, '', 'gol');
stare({ tip: 'numeric', raspuns: '1/6', ireductibila: true }, '2/12', 'gresit');
stare({ tip: 'numeric', raspuns: '1/6', ireductibila: true }, '1/6', 'corect');
stare({ tip: 'numeric', raspuns: ['45', '45.0'] }, '45', 'corect');
const rad = { tip: 'numeric', raspuns: '3√2', formaSimplificata: true };
stare(rad, '3√2', 'corect');
stare(rad, '3sqrt(2)', 'corect');
stare(rad, '√18', 'gresit');
stare({ tip: 'numeric', raspuns: '6√6', formaSimplificata: true }, '2√54', 'gresit');
stare({ tip: 'numeric', raspuns: '6√6', formaSimplificata: true }, '6√6', 'corect');
// grilă / A-F / completare
stare({ tip: 'grila', corect: 1 }, '1', 'corect');
stare({ tip: 'grila', corect: 1 }, '2', 'gresit');
stare({ tip: 'adevarat-fals', corect: true }, 'true', 'corect');
stare({ tip: 'adevarat-fals', corect: true }, 'false', 'gresit');
stare({ tip: 'completare', raspuns: ['isoscel'] }, 'Isoscel', 'corect');
stare({ tip: 'completare', raspuns: ['echilateral'] }, 'echilateral ', 'corect');
stare({ tip: 'completare', raspuns: ['unghi obtuz'] }, 'unghi  obtuz', 'corect');
stare({ tip: 'completare', raspuns: ['bisectoare'] }, 'mediana', 'gresit');

console.log((esec ? '✗ ' : '✓ ') + ok + ' trecute, ' + esec + ' eșuate');
process.exit(esec ? 1 : 0);
