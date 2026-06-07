import React from 'react';
import { Heading1, Heading2, List, Image as ImageIcon, Code, Quote } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-zinc-200 pb-4 pt-4 mb-8 -mx-8 px-8 sm:-mx-12 sm:px-12 lg:-mx-16 lg:px-16 flex flex-wrap items-center gap-1.5 cursor-default">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('bold') ? 'bg-zinc-100 text-zinc-900 font-medium' : ''}`} title="Bold">
        <span className="font-bold font-serif w-4 h-4 flex items-center justify-center">B</span>
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('italic') ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Italic">
        <span className="italic font-serif w-4 h-4 flex items-center justify-center">I</span>
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('strike') ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Strike">
        <span className="line-through font-serif w-4 h-4 flex items-center justify-center">S</span>
      </button>

      <div className="w-px h-4 bg-zinc-200 mx-1"></div>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('heading', { level: 3 }) ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Heading 3">
        <span className="text-xs font-bold font-sans">H3</span>
      </button>

      <div className="w-px h-4 bg-zinc-200 mx-1"></div>

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('bulletList') ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Bullet List">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('blockquote') ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Blockquote">
        <Quote className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('codeBlock') ? 'bg-zinc-100 text-zinc-900' : ''}`} title="Code Block">
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-zinc-200 mx-1"></div>

      <button onClick={() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }} className={`p-1.5 rounded hover:bg-zinc-100 text-zinc-600 ${editor.isActive('link') ? 'bg-zinc-100 text-zinc-900 text-xs font-medium' : 'text-xs font-medium'}`} title="Link">Link</button>
      <button onClick={() => {
        const url = window.prompt('Image URL');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600" title="Image">
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
