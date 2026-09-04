@echo off
echo ===================================================
echo   Launching Setumarg AI Logistics & Accessibility
echo   Smart India Hackathon 2026 (PS ID: SIH26002)
echo ===================================================
start "Setumarg Backend (FastAPI)" cmd /k "cd /d c:\SIH 2026 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
start "Setumarg Frontend (Vite React)" cmd /k "cd /d c:\SIH 2026\frontend && npm run dev"

echo.
echo Services launched in separate windows!
echo - Backend API:  http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo - Frontend UI:  http://localhost:5173
echo.
pause
