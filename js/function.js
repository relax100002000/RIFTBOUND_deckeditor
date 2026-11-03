/*
	符文戰場 Riftbound Deck Builder
	based on WIXOSS_deckeditor (WWB_deckeditor / ANGE_UNITE_deckeditor と同じ構成)

	加卡時只限制張數上限 (不做構築規則檢查)
	- 傳奇: 1 張 (點別張傳奇會直接替換)
	- 主牌組: 40 張、同卡 3 張、專屬卡 (Signature) 合計 3 張
	- 符文牌組: 12 張
	- 戰場: 3 張、同卡 1 張
	禁止卡 (BAN_LIST / BAN_LIST_2V2) 只標示 (紅框＋提示)，不阻擋加入

	語言切換 (中 / EN): 卡名・能力・卡圖・介面文字一起切換 (localStorage: rb_lang)
	環境切換 (卡池): 中文版環境只能搜尋／加入 ENV_SETS.zh 的系列，牌組中的環境外卡片以藍色虛線框標示 (localStorage: rb_env)
*/

const LEGEND_MAX = 1;
const MAIN_MAX = 40;
const RUNE_MAX = 12;
const BF_MAX = 3;
const SAME_ID_MAIN = 3;
const SIGNATURE_MAX = 3;
const PAGE_SIZE = 10;

const DECK_LIST_KEY = "RBDeckNameList";
const DECK_KEY_PREFIX = "RB_deck_";
const COMMENT_SUFFIX = "_RBcomment";
const DARK_KEY = "rb_dark_mode";
const LANG_KEY = "rb_lang";
const ENV_KEY = "rb_env";

const DOMAIN_ORDER = ["fury", "calm", "mind", "body", "chaos", "order", "colorless", ""];
const DOMAIN_HEX = { fury: "#d8423a", calm: "#3fae5a", mind: "#3f86d1", body: "#e08a2c", chaos: "#8a4fc2", order: "#d4af1f", colorless: "#9e9e9e", "": "#5f6b73" };
const DOMAIN_CHECK = { fury: "d_fury", calm: "d_calm", mind: "d_mind", body: "d_body", chaos: "d_chaos", order: "d_order", colorless: "d_colorless", "": "d_none" };
const TYPE_ORDER = ["legend", "unit", "spell", "gear", "rune", "battlefield", "other"];
const COST_MAX_BUCKET = 8;	// 8+

/* ========================================================= */
/*  i18n                                                      */
/* ========================================================= */

var LANG = "zh";
try { if(localStorage.getItem(LANG_KEY) == "en") LANG = "en"; } catch(e) {}

// 環境 (卡池): "en" = 英文版 (全系列) / "zh" = 中文版 (ENV_SETS.zh)
var ENV = "en";
try { if(localStorage.getItem(ENV_KEY) == "zh") ENV = "zh"; } catch(e) {}

const I18N = {
	zh: {
		dom_fury: "狂怒", dom_calm: "止靜", dom_mind: "心智", dom_body: "身軀", dom_chaos: "渾沌", dom_order: "秩序", dom_colorless: "無色", dom_: "未標示",
		type_legend: "傳奇", type_unit: "單位", type_spell: "法術", type_gear: "裝備", type_rune: "符文", type_battlefield: "戰場", type_other: "其他",
		super_champion: "英雄", super_signature: "專屬", super_token: "衍生物", super_basic: "基本",
		zone_legend: "傳奇", zone_bf: "戰場", zone_rune: "符文牌組", zone_main: "主牌組",
		f_type: "種類", f_sub: "單位・法術・裝備", f_normal: "一般", f_domain: "流派", f_cost: "費用", f_champion: "英雄", f_tag: "標籤", f_rarity: "稀有度",
		f_onlyLegend: "只顯示傳奇流派可用的卡（含該英雄的專屬卡）",
		f_keyword: "關鍵字搜尋", f_keyword_ph: "卡名 / 英文名 / 能力 / 標籤 / 卡號 (空白 = AND)", f_set: "系列",
		sort_0: "卡號順", sort_1: "種類→費用順", sort_2: "流派→費用順", sort_3: "戰力順 (高→低)",
		link_official: "官方網站:", link_source: "卡片資料・卡圖來源:",
		all_champion: "--All 英雄--", all_tag: "--All 標籤--", all_set: "--All 系列--",
		i_id: "卡號", i_name: "卡名", i_other: "中文名", i_type: "種類", i_domain: "流派", i_champ: "英雄", i_stats: "數值", i_tags: "標籤", i_ban: "禁限",
		s_energy: "能量", s_power: "符能", s_might: "戰力", s_mightbonus: "戰力加成", i_effect: "裝備效果",
		ban_std: "禁止卡（Standard／2v2 Constructed）", ban_2v2: "禁止卡（2v2 Constructed）", limit1: "限制卡 (1張)",
		chosen: "★選定英雄",
		chart_cost: "費用 ", chart_champ: "英雄單位",
		d_unit: "單位", d_spell: "法術", d_gear: "裝備", d_sig: "專屬", d_ban: "⚠禁止卡 {n} 張", d_legend: "傳奇",
		t_token: "衍生物不能放進牌組", t_ban: "注意：{name} 是禁止卡（{date} 禁卡表）", t_ban2: "注意：{name} 在 2v2 Constructed 是禁止卡",
		t_legend: "已替換傳奇：{name}", t_bfmax: "戰場最多 {n} 張", t_bfsame: "同一張戰場只能放 1 張", t_runemax: "符文牌組最多 {n} 張",
		t_mainmax: "主牌組最多 {n} 張", t_same: "同名卡最多 {n} 張", t_sig: "專屬卡合計最多 {n} 張", t_unknown: "不明的卡號: ",
		img_ng: "IMAGE NOT LOADED", img_none: "NO IMAGE", any_rune: "任意符能", rune_suffix: "符能", exhaust: "橫置",
		view_tag: "[禁]",
		env_btn_zh: "🃏 中文版環境", env_btn_en: "🃏 英文版環境", env_title: "切換卡池：中文版環境（{zh}）／英文版環境（全系列）",
		t_env: "{name} 不在中文版環境（{sets}）", d_env: "⚠環境外 {n} 張", i_env: "環境", env_out: "中文版環境未收錄", t_envset: "已切換：{env}"
	},
	en: {
		dom_fury: "Fury", dom_calm: "Calm", dom_mind: "Mind", dom_body: "Body", dom_chaos: "Chaos", dom_order: "Order", dom_colorless: "Colorless", dom_: "Unlisted",
		type_legend: "Legend", type_unit: "Unit", type_spell: "Spell", type_gear: "Gear", type_rune: "Rune", type_battlefield: "Battlefield", type_other: "Other",
		super_champion: "Champion", super_signature: "Signature", super_token: "Token", super_basic: "Basic",
		zone_legend: "Legend", zone_bf: "Battlefields", zone_rune: "Rune Deck", zone_main: "Main Deck",
		f_type: "Type", f_sub: "Unit / Spell / Gear", f_normal: "Regular", f_domain: "Domain", f_cost: "Energy", f_champion: "Champion", f_tag: "Tag", f_rarity: "Rarity",
		f_onlyLegend: "Only cards usable with the Legend's domains (incl. its Signature cards)",
		f_keyword: "Keyword", f_keyword_ph: "name / Chinese name / text / tag / card no. (space = AND)", f_set: "Set",
		sort_0: "Card No.", sort_1: "Type → Energy", sort_2: "Domain → Energy", sort_3: "Might (high → low)",
		link_official: "Official site:", link_source: "Card data & images:",
		all_champion: "--All Champions--", all_tag: "--All Tags--", all_set: "--All Sets--",
		i_id: "No.", i_name: "Name", i_other: "Chinese", i_type: "Type", i_domain: "Domain", i_champ: "Champion", i_stats: "Stats", i_tags: "Tags", i_ban: "Banned",
		s_energy: "Energy", s_power: "Power", s_might: "Might", s_mightbonus: "Might Bonus", i_effect: "Equipped effect",
		ban_std: "Banned (Standard / 2v2 Constructed)", ban_2v2: "Banned (2v2 Constructed)", limit1: "Limited (1 copy)",
		chosen: "★Chosen",
		chart_cost: "E", chart_champ: "Champion Unit",
		d_unit: "Units", d_spell: "Spells", d_gear: "Gear", d_sig: "Signature", d_ban: "⚠Banned {n}", d_legend: "Legend",
		t_token: "Tokens can't be put in a deck", t_ban: "Note: {name} is banned ({date} ban list)", t_ban2: "Note: {name} is banned in 2v2 Constructed",
		t_legend: "Legend replaced: {name}", t_bfmax: "Up to {n} battlefields", t_bfsame: "Only 1 copy of each battlefield", t_runemax: "Rune deck is up to {n} cards",
		t_mainmax: "Main deck is up to {n} cards", t_same: "Up to {n} copies of the same card", t_sig: "Up to {n} Signature cards in total", t_unknown: "Unknown card no.: ",
		img_ng: "IMAGE NOT LOADED", img_none: "NO IMAGE", any_rune: "any rune", rune_suffix: " rune", exhaust: "exhaust",
		view_tag: "[BAN]",
		env_btn_zh: "🃏 Chinese pool", env_btn_en: "🃏 English pool", env_title: "Card pool: Chinese release ({zh}) / English release (all sets)",
		t_env: "{name} is not in the Chinese release ({sets})", d_env: "⚠Out of pool {n}", i_env: "Pool", env_out: "Not in the Chinese release", t_envset: "Switched to: {env}"
	}
};

function T(key, vars)
{
	var s = I18N[LANG][key];
	if(s === undefined) s = I18N.zh[key];
	if(s === undefined) return key;
	if(vars) for(var k in vars) s = s.replace("{" + k + "}", vars[k]);
	return s;
}
function domLabel(d) { return T("dom_" + (d || "")); }
function typeLabel(t) { return T("type_" + t); }
function superLabel(s) { return T("super_" + s); }

/* ========================================================= */
/*  State                                                     */
/* ========================================================= */

var cardById = {};
var champZh = {};	// 英文英雄名 -> 中文名 (有的話)
var rdeckArr = [];
var page = 0;

var legendArr = [];
var mainArr = [];
var runeArr = [];
var bfArr = [];

var deckNamelist = [];

var costobj = null, domainobj = null, typeobj = null;

/* ========================================================= */
/*  Init                                                      */
/* ========================================================= */

// function.js is loaded before jQuery, so wait for DOMContentLoaded instead of $(document).ready
window.addEventListener('DOMContentLoaded', function() {
	for(var i = 0; i < cardData.length; i++)
	{
		cardById[cardData[i][ID]] = cardData[i];
	}
	buildChampZh();

	buildFilterControls();
	buildDeckSlots();
	buildResultSlots();
	buildCharts();
	applyLangStatic();
	showInfotable(null);

	document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
	document.getElementById('commentFileinput').addEventListener('change', readSingleCommentFile, false);

	$("#textsearch").keydown(function(event) {
		if(event.keyCode == 13) search();
	});
	$("#selectChampion, #selectTag, #selectRarity, #selectProduct").change(search);

	onloaddeck();
	search();
	showAlldeck();
	updateDarkModeButton();
	applyDarkModeImages();
});

function hideInfo()
{
	$('#cardinformation').css('visibility', 'hidden');
}

function escapeHtml(s)
{
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function isAscii(s) { return /^[\x00-\x7F]*$/.test(s); }

function superList(c) { return c[SUPER] ? c[SUPER].split("/") : []; }
function hasSuper(c, s) { return superList(c).indexOf(s) != -1; }
function isToken(c) { return hasSuper(c, "token") || c[TYPE] == "other"; }
function isChampionUnit(c) { return c[TYPE] == "unit" && hasSuper(c, "champion"); }
function isSignature(c) { return hasSuper(c, "signature"); }
function domainList(c) { return c[DOMAIN] ? c[DOMAIN].split("/") : [""]; }
function tagList(c) { return c[TAGS] ? c[TAGS].split(",") : []; }
function isLandscape(c) { return c[ORIENT] == "L"; }
function inEnv(c)
{
	if(ENV != "zh") return true;
	var ss = c[SETS].split(",");
	for(var i = 0; i < ss.length; i++) if(ENV_SETS.zh.indexOf(ss[i]) != -1) return true;
	return false;
}
function isBanned(c) { return BAN_LIST.indexOf(c[ID]) != -1; }
function isBanned2v2(c) { return BAN_LIST_2V2.indexOf(c[ID]) != -1; }
function banMarkCss(img, c)
{
	img.toggleClass("empty", !c);
	img.toggleClass("banned", !!(c && isBanned(c)));
	img.toggleClass("banned-2v2", !!(c && !isBanned(c) && isBanned2v2(c)));
	img.toggleClass("out-env", !!(c && !inEnv(c)));
}

// 依語言取卡片欄位
function cName(c) { return LANG == "en" ? c[EN_NAME] : c[NAME]; }
function cSub(c) { return LANG == "en" ? c[EN_SUB] : c[SUB]; }
function cText(c) { return LANG == "en" ? (c[EN_TEXT] || c[TEXT]) : c[TEXT]; }
function cEffect(c) { return LANG == "en" ? (c[EN_EFFECT] || c[EFFECT]) : c[EFFECT]; }
function cSrc(c) { return LANG == "en" ? (c[EN_SRC] || c[SRC]) : c[SRC]; }

function zoneOf(c)
{
	if(isToken(c)) return null;
	if(c[TYPE] == "legend") return "legend";
	if(c[TYPE] == "battlefield") return "bf";
	if(c[TYPE] == "rune") return "rune";
	if(c[TYPE] == "unit" || c[TYPE] == "spell" || c[TYPE] == "gear") return "main";
	return null;
}

function fullName(c)
{
	return cName(c) + (cSub(c) ? " - " + cSub(c) : "");
}

function otherFullName(c)
{
	return LANG == "en" ? c[NAME] + (c[SUB] ? " - " + c[SUB] : "") : c[EN_NAME] + (c[EN_SUB] ? " - " + c[EN_SUB] : "");
}

function buildChampZh()
{
	for(var i = 0; i < cardData.length; i++)
	{
		var c = cardData[i];
		if(!isChampionUnit(c)) continue;
		if(!champZh[c[EN_NAME]] || (isAscii(champZh[c[EN_NAME]]) && !isAscii(c[NAME]))) champZh[c[EN_NAME]] = c[NAME];
	}
}

function champLabel(en)
{
	if(LANG == "en") return en;
	var zh = champZh[en];
	return (zh && zh != en) ? zh + " (" + en + ")" : en;
}

function productLabel(code)
{
	for(var i = 0; i < PRODUCT_LIST.length; i++)
	{
		if(PRODUCT_LIST[i][0] == code) return "[" + code + "] " + (LANG == "en" ? (PRODUCT_LIST[i][2] || PRODUCT_LIST[i][1]) : PRODUCT_LIST[i][1]);
	}
	return code;
}

function buildFilterControls()
{
	var i, str;

	// 流派
	str = "";
	for(i = 0; i < DOMAIN_ORDER.length; i++)
	{
		var d = DOMAIN_ORDER[i];
		str += "<input type=\"checkbox\" id=\"" + DOMAIN_CHECK[d] + "\" checked><span onclick=\"clickSpan(this)\"><i class=\"color-chip\" style=\"background:" + DOMAIN_HEX[d] + "\"></i><bdi data-i18n=\"dom_" + d + "\">" + domLabel(d) + "</bdi> </span>&ensp;";
	}
	$("#domainChecks").html(str);

	// 費用
	str = "";
	for(i = 0; i <= COST_MAX_BUCKET; i++)
	{
		str += "<input type=\"checkbox\" id=\"cost_" + i + "\" checked><span onclick=\"clickSpan(this)\">" + i + (i == COST_MAX_BUCKET ? "+" : "") + " </span>&ensp;";
	}
	$("#costChecks").html(str);

	buildSelectOptions();
}

// 英雄 / 標籤 / 系列 下拉選單 (切換語言時重建，保留目前選擇)
function buildSelectOptions()
{
	var i, str;
	var keep = { c: $("#selectChampion").val() || "0", t: $("#selectTag").val() || "0", p: $("#selectProduct").val() || "0" };

	var champs = [];
	for(i = 0; i < cardData.length; i++)
	{
		if(cardData[i][TYPE] != "legend") continue;
		var ts = tagList(cardData[i]);
		for(var k = 0; k < ts.length; k++) if(champs.indexOf(ts[k]) == -1) champs.push(ts[k]);
	}
	champs.sort();
	str = "<option value=\"0\">" + T("all_champion") + "</option>";
	for(i = 0; i < champs.length; i++) str += "<option value=\"" + escapeHtml(champs[i]) + "\">" + escapeHtml(champLabel(champs[i])) + "</option>";
	$("#selectChampion").html(str).val(keep.c);

	var tags = [];
	for(i = 0; i < cardData.length; i++)
	{
		if(cardData[i][TYPE] == "legend") continue;
		var tl = tagList(cardData[i]);
		for(var t = 0; t < tl.length; t++) if(tags.indexOf(tl[t]) == -1) tags.push(tl[t]);
	}
	tags.sort();
	str = "<option value=\"0\">" + T("all_tag") + "</option>";
	for(i = 0; i < tags.length; i++) str += "<option value=\"" + escapeHtml(tags[i]) + "\">" + escapeHtml(tags[i]) + "</option>";
	$("#selectTag").html(str).val(keep.t);

	str = "<option value=\"0\">" + T("all_set") + "</option>";
	for(i = 0; i < PRODUCT_LIST.length; i++)
	{
		if(ENV == "zh" && ENV_SETS.zh.indexOf(PRODUCT_LIST[i][0]) == -1) continue;
		str += "<option value=\"" + PRODUCT_LIST[i][0] + "\">" + escapeHtml(productLabel(PRODUCT_LIST[i][0])) + "</option>";
	}
	$("#selectProduct").html(str).val(keep.p);
	if($("#selectProduct").val() == null) $("#selectProduct").val("0");
}

// 介面靜態文字 (data-i18n / data-i18n-ph)
function applyLangStatic()
{
	document.documentElement.lang = LANG == "en" ? "en" : "zh-Hant";
	$("[data-i18n]").each(function() {
		var key = this.getAttribute("data-i18n");
		var isCheckLabel = this.tagName == "SPAN" && this.getAttribute("onclick");
		this.textContent = T(key) + (isCheckLabel ? " " : "");
	});
	$("[data-i18n-ph]").each(function() { this.setAttribute("placeholder", T(this.getAttribute("data-i18n-ph"))); });
	$(".champ-mark").text(T("chosen"));
	var loc = LANG == "en" ? "en-us" : "zh-tw";
	$("#linkOfficial").attr("href", "https://playriftbound.com/" + loc + "/").text(LANG == "en" ? "Riftbound" : "符文戰場 Riftbound");
	$("#linkGallery").attr("href", "https://playriftbound.com/" + loc + "/card-gallery/").text(LANG == "en" ? "Card Gallery" : "卡牌圖集");
	$("#langToggle").text(LANG == "en" ? "🌐 中文" : "🌐 EN");
	$("#envToggle").text(T(ENV == "zh" ? "env_btn_zh" : "env_btn_en")).attr("title", T("env_title", { zh: ENV_SETS.zh.join("/") }));
	document.title = LANG == "en" ? "Riftbound Deck Builder" : "符文戰場 Riftbound Deck Builder";
}

function toggleLang()
{
	LANG = (LANG == "en") ? "zh" : "en";
	try { localStorage.setItem(LANG_KEY, LANG); } catch(e) {}
	applyLangStatic();
	buildSelectOptions();
	rebuildChartLabels();
	showrdeck();
	showAlldeck();
	// 預覽中的卡也一起切換
	var id = $("#big_pic").attr("alt");
	if(id && cardById[id] && $("#cardinformation").css("visibility") == "visible")
	{
		$("#big_pic").attr("src", cardImgSrc(cardById[id], true));
		showInfotable(cardById[id]);
	}
}

function toggleEnv()
{
	ENV = (ENV == "zh") ? "en" : "zh";
	try { localStorage.setItem(ENV_KEY, ENV); } catch(e) {}
	applyLangStatic();
	buildSelectOptions();
	search();
	showAlldeck();
	toast(T("t_envset", { env: T(ENV == "zh" ? "env_btn_zh" : "env_btn_en").replace("🃏 ", "") }));
}

/* ========================================================= */
/*  Slots                                                     */
/* ========================================================= */

function slotImg(zone, idx, w, h)
{
	return "<span class=\"deck-wrap\" style=\"margin-top: 0px;\"><img id=\"" + zone + "_" + idx + "\" class=\"deck-slot card\" width=\"" + w + "px\" height=\"" + h + "px\" src=\"img/empty.jpg\" alt=\"\"" +
		" onmouseover=\"onmouseShow(this, 'deck');\"" +
		" onclick=\"delDeck('" + zone + "', " + idx + ");\"" +
		" oncontextmenu=\"addDeck(this); return false;\">" +
		(zone == "main" ? "<span class=\"champ-mark\" id=\"mark_" + idx + "\" style=\"display:none;\">" + T("chosen") + "</span>" : "") +
		"</span>";
}

function buildDeckSlots()
{
	var i, str;

	$("#legendZone").html(slotImg("legend", 0, 86, 120));

	str = "";
	for(i = 0; i < BF_MAX; i++) str += slotImg("bf", i, 120, 86);
	$("#bfZone").html(str);

	str = "";
	for(i = 0; i < RUNE_MAX; i++)
	{
		str += slotImg("rune", i, 50, 70);
		if(i == 5) str += "<br>";
	}
	$("#runeZone").html(str);

	str = "";
	for(i = 0; i < MAIN_MAX; i++)
	{
		str += slotImg("main", i, 86, 120);
		if(i % 10 == 9 && i != MAIN_MAX - 1) str += "<br>";
	}
	$("#mainZone").html(str);
}

function buildResultSlots()
{
	var i, s0 = "", s1 = "";
	for(i = 0; i < PAGE_SIZE; i++)
	{
		var tag = "<img id=\"rdeck_" + i + "\" class=\"card\" onmouseover=\"onmouseShow(this, 'search');\" onclick=\"addDeck(this)\" oncontextmenu=\"return false;\" alt=\"\" height=\"172px\" width=\"123px\" src=\"img/empty.jpg\" style=\"cursor: pointer;\"> ";
		if(i < PAGE_SIZE / 2) s0 += tag; else s1 += tag;
	}
	$("#resultRow0").html(s0);
	$("#resultRow1").html(s1);
}

/* ========================================================= */
/*  Card image (text placeholder when the image cannot load)  */
/* ========================================================= */

var placeholderCache = {};
var failedSrc = {};
var cardBySrcFile = null;

// rotate: 橫向卡 (戰場) 放進直式欄位時轉 90 度 (目前沒有使用；搜尋結果改用 PIECE 式的橫向小卡)
function imgUrl(card, big, rotate)
{
	var w = big ? (isLandscape(card) ? 1039 : 744) : 300;
	var url = IMG_BASE + cSrc(card) + "?accountingTag=RB&fm=webp&q=85&w=" + w;
	if(rotate && isLandscape(card)) url += "&fit=max&or=90";
	return url;
}

function cardImgSrc(card, big, rotate)
{
	if(!card) return "img/empty.jpg";
	if(cSrc(card) && !failedSrc[cSrc(card)]) return imgUrl(card, big, rotate);
	return makePlaceholder(card, rotate);
}

// 官網圖片讀取失敗時 (離線 / 被擋) 改用文字版卡圖
document.addEventListener('error', function(e) {
	var img = e.target;
	if(!img || img.tagName !== 'IMG') return;
	var src = img.getAttribute('src') || "";
	if(src.indexOf(IMG_BASE) != 0) return;
	var file = src.substring(IMG_BASE.length).split("?")[0];
	failedSrc[file] = true;
	if(!cardBySrcFile)
	{
		cardBySrcFile = {};
		for(var i = 0; i < cardData.length; i++)
		{
			cardBySrcFile[cardData[i][SRC]] = cardData[i];
			if(cardData[i][EN_SRC]) cardBySrcFile[cardData[i][EN_SRC]] = cardData[i];
		}
	}
	var c = cardBySrcFile[file];
	if(c) img.setAttribute('src', makePlaceholder(c, src.indexOf("or=90") != -1));
}, true);

function makePlaceholder(card, rotate)
{
	var land = isLandscape(card) && !rotate;
	var ck = LANG + ":" + card[ID] + (land ? ":L" : "");
	if(placeholderCache[ck]) return placeholderCache[ck];

	var doms = domainList(card);
	var bg = DOMAIN_HEX[doms[0]] || "#5f6b73";
	var name = cName(card);
	var stat = typeLabel(card[TYPE]) + (superList(card).length ? "・" + superList(card).map(superLabel).join("・") : "");
	var stat2 = [];
	if(card[ENERGY] !== "") stat2.push(T("s_energy") + " " + card[ENERGY]);
	if(card[POWER] !== "") stat2.push(T("s_power") + " " + card[POWER]);
	if(card[MIGHT] !== "") stat2.push(T("s_might") + " " + card[MIGHT]);
	stat2 = stat2.join(" / ") || doms.map(domLabel).join("/");
	var esc = function(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
	var fs = Math.min(48, Math.floor((isAscii(name) ? 900 : 480) / Math.max(name.length, 1)));
	var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='573' height='800' viewBox='0 0 573 800'>" +
		"<rect width='573' height='800' rx='30' fill='#1e1e28'/>" +
		"<rect x='18' y='18' width='537' height='764' rx='22' fill='" + bg + "' opacity='0.85'/>" +
		"<rect x='40' y='150' width='493' height='420' rx='14' fill='#ffffff' opacity='0.85'/>" +
		"<text x='286' y='80' font-size='44' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='#fff'>" + esc(card[ID]) + "</text>" +
		"<text x='286' y='330' font-size='" + fs + "' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='#222'>" + esc(name) + "</text>" +
		"<text x='286' y='400' font-size='28' font-family='sans-serif' text-anchor='middle' fill='#444'>" + esc(cSub(card)) + "</text>" +
		"<text x='286' y='490' font-size='30' font-family='sans-serif' text-anchor='middle' fill='#666'>" + (cSrc(card) ? T("img_ng") : T("img_none")) + "</text>" +
		"<text x='286' y='650' font-size='34' font-family='sans-serif' text-anchor='middle' fill='#fff'>" + esc(stat) + "</text>" +
		"<text x='286' y='705' font-size='30' font-family='sans-serif' text-anchor='middle' fill='#fff'>" + esc(stat2) + "</text>" +
		"</svg>";
	if(land) svg = svg.replace("<svg xmlns='http://www.w3.org/2000/svg' width='573' height='800' viewBox='0 0 573 800'>",
		"<svg xmlns='http://www.w3.org/2000/svg' width='800' height='573' viewBox='0 0 800 573'><g transform='translate(800,0) rotate(90)'>").replace("</svg>", "</g></svg>");
	var uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	placeholderCache[ck] = uri;
	return uri;
}

/* ========================================================= */
/*  Legend helpers                                            */
/* ========================================================= */

function legendCard() { return legendArr.length ? legendArr[0] : null; }
function legendChamps() { var l = legendCard(); return l ? tagList(l) : []; }
function legendDomains() { var l = legendCard(); return l ? domainList(l).filter(function(d) { return d && d != "colorless"; }) : []; }

function intersects(a, b)
{
	for(var i = 0; i < a.length; i++) if(b.indexOf(a[i]) != -1) return true;
	return false;
}

// 傳奇的流派 / 英雄可用 (只用於篩選顯示，不阻擋加卡)
function usableWithLegend(c)
{
	var l = legendCard();
	if(!l) return true;
	if(isToken(c)) return false;
	if(c[TYPE] == "legend" || c[TYPE] == "battlefield") return true;
	var ld = legendDomains();
	var doms = domainList(c);
	for(var i = 0; i < doms.length; i++)
	{
		var d = doms[i];
		if(d == "" || d == "colorless") continue;
		if(ld.indexOf(d) == -1) return false;
	}
	if(isSignature(c) && !intersects(tagList(c), legendChamps())) return false;
	return true;
}

function isChosenCandidate(c)
{
	return isChampionUnit(c) && intersects(tagList(c), legendChamps());
}

/* ========================================================= */
/*  Search                                                    */
/* ========================================================= */

function search()
{
	var i;
	var keywords = $("#textsearch").val().replace(/　/g, " ").trim().toLowerCase().split(/\s+/).filter(function(s){ return s != ""; });
	var champ = $("#selectChampion").val();
	var tag = $("#selectTag").val();
	var rarity = $("#selectRarity").val();
	var product = $("#selectProduct").val();
	var onlyLegend = $("#onlyLegend").prop("checked");
	var showToken = $("#t_token").prop("checked");

	rdeckArr = [];

	for(i = 0; i < cardData.length; i++)
	{
		var c = cardData[i];

		if(!inEnv(c)) continue;

		if(isToken(c))
		{
			if(!showToken) continue;
		}
		else if(!$("#t_" + c[TYPE]).prop("checked")) continue;

		// 英雄 / 專屬 / 一般
		if(c[TYPE] == "unit" || c[TYPE] == "spell" || c[TYPE] == "gear")
		{
			var sk = isChampionUnit(c) ? "s_champion" : (isSignature(c) ? "s_signature" : "s_normal");
			if(!$("#" + sk).prop("checked")) continue;
		}

		// 流派: 任一流派有勾即可
		var doms = domainList(c), dok = false;
		for(var d = 0; d < doms.length; d++) if($("#" + (DOMAIN_CHECK[doms[d]] || "d_none")).prop("checked")) { dok = true; break; }
		if(!dok) continue;

		// 費用 (沒有能量值的卡不受影響)
		if(c[ENERGY] !== "")
		{
			var cost = parseInt(c[ENERGY], 10);
			if(!$("#cost_" + Math.min(isNaN(cost) ? 0 : cost, COST_MAX_BUCKET)).prop("checked")) continue;
		}

		if(champ != "0" && tagList(c).indexOf(champ) == -1 && c[EN_NAME] != champ) continue;
		if(tag != "0" && tagList(c).indexOf(tag) == -1) continue;
		if(rarity != "0" && c[RARITY] != rarity) continue;
		if(product != "0" && c[SETS].split(",").indexOf(product) == -1) continue;
		if(onlyLegend && !usableWithLegend(c)) continue;

		if(keywords.length > 0)
		{
			// 中英文都可搜尋
			var hay = [c[ID], c[NAME], c[SUB], c[EN_NAME], c[EN_SUB], c[TEXT], c[EFFECT], c[EN_TEXT], c[EN_EFFECT], c[TAGS],
				I18N.zh["type_" + c[TYPE]] || "", I18N.en["type_" + c[TYPE]] || "",
				superList(c).map(function(s) { return (I18N.zh["super_" + s] || "") + " " + (I18N.en["super_" + s] || ""); }).join(" "),
				doms.map(function(x) { return I18N.zh["dom_" + x] + " " + I18N.en["dom_" + x]; }).join(" ")].join(" ").replace(/<br>/g, " ").toLowerCase();
			var ok = true;
			for(var k = 0; k < keywords.length; k++)
			{
				if(hay.indexOf(keywords[k]) == -1) { ok = false; break; }
			}
			if(!ok) continue;
		}

		rdeckArr.push(c);
	}

	var sortMode = $("#selectSort").val();
	if(sortMode == "1")
		rdeckArr.sort(function(a, b) { return typeIdx(a) - typeIdx(b) || costNum(a) - costNum(b) || domainIdx(a) - domainIdx(b) || cmpId(a, b); });
	else if(sortMode == "2")
		rdeckArr.sort(function(a, b) { return domainIdx(a) - domainIdx(b) || typeIdx(a) - typeIdx(b) || costNum(a) - costNum(b) || cmpId(a, b); });
	else if(sortMode == "3")
		rdeckArr.sort(function(a, b) { return numOf(b, MIGHT) - numOf(a, MIGHT) || costNum(a) - costNum(b) || cmpId(a, b); });
	else
		rdeckArr.sort(cmpId);

	page = 0;
	showrdeck();
}

function checkall()
{
	$("input[type=checkbox]").prop("checked", true);
	$("#onlyLegend, #t_token").prop("checked", false);
}

function uncheckall()
{
	$("input[type=checkbox]").prop("checked", false);
}

function clickSpan(x)
{
	var cb = $(x).prev("input[type=checkbox]");
	cb.prop("checked", !cb.prop("checked"));
}

function showrdeck()
{
	for(var i = 0; i < PAGE_SIZE; i++)
	{
		var idx = page * PAGE_SIZE + i;
		var img = $("#rdeck_" + i);
		if(idx < rdeckArr.length)
		{
			img.attr("src", cardImgSrc(rdeckArr[idx])).attr("alt", rdeckArr[idx][ID]).attr("title", fullName(rdeckArr[idx]));
			banMarkCss(img, rdeckArr[idx]);
			setResultSlotShape(img, rdeckArr[idx]);
		}
		else
		{
			img.attr("src", "img/empty.jpg").attr("alt", "").attr("title", "");
			banMarkCss(img, null);
			setResultSlotShape(img, null);
		}
	}
	applyDarkModeImages();

	$("#totalCard").html(rdeckArr.length);
	if(rdeckArr.length == 0) $("#page").html("0 / 0");
	else $("#page").html((page + 1) + " / " + Math.ceil(rdeckArr.length / PAGE_SIZE));
}

// 仿照 WIXOSS_deckeditor 的 PIECE：橫向卡 (戰場) 在搜尋結果縮成橫向小卡，置中於直式欄位
function setResultSlotShape(img, c)
{
	if(c && isLandscape(c)) img.attr("height", "88px").attr("width", "123px").css("margin-bottom", "42px");
	else img.attr("height", "172px").attr("width", "123px").css("margin-bottom", "0px");
}

function changePage(x)
{
	var maxPage = Math.max(0, Math.ceil(rdeckArr.length / PAGE_SIZE) - 1);
	if(x == "back") page = (page > 0) ? page - 1 : maxPage;
	else page = (page < maxPage) ? page + 1 : 0;
	showrdeck();
}

/* ========================================================= */
/*  Sort helpers                                              */
/* ========================================================= */

function domainIdx(c) { var i = DOMAIN_ORDER.indexOf(domainList(c)[0]); return (i == -1 ? 9 : i) * 10 + (domainList(c).length - 1); }
function typeIdx(c) { var i = TYPE_ORDER.indexOf(c[TYPE]); return i == -1 ? 9 : i; }
function costNum(c) { return c[ENERGY] === "" ? 99 : parseInt(c[ENERGY], 10); }
function numOf(c, col) { return c[col] === "" ? -1 : parseInt(c[col], 10); }
function idKey(c)
{
	var id = c[ID];
	var s = PRODUCT_LIST.map(function(p) { return p[0]; }).indexOf(id.substr(0, 3));
	var rest = id.substr(4);
	var grp = /^\d/.test(rest) ? "0" : (rest.charAt(0) == "R" ? "1" : "2");
	return (s == -1 ? 9 : s) + grp + rest;
}
function cmpId(a, b) { var x = idKey(a), y = idKey(b); return x < y ? -1 : (x > y ? 1 : 0); }

function sortMain()
{
	// 選定英雄候補 → 英雄單位 → 單位 → 法術 → 裝備，各自依費用
	var grp = function(c) {
		if(isChosenCandidate(c)) return 0;
		if(isChampionUnit(c)) return 1;
		return 1 + typeIdx(c);
	};
	mainArr.sort(function(a, b) { return grp(a) - grp(b) || costNum(a) - costNum(b) || domainIdx(a) - domainIdx(b) || cmpId(a, b); });
}

function sortRune() { runeArr.sort(function(a, b) { return domainIdx(a) - domainIdx(b) || cmpId(a, b); }); }

/* ========================================================= */
/*  Add / Delete                                              */
/* ========================================================= */

function countById(arr, id)
{
	var n = 0;
	for(var i = 0; i < arr.length; i++) if(arr[i][ID] == id) n++;
	return n;
}

var toastTimer = null;
function toast(msg)
{
	var el = document.getElementById("rbToast");
	if(!el)
	{
		el = document.createElement("div");
		el.id = "rbToast";
		el.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);background:rgba(40,40,40,0.92);color:#fff;padding:8px 16px;border-radius:8px;z-index:3000;font-size:14px;pointer-events:none;transition:opacity .2s;";
		document.body.appendChild(el);
	}
	el.textContent = msg;
	el.style.opacity = "1";
	clearTimeout(toastTimer);
	toastTimer = setTimeout(function(){ el.style.opacity = "0"; }, 2400);
}

function addDeck(x)
{
	var id = x.alt;
	if(!id) return;
	var c = cardById[id];
	if(!c) return;
	var zone = zoneOf(c);

	if(!zone) { toast(T("t_token")); return; }
	if(!inEnv(c)) { toast(T("t_env", { name: cName(c), sets: ENV_SETS.zh.join("/") })); return; }
	if(isBanned(c)) toast(T("t_ban", { name: cName(c), date: BAN_LIST_DATE }));
	else if(isBanned2v2(c)) toast(T("t_ban2", { name: cName(c) }));

	if(zone == "legend")
	{
		if(legendArr.length && legendArr[0][ID] == c[ID]) return;
		if(legendArr.length) toast(T("t_legend", { name: cName(c) }));
		legendArr = [c];
		sortMain();
	}
	else if(zone == "bf")
	{
		if(bfArr.length >= BF_MAX) { toast(T("t_bfmax", { n: BF_MAX })); return; }
		if(countById(bfArr, c[ID]) >= 1) { toast(T("t_bfsame")); return; }
		bfArr.push(c);
	}
	else if(zone == "rune")
	{
		if(runeArr.length >= RUNE_MAX) { toast(T("t_runemax", { n: RUNE_MAX })); return; }
		runeArr.push(c);
		sortRune();
	}
	else
	{
		if(mainArr.length >= MAIN_MAX) { toast(T("t_mainmax", { n: MAIN_MAX })); return; }
		var limit = LIMIT_LIST.indexOf(c[ID]) != -1 ? 1 : SAME_ID_MAIN;
		if(countById(mainArr, c[ID]) >= limit) { toast(T("t_same", { n: limit })); return; }
		if(isSignature(c) && mainArr.filter(isSignature).length >= SIGNATURE_MAX) { toast(T("t_sig", { n: SIGNATURE_MAX })); return; }
		mainArr.push(c);
		sortMain();
	}

	showAlldeck();
}

function zoneArr(zone)
{
	return zone == "legend" ? legendArr : zone == "bf" ? bfArr : zone == "rune" ? runeArr : mainArr;
}

function delDeck(zone, idx)
{
	var arr = zoneArr(zone);
	if(idx >= arr.length) return;
	arr.splice(idx, 1);
	if(zone == "legend") sortMain();
	showAlldeck();

	// keep preview in sync with what is now under the cursor
	var img = document.getElementById(zone + "_" + idx);
	if(img) onmouseShow(img, 'deck');
}

function cleardeck()
{
	if(!confirm("It will clear current deck. Are you sure?")) return;
	dataInit();
}

function dataInit()
{
	legendArr = [];
	mainArr = [];
	runeArr = [];
	bfArr = [];
	showAlldeck();
}

/* ========================================================= */
/*  Render deck                                               */
/* ========================================================= */

function renderZone(zone, arr, max)
{
	for(var i = 0; i < max; i++)
	{
		var img = $("#" + zone + "_" + i);
		if(i < arr.length)
		{
			img.attr("src", cardImgSrc(arr[i])).attr("alt", arr[i][ID]).attr("title", fullName(arr[i]));
			banMarkCss(img, arr[i]);
		}
		else
		{
			img.attr("src", "img/empty.jpg").attr("alt", "").attr("title", "");
			banMarkCss(img, null);
		}
	}
}

function setCount(sel, n, max)
{
	$(sel).text(n + " / " + max).removeClass("ok ng").addClass(n == max ? "ok" : "");
}

function showAlldeck()
{
	renderZone("legend", legendArr, LEGEND_MAX);
	renderZone("bf", bfArr, BF_MAX);
	renderZone("rune", runeArr, RUNE_MAX);
	renderZone("main", mainArr, MAIN_MAX);

	setCount("#legendCount", legendArr.length, LEGEND_MAX);
	setCount("#bfCount", bfArr.length, BF_MAX);
	setCount("#runeCount", runeArr.length, RUNE_MAX);
	setCount("#mainCount", mainArr.length, MAIN_MAX);

	// 選定英雄標記: 主牌組中第一張符合傳奇英雄的英雄單位
	var marked = false;
	for(var i = 0; i < MAIN_MAX; i++)
	{
		var show = !marked && i < mainArr.length && isChosenCandidate(mainArr[i]);
		if(show) marked = true;
		$("#mark_" + i).css("display", show ? "" : "none");
	}

	// 符文內訳
	var rc = {};
	for(i = 0; i < runeArr.length; i++) { var d = domainList(runeArr[i])[0]; rc[d] = (rc[d] || 0) + 1; }
	var parts = [];
	for(i = 0; i < DOMAIN_ORDER.length; i++) if(rc[DOMAIN_ORDER[i]]) parts.push(domLabel(DOMAIN_ORDER[i]) + " " + rc[DOMAIN_ORDER[i]]);
	$("#runeDetail").text(parts.join("　"));

	// 主牌組內訳
	var n = { unit: 0, spell: 0, gear: 0 };
	for(i = 0; i < mainArr.length; i++) n[mainArr[i][TYPE]] = (n[mainArr[i][TYPE]] || 0) + 1;
	var sig = mainArr.filter(isSignature).length;
	var l = legendCard();
	var detail = T("d_unit") + " " + n.unit + "　" + T("d_spell") + " " + n.spell + "　" + T("d_gear") + " " + n.gear + "　" + T("d_sig") + " " + sig + "/" + SIGNATURE_MAX;
	var banned = legendArr.concat(bfArr, runeArr, mainArr).filter(isBanned).length;
	if(banned) detail += "　" + T("d_ban", { n: banned });
	var outEnv = legendArr.concat(bfArr, runeArr, mainArr).filter(function(x) { return !inEnv(x); }).length;
	if(outEnv) detail += "　" + T("d_env", { n: outEnv });
	if(l) detail += "　｜ " + T("d_legend") + ": " + legendChamps().map(champLabel).join(", ") + " [" + legendDomains().map(domLabel).join("/") + "]";
	$("#mainDetail").text(detail);

	applyDarkModeImages();
	updatechart();

	if($("#onlyLegend").prop("checked")) search();
}

/* ========================================================= */
/*  Charts                                                    */
/* ========================================================= */

function getLegendColor()
{
	return document.body.classList.contains('dark-mode') ? '#e6e6e6' : 'rgb(0, 0, 0)';
}

function makeDoughnut(id, labels, colors)
{
	return new Chart(document.getElementById(id), {
		type: 'doughnut',
		data: {
			labels: labels,
			datasets: [{ data: labels.map(function(){ return 0; }), backgroundColor: colors, hoverOffset: 4 }]
		},
		options: {
			plugins: {
				legend: { display: true, labels: { color: getLegendColor(), font: { size: 11 }, boxWidth: 12 } }
			}
		}
	});
}

const CHART_DOMAINS = ["fury", "calm", "mind", "body", "chaos", "order", "colorless"];

function costLabels()
{
	var a = [];
	for(var i = 0; i <= COST_MAX_BUCKET; i++) a.push(T("chart_cost") + i + (i == COST_MAX_BUCKET ? "+" : ""));
	return a;
}
function typeLabels() { return [T("chart_champ"), typeLabel("unit"), typeLabel("spell"), typeLabel("gear")]; }

function buildCharts()
{
	var costColors = [];
	for(var i = 0; i <= COST_MAX_BUCKET; i++)
	{
		var g = Math.round(235 - i * 22);
		costColors.push("rgb(" + g + "," + g + "," + g + ")");
	}
	costobj = makeDoughnut('costChart', costLabels(), costColors);
	domainobj = makeDoughnut('domainChart', CHART_DOMAINS.map(domLabel), CHART_DOMAINS.map(function(d) { return DOMAIN_HEX[d]; }));
	typeobj = makeDoughnut('typeChart', typeLabels(), ['#ffb300', '#4e79a7', '#e15759', '#76b7b2']);
}

function rebuildChartLabels()
{
	if(!costobj) return;
	costobj.data.labels = costLabels();
	domainobj.data.labels = CHART_DOMAINS.map(domLabel);
	typeobj.data.labels = typeLabels();
}

function updatechart()
{
	if(!costobj) return;
	var cost = [];
	for(var i = 0; i <= COST_MAX_BUCKET; i++) cost.push(0);
	var dom = CHART_DOMAINS.map(function(){ return 0; });
	var typ = [0, 0, 0, 0];

	for(i = 0; i < mainArr.length; i++)
	{
		var c = mainArr[i];
		var cn = costNum(c);
		if(cn != 99) cost[Math.min(cn, COST_MAX_BUCKET)]++;
		var ds = domainList(c);
		for(var k = 0; k < ds.length; k++) { var di = CHART_DOMAINS.indexOf(ds[k]); if(di >= 0) dom[di]++; }
		if(isChampionUnit(c)) typ[0]++;
		else if(c[TYPE] == "unit") typ[1]++;
		else if(c[TYPE] == "spell") typ[2]++;
		else if(c[TYPE] == "gear") typ[3]++;
	}

	costobj.data.datasets[0].data = cost; costobj.update();
	domainobj.data.datasets[0].data = dom; domainobj.update();
	typeobj.data.datasets[0].data = typ; typeobj.update();
}

function updateChartsTheme()
{
	var color = getLegendColor();
	[costobj, domainobj, typeobj].forEach(function(obj) {
		if(obj) { obj.options.plugins.legend.labels.color = color; obj.update(); }
	});
}

/* ========================================================= */
/*  Card preview                                              */
/* ========================================================= */

var bigPicLocked = false;
(function setupBigPicAltLock(){
	function setLocked(v) {
		if(v === bigPicLocked) return;
		bigPicLocked = v;
		window.bigPicLocked = v;
		document.body.classList.toggle('bigpic-locked', v);
	}
	function sync(e) { setLocked(!!e.altKey); }
	window.addEventListener('keydown', function(e) {
		if((e.key === 'Alt' || e.keyCode === 18) && !e.ctrlKey && !e.shiftKey && !e.metaKey) e.preventDefault();
		sync(e);
	}, true);
	window.addEventListener('keyup', sync, true);
	window.addEventListener('mousemove', sync, true);
	window.addEventListener('mouseover', sync, true);
	window.addEventListener('mousedown', sync, true);
	window.addEventListener('blur', function() { setLocked(false); });
})();

function onmouseShow(x, source)
{
	if(bigPicLocked) return;
	// 空白欄位：不影響目前預覽
	if(!x.alt) return;

	if(source == 'search') $('#cardinformation').css('margin', '150px 0px 0px 40px');
	else $('#cardinformation').css('margin', '150px 0px 0px 960px');

	var c = cardById[x.alt];
	if(!c)
	{
		$("#cardinformation").css("visibility", "hidden");
		return;
	}

	$("#cardinformation").css("visibility", "visible");
	var bp = $("#big_pic");
	if(isLandscape(c)) bp.attr("width", "500px").attr("height", "358px");
	else bp.attr("width", "358px").attr("height", "500px");
	bp.attr("src", cardImgSrc(c, true)).attr("alt", c[ID]);
	showInfotable(c);
}

function infoRow(label, value)
{
	return "<tr><td class='label'>" + label + "</td><td>" + value + "</td></tr>";
}

function domainHtml(c)
{
	return domainList(c).map(function(d) {
		return "<i class='color-chip' style='background:" + DOMAIN_HEX[d] + "'></i>" + domLabel(d);
	}).join("&ensp;");
}

function showInfotable(c)
{
	var str = "";
	if(!c)
	{
		str += infoRow(T("i_id"), "");
		str += infoRow(T("i_name"), "");
		str += infoRow(T("i_type"), "");
		$("#infoTable").html(str);
		return;
	}

	str += infoRow(T("i_id"), escapeHtml(c[ID]));
	str += infoRow(T("i_name"), "<b>" + escapeHtml(cName(c)) + "</b>" + (cSub(c) ? "<br>" + escapeHtml(cSub(c)) : ""));
	if(c[EN_NAME] != c[NAME] || c[EN_SUB] != c[SUB]) str += infoRow(LANG == "en" ? T("i_other") : "英文名", escapeHtml(otherFullName(c)));

	var sup = superList(c).map(superLabel);
	str += infoRow(T("i_type"), escapeHtml(typeLabel(c[TYPE]) + (sup.length ? (LANG == "en" ? " (" + sup.join(", ") + ")" : "（" + sup.join("・") + "）") : "")));
	str += infoRow(T("i_domain"), domainHtml(c));

	if(c[TYPE] == "legend")
	{
		str += infoRow(T("i_champ"), escapeHtml(tagList(c).map(champLabel).join(", ")));
	}
	var stats = [];
	if(c[ENERGY] !== "") stats.push(T("s_energy") + " <b>" + escapeHtml(c[ENERGY]) + "</b>");
	if(c[POWER] !== "") stats.push(T("s_power") + " <b>" + escapeHtml(c[POWER]) + "</b>");
	if(c[MIGHT] !== "") stats.push(T("s_might") + " <b>" + escapeHtml(c[MIGHT]) + "</b>");
	if(c[MIGHTBONUS] !== "") stats.push(T("s_mightbonus") + " <b>" + escapeHtml(c[MIGHTBONUS]) + "</b>");
	if(stats.length) str += infoRow(T("i_stats"), stats.join("&emsp;"));
	if(c[TAGS] && c[TYPE] != "legend") str += infoRow(T("i_tags"), escapeHtml(tagList(c).join(", ")));

	var limitNote = [];
	if(isBanned(c)) limitNote.push(T("ban_std"));
	else if(isBanned2v2(c)) limitNote.push(T("ban_2v2"));
	if(LIMIT_LIST.indexOf(c[ID]) != -1) limitNote.push(T("limit1"));
	if(limitNote.length) str += infoRow("<span style='color:#c62828;margin-top:0px;font-weight:bold;'>" + T("i_ban") + "</span>", "<span style='color:#c62828;margin-top:0px;font-weight:bold;'>" + escapeHtml(limitNote.join(" / ")) + "</span>");

	if(!inEnv(c)) str += infoRow("<span style='color:#1e88e5;margin-top:0px;font-weight:bold;'>" + T("i_env") + "</span>", "<span style='color:#1e88e5;margin-top:0px;font-weight:bold;'>" + T("env_out") + " (" + escapeHtml(c[SETS]) + ")</span>");

	if(cText(c)) str += "<tr><td colspan='2'>" + formatText(cText(c)) + "</td></tr>";
	if(cEffect(c)) str += "<tr><td colspan='2'><b>" + T("i_effect") + (LANG == "en" ? ":" : "：") + "</b><br>" + formatText(cEffect(c)) + "</td></tr>";

	var comment = "";
	try { comment = localStorage.getItem(c[ID] + COMMENT_SUFFIX) || ""; } catch(e) {}
	str += "<tr><td colspan='2'><textarea id='comment' placeholder='Comment' style='width: 96%; height: 40px; resize: vertical;' onchange=\"setComment('" + c[ID] + "')\">" + escapeHtml(comment) + "</textarea></td></tr>";

	$("#infoTable").html(str);
}

const RUNE_ICON = {
	zh: { fury: "怒", calm: "靜", mind: "心", body: "身", chaos: "混", order: "秩", rainbow: "任" },
	en: { fury: "F", calm: "C", mind: "M", body: "B", chaos: "X", order: "O", rainbow: "A" }
};

function formatText(t)
{
	// t uses <br>; escape everything else, then turn :rb_xxx: into icons
	return t.split("<br>").map(function(line) {
		// 官網文字內含 HTML entity (&gt; 等)，先還原再跳脫
		line = line.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
		var s = escapeHtml(line);
		s = s.replace(/:rb_energy_(\d+):/g, "<span class='ic ic-energy' title='" + T("s_energy") + "'>$1</span>");
		s = s.replace(/:rb_rune_(\w+?):/g, function(m, d) {
			if(d == "rainbow") return "<span class='ic ic-rune' title='" + T("any_rune") + "' style='background:linear-gradient(135deg,#d8423a,#d4af1f,#3fae5a,#3f86d1,#8a4fc2)'>" + RUNE_ICON[LANG].rainbow + "</span>";
			return "<span class='ic ic-rune' title='" + domLabel(d) + T("rune_suffix") + "' style='background:" + (DOMAIN_HEX[d] || "#777") + "'>" + (RUNE_ICON[LANG][d] || "?") + "</span>";
		});
		s = s.replace(/:rb_might:/g, "<span class='ic ic-might' title='" + T("s_might") + "'>⚔</span>");
		s = s.replace(/:rb_exhaust:/g, "<span class='ic ic-exhaust' title='" + T("exhaust") + "'>↷</span>");
		s = s.replace(/(\[[^\[\]]{1,24}\])/g, "<span class='kw' style='margin-top:0px;cursor:text;'>$1</span>");
		return s;
	}).join("<br>");
}

function setComment(id)
{
	try {
		var v = $("#comment").val();
		if(v != "") localStorage.setItem(id + COMMENT_SUFFIX, v);
		else localStorage.removeItem(id + COMMENT_SUFFIX);
	} catch(e) {}
}

/* ========================================================= */
/*  Popup windows                                             */
/* ========================================================= */

function showPopup(containerId)
{
	var el = document.getElementById(containerId);
	el.style.display = "block";
	window.onmousedown = function(e) {
		if(e.target == el) el.style.display = "none";
	};
}

function openWindow(x)
{
	if(x == "view")
	{
		showDeckView();
		showPopup("window-container");
	}
	else
	{
		showList();
		showPopup("window-container-list");
	}
}

function viewRow(title, arr, w, h)
{
	var s = "<div class='view-row'><span class='view-title'>" + title + " (" + arr.length + ")</span>";
	for(var i = 0; i < arr.length; i++)
	{
		var ww = w, hh = h;
		if(isLandscape(arr[i])) { ww = h; hh = w; }
		s += "<img class='card" + (isBanned(arr[i]) ? " banned" : "") + "' width='" + ww + "px' height='" + hh + "px' src='" + cardImgSrc(arr[i]) + "' alt='' title='" + escapeHtml(arr[i][ID] + " " + fullName(arr[i])) + "'>";
	}
	return s + "</div>";
}

function showDeckView()
{
	var str = "";
	var title = $("#selectDeck").val() || "";
	if(title) str += "<div style='font-size:20px;font-weight:bold;margin-bottom:8px;'>" + escapeHtml(title) + "</div>";
	str += "<table><tr><td style='vertical-align:top;padding-right:24px;'>" + viewRow(T("zone_legend"), legendArr, 143, 200) + "</td>";
	str += "<td style='vertical-align:top;padding-right:24px;'>" + viewRow(T("zone_bf"), bfArr, 143, 200) + "</td>";
	str += "<td style='vertical-align:top;'>" + viewRow(T("zone_rune"), runeArr, 72, 100) + "</td></tr></table>";
	str += viewRow(T("zone_main"), mainArr, 115, 160);
	$("#deckView").html(str);
}

function groupList(arr)
{
	var list = [];
	for(var i = 0; i < arr.length; i++)
	{
		var found = false;
		for(var j = 0; j < list.length; j++)
		{
			if(list[j][0][ID] == arr[i][ID]) { list[j][1]++; found = true; break; }
		}
		if(!found) list.push([arr[i], 1]);
	}
	return list;
}

function listTable(title, arr)
{
	var g = groupList(arr);
	var s = "<br><b>" + title + " (" + arr.length + ")</b><br><br><table>";
	for(var i = 0; i < g.length; i++)
	{
		var c = g[i][0];
		var info = (c[ENERGY] !== "" ? "E" + c[ENERGY] : "") + (c[MIGHT] !== "" ? " M" + c[MIGHT] : "");
		var dom = domainList(c).map(domLabel).join("/");
		s += "<tr><td style='width: 30px;'>" + g[i][1] + "</td><td style='width: 90px;'>" + escapeHtml(c[ID]) + "</td><td style='width: 70px;'>" + escapeHtml(info) + "</td><td>" + escapeHtml(fullName(c)) + (isBanned(c) ? " <b style='color:#c62828'>" + T("view_tag") + "</b>" : "") + "</td><td style='padding-left: 10px; color: #888;'>" + escapeHtml(dom) + "</td></tr>";
	}
	return s + "</table>";
}

function showList()
{
	var str = "<table><tr><td style='vertical-align: top;'>";
	str += listTable(T("zone_legend"), legendArr);
	str += listTable(T("zone_bf"), bfArr);
	str += listTable(T("zone_rune"), runeArr);
	str += "</td><td style='vertical-align: top; padding-left: 60px;'>";
	str += listTable(T("zone_main"), mainArr);
	str += "</td></tr></table>";
	$("#decklist").html(str);
}

/* ========================================================= */
/*  Deck code / save / load                                   */
/* ========================================================= */

function buildCode()
{
	var ids = function(arr) { return arr.map(function(c) { return c[ID]; }); };
	return ["legend"].concat(ids(legendArr)).join(",") + "\n" +
		["battlefield"].concat(ids(bfArr)).join(",") + "\n" +
		["rune"].concat(ids(runeArr)).join(",") + "\n" +
		["main"].concat(ids(mainArr)).join(",");
}

function parseCode(text)
{
	var r = { legend: [], bf: [], rune: [], main: [], unknown: [] };
	var lines = String(text || "").replace(/\r/g, "").split("\n");
	for(var i = 0; i < lines.length; i++)
	{
		var parts = lines[i].split(",").map(function(x) { return x.trim(); }).filter(function(x) { return x != ""; });
		if(parts.length == 0) continue;
		if(!cardById[parts[0].toUpperCase()]) parts.shift();	// header (legend / battlefield / rune / main)
		for(var j = 0; j < parts.length; j++)
		{
			var c = cardById[parts[j].toUpperCase()];
			var z = c ? zoneOf(c) : null;
			if(!z) { r.unknown.push(parts[j]); continue; }
			r[z].push(c);
		}
	}
	return r;
}

function applyCode(text)
{
	var r = parseCode(text);
	legendArr = r.legend.slice(0, LEGEND_MAX);
	bfArr = r.bf.slice(0, BF_MAX);
	runeArr = r.rune.slice(0, RUNE_MAX);
	mainArr = r.main.slice(0, MAIN_MAX);
	sortRune(); sortMain();
	showAlldeck();
	if(r.unknown.length) toast(T("t_unknown") + r.unknown.join(", "));
}

function openCodeWindow()
{
	$("#textCode").val(buildCode());
	$("#deckTitle").val($("#selectDeck").val() || $("#deckTitle").val() || "Simple Deck");
	$("#deckStr").html("&emsp;");
	showPopup("window-container-code");
}

function loadFromCode()
{
	applyCode($("#textCode").val());
	$("#deckStr").html("Deck code loaded.");
}

function downloadDeck()
{
	var content = buildCode();
	$("#textCode").val(content);
	var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.setAttribute('download', ($("#deckTitle").val() || "deck") + ".csv");
	a.click();
}

function readSingleFile(evt)
{
	var f = evt.target.files[0];
	if(!f) { alert("Failed to load file"); return; }
	$("#deckTitle").val(f.name.replace(/\.(csv|txt)$/i, ""));
	var r = new FileReader();
	r.onload = function(e) {
		$("#textCode").val(e.target.result);
		applyCode(e.target.result);
		$("#deckStr").html("Deck file loaded.");
	};
	r.readAsText(f);
	$("#fileinput").val("");
}

function copyClipboard()
{
	var t = document.querySelector('#textCode');
	t.select();
	try {
		if(navigator.clipboard) navigator.clipboard.writeText(t.value);
		else document.execCommand('copy');
	} catch(e) { document.execCommand('copy'); }
	$("#deckStr").html("Deck code copied!");
}

function saveDeckNameList()
{
	try { localStorage.setItem(DECK_LIST_KEY, JSON.stringify(deckNamelist)); } catch(e) {}
}

function onloaddeck()
{
	try {
		deckNamelist = JSON.parse(localStorage.getItem(DECK_LIST_KEY)) || [];
	} catch(e) {
		deckNamelist = [];
	}
	updateDecklist("");
}

function updateDecklist(select)
{
	var str = "<option value=''>--Select Deck--</option>";
	for(var i = 0; i < deckNamelist.length; i++)
	{
		var n = escapeHtml(deckNamelist[i]);
		str += "<option value='" + n + "'" + (select == deckNamelist[i] ? " selected" : "") + ">" + n + "</option>";
	}
	$("#selectDeck").html(str);
}

function selectDeck()
{
	var deck = $("#selectDeck").val();
	if(!deck) { dataInit(); return; }
	var code = "";
	try { code = localStorage.getItem(DECK_KEY_PREFIX + deck) || ""; } catch(e) {}
	applyCode(code);
}

function addDecklist()
{
	var title = $.trim($("#deckTitle").val());
	if(title == "") { alert("Do not set empty string as title."); return; }

	var exists = deckNamelist.indexOf(title) != -1;
	if(exists && !confirm("Deck exist. Do you want to overwrite it?")) return;

	applyCode($("#textCode").val());
	try { localStorage.setItem(DECK_KEY_PREFIX + title, buildCode()); } catch(e) { alert("Failed to save deck."); return; }
	if(!exists) deckNamelist.push(title);
	saveDeckNameList();
	updateDecklist(title);
	$("#deckStr").html("Deck has been added.");
}

function deletedecklist()
{
	var deck = $("#selectDeck").val();
	if(!deck) return;
	if(!confirm("It will delete this deck. Are you sure?")) return;
	try { localStorage.removeItem(DECK_KEY_PREFIX + deck); } catch(e) {}
	var idx = deckNamelist.indexOf(deck);
	if(idx != -1) deckNamelist.splice(idx, 1);
	saveDeckNameList();
	updateDecklist("");
	dataInit();
}

function resetAllDecks()
{
	if(!confirm("Delete ALL saved decks? This cannot be undone.")) return;
	for(var i = 0; i < deckNamelist.length; i++)
	{
		try { localStorage.removeItem(DECK_KEY_PREFIX + deckNamelist[i]); } catch(e) {}
	}
	deckNamelist = [];
	saveDeckNameList();
	updateDecklist("");
	$("#deckStr").html("All saved decks were deleted.");
}

/* ========================================================= */
/*  Comment manager                                           */
/* ========================================================= */

function collectCurrentComments()
{
	var obj = {};
	try {
		for(var i = 0; i < localStorage.length; i++)
		{
			var k = localStorage.key(i);
			if(k && k.length > COMMENT_SUFFIX.length && k.slice(-COMMENT_SUFFIX.length) == COMMENT_SUFFIX)
			{
				obj[k.slice(0, -COMMENT_SUFFIX.length)] = localStorage.getItem(k);
			}
		}
	} catch(e) {}
	return obj;
}

function openCommentManager()
{
	$("#textCommentCode").val(JSON.stringify(collectCurrentComments(), null, 2));
	$("#commentStr").html("&emsp;");
	showPopup("window-container-comment");
}

function applyCommentText()
{
	var obj;
	try { obj = JSON.parse($("#textCommentCode").val()); } catch(e) { $("#commentStr").html("Invalid JSON."); return; }
	var n = 0;
	for(var k in obj)
	{
		if(!cardById[k]) continue;
		try {
			if(obj[k]) localStorage.setItem(k + COMMENT_SUFFIX, String(obj[k]));
			else localStorage.removeItem(k + COMMENT_SUFFIX);
			n++;
		} catch(e) {}
	}
	$("#commentStr").html(n + " comment(s) applied.");
}

function downloadCommentBlob()
{
	var content = JSON.stringify(collectCurrentComments(), null, 2);
	var blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.setAttribute('download', "riftbound_comment.json");
	a.click();
}

function copyCommentClipboard()
{
	var t = document.querySelector('#textCommentCode');
	t.select();
	try {
		if(navigator.clipboard) navigator.clipboard.writeText(t.value);
		else document.execCommand('copy');
	} catch(e) { document.execCommand('copy'); }
	$("#commentStr").html("Comment copied!");
}

function readSingleCommentFile(evt)
{
	var f = evt.target.files[0];
	if(!f) return;
	var r = new FileReader();
	r.onload = function(e) {
		$("#textCommentCode").val(e.target.result);
		applyCommentText();
	};
	r.readAsText(f);
	$("#commentFileinput").val("");
}

function resetAllComments()
{
	if(!confirm("Delete ALL comments? This cannot be undone.")) return;
	var obj = collectCurrentComments();
	for(var k in obj)
	{
		try { localStorage.removeItem(k + COMMENT_SUFFIX); } catch(e) {}
	}
	$("#textCommentCode").val("{}");
	$("#commentStr").html("All comments were deleted.");
}

/* ========================================================= */
/*  Dark mode                                                 */
/* ========================================================= */

function updateDarkModeButton()
{
	var btn = document.getElementById('darkModeToggle');
	if(btn) btn.textContent = document.body.classList.contains('dark-mode') ? '☀ Light' : '🌙 Dark';
}

function swapImageForDarkMode(img, isDark)
{
	var src = img.getAttribute('src');
	if(!src || src.indexOf("img/") != 0) return;
	var pairs = [["empty.jpg", "empty_black.jpg"], ["cancel_icon.png", "cancel_icon_black.png"], ["larrow.png", "larrow_black.png"], ["rarrow.png", "rarrow_black.png"]];
	for(var i = 0; i < pairs.length; i++)
	{
		if(isDark && src == "img/" + pairs[i][0]) { img.setAttribute('src', "img/" + pairs[i][1]); return; }
		if(!isDark && src == "img/" + pairs[i][1]) { img.setAttribute('src', "img/" + pairs[i][0]); return; }
	}
}

function applyDarkModeImages()
{
	var isDark = document.body.classList.contains('dark-mode');
	var imgs = document.getElementsByTagName('img');
	for(var i = 0; i < imgs.length; i++) swapImageForDarkMode(imgs[i], isDark);
}

function toggleDarkMode()
{
	document.body.classList.toggle('dark-mode');
	var isDark = document.body.classList.contains('dark-mode');
	try { localStorage.setItem(DARK_KEY, isDark ? '1' : '0'); } catch(e) {}
	updateDarkModeButton();
	updateChartsTheme();
	applyDarkModeImages();
}

/* ========================================================= */
/*  About                                                     */
/* ========================================================= */

function showVersion()
{
	var str = "";
	str += "符文戰場 Riftbound Deck Builder\n";
	str += "(based on WIXOSS_deckeditor by ZZZ)\n";
	str += "\n";
	str += "20261103 v1.00\n";
	str += "1.First release.\n";
	str += "2.收錄 起源／試煉之地／鑄魂淬鍊／潛能怒放／血海深仇／熠耀光彩 (" + cardData.length + " 種；異圖不另收)\n";
	str += "3.加卡上限：傳奇1・戰場3 (同卡1)・符文12・主牌組40 (同卡3、專屬合計3)，不做構築規則檢查\n";
	str += "4.禁止卡標示 (紅框)：官方 Rules Hub 禁卡表 " + BAN_LIST_DATE + " 版 (Standard " + BAN_LIST.length + " 張＋2v2 另 " + BAN_LIST_2V2.length + " 張)\n";
	str += "5.中文／English 切換 (卡名・能力・卡圖・介面)\n";
	str += "6.卡池環境切換：中文版環境 (" + ENV_SETS.zh.join("/") + ")／英文版環境 (全系列)\n";
	str += "\n";
	str += "資料・卡圖來源: 符文戰場 Riftbound 官方網站 卡牌圖集\n";

	alert(str);
}
