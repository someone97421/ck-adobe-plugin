param(
  [string]$IllustratorRoot = "C:\Program Files\Adobe\Adobe Illustrator 2026"
)
$source = Join-Path $PSScriptRoot "tools\jsx"
$presets = Get-ChildItem -LiteralPath (Join-Path $IllustratorRoot "Presets") -Directory -ErrorAction SilentlyContinue
if (!$presets) { throw "找不到 Illustrator Presets 目录：$IllustratorRoot" }
$target = Get-ChildItem -LiteralPath $presets.FullName -Directory | Where-Object { Test-Path (Join-Path $_.FullName "zh_CN\脚本") -or Test-Path (Join-Path $_.FullName "en_US\Scripts") } | Select-Object -First 1
if (!$target) { throw "找不到 Illustrator 脚本目录，请传入正确的 Illustrator 安装目录。" }
$scriptDir = Get-ChildItem -LiteralPath $target.FullName -Directory | ForEach-Object {
  $candidate = Join-Path $_.FullName "脚本"; if (Test-Path $candidate) { $candidate }
  $candidate = Join-Path $_.FullName "Scripts"; if (Test-Path $candidate) { $candidate }
} | Select-Object -First 1
if (!$scriptDir) { throw "找不到脚本目录。" }
Copy-Item (Join-Path $source "*.jsx") -Destination $scriptDir -Force
Write-Output "已安装到：$scriptDir"
