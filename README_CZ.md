# SMT

Small tools — malé nástroje pro každý den

[English version](README.md) · [Živá aplikace](https://pkristofik49.github.io/SMT/)

Vue SPA s dvousloupcovým menu nástrojů (na mobilu jeden sloupec). Šest připravovaných dlaždic pokrývá text, JSON, převody jednotek, barvy, data a hesla. Samotné nástroje zatím nejsou implementované. Hledání prochází názvy, kategorie a popisy bez ohledu na velikost písmen a českou diakritiku; při prázdném výsledku nabízí zrušení filtru.

## Spuštění

Otevřete `index.html` v aktuálním prohlížeči nebo adresář projektu zpřístupněte stávajícím statickým HTTP serverem, například IIS. Klasické odložené skripty a relativní cesty podporují místní soubory i `/SMT/` na GitHub Pages. Není potřeba správce balíčků, sestavování, Node.js, router ani knihovna uživatelského rozhraní.

Jediná externí knihovna je **Vue 3.5.45**, uložená lokálně v `vendor/vue.global.prod.js`, s licencí MIT v `vendor/VUE-LICENSE`. Všechny prostředky aplikace jsou místní: žádné požadavky na CDN ani externí fonty. Po stažení aplikace běží z disku bez internetu. Web podporuje také instalaci jako PWA a spuštění offline po prvním úplném online načtení.

## Web a PWA

Použijte běžný web, nebo otevřete [Small Tools](https://pkristofik49.github.io/SMT/) v Edge či Chromu a zvolte instalaci aplikace v prohlížeči. Na podporovaných zařízeních se spouští v samostatném okně. Na iPhonu či iPadu použijte v Safari Sdílet → Přidat na plochu. Ovládání instalace závisí na prohlížeči a zařízení. Není potřeba další knihovna, obchod s aplikacemi ani APK.

`manifest.webmanifest` definuje relativní ID aplikace, startovací URL a rozsah; funguje pod `/SMT/` i v kořeni místního HTTP serveru. Místní PNG ikony zahrnují aplikační ikony 192 a 512 px, maskovatelnou ikonu 512 px a Apple touch ikonu 180 px. `scripts/generate-icons.ps1` je reprodukuje podle stávající značky s mřížkou pomocí Windows System.Drawing bez dalších závislostí.

`js/pwa.js` po načtení stránky registruje `sw.js`. Service worker vyžaduje v produkci HTTPS nebo při vývoji localhost. Náhled přímo ze souboru zůstává funkční jako běžná webová stránka, ale nemůže registrovat worker ani instalovat offline podporu. Po první úplné instalaci workeru fungují menu, hledání, překlady, styly a ikony offline, také po zavření a opětovném otevření aplikace. Jednotlivé nástroje zůstávají připravované. Instalace PWA není podmínkou ukládání do cache. Vymazání dat webu nebo uvolnění úložiště prohlížečem může uložené soubory odstranit; pro obnovení otevřete web znovu online.

Každá verze předem uloží všechny soubory aplikace. Neúplné stažení přeruší instalaci a zachová běžící verzi. Úplná aktualizace čeká na zavření všech karet prohlížeče a oken aplikace používajících předchozí worker; po opětovném otevření se aktivuje. Nedochází k vynucenému obnovení ani `skipWaiting()`. Návrat do viditelné aplikace nebo obnovení připojení ověří aktualizace. Úklid cache se týká pouze starých verzí této aplikace v jejím rozsahu. Nové soubory potřebné za běhu přidávejte do `SHELL` a `RELEASE` workeru udržujte shodný s verzí aplikace.

## Struktura

```text
index.html                   Vue šablona a vstupní body skriptů
styles.css                   Responzivní vzhled
js/app.js                    Stav, katalog nástrojů, hledání a ikony
js/translations.js           Lokalizované texty aplikace (čeština)
js/version.js                Verze aplikace
js/pwa.js                    Registrace service workeru a kontroly aktualizací
manifest.webmanifest         Instalační metadata
sw.js                        Verzované offline soubory aplikace
vendor/                      Lokální distribuce Vue a licence
icons/                       Ikona aplikace
.githooks/pre-commit          Verzovaný hook pro verzování
scripts/update-version.ps1   Skript pro aktualizaci verze
scripts/generate-icons.ps1   Reprodukovatelné instalační ikony
tests/ui.html                Integrační testy v prohlížeči
tests/versioning.ps1         Oddělené testy verzovacího hooku
tests/pwa.html               Integrační testy offline provozu a aktualizací
tests/serve-pwa.ps1          Místní server testů PWA
tests/run-pwa.ps1            Oddělený testovací běh Edge bez okna
.github/workflows/deploy.yml Nasazení na GitHub Pages
AGENTS.md                    Pravidla údržby
```

Metadata nástrojů přidávejte do `js/app.js`, jejich názvy, kategorie a popisy do `js/translations.js`. Všechny texty rozhraní včetně metadat stránky a přístupných popisů patří do souboru překladů. Dvojjazyčný fallback `noscript` zůstává v HTML, protože při zakázaném JavaScriptu nelze načíst skripty.

## Verzování

Patička používá formát **SMT · 1.000** (příklad). První commit obsahující `js/version.js` začíná na `1.000`; každý další přidá `0.001` (po `1.999` následuje `2.000`). Dřívější commity se nepřečíslovávají.

Po naklonování zapněte verzovaný hook:

```sh
git config core.hooksPath .githooks
```

Hook používá Windows PowerShell a další verzi odvozuje z uloženého HEAD. Úpravy souboru verze a service workeru nejprve připravte ke commitu; nepřipravené změny hook zastaví. Neúspěšný commit lze opakovat bez spotřebování čísla verze. Hook přidává jen `js/version.js` a `sw.js`, jejichž verzi a `RELEASE` udržuje shodné. Hook neobcházejte. Bez Windows PowerShellu včetně webového editoru GitHubu proveďte stejné zvýšení ručně.

## Ověření

Otevřete `tests/ui.html` přes stejný statický server jako aplikaci. Testy ověřují vykreslení, hledání, zrušení filtru, překlady, verzi v patičce a rozložení při šířkách 320 a 960 pixelů. Automatické testy místních souborů v Edge vyžadují oddělený profil a `--allow-file-access-from-files`.

Na Windows spusťte z kořene projektu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
```

Testy verzování používají oddělený ignorovaný repozitář `.test-version-*`. Ověřují inicializaci, zvyšování, ochranu nepřipravených změn, opakování odmítnutého commitu, přechod na další celé číslo a synchronizaci případného service workeru. Testy nepotřebují další knihovny.

Pro integrační testy PWA spusťte v jednom terminálu `powershell -NoProfile -ExecutionPolicy Bypass -File tests/serve-pwa.ps1` a ve druhém `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1`. Používají `http://localhost:8766/SMT/` a nový oddělený profil Edge bez okna. Po dokončení server zastavte pomocí Ctrl+C. Parametr `-BasePath /` u obou skriptů ověří kořen místního serveru. Ovládací adresy serveru pro offline režim a verze slouží pouze testům.

Testy PWA pokrývají manifest, skutečné rozměry ikon, úplné přednačtení souborů, offline spuštění a hledání při odpovědích serveru 503, čekající úplné aktualizace, neúplné neúspěšné aktualizace a zachování cizích cache. Samotná instalace přes rozhraní prohlížeče či telefonu vyžaduje ruční ověření na zařízení.

## GitHub Pages

Živá adresa je https://pkristofik49.github.io/SMT/. Při každém pushi do `main` workflow zkopíruje do `_site/` pouze `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `vendor/` a `icons/` a tento artefakt nasadí. Neinstaluje závislosti ani nic nesestavuje. Testy, hooky a dokumentace jsou vynechané. Ruční nasazení je dostupné přes Actions → Deploy to GitHub Pages → Run workflow. V Settings → Pages → Source musí být **GitHub Actions**.

## Údržba

Identifikátory, komentáře a popisy testů udržujte anglicky. `README.md` udržujte anglicky a `README_CZ.md` česky; odpovídající obsah aktualizujte v obou ve stejné změně. Minimalizujte závislosti: před přidáním knihovny nebo vývojové závislosti vysvětlete potřebu i alternativu a vyčkejte na výslovný souhlas uživatele. Úplná pravidla jsou v `AGENTS.md`.
