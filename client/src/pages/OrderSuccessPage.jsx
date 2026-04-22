import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Mail, Phone, Clock, ShoppingBag, FileText, ArrowRight, Download } from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/orders/by-number/${orderNumber}`);
        setOrder(data);
      } catch (e) { setErr(e.response?.data?.error || 'Could not load order.'); }
    })();
  }, [orderNumber]);

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      {/* Simple nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <Link to="/" className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display text-white">GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span></div>
          </div>
        </Link>
      </nav>

      <section className="pt-28 pb-16 px-6 md:px-16 flex-1 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-xl">
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display mb-2">Order placed — thank you!</h1>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              We've received your order. A Goldenray specialist will reach out within 24 hours to confirm stock,
              finalise payment and schedule delivery.
            </p>
          </div>

          {err && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm mb-4">{err}</div>}

          {order && (
            <>
              {/* Order reference card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xl mb-5">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Order number</div>
                    <div className="text-xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent font-mono">{order.order_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</div>
                    <div className="text-sm font-bold text-amber-600 capitalize">{order.status}</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {(order.items || []).map(it => (
                    <div key={it.id} className="py-3 flex gap-3 text-sm">
                      {it.product_image && <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"><img src={it.product_image} alt={it.product_name} className="w-full h-full object-cover" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">{it.product_brand}</div>
                        <div className="font-semibold text-gray-800 text-xs">{it.product_name}</div>
                        <div className="text-[10px] text-gray-500">Qty {it.qty} × {fmt$(it.unit_price)}</div>
                      </div>
                      <div className="text-sm font-extrabold text-amber-600">{fmt$(it.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{fmt$(order.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold">{Number(order.shipping_cost) === 0 ? 'FREE' : fmt$(order.shipping_cost)}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Incl. GST 15%</span><span>{fmt$(order.gst)}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold">Total paid</span>
                    <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">{fmt$(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                <h3 className="text-sm font-bold font-display mb-3 flex items-center gap-1.5"><Clock size={14} className="text-amber-500" /> What happens next?</h3>
                <ol className="space-y-2 text-xs text-gray-600">
                  <Step n="1" title="Confirmation within 24 hrs"     desc="We'll email to confirm stock, final price and estimated dispatch date." />
                  <Step n="2" title={`Payment via ${order.payment_method?.replace('_',' ')}`} desc="Our team will contact you with payment details or complete the payment flow." />
                  <Step n="3" title="Dispatch from Auckland"          desc="Free shipping on orders over $5,000. Typical dispatch: 2-5 business days." />
                  <Step n="4" title="Track via email"                 desc="Tracking number emailed once dispatched. Questions? Reply to the order email." />
                </ol>
              </div>

              {/* Contact + continue shopping */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <a href={`mailto:hello@goldenrayenergy.co.nz?subject=Order ${order.order_number}`} className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><Mail size={14} className="text-amber-500" /></div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-gray-400">Email</div>
                    <div className="text-xs font-semibold truncate">hello@goldenrayenergy.co.nz</div>
                  </div>
                </a>
                <a href="tel:+6491234567" className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><Phone size={14} className="text-emerald-500" /></div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-gray-400">Call us</div>
                    <div className="text-xs font-semibold">+64 9 123 4567</div>
                  </div>
                </a>
                <Link to="/catalog" className="bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 text-white rounded-xl p-3 hover:-translate-y-0.5 transition flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"><ShoppingBag size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] uppercase font-bold opacity-85">Keep shopping</div>
                    <div className="text-xs font-semibold flex items-center gap-1">Catalog <ArrowRight size={10} /></div>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <WebsiteFooter homepage={false} />
    </div>
  );
}

const Step = ({ n, title, desc }) => (
  <li className="flex gap-3">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{n}</div>
    <div>
      <div className="text-xs font-bold text-gray-800">{title}</div>
      <div className="text-[11px] text-gray-500">{desc}</div>
    </div>
  </li>
);
