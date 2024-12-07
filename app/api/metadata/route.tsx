import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {
      // Prioritize OG title first, then fallback to document title
      title: $('meta[property="og:title"]').attr('content') ||
        $('title').first().contents().filter((_, el) => el.type === 'text').text().trim(),
      description: $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href'),
      type: $('meta[property="og:type"]').attr('content'),
    };

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch metadata ${error}` }, { status: 500 });
  }
}