/* =========================================================
   SUBSTRATA — product data
   Edit this file to add, rename or re-price works.
   Images live in the /images folder next to the HTML files.
   ========================================================= */
const IMG = "images/";

const PRICES = {
  print: 3000,   // A4 framed print, JPY, tax included
  psd: 10000     // layered PSD file, JPY, tax included
};

const SHIPPING = {
  yamato: { label: "Yamato Transport", note: "1–2 days within Japan, tracked", price: 1000 },
  post:   { label: "Japan Post",       note: "3–5 days, tracked",             price: 600 },
  pickup: { label: "Studio pickup — Kobe", note: "By appointment, bring your COA", price: 0 }
};

const TAX_RATE = 0.10; // Japanese consumption tax (prices already include it)

const COLLECTIONS = [
  {
    id: "heat-and-bone",
    name: "Heat & Bone",
    period: "JUL → NOV 2026",
    text_ja: "X線、炎、血を通り抜けた身体。赤のシリーズ：肋骨、ナイフの刺さった薔薇、切り開かれた心臓。",
    period_ja: "2026年7月 → 11月",
    text: "Bodies pushed through x-ray, fire and blood. The red run: ribcages, roses with knives, a heart cut open."
  },
  {
    id: "ghosts-in-plastic",
    name: "Ghosts in Plastic",
    period: "JUN → NOV 2026",
    text_ja: "ラップに包まれた人影、悪魔の飢え、遠ざかる残像。ここでは何ひとつ、息をすることを許されていない。",
    period_ja: "2026年6月 → 11月",
    text: "Figures wrapped in cling film, a demon’s hunger, an afterimage walking away from you. Nothing here is quite allowed to breathe."
  },
  {
    id: "the-watchers",
    name: "The Watchers",
    period: "JUN → OCT 2026",
    text_ja: "人間でなくなるまで拡大された目と鱗。沈黙には目がある。",
    period_ja: "2026年6月 → 10月",
    text: "Eyes and scales, enlarged until they stop being human. Silence has eyes."
  },
  {
    id: "wild-frequencies",
    name: "Wild Frequencies",
    period: "JUL → SEP 2026",
    text_ja: "街が目覚める前に、灰の中を駆け抜ける。馬、ネオン、信号ノイズ — アーカイブで最も騒がしい章。",
    period_ja: "2026年7月 → 9月",
    text: "Running through the ashes before the city awakens. Horses, neon and signal noise — the loudest chapter in the archive."
  }
];

/* stock: number of prints left out of 50. 0 = sold out (PSD stays available). */
const PRODUCTS = [
  {
    id: "afterburn", no: "020", name: "Afterburn", date: "NOV 2026", collection: "heat-and-bone",
    stock: 31, image: "afterburn.jpg", gallery: ["afterburn-detail.jpg", "afterburn-mono.jpg", "mock-stairs.jpg"],
    short: "X-rayed ribcage, ember field.",
    text: "Everything we carry, rendered in heat and bone. A human ribcage pushed through x-ray and fire until only the cage and the ember remain.",
    quote: "I wanted the body to look like evidence. Something recovered from a fire and logged by a machine that doesn’t care what it is looking at.",
    short_ja: "X線にかけられた肋骨、燃えさしの光。",
    text_ja: "背負うものすべてを、熱と骨で描く。X線と炎を通り抜け、残ったのは骨格と燃えさしだけ。",
    quote_ja: "身体を証拠のように見せたかった。火事の現場から回収され、何を見ているのかも気にしない機械に記録された何かのように。"
  },
  {
    id: "phantom-glint", no: "021", name: "Phantom Glint", date: "NOV 2026", collection: "ghosts-in-plastic",
    stock: 44, image: "phantom.jpg", gallery: ["phantom-detail.jpg", "phantom-mono.jpg", "mock-tee.jpg"],
    short: "A ghost under cling film.",
    text: "A ghost under cling film. The flare sits where the heart should be.",
    quote: "Plastic is the most honest skin. You can see everything and touch nothing.",
    short_ja: "ラップに包まれた亡霊。",
    text_ja: "ラップに包まれた亡霊。心臓があるはずの場所にフレアが宿る。",
    quote_ja: "プラスチックは最も正直な皮膚だ。すべてが見えるのに、何にも触れられない。"
  },
  {
    id: "wild-frequencies", no: "019", name: "Wild Frequencies", date: "SEP 2026", collection: "wild-frequencies",
    stock: 0, image: "wild-frequencies.jpg", gallery: [],
    short: "Horses through the ash. Edition closed.",
    text: "Running through the ashes before the city awakens. Horses, neon and signal noise.",
    short_ja: "灰の中を駆ける馬。エディション終了。",
    text_ja: "街が目覚める前に、灰の中を駆け抜ける。馬、ネオン、信号ノイズ。"
  },
  {
    id: "thorns-of-steel", no: "017", name: "Thorns of Steel", date: "JUL 2026", collection: "heat-and-bone",
    stock: 22, image: "thorns-of-steel.jpg", gallery: [],
    short: "A rose with a knife in it.",
    text: "A rose grown from steel. One of five posters made in a single day.",
    short_ja: "ナイフの刺さった薔薇。",
    text_ja: "鋼から生まれた薔薇。1日で作った5枚のうちの1枚。"
  },
  {
    id: "primal-sense", no: "016", name: "Primal Sense", date: "JUL 2026", collection: "wild-frequencies",
    stock: 20, image: "primal-sense.jpg", gallery: [],
    short: "Instinct before language.",
    text: "Instinct before language. Part of the five-in-a-day run, July 2026.",
    short_ja: "言葉より先の本能。",
    text_ja: "言葉より先の本能。2026年7月、1日5枚シリーズの1枚。"
  },
  {
    id: "treat-me", no: "015", name: "Treat Me", date: "JUN 2026", collection: "the-watchers",
    stock: 30, image: "treat-me.jpg", gallery: [],
    short: "The edge of human. Chromatic tear.",
    text: "The edge of human. A chromatic tear runs straight through the eye.",
    short_ja: "人間の境界。色収差の裂け目。",
    text_ja: "人間の境界。色収差の裂け目が目を真っすぐ貫く。"
  },
  {
    id: "silence-has-eyes", no: "012", name: "Silence Has Eyes", date: "JUN 2026", collection: "the-watchers",
    stock: 18, image: "silence-has-eyes.jpg", gallery: [],
    short: "Everything watches back.",
    text: "Eyes and scales, enlarged until they stop being human. Everything watches back.",
    short_ja: "すべてが見つめ返す。",
    text_ja: "人間でなくなるまで拡大された目と鱗。すべてが見つめ返す。"
  },
  {
    id: "look-closer", no: "022", name: "Look Closer", date: "OCT 2026", collection: "the-watchers",
    stock: 40, image: "look-closer.jpg", gallery: [],
    short: "The closer you get, the less you see.",
    text: "The closer you get, the less you see. A study in looking.",
    short_ja: "近づくほど、見えなくなる。",
    text_ja: "近づくほど、見えなくなる。見ることについての習作。"
  },
  {
    id: "event-horizon", no: "023", name: "Event Horizon", date: "OCT 2026", collection: "ghosts-in-plastic",
    stock: 47, image: "event-horizon.jpg", gallery: [],
    short: "The point of no return.",
    text: "The point past which nothing comes back. Light bends, the figure stays.",
    short_ja: "帰還不能点。",
    text_ja: "何も戻ってこない境界。光は曲がり、人影は留まる。"
  },
  {
    id: "everything-hurts", no: "024", name: "Everything Hurts", date: "NOV 2026", collection: "heat-and-bone",
    stock: 50, image: "everything-hurts.jpg", gallery: [],
    short: "A heart cut open.",
    text: "A heart cut open on the table. Heat, blood and data.",
    short_ja: "切り開かれた心臓。",
    text_ja: "台の上で切り開かれた心臓。熱、血、そしてデータ。"
  },
  {
    id: "false-angle", no: "025", name: "False Angle", date: "NOV 2026", collection: "wild-frequencies",
    stock: 50, image: "false-angle.jpg", gallery: [],
    short: "Signal noise, wrong perspective.",
    text: "Signal noise and the wrong perspective. The newest work in the archive.",
    short_ja: "信号ノイズ、間違った視点。",
    text_ja: "信号ノイズと間違った視点。アーカイブで最も新しい作品。"
  }
];

function getProduct(id) { return PRODUCTS.find(p => p.id === id); }
function getCollection(id) { return COLLECTIONS.find(c => c.id === id); }
