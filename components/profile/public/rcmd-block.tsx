import { createClient } from "@/utils/supabase/server";
import { RCMD, RCMDBlockType } from "@/types";
import Image from "next/image";
import { PostgrestError } from '@supabase/supabase-js';

interface RcmdBlockProps {
  blockId: string;
}

export default async function RcmdBlock({ blockId }: RcmdBlockProps) {
  const supabase = await createClient();

  const { data: rcmdBlock, error } = await supabase
    .from('rcmd_blocks')
    .select(`
      *,
      rcmds (*)
    `)
    .eq('profile_block_id', blockId)
    .single() as {
      data: RCMDBlockType & { rcmds: RCMD; } | null;
      error: PostgrestError | null;
    };

  if (error) {
    console.error('Error fetching rcmd block:', error);
    return null;
  }

  if (!rcmdBlock || !rcmdBlock.rcmds) {
    return null;
  }

  const rcmd = rcmdBlock.rcmds;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      {rcmd.featured_image && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={rcmd.featured_image}
            alt={rcmd.title}
            fill
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-lg">
            {rcmd.title}
          </h3>
          {rcmd.price_range && (
            <span className="text-sm text-gray-600">
              {String(rcmd.price_range)}
            </span>
          )}
        </div>

        {rcmd.description && (
          <p className="text-gray-700 text-sm mb-3">
            {rcmd.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {rcmd.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span title="Views">👁️ {rcmd.view_count || 0}</span>
            <span title="Likes">❤️ {rcmd.like_count || 0}</span>
            <span title="Saves">🔖 {rcmd.save_count || 0}</span>
          </div>

          {rcmd.location && (
            <span className="text-xs">
              📍 {String(rcmd.location)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
