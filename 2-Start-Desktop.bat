@echo off
cd /d "%~dp0"
title Orbix ERP - Desktop Edition

set "PATH=%PATH%;C:\Program Files\nodejs;%ProgramFiles%\nodejs;%APPDATA%\npm;%~dp0node_modules\.bin"

echo =====================================================
echo          ORBIX ERP - DESKTOP EDITION
echo =====================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 goto err_node

if not exist "package.json" goto err_unzip

if not exist "node_modules" goto do_install

:check_electron
if not exist "node_modules\electron" goto install_electron

:check_build
if not exist "dist\index.html" goto do_build
goto run_desktop

:do_install
echo [INFO] First time setup detected!
echo [INFO] Installing required packages. Please wait...
echo.
call npm install
if %errorlevel% neq 0 goto err_install
echo.
echo [OK] Installation completed successfully!
echo.
goto check_electron

:install_electron
echo.
echo [INFO] Installing Electron desktop runtime...
echo Please wait, downloading desktop framework...
echo.
call npm install --save-dev electron
if %errorlevel% neq 0 goto err_electron
echo.
echo [OK] Electron installed successfully!
echo.
goto check_build

:do_build
echo [INFO] Building application for desktop mode...
echo.
call npm run build
if %errorlevel% neq 0 goto err_build
echo.
echo [OK] Build completed!
echo.
goto run_desktop

:run_desktop
echo [OK] Launching Desktop Window...
echo.
if exist "node_modules\.bin\electron.cmd" (
    call "node_modules\.bin\electron.cmd" electron/main.cjs
) else (
    call npx electron electron/main.cjs
)

if %errorlevel% neq 0 goto err_launch
goto finished

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

:err_electron
echo.
echo =====================================================
echo [ERROR] Failed to install Electron desktop runtime.
echo You can run it via the web browser using:
echo 1-Start-Web.bat
echo =====================================================
echo.
pause
exit /b 1

:err_build
echo.
echo =====================================================
echo [ERROR] Build process failed.
echo =====================================================
echo.
pause
exit /b 1

:err_launch
echo.
echo =====================================================
echo [ERROR] Desktop window failed to launch.
echo Note: You can always use 1-Start-Web.bat to run the
echo system instantly in your web browser!
echo =====================================================
echo.
pause
exit /b 1

:finished
echo.
echo Application closed.
pause
