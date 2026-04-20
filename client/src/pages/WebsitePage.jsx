import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Zap, Phone, Lock, Sparkles, Star, Mail, MapPin, Clock, CheckCircle, Send, Leaf, ArrowRight, DollarSign, User, Calculator, Battery, TrendingUp, Download, MessageCircle, Loader2, ChevronDown, Shield, Award, Wrench, Eye, Home, Building, Truck, Power, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import SolarChatbot from '../components/website/SolarChatbot';
import axios from 'axios';

const SYSTEM_TYPES = [
  { value: 'on-grid', label: 'On-Grid', desc: 'Grid-connected, sell excess back', icon: '🔌' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Grid + battery backup', icon: '🔋' },
  { value: 'off-grid', label: 'Off-Grid', desc: 'Fully independent', icon: '🏡' },
];

const fmt = n => '$' + Number(n || 0).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

export default function WebsitePage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', ownsHome: '', floors: '', roofType: '',
    installationType: '', batteryOption: '',
    callToDiscuss: '', installationTimeframe: '',
    monthlyBill: '', electricityRate: '0.32',
  });
  const [powerBillFile, setPowerBillFile] = useState(null);
  const [calc, setCalc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState('');
  const [sent, setSent] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [otpState, setOtpState] = useState({ sent: false, value: '', verified: false, loading: false, error: '', demoCode: '' });
  const [submitState, setSubmitState] = useState({ loading: false, done: false, error: '', id: '' });
  const addressRef = useRef(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const sendOtp = async () => {
    if (!form.phone) return;
    setOtpState(s => ({ ...s, loading: true, error: '', demoCode: '' }));
    try {
      const { data } = await axios.post('/api/otp/send', { phone: form.phone });
      setOtpState(s => ({ ...s, loading: false, sent: true, demoCode: data.demoOtp || '' }));
    } catch (e) {
      setOtpState(s => ({ ...s, loading: false, error: e.response?.data?.error || 'Failed to send OTP.' }));
    }
  };

  const verifyOtp = async () => {
    setOtpState(s => ({ ...s, loading: true, error: '' }));
    try {
      await axios.post('/api/otp/verify', { phone: form.phone, otp: otpState.value });
      setOtpState(s => ({ ...s, loading: false, verified: true, sent: false, demoCode: '' }));
    } catch (e) {
      setOtpState(s => ({ ...s, loading: false, error: e.response?.data?.error || 'Invalid OTP.' }));
    }
  };

  const getSystemType = () => {
    if (form.installationType === 'commercial') return 'on-grid';
    return form.batteryOption === 'with-battery' ? 'hybrid' : 'on-grid';
  };

  const submitEnquiry = async () => {
    setSubmitState({ loading: true, done: false, error: '', id: '' });
    try {
      const { data } = await axios.post('/api/quote/submit', { form, calculation: calc });
      setSubmitState({ loading: false, done: true, error: '', id: data.id });
    } catch (e) {
      setSubmitState({ loading: false, done: false, error: e.response?.data?.error || 'Submission failed. Please try again.', id: '' });
    }
  };

  const getCustomer = () => ({
    name: [form.firstName, form.lastName].filter(Boolean).join(' '),
    email: form.email,
    phone: form.phone,
    location: form.address,
  });

  // Google Places Autocomplete — requires VITE_GOOGLE_MAPS_API_KEY in .env
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key || !addressRef.current) return;
    const init = () => {
      if (!addressRef.current || !window.google?.maps?.places) return;
      const ac = new window.google.maps.places.Autocomplete(addressRef.current, {
        componentRestrictions: { country: 'nz' },
        types: ['address'],
      });
      ac.addListener('place_changed', () => {
        const p = ac.getPlace();
        if (p.formatted_address) setForm(f => ({ ...f, address: p.formatted_address }));
      });
    };
    if (window.google?.maps?.places) { init(); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, []);

  const calculate = async () => {
    if (!form.monthlyBill) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/quote/calculate', {
        monthlyBill: parseFloat(form.monthlyBill),
        electricityRate: parseFloat(form.electricityRate),
        systemType: getSystemType(),
      });
      setCalc(data);
      setSent({});
      setTimeout(() => document.getElementById('quote-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const downloadPDF = async () => {
    setSending('pdf');
    try {
      const customer = getCustomer();
      const res = await axios.post('/api/quote/pdf', { customer, calculation: calc }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `GoldenRay-Quote-${(customer.name || 'Customer').replace(/\s+/g, '-')}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      setSent(s => ({ ...s, pdf: true }));
    } catch (e) { console.error(e); } finally { setSending(''); }
  };

  const sendEmail = async () => {
    if (!form.email) return alert('Please enter your email address above');
    setSending('email');
    try {
      await axios.post('/api/quote/send-email', { customer: getCustomer(), calculation: calc });
      setSent(s => ({ ...s, email: true }));
    } catch (e) { console.error(e); } finally { setSending(''); }
  };

  const sendWhatsApp = async () => {
    if (!form.phone) return alert('Please enter your phone number above');
    setSending('whatsapp');
    try {
      const { data } = await axios.post('/api/quote/whatsapp-link', { customer: getCustomer(), calculation: calc });
      window.open(data.url, '_blank');
      setSent(s => ({ ...s, whatsapp: true }));
    } catch (e) { console.error(e); } finally { setSending(''); }
  };

  return (
    <div className="bg-white font-body">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-10 h-16 flex items-center justify-between bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Sun size={16} className="text-white" />
          </div>
          <span className="text-base font-extrabold font-display">Golden<span className="text-amber-500">Ray</span></span>
        </div>
        <div className="flex items-center gap-6">
          {['Products', 'How It Works', 'Calculator', 'Case Studies', 'Testimonials', 'FAQ', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-gray-500 hover:text-amber-500 transition">{l}</a>
          ))}
          <Link to="/login">
            <Button variant="dark" size="sm" icon={Lock}>Employee Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center px-16 bg-gradient-to-b from-amber-50 via-white to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-[8%] right-[5%] opacity-[0.06] animate-spin-slow">
          <svg viewBox="0 0 200 200" className="w-[480px]">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = i * 30 * Math.PI / 180;
              return <line key={i} x1={100 + Math.cos(a) * 50} y1={100 + Math.sin(a) * 50} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="#f59e0b" strokeWidth="3" />;
            })}
            <circle cx="100" cy="100" r="35" fill="#f59e0b" />
          </svg>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 mb-6">
            <Sparkles size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">NEW ZEALAND'S SOLAR ENERGY EXPERTS</span>
          </div>
          <h1 className="text-5xl font-extrabold font-display leading-tight mb-5">
            Clean Energy for<br />Aotearoa's <span className="text-amber-500">Future</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-lg mb-8">
            From Kiwi homes to commercial installations — GoldenRay Energy delivers solar solutions with instant quotes, CO₂ tracking, and professional proposals.
          </p>
          <div className="flex gap-3">
            <a href="#calculator"><Button size="lg" icon={Zap}>Get Free Quote</Button></a>
            <Button variant="dark" size="lg" icon={Phone}>+64 9 123 4567</Button>
          </div>
          <div className="flex gap-12 mt-12">
            {[{ n: '1,800+', l: 'Installations' }, { n: '$32M+', l: 'Savings' }, { n: '12,000t', l: 'CO₂ Saved' }, { n: '98%', l: 'Satisfaction' }].map((s, i) => (
              <div key={i}><div className="text-xl font-extrabold font-display">{s.n}</div><div className="text-xs text-gray-400 mt-0.5">{s.l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 px-16">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">PRODUCTS</div>
          <h2 className="text-3xl font-extrabold font-display">Solar Solutions for Aotearoa</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[{ name: 'Home Rooftop', size: '3-10kW', price: 'From $8,500', color: '#2563eb' },
            { name: 'Solar + Battery', size: '5-15kW', price: 'From $18,000', color: '#059669' },
            { name: 'Commercial', size: '25-500kW', price: 'Custom Quote', color: '#7c3aed' }].map((p, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 transition-transform">
              <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.color}08, ${p.color}15)` }}>
                <Sun size={32} style={{ color: p.color, opacity: 0.3 }} />
              </div>
              <div className="p-5">
                <h4 className="font-bold font-display mb-1">{p.name}</h4>
                <p className="text-xs text-gray-400 mb-3">{p.size} system</p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-amber-500 font-display">{p.price}</span>
                  <a href="#calculator"><Button size="sm" icon={ArrowRight}>Quote</Button></a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-16 bg-gray-50">
        <div className="text-center mb-14">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">HOW IT WORKS</div>
          <h2 className="text-3xl font-extrabold font-display">Solar in 4 Simple Steps</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">From first enquiry to powering your home — we handle everything for a seamless transition to solar.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 hidden md:block" />
          {[
            { step: '01', icon: Eye, title: 'Free Consultation', desc: 'We assess your energy usage, roof space, and goals. Get a personalised solar proposal within 24 hours.', color: '#2563eb' },
            { step: '02', icon: Wrench, title: 'Custom Design', desc: 'Our engineers design the optimal system — panel layout, inverter sizing, and battery if needed.', color: '#d97706' },
            { step: '03', icon: Truck, title: 'Professional Install', desc: 'Our certified installers handle everything — mounting, wiring, council consent, and grid connection.', color: '#7c3aed' },
            { step: '04', icon: Power, title: 'Power On & Save', desc: 'Your system goes live! Monitor savings in real-time and enjoy decades of clean, free energy.', color: '#059669' },
          ].map((s, i) => (
            <div key={i} className="relative text-center">
              <div className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center mb-4 relative z-10" style={{ background: `linear-gradient(135deg, ${s.color}10, ${s.color}20)` }}>
                <s.icon size={32} style={{ color: s.color }} />
              </div>
              <div className="text-[10px] font-bold tracking-widest text-amber-500 mb-1">STEP {s.step}</div>
              <h4 className="text-sm font-bold font-display mb-2">{s.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#calculator"><Button size="lg" icon={Zap}>Start Your Free Quote</Button></a>
        </div>
      </section>

      {/* ═══════ SOLAR CALCULATOR ═══════ */}
      <section id="calculator" className="py-24 px-6 md:px-16 bg-gradient-to-b from-amber-50/60 via-white to-emerald-50/30">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">FREE SOLAR CALCULATOR</div>
          <h2 className="text-3xl font-extrabold font-display">Get Your Instant Solar Quote</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">Enter your electricity details and we'll calculate exactly how much you can save with solar — plus download a detailed PDF quote.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><User size={14} className="text-amber-500" /> Personal Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">First Name</label>
                    <input name="firstName" type="text" placeholder="John" value={form.firstName} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Last Name</label>
                    <input name="lastName" type="text" placeholder="Smith" value={form.lastName} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</label>
                  <input name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    Phone
                    {otpState.verified && <span className="flex items-center gap-1 text-emerald-600 normal-case font-semibold"><CheckCircle size={11} /> Verified</span>}
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input name="phone" type="tel" placeholder="+64 21 123 4567" value={form.phone}
                      onChange={e => { handleChange(e); setOtpState({ sent: false, value: '', verified: false, loading: false, error: '', demoCode: '' }); }}
                      disabled={otpState.verified}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition
                        ${otpState.verified ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 focus:border-amber-400'}`} />
                    {!otpState.verified && (
                      <button onClick={sendOtp} disabled={!form.phone || otpState.loading}
                        className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition disabled:opacity-50 whitespace-nowrap flex items-center gap-1">
                        {otpState.loading && !otpState.sent ? <Loader2 size={13} className="animate-spin" /> : null}
                        {otpState.sent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                  </div>

                  {/* Demo mode — show the code on screen */}
                  {otpState.demoCode && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <span className="text-[10px] text-blue-600 font-semibold">Demo OTP (no SMS key set):</span>
                      <span className="text-sm font-extrabold text-blue-700 tracking-[0.25em]">{otpState.demoCode}</span>
                    </div>
                  )}

                  {/* OTP input + verify */}
                  {otpState.sent && !otpState.verified && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-2">
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code"
                          value={otpState.value}
                          onChange={e => setOtpState(s => ({ ...s, value: e.target.value.replace(/\D/g, ''), error: '' }))}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition text-center font-bold tracking-[0.3em]" />
                        <button onClick={verifyOtp} disabled={otpState.value.length !== 6 || otpState.loading}
                          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1">
                          {otpState.loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          Verify
                        </button>
                      </div>
                      {otpState.error && <p className="text-[10px] text-red-500 font-medium">{otpState.error}</p>}
                      <p className="text-[9px] text-gray-400">Code expires in 5 minutes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><Home size={14} className="text-amber-500" /> Property Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Complete Address</label>
                  <div className="relative mt-1">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input ref={addressRef} name="address" type="text" placeholder="Start typing NZ address…" value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Verified via Google — NZ addresses only</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Do You Own Your Home?</label>
                  <div className="flex gap-3">
                    {[{ v: 'yes', label: '✅ Yes' }, { v: 'no', label: '❌ No' }].map(opt => (
                      <label key={opt.v} className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm font-semibold
                        ${form.ownsHome === opt.v ? 'border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-300' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                        <input type="radio" name="ownsHome" value={opt.v} checked={form.ownsHome === opt.v} onChange={handleChange} className="hidden" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Number of Floors</label>
                    <input name="floors" type="number" min="1" max="20" placeholder="1" value={form.floors} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Roof Type</label>
                    <select name="roofType" value={form.roofType} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition bg-white">
                      <option value="">Select type</option>
                      <option value="corrugated-iron">Corrugated Iron / Coloursteel</option>
                      <option value="concrete-tiles">Concrete Tiles</option>
                      <option value="clay-tiles">Clay Tiles</option>
                      <option value="flat-membrane">Flat Roof (Membrane)</option>
                      <option value="metal-tiles">Metal Tiles</option>
                      <option value="shingles">Shingles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Installation Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Type of Installation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'residential', icon: '🏠', label: 'Residential' }, { v: 'commercial', icon: '🏢', label: 'Commercial' }].map(t => (
                      <label key={t.v} className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all font-semibold text-sm
                        ${form.installationType === t.v ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="installationType" value={t.v} checked={form.installationType === t.v} onChange={handleChange} className="hidden" />
                        <span>{t.icon}</span> {t.label}
                      </label>
                    ))}
                  </div>
                </div>
                {form.installationType === 'residential' && (
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Battery Storage?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 'with-battery', icon: '🔋', label: 'With Battery' }, { v: 'without-battery', icon: '🔌', label: 'Without Battery' }].map(t => (
                        <label key={t.v} className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all font-semibold text-sm
                          ${form.batteryOption === t.v ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="batteryOption" value={t.v} checked={form.batteryOption === t.v} onChange={handleChange} className="hidden" />
                          <span>{t.icon}</span> {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Power Bill Upload <span className="text-gray-300 font-normal">(optional)</span></label>
                  <label className="mt-1 flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition text-sm text-gray-400">
                    <Upload size={14} className="flex-shrink-0" />
                    <span className="truncate">{powerBillFile ? powerBillFile.name : 'Click to upload bill (PDF, JPG)'}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPowerBillFile(e.target.files[0] || null)} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Call Me to Discuss Solar Installation</label>
                  <div className="flex gap-3">
                    {[{ v: 'yes', label: '📞 Yes, call me' }, { v: 'no', label: '✋ No thanks' }].map(opt => (
                      <label key={opt.v} className={`flex-1 flex items-center justify-center p-2.5 rounded-xl border cursor-pointer transition-all text-sm font-semibold
                        ${form.callToDiscuss === opt.v ? 'border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-300' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                        <input type="radio" name="callToDiscuss" value={opt.v} checked={form.callToDiscuss === opt.v} onChange={handleChange} className="hidden" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Installation Timeframe</label>
                  <select name="installationTimeframe" value={form.installationTimeframe} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition bg-white">
                    <option value="">Select timeframe</option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-month">Within 1 month</option>
                    <option value="1-3-months">1–3 months</option>
                    <option value="3-6-months">3–6 months</option>
                    <option value="6-12-months">6–12 months</option>
                    <option value="researching">Just researching / planning</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Monthly Bill Amount (NZD) *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                    <input name="monthlyBill" type="number" min="50" step="10" placeholder="250" value={form.monthlyBill} onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                  </div>
                </div>
                <button onClick={calculate} disabled={!form.monthlyBill || loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Calculating...</> : <><Zap size={16} /> Get Free Quote</>}
                </button>
              </div>
            </div>

            {/* Submit Enquiry */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="text-sm font-bold font-display mb-1 flex items-center gap-2"><Send size={14} className="text-amber-500" /> Submit Your Enquiry</h3>
              <p className="text-[11px] text-gray-400 mb-4">We'll contact you within 24 hours with a personalised solar proposal.</p>

              {submitState.done ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-700">Enquiry Submitted!</p>
                    <p className="text-[11px] text-gray-500 mt-1">Thank you! Our team will reach out within 24 hours.<br />Reference ID: <span className="font-mono font-semibold text-amber-600">{submitState.id}</span></p>
                  </div>
                  <button onClick={() => setSubmitState({ loading: false, done: false, error: '', id: '' })}
                    className="text-[11px] text-amber-500 underline hover:text-amber-600">Submit another enquiry</button>
                </div>
              ) : (
                <>
                  {submitState.error && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 font-medium">{submitState.error}</div>
                  )}
                  <button onClick={submitEnquiry} disabled={submitState.loading || (!form.firstName && !form.email && !form.phone)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200">
                    {submitState.loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Enquiry</>}
                  </button>
                  <p className="text-[9px] text-gray-400 text-center mt-2">No spam. We respect your privacy.</p>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Results */}
          <div className="lg:col-span-3 space-y-4" id="quote-results">
            {!calc ? (
              <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                  <Sun size={36} className="text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-gray-600">Your solar quote will appear here</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">Enter your monthly electricity bill and click "Get Free Quote" to see a detailed savings analysis.</p>
              </div>
            ) : (
              <>
                {/* System Overview */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><Sun size={14} className="text-amber-500" /> Your Solar System</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: '☀️', label: 'System Size', value: `${calc.systemSize} kW`, sub: `${calc.panels} panels` },
                      { icon: '⚡', label: 'Annual Output', value: `${(calc.annualKwh/1000).toFixed(1)}k kWh`, sub: 'per year' },
                      { icon: calc.batteryKwh > 0 ? '🔋' : '🔌', label: calc.batteryKwh > 0 ? 'Battery' : 'Type', value: calc.batteryKwh > 0 ? `${calc.batteryKwh} kWh` : form.systemType },
                      { icon: '💰', label: 'Total Cost', value: fmt(calc.totalCost), sub: 'incl. GST' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xl mb-1">{s.icon}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-semibold tracking-wide">{s.label}</div>
                        <div className="text-base font-extrabold text-gray-900 mt-0.5">{s.value}</div>
                        {s.sub && <div className="text-[9px] text-gray-400">{s.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings vs Traditional */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> Solar vs Traditional Electricity</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="text-[10px] font-bold text-red-500 uppercase">❌ Without Solar</div>
                      <div className="text-2xl font-extrabold text-red-600 mt-1">{fmt(calc.traditionalCost)}</div>
                      <div className="text-[10px] text-red-400">per year</div>
                      <div className="text-xs text-red-500 font-semibold mt-2">25yr: {fmt(calc.traditionalCost * 25)}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">✅ With Solar</div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">{fmt(calc.traditionalCost - calc.annualSavings)}</div>
                      <div className="text-[10px] text-emerald-400">remaining cost</div>
                      <div className="text-xs text-emerald-600 font-semibold mt-2">Save {fmt(calc.annualSavings)}/yr ({calc.costReduction}%)</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Monthly Savings', value: fmt(calc.monthlySavings), color: 'text-emerald-600' },
                      { label: 'Payback', value: `${calc.paybackYears} yrs`, color: 'text-amber-600' },
                      { label: 'ROI', value: `${calc.roi}%`, color: 'text-emerald-600' },
                      { label: '25-Year Savings', value: fmt(calc.lifetimeSavings), color: 'text-emerald-600' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-gray-400 uppercase font-semibold">{s.label}</div>
                        <div className={`text-lg font-extrabold mt-0.5 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><DollarSign size={14} className="text-amber-500" /> Cost Breakdown</h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-gray-50"><th className="text-left px-4 py-2.5 font-semibold text-gray-500">Item</th><th className="text-right px-4 py-2.5 font-semibold text-gray-500">Cost</th></tr></thead>
                      <tbody>
                        {[
                          [`Solar Panels (${calc.panels} × ${fmt(Math.round(calc.panelCost / calc.panels))})`, calc.panelCost],
                          ['Inverter', calc.inverterCost],
                          ['Installation & Labour', calc.laborCost],
                          ...(calc.batteryKwh > 0 ? [[`Battery (${calc.batteryKwh} kWh)`, calc.batteryCost]] : []),
                          ['Margin', calc.markup],
                          ['GST (15%)', calc.tax],
                        ].map(([name, cost], i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-4 py-2.5 text-gray-600">{name}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{fmt(cost)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900 text-white">
                          <td className="px-4 py-3 font-bold">Total Investment</td>
                          <td className="px-4 py-3 text-right font-extrabold text-base">{fmt(calc.totalCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><Leaf size={14} className="text-emerald-500" /> Environmental Impact</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: '🏭', val: `${calc.co2TonsYear}t`, label: 'CO₂ reduced/year', sub: `Lifetime: ${calc.lifetimeCo2}t` },
                      { icon: '🌳', val: calc.treesEquivalent, label: 'Trees equivalent', sub: 'Every year' },
                      { icon: '⚡', val: `${(calc.annualKwh/1000).toFixed(1)}k`, label: 'Clean kWh/year', sub: '100% renewable' },
                    ].map((e, i) => (
                      <div key={i} className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <div className="text-2xl mb-1">{e.icon}</div>
                        <div className="text-lg font-extrabold text-emerald-600">{e.val}</div>
                        <div className="text-[10px] text-gray-500">{e.label}</div>
                        <div className="text-[9px] text-emerald-500 mt-1">{e.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share / Export */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-sm font-bold font-display mb-4 flex items-center gap-2"><Send size={14} className="text-amber-500" /> Get Your Detailed Quote</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button onClick={downloadPDF} disabled={sending === 'pdf'}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm
                        ${sent.pdf ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-gray-700'}`}>
                      {sending === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : sent.pdf ? <CheckCircle size={16} /> : <Download size={16} />}
                      {sent.pdf ? 'Downloaded!' : 'Download PDF'}
                    </button>
                    <button onClick={sendEmail} disabled={sending === 'email' || !form.email}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm
                        ${sent.email ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'}
                        ${!form.email ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {sending === 'email' ? <Loader2 size={16} className="animate-spin" /> : sent.email ? <CheckCircle size={16} /> : <Mail size={16} />}
                      {sent.email ? 'Sent!' : 'Email Quote'}
                    </button>
                    <button onClick={sendWhatsApp} disabled={sending === 'whatsapp' || !form.phone}
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm
                        ${sent.whatsapp ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700'}
                        ${!form.phone ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {sending === 'whatsapp' ? <Loader2 size={16} className="animate-spin" /> : sent.whatsapp ? <CheckCircle size={16} /> : <MessageCircle size={16} />}
                      {sent.whatsapp ? 'Opened!' : 'WhatsApp'}
                    </button>
                  </div>
                  {(!form.email && !form.phone) && <p className="text-[10px] text-amber-500 mt-2 text-center">Fill in your email or phone above to enable sharing</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-16 bg-gray-50">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">TESTIMONIALS</div>
          <h2 className="text-3xl font-extrabold font-display">Loved by Kiwis</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[{ name: 'Tane & Maia', text: '6kW system dropped our bill from $380 to $45/month!', loc: 'Auckland' },
            { name: 'Sarah Chen', text: '120kW powers our winery. $4,000+/month savings.', loc: 'Marlborough' },
            { name: 'Dave O\'Brien', text: 'Off-grid was the best decision. No more power bills!', loc: 'Waikato' }].map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b" />)}</div>
              <p className="text-sm text-gray-500 italic leading-relaxed mb-4">"{t.text}"</p>
              <div className="pt-3 border-t border-gray-100">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-gray-400">{t.loc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="py-24 px-16">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">CASE STUDIES</div>
          <h2 className="text-3xl font-extrabold font-display">Real Projects, Real Savings</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">Dive into the facts and figures behind some of our solar installations across New Zealand.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { type: 'Residential', title: 'Auckland Family Home', system: '8.2 kW', panels: 15, before: '$420/mo', after: '$52/mo', savings: '$88,000+', payback: '5.8 years', co2: '2.1t/yr', color: '#2563eb', gradient: 'from-blue-50 to-sky-50' },
            { type: 'Commercial', title: 'Mega Foods Warehouse', system: '120 kW', panels: 218, before: '$6,200/mo', after: '$680/mo', savings: '$1.4M+', payback: '4.2 years', co2: '28t/yr', color: '#059669', gradient: 'from-emerald-50 to-green-50' },
            { type: 'Community', title: 'Rauawaawa Kaumātua Trust', system: '35 kW', panels: 64, before: '$1,800/mo', after: '$190/mo', savings: '$385,000+', payback: '5.1 years', co2: '8.4t/yr', color: '#7c3aed', gradient: 'from-violet-50 to-purple-50' },
          ].map((cs, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 transition-transform">
              <div className={`h-32 bg-gradient-to-br ${cs.gradient} flex items-center justify-center relative`}>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cs.color }}>{cs.type}</div>
                  <Sun size={36} style={{ color: cs.color, opacity: 0.25 }} className="mx-auto" />
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: cs.color }}>{cs.system}</div>
              </div>
              <div className="p-5">
                <h4 className="font-bold font-display text-base mb-3">{cs.title}</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Panels</span>
                    <span className="font-semibold">{cs.panels} panels</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Before Solar</span>
                    <span className="font-semibold text-red-500">{cs.before}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">After Solar</span>
                    <span className="font-semibold text-emerald-600">{cs.after}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-100 pt-2">
                    <span className="text-gray-400">Payback Period</span>
                    <span className="font-semibold text-amber-600">{cs.payback}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                    <div className="text-xs font-extrabold text-emerald-600">{cs.savings}</div>
                    <div className="text-[9px] text-emerald-500">25-year savings</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2.5 text-center">
                    <div className="text-xs font-extrabold text-emerald-600">{cs.co2}</div>
                    <div className="text-[9px] text-emerald-500">CO₂ reduced</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-24 px-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = i * 30 * Math.PI / 180;
              return <line key={i} x1={100 + Math.cos(a) * 50} y1={100 + Math.sin(a) * 50} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="#f59e0b" strokeWidth="3" />;
            })}
            <circle cx="100" cy="100" r="35" fill="#f59e0b" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="text-xs font-bold text-amber-400 tracking-widest mb-3">OUR MISSION</div>
          <h2 className="text-3xl font-extrabold font-display mb-6">Powering Aotearoa with Trusted Solar</h2>
          <p className="text-base text-gray-300 leading-relaxed max-w-2xl mx-auto mb-8">
            Our mission is to power New Zealand with trusted solar — delivering real savings, lower emissions, and giving back Kiwi's energy independence. We believe every home and business deserves access to clean, affordable energy.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: DollarSign, label: 'Real Savings', desc: 'Average 85% reduction in electricity bills' },
              { icon: Leaf, label: 'Lower Emissions', desc: '12,000+ tonnes of CO₂ offset and counting' },
              { icon: Shield, label: 'Energy Independence', desc: 'Protection from rising electricity costs' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <m.icon size={20} className="text-amber-400" />
                </div>
                <div className="text-sm font-bold mb-1">{m.label}</div>
                <div className="text-[11px] text-gray-400">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners & Certifications */}
      <section className="py-16 px-16 bg-white">
        <div className="text-center mb-10">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">TRUSTED BY</div>
          <h2 className="text-2xl font-extrabold font-display">Our Partners & Certifications</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: 'SEANZ', desc: 'Sustainable Energy Association NZ', emoji: '🏛️' },
            { name: 'EECA', desc: 'Energy Efficiency & Conservation Authority', emoji: '⚡' },
            { name: 'CEC', desc: 'Clean Energy Council Approved', emoji: '✅' },
            { name: 'Master Electricians', desc: 'Licensed & Certified', emoji: '🔧' },
            { name: 'SBN', desc: 'Sustainable Business Network', emoji: '🌿' },
            { name: 'ENZ', desc: 'Electricity Networks NZ', emoji: '🔌' },
          ].map((p, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="text-[10px] font-bold text-gray-700 text-center">{p.name}</div>
              <div className="text-[8px] text-gray-400 text-center mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-16 bg-gray-50">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">FAQ</div>
          <h2 className="text-3xl font-extrabold font-display">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {[
            { q: 'How much does a solar system cost in New Zealand?', a: 'Residential systems typically range from $8,500 for a basic 3kW setup to $25,000+ for larger systems with battery storage. Use our free calculator above for an instant personalised quote based on your actual electricity usage.' },
            { q: 'How long does installation take?', a: 'Most residential installations are completed in 1-2 days. Commercial projects may take 1-2 weeks depending on system size. We handle all council consents and grid connection paperwork — usually the whole process from quote to power-on takes 4-6 weeks.' },
            { q: 'What happens on cloudy days or at night?', a: 'On-grid systems draw power from the grid when solar production is low, so you never lose power. With a hybrid or off-grid system, battery storage covers nighttime and cloudy periods. NZ gets enough sunlight year-round for solar to be highly effective.' },
            { q: 'How much can I save on my electricity bill?', a: 'Most of our customers see an 80-90% reduction in their electricity bills. A typical Auckland household with a $300/month bill saves around $250/month with solar. Your exact savings depend on system size, usage patterns, and electricity rates.' },
            { q: 'What warranties do you offer?', a: 'Our solar panels come with a 25-year performance warranty, inverters have a 10-year warranty, and we provide a 10-year workmanship guarantee on all installations. We also include a free system health check in your first year.' },
            { q: 'Do I need council consent?', a: 'Most residential solar installations are permitted activities under NZ building regulations and don\'t require a building consent. We handle all the paperwork and compliance requirements for you, including electrical certificates and grid connection applications.' },
            { q: 'Can I sell excess power back to the grid?', a: 'Yes! With an on-grid or hybrid system, excess power you generate is exported to the grid and your retailer credits you at a buy-back rate (typically 8-12c/kWh). This further reduces your electricity costs.' },
            { q: 'How long until the system pays for itself?', a: 'The average payback period is 5-8 years depending on system size and your electricity usage. After that, your solar energy is essentially free for the remaining 17-20+ years of panel life. Use our calculator for your exact payback timeline.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition">
                <span className="text-sm font-semibold text-gray-800 pr-4">{f.q}</span>
                <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-16">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-amber-500 tracking-widest mb-2">CONTACT</div>
          <h2 className="text-3xl font-extrabold font-display">Kia Ora — Let's Talk Solar</h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
            {['Name', 'Phone', 'Email'].map(l => (
              <div key={l}>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{l}</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Message</label>
              <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 min-h-[70px] resize-y" />
            </div>
            <Button block size="lg" icon={Send}>Send Enquiry</Button>
          </div>
          <div className="space-y-3">
            {[{ icon: MapPin, text: 'Level 3, 45 Queen St, Auckland', color: '#2563eb' },
              { icon: Phone, text: '+64 9 123 4567', color: '#059669' },
              { icon: Mail, text: 'hello@goldenrayenergy.co.nz', color: '#d97706' },
              { icon: Clock, text: 'Mon-Fri 8am-6pm, Sat 9am-1pm', color: '#7c3aed' }].map((c, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.color + '10' }}>
                  <c.icon size={16} color={c.color} />
                </div>
                <div className="flex items-center text-sm text-gray-600">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solar Chatbot — floating widget */}
      <SolarChatbot />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-16 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Sun size={16} className="text-white" />
              </div>
              <span className="text-base font-extrabold font-display text-white">Golden<span className="text-amber-500">Ray</span></span>
            </div>
            <p className="text-xs leading-relaxed">Powering Aotearoa with trusted solar solutions since 2018. Real savings, lower emissions, energy independence.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Quick Links</h4>
            <div className="space-y-2">
              {['Products', 'Calculator', 'Case Studies', 'FAQ', 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="block text-xs hover:text-amber-400 transition">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Contact</h4>
            <div className="space-y-2 text-xs">
              <p>Level 3, 45 Queen St</p>
              <p>Auckland, New Zealand</p>
              <p className="text-amber-400">+64 9 123 4567</p>
              <p className="text-amber-400">hello@goldenrayenergy.co.nz</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Follow Us</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Instagram', emoji: '📸' },
                { name: 'Facebook', emoji: '👍' },
                { name: 'LinkedIn', emoji: '💼' },
                { name: 'YouTube', emoji: '▶️' },
                { name: 'TikTok', emoji: '🎵' },
                { name: 'Twitter', emoji: '🐦' },
              ].map(s => (
                <span key={s.name} className="flex items-center gap-1.5 text-xs hover:text-amber-400 cursor-pointer transition">
                  <span>{s.emoji}</span> {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex justify-between items-center">
          <span className="text-[11px]">© 2026 GoldenRay Energy Ltd. All rights reserved. New Zealand.</span>
          <div className="flex items-center gap-4">
            <span className="text-[11px] hover:text-amber-400 cursor-pointer transition">Privacy Policy</span>
            <span className="text-[11px] hover:text-amber-400 cursor-pointer transition">Terms of Service</span>
            <Link to="/login"><Button variant="dark" size="sm" icon={Lock}>Employee Portal</Button></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
