import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ModalStore {
  // Add block modal states
  isRCMDBlockModalOpen: boolean;
  setIsRCMDBlockModalOpen: (isOpen: boolean) => void;
  isTextBlockModalOpen: boolean;
  setIsTextBlockModalOpen: (isOpen: boolean) => void;
  isImageBlockModalOpen: boolean;
  setIsImageBlockModalOpen: (isOpen: boolean) => void;
  isLinkBlockModalOpen: boolean;
  setIsLinkBlockModalOpen: (isOpen: boolean) => void;
  isCollectionBlockModalOpen: boolean;
  setIsCollectionBlockModalOpen: (isOpen: boolean) => void;

  // RCMD Modal state
  isRCMDModalOpen: boolean;
  setIsRCMDModalOpen: (isOpen: boolean) => void;

  // Link Modal state
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (isOpen: boolean) => void;

  // Collection Modal state
  isCollectionModalOpen: boolean;
  setIsCollectionModalOpen: (isOpen: boolean) => void;

  // Optional callback storage for refreshing data
  onModalSuccess?: () => void;
  setOnModalSuccess: (callback?: () => void) => void;
}

export const useModalStore = create<ModalStore>()(
  devtools(
    (set) => ({
      // Add block modals
      isRCMDBlockModalOpen: false,
      setIsRCMDBlockModalOpen: (isOpen) =>
        set({ isRCMDBlockModalOpen: isOpen }, false, 'setIsRCMDBlockModalOpen'),

      isTextBlockModalOpen: false,
      setIsTextBlockModalOpen: (isOpen) =>
        set({ isTextBlockModalOpen: isOpen }, false, 'setIsTextBlockModalOpen'),

      isImageBlockModalOpen: false,
      setIsImageBlockModalOpen: (isOpen) =>
        set({ isImageBlockModalOpen: isOpen }, false, 'setIsImageBlockModalOpen'),

      isLinkBlockModalOpen: false,
      setIsLinkBlockModalOpen: (isOpen) =>
        set({ isLinkBlockModalOpen: isOpen }, false, 'setIsLinkBlockModalOpen'),

      isCollectionBlockModalOpen: false,
      setIsCollectionBlockModalOpen: (isOpen) =>
        set({ isCollectionBlockModalOpen: isOpen }, false, 'setIsCollectionBlockModalOpen'),

      // RCMD Modal
      isRCMDModalOpen: false,
      setIsRCMDModalOpen: (isOpen) =>
        set({ isRCMDModalOpen: isOpen }, false, 'setIsRCMDModalOpen'),

      // Link Modal
      isLinkModalOpen: false,
      setIsLinkModalOpen: (isOpen) =>
        set({ isLinkModalOpen: isOpen }, false, 'setIsLinkModalOpen'),

      // Collection Modal
      isCollectionModalOpen: false,
      setIsCollectionModalOpen: (isOpen) =>
        set({ isCollectionModalOpen: isOpen }, false, 'setIsCollectionModalOpen'),

      // Callback storage
      onModalSuccess: undefined,
      setOnModalSuccess: (callback) =>
        set({ onModalSuccess: callback }, false, 'setOnModalSuccess'),
    }),
    {
      name: 'Modal Store',
    }
  )
);