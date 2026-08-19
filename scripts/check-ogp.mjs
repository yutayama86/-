/**
 * OGP検査：sitemap掲載URLのOGP画像を一括チェックする。
 *
 *   node scripts/check-ogp.mjs           … dist/ を検査（ビルド後）
 *   node scripts/check-ogp.mjs --remote  … 本番(https://ibatoco.jp)を検査
 *
 * 検査項目：og:image / twitter:image / 画像形式 / SVG混入 / 実寸 /
 *           メタタグ宣言寸法との一致 / alt / 絶対URL / HTTPステータス
 */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const dist = join(root, 'dist');
const SITE = 'https://ibatoco.jp';
const remote = process.argv.includes('--remote');

const meta = (html, re) => html.match(re)?.[1] ?? null;
const pick = (html, prop) =>
  meta(html, new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, 'i')) ??
  meta(html, new RegExp(`<meta\\s+name="${prop}"\\s+content="([^"]*)"`, 'i'));

const sitemapXml = remote
  ? await (await fetch(`${SITE}/sitemap.xml`)).text()
  : await readFile(join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const problems = [];
const seenImages = new Map();
let checked = 0;

for (const url of urls) {
  const path = url.replace(SITE, '');
  const html = remote
    ? await (await fetch(url)).text()
    : await readFile(join(dist, path.replace(/^\//, ''), 'index.html'), 'utf8').catch(() => null);
  if (!html) { problems.push(`${path}: HTMLが読めない`); continue; }
  checked++;

  const ogImage = pick(html, 'og:image');
  const twImage = pick(html, 'twitter:image');
  const type = pick(html, 'og:image:type');
  const w = Number(pick(html, 'og:image:width'));
  const h = Number(pick(html, 'og:image:height'));
  const ogAlt = pick(html, 'og:image:alt');
  const twAlt = pick(html, 'twitter:image:alt');

  if (!ogImage) { problems.push(`${path}: og:image がない`); continue; }
  if (!ogImage.startsWith('https://')) problems.push(`${path}: og:image が絶対HTTPS URLでない (${ogImage})`);
  if (ogImage.endsWith('.svg')) problems.push(`${path}: og:image がSVG (${ogImage})`);
  if (twImage !== ogImage) problems.push(`${path}: twitter:image が og:image と不一致`);
  if (!ogAlt) problems.push(`${path}: og:image:alt がない`);
  if (!twAlt) problems.push(`${path}: twitter:image:alt がない`);
  if (!type) problems.push(`${path}: og:image:type がない`);

  const ext = ogImage.split('.').pop()?.toLowerCase();
  const expected = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }[ext ?? ''];
  if (expected && type && type !== expected) problems.push(`${path}: og:image:type が拡張子と不一致 (${type} vs ${ext})`);

  // 画像の実寸と宣言寸法の一致（同じ画像は一度だけ調べる）
  const imgPath = ogImage.replace(SITE, '');
  if (!seenImages.has(imgPath)) {
    let dim = null, status = null, ctype = null;
    if (remote) {
      const res = await fetch(ogImage);
      status = res.status; ctype = res.headers.get('content-type');
      if (res.ok) dim = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    } else {
      const buf = await readFile(join(dist, imgPath.replace(/^\//, ''))).catch(() => null);
      status = buf ? 200 : 404;
      if (buf) dim = await sharp(buf).metadata();
    }
    seenImages.set(imgPath, { dim, status, ctype });
  }
  const { dim, status, ctype } = seenImages.get(imgPath);
  if (status !== 200) problems.push(`${path}: og:image が HTTP ${status} (${imgPath})`);
  else if (dim) {
    if (dim.width !== w || dim.height !== h) {
      problems.push(`${path}: 実寸 ${dim.width}x${dim.height} と宣言 ${w}x${h} が不一致 (${imgPath})`);
    }
    if (expected && `image/${dim.format === 'jpeg' ? 'jpeg' : dim.format}` !== expected) {
      problems.push(`${path}: 実ファイル形式 ${dim.format} が og:image:type ${type} と不一致`);
    }
    if (remote && ctype && expected && !ctype.startsWith(expected)) {
      problems.push(`${path}: Content-Type ${ctype} が ${expected} と不一致`);
    }
  }
}

console.log(`検査: ${checked} ページ / 画像 ${seenImages.size} 種（${remote ? '本番' : 'dist'}）`);
if (problems.length) {
  console.error(`\n問題 ${problems.length} 件:`);
  for (const p of [...new Set(problems)]) console.error(`- ${p}`);
  process.exit(1);
}
console.log('OGP検査：問題なし');
