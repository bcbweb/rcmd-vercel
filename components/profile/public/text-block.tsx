import { createClient } from "@/utils/supabase/server";
import parse from 'html-react-parser';

interface TextBlockProps {
  blockId: string;
}

export default async function TextBlock({ blockId }: TextBlockProps) {
  const supabase = await createClient();

  const { data: textBlock, error } = await supabase
    .from('text_blocks')
    .select('*')
    .eq('profile_block_id', blockId)
    .single();

  if (error) {
    console.error('Error fetching text block:', error);
    return (
      <div className="text-red-500">
        Failed to load text block
      </div>
    );
  }

  if (!textBlock) {
    return null;
  }

  return (
    <div className="prose max-w-none">
      {parse(textBlock.text)}
    </div>
  );
}