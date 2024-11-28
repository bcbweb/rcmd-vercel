import { RCMD } from "@/types";
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from "react";
import RcmdModal from "../../rcmds/modals/rcmd-modal";

interface RcmdBlockModalProps {
  onClose: () => void;
  onSave: (rcmdId: string) => Promise<void>;
}

export default function RcmdBlockModal({ onClose, onSave }: RcmdBlockModalProps) {
  const [selectedRcmdId, setSelectedRcmdId] = useState('');
  const [rcmds, setRcmds] = useState<RCMD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRcmdModal, setShowAddRcmdModal] = useState(false);
  const supabase = createClient();

  const fetchRcmds = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        console.error('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('rcmds')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRcmds(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRcmds();
  }, []);

  const handleSave = async () => {
    if (!selectedRcmdId) {
      alert('Please select a recommendation');
      return;
    }
    await onSave(selectedRcmdId);
  };

  const handleAddNewRcmd = async (
    title: string,
    description: string,
    type: string,
    visibility: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('rcmds')
        .insert([{
          title,
          description,
          type,
          visibility,
          owner_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setShowAddRcmdModal(false);
      await fetchRcmds();
      setSelectedRcmdId(data.id);
    } catch (error) {
      console.error('Error adding new recommendation:', error);
      alert('Failed to add new recommendation');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select Recommendation</h2>
            <button
              onClick={() => setShowAddRcmdModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add New Recommendation
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : rcmds.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No recommendations found. Please add some recommendations first.
              </div>
            ) : (
              rcmds.map((rcmd) => (
                <div
                  key={rcmd.id}
                  className={`p-4 border rounded-lg mb-2 cursor-pointer ${selectedRcmdId === rcmd.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => setSelectedRcmdId(rcmd.id)}
                >
                  <h3 className="font-medium">{rcmd.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {rcmd.description}
                  </p>
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
              disabled={!selectedRcmdId || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Recommendation Block
            </button>
          </div>
        </div>
      </div>

      {showAddRcmdModal && (
        <RcmdModal
          onClose={() => setShowAddRcmdModal(false)}
          onSave={handleAddNewRcmd}
        />
      )}
    </>
  );
}