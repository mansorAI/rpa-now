import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Zap, Plug, CreditCard, FileText, LogOut, Bot, CalendarClock, Cpu,
  Building2, Activity, Sparkles,
} from 'lucide-react';

const nav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/onboarding',    icon: Sparkles,        label: 'إعداد عملي', highlight2: true },
  { to: '/business',      icon: Activity,        label: 'لوحة أعمالي', highlight2: true },
  { to: '/rpa-business',  icon: Cpu,             label: 'RPA Business', highlight: true },
  { to: '/automations',   icon: Zap,             label: 'الأتمتات' },
  { to: '/social',        icon: CalendarClock,   label: 'جدولة المنشورات' },
  { to: '/integrations',  icon: Plug,            label: 'التكاملات' },
  { to: '/logs',          icon: FileText,        label: 'السجلات' },
  { to: '/subscription',  icon: CreditCard,      label: 'الاشتراك' },
];

export default function Sidebar() {
  const { user, workspace, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-dark-800 border-l border-dark-600 flex flex-col z-10">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">الأتمتة الذكية</h1>
            <p className="text-xs text-slate-500 truncate max-w-[130px]">{workspace?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, icon: Icon, label, highlight, highlight2 }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? highlight
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    : highlight2
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                  : highlight
                    ? 'text-violet-300 hover:text-white hover:bg-violet-600/10'
                    : highlight2
                      ? 'text-emerald-300 hover:text-white hover:bg-emerald-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
            {highlight && <span className="mr-auto text-xs bg-violet-600/30 text-violet-300 px-1.5 py-0.5 rounded-full">AI</span>}
            {highlight2 && <span className="mr-auto text-xs bg-emerald-600/30 text-emerald-300 px-1.5 py-0.5 rounded-full">جديد</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-dark-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.[0] || 'م'}
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[110px]">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{workspace?.plan || 'personal'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
