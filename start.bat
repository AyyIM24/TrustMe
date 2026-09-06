@echo off
echo ==========================================
echo   HealthGuard AI - Starting Services...
echo ==========================================
echo.

echo [INFO] Starting Backend Server (FastAPI on port 8000)...
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo [INFO] Starting Frontend Dev Server (Vite on port 5173)...
start cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo   Services spawned in new windows!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ==========================================
pause
