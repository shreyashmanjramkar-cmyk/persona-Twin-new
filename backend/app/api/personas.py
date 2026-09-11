from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.models.persona import Persona
from app.models.memory import Conversation
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaResponse
from app.services.vector_store import vector_store
from app.services.graph_store import graph_store
from pydantic import BaseModel

router = APIRouter()

class URLExtractRequest(BaseModel):
    url: str

@router.post("/extract-from-url")
def extract_from_url(req: URLExtractRequest):
    from app.services.document_service import document_service
    from app.services.llm_service import llm_service
    
    text = document_service.extract_text_from_url(req.url)
    if not text:
        raise HTTPException(status_code=400, detail="Failed to extract text from URL.")
        
    extracted_data = llm_service.extract_persona_fields(text, req.url)
    return extracted_data

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    persona_count = db.query(Persona).count()
    conversation_count = db.query(Conversation).count()
    knowledge_count = vector_store.count() + graph_store.count()
    return {
        "personas": persona_count,
        "knowledge": knowledge_count,
        "conversations": conversation_count
    }

@router.post("/", response_model=PersonaResponse)
def create_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    db_persona = Persona(**persona.model_dump())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.get("/", response_model=List[PersonaResponse])
def get_personas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Persona).offset(skip).limit(limit).all()

@router.get("/{persona_id}", response_model=PersonaResponse)
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    db_persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return db_persona

@router.put("/{persona_id}", response_model=PersonaResponse)
def update_persona(persona_id: int, persona: PersonaUpdate, db: Session = Depends(get_db)):
    db_persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    update_data = persona.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_persona, key, value)
    
    db.commit()
    db.refresh(db_persona)
    return db_persona

@router.delete("/{persona_id}")
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    db_persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    db.delete(db_persona)
    db.commit()
    return {"status": "ok"}
