@echo off
cd /d "%~dp0"
title Orbix ERP Enterprise - Build Windows Installer
color 0e

echo =================================================================
echo        ORBIX ERP ENTERPRISE - BUILD WINDOWS INSTALLER (.EXE)
echo =================================================================
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs;%APPDATA%\npm"
)

if not exist "package.json" (
    color 0c
    echo [ERROR] package.json was not found in this directory!
    echo Please make sure you extracted (unzipped) the project folder.
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not found in system PATH!
    echo Please download and install Node.js (LTS version) from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing required dependencies first...
    call npm install
)

if not exist "node_modules\electron\" (
    echo [INFO] Installing Electron desktop runtime...
    call npm install --save-dev electron
)

if not exist "node_modules\electron-builder\" (
    echo [INFO] Installing Electron packaging tools...
    call npm install --save-dev electron-builder
)

echo.
echo [INFO] Packaging Windows Installer (.exe)...
echo Please wait, this process usually takes 1 to 3 minutes...
echo.

call npm run electron:build

if %errorlevel% equ 0 (
    color 0a
    echo.
    echo =================================================================
    echo  [SUCCESS] Windows Installer (.exe) generated in: dist-electron
    echo =================================================================
    echo.
    if exist "dist-electron\" (
        explorer dist-electron
    )
) else (
    color 0c
    echo.
    echo [ERROR] Failed to package application.
)

pause
