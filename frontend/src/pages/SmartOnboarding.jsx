import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, MessageCircle, AlertTriangle, Target,
  CheckCircle, Sparkles, ArrowRight, ArrowLeft, Loader,
  Wrench, Stethoscope, UtensilsCrossed, Home, Package,
  ShoppingBag, Briefcase, Bot, Zap, Phone,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = [
  { id: 'spare_parts', label: 'قطع غيار', icon: Wrench, color: 'from-orange-500 to-orange-700' },
  { id: 'clinic', label: 'عيادة طبية', icon: Stethoscope, color: 'from-blue-500 to-blue-700' },
  { id: 'restaurant', label: 'مطعم / مقهى', icon: UtensilsCrossed, color: 'from-red-500 to-red-700' },
  { id: 'real_estate', label: 'عقارات', icon: Home, color: 'from-green-500 to-green-700' },
  { id: 'warehouse', label: 'مستودع / توزيع', icon: Package, color: 'from-yellow-500 to-yellow-700' },
  { id: 'retail', label: 'محل تجاري', icon: ShoppingBag, color: 'from-pink-500 to-pink-700' },
  { id: 'services', label: 'مكتب خدمات', icon: Briefcase, color: 'from-purple-500 to-purple-700' },
  { id: 'general', label: 'أخرى', icon: Building2, color: 'from-slate-500 to-slate-700' },
];

const TEAM_SIZES = ['1-3 موظفين', '4-10 موظفين', '11-30 موظفاً', '31+ موظف'];

const CHANNELS = [
  { id: 'whatsapp', label: 'واتساب', icon: '💬' },
  { id: 'phone', label: 'تلفون', icon: '📞' },
  { id: 'walkin', label: 'حضور شخصي', icon: '🚶' },
  { id: 'website', label: 'موقع إلكتروني', icon: '🌐' },
  { id: 'social', label: 'سوشل ميديا', icon: '📱' },
];

const CHALLENGES = [
  'متابعة الطلبات',
  'الرد على العملاء',
  'إدارة المخزون',
  'جدولة المواعيد',
  'تقارير الأداء',
  'تتبع الموظفين',
  'الفوترة والمالية',
  'التسويق والعروض',
];

const STEPS = [
  { id: 1, label: 'عملك', icon: Building2 },
  { id: 2, label: 'فريقك', icon: Users },
  { id: 3, label: 'عملاؤك', icon: MessageCircle },
  { id: 4, label: 'تحدياتك', icon: AlertTriangle },
  { id: 5, label: 'هدفك', icon: Target },
];

const LOADING_STEPS = [
  'جاري تحليل عملك...',
  'جاري بناء بوت المحادثة...',
  'جاري توليد الأتمتات...',
  'جاري إعداد لوحة التحكم...',
  'جاري تجهيز الفريق...',
];

export default function SmartOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);

  const [answers, setAnswers] = useState({
    business_name: '',
    business_type: '',
    description: '',
    team_size: '',
    customer_channels: [],
    daily_customers: '',
    common_questions: '',
    challenges: [],
    first_goal: '',
  });

  function set(key, val) {
    setAnswers(p => ({ ...p, [key]: val }));
  }

  function toggleArray(key, val) {
    setAnswers(p => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val],
    }));
  }

  function canNext() {
    if (step === 1) return answers.business_name.trim() && answers.business_type;
    if (step === 2) return answers.team_size;
    if (step === 3) return answers.customer_channels.length > 0;
    if (step === 4) return answers.challenges.length > 0;
    if (step === 5) return answers.first_goal.trim();
    return true;
  }

  async function submit() {
    setLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(p => (p < LOADING_STEPS.length - 1 ? p + 1 : p));
    }, 2000);

    try {
      const res = await api.post('/business/onboarding', answers);
      clearInterval(interval);
      setResult(res.data.ai_config);
    } catch (err) {
      clearInterval(interval);
      toast.error('حدث خطأ، حاول مجدداً');
      setLoading(false);
    }
  }

  if (loading && !result) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">الذكاء الاصطناعي يبني نظامك</h2>
          <p className="text-slate-400 mb-10">يُحلّل عملك ويولّد كل شيء تلقائياً</p>
          <div className="space-y-3">
            {LOADING_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                i < loadingStep ? 'bg-green-500/10 border border-green-500/20' :
                i === loadingStep ? 'bg-violet-500/10 border border-violet-500/30' :
                'bg-dark-800 border border-dark-600 opacity-40'
              }`}>
                {i < loadingStep ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                ) : i === loadingStep ? (
                  <Loader className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0" />
                )}
                <span className={`text-sm ${i <= loadingStep ? 'text-white' : 'text-slate-500'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">النظام جاهز!</h2>
            <p className="text-slate-400 mt-1">تم بناء نظامك المخصص بالكامل</p>
          </div>

          <div className="card p-5 mb-4">
            <p className="text-slate-300 leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card p-4 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">بوت المحادثة</span>
              </div>
              <p className="text-white font-bold">{result.chatbot_config?.name}</p>
              <p className="text-xs text-slate-400 mt-1">تم إنشاؤه تلقائياً</p>
            </div>
            <div className="card p-4 border-violet-500/20 bg-violet-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-400">الأتمتات</span>
              </div>
              <p className="text-white font-bold">{result.automations?.length} أتمتة</p>
              <p className="text-xs text-slate-400 mt-1">مخصصة لعملك</p>
            </div>
          </div>

          {result.quick_wins?.length > 0 && (
            <div className="card p-4 mb-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                أسرع 3 إنجازات تبدأ بها
              </h3>
              <div className="space-y-2">
                {result.quick_wins.slice(0, 3).map((w, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-white font-medium">{w.title}</p>
                      <p className="text-slate-400 text-xs">{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/business')}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              ابدأ الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-xl w-full">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center gap-1`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    done ? 'bg-green-500/20 text-green-400' :
                    active ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' :
                    'bg-dark-700 text-slate-500'
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs ${active ? 'text-violet-400' : done ? 'text-green-400' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 mx-1 mb-4 transition-all ${done ? 'bg-green-500/50' : 'bg-dark-600'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card p-6">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">أخبرنا عن عملك</h2>
                <p className="text-slate-400 text-sm">سيبني الذكاء الاصطناعي نظاماً مخصصاً لك</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">اسم العمل</label>
                <input
                  value={answers.business_name}
                  onChange={e => set('business_name', e.target.value)}
                  placeholder="مثال: صيدلية الشفاء"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">نوع العمل</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => set('business_type', t.id)}
                        className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2 ${
                          answers.business_type === t.id
                            ? 'border-violet-500 bg-violet-500/10 text-white'
                            : 'border-dark-600 bg-dark-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">وصف مختصر (اختياري)</label>
                <textarea
                  value={answers.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="مثال: نبيع قطع غيار السيارات اليابانية والكورية..."
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">فريق العمل</h2>
                <p className="text-slate-400 text-sm">كم موظفاً معك؟</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TEAM_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => set('team_size', s)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      answers.team_size === s
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-dark-600 bg-dark-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">عملاؤك</h2>
                <p className="text-slate-400 text-sm">كيف يتواصل معك العملاء؟</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleArray('customer_channels', c.id)}
                    className={`p-3 rounded-xl border text-right flex items-center gap-2 transition-all ${
                      answers.customer_channels.includes(c.id)
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-dark-600 bg-dark-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-medium">{c.label}</span>
                    {answers.customer_channels.includes(c.id) && (
                      <CheckCircle className="w-4 h-4 text-violet-400 mr-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">عدد العملاء اليومي</label>
                  <select
                    value={answers.daily_customers}
                    onChange={e => set('daily_customers', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">اختر</option>
                    {['1-10', '10-30', '30-100', '100+'].map(o => (
                      <option key={o} value={o}>{o} عميل</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">ما الأسئلة التي يسألها العملاء كثيراً؟</label>
                <textarea
                  value={answers.common_questions}
                  onChange={e => set('common_questions', e.target.value)}
                  placeholder="مثال: الأسعار، التوفر، ساعات العمل، الضمان..."
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">تحدياتك اليومية</h2>
                <p className="text-slate-400 text-sm">اختر ما يواجهك (يمكن اختيار أكثر من واحد)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHALLENGES.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleArray('challenges', c)}
                    className={`p-3 rounded-xl border text-right text-sm transition-all flex items-center justify-between ${
                      answers.challenges.includes(c)
                        ? 'border-violet-500 bg-violet-500/10 text-white'
                        : 'border-dark-600 bg-dark-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {c}
                    {answers.challenges.includes(c) && <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">ما أول شيء تريد أتمتته؟</h2>
                <p className="text-slate-400 text-sm">اكتب بكلامك، الذكاء الاصطناعي سيفهمك</p>
              </div>
              <textarea
                value={answers.first_goal}
                onChange={e => set('first_goal', e.target.value)}
                placeholder="مثال: أريد بوتاً يرد على العملاء في واتساب ويعطيهم الأسعار دون تدخل مني..."
                rows={4}
                className="input w-full resize-none text-base"
                autoFocus
              />
              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <p className="text-violet-300 text-sm flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  سيولّد الذكاء الاصطناعي بوت محادثة، أتمتات مخصصة لعملك، ولوحة تحكم كاملة بناءً على إجاباتك.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-dark-600">
            <button
              onClick={() => setStep(p => p - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              السابق
            </button>
            <span className="text-xs text-slate-600">{step} / {STEPS.length}</span>
            {step < 5 ? (
              <button
                onClick={() => setStep(p => p + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="w-4 h-4" />
                ابنِ نظامي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
