import Link from 'next/link';
import { Coffee, BookOpen, Mail } from 'lucide-react';

interface BlogFooterProps {
  siteName: string;
  description: string;
  copyright: string;
  kofiLink: string;
  contactEmail: string;
}

export default function BlogFooter({
  siteName,
  description,
  copyright,
  kofiLink,
  contactEmail,
}: BlogFooterProps) {
  return (
    <footer className="mt-20 py-12 px-6 border-t border-solid border-[var(--color-primary)] max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-8">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-[var(--color-primary)]">{siteName}</h2>
        <p className="mt-2 text-sm font-medium text-[var(--color-primary)] opacity-80">{description}</p>
        <p className="mt-6 text-xs font-semibold text-[var(--color-primary)] opacity-50">{copyright}</p>
      </div>
      <div className="flex flex-wrap gap-12">
        <div className="flex flex-col gap-3 text-[var(--color-primary)]">
          <h3 className="font-extrabold mb-1">MORE FROM US</h3>
          {kofiLink && (
            <a
              href={kofiLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            >
              <Coffee className="w-4 h-4" /> Buy us a coffee
            </a>
          )}
          <Link href="/my-work" className="text-sm font-bold flex items-center gap-2 hover:opacity-70 transition-opacity">
            <BookOpen className="w-4 h-4" /> Read Our Novels
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-[var(--color-primary)]">
          <h3 className="font-extrabold mb-1">CONTACT</h3>
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm flex items-center gap-2 hover:underline decoration-dotted underline-offset-4 transition-all"
            >
              <Mail className="w-4 h-4" /> {contactEmail}
            </a>
          ) : (
            <span className="text-sm opacity-50">Coming soon</span>
          )}
        </div>
      </div>
    </footer>
  );
}
