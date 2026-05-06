import { useState, useEffect } from 'react';
import { Bot, Play, Plus, Zap, BarChart3, FileText, Clock, CheckCircle, XCircle, Loader, Sparkles, ChevronRight, AlertTriangle, TrendingUp, Timer, Cpu } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
  { id: 'ai-builder', label: 'بناء بالذكاء الاصطناعي', icon: Sparkles },
  { id: 'workflows', label: 'سير العمل', icon: Cpu },
  { id: 'active-runs', label: 'التشغيل المباشر', icon: Play },
  { id: 'templates', label: 'القوالب', icon: FileText },
  { id: 'suggestions', label: 'اقتراحات الذكاء الاصطناعي', icon: Zap },
  { id: 'logs', label: 'السجلات', icon: Clock },
];

const NODE_COLORS = {
  trigger: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  condition: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  action: 'bg-green-500/20 text-green-400 border-green-500/30',
  ai_action: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delay: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  approval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  notification: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export default function RPABusiness() {
  const [tab, setTab] = useState('dashboard');
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBuilding, setAiBuilding] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);

  useEffect(() => { loadTab(tab); }, [tab]);

  async function loadTab(t) {
    setLoading(true);
    try {
      if (t === 'dashboard') {
        const [wf, an] = await Promise.all([api.get('/rpa/workflows'), api.get('/rpa/analytics')]);
        setWorkflows(wf.data);
        setAnalytics(an.data);
      } else if (t === 'workflows') {
        const r = await api.get('/rpa/workflows');
        setWorkflows(r.data);
      } else if (t === 'active-runs') {
        const r = await api.get('/rpa/executions?status=running');
        setExecutions(r.data);
      } else if (t === 'logs') {
        const r = await api.get('/rpa/executions');
        setExecutions(r.data);
      } else if (t === 'templates') {
        const r = await api.get('/rpa/templates');
        setTemplates(r.data);
      } else if (t === 'suggestions') {
        const r = await api.get('/rpa/ai/suggestions');
        setSuggestions(r.data);
      }
    } catch {}
    setLoading(false);
  }

  async function runWorkflow(id) {
    try {
      await api.post(`/rpa/workflows/${id}/run`, {});
      toast.success('Workflow started!');
      loadTab('active-runs');
      setTab('active-runs');
    } catch {}
  }

  async function toggleStatus(wf) {
    const newStatus = wf.status === 'active' ? 'paused' : 'active';
    await api.put(`/rpa/workflows/${wf.id}`, { status: newStatus });
    loadTab('workflows');
  }

  async function deleteWorkflow(id) {
    if (!confirm('Delete this workflow?')) return;
    await api.delete(`/rpa/workflows/${id}`);
    loadTab('workflows');
    toast.success('Deleted');
  }

  async function buildWithAI() {
    if (!aiText.trim()) return toast.error('Describe your workflow first');
    setAiBuilding(true);
    try {
      const r = await api.post('/rpa/ai/generate', { description: aiText });
      toast.success(`Workflow "${r.data.name}" created!`);
      setAiText('');
      setTab('workflows');
    } catch {}
    setAiBuilding(false);
  }

  async function useTemplate(id) {
    try {
      const r = await api.post(`/rpa/templates/${id}/use`);
      toast.success(`Workflow "${r.data.name}" created from template!`);
      setTab('workflows');
    } catch {}
  }

  async function dismissSuggestion(id) {
    await api.put(`/rpa/ai/suggestions/${id}`, { status: 'dismissed' });
    setSuggestions(s => s.filter(x => x.id !== id));
  }

  async function acceptSuggestion(s) {
    setAiText(s.description);
    await api.put(`/rpa/ai/suggestions/${s.id}`, { status: 'accepted' });
    setSuggestions(prev => prev.filter(x => x.id !== s.id));
    setTab('ai-builder');
  }

  async function viewExecution(id) {
    try {
      const r = await api.get(`/rpa/executions/${id}`);
      setSelectedExecution(r.data);
    } catch {}
  }

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (s === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
    if (s === 'running') return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">RPA Business</h1>
          <p className="text-xs text-slate-400">أتمتة العمليات التجارية بالذكاء الاصطناعي</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${tab === t.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Workflows', value: analytics.total_workflows, icon: Cpu, color: 'text-violet-400' },
                  { label: 'Total Runs', value: analytics.total_runs, icon: Play, color: 'text-blue-400' },
                  { label: 'Success Rate', value: `${analytics.success_rate}%`, icon: TrendingUp, color: 'text-green-400' },
                  { label: 'Hours Saved', value: analytics.time_saved_hours, icon: Timer, color: 'text-yellow-400' },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="card p-4">
                      <Icon className={`w-5 h-5 ${c.color} mb-2`} />
                      <div className="text-2xl font-bold text-white">{c.value}</div>
                      <div className="text-xs text-slate-400">{c.label}</div>
                    </div>
                  );
                })}
              </div>

              {analytics.top_workflows?.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Top Workflows</h3>
                  <div className="space-y-2">
                    {analytics.top_workflows.map(w => (
                      <div key={w.name} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 truncate">{w.name}</span>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="text-green-400">{w.success_count} ✓</span>
                          <span className="text-red-400">{w.fail_count} ✗</span>
                          <span>{w.run_count} runs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Workflows</h3>
                <div className="space-y-2">
                  {workflows.slice(0, 5).map(w => (
                    <div key={w.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{w.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${w.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            w.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'}`}>
                          {w.status}
                        </span>
                        <button onClick={() => runWorkflow(w.id)}
                          className="p-1 hover:text-violet-400 text-slate-500">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── AI BUILDER ── */}
          {tab === 'ai-builder' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h2 className="text-base font-semibold text-white">AI Workflow Generator</h2>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Describe your business process in plain language and AI will build the workflow automatically.
                </p>
                <textarea
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  rows={5}
                  placeholder="Example: When an employee submits a leave request, check if they have enough balance, if yes approve it and send notification, otherwise reject and notify HR manager..."
                  className="input w-full resize-none mb-4"
                />
                <button onClick={buildWithAI} disabled={aiBuilding}
                  className="btn-primary flex items-center gap-2">
                  {aiBuilding ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiBuilding ? 'Building Workflow...' : 'Build with AI'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Invoice Approval', desc: 'Auto-approve invoices under threshold, escalate others' },
                  { title: 'Employee Onboarding', desc: 'Automate new hire setup: accounts, notifications, tasks' },
                  { title: 'Report Generation', desc: 'Schedule weekly reports and distribute to managers' },
                ].map(ex => (
                  <button key={ex.title} onClick={() => setAiText(ex.desc)}
                    className="card p-4 text-left hover:border-violet-500/50 transition-colors">
                    <div className="text-sm font-medium text-white mb-1">{ex.title}</div>
                    <div className="text-xs text-slate-400">{ex.desc}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-violet-400">
                      Use as prompt <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── WORKFLOWS ── */}
          {tab === 'workflows' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{workflows.length} workflows</span>
                <button onClick={() => setTab('ai-builder')} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> New Workflow
                </button>
              </div>
              {workflows.length === 0 ? (
                <div className="card p-12 text-center">
                  <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No workflows yet. Create one with AI Builder.</p>
                </div>
              ) : workflows.map(w => (
                <div key={w.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{w.name}</h3>
                        {w.ai_generated && (
                          <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">AI</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2 truncate">{w.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{w.run_count} runs</span>
                        <span className="text-green-400">{w.success_count} ✓</span>
                        <span className="text-red-400">{w.fail_count} ✗</span>
                        <span>{w.nodes?.length || 0} steps</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${w.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          w.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'}`}>
                        {w.status}
                      </span>
                      <button onClick={() => runWorkflow(w.id)} title="Run"
                        className="p-1.5 rounded-lg hover:bg-violet-500/20 text-slate-400 hover:text-violet-400">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(w)} title="Toggle"
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
                        {w.status === 'active' ? '⏸' : '▶'}
                      </button>
                      <button onClick={() => deleteWorkflow(w.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {w.nodes?.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 flex-wrap">
                      {w.nodes.map((n, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${NODE_COLORS[n.type] || NODE_COLORS.action}`}>
                          {n.data?.label || n.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── ACTIVE RUNS ── */}
          {tab === 'active-runs' && (
            <div className="space-y-3">
              {executions.length === 0 ? (
                <div className="card p-12 text-center">
                  <Play className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No active runs at the moment.</p>
                </div>
              ) : executions.map(e => (
                <div key={e.id} className="card p-4 cursor-pointer hover:border-violet-500/30"
                  onClick={() => viewExecution(e.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(e.status)}
                      <span className="text-sm font-medium text-white">{e.workflow_name}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(e.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Triggered: {e.triggered_by}</span>
                    {e.duration_ms && <span>{(e.duration_ms / 1000).toFixed(1)}s</span>}
                  </div>
                  {e.error_message && (
                    <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">{e.error_message}</div>
                  )}
                  {e.ai_diagnosis && (
                    <div className="mt-2 text-xs text-violet-400 bg-violet-500/10 rounded p-2">
                      🤖 {e.ai_diagnosis}
                    </div>
                  )}
                </div>
              ))}

              {selectedExecution && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedExecution(null)}>
                  <div className="bg-dark-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-white mb-4">Execution Timeline</h3>
                    <div className="space-y-2">
                      {selectedExecution.steps?.map(step => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className="mt-0.5">{statusIcon(step.status)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-white">{step.node_name}</span>
                              <span className="text-xs text-slate-500">{step.actor}</span>
                            </div>
                            {step.duration_ms && (
                              <span className="text-xs text-slate-500">{step.duration_ms}ms</span>
                            )}
                            {step.error_message && (
                              <div className="text-xs text-red-400 mt-1">{step.error_message}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelectedExecution(null)}
                      className="btn-primary w-full mt-4 justify-center">Close</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TEMPLATES ── */}
          {tab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.length === 0 ? (
                <div className="card p-12 text-center col-span-2">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No templates available yet.</p>
                </div>
              ) : templates.map(t => (
                <div key={t.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-white">{t.name}</h3>
                      <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{t.category}</span>
                    </div>
                    <span className="text-xs text-slate-500">{t.use_count} uses</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{t.description}</p>
                  <button onClick={() => useTemplate(t.id)} className="btn-primary text-sm w-full justify-center">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── AI SUGGESTIONS ── */}
          {tab === 'suggestions' && (
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="card p-12 text-center">
                  <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-3">No suggestions yet. Run some workflows first.</p>
                </div>
              ) : suggestions.map(s => (
                <div key={s.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white mb-1">{s.title}</h3>
                      <p className="text-xs text-slate-400 mb-3">{s.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => acceptSuggestion(s)}
                          className="btn-primary text-xs py-1.5">
                          Build Automation
                        </button>
                        <button onClick={() => dismissSuggestion(s.id)}
                          className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LOGS ── */}
          {tab === 'logs' && (
            <div className="space-y-2">
              {executions.length === 0 ? (
                <div className="card p-12 text-center">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No execution logs yet.</p>
                </div>
              ) : executions.map(e => (
                <div key={e.id} className="card p-3 cursor-pointer hover:border-slate-600"
                  onClick={() => { viewExecution(e.id); setTab('active-runs'); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(e.status)}
                      <span className="text-sm text-white">{e.workflow_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {e.duration_ms && <span>{(e.duration_ms / 1000).toFixed(1)}s</span>}
                      <span>{new Date(e.started_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
