/**
 * 茨城の「海／川／公園／山」テーマ特集データ。
 * 事実は公式・観光いばらきで裏取り（多くはエリアページ制作時に検証済み）。
 * 画像はCCライセンス／パブリックドメインで帰属を確認できたもののみ。クレジットは削除しない。
 * 見頃・日程・遊泳可否などは年・天候で変わるため、常緑表現＋公式確認導線とする。
 */

export interface ThemeImage { src: string; alt: string; credit: string; creditUrl: string; }
export interface ThemeSpot { name: string; area: string; areaSlug?: string; desc: string; image?: ThemeImage; mapQuery?: string; }
export interface ThemeSection { kicker: string; title: string; body: string; }
export interface Theme {
  slug: 'umi' | 'kawa' | 'koen' | 'yama';
  kicker: string;
  title: string;
  lead: string;
  hero: ThemeImage;
  sections: ThemeSection[];
  spotsHeading: string;
  spots: ThemeSpot[];
  practical: [string, string][];
  sources: { label: string; url: string }[];
  related: { slug: string; name: string }[];
  checkedAt: string;
  metaTitle: string;
  metaDescription: string;
}

const CHECKED = '2026年8月13日';

// ---- 帰属確認済みの画像 ----
const IMG_OARAI: ThemeImage = { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sunrise_of_the_Pacific_Ocean_-_Oarai_coast.jpg/1280px-Sunrise_of_the_Pacific_Ocean_-_Oarai_coast.jpg', alt: '大洗海岸から望む太平洋の日の出', credit: '写真：t.kunikuni / CC BY-SA 2.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:Sunrise_of_the_Pacific_Ocean_-_Oarai_coast.jpg' };
const IMG_FUKURODA: ThemeImage = { src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fukuroda%20Falls%2042.jpg?width=1280', alt: '大子町の袋田の滝', credit: '写真：Σ64 / CC BY 3.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:Fukuroda_Falls_42.jpg' };
const IMG_NEMOPHILA: ThemeImage = { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/2025_Hitachi_Seaside_Park.jpg/1280px-2025_Hitachi_Seaside_Park.jpg', alt: '国営ひたち海浜公園に咲くネモフィラ', credit: '写真：Kakidai / CC BY-SA 4.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:2025_Hitachi_Seaside_Park.jpg' };
const IMG_TSUKUBA: ThemeImage = { src: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Mt.Tsukuba.jpg', alt: '筑波山', credit: '写真：RESPITE / パブリックドメイン', creditUrl: 'https://commons.wikimedia.org/wiki/File:Mt.Tsukuba.jpg' };
const IMG_HITACHI_STATION: ThemeImage = { src: '/images/area/hitachi/station.jpg', alt: '海に張り出した日立駅', credit: '写真：Σ64 / CC BY 4.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:Hitachi_Station,_Ibaraki_01.jpg' };
const IMG_KAMINE: ThemeImage = { src: '/images/area/hitachi/kamine-park.jpg', alt: '日立市かみね公園', credit: '写真：Σ64 / CC BY 4.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:Kamine_Park,_Ibaraki_07.jpg' };
const IMG_OIWA: ThemeImage = { src: '/images/area/hitachi/oiwa-jinja.jpg', alt: '日立市・御岩神社の随神門', credit: '写真：Taisuke.Kasuya / CC BY-SA 4.0', creditUrl: 'https://commons.wikimedia.org/wiki/File:Zuishinmon_of_Oiwa-jinja_(Hitachi).jpg' };

export const THEMES: Record<Theme['slug'], Theme> = {
  umi: {
    slug: 'umi',
    kicker: 'IBARAKI COAST',
    title: '茨城の海',
    lead: '茨城の海岸線は、南北におよそ190キロメートル。北は五浦のような断崖と岩礁、南は鹿島灘のまっすぐな砂浜へと、表情を変えながら続きます。海に張り出した駅、波間に立つ鳥居、あんこうの揚がる漁港。太平洋に面したこの県の、海の入口をまとめました。',
    hero: IMG_OARAI,
    sections: [
      { kicker: '地形', title: '北は断崖、南は砂浜。', body: '県北の五浦や高戸小浜は、切り立った海食崖と入り江が続く荒々しい海。県南へ下ると、鹿島灘のまっすぐな砂浜に変わります。同じ県の海とは思えないほど、北と南で表情が違います。' },
      { kicker: '海の幸', title: '冬は、あんこうの季節。', body: '日立の久慈浜しらす、北茨城・大洗のあんこう、鹿島灘のはまぐり。とりわけ冬のあんこう鍋は茨城の看板です。水揚げや提供時期は年や店で変わるため、訪ねる前に確認を。' },
    ],
    spotsHeading: '海の名所',
    spots: [
      { name: '神磯の鳥居（大洗磯前神社）', area: '大洗町', areaSlug: 'oarai', desc: '斉衡3年(856年)、神が降り立ったと伝わる海辺の岩に立つ鳥居。波間の鳥居のうしろから昇る朝日は、茨城を代表する眺めです。日の出の時間は季節で大きく動くので、事前に調べて訪ねてください。', mapQuery: '大洗磯前神社 神磯の鳥居' },
      { name: '五浦海岸・六角堂', area: '北茨城市', areaSlug: 'kitaibaraki', desc: '岡倉天心が海に張り出す断崖に建てた六角形の堂。2011年の津波で流失し、翌年、創建当初の姿で再建されました。岩礁と入り江が続く荒々しい海は、天心や横山大観たちが拠点にした近代美術ゆかりの風景です。', mapQuery: '五浦海岸 六角堂 北茨城市' },
      { name: '日立駅と海岸', area: '日立市', areaSlug: 'hitachi', desc: '改札を抜けると、正面がまるごと海の日立駅。デザイン監修は日立市出身の建築家・妹島和世氏で、展望ホールから太平洋を一望できます。市内の海岸沿いには、烏帽子岩で知られる河原子など、高さの違う海の眺めが点在します。', image: IMG_HITACHI_STATION, mapQuery: '日立駅 茨城県日立市' },
      { name: '阿字ヶ浦海岸', area: 'ひたちなか市', areaSlug: 'hitachinaka', desc: '遠浅で人気の海水浴場。国営ひたち海浜公園にも近く、夏に賑わいます。' },
      { name: '高戸小浜海岸', area: '高萩市', areaSlug: 'takahagi', desc: '切り立った崖にはさまれた、二つの入り江を持つ景勝地。「日本の渚・百選」のひとつです。' },
      { name: '大洗サンビーチ', area: '大洗町', areaSlug: 'oarai', desc: '遠浅で家族連れに親しまれる海水浴場。すぐ近くに、サメの飼育数が日本一のアクアワールド茨城県大洗水族館があります。' },
      { name: '平潟港', area: '北茨城市', areaSlug: 'kitaibaraki', desc: 'あんこうの水揚げで知られる漁港。冬には新鮮な海の幸が集まり、あんこう料理を出す店が並びます。' },
      { name: '鹿島灘の砂浜', area: '鹿嶋市', areaSlug: 'kashima', desc: '鹿嶋から神栖・鉾田へと、まっすぐな砂浜が続きます。はまぐりの産地で、サーフィンでも知られます。' },
    ],
    practical: [
      ['日の出を見る', '神磯の鳥居や日立の海は日の出の名所です。日の出時刻は夏は早く、冬は遅く、季節で大きく変わります。事前に調べてから訪ねてください。'],
      ['海水浴', '遊泳期間・遊泳可否・監視員の有無は、海水浴場ごと・年ごとに変わります。開設情報を確認してから出かけてください。'],
      ['岩場と波', '五浦や河原子などの岩場は、足元が不安定で波にも注意が必要です。無理に近づかないでください。'],
      ['冬のあんこう', 'あんこう鍋は冬が中心です。平潟・大洗などで味わえますが、提供時期は店ごとに確認を。'],
    ],
    sources: [
      { label: '観光いばらき（県公式）', url: 'https://www.ibarakiguide.jp/' },
      { label: '大洗観光協会（公式）', url: 'https://www.oarai-info.jp/' },
      { label: '北茨城市ゆかりの人物・岡倉天心｜北茨城市', url: 'https://www.city.kitaibaraki.lg.jp/docs/2015022000264/' },
      { label: '高萩市観光協会（公式）', url: 'https://www.takahagi-kanko.jp/' },
    ],
    related: [
      { slug: 'oarai', name: '大洗町' }, { slug: 'kitaibaraki', name: '北茨城市' }, { slug: 'hitachi', name: '日立市' }, { slug: 'hitachinaka', name: 'ひたちなか市' }, { slug: 'takahagi', name: '高萩市' }, { slug: 'kashima', name: '鹿嶋市' }, { slug: 'kamisu', name: '神栖市' }, { slug: 'hokota', name: '鉾田市' },
    ],
    checkedAt: CHECKED,
    metaTitle: '茨城の海｜断崖の五浦から砂浜の鹿島灘まで・海岸の名所ガイド｜イバトコ',
    metaDescription: '南北190キロの茨城の海岸線。神磯の鳥居（大洗）、六角堂の五浦海岸（北茨城）、海に張り出す日立駅、日本の渚・百選の高戸小浜、鹿島灘の砂浜まで。海の名所と海の幸、訪ねる前の注意点をまとめました。',
  },

  kawa: {
    slug: 'kawa',
    kicker: 'IBARAKI RIVERS',
    title: '茨城の川',
    lead: '茨城には、性格の違う川が流れています。関東随一の清流とされる那珂川、日本三名瀑・袋田の滝を生む久慈川の流域、県境をなす大河・利根川。滝や渓谷、河川敷の花火まで、この県の水辺の風景をまとめました。',
    hero: IMG_FUKURODA,
    sections: [
      { kicker: '清流', title: '那珂川と、久慈川の滝。', body: '那珂川は関東随一の清流とされ、鮎やカヌーの川。久慈川の流域には、大岩壁を四段に落ちる日本三名瀑・袋田の滝がかかります。山あいには、渓谷と吊橋、滝が集まっています。' },
      { kicker: '大河', title: '県境をなす、利根川。', body: '県南から県西の県境をなす利根川と、その支流の鬼怒川・小貝川。広い河川敷は花火大会の舞台にもなり、田園には花畑が広がります。' },
    ],
    spotsHeading: '川と滝、渓谷',
    spots: [
      { name: '袋田の滝', area: '大子町', areaSlug: 'daigo', desc: '高さ120メートル、幅73メートル。大岩壁を四段に落ちることから「四度（よど）の滝」とも呼ばれ、日本三名瀑のひとつ、国の名勝に数えられます。厳冬期には全体が凍る「氷瀑」が見られることもあります。', mapQuery: '袋田の滝 大子町' },
      { name: '竜神峡・竜神大吊橋', area: '常陸太田市', areaSlug: 'hitachiota', desc: '竜神峡にかかる、全長375メートルの歩行者専用吊橋（歩行者専用としては日本最大級）。橋の上からは高さ100メートルの日本一高いバンジージャンプもでき、新緑と紅葉の渓谷が広がります。', mapQuery: '竜神大吊橋 常陸太田市' },
      { name: '那珂川・御前山', area: '常陸大宮市', areaSlug: 'hitachiomiya', desc: '「関東の嵐山」と呼ばれる御前山のふもとを、関東随一の清流とされる那珂川が流れます。鮎釣りやカヌー、秋の紅葉が楽しめます。' },
      { name: '花貫渓谷・汐見滝吊り橋', area: '高萩市', areaSlug: 'takahagi', desc: '秋になると、汐見滝吊り橋のあたりで川の上に枝が張り出し、赤や黄に色づいた木々が橋を包む「紅葉のトンネル」になります。' },
      { name: '月待の滝', area: '大子町', areaSlug: 'daigo', desc: '裏側から眺められる珍しい滝。袋田の滝とあわせて、奥久慈の水辺をめぐれます。' },
      { name: '利根川', area: '境町', areaSlug: 'sakai', desc: '県南から県西の県境をなす大河。広い河川敷は花火大会の舞台にもなり、境町・古河・取手・利根町などに水辺の風景が続きます。' },
      { name: '小貝川ふれあい公園', area: '下妻市', areaSlug: 'shimotsuma', desc: '小貝川のほとりの公園。春はポピー、秋はコスモスが一面に咲く花畑で知られます。' },
      { name: '渡良瀬遊水地', area: '古河市', areaSlug: 'koga', desc: 'ラムサール条約に登録された広大な湿地。ヨシ原と水辺が広がり、サイクリングや熱気球で親しまれています。栃木・群馬・埼玉と接する、県の西端の水辺です。' },
    ],
    practical: [
      ['滝の見頃', '袋田の滝は新緑・紅葉・氷瀑と季節で姿が変わります。氷瀑は年により凍らないこともあるため、大子町観光協会の凍結情報で確認してください。'],
      ['紅葉と混雑', '竜神峡・花貫渓谷・御前山は例年11月ごろが見頃。まつり期間は周辺が混雑し、交通規制やシャトルバス運行になることがあります。'],
      ['川遊びと増水', '川遊び・鮎釣り・カヌーは、増水や天候に注意。上流で雨が降ると、晴れていても水位が上がることがあります。'],
      ['河川敷の花火', '利根川・渡良瀬川の河川敷では、夏に大きな花火大会が開かれます。日程は年で変わります（詳しくは〈茨城の花火〉のページで）。'],
    ],
    sources: [
      { label: '観光いばらき（県公式）', url: 'https://www.ibarakiguide.jp/' },
      { label: '大子町観光協会（袋田の滝・氷瀑情報）', url: 'https://www.daigo-kanko.jp/' },
      { label: '竜神大吊橋（公式）', url: 'https://ohtsuribashi.ryujinkyo.jp/' },
      { label: '御前山ハイキングコース｜常陸大宮市', url: 'https://www.city.hitachiomiya.lg.jp/kankou_guide/activity/hiking/page002934.html' },
    ],
    related: [
      { slug: 'daigo', name: '大子町' }, { slug: 'hitachiota', name: '常陸太田市' }, { slug: 'hitachiomiya', name: '常陸大宮市' }, { slug: 'takahagi', name: '高萩市' }, { slug: 'sakai', name: '境町' }, { slug: 'koga', name: '古河市' }, { slug: 'shimotsuma', name: '下妻市' }, { slug: 'joso', name: '常総市' },
    ],
    checkedAt: CHECKED,
    metaTitle: '茨城の川｜日本三名瀑・袋田の滝と那珂川の清流・渓谷ガイド｜イバトコ',
    metaDescription: '日本三名瀑・袋田の滝（大子）、日本一高いバンジーの竜神大吊橋（常陸太田）、関東随一の清流・那珂川、紅葉トンネルの花貫渓谷、利根川と渡良瀬遊水地まで。茨城の川・滝・渓谷の名所と、訪ねる前の注意点をまとめました。',
  },

  koen: {
    slug: 'koen',
    kicker: 'IBARAKI PARKS',
    title: '茨城の公園',
    lead: '茨城の公園は、花の名所が多いのが特徴です。世界的に知られるネモフィラの丘、日本三名園の梅、八重桜の里、バラや桃。同じ場所が季節で色を変える、茨城の公園と庭園をまとめました。',
    hero: IMG_NEMOPHILA,
    sections: [
      { kicker: '花の丘と庭園', title: '同じ丘が、季節で色を変える。', body: '国営ひたち海浜公園のみはらしの丘は、春は約530万本のネモフィラで青く、秋は約3万2千本のコキアで赤く。水戸・偕楽園では約100品種3,000本の梅が、早咲きから遅咲きへと長く咲きます。' },
      { kicker: '桜の名所', title: '花見の季節を、長く。', body: 'かみね公園や古河の桃、そして静峰ふるさと公園の八重桜。八重桜はソメイヨシノより遅く咲くため、県内の桜が終わったあとに見頃を迎えます。時期をずらして、花の季節を延ばせます。' },
    ],
    spotsHeading: '公園と庭園',
    spots: [
      { name: '国営ひたち海浜公園', area: 'ひたちなか市', areaSlug: 'hitachinaka', desc: '「みはらしの丘」は、4月中旬から5月上旬に約530万本のネモフィラで青く染まり、10月中旬には約3万2千本のコキアが赤く紅葉します。同じ丘が季節で色を変えます。', mapQuery: '国営ひたち海浜公園' },
      { name: '偕楽園', area: '水戸市', areaSlug: 'mito', desc: '天保13年(1842年)開園。金沢の兼六園、岡山の後楽園と並ぶ日本三名園のひとつです。梅まつりの時期には約100品種3,000本の梅が、早咲き・中咲き・遅咲きと順に咲きます。徳川斉昭自らが設計した好文亭が建ちます。', mapQuery: '偕楽園 水戸市' },
      { name: '千波公園（千波湖）', area: '水戸市', areaSlug: 'mito', desc: '偕楽園に隣接する、周囲約3キロメートルのひょうたん形の湖・千波湖を中心とした公園。桜並木の遊歩道やボート、ハクチョウ・コクチョウが楽しめます。' },
      { name: 'かみね公園', area: '日立市', areaSlug: 'hitachi', desc: '動物園・遊園地・展望台が高台に集まり、約1000本の桜が咲く「日本さくら名所100選」の一つ。2019年には夜景が日本夜景遺産に認定されました。', image: IMG_KAMINE, mapQuery: 'かみね公園 茨城県日立市' },
      { name: '静峰ふるさと公園', area: '那珂市', areaSlug: 'naka', desc: '「日本さくら名所100選」の一つ。約2,000本の八重桜が、ソメイヨシノより遅い時期に見頃を迎えます。花見の季節を一度延長できる場所です。' },
      { name: '茨城県フラワーパーク', area: '石岡市', areaSlug: 'ishioka', desc: '四季の花が咲く公園。バラで知られ、夜のイルミネーションも行われます。' },
      { name: '笠間芸術の森公園', area: '笠間市', areaSlug: 'kasama', desc: '笠間焼を体感できる公園。ゴールデンウィークには、約200人の陶芸家や窯元が集まる県内最大の陶器市「陶炎祭（ひまつり）」が開かれます。' },
      { name: '古河公方公園（古河総合公園）', area: '古河市', areaSlug: 'koga', desc: '春に約1500本の桃が咲き誇る「桃まつり」の会場。広い園内で、季節の花と歴史的な景観が楽しめます。' },
    ],
    practical: [
      ['花の見頃', 'ネモフィラは4月中旬〜5月上旬、コキアの紅葉は10月中旬、梅は2月中旬〜3月、桜は3月下旬〜4月、八重桜は桜より遅め。見頃は年で動くため、公式の開花情報を確認してください。'],
      ['混雑', 'ネモフィラ・コキアや梅まつりの最盛期は、周辺道路と駐車場が大変混雑します。臨時駐車場や公共交通の案内を確認して。'],
      ['入園料', '国営ひたち海浜公園や偕楽園は、時期・区域によって入園料がかかります。'],
      ['夜のイベント', '偕楽園の夜梅祭、フラワーパークのイルミネーションなど、夜の催しもあります。開催日は各公式で確認を。'],
    ],
    sources: [
      { label: '国営ひたち海浜公園（公式）', url: 'https://www.hitachikaihin.jp/' },
      { label: '日本三名園 偕楽園（公式）', url: 'https://ibaraki-kairakuen.jp/' },
      { label: '静峰ふるさと公園｜那珂市', url: 'https://www.city.naka.lg.jp/event-kankou/kankou-spot/page000275.html' },
      { label: '観光いばらき（県公式）', url: 'https://www.ibarakiguide.jp/' },
    ],
    related: [
      { slug: 'hitachinaka', name: 'ひたちなか市' }, { slug: 'mito', name: '水戸市' }, { slug: 'hitachi', name: '日立市' }, { slug: 'naka', name: '那珂市' }, { slug: 'ishioka', name: '石岡市' }, { slug: 'kasama', name: '笠間市' }, { slug: 'koga', name: '古河市' }, { slug: 'bando', name: '坂東市' },
    ],
    checkedAt: CHECKED,
    metaTitle: '茨城の公園｜ネモフィラの丘・偕楽園の梅・八重桜の名所ガイド｜イバトコ',
    metaDescription: '約530万本のネモフィラと約3万2千本のコキアの国営ひたち海浜公園、日本三名園・偕楽園の梅、日本さくら名所100選のかみね公園と静峰ふるさと公園の八重桜、フラワーパークのバラまで。茨城の公園と庭園、花の見頃をまとめました。',
  },

  yama: {
    slug: 'yama',
    kicker: 'IBARAKI MOUNTAINS',
    title: '茨城の山',
    lead: '茨城の山は、高さではなく物語で読めます。日本百名山でいちばん低い筑波山、山そのものを信仰してきた御岩山、渓谷に架かる日本最大級の吊橋。低くても深い、茨城の山と渓谷をまとめました。',
    hero: IMG_TSUKUBA,
    sections: [
      { kicker: '信仰の山', title: '低くても、手を合わせてきた山。', body: '筑波山は「西の富士、東の筑波」と称され、古くから信仰を集めてきました。日立の御岩山は、山そのものを神体としてきた山。標高は高くなくても、人が長く祈ってきた山です。' },
      { kicker: '渓谷と紅葉', title: '滝と吊橋が、山あいに集まる。', body: '竜神峡の大吊橋、袋田の滝、花貫渓谷、奥久慈。県北の山あいには、滝と吊橋と紅葉が集まっています。秋は、茨城の山がもっとも色づく季節です。' },
    ],
    spotsHeading: '山と渓谷',
    spots: [
      { name: '筑波山', area: 'つくば市', areaSlug: 'tsukuba', desc: '標高877メートル、日本百名山で最も低い山です。男体山(871メートル)と女体山(877メートル)の二つの峰があり、「西の富士、東の筑波」と称されてきました。筑波山神社からケーブルカー、つつじヶ丘からロープウェイで山頂近くまで登れます。', mapQuery: '筑波山' },
      { name: '御岩山・御岩神社', area: '日立市', areaSlug: 'hitachi', desc: '御岩山そのものを信仰の対象としてきた神社で、いまも山頂へ向かう登拝の道が続きます。参道に立つ「三本杉」は樹高50メートルで、林野庁の「森の巨人たち100選」に選ばれています。登拝は15時までに始め、雨天・降雪時はできません。', image: IMG_OIWA, mapQuery: '御岩神社 茨城県日立市' },
      { name: '奥久慈男体山', area: '大子町', areaSlug: 'daigo', desc: '奥久慈の岩山。鎖場のある登山道と、山頂からの眺めで知られます。ふもとには袋田の滝や温泉があり、山と水辺を一日で巡れます。' },
      { name: '竜神峡・竜神大吊橋', area: '常陸太田市', areaSlug: 'hitachiota', desc: '全長375メートルの歩行者専用吊橋（日本最大級）から、渓谷を見下ろせます。新緑と紅葉の名所で、橋の上からは日本一高い100メートルのバンジージャンプもできます。' },
      { name: '花貫渓谷', area: '高萩市', areaSlug: 'takahagi', desc: '汐見滝吊り橋を包む「紅葉のトンネル」で知られる渓谷。秋にはライトアップも行われます。' },
      { name: '御前山（関東の嵐山）', area: '常陸大宮市', areaSlug: 'hitachiomiya', desc: '那珂川ごしに見る紅葉が知られる、茨城百景のひとつ。ハイキングコースがあり、川と山の両方を楽しめます。' },
    ],
    practical: [
      ['登山の準備', '低山でも、登山道には険しい区間があります（奥久慈男体山の鎖場など）。歩きやすい靴と、天候・日没時間の確認を。'],
      ['ケーブルカー／ロープウェイ', '筑波山のケーブルカー・ロープウェイは、悪天候時に運休することがあり、冬季には定期点検の運休期間があります。運行状況を確認してから。'],
      ['登拝の時間', '御岩神社の登拝は15時までに始めてください。雨天・降雪・積雪時は登拝できません。山は日が暮れるのが早いので、早めの行動を。'],
      ['紅葉と混雑', '竜神峡・花貫渓谷・御前山・奥久慈は例年11月ごろが見頃。まつり期間は周辺が混雑し、交通規制が敷かれることがあります。'],
    ],
    sources: [
      { label: '筑波山ケーブルカー&ロープウェイ（公式）', url: 'https://mt-tsukuba.com/' },
      { label: '御岩神社（公式）', url: 'https://oiwajinja.jp/' },
      { label: '大子町観光協会（公式）', url: 'https://www.daigo-kanko.jp/' },
      { label: '竜神大吊橋（公式）', url: 'https://ohtsuribashi.ryujinkyo.jp/' },
    ],
    related: [
      { slug: 'tsukuba', name: 'つくば市' }, { slug: 'hitachi', name: '日立市' }, { slug: 'daigo', name: '大子町' }, { slug: 'hitachiota', name: '常陸太田市' }, { slug: 'takahagi', name: '高萩市' }, { slug: 'hitachiomiya', name: '常陸大宮市' }, { slug: 'kasama', name: '笠間市' },
    ],
    checkedAt: CHECKED,
    metaTitle: '茨城の山｜日本百名山最低峰の筑波山と奥久慈の渓谷ガイド｜イバトコ',
    metaDescription: '日本百名山で最も低い筑波山（標高877m）、山そのものを信仰する御岩山、鎖場の奥久慈男体山、日本最大級の竜神大吊橋、紅葉の花貫渓谷・御前山まで。茨城の山と渓谷の名所、登山前の注意点をまとめました。',
  },
};
