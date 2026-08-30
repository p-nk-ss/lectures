// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeSections from './src/lib/rehype-sections.mjs';

/**
 * Tests moved from /tests/{topic}/{level}/ to /tests/{level}/{topic}/ when the level became
 * the first choice. The site has been live long enough for a deep link to exist somewhere,
 * so the old addresses keep working through a generated redirect page.
 */
const oldTestRoutes = Object.fromEntries(
  ['01', '02', '03', '04', '05', '06', '07', '08'].flatMap((topic) =>
    ['nurse', 'doctor'].map((level) => [`/tests/${topic}/${level}`, `/tests/${level}/${topic}`]),
  ),
);

export default defineConfig({
  site: 'https://lectures.pankaz.dev',
  integrations: [preact(), mdx()],
  redirects: oldTestRoutes,
  markdown: {
    // Heading ids must exist before sections wrap them (anchors + TOC links).
    rehypePlugins: [rehypeHeadingIds, rehypeSections],
  },
});
