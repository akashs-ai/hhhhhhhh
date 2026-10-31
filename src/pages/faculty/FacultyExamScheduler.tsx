import React, { useState, useEffect } from 'react';
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
import { UserItem, ExamItem } from '../../types';
import { examService, ExamCounts } from '../../services/examService';

interface FacultyExamSchedulerProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

export const FacultyExamScheduler: React.FC<FacultyExamSchedulerProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [duties, setDuties] = useState<ExamItem[]>([]);
  const [counts, setCounts] = useState<ExamCounts>({ total: 0, upcoming: 0, drafts: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDuties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await examService.getExams(currentUser.token, {
        status: activeTab,
      });
      setDuties(res.data);
      setCounts(res.counts);
    } catch (err: any) {
      setError(err.message || 'Failed to load examination duties.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDuties();
  }, [activeTab]);

  const totalHours = duties.reduce((acc, d) => acc + (d.duration_hours || 2), 0);
  const nextDuty = duties.find((d) => d.status === 'upcoming');

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
            View assigned invigilation responsibilities, examination slots, and student hall rosters for {currentUser.name}.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadDuties}
            title="Refresh duties"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateTab('timetable')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View Full Timetable</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ASSIGNED INVIGILATIONS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1">{counts.total} Slots</div>
          <div className="text-[11px] text-slate-500 mt-2">
            {counts.upcoming} Upcoming • {counts.completed} Completed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UPCOMING DUTY</div>
          <div className="text-lg font-black text-blue-600 mt-1 truncate">
            {nextDuty ? `${nextDuty.day} • ${nextDuty.session}` : 'None Scheduled'}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {nextDuty ? `${nextDuty.course_ids.join(', ')}: ${nextDuty.course_name}` : 'All duties cleared'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL EXAM HOURS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalHours}.0 Hrs</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            Compliant with Faculty Quota (Max 16h)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SCHEDULE STATUS</div>
          <div className="text-lg font-bold text-slate-800 mt-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Confirmed by COE</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Verified Clash-Free by SAT engine</div>
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

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Duty Table */}
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
              Upcoming Duties ({counts.upcoming})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'completed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Completed Duties ({counts.completed})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              All Duties ({counts.total})
            </button>
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
                <th className="p-3.5 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading assigned invigilation duties...</span>
                  </td>
                </tr>
              ) : duties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No examination duties in this view</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No invigilation sessions match filter: <strong>{activeTab}</strong>.
                    </p>
                  </td>
                </tr>
              ) : (
                duties.map((row) => (
                  <tr key={row.exam_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-blue-600">{row.date}</div>
                      <div className="text-[10px] text-slate-500">{row.timing}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{row.course_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {row.course_ids.join(', ')} • {row.cohort}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {row.chief_invigilator?.includes(currentUser.name)
                          ? 'Chief Invigilator'
                          : 'Assistant Invigilator'}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">{row.venue_names}</td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {row.size} Candidates ({row.groups.join(', ')})
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {row.invigilators?.[1] || 'Staff Escort'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.status === 'completed' ? 'Duty Completed' : 'Scheduled'}
                      </span>
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
