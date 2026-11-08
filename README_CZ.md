# SMT

Small tools — malé nástroje pro každý den

[English version](README.md) · [Živá aplikace](https://pkristofik49.github.io/SMT/)

Vue SPA s dvousloupcovým menu nástrojů (na mobilu jeden sloupec). Prvními čtyřmi funkčními nástroji jsou čtečka QR kódů, místní prohlížeč PDF, kompas a vodováha; šest připravovaných dlaždic pokrývá text, JSON, převody jednotek, barvy, data a hesla. Hledání prochází názvy, kategorie a popisy bez ohledu na velikost písmen a českou diakritiku; při prázdném výsledku nabízí zrušení filtru.

## Čtečka QR kódů

Otevřete první dlaždici nebo `#/qr-reader`, zvolte **Spustit kameru** a povolte přístup. Aplikace požádá o zadní kameru bez přístupu k mikrofonu. Po načtení prvního QR kódu kameru zastaví a zobrazí přesný dekódovaný text včetně zalomení řádků. Výsledek se vykreslí jako text; HTML se nespouští a odkazy se automaticky neotevírají. Stejným tlačítkem zahájíte další načítání. Obraz ani výsledek se nikam neodesílají ani neukládají do úložiště prohlížeče.

Pokud celý dekódovaný obsah tvoří platná absolutní HTTP nebo HTTPS adresa, lze na ni kliknout a otevřít ji v nové kartě prohlížeče. K otevření dojde až po kliknutí. Okrajové mezery se pro cílovou adresu ignorují, původní obsah zůstává viditelný. Ostatní text a schémata adres zůstávají prostým textem.

**Vybrat fotku** otevře výběr obrázku ze zařízení. Vybraný obrázek se přečte lokálně stejným nativním detektorem bez žádosti o přístup ke kameře. Výběr fotky zastaví případnou běžící kameru. Zobrazí se první nalezený QR kód se stejnou podporou klikacích URL. Chybějící QR kód i nečitelný nebo nepodporovaný formát obrázku mají lokalizované zprávy. Stejný soubor lze vybrat opakovaně; zrušení výběru ponechá aktuální výsledek. Načítání lze zrušit a dočasné URL obrázků se uvolní po dokončení, zrušení nebo odchodu ze čtečky. Čtení fotek funguje i bez dostupného rozhraní kamery, pokud prohlížeč podporuje nativní detekci QR. Nepoužívá se další knihovna ani odesílání na server.

Implementace používá pouze nativní `BarcodeDetector` s formátem `qr_code` a `getUserMedia`. Podpora se ověří před žádostí o kameru. Mezi podporované prohlížeče patří Chrome na Androidu; Safari na iPhonu zatím podporované není a zobrazí vysvětlení. Kamera vyžaduje HTTPS nebo localhost; náhled přímo ze souboru zobrazí upozornění. Odmítnutí přístupu, chybějící či obsazená kamera a přerušený stream mají lokalizované zprávy. Zastavení, návrat do menu, skrytí stránky i její opuštění kameru uvolní, včetně přístupu uděleného až po zrušení. Funguje tlačítko Zpět v prohlížeči i přímé odkazy s hashem.

Čtečka je součástí cache PWA a po prvním úplném online načtení se otevře offline. Podpora kamery a dekódování stále závisí na prohlížeči a zařízení. Žádná knihovna pro dekódování QR nebyla přidaná.

## Prohlížeč PDF

Otevřete druhou dlaždici nebo `#/pdf-viewer` a zvolte **Vybrat PDF**. Dokument zůstává v zařízení a zobrazuje se vestavěným prohlížečem PDF bez další knihovny či odesílání na server. K dispozici je název souboru, odkaz pro otevření v nové kartě a odkaz ke stažení. Pokud je vložené zobrazení PDF vypnuté nebo nepodporované, použijte tyto odkazy pro otevření v prohlížeči nebo PDF aplikaci zařízení. Listování, přiblížení, výzvy k zadání hesla a vykreslení závisejí na nativním prohlížeči; fyzický telefon je ještě potřeba ověřit.

Aplikace ověřuje hlavičku PDF v prvních 1024 bajtech; tím rozpozná formát, ale neověřuje celý dokument. Neplatný výběr zobrazí chybu a zachová předchozí dokument. Stejný soubor lze vybrat znovu, zrušení výběru ponechá aktuální dokument a zavření nebo opuštění nástroje uvolní jeho dočasnou URL. Soubory se neukládají do cache PWA ani úložiště prohlížeče a po obnovení stránky je potřeba je vybrat znovu. Samotný nástroj se ukládá pro offline použití.

## Kompas

Otevřete třetí dlaždici nebo `#/compass` a zvolte **Spustit kompas**. Telefon držte vodorovně displejem vzhůru. Kompas zobrazuje azimut horní hrany aktuální obrazovky a osm pojmenovaných hlavních a vedlejších světových stran. Ciferník se otáčí k severu se zohledněním otočení obrazovky. Aplikace používá nativní orientační události bez další knihovny a bez žádosti o polohu; údaje senzorů se nikam neodesílají ani neukládají.

Přístup k senzorům začíná až po kliknutí. Prohlížeče poskytující `DeviceOrientationEvent.requestPermission` jsou požádány o absolutní orientaci včetně přístupu k magnetometru, kde je podporovaný. Safari využívá `webkitCompassHeading`; ostatní prohlížeče musí poskytnout absolutní orientační úhly. Relativní úhly gyroskopu nikdy nenahrazují směr vůči severu. Vyžaduje se HTTPS nebo localhost a kompatibilní zařízení s odpovídajícími senzory. Při chybějících absolutních údajích se po osmi sekundách zobrazí možnost opakování. Nízká přesnost kompasu Safari a nakloněný telefon zobrazují pokyny ke kalibraci nebo srovnání místo azimutu. Obsluha senzorů se odpojí při zastavení, navigaci a skrytí aplikace; pokračování vyžaduje nové spuštění.

Kompas funguje v uložené offline PWA, pokud zařízení a prohlížeč podporují potřebné senzory. Přesnost i reference severu (magnetický nebo skutečný) závisejí na zařízení; aplikace nepočítá magnetickou deklinaci. Blízké kovy a magnety mohou měření rušit. Fyzické ověření na Androidu a iPhonu je ještě potřeba.

## Vodováha

Otevřete čtvrtou dlaždici nebo `#/level`, zvolte **Spustit vodováhu** a položte telefon displejem vzhůru na plochu. Nativní orientační senzory poskytují dva úhly náklonu v souřadnicích obrazovky, zobrazené na jedno desetinné místo, a bublinu pohybující se k vyšší hraně. Zelená bublina značí odchylku obou os nejvýše 0,5 stupně od reference. Bublina dosáhne kruhového limitu pohybu při celkovém náklonu 10 stupňů; číselné úhly dál zobrazují i větší náklony. Téměř svislá poloha a telefon displejem dolů zobrazují pokyny k položení místo zavádějící roviny.

**Nastavit nulu** použije aktuální plochu jako referenci; kalibrujte na známé rovné ploše. **Zrušit kalibraci** obnoví referenci zařízení. Kalibrace zůstává při zastavení a opětovném spuštění uvnitř nástroje, přepočítává se s otočením obrazovky a při opuštění nástroje se zahodí. Oprávnění pro nativní orientační senzory se vyžaduje až po kliknutí bez žádosti o absolutní orientaci či magnetometr. Relativní orientace stačí; směr k severu ani poloha nejsou potřeba. Zastavení, opuštění nebo skrytí stránky odpojí posluchače a vymaže údaje. Čekání na chybějící data skončí po osmi sekundách; nedostupná rozhraní a odmítnuté oprávnění mají vysvětlující zprávy.

Nástroj funguje v uložené offline PWA na podporovaných telefonech přes HTTPS nebo localhost, bez další knihovny a odesílání dat. Přesnost mohou ovlivnit senzory, pouzdro telefonu a nerovnosti jeho zadní strany. Programové testy používají simulované senzory; přesnost fyzického zařízení je ještě potřeba ověřit.

## Spuštění

Otevřete `index.html` v aktuálním prohlížeči nebo adresář projektu zpřístupněte stávajícím statickým HTTP serverem, například IIS. Klasické odložené skripty a relativní cesty podporují místní soubory i `/SMT/` na GitHub Pages. Není potřeba správce balíčků, sestavování, Node.js, router ani knihovna uživatelského rozhraní.

Jediná externí knihovna je **Vue 3.5.45**, uložená lokálně v `vendor/vue.global.prod.js`, s licencí MIT v `vendor/VUE-LICENSE`. Všechny prostředky aplikace jsou místní: žádné požadavky na CDN ani externí fonty. Po stažení aplikace běží z disku bez internetu. Web podporuje také instalaci jako PWA a spuštění offline po prvním úplném online načtení.

## Web a PWA

Použijte běžný web, nebo otevřete [Small Tools](https://pkristofik49.github.io/SMT/) v Edge či Chromu a zvolte instalaci aplikace v prohlížeči. Na podporovaných zařízeních se spouští v samostatném okně. Na iPhonu či iPadu použijte v Safari Sdílet → Přidat na plochu. Ovládání instalace závisí na prohlížeči a zařízení. Není potřeba další knihovna, obchod s aplikacemi ani APK.

`manifest.webmanifest` definuje relativní ID aplikace, startovací URL a rozsah; funguje pod `/SMT/` i v kořeni místního HTTP serveru. Místní PNG ikony zahrnují aplikační ikony 192 a 512 px, maskovatelnou ikonu 512 px a Apple touch ikonu 180 px. `scripts/generate-icons.ps1` je reprodukuje podle stávající značky s mřížkou pomocí Windows System.Drawing bez dalších závislostí.

`js/pwa.js` po načtení stránky registruje `sw.js`. Service worker vyžaduje v produkci HTTPS nebo při vývoji localhost. Náhled přímo ze souboru zůstává funkční jako běžná webová stránka, ale nemůže registrovat worker ani instalovat offline podporu. Po první úplné instalaci workeru fungují menu, hledání, čtečka QR, prohlížeč PDF, kompas, vodováha, překlady, styly a ikony offline, také po zavření a opětovném otevření aplikace. Ostatní nástroje zůstávají připravované. Instalace PWA není podmínkou ukládání do cache. Vymazání dat webu nebo uvolnění úložiště prohlížečem může uložené soubory odstranit; pro obnovení otevřete web znovu online.

Každá verze předem uloží všechny soubory aplikace. Neúplné stažení přeruší instalaci a zachová běžící verzi. Úplná aktualizace čeká na zavření všech karet prohlížeče a oken aplikace používajících předchozí worker; po opětovném otevření se aktivuje. Nedochází k vynucenému obnovení ani `skipWaiting()`. Návrat do viditelné aplikace nebo obnovení připojení ověří aktualizace. Úklid cache se týká pouze starých verzí této aplikace v jejím rozsahu. Nové soubory potřebné za běhu přidávejte do `SHELL` a `RELEASE` workeru udržujte shodný s verzí aplikace.

## Struktura

```text
index.html                   Vue šablona a vstupní body skriptů
styles.css                   Responzivní vzhled
js/app.js                    Stav, katalog nástrojů, hledání a ikony
js/qr-reader.js              Komponenta nativní kamery a čtečky QR
js/pdf-viewer.js             Komponenta nativního prohlížeče místních PDF
js/compass.js                Komponenta kompasu s nativními senzory
js/level.js                  Dvouosá nativní vodováha a kalibrace
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
tests/qr.html                Integrační testy životního cyklu čtečky QR
tests/pdf.html               Testy výběru PDF a životního cyklu dokumentu
tests/compass.html           Testy azimutu a oprávnění kompasu
tests/level.html             Testy vodováhy, kalibrace a životního cyklu
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

Při běžícím stejném testovacím serveru spusťte `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage qr.html` pro ověření čtečky se simulovanými streamy kamery a simulovaným detektorem. Testy pokrývají nepodporovaný prohlížeč, odmítnutí přístupu, textové i prázdné výsledky, zrušení, navigaci a opožděné asynchronní výsledky. Neověřují optické dekódování přes fyzickou kameru mobilu; to otestujte ručně na podporovaném telefonu.

Příkazem `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage pdf.html` ověříte vygenerované platné jednostránkové PDF, místní obsah a MIME typ, náhled i náhradní odkazy, neplatný výběr, opakovaný výběr, zrušení, responzivní rozložení a uvolňování dočasných URL. Ovládání nativního vykreslení PDF dodává prohlížeč.

Příkaz `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage compass.html` spouští simulované testy orientačních událostí: odmítnutí oprávnění, světové strany, směr a přesnost Safari, odmítnutí relativních dat, otočení obrazovky, náklon, chybějící data, zrušení, pozastavení a úklid při navigaci. Testy ověřují chování programu, nikoli přesnost fyzických senzorů.

Příkaz `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage level.html` ověří simulované údaje ve dvou osách, směr a limity bubliny, kalibraci a její zrušení, otočení měření i reference, toleranci půl stupně, odmítnutí polohy displejem dolů, oprávnění, chybějící data a úklid životního cyklu.

## GitHub Pages

Živá adresa je https://pkristofik49.github.io/SMT/. Při každém pushi do `main` workflow zkopíruje do `_site/` pouze `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `vendor/` a `icons/` a tento artefakt nasadí. Neinstaluje závislosti ani nic nesestavuje. Testy, hooky a dokumentace jsou vynechané. Ruční nasazení je dostupné přes Actions → Deploy to GitHub Pages → Run workflow. V Settings → Pages → Source musí být **GitHub Actions**.

## Údržba

Identifikátory, komentáře a popisy testů udržujte anglicky. `README.md` udržujte anglicky a `README_CZ.md` česky; odpovídající obsah aktualizujte v obou ve stejné změně. Minimalizujte závislosti: před přidáním knihovny nebo vývojové závislosti vysvětlete potřebu i alternativu a vyčkejte na výslovný souhlas uživatele. Úplná pravidla jsou v `AGENTS.md`.
