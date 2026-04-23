import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { extractBill } from '../services/billExtractor.js';
import { fire as fireN8n } from '../services/n8nDispatch.js';

const router = Router();

// In-memory file buffer (we don't keep the file — just OCR, parse, store results)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ── Public: upload + extract ──────────────────────────────────────────
router.post('/upload', upload.single('bill'), async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Field name must be "bill".' });

    const { originalname, mimetype, size, buffer } = req.file;
    const meta = req.body || {};

    const { rawText, status, extracted, analysis } = await extractBill(buffer, mimetype, originalname);

    // ── Optional: link to existing contact by email, else create one ──
    let contactId = null;
    if (meta.email || meta.phone) {
      try {
        const fullName = [meta.firstName, meta.lastName].filter(Boolean).join(' ').trim() || meta.email || 'Bill Uploader';
        const { data: contact } = await supabaseAdmin
          .from('contacts')
          .insert({
            name:            fullName,
            email:           meta.email || null,
            phone:           meta.phone || null,
            location:        meta.address || null,
            type:            'residential',
            system_type:     'on-grid',
            stage:           'new',
            source:          'website_bill_upload',
            lifecycle:       'lead',
            monthly_bill:    analysis?.monthly_cost || null,
            estimated_value: analysis?.est_solar_kw ? analysis.est_solar_kw * 1500 : null,
            lead_score:      60,
            last_activity:   `Uploaded power bill — ${originalname}`,
            notes:           `Detected ${extracted.total_kwh || '?'} kWh / $${extracted.total_cost || '?'} (${extracted.retailer || 'unknown retailer'})`,
          })
          .select('id')
          .single();
        if (contact) contactId = contact.id;
      } catch (e) { console.warn('Contact mirror failed:', e.message); }
    }

    // ── Persist the upload ──
    const { data: row, error } = await supabaseAdmin
      .from('power_bill_uploads')
      .insert({
        contact_id:           contactId,
        uploader_name:        [meta.firstName, meta.lastName].filter(Boolean).join(' ').trim() || null,
        uploader_email:       meta.email || null,
        uploader_phone:       meta.phone || null,
        uploader_address:     meta.address || null,
        region:               extracted.region || null,

        file_name:            originalname,
        file_size:            size,
        mime_type:            mimetype,

        raw_text:             rawText ? rawText.slice(0, 50000) : null,

        retailer:             extracted.retailer || null,
        account_number:       extracted.account_number || null,
        icp_number:           extracted.icp_number || null,
        plan_name:            extracted.plan_name || null,
        user_type:            extracted.user_type || null,

        billing_period_start: extracted.billing_period_start,
        billing_period_end:   extracted.billing_period_end,
        billing_days:         extracted.billing_days,
        due_date:             extracted.due_date,

        total_kwh:            extracted.total_kwh,
        peak_kwh:             extracted.peak_kwh,
        off_peak_kwh:         extracted.off_peak_kwh,
        night_kwh:            extracted.night_kwh,
        controlled_kwh:       extracted.controlled_kwh,
        avg_daily_kwh:        extracted.avg_daily_kwh,

        peak_rate:            extracted.peak_rate,
        off_peak_rate:        extracted.off_peak_rate,
        night_rate:           extracted.night_rate,
        controlled_rate:      extracted.controlled_rate,

        total_cost:           extracted.total_cost,
        daily_fixed_charge:   extracted.daily_fixed_charge,
        avg_cost_per_kwh:     extracted.avg_cost_per_kwh,
        gst_amount:           extracted.gst_amount,
        prompt_discount:      extracted.prompt_discount,

        solar_export_kwh:     extracted.solar_export_kwh,
        solar_export_credit:  extracted.solar_export_credit,

        prev_period_kwh:      extracted.prev_period_kwh,
        prev_period_cost:     extracted.prev_period_cost,

        co2_emissions_kg:     analysis?.current_co2_kg || null,
        fixed_cost_share:     analysis?.fixed_cost_share || null,
        variable_cost_share:  analysis?.variable_cost_share || null,

        status,
        analysis_json:        analysis,
      })
      .select('id')
      .single();
    if (error) throw error;

    // Log activity for the dashboard feed
    try {
      await supabaseAdmin.from('activities').insert({
        type:        'system',
        description: `Power bill uploaded${extracted.retailer ? ' — ' + extracted.retailer : ''}${extracted.total_kwh ? ' — ' + extracted.total_kwh + ' kWh' : ''}${extracted.total_cost ? ' — $' + extracted.total_cost : ''}`,
        contact_id:  contactId,
        metadata: {
          power_bill_upload_id: row.id,
          retailer:             extracted.retailer,
          total_kwh:            extracted.total_kwh,
          total_cost:           extracted.total_cost,
          source:               'website_bill_upload',
        },
      });
    } catch (e) { console.warn('Activity log failed:', e.message); }

    // Fan out to n8n
    fireN8n('bill.uploaded', {
      upload_id: row.id, contact_id: contactId,
      retailer: extracted.retailer, total_kwh: extracted.total_kwh, total_cost: extracted.total_cost,
      recommended_kw: analysis?.recommended_scenario?.system_kw,
      annual_saving: analysis?.recommended_scenario?.annual_saving,
      status,
    });

    res.status(201).json({
      success: true,
      id: row.id,
      status,
      extracted,
      analysis,
      contact_id: contactId,
    });
  } catch (e) {
    console.error('Power bill upload error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Employee-only endpoints below ─────────────────────────────────────
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('power_bill_uploads')
      .select(`*, contact:contacts!contact_id ( name, email, phone )`)
      .order('created_at', { ascending: false });
    if (req.query.retailer) q = q.eq('retailer', req.query.retailer);
    if (req.query.region)   q = q.eq('region', req.query.region);
    if (req.query.status)   q = q.eq('status', req.query.status);
    const { data, error } = await q;
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, contact_name: r.contact?.name || null })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('power_bill_uploads')
      .select('retailer, region, plan_name, user_type, total_kwh, total_cost, avg_daily_kwh, avg_cost_per_kwh, co2_emissions_kg, fixed_cost_share, peak_kwh, off_peak_kwh, night_kwh, controlled_kwh, status, analysis_json, billing_period_end, created_at');
    if (error) throw error;

    const rows = data || [];
    const processed = rows.filter(r => r.status === 'processed');

    const byRetailer = groupAgg(processed, 'retailer');
    const byRegion   = groupAgg(processed, 'region');
    const byPlan     = groupAgg(processed, 'plan_name');
    const byUserType = groupAgg(processed, 'user_type');

    const avgKwh     = avg(processed.map(r => r.total_kwh).filter(Boolean));
    const avgCost    = avg(processed.map(r => r.total_cost).filter(Boolean));
    const avgDaily   = avg(processed.map(r => r.avg_daily_kwh).filter(Boolean));
    const avgRate    = avg(processed.map(r => r.avg_cost_per_kwh).filter(Boolean), 4);
    const avgFixedShare = avg(processed.map(r => r.fixed_cost_share).filter(v => v != null), 4);
    const totalKwh   = sum(processed.map(r => r.total_kwh).filter(Boolean));
    const totalSpend = sum(processed.map(r => r.total_cost).filter(Boolean));
    const totalCo2   = sum(processed.map(r => r.co2_emissions_kg).filter(Boolean));

    // Potential collective solar saving + CO2 avoided (summed across uploads)
    const totalRecommendedSaving = sum(processed.map(r => r.analysis_json?.recommended_scenario?.annual_saving || 0));
    const totalCo2Avoided = sum(processed.map(r => r.analysis_json?.avoided_co2_kg_annual || 0));
    const totalTrees      = sum(processed.map(r => r.analysis_json?.trees_equivalent || 0));

    const buckets = [
      { label: '0–500 kWh',   min: 0,    max: 500,      count: 0 },
      { label: '500–1,000',   min: 500,  max: 1000,     count: 0 },
      { label: '1,000–2,000', min: 1000, max: 2000,     count: 0 },
      { label: '2,000+ kWh',  min: 2000, max: Infinity, count: 0 },
    ];
    processed.forEach(r => {
      const v = Number(r.total_kwh) || 0;
      const b = buckets.find(b => v >= b.min && v < b.max);
      if (b) b.count++;
    });

    const bands = { low: 0, average: 0, high: 0, 'very-high': 0, unknown: 0 };
    processed.forEach(r => { const b = r.analysis_json?.usage_band || 'unknown'; bands[b] = (bands[b] || 0) + 1; });

    // Rate bands
    const rateBands = { 'below-market': 0, market: 0, 'above-market': 0, unknown: 0 };
    processed.forEach(r => { const b = r.analysis_json?.rate_band || 'unknown'; rateBands[b] = (rateBands[b] || 0) + 1; });

    // Aggregate band split (peak vs off-peak vs night vs controlled)
    const bandTotals = { peak: 0, off_peak: 0, night: 0, controlled: 0 };
    processed.forEach(r => {
      bandTotals.peak       += Number(r.peak_kwh || 0);
      bandTotals.off_peak   += Number(r.off_peak_kwh || 0);
      bandTotals.night      += Number(r.night_kwh || 0);
      bandTotals.controlled += Number(r.controlled_kwh || 0);
    });
    const bandTotal = bandTotals.peak + bandTotals.off_peak + bandTotals.night + bandTotals.controlled;
    const bandPie = bandTotal > 0 ? [
      { name: 'Peak',       value: +(bandTotals.peak       / bandTotal * 100).toFixed(1) },
      { name: 'Off-peak',   value: +(bandTotals.off_peak   / bandTotal * 100).toFixed(1) },
      { name: 'Night',      value: +(bandTotals.night      / bandTotal * 100).toFixed(1) },
      { name: 'Controlled', value: +(bandTotals.controlled / bandTotal * 100).toFixed(1) },
    ].filter(x => x.value > 0) : [];

    // Load-profile tag counts
    const loadTagCounts = {};
    processed.forEach(r => {
      (r.analysis_json?.load_profile || []).forEach(l => {
        loadTagCounts[l.tag] = (loadTagCounts[l.tag] || 0) + 1;
      });
    });
    const loadTags = Object.entries(loadTagCounts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);

    // Recommendation category distribution
    const recCategoryCounts = {};
    processed.forEach(r => {
      (r.analysis_json?.recommendations || []).forEach(rec => {
        recCategoryCounts[rec.category] = (recCategoryCounts[rec.category] || 0) + 1;
      });
    });
    const recCategories = Object.entries(recCategoryCounts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

    // Trend (last 6 months) — rich per-month aggregates
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = d.toISOString().slice(0, 7);
      return {
        month: key,
        label: d.toLocaleString('en-NZ', { month: 'short' }),
        year: d.getFullYear(),
        count: 0,
        kwh: 0,
        cost: 0,
        peak_kwh: 0,
        off_peak_kwh: 0,
        co2_kg: 0,
        potential_saving: 0,
        _rates: [],
      };
    });
    processed.forEach(r => {
      const d = r.billing_period_end || r.created_at;
      if (!d) return;
      const key = String(d).slice(0, 7);
      const bucket = months.find(m => m.month === key);
      if (bucket) {
        bucket.count++;
        bucket.kwh          += Number(r.total_kwh || 0);
        bucket.cost         += Number(r.total_cost || 0);
        bucket.peak_kwh     += Number(r.peak_kwh || 0);
        bucket.off_peak_kwh += Number(r.off_peak_kwh || 0);
        bucket.co2_kg       += Number(r.co2_emissions_kg || 0);
        bucket.potential_saving += Number(r.analysis_json?.recommended_scenario?.annual_saving || 0) / 12;
        if (r.avg_cost_per_kwh) bucket._rates.push(Number(r.avg_cost_per_kwh));
      }
    });
    // Derive per-month averages
    months.forEach(m => {
      m.avg_bill = m.count ? +(m.cost / m.count).toFixed(2) : 0;
      m.avg_kwh  = m.count ? Math.round(m.kwh / m.count)   : 0;
      m.avg_rate = m._rates.length ? +(m._rates.reduce((s, n) => s + n, 0) / m._rates.length).toFixed(4) : 0;
      m.kwh   = Math.round(m.kwh);
      m.cost  = Math.round(m.cost);
      m.co2_kg = Math.round(m.co2_kg);
      m.potential_saving = Math.round(m.potential_saving);
      delete m._rates;
    });

    // Period-over-period deltas (last vs prior)
    const monthsWithData = months.filter(m => m.count > 0);
    const last = monthsWithData[monthsWithData.length - 1];
    const prev = monthsWithData[monthsWithData.length - 2];
    const pctChange = (a, b) => (a && b) ? +(((a - b) / b) * 100).toFixed(1) : null;
    const trend_delta = (last && prev) ? {
      kwh_pct:   pctChange(last.kwh,    prev.kwh),
      cost_pct:  pctChange(last.cost,   prev.cost),
      rate_pct:  pctChange(last.avg_rate, prev.avg_rate),
      count_pct: pctChange(last.count,  prev.count),
      co2_pct:   pctChange(last.co2_kg, prev.co2_kg),
      last_label: last?.label,
      prev_label: prev?.label,
    } : null;

    // Retailer switch savings — pooled across customers
    const switchSavingsByRetailer = {};
    processed.forEach(r => {
      const cheapest = r.analysis_json?.cheaper_retailers?.[0];
      if (cheapest) {
        switchSavingsByRetailer[cheapest.name] = (switchSavingsByRetailer[cheapest.name] || 0) + cheapest.annual_saving;
      }
    });
    const switchSavings = Object.entries(switchSavingsByRetailer).map(([retailer, saving]) => ({ retailer, saving: Math.round(saving) })).sort((a, b) => b.saving - a.saving).slice(0, 5);

    res.json({
      total_uploads: rows.length,
      processed: processed.length,
      partial: rows.filter(r => r.status === 'partial').length,

      avg_kwh: avgKwh,
      avg_cost: avgCost,
      avg_daily_kwh: avgDaily,
      avg_cost_per_kwh: avgRate,
      avg_fixed_share: avgFixedShare,

      total_kwh: totalKwh,
      total_spend: totalSpend,
      total_co2_kg: totalCo2,
      total_recommended_saving: totalRecommendedSaving,
      total_co2_avoided: totalCo2Avoided,
      total_trees: totalTrees,

      by_retailer: byRetailer,
      by_region: byRegion,
      by_plan: byPlan,
      by_user_type: byUserType,

      buckets,
      bands,
      rate_bands: rateBands,
      band_pie: bandPie,
      load_tags: loadTags,
      rec_categories: recCategories,
      switch_savings: switchSavings,

      trend: months,
      trend_delta,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('power_bill_uploads').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('power_bill_uploads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── helpers ──
function avg(arr, digits = 2) { if (!arr.length) return null; return +(arr.reduce((s, n) => s + Number(n), 0) / arr.length).toFixed(digits); }
function sum(arr) { return arr.reduce((s, n) => s + Number(n || 0), 0); }
function groupAgg(rows, key) {
  const g = {};
  rows.forEach(r => {
    const k = r[key] || 'Unknown';
    if (!g[k]) g[k] = { name: k, count: 0, total_kwh: 0, total_cost: 0 };
    g[k].count++;
    g[k].total_kwh  += Number(r.total_kwh || 0);
    g[k].total_cost += Number(r.total_cost || 0);
  });
  return Object.values(g).sort((a, b) => b.count - a.count);
}

export default router;
