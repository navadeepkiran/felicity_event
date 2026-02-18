@echo off
echo Starting Frontend Server...
cd /d "%~dp0frontend"
wsl bash -c "npm run dev"
pause
