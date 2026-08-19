/**
 * 茨城県の「道の駅」16駅。
 *
 * 出典（2系統が完全一致することを確認済み）:
 *  - 茨城県｜県内の「道の駅」 https://www.pref.ibaraki.jp/doboku/doiji/kotsu/08date/date005.html
 *  - 関東「道の駅」公式      https://www.kanto-michinoeki.jp/map02.php?id_name=0
 *
 * 掲載しているのは、両方で確認できた「名称・所在市町村・路線」だけ。
 * 営業時間・定休日・施設内容・温泉の有無・車中泊可否などは各駅で運用が異なり、
 * 一次情報を確認できていないため書かない（各駅の公式で確認する導線に留める）。
 * 根拠のない順位づけ（ランキング／おすすめ順）もしない。
 */
import { MUNI_BY_SLUG, REGIONS, REGION_ORDER, type RegionKey } from './areas';

export interface MichinoEki {
  /** 登録名（県公式の表記に合わせる） */
  name: string;
  /** 所在市町村の slug（/area/<slug>/ と対応） */
  area: string;
  /** 路線名 */
  route: string;
}

export const MICHINOEKI: MichinoEki[] = [
  { name: 'かつら', area: 'shirosato', route: '国道123号' },
  { name: 'みわ', area: 'hitachiomiya', route: '国道293号' },
  { name: 'さとみ', area: 'hitachiota', route: '国道349号' },
  { name: 'さかい', area: 'sakai', route: '県道17号' },
  { name: '奥久慈だいご', area: 'daigo', route: '国道118号' },
  { name: 'しもつま', area: 'shimotsuma', route: '国道294号' },
  { name: 'たまつくり', area: 'namegata', route: '国道354号' },
  { name: 'いたこ', area: 'itako', route: '県道101号' },
  { name: 'ごか', area: 'goka', route: '国道4号' },
  { name: 'まくらがの里こが', area: 'koga', route: '国道4号' },
  { name: '日立おさかなセンター', area: 'hitachi', route: '国道245号' },
  { name: '常陸大宮', area: 'hitachiomiya', route: '国道118号' },
  { name: 'ひたちおおた', area: 'hitachiota', route: '国道349号' },
  { name: 'グランテラス筑西', area: 'chikusei', route: '国道50号' },
  { name: 'かさま', area: 'kasama', route: '国道355号' },
  { name: '常総', area: 'joso', route: '国道294号' },
];

/** 5地域ごとにまとめる（イバトコの地域区分に合わせる） */
export function michinoekiByRegion(): { region: RegionKey; label: string; note: string; items: (MichinoEki & { areaName: string })[] }[] {
  return REGION_ORDER
    .map((region) => ({
      region,
      label: REGIONS[region].label,
      note: REGIONS[region].note,
      items: MICHINOEKI
        .filter((eki) => MUNI_BY_SLUG.get(eki.area)?.region === region)
        .map((eki) => ({ ...eki, areaName: MUNI_BY_SLUG.get(eki.area)?.name ?? '' })),
    }))
    .filter((group) => group.items.length > 0);
}

/** 道の駅がある市町村の slug（重複なし） */
export function michinoekiAreaSlugs(): string[] {
  return [...new Set(MICHINOEKI.map((e) => e.area))];
}

/** ある市町村にある道の駅（市町村ページからの逆引き用） */
export function michinoekiForArea(areaSlug: string): MichinoEki[] {
  return MICHINOEKI.filter((e) => e.area === areaSlug);
}

export const MICHINOEKI_SOURCES = [
  { label: '茨城県｜県内の「道の駅」', url: 'https://www.pref.ibaraki.jp/doboku/doiji/kotsu/08date/date005.html' },
  { label: '関東「道の駅」公式ホームページ｜茨城県', url: 'https://www.kanto-michinoeki.jp/map02.php?id_name=0' },
  { label: '全国「道の駅」連絡会', url: 'https://www.michi-no-eki.jp/' },
];

export const MICHINOEKI_CHECKED_AT = '2026年8月19日';
