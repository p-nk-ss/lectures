// Wraps each h2 + its following content into <section class="slide lecture-section">
// so lecture pages render as full-screen presentation slides without touching MDX sources.
// The `slide` class is what the lecture page's scroll-snap + HUD logic keys off; slide
// numbering is assigned at runtime because the page adds a title and a final slide too.
export default function rehypeSections() {
  return (tree) => {
    const out = [];
    let current = null;
    for (const node of tree.children) {
      // Keep ESM (MDX imports/exports) at the top level.
      if (node.type === 'mdxjsEsm') {
        out.push(node);
        continue;
      }
      if (node.type === 'element' && node.tagName === 'h2') {
        current = {
          type: 'element',
          tagName: 'section',
          properties: { className: ['slide', 'lecture-section'] },
          children: [node],
        };
        out.push(current);
      } else if (current) {
        current.children.push(node);
      } else {
        out.push(node);
      }
    }
    tree.children = out;
  };
}
