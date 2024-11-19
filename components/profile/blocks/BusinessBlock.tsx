import { TrashIcon } from '@heroicons/react/24/outline';

import { Business } from '@/types';

interface Props {
  business: Business;
  isEditing?: boolean;
  onDelete?: () => void;
}

export default function BusinessBlock({ business, isEditing, onDelete }: Props) {
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
        {business.logo_url && (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{business.name}</h3>
          {business.categories && business.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-1">
              {business.categories.map((category, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2">{business.description}</p>
          <div className="mt-4">
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Visit Website →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}