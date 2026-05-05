import { useState, useEffect } from 'react';
import { Check, Zap, Building2, Rocket, CreditCard } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const PLAN_ICONS = { personal: Zap, business: Building2, enterprise: Rocket };
const PLAN_COLORS = {
  personal:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700' },
  business:   { bg: 'bg-primary-500/10', border: 'border-primary-500/30', text: 'text-primary-400', btn: 'bg-primary-600 hover:bg-primary-700' },
  enterprise: { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-400',  btn: 'bg-violet-600 hover:bg-violet-700' },
};

const FEATURES = {
  personal:   ['5 أتمتات', '500 تشغيل/شهر', 'SMS فقط', 'دعم بريد إلكتروني'],
  business:   ['50 أتمتة', '10,000 تشغيل/شهر', 'SMS + واتساب + بريد', 'ذكاء اصطناعي مدمج', 'دعم أولوية'],
  enterprise: ['أتمتات غير محدودة', 'تشغيلات غير محدودة', 'جميع التكاملات', 'Webhook مخصص', 'دعم مخصص', 'حساب مخصص'],
};

export default function Subscription() {
  const { workspace } = useAuth();
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  useEffect(() => {
    api.get('/billing/subscription').then(({ data }) => {
      setPlans(data.plans || {});
      setSubscription(data.subscription);
    }).finally(() => setLoading(false));
  }, []);

  const subscribe = async (plan) => {
    setCheckoutLoading(plan);
    try {
      const { data } = await api.post('/billing/checkout', { plan });
      window.location.href = data.url;
    } catch { toast.error('فشل في إنشاء جلسة الدفع'); } finally { setCheckoutLoading(''); }
  };

  const openPortal = async () => {
    try {
      const { data } = await api.post('/billing/portal');
      window.location.href = data.url;
    } catch { toast.error('فشل في فتح بوابة الفوترة'); }
  };

  const currentPlan = workspace?.plan || 'personal';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الاشتراك</h1>
          <p className="text-slate-400 text-sm mt-0.5">اختر الخطة المناسبة لعملك</p>
        </div>
        {subscription && (
          <button onClick={openPortal} className="btn-ghost text-sm">
            <CreditCard className="w-4 h-4" /> إدارة الفوترة
          </button>
        )}
      </div>

      {/* Current subscription */}
      {subscription && (
        <div className="card border-primary-500/20 bg-primary-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">الاشتراك الحالي</p>
              <p className="text-lg font-bold text-white mt-0.5 capitalize">{subscription.plan}</p>
              <p className="text-xs text-slate-500 mt-1">
                {subscription.status === 'active' ? '✅ نشط' : subscription.status}
                {subscription.current_period_end && ` · يتجدد ${new Date(subscription.current_period_end).toLocaleDateString('ar')}`}
              </p>
            </div>
            <span className="badge-success">نشط</span>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(plans).map(([key, plan]) => {
          const Icon = PLAN_ICONS[key] || Zap;
          const colors = PLAN_COLORS[key];
          const isCurrent = key === currentPlan;
          const features = FEATURES[key] || [];

          return (
            <div key={key} className={`card border-2 transition-all ${isCurrent ? colors.border : 'border-dark-600'} ${key === 'business' ? 'relative' : ''}`}>
              {key === 'business' && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">الأكثر شيوعاً</span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>

              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="flex items-end gap-1 mt-2 mb-4">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                <span className="text-slate-400 text-sm mb-1">/شهر</span>
              </div>

              <ul className="space-y-2 mb-6">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className={`w-full py-2.5 rounded-lg text-center text-sm font-medium ${colors.bg} ${colors.text}`}>
                  خطتك الحالية
                </div>
              ) : (
                <button
                  onClick={() => subscribe(key)}
                  disabled={checkoutLoading === key}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all ${colors.btn} disabled:opacity-50`}
                >
                  {checkoutLoading === key ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : `الترقية إلى ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">الأسعار بالدولار الأمريكي · يمكن الإلغاء في أي وقت · مدعوم بـ Stripe</p>
    </div>
  );
}
