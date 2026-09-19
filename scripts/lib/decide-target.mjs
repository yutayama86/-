/**
 * その日に投資する対象を1つだけ決める。
 *
 * 判定は計測値だけを入力にした純関数にしてある。
 * 「分析した対象」と「実際に改善する対象」を必ず同じにするため、
 * 返り値には改善対象のパスとファイルまで含める。
 *
 * 優先順位（上から順に評価する）:
 *   A. 問い合わせにつながっている入口ページの強化
 *   B. 流入はあるがCTAが押されていないページ
 *   C. CTAは押されているがフォーム開始・送信完了に進まない導線
 *   D. 検索表示はあるが11〜30位のページ
 *   E. 検索表示はあるがCTRが低いページ
 *   F. 内部リンク・サービス/事例への導線が不足しているページ
 *   G. 新規記事（検索の母数が足りている場合のみ）
 *
 * どれにも当てはまらない場合は、記事を増やさずに計測・インデックスの改善へ回す。
 */

/** 判定のしきい値。テストと運用で同じ値を使う。 */
export const THRESHOLDS = {
  /** B: このセッション数以上あってCTAクリックが0なら、CTA導線の問題とみなす */
  weakCtaSessions: 10,
  /** C: フォーム開始がこの件数以上あって送信完了が0なら、フォーム側の問題とみなす */
  formStartWithoutLead: 3,
  /** C: CTAクリックがこの件数以上あってフォーム開始が0なら、遷移先の訴求の問題とみなす */
  ctaWithoutFormStart: 5,
  /** C: このセッション数以上あってCTAクリックが0なら、サイト全体のCTA配置を見直す */
  sessionsWithoutCta: 20,
  /** D: 11〜30位の改善を検討する最低表示回数 */
  rankingImpressions: 30,
  /** E: CTR改善を検討する最低表示回数 */
  ctrImpressions: 50,
  /** E: 低CTRとみなす基準 */
  lowCtr: 0.02,
  /** F: 記事に最低限必要なサイト内リンク数 */
  minInternalLinks: 2,
  /** G: 新規記事を許可する、サイト全体の最低表示回数（28日） */
  newArticleImpressions: 100,
};

const EXPECTED_EFFECT = {
  A: '問い合わせにつながっている入口の説得力が上がり、同じ流入でも相談数が増えやすくなる',
  B: '流入はそのままでも、CTAクリックとフォーム開始へ進む割合を改善できる',
  C: '既存の関心を取りこぼさずに、フォーム開始・送信完了まで進む割合を改善できる',
  D: '検索意図への充足度が上がり、10位以内に入る可能性がある',
  E: '同じ表示回数のままでもクリックが増える',
  F: '回遊が増え、サービス・事例ページへの到達率が上がる',
  G: '新しい検索意図で露出が増え、既存記事とのリンクで全体の評価も補える',
  MEASUREMENT: '誤ったデータや不足した母数で投資先を決めることを防げる',
  DATA_ERROR: '誤ったデータに基づく改善判断を止め、計測の信頼性を回復できる',
};

const NEXT_CHECK = {
  A: '28日後に、このページを入口とする問い合わせ数を再確認する',
  B: '7日後に、このページのCTAクリック数を再確認する',
  C: '7日後に同じファネル段階を再確認する。件数が少ない場合は28日まで観察する',
  D: '28日後に平均掲載順位を再確認する。動かなければ競合の充足度を調べる',
  E: '14日後にCTRを再確認する。改善しなければ検索意図の読み違いを疑う',
  F: '28日後に、このページからサービス・事例ページへの遷移を確認する',
  G: '公開から28日後に、表示回数と掲載順位を確認する',
  MEASUREMENT: '次回の実行時に、計測対象ページ数と表示回数が増えているかを確認する',
  DATA_ERROR: '設定修正後に再実行し、Search ConsoleとGA4の実数が取得できることを確認する',
};

const byNumberDesc = (key) => (a, b) => b[key] - a[key] || a.slug.localeCompare(b.slug);

/** 数値が取れないときに推測で埋めない。 */
const value = (input, fallback = 0) => (typeof input === 'number' && Number.isFinite(input) ? input : fallback);

/** その判断がどれだけ実測に支えられているか。推測で上げない。 */
const CONFIDENCE = { A: 'measured', B: 'measured', C: 'measured', D: 'measured', E: 'measured', F: 'site-state', G: 'measured', MEASUREMENT: 'insufficient-data', DATA_ERROR: 'unavailable' };

function decision(partial) {
  return {
    target_type: 'measurement',
    target_path: '',
    target_slug: '',
    target_category: '',
    target_file: '',
    editable: false,
    action_type: 'measurement_fix',
    focus_keyword: '',
    confidence: CONFIDENCE[partial.rule] ?? 'unknown',
    expected_effect: EXPECTED_EFFECT[partial.rule] ?? '—',
    next_check: NEXT_CHECK[partial.rule] ?? '—',
    ...partial,
  };
}

/** 記事を改善対象にするときの共通部分。 */
const fromArticle = (article, partial) =>
  decision({
    target_type: 'existing_page',
    target_path: article.path,
    target_slug: article.slug,
    target_category: article.category ?? '',
    target_file: article.file,
    editable: true,
    focus_keyword: article.primaryKeyword ?? '',
    ...partial,
  });

/**
 * @param {object} input
 * @param {Array} input.articles      記事・事例（Markdown）の一覧
 * @param {object|null} input.search  Search Console の集計（rows / totals）
 * @param {object|null} input.ga4     GA4の集計（current / topPages / eventsByPage / leadLandings）
 * @param {string[]} input.measurementErrors 計測APIのエラー
 * @param {string[]} input.editableKinds AIに自動改善させてよい種別（既定はknowledgeのみ）
 * @param {string[]} input.pendingFiles 未マージのPRに含まれ、mainへ未反映のファイル
 */
export function decideTarget({
  articles = [],
  search = null,
  ga4 = null,
  measurementErrors = [],
  editableKinds = (process.env.DAILY_EDITABLE_KINDS ?? 'knowledge').split(',').map((kind) => kind.trim()),
  pendingFiles = [],
} = {}) {
  /*
    自動改善の対象は、日次ワークフローがコミットに含める範囲と揃える。
    含まれない種別は候補から外し、毎日同じページで止まらないようにする。
  */
  const autoEditable = (article) => editableKinds.includes(article.kind ?? 'knowledge');
  /*
    未マージのPRに同じファイルの変更が残っている間は、同じ対象を選び直さない。
    同じ改善を二重に作らず、PRが積み上がるのを防ぐ。
  */
  const pending = new Set(pendingFiles);
  articles = articles.filter((article) => autoEditable(article) && !pending.has(article.file));
  const byPath = new Map(articles.map((article) => [article.path, article]));
  const searchByPath = new Map((search?.rows ?? []).map((row) => [row.path, row]));
  const eventsByPage = ga4?.eventsByPage ?? null;
  const pageStats = new Map((ga4?.topPages ?? []).map((page) => [page.path, page]));

  // 計測が壊れている日は、記事を触らずに計測の復旧を最優先にする
  if (measurementErrors.length > 0) {
    return decision({
      rule: 'DATA_ERROR',
      target_type: 'measurement',
      action_type: 'measurement_fix',
      target_path: '',
      reason: measurementErrors.join(' / '),
      action: '資格情報、閲覧権限、APIの有効化状態を確認し、実データ取得を復旧する',
    });
  }

  const eventsFor = (path) => (eventsByPage ? eventsByPage[path] ?? {} : null);

  // A. 問い合わせにつながっている入口ページ
  const leadLandings = (ga4?.leadLandings ?? [])
    .map((entry) => ({ ...entry, article: byPath.get(entry.path) }))
    .filter((entry) => entry.article && entry.leads > 0)
    .sort((a, b) => b.leads - a.leads || a.path.localeCompare(b.path));

  if (leadLandings.length > 0) {
    const { article, leads, sourceMedium } = leadLandings[0];
    const noServiceLink = value(article.serviceLinks) === 0;
    return fromArticle(article, {
      rule: 'A',
      action_type: noServiceLink ? 'service_link' : 'content_rewrite',
      reason: `このページを入口とするセッションから問い合わせが${leads}件発生しています${sourceMedium ? `（主な流入: ${sourceMedium}）` : ''}`,
      action: noServiceLink
        ? '本文から関連する支援ページへの導線を追加し、相談内容の具体例を補う'
        : '問い合わせにつながった検索意図に合わせて、判断材料（進め方・注意点・相談前の準備）を補強する',
    });
  }

  // B. 流入はあるがCTAが押されていない記事
  if (eventsByPage) {
    const weak = articles
      .map((article) => ({
        article,
        slug: article.slug,
        sessions: value(pageStats.get(article.path)?.sessions),
        ctaClicks: value(eventsFor(article.path)?.cta_click),
      }))
      .filter((item) => item.sessions >= THRESHOLDS.weakCtaSessions && item.ctaClicks === 0)
      .sort(byNumberDesc('sessions'));

    if (weak.length > 0) {
      const { article, sessions } = weak[0];
      return fromArticle(article, {
        rule: 'B',
        action_type: 'cta',
        reason: `直近7日で${sessions}セッションある一方、このページからのCTAクリックが0件です`,
        action: '本文の結論直後とまとめの後に、読者の状況に合う相談導線を置き直す',
      });
    }
  }

  // C. サイト全体のファネルの詰まり
  const events = ga4?.current?.events ?? null;
  const sessions = value(ga4?.current?.sessions);

  if (events) {
    if (
      value(events.contact_form_start) >= THRESHOLDS.formStartWithoutLead &&
      value(events.generate_lead) === 0
    ) {
      return decision({
        rule: 'C',
        target_type: 'existing_page',
        target_path: '/contact/',
        target_file: 'src/pages/contact/index.astro',
        editable: false,
        action_type: 'cta',
        reason: `直近7日でフォーム開始${events.contact_form_start}件に対し送信完了が0件です`,
        action: 'フォームの離脱項目、送信エラー、スマートフォンでの入力負荷を人が確認する',
      });
    }

    const topPath = ga4?.topPages?.[0]?.path ?? '/';
    const topArticle = byPath.get(topPath);

    if (value(events.cta_click) >= THRESHOLDS.ctaWithoutFormStart && value(events.contact_form_start) === 0) {
      const reason = `直近7日でCTAクリック${events.cta_click}件に対しフォーム開始が0件です`;
      const action = 'CTAの遷移先で、相談内容の具体例と進め方を先に示し、入力前の不安を減らす';
      return topArticle
        ? fromArticle(topArticle, { rule: 'C', action_type: 'cta', reason, action })
        : decision({
            rule: 'C',
            target_type: 'existing_page',
            target_path: topPath,
            target_file: '',
            editable: false,
            action_type: 'cta',
            reason,
            action,
          });
    }

    if (sessions >= THRESHOLDS.sessionsWithoutCta && value(events.cta_click) === 0) {
      const reason = `直近7日で${sessions}セッションある一方、CTAクリックが0件です`;
      const action = '最も見られているページの検索意図とCTAの文脈を合わせ、支援ページへの導線を明確にする';
      return topArticle
        ? fromArticle(topArticle, { rule: 'C', action_type: 'cta', reason, action })
        : decision({
            rule: 'C',
            target_type: 'existing_page',
            target_path: topPath,
            target_file: '',
            editable: false,
            action_type: 'cta',
            reason,
            action,
          });
    }
  }

  // D. 11〜30位で上位化の余地がある
  const ranking = articles
    .map((article) => ({ article, slug: article.slug, stats: searchByPath.get(article.path) }))
    .filter(
      (item) =>
        item.stats &&
        item.stats.impressions >= THRESHOLDS.rankingImpressions &&
        item.stats.position >= 11 &&
        item.stats.position <= 30
    )
    .sort((a, b) => b.stats.impressions - a.stats.impressions || a.slug.localeCompare(b.slug));

  if (ranking.length > 0) {
    const { article, stats } = ranking[0];
    return fromArticle(article, {
      rule: 'D',
      action_type: 'content_rewrite',
      reason: `表示${stats.impressions}回・平均${stats.position.toFixed(1)}位。上位化の余地があります`,
      action: '検索意図に対して不足している観点を追記し、判断基準を具体的にする',
    });
  }

  // E. 表示はあるがクリックされていない
  const lowCtr = articles
    .map((article) => ({ article, slug: article.slug, stats: searchByPath.get(article.path) }))
    .filter(
      (item) => item.stats && item.stats.impressions >= THRESHOLDS.ctrImpressions && item.stats.ctr < THRESHOLDS.lowCtr
    )
    .sort((a, b) => b.stats.impressions - a.stats.impressions || a.slug.localeCompare(b.slug));

  if (lowCtr.length > 0) {
    const { article, stats } = lowCtr[0];
    return fromArticle(article, {
      rule: 'E',
      action_type: 'title_description',
      reason: `表示${stats.impressions}回に対しCTR ${(stats.ctr * 100).toFixed(2)}%と低い状態です`,
      action: 'title と description を、検索する人の状況と得られる判断材料に寄せて書き直す',
    });
  }

  // F. サイト内の導線が不足している
  const thinLinks = articles
    .filter((article) => value(article.internalLinks) < THRESHOLDS.minInternalLinks)
    .sort((a, b) => value(a.internalLinks) - value(b.internalLinks) || a.slug.localeCompare(b.slug));

  if (thinLinks.length > 0) {
    const article = thinLinks[0];
    return fromArticle(article, {
      rule: 'F',
      action_type: 'internal_links',
      reason: `サイト内リンクが${value(article.internalLinks)}件しかなく、回遊と評価が集まりにくい状態です`,
      action: '関連する既存記事へのリンクを、文脈が合う位置に追加する',
    });
  }

  const noServiceLink = articles
    .filter((article) => value(article.serviceLinks) === 0)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  if (noServiceLink.length > 0) {
    const article = noServiceLink[0];
    return fromArticle(article, {
      rule: 'F',
      action_type: 'service_link',
      reason: '本文から支援ページへの導線がありません',
      action: '記事の内容に合う支援ページへのリンクを、読者の次の行動として自然な位置に追加する',
    });
  }

  const noCaseLink = articles
    .filter((article) => value(article.caseLinks) === 0 && article.kind !== 'case')
    .sort((a, b) => a.slug.localeCompare(b.slug));

  if (noCaseLink.length > 0) {
    const article = noCaseLink[0];
    return fromArticle(article, {
      rule: 'F',
      action_type: 'case_link',
      reason: '実際にどう仕組み化したかを示す事例への導線がありません',
      action: 'シクミベース自身の公開ケーススタディへのリンクを、根拠として自然な位置に追加する',
    });
  }

  // G. 新規記事は最後。検索の母数が足りないうちは増やさない。
  const totalImpressions = value(search?.totals?.impressions);
  if (search && totalImpressions >= THRESHOLDS.newArticleImpressions) {
    const counts = {};
    for (const article of articles) {
      if (article.category) counts[article.category] = (counts[article.category] ?? 0) + 1;
    }
    const thinCategory = Object.entries(counts)
      .filter(([, count]) => count < 2)
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0];

    return decision({
      rule: 'G',
      target_type: 'new_article',
      target_category: thinCategory ?? '',
      action_type: 'new_article',
      reason: `既存ページに優先度の高い改善点がなく、検索の母数（28日で表示${totalImpressions}回）も確保できています`,
      action: '商談に近い検索意図の記事を1本追加し、既存記事と相互にリンクする',
    });
  }

  return decision({
    rule: 'MEASUREMENT',
    target_type: 'measurement',
    action_type: 'measurement_fix',
    reason: search
      ? `28日間の表示回数が${totalImpressions}回で、投資先を数字で選べる母数がありません`
      : 'Search Consoleのデータがなく、投資先を数字で選べません',
    action:
      '未インデックスのURLの登録をリクエストし、検索以外の導線（紹介・SNS・直接案内）で既存ページへの訪問を増やす',
  });
}
