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
    id: '20260828-en-hitachi-seaside-park-from-tokyo',
    date: '2026-08-28',
    url: '/en/hitachi-seaside-park-from-tokyo/',
    kind: 'on-page',
    change: '運賃セクションを改善。金額は一次情報で確認できなかったため書かず、茨城交通の経路・運賃検索とJR東日本英語サイトへの導線を追加。title/description/H1・hreflang・canonicalは監査の結果いずれも適正で無変更',
    queries: ['Tokyo to Hitachi Seaside Park', 'Hitachi Seaside Park from Tokyo', 'how to get to Hitachi Seaside Park from Tokyo'],
    commit: 'PENDING',
    note: '公園公式・茨城交通のりば案内とも運賃の掲載なし、茨城交通のリリースは403で読めず。検索結果には450円とあるが未確認のため不採用。経路と所要時間（東京→勝田 特急約85分／勝田駅東口2番のりば→西口 約15分／みと号 約2時間）は公園公式で再確認し、既存記載と一致。/en/配下は本ページ1本のみで、同言語の内部リンク先が存在しない。',
  },
  {
    id: '20260828-news-kasama-kogiku-meigara-sanchi-2026',
    date: '2026-08-28',
    url: '/news/kasama-kogiku-meigara-sanchi-2026/',
    kind: 'new-article',
    change: '笠間市の小菊が10回目の銘柄産地に指定されたことを起点に、産地は有名になるだけでなく「作り続けられる」状態をつくって初めて地域資産になるという視点で解説',
    queries: ['笠間 小菊', '茨城 銘柄産地', '笠間市 花き', '小菊 産地', '銘柄産地 指定'],
    commit: '9d9d5ba',
    note: '「県内第1位」は系統出荷の数量・販売金額に限定される旨を本文とFAQで明示。産地の縮小については県・部会長・市で述べていることが異なるため、断定せず出典を分けて併記した。',
  },
  {
    id: '20260827-site',
    date: '2026-08-27',
    url: '*',
    kind: 'on-page',
    change: '下層ページ共通の見出しをヘッダー直下の全幅バンドに変更（紙色の隙間16pxを解消）。テーマ切替の選択中チップが濃紺地に濃い文字で読めなかったのを白文字へ修正。パンくずがチップ化されていたのを平文へ戻す',
    queries: [],
    commit: '37c499f',
    note: 'コントラスト比1.5→8.03でAA達成。テーマガイド（/yama/等）の見出しは写真と横並びのカードのため対象外。',
  },
  {
    id: '20260827-odekake',
    date: '2026-08-27',
    url: '/odekake/',
    kind: 'internal-link',
    change: '地域カードの街リンクを各2件から3件へ増やし、県北・県央・鹿行・県西の選定を見直し。あわせてTOPと/area/のモバイル「市町村名から選ぶ」で県北だけ開いていた既定を、5地域とも閉じた状態に変更',
    queries: [],
    commit: '43350ec',
    note: '2件では県西（半日コース整備済みが8市町）の選び方が恣意的だったため。選定基準は「半日コースまで整備済みのページ」から地域の性格が伝わる3件で、件数は地域間で揃える。牛久は県南に継続。',
  },
  {
    id: '20260827-area-ushiku',
    date: '2026-08-27',
    url: '/area/ushiku/',
    kind: 'on-page',
    change: 'titleを「牛久市の歩き方｜牛久大仏と牛久シャトー・半日コース」から「牛久市観光｜牛久大仏・牛久シャトー・半日モデルコース」へ変更。descriptionも「歩き方」から「観光ガイド」起点に書き換え、地上85mの胎内展望台と季節の見どころを追記。あわせて /odekake/ の地域カードに代表2市町村へのリンクを追加し、牛久へテーマ側からの導線を新設',
    queries: ['牛久 観光', '牛久大仏', '牛久シャトー', '牛久 モデルコース', '牛久 半日'],
    commit: 'c065b5c',
    note: '8/22〜24は123表示・0クリック・平均約10位。共通形式の「◯◯の歩き方」では主要クエリ語が1つも一致しないため、この街だけtitleを丸ごと差し替えた（pageTitle項目を新設。他43市町村は無変更）。本文・URLは無変更。8/26の前回変更は計測前だったため、計測基準日は本日とする。牛久の被リンクは16→17件。',
  },
  {
    id: '20260827-news-hitachinaka-machizemi-2026',
    date: '2026-08-27',
    url: '/news/hitachinaka-machizemi-2026/',
    kind: 'new-article',
    change: 'ひたちなかDEまちゼミを起点に、店主の知識・専門性が地域の資産になるという視点で解説',
    queries: ['ひたちなか まちゼミ', 'まちゼミ 茨城', 'ひたちなかDEまちゼミ', '得する街のゼミナール'],
    commit: '10f894d',
  },
  {
    id: '20260827-news-shin-ibaraki-meshi-2026',
    date: '2026-08-27',
    url: '/news/shin-ibaraki-meshi-2026/',
    kind: 'new-article',
    change: 'シン・いばらきメシ総選挙2026を起点に、3日間のイベントを地域の味へつなげる視点で解説',
    queries: ['シン・いばらきメシ総選挙', 'いばらきメシ総選挙 2026', '茨城 ご当地グルメ', '三の丸庁舎 イベント'],
    commit: '6077118',
  },
  {
    id: '20260826-news-ibaraki-natto-nihonichi-project-202',
    date: '2026-08-26',
    url: '/news/ibaraki-natto-nihonichi-project-2026/',
    kind: 'new-article',
    change: '茨城県の納豆日本一奪還プロジェクトを起点に、知名度を地域産業の競争力へ変える条件を解説。納豆関連の取材展開のハブ記事',
    queries: ['納豆 日本一', '水戸 納豆', '茨城 納豆', '納豆日本一奪還プロジェクト', '全国納豆鑑評会'],
    commit: '1b2194f',
  },
  {
    id: '20260826-zh-tw-hitachi-seaside-park-from-tokyo',
    date: '2026-08-26',
    url: '/zh-tw/hitachi-seaside-park-from-tokyo/',
    kind: 'on-page',
    change: '冒頭に東京からの経路連鎖（路線一次看懂）を追加。titleとdescriptionは変更なし',
    queries: [],
    commit: 'c08f003',
    note: '平均14位前後で露出中のため、既存の評価に触れない範囲の追加のみ。',
  },
  {
    id: '20260826-en-hitachi-seaside-park-from-tokyo',
    date: '2026-08-26',
    url: '/en/hitachi-seaside-park-from-tokyo/',
    kind: 'on-page',
    change: 'titleの「(2026 Guide)」を「Train & Bus Guide」へ変更し、冒頭に東京からの経路連鎖を追加',
    queries: ['hitachi seaside park from tokyo', 'how to get to hitachi seaside park', 'hitachi seaside park train', 'hitachi seaside park bus'],
    commit: 'c08f003',
    note: '年表記の陳腐化回避と、train/busクエリとの一致。zh-tw/koのtitleは自然な表現のため変更せず。',
  },
  {
    id: '20260826-area-ushiku',
    date: '2026-08-26',
    url: '/area/ushiku/',
    kind: 'on-page',
    change: 'titleを「見どころ・食・半日コース」から「牛久大仏と牛久シャトー・半日コース」へ変更。descriptionと本文は据え置き',
    queries: ['牛久大仏', '牛久シャトー', '日本初のワイン醸造所', '高さ120mの大仏', '牛久 観光'],
    commit: 'c08f003',
    note: 'TOP10前後で表示されるのにCTR0%だったため。titleに名所名が1語も無かったのが原因の仮説。本文・URL・descriptionは無変更。計測データが出る前に翌8/27の再改善へ引き継いだため、この版単独の効果は測っていない。',
  },
  {
    id: '20260825-news-ishioka-noriai-taxi-weekend-2026',
    date: '2026-08-25',
    url: '/news/ishioka-noriai-taxi-weekend-2026/',
    kind: 'new-article',
    change: '石岡市の乗合いタクシー土日実証運行を起点に、週末の移動手段が暮らしと観光の前提になるという視点で解説',
    queries: ['石岡市 乗合いタクシー', '石岡 デマンドタクシー', '茨城 乗合タクシー 土日'],
    commit: '2b989f0',
  },
  {
    id: '20260824-news-tsukuba-personal-food-recommend-202',
    date: '2026-08-24',
    url: '/news/tsukuba-personal-food-recommend-2026/',
    kind: 'new-article',
    change: 'つくば市のパーソナルフードレコメンド実証を起点に、地域DXを行動変容まで設計する構造を解説',
    queries: ['つくば市 実証実験', 'カロミル つくば', 'パーソナルフードレコメンド'],
    commit: 'b7a6000',
  },
  {
    id: '20260823-news-ishioka-iju-fair-tokyo-2026',
    date: '2026-08-23',
    url: '/news/ishioka-iju-fair-tokyo-2026/',
    kind: 'new-article',
    change: '石岡市の3か月連続移住フェア出展を起点に、仕事を変えない移住が制度上成立するかを解説',
    queries: ['石岡市 移住', '茨城 移住 支援金', '石岡 上野 特急'],
    commit: 'ffd309c',
  },
  {
    id: '20260822-news-all',
    date: '2026-08-22',
    url: '/news/*',
    kind: 'on-page',
    change: '記事の冒頭画像を本文カラム先頭へ移動し表示幅を縮小。04見出しの固定表記を内容に合わせて可変化',
    queries: [],
    commit: 'ec7127a',
    note: '見出し固定の不具合で全記事のH2が「アクセス・駐車場・公共交通」になっていたのを是正。',
  },
  {
    id: '20260822-contact',
    date: '2026-08-22',
    url: '/contact/',
    kind: 'on-page',
    change: 'お問い合わせ内容の入力欄をフォーム幅いっぱいに拡大',
    queries: [],
    commit: 'f592c0d',
    note: 'CV導線の改善。GSCではなくGA4のgenerate_leadで見る。',
  },
  {
    id: '20260822-biz',
    date: '2026-08-22',
    url: '/biz/',
    kind: 'on-page',
    change: 'SCOPEの箇条書きで点が文字に重なっていた表示崩れを修正',
    queries: [],
    commit: '7313485',
  },
  {
    id: '20260822-news-ibaraki-kaiyo-high-school-collab-me',
    date: '2026-08-22',
    url: '/news/ibaraki-kaiyo-high-school-collab-menu-2026/',
    kind: 'new-article',
    change: '茨城県立海洋高校の実習魚を使った県庁食堂コラボを起点に、地域産業の担い手育成を扱う解説記事を公開',
    queries: ['茨城 海洋高校', '鹿島丸', 'カフェテリアひばり'],
    commit: 'fea99f2',
  },
  {
    id: '20260822-news',
    date: '2026-08-22',
    url: '/news/',
    kind: 'on-page',
    change: 'ニュース一覧をPC3列カードに統一し、上部の大きな「新着」1枚を廃止',
    queries: ['茨城 ニュース', '茨城 ニュース 解説'],
    commit: '1d6e59d',
  },
  {
    id: '20260821-site',
    date: '2026-08-21',
    url: '*',
    kind: 'on-page',
    change: '下層ページ全体のデザインを刷新（見出し・カード・余白・パンくずの共通化）',
    queries: [],
    commit: '2533320',
    note: '外部の制作（ChatGPT）による変更。TOPは対象外。順位ではなく滞在と表示崩れの有無で見る。',
  },
  {
    id: '20260820-odekake',
    date: '2026-08-20',
    url: '/odekake/',
    kind: 'new-article',
    change: 'おでかけハブを新設。自然・季節・目的・地域の4軸から既存の検証済みページへ振り分ける',
    queries: ['茨城 おでかけ', '茨城 観光', '茨城 日帰り', '茨城 穴場'],
    commit: 'd56c6ed',
    note: '狙いクエリは仮説。GSCの実クエリで置き換える。新規事実は書かず既存ページを束ねただけ。',
  },
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
