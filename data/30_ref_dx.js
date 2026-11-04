// 30_ref_dx.js — Agent R
// 參考面板：WORKUP, TNM (+ ECG.STAGE_TABLE), PATHOLOGY（group dx）；SURGERY（group tx）；TEAM（group misc）
// 內容來源：_dev/index_v3_reference.html 的 REF_DATA（逐字搬移，Tailwind class 換成殼的 class），
//           分期表逐列照投影片 s39（SCC）、s40（腺癌）；T/N/M/G/Location 定義照 s36–s38。
//           「投影片原文」<details> 內文字取自 _dev/pptx_text.txt 並逐張對照 _dev/slides/sNN.png。
// 純 JS（無 JSX）；node 與 browser 皆可載入。整檔包在 IIFE，不宣告全域 ECG。
window.ECG = window.ECG || {};
(function () {
  const ECG = window.ECG;
  ECG.REF_PANELS = ECG.REF_PANELS || [];
  ECG.REF_DATA = ECG.REF_DATA || {};

  /* ------------------------------------------------------------------ *
   * 0. 面板註冊（key / label / group 依 SPEC §2.2）
   *    TEAM 在 40_ref_tx.js 載入後會被移到清單最後（同 v3 選單順序）。
   * ------------------------------------------------------------------ */
  const PANELS = [
    { key: 'WORKUP', label: '術前檢查', group: 'dx' },
    { key: 'TNM', label: 'TNM 分期 (AJCC 8th)', group: 'dx' },
    { key: 'PATHOLOGY', label: '病理原則', group: 'dx' },
    { key: 'SURGERY', label: '外科原則', group: 'tx' },
    { key: 'TEAM', label: '團隊組成', group: 'misc' }
  ];
  PANELS.forEach(function (p) {
    if (!ECG.REF_PANELS.some(function (x) { return x.key === p.key; })) ECG.REF_PANELS.push(p);
  });

  /* ------------------------------------------------------------------ *
   * 1. AJCC 8th 定義（s36 T、s37 N/M、s38 G/Location；SCC 與腺癌共用）
   * ------------------------------------------------------------------ */
  const T = {
    T0: { id: 'T0', label: 'T0', def: 'No evidence of primary tumor' },
    Tis: { id: 'Tis', label: 'Tis', def: 'High-grade dysplasia, defined as malignant cells confined to the epithelium by the basement membrane' },
    T1: { id: 'T1', label: 'T1', def: 'Tumor invades the lamina propria, muscularis mucosae, or submucosa' },
    T1a: { id: 'T1a', label: 'T1a', def: 'Tumor invades the lamina propria or muscularis mucosae' },
    T1b: { id: 'T1b', label: 'T1b', def: 'Tumor invades the submucosa' },
    T2: { id: 'T2', label: 'T2', def: 'Tumor invades the muscularis propria' },
    T3: { id: 'T3', label: 'T3', def: 'Tumor invades adventitia' },
    T4: { id: 'T4', label: 'T4', def: 'Tumor invades adjacent structures' },
    T4a: { id: 'T4a', label: 'T4a', def: 'Tumor invades the pleura, pericardium, azygos vein, diaphragm, or peritoneum' },
    T4b: { id: 'T4b', label: 'T4b', def: 'Tumor invades other adjacent structures, such as the aorta, vertebral body, or airway' }
  };
  const N = {
    NX: { id: 'NX', label: 'NX', def: 'Regional lymph nodes cannot be assessed' },
    N0: { id: 'N0', label: 'N0', def: 'No regional lymph node metastasis' },
    N1: { id: 'N1', label: 'N1', def: 'Metastasis in one or two regional lymph nodes' },
    N2: { id: 'N2', label: 'N2', def: 'Metastasis in three to six regional lymph nodes' },
    N3: { id: 'N3', label: 'N3', def: 'Metastasis in seven or more regional lymph nodes' }
  };
  const M = {
    M0: { id: 'M0', label: 'M0', def: 'No distant metastasis' },
    M1: { id: 'M1', label: 'M1', def: 'Distant metastasis' }
  };
  const G = {
    GX: { id: 'GX', label: 'GX', def: 'Grade cannot be assessed' },
    G1: { id: 'G1', label: 'G1', def: 'Well differentiated' },
    G2: { id: 'G2', label: 'G2', def: 'Moderately differentiated' },
    G3: { id: 'G3', label: 'G3', def: 'Poorly differentiated, undifferentiated' }
  };
  const L = {
    Upper: { id: 'Upper', label: 'Upper', def: 'Cervical esophagus to lower border of azygos vein' },
    Middle: { id: 'Middle', label: 'Middle', def: 'Lower border of azygos vein to lower border of inferior pulmonary vein' },
    Lower: { id: 'Lower', label: 'Lower', def: 'Lower border of inferior pulmonary vein to stomach, including gastroesophageal junction' },
    X: { id: 'X', label: 'Location X', def: 'Location unknown' }
  };
  function pick(dict, ids) { return ids.map(function (k) { return dict[k]; }); }

  const AX = {
    cT_scc: { key: 'T', label: 'cT', items: pick(T, ['Tis', 'T1', 'T2', 'T3', 'T4']) },
    cT_adeno: { key: 'T', label: 'cT', items: pick(T, ['Tis', 'T1', 'T2', 'T3', 'T4a', 'T4b']) },
    pT: { key: 'T', label: 'pT', items: pick(T, ['Tis', 'T1a', 'T1b', 'T2', 'T3', 'T4a', 'T4b']) },
    ypT: { key: 'T', label: 'ypT', items: pick(T, ['T0', 'T1', 'T2', 'T3', 'T4a', 'T4b']) },
    cN: { key: 'N', label: 'cN', items: pick(N, ['N0', 'N1', 'N2', 'N3']) },
    pN: { key: 'N', label: 'pN', items: pick(N, ['N0', 'N1', 'N2', 'N3']) },
    ypN: { key: 'N', label: 'ypN', items: pick(N, ['N0', 'N1', 'N2', 'N3', 'NX']) },
    M: { key: 'M', label: 'M', items: pick(M, ['M0', 'M1']) },
    G: { key: 'G', label: 'G', items: pick(G, ['GX', 'G1', 'G2', 'G3']) },
    L: { key: 'L', label: 'Location', items: pick(L, ['Upper', 'Middle', 'Lower', 'X']) }
  };

  /* ------------------------------------------------------------------ *
   * 2. 分期表（逐列照投影片；儲存格文字＝投影片原文，由 cellSet() 展開成 id 集合）
   *    "Any T" / "Any N" / "Any" / "N/A" → 該軸全部；"T1–3"、"N0–1"、"G2–3"、"T1–4a" → 範圍；
   *    "T1"（在只有 T1a/T1b 的方案）→ T1a + T1b；"Upper/middle" → Upper + Middle；"Location X" → X。
   * ------------------------------------------------------------------ */
  // s39 Clinical (cTNM) (Fig. 16.6) — Squamous cell carcinoma
  const SCC_C = [
    ['Tis', 'N0', 'M0', '0'],
    ['T1', 'N0–1', 'M0', 'I'],
    ['T2', 'N0–1', 'M0', 'II'],
    ['T3', 'N0', 'M0', 'II'],
    ['T3', 'N1', 'M0', 'III'],
    ['T1–3', 'N2', 'M0', 'III'],
    ['T4', 'N0–2', 'M0', 'IVA'],
    ['Any T', 'N3', 'M0', 'IVA'],
    ['Any T', 'Any N', 'M1', 'IVB']
  ];
  // s39 Pathological (pTNM) (Fig. 16.7) — Squamous cell carcinoma
  const SCC_P = [
    ['Tis', 'N0', 'M0', 'N/A', 'Any', '0'],
    ['T1a', 'N0', 'M0', 'G1', 'Any', 'IA'],
    ['T1a', 'N0', 'M0', 'G2–3', 'Any', 'IB'],
    ['T1a', 'N0', 'M0', 'GX', 'Any', 'IA'],
    ['T1b', 'N0', 'M0', 'G1–3', 'Any', 'IB'],
    ['T1b', 'N0', 'M0', 'GX', 'Any', 'IB'],
    ['T2', 'N0', 'M0', 'G1', 'Any', 'IB'],
    ['T2', 'N0', 'M0', 'G2–3', 'Any', 'IIA'],
    ['T2', 'N0', 'M0', 'GX', 'Any', 'IIA'],
    ['T3', 'N0', 'M0', 'Any', 'Lower', 'IIA'],
    ['T3', 'N0', 'M0', 'G1', 'Upper/middle', 'IIA'],
    ['T3', 'N0', 'M0', 'G2–3', 'Upper/middle', 'IIB'],
    ['T3', 'N0', 'M0', 'GX', 'Any', 'IIB'],
    ['T3', 'N0', 'M0', 'Any', 'Location X', 'IIB'],
    ['T1', 'N1', 'M0', 'Any', 'Any', 'IIB'],
    ['T1', 'N2', 'M0', 'Any', 'Any', 'IIIA'],
    ['T2', 'N1', 'M0', 'Any', 'Any', 'IIIA'],
    ['T2', 'N2', 'M0', 'Any', 'Any', 'IIIB'],
    ['T3', 'N1–2', 'M0', 'Any', 'Any', 'IIIB'],
    ['T4a', 'N0–1', 'M0', 'Any', 'Any', 'IIIB'],
    ['T4a', 'N2', 'M0', 'Any', 'Any', 'IVA'],
    ['T4b', 'N0–2', 'M0', 'Any', 'Any', 'IVA'],
    ['Any T', 'N3', 'M0', 'Any', 'Any', 'IVA'],
    ['Any T', 'Any N', 'M1', 'Any', 'Any', 'IVB']
  ];
  // s39 / s40 Postneoadjuvant Therapy (ypTNM) (Fig. 16.8 SCC；Fig. 16.11 腺癌 — 兩表內容相同)
  const YP_ROWS = [
    ['T0–2', 'N0', 'M0', 'I'],
    ['T3', 'N0', 'M0', 'II'],
    ['T0–2', 'N1', 'M0', 'IIIA'],
    ['T3', 'N1', 'M0', 'IIIB'],
    ['T0–3', 'N2', 'M0', 'IIIB'],
    ['T4a', 'N0', 'M0', 'IIIB'],
    ['T4a', 'N1–2', 'M0', 'IVA'],
    ['T4a', 'NX', 'M0', 'IVA'],
    ['T4b', 'N0–2', 'M0', 'IVA'],
    ['Any T', 'N3', 'M0', 'IVA'],
    ['Any T', 'Any N', 'M1', 'IVB']
  ];
  // s40 Clinical (cTNM) (Fig. 16.9) — Adenocarcinoma
  const ADENO_C = [
    ['Tis', 'N0', 'M0', '0'],
    ['T1', 'N0', 'M0', 'I'],
    ['T1', 'N1', 'M0', 'IIA'],
    ['T2', 'N0', 'M0', 'IIB'],
    ['T2', 'N1', 'M0', 'III'],
    ['T3', 'N0–1', 'M0', 'III'],
    ['T4a', 'N0–1', 'M0', 'III'],
    ['T1–4a', 'N2', 'M0', 'IVA'],
    ['T4b', 'N0–2', 'M0', 'IVA'],
    ['Any T', 'N3', 'M0', 'IVA'],
    ['Any T', 'Any N', 'M1', 'IVB']
  ];
  // s40 Pathological (pTNM) (Fig. 16.10) — Adenocarcinoma
  // 第 14 列投影片的 M 欄印為「N0」（原表誤植），依上下文以 M0 處理，表格以註腳標示。
  const ADENO_P = [
    ['Tis', 'N0', 'M0', 'N/A', '0'],
    ['T1a', 'N0', 'M0', 'G1', 'IA'],
    ['T1a', 'N0', 'M0', 'GX', 'IA'],
    ['T1a', 'N0', 'M0', 'G2', 'IB'],
    ['T1b', 'N0', 'M0', 'G1–2', 'IB'],
    ['T1b', 'N0', 'M0', 'GX', 'IB'],
    ['T1', 'N0', 'M0', 'G3', 'IC'],
    ['T2', 'N0', 'M0', 'G1–2', 'IC'],
    ['T2', 'N0', 'M0', 'G3', 'IIA'],
    ['T2', 'N0', 'M0', 'GX', 'IIA'],
    ['T1', 'N1', 'M0', 'Any', 'IIB'],
    ['T3', 'N0', 'M0', 'Any', 'IIB'],
    ['T1', 'N2', 'M0', 'Any', 'IIIA'],
    ['T2', 'N1', 'M0', 'Any', 'IIIA', { M: 'N0<sup>*</sup>' }],
    ['T2', 'N2', 'M0', 'Any', 'IIIB'],
    ['T3', 'N1–2', 'M0', 'Any', 'IIIB'],
    ['T4a', 'N0–1', 'M0', 'Any', 'IIIB'],
    ['T4a', 'N2', 'M0', 'Any', 'IVA'],
    ['T4b', 'N0–2', 'M0', 'Any', 'IVA'],
    ['Any T', 'N3', 'M0', 'Any', 'IVA'],
    ['Any T', 'Any N', 'M1', 'Any', 'IVB']
  ];

  /* ------------------------------------------------------------------ *
   * 3. 通用逐列查表引擎
   * ------------------------------------------------------------------ */
  function idsOf(axis) { return axis.items.map(function (x) { return x.id; }); }
  // 'T1' → ['T1']（方案有 T1）或 ['T1a','T1b']（方案只有子類）
  function expandOne(tok, ids) {
    if (ids.indexOf(tok) >= 0) return [tok];
    const subs = ids.filter(function (id) { return id.indexOf(tok) === 0 && /^[ab]$/.test(id.slice(tok.length)); });
    if (subs.length) return subs;
    throw new Error('STAGE_TABLE: unknown cell "' + tok + '" (axis ids: ' + ids.join(',') + ')');
  }
  // 投影片儲存格文字 → id 陣列（載入時展開；打錯字會在載入時直接報錯，便於 node 驗證）
  function cellSet(axisKey, text, ids) {
    const t = String(text).replace(/\s+/g, ' ').trim();
    if (/^Any( [TN])?$/.test(t) || t === 'N/A') return ids.slice();
    if (axisKey === 'L') {
      if (t === 'Location X') return ['X'];
      return t.split('/').map(function (s) { s = s.trim(); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); })
        .map(function (s) { return expandOne(s, ids)[0]; });
    }
    const r = t.match(/^([TNG])(\d)([ab]?)[–-](\d)([ab]?)$/);
    if (r) {
      const lo = +r[2], hi = +r[4], out = [];
      for (let k = lo; k <= hi; k++) {
        const suf = k === hi ? r[5] : (k === lo ? r[3] : '');
        expandOne(r[1] + k + suf, ids).forEach(function (x) { out.push(x); });
      }
      return out;
    }
    return expandOne(t, ids);
  }
  // 使用者輸入值 → id 陣列；接受 cT2 / pT2 / ypT2、大小寫、母類別（T1→T1a+T1b）與子類別（T1a→T1）
  const L_ALIAS = { upper: 'Upper', middle: 'Middle', lower: 'Lower', x: 'X', lx: 'X', 'location x': 'X', unknown: 'X' };
  function normVal(axisKey, raw, ids) {
    if (raw == null) return null;
    let s = String(raw).trim();
    if (!s) return null;
    if (axisKey === 'L') { const a = L_ALIAS[s.toLowerCase()]; return a && ids.indexOf(a) >= 0 ? [a] : null; }
    s = s.replace(/^(yp|yc|rp|rc|c|p|y|r)(?=[TNMtnm])/, '');
    const low = s.toLowerCase();
    const hit = ids.filter(function (id) { return id.toLowerCase() === low; });
    if (hit.length) return hit;
    const kids = ids.filter(function (id) { return id.toLowerCase().indexOf(low) === 0 && /^[ab]$/.test(id.slice(low.length)); });
    if (kids.length) return kids;
    const parent = low.replace(/[ab]$/, '');
    if (parent !== low) {
      const p = ids.filter(function (id) { return id.toLowerCase() === parent; });
      if (p.length) return p;
    }
    return null;
  }

  function makeScheme(cfg) {
    const axes = cfg.axes;
    const keys = axes.map(function (a) { return a.key; });
    const rows = cfg.rows.map(function (r) {
      const disp = (r.length > keys.length + 1 && typeof r[keys.length + 1] === 'object') ? r[keys.length + 1] : {};
      const sets = {};
      keys.forEach(function (k, i) { sets[k] = cellSet(k, r[i], idsOf(axes[i])); });
      return {
        cells: keys.map(function (k, i) { return disp[k] || r[i]; }),
        text: keys.map(function (k, i) { return r[i]; }),
        stage: r[keys.length],
        sets: sets
      };
    });
    // 逐列比對，第一個符合的列即為答案（投影片列序）
    function lookup(combo) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (keys.every(function (k) { return row.sets[k].indexOf(combo[k]) >= 0; })) return row.stage;
      }
      return null;
    }
    // group(values) → stage 字串或 null；values = {T:'T2', N:'N0', M:'M0', G:'G1', L:'Lower'}
    // 亦接受依 axes 順序的位置參數 group('T2','N0','M0')。永不 throw。
    function group(values) {
      try {
        let v = values;
        if (v == null) return null;
        if (typeof v !== 'object') {
          const args = arguments; v = {};
          keys.forEach(function (k, i) { v[k] = args[i]; });
        }
        const lists = axes.map(function (a) { return normVal(a.key, v[a.key], idsOf(a)); });
        if (lists.some(function (l) { return !l; })) return null;
        const seen = [];
        (function walk(i, combo) {
          if (i === keys.length) { const s = lookup(combo); if (seen.indexOf(s) < 0) seen.push(s); return; }
          lists[i].forEach(function (id) { combo[keys[i]] = id; walk(i + 1, combo); });
        })(0, {});
        return seen.length === 1 ? seen[0] : null;      // 母類別展開後結果不一致 → null
      } catch (e) {
        return null;
      }
    }
    return {
      key: cfg.key,
      label: cfg.label,
      source: cfg.source,
      axes: axes,
      rows: rows.map(function (r) { return { cells: r.text, stage: r.stage }; }),   // 投影片原列（供 UI / 驗證）
      group: group,
      entry: cfg.entry,
      _rows: rows
    };
  }

  // entry(stage, values) → 決策樹入口（SPEC §2.3）
  const E = {
    scc_stage: { id: 'scc_stage', why: '依臨床 T/N 分期選擇 SCC 初始治療' },
    scc_unres: { id: 'scc_unresectable', why: 'Stage IVB（M1 遠端轉移）→ 依體能狀況選擇處置' },
    scc_surg_p: { id: 'scc_surgical_type', why: '未接受術前治療之病理分期 → 依手術結果（R0/R1/R2）決定術後處置' },
    scc_surg_yp: { id: 'scc_surgical_type', why: '術前治療後病理分期 → 依手術結果（ypT0N0 / 殘留 / R1 / R2）決定術後處置' },
    adeno_stage: { id: 'adeno_stage', why: '依臨床 T/N 分期選擇腺癌初始治療' },
    adeno_unres: { id: 'adeno_unresectable', why: 'Stage IVB（M1 遠端轉移）→ 依體能狀況選擇處置' },
    adeno_surg_p: { id: 'adeno_surgical_type', why: '未接受術前治療之病理分期 → 依手術結果（R0/R1/R2）決定術後處置' },
    adeno_surg_yp: { id: 'adeno_surgical_type', why: '術前治療後病理分期 → 依手術結果（ypT0N0 / 殘留 / R1 / R2）決定術後處置' }
  };

  const SCHEMES = [
    makeScheme({
      key: 'scc_c', label: 'SCC 臨床分期 (cTNM)', source: [36, 37, 39],
      axes: [AX.cT_scc, AX.cN, AX.M], rows: SCC_C,
      entry: function (stage) { return stage === 'IVB' ? E.scc_unres : E.scc_stage; }
    }),
    makeScheme({
      key: 'scc_p', label: 'SCC 病理分期 (pTNM)', source: [36, 37, 38, 39],
      axes: [AX.pT, AX.pN, AX.M, AX.G, AX.L], rows: SCC_P,
      entry: function (stage) { return stage === 'IVB' ? [E.scc_surg_p, E.scc_unres] : E.scc_surg_p; }
    }),
    makeScheme({
      key: 'scc_yp', label: 'SCC 術前治療後病理分期 (ypTNM)', source: [36, 37, 39],
      axes: [AX.ypT, AX.ypN, AX.M], rows: YP_ROWS,
      entry: function (stage) { return stage === 'IVB' ? [E.scc_surg_yp, E.scc_unres] : E.scc_surg_yp; }
    }),
    makeScheme({
      key: 'adeno_c', label: '腺癌 臨床分期 (cTNM)', source: [36, 37, 40],
      axes: [AX.cT_adeno, AX.cN, AX.M], rows: ADENO_C,
      entry: function (stage) { return stage === 'IVB' ? E.adeno_unres : E.adeno_stage; }
    }),
    makeScheme({
      key: 'adeno_p', label: '腺癌 病理分期 (pTNM)', source: [36, 37, 38, 40],
      axes: [AX.pT, AX.pN, AX.M, AX.G], rows: ADENO_P,
      entry: function (stage) { return stage === 'IVB' ? [E.adeno_surg_p, E.adeno_unres] : E.adeno_surg_p; }
    }),
    makeScheme({
      key: 'adeno_yp', label: '腺癌 術前治療後病理分期 (ypTNM)', source: [36, 37, 40],
      axes: [AX.ypT, AX.ypN, AX.M], rows: YP_ROWS,
      entry: function (stage) { return stage === 'IVB' ? [E.adeno_surg_yp, E.adeno_unres] : E.adeno_surg_yp; }
    })
  ];

  ECG.STAGE_TABLE = {
    edition: 'AJCC 8th',
    source: [36, 37, 38, 39, 40],
    defs: {
      T: pick(T, ['T0', 'Tis', 'T1', 'T1a', 'T1b', 'T2', 'T3', 'T4', 'T4a', 'T4b']),
      N: pick(N, ['N0', 'N1', 'N2', 'N3', 'NX']),
      M: pick(M, ['M0', 'M1']),
      G: pick(G, ['GX', 'G1', 'G2', 'G3']),
      L: pick(L, ['Upper', 'Middle', 'Lower', 'X'])
    },
    schemes: SCHEMES.map(function (s) {
      return { key: s.key, label: s.label, source: s.source, axes: s.axes, rows: s.rows, group: s.group, entry: s.entry };
    })
  };

  /* ------------------------------------------------------------------ *
   * 4. TNM 面板的分期表 HTML（由同一份列資料產生，確保與計算器一致）
   * ------------------------------------------------------------------ */
  // Stage 放第一欄（手機上表格需橫向捲動時，答案欄仍在畫面內）；其餘欄位順序與投影片相同。
  function stageTable(s) {
    const heads = s.axes.map(function (a) { return '<th>' + a.label + '</th>'; }).join('');
    const body = s._rows.map(function (r) {
      return '<tr><td><strong>' + r.stage + '</strong></td>' +
        r.cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    }).join('\n');
    return '<table class="ref-table"><thead><tr><th>Stage</th>' + heads + '</tr></thead><tbody>\n' + body + '\n</tbody></table>';
  }
  const TBL = {};
  SCHEMES.forEach(function (s) { TBL[s.key] = stageTable(s); });

  function defTable(head, dict, ids) {
    return '<table class="ref-table"><thead><tr><th>' + head[0] + '</th><th>' + head[1] + '</th></tr></thead><tbody>' +
      ids.map(function (k) { return '<tr><td>' + (k === 'X' ? 'X' : dict[k].id) + '</td><td>' + dict[k].def + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }

  /* ------------------------------------------------------------------ *
   * 5. 面板內容
   * ------------------------------------------------------------------ */
  Object.assign(ECG.REF_DATA, {

    /* ---------------- TEAM (s4) ---------------- */
    TEAM: {
      title: '團隊組成 (MDT Panel Members)',
      source: [4],
      content: `
<h4 class="ref-h4" id="TEAM-core">核心科別</h4>
<ul>
<li><strong>胸腔外科：</strong> 徐博奎(召集人)、黃建勝(副召集人)、許瀚水、洪榮志、簡宏哲、李怡穎、許文虎、謝致政、劉佳、丁英哲</li>
<li><strong>腸胃科：</strong> 侯明志、王彥博、陳宥任、吳佩珊</li>
<li><strong>腫瘤內科：</strong> 楊慕華、顏厥全、陳明晃、洪逸平、姜乃榕、陳天華、吳紋綺、唐振育</li>
<li><strong>放射腫瘤：</strong> 黃品逸、賴姿妤、林佑蓉</li>
<li><strong>放射診斷部：</strong> 陳俊谷、張瀛月、翁敬堯、李瑩綺、邱睿涵、許益瑞、劉松鈞</li>
<li><strong>核醫部：</strong> 林可瀚、丁建鑫</li>
<li><strong>病理部：</strong> 葉奕成</li>
<li><strong>個案管理：</strong> 簡伶怡</li>
</ul>
<h4 class="ref-h4" id="TEAM-other">其他科別</h4>
<ul>
<li><strong>心臟外科：</strong> 陳沂名</li>
<li><strong>安寧照護：</strong> 賴志冠、楊琪</li>
<li><strong>藥劑部：</strong> 陳俊豪</li>
<li><strong>社工室：</strong> 程雅芬</li>
<li><strong>營養部：</strong> 祝梓芸</li>
</ul>
`
    },

    /* ---------------- WORKUP (s8–10) ---------------- */
    WORKUP: {
      title: '術前檢查 (Pretreatment Workup)',
      source: [8, 9, 10],
      content: `
<h4 class="ref-h4" id="WORKUP-routine">常規與影像學評估</h4>
<ul>
<li><strong>基本評估：</strong> H&amp;P, CBC and Chemistry profile.</li>
<li><strong>內視鏡與切片：</strong> Upper GI endoscopy and biopsy. (EMR is essential for accurate staging of early stage cancers T1a or T1b).</li>
<li><strong>影像學檢查：</strong> Chest / Abdominal CT with IV contrast.</li>
</ul>
<h4 class="ref-h4" id="WORKUP-staging">進階分期檢查 (若無遠端轉移證據)</h4>
<ul>
<li><strong>PET-CT evaluation</strong></li>
<li><strong>Endoscopic ultrasound (EUS)</strong></li>
<li><strong>Bronchoscopy：</strong>若腫瘤位於氣管隆突(carina)或之上。</li>
</ul>
<h4 class="ref-h4" id="WORKUP-other">其他評估項目</h4>
<ul>
<li><strong>轉移性病灶：</strong> Biopsy as clinically indicated. 轉移性腺癌需 HER2-neu testing。</li>
<li><strong>營養與戒菸：</strong> Nutritional assessment, Smoking cessation.</li>
<li><strong>Siewert 分類：</strong> Assign Siewert category (adenocarcinomas involving EGJ).</li>
<li><strong>營養支持：</strong> Consider enteric feeding tube (NG, NJ, gastrostomy or jejunostomy).</li>
</ul>
<h4 class="ref-h4" id="WORKUP-triage">分期後分流</h4>
<ul>
<li>Stage I-III (locoregional) → 依細胞類型分流</li>
<li>Stage IV (metastatic) → 全身性治療/緩和治療</li>
<li>Stage I-IVA → Multidisciplinary evaluation → Fit for surgery / Non-surgical candidate</li>
</ul>
<p class="ref-note">分期定義見 <a href="#/ref/TNM">TNM 分期 (AJCC 8th)</a>；可用 <a href="#/stage">分期計算器</a> 由 T/N/M 求得 stage group。</p>
<details>
<summary>投影片原文：WORKUP (s8)</summary>
<ul>
<li>H &amp;P</li>
<li>Upper GI endoscopy and biopsy</li>
<li>Chest / Abdominal CT with IV contrast</li>
<li>PET-CT evaluation if no evidence of M1 disease</li>
<li>CBC and Chemistry profile</li>
<li>Endoscopic ultrasound(EUS), if no evidence of M1 disease</li>
<li>Endoscopic mucosal resection is essential for the accurate staging of early stage cancers( T1a or T1b)</li>
<li>Biopsy of metastatic disease as clinically indicated</li>
<li>HER2-neu testing if metastatic adenocarcinoma is documented/ suspected</li>
<li>Bronchoscopy, if tumor is at or above the carina with no evidence of M1 disease</li>
<li>Nutritional assessment and counseling</li>
<li>Assign Siewert category</li>
<li>Smoking cessation advice, counseling, and pharmacotherapy as indicated</li>
<li>Screen for family history</li>
</ul>
</details>
<details>
<summary>投影片原文：分期後分流 (s9–10)</summary>
<p>CLINICAL TNM STAGE (AJCC 8th)</p>
<ul>
<li>Stage I-III( locoregional disease) → Squamous cell carcinoma / Adenocarcinoma</li>
<li>Stage IV( metastatic disease) → Squamous cell carcinoma / Adenocarcinoma</li>
</ul>
<p>Squamous cell carcinoma／Adenocarcinoma：Stage I–IVA ( locoregional disease, except T4b or unresectable N3) → Multidisciplinary evaluation: Consider enteric feeding tube (NG, NJ, gastrostomy or jejunostomy) for preoperative nutritional support → Medically fit for surgery / Non- surgical candidate</p>
</details>
`
    },

    /* ---------------- TNM (s35–40) ---------------- */
    TNM: {
      title: 'TNM 分期 (AJCC 8th Ed.)',
      source: [35, 36, 37, 38, 39, 40],
      content: `
<p class="ref-note">AJCC Cancer Staging Manual, Eighth edition (2018-)（投影片 s35–40）。T、N、M、G 定義 SCC 與腺癌相同；Location 只用於 SCC 病理分期。下方六張分期表逐列照投影片 s39（SCC）、s40（腺癌）；<a href="#/stage">分期計算器</a> 使用同一份表格。</p>

<h4 class="ref-h4" id="TNM-t">Primary Tumor (T)</h4>
<ul>
<li><strong>Tis:</strong> High-grade dysplasia</li>
<li><strong>T1:</strong> Lamina propria, muscularis mucosae, or submucosa
  <ul>
  <li><strong>T1a:</strong> Lamina propria or muscularis mucosae</li>
  <li><strong>T1b:</strong> Submucosa</li>
  </ul>
</li>
<li><strong>T2:</strong> Muscularis propria</li>
<li><strong>T3:</strong> Adventitia</li>
<li><strong>T4:</strong> Adjacent structures
  <ul>
  <li><strong>T4a:</strong> Pleura, pericardium, azygos vein, diaphragm, peritoneum</li>
  <li><strong>T4b:</strong> Aorta, vertebral body, airway</li>
  </ul>
</li>
</ul>
<details>
<summary>AJCC 原文：Definition of Primary Tumor (T) (s36)</summary>
<table class="ref-table"><thead><tr><th>T Category</th><th>T Criteria</th></tr></thead><tbody>
<tr><td>TX</td><td>Tumor cannot be assessed</td></tr>
<tr><td>T0</td><td>${T.T0.def}</td></tr>
<tr><td>Tis</td><td>${T.Tis.def}</td></tr>
<tr><td>T1</td><td>${T.T1.def}</td></tr>
<tr><td>T1a</td><td>${T.T1a.def}</td></tr>
<tr><td>T1b</td><td>${T.T1b.def}</td></tr>
<tr><td>T2</td><td>${T.T2.def}</td></tr>
<tr><td>T3</td><td>${T.T3.def}</td></tr>
<tr><td>T4</td><td>${T.T4.def}</td></tr>
<tr><td>T4a</td><td>${T.T4a.def}</td></tr>
<tr><td>T4b</td><td>${T.T4b.def}</td></tr>
</tbody></table>
</details>

<h4 class="ref-h4" id="TNM-n">Regional Lymph Nodes (N)</h4>
<ul>
<li><strong>N0:</strong> No regional LN metastasis</li>
<li><strong>N1:</strong> 1-2 regional LN</li>
<li><strong>N2:</strong> 3-6 regional LN</li>
<li><strong>N3:</strong> 7+ regional LN</li>
</ul>
<details>
<summary>AJCC 原文：Definition of Regional Lymph Nodes (N) (s37)</summary>
${defTable(['N Category', 'N Criteria'], N, ['NX', 'N0', 'N1', 'N2', 'N3'])}
</details>

<h4 class="ref-h4" id="TNM-m">Distant Metastasis (M)</h4>
<ul>
<li><strong>M0:</strong> No distant metastasis</li>
<li><strong>M1:</strong> Distant metastasis</li>
</ul>

<h4 class="ref-h4" id="TNM-g">Histologic Grade (G)</h4>
${defTable(['G', 'G Definition'], G, ['GX', 'G1', 'G2', 'G3'])}

<h4 class="ref-h4" id="TNM-location">Location (L)：僅 SCC</h4>
<p>Location plays a role in the stage grouping of esophageal squamous cancers.</p>
${defTable(['Location Category', 'Location Criteria'], L, ['X', 'Upper', 'Middle', 'Lower'])}
<p class="ref-note"><em>Note</em>: Location is defined by the position of the epicenter of the tumor in the esophagus.</p>
<details>
<summary>s38 圖示：距門齒 (incisors) 距離</summary>
<table class="ref-table"><thead><tr><th>Segment</th><th>From incisors</th></tr></thead><tbody>
<tr><td>Cervical Esophagus</td><td>15–20 cm（UES 15 cm；Sternal notch 20 cm）</td></tr>
<tr><td>Upper Thoracic</td><td>20–25 cm（Azygos vein 25 cm）</td></tr>
<tr><td>Middle Thoracic</td><td>25–30 cm（Inferior pulmonary vein 30 cm）</td></tr>
<tr><td>Lower Thoracic</td><td>30–40 cm（LES 40 cm）</td></tr>
<tr><td>EGJ</td><td>40–42 cm</td></tr>
</tbody></table>
</details>

<h4 class="ref-h4" id="TNM-scc_c">SCC — Clinical (cTNM) (Fig. 16.6)</h4>
${TBL.scc_c}
<p class="ref-note">→ <a href="#/stage/scc_c">分期計算器：SCC cTNM</a></p>

<h4 class="ref-h4" id="TNM-scc_p">SCC — Pathological (pTNM) (Fig. 16.7)</h4>
${TBL.scc_p}
<p class="ref-note">T1 = T1a 或 T1b。pT3 N0 M0 GX 且位於 Lower 時，表中「Any G / Lower → IIA」與「GX / Any location → IIB」兩列重疊；分期計算器依投影片列序取第一個符合的列（IIA）。→ <a href="#/stage/scc_p">分期計算器：SCC pTNM</a></p>

<h4 class="ref-h4" id="TNM-scc_yp">SCC — Postneoadjuvant Therapy (ypTNM) (Fig. 16.8)</h4>
${TBL.scc_yp}
<p class="ref-note">→ <a href="#/stage/scc_yp">分期計算器：SCC ypTNM</a></p>

<h4 class="ref-h4" id="TNM-adeno_c">Adenocarcinoma — Clinical (cTNM) (Fig. 16.9)</h4>
${TBL.adeno_c}
<p class="ref-note">→ <a href="#/stage/adeno_c">分期計算器：腺癌 cTNM</a></p>

<h4 class="ref-h4" id="TNM-adeno_p">Adenocarcinoma — Pathological (pTNM) (Fig. 16.10)</h4>
${TBL.adeno_p}
<p class="ref-note">T1 = T1a 或 T1b。* 投影片原表此格印為「N0」，依上下文應為 M0，分期計算器以 M0 處理。→ <a href="#/stage/adeno_p">分期計算器：腺癌 pTNM</a></p>

<h4 class="ref-h4" id="TNM-adeno_yp">Adenocarcinoma — Postneoadjuvant Therapy (ypTNM) (Fig. 16.11)</h4>
${TBL.adeno_yp}
<p class="ref-note">→ <a href="#/stage/adeno_yp">分期計算器：腺癌 ypTNM</a></p>
`
    },

    /* ---------------- PATHOLOGY (s6–7) ---------------- */
    PATHOLOGY: {
      title: '病理原則 (Principles of Pathological Review)',
      source: [6, 7],
      content: `
<h4 class="ref-h4" id="PATHOLOGY-purpose">病理檢查目的</h4>
<ul>
<li>腫瘤分類 (Classification of tumor)</li>
<li>侵犯深度 (Determine the extent of invasion)</li>
<li>切緣狀態 (Establish status of cancer involvement of surgical margins)</li>
</ul>
<p>所有手術病理報告應依照食道癌 <strong>WHO 分類</strong>及 <strong>AJCC/UICC TNM 8th edition</strong> 分期。</p>
<h4 class="ref-h4" id="PATHOLOGY-report">手術病理報告必含項目</h4>
<ul>
<li>組織型態與分化程度 (Histologic type and grade)</li>
<li>Microscopic tumor extension (pT stage)</li>
<li>Lymph-vascular invasion (LVI), perineural invasion (PNI)</li>
<li>Margins: proximal, distal, circumferential, and closest</li>
<li>Lymph node status and number of lymph nodes recovered</li>
</ul>
<h4 class="ref-h4" id="PATHOLOGY-neoadjuvant">新輔助治療後評估</h4>
<p>接受新輔助治療者須包含對於治療反應的評估：</p>
<ul>
<li><strong>Modified Ryan Scheme for Tumor Regression Score:</strong>
  <ul>
  <li>0 = 完全反應 (Complete response)</li>
  <li>1 = 接近完全反應 (Near complete response)</li>
  <li>2 = 部分反應 (Partial response)</li>
  <li>3 = 不良或無反應 (Poor or no response)</li>
  </ul>
</li>
<li>淋巴結治療效果 (Treatment effect in lymph nodes)</li>
</ul>
<p class="ref-note">病理分期 (pTNM / ypTNM) 見 <a href="#/ref/TNM/scc_p">TNM 分期</a>。</p>
`
    },

    /* ---------------- SURGERY (s12–13, s20–21, s30–31, s34) ---------------- */
    SURGERY: {
      title: '外科原則 (Principles of Surgical Resection)',
      source: [12, 13, 20, 21, 30, 31, 34],
      content: `
<h4 class="ref-h4" id="SURGERY-resectability">可切除性標準</h4>
<p><strong>可切除 (Resectable)：</strong></p>
<ul>
<li>T1a: EMR + ablation or esophagectomy</li>
<li>T1b or deeper: esophagectomy</li>
<li>T1-T3, even with N+ (bulky multi-station LAP 為相對禁忌)</li>
<li>T4a: involvement of pericardium, pleura, or diaphragm</li>
</ul>
<p><strong>不可切除 (Unresectable)：</strong></p>
<ul>
<li>cT4b: heart, great vessels, trachea, or adjacent organs</li>
<li>Multi-station, bulky lymphadenopathy</li>
<li>EGJ and supraclavicular LN involvement</li>
<li>Distant metastases (stage IV)</li>
</ul>
<h4 class="ref-h4" id="SURGERY-cervical">頸部食道</h4>
<p>Cervical esophageal carcinomas &lt;5 cm from cricopharyngeus → <strong>Definitive chemoradiation</strong></p>
<h4 class="ref-h4" id="SURGERY-siewert">Siewert 分類</h4>
<ul>
<li><strong>Type I, II：</strong> 視為食道癌</li>
<li><strong>Type III：</strong> 視為胃癌 (may need additional esophageal resection for adequate margins)</li>
</ul>
<h4 class="ref-h4" id="SURGERY-type">手術類型考量</h4>
<ul>
<li>考慮腫瘤位置、conduit 選擇、術者經驗與病人偏好</li>
<li><strong>Acceptable conduits:</strong> Gastric (preferred), Colon, Jejunum</li>
<li>Feeding jejunostomy tube (J-tube) preferred for preoperative nutrition</li>
</ul>
<h4 class="ref-h4" id="SURGERY-lnd">淋巴結清掃</h4>
<ul>
<li><strong>Standard：</strong> Esophagus + nearby tissues, without RLN node dissection</li>
<li><strong>Extended (en-bloc)：</strong> Mesoesophagus, thoracic duct, RLN LN dissection</li>
<li>未接受化放療：至少 16 nodes (desirable &gt;30)</li>
<li>接受化放療後：optimum number unknown, similar resection recommended</li>
</ul>
<details>
<summary>投影片原文：Principles of surgery (s12–13)</summary>
<ul>
<li><strong>Resection could be considered for physiologically fit and resectable esophageal cancer (&gt;5 cm from cricopharyngeus).</strong>
  <ul><li>Cervical or cervicothoracic esophageal carcinomas &lt;5 cm from the cricopharyngeus =&gt; Definitive chemoradiation</li></ul>
</li>
<li><strong>Siewert tumor type should be assessed in all patients with adenocarcinomas involving the EGJ.</strong>
  <ul>
  <li>Siewert types I and II lesions are considered esophageal cancers</li>
  <li>Siewert type III lesions are considered gastric cancers (additional esophageal resection may be needed in order to obtain adequate margins)</li>
  </ul>
</li>
<li><strong>Resectable esophageal or EGJ cancer:</strong>
  <ul>
  <li><strong>T1a:</strong> may be considered for EMR + ablation or esophagectomy</li>
  <li><strong>T1b or deeper:</strong> may be treated with esophagectomy</li>
  <li><strong>T1-T3:</strong> even with regional nodal metastases (N+), although bulky (multi-station lymphatic involvement is a relative contraindication to surgery, to be considered in conjunction with age and performance status)</li>
  <li><strong>T4a:</strong> involvement of pericardium, pleura, or diaphragm</li>
  </ul>
</li>
<li><strong>Unresectable esophageal cancer:</strong>
  <ul>
  <li><strong>cT4b:</strong> Involvement of the heart, great vessels, trachea, or adjacent organs including liver, pancreas, lung, and spleen</li>
  <li><strong>Multi-station, bulky lymphadenopathy:</strong> should be considered in conjunction with other factors, including age, performance status, and response to therapy</li>
  <li><strong>EGJ and supraclavicular lymph node involvement</strong></li>
  <li><strong>Distant (including nonregional lymph nodes) metastases (stage IV)</strong></li>
  </ul>
</li>
<li><strong>Considerations for choosing types of surgery</strong>
  <ul>
  <li>The location of the tumor, the available choices for conduit</li>
  <li>The surgeon’s experience and preference and the patient's preference</li>
  <li>A feeding jejunostomy tube (J-tube) are preferred to a gastrostomy for patients who are unable to swallow well enough to maintain nutrition during induction therapy (which may compromise the integrity of gastric conduit for reconstruction).</li>
  <li>Acceptable conduits: Gastric (preferred), Colon, Jejunum</li>
  <li>Acceptable lymph node dissections: Standard, Extended (en-bloc)
    <ul>
    <li>Without induction chemoradiation: At least 16 lymph nodes should be removed and assessed to achieve adequate nodal staging, &gt;30 lymph nodes is desirable .</li>
    <li>Post chemoradiation: The optimum number of nodes is unknown, although similar lymph node resection is recommended.</li>
    <li>Extended (en-bloc): The mesoesophagus, thoracic duct, and nearby tissues are removed with the esophagus. RLN lymph nodes are dissected, with specific techniques for exposing and identifying the right and left RLNs.</li>
    <li>Standard: The esophagus and nearby tissues are dissected without RLN node dissection or detailed landmark identification.</li>
    </ul>
  </li>
  <li>After definitive chemoradiation, patients who develop localized, resectable esophageal cancer, and do not have distant recurrence =&gt; Considered esophagectomy</li>
  <li>Potentially resectable esophageal cancer should undergo multidisciplinary review</li>
  </ul>
</li>
</ul>
</details>

<h4 class="ref-h4" id="SURGERY-outcomes">手術結果與術後處置 (Surgical Outcomes)</h4>
<p class="ref-note">依投影片 s20–21（SCC）、s30–31（腺癌）原文；所有路徑之後皆 → <a href="#/ref/FOLLOWUP">Follow Up</a>。互動流程：<a href="#/node/scc_surgical_type">SCC 手術結果</a>、<a href="#/node/adeno_surgical_type">腺癌手術結果</a>。</p>
<details open>
<summary>Squamous cell Carcinoma Surgical Outcomes (s20–21)</summary>
<table class="ref-table"><thead><tr><th>Surgical outcome</th><th>Management</th></tr></thead><tbody>
<tr><th colspan="2">For Patients Have Not Received Preoperative Chemoradiation</th></tr>
<tr><td>R0 resection</td><td>Surveillance<br>or<br>Chemoradiation if High risk<sup>#</sup></td></tr>
<tr><td>R1 resection</td><td>Chemoradiation</td></tr>
<tr><td>R2 resection</td><td>Chemoradiation<br>or<br>Palliative management</td></tr>
<tr><th colspan="2">For Patients Have Received Preoperative Chemoradiation</th></tr>
<tr><td>R0 resection, ypT0N0</td><td>Surveillance</td></tr>
<tr><td>R0 resection, ypT positive or/and N positive</td><td>Adjuvant Nivolumab (preffered) <span class="tag tag-preferred">建議優先</span><br>or<br>Adjuvant treatment (adjuvant chemoradiation or chemotherapy)<br>or<br>Surveillance</td></tr>
<tr><td>R1 resection<br>R2 resection</td><td>Observation until progression<br>or<br>Palliative Management</td></tr>
</tbody></table>
<p class="ref-note"><sup>#</sup> High risk factors: advanced T/N stage(T3-4 or N+), close circumferential margin, LVI, perineural invasion, extracapsular lymph node</p>
</details>
<details open>
<summary>Adenocarcinoma Surgical Outcomes (s30–31)</summary>
<table class="ref-table"><thead><tr><th>Surgical outcome</th><th>Management</th></tr></thead><tbody>
<tr><th colspan="2">For Patients Have Not Received Preoperative Chemoradiation or systemic therapy</th></tr>
<tr><td>R0 resection, Node negative, pTis and pT1</td><td>Surveillance</td></tr>
<tr><td>R0 resection, Node negative, pT2</td><td>Surveillance<br>or<br>Consider chemoradiation for select patients</td></tr>
<tr><td>R0 resection, Node negative, pT3, pT4a</td><td>Surveillance<br>or<br>Chemoradiation<br>or<br>Chemotherapy</td></tr>
<tr><td>R0 resection, Node positive (Any T)</td><td>Surveillance<br>or<br>Chemoradiation<br>or<br>Chemotherapy</td></tr>
<tr><td>R1 resection</td><td>Chemoradiation</td></tr>
<tr><td>R2 resection</td><td>Chemoradiation<br>or<br>Palliative management</td></tr>
<tr><th colspan="2">For Patients Have Received Preoperative Chemoradiation or systemic therapy</th></tr>
<tr><td>R0 resection, ypT0N0</td><td>Observation until progression<br>or<br>Systemic therapy If received perioperatively</td></tr>
<tr><td>R0 resection, ypT positive or/and ypN positive</td><td>Systemic therapy if received perioperatively<br>Or<br>Nivolumab if received preoperative Chemoradiation<br>Or<br>Observation until progression</td></tr>
<tr><td>R1 resection</td><td>Chemoradiation (only if RT not received preoperatively)<br>or<br>Observation until progression<br>or<br>Consider re-resection</td></tr>
<tr><td>R2 resection</td><td>Chemoradiation (only if RT not received preoperatively)<br>or<br>Palliative Management</td></tr>
</tbody></table>
</details>
<p class="ref-note">本院外科相關文獻見 <a href="#/ref/REFERENCES/surgery">參考文獻：Surgical Resection (s34)</a>。</p>
`
    }
  });
})();
