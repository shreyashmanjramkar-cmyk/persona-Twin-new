from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine, Base
from app.api import personas, chat, knowledge
from app.models import persona, memory

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Persona Twin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personas.router, prefix="/api/personas", tags=["personas"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Persona Twin Backend is running."}
