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

interface StudentTimetableProps {
  currentUser: UserItem;
  sessions?: TimetableSession[];
}

export const StudentTimetable: React.FC<StudentTimetableProps> = ({ currentUser }) => {
  const isCoordinator = currentUser.role === 'department_coordinator';
  const [googleConnected, setGoogleConnected] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'class' | 'faculty' | 'room'>('calendar');

  const calendarDays = [
    { day: 'Mon', date: '20 Oct' },
    { day: 'Tue', date: '21 Oct' },
    { day: 'Wed', date: '22 Oct' },
    { day: 'Thu', date: '23 Oct' },
    { day: 'Fri', date: '24 Oct' },
  ];

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
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Google Calendar Integration</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  googleConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {googleConnected ? 'Connected ✓' : 'Not Connected'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Connect your Google account to auto-sync timetable events to faculty & student calendars.
            </div>
          </div>
        </div>

        <button
          onClick={() => setGoogleConnected(!googleConnected)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs shrink-0 transition-all"
        >
          {googleConnected ? 'Disconnect Calendar' : 'Connect Google Calendar (OAuth 2.0)'}
        </button>
      </div>

      {/* Tabs & Period Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'calendar' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'class' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Class View
          </button>
          <button
            onClick={() => setActiveSubTab('faculty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'faculty' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Faculty View
          </button>
          <button
            onClick={() => setActiveSubTab('room')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'room' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Room View
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>CSE</option>
            <option>ECE</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>3rd Semester</option>
            <option>5th Semester</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>CSE - A</option>
            <option>CSE - B</option>
          </select>
        </div>
      </div>

      {/* Main Timetable Matrix View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Filter Column (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filters</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
              <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
                <option>CSE - Computer</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Semester</label>
              <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
                <option>3rd Semester</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
              <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
                <option>CSE - A</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Class Type</label>
              <div className="space-y-1.5 mt-1.5">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Theory</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Lab</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Tutorial</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Center Grid (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 overflow-x-auto">
          <div className="min-w-[600px] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <span>20 – 26 Oct 2026</span>
                <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Term: Autumn 2026
              </span>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-5 gap-2.5">
              {calendarDays.map((col) => (
                <div key={col.day} className="space-y-2">
                  <div className="p-2 bg-slate-50 rounded-lg text-center text-xs font-bold border border-slate-100">
                    <div>{col.day}</div>
                    <div className="text-[10px] font-normal text-slate-400">{col.date}</div>
                  </div>

                  {/* Sample Class Blocks */}
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">Data Structures</div>
                    <div className="text-[10px] text-blue-600 font-semibold">CSE - A • B-201</div>
                  </div>

                  <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">Operating Systems</div>
                    <div className="text-[10px] text-sky-700 font-semibold">CSE - A • B-203</div>
                  </div>

                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-center text-[10px] font-bold text-amber-800">
                    RECESS (1:00 - 2:00 PM)
                  </div>

                  <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">Cyber Security</div>
                    <div className="text-[10px] text-indigo-700 font-semibold">CSE - A • B-205</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Unscheduled & Actions (2 Cols) */}
        <div className="lg:col-span-2 space-y-4 text-xs">
          {/* Quick Actions (Coordinator only receives interactive modifications) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <div className="font-bold text-slate-800">Quick Actions</div>
            {isCoordinator ? (
              <div className="space-y-1.5">
                <button className="w-full p-2 bg-blue-600 text-white rounded-lg font-bold text-[11px]">
                  + Add Class
                </button>
                <button className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700">
                  Swap Classes
                </button>
                <button className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700">
                  Set Constraints
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-[11px]">
                Student View: Read-only live schedule feed.
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <div className="font-bold text-slate-800">Legend</div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Theory</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Lab</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>Tutorial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
