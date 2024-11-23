import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle } from 'lucide-react';
import RcmdModal from './modals/rcmd-modal';

interface Props {
  ownerId: string;
  onRcmdAdded?: () => void;
}

export default function AddRcmdButton({ ownerId, onRcmdAdded }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  const handleRcmdSave = async (title: string, description: string, type: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('rcmds')
        .insert({
          owner_id: user.id,
          title,
          description,
          type,
          status: 'draft',
          visibility: 'private',
          is_sponsored: false,
          monetization_enabled: false,
          view_count: 0,
          like_count: 0,
          share_count: 0,
          save_count: 0
        });

      if (error) throw error;

      closeModal();
      onRcmdAdded?.();

    } catch (error) {
      console.error('Error saving recommendation:', error);
      alert('Failed to save recommendation');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 
          rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 
          transition-colors group"
      >
        <div className="flex items-center justify-center gap-2 text-gray-500 
          dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add Recommendation</span>
        </div>
      </button>

      {isModalOpen && (
        <RcmdModal
          onClose={closeModal}
          onSave={handleRcmdSave}
        />
      )}
    </>
  );
}