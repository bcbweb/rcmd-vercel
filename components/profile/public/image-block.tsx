import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';
import { blockStyles } from "@/components/shared/styles";
import type { ImageBlockType } from '@/types';

interface ImageBlockProps {
  blockId: string;
}

export default async function ImageBlock({ blockId }: ImageBlockProps) {
  const supabase = await createClient();

  const { data: imageBlock, error } = await supabase
    .from('image_blocks')
    .select('*')
    .eq('profile_block_id', blockId)
    .single() as { data: ImageBlockType | null, error: PostgrestError | null; };

  if (error || !imageBlock) return null;

  const width = imageBlock.width ?? 800;
  const height = imageBlock.height ?? 600;
  const aspectRatio = width / height;
  const maxWidth = 480;
  const displayHeight = maxWidth / aspectRatio;

  return (
    <div className={`${blockStyles.container} ${blockStyles.card}`}>
      <div className="relative w-full overflow-hidden rounded-lg">
        <Image
          src={imageBlock.image_url}
          alt={imageBlock.caption || 'Profile image'}
          width={maxWidth}
          height={displayHeight}
          className="w-full h-auto"
          priority={false}
        />
      </div>

      {imageBlock.caption && (
        <p className={`${blockStyles.metaText} mt-3`}>
          {imageBlock.caption}
        </p>
      )}
    </div>
  );
}