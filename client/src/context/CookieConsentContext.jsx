import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'goldenray_cookie_consent_v1';
const CONSENT_VERSION = 1;          // bump if the banner/policy changes
const ONE_YEAR_DAYS = 365;

// All 4 cookie categories. "necessary" is always true and not user-editable.
const DEFAULT_PREFS = {
  necessary: true,
  functional: false,
  analytics:  false,
  marketing:  false,
};

function readStoredConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    // Expiry check (1 year)
    if (parsed.timestamp) {
      const ageDays = (Date.now() - parsed.timestamp) / 86400000;
      if (ageDays > ONE_YEAR_DAYS) return null;
    }
    return parsed;
  } catch { return null; }
}

function writeStoredConsent(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      prefs,
    }));
  } catch { /* ignore */ }
  // Also drop a 1-year first-party cookie so server-side can read it too (future-proof).
  try {
    const flags = Object.entries(prefs).filter(([, v]) => v).map(([k]) => k).join('|');
    document.cookie = `gr_consent=${flags}; Path=/; Max-Age=${ONE_YEAR_DAYS * 86400}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  } catch { /* ignore */ }
}

// ── Public API ───────────────────────────────────────────────────────
const Ctx = createContext(null);

export function CookieConsentProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [hasConsented, setHasConsented] = useState(false);   // true once user has accepted/rejected/customised
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setPrefs({ ...DEFAULT_PREFS, ...stored.prefs, necessary: true });
      setHasConsented(true);
    }
  }, []);

  const save = (next) => {
    const merged = { ...DEFAULT_PREFS, ...next, necessary: true };
    setPrefs(merged);
    setHasConsented(true);
    writeStoredConsent(merged);
  };

  const api = {
    prefs,
    hasConsented,
    settingsOpen,
    openSettings:  () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    acceptAll:     () => save({ necessary: true, functional: true, analytics: true, marketing: true }),
    rejectAll:     () => save({ necessary: true, functional: false, analytics: false, marketing: false }),
    saveCustom:    (custom) => save(custom),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCookieConsent() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCookieConsent must be used within <CookieConsentProvider>');
  return v;
}
