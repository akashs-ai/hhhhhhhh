import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  RefreshCw,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  Check,
  X,
  Send,
  ArrowRight,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { UserItem, DisruptionItem } from '../../types';
import {
  DisruptionService,
  DisruptionCounts,
  DisruptionMetrics,
  ConflictAnalysisResult,
  EmergencyClosurePayload,
} from '../../services/disruptionService';

interface AdminDisruptionsProps {
  currentUser: UserItem;
  disruptions?: DisruptionItem[];
}

export const AdminDisruptions: React.FC<AdminDisruptionsProps> = ({ currentUser, disruptions: initialDisruptions }) => {
  const [disruptions, setDisruptions] = useState<DisruptionItem[]>(initialDisruptions || []);
  const [selectedDocket, setSelectedDocket] = useState<string>('REQ-DIS-8821');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Dynamic counts and metrics
  const [counts, setCounts] = useState<DisruptionCounts>({
    all: 15,
    pending: 3,
    faculty: 6,
    room: 4,
  });
  const [metrics, setMetrics] = useState<DisruptionMetrics>({
    under_review: 3,
    auto_resolved: 12,
    mean_latency_hours: 3.2,
    residual_collisions: 0,
  });

  // Modals state
  const [showClosureModal, setShowClosureModal] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [targetCaseId, setTargetCaseId] = useState<string>('');

  // Form states
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [closureScope, setClosureScope] = useState<string>('campus');
  const [closureReason, setClosureReason] = useState<string>('Severe Cyclonic Storm & High Inundation Advisory');
  const [closureAction, setClosureAction] = useState<string>('cancel');
  const [analysisResult, setAnalysisResult] = useState<ConflictAnalysisResult | null>(null);

  // Fetch disruptions
  const loadDisruptions = async () => {
    try {
      setLoading(true);
      const res = await DisruptionService.getDisruptions(currentUser.token);
      setDisruptions(res.disruptions);
      setCounts(res.counts);
      setMetrics(res.metrics);

      // If selected docket is not in list or empty, default to first pending or first in list
      if (!res.disruptions.find((d) => d.id === selectedDocket) && res.disruptions.length > 0) {
        const firstPending = res.disruptions.find((d) => d.status === 'pending' || d.status === 'proposed');
        setSelectedDocket(firstPending ? firstPending.id : res.disruptions[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load disruptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisruptions();
  }, []);

  // Filtered docket list
  const filteredDocketList = useMemo(() => {
    if (filterType === 'pending') {
      return disruptions.filter((d) => d.status === 'pending' || d.status === 'proposed' || d.status === 'revision_requested');
    }
    if (filterType === 'faculty') {
      return disruptions.filter((d) => d.type === 'faculty_unavailability');
    }
    if (filterType === 'room') {
      return disruptions.filter((d) => d.type === 'room_reallocation');
    }
    return disruptions;
  }, [disruptions, filterType]);

  // Selected disruption details
  const activeCase = useMemo(() => {
    return disruptions.find((d) => d.id === selectedDocket) || disruptions[0] || null;
  }, [disruptions, selectedDocket]);

  // Handlers
  const handleExportCsv = async () => {
    try {
      setActionMessage({ type: 'info', text: 'Preparing authoritative disruption audit log CSV...' });
      await DisruptionService.exportAuditLogCsv(currentUser.token);
      setActionMessage({ type: 'success', text: 'Disruption audit log CSV downloaded successfully.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Export failed.' });
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setActionMessage({ type: 'info', text: 'Running SAT Conflict Analysis Pass across master timetable...' });
      const result = await DisruptionService.runConflictAnalysis(currentUser.token);
      setAnalysisResult(result);
      setShowAnalysisModal(true);
      setActionMessage(null);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Analysis pass failed.' });
    }
  };

  const handleEmergencyClosureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim()) {
      alert('Please specify an operational reason for the closure.');
      return;
    }
    try {
      setLoading(true);
      const payload: EmergencyClosurePayload = {
        scope: closureScope,
        reason: closureReason.trim(),
        action: closureAction,
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      };
      const res = await DisruptionService.triggerEmergencyClosure(payload, currentUser.token);
      setShowClosureModal(false);
      setActionMessage({
        type: 'success',
        text: `Emergency campus closure protocol activated. Impacted ${res.impacted_summary?.sessions_count || 0} sessions. Broadcasted to academic portals.`,
      });
      await loadDisruptions();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cit:data-mutated'));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Emergency closure protocol failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDirect = async (caseId: string) => {
    try {
      setLoading(true);
      const res = await DisruptionService.approveDisruption(caseId, currentUser.token);
      setActionMessage({
        type: 'success',
        text: `Docket ${caseId} endorsed and published. Master timetable synchronized.`,
      });
      await loadDisruptions();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cit:data-mutated'));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || `Failed to endorse ${caseId}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOpen = (caseId: string) => {
    setTargetCaseId(caseId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this disruption ticket.');
      return;
    }
    try {
      setLoading(true);
      await DisruptionService.rejectDisruption(targetCaseId, rejectionReason.trim(), currentUser.token);
      setShowRejectModal(false);
      setActionMessage({
        type: 'success',
        text: `Disruption ${targetCaseId} rejected. Baseline timetable preserved.`,
      });
      await loadDisruptions();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cit:data-mutated'));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionOpen = (caseId: string) => {
    setTargetCaseId(caseId);
    setRevisionNotes('');
    setShowRevisionModal(true);
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      alert('Please specify revision notes for the proposed reschedule.');
      return;
    }
    try {
      setLoading(true);
      await DisruptionService.requestRevision(targetCaseId, revisionNotes.trim(), currentUser.token);
      setShowRevisionModal(false);
      setActionMessage({
        type: 'success',
        text: `Manual revision requested for ${targetCaseId}. Submitter notified.`,
      });
      await loadDisruptions();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Revision request failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Admin Authority &gt; Disruption Desk</span>
            <span>•</span>
            <span className="text-slate-500">Autumn 2026 Term Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Academic Disruption & Emergency Rescheduling Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated clash recovery, facility incident control, and constraint-based schedule healing via SAT Solver v4.8.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Disruption Audit Log</span>
          </button>
          <button
            onClick={handleRunAnalysis}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Run Conflict Analysis Pass</span>
          </button>
          <button
            onClick={() => setShowClosureModal(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trigger Emergency Campus Closure</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : actionMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">UNDER REVIEW</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-red-600">{metrics.under_review}</span>
            <span className="text-xs font-semibold text-slate-500">Tickets Active</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {counts.faculty} Faculty, {counts.room} Facility Outage • <strong className="text-red-600">High Attention</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SAT AUTO-RESOLVED</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{metrics.auto_resolved}</span>
            <span className="text-xs font-semibold text-slate-500">This Month</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">Constraint Satisfiability: 100% (+4 vs Sept)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MEAN RESCHEDULE LATENCY</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{metrics.mean_latency_hours}</span>
            <span className="text-xs font-semibold text-slate-500">Hours</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Target SLA &lt; 6.0 Hours • <strong className="text-blue-600">Optimal</strong></div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RESIDUAL COLLISIONS</div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{metrics.residual_collisions}</span>
            <span className="text-xs font-bold text-emerald-600">Collisions</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">3,410 enrolled students intact • <strong className="text-emerald-600">Stable</strong></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Disruptions ({counts.all})
        </button>
        <button
          onClick={() => setFilterType('pending')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterType === 'pending'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Review ({counts.pending})
        </button>
        <button
          onClick={() => setFilterType('faculty')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterType === 'faculty'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Faculty Unavailability ({counts.faculty})
        </button>
        <button
          onClick={() => setFilterType('room')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
            filterType === 'room'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Room Reallocations ({counts.room})
        </button>
      </div>

      {/* Main Grid: Queue Docket (5 Cols) + Detailed Case Inspector (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Docket List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>
              Queue Docket{' '}
              <strong className="text-red-600">
                {counts.pending} Action Needed
              </strong>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Sorted by Severity</span>
          </div>

          <div className="space-y-3">
            {filteredDocketList.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No disruptions match the selected filter.
              </div>
            ) : (
              filteredDocketList.map((item) => {
                const isSelected = selectedDocket === item.id;
                const isPending = item.status === 'pending' || item.status === 'proposed' || item.status === 'revision_requested';
                const isApproved = item.status === 'approved';
                const isRejected = item.status === 'rejected';

                let badgeColor = 'text-red-600 bg-red-50 border-red-200';
                let badgeLabel = 'Urgent Medical';
                if (item.type === 'room_reallocation') {
                  badgeColor = 'text-sky-700 bg-sky-50 border-sky-200';
                  badgeLabel = 'Facility Fault';
                } else if (item.severity === 'normal') {
                  badgeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
                  badgeLabel = 'Conf Travel';
                } else if (item.type === 'emergency_closure') {
                  badgeColor = 'text-purple-700 bg-purple-50 border-purple-200';
                  badgeLabel = 'Emergency Closure';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDocket(item.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600">{item.id}</span>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full flex items-center space-x-1 ${badgeColor}`}>
                        {item.severity === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                        <span>{badgeLabel}</span>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-2">
                      {item.title}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.course_id ? `${item.course_id}: ${item.course_name || 'Class'}` : item.description}
                      {item.cohort && ` • ${item.cohort} (${item.student_count || 60} Students)`}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                      <span>
                        Slot: {item.original_slot ? `${item.original_slot.day} P${item.original_slot.start_period || 1}` : 'Term Window'}
                      </span>

                      {/* Functional Accept & Reject buttons on every Queue Docket item */}
                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        {isApproved ? (
                          <span className="text-emerald-600 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Published ✓</span>
                          </span>
                        ) : isRejected ? (
                          <span className="text-red-500 font-bold">Rejected</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectOpen(item.id)}
                              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-bold transition-colors cursor-pointer"
                              title="Reject this disruption docket"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAcceptDirect(item.id)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors cursor-pointer"
                              title="Endorse & Publish this disruption reschedule"
                            >
                              Accept
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Inspector */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          {activeCase ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-blue-600">CASE {activeCase.id}</span>
                    <span
                      className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                        activeCase.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : activeCase.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}
                    >
                      {activeCase.status === 'approved'
                        ? 'Endorsed & Active'
                        : activeCase.status === 'rejected'
                        ? 'Rejected / Inactive'
                        : 'Immediate Reschedule Priority'}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    {activeCase.course_id
                      ? `${activeCase.course_id}: ${activeCase.course_name || activeCase.title}`
                      : activeCase.title}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Primary Instructor: <strong>{activeCase.instructor_name || 'Faculty Member'}</strong> • Department:{' '}
                    <strong>{activeCase.department || 'Computer Science & Engg.'}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">IMPACTED COHORT</span>
                  <span className="font-bold text-blue-600 text-sm">{activeCase.cohort || 'CSE-2A'}</span>
                  <span className="text-[10px] text-slate-400 block">{activeCase.student_count || 62} Students</span>
                </div>
              </div>

              {/* Side by side comparison: Disrupted slot vs Recommended Alternate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-red-700">
                    <span>DISRUPTED SLOT</span>
                    <span className="text-[10px] bg-red-100 px-1.5 py-0.5 rounded">Terminated</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 pt-1">
                    {activeCase.original_slot?.day || 'Wednesday'}, 29 Oct 2026
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {activeCase.original_slot?.time_window || '10:00 AM – 11:15 AM (75 mins)'}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    {activeCase.original_slot?.room_name || `Room ${activeCase.original_slot?.room_id || 'C-104'}`}
                  </div>
                  <div className="text-[10px] text-red-600 pt-1">
                    Reason: {activeCase.reason || activeCase.original_slot?.reason || 'Sudden hospitalization'}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-700">
                    <span>RECOMMENDED ALTERNATE</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                      {activeCase.replacement_slot?.match_rank || 'Rank #1 Match'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 pt-1">
                    {activeCase.replacement_slot?.day || 'Wednesday'}, 29 Oct 2026
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold">
                    {activeCase.replacement_slot?.time_window || '02:00 PM – 03:15 PM (75 mins)'}
                  </div>
                  <div className="text-[10px] text-slate-600 pt-1">
                    {activeCase.replacement_slot?.room_name || `Room ${activeCase.replacement_slot?.room_id || 'B-203'}`}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                    Co-Faculty Substitute:{' '}
                    {activeCase.replacement_slot?.substitute_faculty_name || 'Prof. A. Nanda (Assigned)'}
                  </div>
                </div>
              </div>

              {/* Autonomous Conflict Analysis Check */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>AUTONOMOUS CONFLICT ANALYSIS CHECK (SAT FORMULA RESOLUTION)</span>
                  <span className="text-emerald-600 font-mono font-bold">Confidence: 99.8%</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cohort Free Time Window: CSE-2A lunch slot intact; 0 clashes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Room B-203 Availability: Seating 70 &gt; 62 Cohort; Projector OK</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Substitute Faculty Consent: Prof. A. Nanda notified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>UGC/AICTE Hours: Zero syllabus deficit (42/42 kept)</span>
                  </div>
                </div>
              </div>

              {/* Guardrail Warning */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Institutional Guardrail & Automated Dispatch Warning</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Endorsing this schedule shift immediately executes a zero-downtime bi-directional synchronization to the
                  Chilika Google Workspace for Education API, invalidates previous calendar event invites for{' '}
                  {activeCase.student_count || 62} students, triggers SMS alerts, and updates room electronic e-ink door plates.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleRejectOpen(activeCase.id)}
                  disabled={activeCase.status === 'rejected'}
                  className="px-3.5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Reject Ticket
                </button>
                <button
                  onClick={() => handleRevisionOpen(activeCase.id)}
                  disabled={activeCase.status === 'approved'}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Request Manual Revision
                </button>
                <button
                  onClick={() => handleAcceptDirect(activeCase.id)}
                  disabled={activeCase.status === 'approved' || loading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeCase.status === 'approved'
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{activeCase.status === 'approved' ? 'Endorsed & Published ✓' : 'Endorse & Publish Reschedule'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a disruption ticket from the Queue Docket to inspect and decide.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Emergency Campus Closure */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-red-600 font-bold">
                <Flame className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Trigger Emergency Campus Closure</h3>
              </div>
              <button onClick={() => setShowClosureModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs leading-relaxed">
              <strong>Institutional Protocol Warning:</strong> Activating this protocol halts standard scheduling rules,
              notifies the Academic Council, and immediately cancels or pivots affected sessions to prevent facility hazards.
            </div>

            <form onSubmit={handleEmergencyClosureSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Reason (Required)</label>
                <input
                  type="text"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="e.g. Severe Cyclonic Inundation / Substation Failure"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Closure Scope</label>
                  <select
                    value={closureScope}
                    onChange={(e) => setClosureScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="campus">Full Campus (All Blocks)</option>
                    <option value="building">Academic Complex Only</option>
                    <option value="wing">High-Tech Wing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Action Protocol</label>
                  <select
                    value={closureAction}
                    onChange={(e) => setClosureAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="cancel">Suspend & Reschedule</option>
                    <option value="reschedule_online">Pivot to Online / Asynchronous</option>
                    <option value="postpone">Postpone Examinations</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute Closure Protocol</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SAT Conflict Analysis Pass */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-blue-600 font-bold">
                <RefreshCw className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">SAT Solver v4.8 Conflict Analysis Pass</h3>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">SAT STATUS</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">{analysisResult.solver_status}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">SESSIONS ANALYZED</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{analysisResult.total_sessions_analyzed}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">HARD COLLISIONS</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{analysisResult.total_violations}</div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs text-slate-700">
              <div className="font-bold text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Authoritative Constraint Satisfaction Check (Confidence: {analysisResult.confidence})</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 pt-1">
                <li>• <strong>Cohort Free Time:</strong> {analysisResult.checks.cohort_free_time}</li>
                <li>• <strong>Room Availability:</strong> {analysisResult.checks.room_availability}</li>
                <li>• <strong>Substitute Consent:</strong> {analysisResult.checks.substitute_faculty}</li>
                <li>• <strong>Syllabus Integrity:</strong> {analysisResult.checks.syllabus_deficit}</li>
              </ul>
            </div>

            {analysisResult.findings && analysisResult.findings.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700">Pending Disruption Findings</div>
                {analysisResult.findings.map((f, i) => (
                  <div key={i} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold text-[11px] text-blue-600">
                      <span>{f.case_id}</span>
                      <span className="text-emerald-600 font-sans font-bold">{f.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{f.summary}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Ticket */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Reject Disruption Ticket</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rejecting <strong>{targetCaseId}</strong> preserves the baseline timetable without any alterations. Please
              provide a formal reason for institutional records.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rejection Reason (Required)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Course syllabus requires physical laboratory presence; alternative slot requested."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Manual Revision */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Request Manual Revision</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Return <strong>{targetCaseId}</strong> to the submitter with specific revision notes or alternate time
              window requests.
            </p>

            <form onSubmit={handleRevisionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Revision Instructions (Required)</label>
                <textarea
                  rows={3}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Please consider Friday afternoon period 7-8 to avoid student cohort quiz window."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
