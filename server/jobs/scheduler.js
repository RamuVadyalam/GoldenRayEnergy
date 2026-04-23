// ════════════════════════════════════════════════════════════════════
// Background job scheduler
// All jobs log to console with a [cron] prefix so they are easy to grep.
// ════════════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import { sendAdminDigest, sendLowStockAlert } from '../services/emailService.js';

const TZ = 'Pacific/Auckland';
const log = (...a) => console.log('[cron]', new Date().toISOString(), ...a);
const warn = (...a) => console.warn('[cron]', new Date().toISOString(), ...a);

// ─────────────────────────────────────────────────────────────────────
// Job 1: mark overdue tasks every hour
// ─────────────────────────────────────────────────────────────────────
export async function markOverdueTasks() {
  if (!supabaseAdmin) return { updated: 0 };
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'overdue' })
      .in('status', ['todo', 'in_progress'])
      .lt('due_date', today)
      .select('id, title');
    if (error) throw error;
    log(`markOverdueTasks: ${data?.length || 0} task(s) flagged overdue`);
    return { updated: data?.length || 0 };
  } catch (e) {
    warn('markOverdueTasks error:', e.message);
    return { updated: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 2: decay lead scores on stale contacts (daily)
// -2 pts/day on contacts with stage='new' inactive > 7d; min 0
// ─────────────────────────────────────────────────────────────────────
export async function decayLeadScores() {
  if (!supabaseAdmin) return { decayed: 0 };
  try {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: stale } = await supabaseAdmin
      .from('contacts')
      .select('id, lead_score, updated_at')
      .eq('stage', 'new')
      .lt('updated_at', cutoff)
      .gt('lead_score', 0)
      .limit(500);

    let decayed = 0;
    for (const c of stale || []) {
      const newScore = Math.max(0, (c.lead_score || 0) - 2);
      if (newScore !== c.lead_score) {
        await supabaseAdmin.from('contacts').update({ lead_score: newScore }).eq('id', c.id);
        decayed++;
      }
    }
    log(`decayLeadScores: ${decayed} contact(s) decayed`);
    return { decayed };
  } catch (e) {
    warn('decayLeadScores error:', e.message);
    return { decayed: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 3: archive partial bill uploads older than 90 days (weekly)
// ─────────────────────────────────────────────────────────────────────
export async function cleanupStaleBillUploads() {
  if (!supabaseAdmin) return { deleted: 0 };
  try {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('power_bill_uploads')
      .delete()
      .eq('status', 'partial')
      .lt('created_at', cutoff)
      .select('id');
    if (error) throw error;
    log(`cleanupStaleBillUploads: deleted ${data?.length || 0} partial upload(s) >90d old`);
    return { deleted: data?.length || 0 };
  } catch (e) {
    warn('cleanupStaleBillUploads error:', e.message);
    return { deleted: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 4: auto-cancel orders that have been pending > 14 days
// ─────────────────────────────────────────────────────────────────────
export async function autoCancelStaleOrders() {
  if (!supabaseAdmin) return { cancelled: 0 };
  try {
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('status', 'pending')
      .lt('created_at', cutoff)
      .select('id, order_number');
    if (error) throw error;
    log(`autoCancelStaleOrders: ${data?.length || 0} stale order(s) cancelled`);
    return { cancelled: data?.length || 0, orders: data || [] };
  } catch (e) {
    warn('autoCancelStaleOrders error:', e.message);
    return { cancelled: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 5: build daily digest + email admins (08:00 NZ)
// ─────────────────────────────────────────────────────────────────────
export async function buildDailyDigest() {
  if (!supabaseAdmin) return null;
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [leads, enquiries, orders, bills, finance, tasks] = await Promise.all([
      supabaseAdmin.from('contacts').select('id,name,email,source,estimated_value', { count: 'exact' }).gte('created_at', since),
      supabaseAdmin.from('product_enquiries').select('id,bundle_name,market,intent,approx_value', { count: 'exact' }).gte('created_at', since),
      supabaseAdmin.from('orders').select('id,order_number,first_name,last_name,total,status', { count: 'exact' }).gte('created_at', since),
      supabaseAdmin.from('power_bill_uploads').select('id,retailer,total_kwh,total_cost', { count: 'exact' }).gte('created_at', since),
      supabaseAdmin.from('finance_applications').select('id,product,loan_amount,first_name,last_name', { count: 'exact' }).gte('created_at', since),
      supabaseAdmin.from('tasks').select('id,title', { count: 'exact' }).eq('status', 'overdue'),
    ]);

    const digest = {
      since,
      new_leads:       { count: leads.count || 0,     rows: leads.data || [] },
      product_enquiries: { count: enquiries.count || 0, rows: enquiries.data || [] },
      orders:          { count: orders.count || 0,    rows: orders.data || [] },
      bill_uploads:    { count: bills.count || 0,     rows: bills.data || [] },
      finance_apps:    { count: finance.count || 0,   rows: finance.data || [] },
      overdue_tasks:   { count: tasks.count || 0,     rows: tasks.data || [] },
      total_revenue_24h: (orders.data || []).reduce((s, o) => s + Number(o.total || 0), 0),
    };

    log(`buildDailyDigest: ${digest.new_leads.count} leads · ${digest.orders.count} orders · $${digest.total_revenue_24h.toFixed(2)} in 24h`);

    // Try to email it out
    if (sendAdminDigest) await sendAdminDigest(digest).catch(e => warn('digest email failed:', e.message));

    return digest;
  } catch (e) {
    warn('buildDailyDigest error:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 6: low-stock alert — daily 09:00
// Emails admin with products having stock_qty < threshold.
// ─────────────────────────────────────────────────────────────────────
export async function checkLowStock(threshold = 5) {
  if (!supabaseAdmin) return { low: 0 };
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, brand, sku, stock_qty')
      .eq('is_active', true)
      .lt('stock_qty', threshold)
      .order('stock_qty', { ascending: true });
    if (error) throw error;
    const low = (data || []).length;
    log(`checkLowStock: ${low} product(s) below ${threshold} units`);
    if (low > 0 && sendLowStockAlert) {
      await sendLowStockAlert(data, threshold).catch(e => warn('low-stock email failed:', e.message));
    }
    return { low, items: data || [] };
  } catch (e) {
    warn('checkLowStock error:', e.message);
    return { low: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 7: auto-create follow-up task for unworked contacts
// Runs hourly — picks contacts created < 48h ago via a website source,
// with lead_score >= 40, and NO task linked to them yet. Creates a
// "Follow up with <name>" task due in 2 days, round-robin to a sales exec.
// ─────────────────────────────────────────────────────────────────────
export async function autoCreateFollowUpTasks() {
  if (!supabaseAdmin) return { created: 0 };
  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, source, lead_score, created_at')
      .gte('created_at', since)
      .gte('lead_score', 40)
      .ilike('source', 'website_%')
      .limit(200);

    if (!contacts?.length) { log('autoCreateFollowUpTasks: no candidates'); return { created: 0 }; }

    // Find sales execs + sales managers for round-robin
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('role', ['sales_exec', 'sales_mgr'])
      .eq('is_active', true);
    const pool = users?.length ? users : null;

    let created = 0;
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      // Skip if this contact already has a follow-up task
      const { count } = await supabaseAdmin
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('contact_id', c.id)
        .eq('task_type', 'Follow-up');
      if (count && count > 0) continue;

      const assignee = pool ? pool[i % pool.length].id : null;
      const due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
      await supabaseAdmin.from('tasks').insert({
        title: `Follow up with ${c.name || 'new lead'} (${c.source?.replace('website_', '') || 'website'})`,
        description: `Auto-created on lead score ${c.lead_score}. Source: ${c.source}.`,
        task_type: 'Follow-up',
        priority: c.lead_score >= 70 ? 'high' : 'medium',
        status: 'todo',
        contact_id: c.id,
        assignee_id: assignee,
        due_date: due,
      });
      created++;
    }
    log(`autoCreateFollowUpTasks: created ${created} task(s)`);
    return { created };
  } catch (e) {
    warn('autoCreateFollowUpTasks error:', e.message);
    return { created: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 8: auto-promote lead stage based on activity (hourly)
// - stage=new + (has bill upload OR ≥2 activities) → stage=qualified
// - any stage + has order                         → stage=won
// ─────────────────────────────────────────────────────────────────────
export async function autoPromoteLeadStages() {
  if (!supabaseAdmin) return { promoted: 0, won: 0 };
  try {
    // (a) Lead → qualified
    const { data: newLeads } = await supabaseAdmin
      .from('contacts').select('id').eq('stage', 'new').limit(500);
    let promoted = 0;
    for (const c of newLeads || []) {
      const [bill, acts] = await Promise.all([
        supabaseAdmin.from('power_bill_uploads').select('id', { count: 'exact', head: true }).eq('contact_id', c.id),
        supabaseAdmin.from('activities').select('id', { count: 'exact', head: true }).eq('contact_id', c.id),
      ]);
      const hasBill = (bill.count || 0) > 0;
      const hasManyActs = (acts.count || 0) >= 2;
      if (hasBill || hasManyActs) {
        await supabaseAdmin.from('contacts').update({ stage: 'qualified', last_activity: 'Auto-promoted to qualified' }).eq('id', c.id);
        promoted++;
      }
    }

    // (b) Any stage → won (if an order exists for this contact)
    const { data: ordered } = await supabaseAdmin
      .from('orders').select('contact_id').not('contact_id', 'is', null).in('status', ['paid','packing','shipped','delivered']);
    const contactIds = [...new Set((ordered || []).map(o => o.contact_id))];
    let won = 0;
    if (contactIds.length) {
      const { data: notYetWon } = await supabaseAdmin
        .from('contacts').select('id, stage').in('id', contactIds).neq('stage', 'won');
      for (const c of notYetWon || []) {
        await supabaseAdmin.from('contacts').update({ stage: 'won', lifecycle: 'customer', last_activity: 'Auto-promoted to won (order placed)' }).eq('id', c.id);
        won++;
      }
    }

    log(`autoPromoteLeadStages: ${promoted} → qualified, ${won} → won`);
    return { promoted, won };
  } catch (e) {
    warn('autoPromoteLeadStages error:', e.message);
    return { promoted: 0, won: 0, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Job 9: Supabase keep-alive — daily 02:00
// Free-tier projects pause after 7 days inactivity; a cheap ping avoids this.
// ─────────────────────────────────────────────────────────────────────
export async function supabaseKeepAlive() {
  if (!supabaseAdmin) return { ok: false };
  try {
    const { error } = await supabaseAdmin.from('users').select('id', { count: 'exact', head: true });
    if (error) throw error;
    log('supabaseKeepAlive: ping ok');
    return { ok: true };
  } catch (e) {
    warn('supabaseKeepAlive error:', e.message);
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Kick off all schedules
// ═══════════════════════════════════════════════════════════════════
export function startScheduler() {
  if (process.env.DISABLE_CRON === '1') {
    log('Skipped — DISABLE_CRON=1');
    return;
  }

  // Every hour at :00
  cron.schedule('0 * * * *',    markOverdueTasks,         { timezone: TZ });
  // Every hour at :15 — auto-create follow-up tasks for new website leads
  cron.schedule('15 * * * *',   autoCreateFollowUpTasks,  { timezone: TZ });
  // Every hour at :30 — auto-promote lead stages based on activity
  cron.schedule('30 * * * *',   autoPromoteLeadStages,    { timezone: TZ });

  // Daily 02:00 — Supabase keep-alive ping (avoid free-tier pause)
  cron.schedule('0 2 * * *',    supabaseKeepAlive,        { timezone: TZ });
  // Daily 06:00 — lead-score decay
  cron.schedule('0 6 * * *',    decayLeadScores,          { timezone: TZ });
  // Daily 07:30 — auto-cancel stale pending orders
  cron.schedule('30 7 * * *',   autoCancelStaleOrders,    { timezone: TZ });
  // Daily 08:00 — admin digest email
  cron.schedule('0 8 * * *',    buildDailyDigest,         { timezone: TZ });
  // Daily 09:00 — low-stock alert (< 5 units)
  cron.schedule('0 9 * * *',    () => checkLowStock(5),   { timezone: TZ });

  // Weekly Monday 03:00 — stale bill cleanup
  cron.schedule('0 3 * * 1',    cleanupStaleBillUploads,  { timezone: TZ });

  log('Scheduler started · TZ=' + TZ + ' · 9 jobs registered (3 hourly, 5 daily, 1 weekly)');
}
