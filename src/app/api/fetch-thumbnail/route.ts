// src/app/api/fetch-thumbnail/route.ts
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const url = `https://insload.com/download/pfp?v=https%3A%2F%2Fwww.instagram.com%2F${username}%2F`;

  try {
    const response = await axios.get(url);
    const html = response.data;

    // Use a regex to extract the image URL
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return NextResponse.json({ thumbnail: imgMatch[1] });
    } else {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}   