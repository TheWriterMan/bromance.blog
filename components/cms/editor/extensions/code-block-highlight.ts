import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export const CodeBlockHighlight = CodeBlockLowlight.configure({
  lowlight,
  HTMLAttributes: {
    class: 'hljs bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono',
  },
});
