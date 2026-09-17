import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/*
  日次処理のチェーンは、まずスクリプト側（.growth/target.json）で保証している。
  ワークフローが対象を明示的に渡す形へ更新されている場合は、その分岐も検査する。
*/
const workflow = readFileSync('.github/workflows/daily-content.yml', 'utf-8');
const usesExplicitTarget = workflow.includes('verify-target-match.mjs');

function step(name) {
  const blocks = workflow.split(/\n      - name: /).slice(1);
  return blocks.find((block) => block.startsWith(name)) ?? null;
}

test('日次ワークフローは daily-growth から始まる', () => {
  assert.match(workflow, /npm run growth/);
});

test('生成 → 検証 → PR の順序が保たれている', () => {
  const inference = workflow.indexOf('infer-article.mjs');
  const verify = workflow.indexOf('npm run verify');
  const pr = workflow.indexOf('pull request');
  assert.ok(inference > 0 && verify > inference, '生成のあとに検証');
  assert.ok(pr > verify, '検証のあとにPR作成');
});

test('品質検証に対象一致チェックが含まれている', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  assert.match(pkg.scripts.verify, /audit:target/);
  assert.match(pkg.scripts['audit:target'], /verify-target-match\.mjs/);
});

test('検証に失敗した日は変更を残さない', () => {
  assert.match(workflow, /git checkout -- src|rm -- "\$article_path"/);
});

test('対象を明示的に渡すワークフローでは、分岐が対象に従う', { skip: !usesExplicitTarget }, () => {
  const topic = step('Select article topic');
  assert.ok(topic, 'ステップが見つかりません');
  assert.match(topic, /steps\.growth\.outputs\.target_type == 'new_article'/);

  const improve = step('Prepare improvement prompt');
  assert.ok(improve, 'ステップが見つかりません');
  assert.match(improve, /steps\.growth\.outputs\.target_type == 'existing_page'/);
  assert.match(improve, /steps\.growth\.outputs\.editable == 'true'/);

  assert.match(workflow, /Stop when the change does not match the analysed target/);
});
