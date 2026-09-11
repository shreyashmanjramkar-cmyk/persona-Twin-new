'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  gender?: string;
}

export default function EditPersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    biography: '',
    personality_traits: '',
    interests: '',
    communication_style: '',
    preferred_tone: '',
    opinions: '',
    profile_image: '',
    gender: 'Neutral',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [extractUrl, setExtractUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async () => {
    if (!extractUrl.trim()) return;
    setExtracting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/extract-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: extractUrl }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          biography: data.biography || prev.biography,
          personality_traits: data.personality_traits || prev.personality_traits,
          interests: data.interests || prev.interests,
          communication_style: data.communication_style || prev.communication_style,
          preferred_tone: data.preferred_tone || prev.preferred_tone,
          opinions: data.opinions || prev.opinions,
          gender: data.gender || prev.gender,
        }));
        alert('Extraction successful! Form updated.');
      } else {
        alert('Failed to extract data from URL. Ensure the link is accessible.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during extraction.');
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Persona not found');
        return res.json();
      })
      .then((data: Persona) => {
        setFormData({
          name: data.name || '',
          biography: data.biography || '',
          personality_traits: data.personality_traits || '',
          interests: data.interests || '',
          communication_style: data.communication_style || '',
          preferred_tone: data.preferred_tone || '',
          opinions: data.opinions || '',
          profile_image: data.profile_image || '',
          gender: data.gender || 'Neutral',
        });
        setFetching(false);
      })
      .catch((err) => {
        console.error(err);
        setFetching(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setFormData({ ...formData, profile_image: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        router.push(`/personas/${id}`);
      } else {
        alert('Failed to update persona');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="max-w-3xl mx-auto text-gray-500 dark:text-gray-400">Loading persona details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6 space-x-4">
        <Link href={`/personas/${id}`} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit Persona</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors rounded-xl p-8 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Magic Auto-Fill</h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">Paste a link to a Wikipedia page, LinkedIn profile, Twitter (X), or Instagram to automatically generate the persona fields!</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/..."
              className="flex-1 bg-white dark:bg-gray-950 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={extracting || !extractUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {extracting ? 'Extracting...' : 'Auto-Fill'}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="shrink-0">
            {formData.profile_image ? (
              <img className="h-16 w-16 object-cover rounded-full" src={formData.profile_image} alt="Profile preview" />
            ) : (
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="block">
              <span className="sr-only">Choose profile photo</span>
              <input type="file" id="profile_photo_input" onChange={handleImageUpload} accept="image/*" className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700
              "/>
            </label>
            {formData.profile_image && (
              <button 
                type="button" 
                onClick={() => {
                  setFormData({ ...formData, profile_image: '' });
                  const fileInput = document.getElementById('profile_photo_input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }} 
                className="text-sm text-red-500 hover:text-red-700 self-start mt-1"
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. Alex"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange as any}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
          >
            <option value="Neutral">Neutral</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biography</label>
          <textarea
            name="biography"
            value={formData.biography}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="Short description of who they are..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personality Traits</label>
          <input
            type="text"
            name="personality_traits"
            value={formData.personality_traits}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. Curious, friendly, practical"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</label>
          <input
            type="text"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. Technology, cooking"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Communication Style</label>
          <input
            type="text"
            name="communication_style"
            value={formData.communication_style}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. Simple, direct and conversational"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Tone</label>
          <input
            type="text"
            name="preferred_tone"
            value={formData.preferred_tone}
            onChange={handleChange}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. Friendly and helpful"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opinions</label>
          <textarea
            name="opinions"
            value={formData.opinions}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
            placeholder="e.g. AI should be used to solve practical problems..."
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
