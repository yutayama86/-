/**
 * AI記事生成に渡すブランド前提と、旧リフォーム特化文脈の混入検出。
 *
 * generate-article / infer-article / quality-check が同じ定義を使う。
 * 旧商品の詳細（価格・機能・URL）はここ以外に書かない。プロンプトへは最上位制約の一文だけを渡す。
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

/** AI生成プロンプトの最上位制約。文言は変えない。 */
export const BRAND_PRIME_DIRECTIVE =
  'シクミベースは特定業界向けのリフォーム支援事業ではない。旧リフォーム反響OS、見積フォロー漏れ診断、旧リフォーム専用URL・価格・商品仕様は廃止済みであり、本文、タイトル、description、keywords、CTA、内部リンク、事例として一切使用してはならない。';

export const BRAND_POSITION =
  'シクミベースは、中小企業・地域企業の集客・営業・業務・発信・組織を、属人的な頑張りではなく再現可能な仕組みに変える事業ブランドです。Web・SNS・AI・SEOは商品そのものではなく、仕組みを実装する手段として扱います。';

/**
 * 生成物に含まれてはならない旧文脈。
 * 人が書いた既存記事では地名検索の例として「リフォーム」が出るため、
 * 業界語そのものまで禁じるのは生成物（generated: true）とプロンプトだけにする。
 */
export const LEGACY_PATTERNS = [
  { label: 'リフォーム反響OS', re: /リフォーム\s*反響\s*OS/i },
  { label: '反響OS', re: /反響\s*OS/i },
  { label: '見積フォロー漏れ診断', re: /見積(?:り)?フォロー漏れ診断/ },
  { label: 'reform-lead / reform-lead-os', re: /reform-lead/i },
  { label: 'reform-audit / reform-os', re: /reform-(?:audit|os)\b/i },
  { label: '旧診断URL', re: /\/diagnosis\// },
  { label: 'renovation', re: /renovation/i },
  { label: '税別55,000円', re: /5\s*[,，]?\s*5\s*[,，]?\s*000\s*円|5\.5\s*万円|55,000|55000/ },
  { label: '見積後3回フォロー', re: /見積(?:もり|り)?後\s*[3３三]\s*回/ },
  { label: '現調前情報回収', re: /現調/ },
  { label: 'リフォーム業界前提', re: /リフォーム/ },
  { label: '外壁塗装・屋根業界前提', re: /外壁塗装|屋根工事|塗装会社/ },
];

/** テキストに含まれる旧文脈のラベル一覧を返す（重複なし）。 */
export function findLegacyTerms(text) {
  return LEGACY_PATTERNS.filter(({ re }) => re.test(text)).map(({ label }) => label);
}

/** プロンプト検査用。許可された最上位制約の一文を除いたうえで検出する。 */
export function findLegacyTermsInPrompt(prompt) {
  return findLegacyTerms(prompt.split(BRAND_PRIME_DIRECTIVE).join(''));
}

/** サイト上に実在し、生成記事から張ってよい固定ページ。 */
export const STATIC_LINK_TARGETS = [
  { path: '/service/', label: '支援内容の一覧' },
  { path: '/service/web/', label: '集客・営業の仕組み' },
  { path: '/service/sns/', label: '発信の仕組み' },
  { path: '/service/ai-dx/', label: '業務・改善の仕組み' },
  { path: '/case/ibatoco/', label: 'イバトコ（シクミベースが自ら運営する地域メディアの公開ケーススタディ。顧客事例ではない）' },
  { path: '/contact/', label: '仕組み化の相談窓口' },
];

/**
 * 生成時に参考として渡す既存記事。
 * slug・title・description に旧文脈を含む記事は、URLが公開中でも参照させない。
 */
export function referenceArticles(knowledgeDir = 'src/content/knowledge') {
  if (!existsSync(knowledgeDir)) return [];
  return readdirSync(knowledgeDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(knowledgeDir, file), 'utf-8');
      const field = (key) =>
        (raw.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^['"]|['"]$/g, '');
      const slug = basename(file, '.md');
      return {
        slug,
        title: field('title'),
        description: field('description'),
        category: field('category'),
        draft: field('draft') === 'true',
      };
    })
    .filter((a) => a.category && !a.draft)
    .filter((a) => findLegacyTerms(`${a.slug}\n${a.title}\n${a.description}`).length === 0)
    .map((a) => ({ ...a, path: `/knowledge/${a.category}/${a.slug}/` }));
}

/** 本文中の内部リンクのうち、実在しない・参照を許可していないものを返す。 */
export function findDisallowedInternalLinks(body, knowledgeDir = 'src/content/knowledge') {
  const allowed = new Set([
    ...STATIC_LINK_TARGETS.map((t) => t.path),
    ...referenceArticles(knowledgeDir).map((a) => a.path),
  ]);
  const links = [...body.matchAll(/\]\((\/[^)\s#?]*)(?:[?#][^)\s]*)?\)/g)].map((m) => m[1]);
  return [...new Set(links)].filter((path) => {
    const normalized = path.endsWith('/') ? path : `${path}/`;
    return !allowed.has(normalized);
  });
}
