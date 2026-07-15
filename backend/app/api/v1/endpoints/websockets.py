import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """
    Manages active WebSocket connections.
    Tracks connected clients and handles broadcasting messages to all of them.
    """
    def __init__(self):
        # Store all active WebSocket connections in memory
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        # Accept the connection from the client
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected! Total clients: {len(self.active_connections)}")
        
        # Send a welcome message so the client knows it worked
        await websocket.send_json({
            "type": "system",
            "message": "Connected to Kerdion Live Prediction Stream"
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Pushes a JSON payload to every single connected user."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to a client: {e}")
                self.disconnect(connection)

# Instantiate the global manager
# (We will import this later in our Celery/Redis listener)
manager = ConnectionManager()

@router.websocket("/live-predictions")
async def live_predictions_ws(websocket: WebSocket):
    """
    The actual endpoint the frontend connects to: ws://localhost:8000/api/v1/ws/live-predictions
    """
    await manager.connect(websocket)
    try:
        # Keep the connection alive indefinitely
        while True:
            # We don't expect the frontend to send us data, but we must 
            # listen for disconnects or ping/pongs to keep the socket from closing.
            data = await websocket.receive_text()
            logger.debug(f"Received message from client: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)