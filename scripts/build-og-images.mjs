/**
 * OGP画像（SNSシェア画像）を PNG で生成する。
 *
 * なぜ必要か：
 *  X / Facebook / Slack など多くのSNSは og:image の SVG を表示できない。
 *  日本語テキストもクローラ側の環境に依存させないため、ビルド前にラスタライズして
 *  1200x630 の PNG（RGB）に固定する。
 *
 * 使い方： node scripts/build-og-images.mjs
 *  - public/**\/*.og.svg（OGP用SVG）を同名の .png へ変換
 *  - 大きすぎる写真OGPは 1200x630 にトリミング
 * 出力はリポジトリにコミットする（実行時ではなくビルド前の一度きり）。
 */
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const OG_W = 1200;
const OG_H = 630;
/** キャッシュ回避のためファイル名に付ける版。SNS側の再取得を確実にする。 */
const STAMP = '20260819';

/** SVG → PNG（1200x630 固定、RGB） */
async function svgToPng(svgPath, outPath) {
  const info = await sharp(svgPath, { density: 200 })
    .resize(OG_W, OG_H, { fit: 'fill' })
    .flatten({ background: '#f6f2e9' }) // 透過を残さない（SNSで黒背景になるのを防ぐ）
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  return info;
}

/** 大きな写真 → 1200x630 に被写体中心でトリミング */
async function photoToOg(srcPath, outPath) {
  const info = await sharp(srcPath)
    .resize(OG_W, OG_H, { fit: 'cover', position: 'attention' }) // 情報量の多い領域を残す
    .jpeg({ quality: 82, chromaSubsampling: '4:4:4' })
    .toFile(outPath);
  return info;
}

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const publicDir = join(root, 'public');
const files = await walk(publicDir);

// 1) 共通OGP：og-default.svg → og-default-<STAMP>.png
const defaultSvg = join(publicDir, 'og-default.svg');
if (files.includes(defaultSvg)) {
  const out = join(publicDir, `og-default-${STAMP}.png`);
  const info = await svgToPng(defaultSvg, out);
  console.log(`共通OGP  ${basename(out)}  ${info.width}x${info.height}`);
}

// 2) ニュース記事のOGP用SVG → PNG
for (const f of files.filter((p) => p.includes(`${join('images', 'news')}`) && p.endsWith('.svg'))) {
  const out = f.replace(/\.svg$/, `-${STAMP}.png`);
  const info = await svgToPng(f, out);
  console.log(`記事OGP  ${basename(out)}  ${info.width}x${info.height}`);
}

// 3) 実寸が大きすぎる写真OGP → 1200x630
const bigPhoto = join(publicDir, 'images', 'news', 'mito-hollyhock-stadium-access.jpg');
if (files.includes(bigPhoto)) {
  const out = join(publicDir, 'images', 'news', `mito-hollyhock-stadium-access-og-${STAMP}.jpg`);
  const info = await photoToOg(bigPhoto, out);
  console.log(`写真OGP  ${basename(out)}  ${info.width}x${info.height}`);
}

console.log('完了：OGP画像はすべて 1200x630 で生成しました。');
