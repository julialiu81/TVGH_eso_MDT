// 10_tree_scc.js — 決策樹 root + 鱗狀細胞癌 (SCC) 節點 + SCC 用與共用註腳 (Agent T)
// 來源：v3 _dev/index_v3_reference.html 之 DECISION_TREE / FOOTNOTES（question / options / content / extra / title /
//       notes / nextSteps 逐字搬移，節點 id 不變）；投影片 s13–23（SCC 流程）、s43–47（化療 regimens）核對。
// v4 新增（SPEC §2、§2.1）：root 兩個「後續評估」快捷選項 + scc_followup_entry；options.sub；tags（只用投影片 /
//       v3 標示的 preferred 與 MDT）；refs（面板 key / anchor 依 SPEC §2.2，由 Agent R 撰寫）；source（投影片編號）。
// 共用註腳（腺癌節點也引用）只在本檔定義一次：note1, note2, note_er_ref, note_high_risk, note_feeding,
//       note_response_workup, note_surgery_timing, stent_ab, nivo_adj。
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
    TNM: () => ref("TNM", null, "TNM 分期 (AJCC 8th)"),
    TNM_T: () => ref("TNM", "t", "T 分類定義 (Primary tumor)"),
    TNM_C: () => ref("TNM", "scc_c", "SCC 臨床分期 (cTNM)"),
    TNM_P: () => ref("TNM", "scc_p", "SCC 病理分期 (pTNM)"),
    TNM_YP: () => ref("TNM", "scc_yp", "SCC 術前治療後病理分期 (ypTNM)"),
    PATH: () => ref("PATHOLOGY", null, "病理原則 (Pathological review)"),
    SURG_RES: () => ref("SURGERY", "resectability", "可切除性標準 (Resectability)"),
    SURG_OUT: () => ref("SURGERY", "outcomes", "手術結果 (Surgical outcomes)"),
    CT_NEO: () => ref("CHEMO", "neoadj_ccrt", "Neoadjuvant / adjuvant CCRT regimens"),
    CT_DEF: () => ref("CHEMO", "definitive_ccrt", "Definitive CCRT regimens"),
    CT_ADJ: () => ref("CHEMO", "adjuvant", "Adjuvant regimens (含 Nivolumab)"),
    CT_PAL: () => ref("CHEMO", "palliative", "Palliative chemotherapy — SCC"),
    RT_PREOP: () => ref("RADIO", "preop", "Preoperative CCRT (放射治療)"),
    RT_DEF: () => ref("RADIO", "definitive", "Definitive CCRT (放射治療)"),
    RT_POSTOP: () => ref("RADIO", "postop", "Postoperative CCRT (放射治療)"),
    PARTICLE: () => ref("PARTICLE", null, "粒子治療 (Charged particle therapy)"),
    FOLLOWUP: () => ref("FOLLOWUP", null, "追蹤原則 (Follow up)"),
    TRIALS: () => ref("TRIALS", null, "關鍵臨床試驗 (Key trials)")
  };

  // ---------- tags ----------
  const T_MDT_STAGE = () => tag("Stage I–IVA：多專科評估 (Multidisciplinary evaluation)", "mdt");            // s15
  const T_MDT_RESECTABLE = () => tag("Potentially resectable：多專科討論 (Multidisciplinary review)", "mdt"); // s13

  // ---------- FOOTNOTES（v3 逐字；SCC 用 + 共用） ----------
  Object.assign(ECG.FOOTNOTES, {
    note1: "Mucosal defects affecting ≧3/4 of the esophageal circumference following ER, a preventive measures against stenosis should be considered.",
    note2: "T1b-SM1 should be managed similarly to T1a-MM, when these cannot be differentiated from each other.",
    note_er_ref: "※ 內視鏡切除 (EMR/ESD) 之詳細操作請參閱內視鏡黏膜下剝離術/內視鏡黏膜切除術指引。",
    note_high_risk: "High risk factors: advanced T/N stage (T3-4 or N+), close circumferential margin, LVI, perineural invasion, extracapsular lymph node",
    note_feeding: "Consider enteric feeding tube (NG, NJ, gastrostomy or jejunostomy) for preoperative nutritional support",
    note_response_workup: "評估檢查項目：PET/CT、Chest/abdominal CT、Upper GI endoscopy (optional if surgery is planned)",
    note_surgery_timing: "手術一般在術前化放療完成後 6-8 週進行",
    scc_a: "JCOG1109 NExT (Lancet 2024;404:55-66)：新輔助 DCF vs CF vs CRT，DCF 組 OS 顯著優於 CF (HR 0.68)，且有優於 CRT 的趨勢。",
    stent_ab: "食道癌相關胸主動脈支架之適應症及使用規範（自111年7月1日起修訂）：\n1. 影像學檢查發現食道癌併主動脈侵犯，橫切面影像發現腫瘤接觸超過主動脈圓周的四分之一。\n2. 且在主動脈周邊(paraaortic area)有腫瘤壞死、膿瘍或氣體堆積，造成主動脈有破裂之虞時。",
    nivo_adj: "CheckMate 577 (NEJM 2021;384:1191-1203)：Nivolumab adjuvant 於接受術前 CCRT 後手術之食道/GEJ 癌，DFS 顯著優於 placebo (median DFS 22.4 vs 11.0 mo)。"
  });

  // ---------- TREE ----------
  Object.assign(ECG.TREE, {

    // ============ ROOT ============
    root: {
      question: "請選擇癌細胞種類 (Cell Type)",
      options: [
        { label: "鱗狀細胞癌 (Squamous cell carcinoma)", next: "scc_stage", sub: "初始治療：依臨床分期與腫瘤狀態選擇" },
        { label: "腺癌 (Adenocarcinoma)", next: "adeno_stage", sub: "初始治療：依臨床分期與腫瘤狀態選擇" },
        { label: "SCC 後續評估 (Follow-up assessment)", next: "scc_followup_entry", sub: "內視鏡切除後病理 / 治療反應評估 / 手術結果 / 復發" },
        { label: "腺癌 後續評估 (Follow-up assessment)", next: "adeno_followup_entry", sub: "治療反應評估 / 手術結果 / 復發 / Biomarker 導向全身治療" }
      ],
      refs: [R.WORKUP(), R.TNM()],
      source: [14, 24]
    },

    // ============ SCC — FOLLOW-UP QUICK ENTRY（v4 新增，SPEC §2.1） ============
    scc_followup_entry: {
      question: "SCC 後續評估：請選擇目前情境",
      options: [
        { label: "內視鏡切除後病理評估 (Post-ER pathology)", next: "scc_post_er", sub: "EMR / ESD 後依病理結果決定追蹤或追加治療" },
        { label: "術前化療 / 化放療後反應評估", next: "scc_response_preop", sub: "Response assessment after preoperative treatment" },
        { label: "根除性化放療後反應評估", next: "scc_response_def", sub: "Response assessment after definitive CRT" },
        { label: "手術結果評估 (Surgical outcomes)", next: "scc_surgical_type", sub: "R0 / R1 / R2；是否曾接受術前化放療" },
        { label: "復發處置 (Recurrence)", next: "scc_recurrence", sub: "局部復發（曾手術 / 曾化放療）或遠端轉移" }
      ],
      refs: [R.FOLLOWUP()],
      source: [17, 19, 20, 21, 22]
    },

    // ============ SCC — INITIAL STAGING ============
    scc_stage: {
      question: "臨床分期與腫瘤狀態 (Clinical Stage)",
      options: [
        { label: "cT1a-EP/LPM", next: "scc_t1a_ep", sub: "下一步：病灶圓周範圍（全周性者再評估長度）" },
        { label: "cT1a-MM", next: "scc_t1a_mm", sub: "下一步：病灶圓周範圍；T1b-SM1 無法與 T1a-MM 區分時比照處理" },
        { label: "cT1b", next: "scc_t1b", sub: "下一步：是否可承受手術" },
        { label: "cT1b-cT2, N0", next: "res_scc_t1bc2_n0_low", sub: "低風險：<3cm, 良好分化" },
        { label: "cT2, N0 (高風險：LVI, ≥3cm, 低分化) 或 cT1b-cT2, N+ 或 cT3-cT4a, 任何N", next: "res_scc_adv_resectable" },
        { label: "cT4b", next: "res_scc_ct4b", sub: "侵犯心臟、大血管、氣管等" },
        { label: "無法切除之局部晚期、局部復發或遠端轉移", next: "scc_unresectable", sub: "Unresectable locally advanced, locally recurrent, or metastatic disease" }
      ],
      tags: [T_MDT_STAGE()],
      refs: [R.TNM_C(), R.WORKUP(), R.SURG_RES()],
      source: [15, 16, 18, 23]
    },
    scc_t1a_ep: {
      question: "病灶圓周範圍 (Circumference)",
      options: [
        { label: "非全周性 (Non-circumferential)", next: "res_scc_t1a_ep_non_circ" },
        { label: "全周性 (Whole-circumferential)", next: "scc_t1a_ep_len", sub: "下一步：病灶長度" }
      ],
      source: [16]
    },
    scc_t1a_ep_len: {
      question: "病灶長度 (Tumor Length)",
      options: [
        { label: "≦ 5cm", next: "res_scc_t1a_ep_circ_short" },
        { label: "> 5cm", next: "res_scc_t1a_ep_circ_long" }
      ],
      source: [16]
    },
    scc_t1a_mm: {
      question: "病灶圓周範圍 (Circumference)",
      options: [
        { label: "非全周性 (Non-circumferential)", next: "res_scc_t1a_mm_non_circ" },
        { label: "全周性 (Whole-circumferential)", next: "scc_t1a_mm_surg", sub: "下一步：是否可承受手術" }
      ],
      source: [16]
    },
    scc_t1a_mm_surg: {
      question: "患者是否可承受手術 (Fitness for surgery)",
      options: [
        { label: "可承受手術", next: "res_scc_t1a_mm_circ_surg", sub: "Can tolerate surgery" },
        { label: "無法承受手術", next: "res_scc_t1a_mm_circ_no_surg", sub: "Cannot tolerate surgery" }
      ],
      source: [16]
    },
    scc_t1b: {
      question: "患者是否可承受手術 (Fitness for surgery)",
      options: [
        { label: "可承受手術", next: "res_scc_t1b_surg", sub: "Can tolerate surgery" },
        { label: "無法承受手術", next: "res_scc_t1b_no_surg", sub: "Cannot tolerate surgery" }
      ],
      source: [16]
    },
    scc_unresectable: {
      question: "病人體能狀況 (Performance Status)",
      options: [
        { label: "KPS < 60% 或 ECOG ≥ 3", next: "res_scc_poor_ps" },
        { label: "KPS ≥ 60% 或 ECOG ≤ 2", next: "res_scc_good_ps" }
      ],
      refs: [R.CT_PAL()],
      source: [23]
    },

    // ============ SCC — EARLY STAGE RESULTS ============
    res_scc_t1a_ep_non_circ: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "EMR / ESD",
      notes: ["note1", "note_er_ref"],
      nextSteps: [{ label: "內視鏡切除後 → 病理評估", next: "scc_post_er" }],
      source: [16]
    },
    res_scc_t1a_ep_circ_short: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "ESD",
      notes: ["note1", "note_er_ref"],
      nextSteps: [{ label: "內視鏡切除後 → 病理評估", next: "scc_post_er" }],
      source: [16]
    },
    res_scc_t1a_ep_circ_long: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "手術切除 (Surgery)\n或 同步化放療 (Chemoradiotherapy)\n或 放射治療 (Radiotherapy)",
      notes: ["note1"],
      refs: [R.SURG_RES(), R.CT_DEF(), R.RT_DEF(), R.PARTICLE()],
      nextSteps: [
        { label: "手術後 → 手術結果評估", next: "scc_surgical_type" },
        { label: "化放療後 → 反應評估", next: "scc_response_def" }
      ],
      source: [16]
    },
    res_scc_t1a_mm_non_circ: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "EMR / ESD",
      notes: ["note1", "note2", "note_er_ref"],
      nextSteps: [{ label: "內視鏡切除後 → 病理評估", next: "scc_post_er" }],
      source: [16]
    },
    res_scc_t1a_mm_circ_surg: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "手術切除 (Surgery)\n或 同步化放療 (Chemoradiotherapy)\n或 放射治療 (Radiotherapy)",
      notes: ["note1", "note2"],
      refs: [R.SURG_RES(), R.CT_DEF(), R.RT_DEF(), R.PARTICLE()],
      nextSteps: [
        { label: "手術後 → 手術結果評估", next: "scc_surgical_type" },
        { label: "化放療後 → 反應評估", next: "scc_response_def" }
      ],
      source: [16]
    },
    res_scc_t1a_mm_circ_no_surg: {
      isResult: true, type: "warning", title: "建議治療方式",
      content: "同步化放療 (Chemoradiotherapy)\n或 放射治療 (Radiotherapy)",
      notes: ["note1", "note2"],
      refs: [R.CT_DEF(), R.RT_DEF(), R.PARTICLE()],
      nextSteps: [{ label: "化放療後 → 反應評估", next: "scc_response_def" }],
      source: [16]
    },
    res_scc_t1b_surg: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "手術切除 (Surgery)\n或 同步化放療 (Chemoradiotherapy)\n或 放射治療 (Radiotherapy)",
      notes: ["note2"],
      refs: [R.SURG_RES(), R.CT_DEF(), R.RT_DEF(), R.PARTICLE()],
      nextSteps: [
        { label: "手術後 → 手術結果評估", next: "scc_surgical_type" },
        { label: "化放療後 → 反應評估", next: "scc_response_def" }
      ],
      source: [16]
    },
    res_scc_t1b_no_surg: {
      isResult: true, type: "warning", title: "建議治療方式",
      content: "同步化放療 (Chemoradiotherapy)\n或 放射治療 (Radiotherapy)",
      notes: ["note2"],
      refs: [R.CT_DEF(), R.RT_DEF(), R.PARTICLE()],
      nextSteps: [{ label: "化放療後 → 反應評估", next: "scc_response_def" }],
      source: [16]
    },

    // ============ SCC — ADVANCED RESULTS ============
    res_scc_t1bc2_n0_low: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "食道切除術 (Esophagectomy) — 適用於非頸部食道",
      refs: [R.SURG_RES()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (未接受術前化放療)", next: "scc_surgical_no_prior" }],
      source: [18]
    },
    res_scc_adv_resectable: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "術前化療 (Preoperative chemotherapy, DCF)\n或 術前同步化放療 (Preoperative chemoradiation, RT 41.4-50.4 Gy + 併用化療)\n或 根除性同步化放療 (Definitive chemoradiation, RT 50.4-60 Gy + 併用化療)",
      notes: ["scc_a", "note_feeding"],
      tags: [T_MDT_RESECTABLE()],
      refs: [R.CT_NEO(), R.CT_DEF(), R.RT_PREOP(), R.RT_DEF(), R.SURG_RES(), R.TRIALS()],
      nextSteps: [
        { label: "術前化療/化放療後 → 反應評估", next: "scc_response_preop" },
        { label: "根除性化放療後 → 反應評估", next: "scc_response_def" }
      ],
      source: [13, 15, 18]
    },
    res_scc_ct4b: {
      isResult: true, type: "primary", title: "建議治療方式",
      content: "根除性同步化放療 (Definitive chemoradiation, RT 50.4-60 Gy + 併用化療)",
      extra: "若侵犯氣管、大血管、椎體或心臟，可考慮新輔助化學治療接續根除性化放療，或單獨使用化學治療。若需置放 TAA Stent 請參閱下方規範。",
      notes: ["stent_ab"],
      refs: [R.RT_DEF(), R.CT_DEF(), R.SURG_RES()],
      nextSteps: [{ label: "化放療後 → 反應評估", next: "scc_response_def" }],
      source: [18]
    },
    res_scc_poor_ps: {
      isResult: true, type: "danger", title: "建議治療方式",
      content: "緩和治療 / 最佳支持性照護 (Palliative / Best supportive care)",
      source: [23]
    },
    res_scc_good_ps: {
      isResult: true, type: "warning", title: "建議治療方式",
      content: "全身性治療 (Systemic therapy) 及/或 緩和治療/最佳支持性照護 (Palliative/Best supportive care)",
      tags: [tag("Palliative：Cisplatin plus fluoropyrimidine or paclitaxel plus immune therapy (Regimen 6 or 7)", "preferred")],   // s46
      refs: [R.CT_PAL(), R.TRIALS()],
      source: [23, 46, 47]
    },

    // ============ SCC — POST-ER PATHOLOGICAL EVALUATION ============
    scc_post_er: {
      question: "內視鏡切除後病理評估結果 (Post-ER Pathological Evaluation)",
      options: [
        { label: "pT1a-EP/LPM, 無血管侵犯 (Negative for vascular invasion)", next: "res_scc_post_er_follow" },
        { label: "pT1a-MM, 無血管侵犯", next: "res_scc_post_er_eval" },
        { label: "pT1a-M, 有血管侵犯 (Positive for vascular invasion)", next: "res_scc_post_er_eval" },
        { label: "pT1b-SM", next: "res_scc_post_er_t1b" }
      ],
      refs: [R.PATH(), R.TNM_T()],
      source: [17]
    },
    res_scc_post_er_follow: {
      isResult: true, type: "neutral", title: "後續處置",
      content: "追蹤觀察 (Follow-up)",
      refs: [R.FOLLOWUP()],
      source: [17]
    },
    res_scc_post_er_eval: {
      isResult: true, type: "warning", title: "後續處置",
      content: "綜合判斷是否需要追加治療\n(Comprehensively determine whether additional treatment is required or not)",
      source: [17]
    },
    res_scc_post_er_t1b: {
      isResult: true, type: "warning", title: "後續處置",
      content: "食道切除術 (Esophagectomy)\n或 同步化放療 (Chemoradiotherapy)",
      refs: [R.SURG_RES(), R.CT_DEF(), R.RT_DEF()],
      nextSteps: [{ label: "手術後 → 手術結果評估", next: "scc_surgical_type" }],
      source: [17]
    },

    // ============ SCC — RESPONSE ASSESSMENT ============
    scc_response_preop: {
      question: "術前化療/化放療後反應評估 (Response Assessment after Preop treatment)",
      extra: "評估項目：PET/CT、Chest/abdominal CT、Upper GI endoscopy (optional if surgery is planned)",
      options: [
        { label: "無疾病證據 (No evidence of disease)", next: "res_scc_resp_preop_ned" },
        { label: "持續局部疾病 (Persistent local disease)", next: "res_scc_resp_preop_local" },
        { label: "無法切除或轉移 (Unresectable or Metastatic disease)", next: "res_scc_resp_preop_met" }
      ],
      refs: [R.RT_PREOP()],
      source: [19]
    },
    res_scc_resp_preop_ned: {
      isResult: true, type: "primary", title: "評估後處置",
      content: "食道切除術 (Esophagectomy)\n或 追蹤觀察 (Surveillance)",
      notes: ["note_surgery_timing"],
      refs: [R.SURG_RES(), R.FOLLOWUP()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受術前化放療)", next: "scc_surgical_prior" }],
      source: [19]
    },
    res_scc_resp_preop_local: {
      isResult: true, type: "warning", title: "評估後處置",
      content: "食道切除術 (Esophagectomy)\n或 緩和處置 (Palliative Management)",
      refs: [R.SURG_RES(), R.CT_PAL()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受術前化放療)", next: "scc_surgical_prior" }],
      source: [19]
    },
    res_scc_resp_preop_met: {
      isResult: true, type: "danger", title: "評估後處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_PAL()],
      source: [19]
    },

    scc_response_def: {
      question: "根除性化放療後反應評估 (Response Assessment after Definitive CRT)",
      extra: "評估項目：PET/CT、Chest/abdominal CT、Upper GI endoscopy",
      options: [
        { label: "無疾病證據 (No evidence of disease)", next: "res_scc_resp_def_ned" },
        { label: "持續局部疾病 (Persistent local disease)", next: "res_scc_resp_def_local" },
        { label: "無法切除或轉移 (Unresectable or Metastatic disease)", next: "res_scc_resp_def_met" }
      ],
      refs: [R.RT_DEF()],
      source: [19]
    },
    res_scc_resp_def_ned: {
      isResult: true, type: "neutral", title: "評估後處置",
      content: "追蹤觀察 (Surveillance)",
      refs: [R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "scc_recurrence" }],
      source: [19]
    },
    res_scc_resp_def_local: {
      isResult: true, type: "warning", title: "評估後處置",
      content: "食道切除術 (Esophagectomy)\n或 緩和處置 (Palliative Management)",
      refs: [R.SURG_RES(), R.CT_PAL()],
      nextSteps: [{ label: "手術後 → 手術結果評估 (已接受化放療)", next: "scc_surgical_prior" }],
      source: [19]
    },
    res_scc_resp_def_met: {
      isResult: true, type: "danger", title: "評估後處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_PAL()],
      source: [19]
    },

    // ============ SCC — SURGICAL OUTCOMES ============
    scc_surgical_type: {
      question: "患者是否曾接受術前化放療？",
      options: [
        { label: "未接受術前化放療 (No prior chemoradiation)", next: "scc_surgical_no_prior" },
        { label: "已接受術前化放療 (Prior chemoradiation)", next: "scc_surgical_prior" }
      ],
      refs: [R.SURG_OUT()],
      source: [20, 21]
    },
    scc_surgical_no_prior: {
      question: "手術結果 — 未接受術前化放療 (Surgical Outcomes - No prior CRT)",
      options: [
        { label: "完全切除 (R0 resection)", next: "res_scc_surg_np_r0" },
        { label: "顯微鏡下殘留 (R1 resection)", next: "res_scc_surg_np_r1" },
        { label: "肉眼殘留 (R2 resection)", next: "res_scc_surg_np_r2" }
      ],
      refs: [R.SURG_OUT(), R.TNM_P(), R.PATH()],
      source: [20]
    },
    res_scc_surg_np_r0: {
      isResult: true, type: "primary", title: "R0 術後處置",
      content: "追蹤觀察 (Surveillance)\n或 同步化放療 (Chemoradiation) — 若有高風險因子",
      notes: ["note_high_risk"],
      refs: [R.RT_POSTOP(), R.CT_NEO(), R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "scc_recurrence" }],
      source: [20]
    },
    res_scc_surg_np_r1: {
      isResult: true, type: "warning", title: "R1 術後處置",
      content: "同步化放療 (Chemoradiation)",
      refs: [R.RT_POSTOP(), R.CT_NEO()],
      source: [20]
    },
    res_scc_surg_np_r2: {
      isResult: true, type: "danger", title: "R2 術後處置",
      content: "同步化放療 (Chemoradiation)\n或 緩和處置 (Palliative Management)",
      refs: [R.RT_POSTOP(), R.CT_NEO(), R.CT_PAL()],
      source: [20]
    },

    scc_surgical_prior: {
      question: "手術結果 — 已接受術前化放療 (Surgical Outcomes - Prior CRT)",
      options: [
        { label: "R0, ypT0N0", next: "res_scc_surg_p_pcr", sub: "病理完全反應" },
        { label: "R0, ypT positive 或/及 N positive", next: "res_scc_surg_p_residual", sub: "殘留病灶" },
        { label: "顯微鏡下殘留 (R1 resection)", next: "res_scc_surg_p_r1" },
        { label: "肉眼殘留 (R2 resection)", next: "res_scc_surg_p_r2" }
      ],
      refs: [R.SURG_OUT(), R.TNM_YP(), R.PATH()],
      source: [21]
    },
    res_scc_surg_p_pcr: {
      isResult: true, type: "neutral", title: "R0 ypT0N0 術後處置",
      content: "追蹤觀察 (Surveillance)",
      refs: [R.FOLLOWUP()],
      nextSteps: [{ label: "若日後復發 → 復發處置", next: "scc_recurrence" }],
      source: [21]
    },
    res_scc_surg_p_residual: {
      isResult: true, type: "warning", title: "R0 ypT+/N+ 術後處置",
      content: "輔助 Nivolumab (Adjuvant Nivolumab, 首選)\n或 輔助治療 (Adjuvant chemoradiation or chemotherapy)\n或 追蹤觀察 (Surveillance)",
      notes: ["nivo_adj"],
      tags: [tag("Adjuvant Nivolumab", "preferred")],   // s21 "Adjuvant Nivolumab (preffered)"; s45 "Prefer regimen: Immune therapy"
      refs: [R.CT_ADJ(), R.RT_POSTOP(), R.TRIALS()],
      source: [21, 45]
    },
    res_scc_surg_p_r1: {
      isResult: true, type: "warning", title: "R1 術後處置",
      content: "輔助治療 (Adjuvant treatment)\n或 追蹤觀察 (Surveillance)",
      refs: [R.CT_ADJ(), R.RT_POSTOP(), R.FOLLOWUP()],
      source: [21]
    },
    res_scc_surg_p_r2: {
      isResult: true, type: "danger", title: "R2 術後處置",
      content: "觀察至疾病進展 (Observation until progression)\n或 緩和處置 (Palliative Management)",
      refs: [R.CT_PAL()],
      source: [21]
    },

    // ============ SCC — RECURRENCE ============
    scc_recurrence: {
      question: "復發類型 (Type of Recurrence)",
      options: [
        { label: "局部復發：曾手術，未曾化放療", next: "res_scc_recur_surg_only", sub: "Locoregional recurrence: prior esophagectomy, no prior chemoradiation" },
        { label: "局部復發：曾化放療，未曾手術", next: "scc_recur_ccrt_only", sub: "Locoregional recurrence: prior chemoradiation, no prior esophagectomy" },
        { label: "遠端轉移 (Metastatic disease)", next: "res_scc_recur_met" }
      ],
      source: [22]
    },
    res_scc_recur_surg_only: {
      isResult: true, type: "warning", title: "局部復發處置 (曾手術)",
      content: "同步化放療 (Concurrent chemoradiation)\n或 手術 (Surgery)\n或 化學治療 (Chemotherapy)\n或 緩和治療/最佳支持性照護",
      refs: [R.CT_DEF(), R.RT_DEF(), R.SURG_RES(), R.CT_PAL()],
      source: [22]
    },
    scc_recur_ccrt_only: {
      question: "腫瘤是否可切除？",
      options: [
        { label: "可切除且適合手術 (Resectable and medically operable)", next: "res_scc_recur_resectable" },
        { label: "不可切除或不適合手術 (Unresectable or medically inoperable)", next: "res_scc_recur_unresect" }
      ],
      refs: [R.SURG_RES()],
      source: [22]
    },
    res_scc_recur_resectable: {
      isResult: true, type: "primary", title: "局部復發處置 (曾化放療，可切除)",
      content: "食道切除術 (Esophagectomy)",
      refs: [R.SURG_RES()],
      source: [13, 22]
    },
    res_scc_recur_unresect: {
      isResult: true, type: "danger", title: "局部復發處置 (曾化放療，不可切除)",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_PAL()],
      source: [22]
    },
    res_scc_recur_met: {
      isResult: true, type: "danger", title: "遠端轉移處置",
      content: "緩和處置 (Palliative Management)",
      refs: [R.CT_PAL()],
      source: [22]
    }
  });
})();
