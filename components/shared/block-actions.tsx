import { Pencil, Trash2, Check, X } from 'lucide-react';

interface BlockActionsProps {
  isEditMode: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function BlockActions({
  isEditMode,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: BlockActionsProps) {
  if (isEditMode) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          title="Save"
          onClick={onSave}
          className="p-1 text-green-500 hover:text-green-700 transition-colors"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Cancel"
          onClick={onCancel}
          className="p-1 text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        title="Edit"
        onClick={onEdit}
        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 
          dark:hover:text-gray-300 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        title="Delete"
        onClick={onDelete}
        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 
          dark:hover:text-red-300 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}