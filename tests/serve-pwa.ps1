param([int]$Port = 8766, [string]$BasePath = '/SMT/')
$ErrorActionPreference = 'Stop'
if ($BasePath -notmatch '^/([a-zA-Z0-9_-]+/)*$') { throw 'BasePath must be a directory URL path.' }
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "PWA test server: http://localhost:$Port$BasePath"
$offline = $false
$release = 'v1'
$failAsset = $false
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
        try {
            if ($path -eq '/__pwa-test__/stop') { $response.Close(); break }
            if ($path -eq '/__pwa-test__/offline') { $offline = $true; $response.Close(); continue }
            if ($path -eq '/__pwa-test__/online') { $offline = $false; $response.Close(); continue }
            if ($path -eq '/__pwa-test__/release') {
                $release = $context.Request.QueryString['version']
                $failAsset = $context.Request.QueryString['fail'] -eq 'true'
                $response.Close(); continue
            }
            if ($offline -or ($failAsset -and $path -eq ($BasePath + 'styles.css'))) {
                $response.StatusCode = 503; $response.Close(); continue
            }
            if (!$path.StartsWith($BasePath, [StringComparison]::Ordinal)) { $response.StatusCode = 404; $response.Close(); continue }
            $relative = $path.Substring($BasePath.Length)
            if (!$relative) { $relative = 'index.html' }
            $filePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
            if (!$filePath.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar) -or $relative -match '(^|[/\\])\.' -or ![IO.File]::Exists($filePath)) {
                $response.StatusCode = 404; $response.Close(); continue
            }
            $response.Headers['Cache-Control'] = 'no-store'
            $response.ContentType = switch ([IO.Path]::GetExtension($filePath)) {
                '.html' { 'text/html; charset=utf-8' }
                '.js' { 'text/javascript; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.webmanifest' { 'application/manifest+json; charset=utf-8' }
                '.png' { 'image/png' }
                '.svg' { 'image/svg+xml' }
                default { 'application/octet-stream' }
            }
            if ($relative -eq 'sw.js') {
                $worker = [regex]::Replace([IO.File]::ReadAllText($filePath), "const RELEASE = '[^']+';", "const RELEASE = '$release';")
                $body = [Text.Encoding]::UTF8.GetBytes($worker)
            } else { $body = [IO.File]::ReadAllBytes($filePath) }
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)
            $response.Close()
        } catch { $response.Abort() }
    }
} finally { $listener.Close() }
