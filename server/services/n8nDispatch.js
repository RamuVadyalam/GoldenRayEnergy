// ════════════════════════════════════════════════════════════════════
// n8n event dispatcher — fires outbound webhooks for business events so
// they can be handled by n8n workflows (Slack notifications, CRM sync,
// Google Sheets logging, email sequences, etc.).
//
//   env N8N_WEBHOOK_URL      — base URL, e.g. https://n8n.yourdomain.io
//                              If unset, all dispatches silently no-op.
//   env N8N_WEBHOOK_SECRET   — HMAC signing key (optional but recommended)
//   env N8N_WEBHOOK_TIMEOUT  — ms before we give up (default 4000)
//
// Each event POSTs to:  {N8N_WEBHOOK_URL}/webhook/goldenray/{event}
// Headers:   X-Goldenray-Event, X-Goldenray-Signature (HMAC-SHA256 hex)
// Body:      { event, data, site, timestamp }
// ════════════════════════════════════════════════════════════════════

import crypto from 'crypto';

const BASE    = process.env.N8N_WEBHOOK_URL || '';
const SECRET  = process.env.N8N_WEBHOOK_SECRET || '';
const TIMEOUT = parseInt(process.env.N8N_WEBHOOK_TIMEOUT) || 4000;
const SITE    = process.env.SITE_URL || 'https://goldenrayenergy.co.nz';

const sign = (body) => SECRET ? crypto.createHmac('sha256', SECRET).update(body).digest('hex') : '';

/**
 * Fire an event to n8n. Fire-and-forget — never throws, never blocks.
 * @param {string} event - dotted event name e.g. "order.placed"
 * @param {object} data  - event payload
 * @returns {Promise<{ok:boolean, status?:number, skipped?:string, error?:string}>}
 */
export async function dispatch(event, data) {
  if (!BASE) return { ok: false, skipped: 'N8N_WEBHOOK_URL not set' };
  const payload = JSON.stringify({ event, data, site: SITE, timestamp: new Date().toISOString() });
  const url = `${BASE.replace(/\/$/, '')}/webhook/goldenray/${event.replace(/\./g, '-')}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type':           'application/json',
        'X-Goldenray-Event':       event,
        'X-Goldenray-Signature':   sign(payload),
        'User-Agent':              'goldenray-dispatcher/1.0',
      },
      body: payload,
    });
    clearTimeout(t);
    if (!res.ok) console.warn(`[n8n] ${event} → HTTP ${res.status}`);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(t);
    console.warn(`[n8n] ${event} dispatch failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
}

/**
 * Fire without awaiting — use everywhere in routes so we never block the
 * HTTP response on a slow n8n instance.
 */
export function fire(event, data) {
  dispatch(event, data).catch(() => {}); // already swallowed inside
}

/**
 * Verify an incoming webhook's signature (for n8n → us calls).
 */
export function verifySignature(rawBody, headerSig) {
  if (!SECRET) return true;         // skip verification when no secret configured
  if (!headerSig) return false;
  const expected = sign(rawBody);
  try {
    return crypto.timingSafeEqual(Buffer.from(headerSig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

export const isConfigured = () => Boolean(BASE);
