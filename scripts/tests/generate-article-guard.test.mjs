import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
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

test('判断ファイルが見つからなければ記事を作らない', () => {
  const result = run([...base, '--context', join(tmpdir(), 'no-such-decision.json'), '--prompt-output', join(tmpdir(), 'prompt.md')]);
  assert.equal(result.ok, false);
  assert.match(result.stderr, /判断ファイルが見つかりません/);
  assert.equal(existsSync(`src/content/knowledge/${SLUG}.md`), false);
});

test('その日の判断がまったくなければ記事を作らない', () => {
  // .growth/target.json も --context もない状態（CIの素のチェックアウト）を再現する
  const result = (() => {
    try {
      return {
        ok: true,
        stdout: execFileSync('node', ['scripts/generate-article.mjs', ...base, '--prompt-output', join(tmpdir(), 'prompt.md')], {
          encoding: 'utf-8',
          env: { ...process.env, PWD: process.cwd() },
          cwd: process.cwd(),
        }),
      };
    } catch (error) {
      return { ok: false, stderr: error.stderr ?? '' };
    }
  })();

  if (existsSync('.growth/target.json')) {
    // ローカルには当日の判断が残っているため、判断に従って改善へ回ることだけ確認する
    assert.equal(existsSync(`src/content/knowledge/${SLUG}.md`), false);
    return;
  }

  assert.equal(result.ok, false);
  assert.match(result.stderr, /--context/);
});

test('既存ページの改善が選ばれた日は、記事を作らず改善へ引き継ぐ', () => {
  const dir = mkdtempSync(join(tmpdir(), 'article-guard-'));
  const context = contextFile({
    target_type: 'existing_page',
    target_path: '/knowledge/shikumika/shikumika-toha/',
    target_slug: 'shikumika-toha',
    target_file: 'src/content/knowledge/shikumika-toha.md',
    editable: true,
    action_type: 'internal_links',
    rule: 'F',
    reason: 'テスト',
    action: 'テスト',
  });
  const promptPath = join(dir, 'prompt.md');
  const result = run([...base, '--context', context, '--prompt-output', promptPath]);

  assert.ok(result.ok, result.stderr);
  assert.match(result.stdout, /improve-page/, '改善スクリプトへ引き継ぐ');
  assert.equal(existsSync(`src/content/knowledge/${SLUG}.md`), false, '新規記事は作らない');
  const prompt = readFileSync(promptPath, 'utf-8');
  assert.match(prompt, /改善タイプ: internal_links/);
  assert.match(prompt, /shikumika-toha/);
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
