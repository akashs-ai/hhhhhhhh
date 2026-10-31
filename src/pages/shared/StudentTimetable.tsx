import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Download,
  BookOpen,
} from 'lucide-react';
import { UserItem, TimetableSession } from '../../types';
import { GoogleCalendarBanner } from '../../components/GoogleCalendarBanner';
import { GoogleStyleCalendar } from '../../components/GoogleStyleCalendar';

interface StudentTimetableProps {
  currentUser: UserItem;
  sessions?: TimetableSession[];
}

export const StudentTimetable: React.FC<StudentTimetableProps> = ({ currentUser, sessions = [] }) => {
  const isCoordinator = currentUser.role === 'department_coordinator';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Timetable</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, manage and synchronize class schedules with personalized calendar views.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            View My Schedule
          </button>
          {isCoordinator && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">
              Generate Timetable
            </button>
          )}
        </div>
      </div>

      {/* Google Calendar Integration Banner */}
      <GoogleCalendarBanner currentUser={currentUser} />

      {/* Interactive Google Calendar-Style Timetable (Day / Week View) */}
      <GoogleStyleCalendar
        currentUser={currentUser}
        sessions={sessions}
      />
    </div>
  );
};
