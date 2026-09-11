"""
User profile routes: fetch profile, update password, list users (admin).
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import get_db
from models import UserProfile, PasswordUpdate, RegisterRequest
from auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/users", tags=["users"])

VALID_ROLES = {"control-room", "safety-officer", "field-technician", "plant-admin"}


def _serialize_user(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(user)


@router.put("/password")
async def update_password(
    body: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the authenticated user's password after verifying the current one."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=403, detail="Current password is incorrect")

    new_hashed = hash_password(body.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user["sub"])},
        {"$set": {"password_hash": new_hashed}},
    )

    await db.audit_logs.insert_one({
        "userId": current_user["sub"],
        "action": "password_change",
        "details": "Password updated successfully",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Password updated successfully"}


@router.get("")
async def list_users(current_user: dict = Depends(get_current_user)):
    """
    List all users. Only accessible by plant-admin role.
    """
    if current_user.get("role") != "plant-admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db = get_db()
    users = []
    async for doc in db.users.find().sort("username", 1):
        users.append(_serialize_user(doc))
    return users


@router.post("")
async def create_user(
    body: RegisterRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new user account (plant-admin only)."""
    if current_user.get("role") != "plant-admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}",
        )

    db = get_db()
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=409, detail="Username already exists")

    user_doc = {
        "username": body.username,
        "password_hash": hash_password(body.password),
        "fullName": body.fullName,
        "dob": body.dob,
        "role": body.role,
        "workingSince": body.workingSince,
        "avatarUrl": "",
        "status": "active",
        "screenTimeMinutes": 0,
        "tokenUsageCount": 0,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "createdBy": current_user.get("sub"),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    await db.audit_logs.insert_one({
        "userId": str(result.inserted_id),
        "action": "user_create",
        "details": f"User '{body.username}' created with role '{body.role}' by '{current_user.get('username')}'",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return _serialize_user(user_doc)


@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str = "active",
    current_user: dict = Depends(get_current_user),
):
    """Enable or disable a user account (admin only)."""
    if current_user.get("role") != "plant-admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await db.audit_logs.insert_one({
        "userId": current_user["sub"],
        "action": "user_status_change",
        "details": f"User {user_id} status changed to '{status}'",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": f"User status updated to '{status}'"}
