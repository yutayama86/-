import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/daily-content.yml', 'utf-8');

/** ステップ単位に切り出す（YAMLパーサを持ち込まず、必要な範囲だけ読む）。 */
function step(name) {
  const blocks = workflow.split(/\n      - name: /).slice(1);
  const found = blocks.find((block) => block.startsWith(name));
  assert.ok(found, `ステップが見つかりません: ${name}`);
  return found;
}

test('新規記事の選定は target_type=new_article の日だけ動く', () => {
  const block = step('Select article topic');
  assert.match(block, /steps\.growth\.outputs\.target_type == 'new_article'/);
});

test('既存ページの改善は existing_page かつ自動編集可能な日だけ動く', () => {
  const block = step('Prepare improvement prompt');
  assert.match(block, /steps\.growth\.outputs\.target_type == 'existing_page'/);
  assert.match(block, /steps\.growth\.outputs\.editable == 'true'/);
});

test('改善の適用は、改善プロンプトを作った日だけ動く', () => {
  const block = step('Apply the improvement to the analysed page');
  assert.match(block, /steps\.improve-prompt\.outcome == 'success'/);
  assert.match(block, /steps\.inference\.outcome == 'success'/);
});

test('記事の保存は、記事プロンプトを作った日だけ動く', () => {
  const block = step('Save article publication candidate');
  assert.match(block, /steps\.article-prompt\.outcome == 'success'/);
});

test('判断は --context で後続へ渡される', () => {
  const block = step("Decide today's investment target");
  assert.match(block, /--context/);
});

test('PR作成の前に、対象一致チェックと品質検証が入る', () => {
  const matchIndex = workflow.indexOf('verify-target-match.mjs');
  const verifyIndex = workflow.indexOf('run: npm run verify');
  const prIndex = workflow.indexOf('Create or update daily pull request');
  assert.ok(matchIndex > 0 && verifyIndex > matchIndex, '一致チェックのあとに品質検証');
  assert.ok(prIndex > verifyIndex, '検証のあとにPR作成');
});

test('一致しない日は変更を捨ててPRを作らない', () => {
  const block = step('Discard rejected changes and keep the report');
  assert.match(block, /steps\.match\.outcome == 'failure'/);
  assert.match(block, /git checkout -- src/);
  assert.match(workflow, /Stop when the change does not match the analysed target/);
});
