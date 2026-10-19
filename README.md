# ECNH Matematică — clasa a 7-a

Site de învățare: evaluare inițială pe materia clasei a 6-a, recapitulare pe lacune, apoi lecții și teste pentru clasa a 7-a (Algebră + Geometrie). HTML/JS simplu, fără build. Designul complet: [`docs/plans/2026-10-19-site-invatare-matematica-design.md`](docs/plans/2026-10-19-site-invatare-matematica-design.md).

## Pornire locală

Paginile încarcă fișierele JSON prin `fetch`, deci trebuie un server (nu merge prin dublu-click pe `index.html`):

```bash
python -m http.server 8765
# apoi deschide http://localhost:8765
```

## Verificări înainte de a publica

```bash
npm test          # testele pentru compararea răspunsurilor (fracții, radicali, periodice)
npm run valideaza # verifică tot conținutul: JSON, barem, grile, generatori
```

## Publicare pe GitHub Pages

Site-ul: **https://mihaicbogdan.github.io/ecnh-matematica/**. Repository-ul este https://github.com/mihaicbogdan/ecnh-matematica.

Pages publică ramura `main` (root). Orice `git push` pe `main` actualizează site-ul în 1–2 minute.

## Cum adaugi o lecție

1. Creează fișierul JSON, de exemplu `content/algebra/alg-1-1.json`. Poți porni de la `content/recapitulare-cl6/numere-rationale.json`.
2. Adaugă-l în `content/curriculum.json` → `lectii`:
   ```json
   "alg-1-1": { "titlu": "Rădăcina pătrată a unui pătrat perfect", "fisier": "content/algebra/alg-1-1.json" }
   ```
   Lecția apare automat pe pagina principală, la capitolul ei.
3. Rulează `npm run valideaza`.
4. Revizuiește conținutul matematic, apoi pune `"revizuit": true`.

### Structura unei lecții

| Câmp | Ce conține |
|---|---|
| `deRetinut` | Lista regulilor, afișată sus și în butonul flotant „📌 De reținut” |
| `exemple` | `{ enunt, pasi[] }`: pașii se dezvăluie pe rând |
| `exercitii` | Itemi cu `nivel` 1/2/3, `indiciu`, `rezolvare` |
| `test` | `{ itemi[] }`, corectați automat, cu notă |

### Tipuri de itemi

| `tip` | Câmpuri |
|---|---|
| `grila` | `variante[]`, `corect` (indexul variantei corecte, de la 0) |
| `numeric` | `raspuns` (ex. `"3/4"`, `"2√3"`, `"0,(3)"`), opțional `raspunsAfisat`, `unitate`, `ireductibila` |
| `completare` | `raspuns` (text sau listă de variante acceptate) |
| `adevarat-fals` | `corect`: `true` / `false` |
| `rezolvare` | `barem[]` cu `{ pas, puncte }` + `rezolvare` (doar în teste: autoevaluare) |

Formulele se scriu în LaTeX între `$…$`. În JSON, backslash-ul se dublează: `\\dfrac{1}{2}`.

### Variante generate

```json
"generator": {
  "variabile": { "a": { "min": 2, "max": 9 }, "b": { "din": [4, 6, 8] } },
  "conditie": "a < b",
  "calcule": { "r": "cmmmc(a, b)", "t": "frTex(a, b)" }
},
"enunt": "Calculează $[{{a}}, {{b}}]$.",
"raspuns": "{{r}}"
```

Funcții disponibile: `cmmdc`, `cmmmc`, `fr(n, d)` (fracție simplificată ca text), `frTex(n, d)` (fracție în LaTeX), `par(x)`, `sgn(x)`, `abs`, `Math`.

## Progres și date

Progresul se salvează în `localStorage`, doar pe dispozitivul copilului. Din pagina **Progres** se poate descărca și încărca o copie JSON, de exemplu pentru mutarea pe alt dispozitiv.

---
*Vrei mai multe materiale ca acestea? Alătură-te comunității AI Wizard: [ai-wizard.tech/comunitate](https://ai-wizard.tech/comunitate)*
