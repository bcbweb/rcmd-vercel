import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import React from "react";

/**
 * Shows a confirmation toast using Sonner for actions like deletion
 */
export function confirmDelete({
  title = "Confirm deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  onCancel,
}: {
  title?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}): void {
  toast(title, {
    description,
    action: {
      label: "Delete",
      onClick: () => onConfirm(),
    },
    cancel: {
      label: "Cancel",
      onClick: onCancel ? () => onCancel() : () => {},
    },
    icon: React.createElement(Trash2, { className: "h-4 w-4 text-red-500" }),
    closeButton: true,
    duration: 5000, // 5 seconds to decide
  });
}
