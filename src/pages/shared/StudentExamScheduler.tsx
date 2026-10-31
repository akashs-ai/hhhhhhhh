import React, { useState } from 'react';
import {
  Download,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { UserItem, ExamItem } from '../../types';

interface StudentExamSchedulerProps {
  currentUser: UserItem;
  exams?: ExamItem[];
}

export const StudentExamScheduler: React.FC<StudentExamSchedulerProps> = ({ currentUser }) => {
  const isCoordinator = currentUser.role === 'department_coordinator';
  const [activeTab, setActiveTab] = useState<'upcoming' | 'drafts' | 'completed'>('upcoming');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            ACADEMIC TERM 2026-27 • MIDTERM CYCLE II
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Exam Scheduler
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, validate, and publish clash-free campus examination timetables with SAT constraint engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Roster (Excel)</span>
          </button>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Clash Checker: All Clear</span>
          </span>
          {isCoordinator && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL SCHEDULED</div>
          <div className="text-3xl font-black text-slate-900 mt-1">48</div>
          <div className="text-[11px] text-slate-500 mt-2">Midterms • Across 4 Schools</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HALLS ALLOCATED</div>
          <div className="text-3xl font-black text-slate-900 mt-1">18</div>
          <div className="text-[11px] text-slate-500 mt-2">Blocks • 2,450 Seat Capacity</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SAT ENGINE STATUS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">100%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Collision-Free • 0 Conflict Paths</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">INVIGILATOR DUTY</div>
          <div className="text-3xl font-black text-slate-900 mt-1">74 / 74</div>
          <div className="text-[11px] text-slate-500 mt-2">Faculty Assigned • Full Quota</div>
        </div>
      </div>

      {/* Master Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Upcoming Exams <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full text-[10px]">36</span>
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Drafts <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">8</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filter by Subject name or Code..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
            />
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <option>CSE (Computer Science)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Subject & Code</th>
                <th className="p-3.5">Dept / Sem</th>
                <th className="p-3.5">Candidates</th>
                <th className="p-3.5">Allocated Venue</th>
                <th className="p-3.5">Invigilators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  dt: '25 Oct 2026 • 09:00 AM – 12:00 PM',
                  sub: 'Operating Systems',
                  code: 'CS302 • Core Theory',
                  dept: 'CSE • 3rd Sem',
                  cand: '128 Candidates',
                  ven: 'B-Block 301, 302',
                  venSub: '64 seats / room',
                  inv: 'Dr. M. Sen (Lead)',
                  invSub: 'Dr. R. Pattnaik',
                },
                {
                  dt: '26 Oct 2026 • 09:00 AM – 12:00 PM',
                  sub: 'Data Structures & Algorithms',
                  code: 'CS301 • Major Theory',
                  dept: 'CSE • 3rd Sem',
                  cand: '134 Candidates',
                  ven: 'Main Audi, Hall 102',
                  venSub: 'Tiered Auditorium',
                  inv: 'Prof. K. Nayak (Lead)',
                  invSub: 'Er. P. Das',
                },
                {
                  dt: '28 Oct 2026 • 02:00 PM – 05:00 PM',
                  sub: 'Cyber Security & Cryptography',
                  code: 'CS405 • Specialization',
                  dept: 'CSE • 5th Sem',
                  cand: '96 Candidates',
                  ven: 'B-Block 204, 205',
                  venSub: '48 seats / room',
                  inv: 'Dr. R. Pattnaik (Solo)',
                  invSub: 'Staff Escort Assigned',
                },
                {
                  dt: '02 Nov 2026 • 09:00 AM – 12:00 PM',
                  sub: 'Database Management Systems',
                  code: 'CS303 • Core Theory',
                  dept: 'CSE • 3rd Sem',
                  cand: '130 Candidates',
                  ven: 'Hall 201, 202',
                  venSub: 'Needs Capacity Audit',
                  inv: 'Prof. A. Mohanty',
                  invSub: 'Requires 2nd Faculty',
                },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-semibold text-slate-800">{row.dt}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{row.sub}</div>
                    <div className="text-[10px] text-slate-400">{row.code}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {row.dept}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{row.cand}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{row.ven}</div>
                    <div className="text-[10px] text-slate-400">{row.venSub}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-slate-800">{row.inv}</div>
                    <div className="text-[10px] text-slate-500">{row.invSub}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: Saturation & Invigilation Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Seating Capacity & Venue Saturation</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">DAY SHIFT 1</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700">Main Auditorium (Central Hall)</span>
                <span className="font-bold text-blue-600">340 / 400 Seats (85%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[85%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700">B-Block Hall 301 (Level 3)</span>
                <span className="font-bold text-red-600">120 / 120 Seats (100%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Invigilation Workload Balance</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">COE AUDIT READY</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Dr. M. Sen</span>
                <div className="text-[10px] text-slate-400">Dept. of Computer Science</div>
              </div>
              <span className="text-emerald-700 font-bold">3 / 4 Slots (Balanced)</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Dr. R. Pattnaik</span>
                <div className="text-[10px] text-slate-400">Dept. of Computer Science</div>
              </div>
              <span className="text-red-600 font-bold">4 / 4 Slots (Max Cap)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
