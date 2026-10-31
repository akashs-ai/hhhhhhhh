import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Send,
  Bell,
  Edit3,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyRequestsProps {
  currentUser: UserItem;
}

export const FacultyRequests: React.FC<FacultyRequestsProps> = ({ currentUser }) => {
  const [selectedTicketId, setSelectedTicketId] = useState('REQ-8821');
  const [nudged, setNudged] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">
            Academic Operations &gt; Department of CSE &gt; Faculty Service Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Faculty Requests & Disruption Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit and track requests for class rescheduling, emergency leave/unavailability, room swaps, and invigilation duty exchanges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            Export Summary
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Submit New Request</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE REQUESTS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">2</div>
          <div className="text-[11px] text-slate-500 mt-2">In review queue • Under Coordinator / HOD</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">APPROVED THIS TERM</div>
          <div className="text-3xl font-black text-slate-900 mt-1">5</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Resolved tickets • 100% adherence</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AVG RESOLUTION TIME</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">3.2</span>
            <span className="text-xs font-bold text-slate-500">Hours</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-2">Fastest: 18m via Automated SAT</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DISRUPTION SLA</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">Guaranteed</div>
          <div className="text-[11px] text-slate-500 mt-2">Clash-Free Certified • Zero student collision</div>
        </div>
      </div>

      {/* Main Grid: Ticket List (5 Cols) + Detail View (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets */}
        <div className="lg:col-span-5 space-y-3">
          {/* Ticket 1 */}
          <div
            onClick={() => setSelectedTicketId('REQ-8821')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedTicketId === 'REQ-8821'
                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                EMERGENCY DISRUPTION
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">REQ-8821</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2">
              Class Reschedule: CS304 Operating Systems Theory
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Submitted Today, 08:30 AM • Term Slot #14</div>
            <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-[10px] space-y-0.5">
              <div className="text-red-600 font-semibold">Medical emergency: Tue 28 Oct (10:30 – 11:30 AM)</div>
              <div className="text-blue-700 font-semibold">Proposed: Wed 29 Oct, 02:00 PM (Room B-203)</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-amber-600 font-semibold">Pending Coordinator Endorsement</span>
              <span className="font-bold text-blue-600">Inspect →</span>
            </div>
          </div>

          {/* Ticket 2 */}
          <div
            onClick={() => setSelectedTicketId('REQ-8804')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedTicketId === 'REQ-8804'
                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                DUTY SWAP
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">REQ-8804</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2">
              Invigilation Duty Exchange for 02 Nov 2026
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Swap with Prof. K. Nayak due to overlapping PhD doctoral committee defense.
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-slate-600 font-semibold">Under HOD Review</span>
              <span>Target: Hall C-302</span>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-linear-to-br from-blue-900 to-indigo-950 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-blue-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Chilika Automated Resolver Active</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When requesting alternative slots, our constraint solver guarantees zero student batch clashes across CSE-2A, CSE-2B, and IT electives.
            </p>
          </div>
        </div>

        {/* Right Column: Ticket Inspector */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="font-mono text-[11px] text-slate-400">REQ-8821 • Created Oct 24, 08:30 AM</div>
              <h2 className="text-base font-black text-slate-900 mt-0.5">Class Reschedule Details</h2>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              In Review
            </span>
          </div>

          {/* Lifecycle Stepper */}
          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              APPROVAL & NOTIFICATION LIFECYCLE
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">Submitted by Dr. R. Pattnaik</div>
                  <div className="text-[10px] text-slate-400">Completed • Oct 24, 08:30 AM</div>
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">
                    AI SAT Solver Validation <span className="text-blue-600 font-semibold">(0 Cohort Clashes)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Verified automatically • Oct 24, 08:31 AM</div>
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-amber-800">Coordinator Approval</div>
                  <div className="text-[10px] text-slate-500">
                    Pending Soumyajit Mohapatra (Dept. Timetable Chair)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slot Comparison */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-red-700 uppercase">ORIGINAL SLOT</span>
              <div className="font-bold text-slate-800">Tuesday, 28 Oct 2026</div>
              <div className="text-[11px] text-slate-600">10:30 AM – 11:30 AM</div>
              <div className="text-[10px] text-slate-500 pt-1">Room B-201 • 62 Students</div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase">REQUESTED ALTERNATIVE</span>
              <div className="font-bold text-slate-800">Wednesday, 29 Oct 2026</div>
              <div className="text-[11px] text-blue-700 font-semibold">02:00 PM – 03:00 PM</div>
              <div className="text-[10px] text-slate-500 pt-1">Room B-203 • Auditorium Wing</div>
            </div>
          </div>

          {/* Clinical Context */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              FACULTY REASON & CLINICAL CONTEXT
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              "Medical checkup and diagnostic tests scheduled at Chilika Health Center. All lecture presentations and reference notes for CS304 (Virtual Memory Management) are already published on the portal for asynchronous prep."
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50">
                Withdraw Request
              </button>
              <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50">
                Edit Submission
              </button>
            </div>

            <button
              onClick={() => setNudged(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{nudged ? 'Coordinator Nudged ✓' : 'Nudge Coordinator'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
