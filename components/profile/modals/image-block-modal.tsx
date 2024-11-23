import { useState } from 'react';

interface Props {
  onClose: () => void;
  onSave: (imageUrl: string, caption: string) => void;
}

export default function ImageBlockModal({ onClose, onSave }: Props) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(imageUrl, caption);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Add Image Block</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Image URL
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Caption
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                  dark:bg-gray-700 dark:border-gray-600"
              />
            </label>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}