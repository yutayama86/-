import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles } from '../lib/content';
import { CATEGORIES } from '../data/site';
import { SITE_CONFIG } from '../data/site';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: `${SITE_CONFIG.name}｜${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    site: context.site ?? SITE_CONFIG.domain,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.publishedAt,
      link: `/${CATEGORIES[a.data.category].path}/${a.id.split('/').pop()}/`,
      categories: [CATEGORIES[a.data.category].label, ...a.data.tags],
    })),
    customData: `<language>ja</language>`,
  });
}
