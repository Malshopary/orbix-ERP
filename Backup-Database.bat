@echo off
cd /d "%~dp0"
title Orbix ERP - Database Backup
set "PG_BIN="
if exist "%~dp0PostgreSQL\18\bin\pg_dump.exe" set "PG_BIN=%~dp0PostgreSQL\18\bin"
if "%PG_BIN%"=="" if exist "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
if "%PG_BIN%"=="" (
    set "PATH=%PG_BIN%;%PATH%"
)
if not exist "%~dp0backups" mkdir "%~dp0backups"
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%_%datetime:~8,6%
echo Backing up database to backups\orbix_backup_%timestamp%.sql...
"%PG_BIN%\pg_dump.exe" -U postgres -h 127.0.0.1 -p 5432 -d orbix_erp -F p -f "%~dp0backups\orbix_backup_%timestamp%.sql"
echo Done!
pause

