'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Editor, ReactRenderer } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Suggestion, SuggestionOptions } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
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
  Table,
  MessageSquare,
} from 'lucide-react';

export interface SlashCommand {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: <List className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Blockquote',
    description: 'Quoted text block',
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Syntax-highlighted code',
    icon: <Code className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Image',
    description: 'Insert an image from URL',
    icon: <Image className="h-4 w-4" />,
    command: (editor) => {
      // Trigger file upload via hidden input
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
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule separator',
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Callout',
    description: 'Highlighted info block',
    icon: <MessageSquare className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setCallout({ type: 'info' }).run();
    },
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: <Table className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
];

// ---- Slash Command List Component ----

interface CommandListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

export interface CommandListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const CommandList = forwardRef<CommandListHandle, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Scroll selected item into view
    useEffect(() => {
      const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 w-64">
          <p className="text-sm text-zinc-400">No matching commands</p>
        </div>
      );
    }

    return (
      <div
        ref={listRef}
        className="bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden w-64 max-h-72 overflow-y-auto"
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            data-index={index}
            onClick={() => command(item)}
            className={`w-full flex items-center gap-3 px-3 min-h-[44px] text-left transition-colors ${
              index === selectedIndex
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <span className="shrink-0 text-zinc-500">{item.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="text-sm font-medium block">{item.title}</span>
              <span className="text-xs text-zinc-400 block truncate">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }
);
CommandList.displayName = 'CommandList';

// ---- Slash Commands Extension ----

export function createSlashCommandsExtension() {
  return Extension.create({
    name: 'slashCommands',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: { editor: Editor; range: any; props: SlashCommand }) => {
            // Delete the slash and query text
            editor.chain().focus().deleteRange(range).run();
            // Execute the selected command
            props.command(editor);
          },
          items: ({ query }: { query: string }) => {
            return SLASH_COMMANDS.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            let component: ReactRenderer<CommandListHandle> | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  animation: false,
                });
              },

              onUpdate: (props: any) => {
                component?.updateProps(props);
                if (popup && props.clientRect) {
                  popup[0]?.setProps({
                    getReferenceClientRect: props.clientRect,
                  });
                }
              },

              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return component?.ref?.onKeyDown(props.event) || false;
              },

              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        } as Partial<SuggestionOptions>,
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
}
