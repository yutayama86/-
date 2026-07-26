import { getCollection, type CollectionEntry } from 'astro:content';

const isProd = import.meta.env.PROD;

/** 公開記事を新しい順に。draftは本番で除外。 */
export async function getArticles(): Promise<CollectionEntry<'articles'>[]> {
  const all = await getCollection('articles', ({ data }) => !(isProd && data.draft));
  return all.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getArticlesByCategory(category: string) {
  return (await getArticles()).filter((a) => a.data.category === category);
}

export async function getFeatured() {
  return (await getArticles()).filter((a) => a.data.featured);
}

export async function getPlaces(): Promise<CollectionEntry<'places'>[]> {
  const all = await getCollection('places', ({ data }) => !(isProd && data.draft));
  return all.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

import { areaToSlug } from '../data/areas';

/** 市町村slugごとの記事・店舗件数（コンテンツのある市町村を把握） */
export async function getAreaCounts(): Promise<Map<string, number>> {
  const [articles, places] = await Promise.all([getArticles(), getPlaces()]);
  const counts = new Map<string, number>();
  for (const a of articles) {
    const s = areaToSlug(a.data.area);
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  for (const p of places) {
    const s = areaToSlug(p.data.area);
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return counts;
}

/** 全記事のタグ一覧（重複除去・件数付き） */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const articles = await getArticles();
  const map = new Map<string, number>();
  for (const a of articles) for (const t of a.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

export async function getArticlesByTag(tag: string) {
  return (await getArticles()).filter((a) => a.data.tags.includes(tag));
}

export async function getArticlesByArea(slug: string) {
  return (await getArticles()).filter((a) => areaToSlug(a.data.area) === slug);
}

export async function getPlacesByArea(slug: string) {
  return (await getPlaces()).filter((p) => areaToSlug(p.data.area) === slug);
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
