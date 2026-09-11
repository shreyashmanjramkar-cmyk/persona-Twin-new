from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Dict, Any

from app.services.vector_store import vector_store
from app.services.document_service import document_service
from app.services.graph_store import graph_store

router = APIRouter()

class TextKnowledgeRequest(BaseModel):
    persona_id: int
    source_name: str
    text: str

@router.post("/text")
def ingest_text(request: TextKnowledgeRequest):
    # Simple chunking for now (Phase 6)
    chunks = [request.text[i:i+1000] for i in range(0, len(request.text), 1000)]
    
    metadata = {
        "source_name": request.source_name,
        "source_type": "text"
    }
    
    from app.services.graph_store import graph_store
    for chunk in chunks:
        vector_store.add_chunk(
            persona_id=request.persona_id,
            text=chunk,
            metadata=metadata
        )
        
        # Simple mock fact extraction for demo
        # In a real app, send chunk to LLM to extract JSON facts
        if "worked" in chunk.lower() or "like" in chunk.lower():
            graph_store.add_fact(
                persona_id=request.persona_id,
                subject="Alex",
                predicate="HAS_OPINION_ABOUT_OR_EXPERIENCE",
                object_val="AI/Tech",
                source=request.source_name
            )
    return {"status": "ok", "chunks_processed": len(chunks)}

@router.post("/url")
def ingest_url(request: TextKnowledgeRequest):
    text = document_service.extract_text_from_url(request.text) # Use text field for URL
    if not text:
        raise HTTPException(status_code=400, detail="Failed to extract text from URL")
        
    return _process_and_store_text(request.persona_id, request.source_name, text, "url")

@router.post("/upload")
async def ingest_upload(persona_id: int = Form(...), source_name: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    text = ""
    source_type = "document"
    
    if file.filename.lower().endswith('.pdf'):
        text = document_service.extract_text_from_pdf(content)
        source_type = "pdf"
    elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        text = document_service.extract_text_from_image(content)
        source_type = "image"
    else:
        # Assume text
        try:
            text = content.decode('utf-8')
            source_type = "text"
        except:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
    if not text:
        raise HTTPException(status_code=400, detail="Failed to extract text from file")
        
    return _process_and_store_text(persona_id, source_name, text, source_type)

def _process_and_store_text(persona_id: int, source_name: str, text: str, source_type: str):
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    metadata = {"source_name": source_name, "source_type": source_type}
    
    for chunk in chunks:
        vector_store.add_chunk(
            persona_id=persona_id,
            text=chunk,
            metadata=metadata
        )
        if "worked" in chunk.lower() or "like" in chunk.lower():
            graph_store.add_fact(
                persona_id=persona_id,
                subject="Alex",
                predicate="HAS_OPINION_ABOUT_OR_EXPERIENCE",
                object_val="AI/Tech",
                source=source_name
            )
            
    return {"status": "ok", "chunks_processed": len(chunks)}

@router.delete("/persona/{persona_id}")
def delete_persona_knowledge(persona_id: int):
    try:
        vector_store.delete_by_persona(persona_id)
        graph_store.delete_by_persona(persona_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
