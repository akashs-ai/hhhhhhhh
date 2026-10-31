import React, { useState } from 'react';
import {
  Calendar,
  Lock,
  Send,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  ShieldCheck,
  ChevronRight,
  Bot,
  Activity,
  FileCheck,
  Check,
  X,
} from 'lucide-react';
import { UserItem } from '../../types';

interface AdminDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
  onTriggerGenerate?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateTab,
  onTriggerGenerate,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026');
  const [bookingApproved, setBookingApproved] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Authority Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">CENTRAL SCHEDULING AUTHORITY</span>
            <span>•</span>
            <span className="text-slate-500">Chilika Institute of Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of campus scheduling, conflicts, venue utilization, and system activities.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-2xs hover:bg-slate-50">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedMonth}</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('bookings')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Room Locks</span>
          </button>

          <button
            onClick={() => onNavigateTab('exams')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Publish Exams</span>
          </button>

          <button
            onClick={() => {
              if (onTriggerGenerate) onTriggerGenerate();
              onNavigateTab('timetable');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Timetable</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Classes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">320</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>Active slots across 14 depts</span>
            <span className="font-semibold text-slate-600">42 rooms</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Exams Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">48</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Midterms
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span className="text-emerald-600 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Clash-Free</span>
            </span>
            <span className="font-semibold text-slate-600">COE Phase I</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Venue Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">26</span>
            <span className="text-[11px] text-slate-500">active reservations</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>Spectra Venue System</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">4 pending</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">1,245</span>
            <span className="text-[11px] text-slate-500">today</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>Faculty, Students & Staff</span>
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>98.4% live</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Activities (Left) + Distribution / Conflict Engine (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Scheduling Activities (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Scheduling Activities</h2>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Activity 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Timetable generated for CSE - 2A</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Executed by <strong className="text-slate-700">Admin System</strong> • 10 Oct 2026, 11:30 AM • 34 lectures assigned
                </div>
              </div>
            </div>

            {/* Activity 2 with action buttons */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Venue booking request – Seminar Hall</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      Priority
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {bookingApproved ? 'Approved' : 'Pending Review'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Submitted by <strong className="text-slate-700">Tech Club CIT</strong> • 10 Oct 2026, 10:15 AM • Cap: 200 Seats
                </div>
                {!bookingApproved ? (
                  <div className="flex items-center space-x-2 mt-2.5">
                    <button
                      onClick={() => setBookingApproved(true)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onNavigateTab('bookings')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      Check Clashes
                    </button>
                    <button
                      onClick={() => alert('Booking request declined.')}
                      className="px-2.5 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Venue reservation confirmed & published to Spectra registry</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Exam schedule updated by Controller of Exams</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Updated by <strong className="text-slate-700">COE Office</strong> • 09 Oct 2026, 05:40 PM • B-Block 301, 302, Main Hall
                </div>
              </div>
            </div>

            {/* Activity 4 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Disruption request: Class Reschedule (CSE 4A)</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Approved
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Requested by <strong className="text-slate-700">Prof. K. Pattnaik</strong> • Moved from Hall 102 to Lab 4 (02:00 PM)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Class Distribution & Conflict Prevention Engine (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Class Distribution Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Class Distribution</h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                This Week
              </span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Theory (62%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>Lab (28%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                <span>Tutorial (10%)</span>
              </span>
            </div>

            {/* Bar Chart Simulation */}
            <div className="pt-2 grid grid-cols-6 gap-2 items-end h-28 border-b border-slate-100 pb-2">
              {[
                { day: 'Mon', hTheory: '60%', hLab: '25%', hTut: '10%' },
                { day: 'Tue', hTheory: '68%', hLab: '20%', hTut: '10%' },
                { day: 'Wed', hTheory: '75%', hLab: '15%', hTut: '10%' },
                { day: 'Thu', hTheory: '55%', hLab: '30%', hTut: '12%' },
                { day: 'Fri', hTheory: '64%', hLab: '24%', hTut: '10%' },
                { day: 'Sat', hTheory: '70%', hLab: '18%', hTut: '8%' },
              ].map((bar) => (
                <div key={bar.day} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end bg-slate-100 h-24">
                    <div className="w-full bg-indigo-300" style={{ height: bar.hTut }}></div>
                    <div className="w-full bg-sky-400" style={{ height: bar.hLab }}></div>
                    <div className="w-full bg-blue-600" style={{ height: bar.hTheory }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1.5">{bar.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Weekly Load: <strong className="text-slate-800">320 slots filled</strong></span>
              <span className="font-bold text-blue-600">91.4% Capacity Utilized</span>
            </div>
          </div>

          {/* Conflict Prevention Engine Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Conflict Prevention Engine</h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Realtime Guard
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Faculty Overlap Check</span>
                </div>
                <span className="font-bold text-emerald-700">0 Clashes</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Room Allocation Collisions</span>
                </div>
                <span className="font-bold text-emerald-700">0 Collisions</span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Pending Room Changes</span>
                </div>
                <span className="font-bold text-amber-700">2 Unresolved</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">Algorithm: Genetic Heuristic v4.2</span>
              <button
                onClick={() => onNavigateTab('disruptions')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Run Full Audit</span>
                <Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Spectra Venues & Auditoriums + AI Copilot Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spectra Venues (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Spectra Venues & Auditoriums</h2>
              <p className="text-[11px] text-slate-500">Live occupancy and bookable spaces for events & symposiums</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              3 Main Arenas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Arena 1 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Seminar Hall</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    Cap: 200
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-red-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Reserved 2PM</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="mt-4 w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Manage
              </button>
            </div>

            {/* Arena 2 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Conference Room</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    Cap: 50
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Free Now</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="mt-4 w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Manage
              </button>
            </div>

            {/* Arena 3 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Main Auditorium</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    Cap: 500
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Free Today</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="mt-4 w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* AI Scheduling Copilot Banner (4 Cols) */}
        <div className="lg:col-span-4 bg-linear-to-br from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/20">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight">CIT AI Scheduling Copilot</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              3 optimization hints available for next term load balancing and lab hardware bottlenecks.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="mt-6 w-full py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Review Hints</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
