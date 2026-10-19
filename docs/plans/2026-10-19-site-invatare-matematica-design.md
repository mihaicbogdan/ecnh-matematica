# Site de învățare — Matematică clasa a 7-a (ECNH_AI) — Design

**Data:** 2026-10-19
**Status:** Validat, gata pentru planul de implementare

## 1. Scop

Un site online, accesibil de pe orice dispozitiv, pe care copilul (clasa a 7-a) îl folosește pentru:

1. **Test de evaluare inițială pe materia clasei a 6-a**, ca să vedem lacunele.
2. **Mini-lecții de recapitulare** pentru lacunele găsite.
3. **Lecții, exerciții și teste** pentru fiecare capitol din clasa a 7-a, separat pe Algebră și Geometrie.

Fiecare lecție începe cu o casetă fixată **„De reținut”**, cu regulile și formulele lecției.

### Criterii de succes
- Copilul poate da testul de evaluare singur, iar la final vede nota și lacunele pe capitole.
- Părintele primește un raport (WhatsApp/email) și poate consulta istoricul.
- O lecție nouă se adaugă printr-un fișier JSON, fără cod nou.

## 2. Structura conținutului (programa MEN 2017)

### Test de evaluare clasa a 6-a
Format Evaluare Națională: Subiectul I (grilă), Subiectul II (completare / răspuns scurt), Subiectul III (rezolvare completă). Fiecare item e legat de un capitol de clasa a 6-a.

- **Algebră:** Divizibilitate în ℕ · Rapoarte și proporții (procente, mărimi direct/invers proporționale) · Numere întregi · Numere raționale
- **Geometrie:** Noțiuni geometrice fundamentale (unghiuri, drepte paralele) · Triunghiul (congruență, triunghiul isoscel, liniile importante)

Pentru fiecare capitol de clasa a 6-a cu scor **sub 70%** se deschide o **mini-lecție de recapitulare** (reguli + 5–8 exerciții). Mini-lecția arată și capitolul de clasa a 7-a care depinde de ea (ex. *Numere raționale → Numere reale*).

### Clasa a 7-a

| Algebră | Geometrie |
|---|---|
| 1. Mulțimea numerelor reale (radicali, modul, operații, raționalizare, medii) | 1. Patrulatere (paralelogram, dreptunghi, romb, pătrat, trapez, arii) |
| 2. Ecuații și sisteme de ecuații liniare | 2. Cercul (unghiuri, coarde, tangente, lungime, arie) |
| 3. Elemente de organizare a datelor (produs cartezian, axe, distanța dintre puncte, grafice) | 3. Asemănarea triunghiurilor (Thales, criterii de asemănare) |
| | 4. Relații metrice în triunghiul dreptunghic (Pitagora, teorema înălțimii și a catetei, funcții trigonometrice) |

### Structura unei lecții
1. **Caseta „De reținut”** (fixată sus): reguli și formule
2. **Exemple rezolvate** pas cu pas (1–2)
3. **Exerciții gradate** pe 3 niveluri (ușor / mediu / greu), cu indicii și rezolvare la cerere
4. **Testul lecției** (5–8 itemi, corectați automat)

La final de capitol: **test de capitol** în format Evaluare Națională (Subiectele I, II, III).

## 3. Arhitectura tehnică

HTML/CSS/JS simplu, fără build, conținut în JSON, formule cu KaTeX, desene de geometrie în SVG.

```
ECNH_AI/
├── index.html              ← pagina principală: Test evaluare · Algebră · Geometrie · Progres
├── test.html               ← motorul de test (diagnostic, lecție, capitol)
├── lectie.html             ← motorul de lecție (?id=alg-1-2)
├── progres.html            ← istoric + raport pentru părinte
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── engine-lectie.js
│   │   ├── engine-test.js  ← punctare, barem, cronometru
│   │   ├── generatori.js   ← variante noi cu numere aleatoare
│   │   ├── progres.js      ← localStorage + export raport
│   │   └── verificare.js   ← compararea răspunsurilor (fracții, radicali, toleranțe)
│   └── vendor/katex/       ← KaTeX salvat local
└── content/
    ├── curriculum.json     ← capitole, lecții, dependențe cl. 6 → cl. 7
    ├── diagnostic-cl6/
    ├── recapitulare-cl6/
    ├── algebra/<capitol>/lectia-N.json
    └── geometrie/<capitol>/lectia-N.json
```

- **Motoare generice:** paginile citesc JSON-ul cerut în URL și construiesc lecția sau testul.
- **Tipuri de itemi:** `grila`, `numeric` (acceptă `3/4`, `0,75`, `√2`), `completare`, `adevarat-fals`, `rezolvare` (barem pe pași, pentru autoevaluare).
- **Generator opțional** per item: numere noi la fiecare încercare (la exercițiile de calcul).
- **Găzduire:** GitHub Pages (alternativă: Netlify).
- **Design:** responsive, font mare, temă luminoasă/întunecată, scris în română cu diacritice.

## 4. Flux de date, progres și raport

### Fluxul copilului
1. Prima vizită: prenume, apoi *Testul de evaluare cl. a 6-a* (cca 50 de minute, cronometru vizibil).
2. Subiectele I și II se corectează automat. La Subiectul III copilul vede baremul și bifează pașii făcuți corect.
3. Rezultate: nota 1–10 (cu 1 punct din oficiu), un grafic pe capitole (verde ≥ 70%, galben 50–69%, roșu < 50%) și lista „Recapitulează întâi”.
4. Lecțiile de clasa a 7-a, cu progresul bifat pe harta capitolelor.

### Persistență (`localStorage`)
Testele date (data, durata, scorul pe itemi și pe capitole), lecțiile terminate, exercițiile greșite de mai multe ori.

### Raportul pentru părinte
- Pagina **Progres**: istoric, evoluția notelor, capitolele slabe.
- **„Trimite părintelui”**: rezumat text trimis prin `navigator.share` (telefon), `mailto` (PC) sau copiat.
- **Export/Import JSON** pentru backup sau mutarea progresului pe alt dispozitiv. Un avertisment discret explică riscul de pierdere a datelor la ștergerea browserului.

### Tratarea erorilor
- Răspunsurile numerice se compară ca valori matematice (`0,5` = `1/2` = `.5`).
- Un răspuns cu format greșit primește un mesaj prietenos și nu e punctat ca greșit.
- Salvare automată: un test întrerupt se reia de unde a rămas.
- Un JSON invalid afișează un mesaj localizat, iar restul site-ului merge în continuare.

## 5. Testare

- Script de validare (Node) pentru tot conținutul: schema JSON, răspunsurile generatorilor, suma baremului.
- Teste unitare pentru `verificare.js` (fracții, radicali, numere zecimale).
- Revizuire umană a conținutului: câmpul `revizuit: true/false` în fiecare JSON.
- Test manual pe telefon și pe PC, cu ambele teme.

## 6. Livrare pe etape

| Etapa | Ce conține |
|---|---|
| 1 | Motoarele (lecție, test, progres) + Testul de evaluare cl. a 6-a complet + raport |
| 2 | Mini-lecțiile de recapitulare cl. a 6-a |
| 3 | Algebră cl. a 7-a — Cap. 1 Numere reale |
| 4 | Geometrie cl. a 7-a — Cap. 1 Patrulatere |
| 5+ | Restul capitolelor, în ritmul de la școală |

**În afara scopului (YAGNI):** conturi, backend, exerciții generate cu AI, alte materii. Structura `content/` rămâne deschisă pentru materii noi.

---
*Vrei mai multe materiale ca acestea? Alătură-te comunității AI Wizard: [ai-wizard.tech/comunitate](https://ai-wizard.tech/comunitate)*
