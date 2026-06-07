'use client';

import Image from 'next/image';

const HERO_IMAGE_URL = 'https://res.cloudinary.com/dtperak4e/image/upload/q_auto,f_auto,w_1920/bromance-blog/hero-banner.jpg';

export default function HeroBanner() {
  return (
    <section className="relative w-full h-screen overflow-hidden" id="hero-banner">
      <Image
        src={HERO_IMAGE_URL}
        alt="Bromance — Donghua, Drama & Manga"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-stone-50" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-lg tracking-tight">
          BROMANCE
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-white/90 font-sans drop-shadow max-w-xl">
          Donghua, Drama, Manga & Novel Reviews
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
