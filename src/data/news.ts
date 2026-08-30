/**
 * ニュースのカテゴリ定義。
 *
 * label   … 画面に出す名前
 * note    … ヘッダーのプルダウンに出す1行。何が入るかを具体的に書く
 * summary … カテゴリページの導入文と meta description に使う
 *
 * キーは記事frontmatterの `category` と一対一。ここを増やすと
 * content.config.ts の enum も自動で広がるため、記事側の表記ゆれは起きない。
 * ただしカテゴリページとプルダウンには「記事が1本以上あるものだけ」を出す。
 * 空のカテゴリを並べると、中身の無いページが増えるだけになるため。
 */
export const NEWS_CATEGORIES = {
  government: {
    label: '自治体・行政',
    note: '県政と市町村の施策',
    summary: '茨城県と県内44市町村の施策、制度、予算に関する動きを、暮らしと事業への影響とともに解説します。',
  },
  tourism: {
    label: '観光',
    note: '見どころ、季節の行事、周遊',
    summary: '茨城県の観光施設、季節の行事、周遊の動きを、訪れる人と受け入れる地域の両方の視点から解説します。',
  },
  economy: {
    label: '地域経済',
    note: '産業、企業、農林水産',
    summary: '茨城県の産業、企業の動き、農林水産業の話題を、地域の雇用と事業者への影響とともに解説します。',
  },
  transport: {
    label: '交通',
    note: '鉄道、道路、空港、バス',
    summary: '茨城県の鉄道、道路、茨城空港、路線バスや乗合交通の動きを、移動する人の実際の使い勝手から解説します。',
  },
  sports: {
    label: 'スポーツ',
    note: '県内チームと大会',
    summary: '茨城県を拠点とするチームと、県内で開かれる大会の動きを、地域との関わりから解説します。',
  },
  dx: {
    label: 'DX',
    note: 'デジタル活用と自治体システム',
    summary: '茨城県内のデジタル活用、自治体システム、データ整備の動きを、住民と事業者への影響から解説します。',
  },
  startup: {
    label: 'スタートアップ',
    note: '創業と支援の制度',
    summary: '茨城県内の創業、起業支援、産学連携の動きを、使える制度と実際の条件から解説します。',
  },
  other: {
    label: '地域ニュース',
    note: '上記に収まらない動き',
    summary: '茨城県内の、他のカテゴリに収まらない動きを解説します。',
  },
} as const;

export type NewsCategoryKey = keyof typeof NEWS_CATEGORIES;
export const NEWS_CATEGORY_KEYS = Object.keys(NEWS_CATEGORIES) as [NewsCategoryKey, ...NewsCategoryKey[]];
