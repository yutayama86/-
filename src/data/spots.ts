/**
 * スポットのマスターデータ。
 *
 * 施設名と市町村の対応は、記事ごとに書くと必ずずれる。実際に、ネーブルパーク
 * （古河市）を坂東市のスポットとして載せ、加藤洲十二橋（千葉県香取市）を潮来市の
 * スポットとして載せていた。だからここを唯一の正とし、他のデータは slug で参照する。
 *
 * ルール
 * - municipality は areas.ts の44市町村から選ぶ（型で保証される）
 * - address / officialUrl は **一次情報で確認できたものだけ** 書く。埋めるために推測しない
 * - sourceUrl と verifiedAt は必須。「何を見て、いつ確認したか」を残すため
 * - 複数の市町村にまたがるものは alsoIn に書く
 * - 名称はネーミングライツや改称を反映した現在の正式名称。旧称・通称は aka へ
 */
import type { MunicipalitySlug } from './areas';

/** 施設か、町並み・エリアか、自然か。エリアと自然は住所を持たないことがある */
export type SpotKind = 'facility' | 'area' | 'nature';

export interface Spot {
  slug: string;
  /** 現在の正式名称 */
  name: string;
  /** 旧称・通称・ネーミングライツの愛称 */
  aka?: string;
  kind: SpotKind;
  /** 主たる所在地 */
  municipality: MunicipalitySlug;
  /** またがる場合の、ほかの市町村 */
  alsoIn?: MunicipalitySlug[];
  /**
   * 所在地ではないが、紹介してよい市町村。
   * 隣接していて実際に足を運ぶ対象になるもの（牛久市から見た牛久沼など）。
   * 所在地はあくまで municipality が正で、こちらは「載せてよい場所」でしかない。
   * 本文では、所在地がどこかを必ず書くこと。
   */
  mentionedIn?: MunicipalitySlug[];
  /** 一次情報で確認できた住所だけ。無いものは書かない */
  address?: string;
  officialUrl?: string;
  /** 注意事項。休止中の設備、出典間の食い違いなど */
  note?: string;
  /** 何を見て確認したか */
  sourceUrl: string;
  /** その出典を最後に確認した日 */
  verifiedAt: string;
}

export const SPOTS: Spot[] = [
  { slug: 'kairakuen', name: '偕楽園', kind: 'facility', municipality: 'mito', address: '茨城県水戸市常磐町1-3-3', officialUrl: 'https://ibaraki-kairakuen.jp/', sourceUrl: 'https://ibaraki-kairakuen.jp/', verifiedAt: '2026-08-07' },
  { slug: 'kodokan', name: '弘道館', kind: 'facility', municipality: 'mito', officialUrl: 'https://www.city.mito.lg.jp/site/education/2605.html', sourceUrl: 'https://www.city.mito.lg.jp/site/education/2605.html', verifiedAt: '2026-08-07' },
  { slug: 'senba-ko', name: '千波湖', kind: 'nature', municipality: 'mito', officialUrl: 'https://www.city.mito.lg.jp/page/4710.html', sourceUrl: 'https://www.city.mito.lg.jp/page/4710.html', verifiedAt: '2026-08-07' },
  { slug: 'hitachi-station', name: '日立駅', kind: 'facility', municipality: 'hitachi', officialUrl: 'https://www.city.hitachi.lg.jp/citypromotion/hitachi_donnamachi/1007477/1011149/1010610/1004743/1004744.html', note: '妹島和世が設計を監修。自由通路東側の展望イベントホールから太平洋を望む', sourceUrl: 'https://www.city.hitachi.lg.jp/citypromotion/hitachi_donnamachi/1007477/1011149/1010610/1004743/1004744.html', verifiedAt: '2026-09-05' },
  { slug: 'oiwa-jinja', name: '御岩神社', kind: 'facility', municipality: 'hitachi', address: '茨城県日立市入四間町752', officialUrl: 'https://www.oiwajinja.jp/', sourceUrl: 'https://www.oiwajinja.jp/koutu.html', verifiedAt: '2026-09-05' },
  { slug: 'kamine-park', name: 'かみね公園', kind: 'facility', municipality: 'hitachi', address: '茨城県日立市宮田町5-2-22', officialUrl: 'https://www.city.hitachi.lg.jp/shisetsu/kanko_bunka/1007556/1003143/index.html', sourceUrl: 'https://www.city.hitachi.lg.jp/shisetsu/kanko_bunka/1007556/1003143/index.html', verifiedAt: '2026-09-05' },
  { slug: 'kasumigaura', name: '霞ヶ浦', kind: 'nature', municipality: 'tsuchiura', alsoIn: ['kasumigaura', 'namegata'], officialUrl: 'https://www.city.tsuchiura.lg.jp/kanko-bunka-sports/jitenshanomachi/hajimetenorinrinroad/', note: '土浦市・かすみがうら市・行方市など複数市町にまたがる', sourceUrl: 'https://www.city.tsuchiura.lg.jp/kanko-bunka-sports/jitenshanomachi/hajimetenorinrinroad/', verifiedAt: '2026-08-07' },
  { slug: 'kijo-park', name: '亀城公園', kind: 'facility', municipality: 'tsuchiura', officialUrl: 'https://www.city.tsuchiura.lg.jp/kankyo-kotsu-machizukuri/koen/koenichiran/page000785.html', note: '土浦城の本丸・二の丸跡', sourceUrl: 'https://www.city.tsuchiura.lg.jp/kankyo-kotsu-machizukuri/koen/koenichiran/page000785.html', verifiedAt: '2026-09-05' },
  { slug: 'rinrin-road', name: 'つくば霞ヶ浦りんりんロード', kind: 'facility', municipality: 'tsuchiura', officialUrl: 'https://www.city.tsuchiura.lg.jp/kanko-bunka-sports/jitenshanomachi/hajimetenorinrinroad/', sourceUrl: 'https://www.city.tsuchiura.lg.jp/kanko-bunka-sports/jitenshanomachi/hajimetenorinrinroad/', verifiedAt: '2026-08-07' },
  { slug: 'koga-kubo-park', name: '古河公方公園（古河総合公園）', kind: 'facility', municipality: 'koga', officialUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/toshi/7/1650.html', note: '花桃の本数は古河市が約2,000本、観光協会が約1,800本と食い違う', sourceUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/toshi/7/1650.html', verifiedAt: '2026-09-05' },
  { slug: 'watarase', name: '渡良瀬遊水地', kind: 'nature', municipality: 'koga', officialUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/kikaku/28/1960.html', note: '4県6市町にまたがる。茨城県分は古河市の約100ha（全体3,300ha）', sourceUrl: 'https://www.env.go.jp/nature/ramsar/conv/ramsarleaflet/22_Watarase-yusuichi.pdf', verifiedAt: '2026-09-05' },
  { slug: 'koga-rekishi', name: '古河歴史博物館', kind: 'facility', municipality: 'koga', address: '茨城県古河市中央町3-10-56', officialUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/rekihaku/index.html', sourceUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/rekihaku/index.html', verifiedAt: '2026-09-05' },
  { slug: 'nable-park', name: 'サンワ設計ネーブルパーク', aka: 'ネーブルパーク', kind: 'facility', municipality: 'koga', address: '茨城県古河市駒羽根620', officialUrl: 'https://www.city.ibaraki-koga.lg.jp/soshiki/toshi/7/17158.html', note: 'ネーミングライツにより「サンワ設計ネーブルパーク」が愛称', sourceUrl: 'https://www.ibarakiguide.jp/spot.php?mode=detail&code=141', verifiedAt: '2026-09-05' },
  { slug: 'sosyagu', name: '常陸國總社宮', kind: 'facility', municipality: 'ishioka', officialUrl: 'https://sosyagu.jp/', sourceUrl: 'https://sosyagu.jp/', verifiedAt: '2026-08-07' },
  { slug: 'ibaraki-flowerpark', name: 'いばらきフラワーパーク', aka: '旧称 茨城県フラワーパーク', kind: 'facility', municipality: 'ishioka', address: '茨城県石岡市下青柳200', officialUrl: 'https://www.flowerpark.or.jp/', sourceUrl: 'https://www.flowerpark.or.jp/access/', verifiedAt: '2026-09-05' },
  { slug: 'asahi-satoyama', name: '朝日里山学校', kind: 'facility', municipality: 'ishioka', address: '茨城県石岡市柴内630', officialUrl: 'https://www.city.ishioka.lg.jp/ishiokameguri/ishiokashiwotaiken/page001140.html', note: '閉校した旧朝日小学校を活用した交流・体験型の施設', sourceUrl: 'https://www.city.ishioka.lg.jp/ishiokameguri/ishiokashiwotaiken/page001140.html', verifiedAt: '2026-09-05' },
  { slug: 'yuki-kura', name: '結城の蔵の街', kind: 'area', municipality: 'yuki', officialUrl: 'https://www.city.yuki.lg.jp/kankou/yukitsumugi/page001668.html', sourceUrl: 'https://www.city.yuki.lg.jp/kankou/yukitsumugi/page001668.html', verifiedAt: '2026-08-07' },
  { slug: 'tsumugi-no-yakata', name: 'つむぎの館', kind: 'facility', municipality: 'yuki', address: '茨城県結城市結城12-2', officialUrl: 'https://www.yukitumugi.co.jp/', sourceUrl: 'https://www.yukitumugi.co.jp/access/', verifiedAt: '2026-09-05' },
  { slug: 'hannyain', name: '般若院のしだれ桜', kind: 'facility', municipality: 'ryugasaki', address: '茨城県龍ケ崎市根町3341', officialUrl: 'https://www.city.ryugasaki.ibaraki.jp/kanko/kankokyokai/kankospot/meisho/temple/2013091801362.html', note: '県指定天然記念物', sourceUrl: 'https://www.city.ryugasaki.ibaraki.jp/kanko/bunka/bunkazai/2013081500701.html', verifiedAt: '2026-09-05' },
  { slug: 'ushikunuma', name: '牛久沼', kind: 'nature', municipality: 'ryugasaki', mentionedIn: ['ushiku'], officialUrl: 'https://www.city.ryugasaki.ibaraki.jp/kanko/michinoekiushikunuma/ushikunuma/index.html', note: '沼の全域が龍ケ崎市。牛久市・つくば市・取手市・つくばみらい市に囲まれる', sourceUrl: 'https://www.ibarakiguide.jp/spot.php?mode=detail&code=1240', verifiedAt: '2026-09-05' },
  { slug: 'sanuma', name: '砂沼', kind: 'nature', municipality: 'shimotsuma', officialUrl: 'https://www.city.shimotsuma.lg.jp/', sourceUrl: 'https://www.city.shimotsuma.lg.jp/', verifiedAt: '2026-08-07' },
  { slug: 'kokaigawa-fureai', name: '小貝川ふれあい公園', aka: 'ホーミックふれあい公園', kind: 'facility', municipality: 'shimotsuma', address: '茨城県下妻市堀篭1650-1', officialUrl: 'https://www.city.shimotsuma.lg.jp/kurashi-tetsuzuki/park/kokaigawafureai/', note: 'ネーミングライツにより令和7年12月1日から愛称が変更', sourceUrl: 'https://www.city.shimotsuma.lg.jp/shogaigakushu-bunka-sports/park/kokaigawafureai/page000198.html', verifiedAt: '2026-09-05' },
  { slug: 'toyodajo', name: '地域交流センター（豊田城）', kind: 'facility', municipality: 'joso', address: '茨城県常総市新石下2010', officialUrl: 'https://www.city.joso.lg.jp/kankou_ijyu/spot/tiikikoryu/', sourceUrl: 'https://www.city.joso.lg.jp/kurashi_gyousei/kurashi/shisetsu_koukyou/facility/tiikikoryu/page001373.html', verifiedAt: '2026-09-05' },
  { slug: 'asunaro-no-sato', name: 'あすなろの里', kind: 'facility', municipality: 'joso', officialUrl: 'https://www.city.joso.lg.jp/kankou_ijyu/spot/asunaro/', sourceUrl: 'https://www.city.joso.lg.jp/kankou_ijyu/spot/asunaro/', verifiedAt: '2026-09-05' },
  { slug: 'ryujin-ohtsuribashi', name: '竜神大吊橋', kind: 'facility', municipality: 'hitachiota', officialUrl: 'https://ohtsuribashi.ryujinkyo.jp/', sourceUrl: 'https://ohtsuribashi.ryujinkyo.jp/', verifiedAt: '2026-08-07' },
  { slug: 'nishiyama-goten', name: '西山御殿（西山荘）', aka: '西山荘', kind: 'facility', municipality: 'hitachiota', officialUrl: 'https://www.city.hitachiota.ibaraki.jp/miryoku/miru/historic-sites/page000214.html', sourceUrl: 'https://www.city.hitachiota.ibaraki.jp/miryoku/miru/historic-sites/page000214.html', verifiedAt: '2026-09-05' },
  { slug: 'ryujinkyo', name: '竜神峡', kind: 'nature', municipality: 'hitachiota', officialUrl: 'https://ohtsuribashi.ryujinkyo.jp/', sourceUrl: 'https://ohtsuribashi.ryujinkyo.jp/', verifiedAt: '2026-08-07' },
  { slug: 'hananuki', name: '花貫渓谷', kind: 'nature', municipality: 'takahagi', officialUrl: 'https://www.city.takahagi.ibaraki.jp/kankou/spot/sizen/page000012.html', sourceUrl: 'https://www.city.takahagi.ibaraki.jp/kankou/spot/sizen/page000012.html', verifiedAt: '2026-08-07' },
  { slug: 'takado-kohama', name: '高戸小浜海岸', kind: 'nature', municipality: 'takahagi', officialUrl: 'https://www.city.takahagi.ibaraki.jp/kankou/spot/sizen/page000015.html', sourceUrl: 'https://www.city.takahagi.ibaraki.jp/kankou/spot/sizen/page000015.html', verifiedAt: '2026-08-07' },
  { slug: 'izura-rokkakudo', name: '五浦海岸・六角堂', kind: 'facility', municipality: 'kitaibaraki', address: '茨城県北茨城市大津町五浦727-2', officialUrl: 'https://rokkakudo.izura.ibaraki.ac.jp/', note: '茨城大学五浦美術文化研究所が管理', sourceUrl: 'https://www.city.kitaibaraki.lg.jp/docs/2015022000264/', verifiedAt: '2026-09-05' },
  { slug: 'hirakata-ko', name: '平潟港', kind: 'facility', municipality: 'kitaibaraki', officialUrl: 'http://www.city.kitaibaraki.lg.jp/docs/2015022000196/', sourceUrl: 'http://www.city.kitaibaraki.lg.jp/docs/2015022000196/', verifiedAt: '2026-09-05' },
  { slug: 'kasama-inari', name: '笠間稲荷神社', kind: 'facility', municipality: 'kasama', address: '茨城県笠間市笠間1', officialUrl: 'http://www.kasama.or.jp/', sourceUrl: 'http://www.kasama.or.jp/access/', verifiedAt: '2026-09-05' },
  { slug: 'kasama-geijutsu', name: '笠間芸術の森公園', kind: 'facility', municipality: 'kasama', address: '茨城県笠間市笠間2345', officialUrl: 'https://www.city.kasama.lg.jp/page/page000122.html', sourceUrl: 'https://www.pref.ibaraki.jp/doboku/kogai/kikaku/geimori_park.html', verifiedAt: '2026-09-05' },
  { slug: 'kasama-tsutsuji', name: '笠間つつじ公園', kind: 'facility', municipality: 'kasama', address: '茨城県笠間市笠間616-7', officialUrl: 'https://www.kasama-kankou.jp/section.php?code=499', sourceUrl: 'https://www.kasama-kankou.jp/section.php?code=499', verifiedAt: '2026-09-05' },
  { slug: 'toride-honjin', name: '旧取手宿本陣 染野家住宅', aka: '旧取手宿本陣', kind: 'facility', municipality: 'toride', address: '茨城県取手市取手2-16-41', officialUrl: 'https://www.city.toride.ibaraki.jp/maibun/bunkakatsudo/rekishi/shitebunkazai/somenoke.html', note: '県・市の指定文化財', sourceUrl: 'https://www.city.toride.ibaraki.jp/maibun/bunkakatsudo/rekishi/shitebunkazai/somenoke.html', verifiedAt: '2026-09-05' },
  { slug: 'toride-ryokuchi', name: '取手緑地・利根川', kind: 'nature', municipality: 'toride', officialUrl: 'https://zetsumyo.city.toride.ibaraki.jp/art/tap/art_housing/', sourceUrl: 'https://zetsumyo.city.toride.ibaraki.jp/art/tap/art_housing/', verifiedAt: '2026-08-07' },
  { slug: 'ushiku-daibutsu', name: '牛久大仏', kind: 'facility', municipality: 'ushiku', officialUrl: 'https://daibutu.net/', sourceUrl: 'https://daibutu.net/', verifiedAt: '2026-08-07' },
  { slug: 'ushiku-chateau', name: '牛久シャトー', kind: 'facility', municipality: 'ushiku', officialUrl: 'https://www.city.ushiku.lg.jp/city-promotion/tanoshimu/kankochi-shokai/page013839.html', sourceUrl: 'https://www.city.ushiku.lg.jp/city-promotion/tanoshimu/kankochi-shokai/page013839.html', verifiedAt: '2026-08-07' },
  { slug: 'tsukubasan', name: '筑波山', kind: 'nature', municipality: 'tsukuba', alsoIn: ['sakuragawa', 'ishioka'], officialUrl: 'https://mt-tsukuba.com/', note: 'つくば市・桜川市・石岡市にまたがる', sourceUrl: 'https://www.city.tsukuba.lg.jp/tourism/tsukubasan/index.html', verifiedAt: '2026-08-07' },
  { slug: 'jaxa-tsukuba', name: 'JAXA筑波宇宙センター', kind: 'facility', municipality: 'tsukuba', officialUrl: 'https://visit-tsukuba.jaxa.jp/', sourceUrl: 'https://visit-tsukuba.jaxa.jp/', verifiedAt: '2026-08-07' },
  { slug: 'expocenter', name: 'つくばエキスポセンター', kind: 'facility', municipality: 'tsukuba', officialUrl: 'https://www.expocenter.or.jp/', sourceUrl: 'https://www.expocenter.or.jp/', verifiedAt: '2026-08-07' },
  { slug: 'hitachi-seaside', name: '国営ひたち海浜公園', kind: 'facility', municipality: 'hitachinaka', officialUrl: 'https://www.hitachikaihin.jp/', sourceUrl: 'https://www.hitachikaihin.jp/', verifiedAt: '2026-08-07' },
  { slug: 'nakaminato-market', name: '那珂湊おさかな市場', kind: 'facility', municipality: 'hitachinaka', officialUrl: 'https://www.nakaminato-osakanaichiba.jp/', sourceUrl: 'https://www.nakaminato-osakanaichiba.jp/', verifiedAt: '2026-08-07' },
  { slug: 'ajigaura', name: '阿字ヶ浦海岸', kind: 'nature', municipality: 'hitachinaka', address: '茨城県ひたちなか市阿字ヶ浦町3290', officialUrl: 'https://www.city.hitachinaka.lg.jp/business/kankoshinko/1002713/1010142.html', sourceUrl: 'https://www.city.hitachinaka.lg.jp/business/kankoshinko/1002713/1010142.html', verifiedAt: '2026-09-05' },
  { slug: 'kashima-jingu', name: '鹿島神宮', kind: 'facility', municipality: 'kashima', officialUrl: 'https://kashimajingu.jp/', sourceUrl: 'https://kashimajingu.jp/', verifiedAt: '2026-08-07' },
  { slug: 'kashima-stadium', name: '県立カシマサッカースタジアム', aka: 'メルカリスタジアム', kind: 'facility', municipality: 'kashima', address: '茨城県鹿嶋市神向寺後山26-2', officialUrl: 'https://city.kashima.ibaraki.jp/site/kankou/3089.html', note: '2025年7月1日からネーミングライツによる愛称', sourceUrl: 'https://city.kashima.ibaraki.jp/site/kankou/3089.html', verifiedAt: '2026-09-05' },
  { slug: 'itako-ayame', name: '水郷潮来あやめ園', kind: 'facility', municipality: 'itako', officialUrl: 'https://www.city.itako.lg.jp/kankou/kankou-itakokankou/kankou-spot/kankou-mainspot/kankou-spot03/page001385.html', sourceUrl: 'https://www.city.itako.lg.jp/kankou/kankou-itakokankou/kankou-spot/kankou-mainspot/kankou-spot03/page001385.html', verifiedAt: '2026-08-07' },
  { slug: 'maekawa-junikyo', name: '前川十二橋めぐり', kind: 'facility', municipality: 'itako', officialUrl: 'https://www.city.itako.lg.jp/page/page001230.html', note: '前川河口付近から出る遊覧。加藤洲十二橋は千葉県香取市側で、別のめぐりコース', sourceUrl: 'https://www.city.itako.lg.jp/page/page001230.html', verifiedAt: '2026-09-05' },
  { slug: 'asahi-moriya', name: 'アサヒビール茨城工場', kind: 'facility', municipality: 'moriya', address: '茨城県守谷市緑1-1-1', officialUrl: 'https://www.asahibeer.co.jp/brewery/ibaraki/', sourceUrl: 'https://www.asahibeer.co.jp/brewery/ibaraki/access/', verifiedAt: '2026-09-05' },
  { slug: 'shiki-no-sato', name: '四季の里公園', kind: 'facility', municipality: 'moriya', officialUrl: 'https://www.city.moriya.ibaraki.jp/shisetsu/sports/1004286/1004287/1004295/1004297.html', sourceUrl: 'https://www.city.moriya.ibaraki.jp/shisetsu/sports/1004286/1004287/1004295/1004297.html', verifiedAt: '2026-09-05' },
  { slug: 'gozenyama', name: '御前山（関東の嵐山）', kind: 'nature', municipality: 'hitachiomiya', officialUrl: 'https://www.city.hitachiomiya.lg.jp/kankou_guide/activity/hiking/page002934.html', sourceUrl: 'https://www.city.hitachiomiya.lg.jp/kankou_guide/activity/hiking/page002934.html', verifiedAt: '2026-08-07' },
  { slug: 'michinoeki-kawaplaza', name: '道の駅 常陸大宮 〜かわプラザ〜', aka: '道の駅 かわプラザ', kind: 'facility', municipality: 'hitachiomiya', address: '茨城県常陸大宮市岩崎717-1', officialUrl: 'https://www.city.hitachiomiya.lg.jp/kurashi_gyousei/kankou_bunka/michinoeki/kawaplaza/', sourceUrl: 'https://www.city.hitachiomiya.lg.jp/kurashi_gyousei/kankou_bunka/michinoeki/kawaplaza/', verifiedAt: '2026-09-05' },
  { slug: 'shizumine', name: '静峰ふるさと公園', kind: 'facility', municipality: 'naka', officialUrl: 'https://www.city.naka.lg.jp/event-kankou/kankou-spot/page000275.html', sourceUrl: 'https://www.city.naka.lg.jp/event-kankou/kankou-spot/page000275.html', verifiedAt: '2026-08-07' },
  { slug: 'granterrace', name: '道の駅 グランテラス筑西', kind: 'facility', municipality: 'chikusei', officialUrl: 'https://www.city.chikusei.lg.jp/machidukuri/michi-eki/page006828.html', sourceUrl: 'https://www.city.chikusei.lg.jp/machidukuri/michi-eki/page006828.html', verifiedAt: '2026-08-07' },
  { slug: 'shimodate-museum', name: 'しもだて美術館', kind: 'facility', municipality: 'chikusei', officialUrl: 'https://www.city.chikusei.lg.jp/museum/', sourceUrl: 'https://www.city.chikusei.lg.jp/museum/', verifiedAt: '2026-08-07' },
  { slug: 'shizen-hakubutsukan', name: 'ミュージアムパーク茨城県自然博物館', kind: 'facility', municipality: 'bando', officialUrl: 'https://www.nat.museum.ibk.ed.jp/', sourceUrl: 'https://www.nat.museum.ibk.ed.jp/', verifiedAt: '2026-08-07' },
  { slug: 'oosugi-jinja', name: '大杉神社', kind: 'facility', municipality: 'inashiki', officialUrl: 'https://oosugi-jinja.or.jp/', sourceUrl: 'https://oosugi-jinja.or.jp/', verifiedAt: '2026-08-07' },
  { slug: 'wada-park', name: '和田公園', kind: 'facility', municipality: 'inashiki', address: '茨城県稲敷市浮島5020-1', officialUrl: 'https://www.city.inashiki.lg.jp/page/page004748.html', sourceUrl: 'https://www.city.inashiki.lg.jp/page/page004748.html', verifiedAt: '2026-09-05' },
  { slug: 'ayumisaki-park', name: '歩崎公園', kind: 'facility', municipality: 'kasumigaura', officialUrl: 'https://www.city.kasumigaura.lg.jp/page/page000215.html', sourceUrl: 'https://www.city.kasumigaura.lg.jp/page/page000215.html', verifiedAt: '2026-09-05' },
  { slug: 'kasumigaura-aquarium', name: 'かすみがうら市水族館', kind: 'facility', municipality: 'kasumigaura', officialUrl: 'https://www.city.kasumigaura.lg.jp/page/page002701.html', sourceUrl: 'https://www.city.kasumigaura.lg.jp/page/page002701.html', verifiedAt: '2026-08-07' },
  { slug: 'makabe', name: '真壁の町並み', kind: 'area', municipality: 'sakuragawa', address: '茨城県桜川市真壁町真壁', officialUrl: 'https://www.city.sakuragawa.lg.jp/tourism_guide/learn/page000455.html', note: '重要伝統的建造物群保存地区（2010年6月29日選定・約17.6ha）', sourceUrl: 'https://www.city.sakuragawa.lg.jp/education/bunkazai/city_bunkazai/kuni_bunkazai/page003423.html', verifiedAt: '2026-09-05' },
  { slug: 'amabiki-kannon', name: '雨引観音（雨引山楽法寺）', kind: 'facility', municipality: 'sakuragawa', address: '茨城県桜川市本木1', officialUrl: 'http://www.amabiki.or.jp/', sourceUrl: 'http://www.amabiki.or.jp/access/', verifiedAt: '2026-09-05' },
  { slug: 'isobe-sakuragawa', name: '磯部桜川公園', kind: 'facility', municipality: 'sakuragawa', address: '茨城県桜川市磯部740-2', officialUrl: 'https://www.city.sakuragawa.lg.jp/tourism_guide/play/page000396.html', note: '国の名勝。公園の桜は国の天然記念物', sourceUrl: 'https://www.city.sakuragawa.lg.jp/tourism_guide/play/page000396.html', verifiedAt: '2026-09-05' },
  { slug: 'minato-park', name: '港公園', aka: '平成物産パーク港公園', kind: 'facility', municipality: 'kamisu', address: '茨城県神栖市東深芝10', officialUrl: 'https://www.city.kamisu.ibaraki.jp/living/park/1005409/index.html', note: '高さ52mの展望塔は利用休止中', sourceUrl: 'https://www.city.kamisu.ibaraki.jp/living/park/1005409/index.html', verifiedAt: '2026-09-05' },
  { slug: 'nikkawahama', name: '日川浜海岸', kind: 'nature', municipality: 'kamisu', address: '茨城県神栖市日川字海岸砂間地先', officialUrl: 'https://www.city.kamisu.ibaraki.jp/kanko_sports/ss_facility/1002393/1002408/1002409.html', sourceUrl: 'https://www.city.kamisu.ibaraki.jp/kanko_sports/ss_facility/1002393/1002408/1002409.html', verifiedAt: '2026-09-05' },
  { slug: 'namegata-fv', name: 'なめがたファーマーズヴィレッジ', aka: 'らぽっぽ なめがたファーマーズヴィレッジ', kind: 'facility', municipality: 'namegata', address: '茨城県行方市宇崎1561', officialUrl: 'https://www.namegata-fv.jp/', sourceUrl: 'https://www.namegata-fv.jp/access/', verifiedAt: '2026-09-05' },
  { slug: 'tennozaki-park', name: '天王崎公園', kind: 'facility', municipality: 'namegata', officialUrl: 'https://www.city.namegata.ibaraki.jp/page/page000123.html', note: '霞ヶ浦に突き出す景勝地', sourceUrl: 'https://www.city.namegata.ibaraki.jp/page/page000123.html', verifiedAt: '2026-09-05' },
  { slug: 'kashimanada-kaigan', name: '鹿島灘海岸', kind: 'nature', municipality: 'hokota', officialUrl: 'https://www.city.hokota.lg.jp/page/page002995.html', note: '鉾田市側の海水浴場は大竹海岸鉾田海水浴場', sourceUrl: 'https://www.city.hokota.lg.jp/page/page002995.html', verifiedAt: '2026-09-05' },
  { slug: 'warp-station-edo', name: 'ワープステーション江戸', kind: 'facility', municipality: 'tsukubamirai', officialUrl: 'https://www.city.tsukubamirai.lg.jp/page/page005175.html', sourceUrl: 'https://www.city.tsukubamirai.lg.jp/page/page005175.html', verifiedAt: '2026-09-05' },
  { slug: 'fukuoka-zeki', name: '福岡堰', kind: 'facility', municipality: 'tsukubamirai', address: '茨城県つくばみらい市北山2633-7ほか', officialUrl: 'https://www.city.tsukubamirai.lg.jp/jyumin/shisetu-koutsu/kouen/page001571.html', note: '関東三大堰のひとつ。約550本の桜並木が1.8kmにわたる', sourceUrl: 'https://www.city.tsukubamirai.lg.jp/jyumin/shisetu-koutsu/kouen/page001571.html', verifiedAt: '2026-09-05' },
  { slug: 'ibaraki-airport', name: '茨城空港', kind: 'facility', municipality: 'omitama', officialUrl: 'https://www.ibaraki-airport.net/', sourceUrl: 'https://www.ibaraki-airport.net/', verifiedAt: '2026-08-07' },
  { slug: 'solala', name: '空のえき そ・ら・ら', kind: 'facility', municipality: 'omitama', officialUrl: 'https://sol-la-la.city.omitama.lg.jp/', sourceUrl: 'https://sol-la-la.city.omitama.lg.jp/', verifiedAt: '2026-08-07' },
  { slug: 'hinuma', name: '涸沼', kind: 'nature', municipality: 'ibaraki-machi', alsoIn: ['hokota', 'oarai'], officialUrl: 'https://www.town.ibaraki.lg.jp/gyousei/kurashitetuduki/gomirisaikle/ramsar/001468.html', note: '茨城町・鉾田市・大洗町の3市町にまたがる（環境省）', sourceUrl: 'https://www.env.go.jp/nature/ramsar/conv/waterfowl/hinuma.html', verifiedAt: '2026-09-05' },
  { slug: 'hinuma-shizen', name: '涸沼自然公園', kind: 'facility', municipality: 'ibaraki-machi', address: '茨城県東茨城郡茨城町中石崎2263', officialUrl: 'https://www.town.ibaraki.lg.jp/gyousei/kenkoukaigo/sports/koen/hinuma/000678.html', sourceUrl: 'https://www.town.ibaraki.lg.jp/gyousei/kenkoukaigo/sports/koen/hinuma/000678.html', verifiedAt: '2026-09-05' },
  { slug: 'oarai-isosaki', name: '大洗磯前神社', kind: 'facility', municipality: 'oarai', address: '茨城県東茨城郡大洗町磯浜町6890', officialUrl: 'https://www.oarai-isosakijinja.net/', note: '海岸の岩礁に立つ「神磯の鳥居」で知られる', sourceUrl: 'https://www.oarai-isosakijinja.net/annnai/', verifiedAt: '2026-09-05' },
  { slug: 'aquaworld-oarai', name: 'アクアワールド茨城県大洗水族館', kind: 'facility', municipality: 'oarai', officialUrl: 'https://www.aquaworld-oarai.com/', sourceUrl: 'https://www.aquaworld-oarai.com/', verifiedAt: '2026-08-07' },
  { slug: 'oarai-sunbeach', name: '大洗サンビーチ', kind: 'nature', municipality: 'oarai', address: '茨城県東茨城郡大洗町大貫町1212-57', officialUrl: 'https://www.oarai-info.jp/spot/postid_2920/', sourceUrl: 'https://www.oarai-info.jp/spot/postid_2920/', verifiedAt: '2026-09-05' },
  { slug: 'hororu', name: 'ホロルの湯', kind: 'facility', municipality: 'shirosato', officialUrl: 'https://www.town.shirosato.lg.jp/page/page000581.html', sourceUrl: 'https://www.town.shirosato.lg.jp/page/page000581.html', verifiedAt: '2026-08-07' },
  { slug: 'nakagawa', name: '那珂川の清流', kind: 'nature', municipality: 'shirosato', officialUrl: 'https://www.town.shirosato.lg.jp/page/page000581.html', note: '那珂川は県内の複数市町村を流れる', sourceUrl: 'https://www.town.shirosato.lg.jp/page/page000581.html', verifiedAt: '2026-08-07' },
  { slug: 'muramatsu-kokuzo', name: '村松山虚空蔵堂', kind: 'facility', municipality: 'tokai', officialUrl: 'https://ibarakiguide.jp/spot.php?code=424&mode=detail', sourceUrl: 'https://ibarakiguide.jp/spot.php?code=424&mode=detail', verifiedAt: '2026-08-07' },
  { slug: 'akogigaura-park', name: '阿漕ヶ浦公園', kind: 'facility', municipality: 'tokai', address: '茨城県那珂郡東海村村松579', officialUrl: 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/kensetsubu/douroseibi/7/1/1/1659.html', sourceUrl: 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/kensetsubu/douroseibi/7/1/1/1659.html', verifiedAt: '2026-09-05' },
  { slug: 'fukuroda', name: '袋田の滝', kind: 'nature', municipality: 'daigo', officialUrl: 'https://www.town.daigo.ibaraki.jp/page/page001474.html', sourceUrl: 'https://www.town.daigo.ibaraki.jp/page/page001474.html', verifiedAt: '2026-08-07' },
  { slug: 'tsukimachi-taki', name: '月待の滝', kind: 'nature', municipality: 'daigo', officialUrl: 'https://www.town.daigo.ibaraki.jp/page/page005706.html', sourceUrl: 'https://www.town.daigo.ibaraki.jp/page/page005706.html', verifiedAt: '2026-09-05' },
  { slug: 'okukuji-onsen', name: '奥久慈温泉郷', kind: 'area', municipality: 'daigo', officialUrl: 'https://www.daigo-kanko.jp/', sourceUrl: 'https://www.daigo-kanko.jp/', verifiedAt: '2026-08-07' },
  { slug: 'miho-tc', name: '美浦トレーニング・センター', kind: 'facility', municipality: 'miho', officialUrl: 'https://www.jra.go.jp/facilities/tc/miho/', sourceUrl: 'https://www.jra.go.jp/facilities/tc/miho/', verifiedAt: '2026-08-07' },
  { slug: 'okadaira', name: '陸平貝塚', kind: 'facility', municipality: 'miho', officialUrl: 'https://www.vill.miho.lg.jp/page/page000466.html', sourceUrl: 'https://www.vill.miho.lg.jp/page/page000466.html', verifiedAt: '2026-08-07' },
  { slug: 'yokaren', name: '予科練平和記念館', kind: 'facility', municipality: 'ami', officialUrl: 'https://www.yokaren-heiwa.jp/', sourceUrl: 'https://www.yokaren-heiwa.jp/', verifiedAt: '2026-08-07' },
  { slug: 'ami-outlet', name: 'あみプレミアム・アウトレット', kind: 'facility', municipality: 'ami', address: '茨城県稲敷郡阿見町よしわら4-1-1', officialUrl: 'https://www.town.ami.lg.jp/0000000173.html', sourceUrl: 'https://www.town.ami.lg.jp/0000010359.html', verifiedAt: '2026-09-05' },
  { slug: 'kawachi-denen', name: '水郷の田園', kind: 'area', municipality: 'kawachi', officialUrl: 'https://www.town.ibaraki-kawachi.lg.jp/', sourceUrl: 'https://www.town.ibaraki-kawachi.lg.jp/', verifiedAt: '2026-08-07' },
  { slug: 'yachiyo-green', name: '八千代グリーンビレッジ', kind: 'facility', municipality: 'yachiyo', address: '茨城県結城郡八千代町松本592', officialUrl: 'https://www.town.ibaraki-yachiyo.lg.jp/page/page000198.html', note: '憩遊館「やちよ乃湯」を含む複合施設', sourceUrl: 'https://www.town.ibaraki-yachiyo.lg.jp/page/page000198.html', verifiedAt: '2026-09-05' },
  { slug: 'michinoeki-goka', name: '道の駅 ごか', kind: 'facility', municipality: 'goka', address: '茨城県猿島郡五霞町ごかみらい13-3', officialUrl: 'https://www.michinoeki-goka.jp/', sourceUrl: 'https://www.michinoeki-goka.jp/page/page000016.html', verifiedAt: '2026-09-05' },
  { slug: 'michinoeki-sakai', name: '道の駅 さかい', kind: 'facility', municipality: 'sakai', officialUrl: 'https://www.sakaimachi.co.jp/', sourceUrl: 'https://www.ibarakiguide.jp/gourmet/michinoeki/michinoeki_sakai.html', verifiedAt: '2026-08-07' },
  { slug: 's-gallery', name: '境町粛粲寶美術館 S-Gallery', kind: 'facility', municipality: 'sakai', officialUrl: 'https://www.city.sakai.ibaraki.jp/', note: '隈研吾設計・2020年8月26日開館。道の駅さかい内の「さかいサンド」は別の施設', sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000005.000056181.html', verifiedAt: '2026-09-05' },
  { slug: 'fukawa', name: '布川の町並み', kind: 'area', municipality: 'tone', officialUrl: 'https://www.town.tone.ibaraki.jp/kanko-bunka/rekisibunka/yanagidakunio/page000175.html', sourceUrl: 'https://www.town.tone.ibaraki.jp/kanko-bunka/rekisibunka/yanagidakunio/page000175.html', verifiedAt: '2026-08-07' },
  { slug: 'koumou-jinja', name: '蛟蝄神社', kind: 'facility', municipality: 'tone', address: '茨城県北相馬郡利根町立木2184（門の宮）', officialUrl: 'https://www.town.tone.ibaraki.jp/kanko-bunka/rekisibunka/shiseki-bunkazai/page000161.html', note: '門の宮（立木2184）と奥の宮（立木882）の2社', sourceUrl: 'https://www.town.tone.ibaraki.jp/kanko-bunka/rekisibunka/shiseki-bunkazai/page000161.html', verifiedAt: '2026-09-05' },
];

export const SPOT_BY_SLUG = new Map(SPOTS.map((s) => [s.slug, s]));

/** slug の打ち間違いをビルド時に落とす */
export function getSpot(slug: string): Spot {
  const found = SPOT_BY_SLUG.get(slug);
  if (!found) throw new Error(`spots.ts に無いスポットです: ${slug}`);
  return found;
}

/** その市町村にあるスポット。alsoIn（またがるもの）も含める */
export function spotsOf(municipality: MunicipalitySlug): Spot[] {
  return SPOTS.filter(
    (s) => s.municipality === municipality || s.alsoIn?.includes(municipality),
  );
}
