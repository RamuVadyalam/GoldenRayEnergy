import { Router } from 'express';
import { calculateSolar } from '../services/calcService.js';
import { generateQuotePDF } from '../services/quotePdfService.js';
import { sendQuoteEmail } from '../services/emailService.js';

const router = Router();

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
      `☀️ *GoldenRay Energy — Solar Quote*`,
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
