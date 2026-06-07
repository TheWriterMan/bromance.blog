'use client';

import CmsShell from '@/components/cms/layout/cms-shell';
import PostList from '@/components/cms/posts/post-list';

export default function CmsPostsPage() {
  return (
    <CmsShell>
      <PostList />
    </CmsShell>
  );
}
