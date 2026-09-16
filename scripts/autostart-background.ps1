# ==============================================================================
# Orbix ERP Enterprise - Silent Windows Auto-Start Orchestrator
# Starts PostgreSQL 18 & Node.js Server silently on Windows boot
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"

# 1. Resolve Root Directory (Primary: F:\orbix erp\orbix-erp, Fallback: C:\Users\moham\Desktop\orbix-erp)
$candidateRoots = @(
    "F:\orbix erp\orbix-erp",
    "C:\Users\moham\Desktop\orbix-erp",
    (Split-Path -Parent $PSScriptRoot),
    $PSScriptRoot
)

$rootDir = $null
foreach ($r in $candidateRoots) {
    if (Test-Path "$r\dist\server.cjs") {
        $rootDir = $r
        break
    }
}

if (-not $rootDir) {
    $rootDir = "F:\orbix erp\orbix-erp"
}

$logFile = "$rootDir\autostart.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] === Orbix ERP Auto-Start Sequence Initiated ==="

# 2. Check and Start PostgreSQL Database
$pgCtl = "$rootDir\PostgreSQL\18\bin\pg_ctl.exe"
$pgData = "$rootDir\PostgreSQL\18\data"
$pidFile = "$pgData\postmaster.pid"

$isPgListening = $false
try {
    $pgConn = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($pgConn) { $isPgListening = $true }
} catch {}

if (-not $isPgListening -and (Test-Path $pgCtl)) {
    Add-Content -Path $logFile -Value "[$timestamp] PostgreSQL not running. Cleaning stale PID and starting..."
    
    if (Test-Path $pidFile) {
        try {
            $p = (Get-Content $pidFile -TotalCount 1).Trim()
            if ($p -and -not (Get-Process -Id $p -ErrorAction SilentlyContinue)) {
                Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }

    # Start PostgreSQL engine
    Start-Process -FilePath $pgCtl -ArgumentList "start -D `"$pgData`" -w" -WorkingDirectory "$rootDir\PostgreSQL\18" -WindowStyle Hidden -Wait
    
    # Wait briefly for DB to be fully ready
    Start-Sleep -Seconds 2
} else {
    Add-Content -Path $logFile -Value "[$timestamp] PostgreSQL is already active."
}

# 3. Check and Start Node.js Orbix Server
$isNodeListening = $false
try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) { $isNodeListening = $true }
} catch {}

if (-not $isNodeListening) {
    Add-Content -Path $logFile -Value "[$timestamp] Node.js server not running on port 3000. Launching..."
    
    $serverScript = "$rootDir\dist\server.cjs"
    if (Test-Path $serverScript) {
        Start-Process -FilePath "node" -ArgumentList "`"$serverScript`"" -WorkingDirectory $rootDir -WindowStyle Hidden
    } else {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $rootDir -WindowStyle Hidden
    }

    # Poll until ready (up to 20 seconds)
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $check = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($check.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {}
    }

    if ($ready) {
        Add-Content -Path $logFile -Value "[$timestamp] [SUCCESS] Orbix ERP Server is healthy on port 3000."
    } else {
        Add-Content -Path $logFile -Value "[$timestamp] [WARN] Server launched; health probe pending."
    }
} else {
    Add-Content -Path $logFile -Value "[$timestamp] Orbix ERP Server is already active on port 3000."
}

# 4. Optional Tray Notification
try {
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $iconPath = "$rootDir\public\app.ico"
    if (Test-Path $iconPath) {
        $notify.Icon = New-Object System.Drawing.Icon($iconPath)
    } else {
        $notify.Icon = [System.Drawing.SystemIcons]::Information
    }
    $notify.BalloonTipTitle = "Orbix ERP Enterprise"
    $notify.BalloonTipText = "Orbix Server is active and listening for LAN & Mobile clients on port 3000."
    $notify.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    $notify.Visible = $true
    $notify.ShowBalloonTip(4000)
    Start-Sleep -Seconds 4
    $notify.Dispose()
} catch {}

