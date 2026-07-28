import type { Loader } from 'astro/loaders';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * 店舗の「無料一括掲載」用CSVローダー（＝供給エンジンの初手）。
 * src/data/stores.csv を読み、1行=1店舗として stores コレクションに流し込みます。
 * 大量の無料掲載ページをビルド時に量産する用途。手書きの作り込み店舗は
 * src/content/places/*.md（places コレクション）側で管理し、両者は getStores() で統合します。
 *
 * CSV仕様：1行目はヘッダー。features は「｜」または「|」区切り。値内にカンマを含む場合は
 * ダブルクオートで囲む（"..."）。空セルは未設定（optional）として扱います。
 */
export function csvStoresLoader(path: string): Loader {
  return {
    name: 'csv-stores',
    load: async ({ store, parseData, logger }) => {
      if (!existsSync(path)) {
        logger.warn(`stores.csv が見つかりません（${path}）。無料掲載0件として続行します。`);
        store.clear();
        return;
      }
      const raw = await readFile(path, 'utf-8');
      const rows = parseCsv(raw);
      store.clear();
      let n = 0;
      for (const row of rows) {
        const slug = (row.slug ?? '').trim();
        if (!slug) continue; // slug必須（URLになる）
        const features = (row.features ?? '')
          .split(/[｜|]/)
          .map((f) => f.trim())
          .filter(Boolean);
        const raw2: Record<string, unknown> = {
          name: row.name?.trim(),
          category: row.category?.trim(),
          tagline: row.tagline?.trim() || row.name?.trim(),
          description: row.description?.trim() || `${row.area?.trim() ?? ''}の${row.name?.trim() ?? ''}。`,
          area: row.area?.trim(),
          features,
          plan: (row.plan?.trim() || 'free'),
        };
        // 任意項目は値があるときだけ渡す（空文字でzod optionalを汚さない）
        for (const key of ['kana', 'address', 'access', 'hours', 'holiday', 'tel', 'budget', 'website', 'instagram', 'map', 'cover', 'publishedAt'] as const) {
          const v = row[key]?.trim();
          if (v) raw2[key] = v;
        }
        const data = await parseData({ id: slug, data: raw2 });
        store.set({ id: slug, data });
        n++;
      }
      logger.info(`無料掲載店舗（CSV）を ${n} 件読み込みました。`);
    },
  };
}

/** 依存を増やさない最小CSVパーサ（RFC4180準拠：クオート/エスケープ/改行対応）。 */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // BOM除去
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      record.push(field);
      field = '';
      // 空行はスキップ
      if (record.length > 1 || record[0] !== '') rows.push(record);
      record = [];
    } else {
      field += c;
    }
  }
  // 末尾（改行なしで終わる場合）
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.length > 1 || record[0] !== '') rows.push(record);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? '';
    });
    return obj;
  });
}
