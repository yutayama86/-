import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATE = '2026-09-17';
const LOG = `docs/seo-log/${DATE}.md`;

function contextFile(target) {
  const dir = mkdtempSync(join(tmpdir(), 'target-match-'));
  const path = join(dir, 'context.json');
  writeFileSync(path, JSON.stringify({ date: DATE, target, metrics: {} }));
  return path;
}

function run(context, changed) {
  try {
    const stdout = execFileSync('node', ['scripts/verify-target-match.mjs', '--context', context, '--changed', changed.join(',')], {
      encoding: 'utf-8',
    });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

const existingPage = {
  rule: 'F',
  target_type: 'existing_page',
  target_path: '/knowledge/shikumika/shikumika-toha/',
  target_slug: 'shikumika-toha',
  target_file: 'src/content/knowledge/shikumika-toha.md',
  editable: true,
  action_type: 'internal_links',
};

test('分析対象のファイルとログだけならPRを作れる', () => {
  const result = run(contextFile(existingPage), [LOG, existingPage.target_file]);
  assert.ok(result.ok, result.stderr);
  assert.match(result.stdout, /一致しています/);
});

test('既存ページを選んだ日に別テーマの新規記事が作られたら止める', () => {
  const result = run(contextFile(existingPage), [LOG, 'src/content/knowledge/sme-dependency-reduction.md']);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /別のページが変更されています|分析対象ではないファイル/);
});

test('既存ページの改善に加えて別ファイルも触っていたら止める', () => {
  const result = run(contextFile(existingPage), [LOG, existingPage.target_file, 'src/pages/index.astro']);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /分析対象ではないファイル|別のページ/);
});

test('計測改善の日にコンテンツが変わっていたら止める', () => {
  const context = contextFile({
    rule: 'MEASUREMENT',
    target_type: 'measurement',
    target_path: '',
    target_file: '',
    editable: false,
    action_type: 'measurement_fix',
  });
  const ok = run(context, [LOG]);
  assert.ok(ok.ok, ok.stderr);

  const ng = run(context, [LOG, 'src/content/knowledge/new-article.md']);
  assert.equal(ng.ok, false);
  assert.match(ng.stderr, /計測の改善を選んだ日/);
});

test('新規記事の日は、選定したslugのファイルだけ許可する', () => {
  const context = contextFile({
    rule: 'G',
    target_type: 'new_article',
    target_path: '',
    target_slug: 'sme-dependency-reduction',
    target_file: '',
    editable: false,
    action_type: 'new_article',
  });
  const ok = run(context, [LOG, 'src/content/knowledge/sme-dependency-reduction.md']);
  assert.ok(ok.ok, ok.stderr);

  const ng = run(context, [LOG, 'src/content/knowledge/another-topic.md']);
  assert.equal(ng.ok, false);
  assert.match(ng.stderr, /以外が変更されています|分析対象ではないファイル/);
});

test('自動編集の対象外を選んだ日は、レポートだけ許可する', () => {
  const context = contextFile({
    rule: 'C',
    target_type: 'existing_page',
    target_path: '/contact/',
    target_slug: '',
    target_file: 'src/pages/contact/index.astro',
    editable: false,
    action_type: 'cta',
  });
  const ok = run(context, [LOG]);
  assert.ok(ok.ok, ok.stderr);

  const ng = run(context, [LOG, 'src/pages/contact/index.astro']);
  assert.equal(ng.ok, false, '人が確認する対象をAIが書き換えていないか');
});


test('その日のGrowthログがなければ失敗させる', () => {
  const missingDate = '2000-01-02';
  const dir = mkdtempSync(join(tmpdir(), 'target-match-'));
  const path = join(dir, 'context.json');
  writeFileSync(
    path,
    JSON.stringify({
      date: missingDate,
      target: { rule: 'MEASUREMENT', target_type: 'measurement', target_path: '', target_file: '', editable: false, action_type: 'measurement_fix' },
      metrics: {},
    })
  );

  const result = run(path, []);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /Growthログがありません/);
});
