/**
 * TipTap JSON → HTML serializer (server-safe, dependency-free).
 *
 * Posts store content as stringified TipTap JSON (see scripts/import-reviews.ts
 * and the editor's onUpdate which calls editor.getJSON()). The public blog needs
 * to render that as HTML in server components for SEO.
 *
 * `@tiptap/core`'s generateHTML relies on a DOM (window.document) and would
 * require jsdom on the server, so we serialize the document tree directly here.
 * The output mirrors the classes the editor applies so styling stays consistent.
 *
 * If the stored content is not valid TipTap JSON (e.g. legacy HTML), it is
 * returned as-is.
 */

import { getCloudinaryUrl } from './utils';

type JSONNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  content?: JSONNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const MARK_TAGS: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  code: 'code',
};

function applyMarks(html: string, marks?: JSONNode['marks']): string {
  if (!marks || marks.length === 0) return html;
  // Wrap inner-most first; iterate in reverse so order is stable.
  return marks.reduce((acc, mark) => {
    if (mark.type === 'link') {
      const href = escapeAttr(mark.attrs?.href || '#');
      const target = mark.attrs?.target ? ` target="${escapeAttr(mark.attrs.target)}"` : '';
      const rel = mark.attrs?.target === '_blank' ? ' rel="noopener noreferrer"' : '';
      return `<a href="${href}"${target}${rel} class="text-[var(--color-primary)] underline underline-offset-2 hover:opacity-70 transition-opacity">${acc}</a>`;
    }
    const tag = MARK_TAGS[mark.type];
    if (!tag) return acc;
    const cls = mark.type === 'code'
      ? ' class="px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[0.9em] font-mono"'
      : '';
    return `<${tag}${cls}>${acc}</${tag}>`;
  }, html);
}

function renderChildren(nodes?: JSONNode[]): string {
  if (!nodes) return '';
  return nodes.map(renderNode).join('');
}

function renderNode(node: JSONNode): string {
  switch (node.type) {
    case 'text':
      return applyMarks(escapeHtml(node.text || ''), node.marks);

    case 'paragraph':
      return `<p class="mb-6 leading-relaxed">${renderChildren(node.content)}</p>`;

    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 6);
      const sizes: Record<number, string> = {
        1: 'text-4xl mt-10 mb-4',
        2: 'text-3xl mt-8 mb-4',
        3: 'text-2xl mt-8 mb-3',
        4: 'text-xl mt-6 mb-3',
        5: 'text-lg mt-6 mb-2',
        6: 'text-base mt-4 mb-2',
      };
      return `<h${level} class="font-bold tracking-tight ${sizes[level]}">${renderChildren(node.content)}</h${level}>`;
    }

    case 'blockquote':
      return `<blockquote class="border-l-4 border-[var(--color-primary)]/40 pl-5 italic my-6 opacity-90">${renderChildren(node.content)}</blockquote>`;

    case 'bulletList':
      return `<ul class="list-disc pl-6 my-6 space-y-2">${renderChildren(node.content)}</ul>`;

    case 'orderedList':
      return `<ol class="list-decimal pl-6 my-6 space-y-2">${renderChildren(node.content)}</ol>`;

    case 'listItem':
      return `<li class="leading-relaxed">${renderChildren(node.content)}</li>`;

    case 'codeBlock': {
      const lang = node.attrs?.language ? ` data-language="${escapeAttr(node.attrs.language)}"` : '';
      const inner = (node.content || []).map((c) => escapeHtml(c.text || '')).join('');
      return `<pre class="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto my-6 text-sm font-mono"${lang}><code>${inner}</code></pre>`;
    }

    case 'horizontalRule':
      return `<hr class="my-10 border-[var(--color-primary)]/20" />`;

    case 'hardBreak':
      return '<br />';

    case 'image': {
      const rawSrc = node.attrs?.src || '';
      const src = escapeAttr(getCloudinaryUrl(rawSrc, 'content'));
      const alt = escapeAttr(node.attrs?.alt || '');
      return `<img src="${src}" alt="${alt}" loading="lazy" class="w-full h-auto rounded-sm my-8 border border-[var(--color-primary)]/10" />`;
    }

    case 'youtube': {
      const src = node.attrs?.src || '';
      const match = String(src).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
      const id = match ? match[1] : '';
      if (!id) return '';
      return `<div class="relative w-full my-8 aspect-video"><iframe src="https://www.youtube.com/embed/${escapeAttr(id)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full rounded-sm border border-[var(--color-primary)]/10"></iframe></div>`;
    }

    case 'callout': {
      const type = (node.attrs?.type as string) || 'info';
      const palette: Record<string, string> = {
        info: 'border-blue-500 bg-blue-50',
        warning: 'border-amber-500 bg-amber-50',
        success: 'border-emerald-500 bg-emerald-50',
        error: 'border-red-500 bg-red-50',
      };
      const cls = palette[type] || palette.info;
      return `<div class="border-l-4 ${cls} p-4 rounded-r-lg my-6">${renderChildren(node.content)}</div>`;
    }

    case 'table':
      return `<div class="overflow-x-auto my-6"><table class="border-collapse w-full">${renderChildren(node.content)}</table></div>`;

    case 'tableRow':
      return `<tr>${renderChildren(node.content)}</tr>`;

    case 'tableHeader':
      return `<th class="border border-[var(--color-primary)]/20 px-3 py-2 text-sm font-semibold bg-[var(--color-primary)]/5 text-left">${renderChildren(node.content)}</th>`;

    case 'tableCell':
      return `<td class="border border-[var(--color-primary)]/20 px-3 py-2 text-sm">${renderChildren(node.content)}</td>`;

    case 'doc':
      return renderChildren(node.content);

    default:
      // Unknown node: render its children so content is never silently dropped.
      return renderChildren(node.content);
  }
}

/**
 * Convert stored post content (TipTap JSON string) to an HTML string.
 * Falls back to returning the input unchanged if it is not valid TipTap JSON.
 */
export function renderPostContent(content: string | null | undefined): string {
  if (!content) return '';
  const trimmed = content.trim();
  // Legacy/HTML content — return as-is.
  if (!trimmed.startsWith('{')) return trimmed;
  try {
    const doc = JSON.parse(trimmed) as JSONNode;
    if (!doc || doc.type !== 'doc') return trimmed;
    return renderNode(doc);
  } catch {
    return trimmed;
  }
}

/** Extract plain text from TipTap JSON (for excerpts / meta descriptions). */
export function extractPlainText(content: string | null | undefined, maxLength = 0): string {
  if (!content) return '';
  const trimmed = content.trim();
  let text = '';
  if (trimmed.startsWith('{')) {
    try {
      const walk = (node: JSONNode): void => {
        if (node.text) text += node.text + ' ';
        node.content?.forEach(walk);
      };
      walk(JSON.parse(trimmed));
    } catch {
      text = trimmed.replace(/<[^>]*>/g, ' ');
    }
  } else {
    text = trimmed.replace(/<[^>]*>/g, ' ');
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (maxLength > 0 && text.length > maxLength) {
    return text.slice(0, maxLength).trimEnd() + '…';
  }
  return text;
}
