/**
 * IBATOCO SPORTS — 茨城のスポーツ領域のデータ定義。
 *
 * 事実の扱い（重要）:
 *  - チームの所属リーグ・本拠地・ホームタウンは、**公式で確認できたものだけ**を書く。
 *    確認できていない項目は undefined のままにし、画面側で「準備中」または非表示にする。
 *    2026年8月30日に各チームの公式サイト（クーガーズのみひたちなか市公式）で確認した。
 *  - 関係市町村の区分名は**クラブが使っている表記をそのまま使う**。
 *    ホームタウン／マザータウン／フレンドリータウン／フランチャイズは意味が違うため、
 *    「関連市町村」などにまとめて平らにしない。まとめた瞬間に事実が変わる。
 *    例：ロボッツのホームタウンは水戸市の1市だけで、つくば市はマザータウン。
 *    検索結果には両者を混ぜた記述があるが、公式の区分に従う。
 *  - 試合日程・結果・順位は、確認できたものだけを入れる。外部APIの自動取得はしない。
 *    出どころは2つ：記事frontmatterの sportsMatch と、下の SPORTS_MATCHES。
 *    記事のある試合は記事側が持ち、記事の無い試合だけ SPORTS_MATCHES に手で入れる。
 *    読み出しは lib/sports.ts の getTeamMatches() に一本化する。
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

/**
 * クラブと市町村の関係。区分ごとに分けて持つ。
 * label にはクラブの公式表記をそのまま入れる（言い換えない）。
 */
export interface SportsTownGroup {
  /** 例：ホームタウン、マザータウン、フレンドリータウン、フランチャイズ */
  label: string;
  /** 市町村slug。src/data/areas.ts の44件に一致させる */
  slugs: string[];
}

export interface SportsTeam {
  slug: SportsTeamSlug;
  /** 公式表記のチーム名 */
  name: string;
  /** 競技種目 */
  sport: string;
  /** 一覧カードの1行説明。確認できた事実だけを書く */
  summary: string;
  /**
   * 所属リーグ。未確認なら undefined（画面に出さない）。
   *
   * 表記のきまり:
   *  - 大会名だけを短く入れる。丸括弧の補足（正式名称の展開など）は入れない。
   *  - 英数字は半角で書く（J1リーグ / B.LEAGUE B1 / WJBL）。
   *    公式サイトは全角の「Ｊ１リーグ」表記だが、小さな注記で並べると
   *    字間が空いて読みにくく、他のリーグ名とも揃わないため半角にそろえる。
   *  - 同じ大会に出ているチームは、必ず同じ文字列にする。
   *    クラブによって公式サイトの書き方が違う（「Ｊ１リーグ」と
   *    「明治安田Ｊ１リーグ」）が、大会は同じなので表示を分けない。
   *    並べたときに別のリーグに見えてしまうため。
   */
  league?: string;
  /** 本拠地。未確認なら undefined（画面に出さない） */
  venue?: string;
  /** 関係する市町村を公式の区分ごとに。確認できたものだけ。/area/ への導線に使う */
  towns: SportsTownGroup[];
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
    summary: '県北を中心に18市町村をホームタウンとするサッカークラブ。当サイトではスタジアムへの行き方や、試合の外へ広がる地域の動きを記録しています。',
    // 公式サイト（クラブトップ）で確認（2026年8月30日）
    league: 'J1リーグ',
    // 当サイトの既存記事（アクセス・駐車場）でも確認済み
    venue: '水戸信用金庫スタジアム',
    towns: [
      {
        // 公式が列挙している順序のまま。検索結果には9市町村とする記述もあったが、
        // 公式のクラブ情報ページは18市町村を挙げている
        label: 'ホームタウン',
        slugs: [
          'mito', 'hitachinaka', 'kasama', 'naka', 'omitama', 'ibaraki-machi',
          'oarai', 'shirosato', 'tokai', 'hitachi', 'hitachiota', 'kitaibaraki',
          'hitachiomiya', 'takahagi', 'daigo', 'ishioka', 'chikusei', 'sakuragawa',
        ],
      },
    ],
    basicsPending: false,
  },
  {
    slug: 'kashima-antlers',
    name: '鹿島アントラーズ',
    sport: 'サッカー',
    summary: '鹿行（ろっこう）5市をホームタウンとするサッカークラブ。',
    // 公式サイトで確認（2026年8月30日）。公式の表記は「明治安田Ｊ１リーグ」だが、
    // 水戸と同じ大会なので、冠スポンサー名を外した大会名にそろえる
    league: 'J1リーグ',
    venue: 'メルカリスタジアム',
    towns: [
      {
        // 公式「クラブ ホームタウン」ページで確認。公式はこの5市を「鹿行5市」と総称している
        label: 'ホームタウン',
        slugs: ['kashima', 'itako', 'kamisu', 'namegata', 'hokota'],
      },
    ],
    basicsPending: false,
  },
  {
    slug: 'ibaraki-robots',
    name: '茨城ロボッツ',
    sport: 'バスケットボール',
    summary: '水戸市をホームタウンとするバスケットボールクラブ。県内の多くの市町村と、区分を分けて関係を結んでいます。',
    // 公式サイトで確認（2026年8月30日）。公式表記は「B.LEAGUE（B1）」。
    // 括弧を使わないきまりに合わせ、ディビジョンはそのまま並べて書く
    league: 'B.LEAGUE B1',
    venue: 'アダストリアみとアリーナ',
    // 公式「クラブ概要」の3区分をそのまま保持する。
    // ホームタウンは水戸市のみ。つくば市はマザータウンであってホームタウンではない
    towns: [
      { label: 'ホームタウン', slugs: ['mito'] },
      { label: 'マザータウン', slugs: ['naka', 'kamisu', 'tsukuba', 'hitachi'] },
      {
        label: 'フレンドリータウン',
        slugs: [
          'ushiku', 'hitachinaka', 'oarai', 'hitachiota', 'tsukubamirai', 'shirosato',
          'omitama', 'kasama', 'tokai', 'tsuchiura', 'hitachiomiya', 'ishioka',
          'daigo', 'namegata', 'ryugasaki', 'goka', 'koga', 'kitaibaraki', 'takahagi',
        ],
      },
    ],
    basicsPending: false,
  },
  {
    slug: 'ibaraki-astroplanets',
    name: '茨城アストロプラネッツ',
    sport: '野球',
    summary: '県内14市町村をフランチャイズとする野球チーム。',
    // 公式サイトで確認（2026年8月30日）。本拠地球場の記載はなかった
    league: 'ルートインBCリーグ',
    towns: [
      {
        label: 'フランチャイズ',
        slugs: [
          'mito', 'hitachi', 'tsuchiura', 'koga', 'ryugasaki', 'takahagi', 'kasama',
          'ushiku', 'hitachiomiya', 'tsukubamirai', 'omitama', 'oarai', 'miho', 'kamisu',
        ],
      },
    ],
    basicsPending: false,
  },
  {
    slug: 'hitachi-hightech-cougars',
    name: '日立ハイテク クーガーズ',
    sport: 'バスケットボール',
    summary: 'ひたちなか市をホームタウンとする女子バスケットボールチーム。',
    // WJBL公式のチーム紹介に掲載されている（2026年8月30日確認）。
    // 正式名称は「バスケットボール女子日本リーグ」。括弧は使わず略称で統一する
    league: 'WJBL',
    // チーム公式サイトには本拠地体育館の記載がなかったため venue は入れない
    towns: [
      {
        // ひたちなか市公式が「ひたちなか市のホームタウンスポーツチーム」と記載し、
        // 市とホームタウンパートナー協定を結んでいる（2026年8月30日確認）
        label: 'ホームタウン',
        slugs: ['hitachinaka'],
      },
    ],
    basicsPending: true,
  },
];

export const SPORTS_TEAM_BY_SLUG: Record<SportsTeamSlug, SportsTeam> = Object.fromEntries(
  SPORTS_TEAMS.map((team) => [team.slug, team])
) as Record<SportsTeamSlug, SportsTeam>;

/** 区分をまたいだ市町村slugの重複なし一覧。関係する街の記事を引くのに使う */
export function townSlugsOf(team: SportsTeam): string[] {
  return [...new Set(team.towns.flatMap((group) => group.slugs))];
}

/**
 * 一覧カード用に、最初の区分（各チームとも最上位の関係＝ホームタウン等）だけを返す。
 * 下位の区分まで並べるとカードが埋まるうえ、区分の違いが読めなくなる。
 */
export function primaryTowns(team: SportsTeam): SportsTownGroup | undefined {
  return team.towns[0];
}

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
 * 記事を書いていない試合を手で入れる場所。**現時点では空**。
 * 記事のある試合は記事frontmatterの sportsMatch が持つので、ここには重複させない。
 * 日程・結果・順位は一次情報で確認できたものだけを入れる。
 *
 * 画面へ出すときは lib/sports.ts の getTeamMatches() を使う。
 * ここと記事の両方をまとめて重複を除くので、読み出し口はそちらに一本化する。
 */
export const SPORTS_MATCHES: SportsMatch[] = [];
