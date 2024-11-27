import { createClient } from "@/utils/supabase/server";
import { Link, LinkBlockType } from "@/types";
import { PostgrestError } from '@supabase/supabase-js';

interface LinkBlockProps {
  blockId: string;
}

export default async function LinkBlock({ blockId }: LinkBlockProps) {
  const supabase = await createClient();

  const { data: linkBlock, error } = await supabase
    .from('link_blocks')
    .select(`
      *,
      links (*)
    `)
    .eq('profile_block_id', blockId)
    .single() as { data: LinkBlockType & { links: Link; } | null, error: PostgrestError; };

  if (error) {
    console.error('Error fetching link block:', error);
    return null;
  }

  if (!linkBlock || !linkBlock.links) {
    return null;
  }

  const link = linkBlock.links;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg overflow-hidden"
    >
      <div className="p-4">
        <h3 className="font-medium text-lg text-blue-600 dark:text-blue-400 mb-2">
          {link.title}
        </h3>

        {link.description && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            {link.description}
          </p>
        )}

        <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-4">
          <p className="truncate">{link.url}</p>

          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span title="Views">👁️ {link.view_count}</span>
            <span title="Likes">❤️ {link.like_count}</span>
            <span title="Saves">🔖 {link.save_count}</span>
          </div>
        </div>
      </div>
    </a>
  );
}