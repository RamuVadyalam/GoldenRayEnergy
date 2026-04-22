import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Lock, Phone, Mail, ArrowRight, CheckCircle2, Sun, Battery, Zap, Car,
  Home, Building2, MountainSnow, Sparkles, ShieldCheck, Clock, Wrench, Award,
  Send, Loader2, Users, Calculator, MapPin,
} from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';
import SolarChatbot from '../components/website/SolarChatbot';
import WhatsAppAssistant from '../components/website/WhatsAppAssistant';

// ═══════════════════════════════════════════════════════════════════════
// Market data — bundles, hero, FAQ per segment
// ═══════════════════════════════════════════════════════════════════════
const MARKET_DATA = {
  residential: {
    id: 'residential',
    title: 'Residential Solar',
    tagline: 'Rooftop solar, batteries & EV charging for Kiwi homes',
    heroImg: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=600&fit=crop&auto=format&q=80',
    gradient: 'from-amber-500 via-orange-500 to-pink-500',
    heroTint: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 40%, #dc2626 100%)',
    icon: Home,
    intro: 'Choose from 4 pre-configured bundles built for Auckland-Wellington-Christchurch homes. Prices include installation, consent, grid-connection paperwork, and 10-year workmanship warranty.',
    bundles: [
      {
        id: 'res-starter-3kw',
        name: 'Starter 3 kW',
        subtitle: 'Entry-level rooftop for small households',
        priceLow: 8500, priceHigh: 10500,
        capacity: '3 kW',
        roi: '6–8 yr payback',
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'Phono Solar', detail: '7 × 410W modules' },
          { label: 'Inverter', brand: 'Sungrow SG3.0RS', detail: '3 kW single-phase' },
          { label: 'Mounting', brand: 'Sunlock', detail: 'Tile / metal rail kit' },
          { label: 'Monitoring', brand: 'Sungrow iSolarCloud', detail: 'Wi-Fi + phone app' },
        ],
        features: ['~4,200 kWh/yr generation', 'Covers 30-40% of avg bill', 'Grid-tie export ready', '10-yr inverter warranty'],
        bestFor: 'Studio / 1-2 bed home with low usage',
      },
      {
        id: 'res-standard-66kw',
        name: 'Standard 6.6 kW',
        subtitle: 'The "sweet-spot" system for most NZ homes',
        priceLow: 13000, priceHigh: 15500,
        capacity: '6.6 kW',
        roi: '5–7 yr payback',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=400&fit=crop&auto=format&q=80',
        popular: true,
        components: [
          { label: 'Panels', brand: 'REC Alpha Pure 410W', detail: '16 × high-efficiency' },
          { label: 'Inverter', brand: 'Fronius Primo GEN24 6.0', detail: 'Hybrid-ready single phase' },
          { label: 'Mounting', brand: 'S-5! / Sunlock', detail: 'Engineer-certified' },
          { label: 'Monitoring', brand: 'Fronius SolarWeb', detail: 'Per-string telemetry' },
        ],
        features: ['~9,200 kWh/yr generation', 'Covers 70-90% of avg bill', 'Future battery-ready', '10-yr product + 25-yr performance'],
        bestFor: '3-4 bed family home · $300-500 monthly bill',
      },
      {
        id: 'res-premium-battery',
        name: 'Premium 8 kW + Battery',
        subtitle: 'Solar + battery for overnight independence',
        priceLow: 22000, priceHigh: 28000,
        capacity: '8 kW + 13.5 kWh',
        roi: '8–10 yr payback',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'REC Alpha Pure-R 430W', detail: '20 × premium HJT' },
          { label: 'Inverter', brand: 'Fronius Symo GEN24 8.0', detail: '3-phase hybrid' },
          { label: 'Battery', brand: 'Tesla Powerwall 3', detail: '13.5 kWh + 11.5 kW peak' },
          { label: 'Monitoring', brand: 'Tesla + Fronius combined', detail: 'Full-house energy app' },
        ],
        features: ['~11,500 kWh/yr generation', 'Near-100% self-sufficient', 'Grid-outage backup', 'Battery 10-yr warranty'],
        bestFor: '4-5 bed home · heavy evening usage · heat pump',
      },
      {
        id: 'res-allin-ev',
        name: 'All-In 10 kW + Battery + EV',
        subtitle: 'Whole-home electrification bundle',
        priceLow: 32000, priceHigh: 42000,
        capacity: '10 kW + 13.5 kWh + EV',
        roi: '9–11 yr payback',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'REC Alpha Pure-R 430W', detail: '25 × premium HJT' },
          { label: 'Inverter', brand: 'Fronius Symo GEN24 10', detail: '3-phase hybrid' },
          { label: 'Battery', brand: 'Tesla Powerwall 3', detail: '13.5 kWh + expandable' },
          { label: 'EV Charger', brand: 'Zappi v2.1', detail: '7 kW solar-diverting' },
        ],
        features: ['~14,000 kWh/yr generation', 'Solar-charged EV', 'Export revenue', 'Full home electrification'],
        bestFor: 'Large home · 2 EVs · heat-pump heating',
      },
    ],
    faqs: [
      ['Does my roof get enough sun?', 'In NZ, any roof that gets 5+ hours of direct sun is viable. North-facing is ideal but east/west are 90% as productive. Our quote tool checks your specific address.'],
      ['How long does installation take?', 'Typical residential install is 1-2 days on-site. From signed contract to power-on is usually 4-6 weeks including consent + grid paperwork.'],
      ['Do I need a new switchboard?', 'About 30% of homes need a small switchboard upgrade. We include this in the quote upfront — no surprises.'],
      ['What happens in a power cut?', 'With a battery (Powerwall etc), selected circuits keep running. Solar-only systems cut out during outages (standard NZ grid-tie requirement).'],
    ],
  },
  commercial: {
    id: 'commercial',
    title: 'Commercial Solar',
    tagline: 'Large rooftop PV, microgrids & PPAs for NZ businesses',
    heroImg: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1600&h=600&fit=crop&auto=format&q=80',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    heroTint: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 40%, #3730a3 100%)',
    icon: Building2,
    intro: 'Commercial solar cuts operating costs and meets sustainability KPIs. Pricing includes engineering drawings, council consent, network approval and commissioning. PPAs available — zero upfront.',
    bundles: [
      {
        id: 'com-small-biz-15kw',
        name: 'Small Business 15 kW',
        subtitle: 'Offices, cafés, small retail',
        priceLow: 30000, priceHigh: 40000,
        capacity: '15 kW',
        roi: '3.5–5 yr payback',
        img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'Jinko Tiger Neo 440W', detail: '36 × commercial-grade' },
          { label: 'Inverter', brand: 'Sungrow SG15RT', detail: '3-phase commercial' },
          { label: 'Mounting', brand: 'Schletter / S-5!', detail: 'Engineer-stamped' },
          { label: 'Monitoring', brand: 'Sungrow iSolarCloud Pro', detail: 'Accountant-ready reports' },
        ],
        features: ['~21,000 kWh/yr generation', 'Peak-demand offset', 'Tax depreciation ready', 'Roof-warranty preserving'],
        bestFor: 'Business with $800-$1500/mo power bill',
      },
      {
        id: 'com-mid-50kw',
        name: 'Mid-Commercial 50 kW',
        subtitle: 'Warehouses, factories, schools',
        priceLow: 85000, priceHigh: 120000,
        capacity: '50 kW',
        roi: '4–6 yr payback',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&h=400&fit=crop&auto=format&q=80',
        popular: true,
        components: [
          { label: 'Panels', brand: 'Trina Vertex 550W', detail: '91 × bifacial' },
          { label: 'Inverter', brand: 'Sungrow SG50CX', detail: 'String commercial' },
          { label: 'Mounting', brand: 'Schletter FS Uno', detail: 'Industrial racking' },
          { label: 'Monitoring', brand: 'Solar Analytics + Sungrow', detail: 'Real-time tariff optimisation' },
        ],
        features: ['~70,000 kWh/yr generation', 'Daytime load matched', 'ESG/CDP reportable', '10-yr full warranty'],
        bestFor: 'Business with $3,000-6,000/mo power bill',
      },
      {
        id: 'com-warehouse-100kw',
        name: 'Warehouse 100+ kW',
        subtitle: 'Large-format commercial rooftop',
        priceLow: 180000, priceHigh: 350000,
        capacity: '100–200 kW',
        roi: '4.5–7 yr payback',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'LONGi Hi-MO X6 620W', detail: '160+ bifacial modules' },
          { label: 'Inverter', brand: 'Sungrow SG125CX', detail: 'String commercial (x multiple)' },
          { label: 'Mounting', brand: 'Schletter', detail: 'Ballasted + mechanical hybrid' },
          { label: 'Battery (opt)', brand: 'BYD + Victron hybrid', detail: 'Peak-shaving for demand charges' },
        ],
        features: ['150,000–300,000 kWh/yr', 'Peak-demand shaving', 'Eligible for PPA finance', 'Installer + electrician team'],
        bestFor: 'Manufacturing, cold storage, supermarket',
      },
      {
        id: 'com-industrial-500kw',
        name: 'Industrial 500 kW + PPA',
        subtitle: 'Large industrial / PPA option',
        priceLow: 800000, priceHigh: 1200000,
        capacity: '500 kW – 1 MW',
        roi: '5–8 yr payback (or $0 PPA)',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'Trina / LONGi bifacial 620W+', detail: '800+ modules' },
          { label: 'Inverter', brand: 'Sungrow central 250-500 kW', detail: 'Multiple units' },
          { label: 'Monitoring', brand: 'SCADA integration', detail: 'Plant-level analytics' },
          { label: 'Finance', brand: 'PPA available', detail: 'Pay-per-kWh, no capex' },
        ],
        features: ['1 M+ kWh/yr', 'PPA structure available', 'Carbon credit ready', 'Turn-key EPC delivery'],
        bestFor: 'Manufacturing plant, cold-store, large logistics',
      },
    ],
    faqs: [
      ['Can we depreciate solar on our tax?', 'Yes — NZ IRD accepts 15-year straight-line depreciation on commercial solar (Class "Electricity Generation Equipment"). Your accountant will love it.'],
      ['What is a PPA?', 'Power Purchase Agreement — a third party (often us) owns the system, installs on your roof, and sells you the electricity at 30-50% below grid rate. Zero capex, zero maintenance risk.'],
      ['How is network approval handled?', 'We submit Network Connection Applications to your lines company (Vector, Powerco, etc) and handle all engineering drawings + compliance paperwork.'],
      ['Does it affect roof warranty?', 'We use S-5! non-penetrating clamps on metal roofs (preserves roof warranty) and engineered tile-hooks on concrete tile. Full roof-safe certification on every job.'],
    ],
  },
  offgrid: {
    id: 'offgrid',
    title: 'Off-Grid Solar',
    tagline: 'Bach, farm, lodge & remote power independence',
    heroImg: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&h=600&fit=crop&auto=format&q=80',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    heroTint: 'linear-gradient(135deg, #064e3b 0%, #0f766e 40%, #0e7490 100%)',
    icon: MountainSnow,
    intro: 'Build a self-sufficient power system for your bach, farm or remote lodge. Every kit includes sizing consultation, remote monitoring, and 2-year on-site service coverage.',
    bundles: [
      {
        id: 'off-bach-3kw',
        name: 'Weekend Bach 3 kW',
        subtitle: 'Seasonal cabin essentials',
        priceLow: 14000, priceHigh: 22000,
        capacity: '3 kW + 10 kWh',
        roi: 'vs diesel: 2-4 yr',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'Phono Solar 410W', detail: '7 × ground or roof mount' },
          { label: 'Inverter', brand: 'Victron MultiPlus-II 3000', detail: '48V off-grid ready' },
          { label: 'Battery', brand: 'BYD Battery-Box 10.2 kWh', detail: 'LFP modular' },
          { label: 'Generator input', brand: 'Victron generator auto-start', detail: 'For extended cloudy stretches' },
        ],
        features: ['Runs lights, fridge, laptop', 'Silent during the day', 'Auto-generator fallback', 'Phone monitoring (4G/Starlink)'],
        bestFor: 'Seasonal weekend use · 1-2 people',
      },
      {
        id: 'off-farm-10kw',
        name: 'Farm / Remote Home 10 kW',
        subtitle: 'Full-time off-grid family home',
        priceLow: 40000, priceHigh: 60000,
        capacity: '10 kW + 20 kWh',
        roi: 'vs grid-extension: instant',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=400&fit=crop&auto=format&q=80',
        popular: true,
        components: [
          { label: 'Panels', brand: 'REC Alpha Pure 410W', detail: '25 × premium' },
          { label: 'Inverter', brand: 'Victron Quattro 10kVA', detail: '3-phase capable' },
          { label: 'Battery', brand: 'Freedom Won eTower 20 kWh', detail: 'LFP deep-cycle' },
          { label: 'Generator', brand: 'Backup diesel 10 kVA', detail: 'Auto-start Victron integrated' },
        ],
        features: ['Full-time family use', 'Heat pump compatible', 'Auto-start generator', '3-yr on-site service'],
        bestFor: 'Full-time off-grid · 3-4 people',
      },
      {
        id: 'off-homestead-15kw',
        name: 'Full Homestead 15 kW',
        subtitle: 'High-use off-grid property',
        priceLow: 65000, priceHigh: 95000,
        capacity: '15 kW + 40 kWh',
        roi: 'vs 10 km grid extension: saves $50-100k',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'REC Alpha Pure-R 430W', detail: '35 × premium HJT' },
          { label: 'Inverter', brand: 'Victron Quattro 15kVA x2', detail: 'Parallel-stacked 3-phase' },
          { label: 'Battery', brand: 'Freedom Won Business 40 kWh', detail: 'Commercial LFP' },
          { label: 'EV charger', brand: 'Zappi 7kW', detail: 'Solar-diverting' },
        ],
        features: ['Runs heat pumps, workshop, EV', 'Micro-grid capable', 'Remote monitoring', 'Hybrid diesel backup'],
        bestFor: 'Homestead · farm + business · 4+ people',
      },
      {
        id: 'off-commercial-lodge',
        name: 'Lodge / Remote Business',
        subtitle: 'Commercial off-grid turnkey',
        priceLow: 120000, priceHigh: 250000,
        capacity: '25–50 kW + 80+ kWh',
        roi: 'Custom quote',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=400&fit=crop&auto=format&q=80',
        popular: false,
        components: [
          { label: 'Panels', brand: 'LONGi Hi-MO 6 + Jinko', detail: '60+ bifacial modules' },
          { label: 'Inverter', brand: 'Victron Quattro stack', detail: '3-phase 50+ kVA' },
          { label: 'Battery', brand: 'Freedom Won + Shoto LFP', detail: '80-160 kWh' },
          { label: 'Backup', brand: 'Hybrid diesel + biofuel', detail: 'Multi-gen redundancy' },
        ],
        features: ['24/7 commercial', 'Remote SCADA monitoring', 'Starlink-integrated', 'Full O&M contract'],
        bestFor: 'Lodges, remote schools, research stations',
      },
    ],
    faqs: [
      ['What does "off-grid" mean?', 'No connection to the national power grid. Your system must generate + store 100% of its own electricity, year-round — including cloudy winter weeks.'],
      ['Do I need a generator?', 'Usually yes. A small diesel or biofuel genset covers the 5-10% of the year when solar + battery isn\'t enough (July-August cloudy stretches). Modern systems auto-start it as needed.'],
      ['Can I run a heat pump off-grid?', 'Yes — our 10 kW+ systems support heat-pump heating, hot water and cooking. Sizing accounts for your actual appliances.'],
      ['What about Starlink / Wi-Fi?', 'Starlink uses ~50W — trivial for any of our systems. We integrate the Starlink router into your Victron 48V DC distribution for maximum efficiency.'],
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════
export default function MarketPage() {
  const { market } = useParams();
  const navigate = useNavigate();
  const data = MARKET_DATA[market];

  useEffect(() => { window.scrollTo(0, 0); }, [market]);

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    intent: 'quote', timeframe: '', budgetBand: '', notes: '',
  });
  const [state, setState] = useState({ loading: false, done: false, error: '', id: '' });

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-display mb-2">Unknown market</h2>
          <p className="text-sm text-gray-500 mb-4">Choose residential, commercial, or off-grid.</p>
          <Link to="/products"><Button icon={ArrowLeft}>Back to Products</Button></Link>
        </div>
      </div>
    );
  }

  const Icon = data.icon;

  const openEnquiry = (bundle) => {
    setSelectedBundle(bundle);
    setForm(f => ({ ...f, budgetBand: bundle ? `$${(bundle.priceLow / 1000).toFixed(0)}k – $${(bundle.priceHigh / 1000).toFixed(0)}k` : '' }));
    setTimeout(() => document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, done: false, error: '', id: '' });
    try {
      const payload = {
        ...form,
        market: data.id,
        bundleId:   selectedBundle?.id,
        bundleName: selectedBundle?.name,
        productBrands: selectedBundle?.components?.map(c => c.brand) || [],
        approxValue: selectedBundle ? Math.round((selectedBundle.priceLow + selectedBundle.priceHigh) / 2) : null,
      };
      const { data: resp } = await axios.post('/api/product-enquiry', payload);
      setState({ loading: false, done: true, error: '', id: resp.id });
    } catch (err) {
      setState({ loading: false, done: false, error: err.response?.data?.error || 'Submission failed. Please try again.', id: '' });
    }
  };

  const fmt$ = (n) => '$' + Number(n).toLocaleString('en-NZ', { maximumFractionDigits: 0 });

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      {/* ── Dark nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <Link to="/" className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray Energy NZ" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display tracking-tight text-white">
              GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span>
            </div>
            <div className="text-[9px] text-amber-200/80 italic">Powering a Sustainable Future</div>
          </div>
        </Link>
        <div className="flex items-center gap-5 relative">
          <Link to="/products" className="text-sm text-gray-200 hover:text-amber-300 font-medium transition flex items-center gap-1.5"><ArrowLeft size={13} /> Products</Link>
          <a href="/#calculator" className="text-sm text-gray-200 hover:text-amber-300 font-medium transition hidden md:inline">Calculator</a>
          <Link to="/finance" className="text-sm font-semibold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent hidden md:inline">💰 Finance</Link>
          <Link to="/login"><Button size="sm" icon={Lock}>Employee Login</Button></Link>
        </div>
      </nav>

      {/* ═══════ Hero ═══════ */}
      <section className="pt-32 pb-16 px-6 md:px-16 text-white relative overflow-hidden" style={{ background: data.heroTint }}>
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-400 to-pink-400 opacity-25 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-20 blur-3xl animate-blob-delay-2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 mb-5 backdrop-blur">
            <Icon size={13} className="text-white" />
            <span className="text-xs font-extrabold tracking-widest">{data.title.toUpperCase()}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display leading-[1.05] mb-5">
            {data.tagline}
          </h1>
          <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-2xl mb-6">{data.intro}</p>
          <div className="flex gap-6 flex-wrap">
            <HeroStat value={data.bundles.length}   label="Ready-to-order bundles" />
            <HeroStat value={fmt$(Math.min(...data.bundles.map(b => b.priceLow)))} label="Starting price" />
            <HeroStat value={fmt$(Math.max(...data.bundles.map(b => b.priceHigh)))} label="Top-tier price" />
          </div>
        </div>
      </section>

      {/* ═══════ Market switcher ═══════ */}
      <section className="px-6 md:px-16 -mt-6 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          {Object.values(MARKET_DATA).map(m => {
            const active = m.id === data.id;
            const MI = m.icon;
            return (
              <button key={m.id} onClick={() => navigate(`/products/${m.id}`)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${active ? `bg-gradient-to-r ${m.gradient} text-white shadow-md scale-[1.02]` : 'text-gray-500 hover:bg-gray-50'}`}>
                <MI size={13} /> {m.title.replace(' Solar', '')}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════ Bundles ═══════ */}
      <section className="py-16 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-warm">PRE-BUILT BUNDLES</div>
            <h2 className="text-3xl font-extrabold font-display">Pick the bundle that fits</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">Each bundle is a turn-key quote. Mix-and-match options available after consultation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.bundles.map(b => (
              <div key={b.id} className={`bg-white rounded-2xl border overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col ${b.popular ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'}`}>
                <div className="h-40 relative overflow-hidden">
                  <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {b.popular && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-lg">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur">
                    {b.capacity}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="text-white font-extrabold font-display text-xl drop-shadow">{b.name}</div>
                    <div className="text-white/90 text-[11px] drop-shadow">{b.subtitle}</div>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Price ribbon */}
                  <div className="flex items-end justify-between mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Installed price range</div>
                      <div className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                        {fmt$(b.priceLow)} – {fmt$(b.priceHigh)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Payback</div>
                      <div className="text-xs font-bold text-emerald-600">{b.roi}</div>
                    </div>
                  </div>

                  {/* Components */}
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">What's included</div>
                    <ul className="space-y-1.5">
                      {b.components.map(c => (
                        <li key={c.label} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="flex-1">
                            <b className="text-gray-700">{c.label}:</b> <span className="text-gray-600">{c.brand}</span>
                            <span className="text-[10px] text-gray-400 block">{c.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Features + Best for */}
                  <div className="bg-gradient-to-br from-amber-50/60 to-pink-50/40 rounded-xl p-3 mb-4">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">Key features</div>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {b.features.map(f => (
                        <li key={f} className="text-[10.5px] text-gray-700 flex items-start gap-1">
                          <span className="text-amber-500 font-bold mt-0.5">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-4">
                    <b className="text-gray-700">Best for:</b> {b.bestFor}
                  </div>

                  {/* CTA */}
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => openEnquiry(b)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-1.5">
                      <Send size={13} /> Enquire · Buy
                    </button>
                    <a href="/#calculator" className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1.5">
                      <Calculator size={13} /> Quote
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Trust strip ═══════ */}
      <section className="py-10 px-6 md:px-16 bg-gradient-to-r from-amber-50/50 via-pink-50/40 to-violet-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: '10-yr workmanship', desc: 'On every installation' },
            { icon: Clock,       title: '24-hour response',  desc: 'To every enquiry' },
            { icon: Award,       title: 'Tier-1 brands only', desc: 'REC, Fronius, Tesla' },
            { icon: Users,       title: 'NZ-wide coverage',   desc: 'From Whangarei to Invercargill' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 flex items-center justify-center shadow flex-shrink-0">
                <t.icon size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold font-display">{t.title}</div>
                <div className="text-[10.5px] text-gray-500">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ Enquiry / Purchase form ═══════ */}
      <section id="enquiry-form" className="py-20 px-6 md:px-16 bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-cool">PRODUCT ENQUIRY · PURCHASE</div>
            <h2 className="text-3xl font-extrabold font-display">
              {selectedBundle ? (
                <>Enquire about <span className="text-gradient-warm">{selectedBundle.name}</span></>
              ) : (
                <>Interested in a bundle? <span className="text-gradient-warm">Let's talk</span></>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              {selectedBundle
                ? `Selected: ${selectedBundle.name} · ${fmt$(selectedBundle.priceLow)}–${fmt$(selectedBundle.priceHigh)} installed. A Goldenray specialist will respond within 24 hours with a firm quote.`
                : `Tell us what you're after — bundle, budget, timeframe — and a Goldenray specialist will respond within 24 hours with a firm quote or a purchase plan.`
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-xl">
            {state.done ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-extrabold font-display mb-2">Enquiry received!</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                  A Goldenray specialist will reach out within 24 hours. Reference:{' '}
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{state.id.slice(0, 8)}</span>
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Clock size={11} /> Typical response: under 24 hours
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {state.error && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">{state.error}</div>
                )}

                {/* Selected bundle strip */}
                {selectedBundle && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 via-white to-pink-50 border border-amber-200">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{selectedBundle.name}</div>
                      <div className="text-[11px] text-gray-500">{selectedBundle.capacity} · {fmt$(selectedBundle.priceLow)}–{fmt$(selectedBundle.priceHigh)} installed</div>
                    </div>
                    <button type="button" onClick={() => setSelectedBundle(null)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
                  <Field label="Last name" name="lastName" value={form.lastName} onChange={handleChange} />
                  <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.co.nz" />
                  <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+64 21 123 4567" />
                  <div className="col-span-2">
                    <Field label="Installation address" name="address" value={form.address} onChange={handleChange} placeholder="Street, City" />
                  </div>
                  <Select label="I want to..." name="intent" value={form.intent} onChange={handleChange} options={[
                    { value: 'quote',        label: '📝 Get a firm quote' },
                    { value: 'purchase',     label: '🛒 Buy now — ready to order' },
                    { value: 'consultation', label: '📞 Book a free consultation' },
                    { value: 'info',         label: '💬 Just asking questions' },
                  ]} />
                  <Select label="Timeframe" name="timeframe" value={form.timeframe} onChange={handleChange} options={[
                    { value: 'asap',        label: 'ASAP (0-2 months)' },
                    { value: '3-6m',        label: '3-6 months' },
                    { value: '6-12m',       label: '6-12 months' },
                    { value: 'researching', label: 'Still researching' },
                  ]} />
                  <Select label="Budget band" name="budgetBand" value={form.budgetBand} onChange={handleChange} options={[
                    { value: 'under-10k',    label: 'Under $10k' },
                    { value: '10-20k',       label: '$10k – $20k' },
                    { value: '20-40k',       label: '$20k – $40k' },
                    { value: '40-100k',      label: '$40k – $100k' },
                    { value: 'over-100k',    label: 'Over $100k' },
                    { value: 'flexible',     label: 'Flexible · want advice' },
                  ]} />
                  <div />
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Additional notes</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                      placeholder="Roof type, current power bill, specific brands you're interested in, questions..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 resize-y min-h-[80px]" />
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    No obligation · Data used only to contact you about this enquiry
                  </div>
                  <button type="submit" disabled={state.loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex items-center gap-2">
                    {state.loading ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : <><Send size={15} /> Send enquiry</>}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick-contact alternatives */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickContact icon={Phone} label="Call us"       value="+64 9 123 4567"             href="tel:+6491234567" />
            <QuickContact icon={Mail}  label="Email"         value="hello@goldenrayenergy.co.nz" href="mailto:hello@goldenrayenergy.co.nz" />
            <QuickContact icon={MapPin} label="Visit us"     value="Level 3, Queen St, Auckland" href="/#contact" />
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 px-6 md:px-16 bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-warm">{data.title.toUpperCase()} · FAQ</div>
            <h2 className="text-3xl font-extrabold font-display">Common questions</h2>
          </div>
          <div className="space-y-3">
            {data.faqs.map(([q, a], i) => <FaqItem key={i} q={q} a={a} />)}
          </div>
        </div>
      </section>

      <WebsiteFooter homepage={false} />
      <SolarChatbot />
      <WhatsAppAssistant />
    </div>
  );
}

// ── helpers ──
const HeroStat = ({ value, label }) => (
  <div>
    <div className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-300 via-pink-300 to-white bg-clip-text text-transparent">{value}</div>
    <div className="text-[11px] text-white/75 font-medium mt-0.5">{label}</div>
  </div>
);

const Field = ({ label, name, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 transition" />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    <select name={name} value={value ?? ''} onChange={onChange}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
      <option value="">Select...</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const QuickContact = ({ icon: Icon, label, value, href }) => (
  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:-translate-y-0.5 hover:shadow-md transition">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-white" />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-semibold text-gray-800 truncate">{value}</div>
    </div>
  </a>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className="text-sm font-semibold text-gray-800 pr-4">{q}</span>
        <span className={`text-amber-500 text-xl font-bold transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && <div className="px-5 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{a}</p></div>}
    </div>
  );
};
