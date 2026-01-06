"use client";

import { useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Spinner } from "@/components/ui/spinner";
import { useModalStore } from "@/stores/modal-store";
import { useBlockStore } from "@/stores/block-store";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  profileId: string;
  pageId?: string;
  onSuccess: () => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
      <div className="flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive("bold") ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive("italic") ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive("bulletList") ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive("orderedList") ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive({ textAlign: "left" }) ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <AlignLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive({ textAlign: "center" }) ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <AlignCenter className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
            ${editor.isActive({ textAlign: "right" }) ? "bg-gray-100 dark:bg-gray-700" : ""}`}
        >
          <AlignRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function TextBlockModal({
  profileId,
  pageId,
  onSuccess,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const { setIsTextBlockModalOpen } = useModalStore();
  const { saveTextBlock } = useBlockStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[200px]",
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;

    try {
      setIsSaving(true);
      const content = editor.getHTML();

      // Validate content
      if (!content || content.trim() === "" || content === "<p></p>") {
        toast.error("Please enter some text content");
        return;
      }

      // Validate profileId
      if (!profileId) {
        toast.error("Profile ID is missing. Please refresh the page.");
        console.error("[DEBUG] profileId is missing:", { profileId, pageId });
        return;
      }

      console.log("[DEBUG] Saving text block:", {
        profileId,
        pageId,
        contentLength: content.length,
      });

      const success = await saveTextBlock(profileId, content, pageId);

      if (success) {
        toast.success("Text block added successfully");
        onSuccess();
        setIsTextBlockModalOpen(false);
      } else {
        toast.error("Failed to save text block");
      }
    } catch (error) {
      console.error("[DEBUG] Error saving text block:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to save text block";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsTextBlockModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 
                dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 
                rounded-full transition-colors"
              aria-label="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold flex-1 text-center">
              Add Text Block
            </h2>
            <div className="w-8"></div> {/* Empty spacer for balance */}
          </div>

          <div className="mb-4">
            <MenuBar editor={editor} />
            <div className="border rounded-lg p-4 dark:border-gray-700">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsTextBlockModalOpen(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
