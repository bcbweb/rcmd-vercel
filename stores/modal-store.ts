import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ModalStore {
  // Existing modal states
  isRCMDBlockModalOpen: boolean;
  setIsRCMDBlockModalOpen: (isOpen: boolean) => void;
  isTextBlockModalOpen: boolean;
  setIsTextBlockModalOpen: (isOpen: boolean) => void;
  isImageBlockModalOpen: boolean;
  setIsImageBlockModalOpen: (isOpen: boolean) => void;
  isLinkBlockModalOpen: boolean;
  setIsLinkBlockModalOpen: (isOpen: boolean) => void;

  // RCMD Modal state
  isRCMDModalOpen: boolean;
  setIsRCMDModalOpen: (isOpen: boolean) => void;

  // Link Modal state
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (isOpen: boolean) => void;

  // Optional callback storage for refreshing data
  onModalSuccess?: () => void;
  setOnModalSuccess: (callback?: () => void) => void;
}

export const useModalStore = create<ModalStore>()(
  devtools(
    (set) => ({
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
      isAddRCMDModalOpen: false,

      // RCMD Modal
      isRCMDModalOpen: false,
      setIsRCMDModalOpen: (isOpen) =>
        set({ isRCMDModalOpen: isOpen }, false, 'setIsRCMDModalOpen'),

      // Link Modal
      isLinkModalOpen: false,
      setIsLinkModalOpen: (isOpen) =>
        set({ isLinkModalOpen: isOpen }, false, 'setIsLinkModalOpen'),

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