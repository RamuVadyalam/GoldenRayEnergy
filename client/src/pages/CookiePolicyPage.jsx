import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Shield, BarChart3, Target, Settings } from 'lucide-react';
import Button from '../components/ui/Button';
import WebsiteFooter from '../components/website/WebsiteFooter';
import { useCookieConsent } from '../context/CookieConsentContext';
import SEO from '../components/SEO';

export default function CookiePolicyPage() {
  const { openSettings } = useCookieConsent();

  return (
    <div className="bg-white font-body min-h-screen flex flex-col">
      <SEO
        title="Cookie Policy"
        description="How Goldenray Energy NZ uses cookies on its website — necessary, functional, analytics and marketing categories, with instructions to manage your preferences."
        path="/cookie-policy"
        breadcrumbs={[{ name: 'Home', path: '/' }, { name: 'Cookie Policy', path: '/cookie-policy' }]}
      />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 h-16 flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/20"
        style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.96) 45%, rgba(80,7,36,0.96) 100%)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-pink-500 via-fuchsia-500 via-violet-500 to-teal-400" />
        <Link to="/" className="flex items-center gap-3 relative">
          <div className="bg-white rounded-xl p-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40">
            <img src="/logo.jpg" alt="Goldenray" className="h-11 w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold font-display text-white">GOLDENRAY <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">ENERGY NZ</span></div>
            <div className="text-[9px] text-amber-200/80 italic">Cookie Policy</div>
          </div>
        </Link>
        <Link to="/" className="text-sm text-gray-200 hover:text-amber-300 font-medium flex items-center gap-1.5"><ArrowLeft size={13} /> Home</Link>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-6 md:px-16 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #500724 100%)' }}>
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400 to-pink-400 opacity-25 blur-3xl" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 mb-4 backdrop-blur">
            <Cookie size={13} className="text-amber-300" />
            <span className="text-xs font-extrabold tracking-widest">COOKIE POLICY</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight mb-3">Our cookies, explained</h1>
          <p className="text-sm md:text-base text-white/85 max-w-2xl">
            This policy explains what cookies we use, why we use them, and how you can control them.
            Last updated <b>22 April 2026</b>.
          </p>
          <div className="mt-5">
            <button onClick={openSettings} className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm inline-flex items-center gap-2 hover:bg-amber-100 transition">
              <Settings size={14} /> Manage cookie preferences
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-6 md:px-16 flex-1">
        <div className="max-w-3xl mx-auto prose prose-sm prose-headings:font-display prose-headings:font-extrabold">
          <Intro />
          <Section icon={Shield} title="1. Strictly necessary cookies" color="#10b981">
            <p>These cookies are essential for the website to function and cannot be switched off. They're usually only set in response to actions you take — like signing in, adding items to your cart, or submitting a form.</p>
            <Table rows={[
              ['goldenray_token', 'Session authentication for portal users', 'Session'],
              ['goldenray_cart_v1', 'Persists your shopping cart across page loads', '30 days'],
              ['gr_consent',       'Records your cookie preferences', '1 year'],
              ['csrf_token',       'Security token to prevent cross-site request forgery', 'Session'],
            ]} />
          </Section>

          <Section icon={Cookie} title="2. Functional cookies" color="#f59e0b">
            <p>These cookies enable enhanced functionality and personalisation, such as remembering your preferences or the state of the solar calculator.</p>
            <Table rows={[
              ['gr_calc_draft',    'Saves in-progress free-quote form data', '30 days'],
              ['gr_chat_history',  'Keeps your SolarBot conversation between sessions', '7 days'],
              ['wa_tip_dismissed', 'Stops the WhatsApp tooltip from re-appearing', 'Session'],
            ]} />
          </Section>

          <Section icon={BarChart3} title="3. Performance & analytics cookies" color="#3b82f6">
            <p>These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. We use them to improve performance and fix broken pages.</p>
            <Table rows={[
              ['_ga, _ga_*',        'Google Analytics 4 — anonymous page-view & session metrics', '2 years'],
              ['_clck, _clsk',      'Microsoft Clarity heatmap/session recording (anonymised)',  '1 year'],
              ['sentry_replay',     'Error replay for debugging (disabled on production currently)',  'Session'],
            ]} />
          </Section>

          <Section icon={Target} title="4. Marketing cookies" color="#ec4899">
            <p>These cookies may be set through our site by our advertising partners. They track your browsing habits across sites to show you relevant ads — only if you opt in.</p>
            <Table rows={[
              ['_fbp',             'Meta Pixel — remarketing & conversion tracking', '3 months'],
              ['_gcl_au',          'Google Ads click-ID for conversion attribution', '3 months'],
              ['li_fat_id',        'LinkedIn Insight tag for B2B retargeting',       '3 months'],
            ]} />
          </Section>

          <Section icon={Settings} title="5. How to control cookies" color="#8b5cf6">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Use our <button onClick={openSettings} className="text-amber-600 font-semibold underline hover:text-amber-700">cookie preferences panel</button> to toggle categories.
              </li>
              <li>
                Most browsers let you block or delete cookies entirely via settings (Chrome, Firefox, Safari, Edge).
              </li>
              <li>
                Blocking all cookies may break functionality — the cart, login, and saved quote will not work.
              </li>
            </ul>
          </Section>

          <Section icon={Shield} title="6. Contact us" color="#06b6d4">
            <p>
              Questions about this policy or how we handle your data? Email
              {' '}<a href="mailto:hello@goldenrayenergy.co.nz" className="text-amber-600 font-semibold">hello@goldenrayenergy.co.nz</a>{' '}
              or call <b>+64 9 123 4567</b>. We respond within 2 business days.
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
            <button onClick={openSettings}>
              <Button icon={Settings}>Open cookie preferences</Button>
            </button>
            <Link to="/"><Button variant="dark" icon={ArrowLeft}>Back to home</Button></Link>
          </div>
        </div>
      </section>

      <WebsiteFooter homepage={false} />
    </div>
  );
}

const Intro = () => (
  <div className="bg-gradient-to-br from-amber-50 via-white to-pink-50 border border-amber-100 rounded-xl p-4 text-xs text-gray-700 mb-8">
    <b>In short:</b> cookies are small text files stored on your device when you visit a website. They help us remember you,
    keep your cart, improve the site, and (if you opt in) show you more relevant ads. You can change your preferences at any time.
  </div>
);

const Section = ({ icon: Icon, title, color, children }) => (
  <div className="mb-8">
    <h2 className="flex items-center gap-2.5 text-lg font-extrabold font-display mb-3" style={{ color }}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: color }}>
        <Icon size={13} />
      </span>
      {title}
    </h2>
    <div className="text-xs text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

const Table = ({ rows }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-100 mt-3">
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-50 text-gray-500">
          <th className="text-left px-3 py-2 font-semibold">Cookie name</th>
          <th className="text-left px-3 py-2 font-semibold">Purpose</th>
          <th className="text-left px-3 py-2 font-semibold w-[120px]">Duration</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([n, p, d], i) => (
          <tr key={i} className="border-t border-gray-100">
            <td className="px-3 py-2 font-mono text-[10.5px] text-amber-700">{n}</td>
            <td className="px-3 py-2">{p}</td>
            <td className="px-3 py-2 text-gray-500">{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
