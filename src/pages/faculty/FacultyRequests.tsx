import React, { useState, useEffect } from 'react';
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
  X,
  RefreshCw,
  Trash2,
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

interface FacultyRequestsProps {
  currentUser: UserItem;
}

export const FacultyRequests: React.FC<FacultyRequestsProps> = ({ currentUser }) => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected_or_withdrawn'>('all');
  const [nudged, setNudged] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Request Form State
  const [formTitle, setFormTitle] = useState('Extra Tutorial Session');
  const [formCategory, setFormCategory] = useState('guest_lecture');
  const [formAttendance, setFormAttendance] = useState(45);
  const [formDuration, setFormDuration] = useState(1);
  const [formDay, setFormDay] = useState('WED');
  const [formStartPeriod, setFormStartPeriod] = useState(3);
  const [formRoom, setFormRoom] = useState('L-301');
  const [formReason, setFormReason] = useState('Remedial problem-solving session for mid-semester exam preparation.');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
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
          if (!selectedTicketId && json.data.length > 0) {
            setSelectedTicketId(json.data[0].id);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch faculty bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(fetchBookings, 15000);
    const handleFocus = () => fetchBookings();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const payload = {
        title: formTitle.trim(),
        attendance: Number(formAttendance),
        duration_periods: Number(formDuration),
        requested_category: formCategory,
        requested_room: formRoom,
        raw_text: formReason.trim(),
        windows: [
          {
            day: formDay,
            start_period: Number(formStartPeriod),
            end_period: Number(formStartPeriod) + Number(formDuration) - 1,
          },
        ],
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error?.message || 'Failed to submit requisition');
      }

      setShowNewModal(false);
      setSelectedTicketId(resJson.data?.id);
      window.dispatchEvent(new CustomEvent('cit_schedule_changed'));
      await fetchBookings();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!window.confirm(`Withdraw requisition '${id}'? This will permanently cancel the ticket.`)) return;

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to withdraw');
      }
      window.dispatchEvent(new CustomEvent('cit_schedule_changed'));
      await fetchBookings();
    } catch (err: any) {
      alert('Withdrawal error: ' + err.message);
    }
  };

  const handleNudge = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/nudge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      if (res.ok) {
        setNudged(true);
        setTimeout(() => setNudged(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'approved') return b.status === 'approved';
    if (activeTab === 'rejected_or_withdrawn') {
      return b.status === 'rejected' || b.status === 'withdrawn' || b.status === 'alternative_offered';
    }
    return true;
  });

  const selectedTicket = bookings.find((b) => b.id === selectedTicketId) || filteredBookings[0] || bookings[0] || null;

  const totalActive = bookings.filter((b) => b.status === 'pending').length;
  const totalApproved = bookings.filter((b) => b.status === 'approved').length;
  const totalResolved = bookings.filter((b) => b.status === 'rejected' || b.status === 'withdrawn' || b.status === 'alternative_offered').length;

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
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Submit New Request</span>
          </button>
        </div>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PENDING REQUESTS</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{totalActive}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-2">In review queue • Under Coordinator / Chair</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">APPROVED SESSIONS</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{totalApproved}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Allocated & synced to master timetable</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">WITHDRAWN / REJECTED</div>
          <div className="text-3xl font-black text-slate-700 mt-1">{totalResolved}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-2">Closed or cancelled requests</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL REQUISITIONS</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-black text-slate-900">{bookings.length}</span>
            <span className="text-xs font-bold text-slate-500">tickets</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-2">All submitted personal dockets</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All My Requests ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending ({totalActive})
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
          onClick={() => setActiveTab('rejected_or_withdrawn')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'rejected_or_withdrawn'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Withdrawn / Rejected ({totalResolved})
        </button>
      </div>

      {/* Main Grid: Ticket List (5 Cols) + Detail View (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets */}
        <div className="lg:col-span-5 space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
              No tickets matching current filter. Click '+ Submit New Request' to create one.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isSelected = selectedTicketId === b.id;
              const statusColor =
                b.status === 'approved'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : b.status === 'rejected'
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : b.status === 'withdrawn'
                  ? 'text-slate-600 bg-slate-100 border-slate-200'
                  : b.status === 'alternative_offered'
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedTicketId(b.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {b.status.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">{b.id}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{b.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Requester: {b.requester} • Att: {b.attendance}
                  </div>
                  {b.windows && b.windows[0] && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-[10px] space-y-0.5">
                      <div className="text-blue-700 font-semibold">
                        Slot: {b.windows[0].day} Period {b.windows[0].start_period} ({b.duration_periods} slot)
                      </div>
                      {b.allocated_room && (
                        <div className="text-emerald-700 font-semibold">Allocated Room: {b.allocated_room}</div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-slate-500">{new Date(b.submitted_at).toLocaleDateString()}</span>
                    <span className="font-bold text-blue-600">Inspect →</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detail View (Sticky alongside list) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
          {selectedTicket ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-blue-600">{selectedTicket.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedTicket.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : selectedTicket.status === 'rejected'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : selectedTicket.status === 'withdrawn'
                          ? 'bg-slate-100 border-slate-200 text-slate-600'
                          : selectedTicket.status === 'alternative_offered'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {selectedTicket.status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">{selectedTicket.title}</h2>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Submitted on {new Date(selectedTicket.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Slot Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">REQUESTED SLOT & VENUE</span>
                  <div className="font-bold text-slate-800">
                    {selectedTicket.windows && selectedTicket.windows[0]
                      ? `${selectedTicket.windows[0].day} Period ${selectedTicket.windows[0].start_period}`
                      : 'Flexible'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Preferred Room: {selectedTicket.requested_room || 'Any suitable'}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">{selectedTicket.attendance} Students expected</div>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">ALLOCATION DECISION</span>
                  <div className="font-bold text-slate-800">
                    {selectedTicket.allocated_room
                      ? `${selectedTicket.allocated_room} on ${selectedTicket.allocated_day}`
                      : 'Pending Allocation'}
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold">
                    {selectedTicket.allocated_start_period
                      ? `Periods ${selectedTicket.allocated_start_period} – ${selectedTicket.allocated_end_period}`
                      : selectedTicket.status === 'withdrawn'
                      ? 'Ticket Withdrawn'
                      : 'Under review by Chair'}
                  </div>
                  {selectedTicket.decision_reason && (
                    <div className="text-[10px] text-slate-600 pt-1 italic">"{selectedTicket.decision_reason}"</div>
                  )}
                </div>
              </div>

              {/* Requester Statement */}
              {selectedTicket.raw_text && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    FACULTY RATIONALE & CONTEXT
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">"{selectedTicket.raw_text}"</p>
                </div>
              )}

              {/* Action Footer: Pending requests get Withdraw and Nudge buttons; Decided requests get status banner */}
              {selectedTicket.status === 'pending' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleWithdraw(selectedTicket.id)}
                      className="px-3.5 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 cursor-pointer flex items-center space-x-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Withdraw Request</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNudge(selectedTicket.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{nudged ? 'Chair Nudged ✓' : 'Nudge Coordinator'}</span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100">
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      selectedTicket.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : selectedTicket.status === 'rejected'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : selectedTicket.status === 'withdrawn'
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {selectedTicket.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {selectedTicket.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                      {selectedTicket.status === 'withdrawn' && <Clock className="w-4 h-4 text-slate-500 shrink-0" />}
                      {selectedTicket.status === 'alternative_offered' && <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                      <span className="font-medium">
                        {selectedTicket.status === 'approved' && 'This request has been approved and applied to the master timetable.'}
                        {selectedTicket.status === 'rejected' && 'This request was rejected by administrative authority.'}
                        {selectedTicket.status === 'withdrawn' && 'This request was withdrawn by you and is archived.'}
                        {selectedTicket.status === 'alternative_offered' && 'An alternative room or slot has been proposed by administration.'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      Closed
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a ticket to inspect details and actions.
            </div>
          )}
        </div>
      </div>

      {/* Submit New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Submit Faculty Academic Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Title / Subject</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Extra Lab Session: Computer Networks"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="guest_lecture">Guest Lecture / Seminar</option>
                    <option value="reschedule">Class Reschedule</option>
                    <option value="remedial">Remedial Session</option>
                    <option value="duty_swap">Invigilation Swap</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Attendance</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formAttendance}
                    onChange={(e) => setFormAttendance(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Start Period</label>
                  <select
                    value={formStartPeriod}
                    onChange={(e) => setFormStartPeriod(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <option key={p} value={p}>
                        Period {p} ({p + 7}:00)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="1">1 Hour (1 Period)</option>
                    <option value="2">2 Hours (2 Periods)</option>
                    <option value="3">3 Hours (3 Periods)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Preferred Room</label>
                <select
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
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
                <label className="text-[10px] font-bold text-slate-500 uppercase">Reason / Justification</label>
                <textarea
                  rows={3}
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Provide background, syllabus rationale, or student consensus..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? 'Submitting...' : 'Submit to Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
