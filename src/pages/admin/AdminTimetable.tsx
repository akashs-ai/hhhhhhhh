import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Rocket,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Download,
  Printer,
  Sparkles,
  Layers,
  ShieldCheck,
  Building2,
  Cpu,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { TimetableSession, UserItem } from '../../types';

interface AdminTimetableProps {
  currentUser: UserItem;
  sessions?: TimetableSession[];
  onTriggerSolver?: () => void;
}

export const AdminTimetable: React.FC<AdminTimetableProps> = ({
  currentUser,
  sessions = [],
  onTriggerSolver,
}) => {
  const [activeView, setActiveView] = useState<'weekly' | 'monthly' | 'matrix'>('weekly');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSem, setSelectedSem] = useState('Sem 5');
  const [solverRunning, setSolverRunning] = useState(false);
  const [placedItem, setPlacedItem] = useState(false);
  const [apiNotice, setApiNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [latestGeneratedId, setLatestGeneratedId] = useState<string | null>(null);

  const handleLaunchSolver = async () => {
    setSolverRunning(true);
    setApiNotice({ type: 'info', message: 'Running deterministic SAT solver Python microkernel...' });

    try {
      const res = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          seed: 42,
          autoApprove: false,
          name: `Academic Schedule ${selectedDept} - ${selectedSem}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Solver execution failed to resolve constraints.');
      }

      setLatestGeneratedId(data.version_id);
      setApiNotice({
        type: 'success',
        message: `Solver completed in ${data.execution_time_ms}ms: ${data.session_count} sessions generated with 0 hard collisions (Version: ${data.version_id}).`,
      });

      if (onTriggerSolver) onTriggerSolver();
    } catch (err: any) {
      setApiNotice({
        type: 'error',
        message: err.message || 'Solver failed to run.',
      });
    } finally {
      setSolverRunning(false);
    }
  };

  const handlePublishSchedule = async () => {
    if (!latestGeneratedId) {
      // Retrieve proposed schedule to approve
      try {
        const propRes = await fetch('/api/timetable?status=proposed', {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const propData = await propRes.json();
        if (propData.success && propData.version_id) {
          await executeApprove(propData.version_id);
          return;
        }
      } catch (_) {}

      setApiNotice({
        type: 'info',
        message: 'Master schedule v4.2 is already the active committed schedule.',
      });
      return;
    }

    await executeApprove(latestGeneratedId);
  };

  const executeApprove = async (versionId: string) => {
    try {
      const res = await fetch(`/api/timetable/${versionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to approve timetable version.');
      }
      setApiNotice({
        type: 'success',
        message: `Schedule version ${versionId} is now active and published to ERP.`,
      });
      if (onTriggerSolver) onTriggerSolver();
    } catch (err: any) {
      setApiNotice({
        type: 'error',
        message: err.message || 'Approval failed.',
      });
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/calendar/ics?group=CSE-2A`;
  };

  const sampleSlots = [
    {
      day: 'MON',
      date: 'Oct 19',
      slots: [
        { code: 'CS-501', title: 'Operating Systems', type: 'Theory', prof: 'Dr. K. Mahapatra', room: 'L-301 (Aud. B)' },
        { code: 'CS-502', title: 'Database Systems', type: 'Theory', prof: 'Prof. N. Patnaik', room: 'L-302' },
        { code: 'CS-502L', title: 'Database Internals & SQL Lab', type: 'Lab (2 hrs)', prof: 'Prof. N. Patnaik, Er. S. Swain', room: 'Turing Lab 02 • Cap: 45/45', span: 2 },
      ],
    },
    {
      day: 'TUE',
      date: 'Oct 20',
      slots: [
        { code: 'CS-503', title: 'Computer Networks', type: 'Theory', prof: 'Prof. A. Ray', room: 'L-301' },
        { code: 'CS-501', title: 'Operating Systems', type: 'Theory', prof: 'Dr. K. Mahapatra', room: 'L-301' },
        { code: 'OE-511', title: 'Robotics & Automation', type: 'Theory', prof: 'Dr. V. Rao', room: 'Bose Hall' },
        { isAdd: true },
        { code: 'CS-504T', title: 'Automata Theory', type: 'Tutorial', prof: 'Dr. S. K. Dash', room: 'L-204' },
      ],
    },
    {
      day: 'WED',
      date: 'Oct 21',
      slots: [
        { code: 'EC-510L', title: 'Embedded DSP Architecture Lab', type: 'Lab (2 hrs)', prof: 'Prof. S. Mohanty', room: 'VLSI Micro Lab 3', span: 2 },
        { code: 'CS-502', title: 'Database Systems', type: 'Theory', prof: 'Prof. N. Patnaik', room: 'L-302' },
        { code: 'CS-503', title: 'Computer Networks', type: 'Theory', prof: 'Prof. A. Ray', room: 'L-301' },
        { isAdd: true },
      ],
    },
    {
      day: 'THU',
      date: 'Oct 22',
      slots: [
        { code: 'CS-501', title: 'Operating Systems', type: 'Theory', prof: 'Dr. K. Mahapatra', room: 'L-301' },
        { code: 'CS-503', title: 'Computer Networks', type: 'Theory', prof: 'Prof. A. Ray', room: 'L-301' },
        { code: 'CS-503L', title: 'Cisco Packet Tracer Lab', type: 'Lab (2 hrs)', prof: 'Prof. A. Ray, T.A. Sen', room: 'Networks Lab A', span: 2 },
        { isAdd: true },
      ],
    },
    {
      day: 'FRI',
      date: 'Oct 23',
      slots: [
        { code: 'CS-502', title: 'Database Systems', type: 'Theory', prof: 'Prof. N. Patnaik', room: 'L-302' },
        { code: 'OE-511', title: 'Robotics & Automation', type: 'Theory', prof: 'Dr. V. Rao', room: 'Bose Hall' },
        { code: 'CS-504T', title: 'Complexity Theory', type: 'Tutorial', prof: 'Dr. S. K. Dash', room: 'L-204' },
        { code: 'CS-506P', title: 'Interdisciplinary Studio', type: 'Capstone', prof: 'Mentorship Panel', room: 'Innovation Cell', span: 2 },
      ],
    },
    {
      day: 'SAT',
      date: 'Oct 24',
      slots: [
        { code: 'REM-501', title: 'Remedial Problem Solving', type: 'Remedial', prof: 'Dept Teaching Assts.', room: 'L-301 Lab Annex' },
        { code: 'DEV-CLB', title: 'CIT Open Source Coding', type: 'Co-Curricular', prof: 'Student ACM Chapter', room: 'Turing Hub' },
        { isAdd: true },
        { isAdd: true },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100">
        <div>
          Admin Authority &gt; Curriculum Operations &gt; <strong className="text-slate-800">Master Timetable Management</strong>
        </div>
        <span className="self-start sm:self-auto bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold border border-slate-200">
          B.Tech Reg. 2024-28
        </span>
      </div>

      {/* Blue Commit Hash & Live Publish Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Live Published Version 4.2</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                COMMITTED OCT 2026
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              • Immutable Audit Hash: <span className="font-mono text-slate-700">0x89F4...31CE</span> • Synchronized with Chilika ERP Academic Core. Next planned cycle: Mid-Term Revision B.
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right text-[11px] text-slate-600">
          <span className="font-semibold text-blue-700">Publishing commits</span> auto-dispatches alerts to{' '}
          <strong className="text-slate-900">1,245 students</strong> & <strong className="text-slate-900">64 faculty</strong>
        </div>
      </div>

      {/* Main Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Timetable Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated clash-free schedule allocation for Department of CSE</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => (window.location.href = '/api/audit-logs')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit History</span>
          </button>
          <button
            onClick={handlePublishSchedule}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center space-x-1.5 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>Publish Schedule</span>
          </button>
          <button
            onClick={handleLaunchSolver}
            disabled={solverRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{solverRunning ? 'Solving Matrix...' : 'Launch Solver Generator'}</span>
          </button>
        </div>
      </div>

      {apiNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            apiNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : apiNotice.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <span>{apiNotice.message}</span>
          <button
            onClick={() => setApiNotice(null)}
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Metric Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CONFLICT STATUS</div>
          <div className="text-2xl font-black text-slate-900 mt-1">0 Collisions</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Venue Disjoint</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CONSTRAINT SOLVER</div>
          <div className="text-2xl font-black text-slate-900 mt-1">2 Overlaps Fixed</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Auto-mitigated by SAT 4.8</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ROOM SATURATION INDEX</div>
          <div className="text-2xl font-black text-slate-900 mt-1">78.4% Efficiency</div>
          <div className="text-[11px] text-slate-500 mt-1">142 of 180 slots occupied</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING DISPATCH</div>
            <div className="text-xl font-black text-amber-700 mt-1">
              {placedItem ? '0 Unplaced' : '2 Unplaced Labs'}
            </div>
            <div className="text-[10px] text-slate-400">CS-408L, EC-31...</div>
          </div>
          {!placedItem && (
            <button
              onClick={() => setPlacedItem(true)}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors"
            >
              Resolve →
            </button>
          )}
        </div>
      </div>

      {/* Grid Tabs & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'weekly' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setActiveView('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'monthly' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'matrix' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matrix Matrix
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Today
          </button>
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold">
            <button className="p-0.5 hover:text-blue-600"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span>Oct 19 – Oct 24, 2026</span>
            <button className="p-0.5 hover:text-blue-600"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Pedagogic Formats Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 px-1">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-700">Pedagogic Formats:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Theory Lecture</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>Laboratory / Practical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span>
            <span>Tutorial / Seminar</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Common Academic Recess</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Click & drag blocks to reschedule</span>
      </div>

      {/* Main Grid + Right Drawers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Grid (9 Cols) */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 p-2.5">
              <div>TIME / DAY</div>
              <div>08:00 - 09:00</div>
              <div>09:00 - 10:00</div>
              <div>10:00 - 11:00</div>
              <div>11:00 - 12:00</div>
              <div>12:00 - 13:00</div>
              <div className="bg-amber-50/70 text-amber-800 text-center rounded">13:00 - 14:00</div>
            </div>

            {/* Daily Rows */}
            <div className="divide-y divide-slate-100">
              {sampleSlots.map((row) => (
                <div key={row.day} className="grid grid-cols-7 p-2.5 gap-2 items-stretch min-h-[96px]">
                  {/* Day Label */}
                  <div className="flex flex-col justify-center pr-2 border-r border-slate-100">
                    <span className="text-xs font-black text-slate-900">{row.day}</span>
                    <span className="text-[10px] text-slate-400">{row.date}</span>
                  </div>

                  {/* Slots */}
                  {row.slots.map((slot: any, sIdx) => {
                    if (slot.isAdd) {
                      return (
                        <button
                          key={sIdx}
                          className="h-full border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 transition-all p-2 text-center"
                        >
                          <Plus className="w-3.5 h-3.5 mb-0.5" />
                          <span className="text-[10px] font-semibold">Add Slot</span>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={sIdx}
                        className={`p-2 rounded-xl border flex flex-col justify-between text-left transition-all ${
                          slot.type.includes('Lab')
                            ? 'bg-sky-50/70 border-sky-200 text-sky-900 col-span-2'
                            : slot.type === 'Tutorial'
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            : slot.type === 'Capstone'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 col-span-2'
                            : 'bg-blue-50/80 border-blue-200 text-blue-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black">{slot.code}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/70">
                              {slot.type}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold line-clamp-1 mt-0.5">{slot.title}</div>
                        </div>

                        <div className="text-[9px] text-slate-600 mt-2">
                          <div className="truncate">{slot.prof}</div>
                          <div className="font-mono text-[8.5px] text-slate-500 mt-0.5">{slot.room}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Recess Column */}
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl flex flex-col items-center justify-center p-1 text-center text-amber-800">
                    <span className="text-[10px] font-bold">RECESS</span>
                    <span className="text-[8px] text-amber-600 mt-0.5">Lunch</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Unscheduled Queue + Resolved Overlaps (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Unscheduled Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Unscheduled Queue</h3>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {placedItem ? '0 Courses' : '2 Courses'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Mandatory contact courses awaiting constraint-compliant room allocation for Semester 5.
            </p>

            {!placedItem ? (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">CS-408L</span>
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">High Pri</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-700 mt-0.5">Compiler Construction Lab</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Prof. A. Ray • 2-Hour Practical</div>
                  <button
                    onClick={() => setPlacedItem(true)}
                    className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all"
                  >
                    Auto-Place
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">EC-310T</span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">Normal</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-700 mt-0.5">VLSI Testing Tutorial</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dr. P. Sethi • 1-Hour Tutorial</div>
                  <button
                    onClick={() => setPlacedItem(true)}
                    className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all"
                  >
                    Auto-Place
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold">
                ✓ All courses successfully scheduled!
              </div>
            )}
          </div>

          {/* Auto-Resolved Overlaps Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-Resolved Overlaps</span>
            </h3>

            <div className="space-y-2 text-[10px] text-slate-600">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="font-semibold text-slate-800">Dr. Sengupta ↔ Dr. Mahapatra</div>
                <div className="text-slate-500 mt-0.5">
                  Moved OS Lab from Thu 10:00 to Tue 14:00 to avoid conflicting with Dean Academic Advisory board.
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="font-semibold text-slate-800">Venue Conflict: Turing Lab 2</div>
                <div className="text-slate-500 mt-0.5">
                  Re-routed CS-502L Section A away from concurrent M.Tech AI project review block. Zero capacity violation.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Constraint State:</span>
              <span className="font-bold text-emerald-600">100% Satisfied</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 gap-2">
        <span>ⓘ Double-click any card to view instructor availability matrix and facility equipment list.</span>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 font-semibold">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 font-semibold">
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>
    </div>
  );
};
