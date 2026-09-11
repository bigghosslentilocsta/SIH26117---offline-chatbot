@echo off
REM Clean launcher for the low-RAM local backend.
REM Uses quoted set syntax so NO trailing whitespace is ever captured in the variable.
set "OLLAMA_URL=http://127.0.0.1:11434/api/generate"
set "OLLAMA_MODEL=llama3.2:1b"
cd /d "%~dp0\.."
python -m uvicorn main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
