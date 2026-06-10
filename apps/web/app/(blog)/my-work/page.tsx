import type { Metadata } from 'next';
import MyWorkShowcase from '@/components/blog/my-work-showcase';

export const metadata: Metadata = {
  title: 'My Work — Novel Library',
  description: 'Original web novel translations: Bromance, farming rebirth, and cultivation stories.',
};

// Static design showcase — the Ko-fi link is fetched client-side so this page
// has no build-time database dependency.
export default function MyWorkPage() {
  return <MyWorkShowcase />;
}
