import { useState, useEffect } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Header() {
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnread(data.unread);
      setNotifs(data.notifications);
    }).catch(() => {});
  }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifs(notifs.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-600 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/automations/new')}
          className="btn-primary text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4" />
          أتمتة جديدة
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-700 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-12 left-0 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-dark-600">
                <h3 className="font-medium text-white text-sm">الإشعارات</h3>
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-primary-400 hover:underline">
                    تحديد الكل مقروء
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">لا توجد إشعارات</p>
                ) : notifs.map(n => (
                  <div key={n.id} className={`p-4 border-b border-dark-700 ${!n.is_read ? 'bg-primary-600/5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
