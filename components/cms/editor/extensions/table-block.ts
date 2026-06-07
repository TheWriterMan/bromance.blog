import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

export const TableExtensions = [
  Table.configure({
    resizable: true,
    HTMLAttributes: { class: 'border-collapse w-full my-4' },
  }),
  TableRow,
  TableCell.configure({
    HTMLAttributes: { class: 'border border-zinc-300 px-3 py-2 text-sm' },
  }),
  TableHeader.configure({
    HTMLAttributes: { class: 'border border-zinc-300 px-3 py-2 text-sm font-semibold bg-zinc-100' },
  }),
];
