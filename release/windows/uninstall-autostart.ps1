$ErrorActionPreference = "Stop"

function Write-Info($msg) { Write-Host "[TaskLedger] $msg" }

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$valueName = "TaskLedger"

try {
  Remove-ItemProperty -Path $runKey -Name $valueName -ErrorAction Stop
  Write-Info "Auto-start removed."
} catch {
  Write-Info "Auto-start entry not found (nothing to remove)."
}

