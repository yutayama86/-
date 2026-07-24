/**
 * 茨城県 44市町村 ＆ 5エリア区分。
 * lat/lon は地図（ノードマップ）の配置に使う概略座標。
 */

export const REGIONS = {
  kenpoku: { label: '県北', reading: 'けんぽく', color: '#17324a', note: '海と山、ものづくりの北。' },
  keno: { label: '県央', reading: 'けんおう', color: '#d8452b', note: '水戸を中心とした県のまんなか。' },
  kennan: { label: '県南', reading: 'けんなん', color: '#3f7d5a', note: 'つくばの知と、水郷のうるおい。' },
  rokko: { label: '鹿行', reading: 'ろっこう', color: '#2f6f9e', note: '鹿島灘に沿う、海と大地。' },
  kensei: { label: '県西', reading: 'けんせい', color: '#c69a3f', note: '田園ひろがる、西の玄関口。' },
} as const;

export type RegionKey = keyof typeof REGIONS;
export const REGION_ORDER: RegionKey[] = ['kenpoku', 'keno', 'kennan', 'rokko', 'kensei'];

export interface Municipality {
  slug: string;
  name: string;
  region: RegionKey;
  lat: number;
  lon: number;
}

export const MUNICIPALITIES: Municipality[] = [
  // ── 県北 ──
  { slug: 'daigo', name: '大子町', region: 'kenpoku', lat: 36.77, lon: 140.35 },
  { slug: 'hitachiomiya', name: '常陸大宮市', region: 'kenpoku', lat: 36.55, lon: 140.41 },
  { slug: 'hitachiota', name: '常陸太田市', region: 'kenpoku', lat: 36.53, lon: 140.53 },
  { slug: 'kitaibaraki', name: '北茨城市', region: 'kenpoku', lat: 36.8, lon: 140.75 },
  { slug: 'takahagi', name: '高萩市', region: 'kenpoku', lat: 36.72, lon: 140.71 },
  { slug: 'hitachi', name: '日立市', region: 'kenpoku', lat: 36.6, lon: 140.65 },
  { slug: 'naka', name: '那珂市', region: 'kenpoku', lat: 36.45, lon: 140.48 },
  { slug: 'tokai', name: '東海村', region: 'kenpoku', lat: 36.47, lon: 140.57 },
  { slug: 'hitachinaka', name: 'ひたちなか市', region: 'kenpoku', lat: 36.4, lon: 140.53 },
  // ── 県央 ──
  { slug: 'shirosato', name: '城里町', region: 'keno', lat: 36.47, lon: 140.36 },
  { slug: 'mito', name: '水戸市', region: 'keno', lat: 36.37, lon: 140.47 },
  { slug: 'kasama', name: '笠間市', region: 'keno', lat: 36.35, lon: 140.24 },
  { slug: 'ibaraki-machi', name: '茨城町', region: 'keno', lat: 36.29, lon: 140.42 },
  { slug: 'oarai', name: '大洗町', region: 'keno', lat: 36.31, lon: 140.57 },
  { slug: 'omitama', name: '小美玉市', region: 'keno', lat: 36.24, lon: 140.35 },
  // ── 県南 ──
  { slug: 'ishioka', name: '石岡市', region: 'kennan', lat: 36.19, lon: 140.29 },
  { slug: 'kasumigaura', name: 'かすみがうら市', region: 'kennan', lat: 36.15, lon: 140.24 },
  { slug: 'tsuchiura', name: '土浦市', region: 'kennan', lat: 36.08, lon: 140.2 },
  { slug: 'tsukuba', name: 'つくば市', region: 'kennan', lat: 36.08, lon: 140.11 },
  { slug: 'ami', name: '阿見町', region: 'kennan', lat: 36.03, lon: 140.25 },
  { slug: 'miho', name: '美浦村', region: 'kennan', lat: 36.0, lon: 140.3 },
  { slug: 'inashiki', name: '稲敷市', region: 'kennan', lat: 35.96, lon: 140.32 },
  { slug: 'ushiku', name: '牛久市', region: 'kennan', lat: 35.98, lon: 140.15 },
  { slug: 'tsukubamirai', name: 'つくばみらい市', region: 'kennan', lat: 35.96, lon: 140.04 },
  { slug: 'ryugasaki', name: '龍ケ崎市', region: 'kennan', lat: 35.91, lon: 140.18 },
  { slug: 'moriya', name: '守谷市', region: 'kennan', lat: 35.95, lon: 139.98 },
  { slug: 'toride', name: '取手市', region: 'kennan', lat: 35.9, lon: 140.05 },
  { slug: 'kawachi', name: '河内町', region: 'kennan', lat: 35.88, lon: 140.25 },
  { slug: 'tone', name: '利根町', region: 'kennan', lat: 35.85, lon: 140.13 },
  // ── 鹿行 ──
  { slug: 'hokota', name: '鉾田市', region: 'rokko', lat: 36.16, lon: 140.52 },
  { slug: 'namegata', name: '行方市', region: 'rokko', lat: 36.0, lon: 140.49 },
  { slug: 'itako', name: '潮来市', region: 'rokko', lat: 35.95, lon: 140.55 },
  { slug: 'kashima', name: '鹿嶋市', region: 'rokko', lat: 35.97, lon: 140.64 },
  { slug: 'kamisu', name: '神栖市', region: 'rokko', lat: 35.89, lon: 140.66 },
  // ── 県西 ──
  { slug: 'sakuragawa', name: '桜川市', region: 'kensei', lat: 36.33, lon: 140.09 },
  { slug: 'chikusei', name: '筑西市', region: 'kensei', lat: 36.31, lon: 139.98 },
  { slug: 'yuki', name: '結城市', region: 'kensei', lat: 36.31, lon: 139.88 },
  { slug: 'shimotsuma', name: '下妻市', region: 'kensei', lat: 36.18, lon: 139.96 },
  { slug: 'yachiyo', name: '八千代町', region: 'kensei', lat: 36.18, lon: 139.89 },
  { slug: 'joso', name: '常総市', region: 'kensei', lat: 36.02, lon: 139.99 },
  { slug: 'bando', name: '坂東市', region: 'kensei', lat: 36.05, lon: 139.89 },
  { slug: 'koga', name: '古河市', region: 'kensei', lat: 36.19, lon: 139.71 },
  { slug: 'goka', name: '五霞町', region: 'kensei', lat: 36.11, lon: 139.75 },
  { slug: 'sakai', name: '境町', region: 'kensei', lat: 36.11, lon: 139.8 },
];

export const MUNI_BY_SLUG = new Map(MUNICIPALITIES.map((m) => [m.slug, m]));

/** 自由記述の area 文字列（例「つくば市」）を市町村slugに正規化 */
export function areaToSlug(area?: string): string | null {
  if (!area) return null;
  const hit = MUNICIPALITIES.find((m) => area.includes(m.name) || area.includes(m.name.replace(/[市町村]$/, '')));
  return hit ? hit.slug : null;
}

export function municipalitiesByRegion(region: RegionKey): Municipality[] {
  return MUNICIPALITIES.filter((m) => m.region === region);
}

/** 地図投影用の境界（茨城県の概略bbox） */
export const MAP_BOUNDS = { lonMin: 139.66, lonMax: 140.82, latMin: 35.8, latMax: 36.86 };

/** lat/lon → SVG座標 */
export function project(lat: number, lon: number, width: number, height: number, pad = 26) {
  const { lonMin, lonMax, latMin, latMax } = MAP_BOUNDS;
  const x = pad + ((lon - lonMin) / (lonMax - lonMin)) * (width - pad * 2);
  const y = pad + ((latMax - lat) / (latMax - latMin)) * (height - pad * 2);
  return { x, y };
}
