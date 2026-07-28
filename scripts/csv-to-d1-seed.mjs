// stores.csv → D1(SQLite) 用の seed SQL を生成する。
//   node scripts/csv-to-d1-seed.mjs
// 出力: db/seed-stores.sql（stores への INSERT。既存idは置換）
// これで「無料一括掲載CSV」がそのまま Phase2 のDBへ移行できる＝供給エンジンとDBの接続。
//
// areas.ts / content.config.ts の静的データも municipalities / categories として seed する。

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- 最小CSVパーサ（src/loaders/csv-stores.ts と同等）----
function parseCsv(text) {
  const rows = [];
  let field = '', record = [], inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      record.push(field); field = '';
      if (record.length > 1 || record[0] !== '') rows.push(record);
      record = [];
    } else field += c;
  }
  if (field !== '' || record.length > 0) { record.push(field); if (record.length > 1 || record[0] !== '') rows.push(record); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const sqlStr = (v) => (v == null || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

// ---- 市町村・ジャンルの seed（areas.ts / content.config.ts から素朴に抽出）----
function extractMunicipalities() {
  const txt = readFileSync(resolve(root, 'src/data/areas.ts'), 'utf-8');
  const re = /\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'([^']+)',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)\s*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(txt))) out.push({ slug: m[1], name: m[2], region: m[3], lat: m[4], lng: m[5] });
  return out;
}
function extractCategories() {
  const txt = readFileSync(resolve(root, 'src/content.config.ts'), 'utf-8');
  const block = txt.slice(txt.indexOf('CATEGORIES = {'), txt.indexOf('} as const;'));
  const re = /'?([a-z-]+)'?:\s*\{\s*label:\s*'([^']+)',[^}]*accent:\s*'([^']+)'/g;
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push({ key: m[1], label: m[2], accent: m[3] });
  return out;
}

const munis = extractMunicipalities();
const cats = extractCategories();
const areaToSlug = (area) => {
  if (!area) return null;
  const hit = munis.find((m) => area.includes(m.name) || area.includes(m.name.replace(/[市町村]$/, '')));
  return hit ? hit.slug : null;
};

// ---- stores.csv ----
const csv = parseCsv(readFileSync(resolve(root, 'src/data/stores.csv'), 'utf-8'));

const lines = [];
lines.push('-- 自動生成: scripts/csv-to-d1-seed.mjs（手で編集しない）');
lines.push('PRAGMA foreign_keys = ON;');
lines.push('BEGIN TRANSACTION;');

lines.push('\n-- municipalities');
for (const m of munis) {
  lines.push(
    `INSERT INTO municipalities (slug,name,region,lat,lng) VALUES (${sqlStr(m.slug)},${sqlStr(m.name)},${sqlStr(m.region)},${m.lat},${m.lng})` +
      ' ON CONFLICT(slug) DO UPDATE SET name=excluded.name,region=excluded.region,lat=excluded.lat,lng=excluded.lng;'
  );
}

lines.push('\n-- categories');
for (const c of cats) {
  lines.push(
    `INSERT INTO categories (key,label,accent) VALUES (${sqlStr(c.key)},${sqlStr(c.label)},${sqlStr(c.accent)})` +
      ' ON CONFLICT(key) DO UPDATE SET label=excluded.label,accent=excluded.accent;'
  );
}

lines.push('\n-- stores（無料一括掲載CSV）');
let n = 0;
for (const row of csv) {
  if (!row.slug) continue;
  const features = (row.features ?? '').split(/[｜|]/).map((f) => f.trim()).filter(Boolean);
  const cols = {
    id: row.slug,
    name: row.name,
    kana: row.kana,
    category_key: row.category,
    muni_slug: areaToSlug(row.area),
    area: row.area,
    tagline: row.tagline || row.name,
    description: row.description,
    address: row.address,
    access: row.access,
    hours: row.hours,
    holiday: row.holiday,
    tel: row.tel,
    budget: row.budget,
    features: JSON.stringify(features),
    website: row.website,
    instagram: row.instagram,
    map_url: row.map,
    plan: row.plan || 'free',
    source: 'csv',
    published_at: row.publishedAt,
  };
  const keys = Object.keys(cols);
  const vals = keys.map((k) => sqlStr(cols[k])).join(',');
  const upd = keys.filter((k) => k !== 'id').map((k) => `${k}=excluded.${k}`).join(',');
  lines.push(
    `INSERT INTO stores (${keys.join(',')}) VALUES (${vals}) ON CONFLICT(id) DO UPDATE SET ${upd},updated_at=datetime('now');`
  );
  n++;
}

lines.push('COMMIT;');

const outPath = resolve(root, 'db/seed-stores.sql');
writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');
console.log(`db/seed-stores.sql を生成しました（市町村 ${munis.length}／ジャンル ${cats.length}／店舗 ${n}）。`);
