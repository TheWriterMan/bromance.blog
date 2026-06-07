import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

type CloudinaryPreset = 'content' | 'featured' | 'thumbnail' | 'raw';

const TRANSFORMS: Record<CloudinaryPreset, string> = {
  content: 'q_auto,f_auto,w_800',
  featured: 'q_auto,f_auto,w_1200',
  thumbnail: 'q_auto,f_auto,w_200,h_200,c_fill',
  raw: 'q_auto,f_auto',
};

export function getCloudinaryUrl(
  publicId: string | null | undefined,
  preset: CloudinaryPreset = 'content'
): string {
  if (!publicId) return 'https://picsum.photos/seed/blog/800/450';
  // Already a full URL — pass through
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) return publicId;

  const transforms = TRANSFORMS[preset];
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Draft';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

