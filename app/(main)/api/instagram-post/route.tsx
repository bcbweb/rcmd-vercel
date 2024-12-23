import { NextResponse } from 'next/server';

// Move these to environment variables
const APP_ACCESS_TOKEN = process.env.INSTAGRAM_APP_ACCESS_TOKEN;
const API_VERSION = 'v21.0'; // Current version from docs

export async function POST(request: Request) {
  try {
    const { postUrl } = await request.json();

    if (!postUrl) {
      return NextResponse.json(
        { error: 'Post URL is required' },
        { status: 400 }
      );
    }

    // Construct the Graph API URL with required parameters
    const graphApiUrl = new URL(`https://graph.facebook.com/${API_VERSION}/instagram_oembed`);
    graphApiUrl.searchParams.append('url', postUrl);
    graphApiUrl.searchParams.append('access_token', APP_ACCESS_TOKEN!);
    // Add fields parameter to specify exactly what we need
    graphApiUrl.searchParams.append('fields', 'thumbnail_url,author_name,provider_name,provider_url,html');
    // Optional: Add maxwidth parameter if you want to control the size
    graphApiUrl.searchParams.append('maxwidth', '658');

    const response = await fetch(graphApiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Instagram API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      title: data.author_name, // Using author_name as title since the API doesn't return a separate title
      authorName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
      authorUrl: `https://www.instagram.com/${data.author_name}`,
      embedHtml: data.html,
      providerName: data.provider_name,
      providerUrl: data.provider_url,
    });

  } catch (error) {
    console.error('Instagram post fetch error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch Instagram post data'
      },
      { status: 500 }
    );
  }
}