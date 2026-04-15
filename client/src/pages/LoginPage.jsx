import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const DEMO_USERS = [
  { name: 'Aroha Mitchell', email: 'aroha@goldenray.co.nz', pw: 'admin123', role: 'Admin', color: '#dc2626' },
  { name: 'Liam Patel', email: 'liam@goldenray.co.nz', pw: 'manager123', role: 'Sales Mgr', color: '#7c3aed' },
  { name: 'Sophie Nguyen', email: 'sophie@goldenray.co.nz', pw: 'sales123', role: 'Sales Exec', color: '#2563eb' },
  { name: 'Jack Te Awa', email: 'jack@goldenray.co.nz', pw: 'proposal123', role: 'Proposals', color: '#d97706' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      await login(email, pw);
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setShowDemo(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="w-full max-w-md px-4">
        <Link to="/" className="flex items-center gap-2.5 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Sun size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-extrabold font-display">Golden<span className="text-amber-500">Ray</span>Energy</div>
            <div className="text-[10px] text-gray-400">Employee Portal</div>
          </div>
        </Link>

        <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-xl shadow-gray-100/50">
          <h2 className="text-xl font-bold font-display mb-5">Sign In</h2>

          {error && <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">{error}</div>}

          {[['Email', email, setEmail, 'email'], ['Password', pw, setPw, 'password']].map(([label, val, setter, type]) => (
            <div key={label} className="mb-3">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{label}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 transition" />
            </div>
          ))}

          <Button onClick={handleLogin} variant="dark" size="lg" block icon={loading ? undefined : ArrowRight} disabled={loading || !email || !pw}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setShowDemo(!showDemo)}
              className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
              <Info size={12} /> {showDemo ? 'Hide' : 'Show'} Demo Logins
            </button>
            {showDemo && (
              <div className="mt-2 space-y-1">
                {DEMO_USERS.map(u => (
                  <button key={u.email} onClick={() => { setEmail(u.email); setPw(u.pw); }}
                    className="flex items-center gap-2 w-full p-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition text-left">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold"
                      style={{ background: u.color + '12', color: u.color }}>
                      {u.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold">{u.name}</div>
                      <div className="text-[9px] text-gray-400">{u.email}</div>
                    </div>
                    <Badge color={u.color}>{u.role}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link to="/" className="flex items-center justify-center gap-1 mt-4 text-xs text-gray-400 hover:text-gray-600">
          <ArrowLeft size={12} /> Back to Website
        </Link>
      </div>
    </div>
  );
}
