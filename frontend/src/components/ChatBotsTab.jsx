import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Upload, Trash2, Send, Bot, FileText, X, CheckCircle, Settings, Eye, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = [
  { value: 'spare_parts', label: 'قطع الغيار', emoji: '🔧' },
  { value: 'clinic', label: 'عيادة / مستشفى', emoji: '🏥' },
  { value: 'restaurant', label: 'مطعم / كافيه', emoji: '🍽️' },
  { value: 'real_estate', label: 'عقارات', emoji: '🏠' },
  { value: 'general', label: 'عام', emoji: '💬' },
  { value: 'custom', label: 'مخصص', emoji: '⚙️' },
];

export default function ChatBotsTab() {
  const [view, setView] = useState('list'); // list | create | manage | test
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualName, setManualName] = useState('');

  // Chat test
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Create form
  const [form, setForm] = useState({
    name: '', business_type: 'general', description: '',
    greeting: 'مرحباً! كيف يمكنني مساعدتك؟',
    personality: 'مساعد ذكي ومهذب يجيب بدقة', allow_appointments: false,
  });

  useEffect(() => { loadBots(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadBots() {
    setLoading(true);
    try { const r = await api.get('/chatbots'); setBots(r.data); } catch {}
    setLoading(false);
  }

  async function createBot() {
    if (!form.name.trim()) return toast.error('أدخل اسم البوت');
    try {
      const r = await api.post('/chatbots', form);
      toast.success('تم إنشاء البوت!');
      setBots(prev => [r.data, ...prev]);
      openManage(r.data);
    } catch {}
  }

  async function deleteBot(id) {
    if (!confirm('حذف البوت؟')) return;
    await api.delete(`/chatbots/${id}`);
    setBots(prev => prev.filter(b => b.id !== id));
    if (selectedBot?.id === id) setView('list');
    toast.success('تم الحذف');
  }

  async function openManage(bot) {
    setSelectedBot(bot);
    setView('manage');
    const [k, c] = await Promise.all([
      api.get(`/chatbots/${bot.id}/knowledge`),
      api.get(`/chatbots/${bot.id}/conversations`),
    ]);
    setKnowledge(k.data);
    setConversations(c.data);
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('chatbot_id', selectedBot.id);
    try {
      const r = await api.post('/chatbots/knowledge/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`تم رفع ${file.name} — ${r.data.chunks_added} قطعة بيانات`);
      const k = await api.get(`/chatbots/${selectedBot.id}/knowledge`);
      setKnowledge(k.data);
    } catch {}
    setUploading(false);
    e.target.value = '';
  }

  async function addManual() {
    if (!manualText.trim()) return toast.error('أدخل النص');
    try {
      await api.post('/chatbots/knowledge/manual', {
        chatbot_id: selectedBot.id, text: manualText, source_name: manualName || 'إدخال يدوي',
      });
      toast.success('تمت الإضافة');
      setManualText(''); setManualName('');
      const k = await api.get(`/chatbots/${selectedBot.id}/knowledge`);
      setKnowledge(k.data);
    } catch {}
  }

  async function deleteKnowledge(source) {
    await api.delete(`/chatbots/${selectedBot.id}/knowledge?source=${encodeURIComponent(source)}`);
    setKnowledge(prev => prev.filter(k => k.source_name !== source));
    toast.success('تم الحذف');
  }

  async function startTest() {
    setView('test');
    setMessages([]);
    setConvId(null);
    try {
      const r = await api.post('/chatbots/conversations/start', { chatbot_id: selectedBot.id });
      setConvId(r.data.conversation.id);
      setMessages([{ role: 'assistant', content: r.data.greeting }]);
    } catch {}
  }

  async function sendTestMessage() {
    if (!inputMsg.trim() || !convId) return;
    const msg = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setSending(true);
    try {
      const r = await api.post(`/chatbots/conversations/${convId}/message`, { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'حدث خطأ، حاول مرة أخرى' }]);
    }
    setSending(false);
  }

  const sourceIcon = (type) => {
    if (type === 'excel' || type === 'csv') return '📊';
    if (type === 'pdf') return '📄';
    if (type === 'manual') return '✏️';
    return '📁';
  };

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-white">بوتات المحادثة</h2>
          <p className="text-xs text-slate-400">أنشئ بوتاً ذكياً يجيب عملاءك بناءً على بياناتك</p>
        </div>
        <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> إنشاء بوت
        </button>
      </div>

      {bots.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">لا يوجد بوتات بعد</h3>
          <p className="text-slate-400 text-sm mb-4">أنشئ بوتك الأول وارفع بياناتك لتبدأ الإجابة على عملاءك تلقائياً</p>
          <button onClick={() => setView('create')} className="btn-primary mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> إنشاء أول بوت
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map(bot => {
            const bt = BUSINESS_TYPES.find(t => t.value === bot.business_type);
            return (
              <div key={bot.id} className="card p-4 hover:border-violet-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-xl">
                      {bt?.emoji || '💬'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{bot.name}</h3>
                      <span className="text-xs text-slate-400">{bt?.label || bot.business_type}</span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-1 ${bot.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span>📚 {bot.knowledge_count} مصدر</span>
                  <span>💬 {bot.message_count} رسالة</span>
                  <span>👥 {bot.conversation_count} محادثة</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openManage(bot)} className="btn-primary text-xs flex-1 justify-center flex items-center gap-1">
                    <Settings className="w-3 h-3" /> إدارة
                  </button>
                  <button onClick={() => { setSelectedBot(bot); startTest(); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> اختبار
                  </button>
                  <button onClick={() => deleteBot(bot.id)}
                    className="text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── CREATE VIEW ──
  if (view === 'create') return (
    <div className="space-y-4 max-w-xl" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-white">إنشاء بوت جديد</h2>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">اسم البوت *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="مثال: بوت قطع الغيار" className="input w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">نوع العمل *</label>
          <div className="grid grid-cols-3 gap-2">
            {BUSINESS_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(p => ({ ...p, business_type: t.value }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.business_type === t.value
                    ? 'border-violet-500 bg-violet-500/20 text-white'
                    : 'border-dark-600 text-slate-400 hover:border-slate-500'
                }`}>
                <div className="text-xl mb-1">{t.emoji}</div>
                <div className="text-xs">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">رسالة الترحيب</label>
          <input value={form.greeting} onChange={e => setForm(p => ({ ...p, greeting: e.target.value }))}
            className="input w-full" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">شخصية البوت</label>
          <input value={form.personality} onChange={e => setForm(p => ({ ...p, personality: e.target.value }))}
            placeholder="مثال: مساعد ودود ومحترف" className="input w-full" />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.allow_appointments}
              onChange={e => setForm(p => ({ ...p, allow_appointments: e.target.checked }))}
              className="sr-only peer" />
            <div className="w-10 h-5 bg-dark-600 peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
          <span className="text-sm text-slate-300">تفعيل حجز المواعيد</span>
        </div>

        <button onClick={createBot} className="btn-primary w-full justify-center">
          إنشاء البوت والانتقال للإعداد
        </button>
      </div>
    </div>
  );

  // ── MANAGE VIEW ──
  if (view === 'manage' && selectedBot) return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-white">{selectedBot.name}</h2>
        <button onClick={startTest}
          className="mr-auto text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 flex items-center gap-1">
          <Eye className="w-3 h-3" /> اختبار البوت
        </button>
      </div>

      {/* Upload Files */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-1">📁 رفع البيانات</h3>
        <p className="text-xs text-slate-400 mb-3">ارفع ملفاتك وسيتعلم البوت منها تلقائياً</p>
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs text-slate-400">
          {[['📊 Excel / CSV', 'قوائم المنتجات، الأسعار، المواعيد'],
            ['📄 PDF', 'الكتالوجات، السياسات، الوثائق'],
            ['📝 TXT / JSON', 'النصوص، الأسئلة الشائعة'],
            ['✏️ إدخال يدوي', 'معلومات مباشرة بدون ملف']
          ].map(([t, d]) => (
            <div key={t} className="bg-dark-700 rounded-lg p-2.5">
              <div className="font-medium text-slate-300 mb-0.5">{t}</div>
              <div>{d}</div>
            </div>
          ))}
        </div>

        <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-dark-500 rounded-xl cursor-pointer hover:border-violet-500/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload className="w-5 h-5 text-violet-400" />
          <span className="text-sm text-slate-300">{uploading ? 'جارٍ الرفع والمعالجة...' : 'اضغط لرفع ملف'}</span>
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv,.pdf,.txt,.json" onChange={uploadFile} />
        </label>
      </div>

      {/* Manual input */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-3">✏️ إضافة معلومات يدوياً</h3>
        <input value={manualName} onChange={e => setManualName(e.target.value)}
          placeholder="اسم المصدر (مثال: ساعات العمل)" className="input w-full mb-2 text-sm" />
        <textarea value={manualText} onChange={e => setManualText(e.target.value)}
          rows={3} placeholder="أدخل المعلومات هنا مثل: نعمل من 8 صباحاً حتى 10 مساءً، الإجازة يوم الجمعة..."
          className="input w-full resize-none mb-2 text-sm" />
        <button onClick={addManual} className="btn-primary text-sm">إضافة</button>
      </div>

      {/* Knowledge sources */}
      {knowledge.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">مصادر البيانات ({knowledge.length})</h3>
          <div className="space-y-2">
            {knowledge.map(k => (
              <div key={k.source_name} className="flex items-center justify-between bg-dark-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{sourceIcon(k.source_type)}</span>
                  <div>
                    <div className="text-sm text-white">{k.source_name}</div>
                    <div className="text-xs text-slate-500">{k.chunks} قطعة بيانات</div>
                  </div>
                </div>
                <button onClick={() => deleteKnowledge(k.source_name)}
                  className="p-1 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      {conversations.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">آخر المحادثات</h3>
          <div className="space-y-2">
            {conversations.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm bg-dark-700 rounded-lg p-2.5">
                <div>
                  <span className="text-white">{c.customer_name}</span>
                  <span className="text-xs text-slate-500 mr-2">{c.message_count} رسالة</span>
                </div>
                <span className="text-xs text-slate-500 truncate max-w-[150px]">{c.last_message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhook info */}
      <div className="card p-4 border-violet-500/20">
        <h3 className="text-sm font-semibold text-white mb-2">🔗 رابط الـ API العام</h3>
        <p className="text-xs text-slate-400 mb-2">استخدم هذا الرابط لربط البوت بموقعك أو واتساب</p>
        <div className="bg-dark-700 rounded-lg p-2 text-xs text-violet-300 font-mono break-all" dir="ltr">
          POST /api/chatbots/public/{selectedBot.id}
        </div>
        <div className="text-xs text-slate-500 mt-1" dir="ltr">Body: {"{ message, conversation_id?, customer_name? }"}</div>
      </div>
    </div>
  );

  // ── TEST VIEW ──
  if (view === 'test') return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setView('manage')} className="text-slate-400 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center text-base">
          {BUSINESS_TYPES.find(t => t.value === selectedBot?.business_type)?.emoji || '💬'}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{selectedBot?.name}</h2>
          <p className="text-xs text-slate-400">اختبر البوت مباشرة</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-dark-700 text-white rounded-tr-sm'
                : 'bg-violet-600 text-white rounded-tl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-end">
            <div className="bg-violet-600/50 rounded-2xl px-4 py-2.5 text-sm text-white rounded-tl-sm">
              <span className="animate-pulse">جارٍ الكتابة...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input value={inputMsg} onChange={e => setInputMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendTestMessage()}
          placeholder="اكتب رسالتك..." className="input flex-1 text-sm" />
        <button onClick={sendTestMessage} disabled={sending || !inputMsg.trim()}
          className="btn-primary px-4">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return null;
}
