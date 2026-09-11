import json
import os
from typing import List, Dict, Any
from app.config import settings

class GraphStoreService:
    def __init__(self):
        self.use_neo4j = bool(settings.NEO4J_URI)
        self.local_file = "data/local_graph.json"
        
        if self.use_neo4j:
            try:
                from neo4j import GraphDatabase
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
                )
                print("Connected to Neo4j.")
            except Exception as e:
                print(f"Failed to connect to Neo4j: {e}. Falling back to local store.")
                self.use_neo4j = False
                
        if not self.use_neo4j:
            print("Connected to local Graph fallback.")
            if not os.path.exists("data"):
                os.makedirs("data")
            if not os.path.exists(self.local_file):
                with open(self.local_file, "w") as f:
                    json.dump([], f)
                    
    def add_fact(self, persona_id: int, subject: str, predicate: str, object_val: str, source: str):
        fact = {
            "persona_id": persona_id,
            "subject": subject,
            "predicate": predicate,
            "object": object_val,
            "source": source
        }
        
        if self.use_neo4j:
            with self.driver.session() as session:
                session.run(
                    "MERGE (s:Entity {name: $subject}) "
                    "MERGE (o:Entity {name: $object_val}) "
                    "MERGE (s)-[r:RELATION {type: $predicate, persona_id: $persona_id, source: $source}]->(o)",
                    subject=subject, object_val=object_val, predicate=predicate, persona_id=persona_id, source=source
                )
        else:
            with open(self.local_file, "r") as f:
                data = json.load(f)
            data.append(fact)
            with open(self.local_file, "w") as f:
                json.dump(data, f, indent=2)

    def retrieve_facts(self, persona_id: int, query: str) -> List[Dict]:
        # Very simple semantic match mock for local fallback
        # In a real system, we extract entities from the query and traverse the graph
        keywords = query.lower().split()
        results = []
        
        if self.use_neo4j:
            # Basic retrieval for demo
            pass
        else:
            with open(self.local_file, "r") as f:
                data = json.load(f)
            
            for fact in data:
                if fact["persona_id"] == persona_id:
                    # Check if query mentions subject or object
                    if any(k in fact["subject"].lower() or k in fact["object"].lower() for k in keywords if len(k) > 3):
                        results.append(fact)
                        
        return results

    def count(self) -> int:
        try:
            if self.use_neo4j:
                with self.driver.session() as session:
                    result = session.run("MATCH (n) RETURN count(n) as c")
                    return result.single()["c"]
            else:
                if os.path.exists(self.local_file):
                    with open(self.local_file, "r") as f:
                        data = json.load(f)
                    return len(data)
                return 0
        except Exception:
            return 0

    def delete_by_persona(self, persona_id: int):
        if self.use_neo4j:
            try:
                with self.driver.session() as session:
                    session.run(
                        "MATCH ()-[r:RELATION {persona_id: $persona_id}]->() DELETE r",
                        persona_id=persona_id
                    )
            except Exception:
                pass
        else:
            if os.path.exists(self.local_file):
                try:
                    with open(self.local_file, "r") as f:
                        data = json.load(f)
                    new_data = [d for d in data if d.get("persona_id") != persona_id]
                    with open(self.local_file, "w") as f:
                        json.dump(new_data, f, indent=2)
                except Exception:
                    pass

graph_store = GraphStoreService()
