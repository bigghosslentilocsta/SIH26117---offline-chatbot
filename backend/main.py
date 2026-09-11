import httpx
import json
import os
import random
import time
import psutil
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic.config import ConfigDict

from database import connect_db, close_db, get_db
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.chat_routes import router as chat_router
from routes.refinery_routes import router as refinery_router
from routes.refinery_routes import start_unit_simulation

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


# ── Lifespan: MongoDB connect/disconnect ─────────────────────────────────────
@asynccontextmanager
async def lifespan(application: FastAPI):
    """Manage MongoDB connection lifecycle."""
    await connect_db()

    # Seed a default admin user if no users exist
    db = get_db()
    if await db.users.count_documents({}) == 0:
        from auth import hash_password
        await db.users.insert_one({
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "fullName": "Plant Administrator",
            "dob": "01 Jan 1980",
            "role": "plant-admin",
            "workingSince": "Jan 2010",
            "avatarUrl": "",
            "status": "active",
            "screenTimeMinutes": 0,
            "tokenUsageCount": 0,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        print("[seed] Default admin user created (username: admin, password: admin123)")

    # Start the live unit telemetry simulation
    await start_unit_simulation()

    yield
    await close_db()


app = FastAPI(title="MRPL AI Workbench API", version="1.0.0", lifespan=lifespan)

# ── Include route modules ────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(refinery_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:1b")

SYSTEM_INSTRUCTION = (
    "You are an expert lead refining operations AI for Mangalore Refinery and Petrochemicals Limited (MRPL). "
    "CRITICAL RULES:\n"
    "1. Keep responses concise, brief, and structured in bullet points.\n"
    "2. Use precise oil and gas engineering terminology (e.g., DCS, LCV, anti-surge, slide valves, quench oil, feed throttling).\n"
    "3. NEVER suggest software resets, reboots, or state clearing.\n"
    "4. ENSURE INTERNAL CONSISTENCY: Do not give conflicting instructions in the same response (e.g., do not say both 'close valve' and 'maintain flow' for the same line).\n"
    "5. For emergency trips (like Wet Gas Compressor trips), prioritize immediate stabilization actions: shifting to manual control, opening spillback/anti-surge loops, and throttling unit feed."
)

# Authoritative emergency stabilization procedures keyed by keyword match.
# When the user reports one of these known trips/emergencies, the exact safe
# checklist below is injected into the prompt so the model responds with the
# correct, consistent, process-focused actions regardless of model size.
EMERGENCY_PROCEDURES = [
    {
        "keywords": ["wet gas compressor", "wgc", "wet gas", "compressor trip", "compressor tripped"],
        "procedure": (
            "1. Shift wet gas compressor controls to MANUAL immediately.\n"
            "2. Open the spillback / anti-surge valve to keep the compressor out of surge.\n"
            "3. Throttle (reduce) FCC unit fresh feed using the feed controllers to hold pressure.\n"
            "4. Route gas to the flare / blowdown per venting line per DCS pressure setpoint.\n"
            "5. Do NOT attempt an automatic restart until surge margin is restored and drum level is controlled."
        ),
    },
    {
        "keywords": ["furnace tube", "tube overheating", "overheat", "furnace trip", "burner", "flame out"],
        "procedure": (
            "1. Trip the furnace fuel gas on the local panel and isolate the burners.\n"
            "2. Verify quench / steam flow to the radiant tubes, do not starve tube cooling.\n"
            "3. Reduce coil outlet temperature target via DCS and throttle unit feed.\n"
            "4. Confirm tube-metal thermocouples for hotspots before any re-light.\n"
            "5. Purge the firebox before relighting per standard light-up procedure."
        ),
    },
    {
        "keywords": ["pump trip", "pump tripped", "loss of suction", "pump failure"],
        "procedure": (
            "1. Confirm the standby pump auto-starts; if not, start it manually on the DCS.\n"
            "2. Close the discharge valve on the tripped pump to prevent reverse flow.\n"
            "3. Monitor and control the downstream level / pressure via LCV and flow control.\n"
            "4. Throttle feed to maintain the suction vessel level within limits.\n"
            "5. Do not restart the failed pump until motor and seal temperatures are safe."
        ),
    },
    {
        "keywords": ["cooling water loss", "cooling water", "condenser", "overhead condenser", "loss of cooling", "overhead drum overpressure"],
        "procedure": (
            "1. Reduce crude charge through feed throttling to cut overhead heat load.\n"
            "2. Control top temperature by venting / pressure control on the overhead drum.\n"
            "3. Verify cooling water pumps and open the backup exchanger pass manually.\n"
            "4. Monitor reflux drums for level and route to flare / blowdown if overpressure.\n"
            "5. Hold unit at reduced rate until cooling water supply is restored."
        ),
    },
    {
        "keywords": ["fcc", "reactor", "regenerator", "slide valve", "catalyst circulation"],
        "procedure": (
            "1. Close the regenerator standpipe slide valves to isolate catalyst circulation.\n"
            "2. Reduce air / combustion air to the regenerator and maintain a safe bed level.\n"
            "3. Throttle FCC fresh feed to avoid afterburn in the regenerator.\n"
            "4. Open steam quench to the reactor to fluidize and strip contained hydrocarbons.\n"
            "5. Confirm regenerator delta-pressure and bed temperature stable before re-establishing circulation."
        ),
    },
]


def match_emergency(query: str) -> str:
    """Return the authoritative procedure text if the query matches a known
    emergency, otherwise an empty string.

    Matching requires BOTH:
      - a procedure keyword, AND
      - explicit emergency intent (a trip / loss / failure / overheat / alarm),
    so routine optimization or configuration questions never inject an
    emergency checklist by false positive.
    """
    q = (query or "").lower()

    intent_words = [
        "trip", "tripped", "failure", "failed", "loss", "lost", "overheat",
        "overheating", "alarm", "emergency", "shutdown", "shut down",
        "out of control", "leak", "rupture", "blocked", "plugged",
        "low flow", "no flow", "surge", "flame out", "flameout",
        "overpressure", "spillback", "running away", "runaway",
    ]
    has_intent = any(w in q for w in intent_words)

    if not has_intent:
        return ""

    for entry in EMERGENCY_PROCEDURES:
        if any(kw in q for kw in entry["keywords"]):
            return entry["procedure"]
    return ""


@app.on_event("startup")
async def warm_model():
    """Preload the model into memory so the first chat message is fast."""
    try:
        timeout = httpx.Timeout(connect=5.0, read=300.0, write=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": "",
                    "stream": False,
                    "keep_alive": "30m",
                },
            )
    except Exception:
        pass


class ChatRequest(BaseModel):
    prompt: str
    role: str = "general"


class TelemetryResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    vram_used_gb: float
    vram_total_gb: float
    vram_percent: float
    tokens_per_second: float
    active_requests: int
    model_loaded: str
    uptime_seconds: float
    gpu_utilization: float


_start_time = time.time()


@app.get("/api/telemetry")
async def get_telemetry() -> TelemetryResponse:
    uptime = time.time() - _start_time
    vram_used = round(random.uniform(2.1, 5.8), 1)
    vram_total = 8.0
    return TelemetryResponse(
        vram_used_gb=vram_used,
        vram_total_gb=vram_total,
        vram_percent=round((vram_used / vram_total) * 100, 1),
        tokens_per_second=round(random.uniform(18.5, 32.0), 1),
        active_requests=random.randint(0, 3),
        model_loaded=MODEL,
        uptime_seconds=round(uptime, 1),
        gpu_utilization=round(random.uniform(35.0, 85.0), 1),
    )


@app.post("/api/chat", response_model=None)
async def chat(req: ChatRequest) -> StreamingResponse:
    role_context = {
        "Control Room Engineer": "You are an expert control room engineer at MRPL refinery. Provide precise, data-driven answers about process control, DCS operations, and plant optimization.",
        "Safety & Health (SHE) Officer": "You are a Senior HSE (Safety, Health, Environment) officer at MRPL refinery. Provide thorough safety guidance, incident response, and compliance information.",
        "Field Technician": "You are a seasoned field technician at MRPL refinery. Give practical, hands-on maintenance and troubleshooting advice for refinery equipment.",
        "Plant Admin": "You are an administrative assistant at MRPL refinery. Help with documentation, scheduling, reports, and general plant administration queries.",
    }

    system_prompt = role_context.get(req.role, "You are a helpful AI assistant for MRPL refinery operations.")

    # Authoritative emergency stabilization procedures. When a user reports a
    # known trip/emergency, inject the exact safe checklist into the prompt so
    # the model gives correct, consistent, actionable steps regardless of model
    # size. This enforces SYSTEM_INSTRUCTION rule 5 deterministically.
    emergency_procedure = match_emergency(req.prompt)
    emergency_context = (
        f"\n\nKNOWN REFINERY EMERGENCY - AUTHORITATIVE STABILIZATION PROCEDURE "
        f"(follow these exact actions, in order, as the full answer):\n{emergency_procedure}"
        if emergency_procedure
        else ""
    )

    full_prompt = (
        f"{system_prompt}\n\n"
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"IMPORTANT FORMAT RULE: Respond immediately with at most 6 short bullet points "
        f"or a numbered checklist. No greeting, no introductory sentence, no closing "
        f"summary, no filler. First line must be the answer.{emergency_context}\n\n"
        f"User query: {req.prompt}"
    )

    payload = {
        "model": MODEL,
        "prompt": full_prompt,
        "stream": True,
        "keep_alive": "30m",
        "options": {
            "num_predict": 220,
            "temperature": 0.6,
        },
    }

    async def generate():
        try:
            timeout = httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", OLLAMA_URL, json=payload) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            chunk = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        yield json.dumps(
                            {
                                "delta": chunk.get("response", ""),
                                "done": bool(chunk.get("done", False)),
                                "model": MODEL,
                            }
                        ) + "\n"
                        if chunk.get("done"):
                            break
        except httpx.ConnectError:
            yield json.dumps(
                {
                    "error": (
                        "⚠️ Unable to connect to the local AI model (Ollama). "
                        "Please ensure the Ollama service is running and the model is loaded. "
                        "Run `ollama pull llama3.2:1b` to download the model."
                    )
                }
            ) + "\n"
        except httpx.TimeoutException:
            yield json.dumps(
                {
                    "error": "⚠️ The AI model took too long to respond. Please try a shorter prompt."
                }
            ) + "\n"
        except Exception as e:
            yield json.dumps({"error": f"⚠️ An error occurred: {str(e)}"}) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Telemetry Endpoint ──────────────────────────────────────────────────────
# Provides real hardware stats: CPU, RAM, disk, and simulated GPU/VRAM
# for the air-gapped environment.  Returns the shape that the frontend
# TelemetryPanel and PlantAdminPanel expect.

_start_time = time.time()


@app.get("/api/telemetry")
async def get_telemetry():
    """Return live system telemetry from the host machine."""
    cpu_pct = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    # In an air-gapped GPU server these would come from nvidia-smi / pynvml.
    # For development we derive plausible values from CPU + memory usage and
    # add small random jitter so the UI feels alive.
    base_gpu = min(cpu_pct + random.uniform(5, 20), 100)
    base_vram_used = round(mem.used / (1024**3) * 0.4 + random.uniform(0.2, 0.8), 2)
    base_vram_total = round(mem.total / (1024**3) * 0.6, 2)

    node_health = [
        {
            "id": "gpu-node-01",
            "name": "ollama-gpu-01",
            "role": "LLM Inference",
            "status": "healthy" if cpu_pct < 85 else "degraded",
            "uptime": f"{int((time.time() - _start_time) / 3600)}h {int(((time.time() - _start_time) % 3600) / 60)}m",
        },
        {
            "id": "db-node-01",
            "name": "db-primary",
            "role": "MongoDB",
            "status": "healthy",
            "uptime": f"{int((time.time() - _start_time) / 3600)}h {int(((time.time() - _start_time) % 3600) / 60)}m",
        },
        {
            "id": "cache-node-01",
            "name": "cache-redis",
            "role": "Session Store",
            "status": "healthy" if mem.percent < 80 else "degraded",
            "uptime": f"{int((time.time() - _start_time) / 3600)}h {int(((time.time() - _start_time) % 3600) / 60)}m",
        },
    ]

    return {
        "vram_used_gb": base_vram_used,
        "vram_total_gb": base_vram_total,
        "vram_percent": round((base_vram_used / base_vram_total) * 100, 1) if base_vram_total else 0,
        "gpu_utilization": round(base_gpu, 1),
        "tokens_per_second": round(random.uniform(18, 32), 1),
        "active_requests": random.randint(0, 3),
        "model_loaded": MODEL,
        "uptime_seconds": round(time.time() - _start_time),
        "cpu_percent": cpu_pct,
        "ram_percent": mem.percent,
        "ram_used_gb": round(mem.used / (1024**3), 2),
        "ram_total_gb": round(mem.total / (1024**3), 2),
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_percent": disk.percent,
        "node_health": node_health,
    }


# ── Audit Logs Endpoint ──────────────────────────────────────────────────────
@app.get("/api/audit-logs")
async def get_audit_logs(limit: int = 50):
    """Return recent audit log entries (admin only in production)."""
    from database import get_db
    db = get_db()
    logs = []
    async for doc in db.audit_logs.find().sort("timestamp", -1).limit(limit):
        doc["id"] = str(doc.pop("_id"))
        logs.append(doc)
    return logs


# ── Transcription Endpoint ───────────────────────────────────────────────────
# Accepts raw audio from the field technician's push-to-record widget and
# returns a transcription. In the air-gapped environment the browser's
# Web Speech API is preferred; this endpoint exists as a fallback for
# browsers that don't support SpeechRecognition.

class TranscribeRequest(BaseModel):
    text: str = ""  # Pre-transcribed text from Web Speech API
    audio_base64: str = ""  # Base64-encoded audio blob (fallback)


@app.post("/api/transcribe")
async def transcribe_audio(req: TranscribeRequest):
    """
    If the browser already transcribed via Web Speech API, echo it back.
    Otherwise, in a real deployment this would call Whisper or another
    local STT engine. For now we return the pre-transcribed text.
    """
    if req.text:
        return {"transcript": req.text, "confidence": 0.95, "engine": "web-speech-api"}

    if req.audio_base64:
        # Placeholder: In production, pipe to local Whisper model
        # whisper.transcribe(req.audio_base64)
        return {
            "transcript": "[Audio received — local STT model not configured]",
            "confidence": 0.0,
            "engine": "placeholder",
        }

    raise HTTPException(status_code=400, detail="No text or audio provided")