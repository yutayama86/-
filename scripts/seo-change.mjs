/**
 * SEO改善履歴にエントリを追加する。
 *
 *   npm run seo:log -- --url /news/foo/ --kind on-page --change "titleを改善" --queries "茨城 道の駅,道の駅 かさま"
 *
 * 手で src/data/seo-changes.ts を編集してもよいが、これを使うと
 *  - id と日付が自動で入る（付け忘れ・重複を防ぐ）
 *  - 直近のコミットハッシュが根拠として記録される
 *  - 指標欄を作らない（数値はGSCから取るという設計を崩さない）
 *
 * 引数なしで実行すると現在の履歴を一覧表示する。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const FILE = join(root, 'src/data/seo-changes.ts');
const KINDS = ['new-article', 'on-page', 'technical', 'internal-link', 'ogp'];

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const src = await readFile(FILE, 'utf8');

// 引数なし＝一覧表示
if (args.length === 0) {
  const rows = [...src.matchAll(/id: '([^']+)',\s*\n\s*date: '([^']+)',\s*\n\s*url: '([^']+)',\s*\n\s*kind: '([^']+)',\s*\n\s*change: '([^']+)'/g)];
  console.log(`SEO改善履歴 ${rows.length} 件（新しい順）\n`);
  for (const [, id, date, url, kind, change] of rows) {
    console.log(`  ${date}  ${kind.padEnd(13)} ${url}`);
    console.log(`            ${change}`);
  }
  console.log('\n追加: npm run seo:log -- --url <URL> --kind <種類> --change "<変更内容>" [--queries "a,b"] [--note "…"]');
  console.log(`種類: ${KINDS.join(' / ')}`);
  process.exit(0);
}

const url = arg('url');
const kind = arg('kind');
const change = arg('change');
const queries = (arg('queries') ?? '').split(',').map((q) => q.trim()).filter(Boolean);
const note = arg('note');

if (!url || !kind || !change) {
  console.error('必須: --url --kind --change');
  console.error(`--kind は ${KINDS.join(' / ')} のいずれか`);
  process.exit(1);
}
if (!KINDS.includes(kind)) {
  console.error(`--kind が不正です: ${kind}\n使えるのは ${KINDS.join(' / ')}`);
  process.exit(1);
}
if (!url.startsWith('/') && url !== '*') {
  console.error("--url は '/' 始まりのパスか、サイト全体を表す '*' で指定してください");
  process.exit(1);
}

const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD
const slug = (url === '*' ? 'site' : url.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')).slice(0, 40);
const id = `${date.replaceAll('-', '')}-${slug}`;
if (src.includes(`id: '${id}'`)) {
  console.error(`同じidが既にあります: ${id}\n同日・同URLの変更は1件にまとめるか、手でidを調整してください。`);
  process.exit(1);
}

let commit = 'uncommitted';
try { commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch {}

const esc = (s) => s.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
const entry = [
  '  {',
  `    id: '${id}',`,
  `    date: '${date}',`,
  `    url: '${esc(url)}',`,
  `    kind: '${kind}',`,
  `    change: '${esc(change)}',`,
  `    queries: [${queries.map((q) => `'${esc(q)}'`).join(', ')}],`,
  `    commit: '${commit}',`,
  ...(note ? [`    note: '${esc(note)}',`] : []),
  '  },',
].join('\n');

const anchor = 'export const SEO_CHANGES: SeoChange[] = [\n';
if (!src.includes(anchor)) {
  console.error('SEO_CHANGES の定義が見つかりませんでした。src/data/seo-changes.ts を確認してください。');
  process.exit(1);
}
await writeFile(FILE, src.replace(anchor, anchor + entry + '\n'));

console.log('追加しました:');
console.log(entry);
console.log(`\n※ 指標は入れません。変更日 ${date} を起点に、Apps Script が GSC から`);
console.log('   変更前7日 / 変更後7日 / 変更後28日 を自動で取り直します。');
