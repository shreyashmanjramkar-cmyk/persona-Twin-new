from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models.persona import Persona

def create_sample_persona():
    db = SessionLocal()
    existing = db.query(Persona).filter(Persona.name == "Alex").first()
    if existing:
        print("Sample persona Alex already exists.")
        db.close()
        return

    alex = Persona(
        name="Alex",
        biography="Software engineering student interested in AI, software development and technology.",
        personality_traits="Curious, friendly, practical.",
        interests="Artificial Intelligence, Machine Learning, Software Development, Technology",
        communication_style="Simple, direct and conversational.",
        preferred_tone="Friendly and helpful",
        opinions="AI should be used to solve practical problems. Learning by building projects is important. Technology should be easy for people to understand.",
    )
    db.add(alex)
    db.commit()
    print("Created sample persona: Alex")
    db.close()

if __name__ == "__main__":
    create_sample_persona()
