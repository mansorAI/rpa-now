import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Clock, CheckCircle, XCircle, Upload,
  Calendar, Send, ChevronRight, AlertCircle, X, Edit2
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ألوان وأيقونات المنصات
const PLATFORMS = [
  {
    value: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    bg: 'bg-[#FF0000]/10',
    border: 'border-[#FF0000]/30',
    text: 'text-[#FF0000]',
    selected: 'border-[#FF0000] bg-[#FF0000]/20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    types: ['video'],
    note: 'Shorts فقط (أقل من 60 ثانية)',
  },
  {
    value: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    selected: 'border-pink-500 bg-pink-500/20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    types: ['video', 'image'],
    note: 'Reels وصور',
  },
  {
    value: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-200',
    selected: 'border-slate-300 bg-slate-500/20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    types: ['video', 'image', 'text'],
    note: 'تغريدات، صور، فيديو',
  },
  {
    value: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    selected: 'border-blue-500 bg-blue-500/20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    types: ['video', 'image', 'text'],
    note: 'صفحات الفيسبوك',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    bg: 'bg-slate-800/50',
    border: 'border-slate-600/50',
    text: 'text-white',
    selected: 'border-white bg-slate-700/50',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
    types: ['video'],
    note: 'فيديوهات قصيرة',
  },
  {
    value: 'snapchat',
    label: 'Snapchat',
    color: '#FFFC00',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
    selected: 'border-yellow-400 bg-yellow-400/20',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12.065.045C9.225.045 6.605 1.245 4.885 3.425c-1.32 1.68-1.92 3.84-1.92 5.76v.48c-.36.12-.72.12-1.08.12-.48 0-.96-.12-1.44-.24l-.24-.12c-.12 0-.24.12-.24.24 0 .12 0 .36.12.48.24.72.72 1.32 1.32 1.8.12.12.24.12.36.24-.24.6-.6 1.32-1.2 1.8-.12.12-.12.24-.12.36 0 .12.12.24.24.24h.12c.48.12.96.24 1.44.36.72.24 1.44.48 2.04.96.12.12.24.12.36.24.36.36.48.84.6 1.32.12.36.24.72.48.96.24.24.6.36.96.36.36 0 .72-.12 1.08-.12.48-.12 1.08-.24 1.68-.24.48 0 .96.12 1.44.48.36.24.72.6 1.08.84.6.48 1.32.72 2.04.72s1.44-.24 2.04-.72c.36-.24.72-.6 1.08-.84.48-.36.96-.48 1.44-.48.6 0 1.2.12 1.68.24.36.12.72.12 1.08.12.36 0 .72-.12.96-.36.24-.24.36-.6.48-.96.12-.48.24-.96.6-1.32.12-.12.24-.12.36-.24.6-.48 1.32-.72 2.04-.96.48-.12.96-.24 1.44-.36h.12c.12 0 .24-.12.24-.24 0-.12 0-.24-.12-.36-.6-.48-.96-1.2-1.2-1.8.12-.12.24-.12.36-.24.6-.48 1.08-1.08 1.32-1.8.12-.12.12-.36.12-.48 0-.12-.12-.24-.24-.24l-.24.12c-.48.12-.96.24-1.44.24-.36 0-.72 0-1.08-.12v-.48c0-1.92-.6-4.08-1.92-5.76C17.465 1.245 14.845.045 12.065.045z"/>
      </svg>
    ),
    types: ['video', 'image'],
    note: 'Snap Stories',
  },
];

const STATUS_BADGE = {
  scheduled:  { label: 'مجدول',   cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  posted:     { label: 'نُشر',    cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  failed:     { label: 'فشل',     cls: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  publishing: { label: 'ينشر...',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  cancelled:  { label: 'ملغى',    cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
};

// ---- Platform Card ----
const PlatformCard = ({ platform, selected, onClick, small }) => {
  const p = PLATFORMS.find(x => x.value === platform) || PLATFORMS.find(x => x.value === platform);
  if (!p) return null;
  if (small) {
    return (
      <button onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${selected ? p.selected : `${p.bg} ${p.border} ${p.text} opacity-60 hover:opacity-100`}`}>
        <span className={p.text}>{p.svg}</span>
        {p.label}
        {selected && <X className="w-3 h-3 mr-0.5" />}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-105 ${selected ? p.selected + ' shadow-lg' : `${p.bg} ${p.border} opacity-70 hover:opacity-100`}`}>
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}
      <span className={p.text}>{p.svg}</span>
      <span className={`text-xs font-semibold ${selected ? p.text : 'text-slate-300'}`}>{p.label}</span>
    </button>
  );
};

// ---- Connect Account Modal ----
const ConnectModal = ({ platform, onClose, onConnected }) => {
  const p = PLATFORMS.find(x => x.value === platform);
  const [form, setForm] = useState({ account_name: '', account_id: '', credentials: {} });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.account_name.trim()) return toast.error('اسم الحساب مطلوب');
    setLoading(true);
    try {
      await api.post('/social/accounts', { platform, ...form });
      toast.success(`تم ربط حساب ${p?.label}`);
      onConnected(); onClose();
    } catch { toast.error('فشل ربط الحساب'); } finally { setLoading(false); }
  };

  const startOAuth = async () => {
    try {
      const { data } = await api.get(`/social/accounts/${platform}/auth-url`);
      window.open(data.url, '_blank', 'width=600,height=700');
    } catch { toast.error('فشل الحصول على رابط الربط'); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${p?.bg} flex items-center justify-center ${p?.text}`}>
              {p?.svg}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ربط {p?.label}</h3>
              <p className="text-xs text-slate-500">{p?.note}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <button onClick={startOAuth}
            className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all border font-medium
              ${platform === 'twitter' ? 'bg-black border-slate-600 hover:border-slate-400 text-white' : `${p?.bg} ${p?.border} ${p?.text} hover:opacity-100 opacity-80`}`}>
            <span>{p?.svg}</span>
            {platform === 'twitter' ? 'تسجيل الدخول بـ X' : `ربط ${p?.label} عبر OAuth`}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="flex-1 h-px bg-dark-600" /> أو يدوياً <div className="flex-1 h-px bg-dark-600" />
          </div>

          <input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
            className="input text-sm" placeholder="اسم الحساب / القناة" />
          <input value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
            className="input text-sm" placeholder="User ID / Channel ID" dir="ltr" />
          <input type="password" onChange={e => setForm(f => ({ ...f, credentials: { ...f.credentials, access_token: e.target.value } }))}
            className="input text-sm" placeholder="Access Token" dir="ltr" />
          {platform === 'twitter' && (
            <input type="password" onChange={e => setForm(f => ({ ...f, credentials: { ...f.credentials, access_token_secret: e.target.value } }))}
              className="input text-sm" placeholder="Access Token Secret" dir="ltr" />
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center text-sm py-2.5">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'حفظ الحساب'}
            </button>
            <button onClick={onClose} className="btn-ghost text-sm py-2.5">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- New Post Modal ----
const NewPostModal = ({ accounts, onClose, onCreated }) => {
  const fileRef = useRef();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [posts, setPosts] = useState([
    { title: '', description: '', hashtags: '', scheduled_at: '', media_url: '', file: null, preview: null, post_type: 'video' }
  ]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=platforms, 2=content

  const togglePlatform = (val) => {
    setSelectedPlatforms(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev, val]
    );
  };

  const addPost = () => {
    if (posts.length >= 10) return toast.error('الحد الأقصى 10 منشورات');
    setPosts(p => [...p, { title: '', description: '', hashtags: '', scheduled_at: '', media_url: '', file: null, preview: null, post_type: 'video' }]);
  };

  const removePost = (i) => setPosts(p => p.filter((_, idx) => idx !== i));

  const updatePost = (i, key, val) => {
    setPosts(p => p.map((post, idx) => idx === i ? { ...post, [key]: val } : post));
  };

  const handleFile = (i, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const post_type = file.type.startsWith('video') ? 'video' : 'image';
    updatePost(i, 'file', file);
    updatePost(i, 'preview', preview);
    updatePost(i, 'post_type', post_type);
  };

  const submit = async () => {
    if (selectedPlatforms.length === 0) return toast.error('اختر منصة واحدة على الأقل');
    for (let i = 0; i < posts.length; i++) {
      if (!posts[i].scheduled_at) return toast.error(`حدد وقت النشر للمنشور ${i + 1}`);
      if (!posts[i].description && !posts[i].title) return toast.error(`أضف محتوى للمنشور ${i + 1}`);
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const post of posts) {
        for (const platform of selectedPlatforms) {
          const acc = accounts.find(a => a.platform === platform);
          if (!acc) continue;

          const fd = new FormData();
          fd.append('social_account_id', acc.id);
          fd.append('platform', platform);
          const postType = post.file
            ? (post.file.type.startsWith('video') ? 'video' : 'image')
            : (platform === 'twitter' || platform === 'facebook' ? 'text' : 'video');
          fd.append('post_type', postType);
          fd.append('title', post.title || '');
          fd.append('description', post.description || '');
          const tags = post.hashtags.split(/[\s,]+/).filter(Boolean).map(h => h.startsWith('#') ? h : `#${h}`);
          fd.append('hashtags', JSON.stringify(tags));
          fd.append('scheduled_at', new Date(post.scheduled_at).toISOString());
          if (post.file) fd.append('media', post.file);
          else if (post.media_url) fd.append('media_url', post.media_url);

          await api.post('/social/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          successCount++;
        }
      }
      toast.success(`✅ تم جدولة ${successCount} منشور بنجاح`);
      onCreated(); onClose();
    } catch { toast.error('فشل في جدولة بعض المنشورات'); } finally { setLoading(false); }
  };

  const connectedPlatforms = [...new Set(accounts.map(a => a.platform))];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <div>
            <h3 className="font-bold text-white text-lg">جدولة منشور جديد</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 1 ? 'اختر المنصات للنشر عليها' : `${selectedPlatforms.length} منصة · ${posts.length} منشور`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-dark-700 rounded-lg transition-all"><X className="w-5 h-5" /></button>
        </div>

        {/* Step 1 — Platform Selection */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm text-slate-300 mb-3 font-medium">اختر المنصات (يمكن اختيار أكثر من واحدة)</p>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORMS.map(p => {
                  const isConnected = connectedPlatforms.includes(p.value);
                  return (
                    <div key={p.value} className="relative">
                      <PlatformCard
                        platform={p.value}
                        selected={selectedPlatforms.includes(p.value)}
                        onClick={() => isConnected ? togglePlatform(p.value) : toast.error(`اربط حساب ${p.label} أولاً`)}
                      />
                      {!isConnected && (
                        <div className="absolute inset-0 flex items-end justify-center pb-1.5 rounded-2xl bg-dark-900/60">
                          <span className="text-xs text-slate-500">غير مربوط</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedPlatforms.length > 0 && (
              <div className="p-3 bg-dark-700 rounded-xl flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">سيُنشر على:</span>
                {selectedPlatforms.map(p => (
                  <PlatformCard key={p} platform={p} selected small onClick={() => togglePlatform(p)} />
                ))}
              </div>
            )}

            <button
              onClick={() => { if (selectedPlatforms.length === 0) return toast.error('اختر منصة واحدة على الأقل'); setStep(2); }}
              className="btn-primary w-full justify-center"
            >
              التالي — إضافة المحتوى <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Posts Content */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            {/* Selected platforms pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">المنصات:</span>
              {selectedPlatforms.map(p => (
                <PlatformCard key={p} platform={p} selected small onClick={() => {}} />
              ))}
              <button onClick={() => setStep(1)} className="text-xs text-primary-400 hover:underline mr-1">تعديل</button>
            </div>

            {/* Posts list */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pl-1">
              {posts.map((post, i) => (
                <div key={i} className="p-4 bg-dark-700 rounded-2xl border border-dark-600 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">منشور {i + 1}</span>
                    {posts.length > 1 && (
                      <button onClick={() => removePost(i)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Media */}
                  <div>
                    {post.preview ? (
                      <div className="relative rounded-xl overflow-hidden h-32 bg-dark-800">
                        {post.post_type === 'video'
                          ? <video src={post.preview} className="w-full h-full object-cover" />
                          : <img src={post.preview} className="w-full h-full object-cover" alt="" />}
                        <button onClick={() => { updatePost(i,'file',null); updatePost(i,'preview',null); }}
                          className="absolute top-2 left-2 p-1 bg-dark-900/80 hover:bg-red-500 rounded-full transition-all">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <span className="absolute bottom-2 right-2 text-xs bg-dark-900/80 text-white px-2 py-0.5 rounded-full">
                          {post.post_type === 'video' ? '🎬' : '🖼️'} {post.file?.name?.substring(0,20)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { const el = document.getElementById(`file-${i}`); el?.click(); }}
                          className="flex-1 h-24 border-2 border-dashed border-dark-500 hover:border-primary-500/50 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-slate-300 transition-all text-xs">
                          <Upload className="w-5 h-5" />
                          رفع فيديو / صورة
                        </button>
                        <input id={`file-${i}`} type="file" accept="video/*,image/*" className="hidden"
                          onChange={e => handleFile(i, e.target.files[0])} />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <span className="text-xs text-slate-500">أو رابط:</span>
                          <input value={post.media_url} onChange={e => updatePost(i,'media_url',e.target.value)}
                            className="input text-xs py-2" placeholder="https://..." dir="ltr" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <input value={post.title} onChange={e => updatePost(i,'title',e.target.value)}
                    className="input text-sm" placeholder="العنوان (اختياري)" />

                  {/* Description */}
                  <textarea value={post.description} onChange={e => updatePost(i,'description',e.target.value)}
                    rows={2} className="input text-sm resize-none" placeholder="نص المنشور / الوصف *" />

                  {/* Hashtags */}
                  <input value={post.hashtags} onChange={e => updatePost(i,'hashtags',e.target.value)}
                    className="input text-sm" placeholder="#هاشتاق1 #هاشتاق2 #هاشتاق3" dir="ltr" />

                  {/* Schedule */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input type="datetime-local" value={post.scheduled_at}
                      onChange={e => updatePost(i,'scheduled_at',e.target.value)}
                      className="input text-sm flex-1" min={new Date().toISOString().slice(0,16)} dir="ltr" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add more */}
            <button onClick={addPost}
              className="w-full py-3 border-2 border-dashed border-dark-600 hover:border-primary-500/40 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> إضافة منشور آخر ({posts.length}/10)
            </button>

            {/* Summary */}
            <div className="p-3 bg-dark-700 rounded-xl text-xs text-slate-400">
              سيتم إنشاء <span className="text-white font-bold">{posts.length * selectedPlatforms.length}</span> منشور
              ({posts.length} منشور &times; {selectedPlatforms.length} منصة)
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost text-sm py-3 px-4">رجوع</button>
              <button onClick={submit} disabled={loading} className="btn-primary flex-1 justify-center text-sm py-3">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" /> جدولة {posts.length * selectedPlatforms.length} منشور</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Main Page ----
export default function SocialScheduler() {
  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [filterPlatform, setFilterPlatform] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/social/accounts'),
      api.get(`/social/posts${filterPlatform ? `?platform=${filterPlatform}` : ''}`),
      api.get('/social/stats'),
    ]).then(([a, p, s]) => {
      setAccounts(a.data.accounts || []);
      setPosts(p.data.posts || []);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [filterPlatform]);

  // Handle OAuth redirect (?connected=platform or ?error=platform)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) {
      const p = PLATFORMS.find(x => x.value === connected);
      toast.success(`تم ربط ${p?.label || connected} بنجاح!`);
      load();
    }
    if (error) toast.error(`فشل ربط الحساب: ${error}`);
    if (connected || error) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const deletePost = async (id) => {
    if (!confirm('حذف هذا المنشور؟')) return;
    await api.delete(`/social/posts/${id}`);
    toast.success('تم الحذف');
    load();
  };

  const retryPost = async (id) => {
    try {
      await api.put(`/social/posts/${id}`, { status: 'scheduled', scheduled_at: new Date(Date.now() + 60000).toISOString() });
      toast.success('سيُعاد النشر خلال دقيقة');
      load();
    } catch { toast.error('فشلت إعادة المحاولة'); }
  };

  const connectedPlatforms = [...new Set(accounts.map(a => a.platform))];
  const filteredPosts = posts.filter(p => activeTab === 'all' || p.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">جدولة مواقع التواصل</h1>
          <p className="text-slate-400 text-sm mt-0.5">ارفع وجدول محتواك على كل المنصات تلقائياً</p>
        </div>
        <button
          onClick={() => accounts.length === 0 ? toast.error('اربط حساباً من الأسفل أولاً') : setShowNewPost(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> جدولة منشور
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'الإجمالي',  v: stats.total,     c: 'text-white' },
            { l: 'مجدول',    v: stats.scheduled, c: 'text-blue-400' },
            { l: 'نُشر',      v: stats.posted,    c: 'text-emerald-400' },
            { l: 'فشل',      v: stats.failed,    c: 'text-red-400' },
          ].map(s => (
            <div key={s.l} className="card py-4">
              <p className="text-slate-400 text-xs">{s.l}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Platform Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300">الحسابات المربوطة</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PLATFORMS.map(p => {
            const acc = accounts.find(a => a.platform === p.value);
            return (
              <div key={p.value}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer
                  ${acc ? `${p.selected} shadow-md` : `${p.bg} ${p.border} opacity-50 hover:opacity-80`}`}
                onClick={() => !acc && setShowConnect(p.value)}
              >
                <span className={p.text}>{p.svg}</span>
                <span className="text-xs font-medium text-slate-200">{p.label}</span>
                {acc ? (
                  <span className="text-xs text-emerald-400 truncate max-w-full px-1">✓ {acc.account_name}</span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" />ربط</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Posts */}
      <div>
        {/* Tabs + Filter */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-600">
            {[['scheduled','مجدول'],['posted','نُشر'],['failed','فشل'],['all','الكل']].map(([v,l]) => (
              <button key={v} onClick={() => setActiveTab(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === v ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {PLATFORMS.map(p => (
              <button key={p.value} onClick={() => setFilterPlatform(prev => prev === p.value ? '' : p.value)}
                className={`p-2 rounded-lg border transition-all ${filterPlatform === p.value ? `${p.selected}` : `${p.bg} ${p.border} opacity-50 hover:opacity-80`}`}
                title={p.label}>
                <span className={p.text + ' block w-4 h-4'}>{p.svg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="card py-16 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">
              {accounts.length === 0 ? 'اربط حساباً أولاً للبدء' : 'لا توجد منشورات في هذه الفئة'}
            </p>
            {accounts.length > 0 && (
              <button onClick={() => setShowNewPost(true)} className="btn-primary inline-flex mt-4 text-sm">
                <Plus className="w-4 h-4" /> جدولة أول منشور
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map(post => {
              const st = STATUS_BADGE[post.status] || STATUS_BADGE.scheduled;
              const plt = PLATFORMS.find(p => p.value === post.platform);
              return (
                <div key={post.id} className="card hover:border-dark-500 transition-all">
                  <div className="flex items-center gap-4">
                    {/* Platform icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${plt?.bg}`}>
                      <span className={plt?.text}>{plt?.svg}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        <span className="text-xs text-slate-500 capitalize">{post.post_type}</span>
                        {post.account_name && <span className="text-xs text-slate-500">· {post.account_name}</span>}
                      </div>
                      <p className="text-sm font-medium text-white mt-1 truncate">
                        {post.title || post.description || 'بدون عنوان'}
                      </p>
                      {post.hashtags?.length > 0 && (
                        <p className="text-xs text-primary-400 truncate mt-0.5">{post.hashtags.join(' ')}</p>
                      )}
                      {post.error_message && (
                        <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {post.error_message}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.scheduled_at).toLocaleDateString('ar-SA')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(post.scheduled_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {post.status === 'scheduled' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditPost(post)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="تعديل">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deletePost(post.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {post.status === 'posted' && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      {post.status === 'failed' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => retryPost(post.id)}
                            className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all" title="إعادة محاولة">
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => deletePost(post.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showConnect && (
        <ConnectModal platform={showConnect} onClose={() => setShowConnect(null)} onConnected={load} />
      )}
      {showNewPost && (
        <NewPostModal accounts={accounts} onClose={() => setShowNewPost(false)} onCreated={load} />
      )}
      {editPost && (
        <EditPostModal post={editPost} onClose={() => setEditPost(null)} onSaved={load} />
      )}
    </div>
  );
}

// ---- Edit Post Modal ----
function EditPostModal({ post, onClose, onSaved }) {
  const toLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = useState({
    title: post.title || '',
    description: post.description || '',
    hashtags: post.hashtags?.join(' ') || '',
    scheduled_at: toLocal(post.scheduled_at),
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.scheduled_at) return toast.error('حدد وقت النشر');
    setLoading(true);
    try {
      const tags = form.hashtags.split(/[\s,]+/).filter(Boolean).map(h => h.startsWith('#') ? h : `#${h}`);
      await api.put(`/social/posts/${post.id}`, {
        title: form.title,
        description: form.description,
        hashtags: tags,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });
      toast.success('تم تحديث المنشور');
      onSaved(); onClose();
    } catch { toast.error('فشل التحديث'); } finally { setLoading(false); }
  };

  const plt = PLATFORMS.find(p => p.value === post.platform);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${plt?.bg} flex items-center justify-center ${plt?.text}`}>{plt?.svg}</div>
            <h3 className="font-bold text-white">تعديل المنشور</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
          className="input text-sm" placeholder="العنوان" />
        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
          className="input text-sm resize-none h-24" placeholder="الوصف / النص" />
        <input value={form.hashtags} onChange={e => setForm(f => ({...f, hashtags: e.target.value}))}
          className="input text-sm" placeholder="هاشتاقات (مفصولة بمسافة)" />
        <div>
          <label className="text-xs text-slate-400 mb-1 block">وقت النشر</label>
          <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))}
            className="input text-sm" />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center text-sm py-2.5">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'حفظ التعديلات'}
          </button>
          <button onClick={onClose} className="btn-ghost text-sm py-2.5">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
