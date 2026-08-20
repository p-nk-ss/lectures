export interface LectureVideo {
  /** YouTube id */
  id: string;
  title: string;
  description?: string;
  /** Text of the `##` heading the embed sits under, '' if it precedes the first one. */
  section: string;
}

const EMBED = /<VideoEmbed\b([^>]*?)\/>/g;
const H2 = /^##[ \t]+(.+)$/gm;
const attr = (source: string, name: string) =>
  source.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/**
 * Collects the `<VideoEmbed>`s of a lecture straight out of its MDX body, in document
 * order, each tagged with the `##` section it appears under.
 *
 * The embeds are the single source of truth: deriving the site-wide video index from them
 * (rather than from a parallel list in frontmatter) means the index cannot drift from what
 * a reader actually sees on the page.
 */
export function collectVideos(body: string): LectureVideo[] {
  const headings = [...body.matchAll(H2)].map((m) => ({ at: m.index ?? 0, text: m[1].trim() }));
  const videos: LectureVideo[] = [];

  for (const match of body.matchAll(EMBED)) {
    const id = attr(match[1], 'id');
    const title = attr(match[1], 'title');
    if (!id || !title) continue;
    const at = match.index ?? 0;
    // The last heading that opens before this embed.
    const section = headings.filter((h) => h.at < at).at(-1)?.text ?? '';
    videos.push({ id, title, description: attr(match[1], 'description'), section });
  }
  return videos;
}
