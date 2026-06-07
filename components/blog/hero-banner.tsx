'use client';

import Image from 'next/image';

export default function HeroBanner() {
  return (
    <section className="relative w-full h-screen" id="hero-banner">
      <Image
        src="/hero-banner.jpg"
        alt="Bromance"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-50" />
    </section>
  );
}
