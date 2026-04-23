import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, BarChart3, Target, Settings, X, CheckCircle2 } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

const CATEGORIES = [
  {
    id: 'necessary',
    icon: Shield,
    title: 'Strictly Necessary',
    desc: 'Required for the site to work — session auth, cart, CSRF and security cookies. Cannot be disabled.',
    always: true,
    examples: 'goldenray_token · cart_session · csrf_token',
  },
  {
    id: 'functional',
    icon: Cookie,
    title: 'Functional',
    desc: 'Remember your preferences: language, saved quote, form drafts, chatbot state.',
    always: false,
    examples: 'cart persistence · calculator drafts · chat history',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Performance & Analytics',
    desc: 'Anonymous usage stats (page views, click paths, errors) so we can improve the site.',
    always: false,
    examples: 'GA4 · page-view tracking · error reporting',
  },
  {
    id: 'marketing',
    icon: Target,
    title: 'Marketing',
    desc: 'Personalised ads + remarketing on Google/Facebook — only if you consent.',
    always: false,
    examples: 'Google Ads · Meta Pixel · LinkedIn Insight',
  },
];

export default function CookieBanner() {
  const { hasConsented, prefs, acceptAll, rejectAll, saveCustom, settingsOpen, openSettings, closeSettings } = useCookieConsent();
  const [bannerVisible, setBannerVisible] = useState(false);

  // Delay showing the banner slightly to avoid visual noise on first paint
  useEffect(() => {
    if (!hasConsented) {
      const t = setTimeout(() => setBannerVisible(true), 600);
      return () => clearTimeout(t);
    } else {
      setBannerVisible(false);
    }
  }, [hasConsented]);

  return (
    <>
      {/* ── Bottom banner (first visit) ─────────────────────────────── */}
      {!hasConsented && bannerVisible && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-[60] max-w-[460px] rounded-2xl border border-amber-100 bg-white shadow-2xl shadow-black/15 p-5 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow">
              <Cookie size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold font-display mb-1">We use cookies 🍪</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Goldenray uses strictly necessary cookies for the site to function, and optional cookies for analytics
                and marketing. Read our{' '}
                <Link to="/cookie-policy" className="text-amber-600 font-semibold underline hover:text-amber-700">Cookie Policy</Link>.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={rejectAll}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
              Reject non-essential
            </button>
            <button onClick={openSettings}
              className="px-3 py-2 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5">
              <Settings size={11} /> Preferences
            </button>
            <button onClick={acceptAll}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-md shadow-pink-200 hover:-translate-y-0.5 transition-transform">
              Accept all
            </button>
          </div>
        </div>
      )}

      {/* ── Preferences modal ───────────────────────────────────────── */}
      {settingsOpen && <CookieSettings onClose={closeSettings} prefs={prefs} onSave={saveCustom} onAcceptAll={acceptAll} onRejectAll={rejectAll} />}
    </>
  );
}

// ── Settings modal ────────────────────────────────────────────────────
function CookieSettings({ onClose, prefs, onSave, onAcceptAll, onRejectAll }) {
  const [local, setLocal] = useState(prefs);

  const toggle = (id) => {
    if (id === 'necessary') return; // always on
    setLocal(p => ({ ...p, [id]: !p[id] }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-900 to-rose-900 text-white rounded-t-2xl flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur flex-shrink-0">
              <Cookie size={18} />
            </div>
            <div>
              <div className="text-base font-extrabold font-display">Cookie Preferences</div>
              <div className="text-[11px] text-white/70 mt-0.5">Choose which categories you're happy to share.</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><X size={14} /></button>
        </div>

        {/* Categories */}
        <div className="p-6 space-y-3">
          {CATEGORIES.map(cat => {
            const enabled = local[cat.id];
            const Icon = cat.icon;
            return (
              <div key={cat.id} className={`rounded-xl border p-4 transition ${enabled ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-gradient-to-br from-amber-500 to-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold font-display flex items-center gap-1.5">
                        {cat.title}
                        {cat.always && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">ALWAYS ON</span>}
                      </div>
                      {/* Toggle */}
                      <button onClick={() => toggle(cat.id)} disabled={cat.always}
                        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500' : 'bg-gray-300'} ${cat.always ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className={`absolute top-0.5 ${enabled ? 'left-5' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">{cat.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-mono truncate">{cat.examples}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
          <button onClick={() => { onRejectAll(); onClose(); }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
            Reject all
          </button>
          <button onClick={() => { onSave(local); onClose(); }}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Save preferences
          </button>
          <button onClick={() => { onAcceptAll(); onClose(); }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-md shadow-pink-200">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small "Cookie Preferences" link for the footer ────────────────────
export function CookiePreferencesLink({ className = '' }) {
  const { openSettings } = useCookieConsent();
  return (
    <button onClick={openSettings}
      className={className || 'text-[11px] hover:text-amber-400 cursor-pointer transition'}>
      Cookie Preferences
    </button>
  );
}
