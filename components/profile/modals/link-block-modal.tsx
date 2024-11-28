import { Link } from "@/types";
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from "react";
import LinkModal from "../../links/modals/link-modal";

interface LinkBlockModalProps {
  onClose: () => void;
  onSave: (linkId: string) => Promise<void>;
}

export default function LinkBlockModal({ onClose, onSave }: LinkBlockModalProps) {
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const supabase = createClient();

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        console.error('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSave = async () => {
    if (!selectedLinkId) {
      alert('Please select a link');
      return;
    }
    await onSave(selectedLinkId);
  };

  const handleAddNewLink = async (
    title: string,
    url: string,
    description: string,
    type: string,
    visibility: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('links')
        .insert([
          {
            title,
            url,
            description,
            type,
            visibility,
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setShowAddLinkModal(false);
      await fetchLinks();
      setSelectedLinkId(data.id);
    } catch (error) {
      console.error('Error adding new link:', error);
      alert('Failed to add new link');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select Link</h2>
            <button
              onClick={() => setShowAddLinkModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add New Link
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : links.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No links found. Please add some links first.
              </div>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className={`p-4 border rounded-lg mb-2 cursor-pointer ${selectedLinkId === link.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => setSelectedLinkId(link.id)}
                >
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{link.url}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedLinkId || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Link Block
            </button>
          </div>
        </div>
      </div>

      {showAddLinkModal && (
        <LinkModal
          onClose={() => setShowAddLinkModal(false)}
          onSave={handleAddNewLink}
        />
      )}
    </>
  );
}