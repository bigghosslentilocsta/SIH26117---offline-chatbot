"""
Chat persistence routes: save and retrieve conversation sessions.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import get_db
from models import ChatCreateRequest
from auth import get_current_user

router = APIRouter(prefix="/api/chats", tags=["chats"])


def _serialize_chat(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("")
async def list_chats(
    role: str = "",
    current_user: dict = Depends(get_current_user),
):
    """Return all chat sessions for the authenticated user, newest first."""
    db = get_db()
    query = {"userId": current_user["sub"]}
    if role:
        query["role"] = role

    sessions = []
    async for doc in db.chats.find(query).sort("updatedAt", -1).limit(50):
        sessions.append(_serialize_chat(doc))
    return sessions


@router.post("")
async def create_chat(
    body: ChatCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new chat session or update an existing one."""
    db = get_db()

    now = datetime.now(timezone.utc).isoformat()
    chat_doc = {
        "userId": current_user["sub"],
        "role": body.role,
        "sessionTitle": body.sessionTitle,
        "messages": [m.model_dump() for m in body.messages],
        "createdAt": now,
        "updatedAt": now,
    }

    result = await db.chats.insert_one(chat_doc)
    chat_doc["_id"] = result.inserted_id

    await db.audit_logs.insert_one({
        "userId": current_user["sub"],
        "action": "chat_create",
        "details": f"New chat session '{body.sessionTitle}'",
        "timestamp": now,
    })

    return _serialize_chat(chat_doc)


@router.put("/{chat_id}")
async def update_chat(
    chat_id: str,
    body: ChatCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing chat session (append messages, update title, etc.)."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    result = await db.chats.update_one(
        {"_id": ObjectId(chat_id), "userId": current_user["sub"]},
        {
            "$set": {
                "sessionTitle": body.sessionTitle,
                "messages": [m.model_dump() for m in body.messages],
                "updatedAt": now,
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return {"message": "Chat session updated", "updatedAt": now}


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a chat session."""
    db = get_db()
    result = await db.chats.delete_one(
        {"_id": ObjectId(chat_id), "userId": current_user["sub"]},
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return {"message": "Chat session deleted"}
