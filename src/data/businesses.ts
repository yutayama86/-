/**
 * 店舗・施設・観光事業者を、複数の記事から同じIDで指せるようにするための型。
 *
 * いまは登録していない。**架空の店舗を作らないため**、ここに足すのは
 * 実在を確認し、掲載可否を確認した事業者だけにする。
 *
 * なぜIDが要るか:
 *  現状、同じ店の情報が記事ごとに本文へ書かれている。営業時間が変わったとき、
 *  どの記事を直せばいいかが分からない。IDで指せれば「この事業者に触れている記事」を
 *  機械的に集められる。
 *
 * ID の付け方: <市町村slug>-<業種>-<3桁の連番>
 *   例) mito-hotel-001 / oarai-restaurant-001 / kashima-parking-001
 *   一度付けたIDは変えない（記事から参照されるため）。
 */
import type { MunicipalitySlug } from './areas';

export type BusinessCategory =
  | 'hotel'
  | 'restaurant'
  | 'cafe'
  | 'shop'
  | 'farm'
  | 'parking'
  | 'onsen'
  | 'museum'
  | 'activity'
  | 'station'
  | 'other';

export interface Business {
  /** <市町村slug>-<業種>-<連番>。付け替えない */
  id: string;
  name: string;
  municipality: MunicipalitySlug;
  category: BusinessCategory;
  /** 公式サイト。無い事業者もあるので任意 */
  officialUrl?: string;
  /** 確認した日。いつ時点の情報かを残す */
  verifiedAt?: string;
  note?: string;
}

/**
 * 事業者の登録簿。
 *
 * 入れる条件は「複数の記事から参照されていて、公式サイトで実在を確認できたもの」。
 * 候補は手で決めず、記事本文の外部リンクを数えて選んだ。
 * 主催者・観光協会・報道・チケット代理店は事業者ではないので入れない。
 */
export const BUSINESSES: Business[] = [
  {
    id: 'oarai-hotel-001',
    name: '大洗ホテル',
    municipality: 'oarai',
    category: 'hotel',
    officialUrl: 'https://www.oarai-hotel.co.jp/',
    verifiedAt: '2026-09-19',
    note: '夕食ビュッフェの記事とバスツアーの記事から参照',
  },
  {
    id: 'hokota-farm-001',
    name: '深作農園',
    municipality: 'hokota',
    category: 'farm',
    officialUrl: 'https://fukasaku.com/',
    verifiedAt: '2026-09-19',
    note: 'メロン専用サイト（fukasaku-melon.com）も併設',
  },
  {
    id: 'hitachinaka-shop-001',
    name: '那珂湊おさかな市場',
    municipality: 'hitachinaka',
    category: 'shop',
    officialUrl: 'https://www.nakaminato-osakanaichiba.jp/',
    verifiedAt: '2026-09-19',
  },
  {
    id: 'hitachinaka-activity-001',
    name: '国営ひたち海浜公園',
    municipality: 'hitachinaka',
    category: 'activity',
    officialUrl: 'https://www.hitachikaihin.jp/',
    verifiedAt: '2026-09-19',
    note: 'コキア・ネモフィラ。紅葉ページと秋のおでかけ記事から参照',
  },
];

export const BUSINESS_BY_ID: ReadonlyMap<string, Business> = new Map(
  BUSINESSES.map((b) => [b.id, b]),
);

/** ID の形が規約どおりか。登録時の取り違えを防ぐ */
export function isValidBusinessId(id: string): boolean {
  return /^[a-z-]+-[a-z]+-\d{3}$/.test(id);
}

export function businessesInMunicipality(slug: string): Business[] {
  return BUSINESSES.filter((b) => b.municipality === slug);
}
