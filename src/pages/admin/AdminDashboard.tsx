import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Layers,
} from 'lucide-react';
import { UserItem } from '../../types';
import { StaggerContainer, CardTransition, Skeleton } from '../../components/ui/motion';

interface AdminDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
  onTriggerGenerate?: () => void;
}

interface DashboardSummary {
  scope: string;
  department: string;
  role: string;
  stats: {
    total_classes: number;
    total_rooms: number;
    active_rooms_count: number;
    exams_scheduled: number;
    exams_clash_free: boolean;
    venue_bookings: number;
    pending_bookings: number;
    active_users: number;
    faculty_count: number;
    student_count: number;
  };
  distribution: {
    theory_pct: number;
    lab_pct: number;
    tutorial_pct: number;
    theory_slots: number;
    lab_slots: number;
    tutorial_slots: number;
    total_slots: number;
    capacity_utilized_pct: number;
    daily_breakdown: Array<{
      day: string;
      theory: number;
      lab: number;
      tutorial: number;
      total: number;
    }>;
  };
  conflict_engine: {
    faculty_clashes: number;
    room_collisions: number;
    pending_disruptions: number;
    algorithm_status: string;
  };
  venues: Array<{
    id: string;
    name: string;
    building: string;
    capacity: number;
    status: string;
    status_label: string;
  }>;
  recent_activities: Array<{
    id: string;
    action: string;
    user_name: string;
    role: string;
    timestamp: string;
    status: string;
    resource_id?: string;
    details?: any;
  }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateTab,
  onTriggerGenerate,
}) => {
  const [selectedMonth] = useState('Oct 2026');
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isCoordinator = currentUser.role === 'department_coordinator';
  const effectiveDept = currentUser.department || (isCoordinator ? 'Computer Science & Engineering' : '');

  // Fetch real database-backed summary
  const fetchSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const token = currentUser.token || (typeof window !== 'undefined' ? localStorage.getItem('cit_auth_token') : '') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/dashboard/summary', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setSummaryData(json);
      }
    } catch (err) {
      console.warn('Dashboard summary fetch notice:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSummary();

    // Listen for mutations across the application
    const handleMutation = () => fetchSummary(false);
    window.addEventListener('cit:data-mutated', handleMutation);

    return () => {
      window.removeEventListener('cit:data-mutated', handleMutation);
    };
  }, [fetchSummary]);

  // Format action string into human-friendly label
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Format timestamp into clean relative / readable time
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Calculate maximum total slots in any day for scaling bar chart
  const maxDaySlots = Math.max(
    1,
    ...(summaryData?.distribution.daily_breakdown || []).map((d) => d.total || 0)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Authority Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">
              {isCoordinator ? `${effectiveDept.toUpperCase()} COORDINATOR OFFICE` : 'CENTRAL SCHEDULING AUTHORITY'}
            </span>
            <span>•</span>
            <span className="text-slate-500">Chilika Institute of Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {isCoordinator ? `${effectiveDept} Dashboard` : 'Admin Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isCoordinator
              ? `Real-time departmental operations, lecture allocations, faculty equity, and venue dockets.`
              : `Overview of campus scheduling, conflicts, venue utilization, and central operations.`}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>

          <div className="relative">
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-2 shadow-2xs hover:bg-slate-50 cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedMonth}</span>
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('bookings')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Room Locks</span>
          </button>

          <button
            onClick={() => onNavigateTab('exams')}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Publish Exams</span>
          </button>

          <button
            onClick={() => {
              if (onTriggerGenerate) onTriggerGenerate();
              onNavigateTab('timetable');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Timetable</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Classes */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Classes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="h-9 flex items-baseline space-x-2 mt-2">
            {loading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {summaryData?.stats.total_classes ?? 0}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> Live
                </span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>
              {isCoordinator ? `${effectiveDept} teaching slots` : `Active across all depts`}
            </span>
            <span className="font-semibold text-slate-600">
              {summaryData?.stats.active_rooms_count ?? 0} active rooms
            </span>
          </div>
        </CardTransition>

        {/* Card 2: Exams Scheduled */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Exams Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="h-9 flex items-baseline space-x-2 mt-2">
            {loading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {summaryData?.stats.exams_scheduled ?? 0}
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Midterms
                </span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span className="text-emerald-600 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{summaryData?.stats.exams_clash_free ? '100% Clash-Free' : 'Clashes Monitored'}</span>
            </span>
            <span className="font-semibold text-slate-600">COE Term Roster</span>
          </div>
        </CardTransition>

        {/* Card 3: Venue Bookings */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Venue Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-9 flex items-baseline space-x-2 mt-2">
            {loading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {summaryData?.stats.venue_bookings ?? 0}
                </span>
                <span className="text-[11px] text-slate-500">active reservations</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>Spectra Venue System</span>
            <span
              onClick={() => onNavigateTab('bookings')}
              className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-100"
            >
              {summaryData?.stats.pending_bookings ?? 0} pending
            </span>
          </div>
        </CardTransition>

        {/* Card 4: Active Users */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isCoordinator ? 'Department Members' : 'Active Users'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="h-9 flex items-baseline space-x-2 mt-2">
            {loading ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {summaryData?.stats.active_users?.toLocaleString() ?? 0}
                </span>
                <span className="text-[11px] text-slate-500">registered</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            <span>
              {summaryData?.stats.faculty_count ?? 18} Faculty • {summaryData?.stats.student_count ?? 620} Students
            </span>
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Online</span>
            </span>
          </div>
        </CardTransition>
      </StaggerContainer>

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
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))
            ) : !summaryData?.recent_activities || summaryData.recent_activities.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No recent scheduling operations logged in audit register.
              </div>
            ) : (
              summaryData.recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3 transition-colors hover:bg-slate-100/60"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    {act.action.includes('BOOKING') ? (
                      <Building2 className="w-4 h-4" />
                    ) : act.action.includes('DISRUPTION') ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : act.action.includes('EXAM') ? (
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {formatAction(act.action)}
                        {act.resource_id ? ` (#${act.resource_id})` : ''}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                          act.status === 'success'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {act.status === 'success' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Initiated by <strong className="text-slate-700">{act.user_name}</strong> •{' '}
                      {formatTime(act.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Class Distribution & Conflict Prevention Engine (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Class Distribution Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Class Distribution</h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Active Master Term
              </span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Theory ({summaryData?.distribution.theory_pct ?? 0}%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>Lab ({summaryData?.distribution.lab_pct ?? 0}%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
                <span>Tutorial ({summaryData?.distribution.tutorial_pct ?? 0}%)</span>
              </span>
            </div>

            {/* Dynamic Bar Chart based on real day counts */}
            <div className="pt-2 grid grid-cols-6 gap-2 items-end h-28 border-b border-slate-100 pb-2">
              {(summaryData?.distribution.daily_breakdown || [
                { day: 'MON', theory: 10, lab: 4, tutorial: 2, total: 16 },
                { day: 'TUE', theory: 12, lab: 3, tutorial: 2, total: 17 },
                { day: 'WED', theory: 14, lab: 2, tutorial: 2, total: 18 },
                { day: 'THU', theory: 8, lab: 5, tutorial: 2, total: 15 },
                { day: 'FRI', theory: 11, lab: 4, tutorial: 1, total: 16 },
                { day: 'SAT', theory: 9, lab: 2, tutorial: 1, total: 12 },
              ]).map((bar) => {
                const total = bar.total || 1;
                const theoryH = Math.round((bar.theory / total) * 100);
                const labH = Math.round((bar.lab / total) * 100);
                const tutH = Math.max(0, 100 - theoryH - labH);
                const barHeight = Math.min(100, Math.max(25, Math.round((total / maxDaySlots) * 100)));

                return (
                  <div key={bar.day} className="flex flex-col items-center h-full justify-end group">
                    <div
                      className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end bg-slate-100 transition-[height] duration-200 ease-out"
                      style={{ height: `${barHeight}%` }}
                      title={`${bar.day}: ${bar.theory} Theory, ${bar.lab} Lab, ${bar.tutorial} Tut (${bar.total} total)`}
                    >
                      <div className="w-full bg-indigo-300" style={{ height: `${tutH}%` }}></div>
                      <div className="w-full bg-sky-400" style={{ height: `${labH}%` }}></div>
                      <div className="w-full bg-blue-600" style={{ height: `${theoryH}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1.5 uppercase">
                      {bar.day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                Weekly Load:{' '}
                <strong className="text-slate-800">
                  {summaryData?.distribution.total_slots ?? 0} slots filled
                </strong>
              </span>
              <span className="font-bold text-blue-600">
                {summaryData?.distribution.capacity_utilized_pct ?? 0}% Capacity Utilized
              </span>
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
                <span className="font-bold text-emerald-700">
                  {summaryData?.conflict_engine.faculty_clashes ?? 0} Clashes
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Room Allocation Collisions</span>
                </div>
                <span className="font-bold text-emerald-700">
                  {summaryData?.conflict_engine.room_collisions ?? 0} Collisions
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Pending Disruptions / Changes</span>
                </div>
                <span className="font-bold text-amber-700">
                  {summaryData?.conflict_engine.pending_disruptions ?? 0} Unresolved
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                {summaryData?.conflict_engine.algorithm_status || 'Active Heuristic Engine'}
              </span>
              <button
                onClick={() => onNavigateTab('disruptions')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
              >
                <span>Run Audit</span>
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
              <p className="text-[11px] text-slate-500">Live occupancy and bookable spaces across campus infrastructure</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {summaryData?.venues?.length ?? 3} Managed Spaces
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {(summaryData?.venues || [
              { id: 'SH-1', name: 'Seminar Hall', building: 'B-Block', capacity: 200, status: 'occupied', status_label: 'Reserved' },
              { id: 'CR-101', name: 'Conference Room', building: 'Admin Wing', capacity: 50, status: 'available', status_label: 'Free Now' },
              { id: 'AUD', name: 'Main Auditorium', building: 'Central Block', capacity: 500, status: 'available', status_label: 'Free Today' },
            ]).slice(0, 3).map((venue) => (
              <div
                key={venue.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{venue.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      Cap: {venue.capacity}
                    </span>
                  </div>
                  <div
                    className={`mt-3 flex items-center space-x-1.5 text-[11px] font-semibold ${
                      venue.status === 'occupied' ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        venue.status === 'occupied' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span>{venue.status_label}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('bookings')}
                  className="mt-4 w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Manage Venue
                </button>
              </div>
            ))}
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
              Powered by Google Gemini to analyze timetable conflicts, room utilization, and workload equity.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="mt-6 w-full py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Ask Copilot</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
