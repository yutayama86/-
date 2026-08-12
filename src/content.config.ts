import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { csvStoresLoader } from './loaders/csv-stores';
import { MUNICIPALITIES } from './data/areas';
import { NEWS_CATEGORY_KEYS } from './data/news';

/**
 * カテゴリ（階層1：集客メディア）
 * 企画書サイトマップに対応
 */
export const CATEGORIES = {
  eat: { label: '食べる', reading: 'たべる', path: 'eat', accent: '#315c68' },
  life: { label: '暮らす', reading: 'くらす', path: 'life', accent: '#315c68' },
  'sauna-play': { label: '出かける', reading: 'でかける', path: 'sauna-play', accent: '#315c68' },
  beauty: { label: '整える', reading: 'ととのえる', path: 'beauty', accent: '#315c68' },
  stay: { label: '泊まる', reading: 'とまる', path: 'stay', accent: '#315c68' },
  company: { label: '働く・つくる', reading: 'はたらく・つくる', path: 'company', accent: '#315c68' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
const categoryKeys = Object.keys(CATEGORIES) as [CategoryKey, ...CategoryKey[]];
const municipalitySlugs = MUNICIPALITIES.map((municipality) => municipality.slug) as [string, ...string[]];

/**
 * 体験レポート記事（/eat /life /sauna-play /beauty /company）
 */
const articles = defineCollection({
  // `_`始まりのファイル（テンプレート等）は公開対象から除外
  loader: glob({ pattern: '**/[!_]*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
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

      // === 2026 Renewal：開示・取材メタデータモデル（Editorial Contract）===
      // 「誰が・いつ・どこで・どう確かめ・どの関係性で発信したか」を明示する。
      disclosure: z.enum(['editorial', 'partner', 'pr']).default('editorial'),
      disclosureNote: z.string().optional(), // 情報提供・費用負担・招待の有無などの補足
      reportingDate: z.coerce.date().optional(), // 取材日
      onSiteReporting: z.boolean().default(false), // 現地取材の有無
      photographer: z.string().optional(), // 撮影担当
      editor: z.string().optional(), // 編集担当
      // 出典（公式情報・一次資料）
      sources: z
        .array(z.object({ label: z.string(), url: z.url().optional(), accessedAt: z.coerce.date().optional() }))
        .default([]),
      // 訂正・更新履歴
      corrections: z.array(z.object({ date: z.coerce.date(), note: z.string() })).default([]),
      reviewed: z.boolean().default(false), // 編集部の事実確認済みか。trueでなければ公開しない
    }).superRefine((data, ctx) => {
      if (data.disclosure !== 'editorial' && !data.disclosureNote?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['disclosureNote'], message: 'Partner / PR は、関係性や対価の内容を具体的に記載してください。' });
      }
      if (!data.draft && !data.reviewed) {
        ctx.addIssue({ code: 'custom', path: ['reviewed'], message: '公開には編集部の事実確認（reviewed: true）が必要です。' });
      }
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
    website: z.url().optional(),
    instagram: z.string().optional(),
    map: z.url().optional(), // Googleマップ埋め込み or リンク
    // メニュー・料金表
    menu: z
      .array(z.object({ name: z.string(), price: z.string(), note: z.string().optional() }))
      .default([]),
    // FAQ（SEO＋AI検索での引用に効く。FAQPage構造化データに使用）
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    // 予約・問い合わせ導線（階層3 /reserve へ）。未設定なら問い合わせフォームへ。
    reserveUrl: z.string().optional(),
    // 内部区分（既存データとの互換性を維持）：free=基本情報 / official=確認済み情報 / growth=発信支援 / partner=パートナー
    plan: z.enum(['free', 'official', 'growth', 'partner']).default('free'),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
    reviewed: z.boolean().default(false),
    verifiedAt: z.coerce.date().optional(),
    disclosure: z.enum(['editorial', 'partner', 'pr']).default('editorial'),
    disclosureNote: z.string().optional(),
    sources: z.array(z.object({ label: z.string(), url: z.url().optional(), accessedAt: z.coerce.date().optional() })).default([]),
  }).superRefine((data, ctx) => {
    if (data.disclosure !== 'editorial' && !data.disclosureNote?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['disclosureNote'], message: 'Partner / PR は、関係性や対価の内容を具体的に記載してください。' });
    }
    if (!data.draft && !data.reviewed) {
      ctx.addIssue({ code: 'custom', path: ['reviewed'], message: '公開には公式情報との照合（reviewed: true）が必要です。' });
    }
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
    website: z.url().optional(),
    instagram: z.string().optional(),
    map: z.url().optional(),
    plan: z.enum(['free', 'official', 'growth', 'partner']).default('free'),
    publishedAt: z.coerce.date().default(new Date('2026-07-01')),
    // 公開前の非表示フラグ（本番ビルドで除外）
    draft: z.boolean().default(false),
    reviewed: z.boolean().default(false),
    verifiedAt: z.coerce.date().optional(),
    disclosure: z.enum(['editorial', 'partner', 'pr']).default('editorial'),
    disclosureNote: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.disclosure !== 'editorial' && !data.disclosureNote?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['disclosureNote'], message: 'Partner / PR は関係性を明記してください。' });
    }
    if (!data.draft && !data.reviewed) {
      ctx.addIssue({ code: 'custom', path: ['reviewed'], message: '公開には確認済み（reviewed: true）が必要です。' });
    }
  }),
});

/**
 * 茨城ニュース解説（/news/）。
 * AIや外部ワークフローからMarkdownを追加する場合も、公開前に同じ検証を通す。
 */
const news = defineCollection({
  loader: glob({ pattern: '**/[!_]*.{md,mdx}', base: './src/content/news' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(40).max(180),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('イバトコ編集部'),
    category: z.enum(NEWS_CATEGORY_KEYS),
    tags: z.array(z.string().min(1)).default([]),
    prefecture: z.literal('茨城県').default('茨城県'),
    municipalities: z.array(z.enum(municipalitySlugs)).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
    reviewed: z.boolean().default(false),
    sample: z.boolean().default(false),
    noindex: z.boolean().default(false),
    ogImage: z.string().optional(),
    ogImageAlt: z.string().default(''),
    imageCredit: z.string().optional(),
    imageCreditUrl: z.url().optional(),
    imageLicense: z.string().optional(),
    imageLicenseUrl: z.url().optional(),
    conclusion: z.string().min(1),
    keyPoints: z.array(z.string().min(1)).min(1),
    whatHappened: z.string().min(1),
    whatChanges: z.string().min(1),
    editorialAnalysis: z.string().min(1),
    regionalImpact: z.string().min(1),
    businessImplications: z.array(z.string().min(1)).min(1),
    faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
    sourceUrls: z.array(z.object({
      label: z.string().min(1),
      url: z.url(),
      accessedAt: z.coerce.date().optional(),
    })).default([]),
    relatedArticleUrls: z.array(z.string().startsWith('/')).default([]),
    event: z.object({
      name: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date().optional(),
      url: z.url().optional(),
      placeName: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
    place: z.object({
      name: z.string(),
      address: z.string().optional(),
      url: z.url().optional(),
    }).optional(),
  }).superRefine((data, ctx) => {
    if (!data.draft && !data.reviewed) {
      ctx.addIssue({ code: 'custom', path: ['reviewed'], message: 'ニュース公開には編集部の事実確認（reviewed: true）が必要です。' });
    }
    if (!data.draft && data.sourceUrls.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['sourceUrls'], message: '公開ニュースには一次情報または信頼できる情報源URLが必要です。' });
    }
    if (data.sample && !data.noindex) {
      ctx.addIssue({ code: 'custom', path: ['noindex'], message: '実装確認用サンプルは noindex: true にしてください。' });
    }
    if (data.ogImage && !data.ogImageAlt.trim()) {
      ctx.addIssue({ code: 'custom', path: ['ogImageAlt'], message: 'OG画像を指定する場合は代替テキストが必要です。' });
    }
  }),
});

export const collections = { articles, places, stores, news };
