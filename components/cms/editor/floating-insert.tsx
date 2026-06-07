'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Minus,
} from 'lucide-react';

interface FloatingInsertProps {
  editor: Editor;
}

interface InsertCommand {
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function FloatingInsert({ editor }: FloatingInsertProps) {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function checkEmpty() {
      if (!editor) return;

      const { $anchor } = editor.state.selection;
      const isEmptyParagraph =
        $anchor.parent.type.name === 'paragraph' &&
        $anchor.parent.content.size === 0;

      if (isEmptyParagraph && editor.isFocused) {
        // Get position of cursor
        const coords = editor.view.coordsAtPos($anchor.pos);
        const editorBounds = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.top - editorBounds.top,
          left: -36,
        });
        setVisible(true);
      } else {
        setVisible(false);
        setMenuOpen(false);
      }
    }

    editor.on('selectionUpdate', checkEmpty);
    editor.on('update', checkEmpty);
    editor.on('focus', checkEmpty);
    editor.on('blur', () => {
      // Small delay to allow menu clicks
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) {
          setVisible(false);
          setMenuOpen(false);
        }
      }, 150);
    });

    return () => {
      editor.off('selectionUpdate', checkEmpty);
      editor.off('update', checkEmpty);
      editor.off('focus', checkEmpty);
    };
  }, [editor]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const commands: InsertCommand[] = [
    { title: 'Heading 1', icon: <Heading1 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2', icon: <Heading2 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', icon: <Heading3 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet List', icon: <List className="h-4 w-4" />, action: () => editor.chain().focus().toggleBulletList().run() },
    { title: 'Numbered List', icon: <ListOrdered className="h-4 w-4" />, action: () => editor.chain().focus().toggleOrderedList().run() },
    { title: 'Blockquote', icon: <Quote className="h-4 w-4" />, action: () => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Code Block', icon: <Code className="h-4 w-4" />, action: () => editor.chain().focus().toggleCodeBlock().run() },
    { title: 'Image', icon: <Image className="h-4 w-4" />, action: () => { const url = window.prompt('Image URL'); if (url) editor.chain().focus().setImage({ src: url }).run(); } },
    { title: 'Divider', icon: <Minus className="h-4 w-4" />, action: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-auto z-10 hidden md:block"
      style={{ top: position.top, left: position.left }}
    >
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen(!menuOpen)}
        className="h-7 w-7 flex items-center justify-center rounded-full border border-zinc-300 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
        aria-label="Insert block"
      >
        <Plus className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-0 left-9 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden w-52 max-h-64 overflow-y-auto z-50"
        >
          {commands.map((cmd) => (
            <button
              key={cmd.title}
              onClick={() => {
                cmd.action();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 min-h-[44px] text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <span className="text-zinc-400">{cmd.icon}</span>
              <span>{cmd.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
