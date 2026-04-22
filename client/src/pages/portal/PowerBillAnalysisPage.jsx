import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Area,
} from 'recharts';
import api from '../../services/api';
import KPI from '../../components/ui/KPI';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Tabs from '../../components/ui/Tabs';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { fmt$, fmtDate } from '../../utils/format';
import {
  Zap, DollarSign, TrendingUp, TrendingDown, FileText, Activity, Building2, MapPin, Lightbulb, Eye, Trash2,
  Leaf, Trees, Battery, Sun, Percent, AlertTriangle, Clock, Hash, RefreshCw, Minus,
} from 'lucide-react';

const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-md text-xs">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <b>{typeof p.value === 'number' && p.value > 999 ? fmt$(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  );
};

const USAGE_BAND_COLORS = { low: '#10b981', average: '#6366f1', high: '#f59e0b', 'very-high': '#ef4444', unknown: '#9ca3af' };
const USAGE_BAND_LABELS = { low: 'Low', average: 'Average', high: 'High', 'very-high': 'Very high', unknown: 'Unknown' };
const BAND_COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];
const REC_COLORS = {
  solar: '#f59e0b', battery: '#8b5cf6', retailer: '#3b82f6', usage: '#ec4899', rate: '#ef4444',
  load: '#6366f1', hotwater: '#14b8a6', alert: '#dc2626', fixed: '#f97316', generic: '#94a3b8',
};

export default function PowerBillAnalysisPage() {
  const [tab, setTab] = useState('overview');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.get('/powerbill'), api.get('/powerbill/stats')]);
      setRows(a.data || []); setStats(b.data || null);
    } finally { setLoading(false); }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete bill upload "${r.file_name}"?`)) return;
    try {
      await api.delete(`/powerbill/${r.id}`);
      setRows(p => p.filter(x => x.id !== r.id));
      loadAll();
    } catch (e) { alert('Failed to delete: ' + (e.response?.data?.error || e.message)); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  const bandData = Object.entries(stats?.bands || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: USAGE_BAND_LABELS[k] || k, value: v, color: USAGE_BAND_COLORS[k] || '#94a3b8' }));
  const rateBandData = Object.entries(stats?.rate_bands || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k.replace('-', ' '), value: v }));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold font-display">Power Bill Analysis</h2>
          <p className="text-[11px] text-gray-400">
            Every power bill uploaded through the website lands here — parsed, benchmarked, scored for solar fit, and ready for outreach.
          </p>
        </div>
        <button onClick={loadAll} className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1.5 text-gray-600">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <Tabs
        tabs={[
          { id: 'overview',       label: 'Overview' },
          { id: 'deep',           label: 'Deep analysis' },
          { id: 'scenarios',      label: 'Solar scenarios' },
          { id: 'retailers',      label: 'Retailers & regions' },
          { id: 'environment',    label: 'Environmental impact' },
          { id: 'recommendations', label: 'Recommendations' },
          { id: 'uploads',        label: `All uploads (${rows.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Overview */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-5 gap-3">
            <KPI icon={FileText}   label="Bills analysed"      value={stats?.processed || 0} sub={`${stats?.partial || 0} partial reads`} accent="#6366f1" />
            <KPI icon={Zap}        label="Avg monthly kWh"     value={stats?.avg_daily_kwh ? Math.round(stats.avg_daily_kwh * 30) : '—'} sub="per household" accent="#f59e0b" />
            <KPI icon={DollarSign} label="Avg bill cost"       value={stats?.avg_cost ? fmt$(stats.avg_cost) : '—'} accent="#10b981" />
            <KPI icon={Activity}   label="Avg rate / kWh"      value={stats?.avg_cost_per_kwh ? '$' + stats.avg_cost_per_kwh : '—'} accent="#ec4899" />
            <KPI icon={TrendingUp} label="Total spend tracked" value={stats?.total_spend ? fmt$(stats.total_spend) : '—'} accent="#8b5cf6" />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <KPI icon={Sun}    label="Est. annual savings"  value={stats?.total_recommended_saving ? fmt$(stats.total_recommended_saving) : '—'} sub="with solar" accent="#f59e0b" />
            <KPI icon={Leaf}   label="CO₂ avoided / yr"     value={stats?.total_co2_avoided ? Math.round(stats.total_co2_avoided).toLocaleString() + ' kg' : '—'} accent="#10b981" />
            <KPI icon={Trees}  label="Trees equivalent"     value={stats?.total_trees || '—'} sub="per year" accent="#14b8a6" />
            <KPI icon={Percent} label="Fixed charge share"  value={stats?.avg_fixed_share ? Math.round(stats.avg_fixed_share * 100) + '%' : '—'} sub="of total bill" accent="#f97316" />
            <KPI icon={AlertTriangle} label="Current CO₂ / yr" value={stats?.total_co2_kg ? Math.round(stats.total_co2_kg).toLocaleString() + ' kg' : '—'} sub="grid emissions" accent="#ef4444" />
          </div>

          <Card
            title="6-month deep trend"
            subtitle="Uploads · kWh · spend · rate · CO₂ · solar opportunity month-on-month"
          >
            {/* ── Month-on-month change strip (5 metrics) ── */}
            {stats?.trend_delta && (
              <div className="grid grid-cols-5 gap-2 mb-3">
                <DeltaChip label="Bills"      value={stats.trend_delta.count_pct}  unit="%" lastLabel={stats.trend_delta.last_label} prevLabel={stats.trend_delta.prev_label} />
                <DeltaChip label="kWh"        value={stats.trend_delta.kwh_pct}   unit="%" invertColors />
                <DeltaChip label="Spend"      value={stats.trend_delta.cost_pct}  unit="%" invertColors />
                <DeltaChip label="Avg rate"   value={stats.trend_delta.rate_pct}  unit="%" invertColors />
                <DeltaChip label="Grid CO₂"   value={stats.trend_delta.co2_pct}   unit="%" invertColors />
              </div>
            )}

            {/* ── Composed chart: bars (bills) + lines (kWh, spend, CO₂) ── */}
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={stats?.trend || []}>
                <defs>
                  <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                <Tooltip content={<CTip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar  yAxisId="l" dataKey="count"  fill="#8b5cf6" opacity={0.35} barSize={24} name="Bills" radius={[4,4,0,0]} />
                <Area yAxisId="l" dataKey="kwh"    stroke="#f59e0b" strokeWidth={2.5} fill="url(#kwhGrad)" name="Total kWh" />
                <Line yAxisId="r" dataKey="cost"   stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Spend ($)" />
                <Line yAxisId="r" dataKey="potential_saving" stroke="#ec4899" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} name="Solar save / mo ($)" />
                <Line yAxisId="l" dataKey="co2_kg" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} name="CO₂ (kg)" />
              </ComposedChart>
            </ResponsiveContainer>

            {/* ── Monthly breakdown table ── */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400">
                    <th className="text-left font-semibold py-1.5 pr-3">Month</th>
                    <th className="text-right font-semibold py-1.5 px-2">Bills</th>
                    <th className="text-right font-semibold py-1.5 px-2">Total kWh</th>
                    <th className="text-right font-semibold py-1.5 px-2">Spend</th>
                    <th className="text-right font-semibold py-1.5 px-2">Avg bill</th>
                    <th className="text-right font-semibold py-1.5 px-2">Avg kWh</th>
                    <th className="text-right font-semibold py-1.5 px-2">Avg $/kWh</th>
                    <th className="text-right font-semibold py-1.5 px-2">Peak kWh</th>
                    <th className="text-right font-semibold py-1.5 px-2">Off-peak kWh</th>
                    <th className="text-right font-semibold py-1.5 px-2">CO₂ kg</th>
                    <th className="text-right font-semibold py-1.5 pl-2">Solar opp $/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.trend || []).map((m, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${m.count === 0 ? 'opacity-50' : ''}`}>
                      <td className="py-1.5 pr-3 font-semibold text-gray-700">{m.label} <span className="text-[9px] text-gray-400">'{String(m.year).slice(-2)}</span></td>
                      <td className="text-right py-1.5 px-2">{m.count}</td>
                      <td className="text-right py-1.5 px-2 text-amber-600 font-semibold">{m.kwh.toLocaleString()}</td>
                      <td className="text-right py-1.5 px-2 text-emerald-600 font-semibold">{m.cost ? fmt$(m.cost) : '—'}</td>
                      <td className="text-right py-1.5 px-2">{m.avg_bill ? fmt$(m.avg_bill) : '—'}</td>
                      <td className="text-right py-1.5 px-2">{m.avg_kwh || '—'}</td>
                      <td className="text-right py-1.5 px-2">{m.avg_rate ? '$' + m.avg_rate : '—'}</td>
                      <td className="text-right py-1.5 px-2 text-gray-500">{m.peak_kwh ? m.peak_kwh.toLocaleString() : '—'}</td>
                      <td className="text-right py-1.5 px-2 text-gray-500">{m.off_peak_kwh ? m.off_peak_kwh.toLocaleString() : '—'}</td>
                      <td className="text-right py-1.5 px-2 text-red-500">{m.co2_kg ? m.co2_kg.toLocaleString() : '—'}</td>
                      <td className="text-right py-1.5 pl-2 text-pink-600 font-semibold">{m.potential_saving ? fmt$(m.potential_saving) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card title="Usage band" subtitle="vs NZ avg (7,000 kWh/yr)">
              {bandData.length === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No processed bills yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={10}>
                        {bandData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </Card>
            <Card title="Rate band" subtitle="vs NZ avg $0.32/kWh">
              {rateBandData.length === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No rate data yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={rateBandData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>
            <Card title="Solar opportunity pipeline" subtitle="Est. annual savings across all uploads">
              <div className="text-center py-4">
                <Sun size={36} className="text-amber-500 mx-auto mb-2" />
                <div className="text-3xl font-extrabold font-display text-gradient-warm bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
                  {stats?.total_recommended_saving ? fmt$(stats.total_recommended_saving) : '$0'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">per year combined</div>
                <div className="mt-3 text-[11px] text-gray-600">
                  25-yr pooled: <b className="text-violet-600">{stats?.total_recommended_saving ? fmt$(stats.total_recommended_saving * 25) : '$0'}</b>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Deep analysis */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'deep' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card title="Consumption by tariff band" subtitle="Peak / off-peak / night / controlled (aggregate)">
              {(stats?.band_pie?.length || 0) === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No time-of-use data extracted yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={stats.band_pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={10}>
                        {stats.band_pie.map((_, i) => <Cell key={i} fill={BAND_COLORS[i % BAND_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </Card>

            <Card title="Rate positioning" subtitle="How customer rates compare to NZ market average">
              {rateBandData.length === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No rate data yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={rateBandData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>

            <Card title="Load-profile fingerprints" subtitle="Appliance patterns inferred from usage">
              {(stats?.load_tags?.length || 0) === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No load fingerprints yet.</p>
                : (
                  <div className="space-y-2">
                    {stats.load_tags.map(t => (
                      <div key={t.tag} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                          <div className="text-xs font-semibold capitalize">{t.tag.replace(/_/g, ' ')}</div>
                        </div>
                        <Badge color="#f59e0b">{t.count} households</Badge>
                      </div>
                    ))}
                  </div>
                )}
            </Card>

            <Card title="User type & plan mix" subtitle="Low-user / standard-user breakdown and top plans">
              <div className="space-y-1 mb-3">
                {(stats?.by_user_type || []).map(u => (
                  <div key={u.name} className="flex justify-between text-xs py-1">
                    <span className="capitalize">{u.name.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{u.count}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Top plans</div>
                {(stats?.by_plan || []).slice(0, 5).map(p => (
                  <div key={p.name} className="flex justify-between text-xs py-1">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="font-semibold">{p.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Per-household deep metrics" subtitle="Top 20 uploaders ranked by annual kWh">
            <DataTable columns={[
              { label: 'Uploader',   render: r => <div className="text-xs font-semibold truncate">{r.uploader_name || r.uploader_email || '—'}</div> },
              { label: 'Retailer',   render: r => <span className="text-[11px] text-gray-500">{r.retailer || '—'}</span> },
              { label: 'Plan',       render: r => <span className="text-[11px] text-gray-500">{r.plan_name || '—'}</span> },
              { label: 'Annual kWh', render: r => <span className="text-xs font-bold text-amber-600">{r.analysis_json?.annual_kwh?.toLocaleString() || '—'}</span> },
              { label: '$/kWh',      render: r => <span className="text-xs">{r.avg_cost_per_kwh ? '$' + r.avg_cost_per_kwh : '—'}</span> },
              { label: 'Peak %',     render: r => {
                const bs = r.analysis_json?.band_split;
                return <span className="text-xs">{bs?.peak_pct != null ? bs.peak_pct + '%' : '—'}</span>;
              }},
              { label: 'Fixed %',    render: r => <span className="text-xs">{r.fixed_cost_share != null ? Math.round(r.fixed_cost_share * 100) + '%' : '—'}</span> },
              { label: 'CO₂ kg',     render: r => <span className="text-xs text-red-500">{r.co2_emissions_kg ? Math.round(r.co2_emissions_kg) : '—'}</span> },
              { label: 'Band',       render: r => {
                const b = r.analysis_json?.usage_band || 'unknown';
                return <Badge color={USAGE_BAND_COLORS[b]}>{USAGE_BAND_LABELS[b] || b}</Badge>;
              }},
              { label: 'View',       render: r => (
                <button onClick={() => setSel(r)} className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"><Eye size={11} /></button>
              )},
            ]} data={[...rows]
              .filter(r => r.analysis_json?.annual_kwh)
              .sort((a, b) => (b.analysis_json?.annual_kwh || 0) - (a.analysis_json?.annual_kwh || 0))
              .slice(0, 20)} />
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Solar scenarios */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'scenarios' && (
        <>
          <div className="bg-gradient-to-r from-amber-50 via-pink-50 to-violet-50 rounded-xl border border-amber-100 p-4 text-xs text-gray-700 flex gap-2 items-start">
            <Sun size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              Each bill is projected against 4 solar system sizes (3 / 5 / 7 / 10 kW) with and without a 10 kWh battery.
              The "recommended" size is the smallest that covers 80–110% of annual consumption.
              Assumes NZ rooftop yield of 1,400 kWh/kW/yr, 40% self-consumption (80% with battery), and 10c/kWh average buy-back.
            </div>
          </div>

          <Card title="Aggregate scenario view" subtitle="System-size distribution across all recommended fits">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={aggregateScenarios(rows)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                <Tooltip content={<CTip />} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Households" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Per-household solar fit" subtitle="Click a row to see all four scenarios">
            <DataTable columns={[
              { label: 'Uploader',      render: r => <span className="text-xs font-semibold">{r.uploader_name || r.uploader_email || '—'}</span> },
              { label: 'Annual kWh',    render: r => <span className="text-xs">{r.analysis_json?.annual_kwh?.toLocaleString() || '—'}</span> },
              { label: 'Recommended',   render: r => <Badge color="#f59e0b">{r.analysis_json?.recommended_scenario?.system_kw || '—'} kW</Badge> },
              { label: 'Panels',        render: r => <span className="text-xs">{r.analysis_json?.recommended_scenario?.panel_count || '—'}</span> },
              { label: 'System cost',   render: r => <span className="text-xs">{r.analysis_json?.recommended_scenario?.system_cost ? fmt$(r.analysis_json.recommended_scenario.system_cost) : '—'}</span> },
              { label: 'Annual saving', render: r => <span className="text-xs font-bold text-emerald-600">{r.analysis_json?.recommended_scenario?.annual_saving ? fmt$(r.analysis_json.recommended_scenario.annual_saving) : '—'}</span> },
              { label: 'Payback',       render: r => <span className="text-xs">{r.analysis_json?.recommended_scenario?.payback_years ? r.analysis_json.recommended_scenario.payback_years + ' yrs' : '—'}</span> },
              { label: '25-yr net',     render: r => <span className="text-xs font-bold text-violet-600">{r.analysis_json?.recommended_scenario?.net_25yr ? fmt$(r.analysis_json.recommended_scenario.net_25yr) : '—'}</span> },
              { label: '',              render: r => <button onClick={() => setSel(r)} className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"><Eye size={11} /></button> },
            ]} data={[...rows]
              .filter(r => r.analysis_json?.recommended_scenario)
              .sort((a, b) => (b.analysis_json?.recommended_scenario?.annual_saving || 0) - (a.analysis_json?.recommended_scenario?.annual_saving || 0))
              .slice(0, 25)} />
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Retailers & regions */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'retailers' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card title="Uploads by retailer" subtitle="Who's losing market share to solar?">
              {(stats?.by_retailer?.length || 0) === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No retailer data yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.by_retailer.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Bills" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>

            <Card title="Uploads by region" subtitle={<><MapPin size={10} className="inline mr-1" /> Where demand is coming from</>}>
              {(stats?.by_region?.length || 0) === 0
                ? <p className="text-xs text-gray-400 py-6 text-center">No regional data yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.by_region.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} />
                      <Tooltip content={<CTip />} />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Bills" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>
          </div>

          <Card title="Retailer switch opportunity" subtitle="Pooled annual savings if everyone switched to the cheapest eligible retailer">
            {(stats?.switch_savings?.length || 0) === 0
              ? <p className="text-xs text-gray-400 py-6 text-center">No switching data yet.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.switch_savings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                    <YAxis type="category" dataKey="retailer" width={110} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} />
                    <Tooltip content={<CTip />} />
                    <Bar dataKey="saving" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Pooled annual saving" />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Environmental impact */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'environment' && (
        <div className="grid grid-cols-2 gap-3">
          <Card title="Current grid emissions" subtitle="From total consumption captured">
            <div className="text-center py-6">
              <Leaf size={40} className="text-red-500 mx-auto mb-3 opacity-60" />
              <div className="text-4xl font-extrabold font-display text-red-600">{stats?.total_co2_kg ? Math.round(stats.total_co2_kg).toLocaleString() : '0'} kg</div>
              <div className="text-xs text-gray-400 mt-1">CO₂ emitted per year (~0.098 kg/kWh NZ grid)</div>
            </div>
          </Card>
          <Card title="Potential CO₂ avoided" subtitle="If all customers went solar at recommended size">
            <div className="text-center py-6">
              <Leaf size={40} className="text-emerald-500 mx-auto mb-3" />
              <div className="text-4xl font-extrabold font-display text-emerald-600">{stats?.total_co2_avoided ? Math.round(stats.total_co2_avoided).toLocaleString() : '0'} kg</div>
              <div className="text-xs text-gray-400 mt-1">CO₂ avoided per year with solar</div>
            </div>
          </Card>
          <Card title="Trees-equivalent" subtitle="Mature trees to absorb the same CO₂ per year">
            <div className="text-center py-6">
              <Trees size={40} className="text-teal-500 mx-auto mb-3" />
              <div className="text-4xl font-extrabold font-display text-teal-600">{stats?.total_trees ? stats.total_trees.toLocaleString() : '0'}</div>
              <div className="text-xs text-gray-400 mt-1">equivalent to {stats?.total_trees?.toLocaleString() || 0} trees/year</div>
            </div>
          </Card>
          <Card title="25-year lifetime savings" subtitle="Pooled across all uploaded households">
            <div className="text-center py-6">
              <DollarSign size={40} className="text-amber-500 mx-auto mb-3" />
              <div className="text-4xl font-extrabold font-display text-amber-600">
                {stats?.total_recommended_saving ? fmt$(stats.total_recommended_saving * 25) : '$0'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total $ savings over 25 years</div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Recommendations */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'recommendations' && (
        <>
          <Card title="Recommendation categories" subtitle="What the system recommends most often">
            {(stats?.rec_categories?.length || 0) === 0
              ? <p className="text-xs text-gray-400 py-6 text-center">No recommendations generated yet.</p>
              : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.rec_categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} />
                    <Tooltip content={<CTip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Times triggered">
                      {stats.rec_categories.map((c, i) => <Cell key={i} fill={REC_COLORS[c.category] || '#94a3b8'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </Card>

          <Card title="Per-customer recommendations" subtitle={<><Lightbulb size={10} className="inline mr-1" /> Personalised tips from each bill</>}>
            {rows.length === 0
              ? <p className="text-xs text-gray-400 py-6 text-center">No uploads yet.</p>
              : (
                <div className="space-y-3">
                  {rows.filter(r => r.analysis_json?.recommendations?.length).slice(0, 20).map(r => (
                    <div key={r.id} className="bg-gradient-to-r from-amber-50/60 via-white to-emerald-50/60 rounded-xl border border-amber-100 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-bold">{r.uploader_name || r.uploader_email || '—'}</div>
                          <div className="text-[10px] text-gray-400">
                            {r.retailer || 'Unknown retailer'} · {r.plan_name || 'Unknown plan'} · {r.region || '—'} · uploaded {fmtDate(r.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {r.analysis_json?.recommended_scenario?.system_kw && <Badge color="#f59e0b">{r.analysis_json.recommended_scenario.system_kw} kW fit</Badge>}
                          {r.analysis_json?.usage_band && <Badge color={USAGE_BAND_COLORS[r.analysis_json.usage_band]}>{USAGE_BAND_LABELS[r.analysis_json.usage_band]}</Badge>}
                          {r.analysis_json?.bill_shock && <Badge color="#ef4444">Bill shock</Badge>}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {r.analysis_json.recommendations.map((rec, i) => (
                          <div key={i} className="text-xs flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: REC_COLORS[rec.category] || '#94a3b8' }} />
                            <div><b className="text-gray-800">{rec.title}.</b> <span className="text-gray-600">{rec.tip}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* All uploads table */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 'uploads' && (
        <Card title="Every bill upload" subtitle="Click View to see the full breakdown">
          <DataTable columns={[
            { label: 'Uploaded', render: r => <span className="text-xs">{fmtDate(r.created_at)}</span> },
            { label: 'Uploader', render: r => <div><div className="text-xs font-semibold">{r.uploader_name || '—'}</div><div className="text-[9px] text-gray-400">{r.uploader_email}</div></div> },
            { label: 'Retailer', render: r => <span className="text-xs"><Building2 size={10} className="inline mr-1 text-gray-400" />{r.retailer || '—'}</span> },
            { label: 'Plan',     render: r => <span className="text-[11px] text-gray-500">{r.plan_name || '—'}</span> },
            { label: 'Region',   render: r => <span className="text-xs">{r.region || '—'}</span> },
            { label: 'kWh',      render: r => <span className="text-xs font-semibold">{r.total_kwh?.toLocaleString() || '—'}</span> },
            { label: 'Cost',     render: r => <span className="text-xs font-bold text-emerald-600">{r.total_cost ? fmt$(r.total_cost) : '—'}</span> },
            { label: 'Status',   render: r => <Badge color={r.status === 'processed' ? '#10b981' : r.status === 'partial' ? '#f59e0b' : '#ef4444'}>{r.status}</Badge> },
            { label: 'Actions',  render: r => (
              <div className="flex gap-1">
                <button onClick={() => setSel(r)} title="View" className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"><Eye size={11} /></button>
                <button onClick={() => handleDelete(r)} title="Delete" className="w-6 h-6 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"><Trash2 size={11} /></button>
              </div>
            )},
          ]} data={rows} />
        </Card>
      )}

      {/* Detail modal */}
      <BillDetailModal sel={sel} onClose={() => setSel(null)} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Detail modal — surfaces every parsed field + all four solar scenarios
// ════════════════════════════════════════════════════════════════════
function BillDetailModal({ sel, onClose }) {
  if (!sel) return null;
  const a = sel.analysis_json || {};

  return (
    <Modal open={!!sel} onClose={onClose} title={sel.file_name} wide>
      <div className="space-y-5">
        {/* ── Headline KPIs ── */}
        <div className="grid grid-cols-4 gap-3">
          <HeadlineCard icon={Zap}        label="Total kWh"     value={sel.total_kwh?.toLocaleString() || '—'} color="#f59e0b" />
          <HeadlineCard icon={DollarSign} label="Total cost"    value={sel.total_cost ? fmt$(sel.total_cost) : '—'} color="#10b981" />
          <HeadlineCard icon={Activity}   label="$/kWh"         value={sel.avg_cost_per_kwh ? '$' + sel.avg_cost_per_kwh : '—'} color="#ec4899" />
          <HeadlineCard icon={Leaf}       label="CO₂ emitted"   value={sel.co2_emissions_kg ? Math.round(sel.co2_emissions_kg) + ' kg' : '—'} color="#ef4444" />
        </div>

        {/* ── Identity + period ── */}
        <Section title="Account & period">
          <Grid fields={[
            ['Retailer', sel.retailer || '—'],
            ['Plan',     sel.plan_name || '—'],
            ['User type', sel.user_type ? sel.user_type.replace(/_/g, ' ') : '—'],
            ['Account #', sel.account_number || '—'],
            ['ICP',       sel.icp_number || '—'],
            ['Region',    sel.region || '—'],
            ['Period',    (sel.billing_period_start || '?') + ' → ' + (sel.billing_period_end || '?')],
            ['Days',      sel.billing_days || '—'],
            ['Due date',  sel.due_date || '—'],
            ['File size', sel.file_size ? Math.round(sel.file_size / 1024) + ' KB' : '—'],
          ]} />
        </Section>

        {/* ── Consumption breakdown ── */}
        <Section title="Consumption by tariff band">
          <Grid fields={[
            ['Total kWh',      sel.total_kwh?.toLocaleString() || '—'],
            ['Daily avg',      sel.avg_daily_kwh ? sel.avg_daily_kwh + ' kWh' : '—'],
            ['Peak kWh',       sel.peak_kwh?.toLocaleString() || '—'],
            ['Off-peak kWh',   sel.off_peak_kwh?.toLocaleString() || '—'],
            ['Night kWh',      sel.night_kwh?.toLocaleString() || '—'],
            ['Controlled kWh', sel.controlled_kwh?.toLocaleString() || '—'],
            ['Peak rate',       sel.peak_rate       ? '$' + sel.peak_rate + '/kWh'       : '—'],
            ['Off-peak rate',   sel.off_peak_rate   ? '$' + sel.off_peak_rate + '/kWh'   : '—'],
            ['Night rate',      sel.night_rate      ? '$' + sel.night_rate + '/kWh'      : '—'],
            ['Controlled rate', sel.controlled_rate ? '$' + sel.controlled_rate + '/kWh' : '—'],
          ]} />
          {a.band_split && (
            <div className="flex gap-2 mt-3">
              {a.band_split.peak_pct       > 0 && <Pill color="#f59e0b">Peak {a.band_split.peak_pct}%</Pill>}
              {a.band_split.off_peak_pct   > 0 && <Pill color="#8b5cf6">Off-peak {a.band_split.off_peak_pct}%</Pill>}
              {a.band_split.night_pct      > 0 && <Pill color="#3b82f6">Night {a.band_split.night_pct}%</Pill>}
              {a.band_split.controlled_pct > 0 && <Pill color="#10b981">Controlled {a.band_split.controlled_pct}%</Pill>}
            </div>
          )}
        </Section>

        {/* ── Cost breakdown ── */}
        <Section title="Cost breakdown">
          <Grid fields={[
            ['Total cost',        sel.total_cost ? fmt$(sel.total_cost) : '—'],
            ['Daily fixed',       sel.daily_fixed_charge ? '$' + sel.daily_fixed_charge + '/day' : '—'],
            ['Fixed total',       a.fixed_cost_total != null ? fmt$(a.fixed_cost_total) : '—'],
            ['Variable total',    a.variable_cost_total != null ? fmt$(a.variable_cost_total) : '—'],
            ['Fixed share',       sel.fixed_cost_share != null ? Math.round(sel.fixed_cost_share * 100) + '%' : '—'],
            ['Variable share',    sel.variable_cost_share != null ? Math.round(sel.variable_cost_share * 100) + '%' : '—'],
            ['GST (NZ 15%)',      sel.gst_amount ? fmt$(sel.gst_amount) : '—'],
            ['Prompt discount',   sel.prompt_discount ? fmt$(sel.prompt_discount) : '—'],
            ['Effective $/kWh',   sel.avg_cost_per_kwh ? '$' + sel.avg_cost_per_kwh : '—'],
          ]} />
        </Section>

        {/* ── Solar export (if present) ── */}
        {(sel.solar_export_kwh || sel.solar_export_credit) && (
          <Section title="Solar export (already solar!)">
            <Grid fields={[
              ['Export kWh',    sel.solar_export_kwh?.toLocaleString() || '—'],
              ['Export credit', sel.solar_export_credit ? fmt$(sel.solar_export_credit) : '—'],
            ]} />
          </Section>
        )}

        {/* ── Period-over-period ── */}
        {sel.prev_period_kwh && (
          <Section title="Period-over-period">
            <Grid fields={[
              ['Previous kWh',    sel.prev_period_kwh.toLocaleString()],
              ['Previous cost',   sel.prev_period_cost ? fmt$(sel.prev_period_cost) : '—'],
              ['Change (kWh)',    a.period_delta?.kwh_delta != null ? (a.period_delta.kwh_delta > 0 ? '+' : '') + a.period_delta.kwh_delta : '—'],
              ['Change (%)',      a.period_delta?.pct_change != null ? (a.period_delta.pct_change > 0 ? '+' : '') + a.period_delta.pct_change + '%' : '—'],
            ]} />
            {a.bill_shock && <Pill color="#ef4444" className="mt-2">Bill shock detected</Pill>}
          </Section>
        )}

        {/* ── Benchmarks ── */}
        <Section title="Benchmarks">
          <Grid fields={[
            ['Annual kWh (projected)', a.annual_kwh ? a.annual_kwh.toLocaleString() : '—'],
            ['Annual cost (projected)', a.annual_cost ? fmt$(a.annual_cost) : '—'],
            ['Usage band',       USAGE_BAND_LABELS[a.usage_band] || '—'],
            ['Usage vs NZ avg',  a.usage_vs_avg_pct != null ? (a.usage_vs_avg_pct > 0 ? '+' : '') + a.usage_vs_avg_pct + '%' : '—'],
            ['Rate band',        a.rate_band || '—'],
            ['Rate vs NZ avg',   a.rate_vs_avg_pct != null ? (a.rate_vs_avg_pct > 0 ? '+' : '') + a.rate_vs_avg_pct + '%' : '—'],
          ]} />
        </Section>

        {/* ── All four solar scenarios ── */}
        {a.scenarios?.length > 0 && (
          <Section title="Solar scenarios (no battery)">
            <div className="grid grid-cols-4 gap-2">
              {a.scenarios.map(s => {
                const isRec = a.recommended_scenario?.system_kw === s.system_kw;
                return (
                  <div key={s.system_kw} className={`rounded-xl p-3 border ${isRec ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-pink-50 ring-2 ring-amber-200' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-extrabold font-display">{s.system_kw} kW</div>
                      {isRec && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">BEST FIT</span>}
                    </div>
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex justify-between"><span className="text-gray-500">Panels</span><span className="font-semibold">{s.panel_count}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">System cost</span><span className="font-semibold">{fmt$(s.system_cost)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Annual gen</span><span className="font-semibold">{s.annual_generation_kwh.toLocaleString()} kWh</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Bill offset</span><span className="font-semibold text-amber-600">{s.bill_offset_pct}%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Annual save</span><span className="font-semibold text-emerald-600">{fmt$(s.annual_saving)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Payback</span><span className="font-semibold">{s.payback_years} yrs</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">25-yr net</span><span className="font-semibold text-violet-600">{fmt$(s.net_25yr)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Battery scenario ── */}
        {a.battery_scenario && (
          <Section title={<><Battery size={12} className="inline mr-1" /> With 10 kWh battery</>}>
            <Grid fields={[
              ['System',            a.battery_scenario.system_kw + ' kW + ' + a.battery_scenario.battery_kwh + ' kWh battery'],
              ['Total cost',        fmt$(a.battery_scenario.system_cost)],
              ['Annual saving',     fmt$(a.battery_scenario.annual_saving)],
              ['Payback',           a.battery_scenario.payback_years + ' yrs'],
              ['Bill offset',       a.battery_scenario.bill_offset_pct + '%'],
              ['25-yr net',         fmt$(a.battery_scenario.net_25yr)],
            ]} />
          </Section>
        )}

        {/* ── Environmental ── */}
        {(a.current_co2_kg || a.avoided_co2_kg_annual) && (
          <Section title={<><Leaf size={12} className="inline mr-1" /> Environmental impact</>}>
            <Grid fields={[
              ['Current CO₂ / yr',          a.current_co2_kg ? Math.round(a.current_co2_kg) + ' kg' : '—'],
              ['Avoided CO₂ / yr (solar)',  a.avoided_co2_kg_annual ? Math.round(a.avoided_co2_kg_annual) + ' kg' : '—'],
              ['Avoided CO₂ (25 yrs)',      a.avoided_co2_tonnes_25yr ? a.avoided_co2_tonnes_25yr + ' tonnes' : '—'],
              ['Trees equivalent',          a.trees_equivalent ? a.trees_equivalent + ' trees/yr' : '—'],
            ]} />
          </Section>
        )}

        {/* ── Retailer switching ── */}
        {a.cheaper_retailers?.length > 0 && (
          <Section title={<><Building2 size={12} className="inline mr-1" /> Cheaper retailer options</>}>
            <div className="space-y-1.5">
              {a.cheaper_retailers.map(c => (
                <div key={c.name} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-xs font-semibold">{c.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">${c.avg_rate}/kWh</span>
                    <span className="text-emerald-600 font-bold">+{fmt$(c.annual_saving)}/yr</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Load profile ── */}
        {a.load_profile?.length > 0 && (
          <Section title={<><Activity size={12} className="inline mr-1" /> Load-profile fingerprint</>}>
            <div className="space-y-2">
              {a.load_profile.map(l => (
                <div key={l.tag} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold capitalize mb-0.5">{l.tag.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-gray-600">{l.description}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Recommendations ── */}
        {a.recommendations?.length > 0 && (
          <Section title={<><Lightbulb size={12} className="inline mr-1" /> Recommendations ({a.recommendations.length})</>}>
            <ul className="space-y-2">
              {a.recommendations.map((rec, i) => (
                <li key={i} className="bg-gradient-to-r from-amber-50/60 via-white to-emerald-50/50 rounded-lg p-3 border border-amber-100">
                  <div className="flex justify-between items-start mb-1">
                    <b className="text-xs text-gray-800">{rec.title}</b>
                    <Badge color={REC_COLORS[rec.category] || '#94a3b8'}>{rec.category}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-600">{rec.tip}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Raw text ── */}
        {sel.raw_text && (
          <details className="bg-gray-50 rounded-xl border border-gray-100">
            <summary className="cursor-pointer text-xs font-semibold px-4 py-2.5 hover:bg-gray-100">
              Raw extracted text ({sel.raw_text.length.toLocaleString()} chars)
            </summary>
            <pre className="px-4 py-3 text-[10px] text-gray-600 max-h-64 overflow-auto whitespace-pre-wrap font-mono">{sel.raw_text}</pre>
          </details>
        )}
      </div>
    </Modal>
  );
}

// ── small helpers ──
const HeadlineCard = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-xl border border-gray-100 p-3" style={{ background: color + '08' }}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={12} style={{ color }} />
      <span className="text-[9px] uppercase font-bold tracking-wide text-gray-500">{label}</span>
    </div>
    <div className="text-lg font-extrabold font-display" style={{ color }}>{value}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-bold font-display mb-2 text-gray-800">{title}</h3>
    <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-3">{children}</div>
  </div>
);

const Grid = ({ fields }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
    {fields.map(([l, v], i) => (
      <div key={i} className="flex justify-between text-xs py-0.5 border-b border-gray-100">
        <span className="text-gray-400">{l}</span>
        <span className="font-semibold text-gray-700 truncate ml-2">{v}</span>
      </div>
    ))}
  </div>
);

const Pill = ({ color, children, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}
    style={{ background: color + '15', color }}>{children}</span>
);

// Month-on-month delta chip — shows % change, colored by direction.
// `invertColors` flips green/red (useful for kWh/cost/CO₂ where DOWN is good).
function DeltaChip({ label, value, unit = '%', invertColors = false, lastLabel, prevLabel }) {
  if (value == null) return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-center">
      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-bold text-gray-300">—</div>
    </div>
  );
  const positive = value >= 0;
  const good = invertColors ? !positive : positive;
  const color = good ? '#10b981' : '#ef4444';
  const bg = good ? 'bg-emerald-50' : 'bg-red-50';
  const Icon = value === 0 ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <div className={`rounded-lg border border-gray-100 ${bg} px-2.5 py-1.5 text-center`}
      title={lastLabel && prevLabel ? `${lastLabel} vs ${prevLabel}` : undefined}>
      <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-bold flex items-center justify-center gap-1" style={{ color }}>
        <Icon size={10} /> {positive ? '+' : ''}{value}{unit}
      </div>
    </div>
  );
}

// Aggregate recommended system sizes across all rows
function aggregateScenarios(rows) {
  const buckets = [
    { label: '3 kW', min: 2.5, max: 4, count: 0 },
    { label: '5 kW', min: 4,   max: 6, count: 0 },
    { label: '7 kW', min: 6,   max: 8.5, count: 0 },
    { label: '10 kW', min: 8.5, max: 11, count: 0 },
    { label: 'Other', min: 0, max: 2.5, count: 0 },
  ];
  rows.forEach(r => {
    const kw = r.analysis_json?.recommended_scenario?.system_kw;
    if (!kw) return;
    const b = buckets.find(b => kw >= b.min && kw < b.max) || buckets[4];
    b.count++;
  });
  return buckets.filter(b => b.count > 0);
}
