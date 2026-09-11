from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.6-flash"
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    NEO4J_URI: str = ""
    NEO4J_USERNAME: str = ""
    NEO4J_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    TWITTER_USERNAME: str = ""
    TWITTER_EMAIL: str = ""
    TWITTER_PASSWORD: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
