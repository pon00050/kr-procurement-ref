// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import remarkWikiLink from 'remark-wiki-link';
import { remarkCallouts } from './src/remark-callouts.mjs';
import sidebar from './sidebar.json';

// https://astro.build/config
export default defineConfig({
	site: 'https://kr-procurement-ref.vercel.app',
	integrations: [
		mermaid(),   // must come before starlight
		starlight({
			title: '공공조달 규정 레퍼런스',
			defaultLocale: 'root',
			locales: {
				root: { label: '한국어', lang: 'ko' },
			},
			sidebar,
		}),
	],
	markdown: {
		remarkPlugins: [
			remarkCallouts,
			[remarkWikiLink, {
				aliasDivider: '|',
				pageResolver: name => [name.replace(/\\$/, '').toLowerCase()],
				hrefTemplate: link => `/reference/${link}/`,
			}],
		],
	},
});
