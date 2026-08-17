// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeSections from './src/lib/rehype-sections.mjs';

export default defineConfig({
  site: 'https://lectures.pankaz.dev',
  integrations: [preact(), mdx()],
  markdown: {
    // Heading ids must exist before sections wrap them (anchors + TOC links).
    rehypePlugins: [rehypeHeadingIds, rehypeSections],
  },
});
