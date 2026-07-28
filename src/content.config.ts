import { defineCollection, z, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { csvStoresLoader } from './loaders/csv-stores';

/**
 * カテゴリ（階層1：集客メディア）
 * 企画書サイトマップに対応
 */
export const CATEGORIES = {
  eat: { label: 'グルメ', reading: 'たべる', path: 'eat', accent: '#d8452b' },
  life: { label: '暮らし', reading: 'くらす', path: 'life', accent: '#3f7d5a' },
  'sauna-play': { label: 'あそび・サウナ', reading: 'あそぶ', path: 'sauna-play', accent: '#2f6f9e' },
  beauty: { label: 'ビューティ', reading: 'ととのう', path: 'beauty', accent: '#b0567e' },
  stay: { label: '泊まる', reading: 'とまる', path: 'stay', accent: '#9a6b45' },
  company: { label: '企業・技術', reading: 'つくる', path: 'company', accent: '#1f3a52' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
const categoryKeys = Object.keys(CATEGORIES) as [CategoryKey, ...CategoryKey[]];

/**
 * 体験レポート記事（/eat /life /sauna-play /beauty /company）
 */
const articles = defineCollection({
  // `_`始まりのファイル（テンプレート等）は公開対象から除外
  loader: glob({ pattern: '**/[!_]*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(categoryKeys),
      // アイキャッチ（当面はUnsplash等の外部URL or 後日Cloudflare Imagesへ）
      cover: z.string().optional(),
      coverAlt: z.string().default(''),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      author: z.string().default('イバトコ編集部'),
      // 現地アンバサダー / レポーター（第5章 共創モデル）
      reporter: z.string().optional(),
      tags: z.array(z.string()).default([]),
      area: z.string().optional(), // 市町村（例: 水戸市）
      // 紐づく店舗LP（Phase1導線）
      place: reference('places').optional(),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
    }),
});

/**
 * 店舗・企業専用LP（階層2：/place/[id]）
 * ペライチ。予約・問い合わせ導線の受け皿。
 */
const places = defineCollection({
  loader: glob({ pattern: '**/[!_]*.{md,mdx}', base: './src/content/places' }),
  schema: z.object({
    name: z.string(),
    kana: z.string().optional(),
    category: z.enum(categoryKeys),
    tagline: z.string(), // 一言キャッチ
    description: z.string(),
    cover: z.string().optional(),
    gallery: z.array(z.string()).default([]), // 写真強化（公式店舗プラン向け）
    // 取材班の推薦コメント（企画書サイトマップ記載）
    recommend: z.string().optional(),
    area: z.string(),
    address: z.string().optional(),
    access: z.string().optional(),
    hours: z.string().optional(),
    holiday: z.string().optional(),
    tel: z.string().optional(),
    budget: z.string().optional(),
    // 特徴タグ（駐車場あり・個室・カード可 等）＝検索・絞り込み・AI検索用の構造化情報
    features: z.array(z.string()).default([]),
    website: z.string().url().optional(),
    instagram: z.string().optional(),
    map: z.string().url().optional(), // Googleマップ埋め込み or リンク
    // メニュー・料金表
    menu: z
      .array(z.object({ name: z.string(), price: z.string(), note: z.string().optional() }))
      .default([]),
    // FAQ（SEO＋AI検索での引用に効く。FAQPage構造化データに使用）
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    // 予約・問い合わせ導線（階層3 /reserve へ）。未設定なら問い合わせフォームへ。
    reserveUrl: z.string().optional(),
    // 掲載プラン：free=無料掲載 / official=公式店舗 / growth=集客 / partner=地域DX
    plan: z.enum(['free', 'official', 'growth', 'partner']).default('free'),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

/**
 * 無料一括掲載の店舗（CSV → ビルド時生成）＝供給エンジン。
 * places(md)より項目は少なく、本文なし。両者は lib/content.ts の getStores() で統合。
 */
const stores = defineCollection({
  loader: csvStoresLoader('./src/data/stores.csv'),
  schema: z.object({
    name: z.string(),
    kana: z.string().optional(),
    category: z.enum(categoryKeys),
    tagline: z.string(),
    description: z.string(),
    cover: z.string().optional(),
    area: z.string(),
    address: z.string().optional(),
    access: z.string().optional(),
    hours: z.string().optional(),
    holiday: z.string().optional(),
    tel: z.string().optional(),
    budget: z.string().optional(),
    features: z.array(z.string()).default([]),
    website: z.string().url().optional(),
    instagram: z.string().optional(),
    map: z.string().url().optional(),
    plan: z.enum(['free', 'official', 'growth', 'partner']).default('free'),
    publishedAt: z.coerce.date().default(new Date('2026-07-01')),
  }),
});

export const collections = { articles, places, stores };
