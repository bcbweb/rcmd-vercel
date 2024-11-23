"use client";

import { RCMD } from "@/types";
import { useDrag, useDrop } from "react-dnd";
import { useRef } from "react";
import { Pencil, Trash2, Globe, Lock, Users } from "lucide-react";
import Link from "next/link";

interface RcmdBlockProps {
  rcmd: RCMD;
  index: number;
  isEditing?: boolean;
  onMove?: (dragIndex: number, hoverIndex: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function RcmdBlock({
  rcmd,
  index,
  isEditing = false,
  onMove,
  onDelete,
}: RcmdBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'rcmd',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current || !onMove) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'rcmd',
    item: () => ({ id: rcmd.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const visibilityIcon = {
    public: <Globe className="w-4 h-4" />,
    private: <Lock className="w-4 h-4" />,
    followers: <Users className="w-4 h-4" />,
  }[rcmd.visibility];

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`relative group rounded-lg border p-4 ${isDragging ? 'opacity-50' : 'opacity-100'
        } ${isEditing ? 'cursor-move' : ''}`}
    >
      {rcmd.featured_image && (
        <img
          src={rcmd.featured_image}
          alt={rcmd.title}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{rcmd.title}</h3>
        <div className="flex items-center gap-2">
          {visibilityIcon}
          {isEditing && (
            <>
              <Link href={`/protected/rcmds/${rcmd.id}/edit`}>
                <button className="p-1 hover:text-primary">
                  <Pencil className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={() => onDelete?.(rcmd.id)}
                className="p-1 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {rcmd.description}
      </p>

      {rcmd.tags && rcmd.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {rcmd.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-muted rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
        <span>{rcmd.view_count} views</span>
        <span>{rcmd.like_count} likes</span>
        <span>{rcmd.save_count} saves</span>
      </div>
    </div>
  );
}