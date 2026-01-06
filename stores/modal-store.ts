import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { RCMD, Link, CollectionWithItems } from "@/types";

interface ModalStore {
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
  isVideoBlockModalOpen: boolean;
  setIsVideoBlockModalOpen: (isOpen: boolean) => void;

  // RCMD Modal state
  isRCMDModalOpen: boolean;
  setIsRCMDModalOpen: (isOpen: boolean) => void;
  isRCMDEditMode: boolean;
  setIsRCMDEditMode: (isEdit: boolean) => void;
  rcmdToEdit: RCMD | null;
  setRCMDToEdit: (rcmd: RCMD | null) => void;

  // Link Modal state
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (isOpen: boolean) => void;
  isLinkEditMode: boolean;
  setIsLinkEditMode: (isEdit: boolean) => void;
  linkToEdit: Link | null;
  setLinkToEdit: (link: Link | null) => void;

  // Collection Modal state
  isCollectionModalOpen: boolean;
  setIsCollectionModalOpen: (isOpen: boolean) => void;
  isCollectionEditMode: boolean;
  setIsCollectionEditMode: (isEdit: boolean) => void;
  collectionToEdit: any;
  setCollectionToEdit: (collection: any) => void;
  resetCollectionModal: () => void;

  // Callback storage - update the type to be more flexible
  onModalSuccess: ((...args: any[]) => void) | undefined;
  setOnModalSuccess: (callback: (...args: any[]) => void) => void;
}

export const useModalStore = create<ModalStore>()(
  devtools(
    (set) => ({
      isRCMDBlockModalOpen: false,
      setIsRCMDBlockModalOpen: (isOpen) =>
        set({ isRCMDBlockModalOpen: isOpen }, false, "setIsRCMDBlockModalOpen"),

      isTextBlockModalOpen: false,
      setIsTextBlockModalOpen: (isOpen) =>
        set({ isTextBlockModalOpen: isOpen }, false, "setIsTextBlockModalOpen"),

      isImageBlockModalOpen: false,
      setIsImageBlockModalOpen: (isOpen) =>
        set(
          { isImageBlockModalOpen: isOpen },
          false,
          "setIsImageBlockModalOpen"
        ),

      isLinkBlockModalOpen: false,
      setIsLinkBlockModalOpen: (isOpen) =>
        set({ isLinkBlockModalOpen: isOpen }, false, "setIsLinkBlockModalOpen"),

      isCollectionBlockModalOpen: false,
      setIsCollectionBlockModalOpen: (isOpen) =>
        set(
          { isCollectionBlockModalOpen: isOpen },
          false,
          "setIsCollectionBlockModalOpen"
        ),

      isVideoBlockModalOpen: false,
      setIsVideoBlockModalOpen: (isOpen) =>
        set(
          { isVideoBlockModalOpen: isOpen },
          false,
          "setIsVideoBlockModalOpen"
        ),

      // RCMD Modal
      isRCMDModalOpen: false,
      setIsRCMDModalOpen: (isOpen) =>
        set({ isRCMDModalOpen: isOpen }, false, "setIsRCMDModalOpen"),
      isRCMDEditMode: false,
      setIsRCMDEditMode: (isEdit) =>
        set({ isRCMDEditMode: isEdit }, false, "setIsRCMDEditMode"),
      rcmdToEdit: null,
      setRCMDToEdit: (rcmd) =>
        set({ rcmdToEdit: rcmd }, false, "setRCMDToEdit"),

      // Link Modal
      isLinkModalOpen: false,
      setIsLinkModalOpen: (isOpen) =>
        set({ isLinkModalOpen: isOpen }, false, "setIsLinkModalOpen"),
      isLinkEditMode: false,
      setIsLinkEditMode: (isEdit) =>
        set({ isLinkEditMode: isEdit }, false, "setIsLinkEditMode"),
      linkToEdit: null,
      setLinkToEdit: (link) =>
        set({ linkToEdit: link }, false, "setLinkToEdit"),

      // Collection Modal
      isCollectionModalOpen: false,
      setIsCollectionModalOpen: (isOpen) => {
        if (!isOpen) {
          set(
            {
              isCollectionModalOpen: false,
              collectionToEdit: null,
              isCollectionEditMode: false,
            },
            false,
            "setIsCollectionModalOpen/close"
          );
        } else {
          set(
            { isCollectionModalOpen: true },
            false,
            "setIsCollectionModalOpen/open"
          );
        }
      },
      isCollectionEditMode: false,
      setIsCollectionEditMode: (isEdit) =>
        set({ isCollectionEditMode: isEdit }, false, "setIsCollectionEditMode"),
      collectionToEdit: null,
      setCollectionToEdit: (collection) =>
        set({ collectionToEdit: collection }, false, "setCollectionToEdit"),
      resetCollectionModal: () =>
        set(
          {
            collectionToEdit: null,
            isCollectionEditMode: false,
          },
          false,
          "resetCollectionModal"
        ),

      // Callback storage
      onModalSuccess: undefined,
      setOnModalSuccess: (callback) => {
        console.log(
          "🔍 ModalStore: setOnModalSuccess called with callback:",
          !!callback
        );

        // Store the actual function, not a function that returns the callback
        set({ onModalSuccess: callback }, false, "setOnModalSuccess");
      },
    }),
    {
      name: "Modal Store",
    }
  )
);
