'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Plus, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Image, Minus, Youtube } from 'lucide-react';

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
  const [top, setTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const suppressBlurRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (!editor || !editor.view) return;

    const { $anchor } = editor.state.selection;
    const isEmptyParagraph =
      $anchor.parent.type.name === 'paragraph' &&
      $anchor.parent.content.size === 0;

    if (isEmptyParagraph && (editor.isFocused || menuOpen)) {
      try {
        const coords = editor.view.coordsAtPos($anchor.pos);
        const editorEl = editor.view.dom.closest('.relative') || editor.view.dom.parentElement;
        if (!editorEl) return;
        const editorRect = editorEl.getBoundingClientRect();
        const newTop = coords.top - editorRect.top;
        setTop(newTop);
        setVisible(true);
      } catch {
        setVisible(false);
        setMenuOpen(false);
      }
    } else if (!menuOpen) {
      setVisible(false);
    }
  }, [editor, menuOpen]);

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', updatePosition);
    editor.on('update', updatePosition);
    editor.on('focus', updatePosition);

    const handleBlur = () => {
      // Don't hide if the user is interacting with our menu
      setTimeout(() => {
        if (suppressBlurRef.current) return;
        if (menuRef.current?.contains(document.activeElement)) return;
        if (buttonRef.current?.contains(document.activeElement)) return;
        if (!menuOpen) {
          setVisible(false);
        }
      }, 200);
    };

    editor.on('blur', handleBlur);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('update', updatePosition);
      editor.off('focus', updatePosition);
      editor.off('blur', handleBlur);
    };
  }, [editor, updatePosition, menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        editor.commands.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen, editor]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    suppressBlurRef.current = true;
    setMenuOpen((prev) => !prev);
    // Re-allow blur after a tick
    setTimeout(() => {
      suppressBlurRef.current = false;
    }, 300);
  };

  const executeCommand = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  const commands: InsertCommand[] = [
    { title: 'Heading 1', icon: <Heading1 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2', icon: <Heading2 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3', icon: <Heading3 className="h-4 w-4" />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet List', icon: <List className="h-4 w-4" />, action: () => editor.chain().focus().toggleBulletList().run() },
    { title: 'Numbered List', icon: <ListOrdered className="h-4 w-4" />, action: () => editor.chain().focus().toggleOrderedList().run() },
    { title: 'Blockquote', icon: <Quote className="h-4 w-4" />, action: () => editor.chain().focus().toggleBlockquote().run() },
    { title: 'Code Block', icon: <Code className="h-4 w-4" />, action: () => editor.chain().focus().toggleCodeBlock().run() },
    { title: 'YouTube Video', icon: <Youtube className="h-4 w-4" />, action: () => {
      const url = window.prompt('YouTube URL');
      if (url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (match) {
          editor.commands.setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${match[1]}` });
        }
      }
    }},
    { title: 'Image', icon: <Image className="h-4 w-4" />, action: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        } catch (err) {
          console.error('Image upload failed:', err);
        }
      };
      input.click();
    }},
    { title: 'Divider', icon: <Minus className="h-4 w-4" />, action: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 z-10 hidden md:block"
      style={{ top: `${top}px`, transform: 'translateX(-44px)' }}
    >
      <button
        ref={buttonRef}
        onMouseDown={handleButtonClick}
        className={`h-7 w-7 flex items-center justify-center rounded-full border transition-all ${
          menuOpen
            ? 'border-zinc-400 bg-zinc-100 text-zinc-700 rotate-45'
            : 'border-zinc-300 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
        }`}
        aria-label="Insert block"
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-0 left-9 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden w-52 max-h-72 overflow-y-auto"
        >
          {commands.map((cmd) => (
            <button
              key={cmd.title}
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand(cmd.action);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              type="button"
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
