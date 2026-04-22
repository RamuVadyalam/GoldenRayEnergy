import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── Public: list catalog with filters/search ──────────────────────────
router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'DB not configured.' });
    let q = supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('brand', { ascending: true });

    if (req.query.category) q = q.eq('category', req.query.category);
    if (req.query.brand)    q = q.eq('brand', req.query.brand);
    if (req.query.featured) q = q.eq('is_featured', true);
    if (req.query.search) {
      const s = req.query.search;
      q = q.or(`name.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%,description.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Public: brands + categories summary ──────────────────────────────
router.get('/meta', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('category, brand')
      .eq('is_active', true);
    if (error) throw error;

    const cats = {}; const brands = {};
    (data || []).forEach(p => {
      cats[p.category]  = (cats[p.category]  || 0) + 1;
      brands[p.brand]   = (brands[p.brand]   || 0) + 1;
    });
    res.json({
      categories: Object.entries(cats).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      brands:     Object.entries(brands).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Portal: create / update / delete ─────────────────────────────────
router.use(authenticate);

router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.patch('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
