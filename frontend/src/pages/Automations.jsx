import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap, Play, Pause, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TRIGGER_LABELS = { sms: 'SMS', whatsapp: 'واتساب', email: 'بريد', schedule: 'جدول', webhook: 'Webhook' };

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/automations').then(({ data }) => setAutomations(data.automations || [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (id, isActive) => {
    await api.put(`/automations/${id}`, { is_active: !isActive });
    toast.success(isActive ? 'تم إيقاف الأتمتة' : 'تم تفعيل الأتمتة');
    load();
  };

  const remove = async (id) => {
    if (!confirm('هل تريد حذف هذه الأتمتة؟')) return;
    await api.delete(`/automations/${id}`);
    toast.success('تم الحذف');
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الأتمتات</h1>
          <p className="text-slate-400 text-sm mt-0.5">{automations.length} أتمتة</p>
        </div>
        <Link to="/automations/new" className="btn-primary">
          <Plus className="w-4 h-4" /> أتمتة جديدة
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="card py-20 text-center">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">لا توجد أتمتات بعد</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">ابدأ بإنشاء أول أتمتة ذكية</p>
          <Link to="/automations/new" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> إنشاء أتمتة
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {automations.map(a => (
            <div key={a.id} className="card hover:border-dark-500 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.is_active ? 'bg-primary-600/20' : 'bg-dark-700'}`}>
                    <Zap className={`w-5 h-5 ${a.is_active ? 'text-primary-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{a.name}</h3>
                      <span className="badge-info">{TRIGGER_LABELS[a.trigger_type] || a.trigger_type}</span>
                      {a.ai_enabled && <span className="badge-success">AI</span>}
                      <span className={a.is_active ? 'badge-success' : 'badge-warning'}>
                        {a.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </div>
                    {a.description && <p className="text-slate-400 text-sm mt-1">{a.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{a.run_count} تشغيل</span>
                      <span>{a.total_runs} سجل</span>
                      {a.last_run_at && <span>آخر تشغيل: {new Date(a.last_run_at).toLocaleDateString('ar')}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(a.id, a.is_active)}
                    className={`p-2 rounded-lg transition-all ${a.is_active ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                    title={a.is_active ? 'إيقاف' : 'تفعيل'}
                  >
                    {a.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <Link
                    to={`/automations/${a.id}/edit`}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-600 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => remove(a.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
