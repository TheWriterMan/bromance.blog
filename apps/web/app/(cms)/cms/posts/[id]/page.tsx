'use client';

import { useParams } from 'next/navigation';
import EditorCanvas from '@/components/cms/editor/editor-canvas';

export default function EditorPage() {
  const params = useParams();
  const postId = params.id as string;

  return <EditorCanvas postId={postId} />;
}
