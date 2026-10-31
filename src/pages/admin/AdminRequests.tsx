import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  User,
  Share2,
} from 'lucide-react';
import { UserItem } from '../../types';

interface AdminRequestsProps {
  currentUser: UserItem;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ currentUser }) => {
  const [selectedDocketId, setSelectedDocketId] = useState('REQ-ADM-9042');
  const [activeTab, setActiveTab] = useState('all');
  const [endorsed, setEndorsed] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([
    'Prof. R. Mohanty (HOD CSE): Recommended for fast-track clearance. The symposium is mandatory for all 4th year seniors.',
  ]);

  const handlePostNote = () => {
    if (!noteText.trim()) return;
    setNotes([...notes, `Dr. S. Panda (Dean Academics): ${noteText.trim()}`]);
    setNoteText('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Admin Authority &gt; Master Requests Desk</span>
            <span>•</span>
            <span className="text-slate-500">AY 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Central Administrative Requests & Requisitions Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Chilika Institute of Technology Central Registry • Real-time SAT verification & deanery sign-offs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Requisition Log</span>
          </button>
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Configure Approval Rules</span>
          </button>
          <button
            onClick={() => alert('Batch endorsed 3 pending high-SLA requisitions.')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Batch Endorse (3)
          </button>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL ACTIVE REQUESTS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">14</div>
          <div className="text-[11px] text-slate-500 mt-2">+2 newly queued since 08:00 AM shift</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AWAITING DEAN CLEARANCE</div>
          <div className="text-3xl font-black text-red-600 mt-1">3</div>
          <div className="text-[11px] text-red-600 font-semibold mt-2">Immediate Dean sign-off required</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AVERAGE TURNAROUND SLA</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">2.4</span>
            <span className="text-xs font-bold text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">18% faster than Autumn 2025 avg</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AUTO-VERIFIED BY SAT</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">11</span>
            <span className="text-xs font-bold text-slate-500">/ 14</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-2">78.5% solver accuracy • 0 human clash</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All (14)
          </button>
          <button
            onClick={() => setActiveTab('reschedule')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'reschedule' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Class Reschedules (5)
          </button>
          <button
            onClick={() => setActiveTab('venue')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'venue' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Venue Requisitions (4)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>All Requesters</option>
            <option>Faculty Only</option>
            <option>Student Clubs</option>
          </select>
          <select className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700">
            <option>Sort: Urgency Priority</option>
            <option>Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Dockets Feed (5 Cols) + Docket Review Drawer (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dockets */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Showing 14 Requisition Dockets</span>
            <span className="text-blue-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Live Solver Feed</span>
            </span>
          </div>

          {/* Docket 1 */}
          <div
            onClick={() => setSelectedDocketId('REQ-ADM-9042')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedDocketId === 'REQ-ADM-9042'
                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600">REQ-ADM-9042</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Pending Dean Review
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2">
              Er. P. Das <span className="font-normal text-slate-500">• CSE Dept (UID: FAC-4102)</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Class Reschedule • <strong>CS401 Distributed Systems</strong> (LHC-204 → AUD-02)
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-emerald-600 font-bold">✓ SAT Verified: 0 Clashes</span>
              <span className="font-semibold text-slate-600">Tier 3 / 3</span>
            </div>
          </div>

          {/* Docket 2 */}
          <div
            onClick={() => setSelectedDocketId('REQ-ADM-9039')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedDocketId === 'REQ-ADM-9039'
                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600">REQ-ADM-9039</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                SAT Verified
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2">
              Spectra Coding Club <span className="font-normal text-slate-500">• CIT Innovation Cell</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Venue Requisition • <strong>Central Amphitheatre</strong> (Capacity: 450)
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-blue-600 font-bold">SAT Verified: Auto-Allocated</span>
              <span className="font-semibold text-slate-600">Tier 2 / 3</span>
            </div>
          </div>

          {/* Docket 3 */}
          <div
            onClick={() => setSelectedDocketId('REQ-ADM-9034')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedDocketId === 'REQ-ADM-9034'
                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600">REQ-ADM-9034</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                Under HOD Review
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-2">
              Dr. M. Sen <span className="font-normal text-slate-500">• Mechanical Engineering Dept</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Duty Swap • Midterm Invigilation (Hall 3A → Dr. Rao)
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
              <span>HOD Approval Pending</span>
              <span className="font-semibold text-slate-600">Tier 1 / 3</span>
            </div>
          </div>
        </div>

        {/* Right Column: Docket Inspector */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-blue-600">REQ-ADM-9042</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  Tier-3 Dean Clearance Escalation
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-1">
                Emergency Slot Rescheduling: CS401 Distributed Systems
              </h2>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Submitted on 28 Oct 2026, 09:14 AM • Registry Priority: <strong className="text-red-600">High SLA (45m Remaining)</strong>
              </div>
            </div>

            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Requester Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-800">Er. Pradeep Das (Faculty Regular)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">UID: FAC-CIT-4102 • Ramanujan Computing Block L3</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">COHORT IMPACT</span>
              <span className="font-bold text-slate-800">142 Registered Undergrads</span>
              <div className="text-[10px] text-slate-500">B.Tech CSE • Sem 7</div>
            </div>
          </div>

          {/* Justification */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              OFFICIAL REQUESTER JUSTIFICATION & RATIONALE
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              "We have scheduled the annual ACM Distinguished Lecture series with Dr. Leslie Lamport online symposium on Friday from 14:00 to 16:00 IST. The mandatory CS401 lecture directly collides with this mandatory departmental broadcast. I propose shifting Lecture CS401-L2 to Thursday slot 16:30 - 17:30 IST. Department Head Prof. R. Mohanty has granted oral clearance. The student batch representatives (Shreya & Aniket) have acknowledged zero conflicts on cohort poll."
            </p>
          </div>

          {/* SAT Solver Engine Conflict Evaluation */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span>SAT Solver Engine Conflict Evaluation</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">Engine v4.8 • 0 Clashes Found</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-red-200 text-red-950">
                <div className="text-[10px] font-bold text-red-700">ORIGINAL DISRUPTED SLOT</div>
                <div className="font-bold mt-1">Friday, 14:00 - 15:30</div>
                <div className="text-[10px] text-slate-500">Room: LHC-204 • 150 Cap</div>
                <div className="text-[10px] text-red-600 mt-1">Collides with ACM Symposium Keynote</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-emerald-950">
                <div className="text-[10px] font-bold text-emerald-700">PROPOSED TARGET SLOT (SOLVER VALIDATED)</div>
                <div className="font-bold mt-1">Thursday, 16:30 - 17:30</div>
                <div className="text-[10px] text-slate-500">Room: LHC-204 (Retained) • Free slot</div>
                <div className="text-[10px] text-emerald-700 mt-1">Zero faculty overlap • Zero cohort crossover</div>
              </div>
            </div>
          </div>

          {/* Multi-Tier Pipeline */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              INSTITUTIONAL MULTI-TIER APPROVAL PIPELINE
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] font-bold text-emerald-700">Step 1: HOD Endorsement</div>
                <div className="font-bold text-slate-800 mt-0.5">Endorsed ✓</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Prof. R. Mohanty (CSE)</div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] font-bold text-emerald-700">Step 2: SAT Verification</div>
                <div className="font-bold text-slate-800 mt-0.5">Constraints Passed ✓</div>
                <div className="text-[9px] text-slate-500 mt-0.5">412/412 checks clear</div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-[10px] font-bold text-amber-700">Step 3: Dean Sign-off</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {endorsed ? 'Signed by Dean ✓' : 'Pending Central Dean'}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Awaiting your authorization</div>
              </div>
            </div>
          </div>

          {/* Response Thread & Notes */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ADMINISTRATIVE RESPONSE THREAD & AUDIT LOG
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 max-h-28 overflow-y-auto">
              {notes.map((n, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                  {n}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add administrative note or stipulation (visible to registry)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={handlePostNote}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Post Note
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Cryptographic Dean signature will be appended to Autumn '26 Master Graph.</span>
            </div>

            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all">
                Reject with Reason
              </button>
              <button
                onClick={() => setEndorsed(true)}
                disabled={endorsed}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{endorsed ? 'Endorsed & Applied ✓' : 'Endorse & Apply to Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
