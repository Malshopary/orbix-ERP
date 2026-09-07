@echo off
cd /d "%~dp0"
title Orbix ERP - Web Edition

set "PATH=%PATH%;C:\Program Files\nodejs;%ProgramFiles%\nodejs;%APPDATA%\npm;%~dp0node_modules\.bin"

echo =====================================================
echo            ORBIX ERP - WEB LAUNCHER
echo =====================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 goto err_node

if not exist "package.json" goto err_unzip

if not exist "node_modules" goto do_install

:run_server
echo [OK] Environment ready.
echo [INFO] Opening http://localhost:3000 in your browser...
echo [INFO] Starting application server...
echo.

start http://localhost:3000
call npm run dev
goto finished

:do_install
echo [INFO] First time setup detected!
echo [INFO] Installing required packages. Please wait...
echo.
call npm install
if %errorlevel% neq 0 goto err_install
echo.
echo [OK] Installation completed successfully!
echo.
goto run_server

:err_node
echo.
echo =====================================================
echo [ERROR] Node.js is NOT installed on this computer!
echo.
echo 1. Download and install Node.js from:
echo    https://nodejs.org (Download LTS version)
echo 2. After installing, double-click this file again.
echo =====================================================
echo.
pause
exit /b 1

:err_unzip
echo.
echo =====================================================
echo [ERROR] package.json is missing!
echo.
echo Please extract the ZIP file before running!
echo Right-click the downloaded zip, choose "Extract All",
echo then run this file from the extracted folder.
echo =====================================================
echo.
pause
exit /b 1

:err_install
echo.
echo =====================================================
echo [ERROR] Failed to install npm packages.
echo Please check your internet connection and try again.
echo =====================================================
echo.
pause
exit /b 1

:finished
echo.
echo Server has stopped.
pause
