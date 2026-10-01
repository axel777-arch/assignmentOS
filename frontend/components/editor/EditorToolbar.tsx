"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return <div className="editor-toolbar" role="toolbar" aria-label="Draft formatting">
    <button className={editor.isActive("bold") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><Bold size={15} /></button>
    <button className={editor.isActive("italic") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic size={15} /></button>
    <button className={editor.isActive("underline") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline"><Underline size={15} /></button>
    <span className="toolbar-divider" />
    <button className={editor.isActive("bulletList") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bulleted list"><List size={15} /></button>
    <button className={editor.isActive("orderedList") ? "is-active" : ""} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered size={15} /></button>
  </div>;
}
