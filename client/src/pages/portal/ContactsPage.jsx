import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { fmt$, fmtDate } from '../../utils/format';
import { PIPE_STAGES } from '../../utils/constants';
import { Search } from 'lucide-react';

export default function ContactsPage() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/leads').then(r => setLeads(r.data)).finally(() => setLoading(false)); }, []);

  const updateStage = async (id, stage) => {
    await api.patch(`/leads/${id}`, { stage });
    setLeads(p => p.map(l => l.id === id ? { ...l, stage } : l));
    if (sel?.id === id) setSel(p => ({ ...p, stage }));
  };

  const filtered = leads.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in space-y-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400" />
      </div>
      <DataTable columns={[
        { label: 'Name', render: r => <div className="flex items-center gap-2"><div className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold ${r.type === 'commercial' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{r.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}</div><div><div className="text-xs font-semibold">{r.name}</div><div className="text-[9px] text-gray-400">{r.email}</div></div></div> },
        { label: 'Type', render: r => <Badge color={r.type === 'commercial' ? '#8b5cf6' : '#3b82f6'}>{r.type}</Badge> },
        { label: 'Location', render: r => <span className="text-xs text-gray-400">{r.location}</span> },
        { label: 'Owner', render: r => <span className="text-xs text-gray-400">{r.owner_name?.split(' ')[0] || '—'}</span> },
        { label: 'Stage', render: r => { const st = PIPE_STAGES.find(s => s.id === r.stage); return <Badge color={st?.color}>{st?.label}</Badge>; } },
        { label: 'Value', render: r => <span className="text-xs font-semibold">{r.estimated_value ? fmt$(r.estimated_value) : '—'}</span> },
      ]} data={filtered} onRowClick={r => setSel(r)} />

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name}>
        {sel && <div>
          <div className="flex flex-wrap gap-1 mb-4">
            {PIPE_STAGES.map(ps => (
              <button key={ps.id} onClick={() => updateStage(sel.id, ps.id)}
                className="px-2 py-0.5 rounded text-[9px] font-semibold"
                style={{ background: sel.stage === ps.id ? ps.color + '20' : '#f5f5f5', color: sel.stage === ps.id ? ps.color : '#888' }}>
                {ps.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[['Email', sel.email], ['Phone', sel.phone], ['Type', sel.type], ['System', sel.system_type], ['Location', sel.location], ['Value', sel.estimated_value ? fmt$(sel.estimated_value) : '—'], ['Bill', sel.monthly_bill ? '$' + sel.monthly_bill : '—'], ['Source', sel.source], ['Owner', sel.owner_name || '—'], ['Updated', fmtDate(sel.updated_at)]].map(([l, v], i) => (
              <div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-50"><b className="text-gray-900">{l}:</b> {v}</div>
            ))}
          </div>
        </div>}
      </Modal>
    </div>
  );
}