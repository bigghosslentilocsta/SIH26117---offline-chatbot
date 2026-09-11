"""
Authentication routes: login and registration.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import get_db
from models import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _serialize_user(doc: dict) -> dict:
    """Convert a MongoDB user document to a JSON-safe dict."""
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


@router.post("/login")
async def login(req: LoginRequest):
    """
    Validate credentials and return a JWT + user profile.
    """
    db = get_db()
    user = await db.users.find_one({"username": req.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="Account is disabled. Contact administrator.")

    token = create_access_token({
        "sub": str(user["_id"]),
        "username": user["username"],
        "role": user["role"],
    })

    # Log the login event
    await db.audit_logs.insert_one({
        "userId": str(user["_id"]),
        "action": "login",
        "details": f"User '{user['username']}' logged in",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    user_data = _serialize_user(user)
    return TokenResponse(access_token=token, user=UserProfile(**user_data))


@router.post("/register")
async def register(req: RegisterRequest):
    """
    Create a new user account.  In production this should be restricted to
    admin users; for development it is open.
    """
    db = get_db()

    # Check for existing username
    existing = await db.users.find_one({"username": req.username})
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user_doc = {
        "username": req.username,
        "password_hash": hash_password(req.password),
        "fullName": req.fullName,
        "dob": req.dob,
        "role": req.role,
        "workingSince": req.workingSince,
        "avatarUrl": "",
        "status": "active",
        "screenTimeMinutes": 0,
        "tokenUsageCount": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({
        "sub": str(result.inserted_id),
        "username": req.username,
        "role": req.role,
    })

    await db.audit_logs.insert_one({
        "userId": str(result.inserted_id),
        "action": "register",
        "details": f"New user '{req.username}' registered with role '{req.role}'",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    user_data = _serialize_user(user_doc)
    return TokenResponse(access_token=token, user=UserProfile(**user_data))
