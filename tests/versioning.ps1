$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fixture = Join-Path $root ('.test-version-' + [DateTime]::UtcNow.Ticks)
$null = New-Item -ItemType Directory -Path $fixture

function Invoke-Git {
    & git -C $fixture @args
    if ($LASTEXITCODE -ne 0) { throw "Git failed: $args" }
}
function Assert-Version([string]$expected) {
    $source = [IO.File]::ReadAllText((Join-Path $fixture 'js/version.js'))
    if (-not $source.Contains("SmallToolsVersion = '$expected';")) { throw "Expected version $expected." }
}

Invoke-Git init --quiet
Invoke-Git config user.name 'Version test'
Invoke-Git config user.email 'version-test@example.invalid'
Invoke-Git config core.autocrlf false
Invoke-Git config commit.gpgsign false
foreach ($relative in @('js/version.js', '.githooks/pre-commit', 'scripts/update-version.ps1')) {
    $target = Join-Path $fixture $relative
    $null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($target)) -Force
    [IO.File]::Copy((Join-Path $root $relative), $target)
}
Invoke-Git config core.hooksPath .githooks
Invoke-Git add .
Invoke-Git commit --quiet -m 'Initialize versioning'
Assert-Version '1.000'
'PASS Initial commit starts at 1.000'

Invoke-Git commit --quiet --allow-empty -m 'Increment version'
Assert-Version '1.001'
'PASS Next commit increments by 0.001'

$versionPath = Join-Path $fixture 'js/version.js'
[IO.File]::AppendAllText($versionPath, "`n// Unstaged fixture edit.`n")
Push-Location $fixture
try {
    $savedPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = git commit --quiet --allow-empty -m 'Reject unstaged version' 2>&1
    $rejectedCode = $LASTEXITCODE
    $ErrorActionPreference = $savedPreference
} finally { Pop-Location }
if ($rejectedCode -eq 0) { throw 'The hook accepted unstaged version changes.' }
Assert-Version '1.001'
'PASS Unstaged edits stop the commit without consuming a version'
Invoke-Git add js/version.js
Invoke-Git commit --quiet -m 'Retry staged version'
Assert-Version '1.002'
'PASS A rejected commit can be retried without skipping a version'

$source = [IO.File]::ReadAllText($versionPath).Replace("'1.002'", "'1.999'")
[IO.File]::WriteAllText($versionPath, $source, [Text.UTF8Encoding]::new($false))
Invoke-Git add js/version.js
Invoke-Git -c core.hooksPath=.no-hooks commit --quiet -m 'Seed rollover fixture'
Invoke-Git commit --quiet --allow-empty -m 'Roll over version'
Assert-Version '2.000'
'PASS Version 1.999 rolls over to 2.000'

$workerPath = Join-Path $fixture 'sw.js'
[IO.File]::WriteAllText($workerPath, "const RELEASE = '2.000';`n", [Text.UTF8Encoding]::new($false))
Invoke-Git add sw.js
Invoke-Git commit --quiet -m 'Add worker fixture'
Assert-Version '2.001'
if ([IO.File]::ReadAllText($workerPath) -notmatch "RELEASE = '2.001';") { throw 'Worker release does not match.' }
'PASS An optional service worker follows the application version'
if (git -C $fixture status --porcelain) { throw 'Versioning left uncommitted changes.' }
'PASS Versioning leaves a clean working tree'
