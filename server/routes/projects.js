import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { PROJECT_STAGES } from '../services/projectService.js';

const router = Router();
router.use(authenticate);

// List — supports ?stage=<stage>&owner=<uuid>&search=<q>
router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });

    let q = supabaseAdmin
      .from('projects')
      .select(`
        id, code, stage, sub_status, customer_id, owner_id,
        address, suburb, city, region, postcode,
        system_size_kw, panels, battery_kwh, system_type, estimated_value,
        stage_entered_at, created_at,
        contacts:customer_id ( id, name, email, phone ),
        users:owner_id       ( id, name, avatar )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (req.query.stage) q = q.eq('stage', req.query.stage);
    if (req.query.owner) q = q.eq('owner_id', req.query.owner);

    const { data, error } = await q;
    if (error) throw error;

    const search = (req.query.search || '').toLowerCase().trim();
    const out = search
      ? data.filter(p =>
          p.code?.toLowerCase().includes(search) ||
          p.address?.toLowerCase().includes(search) ||
          p.contacts?.name?.toLowerCase().includes(search) ||
          p.contacts?.email?.toLowerCase().includes(search))
      : data;
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Detail
router.get('/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        contacts:customer_id ( id, name, email, phone, location, monthly_bill ),
        users:owner_id       ( id, name, avatar, email )
      `)
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    // Linked tasks & recent activities for the Manage tab
    const [{ data: tasks }, { data: activities }] = await Promise.all([
      supabaseAdmin.from('tasks').select('*').eq('project_id', req.params.id).order('due_date', { ascending: true }),
      supabaseAdmin.from('activities').select('*').eq('project_id', req.params.id).order('created_at', { ascending: false }).limit(20),
    ]);

    res.json({ project: data, tasks: tasks || [], activities: activities || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update — supports stage transitions, owner, notes, sub_status
router.patch('/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });

    const { stage, sub_status, owner_id, notes } = req.body;
    const update = {};
    let stageChanged = false;

    if (stage !== undefined) {
      if (!PROJECT_STAGES.includes(stage)) {
        return res.status(400).json({ error: `Invalid stage. Must be one of: ${PROJECT_STAGES.join(', ')}` });
      }
      update.stage = stage;
      update.stage_entered_at = new Date().toISOString();
      stageChanged = true;
    }
    if (sub_status !== undefined) update.sub_status = sub_status;
    if (owner_id   !== undefined) update.owner_id   = owner_id;
    if (notes      !== undefined) update.notes      = notes;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided.' });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    // Log the stage change as an activity
    if (stageChanged) {
      await supabaseAdmin.from('activities').insert({
        type:        'system',
        description: `Project stage changed to ${stage}`,
        project_id:  data.id,
        contact_id:  data.customer_id,
        user_id:     req.user?.id || null,
        metadata:    { previous_stage: req.body.previous_stage || null, new_stage: stage },
      });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
