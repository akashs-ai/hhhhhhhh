import React from 'react';
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

interface StudentDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const isCoordinator = currentUser.role === 'department_coordinator';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Good Morning, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's your schedule for today, Saturday, 24 Oct 2026
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>
              {isCoordinator ? 'Coordinator • CSE Dept' : 'Student • CSE - 2A (Sem 3)'}
            </span>
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Fall Term 2026</span>
          </span>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">CLASSES TODAY</div>
            <div className="text-3xl font-black mt-1">4</div>
            <div className="text-[11px] text-blue-100 mt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>1 Ongoing Now</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/50 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">UPCOMING EXAMS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">2</div>
            <div className="text-[11px] text-slate-500 mt-1">Next in 24 hrs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MY VENUE BOOKINGS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">1</div>
            <div className="text-[11px] text-slate-500 mt-1">Seminar Hall B</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING REQUESTS</div>
            <div className="text-3xl font-black text-slate-900 mt-1">0</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">✓ All cleared</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Layout: Today's Classes (7 Cols) + Upcoming Exams & Utilities (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Classes List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Today's Classes</h2>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View Full Timetable</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Slot 1: Ongoing */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-blue-700">09:30 AM – 11:00 AM</span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-200/80 px-2 py-0.2 rounded-full">
                    ONGOING
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">Data Structures & Algorithms</div>
                <div className="text-xs text-slate-500 flex items-center space-x-3">
                  <span>Prof. K. Nayak</span>
                  <span>• Room B-201</span>
                  <span>• CSE-2A</span>
                </div>
              </div>

              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto">
                Join Sync
              </button>
            </div>

            {/* Slot 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">11:30 AM – 01:00 PM</span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                    UP NEXT
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">Operating Systems</div>
                <div className="text-xs text-slate-500">Dr. M. Sen • Room B-201 • CSE-2A</div>
              </div>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>

            {/* Slot 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">02:00 PM – 03:30 PM</span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                    Elective
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">Cyber Security Principles</div>
                <div className="text-xs text-slate-500">Er. R. Pattnaik • Room B-205</div>
              </div>
            </div>

            {/* Slot 4 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">04:00 PM – 05:45 PM</span>
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                    Practical
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">OS & Shell Scripting Lab</div>
                <div className="text-xs text-slate-500">Systems Lab 1 • Batch A</div>
              </div>
            </div>
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
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-blue-600">OCT</span>
                  <span className="text-base leading-none">25</span>
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="text-red-600 font-bold text-[10px]">Tomorrow • 09:00 AM</div>
                  <div className="font-bold text-slate-800 truncate">Operating Systems</div>
                  <div className="text-slate-400 text-[10px]">Room B-302 • Mid-Term</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-black flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-500">NOV</span>
                  <span className="text-base leading-none">02</span>
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <div className="text-slate-500 font-medium text-[10px]">In 9 Days • 09:00 AM</div>
                  <div className="font-bold text-slate-800 truncate">Cyber Security</div>
                  <div className="text-slate-400 text-[10px]">Room B-301 • Mid-Term</div>
                </div>
              </div>
            </div>

            <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2">
              <Download className="w-3.5 h-3.5" />
              <span>Download Exam Admit Card</span>
            </button>
          </div>

          {/* Quick Utilities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Utilities</h3>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between"
            >
              <span>Weekly Timetable PDF</span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('bookings')}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between"
            >
              <span>Request Leave of Absence</span>
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
                className="text-[11px] text-blue-400 font-bold hover:underline pt-1 inline-block"
              >
                Book now in Venue Booking →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Attendance Overview + My Reserved Venue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Attendance Overview</span>
          </div>

          <p className="text-xs text-slate-500">
            Current aggregate attendance across all registered semester subjects. Threshold requirement is 75%.
          </p>

          <div className="flex items-baseline space-x-6">
            <div>
              <div className="text-3xl font-black text-slate-900">88.4%</div>
              <div className="text-[10px] text-slate-400 font-medium">Aggregate</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-700">142 / 160</div>
              <div className="text-[10px] text-slate-400 font-medium">Classes Attended</div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Data Structures</span>
                <span className="font-bold text-blue-600">92%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[92%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Operating Systems</span>
                <span className="font-bold text-blue-600">85%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[85%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Reserved Venue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>My Reserved Venue</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Approved
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900">Spectra Coding Club Sprint</div>
            <div className="text-slate-500 text-[11px]">Seminar Hall B • 60 Seats</div>
            <div className="text-blue-600 font-semibold text-[11px]">
              Sunday, 25 Oct • 04:00 PM - 07:00 PM
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
              <span className="font-mono text-slate-400">REF: CIT-BK-9921</span>
              <button className="flex items-center space-x-1 font-bold text-blue-600 hover:underline">
                <QrCode className="w-3.5 h-3.5" />
                <span>Pass QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
