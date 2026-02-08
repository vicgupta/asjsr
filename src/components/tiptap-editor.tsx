"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import type { JSONContent } from "@tiptap/react";

interface TiptapEditorProps {
  content?: JSONContent;
  onChange: (json: JSONContent, html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] focus:outline-none p-4",
      },
    },
  });

  if (!editor) return null;

  function addLink() {
    const url = window.prompt("URL");
    if (url) {
      editor!
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }

  function addImage() {
    const url = window.prompt("Image URL");
    if (url) {
      editor!.chain().focus().setImage({ src: url }).run();
    }
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 border-b p-2 bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          onClick={addLink}
        >
          Link
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage}>
          Image
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
