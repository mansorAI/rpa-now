import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Users, MessageSquare, Zap, Clock, CheckCircle,
  Plus, Trash2, Edit, Phone, Shield, Eye, Loader,
  Sparkles, TrendingUp, AlertTriangle, Settings,
  Activity, FileText, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'whatsapp', label: 'بوت واتساب', icon: Phone },
  { id: 'team', label: 'الفريق', icon: Users },
  { id: 'audit', label: 'سجل التعديلات', icon: FileText },
];

const ROLE_LABELS = {
  owner: { label: 'مالك', color: 'text-yellow-400 bg-yellow-400/10' },
  manager: { label: 'مدير', color: 'text-blue-400 bg-blue-400/10' },
  employee: { label: 'موظف', color: 'text-green-400 bg-green-400/10' },
  viewer: { label: 'مشاهد', color: 'text-slate-400 bg-slate-400/10' },
};

const ACTION_LABELS = {
  completed_onboarding: { label: 'أكمل الإعداد', color: 'text-violet-400', icon: Sparkles },
  invited_member: { label: 'أضاف عضواً', color: 'text-blue-400', icon: Users },
  updated_member_role: { label: 'غيّر دور عضو', color: 'text-yellow-400', icon: Shield },
  created_whatsapp_bot: { label: 'أنشأ بوت واتساب', color: 'text-green-400', icon: Phone },
  completed_onboarding_chatbot: { label: 'أنشأ بوت محادثة', color: 'text-purple-400', icon: Bot },
};

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState([]);
  const [audit, setAudit] = useState([]);
  const [waBots, setWaBots] = useState([]);
  const [waConvs, setWaConvs] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'employee', department: '' });
  const [showAddWA, setShowAddWA] = useState(false);
  const [waData, setWaData] = useState({ chatbot_id: '', phone_number: '', config: {} });

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const [p, t, a, wb, bots] = await Promise.all([
        api.get('/business/profile'),
        api.get('/business/team'),
        api.get('/business/audit'),
        api.get('/whatsapp/bots').catch(() => ({ data: [] })),
        api.get('/chatbots').catch(() => ({ data: [] })),
      ]);
      setProfile(p.data);
      setTeam(t.data);
      setAudit(a.data);
      setWaBots(wb.data);
      setChatbots(bots.data);

      if (!p.data) navigate('/onboarding');
    } catch { navigate('/onboarding'); }
    setLoading(false);
  }

  async function loadWAConvs() {
    try {
      const r = await api.get('/whatsapp/conversations');
      setWaConvs(r.data);
    } catch {}
  }

  useEffect(() => {
    if (tab === 'whatsapp') loadWAConvs();
  }, [tab]);

  async function inviteMember() {
    try {
      await api.post('/business/team/invite', inviteData);
      toast.success('تم إضافة العضو');
      setShowInvite(false);
      setInviteData({ email: '', role: 'employee', department: '' });
      const r = await api.get('/business/team');
      setTeam(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  }

  async function removeMember(id) {
    if (!confirm('هل تريد إزالة هذا العضو؟')) return;
    await api.delete(`/business/team/${id}`);
    setTeam(t => t.filter(m => m.id !== id));
    toast.success('تم الحذف');
  }

  async function addWABot() {
    try {
      await api.post('/whatsapp/bots', waData);
      toast.success('تم ربط البوت بواتساب');
      setShowAddWA(false);
      const r = await api.get('/whatsapp/bots');
      setWaBots(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ');
    }
  }

  async function toggleWABot(bot) {
    await api.put(`/whatsapp/bots/${bot.id}`, {
      chatbot_id: bot.chatbot_id,
      config: bot.config,
      is_active: !bot.is_active,
    });
    const r = await api.get('/whatsapp/bots');
    setWaBots(r.data);
  }

  async function deleteWABot(id) {
    if (!confirm('هل تريد حذف هذا الربط؟')) return;
    await api.delete(`/whatsapp/bots/${id}`);
    setWaBots(w => w.filter(b => b.id !== id));
  }

  const aiConfig = profile?.ai_config || {};

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile?.business_name || 'لوحة أعمالي'}</h1>
            <p className="text-xs text-slate-400">مركز إدارة ومتابعة عملك</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-dark-700 transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
          إعادة الإعداد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center
                ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">

        {/* ── نظرة عامة ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Summary */}
            {aiConfig.summary && (
              <div className="card p-4 border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">{aiConfig.summary}</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'أعضاء الفريق', value: team.length, icon: Users, color: 'text-blue-400' },
                { label: 'بوتات واتساب', value: waBots.length, icon: Phone, color: 'text-green-400' },
                { label: 'بوتات محادثة', value: chatbots.length, icon: Bot, color: 'text-violet-400' },
                { label: 'إجراءات اليوم', value: audit.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length, icon: Activity, color: 'text-orange-400' },
              ].map((s, i) => (
                <div key={i} className="card p-4">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Wins */}
            {aiConfig.quick_wins?.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  الإنجازات السريعة الموصى بها
                </h3>
                <div className="space-y-2">
                  {aiConfig.quick_wins.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg">
                      <span className="w-5 h-5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{w.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{w.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Automations */}
            {aiConfig.automations?.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  أتمتات مقترحة لعملك
                </h3>
                <div className="space-y-2">
                  {aiConfig.automations.slice(0, 5).map((a, i) => (
                    <div key={i} className="p-3 bg-dark-700 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-white font-medium">{a.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          a.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          a.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {a.priority === 'high' ? 'عالي' : a.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── بوت واتساب ── */}
        {tab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="card p-4 border-blue-500/20 bg-blue-500/5">
              <h3 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                إعداد Twilio WhatsApp
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                اضبط هذا الرابط كـ Webhook في إعدادات Twilio WhatsApp:
              </p>
              <div className="bg-dark-700 rounded-lg p-2 text-xs text-green-400 font-mono break-all">
                {window.location.origin.includes('localhost')
                  ? 'https://rpa-now-production.up.railway.app/api/whatsapp/webhook'
                  : `${window.location.origin.replace('rpa-now.vercel.app', 'rpa-now-production.up.railway.app')}/api/whatsapp/webhook`}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">البوتات المربوطة</h3>
              <button
                onClick={() => setShowAddWA(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                ربط رقم
              </button>
            </div>

            {showAddWA && (
              <div className="card p-4 border-green-500/20">
                <h4 className="text-sm font-bold text-white mb-3">ربط رقم واتساب ببوت</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">اختر البوت</label>
                    <select className="input w-full text-sm"
                      value={waData.chatbot_id}
                      onChange={e => setWaData(p => ({ ...p, chatbot_id: e.target.value }))}>
                      <option value="">-- اختر بوت --</option>
                      {chatbots.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">رقم واتساب (مع رمز الدولة)</label>
                    <input className="input w-full text-sm" placeholder="+966501234567"
                      value={waData.phone_number}
                      onChange={e => setWaData(p => ({ ...p, phone_number: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addWABot}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all">
                      ربط
                    </button>
                    <button onClick={() => setShowAddWA(false)}
                      className="px-4 py-2 bg-dark-700 text-slate-400 rounded-lg text-sm transition-all hover:text-white">
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {waBots.length === 0 ? (
              <div className="card p-10 text-center">
                <Phone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">لا يوجد رقم واتساب مربوط بعد</p>
              </div>
            ) : waBots.map(bot => (
              <div key={bot.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bot.is_active ? 'bg-green-500/20' : 'bg-dark-700'}`}>
                      <Phone className={`w-4 h-4 ${bot.is_active ? 'text-green-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{bot.phone_number}</p>
                      <p className="text-xs text-slate-400">{bot.chatbot_name || 'بوت غير محدد'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleWABot(bot)}>
                      {bot.is_active
                        ? <ToggleRight className="w-6 h-6 text-green-400" />
                        : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                    </button>
                    <button onClick={() => deleteWABot(bot.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* WA Conversations */}
            {waConvs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-2">آخر المحادثات</h3>
                <div className="space-y-2">
                  {waConvs.map(c => (
                    <div key={c.id} className="card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white">{c.customer_phone}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{c.last_message}</p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">{c.msg_count} رسالة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── الفريق ── */}
        {tab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">أعضاء الفريق ({team.length})</h3>
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة عضو
              </button>
            </div>

            {showInvite && (
              <div className="card p-4 border-blue-500/20">
                <h4 className="text-sm font-bold text-white mb-3">إضافة عضو جديد</h4>
                <div className="space-y-3">
                  <input className="input w-full text-sm" placeholder="البريد الإلكتروني"
                    value={inviteData.email}
                    onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input text-sm"
                      value={inviteData.role}
                      onChange={e => setInviteData(p => ({ ...p, role: e.target.value }))}>
                      <option value="employee">موظف</option>
                      <option value="manager">مدير</option>
                      <option value="viewer">مشاهد</option>
                    </select>
                    <input className="input text-sm" placeholder="القسم (اختياري)"
                      value={inviteData.department}
                      onChange={e => setInviteData(p => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={inviteMember}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
                      إضافة
                    </button>
                    <button onClick={() => setShowInvite(false)}
                      className="px-4 py-2 bg-dark-700 text-slate-400 rounded-lg text-sm transition-all hover:text-white">
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Role Info */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'manager', desc: 'يرى كل شيء ويدير الفريق' },
                { role: 'employee', desc: 'يرفع ملفات ويتابع المحادثات' },
                { role: 'viewer', desc: 'يرى التقارير فقط' },
              ].map(r => {
                const rl = ROLE_LABELS[r.role];
                return (
                  <div key={r.role} className={`p-3 rounded-xl border border-dark-600 bg-dark-700`}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rl.color}`}>{rl.label}</span>
                    <p className="text-xs text-slate-400 mt-1.5">{r.desc}</p>
                  </div>
                );
              })}
            </div>

            {team.length === 0 ? (
              <div className="card p-10 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">لا يوجد أعضاء بعد</p>
              </div>
            ) : team.map(m => {
              const rl = ROLE_LABELS[m.role] || ROLE_LABELS.employee;
              return (
                <div key={m.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-dark-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {m.full_name?.[0] || '؟'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{m.full_name}</p>
                        <p className="text-xs text-slate-400">{m.email} {m.department && `· ${m.department}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rl.color}`}>
                        {rl.label}
                      </span>
                      <button onClick={() => removeMember(m.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── سجل التعديلات ── */}
        {tab === 'audit' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">آخر 100 إجراء في نظامك</p>
            {audit.length === 0 ? (
              <div className="card p-10 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">لا يوجد سجل بعد</p>
              </div>
            ) : audit.map(log => {
              const action = ACTION_LABELS[log.action] || { label: log.action, color: 'text-slate-400', icon: Activity };
              const Icon = action.icon;
              return (
                <div key={log.id} className="card p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-dark-700 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-white font-medium">{log.user_name || 'مستخدم'}</span>
                        <span className={`text-xs ${action.color}`}>{action.label}</span>
                        {log.resource_name && (
                          <span className="text-xs text-slate-400">«{log.resource_name}»</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
