// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://spangloss.ai',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
