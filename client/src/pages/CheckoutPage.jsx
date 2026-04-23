import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Lock, ShieldCheck, Loader2, ShoppingBag, CreditCard, Building, Banknote, Truck,
} from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENT_METHODS = [
  { id: 'bank_transfer',  label: 'Bank transfer',  icon: Banknote, desc: 'We\'ll email bank details · 3% off' },
  { id: 'credit_card',    label: 'Credit card',    icon: CreditCard, desc: 'We\'ll call to take card details' },
  { id: 'pay_on_pickup',  label: 'Pay on pickup',  icon: Truck,    desc: 'Auckland / Christchurch warehouse' },
  { id: 'invoice',        label: 'Invoice (B2B)',  icon: Building, desc: '30-day terms · approved accounts' },
];

export default function CheckoutPage() {
  const { items, subtotal, count, clear } = useCart();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [shipping, setShipping] = useState({ address: '', city: '', region: '', postcode: '' });
  const [payment,  setPayment]  = useState({ method: 'bank_transfer' });
  const [notes, setNotes] = useState('');
  const [state, setState] = useState({ loading: false, error: '' });

  const shippingCost = subtotal > 5000 ? 0 : subtotal > 0 ? 150 : 0;
  const total = subtotal + shippingCost;

  const onCustomer = (e) => setCustomer(f => ({ ...f, [e.target.name]: e.target.value }));
  const onShipping = (e) => setShipping(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!count) return;
    setState({ loading: true, error: '' });
    try {
      const { data } = await axios.post('/api/orders', {
        customer, shipping, payment, notes,
        items: items.map(i => ({ id: i.id, qty: i.qty, price: i.price, name: i.name, brand: i.brand, sku: i.sku, image_url: i.image_url })),
      });
      clear();
      navigate(`/order-success/${data.order.order_number}`);
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.error || 'Order failed. Please try again.' });
    }
  };

  if (count === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <ShoppingBag size={24} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold font-display mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-4">Add some products before checking out.</p>
          <Link to="/catalog"><Button icon={ShoppingBag}>Browse catalog</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      <SEO title="Checkout" path="/checkout" noindex />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <Link to="/" className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display tracking-tight text-white">GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span></div>
            <div className="text-[9px] text-amber-200/80 italic">Secure Checkout</div>
          </div>
        </Link>
        <Link to="/catalog" className="text-sm text-gray-200 hover:text-amber-300 font-medium flex items-center gap-1.5"><ArrowLeft size={13} /> Keep shopping</Link>
      </nav>

      <section className="pt-24 pb-16 px-6 md:px-16 bg-gradient-to-br from-white via-amber-50/30 to-pink-50/30 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display">Checkout</h1>
            <p className="text-xs text-gray-500 mt-1">Your order will be confirmed by a Goldenray specialist within 24 hours.</p>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT — form */}
            <div className="lg:col-span-2 space-y-5">
              {state.error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{state.error}</div>
              )}

              <Card title="Contact details">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name"  name="firstName" value={customer.firstName} onChange={onCustomer} required />
                  <Field label="Last name"   name="lastName"  value={customer.lastName}  onChange={onCustomer} />
                  <Field label="Email"       name="email"     type="email" value={customer.email} onChange={onCustomer} />
                  <Field label="Phone"       name="phone"     value={customer.phone} onChange={onCustomer} placeholder="+64 21..." />
                </div>
              </Card>

              <Card title="Shipping address">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Field label="Street address" name="address" value={shipping.address} onChange={onShipping} required /></div>
                  <Field label="City"     name="city"     value={shipping.city}     onChange={onShipping} />
                  <Field label="Region"   name="region"   value={shipping.region}   onChange={onShipping} />
                  <Field label="Postcode" name="postcode" value={shipping.postcode} onChange={onShipping} />
                </div>
              </Card>

              <Card title="Payment method">
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => {
                    const active = payment.method === m.id;
                    return (
                      <label key={m.id} className={`flex gap-2 items-start p-3 rounded-xl border cursor-pointer transition ${active ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="method" value={m.id} checked={active} onChange={() => setPayment({ method: m.id })} className="hidden" />
                        <m.icon size={14} className={active ? 'text-amber-600 mt-0.5' : 'text-gray-400 mt-0.5'} />
                        <div className="flex-1">
                          <div className="text-xs font-bold">{m.label}</div>
                          <div className="text-[10px] text-gray-500">{m.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Card>

              <Card title="Order notes (optional)">
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Delivery instructions, install timeframe, preferred contact times..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 resize-y min-h-[70px]" />
              </Card>
            </div>

            {/* RIGHT — order summary */}
            <div>
              <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
                <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-900 to-rose-900 text-white">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-300">Order summary</div>
                  <div className="text-2xl font-extrabold font-display mt-1">{count} {count === 1 ? 'item' : 'items'}</div>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {items.map(it => (
                    <div key={it.id} className="p-3 flex gap-3 text-xs">
                      {it.image_url && <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"><img src={it.image_url} alt={it.name} className="w-full h-full object-cover" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] text-gray-400 uppercase font-bold">{it.brand}</div>
                        <div className="font-semibold truncate">{it.name}</div>
                        <div className="text-[10px] text-gray-500">Qty {it.qty} × {fmt$(it.price)}</div>
                      </div>
                      <div className="text-xs font-bold text-amber-600">{fmt$(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4 space-y-1.5 border-t border-gray-100">
                  <Row label="Subtotal" value={fmt$(subtotal)} />
                  <Row label="Shipping" value={shippingCost === 0 ? 'FREE' : fmt$(shippingCost)} highlight={shippingCost === 0 ? 'emerald' : null} />
                  <Row label="Incl. GST 15%" value={fmt$(total * 0.15 / 1.15)} muted />
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">{fmt$(total)}</span>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <button type="submit" disabled={state.loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                    {state.loading ? <><Loader2 size={14} className="animate-spin" /> Placing order...</> : <><Lock size={14} /> Place order — {fmt$(total)}</>}
                  </button>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2 justify-center">
                    <ShieldCheck size={10} className="text-emerald-500" /> Secure · No credit check · Order confirmed within 24 hrs
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <WebsiteFooter homepage={false} />
    </div>
  );
}

// ── helpers ──
const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <h3 className="text-sm font-bold font-display mb-3">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, name, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400" />
  </div>
);

const Row = ({ label, value, highlight, muted }) => (
  <div className="flex justify-between text-xs">
    <span className={muted ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
    <span className={`font-semibold ${highlight === 'emerald' ? 'text-emerald-600' : muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
  </div>
);
