import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CartDrawer() {
  const { items, subtotal, count, drawerOpen, closeDrawer, setQty, remove, clear } = useCart();
  const shipping = subtotal > 5000 ? 0 : subtotal > 0 ? 150 : 0;
  const total = subtotal + shipping;

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeDrawer}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Drawer */}
      <aside className={`fixed top-0 right-0 h-full w-[92%] md:w-[420px] bg-white z-[61] shadow-2xl flex flex-col transition-transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 via-indigo-900 to-rose-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <div>
              <div className="text-sm font-bold font-display">Your Cart</div>
              <div className="text-[10px] text-white/70">{count} {count === 1 ? 'item' : 'items'}</div>
            </div>
          </div>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X size={14} />
          </button>
        </header>

        {/* Line items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <ShoppingBag size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Your cart is empty</p>
              <p className="text-xs text-gray-400 mb-4">Browse our catalog and add Tier-1 solar products.</p>
              <Link to="/catalog" onClick={closeDrawer}>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 text-white text-xs font-bold">
                  Shop products
                </button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map(it => (
                <li key={it.id} className="p-4 flex gap-3">
                  {it.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{it.brand}</div>
                    <div className="text-xs font-semibold text-gray-800 leading-tight">{it.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50" disabled={it.qty <= 1}><Minus size={11} /></button>
                        <span className="w-8 text-center text-xs font-bold">{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50"><Plus size={11} /></button>
                      </div>
                      <div className="text-sm font-extrabold text-amber-600">{fmt$(it.price * it.qty)}</div>
                    </div>
                  </div>
                  <button onClick={() => remove(it.id)} className="self-start w-7 h-7 rounded-md bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={11} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary + Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3 bg-gray-50/50">
            <div className="flex justify-between text-xs text-gray-600"><span>Subtotal</span><span className="font-semibold">{fmt$(subtotal)}</span></div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold">{shipping === 0 ? <span className="text-emerald-600">FREE</span> : fmt$(shipping)}</span>
            </div>
            {subtotal > 0 && subtotal < 5000 && (
              <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                Add {fmt$(5000 - subtotal)} more to unlock <b>free shipping</b>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-bold">Total</span>
              <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">{fmt$(total)}</span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1"><Shield size={10} className="text-emerald-500" /> Includes 15% GST</div>

            <Link to="/checkout" onClick={closeDrawer} className="block">
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2">
                Checkout <ArrowRight size={14} />
              </button>
            </Link>
            <button onClick={clear} className="w-full text-[11px] text-gray-400 hover:text-red-500 underline">Clear cart</button>
          </div>
        )}
      </aside>
    </>
  );
}
