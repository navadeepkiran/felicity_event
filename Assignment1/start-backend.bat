@echo off
echo Starting Backend Server...
cd /d "%~dp0backend"
wsl bash -c "node server.js"
pause
