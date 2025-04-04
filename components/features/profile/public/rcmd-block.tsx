import { createClient } from "@/utils/supabase/server";
import { RCMD, RCMDBlockType } from "@/types";
import Image from "next/image";
import { PostgrestError } from "@supabase/supabase-js";
import { blockStyles, BlockStats } from "@/components/common";

interface RCMDBlockProps {
  blockId: string;
}

export default async function RCMDBlock({ blockId }: RCMDBlockProps) {
  const supabase = await createClient();

  const { data: rcmdBlock, error } = (await supabase
    .from("rcmd_blocks")
    .select(`*, rcmds (*)`)
    .eq("profile_block_id", blockId)
    .single()) as {
    data: (RCMDBlockType & { rcmds: RCMD }) | null;
    error: PostgrestError | null;
  };

  if (error || !rcmdBlock || !rcmdBlock.rcmds) return null;
  const rcmd = rcmdBlock.rcmds;

  const stats = [
    { value: rcmd.view_count || 0, label: "views" },
    { value: rcmd.like_count || 0, label: "likes" },
    { value: rcmd.save_count || 0, label: "saves" },
  ];

  return (
    <div className={`${blockStyles.container} ${blockStyles.card}`}>
      {rcmd.featured_image && (
        <div className="aspect-video relative overflow-hidden mb-4 rounded-lg">
          <Image
            src={rcmd.featured_image || ""}
            alt={rcmd.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <h3 className={blockStyles.title}>{rcmd.title}</h3>
        {rcmd.price_range && (
          <span className={blockStyles.metaText}>
            {String(rcmd.price_range)}
          </span>
        )}
      </div>

      {rcmd.description && (
        <p className={blockStyles.description}>{rcmd.description}</p>
      )}

      {rcmd.tags && rcmd.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 my-3">
          {rcmd.tags.map((tag) => (
            <span key={tag} className={blockStyles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        {rcmd.location ? (
          <span className={`${blockStyles.metaText} mt-4`}>
            📍 {String(rcmd.location)}
          </span>
        ) : (
          <span></span>
        )}
        <BlockStats stats={stats} />
      </div>
    </div>
  );
}
