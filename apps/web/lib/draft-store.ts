/**
 * IndexedDB persistence layer for editor drafts.
 * Uses idb-keyval for a tiny, reliable IndexedDB wrapper.
 *
 * Key format: `draft:${postId}` or `draft:new` for unsaved posts.
 */

import { get, set, del, keys } from 'idb-keyval';

export interface DraftData {
  title: string;
  content: string;
  summary: string;
  status: string;
  categoryId: string;
  tags: string[];
  featuredImage: string;
  slug: string;
  savedAt: number; // Unix timestamp ms
}

const PREFIX = 'draft:';

function draftKey(postId: string | null): string {
  return `${PREFIX}${postId || 'new'}`;
}

export async function saveDraft(postId: string | null, data: DraftData): Promise<void> {
  await set(draftKey(postId), data);
}

export async function getDraft(postId: string | null): Promise<DraftData | undefined> {
  return get<DraftData>(draftKey(postId));
}

export async function deleteDraft(postId: string | null): Promise<void> {
  await del(draftKey(postId));
}

export async function renameDraft(oldId: string | null, newId: string): Promise<void> {
  const data = await getDraft(oldId);
  if (data) {
    await set(draftKey(newId), data);
    await del(draftKey(oldId));
  }
}

export async function hasUnsavedNewDraft(): Promise<DraftData | undefined> {
  return get<DraftData>(`${PREFIX}new`);
}

export async function listDraftKeys(): Promise<string[]> {
  const allKeys = await keys();
  return (allKeys as string[]).filter((k) => typeof k === 'string' && k.startsWith(PREFIX));
}
