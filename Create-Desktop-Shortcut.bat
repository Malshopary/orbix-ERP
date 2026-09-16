@echo off
cd /d "%~dp0"
title Orbix ERP - Create Desktop Shortcut
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"
pause

