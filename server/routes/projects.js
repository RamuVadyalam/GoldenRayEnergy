import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { PROJECT_STAGES, missingRequiredItems } from '../services/projectService.js';

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
        stage_entered_at, stage_progress, created_at,
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

// Update — supports stage transitions, owner, notes, sub_status.
// Forward stage moves are gated by required-checklist completion; admin role + backward moves bypass the gate.
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

      // Load current stage + stage_progress to decide whether to gate
      const { data: current, error: loadErr } = await supabaseAdmin
        .from('projects')
        .select('stage, stage_progress')
        .eq('id', req.params.id)
        .single();
      if (loadErr) throw loadErr;

      const fromIdx = PROJECT_STAGES.indexOf(current.stage);
      const toIdx   = PROJECT_STAGES.indexOf(stage);
      const isForward  = toIdx > fromIdx;
      const isAdmin    = req.user?.role === 'admin';

      if (isForward && !isAdmin) {
        const missing = missingRequiredItems(current.stage, current.stage_progress || {});
        if (missing.length) {
          return res.status(409).json({
            error: `Cannot advance from "${current.stage}" to "${stage}" — ${missing.length} required item(s) incomplete.`,
            missing,
            currentStage: current.stage,
          });
        }
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
      const isOverride = req.user?.role === 'admin';
      await supabaseAdmin.from('activities').insert({
        type:        'system',
        description: `Project stage changed to ${stage}${isOverride && req.body.override ? ' (admin override)' : ''}`,
        project_id:  data.id,
        contact_id:  data.customer_id,
        user_id:     req.user?.id || null,
        metadata:    {
          previous_stage: req.body.previous_stage || null,
          new_stage:      stage,
          override:       !!req.body.override,
        },
      });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Toggle a checklist item's completion state
// Body: { itemId: string, completed: boolean }
router.patch('/:id/checklist', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured.' });

    const { itemId, completed } = req.body;
    if (!itemId || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'itemId (string) and completed (boolean) are required.' });
    }

    const { data: current, error: loadErr } = await supabaseAdmin
      .from('projects')
      .select('stage_progress')
      .eq('id', req.params.id)
      .single();
    if (loadErr) throw loadErr;

    const next = { ...(current.stage_progress || {}), [itemId]: completed };

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ stage_progress: next })
      .eq('id', req.params.id)
      .select('id, stage_progress')
      .single();
    if (error) throw error;

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
