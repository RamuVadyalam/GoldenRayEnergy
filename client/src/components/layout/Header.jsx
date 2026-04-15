import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/portal': 'Dashboard', '/portal/deals': 'Deals', '/portal/sales': 'Sales Analytics',
  '/portal/tasks': 'Tasks', '/portal/pipeline': 'Pipeline', '/portal/campaigns': 'Campaigns',
  '/portal/email-analytics': 'Email Analytics', '/portal/lead-scoring': 'Lead Scoring',
  '/portal/contacts': 'Contacts', '/portal/companies': 'Companies', '/portal/reports': 'Reports',
  '/portal/admin': 'Admin',
};

export default function Header() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Portal';
  return (
    <header className="h-12 border-b border-gray-100 flex items-center justify-between px-5 bg-white">
      <h1 className="text-sm font-bold font-display">{title}</h1>
      <span className="text-[10px] text-gray-300">GoldenRay Energy CRM</span>
    </header>
  );
}
