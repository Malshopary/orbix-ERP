@echo off
cd /d "%~dp0"
title Orbix ERP - Enable AutoStart

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-autostart.ps1"

pause
