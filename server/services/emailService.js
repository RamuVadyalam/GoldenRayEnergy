import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (env.email.sendgridKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net', port: 587, secure: false,
      auth: { user: 'apikey', pass: env.email.sendgridKey },
    });
  } else if (env.smtp.host) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host, port: env.smtp.port, secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  } else {
    console.warn('No email service configured — emails will be logged only');
    transporter = { sendMail: async (opts) => { console.log('📧 Email (dev):', opts.to, opts.subject); return { messageId: 'dev-' + Date.now() }; } };
  }
  return transporter;
}

export async function sendProposalEmail(proposal) {
  const t = getTransporter();
  const fmt = n => '$' + Number(n).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

  return t.sendMail({
    from: `"${env.email.fromName}" <${env.email.from}>`,
    to: proposal.email,
    subject: `Your Goldenray Energy NZ Solar Quote - ${fmt(proposal.total_cost)}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#f59e0b;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">☀️ GOLDENRAY ENERGY NZ</h1>
        <p style="margin:4px 0 0;opacity:.85;font-size:12px;font-style:italic">Powering a Sustainable Future</p>
      </div>
      <div style="padding:20px;border:1px solid #eee;border-top:0;border-radius:0 0 8px 8px">
        <p>Hi ${proposal.name},</p>
        <p>Here's your personalized solar quote:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">System Size</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">${proposal.system_size_kw}kW</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Total Cost</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">${fmt(proposal.total_cost)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee">Annual Savings</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700;color:#059669">${fmt(proposal.annual_savings)}</td></tr>
          <tr><td style="padding:8px">Payback Period</td><td style="padding:8px;font-weight:700">${proposal.payback_years} years</td></tr>
        </table>
        <p>Call us at <strong>+64 9 123 4567</strong> to get started.</p>
        <p style="color:#888;font-size:12px">Goldenray Energy NZ Ltd, Auckland, New Zealand</p>
      </div>
    </div>`,
  });
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  const t = getTransporter();
  return t.sendMail({
    from: `"${env.email.fromName}" <${env.email.from}>`,
    to, subject, html, text, attachments,
  });
}

export async function sendQuoteEmail(customer, calc, pdfBuffer, fileName) {
  const fmt = n => '$' + Number(n).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

  return sendEmail({
    to: customer.email,
    subject: `Your Goldenray Energy NZ Solar Quote — ${fmt(calc.totalCost)} for ${calc.systemSize}kW System`,
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:auto;background:#fff">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:24px 28px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:22px;font-weight:800">☀️ GOLDENRAY ENERGY NZ</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:12px;font-style:italic">Powering a Sustainable Future</p>
        <p style="margin:6px 0 0;opacity:.85;font-size:13px">Your Personalized Solar Quote</p>
      </div>
      <div style="padding:24px 28px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px">
        <p style="font-size:14px">Hi <strong>${customer.name || 'there'}</strong>,</p>
        <p style="color:#4b5563;font-size:13px">Thank you for your interest in solar energy! Please find your detailed quote attached as a PDF. Here's a quick summary:</p>

        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px">System Size</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:13px">${calc.systemSize} kW (${calc.panels} panels)</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">Total Investment</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:13px;border-top:1px solid #e5e7eb">${fmt(calc.totalCost)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">Annual Savings</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:13px;color:#059669;border-top:1px solid #e5e7eb">${fmt(calc.annualSavings)}/yr</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">Payback Period</td><td style="padding:6px 0;text-align:right;font-weight:700;font-size:13px;border-top:1px solid #e5e7eb">${calc.paybackYears} years</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">25-Year Savings</td><td style="padding:6px 0;text-align:right;font-weight:800;font-size:14px;color:#059669;border-top:1px solid #e5e7eb">${fmt(calc.lifetimeSavings)}</td></tr>
          </table>
        </div>

        <p style="color:#4b5563;font-size:13px">📎 <strong>Your full detailed quote is attached as a PDF</strong> — it includes complete cost breakdown, 25-year savings projection, and environmental impact analysis.</p>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;margin:16px 0;text-align:center">
          <div style="font-size:11px;color:#065f46;font-weight:600">You could save</div>
          <div style="font-size:24px;font-weight:900;color:#059669">${fmt(calc.lifetimeSavings)}</div>
          <div style="font-size:11px;color:#065f46">over 25 years with solar</div>
        </div>

        <p style="font-size:13px">Ready to take the next step? Call us at <strong>+64 9 123 4567</strong> or reply to this email.</p>
        <p style="color:#9ca3af;font-size:11px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px">Goldenray Energy NZ Ltd | Auckland, New Zealand<br>hello@goldenrayenergy.co.nz | +64 9 123 4567<br><em>Quote valid for 30 days. Subject to site survey.</em></p>
      </div>
    </div>`,
    attachments: pdfBuffer ? [{
      filename: fileName,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────
// Order confirmation email (auto-sent on /api/orders POST)
// ─────────────────────────────────────────────────────────────────────
export async function sendOrderConfirmation(order) {
  if (!order?.email) return;
  const t = getTransporter();
  const fmt = n => '$' + Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const itemsHtml = (order.items || []).map(i => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #f3f4f6">
        <div style="font-size:12px;color:#9ca3af;text-transform:uppercase;font-weight:700">${i.product_brand || ''}</div>
        <div style="font-size:13px;font-weight:600">${i.product_name}</div>
        <div style="font-size:11px;color:#6b7280">Qty ${i.qty} × ${fmt(i.unit_price)}</div>
      </td>
      <td align="right" style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-weight:700;color:#d97706">${fmt(i.subtotal)}</td>
    </tr>`).join('');

  return t.sendMail({
    from: `"${env.email.fromName}" <${env.email.from}>`,
    to: order.email,
    subject: `Order ${order.order_number} received — Goldenray Energy NZ`,
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:auto;background:#fff">
      <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b,#500724);color:#fff;padding:24px 28px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:22px;font-weight:800">☀️ GOLDENRAY ENERGY NZ</h1>
        <p style="margin:6px 0 0;opacity:.85;font-size:13px">Order confirmation · ${order.order_number}</p>
      </div>
      <div style="padding:24px 28px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px">
        <p style="font-size:14px">Hi <strong>${order.first_name || 'there'}</strong>,</p>
        <p style="color:#4b5563;font-size:13px">Thanks for your order! We've received it and a Goldenray specialist will be in touch within <b>24 hours</b> to confirm stock and schedule dispatch.</p>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${itemsHtml}
          <tr><td style="padding:8px 0;font-size:12px;color:#6b7280">Subtotal</td><td align="right" style="padding:8px 0;font-size:12px">${fmt(order.subtotal)}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280">Shipping</td><td align="right" style="padding:4px 0;font-size:12px">${Number(order.shipping_cost) === 0 ? 'FREE' : fmt(order.shipping_cost)}</td></tr>
          <tr><td style="padding:4px 0;font-size:11px;color:#9ca3af">Incl. GST 15%</td><td align="right" style="padding:4px 0;font-size:11px;color:#9ca3af">${fmt(order.gst)}</td></tr>
          <tr><td style="padding:10px 0;font-size:14px;font-weight:700;border-top:2px solid #e5e7eb">Total</td><td align="right" style="padding:10px 0;font-size:22px;font-weight:800;color:#d97706;border-top:2px solid #e5e7eb">${fmt(order.total)}</td></tr>
        </table>

        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;color:#78350f">
          <b>Payment method:</b> ${String(order.payment_method || '').replace(/_/g, ' ')}. We'll email instructions shortly.
        </div>

        <p style="font-size:13px">Ship to: ${order.shipping_address}, ${order.shipping_city || ''} ${order.shipping_postcode || ''}</p>
        <p style="color:#9ca3af;font-size:11px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px">Goldenray Energy NZ Ltd · Auckland · hello@goldenrayenergy.co.nz · +64 9 123 4567</p>
      </div>
    </div>`,
  });
}

// ─────────────────────────────────────────────────────────────────────
// Low-stock alert (sent 09:00 NZ if any product < threshold units)
// ─────────────────────────────────────────────────────────────────────
export async function sendLowStockAlert(items, threshold = 5) {
  const to = env.email.adminDigest || env.email.from;
  if (!to || !items?.length) return;
  const t = getTransporter();
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600">${i.brand} — ${i.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:11px;color:#888">${i.sku || '—'}</td>
      <td align="right" style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:16px;font-weight:800;color:${i.stock_qty === 0 ? '#dc2626' : '#d97706'}">${i.stock_qty}</td>
    </tr>`).join('');
  return t.sendMail({
    from: `"${env.email.fromName}" <${env.email.from}>`,
    to,
    subject: `⚠️ Low stock — ${items.length} product(s) below ${threshold} units`,
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:auto;background:#fff">
      <div style="background:linear-gradient(135deg,#dc2626,#7c2d12);color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px;font-weight:800">⚠️ Low Stock Alert</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:12px">${items.length} product${items.length === 1 ? '' : 's'} need${items.length === 1 ? 's' : ''} reordering</p>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;overflow:hidden">
        <thead><tr style="background:#fef3c7"><th align="left" style="padding:10px;font-size:11px;text-transform:uppercase">Product</th><th align="left" style="padding:10px;font-size:11px;text-transform:uppercase">SKU</th><th align="right" style="padding:10px;font-size:11px;text-transform:uppercase">Stock</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin-top:12px;text-align:center">Restock from Portal → Catalog</p>
    </div>`,
  });
}

// ─────────────────────────────────────────────────────────────────────
// Welcome email — fired when a new website enquiry / product enquiry / finance app comes in
// ─────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name, kind = 'enquiry', referenceId, summary }) {
  if (!to) return;
  const t = getTransporter();
  const titles = {
    enquiry:         'Thanks for your enquiry — Goldenray Energy NZ',
    quote:           'Your free solar quote request received',
    product_enquiry: 'Product enquiry received — Goldenray Energy NZ',
    finance:         'Finance application received — Goldenray Energy NZ',
    bill:            'Bill analysis ready — Goldenray Energy NZ',
  };
  const intro = {
    enquiry:         'Thanks for getting in touch! A Goldenray solar specialist will reach out within 24 hours.',
    quote:           'We\'ve received your free quote request. Your tailored proposal lands in your inbox within 24 hours.',
    product_enquiry: 'Thanks for the product enquiry. A specialist will email you with stock + final pricing within 24 hours.',
    finance:         'Your finance application has been received. We\'ll match you with the best lender and email a pre-approval within 24-48 hours.',
    bill:            'Your power bill has been analysed — see your results in the email below.',
  };

  return t.sendMail({
    from: `"${env.email.fromName}" <${env.email.from}>`,
    to,
    subject: titles[kind] || titles.enquiry,
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:#fff">
      <div style="background:linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6);color:#fff;padding:24px 28px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:22px;font-weight:800">☀️ Goldenray Energy NZ</h1>
        <p style="margin:6px 0 0;opacity:.85;font-size:13px">Powering a Sustainable Future</p>
      </div>
      <div style="padding:24px 28px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px">
        <p style="font-size:14px">Kia ora <strong>${name || 'there'}</strong>,</p>
        <p style="color:#4b5563;font-size:13px;line-height:1.6">${intro[kind] || intro.enquiry}</p>

        ${referenceId ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;color:#78350f">
          <b>Reference:</b> <span style="font-family:monospace">${String(referenceId).slice(0, 8)}</span>
        </div>` : ''}

        ${summary ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;color:#065f46">${summary}</div>` : ''}

        <div style="margin-top:20px;padding:14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#475569">
          <b>What happens next?</b>
          <ol style="margin:8px 0 0 16px;padding:0">
            <li>A specialist reviews your details</li>
            <li>We call or email within 24 hours</li>
            <li>If you proceed, we book a free site visit</li>
          </ol>
        </div>

        <p style="font-size:13px;margin-top:18px">Need anything sooner? Reply to this email or call <strong>+64 9 123 4567</strong>.</p>
        <p style="color:#9ca3af;font-size:11px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px">Goldenray Energy NZ Ltd · Auckland, New Zealand</p>
      </div>
    </div>`,
  });
}

// ─────────────────────────────────────────────────────────────────────
// Daily admin digest (sent 08:00 NZ by scheduler)
// ─────────────────────────────────────────────────────────────────────
export async function sendAdminDigest(digest) {
  const to = env.email.adminDigest || env.email.from;
  if (!to) return;
  const t = getTransporter();
  const fmt = n => '$' + Number(n).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

  const row = (label, count, tint) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600">${label}</td>
      <td align="right" style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:18px;font-weight:800;color:${tint}">${count}</td>
    </tr>`;

  return t.sendMail({
    from: `"${env.email.fromName || 'Goldenray Energy NZ'}" <${env.email.from}>`,
    to,
    subject: `📊 Daily digest — ${digest.new_leads.count} leads · ${digest.orders.count} orders · ${fmt(digest.total_revenue_24h)}`,
    html: `<div style="font-family:'Segoe UI',sans-serif;max-width:620px;margin:auto;background:#fff">
      <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b,#500724);color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px;font-weight:800">📊 Daily Digest</h1>
        <p style="margin:6px 0 0;opacity:.85;font-size:12px">Last 24h · ${new Date(digest.since).toLocaleDateString('en-NZ')}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;overflow:hidden">
        ${row('New leads',            digest.new_leads.count,         '#6366f1')}
        ${row('Product enquiries',    digest.product_enquiries.count, '#f59e0b')}
        ${row('Online orders',        digest.orders.count,            '#10b981')}
        ${row('Power bill uploads',   digest.bill_uploads.count,      '#8b5cf6')}
        ${row('Finance applications', digest.finance_apps.count,      '#ec4899')}
        ${row('Overdue tasks',        digest.overdue_tasks.count,     '#ef4444')}
        <tr>
          <td style="padding:14px 12px;background:#fef3c7;font-size:14px;font-weight:700">Revenue booked</td>
          <td align="right" style="padding:14px 12px;background:#fef3c7;font-size:22px;font-weight:800;color:#d97706">${fmt(digest.total_revenue_24h)}</td>
        </tr>
      </table>
      <p style="color:#9ca3af;font-size:11px;margin-top:12px;text-align:center">View full breakdown in the portal → Dashboard</p>
    </div>`,
  });
}
