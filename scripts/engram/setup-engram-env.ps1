$ErrorActionPreference = "Stop"

# Setup reproducible para otra compu (PowerShell)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$binDir = if ($env:ENGRAM_BIN_DIR) { $env:ENGRAM_BIN_DIR } else { Join-Path $HOME ".local\bin" }
New-Item -ItemType Directory -Path $binDir -Force | Out-Null

Copy-Item (Join-Path $scriptDir "engram-export-all.ps1") (Join-Path $binDir "engram-export-all.ps1") -Force
Copy-Item (Join-Path $scriptDir "engram-push.ps1") (Join-Path $binDir "engram-push.ps1") -Force
Copy-Item (Join-Path $scriptDir "engram-pull.ps1") (Join-Path $binDir "engram-pull.ps1") -Force

Write-Host "[OK] Scripts instalados en $binDir" -ForegroundColor Green
Write-Host "Seteo recomendado:" -ForegroundColor Yellow
Write-Host "  `$env:AGENTES_IA_REPO_DIR = '<ruta-agentes-ia>'"
Write-Host "  `$env:ENGRAM_LOCAL_DIR = '$HOME/.engram'"
Write-Host "  `$env:ENGRAM_PRIMARY_BRANCHES = 'main master'"
