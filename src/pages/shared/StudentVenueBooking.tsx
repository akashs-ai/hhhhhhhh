import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Phone,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserItem, Booking } from '../../types';

interface StudentVenueBookingProps {
  currentUser: UserItem;
  bookings?: Booking[];
}

export const StudentVenueBooking: React.FC<StudentVenueBookingProps> = ({ currentUser }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            INSTITUTIONAL ASSET OPS • ZONE A • CHILIKA IT CAMPUS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Spectra Venue Booking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized reservation portal for auditoriums, smart seminar halls, amphitheaters, and conference suites.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
            My Bookings (2)
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Book Venue</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <div className="flex items-center space-x-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>25 Oct 2026</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</label>
            <div className="flex items-center space-x-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>02:00 PM – 06:00 PM</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Venue Category</label>
            <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <option>All Types (Tier 1-4)</option>
              <option>Auditoriums</option>
              <option>Seminar Halls</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity Scale</label>
            <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
              <option>50 – 500+ Seats</option>
              <option>&gt; 200 Seats</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Specs:</span>
            {['Dual Projector', 'Dolby Audio', 'Smart Podium', 'Central AC', 'Live Streaming Rack'].map((spec) => (
              <span key={spec} className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                {spec}
              </span>
            ))}
          </div>
          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs">
            Find Venues
          </button>
        </div>
      </div>

      {/* Available Venues Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Available Venues <span className="text-slate-400 font-normal">(3 Spaces Ready for Reservation)</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Sort by: Capacity (High to Low)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Available Today • 3:00 PM+</span>
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">AUD-01</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">FLAGSHIP FACILITY</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Main Auditorium (Spectra Arena)</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <span>Cap: 500 Seats</span>
                <span>• Dolby Atmos</span>
                <span>• A/V Tier 1</span>
                <span>• Central AC</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500">
                Next Blocked Event: <strong>Annual Alumni Meet • 28 Oct</strong>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-2">
              <button
                onClick={() => setBookedSuccess(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Reserve Venue →
              </button>
              <button className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                View Availability Matrix
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Reserved Until 04:00 PM</span>
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">SEM-02</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">ACADEMIC SUITE</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Smart Seminar Hall B</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <span>Cap: 200 Seats</span>
                <span>• Dual Projectors</span>
                <span>• Smart Podium</span>
                <span>• Central AC</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500">
                Active: Coding Club Hackathon • <strong>Free from 04:30 PM Onwards</strong>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-2">
              <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
                Join Waitlist / Check Slots
              </button>
              <button className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                Hall Specifications & Details
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Available Now</span>
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">CONF-01</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">EXECUTIVE ANNEX</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Executive Conference Room A</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <span>Cap: 50 Seats</span>
                <span>• 4K Video Wall</span>
                <span>• Polycom VC Hub</span>
                <span>• Sound-Proof</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500">
                Instant Dean Approval Path: <strong>Ready for Department Council</strong>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-2">
              <button
                onClick={() => setBookedSuccess(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Reserve Venue →
              </button>
              <button className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                Details & Setup Options
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation feedback */}
      {bookedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Requisition submitted successfully! Staged with reference CIT-BK-9926 for Dean review.</span>
          </div>
          <button onClick={() => setBookedSuccess(false)} className="font-bold underline text-emerald-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Section: Active Reservations + Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Reservations Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Active Venue Reservations & Approvals</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Realtime Sync</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-2.5">REFERENCE ID</th>
                  <th className="p-2.5">APPLICANT / UNIT</th>
                  <th className="p-2.5">VENUE</th>
                  <th className="p-2.5">DATE & SLOT</th>
                  <th className="p-2.5">PURPOSE</th>
                  <th className="p-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">CIT-BK-9921</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-800">Spectra Coding Club</div>
                    <div className="text-[10px] text-slate-400">A. Ray • Lead</div>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800">Smart Seminar Hall B</td>
                  <td className="p-2.5 text-slate-600">25 Oct 2026 • 14:00 - 16:00</td>
                  <td className="p-2.5 text-slate-600">Inter-college Hackathon</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Approved
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">CIT-BK-9924</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-800">Prof. S. Panda</div>
                    <div className="text-[10px] text-slate-400">Dept. of Computer Science</div>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800">Spectra Arena</td>
                  <td className="p-2.5 text-slate-600">28 Oct 2026 • 09:30 - 17:30</td>
                  <td className="p-2.5 text-slate-600">AI Systems Symposium</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Dean Review
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono font-bold text-blue-600">CIT-BK-9918</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-800">Robotics Guild</div>
                    <div className="text-[10px] text-slate-400">K. Mukherjee • Secretary</div>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800">Executive Conf Room A</td>
                  <td className="p-2.5 text-slate-600">26 Oct 2026 • 18:00 - 21:00</td>
                  <td className="p-2.5 text-slate-600">Autonomous Bot Trials</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                      Rejected (Time Conflict)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reservation Guidelines (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
          <div className="font-bold text-slate-900">Reservation Guidelines</div>
          <div className="text-[10px] text-slate-400">Policy Matrix • CIT Academic Year 2026</div>

          <div className="space-y-2.5 text-slate-600">
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-800">48-Hour Advance Rule:</strong> Auditoriums require minimum 48 hours advance submission for IT & custodial staging.
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-800">Dean Approval for Clubs:</strong> Student clubs require countersignature before automatic keyless room unlocking.
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-800">Class Disruption Zero-Tolerance:</strong> Acoustic bleeding into active lecture halls will be relocated.
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400">Need urgent emergency booking?</div>
              <div className="font-bold text-slate-800">Estate Desk: Ext 402 / Central Hub</div>
            </div>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px]">
              Call Desk
            </button>
          </div>
        </div>
      </div>

      {/* Real Venue Reservation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Venue Reservation Request</h3>
                <p className="text-xs text-slate-500">Subject to 48-Hour Advance Rule & SAT Constraint Verification</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const attendance = (form.elements.namedItem('attendance') as HTMLInputElement).value;
                const day = (form.elements.namedItem('day') as HTMLSelectElement).value;
                const fromPeriod = parseInt((form.elements.namedItem('fromPeriod') as HTMLSelectElement).value, 10);
                const toPeriod = parseInt((form.elements.namedItem('toPeriod') as HTMLSelectElement).value, 10);
                const roomType = (form.elements.namedItem('roomType') as HTMLSelectElement).value;

                try {
                  const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${currentUser.token}`,
                    },
                    body: JSON.stringify({
                      title,
                      attendance: Number(attendance),
                      duration_periods: Math.max(1, toPeriod - fromPeriod + 1),
                      windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
                      room_types: [roomType],
                      needs: ['projector', 'sound_system'],
                      requested_category: currentUser.role === 'club' ? 'club_event' : 'department_event',
                    }),
                  });

                  const json = await res.json();
                  if (!res.ok || !json.success) {
                    throw new Error(json.error?.message || 'Failed to submit reservation request.');
                  }

                  setShowBookingModal(false);
                  setBookedSuccess(true);
                  setTimeout(() => setBookedSuccess(false), 5000);
                } catch (err: any) {
                  alert(err.message || 'Error creating booking.');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event / Requisition Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. ACM Tech Symposium & Workshop"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Attendees</label>
                  <input
                    name="attendance"
                    type="number"
                    min="10"
                    max="600"
                    defaultValue="120"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Venue Preference</label>
                  <select name="roomType" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600">
                    <option value="auditorium">Tier-1 Auditorium (AUD)</option>
                    <option value="seminar_hall">Smart Seminar Hall (SH)</option>
                    <option value="lecture_hall">Tiered Lecture Hall (LH)</option>
                    <option value="computer_lab">Advanced Computing Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day</label>
                  <select name="day" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600">
                    <option value="mon">Monday</option>
                    <option value="tue">Tuesday</option>
                    <option value="wed">Wednesday</option>
                    <option value="thu">Thursday</option>
                    <option value="fri">Friday</option>
                    <option value="sat">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Period</label>
                  <select name="fromPeriod" defaultValue="6" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600">
                    <option value="1">Period 1 (08:00)</option>
                    <option value="2">Period 2 (09:00)</option>
                    <option value="4">Period 4 (11:00)</option>
                    <option value="6">Period 6 (14:00)</option>
                    <option value="8">Period 8 (16:00)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Period</label>
                  <select name="toPeriod" defaultValue="8" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600">
                    <option value="2">Period 2 (10:00)</option>
                    <option value="4">Period 4 (12:00)</option>
                    <option value="6">Period 6 (15:00)</option>
                    <option value="8">Period 8 (17:00)</option>
                    <option value="10">Period 10 (19:00)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit Reservation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

