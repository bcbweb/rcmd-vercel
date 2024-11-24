"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle } from 'lucide-react';
import LinkModal from './modals/link-modal';

interface Props {
  onLinkAdded?: () => void;
}

export default function AddLinkButton({ onLinkAdded }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  const handleLinkSave = async (
    title: string,
    url: string,
    description: string,
    type: string,
    visibility: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('links')
        .insert({
          owner_id: user.id,
          title,
          url,
          description,
          type,
          visibility,
          status: 'draft',
          view_count: 0,
          click_count: 0,
          share_count: 0,
          save_count: 0
        });

      if (error) throw error;

      closeModal();
      onLinkAdded?.();

    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link');
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
          <span>Add Link</span>
        </div>
      </button>

      {isModalOpen && (
        <LinkModal
          onClose={closeModal}
          onSave={handleLinkSave}
        />
      )}
    </>
  );
}