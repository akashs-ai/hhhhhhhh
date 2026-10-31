import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  VolumeX,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import { UserItem, Booking } from '../../types';

interface AdminVenueBookingProps {
  currentUser: UserItem;
  bookings?: Booking[];
}

export const AdminVenueBooking: React.FC<AdminVenueBookingProps> = ({ currentUser }) => {
  const [resolvedConflict, setResolvedConflict] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Admin Authority &gt; Spectra Venue Operations</span>
            <span>•</span>
            <span className="text-slate-500">Space Matrix 2026-Q3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Campus Venue & Facility Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time scheduling arbitration, spatial sound-boundary enforcement, and facility allocation telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            Export Occupancy Report
          </button>
          <button className="px-3.5 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 shadow-2xs">
            Block Venue for Maintenance
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2">
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Venue</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL CAMPUS VENUES</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">14</span>
            <span className="text-xs font-medium text-slate-500">Facilities Listed</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">11 Active / 2 Reserved / 1 Blocked</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACTIVE RESERVATIONS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">26</span>
            <span className="text-xs font-medium text-slate-500">Events Today</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-2">Next handover in 24m (Hall B)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VENUE OCCUPANCY RATE</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">84.6%</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Peak Saturation</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-blue-600 h-full w-[84.6%]"></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING APPROVALS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-red-600">4</span>
            <span className="text-xs font-medium text-slate-500">Require Clearance</span>
          </div>
          <div className="text-[11px] text-red-500 font-medium mt-2">1 flagged: Sound bleed warning</div>
        </div>
      </div>

      {/* Spatial Conflict Red Alert Banner */}
      {!resolvedConflict ? (
        <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">
                  Spatial Conflict Detected: CSE Lecture Hall Wing A / Adjacent Seminar 2
                </span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  48-Hr Rule Violation
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Robotics Guild requested Bass PA Audio amplification during mid-term exam schedule of CS-302 Formal Languages. Zero acoustic bleeding policy strictly enforced (Max 45 dB threshold).
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setResolvedConflict(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              Re-route to Sub-Auditorium
            </button>
            <button
              onClick={() => setResolvedConflict(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
            >
              Reject Sound Exception
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Acoustic violation mitigated: Space re-routed to Sound-Proof Sub-Auditorium. Zero spillover.</span>
        </div>
      )}

      {/* Middle Layout: Approvals Queue (7 Cols) + Venue Directory (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Requisitions & Administrative Approvals Queue</h2>
              <p className="text-[11px] text-slate-500">Review space permits, technical rider specifications, and safety guidelines.</p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              4 Unresolved
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Requisition 1 */}
            <div className="py-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Spectra Coding Club</span>
                  <span className="text-[10px] text-slate-400 ml-2">Lead: Aryan Mahapatra (Student Guild)</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  Passes 48h Advance Rule
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <strong>HackChilika 36h Keynote</strong> • Opening address, guest keynote • Cap: 380 delegates
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Requested: <strong className="text-slate-800">Main Auditorium</strong></span>
                <span>Oct 24, 2026 • 09:00 - 13:30 IST (4h 30m window)</span>
              </div>
            </div>

            {/* Requisition 2 */}
            <div className="py-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Dept. of CSE</span>
                  <span className="text-[10px] text-slate-400 ml-2">Prof. A. Ray (Chairperson)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Deans Office Clearance
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <strong>Doctoral Colloquium Q3</strong> • PhD defense session & viva • Cap: 45 delegates
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Requested: <strong className="text-slate-800">Smart Seminar Hall B</strong></span>
                <span>Tomorrow • 14:00 - 17:30 IST</span>
              </div>
            </div>

            {/* Requisition 3 */}
            <div className="py-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-red-600 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Robotics Guild</span>
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">S. Pattnaik (Mech UG3)</span>
                </div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Failed Acoustic Check &gt; 82dB
                </span>
              </div>
              <div className="text-[11px] text-slate-700">
                <strong>Autonomous Bot Arena Trials</strong> • Pneumatics test bench • Cap: 70 delegates
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Requested: <strong className="text-slate-800">Systems Lab 1</strong></span>
                <span className="text-red-500 font-semibold">Today (15:00 - 18:00) Overlap w/ Formal Lang Exam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Inventory Directory */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Venue Inventory Directory</h2>
              <p className="text-[11px] text-slate-500">Real-Time Status & Physical Telemetry</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Venue 1 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Main Campus Auditorium</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Occupied until 16:00
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Building Alpha, Central Quad</div>
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-2">
                <span>600 Seats</span>
                <span>• Dolby Atmos</span>
                <span>• 4K Tri-Projector</span>
              </div>
            </div>

            {/* Venue 2 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Smart Seminar Hall B</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available Now
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Computing Complex, Level 3</div>
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-2">
                <span>90 Tiered Seats</span>
                <span>• Polycom VC</span>
                <span>• Dual HVAC</span>
              </div>
            </div>

            {/* Venue 3 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Systems Research Lab 1</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Under Noise Audit
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mechanical & CSE Annex, Gr. Fl</div>
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-2">
                <span>75 Workstations</span>
                <span>• CNC / Bench Setup</span>
                <span>• SPL Sensor 03</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
