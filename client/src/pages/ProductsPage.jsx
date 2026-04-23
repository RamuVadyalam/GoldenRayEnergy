import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Lock, Phone, Mail, MapPin, ArrowRight, CheckCircle2, Sun, Battery, Zap,
  Wrench, Wifi, Car, Home, Building2, MountainSnow, ShieldCheck, Award, Gauge, Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';
import SolarChatbot from '../components/website/SolarChatbot';
import WhatsAppAssistant from '../components/website/WhatsAppAssistant';
import SEO from '../components/SEO';

// ═══════════════════════════════════════════════════════════════════════
// Market segments
// ═══════════════════════════════════════════════════════════════════════
const MARKETS = [
  { id: 'residential',  icon: Home,        title: 'Residential',        desc: 'Rooftop solar + batteries for NZ homes, 3-20 kW systems, dual-fuel ready.', gradient: 'from-amber-500 via-orange-500 to-pink-500',    img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=380&fit=crop&auto=format&q=80' },
  { id: 'commercial',   icon: Building2,   title: 'Commercial',         desc: 'Large rooftop PV, microgrids and power purchase agreements for businesses.', gradient: 'from-sky-500 via-blue-500 to-indigo-500',     img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=380&fit=crop&auto=format&q=80' },
  { id: 'offgrid',      icon: MountainSnow, title: 'Off-Grid',           desc: 'Bach, farm and remote builds — Victron / BYD / Freedom Won hybrid solutions.', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=380&fit=crop&auto=format&q=80' },
];

// ═══════════════════════════════════════════════════════════════════════
// Product catalog — organised by category, each with brand cards
// ═══════════════════════════════════════════════════════════════════════
const CATEGORIES = [
  {
    id: 'panels',
    title: 'Solar Panels',
    subtitle: 'Tier-1 monocrystalline modules from trusted global manufacturers',
    icon: Sun,
    gradient: 'from-amber-500 to-orange-500',
    brands: [
      {
        name: 'REC',
        origin: '🇳🇴 Norway',
        tagline: 'Premium N-type heterojunction panels',
        warranty: '25-yr product + 25-yr performance',
        wattage: '400–470 W',
        models: ['REC Alpha Pure-R 430W', 'REC Alpha Pure 410W', 'REC TwinPeak 5 380W'],
        desc: 'REC Group builds the highest-efficiency panels on the NZ market. Their Alpha Pure-R series uses heterojunction (HJT) cell technology for 22.3% efficiency — ideal when roof space is limited.',
        color: '#005a8b',
        img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Phono Solar',
        origin: '🇨🇳 China',
        tagline: 'Mainstream high-value panels',
        warranty: '15-yr product + 25-yr performance',
        wattage: '390–440 W',
        models: ['Phono Draco M10 410W', 'Phono Helios N-TOPCon 440W'],
        desc: 'Phono Solar is one of China\'s top-10 manufacturers. Strong price-to-performance ratio makes them the go-to choice for mid-market residential installs.',
        color: '#dc2626',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Jinko Solar',
        origin: '🇨🇳 China',
        tagline: 'Bloomberg Tier 1 bestseller',
        warranty: '12-yr product + 25-yr performance',
        wattage: '400–580 W',
        models: ['Jinko Tiger Neo 440W', 'Jinko Tiger Pro 555W', 'Jinko Eagle 400W'],
        desc: 'World\'s #1 panel maker by volume. Their N-type TOPCon cells lead the industry for bifacial and high-wattage commercial modules.',
        color: '#0284c7',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Canadian Solar',
        origin: '🇨🇦 Canada',
        tagline: 'Robust all-round workhorse',
        warranty: '12-yr product + 25-yr performance',
        wattage: '400–550 W',
        models: ['CS HiKu6 Mono PERC 415W', 'CS TOPBiHiKu7 600W'],
        desc: 'Publicly-listed on NYSE, one of the most financially solid panel makers. A safe bet for long-term warranty enforcement.',
        color: '#dc2626',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'LONGi Solar',
        origin: '🇨🇳 China',
        tagline: 'Hi-MO Gen-6 TOPCon champion',
        warranty: '15-yr product + 30-yr performance',
        wattage: '420–620 W',
        models: ['LONGi Hi-MO 6 435W', 'LONGi Hi-MO X6 620W'],
        desc: 'LONGi holds multiple world-record cell-efficiency certificates. Their Hi-MO 6 panels offer industry-leading 30-year linear performance warranty.',
        color: '#1e40af',
        img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Trina Solar',
        origin: '🇨🇳 China',
        tagline: 'Vertex & bifacial commercial scale',
        warranty: '12-yr product + 25-yr performance',
        wattage: '420–700 W',
        models: ['Trina Vertex S+ 445W', 'Trina Vertex 695W bifacial'],
        desc: 'Vertex series drives utility-scale installations globally. Bifacial 210 mm wafers push commercial PV efficiency past 22%.',
        color: '#0891b2',
        img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
  {
    id: 'inverters',
    title: 'Inverters',
    subtitle: 'Grid-tie, hybrid and microinverters — the brain of your solar system',
    icon: Zap,
    gradient: 'from-sky-500 to-blue-600',
    brands: [
      {
        name: 'Fronius',
        origin: '🇦🇹 Austria',
        tagline: 'Gold-standard European engineering',
        warranty: '10-yr standard (extendable to 20)',
        wattage: '3–27 kW',
        models: ['Fronius Primo GEN24 Plus 6.0', 'Fronius Symo GEN24 Plus 10.0', 'Fronius Tauro 100'],
        desc: 'Fronius GEN24 Plus hybrid inverters work with any battery and any retailer. Whisper-quiet operation, Wi-Fi built in, and the most reliable brand for NZ conditions.',
        color: '#e4032c',
        img: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Sungrow',
        origin: '🇨🇳 China',
        tagline: 'World\'s largest solar inverter maker',
        warranty: '10-yr standard',
        wattage: '3–125 kW',
        models: ['Sungrow SG5.0RS', 'Sungrow SH10RT hybrid', 'Sungrow SG125CX commercial'],
        desc: 'Global leader by volume with excellent efficiency (up to 98.4%). Strong hybrid range pairs seamlessly with Sungrow batteries.',
        color: '#0ea5e9',
        img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Enphase',
        origin: '🇺🇸 USA',
        tagline: 'Microinverters — panel-level control',
        warranty: '25-yr on IQ8 microinverters',
        wattage: '384 VA per panel',
        models: ['Enphase IQ8+', 'Enphase IQ8M', 'Enphase IQ Battery 5P'],
        desc: 'Each panel has its own microinverter — no single point of failure. Handles partial shading brilliantly and provides per-panel monitoring.',
        color: '#f97316',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'SMA Sunny Boy',
        origin: '🇩🇪 Germany',
        tagline: 'Proven German reliability',
        warranty: '10-yr standard',
        wattage: '3.6–6 kW',
        models: ['SMA Sunny Boy 5.0', 'SMA Sunny Tripower 10', 'SMA Sunny Island hybrid'],
        desc: 'The inverter that\'s been running on NZ roofs for 20+ years. Unmatched service history, a reference point for quality.',
        color: '#0f766e',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Huawei FusionSolar',
        origin: '🇨🇳 China',
        tagline: 'AI-optimised hybrid inverters',
        warranty: '10-yr standard',
        wattage: '3–100 kW',
        models: ['Huawei SUN2000-5KTL-L1', 'Huawei SUN2000-10KTL-M2 hybrid'],
        desc: 'Built-in optimisers, arc-fault detection, and AI yield forecasting. Pairs with Huawei LUNA battery for full ecosystem.',
        color: '#ef4444',
        img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Victron Energy',
        origin: '🇳🇱 Netherlands',
        tagline: 'Off-grid & hybrid system specialist',
        warranty: '5-yr standard (extendable)',
        wattage: '800 W – 15 kW',
        models: ['Victron MultiPlus-II 5000', 'Victron Quattro 15kVA', 'Victron EasySolar-II'],
        desc: 'The gold standard for off-grid, marine and remote power systems. Modular, programmable, and supports parallel stacking.',
        color: '#1e40af',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
  {
    id: 'batteries',
    title: 'Battery Storage',
    subtitle: 'Lithium-iron-phosphate and NMC home & commercial batteries',
    icon: Battery,
    gradient: 'from-emerald-500 to-teal-500',
    brands: [
      {
        name: 'Tesla Powerwall 3',
        origin: '🇺🇸 USA',
        tagline: 'Integrated inverter + 13.5 kWh',
        warranty: '10-yr, 70% capacity guarantee',
        wattage: '13.5 kWh · 11.5 kW peak',
        models: ['Powerwall 3 (13.5 kWh)', 'Powerwall 3 Expansion (13.5 kWh add-on)'],
        desc: 'The most popular home battery globally. Powerwall 3 has the built-in hybrid inverter, so no separate inverter is needed for battery-only upgrades.',
        color: '#dc2626',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'BYD Battery-Box',
        origin: '🇨🇳 China',
        tagline: 'Stackable LFP premium',
        warranty: '10-yr, 60% capacity guarantee',
        wattage: '5.1–22.1 kWh modular',
        models: ['BYD Battery-Box Premium HVS 5.1–10.2 kWh', 'BYD HVM 8.3–22.1 kWh'],
        desc: 'World\'s largest EV battery maker. Modular high-voltage stacks scale from 5 to 22 kWh, works with Fronius, Sungrow, SMA, and Victron.',
        color: '#16a34a',
        img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Sonnen',
        origin: '🇩🇪 Germany',
        tagline: 'Cycle-life champion',
        warranty: '10-yr, 10,000-cycle guarantee',
        wattage: '5–20 kWh modular',
        models: ['sonnenBatterie 10 Performance+', 'sonnenBatterie Evo'],
        desc: 'Premium German LFP chemistry with the longest cycle-life guarantee on the market. Includes grid-services capability in some territories.',
        color: '#0369a1',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Enphase IQ Battery 5P',
        origin: '🇺🇸 USA',
        tagline: 'Modular 5 kWh AC-coupled',
        warranty: '15-yr product + capacity',
        wattage: '5 kWh per unit',
        models: ['IQ Battery 5P', 'IQ Battery 10T'],
        desc: 'AC-coupled design means each 5 kWh unit has its own microinverter. Ideal for retrofit installations with existing solar.',
        color: '#f97316',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Freedom Won',
        origin: '🇿🇦 South Africa',
        tagline: 'Off-grid LFP workhorse',
        warranty: '10-yr, 80% capacity',
        wattage: '5–80 kWh LFP',
        models: ['Freedom Won eTower 5 kWh', 'Freedom Won LiTE Home 10-40 kWh', 'Freedom Won Business 80 kWh'],
        desc: 'Engineered for off-grid and commercial applications. Massive 80 kWh single-cabinet option makes these the go-to for farms and lodges.',
        color: '#ea580c',
        img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Shoto LFP',
        origin: '🇨🇳 China',
        tagline: 'Commercial-scale telecom-grade',
        warranty: '10-yr, 6,000 cycles',
        wattage: '48V racks — 5-200 kWh',
        models: ['Shoto SDA10-4850', 'Shoto SDA48100 server rack'],
        desc: 'Reliable LFP batteries originally built for telecom backup. Perfect for commercial UPS, data-centre and off-grid 48V systems.',
        color: '#0f172a',
        img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
  {
    id: 'evchargers',
    title: 'EV Chargers',
    subtitle: 'Solar-aware EV chargers for home and business',
    icon: Car,
    gradient: 'from-fuchsia-500 to-violet-600',
    brands: [
      {
        name: 'Zappi',
        origin: '🇬🇧 UK',
        tagline: 'Solar-diverting 7 / 22 kW',
        warranty: '3-yr standard',
        wattage: '7.4 / 22 kW',
        models: ['Zappi v2.1 7kW tethered', 'Zappi v2.1 22kW untethered'],
        desc: 'The only EV charger that can automatically route 100% of excess solar to your car — instead of exporting it at 10c/kWh buy-back.',
        color: '#16a34a',
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Wallbox Pulsar',
        origin: '🇪🇸 Spain',
        tagline: 'Compact smart charging',
        warranty: '3-yr standard',
        wattage: '7.4 / 22 kW',
        models: ['Wallbox Pulsar Plus 7.4kW', 'Wallbox Pulsar Max 22kW'],
        desc: 'Smallest 22 kW charger on the market. Phone-app scheduling, OCPP 1.6, MID-approved meter for energy billing.',
        color: '#0ea5e9',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Fronius Wattpilot',
        origin: '🇦🇹 Austria',
        tagline: 'Fronius-ecosystem EV charger',
        warranty: '2-yr standard',
        wattage: '11 / 22 kW',
        models: ['Wattpilot Go 11 J', 'Wattpilot Home 22 J'],
        desc: 'Pairs natively with Fronius inverters for surplus-solar charging without extra kit. Portable "Go" version works at any 3-phase socket.',
        color: '#e4032c',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
  {
    id: 'mounting',
    title: 'Mounting & BOS',
    subtitle: 'Racking, rails, clamps and balance-of-system hardware',
    icon: Wrench,
    gradient: 'from-slate-500 to-zinc-600',
    brands: [
      {
        name: 'S-5!',
        origin: '🇺🇸 USA',
        tagline: 'Metal-roof clamp specialists',
        warranty: 'Lifetime on aluminium clamps',
        wattage: '—',
        models: ['S-5! PVKIT 2.0', 'S-5! Corrubracket 100T', 'S-5! ProteaBracket'],
        desc: 'The gold-standard for standing-seam and corrugated metal roofs in NZ. Non-penetrating clamps preserve roof warranty.',
        color: '#dc2626',
        img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Sunlock',
        origin: '🇦🇺 Australia',
        tagline: 'Tile-roof rapid-install',
        warranty: '10-yr structural',
        wattage: '—',
        models: ['Sunlock T-Series tile hook', 'Sunlock R-Series rail'],
        desc: 'Australian-engineered for southern-hemisphere cyclonic wind zones. Pre-assembled rails cut installation time by 30%.',
        color: '#f59e0b',
        img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Schletter',
        origin: '🇩🇪 Germany',
        tagline: 'Commercial ground-mount frames',
        warranty: '15-yr structural',
        wattage: '—',
        models: ['Schletter FS Uno ground mount', 'Schletter MultiAngle pitched'],
        desc: 'German-engineered aluminium substructures for commercial ground-mount and pitched-roof systems up to 1 MW arrays.',
        color: '#0f172a',
        img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Optimisers',
    subtitle: 'Panel-level optimisation, Wi-Fi monitoring and smart metering',
    icon: Wifi,
    gradient: 'from-pink-500 to-rose-600',
    brands: [
      {
        name: 'Tigo TS4',
        origin: '🇺🇸 USA',
        tagline: 'Panel-level optimisers + rapid shutdown',
        warranty: '25-yr on optimiser',
        wattage: '—',
        models: ['Tigo TS4-A-O (optimise)', 'Tigo TS4-A-F (rapid shutdown)'],
        desc: 'Add-on panel-level optimisation for string inverters. Mitigates shade loss and provides panel-level telemetry and fire-safety rapid shutdown.',
        color: '#0284c7',
        img: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Solar Analytics',
        origin: '🇦🇺 Australia',
        tagline: 'Independent monitoring service',
        warranty: 'Subscription-based',
        wattage: '—',
        models: ['Solar Analytics SA Monitor', 'SA Smart Meter'],
        desc: 'Independent monitoring that\'s brand-agnostic. 5-minute granularity, plan-switching advice and tariff optimisation recommendations.',
        color: '#f59e0b',
        img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=240&fit=crop&auto=format&q=80',
      },
      {
        name: 'Enphase Envoy',
        origin: '🇺🇸 USA',
        tagline: 'Per-panel live monitoring',
        warranty: '5-yr',
        wattage: '—',
        models: ['IQ Gateway Metered', 'IQ Combiner 5'],
        desc: 'Included with every Enphase system. Real-time per-panel telemetry via phone app, cellular or Wi-Fi.',
        color: '#f97316',
        img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=240&fit=crop&auto=format&q=80',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Certifications strip (mirrors what's on the homepage)
// ═══════════════════════════════════════════════════════════════════════
const CERTS = [
  { name: 'SEANZ', emoji: '🏛️' },
  { name: 'EECA', emoji: '⚡' },
  { name: 'CEC', emoji: '✅' },
  { name: 'Master Electricians', emoji: '🔧' },
  { name: 'SBN', emoji: '🌿' },
  { name: 'ENZ', emoji: '🔌' },
];

// ═══════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════
export default function ProductsPage() {
  const [activeCat, setActiveCat] = useState(null); // null = show all
  const filtered = activeCat ? CATEGORIES.filter(c => c.id === activeCat) : CATEGORIES;
  const brandTotal = CATEGORIES.reduce((s, c) => s + c.brands.length, 0);

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      <SEO
        title="Solar Brands NZ — Panels, Inverters, Batteries & EV Chargers"
        description={`Goldenray Energy NZ stocks ${brandTotal}+ Tier-1 solar brands across ${CATEGORIES.length} categories. REC, Fronius, Tesla Powerwall, BYD, Sungrow, Jinko, LONGi and more — residential, commercial & off-grid ready.`}
        path="/products"
        keywords="solar brands nz, rec solar, fronius nz, tesla powerwall, byd battery, sungrow inverter, jinko solar, longi solar, enphase nz"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Products', path: '/products' }]}
      />
      {/* ── Dark Nav (matches home + finance) ── */}
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
          <Link to="/" className="text-sm text-gray-200 hover:text-amber-300 font-medium transition flex items-center gap-1.5">
            <ArrowLeft size={13} /> Home
          </Link>
          <Link to="/catalog"      className="text-sm text-gray-200 hover:text-amber-300 font-medium transition hidden md:inline">🛒 Shop</Link>
          <a href="/#calculator"   className="text-sm text-gray-200 hover:text-amber-300 font-medium transition hidden md:inline">Calculator</a>
          <Link to="/finance"      className="text-sm font-semibold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent hover:from-amber-200 hover:to-white hidden md:inline">💰 Finance</Link>
          <a href="/#contact"      className="text-sm text-gray-200 hover:text-amber-300 font-medium transition hidden md:inline">Contact</a>
          <Link to="/login"><Button size="sm" icon={Lock}>Employee Login</Button></Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Hero */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-16 px-6 md:px-16 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #500724 80%, #7c2d12 100%)' }}>
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-400 to-pink-400 opacity-25 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-25 blur-3xl animate-blob-delay-2" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 opacity-15 blur-3xl animate-blob-delay-4" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 mb-5 backdrop-blur">
            <Sparkles size={13} className="text-amber-300" />
            <span className="text-xs font-extrabold tracking-widest">{brandTotal} TIER-1 BRANDS · {CATEGORIES.length} CATEGORIES</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold font-display leading-[1.05] mb-5">
            The <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-white bg-clip-text text-transparent animate-gradient">best solar brands</span>,<br className="hidden md:block" />
            under one roof
          </h1>
          <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">
            Goldenray Energy NZ partners with the world's top solar manufacturers — premium panels, inverters, batteries,
            EV chargers and mounting — carefully selected for New Zealand's unique conditions and regulations.
          </p>
          <div className="flex flex-wrap gap-6 mt-8">
            <Stat value={brandTotal}            label="Brands stocked" />
            <Stat value={CATEGORIES.length}     label="Product categories" />
            <Stat value="10 yr+"                label="Average warranty" />
            <Stat value="NZ-wide"               label="Support coverage" />
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/catalog">
              <Button size="lg" icon={ArrowRight}>🛒 Shop the catalog — order online</Button>
            </Link>
            <a href="/#calculator"><Button variant="dark" size="lg" icon={Sparkles}>Get a free quote</Button></a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Market segments */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 md:px-16 bg-gradient-to-b from-white via-amber-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-cool">MARKETS WE SERVE</div>
            <h2 className="text-3xl font-extrabold font-display">One supplier, <span className="text-gradient-warm">every project scale</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MARKETS.map(m => (
              <Link key={m.id} to={`/products/${m.id}`}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white border border-gray-100 group">
                <div className="h-44 relative overflow-hidden">
                  <img src={m.img} alt={`${m.title} solar systems`} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md bg-gradient-to-r ${m.gradient}`}>
                    <m.icon size={10} className="inline mr-1" /> {m.title}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold font-display text-base">{m.title}</h4>
                    <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                      View bundles <ArrowRight size={11} />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Category filter */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-6 md:px-16 sticky top-16 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
          <button onClick={() => setActiveCat(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCat === null ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All ({CATEGORIES.length})
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${activeCat === c.id ? `bg-gradient-to-r ${c.gradient} text-white shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <c.icon size={12} /> {c.title} ({c.brands.length})
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Each category renders as a section */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {filtered.map(cat => (
        <section key={cat.id} id={cat.id} className="py-16 px-6 md:px-16 bg-gradient-to-b from-white via-gray-50/50 to-white">
          <div className="max-w-6xl mx-auto">
            {/* Category header */}
            <div className="flex items-center gap-4 mb-10">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg`}>
                <cat.icon size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold font-display">{cat.title}</h2>
                <p className="text-xs md:text-sm text-gray-500">{cat.subtitle}</p>
              </div>
              <div className="ml-auto text-[11px] text-gray-400">{cat.brands.length} brands</div>
            </div>

            {/* Brand grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.brands.map(b => (
                <div key={b.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col">
                  {/* Top image */}
                  <div className="h-36 relative overflow-hidden">
                    <img src={b.img} alt={`${b.name} solar products NZ`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: b.color }}>{b.name}</span>
                      <span className="text-[10px] text-white/90 font-semibold bg-black/30 px-1.5 py-0.5 rounded backdrop-blur">{b.origin}</span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3">
                      <div className="text-[11px] text-white/90 font-semibold drop-shadow">{b.tagline}</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{b.desc}</p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Spec icon={ShieldCheck} label="Warranty" value={b.warranty} />
                      <Spec icon={Gauge}       label="Output"   value={b.wattage} />
                    </div>

                    {/* Featured models */}
                    {b.models?.length > 0 && (
                      <div className="mt-auto">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Featured models</div>
                        <ul className="space-y-0.5">
                          {b.models.map(m => (
                            <li key={m} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                              <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer bar */}
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Award size={10} /> Goldenray accredited installer</span>
                    <a href="/#calculator" className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                      Quote <ArrowRight size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Certifications strip */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-14 px-6 md:px-16 bg-gradient-to-br from-violet-50 via-white to-amber-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-extrabold tracking-widest mb-2 text-gradient-solar">INDUSTRY MEMBERSHIPS</div>
            <h3 className="text-2xl font-extrabold font-display">Accredited & certified</h3>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {CERTS.map((c, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:-translate-y-0.5 transition">
                <div className="text-2xl mb-1.5">{c.emoji}</div>
                <div className="text-[10px] font-bold text-gray-700">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CTA */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="py-14 px-6 md:px-16 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #500724 80%, #7c2d12 100%)' }}>
        <div className="absolute -top-20 right-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400 to-pink-400 opacity-20 blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-xs font-extrabold tracking-widest mb-3 text-amber-300">BUILD YOUR SYSTEM</div>
          <h3 className="text-3xl md:text-4xl font-extrabold font-display mb-4">
            Ready to mix-and-match <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">these brands?</span>
          </h3>
          <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto leading-relaxed">
            Goldenray designs your solar system using the best brand for each component — no vendor lock-in,
            no cookie-cutter solutions. Get a free, obligation-free quote in under 2 minutes.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/#calculator"><Button size="lg" icon={Zap}>Get a free quote</Button></a>
            <Link to="/finance"><Button variant="success" size="lg" icon={ArrowRight}>$0 Upfront Finance</Button></Link>
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
const Stat = ({ value, label }) => (
  <div>
    <div className="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-300 via-pink-300 to-white bg-clip-text text-transparent">{value}</div>
    <div className="text-[11px] text-white/70 font-medium mt-0.5">{label}</div>
  </div>
);

const Spec = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 rounded-lg p-2">
    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
      <Icon size={9} /> {label}
    </div>
    <div className="text-[11px] font-semibold text-gray-800 mt-0.5">{value}</div>
  </div>
);
