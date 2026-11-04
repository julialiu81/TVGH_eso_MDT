// 00_core.js — 命名空間初始化（所有 data 檔第一個載入）。內容檔以 Object.assign / push 追加，不得覆寫。
window.ECG = window.ECG || {};
(function (ECG) {
  ECG.META = {
    title: "臺北榮總食道癌多專科診療指引",
    subtitle: "Taipei VGH Practice Guidelines: Esophageal Cancer",
    version: "2025/12/30 修訂版",
    team: "臺北榮總食道癌多專科團隊",
    basis: "AJCC Cancer Staging Manual 8th edition；主要參考 NCCN Esophageal and Esophagogastric Junction Cancers",
    sourcePdf: "ESG_v20251230.pptx",
    sourcePages: 0   // 0 = 本 app 不提供原始投影片檢視（UI 隱藏「原始頁面」按鈕）
  };
  ECG.TREE = ECG.TREE || {};
  ECG.FOOTNOTES = ECG.FOOTNOTES || {};
  ECG.REF_PANELS = ECG.REF_PANELS || [];
  ECG.REF_DATA = ECG.REF_DATA || {};
  ECG.STAGE_TABLE = ECG.STAGE_TABLE || null;
  ECG.TAG_LEVELS = {
    preferred: "建議優先",
    other: "其他建議",
    certain: "特定情況可用",
    nhi_yes: "健保給付",
    nhi_cond: "健保條件給付",
    nhi_no: "健保未給付",
    tfda_no: "TFDA 未核准",
    trial: "建議臨床試驗",
    mdt: "需多專科討論"
  };
  Object.assign(ECG.FOOTNOTES, {
    note_disclaimer: "本指引之用藥建議基於現有臨床證據，與衛福部或健保署規定無關。",
    note_mdt: "若病情複雜或未列於指引選項內，請交由多專科團隊 (Multidisciplinary Team) 綜合評估。"
  });
})(window.ECG);
