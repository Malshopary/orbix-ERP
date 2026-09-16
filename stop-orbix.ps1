# stop-orbix.ps1
Write-Host "[1/2] Stopping Orbix ERP Node.js server..." -ForegroundColor Yellow
$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { 
    $_.CommandLine -like '*dist\server.cjs*' -or $_.CommandLine -like '*server.ts*' 
}
foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "[OK] Node.js server stopped." -ForegroundColor Green

Write-Host "[2/2] Stopping PostgreSQL database..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pgCtl = Join-Path $scriptDir "PostgreSQL\18\bin\pg_ctl.exe"
$pgData = Join-Path $scriptDir "PostgreSQL\18\data"

if (Test-Path $pgCtl) {
    & $pgCtl stop -D $pgData -m fast 2>&1 | Out-Null
    Write-Host "[OK] PostgreSQL database stopped." -ForegroundColor Green
} else {
    Write-Host "[INFO] PostgreSQL pg_ctl not found, skipping." -ForegroundColor Gray
}

Write-Host "[SUCCESS] All Orbix ERP services have been stopped successfully." -ForegroundColor Cyan

