// src/app/fetch-thumbnail/page.tsx
'use client';

import { useState } from 'react';

export default function FetchThumbnailPage() {
  const [usernames, setUsernames] = useState('');
  const [results, setResults] = useState<{ username: string; base64image: string }[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const fetchThumbnails = async () => {
    setError('');
    setResults([]);
    setIsLoading(true);

    if (!usernames) {
      setError('Please enter one or more usernames.');
      setIsLoading(false);
      return;
    }

    const usernameList = usernames.split('\n').map((u) => u.trim()).filter((u) => u);
    setProgress({ completed: 0, total: usernameList.length });

    try {
      for (let i = 0; i < usernameList.length; i++) {
        const username = usernameList[i];
        const response = await fetch(`/api/fetch-thumbnail?username=${username}`);
        const data = await response.json();

        // Prepare the result
        const result = {
          username,
          base64image: response.ok ? data.thumbnail : `Error: ${data.error || 'Failed to fetch thumbnail'}`,
        };

        // Update results immediately
        setResults((prev) => [...prev, result]);

        // Update progress
        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      }
    } catch (err) {
      console.error("Error fetching thumbnails:", err);
      setError('Failed to fetch thumbnails.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-purple-800 mb-4">Instagram Thumbnail Fetcher</h1>
      <textarea
        value={usernames}
        onChange={(e) => setUsernames(e.target.value)}
        placeholder="Enter usernames, one per line"
        className="border p-2 rounded w-full"
        rows={10}
      />
      <button
        onClick={fetchThumbnails}
        className="bg-purple-600 text-white p-2 rounded mt-2"
        disabled={isLoading}
      >
        {isLoading ? 'Fetching...' : 'Fetch Thumbnails'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {isLoading && (
        <div className="mt-4">
          <p className="text-gray-700">
            Progress: {progress.completed} / {progress.total}
          </p>
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl">Results:</h2>
          <table className="w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Username</th>
                <th className="border border-gray-300 p-2">Base64 Image</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{result.username}</td>
                  <td className="border border-gray-300 p-2">
                    <pre className="whitespace-pre-wrap break-all">{result.base64image}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}