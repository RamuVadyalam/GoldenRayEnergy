import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { fire as fireN8n } from '../services/n8nDispatch.js';

const router = Router();

// ── Public: place an order ────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB not configured.' });
    const { customer = {}, items = [], shipping = {}, payment = {}, notes } = req.body || {};

    if (!items.length) return res.status(400).json({ error: 'Cart is empty.' });
    if (!customer.email && !customer.phone) return res.status(400).json({ error: 'Email or phone is required.' });
    if (!customer.firstName && !customer.lastName) return res.status(400).json({ error: 'Please provide your name.' });
    if (!shipping.address) return res.status(400).json({ error: 'Shipping address is required.' });

    // ── 1. Look up live prices for the cart items from our DB (server-side price wins) ──
    const ids = items.map(i => i.id).filter(Boolean);
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from('products').select('id, name, brand, sku, price, image_url').in('id', ids);
    if (prodErr) throw prodErr;
    const priceMap = Object.fromEntries((dbProducts || []).map(p => [p.id, p]));

    const lineItems = items.map(i => {
      const db = priceMap[i.id];
      const unitPrice = db ? Number(db.price) : Number(i.price || 0);
      const qty = Math.max(1, Number(i.qty) || 1);
      return {
        product_id:    db?.id || null,
        product_name:  db?.name  || i.name,
        product_brand: db?.brand || i.brand,
        product_sku:   db?.sku   || i.sku,
        product_image: db?.image_url || i.image_url,
        unit_price:    unitPrice,
        qty,
        subtotal:      +(unitPrice * qty).toFixed(2),
      };
    });

    const subtotal = +lineItems.reduce((s, x) => s + Number(x.subtotal), 0).toFixed(2);
    const shippingCost = subtotal > 5000 ? 0 : 150;   // free shipping over $5k
    const gst          = +(subtotal * 0.15 / 1.15).toFixed(2); // 15% GST (inclusive)
    const total        = +(subtotal + shippingCost).toFixed(2);
    const orderNumber  = 'GR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

    // ── 2. Mirror to contacts (CRM) ──
    let contactId = null;
    try {
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || customer.email || 'Online Order';
      const { data: contact } = await supabaseAdmin
        .from('contacts').insert({
          name:            fullName,
          email:           customer.email || null,
          phone:           customer.phone || null,
          location:        shipping.city || shipping.region || null,
          type:            'residential',
          stage:           'won',       // completed order = closed won
          source:          'website_online_order',
          lifecycle:       'customer',
          estimated_value: total,
          lead_score:      100,
          last_activity:   `Placed online order ${orderNumber} — ${lineItems.length} item(s) — $${total.toFixed(2)}`,
          notes:           lineItems.map(li => `${li.qty}× ${li.product_name}`).join(', '),
        }).select('id').single();
      if (contact) contactId = contact.id;
    } catch (e) { console.warn('Contact mirror failed:', e.message); }

    // ── 3. Insert the order ──
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders').insert({
        order_number:      orderNumber,
        status:            'pending',
        first_name:        customer.firstName || null,
        last_name:         customer.lastName  || null,
        email:             customer.email     || null,
        phone:             customer.phone     || null,
        shipping_address:  shipping.address   || null,
        shipping_city:     shipping.city      || null,
        shipping_region:   shipping.region    || null,
        shipping_postcode: shipping.postcode  || null,
        billing_same:      true,
        subtotal,
        shipping_cost:     shippingCost,
        gst,
        total,
        payment_method:    payment.method || 'bank_transfer',
        payment_status:    'unpaid',
        notes,
        contact_id:        contactId,
      })
      .select('*').single();
    if (orderErr) throw orderErr;

    // ── 4. Insert order items ──
    const itemsWithOrderId = lineItems.map(li => ({ ...li, order_id: order.id }));
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);
    if (itemsErr) console.warn('Order items insert failed:', itemsErr.message);

    // ── 4b. Deduct stock from products table + auto-disable at 0 ──
    for (const li of lineItems) {
      if (!li.product_id) continue;
      try {
        const { data: prod } = await supabaseAdmin
          .from('products').select('stock_qty').eq('id', li.product_id).single();
        const newQty = Math.max(0, (prod?.stock_qty || 0) - li.qty);
        await supabaseAdmin
          .from('products')
          .update({ stock_qty: newQty, in_stock: newQty > 0 })
          .eq('id', li.product_id);
      } catch (e) { console.warn('Stock deduct failed for', li.product_id, '·', e.message); }
    }

    // ── 5. Log activity ──
    try {
      await supabaseAdmin.from('activities').insert({
        type:        'system',
        description: `Online order ${orderNumber} placed — ${lineItems.length} item(s), $${total.toFixed(2)}`,
        contact_id:  contactId,
        metadata: {
          order_id:     order.id,
          order_number: orderNumber,
          total,
          items:        lineItems.length,
          source:       'website_online_order',
        },
      });
    } catch (e) { console.warn('Activity log failed:', e.message); }

    // ── 6. Fan out to n8n workflows (Slack, CRM, Sheets, Xero, etc.) ──
    fireN8n('order.placed', {
      order_id: order.id,
      order_number: orderNumber,
      total, subtotal, shipping_cost: shippingCost, gst,
      items: lineItems.length,
      customer: { name: [customer.firstName, customer.lastName].filter(Boolean).join(' '), email: customer.email, phone: customer.phone },
      shipping,
      payment_method: payment.method || 'bank_transfer',
      contact_id: contactId,
    });

    // ── 7. Fire confirmation email (fire-and-forget) ──
    sendOrderConfirmation({
      order_number: orderNumber, status: order.status,
      first_name: customer.firstName, last_name: customer.lastName, email: customer.email,
      subtotal, shipping_cost: shippingCost, gst, total,
      shipping_address: shipping.address, shipping_city: shipping.city, shipping_postcode: shipping.postcode,
      payment_method: payment.method || 'bank_transfer',
      items: lineItems,
    }).catch(e => console.warn('[orders] confirmation email failed:', e.message));

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        order_number: orderNumber,
        subtotal, shipping_cost: shippingCost, gst, total,
        status: order.status,
        items: lineItems,
      },
      contact_id: contactId,
    });
  } catch (e) {
    console.error('Order placement error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Public: look up an order by order_number (for confirmation page) ──
router.get('/by-number/:num', async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders').select('*').eq('order_number', req.params.num).single();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const { data: items } = await supabaseAdmin.from('order_items').select('*').eq('order_id', order.id);
    res.json({ ...order, items: items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Authenticated portal endpoints ────────────────────────────────────
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('orders')
      .select(`*, contact:contacts!contact_id ( name, email, phone )`)
      .order('created_at', { ascending: false });
    if (req.query.status) q = q.eq('status', req.query.status);
    const { data, error } = await q;
    if (error) throw error;
    res.json((data || []).map(o => ({ ...o, contact_name: o.contact?.name || null })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!order) return res.status(404).json({ error: 'Not found' });
    const { data: items } = await supabaseAdmin.from('order_items').select('*').eq('order_id', order.id);
    res.json({ ...order, items: items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('orders').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('orders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
