"use client";

import { RCMD } from "@/types";
import RcmdBlock from "./rcmd-block";
import { useMemo } from "react";

interface RcmdBlocksProps {
  rcmds: RCMD[];
  isEditing?: boolean;
  onMove?: (dragIndex: number, hoverIndex: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function RcmdBlocks({
  rcmds,
  isEditing = false,
  onMove,
  onDelete,
}: RcmdBlocksProps) {
  const sortedRcmds = useMemo(() => {
    return [...rcmds].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [rcmds]);

  if (rcmds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recommendations yet
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedRcmds.map((rcmd, index) => (
        <RcmdBlock
          key={rcmd.id}
          rcmd={rcmd}
          index={index}
          isEditing={isEditing}
          onMove={onMove}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}