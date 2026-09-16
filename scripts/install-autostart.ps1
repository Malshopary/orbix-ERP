$wsh = New-Object -ComObject WScript.Shell
$startupPath = [System.Environment]::GetFolderPath('Startup')
$targetVbs = "F:\orbix erp\orbix-erp\Orbix-AutoStart-Silent.vbs"
$iconFile = "F:\orbix erp\orbix-erp\public\app.ico"

$shortcutPath = Join-Path $startupPath "Orbix-ERP-AutoStart.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$targetVbs`""
$shortcut.WorkingDirectory = "F:\orbix erp\orbix-erp"
if (Test-Path $iconFile) {
    $shortcut.IconLocation = "$iconFile,0"
}
$shortcut.Description = "Orbix ERP Automatic Background Server Launcher"
$shortcut.Save()

Write-Host "[SUCCESS] AutoStart shortcut created at: $shortcutPath"

