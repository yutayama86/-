/**
 * チームページの NEXT MATCH / LATEST RESULT を組み立てる。
 *
 * 試合データの出どころは2つある。
 *  1. src/data/sports.ts の SPORTS_MATCHES（手で入れる。記事が無い試合用）
 *  2. 記事frontmatterの sportsMatch（記事を書いた試合は、記事が試合データを兼ねる）
 *
 * 2を用意したのは、試合ごとに「記事URLの一覧」を手で持たないため。
 * 記事を1本足せば、その試合が自動でチームページの上部へ出る。
 *
 * 未確認のデータは作らない。日程が無ければ NEXT MATCH は出さないし、
 * スコアが無ければ点差を書かない。空欄を埋めるための推測はしない。
 */
import type { CollectionEntry } from 'astro:content';
import {
  SPORTS_MATCHES, SPORTS_TEAM_BY_SLUG, articleAnchorTeam, articleTeamSlugs,
  type SportsMatch, type SportsTeamSlug,
} from '../data/sports';
import { getSportsNews } from './content';

/** 画面に出す試合1件。記事から来たものは articleUrl と articleTitle を持つ */
export interface ResolvedMatch {
  team: SportsTeamSlug;
  date: Date;
  opponent: string;
  homeAway: 'home' | 'away' | 'neutral';
  kickoff?: string;
  competition?: string;
  venue?: string;
  score?: { own: number; opponent: number };
  articleUrl?: string;
  articleTitle?: string;
}

const newsPath = (id: string) => `/news/${id.split('/').pop()}/`;

/** 同じ試合を2回出さないための鍵。日付と相手が一致すれば同じ試合とみなす */
const matchKey = (m: { team: string; date: Date; opponent: string }) =>
  `${m.team}|${m.date.toISOString().slice(0, 10)}|${m.opponent}`;

function fromManual(entry: SportsMatch): ResolvedMatch | null {
  // 中止・延期は日程としても結果としても出さない
  if (entry.status === 'cancelled' || entry.status === 'postponed') return null;
  return {
    team: entry.team,
    date: new Date(entry.date),
    opponent: entry.opponent,
    homeAway: entry.homeAway,
    kickoff: entry.startTime,
    competition: entry.competition,
    venue: entry.venue,
    score: entry.score,
    articleUrl: entry.articleUrl,
  };
}

const FLIP: Record<ResolvedMatch['homeAway'], ResolvedMatch['homeAway']> = {
  home: 'away',
  away: 'home',
  neutral: 'neutral',
};

/**
 * 記事から、指定チーム視点の試合を取り出す。
 *
 * sportsMatch の opponent / homeAway / score は「視点のチーム」から見た値。
 * 対戦カード記事（水戸 vs 鹿島）を相手側のチームページに出すときは、
 * 相手＝視点のチーム、HOME↔AWAY、スコアの左右を入れ替える。
 * そうしないと鹿島のページに「HOME vs 鹿島アントラーズ」と出てしまう。
 */
function fromArticle(item: CollectionEntry<'news'>, forTeam: SportsTeamSlug): ResolvedMatch | null {
  const match = item.data.sportsMatch;
  if (!match) return null;
  const teams = articleTeamSlugs(item.data);
  if (!teams.includes(forTeam)) return null;

  const anchor = articleAnchorTeam(item.data);
  const base = {
    team: forTeam,
    date: match.date,
    kickoff: match.kickoff,
    competition: match.competition,
    venue: match.venue,
    articleUrl: newsPath(item.id),
    articleTitle: item.data.title,
  };

  // 視点のチーム自身、または相手がイバトコの扱うチームでない場合は、書かれたまま
  if (!anchor || anchor === forTeam) {
    return { ...base, opponent: match.opponent, homeAway: match.homeAway, score: match.score };
  }

  return {
    ...base,
    opponent: SPORTS_TEAM_BY_SLUG[anchor].name,
    homeAway: FLIP[match.homeAway],
    score: match.score ? { own: match.score.opponent, opponent: match.score.own } : undefined,
  };
}

/**
 * チームの試合を、記事側と手入力側から集めて重複を除く。
 * 同じ試合が両方にあるときは、記事のほう（読み先がある）を優先する。
 */
export async function getTeamMatches(team: SportsTeamSlug): Promise<ResolvedMatch[]> {
  const byKey = new Map<string, ResolvedMatch>();

  for (const entry of SPORTS_MATCHES) {
    if (entry.team !== team) continue;
    const resolved = fromManual(entry);
    if (resolved) byKey.set(matchKey(resolved), resolved);
  }

  for (const item of await getSportsNews(team)) {
    const resolved = fromArticle(item, team);
    if (!resolved) continue;
    const key = matchKey(resolved);
    const existing = byKey.get(key);
    // 手入力側にしか無い項目（会場など）は残したまま、記事側で上書きする
    byKey.set(key, existing ? { ...existing, ...resolved } : resolved);
  }

  return [...byKey.values()].sort((a, b) => a.date.valueOf() - b.date.valueOf());
}

/**
 * 次の試合。基準日は「ビルドした日」。
 * 静的サイトなので、試合日を過ぎても再ビルドするまで表示は変わらない。
 * 記事を追加すればビルドが走るため、運用上はそこで更新される。
 */
export function pickNextMatch(matches: ResolvedMatch[], now = new Date()): ResolvedMatch | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return matches.find((m) => m.date >= today && !m.score);
}

/** 直近の結果。スコアが入っているものだけを「結果」として扱う */
export function pickLatestResult(matches: ResolvedMatch[]): ResolvedMatch | undefined {
  return [...matches].reverse().find((m) => Boolean(m.score));
}

export const HOME_AWAY_LABEL: Record<ResolvedMatch['homeAway'], string> = {
  home: 'HOME',
  away: 'AWAY',
  neutral: '中立地',
};

/** 勝敗。スコアがあるときだけ返す（順位や連勝などの集計はしない） */
export function resultLabel(match: ResolvedMatch): string | undefined {
  if (!match.score) return undefined;
  const { own, opponent } = match.score;
  if (own > opponent) return '勝';
  if (own < opponent) return '敗';
  return '分';
}
