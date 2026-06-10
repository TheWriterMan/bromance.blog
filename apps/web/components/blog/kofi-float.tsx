import { Coffee } from 'lucide-react';

export default function KofiFloat({ kofiLink }: { kofiLink: string }) {
  if (!kofiLink) return null;
  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-4">
      <a
        href={kofiLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Support the creator on Ko-fi"
        className="p-4 rounded-full border border-[var(--color-primary)] bg-[var(--color-bg)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-all duration-300 group flex items-center gap-0 hover:gap-3 overflow-hidden shadow-md"
      >
        <Coffee className="w-6 h-6 shrink-0 text-[#cc0000] group-hover:text-inherit" />
        <span className="font-bold whitespace-nowrap w-0 group-hover:w-[95px] transition-all duration-300 overflow-hidden text-sm inline-block">
          Support me
        </span>
      </a>
    </div>
  );
}
