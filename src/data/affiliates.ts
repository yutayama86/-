/**
 * 外部の予約・購入サイトへ出すリンクの提供元と、提携（アフィリエイト）の状態。
 *
 * 方針:
 *  - **提携していないものを「広告」として出さない。** status が 'active' の提供元だけ、
 *    affiliateUrl でリンクを書き換え、画面に広告表示を出す。
 *  - 提携IDや報酬条件をここに推測で書かない。契約後に、本人が status と affiliateUrl を入れる。
 *  - 未提携のあいだは通常の公式リンクとして動く。切り替えても記事側の記述は変わらない。
 *  - 掲載順は報酬の高さで決めない。順番は記事の booking.items の並び（公式の一次情報を先に置く）。
 *
 * 提携後にやること（本人の作業）:
 *  1. 各ASP・プログラムへ申請し、承認を得る（docs/MONETIZATION.md に申請先と必要情報）
 *  2. ここの status を 'active' にし、affiliateUrl に「渡されたURLを広告リンクへ変える関数」を書く
 *  3. `npm run verify` を通してから公開する。公開後にクリックが計測されることを確認する
 */

export type AffiliateStatus =
  /** 申請していない */
  | 'none'
  /** 申請済み・審査中 */
  | 'applied'
  /** 提携成立。広告リンクとして扱う */
  | 'active';

export interface LinkProvider {
  id: string;
  /** 画面に出す提供元の名前 */
  name: string;
  status: AffiliateStatus;
  /** 提携先（ASP名など）。未提携のあいだは候補を書いておく */
  network?: string;
  /** 申請日・審査の状況など、運用のメモ */
  note?: string;
  /**
   * 提携後に、通常URLを広告リンクへ変える関数。status が 'active' のときだけ使う。
   * 例：(url) => `https://example-asp.com/click?id=XXXX&url=${encodeURIComponent(url)}`
   */
  affiliateUrl?: (url: string) => string;
}

export const LINK_PROVIDERS: Record<string, LinkProvider> = {
  official: {
    id: 'official',
    name: '公式サイト',
    status: 'none',
    note: '施設・自治体・観光協会などの一次情報。広告ではない',
  },
  'rakuten-travel': {
    id: 'rakuten-travel',
    name: '楽天トラベル',
    status: 'none',
    network: '未提携（候補：楽天アフィリエイト、バリューコマース）',
  },
  jalan: {
    id: 'jalan',
    name: 'じゃらんnet',
    status: 'none',
    network: '未提携（候補：リクルートかんたんアフィリエイト、バリューコマース）',
  },
  'cn-playguide': {
    id: 'cn-playguide',
    name: 'CNプレイガイド',
    status: 'none',
    note: '大会公式のチケット受付先。広告ではない',
  },
  akippa: {
    id: 'akippa',
    name: 'akippa',
    status: 'none',
    network: '未提携（候補：A8.net、バリューコマース）',
    note: 'クラブ公式が案内している予約制駐車場サービス',
  },
  eplus: {
    id: 'eplus',
    name: 'イープラス',
    status: 'none',
    note: '大会公式のチケット受付先。広告ではない',
  },
};

export function providerName(id: string): string {
  return LINK_PROVIDERS[id]?.name ?? id;
}

/** 提携が成立している提供元だけ、広告リンクへ書き換える */
export function outboundHref(id: string, url: string): string {
  const provider = LINK_PROVIDERS[id];
  if (!provider || provider.status !== 'active' || !provider.affiliateUrl) return url;
  return provider.affiliateUrl(url);
}

/** その提供元へのリンクが広告（成果報酬あり）かどうか */
export function isPaidLink(id: string): boolean {
  return LINK_PROVIDERS[id]?.status === 'active';
}

/** ひとつでも広告リンクを含むなら、画面に広告表示を出す */
export function hasPaidLink(ids: string[]): boolean {
  return ids.some(isPaidLink);
}

/** GA4へ送る提携状態。集計時に「未提携のまま押されている」ことが分かるようにする */
export function partnerStatus(id: string): AffiliateStatus {
  return LINK_PROVIDERS[id]?.status ?? 'none';
}
