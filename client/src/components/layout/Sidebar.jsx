import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sun, LayoutDashboard, Briefcase, TrendingUp, CheckCircle, GitBranch, Megaphone, Mail, Target, Users, Building2, BarChart3, Settings, LogOut } from 'lucide-react';

const NAV = [
  { header: 'Overview', items: [{ to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  { header: 'Sales Hub', items: [
    { to: '/portal/deals', label: 'Deals', icon: Briefcase },
    { to: '/portal/sales', label: 'Sales Analytics', icon: TrendingUp },
    { to: '/portal/tasks', label: 'Tasks', icon: CheckCircle },
    { to: '/portal/pipeline', label: 'Pipeline', icon: GitBranch },
  ]},
  { header: 'Marketing Hub', items: [
    { to: '/portal/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/portal/email-analytics', label: 'Email Analytics', icon: Mail },
    { to: '/portal/lead-scoring', label: 'Lead Scoring', icon: Target },
  ]},
  { header: 'Data Hub', items: [
    { to: '/portal/contacts', label: 'Contacts', icon: Users },
    { to: '/portal/companies', label: 'Companies', icon: Building2 },
    { to: '/portal/reports', label: 'Reports', icon: BarChart3 },
  ]},
  { header: 'Settings', items: [{ to: '/portal/admin', label: 'Admin', icon: Settings }], adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const sections = user?.role === 'admin' ? NAV : NAV.filter(s => !s.adminOnly);

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Sun size={16} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-extrabold font-display">Golden<span className="text-amber-500">Ray</span></div>
          <div className="text-[9px] text-gray-400">CRM Portal</div>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className="mb-2">
            <div className="px-3 py-1.5 text-[9px] font-bold text-gray-300 uppercase tracking-widest">{section.header}</div>
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-0.5 transition-all
                  ${isActive ? 'bg-amber-50 text-amber-600 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600">
            {user?.avatar || user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{user?.name}</div>
            <div className="text-[9px] text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 w-full px-2 py-1 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-[10px] hover:bg-gray-100 transition">
          <LogOut size={11} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
