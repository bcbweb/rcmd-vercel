import { createClient } from "@/utils/supabase/server";
import { Link, LinkBlockType } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { blockStyles, BlockStats } from "@/components/common";

interface LinkBlockProps {
  blockId: string;
}

export default async function LinkBlock({ blockId }: LinkBlockProps) {
  const supabase = await createClient();

  const { data: linkBlock, error } = (await supabase
    .from("link_blocks")
    .select(`*, links (*)`)
    .eq("profile_block_id", blockId)
    .single()) as {
    data: (LinkBlockType & { links: Link }) | null;
    error: PostgrestError;
  };

  if (error || !linkBlock || !linkBlock.links) return null;
  const link = linkBlock.links;

  const stats = [
    { value: link.view_count || 0, label: "views" },
    { value: link.like_count || 0, label: "likes" },
    { value: link.save_count || 0, label: "saves" },
  ];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${blockStyles.container}`}
    >
      <h3 className="font-medium text-lg text-blue-600 dark:text-blue-400 mb-2">
        {link.title}
      </h3>

      {link.description && (
        <p className={blockStyles.description}>{link.description}</p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <span className={`${blockStyles.metaText} mt-4 truncate`}>
          {link.url}
        </span>
        <BlockStats stats={stats} />
      </div>
    </a>
  );
}
