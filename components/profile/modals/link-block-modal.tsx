import { Link } from "@/types";
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from "react";

interface LinkBlockModalProps {
  onClose: () => void;
  onSave: (linkId: string) => Promise<void>;
}

export default function LinkBlockModal({ onClose, onSave }: LinkBlockModalProps) {
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLinks() {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching links:', error);
        return;
      }

      setLinks(data || []);
    }

    fetchLinks();
  }, []);

  const handleSave = async () => {
    if (!selectedLinkId) {
      alert('Please select a link');
      return;
    }
    await onSave(selectedLinkId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Select Link</h2>
        <div className="max-h-96 overflow-y-auto">
          {links.map((link) => (
            <div
              key={link.id}
              className={`p-4 border rounded-lg mb-2 cursor-pointer ${selectedLinkId === link.id ? 'border-blue-500' : 'border-gray-200'
                }`}
              onClick={() => setSelectedLinkId(link.id)}
            >
              <h3 className="font-medium">{link.title}</h3>
              <p className="text-sm text-gray-500">{link.url}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Link Block
          </button>
        </div>
      </div>
    </div>
  );
}