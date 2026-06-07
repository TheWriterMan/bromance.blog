'use client';

import React, { useCallback } from 'react';
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Heading2,
  Heading3,
  Quote,
  Code,
} from 'lucide-react';

interface BubbleMenuProps {
  editor: Editor;
}

export default function BubbleMenu({ editor }: BubbleMenuProps) {
  const handleLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 bg-zinc-900 rounded-lg shadow-xl px-1.5 py-1 border border-zinc-700"
    >
      <BubbleButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <Underline className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </BubbleButton>

      <Divider />

      <BubbleButton
        active={editor.isActive('link')}
        onClick={handleLink}
        label="Link"
      >
        <Link className="h-4 w-4" />
      </BubbleButton>

      <Divider />

      <BubbleButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </BubbleButton>

      <BubbleButton
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="Inline code"
      >
        <Code className="h-4 w-4" />
      </BubbleButton>
    </TiptapBubbleMenu>
  );
}

function BubbleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-white/20 text-white'
          : 'text-zinc-300 hover:text-white hover:bg-white/10'
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-600 mx-0.5" />;
}
