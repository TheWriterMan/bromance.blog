import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCloudinaryUrl(publicId: string | null | undefined): string {
  if (!publicId) return 'https://picsum.photos/seed/blog/800/450';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) return publicId;
  if (publicId.startsWith('data:image/')) return publicId;
  if (publicId.startsWith('samples/')) {
    if (publicId.includes('typography')) return 'https://picsum.photos/seed/typography/1200/675';
    if (publicId.includes('code')) return 'https://picsum.photos/seed/code/1200/675';
    if (publicId.includes('workspace')) return 'https://picsum.photos/seed/workspace/1200/675';
  }
  return `https://picsum.photos/seed/${publicId.replace(/\//g, '_')}/1200/675`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Draft';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

