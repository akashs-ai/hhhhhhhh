import React from 'react';
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
} from 'lucide-react';
import { UserItem } from '../../types';

interface StudentReportsProps {
  currentUser: UserItem;
  onNavigateTab?: (tab: string) => void;
}

export const StudentReports: React.FC<StudentReportsProps> = ({ currentUser, onNavigateTab }) => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            ACADEMIC GOVERNANCE / AUTUMN-2026-TERMLOG
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Academic Operations & Scheduling Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Department-level analytics, timetable fulfillment metrics, faculty workload distribution, and room occupancy telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Telemetry Synced: Today 11:20 AM</span>
          </span>
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Scope Filter Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium">
            <option>Scope: Computer Science & Engineering (CSE)</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium">
            <option>Autumn 2026 (Odd Term - Sem 3, 5, 7)</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium">
            <option>All Sections (CSE-A, CSE-B, CSE-C)</option>
          </select>
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
          <div className="text-3xl font-black text-slate-900 mt-1">342</div>
          <div className="text-[11px] text-slate-500 mt-2">Slots / Wk • <strong className="text-emerald-600">+4.2% vs prev</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Room Utilization Rate</div>
          <div className="text-3xl font-black text-slate-900 mt-1">88.6%</div>
          <div className="text-[11px] text-slate-500 mt-2">Target: 80% – 92% • <strong className="text-blue-600">38/42 Active</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Faculty Workload Index</div>
          <div className="text-3xl font-black text-slate-900 mt-1">18.4</div>
          <div className="text-[11px] text-slate-500 mt-2">Hrs / Faculty Avg • <strong className="text-emerald-600">94% Compliant</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detected Schedule Conflicts</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">0</div>
          <div className="text-[11px] text-slate-500 mt-2">3 warnings auto-resolved • <strong className="text-emerald-600">SAT 100%</strong></div>
        </div>
      </div>

      {/* Middle Row: Venue Occupancy (7 Cols) + Faculty Workload (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Venue Occupancy */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Departmental Venue & Lab Occupancy</h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Slot Max: 40h/wk</span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { name: 'B-Block 201 (Theory Hall, 65 seats)', hrs: '36 hrs/wk', demand: '90% High Demand', color: 'bg-blue-600', w: '90%' },
              { name: 'B-Block 203 (Theory Hall, 65 seats)', hrs: '34 hrs/wk', demand: '85% Stable', color: 'bg-blue-600', w: '85%' },
              { name: 'Systems Lab 1 (Computing Wing, 40 terminals)', hrs: '38 hrs/wk', demand: '95% Near Saturation', color: 'bg-red-500', w: '95%' },
              { name: 'AI/ML Lab 2 (GPU Workstation Lab, 35 terminals)', hrs: '32 hrs/wk', demand: '80% Optimal', color: 'bg-blue-600', w: '80%' },
              { name: 'Hardware & IoT Lab (Block 4, 30 benches)', hrs: '26 hrs/wk', demand: '65% Available Buffer', color: 'bg-slate-400', w: '65%' },
            ].map((v) => (
              <div key={v.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{v.name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{v.hrs} ({v.demand})</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`${v.color} h-full rounded-full`} style={{ width: v.w }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span>Available Off-Peak Buffer Windows: Tuesday 15:00-17:00 & Friday 14:00-16:00</span>
          </div>
        </div>

        {/* Faculty Workload Compliance */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Faculty Workload & Compliance</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { name: 'Dr. M. Sen', role: 'Prof • 3 Theory, 1 Lab', load: '18.0 / 18.0h', status: 'Target Met', color: 'text-emerald-700 bg-emerald-50' },
              { name: 'Dr. R. Pattnaik', role: 'Assoc Prof • 2 Theory, 2 Lab', load: '17.5 / 18.0h', status: 'Target Met', color: 'text-emerald-700 bg-emerald-50' },
              { name: 'Prof. K. Nayak', role: 'Asst Prof • 3 Theory, 1 Tut', load: '19.0 / 20.0h', status: 'Target Met', color: 'text-emerald-700 bg-emerald-50' },
              { name: 'Er. P. Das', role: 'Lecturer • 2 Theory, 3 Labs', load: '20.0 / 20.0h', status: 'At Limit', color: 'text-red-700 bg-red-50' },
              { name: 'Prof. A. Mohanty', role: 'Visiting • 2 Theory', load: '8.0 / 12.0h', status: 'Available +4h', color: 'text-blue-700 bg-blue-50' },
            ].map((f) => (
              <div key={f.name} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{f.name}</div>
                  <div className="text-[10px] text-slate-400">{f.role}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">{f.load}</div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${f.color}`}>
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Need to reassign workload balance? Adjust in Timetable Generator →</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Audit Log (8 Cols) + Recent Modifications (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Timetable Resolution & Conflict Audit Log</h3>
            <span className="text-[10px] font-mono text-slate-400">Audit Sync ID: #7741</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-2.5">REF LOG</th>
                  <th className="p-2.5">COURSE / COHORT</th>
                  <th className="p-2.5">ISSUE PROFILE</th>
                  <th className="p-2.5">ARBITRATED ACTION</th>
                  <th className="p-2.5">AUDIT STATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">LOG-7741</td>
                  <td className="p-2.5">CS302 DBMS (CSE-B)</td>
                  <td className="p-2.5 text-slate-600">Faculty Sabbatical Conflict</td>
                  <td className="p-2.5 text-slate-800 font-medium">Swapped to Wed 11:00 AM</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Resolved
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">LOG-7739</td>
                  <td className="p-2.5">CS405 Cyber Security</td>
                  <td className="p-2.5 text-slate-600">Lab Capacity Threshold</td>
                  <td className="p-2.5 text-slate-800 font-medium">Split batch into Lab 1 & 2</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Resolved
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">LOG-7728</td>
                  <td className="p-2.5">CS301 Data Structures</td>
                  <td className="p-2.5 text-slate-600">Consecutive 3-Hr Theory</td>
                  <td className="p-2.5 text-slate-800 font-medium">Interleaved with Recess</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      Auto-Optimized
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Recent Modifications</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <div className="font-bold text-slate-800">Automated SAT Solver Pass #14</div>
              <div className="text-[10px] text-slate-400 mt-0.5">published by Soumyajit — 320 slots committed (2h ago)</div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <div className="font-bold text-slate-800">Room swap clearance approved</div>
              <div className="text-[10px] text-slate-400 mt-0.5">CS304 OS shifted to B-203 (Yesterday, 16:45)</div>
            </div>
          </div>
          <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
            Audit Full Changelog
          </button>
        </div>
      </div>
    </div>
  );
};
