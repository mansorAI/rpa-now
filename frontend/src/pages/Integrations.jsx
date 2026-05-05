import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Mail, Webhook, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const INTEGRATION_TYPES = [
  { value: 'twilio',    label: 'Twilio SMS',        icon: Phone,          color: 'bg-red-500/10 text-red-400',    desc: 'إرسال واستقبال SMS' },
  { value: 'whatsapp',  label: 'WhatsApp Cloud',    icon: MessageSquare,  color: 'bg-emerald-500/10 text-emerald-400', desc: 'واتساب للأعمال' },
  { value: 'gmail',     label: 'Gmail',             icon: Mail,           color: 'bg-blue-500/10 text-blue-400',  desc: 'إرسال البريد الإلكتروني' },
  { value: 'webhook',   label: 'Webhook',           icon: Webhook,        color: 'bg-violet-500/10 text-violet-400', desc: 'استقبال البيانات الخارجية' },
];

const TestPanel = ({ type, onTest }) => {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('رسالة اختبار من منصة الأتمتة');
  const [loading, setLoading] = useState(false);

  const test = async () => {
    if (!to) return toast.error('ادخل رقم الهاتف أو البريد');
    setLoading(true);
    try {
      await onTest({ to, message });
      toast.success('تم الإرسال بنجاح!');
    } catch { toast.error('فشل الإرسال'); } finally { setLoading(false); }
  };

  if (!['twilio', 'whatsapp'].includes(type)) return null;

  return (
    <div className="mt-3 p-3 bg-dark-700/50 rounded-lg space-y-2">
      <p className="text-xs text-slate-400">اختبار الاتصال</p>
      <input value={to} onChange={e => setTo(e.target.value)} className="input text-sm" placeholder="+966..." dir="ltr" />
      <input value={message} onChange={e => setMessage(e.target.value)} className="input text-sm" placeholder="نص الاختبار" />
      <button onClick={test} disabled={loading} className="btn-primary text-xs py-1.5 px-3">
        {loading ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : 'إرسال اختبار'}
      </button>
    </div>
  );
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [creds, setCreds] = useState({});

  const load = () => {
    api.get('/integrations').then(({ data }) => setIntegrations(data.integrations || [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (type) => {
    await api.post('/integrations', { type, name: INTEGRATION_TYPES.find(t => t.value === type)?.label, credentials: creds });
    toast.success('تم حفظ التكامل');
    setAdding(null);
    setCreds({});
    load();
  };

  const remove = async (id) => {
    if (!confirm('حذف هذا التكامل؟')) return;
    await api.delete(`/integrations/${id}`);
    toast.success('تم الحذف');
    load();
  };

  const testIntegration = async ({ to, message }, type) => {
    if (type === 'twilio') await api.post('/integrations/test/sms', { to, message });
    else if (type === 'whatsapp') await api.post('/integrations/test/whatsapp', { to, message });
  };

  const isConnected = (type) => integrations.some(i => i.type === type && i.is_active);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">التكاملات</h1>
        <p className="text-slate-400 text-sm mt-0.5">ربط خدمات الرسائل والبريد الإلكتروني</p>
      </div>

      <div className="space-y-4">
        {INTEGRATION_TYPES.map(({ value, label, icon: Icon, color, desc }) => {
          const connected = isConnected(value);
          const integration = integrations.find(i => i.type === value);

          return (
            <div key={value} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{label}</h3>
                      {connected ? (
                        <span className="badge-success"><CheckCircle className="w-3 h-3" /> متصل</span>
                      ) : (
                        <span className="badge-warning"><AlertCircle className="w-3 h-3" /> غير متصل</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">{desc}</p>

                    {/* Webhook URLs */}
                    {connected && value === 'twilio' && (
                      <p className="text-xs text-slate-500 mt-1 font-mono" dir="ltr">Webhook: /api/integrations/twilio/sms</p>
                    )}
                    {connected && value === 'whatsapp' && (
                      <p className="text-xs text-slate-500 mt-1 font-mono" dir="ltr">Webhook: /api/integrations/whatsapp/webhook</p>
                    )}

                    {/* Add form */}
                    {adding === value && (
                      <div className="mt-3 space-y-2">
                        {value === 'twilio' && (
                          <>
                            <input className="input text-sm" placeholder="Account SID" dir="ltr" onChange={e => setCreds(c => ({ ...c, account_sid: e.target.value }))} />
                            <input className="input text-sm" placeholder="Auth Token" dir="ltr" type="password" onChange={e => setCreds(c => ({ ...c, auth_token: e.target.value }))} />
                            <input className="input text-sm" placeholder="Phone Number (+1...)" dir="ltr" onChange={e => setCreds(c => ({ ...c, phone: e.target.value }))} />
                          </>
                        )}
                        {value === 'whatsapp' && (
                          <>
                            <input className="input text-sm" placeholder="Access Token" dir="ltr" onChange={e => setCreds(c => ({ ...c, token: e.target.value }))} />
                            <input className="input text-sm" placeholder="Phone ID" dir="ltr" onChange={e => setCreds(c => ({ ...c, phone_id: e.target.value }))} />
                          </>
                        )}
                        {value === 'gmail' && (
                          <button onClick={() => api.get('/integrations/gmail/auth').then(({ data }) => window.open(data.url))}
                            className="btn-primary text-sm py-2">
                            ربط Gmail عبر Google
                          </button>
                        )}
                        {value === 'webhook' && (
                          <input className="input text-sm" placeholder="Secret Token (اختياري)" dir="ltr" onChange={e => setCreds(c => ({ ...c, secret: e.target.value }))} />
                        )}
                        {value !== 'gmail' && (
                          <div className="flex gap-2">
                            <button onClick={() => save(value)} className="btn-primary text-sm py-2">حفظ</button>
                            <button onClick={() => setAdding(null)} className="btn-ghost text-sm py-2">إلغاء</button>
                          </div>
                        )}
                      </div>
                    )}

                    {connected && (
                      <TestPanel type={value} onTest={(p) => testIntegration(p, value)} />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!connected && adding !== value && (
                    <button onClick={() => setAdding(value)} className="btn-primary text-sm py-2 px-3">
                      <Plus className="w-4 h-4" /> ربط
                    </button>
                  )}
                  {connected && integration && (
                    <button onClick={() => remove(integration.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
