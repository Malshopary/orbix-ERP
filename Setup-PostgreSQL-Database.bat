@echo off
cd /d "%~dp0"
title Orbix ERP - PostgreSQL Database Setup
color 0b

echo =================================================================
echo             ORBIX ERP - POSTGRESQL DATABASE SETUP
echo             اعداد وتهيئة قاعدة بيانات بوستجري لنظام أوربكس
echo =================================================================
echo.

set "PG_BIN="
set "PG_DATA="
if exist "%~dp0PostgreSQL\18\bin\psql.exe" (
    set "PG_BIN=%~dp0PostgreSQL\18\bin"
    set "PG_DATA=%~dp0PostgreSQL\18\data"
)
if "%PG_BIN%"=="" if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
if "%PG_BIN%"=="" if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
if "%PG_BIN%"=="" if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set "PG_BIN=C:\Program Files\PostgreSQL\16\bin"
if "%PG_BIN%"=="" if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set "PG_BIN=C:\Program Files\PostgreSQL\15\bin"

if not "%PG_BIN%"=="" (
    set "PATH=%PG_BIN%;%PATH%"
)

if not "%PG_DATA%"=="" (
    if exist "%PG_DATA%\postmaster.pid" (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "$f='%PG_DATA%\postmaster.pid'; if (Test-Path $f) { $p=(Get-Content $f -TotalCount 1).Trim(); if ($p -and -not (Get-Process -Id $p -ErrorAction SilentlyContinue)) { Remove-Item $f -Force } }" >nul 2>&1
    )
    "%PG_BIN%\pg_ctl.exe" status -D "%PG_DATA%" >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Starting local PostgreSQL daemon...
        "%PG_BIN%\pg_ctl.exe" start -D "%PG_DATA%" -w >nul 2>&1
    )
)

where psql >nul 2>nul
if %errorlevel% neq 0 (
    color 0e
    echo [WARNING] PostgreSQL client was not found on this machine.
    echo Please install PostgreSQL or configure the remote connection in Settings.
    pause
    exit /b 0
)

echo [INFO] Initializing orbix_erp database...
psql -U postgres -h 127.0.0.1 -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'orbix_erp'" | findstr /r "1" >nul 2>&1
if errorlevel 1 (
    echo Creating database orbix_erp...
    createdb -U postgres -h 127.0.0.1 -p 5432 orbix_erp
)
echo [OK] PostgreSQL database is ready!
pause

