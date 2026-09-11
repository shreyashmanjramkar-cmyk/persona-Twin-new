from pydantic import BaseModel
from typing import Optional

class PersonaBase(BaseModel):
    name: str
    biography: Optional[str] = None
    personality_traits: Optional[str] = None
    interests: Optional[str] = None
    communication_style: Optional[str] = None
    preferred_tone: Optional[str] = None
    background: Optional[str] = None
    opinions: Optional[str] = None
    important_facts: Optional[str] = None
    relationships: Optional[str] = None
    important_events: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = "Neutral"

class PersonaCreate(PersonaBase):
    pass

class PersonaUpdate(PersonaBase):
    name: Optional[str] = None

class PersonaResponse(PersonaBase):
    id: int

    class Config:
        from_attributes = True
