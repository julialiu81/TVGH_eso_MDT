# 臺北榮總食道癌多專科診療指引 Web App (v4)

互動式食道癌（鱗狀細胞癌 SCC / 腺癌 Adenocarcinoma）多專科診療指引。
來源：`ESG_v20251230.pptx`（72 張投影片，2025/12/30 修訂版，臺北榮總食道癌多專科團隊）；分期依 AJCC 8th，主要參考 NCCN Esophageal and Esophagogastric Junction Cancers。
臨床內容逐字搬自 v3 單檔版（`_dev/index_v3_reference.html`），只補分期表、參考文獻面板、標籤、`refs` 連結與 `sub` 副標（見 `SPEC.md`）。
單頁 React 18 (UMD) + Babel standalone + Tailwind CDN，無建置步驟；內容全部放在 `data/*.js`。
介面、互動模式與資料契約沿用 `../thymic carcinoma guidelines/`、`../lung cancer guidelines/`（命名空間 `window.ECG`），差異見 `SPEC.md`。

## 開啟方式

- 直接雙擊 `index.html`（`file://` 即可，不需伺服器）。
- 需要網路連線以載入 CDN：React 18.3.1、ReactDOM 18.3.1、@babel/standalone 7.26.10、Tailwind CDN 3.4.16（皆鎖版）。
  CDN 無法連線時會顯示錯誤訊息，而非空白頁。
- `index.html` 必須與 `data/` 位於同一資料夾。任一 data 檔不存在或執行錯誤時，頁面頂端會顯示紅色「資料檔載入失敗」提示。
- **本 app 不提供原始頁面（投影片）檢視**：`META.sourcePages = 0`，所有「原始頁面」按鈕、首頁「原始指引」卡片與頁碼都不顯示。
  投影片圖片 `_dev/slides/s01..s72.png` 只供維護者核對內容，不部署。

### 功能

| 功能 | 說明 |
|---|---|
| 決策樹 | 首頁列出 `ECG.TREE.root` 的選項：鱗狀細胞癌、腺癌，以及「SCC 後續評估」「腺癌後續評估」兩個快捷入口（治療反應 / 手術結果 / 復發）。結果卡顯示標籤、相關參考資料、備註與後續路徑 |
| 全文搜尋 | header 放大鏡、`/` 或 `Ctrl+K`；多關鍵字以空白分隔（AND）；可搜尋節點、註腳、參考面板各小節 |
| 分期計算器 | AJCC 8th，多分期系統：SCC / 腺癌 × cTNM / pTNM / ypTNM。上方選分期系統，每個欄位（T、N、M，pTNM 另有 G、Location）一列按鈕；選齊後顯示 stage 與「以此分期進入決策樹」。≤3 個欄位的系統附 T × N 分期總表（每個 M 一頁，點格子可帶入）。清單、定義、分期、進入節點全部來自 `ECG.STAGE_TABLE` |
| 參考抽屜 | 右側滑入，依「診斷與分期 / 治療原則 / 其他」分組；本頁目錄、錨點捲動、桌面可加寬 |
| 標籤 | `preferred` 建議優先（綠）、`mdt` 需多專科討論、`trial` 建議臨床試驗；首頁圖例只列出資料中實際用到的等級。簡報沒有健保 / TFDA 資訊，不使用 `nhi_*` / `tfda_no` |

### URL（可分享、重新整理可還原）

| Hash | 意義 |
|---|---|
| `#/` | 首頁 |
| `#/path/root/scc_stage/…` | 決策路徑（breadcrumb = 這串 id） |
| `#/node/res_…` | 從搜尋直接跳到節點（breadcrumb：搜尋 → 節點） |
| `#/ref/CHEMO`、`#/ref/CHEMO/neoadj_ccrt` | 開啟參考面板（並捲到 `id="CHEMO-neoadj_ccrt"`） |
| `#/stage` | 分期計算器（回到上次使用的分期系統與選擇；首次開啟為第一個系統） |
| `#/stage/scc_c`、`#/stage/scc_c/T2/N0/M0` | 指定分期系統（＋依 axes 順序帶入各欄位值） |
| `#/stage/scc_p/T1a/N0/M0/G1/Upper` | 5 個欄位的 SCC pTNM |
| `#/stage/T2/N0/M0` | 舊式連結（無系統 key）：自動選用第一個認得該 T 值的系統 |

## 驗證資料

```bash
node validate.js                 # 檢查 data/*.js（依檔名排序載入）
node validate.js --no-spec ...   # 部分資料集：略過 SPEC 必備節點/面板/錨點/分期系統檢查
node validate.js --stage         # 另外印出分期矩陣（T × N，每個 M 一張；>3 欄位的系統列出其餘欄位會出現的所有 stage）
node validate.js data/00_core.js _dev/mock_data.js   # 指定檔案（例如 mock）
```

檢查項目：瀏覽器共用 global scope 下能否執行（例如兩個檔案都在最外層宣告 `const ECG` 會在瀏覽器出錯）、跨檔覆寫同一個 TREE/FOOTNOTES/REF_DATA key、
`options[].next` / `nextSteps[].next` 指向存在的節點、`notes[]` 存在於 FOOTNOTES、`refs[].panel`/`anchor` 存在、
結果節點有 `isResult` + `content`、標籤 level 合法、面板 HTML 內部連結（`#/ref`、`#/path`、`#/stage/<系統>/…`）與 id、殘留的 v3 Tailwind class（警告）、
從 `root` 無法到達的節點（警告）。
`source`：`META.sourcePages = 0` 時為選填，有填就必須是投影片編號 1–72（`SLIDE_COUNT`）；`sourcePages > 0` 時每個節點與面板都必填。

`STAGE_TABLE`：走訪每個分期系統所有欄位組合（例如 SCC pTNM 7 × 4 × 2 × 4 × 4 = 896 種），`group()` 不可拋錯、
回傳值必須是 `0, I, IA, IB, IC, II, IIA, IIB, III, IIIA, IIIB, IVA, IVB` 或 `null`（無對應，UI 顯示「—」）；
對每個有分期的組合呼叫 `entry()`，回傳格式與節點都必須存在。輸出每個系統的組合數、stage 分布與 entry 目標統計。
舊式單一系統格式 `{ T, N, M, group(t, n, m), entry(stage, t, n, m) }`（胸腺癌 / 肺癌）仍會檢查（SPEC 檢查時列為錯誤，因本 app 要求 `schemes`）。

SPEC 檢查（`--no-spec` 略過）：

- §2.1 必備節點 `root, scc_stage, scc_unresectable, scc_post_er, scc_response_preop, scc_response_def, scc_surgical_type, scc_recurrence,
  adeno_stage, adeno_unresectable, adeno_response_preop, adeno_response_def, adeno_surgical_type, adeno_recurrence, scc_followup_entry, adeno_followup_entry`；
  `root` 選項需連到 `scc_stage, adeno_stage, scc_followup_entry, adeno_followup_entry`；兩個 followup 入口應連到各自的後續評估節點（警告）；
  節點 id 前綴 `root / scc_ / adeno_ / res_`（警告）；選項 label 含全形（中文）括號（警告，中文說明請放 `sub`）。
- §2.2 必備面板與分組 `WORKUP, TNM, PATHOLOGY`（dx）、`SURGERY, CHEMO, RADIO, PARTICLE, FOLLOWUP`（tx）、`TRIALS, REFERENCES, TEAM`（misc），必要錨點：
  `TNM`: t, n, m, g, location, scc_c, scc_p, scc_yp, adeno_c, adeno_p, adeno_yp；`SURGERY`: resectability, outcomes；
  `CHEMO`: neoadj_ccrt, definitive_ccrt, adjuvant, palliative, periop, egj_adjuvant, egj_metastatic；
  `RADIO`: general, target, preop, definitive, postop；`REFERENCES`: surgery, chemo, radio。
- §2.3 必備分期系統 `scc_c, scc_p, scc_yp, adeno_c, adeno_p, adeno_yp` 及其欄位 / 選項（例如 `scc_p` 需 T: Tis…T4b、N0–N3、M0/M1、GX–G3、Upper/Middle/Lower/X）；
  欄位順序與 SPEC 不同時警告（URL 依此順序）；`entry()` 應包含 SPEC 指定的節點（警告）：
  `scc_c` → `scc_stage`（IVB → `scc_unresectable`）、`scc_p/scc_yp` → `scc_surgical_type`、
  `adeno_c` → `adeno_stage`（IVB → `adeno_unresectable`）、`adeno_p/adeno_yp` → `adeno_surgical_type`。
- 標籤只用 `preferred` / `mdt` / `trial`（其他 level 警告）。

有 ERROR 時 exit code = 1。

## 建置單檔版本

```bash
python build_single.py                  # → dist/eso_guidelines_single.html
python build_single.py --allow-missing  # data 檔缺漏時仍建置（頁面會顯示載入錯誤）
```

把 `data/*.js` 內嵌進 `index.html`（僅用 Python 標準函式庫）。單檔仍需網路載入 CDN；本 app 沒有原始頁面圖片，單檔即完整。

## 部署

`wrangler.jsonc`（Cloudflare Workers static assets，name `vghtpe-eso-guideline`）把本資料夾當靜態網站發佈；
`.assetsignore` 排除 `_dev/`（含投影片圖片）、`_old/`、`dist/`、`*.pptx`、驗證/建置腳本與文件，實際只發佈 `index.html` 與 `data/`。

## 資料夾結構

```
esophageal cancer guidelines/
├── index.html            # UI 殼（不含內容）：先載入 data/*.js，再執行 text/babel UI
├── data/
│   ├── 00_core.js        # window.ECG 命名空間、META（sourcePages = 0）、TAG_LEVELS、共用註腳 (note_disclaimer, note_mdt)
│   ├── 10_tree_scc.js    # root、兩個 followup 入口、SCC 決策樹 + SCC 用註腳
│   ├── 15_tree_adeno.js  # 腺癌決策樹 + 腺癌用註腳
│   ├── 30_ref_dx.js      # 面板：TEAM, WORKUP, TNM (+STAGE_TABLE), PATHOLOGY, SURGERY
│   └── 40_ref_tx.js      # 面板：CHEMO, RADIO, PARTICLE, FOLLOWUP, TRIALS, REFERENCES
├── validate.js           # node 資料檢查
├── build_single.py       # 產生 dist/eso_guidelines_single.html
├── wrangler.jsonc, .assetsignore   # Cloudflare 部署設定
├── dist/                 # 建置輸出（不發佈）
├── _old/                 # v1–v3 舊檔與舊改善計畫（不部署、不再維護）
├── _dev/                 # 開發用（不發佈）
│   ├── index_v3_reference.html # v3 單檔原始碼（臨床內容來源）
│   ├── slides/s01..s72.png     # 投影片圖片：只供核對內容，不做原始頁面檢視
│   ├── pptx_text.txt           # pptx 文字抽取
│   ├── mock_data.js            # 小型 mock 資料集（非臨床內容；6 個分期系統，含 3 / 4 / 5 欄位）
│   ├── mock_legacy_stage.js    # 舊式 T/N/M STAGE_TABLE（相容性測試）
│   ├── make_mock.py            # 由 index.html 產生 index_mock*.html（mock / broken / nostage / legacy）
│   ├── mock_broken.js, mock_syntax_error.js   # 錯誤狀態測試用
│   ├── ui_test.py              # Playwright 測試（mock，390px / 1280px）
│   └── real_test.py            # Playwright 全節點 / 全面板 / 全分期系統巡檢（真實資料）
├── ESG_v20251230.pptx    # 原始投影片（不發佈）
├── SPEC.md               # v4 改版規格（節點 id、面板、STAGE_TABLE）
└── README.md
```

備份：v4 改版前的整個資料夾在 `../備份/esophageal cancer guidelines_20261104_before_v4/`。

## 給內容撰寫者

- data 檔是純 JS（無 JSX），整個檔案包在 `(function () { const ECG = window.ECG; … })();` 裡。
  **不要在最外層宣告 `const/let ECG`**：瀏覽器中所有 `<script>` 共用同一個 global scope，第二個檔案會出現
  `Identifier 'ECG' has already been declared` 而整檔失效（`node validate.js` 會抓到）。
- 只用 `Object.assign` / `push` 追加，不要覆寫 `ECG.TREE` 等物件。用 Write/Edit 工具寫檔，不要用 shell heredoc（反斜線會被吃掉）。
- 決策樹文字是純文字：用 `\n` 換行；以 `• ` 開頭的行會顯示成清單，以 `：`/`:` 結尾的行顯示成小標題。
  選項 label 用英文或中英，中文補充放 `sub`。
- `source`（投影片編號 1–72）選填，只供日後查證，畫面上不顯示。
- 面板 HTML 可用的 class：`ref-h4`、`ref-table`、`ref-note`、`ref-warn`、`tag tag-<level>`；`<details>/<summary>` 可摺疊（錨點在摺疊內時會自動展開）。
  錨點格式 `<h4 class="ref-h4" id="PANEL-anchor">`；面板內可用 `<a href="#/ref/CHEMO/adjuvant">`、`<a href="#/path/root/scc_stage">`、
  `<a href="#/stage/scc_c/T2/N0/M0">` 互相連結（validate.js 會檢查目標）。表格會自動包上可橫向捲動的容器（手機可讀）。
- `STAGE_TABLE`（`data/30_ref_dx.js`，SPEC §2.3）：

  ```js
  ECG.STAGE_TABLE = {
    edition: "AJCC 8th",              // 顯示在計算器標題與首頁卡片
    title: "…",                       // 選填，計算器標題（預設「TNM 分期」）
    source: [36, 37, 38, 39, 40],     // 選填
    defs: { T: [{ id, label?, def? }, …], N: […], M: […], G: […], L: […] },   // 共用定義
    schemes: [{
      key: "scc_p",                   // URL 片段 #/stage/scc_p/…（只用英數、_、-）
      label: "SCC 病理分期 (pTNM)",    // 分期系統按鈕文字
      sub: "…", note: "…",            // 選填：按鈕下的小字 / 選擇系統後顯示的說明（純文字，可 \n）
      ref: { panel: "TNM", anchor: "scc_p", label: "…" },   // 選填；未提供時若 TNM 面板有 id="TNM-<key>" 會自動出現「分期表」按鈕
      axes: [ { key: "T", label?: "cT", en?: "Primary tumor", items: ["Tis", "T1a", …] }, …, { key: "L", items: ["Upper", "Middle", "Lower", "X"] } ],
      group(values) { /* values = { T: "T1a", N: "N0", M: "M0", G: "G2", L: "Upper" } */ return "IB"; },
      entry(stage, values) { return "scc_surgical_type"; }
    }, …]
  };
  ```

  - `axes` 的順序 = 計算器列的順序 = URL 中值的順序。`items` 可寫 id 字串（label/def 由 `defs[axis.key]` 依 id 查）或 `{ id, label, def }`；
    省略 `items` 時使用整個 `defs[axis.key]`。id 不可含 `/`、`?`、`#`、空白。欄位 label 預設「原發腫瘤 (T)」「區域淋巴結 (N)」「遠端轉移 (M)」「組織分化 (G)」「腫瘤位置 (L)」。
  - `group(values)` 回傳 stage 字串（`0, I, IA, IB, IC, II, IIA, IIB, III, IIIA, IIIB, IVA, IVB`）或 `null`（表中沒有定義的組合，計算器顯示「—」）。不可拋錯。
  - `entry(stage, values)` 可回傳節點 id 字串、id 陣列、`{ id, why }` 或其陣列；第一個是主要按鈕「以此分期進入決策樹」，其餘顯示為「或進入」，
    `why` 顯示為小字提示。未提供 / 拋錯 / 回傳空值時：有 `a_entry` / `m_entry` 節點則依 IV / 非 IV 進入（胸腺癌相容），否則進入 `root`。
  - 2–3 個欄位的系統會顯示「第 1 欄 × 第 2 欄」分期總表，第 3 欄（M）每個值一頁；超過 3 個欄位不顯示總表，改提示「分期表」按鈕。
  - 舊式 `{ T, N, M, group(t, n, m), entry(stage, t, n, m) }` 仍可運作（單一系統、URL `#/stage/T/N/M`），但本 app 規定使用 `schemes`。

## 開發

```bash
python _dev/make_mock.py     # 修改 index.html 後重新產生 mock 頁面
python _dev/ui_test.py       # mock：首頁、路徑、搜尋、錨點、多系統分期計算器（含 STAGE_TABLE = null、舊格式、錯誤資料）（390px / 1280px）
python _dev/real_test.py     # 真實資料：逐一開啟所有節點、面板、refs 錨點、SPEC 必要錨點，並走過每個分期系統的每個 stage
```
