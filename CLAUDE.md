# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static documentation site for the 공공조달관리사 (Korean Public Procurement Manager) certification exam. Built with Astro + Starlight. Deployed as a reference card vault — 84+ concept cards covering Korean procurement law and regulation.

## Commands

```bash
npm run dev       # Dev server at localhost:4321
npm run build     # Production build → ./dist/
npm run preview   # Preview production build locally
```

No test framework. The only way to verify changes is visual inspection via `npm run dev` or `npm run build`.

## Architecture

### Content model

All content lives in `src/content/docs/reference/` as Markdown files. Each file is a "concept card" with rich YAML frontmatter:

```yaml
title: "..."
type: concept-card
domain: regulatory
workflow_phase: [입찰, 낙찰]    # drives sidebar grouping
exam_subject: 과목2
exam_chapter: "과목2 2장"
law_id: "280803"
governing_articles: [...]
related:                         # wiki-link syntax [[filename]]
  - "[[낙찰자선정방식-비교]]"
```

The `related:` field uses Obsidian-style wikilinks — these resolve to `/reference/<slug>/` via the `remark-wiki-link` plugin config in `astro.config.mjs`.

### Navigation

`sidebar.json` (root level, 1347 lines) is the single source of truth for the sidebar. It organizes cards by workflow phase (조달계획 → 입찰 → 평가 → 계약이행 etc.). When adding new cards, update `sidebar.json` to include them.

### Custom remark plugins

Two plugins registered in `astro.config.mjs`:

1. **`remarkCallouts`** (`src/remark-callouts.mjs`) — converts GitHub-style blockquote callouts (`> [!note]`, `> [!warning]`, etc.) to Starlight `<aside>` elements. Supported types: `note`/`info` → blue, `warning`/`caution` → yellow, `tip`/`example`/`important` → purple, `danger` → red.

2. **`remark-wiki-link`** — resolves `[[filename]]` and `[[filename|alias]]` wikilinks to `/reference/<filename>/`. The `aliasDivider` is `|`.

### Mermaid diagrams

`astro-mermaid` integration is loaded **before** Starlight in `astro.config.mjs` (order matters). Use fenced code blocks with ` ```mermaid ` in any content file.

## Content conventions

- Card filenames use Korean kebab-case (e.g., `개찰-낙찰-절차.md`) — the filename becomes the URL slug.
- Wikilinks in body text and `related:` frontmatter must match the filename exactly (without `.md`).
- The `:::tip[label]` syntax (Starlight native directives) works alongside `> [!type]` callouts — both render correctly.
- `last_verified` and `created` dates use `YYYY-MM-DD` format.
