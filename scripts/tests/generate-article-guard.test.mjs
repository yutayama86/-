import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SLUG = 'guard-test-article';

function contextFile(target) {
  const dir = mkdtempSync(join(tmpdir(), 'article-guard-'));
  const path = join(dir, 'context.json');
  writeFileSync(path, JSON.stringify({ date: '2026-09-17', target, metrics: {} }));
  return path;
}

function run(args) {
  try {
    return { ok: true, stdout: execFileSync('node', ['scripts/generate-article.mjs', ...args], { encoding: 'utf-8' }) };
  } catch (error) {
    return { ok: false, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

const base = ['--category', 'shikumika', '--keyword', 'テスト キーワード', '--slug', SLUG];

test('判断ファイルなしでは記事を作らない', () => {
  const result = run([...base, '--prompt-output', join(tmpdir(), 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /--context/);
  assert.equal(existsSync(`src/content/knowledge/${SLUG}.md`), false);
});

test('既存ページの改善が選ばれた日は記事を作らない', () => {
  const context = contextFile({
    target_type: 'existing_page',
    target_path: '/knowledge/shikumika/shikumika-toha/',
    target_file: 'src/content/knowledge/shikumika-toha.md',
    editable: true,
    action_type: 'internal_links',
  });
  const result = run([...base, '--context', context, '--prompt-output', join(tmpdir(), 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /新規記事は作りません/);
});

test('計測改善の日も記事を作らない', () => {
  const context = contextFile({ target_type: 'measurement', action_type: 'measurement_fix', target_path: '' });
  const result = run([...base, '--context', context, '--prompt-output', join(tmpdir(), 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /新規記事は作りません/);
});

test('選定されたslugと違う記事は作らない', () => {
  const context = contextFile({
    target_type: 'new_article',
    target_slug: 'another-slug',
    target_category: 'shikumika',
    action_type: 'new_article',
  });
  const result = run([...base, '--context', context, '--prompt-output', join(tmpdir(), 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /一致しません/);
});

test('new_articleの日はプロンプトを作れる', () => {
  const dir = mkdtempSync(join(tmpdir(), 'article-guard-'));
  const context = contextFile({
    target_type: 'new_article',
    target_slug: SLUG,
    target_category: 'shikumika',
    action_type: 'new_article',
  });
  const promptPath = join(dir, 'prompt.md');
  const result = run([...base, '--context', context, '--prompt-output', promptPath]);
  assert.ok(result.ok, result.stderr);
  assert.ok(existsSync(promptPath));
  assert.equal(existsSync(`src/content/knowledge/${SLUG}.md`), false, '記事ファイルはまだ作らない');
});
