/**
 * Generates a 256x256 PNG logo for ClipPath README.
 * Design: Dark circle (#2A2A2A fill, #3E3E3E border) with a bold white
 * Z-shaped circuit-trace path inside. Gray (#888888) start node at top-left,
 * white end node at bottom-right. Transparent background.
 *
 * Uses PowerShell System.Drawing to produce a proper PNG file.
 * Run: bun run scripts/generate-logo.ts
 */

import { $ } from "bun";
import { existsSync } from "fs";

const outPath = new URL("../assets/logo.png", import.meta.url).pathname.slice(1);

// PowerShell script that uses System.Drawing to create the PNG
const ps1 = `
Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# Scale factor from 48x48 reference design
# 48 -> 256: factor ~5.333
$s = $size / 48.0

# --- Dark circle with border ---
# Border ring: #3E3E3E, radius 22 in 48px => circle centered at (23,23)
$borderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0x3E, 0x3E, 0x3E))
$cx = 23 * $s
$cy = 23 * $s
$rBorder = 22 * $s
$g.FillEllipse($borderBrush, ($cx - $rBorder), ($cy - $rBorder), ($rBorder * 2), ($rBorder * 2))

# Fill: #2A2A2A, radius 21 in 48px
$fillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0x2A, 0x2A, 0x2A))
$rFill = 21 * $s
$g.FillEllipse($fillBrush, ($cx - $rFill), ($cy - $rFill), ($rFill * 2), ($rFill * 2))

# --- Z-shaped path (white, bold) ---
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Top horizontal bar: rect(10,14, 25,17) in 48px
$g.FillRectangle($white, [float](10*$s), [float](14*$s), [float]((25-10+1)*$s), [float]((17-14+1)*$s))

# Vertical connector: rect(22,14, 25,33) in 48px
$g.FillRectangle($white, [float](22*$s), [float](14*$s), [float]((25-22+1)*$s), [float]((33-14+1)*$s))

# Bottom horizontal bar: rect(22,30, 37,33) in 48px
$g.FillRectangle($white, [float](22*$s), [float](30*$s), [float]((37-22+1)*$s), [float]((33-30+1)*$s))

# --- Start node (gray #888888) at (9,15) radius 3 ---
$gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0x88, 0x88, 0x88))
$snCx = 9 * $s
$snCy = 15 * $s
$snR  = 3 * $s
$g.FillEllipse($gray, ($snCx - $snR), ($snCy - $snR), ($snR * 2), ($snR * 2))

# --- End node (white) at (38,31) radius 3 ---
$enCx = 38 * $s
$enCy = 31 * $s
$enR  = 3 * $s
$g.FillEllipse($white, ($enCx - $enR), ($enCy - $enR), ($enR * 2), ($enR * 2))

# --- Save as PNG ---
$outPath = "${outPath.replace(/\//g, "\\\\")}"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$borderBrush.Dispose()
$fillBrush.Dispose()
$white.Dispose()
$gray.Dispose()

Write-Host "Logo saved: $outPath"
`;

console.log("Generating 256x256 logo PNG via PowerShell System.Drawing...");

const result = await $`powershell -NoProfile -Command ${ps1}`.text();
console.log(result.trim());

if (existsSync(outPath)) {
  const stat = Bun.file(outPath);
  console.log(`Output: ${outPath} (${stat.size} bytes)`);
} else {
  console.error("ERROR: Logo file was not created!");
  process.exit(1);
}
