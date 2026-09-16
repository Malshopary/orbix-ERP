@echo off
cd /d "%~dp0"
title Orbix ERP - Disable AutoStart

powershell -NoProfile -ExecutionPolicy Bypass -Command "$f = Join-Path ([System.Environment]::GetFolderPath('Startup')) 'Orbix-ERP-AutoStart.lnk'; if (Test-Path $f) { Remove-Item $f -Force; Write-Host '[OK] AutoStart shortcut removed successfully.' } else { Write-Host '[INFO] AutoStart shortcut was not found.' }"

pause
