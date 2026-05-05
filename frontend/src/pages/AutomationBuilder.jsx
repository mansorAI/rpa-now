import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Save, Play, ChevronDown, MessageSquare, Mail, Phone, Webhook, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TRIGGERS = [
  { value: 'sms',       label: 'رسالة SMS',       icon: Phone },
  { value: 'whatsapp',  label: 'رسالة واتساب',    icon: MessageSquare },
  { value: 'email',     label: 'بريد إلكتروني',   icon: Mail },
  { value: 'webhook',   label: 'Webhook',          icon: Webhook },
  { value: 'schedule',  label: 'جدول زمني',        icon: Clock },
];

const OPERATORS = [
  { value: 'contains',      label: 'يحتوي على' },
  { value: 'equals',        label: 'يساوي' },
  { value: 'greater_than',  label: 'أكبر من' },
  { value: 'less_than',     label: 'أصغر من' },
  { value: 'exists',        label: 'موجود' },
];

const ACTION_TYPES = [
  { value: 'send_sms',          label: 'إرسال SMS' },
  { value: 'send_whatsapp',     label: 'إرسال واتساب' },
  { value: 'send_email',        label: 'إرسال بريد' },
  { value: 'store_transaction', label: 'تخزين معاملة مالية' },
  { value: 'send_notification', label: 'إشعار داخلي' },
  { value: 'webhook',           label: 'استدعاء Webhook' },
];

const SAMPLE_AUTOMATIONS = [
  {
    name: 'تتبع المصاريف',
    description: 'إذا وصلت رسالة SMS تحتوي مبلغاً، سجّله تلقائياً',
    trigger_type: 'sms',
    ai_enabled: true,
    ai_prompt: 'استخرج المبلغ والجهة من رسالة SMS البنكية',
    conditions: [{ field: 'ai.amount', operator: 'exists', value: '' }],
    actions: [
      { type: 'store_transaction', config: { description: 'مصروف تلقائي' } },
      { type: 'send_notification', config: { title: 'مصروف جديد', message: 'تم تسجيل مبلغ {{ai.amount}} {{ai.currency}}' } },
    ],
  },
  {
    name: 'تنبيه مدفوعات كبيرة',
    description: 'إشعار فوري إذا كان المبلغ أكثر من 500 ريال',
    trigger_type: 'sms',
    ai_enabled: true,
    ai_prompt: 'استخرج المبلغ من الرسالة البنكية',
    conditions: [{ field: 'ai.amount', operator: 'greater_than', value: '500' }],
    actions: [
      { type: 'send_whatsapp', config: { to: '{{trigger.from}}', message: 'تنبيه: تم رصد دفعة بقيمة {{ai.amount}} ريال' } },
    ],
  },
];

export default function AutomationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState('builder'); // builder | ai
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger_type: 'sms',
    trigger_config: {},
    conditions: [],
    actions: [],
    ai_enabled: false,
    ai_prompt: '',
  });

  useEffect(() => {
    if (id) {
      api.get(`/automations/${id}`).then(({ data }) => {
        const a = data.automation;
        setForm({
          name: a.name, description: a.description || '',
          trigger_type: a.trigger_type, trigger_config: a.trigger_config || {},
          conditions: a.conditions || [], actions: a.actions || [],
          ai_enabled: a.ai_enabled, ai_prompt: a.ai_prompt || '',
        });
      });
    }
  }, [id]);

  const buildFromAI = async () => {
    if (!aiPrompt.trim()) return toast.error('اكتب وصف الأتمتة');
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/build-automation', { prompt: aiPrompt });
      const a = data.automation;
      setForm({
        name: a.name, description: a.description || '',
        trigger_type: a.trigger_type, trigger_config: a.trigger_config || {},
        conditions: a.conditions || [], actions: a.actions || [],
        ai_enabled: true, ai_prompt: aiPrompt,
      });
      setMode('builder');
      toast.success('تم بناء الأتمتة بالذكاء الاصطناعي!');
    } catch {
      toast.error('فشل في بناء الأتمتة');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSample = (sample) => {
    setForm({ ...form, ...sample });
    toast.success('تم تحميل النموذج');
  };

  const addCondition = () => {
    setForm(f => ({ ...f, conditions: [...f.conditions, { field: 'ai.amount', operator: 'greater_than', value: '' }] }));
  };

  const updateCondition = (i, key, val) => {
    setForm(f => {
      const conditions = [...f.conditions];
      conditions[i] = { ...conditions[i], [key]: val };
      return { ...f, conditions };
    });
  };

  const removeCondition = (i) => {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));
  };

  const addAction = () => {
    setForm(f => ({ ...f, actions: [...f.actions, { type: 'send_notification', config: { title: '', message: '' } }] }));
  };

  const updateAction = (i, key, val) => {
    setForm(f => {
      const actions = [...f.actions];
      actions[i] = { ...actions[i], [key]: val };
      return { ...f, actions };
    });
  };

  const updateActionConfig = (i, key, val) => {
    setForm(f => {
      const actions = [...f.actions];
      actions[i] = { ...actions[i], config: { ...actions[i].config, [key]: val } };
      return { ...f, actions };
    });
  };

  const removeAction = (i) => {
    setForm(f => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('اسم الأتمتة مطلوب');
    if (form.actions.length === 0) return toast.error('أضف إجراءً واحداً على الأقل');
    setSaving(true);
    try {
      if (id) {
        await api.put(`/automations/${id}`, form);
        toast.success('تم حفظ التغييرات');
      } else {
        await api.post('/automations', form);
        toast.success('تم إنشاء الأتمتة!');
      }
      navigate('/automations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{id ? 'تعديل الأتمتة' : 'أتمتة جديدة'}</h1>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الأتمتة
        </button>
      </div>

      {/* Mode toggle */}
      {!id && (
        <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-dark-600 w-fit">
          {[['builder', 'بناء بالأزرار'], ['ai', 'بناء بالذكاء الاصطناعي ✨']].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >{l}</button>
          ))}
        </div>
      )}

      {/* AI Builder */}
      {mode === 'ai' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h2 className="font-semibold text-white">اصف الأتمتة بالعربية</h2>
          </div>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="مثال: إذا وصلتني رسالة SMS من البنك تحتوي مبلغاً أكثر من 300 ريال، سجّلها كمصروف وأرسل لي إشعاراً"
          />
          <button onClick={buildFromAI} disabled={aiLoading} className="btn-primary">
            {aiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            بناء الأتمتة تلقائياً
          </button>

          {/* Samples */}
          <div>
            <p className="text-xs text-slate-500 mb-2">نماذج جاهزة:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_AUTOMATIONS.map((s, i) => (
                <button key={i} onClick={() => { setMode('builder'); loadSample(s); }}
                  className="text-right p-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-all border border-dark-600 hover:border-primary-500/30">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Builder */}
      {mode === 'builder' && (
        <div className="space-y-5">
          {/* Basic info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white border-b border-dark-600 pb-3">المعلومات الأساسية</h2>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">اسم الأتمتة *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="مثال: تتبع مصاريف البنك" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">الوصف</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="وصف اختياري" />
            </div>
          </div>

          {/* Trigger */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white border-b border-dark-600 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">1</span>
              المشغّل (Trigger)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRIGGERS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setForm(f => ({ ...f, trigger_type: value }))}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${
                    form.trigger_type === value
                      ? 'border-primary-500 bg-primary-600/10 text-primary-300'
                      : 'border-dark-600 text-slate-400 hover:border-dark-500 hover:text-white'
                  }`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Layer */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">2</span>
                طبقة الذكاء الاصطناعي
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, ai_enabled: !f.ai_enabled }))}
                  className={`w-10 h-6 rounded-full transition-colors ${form.ai_enabled ? 'bg-primary-600' : 'bg-dark-600'} relative`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.ai_enabled ? 'right-1' : 'right-5'}`} />
                </div>
                <span className="text-sm text-slate-300">تفعيل AI</span>
              </label>
            </div>
            {form.ai_enabled && (
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">تعليمات الذكاء الاصطناعي</label>
                <textarea
                  value={form.ai_prompt}
                  onChange={e => setForm(f => ({ ...f, ai_prompt: e.target.value }))}
                  rows={2}
                  className="input resize-none text-sm"
                  placeholder="مثال: استخرج المبلغ والجهة من رسالة البنك"
                />
                <p className="text-xs text-slate-500 mt-1">يمكن استخدام {'{{ai.amount}}'} {'{{ai.category}}'} {'{{ai.sender}}'} في الشروط والإجراءات</p>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
                الشروط (اختياري)
              </h2>
              <button onClick={addCondition} className="text-xs text-primary-400 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> إضافة شرط
              </button>
            </div>
            {form.conditions.length === 0 && (
              <p className="text-xs text-slate-500 bg-dark-700 p-3 rounded-lg">لا توجد شروط — ستُنفَّذ الأتمتة دائماً عند التشغيل</p>
            )}
            {form.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-dark-700 rounded-lg">
                <input value={c.field} onChange={e => updateCondition(i, 'field', e.target.value)}
                  className="input text-sm flex-1" placeholder="الحقل (مثال: ai.amount)" dir="ltr" />
                <select value={c.operator} onChange={e => updateCondition(i, 'operator', e.target.value)}
                  className="input text-sm w-32">
                  {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)}
                  className="input text-sm w-24" placeholder="القيمة" dir="ltr" />
                <button onClick={() => removeCondition(i)} className="text-slate-500 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
                الإجراءات *
              </h2>
              <button onClick={addAction} className="text-xs text-primary-400 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> إضافة إجراء
              </button>
            </div>
            {form.actions.length === 0 && (
              <button onClick={addAction}
                className="w-full p-4 border-2 border-dashed border-dark-600 hover:border-primary-500/50 rounded-lg text-slate-500 hover:text-slate-300 transition-all text-sm flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> إضافة إجراء
              </button>
            )}
            {form.actions.map((a, i) => (
              <div key={i} className="p-4 bg-dark-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <select value={a.type} onChange={e => updateAction(i, 'type', e.target.value)}
                    className="input text-sm w-48">
                    {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button onClick={() => removeAction(i)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {['send_sms', 'send_whatsapp'].includes(a.type) && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={a.config.to || ''} onChange={e => updateActionConfig(i, 'to', e.target.value)}
                      className="input text-sm" placeholder="رقم الهاتف {{from}}" dir="ltr" />
                    <input value={a.config.message || ''} onChange={e => updateActionConfig(i, 'message', e.target.value)}
                      className="input text-sm" placeholder="نص الرسالة" />
                  </div>
                )}
                {a.type === 'send_email' && (
                  <div className="grid grid-cols-1 gap-2">
                    <input value={a.config.to || ''} onChange={e => updateActionConfig(i, 'to', e.target.value)}
                      className="input text-sm" placeholder="البريد المستلم" dir="ltr" />
                    <input value={a.config.subject || ''} onChange={e => updateActionConfig(i, 'subject', e.target.value)}
                      className="input text-sm" placeholder="موضوع البريد" />
                    <textarea value={a.config.body || ''} onChange={e => updateActionConfig(i, 'body', e.target.value)}
                      className="input text-sm resize-none" rows={2} placeholder="محتوى البريد" />
                  </div>
                )}
                {a.type === 'send_notification' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={a.config.title || ''} onChange={e => updateActionConfig(i, 'title', e.target.value)}
                      className="input text-sm" placeholder="عنوان الإشعار" />
                    <input value={a.config.message || ''} onChange={e => updateActionConfig(i, 'message', e.target.value)}
                      className="input text-sm" placeholder="نص الإشعار" />
                  </div>
                )}
                {a.type === 'store_transaction' && (
                  <input value={a.config.description || ''} onChange={e => updateActionConfig(i, 'description', e.target.value)}
                    className="input text-sm" placeholder="وصف المعاملة" />
                )}
                {a.type === 'webhook' && (
                  <input value={a.config.url || ''} onChange={e => updateActionConfig(i, 'url', e.target.value)}
                    className="input text-sm" placeholder="https://..." dir="ltr" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
