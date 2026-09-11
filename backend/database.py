"""
MongoDB async connection layer using Motor.
Provides the database client and helper for lifespan management.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "mrpl_workbench")

_client: AsyncIOMotorClient | None = None
_db = None


async def connect_db():
    """Initialise the MongoDB connection on application startup."""
    global _client, _db
    _client = AsyncIOMotorClient(MONGO_URI)
    _db = _client[MONGO_DB_NAME]

    # Create indexes for fast lookups
    await _db.users.create_index("username", unique=True)
    await _db.chats.create_index("userId")
    await _db.chats.create_index([("createdAt", -1)])
    await _db.audit_logs.create_index([("timestamp", -1)])
    await _db.unit_telemetry.create_index([("timestamp", -1)])
    return _db


async def close_db():
    """Gracefully close the MongoDB connection on shutdown."""
    global _client
    if _client:
        _client.close()


def get_db():
    """Return the active database handle (call after connect_db)."""
    if _db is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _db
