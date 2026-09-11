'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('General');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [personas, setPersonas] = useState<{id: number, name: string}[]>([]);
  const [selectedPersonaForClear, setSelectedPersonaForClear] = useState<number | null>(null);
  const [selectedPersonaForDeleteData, setSelectedPersonaForDeleteData] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/`)
        .then((res) => res.json())
        .then((data) => {
          setPersonas(data);
          // Only set default if not already selected
          if (data.length > 0) {
            setSelectedPersonaForClear(prev => prev || data[0].id);
            setSelectedPersonaForDeleteData(prev => prev || data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleClearPersonaChats = async () => {
    if (!selectedPersonaForClear) return;
    const persona = personas.find(p => p.id === selectedPersonaForClear);
    if (!window.confirm(`Are you sure you want to clear all chats for ${persona?.name}?`)) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/history/${selectedPersonaForClear}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Chat history cleared!');
      } else {
        alert('Failed to clear chats');
      }
    } catch (e) {
      console.error(e);
      alert('Error clearing chats');
    }
  };

  const handleDeletePersonaKnowledge = async () => {
    if (!selectedPersonaForDeleteData) return;
    const persona = personas.find(p => p.id === selectedPersonaForDeleteData);
    if (!window.confirm(`Are you sure you want to permanently delete all knowledge base data for ${persona?.name}?`)) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/knowledge/persona/${selectedPersonaForDeleteData}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Knowledge base deleted!');
      } else {
        alert('Failed to delete knowledge data');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting knowledge data');
    }
  };

  return (
    <>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-200">Settings</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 w-full max-w-3xl h-[600px] max-h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden transition-colors duration-200">
            
            {/* Sidebar inside modal */}
            <div className="w-1/3 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 pl-2">Settings</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('General')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'General' ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('Data Controls')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'Data Controls' ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                >
                  Data Controls
                </button>
                <button
                  onClick={() => setActiveTab('API Keys')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'API Keys' ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
                >
                  API Keys
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="w-2/3 p-8 relative flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'General' && (
                  <div className="space-y-8 animate-in fade-in duration-200 text-gray-900 dark:text-gray-100">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-800 pb-4">General Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Theme</div>
                        <div className="text-sm text-gray-500">Choose how the app looks</div>
                      </div>
                      <select 
                        value={mounted ? theme : 'system'} 
                        onChange={e => setTheme(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                      >
                        <option value="system">System</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Language</div>
                        <div className="text-sm text-gray-500">Select app interface language</div>
                      </div>
                      <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'Data Controls' && (
                  <div className="space-y-8 animate-in fade-in duration-200 text-gray-900 dark:text-gray-100">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-800 pb-4">Data Controls</h3>
                    
                    <div className="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Clear Persona Chat</div>
                          <div className="text-sm text-gray-500">Delete conversation history for a specific persona</div>
                        </div>
                        <div className="flex gap-2">
                          <select 
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                            value={selectedPersonaForClear || ''}
                            onChange={(e) => setSelectedPersonaForClear(Number(e.target.value))}
                          >
                            <option value="" disabled>Select Persona</option>
                            {personas.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={handleClearPersonaChats}
                            disabled={!selectedPersonaForClear}
                            className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Delete Persona Knowledge</div>
                        <div className="text-sm text-gray-500">Remove all uploaded resumes and documents for a specific persona</div>
                      </div>
                      <div className="flex gap-2">
                          <select 
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                            value={selectedPersonaForDeleteData || ''}
                            onChange={(e) => setSelectedPersonaForDeleteData(Number(e.target.value))}
                          >
                            <option value="" disabled>Select Persona</option>
                            {personas.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={handleDeletePersonaKnowledge}
                            disabled={!selectedPersonaForDeleteData}
                            className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                          >
                            Delete Data
                          </button>
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === 'API Keys' && (
                  <div className="space-y-8 animate-in fade-in duration-200 text-gray-900 dark:text-gray-100">
                    <h3 className="text-xl font-semibold border-b border-gray-200 dark:border-gray-800 pb-4">API Configuration</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium mb-1">Gemini / OpenAI API Key</label>
                        <div className="text-sm text-gray-500 mb-2">Used for generating AI responses. Currently configured via backend environment variables.</div>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            placeholder="sk-..." 
                            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 text-gray-900 dark:text-white"
                            disabled
                          />
                          <button className="bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-white px-4 py-2 rounded-lg transition-colors font-medium" disabled>
                            Save
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Note: Key management is currently handled on the backend for security.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
