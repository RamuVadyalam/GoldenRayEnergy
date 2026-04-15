export const fmt$ = (n) => '$' + Number(n || 0).toLocaleString('en-NZ', { maximumFractionDigits: 0 });
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' }) : '—';
export const fmtDateLong = (d) => d ? new Date(d).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
