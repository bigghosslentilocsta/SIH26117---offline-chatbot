@echo off
echo ============================================
echo   MRPL AI Workbench - Startup
echo ============================================
if not exist .env copy .env.example .env >nul
echo.
echo [1/3] Building images...
docker compose build
echo.
echo [2/3] Starting containers...
docker compose up -d
echo.
echo [3/3] Pulling AI model (first run only)...
for /f "tokens=2 delims==" %%m in ('findstr /b "OLLAMA_MODEL=" .env') do set MODEL=%%m
if "%MODEL%"=="" set MODEL=llama3
docker compose exec -T ollama ollama pull %MODEL%
echo.
echo ============================================
echo   MRPL AI Workbench ready!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000/docs
echo   Ollama   : http://localhost:11434
echo ============================================
pause