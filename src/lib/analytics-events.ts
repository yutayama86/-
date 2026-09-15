/**
 * 事業者向け導線（記事末のCTA → 問い合わせフォーム → 送信完了）の計測イベント。
 *
 * イベントの段階と名前：
 *   business_cta_view     記事末のCTAブロックが画面に入った（1ページ1回）… クリック率の分母
 *   business_cta_click    CTAのリンクを押した
 *   contact_form_view     問い合わせフォームのページを開いた … フォーム到達
 *   contact_form_start    フォームに初めて入力した
 *   generate_lead         送信先が 2xx を返した（src/lib/forms.ts）… 送信完了。キーイベントはこれだけ
 *
 * キーイベントにしてよいのは generate_lead だけ。ほかは途中経過なので、
 * キーイベントにすると「実際には届いていない問い合わせ」を成果として数えてしまう。
 *
 * どのCTAから来たかは sessionStorage に30分だけ持つ。
 * 内部リンクに utm_* を付けると GA4 のセッションの流入元が上書きされ、
 * Organic Search の成果が Referral に化けるため、URLには載せない。
 *
 * 入口の流入区分（landing_traffic_kind）は BrandBase.astro の計測タグが
 * config に載せるので、ここで送るすべてのイベントに自動で付く。
 * gtag が読み込まれていない環境（開発・プレビュー・運営者の除外）では何もしない。
 */

type Params = Record<string, string | number | undefined>;

const ORIGIN_KEY = 'ibatoco_cta_origin';
const ORIGIN_TTL_MS = 30 * 60 * 1000;

export interface CtaOrigin {
  cta_type: string;
  cta_location: string;
  cta_page_type: string;
  cta_origin_path: string;
}

export function trackEvent(name: string, params: Params = {}): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  gtag('event', name, { page_path: window.location.pathname, ...clean });
}

export function rememberCtaOrigin(origin: CtaOrigin): void {
  try {
    sessionStorage.setItem(ORIGIN_KEY, JSON.stringify({ ...origin, at: Date.now() }));
  } catch {
    // 保存できないブラウザでは、CTA経由かどうかを付けないだけ
  }
}

export function readCtaOrigin(): CtaOrigin | undefined {
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    if (!raw) return undefined;
    const { at, ...origin } = JSON.parse(raw) as CtaOrigin & { at: number };
    if (typeof at !== 'number' || Date.now() - at > ORIGIN_TTL_MS) {
      sessionStorage.removeItem(ORIGIN_KEY);
      return undefined;
    }
    return origin;
  } catch {
    return undefined;
  }
}

export function clearCtaOrigin(): void {
  try {
    sessionStorage.removeItem(ORIGIN_KEY);
  } catch {
    // 何もしない
  }
}
