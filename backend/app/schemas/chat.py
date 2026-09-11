from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    persona_id: int
    message: str

class Source(BaseModel):
    source_name: str
    source_type: str

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Source]] = []

class MessageUpdate(BaseModel):
    content: str
