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
  // Formspree のフォームID付きエンドポイント（例: 'https://formspree.io/f/xxxxxxx'）。
  // 空のままだとメール下書きにフォールバックします。取得方法は README を参照。
  formEndpoint: '',
  social: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://www.tiktok.com/',
    x: 'https://x.com/',
    threads: 'https://www.threads.net/',
  },
  contactEmail: 'hello@ibatoco.jp',
} as const;

export { CATEGORIES };
export type { CategoryKey };

export const CATEGORY_LIST = (Object.keys(CATEGORIES) as CategoryKey[]).map((key) => ({
  key,
  ...CATEGORIES[key],
}));

// グローバルナビ（階層1 中心）
export const NAV = [
  { label: 'グルメ', href: '/eat/' },
  { label: '暮らし', href: '/life/' },
  { label: 'あそび・サウナ', href: '/sauna-play/' },
  { label: 'ビューティ', href: '/beauty/' },
  { label: '企業・技術', href: '/company/' },
  { label: 'エリア', href: '/area/' },
] as const;

// 事業者向け（階層4 制圧導線）
export const BIZ_NAV = [
  { label: '掲載のご案内', href: '/biz/' },
  { label: 'WEB集客サポート', href: '/agency/' },
  { label: 'お問い合わせ', href: '/contact/' },
] as const;
