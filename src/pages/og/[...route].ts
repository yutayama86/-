import { OGImageRoute } from 'astro-og-canvas';
import { getArticles, getNews, getStores } from '../../lib/content';
import { CATEGORIES } from '../../data/site';
import { NEWS_CATEGORIES } from '../../data/news';
import { VISIBLE_GUIDES as GUIDES } from '../../data/guides';

/**
 * 記事・店舗・まとめごとのOGP画像（SNSシェア画像）をビルド時にPNG生成します。
 * URL例：/og/eat/tsukuba-chuka-soba-kaze.png ／ /og/place/tsukuba-ramen-kaze.png
 *        /og/guide/mito-date.png
 * 参照は各ページの image プロップ経由（SEO.astro）。
 * ※店舗が数千件規模になったら、ビルド時間の観点でテンプレ化/オンデマンド化を検討。
 */
const articles = await getArticles();
const places = await getStores();
const news = await getNews();

type OgPage = { title: string; description: string; accent: [number, number, number] };

// #d8452b → [216,69,43] のように16進をRGBへ
const hexRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const pages: Record<string, OgPage> = {};

for (const a of articles) {
  const cat = CATEGORIES[a.data.category];
  pages[`${cat.path}/${a.id.split('/').pop()}`] = {
    title: a.data.title,
    description: a.data.area ? `${a.data.area}｜${cat.label}｜IBATOCO` : `${cat.label}｜IBATOCO`,
    accent: hexRgb(cat.accent),
  };
}
for (const item of news) {
  pages[`news/${item.id.split('/').pop()}`] = {
    title: item.data.title,
    description: `${NEWS_CATEGORIES[item.data.category].label}｜茨城ニュース解説｜IBATOCO`,
    accent: hexRgb('#315c68'),
  };
}
for (const p of places) {
  const cat = CATEGORIES[p.data.category as keyof typeof CATEGORIES];
  pages[`place/${p.id.split('/').pop()}`] = {
    title: p.data.name,
    description: `${p.data.tagline}　—　${p.data.area}｜IBATOCO`,
    accent: hexRgb(cat.accent),
  };
}
for (const g of GUIDES) {
  pages[`guide/${g.slug}`] = {
    title: g.title.split('。')[0],
    description: `${g.lead}　—　まとめ・モデルコース｜IBATOCO`,
    accent: hexRgb(g.accent ?? '#46798b'),
  };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page: OgPage) => ({
    title: page.title,
    description: page.description,
    logo: undefined,
    bgGradient: [
      [245, 241, 232],
      [231, 223, 205],
    ],
    border: { color: page.accent, width: 24, side: 'inline-start' },
    padding: 80,
    font: {
      title: {
        families: ['Shippori Mincho'],
        weight: 'Bold',
        color: [28, 26, 20],
        lineHeight: 1.3,
      },
      description: {
        families: ['Zen Kaku Gothic New'],
        weight: 'Medium',
        color: [124, 117, 102],
        lineHeight: 1.4,
      },
    },
    fonts: [
      './src/assets/fonts/ShipporiMincho-Bold.ttf',
      './src/assets/fonts/ZenKakuGothicNew-Medium.ttf',
    ],
  }),
});
