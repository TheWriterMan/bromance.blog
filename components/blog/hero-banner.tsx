'use client';

import { useEffect, useState } from 'react';

const HERO_IMAGE_URL = 'https://res.cloudinary.com/dtperak4e/image/upload/q_auto,f_auto,w_1920/bromance-blog/hero-banner.jpg';

export default function HeroBanner() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsDark(document.documentElement.classList.contains('dark'));

    // Watch for class changes on <html>
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden" id="hero-banner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMAGE_URL}
        alt="Bromance"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0"
        suppressHydrationWarning
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent, rgb(12,10,9))'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgb(250,250,249))'
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-lg tracking-tight">
          BROMANCE
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-white/90 font-sans drop-shadow max-w-xl">
          Donghua, Drama, Manga &amp; Novel Reviews
        </p>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
