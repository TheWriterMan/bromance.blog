'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/lib/db';
import { DESIGN } from '@/lib/design';

// Sub-components
import BlogHeader from './blog/blog-header';
import CategoryFilter from './blog/category-filter';
import PostCard from './blog/post-card';
import PostDetail from './blog/post-detail';
import SearchBar from './blog/search-bar';
import TagCloud from './blog/tag-cloud';

interface BlogProps {
  initialCategory?: string;
  initialTag?: string;
}

export default function Blog({ initialCategory, initialTag }: BlogProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        let url = `/api/posts?status=published&page=${page}&limit=10&excludeContent=true`;
        if (selectedCategory) {
          url += `&category_id=${selectedCategory}`;
        }
        if (selectedTag) {
          url += `&tag=${selectedTag}`;
        }
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const [catRes, postsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(url)
        ]);

        if (!catRes.ok) throw new Error('Failed to retrieve categories');
        if (!postsRes.ok) throw new Error('Failed to retrieve publications');
        
        const [catData, postsData] = await Promise.all([
          catRes.json(),
          postsRes.json()
        ]);
        
        if (!active) return;
        setCategories(catData);
        setPosts(postsData.items || postsData);
        if (postsData.metadata) setTotalPages(postsData.metadata.totalPages);
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err?.message || 'Failed to sync content feed');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => { active = false; };
  }, [selectedCategory, selectedTag, searchQuery, retry, page]);

  function handleResetFilters() {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery('');
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 selection:bg-red-950 selection:text-white font-sans" id="blog-screen-container">
      {/* Editorial Header */}
      <BlogHeader 
        onResetFilters={handleResetFilters} 
      />

      {/* Main Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12" id="blog-main-content">
          <div className="flex flex-col lg:flex-row gap-16" id="blog-feed-grid">
            
            {/* Left Main Posts Directory Block */}
            <div className="flex-1 space-y-10" id="blog-feed-left-pane">
              
              <div className="border-b border-stone-800 pb-8 mb-4">
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-stone-900 mb-4">
                  The Archives
                </h1>
                <p className="font-sans text-lg text-stone-600 max-w-2xl">
                  An examination of true crime, historical enigmas, and legal philosophy. Select a dossier below or filter by division to investigate further.
                </p>
              </div>

              {/* Filtering */}
              <CategoryFilter 
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  setSelectedTag(null);
                  setPage(1);
                }}
              />

              {/* Feed Grid cards */}
              {error ? (
                <div className="text-center py-12 border border-stone-200 bg-stone-100 rounded p-6" id="blog-feed-error">
                  <p className="text-red-800 font-mono text-sm mb-4">ERROR ACCESSING ARCHIVES: {error}</p>
                  <button
                    onClick={() => setRetry(prev => prev + 1)}
                    className="px-4 py-2 bg-stone-900 text-stone-50 font-mono text-xs uppercase tracking-widest hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 rounded transition-colors"
                    id="btn-retry-feed"
                    aria-label="Retry loading publications"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : loading ? (
                <div className="space-y-12 py-6" id="blog-feed-loading">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col md:flex-row gap-8 animate-pulse">
                      <div className="w-full md:w-64 h-48 bg-stone-200 rounded shrink-0"></div>
                      <div className="flex-1 space-y-4">
                        <div className="h-4 bg-stone-200 w-32 rounded"></div>
                        <div className="h-8 bg-stone-200 w-3/4 rounded"></div>
                        <div className="h-20 bg-stone-200 w-full rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 border border-stone-200 bg-white rounded p-8" id="blog-feed-empty">
                  <h3 className="font-display font-medium text-stone-900 text-2xl mb-2">No Records Found</h3>
                  <p className="font-sans text-stone-500 text-lg max-w-sm mx-auto mb-6">
                    {searchQuery ? `The query "${searchQuery}" yielded no results in the database.` : 'The archives are currently empty for this classification.'}
                  </p>
                  {(searchQuery || selectedCategory || selectedTag) && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 border border-stone-300 text-stone-700 font-mono text-xs uppercase tracking-widest hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 rounded transition-colors"
                      id="btn-clear-filters"
                      aria-label="Clear all applied filters"
                    >
                      Clear Search Parameters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6" id="blog-posts-list">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id}
                      post={post}
                    />
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-12 pb-4">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={`text-xs font-mono uppercase tracking-widest px-4 py-2 border rounded ${page === 1 ? 'border-stone-200 text-stone-400 cursor-not-allowed' : 'border-stone-300 text-stone-800 hover:bg-stone-100'}`}
                      >
                        &larr; Previous
                      </button>
                      <span className="text-xs font-mono text-stone-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className={`text-xs font-mono uppercase tracking-widest px-4 py-2 border rounded ${page >= totalPages ? 'border-stone-200 text-stone-400 cursor-not-allowed' : 'border-stone-300 text-stone-800 hover:bg-stone-100'}`}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Sidebar */}
            <aside className="w-full lg:w-80 space-y-10" id="blog-feed-sidebar">
              
              {/* Search widget box */}
              <div className="bg-white p-6 border border-stone-200 rounded relative">
                <h3 className="font-display font-bold text-lg border-b border-stone-200 pb-2 mb-4">Investigate</h3>
                <SearchBar 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </div>

              {/* Tag Selection cloud widget */}
              <div className="bg-white p-6 border border-stone-200 rounded">
                <h3 className="font-display font-bold text-lg border-b border-stone-200 pb-2 mb-4">Evidence Tags</h3>
                <TagCloud 
                  posts={posts}
                  selectedTag={selectedTag}
                  onSelectTag={(tag) => {
                    setSelectedTag(tag);
                    setPage(1);
                  }}
                />
              </div>

            </aside>
          </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-900 py-12 mt-auto text-xs text-stone-400 font-mono tracking-widest text-center" id="blog-footer">
        <div className="max-w-6xl mx-auto px-6">
          <p>© 2026 BROMANCE. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
