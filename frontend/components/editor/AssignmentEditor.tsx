"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { WordCounter } from "@/components/editor/WordCounter";

export function AssignmentEditor({ content, target, onChange }: { content: string; target?: number; onChange: (value: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start with what you understand. You can add evidence and refine the structure as you go." })],
    content,
    editorProps: { attributes: { class: "writing-area", "aria-label": "Assignment draft" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  });
  useEffect(() => { if (editor && content !== editor.getHTML()) editor.commands.setContent(content || "", { emitUpdate: false }); }, [content, editor]);
  return <section className="panel editor-panel"><header className="panel-heading"><h2>Your draft</h2><WordCounter content={content} target={target} /></header><EditorToolbar editor={editor} /><EditorContent editor={editor} /></section>;
}
