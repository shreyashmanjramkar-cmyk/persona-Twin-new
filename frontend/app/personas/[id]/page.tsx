'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Persona {
  id: number;
  name: string;
  biography: string;
  personality_traits: string;
  interests: string;
  communication_style: string;
  preferred_tone: string;
  opinions: string;
  profile_image?: string;
}

export default function ViewPersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Persona not found');
        return res.json();
      })
      .then((data) => {
        setPersona(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/personas" className="text-gray-500 dark:text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">View Persona</h1>
        </div>
        
        {persona && (
          <Link href={`/personas/${id}/edit`} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Edit
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading persona details...</div>
      ) : !persona ? (
        <div className="text-red-400">Persona not found.</div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors rounded-xl p-8 space-y-6">
          <div className="flex items-center space-x-6 mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {persona.profile_image ? (
                <img src={persona.profile_image} alt={persona.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{persona.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{persona.biography}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Personality Traits</h3>
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 min-h-[80px]">
                {persona.personality_traits || 'Not specified'}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Interests</h3>
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 min-h-[80px]">
                {persona.interests || 'Not specified'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Communication Style</h3>
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 min-h-[80px]">
                {persona.communication_style || 'Not specified'}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Preferred Tone</h3>
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 min-h-[80px]">
                {persona.preferred_tone || 'Not specified'}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Opinions</h3>
              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300 min-h-[80px]">
                {persona.opinions || 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
