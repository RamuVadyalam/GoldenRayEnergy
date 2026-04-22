import { useEffect, useState } from 'react';
import api from '../../services/api';
import KPI from '../../components/ui/KPI';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { fmt$, fmtDate } from '../../utils/format';
import {
  ShoppingBag, DollarSign, Clock, Truck, CheckCircle, Eye, Trash2, Package, RefreshCw,
  Banknote, CreditCard,
} from 'lucide-react';

const STATUS_FLOW = ['pending', 'confirmed', 'paid', 'packing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending:   '#f59e0b', confirmed: '#3b82f6', paid: '#10b981', packing: '#8b5cf6',
  shipped:   '#06b6d4', delivered: '#059669', cancelled: '#ef4444', refunded: '#6b7280',
};
const PAYMENT_LABELS = { bank_transfer: 'Bank transfer', credit_card: 'Credit card', pay_on_pickup: 'Pay on pickup', invoice: 'Invoice' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data || []);
    } finally { setLoading(false); }
  };

  const openDetail = async (o) => {
    // fetch fresh with items
    const { data } = await api.get(`/orders/${o.id}`);
    setSel(data);
  };

  const updateStatus = async (status) => {
    if (!sel) return;
    try {
      const { data } = await api.patch(`/orders/${sel.id}`, { status });
      setOrders(p => p.map(x => x.id === sel.id ? { ...x, status } : x));
      setSel(s => ({ ...s, status: data.status }));
    } catch (e) { alert('Update failed: ' + (e.response?.data?.error || e.message)); }
  };

  const markPaid = async () => {
    if (!sel) return;
    const { data } = await api.patch(`/orders/${sel.id}`, { payment_status: 'paid', status: sel.status === 'pending' || sel.status === 'confirmed' ? 'paid' : sel.status });
    setOrders(p => p.map(x => x.id === sel.id ? { ...x, payment_status: 'paid' } : x));
    setSel(s => ({ ...s, payment_status: 'paid', status: data.status }));
  };

  const deleteOrder = async (o) => {
    if (!window.confirm(`Delete order ${o.order_number}? This removes all line items too.`)) return;
    await api.delete(`/orders/${o.id}`);
    setOrders(p => p.filter(x => x.id !== o.id));
    setSel(null);
  };

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  const total = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const revenue = orders.filter(o => ['paid','packing','shipped','delivered'].includes(o.status))
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold font-display">Online Orders</h2>
          <p className="text-[11px] text-gray-400">Every order placed through the website catalog lands here.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1.5 text-gray-600">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KPI icon={ShoppingBag} label="Orders total"    value={total}         accent="#6366f1" />
        <KPI icon={Clock}        label="Pending"         value={pending}       accent="#f59e0b" />
        <KPI icon={DollarSign}   label="Revenue"         value={fmt$(revenue)} accent="#10b981" />
        <KPI icon={Truck}        label="Shipped"         value={shipped}       accent="#06b6d4" />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill active={statusFilter === ''} onClick={() => setStatusFilter('')} label={`All (${orders.length})`} color="#6366f1" />
        {Object.keys(STATUS_COLORS).map(s => {
          const c = orders.filter(o => o.status === s).length;
          if (c === 0 && statusFilter !== s) return null;
          return <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} label={`${s} (${c})`} color={STATUS_COLORS[s]} />;
        })}
      </div>

      <Card title={`Orders${statusFilter ? ` — ${statusFilter}` : ''}`} subtitle={`${filtered.length} rows`}>
        <DataTable columns={[
          { label: 'Order',       render: r => <div><div className="font-mono text-xs font-bold text-amber-600">{r.order_number}</div><div className="text-[9px] text-gray-400">{fmtDate(r.created_at)}</div></div> },
          { label: 'Customer',    render: r => <div><div className="text-xs font-semibold">{[r.first_name, r.last_name].filter(Boolean).join(' ')}</div><div className="text-[9px] text-gray-400 truncate">{r.email || r.phone}</div></div> },
          { label: 'Status',      render: r => <Badge color={STATUS_COLORS[r.status]}>{r.status}</Badge> },
          { label: 'Payment',     render: r => (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px]">{PAYMENT_LABELS[r.payment_method] || r.payment_method}</span>
              <Badge color={r.payment_status === 'paid' ? '#10b981' : '#f59e0b'}>{r.payment_status}</Badge>
            </div>
          )},
          { label: 'Total',       render: r => <span className="text-xs font-bold text-emerald-600">{fmt$(r.total)}</span> },
          { label: 'Shipping',    render: r => <span className="text-[10px] text-gray-500 truncate">{r.shipping_city || '—'}</span> },
          { label: 'Actions',     render: r => (
            <div className="flex gap-1">
              <button onClick={() => openDetail(r)} title="View" className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"><Eye size={11} /></button>
              <button onClick={() => deleteOrder(r)} title="Delete" className="w-6 h-6 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11} /></button>
            </div>
          )},
        ]} data={filtered} />
      </Card>

      {/* Detail modal */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.order_number} wide>
        {sel && (
          <div className="space-y-5">
            {/* Status timeline */}
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Update status</div>
              <div className="flex flex-wrap gap-1.5">
                {[...STATUS_FLOW, 'cancelled'].map(s => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold border transition"
                    style={{
                      borderColor: STATUS_COLORS[s],
                      background: sel.status === s ? STATUS_COLORS[s] : 'transparent',
                      color: sel.status === s ? '#fff' : STATUS_COLORS[s],
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer + shipping */}
            <div className="grid grid-cols-2 gap-3">
              <Section title="Customer">
                <KV label="Name"    value={[sel.first_name, sel.last_name].filter(Boolean).join(' ') || '—'} />
                <KV label="Email"   value={sel.email || '—'} />
                <KV label="Phone"   value={sel.phone || '—'} />
              </Section>
              <Section title="Shipping">
                <KV label="Address"  value={sel.shipping_address || '—'} />
                <KV label="City"     value={sel.shipping_city || '—'} />
                <KV label="Region"   value={sel.shipping_region || '—'} />
                <KV label="Postcode" value={sel.shipping_postcode || '—'} />
              </Section>
            </div>

            {/* Line items */}
            <Section title={`Items (${sel.items?.length || 0})`}>
              <div className="divide-y divide-gray-100">
                {(sel.items || []).map(it => (
                  <div key={it.id} className="py-2 flex gap-3 items-center">
                    {it.product_image && <img src={it.product_image} alt={it.product_name} className="w-10 h-10 rounded-md object-cover bg-gray-100" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">{it.product_brand}</div>
                      <div className="text-xs font-semibold truncate">{it.product_name}</div>
                      <div className="text-[10px] text-gray-500">SKU {it.product_sku} · Qty {it.qty} × {fmt$(it.unit_price)}</div>
                    </div>
                    <div className="text-sm font-bold text-amber-600">{fmt$(it.subtotal)}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Totals */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-rose-900 text-white rounded-xl p-4 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-white/70">Subtotal</span><span>{fmt$(sel.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-white/70">Shipping</span><span>{Number(sel.shipping_cost) === 0 ? 'FREE' : fmt$(sel.shipping_cost)}</span></div>
              <div className="flex justify-between text-white/50"><span>Incl. GST</span><span>{fmt$(sel.gst)}</span></div>
              <div className="flex justify-between items-center pt-2 border-t border-white/20">
                <span className="text-sm font-bold">Total</span>
                <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">{fmt$(sel.total)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-2 text-xs">
              <Banknote size={14} className="text-gray-500" />
              <span className="text-gray-500">Payment:</span>
              <b>{PAYMENT_LABELS[sel.payment_method] || sel.payment_method}</b>
              <Badge color={sel.payment_status === 'paid' ? '#10b981' : '#f59e0b'}>{sel.payment_status}</Badge>
              {sel.payment_status !== 'paid' && (
                <Button size="sm" icon={CheckCircle} onClick={markPaid}>Mark paid</Button>
              )}
            </div>

            {sel.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs">
                <b className="text-amber-700">Customer notes:</b> {sel.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

const FilterPill = ({ active, onClick, label, color }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border"
    style={{
      background: active ? color : 'transparent',
      color: active ? '#fff' : color,
      borderColor: color,
    }}>
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{title}</h4>
    <div className="bg-gray-50 rounded-lg p-3">{children}</div>
  </div>
);

const KV = ({ label, value }) => (
  <div className="flex justify-between text-xs py-0.5 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-400">{label}</span>
    <span className="font-semibold text-gray-700 truncate ml-2">{value}</span>
  </div>
);
