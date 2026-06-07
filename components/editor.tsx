'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, Plus } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import { Category, Tag, MediaItem, PostRevision } from '@/lib/db';
import { getCloudinaryUrl } from '@/lib/utils';

// Sub-components
import EditorHeader from './cms/editor/editor-header';
import SettingsSidebar from './cms/editor/settings-sidebar';
import EditorToolbar from './cms/editor/editor-toolbar';

function createDragDropPlugin() {
  return new Plugin({
    props: {
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            
            const reader = new FileReader();
            reader.onload = async (e) => {
              const base64 = e.target?.result as string;
              if (coordinates) {
                const node = view.state.schema.nodes.image.create({ src: base64, alt: file.name });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
              // Upload to backend implicitly via route
              fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, base64 })
              }).catch(console.error);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event, slice) {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            
            const reader = new FileReader();
            reader.onload = async (e) => {
              const base64 = e.target?.result as string;
              const node = view.state.schema.nodes.image.create({ src: base64, alt: file.name });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
              
              fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, base64 })
              }).catch(console.error);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      }
    }
  });
}

const DragAndDropExtension = Extension.create({
  name: 'dragAndDrop',
  addProseMirrorPlugins() {
    return [createDragDropPlugin()];
  }
});

interface EditorProps {
  postId: string | null;
  onClose: () => void;
}

export default function Editor({ postId, onClose }: EditorProps) {
  // Config & taxonomies databases
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);

  // Form Fields
  const [id, setId] = useState<string | null>(postId);
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

  // SEO & Meta Overrides
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [noindex, setNoindex] = useState(0);
  const [ogImage, setOgImage] = useState('');

  // UI state managers
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tipTapEditor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      DragAndDropExtension,
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'w-full max-h-[440px] object-cover rounded-lg border border-zinc-200 my-8 flex mx-auto',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline underline-offset-2',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'flex-1 outline-none text-zinc-900 text-[17px] leading-[1.8] font-sans prose prose-zinc max-w-none [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:text-zinc-300 [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:pointer-events-none ' +
               '[&_h1]:font-bold [&_h1]:text-4xl [&_h1]:mt-10 [&_h1]:mb-4 ' +
               '[&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-4 ' +
               '[&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-3 ' +
               '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-zinc-600 [&_blockquote]:my-6 ' +
               '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul_li]:mb-1 ' +
               '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol_li]:mb-1 ' +
               '[&_pre]:bg-zinc-950 [&_pre]:text-zinc-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:text-sm [&_pre]:font-mono ' +
               '[&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2'
      },
    },
  });

  async function loadRevisions(postIdToLoad: string) {
    try {
      const res = await fetch(`/api/posts/${postIdToLoad}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const promises: Promise<Response>[] = [
          fetch('/api/categories'),
          fetch('/api/tags'),
          fetch('/api/media')
        ];

        let postPromise: Promise<Response> | null = null;
        let revsPromise: Promise<Response> | null = null;

        if (id) {
          postPromise = fetch(`/api/posts/${id}`);
          revsPromise = fetch(`/api/posts/${id}/revisions`);
        }

        const [catsRes, tagsRes, mediaRes] = await Promise.all(promises);
        
        const catsData = await catsRes.json();
        const tagsData = await tagsRes.json();
        const mediaData = await mediaRes.json();

        if (!active) return;
        setCategories(catsData);
        setTags(tagsData);
        setMediaItems(mediaData);

        let initialCategoryId = null;
        if (catsData.length > 0) {
          initialCategoryId = catsData[0].id;
        }

        if (id && postPromise && revsPromise) {
          const res = await postPromise;
          if (!res.ok) throw new Error('Post offline');
          const post = await res.json();

          if (!active) return;
          setTitle(post.title);
          setSlug(post.slug || '');
          setSummary(post.summary || '');
          setContent(post.content || '');
          setStatus(post.status);
          setPublishedAt(post.published_at ? new Date(post.published_at).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
          setCategoryId(post.category_id || initialCategoryId);
          setFeaturedImage(post.featured_image || 'samples/workspace');
          setSelectedTagIds((post.tags || []).map((t: any) => t.id));

          setMetaTitle(post.meta_title || '');
          setMetaDescription(post.meta_description || '');
          setCanonicalUrl(post.canonical_url || '');
          setNoindex(post.noindex || 0);
          setOgImage(post.ogImage || '');

          setLastSavedTime(new Date(post.updated_at).toLocaleTimeString());

          const revsRes = await revsPromise;
          if (revsRes.ok) {
            const revsData = await revsRes.json();
            setRevisions(revsData);
          }
        } else {
          setCategoryId(initialCategoryId);
          setPublishedAt(new Date().toISOString().substring(0, 10));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    init();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (tipTapEditor && !loading) {
      if (tipTapEditor.getHTML() !== content) {
        tipTapEditor.commands.setContent(content, { emitUpdate: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, id, tipTapEditor]); // Intentionally omitting content to avoid cursor jumps

  const savePost = useCallback(async (isAutosave = false) => {
    if (!title.trim()) {
      if (!isAutosave) alert('A Headline title is required to save.');
      return;
    }
    
    if (isAutosave && savingState === 'saving') return;
    
    setSavingState('saving');
    
    const cleanSlug = slug.trim() 
      ? slug.trim().toLowerCase().replace(/\s+/g, '-') 
      : title.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');

    const payload = {
      title,
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
      noindex: noindex,
      og_image: ogImage,
      published_at: status === 'scheduled' && publishedAt ? new Date(publishedAt).toISOString() : (status === 'published' ? new Date().toISOString() : null),
      isAutosave: false,
      createCheckpoint: true,
      checkpointNote: `Saved manually: ${new Date().toLocaleTimeString()}`
    };

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/posts/${id}` : '/api/posts';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Network error during save');
      const savedData = await res.json();

      if (!id) {
        setId(savedData.id);
      }
      setSlug(cleanSlug);
      setSavingState('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      setTimeout(() => setSavingState('idle'), 2000);
      
      if (id && !isAutosave) {
        loadRevisions(id);
      }
    } catch (e) {
      setSavingState('error');
      setTimeout(() => setSavingState('idle'), 3000);
    }
  }, [id, title, slug, content, summary, status, categoryId, featuredImage, selectedTagIds, metaTitle, metaDescription, canonicalUrl, noindex, ogImage, publishedAt, savingState]);

  // Debounced Autosave
  useEffect(() => {
    if (!id || status !== 'draft') return;
    const timer = setTimeout(() => {
      savePost(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [savePost, id, status, content, title, summary, categoryId, featuredImage, selectedTagIds]);

  async function restoreRevision(revisionId: string) {
    if (!id || !confirm('Restore this snapshot? Outstanding drafts will be checkpointed.')) return;
    try {
      const res = await fetch(`/api/posts/${id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId })
      });
      if (res.ok) {
        const restoredPost = await res.json();
        setTitle(restoredPost.title);
        setSlug(restoredPost.slug);
        setContent(restoredPost.content || '');
        if (tipTapEditor) {
          tipTapEditor.commands.setContent(restoredPost.content || '', { emitUpdate: false });
        }
        setLastSavedTime(new Date().toLocaleTimeString());
        loadRevisions(id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleImageInsert(item: MediaItem) {
    const imgUrl = getCloudinaryUrl(item.cloudinary_id);
    if (tipTapEditor) {
      tipTapEditor.chain().focus().setImage({ src: imgUrl, alt: item.filename }).run();
      setContent(tipTapEditor.getHTML());
    }
  }

  function handleToggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(prev => prev.filter(tid => tid !== tagId));
    } else {
      setSelectedTagIds(prev => [...prev, tagId]);
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-zinc-900 overflow-hidden relative" id="editor-screen-container">
      {/* Editor top header */}
      <EditorHeader 
        title={title}
        lastSavedTime={lastSavedTime}
        savingState={savingState}
        sidebarOpen={sidebarOpen}
        onClose={onClose}
        onSave={savePost}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center" id="editor-spinner-container">
          <Loader className="h-5 w-5 animate-spin text-zinc-900" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative" id="editor-workspace-pane">
          
          {/* Main Editing Canvas */}
          <div className="flex-1 overflow-y-auto w-full relative scrollbar-none pb-32" id="editor-main-canvas">
            <div className="max-w-3xl mx-auto p-8 sm:p-12 lg:p-16 flex flex-col space-y-6">
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article Title..."
                className="w-full text-4xl sm:text-5xl font-sans font-bold tracking-tight text-zinc-900 placeholder-zinc-200 outline-none border-0 p-0 mb-6"
                id="input-title-canvas"
              />

              {/* Tiptap Fixed Toolbar */}
              {tipTapEditor && <EditorToolbar editor={tipTapEditor} />}

              <EditorContent editor={tipTapEditor} id="rich-editor-canvas" />
            </div>
          </div>

          {/* COLLAPSABLE RIGHT SETTINGS SIDEBAR */}
          {sidebarOpen && (
            <SettingsSidebar 
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
              postId={id}
              onRestoreRevision={restoreRevision}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
