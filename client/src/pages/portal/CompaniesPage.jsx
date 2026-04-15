import { useState, useEffect } from 'react';
import api from '../../services/api';
import KPI from '../../components/ui/KPI';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { fmt$ } from '../../utils/format';
import { Building2, DollarSign, Users, Briefcase } from 'lucide-react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/companies').then(r => setCompanies(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KPI icon={Building2} label="Companies" value={companies.length} accent="#8b5cf6" />
        <KPI icon={DollarSign} label="Total value" value={fmt$(companies.reduce((s, c) => s + Number(c.total_deal_value || 0), 0))} accent="#10b981" />
        <KPI icon={Users} label="Contacts" value={companies.reduce((s, c) => s + Number(c.contact_count || 0), 0)} accent="#3b82f6" />
        <KPI icon={Briefcase} label="Deals" value={companies.reduce((s, c) => s + Number(c.deal_count || 0), 0)} accent="#f59e0b" />
      </div>
      <DataTable columns={[
        { label: 'Company', render: r => <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Building2 size={14} className="text-purple-500" /></div><div><div className="text-xs font-semibold">{r.name}</div><div className="text-[9px] text-gray-400">{r.domain}</div></div></div> },
        { label: 'Industry', render: r => <span className="text-xs">{r.industry}</span> },
        { label: 'Size', render: r => <span className="text-xs text-gray-400">{r.size}</span> },
        { label: 'City', render: r => <span className="text-xs text-gray-400">{r.city}</span> },
        { label: 'Lifecycle', render: r => <Badge color={r.lifecycle === 'customer' ? '#10b981' : '#f59e0b'}>{r.lifecycle}</Badge> },
        { label: 'Deal value', render: r => <span className="text-xs font-bold text-emerald-500">{fmt$(r.total_deal_value)}</span> },
      ]} data={companies} />
    </div>
  );
}