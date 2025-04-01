// src/app/fetch-thumbnail/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image'; // Import the Image component

export default function FetchThumbnailPage() {
  const [username, setUsername] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [error, setError] = useState('');

  const fetchThumbnail = async () => {
    setError('');
    setThumbnail('');

    if (!username) {
      setError('Please enter a username.');
      return;
    }

    try {
      const response = await fetch(`/api/fetch-thumbnail?username=${username}`);
      const data = await response.json();

      if (response.ok) {
        setThumbnail(data.thumbnail);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error fetching thumbnail:", err); //Log the error
      setError('Failed to fetch thumbnail.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-purple-800 mb-4">Instagram Thumbnail Fetcher</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username (e.g., kndhifa)"
        className="border p-2 rounded"
      />
      <button onClick={fetchThumbnail} className="bg-purple-600 text-white p-2 rounded ml-2">
        Fetch Thumbnail
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {thumbnail && (
        <div className="mt-4">
          <h2 className="text-xl">Thumbnail for @{username}:</h2>
          <Image
            src={thumbnail}
            alt={`Thumbnail of ${username}`}
            width={100}  // Adjust width and height as needed
            height={100}
            className="mt-2 rounded-full" //circular thumbnail
          />
        </div>
      )}
    </div>
  );
}