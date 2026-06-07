'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import DropCursor from '@tiptap/extension-dropcursor';
import { Category, Tag, MediaItem, PostRevision } from '@/lib/db';
import { getCloudinaryUrl } from '@/lib/utils';

import BubbleMenu from './bubble-menu';
import FloatingInsert from './floating-insert';
import EditorHeader from './editor-header';
import SettingsPanel from './settings-panel';
import { createSlashCommandsExtension } from './slash-menu';

// ---- Upload helper ----
async function uploadFileToCloudinary(file: File): Promise<{ url: string; cloudinary_id: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return { url: data.url, cloudinary_id: data.cloudinary_id };
  } catch (err) {
    console.error('Image upload failed:', err);
    return null;
  }
}

// ---- Drag & Drop plugin (uploads to Cloudinary, no base64 in HTML) ----
function createDragDropPlugin() {
  return new Plugin({
    props: {
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

            // Insert placeholder, then replace with real URL after upload
            const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjRmNGY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VXBsb2FkaW5n4oCmPC90ZXh0Pjwvc3ZnPg==';

            if (coordinates) {
              const node = view.state.schema.nodes.image.create({ src: placeholderSrc, alt: file.name });
              const tr = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(tr);
            }

            uploadFileToCloudinary(file).then((result) => {
              if (!result) return;
              // Find and replace the placeholder image
              view.state.doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === placeholderSrc) {
                  const tr = view.state.tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    src: result.url,
                  });
                  view.dispatch(tr);
                  return false;
                }
              });
            });
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event) {
        if (event.clipboardData?.files?.length) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            const placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjRmNGY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VXBsb2FkaW5n4oCmPC90ZXh0Pjwvc3ZnPg==';

            const node = view.state.schema.nodes.image.create({ src: placeholderSrc, alt: file.name });
            const tr = view.state.tr.replaceSelectionWith(node);
            view.dispatch(tr);

            uploadFileToCloudinary(file).then((result) => {
              if (!result) return;
              view.state.doc.descendants((nodeInner, pos) => {
                if (nodeInner.type.name === 'image' && nodeInner.attrs.src === placeholderSrc) {
                  const updateTr = view.state.tr.setNodeMarkup(pos, undefined, {
                    ...nodeInner.attrs,
                    src: result.url,
                  });
                  view.dispatch(updateTr);
                  return false;
                }
              });
            });
            return true;
          }
        }
        return false;
      },
    },
  });
}

const DragAndDropExtension = Extension.create({
  name: 'dragAndDrop',
  addProseMirrorPlugins() {
    return [createDragDropPlugin()];
  },
});

// ---- Keyboard Shortcuts Extension ----
function createKeyboardShortcuts(onSave: () => void, onPublish: () => void) {
  return Extension.create({
    name: 'customKeyboardShortcuts',
    addKeyboardShortcuts() {
      return {
        'Mod-s': () => { onSave(); return true; },
        'Mod-Enter': () => { onPublish(); return true; },
        'Mod-k': () => {
          const previousUrl = this.editor.getAttributes('link').href;
          const url = window.prompt('URL', previousUrl);
          if (url === null) return true;
          if (url === '') {
            this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
          } else {
            this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
          return true;
        },
        'Mod-Shift-1': () => { this.editor.chain().focus().toggleHeading({ level: 1 }).run(); return true; },
        'Mod-Shift-2': () => { this.editor.chain().focus().toggleHeading({ level: 2 }).run(); return true; },
        'Mod-Shift-3': () => { this.editor.chain().focus().toggleHeading({ level: 3 }).run(); return true; },
        'Mod-Shift-b': () => { this.editor.chain().focus().toggleBulletList().run(); return true; },
      };
    },
  });
}

// ---- Main Editor Canvas Component ----

interface EditorCanvasProps {
  postId: string;
}

export default function EditorCanvas({ postId }: EditorCanvasProps) {
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);

  // Post fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [slug, setSlug] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('samples/workspace');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [authorName] = useState('slipperyslipped');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [noindex, setNoindex] = useState(0);
  const [ogImage, setOgImage] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);

  // Save function (defined before editor so shortcuts can reference it)
  const savePost = useCallback(async (isAutosave = false) => {
    if (!title.trim() && !isAutosave) return;
    if (isAutosave && savingState === 'saving') return;

    setSavingState('saving');
    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, '-')
      : title.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');

    const payload = {
      title: title || 'Untitled Post',
      slug: cleanSlug,
      content,
      summary,
      status,
      category_id: categoryId,
      featured_image: featuredImage,
      tagIds: selectedTagIds,
      meta_title: metaTitle,
      meta_description: metaDescription,
      canonical_url: canonicalUrl,
      noindex,
      og_image: ogImage,
      published_at: status === 'scheduled' && publishedAt
        ? new Date(publishedAt).toISOString()
        : status === 'published' ? new Date().toISOString() : null,
      isAutosave: false,
      createCheckpoint: true,
      checkpointNote: `Saved: ${new Date().toLocaleTimeString()}`,
    };

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setSlug(cleanSlug);
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 2000);
    } catch {
      setSavingState('error');
      setTimeout(() => setSavingState('idle'), 3000);
    }
  }, [postId, title, slug, content, summary, status, categoryId, featuredImage, selectedTagIds, metaTitle, metaDescription, canonicalUrl, noindex, ogImage, publishedAt, savingState]);

  const publishPost = useCallback(async () => {
    setStatus('published');
    // Need to save with published status
    setSavingState('saving');
    const cleanSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/\s+/g, '-')
      : title.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');

    const payload = {
      title: title || 'Untitled Post',
      slug: cleanSlug,
      content,
      summary,
      status: 'published',
      category_id: categoryId,
      featured_image: featuredImage,
      tagIds: selectedTagIds,
      meta_title: metaTitle,
      meta_description: metaDescription,
      canonical_url: canonicalUrl,
      noindex,
      og_image: ogImage,
      published_at: new Date().toISOString(),
      isAutosave: false,
      createCheckpoint: true,
      checkpointNote: 'Published',
    };

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Publish failed');
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 2000);
    } catch {
      setSavingState('error');
      setTimeout(() => setSavingState('idle'), 3000);
    }
  }, [postId, title, slug, content, summary, categoryId, featuredImage, selectedTagIds, metaTitle, metaDescription, canonicalUrl, noindex, ogImage]);

  // TipTap editor
  const tipTapEditor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: false,
      }),
      UnderlineExtension,
      DragAndDropExtension,
      DropCursor.configure({ color: '#a1a1aa', width: 2 }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'w-full max-h-[440px] object-cover rounded-lg border border-zinc-200 my-6',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline underline-offset-2' },
      }),
      Placeholder.configure({
        placeholder: 'Start writing, or type / for commands…',
        emptyEditorClass: 'is-editor-empty',
      }),
      createSlashCommandsExtension(),
      createKeyboardShortcuts(
        () => savePost(false),
        () => publishPost()
      ),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'outline-none text-zinc-900 text-base sm:text-[17px] leading-relaxed sm:leading-[1.8] font-sans ' +
          'prose prose-zinc max-w-none ' +
          '[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] ' +
          '[&_p.is-editor-empty:first-child::before]:text-zinc-300 ' +
          '[&_p.is-editor-empty:first-child::before]:float-left ' +
          '[&_p.is-editor-empty:first-child::before]:h-0 ' +
          '[&_p.is-editor-empty:first-child::before]:pointer-events-none ' +
          '[&_h1]:font-bold [&_h1]:text-3xl sm:[&_h1]:text-4xl [&_h1]:mt-8 [&_h1]:mb-4 ' +
          '[&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-6 [&_h2]:mb-3 ' +
          '[&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-5 [&_h3]:mb-2 ' +
          '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 [&_blockquote]:my-4 ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 ' +
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 ' +
          '[&_pre]:bg-zinc-950 [&_pre]:text-zinc-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:text-sm [&_pre]:font-mono ' +
          '[&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 ' +
          '[&_hr]:my-6 [&_hr]:border-zinc-200',
      },
    },
  });

  // Load post data
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [catsRes, tagsRes, mediaRes, postRes, revsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags'),
          fetch('/api/media'),
          fetch(`/api/posts/${postId}`),
          fetch(`/api/posts/${postId}/revisions`),
        ]);

        const [catsData, tagsData, mediaData] = await Promise.all([
          catsRes.json(), tagsRes.json(), mediaRes.json(),
        ]);

        if (!active) return;
        setCategories(catsData);
        setTags(tagsData);
        setMediaItems(mediaData);

        if (postRes.ok) {
          const post = await postRes.json();
          setTitle(post.title || '');
          setSlug(post.slug || '');
          setSummary(post.summary || '');
          setContent(post.content || '');
          setStatus(post.status || 'draft');
          setPublishedAt(post.published_at ? new Date(post.published_at).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
          setCategoryId(post.category_id || catsData[0]?.id || '');
          setFeaturedImage(post.featured_image || 'samples/workspace');
          setSelectedTagIds((post.tags || []).map((t: any) => t.id));
          setMetaTitle(post.meta_title || '');
          setMetaDescription(post.meta_description || '');
          setCanonicalUrl(post.canonical_url || '');
          setNoindex(post.noindex || 0);
          setOgImage(post.ogImage || '');
        }

        if (revsRes.ok) {
          setRevisions(await revsRes.json());
        }
      } catch (err) {
        console.error('Editor init error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => { active = false; };
  }, [postId]);

  // Set editor content once loaded
  useEffect(() => {
    if (tipTapEditor && !loading && content) {
      if (tipTapEditor.getHTML() !== content) {
        tipTapEditor.commands.setContent(content, { emitUpdate: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tipTapEditor]);

  // Set title in contenteditable div
  useEffect(() => {
    if (!loading && titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Autosave for drafts
  useEffect(() => {
    if (loading || status !== 'draft') return;
    const timer = setTimeout(() => {
      savePost(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [savePost, loading, status, content, title, summary]);

  // Revision restore
  async function restoreRevision(revisionId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      if (res.ok) {
        const restored = await res.json();
        setTitle(restored.title || '');
        setSlug(restored.slug || '');
        setContent(restored.content || '');
        if (tipTapEditor) {
          tipTapEditor.commands.setContent(restored.content || '', { emitUpdate: false });
        }
        if (titleRef.current) {
          titleRef.current.textContent = restored.title || '';
        }
      }
    } catch (err) {
      console.error('Restore failed:', err);
    }
  }

  function handleToggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  function handleTitleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.target as HTMLDivElement).textContent || '';
    setTitle(text);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      tipTapEditor?.commands.focus('start');
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <EditorHeader
        title={title}
        savingState={savingState}
        settingsOpen={settingsOpen}
        onSave={() => savePost(false)}
        onPublish={publishPost}
        onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        status={status}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 relative">
            {/* Floating insert button */}
            {tipTapEditor && <FloatingInsert editor={tipTapEditor} />}

            {/* Contenteditable title */}
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onKeyDown={handleTitleKeyDown}
              data-placeholder="Untitled"
              className="w-full text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 outline-none mb-6 empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-200 empty:before:pointer-events-none"
              role="textbox"
              aria-label="Post title"
            />

            {/* TipTap content */}
            <EditorContent editor={tipTapEditor} />

            {/* Bubble menu */}
            {tipTapEditor && <BubbleMenu editor={tipTapEditor} />}
          </div>
        </div>

        {/* Settings panel */}
        <SettingsPanel
          open={settingsOpen}
          status={status}
          onStatusChange={setStatus}
          publishedAt={publishedAt}
          onPublishedAtChange={setPublishedAt}
          authorName={authorName}
          slug={slug}
          onSlugChange={setSlug}
          summary={summary}
          onSummaryChange={setSummary}
          tags={tags}
          selectedTagIds={selectedTagIds}
          onToggleTag={handleToggleTag}
          featuredImage={featuredImage}
          onFeaturedImageSelect={setFeaturedImage}
          metaTitle={metaTitle}
          onMetaTitleChange={setMetaTitle}
          metaDescription={metaDescription}
          onMetaDescriptionChange={setMetaDescription}
          canonicalUrl={canonicalUrl}
          onCanonicalUrlChange={setCanonicalUrl}
          noindex={noindex}
          onNoindexChange={setNoindex}
          ogImage={ogImage}
          onOgImageChange={setOgImage}
          mediaItems={mediaItems}
          revisions={revisions}
          postId={postId}
          onRestoreRevision={restoreRevision}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
