import { useState, useEffect } from 'react';
import api from '../../services/api';
import KPI from '../../components/ui/KPI';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { fmtDate } from '../../utils/format';
import { CheckCircle, AlertCircle, Clock, Check } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/tasks').then(r => setTasks(r.data)).finally(() => setLoading(false)); }, []);

  const complete = async (id) => {
    await api.patch(`/tasks/${id}`, { status: 'completed' });
    setTasks(p => p.map(t => t.id === id ? { ...t, status: 'completed' } : t));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KPI icon={CheckCircle} label="Total" value={tasks.length} accent="#6366f1" />
        <KPI icon={AlertCircle} label="Overdue" value={tasks.filter(t => t.status === 'overdue').length} accent="#ef4444" />
        <KPI icon={Clock} label="In progress" value={tasks.filter(t => t.status === 'in_progress').length} accent="#f59e0b" />
        <KPI icon={Check} label="Completed" value={tasks.filter(t => t.status === 'completed').length} accent="#10b981" />
      </div>
      <DataTable columns={[
        { label: 'Task', render: r => <div><div className="text-xs font-semibold">{r.title}</div><div className="text-[9px] text-gray-400">{r.task_type}</div></div> },
        { label: 'Assignee', render: r => <span className="text-xs">{r.assignee_name?.split(' ')[0] || '—'}</span> },
        { label: 'Due', render: r => { const od = new Date(r.due_date) < new Date() && r.status !== 'completed'; return <span className={`text-xs ${od ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{fmtDate(r.due_date)}</span>; } },
        { label: 'Priority', render: r => <Badge color={r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f59e0b' : '#10b981'}>{r.priority}</Badge> },
        { label: 'Status', render: r => <Badge color={r.status === 'completed' ? '#10b981' : r.status === 'overdue' ? '#ef4444' : '#6366f1'}>{r.status?.replace('_', ' ')}</Badge> },
        { label: '', render: r => r.status !== 'completed' ? <button onClick={() => complete(r.id)} className="border-0 bg-emerald-50 text-emerald-600 rounded px-2 py-0.5 cursor-pointer text-[9px] font-semibold">Done</button> : null },
      ]} data={tasks} />
    </div>
  );
}
