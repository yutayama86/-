/**
 * まとめ・モデルコース（/guide/[topic]）＝「地名×インテント」で検索流入を取る主砲。
 * 例：水戸 デート／茨城 雨の日。作り込んだ店舗(places/stores)・スポットへ送客する回遊ページ。
 * placeId を書けば該当店舗カードへ自動リンク（getStores() で解決）。編集部が随時追記する前提。
 */
export interface GuideStep {
  /** 目安の時間帯（任意。例「10:00」「昼」） */
  time?: string;
  title: string;
  body: string;
  /** 紐づく店舗slug（stores.csv / places の id）。あれば店舗ページへリンク */
  placeId?: string;
  /** 表示用の市町村名（placeIdが無いスポット向け） */
  area?: string;
}

export interface Guide {
  slug: string;
  /** 検索を意識したタイトル（地名×インテント） */
  title: string;
  /** 一覧・ヒーローのリード */
  lead: string;
  /** 主対象エリア（市町村スラッグ。あればエリアページへ相互リンク） */
  areaSlug?: string;
  /** アクセント色（未指定は朱） */
  accent?: string;
  /** タグ（検索・関連） */
  tags: string[];
  /** 導入文 */
  intro: string;
  steps: GuideStep[];
  publishedAt: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'mito-date',
    title: '水戸デートのモデルコース。半日で“ちょうどいい”を巡る',
    lead: '珈琲で始めて、庭園を歩き、夜はほぐれて帰る。水戸で過ごす、肩肘張らない半日デート。',
    areaSlug: 'mito',
    accent: '#d8452b',
    tags: ['水戸', 'デート', 'モデルコース', 'カフェ'],
    intro:
      '梅と歴史の街・水戸は、実は“歩いて楽しむデート”に向いた街。派手さより居心地。イバトコが実際に巡った、半日で回れる水戸デートの一例をご紹介します。',
    steps: [
      { time: '10:00', title: '路地裏の自家焙煎で一杯', body: 'まずは中心街から一本入った喫茶店へ。深煎りのブレンドと自家製プリンで、ゆっくり一日を始めましょう。', placeId: 'mito-cafe-hitohira' },
      { time: '11:30', title: '偕楽園・千波湖を散歩', body: '日本三名園のひとつ偕楽園から千波湖畔へ。四季の花と水辺の景色を眺めながら、のんびり歩けるコース。', area: '水戸市' },
      { time: '13:00', title: '地元の定食でお昼', body: '常陸秋そばと焼き魚の、まっとうな定食屋で腹ごしらえ。観光地価格ではない“地元の味”がデートのアクセントに。', placeId: 'mito-teishoku-kagari' },
      { time: '16:00', title: '締めはリラクゼーションで', body: '歩き疲れた体を、アロマトリートメントの隠れ家でほぐして。完全予約制なので、事前予約がおすすめ。', placeId: 'mito-relax-nagomi' },
    ],
    publishedAt: '2026-07-28',
  },
  {
    slug: 'ibaraki-rainy-day',
    title: '茨城・雨の日でも楽しい過ごし方。屋内で“ととのう”一日',
    lead: '雨でも大丈夫。サウナ、器めぐり、温泉宿。濡れずに満ちる、茨城の雨の日プラン。',
    accent: '#2f6f9e',
    tags: ['茨城', '雨の日', '室内', 'サウナ', '温泉'],
    intro:
      '天気が崩れても、茨城には屋内で満たされる場所がたくさん。雨音を言い訳に、いつもよりゆっくり過ごす一日はいかがでしょう。エリアをまたいで選べる“雨の日の逃げ場”を集めました。',
    steps: [
      { time: '午前', title: '森のサウナで静かにととのう', body: '筑波の林に囲まれたサウナへ。薪ストーブのセルフロウリュと井戸水の水風呂で、雨の日こそ深く整う。', placeId: 'tsukuba-sauna-mori' },
      { time: '昼', title: '笠間で作家ものの器めぐり', body: '雨の笠間は、ギャラリー日和。地元作家の笠間焼を眺めて、暮らしに迎える一点を探す時間。', placeId: 'kasama-gallery-tsuchiiro' },
      { time: '夕〜泊', title: '袋田の滝の宿でひと晩', body: '足を延ばせるなら大子へ。雨に煙る渓谷を望む温泉旅館で、露天とお酒と会席を。雨音がごちそうになる。', placeId: 'daigo-inn-takimi' },
    ],
    publishedAt: '2026-07-28',
  },
  {
    slug: 'oarai-holiday',
    title: '大洗の休日プラン。海を五感で味わう一日',
    lead: '朝どれの魚を買って、太平洋を水風呂に。海の街・大洗を、まるごと楽しむ休日。',
    areaSlug: 'oarai',
    accent: '#9a6b45',
    tags: ['大洗', '休日', '海', 'サウナ', 'グルメ'],
    intro:
      '大洗は、海がそのまま遊び場になる街。市場で鮮魚を選び、海を眺めてサウナで整う。海鮮も外気浴も、ぜんぶ“本物の海”がすぐそばにある贅沢を味わう一日プランです。',
    steps: [
      { time: '9:00', title: '港直送の鮮魚店へ', body: '朝いちばんは魚屋へ。港から直送の朝どれ鮮魚と自家製干物が並ぶ。地方発送もできるので、お土産にも。', placeId: 'oarai-fish-market-isohei' },
      { time: '13:00', title: '太平洋を水風呂にサウナ', body: '大洗海岸に面したオーシャンビューサウナ。ロウリュのあと、目の前の外気浴デッキで潮風を浴びる“ととのい”はここだけ。', placeId: 'oarai-sauna-nagisa' },
      { time: '15:30', title: '海沿いをサイクリング', body: '足を延ばして、ひたちなか方面へ。ひたち海浜公園周辺のレンタサイクルで、海風になって走る締めくくり。', placeId: 'hitachi-park-cycle' },
    ],
    publishedAt: '2026-07-28',
  },
];

export const GUIDE_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));
