import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, CheckCircle, Activity, TrendingUp, Plus, ArrowLeft, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <div className="card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/automations/stats'),
      api.get('/automations?limit=5'),
      api.get('/automations/logs?limit=6'),
    ]).then(([s, a, l]) => {
      setStats(s.data);
      setAutomations(a.data.automations || []);
      setLogs(l.data.logs || []);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = logs.slice(0, 7).reverse().map((l, i) => ({
    name: `تشغيل ${i + 1}`,
    نجح: l.status === 'success' ? 1 : 0,
    فشل: l.status === 'failed' ? 1 : 0,
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">إليك نظرة عامة على أتمتاتك</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الأتمتات" value={stats?.total_automations} icon={Zap} color="bg-primary-600" />
        <StatCard title="الأتمتات النشطة" value={stats?.active_automations} icon={CheckCircle} color="bg-emerald-600" />
        <StatCard title="إجمالي التشغيلات" value={stats?.total_runs} icon={Activity} color="bg-blue-600" />
        <StatCard title="معدل النجاح" value={`${stats?.success_rate || 0}%`} icon={TrendingUp} color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4">آخر التشغيلات</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f62ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f62ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e1e26', border: '1px solid #32323e', borderRadius: '8px', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="نجح" stroke="#4f62ff" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-500 text-sm">لا توجد تشغيلات بعد</div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">إجراءات سريعة</h2>
          <div className="space-y-2">
            <Link to="/automations/new" className="flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all group">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">أتمتة جديدة</p>
                <p className="text-xs text-slate-500">بالأزرار أو بالذكاء الاصطناعي</p>
              </div>
            </Link>
            <Link to="/integrations" className="flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">ربط تكامل</p>
                <p className="text-xs text-slate-500">SMS · WhatsApp · Gmail</p>
              </div>
            </Link>
            <Link to="/subscription" className="flex items-center gap-3 p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">ترقية الخطة</p>
                <p className="text-xs text-slate-500">افتح ميزات الأعمال</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent automations */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">الأتمتات الأخيرة</h2>
          <Link to="/automations" className="text-sm text-primary-400 hover:underline flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
        {automations.length === 0 ? (
          <div className="py-10 text-center">
            <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">لا توجد أتمتات بعد</p>
            <Link to="/automations/new" className="btn-primary text-sm mt-4 inline-flex">
              <Plus className="w-4 h-4" /> إنشاء أول أتمتة
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {automations.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.trigger_type} · {a.run_count} تشغيل</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {a.last_run_at ? new Date(a.last_run_at).toLocaleDateString('ar') : 'لم يُشغَّل'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
