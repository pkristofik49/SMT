$ErrorActionPreference = 'Stop'
$root = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Run versioning inside the Git repository.' }
Push-Location $root
try {
    $paths = @('js/version.js')
    if (Test-Path -LiteralPath 'sw.js') { $paths += 'sw.js' }
    git diff --quiet -- $paths
    if ($LASTEXITCODE -ne 0) { throw 'Stage version and service-worker changes before committing.' }

    $version = '1.000'
    git rev-parse --verify --quiet HEAD | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $trackedVersion = git ls-tree --name-only HEAD -- js/version.js
        if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the committed version.' }
        if ($trackedVersion) {
            $previous = (git show HEAD:js/version.js) -join "`n"
            if ($previous -notmatch "SmallToolsVersion = '(\d+)\.(\d{3})';") { throw 'Invalid committed application version.' }
            $number = [long]$Matches[1] * 1000 + [long]$Matches[2] + 1
            $version = '{0}.{1:D3}' -f [long][Math]::Floor($number / 1000), [long]($number % 1000)
        }
    }

    $worker = $null
    if ($paths -contains 'sw.js') {
        $worker = [IO.File]::ReadAllText((Join-Path $root 'sw.js'))
        if ($worker -notmatch "const RELEASE = '[^']+';") { throw 'Service worker release declaration not found.' }
        $worker = [regex]::Replace($worker, "const RELEASE = '[^']+';", "const RELEASE = '$version';")
    }

    $source = "/* The pre-commit hook derives this value from the previous committed version. */`nglobalThis.SmallToolsVersion = '$version';`n"
    [IO.File]::WriteAllText((Join-Path $root 'js/version.js'), $source, [Text.UTF8Encoding]::new($false))
    if ($null -ne $worker) {
        [IO.File]::WriteAllText((Join-Path $root 'sw.js'), $worker, [Text.UTF8Encoding]::new($false))
    }
    git add -- $paths
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage the application version.' }
    Write-Output "Application version: $version"
} finally {
    Pop-Location
}
