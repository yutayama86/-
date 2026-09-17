#!/usr/bin/env node
/**
 * 毎日の投資先を1ページだけ決めて、Daily Growth Report を出力する。
 *
 * 「分析した対象」と「実際に改善する対象」を必ず一致させるため、
 * 判定結果は後続の工程がそのまま使える形（パス・ファイル・改善タイプ）で返す。
 * 判定そのものは scripts/lib/decide-target.mjs の純関数に置いている。
 *
 * 出力:
 *   docs/seo-log/YYYY-MM-DD.md   その日の判断と根拠
 *   --context <path>             後続工程へ渡す判断と計測値（JSON）
 *   GITHUB_OUTPUT                target_type / target_path / action_type など
 *   標準出力                      Daily Growth Report
 *
 * 使い方:
 *   node scripts/daily-growth.mjs
 *   node scripts/daily-growth.mjs --dry-run              ログを書かずに表示だけ
 *   node scripts/daily-growth.mjs --context /tmp/ctx.json
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { isConfigured, fetchSearchAnalytics } from './lib/gsc.mjs';
import { isGa4Configured, fetchGa4Summary } from './lib/ga4.mjs';
import { decideTarget } from './lib/decide-target.mjs';

const CONTENT_DIRS = [
  { dir: 'src/content/knowledge', kind: 'knowledge' },
  { dir: 'src/content/case', kind: 'case' },
];
const LOG_DIR = 'docs/seo-log';
/*
  その日の判断の置き場所。後続のスクリプトは、引数がなければここを読む。
  ワークフローの書き方に依存せず、「分析した対象」を全工程が共有できるようにしている。
*/
const DEFAULT_CONTEXT = '.growth/target.json';

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const dryRun = process.argv.includes('--dry-run');
const contextPath = (() => {
  const index = process.argv.indexOf('--context');
  return index >= 0 ? process.argv[index + 1] : DEFAULT_CONTEXT;
})();

/* --- 記事の読み込み --------------------------------------------------- */

function loadArticles() {
  const articles = [];

  for (const { dir, kind } of CONTENT_DIRS) {
    if (!existsSync(dir)) continue;

    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) continue;

      const [, frontmatter, body] = match;
      const get = (key) => {
        const value = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]?.trim() ?? '';
        return value.replace(/^['"]|['"]$/g, '');
      };

      if (get('draft') === 'true') continue;

      const slug = basename(file, '.md');
      const category = get('category');
      const path = kind === 'case' ? `/case/${slug}/` : `/knowledge/${category}/${slug}/`;

      articles.push({
        kind,
        slug,
        file: join(dir, file),
        path,
        title: get('title'),
        category,
        primaryKeyword: get('primaryKeyword'),
        publishedAt: get('publishedAt'),
        updatedAt: get('updatedAt'),
        chars: body.replace(/\s/g, '').length,
        internalLinks: (body.match(/\]\(\/(knowledge|service|case|contact)\//g) ?? []).length,
        serviceLinks: (body.match(/\]\(\/service\//g) ?? []).length,
        caseLinks: (body.match(/\]\(\/case\//g) ?? []).length,
      });
    }
  }

  return articles.sort((a, b) => a.slug.localeCompare(b.slug));
}

/* --- 計測値の取得 ----------------------------------------------------- */

const articles = loadArticles();

const [searchResult, ga4Result] = await Promise.all([
  isConfigured()
    ? fetchSearchAnalytics({ dimensions: ['page'], days: 28 })
        .then((data) => ({ data }))
        .catch((error) => ({ error: error.message }))
    : Promise.resolve({ data: null }),
  isGa4Configured()
    ? fetchGa4Summary({ days: 7 })
        .then((data) => ({ data }))
        .catch((error) => ({ error: error.message }))
    : Promise.resolve({ data: null }),
]);

const searchRaw = searchResult.data ?? null;
const dataError = searchResult.error ?? null;
const ga4Data = ga4Result.data ?? null;
const ga4Error = ga4Result.error ?? null;

const measurementErrors = [];
if (isConfigured() && dataError) measurementErrors.push(`Search Console: ${dataError}`);
if (isGa4Configured() && ga4Error) measurementErrors.push(`GA4: ${ga4Error}`);

const search = searchRaw
  ? {
      period: searchRaw.period,
      rows: searchRaw.rows.map((row) => ({
        path: String(row.keys[0]).replace(/^https?:\/\/[^/]+/, ''),
        url: row.keys[0],
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        position: row.position,
      })),
      totals: searchRaw.rows.reduce(
        (acc, row) => ({
          impressions: acc.impressions + row.impressions,
          clicks: acc.clicks + row.clicks,
        }),
        { impressions: 0, clicks: 0 }
      ),
    }
  : null;

const target = decideTarget({ articles, search, ga4: ga4Data, measurementErrors });

/* --- レポート --------------------------------------------------------- */

function formatDelta(current, previous) {
  if (previous === 0) return current === 0 ? '（前期比 ±0）' : '（前期は0）';
  const value = ((current - previous) / previous) * 100;
  return `（${value > 0 ? '+' : ''}${value.toFixed(1)}%）`;
}

const lines = [];
lines.push('【シクミベース Daily Growth Report】');
lines.push('');
lines.push(`日付: ${today}`);
lines.push('');

lines.push('■ 検索結果（Search Console）');
if (search) {
  const ctr = search.totals.impressions > 0 ? (search.totals.clicks / search.totals.impressions) * 100 : 0;
  lines.push(`  集計期間: ${search.period.start} 〜 ${search.period.end}`);
  lines.push(`  表示回数: ${search.totals.impressions}`);
  lines.push(`  クリック: ${search.totals.clicks}`);
  lines.push(`  CTR: ${ctr.toFixed(2)}%`);
  lines.push(`  計測対象ページ: ${search.rows.length}`);
} else if (dataError) {
  lines.push(`  Search Console からデータを取得できませんでした: ${dataError}`);
} else {
  lines.push('  Search Console が未設定のため、サイト内の状態から判断しています。');
}
lines.push('');

lines.push('■ サイト行動・問い合わせ（GA4）');
if (ga4Data) {
  const { current, previous } = ga4Data;
  const event = current.events;
  const ctaRate = current.sessions > 0 ? (event.cta_click / current.sessions) * 100 : 0;
  const formRate = event.cta_click > 0 ? (event.contact_form_start / event.cta_click) * 100 : 0;
  const leadRate = event.contact_form_start > 0 ? (event.generate_lead / event.contact_form_start) * 100 : 0;

  lines.push(`  集計期間: ${current.period.start} 〜 ${current.period.end}（前7日比）`);
  lines.push(`  ユーザー: ${current.activeUsers} ${formatDelta(current.activeUsers, previous.activeUsers)}`);
  lines.push(`  セッション: ${current.sessions} ${formatDelta(current.sessions, previous.sessions)}`);
  lines.push(`  表示ページ数: ${current.screenPageViews} ${formatDelta(current.screenPageViews, previous.screenPageViews)}`);
  lines.push(`  CTAクリック: ${event.cta_click}（セッション比 ${ctaRate.toFixed(1)}%）`);
  lines.push(`  フォーム開始: ${event.contact_form_start}（CTA比 ${formRate.toFixed(1)}%）`);
  lines.push(`  問い合わせ完了: ${event.generate_lead}（開始比 ${leadRate.toFixed(1)}%）`);
  lines.push(`  フォームエラー: ${event.form_error}`);

  if (ga4Data.topPages.length > 0) {
    lines.push('  上位ページ:');
    for (const page of ga4Data.topPages.slice(0, 5)) {
      const pageEvents = ga4Data.eventsByPage?.[page.path];
      const ctaText = pageEvents ? ` / CTA${pageEvents.cta_click ?? 0}` : '';
      lines.push(`    ${page.path} — 表示${page.views} / セッション${page.sessions}${ctaText}`);
    }
  }

  lines.push('  問い合わせの入口ページ:');
  if (ga4Data.leadLandings === null) {
    lines.push(
      `    取得できませんでした（${ga4Data.breakdownError ?? '内訳の取得に失敗'}）。問い合わせ発生あり・LP帰属未確定として扱います。`
    );
  } else if (ga4Data.leadLandings.length === 0) {
    lines.push(
      event.generate_lead > 0
        ? `    直近${ga4Data.attributionPeriod.start}〜${ga4Data.attributionPeriod.end}では入口を特定できませんでした（問い合わせ発生あり・LP帰属未確定）。`
        : '    対象期間に問い合わせがありません。'
    );
  } else {
    for (const landing of ga4Data.leadLandings.slice(0, 5)) {
      lines.push(`    ${landing.path} — 問い合わせ${landing.leads}件 / 流入 ${landing.sourceMedium || '不明'}`);
    }
    lines.push('    ※ 問い合わせが発生したセッションの入口ページです。CTAを押したページとは限りません。');
  }
} else if (ga4Error) {
  lines.push(`  GA4からデータを取得できませんでした: ${ga4Error}`);
} else {
  lines.push('  GA4 Data APIが未設定のため、行動・問い合わせファネルは取得していません。');
}
lines.push('');

if (search && search.rows.length > 0) {
  const best = [...search.rows].sort((a, b) => b.clicks - a.clicks)[0];
  lines.push('■ 最も流入が多いページ');
  lines.push(`  ${best.url}`);
  lines.push(`  クリック${best.clicks} / 表示${best.impressions} / 平均${best.position.toFixed(1)}位`);
  lines.push('');
}

const targetLabel =
  target.target_type === 'new_article'
    ? `${target.target_category || '未定'} カテゴリの記事を1本追加`
    : target.target_type === 'measurement'
      ? '計測・インデックスの改善'
      : target.target_path;

lines.push('■ 今日の投資先');
lines.push(`  種別: ${target.target_type}`);
lines.push(`  対象: ${targetLabel}`);
if (target.target_file) lines.push(`  ファイル: ${target.target_file}${target.editable ? '' : '（自動編集の対象外・人が確認）'}`);
lines.push(`  改善タイプ: ${target.action_type}`);
lines.push(`  内容: ${target.action}`);
lines.push('');
lines.push('■ 理由');
lines.push(`  [${target.rule}] ${target.reason}`);
lines.push('');
lines.push('■ 想定効果');
lines.push(`  ${target.expected_effect}`);
lines.push('');
lines.push('■ 次の判断条件');
lines.push(`  ${target.next_check}`);

const report = lines.join('\n');
console.log(report);

/* --- 後続工程へ渡す情報 ----------------------------------------------- */

const targetSearchStats = target.target_path ? search?.rows.find((row) => row.path === target.target_path) ?? null : null;
const targetPageStats = target.target_path
  ? ga4Data?.topPages.find((page) => page.path === target.target_path) ?? null
  : null;
const targetPageEvents = target.target_path ? ga4Data?.eventsByPage?.[target.target_path] ?? null : null;

const context = {
  date: today,
  target,
  metrics: {
    search: search
      ? { period: search.period, totals: search.totals, page: targetSearchStats }
      : { period: null, totals: null, page: null },
    ga4: ga4Data
      ? {
          period: ga4Data.current.period,
          sessions: ga4Data.current.sessions,
          events: ga4Data.current.events,
          page: targetPageStats,
          pageEvents: targetPageEvents,
          leadLandings: ga4Data.leadLandings,
          attributionAvailable: ga4Data.leadLandings !== null,
        }
      : null,
  },
};

for (const path of new Set([DEFAULT_CONTEXT, contextPath].filter(Boolean))) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(context, null, 2)}\n`, 'utf-8');
}
console.log(`\n判断の根拠を保存しました: ${[...new Set([DEFAULT_CONTEXT, contextPath])].join(' / ')}`);

/* --- ログの保存 ------------------------------------------------------- */

if (!dryRun) {
  mkdirSync(LOG_DIR, { recursive: true });

  const before = (() => {
    if (target.rule === 'DATA_ERROR') return measurementErrors.join(' / ');
    if (targetSearchStats) {
      return `表示${targetSearchStats.impressions} / クリック${targetSearchStats.clicks} / CTR ${(targetSearchStats.ctr * 100).toFixed(2)}% / 平均${targetSearchStats.position.toFixed(1)}位`;
    }
    if (targetPageStats) {
      return `セッション${targetPageStats.sessions} / 表示${targetPageStats.views} / CTA${targetPageEvents?.cta_click ?? 0}`;
    }
    if (ga4Data && target.rule === 'C') {
      const event = ga4Data.current.events;
      return `セッション${ga4Data.current.sessions} / CTA${event.cta_click} / フォーム開始${event.contact_form_start} / 問い合わせ${event.generate_lead}`;
    }
    return '計測データなし';
  })();

  const log = [
    '---',
    `date: ${today}`,
    `rule: ${target.rule}`,
    `target_type: ${target.target_type}`,
    `target_path: ${target.target_path || '—'}`,
    `target_file: ${target.target_file || '—'}`,
    `action_type: ${target.action_type}`,
    `keyword: ${target.focus_keyword || '—'}`,
    `data_source: ${
      target.rule === 'DATA_ERROR'
        ? 'measurement-error'
        : search && ga4Data
          ? 'search-console+ga4'
          : ga4Data
            ? 'ga4'
            : search
              ? 'search-console'
              : 'site-state'
    }`,
    '---',
    '',
    '## dashboard',
    '```text',
    report,
    '```',
    '',
    '## action',
    target.action,
    '',
    '## reason',
    target.reason,
    '',
    '## before',
    before,
    '',
    '## expected_effect',
    target.expected_effect,
    '',
    '## next_action',
    target.next_check,
    '',
    '## result',
    '（次回以降に追記）',
    '',
  ].join('\n');

  const logPath = join(LOG_DIR, `${today}.md`);
  writeFileSync(logPath, log, 'utf-8');
  console.log(`ログを保存しました: ${logPath}`);
}

// CIのサマリに出す
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `\`\`\`\n${report}\n\`\`\`\n`, { flag: 'a' });
}

// 後続工程は、ここで決めた対象だけを触る。
if (process.env.GITHUB_OUTPUT) {
  const output = (value) => String(value ?? '').replace(/[\r\n]/g, ' ').slice(0, 500);
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `target_type=${output(target.target_type)}`,
      `target_path=${output(target.target_path)}`,
      `target_slug=${output(target.target_slug)}`,
      `target_category=${output(target.target_category)}`,
      `target_file=${output(target.target_file)}`,
      `editable=${target.editable ? 'true' : 'false'}`,
      `action_type=${output(target.action_type)}`,
      `rule=${output(target.rule)}`,
      `reason=${output(target.reason)}`,
      `focus_keyword=${output(target.focus_keyword)}`,
      `log_path=${LOG_DIR}/${today}.md`,
      `measurement_status=${measurementErrors.length > 0 ? 'error' : 'ok'}`,
      // 旧ワークフローが読む名前も出しておく（移行中の互換用）
      `focus_rule=${output(target.rule)}`,
      `focus_category=${output(target.target_category)}`,
      `focus_keyword=${output(target.focus_keyword)}`,
      '',
    ].join('\n')
  );
}

// 設定済みの計測APIが落ちた日は、サイト状態へのフォールバックを成功扱いにしない。
if (measurementErrors.length > 0) process.exitCode = 1;
