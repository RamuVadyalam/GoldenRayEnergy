// ════════════════════════════════════════════════════════════════════
// Power Bill Extractor (Deep Analysis)
// ════════════════════════════════════════════════════════════════════
// Extracts raw text from PDF / image / plain-text uploads, then runs
// a large set of NZ-aware regex parsers to pull retailer, plan, tariff
// rates, consumption bands, GST, discounts, solar export, prior period
// etc. Then produces a multi-scenario analysis covering solar fit,
// CO2, retailer switching, load fingerprint, and more.
// ════════════════════════════════════════════════════════════════════

import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

// NZ retailers (normalised lowercase keys)
const NZ_RETAILERS = [
  { key: 'mercury',        name: 'Mercury Energy' },
  { key: 'contact energy', name: 'Contact Energy' },
  { key: 'contact',        name: 'Contact Energy' },
  { key: 'genesis',        name: 'Genesis Energy' },
  { key: 'meridian',       name: 'Meridian Energy' },
  { key: 'powershop',      name: 'Powershop' },
  { key: 'electric kiwi',  name: 'Electric Kiwi' },
  { key: 'flick',          name: 'Flick Electric' },
  { key: 'pulse',          name: 'Pulse Energy' },
  { key: 'trustpower',     name: 'Trustpower' },
  { key: 'frank',          name: 'Frank Energy' },
  { key: 'nova',           name: 'Nova Energy' },
  { key: 'slingshot',      name: 'Slingshot' },
  { key: 'ecotricity',     name: 'Ecotricity' },
  { key: 'globug',         name: 'Globug' },
  { key: '2degrees',       name: '2degrees Power' },
];

// NZ-wide retailer average cost / kWh (for switching analysis, rough 2026 rates)
const RETAILER_AVG_RATE = {
  'Electric Kiwi':   0.28,
  'Flick Electric':  0.29,
  'Mercury Energy':  0.31,
  'Contact Energy':  0.32,
  'Meridian Energy': 0.32,
  'Powershop':       0.30,
  'Genesis Energy':  0.33,
  'Pulse Energy':    0.31,
  'Trustpower':      0.32,
  'Nova Energy':     0.30,
  'Frank Energy':    0.31,
  'Ecotricity':      0.35,
  '2degrees Power':  0.29,
  'Slingshot':       0.29,
  'Globug':          0.34,
};

const NZ_REGIONS = [
  'Auckland','Wellington','Christchurch','Hamilton','Tauranga','Queenstown','Dunedin',
  'Nelson','Napier','Hastings','Palmerston North','Rotorua','New Plymouth','Invercargill',
  'Marlborough','Taupo','Whangarei','Whanganui','Gisborne','Porirua','Lower Hutt','Upper Hutt',
];

// NZ constants
const NZ_GRID_CO2_KG_PER_KWH = 0.098;       // Approx 2024-25 NZ grid emissions factor
const NZ_AVG_HOUSEHOLD_ANNUAL_KWH = 7000;
const NZ_AVG_EFFECTIVE_RATE = 0.32;
const NZ_SOLAR_YIELD_KWH_PER_KW = 1400;     // Avg kWh/kW/year for a fixed NZ rooftop
const NZ_AVG_BUY_BACK_RATE = 0.10;          // Average retailer buy-back
const NZ_AVG_SELF_CONSUMPTION = 0.40;       // % of generation typically used on-site (no battery)
const NZ_AVG_SELF_CONSUMPTION_BATTERY = 0.80;
const NZ_AVG_TREE_CO2_KG_PER_YR = 22;       // 1 mature tree absorbs ~22 kg CO2/yr
const SOLAR_COST_PER_KW = 1850;             // Installed $/kW for residential (panels + inverter + install)
const BATTERY_COST = 12000;                 // 10 kWh battery + install

// ── Public entry ────────────────────────────────────────────────────
export async function extractBill(buffer, mimeType, fileName = '') {
  const rawText = await extractText(buffer, mimeType, fileName);
  if (!rawText || rawText.trim().length < 20) {
    return { rawText: rawText || '', status: 'partial', extracted: {}, analysis: emptyAnalysis(rawText) };
  }

  const extracted = parseFields(rawText);
  const analysis  = buildAnalysis(extracted, rawText);

  const hasCore = extracted.total_kwh != null || extracted.total_cost != null;
  return {
    rawText,
    status: hasCore ? 'processed' : 'partial',
    extracted,
    analysis,
  };
}

// ── Text extraction ─────────────────────────────────────────────────
async function extractText(buffer, mimeType = '', fileName = '') {
  const mt = (mimeType || '').toLowerCase();
  const fn = (fileName || '').toLowerCase();

  if (mt.includes('pdf') || fn.endsWith('.pdf')) {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return (result?.text || '').trim();
    } catch (e) {
      console.warn('[billExtractor] PDF parse failed:', e.message);
      return '';
    }
  }
  if (mt.startsWith('text/') || /\.(txt|csv|md|log)$/i.test(fn)) {
    try { return buffer.toString('utf-8').trim(); } catch { return ''; }
  }
  if (mt.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(fn)) {
    try {
      const worker = await createWorker('eng', 1, { logger: () => {} });
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return (data?.text || '').trim();
    } catch (e) {
      console.warn('[billExtractor] Image OCR failed:', e.message);
      return '';
    }
  }
  try { return buffer.toString('utf-8').trim(); } catch { return ''; }
}

// ══════════════════════════════════════════════════════════════════
// Field parsing
// ══════════════════════════════════════════════════════════════════
function parseFields(text) {
  const lower = text.toLowerCase();

  const retailer = findRetailer(lower);
  const region   = findRegion(text);
  const period   = findBillingPeriod(text);
  const kwh      = findTotalKwh(text);
  const peak     = findBandKwh(text, /(?:peak|daytime|anytime|charged:\s*midnight[^\n]*9\s*pm)/i);
  const offPeak  = findBandKwh(text, /(?:off\s*-?\s*peak|shoulder|free:\s*9\s*pm)/i);
  const night    = findBandKwh(text, /(?:night|nite)/i);
  const controlled = findBandKwh(text, /(?:controlled|uncontrolled|ripple|hot\s*water|water\s*heating)/i);

  const cost       = findTotalCost(text);
  const daily      = findDailyFixedCharge(text);
  const gst        = findGst(text, cost);
  const discount   = findPromptDiscount(text);
  const days       = period?.days ?? findDays(text);

  const peakRate       = findBandRate(text, /(?:peak|daytime|anytime|charged:\s*midnight[^\n]*9\s*pm)/i);
  const offPeakRate    = findBandRate(text, /(?:off\s*-?\s*peak|shoulder|free:\s*9\s*pm)/i);
  const nightRate      = findBandRate(text, /(?:night|nite)/i);
  const controlledRate = findBandRate(text, /(?:controlled|uncontrolled|ripple|hot\s*water)/i);

  const solarExport       = findSolarExport(text);
  const solarExportCredit = findSolarExportCredit(text);
  const prevKwh           = findPrevPeriodKwh(text);
  const prevCost          = findPrevPeriodCost(text);

  const accountNumber = findAccountNumber(text);
  const icpNumber     = findIcpNumber(text);
  const planName      = findPlanName(text, retailer);
  const userType      = findUserType(text);
  const dueDate       = findDueDate(text);

  const avgDaily = (kwh != null && days) ? +(kwh / days).toFixed(2) : null;
  const avgRate  = (cost != null && kwh) ? +(cost / kwh).toFixed(4) : null;

  return {
    retailer, region,
    account_number: accountNumber,
    icp_number: icpNumber,
    plan_name: planName,
    user_type: userType,

    billing_period_start: period?.start || null,
    billing_period_end:   period?.end   || null,
    billing_days:         days || null,
    due_date:             dueDate,

    total_kwh:       kwh,
    peak_kwh:        peak,
    off_peak_kwh:    offPeak,
    night_kwh:       night,
    controlled_kwh:  controlled,
    avg_daily_kwh:   avgDaily,

    peak_rate:       peakRate,
    off_peak_rate:   offPeakRate,
    night_rate:      nightRate,
    controlled_rate: controlledRate,

    total_cost:         cost,
    daily_fixed_charge: daily,
    avg_cost_per_kwh:   avgRate,
    gst_amount:         gst,
    prompt_discount:    discount,

    solar_export_kwh:    solarExport,
    solar_export_credit: solarExportCredit,
    prev_period_kwh:     prevKwh,
    prev_period_cost:    prevCost,
  };
}

// ── individual field finders ────────────────────────────────────────
function findRetailer(lower) {
  for (const r of NZ_RETAILERS) if (lower.includes(r.key)) return r.name;
  return null;
}

function findRegion(text) {
  for (const r of NZ_REGIONS) {
    if (new RegExp(`\\b${r}\\b`, 'i').test(text)) return r;
  }
  return null;
}

// Returns true if the kWh match at position `idx` appears in a non-electricity
// context (gas section, broadband section, mobile plan, or an "annual summary" line).
// Strategy: walk BACKWARD line-by-line to find the nearest section header.
// If the nearest header is GAS/BROADBAND/MOBILE, we're in that section.
// Also skip matches on lines that contain "365 days" or "12-month usage" annotations.
function isNonElectricityContext(text, idx) {
  // Check the current line for "365 days / 12 months usage" annotations
  const lineStart = Math.max(0, text.lastIndexOf('\n', idx - 1) + 1);
  let lineEnd = text.indexOf('\n', idx);
  if (lineEnd === -1) lineEnd = text.length;
  const currentLine = text.slice(lineStart, lineEnd).toLowerCase();
  if (/\b365\s+days?\b|\b12\s+months?\s+usage\b|\byour\s+total\s+usage\b/.test(currentLine)) return true;

  // Walk backwards line-by-line for the nearest *unambiguous* section header.
  // "CHARGE TYPE", "Variable charges", "Fixed daily charges" appear in BOTH electricity
  // and gas sections of NZ bills, so we don't treat them as markers.
  const before = text.slice(0, idx);
  const lines = before.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // Unambiguous electricity section markers
    if (/^(ELECTRICITY|Current Electricity Usage|Total Current Electricity Charges|Electricity(?:\s+charges?)?)\s*(?:\(.*\))?\s*$/i.test(raw)) return false;
    // Unambiguous non-electricity section markers
    if (/^(GAS|Natural\s+Gas|BROADBAND|Broadband(?:\s+charges?)?|MOBILE|Mobile|Fibre|Internet|Phone)\s*$/i.test(raw)) return true;
  }

  // Inline fuel-type cues (immediate adjacency)
  const ctx = text.slice(Math.max(0, idx - 60), Math.min(text.length, idx + 30)).toLowerCase();
  if (/\bconversion\s*factor|\bcubic\s*metre|\bdual\s*fuel|\bfibre\b/.test(ctx)) return true;
  return false;
}

function findTotalKwh(text) {
  // Strategy: sum all kWh bands, skipping matches in gas/broadband/annual-summary context
  const bandKwh = [];

  // Pattern A: "N kWh @ RATE cents" or "N kWh x RATE cents" (Contact, Mercury)
  for (const m of text.matchAll(/(\d{1,4}(?:\.\d+)?)\s*k\s*wh\s*[@x×]\s*[\d.]+\s*(?:c|cents?|dollars?)/gi)) {
    const n = parseFloat(m[1]);
    if (!(n > 0 && n < 20000)) continue;
    if (isNonElectricityContext(text, m.index)) continue;
    bandKwh.push(n);
  }

  // Pattern B: "NNN @ RR.RR c/unit" (Genesis — "unit" means kWh)
  for (const m of text.matchAll(/(?:^|[\s\n])(\d{1,4}(?:\.\d+)?)\s*@\s*[\d.]+\s*c\/unit/gi)) {
    const n = parseFloat(m[1]);
    if (!(n > 0 && n < 20000)) continue;
    if (isNonElectricityContext(text, m.index)) continue;
    bandKwh.push(n);
  }

  // Pattern C: "Units Used 141" column (Genesis table)
  for (const m of text.matchAll(/units?\s+used[^\n\d]{0,40}(\d{1,4})/gi)) {
    const n = parseFloat(m[1]);
    if (!(n > 0 && n < 20000)) continue;
    if (isNonElectricityContext(text, m.index)) continue;
    bandKwh.push(n);
  }

  if (bandKwh.length) return +bandKwh.reduce((s, n) => s + n, 0).toFixed(2);

  // Fallback: pick max kWh anywhere, still skipping gas/broadband context
  const nums = [];
  for (const m of text.matchAll(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*k\s*wh\b/gi)) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!(n > 0 && n < 100000)) continue;
    if (isNonElectricityContext(text, m.index)) continue;
    nums.push(n);
  }
  return nums.length ? Math.max(...nums) : null;
}

function findBandKwh(text, labelRe) {
  const patterns = [
    new RegExp(labelRe.source + '[^\\n]{0,120}?(\\d{1,4}(?:\\.\\d+)?)\\s*k\\s*wh', 'i'),
    new RegExp(labelRe.source + '[^\\n]{0,120}?(\\d{1,4})\\s*@\\s*[\\d.]+\\s*c\\/unit', 'i'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      if (isNonElectricityContext(text, m.index)) continue;
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0) return +n.toFixed(2);
    }
  }
  return null;
}

function findBandRate(text, labelRe) {
  // Covers:
  //   "X kWh @ 28.900 cents per kWh"  (Contact)
  //   "X kWh x 20.96 cents"           (Mercury)
  //   "X @ 25.3900 c/unit"            (Genesis)
  //   "$0.28/kWh"                     (generic)
  const patterns = [
    new RegExp(labelRe.source + "[^\\n]{0,120}?\\d[\\d,.]*\\s*k?\\s*wh\\s*[@x×]\\s*(\\d+(?:\\.\\d{1,5})?)\\s*(?:c|cents?)", 'i'),
    new RegExp(labelRe.source + "[^\\n]{0,120}?\\d[\\d,.]*\\s*@\\s*(\\d+(?:\\.\\d{1,5})?)\\s*c\\/unit", 'i'),
    new RegExp(labelRe.source + "[^\\n]{0,120}?\\$\\s*([0-9]+\\.[0-9]{1,5})\\s*\\/?\\s*(?:k\\s*wh|unit)", 'i'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    let n = parseFloat(m[1]);
    if (isNaN(n)) continue;
    // If the raw pattern was a cents/c/unit match, convert to dollars
    if (n > 1.5) n = n / 100;
    return +n.toFixed(4);
  }
  return null;
}

function findTotalCost(text) {
  // Preferred: electricity-specific totals (Mercury bills have both electricity + gas)
  const elecPrimary = text.match(/electricity\s+total[^\n\d]*\$\s*([0-9][\d,]*\.\d{2})/i);
  if (elecPrimary) {
    const n = parseFloat(elecPrimary[1].replace(/,/g, ''));
    if (n > 5 && n < 50000) return n;
  }
  const elecIncGst = text.match(/total\s+current\s+electricity\s+charges[^\n]*?\$\s*([0-9][\d,]*\.\d{2})/i);
  if (elecIncGst) {
    const n = parseFloat(elecIncGst[1].replace(/,/g, ''));
    if (n > 5 && n < 50000) return n;
  }

  // Second pass: "Total Amount Due", handling multiline and skipping GST-labelled amounts
  const labels = [
    /\btotal\s+(?:amount\s+)?(?:due|payable|owing|to\s+pay|this\s+bill)\b/i,
    /\bamount\s+due\b/i,
    /\bamount\s+to\s+pay\b/i,
    /\bplease\s+pay\b/i,
    /\btotal\s+current\s+charges\b/i,
  ];
  for (const re of labels) {
    const m = text.match(re);
    if (!m) continue;
    const start = m.index;
    const nearby = text.slice(start, start + 400);
    // Iterate candidate $X.XX amounts, skipping ones that are labelled as GST / discount / credit / small fractions
    for (const am of nearby.matchAll(/\$?\s*([0-9][\d,]{0,9}\.\d{2})/g)) {
      const before = nearby.slice(Math.max(0, am.index - 40), am.index).toLowerCase();
      if (/\bgst\b|\bdiscount\b|\bcredit\b|\bincludes?\b|\bof\s*$/.test(before)) continue;
      const n = parseFloat(am[1].replace(/,/g, ''));
      if (n > 5 && n < 50000) return n;
    }
  }

  // Fallback: largest $-amount that isn't labelled GST/discount
  const amounts = [];
  for (const m of text.matchAll(/\$\s*([0-9][\d,]*\.\d{2})/g)) {
    const before = text.slice(Math.max(0, m.index - 40), m.index).toLowerCase();
    if (/\bgst\b|\bdiscount\b|\bcredit\b/.test(before)) continue;
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (n > 5 && n < 50000) amounts.push(n);
  }
  return amounts.length ? Math.max(...amounts) : null;
}

function findDailyFixedCharge(text) {
  // NZ bill formats:
  //   "31 days @ 2.950 dollars per day"              → $2.95   (Contact)
  //   "30 days @ 237.5600 c/day"                      → $2.376  (Genesis)
  //   "28 Days x 272.00 cents"                        → $2.72   (Mercury)
  //   "Daily fixed charge ... $2.95/day"              → $2.95
  const patterns = [
    { re: /(\d{1,3})\s*days?\s*[@x]\s*(\d+(?:\.\d+)?)\s*dollars?\s*(?:per\s*day)?/i,  asDollars: true },
    { re: /(\d{1,3})\s*days?\s*[@x]\s*(\d+(?:\.\d+)?)\s*c(?:ents?)?(?:\/day)?/i,      asDollars: false }, // cents → dollars
    { re: /daily\s+(?:fixed\s+)?charge[^\n]*?\$\s*(\d+(?:\.\d+)?)\s*(?:\/|per)?\s*day/i, asDollars: true, group: 1 },
    { re: /daily\s+fee[^\n]*?\$?\s*(\d+(?:\.\d+)?)/i, asDollars: true, group: 1 },
  ];
  for (const p of patterns) {
    const m = text.match(p.re);
    if (!m) continue;
    const n = parseFloat(m[p.group ?? 2]);
    if (isNaN(n)) continue;
    const dollars = p.asDollars ? n : n / 100;
    // Sanity check: daily charges are usually $0.50 to $4.00
    if (dollars > 0.1 && dollars < 10) return +dollars.toFixed(4);
  }
  return null;
}

function findGst(text, totalCost) {
  const m = text.match(/\bgst\b[^\n]{0,30}?\$?\s*([0-9][\d,]*\.\d{2})/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  // Derive from total if not present (NZ GST = 15%, included)
  if (totalCost != null) return +(totalCost / 1.15 * 0.15).toFixed(2);
  return null;
}

function findPromptDiscount(text) {
  const m = text.match(/(?:prompt\s+payment|early\s+payment|pay\s+on\s+time)\s+discount[^\n]*?\$?\s*(-?\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function findSolarExport(text) {
  const m = text.match(/(?:solar\s+export|exported|buy\s*back|generation\s+export)[^\n]{0,60}?(\d[\d,.]*)\s*k\s*wh/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return isNaN(n) ? null : +n.toFixed(2);
}

function findSolarExportCredit(text) {
  const m = text.match(/(?:solar\s+export\s+credit|buy\s*back\s+credit|solar\s+credit|export\s+credit)[^\n]*?\$?\s*(-?\d+(?:\.\d+)?)/i);
  return m ? Math.abs(parseFloat(m[1])) : null;
}

function findPrevPeriodKwh(text) {
  const m = text.match(/(?:previous|last)\s+(?:period|bill|month)[^\n]{0,80}?(\d[\d,.]*)\s*k\s*wh/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return isNaN(n) ? null : +n.toFixed(2);
}

function findPrevPeriodCost(text) {
  const m = text.match(/(?:previous|last)\s+(?:period|bill|month)[^\n]{0,100}?\$\s*([0-9][\d,]*\.\d{2})/i);
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

function findAccountNumber(text) {
  // Must be 6-12 digits (with optional spaces). Avoid matching words like "Actual" or "Number".
  const patterns = [
    /(?:account|customer|client)\s*(?:no\.?|number|#)?\s*[:\-]?\s*((?:\d[\d\s]{5,14}\d))/i,
    /\bCONAC\s+([A-Z0-9]{10,25})/i, // Contact's CONAC barcode reference
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const cleaned = m[1].replace(/\s+/g, '').trim();
      if (/^\d{6,15}$/.test(cleaned) || /^[A-Z0-9]{10,25}$/.test(cleaned)) return cleaned;
    }
  }
  return null;
}

function findIcpNumber(text) {
  // NZ ICP = 10-15 chars alphanumeric, usually starting with digit or letter
  const m = text.match(/\bicp\b\s*(?:no|number)?\s*[:\-]?\s*([A-Z0-9]{10,15})/i);
  return m ? m[1].trim().toUpperCase() : null;
}

function findPlanName(text, retailer) {
  const planRe = /(?:plan|product|pricing\s+plan|on\s+the|you'?re\s+on)\s*[:\-]?\s*([A-Z][A-Za-z0-9 +]{2,40})/;
  const m = text.match(planRe);
  if (m) return m[1].trim().replace(/\s{2,}/g, ' ').slice(0, 60);
  // Retailer-specific plan inference
  const lower = text.toLowerCase();
  if (lower.includes('mercury mega')) return 'Mercury Mega';
  if (lower.includes('dream charge')) return 'Contact Dream Charge';
  if (lower.includes('basic plan'))   return 'Basic Plan';
  if (lower.includes('good night'))   return 'Good Night';
  if (lower.includes('moveable')) return 'Moveable';
  return null;
}

function findUserType(text) {
  if (/\blow\s*-?\s*user\b/i.test(text)) return 'low_user';
  if (/\bstandard\s*user\b/i.test(text)) return 'standard_user';
  return null;
}

function findDueDate(text) {
  const m = text.match(/(?:due\s+date|due\s+by|please\s+pay\s+by)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
  if (!m) return null;
  return toIsoDate(m[1]);
}

function findBillingPeriod(text) {
  const re1 = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s*(?:-|to|–|—|until)\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;
  const re2 = /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s*(?:-|to|–|—|until)\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i;
  const m = text.match(re1) || text.match(re2);
  if (!m) return null;
  const start = toIsoDate(m[1]);
  const end   = toIsoDate(m[2]);
  if (!start || !end) return null;
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  return { start, end, days };
}

function findDays(text) {
  const m = text.match(/(?:for|over|across)\s*(\d{2,3})\s*days?/i)
         || text.match(/(\d{2,3})\s*day\s*(?:billing\s*)?period/i);
  return m ? parseInt(m[1], 10) : null;
}

function toIsoDate(s) {
  if (!s) return null;
  const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m1) {
    let [_, d, mo, y] = m1;
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const months = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
  const m2 = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m2) {
    const d  = m2[1].padStart(2, '0');
    const mo = months[m2[2].slice(0, 3).toLowerCase()];
    if (!mo) return null;
    return `${m2[3]}-${String(mo).padStart(2, '0')}-${d}`;
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════
// Deep analysis
// ══════════════════════════════════════════════════════════════════
function buildAnalysis(e, rawText) {
  const kwh   = e.total_kwh;
  const cost  = e.total_cost;
  const days  = e.billing_days || 30;
  const rate  = e.avg_cost_per_kwh;
  const daily = e.avg_daily_kwh;

  const monthlyKwh  = daily ? round(daily * 30, 0) : (kwh ? round(kwh * (30 / days), 0) : null);
  const annualKwh   = daily ? round(daily * 365, 0) : (monthlyKwh ? monthlyKwh * 12 : null);
  const monthlyCost = (cost && days) ? round(cost * (30 / days), 2) : null;
  const annualCost  = monthlyCost != null ? round(monthlyCost * 12, 0) : null;

  // Fixed vs variable cost breakdown (only if the math makes sense)
  let fixedTotal = (e.daily_fixed_charge != null && days) ? +(e.daily_fixed_charge * days).toFixed(2) : null;
  // Sanity: if daily_fixed_charge was misread as a total ($ >= total_cost), drop it
  if (fixedTotal != null && cost != null && fixedTotal >= cost) fixedTotal = null;
  const variableTotal = (cost != null && fixedTotal != null) ? Math.max(0, +(cost - fixedTotal).toFixed(2)) : null;
  const fixedShare    = (cost && fixedTotal != null)    ? Math.min(1, round(fixedTotal / cost, 4))    : null;
  const variableShare = (cost && variableTotal != null) ? Math.min(1, round(variableTotal / cost, 4)) : null;

  // Consumption bands
  const bandTotal = (e.peak_kwh || 0) + (e.off_peak_kwh || 0) + (e.night_kwh || 0) + (e.controlled_kwh || 0);
  const bandSplit = bandTotal > 0
    ? {
        peak_pct:       round((e.peak_kwh || 0)       / bandTotal * 100, 1),
        off_peak_pct:   round((e.off_peak_kwh || 0)   / bandTotal * 100, 1),
        night_pct:      round((e.night_kwh || 0)      / bandTotal * 100, 1),
        controlled_pct: round((e.controlled_kwh || 0) / bandTotal * 100, 1),
      }
    : null;

  // Usage band vs NZ avg
  let usageBand = 'unknown', usageVsAvg = null;
  if (annualKwh) {
    usageVsAvg = round((annualKwh / NZ_AVG_HOUSEHOLD_ANNUAL_KWH - 1) * 100, 0);
    usageBand = annualKwh < 4500 ? 'low'
             : annualKwh < 7500 ? 'average'
             : annualKwh < 11000 ? 'high'
             : 'very-high';
  }

  // Rate band
  let rateBand = 'unknown', rateVsAvg = null;
  if (rate) {
    rateVsAvg = round((rate / NZ_AVG_EFFECTIVE_RATE - 1) * 100, 0);
    rateBand = rate < 0.28 ? 'below-market' : rate < 0.34 ? 'market' : 'above-market';
  }

  // ── Solar fit: 4 scenarios (3 / 5 / 7 / 10 kW) ──
  const scenarios = annualKwh ? [3, 5, 7, 10].map(kw => solarScenario(kw, annualKwh, rate || NZ_AVG_EFFECTIVE_RATE)) : [];
  // Pick the recommended system size: smallest that covers 80-100% of usage
  const recommended = scenarios.find(s => s.bill_offset_pct >= 80 && s.bill_offset_pct <= 110) || scenarios[scenarios.length - 1];

  // ── Battery scenario (using recommended size) ──
  const withBattery = annualKwh && recommended
    ? solarBatteryScenario(recommended.system_kw, annualKwh, rate || NZ_AVG_EFFECTIVE_RATE)
    : null;

  // ── CO2 ──
  const currentCo2Kg  = annualKwh ? round(annualKwh * NZ_GRID_CO2_KG_PER_KWH, 1) : null;
  const avoidedCo2Kg  = recommended ? round(recommended.annual_generation_kwh * NZ_GRID_CO2_KG_PER_KWH, 1) : null;
  const avoidedCo2Tonnes25yr = avoidedCo2Kg ? round(avoidedCo2Kg * 25 / 1000, 1) : null;
  const treesEquivalent = avoidedCo2Kg ? Math.round(avoidedCo2Kg / NZ_AVG_TREE_CO2_KG_PER_YR) : null;

  // ── Retailer switching analysis ──
  const cheaperRetailers = annualKwh ? findCheaperRetailers(e.retailer, rate || NZ_AVG_EFFECTIVE_RATE, annualKwh) : [];
  const switchSavingAnnual = cheaperRetailers[0]?.annual_saving || null;

  // ── Load fingerprint (appliance inference) ──
  const loadProfile = inferLoadProfile(e, daily, bandSplit);

  // ── Period-over-period change ──
  let periodDelta = null;
  if (e.prev_period_kwh && kwh) {
    const pct = round((kwh - e.prev_period_kwh) / e.prev_period_kwh * 100, 1);
    periodDelta = { kwh_delta: +(kwh - e.prev_period_kwh).toFixed(1), pct_change: pct };
  }

  // ── Bill shock detection ──
  const billShock = periodDelta && Math.abs(periodDelta.pct_change) > 25;

  // ── Break-even ──
  const breakEvenYears = recommended?.payback_years || null;

  // ── Recommendations (expanded) ──
  const recs = buildRecommendations({ e, usageBand, usageVsAvg, rateBand, rateVsAvg, bandSplit, recommended, withBattery, cheaperRetailers, loadProfile, periodDelta, billShock });

  return {
    // Normalised headline metrics
    monthly_kwh:       monthlyKwh,
    annual_kwh:        annualKwh,
    monthly_cost:      monthlyCost,
    annual_cost:       annualCost,

    // Cost structure
    fixed_cost_total:      fixedTotal,
    variable_cost_total:   variableTotal,
    fixed_cost_share:      fixedShare,
    variable_cost_share:   variableShare,

    // Bill composition
    band_split:            bandSplit,

    // Benchmarks
    usage_band:            usageBand,
    usage_vs_avg_pct:      usageVsAvg,
    rate_band:             rateBand,
    rate_vs_avg_pct:       rateVsAvg,
    benchmark_annual_kwh:  NZ_AVG_HOUSEHOLD_ANNUAL_KWH,
    benchmark_rate:        NZ_AVG_EFFECTIVE_RATE,

    // Solar scenarios
    scenarios,
    recommended_scenario:  recommended,
    battery_scenario:      withBattery,

    // CO2
    current_co2_kg:        currentCo2Kg,
    avoided_co2_kg_annual: avoidedCo2Kg,
    avoided_co2_tonnes_25yr: avoidedCo2Tonnes25yr,
    trees_equivalent:      treesEquivalent,

    // Retailer switching
    cheaper_retailers:     cheaperRetailers,
    switch_saving_annual:  switchSavingAnnual,

    // Load inference
    load_profile:          loadProfile,

    // Trends
    period_delta:          periodDelta,
    bill_shock:            billShock,

    // Headline for UI
    break_even_years:      breakEvenYears,
    estimated_25yr_saving: recommended?.saving_25yr || null,

    recommendations:       recs,
    text_length:           (rawText || '').length,
  };
}

// ── Solar scenario (no battery) ──
function solarScenario(systemKw, annualKwh, rate) {
  const generation  = systemKw * NZ_SOLAR_YIELD_KWH_PER_KW;
  const selfUsed    = generation * NZ_AVG_SELF_CONSUMPTION;
  const exported    = generation * (1 - NZ_AVG_SELF_CONSUMPTION);
  const billOffset  = Math.min(selfUsed, annualKwh); // what self-consumption actually offsets
  const annualSaving = billOffset * rate + exported * NZ_AVG_BUY_BACK_RATE;
  const cost        = systemKw * SOLAR_COST_PER_KW;
  const offsetPct   = round(billOffset / annualKwh * 100, 0);
  const payback     = annualSaving > 0 ? round(cost / annualSaving, 1) : null;
  const panels      = Math.ceil(systemKw * 2.5); // ~400W panels

  return {
    system_kw: systemKw,
    panel_count: panels,
    system_cost: cost,
    annual_generation_kwh: round(generation, 0),
    self_consumed_kwh: round(selfUsed, 0),
    exported_kwh: round(exported, 0),
    bill_offset_pct: offsetPct,
    annual_saving: round(annualSaving, 0),
    payback_years: payback,
    saving_25yr: round(annualSaving * 25, 0),
    net_25yr: round(annualSaving * 25 - cost, 0),
  };
}

function solarBatteryScenario(systemKw, annualKwh, rate) {
  const generation = systemKw * NZ_SOLAR_YIELD_KWH_PER_KW;
  const selfUsed   = generation * NZ_AVG_SELF_CONSUMPTION_BATTERY;
  const exported   = generation * (1 - NZ_AVG_SELF_CONSUMPTION_BATTERY);
  const billOffset = Math.min(selfUsed, annualKwh);
  const annualSaving = billOffset * rate + exported * NZ_AVG_BUY_BACK_RATE;
  const cost         = systemKw * SOLAR_COST_PER_KW + BATTERY_COST;
  const offsetPct    = round(billOffset / annualKwh * 100, 0);
  const payback      = annualSaving > 0 ? round(cost / annualSaving, 1) : null;

  return {
    system_kw: systemKw,
    battery_kwh: 10,
    system_cost: cost,
    annual_saving: round(annualSaving, 0),
    payback_years: payback,
    saving_25yr: round(annualSaving * 25, 0),
    net_25yr: round(annualSaving * 25 - cost, 0),
    bill_offset_pct: offsetPct,
  };
}

function findCheaperRetailers(currentRetailer, currentRate, annualKwh) {
  const others = Object.entries(RETAILER_AVG_RATE)
    .filter(([name]) => name !== currentRetailer)
    .map(([name, r]) => ({
      name,
      avg_rate: r,
      annual_saving: round((currentRate - r) * annualKwh, 0),
    }))
    .filter(x => x.annual_saving > 50)
    .sort((a, b) => b.annual_saving - a.annual_saving)
    .slice(0, 5);
  return others;
}

function inferLoadProfile(e, daily, bandSplit) {
  const hints = [];
  if (daily && daily > 35) hints.push({ tag: 'heavy_load', description: 'Very heavy daily load — likely electric heating or multiple high-draw appliances.' });
  if (e.controlled_kwh && e.controlled_kwh > 0) hints.push({ tag: 'hot_water_controlled', description: 'Ripple-controlled circuit detected — typical of electric hot-water cylinder on night rate.' });
  if (bandSplit && bandSplit.night_pct > 35) hints.push({ tag: 'night_heavy', description: 'Most usage runs overnight — consistent with electric hot-water + heating timers.' });
  if (bandSplit && bandSplit.peak_pct > 60) hints.push({ tag: 'peak_heavy', description: 'Heavy daytime/peak usage — solar + battery would have a big impact here.' });
  if (daily && daily > 50) hints.push({ tag: 'possible_ev', description: 'Usage profile is consistent with EV charging (>50 kWh/day).' });
  if (e.peak_rate && e.off_peak_rate && e.peak_rate / e.off_peak_rate > 1.8) hints.push({ tag: 'high_tou_spread', description: 'Strong time-of-use price gap — shifting loads to off-peak could cut the bill 10-20%.' });
  return hints;
}

function buildRecommendations({ e, usageBand, usageVsAvg, rateBand, rateVsAvg, bandSplit, recommended, withBattery, cheaperRetailers, loadProfile, periodDelta, billShock }) {
  const recs = [];

  if (recommended && recommended.payback_years) {
    recs.push({
      category: 'solar',
      title: `${recommended.system_kw} kW solar is the best fit`,
      tip: `A ${recommended.system_kw} kW / ${recommended.panel_count}-panel system covers ~${recommended.bill_offset_pct}% of your annual usage, saving about $${recommended.annual_saving.toLocaleString()}/year. Payback in ${recommended.payback_years} years.`,
      priority: 'high',
    });
  }

  if (withBattery) {
    const extraSaving = recommended ? withBattery.annual_saving - recommended.annual_saving : withBattery.annual_saving;
    recs.push({
      category: 'battery',
      title: 'Adding a 10 kWh battery lifts savings',
      tip: `A battery pushes self-consumption from ~40% to ~80%, adding about $${Math.round(extraSaving).toLocaleString()}/year in bill savings (payback ~${withBattery.payback_years} years).`,
      priority: 'medium',
    });
  }

  if (cheaperRetailers[0]) {
    const c = cheaperRetailers[0];
    recs.push({
      category: 'retailer',
      title: `Switching to ${c.name} could save ~$${c.annual_saving.toLocaleString()}/yr`,
      tip: `${c.name} averages $${c.avg_rate}/kWh — you're currently on $${e.avg_cost_per_kwh || NZ_AVG_EFFECTIVE_RATE}/kWh. Switching is free and takes ~15 mins online.`,
      priority: 'medium',
    });
  }

  if (usageBand === 'high' || usageBand === 'very-high') {
    recs.push({
      category: 'usage',
      title: 'Your household is a high-consumption user',
      tip: `You're using ~${usageVsAvg}% more than the NZ average (7,000 kWh/yr). Hot-water timing, heat-pump scheduling, and LED lighting can cut 10-15% before solar.`,
      priority: 'medium',
    });
  }

  if (rateBand === 'above-market') {
    recs.push({
      category: 'rate',
      title: 'Your effective rate is above market',
      tip: `You're paying ~${rateVsAvg}% above the NZ average. Renegotiating your plan or switching retailer is the fastest saving.`,
      priority: 'high',
    });
  }

  if (bandSplit && bandSplit.peak_pct > 55) {
    recs.push({
      category: 'load',
      title: 'Most of your usage is in peak hours',
      tip: 'Run dishwasher, washing machine and dryer on delayed-start so they finish after 11 pm. Pair with solar to crush daytime usage.',
      priority: 'medium',
    });
  }

  if (loadProfile.some(l => l.tag === 'hot_water_controlled')) {
    recs.push({
      category: 'hotwater',
      title: 'Install a solar diverter for hot water',
      tip: 'Your ripple-controlled hot-water circuit is perfect for a solar diverter — routes excess solar directly to the cylinder instead of exporting at low buy-back.',
      priority: 'low',
    });
  }

  if (billShock) {
    recs.push({
      category: 'alert',
      title: `Bill shock — usage changed ${periodDelta.pct_change}% vs last period`,
      tip: 'Check for seasonal swings (heating/AC), new appliances, or a meter-read estimate. Worth contacting the retailer if unexplained.',
      priority: 'high',
    });
  }

  if (e.daily_fixed_charge && e.daily_fixed_charge > 2.0) {
    recs.push({
      category: 'fixed',
      title: 'High daily fixed charge',
      tip: 'You might be on a standard-user plan but qualify for low-user pricing (<8,000 kWh/yr). Ask your retailer to switch — saves $200-$400/yr.',
      priority: 'low',
    });
  }

  if (!recs.length && e.total_kwh) {
    recs.push({
      category: 'generic',
      title: 'Solar is a strong fit for this home',
      tip: 'Based on your usage, a 5-6 kW rooftop system would significantly reduce your bill.',
      priority: 'medium',
    });
  }

  return recs;
}

function round(n, digits = 0) {
  if (n == null || isNaN(n)) return null;
  return +Number(n).toFixed(digits);
}

function emptyAnalysis(rawText) {
  return {
    recommendations: [{ category: 'system', title: 'Text extraction limited', tip: "We couldn't read enough of this file to run analysis. Please try a clearer PDF scan or a text-based bill.", priority: 'high' }],
    text_length: (rawText || '').length,
  };
}
