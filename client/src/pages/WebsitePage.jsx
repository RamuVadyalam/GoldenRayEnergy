import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Zap, Phone, Lock, Sparkles, Star, Mail, MapPin, Clock, CheckCircle, Send, Leaf, ArrowRight, DollarSign, User, Calculator, Battery, TrendingUp, Download, MessageCircle, Loader2, ChevronDown, Shield, Award, Wrench, Eye, Home, Building, Truck, Power, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import SolarChatbot from '../components/website/SolarChatbot';
import WhatsAppAssistant from '../components/website/WhatsAppAssistant';
import WebsiteFooter from '../components/website/WebsiteFooter';
import axios from 'axios';

const SYSTEM_TYPES = [
  { value: 'on-grid', label: 'On-Grid', desc: 'Grid-connected, sell excess back', icon: '🔌' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Grid + battery backup', icon: '🔋' },
  { value: 'off-grid', label: 'Off-Grid', desc: 'Fully independent', icon: '🏡' },
];

const fmt = n => '$' + Number(n || 0).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

const CASE_STUDY_IMAGES = [
  <img key='res' src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=220&fit=crop&auto=format&q=80' alt='Residential solar panels on Auckland family home' className='w-full h-full object-cover' />,
  <img key='com' src='https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=220&fit=crop&auto=format&q=80' alt='Commercial solar panels on warehouse roof' className='w-full h-full object-cover' />,
  <img key='com2' src='https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=220&fit=crop&auto=format&q=80' alt='Community solar installation' className='w-full h-full object-cover' />,
];

export default function WebsitePage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', ownsHome: '', floors: '', roofType: '',
    installationType: '', batteryOption: '',
    callToDiscuss: '', installationTimeframe: '',
    monthlyBill: '', electricityRate: '0.32',
  });
  const [powerBillFile, setPowerBillFile] = useState(null);
  const [billAnalysis, setBillAnalysis] = useState({ loading: false, done: false, error: '', data: null });
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

  const uploadBill = async (file) => {
    if (!file) return;
    setPowerBillFile(file);
    setBillAnalysis({ loading: true, done: false, error: '', data: null });
    try {
      const fd = new FormData();
      fd.append('bill', file);
      if (form.firstName) fd.append('firstName', form.firstName);
      if (form.lastName)  fd.append('lastName',  form.lastName);
      if (form.email)     fd.append('email',     form.email);
      if (form.phone)     fd.append('phone',     form.phone);
      if (form.address)   fd.append('address',   form.address);
      const { data } = await axios.post('/api/powerbill/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBillAnalysis({ loading: false, done: true, error: '', data });
      // If the bill extracted a monthly cost, auto-fill the Monthly Bill field
      if (data.analysis?.monthly_cost && !form.monthlyBill) {
        setForm(f => ({ ...f, monthlyBill: String(Math.round(data.analysis.monthly_cost)) }));
      }
    } catch (e) {
      setBillAnalysis({ loading: false, done: false, error: e.response?.data?.error || 'Could not read the bill. Try a clearer PDF or image.', data: null });
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
      <nav className="fixed top-0 left-0 right-0 z-50 px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20 relative" style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <div className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray Energy NZ" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display tracking-tight text-white">GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span></div>
            <div className="text-[9px] text-amber-200/80 italic">Powering a Sustainable Future</div>
          </div>
        </div>
        <div className="flex items-center gap-6 relative">
          <Link to="/products" className="text-sm text-gray-200 hover:text-amber-300 font-medium transition">Products</Link>
          <Link to="/catalog"  className="text-sm text-gray-200 hover:text-amber-300 font-medium transition">🛒 Shop</Link>
          {['How It Works', 'Calculator', 'Case Studies', 'Testimonials', 'FAQ', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-gray-200 hover:text-amber-300 font-medium transition">{l}</a>
          ))}
          <Link to="/finance" className="text-sm font-semibold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent hover:from-amber-200 hover:to-white transition">
            💰 Finance
          </Link>
          <Link to="/login">
            <Button size="sm" icon={Lock}>Employee Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center px-16 bg-mesh-vibrant relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 opacity-25 blur-3xl animate-blob" />
        <div className="absolute top-[10%] right-[-80px] w-[460px] h-[460px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-25 blur-3xl animate-blob-delay-2" />
        <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 opacity-20 blur-3xl animate-blob-delay-4" />
        <div className="absolute top-[8%] right-[5%] opacity-[0.08] animate-spin-slow">
          <svg viewBox="0 0 200 200" className="w-[480px]">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = i * 30 * Math.PI / 180;
              return <line key={i} x1={100 + Math.cos(a) * 50} y1={100 + Math.sin(a) * 50} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="#ec4899" strokeWidth="3" />;
            })}
            <circle cx="100" cy="100" r="35" fill="#f59e0b" />
          </svg>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-violet-500/15 border border-pink-200 mb-6 backdrop-blur">
            <Sparkles size={13} className="text-pink-500" />
            <span className="text-xs font-bold text-gradient-warm">NEW ZEALAND'S SOLAR ENERGY EXPERTS</span>
          </div>
          <h1 className="text-5xl font-extrabold font-display leading-tight mb-5">
            Clean Energy for<br />Aotearoa's <span className="text-gradient-warm animate-gradient">Future</span>
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-lg mb-8">
            From Kiwi homes to commercial installations — <span className="font-semibold text-pink-600">Goldenray Energy NZ</span> delivers solar solutions with instant quotes, CO₂ tracking, and professional proposals.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="#calculator"><Button size="lg" icon={Zap}>Get Free Quote</Button></a>
            <Link to="/finance"><Button variant="success" size="lg" icon={DollarSign}>$0 Upfront Finance</Button></Link>
            <Button variant="dark" size="lg" icon={Phone}>+64 9 123 4567</Button>
          </div>
          <div className="flex gap-12 mt-12">
            {[
              { n: '1,800+', l: 'Installations', c: 'from-amber-500 to-orange-500' },
              { n: '$32M+', l: 'Savings', c: 'from-pink-500 to-fuchsia-500' },
              { n: '12,000t', l: 'CO₂ Saved', c: 'from-teal-500 to-emerald-500' },
              { n: '98%', l: 'Satisfaction', c: 'from-violet-500 to-indigo-500' },
            ].map((s, i) => (
              <div key={i}>
                <div className={`text-2xl font-extrabold font-display bg-gradient-to-br ${s.c} bg-clip-text text-transparent`}>{s.n}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 px-16 bg-gradient-to-b from-white via-rose-50/40 to-white">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-solar">PRODUCTS</div>
          <h2 className="text-3xl font-extrabold font-display">Solar Solutions for <span className="text-gradient-warm">Aotearoa</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { name: 'Home Rooftop',    size: '3-10kW',    price: 'From $8,500',  priceColor: 'from-sky-500 to-indigo-500',     badge: 'from-sky-500 to-blue-600',         img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=400&fit=crop&auto=format&q=80',  alt: 'Rooftop solar panels on residential home' },
            { name: 'Solar + Battery', size: '5-15kW',    price: 'From $18,000', priceColor: 'from-emerald-500 to-teal-500',   badge: 'from-emerald-500 to-teal-600',     img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=400&fit=crop&auto=format&q=80',  alt: 'Home solar with battery storage' },
            { name: 'Commercial',      size: '25-500kW',  price: 'Custom Quote', priceColor: 'from-fuchsia-500 to-violet-500', badge: 'from-fuchsia-500 to-violet-600',   img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=400&fit=crop&auto=format&q=80',  alt: 'Large commercial solar farm installation' },
          ].map((p, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-100 transition-all duration-300 group">
              <div className="h-44 relative overflow-hidden">
                <img src={p.img} alt={p.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg bg-gradient-to-r ${p.badge}`}>{p.size}</div>
              </div>
              <div className="p-5">
                <h4 className="font-bold font-display mb-1">{p.name}</h4>
                <p className="text-xs text-gray-400 mb-3">{p.size} system</p>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className={`text-sm font-extrabold font-display bg-gradient-to-r ${p.priceColor} bg-clip-text text-transparent`}>{p.price}</span>
                  <a href="#calculator"><Button size="sm" icon={ArrowRight}>Quote</Button></a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-16 bg-gradient-to-br from-violet-50 via-white to-cyan-50">
        <div className="text-center mb-14">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-cool">HOW IT WORKS</div>
          <h2 className="text-3xl font-extrabold font-display">Solar in <span className="text-gradient-warm">4 Simple Steps</span></h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">From first enquiry to powering your home — we handle everything for a seamless transition to solar.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-6 relative">
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-sky-400 via-pink-400 via-amber-400 to-emerald-400 hidden md:block rounded-full opacity-60" />
          {[
            { step: '01', icon: Eye,    title: 'Free Consultation',    desc: 'We assess your energy usage, roof space, and goals. Get a personalised solar proposal within 24 hours.', gradient: 'from-sky-400 to-blue-500',         ring: 'ring-sky-200' },
            { step: '02', icon: Wrench, title: 'Custom Design',        desc: 'Our engineers design the optimal system — panel layout, inverter sizing, and battery if needed.',       gradient: 'from-pink-500 to-fuchsia-500',     ring: 'ring-pink-200' },
            { step: '03', icon: Truck,  title: 'Professional Install', desc: 'Our certified installers handle everything — mounting, wiring, council consent, and grid connection.',  gradient: 'from-amber-500 to-orange-500',     ring: 'ring-amber-200' },
            { step: '04', icon: Power,  title: 'Power On & Save',      desc: 'Your system goes live! Monitor savings in real-time and enjoy decades of clean, free energy.',           gradient: 'from-emerald-500 to-teal-500',     ring: 'ring-emerald-200' },
          ].map((s, i) => (
            <div key={i} className="relative text-center">
              <div className={`w-24 h-24 rounded-2xl mx-auto flex items-center justify-center mb-4 relative z-10 bg-gradient-to-br ${s.gradient} shadow-xl ring-4 ${s.ring} hover:scale-110 hover:rotate-3 transition-transform duration-300`}>
                <s.icon size={34} className="text-white drop-shadow" />
              </div>
              <div className={`text-[10px] font-extrabold tracking-widest mb-1 bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>STEP {s.step}</div>
              <h4 className="text-sm font-bold font-display mb-2">{s.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#calculator"><Button size="lg" icon={Zap}>Start Your Free Quote</Button></a>
        </div>
      </section>

      {/* ═══════ SOLAR CALCULATOR ═══════ */}
      <section id="calculator" className="py-24 px-6 md:px-16 bg-mesh-calc relative overflow-hidden">
        <div className="absolute top-20 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-pink-300 to-fuchsia-400 opacity-20 blur-3xl animate-blob" />
        <div className="absolute bottom-20 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 opacity-20 blur-3xl animate-blob-delay-2" />
        <div className="text-center mb-12 relative">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-warm">FREE SOLAR CALCULATOR</div>
          <h2 className="text-3xl font-extrabold font-display">Get Your <span className="text-gradient-warm">Instant Solar Quote</span></h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">Enter your electricity details and we'll calculate exactly how much you can save with solar — plus download a detailed PDF quote.</p>
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
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Power Bill Upload <span className="text-gray-300 font-normal">(we'll auto-read your usage)</span></label>
                  <label className="mt-1 flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer transition text-sm text-gray-500">
                    {billAnalysis.loading ? <Loader2 size={14} className="flex-shrink-0 animate-spin text-amber-500" /> : <Upload size={14} className="flex-shrink-0" />}
                    <span className="truncate">{billAnalysis.loading ? 'Reading your bill...' : powerBillFile ? powerBillFile.name : 'Upload any bill — PDF, image, or text'}</span>
                    <input type="file" onChange={e => e.target.files[0] && uploadBill(e.target.files[0])} className="hidden" />
                  </label>
                  {billAnalysis.error && (
                    <div className="mt-2 text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">{billAnalysis.error}</div>
                  )}
                  {billAnalysis.done && billAnalysis.data && (() => {
                    const ex = billAnalysis.data.extracted || {};
                    const an = billAnalysis.data.analysis  || {};
                    const rec = an.recommended_scenario;
                    return (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-3 text-xs space-y-3">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle size={12} /> Bill analysed — {billAnalysis.data.status === 'processed' ? 'all key fields read' : 'partial read'}
                        </div>

                        {/* ── Headline extracted ── */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          {[
                            ex.retailer         && ['Retailer',     ex.retailer],
                            ex.plan_name        && ['Plan',         ex.plan_name],
                            ex.total_kwh        && ['Total kWh',    ex.total_kwh + ' kWh'],
                            ex.total_cost       && ['Total cost',   '$' + ex.total_cost],
                            ex.avg_daily_kwh    && ['Daily avg',    ex.avg_daily_kwh + ' kWh'],
                            ex.avg_cost_per_kwh && ['Rate / kWh',   '$' + ex.avg_cost_per_kwh],
                            an.annual_kwh       && ['Est. annual',  an.annual_kwh.toLocaleString() + ' kWh'],
                            an.annual_cost      && ['Est. annual $', '$' + an.annual_cost.toLocaleString()],
                          ].filter(Boolean).map(([l, v], i) => (
                            <div key={i} className="flex justify-between gap-2 border-b border-gray-100 pb-0.5">
                              <span className="text-gray-400">{l}</span><span className="font-semibold text-gray-700 truncate">{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* ── Recommended solar fit banner ── */}
                        {rec && (
                          <div className="rounded-lg bg-gradient-to-br from-amber-500 to-pink-500 text-white p-3 shadow">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-[10px] uppercase tracking-widest font-bold opacity-85">Best-fit solar system</div>
                              <div className="text-[10px] opacity-85">Payback ~{rec.payback_years} yrs</div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-2xl font-extrabold font-display">{rec.system_kw} kW</div>
                                <div className="text-[10px] opacity-90">{rec.panel_count} panels · {rec.bill_offset_pct}% offset</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-extrabold font-display">${rec.annual_saving.toLocaleString()}/yr</div>
                                <div className="text-[10px] opacity-90">25-yr save ~${rec.saving_25yr.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Quick deep-dive chips ── */}
                        <div className="flex flex-wrap gap-1.5">
                          {an.usage_band && an.usage_band !== 'unknown' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                              {an.usage_band === 'low' ? 'Low user' : an.usage_band === 'average' ? 'Average user' : an.usage_band === 'high' ? 'High user' : 'Very-high user'}
                              {an.usage_vs_avg_pct != null && ` · ${an.usage_vs_avg_pct > 0 ? '+' : ''}${an.usage_vs_avg_pct}% vs NZ avg`}
                            </span>
                          )}
                          {an.rate_band && an.rate_band !== 'unknown' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 font-bold">
                              Rate: {an.rate_band.replace('-', ' ')}
                            </span>
                          )}
                          {an.current_co2_kg && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold">
                              {Math.round(an.current_co2_kg)} kg CO₂/yr
                            </span>
                          )}
                          {an.trees_equivalent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                              ≈ {an.trees_equivalent} trees/yr with solar
                            </span>
                          )}
                          {an.switch_saving_annual > 0 && an.cheaper_retailers?.[0] && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold">
                              Switch → save ~${Math.round(an.switch_saving_annual)}/yr
                            </span>
                          )}
                        </div>

                        {/* ── Top 3 recommendations ── */}
                        {an.recommendations?.length > 0 && (
                          <details className="bg-white/80 rounded-lg border border-amber-100" open>
                            <summary className="cursor-pointer px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50 rounded-lg">
                              💡 Personalised recommendations ({an.recommendations.length})
                            </summary>
                            <ul className="px-3 pb-2 pt-1 space-y-1.5">
                              {an.recommendations.slice(0, 5).map((r, i) => (
                                <li key={i} className="text-[10.5px] leading-relaxed">
                                  <b className="text-gray-800">{r.title}.</b> <span className="text-gray-600">{r.tip}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}

                        {/* ── Expandable: all 4 solar scenarios ── */}
                        {an.scenarios?.length > 0 && (
                          <details className="bg-white/80 rounded-lg border border-amber-100">
                            <summary className="cursor-pointer px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50 rounded-lg">
                              ☀️ All 4 solar sizing scenarios
                            </summary>
                            <div className="grid grid-cols-2 gap-1.5 px-2 pb-2 pt-1">
                              {an.scenarios.map(s => {
                                const isRec = rec?.system_kw === s.system_kw;
                                return (
                                  <div key={s.system_kw} className={`rounded-lg p-2 text-[10px] ${isRec ? 'bg-amber-100 border border-amber-300' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                      <b className="text-[11px]">{s.system_kw} kW</b>
                                      {isRec && <span className="text-[8px] bg-amber-500 text-white px-1 rounded font-bold">BEST</span>}
                                    </div>
                                    <div className="flex justify-between"><span className="text-gray-500">Cost</span><b>${s.system_cost.toLocaleString()}</b></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Save/yr</span><b className="text-emerald-600">${s.annual_saving.toLocaleString()}</b></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Payback</span><b>{s.payback_years}y</b></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Offset</span><b>{s.bill_offset_pct}%</b></div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}
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
      <section id="testimonials" className="py-24 px-16 bg-gradient-to-br from-pink-50 via-amber-50/40 to-violet-50">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-solar">TESTIMONIALS</div>
          <h2 className="text-3xl font-extrabold font-display">Loved by <span className="text-gradient-warm">Kiwis</span></h2>
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            { name: 'Tane & Maia',  text: '6kW system dropped our bill from $380 to $45/month!', loc: 'Auckland',     accent: 'from-pink-500 to-rose-500',      bg: 'from-pink-50/70 to-white' },
            { name: 'Sarah Chen',   text: '120kW powers our winery. $4,000+/month savings.',     loc: 'Marlborough',  accent: 'from-amber-500 to-orange-500',   bg: 'from-amber-50/70 to-white' },
            { name: 'Dave O\'Brien', text: 'Off-grid was the best decision. No more power bills!', loc: 'Waikato',    accent: 'from-teal-500 to-cyan-500',      bg: 'from-teal-50/70 to-white' },
          ].map((t, i) => (
            <div key={i} className={`bg-gradient-to-br ${t.bg} rounded-2xl p-6 border border-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${t.accent}`} />
              <div className="flex gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}</div>
              <p className="text-sm text-gray-700 italic leading-relaxed mb-4">"{t.text}"</p>
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.accent} flex items-center justify-center text-white text-[11px] font-extrabold shadow`}>
                  {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.loc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies */}
      <section id="case-studies" className="py-24 px-16 bg-gradient-to-b from-white via-cyan-50/30 to-white">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-cool">CASE STUDIES</div>
          <h2 className="text-3xl font-extrabold font-display">Real Projects, <span className="text-gradient-warm">Real Savings</span></h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">Dive into the facts and figures behind some of our solar installations across New Zealand.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { type: 'Residential', title: 'Auckland Family Home', system: '8.2 kW', panels: 15, before: '$420/mo', after: '$52/mo', savings: '$88,000+', payback: '5.8 years', co2: '2.1t/yr', color: '#2563eb', gradient: 'from-blue-50 to-sky-50' },
            { type: 'Commercial', title: 'Mega Foods Warehouse', system: '120 kW', panels: 218, before: '$6,200/mo', after: '$680/mo', savings: '$1.4M+', payback: '4.2 years', co2: '28t/yr', color: '#059669', gradient: 'from-emerald-50 to-green-50' },
            { type: 'Community', title: 'Rauawaawa Kaumātua Trust', system: '35 kW', panels: 64, before: '$1,800/mo', after: '$190/mo', savings: '$385,000+', payback: '5.1 years', co2: '8.4t/yr', color: '#7c3aed', gradient: 'from-violet-50 to-purple-50' },
          ].map((cs, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 transition-transform">
              <div className="h-44 overflow-hidden relative">
                {CASE_STUDY_IMAGES[i]}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: cs.color }}>{cs.system}</div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: cs.color + 'cc' }}>{cs.type}</div>
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
      <section className="py-24 px-16 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #831843 65%, #7c2d12 100%)' }}>
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 opacity-25 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-amber-500 to-orange-600 opacity-25 blur-3xl animate-blob-delay-2" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 opacity-20 blur-3xl animate-blob-delay-4" />
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = i * 30 * Math.PI / 180;
              return <line key={i} x1={100 + Math.cos(a) * 50} y1={100 + Math.sin(a) * 50} x2={100 + Math.cos(a) * 90} y2={100 + Math.sin(a) * 90} stroke="#fbbf24" strokeWidth="3" />;
            })}
            <circle cx="100" cy="100" r="35" fill="#fbbf24" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block text-xs font-extrabold tracking-widest mb-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400 bg-clip-text text-transparent border border-pink-400/30 backdrop-blur">OUR MISSION</div>
          <h2 className="text-4xl font-extrabold font-display mb-6">
            Powering <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent animate-gradient">Aotearoa</span> with Trusted Solar
          </h2>
          <p className="text-base text-gray-200 leading-relaxed max-w-2xl mx-auto mb-10">
            Our mission is to power New Zealand with trusted solar — delivering real savings, lower emissions, and giving back Kiwi's energy independence. We believe every home and business deserves access to clean, affordable energy.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: DollarSign, label: 'Real Savings',         desc: 'Average 85% reduction in electricity bills', gradient: 'from-amber-400 to-orange-500' },
              { icon: Leaf,       label: 'Lower Emissions',      desc: '12,000+ tonnes of CO₂ offset and counting',   gradient: 'from-emerald-400 to-teal-500' },
              { icon: Shield,     label: 'Energy Independence',  desc: 'Protection from rising electricity costs',    gradient: 'from-pink-400 to-fuchsia-500' },
            ].map((m, i) => (
              <div key={i} className="text-center group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mx-auto mb-3 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <m.icon size={22} className="text-white drop-shadow" />
                </div>
                <div className="text-sm font-bold mb-1">{m.label}</div>
                <div className="text-[11px] text-gray-300">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners & Certifications */}
      <section className="py-16 px-16 bg-gradient-to-b from-white via-amber-50/40 to-white">
        <div className="text-center mb-10">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-solar">TRUSTED BY</div>
          <h2 className="text-2xl font-extrabold font-display">Our Partners & <span className="text-gradient-warm">Certifications</span></h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: 'SEANZ', desc: 'Sustainable Energy Association NZ', emoji: '🏛️', tint: 'hover:border-pink-300 hover:bg-pink-50/60' },
            { name: 'EECA', desc: 'Energy Efficiency & Conservation Authority', emoji: '⚡', tint: 'hover:border-amber-300 hover:bg-amber-50/60' },
            { name: 'CEC', desc: 'Clean Energy Council Approved', emoji: '✅', tint: 'hover:border-emerald-300 hover:bg-emerald-50/60' },
            { name: 'Master Electricians', desc: 'Licensed & Certified', emoji: '🔧', tint: 'hover:border-sky-300 hover:bg-sky-50/60' },
            { name: 'SBN', desc: 'Sustainable Business Network', emoji: '🌿', tint: 'hover:border-teal-300 hover:bg-teal-50/60' },
            { name: 'ENZ', desc: 'Electricity Networks NZ', emoji: '🔌', tint: 'hover:border-violet-300 hover:bg-violet-50/60' },
          ].map((p, i) => (
            <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 ${p.tint} transition-all hover:-translate-y-1 hover:shadow-lg`}>
              <div className="text-2xl mb-2">{p.emoji}</div>
              <div className="text-[10px] font-bold text-gray-700 text-center">{p.name}</div>
              <div className="text-[8px] text-gray-400 text-center mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-16 bg-gradient-to-br from-violet-50 via-pink-50/40 to-amber-50">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-warm">FAQ</div>
          <h2 className="text-3xl font-extrabold font-display">Frequently Asked <span className="text-gradient-warm">Questions</span></h2>
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
      <section id="contact" className="py-24 px-16 bg-gradient-to-br from-white via-teal-50/40 to-pink-50/30">
        <div className="text-center mb-12">
          <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-cool">CONTACT</div>
          <h2 className="text-3xl font-extrabold font-display">Kia Ora — <span className="text-gradient-warm">Let's Talk Solar</span></h2>
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
            {[
              { icon: MapPin, text: 'Level 3, 45 Queen St, Auckland',  gradient: 'from-sky-400 to-blue-500' },
              { icon: Phone,  text: '+64 9 123 4567',                  gradient: 'from-emerald-500 to-teal-500' },
              { icon: Mail,   text: 'hello@goldenrayenergy.co.nz',     gradient: 'from-amber-500 to-orange-500' },
              { icon: Clock,  text: 'Mon-Fri 8am-6pm, Sat 9am-1pm',    gradient: 'from-pink-500 to-fuchsia-500' },
            ].map((c, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${c.gradient} shadow-md`}>
                  <c.icon size={17} className="text-white" />
                </div>
                <div className="flex items-center text-sm text-gray-700 font-medium">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating widgets — SolarBot (right) + WhatsApp (left) */}
      <SolarChatbot />
      <WhatsAppAssistant />

      {/* Footer */}
      <WebsiteFooter homepage />
    </div>
  );
}
