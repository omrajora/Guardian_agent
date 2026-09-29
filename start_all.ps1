# Guardian Agent 2.0 - PowerShell Launcher
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "        GUARDIAN AGENT 2.0 - FULL SYSTEM LAUNCHER" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# 1. Start Python FastAPI ML Service
Write-Host "[1/3] Starting Python ML Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\ml'; python src/app.py"

Start-Sleep -Seconds 3

# 2. Start Backend Security Gateway
Write-Host "[2/3] Starting Backend Gateway (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\backend'; npm start"

Start-Sleep -Seconds 3

# 3. Start Frontend Dashboard
Write-Host "[3/3] Starting Frontend Dashboard (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host " All 3 services are now running in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend Dashboard : http://localhost:3000" -ForegroundColor White
Write-Host "   Backend Gateway API: http://localhost:5000" -ForegroundColor White
Write-Host "   ML Inference API   : http://localhost:8000" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Green
