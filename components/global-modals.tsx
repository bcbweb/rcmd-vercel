import { Toaster } from 'sonner';
import RCMDModal from "@/components/rcmds/modals/rcmd-modal";
import LinkModal from "@/components/links/modals/link-modal";
import CollectionModal from "@/components/collections/modals/collection-modal";

export default function Modals() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <RCMDModal />
      <LinkModal />
      <CollectionModal />
    </>
  );
}
