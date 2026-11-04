# 臺北榮總食道癌診療指引 Web App v4 — 改版規格 (SPEC)

> 目標：把既有單檔 v3 app（`_dev/index_v3_reference.html`，2025/12/30 修訂版，93 個決策節點、10 個參考面板）搬進肺癌 / 胸腺癌 app 共用的 UI 殼，取得 URL 深連結、全文搜尋、分期計算器、鎖版 CDN、資料驗證與測試。
> **臨床內容以 v3 為準，逐字搬移，不得改寫建議內容**；只允許：補分期表（投影片 36–40）、補參考文獻面板、補 `tags`（只用 v3 / 投影片已標示的 preferred）、補 `refs` 連結、補 `sub` 副標。
> 來源簡報：`ESG_v20251230.pptx`（72 張）；投影片圖片在 `_dev/slides/s01..s72.png`（**只供核對，不部署、不做原始頁面檢視**）；文字抽取 `_dev/pptx_text.txt`。
> 備份：`../備份/esophageal cancer guidelines_20261104_before_v4/`。
> UI 殼與契約：已從 `../thymic carcinoma guidelines/` 複製 `index.html`、`validate.js`、`build_single.py`、`_dev/*`，命名空間 `TCG` → `ECG`。胸腺癌與肺癌的 `SPEC.md` / `README.md` 描述的資料契約、CSS class（`ref-h4`、`ref-table`、`ref-note`、`ref-warn`、`tag tag-<level>`、`<details>`）全部沿用。

---

## 1. 檔案結構

```
esophageal cancer guidelines/
├── index.html                # UI 殼（Agent U 調整）
├── data/
│   ├── 00_core.js            # 已建立：window.ECG、META（sourcePages = 0）、TAG_LEVELS、共用註腳
│   ├── 10_tree_scc.js        # root + SCC 決策樹 + SCC 用註腳（Agent T）
│   ├── 15_tree_adeno.js      # 腺癌決策樹 + 腺癌用註腳（Agent T）
│   ├── 30_ref_dx.js          # TEAM, WORKUP, TNM(+STAGE_TABLE), PATHOLOGY, SURGERY（Agent R）
│   └── 40_ref_tx.js          # CHEMO, RADIO, PARTICLE, FOLLOWUP, TRIALS, REFERENCES（Agent R）
├── _dev/index_v3_reference.html   # v3 原始碼（內容來源）
├── _dev/slides/s01..s72.png, _dev/pptx_text.txt
├── _old/                     # v1–v3 舊檔與舊改善計畫（不部署）
├── validate.js, build_single.py, README.md, wrangler.jsonc（Agent U）
└── SPEC.md
```

data 檔為純 JS（無 JSX），整檔包在 `(function () { const ECG = window.ECG; … })();`，最外層不可宣告 `const/let ECG`；只用 `Object.assign` / `push`。

---

## 2. 資料契約差異（相對於胸腺癌 SPEC）

- **節點 id 全部沿用 v3**（`root`、`scc_stage`、`scc_t1a_ep`…、`adeno_stage`…、`res_*`），不可改名；UI、STAGE_TABLE.entry()、validate.js 都以這些 id 為準。
- `source` 欄位**選填**（可填投影片編號 1–72 供日後查證）；`META.sourcePages = 0` 時 UI 不顯示原始頁面按鈕，validate.js 不檢查 source。
- `tags`：只用 `preferred`（v3 內容或投影片標示 preferred / prefer regimen 者）、`mdt`、`trial`。**不得加 nhi_* / tfda_no**（簡報沒有給付資訊）。
- 決策樹選項格式統一：**英文或中英 label，中文補充放 `sub`**，不要在 label 用全形括號塞中文翻譯（v3 有些選項如「鱗狀細胞癌 (Squamous cell carcinoma)」屬中文主標＋英文，可保留）。
- 結果節點 `refs` 連到面板錨點（§3）；v3 中「See Surgical Outcomes」「參考化療面板」之類文字改成 `refs`。

### 2.1 必備入口節點（validate.js REQUIRED_NODES）
`root`, `scc_stage`, `scc_unresectable`, `scc_post_er`, `scc_response_preop`, `scc_response_def`, `scc_surgical_type`, `scc_recurrence`, `adeno_stage`, `adeno_unresectable`, `adeno_response_preop`, `adeno_response_def`, `adeno_surgical_type`, `adeno_recurrence`。
`root` 選項：`scc_stage`、`adeno_stage`（同 v3）。另在 `root` 之下**新增**兩個快捷選項（label 自訂，`sub` 說明）：「SCC 後續評估（治療反應 / 手術結果 / 復發）」→ 新問題節點 `scc_followup_entry`（選項連到 `scc_post_er`、`scc_response_preop`、`scc_response_def`、`scc_surgical_type`、`scc_recurrence`）；腺癌同理 `adeno_followup_entry`。這兩個 id 也列入 REQUIRED_NODES。

### 2.2 面板 key、分組、必要錨點（Agent R）

| key | label | group | 來源（v3 面板 + 投影片） | 必要錨點 |
|---|---|---|---|---|
| WORKUP | 術前檢查 | dx | v3 WORKUP；s8–10 | — |
| TNM | TNM 分期 (AJCC 8th) | dx | v3 TNM；s35–40 | `t`, `n`, `m`, `g`, `location`, `scc_c`, `scc_p`, `scc_yp`, `adeno_c`, `adeno_p`, `adeno_yp` |
| PATHOLOGY | 病理原則 | dx | v3 PATHOLOGY；s6–7 | — |
| SURGERY | 外科原則 | tx | v3 SURGERY；s12–13, 34 | `resectability`, `outcomes` |
| CHEMO | 化學治療 / 全身治療 | tx | v3 CHEMO；s42–57 | `neoadj_ccrt`, `definitive_ccrt`, `adjuvant`, `palliative`, `periop`, `egj_adjuvant`, `egj_metastatic` |
| RADIO | 放射治療 | tx | v3 RADIO；s63–68, 70–71 | `general`, `target`, `preop`, `definitive`, `postop` |
| PARTICLE | 粒子治療 | tx | v3 PARTICLE；s69 | — |
| FOLLOWUP | 追蹤原則 | tx | v3 FOLLOWUP；s72 | — |
| TRIALS | 關鍵臨床試驗 | misc | v3 TRIALS | — |
| REFERENCES | 參考文獻 | misc | **新增**：s34、s58–61、s70–71 | `surgery`, `chemo`, `radio` |
| TEAM | 團隊組成 | misc | v3 TEAM；s4 | — |

v3 面板 HTML 用的是 Tailwind 長串 class（`font-bold text-lg text-brand-700 …`），搬移時改成殼提供的 class：`<h4 class="ref-h4" id="PANEL-anchor">`、`<table class="ref-table">`、`<div class="ref-note">`、`<details>`。內容文字逐字保留。

### 2.3 STAGE_TABLE（Agent R，放 30_ref_dx.js）— 多方案、多軸通用格式

```js
ECG.STAGE_TABLE = {
  edition: "AJCC 8th",
  source: [36, 37, 38, 39, 40],
  defs: {        // 共用定義（供 TNM 面板與計算器 hover）
    T: [ { id:"Tis", label:"Tis", def:"High-grade dysplasia…" }, T1a, T1b, T2, T3, T4a, T4b ],   // 計算器用；T1（未分 a/b）與 T4（未分 a/b）也要能選：cTNM 表用 T1/T4
    N: [ N0, N1, N2, N3 ], M: [ M0, M1 ],
    G: [ GX, G1, G2, G3 ], L: [ { id:"Upper" }, { id:"Middle" }, { id:"Lower" }, { id:"X", label:"Location X" } ]
  },
  schemes: [
    { key:"scc_c",    label:"SCC 臨床分期 (cTNM)",            axes:[ {key:"T", items:[Tis,T1,T2,T3,T4]}, {key:"N", items:[N0,N1,N2,N3]}, {key:"M", items:[M0,M1]} ],
      group(v) { /* v = {T,N,M}; s39 cTNM 表逐列 */ return "IVA"; },
      entry(stage, v) { return stage === "IVB" ? "scc_unresectable" : "scc_stage"; } },
    { key:"scc_p",    label:"SCC 病理分期 (pTNM)",  axes: T(Tis,T1a,T1b,T2,T3,T4a,T4b), N, M, G(GX,G1,G2,G3), L(Upper,Middle,Lower,X) ; entry → "scc_surgical_type" },
    { key:"scc_yp",   label:"SCC 術前治療後病理分期 (ypTNM)", axes: T(T0,T1,T2,T3,T4a,T4b), N(N0,N1,N2,N3,NX), M ; entry → "scc_surgical_type" },
    { key:"adeno_c",  label:"腺癌 臨床分期 (cTNM)", axes: T(Tis,T1,T2,T3,T4a,T4b), N, M ; entry → stage IVB ? "adeno_unresectable" : "adeno_stage" },
    { key:"adeno_p",  label:"腺癌 病理分期 (pTNM)", axes: T(Tis,T1a,T1b,T2,T3,T4a,T4b), N, M, G ; entry → "adeno_surgical_type" },
    { key:"adeno_yp", label:"腺癌 術前治療後病理分期 (ypTNM)", axes: T(T0,T1,T2,T3,T4a,T4b), N(N0,N1,N2,N3,NX), M ; entry → "adeno_surgical_type" }
  ]
};
```
- 每個 scheme：`key`、`label`、`axes:[{key,label?,items:[{id,label?,def?}]}]`、`group(values) → stage 字串或 null`（values 為 `{T:"T2", N:"N0", …}`）、`entry(stage, values) → id | id[] | {id,why} | 陣列`、`source:[頁]`。
- **逐列照投影片 s39（SCC）、s40（腺癌）填**。表中沒列的組合（例如 cTNM 的 T1 N3 → 屬 Any T N3 → IVA；pTNM 的 T1a N0 M0 G2 Any location → IB）要正確落入「Any」列；真的沒定義的組合回傳 `null`（UI 顯示「—」）。
- 有效 stage 字串：`0, I, IA, IB, IC, II, IIA, IIB, III, IIIA, IIIB, IVA, IVB`。
- 兼容：UI 若只找到 `STAGE_TABLE.T/N/M`（舊格式）也要能動（胸腺癌、肺癌），但本 app 用 `schemes`。

---

## 3. UI 調整（Agent U）

1. `index.html`：已全域 `TCG`→`ECG`。改標題、meta description、預設字串（胸腺癌 → 食道癌）、icon。`META.sourcePages === 0` 時：隱藏所有「原始頁面」按鈕與首頁「原始指引」卡片、原始頁面 modal 不可開啟、搜尋結果不顯示頁碼。
2. **分期計算器改成多方案多軸**：讀 `STAGE_TABLE.schemes`；上方 tab/下拉選 scheme；每個軸一列按鈕（items 的 `label`/`def`）；全部軸選齊後顯示 stage 與 `entry()` 按鈕（語意同胸腺癌版：字串 / 陣列 / `{id,why}`）。URL：`#/stage/<schemeKey>/<T>/<N>/<M>[/<G>/<L>]`（依 axes 順序）。軸數 ≤3 時可顯示 T×N 格子（每個 M 一張），>3 不顯示格子。沒有 `schemes` 但有 `T/N/M` 時退回單方案模式（維持與胸腺癌/肺癌相容）。
3. 首頁：root 選項由 TREE 提供（含新增的兩個後續評估入口）；快捷列：分期計算器、搜尋、參考資料分組；無「原始指引」卡。頁尾：`note_disclaimer`、`note_mdt`、`META.basis`。
4. `validate.js`：EXPECTED_FILES、REQUIRED_NODES（§2.1）、ROOT_LINKS（`scc_stage`, `adeno_stage`, `scc_followup_entry`, `adeno_followup_entry`）、REQUIRED_PANELS 與 REQUIRED_ANCHORS（§2.2）、`sourcePages === 0` 時略過 source 檢查、STAGE_TABLE 改成走訪每個 scheme 的所有軸組合並檢查 `group()` 不拋錯、回傳值屬有效 stage 或 null、`entry()` 回傳的節點存在；印出每個 scheme 的組合數與 stage 分布。保留舊格式（T/N/M）相容。
5. `build_single.py` → `dist/eso_guidelines_single.html`；新增 `wrangler.jsonc`（name `vghtpe-eso-guideline`，比照胸腺癌）。
6. `_dev/`：mock 改成 ECG、本 SPEC 的 id/面板/錨點、含 `schemes` 的 mock STAGE_TABLE（至少一個 5 軸 scheme）；`ui_test.py`、`real_test.py` 對應更新；跑 `python _dev/make_mock.py`、`python _dev/ui_test.py`、`node validate.js data/00_core.js _dev/mock_data.js` 全綠。
7. `README.md`：仿胸腺癌版；說明備份位置、`_old/`、`_dev/slides` 只供核對。
8. 不要改 `data/10_*`、`15_*`、`30_*`、`40_*`。

---

## 4. 內容搬移原則（Agent T、R）

- 來源優先序：v3 `_dev/index_v3_reference.html` 的 `DECISION_TREE` / `FOOTNOTES` / `REF_DATA` → 投影片圖片核對 → 不得憑記憶新增臨床內容。
- 中英混用慣例同 v3。藥名、劑量、regimen、分期逐字保留。
- 自我檢查：`node validate.js --no-spec data/00_core.js data/你的檔…`，以及 `node -e "global.window={};require('./data/00_core.js');require('./data/10_tree_scc.js');require('./data/15_tree_adeno.js');console.log(Object.keys(window.ECG.TREE).length)"` 應得 95（v3 93 個 + 2 個新入口）。
- 用 Write/Edit 工具寫檔，不要用 shell heredoc（反斜線會被吃掉）。
