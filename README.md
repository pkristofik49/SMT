# Small Tools

Vue 3 SPA s úvodním rozcestníkem malých nástrojů. Obsahuje šest připravovaných dlaždic, vyhledávání bez ohledu na diakritiku a responzivní mřížku 2 × N (na mobilu jeden sloupec). Samotné nástroje zatím nejsou implementované.

## Spuštění

Vyžaduje Node.js 20.19+ nebo 22.12+ a npm.

```sh
npm install
npm run dev
```

V tomto pracovním prostředí je pro ověření připravený také lokální Node.js v ignorovaném adresáři `.tools/`. Pokud Node.js není v systémové PATH, lze aplikaci spustit v PowerShellu z kořene projektu takto:

```powershell
$env:Path = (Join-Path (Get-Location) '.tools\node-v22.16.0-win-x64') + ';' + $env:Path
npm.cmd run dev
```

## Produkční sestavení

```sh
npm run build
npm run preview
```

Výstup sestavení je v `dist/`. Dlaždice lze přidávat do pole `tools` v `src/App.vue`.

## GitHub Pages

Aplikace je dostupná na https://pkristofik49.github.io/SMT/.

Workflow `.github/workflows/deploy.yml` při každém pushi do `main` nainstaluje závislosti přes `npm ci`, sestaví aplikaci a nasadí `dist/` na GitHub Pages. Nasazení lze spustit také ručně v záložce Actions pomocí `workflow_dispatch`.

V nastavení repozitáře **Settings → Pages → Source** se používá **GitHub Actions**. Vite má nastavené `base: '/SMT/'`, aby odkazy na assety fungovaly pod cestou repozitáře. Lokální dev server i preview proto obsluhují aplikaci na `/SMT/`.
