// Portal-visible daily digest + on-demand job triggers.
// Lets admins see the same summary the scheduler emails out, plus kick the
// background jobs manually for debugging.

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  buildDailyDigest,
  markOverdueTasks,
  decayLeadScores,
  autoCancelStaleOrders,
  cleanupStaleBillUploads,
  checkLowStock,
  autoCreateFollowUpTasks,
  autoPromoteLeadStages,
  supabaseKeepAlive,
} from '../jobs/scheduler.js';

const router = Router();
router.use(authenticate);

router.get('/digest', async (req, res) => {
  try { res.json(await buildDailyDigest()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/jobs/:name', async (req, res) => {
  const map = {
    'overdue-tasks':          markOverdueTasks,
    'decay-lead-scores':      decayLeadScores,
    'auto-cancel-orders':     autoCancelStaleOrders,
    'cleanup-stale-bills':    cleanupStaleBillUploads,
    'digest':                 buildDailyDigest,
    'low-stock':              () => checkLowStock(5),
    'auto-follow-up':         autoCreateFollowUpTasks,
    'promote-stages':         autoPromoteLeadStages,
    'keep-alive':             supabaseKeepAlive,
  };
  const job = map[req.params.name];
  if (!job) return res.status(404).json({ error: 'unknown job', available: Object.keys(map) });
  try { res.json({ success: true, result: await job() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
