import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Building2,
  AlertTriangle,
  GitPullRequest,
  BarChart3,
  Bot,
  UserCheck,
  Settings,
  User,
  GraduationCap,
} from 'lucide-react';
import { UserItem, UserRole } from '../types';

interface SidebarProps {
  currentUser: UserItem;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onLogout,
}) => {
  const role = currentUser.role;

  // Define navigation items based on strict role requirements
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays, badge: 'v4', badgeType: 'subtle' },
        { id: 'exams', label: 'Exam Scheduler', icon: CalendarCheck2 },
        { id: 'bookings', label: 'Venue Booking', icon: Building2, badge: '128', badgeType: 'neutral' },
        { id: 'disruptions', label: 'Disruptions', icon: AlertTriangle, badge: '3 Active', badgeType: 'danger' },
        { id: 'requests', label: 'Requests', icon: GitPullRequest, badge: '12', badgeType: 'info' },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'Live', badgeType: 'success' },
      ];
    }

    if (role === 'faculty') {
      // Prompt requirement: Dashboard, Timetable, Exam Scheduler, Venue Booking, Requests, AI Assistant
      // "Do not add Faculty Reports to the navigation unless the existing requirements explicitly require it."
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays },
        { id: 'exams', label: 'Exam Scheduler', icon: CalendarCheck2 },
        { id: 'bookings', label: 'Venue Booking', icon: Building2 },
        { id: 'requests', label: 'Requests', icon: GitPullRequest },
        { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
      ];
    }

    // Coordinator and Student (Shared frontend navigation)
    // Both share: Dashboard, Timetable, Exam Scheduler, Venue Booking, Reports, AI Assistant
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'timetable', label: 'Timetable', icon: CalendarDays },
      { id: 'exams', label: 'Exam Scheduler', icon: CalendarCheck2 },
      { id: 'bookings', label: 'Venue Booking', icon: Building2 },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'Beta', badgeType: 'info' },
    ];
  };

  const navItems = getNavItems();

  const getPortalSubtitle = () => {
    if (role === 'admin') return 'Admin Portal';
    if (role === 'faculty') return 'Faculty Gateway';
    if (role === 'department_coordinator') return 'Coordinator Portal';
    if (role === 'student') return 'Student Portal';
    return 'Chilika Inst. of Tech.';
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center space-x-1">
                <span>CITSchedule</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{getPortalSubtitle()}</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
            CIT
          </span>
        </div>

        {/* Section Heading */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {role === 'faculty' ? 'ACADEMIC PORTAL' : 'ACADEMIC OPERATIONS'}
          </p>
        </div>

        {/* Navigation Link List */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeType === 'danger'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : item.badgeType === 'info'
                        ? 'bg-blue-100 text-blue-700'
                        : item.badgeType === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.badgeType === 'subtle'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onLogout}
          title="Click to switch role or sign out"
          className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{currentUser.roleLabel}</div>
          </div>
        </button>

        <div className="mt-2.5 px-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>v1.0.0 Chilika IT</span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
