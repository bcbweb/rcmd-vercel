import { RCMD } from "@/types";
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from "react";

interface RcmdBlockModalProps {
  onClose: () => void;
  onSave: (rcmdId: string) => Promise<void>;
}

export default function RcmdBlockModal({ onClose, onSave }: RcmdBlockModalProps) {
  const [selectedRcmdId, setSelectedRcmdId] = useState('');
  const [rcmds, setRcmds] = useState<RCMD[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRcmds() {
      const { data, error } = await supabase
        .from('rcmds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return;
      }

      setRcmds(data || []);
    }

    fetchRcmds();
  }, []);

  const handleSave = async () => {
    if (!selectedRcmdId) {
      alert('Please select a recommendation');
      return;
    }
    await onSave(selectedRcmdId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-lg font-semibold mb-4">Select Recommendation</h2>
        <div className="max-h-96 overflow-y-auto">
          {rcmds.map((rcmd) => (
            <div
              key={rcmd.id}
              className={`p-4 border rounded-lg mb-2 cursor-pointer ${selectedRcmdId === rcmd.id ? 'border-blue-500' : 'border-gray-200'
                }`}
              onClick={() => setSelectedRcmdId(rcmd.id)}
            >
              <h3 className="font-medium">{rcmd.title}</h3>
              <p className="text-sm text-gray-500">{rcmd.description}</p>
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
            Add Recommendation Block
          </button>
        </div>
      </div>
    </div>
  );
}