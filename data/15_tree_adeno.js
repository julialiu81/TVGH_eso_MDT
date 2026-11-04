// 15_tree_adeno.js — 腺癌 (Adenocarcinoma) 決策樹節點 + 腺癌用註腳 (Agent T)
// 來源：v3 _dev/index_v3_reference.html 之 DECISION_TREE / FOOTNOTES（question / options / content / extra / title /
//       notes / nextSteps 逐字搬移，節點 id 不變）；投影片 s13、s24–33（腺癌流程）、s48、s51–56（化療 regimens）核對。
// v4 新增（SPEC §2、§2.1）：adeno_followup_entry；options.sub；tags（只用投影片 / v3 標示的 preferred 與 MDT）；
//       refs（面板 key / anchor 依 SPEC §2.2，由 Agent R 撰寫）；source（投影片編號）。
// 共用註腳（note_feeding, note_surgery_timing, stent_ab, nivo_adj …）定義於 10_tree_scc.js，本檔只定義 adeno_a、adeno_er_note。
// 只追加 (Object.assign)，不覆寫其他 agent 的內容。
window.ECG = window.ECG || {};
(function () {
  const ECG = window.ECG;
  ECG.TREE = ECG.TREE || {};
  ECG.FOOTNOTES = ECG.FOOTNOTES || {};

  // ---------- helpers ----------
  const tag = (text, level) => ({ text: text, level: level });
  const ref = (panel, anchor, label) => (anchor ? { panel: panel, anchor: anchor, label: label } : { panel: panel, label: label });

  // ---------- refs（SPEC §2.2 面板 key / 錨點） ----------
  const R = {
    WORKUP: () => ref("WORKUP", null, "術前檢查 (Pretreatment workup)"),
    TNM_C: () => ref("TNM", "adeno_c", "腺癌 臨床分期 (cTNM)"),
    TNM_P: () => ref("TNM", "adeno_p", "腺癌 病理分期 (pTNM)"),
    TNM_YP: () => ref("TNM", "adeno_yp", "腺癌 術前治療後病理分期 (ypTNM)"),
    PATH: () => ref("PATHOLOGY", null, "病理原則 (Pathological review)"),
    SURG_RES: () => ref("SURGERY", "resectability", "可切除性標準 (Resectability)"),
    SURG_OUT: () => ref("SURGERY", "outcomes", "手術結果 (Surgical outcomes)"),
    CT_NEO: () => ref("CHEMO", "neoadj_ccrt", "Neoadjuvant / adjuvant CCRT regimens"),
    CT_DEF: () => ref("CHEMO", "definitive_ccrt", "Definitive CCRT regimens"),
    CT_PERIOP: () => ref("CHEMO", "periop", "Peri-operative chemotherapy (FLOT)"),
    CT_EGJ_ADJ: () => ref("CHEMO", "egj_adjuvant", "EGJ adenocarcinoma — adjuvant (含 Nivolumab)"),
    CT_EGJ_MET: () => ref("CHEMO", "egj_metastatic", "Recurrent / metastatic EGJ adenocarcinoma regimens"),
    RT_PREOP: () => ref("RADIO", "preop", "Preoperative CCRT (放射治療)"),
    RT_DEF: () => ref("RADIO", "definitive", "Definitive CCRT (放射治療)"),
    RT_POSTOP: () => ref("RADIO", "postop", "Postoperative CCRT (放射治療)"),
    FOLLOWUP: () => ref("FOLLOWUP", null, "追蹤原則 (Follow up)"),
    TRIALS: () => ref("TRIALS", null, "關鍵臨床試驗 (Key trials)")
  };

  // ---------- tags ----------
  const T_PREF_ESOPHAGECTOMY = () => tag("Esophagectomy", "preferred");                                       // s29

  // ---------- FOOTNOTES（v3 逐字；腺癌專用） ----------
  Object.assign(ECG.FOOTNOTES, {
    adeno_a: "ESOPEC Trial：FLOT vs CROSS，FLOT 組 OS 顯著優於 CROSS (Median OS: 66 mo vs 37 mo)。Neo-AEGIS Trial：Peri-op Chemo vs Preop CCRT，3yr OS 55% vs 57% (HR 1.03, 無顯著差異)；pCR: CROSS 較佳 (16% vs 5%)。",
    adeno_er_note: "If a diagnostic ER performed: pTis, pT1a, superficial pT1b, pT1b, N0 tumor classifications are defined by pathology of the diagnostic ER specimen."
  });

  // ---------- TREE ----------
  Object.assign(ECG.TREE, {

    // ============ ADENOCARCINOMA — FOLLOW-UP QUICK ENTRY（v4 新增，SPEC §2.1） ============
    adeno_followup_entry: {
      question: "腺癌 治療後評估：請選擇目前情境",
      options: [
        { label: "術前治療後反應評估", next: "adeno_response_preop", sub: "Response assessment after preoperative treatment" },
        { label: "根除性化放療後反應評估", next: "adeno_response_def", sub: "Response assessment after definitive CRT" },
        { label: "手術結果評估 (Surgical outcomes)", next: "adeno_surgical_type", sub: "R0 / R1 / R2；是否曾接受術前化放療或全身治療" },
        { label: "復發處置 (Recurrence)", next: "adeno_recurrence", sub: "局部復發（曾手術 / 曾化放療）或遠端轉移" },
        { label: "轉移性疾病：Biomarker 導向全身治療", next: "adeno_biomarker", sub: "PD-L1 (CPS)、HER2、MSI-H/dMMR" }
      ],
      refs: [R.FOLLOWUP()],
      source: [29, 30, 31, 32, 33]
    },

    // ============ ADENOCARCINOMA — INITIAL STAGING ============
    adeno_stage: {
      question: "臨床分期與腫瘤狀態 (Clinical Stage)",
      options: [
        { label: "pTis 或 pT1a", next: "res_adeno_ptis_t1a", sub: "若已行診斷性 ER，依 ER 標本病理判定分類" },
        { label: "pT1b, N0", next: "adeno_pt1b", sub: "下一步：表淺性 / 非表淺性" },
        { label: "cT1b-cT2, N0", next: "res_adeno_t1bc2_low", sub: "低風險：<3cm, 良好分化" },
        { label: "cT2, N0 (高風險：LVI, ≥3cm, 低分化) 或 cT1b-cT2, N+ 或 cT3-cT4a, 任何N", next: "res_adeno_adv" },
        { label: "cT4b", next: "res_adeno_ct4b", sub: "侵犯心臟、大血管、氣管等" },
        { label: "無法切除之局部晚期、局部復發或遠端轉移", next: "adeno_unresectable", sub: "Unresectable locally advanced, locally recurrent, or metastatic disease" }
      ],
      refs: [R.TNM_C(), R.WORKUP(), R.SURG_RES()],
      source: [25, 26, 27, 28, 33]
    },
    adeno_pt1b: {
      question: "腫瘤深度評估",
      options: [
        { label: "表淺性 (Superficial)", next: "res_adeno_pt1b_sup" },
        { label: "非表淺性 (Non-superficial)", next: "res_adeno_pt1b_non_sup" }
      ],
      source: [26]
    },
    adeno_unresectable: {
      question: "病人體能狀況 (Performance Status)",
      options: [
        { label: "KPS < 60% 或 ECOG ≥ 3", next: "res_adeno_poor_ps" },
        { label: "KPS ≥ 60% 或 ECOG ≤ 2", next: "res_adeno_good_ps" }
      ],
      refs: [R.CT_EGJ_MET()],
      source: [33]
    },

    // ============ ADENOCARCINOMA — RESULTS ============
    res_adeno_ptis_t1a: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "優先考慮內視鏡治療 (Endoscopic therapies: ER, Ablation, 或 ER 後接續 ablation)\n或 食道切除術 (Esophagectomy)",
      extra: "內視鏡治療後進行內視鏡追蹤 (Endoscopic surveillance)",
      notes: ["adeno_er_note"],
      tags: [tag("Endoscopic therapies (ER / Ablation / ER followed by ablation)", "preferred")],   // s26
      refs: [R.SURG_RES(), R.FOLLOWUP()],
      nextSteps: [{ label: "手術後 → 手術結果評估", next: "adeno_surgical_type" }],
      source: [26]
    },
    res_adeno_pt1b_sup: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "ER ± ablation\n或 食道切除術 (Esophagectomy)",
      extra: "內視鏡治療後進行內視鏡追蹤 (Endoscopic surveillance)",
      notes: ["adeno_er_note"],
      refs: [R.SURG_RES(), R.FOLLOWUP()],
      nextSteps: [{ label: "手術後 → 手術結果評估", next: "adeno_surgical_type" }],
      source: [26]
    },
    res_adeno_pt1b_non_sup: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "食道切除術 (Esophagectomy)",
      refs: [R.SURG_RES()],
      nextSteps: [{ label: "手術後 → 手術結果評估", next: "adeno_surgical_type" }],
      source: [26]
    },
    res_adeno_t1bc2_low: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "食道切除術 (Esophagectomy)",
      refs: [R.SURG_RES()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (未接受術前治療)", next: "adeno_surgical_no_prior" }],
      source: [27]
    },
    res_adeno_adv: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "圍手術期化療接續食道切除術 (Perioperative chemotherapy then esophagectomy, 首選)\n或 術前同步化放療 (Preoperative chemoradiation, RT 41.4-50.4 Gy + 併用化療)\n或 考慮新輔助/圍手術期免疫檢查點抑制劑 (若 MSI-H/dMMR)\n或 根除性同步化放療 (Definitive chemoradiation, 針對拒絕手術者)",
      notes: ["adeno_a", "note_feeding"],
      tags: [tag("Perioperative chemotherapy then esophagectomy", "preferred")],   // s13, s27
      refs: [R.CT_PERIOP(), R.CT_NEO(), R.CT_DEF(), R.RT_PREOP(), R.RT_DEF(), R.TRIALS()],
      nextSteps: [
        { label: "術前治療後 → 反應評估", next: "adeno_response_preop" },
        { label: "根除性化放療後 → 反應評估", next: "adeno_response_def" }
      ],
      source: [13, 25, 27]
    },
    res_adeno_ct4b: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "根除性同步化放療 (Definitive chemoradiation, RT 50.4-60 Gy + 併用化療)",
      extra: "若侵犯氣管、大血管、椎體或心臟，可考慮單獨使用化學治療。若需置放 TAA Stent 請參閱下方規範。",
      notes: ["stent_ab"],
      refs: [R.RT_DEF(), R.CT_DEF(), R.SURG_RES()],
      source: [28]
    },
    res_adeno_poor_ps: {
      isResult: true, type: "danger", title: "建議治療方式",
      content: "緩和治療 / 最佳支持性照護 (Palliative / Best supportive care)",
      source: [33]
    },
    res_adeno_good_ps: {
      isResult: true, type: "warning", title: "建議治療方式",
      content: "全身性治療 (Systemic therapy) 及/或 緩和治療/最佳支持性照護",
      extra: "若懷疑有轉移：進行 microsatellite、PD-L1 及 HER2 測試（若未完成），可考慮 NGS 檢測。",
      refs: [R.CT_EGJ_MET()],
      nextSteps: [{ label: "依 Biomarker 結果選擇全身性治療", next: "adeno_biomarker" }],
      source: [33]
    },

    // ============ ADENOCARCINOMA — BIOMARKER-DIRECTED THERAPY ============
    adeno_biomarker: {
      question: "Biomarker 檢測結果 (Biomarker Testing Results)",
      extra: "建議檢測：PD-L1 (CPS)、HER2 (IHC/FISH)、MSI/dMMR。可考慮 NGS 檢測。",
      options: [
        { label: "PD-L1 CPS ≥ 5", next: "res_adeno_met_pdl1_high" },
        { label: "PD-L1 CPS 1-4", next: "res_adeno_met_pdl1_low" },
        { label: "HER2 陽性 (IHC 3+ 或 FISH+)", next: "res_adeno_met_her2" },
        { label: "MSI-H / dMMR", next: "res_adeno_met_msi" }
      ],
      refs: [R.CT_EGJ_MET(), R.TRIALS()],
      source: [33, 53, 54]
    },
    res_adeno_met_pdl1_high: {
      isResult: true, type: "primary", title: "PD-L1 CPS ≥ 5 — 建議 1st Line",
      content: "Nivolumab + XELOX 或 FOLFOX (首選)\n或 Pembrolizumab + PFL (KEYNOTE-590)\n或 Nivolumab + Ipilimumab (Nivo 3mg/kg Q2W + Ipi 1mg/kg Q6W)",
      extra: "替代方案：High-dose PFL、XELOX、DCF、Modified TCF、Irinotecan-based、FOLFIRI",
      tags: [tag("Nivolumab + XELOX / FOLFOX", "preferred")],   // s53 Preferred regimens (PD-L1 CPS ≥ 5)
      refs: [R.CT_EGJ_MET(), R.TRIALS()],
      source: [53, 54]
    },
    res_adeno_met_pdl1_low: {
      isResult: true, type: "primary", title: "PD-L1 CPS 1-4 — 建議 1st Line",
      content: "Pembrolizumab + Fluoropyrimidine/Platinum-based chemo (KEYNOTE-859)\n或 化學治療 (High-dose PFL 或 XELOX)",
      extra: "替代方案：DCF、Modified TCF、Irinotecan-based、FOLFIRI",
      refs: [R.CT_EGJ_MET(), R.TRIALS()],
      source: [53, 54]
    },
    res_adeno_met_her2: {
      isResult: true, type: "primary", title: "HER2(+) — 建議 1st Line",
      content: "Trastuzumab + 標準化療 ± Pembrolizumab (KEYNOTE-811 / ToGA)",
      extra: "2nd line 可考慮 Fam-trastuzumab deruxtecan (T-DXd) 6.4mg/kg Q3W",
      tags: [tag("Trastuzumab + standard chemotherapy ± Pembrolizumab", "preferred")],   // s54 Preferred targeted therapy
      refs: [R.CT_EGJ_MET(), R.TRIALS()],
      source: [54, 56]
    },
    res_adeno_met_msi: {
      isResult: true, type: "primary", title: "MSI-H / dMMR — 建議治療",
      content: "免疫檢查點抑制劑 (Immune checkpoint inhibitor)\nNivolumab 或 Pembrolizumab",
      extra: "可考慮新輔助/圍手術期免疫治療 (若腫瘤尚可切除)",
      refs: [R.CT_EGJ_MET(), R.TRIALS()],
      source: [27, 56]
    },

    // ============ ADENOCARCINOMA — RESPONSE ASSESSMENT ============
    adeno_response_preop: {
      question: "術前治療後反應評估 (Response Assessment after Preop treatment)",
      extra: "評估項目：PET/CT、Chest/abdominal CT、Upper GI endoscopy (optional if surgery is planned)",
      options: [
        { label: "無疾病證據 (No evidence of disease)", next: "res_adeno_resp_preop_ned" },
        { label: "持續局部疾病 (Persistent local disease)", next: "res_adeno_resp_preop_local" },
        { label: "無法切除或新發轉移 (Unresectable or New Metastatic disease)", next: "res_adeno_resp_preop_met" }
      ],
      refs: [R.RT_PREOP()],
      source: [29]
    },
    res_adeno_resp_preop_ned: {
      isResult: true, type: "primary", title: "評估後處置",
      content: "食道切除術 (Esophagectomy, 首選)\n或 追蹤觀察 (Surveillance)",
      notes: ["note_surgery_timing"],
      tags: [T_PREF_ESOPHAGECTOMY()],
      refs: [R.SURG_RES(), R.FOLLOWUP()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受術前治療)", next: "adeno_surgical_prior" }],
      source: [29]
    },
    res_adeno_resp_preop_local: {
      isResult: true, type: "warning", title: "評估後處置",
      content: "食道切除術 (Esophagectomy, 首選)\n或 緩和處置 (Palliative Management)",
      tags: [T_PREF_ESOPHAGECTOMY()],
      refs: [R.SURG_RES(), R.CT_EGJ_MET()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受術前治療)", next: "adeno_surgical_prior" }],
      source: [29]
    },
    res_adeno_resp_preop_met: {
      isResult: true, type: "danger", title: "評估後處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_EGJ_MET()],
      source: [29]
    },

    adeno_response_def: {
      question: "根除性化放療後反應評估 (Response Assessment after Definitive CRT)",
      extra: "評估項目：PET/CT、Chest/abdominal CT、Upper GI endoscopy",
      options: [
        { label: "無疾病證據 (No evidence of disease)", next: "res_adeno_resp_def_ned" },
        { label: "持續局部疾病 (Persistent local disease)", next: "res_adeno_resp_def_local" },
        { label: "新發轉移 (New Metastatic disease)", next: "res_adeno_resp_def_met" }
      ],
      refs: [R.RT_DEF()],
      source: [29]
    },
    res_adeno_resp_def_ned: {
      isResult: true, type: "neutral", title: "評估後處置",
      content: "追蹤觀察 (Surveillance)",
      refs: [R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "adeno_recurrence" }],
      source: [29]
    },
    res_adeno_resp_def_local: {
      isResult: true, type: "warning", title: "評估後處置",
      content: "食道切除術 (Esophagectomy, 首選)\n或 緩和處置 (Palliative Management)",
      tags: [T_PREF_ESOPHAGECTOMY()],
      refs: [R.SURG_RES(), R.CT_EGJ_MET()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受化放療)", next: "adeno_surgical_prior" }],
      source: [29]
    },
    res_adeno_resp_def_met: {
      isResult: true, type: "danger", title: "評估後處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_EGJ_MET()],
      source: [29]
    },

    // ============ ADENOCARCINOMA — SURGICAL OUTCOMES ============
    adeno_surgical_type: {
      question: "患者是否曾接受術前化放療或全身治療？",
      options: [
        { label: "未接受 (No prior chemoradiation/systemic therapy)", next: "adeno_surgical_no_prior" },
        { label: "已接受 (Prior chemoradiation/systemic therapy)", next: "adeno_surgical_prior" }
      ],
      refs: [R.SURG_OUT()],
      source: [30, 31]
    },
    adeno_surgical_no_prior: {
      question: "手術結果 — 未接受術前治療 (Surgical Outcomes - No prior treatment)",
      options: [
        { label: "完全切除 (R0 resection)", next: "adeno_surg_np_r0", sub: "下一步：淋巴結與 T 分期" },
        { label: "顯微鏡下殘留 (R1 resection)", next: "res_adeno_surg_np_r1" },
        { label: "肉眼殘留 (R2 resection)", next: "res_adeno_surg_np_r2" }
      ],
      refs: [R.SURG_OUT(), R.TNM_P(), R.PATH()],
      source: [30]
    },
    adeno_surg_np_r0: {
      question: "R0 切除 — 淋巴結與 T 分期狀態",
      options: [
        { label: "Node negative, pTis 或 pT1", next: "res_adeno_surg_np_r0_t1" },
        { label: "Node negative, pT2", next: "res_adeno_surg_np_r0_t2" },
        { label: "Node negative, pT3 或 pT4a", next: "res_adeno_surg_np_r0_t3" },
        { label: "Node positive (any T)", next: "res_adeno_surg_np_r0_npos" }
      ],
      refs: [R.TNM_P()],
      source: [30]
    },
    res_adeno_surg_np_r0_t1: {
      isResult: true, type: "primary", title: "R0 Node(-) pTis/pT1 術後處置",
      content: "追蹤觀察 (Surveillance)\n或 考慮同步化放療 (Consider chemoradiation for select patients)",
      refs: [R.RT_POSTOP(), R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "adeno_recurrence" }],
      source: [30]
    },
    res_adeno_surg_np_r0_t2: {
      isResult: true, type: "neutral", title: "R0 Node(-) pT2 術後處置",
      content: "追蹤觀察 (Surveillance)",
      refs: [R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "adeno_recurrence" }],
      source: [30]
    },
    res_adeno_surg_np_r0_t3: {
      isResult: true, type: "warning", title: "R0 Node(-) pT3/pT4a 術後處置",
      content: "追蹤觀察 (Surveillance)\n或 同步化放療 (Chemoradiation)\n或 化學治療 (Chemotherapy)",
      refs: [R.RT_POSTOP(), R.CT_EGJ_ADJ(), R.FOLLOWUP()],
      source: [30]
    },
    res_adeno_surg_np_r0_npos: {
      isResult: true, type: "warning", title: "R0 Node(+) 術後處置",
      content: "追蹤觀察 (Surveillance)\n或 同步化放療 (Chemoradiation)\n或 化學治療 (Chemotherapy)",
      refs: [R.RT_POSTOP(), R.CT_EGJ_ADJ(), R.FOLLOWUP()],
      source: [30]
    },
    res_adeno_surg_np_r1: {
      isResult: true, type: "warning", title: "R1 術後處置",
      content: "同步化放療 (Chemoradiation)",
      refs: [R.RT_POSTOP(), R.CT_NEO()],
      source: [30]
    },
    res_adeno_surg_np_r2: {
      isResult: true, type: "danger", title: "R2 術後處置",
      content: "同步化放療 (Chemoradiation)\n或 緩和處置 (Palliative Management)",
      refs: [R.RT_POSTOP(), R.CT_NEO(), R.CT_EGJ_MET()],
      source: [30]
    },

    adeno_surgical_prior: {
      question: "手術結果 — 已接受術前化放療/全身治療 (Surgical Outcomes - Prior treatment)",
      options: [
        { label: "R0, ypT0N0", next: "res_adeno_surg_p_pcr", sub: "病理完全反應" },
        { label: "R0, ypT positive 或/及 N positive", next: "res_adeno_surg_p_residual", sub: "殘留病灶" },
        { label: "顯微鏡下殘留 (R1 resection)", next: "res_adeno_surg_p_r1" },
        { label: "肉眼殘留 (R2 resection)", next: "res_adeno_surg_p_r2" }
      ],
      refs: [R.SURG_OUT(), R.TNM_YP(), R.PATH()],
      source: [31]
    },
    res_adeno_surg_p_pcr: {
      isResult: true, type: "primary", title: "R0 ypT0N0 術後處置",
      content: "全身性治療 (Systemic therapy) — 若曾接受圍手術期治療\n或 Nivolumab — 若曾接受術前化放療\n或 同步化放療 (Chemoradiation)\n或 觀察至疾病進展 (Observation)",
      notes: ["nivo_adj"],
      refs: [R.CT_PERIOP(), R.CT_EGJ_ADJ(), R.RT_POSTOP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "adeno_recurrence" }],
      source: [31]
    },
    res_adeno_surg_p_residual: {
      isResult: true, type: "warning", title: "R0 ypT+/N+ 術後處置",
      content: "全身性治療 (Systemic therapy) — 若曾接受圍手術期治療\n或 Nivolumab — 若曾接受術前治療\n或 同步化放療 (Chemoradiation)\n或 觀察至疾病進展",
      notes: ["nivo_adj"],
      refs: [R.CT_PERIOP(), R.CT_EGJ_ADJ(), R.RT_POSTOP(), R.TRIALS()],
      source: [31]
    },
    res_adeno_surg_p_r1: {
      isResult: true, type: "danger", title: "R1 術後處置",
      content: "同步化放療 (Chemoradiation) — 僅限術前未接受 RT\n或 觀察至疾病進展\n或 考慮再切除 (Consider re-resection)",
      refs: [R.RT_POSTOP(), R.SURG_RES()],
      source: [31]
    },
    res_adeno_surg_p_r2: {
      isResult: true, type: "danger", title: "R2 術後處置",
      content: "同步化放療 (Chemoradiation) — 僅限術前未接受 RT\n或 緩和處置 (Palliative Management)",
      refs: [R.RT_POSTOP(), R.CT_EGJ_MET()],
      source: [31]
    },

    // ============ ADENOCARCINOMA — RECURRENCE ============
    adeno_recurrence: {
      question: "復發類型 (Type of Recurrence)",
      options: [
        { label: "局部復發：曾手術，未曾化放療", next: "res_adeno_recur_surg_only", sub: "Locoregional recurrence: prior esophagectomy, no prior chemoradiation" },
        { label: "局部復發：曾化放療，未曾手術", next: "adeno_recur_ccrt_only", sub: "Locoregional recurrence: prior chemoradiation, no prior esophagectomy" },
        { label: "遠端轉移 (Metastatic disease)", next: "res_adeno_recur_met" }
      ],
      source: [32]
    },
    res_adeno_recur_surg_only: {
      isResult: true, type: "warning", title: "局部復發處置 (曾手術)",
      content: "同步化放療 (Concurrent chemoradiation, preferred)\n或 手術 (Surgery)\n或 全身性治療 (Systemic therapy)\n或 緩和治療/最佳支持性照護",
      tags: [tag("Concurrent chemoradiation", "preferred")],   // s32
      refs: [R.CT_DEF(), R.RT_DEF(), R.SURG_RES(), R.CT_EGJ_MET()],
      source: [32]
    },
    adeno_recur_ccrt_only: {
      question: "腫瘤是否可切除？",
      options: [
        { label: "可切除且適合手術 (Resectable and medically operable)", next: "res_adeno_recur_resectable" },
        { label: "不可切除或不適合手術", next: "res_adeno_recur_unresect", sub: "Unresectable or medically inoperable" }
      ],
      refs: [R.SURG_RES()],
      source: [32]
    },
    res_adeno_recur_resectable: {
      isResult: true, type: "primary", title: "局部復發處置 (曾化放療，可切除)",
      content: "食道切除術 (Esophagectomy)",
      refs: [R.SURG_RES()],
      source: [13, 32]
    },
    res_adeno_recur_unresect: {
      isResult: true, type: "danger", title: "局部復發處置 (曾化放療，不可切除)",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_EGJ_MET()],
      source: [32]
    },
    res_adeno_recur_met: {
      isResult: true, type: "danger", title: "遠端轉移處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_EGJ_MET()],
      source: [32]
    }
  });
})();
