# GA4日次集計の整合性修正

## 原因

既存の `GA4_流入元` は `sessionDefaultChannelGroup` と `sessionSourceMedium` を同じレポートに入れ、さらに日次・流入元・LPの各表でユーザー指標とセッション指標を一緒に比較していた。

- `activeUsers` は複数のチャネルやLPを利用した同一ユーザーを各行で数えるため、行合計は日次ユーザー数と一致しない。
- セッション分析でも、チャネルと参照元を同じ表で扱うと分析時に同じセッションを「チャネル別」「参照元別」の両方から足してしまいやすい。
- 前日分は処理・分類が後から補正されることがあり、詳細表と日次表の取得タイミング差も小規模データでは目立つ。

## 修正方針

分析表を以下に分け、合計比較には `sessions` だけを使う。

1. `GA4_日次`: 日付だけ
2. `GA4_チャネル`: 日付 + `sessionDefaultChannelGroup`
3. `GA4_参照元`: 日付 + `sessionSourceMedium`
4. `GA4_ランディングページ`: 日付 + `landingPagePlusQueryString`
5. `GA4_整合性`: 日次セッションと各詳細表のセッション行合計を照合

`activeUsers` は各表の行を見る参考値として残してよいが、詳細表の行合計を日次ユーザー数として扱わない。

## Apps Script差し替えコード

既存の `fetchGa4Channels` を削除し、以下の関数を追加する。`runDailySeoReport` では `fetchGa4Channels` の代わりに3つの関数を呼び、GA4取得後に整合性チェックを実行する。

```javascript
function fetchGa4Channels(startDate, endDate) {
  fetchGa4SessionBreakdown(
    'GA4_チャネル', startDate, endDate,
    'sessionDefaultChannelGroup', 'チャネル'
  );
}

function fetchGa4Sources(startDate, endDate) {
  fetchGa4SessionBreakdown(
    'GA4_参照元', startDate, endDate,
    'sessionSourceMedium', '参照元／メディア'
  );
}

function fetchGa4LandingPages(startDate, endDate) {
  fetchGa4SessionBreakdown(
    'GA4_ランディングページ', startDate, endDate,
    'landingPagePlusQueryString', 'ランディングページ'
  );
}

function fetchGa4SessionBreakdown(
  sheetName, startDate, endDate, dimensionName, dimensionLabel
) {
  const request = AnalyticsData.newRunReportRequest();
  request.dateRanges = [{ startDate, endDate }];
  request.dimensions = [{ name: 'date' }, { name: dimensionName }];
  request.metrics = [
    { name: 'sessions' },
    { name: 'engagedSessions' },
    { name: 'keyEvents' },
    { name: 'activeUsers' },
  ];
  request.orderBys = [
    { dimension: { dimensionName: 'date' } },
    { metric: { metricName: 'sessions' }, desc: true },
  ];
  request.limit = 10000;

  const response = AnalyticsData.Properties.runReport(
    request, `properties/${CONFIG.GA4_PROPERTY_ID}`
  );
  writeGa4Response(sheetName, response, [
    '日付', dimensionLabel, 'セッション',
    'エンゲージメントセッション', 'キーイベント',
    'アクティブユーザー（行別・合計不可）',
  ]);
  formatDateColumn(sheetName);
}

function validateGa4SessionTotals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const daily = sessionMapFromSheet_(ss.getSheetByName('GA4_日次'), 1, 3);
  const details = [
    ['チャネル', 'GA4_チャネル'],
    ['参照元', 'GA4_参照元'],
    ['ランディングページ', 'GA4_ランディングページ'],
  ];
  const rows = [['日付', '比較対象', '日次セッション', '詳細行合計', '差', '判定']];

  details.forEach(([label, sheetName]) => {
    const detail = sessionMapFromSheet_(ss.getSheetByName(sheetName), 1, 3);
    Object.keys(daily).sort().forEach((date) => {
      const expected = daily[date] || 0;
      const actual = detail[date] || 0;
      const diff = actual - expected;
      rows.push([date, label, expected, actual, diff, diff === 0 ? '一致' : '要確認']);
    });
  });

  overwriteSheet('GA4_整合性', rows[0], rows.slice(1));
  formatDateColumn('GA4_整合性');
}

function sessionMapFromSheet_(sheet, dateColumn, sessionColumn) {
  if (!sheet || sheet.getLastRow() < 2) return {};
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return values.reduce((result, row) => {
    const rawDate = row[dateColumn - 1];
    const date = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, CONFIG.TIME_ZONE, 'yyyy-MM-dd')
      : String(rawDate).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
    result[date] = (result[date] || 0) + Number(row[sessionColumn - 1] || 0);
    return result;
  }, {});
}
```

メイン処理のGA4部分は次の順にする。

```javascript
fetchGa4Daily(startDate, endDate);
fetchGa4Channels(startDate, endDate);
fetchGa4Sources(startDate, endDate);
fetchGa4LandingPages(startDate, endDate);
validateGa4SessionTotals();
```

## 分析ルール

- セッション総数: `GA4_日次` を正とする。
- チャネル構成: `GA4_チャネル` だけを使い、`GA4_参照元` と合算しない。
- 参照元分析: `GA4_参照元` を使う。
- LP分析: `GA4_ランディングページ` を使う。
- ユーザー総数: `GA4_日次` の `activeUsers` を使う。詳細表の `activeUsers` は合算しない。
- `GA4_整合性` が「要確認」の日は、分類遅延・データしきい値・API応答メタデータを確認し、構成比を確定値として扱わない。
