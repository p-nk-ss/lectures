// Wraps each h2 + its following content into <section class="lecture-section">
// so lecture pages render as visually separated blocks without touching MDX sources.
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
          properties: { className: ['lecture-section'] },
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
