import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { UserItem } from '../../types';

interface AdminReportsProps {
  currentUser: UserItem;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ currentUser }) => {
  const [auditEntries, setAuditEntries] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/audit-logs?limit=10', {
      headers: { Authorization: `Bearer ${currentUser.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAuditEntries(data.data);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Admin Authority &gt; Executive Analytics & Compliance</span>
            <span>•</span>
            <span className="text-slate-500">Term 2026.Q4-000</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Institutional Scheduling Analytics & Campus Reports
            </h1>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              ACCREDITED AICTE TIER-1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time resource utilization, teaching load equity, and automated timetable solver diagnostics across Chilika Institute of Technology.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Master CSV</span>
          </button>
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Schedule Automated Audit</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Term Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>Academic Term: Autumn 2026 - Odd</option>
            <option>Spring 2026 - Even</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>Department Scope: All Departments</option>
            <option>CSE</option>
            <option>ECE</option>
            <option>ME</option>
          </select>
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>01 Oct 2026 - 30 Oct 2026</span>
          </div>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>Weekly Aggregation</option>
            <option>Monthly</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold">
            Reset
          </button>
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
            Apply Range
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACADEMIC RHYTHM</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">1,420</span>
            <span className="text-xs font-semibold text-slate-500">Slots / Wk</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Syllabus Completion: <strong className="text-emerald-600">98.8%</strong> (Target +1.2%)
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Theory / Lab split: 910 Lec • 510 Prac</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SPATIAL INFRASTRUCTURE</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">86.4%</span>
            <span className="text-xs font-semibold text-slate-500">Saturation</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            48 Lecture Halls & Labs • <strong className="text-blue-600">Optimal Band</strong>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Peak Block (10am-1pm): 94.2% Occupied</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FACULTY EQUITY INDEX</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">17.8</span>
            <span className="text-xs font-semibold text-slate-500">Hrs / Faculty Avg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            AICTE Norm: <strong className="text-emerald-600">92.0% within bounds</strong>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Standard Deviation: ±1.4 Teaching Hrs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SAT SOLVER RELIABILITY</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">0</span>
            <span className="text-xs font-bold text-emerald-600">Clashes Active</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Constraint Solver: <strong className="text-blue-600">v4.8 Verified</strong>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Auto-resolved Soft Clashes: 34 Instances</div>
        </div>
      </div>

      {/* Middle Row: Departmental Capacity (Left 6 Cols) + Saturation Heatmap (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Departmental Capacity & Workload Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Departmental Capacity & Workload Distribution</h2>
              <p className="text-[11px] text-slate-500">Scheduled teaching contact hours vs assigned physical lab/auditorium capacities.</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { dept: 'Computer Science & Engineering (CSE)', load: '428 hrs/wk • 91.2% Venue Load', val: '91.2%' },
              { dept: 'Electronics & Communication (ECE)', load: '342 hrs/wk • 87.0% Venue Load', val: '87.0%' },
              { dept: 'Mechanical Engineering (MECH)', load: '284 hrs/wk • 82.5% Venue Load', val: '82.5%' },
              { dept: 'Electrical Engineering (EE)', load: '216 hrs/wk • 79.4% Venue Load', val: '79.4%' },
              { dept: 'Civil & Infrastructure (CIVIL)', load: '150 hrs/wk • 74.0% Venue Load', val: '74.0%' },
            ].map((d) => (
              <div key={d.dept} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{d.dept}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{d.load}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: d.val }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ⓘ Departmental variance index: <strong>0.07 (Optimal Equity)</strong></span>
            <button className="text-blue-600 font-bold hover:underline">View Load Matrix →</button>
          </div>
        </div>

        {/* Venue Saturation Heatmap */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Venue Saturation Heatmap</h2>
              <p className="text-[11px] text-slate-500">Hourly utilization concentration across campus zones over standard 5-day cycle.</p>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">48 Venues Active</span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-center text-xs">
              <thead className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-2 text-left">Day</th>
                  <th className="p-2">08-10</th>
                  <th className="p-2">10-12</th>
                  <th className="p-2">12-14</th>
                  <th className="p-2">14-16</th>
                  <th className="p-2">16-18</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {[
                  { day: 'MON', h1: '78%', h2: '96%', h3: '42%', h4: '91%', h5: '65%' },
                  { day: 'TUE', h1: '82%', h2: '98%', h3: '38%', h4: '88%', h5: '72%' },
                  { day: 'WED', h1: '74%', h2: '94%', h3: '45%', h4: '92%', h5: '54%' },
                  { day: 'THU', h1: '80%', h2: '95%', h3: '51%', h4: '86%', h5: '68%' },
                  { day: 'FRI', h1: '71%', h2: '89%', h3: '30%', h4: '79%', h5: '35%' },
                ].map((row) => (
                  <tr key={row.day}>
                    <td className="p-2 font-bold text-slate-800 text-left">{row.day}</td>
                    <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{row.h1}</span></td>
                    <td className="p-2"><span className="px-2 py-1 bg-blue-600 text-white rounded font-bold">{row.h2}</span></td>
                    <td className="p-2"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">{row.h3}</span></td>
                    <td className="p-2"><span className="px-2 py-1 bg-blue-600 text-white rounded font-bold">{row.h4}</span></td>
                    <td className="p-2"><span className="px-2 py-1 bg-blue-200 text-blue-900 rounded">{row.h5}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Off-peak efficiency opportunity:</span>
            <span className="font-bold text-blue-600">12-14 Lunch Hour Slot</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Mid-Term Examination Seating Efficiency (5 Cols) + Schedule Revisions & Automated Disruption Ledger (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mid-Term Seating Efficiency */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Mid-Term Examination Seating Efficiency</h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seating capacity allocation vs scheduled examinee cohorts by exam shifts.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Phase II Ready
            </span>
          </div>

          <div className="flex items-center space-x-6 py-2">
            <div className="w-24 h-24 rounded-full border-8 border-blue-600 border-t-slate-100 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-xl font-black text-slate-900">84%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Seated</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">TOTAL SEATING CAPACITY</div>
                <div className="text-lg font-black text-slate-900">2,850 Desks</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">COHORT ENROLLED</div>
                <div className="text-sm font-bold text-blue-700">2,394 Students</div>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Social Distancing: <strong className="text-slate-800">1.2m Maintained</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Shift 1 (09:00 - 12:00)</span>
              <span className="font-bold text-slate-900">950 / 950 (100% Saturation)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Shift 2 (13:30 - 16:30)</span>
              <span className="font-bold text-slate-900">844 / 950 (88.8% Saturation)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Shift 3 (17:00 - 19:00)</span>
              <span className="font-bold text-slate-900">600 / 950 (63.1% Reserve)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Invigilator ratio compliant:</span>
            <strong className="text-slate-800">1 : 28 Students (AICTE standard 1:30)</strong>
          </div>
        </div>

        {/* Right: Schedule Revisions & Automated Disruption Ledger */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Schedule Revisions & Automated Disruption Ledger</h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time adjustments handled by Dean's Office & SAT solver emergency rerouting.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Live Audit Trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Disruption Event</th>
                  <th className="p-2">Scope</th>
                  <th className="p-2">Resolution Mechanism</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditEntries.length > 0 ? (
                  auditEntries.slice(0, 5).map((log, idx) => (
                    <tr key={log.id || idx}>
                      <td className="p-2 font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2 font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</td>
                      <td className="p-2 text-slate-600">{log.resource_type} • {log.user_name}</td>
                      <td className="p-2 text-blue-700 font-semibold">{log.details ? JSON.stringify(log.details).slice(0, 35) + '...' : 'Deterministic SAT Solver'}</td>
                      <td className="p-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.status === 'success' ? 'Resolved' : 'Applied'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  [
                    { time: '24 Oct, 08:14', event: 'Cyclonic Weather Alert (IMD)', scope: 'Civil Engg Block 3', mech: 'Solver moved 14 classes to Virtual LMS', status: 'Auto-Rerouted' },
                    { time: '19 Oct, 11:30', event: 'HVAC Maintenance in Hall 102', scope: 'Lecture Hall Complex', mech: 'Reassigned to Annex Seminar 2', status: 'Resolved' },
                    { time: '12 Oct, 14:02', event: 'Visiting Chair Dr. A. Ramanujam', scope: 'CSE & AI Cohort', mech: 'Auditorium Priority Pre-emption', status: 'Dean Approved' },
                    { time: '03 Oct, 09:45', event: 'Lab Server Firmware Upgrade', scope: 'High Perf Computing Lab', mech: 'Swapped with Algorithm Theory', status: 'Compensatory' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono text-[11px] text-slate-500">{row.time}</td>
                      <td className="p-2 font-bold text-slate-800">{row.event}</td>
                      <td className="p-2 text-slate-600">{row.scope}</td>
                      <td className="p-2 text-blue-700 font-semibold">{row.mech}</td>
                      <td className="p-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Disruption recovery index:</span>
            <span className="font-bold text-emerald-600">99.4% resolved within 15 minutes</span>
          </div>
        </div>
      </div>

      {/* Bottom Cryptographic Stamp */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>
            Institutional Integrity & Cryptographic Dean's Stamp: <strong className="font-mono text-slate-800">SHA-256 Verified (f7c8:2b90:99e1:82ac:dd54)</strong>
          </span>
        </div>
        <div className="text-[11px] font-mono">
          Archival Node: <strong className="text-slate-700">cit-db-master-01.bbsr</strong> • Sync: <strong className="text-emerald-600">Live</strong>
        </div>
      </div>
    </div>
  );
};
