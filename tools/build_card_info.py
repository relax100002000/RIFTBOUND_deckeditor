#!/usr/bin/env python3
"""
tools/riftbound_cards.json  ->  js/card_info.js

riftbound_cards.json 由 tools/scrape_riftbound_console.js 在官網卡牌圖集頁
(https://playriftbound.com/zh-tw/card-gallery/) 的 Console 產生。

usage:  python tools/build_card_info.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "riftbound_cards.json")
DST = os.path.join(HERE, "..", "js", "card_info.js")

data = json.load(open(SRC, encoding="utf-8"))
rows = data["rows"]
fetched = data.get("fetched", "")[:10]

SET_ORDER = ["OGN", "OGS", "SFD", "UNL", "VEN", "RAD"]

def key(r):
    sid = r[0][:3]
    rest = r[0][4:]
    # 一般卡 -> 符文(R) -> 衍生物(T)
    grp = 0 if rest[:1].isdigit() else (1 if rest[:1] == "R" else 2)
    return (SET_ORDER.index(sid) if sid in SET_ORDER else 99, grp, rest)

rows.sort(key=key)
if any(len(r) != 23 for r in rows):
    sys.exit("riftbound_cards.json is from an old scraper (need 23 columns incl. English text/image)")
ids = [r[0] for r in rows]
if len(ids) != len(set(ids)):
    sys.exit("duplicate card id")

# 中文環境 = 官網繁中版已有中文資料的系列 (該系列一般卡有中文卡名)
zh_sets = []
for sid in SET_ORDER:
    rs = [r for r in rows if r[0].startswith(sid + "-")]
    if rs and sum(1 for r in rs if any(ord(ch) > 127 for ch in r[1])) * 2 >= len(rs):
        zh_sets.append(sid)
present_sets = [s for s in SET_ORDER if any(r[0].startswith(s + "-") for r in rows)]
print("zh env sets:", zh_sets)

def js(s):
    return json.dumps(s, ensure_ascii=False)

out = []
out.append("""/*
	符文戰場 Riftbound card data
	source: https://playriftbound.com/zh-tw/card-gallery/ (__NEXT_DATA__, zh_TW + en_US)
	fetched: %s (%d cards; 異圖 a / * / SP / 超框號碼不收，同名同類卡以最早系列的一般版為準)
	regenerate: tools/scrape_riftbound_console.js -> tools/riftbound_cards.json -> python tools/build_card_info.py
	官網目前只有 OGN / OGS / SFD 有繁中資料，UNL / VEN / RAD 為英文；英文名・能力・卡圖另存 (語言切換用)
*/

const ID = 0;		// 卡號 (OGN-001 / UNL-T01 / OGN-007 ...)
const NAME = 1;		// 卡名 (官網 zh-TW，無中文時為英文)
const SUB = 2;		// 副標題
const EN_NAME = 3;	// 英文卡名
const EN_SUB = 4;	// 英文副標題
const TYPE = 5;		// legend / unit / spell / gear / rune / battlefield / other
const SUPER = 6;	// champion / signature / token / basic
const DOMAIN = 7;	// fury / calm / mind / body / chaos / order / colorless ("/" 分隔；空白 = 官網未標示)
const ENERGY = 8;	// 能量 (費用)
const POWER = 9;	// 符能 (流派符文需求數)
const MIGHT = 10;	// 戰力
const MIGHTBONUS = 11;	// 裝備戰力加成
const TAGS = 12;	// 標籤 ("," 分隔；傳奇卡 = 英雄名)
const RARITY = 13;	// common / uncommon / rare / epic / showcase
const SETS = 14;	// 收錄系列 ("," 分隔)
const TEXT = 15;	// 能力文字 (<br> 分隔，:rb_xxx: 為圖示)
const EFFECT = 16;	// 裝備效果
const SRC = 17;		// 卡圖檔名 (IMG_BASE + file)
const ARTIST = 18;	// 繪師
const ORIENT = 19;	// "L" = 橫向 (戰場)
const EN_TEXT = 20;	// 英文能力文字
const EN_EFFECT = 21;	// 英文裝備效果
const EN_SRC = 22;	// 英文卡圖檔名

const IMG_BASE = "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/";

const PRODUCT_LIST = [
	["OGN", "起源", "Origins"],
	["OGS", "起源－試煉之地", "Proving Grounds"],
	["SFD", "鑄魂淬鍊", "Spiritforged"],
	["UNL", "潛能怒放", "Unleashed"],
	["VEN", "血海深仇", "Vendetta"],
	["RAD", "熠耀光彩", "Radiance"]
];

// 環境 (卡池)：中文版環境 = 繁中官網已有中文資料的系列 (build 時自動判定)，英文版環境 = 全部
const ENV_SETS = {
	zh: %s,
	en: %s
};

// 禁止卡 (官方 Rules Hub「Constructed Format Legality」https://playriftbound.com/en-us/rules-hub/ ，公告時手動更新)
const BAN_LIST_DATE = "2026-09-18";
const BAN_LIST = [
	"SFD-122",	// 打擊宣言 Called Shot
	"OGN-110",	// 艾克 - 回溯 Ekko, Recurrent
	"SFD-020",	// 達瑞文 - 征服勇士 Draven, Vanquisher
	"OGN-168",	// 戰或逃 Fight or Flight
	"OGN-182",	// 廢物利用 Scrapheap
	"OGN-177",	// 匿蹤追獵者 Stealthy Pursuer
	"OGN-183",	// 卡牌騙術 Stacked Deck
	"OGN-290",	// 競技場之巔 The Arena's Greatest (戰場)
	"OGN-276",	// 登峰之路 Aspirant's Climb (戰場)
	"OGN-292",	// 夢境之樹 The Dreaming Tree (戰場)
	"OGN-284",	// 力量方尖碑 Obelisk of Power (戰場)
	"OGN-285"	// 掠奪者船頭 Reaver's Row (戰場)
];
// 2v2 Constructed 另外禁止 (BAN_LIST 也適用 2v2)
const BAN_LIST_2V2 = [
	"OGS-019"	// 無極劍聖 Master Yi, Wuju Bladesman (傳奇)
];
// 限制卡 (官方目前無此制度)
const LIMIT_LIST = [];

const cardData = [""" % (fetched, len(rows), js(zh_sets), js(present_sets)))

for r in rows:
    out.append("\t[" + ",".join(js(x) for x in r) + "],")
out.append("];\n")

with open(DST, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(out))
print("wrote", DST, len(rows), "cards")
