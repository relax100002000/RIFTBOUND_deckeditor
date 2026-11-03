/*
	符文戰場 Riftbound 卡片資料抓取 (瀏覽器 Console 用)

	1. 開啟 https://playriftbound.com/zh-tw/card-gallery/
	2. F12 → Console，貼上本檔全部內容並 Enter
	3. 頁面左上會出現黃色按鈕，點它下載 riftbound_cards.json
	4. 把 riftbound_cards.json 放到 tools/，執行  python tools/build_card_info.py

	- 繁中資料取自目前頁面的 __NEXT_DATA__，英文名／英文能力／英文卡圖另外抓 /en-us/card-gallery/
	- 異圖 (卡號帶 a / * / SP、或超過系列總數的超框號碼) 不收
	- 同英文名＋副標題＋種類視為同一張卡，取最早系列 (OGN→OGS→SFD→UNL→VEN→RAD) 的一般版
*/
(async function() {
	function pickItems(nd) {
		var blades = nd.props.pageProps.page.blades;
		for (var i = 0; i < blades.length; i++) if (blades[i].cards && blades[i].cards.items) return blades[i].cards.items;
		throw new Error("card list not found");
	}
	var zh = pickItems(JSON.parse(document.getElementById('__NEXT_DATA__').textContent));
	var html = await fetch('/en-us/card-gallery/').then(function(r) { return r.text(); });
	var m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
	var en = pickItems(JSON.parse(m[1]));
	var enById = {}, enByNum = {};
	en.forEach(function(c) {
		enById[c.id] = c;
		var nk = c.set.value.id + '-' + c.collectorNumber;
		if (!enByNum[nk] || c.publicCode.length < enByNum[nk].publicCode.length) enByNum[nk] = c;
	});
	// 英文版偶爾缺某張一般版 (例: 2026-11 的 SFD-054) → 改用同系列同號碼的異圖英文資料
	zh.forEach(function(c) {
		if (!enById[c.id]) {
			var alt = enByNum[c.set.value.id + '-' + c.collectorNumber];
			if (alt) { enById[c.id] = alt; console.warn('en missing, use', alt.publicCode, 'for', c.publicCode); }
		}
	});

	var SETORD = ['OGN', 'OGS', 'SFD', 'UNL', 'VEN', 'RAD'];
	var sidx = function(s) { var i = SETORD.indexOf(s); return i < 0 ? 99 : i; };
	var total = function(c) { var t = c.publicCode.match(/\/(\d+)$/); return t ? +t[1] : 999; };
	var isVar = function(c) { return /a\/|\*|SP\d|R\d+a$/.test(c.publicCode) || c.collectorNumber > total(c); };
	var typeOf = function(c) {
		var t = (c.cardType.type || []).map(function(x) { return x.id; })[0];
		if (!t) {
			var mm = ((enById[c.id] || c).cardImage && (enById[c.id] || c).cardImage.accessibilityText || '').match(/^Riftbound (\w+):/);
			t = mm && mm[1] !== 'None' ? mm[1].toLowerCase() : 'other';
		}
		return t;
	};
	var key = function(c) { var e = enById[c.id] || c; return (e.name + '|' + (e.subtitle || '') + '|' + typeOf(c)).toLowerCase(); };
	var cleanTxt = function(b) {
		return (b || '').replace(/<\/p>\s*<p>/g, '<br>').replace(/<\/?p>/g, '').replace(/<ul>|<\/ul>|<\/li>/g, '')
			.replace(/<li>/g, '<br>・').replace(/<br\s*\/?>/g, '<br>').replace(/^(<br>)+/, '').replace(/\n/g, '<br>').trim();
	};
	var imgFile = function(u) { var mm = (u || '').match(/game_data_live\/([^?]+)/); return mm ? mm[1] : ''; };
	var v = function(o) { return o && o.value ? String(o.value.label) : ''; };

	var groups = {};
	zh.forEach(function(c) { var k = key(c); (groups[k] = groups[k] || []).push(c); });

	var rows = [];
	Object.keys(groups).forEach(function(k) {
		var g = groups[k];
		var bases = g.filter(function(c) { return !isVar(c); });
		if (!bases.length) bases = g.slice();
		bases.sort(function(a, b) { return sidx(a.set.value.id) - sidx(b.set.value.id) || a.collectorNumber - b.collectorNumber; });
		var c = bases[0], e = enById[c.id] || c;
		var sets = [];
		g.forEach(function(x) { if (sets.indexOf(x.set.value.id) < 0) sets.push(x.set.value.id); });
		sets.sort(function(a, b) { return sidx(a) - sidx(b); });
		rows.push([
			c.publicCode.replace(/\/\d+$/, ''), c.name, c.subtitle || '', e.name, e.subtitle || '',
			typeOf(c), (c.cardType.superType || []).map(function(x) { return x.id; }).join('/'),
			((c.domain && c.domain.values) || []).map(function(x) { return x.id; }).join('/'),
			v(c.energy), v(c.power), v(c.might), v(c.mightBonus),
			((c.tags && c.tags.tags) || []).join(','), (c.rarity && c.rarity.value && c.rarity.value.id) || '', sets.join(','),
			cleanTxt(c.text && c.text.richText && c.text.richText.body), cleanTxt(c.effect && c.effect.richText && c.effect.richText.body),
			imgFile(c.cardImage && c.cardImage.url), ((c.illustrator && c.illustrator.values) || []).map(function(x) { return x.label; }).join(' / '),
			c.orientation === 'landscape' ? 'L' : '',
			cleanTxt(e.text && e.text.richText && e.text.richText.body), cleanTxt(e.effect && e.effect.richText && e.effect.richText.body),
			imgFile(e.cardImage && e.cardImage.url)
		]);
	});

	var payload = { fetched: new Date().toISOString(), source: location.href, rows: rows };
	var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'riftbound_cards.json';
	a.textContent = '⬇ riftbound_cards.json (' + rows.length + ' cards)';
	a.style.cssText = 'position:fixed;top:80px;left:20px;z-index:999999;background:#ffeb3b;color:#000;padding:16px 24px;font-size:20px;border-radius:8px;';
	document.body.appendChild(a);
	console.log('Riftbound cards:', zh.length, 'entries ->', rows.length, 'cards. Click the yellow button to download.');
})();
