$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

foreach ($icon in @(
    @{ Name = 'icon-192.png'; Size = 192 },
    @{ Name = 'icon-512.png'; Size = 512 },
    @{ Name = 'maskable-512.png'; Size = 512 },
    @{ Name = 'apple-touch-icon.png'; Size = 180 }
)) {
    $bitmap = [Drawing.Bitmap]::new($icon.Size, $icon.Size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $white = [Drawing.SolidBrush]::new([Drawing.Color]::White)
    $muted = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#96bdb7'))
    try {
        $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#16796c'))
        # Keep the complete mark inside the maskable icon's central safe zone.
        $scale = $icon.Size / 40.0
        foreach ($square in @(@(10, 10), @(22, 10), @(10, 22), @(22, 22))) {
            $brush = if ($square[0] -eq 22 -and $square[1] -eq 22) { $muted } else { $white }
            $x = [single]($square[0] * $scale)
            $y = [single]($square[1] * $scale)
            $size = [single](8 * $scale)
            $diameter = [single](2 * $scale)
            $path = [Drawing.Drawing2D.GraphicsPath]::new()
            try {
                $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
                $path.AddArc($x + $size - $diameter, $y, $diameter, $diameter, 270, 90)
                $path.AddArc($x + $size - $diameter, $y + $size - $diameter, $diameter, $diameter, 0, 90)
                $path.AddArc($x, $y + $size - $diameter, $diameter, $diameter, 90, 90)
                $path.CloseFigure()
                $graphics.FillPath($brush, $path)
            } finally { $path.Dispose() }
        }
        $bitmap.Save((Join-Path $root ('icons/' + $icon.Name)), [Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $muted.Dispose()
        $white.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}
