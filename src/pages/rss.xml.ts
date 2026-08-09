import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles, getIndexableNews } from '../lib/content';
import { NEWS_CATEGORIES } from '../data/news';
import { CATEGORIES } from '../data/site';
import { SITE_CONFIG } from '../data/site';

export async function GET(context: APIContext) {
  const [articles, news] = await Promise.all([getArticles(), getIndexableNews()]);
  const items = [
    ...articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.publishedAt,
      link: `/${CATEGORIES[a.data.category].path}/${a.id.split('/').pop()}/`,
      categories: [CATEGORIES[a.data.category].label, ...a.data.tags],
    })),
    ...news.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.pubDate,
      link: `/news/${item.id.split('/').pop()}/`,
      categories: [NEWS_CATEGORIES[item.data.category].label, ...item.data.tags],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  return rss({
    title: `${SITE_CONFIG.name}｜${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    site: context.site ?? SITE_CONFIG.domain,
    items,
    customData: `<language>ja</language>`,
  });
}
