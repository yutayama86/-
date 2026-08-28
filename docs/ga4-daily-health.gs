/**
 * GA4 日次ヘルスチェック（イバトコ）
 *
 * 目的：SEO施策の成果を判定できる状態か、計測側を毎日自動で見張る。
 *   エンゲージメント率が0のまま、Unassignedが大半、といった異常を
 *   人が気づく前にシートへ落とす。
 *
 * 既存の seo-change-tracking.gs（Search Console）には手を入れない。
 * この1ファイルを別スクリプトとして追加するだけで動く。
 *
 * ─────────────────────────────────────────────
 * 準備
 * 1. 下の PROPERTY_ID に GA4の「プロパティID（数字）」を入れる。
 *    測定ID（G-2DNYX7CSK6）ではない。GA4管理画面 > プロパティ設定 の先頭にある数字。
 * 2. appsscript.json に読み取りスコープを足す：
 *      "oauthScopes": [
 *        "https://www.googleapis.com/auth/script.external_request",
 *        "https://www.googleapis.com/auth/spreadsheets",
 *        "https://www.googleapis.com/auth/analytics.readonly"
 *      ]
 *    （GA4 Data API は Apps Script の「サービス」に無いため REST で叩く。
 *      Search Console API が一覧から消えたのと同じ事情。）
 * 3. メニュー「イバトコ計測」から「日次トリガーを作成」を一度実行する。
 * ─────────────────────────────────────────────
 */

const PROPERTY_ID = '';           // ← 数字のプロパティIDを入れる（例: '123456789'）
const SHEET_NAME = 'GA4日次';

/**
 * 何日前を取りに行くか。
 * GA4は当日・前日のデータが確定しておらず、エンゲージメントやチャネルは
 * 後から埋まる。前日を見て「0だ」と判断すると誤診するので、既定で2日前を集計する。
 */
const LAG_DAYS = 2;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('イバトコ計測')
    .addItem('昨日までを取り込む', 'backfillRecentDays')
    .addItem('日次トリガーを作成', 'createDailyTrigger')
    .addToUi();
}

function ymd_(d) {
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function daysAgo_(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd_(d);
}

/** GA4 Data API を REST で叩く。失敗時は本文ごと投げて原因を追えるようにする。 */
function runReport_(body) {
  if (!PROPERTY_ID) throw new Error('PROPERTY_ID が未設定です。GA4のプロパティID（数字）を入れてください。');
  const res = UrlFetchApp.fetch(
    'https://analyticsdata.googleapis.com/v1beta/properties/' + PROPERTY_ID + ':runReport',
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: JSON.stringify(body),
      muteHttpExceptions: true,
    }
  );
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error('GA4 Data API ' + code + ': ' + text);
  return JSON.parse(text);
}

/** 指標だけをまとめて取る（ディメンションなし）。 */
function totals_(date) {
  const r = runReport_({
    dateRanges: [{ startDate: date, endDate: date }],
    metrics: [
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'engagementRate' },
      { name: 'activeUsers' },
      { name: 'keyEvents' },
      { name: 'averageSessionDuration' },
    ],
  });
  const row = (r.rows && r.rows[0]) ? r.rows[0].metricValues.map(function (m) { return m.value; }) : ['0','0','0','0','0','0'];
  return {
    sessions: Number(row[0]),
    engagedSessions: Number(row[1]),
    engagementRate: Number(row[2]),
    activeUsers: Number(row[3]),
    keyEvents: Number(row[4]),
    avgDuration: Number(row[5]),
  };
}

/** ディメンション別のセッション数を { 値: セッション数 } で返す。 */
function byDimension_(date, dimension) {
  const r = runReport_({
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: dimension }],
    metrics: [{ name: 'sessions' }],
    limit: 100,
  });
  const out = {};
  (r.rows || []).forEach(function (row) {
    out[row.dimensionValues[0].value] = Number(row.metricValues[0].value);
  });
  return out;
}

function pick_(map, key) { return map[key] || 0; }
function sum_(map) {
  return Object.keys(map).reduce(function (a, k) { return a + map[k]; }, 0);
}
function ratio_(part, whole) { return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0; }

/** 1日分を集計して1行にまとめる。 */
function collectDay_(date) {
  const t = totals_(date);
  const channel = byDimension_(date, 'sessionDefaultChannelGroup');
  const source = byDimension_(date, 'sessionSource');

  // 自前の分類（BrandBase.astro の config で送っているイベントスコープの
  // カスタムディメンション）。未登録・未計測なら空になるだけで落ちない。
  let trafficKind = {};
  let aiSource = {};
  try { trafficKind = byDimension_(date, 'customEvent:traffic_kind'); } catch (e) {}
  try { aiSource = byDimension_(date, 'customEvent:ai_source'); } catch (e) {}

  const chTotal = sum_(channel);

  return [
    date,
    t.activeUsers,
    t.sessions,
    t.engagedSessions,
    Math.round(t.engagementRate * 1000) / 10,     // %
    Math.round(t.avgDuration),                    // 秒
    t.keyEvents,
    pick_(channel, 'Organic Search'),
    pick_(channel, 'Direct'),
    pick_(channel, 'Referral'),
    pick_(channel, 'AI Assistant'),
    pick_(channel, 'Unassigned'),
    ratio_(pick_(channel, 'Unassigned'), chTotal),  // Unassigned比率 %
    pick_(source, '(not set)'),
    ratio_(pick_(source, '(not set)'), sum_(source)), // (not set)比率 %
    pick_(source, 'chatgpt.com'),
    pick_(trafficKind, 'ai_referral'),
    pick_(trafficKind, 'search'),
    pick_(trafficKind, 'direct'),
    pick_(trafficKind, 'other_referral'),
    JSON.stringify(aiSource),
    diagnose_(t, channel, chTotal),
  ];
}

/**
 * 数字から異常の当たりをつける。断定はせず、次に見る場所だけ書く。
 * 「0件だから壊れている」と決めつけないよう、母数が小さいときは判定しない。
 */
function diagnose_(t, channel, chTotal) {
  const notes = [];
  if (t.sessions === 0) return 'セッション0。計測されていないか、まだ処理中';
  if (t.sessions >= 20 && t.engagedSessions === 0) {
    notes.push('エンゲージ0件。自動ブラウザ流入か、GA4の処理待ちを疑う');
  } else if (t.sessions >= 20 && t.engagementRate < 0.1) {
    notes.push('エンゲージ率10%未満');
  }
  if (chTotal > 0 && ratio_(pick_(channel, 'Unassigned'), chTotal) >= 30) {
    notes.push('Unassignedが3割超');
  }
  return notes.length ? notes.join(' / ') : '';
}

const HEADERS = [
  '日付', 'アクティブユーザー', 'セッション', 'エンゲージsession', 'エンゲージ率%',
  '平均セッション秒', 'キーイベント',
  'Organic Search', 'Direct', 'Referral', 'AI Assistant', 'Unassigned', 'Unassigned比率%',
  'source=(not set)', '(not set)比率%', 'source=chatgpt.com',
  'traffic_kind=ai_referral', 'traffic_kind=search', 'traffic_kind=direct', 'traffic_kind=other_referral',
  'ai_source内訳', '所見',
];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** 同じ日付の行があれば更新、無ければ追記。何度流しても二重にならない。 */
function upsert_(sh, row) {
  const dates = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getDisplayValues().map(function (r) { return r[0]; });
  const idx = dates.indexOf(row[0]);
  if (idx >= 0) sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
}

/** 日次トリガーから呼ばれる本体。 */
function collectGa4Daily() {
  const sh = sheet_();
  upsert_(sh, collectDay_(daysAgo_(LAG_DAYS)));
}

/** 直近14日ぶんを取り直す（初回や、取りこぼしの復旧用）。 */
function backfillRecentDays() {
  const sh = sheet_();
  for (let i = LAG_DAYS; i <= LAG_DAYS + 13; i++) {
    try { upsert_(sh, collectDay_(daysAgo_(i))); } catch (e) { Logger.log(daysAgo_(i) + ': ' + e); }
  }
  try { SpreadsheetApp.getUi().alert('取り込みが終わりました。'); } catch (e) { Logger.log('取り込み完了'); }
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'collectGa4Daily') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('collectGa4Daily').timeBased().everyDays(1).atHour(9).create();
  try { SpreadsheetApp.getUi().alert('毎日9時台に集計する日次トリガーを作成しました。'); } catch (e) { Logger.log('日次トリガー作成'); }
}
