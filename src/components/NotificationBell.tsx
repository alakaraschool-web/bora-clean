import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  role?: string;
  userId?: string;
}

interface NotificationBellProps {
  role: 'super-admin' | 'principal' | 'teacher' | 'student';
  userId?: string;
}

export const NotificationBell = ({ role, userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = () => {
      const saved = localStorage.getItem('alakara_notifications');
      if (saved) {
        const all = JSON.parse(saved) as Notification[];
        // Filter by role or userId
        const filtered = all.filter(n => 
          (!n.role || n.role === role) && 
          (!n.userId || n.userId === userId)
        );
        setNotifications(filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 3000); // Poll for new notifications

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [role, userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const all = JSON.parse(localStorage.getItem('alakara_notifications') || '[]') as Notification[];
    const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('alakara_notifications', JSON.stringify(updated));
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    const all = JSON.parse(localStorage.getItem('alakara_notifications') || '[]') as Notification[];
    const updated = all.map(n => {
      if ((!n.role || n.role === role) && (!n.userId || n.userId === userId)) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('alakara_notifications', JSON.stringify(updated));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    const all = JSON.parse(localStorage.getItem('alakara_notifications') || '[]') as Notification[];
    const updated = all.filter(n => n.id !== id);
    localStorage.setItem('alakara_notifications', JSON.stringify(updated));
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    const all = JSON.parse(localStorage.getItem('alakara_notifications') || '[]') as Notification[];
    const updated = all.filter(n => 
      !((!n.role || n.role === role) && (!n.userId || n.userId === userId))
    );
    localStorage.setItem('alakara_notifications', JSON.stringify(updated));
    setNotifications([]);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'success': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'error': return { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
      default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all relative group ${isOpen ? 'bg-gray-100 text-kenya-red' : 'text-gray-400 hover:text-kenya-red hover:bg-gray-50'}`}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-[bell-swing_2s_infinite]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-kenya-red text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-black text-kenya-black uppercase tracking-tight">Notifications</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {unreadCount} UNREAD MESSAGES
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-gray-400 hover:text-kenya-green transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearAll}
                  className="p-2 text-gray-400 hover:text-kenya-red transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications.map((n) => {
                    const styles = getTypeStyles(n.type);
                    return (
                      <div 
                        key={n.id} 
                        className={`p-4 flex gap-4 transition-colors group relative ${n.read ? 'bg-white' : 'bg-blue-50/30'}`}
                      >
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${styles.bg} ${styles.color}`}>
                          <styles.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-bold truncate ${n.read ? 'text-gray-700' : 'text-kenya-black'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] font-medium text-gray-400 shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-700'}`}>
                            {n.message}
                          </p>
                          <div className="mt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.read && (
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="text-[10px] font-black text-kenya-green uppercase tracking-wider hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(n.id)}
                              className="text-[10px] font-black text-kenya-red uppercase tracking-wider hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {!n.read && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-kenya-red rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No notifications yet</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-kenya-black transition-colors">
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bell-swing {
          0%, 100% { transform: rotate(0); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
          20%, 40%, 60%, 80% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>
  );
};

export const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const all = JSON.parse(localStorage.getItem('alakara_notifications') || '[]') as Notification[];
  const newNotif: Notification = {
    ...notif,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    read: false
  };
  localStorage.setItem('alakara_notifications', JSON.stringify([newNotif, ...all]));
};
