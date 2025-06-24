// src/components/shared/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Strikethrough,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const editorConfig = {
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
      bulletList: {
        itemTypeName: "listItem",
        keepMarks: true,
        keepAttributes: true,
      },
      orderedList: {
        itemTypeName: "listItem",
        keepMarks: true,
        keepAttributes: true,
      },
    }),
  ],
  editorProps: {
    attributes: {
      class:
        "prose dark:prose-invert prose-sm sm:prose-base focus:outline-none min-h-[150px] border border-input bg-background/50 rounded-md p-4",
    },
  },
};

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex items-center flex-wrap gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 w-[1px]" />
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
       <Separator orientation="vertical" className="h-8 w-[1px]" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (richText: string) => void;
  className?: string;
}

export const RichTextEditor = ({ content, onChange, className }: RichTextEditorProps) => {
  const editor = useEditor({
    ...editorConfig,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
