'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Persona {
  id: number;
  name: string;
  biography: string;
  profile_image?: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/`)
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPersonas();
      } else {
        alert('Failed to delete persona');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Personas</h1>
        <Link href="/personas/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Create Persona
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading personas...</div>
      ) : personas.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No personas found.</p>
          <p className="text-gray-600 dark:text-gray-500 mt-2">Create your first persona to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div key={persona.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                {persona.profile_image ? (
                  <img src={persona.profile_image} alt={persona.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2">{persona.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 line-clamp-3 text-sm">{persona.biography}</p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <Link href={`/personas/${persona.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  View Profile
                </Link>
                <button
                  onClick={() => handleDelete(persona.id, persona.name)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
