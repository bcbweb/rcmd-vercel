"use client";

import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useModalStore } from '@/stores/modal-store';

export default function AddLinkButton() {
  const router = useRouter();

  const handleClick = () => {
    try {
      useModalStore.setState(
        {
          isLinkModalOpen: true,
          onModalSuccess: () => router.push('/protected/profile/links')
        },
        false,
        'modal/handleLinkClick'
      );
    } catch (error) {
      console.error("Error in handleLinkClick:", error);
      useModalStore.setState({}, false, 'modal/handleLinkClick/error');
    }
  };

  return (
    <button
      onClick={handleClick}
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
  );
}