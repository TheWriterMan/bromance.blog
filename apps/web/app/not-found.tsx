import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <h1 className="text-7xl font-black tracking-tighter text-[#cc0000]">404</h1>
      <p className="mt-4 text-xl font-bold text-zinc-900">Page not found</p>
      <p className="mt-2 text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 bg-[#cc0000] text-white font-bold text-sm rounded hover:bg-red-800 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
