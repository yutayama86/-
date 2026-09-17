#!/usr/bin/env node
/**
 * 「分析した対象」と「実際に変更したファイル」が一致しているかを確認する。
 *
 * 別テーマの新規記事が生成された、対象外のファイルが変わった、
 * といったズレをPR作成前に止めるためのガード。
 *
 * 使い方:
 *   node scripts/verify-target-match.mjs --context ctx.json
 *   node scripts/verify-target-match.mjs --context ctx.json --changed "a.md,b.md"
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : null;
}

const contextPath = arg('context');
if (!contextPath || !existsSync(contextPath)) {
  console.error('使い方: node scripts/verify-target-match.mjs --context <path> [--changed "<file>,<file>"]');
  process.exit(1);
}

const { target, date } = JSON.parse(readFileSync(contextPath, 'utf-8'));

const changedInput = arg('changed');
const changed = (
  changedInput !== null
    ? changedInput.split(',')
    : execSync('git status --porcelain', { encoding: 'utf-8' })
        .split('\n')
        .map((line) => line.slice(3))
)
  .map((file) => file.trim())
  .filter(Boolean);

const logPath = `docs/seo-log/${date}.md`;
const problems = [];

/** その日に触ってよいファイル。 */
const allowed = new Set([logPath]);
if (target.target_type === 'existing_page' && target.editable && target.target_file) {
  allowed.add(target.target_file);
}
if (target.target_type === 'new_article' && target.target_slug) {
  allowed.add(`src/content/knowledge/${target.target_slug}.md`);
}

const contentChanges = changed.filter((file) => file.startsWith('src/'));

for (const file of changed) {
  if (!allowed.has(file)) {
    problems.push(`分析対象ではないファイルが変更されています: ${file}`);
  }
}

if (target.target_type === 'existing_page' && target.editable) {
  const newArticles = contentChanges.filter((file) => file !== target.target_file);
  if (newArticles.length > 0) {
    problems.push(
      `既存ページ（${target.target_path}）の改善を選んだのに、別のページが変更されています: ${newArticles.join(' / ')}`
    );
  }
}

if (target.target_type === 'measurement' && contentChanges.length > 0) {
  problems.push(`計測の改善を選んだ日にコンテンツが変更されています: ${contentChanges.join(' / ')}`);
}

if (target.target_type === 'new_article' && target.target_slug) {
  const expected = `src/content/knowledge/${target.target_slug}.md`;
  const unexpected = contentChanges.filter((file) => file !== expected);
  if (unexpected.length > 0) {
    problems.push(`選定した新規記事（${expected}）以外が変更されています: ${unexpected.join(' / ')}`);
  }
}

console.log('■ 対象一致チェック');
console.log(`  判定: ${target.rule} / ${target.target_type} / ${target.action_type}`);
console.log(`  分析対象: ${target.target_path || target.target_category || '—'}`);
console.log(`  変更ファイル: ${changed.length > 0 ? changed.join(' / ') : '（なし）'}`);

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log('  ✓ 分析対象と変更ファイルが一致しています');
