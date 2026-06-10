'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import DropCursor from '@tiptap/extension-dropcursor';
import Youtube from '@tiptap/extension-youtube';
import type { Category, Tag, MediaItem, PostRevision } from '@repo/db';

import BubbleMenu from './bubble-menu';
import FloatingInsert from './floating-insert';
import EditorHeader from './editor-header';
import DocumentHeader from './document-header';
import SettingsPanel from './settings-panel';
import { CodeBlockHighlight } from './extensions/code-block-highlight';
import { TableExtensions } from './extensions/table-block';
import { CalloutExtension } from './extensions/callout-block';
import RecoveryPrompt from './recovery-prompt';
import OfflineIndicator from './offline-indicator';
import { createSlashCommandsExtension } from './slash-menu';
import { saveDraft, getDraft, deleteDraft, DraftData } from '@/lib/draft-store';

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
  const router = useRouter();
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
  const [recoveryDraft, setRecoveryDraft] = useState<DraftData | null>(null);
  const [lastServerSave, setLastServerSave] = useState<number>(0); // timestamp of last successful save
  const [isDirty, setIsDirty] = useState(false);

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
      category_id: categoryId || null,
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
      setIsDirty(false);
      setLastServerSave(Date.now());
      deleteDraft(postId).catch(() => {});
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
      category_id: categoryId || null,
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
        codeBlock: false,
      }),
      UnderlineExtension,
      DragAndDropExtension,
      DropCursor.configure({ color: '#a1a1aa', width: 2 }),
      CodeBlockHighlight,
      ...TableExtensions,
      CalloutExtension,
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'w-full max-h-[440px] object-cover rounded-lg border border-zinc-200 my-6',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'youtube-embed',
        },
        inline: false,
        width: 0,
        height: 0,
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
      setContent(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          'outline-none text-zinc-900 text-base sm:text-[17px] leading-relaxed sm:leading-[1.8] font-sans ' +
          'prose prose-zinc max-w-none overflow-hidden ' +
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
        // If creating a new post, POST first then redirect
        if (postId === 'new') {
          const createRes = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Untitled Post', status: 'draft' }),
          });
          if (createRes.ok) {
            const newPost = await createRes.json();
            router.replace(`/cms/posts/${newPost.id}`);
          }
          return;
        }

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
        setCategories(catsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          parentId: c.parent_id || null,
          deletedAt: null,
        })));
        setTags(tagsData);
        setMediaItems(mediaData.map((m: any) => ({
          id: m.id,
          cloudinaryId: m.cloudinary_id,
          filename: m.filename,
          width: m.width,
          height: m.height,
          format: m.format,
          bytes: m.bytes,
          createdAt: new Date(m.created_at),
        })));

        if (postRes.ok) {
          const post = await postRes.json();
          setTitle(post.title || '');
          setSlug(post.slug || '');
          setSummary(post.summary || '');
          // Store raw content string — will be parsed as JSON in the setContent effect
          setContent(post.content || '');
          setStatus(post.status || 'draft');
          setPublishedAt(post.published_at ? new Date(post.published_at).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
          setCategoryId(post.category_id || '');
          setFeaturedImage(post.featured_image || 'samples/workspace');
          setSelectedTagIds((post.tags || []).map((t: any) => t.id));
          setMetaTitle(post.meta_title || '');
          setMetaDescription(post.meta_description || '');
          setCanonicalUrl(post.canonical_url || '');
          setNoindex(post.noindex || 0);
          setOgImage(post.ogImage || '');
          setLastServerSave(post.updated_at ? new Date(post.updated_at).getTime() : Date.now());
        }

        if (revsRes.ok) {
          const revsData = await revsRes.json();
          setRevisions(revsData.map((r: any) => ({
            id: r.id,
            postId: r.post_id,
            title: r.title,
            content: r.content,
            updatedBy: r.updated_by,
            createdAt: new Date(r.created_at),
          })));
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
  const contentLoadedRef = useRef(false);
  useEffect(() => {
    if (tipTapEditor && !loading && content && !contentLoadedRef.current) {
      contentLoadedRef.current = true;
      try {
        const parsed = JSON.parse(content);
        tipTapEditor.commands.setContent(parsed, { emitUpdate: false });
      } catch {
        // Fallback: if content is HTML (legacy), load it directly
        tipTapEditor.commands.setContent(content, { emitUpdate: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tipTapEditor, content]);

  // Set title in contenteditable div
  useEffect(() => {
    if (!loading && titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Autosave — all statuses, debounced 5s server save
  useEffect(() => {
    if (loading) return;
    setIsDirty(true);
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        savePost(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [savePost, loading, content, title, summary]);

  // IndexedDB local persistence — debounced 1s
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      const draftData: DraftData = {
        title, content, summary, status, categoryId,
        tags: selectedTagIds, featuredImage, slug,
        savedAt: Date.now(),
      };
      saveDraft(postId, draftData).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, title, content, summary, status, categoryId, selectedTagIds, featuredImage, slug, postId]);

  // beforeunload handler
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Offline retry: when coming back online, flush a save
  useEffect(() => {
    function handleOnline() {
      if (isDirty) {
        savePost(true);
      }
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isDirty, savePost]);

  // Recovery check on mount
  useEffect(() => {
    if (loading) return;
    getDraft(postId).then((draft) => {
      if (draft && draft.savedAt > lastServerSave) {
        setRecoveryDraft(draft);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function handleRestore() {
    if (!recoveryDraft) return;
    setTitle(recoveryDraft.title);
    setContent(recoveryDraft.content);
    setSummary(recoveryDraft.summary);
    setSlug(recoveryDraft.slug);
    setCategoryId(recoveryDraft.categoryId);
    setSelectedTagIds(recoveryDraft.tags);
    setFeaturedImage(recoveryDraft.featuredImage);
    if (tipTapEditor) {
      tipTapEditor.commands.setContent(recoveryDraft.content, { emitUpdate: false });
    }
    if (titleRef.current) {
      titleRef.current.textContent = recoveryDraft.title;
    }
    setRecoveryDraft(null);
  }

  function handleDiscardRecovery() {
    deleteDraft(postId).catch(() => {});
    setRecoveryDraft(null);
  }

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
      {/* Recovery prompt */}
      {recoveryDraft && (
        <RecoveryPrompt
          savedAt={recoveryDraft.savedAt}
          onRestore={handleRestore}
          onDiscard={handleDiscardRecovery}
        />
      )}

      {/* Offline indicator */}
      <OfflineIndicator />

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
          <div className="w-[80%] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 relative">
            {/* Floating insert button */}
            {tipTapEditor && <FloatingInsert editor={tipTapEditor} />}

            {/* Document Header: cover + title + meta row */}
            <DocumentHeader
              title={title}
              onTitleChange={setTitle}
              onTitleKeyDown={handleTitleKeyDown}
              titleRef={titleRef}
              featuredImage={featuredImage}
              onFeaturedImageChange={setFeaturedImage}
              categories={categories}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              slug={slug}
              onSlugChange={setSlug}
              publishedAt={publishedAt}
              onPublishedAtChange={setPublishedAt}
              status={status}
              onStatusChange={setStatus}
              mediaItems={mediaItems}
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
          summary={summary}
          onSummaryChange={setSummary}
          tags={tags}
          selectedTagIds={selectedTagIds}
          onToggleTag={handleToggleTag}
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
          revisions={revisions}
          postId={postId}
          onRestoreRevision={restoreRevision}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
