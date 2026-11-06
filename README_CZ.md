# SMT

Small tools — malé nástroje pro každý den

[English version](README.md) · [Živá aplikace](https://pkristofik49.github.io/SMT/)

Vue SPA s dvousloupcovým menu nástrojů (na mobilu jeden sloupec). Šest připravovaných dlaždic pokrývá text, JSON, převody jednotek, barvy, data a hesla. Samotné nástroje zatím nejsou implementované. Hledání prochází názvy, kategorie a popisy bez ohledu na velikost písmen a českou diakritiku; při prázdném výsledku nabízí zrušení filtru.

## Spuštění

Otevřete `index.html` v aktuálním prohlížeči nebo adresář projektu zpřístupněte stávajícím statickým HTTP serverem, například IIS. Klasické odložené skripty a relativní cesty podporují místní soubory i `/SMT/` na GitHub Pages. Není potřeba správce balíčků, sestavování, Node.js, router ani knihovna uživatelského rozhraní.

Jediná externí knihovna je **Vue 3.5.45**, uložená lokálně v `vendor/vue.global.prod.js`, s licencí MIT v `vendor/VUE-LICENSE`. Všechny prostředky aplikace jsou místní: žádné požadavky na CDN ani externí fonty. Po stažení aplikace běží z disku bez internetu. Ukládání přes service worker ani instalace PWA nejsou implementované.

## Struktura

```text
index.html                   Vue šablona a vstupní body skriptů
styles.css                   Responzivní vzhled
js/app.js                    Stav, katalog nástrojů, hledání a ikony
js/translations.js           Lokalizované texty aplikace (čeština)
js/version.js                Verze aplikace
vendor/                      Lokální distribuce Vue a licence
icons/                       Ikona aplikace
.githooks/pre-commit          Verzovaný hook pro verzování
scripts/update-version.ps1   Skript pro aktualizaci verze
tests/ui.html                Integrační testy v prohlížeči
tests/versioning.ps1         Oddělené testy verzovacího hooku
.github/workflows/deploy.yml Nasazení na GitHub Pages
AGENTS.md                    Pravidla údržby
```

Metadata nástrojů přidávejte do `js/app.js`, jejich názvy, kategorie a popisy do `js/translations.js`. Všechny texty rozhraní včetně metadat stránky a přístupných popisů patří do souboru překladů. Dvojjazyčný fallback `noscript` zůstává v HTML, protože při zakázaném JavaScriptu nelze načíst skripty.

## Verzování

Patička zobrazuje **SMT · 1.000**. První commit obsahující `js/version.js` začíná na `1.000`; každý další přidá `0.001` (po `1.999` následuje `2.000`). Dřívější commity se nepřečíslovávají.

Po naklonování zapněte verzovaný hook:

```sh
git config core.hooksPath .githooks
```

Hook používá Windows PowerShell a další verzi odvozuje z uloženého HEAD. Úpravy souboru verze nejprve připravte ke commitu; nepřipravené změny hook zastaví. Neúspěšný commit lze opakovat bez spotřebování čísla verze. Hook přidává jen `js/version.js` a případný budoucí `sw.js`, jehož `RELEASE` udržuje shodný. Hook neobcházejte. Bez Windows PowerShellu včetně webového editoru GitHubu proveďte stejné zvýšení ručně.

## Ověření

Otevřete `tests/ui.html` přes stejný statický server jako aplikaci. Testy ověřují vykreslení, hledání, zrušení filtru, překlady, verzi v patičce a rozložení při šířkách 320 a 960 pixelů. Automatické testy místních souborů v Edge vyžadují oddělený profil a `--allow-file-access-from-files`.

Na Windows spusťte z kořene projektu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
```

Testy verzování používají oddělený ignorovaný repozitář `.test-version-*`. Ověřují inicializaci, zvyšování, ochranu nepřipravených změn, opakování odmítnutého commitu, přechod na další celé číslo a synchronizaci případného service workeru. Testy nepotřebují další knihovny.

## GitHub Pages

Živá adresa je https://pkristofik49.github.io/SMT/. Při každém pushi do `main` workflow zkopíruje do `_site/` pouze `index.html`, `styles.css`, `js/`, `vendor/` a `icons/` a tento artefakt nasadí. Neinstaluje závislosti ani nic nesestavuje. Testy, hooky a dokumentace jsou vynechané. Ruční nasazení je dostupné přes Actions → Deploy to GitHub Pages → Run workflow. V Settings → Pages → Source musí být **GitHub Actions**.

## Údržba

Identifikátory, komentáře a popisy testů udržujte anglicky. `README.md` udržujte anglicky a `README_CZ.md` česky; odpovídající obsah aktualizujte v obou ve stejné změně. Minimalizujte závislosti: před přidáním knihovny nebo vývojové závislosti vysvětlete potřebu i alternativu a vyčkejte na výslovný souhlas uživatele. Úplná pravidla jsou v `AGENTS.md`.
