// components/profile/blocks/RCMDBlock.tsx
import { RCMD } from '@/types';
import { formatDistance } from 'date-fns';
import { TrashIcon } from '@heroicons/react/24/outline';

interface Props {
  rcmd: RCMD;
  isEditing?: boolean;
  onDelete?: () => void;
}

export default function RCMDBlock({ rcmd, isEditing, onDelete }: Props) {
  const createdDate = rcmd.created_at ? new Date(rcmd.created_at) : new Date();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {isEditing && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <span className="sr-only">Delete</span>
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-start gap-4">
        {rcmd.featured_image && (
          <img
            src={rcmd.featured_image}
            alt={rcmd.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{rcmd.title}</h3>
          <p className="text-gray-600 text-sm">
            {formatDistance(createdDate, new Date(), { addSuffix: true })}
          </p>
          <p className="mt-2">{rcmd.description}</p>
          {rcmd.tags && rcmd.tags?.length > 0 && (
            <div className="mt-2 flex gap-2">
              {rcmd.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}