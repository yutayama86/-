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

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
