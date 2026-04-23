import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = Router();

// ── Public: submit product enquiry ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });
    const f = req.body || {};

    if (!f.firstName && !f.lastName && !f.email && !f.phone)
      return res.status(400).json({ error: 'Please provide at least a name, email, or phone number.' });
    if (!f.market) return res.status(400).json({ error: 'Market segment is required.' });

    const fullName = [f.firstName, f.lastName].filter(Boolean).join(' ').trim() || f.email || 'Product Enquiry';

    // 1. Mirror into contacts for CRM visibility
    let contactId = null;
    try {
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .insert({
          name:            fullName,
          email:           f.email || null,
          phone:           f.phone || null,
          location:        f.address || null,
          type:            f.market === 'commercial' ? 'commercial' : 'residential',
          system_type:     f.market === 'offgrid' ? 'off-grid' : 'on-grid',
          stage:           'new',
          source:          'website_product_enquiry',
          lifecycle:       'lead',
          estimated_value: f.approxValue || null,
          lead_score:      f.intent === 'purchase' ? 85 : f.intent === 'quote' ? 70 : 50,
          last_activity:   `Product enquiry — ${f.bundleName || f.market}`,
          notes:           [
            f.bundleName     && `Bundle: ${f.bundleName}`,
            f.budgetBand     && `Budget: ${f.budgetBand}`,
            f.timeframe      && `Timeframe: ${f.timeframe}`,
            f.productBrands  && `Interested brands: ${Array.isArray(f.productBrands) ? f.productBrands.join(', ') : f.productBrands}`,
            f.notes          && `Note: ${f.notes}`,
          ].filter(Boolean).join(' · '),
        })
        .select('id')
        .single();
      if (contact) contactId = contact.id;
    } catch (e) { console.warn('Contact mirror failed:', e.message); }

    // 2. Insert the enquiry itself
    const { data: enq, error } = await supabaseAdmin
      .from('product_enquiries')
      .insert({
        first_name:     f.firstName || null,
        last_name:      f.lastName  || null,
        email:          f.email     || null,
        phone:          f.phone     || null,
        address:        f.address   || null,

        market:         f.market,
        bundle_id:      f.bundleId   || null,
        bundle_name:    f.bundleName || null,
        product_brands: Array.isArray(f.productBrands) ? f.productBrands : null,
        budget_band:    f.budgetBand || null,
        intent:         f.intent     || 'quote',
        timeframe:      f.timeframe  || null,
        qty:            f.qty ? Number(f.qty) : 1,
        approx_value:   f.approxValue != null ? Number(f.approxValue) : null,
        notes:          f.notes      || null,

        contact_id:     contactId,
        status:         'new',
      })
      .select('id, created_at')
      .single();
    if (error) throw error;

    // 3. Log activity so it shows on portal dashboard feed
    try {
      await supabaseAdmin.from('activities').insert({
        type:        'system',
        description: `Product enquiry — ${fullName}${f.bundleName ? ` — ${f.bundleName}` : ''}${f.budgetBand ? ` (${f.budgetBand})` : ''}`,
        contact_id:  contactId,
        metadata: {
          product_enquiry_id: enq.id,
          market:             f.market,
          bundle_id:          f.bundleId,
          bundle_name:        f.bundleName,
          intent:             f.intent,
          source:             'website_product_enquiry',
        },
      });
    } catch (e) { console.warn('Activity log failed:', e.message); }

    // Fire welcome email
    if (f.email) {
      sendWelcomeEmail({
        to: f.email,
        name: fullName,
        kind: 'product_enquiry',
        referenceId: enq.id,
        summary: f.bundleName ? `<b>Your enquiry:</b> ${f.bundleName} (${f.market}) — ${f.budgetBand || 'budget TBD'}.` : null,
      }).catch(e => console.warn('[product-enquiry] welcome email failed:', e.message));
    }

    res.status(201).json({ success: true, id: enq.id, contact_id: contactId });
  } catch (e) {
    console.error('Product enquiry error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Authenticated endpoints below ─────────────────────────────────────
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('product_enquiries')
      .select(`*, contact:contacts!contact_id ( name, email, phone )`)
      .order('created_at', { ascending: false });
    if (req.query.status) q = q.eq('status', req.query.status);
    if (req.query.market) q = q.eq('market', req.query.market);
    const { data, error } = await q;
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, contact_name: r.contact?.name || null })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_enquiries').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('product_enquiries').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
