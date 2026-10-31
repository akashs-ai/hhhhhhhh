import { ExamItem } from '../types';

export interface ExamCounts {
  total: number;
  upcoming: number;
  drafts: number;
  completed: number;
}

export interface ExamAuditConflict {
  rule: string;
  severity: 'CRITICAL' | 'WARNING';
  type: string;
  description: string;
  day: string;
  session: string;
  location?: string;
  affected_exams: string[];
  suggested_resolution: string;
}

export interface ExamAuditResult {
  total_exams_audited: number;
  critical_conflicts: number;
  warnings: number;
  status: 'PASS' | 'FAIL';
  audit_timestamp: string;
  auditor_role: string;
  auditor_name: string;
  engine_hash: string;
}

export interface ExamResponse {
  success: boolean;
  roster_status: 'published' | 'draft';
  published_at: string | null;
  published_by: string | null;
  counts: ExamCounts;
  total_count: number;
  data: ExamItem[];
}

export const examService = {
  async getExams(
    token?: string,
    filters?: { status?: string; department?: string; search?: string }
  ): Promise<ExamResponse> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.department && filters.department !== 'ALL') {
      params.append('department', filters.department);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const res = await fetch(`/api/exams?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('cit_auth_token') || ''}`,
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to retrieve examinations');
    }

    return json;
  },

  async runConflictAudit(token?: string): Promise<{
    summary: ExamAuditResult;
    conflicts: ExamAuditConflict[];
  }> {
    const res = await fetch('/api/exams/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('cit_auth_token') || ''}`,
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Conflict audit execution failed.');
    }

    return {
      summary: json.summary,
      conflicts: json.conflicts || [],
    };
  },

  async publishRoster(token?: string): Promise<{
    message: string;
    published_at: string;
    published_by: string;
  }> {
    const res = await fetch('/api/exams/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('cit_auth_token') || ''}`,
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Roster publication was rejected by validation engine.');
    }

    return json;
  },

  async scheduleExam(
    examData: {
      course_id: string;
      title?: string;
      groups: string[];
      day: string;
      session: 'AM' | 'PM';
      rooms: string[];
      size: number;
      duration_hours?: number;
      chief_invigilator?: string;
      is_draft?: boolean;
    },
    token?: string
  ): Promise<ExamItem> {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || localStorage.getItem('cit_auth_token') || ''}`,
      },
      body: JSON.stringify(examData),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to schedule examination.');
    }

    return json.data;
  },
};
