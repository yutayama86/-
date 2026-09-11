/**
 * OG画像のフォントに無い文字を、公開前に見つける。
 *
 * OG画像はビルド時にPNGへ焼くので、フォントに無い文字は豆腐（□）になる。
 * 画像は生成に成功するし、HTTPも200で返るため、リンク切れの検査では出てこない。
 * 実際、全角縦線「｜」が ShipporiMincho-Bold に無く、25記事のOG画像で
 * 豆腐になったまま公開されていた（SNSのシェア画像にもそのまま出ていた）。
 *
 * ここでは記事タイトルを1文字ずつフォントのcmapと突き合わせる。
 * /og/ の見出しは Mincho、説明は Gothic で描くので、それぞれ別に見る。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TITLE_FONT = 'src/assets/fonts/ShipporiMincho-Bold.ttf';
const DESC_FONT = 'src/assets/fonts/ZenKakuGothicNew-Medium.ttf';

/** og/[...route].ts が見出しに掛けている置換。ここと必ず同じにする */
const TITLE_REPLACEMENTS = { '｜': '／' };

/** TrueType の cmap から、収録されているコードポイントの集合を作る */
function glyphSet(path) {
  const d = readFileSync(path);
  let cmapOff = null;
  const numTables = d.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    if (d.toString('ascii', o, o + 4) === 'cmap') cmapOff = d.readUInt32BE(o + 8);
  }
  if (cmapOff === null) throw new Error(`cmap が無い: ${path}`);

  let sub = null;
  const n = d.readUInt16BE(cmapOff + 2);
  for (let i = 0; i < n; i++) {
    const p = cmapOff + 4 + i * 8;
    const pid = d.readUInt16BE(p);
    const eid = d.readUInt16BE(p + 2);
    const off = d.readUInt32BE(p + 4);
    // Unicode BMP / full range のサブテーブルを採る（後勝ちで広いほうを拾う）
    if ((pid === 3 && (eid === 1 || eid === 10)) || (pid === 0 && (eid === 3 || eid === 4))) {
      sub = cmapOff + off;
    }
  }
  if (sub === null) throw new Error(`Unicode cmap が無い: ${path}`);

  const set = new Set();
  const format = d.readUInt16BE(sub);
  if (format === 4) {
    const segCount = d.readUInt16BE(sub + 6) / 2;
    for (let i = 0; i < segCount; i++) {
      const end = d.readUInt16BE(sub + 14 + i * 2);
      const start = d.readUInt16BE(sub + 16 + segCount * 2 + i * 2);
      if (start === 0xffff) continue;
      for (let c = start; c <= Math.min(end, 0xffff); c++) set.add(c);
    }
  } else if (format === 12) {
    const groups = d.readUInt32BE(sub + 12);
    for (let i = 0; i < groups; i++) {
      const p = sub + 16 + i * 12;
      const start = d.readUInt32BE(p);
      const end = d.readUInt32BE(p + 4);
      for (let c = start; c <= end; c++) set.add(c);
    }
  } else {
    throw new Error(`未対応の cmap format ${format}: ${path}`);
  }
  return set;
}

function titlesOf(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md') || name.startsWith('_')) continue;
    const body = readFileSync(join(dir, name), 'utf8');
    const fm = body.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    if (/^draft:\s*true\s*$/m.test(fm[1])) continue;
    const t = fm[1].match(/^title:\s*"(.*)"\s*$/m);
    if (t) out.push({ file: `${dir}/${name}`, title: t[1] });
  }
  return out;
}

const titleGlyphs = glyphSet(TITLE_FONT);
const items = [...titlesOf('src/content/news'), ...titlesOf('src/content/events')];

const problems = [];
for (const { file, title } of items) {
  // 生成側と同じ置換を掛けたうえで確認する
  const shown = [...title].map((c) => TITLE_REPLACEMENTS[c] ?? c).join('');
  const missing = [...new Set([...shown])].filter((c) => !titleGlyphs.has(c.codePointAt(0)));
  if (missing.length) problems.push({ file, title, missing });
}

if (problems.length) {
  console.error(`OG画像の見出しで豆腐になる文字があります（${problems.length}件）`);
  for (const p of problems) {
    const chars = p.missing.map((c) => `${c} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ');
    console.error(`- ${p.file}\n    ${chars}\n    ${p.title}`);
  }
  console.error(`\n${TITLE_FONT} に無い文字です。`);
  console.error('タイトルの表記を変えるか、src/pages/og/[...route].ts の OG_TITLE_REPLACEMENTS と');
  console.error('このスクリプトの TITLE_REPLACEMENTS に、同じ置換を両方へ足してください。');
  process.exit(1);
}

console.log(`OG画像の文字チェック: ${items.length}記事すべてフォントに収録されています`);
console.log(`  見出し: ${TITLE_FONT}（${titleGlyphs.size}字）／説明: ${DESC_FONT}`);
