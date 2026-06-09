import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

// --- Data Schemas ---
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  published_at: string;
  featured_image: string;
  views: number;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface SiteSettings {
  siteName: string;
  description: string;
  contactEmail: string;
  copyRights: string;
}

// --- Mock Data ---
const siteSettings: SiteSettings = {
  siteName: "Template",
  description: "— minimalist blog",
  contactEmail: "hello@example.com",
  copyRights: "© 2026 template"
};

const mockPosts: Post[] = [
  {
    id: '1',
    title: "Lorem ipsum dolor sit amet consectetur",
    slug: 'lorem-ipsum-dolor',
    summary: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
    content: '<p class="mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p><p class="mb-6">Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.</p>',
    published_at: '2026-06-01T10:00:00Z',
    featured_image: 'radial-gradient(circle at center, #ff91b2 0%, #a4c639 70%)',
    views: 120,
    category: { id: 'c1', name: 'Design', slug: 'design' },
    tags: []
  },
  {
    id: '2',
    title: "Duis aute irure dolor in reprehenderit",
    slug: 'duis-aute-irure',
    summary: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    content: '<p>Content hidden.</p>',
    published_at: '2026-05-15T10:00:00Z',
    featured_image: 'radial-gradient(circle at center, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
    views: 340,
    category: { id: 'c2', name: 'Culture', slug: 'culture' },
    tags: []
  },
  {
    id: '3',
    title: "Excepteur sint occaecat cupidatat non proident",
    slug: 'excepteur-sint',
    summary: 'Sunt in culpa qui officia deserunt mollit anim id est laborum. Pellentesque habitant morbi tristique senectus.',
    content: '<p>Content hidden.</p>',
    published_at: '2026-05-01T10:00:00Z',
    featured_image: 'radial-gradient(circle at center, #fbc2eb 0%, #a6c1ee 100%)',
    views: 210,
    category: { id: 'c1', name: 'Design', slug: 'design' },
    tags: []
  },
  {
    id: '4',
    title: "Phasellus molestie magna non est bibendum",
    slug: 'phasellus-molestie',
    summary: 'Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio. Donec nec justo eget felis facilisis.',
    content: '<p>Content hidden.</p>',
    published_at: '2025-04-10T10:00:00Z',
    featured_image: 'radial-gradient(circle at center, #2e0854 0%, #4a3b8c 40%, #e5e5e5 80%)',
    views: 890,
    category: { id: 'c3', name: 'Essays', slug: 'essays' },
    tags: []
  },
  {
    id: '5',
    title: "Nam nulla quam, gravida non commodo a",
    slug: 'nam-nulla-quam',
    summary: 'Sodales sit amet nisi pellentesque habitant morbi tristique senectus et netus.',
    content: '<p>Content hidden.</p>',
    published_at: '2026-03-20T10:00:00Z',
    featured_image: 'radial-gradient(circle at center, #d4fc79 0%, #96e6a1 100%)',
    views: 150,
    category: { id: 'c3', name: 'Essays', slug: 'essays' },
    tags: []
  }
];

export default function App() {
  const [view, setView] = useState<'home' | 'post'>('home');
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handlePostClick = (post: Post) => {
    setActivePost(mockPosts[0]); // Always loads the first post as the single CMS template
    setView('post');
    setIsSidebarOpen(false);
  };

  const goHome = () => {
    setView('home');
    setActivePost(null);
    setIsSidebarOpen(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getMonth() + 1}.${d.getDate()}.${d.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-white text-black font-serif selection:bg-black selection:text-white p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-6xl border-[3px] border-black bg-[#f8f8f8] flex flex-col relative overflow-hidden md:overflow-visible">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-baseline p-4 md:p-6 border-b-[3px] border-black bg-[#f4f4f4]">
          <div 
            className="flex items-baseline gap-2 md:gap-4 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={goHome}
          >
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{siteSettings.siteName}</h1>
            <span className="text-lg md:text-2xl text-gray-700">{siteSettings.description}</span>
          </div>
          <nav className="mt-2 md:mt-0 text-xl md:text-2xl font-bold tracking-wide">
            journal
          </nav>
        </header>

        {/* Content Area */}
        <main className="flex-grow flex flex-col">
          {view === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y-[3px] md:divide-y-0 md:border-b-[3px] border-black flex-grow">
              {mockPosts.map((post, index) => (
                <article 
                  key={post.id} 
                  className={`flex flex-col cursor-pointer group bg-[#f4f4f4] ${index % 3 !== 0 ? 'lg:border-l-[3px] border-black' : ''} ${(index + 1) % 2 === 0 ? 'md:border-l-[3px] lg:border-l-0 border-black' : ''} ${index > 2 ? 'lg:border-t-[3px] border-black' : ''} ${index > 1 ? 'md:border-t-[3px] lg:border-t-0 border-black' : ''}`}
                  onClick={() => handlePostClick(post)}
                >
                  <div 
                    className="aspect-[4/3] w-full border-b-[3px] border-black"
                    style={{ background: post.featured_image }}
                  />
                  <div className="p-4 md:p-6 flex-grow bg-[#f4f4f4] group-hover:bg-[#ebebeb] transition-colors flex flex-col">
                    <div className="text-xs font-sans font-bold uppercase tracking-wider mb-2 text-gray-600 flex items-center gap-2">
                      <span>{post.category?.name}</span>
                      <span>•</span>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold leading-tight tracking-tight mb-3">
                      {post.title}
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 font-serif line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {view === 'post' && activePost && (
            <div className="flex flex-col lg:flex-row flex-grow relative">
              
              {/* Post Content */}
              <div className="w-full lg:w-2/3 p-6 md:p-10 bg-[#f4f4f4] lg:border-r-[3px] border-black flex-grow">
                {/* Mobile Sidebar Toggle */}
                <div className="lg:hidden flex justify-end mb-6">
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                  >
                    <Menu size={16} /> Read More
                  </button>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
                  {activePost.title}
                </h1>
                
                <div className="text-xs md:text-sm font-sans font-semibold tracking-wider uppercase mb-10 flex items-center gap-2 text-gray-600">
                  <span>{activePost.category?.name}</span>
                  <span>✶</span>
                  <span>{formatDate(activePost.published_at)}</span>
                </div>

                <div 
                  className="prose prose-base md:prose-lg prose-p:font-serif prose-p:text-gray-800 prose-p:leading-relaxed max-w-none"
                  dangerouslySetInnerHTML={{ __html: activePost.content }}
                />
              </div>

              {/* Sidebar Mobile Overlay */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* Sidebar (Slide-out on mobile, static on desktop) */}
              <aside 
                className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-[#f4f4f4] z-50 border-l-[3px] border-black transform transition-transform duration-300 ease-in-out lg:relative lg:w-1/3 lg:max-w-none lg:border-l-0 lg:transform-none lg:transition-none flex flex-col overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
              >
                <div className="lg:hidden p-4 border-b-[3px] border-black flex justify-between items-center bg-white sticky top-0">
                  <span className="font-bold uppercase tracking-wider text-sm">Menu</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div 
                  className="hidden lg:block aspect-square w-full border-b-[3px] border-black shrink-0"
                  style={{ background: activePost.featured_image }}
                />

                <div className="p-6 border-b-[3px] border-black shrink-0">
                  <h3 className="text-xl font-bold mb-4 tracking-tight">Latest Posts</h3>
                  <ul className="space-y-4">
                    {mockPosts.filter(p => p.id !== activePost.id).slice(0, 4).map(post => (
                      <li key={post.id}>
                        <button 
                          onClick={() => handlePostClick(post)}
                          className="text-base font-bold leading-tight text-left hover:underline decoration-2 underline-offset-4"
                        >
                          {post.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 border-b-[3px] border-black shrink-0">
                  <h3 className="text-xl font-bold mb-4 tracking-tight">Categories</h3>
                  <ul className="space-y-2">
                    <li><button className="text-base hover:underline decoration-2 underline-offset-4 font-semibold">Culture</button></li>
                    <li><button className="text-base hover:underline decoration-2 underline-offset-4 font-semibold">Design</button></li>
                    <li><button className="text-base hover:underline decoration-2 underline-offset-4 font-semibold">Essays</button></li>
                  </ul>
                </div>

                <div className="p-6 shrink-0 bg-white">
                  <h3 className="text-xl font-bold mb-4 tracking-tight">Newsletter</h3>
                  <button className="border-[3px] border-black px-6 py-2 text-base font-bold bg-white hover:bg-black hover:text-white transition-colors w-full">
                    Subscribe
                  </button>
                </div>
              </aside>

            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t-[3px] border-black bg-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center text-sm font-sans font-semibold uppercase tracking-wider">
          <p>{siteSettings.copyRights}</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Twitter</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href={`mailto:${siteSettings.contactEmail}`} className="hover:underline">Contact</a>
          </div>
        </footer>

      </div>
    </div>
  );
}