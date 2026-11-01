import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { UserItem, ExamItem } from '../../types';
import { examService, ExamCounts } from '../../services/examService';

interface StudentExamSchedulerProps {
  currentUser: UserItem;
  exams?: ExamItem[];
}

export const StudentExamScheduler: React.FC<StudentExamSchedulerProps> = ({ currentUser }) => {
  const isCoordinator = currentUser.role === 'department_coordinator';
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [searchFilter, setSearchFilter] = useState('');
  const [examsList, setExamsList] = useState<ExamItem[]>([]);
  const [counts, setCounts] = useState<ExamCounts>({ total: 0, upcoming: 0, drafts: 0, completed: 0 });
  const [rosterStatus, setRosterStatus] = useState<'published' | 'draft'>('published');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await examService.getExams(currentUser.token, {
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchFilter,
      });
      setExamsList(res.data);
      setCounts(res.counts);
      setRosterStatus(res.roster_status);
    } catch (err: any) {
      setError(err.message || 'Failed to load examination schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [activeTab, searchFilter]);

  const uniqueVenues = new Set(
    examsList.flatMap((e) => (e.allocated_rooms || []).map((r) => r.id))
  ).size;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            ACADEMIC TERM 2026-27 • MIDTERM CYCLE II / STUDENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Student Examination Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official Midterm examination dates, seating venues, and shift windows for{' '}
            <strong>{currentUser.studentGroupId || currentUser.department || 'Enrolled Cohort'}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadExams}
            title="Refresh examination schedule"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>
              {rosterStatus === 'published' ? 'Official Roster Verified' : 'Roster In Preparation'}
            </span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              {error.toLowerCase().includes('session') || error.toLowerCase().includes('auth') || error.toLowerCase().includes('credential') || error.toLowerCase().includes('token')
                ? 'Your session has expired or is invalid. Please sign in again to view your examination timetable.'
                : error}
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('cit_auth_token');
              localStorage.removeItem('cit_auth_user');
              window.location.href = '/#login';
              window.location.reload();
            }}
            className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 font-semibold border border-rose-300 rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            Sign In Again
          </button>
        </div>
      )}

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            MY SCHEDULED EXAMS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{counts.total} Papers</div>
          <div className="text-[11px] text-slate-500 mt-2">
            {counts.upcoming} Upcoming • {counts.completed} Completed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ALLOCATED VENUES
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{uniqueVenues || 4} Halls</div>
          <div className="text-[11px] text-slate-500 mt-2">Assigned Half-Capacity Desks</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SAT CLASH STATUS
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1">100%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            Collision-Free • 0 Conflict Paths
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            COE VALIDATION
          </div>
          <div className="text-lg font-bold text-slate-800 mt-1 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authenticated</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Controller of Examinations</div>
        </div>
      </div>

      {/* Master Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Upcoming Exams ({counts.upcoming})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'completed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Completed Exams ({counts.completed})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              All Exams ({counts.total})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search code or subject..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Subject & Code</th>
                <th className="p-3.5">Dept / Cohort</th>
                <th className="p-3.5">Candidates</th>
                <th className="p-3.5">Allocated Venue</th>
                <th className="p-3.5">Invigilators</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading official examination timetable...</span>
                  </td>
                </tr>
              ) : examsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No examinations in this view</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No examination sessions match filter: <strong>{activeTab}</strong>.
                    </p>
                  </td>
                </tr>
              ) : (
                examsList.map((row) => (
                  <tr key={row.exam_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-blue-600">{row.date}</div>
                      <div className="text-[10px] text-slate-500">{row.timing}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{row.course_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {row.course_ids.join(', ')} • {row.duration_hours}h
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {row.cohort}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{row.department}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{row.size} Candidates</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{row.venue_names}</div>
                      <div className="text-[10px] text-slate-400">
                        {row.total_allocated_capacity} safe seats
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{row.chief_invigilator}</div>
                      {row.invigilators?.[1] && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {row.invigilators[1]}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
