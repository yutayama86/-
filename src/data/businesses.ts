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
 * 事業者の登録簿。**まだ空**。
 * 実在と掲載可否を確認したものから、1件ずつ足していく。
 */
export const BUSINESSES: Business[] = [];

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
