import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Building2,
  Download,
  RefreshCw,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

import { googleSignIn, getGoogleAccessToken, googleSignOut } from '../../services/googleAuth';

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [attendanceStarted, setAttendanceStarted] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calendarConn, setCalendarConn] = useState<{
    connected: boolean;
    email: string | null;
    last_synced_at: string | null;
    events_synced: number;
  }>({ connected: false, email: null, last_synced_at: null, events_synced: 0 });

  React.useEffect(() => {
    fetch('/api/calendar/status', {
      headers: { Authorization: `Bearer ${currentUser.token || currentUser.id}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.connection) {
          setCalendarConn(data.connection);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handleSyncCalendar = async () => {
    setCalendarSyncing(true);
    setSyncFeedback(null);
    try {
      let gToken = getGoogleAccessToken();
      if (!calendarConn.connected || !gToken) {
        const authRes = await googleSignIn();
        if (authRes) {
          gToken = authRes.accessToken;
          await fetch('/api/calendar/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser.token || currentUser.id}`,
            },
            body: JSON.stringify({
              googleEmail: authRes.user.email,
              calendarId: 'primary',
              googleAccessToken: gToken,
            }),
          });
          setCalendarConn((prev) => ({ ...prev, connected: true, email: authRes.user.email }));
        } else {
          setSyncFeedback({
            type: 'error',
            text: 'Google authorization window was closed.',
          });
          setCalendarSyncing(false);
          return;
        }
      }

      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
          'X-Google-Token': gToken || '',
        },
        body: JSON.stringify({
          googleAccessToken: gToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Google Workspace calendar sync error.');
      }
      setCalendarConn((prev) => ({
        ...prev,
        connected: true,
        last_synced_at: data.last_synced_at,
        events_synced: data.events_synced,
      }));
      setSyncFeedback({
        type: 'success',
        text: `Synchronized: ${data.events_synced} faculty timetable events to Google Calendar.`,
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Sync encountered an error.',
      });
    } finally {
      setCalendarSyncing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span>ACTIVE SESSION • TERM 2026-II</span>
            <span>•</span>
            <span className="text-slate-500">Chilika Institute of Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Good Morning, Dr. Pattnaik! 👨‍🏫
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Department of Computer Science & Engineering • Autumn Term 2026
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            Update Availability
          </button>
          <button
            onClick={() => onNavigateTab('requests')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Submit Leave / Disruption
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Load</div>
          <div className="text-3xl font-black text-slate-900 mt-1">3 Classes</div>
          <div className="text-[11px] text-slate-500 mt-2">2 Theory, 1 Practical Lab • 09:30 - 15:30</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Target</div>
          <div className="text-3xl font-black text-slate-900 mt-1">18 / 20 Hours</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">90% Met • 2 hrs buffer (Optimal)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mid-term Exams</div>
          <div className="text-3xl font-black text-slate-900 mt-1">2 Upcoming</div>
          <div className="text-[11px] text-slate-500 mt-2">Next duty: Tomorrow, 09:00 AM (Hall B-302)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Requests</div>
          <div className="text-3xl font-black text-amber-700 mt-1">1 Disruption</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-2">Under Review by HOD (#REQ-8821)</div>
        </div>
      </div>

      {/* Middle Layout: Schedule (8 Cols) + Right Cards (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule + Workload */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today's Teaching Schedule</h2>
                <div className="text-[11px] text-slate-400">Saturday, 24 Oct 2026 • 3 Timetabled sessions</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Campus Live Feed</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Slot 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500">09:30 AM – 10:30 AM</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.2 rounded">CS301</span>
                    <span className="font-bold text-slate-800 text-xs">Data Structures & Algorithms</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">CSE-2A (62 Students) • Room B-201 • Theory Lecture</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Completed ✓
                </span>
              </div>

              {/* Slot 2 (Ongoing) */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-blue-700">11:30 AM – 01:00 PM</span>
                    <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.2 rounded">CS304</span>
                    <span className="font-bold text-slate-900 text-xs">Operating Systems</span>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full">
                      Ongoing Now
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    CSE-2A • Room B-201 • <strong className="text-emerald-700">Room Lock Verified</strong>
                  </div>
                </div>

                <button
                  onClick={() => setAttendanceStarted(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all self-start sm:self-auto"
                >
                  {attendanceStarted ? 'Attendance Recorded ✓' : 'Start Attendance'}
                </button>
              </div>

              {/* Slot 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500">02:00 PM – 03:30 PM</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.2 rounded">CS412</span>
                    <span className="font-bold text-slate-800 text-xs">Cyber Security Principles</span>
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                      Lab Session
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">CSE-3B • Room B-205 (Security Lab)</div>
                </div>

                <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700">
                  View Students (64)
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Courses & Workload Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Assigned Courses & Workload Breakdown</h2>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Detailed Curriculum →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">COURSE</th>
                    <th className="p-2.5">SECTION</th>
                    <th className="p-2.5">WEEKLY LOAD</th>
                    <th className="p-2.5">ALLOCATED VENUE</th>
                    <th className="p-2.5">SYLLABUS PROGRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5">
                      <span className="font-bold text-blue-600">CS301</span> Data Structures & Algorithms
                    </td>
                    <td className="p-2.5 text-slate-600">Sem V • CSE-2A</td>
                    <td className="p-2.5 font-bold text-slate-800">6.0 hrs/wk</td>
                    <td className="p-2.5 text-slate-600">Room B-201</td>
                    <td className="p-2.5 font-semibold text-slate-700">Unit 3/4</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">
                      <span className="font-bold text-blue-600">CS304</span> Operating Systems
                    </td>
                    <td className="p-2.5 text-slate-600">Sem V • CSE-2A</td>
                    <td className="p-2.5 font-bold text-slate-800">7.0 hrs/wk</td>
                    <td className="p-2.5 text-slate-600">Room B-201</td>
                    <td className="p-2.5 font-semibold text-slate-700">Unit 2/4</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">
                      <span className="font-bold text-blue-600">CS412</span> Cyber Security Principles
                    </td>
                    <td className="p-2.5 text-slate-600">Sem VII • CSE-3B</td>
                    <td className="p-2.5 font-bold text-slate-800">5.0 hrs/wk</td>
                    <td className="p-2.5 text-slate-600">Room B-205 Lab</td>
                    <td className="p-2.5 font-semibold text-slate-700">Unit 4/4</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span>Total Committed Faculty Load: <strong>18 Teaching Hrs + 4 Consultation Hrs</strong></span>
              <span className="font-bold text-emerald-700 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Dean Academic Compliant</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Invigilation Duties + Calendar Sync + Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Invigilation Duties Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Invigilation Duties</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                2 Active
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">25 Oct 2026</span>
                  <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded">
                    Chief Invigilator
                  </span>
                </div>
                <div className="font-bold text-slate-800">Mid-Term Examination</div>
                <div className="text-[11px] text-slate-500">09:00 AM – 12:00 PM • Hall B-302</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">02 Nov 2026</span>
                  <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded">
                    Invigilator
                  </span>
                </div>
                <div className="font-bold text-slate-800">Cyber Security Mid-Term</div>
                <div className="text-[11px] text-slate-500">09:00 AM – 12:00 PM • Hall B-301</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('exams')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Invigilation Roster (PDF)</span>
            </button>
          </div>

          {/* Calendar Integration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Google Calendar</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  calendarConn.connected
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : 'text-slate-600 bg-slate-100 border border-slate-200'
                }`}
              >
                {calendarConn.connected ? 'Connected ✓' : 'Not Connected'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600">
              {calendarConn.connected ? (
                <span>
                  Linked: <strong>{calendarConn.email || currentUser.email}</strong>
                  {calendarConn.last_synced_at && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Last sync: {new Date(calendarConn.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({calendarConn.events_synced} sessions)
                    </span>
                  )}
                </span>
              ) : (
                'Link Google account to push faculty classes & invigilations directly to Google Calendar.'
              )}
            </div>
            <button
              onClick={handleSyncCalendar}
              disabled={calendarSyncing}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${calendarSyncing ? 'animate-spin' : ''}`} />
              <span>
                {calendarSyncing
                  ? 'Synchronizing with Google...'
                  : calendarConn.connected
                  ? 'Sync Schedule Now'
                  : 'Connect & Sync Google Calendar'}
              </span>
            </button>
            {syncFeedback && (
              <div
                className={`p-2 rounded-lg text-[11px] font-semibold text-center border ${
                  syncFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {syncFeedback.text}
              </div>
            )}
            <button
              onClick={() => {
                window.location.href = `/api/calendar/ics?faculty=${currentUser.facultyId || 'FAC-CSE-01'}`;
              }}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-medium text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>Export .ICS for Outlook / Apple Calendar</span>
            </button>
          </div>

          {/* Quick Actions & Requisitions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2.5 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              QUICK ACTIONS & REQUISITIONS
            </div>

            <button
              onClick={() => onNavigateTab('requests')}
              className="w-full p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-800">Apply Emergency Reschedule</div>
                <div className="text-[10px] text-slate-400">Notify batch & propose alternate slot</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('exams')}
              className="w-full p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-800">Swap Invigilation Slot</div>
                <div className="text-[10px] text-slate-400">Peer-to-peer exchange request</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('bookings')}
              className="w-full p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-800">Spectra Venue Requisition</div>
                <div className="text-[10px] text-slate-400">Book seminar halls or smart labs</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
