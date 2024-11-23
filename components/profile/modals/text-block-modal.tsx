import { useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (content: string, alignment: string) => Promise<void>;
}

const MenuBar = ({ editor }: { editor: Editor | null; }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
      <div className="flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <ListOrdered className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <AlignLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <AlignCenter className="w-5 h-5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                        ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <AlignRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function TextBlockModal({ onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px]',
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;

    try {
      setIsSaving(true);
      const content = editor.getHTML();
      // Get alignment from editor state
      const alignment = editor.isActive({ textAlign: 'center' })
        ? 'center'
        : editor.isActive({ textAlign: 'right' })
          ? 'right'
          : 'left';

      await onSave(content, alignment);
    } catch (error) {
      console.error('Error saving text block:', error);
      alert('Failed to save text block');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Add Text Block</h2>

        <div className="mb-4">
          <MenuBar editor={editor} />
          <div className="border rounded-lg p-4 dark:border-gray-700 dark:text-white">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                            dark:hover:bg-gray-700 rounded-lg"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                            disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}