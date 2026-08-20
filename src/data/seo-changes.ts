/**
 * SEO改善履歴。「いつ・どのURLを・何のクエリを狙って・どう変えたか」だけを持つ。
 *
 * 設計方針：
 *  - ここには**変更の事実だけ**を書く。クリック数・表示回数・CTR・順位は書かない。
 *    指標はGoogle Search Consoleが16か月分を保持しているので、変更日を起点に
 *    Apps Script側が「変更前7日 / 変更後7日 / 変更後28日」を毎回取り直す。
 *    → 手入力しないので、数値の写し間違いも、古い値の置き去りも起こらない。
 *  - 過去分は git のコミット記録（日付・内容）から起こしたもので、推測は入れていない。
 *    当時の指標は記録していないが、GSCから遡って取得できるため空欄で問題ない。
 *  - 1変更 = 1エントリ。id は Sheets 側の突合キーになるので後から変えない。
 */

/** 変更の種類。判定のしきい値を種類ごとに変えられるようにしておく。 */
export type SeoChangeKind =
  | 'new-article'   // 新規記事（変更前は0が基準。伸びしか見ない）
  | 'on-page'       // 既存ページの title / description / 本文の改善
  | 'technical'     // sitemap・noindex・リダイレクト等の技術改善
  | 'internal-link' // 内部リンクの追加
  | 'ogp';          // OGP画像・メタの改善（CTRに効く想定）

export interface SeoChange {
  /** 突合キー。後から変更しない */
  id: string;
  /** 変更日（本番反映日） YYYY-MM-DD */
  date: string;
  /** 対象URL。サイト全体に及ぶ変更は '*' */
  url: string;
  /** 変更の種類 */
  kind: SeoChangeKind;
  /** 何を変えたか（1行で） */
  change: string;
  /** 狙ったクエリ。分からない場合は空配列（推測で埋めない） */
  queries: string[];
  /** 根拠のコミット */
  commit: string;
  /** 補足（判定時に読む前提の注意書き） */
  note?: string;
}

/**
 * 変更履歴（新しい順）。
 * 追加は `npm run seo:log` を使うと形式が崩れない。
 */
export const SEO_CHANGES: SeoChange[] = [
  {
    id: '20260820-kubiaka-new',
    date: '2026-08-20',
    url: '/news/hitachiota-kubiaka-first-detection-2026/',
    kind: 'new-article',
    change: '常陸太田市の特定外来生物 初確認を起点に、地域資源の保全を扱う解説記事を公開',
    queries: [],
    commit: '14a68e9',
  },
  {
    id: '20260820-ogp-resize',
    date: '2026-08-20',
    url: '*',
    kind: 'ogp',
    change: '新規OGP画像を1200x630へ統一し圧縮（1459KB→287KB / 1112KB→375KB）',
    queries: [],
    commit: 'c030a19',
    note: 'CTRへの影響を見る。順位変動は想定しない。',
  },
  {
    id: '20260819-michinoeki-hub',
    date: '2026-08-19',
    url: '/michinoeki/',
    kind: 'new-article',
    change: '道の駅ハブを新設（16駅・エリア別）。市町村ページから逆引き導線も追加',
    queries: ['茨城 道の駅', '茨城県 道の駅 一覧'],
    commit: '72df14f',
    note: '狙いクエリは仮説。GSCの実クエリで置き換える。',
  },
  {
    id: '20260819-ogp-png',
    date: '2026-08-19',
    url: '*',
    kind: 'ogp',
    change: 'OGP画像をSVGからPNG/JPEGへ全面移行し、実寸とメタタグを一致させた',
    queries: [],
    commit: '330dcee',
    note: 'SNS経由の流入とCTRを見る。SVGはX等で表示できていなかった。',
  },
  {
    id: '20260819-sitemap-52',
    date: '2026-08-19',
    url: '*',
    kind: 'technical',
    change: 'sitemapに44市町村とテーマ8件を追加（24→76 URL）。市町村→テーマの内部リンクも追加',
    queries: [],
    commit: 'f40af14',
    note: '最重要。indexableな52ページがsitemapから漏れていた。インデックス数と表示回数で見る。',
  },
  {
    id: '20260818-busan-secondary-transport',
    date: '2026-08-18',
    url: '/news/ibaraki-airport-busan-air-busan-charter-2026/',
    kind: 'on-page',
    change: '空港からの二次交通（水戸方面バスの所要・運賃、宿泊者の無料アクセスバス）とFAQ3件を追記。titleは変更せず',
    queries: ['茨城空港 釜山'],
    commit: '20915b6',
    note: '変更前CTR18.52%・平均6.70位が高かったためtitleは維持。表示回数の伸びで見る。',
  },
  {
    id: '20260818-stadium-mitostation',
    date: '2026-08-18',
    url: '/news/mito-hollyhock-new-stadium-access/',
    kind: 'on-page',
    change: 'title変更＋最大流入クエリ「水戸駅から」のセクションを新設。公式第四報で徒歩距離の誤りも訂正',
    queries: [
      '水戸駅から水戸信用金庫スタジアム',
      '東海駅から水戸信用金庫スタジアム',
      '水戸信用金庫スタジアム 駐車場',
      '水戸信用金庫スタジアム シャトルバス',
      '水戸ホーリーホック 駐車場',
      '水戸ホーリーホック スタジアム アクセス',
    ],
    commit: 'a95796a',
    note: '「水戸駅から」は変更前に記事内へ記載が無かった。ここの順位変化が最も分かりやすい指標。',
  },
  {
    id: '20260818-index-hygiene',
    date: '2026-08-18',
    url: '*',
    kind: 'technical',
    change: 'タグ34件をnoindex,follow化。/agency/を実301へ。/reporters/をsitemapへ収録',
    queries: [],
    commit: 'c56ed3d',
    note: 'インデックス数は意図的に減る。品質側の指標（有効ページの表示回数）で見る。',
  },
  {
    id: '20260818-ringring-new',
    date: '2026-08-18',
    url: '/news/ringring-road-cycling-132k-2024/',
    kind: 'new-article',
    change: 'つくば霞ヶ浦りんりんロードの利用者数を起点にした解説記事を公開',
    queries: [],
    commit: '3968c10',
  },
  {
    id: '20260817-kajual-new',
    date: '2026-08-17',
    url: '/news/hitachiota-kajual-fruit-farm-dx/',
    kind: 'new-article',
    change: '常陸太田市KAJUALを起点にした地域観光DXの解説記事を公開',
    queries: [],
    commit: 'afd403a',
  },
  {
    id: '20260816-homeopening-new',
    date: '2026-08-16',
    url: '/news/mito-hollyhock-home-opening-13226-regional-impact/',
    kind: 'new-article',
    change: 'J1ホーム開幕戦13,226人を起点にした解説記事を公開',
    queries: [],
    commit: '1ac8f70',
  },
  {
    id: '20260816-passport-new',
    date: '2026-08-16',
    url: '/news/ibaraki-passport-44-municipalities/',
    kind: 'new-article',
    change: 'IBARAKI PASSPORTを起点にした周遊観光の解説記事を公開',
    queries: [],
    commit: '9701cc2',
  },
];

/** 判定に使うしきい値。Apps Script側と共有する。 */
export const SEO_VERDICT_RULES = {
  /** これ未満の表示回数では判定しない（少数だと誤差が大きいため） */
  minImpressions: 30,
  /** 順位がこれ以上良くなったら改善とみなす（数値が小さいほど上位） */
  positionImproved: 1.0,
  /** 順位がこれ以上悪化したら要検討 */
  positionWorsened: 1.5,
  /** クリックの増減率のしきい値 */
  clicksImprovedRatio: 1.2,
  clicksWorsenedRatio: 0.8,
} as const;
