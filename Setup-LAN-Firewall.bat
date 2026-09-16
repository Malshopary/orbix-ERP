@echo off
cd /d "%~dp0"
title Orbix ERP - Setup LAN Firewall
echo =================================================================
echo         ORBIX ERP - CONFIGURING WINDOWS FIREWALL FOR LAN
echo =================================================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please right-click and Run as Administrator!
    pause
    exit /b 1
)
netsh advfirewall firewall delete rule name="Orbix ERP Web (Port 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="Orbix ERP Web (Port 3000)" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall delete rule name="Orbix ERP Database (Port 5432)" >nul 2>&1
netsh advfirewall firewall add rule name="Orbix ERP Database (Port 5432)" dir=in action=allow protocol=TCP localport=5432
echo.
echo [SUCCESS] Firewall rules configured successfully for LAN access.
pause
