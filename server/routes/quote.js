import { Router } from 'express';
import { calculateSolar } from '../services/calcService.js';
import { generateQuotePDF } from '../services/quotePdfService.js';
import { sendQuoteEmail, sendWelcomeEmail } from '../services/emailService.js';
import { supabaseAdmin } from '../config/supabase.js';
import { fire as fireN8n } from '../services/n8nDispatch.js';

const router = Router();

// Public endpoint — saves to website_enquiries + contacts (CRM) + activities (dashboard feed)
router.post('/submit', async (req, res) => {
  try {
    const { form, calculation } = req.body;
    if (!form) return res.status(400).json({ error: 'Form data is required.' });
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });

    if (!form.firstName && !form.lastName && !form.email && !form.phone)
      return res.status(400).json({ error: 'Please provide at least a name, email, or phone number.' });

    // Lead score based on form completeness
    let score = 10;
    if (form.firstName && form.lastName)  score += 10;
    if (form.email)                        score += 15;
    if (form.phone)                        score += 15;
    if (form.address)                      score += 10;
    if (form.monthlyBill)                  score += 10;
    if (form.installationType)             score += 10;
    if (form.roofType)                     score += 5;
    if (form.callToDiscuss === 'yes')      score += 15;
    if (calculation?.totalCost)            score += 10;
    const leadScore = Math.min(score, 100);

    // ── 1. Save full form data to website_enquiries ──────────────────────────
    const { data: enquiry, error: enqError } = await supabaseAdmin
      .from('website_enquiries')
      .insert({
        first_name:             form.firstName             || null,
        last_name:              form.lastName              || null,
        email:                  form.email                 || null,
        phone:                  form.phone                 || null,
        address:                form.address               || null,
        owns_home:              form.ownsHome              || null,
        floors:                 form.floors ? parseInt(form.floors) : null,
        roof_type:              form.roofType              || null,
        installation_type:      form.installationType      || null,
        battery_option:         form.batteryOption         || null,
        call_to_discuss:        form.callToDiscuss         || null,
        installation_timeframe: form.installationTimeframe || null,
        monthly_bill:           form.monthlyBill ? parseFloat(form.monthlyBill) : null,
        system_size_kw:         calculation?.systemSize    || null,
        total_cost:             calculation?.totalCost     || null,
        monthly_savings:        calculation?.monthlySavings || null,
        annual_savings:         calculation?.annualSavings || null,
        payback_years:          calculation?.paybackYears  || null,
        roi_percent:            calculation?.roi           || null,
        panels:                 calculation?.panels        || null,
        battery_kwh:            calculation?.batteryKwh    || null,
        lead_score: leadScore,
        status:     'new',
      })
      .select('id')
      .single();
    if (enqError) throw enqError;

    // ── 2. Create CRM contact so lead appears in employee portal ─────────────
    const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || 'Website Enquiry';
    const systemType =
      form.installationType === 'commercial' ? 'on-grid' :
      form.batteryOption === 'with-battery'  ? 'hybrid'  : 'on-grid';
    const notes = [
      form.ownsHome              && `Owns home: ${form.ownsHome}`,
      form.floors                && `Floors: ${form.floors}`,
      form.roofType              && `Roof type: ${form.roofType}`,
      form.batteryOption         && `Battery: ${form.batteryOption}`,
      form.callToDiscuss         && `Call to discuss: ${form.callToDiscuss}`,
      form.installationTimeframe && `Timeframe: ${form.installationTimeframe}`,
    ].filter(Boolean).join(' | ') || null;

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        name,
        email:           form.email                                            || null,
        phone:           form.phone                                            || null,
        location:        form.address                                          || null,
        type:            form.installationType === 'commercial' ? 'commercial' : 'residential',
        system_type:     systemType,
        monthly_bill:    form.monthlyBill ? parseFloat(form.monthlyBill)       : null,
        stage:           'new',
        source:          'website',
        lifecycle:       'subscriber',
        estimated_value: calculation?.totalCost                                || null,
        lead_score:      leadScore,
        last_activity:   'Website enquiry submitted',
        notes,
      })
      .select('id')
      .single();
    if (contactError) throw contactError;

    // ── 3. Log activity so it appears in dashboard Recent Activity feed ──────
    await supabaseAdmin.from('activities').insert({
      type:        'system',
      description: `New website lead: ${name}${form.monthlyBill ? ` — $${form.monthlyBill}/mo bill` : ''}${calculation?.totalCost ? ` — est. $${Math.round(calculation.totalCost).toLocaleString()}` : ''}`,
      contact_id:  contact.id,
      metadata: {
        enquiry_id:  enquiry.id,
        monthly_bill: form.monthlyBill || null,
        system_size:  calculation?.systemSize || null,
        total_cost:   calculation?.totalCost  || null,
        lead_score:   leadScore,
        source:       'website_form',
      },
    });

    // ── 4. Fan out to n8n ──
    fireN8n('enquiry.submitted', {
      enquiry_id: enquiry.id, contact_id: contact.id,
      name, email: form.email, phone: form.phone,
      monthly_bill: form.monthlyBill, system_size: calculation?.systemSize, total_cost: calculation?.totalCost,
      lead_score: leadScore, source: 'website',
    });

    // ── 5. Welcome email (fire-and-forget) ──
    if (form.email) {
      sendWelcomeEmail({
        to: form.email, name,
        kind: 'enquiry',
        referenceId: enquiry.id,
        summary: calculation?.totalCost
          ? `<b>Your instant estimate:</b> ${calculation.systemSize}kW system · $${Math.round(calculation.totalCost).toLocaleString()} installed · payback ${calculation.paybackYears} yrs.`
          : null,
      }).catch(e => console.warn('[quote] welcome email failed:', e.message));
    }

    res.status(201).json({ success: true, id: enquiry.id, contact_id: contact.id });
  } catch (e) {
    console.error('Submit enquiry error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Public endpoint — no auth required
router.post('/calculate', (req, res) => {
  try {
    const calc = calculateSolar(req.body);
    res.json(calc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generate PDF and return as download
router.post('/pdf', async (req, res) => {
  try {
    const { customer, calculation } = req.body;
    if (!customer || !calculation) return res.status(400).json({ error: 'customer and calculation data required' });

    const pdfBuffer = await generateQuotePDF(customer, calculation);
    const fileName = `GoldenRay-Quote-${(customer.name || 'Customer').replace(/\s+/g, '-')}-${Date.now()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send quote via email
router.post('/send-email', async (req, res) => {
  try {
    const { customer, calculation } = req.body;
    if (!customer?.email) return res.status(400).json({ error: 'Customer email is required' });
    if (!calculation) return res.status(400).json({ error: 'Calculation data is required' });

    const pdfBuffer = await generateQuotePDF(customer, calculation);
    const fileName = `GoldenRay-Quote-${(customer.name || 'Customer').replace(/\s+/g, '-')}.pdf`;

    await sendQuoteEmail(customer, calculation, pdfBuffer, fileName);
    res.json({ success: true, message: `Quote sent to ${customer.email}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generate WhatsApp share link with quote summary
router.post('/whatsapp-link', (req, res) => {
  try {
    const { customer, calculation } = req.body;
    if (!customer?.phone) return res.status(400).json({ error: 'Customer phone is required' });

    const fmt = n => '$' + Number(n).toLocaleString('en-NZ', { maximumFractionDigits: 0 });
    const phone = customer.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

    const message = [
      `☀️ *GOLDENRAY ENERGY NZ — Solar Quote*`,
      `_Powering a Sustainable Future_`,
      ``,
      `Hi ${customer.name || 'there'},`,
      `Here's your personalized solar quote:`,
      ``,
      `📊 *System Details*`,
      `• System Size: ${calculation.systemSize} kW`,
      `• Solar Panels: ${calculation.panels} panels`,
      calculation.batteryKwh > 0 ? `• Battery: ${calculation.batteryKwh} kWh` : null,
      `• System Type: ${customer.systemType || 'On-Grid'}`,
      ``,
      `💰 *Cost Breakdown*`,
      `• Panel Cost: ${fmt(calculation.panelCost)}`,
      `• Inverter: ${fmt(calculation.inverterCost)}`,
      `• Installation: ${fmt(calculation.laborCost)}`,
      calculation.batteryCost > 0 ? `• Battery: ${fmt(calculation.batteryCost)}` : null,
      `• *Total: ${fmt(calculation.totalCost)}* (incl. GST)`,
      ``,
      `💚 *Your Savings*`,
      `• Monthly Savings: ${fmt(calculation.monthlySavings)}`,
      `• Annual Savings: ${fmt(calculation.annualSavings)}`,
      `• Traditional Electricity Cost: ${fmt(calculation.traditionalCost)}/yr`,
      `• Cost Reduction: ${calculation.costReduction}%`,
      `• Payback Period: ${calculation.paybackYears} years`,
      `• ROI: ${calculation.roi}%`,
      `• 25-Year Savings: ${fmt(calculation.lifetimeSavings)}`,
      ``,
      `🌿 *Environmental Impact*`,
      `• CO₂ Reduced: ${calculation.co2TonsYear} tonnes/year`,
      `• Equivalent to ${calculation.treesEquivalent} trees planted`,
      `• Lifetime CO₂ Saved: ${calculation.lifetimeCo2} tonnes`,
      ``,
      `📞 Call us: +64 9 123 4567`,
      `📧 Email: hello@goldenrayenergy.co.nz`,
      ``,
      `_Quote valid for 30 days._`,
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    res.json({ success: true, url: whatsappUrl, message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
