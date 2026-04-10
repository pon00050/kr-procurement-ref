// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkWikiLink from 'remark-wiki-link';
import sidebar from './sidebar.json';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: '공공조달 규정 레퍼런스',
			sidebar,
		}),
	],
	markdown: {
		remarkPlugins: [
			[remarkWikiLink, {
				pageResolver: name => [name],
				hrefTemplate: link => `/reference/${link}/`,
			}],
		],
	},
});
