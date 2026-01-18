$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[TaskLedger] $msg" }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$batPath = Join-Path $repoRoot "release\windows\start-taskledger-autostart.bat"

if (-not (Test-Path $batPath)) {
  throw "Cannot find: $batPath"
}

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$valueName = "TaskLedger"

# Quote the bat path for registry
$cmd = "`"$batPath`""

New-Item -Path $runKey -Force | Out-Null
New-ItemProperty -Path $runKey -Name $valueName -PropertyType String -Value $cmd -Force | Out-Null

Write-Info "Auto-start enabled (current user)."
Write-Info "It will start on next login."
Write-Info "To remove: run uninstall-autostart.ps1"

