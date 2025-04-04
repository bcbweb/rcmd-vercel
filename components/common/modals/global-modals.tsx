import { Toaster } from "sonner";
import { RcmdModal } from "@/components/features/rcmd/modals";
import { LinkModal } from "@/components/features/links/modals";
import { CollectionModal } from "@/components/features/collections/modals";

export default function GlobalModals() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <RcmdModal />
      <LinkModal />
      <CollectionModal />
    </>
  );
}
