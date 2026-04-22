import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { fmt$, fmtDateLong, fmtDate } from '../../utils/format';
import { PROJECT_STAGES, getStage, stageIndex, STAGE_CHECKLISTS, STAGE_TABS, TAB_CATALOG, IMPLEMENTED_TABS } from '../../utils/stages';
import {
  ArrowLeft, Calendar, Activity as ActivityIcon, Sun, User as UserIcon,
  Mail, Phone, MapPin, Zap, DollarSign, CheckSquare, Clock, ChevronDown,
} from 'lucide-react';

function StageProgressBar({ currentStage }) {
  const current = stageIndex(currentStage);
  return (
    <div className="flex items-center w-full">
      {PROJECT_STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition
                  ${active ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-4 ring-amber-100 shadow' :
                    done    ? 'bg-emerald-500 text-white' :
                              'bg-gray-100 text-gray-300'}`}
              >
                {done ? '✓' : s.icon}
              </div>
              <div className={`text-[10px] font-bold mt-1.5 uppercase tracking-wide ${active ? 'text-amber-600' : done ? 'text-emerald-600' : 'text-gray-300'}`}>
                {s.label}
              </div>
            </div>
            {i < PROJECT_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 -mt-5 ${done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StageMoveDropdown({ currentStage, onMove, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-xs font-semibold text-gray-700 disabled:opacity-50"
      >
        Change stage <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-44">
          {PROJECT_STAGES.map(s => (
            <button
              key={s.id}
              disabled={s.id === currentStage}
              onClick={() => { setOpen(false); onMove(s.id); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 text-gray-700 flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <span>{s.icon}</span>
              <span className="flex-1">{s.label}</span>
              {s.id === currentStage && <span className="text-[9px] text-amber-600 font-bold">CURRENT</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TabPlaceholder({ tabId, stageLabel }) {
  const meta = TAB_CATALOG[tabId];
  return (
    <Card className="py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
        <Clock size={24} className="text-amber-400" />
      </div>
      <h3 className="text-sm font-bold text-gray-700">{meta?.label} — Phase 2</h3>
      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{meta?.desc}</p>
      <p className="text-[10px] text-gray-300 mt-3 italic">Available at the {stageLabel} stage once built.</p>
    </Card>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('manage');
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [movingStage, setMovingStage] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const loadProject = () => {
    api.get(`/projects/${id}`)
      .then(r => {
        setProject(r.data.project);
        setTasks(r.data.tasks || []);
        setActivities(r.data.activities || []);
        setNotesDraft(r.data.project.notes || '');
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load project'))
      .finally(() => setLoading(false));
  };
  useEffect(loadProject, [id]);

  const moveStage = async (newStage) => {
    setMovingStage(true);
    try {
      await api.patch(`/projects/${id}`, { stage: newStage, previous_stage: project.stage });
      loadProject();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to change stage');
    } finally {
      setMovingStage(false);
    }
  };

  const saveNotes = async () => {
    if (notesDraft === project.notes) return;
    setSavingNotes(true);
    try {
      await api.patch(`/projects/${id}`, { notes: notesDraft });
      setProject(p => ({ ...p, notes: notesDraft }));
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;
  }
  if (error) {
    return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm">{error}</div></div>;
  }
  if (!project) return null;

  const stage = getStage(project.stage);
  const customer = project.contacts;
  const checklist = STAGE_CHECKLISTS[project.stage] || { required: [], optional: [] };
  const stageTabIds = STAGE_TABS[project.stage] || ['manage'];
  const activeTab = stageTabIds.includes(tab) ? tab : stageTabIds[0];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/portal/projects" className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider text-amber-600">{project.code}</div>
            <h2 className="text-lg font-bold font-display">{customer?.name || 'Unnamed Project'}</h2>
          </div>
          <Badge color={stage.color}>{stage.icon} {stage.label}</Badge>
          {project.sub_status && <Badge color="#ef4444">{project.sub_status}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <StageMoveDropdown currentStage={project.stage} onMove={moveStage} disabled={movingStage} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-xs font-semibold text-gray-700">
            <Calendar size={13} /> Schedule
          </button>
          <button
            onClick={() => setLogOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 text-xs font-semibold text-gray-700"
          >
            <ActivityIcon size={13} /> Activity Log ({activities.length})
          </button>
        </div>
      </div>

      {/* Stage progress bar */}
      <Card className="py-5 px-6">
        <StageProgressBar currentStage={project.stage} />
        <div className="text-center text-[10px] text-gray-400 mt-3">
          In stage since {fmtDate(project.stage_entered_at)} · {stage.desc}
        </div>
      </Card>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-3">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
              <UserIcon size={16} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-gray-400 uppercase font-semibold">Customer</div>
              <div className="text-xs font-bold truncate">{customer?.name || '—'}</div>
              <div className="text-[10px] text-gray-400 truncate">{customer?.email || customer?.phone || '—'}</div>
            </div>
          </div>
        </Card>
        <Card className="!p-3">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-gray-400 uppercase font-semibold">Address</div>
              <div className="text-xs font-semibold truncate">{project.address || '—'}</div>
              <div className="text-[10px] text-gray-400 truncate">
                {[project.suburb, project.city, project.postcode].filter(Boolean).join(', ') || 'NZ'}
              </div>
            </div>
          </div>
        </Card>
        <Card className="!p-3">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Sun size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-gray-400 uppercase font-semibold">System</div>
              <div className="text-xs font-bold">
                {project.system_size_kw ? `${project.system_size_kw} kW` : '—'}
                {project.panels && <span className="text-gray-400"> · {project.panels} panels</span>}
              </div>
              <div className="text-[10px] text-gray-400">
                {project.system_type || 'TBD'}
                {project.battery_kwh > 0 && ` · ${project.battery_kwh} kWh battery`}
              </div>
            </div>
          </div>
        </Card>
        <Card className="!p-3">
          <div className="flex items-start gap-2">
            <div className="w-9 h-9 rounded-md bg-violet-50 flex items-center justify-center flex-shrink-0">
              <DollarSign size={16} className="text-violet-500" />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase font-semibold">Est. Value</div>
              <div className="text-sm font-extrabold">{project.estimated_value ? fmt$(project.estimated_value) : '—'}</div>
              <div className="text-[10px] text-gray-400">Owner: {project.users?.name?.split(' ')[0] || 'Unassigned'}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs — stage-specific */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {stageTabIds.map(id => {
            const meta = TAB_CATALOG[id];
            const ready = IMPLEMENTED_TABS.has(id);
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-1.5
                  ${active ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {meta?.label}
                {!ready && <span className="text-[8px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-medium">Phase 2</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Placeholder for tabs not yet implemented */}
      {activeTab !== 'manage' && <TabPlaceholder tabId={activeTab} stageLabel={stage.label} />}

      {/* Manage tab content */}
      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card title={`${stage.label} checklist`} subtitle="Informational — track progress in this stage">
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Required</div>
                  <ul className="space-y-1">
                    {checklist.required.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <CheckSquare size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {checklist.optional.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Optional</div>
                    <ul className="space-y-1">
                      {checklist.optional.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                          <CheckSquare size={13} className="text-gray-300 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            <Card title={`Tasks (${tasks.length})`} subtitle="Action items linked to this project">
              {tasks.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-4 text-center">No tasks yet.</div>
              ) : (
                <ul className="space-y-2">
                  {tasks.map(t => (
                    <li key={t.id} className="flex items-start justify-between gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-gray-800">{t.title}</div>
                        {t.description && <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{t.description}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge color={t.priority === 'high' ? '#ef4444' : t.priority === 'low' ? '#9ca3af' : '#f59e0b'}>{t.priority}</Badge>
                        {t.due_date && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={9} /> {fmtDate(t.due_date)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Internal notes" subtitle="Team-only — not shown to customer">
              <textarea
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                onBlur={saveNotes}
                rows={4}
                placeholder="Add internal notes for this project..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition resize-none"
              />
              {savingNotes && <div className="text-[10px] text-amber-500 mt-1">Saving…</div>}
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card title="Contact details" subtitle="Quick reference">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs"><Mail size={12} className="text-gray-300" /> {customer?.email || '—'}</div>
                <div className="flex items-center gap-2 text-xs"><Phone size={12} className="text-gray-300" /> {customer?.phone || '—'}</div>
                <div className="flex items-center gap-2 text-xs"><Zap size={12} className="text-gray-300" /> {customer?.monthly_bill ? `${fmt$(customer.monthly_bill)}/mo` : '—'}</div>
              </div>
            </Card>

            <Card title="Timeline" subtitle="Key dates">
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-semibold">Created</div>
                  <div className="text-xs text-gray-700">{fmtDateLong(project.created_at)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase font-semibold">Entered {stage.label}</div>
                  <div className="text-xs text-gray-700">{fmtDateLong(project.stage_entered_at)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Activity log drawer */}
      {logOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setLogOpen(false)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto border-l border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-display">Activity Log</h3>
                <p className="text-[10px] text-gray-400">Most recent {activities.length} events</p>
              </div>
              <button onClick={() => setLogOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none px-2">×</button>
            </div>
            <div className="p-5 space-y-3">
              {activities.length === 0 ? (
                <div className="text-xs text-gray-400 italic text-center py-10">No activity yet.</div>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-800">{a.description}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fmtDateLong(a.created_at)} · <span className="uppercase tracking-wide">{a.type}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
