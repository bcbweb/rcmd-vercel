import { useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { TextBlockType } from "@/types";
import { BlockActions, blockStyles } from "@/components/common";

interface Props {
  textBlock: TextBlockType;
  onDelete?: () => void;
  onSave?: (updatedBlock: Partial<TextBlockType>) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

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

export default function TextBlock({ textBlock, onDelete, onSave }: Props) {
  const [isEditMode, setIsEditMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
    ],
    content: textBlock.text,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[100px]",
      },
    },
  });

  const handleSave = () => {
    if (!editor) return;

    onSave?.({
      text: editor.getHTML(),
    });
    setIsEditMode(false);
  };

  return (
    <div className={blockStyles.container}>
      <div className="flex justify-end mb-2 gap-2">
        <BlockActions
          isEditMode={isEditMode}
          onEdit={() => setIsEditMode(true)}
          onDelete={onDelete}
          onSave={handleSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>

      {isEditMode ? (
        <div className="space-y-4">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: textBlock.text }}
        />
      )}
    </div>
  );
}
