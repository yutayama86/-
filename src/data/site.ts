import { CATEGORIES, type CategoryKey } from '../content.config';

export const SITE_CONFIG = {
  name: 'イバトコ',
  nameEn: 'IBATOCO',
  domain: 'https://ibatoco.jp',
  tagline: '茨城の“いいとこ”を、行った人の熱量で。',
  description:
    '茨城に一番くわしい体験型ローカルメディア「イバトコ」。編集部とご当地レポーターが実際に足を運び、食・暮らし・遊び・美容・ものづくりのリアルをお届けします。',
  // Cloudflare Web Analytics のトークンをデプロイ後にここへ（空なら読み込みません）
  cfAnalyticsToken: '',
  // Google Analytics 4 の測定ID（G-XXXXXXXXXX）。ここに書くだけで有効化できます（本番のみ）。
  // ※環境変数 PUBLIC_GA_ID を設定した場合はそちらが優先されます。
  gaMeasurementId: 'G-2DNYX7CSK6',
  // Google Search Console のHTMLタグ確認コード（<meta google-site-verification> の content）。
  // ※環境変数 PUBLIC_GSC_VERIFICATION を設定した場合はそちらが優先されます。
  gscVerification: '',
  // Formspree のフォームID付きエンドポイント。送信先は info@ibatoco.jp。
  // 空にするとメール下書き(mailto)にフォールバックします（docs/FORMS_SETUP.md）。
  formEndpoint: 'https://formspree.io/f/mykrvjkg',
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://www.tiktok.com/',
    x: 'https://x.com/',
    threads: 'https://www.threads.net/',
  },
  contactEmail: 'info@ibatoco.jp',
} as const;

export { CATEGORIES };
export type { CategoryKey };

export const CATEGORY_LIST = (Object.keys(CATEGORIES) as CategoryKey[]).map((key) => ({
  key,
  ...CATEGORIES[key],
}));

// 地名×ジャンルまとめページ用メタ（見出し・導入・引き当てる市町村コンテンツ）
export const CATEGORY_PAGE_META: Record<
  CategoryKey,
  { heading: string; lead: (n: string) => string; muniField: 'gourmet' | 'spotsExp' | null }
> = {
  eat: { heading: 'グルメ・名物', lead: (n) => `${n}の食。名物・ご当地グルメと、行った人が選ぶお店をまとめました。`, muniField: 'gourmet' },
  life: { heading: '暮らし', lead: (n) => `${n}の暮らし・住まい。地元の日常に根ざした情報を。`, muniField: null },
  'sauna-play': { heading: 'おでかけ・あそび', lead: (n) => `${n}のお出かけ・遊び・サウナ。見どころとアクティビティ。`, muniField: 'spotsExp' },
  beauty: { heading: 'サロン・リラクゼーション', lead: (n) => `${n}のサロン・美容・リラクゼーション。`, muniField: null },
  stay: { heading: '宿・温泉', lead: (n) => `${n}の宿・温泉。泊まって楽しむ${n}。`, muniField: null },
  company: { heading: '企業・ものづくり', lead: (n) => `${n}の企業・技術・ものづくりの現場。`, muniField: null },
};

// グローバルナビ（階層1 中心）
export const NAV = [
  { label: 'グルメ', href: '/eat/' },
  { label: '暮らし', href: '/life/' },
  { label: 'あそび・サウナ', href: '/sauna-play/' },
  { label: 'ビューティ', href: '/beauty/' },
  { label: '泊まる', href: '/stay/' },
  { label: '企業・技術', href: '/company/' },
  { label: 'エリア', href: '/area/' },
] as const;

// 事業者向け（階層4 制圧導線）
export const BIZ_NAV = [
  { label: '掲載のご案内', href: '/biz/' },
  { label: 'WEB集客サポート', href: '/agency/' },
  { label: 'お問い合わせ', href: '/contact/' },
] as const;
