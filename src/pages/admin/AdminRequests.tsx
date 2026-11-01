import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { UserItem } from '../../types';

interface BookingRecord {
  id: string;
  submitted_at: string;
  requester: string;
  role: string;
  requested_category: string;
  effective_category: string;
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Array<{ day: string; start_period: number; end_period: number }>;
  room_types: string[];
  needs: string[];
  requested_room?: string | null;
  mandatory_for_groups?: string[];
  raw_text?: string;
  status: 'pending' | 'approved' | 'rejected' | 'alternative_offered' | 'withdrawn';
  created_by: string;
  allocated_room?: string | null;
  allocated_day?: string | null;
  allocated_start_period?: number | null;
  allocated_end_period?: number | null;
  decision_reason?: string | null;
  decided_by?: string;
  decided_at?: string;
}

interface AdminRequestsProps {
  currentUser: UserItem;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({ currentUser }) => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocketId, setSelectedDocketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'withdrawn'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [noteText, setNoteText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Approval allocation form overrides
  const [allocRoom, setAllocRoom] = useState('L-301');
  const [allocDay, setAllocDay] = useState('MON');
  const [allocStartPeriod, setAllocStartPeriod] = useState(2);
  const [allocEndPeriod, setAllocEndPeriod] = useState(2);
  const [decisionReason, setDecisionReason] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBookings(json.data);
          if (!selectedDocketId && json.data.length > 0) {
            setSelectedDocketId(json.data[0].id);
          }
        }
      }
    } catch (err: any) {
      setActionError('Failed to fetch requisitions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    const handleFocus = () => fetchBookings();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  const selectedBooking = bookings.find((b) => b.id === selectedDocketId) || bookings[0] || null;

  // When selected booking changes, populate default allocation form
  useEffect(() => {
    if (selectedBooking) {
      if (selectedBooking.requested_room) setAllocRoom(selectedBooking.requested_room);
      if (selectedBooking.windows && selectedBooking.windows[0]) {
        setAllocDay(selectedBooking.windows[0].day || 'MON');
        setAllocStartPeriod(selectedBooking.windows[0].start_period || 2);
        setAllocEndPeriod(
          selectedBooking.windows[0].end_period ||
            (selectedBooking.windows[0].start_period || 2) + (selectedBooking.duration_periods || 1) - 1
        );
      }
      setDecisionReason('');
      setActionError(null);
      setActionSuccess(null);
    }
  }, [selectedDocketId]);

  // Handle Decision: approve, reject, or alternative_offered
  const handleDecision = async (status: 'approved' | 'rejected' | 'alternative_offered') => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const bodyPayload: any = {
        status,
        reason: decisionReason.trim() || `Decision recorded by ${currentUser.name} (${currentUser.role})`,
      };

      if (status === 'approved' || status === 'alternative_offered') {
        bodyPayload.room_id = allocRoom;
        bodyPayload.day = allocDay;
        bodyPayload.start_period = Number(allocStartPeriod);
        bodyPayload.end_period = Number(allocEndPeriod);
      }

      const res = await fetch(`/api/bookings/${encodeURIComponent(selectedBooking.id)}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error?.message || `Failed to record ${status} decision.`);
      }

      setActionSuccess(`Requisition ${selectedBooking.id} successfully marked as ${status.toUpperCase()}!`);
      window.dispatchEvent(new CustomEvent('cit_schedule_changed'));
      window.dispatchEvent(new CustomEvent('cit:data-mutated'));
      await fetchBookings();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter bookings list
  const filteredBookings = bookings.filter((b) => {
    if (activeTab !== 'all' && b.status !== activeTab) return false;
    if (roleFilter !== 'All' && b.role !== roleFilter.toLowerCase()) return false;
    return true;
  });

  const totalPending = bookings.filter((b) => b.status === 'pending').length;
  const totalApproved = bookings.filter((b) => b.status === 'approved').length;
  const totalRejected = bookings.filter((b) => b.status === 'rejected' || b.status === 'alternative_offered').length;
  const totalWithdrawn = bookings.filter((b) => b.status === 'withdrawn').length;

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
            Chilika Institute of Technology Central Registry • Real-time venue reservations, schedule changes & approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Requisitions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">TOTAL REQUESTS</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{bookings.length}</div>
          <div className="text-[11px] text-slate-500 mt-2">Active records in master registry</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">PENDING APPROVAL</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{totalPending}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-2">Actionable review queue</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">APPROVED SESSIONS</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{totalApproved}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-2">Applied to timetable & calendar</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">REJECTED / OTHER</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{totalRejected}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-2">Closed or alternative offered</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">WITHDRAWN BY USER</div>
          <div className="text-3xl font-black text-slate-600 mt-1">{totalWithdrawn}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-2">Cancelled by requester</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending ({totalPending})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Approved ({totalApproved})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Rejected ({totalRejected})
          </button>
          <button
            onClick={() => setActiveTab('withdrawn')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'withdrawn'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Withdrawn ({totalWithdrawn})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer font-medium"
          >
            <option value="All">All Requesters</option>
            <option value="faculty">Faculty</option>
            <option value="club">Student Clubs</option>
            <option value="department_coordinator">Coordinators</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Dockets Feed (5 Cols) + Docket Review Drawer (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dockets */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Showing {filteredBookings.length} Requisitions</span>
            <span className="text-blue-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Live Master Queue</span>
            </span>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              No requisitions matching current filters.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isSelected = selectedDocketId === b.id;
              const statusColor =
                b.status === 'approved'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : b.status === 'rejected'
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : b.status === 'alternative_offered'
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : b.status === 'withdrawn'
                  ? 'text-slate-600 bg-slate-100 border-slate-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedDocketId(b.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">{b.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">
                    {b.requester} <span className="font-normal text-slate-500">• {b.role}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1 line-clamp-1">
                    <strong>{b.title}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                    <span>
                      {b.windows && b.windows[0] ? `${b.windows[0].day} Period ${b.windows[0].start_period}` : 'Flexible'}
                    </span>
                    <span className="font-semibold text-slate-600">
                      Att: {b.attendance} • {b.duration_periods} Period(s)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Docket Review Drawer (Sticky & Responsive) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
          {selectedBooking ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-blue-600">{selectedBooking.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedBooking.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : selectedBooking.status === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : selectedBooking.status === 'alternative_offered'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : selectedBooking.status === 'withdrawn'
                          ? 'bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {selectedBooking.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Category: {selectedBooking.effective_category}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">{selectedBooking.title}</h2>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Submitted: {new Date(selectedBooking.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Requester Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{selectedBooking.requester}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Role: <strong className="uppercase">{selectedBooking.role}</strong> • User ID: {selectedBooking.created_by}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">EXPECTED ATTENDANCE</span>
                  <span className="font-bold text-slate-800">{selectedBooking.attendance} Attendees</span>
                  <div className="text-[10px] text-slate-500">Duration: {selectedBooking.duration_periods} slot(s)</div>
                </div>
              </div>

              {/* Rationale / Text */}
              {selectedBooking.raw_text && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    REQUEST DETAILS & RATIONALE
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    "{selectedBooking.raw_text}"
                  </p>
                </div>
              )}

              {/* Finalized Decision Record — Shown when request is NOT pending */}
              {selectedBooking.status !== 'pending' ? (
                <div
                  className={`p-4 rounded-xl border space-y-3 text-xs ${
                    selectedBooking.status === 'approved'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : selectedBooking.status === 'rejected'
                      ? 'bg-red-50/60 border-red-200'
                      : selectedBooking.status === 'withdrawn'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-blue-50/60 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="font-bold flex items-center space-x-1.5">
                      {selectedBooking.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {selectedBooking.status === 'rejected' && <X className="w-4 h-4 text-red-600" />}
                      {selectedBooking.status === 'withdrawn' && <Clock className="w-4 h-4 text-slate-500" />}
                      {selectedBooking.status === 'alternative_offered' && <Share2 className="w-4 h-4 text-blue-600" />}
                      <span
                        className={
                          selectedBooking.status === 'approved'
                            ? 'text-emerald-900 font-black uppercase tracking-wide'
                            : selectedBooking.status === 'rejected'
                            ? 'text-red-900 font-black uppercase tracking-wide'
                            : selectedBooking.status === 'withdrawn'
                            ? 'text-slate-800 font-black uppercase tracking-wide'
                            : 'text-blue-900 font-black uppercase tracking-wide'
                        }
                      >
                        {selectedBooking.status === 'approved' && 'Requisition Approved & Space Allocated'}
                        {selectedBooking.status === 'rejected' && 'Requisition Rejected'}
                        {selectedBooking.status === 'withdrawn' && 'Requisition Withdrawn by Requester'}
                        {selectedBooking.status === 'alternative_offered' && 'Alternative Slot Offered'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                      FINALIZED
                    </span>
                  </div>

                  {selectedBooking.allocated_room && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ALLOCATED VENUE & TIME</div>
                      <div className="font-bold text-slate-900 text-sm">
                        {selectedBooking.allocated_room} on {selectedBooking.allocated_day}
                      </div>
                      <div className="text-slate-600 font-medium">
                        Periods {selectedBooking.allocated_start_period} – {selectedBooking.allocated_end_period} ({Number(selectedBooking.allocated_start_period) + 7}:00 – {Number(selectedBooking.allocated_end_period) + 8}:00)
                      </div>
                    </div>
                  )}

                  {selectedBooking.decision_reason && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DECISION RATIONALE / CONDITIONS</div>
                      <div className="text-slate-700 italic">"{selectedBooking.decision_reason}"</div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                    <div>
                      {selectedBooking.decided_by && (
                        <span>Decided by: <strong>{selectedBooking.decided_by}</strong></span>
                      )}
                      {selectedBooking.decided_at && (
                        <span> • {new Date(selectedBooking.decided_at).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="text-slate-400 italic">
                      Decision locked • No further action required
                    </div>
                  </div>
                </div>
              ) : (
                /* Action Decision Form (Shown ONLY when status is 'pending') */
                <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-3 text-xs">
                  <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Administrative Allocation & Review Action</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Room</label>
                      <select
                        value={allocRoom}
                        onChange={(e) => setAllocRoom(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
                      >
                        <option value="L-301">L-301 (Aud. B)</option>
                        <option value="L-302">L-302 Lecture Hall</option>
                        <option value="L-204">L-204 Seminar Room</option>
                        <option value="Turing-Lab-02">Turing Lab 02</option>
                        <option value="VLSI-Lab-3">VLSI Micro Lab 3</option>
                        <option value="Networks-Lab-A">Networks Lab A</option>
                        <option value="Bose-Hall">Bose Hall</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Day</label>
                      <select
                        value={allocDay}
                        onChange={(e) => setAllocDay(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
                      >
                        <option value="MON">MON</option>
                        <option value="TUE">TUE</option>
                        <option value="WED">WED</option>
                        <option value="THU">THU</option>
                        <option value="FRI">FRI</option>
                        <option value="SAT">SAT</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Start Period</label>
                      <select
                        value={allocStartPeriod}
                        onChange={(e) => {
                          const sp = Number(e.target.value);
                          setAllocStartPeriod(sp);
                          if (allocEndPeriod < sp) setAllocEndPeriod(sp);
                        }}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                          <option key={p} value={p}>
                            Period {p} ({p + 7}:00)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">End Period</label>
                      <select
                        value={allocEndPeriod}
                        onChange={(e) => setAllocEndPeriod(Number(e.target.value))}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                          .filter((p) => p >= allocStartPeriod)
                          .map((p) => (
                            <option key={p} value={p}>
                              Period {p} ({p + 8}:00)
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Decision Reason / Stipulation</label>
                    <input
                      type="text"
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Enter approval conditions, room remarks, or rejection grounds..."
                      className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-xs"
                    />
                  </div>

                  {/* Self-Approval Warning */}
                  {selectedBooking.created_by === currentUser.id && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Governance Rule: You created this request ({selectedBooking.created_by}). Self-approval is prevented by
                        institutional policy. Another administrator or coordinator must review.
                      </span>
                    </div>
                  )}

                  {/* Action Buttons — ONLY for pending requests */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-blue-200/50">
                    <button
                      type="button"
                      onClick={() => handleDecision('rejected')}
                      disabled={actionLoading || selectedBooking.created_by === currentUser.id}
                      className="px-3.5 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Reject Requisition
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision('alternative_offered')}
                      disabled={actionLoading || selectedBooking.created_by === currentUser.id}
                      className="px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Offer Alternative
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision('approved')}
                      disabled={actionLoading || selectedBooking.created_by === currentUser.id}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{actionLoading ? 'Recording...' : 'Approve & Allocate'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a requisition from the left to view details and record decisions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
