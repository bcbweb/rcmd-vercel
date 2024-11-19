import { type ProfileBlock, type TextBlockType, TextAlignment } from '@/types';
import TextBlock from './blocks/TextBlock';
import RCMDBlock from './blocks/RCMDBlock';
import BusinessBlock from './blocks/BusinessBlock';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useEffect, useState } from 'react';

interface Props {
  block: ProfileBlock;
  isEditing: boolean;
  onDelete?: () => void;
  onSave?: (updatedBlock: ProfileBlock) => void;
}

export default function BlockRenderer({ block, isEditing, onDelete, onSave }: Props) {
  const { supabase } = useSupabase();
  const [textBlock, setTextBlock] = useState<TextBlockType | null>(null);

  useEffect(() => {
    if (block.type === 'text' && block.text_block_id) {
      supabase
        .from('text_blocks')
        .select('*')
        .eq('id', block.text_block_id)
        .single()
        .then(({ data }) => {
          if (data) setTextBlock(data);
        });
    }
  }, [block.type, block.text_block_id]);

  switch (block.type) {
    case 'text':
      if (!textBlock) return null;
      return (
        <TextBlock
          textBlock={textBlock}
          isEditing={isEditing}
          onDelete={onDelete}
          onSave={async (updatedText) => {
            await supabase
              .from('text_blocks')
              .update({ text: updatedText.text })
              .eq('id', textBlock.id);

            onSave?.({
              ...block
            });
          }}
        />
      );
    // ... other cases
    default:
      return null;
  }
}