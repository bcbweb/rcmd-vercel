import { type TextBlockType, TextAlignment } from '@/types';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import {
  Bars3Icon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Props {
  textBlock: TextBlockType;
  isEditing?: boolean;
  onDelete?: () => void;
  onSave?: (textBlock: Partial<TextBlockType>) => void;
}

export default function TextBlock({ textBlock, isEditing: isEditMode, onDelete, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textBlock.text);
  const [alignment, setAlignment] = useState(textBlock.alignment ?? TextAlignment.Left);


  const handleSave = () => {
    if (onSave) {
      onSave({ text, alignment });
    }
    setIsEditing(false);
  };

  const alignmentClasses = {
    [TextAlignment.Left]: 'text-left',
    [TextAlignment.Center]: 'text-center',
    [TextAlignment.Right]: 'text-right'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {isEditMode && (
        <div className="flex justify-end mb-2 gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-500 hover:text-gray-700"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setAlignment(TextAlignment.Left)}
              className={`p-2 rounded ${alignment === TextAlignment.Left ? 'bg-gray-200' : ''}`}
              title="Align left"
            >
              <Bars3BottomLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlignment(TextAlignment.Center)}
              className={`p-2 rounded ${alignment === TextAlignment.Center ? 'bg-gray-200' : ''}`}
              title="Align center"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAlignment(TextAlignment.Right)}
              className={`p-2 rounded ${alignment === TextAlignment.Right ? 'bg-gray-200' : ''}`}
              title="Align right"
            >
              <Bars3BottomRightIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className={alignmentClasses[alignment]}>{text}</p>
      )}
    </div>
  );
}