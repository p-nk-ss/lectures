import { describe, it, expect } from 'vitest';
import { collectVideos } from './videos';

describe('collectVideos', () => {
  it('returns nothing for a lecture without embeds', () => {
    expect(collectVideos('## Розділ\n\nТекст без відео.\n')).toEqual([]);
  });

  it('tags each embed with the section it sits under, in document order', () => {
    const body = [
      '## Перший розділ',
      '<VideoEmbed id="aaa" title="Перше" />',
      '### Підрозділ',
      '<VideoEmbed id="bbb" title="Друге" description="Опис" />',
      '## Другий розділ',
      '<VideoEmbed id="ccc" title="Третє" />',
    ].join('\n\n');

    expect(collectVideos(body)).toEqual([
      { id: 'aaa', title: 'Перше', description: undefined, section: 'Перший розділ' },
      { id: 'bbb', title: 'Друге', description: 'Опис', section: 'Перший розділ' },
      { id: 'ccc', title: 'Третє', description: undefined, section: 'Другий розділ' },
    ]);
  });

  it('does not mistake an h3 for a section', () => {
    const body = '## Секція\n\n### Не секція\n\n<VideoEmbed id="x" title="Т" />';
    expect(collectVideos(body)[0].section).toBe('Секція');
  });

  it('reports an empty section for an embed above the first heading', () => {
    expect(collectVideos('<VideoEmbed id="x" title="Т" />\n\n## Пізніше')[0].section).toBe('');
  });

  it('reads attributes in any order and skips an embed missing id or title', () => {
    const body = [
      '<VideoEmbed title="Спершу назва" id="ok" />',
      '<VideoEmbed title="Без id" />',
      '<VideoEmbed id="no-title" />',
    ].join('\n\n');
    expect(collectVideos(body).map((v) => v.id)).toEqual(['ok']);
  });
});
