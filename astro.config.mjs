// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 本番の独自ドメイン
export const SITE = 'https://ibatoco.jp';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      i18n: undefined,
      changefreq: 'weekly',
      priority: 0.7,
      // 検証用プレビュー・管理画面はサイトマップに含めない
      filter: (page) => !page.includes('/preview/') && !page.includes('/admin/'),
    }),
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
