@echo off
echo ===================================================
echo     Starting CogniSafe Full Platform Services
echo ===================================================

:: 1. Start the React Frontend in a new terminal window
echo [1/3] Starting Frontend (React/Vite) on http://localhost:5173...
start "CogniSafe Frontend" cmd /k "cd cognisafe-frontend && npm i && npm run dev"

:: 2. Start the FastAPI Backend in a new terminal window
echo [2/3] Starting Backend (FastAPI) on http://localhost:8000...
start "CogniSafe Backend" cmd /k "cd cognisafe-backend & (if exist venv\Scripts\activate call venv\Scripts\activate) & uvicorn main:app --reload --port 8000"

:: 3. Start the ML Pipeline in a new terminal window
echo [3/3] Starting ML Pipeline on http://localhost:7860...
start "CogniSafe Local ML Pipeline" cmd /k "cd cognisafe-deploy & (if exist venv\Scripts\activate call venv\Scripts\activate) & python api\main.py"

echo.
echo All services are launching in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:8000
echo - ML Pipeline: http://localhost:7860
echo.
pause
