export function filterVisible<T extends { data: { status: string } }>(
  entries: T[],
  opts: { prod: boolean; showDrafts: boolean },
): T[] {
  if (!opts.prod || opts.showDrafts) return entries;
  return entries.filter((e) => e.data.status === 'published');
}

export const showDrafts = (): boolean => import.meta.env.SHOW_DRAFTS === '1';
