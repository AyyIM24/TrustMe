Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  HealthGuard AI - Starting Services...   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Starting Backend Server (FastAPI on port 8000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd backend && python -m uvicorn main:app --reload --port 8000" -WindowStyle Normal

Write-Host "[INFO] Starting Frontend Dev Server (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd frontend && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Services spawned in new windows!        " -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000          " -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173          " -ForegroundColor Green
Write-Host "  API Docs: http://localhost:8000/docs     " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
