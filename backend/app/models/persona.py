from sqlalchemy import Column, Integer, String, Text
from app.db import Base

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    biography = Column(Text)
    personality_traits = Column(Text)
    interests = Column(Text)
    communication_style = Column(Text)
    preferred_tone = Column(String)
    background = Column(Text)
    opinions = Column(Text, nullable=True)
    important_facts = Column(Text, nullable=True)
    relationships = Column(Text, nullable=True)
    important_events = Column(Text, nullable=True)
    gender = Column(String, default="Neutral")
    
    # Vector DB tracking
    vector_id = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
