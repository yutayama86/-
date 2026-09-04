/**
 * ファクトガード — 公開前に、機械で判定できる事実の誤りだけを止める。
 *
 * ここで見るのは「調べなくても矛盾が分かるもの」に限る。
 * 内容が正しいかどうかは人と一次情報の仕事で、このスクリプトの仕事ではない。
 *
 *  1. 市町村slug が44件のマスタに存在するか
 *  2. 地域区分が茨城県の公式区分と一致しているか
 *  3. 「X月Y日（曜）」の曜日が実際の曜日と合っているか
 *  4. 同じ施設名が複数の市町村に割り当てられていないか
 *  5. spots.ts（スポットのマスター）の市町村・出典・確認日がそろっているか
 *  6. spot() の参照先が、その市町村の節と 食い違っていないか
 *  7. 公開記事に出典があるか
 *
 * 使い方: node scripts/fact-guard.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFile(path.join(ROOT, p), 'utf8');
const problems = [];
const fail = (where, msg) => problems.push({ where, msg });

// ── 茨城県公式の5地域区分（2026年7月現在）─────────────────────────
// ここが唯一の正。src/data/areas.ts をこの表と突き合わせる。
const OFFICIAL_REGIONS = {
  kenpoku: '日立市 常陸太田市 高萩市 北茨城市 常陸大宮市 大子町',
  keno: '水戸市 笠間市 ひたちなか市 那珂市 小美玉市 茨城町 大洗町 城里町 東海村',
  rokko: '鹿嶋市 潮来市 神栖市 行方市 鉾田市',
  kennan: '土浦市 石岡市 龍ケ崎市 取手市 牛久市 つくば市 守谷市 稲敷市 かすみがうら市 つくばみらい市 美浦村 阿見町 河内町 利根町',
  kensei: '古河市 結城市 下妻市 常総市 筑西市 坂東市 桜川市 八千代町 五霞町 境町',
};
const REGION_JA = { kenpoku: '県北', keno: '県央', rokko: '鹿行', kennan: '県南', kensei: '県西' };

/**
 * 複数の市町村にまたがって当然のもの。
 * 特産品・季節の見出しなど、施設ではないものをここに置く。
 * 施設名をここへ足すときは、本当に複数の市町村にまたがるか一次情報で確かめること。
 */
const SHARED_NAMES = new Set([
  '春', '夏', '秋', '冬',
  'あんこう鍋', 'れんこん', '奥久慈しゃも', '奥久慈の山里', '常陸秋そば', '干し芋',
  '季節の野菜', '地の野菜', '湖の魚', '利根川の堤防', '霞ヶ浦の南岸',
  '蔵の町並みを歩く', '涸沼', '霞ヶ浦', '筑波山', '渡良瀬遊水地', '那珂川', '久慈川',
  // 牛久沼：沼の水面は全域が龍ケ崎市（観光いばらき）。ただし牛久市・つくば市・
  // 取手市・つくばみらい市に囲まれ、牛久市側のほとりにも記述する理由がある。
  // 牛久市のガイドでは「沼そのものは龍ケ崎市」と明記すること。
  '牛久沼',
]);

// ── 1・2. 市町村マスタと地域区分 ───────────────────────────────
const areasSrc = await read('src/data/areas.ts');
const master = new Map(); // 市町村名 -> { slug, region }
for (const m of areasSrc.matchAll(/\{ slug: '([^']+)', name: '([^']+)', region: '([^']+)'/g)) {
  master.set(m[2], { slug: m[1], region: m[3] });
}
const validSlugs = new Set([...master.values()].map((v) => v.slug));

const want = new Map();
for (const [region, names] of Object.entries(OFFICIAL_REGIONS)) {
  for (const n of names.split(' ')) want.set(n, region);
}
for (const [name, region] of want) {
  const got = master.get(name);
  if (!got) fail('areas.ts', `公式の44市町村にある「${name}」がマスタに無い`);
  else if (got.region !== region) {
    fail('areas.ts', `${name} の地域区分が違う（マスタ=${REGION_JA[got.region]} / 公式=${REGION_JA[region]}）`);
  }
}
for (const name of master.keys()) {
  if (!want.has(name)) fail('areas.ts', `公式の44市町村に無い「${name}」がマスタにある`);
}

// ── 3. 日付と曜日 ────────────────────────────────────────────
const WD = '月火水木金土日';
const DATE_RE = /(?:令和(\d+)年|(\d{4})年)?\s*(\d{1,2})月(\d{1,2})日\s*[（(]\s*([月火水木金土日])\s*[)）]/g;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(rel)));
    else if (/\.(md|ts|astro)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const contentFiles = [...(await walk('src/content')), ...(await walk('src/data'))];
for (const file of contentFiles) {
  const txt = await read(file);
  const pub = txt.match(/pubDate:\s*(\d{4})/);
  const defaultYear = pub ? Number(pub[1]) : null;
  txt.split('\n').forEach((line, idx) => {
    for (const m of line.matchAll(DATE_RE)) {
      const [, reiwa, ad, mo, dy, wd] = m;
      const year = reiwa ? 2018 + Number(reiwa) : ad ? Number(ad) : defaultYear;
      if (!year) continue; // 年が分からないものは判定しない
      const d = new Date(Date.UTC(year, Number(mo) - 1, Number(dy)));
      if (d.getUTCMonth() !== Number(mo) - 1) {
        fail(`${file}:${idx + 1}`, `存在しない日付「${m[0]}」`);
        continue;
      }
      const actual = WD[(d.getUTCDay() + 6) % 7];
      if (actual !== wd) {
        fail(`${file}:${idx + 1}`, `「${m[0]}」の曜日が違う（${year}-${mo}-${dy} は ${actual}曜）`);
      }
    }
  });
}

// ── 4. 同じ施設名が複数の市町村にあるか ────────────────────────
const byName = new Map(); // 名称 -> Set<slug>
function collect(txt, nameRe, label) {
  let cur = null;
  for (const line of txt.split('\n')) {
    const sec = line.match(/^ {2}'?([a-z-]+)'?:\s*\{/);
    if (sec) { cur = sec[1]; continue; }
    if (!cur || !validSlugs.has(cur)) continue;
    for (const m of line.matchAll(nameRe)) {
      const nm = m[1];
      if (SHARED_NAMES.has(nm)) continue;
      if (!byName.has(nm)) byName.set(nm, new Set());
      byName.get(nm).add(cur);
    }
  }
  return label;
}
collect(await read('src/data/municipality-content.ts'), /\{ name: '([^']+)'/g, 'municipality-content');
collect(await read('src/data/area-guides.ts'), /\{ title: '([^']+)'/g, 'area-guides');
for (const m of (await read('src/data/themes.ts')).matchAll(/name: '([^']+)', area: '[^']+', areaSlug: '([^']+)'/g)) {
  if (SHARED_NAMES.has(m[1])) continue;
  if (!byName.has(m[1])) byName.set(m[1], new Set());
  byName.get(m[1]).add(m[2]);
}
for (const [nm, slugs] of byName) {
  if (slugs.size > 1) {
    fail('施設と市町村', `「${nm}」が複数の市町村にある（${[...slugs].join(', ')}）。所在地を一次情報で確かめ、正しい市町村へ寄せるか、複数にまたがるなら SHARED_NAMES へ追加する`);
  }
}

// ── 4b. スポットマスターの検査 ────────────────────────────────
// spots.ts は施設と市町村の対応の唯一の正。ここが崩れると全ページに波及する。
const spotsSrc = await read('src/data/spots.ts');
const spotEntries = [...spotsSrc.matchAll(/\{ slug: '([^']+)',(.*?) \},$/gm)].map(([, slug, rest]) => {
  const pick = (k) => rest.match(new RegExp(`${k}: '([^']*)'`))?.[1];
  const list = (k) => {
    const raw = rest.match(new RegExp(`${k}: \\[([^\\]]*)\\]`))?.[1];
    return raw ? [...raw.matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
  };
  return { slug, name: pick('name'), aka: pick('aka'), municipality: pick('municipality'),
    alsoIn: list('alsoIn'), mentionedIn: list('mentionedIn'),
    sourceUrl: pick('sourceUrl'), verifiedAt: pick('verifiedAt') };
});
const seenSlug = new Set();
for (const s of spotEntries) {
  if (seenSlug.has(s.slug)) fail('spots.ts', `slug が重複している: ${s.slug}`);
  seenSlug.add(s.slug);
  if (!validSlugs.has(s.municipality)) fail('spots.ts', `${s.name}: 市町村slugが44件に無い（${s.municipality}）`);
  if (!s.sourceUrl) fail('spots.ts', `${s.name}: sourceUrl が無い。何を見て確認したかを必ず残す`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.verifiedAt ?? '')) fail('spots.ts', `${s.name}: verifiedAt が YYYY-MM-DD でない`);
}
const spotMuni = new Map(spotEntries.map((s) => [s.slug, s.municipality]));

// municipality-content.ts の spot('slug', ...) が、その市町村の節に置かれているか
{
  const src = await read('src/data/municipality-content.ts');
  let cur = null;
  src.split('\n').forEach((line, i) => {
    const sec = line.match(/^ {2}'?([a-z-]+)'?:\s*\{/);
    if (sec) { cur = sec[1]; return; }
    const m = line.match(/spot\('([^']+)'/);
    if (!m || !cur) return;
    const owner = spotMuni.get(m[1]);
    if (!owner) fail(`municipality-content.ts:${i + 1}`, `spots.ts に無いスポット: ${m[1]}`);
    else if (owner !== cur) {
      fail(`municipality-content.ts:${i + 1}`, `${m[1]} は spots.ts では ${owner} のスポット。${cur} の節に置かれている`);
    }
  });
}

// area-guides.ts / themes.ts でも、マスターにある施設名が
// 別の市町村の節に出ていないかを見る。ネーブルパークはここにも載っていた。
{
  const byName = new Map();
  for (const s of spotEntries) {
    for (const n of [s.name, s.aka].filter(Boolean)) byName.set(n, s);
  }
  const scan = (src, re, label) => {
    let cur = null;
    src.split('\n').forEach((line, i) => {
      const sec = line.match(/^ {2}'?([a-z-]+)'?:\s*\{/);
      if (sec) { cur = sec[1]; return; }
      if (!cur || !validSlugs.has(cur)) return;
      for (const m of line.matchAll(re)) {
        const s = byName.get(m[1]);
        if (!s) continue;
        const allowed = [s.municipality, ...(s.alsoIn ?? []), ...(s.mentionedIn ?? [])];
        if (!allowed.includes(cur)) {
          fail(`${label}:${i + 1}`, `「${m[1]}」は spots.ts では ${s.municipality} のスポット。${cur} の節に出ている`);
        }
      }
    });
  };
  scan(await read('src/data/area-guides.ts'), /\{ title: '([^']+)'/g, 'area-guides.ts');
  scan(await read('src/data/area-guides.ts'), /place: '([^']+)'/g, 'area-guides.ts');
}

// ── 5. 公開記事の出典 ─────────────────────────────────────────
// 記事の municipalities は content.config.ts が z.enum(municipalitySlugs) で
// 検証しているため、ここでは見ない。二重に持つと、片方だけ直して食い違う。
for (const file of contentFiles.filter((f) => f.startsWith('src/content') && f.endsWith('.md'))) {
  if (path.basename(file).startsWith('_')) continue;
  const fm = (await read(file)).split('---')[1] ?? '';
  if (/^draft:\s*false/m.test(fm) && !/sourceUrls:/.test(fm)) {
    fail(file, '公開記事なのに sourceUrls が無い');
  }
}

// ── 結果 ────────────────────────────────────────────────────
if (problems.length === 0) {
  console.log('ファクトガード通過：地域区分・日付と曜日・施設の市町村・出典に矛盾なし');
  process.exit(0);
}
console.error(`ファクトガードで ${problems.length} 件の矛盾が見つかりました\n`);
for (const p of problems) console.error(`  ${p.where}\n    ${p.msg}`);
process.exit(1);
