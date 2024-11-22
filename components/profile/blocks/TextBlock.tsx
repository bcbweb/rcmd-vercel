"use client";

import { TextAlignment, type TextBlockType } from "@/types";
import {
	Pencil,
	Trash2,
	AlignLeft,
	AlignRight,
	AlignJustify,
} from "lucide-react";
import { useState } from "react";
import DOMPurify from "dompurify";

interface Props {
	textBlock: TextBlockType;
	isEditing?: boolean;
	onDelete?: () => void;
	onSave?: (textBlock: Partial<TextBlockType>) => void;
}

export default function TextBlock({
	textBlock,
	isEditing: isEditMode,
	onDelete,
	onSave,
}: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(textBlock.text);
	const [alignment, setAlignment] = useState(
		textBlock.alignment ?? TextAlignment.Left
	);

	const handleSave = () => {
		if (onSave) {
			onSave({ text, alignment });
		}
		setIsEditing(false);
	};

	const alignmentClasses = {
		[TextAlignment.Left]: "text-left",
		[TextAlignment.Center]: "text-center",
		[TextAlignment.Right]: "text-right",
	};

	const sanitizeConfig = {
		USE_PROFILES: { html: true },
		ALLOWED_TAGS: [
			"p",
			"br",
			"strong",
			"em",
			"u",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"ul",
			"ol",
			"li",
			"a",
			"blockquote",
			"code",
			"pre",
			"div",
			"span",
		],
		ALLOWED_ATTR: ["href", "target", "rel", "class"],
		ADD_ATTR: ["target"],
		ALLOWED_URI_REGEXP:
			/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
	};

	return (
		<div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-4">
			{isEditMode && (
				<div className="flex justify-end mb-2 gap-2">
					<button
						onClick={() => setIsEditing(!isEditing)}
						className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
					>
						<Pencil className="w-5 h-5" />
					</button>
					<button
						onClick={onDelete}
						className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				</div>
			)}

			{isEditing ? (
				<div>
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
						rows={4}
					/>
					<div className="flex gap-2 mt-2">
						<button
							onClick={() => setAlignment(TextAlignment.Left)}
							className={`p-2 rounded ${alignment === TextAlignment.Left
									? "bg-gray-200 dark:bg-gray-600"
									: ""
								}`}
							title="Align left"
						>
							<AlignLeft className="w-5 h-5" />
						</button>
						<button
							onClick={() => setAlignment(TextAlignment.Center)}
							className={`p-2 rounded ${alignment === TextAlignment.Center
									? "bg-gray-200 dark:bg-gray-600"
									: ""
								}`}
							title="Align center"
						>
							<AlignJustify className="w-5 h-5" />
						</button>
						<button
							onClick={() => setAlignment(TextAlignment.Right)}
							className={`p-2 rounded ${alignment === TextAlignment.Right
									? "bg-gray-200 dark:bg-gray-600"
									: ""
								}`}
							title="Align right"
						>
							<AlignRight className="w-5 h-5" />
						</button>
					</div>
					<div className="mt-2 flex justify-end gap-2">
						<button
							onClick={() => setIsEditing(false)}
							className="px-3 py-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
						>
							Save
						</button>
					</div>
				</div>
			) : (
				<div
					className={`prose dark:prose-invert max-w-none ${alignmentClasses[alignment]}`}
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(text, sanitizeConfig),
					}}
				/>
			)}
		</div>
	);
}