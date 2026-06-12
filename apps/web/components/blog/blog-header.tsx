'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Coffee, BookOpen } from 'lucide-react';
import SearchOverlay from './search-overlay';

export interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogHeaderProps {
  siteName: string;
  kofiLink: string;
  categories: HeaderCategory[];
}

export default function BlogHeader({ siteName, kofiLink, categories }: BlogHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isHome = pathname === '/';
  const isMyWork = pathname?.startsWith('/my-work');
  const navLink = 'hover:opacity-70 transition-all uppercase tracking-wider';
  const active = 'underline underline-offset-8 decoration-2';

  return (
    <>
      <div className="sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-primary)]/10 shadow-sm">
        <header className="pt-6 pb-4 px-6 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Bromance.blog" className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-md" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--color-primary)] leading-none">
                  Bromance.blog
                </h1>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 font-bold text-sm tracking-wide text-[var(--color-primary)]">
              <Link href="/" className={`${navLink} ${isHome ? active : ''}`}>
                Blog
              </Link>
              <Link href="/my-work" className={`${navLink} flex items-center gap-1.5 ${isMyWork ? active : ''}`}>
                <BookOpen className="w-4 h-4" /> My Work
              </Link>

              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="flex items-center gap-2 hover:opacity-70 transition-opacity min-h-[44px]"
              >
                <Search className="w-4 h-4" />
                <span className="text-[var(--color-primary)]/50">Search…</span>
              </button>

              {kofiLink && (
                <a
                  href={kofiLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-200"
                >
                  <Coffee className="w-4 h-4" />
                  Support Creator
                </a>
              )}
            </div>

            <div className="md:hidden flex items-center gap-4">
              <button onClick={() => setSearchOpen(true)} aria-label="Search" className="text-[var(--color-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Search className="w-6 h-6" />
              </button>
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-[var(--color-primary)] active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {categories.length > 0 && (
            <nav className="hidden md:flex gap-6 font-bold text-sm tracking-wider text-[var(--color-primary)] overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="hover:underline underline-offset-8 uppercase whitespace-nowrap transition-all duration-300 hover:opacity-70"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}
        </header>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-[var(--color-bg)] z-50 flex flex-col overflow-y-auto md:hidden">
          <div className="flex justify-between items-center p-6 border-b border-[var(--color-primary)]/10">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Bromance.blog" className="w-8 h-8 rounded-md" />
              <h2 className="text-xl font-black text-[var(--color-primary)]">Bromance.blog</h2>
            </div>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-[var(--color-primary)] active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col p-6 gap-6 text-[var(--color-primary)]">
            <div className="flex flex-col gap-4 text-2xl font-extrabold mt-2">
              <Link href="/" onClick={() => setMobileOpen(false)} className="hover:translate-x-2 transition-transform uppercase">
                Home
              </Link>
              <Link href="/my-work" onClick={() => setMobileOpen(false)} className="hover:translate-x-2 transition-transform flex items-center gap-3 text-[#cc0000]">
                <BookOpen className="w-6 h-6" /> My Work
              </Link>
              <hr className="border-[var(--color-primary)]/10" />
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="hover:translate-x-2 transition-transform uppercase"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {kofiLink && (
              <>
                <hr className="border-[var(--color-primary)]/20 my-2" />
                <a href={kofiLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity">
                  <Coffee className="w-5 h-5" /> Support on Ko-Fi
                </a>
              </>
            )}
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
