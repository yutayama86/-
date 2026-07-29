import type { APIRoute } from 'astro';
import { SITE_CONFIG, CATEGORY_LIST, CATEGORY_PAGE_META } from '../data/site';
import { getArticles, getStores } from '../lib/content';
import { VISIBLE_GUIDES as GUIDES } from '../data/guides';
import { VISIBLE_REPORTERS as REPORTERS } from '../data/reporters';
import { MUNICIPALITIES } from '../data/areas';
import { MUNICIPALITY_CONTENT } from '../data/municipality-content';

/**
 * /llms.txt — AI検索(GEO)向けのサイト要約（llmstxt.org 準拠）。
 * ChatGPT/Claude/Perplexity 等が「イバトコとは何か・どこに何があるか」を
 * 少ないトークンで把握できるよう、主要エンティティとURLを構造的に列挙する。
 * コンテンツが増えれば自動で反映される。
 */
export const GET: APIRoute = async () => {
  const base = SITE_CONFIG.domain.replace(/\/$/, '');
  const abs = (p: string) => `${base}${p}`;
  const [articles, stores] = await Promise.all([getArticles(), getStores()]);

  const L: string[] = [];
  L.push(`# ${SITE_CONFIG.name} (${SITE_CONFIG.nameEn})`);
  L.push('');
  L.push(`> ${SITE_CONFIG.description}`);
  L.push('');
  L.push(
    `${SITE_CONFIG.name}は茨城県44市町村の「食・暮らし・あそび・美容・泊まる・ものづくり」を、` +
      `編集部と公式レポーターが実際に足を運んだ一次情報でまとめる体験型ローカルメディアです。` +
      `タグライン：${SITE_CONFIG.tagline}　サイト：${base}`
  );
  L.push('');

  // カテゴリ
  L.push('## カテゴリ（ジャンル別一覧）');
  for (const c of CATEGORY_LIST) {
    L.push(`- [${c.label}](${abs(`/${c.path}/`)}): 茨城の${c.label}をエリア・お店とあわせて紹介`);
  }
  L.push('');

  // エリア（コンテンツのある市町村）
  L.push('## エリア（市町村ページ）');
  for (const m of MUNICIPALITIES) {
    const content = MUNICIPALITY_CONTENT[m.slug];
    if (!content?.intro && !content?.catch) continue;
    const note = (content.catch ?? content.intro ?? '').replace(/\s+/g, ' ').slice(0, 60);
    L.push(`- [${m.name}](${abs(`/area/${m.slug}/`)}): ${note}`);
  }
  L.push('');

  // 地名×ジャンル（主砲）— 例示（全量はsitemap参照）
  L.push('## 地名×ジャンルのまとめ（例）');
  L.push(`これらは「/area/<市町村>/<ジャンル>/」の形で多数存在します（例：水戸市のグルメ = ${abs('/area/mito/eat/')}）。`);
  for (const c of CATEGORY_LIST.slice(0, 3)) {
    L.push(`- [水戸市の${c.label}](${abs(`/area/mito/${c.path}/`)}): ${CATEGORY_PAGE_META[c.key].lead('水戸市')}`);
  }
  L.push('');

  // まとめ・モデルコース
  if (GUIDES.length) {
    L.push('## まとめ・モデルコース（目的別）');
    for (const g of GUIDES) L.push(`- [${g.title}](${abs(`/guide/${g.slug}/`)}): ${g.lead}`);
    L.push('');
  }

  // 体験レポート記事
  if (articles.length) {
    L.push('## 体験レポート記事');
    for (const a of articles) {
      const path = `/${a.data.category}/${a.id.split('/').pop()}/`;
      L.push(`- [${a.data.title}](${abs(path)}): ${a.data.description}`);
    }
    L.push('');
  }

  // 掲載店舗（多くなったら上限）
  if (stores.length) {
    L.push('## 掲載店舗（お店・スポット）');
    for (const s of stores.slice(0, 100)) {
      L.push(`- [${s.data.name}](${abs(`/place/${s.id}/`)}): ${s.data.area}｜${s.data.tagline}`);
    }
    L.push('');
  }

  // 公式レポーター（E-E-A-T）
  if (REPORTERS.length) {
    L.push('## 公式レポーター（著者・一次情報の書き手）');
    for (const r of REPORTERS) {
      L.push(`- [${r.name}](${abs(`/reporter/${r.slug}/`)}): ${r.role}${r.area ? `・担当${r.area}` : ''}`);
    }
    L.push('');
  }

  // 事業者向け
  L.push('## 事業者・関係者の方へ');
  L.push(`- [掲載のご案内](${abs('/biz/')}): お店・企業の掲載（無料掲載から）`);
  L.push(`- [公式レポーター募集](${abs('/reporters/')}): 茨城を発信する公式レポーターの募集`);
  L.push(`- [お問い合わせ](${abs('/contact/')}): 取材・掲載・協業のご相談`);
  L.push('');

  L.push('## 補足');
  L.push(`- 対象地域：茨城県（全44市町村）。県北/県央/県南/鹿行/県西の5エリア区分。`);
  L.push(`- 全ページ一覧：${abs('/sitemap-index.xml')}`);
  L.push(`- 運営：${SITE_CONFIG.name}編集部（${SITE_CONFIG.contactEmail}）`);

  return new Response(L.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
