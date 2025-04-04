import { createClient } from "@/utils/supabase/server";
import { PostgrestError } from '@supabase/supabase-js';
import { blockStyles } from "@/components/common";
import parse from 'html-react-parser';

interface TextBlockProps {
  blockId: string;
}

interface TextBlock {
  profile_block_id: string;
  text: string;
  view_count?: number;
  like_count?: number;
  save_count?: number;
  created_at: string;
}

export default async function TextBlock({ blockId }: TextBlockProps) {
  const supabase = await createClient();

  const { data: textBlock, error } = await supabase
    .from('text_blocks')
    .select('*')
    .eq('profile_block_id', blockId)
    .single() as { data: TextBlock | null, error: PostgrestError | null; };

  if (error || !textBlock) return null;

  return (
    <div className={blockStyles.container}>
      <div className="flex flex-col h-full">
        <div className="prose dark:prose-invert max-w-none prose-sm sm:prose-base">
          {parse(textBlock.text)}
        </div>
      </div>
    </div>
  );
}