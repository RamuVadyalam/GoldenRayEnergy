import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CookieBanner from './components/CookieBanner';
import CookiePolicyPage from './pages/CookiePolicyPage';
import { OrganizationLD } from './components/SEO';

// Website pages
import WebsitePage from './pages/WebsitePage';
import FinancePage from './pages/FinancePage';
import ProductsPage from './pages/ProductsPage';
import MarketPage from './pages/MarketPage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import LoginPage from './pages/LoginPage';

// Portal pages
import PortalLayout from './components/layout/PortalLayout';
import DashboardPage from './pages/portal/DashboardPage';
import DealsPage from './pages/portal/DealsPage';
import SalesPage from './pages/portal/SalesPage';
import TasksPage from './pages/portal/TasksPage';
import PipelinePage from './pages/portal/PipelinePage';
import CampaignsPage from './pages/portal/CampaignsPage';
import EmailAnalyticsPage from './pages/portal/EmailAnalyticsPage';
import LeadScoringPage from './pages/portal/LeadScoringPage';
import ContactsPage from './pages/portal/ContactsPage';
import CompaniesPage from './pages/portal/CompaniesPage';
import ReportsPage from './pages/portal/ReportsPage';
import PowerBillAnalysisPage from './pages/portal/PowerBillAnalysisPage';
import OrdersPage from './pages/portal/OrdersPage';
import ProductsAdminPage from './pages/portal/ProductsAdminPage';
import AdminPage from './pages/portal/AdminPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const loc = useLocation();
  const isPortal = loc.pathname.startsWith('/portal');
  return (
    <>
    <OrganizationLD />
    <Routes>
      <Route path="/" element={<WebsitePage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/finance" element={<FinancePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:market" element={<MarketPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/portal" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="email-analytics" element={<EmailAnalyticsPage />} />
        <Route path="lead-scoring" element={<LeadScoringPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="bill-analysis" element={<PowerBillAnalysisPage />} />
        <Route path="orders"         element={<OrdersPage />} />
        <Route path="catalog"        element={<ProductsAdminPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
    {!isPortal && <CookieBanner />}
    </>
  );
}
