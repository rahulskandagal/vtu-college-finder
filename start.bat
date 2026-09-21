@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies (first run)...
  call npm install
)
echo Starting VTU College Finder ... open http://localhost:3000 once it says Ready
call npm run start:local
pause
