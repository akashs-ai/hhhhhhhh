import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Calendar, Cpu, ChevronDown, LogOut, RefreshCw, UserCheck, Check, CheckCheck, Inbox } from 'lucide-react';
import { UserItem } from '../types';
import { INITIAL_USERS } from '../data/demoData';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  reference_id?: string;
  read: boolean;
  created_at: string;
}

interface NavbarProps {
  currentUser: UserItem;
  onSelectUser: (user: UserItem) => void;
  onLogout: () => void;
  onOpenPublicLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  onLogout,
  onOpenPublicLanding,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: NotificationItem) => !n.read).length);
        }
      }
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 15000);
    const handleFocus = () => fetchNotifications();
    const handleScheduleChange = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('cit_schedule_changed', handleScheduleChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('cit_schedule_changed', handleScheduleChange);
    };
  }, [currentUser]);

  // Click outside listener for notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // quiet
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // quiet
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules, venues, faculty, or slots (⌘K)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center space-x-3 ml-4">
        {/* SAT Solver Engine Status Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-blue-50/70 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span>SAT Solver Engine v4.8 Active</span>
        </div>

        {/* Academic Term Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Autumn 2026 (Odd Term)</span>
        </div>

        {/* In-App Notifications Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Institutional Notifications"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center space-y-1.5">
                    <Inbox className="w-6 h-6 text-slate-300" />
                    <span>No notifications at this time</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex items-start space-x-3 ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="mt-1">
                        <span
                          className={`w-2 h-2 rounded-full block ${
                            !n.read ? 'bg-blue-600' : 'bg-transparent'
                          }`}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{n.title}</span>
                          {n.reference_id && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {n.reference_id}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 p-1.5 pl-2 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-slate-800">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500">{currentUser.roleLabel || currentUser.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switch User / Account Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Role Profile</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.email || currentUser.roleLabel}</div>
              </div>

              <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Quick Role Switching
              </div>
              <div className="max-h-60 overflow-y-auto px-1">
                {INITIAL_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      user.id === currentUser.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.roleLabel}</div>
                    </div>
                    {user.id === currentUser.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 mt-2 pt-1 px-1">
                {onOpenPublicLanding && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPublicLanding();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>View Public Landing Page</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Role / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
