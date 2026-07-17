import logging
import json
import asyncio
import redis.asyncio as redis
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from typing import List, Optional

from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.crud.crud_user import get_user_by_email

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected! Total clients: {len(self.active_connections)}")
        await websocket.send_json({"type": "system", "message": "Connected to Kerdion Live Prediction Stream"})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

async def listen_to_redis():
    """
    Background task that connects to Redis Pub/Sub and listens for new predictions 
    from the Celery worker, then broadcasts them to all connected WebSocket clients.
    """
    logger.info("Starting Redis Pub/Sub listener for WebSockets...")
    
    # Connect to the Redis container
    async with redis.from_url("redis://redis:6379/0", decode_responses=True) as r:
        pubsub = r.pubsub()
        await pubsub.subscribe("live-predictions-channel")
        
        try:
            # Infinite loop listening for messages
            async for message in pubsub.listen():
                if message["type"] == "message":
                    logger.info(f"WebSocket Manager received data from Redis!")
                    payload = json.loads(message["data"])
                    await manager.broadcast(payload)
        except asyncio.CancelledError:
            logger.info("Redis listener shutting down...")
        except Exception as e:
            logger.error(f"Redis listener error: {e}")

@router.websocket("/live-predictions")
async def live_predictions_ws(websocket: WebSocket, token: Optional[str] = Query(None)):
    payload = decode_access_token(token) if token else None
    if payload is None or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        user = await get_user_by_email(db, payload["sub"])
    if user is None or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)