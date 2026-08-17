import { describe, it, expect } from 'vitest';
import { filterVisible } from './visibility';

const e = (status: string) => ({ data: { status } });

describe('filterVisible', () => {
  it('prod: only published', () => {
    const r = filterVisible([e('draft'), e('reviewed'), e('published')], { prod: true, showDrafts: false });
    expect(r.map((x) => x.data.status)).toEqual(['published']);
  });
  it('prod + SHOW_DRAFTS: everything', () => {
    const r = filterVisible([e('draft'), e('published')], { prod: true, showDrafts: true });
    expect(r).toHaveLength(2);
  });
  it('dev: everything', () => {
    const r = filterVisible([e('draft')], { prod: false, showDrafts: false });
    expect(r).toHaveLength(1);
  });
});
