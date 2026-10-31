import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Info,
  ListOrdered,
} from 'lucide-react';
import { UserItem, Booking, VenueItem } from '../../types';
import { venueService, AvailabilitySlot } from '../../services/venueService';

interface StudentVenueBookingProps {
  currentUser: UserItem;
  bookings?: Booking[];
}

export const StudentVenueBooking: React.FC<StudentVenueBookingProps> = ({ currentUser }) => {
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [publicBookings, setPublicBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedDay, setSelectedDay] = useState('MON');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6); // Period 6 = 14:00 PM
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');

  // Modals
  const [matrixVenue, setMatrixVenue] = useState<VenueItem | null>(null);
  const [matrixSlots, setMatrixSlots] = useState<AvailabilitySlot[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const [waitlistVenue, setWaitlistVenue] = useState<VenueItem | null>(null);
  const [waitlistPurpose, setWaitlistPurpose] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const [specsVenue, setSpecsVenue] = useState<VenueItem | null>(null);
  const [showCallDeskModal, setShowCallDeskModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [vRes, bRes] = await Promise.all([
        venueService.getVenues(currentUser.token, {
          day: selectedDay,
          period: selectedPeriod,
        }),
        venueService.getBookings(currentUser.token, { status: 'approved' }),
      ]);
      setVenues(vRes.data || []);
      setPublicBookings(bRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load venue and schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedDay, selectedPeriod]);

  // Filtered venues based on category and capacity
  const filteredVenues = venues.filter((venue) => {
    if (selectedCategory !== 'all') {
      const type = venue.type.toLowerCase();
      if (selectedCategory === 'auditorium' && type !== 'auditorium') return false;
      if (selectedCategory === 'seminar' && type !== 'seminar_hall') return false;
      if (selectedCategory === 'lecture' && type !== 'lecture_hall') return false;
      if (selectedCategory === 'lab' && !type.startsWith('lab') && type !== 'computer_lab') return false;
    }

    if (selectedCapacity === '50-200' && (venue.capacity < 50 || venue.capacity > 200)) return false;
    if (selectedCapacity === '>200' && venue.capacity <= 200) return false;
    if (selectedCapacity === '>400' && venue.capacity <= 400) return false;

    return true;
  });

  // Open Availability Matrix Modal
  const handleOpenMatrix = async (venue: VenueItem) => {
    setMatrixVenue(venue);
    setMatrixLoading(true);
    try {
      const res = await venueService.getVenueAvailability(currentUser.token, venue.id, selectedDay);
      setMatrixSlots(res.data.slots || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch availability matrix');
    } finally {
      setMatrixLoading(false);
    }
  };

  // Open Waitlist Modal
  const handleOpenWaitlist = (venue: VenueItem) => {
    setWaitlistVenue(venue);
    setWaitlistPurpose('');
  };

  // Submit Waitlist
  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistVenue) return;
    try {
      setWaitlistSubmitting(true);
      setErrorMsg(null);
      await venueService.joinWaitlist(currentUser.token, {
        venue_id: waitlistVenue.id,
        day: selectedDay,
        period: selectedPeriod,
        purpose: waitlistPurpose.trim() || 'Student Extracurricular / Study Group Requisition',
      });
      setSuccessMsg(`Successfully joined waitlist for ${waitlistVenue.name} on ${selectedDay} Period ${selectedPeriod}.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setWaitlistVenue(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join waitlist.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header - DIRECT BOOKING CONTROLS REMOVED */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            INSTITUTIONAL ASSET OPS • ZONE A • CHILIKA IT CAMPUS • STUDENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Spectra Venue Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized reservation telemetry for auditoriums, smart seminar halls, amphitheaters, and conference suites.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            Confirmed Campus Bookings: <strong>{publicBookings.length}</strong>
          </div>
          <button
            onClick={() => setShowCallDeskModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Call Estate Desk</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline text-red-700">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold underline text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Day of Week</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-blue-600"
            >
              <option value="MON">Monday</option>
              <option value="TUE">Tuesday</option>
              <option value="WED">Wednesday</option>
              <option value="THU">Thursday</option>
              <option value="FRI">Friday</option>
              <option value="SAT">Saturday</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Time Slot</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-blue-600"
            >
              <option value="1">Period 1 (08:30 - 09:20)</option>
              <option value="2">Period 2 (09:30 - 10:20)</option>
              <option value="3">Period 3 (10:30 - 11:20)</option>
              <option value="4">Period 4 (11:30 - 12:20)</option>
              <option value="5">Period 5 (12:30 - 13:20)</option>
              <option value="6">Period 6 (13:30 - 14:20)</option>
              <option value="7">Period 7 (14:30 - 15:20)</option>
              <option value="8">Period 8 (15:30 - 16:20)</option>
              <option value="9">Period 9 (16:30 - 17:20)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Venue Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-blue-600"
            >
              <option value="all">All Types (Tier 1-4)</option>
              <option value="auditorium">Auditoriums</option>
              <option value="seminar">Seminar Halls</option>
              <option value="lecture">Lecture Theatres</option>
              <option value="lab">Computer & Science Labs</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity Scale</label>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-blue-600"
            >
              <option value="all">Any Capacity</option>
              <option value="50-200">50 – 200 Seats</option>
              <option value=">200">&gt; 200 Seats</option>
              <option value=">400">&gt; 400 Seats</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Filter Criteria:</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{selectedDay} Period {selectedPeriod}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">{selectedCategory}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{selectedCapacity}</span>
          </div>
          <span>{filteredVenues.length} Venues Displayed</span>
        </div>
      </div>

      {/* Available Venues Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Available Venues <span className="text-slate-400 font-normal">({filteredVenues.length} Spaces Registered)</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Slot: {selectedDay} Period {selectedPeriod}</span>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-xs text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Scanning venue telemetry...</span>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No Venues Match Selected Filters</div>
            <p className="text-[11px] text-slate-400">
              Try adjusting category or capacity scale, or checking another time slot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const isMaintenance = venue.current_status === 'maintenance';
              const isOccupied = venue.current_status === 'occupied';

              return (
                <div
                  key={venue.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                          isMaintenance
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : isOccupied
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isMaintenance ? 'bg-red-500' : isOccupied ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        ></span>
                        <span>{venue.status_label || (isMaintenance ? 'Under Maintenance' : isOccupied ? 'Occupied' : 'Available Now')}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">#{venue.id}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{venue.building}</span>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">{venue.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <span>Cap: {venue.capacity} Seats</span>
                      <span className="capitalize">• {venue.type.replace(/_/g, ' ')}</span>
                      {venue.features?.slice(0, 2).map((feat) => (
                        <span key={feat} className="capitalize">• {feat.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>

                  {/* Student Permitted Controls: Availability Matrix, Waitlist, Hall Specs */}
                  <div className="p-5 pt-0 space-y-2">
                    <button
                      onClick={() => handleOpenMatrix(venue)}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                    >
                      <span>View Availability Matrix</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenWaitlist(venue)}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                      >
                        Join Waitlist
                      </button>
                      <button
                        onClick={() => setSpecsVenue(venue)}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-all"
                      >
                        Hall Specs
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Campus Reservations & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real Confirmed Bookings Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Confirmed Institutional Events & Bookings ({publicBookings.length})</span>
            </div>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Realtime Verified</span>
            </span>
          </div>

          {publicBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
              <div>No public confirmed events scheduled.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">REF ID</th>
                    <th className="p-2.5">ORGANIZING UNIT</th>
                    <th className="p-2.5">VENUE</th>
                    <th className="p-2.5">DAY & TIME</th>
                    <th className="p-2.5">EVENT TITLE</th>
                    <th className="p-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {publicBookings.map((b) => {
                    const day = b.allocated_day || b.windows?.[0]?.day || 'MON';
                    const sp = b.allocated_start_period || b.windows?.[0]?.from_period || 1;
                    const ep = b.allocated_end_period || b.windows?.[0]?.to_period || sp;

                    return (
                      <tr key={b.id}>
                        <td className="p-2.5 font-mono font-bold text-blue-600">{b.id}</td>
                        <td className="p-2.5 font-medium text-slate-800">
                          {b.requester}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {b.allocated_room || b.requested_room || 'Assigned'}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {day} • Periods {sp}-{ep}
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[200px] truncate" title={b.title}>
                          {b.title}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reservation Guidelines (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
          <div className="font-bold text-slate-900">Student Space Governance</div>
          <div className="text-[10px] text-slate-400">Policy Matrix • CIT Academic Year 2026</div>

          <div className="space-y-2.5 text-slate-600">
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-800">Faculty Sponsor Required:</strong> All student club events require official sponsorship from a Faculty In-Charge or Department Coordinator.
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-800">Real-Time Availability:</strong> Use the Availability Matrix to view open slots prior to consulting your faculty advisor.
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-800">Waitlist Notifications:</strong> Joining a slot's waitlist records your intent and alerts coordinators if a slot becomes available.
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400">Campus Estate Office</div>
              <div className="font-bold text-slate-800">Ext 402 • Central Admin</div>
            </div>
            <button
              onClick={() => setShowCallDeskModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px]"
            >
              Call Desk
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Availability Matrix Modal */}
      {matrixVenue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Venue Availability Matrix</h3>
                <p className="text-slate-500">
                  {matrixVenue.name} ({matrixVenue.id}) • {selectedDay} Schedule
                </p>
              </div>
              <button
                onClick={() => setMatrixVenue(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {matrixLoading ? (
              <div className="py-8 flex items-center justify-center space-x-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading slot matrix...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {matrixSlots.map((slot) => {
                  const isAvailable = slot.status === 'available';
                  const isMaintenance = slot.status === 'maintenance';

                  return (
                    <div
                      key={slot.period}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isAvailable
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : isMaintenance
                          ? 'bg-red-50/50 border-red-200 text-red-900'
                          : 'bg-amber-50/50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold">
                          Period {slot.period} ({slot.time})
                        </div>
                        <div className="text-[11px] opacity-80">{slot.label}</div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMaintenance
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isAvailable ? 'Free' : isMaintenance ? 'Maintenance' : 'Occupied'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setMatrixVenue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Waitlist & Slot Check Modal */}
      {waitlistVenue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Check Slot & Join Waitlist</h3>
                <p className="text-slate-500">
                  {waitlistVenue.name} ({waitlistVenue.id})
                </p>
              </div>
              <button
                onClick={() => setWaitlistVenue(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-700">
                <span>Selected Window:</span>
                <strong className="text-slate-900">{selectedDay} Period {selectedPeriod}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Current Slot Status:</span>
                <span className="font-bold capitalize text-blue-600">
                  {waitlistVenue.current_status || 'Available'}
                </span>
              </div>
            </div>

            {waitlistVenue.current_status === 'available' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>This slot is currently AVAILABLE!</span>
                </div>
                <p className="text-[11px]">
                  Students cannot book venues directly. Please contact your Faculty Advisor or Department Coordinator with this slot information to submit an official reservation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitWaitlist} className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                  This venue is occupied or blocked for maintenance during this slot. Joining the waitlist registers your group's queue position in persistent storage.
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Purpose / Club Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACM Student Chapter Technical Meetup"
                    value={waitlistPurpose}
                    onChange={(e) => setWaitlistPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWaitlistVenue(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1"
                  >
                    {waitlistSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{waitlistSubmitting ? 'Joining...' : 'Confirm Waitlist Entry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Hall Specs Modal */}
      {specsVenue && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{specsVenue.name}</h3>
                <p className="text-slate-500 font-mono">Code: #{specsVenue.id}</p>
              </div>
              <button
                onClick={() => setSpecsVenue(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100 text-slate-700">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Location:</span>
                <strong className="text-slate-900">{specsVenue.building}</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Classification:</span>
                <strong className="text-slate-900 capitalize">{specsVenue.type.replace(/_/g, ' ')}</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Maximum Capacity:</span>
                <strong className="text-slate-900">{specsVenue.capacity} Seats</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Accessibility:</span>
                <strong className="text-slate-900">
                  {specsVenue.accessible ? 'Wheelchair Accessible (Ramp Equipped)' : 'Standard Access'}
                </strong>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Installed Equipment & Facilities:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {specsVenue.features?.map((f) => (
                    <span key={f} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md capitalize font-medium">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Authorized Use Cases:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {specsVenue.allowed_uses?.map((u) => (
                    <span key={u} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md capitalize font-medium">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSpecsVenue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Call Desk Modal */}
      {showCallDeskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Campus Estate Office Desk</h3>
                  <p className="text-slate-500">Facilities, Logistics & Emergency Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowCallDeskModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Direct Telephone Link</div>
                <div className="text-sm font-black text-slate-900">
                  <a href="tel:+916756234402" className="text-blue-600 hover:underline">
                    +91 6756 234402
                  </a>
                  <span className="text-xs font-normal text-slate-500 ml-2">(Campus Ext: 402)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Electronic Mail</div>
                <div className="text-xs font-bold text-slate-800">
                  <a href="mailto:estate-desk@chilika.ac.in" className="text-blue-600 hover:underline">
                    estate-desk@chilika.ac.in
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Physical Office Location</div>
                <div className="text-xs font-bold text-slate-800">
                  Central Administration Block, Ground Floor, Room 102
                </div>
                <div className="text-[10px] text-slate-500">Office Hours: 08:00 AM – 08:00 PM IST (Mon – Sat)</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowCallDeskModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
