/**
 * IBARAKI PASSPORT（茨城パスポート）の、スタンプ設置場所と市町村別ガイドの対応表。
 *
 * 設置場所は、県の特設サイト（観光いばらき）に掲載された一覧を、表記を変えずに写したもの。
 * 住所の書き方も公式の掲載どおり（郡名の有無などを直していない）。
 * 設置場所が変わったら、ここを直せば記事の一覧がそろって変わる。
 *
 * 市町村別の記事（「茨城パスポート 水戸市」など）を公開したら、
 * PASSPORT_MUNICIPALITY_GUIDES に URL を1行足す。一覧のリンク先が /area/ から切り替わる。
 * 存在しない記事の URL は入れない（リンク切れは品質監査で止まる）。
 */
import type { MunicipalitySlug, RegionKey } from './areas';

export const PASSPORT_OFFICIAL_URL = 'https://www.ibarakiguide.jp/special/ibaraki_passport/passport.html';
/** 設置場所の一覧を公式サイトで確認した日 */
export const PASSPORT_SPOTS_VERIFIED_AT = '2026-09-14';

/** 公式の一覧と同じ並び（県央 → 県北 → 鹿行 → 県南 → 県西）。区分はサイトの REGIONS と一致している */
export const PASSPORT_REGION_ORDER: RegionKey[] = ['keno', 'kenpoku', 'rokko', 'kennan', 'kensei'];

export interface PassportStampSpot {
  /** src/data/areas.ts の市町村slug（誤りは型検査で止まる） */
  municipality: MunicipalitySlug;
  name: string;
  /** 公式の掲載どおり */
  address: string;
  /** 期間による設置場所の変更など */
  note?: string;
}

export const PASSPORT_STAMP_SPOTS: PassportStampSpot[] = [
  // 県央エリア（9市町村）
  { municipality: 'mito', name: '偕楽園', address: '水戸市見川 1-1251' },
  { municipality: 'mito', name: '弘道館 北澤売店', address: '水戸市三の丸1-6-29' },
  { municipality: 'mito', name: '茨城県立歴史館', address: '水戸市緑町2-1-15' },
  { municipality: 'mito', name: '茨城県近代美術館', address: '水戸市千波町東久保666-1' },
  { municipality: 'kasama', name: '道の駅かさま', address: '笠間市手越22-1' },
  { municipality: 'kasama', name: '茨城県陶芸美術館', address: '笠間市笠間2345（笠間芸術の森公園内）' },
  { municipality: 'hitachinaka', name: 'ほしいも神社', address: 'ひたちなか市阿字ヶ浦町172-2' },
  { municipality: 'naka', name: '那珂市曲がり屋', address: '那珂市菅谷4520-1' },
  { municipality: 'naka', name: 'THE BOTANICAL RESORT 林音（リンネ）', address: '那珂市戸4369-1' },
  { municipality: 'omitama', name: '空の駅そ・ら・ら', address: '小美玉市山野1628-44' },
  { municipality: 'ibaraki-machi', name: '涸沼自然公園', address: '東茨城郡茨城町中石崎2263' },
  { municipality: 'oarai', name: '大洗町観光交流センター「うみまちテラス」', address: '茨城郡大洗町桜道301' },
  { municipality: 'oarai', name: 'アクアワールド茨城県大洗水族館', address: '東茨城大洗町磯浜町8252-3' },
  { municipality: 'shirosato', name: '道の駅 かつら', address: '東茨城郡城里町御前山50-10' },
  { municipality: 'tokai', name: '東海村産業・情報プラザ「アイヴィル」', address: '那珂郡東海村舟石川駅東3-1-1' },
  // 県北エリア（6市町村）
  { municipality: 'hitachi', name: '日立駅情報交流プラザ（ぷらっとひたち）', address: '日立市幸町1丁目1-24' },
  { municipality: 'hitachi', name: '道の駅日立おさかなセンター', address: '日立市みなと町5779-24' },
  { municipality: 'hitachiota', name: '道の駅ひたちおおた~黄門の郷~', address: '常陸太田市下河合町 1016-1' },
  { municipality: 'hitachiota', name: '道の駅さとみ', address: '常陸太田市小菅町694' },
  { municipality: 'hitachiota', name: '竜神大吊橋', address: '常陸太田市天下野町2133-6' },
  {
    municipality: 'takahagi', name: '高萩観光案内所 メモリア', address: '高萩市春日町3-10-16',
    note: '紅葉まつり期間中（10月31日(土曜日)～11月30(月曜日)予定）は、花貫観光案内所（花貫駐車場内）',
  },
  { municipality: 'kitaibaraki', name: '北茨城観光案内所', address: '北茨城市磯原町磯原755-1（JR磯原駅構内）' },
  { municipality: 'kitaibaraki', name: '茨城県天心記念五浦美術館', address: '北茨城市大津町椿2083' },
  { municipality: 'hitachiomiya', name: '道の駅常陸大宮~かわプラザ~', address: '常陸大宮市岩崎 717-1' },
  { municipality: 'hitachiomiya', name: 'みわ★ふるさと館 北斗星', address: '常陸大宮市鷲子272' },
  { municipality: 'daigo', name: '一般社団法人大子町観光協会', address: '久慈郡大子町大子722-1' },
  { municipality: 'daigo', name: '袋田の滝', address: '久慈郡大子町袋田3-19' },
  { municipality: 'daigo', name: '道の駅奥久慈だいご', address: '久慈郡大子町池田2830-1' },
  // 鹿行エリア（5市町村）
  { municipality: 'kashima', name: '鹿嶋市観光案内所', address: '鹿嶋市宮下4丁目1-2' },
  { municipality: 'kashima', name: 'メルカリスタジアム', address: '鹿嶋市神向寺後山26-2' },
  { municipality: 'itako', name: '道の駅いたこ', address: '潮来市前川1326-1' },
  { municipality: 'kamisu', name: '息栖にぎわいテラス', address: '神栖市息栖2509' },
  { municipality: 'namegata', name: '行方市観光物産館こいこい', address: '行方市玉造甲1963-5' },
  { municipality: 'hokota', name: '鹿島灘海浜公園（海と森の郷もぎたて市場）', address: '鉾田市大竹390' },
  // 県南エリア（14市町村）
  { municipality: 'tsuchiura', name: '土浦まちかど蔵「大徳」', address: '土浦市中央1-3-16' },
  { municipality: 'ishioka', name: '石岡市観光案内所', address: '石岡市国府1-1-7' },
  { municipality: 'ishioka', name: 'いばらきフラワーパーク', address: '石岡市下青柳200' },
  { municipality: 'ryugasaki', name: 'アドベンチャーバレー龍ケ崎（龍ケ崎市森林公園）', address: '龍ケ崎市泉町1966' },
  { municipality: 'toride', name: '取手市役所 取手駅前窓口', address: '取手市新町1-9-1' },
  { municipality: 'ushiku', name: '牛久シャトー', address: '牛久市中央3-20-1' },
  { municipality: 'tsukuba', name: 'つくばジオミュージアム', address: 'つくば市北条4160' },
  { municipality: 'moriya', name: 'もりやコレクション', address: '守谷市中央4-9' },
  { municipality: 'inashiki', name: 'えどさき笑遊館', address: '稲敷市江戸崎甲2711' },
  { municipality: 'kasumigaura', name: 'かすみがうら市交流センター（畔ほとりの駅 コハン）', address: 'かすみがうら市坂4784' },
  { municipality: 'tsukubamirai', name: '間宮林蔵記念館', address: 'つくばみらい市上平柳64' },
  { municipality: 'miho', name: 'みほーすマルシェ', address: '稲敷郡美浦村宮地1211-2' },
  { municipality: 'ami', name: '予科練平和記念館', address: '稲敷郡阿見町廻戸5-1' },
  { municipality: 'kawachi', name: '河内町産業観光交流拠点施設「かわち夢楽」', address: '稲敷郡河内町長竿4641' },
  { municipality: 'tone', name: '柳田國男記念公苑', address: '利根町布川1787-1' },
  // 県西エリア（10市町村）
  { municipality: 'koga', name: '道の駅 まくらがの里こが', address: '古河市大和田2623' },
  { municipality: 'yuki', name: '結城市観光物産センター', address: '結城市国府町1丁目1-1-1' },
  { municipality: 'shimotsuma', name: '道の駅しもつま', address: '下妻市数須140' },
  { municipality: 'joso', name: '地域交流センター', address: '常総市新石下2010' },
  { municipality: 'joso', name: '道の駅常総', address: '常総市むすびまち1' },
  { municipality: 'chikusei', name: '道の駅グランテラス筑西', address: '筑西市川澄1850' },
  { municipality: 'bando', name: '坂東市産業経済交流施設 坂東将門の里', address: '坂東市長須9621-1' },
  { municipality: 'bando', name: 'ミュージアムパーク 茨城県自然博物館', address: '坂東市大崎700' },
  { municipality: 'sakuragawa', name: '真壁伝承館', address: '桜川市真壁町真壁198' },
  { municipality: 'yachiyo', name: '八千代グリーンビレッジ憩遊館', address: '結城郡八千代町松本592' },
  { municipality: 'goka', name: '道の駅ごか', address: '猿島郡五霞町ごかみらい13-3' },
  { municipality: 'sakai', name: '道の駅さかい', address: '猿島郡境町1341-1' },
];

/**
 * 市町村別の茨城パスポート記事。公開した記事だけを入れる。
 * 例：mito: '/news/ibaraki-passport-mito/'
 */
export const PASSPORT_MUNICIPALITY_GUIDES: Partial<Record<MunicipalitySlug, string>> = {};

// 公式の一覧は「全44市町村・61箇所」。写し漏れがあればビルドを止める。
const covered = new Set(PASSPORT_STAMP_SPOTS.map((spot) => spot.municipality));
if (covered.size !== 44 || PASSPORT_STAMP_SPOTS.length !== 61) {
  throw new Error(`ibaraki-passport.ts: 公式は44市町村・61箇所。現在 ${covered.size}市町村・${PASSPORT_STAMP_SPOTS.length}箇所`);
}
