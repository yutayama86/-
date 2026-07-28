/**
 * 公式レポーター（アンバサダー）の登録簿。
 * 記事の frontmatter `reporter:` の表示名と name で突き合わせて、
 * 記事の著者バイライン・プロフィールページ(/reporter/[slug])・E-E-A-T用の
 * Person 構造化データに使う。「誰が実際に行ったか」を明示するのがAI検索時代の価値。
 */
export interface Reporter {
  slug: string;
  /** 記事 frontmatter の reporter 値と一致させる表示名 */
  name: string;
  /** 肩書き（編集長／公式レポーター 等） */
  role: string;
  /** 主な担当エリア */
  area?: string;
  /** 得意ジャンル（表示用ラベル） */
  genres?: string[];
  /** プロフィール本文 */
  bio: string;
  /** 顔写真URL（未設定ならイニシャル表示） */
  avatar?: string;
  sns?: { instagram?: string; x?: string; note?: string; website?: string };
}

export const REPORTERS: Reporter[] = [
  {
    slug: 'yamato',
    name: '編集長 大和',
    role: '編集長',
    area: '茨城全域',
    genres: ['グルメ', '企業・ものづくり'],
    bio: '茨城生まれ、茨城育ち。県内を車で走り回り、店主や職人の話を聞いてまわるのがライフワーク。「行った人にしか書けない一次情報」にこだわって、イバトコの編集を統括しています。',
    sns: {},
  },
  {
    slug: 'mio',
    name: '公式レポーター みお',
    role: '公式レポーター',
    area: '県央（水戸・ひたちなか・大洗）',
    genres: ['暮らし', 'ビューティ', 'あそび・サウナ'],
    bio: '県央エリアを拠点に活動する公式レポーター。朝市やサロン、サウナまで、暮らしのなかの“ちょっといい時間”を実際に体験してレポートしています。',
    sns: {},
  },
];

export const REPORTER_BY_SLUG = new Map(REPORTERS.map((r) => [r.slug, r]));
export const REPORTER_BY_NAME = new Map(REPORTERS.map((r) => [r.name, r]));

/** 記事の reporter 表示名から登録レポーターを引く（未登録なら undefined） */
export function reporterByName(name?: string): Reporter | undefined {
  if (!name) return undefined;
  return REPORTER_BY_NAME.get(name);
}
