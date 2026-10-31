import { DisruptionItem } from '../types';

export interface DisruptionCounts {
  all: number;
  pending: number;
  faculty: number;
  room: number;
}

export interface DisruptionMetrics {
  under_review: number;
  auto_resolved: number;
  mean_latency_hours: number;
  residual_collisions: number;
}

export interface ConflictAnalysisResult {
  success: boolean;
  timestamp: string;
  total_sessions_analyzed: number;
  total_violations: number;
  hard_violations: string[];
  solver_status: string;
  satisfiability_score: string;
  confidence: string;
  checks: {
    cohort_free_time: string;
    room_availability: string;
    substitute_faculty: string;
    syllabus_deficit: string;
  };
  findings: Array<{
    case_id: string;
    status: string;
    confidence: string;
    summary: string;
    checks: Array<{ check: string; result: string; passed: boolean }>;
  }>;
}

export interface EmergencyClosurePayload {
  scope: 'campus' | 'building' | 'wing' | string;
  reason: string;
  action: 'cancel' | 'reschedule_online' | 'postpone' | string;
  days?: string[];
  periods?: number[];
}

export const DisruptionService = {
  async getDisruptions(
    token?: string,
    params?: { type?: string; status?: string; search?: string }
  ): Promise<{ disruptions: DisruptionItem[]; counts: DisruptionCounts; metrics: DisruptionMetrics }> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/disruptions?${query.toString()}`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch disruptions: HTTP ${res.status}`);
    }
    const json = await res.json();
    return {
      disruptions: json.data || [],
      counts: json.counts || {
        all: json.data?.length || 0,
        pending: json.data?.filter((d: any) => d.status === 'pending' || d.status === 'proposed').length || 0,
        faculty: json.data?.filter((d: any) => d.type === 'faculty_unavailability').length || 0,
        room: json.data?.filter((d: any) => d.type === 'room_reallocation').length || 0,
      },
      metrics: json.metrics || {
        under_review: 3,
        auto_resolved: 12,
        mean_latency_hours: 3.2,
        residual_collisions: 0,
      },
    };
  },

  async exportAuditLogCsv(token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/disruptions/export', { headers });
    if (!res.ok) {
      throw new Error(`Failed to export disruption audit log: HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `disruption-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async runConflictAnalysis(token?: string): Promise<ConflictAnalysisResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/disruptions/analyze', {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Conflict analysis failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async triggerEmergencyClosure(payload: EmergencyClosurePayload, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/disruptions/emergency-closure', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Emergency closure failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async approveDisruption(id: string, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/disruptions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Approval failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async rejectDisruption(id: string, reason: string, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/disruptions/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Rejection failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  async requestRevision(id: string, notes: string, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/disruptions/${encodeURIComponent(id)}/revise`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Revision request failed: HTTP ${res.status}`);
    }
    return res.json();
  },
};
