/**
 * 公式レポーター（アンバサダー）の登録簿。
 * 記事の frontmatter `reporter:` の表示名と name で突き合わせて、
 * 記事の著者バイライン・プロフィールページ(/reporter/[slug])・E-E-A-T用の
 * Person 構造化データに使う。「誰が実際に行ったか」を明示するのがAI検索時代の価値。
 *
 * ※権威性(Authoritativeness)の肝は「実体験・独立性・専門性」。写真・SNS・実名の
 *   経歴が入るほど強くなる。avatar/sns/credentials は実データが入り次第ここを更新。
 */
export interface Reporter {
  slug: string;
  /** 記事 frontmatter の reporter 値と一致させる表示名 */
  name: string;
  /** 肩書き（編集長／公式レポーター 等） */
  role: string;
  /** キャッチコピー（見出し下の一言） */
  title?: string;
  /** 活動開始年（例 '2026'）。表示は「2026年〜」 */
  since?: string;
  /** 主な担当エリア */
  area?: string;
  /** 得意ジャンル（表示用ラベル） */
  genres?: string[];
  /** 専門分野（ジャンルより具体的なトピック） */
  expertise?: string[];
  /** プロフィール本文 */
  bio: string;
  /** 経歴・実績・役割（権威性の裏づけ。虚偽の受賞・学歴等は書かない） */
  credentials?: string[];
  /** 取材のスタンス（独立性・一次情報主義＝信頼シグナル） */
  philosophy?: string;
  /** 顔写真URL（未設定ならイニシャル表示） */
  avatar?: string;
  sns?: { instagram?: string; x?: string; note?: string; website?: string };
  /** 公開前の非表示フラグ（本番ビルドで除外＝実在レポーターのみ公開） */
  draft?: boolean;
}

export const REPORTERS: Reporter[] = [
  {
    slug: 'yamato',
    name: '編集長 大和',
    role: '編集長',
    title: '茨城を、自分の足で。',
    since: '2026',
    area: '茨城全域',
    genres: ['グルメ', '企業・ものづくり'],
    expertise: ['ラーメン・中華そば', 'ご当地グルメ', 'ものづくり・職人取材', '地域の商い'],
    draft: true, // ※デモ用。実在レポーターに差し替えたら false に
    bio: '茨城生まれ、茨城育ち。県内を車で走り回り、店主や職人の話を聞いてまわるのがライフワーク。派手な流行より、地元で長く愛される“本物”に惹かれます。「行った人にしか書けない一次情報」にこだわり、イバトコの企画・取材・編集を統括しています。',
    credentials: [
      'イバトコ編集長 — 媒体全体の企画・取材・編集を統括',
      '茨城全域を自らの足で取材し、店主・職人に直接インタビュー',
      'グルメ／ものづくり分野を中心に一次情報を発信',
    ],
    philosophy:
      '「行った人にしか書けないことを書く」。必ず自分の足で店に通い、店主と話し、実際に食べ・体験したうえで記事にします。広告出稿の有無で評価は変えません。',
    sns: {},
  },
  {
    slug: 'mio',
    name: '公式レポーター みお',
    role: '公式レポーター',
    title: '“ふだんのいいとこ”を、体験して。',
    since: '2026',
    area: '県央（水戸・ひたちなか・大洗）',
    genres: ['暮らし', 'ビューティ', 'あそび・サウナ'],
    expertise: ['カフェ・朝市', 'リラクゼーション・サロン', 'サウナ・ととのい', '休日のおでかけ'],
    draft: true, // ※デモ用。実在レポーターに差し替えたら false に
    bio: '県央エリアを拠点に活動する公式レポーター。観光名所よりも、地元の人が日常づかいする“ふだんのいいとこ”が好き。朝市やサロン、サウナまで、暮らしのなかの「ちょっといい時間」を実際に体験してレポートしています。',
    credentials: [
      'イバトコ公式レポーター（県央エリア担当）',
      '暮らし・美容・サウナを実体験ベースでレポート',
      '生活者目線で地域の“ふだんの良さ”を発信',
    ],
    philosophy:
      '気になった場所は、まず自分で体験してから。写真も感想も、実際に足を運んで受け取ったものだけをお届けします。',
    sns: {},
  },
];

// 本番ビルドでは draft を除外（＝実在レポーターのみ公開）。dev/preview では全員表示。
const isProd = import.meta.env.PROD;
/** 公開対象のレポーター（本番では draft を除外） */
export const VISIBLE_REPORTERS = REPORTERS.filter((r) => !(isProd && r.draft));

export const REPORTER_BY_SLUG = new Map(VISIBLE_REPORTERS.map((r) => [r.slug, r]));
export const REPORTER_BY_NAME = new Map(VISIBLE_REPORTERS.map((r) => [r.name, r]));

/** 記事の reporter 表示名から公開レポーターを引く（未登録・非公開なら undefined） */
export function reporterByName(name?: string): Reporter | undefined {
  if (!name) return undefined;
  return REPORTER_BY_NAME.get(name);
}
