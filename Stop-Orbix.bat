@echo off
cd /d "%~dp0"
title Orbix ERP - Stop System
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-orbix.ps1"

