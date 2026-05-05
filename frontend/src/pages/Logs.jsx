import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

const STATUS_MAP = {
  success: { label: 'نجح',    class: 'badge-success', icon: CheckCircle },
  failed:  { label: 'فشل',    class: 'badge-error',   icon: XCircle },
  running: { label: 'يعمل',   class: 'badge-warning', icon: Clock },
  skipped: { label: 'تخطى',   class: 'badge-info',    icon: Clock },
};

const LogRow = ({ log }) => {
  const [open, setOpen] = useState(false);
  const s = STATUS_MAP[log.status] || STATUS_MAP.failed;
  const Icon = s.icon;

  return (
    <div className="border-b border-dark-700 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-all text-right"
      >
        <div className="flex items-center gap-4">
          <span className={s.class}><Icon className="w-3 h-3" />{s.label}</span>
          <div>
            <p className="text-sm font-medium text-white">{log.automation_name}</p>
            <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('ar')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{log.execution_time_ms}ms</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {log.error_message && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 font-mono">{log.error_message}</p>
            </div>
          )}
          {log.ai_analysis && Object.keys(log.ai_analysis).length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">تحليل AI:</p>
              <pre className="text-xs text-slate-300 bg-dark-700 p-3 rounded-lg overflow-auto font-mono">
                {JSON.stringify(log.ai_analysis, null, 2)}
              </pre>
            </div>
          )}
          {log.actions_executed?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">الإجراءات المنفذة:</p>
              <div className="space-y-1">
                {log.actions_executed.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {a.type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    api.get(`/automations/logs?page=${p}&limit=20`).then(({ data }) => {
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = filter ? logs.filter(l => l.status === filter) : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">سجلات التشغيل</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} سجل إجمالاً</p>
        </div>
        <div className="flex gap-2">
          {['', 'success', 'failed', 'skipped'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
              {s === '' ? 'الكل' : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">لا توجد سجلات</div>
        ) : (
          filtered.map(log => <LogRow key={log.id} log={log} />)
        )}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm py-2 px-3">السابق</button>
          <span className="text-slate-400 text-sm py-2">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="btn-ghost text-sm py-2 px-3">التالي</button>
        </div>
      )}
    </div>
  );
}
