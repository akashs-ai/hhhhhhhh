import React from 'react';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyReportsProps {
  currentUser: UserItem;
}

export const FacultyReports: React.FC<FacultyReportsProps> = ({ currentUser }) => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">
            Academic Performance & Operations &gt; Faculty Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Personal Teaching Workload & Operational Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of individual lecture hours, laboratory sessions, invigilation duty fulfillment, and disruption logs for {currentUser.name}.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Dossier (PDF)</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Scope Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold">
            CSE Department • Autumn 2026 (Odd Term)
          </span>
          <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold">
            Range: Current Term (Oct - Nov 2026)
          </span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg font-bold">
            • SYNCHRONIZED WITH ERP
          </span>
        </div>
        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">
          Filter Parameters
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Committed Teaching Load</div>
          <div className="text-3xl font-black text-slate-900 mt-1">18.0 <span className="text-sm font-semibold text-slate-500">/ 20.0 Hrs</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">90% Quota Attainment • Optimal</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Term Lectures Delivered</div>
          <div className="text-3xl font-black text-slate-900 mt-1">54 <span className="text-sm font-semibold text-slate-500">Lectures</span></div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">100% On Track • Syllabus Pacing</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invigilation Completed</div>
          <div className="text-3xl font-black text-slate-900 mt-1">12.0 <span className="text-sm font-semibold text-slate-500">Hours</span></div>
          <div className="text-[11px] text-slate-500 mt-2">4 Duties Allocated (1 Done, 3 Sched)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disruption &amp; Reschedule</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">1.8%</div>
          <div className="text-[11px] text-slate-500 mt-2">Low Volatility • 1 Rescheduled Lecture</div>
        </div>
      </div>

      {/* Middle Row: Weekly Teaching Hours (7 Cols) + Invigilation Breakdown (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Weekly Teaching Hours Allocation</h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              TOTAL 18.0 H/WK
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>CS301 Data Structures & Algorithms</span>
                <span className="text-blue-600">6.0 Hrs/wk</span>
              </div>
              <div className="text-[11px] text-slate-500">Section A & B • Lecture Hall B-201 • THEORY ONLY</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>CS304 Operating Systems</span>
                <span className="text-blue-600">7.0 Hrs/wk</span>
              </div>
              <div className="text-[11px] text-slate-500">Theory (4h, B-201) + Practical Lab (3h, Systems Lab 1) • COMBINED MODALITY</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>CS412 Cyber Security Principles</span>
                <span className="text-blue-600">5.0 Hrs/wk</span>
              </div>
              <div className="text-[11px] text-slate-500">Theory (3h, B-205) + Security Sandbox Lab (2h) • SPECIALIZATION</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Examination & Invigilation</h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">MID-TERM CYCLE II</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Chief Invigilator</div>
                <div className="text-[10px] text-slate-400">2 Sessions (LH 101 Hall)</div>
              </div>
              <span className="font-mono font-bold text-slate-800">6.0 hrs</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Co-Invigilator</div>
                <div className="text-[10px] text-slate-400">2 Sessions (Lab Hall B)</div>
              </div>
              <span className="font-mono font-bold text-slate-800">6.0 hrs</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] font-semibold">
              ✓ Statutory Quota Satisfied. Zero schedule clashes detected across mid-semester timetables.
            </div>
          </div>
        </div>
      </div>

      {/* Disruption History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">Schedule Changes & Disruption History (Autumn 2026)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-2.5">DATE</th>
                <th className="p-2.5">COURSE</th>
                <th className="p-2.5">TYPE</th>
                <th className="p-2.5">REASON</th>
                <th className="p-2.5">RESCHEDULED SLOT</th>
                <th className="p-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">28 Oct 2026</td>
                <td className="p-2.5 font-bold text-slate-900">CS304 OS Theory</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">Medical Leave</span></td>
                <td className="p-2.5 text-slate-600">Health Center consult</td>
                <td className="p-2.5 text-blue-600 font-semibold">Wed 29 Oct 02:00 PM (B-203)</td>
                <td className="p-2.5"><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Pending Coord Approval</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-800">21 Oct 2026</td>
                <td className="p-2.5 font-bold text-slate-900">CS412 Cyber Security</td>
                <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">Venue Shift</span></td>
                <td className="p-2.5 text-slate-600">Requires GPU workstation clusters</td>
                <td className="p-2.5 text-slate-700">Systems Lab 1</td>
                <td className="p-2.5"><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Approved by HOD</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
