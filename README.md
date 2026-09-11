# Persona Twin

Persona Twin is a web application with a chat interface where an AI responds like a selected real person. The response reflects that person's reactions, tone, opinions, knowledge, communication style, and relevant memories.

## Features
- **Persona Management:** Create and edit personas with unique backgrounds and traits.
- **Knowledge Ingestion:** Add text, URLs, and files to the persona's knowledge base.
- **Chat Interface:** Chat with the AI persona, leveraging its specific knowledge and communication style.
- **Conversation Memory:** The AI remembers past conversations.
- **Source Transparency:** View the exact knowledge chunks used to generate responses.

## Architecture & Technology Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI, Python, SQLAlchemy
- **Vector DB:** Qdrant (with ChromaDB local fallback)
- **Graph DB:** Neo4j (with local JSON fallback)
- **LLM:** Google Gemini (via `google-generativeai`)

## Requirements
- Node.js & npm
- Python 3.9+
- Gemini API Key

## Setup & Installation

### Environment Configuration
1. Rename `.env.example` to `.env` in the root folder.
2. Add your `LLM_API_KEY` (Gemini API key).
3. (Optional) Add your Qdrant and Neo4j credentials. If omitted, the app will use local SQLite/JSON/ChromaDB fallbacks.

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

## Demo Instructions
1. Open [http://localhost:3000](http://localhost:3000).
2. Go to **Personas** and verify that "Alex" is created (if you ran `python app/utils/sample_data.py`).
3. Go to **Knowledge** and paste some facts about Alex (e.g., "Alex worked at Google", "Alex loves building AI apps").
4. Go to **Chat**, select Alex, and ask "Where did you work?".
5. Check the sources attached to the response.

## Known Limitations
- The local graph fallback uses a simple JSON file and rudimentary keyword matching rather than full Cypher graph traversal.
- Advanced file extraction (PDF/Images) requires proper Gemini vision models and `pypdf` which might fail on complex layouts.
