"use client";

import { useState } from 'react';

interface MagicFillProps {
  onMetadataFound: (metadata: {
    title?: string;
    description?: string;
    image?: File;
    type?: string;
    imageDimensions?: { width: number; height: number; };
    embedHtml?: string;
  }) => void;
}

export function MagicFill({ onMetadataFound }: MagicFillProps) {
  const [input, setInput] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  const isInstagramPostUrl = (url: string) => {
    return url.includes('instagram.com/p/') || url.includes('instagram.com/reel/');
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number; }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image dimensions'));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const fetchUrlMetadata = async (url: string) => {
    if (isInstagramPostUrl(url)) {
      const response = await fetch('/api/instagram-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postUrl: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Instagram post data');
      }

      const data = await response.json();

      return {
        title: data.title || data.authorName,
        description: data.title,
        type: 'instagram',
        imageUrl: data.thumbnailUrl,
        authorUrl: data.authorUrl,
        embedHtml: data.embedHtml
      };
    }

    const response = await fetch('/api/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL metadata');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      title: data.title || '',
      description: data.description || '',
      image: data.image ? await fetchImageAsFile(data.image) : undefined,
      imageDimensions: await getImageDimensions(data.image),
      type: data.type || 'other',
    };
  };

  const fetchImageAsFile = async (url: string): Promise<File | undefined> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], 'image.jpg', { type: blob.type });
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return undefined;
    }
  };

  const handleAutoFill = async () => {
    if (!input.trim()) {
      setAutoFillError('Please enter a URL');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillError(null);

    try {
      let processedInput = input.trim();

      if (!isInstagramPostUrl(processedInput)) {
        throw new Error('Please enter a valid Instagram post or reel URL');
      }

      if (!processedInput.startsWith('http')) {
        processedInput = `https://${processedInput}`;
      }

      const metadata = await fetchUrlMetadata(processedInput);

      if (metadata.imageUrl) {
        try {
          const image = await fetchImageAsFile(metadata.imageUrl);
          if (image) {
            const dimensions = await getImageDimensions(image);
            metadata.image = image;
            metadata.imageDimensions = dimensions;
          }
        } catch (error) {
          console.error('Failed to fetch Instagram image:', error);
        }
      }

      onMetadataFound(metadata);
      setAutoFillError(null);

    } catch (error) {
      setAutoFillError(
        error instanceof Error
          ? error.message
          : 'Unable to get information. Please try again or fill in manually.'
      );
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Quick Fill from Instagram Post (coming soon)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste an Instagram post URL"
          className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          disabled
        />
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={true /*isAutoFilling*/}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAutoFilling ? 'Loading...' : 'Magic Fill ✨'}
        </button>
      </div>
      {autoFillError && (
        <p className="text-red-500 text-sm">{autoFillError}</p>
      )}
      <p className="text-sm text-gray-500">
        Tip: Paste an Instagram post or reel link to automatically fill in the details below
      </p>
    </div>
  );
}