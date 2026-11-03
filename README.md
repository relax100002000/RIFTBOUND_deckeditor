# RIFTBOUND_deckeditor

符文戰場 (Riftbound) 的組牌器，以 WIXOSS_deckeditor 為基礎改寫（與 WWB_deckeditor / ANGE_UNITE_deckeditor 同架構）。

## 使用方式
直接用瀏覽器開啟 `index.html`。

- 右側搜尋結果點一下 → 加入牌組（依種類自動放進 傳奇／戰場／符文牌組／主牌組）；牌組中點一下 → 移除；牌組中右鍵 → 再加一張同卡
- 點別張傳奇會直接替換目前的傳奇
- 滑鼠移到卡片上顯示大圖與效果（不顯示繪師、稀有度、收錄系列）；按住 ALT 可鎖定預覽
- 左上「🌐 EN／🌐 中文」切換語言：卡名・能力文字・卡圖（英文版官方卡圖）・介面文字一起切換，設定會記住；搜尋時中英文都能用
- 主牌組中第一張符合傳奇英雄的英雄單位會標示「★選定英雄」
- 「只顯示傳奇流派可用的卡」：依目前傳奇的兩個流派篩選（無色卡、戰場一律顯示；專屬卡只顯示該英雄的）
- Deck Code：匯出／匯入牌組代碼、下載 CSV、存到 Deck List (localStorage)
- Deck View／Card List：檢視整副牌組
- Comment：每張卡可寫備註，可匯出／匯入 JSON

## 加卡限制
- 不做構築規則檢查（流派、選定英雄等），只在加卡時擋張數上限
- 傳奇 1 張
- 主牌組 40 張、同卡 3 張、專屬卡 (Signature) 合計 3 張
- 符文牌組 12 張
- 戰場 3 張、同卡 1 張
- 衍生物 (Token) 可搜尋但不能放進牌組
- 禁止卡：依官方 [Rules Hub](https://playriftbound.com/en-us/rules-hub/)「Constructed Format Legality」（2026-09-18 版）標示，**只標示不阻擋**
  - Standard（也適用 2v2）：紅色實線框＋加入時提示，共 12 張 — 打擊宣言 Called Shot、艾克－回溯 Ekko, Recurrent、達瑞文－征服勇士 Draven, Vanquisher、戰或逃 Fight or Flight、廢物利用 Scrapheap、匿蹤追獵者 Stealthy Pursuer、卡牌騙術 Stacked Deck；戰場 競技場之巔 The Arena's Greatest、登峰之路 Aspirant's Climb、夢境之樹 The Dreaming Tree、力量方尖碑 Obelisk of Power、掠奪者船頭 Reaver's Row
  - 2v2 Constructed 另禁：傳奇 無極劍聖 Master Yi, Wuju Bladesman（橘色虛線框）
  - 更新：改 `tools/build_card_info.py` 裡的 `BAN_LIST`／`BAN_LIST_2V2`／`BAN_LIST_DATE` 後重新執行（官方目前沒有限制卡制度）

## 資料
- 卡片資料・卡圖：[符文戰場 卡牌圖集](https://playriftbound.com/zh-tw/card-gallery/)（2026-11-03 取得）
  - 起源 (OGN)、起源－試煉之地 (OGS)、鑄魂淬鍊 (SFD)、潛能怒放 (UNL)、血海深仇 (VEN)、熠耀光彩 (RAD)：1408 筆 → 1103 種
  - 官網繁中版目前只有 OGN／OGS／SFD 是中文，UNL／VEN／RAD 的卡名、能力與卡圖都是英文（中文模式下這三彈仍顯示英文）
  - 英文名・英文能力・英文卡圖取自官網 en-us 卡牌圖集；英文版缺一般版時（目前 SFD-054 賈克斯）改用同號異圖的英文資料
  - 異圖（卡號帶 a／*／SP、或超過系列總數的超框號碼）不另收；同名同類卡（例：符文、重印卡）以最早系列的一般版為準，收錄系列合併顯示
  - 官網有 11 張 RAD 卡沒有標示流派（RAD-006/009/022/026/041/047/049/104/121/123/134），顯示為「未標示」，篩選時不會被流派條件排除
- 卡圖直接外連官方圖床 `cmsassets.rgpub.io`；讀不到時自動改用文字卡圖
- 更新資料：
  1. 在官網卡牌圖集頁的 Console 執行 `tools/scrape_riftbound_console.js`，點黃色按鈕下載 `riftbound_cards.json`
  2. 放到 `tools/`，執行 `python tools/build_card_info.py` 產生 `js/card_info.js`

## Release note
20261103 v1.00
1. First release.
