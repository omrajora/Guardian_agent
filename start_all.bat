@echo off
TITLE Guardian Agent 2.0 - Launcher
COLOR 0A

echo =====================================================================
echo          GUARDIAN AGENT 2.0 - FULL SYSTEM LAUNCHER
echo =====================================================================
echo.
echo Starting all 3 services in separate windows...
echo.

REM 1. Start Python FastAPI ML Service (Port 8000)
echo [1/3] Launching Python ML Service on http://localhost:8000 ...
start "Guardian - ML Service (Port 8000)" cmd /k "cd /d %~dp0ml && python src/app.py"

timeout /t 3 /nobreak >nul

REM 2. Start Node.js Express Gateway (Port 5000)
echo [2/3] Launching Backend Gateway on http://localhost:5000 ...
start "Guardian - Backend Gateway (Port 5000)" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

REM 3. Start Next.js Frontend Dashboard (Port 3000)
echo [3/3] Launching Next.js Frontend on http://localhost:3000 ...
start "Guardian - Frontend Dashboard (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo   SUCCESS! All 3 services have been launched!
echo.
echo   1. Frontend Dashboard : http://localhost:3000
echo   2. Backend Gateway API: http://localhost:5000
echo   3. ML Inference API   : http://localhost:8000
echo.
echo   Press any key to close this launcher window (services keep running).
echo =====================================================================
pause >nul
