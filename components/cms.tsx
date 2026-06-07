'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Editor from './editor';
import { Category, Tag } from '@/lib/db';

// Sub-components
import CmsHeader from './cms/cms-header';
import PostTable from './cms/post-table';

interface CMSProps {
  onExitCMS: () => void;
}

export default function CMS({ onExitCMS }: CMSProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor control
  const [isEditing, setIsEditing] = useState(false);
  const [editorPostId, setEditorPostId] = useState<string | null>(null);

  // Simple Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  async function loadAllCMSData() {
    try {
      setLoading(true);
      setError(null);
      const [postsRes, catsRes, tagsRes] = await Promise.all([
        fetch('/api/posts?status=all'),
        fetch('/api/categories'),
        fetch('/api/tags'),
      ]);

      if (!postsRes.ok || !catsRes.ok || !tagsRes.ok) {
        throw new Error('Server response mismatch. Stale DB state detected.');
      }

      const postsData = await postsRes.ok ? await postsRes.json() : { items: [] };
      setPosts(postsData.items || postsData);
      setCategories(await catsRes.ok ? await catsRes.json() : []);
      setTags(await tagsRes.ok ? await tagsRes.json() : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Synchronization offline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        loadAllCMSData();
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function triggerSeedDatabase() {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await loadAllCMSData();
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Delete this post permanently?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllCMSData();
      }
    } catch (err: any) {
      console.error(err);
    }
  }

  function startEditing(id: string | null) {
    setEditorPostId(id);
    setIsEditing(true);
  }

  function stopEditing() {
    setIsEditing(false);
    setEditorPostId(null);
    loadAllCMSData();
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-zinc-200 shadow-sm text-center">
          <h2 className="text-xl font-bold mb-2">CMS Login</h2>
          <p className="text-zinc-500 text-sm mb-6">Enter password to access the dashboard. (Hint: type &apos;admin&apos;)</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === 'admin') setIsAuthenticated(true);
            else alert('Incorrect password');
          }} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="cms-password" className="sr-only">Password</label>
              <input 
                id="cms-password"
                type="password" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500" 
                placeholder="Password..."
                aria-required="true"
              />
            </div>
            <button type="submit" className="w-full bg-zinc-950 text-white rounded-md py-2 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2">Login</button>
          </form>
          <button onClick={onExitCMS} className="mt-6 text-sm text-zinc-500 hover:text-zinc-900">Return to Blog</button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return <Editor postId={editorPostId} onClose={stopEditing} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900" id="cms-screen-container">
      <CmsHeader 
        onSeedDatabase={triggerSeedDatabase} 
        onExitCMS={onExitCMS} 
      />
      
      <main className="max-w-5xl mx-auto p-6 md:p-12" id="cms-main-content">
        <div className="mb-8 flex items-center justify-between" id="cms-dashboard-top-row">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Posts</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your blog content and articles.</p>
          </div>
          <button
            onClick={() => startEditing(null)}
            className="bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center space-x-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            id="btn-new-post"
            aria-label="Create new post"
          >
            <Plus className="h-4 w-4" />
            <span>New Post</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100" id="cms-sync-error">
            {error}
          </div>
        )}

        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden" id="cms-table-container">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-zinc-500 mb-4">No content found.</p>
              <button 
                onClick={triggerSeedDatabase} 
                className="text-zinc-900 font-medium underline cursor-pointer"
                id="btn-seed-empty-db"
              >
                Seed Mock Data
              </button>
            </div>
          ) : (
            <PostTable 
              posts={posts}
              onEditPost={startEditing}
              onDeletePost={handleDeletePost}
            />
          )}
        </div>
      </main>
    </div>
  );
}
