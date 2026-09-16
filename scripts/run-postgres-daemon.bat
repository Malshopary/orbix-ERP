@echo off
set "ROOT=F:\orbix erp\orbix-erp\PostgreSQL\18"
if exist "%ROOT%\data\postmaster.pid" del /f /q "%ROOT%\data\postmaster.pid"
"%ROOT%\bin\postgres.exe" -D "%ROOT%\data"

