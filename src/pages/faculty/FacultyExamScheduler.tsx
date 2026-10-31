import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyExamSchedulerProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

export const FacultyExamScheduler: React.FC<FacultyExamSchedulerProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            ACADEMIC TERM 2026-27 • MIDTERM CYCLE II / FACULTY PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            My Examination Duties & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View assigned invigilation responsibilities, examination slots, and student hall rosters. Official schedule managed by the Controller of Examinations (COE).
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Invigilation Roster (PDF)</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sync to Google Calendar</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASSIGNED INVIGILATIONS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">4 Slots</div>
          <div className="text-[11px] text-slate-500 mt-2">2 Lead Invigilator • 2 Assistant</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UPCOMING DUTY</div>
          <div className="text-xl font-black text-blue-600 mt-1">Tomorrow, 09:00 AM</div>
          <div className="text-[11px] text-slate-500 mt-2">Mid-Term: Operating Systems...</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL EXAM HOURS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">12.0 Hrs</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Compliant with Faculty Quota (Max 16h)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SCHEDULE STATUS</div>
          <div className="text-xl font-bold text-slate-800 mt-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Confirmed by COE</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">All Clash-Free verified by SAT engine</div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
        <span>
          <strong>Notice:</strong> As faculty, you have read-only access to official examination master timetables. To request duty swaps or report emergency unavailability, submit a ticket under Requests.
        </span>
        <button
          onClick={() => onNavigateTab('requests')}
          className="font-bold underline text-blue-700 ml-2 shrink-0 hover:text-blue-800"
        >
          Go to Requests →
        </button>
      </div>

      {/* Duty Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Upcoming Duties (3)
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'completed' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Completed Duties (1)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <option>3rd Semester CSE</option>
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <option>All Duties</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-3.5">DATE & TIME</th>
                <th className="p-3.5">COURSE & CODE</th>
                <th className="p-3.5">ASSIGNED ROLE</th>
                <th className="p-3.5">EXAMINATION HALL</th>
                <th className="p-3.5">CANDIDATES</th>
                <th className="p-3.5">CO-INVIGILATORS</th>
                <th className="p-3.5 text-right">ROSTER & ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5">
                  <div className="font-bold text-blue-600">Tomorrow, 25 Oct 2026</div>
                  <div className="text-[10px] text-slate-500">09:00 AM – 12:00 PM</div>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">Operating Systems</div>
                  <div className="text-[10px] text-slate-400">CS302 • Midterm</div>
                </td>
                <td className="p-3.5">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    Chief Invigilator
                  </span>
                </td>
                <td className="p-3.5 font-medium text-slate-800">B-Block Hall 302</td>
                <td className="p-3.5 font-bold text-slate-800">64 Candidates (CSE-2A)</td>
                <td className="p-3.5 text-slate-600">Er. P. Das</td>
                <td className="p-3.5 text-right">
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]">
                    Roster
                  </button>
                </td>
              </tr>

              <tr>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">Wed, 28 Oct 2026</div>
                  <div className="text-[10px] text-slate-500">02:00 PM – 05:00 PM</div>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">Cyber Security & Cryptography</div>
                  <div className="text-[10px] text-slate-400">CS405 • Midterm</div>
                </td>
                <td className="p-3.5">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    Lead Invigilator
                  </span>
                </td>
                <td className="p-3.5 font-medium text-slate-800">B-Block Hall 204</td>
                <td className="p-3.5 font-bold text-slate-800">48 Candidates (CSE-3A)</td>
                <td className="p-3.5 text-slate-600">Staff Escort</td>
                <td className="p-3.5 text-right">
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]">
                    Roster
                  </button>
                </td>
              </tr>

              <tr>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">Mon, 02 Nov 2026</div>
                  <div className="text-[10px] text-slate-500">09:00 AM – 12:00 PM</div>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">Database Management Systems</div>
                  <div className="text-[10px] text-slate-400">CS303 • Midterm</div>
                </td>
                <td className="p-3.5">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                    Co-Invigilator
                  </span>
                </td>
                <td className="p-3.5 font-medium text-slate-800">Hall 201</td>
                <td className="p-3.5 font-bold text-slate-800">65 Candidates (CSE-2B)</td>
                <td className="p-3.5 text-slate-600">Lead: Prof. A. Mohanty</td>
                <td className="p-3.5 text-right">
                  <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]">
                    Roster
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Guidelines & Swap Request Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
          <div className="font-bold text-slate-900">Invigilation Guidelines & Protocols (COE MANUAL 2026)</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-800">1. Arrival Buffer</div>
              <p className="text-[11px] text-slate-500">Report to COE Control Room at least 30 minutes prior to exam.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-800">2. Packet Custody</div>
              <p className="text-[11px] text-slate-500">Collect sealed question paper bundles with dual faculty signatures.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="font-bold text-slate-800">3. Verification</div>
              <p className="text-[11px] text-slate-500">Verify student identity via physical Smart Cards and answer book barcodes.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
          <div className="font-bold text-slate-900">Need a Duty Swap?</div>
          <p className="text-slate-500 text-[11px]">
            Facing emergency clash or departmental commitment? Submit a swap ticket with a consenting substitute faculty member.
          </p>
          <button
            onClick={() => onNavigateTab('requests')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-2xs"
          >
            Request Duty Exchange
          </button>
          <div className="text-[10px] text-slate-400 text-center">Requires 24-hr advance notice for COE approval</div>
        </div>
      </div>
    </div>
  );
};
