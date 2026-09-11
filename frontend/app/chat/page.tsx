'use client';
import { useState, useEffect, useRef } from 'react';

interface Persona {
  id: number;
  name: string;
  gender?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

export default function ChatPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAutoPlayVoice, setIsAutoPlayVoice] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>('');

  const speakMessage = (text: string, messageId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // If clicking the same message that's currently speaking, just stop it
    if (currentlySpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop anything else
    
    // Remove markdown links or extra punctuation that might sound weird
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, 'link').replace(/[*_]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Make it sound more human by slowing down slightly and picking a premium voice
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    
    const activeGender = personas.find(p => p.id === activePersona)?.gender || 'Neutral';
    
    const voices = window.speechSynthesis.getVoices();
    let bestVoice;
    
    if (activeGender === 'Male') {
      bestVoice = voices.find(v => v.name.includes('Google US English') && !v.name.includes('Female'))
               || voices.find(v => (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark')) && v.lang.startsWith('en'))
               || voices.find(v => v.lang.startsWith('en-'));
    } else if (activeGender === 'Female') {
      bestVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Google US English Female'))
               || voices.find(v => (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria')) && v.lang.startsWith('en'))
               || voices.find(v => v.lang.startsWith('en-'));
    } else {
      // Neutral / Default
      bestVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Google UK English'))
               || voices.find(v => v.name.includes('Premium') || v.name.includes('Enhanced'))
               || voices.find(v => v.lang.startsWith('en-'));
    }
                   
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);
    
    setCurrentlySpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          
          setInput(prev => {
            // We use the functional form of setInput, but we ignore prev because
            // we want to rely on the static originalInputRef captured when recording started
            const base = originalInputRef.current;
            return base + (base && !base.endsWith(' ') ? ' ' : '') + currentTranscript;
          });
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser. Try using Google Chrome.");
        return;
      }
      try {
        originalInputRef.current = input; // Capture input before we start listening
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/`)
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data);
        if (data.length > 0 && !activePersona) setActivePersona(data[0].id);
      });
  }, []);

  const fetchHistory = (personaId: number, silent = false) => {
    if (!silent) setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/history/${personaId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data || []);
      })
      .catch(err => console.error(err))
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    if (activePersona) {
      fetchHistory(activePersona);
    }
  }, [activePersona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activePersona) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: activePersona, message: userMessage.content }),
      });
      const data = await res.json();
      
      if (isAutoPlayVoice && data && data.response) {
        setTimeout(() => speakMessage(data.response, 'auto'), 100);
      }
      
      // Re-fetch history silently to get the real database IDs for both the new user message and assistant response
      fetchHistory(activePersona, true);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Network error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question? The answer will also be deleted.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/message-pair/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activePersona) fetchHistory(activePersona);
      } else {
        alert("Failed to delete message");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting message");
    }
  };

  const handleDeleteAssistantMessage = async (id: string) => {
    if (!window.confirm("Delete this response?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/message/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activePersona) fetchHistory(activePersona);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editContent.trim()) return;
    setEditingMessageId(null);
    setLoading(true);
    
    // Optimistically update the user's message in UI and drop subsequent messages
    const messageIndex = messages.findIndex(m => m.id === id);
    if (messageIndex !== -1) {
      const truncatedMessages = messages.slice(0, messageIndex + 1);
      truncatedMessages[messageIndex].content = editContent;
      setMessages(truncatedMessages);
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/message/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(), // Fallback ID, but history will correct it
          role: 'assistant',
          content: data.response || 'Sorry, an error occurred.',
          sources: data.sources || [],
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Refresh history to ensure perfectly synced IDs and state with backend
        if (activePersona) fetchHistory(activePersona);
      } else {
        alert("Failed to update message");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error updating message");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Chat with {activePersona ? personas.find(p => p.id === activePersona)?.name : 'Persona'}
        </h1>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isAutoPlayVoice} 
              onChange={(e) => setIsAutoPlayVoice(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            Auto-Play Voice
          </label>
          <select 
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            value={activePersona || ''}
            onChange={(e) => setActivePersona(Number(e.target.value))}
          >
            <option value="" disabled>Select a persona</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-4 flex flex-col gap-4 transition-colors">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center m-auto">
            Select a persona and start chatting.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`group flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2">
                {m.role === 'user' && editingMessageId !== m.id && !loading && m.id.length < 10 && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                    <button onClick={() => { setEditingMessageId(m.id); setEditContent(m.content); }} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDeleteMessage(m.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                )}
                
                {editingMessageId === m.id ? (
                  <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 min-w-[300px]">
                    <textarea 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMessageId(null)} className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Cancel</button>
                      <button onClick={() => handleEditSave(m.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 shadow-sm'}`}>
                    {m.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
                      if (part.match(/(https?:\/\/[^\s]+)/g)) {
                        return (
                          <a 
                            key={i} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`underline ${m.role === 'user' ? 'text-blue-200 hover:text-white' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
                          >
                            {part}
                          </a>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}
                
                {m.role === 'assistant' && !loading && m.id.length < 10 && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                    <button onClick={() => handleDeleteAssistantMessage(m.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                )}
                
                {m.role === 'assistant' && (
                  <button 
                    onClick={() => speakMessage(m.content, m.id)}
                    className={`ml-1 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${currentlySpeakingId === m.id || (currentlySpeakingId === 'auto' && messages[messages.length-1]?.id === m.id) ? 'text-blue-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    title={currentlySpeakingId === m.id ? "Stop Speaking" : "Read Aloud"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {currentlySpeakingId === m.id || (currentlySpeakingId === 'auto' && messages[messages.length-1]?.id === m.id) ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h3l4 4V4L10 8H7a2 2 0 00-2 2z" />
                      )}
                    </svg>
                  </button>
                )}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-gray-950 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                  Sources: {m.sources.map((s: any) => s.source_name).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl px-5 py-3 animate-pulse shadow-sm">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white shadow-sm"
          disabled={!activePersona || loading}
        />
        <button 
          type="button" 
          onClick={toggleListen}
          disabled={!activePersona || loading}
          className={`px-4 py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center border border-gray-200 dark:border-gray-700 ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500 dark:border-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title={isListening ? "Listening..." : "Voice Input"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button 
          type="submit" 
          disabled={!activePersona || loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:dark:bg-gray-800 disabled:text-gray-400 disabled:dark:text-gray-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
