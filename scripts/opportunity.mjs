/**
 * 「記事はあるのに、送客先が無い」地域×テーマを洗い出す。
 *
 * これは営業候補のリストになる。
 * 読者がその地域・その意図で記事を読んでいるのに、紹介できる店や施設が無い
 * ＝ その地域の事業者にとって、載る価値が最も高い場所ということ。
 *
 * **検索流入のデータは使っていない。** GSCへアクセスできないため、
 * ここで見ているのは「記事の本数」と「商業意図」と「登録済み事業者の数」だけ。
 * 流入の裏付けはGSCを見てから足すこと（いまの順位は推測しない）。
 *
 * 使い方: node scripts/opportunity.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MUNI_RE = /^municipalities:\s*\n((?:\s*-\s*\S+\s*\n)+)/m;
const INTENT_RE = /^businessIntent:\s*\n((?:\s{2}\w+:\s*true\s*\n)+)/m;

/** 市町村slug → 表示名。areas.ts から取り出す（TSを実行しない） */
const areasSrc = readFileSync('src/data/areas.ts', 'utf8');
const MUNI_NAME = new Map(
  [...areasSrc.matchAll(/\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'([^']+)'/g)]
    .map((m) => [m[1], { name: m[2], region: m[3] }]),
);

/** 登録済みの事業者を市町村ごとに数える */
const bizSrc = readFileSync('src/data/businesses.ts', 'utf8');
const registry = bizSrc.slice(bizSrc.indexOf('export const BUSINESSES'));
const bizByMuni = new Map();
for (const m of registry.matchAll(/municipality:\s*'([^']+)'/g)) {
  bizByMuni.set(m[1], (bizByMuni.get(m[1]) ?? 0) + 1);
}

/** 記事を読み、市町村 × 意図 の組み合わせを数える */
const cells = new Map(); // "muni|intent" -> { articles: [] }
let articlesWithIntent = 0;

for (const dir of ['src/content/news', 'src/content/events']) {
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const raw = readFileSync(join(dir, file), 'utf8');
    if (/^draft:\s*true/m.test(raw)) continue;
    if (!/^reviewed:\s*true/m.test(raw)) continue;

    const munis = (raw.match(MUNI_RE)?.[1] ?? '')
      .split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
    const intents = [...(raw.match(INTENT_RE)?.[1] ?? '').matchAll(/(\w+):\s*true/g)].map((m) => m[1]);
    if (intents.length === 0) continue;
    articlesWithIntent++;

    const title = raw.match(/^title:\s*"(.+)"/m)?.[1] ?? file;
    for (const muni of munis) {
      for (const intent of intents) {
        const key = `${muni}|${intent}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(title);
      }
    }
  }
}

const INTENT_LABEL = {
  booking: '予約', accommodation: '宿泊', parking: '駐車場',
  food: '食', experience: '体験', businessLead: '事業者向け',
};

const rows = [...cells.entries()]
  .map(([key, titles]) => {
    const [muni, intent] = key.split('|');
    const info = MUNI_NAME.get(muni);
    return {
      muni, intent,
      name: info?.name ?? muni,
      region: info?.region ?? '?',
      articles: titles.length,
      titles,
      businesses: bizByMuni.get(muni) ?? 0,
    };
  })
  // 事業者向けの記事は送客先の話ではないので候補から外す
  .filter((r) => r.intent !== 'businessLead')
  .sort((a, b) => (b.articles - b.businesses) - (a.articles - a.businesses) || b.articles - a.articles);

console.log(`商業意図が設定されている記事：${articlesWithIntent}本`);
console.log(`地域 × 意図 の組み合わせ：${rows.length}通り\n`);

const gaps = rows.filter((r) => r.businesses === 0);
console.log(`── 送客先が1件も無い組み合わせ（営業候補）：${gaps.length}件 ──`);
for (const r of gaps.slice(0, 15)) {
  console.log(`  ${r.name} × ${INTENT_LABEL[r.intent] ?? r.intent}　記事${r.articles}本・登録事業者0件`);
  console.log(`      ${r.titles[0].slice(0, 46)}`);
}

const covered = rows.filter((r) => r.businesses > 0);
if (covered.length) {
  console.log(`\n── 送客先がある組み合わせ：${covered.length}件 ──`);
  for (const r of covered.slice(0, 8)) {
    console.log(`  ${r.name} × ${INTENT_LABEL[r.intent] ?? r.intent}　記事${r.articles}本・登録事業者${r.businesses}件`);
  }
}

console.log('\n※ 検索流入は見ていない（GSCへアクセスできないため）。');
console.log('   実際に読まれているかはGSCで確認してから営業に使うこと。');
