import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  Users,
  Search,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';

interface FacultyVenueBookingProps {
  currentUser: UserItem;
}

export const FacultyVenueBooking: React.FC<FacultyVenueBookingProps> = ({ currentUser }) => {
  const [bookedMsg, setBookedMsg] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            INSTITUTIONAL ASSET OPS • ZONE A • CHILIKA IT CAMPUS • FACULTY PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Academic Venue & Lab Requisition
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Reserve lecture halls, smart seminar halls, and compute labs for extra lectures, guest seminars, or remedial laboratory sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            My Requisitions (2)
          </button>
          <button
            onClick={() => setBookedMsg(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Request Venue Reservation</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Reservation Date</label>
            <div className="flex items-center space-x-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>26 Oct 2026</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</label>
            <div className="flex items-center space-x-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>02:00 PM – 04:00 PM</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Venue Classification</label>
            <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <option>Smart Seminar Halls</option>
              <option>Computing Labs</option>
              <option>Lecture Theatres</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity Bound</label>
            <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <option>40 – 100 Seats</option>
              <option>&gt; 100 Seats</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Active Filter Stack:</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Zone A Campus</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">A/V Projector Equipped</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Central HVAC Ready</span>
          </div>
          <span>14 Venues Online • Real-time Sync: 13:42 IST</span>
        </div>
      </div>

      {bookedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>✓ Reservation ticket submitted to CSE Academic Coordinator & Deanery. Reference: REQ-VN-8849</span>
          <button onClick={() => setBookedMsg(false)} className="underline text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* Available Academic Venues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Available Academic Venues (Ready for Faculty Booking)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Venue 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  Available Today • 02:00 PM - 05:00 PM
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">#SH-B301</span>
              </div>
              <div className="text-[10px] text-slate-400">BUILDING ALPHA • LEVEL 3</div>
              <h3 className="text-base font-black text-slate-900">Smart Seminar Hall B</h3>
              <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>200 Seats</span>
                  <span className="text-emerald-600 font-semibold">Central HVAC active</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Dual Projectors</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Smart Podium</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Dual Lavalier Mics</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBookedMsg(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Book This Venue →
            </button>
          </div>

          {/* Venue 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  Free After 03:00 PM
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">#SYS-L104</span>
              </div>
              <div className="text-[10px] text-slate-400">COMPUTING WING • FLOOR 1</div>
              <h3 className="text-base font-black text-slate-900">Systems Lab 1</h3>
              <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>40 Workstations</span>
                  <span className="text-blue-600 font-semibold">10 Gbps Fiber Uplink</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Linux Clusters (Debian)</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">High-Speed Net</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">UPS Dedicated</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBookedMsg(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Book This Venue →
            </button>
          </div>

          {/* Venue 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Available Now
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">#LH-B203</span>
              </div>
              <div className="text-[10px] text-slate-400">BLOCK B • 2ND FLOOR</div>
              <h3 className="text-base font-black text-slate-900">B-Block Lecture Hall 203</h3>
              <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>65 Tiered Seats</span>
                  <span className="text-slate-700 font-semibold">Bose Sound Bar</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Interactive Smartboard</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">AV Deck System</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">Acoustic Paneling</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setBookedMsg(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Book This Venue →
            </button>
          </div>
        </div>
      </div>

      {/* Booking History Table & Governance Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <div className="font-bold text-slate-900">My Venue Requisitions & Booking History</div>
            <span className="text-[10px] text-slate-500">Logged in as: <strong>Dr. R. Pattnaik (CSE Dept)</strong></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-2.5">REQUISITION ID</th>
                  <th className="p-2.5">REQUESTED VENUE</th>
                  <th className="p-2.5">INTENDED PURPOSE</th>
                  <th className="p-2.5">DATE & TIME</th>
                  <th className="p-2.5">ATTENDEES</th>
                  <th className="p-2.5">APPROVAL STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">REQ-VN-8841</td>
                  <td className="p-2.5 font-bold text-slate-800">Systems Lab 1</td>
                  <td className="p-2.5 text-slate-600">CS304 OS Shell Remedial Lab</td>
                  <td className="p-2.5 text-slate-600">Wed 29 Oct • 02:00 - 04:00 PM</td>
                  <td className="p-2.5 font-bold text-slate-800">42 Students</td>
                  <td className="p-2.5">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Approved
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">REQ-VN-8819</td>
                  <td className="p-2.5 font-bold text-slate-800">Smart Seminar Hall B</td>
                  <td className="p-2.5 text-slate-600">Guest Keynote AWS Architect</td>
                  <td className="p-2.5 text-slate-600">Fri 31 Oct • 03:30 - 05:30 PM</td>
                  <td className="p-2.5 font-bold text-slate-800">85 Students</td>
                  <td className="p-2.5">
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Pending Dean Review
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
          <div>
            <div className="font-bold text-slate-900">Faculty Booking Governance</div>
            <p className="text-[11px] text-slate-500 mt-1">
              All space allocations within Zone A conform to CIT Scheduling Guidelines. Requisitions enforce a strict 24-hour lead time for standard lecture halls.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between font-bold text-slate-800">
              <span>FACULTY ALLOCATION QUOTA</span>
              <span className="text-blue-600">8 / 12 Hrs</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[66%]"></div>
            </div>
            <div className="text-[10px] text-slate-500">
              Remaining weekly reservation allowance: <strong>4.0 academic hours</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
