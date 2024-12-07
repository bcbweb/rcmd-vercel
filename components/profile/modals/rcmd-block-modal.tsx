import { RCMD } from "@/types";
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from "react";
import { useBlockStore } from '@/stores/block-store';
import { useModalStore } from "@/stores/modal-store";
import { Spinner } from "@/components/ui/spinner";

interface RCMDBlockModalProps {
  profileId: string;
  onSuccess?: () => void;
}

export default function RCMDBlockModal({ profileId, onSuccess }: RCMDBlockModalProps) {
  const { saveRCMDBlock, isLoading: isSaving, error } = useBlockStore();
  const [selectedRCMDId, setSelectedRCMDId] = useState('');
  const [rcmds, setRCMDs] = useState<RCMD[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    setIsRCMDBlockModalOpen,
    setIsRCMDModalOpen,
    setOnModalSuccess
  } = useModalStore();

  const fetchRCMDs = async () => {
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
      setRCMDs(data || []);
    } catch (error) {
      console.error('Error fetching RCMDs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRCMDs();
  }, []);

  const handleSave = async () => {
    if (!selectedRCMDId) return;

    try {
      const success = await saveRCMDBlock(profileId, selectedRCMDId);
      if (success) {
        onSuccess?.();
        setIsRCMDBlockModalOpen(false);
      } else {
        throw new Error(error || 'Failed to save RCMD block');
      }
    } catch (error) {
      console.error('Error saving RCMD block:', error);
      alert(error instanceof Error ? error.message : 'Failed to save RCMD block');
    }
  };

  const handleClose = () => {
    setIsRCMDBlockModalOpen(false);
  };

  const handleAddNewClick = () => {
    // Set up the callback to refresh RCMDs after successful creation
    setOnModalSuccess(() => {
      fetchRCMDs();
    });

    // Open the RCMD creation modal
    setIsRCMDModalOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select RCMD</h2>
            <button
              onClick={handleAddNewClick}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isSaving}
            >
              Add New RCMD
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : rcmds.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No RCMDs found. Please add some RCMDs first.
              </div>
            ) : (
              rcmds.map((rcmd) => (
                <div
                  key={rcmd.id}
                  className={`p-4 border rounded-lg mb-2 cursor-pointer transition-colors
                    ${selectedRCMDId === rcmd.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                    }`}
                  onClick={() => setSelectedRCMDId(rcmd.id)}
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
              onClick={handleClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedRCMDId || isSaving || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                'Add RCMD Block'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}