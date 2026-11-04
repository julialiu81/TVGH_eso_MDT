// 40_ref_tx.js — Agent R
// 參考面板：CHEMO, RADIO, PARTICLE, FOLLOWUP（group tx）；TRIALS, REFERENCES（group misc）
// 內容來源：_dev/index_v3_reference.html 的 REF_DATA（逐字搬移，Tailwind class 換成殼的 class）；
//           v3 沒有的段落（definitive CCRT、一般原則、投影片原文 <details>、參考文獻）取自 _dev/pptx_text.txt，
//           並逐張對照 _dev/slides/s42–s72.png。
// 「建議優先」tag 只加在投影片標示 "Prefer regimen" / "Preferred" 的項目；不加 nhi_* / tfda_no。
// 純 JS（無 JSX）；node 與 browser 皆可載入。整檔包在 IIFE，不宣告全域 ECG。
window.ECG = window.ECG || {};
(function () {
  const ECG = window.ECG;
  ECG.REF_PANELS = ECG.REF_PANELS || [];
  ECG.REF_DATA = ECG.REF_DATA || {};

  /* ------------------------------------------------------------------ *
   * 0. 面板註冊（key / label / group 依 SPEC §2.2）
   * ------------------------------------------------------------------ */
  const PANELS = [
    { key: 'CHEMO', label: '化學治療 / 全身治療', group: 'tx' },
    { key: 'RADIO', label: '放射治療', group: 'tx' },
    { key: 'PARTICLE', label: '粒子治療', group: 'tx' },
    { key: 'FOLLOWUP', label: '追蹤原則', group: 'tx' },
    { key: 'TRIALS', label: '關鍵臨床試驗', group: 'misc' },
    { key: 'REFERENCES', label: '參考文獻', group: 'misc' }
  ];
  PANELS.forEach(function (p) {
    if (!ECG.REF_PANELS.some(function (x) { return x.key === p.key; })) ECG.REF_PANELS.push(p);
  });
  // 同 v3 選單：團隊組成放最後（TEAM 由 30_ref_dx.js 註冊）
  const iTeam = ECG.REF_PANELS.findIndex(function (x) { return x.key === 'TEAM'; });
  if (iTeam >= 0 && iTeam !== ECG.REF_PANELS.length - 1) ECG.REF_PANELS.push(ECG.REF_PANELS.splice(iTeam, 1)[0]);

  /* ------------------------------------------------------------------ *
   * 1. 小工具
   * ------------------------------------------------------------------ */
  const PREF = '<span class="tag tag-preferred">建議優先</span>';
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }
  function reg(title, items) { return '<p><strong>' + title + '</strong></p>' + (items && items.length ? ul(items) : ''); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  const sup = function (s) { return '<sup>' + s + '</sup>'; };

  // 投影片上重複出現的劑量行（s43–s47 逐字）
  const PFL_96H = [
    'Cisplatin (CDDP) 80 mg/m2 infusion for 3 hours on Day 1',
    '5-FU 400mg/m2/day per 24 hours as a 96 hours continuous infusion on Day 1-4',
    'Leucovorin 90 mg/m2/day per 24 hours as a 96 hours continuous infusion on Day 1-4'
  ];
  const FL_96H = PFL_96H.slice(1);
  const PACLI_CARBO = ['Paclitaxel 50 mg/m2 infusion for 1 hour', 'Carboplatin AUC 2 mg/mL infusion for 1 hour'];
  const RT_NOTE = '<p>*RT: please see radiotherapy recommendation part（→ <a href="#/ref/RADIO">放射治療</a>）</p>';

  /* ------------------------------------------------------------------ *
   * 2. 參考文獻（編號依投影片；文字由 _dev/pptx_text.txt 逐字帶入，已對照 s34、s58–61、s70–71 圖片）
   * ------------------------------------------------------------------ */
  // s34 Reference of Surgical Resection（1–14）
  const REFS_SURG = [
    "Hsu PK, Huang CS, Wang BY, Wu YC, Hsu WH. Survival Benefits of Postoperative Chemoradiation in Lymph Node-Positive Esophageal Squamous Cell Carcinoma. Ann Thorac Surg 2014;97:1734-41.(SCI)",
    "Hsu PK, Huang CS, Wu YC, Chou TY, Hsu WH. Open versus Thoracoscopic Esophagectomy in Patients with Esophageal Squamous Cell Carcinoma. World J Surg. 2014;38:402-9. (SCI)",
    "Hsu PK, Huang CS, Wang BY, Wu YC, Chou TY, Hsu WH. The Prognostic Value of the Number of Negative Lymph Nodes in Esophageal Cancer Patients after Transthoracic Resection. Ann Thorac Surg 2013;96:995-1001. (SCI)",
    "Hsu PK, Chien LI, Huang CS, Hsieh CC, Wu YC, Hsu WH, Chou TY. Comparison of survival among neoadjuvant chemoradiation responders, non-responders and patients receiving primary resection for locally advanced oesophageal squamous cell carcinoma: does neoadjuvant chemoradiation benefit all? Interact Cardiovasc Thorac Surg. 2013;17:460-6. (SCI)",
    "Wang BY, Liu CY, Lin CH, Hsu PK, Hsu WH, Wu YC, Cheng CY. Endoscopic Tumor Length Is an Independent Prognostic Factor in Esophageal Squamous Cell Carcinoma. Ann Surg Oncol. 2012;19:2149-58. (SCI)",
    "Hsu PK, Wang BY, Huang CS, Wu YC, Hsu WH. Prognostic factors for post-recurrence survival in esophageal squamous cell carcinoma patients with recurrence after resection. J Gastrointest Surg. 2011;15:558-65. (SCI)",
    "Hsu PK, Wang BY, Chou TY, Huang CS, Wu YC, Hsu WH. The total number of resected lymph node is not a prognostic factor for recurrence in esophageal squamous cell carcinoma patients undergone transthoracic esophagectomy. J Surg Oncol. 2011;103:416-20. (SCI)",
    "Wang BY, Goan YG, Hsu PK, Hsu WH, Wu YC. Tumor length as a prognostic factor in esophageal squamous cell carcinoma. Ann Thorac Surg. 2011;91:887-93. (SCI)",
    "Hsu PK, Chien LI, Huang CS, Yeh YC, Huang PI, Chen MH, Chen SY, Yen CC, Hsu HS. Treatment Patterns and Outcomes in Patients with Esophageal Cancer: An Analysis of a Multidisciplinary Tumor Board Database. Ann Surg Oncol. 2021 Aug 13. (SCI)",
    "Tsai PC, Ting YC, Hsu PK, Hung JJ, Huang CS, Hsu WH, Hsu HS. Overall Survival for Esophageal Squamous Cell Carcinoma with Multiple Primary Cancers after Curative Esophagectomy-A Retrospective Single-Institution Study. Cancers (Basel). 2022 Nov; 14(21):5263. (SCI)",
    "Tsai PC, Chien HC, Hsu PK, Hung JJ, Huang CS, Hsu WH, Hsu HS. Post-recurrence survival analysis in patients with oligo-recurrence after curative esophagectomy. BMC cancer. 2022 Jun 9; 22(1):637. (SCI)",
    "Hsu PK, Chien LI, Chuang LC, Lee YY, Huang CS, Hsu HS, Wu YC, Hsu WH. Modified En Bloc Esophagectomy for Squamous Cell Carcinoma After Neoadjuvant Chemoradiotherapy. Ann Thorac Surg 2023;115:862-9. (SCI)",
    "NCCN Practice Guidelines in Oncology, Esophageal Cancer, Version 5.2024 — December 20, 2024",
    "Kitagawa, Y., Ishihara, R., Ishikawa, H., Ito, Y., Oyama, T., Oyama, T., ... & Yoshida, M. (2023). Esophageal cancer practice guidelines 2022 edited by the Japan esophageal society: part 1. Esophagus, 20(3), 343-372."
  ];
  // s58–s61 Reference of Chemotherapy（1–47；s58: 1–15, s59: 16–28, s60: 29–42, s61: 43–47）
  const REFS_CHEMO = [
    "Cooper JS et al. Chemoradiotherapy of locally advanced esophageal cancer: long-term follow-up of aprospective randomized trial (RTOG 85-01). Radiation Therapy Oncology Group. JAMA 1999;281(17):1623-1627.",
    "Van Hagen P et al. Preoperative chemoradiotherapy for esophageal or junctional cancer. N Engl J Med. 2012;366:2074-84.",
    "Bedenne L et al. Chemoradiation followed by surgery compared with chemoradiation alone in squamous cancer of the esophagus: FFCD 9102. J Clin  Oncol 2007; 25:1160.",
    "Walsh TN et al. A comparison of multimodal therapy and surgery for esophageal adenocarcinoma. N Eng J Med 1996; 335:462.",
    "Urba SG et al. Concurrent cisplatin, paclitaxel, and radiotherapy as preoperative treatment for patients with locoregional esophageal carcinoma. Cancer. 2003;98:2177-2183.",
    "Herskovic A et al. Combined chemotherapy and radiotherapy compared with radiotherapy alone in patients with cancer of the esophagus. N Eng J Med1992; 326:1593.",
    "Lorenzen S et al. Cetuximab plus cisplatin-5-fluorouracil versus cisplatin-5-fluorouracil alone in first-line metastatic squamous cell carcinoma of the esophagus: a randomized phase II study of the Arbeitsgemeinschaft Internistische Onkologie. Ann Oncol. 2009 Oct;20(10):1667-73.",
    "Bleiberg, H et al. Randomised phase II study of cisplatin and 5-fluorouracil (5-FU) versus cisplatin alone in advanced squamous cell oesophageal cancer. Eur J Cancer 1997;33:1216.",
    "Ilson, DH et al. A phase II trial of paclitaxel and cisplatin in patients with advanced carcinoma of the esophagus. Cancer J 2000; 6:316.",
    "Ilson, DH et al. Phase II trial of weekly irinotecan plus cisplatin in advanced esophageal cancer. J Clin Oncol 1999; 17:3270.",
    "Meerten EV et al. First-line treatment with oxaliplatin and capecitabine in patients with advanced or metastatic eosophageal cancer: a phase II study. Br J Cancer 2007;96:1348.",
    "Kudo T et al. Nivolumab treatment for oesophageal squamous-cell carcinoma: an open-label, multicentre, phase 2 trial. Lancet Oncology 2017;18:631-639.",
    "Kelly RJ, Ajani JA, Kuzdzal J, Zander T, Van Cutsem E, Piessen G, Mendez G, Feliciano J, Motoyama S, Lièvre A, Uronis H, Elimova E, Grootscholten C, Geboes K, Zafar S, Snow S, Ko AH, Feeney K, Schenker M, Kocon P, Zhang J, Zhu L, Lei M, Singh P, Kondo K, Cleary JM, Moehler M; CheckMate 577 Investigators. Adjuvant Nivolumab in Resected Esophageal or Gastroesophageal Junction Cancer. N Engl J Med. 2021 Apr 1;384(13):1191-1203. doi: 10.1056/NEJMoa2032125. Erratum in: N Engl J Med. 2023 Feb 16;388(7):672. PMID: 33789008.",
    "Sun JM, Shen L, Shah MA, Enzinger P, Adenis A, Doi T, Kojima T, Metges JP, Li Z, Kim SB, Cho BC, Mansoor W, Li SH, Sunpaweravong P, Maqueda MA, Goekkurt E, Hara H, Antunes L, Fountzilas C, Tsuji A, Oliden VC, Liu Q, Shah S, Bhagia P, Kato K; KEYNOTE-590 Investigators. Pembrolizumab plus chemotherapy versus chemotherapy alone for first-line treatment of advanced oesophageal cancer (KEYNOTE-590): a randomised, placebo-controlled, phase 3 study. Lancet. 2021 Aug 28;398(10302):759-771. doi: 10.1016/S0140-6736(21)01234-4. Erratum in: Lancet. 2021 Nov 20;398(10314):1874. PMID: 34454674.",
    "Doki Y, Ajani JA, Kato K, Xu J, Wyrwicz L, Motoyama S, Ogata T, Kawakami H, Hsu CH, Adenis A, El Hajbi F, Di Bartolomeo M, Braghiroli MI, Holtved E, Ostoich SA, Kim HR, Ueno M, Mansoor W, Yang WC, Liu T, Bridgewater J, Makino T, Xynos I, Liu X, Lei M, Kondo K, Patel A, Gricar J, Chau I, Kitagawa Y; CheckMate 648 Trial Investigators. Nivolumab Combination Therapy in Advanced Esophageal Squamous-Cell Carcinoma. N Engl J Med. 2022 Feb 3;386(5):449-462. doi: 10.1056/NEJMoa2111380. PMID: 35108470.",
    "Salah-Eddin Al-Batran, Nils Homann, Harald Schmalenberg et al. Perioperative chemotherapy with docetaxel, oxaliplatin, and fluorouracil/leucovorin (FLOT) versus epirubicin, cisplatin, and fluorouracil or capecitabine (ECF/ECX) for resectable gastric or gastroesophageal junction (GEJ) adenocarcinoma (FLOT4-AIO): A multicenter, randomized phase 3 trial. Journal of Clinical Oncology 35, no. 15_suppl, 4004-4004.",
    "Sasako M, et al. Five-year outcomes of a randomized phase III trial comparing adjuvant chemotherapy with S-1 versus surgery alone in stage II or III gastric cancer. J Clin Oncol. 2011 Nov 20;29(33):4387-93. Epub 2011 Oct 17",
    "Y Bang et al. Adjuvant capecitabine and oxaliplatin for gastric cancer: Results of the phase III CLASSIC trial. Lancet. 2012 ;379:315-21",
    "Paoletti X, et al. Benefit of adjuvant chemotherapy for resectable gastric cancer: A metaanalysis: GASTRIC (Global Advanced/Adjuvant Stomach Tumor Research International Collaboration) Group. JAMA 303:1729–1737",
    "Kodera Y, Yoshida K, Kochi M, et al. A randomized phase III study comparing S-1 plus docetaxel with S-1 alone as a postoperative adjuvant chemotherapy for curatively resected stage III gastric cancer (JACCRO GC-07 trial). J Clin Oncol 36, 2018 (suppl; abstr 4007)",
    "Park SH et al, ARTIST 2: Interim results of a phase III trial involving adjuvant chemotherapy and/or chemoradiotherapy after D2-gastrectomy in stage II/III gastric cancer (GC). Journal of Clinical Oncology 37, no. 15_suppl (May 20, 2019) 4001-4001.",
    "Lee J, Lim do H, Kim S, et al. Phase III trial comparing capecitabine plus cisplatin versus capecitabine plus cisplatin with concurrent capecitabine radiotherapy in completely resected gastric cancer with D2 lymph node dissection: the ARTIST trial. J Clin Oncol. 2012;30:268-73.",
    "Kang YK, Chen LT, Ryu MH, Oh DY, Oh SC, Chung HC, Lee KW, Omori T, Shitara K, Sakuramoto S, Chung IJ, Yamaguchi K, Kato K, Sym SJ, Kadowaki S, Tsuji K, Chen JS, Bai LY, Oh SY, Choda Y, Yasui H, Takeuchi K, Hirashima Y, Hagihara S, Boku N. Nivolumab plus chemotherapy versus placebo plus chemotherapy in patients with HER2-negative, untreated, unresectable advanced or recurrent gastric or gastro-oesophageal junction cancer (ATTRACTION-4): a randomised, multicentre, double-blind, placebo-controlled, phase 3 trial. Lancet Oncol. 2022 Feb;23(2):234-247. doi: 10.1016/S1470-2045(21)00692-6. Epub 2022 Jan 11. PMID: 35030335.",
    "M. Moehler et al. Nivolumab (nivo) plus chemotherapy (chemo) versus chemo as first-line (1L) treatment for advanced gastric cancer/gastroesophageal junction cancer (GC/GEJC)/esophageal adenocarcinoma (EAC): First results of the CheckMate 649 study. Annals of Oncology (2020) 31 (suppl_4): S1142-S1215. 10.1016/annonc/annonc325",
    "Cascinu S, Labianca R, Alessandroni P, Marcellini M, Silva RR, Pancera G, Testa E, Martignoni G, Barni S, Frontini L, Zaniboni A, Luporini G, Cellerino R, Catalano G. Intensive weekly chemotherapy for advanced gastric cancer using fluorouracil, cisplatin, epi-doxorubicin, 6S-leucovorin, glutathione, and filgrastim: a report from the Italian Group for the Study of Digestive Tract Cancer. J Clin Oncol. 1997 Nov;15(11):3313-9. doi: 10.1200/JCO.1997.15.11.3313. PMID: 9363860.",
    "Park YH et al. Capecitabine in combination with Oxaliplatin (XELOX) as a first-line therapy for advanced gastric cancer. Cancer Chemother Pharmacol. 2008;61(4):623-9.",
    "Kuo YC, et al. Modified biweekly oxaliplatin and capecitabine for advanced gastric cancer: a retrospective analysis from a medical center. Biomed J. 2014;37(3):141-6.",
    "Chao Y, et al. A multicenter phase II study of biweekly capecitabine in combination with oxaliplatin as first-line chemotherapy in patients with locally advanced or metastatic gastric cancer. Cancer Chemother Pharmacol. 2014;73:799-806.",
    "Bang YJ  et al. Trastuzumab in combination with chemotherapy versus chemotherapy alone for treatment of HER2-positive advanced gastric or gastro-oesophageal junction cancer (ToGA): a phase 3, open-label, randomised controlled trial. Lancet, 2010;376(9742):687-97.",
    "Chung HC, et al First-line pembrolizumab/placebo plus trastuzumab and chemotherapy in HER2-positive advanced gastric cancer: KEYNOTE-811. Future Oncol 2021 Feb;17(5):491-501.",
    "Van Cutsem E et al. Phase III study of docetaxel and cisplatin plus fluorouracil compared with cisplatin and fluorouracil as first-line therapy for advanced gastric cancer: a report of the V325 Study Group. J Clin Oncol. 2006 Nov 1;24(31):4991-7.",
    "Chao Y et al. An open, multi-centre, phase II clinical trial to evaluate the efficacy and safety of paclitaxel, UFT, and leucovorin in patients with advanced gastric cancer. Br J Cancer. 2006;95(2):159-63.",
    "Dank M et al. Randomized phase III study comparing irinotecan combined with 5-fluorouracil and folinic acid to cisplatin combined with 5-fluorouracil in chemotherapy naive patients with advanced adenocarcinoma of the stomach or esophagogastric junction. Ann Oncol. 2008;19(8):1450-7.",
    "Guimbaud R, Louvet C, Ries P et al. Prospective, randomized, multicenter, phase III study of fluorouracil, leucovorin, and irinotecan versus epirubicin, cisplatin, and capecitabine in advanced gastric adenocarcinoma: a French intergroup (Fédération Francophone de Cancérologie Digestive, Fédération Nationale des Centres de Lutte Contre le Cancer, and Groupe Coopérateur Multidisciplinaire en Oncologie) study. J Clin Oncol. 2014;32:3520-6",
    "Fuchs CS, et al. Ramucirumab monotherapy for previously treated advanced gastric or gastro-oesophageal junction adenocarcinoma (REGARD): an international, randomised, multicentre, placebo-controlled, phase 3 trial. Lancet. 2014 ;383(9911):31-9.",
    "Wilke H, et al. Ramucirumab plus paclitaxel versus placebo plus paclitaxel in patients  with previously treated advanced gastric or gastro-oesophageal junction adenocarcinoma (RAINBOW): a double-blind, randomised phase 3 trial. Lancet Oncol. 2014 Oct;15(11):1224-35.",
    "Ford HE, et al.  Docetaxel versus active symptom control for refractory oesophagogastric adenocarcinoma (COUGAR-02): an open-label, phase 3 randomised controlled trial. Lancet Oncol. 2014 Jan;15(1):78-86",
    "Hironaka S, et al. Randomized, open-label, phase III study comparing irinotecan with paclitaxel in patients with advanced gastric cancer without severe peritoneal metastasis after failure of prior combination chemotherapy using fluoropyrimidine plus platinum: WJOG 4007 trial. J Clin Oncol. 2013 Dec 10;31(35):4438-44.",
    "Shitara K, Doi T, Dvorkin M, et al. Trifluridine/tipiracil versus placebo in patients with heavily pretreated metastatic gastric cancer (TAGS): a randomised, double-blind, placebo-controlled, phase 3 trial. Lancet Oncol. 2018 Nov;19(11):1437-1448.",
    "Shitara K et al. Pembrolizumab versus paclitaxel for previously treated, advanced gastric or gastro-oesophageal junction cancer (KEYNOTE-061): a randomised, open-label, controlled, phase 3 trial. Lancet Oncology. 2018; 392:123-133",
    "Doebele RC, Drilon A, Paz-Ares L, et al. Entrectinib in patients with advanced or metastatic NTRK fusion-positive solid tumours: integrated analysis of three phase 1-2 trials. Lancet Oncol 2019;21:271-282.",
    "Drilon A, Laetsch TW, Kummar S, et al. Efficacy of larotrectinib in TRK fusion–positive cancers in adults and children. N Engl J Med 2018;378:731-739.",
    "Pembrolizumab plus chemotherapy versus placebo plus chemotherapy for HER2-negative advanced gastric cancer (KEYNOTE-859): a multicentre, randomised, double-blind, phase 3 trial. Rha, Sun YoungMendez, Guillermo et al. The Lancet Oncology, Volume 24, Issue 11, 1181 – 1195.",
    "Yoon-Koo Kang, Taroh Satoh, Min-Hee Ryu et al. Nivolumab (ONO-4538/BMS-936558) as salvage treatment after second or later-line chemotherapy for advanced gastric or gastro-esophageal junction cancer (AGC): A double-blinded, randomized, phase III trial. DOI: 10.1200/JCO.2017.35.4_suppl.2 Journal of Clinical Oncology 35, no. 4_suppl (February 2017) 2-2.",
    "35. Kei Muro*, Hyun Cheol Chung, Veena Shankaran et al. Pembrolizumab for patients with PD-L1-positive advanced gastric cancer (KEYNOTE-012): a multicentre, open-label, phase 1b trial. The Lancet Oncology , Volume 17 , Issue 6 , 717 – 726",
    "Stein A, Goekkurt E, Al-Batran SE et al. Perioperative pembrolizumab, trastuzumab and FLOT in HER2-positive localized esophagogastric adenocarcinoma: a phase 2 trial. Nat Med. 2025 Dec;31(12):4197-4204.",
    "Kato K, Machida R, Ito Y, Daiko H, Ozawa S, Ogata T, Hara H, Kojima T, Abe T, Bamba T, Watanabe M, Kawakubo H, Shibuya Y, Tsubosa Y, Takegawa N, Kajiwara T, Baba H, Ueno M, Takeuchi H, Nakamura K, Kitagawa Y; JCOG1109 investigators. Doublet chemotherapy, triplet chemotherapy, or doublet chemotherapy combined with radiotherapy as neoadjuvant treatment for locally advanced oesophageal cancer (JCOG1109 NExT): a randomised, controlled, open-label, phase 3 trial. Lancet. 2024 Jul 6;404(10447):55-66. doi: 10.1016/S0140-6736(24)00745-1. Epub 2024 Jun 11. PMID: 38876133."
  ];
  // s70–s71 Principles of Radiation Therapy — References（投影片編號：1–12, 12, 13, 14–29；「12」重複出現）
  const REFS_RADIO = [
    [1,"NCCN Practice Guidelines in Oncology, Esophageal Cancer, v.1. 2014."],
    [2,"Van Hagen P, Hulshof MC, van Lanschot jj, et al. Preoperative chemoradiotherapy for esophageal or junctional cancer.N Engl J Med 2012; 366: 2074-2084."],
    [3,"Czito BG, Denittis AS, Willett CG. Esophageal Cancer. In: Halperin EC, Perez CA, Brady LW, editors. Principles and Practice of Radiation Oncology. 5th (6th) ed. Philadelphia: Lippincott Williams & Wilkins; 2007 (2013). p. 1131-1153. ()"],
    [4,"Enzinger PC, Mayer RJ. Esophageal Cancer. N Engl J Med 2003;349:2241-2252."],
    [5,"Tepper J, Krasna MJ, Niedzwiecki D, et al. Phase III trial of trimodality therapy with cisplatin, fluorouracil, radiotherapy, and surgery compared with surgery alone for esophageal cancer: CALGB 9781. J Clin Oncol 2008;26:1086-1092."],
    [6,"Herskovic A, Martz K, Al-Sarraf M, et al. Combined chemotherapy and radiotherapy compared with radiotherapy alone in patients with cancer of the esophagus. N Engl J Med 1992;326:1593-1598."],
    [7,"Al-Sarraf M, Martz K, Herskovic A, et al. Progress report of combined chemoradiotherapy versus radiotherapy alone in patients with esophageal cancer: an intergroup study. J Clin Oncol 1997;15(1):277-284."],
    [8,"Cooper JS, Guo MD, Herskovic A, et al. Chemoradiotherapy of locally advanced esophageal cancer. Long-term follow-up of a prospective randomized trial (RTOG 85-01). JAMA 1999;281:1623-1627."],
    [9,"Minsky BD, Pajak T, Ginsberg RJ, et al. INT 0123 (RTOG 94-05) phase III trial of combined modality therapy for esophageal cancer: high dose (64.8 Gy) vs. standard dose (50.4 Gy) radiation therapy. J Clin Oncol 2002;20:1167-1174."],
    [10,"Kleinberg L, Forastiere AA. Chemoradiation in the management of esophageal cancer. J Clin Oncol 2007;25:4110-4117."],
    [11,"Walsh TN, Noonan N, Hollywood D, et al. A comparison of multimodal therapy and surgery for esophageal adenocarcinoma. N Engl J Med 1997;335:462-467."],
    [12,"Basset JF, Gignoux M, Triboulet JP, et al. Chemoradiotherapy followed by surgery compared with surgery alone in squamous cell cancer of the esophagus. N Engl J Med 1997;337:161-167."],
    [12,"Stahl M, Stuschke M, Lehmann N, et al. Chemoradiation with and without surgery in patients with locally advanced squamous cell carcinoma of the esophagus. J Clin Oncol 2005;23:2310-2317.","b"],
    [13,"Urba SG, Orringer MB, Turrisi A, et al. Randomized trial of preoperative chemoradiation versus surgery alone in patients with locoregional esophageal carcinoma. J Clin Oncol 2001;19:305-313."],
    [14,"Macdonald JS, Smalley SR, Benedetti J, et al. Chemoradiotherapy after surgery compared with surgery alone for adenocarcinoma of the stomach or gastroesophageal junction. N Engl J Med 2001;345:725-730."],
    [15,"MRC Oesophageal Cancer Working Party. Surgical resection with or without preoperative chemotherapy in oesophageal cancer: A randomized controlled trial. Lancet 2002;359:1727-1733."],
    [16,"Kelsen DP, Ginsberg R, Pajak TF, et al. Chemotherapy followed by surgery compared with surgery alone for localized esophageal cancer. N Engl J Med 1998;339:1979-1984."],
    [17,"Ajani JA, Winter K, Komaki R, et al. Phase II randomized trial of two nonoperative regimens of induction chemotherapy followed by chemoradiation in patients with localized carcinoma of the esophagus: RTOG 0113. J Clin Oncol 2008;26:4551-4556."],
    [18,"Berger B, Belka C. Evidence-based radiation oncology: oesophagus. Radiother Oncol 2009;92:276-290."],
    [19,"Dieleman EM, Senan S, Vincent A, et al. Four-dimensional computed tomographic analysis of esophageal mobility during normal respiration. Int J Radiat Oncol Biol Phys 2007;67:775-780."],
    [20,"Gao XS, Qiao X, Wu F, et al. Pathological analysis of clinical target volume margin for radiotherapy in patients with esophageal and gastroesophageal junction carcinoma. Int J Radiat Oncol Biol Phys 2007;67:389-396."],
    [21,"Huang W, Li B, Gong H, et al. Pattern of lymph node metastases and its implication in radiotherapeutic clinical target volume in patients with thoracic esophageal squamous cell carcinoma: A report of 1077 cases. Radiother Oncol 2010;95:229-233."],
    [22,"Patel AA, Wolfgang JA, Niemierko A, et al. Implications of respiratory motion as measured by four-dimensional computed tomography for radiation treatment planning of esophageal cancer. Int J Radiat Oncol Biol Phys 2009;74:290-296."],
    [23,"Qiao XY, Wang W, Zhou ZG, et al. Comparison of efficacy of regional and extensive clinical target volumes in postoperative radiotherapy for esophageal squamous cell carcinoma. Int J Radiat Oncol Biol Phys 2008;70:396-402."],
    [24,"Bedenne L, Michel P, Bouche O, et al. Chemoradiation followed by surgery compared with chemoradiation alone in squamous cancer of the esophagus: FFCD 9102. J Clin Oncol 2007;25:1160-1168."],
    [25,"Ruhstaller T, Pless M, Dietrich D, et al. Cetuximab in combination with chemoradiotherapy before surgery in patients with resectable, locally advanced esophageal carcinoma: a prospective, multicenter phase IB/II trial (SAKK 75/06) . J Clin Oncol 2011;29:626-631."],
    [26,"Sjoquist KM, Burmeister BH, Smithers BM, et al. Survival after neoadjuvant chemotherapy or chemoradiotherapy for resectable oesophageal carcinoma: an updated meta-analysis. Lancet Oncol 2011;12:681-692."],
    [27,"Welsh J, Settle SH, Amini A, et al. Failure patterns in patients with esophageal cancer treated with definitive chemoradiation. Cancer. 2012;118:2632-40."],
    [28,"Dawei Chen, Hari Menon, Vivek Verma, et al. Results of a Phase 1/2 Trial of Chemoradiotherapy With Simultaneous Integrated Boost of Radiotherapy Dose in Unresectable Locally Advanced Esophageal Cancer. JAMA Oncol. 2019 Nov 1;5(11):1597-1604."],
    [29,"Tetsuro Isozaki, Hitoshi Ishikawa, Shigeo Yasuda, et al. Phase I/II Trial of De fi nitive Carbon Ion Radiotherapy for Clinical T1bN0M0 Esophageal Squamous Cell Carcinoma. Int J Radiat Oncol Biol Phys. 2023 Oct 1;117(2):416-421."]
  ];

  function refList(prefix, list) {
    return '<ol>' + list.map(function (r, i) {
      const n = Array.isArray(r) ? r[0] : i + 1;
      const t = Array.isArray(r) ? r[1] : r;
      const id = 'REFERENCES-' + prefix + n + (Array.isArray(r) && r[2] ? r[2] : '');
      return '<li value="' + n + '" id="' + id + '">' + esc(t) + '</li>';
    }).join('\n') + '</ol>';
  }

  /* ------------------------------------------------------------------ *
   * 3. 面板內容
   * ------------------------------------------------------------------ */
  Object.assign(ECG.REF_DATA, {

    /* ---------------- CHEMO (s42–57) ---------------- */
    CHEMO: {
      title: '化學治療原則 (Principles of Chemotherapy)',
      source: [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
      content: `
<p class="ref-note">依投影片 s42–57。${PREF} 只標示投影片寫明 "Prefer regimen" / "Preferred" 的項目。各段「投影片原文」為完整劑量與給藥方式，上標數字為 <a href="#/ref/REFERENCES/chemo">化學治療參考文獻</a> 編號（照投影片）。放射治療劑量見 <a href="#/ref/RADIO">放射治療</a>。</p>
<details>
<summary>Principle of Chemotherapy — 一般原則 (s42)</summary>
${ul([
  'For localized esophageal carcinoma, the listed regimens mainly in the context of phase II trials.',
  'For metastatic esophageal carcinoma, phase III trials have not been performed for many years. Some regimens listed below are derived from the gastric adenocarcinoma phase III trials that have included patients with lower esophageal cancer and/or gastroesophageal junction cancer.',
  'Please refer to the original reports for toxicity, doses, schedule, and dose modifications.',
  'Prior to recommending chemotherapy, the requirements for adequacy of organ function and performance status should be met.',
  'The schedule, toxicity, and potential benefits should be thoroughly discussed with the patient and caregivers.',
  'Patients should be observed closely and treated for any complications during chemotherapy. Appropriate blood work should be monitored.',
  'Upon completion of chemotherapy, patients should be assessed for response and monitored for any long-term complications.'
])}
</details>

<h4 class="ref-h4" id="CHEMO-neoadj_ccrt">Neo/Adjuvant CCRT Regimens — SCC</h4>
<p><strong>Preferred Regimens:</strong></p>
<ul>
<li><strong>5-FU + Cisplatin + RT</strong> (Regimen 1: 4-day PFL, Q3-4W) ${PREF}
<br/><small>CDDP 80mg/m&sup2; D1 + 5-FU 400mg/m&sup2;/d CI D1-4 + LV 90mg/m&sup2;/d CI D1-4</small></li>
<li><strong>Paclitaxel + Carboplatin + RT</strong> (Regimen 2: QW) ${PREF}
<br/><small>Paclitaxel 50mg/m&sup2; + Carboplatin AUC 2</small></li>
</ul>
<p><strong>Other Regimens:</strong></p>
<ul>
<li>Regimen 3: CFHx (Hydroxyurea + CDDP 20mg/m&sup2; + 5-FU 600mg/m&sup2; CI, Q3W)</li>
<li>Regimen 4: Weekly Cisplatin (35-40mg/m&sup2;, QW x5)</li>
<li>Regimen 5: 4-day FL (5-FU + LV, Q3-4W)</li>
<li><strong>Regimen 6: DCF (Q3W)</strong> — Docetaxel 60mg/m&sup2; + CDDP 60mg/m&sup2; D1 + 5-FU 600mg/m&sup2; CI D1-5
<br/><small>JCOG1109: DCF neoadjuvant 優於 CF (OS), 有優於 CRT 趨勢</small></li>
</ul>
<details>
<summary>投影片原文：Recommended regimens of neoadjuvant / adjuvant chemoradiotherapy (s43)</summary>
<p>Prefer regimen: Cisplatin plus fluoropyrimidine</p>
${ul(['5-FU + Cisplatin + RT*', 'Paclitaxel + Carboplatin + RT'])}
${reg('Regimen 1' + sup(1) + ': 4-day PFL (Q3-4W) of Week 1, 4', PFL_96H)}
${reg('Regimen 2' + sup(2) + ': Paclitaxel and Carboplatin (QW)', PACLI_CARBO)}
${reg('Regimen 3: CFHx (Q3W) x 2 cycles', ['Hydroxyurea 500 mg po stat and bid x 11 doses', 'Cisplatin 20mg/m2 infusion for 4 hours', '5-FU 600 mg/m2 per 24 hours as a 96-hour continuous infusion'])}
${reg('Regimen 4: Weekly Cisplatin (QW) x 5 cycles', ['Cisplatin 35-40mg/m2 infusion for 1 hours'])}
${reg('Regimen 5: 4-day FL (Q3-4W) of Week 1, 5, 8, 11', FL_96H)}
${RT_NOTE}
${reg('Regimen 6' + sup(47) + ': DCF (Q3W)', ['Docetaxel 60mg/m2 IV and Cisplatin 60mg/m2 IV on D1', '5-FU 600 mg/m2 per 24 hours as a 120 hours continuous infusion on Day 1-5'])}
</details>

<h4 class="ref-h4" id="CHEMO-definitive_ccrt">Definitive CCRT Regimens — SCC</h4>
<p><strong>Prefer regimen: Cisplatin plus fluoropyrimidine</strong></p>
<ul>
<li>5-FU + Cisplatin + RT* ${PREF}<br/><small>Regimen 1: 4-day PFL (Q3-4W) of Week 1, 5, 8, 11</small></li>
<li>Paclitaxel + Carboplatin + RT ${PREF}<br/><small>Regimen 2: Paclitaxel and Carboplatin (QW)</small></li>
</ul>
<details>
<summary>投影片原文：Recommended regimens of definitive chemoradiotherapy (s44)</summary>
<p>Prefer regimen: Cisplatin plus fluoropyrimidine</p>
${ul(['5-FU + Cisplatin + RT*', 'Paclitaxel + Carboplatin + RT'])}
${reg('Regimen 1' + sup(1) + ': 4-day PFL (Q3-4W) of Week 1, 5, 8, 11', PFL_96H)}
${reg('Regimen 2' + sup(2) + ': Paclitaxel and Carboplatin (QW)', PACLI_CARBO)}
${RT_NOTE}
</details>

<h4 class="ref-h4" id="CHEMO-adjuvant">Adjuvant Therapy — SCC</h4>
<p><strong>Adjuvant Immunotherapy</strong></p>
<ul>
<li><strong>Nivolumab:</strong> 240mg Q2W x 16wks, then 480mg Q4W for 1yr ${PREF}
<br/><small>CheckMate 577: DFS benefit (NEJM 2021;384:1191)</small></li>
</ul>
<p>其他 adjuvant chemotherapy regimens（s45）：</p>
<ul>
<li>Regimen 1: 4-day PFL (Q3-4W) of Week 1, 5, 8, 11</li>
<li>Regimen 2: 4-day FL (Q3-4W) of Week 1, 5, 8, 11</li>
</ul>
<details>
<summary>投影片原文：Recommended regimens of adjuvant chemotherapy (s45)</summary>
<p>Prefer regimen: Immune therapy</p>
${reg('Regimen 1' + sup(1) + ': 4-day PFL (Q3-4W) of Week 1, 5, 8, 11', PFL_96H)}
${reg('Regimen 2: 4-day FL (Q3-4W) of Week 1, 5, 8, 11', FL_96H)}
${reg('Regimen 3: Nivolumab', ['Nivolumab 240 mg every 2 weeks for 16 weeks, followed by nivolumab at a dose of 480 mg every 4 weeks for 1 year. (reference: N Engl J Med 2021; 384:1191-1203)'])}
</details>

<h4 class="ref-h4" id="CHEMO-palliative">Palliative Chemotherapy — SCC</h4>
<p><strong>Preferred (含 ICI):</strong></p>
<ul>
<li><strong>Regimen 6: Pembrolizumab + PFL</strong> (Q3W) ${PREF}
<br/><small>Pembrolizumab 200mg + CDDP 80mg/m&sup2; D1 + 5-FU 800mg/m&sup2;/d CI D1-5 (KEYNOTE-590)</small></li>
<li><strong>Regimen 7: Nivolumab + PFL</strong> (Q4W) ${PREF}
<br/><small>Nivolumab 240mg Q2W + CDDP 80mg/m&sup2; D1 + 5-FU 800mg/m&sup2;/d CI D1-5 (CheckMate-648)</small></li>
<li><strong>Regimen 8: Nivolumab + Ipilimumab</strong>
<br/><small>Nivo 3mg/kg Q2W + Ipi 1mg/kg Q6W (CheckMate-648)</small></li>
</ul>
<p class="ref-note">投影片 s46：Prefer regimen: Cisplatin plus fluoropyrimidine or paclitaxel plus immune therapy (Regimen 6 or 7)。</p>
<p><strong>Other Regimens:</strong></p>
<ul>
<li><strong>Regimen 1: PFL</strong> (Q3-4W)
<br/><small>CDDP 80mg/m&sup2; D1 + 5-FU 400mg/m&sup2;/d CI D1-4 + LV 90mg/m&sup2;/d CI D1-4</small></li>
<li><strong>Regimen 2: FL</strong> (Q3-4W)
<br/><small>5-FU 400mg/m&sup2;/d CI D1-4 + LV 90mg/m&sup2;/d CI D1-4</small></li>
<li><strong>Regimen 3: TPF</strong> (Q3-4W)
<br/><small>Docetaxel 60mg/m&sup2; + CDDP 75mg/m&sup2; + 5-FU 850mg/m&sup2; CI 96h</small></li>
<li><strong>Regimen 4: Cisplatin + DeGramont</strong> (Q2W)
<br/><small>CDDP 50mg/m&sup2; + LV 200mg/m&sup2; x2d + 5-FU 400mg/m&sup2; x2d + 5-FU 600mg/m&sup2; CI 48h</small></li>
<li><strong>Regimen 5: Cisplatin + Etoposide</strong> (Neuroendocrine carcinoma)
<br/><small>CDDP 75mg/m&sup2; + Etoposide 75mg/m&sup2; x2d</small></li>
</ul>
<details>
<summary>投影片原文：Recommended regimens of palliative chemotherapy (s46–47)</summary>
<p>Prefer regimen: Cisplatin plus fluoropyrimidine or paclitaxel plus immune therapy (Regimen 6 or 7)</p>
${reg('Regimen 1' + sup(1) + ': 4-day PFL (Q3-4W) of Week 1, 5, 8, 11', PFL_96H)}
${reg('Regimen 2: 4-day FL (Q3-4W) of Week 1, 5, 8, 11', FL_96H)}
${reg('Regimen 3:TPF (Q3-4W)', ['Docetaxel 60 mg/m2 infusion for 3 hours', 'Cisplatin 75 mg/m2 infusion for 3 hours', '5-FU: 850 mg/m2 per 24 hours as a 96-hour continuous infusion'])}
${reg('Regimen 4: Cisplatin + DeGramount (Q2W)', ['Cisplatin 50 mg/m2 infusion for 1 hour', 'Leucovorin 200 mg/m2 infusion for 2 hours per day for 2 days', '5-FU 400 mg/m2 infusion for 30 minutes per day for 2 days', '5-FU 600 mg/m2 per 24 hours as a 48-hour continuous infusion'])}
${reg('Regimen 5:Cisplatin and Etoposide (for Neuroendocrine carcinoma)', ['Cisplatin 75 mg/m2 infusion for 3 hours', 'Etoposide 75 mg/m2 infusion for 2 hours per day for 2 days'])}
<p>Prefer regimen: Cisplatin plus fluoropyrimidine or paclitaxel plus immune therapy</p>
${reg('Regimen 6: pembrolizumab PFL (Q3W)', ['Pembrolizumab 200mg Q3W', 'Cisplatin (CDDP) 80 mg/m2 infusion for 3 hours on Day 1', '5-FU 800mg/m2/day per 24 hours as a 96 hours continuous infusion on Day 1-5', '(ref: Lancet 2021;398:759-771)'])}
${reg('Regimen 7: Nivolumab PFL (Q4W)', ['Nivolumab 240mg Q2W', 'Cisplatin (CDDP) 80 mg/m2 infusion for 3 hours on Day 1', '5-FU 800mg/m2/day per 24 hours as a 96 hours continuous infusion on Day 1-5', '(ref: N Engl J Med 2022; 386:449-462)'])}
${reg('Regimen 8: Nivolumab + Ipilimumab (Q3W)', ['Nivolumab 3mg/kg Q2W', 'Ipilimumab 1mg/kg Q6W', '(ref: N Engl J Med 2022; 386:449-462)'])}
</details>

<h4 class="ref-h4" id="CHEMO-periop">Peri-operative Chemotherapy (Adenocarcinoma)</h4>
<ul>
<li><strong>FLOT4:</strong> Docetaxel 50mg/m&sup2; + Oxaliplatin 85mg/m&sup2; + LV 200mg/m&sup2; + 5-FU 2600mg/m&sup2; 24hr CI, Q2W</li>
<li>FLOT4 + Durvalumab 1500mg Q4W (MATTERHORN, Phase III)</li>
<li>FLOT4 + Atezolizumab 1200mg Q2W (AIO-DANTE, Phase II)</li>
<li>FLOT4 + Trastuzumab (8mg→6mg/kg Q3W) + Pembrolizumab 200mg Q3W</li>
</ul>
<details>
<summary>投影片原文：Recommended neoadjuvant regimen of EGJ Adenocarcinoma (s48)</summary>
<p>Recommended regimens of peri-operative chemotherapy</p>
${reg('FLOT4' + sup(16), ['Docetaxel 50 mg/m2, oxaliplatin 85 mg/m², leucovorin 200 mg/m², and 5-FU 2600 mg/m² as 24-hour infusion, all d1, every 14 days'])}
${reg('FLOT4 + Durvalumab（MATTERHORN – Multicenter Phase III – Global study）', ['Durvaluamb 1500mg Q4W'])}
${reg('FLOT4 + Atezolizumab（AIO-DANTE – Multicenter Phase II – Germany study）', ['Atezolizumab 1200mg q2w'])}
${reg('FLOT4 + Trastuzumab + Pembrolizumab ' + sup(46), ['Trastuzumab (8mg loading dose, 6mg/kg maintenance dose), Q3W, and pembrolizumab 200mg Q3W'])}
</details>
<details>
<summary>試驗設計：MATTERHORN (s49)、AIO-DANTE (s50)</summary>
<p><strong>MATTERHORN</strong> — Matterhorn – Multicenter Phase III - Global（Janjigian Y, et al. ESMO 2023; LBA 73）</p>
${ul([
  'Study population: Gastric and GEJ adenocarcinoma; Stage II, III and IVA (&gt;T2 N0-3 M0 or T0-4 N+ M0); No evidence of metastasis; No prior therapy; ECOG PS 0 or 1',
  'Randomised (1:1) N=948：Durvalumab plus FLOT vs Placebo plus FLOT → Surgery → Durvalumab/Placebo plus FLOT → Durvalumab/Placebo (Post-operative 1-year duration)',
  'Durvalumab 1500 mg or placebo Q4W (Day 1) plus FLOT Q2W (Days 1 and 15) for 4 cycles (2 doses of durvalumab or placebo plus 4 doses of FLOT pre- and post-operative) followed by durvalumab or placebo Q4W (Day 1) for 10 further cycles',
  'Primary objective: EFS；Key secondary endpoints: Central review of pCR by modified Ryan criteria, Overall survival'
])}
<p><strong>PERIOPERATIVE IMMUNE-CHEMOTHERAPY - DANTE</strong> — AIO-DANTE – Multicenter Phase II - Germany（Lorenzen S, et al. J Clin Oncol. 2024 Feb 1;42(4):410-420）</p>
${ul([
  'Inclusion: Histologically confirmed adenocarcinoma of the stomach or GEJ; ECOG PS 0-1; No distant metastases; operable',
  'Arm A: FLOT d1 q2w + Atezolizumab d1 q2w 4 cycles → Surgery → FLOT d1 q2w + Atezolizumab d1 q2w 4 cycles → Atezolizumab d1 q3w 8 cycles',
  'Arm B: FLOT d1 q2w; 4 cycles → Surgery → FLOT d1 q2w; 4 cycles',
  'Surgical mortality, No. (%)：30-day mortality 4 (3) vs 2 (1)；60-day mortality 4 (3) vs 3 (2)（Arm A vs Arm B）'
])}
</details>

<h4 class="ref-h4" id="CHEMO-egj_adjuvant">EGJ Adenocarcinoma — Adjuvant</h4>
<ul>
<li>TS-1 80mg/m&sup2;/day, 4wk on/2wk off, 1 year</li>
<li>XELOX: Oxaliplatin 135mg/m&sup2; D1 + Capecitabine 1000mg/m&sup2; BID D1-14, Q3W x 6mo</li>
<li>High dose PFL: CDDP 30mg/m&sup2; + LV 500mg/m&sup2; + 5-FU 2200mg/m&sup2; CIVD 22h, weekly x 6mo</li>
<li>TS-1 + Docetaxel 40mg/m&sup2;</li>
<li>SOX: S1 40mg/m&sup2; BID D1-14 + Oxaliplatin 130mg/m&sup2; Q3W x 8 cycles</li>
<li>CT → CCRT → CT (XP/XRT/XP or SOX/SRT/SOX)</li>
<li>Nivolumab adjuvant after preop CCRT: 240mg Q2W → 480mg Q4W</li>
</ul>
<details>
<summary>投影片原文：Recommended adjuvant regimen of EGJ Adenocarcinoma (s51–52)</summary>
<p><strong>Recommended regimens of adjuvant chemotherapy</strong></p>
${reg('TS-1' + sup(17), ['TS-1 80mg/m2 per day for 4 weeks every 6 weeks for 1 year'])}
${reg('XELOX' + sup(18), ['Oxaliplatin 135mg/m2 on D1, Capecitabine 1000mg/m2 BID for 14 days every 3 weeks for 6 months or', 'Oxaliplatin 85mg/m2 on D1, Capecitabine 1000mg/m2 BID for 10 days every 2 weeks for 6 months'])}
${reg('High dose PFL' + sup(19), ['Cisplatin 30mg/m2 IV, folinic acid 500 mg/m2 IV, 5-fluorouracil (5-FU 2200 mg/m2 CIVD for 22 h, weekly for 6 months'])}
${reg('TS-1 + Docetaxel' + sup(20), ['S-1 80-120mg/body for 14 days every 3 weeks, followed by 6 cycles of S-1 combined with docetaxel 40mg/m2 on day 1 of each cycle, and then 4 further cycles of S-1 at 80-120mg/body on days 1-28 every 42 days'])}
${reg('SOX' + sup(21), ['S1 40 mg/m2 twice daily on days 1-14 and oxaliplatin 130 mg/m2 every 3 weeks for 8 cycles'])}
<p><strong>Recommended regimens of adjuvant chemotherapy and concurrent chemoradiotherapy</strong></p>
${reg('CT followed by CCRT (XP/XRT/XP)' + sup(22) + ' (SOX/SRT/SOX)' + sup(21), [
  'XP (capecitabine 2,000 mg/m2 per day) on days 1 to 14 and cisplatin 60 mg/m2 on day 1, repeated every 3 weeks',
  'The XP/XRT/XP arm receives two cycles of XP followed by 45-Gy XRT (capecitabine 1,650 mg/m2 per day for 5 weeks) and two cycles of XP.',
  'SOX ( S1 40 mg/m² twice daily on days 1-14 and oxaliplatin 130 mg/m² every 3 weeks), SRT (S1 40mg/m² +45Gy for 5 weeks RT)',
  'SOX x 2 cycles, followed by SRT and followed by 4 cycles SOX' + sup(21)
])}
<p><strong>Recommended regimens of adjuvant therapy after preoperative CCRT</strong></p>
${ul(['Nivolumab 240mg Q2W x16 weeks, then 480mg Q4W'])}
</details>

<h4 class="ref-h4" id="CHEMO-egj_metastatic">EGJ Adenocarcinoma — Recurrent / Metastatic</h4>
<p><strong>Palliative Chemotherapy — EAC/EGJ 1st Line</strong></p>
<p><strong>Preferred (PD-L1 CPS &ge; 5):</strong></p>
<ul>
<li>Nivolumab 360mg + XELOX Q3W <small>(ATTRACTION-4)</small> ${PREF}</li>
<li>Nivolumab 240mg + FOLFOX Q2W <small>(CheckMate-649)</small> ${PREF}</li>
<li>Fluoropyrimidine/LV + Platinum + ICI
<br/><small>Pembrolizumab + PFL (KEYNOTE-590) / Nivolumab + PFL (CheckMate-648)</small></li>
<li>Nivolumab + Ipilimumab (Nivo 3mg/kg Q2W + Ipi 1mg/kg Q6W)</li>
</ul>
<p class="ref-note">投影片 s53 的 Preferred regimens (PD-L1 CPS ≥ 5) 只列 Nivolumab + XELOX (ATTRACTION-4) 與 Nivolumab + FOLFOX (CHECKMATE-649)；KEYNOTE-590 / CheckMate-648 與 Nivolumab + Ipilimumab 見 <a href="#/ref/CHEMO/palliative">SCC 緩和治療</a>（s47）。</p>
<p><strong>If PD-L1 CPS 1-5:</strong></p>
<ul>
<li>Pembrolizumab + FP-based chemo <small>(KEYNOTE-859)</small></li>
</ul>
<p><strong>Preferred (non-ICI):</strong></p>
<ul>
<li><strong>High-dose PFL:</strong> CDDP 30mg/m&sup2; + LV 500mg/m&sup2; + 5-FU 2200mg/m&sup2; CI 22h, weekly ${PREF}</li>
<li><strong>XELOX:</strong> Oxaliplatin 135mg/m&sup2; D1 + Capecitabine 1000mg/m&sup2; BID D1-14, Q3W ${PREF}</li>
</ul>
<p><strong>HER2(+):</strong></p>
<ul>
<li>Trastuzumab + standard chemo &plusmn; Pembrolizumab <small>(ToGA / KEYNOTE-811)</small> ${PREF}</li>
</ul>
<p><strong>Alternative Regimens:</strong></p>
<ul>
<li><strong>DCF:</strong> Docetaxel 75mg/m&sup2; + CDDP 75mg/m&sup2; D1 + 5-FU 750mg/m&sup2; CI D1-5, Q3W</li>
<li><strong>Modified TCF:</strong> Paclitaxel 100mg/m&sup2; + CDDP 30mg/m&sup2; D1,8 + UFT 300mg/m&sup2; + LV 90mg/d D1-14, Q3W</li>
<li><strong>Irinotecan-based:</strong> Irinotecan 80mg/m&sup2; + LV 500mg/m&sup2; + 5-FU 2000mg/m&sup2; CI 22h, weekly</li>
<li><strong>FOLFIRI:</strong> Irinotecan 180mg/m&sup2; + LV 400mg/m&sup2; + 5-FU 400mg/m&sup2; bolus + 2400mg/m&sup2; CI, Q2W</li>
</ul>
<p><strong>EGJ Adenocarcinoma — 2nd/3rd Line</strong></p>
<p><strong>2nd Line:</strong></p>
<ul>
<li>Ramucirumab 8mg/kg Q2W &plusmn; Paclitaxel</li>
<li>Docetaxel 75-100mg/m&sup2; Q3W</li>
<li>Paclitaxel 80mg/m&sup2; QW</li>
<li>Irinotecan 150-180mg/m&sup2; Q2W</li>
<li>Immunotherapy (MSI-H/dMMR or CPS&gt;10): Nivolumab / Pembrolizumab</li>
<li>Entrectinib / Larotrectinib (NTRK fusion+)</li>
<li>Fam-trastuzumab deruxtecan 6.4mg/kg Q3W (HER2+)</li>
</ul>
<p><strong>3rd Line:</strong></p>
<ul>
<li>Nivolumab 3mg/kg Q2W / Pembrolizumab (CPS&gt;1)</li>
<li>Lonsurf (TAS-102): 35mg/m&sup2; BID D1-5 &amp; D8-12, Q4W</li>
</ul>
<details>
<summary>投影片原文：First line therapy / targeted / alternative (s53–54)</summary>
<p>Recommended regimens of recurrent or metastatic gastric cancer — First line therapy</p>
<p><strong>Preferred regimens:</strong></p>
<p><strong>(PD-L1 CPS ≥ 5) Fluorouracil/leucovorin plus platinum based C/T and immune checkpoint inhibitor</strong></p>
${ul(['Nivolumab 360mg + XELOX Q3W (ATTRACTION-4)' + sup(23), 'Nivolumab 240mg + FOLFOX Q2W (CHECKMATE-649)' + sup(24)])}
<p><strong>Fluorouracil/leucovorin plus platinum based C/T and checkpoint inhibitor (Pembrolizumab) Q3W (KEYNOTE-859)${sup(43)} (if PD-L1 1&lt;CPS &lt; 5)</strong></p>
${reg('High dose PFL' + sup(25) + ' (cisplatin/fluorouracil/leucovorin, prefer regimen)', ['Cisplatin 30mg/m2 IV, folinic acid 500 mg/m2 IV, 5-fluorouracil (5-FU) 2200 mg/m2 CIVD for 22 h, weekly'])}
${reg('Xelox (capecitabine/oxaliplatin, prefer regimen) ' + sup('26,27,28'), ['Oxaliplatin 135mg/m2 on D1, Capecitabine 1000mg/m2 BID for 14 days every 3 weeks or Oxaliplatin 85mg/m2 on D1, Capecitabine 1000mg/m2 BID for 10 days every 2 weeks'])}
<p><strong>Preferred targeted therapy</strong></p>
${ul(['Trastuzumab + standard chemotherapy in HER-2 (+)' + sup(29), 'Trastuzumab+ Pembrolizumab+ standard chemotherapy in HER-2 (+)' + sup(30)])}
<p><strong>Alternative regimens</strong></p>
${reg('Taxane based — DCF regimen' + sup(31), ['Docetaxel 75mg/m² IV and Cisplatin 75mg/m² IV on D1', '5-FU 750mg/m2 CIVD on D1-5, every 3 weeks'])}
${reg('Taxane based — Modified TCF' + sup(32), ['Paclitaxel 100 mg/m² and Cisplatin 30 mg/m² IV on D1 and 8', 'UFT 300 mg/m² plus LV 90 mg per day on D1-14, every 3 weeks'])}
${reg('Irinotecan based' + sup(33), ['Irinotecan 80 mg/m² IV, folinic acid 500 mg/m² IV, 5-fluorouracil (5-FU) 2000 mg/m² CIVD for 22 h, for 6 weeks every 7 weeks'])}
${reg('FOLFIRI' + sup(34), ['Irinotecan 180 mg/m² IV on D1, folinic acid 400 mg/m² IV on D1,', '5-fluorouracil 400mg/m² IV bolus then 5-fluorouracil 2400mg/m² IV every 2 weeks.'])}
</details>
<details>
<summary>投影片原文：Second / Third line therapy (s55–57)</summary>
<p><strong>Second line therapy</strong></p>
${reg('Ramucirumab' + sup(35), ['Ramucirumab 8 mg/kg IV on Day 1', 'Cycled every 14 days'])}
${reg('Ramucirumab + paclitaxel' + sup(36), ['Ramucirumab 8 mg/kg IV on Days 1 and 15', 'Paclitaxel 80 mg/m2 on Days 1, 8, and 15', 'Cycled every 28 days'])}
${reg('Docetaxel' + sup(37), ['Docetaxel 75–100 mg/m2 IV on Day 1', 'Cycled every 21 days'])}
${reg('Paclitaxel' + sup(38), ['Paclitaxel 135–250 mg/m2 IV on Day 1 Cycled every 21 days', 'Paclitaxel 80 mg/m2 IV on Day 1 weekly Cycled every 28 days', 'Paclitaxel 80 mg/m2 IV on Days 1, 8, and 15 Cycled every 28 days'])}
${reg('Irinotecan' + sup(39), ['Irinotecan 250–350 mg/m2 IV on Day 1 Cycled every 21 days', 'Irinotecan 150–180 mg/m2 IV on Day 1 Cycled every 14 days', 'Irinotecan 125 mg/m2 IV on Days 1 and 8 Cycled every 21 days'])}
${reg('Immunotherapy (Anti-PD1/Anti-PDL1 therapy, only MSI-H/DMMR or CPS&gt;10)' + sup(40), ['Nivolumab 3 mg/kg IV on D1' + sup(34) + ' Cycle every 14 days', 'Pembrolizumab 2 mg/kg on D1 in Patients with PD-L1 positive' + sup(35) + ' Cycle every 21 days'])}
${reg('Entrectinib or larotrectinib for NTRK gene fusion-positive tumors ' + sup('41,42'))}
${reg('Fam-trastuzumab deruxtecan-nxki for HER2 overexpression positive adenocarcinoma' + sup(47), ['6.4 mg/kg IV on Day 1', 'cycled every 21 day'])}
<p><strong>Third line therapy</strong></p>
${reg('Immunotherapy (Anti-PD1/Anti-PDL1 therapy)', ['Nivolumab 3 mg/kg IV on D1' + sup(44) + ' Cycle every 14 days', 'Pembrolizumab 2 mg/kg on D1 in Patients with PD-L1 positive (CPS&gt;1) ' + sup(45) + ' Cycle every 21 days'])}
${reg('Lonsurf (TAS102; Trifluridine and tipiracil)' + sup(39), ['Lonsurf (35 mg/m² twice daily on days 1-5 and days 8-12 every 28 days)'])}
</details>
`
    },

    /* ---------------- RADIO (s62–68) ---------------- */
    RADIO: {
      title: '放射治療原則 (Principles of Radiotherapy)',
      source: [62, 63, 64, 65, 66, 67, 68, 70, 71],
      content: `
<p class="ref-note">依投影片 s62–68（Principles of Radiotherapy，2024.07.21修訂）。上標數字為 <a href="#/ref/REFERENCES/radio">放射治療參考文獻</a> 編號。化療 regimen 見 <a href="#/ref/CHEMO">化學治療</a>。</p>

<h4 class="ref-h4" id="RADIO-general">General Radiation Information / Radiation Dose</h4>
<ul>
<li><strong>Preoperative CCRT:</strong> 41.4-50.4 Gy (1.8-2Gy/fx). Surgery at 6-8 weeks after CCRT.</li>
<li><strong>Definitive CCRT:</strong> 50.4-60 Gy (1.8-2Gy/fx). Cervical esophagus: up to 59.4-66 Gy.</li>
<li><strong>Postoperative CCRT:</strong> 45-50.4 Gy.</li>
<li><strong>Optional:</strong> 58.8-63 Gy (2.1-2.25 Gy/fx) in 28 fx to GTV; 50.4Gy to subclinical area.</li>
</ul>
<details>
<summary>Simulation &amp; Planning</summary>
<ul>
<li>CT simulation, 3D planning. IMRT for OAR dose reduction.</li>
<li>Avoid heavy meal 3hr before simulation (proximal stomach lesions).</li>
<li>IV contrast when appropriate. Slice thickness &le;5mm.</li>
<li>Immobilization device strongly recommended.</li>
<li>4D CT for motion management; ITV-based CTV/PTV expansion.</li>
<li>Techniques: 3D-CRT, IMRT, VMAT, IGRT.</li>
</ul>
</details>
<details>
<summary>投影片原文：General Radiation Information (s63)</summary>
<p><strong>General Radiation Information</strong></p>
${ul([
  'Treatment recommendations should be made after joint consultation and/or discussion by a multidisciplinary team including surgical, radiation, medical oncologists, radiologists, gastroenterologists, and pathologists.',
  'CT scans, barium swallow, endoscopic ultrasound (EUS), endoscopy reports and PET or PET/CT scans, when available, should be reviewed by the multidisciplinary team. This will allow an informed determination of treatment volume and field borders prior to simulation.'
])}
<p><strong>Simulation and Treatment Planning</strong></p>
${ul([
  'CT simulation and 3D treatment planning. Intensity-modulated radiation therapy (IMRT) may be used in clinical settings where reduction in dose to organs at risk (e.g. heart, lungs) is required that cannot be achieved by 3-D techniques.',
  'The patient should be instructed to avoid intake of a heavy meal 3 hours before simulation and treatment for lesions requiring therapy of the proximal stomach.',
  'When clinically appropriate, use IV contrast for CT simulation to aid in target localization.',
  'The slice thickness of CT simulation should be no more than 5 mm.',
  'Immobilization device is strongly recommended for reproducibility of daily set-up.',
  'When 4D CT planning or other motion management techniques are used, margins may be modified to account for observed motion and may also be reduced if justified. The 4D CT data may also be used to create an internal target volume (ITV) from which subsequent clinical target volume (CTV) and planning target volume (PTV) expansions can be made.'
])}
</details>
<details>
<summary>投影片原文：Radiation dose / technique (s65)</summary>
${ul([
  'Preoperative radiotherapy: 41.4 – 50.4Gy ' + sup('a') + '.',
  'Definitive radiotherapy: 50.4 – 60Gy. A higher dose is suggested for tumors of cervical esophagus ' + sup('b') + '.',
  'Postoperative radiotherapy: 45 – 50.4Gy'
])}
<p><strong>Radiation technique:</strong> 3D-CRT, IMRT or VMAT, IGRT</p>
<p class="ref-note">${sup('a')} Patients who are at risk for not having surgery should receive radiation dose of 50 –50.4Gy.<br>${sup('b')} Published studies have reported radiation dose from 60-66Gy (no randomized evidence).</p>
</details>

<h4 class="ref-h4" id="RADIO-target">Target Volume Delineation</h4>
<ul>
<li><strong>GTV:</strong> Primary tumor + involved regional LN. Wall &gt;5mm or asymmetric.</li>
<li><strong>CTV_H:</strong> GTV of primary + lymphadenopathy.</li>
<li><strong>CTV_M:</strong> 3-4 cm sup/inf expansion; nodal CTV 0.5-1.5 cm expansion.</li>
<li><strong>PTV:</strong> 0.5-1 cm expansion (consider respiratory motion).</li>
</ul>
<p><strong>Elective Nodal Regions by Tumor Location:</strong></p>
<table class="ref-table"><thead><tr><th>Location</th><th>Elective Nodes</th></tr></thead><tbody>
<tr><td>Cervical esophagus</td><td>SCF LN, consider higher cervical nodes (esp. N1+)</td></tr>
<tr><td>Proximal 1/3 thoracic</td><td>Para-esophageal + SCF LN</td></tr>
<tr><td>Middle 1/3</td><td>Para-esophageal LN</td></tr>
<tr><td>Distal 1/3 + GEJ</td><td>Para-esophageal, lesser curvature, splenic, celiac axis</td></tr>
</tbody></table>
<details>
<summary>投影片原文：Principle of Target Volume Delineation (s64–65)</summary>
<p><strong>Gross Target Volume (GTV) delineation</strong></p>
${ul([
  'Target volume delineation based on CT simulation images. Diagnostic CT, barium, endoscopic ultrasound (EUS), endoscopic reports, and PET/CT scans should be reviewed, when available, for precise delineation of GTV',
  'GTV should include the primary tumor and involved regional lymph nodes as identified on the planning scan and other pre-treatment diagnostic studies.',
  'Esophageal wall thickness &gt; 5mm, irregularity or asymmetric should be considered gross tumor'
])}
<p><strong>Clinical Target Volume (CTV) delineation</strong></p>
${ul([
  'The clinical target volume should include the areas at risk for microscopic disease',
  'CTV_H: GTV of primary tumor and lymphadenopathy.',
  'CTV_M: at least 3-4 cm superiorly and inferiorly expansion beyond the GTV; the nodal CTV should be 0.5-1.5 cm expansion from the nodal GTV.',
  'CTV_M should also include coverage of elective nodal regions, depending on the location of the origin of primary tumor.',
  'Recommended elective treatment of nodal regions:'
])}
<table class="ref-table"><tbody>
<tr><td>Cervical esophagus</td><td>SCF lymph nodes, and consider higher echelon cervical nodes especially for N1 or greater</td></tr>
<tr><td>Proximal third of thoracic esophagus</td><td>Para-esophageal and SCF lymph nodes</td></tr>
<tr><td>Middle third of esophagus</td><td>Para-esophageal lymph nodes</td></tr>
<tr><td>Distal third of esophagus and GE junction</td><td>Para-esophageal lymph nodes, lesser curvature, splenic nodes, and celiac axis</td></tr>
</tbody></table>
<p><strong>Planning Target Volume (PTV) and Internal target delineation</strong></p>
${ul([
  'The margins of PTV should consider <em>respiratory motion</em> and <em>setup errors</em>',
  '4DCT may be used to create an ITV',
  'PTV expansion should be 0.5 to 1 cm. The uncertainties arising from respiratory motion should also be taken into consideration.'
])}
</details>

<h4 class="ref-h4" id="RADIO-preop">Preoperative CCRT Candidates</h4>
<ul>
<li>cT2N0 (high risk: LVI+, &ge;3cm, poorly differentiated)</li>
<li>cT1b-cT2, N+</li>
<li>cT3-T4a, Any N</li>
<li>Dose: 41.4-50.4 Gy. Evaluate resectability at 4-5 weeks after CCRT.</li>
<li>Resectable → Surgery at 6-8 weeks. Unresectable → boost to 59.4-66 Gy (optional).</li>
</ul>
<details>
<summary>投影片原文：Preoperative CCRT (s66)</summary>
<p><strong>Candidate for preoperative CCRT</strong></p>
${ul(['cT2N0 (high risk: LVI+, ≥3cm, poorly differentiated)', 'cT1b-cT2, N+', 'cT3-T4a, Any N'])}
<p><strong>Radiation volume</strong></p>
${ul(['The delineation of target volume follows the “<em>Principle of Target Volume Delineation</em>”'])}
<p><strong>Radiation dose:</strong> 41.4 – 50.4Gy at 1.8-2Gy per fraction for primary tumors and regional LN</p>
<p><strong>Evaluation:</strong> the possibility of surgical resection should be evaluated at 4-5 weeks after CCRT</p>
${ul([
  'Resectable: Esophageal resection should be considered for all patients who are physiologically fit with resectable esophageal cancer. Surgery is generally done around 6<sup>th</sup> to 8<sup>th</sup> weeks after preoperative CCRT.',
  'Unresectable: boost to the gross tumor up to 59.4-66Gy in total (optional); systemic therapy; palliative treatment'
])}
</details>

<h4 class="ref-h4" id="RADIO-definitive">Definitive CCRT Candidates</h4>
<ul>
<li>Resectable but medically unfit / refuses surgery</li>
<li>Unresectable disease (T4b, bulky LAP)</li>
<li>Cervical esophageal cancer (&lt;5 cm from cricopharyngeus)</li>
<li>Dose: 50.4-60 Gy. Cervical: up to 59.4-66 Gy.</li>
<li>T4b: consider endoluminal stenting; chemo alone if trachea/great vessel/heart invasion.</li>
</ul>
<details>
<summary>投影片原文：Definitive chemoradiotherapy (s67)</summary>
<p><strong>Candidate for definitive CCRT</strong></p>
<ul>
<li>Resectable disease but medically unfit for surgery, or patients refuse surgery</li>
<li>Unresectable disease:
  <ul>
  <li>T4b: Consider chemotherapy alone in the setting of invasion of trachea, great vessels, vertebral body, or heart</li>
  <li>Most patients with multi-station, bulky lymphadenopathy should be considered unresectable</li>
  <li>Cervical esophageal cancer (tumor &lt; 5 cm from cricopharyngeus)</li>
  </ul>
</li>
</ul>
<p><strong>Radiation volume</strong></p>
${ul(['The delineation of target volume follows the “<em>Principle of Target volume delineation</em>”'])}
<p><strong>Radiation dose:</strong></p>
${ul([
  '50.4-60 Gy at 1.8-2Gy per fraction for all primary esophageal tumors and positive lymphadenopathy.',
  'Higher dose up to 59.4-66 Gy at 1.8-2 Gy per fraction may be appropriate for tumors in cervical esophagus.',
  'Optional dose regimens' + sup(28) + ': 58.8-63 Gy (2.1-2.25 Gy per fraction) in 28 fx to gross tumor and LAP; 50.4Gy in 28 fx to subclinical area.'
])}
<p><strong>[Note]</strong></p>
<ol>
<li>The radiation dose of 50-50.4Gy as applied in the control arm in RTOG 9403 trial represents the “<strong>evidence-based</strong>’ dose recommendation.</li>
<li>Most local failures after definitive chemoradiation for unresectable esophageal cancer occur in the GTV (Welsh <em>et al.</em> Cancer 2012;118:2632-40)</li>
<li>In recent clinical trials design, dose escalation successfully scheduled sum dose &gt; 50Gy without excess morbidity (Bedenne et al. <em>J Clin Oncol</em> 2007;25:1160-1168).</li>
<li>For T4b disease, consider endoluminal stenting when appropriate. Chemotherapy alone may be considered in the setting of invasion of trachea, great vessels, or heart</li>
</ol>
</details>

<h4 class="ref-h4" id="RADIO-postop">Postoperative CCRT Candidates</h4>
<ul>
<li>Positive or close margins (&le;1mm), if not received RT preop</li>
<li>Adenocarcinoma with pN+ or pT3-4a, if not received RT preop</li>
<li>Optional: SCC with T3/T4 + N+, if not received RT preop</li>
<li>Dose: 45-50.4 Gy. Include anastomosis in radiation volume.</li>
</ul>
<details>
<summary>投影片原文：Postoperative chemoradiotherapy (s68)</summary>
<p><strong>Candidate for postoperative CCRT</strong></p>
${ul([
  'Positive or close margins (≤ 1mm) if not received RT preoperatively',
  'Adenocarcinoma with positive lymph nodes or pT3-4a disease if not received RT preoperatively',
  'Optional for squamous cell carcinoma with T3 or T4 and positive lymph nodes if not received RT preoperatively'
])}
<p><strong>Radiation volume</strong></p>
${ul([
  'The delineation of target volume follows the “<em>Principle of Target volume delineation</em>”',
  'The radiation volume is determined based on preoperative image findings',
  'The anastomosis should be included in the radiation volume'
])}
<p><strong>Radiation dose:</strong> 45-50.4Gy at 1.8-2Gy per fraction</p>
</details>
<p class="ref-note">粒子治療（質子、碳離子）見 <a href="#/ref/PARTICLE">粒子治療</a>。</p>
`
    },

    /* ---------------- PARTICLE (s69) ---------------- */
    PARTICLE: {
      title: '粒子治療 (Charged Particle Therapy)',
      source: [69],
      content: `
<h4 class="ref-h4" id="PARTICLE-proton">Proton Therapy (質子治療)</h4>
<ul>
<li>適用於需降低器官風險劑量 (OAR) 而 3D 技術無法達成時</li>
<li>Ideally within a clinical trial or registry study</li>
</ul>
<h4 class="ref-h4" id="PARTICLE-carbon">Carbon Ion Therapy (碳離子治療)</h4>
<p>Definitive carbon ion therapy 可考慮用於：</p>
<ul>
<li>cT1N0M0 esophageal cancer</li>
<li>ECOG 0-2</li>
<li>No history of previous treatment for esophageal cancer</li>
</ul>
<p class="ref-note">目前僅有 stage I 食道癌的 definitive carbon ion therapy 有限證據支持。</p>
<details>
<summary>投影片原文：Charged Particle Therapy (s69)</summary>
<p><strong>Proton Therapy</strong></p>
${ul(['Proton therapy is appropriate in clinical settings where reduction in dose to organ at risk is required that cannot be achieved by 3D techniques, ideally within a clinical trial or registry study.'])}
<p><strong>Carbon Ion Therapy</strong></p>
<ul>
<li>Definitive carbon ion therapy can be considered in patients with${sup(29)}
  <ul>
  <li>cT1N0M0 esophageal cancer</li>
  <li>ECOG 0~2</li>
  <li>No history of previous treatment for esophageal cancer</li>
  </ul>
</li>
<li>Currently there is limited evidence supporting benefits of carbon ion therapy in the preoperative setting or definitive treatment other than stage I esophageal cancer.</li>
</ul>
<p class="ref-note">上標 29 = <a href="#/ref/REFERENCES/radio">放射治療參考文獻</a> 第 29 篇。</p>
</details>
`
    },

    /* ---------------- FOLLOWUP (s72) ---------------- */
    FOLLOWUP: {
      title: '追蹤原則 (Follow Up)',
      source: [72],
      content: `
<h4 class="ref-h4" id="FOLLOWUP-schedule">常規追蹤頻率</h4>
<ul>
<li><strong>History and Physical:</strong><br/>
- 第 1-2 年：每 3-6 個月<br/>
- 第 3-5 年：每 6-12 個月<br/>
- 第 5 年後：每年</li>
</ul>
<h4 class="ref-h4" id="FOLLOWUP-indicated">依臨床需求安排</h4>
<ul>
<li>Clinical examination</li>
<li>Chemistry profile and CBC</li>
<li>Imaging</li>
<li>Upper GI endoscopy and biopsy</li>
</ul>
<h4 class="ref-h4" id="FOLLOWUP-other">其他後續照護</h4>
<ul>
<li>Dilatation for anastomotic stenosis</li>
<li>Nutritional assessment and counseling</li>
</ul>
<details>
<summary>投影片原文：Follow Up (s72)</summary>
<p><strong>History and Physical examination</strong></p>
${ul(['Every 3 to 6 months for 1 to 2 years.', 'Every 6 to 12 months for 3 to 5 years, then annually.'])}
<p><strong>Clinical examination</strong><br><strong>Optional as clinically indicated</strong></p>
${ul(['Chemistry profile and CBC, as clinically indicated.', 'Imaging as clinically indicated.', 'Upper GI endoscopy and biopsy as clinically indicated.', 'Dilatation for anastomotic stenosis.', 'Nutritional assessment and counseling.'])}
</details>
`
    },

    /* ---------------- TRIALS (v3) ---------------- */
    TRIALS: {
      title: '關鍵臨床試驗 (Key Clinical Trials)',
      source: [18, 27, 48, 49, 50, 58, 59, 60, 61, 70, 71],
      content: `
<p class="ref-note">完整書目見 <a href="#/ref/REFERENCES">參考文獻</a>（化學治療 s58–61、放射治療 s70–71）。</p>
<details open>
<summary>SCC — Neoadjuvant</summary>
<ul>
<li><strong>JCOG1109 NExT</strong> (Lancet 2024;404:55-66)<br/>
DCF vs CF vs CRT neoadjuvant for locally advanced ESCC. DCF 組 OS 顯著優於 CF (HR 0.68)，有優於 CRT 的趨勢。</li>
<li><strong>CROSS</strong> (NEJM 2012;366:2074)<br/>
Paclitaxel/Carboplatin + 41.4 Gy preop CCRT vs surgery alone. OS 顯著改善。</li>
</ul>
</details>
<details>
<summary>Adenocarcinoma — Perioperative</summary>
<ul>
<li><strong>ESOPEC</strong><br/>
FLOT vs CROSS for EAC/EGJ. FLOT OS 顯著優於 CROSS (Median OS: 66 vs 37 mo).</li>
<li><strong>Neo-AEGIS</strong><br/>
Peri-op Chemo (MAGIC/FLOT) vs Preop CCRT (CROSS). 3yr OS 55% vs 57% (HR 1.03, NS); pCR: CROSS 16% vs Chemo 5%.</li>
<li><strong>FLOT4-AIO</strong><br/>
FLOT vs ECF/ECX perioperative. OS 顯著改善 (median 50 vs 35 mo).</li>
<li><strong>MATTERHORN</strong> — FLOT4 + Durvalumab (Phase III, global)</li>
<li><strong>AIO-DANTE</strong> — FLOT4 + Atezolizumab (Phase II, Germany)</li>
</ul>
</details>
<details>
<summary>Adjuvant Immunotherapy</summary>
<ul>
<li><strong>CheckMate 577</strong> (NEJM 2021;384:1191-1203)<br/>
Nivolumab adjuvant after preop CCRT + surgery in esophageal/GEJ cancer. DFS: 22.4 vs 11.0 mo (HR 0.69).</li>
</ul>
</details>
<details>
<summary>Metastatic — 1st Line Immunotherapy</summary>
<ul>
<li><strong>KEYNOTE-590</strong> (Lancet 2021;398:759-771)<br/>
Pembrolizumab + chemo vs chemo, 1st line ESCC/EAC. OS/PFS 顯著改善。</li>
<li><strong>CheckMate-648</strong> (NEJM 2022;386:449-462)<br/>
Nivo + chemo or Nivo + Ipi vs chemo, 1st line ESCC. OS 顯著改善。</li>
<li><strong>CheckMate-649</strong><br/>
Nivo + chemo vs chemo, 1st line GC/GEJC/EAC. OS/PFS 改善 (PD-L1 CPS&ge;5).</li>
<li><strong>KEYNOTE-859</strong> (Lancet Oncol 2023;24:1181-1195)<br/>
Pembrolizumab + chemo, HER2-neg GC/GEJC. OS 顯著改善。</li>
<li><strong>ATTRACTION-4</strong> (Lancet Oncol 2022;23:234-247)<br/>
Nivo + chemo, HER2-neg GC/GEJC. PFS 改善但 OS 未達顯著。</li>
</ul>
</details>
<details>
<summary>HER2-positive</summary>
<ul>
<li><strong>ToGA</strong> (Lancet 2010;376:687-97)<br/>
Trastuzumab + chemo for HER2+ advanced GC/GEJC. OS 改善。</li>
<li><strong>KEYNOTE-811</strong><br/>
Pembrolizumab + Trastuzumab + chemo for HER2+ GC/GEJC.</li>
</ul>
</details>
<details>
<summary>Definitive CRT — Landmark Trials</summary>
<ul>
<li><strong>RTOG 85-01</strong> (JAMA 1999;281:1623-27)<br/>
CRT vs RT alone for locally advanced esophageal cancer. CRT 顯著優於單獨放療，奠定 definitive CRT 標準。</li>
<li><strong>RTOG 94-05 / INT 0123</strong><br/>
High-dose (64.8 Gy) vs standard-dose (50.4 Gy) RT. 高劑量未改善 OS，標準劑量 50.4 Gy 確立為推薦劑量。</li>
<li><strong>FFCD 9102</strong> (JCO 2007;25:1160)<br/>
CRT followed by surgery vs CRT alone for ESCC. 加入手術未顯著改善 OS，但改善局部控制。</li>
</ul>
</details>
<details>
<summary>2nd/3rd Line &amp; Targeted Therapy</summary>
<ul>
<li><strong>REGARD</strong> (Lancet 2014;383:31-39)<br/>
Ramucirumab monotherapy vs placebo, 2nd line GC/GEJC. OS 顯著改善。</li>
<li><strong>RAINBOW</strong> (Lancet Oncol 2014;15:1224-35)<br/>
Ramucirumab + Paclitaxel vs placebo + Paclitaxel, 2nd line GC/GEJC. OS 顯著改善。</li>
<li><strong>TAGS</strong> (Lancet Oncol 2018;19:1437-48)<br/>
Trifluridine/tipiracil (TAS-102) vs placebo, 3rd line+ GC/GEJC. OS 顯著改善。</li>
</ul>
</details>
`
    },

    /* ---------------- REFERENCES (s34, s58–61, s70–71) ---------------- */
    REFERENCES: {
      title: '參考文獻 (References)',
      source: [34, 58, 59, 60, 61, 70, 71],
      content: `
<p class="ref-note">編號與文字依投影片原樣呈現。投影片原始瑕疵照錄：化學治療第 45 篇開頭含多餘的「35.」；放射治療文獻在 s70 有兩篇都標為「12」（Basset、Stahl），其後接 13。</p>
<h4 class="ref-h4" id="REFERENCES-surgery">Reference of Surgical Resection (s34)</h4>
${refList('s', REFS_SURG)}
<h4 class="ref-h4" id="REFERENCES-chemo">Reference of Chemotherapy (s58–61)</h4>
${refList('c', REFS_CHEMO)}
<h4 class="ref-h4" id="REFERENCES-radio">Principles of Radiation Therapy — References (s70–71)</h4>
${refList('r', REFS_RADIO)}
`
    }
  });
})();
