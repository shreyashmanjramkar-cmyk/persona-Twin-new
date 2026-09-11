from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.persona import Persona
from app.models.memory import Conversation, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, Source, MessageUpdate
from app.services.llm_service import llm_service
from app.services.vector_store import vector_store

router = APIRouter()

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    persona = db.query(Persona).filter(Persona.id == request.persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
        
    # Find or create conversation for this persona (for demo purposes)
    conv = db.query(Conversation).filter(Conversation.persona_id == persona.id).first()
    if not conv:
        conv = Conversation(persona_id=persona.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    # Save user message
    user_msg = ChatMessage(conversation_id=conv.id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()
    
    # Retrieve last 5 messages for memory context
    recent_msgs = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).order_by(ChatMessage.id.desc()).limit(5).all()
    recent_msgs.reverse()
    
    memory_context = "PREVIOUS CONVERSATION HISTORY:\n"
    for m in recent_msgs[:-1]: # exclude the current one which is at the end
        memory_context += f"{m.role.upper()}: {m.content}\n"
    
    # Retrieve relevant vector chunks
    vector_results = vector_store.search(persona_id=request.persona_id, query=request.message, limit=3)
    
    # Retrieve relevant graph facts
    from app.services.graph_store import graph_store
    graph_results = graph_store.retrieve_facts(persona_id=request.persona_id, query=request.message)
    
    context_chunks = []
    sources = []
    
    for result in vector_results:
        context_chunks.append(result.get('text', ''))
        sources.append(Source(
            source_name=result.get('source_name', 'Unknown'),
            source_type=result.get('source_type', 'vector')
        ))
        
    for fact in graph_results:
        fact_str = f"{fact['subject']} {fact['predicate']} {fact['object']}."
        context_chunks.append(fact_str)
        sources.append(Source(
            source_name=fact.get('source', 'Graph Memory'),
            source_type='graph'
        ))
    
    # Dedup sources
    unique_sources = []
    seen = set()
    for s in sources:
        if s.source_name not in seen:
            unique_sources.append(s)
            seen.add(s.source_name)
    
    import re
    url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    urls = url_pattern.findall(request.message)
    
    if urls:
        from app.services.document_service import document_service
        for url in urls:
            scraped_text = document_service.extract_text_from_url(url)
            if scraped_text:
                context_chunks.append(f"Content from {url}:\n{scraped_text[:2500]}")
                unique_sources.append(Source(
                    source_name=url,
                    source_type='live_url'
                ))
                
    context = memory_context + "\n\n" + "\n\n".join(context_chunks)
    
    response_text = llm_service.generate_persona_response(
        persona=persona, 
        context=context, 
        message=request.message
    )
    
    # Save assistant message
    asst_msg = ChatMessage(conversation_id=conv.id, role="assistant", content=response_text)
    db.add(asst_msg)
    db.commit()
    
    return ChatResponse(response=response_text, sources=unique_sources)

@router.get("/history/{persona_id}")
def get_chat_history(persona_id: int, db: Session = Depends(get_db)):
    # Find conversation for this persona
    conv = db.query(Conversation).filter(Conversation.persona_id == persona_id).first()
    if not conv:
        return []
        
    messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).order_by(ChatMessage.id.asc()).all()
    
    return [
        {"id": str(msg.id), "role": msg.role, "content": msg.content}
        for msg in messages
    ]

@router.delete("/history/{persona_id}")
def delete_chat_history(persona_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.persona_id == persona_id).first()
    if not conv:
        return {"status": "ok", "detail": "No history found"}
        
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).delete()
    db.commit()
    return {"status": "ok"}

@router.delete("/message/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(msg)
    db.commit()
    return {"status": "ok"}

@router.put("/message/{message_id}")
def update_message(message_id: int, message_update: MessageUpdate, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.content = message_update.content
    db.commit()
    db.refresh(msg)
    return {"id": str(msg.id), "role": msg.role, "content": msg.content}

@router.delete("/message-pair/{message_id}")
def delete_message_pair(message_id: int, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Also delete the immediate next message if it belongs to the assistant
    next_msg = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == msg.conversation_id,
        ChatMessage.id > msg.id
    ).order_by(ChatMessage.id.asc()).first()
    
    if next_msg and next_msg.role == "assistant":
        db.delete(next_msg)
        
    db.delete(msg)
    db.commit()
    return {"status": "ok"}

@router.post("/message/{message_id}/regenerate", response_model=ChatResponse)
def regenerate_message(message_id: int, message_update: MessageUpdate, db: Session = Depends(get_db)):
    user_msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not user_msg or user_msg.role != "user":
        raise HTTPException(status_code=404, detail="User message not found")
        
    user_msg.content = message_update.content
    
    # Delete all messages after this user message
    subsequent_msgs = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == user_msg.conversation_id,
        ChatMessage.id > user_msg.id
    ).all()
    
    for sm in subsequent_msgs:
        db.delete(sm)
        
    db.commit()
    
    conv = db.query(Conversation).filter(Conversation.id == user_msg.conversation_id).first()
    persona = db.query(Persona).filter(Persona.id == conv.persona_id).first()
    
    # Retrieve last 5 messages BEFORE this user message for memory context
    recent_msgs = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == user_msg.conversation_id,
        ChatMessage.id < user_msg.id
    ).order_by(ChatMessage.id.desc()).limit(5).all()
    recent_msgs.reverse()
    
    memory_context = "PREVIOUS CONVERSATION HISTORY:\n"
    for m in recent_msgs: 
        memory_context += f"{m.role.upper()}: {m.content}\n"
        
    vector_results = vector_store.search(persona_id=persona.id, query=user_msg.content, limit=3)
    from app.services.graph_store import graph_store
    graph_results = graph_store.retrieve_facts(persona_id=persona.id, query=user_msg.content)
    
    context_chunks = []
    sources = []
    
    for result in vector_results:
        context_chunks.append(result.get('text', ''))
        sources.append(Source(
            source_name=result.get('source_name', 'Unknown'),
            source_type=result.get('source_type', 'vector')
        ))
        
    for fact in graph_results:
        fact_str = f"{fact['subject']} {fact['predicate']} {fact['object']}."
        context_chunks.append(fact_str)
        sources.append(Source(
            source_name=fact.get('source', 'Graph Memory'),
            source_type='graph'
        ))
    
    unique_sources = []
    seen = set()
    for s in sources:
        if s.source_name not in seen:
            unique_sources.append(s)
            seen.add(s.source_name)
            
    import re
    url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    urls = url_pattern.findall(user_msg.content)
    
    if urls:
        from app.services.document_service import document_service
        for url in urls:
            scraped_text = document_service.extract_text_from_url(url)
            if scraped_text:
                context_chunks.append(f"Content from {url}:\n{scraped_text[:2500]}")
                unique_sources.append(Source(
                    source_name=url,
                    source_type='live_url'
                ))
    
    context = memory_context + "\n\n" + "\n\n".join(context_chunks)
    
    response_text = llm_service.generate_persona_response(
        persona=persona, 
        context=context, 
        message=user_msg.content
    )
    
    asst_msg = ChatMessage(conversation_id=user_msg.conversation_id, role="assistant", content=response_text)
    db.add(asst_msg)
    db.commit()
    
    return ChatResponse(response=response_text, sources=unique_sources)
