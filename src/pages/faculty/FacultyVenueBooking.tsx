import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import { UserItem, Booking, VenueItem } from '../../types';
import { venueService } from '../../services/venueService';

interface FacultyVenueBookingProps {
  currentUser: UserItem;
}

export const FacultyVenueBooking: React.FC<FacultyVenueBookingProps> = ({ currentUser }) => {
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookedMsg, setBookedMsg] = useState<{ id: string; venue: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [selectedDay, setSelectedDay] = useState('MON');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6); // Period 6 = 13:30 - 14:20 / 14:00 PM
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [selectedCapacity, setSelectedCapacity] = useState('all');

  // Booking Modal state
  const [showModal, setShowModal] = useState(false);
  const [targetVenue, setTargetVenue] = useState<VenueItem | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    attendance: 60,
    fromPeriod: 6,
    toPeriod: 7,
    day: 'MON',
    needs: ['projector', 'sound_system'],
  });

  const requisitionsRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [vRes, bRes] = await Promise.all([
        venueService.getVenues(currentUser.token, {
          day: selectedDay,
          period: selectedPeriod,
        }),
        venueService.getBookings(currentUser.token, { mine: true }),
      ]);
      setVenues(vRes.data || []);
      setMyBookings(bRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load venue availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedDay, selectedPeriod]);

  // Filtered venues based on Classification & Capacity
  const filteredVenues = venues.filter((venue) => {
    if (selectedClassification !== 'all') {
      const type = venue.type.toLowerCase();
      if (selectedClassification === 'seminar' && type !== 'seminar_hall') return false;
      if (selectedClassification === 'compute' && !type.startsWith('lab') && type !== 'computer_lab') return false;
      if (selectedClassification === 'lecture' && type !== 'lecture_hall' && type !== 'auditorium') return false;
      if (selectedClassification === 'classroom' && type !== 'classroom') return false;
    }

    if (selectedCapacity === '40-100' && (venue.capacity < 40 || venue.capacity > 100)) return false;
    if (selectedCapacity === '>100' && venue.capacity <= 100) return false;
    if (selectedCapacity === '>200' && venue.capacity <= 200) return false;

    return true;
  });

  const handleOpenBookModal = (venue?: VenueItem) => {
    if (venue) {
      setTargetVenue(venue);
      setBookingForm((prev) => ({
        ...prev,
        attendance: Math.min(prev.attendance, venue.capacity),
        day: selectedDay,
        fromPeriod: selectedPeriod,
        toPeriod: Math.min(9, selectedPeriod + 1),
      }));
    } else {
      setTargetVenue(venues[0] || null);
      setBookingForm((prev) => ({
        ...prev,
        day: selectedDay,
        fromPeriod: selectedPeriod,
        toPeriod: Math.min(9, selectedPeriod + 1),
      }));
    }
    setShowModal(true);
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.title.trim()) {
      setErrorMsg('Event/Requisition title is required.');
      return;
    }

    const venue = targetVenue || venues[0];
    if (venue && bookingForm.attendance > venue.capacity) {
      setErrorMsg(`Attendee count (${bookingForm.attendance}) exceeds venue capacity (${venue.capacity}).`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const newBooking = await venueService.createBooking(currentUser.token, {
        title: bookingForm.title.trim(),
        attendance: Number(bookingForm.attendance),
        duration_periods: Math.max(1, bookingForm.toPeriod - bookingForm.fromPeriod + 1),
        windows: [
          {
            day: bookingForm.day,
            from_period: Number(bookingForm.fromPeriod),
            to_period: Number(bookingForm.toPeriod),
          },
        ],
        requested_room: venue?.id || null,
        room_types: venue ? [venue.type] : ['seminar_hall'],
        needs: bookingForm.needs,
        requested_category: 'guest_lecture',
      });

      setShowModal(false);
      setBookedMsg({ id: newBooking.id, venue: venue?.name || 'Academic Venue' });
      setBookingForm({
        title: '',
        attendance: 60,
        fromPeriod: selectedPeriod,
        toPeriod: Math.min(9, selectedPeriod + 1),
        day: selectedDay,
        needs: ['projector', 'sound_system'],
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit requisition.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequisition = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this reservation request?')) return;
    try {
      setErrorMsg(null);
      await venueService.cancelBooking(currentUser.token, id);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel requisition.');
    }
  };

  const scrollToRequisitions = () => {
    requisitionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
          <button
            onClick={scrollToRequisitions}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-all"
          >
            <span>My Requisitions ({myBookings.length})</span>
          </button>
          <button
            onClick={() => handleOpenBookModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Request Venue Reservation</span>
          </button>
        </div>
      </div>

      {/* Error & Success Feedback */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline text-red-700">Dismiss</button>
        </div>
      )}

      {bookedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Reservation ticket submitted to CSE Academic Coordinator & Deanery. Reference: <strong>{bookedMsg.id}</strong> ({bookedMsg.venue})
            </span>
          </div>
          <button onClick={() => setBookedMsg(null)} className="font-bold underline text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Reservation Day</label>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">Venue Classification</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-blue-600"
            >
              <option value="all">All Classifications</option>
              <option value="seminar">Smart Seminar Halls</option>
              <option value="compute">Computing Labs</option>
              <option value="lecture">Lecture Theatres & Auditoriums</option>
              <option value="classroom">Classrooms</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity Bound</label>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-blue-600"
            >
              <option value="all">Any Capacity</option>
              <option value="40-100">40 – 100 Seats</option>
              <option value=">100">&gt; 100 Seats</option>
              <option value=">200">&gt; 200 Seats</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">Active Criteria:</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{selectedDay} Period {selectedPeriod}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">{selectedClassification}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{selectedCapacity}</span>
          </div>
          <span>{filteredVenues.length} Venues Matching • Real-time Sync Active</span>
        </div>
      </div>

      {/* Available Academic Venues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Available Academic Venues (Ready for Faculty Booking on {selectedDay} Period {selectedPeriod})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-xs text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Scanning venue availability...</span>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No Venues Match Selected Filters</div>
            <p className="text-[11px] text-slate-400">
              Try adjusting the classification, capacity range, or selecting another day/period slot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const isMaintenance = venue.current_status === 'maintenance';
              const isOccupied = venue.current_status === 'occupied';
              const isAvailable = venue.current_status === 'available';

              return (
                <div
                  key={venue.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMaintenance
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : isOccupied
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {venue.status_label || (isMaintenance ? 'Under Maintenance' : isOccupied ? 'Occupied' : 'Available Now')}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-400">#{venue.id}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{venue.building}</div>
                    <h3 className="text-base font-black text-slate-900">{venue.name}</h3>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                      <div className="flex justify-between font-semibold">
                        <span>{venue.capacity} Seats</span>
                        <span className="text-slate-500 capitalize">{venue.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-1">
                        {venue.features?.map((f) => (
                          <span key={f} className="bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                            {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBookModal(venue)}
                    disabled={isMaintenance}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      isMaintenance
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isOccupied
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isMaintenance ? 'Unavailable (Maintenance)' : isOccupied ? 'Request Alternate Slot →' : 'Book This Venue →'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking History Table & Governance Protocol */}
      <div ref={requisitionsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <div className="font-bold text-slate-900">My Venue Requisitions & Booking History</div>
            <span className="text-[10px] text-slate-500">
              Logged in as: <strong>{currentUser.name} ({currentUser.department || 'Faculty'})</strong>
            </span>
          </div>

          {myBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
              <div>No requisitions submitted yet.</div>
            </div>
          ) : (
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
                    <th className="p-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBookings.map((b) => {
                    const isApproved = b.status === 'approved';
                    const isPending = b.status === 'pending';
                    const isRejected = b.status === 'rejected';

                    const day = b.allocated_day || b.windows?.[0]?.day || 'MON';
                    const sp = b.allocated_start_period || b.windows?.[0]?.from_period || 1;
                    const ep = b.allocated_end_period || b.windows?.[0]?.to_period || sp;

                    return (
                      <tr key={b.id}>
                        <td className="p-2.5 font-mono font-bold text-blue-600">{b.id}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {b.allocated_room || b.requested_room || 'Pending Assignment'}
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[180px] truncate" title={b.title}>
                          {b.title}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {day} • Periods {sp}-{ep}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">{b.attendance}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Rejected'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {isPending && (
                            <button
                              onClick={() => handleCancelRequisition(b.id)}
                              className="text-[10px] text-red-500 hover:text-red-700 font-semibold p-1"
                              title="Withdraw requisition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
              <span className="text-blue-600">Active</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${Math.min(100, (myBookings.filter((b) => b.status === 'approved').length / 5) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-500">
              Total active approved reservations: <strong>{myBookings.filter((b) => b.status === 'approved').length}</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* REQUISITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Request Venue Reservation</h3>
                <p className="text-slate-500">Submit space requisition for Academic Deanery / HOD review.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Venue</label>
                <select
                  value={targetVenue?.id || ''}
                  onChange={(e) => {
                    const found = venues.find((v) => v.id === e.target.value);
                    setTargetVenue(found || null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-bold"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id}) - Cap: {v.capacity} seats ({v.building})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Intended Purpose / Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remedial Session on Compiler Optimizations"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min="1"
                    max={targetVenue?.capacity || 600}
                    required
                    value={bookingForm.attendance}
                    onChange={(e) => setBookingForm({ ...bookingForm, attendance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day of Reservation</label>
                  <select
                    value={bookingForm.day}
                    onChange={(e) => setBookingForm({ ...bookingForm, day: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-bold"
                  >
                    <option value="MON">Monday</option>
                    <option value="TUE">Tuesday</option>
                    <option value="WED">Wednesday</option>
                    <option value="THU">Thursday</option>
                    <option value="FRI">Friday</option>
                    <option value="SAT">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Period</label>
                  <select
                    value={bookingForm.fromPeriod}
                    onChange={(e) => setBookingForm({ ...bookingForm, fromPeriod: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Period</label>
                  <select
                    value={bookingForm.toPeriod}
                    onChange={(e) => setBookingForm({ ...bookingForm, toPeriod: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Technical Needs</label>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                  {['projector', 'sound_system', 'mic', 'ac', 'stage'].map((n) => (
                    <label key={n} className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingForm.needs.includes(n)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...bookingForm.needs, n]
                            : bookingForm.needs.filter((x) => x !== n);
                          setBookingForm({ ...bookingForm, needs: updated });
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="capitalize">{n.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Submitting...' : 'Submit Requisition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
