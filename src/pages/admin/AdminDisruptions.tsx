import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  Check,
  X,
  Send,
  ArrowRight,
} from 'lucide-react';
import { UserItem, DisruptionItem } from '../../types';

interface AdminDisruptionsProps {
  currentUser: UserItem;
  disruptions?: DisruptionItem[];
}

export const AdminDisruptions: React.FC<AdminDisruptionsProps> = ({ currentUser }) => {
  const [selectedDocket, setSelectedDocket] = useState('REQ-DIS-8821');
  const [filterType, setFilterType] = useState('all');
  const [isPublished, setIsPublished] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Admin Authority &gt; Disruption Desk</span>
            <span>•</span>
            <span className="text-slate-500">Autumn 2026 Term Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Academic Disruption & Emergency Rescheduling Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated clash recovery, facility incident control, and constraint-based schedule healing via SAT Solver v4.8.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Disruption Audit Log</span>
          </button>
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Run Conflict Analysis Pass</span>
          </button>
          <button
            onClick={() => alert('Emergency protocol initiated: Automated warning broadcasted to Academic Council.')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trigger Emergency Campus Closure</span>
          </button>
        </div>
      </div>

      {/* 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">UNDER REVIEW</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-red-600">3</span>
            <span className="text-xs font-semibold text-slate-500">Tickets Active</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">2 Faculty, 1 Facility Outage • <strong className="text-red-600">High Attention</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SAT AUTO-RESOLVED</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">12</span>
            <span className="text-xs font-semibold text-slate-500">This Month</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Constraint Satisfiability: 100% (+4 vs Sept)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MEAN RESCHEDULE LATENCY</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">3.2</span>
            <span className="text-xs font-semibold text-slate-500">Hours</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Target SLA &lt; 6.0 Hours • <strong className="text-blue-600">Optimal</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RESIDUAL COLLISIONS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">0</span>
            <span className="text-xs font-bold text-emerald-600">Collisions</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">3,410 enrolled students intact • <strong className="text-emerald-600">Stable</strong></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filterType === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Disruptions (15)
        </button>
        <button
          onClick={() => setFilterType('pending')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filterType === 'pending' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Review (3)
        </button>
        <button
          onClick={() => setFilterType('faculty')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filterType === 'faculty' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Faculty Unavailability (6)
        </button>
        <button
          onClick={() => setFilterType('room')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filterType === 'room' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Room Reallocations (4)
        </button>
      </div>

      {/* Main Grid: Queue Docket (5 Cols) + Detailed Case Inspector (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Docket List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Queue Docket <strong className="text-red-600">3 Action Needed</strong></span>
            <span className="text-[11px] text-slate-400 font-normal">Sorted by Severity</span>
          </div>

          <div className="space-y-3">
            {/* Case 1 */}
            <div
              onClick={() => setSelectedDocket('REQ-DIS-8821')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedDocket === 'REQ-DIS-8821'
                  ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">REQ-DIS-8821</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>Urgent Medical</span>
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-2">
                Dr. R. Pattnaik — Emergency Medical Leave
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                CS304: Operating Systems • CSE-2A (62 Students)
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                <span>Slot: Wed 29 Oct, 10:00 AM</span>
                <span className="text-blue-600 font-bold">Auto-Proposal Ready</span>
              </div>
            </div>

            {/* Case 2 */}
            <div
              onClick={() => setSelectedDocket('REQ-DIS-8819')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedDocket === 'REQ-DIS-8819'
                  ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">REQ-DIS-8819</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                  Facility Fault
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-2">
                Systems Lab 1 — AC Compressor Breakdown
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                CS412: Distributed Systems Lab • CSE-4B (48 Students)
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                <span>Slot: Thu 30 Oct, 02:00 PM</span>
                <span className="text-amber-600 font-bold">Requires Relocation</span>
              </div>
            </div>

            {/* Case 3 */}
            <div
              onClick={() => setSelectedDocket('REQ-DIS-8815')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedDocket === 'REQ-DIS-8815'
                  ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">REQ-DIS-8815</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Conf Travel
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-2">
                Prof. M. K. Senapati — IEEE Conference Deputation
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                EC210: Digital Signal Processing • ECE-3A (74 Students)
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                <span>Slot: Fri 31 Oct, 11:30 AM</span>
                <span className="text-slate-500 font-medium">Proxy or Asynchronous</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case Inspector */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs text-blue-600">CASE REQ-DIS-8821</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Immediate Reschedule Priority
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-1">CS304: Operating Systems (Theory)</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Primary Instructor: <strong>Dr. R. Pattnaik</strong> • Department: <strong>Computer Science & Engg.</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">IMPACTED COHORT</span>
              <span className="font-bold text-blue-600 text-sm">CSE-2A</span>
              <span className="text-[10px] text-slate-400 block">62 Students</span>
            </div>
          </div>

          {/* Side by side comparison: Disrupted slot vs Recommended Alternate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-red-700">
                <span>DISRUPTED SLOT</span>
                <span className="text-[10px] bg-red-100 px-1.5 py-0.2 rounded">Terminated</span>
              </div>
              <div className="text-xs font-bold text-slate-900 pt-1">Wednesday, 29 Oct 2026</div>
              <div className="text-[11px] text-slate-600">10:00 AM – 11:15 AM (75 mins)</div>
              <div className="text-[10px] text-slate-500 pt-1">Room C-104 (Auditorium Wing)</div>
              <div className="text-[10px] text-red-600 pt-1">Reason: Sudden hospitalization</div>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-700">
                <span>RECOMMENDED ALTERNATE</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">Rank #1 Match</span>
              </div>
              <div className="text-xs font-bold text-slate-900 pt-1">Wednesday, 29 Oct 2026</div>
              <div className="text-[11px] text-blue-700 font-semibold">02:00 PM – 03:15 PM (75 mins)</div>
              <div className="text-[10px] text-slate-600 pt-1">Room B-203 (High-Tech Block)</div>
              <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                Co-Faculty Substitute: Prof. A. Nanda (Assigned)
              </div>
            </div>
          </div>

          {/* Autonomous Conflict Analysis Check */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>AUTONOMOUS CONFLICT ANALYSIS CHECK (SAT FORMULA RESOLUTION)</span>
              <span className="text-emerald-600 font-mono font-bold">Confidence: 99.8%</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cohort Free Time Window: CSE-2A lunch slot intact; 0 clashes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Room B-203 Availability: Seating 70 &gt; 62 Cohort; Projector OK</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Substitute Faculty Consent: Prof. A. Nanda notified</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>UGC/AICTE Hours: Zero syllabus deficit (42/42 kept)</span>
              </div>
            </div>
          </div>

          {/* Guardrail Warning */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Institutional Guardrail & Automated Dispatch Warning</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Endorsing this schedule shift immediately executes a zero-downtime bi-directional synchronization to the Chilika Google Workspace for Education API, invalidates previous calendar event invites for 62 students, triggers SMS alerts, and updates room electronic e-ink door plates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button className="px-3.5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all">
              Reject Ticket
            </button>
            <button className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all">
              Request Manual Revision
            </button>
            <button
              onClick={() => setIsPublished(true)}
              disabled={isPublished}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isPublished ? 'Endorsed & Published ✓' : 'Endorse & Publish Reschedule'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
