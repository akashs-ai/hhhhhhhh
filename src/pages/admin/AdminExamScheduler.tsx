import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Search,
  Filter,
  Plus,
  Send,
  Download,
  AlertCircle,
  Clock,
  Lock,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { UserItem, ExamItem } from '../../types';
import {
  examService,
  ExamCounts,
  ExamAuditConflict,
  ExamAuditResult,
} from '../../services/examService';

interface AdminExamSchedulerProps {
  currentUser: UserItem;
  exams?: ExamItem[];
}

export const AdminExamScheduler: React.FC<AdminExamSchedulerProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'drafts' | 'completed'>('upcoming');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Real Backend Data State
  const [examList, setExamList] = useState<ExamItem[]>([]);
  const [counts, setCounts] = useState<ExamCounts>({ total: 0, upcoming: 0, drafts: 0, completed: 0 });
  const [rosterStatus, setRosterStatus] = useState<'published' | 'draft'>('published');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishedBy, setPublishedBy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal States
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ summary: ExamAuditResult; conflicts: ExamAuditConflict[] } | null>(null);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Exam Form State
  const [formData, setFormData] = useState({
    course_id: 'CS301',
    title: 'Data Structures and Algorithms',
    groups: 'CSE-2A, CSE-2B',
    day: 'TUE',
    session: 'AM' as 'AM' | 'PM',
    rooms: 'AUD, LH-1',
    size: 180,
    duration_hours: 2,
    chief_invigilator: 'Dr. R. Pattnaik (Lead)',
  });

  // Load live data from server
  const loadExams = async () => {
    setIsLoading(true);
    try {
      const res = await examService.getExams(currentUser.token, {
        status: activeTab,
        department: selectedDept,
        search: searchFilter,
      });
      setExamList(res.data);
      setCounts(res.counts);
      setRosterStatus(res.roster_status);
      setPublishedAt(res.published_at);
      setPublishedBy(res.published_by);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to load examination timetable.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [activeTab, selectedDept, searchFilter]);

  // Action A: Run Global Conflict Audit
  const handleRunAudit = async () => {
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const res = await examService.runConflictAudit(currentUser.token);
      setAuditResult(res);
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Audit execution failed.' });
      setIsAuditModalOpen(false);
    } finally {
      setIsAuditing(false);
    }
  };

  // Action B: Publish Examination Roster
  const handlePublishRoster = async () => {
    setIsPublishing(true);
    setActionNotice(null);
    try {
      const res = await examService.publishRoster(currentUser.token);
      setActionNotice({ type: 'success', message: res.message });
      setIsPublishModalOpen(false);
      await loadExams();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Roster publication failed.' });
      setIsPublishModalOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  // Action C: Schedule New Exam
  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsScheduling(true);

    try {
      const groupsArray = formData.groups.split(',').map((g) => g.trim()).filter(Boolean);
      const roomsArray = formData.rooms.split(',').map((r) => r.trim()).filter(Boolean);

      if (groupsArray.length === 0 || roomsArray.length === 0) {
        throw new Error('Please specify at least one eligible student group and one examination hall.');
      }

      await examService.scheduleExam(
        {
          course_id: formData.course_id.trim().toUpperCase(),
          title: formData.title.trim(),
          groups: groupsArray,
          day: formData.day,
          session: formData.session,
          rooms: roomsArray,
          size: Number(formData.size) || 100,
          duration_hours: Number(formData.duration_hours) || 2,
          chief_invigilator: formData.chief_invigilator,
        },
        currentUser.token
      );

      setActionNotice({
        type: 'success',
        message: `Examination for ${formData.course_id} scheduled successfully into ${formData.day} ${formData.session}.`,
      });
      setIsScheduleModalOpen(false);
      await loadExams();
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule exam.');
    } finally {
      setIsScheduling(false);
    }
  };

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
                COE Governance Engine: Midterm-Cycle-2026-SAT#09BF
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rosterStatus === 'published'
                    ? 'text-emerald-700 bg-emerald-100'
                    : 'text-amber-700 bg-amber-100'
                }`}
              >
                {rosterStatus === 'published' ? 'OFFICIALLY PUBLISHED' : 'DRAFT IN REVIEW'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Authorized by Controller of Examinations & Academic Dean. Engine Seed:{' '}
              <span className="font-mono text-slate-700">0x7F993A12B</span>
              {publishedAt && (
                <span className="ml-2 text-slate-600">
                  • Published {new Date(publishedAt).toLocaleDateString()} by {publishedBy || 'Dean'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">LEDGER SIGNATURE</span>
            <span className="font-mono font-bold text-slate-700">e3b0c442...98b2f1</span>
          </div>
          <button
            onClick={loadExams}
            title="Refresh examination timetable data"
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : actionNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          {/* Action A: Run Global Conflict Audit */}
          <button
            onClick={handleRunAudit}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Run Global Conflict Audit</span>
          </button>

          {/* Action B: Publish Examination Roster */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Publish Examination Roster</span>
          </button>

          {/* Action C: Schedule New Exam */}
          <button
            onClick={() => {
              setFormError(null);
              setIsScheduleModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule New Exam</span>
          </button>
        </div>
      </div>

      {/* Middle Row: Room Saturation & Venue Capacity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">Room Saturation & Safe Seating Footprint</div>
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            Safe Half-Capacity Seat Spacing ≥ 1.2m
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Auditorium Complex</span>
              <span className="text-blue-600">85%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tiered Amphitheater (AUD)</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-blue-600 h-full w-[85%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>250 / 300 Exam Seats</span>
              <span className="text-blue-600 font-semibold">50 Available</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Lecture Halls (LH-1 to LH-5)</span>
              <span className="text-emerald-600">68%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Academic Complex Block A</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[68%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>340 / 500 Exam Seats</span>
              <span className="text-emerald-600 font-semibold">160 Available</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Classrooms (CR-101 to CR-205)</span>
              <span className="text-purple-600">62%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tutorial & Department Halls</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-purple-500 h-full w-[62%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>420 / 680 Exam Seats</span>
              <span className="text-purple-600 font-semibold">260 Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Fixtures Table Filter with Live Record Counts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {/* Filter 1: Upcoming Exams */}
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Upcoming Exams{' '}
              <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {counts.upcoming}
              </span>
            </button>

            {/* Filter 2: Draft Allocations */}
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'drafts'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Draft Allocations{' '}
              <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                {counts.drafts}
              </span>
            </button>

            {/* Filter 3: Completed Exams */}
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'completed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Completed Exams{' '}
              <span className="ml-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                {counts.completed}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter code, course, or venue..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="EE">EE</option>
              <option value="CE">CE</option>
              <option value="MA">MA</option>
              <option value="PH">PH</option>
              <option value="COMMON">First Year</option>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading examination records...</span>
                  </td>
                </tr>
              ) : examList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No examinations found in this view</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No examinations match active filter: <strong>{activeTab}</strong>.
                    </p>
                    {(selectedDept !== 'ALL' || searchFilter) && (
                      <button
                        onClick={() => {
                          setSelectedDept('ALL');
                          setSearchFilter('');
                        }}
                        className="mt-3 text-xs font-bold text-blue-600 hover:underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                examList.map((row) => (
                  <tr key={row.exam_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{row.course_ids.join(', ')}</div>
                      <div className="font-semibold text-slate-700">{row.course_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {row.duration_hours}h Slot • {row.exam_id}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {row.cohort}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                        Dept: {row.department}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-blue-600">{row.date}</div>
                      <div className="text-[11px] text-slate-600">{row.timing}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{row.venue_names}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Capacity: {row.total_allocated_capacity} exam seats
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{row.size} candidates</div>
                      <div
                        className={`text-[10px] font-semibold ${
                          row.capacity_compliant ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {row.capacity_compliant ? `${row.percent_filled} filled` : 'Capacity Deficit'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{row.chief_invigilator}</div>
                      {row.invigilators?.[1] && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Asst: {row.invigilators[1]}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'completed'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : row.status === 'draft'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {row.status === 'completed' ? (
                          'Completed'
                        ) : row.status === 'draft' ? (
                          'Draft Allocation'
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Verified Clash-Free
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL A: Global Conflict Audit Results */}
      {/* ===================================================================== */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  SAT Engine Global Conflict Audit
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAuditing ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="font-semibold text-sm">Evaluating examination constraints...</p>
                <p className="text-xs text-slate-400">
                  Testing room double-bookings (H4), student group collisions (H3), and half-capacity limits (H5).
                </p>
              </div>
            ) : auditResult ? (
              <div className="space-y-4">
                {/* Audit Summary Box */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    auditResult.summary.status === 'PASS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div>
                    <div className="font-black text-sm flex items-center space-x-2">
                      <span>AUDIT RESULT: {auditResult.summary.status}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70">
                        {auditResult.summary.engine_hash}
                      </span>
                    </div>
                    <div className="text-xs mt-1">
                      Audited {auditResult.summary.total_exams_audited} scheduled examinations. Critical Conflicts:{' '}
                      <strong>{auditResult.summary.critical_conflicts}</strong> • Warnings:{' '}
                      <strong>{auditResult.summary.warnings}</strong>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {new Date(auditResult.summary.audit_timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Conflict List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Findings & Diagnostics ({auditResult.conflicts.length})
                  </h4>

                  {auditResult.conflicts.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                      <p className="font-bold text-slate-800">All Constraints Verified Clash-Free</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Zero room collisions, student group overlaps, or capacity deficits detected across the timetable.
                      </p>
                    </div>
                  ) : (
                    auditResult.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          c.severity === 'CRITICAL'
                            ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                            : 'bg-amber-50/50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center space-x-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                c.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {c.rule}
                            </span>
                            <span>{c.type}</span>
                          </span>
                          <span className="text-[11px]">
                            {c.day} • {c.session}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">{c.description}</p>
                        <div className="text-[10px] font-semibold text-blue-700 bg-white/70 p-1.5 rounded border border-blue-100">
                          <strong>Resolution:</strong> {c.suggested_resolution}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsAuditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Close Audit Report
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL B: Publish Examination Roster Confirmation */}
      {/* ===================================================================== */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Publish Official Examination Roster
                </h3>
                <p className="text-xs text-slate-500">Controller of Examinations Authorization</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
              <p>
                You are about to sign off and publish the official examination schedule containing{' '}
                <strong>{counts.total} examinations</strong> across all batches.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
                <li>Makes the timetable visible immediately on Student and Faculty portals.</li>
                <li>Validates all SAT clash-free constraints before committing.</li>
                <li>Logs your cryptographic identity ({currentUser.name}) into the immutable COE audit ledger.</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isPublishing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRoster}
                disabled={isPublishing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying & Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sign Off & Publish Roster</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL C: Schedule New Exam Form */}
      {/* ===================================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Schedule Examination Session</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    placeholder="e.g. CS301, EC202"
                    className="w-full p-2 border border-slate-200 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="MON">MON (19 Oct)</option>
                    <option value="TUE">TUE (20 Oct)</option>
                    <option value="WED">WED (21 Oct)</option>
                    <option value="THU">THU (22 Oct)</option>
                    <option value="FRI">FRI (23 Oct)</option>
                    <option value="SAT">SAT (24 Oct)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift / Session</label>
                  <select
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value as 'AM' | 'PM' })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="AM">AM (09:30 - 11:30)</option>
                    <option value="PM">PM (14:00 - 16:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidates (Size)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Eligible Student Cohort Groups (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.groups}
                  onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
                  placeholder="e.g. CSE-2A, CSE-2B"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned Exam Halls / Rooms (Comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  placeholder="e.g. AUD, LH-1, CR-101"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Allocates 50% half-capacity seating per hall to ensure required spacing.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lead Invigilator</label>
                <input
                  type="text"
                  value={formData.chief_invigilator}
                  onChange={(e) => setFormData({ ...formData, chief_invigilator: e.target.value })}
                  placeholder="e.g. Dr. R. Pattnaik (Lead)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={isScheduling}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1.5"
                >
                  {isScheduling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Examination Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
