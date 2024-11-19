import { TrashIcon } from '@heroicons/react/24/outline';

interface Props {
  data: {
    url: string;
    caption?: string;
  };
  isEditing?: boolean;
  onDelete?: () => void;
  onEdit?: (data: { url: string; caption?: string; }) => void;
}

export default function ImageBlock({ data, isEditing, onDelete, onEdit }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {isEditing && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <figure>
        <img
          src={data.url}
          alt={data.caption || ''}
          className="w-full h-auto rounded"
        />
        {data.caption && (
          <figcaption className="mt-2 text-center text-gray-600">
            {data.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}