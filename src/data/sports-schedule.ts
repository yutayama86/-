/**
 * IBATOCO SPORTS — 試合の年間日程・結果・観戦ガイド。
 *
 * 試合データは記事本文から切り離し、チームごとの JSON で持つ。
 *   src/data/sports/matches/<team>.json
 *
 * JSON にしたのは、ビルド以外（scripts/sports-status.mjs などの運用スクリプト）からも
 * 同じデータを読めるようにするため。形式の正しさはここで検査し、崩れていればビルドを止める。
 *
 * 事実の扱い（重要）:
 *  - 日時・会場・結果・イベント・交通は、公式の一次情報で確認できたものだけを入れる。
 *    優先順位：クラブ公式 → Jリーグ公式 → 大会公式（AFC・JFA）→ 交通事業者 → 自治体・施設。
 *  - 確認できなかったことは書かずに guide.unverified へ「確認できていない項目」として残す。
 *    空欄を黙って隠すと、調べていないのか、存在しないのかが読者に分からないため。
 *  - 各項目に sourceUrl を付け、guide.verifiedAt に確認した日を入れる。
 *  - 日付が「土or日」のように未確定の試合は入れない。確定してから入れる。
 *
 * 更新の流れは docs/SPORTS_MATCHDAY_LOOP.md、次にやることは `npm run sports:status` で出る。
 */
import { z } from 'astro/zod';
import { SPORTS_TEAMS, type SportsTeamSlug } from './sports';
import kashimaAntlers from './sports/matches/kashima-antlers.json';
import mitoHollyhock from './sports/matches/mito-hollyhock.json';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const teamSlugs = SPORTS_TEAMS.map((team) => team.slug) as [SportsTeamSlug, ...SportsTeamSlug[]];

const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  accessedAt: z.string().regex(DATE),
});

/** 観戦ガイドの1行。外部の根拠は sourceUrl、サイト内の導線は href */
const guideItemSchema = z.object({
  text: z.string().min(1),
  sourceUrl: z.url().optional(),
  href: z.string().startsWith('/').optional(),
});

/** ガイドの節。key は並び順と今後の自動チェック（sports:status）に使う */
export const GUIDE_SECTION_KEYS = [
  'match', 'ticket', 'cashless', 'gourmet', 'event', 'rules', 'access', 'parking', 'tourism',
] as const;

const guideSchema = z.object({
  /** 節の見出し。対戦カードと日付を入れて、試合単体の検索にも答える */
  title: z.string().min(1),
  /** 公式情報を確認した日 */
  verifiedAt: z.string().regex(DATE),
  /**
   * チームページ上部に出す「観戦で押さえること」。試合直前に必要なことだけを短く。
   * 詳細は sections に書き、ここは要約にとどめる（ここにしか無い事実を書かない）。
   */
  keyFacts: z.array(z.string().min(1)).default([]),
  sections: z.array(z.object({
    key: z.enum(GUIDE_SECTION_KEYS),
    title: z.string().min(1),
    items: z.array(guideItemSchema).min(1),
  })).min(1),
  /** 確認できていない項目の前置き */
  unverifiedNote: z.string().optional(),
  /** 確認できていない項目。書かなかったことを読者にも伝える */
  unverified: z.array(z.string().min(1)).default([]),
});

/** 観戦＋地域回遊のモデルコース。時刻は公式に確認できたものだけを軸にする */
const matchDaySchema = z.object({
  title: z.string().min(1),
  lead: z.string().min(1),
  steps: z.array(z.object({
    time: z.string().min(1),
    title: z.string().min(1),
    detail: z.string().min(1),
    sourceUrl: z.url().optional(),
    href: z.string().startsWith('/').optional(),
  })).min(2),
  cautions: z.array(z.string().min(1)).default([]),
});

const scoreSchema = z.object({ own: z.number().int().min(0), opponent: z.number().int().min(0) });

const matchSchema = z.object({
  /** <team>-<YYYY-MM-DD>-<大会>-<節>。後から変えない */
  id: z.string().regex(/^[a-z0-9-]+$/),
  date: z.string().regex(DATE),
  /** キックオフ HH:mm。未定なら省く（「未定」と書かない） */
  kickoff: z.string().regex(TIME).optional(),
  /** 例：日本時間 */
  kickoffNote: z.string().min(1).optional(),
  openTime: z.string().regex(TIME).optional(),
  /** 例：予定 */
  openTimeNote: z.string().min(1).optional(),
  /** 大会名。冠を含む公式の大会名。英数字は半角 */
  competition: z.string().min(1),
  /** 節・回戦・MD */
  round: z.string().min(1).optional(),
  /** リーグ戦とカップ戦を混同しないための区分 */
  kind: z.enum(['league', 'cup', 'continental']),
  opponent: z.string().min(1),
  homeAway: z.enum(['home', 'away', 'neutral']),
  /** 会場名。大会によって命名権の有無が変わるため、試合ごとに公式の表記で持つ */
  venue: z.string().min(1),
  status: z.enum(['scheduled', 'finished', 'cancelled', 'postponed']),
  /** 90分（延長を含む）のスコア。終了した試合だけ */
  score: scoreSchema.optional(),
  /** PK戦。引き分けの試合だけ */
  pk: scoreSchema.optional(),
  broadcast: z.array(z.string().min(1)).default([]),
  /** クラブの試合ページ（観戦ガイド等） */
  officialUrl: z.url().optional(),
  /** 終わった試合の簡潔な振り返り。事実だけ。戦術評価や推測は書かない */
  recap: z.string().min(1).optional(),
  /** 冠試合・地域連携企画の名称。公式表記のまま */
  community: z.array(z.string().min(1)).default([]),
  articleUrl: z.string().startsWith('/').optional(),
  guide: guideSchema.optional(),
  matchDay: matchDaySchema.optional(),
  sources: z.array(sourceSchema).min(1),
}).superRefine((m, ctx) => {
  if (m.status === 'finished' && !m.score) {
    ctx.addIssue({ code: 'custom', path: ['score'], message: `${m.id}: 終了した試合には score が必要です。` });
  }
  if (m.status !== 'finished' && m.score) {
    ctx.addIssue({ code: 'custom', path: ['score'], message: `${m.id}: 終了していない試合に score は入れません。` });
  }
  if (m.pk && (!m.score || m.score.own !== m.score.opponent)) {
    ctx.addIssue({ code: 'custom', path: ['pk'], message: `${m.id}: pk は引き分けの試合だけに入れます。` });
  }
});

const scheduleSchema = z.object({
  team: z.enum(teamSlugs),
  /** このチームのデータを最後に公式情報で確認・更新した日。ページの「最終更新」に出す */
  updatedAt: z.string().regex(DATE),
  matches: z.array(matchSchema),
}).superRefine((s, ctx) => {
  const seen = new Set<string>();
  for (const m of s.matches) {
    if (seen.has(m.id)) ctx.addIssue({ code: 'custom', path: ['matches'], message: `試合IDが重複しています: ${m.id}` });
    seen.add(m.id);
  }
});

export type SportsSource = z.infer<typeof sourceSchema>;
export type MatchGuide = z.infer<typeof guideSchema>;
export type MatchDayPlan = z.infer<typeof matchDaySchema>;
export type SportsMatch = z.infer<typeof matchSchema> & { team: SportsTeamSlug };

/** チームを増やすときは、JSON を置いてここへ1行足す */
const RAW_SCHEDULES: unknown[] = [kashimaAntlers, mitoHollyhock];

export const SPORTS_SCHEDULES = RAW_SCHEDULES.map((raw) => scheduleSchema.parse(raw));

/** 全チームの試合。画面へ出すときは lib/sports.ts の getTeamMatches() を使う */
export const SPORTS_MATCHES: SportsMatch[] = SPORTS_SCHEDULES.flatMap((schedule) =>
  schedule.matches.map((match) => ({ ...match, team: schedule.team }))
);

/** チームのデータを最後に確認・更新した日。データの無いチームは undefined */
export function scheduleUpdatedAt(team: SportsTeamSlug): string | undefined {
  return SPORTS_SCHEDULES.find((schedule) => schedule.team === team)?.updatedAt;
}
