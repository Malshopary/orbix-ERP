# Create-Desktop-Shortcut.ps1
$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$icoPath = Join-Path $currentDir "public\app.ico"

# 1. Main System Shortcut (With Modern Preloader - Silent)
$shortcutPath = Join-Path $desktop "Orbix ERP.lnk"
$vbsPath = Join-Path $currentDir "Start-Orbix-Silent.vbs"

$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $currentDir
$shortcut.Description = "Orbix ERP Enterprise - Smart Accounting & POS"

if (Test-Path $icoPath) {
    $shortcut.IconLocation = "$icoPath,0"
}
$shortcut.Save()
Write-Host "[OK] Desktop shortcut (System & Preloader) ready at: $shortcutPath" -ForegroundColor Green

# 2. Dedicated Electron Desktop Edition Shortcut (Completely Silent - No CMD Windows)
$desktopShortcutPath = Join-Path $desktop "Orbix ERP Desktop.lnk"
$desktopVbs = Join-Path $currentDir "Start-Desktop-Silent.vbs"

$scElectron = $ws.CreateShortcut($desktopShortcutPath)
$scElectron.TargetPath = "wscript.exe"
$scElectron.Arguments = "`"$desktopVbs`""
$scElectron.WorkingDirectory = $currentDir
$scElectron.Description = "Orbix ERP Desktop Edition (Silent Launch with Neon Splash Preloader)"

if (Test-Path $icoPath) {
    $scElectron.IconLocation = "$icoPath,0"
}
$scElectron.Save()
Write-Host "[OK] Electron Desktop App shortcut (Completely Silent) ready at: $desktopShortcutPath" -ForegroundColor Green
