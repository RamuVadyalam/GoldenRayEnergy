import { useEffect, useState } from 'react';
import api from '../../services/api';
import KPI from '../../components/ui/KPI';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { fmt$ } from '../../utils/format';
import { Package, Eye, Pencil, Trash2, Plus, Loader2, RefreshCw, Star, Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'panel',      label: 'Solar Panel' },
  { value: 'inverter',   label: 'Inverter' },
  { value: 'battery',    label: 'Battery' },
  { value: 'ev_charger', label: 'EV Charger' },
  { value: 'mounting',   label: 'Mounting & BOS' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'accessory',  label: 'Accessory' },
];

const EMPTY = {
  sku: '', name: '', brand: '', category: 'panel', model: '', description: '',
  price: '', compare_price: '', price_unit: 'each',
  image_url: '', stock_qty: 0, in_stock: true, is_featured: false, is_active: true,
  specs: {},
};

export default function ProductsAdminPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [edit, setEdit] = useState(null); // null | product object

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setRows(data || []);
    } finally { setLoading(false); }
  };

  const handleSaved = (saved) => {
    setRows(p => {
      const existing = p.find(x => x.id === saved.id);
      return existing ? p.map(x => x.id === saved.id ? saved : x) : [saved, ...p];
    });
    setEdit(null);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Active orders referencing this SKU stay intact.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setRows(x => x.filter(r => r.id !== p.id));
    } catch (e) { alert('Delete failed: ' + (e.response?.data?.error || e.message)); }
  };

  const toggle = async (p, field) => {
    const { data } = await api.patch(`/products/${p.id}`, { [field]: !p[field] });
    setRows(rows => rows.map(r => r.id === p.id ? data : r));
  };

  const filtered = rows.filter(r => {
    if (category && r.category !== category) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.brand.toLowerCase().includes(s) || (r.sku || '').toLowerCase().includes(s);
    }
    return true;
  });

  const totalValue = rows.reduce((s, r) => s + Number(r.price) * Number(r.stock_qty || 0), 0);
  const featured = rows.filter(r => r.is_featured).length;
  const outOfStock = rows.filter(r => !r.in_stock || r.stock_qty === 0).length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold font-display">Product Catalog</h2>
          <p className="text-[11px] text-gray-400">Manage the products customers can buy online. Changes appear on the public catalog immediately.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1.5 text-gray-600">
            <RefreshCw size={12} /> Refresh
          </button>
          <Button icon={Plus} onClick={() => setEdit({ ...EMPTY })}>New Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KPI icon={Package} label="Products"       value={rows.length}  accent="#6366f1" />
        <KPI icon={Star}    label="Featured"       value={featured}     accent="#f59e0b" />
        <KPI icon={Package} label="Out of stock"   value={outOfStock}   accent="#ef4444" />
        <KPI icon={Package} label="Inventory value" value={fmt$(totalValue)} accent="#10b981" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-xl border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, brand, SKU..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="ml-auto text-xs text-gray-500">{filtered.length} of {rows.length}</div>
      </div>

      <Card title="Catalog" subtitle="Click edit to update price, stock, or feature status">
        <DataTable columns={[
          { label: 'Product', render: r => (
            <div className="flex items-center gap-2">
              {r.image_url && <img src={r.image_url} alt={r.name} className="w-9 h-9 rounded object-cover bg-gray-100 flex-shrink-0" />}
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{r.name}</div>
                <div className="text-[9px] text-gray-400">{r.brand} · <span className="font-mono">{r.sku}</span></div>
              </div>
            </div>
          )},
          { label: 'Category', render: r => <Badge color="#8b5cf6">{CATEGORIES.find(c => c.value === r.category)?.label || r.category}</Badge> },
          { label: 'Price',    render: r => <div className="text-xs font-bold text-amber-600">{fmt$(r.price)}<span className="text-[9px] text-gray-400 font-normal"> / {r.price_unit}</span></div> },
          { label: 'Stock',    render: r => <span className={`text-xs font-semibold ${r.stock_qty === 0 ? 'text-red-500' : r.stock_qty < 10 ? 'text-amber-500' : 'text-emerald-600'}`}>{r.stock_qty || 0}</span> },
          { label: 'Featured', render: r => (
            <button onClick={() => toggle(r, 'is_featured')} title="Toggle featured">
              <Star size={13} fill={r.is_featured ? '#f59e0b' : 'none'} className={r.is_featured ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'} />
            </button>
          )},
          { label: 'Active',   render: r => (
            <button onClick={() => toggle(r, 'is_active')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              {r.is_active ? 'ACTIVE' : 'HIDDEN'}
            </button>
          )},
          { label: 'Actions',  render: r => (
            <div className="flex gap-1">
              <button onClick={() => setEdit({ ...r })} title="Edit" className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"><Pencil size={11} /></button>
              <button onClick={() => handleDelete(r)} title="Delete" className="w-6 h-6 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11} /></button>
            </div>
          )},
        ]} data={filtered} />
      </Card>

      <ProductForm open={!!edit} onClose={() => setEdit(null)} initial={edit} onSaved={handleSaved} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Product create / edit form (modal)
// ════════════════════════════════════════════════════════════════════
function ProductForm({ open, onClose, initial, onSaved }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(EMPTY);
  const [specsText, setSpecsText] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open && initial) {
      setForm({ ...EMPTY, ...initial });
      setSpecsText(JSON.stringify(initial.specs || {}, null, 2));
      setErr('');
    }
  }, [open, initial?.id]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setSaving(true);
    try {
      let specs = {};
      try { specs = specsText.trim() ? JSON.parse(specsText) : {}; }
      catch { throw new Error('Specs field must be valid JSON.'); }

      const payload = {
        ...form,
        price:         form.price ? Number(form.price) : null,
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock_qty:     form.stock_qty ? parseInt(form.stock_qty, 10) : 0,
        specs,
      };
      const url = isEdit ? `/products/${initial.id}` : '/products';
      const method = isEdit ? 'patch' : 'post';
      const { data } = await api[method](url, payload);
      onSaved(data);
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'New Product'} wide>
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{err}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="SKU" name="sku" value={form.sku} onChange={onChange} placeholder="E.g. REC-ALPHA-PURE-R-430" />
          <Field label="Name" name="name" value={form.name} onChange={onChange} required />
          <Field label="Brand" name="brand" value={form.brand} onChange={onChange} required />
          <Select label="Category" name="category" value={form.category} onChange={onChange}
            options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))} required />
          <Field label="Model" name="model" value={form.model} onChange={onChange} />
          <Field label="Price unit" name="price_unit" value={form.price_unit} onChange={onChange} placeholder="each / per panel / per metre" />
          <Field label="Price ($)" name="price" type="number" step="0.01" value={form.price} onChange={onChange} required />
          <Field label="Compare price ($)" name="compare_price" type="number" step="0.01" value={form.compare_price} onChange={onChange} placeholder="For struck-through MSRP" />
          <Field label="Stock qty" name="stock_qty" type="number" value={form.stock_qty} onChange={onChange} />
          <div className="col-span-2 md:col-span-3">
            <Field label="Image URL" name="image_url" value={form.image_url} onChange={onChange} placeholder="https://..." />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea name="description" rows={3} value={form.description || ''} onChange={onChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 resize-y min-h-[70px]" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Specs (JSON)</label>
            <textarea value={specsText} onChange={e => setSpecsText(e.target.value)} rows={5}
              placeholder='{"wattage":"430W","efficiency":"22.3%"}'
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-mono outline-none focus:border-amber-400 resize-y min-h-[90px]" />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
          <Toggle label="Active (shown on public catalog)"         name="is_active"   checked={form.is_active}   onChange={onChange} />
          <Toggle label="Featured (highlighted in shop)"           name="is_featured" checked={form.is_featured} onChange={onChange} />
          <Toggle label="In stock"                                 name="in_stock"    checked={form.in_stock}    onChange={onChange} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <Button icon={saving ? Loader2 : Plus} disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Create product')}</Button>
        </div>
      </form>
    </Modal>
  );
}

const Field = ({ label, name, value, onChange, type = 'text', placeholder, required, step }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} placeholder={placeholder} step={step}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400" />
  </div>
);

const Select = ({ label, name, value, onChange, options, required }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    <select name={name} value={value ?? ''} onChange={onChange}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Toggle = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs cursor-pointer">
    <input type="checkbox" name={name} checked={!!checked} onChange={onChange} className="w-4 h-4 accent-amber-500" />
    <span className="text-gray-700">{label}</span>
  </label>
);
