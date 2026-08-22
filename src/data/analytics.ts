/**
 * GA4計測の対象判定と、流入元の分類。
 *
 * 設計方針：
 *  - **推測で分類しない。** referrer か utm_source で発信元が特定できたものだけを
 *    AI流入として数える。referrer が無い流入（Direct）と、GA4が source を
 *    決められなかった `(not set)` は AI に寄せない。
 *  - google.com / bing.com / duckduckgo.com は AI に含めない。
 *    AI Overviews や Bing のチャット結果からの流入は、通常の検索流入と
 *    同じ referrer で届くため、クライアント側で区別できないため。
 *  - 除外は「確実に自分だと分かる条件」だけで行う。IPやUser-Agentからの
 *    推測除外はしない（第三者を誤って除外するリスクがあるため）。
 */

/** 運営者自身のアクセスを除外するフラグの保存先（そのブラウザにのみ効く） */
export const GA_OPTOUT_KEY = 'ibatoco_ga_optout';

/** `?ga-optout=1` で除外を有効化、`?ga-optout=0` で解除 */
export const GA_OPTOUT_PARAM = 'ga-optout';

/**
 * AI流入と判定するホスト名。
 * キーは referrer / utm_source のホスト名（完全一致、またはサブドメイン一致）。
 * 値はGA4に送る識別子。
 */
export const AI_REFERRAL_HOSTS: Record<string, string> = {
  // OpenAI
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'openai.com': 'chatgpt',
  // Anthropic
  'claude.ai': 'claude',
  'claude.com': 'claude',
  // Perplexity
  'perplexity.ai': 'perplexity',
  // Google Gemini（検索の google.com とは別ホスト）
  'gemini.google.com': 'gemini',
  'bard.google.com': 'gemini',
  // Microsoft Copilot（検索の bing.com とは別ホスト）
  'copilot.microsoft.com': 'copilot',
  'm365.cloud.microsoft': 'copilot',
  // その他
  'you.com': 'you',
  'poe.com': 'poe',
  'felo.ai': 'felo',
  'genspark.ai': 'genspark',
  'phind.com': 'phind',
  'grok.com': 'grok',
  'chat.deepseek.com': 'deepseek',
  'chat.mistral.ai': 'mistral',
};

/** 開発・ローカル環境と判定するホスト名のパターン */
export const LOCAL_HOST_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
] as const;

export type TrafficKind = 'ai_referral' | 'search' | 'other_referral' | 'direct';

export interface TrafficClassification {
  /** GA4へ送る流入区分 */
  trafficKind: TrafficKind;
  /** AI流入のときだけ入る識別子（chatgpt / claude など） */
  aiSource?: string;
  /** 判定に使ったホスト名（デバッグ・検証用） */
  matchedHost?: string;
}

/**
 * referrer と utm_source から流入を分類する。
 * サーバー側・テスト側からも同じ結果が得られるよう、純関数にしてある。
 */
export function classifyTraffic(referrer: string, utmSource: string | null): TrafficClassification {
  const normalize = (value: string): string | null => {
    if (!value) return null;
    try {
      // utm_source は「chatgpt.com」のようにホスト名だけで来ることが多い
      const withScheme = value.includes('://') ? value : `https://${value}`;
      return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }
  };

  const match = (host: string | null): { source: string; host: string } | null => {
    if (!host) return null;
    const direct = AI_REFERRAL_HOSTS[host];
    if (direct) return { source: direct, host };
    // サブドメイン一致（例：foo.perplexity.ai）
    for (const known of Object.keys(AI_REFERRAL_HOSTS)) {
      if (host.endsWith(`.${known}`)) return { source: AI_REFERRAL_HOSTS[known]!, host };
    }
    return null;
  };

  // utm_source を優先する。AI側がリンクに付けてくるため referrer より確実
  const fromUtm = match(normalize(utmSource ?? ''));
  if (fromUtm) return { trafficKind: 'ai_referral', aiSource: fromUtm.source, matchedHost: fromUtm.host };

  const refHost = normalize(referrer);
  const fromRef = match(refHost);
  if (fromRef) return { trafficKind: 'ai_referral', aiSource: fromRef.source, matchedHost: fromRef.host };

  // referrer が無い＝Direct。ここをAIに寄せると実態と乖離するので寄せない
  if (!refHost) return { trafficKind: 'direct' };

  // 検索エンジン。AI Overviews 経由もここに入るが、区別できないので search のまま
  const SEARCH = ['google.com', 'google.co.jp', 'bing.com', 'yahoo.co.jp', 'search.yahoo.co.jp', 'duckduckgo.com', 'ecosia.org', 'brave.com'];
  if (SEARCH.some((s) => refHost === s || refHost.endsWith(`.${s}`))) {
    return { trafficKind: 'search', matchedHost: refHost };
  }

  return { trafficKind: 'other_referral', matchedHost: refHost };
}
