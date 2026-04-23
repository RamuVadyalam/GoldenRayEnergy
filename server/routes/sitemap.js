// Dynamic sitemap — includes /catalog items + market pages from live data.
// Cached in-process for 30 minutes to avoid hammering the DB on every crawl.

import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const SITE_URL = process.env.SITE_URL || 'https://goldenrayenergy.co.nz';
const router = Router();

let cache = { xml: null, ts: 0 };
const TTL_MS = 30 * 60 * 1000;

router.get('/sitemap.xml', async (req, res) => {
  res.type('application/xml');
  if (cache.xml && Date.now() - cache.ts < TTL_MS) return res.send(cache.xml);

  const staticPages = [
    { loc: '/',                      freq: 'weekly',  pri: 1.0 },
    { loc: '/products',              freq: 'weekly',  pri: 0.9 },
    { loc: '/products/residential',  freq: 'weekly',  pri: 0.9 },
    { loc: '/products/commercial',   freq: 'weekly',  pri: 0.9 },
    { loc: '/products/offgrid',      freq: 'weekly',  pri: 0.9 },
    { loc: '/catalog',               freq: 'daily',   pri: 0.9 },
    { loc: '/finance',               freq: 'monthly', pri: 0.8 },
    { loc: '/cookie-policy',         freq: 'yearly',  pri: 0.3 },
  ];

  // Pull latest active product SKUs (no /product/:id pages yet, but the catalog uses ?sku= URLs)
  let products = [];
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('sku, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(500);
    products = data || [];
  } catch (e) { console.warn('[sitemap] product fetch failed:', e.message); }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticPages.map(p => `
  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.pri}</priority>
  </url>`),
    ...products.map(p => `
  <url>
    <loc>${SITE_URL}/catalog?sku=${encodeURIComponent(p.sku)}</loc>
    <changefreq>weekly</changefreq>
    <lastmod>${p.updated_at?.slice(0, 10) || ''}</lastmod>
    <priority>0.7</priority>
  </url>`),
    '\n</urlset>',
  ].join('');

  cache = { xml, ts: Date.now() };
  res.send(xml);
});

export default router;
