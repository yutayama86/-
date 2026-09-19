/**
 * 関連記事を、ルールだけで選ぶ。
 *
 * 「最近の記事を並べる」でも「似ていそうなものを出す」でもない。
 * 一致した軸が1つも無い記事は候補にしない。読者にとって無関係なリンクは、
 * 押されないだけでなく、そのページが何についてのページかを薄める。
 *
 * AIも外部APIも使わない。判定に使うのは frontmatter だけ。
 *
 * 除外するもの:
 *  - 自分自身
 *  - noindex
 *  - 終了したイベント（読者が次に取れる行動が無い）
 *  - 呼び出し側が明示的に外したもの（既に別枠で出している記事など）
 */
import type { ContentFacets } from './taxonomy';
import { isWorthLinking } from './lifecycle';

/** 何が一致したか。重みは「読者にとっての近さ」の順 */
const WEIGHTS = {
  sportsTeam: 6,
  municipality: 5,
  intent: 3,
  category: 2,
  region: 1,
  tag: 1,
} as const;

export type MatchReason = keyof typeof WEIGHTS;

export interface RelatedCandidate {
  facets: ContentFacets;
  score: number;
  /** なぜ選ばれたか。表示はしなくても、検証とデバッグのために残す */
  reasons: MatchReason[];
}

export interface RelatedOptions {
  limit?: number;
  /** 追加で外したいパス */
  exclude?: string[];
  /** 終了したイベントも候補に含める（一覧ページなど） */
  includeEnded?: boolean;
}

export function findRelated(
  current: ContentFacets,
  pool: ContentFacets[],
  options: RelatedOptions = {},
): RelatedCandidate[] {
  const { limit = 4, exclude = [], includeEnded = false } = options;
  const excluded = new Set([current.path, ...exclude]);
  const currentIntents = current.businessIntent
    ? (Object.keys(current.businessIntent) as (keyof NonNullable<ContentFacets['businessIntent']>)[])
        .filter((k) => current.businessIntent![k])
    : [];

  const scored: RelatedCandidate[] = [];

  for (const other of pool) {
    if (excluded.has(other.path)) continue;
    if (other.noindex) continue;
    if (!includeEnded && other.eventLifecycle && !isWorthLinking(other.eventLifecycle)) continue;

    const reasons: MatchReason[] = [];
    let score = 0;

    if (current.sportsTeams.length && other.sportsTeams.some((t) => current.sportsTeams.includes(t))) {
      score += WEIGHTS.sportsTeam;
      reasons.push('sportsTeam');
    }
    if (current.municipalities.length && other.municipalities.some((m) => current.municipalities.includes(m))) {
      score += WEIGHTS.municipality;
      reasons.push('municipality');
    }
    if (currentIntents.length && other.businessIntent) {
      const shared = currentIntents.filter((k) => other.businessIntent![k]);
      if (shared.length) {
        score += WEIGHTS.intent * Math.min(shared.length, 2);
        reasons.push('intent');
      }
    }
    if (current.category && other.category === current.category) {
      score += WEIGHTS.category;
      reasons.push('category');
    }
    if (current.regions.length && other.regions.some((r) => current.regions.includes(r))) {
      score += WEIGHTS.region;
      reasons.push('region');
    }
    const sharedTags = other.tags.filter((t) => current.tags.includes(t));
    if (sharedTags.length) {
      score += WEIGHTS.tag * Math.min(sharedTags.length, 2);
      reasons.push('tag');
    }

    // 一致が地域区分（県北など）だけのものは、関連と呼べるほど近くない。
    // 44市町村のうち同じ地域というだけで並べると、無関係な記事が混ざる。
    const onlyRegion = reasons.length === 1 && reasons[0] === 'region';
    if (score === 0 || onlyRegion) continue;

    scored.push({ facets: other, score, reasons });
  }

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 同点なら新しいものを先に
      return (b.facets.updatedDate ?? b.facets.pubDate).valueOf() - (a.facets.updatedDate ?? a.facets.pubDate).valueOf();
    })
    .slice(0, limit);
}
