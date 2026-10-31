import React, { useState, useEffect } from 'react';
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
  Wrench,
  Calendar,
  Check,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { UserItem, Booking, VenueItem } from '../../types';
import { venueService, VenueStats } from '../../services/venueService';

interface AdminVenueBookingProps {
  currentUser: UserItem;
  bookings?: Booking[];
}

export const AdminVenueBooking: React.FC<AdminVenueBookingProps> = ({ currentUser }) => {
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<VenueStats>({
    total_venues: 0,
    available_venues: 0,
    occupied_venues: 0,
    maintenance_venues: 0,
    active_venues: 0,
    occupancy_rate: 0,
    pending_approvals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState<Booking | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<Booking | null>(null);

  // Form states for Register Venue
  const [regForm, setRegForm] = useState({
    id: '',
    name: '',
    type: 'seminar_hall',
    building: 'Central Academic Block',
    capacity: 100,
    features: ['projector', 'sound_system', 'ac'],
    accessible: true,
  });

  // Form states for Block Venue
  const [blockForm, setBlockForm] = useState({
    room_id: '',
    day: 'MON',
    start_period: 1,
    end_period: 4,
    reason: '',
  });

  // Approval form state
  const [approveForm, setApproveForm] = useState({
    room_id: '',
    day: 'MON',
    start_period: 1,
    end_period: 2,
    reason: 'Approved by Department Head / Timetable Chair',
  });

  // Rejection form state
  const [rejectReason, setRejectReason] = useState('Capacity or schedule constraint');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [vRes, bRes] = await Promise.all([
        venueService.getVenues(currentUser.token),
        venueService.getBookings(currentUser.token, { status: 'pending' }),
      ]);
      setVenues(vRes.data || []);
      setStats(vRes.stats);
      setPendingBookings(bRes.data || []);

      if (vRes.data.length > 0 && !blockForm.room_id) {
        setBlockForm((prev) => ({ ...prev, room_id: vRes.data[0].id }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load venue and booking records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handle Export Occupancy Report
  const handleExport = async () => {
    try {
      setExporting(true);
      await venueService.exportOccupancyReport(currentUser.token);
      setSuccessMsg('Occupancy report exported successfully as CSV.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export occupancy report');
    } finally {
      setExporting(false);
    }
  };

  // Handle Register Venue Submission
  const handleRegisterVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await venueService.registerVenue(currentUser.token, {
        id: regForm.id.trim(),
        name: regForm.name.trim(),
        type: regForm.type,
        building: regForm.building.trim(),
        capacity: Number(regForm.capacity),
        features: regForm.features,
        accessible: regForm.accessible,
      });
      setShowRegisterModal(false);
      setSuccessMsg(`Venue '${regForm.name}' (${regForm.id.toUpperCase()}) registered successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setRegForm({
        id: '',
        name: '',
        type: 'seminar_hall',
        building: 'Central Academic Block',
        capacity: 100,
        features: ['projector', 'sound_system', 'ac'],
        accessible: true,
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register venue');
    }
  };

  // Handle Block Venue for Maintenance
  const handleBlockMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      const res = await venueService.blockVenueMaintenance(currentUser.token, {
        room_id: blockForm.room_id,
        day: blockForm.day,
        start_period: Number(blockForm.start_period),
        end_period: Number(blockForm.end_period),
        reason: blockForm.reason,
      });
      setShowBlockModal(false);
      const affectedNotice =
        res.affected_reservations?.length > 0
          ? ` (Note: ${res.affected_reservations.length} existing booking(s) overlap this window)`
          : '';
      setSuccessMsg(`Venue '${blockForm.room_id}' successfully blocked for maintenance${affectedNotice}.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setBlockForm((prev) => ({ ...prev, reason: '' }));
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to block venue');
    }
  };

  // Handle Unblock Maintenance
  const handleUnblock = async (blockId: string, roomId: string) => {
    try {
      await venueService.unblockVenueMaintenance(currentUser.token, blockId);
      setSuccessMsg(`Maintenance block removed for ${roomId}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove maintenance block');
    }
  };

  // Handle Approve Requisition
  const openApproveModal = (booking: Booking) => {
    const defaultRoom = booking.allocated_room || booking.requested_room || venues[0]?.id || 'AUD';
    const defaultDay = booking.allocated_day || booking.windows?.[0]?.day || 'MON';
    const defaultStart = booking.allocated_start_period || booking.windows?.[0]?.from_period || 1;
    const defaultEnd = booking.allocated_end_period || booking.windows?.[0]?.to_period || 2;

    setApproveForm({
      room_id: defaultRoom,
      day: defaultDay,
      start_period: defaultStart,
      end_period: defaultEnd,
      reason: 'Approved by Department Head / Timetable Chair',
    });
    setShowApproveModal(booking);
  };

  const handleConfirmApprove = async () => {
    if (!showApproveModal) return;
    try {
      setErrorMsg(null);
      await venueService.decideBooking(currentUser.token, showApproveModal.id, {
        status: 'approved',
        room_id: approveForm.room_id,
        day: approveForm.day,
        start_period: Number(approveForm.start_period),
        end_period: Number(approveForm.end_period),
        reason: approveForm.reason,
      });
      setSuccessMsg(`Requisition ${showApproveModal.id} approved and allocated to ${approveForm.room_id}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowApproveModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve requisition');
    }
  };

  // Handle Reject Requisition
  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    try {
      setErrorMsg(null);
      await venueService.decideBooking(currentUser.token, showRejectModal.id, {
        status: 'rejected',
        reason: rejectReason,
      });
      setSuccessMsg(`Requisition ${showRejectModal.id} has been rejected.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowRejectModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject requisition');
    }
  };

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
            Real-time scheduling arbitration, spatial maintenance enforcement, and facility allocation telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />}
            <span>{exporting ? 'Generating...' : 'Export Occupancy Report'}</span>
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className="px-3.5 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 shadow-2xs flex items-center space-x-1.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Block Venue for Maintenance</span>
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Venue</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
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

      {/* 4 Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL CAMPUS VENUES</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{stats.total_venues}</span>
            <span className="text-xs font-medium text-slate-500">Facilities Listed</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {stats.available_venues} Available / {stats.occupied_venues} Occupied / {stats.maintenance_venues} Blocked
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ACTIVE RESERVATIONS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{stats.occupied_venues}</span>
            <span className="text-xs font-medium text-slate-500">Active Slots Today</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-2">
            {stats.active_venues} Venues Commissioned
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VENUE OCCUPANCY RATE</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{stats.occupancy_rate}%</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stats.occupancy_rate > 75 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {stats.occupancy_rate > 75 ? 'Peak Saturation' : 'Optimal Capacity'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${Math.min(100, stats.occupancy_rate)}%` }}></div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING APPROVALS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-red-600">{pendingBookings.length}</span>
            <span className="text-xs font-medium text-slate-500">Require Clearance</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {pendingBookings.length > 0 ? 'Action required in queue below' : 'All requisitions arbitrated'}
          </div>
        </div>
      </div>

      {/* Middle Layout: Approvals Queue (7 Cols) + Venue Directory (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Requisitions & Administrative Approvals Queue</h2>
              <p className="text-[11px] text-slate-500">Review space permits, technical rider specifications, and safety guidelines.</p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              {pendingBookings.length} Unresolved
            </span>
          </div>

          {loading ? (
            <div className="py-8 flex items-center justify-center text-xs text-slate-400 space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading requisitions queue...</span>
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <div className="font-semibold text-slate-700">No Pending Requisitions</div>
              <p className="text-[11px]">All venue booking requests have been reviewed and allocated.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingBookings.map((req) => {
                const isOwn = req.created_by === currentUser.id;
                const reqDay = req.windows?.[0]?.day || 'MON';
                const fromP = req.windows?.[0]?.from_period || 1;
                const toP = req.windows?.[0]?.to_period || 2;

                return (
                  <div key={req.id} className="py-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{req.title}</span>
                        <span className="text-[10px] text-slate-400 ml-2">ID: {req.id} • Requester: {req.requester}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {req.effective_category.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-2">
                      <div>
                        Requested Venue: <strong className="text-slate-800">{req.requested_room || req.room_types?.join(', ') || 'Any Eligible'}</strong>
                      </div>
                      <div>
                        Window: <strong className="text-slate-800">{reqDay} (Periods {fromP}-{toP})</strong>
                      </div>
                      <div>
                        Attendees: <strong className="text-slate-800">{req.attendance} seats</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[10px] text-slate-400">
                        {req.needs?.length ? `Equipment needed: ${req.needs.join(', ')}` : 'Standard room equipment'}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOwn ? (
                          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            Self-Approval Blocked
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => openApproveModal(req)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setShowRejectModal(req)}
                              className="px-3 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold shadow-2xs flex items-center space-x-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Venue Inventory Directory */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Venue Inventory Directory</h2>
              <p className="text-[11px] text-slate-500">Real-Time Status & Physical Telemetry ({venues.length} Facilities)</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {venues.map((venue) => {
              const isMaintenance = venue.current_status === 'maintenance';
              const isOccupied = venue.current_status === 'occupied';

              return (
                <div key={venue.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{venue.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">({venue.id})</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isMaintenance
                          ? 'text-red-700 bg-red-100 border border-red-200'
                          : isOccupied
                          ? 'text-amber-700 bg-amber-100 border border-amber-200'
                          : 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {venue.status_label || (isMaintenance ? 'Under Maintenance' : isOccupied ? 'Occupied' : 'Available Now')}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    {venue.building} • Type: <strong className="uppercase">{venue.type.replace(/_/g, ' ')}</strong>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-700">{venue.capacity} Seats</span>
                      <span>•</span>
                      <span>{venue.features?.slice(0, 3).join(', ') || 'Standard Features'}</span>
                    </div>

                    {isMaintenance && venue.maintenance_block?.id && (
                      <button
                        onClick={() => handleUnblock(venue.maintenance_block!.id!, venue.id)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline"
                      >
                        Clear Block
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: Register New Venue */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Academic Venue</h3>
                <p className="text-xs text-slate-500">Add an institutional venue or laboratory to the central spatial registry.</p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVenue} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Venue Unique ID / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SEM-3 or LAB-AI"
                    value={regForm.id}
                    onChange={(e) => setRegForm({ ...regForm, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    required
                    value={regForm.capacity}
                    onChange={(e) => setRegForm({ ...regForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Seminar Hall C (Dr. Kalam Hall)"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classification Type</label>
                  <select
                    value={regForm.type}
                    onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    <option value="seminar_hall">Smart Seminar Hall</option>
                    <option value="lecture_hall">Tiered Lecture Hall</option>
                    <option value="classroom">Standard Classroom</option>
                    <option value="auditorium">Grand Auditorium</option>
                    <option value="lab_cs">Computer / Systems Lab</option>
                    <option value="lab_elec">Electronics Laboratory</option>
                    <option value="lab_phy">Physics / Science Lab</option>
                    <option value="workshop">Engineering Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Building Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computing Wing, Level 2"
                    value={regForm.building}
                    onChange={(e) => setRegForm({ ...regForm, building: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Available Facilities & Tags</label>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                  {['projector', 'sound_system', 'ac', 'smart_board', 'mic', 'accessible_ramp', 'lan_gigabit'].map((feat) => (
                    <label key={feat} className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regForm.features.includes(feat)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...regForm.features, feat]
                            : regForm.features.filter((f) => f !== feat);
                          setRegForm({ ...regForm, features: updated });
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Register Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Block Venue for Maintenance */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Block Venue for Maintenance</h3>
                <p className="text-xs text-slate-500">Prevent booking collisions and mark venue offline across all user portals.</p>
              </div>
              <button
                onClick={() => setShowBlockModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockMaintenance} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Venue</label>
                <select
                  value={blockForm.room_id}
                  onChange={(e) => setBlockForm({ ...blockForm, room_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-bold"
                  required
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id}) - {v.building}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day of Week</label>
                  <select
                    value={blockForm.day}
                    onChange={(e) => setBlockForm({ ...blockForm, day: e.target.value })}
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1">From Period</label>
                  <select
                    value={blockForm.start_period}
                    onChange={(e) => setBlockForm({ ...blockForm, start_period: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">To Period</label>
                  <select
                    value={blockForm.end_period}
                    onChange={(e) => setBlockForm({ ...blockForm, end_period: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Maintenance Reason & Scope</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Electrical grid upgrade, acoustic panel repairs, or HVAC filter replacement"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Confirm Maintenance Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Approve Requisition */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Approve & Allocate Requisition</h3>
                <p className="text-slate-500">Ref: {showApproveModal.id} • {showApproveModal.title}</p>
              </div>
              <button
                onClick={() => setShowApproveModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Allocated Venue</label>
                <select
                  value={approveForm.room_id}
                  onChange={(e) => setApproveForm({ ...approveForm, room_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-blue-600"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id}) - Cap: {v.capacity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day</label>
                  <select
                    value={approveForm.day}
                    onChange={(e) => setApproveForm({ ...approveForm, day: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-blue-600"
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
                  <label className="font-bold text-slate-700 block mb-1">From Period</label>
                  <select
                    value={approveForm.start_period}
                    onChange={(e) => setApproveForm({ ...approveForm, start_period: Number(e.target.value) })}
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
                    value={approveForm.end_period}
                    onChange={(e) => setApproveForm({ ...approveForm, end_period: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Approval Note / Resolution</label>
                <input
                  type="text"
                  value={approveForm.reason}
                  onChange={(e) => setApproveForm({ ...approveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Approve Requisition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Reject Requisition */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reject Requisition</h3>
                <p className="text-slate-500">Ref: {showRejectModal.id} • {showRejectModal.title}</p>
              </div>
              <button
                onClick={() => setShowRejectModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Rejection</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-red-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Reject Requisition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
