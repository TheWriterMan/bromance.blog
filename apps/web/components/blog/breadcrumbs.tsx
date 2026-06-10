import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70 mb-6 overflow-x-auto whitespace-nowrap text-[var(--color-primary)]">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition-colors duration-200 hover:opacity-100 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="opacity-50">{item.label}</span>
          )}
          {idx < items.length - 1 && <ChevronRight className="w-3 h-3" />}
        </span>
      ))}
    </nav>
  );
}
