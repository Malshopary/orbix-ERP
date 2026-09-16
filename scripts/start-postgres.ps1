$rootDir = "F:\orbix erp\orbix-erp"
$pgCtl = "$rootDir\PostgreSQL\18\bin\pg_ctl.exe"
$pgData = "$rootDir\PostgreSQL\18\data"
$pidFile = "$pgData\postmaster.pid"

if (Test-Path $pidFile) {
    try {
        $p = (Get-Content $pidFile -TotalCount 1).Trim()
        if ($p -and -not (Get-Process -Id $p -ErrorAction SilentlyContinue)) {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}

& $pgCtl status -D $pgData > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    & $pgCtl start -D $pgData -w
}

