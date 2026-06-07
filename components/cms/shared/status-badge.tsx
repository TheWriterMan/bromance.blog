import React from 'react';

type PostStatus = 'draft' | 'published' | 'scheduled';

interface StatusBadgeProps {
  status: PostStatus;
}

const STATUS_STYLES: Record<PostStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS: Record<PostStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
