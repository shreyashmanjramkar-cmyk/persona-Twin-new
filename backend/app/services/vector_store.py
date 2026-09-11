import uuid
from typing import List, Dict, Any
from app.config import settings

class VectorStoreService:
    def __init__(self):
        self.use_qdrant = bool(settings.QDRANT_URL)
        if self.use_qdrant:
            try:
                from qdrant_client import QdrantClient
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY
                )
                print("Connected to Qdrant.")
            except Exception as e:
                print(f"Failed to connect to Qdrant: {e}. Falling back to local store.")
                self.use_qdrant = False
        
        if not self.use_qdrant:
            import chromadb
            self.client = chromadb.PersistentClient(path="./chroma_db")
            self.collection = self.client.get_or_create_collection("persona_twin")
            print("Connected to local ChromaDB fallback.")
            
    def embed_text(self, text: str) -> List[float]:
        # Simple fallback embedding if no LLM configured, just to make local run
        # In a real scenario, use Gemini Embeddings.
        # Here we mock it if gemini is not configured.
        import google.generativeai as genai
        api_key = settings.LLM_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        else:
            # Mock embedding vector of size 384
            return [0.0] * 384

    def add_chunk(self, persona_id: int, text: str, metadata: Dict[str, Any]):
        embedding = self.embed_text(text)
        chunk_id = str(uuid.uuid4())
        
        meta = metadata.copy()
        meta['persona_id'] = persona_id
        meta['text'] = text
        
        if self.use_qdrant:
            from qdrant_client.models import PointStruct
            self.client.upsert(
                collection_name="persona_twin",
                points=[PointStruct(id=chunk_id, vector=embedding, payload=meta)]
            )
        else:
            self.collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[meta],
                ids=[chunk_id]
            )
            
    def search(self, persona_id: int, query: str, limit: int = 3) -> List[Dict]:
        embedding = self.embed_text(query)
        
        if self.use_qdrant:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            results = self.client.search(
                collection_name="persona_twin",
                query_vector=embedding,
                query_filter=Filter(
                    must=[FieldCondition(key="persona_id", match=MatchValue(value=persona_id))]
                ),
                limit=limit
            )
            return [hit.payload for hit in results]
        else:
            results = self.collection.query(
                query_embeddings=[embedding],
                where={"persona_id": persona_id},
                n_results=limit
            )
            docs = []
            if results['metadatas'] and len(results['metadatas']) > 0:
                for meta in results['metadatas'][0]:
                    docs.append(meta)
            return docs

    def count(self) -> int:
        try:
            if self.use_qdrant:
                return self.client.count(collection_name="persona_twin").count
            else:
                return self.collection.count()
        except Exception:
            return 0

    def delete_by_persona(self, persona_id: int):
        if self.use_qdrant:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            try:
                self.client.delete(
                    collection_name="persona_twin",
                    points_selector=Filter(
                        must=[FieldCondition(key="persona_id", match=MatchValue(value=persona_id))]
                    )
                )
            except Exception:
                pass
        else:
            try:
                self.collection.delete(where={"persona_id": persona_id})
            except Exception:
                pass

vector_store = VectorStoreService()
