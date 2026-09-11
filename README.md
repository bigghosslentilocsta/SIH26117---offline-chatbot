# MRPL AI Workbench

A 100% offline, air-gapped enterprise AI workbench for MRPL refinery operations.

## Features

- **Fully Offline AI**: Local Llama 3 model via Ollama - no external network calls
- **Role-Based Views**: Switch between Control Room Engineer, Safety Officer SHE, Field Technician, and Plant Admin
- **Industrial Light Theme**: Clean slate/charcoal with industrial blue/amber accents
- **Glassmorphism UI**: Frosted light-glass cards over the MRPL refinery background
- **Live Telemetry**: VRAM, token speed, GPU utilization monitoring
- **Docker Compose**: One-command deployment

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│   Ollama    │
│ React+Vite  │     │  FastAPI    │     │  Llama 3    │
│  Nginx :80  │     │   :8000     │     │  :11434     │
└─────────────┘     └─────────────┘     └─────────────┘
   :3000
```

## Prerequisites

- Docker Desktop (with WSL2 backend) **or** native Ollama for Windows
- Model-dependent hardware (see table below)
- ~5GB free disk for the model + 2GB for images

### Hardware vs Model Choice (important!)

Choose the model that fits your machine. **Using a model that exceeds your RAM will
cause it to freeze, crash, or take minutes per reply.**

| Model | Size | Min RAM | Recommended for |
|-------|------|---------|-----------------|
| `llama3.2:1b` | 1.3 GB | 4 GB | Laptops, 4–8 GB RAM |
| `phi3:mini` | 2.2 GB | 6 GB | 8 GB RAM machines |
| `llama3.2:3b` | 2.5 GB | 8 GB | 8–16 GB RAM |
| `llama3` (8B) | 4.7 GB | 12 GB | 16 GB+ RAM, GPU |

Set the model with the `OLLAMA_MODEL` variable in your `.env` file.

## Quick Start

1. **Copy the env template and pick your model** (low-RAM laptop? use a small model):

   ```bash
   copy .env.example .env
   # edit .env -> set OLLAMA_MODEL=llama3.2:1b  (or llama3 for 16GB+ machines)
   ```

2. **Create the background image** (or replace with a real daytime MRPL refinery photo):

   ```
   Place your refinery image at: frontend/public/mrpl-refinery.jpg
   ```

2. **Build and start the stack**:

   ```bash
   docker compose up -d --build
   ```

3. **Build and pull the model** (first time only, needs internet):

   ```bash
   docker compose exec ollama ollama pull llama3
   ```

4. **Open the app**:

   ```
   http://localhost:3000
   ```

## Endpoints

- `POST /api/chat` - Send prompt with `{"prompt": "...", "role": "..."}`
- `GET /api/telemetry` - Get mock VRAM/token stats
- Frontend UI at `http://localhost:3000`
- FastAPI docs at `http://localhost:8000/docs`

## Local Development (without Docker)

```bash
# Backend
pip install -r backend/requirements.txt
uvicorn main:app --app-dir backend --reload

# Frontend
cd frontend
npm install
npm run dev

# Run full validation suite
python scripts/validate.py
```

For a production-like local test (built frontend + API proxying), use:

```bash
python scripts/dev_server.py   # serves frontend/dist on :3000, proxies /api -> :8000
```

### Running directly on a low-RAM laptop (no Docker)

If you have <8GB RAM, skip Docker Desktop entirely and run natively:

1. **Install Ollama for Windows** from https://ollama.com/download
2. Pull a small model:
   ```bash
   ollama pull llama3.2:1b
   ```
3. Point the backend at the native Ollama and set the small model:
   ```powershell
   $env:OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
   $env:OLLAMA_MODEL = "llama3.2:1b"
   uvicorn main:app --app-dir backend --reload
   ```
4. Serve the frontend as usual (`python scripts/dev_server.py`).

## Role-Based Views

| Role | Focus |
|------|-------|
| Control Room Engineer | DCS, process control, optimization |
| Safety Officer SHE | HSE compliance, incidents, safety |
| Field Technician | Maintenance, troubleshooting |
| Plant Admin | Documentation, scheduling, reports |

## Network Security

- All services communicate over the internal `mrpl_net` Docker bridge network
- No outbound internet access required at runtime (except initial image pull)
- Frontend proxies API calls to backend internally
- All AI inference happens locally on-device

## Troubleshooting

- **Model not responding**: Ensure Llama 3 is pulled: `docker compose exec ollama ollama pull llama3`
- **Slow first response**: The model may take 30-60s to load into VRAM initially
- **VRAM issues**: Reduce model context or use a smaller model (e.g., llama3:8b)