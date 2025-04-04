import TextBlock from "./text-block";
import LinkBlock from "./link-block";
import RCMDBlock from "./rcmd-block";
import ImageBlock from "./image-block";
import type { ProfileBlockType } from "@/types";

interface PublicProfileBlocksProps {
  blocks: ProfileBlockType[];
}

export default async function PublicProfileBlocks({
  blocks,
}: PublicProfileBlocksProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.type === "text" && <TextBlock blockId={block.id} />}
          {block.type === "link" && <LinkBlock blockId={block.id} />}
          {block.type === "rcmd" && <RCMDBlock blockId={block.id} />}
          {block.type === "image" && <ImageBlock blockId={block.id} />}
        </div>
      ))}
    </div>
  );
}
