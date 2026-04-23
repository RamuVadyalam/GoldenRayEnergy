// ════════════════════════════════════════════════════════════════════
// n8n → Goldenray webhook endpoints.
//
// Any n8n workflow can hit these to query the CRM, mutate data, or
// trigger a background job. Protected by HMAC signature when
// N8N_WEBHOOK_SECRET is set, otherwise open (useful for local dev).
//
//   POST /webhooks/n8n/query          — run a light SELECT against an allow-listed table
//   POST /webhooks/n8n/contact        — create/update a contact
//   POST /webhooks/n8n/activity       — log an activity
//   POST /webhooks/n8n/order-status   — update an order status
//   POST /webhooks/n8n/job/:name      — manually trigger one of our cron jobs
//   GET  /webhooks/n8n/events/since   — polling endpoint ?since=ISO&kinds=orders,leads,bills
// ════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifySignature, isConfigured } from '../services/n8nDispatch.js';
import {
  buildDailyDigest, markOverdueTasks, decayLeadScores, autoCancelStaleOrders,
  cleanupStaleBillUploads, checkLowStock, autoCreateFollowUpTasks,
  autoPromoteLeadStages, supabaseKeepAlive,
} from '../jobs/scheduler.js';

const router = Router();

// ── Status ping (public — no signature required) ──
router.get('/status', (req, res) => {
  res.json({
    ok: true,
    outbound_configured: isConfigured(),
    signed: Boolean(process.env.N8N_WEBHOOK_SECRET),
    timestamp: new Date().toISOString(),
  });
});

// ── HMAC guard middleware (reads raw body set by upstream json-parse) ──
router.use((req, res, next) => {
  if (!process.env.N8N_WEBHOOK_SECRET) return next(); // open mode for local dev
  const raw = JSON.stringify(req.body);
  if (!verifySignature(raw, req.headers['x-goldenray-signature'])) {
    return res.status(401).json({ error: 'invalid signature' });
  }
  next();
});

// ── Query allow-listed tables ──
const READ_TABLES = ['contacts', 'orders', 'product_enquiries', 'finance_applications', 'power_bill_uploads', 'products', 'tasks', 'activities'];

router.post('/query', async (req, res) => {
  try {
    const { table, eq = {}, gte = {}, limit = 50 } = req.body || {};
    if (!READ_TABLES.includes(table)) return res.status(400).json({ error: `table "${table}" not allow-listed`, allowed: READ_TABLES });

    let q = supabaseAdmin.from(table).select('*').limit(Math.min(limit, 500));
    Object.entries(eq).forEach(([k, v]) => { q = q.eq(k, v); });
    Object.entries(gte).forEach(([k, v]) => { q = q.gte(k, v); });

    const { data, error } = await q;
    if (error) throw error;
    res.json({ count: data.length, rows: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Upsert a contact (e.g. from Google Sheets sync, Mailchimp subscribe) ──
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, source = 'n8n', ...rest } = req.body || {};
    if (!email && !phone) return res.status(400).json({ error: 'email or phone required' });

    // If an email match exists, update; else insert.
    let contact;
    if (email) {
      const { data: existing } = await supabaseAdmin.from('contacts').select('id').eq('email', email).maybeSingle();
      if (existing) {
        const { data } = await supabaseAdmin.from('contacts').update({ name, phone, source, ...rest }).eq('id', existing.id).select().single();
        contact = data;
      }
    }
    if (!contact) {
      const { data } = await supabaseAdmin.from('contacts').insert({ name: name || email, email, phone, source, stage: 'new', type: 'residential', ...rest }).select().single();
      contact = data;
    }
    res.status(201).json(contact);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Log an activity ──
router.post('/activity', async (req, res) => {
  try {
    const { type = 'system', description, contact_id, deal_id, metadata } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description required' });
    const { data, error } = await supabaseAdmin.from('activities').insert({ type, description, contact_id, deal_id, metadata }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Update an order status (e.g. "Xero invoice paid" triggers mark-as-paid) ──
router.post('/order-status', async (req, res) => {
  try {
    const { order_number, status, payment_status, notes } = req.body || {};
    if (!order_number) return res.status(400).json({ error: 'order_number required' });
    const update = {};
    if (status) update.status = status;
    if (payment_status) update.payment_status = payment_status;
    if (notes) update.notes = notes;
    const { data, error } = await supabaseAdmin.from('orders').update(update).eq('order_number', order_number).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Trigger a cron job on demand ──
const JOB_MAP = {
  'digest':               buildDailyDigest,
  'overdue-tasks':        markOverdueTasks,
  'decay-lead-scores':    decayLeadScores,
  'auto-cancel-orders':   autoCancelStaleOrders,
  'cleanup-stale-bills':  cleanupStaleBillUploads,
  'low-stock':            () => checkLowStock(5),
  'auto-follow-up':       autoCreateFollowUpTasks,
  'promote-stages':       autoPromoteLeadStages,
  'keep-alive':           supabaseKeepAlive,
};
router.post('/job/:name', async (req, res) => {
  const job = JOB_MAP[req.params.name];
  if (!job) return res.status(404).json({ error: 'unknown job', available: Object.keys(JOB_MAP) });
  try { res.json({ success: true, result: await job() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Polling endpoint: anything created since ISO timestamp across key tables ──
router.get('/events/since', async (req, res) => {
  try {
    const since = req.query.since || new Date(Date.now() - 3600 * 1000).toISOString();
    const kinds = String(req.query.kinds || 'orders,leads,bills,enquiries,finance').split(',');
    const out = {};

    if (kinds.includes('orders')) {
      const { data } = await supabaseAdmin.from('orders').select('id,order_number,total,status,first_name,last_name,email,created_at').gte('created_at', since).limit(200);
      out.orders = data || [];
    }
    if (kinds.includes('leads')) {
      const { data } = await supabaseAdmin.from('contacts').select('id,name,email,phone,source,stage,estimated_value,lead_score,created_at').gte('created_at', since).limit(200);
      out.leads = data || [];
    }
    if (kinds.includes('bills')) {
      const { data } = await supabaseAdmin.from('power_bill_uploads').select('id,retailer,total_kwh,total_cost,analysis_json,created_at').gte('created_at', since).limit(200);
      out.bills = data || [];
    }
    if (kinds.includes('enquiries')) {
      const { data } = await supabaseAdmin.from('product_enquiries').select('*').gte('created_at', since).limit(200);
      out.enquiries = data || [];
    }
    if (kinds.includes('finance')) {
      const { data } = await supabaseAdmin.from('finance_applications').select('*').gte('created_at', since).limit(200);
      out.finance = data || [];
    }
    res.json({ since, ...out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
