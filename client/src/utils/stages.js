export const PROJECT_STAGES = [
  { id: 'new',          label: 'New',          icon: '🌱', color: '#6B7280', desc: 'Lead captured' },
  { id: 'design',       label: 'Design',       icon: '📐', color: '#1E90FF', desc: 'Site assessment + system design' },
  { id: 'selling',      label: 'Selling',      icon: '💼', color: '#F5A623', desc: 'Proposal + negotiation' },
  { id: 'installation', label: 'Installation', icon: '🔧', color: '#FF6A00', desc: 'Scheduled + in progress' },
  { id: 'maintenance',  label: 'Maintenance',  icon: '🛠️', color: '#2ECC71', desc: 'Post-install support' },
  { id: 'exit',         label: 'Exit',         icon: '🏁', color: '#475569', desc: 'Closed / archived' },
];

export const getStage = (id) => PROJECT_STAGES.find(s => s.id === id) || PROJECT_STAGES[0];
export const stageIndex = (id) => PROJECT_STAGES.findIndex(s => s.id === id);

// Full tab catalog — every possible tab defined in one place
export const TAB_CATALOG = {
  manage:            { label: 'Manage',          desc: 'Stage checklist, linked tasks, internal notes, owner' },
  enquiry:           { label: 'Enquiry',         desc: 'Original website form submission (read-only)' },
  site:              { label: 'Site',            desc: 'Site photos, roof pitch / orientation / area, shading analysis' },
  design:            { label: 'Design',          desc: 'Panel layout, inverter selection, battery sizing, bill of materials' },
  energy:            { label: 'Energy',          desc: 'Simulated annual production chart + load profile + import/export split' },
  'online-proposal': { label: 'Online Proposal', desc: 'Shareable customer-facing quote link, view count, signed status' },
  'pdf-proposal':    { label: 'PDF Proposal',    desc: 'Versioned PDFs (v1, v2...), generate new version, email to customer' },
  schedule:          { label: 'Schedule',        desc: 'Install dates, crew lead, commissioning date' },
  sld:               { label: 'SLD',             desc: 'Single-line diagram upload + preview + version history' },
  payments:          { label: 'Payments',        desc: 'Deposit · progress · final payment schedule with invoices' },
  documents:         { label: 'Documents',       desc: 'Contracts, COC, install photos, maintenance reports' },
  maintenance:       { label: 'Maintenance',     desc: 'Visit history, warranty claims, inverter error log, scheduled visits' },
  overview:          { label: 'Overview',        desc: 'Final project snapshot: system installed, total paid, savings, commissioning cert' },
  nps:               { label: 'NPS',             desc: 'Customer satisfaction score, testimonial, referral + case-study capture' },
};

// Stage-specific tabs (Option A — strict per-stage; no overlap beyond "manage")
export const STAGE_TABS = {
  new:          ['manage', 'enquiry'],
  design:       ['manage', 'site', 'design', 'energy'],
  selling:      ['manage', 'online-proposal', 'pdf-proposal', 'design'],
  installation: ['manage', 'schedule', 'sld', 'payments', 'documents'],
  maintenance:  ['manage', 'maintenance', 'energy', 'payments'],
  exit:         ['overview', 'documents', 'nps'],
};

// Which tabs are fully implemented in Phase 1 (rest render a placeholder)
export const IMPLEMENTED_TABS = new Set(['manage']);

// Per-stage guidance shown in the Manage tab (Phase 1 — informational checklist)
export const STAGE_CHECKLISTS = {
  new: {
    required: ['Assign owner', 'Call customer within 24h', 'Qualify lead (yes/no)'],
    optional: ['Enrich contact data', 'Add tags'],
  },
  design: {
    required: ['Upload ≥4 site photos', 'Enter roof data (pitch, orientation, area)', 'Generate system design', 'Run energy simulation'],
    optional: ['Shading analysis', 'Drone photos', 'Structural engineer report'],
  },
  selling: {
    required: ['Generate proposal PDF', 'Share online proposal link', 'Send proposal by email', 'Schedule follow-up call'],
    optional: ['Revise proposal (v2+)', 'In-person meeting', 'Manager approval if >$50k'],
  },
  installation: {
    required: ['Confirm deposit received', 'Schedule installation date', 'Assign crew lead', 'Generate SLD', 'Commission system', 'Collect final payment'],
    optional: ['Pre-install site meeting', 'Customer walkthrough video'],
  },
  maintenance: {
    required: ['6-month performance check', 'Annual maintenance visit', 'Monitor inverter errors'],
    optional: ['Warranty claims', 'Customer training'],
  },
  exit: {
    required: ['Settle final invoice', 'Send NPS survey'],
    optional: ['Referral request', 'Case-study ask'],
  },
};
