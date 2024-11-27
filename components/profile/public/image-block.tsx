import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import type { ImageBlockType } from '@/types';

export default async function ImageBlock({ blockId }: { blockId: string; }) {
  const supabase = await createClient();

  const { data: imageBlock, error } = await supabase
    .from('image_blocks')
    .select('*')
    .eq('profile_block_id', blockId)
    .single<ImageBlockType>();

  if (error || !imageBlock) {
    return null;
  }

  const width = imageBlock.width ?? 800;
  const height = imageBlock.height ?? 600;
  const aspectRatio = width / height;
  const maxWidth = 800;
  const displayHeight = maxWidth / aspectRatio;

  return (
    <div className="w-full">
      <div className="relative w-full max-w-[800px]">
        <Image
          src={imageBlock.image_url}
          alt={imageBlock.caption || 'Profile image'}
          width={maxWidth}
          height={displayHeight}
          className="rounded-lg w-full h-auto"
          priority={false}
        />
      </div>
      {imageBlock.caption && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {imageBlock.caption}
        </p>
      )}
    </div>
  );
}