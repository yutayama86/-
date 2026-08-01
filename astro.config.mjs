// @ts-check
import { defineConfig } from 'astro/config';

// 本番の独自ドメイン
export const SITE = 'https://ibatoco.jp';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
