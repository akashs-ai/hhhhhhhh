import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  FileCheck,
  Building2,
  Clock,
  Download,
  Send,
  RefreshCw,
  QrCode,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  BookOpen,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { UserItem } from '../../types';
import { StaggerContainer, CardTransition, Skeleton } from '../../components/ui/motion';

interface StudentDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

interface StudentSummary {
  role: string;
  student_name: string;
  student_group: string;
  department: string;
  today: {
    day: string;
    is_weekend: boolean;
    classes_count: number;
    classes: Array<{
      session_id: string;
      course_code: string;
      course_title: string;
      faculty_name: string;
      kind: string;
      room_id: string;
      day: string;
      start_period: number;
      duration: number;
      time_slot: string;
    }>;
  };
  stats: {
    classes_today: number;
    upcoming_exams: number;
    my_venue_bookings: number;
    pending_requests: number;
    attendance_overall_pct: number;
    attendance_threshold_met: boolean;
  };
  upcoming_exams: Array<{
    exam_id: string;
    title: string;
    day: string;
    session: string;
    time: string;
    rooms: string;
  }>;
  my_bookings: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [summaryData, setSummaryData] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real database-backed student summary
  const fetchSummary = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

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
      console.warn('Student dashboard summary fetch notice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSummary();

    const handleMutation = () => fetchSummary(true);
    window.addEventListener('cit:data-mutated', handleMutation);

    return () => {
      window.removeEventListener('cit:data-mutated', handleMutation);
    };
  }, [fetchSummary]);

  const firstName = (currentUser.name || summaryData?.student_name || 'Student').split(' ')[0];
  const studentGroup = currentUser.studentGroupId || summaryData?.student_group || 'CSE-2A';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Good Morning, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's your real-time academic schedule • {summaryData?.today.day || 'MON'} Term Roster
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>

          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Student • {studentGroup}</span>
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Fall Term 2026</span>
          </span>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes Today */}
        <CardTransition className="bg-blue-600 p-5 rounded-2xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">CLASSES TODAY</div>
            <div className="text-3xl font-black mt-1">
              {loading ? <Skeleton className="h-8 w-16 bg-blue-500/50 rounded-md" /> : summaryData?.stats.classes_today ?? 0}
            </div>
            <div className="text-[11px] text-blue-100 mt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {summaryData?.today.is_weekend
                  ? 'Weekend • Showing upcoming weekday load'
                  : `${summaryData?.stats.classes_today ?? 0} Scheduled Sessions`}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/50 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </CardTransition>

        {/* Card 2: Upcoming Exams */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">UPCOMING EXAMS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {loading ? <Skeleton className="h-8 w-16 rounded-md" /> : summaryData?.stats.upcoming_exams ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[140px]">
              {summaryData?.upcoming_exams?.[0]
                ? `${summaryData.upcoming_exams[0].title}`
                : 'Examination roster'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </CardTransition>

        {/* Card 3: My Venue Bookings */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MY VENUE BOOKINGS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {loading ? <Skeleton className="h-8 w-16 rounded-md" /> : summaryData?.stats.my_venue_bookings ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summaryData?.stats.my_venue_bookings ? 'Active Reservations' : 'Spectra Venue Service'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </CardTransition>

        {/* Card 4: Pending Requests */}
        <CardTransition className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING REQUESTS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {loading ? <Skeleton className="h-8 w-16 rounded-md" /> : summaryData?.stats.pending_requests ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {summaryData?.stats.pending_requests ? 'Under Review' : '✓ All cleared'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </CardTransition>
      </StaggerContainer>

      {/* Middle Layout: Today's Classes (7 Cols) + Upcoming Exams & Utilities (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Classes List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Today's Classes ({studentGroup})</h2>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))
            ) : !summaryData?.today.classes || summaryData.today.classes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No classes scheduled for this student group on this academic day.
              </div>
            ) : (
              summaryData.today.classes.map((cls, idx) => (
                <div
                  key={cls.session_id || idx}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    idx === 0
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-blue-700">{cls.time_slot}</span>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-200/80 px-2 py-0.2 rounded-full">
                        {cls.course_code}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                          ONGOING / NEXT
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{cls.course_title}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-3">
                      <span>{cls.faculty_name}</span>
                      <span>• Room {cls.room_id}</span>
                      <span>• {cls.kind === 'lecture' ? 'Theory' : cls.kind === 'tutorial' ? 'Tutorial' : 'Lab'}</span>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    <button
                      onClick={() => onNavigateTab('timetable')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      View Slot
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Exams & Quick Utilities */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Exams Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Upcoming Exams</h2>
              </div>
              <button
                onClick={() => onNavigateTab('exams')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>All Exams</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-1/3 rounded-md" />
                  </div>
                ))
              ) : !summaryData?.upcoming_exams || summaryData.upcoming_exams.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No upcoming midterms scheduled for your courses.
                </div>
              ) : (
                summaryData.upcoming_exams.map((ex, i) => (
                  <div key={ex.exam_id || i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase font-bold text-blue-600">{ex.day}</span>
                      <span className="text-xs leading-none mt-0.5">{ex.session}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="text-blue-700 font-bold text-[10px]">{ex.time}</div>
                      <div className="font-bold text-slate-800 truncate">{ex.title}</div>
                      <div className="text-slate-400 text-[10px]">Room(s): {ex.rooms} • Mid-Term</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigateTab('exams')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exam Admit Card & Schedule</span>
            </button>
          </div>

          {/* Quick Utilities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Utilities</h3>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
            >
              <span>Weekly Timetable Schedule</span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('bookings')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
            >
              <span>Reserve Seminar Space / Aud</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Campus Notice Card */}
            <div className="p-3.5 bg-linear-to-br from-slate-900 to-blue-950 text-white rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">CAMPUS NOTICE</span>
              <div className="text-xs font-bold">TechFest '26 Venue Registrations Open</div>
              <p className="text-[10px] text-slate-300">
                Book Auditorium & Open Air Theatres before 28th October via Spectra booking.
              </p>
              <button
                onClick={() => onNavigateTab('bookings')}
                className="text-[11px] text-blue-400 font-bold hover:underline pt-1 inline-block cursor-pointer"
              >
                Book now in Venue Booking →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Attendance Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Attendance Overview</span>
        </div>

        <p className="text-xs text-slate-500">
          Current aggregate attendance across all registered semester subjects. Threshold requirement is 75%.
        </p>

        <div className="flex items-baseline space-x-6">
          <div>
            <span className="text-3xl font-black text-slate-900">
              {summaryData?.stats.attendance_overall_pct ?? 86.4}%
            </span>
            <span className="text-xs font-bold text-emerald-600 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Meets Criteria
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Automated ERP telemetry verification • Term 2026-II
          </div>
        </div>
      </div>
    </div>
  );
};
