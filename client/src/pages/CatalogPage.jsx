import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Lock, ShoppingBag, Search, Sun, Zap, Battery, Car, Wrench, Wifi, Filter,
  Sparkles, CheckCircle2, Star,
} from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';
import SolarChatbot from '../components/website/SolarChatbot';
import WhatsAppAssistant from '../components/website/WhatsAppAssistant';
import FloatingCart from '../components/shop/FloatingCart';
import { useCart } from '../context/CartContext';
import SEO, { ld } from '../components/SEO';

const CATEGORY_META = {
  panel:      { label: 'Solar Panels',   icon: Sun,     gradient: 'from-amber-500 to-orange-500' },
  inverter:   { label: 'Inverters',      icon: Zap,     gradient: 'from-sky-500 to-blue-600' },
  battery:    { label: 'Batteries',      icon: Battery, gradient: 'from-emerald-500 to-teal-500' },
  ev_charger: { label: 'EV Chargers',    icon: Car,     gradient: 'from-fuchsia-500 to-violet-600' },
  mounting:   { label: 'Mounting & BOS', icon: Wrench,  gradient: 'from-slate-500 to-zinc-600' },
  monitoring: { label: 'Monitoring',     icon: Wifi,    gradient: 'from-pink-500 to-rose-600' },
  accessory:  { label: 'Accessories',    icon: Sparkles, gradient: 'from-violet-500 to-indigo-500' },
};

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort] = useState('featured');
  const { add, count, openDrawer } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([axios.get('/api/products'), axios.get('/api/products/meta')]);
        setProducts(a.data || []);
        setMeta(b.data || { categories: [], brands: [] });
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...products];
    if (category) arr = arr.filter(p => p.category === category);
    if (brand)    arr = arr.filter(p => p.brand === brand);
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s) ||
        (p.model || '').toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s)
      );
    }
    if (sort === 'price-asc')  arr.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') arr.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'name')       arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [products, category, brand, search, sort]);

  const reset = () => { setCategory(''); setBrand(''); setSearch(''); setSort('featured'); };

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      <SEO
        title="Solar Shop NZ — Order Panels, Inverters, Batteries Online"
        description={`Shop ${products.length || 'all'} solar products online. Tier-1 brands — REC, Fronius, Tesla Powerwall, BYD, Zappi, S-5! — free shipping over $5,000, Auckland dispatch, 15% GST included.`}
        path="/catalog"
        keywords="solar shop nz, buy solar panels online, solar inverter nz, tesla powerwall nz, zappi ev charger, solar parts nz"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Catalog', path: '/catalog' }]}
        jsonLd={products.length ? [ld.itemList(products.slice(0, 20))] : undefined}
      />
      {/* Dark nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <Link to="/" className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray Energy NZ" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display tracking-tight text-white">GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span></div>
            <div className="text-[9px] text-amber-200/80 italic">Powering a Sustainable Future</div>
          </div>
        </Link>
        <div className="flex items-center gap-5 relative">
          <Link to="/products" className="text-sm text-gray-200 hover:text-amber-300 font-medium flex items-center gap-1.5"><ArrowLeft size={13} /> Bundles</Link>
          <Link to="/finance" className="text-sm font-semibold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent hidden md:inline">💰 Finance</Link>
          <button onClick={openDrawer} className="relative text-sm text-white hover:text-amber-300 font-medium flex items-center gap-1.5">
            <ShoppingBag size={14} /> Cart
            {count > 0 && <span className="w-5 h-5 rounded-full bg-amber-500 text-[10px] flex items-center justify-center font-bold">{count}</span>}
          </button>
          <Link to="/login"><Button size="sm" icon={Lock}>Employee Login</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-10 px-6 md:px-16 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #500724 100%)' }}>
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400 to-pink-400 opacity-25 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-25 blur-3xl animate-blob-delay-2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 mb-4 backdrop-blur">
            <ShoppingBag size={12} className="text-amber-300" />
            <span className="text-xs font-extrabold tracking-widest">ONLINE ORDERING · {products.length} PRODUCTS IN STOCK</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight mb-3">Solar Catalog</h1>
          <p className="text-sm md:text-base text-white/85 max-w-xl">Browse panels, inverters, batteries, EV chargers, mounting and monitoring — all from Tier-1 NZ-certified brands. Add to cart, check out online.</p>
        </div>
      </section>

      {/* Search + filter bar */}
      <section className="px-6 md:px-16 py-5 sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search panels, inverters, brands..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400"
            />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
            <option value="">All categories</option>
            {meta.categories.map(c => <option key={c.id} value={c.id}>{CATEGORY_META[c.id]?.label || c.id} ({c.count})</option>)}
          </select>
          <select value={brand} onChange={e => setBrand(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
            <option value="">All brands</option>
            {meta.brands.map(b => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="name">Name A-Z</option>
          </select>
          {(category || brand || search || sort !== 'featured') && (
            <button onClick={reset} className="px-3 py-2 text-[11px] font-bold text-amber-600 hover:text-amber-700">
              Clear filters
            </button>
          )}
          <div className="ml-auto text-xs text-gray-500 flex items-center gap-1"><Filter size={12} /> {filtered.length} results</div>
        </div>
      </section>

      {/* Product grid */}
      <section className="py-10 px-6 md:px-16 flex-1">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <Search size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No products match your filters</p>
              <button onClick={reset} className="text-xs text-amber-600 underline">Reset filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map(p => <ProductCard key={p.id} p={p} onAdd={add} />)}
            </div>
          )}
        </div>
      </section>

      <WebsiteFooter homepage={false} />
      <FloatingCart />
      <SolarChatbot />
      <WhatsAppAssistant />
    </div>
  );
}

// ── Product card ──
function ProductCard({ p, onAdd }) {
  const cat = CATEGORY_META[p.category];
  const hasDiscount = p.compare_price && Number(p.compare_price) > Number(p.price);
  const saving = hasDiscount ? Number(p.compare_price) - Number(p.price) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="h-44 relative overflow-hidden bg-gray-50">
        <img src={p.image_url} alt={`${p.brand} ${p.name}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        {cat && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow bg-gradient-to-r ${cat.gradient} flex items-center gap-1`}>
            <cat.icon size={9} /> {cat.label}
          </div>
        )}
        {p.is_featured && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow flex items-center gap-0.5">
            <Star size={8} fill="currentColor" /> FEATURED
          </div>
        )}
        {hasDiscount && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-red-500 shadow">
            SAVE ${saving.toFixed(0)}
          </div>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col">
        <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-0.5">{p.brand}</div>
        <div className="text-xs font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">{p.name}</div>
        {p.description && <p className="text-[10.5px] text-gray-500 leading-relaxed line-clamp-2 mb-2">{p.description}</p>}

        <div className="mt-auto pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-baseline justify-between gap-1">
            <div>
              <div className="text-lg font-extrabold font-display bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
                ${Number(p.price).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {hasDiscount && (
                <div className="text-[9px] text-gray-400 line-through">{fmt$(p.compare_price)}</div>
              )}
            </div>
            <div className="text-[9px] text-gray-400 text-right">{p.price_unit || 'each'}</div>
          </div>

          <button onClick={() => onAdd(p, 1)}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-bold text-[11px] shadow hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-1.5">
            <ShoppingBag size={11} /> Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
