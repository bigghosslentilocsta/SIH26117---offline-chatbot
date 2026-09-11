"""
Pydantic models for request/response validation and MongoDB document schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ── Auth Models ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    fullName: str
    dob: str = ""
    role: str = "control-room"
    workingSince: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfile"


# ── User Models ──────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    username: str
    fullName: str
    dob: str = ""
    role: str = "control-room"
    workingSince: str = ""
    avatarUrl: str = ""
    status: str = "active"
    screenTimeMinutes: int = 0
    tokenUsageCount: int = 0


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


# ── Chat Models ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str = ""
    model: Optional[str] = None


class ChatSession(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    userId: str
    role: str
    sessionTitle: str = "New Chat"
    messages: list[ChatMessage] = []
    createdAt: str = ""
    updatedAt: str = ""


class ChatCreateRequest(BaseModel):
    role: str = "control-room"
    sessionTitle: str = "New Chat"
    messages: list[ChatMessage] = []


# ── Audit Log Models ─────────────────────────────────────────────────────────

class AuditLog(BaseModel):
    userId: str
    action: str
    details: str = ""
    timestamp: str = ""


# ── Telemetry Models ─────────────────────────────────────────────────────────

class TelemetryResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    vram_used_gb: float
    vram_total_gb: float
    vram_percent: float
    gpu_utilization: float
    tokens_per_second: float
    active_requests: int
    model_loaded: str
    uptime_seconds: float
    node_health: list[dict] = []
