/**
 * IBATOCO SPORTS — 茨城のスポーツ領域のデータ定義。
 *
 * 事実の扱い（重要）:
 *  - チームの所属リーグ・本拠地・ホームタウンは、**公式で確認できたものだけ**を書く。
 *    確認できていない項目は undefined のままにし、画面側で「準備中」または非表示にする。
 *    2026年8月30日時点で確認できたのは水戸ホーリーホックの本拠地のみ
 *    （既に公開済みの当サイト記事「水戸信用金庫スタジアムのアクセス・駐車場」で確認）。
 *  - 試合日程・結果・順位は SPORTS_MATCHES に入れるが、**現時点では空**。
 *    未確認のまま入れない。外部APIの自動取得は今回実装していない。
 *  - 公式ロゴ・選手写真など権利の確認できない素材は使わない。テキストだけで構成する。
 */

/** 記事とページを結ぶチームの識別子。CMS側の値もこれに揃える。 */
export type SportsTeamSlug =
  | 'mito-hollyhock'
  | 'kashima-antlers'
  | 'ibaraki-robots'
  | 'ibaraki-astroplanets'
  | 'hitachi-hightech-cougars';

/** 記事の種類。絞り込みの軸になる。 */
export type SportsContentType =
  | 'match-result'
  | 'preview'
  | 'home-guide'
  | 'away-guide'
  | 'news'
  | 'column';

export const SPORTS_CONTENT_TYPES: Record<SportsContentType, { label: string; note: string }> = {
  'match-result': { label: '試合結果', note: '終わった試合を、記録として残す' },
  preview: { label: 'プレビュー', note: '次の試合の見どころと予定' },
  'home-guide': { label: '観戦ガイド', note: '会場での過ごし方、行き方、周辺' },
  'away-guide': { label: '遠征ガイド', note: '県外から来る人、県外へ行く人へ' },
  news: { label: 'ニュース', note: 'クラブと地域の動き' },
  column: { label: 'コラム', note: '編集部の視点' },
};

export interface SportsTeam {
  slug: SportsTeamSlug;
  /** 公式表記のチーム名 */
  name: string;
  /** 競技種目 */
  sport: string;
  /** 一覧カードの1行説明。確認できた事実だけを書く */
  summary: string;
  /** 所属リーグ。未確認なら undefined（画面に出さない） */
  league?: string;
  /** 本拠地。未確認なら undefined（画面に出さない） */
  venue?: string;
  /** 関連する市町村slug。確認できたものだけ。/area/ への導線に使う */
  municipalitySlugs: string[];
  /**
   * リーグ・本拠地などの基本情報が未確認であることを画面に明示するか。
   * 空欄を黙って隠すと「調べていない」ことが読者に伝わらないため。
   */
  basicsPending: boolean;
}

export const SPORTS_TEAMS: SportsTeam[] = [
  {
    slug: 'mito-hollyhock',
    name: '水戸ホーリーホック',
    sport: 'サッカー',
    summary: '水戸を本拠地とするサッカークラブ。当サイトではスタジアムへの行き方や、試合の外へ広がる地域の動きを記録しています。',
    // 当サイトの既存記事（水戸信用金庫スタジアムのアクセス・駐車場）で確認済み
    venue: '水戸信用金庫スタジアム',
    municipalitySlugs: ['mito'],
    basicsPending: false,
  },
  {
    slug: 'kashima-antlers',
    name: '鹿島アントラーズ',
    sport: 'サッカー',
    summary: '茨城県を拠点とするサッカークラブ。',
    municipalitySlugs: [],
    basicsPending: true,
  },
  {
    slug: 'ibaraki-robots',
    name: '茨城ロボッツ',
    sport: 'バスケットボール',
    summary: '茨城県を拠点とするバスケットボールクラブ。',
    municipalitySlugs: [],
    basicsPending: true,
  },
  {
    slug: 'ibaraki-astroplanets',
    name: '茨城アストロプラネッツ',
    sport: '野球',
    summary: '茨城県を拠点とする野球チーム。',
    municipalitySlugs: [],
    basicsPending: true,
  },
  {
    slug: 'hitachi-hightech-cougars',
    name: '日立ハイテク クーガーズ',
    sport: 'バスケットボール',
    summary: '茨城県を拠点とするバスケットボールチーム。',
    municipalitySlugs: [],
    basicsPending: true,
  },
];

export const SPORTS_TEAM_BY_SLUG: Record<SportsTeamSlug, SportsTeam> = Object.fromEntries(
  SPORTS_TEAMS.map((team) => [team.slug, team])
) as Record<SportsTeamSlug, SportsTeam>;

/**
 * 試合の1件。将来ここへ日程・結果を入れる。
 * status で「これから」「終わった」「中止」を分け、画面側の出し分けに使う。
 */
export interface SportsMatch {
  team: SportsTeamSlug;
  /** 大会・リーグ名（例：リーグ戦、カップ戦） */
  competition: string;
  /** 開催日 YYYY-MM-DD */
  date: string;
  /** 対戦相手 */
  opponent: string;
  homeAway: 'home' | 'away' | 'neutral';
  venue: string;
  /** 開始時刻 HH:mm。未定なら undefined */
  startTime?: string;
  /** 結果。終了した試合だけ入れる */
  score?: { own: number; opponent: number };
  status: 'scheduled' | 'finished' | 'cancelled' | 'postponed';
  /** 当サイト内の関連記事URL */
  articleUrl?: string;
}

/**
 * 試合データ。**意図的に空**にしてある。
 * 日程・結果・順位は一次情報で確認できたものだけを入れる。
 * 空のあいだ、画面には「準備中」と出す。
 */
export const SPORTS_MATCHES: SportsMatch[] = [];

export function matchesOf(team: SportsTeamSlug): SportsMatch[] {
  return SPORTS_MATCHES.filter((m) => m.team === team);
}

export function upcomingMatches(team: SportsTeamSlug): SportsMatch[] {
  return matchesOf(team)
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function finishedMatches(team: SportsTeamSlug): SportsMatch[] {
  return matchesOf(team)
    .filter((m) => m.status === 'finished')
    .sort((a, b) => b.date.localeCompare(a.date));
}
