import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideTarget, THRESHOLDS } from '../lib/decide-target.mjs';

const article = (overrides = {}) => ({
  kind: 'knowledge',
  slug: 'sample',
  file: 'src/content/knowledge/sample.md',
  path: '/knowledge/shikumika/sample/',
  title: 'サンプル',
  category: 'shikumika',
  primaryKeyword: 'サンプル キーワード',
  internalLinks: 3,
  serviceLinks: 1,
  caseLinks: 1,
  ...overrides,
});

const searchOf = (rows) => ({
  period: { start: '2026-08-20', end: '2026-09-16' },
  rows,
  totals: rows.reduce(
    (acc, row) => ({ impressions: acc.impressions + row.impressions, clicks: acc.clicks + row.clicks }),
    { impressions: 0, clicks: 0 }
  ),
});

const ga4Of = (overrides = {}) => ({
  current: {
    period: { start: '2026-09-10', end: '2026-09-16' },
    sessions: 0,
    events: { cta_click: 0, contact_form_start: 0, generate_lead: 0, form_error: 0 },
    ...overrides.current,
  },
  topPages: overrides.topPages ?? [],
  eventsByPage: overrides.eventsByPage ?? null,
  leadLandings: overrides.leadLandings ?? [],
  attributionPeriod: { start: '2026-08-20', end: '2026-09-16' },
  breakdownError: overrides.breakdownError ?? null,
});

test('計測エラーの日は記事を触らず計測の復旧を選ぶ', () => {
  const result = decideTarget({ articles: [article()], measurementErrors: ['GA4: 403'] });
  assert.equal(result.target_type, 'measurement');
  assert.equal(result.action_type, 'measurement_fix');
  assert.equal(result.rule, 'DATA_ERROR');
  assert.equal(result.editable, false);
});

test('A: 問い合わせの入口になっている記事を最優先で強化する', () => {
  const lead = article({ slug: 'lead', path: '/knowledge/shikumika/lead/', file: 'src/content/knowledge/lead.md' });
  const other = article({ slug: 'other', path: '/knowledge/web/other/', internalLinks: 0 });
  const result = decideTarget({
    articles: [lead, other],
    search: searchOf([{ path: lead.path, impressions: 200, clicks: 1, ctr: 0.005, position: 20 }]),
    ga4: ga4Of({ leadLandings: [{ path: lead.path, leads: 2, sourceMedium: 'google / organic' }] }),
  });
  assert.equal(result.rule, 'A');
  assert.equal(result.target_type, 'existing_page');
  assert.equal(result.target_path, lead.path);
  assert.equal(result.target_file, lead.file);
  assert.equal(result.editable, true);
  assert.equal(result.action_type, 'content_rewrite');
});

test('A: 支援ページへの導線がない記事なら service_link を選ぶ', () => {
  const lead = article({ serviceLinks: 0 });
  const result = decideTarget({
    articles: [lead],
    ga4: ga4Of({ leadLandings: [{ path: lead.path, leads: 1, sourceMedium: '(direct) / (none)' }] }),
  });
  assert.equal(result.action_type, 'service_link');
});

test('B: 流入はあるがCTAが押されていない記事を選ぶ', () => {
  const page = article();
  const result = decideTarget({
    articles: [page],
    ga4: ga4Of({
      current: { sessions: 30, events: { cta_click: 1, contact_form_start: 0, generate_lead: 0, form_error: 0 } },
      topPages: [{ path: page.path, sessions: THRESHOLDS.weakCtaSessions, views: 20 }],
      eventsByPage: { [page.path]: { cta_click: 0 } },
    }),
  });
  assert.equal(result.rule, 'B');
  assert.equal(result.action_type, 'cta');
  assert.equal(result.target_path, page.path);
});

test('C: フォーム開始があるのに送信完了が0なら、問い合わせページを人が確認する', () => {
  const result = decideTarget({
    articles: [article()],
    ga4: ga4Of({
      current: { sessions: 40, events: { cta_click: 8, contact_form_start: 4, generate_lead: 0, form_error: 2 } },
    }),
  });
  assert.equal(result.rule, 'C');
  assert.equal(result.target_path, '/contact/');
  assert.equal(result.editable, false, '自動編集させない');
  assert.equal(result.target_type, 'existing_page');
});

test('D: 表示があり11〜30位の記事を選ぶ', () => {
  const page = article();
  const result = decideTarget({
    articles: [page],
    search: searchOf([{ path: page.path, impressions: 120, clicks: 3, ctr: 0.025, position: 18 }]),
    ga4: ga4Of(),
  });
  assert.equal(result.rule, 'D');
  assert.equal(result.action_type, 'content_rewrite');
});

test('E: 表示が多くCTRが低い記事は title_description を選ぶ', () => {
  const page = article();
  const result = decideTarget({
    articles: [page],
    search: searchOf([{ path: page.path, impressions: 300, clicks: 1, ctr: 0.003, position: 6 }]),
  });
  assert.equal(result.rule, 'E');
  assert.equal(result.action_type, 'title_description');
});

test('F: 内部リンクが足りない記事を選ぶ', () => {
  const thin = article({ slug: 'thin', path: '/knowledge/web/thin/', internalLinks: 1 });
  const result = decideTarget({ articles: [article(), thin], search: searchOf([]) });
  assert.equal(result.rule, 'F');
  assert.equal(result.action_type, 'internal_links');
  assert.equal(result.target_slug, 'thin');
});

test('F: 事例への導線がない記事は case_link を選ぶ', () => {
  const result = decideTarget({ articles: [article({ caseLinks: 0 })], search: searchOf([]) });
  assert.equal(result.action_type, 'case_link');
});

test('G: 改善点がなくても、検索母数が足りなければ新規記事を作らない', () => {
  const result = decideTarget({
    articles: [article()],
    search: searchOf([{ path: '/', impressions: 3, clicks: 3, ctr: 1, position: 1.7 }]),
    ga4: ga4Of(),
  });
  assert.equal(result.target_type, 'measurement');
  assert.equal(result.rule, 'MEASUREMENT');
  assert.notEqual(result.action_type, 'new_article');
});

test('G: 母数が足りていて改善点がないときだけ新規記事を選ぶ', () => {
  const result = decideTarget({
    articles: [article()],
    search: searchOf([{ path: '/', impressions: THRESHOLDS.newArticleImpressions, clicks: 5, ctr: 0.05, position: 8 }]),
    ga4: ga4Of(),
  });
  assert.equal(result.target_type, 'new_article');
  assert.equal(result.action_type, 'new_article');
});

test('同じ入力なら同じ対象を返す（判定が揺れない）', () => {
  const input = {
    articles: [article({ slug: 'a', path: '/knowledge/web/a/' }), article({ slug: 'b', path: '/knowledge/web/b/' })],
    search: searchOf([
      { path: '/knowledge/web/a/', impressions: 100, clicks: 0, ctr: 0, position: 15 },
      { path: '/knowledge/web/b/', impressions: 100, clicks: 0, ctr: 0, position: 15 },
    ]),
    ga4: ga4Of(),
  };
  const first = decideTarget(input);
  const second = decideTarget(input);
  assert.deepEqual(first, second);
  assert.equal(first.target_slug, 'a');
});

test('既存ページを選んだときは必ずファイルが決まっている', () => {
  const page = article({ internalLinks: 0 });
  const result = decideTarget({ articles: [page], search: searchOf([]) });
  assert.equal(result.target_type, 'existing_page');
  assert.ok(result.target_file, 'target_file が必要');
  assert.equal(result.target_file, page.file);
});

test('未マージのPRに含まれるページは、その日の対象にしない', () => {
  const pendingArticle = article({ slug: 'pending', path: '/knowledge/web/pending/', file: 'src/content/knowledge/pending.md', internalLinks: 0 });
  const other = article({ slug: 'other', path: '/knowledge/web/other/', file: 'src/content/knowledge/other.md', internalLinks: 1 });

  const withoutPending = decideTarget({ articles: [pendingArticle, other], search: searchOf([]) });
  assert.equal(withoutPending.target_slug, 'pending');

  const result = decideTarget({
    articles: [pendingArticle, other],
    search: searchOf([]),
    pendingFiles: ['src/content/knowledge/pending.md'],
  });
  assert.equal(result.target_slug, 'other', '未反映の変更がある対象は避ける');
});

test('判断には確度が付く', () => {
  const measured = decideTarget({
    articles: [article()],
    search: searchOf([{ path: '/knowledge/shikumika/sample/', impressions: 300, clicks: 1, ctr: 0.003, position: 6 }]),
  });
  assert.equal(measured.confidence, 'measured');

  const unavailable = decideTarget({ articles: [article()], measurementErrors: ['GA4: 500'] });
  assert.equal(unavailable.confidence, 'unavailable');

  const thin = decideTarget({ articles: [article()], search: searchOf([]) });
  assert.ok(['site-state', 'insufficient-data'].includes(thin.confidence));
});
