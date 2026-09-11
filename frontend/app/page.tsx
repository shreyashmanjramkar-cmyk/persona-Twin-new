'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({ personas: 0, knowledge: 0, conversations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats({ personas: data.personas, knowledge: data.knowledge, conversations: data.conversations });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 bg-clip-text text-transparent">
        Welcome to Persona Twin
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Total Personas</h3>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.personas}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Knowledge Sources</h3>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.knowledge}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg transition-colors">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Conversations</h3>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.conversations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Start Chatting</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Interact with your digital personas and ask them anything based on their knowledge base.</p>
          <Link href="/chat" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Go to Chat →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:border-purple-500 dark:hover:border-purple-500 transition-colors group shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Manage Personas</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create new personas, edit existing ones, and manage their unique traits and knowledge.</p>
          <Link href="/personas" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            View Personas →
          </Link>
        </div>
      </div>
    </div>
  );
}
