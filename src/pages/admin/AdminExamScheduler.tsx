import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Send,
  Download,
  AlertCircle,
  Clock,
  Lock,
} from 'lucide-react';
import { UserItem, ExamItem } from '../../types';

interface AdminExamSchedulerProps {
  currentUser: UserItem;
  exams?: ExamItem[];
}

export const AdminExamScheduler: React.FC<AdminExamSchedulerProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'drafts' | 'completed'>('upcoming');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const examRows = [
    {
      code: 'CSE-401',
      title: 'Distributed Algorithms',
      type: 'Theory • 3.0 Credits • 100 Marks',
      cohort: 'B.Tech CSE - Sem 7',
      date: 'Mon, 19 Oct 2026',
      shift: '09:00 - 12:00 (Shift 1)',
      venue: 'D-Block 301 & 302',
      venueCap: 'Capacity: 240 desks',
      candidates: 218,
      percent: '91% filled',
      lead: 'Prof. K. Mohapatra (Lead)',
      asst: 'Dr. Ananya Roy (Asst)',
      status: 'Verified Clash-Free',
    },
    {
      code: 'ECE-304',
      title: 'VLSI System Design',
      type: 'Theory • 4.0 Credits • 100 Marks',
      cohort: 'B.Tech ECE - Sem 5',
      date: 'Mon, 19 Oct 2026',
      shift: '14:00 - 17:00 (Shift 2)',
      venue: 'Tiered Main Auditorium',
      venueCap: 'Capacity: 600 desks',
      candidates: 510,
      percent: '85% filled',
      lead: 'Prof. Tariq Siddiqui (Lead)',
      asst: 'Dr. B. Sengupta (Asst)',
      status: 'Verified Clash-Free',
    },
    {
      code: 'ME-202',
      title: 'Applied Thermodynamics',
      type: 'Theory • 3.5 Credits • 100 Marks',
      cohort: 'B.Tech ME - Sem 3',
      date: 'Tue, 20 Oct 2026',
      shift: '09:00 - 12:00 (Shift 1)',
      venue: 'C-Block Hall 104 & 105',
      venueCap: 'Capacity: 200 desks',
      candidates: 186,
      percent: '93% filled',
      lead: 'Dr. R. V. Ramanujan (Lead)',
      asst: 'Er. M. Das (Asst)',
      status: 'Verified Clash-Free',
    },
    {
      code: 'DSAI-501',
      title: 'Deep Learning Foundations',
      type: 'Theory + Practical • 4.0 Credits',
      cohort: 'M.Tech AI - Sem 1',
      date: 'Tue, 20 Oct 2026',
      shift: '14:00 - 17:00 (Shift 2)',
      venue: 'Central Seminar Hall 2',
      venueCap: 'Capacity: 120 desks',
      candidates: 96,
      percent: '80% filled',
      lead: 'Dr. Meera Nambiar (Lead)',
      asst: 'Prof. S. Swain (Asst)',
      status: 'Verified Clash-Free',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Hash Validation Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">
                COE Hash Validation: Autumn-Midterm-2026-SAT#09BF
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                SIGNATURE IMMUTABLE
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Authorized by Controller of Examinations, Chilika Institute of Technology. Engine Seed:{' '}
              <span className="font-mono text-slate-700">0x7F993...A12B</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">AUDIT HASH</span>
            <span className="font-mono font-bold text-slate-700">e3b0c442...98b2f1</span>
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 shadow-2xs">
            Verify Ledger
          </button>
        </div>
      </div>

      {/* Main Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            CITSCHEDULE OPERATIONS • MIDTERM CYCLE 2026
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Central Examination Governance & Scheduling
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-End Midterm & End-Semester Examination Orchestration with SAT Constraint Validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            Run Global Conflict Audit
          </button>
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            Publish Examination Roster
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2">
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule New Exam</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL SCHEDULED EXAMS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">48</span>
            <span className="text-xs font-semibold text-slate-500">Midterm Term</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Department Coverage: <strong className="text-slate-800">12 / 12 Depts</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ALLOCATED HALLS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">18</span>
            <span className="text-xs font-semibold text-slate-500">Blocks</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Total Seat Capacity: <strong className="text-slate-800">2,450 Desks</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CLASH PREVENTION ENGINE</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">100%</span>
            <span className="text-xs font-bold text-emerald-600">Clean</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Constraint Verifier: <strong className="text-blue-600">SAT v4.8 Optimal</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">INVIGILATION ROSTER</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">74</span>
            <span className="text-xs font-semibold text-slate-500">/ 74</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Quota Attainment: <strong className="text-emerald-600">100% Assigned</strong></div>
        </div>
      </div>

      {/* Middle Row: Room Saturation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">Room Saturation & Campus Distance Footprint</div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            Safe Distance ≥ 1.2m
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Auditorium East</span>
              <span className="text-blue-600">85%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tiered Amphitheater</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-blue-600 h-full w-[85%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>510 / 600 Desks</span>
              <span className="text-blue-600 font-semibold">90 Buffer Left</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>B-Block Annex</span>
              <span className="text-red-600">100%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Rooms 301, 302, 305</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-red-500 h-full w-full"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>420 / 420 Desks</span>
              <span className="text-red-600 font-bold">CAPPED</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>C-Block Tech</span>
              <span className="text-emerald-600">62%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Halls 101 through 108</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[62%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>560 / 900 Desks</span>
              <span className="text-emerald-600 font-semibold">340 Buffer Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures Table Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Upcoming Exams <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full text-[10px]">36</span>
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Draft Allocations <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">8</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'completed' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              Completed Exams <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">4</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter code or venue..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              />
            </div>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
              <option>All Departments</option>
              <option>CSE</option>
              <option>ECE</option>
              <option>ME</option>
            </select>
          </div>
        </div>

        {/* Exam Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-3.5">SUBJECT CODE & MODULE</th>
                <th className="p-3.5">COHORT & DEPT</th>
                <th className="p-3.5">SHIFT WINDOW & DATE</th>
                <th className="p-3.5">ASSIGNED VENUE</th>
                <th className="p-3.5">CANDIDATES</th>
                <th className="p-3.5">INVIGILATORS</th>
                <th className="p-3.5">SAT ENGINE STATUS</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-black text-slate-900">{row.code}</div>
                    <div className="font-semibold text-slate-700">{row.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{row.type}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                      {row.cohort}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{row.date}</div>
                    <div className="text-[10px] text-blue-600 font-semibold">{row.shift}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{row.venue}</div>
                    <div className="text-[10px] text-slate-400">{row.venueCap}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-black text-slate-900">{row.candidates}</div>
                    <div className="text-[10px] text-slate-400">{row.percent}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="text-slate-800 font-medium">{row.lead}</div>
                    <div className="text-slate-500 text-[10px]">{row.asst}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>{row.status}</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 4 of 36 midterm fixtures • Zero hard collisions detected</span>
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">Previous</button>
            <button className="px-2 py-1 bg-blue-600 text-white rounded font-bold">1</button>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">2</button>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">Next</button>
          </div>
        </div>
      </div>

      {/* 3 Bottom Governance Guards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start space-x-3 text-xs">
          <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <div className="font-bold text-slate-800">Session Gap Enforcer</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Min. 120 mins buffer between dual shifts per cohort</div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start space-x-3 text-xs">
          <Users className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <div className="font-bold text-slate-800">Faculty Invigilation Equity</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Standardized duty cycle: 3 shifts / faculty max</div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start space-x-3 text-xs">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <div className="font-bold text-slate-800">Schedule Lock Status</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Editing frozen for 72 hrs preceding exam date</div>
          </div>
        </div>
      </div>
    </div>
  );
};
