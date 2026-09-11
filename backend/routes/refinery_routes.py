"""
Refinery operations routes: unit telemetry, active permits, field alerts.
Includes a background task that gently fluctuates unit metrics.
"""
import asyncio
import random
from datetime import datetime, timezone

from fastapi import APIRouter

from database import get_db

router = APIRouter(prefix="/api/refinery", tags=["refinery"])

# ── Unit baselines & live state ──
_UNIT_BASELINES = {
    "CDU-101": {"id": "cdu", "name": "CDU-101", "label": "Crude Distillation Unit",
                 "base_temp": 345.0, "base_pressure": 1.2, "base_feed_rate": 420.0, "base_yield": 87.5,
                 "color": "blue"},
    "VDU-201": {"id": "vdu", "name": "VDU-201", "label": "Vacuum Distillation Unit",
                 "base_temp": 412.0, "base_pressure": 0.08, "base_feed_rate": 180.0, "base_yield": 91.2,
                 "color": "amber"},
    "FCCU-301": {"id": "fccu", "name": "FCCU-301", "label": "Fluid Catalytic Cracking",
                  "base_temp": 530.0, "base_pressure": 2.1, "base_feed_rate": 150.0, "base_yield": 78.9,
                  "color": "emerald"},
}

_live_units: dict = {}

def _initialize_units():
    for key, b in _UNIT_BASELINES.items():
        _live_units[key] = {
            "id": b["id"], "name": b["name"], "label": b["label"],
            "status": "normal", "temp": b["base_temp"], "pressure": b["base_pressure"],
            "feed_rate": b["base_feed_rate"], "yield_pct": b["base_yield"], "color": b["color"],
        }

_initialize_units()

async def _fluctuate_units():
    """Background coroutine: gently random-walk unit metrics every ~3s
    and persist the latest snapshot to the `unit_telemetry` collection."""
    while True:
        await asyncio.sleep(3)
        now = datetime.now(timezone.utc).isoformat()
        for key, b in _UNIT_BASELINES.items():
            u = _live_units[key]
            u["temp"] = round(b["base_temp"] + random.uniform(-3, 3), 1)
            u["pressure"] = round(b["base_pressure"] + random.uniform(-0.05, 0.05), 2)
            u["feed_rate"] = round(b["base_feed_rate"] + random.uniform(-8, 8), 1)
            u["yield_pct"] = round(b["base_yield"] + random.uniform(-1.5, 1.5), 1)
            temp_dev = abs(u["temp"] - b["base_temp"])
            u["status"] = "critical" if random.random() < 0.005 else ("warning" if temp_dev > 2.5 else "normal")
            if u["status"] == "critical":
                u["temp"] = round(b["base_temp"] + random.uniform(5, 10), 1)

        # Persist snapshot to MongoDB `unit_telemetry` collection
        try:
            await get_db().unit_telemetry.insert_one({
                "timestamp": now,
                "units": [_live_units[k] | {"sampleTime": now} for k in _UNIT_BASELINES],
            })
        except Exception:
            pass  # Non-fatal: in-memory state still serves live requests

# ── Seed data ──
_ACTIVE_PERMITS = [
    {"id": "PTW-0412", "type": "Hot Work", "area": "FCCU-301", "status": "Active", "expiry": "18:00", "issuedBy": "SHE-Dept"},
    {"id": "PTW-0415", "type": "Confined Space", "area": "CDU-102", "status": "Active", "expiry": "20:00", "issuedBy": "SHE-Dept"},
    {"id": "PTW-0409", "type": "Electrical", "area": "VDU-201", "status": "Expired", "expiry": "14:00", "issuedBy": "SHE-Dept"},
    {"id": "PTW-0418", "type": "Working at Height", "area": "CDU-101", "status": "Active", "expiry": "22:00", "issuedBy": "SHE-Dept"},
    {"id": "PTW-0420", "type": "Excavation", "area": "utilities", "status": "Active", "expiry": "17:00", "issuedBy": "SHE-Dept"},
]

_FIELD_ALERTS = [
    {"label": "Pump Vibration Alert", "area": "P-104A (CDU)", "level": "warning", "equipmentTag": "P-104A"},
    {"label": "Heat Exchanger Fouling", "area": "E-205 (VDU)", "level": "warning", "equipmentTag": "E-205"},
    {"label": "Control Valve Stiction", "area": "LCV-3012 (FCCU)", "level": "info", "equipmentTag": "LCV-3012"},
    {"label": "Level Transmitter Drift", "area": "LT-108 (CDU)", "level": "info", "equipmentTag": "LT-108"},
]

_ACTIVE_ALARMS = [
    {"id": "ALM-1001", "unit": "CDU-101", "tag": "TI-1012", "description": "Column overhead temperature high", "priority": "high", "status": "active"},
    {"id": "ALM-1002", "unit": "VDU-201", "tag": "PI-2005", "description": "Vacuum pump vibration above threshold", "priority": "medium", "status": "active"},
    {"id": "ALM-1003", "unit": "FCCU-301", "tag": "FI-3010", "description": "Regenerator air flow low", "priority": "low", "status": "acknowledged"},
    {"id": "ALM-1004", "unit": "CDU-101", "tag": "LI-1008", "description": "Reflux drum level rising", "priority": "medium", "status": "active"},
    {"id": "ALM-1005", "unit": "VDU-201", "tag": "TI-2015", "description": "Bottoms temperature above setpoint", "priority": "high", "status": "active"},
]

_UNIT_LOGS = [
    {"time": "", "level": "INFO", "msg": "CDU-101 temperature stabilized at setpoint"},
    {"time": "", "level": "WARN", "msg": "VDU-201 vacuum pump vibration above threshold"},
    {"time": "", "level": "INFO", "msg": "FCCU-301 regenerator air rate adjusted"},
    {"time": "", "level": "INFO", "msg": "All unit interlocks verified — no bypass active"},
]


# ── API Endpoints ──────────────────────────────────────────────────────────────

@router.get("/units")
async def get_units():
    """Return live telemetry for all refinery units."""
    return {"units": list(_live_units.values()), "updated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/permits")
async def get_permits():
    """Return active permit-to-work list."""
    return {"permits": _ACTIVE_PERMITS}


@router.get("/alerts")
async def get_alerts():
    """Return field equipment alerts."""
    return {"alerts": _FIELD_ALERTS}


@router.get("/alarms")
async def get_alarms():
    """Return active DCS alarms."""
    now = datetime.now(timezone.utc).isoformat()
    for a in _ACTIVE_ALARMS:
        a.setdefault("timestamp", now)
    return {"alarms": _ACTIVE_ALARMS}


@router.get("/logs")
async def get_unit_logs():
    """Return recent unit event logs."""
    now = datetime.now(timezone.utc).strftime("%H:%M")
    for l in _UNIT_LOGS:
        l.setdefault("time", now)
    return {"logs": list(_UNIT_LOGS)}


async def start_unit_simulation():
    """Kick off the unit telemetry fluctuation coroutine (called from lifespan)."""
    asyncio.create_task(_fluctuate_units())