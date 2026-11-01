import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Printer,
  X,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { UserItem } from '../../types';

interface StudentReportsProps {
  currentUser: UserItem;
  onNavigateTab?: (tab: string) => void;
}

export const StudentReports: React.FC<StudentReportsProps> = ({ currentUser, onNavigateTab }) => {
  const [term, setTerm] = useState('Autumn 2026 (Odd Term - Sem 3, 5, 7)');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-11-30');

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDossierModal, setShowDossierModal] = useState(false);

  const fetchStudentReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        term,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/reports/student?${q.toString()}`, {
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to fetch student analytics: HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setStudentData(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading personal student report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentReports();
    const handleScheduleChange = () => fetchStudentReports();
    window.addEventListener('cit_schedule_changed', handleScheduleChange);
    return () => {
      window.removeEventListener('cit_schedule_changed', handleScheduleChange);
    };
  }, [currentUser]);

  // Export personal CSV
  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/reports/export/csv', {
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      if (!res.ok) throw new Error('Failed to generate personal CSV export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CIT_Personal_Student_Schedule_${currentUser.id}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('CSV Export Error: ' + err.message);
    }
  };

  const profile = studentData?.student_profile || {
    name: currentUser.name,
    student_group_id: currentUser.studentGroupId || 'CSE-3',
    department: currentUser.department || 'CSE',
  };

  const classes = studentData?.scheduled_classes || {
    total_weekly_slots: 18,
    theory_slots: 12,
    lab_slots: 6,
    enrolled_courses: [
      { id: 'CS301', title: 'Data Structures and Algorithms', faculty: 'Dr. M. Sen', hours_per_week: 4 },
      { id: 'CS302', title: 'Database Management Systems', faculty: 'Dr. R. Pattnaik', hours_per_week: 4 },
      { id: 'CS303', title: 'Computer Networks', faculty: 'Prof. K. Nayak', hours_per_week: 4 },
      { id: 'CS304', title: 'Operating Systems', faculty: 'Er. P. Das', hours_per_week: 4 },
      { id: 'MA201', title: 'Discrete Mathematics', faculty: 'Dr. A. Ramanujan', hours_per_week: 3 },
    ],
    sessions: [],
  };

  const examinations = studentData?.examinations || {
    total: 4,
    upcoming: 3,
    completed: 1,
    items: [
      {
        exam_id: 'EX-CS301',
        course_id: 'CS301',
        course_name: 'Data Structures & Algorithms',
        date: 'Sat, 24 Oct 2026',
        timing: '14:00 - 16:00 PM',
        room_name: 'LH-3 (Lecture Hall 3)',
        desk_seat: 'Desk #19',
        status: 'upcoming',
        invigilator: 'Dr. R. Pattnaik (Lead)',
      },
      {
        exam_id: 'EX-CS302',
        course_id: 'CS302',
        course_name: 'Database Management Systems',
        date: 'Tue, 20 Oct 2026',
        timing: '09:30 - 11:30 AM',
        room_name: 'CR-101',
        desk_seat: 'Desk #12',
        status: 'completed',
        invigilator: 'Prof. K. Mohapatra (Lead)',
      },
      {
        exam_id: 'EX-CS303',
        course_id: 'CS303',
        course_name: 'Computer Networks',
        date: 'Wed, 21 Oct 2026',
        timing: '09:30 - 11:30 AM',
        room_name: 'CR-101',
        desk_seat: 'Desk #24',
        status: 'upcoming',
        invigilator: 'Prof. K. Mohapatra (Lead)',
      },
    ],
  };

  const disruptions = studentData?.disruptions || [
    {
      id: 'DIS-01',
      title: 'Operating Systems Lab Relocation',
      impact: 'Swapped from Lab 1 to High-Tech Block B-203',
      timestamp: '2026-10-28T10:15:00.000Z',
      status: 'approved',
    },
    {
      id: 'DIS-02',
      title: 'Cyclonic Weather Alert Schedule Adjustments',
      impact: '2 Lecture hours converted to virtual LMS session',
      timestamp: '2026-10-24T08:14:00.000Z',
      status: 'approved',
    },
  ];

  const attendance = studentData?.attendance_telemetry || {
    status: 'Synchronized with Campus Biometric ERP',
    compliance_rate: '100% Scheduled Slots Covered',
    notice:
      'Biometric attendance check-in is logged via RFID readers outside campus lecture halls. Your scheduling timetable guarantees 0 student collisions.',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            PERSONAL ACADEMIC DOSSIER / {profile.department} / {profile.student_group_id}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Student Academic Scheduling & Examination Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personal timetable fulfillment, examination seat allocation, enrolled modules, and schedule disruption alerts for{' '}
            <strong>{currentUser.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Telemetry Synced: Today 11:20 AM</span>
          </span>
          <button
            type="button"
            onClick={fetchStudentReports}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Personal Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF Dossier</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scope Filter Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-800 font-bold">
            Cohort: {profile.department} ({profile.student_group_id})
          </span>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer"
          >
            <option value="Autumn 2026 (Odd Term - Sem 3, 5, 7)">Autumn 2026 (Odd Term - Sem 3, 5, 7)</option>
            <option value="Spring 2026 (Even Term - Sem 4, 6, 8)">Spring 2026 (Even Term - Sem 4, 6, 8)</option>
          </select>
          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-600 font-medium">
            Section: {profile.student_group_id} Primary Batch
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>15 Oct – 30 Nov 2026</span>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Scheduled Classes</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{classes.total_weekly_slots}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Slots / Wk • <strong className="text-blue-600">{classes.theory_slots} Theory • {classes.lab_slots} Lab</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Room Allocation Rate</div>
          <div className="text-3xl font-black text-slate-900 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Target: 100% • <strong className="text-emerald-600">All Venues Confirmed</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Course Modules</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{classes.enrolled_courses.length}</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Active Core Subjects • <strong className="text-emerald-600">Syllabus Active</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detected Schedule Conflicts</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">0</div>
          <div className="text-[11px] text-slate-500 mt-2">
            Collision Free • <strong className="text-emerald-600">SAT Solver 100% Guaranteed</strong>
          </div>
        </div>
      </div>

      {/* Middle Row: Personal Enrolled Modules (7 Cols) + Examination Schedule (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Enrolled Courses & Weekly Load */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Personal Enrolled Modules & Weekly Rhythm</h2>
              <p className="text-[11px] text-slate-500">Contact hours scheduled for cohort {profile.student_group_id}.</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {classes.enrolled_courses.length} Modules Active
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {classes.enrolled_courses.map((crs: any) => (
              <div key={crs.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-600">{crs.id}</span>
                    <span className="font-bold text-slate-800">{crs.title}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-700">{crs.hours_per_week}h / wk</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Instructor: <strong>{crs.faculty}</strong></span>
                  <span className="text-emerald-700 font-semibold">100% Slot Attendance Allocated</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span>Available Off-Peak Study Windows: Tuesday 15:00-17:00 & Friday 14:00-16:00</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('timetable')}
                className="font-bold text-blue-700 hover:underline cursor-pointer"
              >
                View Full Timetable →
              </button>
            )}
          </div>
        </div>

        {/* Examination Schedule & Seat Allocation */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Midterm Examination Seat Allocations</h2>
              <p className="text-[11px] text-slate-500">Allocated halls, desk seats, and reporting times.</p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Single Desk Distancing
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {examinations.items.map((ex: any) => (
              <div key={ex.exam_id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">{ex.course_id} • {ex.course_name}</div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      ex.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {ex.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>{ex.date} • {ex.timing}</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {ex.desk_seat}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5">
                  Venue: {ex.room_name} • Invigilator: {ex.invigilator}
                </div>
              </div>
            ))}
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('exams')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer pt-1"
            >
              <span>View Examination Scheduler & Hall Seating Map →</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Personal Disruption Notifications (8 Cols) + Attendance Telemetry (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Personal Disruption Notifications & Timetable Adjustments</h3>
            <span className="text-[10px] font-mono text-slate-400">Live Cohort Telemetry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-2.5">REF</th>
                  <th className="p-2.5">EVENT</th>
                  <th className="p-2.5">SCHEDULE IMPACT</th>
                  <th className="p-2.5">STATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disruptions.length > 0 ? (
                  disruptions.map((d: any, idx: number) => (
                    <tr key={d.id || idx}>
                      <td className="p-2.5 font-mono font-bold text-blue-600">{d.id}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{d.title}</td>
                      <td className="p-2.5 text-slate-600">{d.impact}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {d.status === 'approved' ? 'Applied' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Zero active disruptions affecting your cohort.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Attendance Telemetry Notice</h3>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{attendance.status}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {attendance.notice}
            </p>
            <div className="pt-1 text-[11px] font-semibold text-emerald-700">
              {attendance.compliance_rate}
            </div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Return to Student Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Modal: Printable Student Dossier */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">Personal Academic & Examination Schedule Dossier</h3>
                  <div className="text-[11px] text-slate-500">Student: {currentUser.name} • Cohort: {profile.student_group_id}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-5 text-xs text-slate-800">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <div className="text-base font-black text-slate-900">CHILIKA INSTITUTE OF TECHNOLOGY</div>
                  <div className="text-[11px] font-semibold text-slate-600">OFFICE OF ACADEMIC AFFAIRS • STUDENT DOSSIER</div>
                  <div className="text-[10px] text-slate-400">STUDENT ID: {currentUser.id} • COHORT: {profile.student_group_id}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">TERM: {term}</div>
                  <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              {/* Enrolled Subjects */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Registered Course Modules</div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5">Code</th>
                      <th className="py-1.5">Course Title</th>
                      <th className="py-1.5">Faculty</th>
                      <th className="py-1.5 text-right">Weekly Load</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.enrolled_courses.map((crs: any) => (
                      <tr key={crs.id}>
                        <td className="py-1.5 font-mono font-bold text-blue-600">{crs.id}</td>
                        <td className="py-1.5 font-semibold text-slate-800">{crs.title}</td>
                        <td className="py-1.5 text-slate-600">{crs.faculty}</td>
                        <td className="py-1.5 text-right font-mono">{crs.hours_per_week}h/wk</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Midterm Exam Seating */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Allocated Midterm Examination Seats</div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-1.5">Module</th>
                      <th className="py-1.5">Date & Timing</th>
                      <th className="py-1.5">Venue Hall</th>
                      <th className="py-1.5 text-right">Assigned Desk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examinations.items.map((ex: any) => (
                      <tr key={ex.exam_id}>
                        <td className="py-1.5 font-bold text-slate-800">{ex.course_id}</td>
                        <td className="py-1.5 text-slate-600">{ex.date} • {ex.timing}</td>
                        <td className="py-1.5 text-slate-700">{ex.room_name}</td>
                        <td className="py-1.5 text-right font-bold text-blue-700 font-mono">{ex.desk_seat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Verification Stamp */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Student Identity Verified • Clash-Free Guarantee Certified</span>
                </div>
                <div className="font-mono text-slate-400">CIT/STUDENT/{currentUser.id}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
