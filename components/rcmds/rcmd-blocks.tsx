"use client";

import RcmdBlock from "../profile/blocks/rcmd-block";
import { useMemo } from "react";
import type { RCMDBlockType } from '@/types/index';

interface RcmdBlocksProps {
  rcmds: RCMDBlockType[];
  isEditing?: boolean;
  onDelete?: (id: string) => void;
  onSave?: (block: Partial<RCMDBlockType>) => void;
}

export default function RcmdBlocks({
  rcmds,
  isEditing = false,
  onDelete,
  onSave
}: RcmdBlocksProps) {
  const sortedRcmds = useMemo(() => {
    return [...rcmds].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [rcmds]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedRcmds.map((rcmd) => (
        <RcmdBlock
          key={rcmd.id}
          rcmdBlock={rcmd}
          isEditing={isEditing}
          onDelete={() => onDelete?.(rcmd.id)}
          onSave={onSave}
        />
      ))}
    </div>
  );
}