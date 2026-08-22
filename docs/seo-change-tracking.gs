/**
 * イバトコ｜SEO改善履歴 × Search Console 自動比較
 *
 * 既存のGA4/GSC取得処理には手を入れません。この1ファイルを追加するだけで動きます。
 * 追加されるのはシート「SEO改善履歴」1枚と、メニュー1つです。
 *
 * ── 何をするか ─────────────────────────────
 * 1. https://ibatoco.jp/seo-changes.json から「いつ・どのURLを・どう変えたか」を取得
 * 2. 変更日を起点に Search Console API で下記3期間を取得
 *      変更前 : 変更日の前日から遡って7日
 *      7日後  : 変更日の翌日から7日
 *      28日後 : 変更日の翌日から28日
 * 3. クリック・表示・CTR・掲載順位の差分を計算し、判定を書き込む
 *
 * 指標をシートに手入力しないのが要点です。GSCは約16か月分を保持しているので、
 * 過去の変更でも「変更前」を後から正しく取得できます。推測で埋める必要はありません。
 *
 * ── 準備 ───────────────────────────────
 * 1. Apps Script エディタ → サービス → 「Search Console API」を追加（識別子: Webmasters）
 * 2. 下の SITE_URL が Search Console のプロパティ表記と一致しているか確認
 *      ドメインプロパティなら 'sc-domain:ibatoco.jp'
 *      URLプレフィックスなら 'https://ibatoco.jp/'
 * 3. 保存してリロード → メニュー「SEO」→「改善履歴を更新」
 *
 * ── 注意 ───────────────────────────────
 * GSCのデータ確定には2〜3日かかります。変更直後の実行では7日後の値が埋まりません。
 * 期間が満了していない行は「計測中」と表示され、次回実行時に自動で埋まります。
 */

const SITE_URL = 'sc-domain:ibatoco.jp'; // ← プロパティ表記に合わせて変更
const CHANGES_URL = 'https://ibatoco.jp/seo-changes.json';
const SHEET_NAME = 'SEO改善履歴';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SEO')
    .addItem('改善履歴を更新', 'updateSeoChangeLog')
    .addToUi();
}

/** 日付をずらして YYYY-MM-DD を返す */
function shiftDate_(baseYmd, days) {
  const d = new Date(baseYmd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayYmd_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}

/**
 * 指定期間・指定URLのGSC実測を取る。
 * url が '*' のときはサイト全体、それ以外は該当ページに絞る。
 * queries が指定されていれば、そのクエリだけに絞った値も返す。
 */
function fetchGsc_(url, startDate, endDate, queries) {
  const filters = [];
  if (url && url !== '*') {
    if (url.slice(-1) === '*') {
      // 前方一致（例：'/news/*' → /news/ 配下すべて）。
      // ニュース記事全体のレイアウト変更など、複数ページに同時に効く変更で使う。
      filters.push({ dimension: 'page', operator: 'contains', expression: 'https://ibatoco.jp' + url.slice(0, -1) });
    } else {
      filters.push({ dimension: 'page', operator: 'equals', expression: 'https://ibatoco.jp' + url });
    }
  }
  const request = {
    startDate: startDate,
    endDate: endDate,
    dimensions: [],
    rowLimit: 1,
  };
  if (filters.length) request.dimensionFilterGroups = [{ filters: filters }];

  let overall = null;
  try {
    const res = Webmasters.Searchanalytics.query(request, SITE_URL);
    const row = res.rows && res.rows[0];
    if (row) {
      overall = {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      };
    }
  } catch (e) {
    Logger.log('GSC取得エラー: ' + e);
  }

  // 狙ったクエリだけの合算（あれば）
  let byQuery = null;
  if (queries && queries.length) {
    const qFilters = filters.concat([{
      dimension: 'query',
      operator: 'includingRegex',
      expression: queries.map(function (q) { return q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'),
    }]);
    try {
      const res2 = Webmasters.Searchanalytics.query({
        startDate: startDate,
        endDate: endDate,
        dimensions: [],
        rowLimit: 1,
        dimensionFilterGroups: [{ filters: qFilters }],
      }, SITE_URL);
      const r2 = res2.rows && res2.rows[0];
      if (r2) {
        byQuery = { clicks: r2.clicks, impressions: r2.impressions, ctr: r2.ctr, position: r2.position };
      }
    } catch (e) {
      Logger.log('クエリ絞り込み取得エラー: ' + e);
    }
  }
  return { overall: overall, byQuery: byQuery };
}

/** 判定：改善継続 / 維持 / 戻す を返す */
function judge_(before, after, rules) {
  if (!before || !after) return '基準なし';
  // 表示回数が少なすぎるときは判定しない（誤差の方が大きいため）
  if (after.impressions < rules.minImpressions) return '判定保留（表示回数が少ない）';

  const posDelta = before.position - after.position; // 正なら順位が上がった
  const clicksRatio = before.clicks > 0 ? after.clicks / before.clicks : (after.clicks > 0 ? Infinity : 1);

  if (posDelta >= rules.positionImproved || clicksRatio >= rules.clicksImprovedRatio) return '改善継続';
  if (posDelta <= -rules.positionWorsened || clicksRatio <= rules.clicksWorsenedRatio) return '要検討（戻す候補）';
  return '維持';
}

function fmt_(m, key) {
  if (!m) return '';
  if (key === 'ctr') return Math.round(m.ctr * 1000) / 10 + '%';
  if (key === 'position') return Math.round(m.position * 10) / 10;
  return m[key];
}

function updateSeoChangeLog() {
  const json = JSON.parse(UrlFetchApp.fetch(CHANGES_URL).getContentText());
  const rules = json.rules;
  const changes = json.changes;
  const today = todayYmd_();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();

  const header = [
    '変更日', 'URL', '種類', '変更内容', '対象クエリ',
    '変更前クリック', '変更前表示', '変更前CTR', '変更前順位',
    '7日後クリック', '7日後表示', '7日後CTR', '7日後順位',
    '28日後クリック', '28日後表示', '28日後CTR', '28日後順位',
    '判定(7日)', '判定(28日)', '備考', 'commit',
  ];
  sheet.appendRow(header);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#f6f2e9');
  sheet.setFrozenRows(1);

  changes.forEach(function (c) {
    const beforeEnd = shiftDate_(c.date, -1);
    const beforeStart = shiftDate_(c.date, -7);
    const d7End = shiftDate_(c.date, 7);
    const d28End = shiftDate_(c.date, 28);
    const afterStart = shiftDate_(c.date, 1);

    const before = fetchGsc_(c.url, beforeStart, beforeEnd, c.queries).overall;
    // 期間が満了していなければ取りに行かない（途中集計で誤判定しないため）
    const d7 = d7End <= today ? fetchGsc_(c.url, afterStart, d7End, c.queries).overall : null;
    const d28 = d28End <= today ? fetchGsc_(c.url, afterStart, d28End, c.queries).overall : null;

    const v7 = d7End <= today ? judge_(before, d7, rules) : '計測中';
    const v28 = d28End <= today ? judge_(before, d28, rules) : '計測中';

    sheet.appendRow([
      c.date, c.url, c.kind, c.change, (c.queries || []).join(' / '),
      fmt_(before, 'clicks'), fmt_(before, 'impressions'), fmt_(before, 'ctr'), fmt_(before, 'position'),
      fmt_(d7, 'clicks'), fmt_(d7, 'impressions'), fmt_(d7, 'ctr'), fmt_(d7, 'position'),
      fmt_(d28, 'clicks'), fmt_(d28, 'impressions'), fmt_(d28, 'ctr'), fmt_(d28, 'position'),
      v7, v28, c.note || '', c.commit,
    ]);
  });

  sheet.autoResizeColumns(1, header.length);
  SpreadsheetApp.getUi().alert(
    '更新しました：' + changes.length + '件\n\n' +
    'GSCの確定には2〜3日かかります。「計測中」の行は期間の満了後に自動で埋まります。'
  );
}

/** 週次で自動更新したい場合はこれを一度だけ実行してトリガーを作る */
function createWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'updateSeoChangeLog') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('updateSeoChangeLog').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
}
