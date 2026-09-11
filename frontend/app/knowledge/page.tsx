'use client';
import { useState, useEffect } from 'react';

interface Persona {
  id: number;
  name: string;
}

export default function KnowledgePage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/`)
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data);
        if (data.length > 0) setActivePersona(data[0].id);
      });
  }, []);

  const handleIngestText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePersona || !text.trim() || !sourceName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/knowledge/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: activePersona,
          source_name: sourceName,
          text: text,
        }),
      });

      if (res.ok) {
        alert('Knowledge ingested successfully!');
        setSourceName('');
        setText('');
      } else {
        alert('Failed to ingest knowledge.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Knowledge Base</h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Add Text Knowledge</h2>
        <form onSubmit={handleIngestText} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Persona</label>
            <select
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              value={activePersona || ''}
              onChange={(e) => setActivePersona(Number(e.target.value))}
              required
            >
              <option value="" disabled>Select a persona</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source Name</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              placeholder="e.g. My Resume, My Blog Post about AI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Content</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Paste the text here..."
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Ingesting...' : 'Ingest Text'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Add URL Knowledge</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!activePersona || !sourceName.trim() || !text.trim()) return;
          setLoading(true);
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/knowledge/url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ persona_id: activePersona, source_name: sourceName, text: text }), // Using text for URL
            });
            if (res.ok) { alert('URL ingested successfully!'); setSourceName(''); setText(''); }
            else { alert('Failed to ingest URL.'); }
          } catch (err) { alert('Error occurred'); } finally { setLoading(false); }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
            <input type="url" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white" placeholder="https://example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source Name</label>
            <input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white" placeholder="Example Blog" required />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg mt-4">Ingest URL</button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
        <h2 className="text-xl font-bold mb-4">Upload File (PDF/Image)</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as HTMLFormElement;
          const fileInput = target.elements.namedItem('file') as HTMLInputElement;
          const nameInput = target.elements.namedItem('source_name') as HTMLInputElement;
          if (!activePersona || !fileInput.files?.[0] || !nameInput.value) return;
          
          setLoading(true);
          const formData = new FormData();
          formData.append('persona_id', activePersona.toString());
          formData.append('source_name', nameInput.value);
          formData.append('file', fileInput.files[0]);
          
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/knowledge/upload`, {
              method: 'POST',
              body: formData,
            });
            if (res.ok) { alert('File uploaded successfully!'); target.reset(); }
            else { alert('Failed to upload file.'); }
          } catch (err) { alert('Error occurred'); } finally { setLoading(false); }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File</label>
            <input type="file" name="file" className="w-full text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source Name</label>
            <input type="text" name="source_name" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white" placeholder="My Document" required />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg mt-4">Upload File</button>
        </form>
      </div>
    </div>
  );
}
