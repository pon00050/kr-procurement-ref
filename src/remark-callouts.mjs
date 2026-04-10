/**
 * remark-callouts.mjs
 *
 * Converts GitHub-style blockquote callouts (> [!type] ...) into
 * Starlight aside elements. Starlight's native aside system only
 * handles :::directive syntax; this plugin bridges the gap.
 *
 * Approach: replaces each matched blockquote with a raw HTML node (type:
 * 'html'). Astro's pipeline includes rehype-raw which parses these back
 * into proper hast elements, so Starlight's aside CSS applies correctly.
 *
 * Supported types → variant mapping:
 *   [!note]      → note    (blue)
 *   [!info]      → note    (blue)
 *   [!warning]   → caution (yellow)
 *   [!caution]   → caution (yellow)
 *   [!example]   → tip     (purple)
 *   [!tip]       → tip     (purple)
 *   [!important] → tip     (purple)
 *   [!danger]    → danger  (red)
 *
 * AST shape: consecutive blockquote lines without a blank line between them
 * form ONE paragraph inside the blockquote. remark embeds the soft line
 * break as '\n' inside the first text node value:
 *   "[!note] Title\nBody content here"
 * This plugin splits on that '\n' to separate title from body.
 */

import { visit } from 'unist-util-visit';

const VARIANT_MAP = {
  note: 'note',
  info: 'note',
  warning: 'caution',
  caution: 'caution',
  danger: 'danger',
  example: 'tip',
  tip: 'tip',
  important: 'tip',
};

const DEFAULT_LABELS = {
  note: '참고',
  caution: '주의',
  danger: '경고',
  tip: '예시',
};

/**
 * Serialize mdast nodes to an HTML string.
 * Handles the inline and block node types found in these cards.
 */
function nodesToHtml(nodes) {
  return nodes.map(nodeToHtml).join('');
}

function nodeToHtml(node) {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.value);
    case 'strong':
      return `<strong>${nodesToHtml(node.children)}</strong>`;
    case 'emphasis':
      return `<em>${nodesToHtml(node.children)}</em>`;
    case 'inlineCode':
      return `<code>${escapeHtml(node.value)}</code>`;
    case 'link':
      return `<a href="${escapeAttr(node.url)}">${nodesToHtml(node.children)}</a>`;
    case 'paragraph':
      return `<p>${nodesToHtml(node.children)}</p>`;
    case 'blockquote':
      return `<blockquote>${nodesToHtml(node.children)}</blockquote>`;
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul';
      return `<${tag}>${nodesToHtml(node.children)}</${tag}>`;
    }
    case 'listItem':
      return `<li>${nodesToHtml(node.children)}</li>`;
    case 'code':
      return `<pre><code class="language-${escapeAttr(node.lang || '')}">${escapeHtml(node.value)}</code></pre>`;
    case 'html':
      return node.value;
    default:
      if (node.children) return nodesToHtml(node.children);
      if (node.value) return escapeHtml(node.value);
      return '';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

export function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!parent || index === undefined) return;

      const firstPara = node.children[0];
      if (!firstPara || firstPara.type !== 'paragraph') return;

      const firstInline = firstPara.children[0];
      if (!firstInline || firstInline.type !== 'text') return;

      const fullText = firstInline.value;
      const nlIdx = fullText.indexOf('\n');
      const headerLine = nlIdx >= 0 ? fullText.slice(0, nlIdx) : fullText;

      const match = headerLine.match(/^\[!(\w+)\](?:\s+(.*))?/);
      if (!match) return;

      const [, alertType, titleSuffix] = match;
      const variant = VARIANT_MAP[alertType.toLowerCase()];
      if (!variant) return;

      const title = (titleSuffix && titleSuffix.trim()) || DEFAULT_LABELS[variant];

      // --- Build body content nodes ---
      const bodyInlines = [];

      if (nlIdx >= 0) {
        const bodyText = fullText.slice(nlIdx + 1);
        if (bodyText) bodyInlines.push({ type: 'text', value: bodyText });
        bodyInlines.push(...firstPara.children.slice(1));
      } else {
        const breakIdx = firstPara.children.findIndex(c => c.type === 'break');
        if (breakIdx >= 0) bodyInlines.push(...firstPara.children.slice(breakIdx + 1));
      }

      const bodyNodes = [];
      if (bodyInlines.length > 0) {
        bodyNodes.push({ type: 'paragraph', children: bodyInlines });
      }
      bodyNodes.push(...node.children.slice(1));

      // --- Serialize to HTML and replace blockquote ---
      const bodyHtml = bodyNodes.length > 0 ? nodesToHtml(bodyNodes) : '';

      const asideHtml = [
        `<aside aria-label="${escapeAttr(title)}" class="starlight-aside starlight-aside--${variant}">`,
        `<p class="starlight-aside__title" aria-hidden="true">${escapeHtml(title)}</p>`,
        `<div class="starlight-aside__content">${bodyHtml}</div>`,
        `</aside>`,
      ].join('');

      parent.children[index] = { type: 'html', value: asideHtml };
    });
  };
}
