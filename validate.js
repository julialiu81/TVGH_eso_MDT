#!/usr/bin/env node
/*
 * validate.js — data integrity checks for the Taipei VGH esophageal cancer guideline app
 * (namespace window.ECG; node, no dependencies). Contract: SPEC.md §2 (and the thymic / lung apps' SPEC §2).
 *
 *   node validate.js                      # all data/*.js in sorted order
 *   node validate.js data/00_core.js _dev/mock_data.js   # explicit file list (e.g. mock data)
 *   node validate.js --no-spec ...        # skip SPEC-required node/panel/anchor/scheme checks (partial datasets)
 *   node validate.js --stage ...          # also print stage matrices (T × N per M; >3-axis schemes: stages over the other axes)
 *
 * Phase 1 (browser scope): runs every file in ONE shared vm context, exactly like consecutive
 *   <script> tags. Catches top-level `const/let ECG` collisions (fatal in browsers but invisible
 *   to require), runtime errors, and cross-file overwrites of TREE / FOOTNOTES / REF_DATA keys.
 * Phase 2 (data checks): sets global.window = {}, requires every file, then checks links, notes,
 *   panels/anchors, sources, reachability and STAGE_TABLE.
 *   `source` (slide numbers): required on every node/panel only when META.sourcePages > 0 (source-page viewer);
 *   with META.sourcePages = 0 (this app) it is optional, but any numbers given must be 1..SLIDE_COUNT.
 *   STAGE_TABLE: multi-scheme format (SPEC §2.3) — every scheme's full axis product is passed to group(),
 *   which must not throw and must return a valid stage label or null; entry() is called for every staged
 *   combination and its node ids must exist. The legacy single-scheme { T, N, M, group(t, n, m) } format
 *   (thymic / lung apps) is still checked.
 *   SPEC checks (skipped with --no-spec): required nodes + root / follow-up links (§2.1), required panels,
 *   groups and anchors (§2.2), required schemes / axes / items and expected entry() targets (§2.3),
 *   tag levels other than preferred / mdt / trial (§2).
 * Exit code 1 if any ERROR.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const EXPECTED_FILES = ['00_core.js', '10_tree_scc.js', '15_tree_adeno.js', '30_ref_dx.js', '40_ref_tx.js'];
// SPEC §2.1 — fixed node ids (v3 ids + the two follow-up shortcuts under root)
const REQUIRED_NODES = ['root',
  'scc_stage', 'scc_unresectable', 'scc_post_er', 'scc_response_preop', 'scc_response_def', 'scc_surgical_type', 'scc_recurrence',
  'adeno_stage', 'adeno_unresectable', 'adeno_response_preop', 'adeno_response_def', 'adeno_surgical_type', 'adeno_recurrence',
  'scc_followup_entry', 'adeno_followup_entry'];
const ROOT_LINKS = ['scc_stage', 'adeno_stage', 'scc_followup_entry', 'adeno_followup_entry'];
const FOLLOWUP_LINKS = {
  scc_followup_entry: ['scc_post_er', 'scc_response_preop', 'scc_response_def', 'scc_surgical_type', 'scc_recurrence'],
  adeno_followup_entry: ['adeno_response_preop', 'adeno_response_def', 'adeno_surgical_type', 'adeno_recurrence']
};
const ID_RE = /^(root|(res_)?(scc|adeno)_[A-Za-z0-9_]+)$/;   // root / scc_ / adeno_ / res_scc_ / res_adeno_
// SPEC §2.2 — panels (key → group) and the anchors other files link to (<h4 id="PANEL-anchor">)
const REQUIRED_PANELS = {
  WORKUP: 'dx', TNM: 'dx', PATHOLOGY: 'dx',
  SURGERY: 'tx', CHEMO: 'tx', RADIO: 'tx', PARTICLE: 'tx', FOLLOWUP: 'tx',
  TRIALS: 'misc', REFERENCES: 'misc', TEAM: 'misc'
};
const REQUIRED_ANCHORS = {
  TNM: ['t', 'n', 'm', 'g', 'location', 'scc_c', 'scc_p', 'scc_yp', 'adeno_c', 'adeno_p', 'adeno_yp'],
  SURGERY: ['resectability', 'outcomes'],
  CHEMO: ['neoadj_ccrt', 'definitive_ccrt', 'adjuvant', 'palliative', 'periop', 'egj_adjuvant', 'egj_metastatic'],
  RADIO: ['general', 'target', 'preop', 'definitive', 'postop'],
  REFERENCES: ['surgery', 'chemo', 'radio']
};
const GROUPS = ['dx', 'tx', 'misc'];
const NODE_TYPES = ['primary', 'warning', 'danger', 'neutral'];
const SLIDE_COUNT = 72;   // ESG_v20251230.pptx — valid `source` numbers while META.sourcePages = 0
// SPEC §2.3 — AJCC 8th esophageal cancer (slides 36–40); axes in URL order
const M2 = ['M0', 'M1'], N4 = ['N0', 'N1', 'N2', 'N3'], N5 = N4.concat('NX'), G4 = ['GX', 'G1', 'G2', 'G3'];
const TP = ['Tis', 'T1a', 'T1b', 'T2', 'T3', 'T4a', 'T4b'], TY = ['T0', 'T1', 'T2', 'T3', 'T4a', 'T4b'];
const REQUIRED_SCHEMES = {
  scc_c: { T: ['Tis', 'T1', 'T2', 'T3', 'T4'], N: N4, M: M2 },
  scc_p: { T: TP, N: N4, M: M2, G: G4, L: ['Upper', 'Middle', 'Lower', 'X'] },
  scc_yp: { T: TY, N: N5, M: M2 },
  adeno_c: { T: ['Tis', 'T1', 'T2', 'T3', 'T4a', 'T4b'], N: N4, M: M2 },
  adeno_p: { T: TP, N: N4, M: M2, G: G4 },
  adeno_yp: { T: TY, N: N5, M: M2 }
};
// SPEC §2.3 — node that entry() is expected to include (warning only)
const SCHEME_ENTRY = {
  scc_c: (g) => (g === 'IVB' ? 'scc_unresectable' : 'scc_stage'),
  scc_p: () => 'scc_surgical_type',
  scc_yp: () => 'scc_surgical_type',
  adeno_c: (g) => (g === 'IVB' ? 'adeno_unresectable' : 'adeno_stage'),
  adeno_p: () => 'adeno_surgical_type',
  adeno_yp: () => 'adeno_surgical_type'
};
const STAGE_ORDER = ['0', 'I', 'IA', 'IB', 'IC', 'II', 'IIA', 'IIB', 'III', 'IIIA', 'IIIB', 'IVA', 'IVB'];
const STAGE_VALID = new Set(STAGE_ORDER);
const SPEC_TAG_LEVELS = new Set(['preferred', 'mdt', 'trial']);   // SPEC §2: no nhi_* / tfda_no (no reimbursement info in the slides)
const UI_FOOTNOTES = new Set(['note_disclaimer', 'note_mdt']); // used by the UI footer

const errors = [], warnings = [];
const E = (m) => errors.push(m);
const W = (m) => warnings.push(m);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
let nQuestion = 0, nResult = 0;
const reach = new Set();
const loaded = [];

// ---------------------------------------------------------------- file list
const FLAGS = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const SPEC_CHECKS = !FLAGS.has('--no-spec');
const PRINT_STAGE = FLAGS.has('--stage');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
let files;
if (args.length) {
  files = args.map(a => path.resolve(a));
  files.forEach(f => { if (!fs.existsSync(f)) E(`[files] ${rel(f)} does not exist`); });
  files = files.filter(f => fs.existsSync(f));
} else {
  if (!fs.existsSync(DATA_DIR)) { console.error('data/ directory not found'); process.exit(1); }
  files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js')).sort().map(f => path.join(DATA_DIR, f));
  EXPECTED_FILES.forEach(f => { if (!fs.existsSync(path.join(DATA_DIR, f))) E(`[files] data/${f} is missing (index.html loads it)`); });
  files.forEach(f => { if (!EXPECTED_FILES.includes(path.basename(f))) W(`[files] ${rel(f)} is not loaded by index.html (only ${EXPECTED_FILES.join(', ')} are)`); });
}

// ---------------------------------------------------------------- phase 1: browser-like shared scope
(function browserScope() {
  const sandbox = { console: { log() {}, warn() {}, error() {}, info() {} } };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  const owners = { TREE: {}, FOOTNOTES: {}, REF_DATA: {} };
  let current = null;
  const tracked = (name) => new Proxy({}, {
    set(t, k, v) {
      if (Object.prototype.hasOwnProperty.call(t, k) && owners[name][k] !== current) {
        E(`[overwrite] ${name}.${String(k)} from ${owners[name][k]} is overwritten by ${current}`);
      }
      owners[name][k] = current; t[k] = v; return true;
    }
  });
  const proxies = { TREE: tracked('TREE'), FOOTNOTES: tracked('FOOTNOTES'), REF_DATA: tracked('REF_DATA') };
  sandbox.ECG = Object.assign({}, proxies);
  const ctx = vm.createContext(sandbox);
  for (const f of files) {
    current = rel(f);
    const code = fs.readFileSync(f, 'utf8');
    try {
      new vm.Script(code, { filename: current }).runInContext(ctx, { timeout: 5000 });
    } catch (e) {
      const where = (e.stack || '').split('\n').find(l => l.includes(current)) || '';
      const hint = /already been declared/.test(e.message)
        ? ' — in the browser all data files share one global scope: wrap the file in (function(){ ... })() instead of a top-level const/let'
        : '';
      E(`[browser] ${current}: ${e.name}: ${e.message}${where && !where.includes(e.message) ? ' @ ' + where.trim() : ''}${hint}`);
      continue;
    }
    const L = sandbox.ECG;
    ['TREE', 'FOOTNOTES', 'REF_DATA'].forEach(k => {
      if (L && L[k] !== proxies[k]) { E(`[overwrite] ${current} replaced ECG.${k} (must use Object.assign)`); proxies[k] = L[k]; }
    });
    if (L && !Array.isArray(L.REF_PANELS) && L.REF_PANELS !== undefined) E(`[browser] ${current}: ECG.REF_PANELS is not an array`);
  }
})();

// ---------------------------------------------------------------- phase 2: node require + data checks
global.window = {};
for (const f of files) {
  try { delete require.cache[require.resolve(f)]; require(f); loaded.push(rel(f)); }
  catch (e) {
    const firstLine = (e.stack || '').split('\n')[0];
    E(`[load] ${rel(f)}: ${e.name}: ${e.message}${firstLine && firstLine !== `${e.name}: ${e.message}` ? ' @ ' + firstLine : ''}`);
  }
}

const ECG = global.window.ECG;
if (!ECG) {
  E('window.ECG is not defined after loading data files');
  console.log(['ECG data validation', `  files loaded : ${loaded.length}/${files.length}`, `\nERRORS (${errors.length}):`]
    .concat(errors.map(e => '  x ' + e), `\nResult: FAIL (${errors.length} error(s), ${warnings.length} warning(s))`).join('\n'));
  process.exit(1);
}

const TREE = ECG.TREE || {};
const FN = ECG.FOOTNOTES || {};
const PANELS = Array.isArray(ECG.REF_PANELS) ? ECG.REF_PANELS : [];
const RD = ECG.REF_DATA || {};
const TAGS = ECG.TAG_LEVELS || {};
const SRC_PAGES = Math.max(0, Math.floor(Number(ECG.META && ECG.META.sourcePages) || 0));
const SOURCE_REQUIRED = SRC_PAGES > 0;          // source-page viewer enabled → every node/panel needs `source`
const MAXP = SRC_PAGES || SLIDE_COUNT;
const PAGE_DIR = path.join(ROOT, '_source_pages');
const hasPageDir = SOURCE_REQUIRED && fs.existsSync(PAGE_DIR);
const missingPageImgs = new Set();
let nSources = 0;

function checkSource(where, src) {
  if (src === undefined || src === null) {
    if (SOURCE_REQUIRED) E(`${where}: missing source (non-empty array of slide numbers 1..${MAXP})`);
    return;
  }
  if (!Array.isArray(src)) { E(`${where}: source must be an array of slide numbers 1..${MAXP}`); return; }
  if (!src.length) { (SOURCE_REQUIRED ? E : W)(`${where}: empty source array${SOURCE_REQUIRED ? '' : ' (omit the field instead)'}`); return; }
  nSources++;
  src.forEach(p => {
    if (!Number.isInteger(p) || p < 1 || p > MAXP) E(`${where}: invalid source page ${JSON.stringify(p)} (1..${MAXP})`);
    else if (hasPageDir && !fs.existsSync(path.join(PAGE_DIR, 'p' + String(p).padStart(2, '0') + '.png'))) missingPageImgs.add(p);
  });
}

// ---- anchors / ids per panel
const panelIds = {};
Object.keys(RD).forEach(k => {
  const html = (RD[k] && typeof RD[k].content === 'string') ? RD[k].content : '';
  panelIds[k] = [...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
});
const hasAnchor = (panel, anchor) => (panelIds[panel] || []).some(id => id === `${panel}-${anchor}` || id === anchor);

// ---- tree nodes
const ids = Object.keys(TREE);
const usedNotes = new Set();
const hasHtml = (s) => typeof s === 'string' && /<\/?(br|b|i|strong|em|span|div|p|sup|sub|ul|li|a)\b[^>]*>/i.test(s);
const FULLWIDTH_ZH = /（[^）]*[一-鿿][^）]*）/;

function checkLink(where, o, fromId) {
  if (!o || typeof o !== 'object') { E(`${where}: not an object`); return; }
  if (typeof o.label !== 'string' || !o.label.trim()) E(`${where}: missing label`);
  else if (SPEC_CHECKS && FULLWIDTH_ZH.test(o.label)) W(`${where}: label has a full-width （中文） part — put the Chinese note in "sub" (SPEC §2)`);
  if (typeof o.next !== 'string' || !o.next) { E(`${where}: missing next`); return; }
  if (!TREE[o.next]) E(`${where}: next "${o.next}" does not exist in TREE`);
  else if (o.next === fromId) W(`${where}: links to itself`);
}

ids.forEach(id => {
  const n = TREE[id];
  const at = `TREE.${id}`;
  if (!n || typeof n !== 'object') { E(`${at}: not an object`); return; }
  if (!ID_RE.test(id)) W(`${at}: id does not follow the prefix convention (root / scc_ / adeno_ / res_…, SPEC §2)`);
  checkSource(at, n.source);
  ['options', 'nextSteps', 'notes', 'refs', 'tags'].forEach(f => { if (n[f] != null && !Array.isArray(n[f])) E(`${at}.${f}: must be an array`); });

  if (n.isResult) {
    nResult++;
    if (n.isResult !== true) W(`${at}: isResult should be the boolean true`);
    if (typeof n.content !== 'string' || !n.content.trim()) E(`${at}: result node missing content`);
    if (!n.title) W(`${at}: result node has no title`);
    if (n.type && !NODE_TYPES.includes(n.type)) W(`${at}: unknown type "${n.type}" (primary|warning|danger|neutral)`);
    if (n.options) W(`${at}: result node also has options (ignored by the UI; use nextSteps)`);
    if (!id.startsWith('res_') && !REQUIRED_NODES.includes(id)) W(`${at}: result node id should start with res_`);
  } else {
    nQuestion++;
    if (id.startsWith('res_')) E(`${at}: id starts with res_ but isResult is not true`);
    if (typeof n.question !== 'string' || !n.question.trim()) E(`${at}: question node missing question (or set isResult: true)`);
    if (!Array.isArray(n.options) || !n.options.length) E(`${at}: question node has no options`);
  }
  (Array.isArray(n.options) ? n.options : []).forEach((o, i) => checkLink(`${at}.options[${i}]`, o, id));
  (Array.isArray(n.nextSteps) ? n.nextSteps : []).forEach((o, i) => checkLink(`${at}.nextSteps[${i}]`, o, id));
  (Array.isArray(n.notes) ? n.notes : []).forEach(k => {
    if (!(k in FN)) E(`${at}.notes: footnote "${k}" not in FOOTNOTES`); else usedNotes.add(k);
  });
  (Array.isArray(n.refs) ? n.refs : []).forEach((r, i) => {
    const w = `${at}.refs[${i}]`;
    if (!r || !r.panel) { E(`${w}: missing panel`); return; }
    if (!RD[r.panel]) E(`${w}: panel "${r.panel}" not in REF_DATA`);
    else if (r.anchor && !hasAnchor(r.panel, r.anchor)) E(`${w}: anchor "${r.anchor}" not found (expected id="${r.panel}-${r.anchor}" in REF_DATA.${r.panel}.content)`);
  });
  (Array.isArray(n.tags) ? n.tags : []).forEach((t, i) => {
    if (!t || !(t.level in TAGS)) E(`${at}.tags[${i}]: unknown level "${t && t.level}" (${Object.keys(TAGS).join('|')})`);
    else if (SPEC_CHECKS && !SPEC_TAG_LEVELS.has(t.level)) W(`${at}.tags[${i}]: level "${t.level}" — SPEC §2 allows only ${[...SPEC_TAG_LEVELS].join(' / ')} (no NHI/TFDA information in the slides)`);
  });
  ['question', 'content', 'extra', 'title'].forEach(f => { if (hasHtml(n[f])) W(`${at}.${f}: contains HTML tags (tree text is rendered as plain text; use \\n)`); });
});

// ---- required entry nodes (SPEC §2.1)
if (SPEC_CHECKS) REQUIRED_NODES.forEach(id => { if (!TREE[id]) E(`[spec] required node "${id}" is missing (SPEC §2.1)`); });
if (TREE.root && SPEC_CHECKS) {
  const rootNext = (TREE.root.options || []).map(o => o && o.next);
  ROOT_LINKS.forEach(id => { if (!rootNext.includes(id)) E(`[spec] root options must link to "${id}" (SPEC §2.1)`); });
  Object.keys(FOLLOWUP_LINKS).forEach(fid => {
    if (!TREE[fid]) return;
    const nx = (TREE[fid].options || []).map(o => o && o.next);
    FOLLOWUP_LINKS[fid].forEach(id => { if (!nx.includes(id)) W(`[spec] ${fid} options should link to "${id}" (SPEC §2.1)`); });
  });
}

// ---- reachability from root
if (TREE.root) {
  const q = ['root']; reach.add('root');
  while (q.length) {
    const n = TREE[q.shift()];
    if (!n) continue;
    [].concat(n.options || [], n.nextSteps || []).forEach(o => {
      if (o && TREE[o.next] && !reach.has(o.next)) { reach.add(o.next); q.push(o.next); }
    });
  }
}
const unreachable = ids.filter(id => !reach.has(id));
if (TREE.root && unreachable.length) W(`[reach] ${unreachable.length} node(s) unreachable from root: ${unreachable.join(', ')}`);

// ---- panels
const seenPanels = new Set();
PANELS.forEach((p, i) => {
  if (!p || !p.key) { E(`REF_PANELS[${i}]: missing key`); return; }
  if (seenPanels.has(p.key)) E(`REF_PANELS: duplicate key "${p.key}"`);
  seenPanels.add(p.key);
  if (!p.label) W(`REF_PANELS.${p.key}: missing label`);
  if (!GROUPS.includes(p.group)) W(`REF_PANELS.${p.key}: group "${p.group}" should be dx|tx|misc`);
  else if (SPEC_CHECKS && REQUIRED_PANELS[p.key] && REQUIRED_PANELS[p.key] !== p.group) W(`[spec] REF_PANELS.${p.key}: group "${p.group}" (SPEC §2.2: ${REQUIRED_PANELS[p.key]})`);
  if (!RD[p.key]) E(`REF_PANELS.${p.key}: no REF_DATA.${p.key}`);
});
if (SPEC_CHECKS) Object.keys(REQUIRED_PANELS).forEach(k => { if (!seenPanels.has(k)) E(`[spec] required panel "${k}" not in REF_PANELS (SPEC §2.2)`); });
if (SPEC_CHECKS) Object.keys(REQUIRED_ANCHORS).forEach(k => {
  if (!RD[k]) return;   // missing panel is reported above
  REQUIRED_ANCHORS[k].forEach(a => {
    if (!hasAnchor(k, a)) E(`[spec] REF_DATA.${k}: required anchor id="${k}-${a}" is missing (SPEC §2.2)`);
  });
});

const idOwner = {};
const stageLinks = [];   // #/stage/… links inside panel HTML, checked against STAGE_TABLE below
Object.keys(RD).forEach(k => {
  const d = RD[k]; const at = `REF_DATA.${k}`;
  if (!d || typeof d !== 'object') { E(`${at}: not an object`); return; }
  if (!seenPanels.has(k)) W(`${at}: not listed in REF_PANELS (not reachable from the menu)`);
  if (!d.title) E(`${at}: missing title`);
  if (typeof d.content !== 'string' || !d.content.trim()) { E(`${at}: missing content`); return; }
  checkSource(at, d.source);
  const html = d.content;
  if (/<script\b/i.test(html)) E(`${at}: contains <script> (not allowed)`);
  // ids
  const seen = new Set();
  (panelIds[k] || []).forEach(id => {
    if (seen.has(id)) W(`${at}: duplicate id="${id}"`);
    seen.add(id);
    if (idOwner[id] && idOwner[id] !== k) W(`${at}: id="${id}" also used in REF_DATA.${idOwner[id]}`);
    idOwner[id] = k;
  });
  [...html.matchAll(/<h4\b[^>]*\sid\s*=\s*["']([^"']+)["']/gi)].forEach(m => {
    if (!m[1].startsWith(k + '-')) W(`${at}: <h4 id="${m[1]}"> should be prefixed "${k}-" (anchor format PANEL-anchor)`);
  });
  // tag balance (rough)
  ['details', 'summary', 'table', 'tr', 'ul', 'ol', 'div'].forEach(tag => {
    const open = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const close = (html.match(new RegExp(`</${tag}\\s*>`, 'gi')) || []).length;
    if (open !== close) W(`${at}: unbalanced <${tag}> (${open} open / ${close} close)`);
  });
  // leftover v3 Tailwind classes (SPEC §2.2: use ref-h4 / ref-table / ref-note …)
  const tw = html.match(/class\s*=\s*["'][^"']*\b(text-brand-\d+|font-bold text-lg|list-disc pl-5|border-brand-\d+)\b/i);
  if (SPEC_CHECKS && tw) W(`${at}: still uses v3 Tailwind classes ("${tw[1]}") — use ref-h4 / ref-table / ref-note (SPEC §2.2)`);
  // inline tags
  [...html.matchAll(/class\s*=\s*["'][^"']*\btag-([a-z_]+)/gi)].forEach(m => {
    if (!(m[1] in TAGS)) W(`${at}: class "tag-${m[1]}" is not a TAG_LEVELS key`);
    else if (SPEC_CHECKS && !SPEC_TAG_LEVELS.has(m[1])) W(`${at}: class "tag-${m[1]}" — SPEC §2 allows only ${[...SPEC_TAG_LEVELS].join(' / ')}`);
  });
  // internal links
  [...html.matchAll(/href\s*=\s*["']#\/([^"']*)["']/gi)].forEach(m => {
    const parts = m[1].split('?')[0].split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    if (parts[0] === 'ref') {
      if (parts[1] && !RD[parts[1]]) E(`${at}: link #/${m[1]} → panel "${parts[1]}" not in REF_DATA`);
      else if (parts[1] && parts[2] && !hasAnchor(parts[1], parts[2])) E(`${at}: link #/${m[1]} → anchor "${parts[2]}" not found`);
    } else if (parts[0] === 'path' || parts[0] === 'node') {
      parts.slice(1).forEach(id => { if (!TREE[id]) E(`${at}: link #/${m[1]} → node "${id}" not in TREE`); });
    } else if (parts[0] === 'stage') {
      stageLinks.push({ at, href: '#/' + m[1], parts: parts.slice(1) });
    } else if (parts.length) W(`${at}: unknown internal link #/${m[1]}`);
  });
});

// ---- footnotes
Object.keys(FN).forEach(k => { if (typeof FN[k] !== 'string' || !FN[k].trim()) E(`FOOTNOTES.${k}: empty or not a string`); });
const unusedNotes = Object.keys(FN).filter(k => !usedNotes.has(k) && !UI_FOOTNOTES.has(k));
if (unusedNotes.length) W(`[notes] ${unusedNotes.length} footnote(s) never referenced: ${unusedNotes.join(', ')}`);
if (missingPageImgs.size) W(`[pages] source page image(s) missing in _source_pages/: ${[...missingPageImgs].sort((a, b) => a - b).join(', ')}`);

// ---------------------------------------------------------------- STAGE_TABLE
const ST = ECG.STAGE_TABLE;
const idOf = (x) => (x == null ? '' : (typeof x === 'object' ? (x.id == null ? '' : String(x.id)) : String(x)));
const fmtV = (v) => Object.keys(v).map(k => v[k]).join(' ');
const stageInfo = { format: null, schemes: [], legacy: null };
const schemeAxes = {};   // key → [{ key, ids }] (for #/stage link checks)

if (!ST) W('[stage] STAGE_TABLE is null — the calculator will show "not available"');
else if (typeof ST !== 'object') E('[stage] STAGE_TABLE must be an object');
else if (Array.isArray(ST.schemes)) { stageInfo.format = 'schemes'; checkSchemes(ST); }
else if (['T', 'N', 'M'].some(k => Array.isArray(ST[k]))) {
  stageInfo.format = 'legacy';
  if (SPEC_CHECKS) E('[spec] STAGE_TABLE uses the legacy single-scheme T/N/M format; SPEC §2.3 requires STAGE_TABLE.schemes');
  checkLegacy(ST);
} else E('[stage] STAGE_TABLE has neither schemes[] nor T/N/M arrays');

function checkSchemes(ST) {
  const defs = (ST.defs && typeof ST.defs === 'object' && !Array.isArray(ST.defs)) ? ST.defs : {};
  if (ST.defs != null && defs !== ST.defs) E('[stage] STAGE_TABLE.defs must be an object of arrays ({ T: [...], N: [...] })');
  Object.keys(defs).forEach(k => {
    if (!Array.isArray(defs[k])) { E(`[stage] STAGE_TABLE.defs.${k} must be an array`); return; }
    defs[k].forEach((x, i) => { if (!idOf(x)) E(`[stage] STAGE_TABLE.defs.${k}[${i}] has no id`); });
  });
  if (ST.source !== undefined) checkSource('[stage] STAGE_TABLE', ST.source);
  if (!ST.schemes.length) E('[stage] STAGE_TABLE.schemes is empty');
  const keys = new Set();
  ST.schemes.forEach((s, si) => {
    const at = `[stage] schemes[${si}]` + (s && s.key ? ` "${s.key}"` : '');
    const sat = at.replace('[stage] ', '[spec] STAGE_TABLE.');
    if (!s || typeof s !== 'object') { E(`${at}: not an object`); return; }
    if (typeof s.key !== 'string' || !s.key) { E(`${at}: missing key`); return; }
    if (!/^[A-Za-z0-9_-]+$/.test(s.key)) E(`${at}: key must match [A-Za-z0-9_-] (it is the URL segment #/stage/<key>/…)`);
    if (keys.has(s.key)) { E(`${at}: duplicate scheme key`); return; }
    keys.add(s.key);
    if (!s.label) W(`${at}: missing label`);
    if (s.source !== undefined) checkSource(at, s.source);
    if (s.ref != null) {
      if (!s.ref.panel || !RD[s.ref.panel]) E(`${at}.ref: panel "${s.ref.panel}" not in REF_DATA`);
      else if (s.ref.anchor && !hasAnchor(s.ref.panel, s.ref.anchor)) E(`${at}.ref: anchor "${s.ref.anchor}" not found in REF_DATA.${s.ref.panel}`);
    }

    // ---- axes / items (items may be ids or {id,label,def}; missing items / label / def come from STAGE_TABLE.defs[axis])
    if (!Array.isArray(s.axes) || !s.axes.length) { E(`${at}: axes must be a non-empty array`); return; }
    const axes = [];
    let axesOk = true;
    s.axes.forEach((a, ai) => {
      const key = typeof a === 'string' ? a : (a && a.key);
      if (!key || typeof key !== 'string') { E(`${at}.axes[${ai}]: missing key`); axesOk = false; return; }
      if (axes.some(x => x.key === key)) { E(`${at}.axes: duplicate axis "${key}"`); axesOk = false; return; }
      const defsArr = Array.isArray(defs[key]) ? defs[key] : [];
      const raw = (a && typeof a === 'object' && a.items != null) ? a.items : defsArr;
      if (!Array.isArray(raw) || !raw.length) { E(`${at}.axes.${key}: items must be a non-empty array (or provide STAGE_TABLE.defs.${key})`); axesOk = false; return; }
      const axIds = [], noDef = [], notInDefs = [];
      raw.forEach((x, xi) => {
        const id = idOf(x);
        if (!id) { E(`${at}.axes.${key}[${xi}]: item has no id`); return; }
        if (axIds.includes(id)) { E(`${at}.axes.${key}: duplicate item "${id}"`); return; }
        if (/[/?#\s]/.test(id)) E(`${at}.axes.${key}: item id "${id}" must not contain "/", "?", "#" or spaces (URL segment)`);
        axIds.push(id);
        const dd = defsArr.find(y => idOf(y) === id);
        if (typeof x !== 'object' && !dd && defsArr.length) notInDefs.push(id);
        const def = (x && typeof x === 'object' && x.def) || (dd && typeof dd === 'object' && dd.def) || '';
        if (!def) noDef.push(id);
      });
      if (notInDefs.length) W(`${at}.axes.${key}: ${notInDefs.join(', ')} not in STAGE_TABLE.defs.${key} (button shows the bare id, no definition)`);
      if (noDef.length && ['T', 'N', 'M'].includes(key)) W(`${at}.axes.${key}: no def for ${noDef.join(', ')}`);
      axes.push({ key, ids: axIds });
    });
    if (!axesOk || !axes.length) return;
    schemeAxes[s.key] = axes;

    if (SPEC_CHECKS && REQUIRED_SCHEMES[s.key]) {
      const req = REQUIRED_SCHEMES[s.key];
      const reqKeys = Object.keys(req);
      reqKeys.forEach(k => {
        const ax = axes.find(x => x.key === k);
        if (!ax) { E(`${sat}: missing axis "${k}" (SPEC §2.3)`); return; }
        const miss = req[k].filter(id => !ax.ids.includes(id));
        if (miss.length) E(`${sat}.axes.${k}: missing item(s) ${miss.join(', ')} (SPEC §2.3)`);
      });
      const extra = axes.map(x => x.key).filter(k => !reqKeys.includes(k));
      if (extra.length) W(`${sat}: extra axis ${extra.join(', ')} (SPEC §2.3 lists ${reqKeys.join(', ')})`);
      const order = axes.map(x => x.key).filter(k => reqKeys.includes(k)).join(',');
      if (order !== reqKeys.filter(k => axes.some(x => x.key === k)).join(',')) W(`${sat}: axes order ${axes.map(x => x.key).join(', ')} differs from SPEC §2.3 (${reqKeys.join(', ')}); URLs #/stage/${s.key}/… follow axes order`);
    }

    // ---- group(): walk the full axis product
    const info = { key: s.key, label: String(s.label || ''), axes: axes.map(a => `${a.key}${a.ids.length}`), total: 0,
      dist: {}, nNull: 0, nThrow: 0, nBad: 0, entry: {}, cells: null };
    stageInfo.schemes.push(info);
    if (typeof s.group !== 'function') { E(`${at}: group is not a function`); return; }
    const hasEntry = typeof s.entry === 'function';
    if (!hasEntry) W(`${at}: entry is not a function — the calculator falls back to root`);
    const total = axes.reduce((n, a) => n * a.ids.length, 1);
    info.total = total;
    if (total > 500000) { W(`${at}: ${total} combinations — too many to check exhaustively`); return; }
    const once = new Set();
    const E1 = (m) => { if (!once.has(m)) { once.add(m); E(m); } };
    const W1 = (m) => { if (!once.has(m)) { once.add(m); W(m); } };
    const bad = [];
    const cells = PRINT_STAGE ? {} : null;   // "M|T|N" → Set(stage)
    for (let c = 0; c < total; c++) {
      const pos = [];
      let r = c;
      for (let k = axes.length - 1; k >= 0; k--) { const n = axes[k].ids.length; pos[k] = r % n; r = Math.floor(r / n); }
      const v = {};
      axes.forEach((a, k) => { v[a.key] = a.ids[pos[k]]; });   // keys in axes order: { T, N, M, G, L }
      let g;
      try { g = s.group(Object.assign({}, v)); } catch (e) {
        info.nThrow++;
        if (info.nThrow <= 5) E(`${at}: group({${fmtV(v)}}) threw: ${e && e.message}`);
        continue;
      }
      if (g === undefined || g === null || g === '') {
        info.nNull++;
        if (cells) addCell(cells, axes, v, '-');
        continue;
      }
      if (typeof g !== 'string' || !STAGE_VALID.has(g)) { info.nBad++; if (bad.length < 8) bad.push(`{${fmtV(v)}}→${JSON.stringify(g)}`); continue; }
      info.dist[g] = (info.dist[g] || 0) + 1;
      if (cells) addCell(cells, axes, v, g);
      if (!hasEntry) continue;
      let res;
      try { res = s.entry(g, Object.assign({}, v)); } catch (e) { E1(`${at}: entry("${g}", {${fmtV(v)}}) threw: ${e && e.message}`); continue; }
      const list = [];
      (Array.isArray(res) ? res : [res]).forEach(x => {
        if (typeof x === 'string' && x) list.push(x);
        else if (x && typeof x === 'object' && x.id) list.push(String(x.id));
        else if (x != null) E1(`${at}: entry("${g}") returned an invalid item ${JSON.stringify(x)} (expected "id" or {id, why})`);
      });
      if (!list.length) { W1(`${at}: entry("${g}", …) returned nothing (the calculator falls back to root)`); continue; }
      list.forEach(id => { if (!TREE[id]) E1(`${at}: entry("${g}", …) → "${id}" not in TREE`); });
      const key = list.join(' + ');
      info.entry[key] = (info.entry[key] || 0) + 1;
      if (SPEC_CHECKS && SCHEME_ENTRY[s.key]) {
        const want = SCHEME_ENTRY[s.key](g);
        if (!list.includes(want)) W1(`${sat}: entry("${g}", …) does not include "${want}" (SPEC §2.3)`);
      }
    }
    if (info.nThrow > 5) E(`${at}: group() threw for ${info.nThrow} combination(s) in total`);
    if (info.nBad) E(`${at}: group() returned ${info.nBad} invalid stage label(s) (valid: ${STAGE_ORDER.join(', ')} or null): ${bad.join(', ')}${info.nBad > bad.length ? ', …' : ''}`);
    if (total && info.nNull === total) W(`${at}: group() returns null for every combination`);
    info.cells = cells;
  });
  if (SPEC_CHECKS) Object.keys(REQUIRED_SCHEMES).forEach(k => { if (!keys.has(k)) E(`[spec] STAGE_TABLE.schemes is missing "${k}" (SPEC §2.3)`); });

  function addCell(cells, axes, v, g) {
    // key = remaining "page" axes (M first) | T | N
    const [a0, a1] = axes;
    const page = axes.slice(2).filter(a => a.key === 'M' || axes.length <= 3).map(a => v[a.key]).join(' ');
    const k = page + '|' + v[a0.key] + '|' + (a1 ? v[a1.key] : '');
    (cells[k] = cells[k] || new Set()).add(g);
  }
}

function checkLegacy(ST) {
  const axisIds = {};
  ['T', 'N', 'M'].forEach(ax => {
    const arr = ST[ax];
    if (!Array.isArray(arr) || !arr.length) { E(`[stage] STAGE_TABLE.${ax} must be a non-empty array`); axisIds[ax] = []; return; }
    axisIds[ax] = arr.map(idOf).filter(Boolean);
    arr.forEach((x, i) => {
      if (!idOf(x)) { E(`[stage] STAGE_TABLE.${ax}[${i}] has no id`); return; }
      if (typeof x === 'object' && !x.def) W(`[stage] STAGE_TABLE.${ax}.${x.id}: no def (definition text)`);
    });
  });
  schemeAxes[''] = ['T', 'N', 'M'].map(k => ({ key: k, ids: axisIds[k] }));
  if (typeof ST.group !== 'function') { E('[stage] STAGE_TABLE.group is not a function'); return; }
  const empty = [], odd = [], combos = [];
  const matrix = {};
  stageInfo.legacy = { matrix, total: 0, dist: {} };
  axisIds.M.forEach(m => axisIds.T.forEach(t => axisIds.N.forEach(n => {
    stageInfo.legacy.total++;
    let g;
    try { g = ST.group(t, n, m); } catch (e) { E(`[stage] group(${t}, ${n}, ${m}) threw: ${e.message}`); return; }
    ((matrix[m] = matrix[m] || {})[t] = matrix[m][t] || {})[n] = g;
    if (g == null || g === '') { empty.push(`${t}/${n}/${m}`); return; }
    if (typeof g !== 'string') { E(`[stage] group(${t}, ${n}, ${m}) returned ${typeof g} (expected string)`); return; }
    if (!STAGE_VALID.has(g)) odd.push(`${t}/${n}/${m}→${g}`);
    stageInfo.legacy.dist[g] = (stageInfo.legacy.dist[g] || 0) + 1;
    combos.push([t, n, m, g]);
  })));
  if (empty.length) W(`[stage] group() returns no stage for ${empty.length} combo(s): ${empty.slice(0, 12).join(', ')}${empty.length > 12 ? ', …' : ''}`);
  if (odd.length) W(`[stage] unusual stage labels (expected ${STAGE_ORDER.join('/')}): ${odd.slice(0, 10).join(', ')}`);
  if (typeof ST.entry !== 'function') { W('[stage] STAGE_TABLE.entry is not a function — the calculator falls back to root'); return; }
  // entry(stage, t, n, m) is called exactly like the UI does: once per T×N×M combo that has a stage.
  const once = new Set();
  const E1 = (m) => { if (!once.has(m)) { once.add(m); E(m); } };
  const W1 = (m) => { if (!once.has(m)) { once.add(m); W(m); } };
  combos.forEach(([t, n, m, g]) => {
    let r;
    try { r = ST.entry(g, t, n, m); } catch (e) { E1(`[stage] entry("${g}", "${t}", "${n}", "${m}") threw: ${e.message}`); return; }
    const list = (Array.isArray(r) ? r : [r]).map(x => (typeof x === 'string' ? x : x && x.id)).filter(Boolean);
    if (!list.length) { W1(`[stage] entry("${g}") returned nothing (the calculator falls back to root)`); return; }
    list.forEach(id => { if (!TREE[id]) E1(`[stage] entry("${g}") → "${id}" not in TREE`); });
  });
}

// ---- #/stage/… links in panel HTML
stageLinks.forEach(({ at, href, parts }) => {
  if (!ST || !Object.keys(schemeAxes).length) { if (parts.length) W(`${at}: link ${href} — STAGE_TABLE not available`); return; }
  let axes, vals = parts;
  if (stageInfo.format === 'legacy') axes = schemeAxes[''];
  else {
    if (!parts.length) return;
    axes = schemeAxes[parts[0]];
    if (!axes) { E(`${at}: link ${href} → scheme "${parts[0]}" not in STAGE_TABLE.schemes`); return; }
    vals = parts.slice(1);
  }
  if (vals.length > axes.length) E(`${at}: link ${href} has ${vals.length} values but the scheme has ${axes.length} axes (${axes.map(a => a.key).join(' / ')})`);
  vals.slice(0, axes.length).forEach((v, i) => { if (!axes[i].ids.includes(v)) E(`${at}: link ${href} → "${v}" is not a ${axes[i].key} item (${axes[i].ids.join(', ')})`); });
});

finish({});

function finish() {
  const L = global.window.ECG || {};
  const out = [];
  const S = L.STAGE_TABLE;
  out.push('ECG data validation');
  out.push(`  files loaded : ${loaded.length}/${files.length}  (${loaded.join(', ') || '-'})`);
  out.push(`  TREE nodes   : ${Object.keys(L.TREE || {}).length}  (question ${nQuestion}, result ${nResult}; reachable from root ${reach.size})`);
  out.push(`  REF panels   : ${(L.REF_PANELS || []).length} listed, ${Object.keys(L.REF_DATA || {}).length} with data`);
  out.push(`  FOOTNOTES    : ${Object.keys(L.FOOTNOTES || {}).length}`);
  out.push(`  sources      : META.sourcePages = ${SRC_PAGES}${SOURCE_REQUIRED ? ` (required, 1..${MAXP})` : ` (optional; ${nSources} given, must be 1..${MAXP})`}`);
  const distStr = (dist) => STAGE_ORDER.filter(g => dist[g]).map(g => `${g}:${dist[g]}`).join(' ') || '-';
  if (!S) out.push('  STAGE_TABLE  : null');
  else if (stageInfo.format === 'schemes') {
    out.push(`  STAGE_TABLE  : ${S.edition || '(no edition)'}, ${stageInfo.schemes.length} scheme(s)`);
    stageInfo.schemes.forEach(si => {
      out.push(`    ${si.key.padEnd(9)} ${si.axes.join(' × ')} = ${si.total} combos  ${si.label}`);
      out.push(`              stages : ${distStr(si.dist)} | null:${si.nNull}${si.nThrow ? ' | threw:' + si.nThrow : ''}${si.nBad ? ' | invalid:' + si.nBad : ''}`);
      const ek = Object.keys(si.entry);
      if (ek.length) out.push(`              entry  : ${ek.map(k => `${k} (${si.entry[k]})`).join(', ')}`);
      if (si.cells) printCells(out, si);
    });
  } else if (stageInfo.format === 'legacy') {
    out.push(`  STAGE_TABLE  : legacy T/N/M format, ${stageInfo.legacy ? stageInfo.legacy.total : 0} combos; stages ${stageInfo.legacy ? distStr(stageInfo.legacy.dist) : '-'}`);
    const mx = stageInfo.legacy && stageInfo.legacy.matrix;
    if (mx) Object.keys(mx).forEach(m => {
      const mt = mx[m];
      const T = Object.keys(mt); const N = T.length ? Object.keys(mt[T[0]]) : [];
      out.push(`  Stage groups (${m}):`);
      out.push('    ' + ''.padEnd(6) + N.map(n => n.padEnd(6)).join(''));
      T.forEach(t => out.push('    ' + t.padEnd(6) + N.map(n => String(mt[t][n] == null ? '-' : mt[t][n]).padEnd(6)).join('')));
    });
  } else out.push('  STAGE_TABLE  : present (unrecognised format)');
  if (errors.length) { out.push(`\nERRORS (${errors.length}):`); errors.forEach(e => out.push('  x ' + e)); }
  if (warnings.length) { out.push(`\nWARNINGS (${warnings.length}):`); warnings.forEach(w => out.push('  ! ' + w)); }
  out.push(`\nResult: ${errors.length ? 'FAIL' : 'OK'} (${errors.length} error(s), ${warnings.length} warning(s))`);
  console.log(out.join('\n'));
  process.exit(errors.length ? 1 : 0);
}

// --stage: T × N matrix per page (M, or the 3rd axis); >3-axis schemes show every stage reached over the other axes
function printCells(out, si) {
  const keys = Object.keys(si.cells);
  const pages = [...new Set(keys.map(k => k.split('|')[0]))];
  const rows = [...new Set(keys.map(k => k.split('|')[1]))];
  const cols = [...new Set(keys.map(k => k.split('|')[2]))];
  const cellStr = (k) => {
    const set = si.cells[k];
    if (!set) return '';
    return [...set].sort((a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b)).join('/');
  };
  const w = Math.max(6, ...keys.map(k => cellStr(k).length + 2));
  pages.forEach(pg => {
    out.push(`              [${si.key}${pg ? ' ' + pg : ''}]${si.axes.length > 3 ? ' (stages over the remaining axes)' : ''}`);
    out.push('                ' + ''.padEnd(6) + cols.map(c => c.padEnd(w)).join(''));
    rows.forEach(r => out.push('                ' + r.padEnd(6) + cols.map(c => cellStr(pg + '|' + r + '|' + c).padEnd(w)).join('')));
  });
}
