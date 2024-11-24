"use client";

import RcmdBlock from "./rcmd-block";
import { useMemo } from "react";
import type { RCMD } from '@/types/index';

interface RcmdBlocksProps {
  rcmds: RCMD[];
  isEditing?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

export default function RcmdBlocks({
  rcmds,
  isEditing = false,
  onDelete,
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
      {sortedRcmds.map((rcmd, index) => (
        <RcmdBlock
          key={rcmd.id}
          rcmd={rcmd}
          index={index}
          isEditing={isEditing}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}