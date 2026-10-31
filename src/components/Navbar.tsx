import React, { useState } from 'react';
import { Search, Bell, Calendar, Cpu, ChevronDown, LogOut, RefreshCw, UserCheck, Check } from 'lucide-react';
import { UserItem } from '../types';
import { INITIAL_USERS } from '../data/demoData';

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

        {/* Notifications Icon with Indicator */}
        <button
          title="Institutional Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

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
