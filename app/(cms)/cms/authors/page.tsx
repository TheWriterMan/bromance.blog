'use client';

import React, { useState, useEffect, useRef } from 'react';
import CmsShell from '@/components/cms/layout/cms-shell';
import { DESIGN } from '@/lib/design';

interface AuthorData {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function CmsAuthorsPage() {
  const [author, setAuthor] = useState<AuthorData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/authors');
        if (res.ok) {
          const data = await res.json();
          setAuthor(data);
          setDisplayName(data.display_name || '');
          setSlug(data.slug || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null);
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load author data' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  async function handleSave() {
    if (!displayName.trim() || !slug.trim()) {
      setMessage({ type: 'error', text: 'Display name and slug are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/authors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          slug: slug.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAuthor(updated);
        setMessage({ type: 'success', text: 'Author profile saved' });
        setTimeout(() => setMessage(null), 3000);
      } else if (res.status === 503) {
        setMessage({ type: 'error', text: 'Authors table not yet created in database' });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/authors/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
        setMessage({ type: 'success', text: 'Avatar uploaded' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to upload avatar' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <CmsShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-zinc-200 w-48 rounded" />
          <div className="h-64 bg-zinc-100 rounded-lg" />
        </div>
      </CmsShell>
    );
  }

  return (
    <CmsShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Author Profile</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage how the author appears on the public blog.
          </p>
        </div>

        {/* Status message */}
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-2xl font-bold">
                    {displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={DESIGN.secondaryButton}
                >
                  {uploading ? 'Uploading...' : 'Upload avatar'}
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl(null)}
                    className="block text-xs text-red-600 hover:text-red-800"
                  >
                    Remove avatar
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (!author?.slug || slug === generateSlug(author.display_name || '')) {
                  setSlug(generateSlug(e.target.value));
                }
              }}
              placeholder="Amy97"
              className={DESIGN.input}
              maxLength={100}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="amy97"
              className={DESIGN.input}
              maxLength={100}
            />
            <p className="text-xs text-zinc-400 mt-1">URL path: /author/{slug || '...'}</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about the author..."
              className={DESIGN.textarea}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-zinc-400 mt-1">{bio.length}/500</p>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim() || !slug.trim()}
              className={DESIGN.primaryButton}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </CmsShell>
  );
}
