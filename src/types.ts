export type UserRole = 'admin' | 'department_coordinator' | 'faculty' | 'club' | 'student';

export interface UserItem {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  department?: string;
  facultyId?: string;
  studentGroupId?: string;
  clubName?: string;
  email?: string;
  token: string;
  avatar?: string;
}

export interface TimetableSession {
  session_id: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  start_period: number;
  duration: number;
  end_period: number;
  room_id: string;
  room_name?: string;
  room_type?: string;
  course_id: string;
  course_name?: string;
  kind?: string;
  groups: string[];
  faculty_id: string;
  faculty_name?: string;
  size?: number;
  basket_slot?: string | null;
  needs_accessible?: boolean;
}

export interface Booking {
  id: string;
  submitted_at: string;
  requester: string;
  role: string;
  requested_category: string;
  effective_category: string;
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Array<{ day: string; from_period: number; to_period: number }>;
  room_types: string[];
  needs: string[];
  requested_room?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'alternative_offered';
  allocated_room?: string;
  allocated_day?: string;
  allocated_start_period?: number;
  allocated_end_period?: number;
  decision_reason?: string;
  created_by?: string;
}

export interface ExamItem {
  exam_id: string;
  day: string;
  date?: string;
  session: 'AM' | 'PM';
  timing: string;
  course_ids: string[];
  course_name?: string;
  cohort?: string;
  department?: string;
  groups: string[];
  size: number;
  duration_hours: number;
  allocated_rooms?: Array<{
    id: string;
    name: string;
    full_capacity: number;
    exam_capacity: number;
  }>;
  venue_names?: string;
  percent_filled?: string;
  total_allocated_capacity?: number;
  capacity_compliant?: boolean;
  chief_invigilator?: string;
  invigilators?: string[];
  status?: 'upcoming' | 'draft' | 'completed';
}

export interface DisruptionItem {
  id: string;
  title: string;
  description: string;
  submitted_at: string;
  status: 'proposed' | 'approved' | 'rejected';
  severity?: 'urgent' | 'warning' | 'normal';
  changes: any[];
  stability_metrics?: {
    sessions_moved: number;
    time_changed: number;
    room_only_changed: number;
    moved_ids: string[];
  };
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user_name: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  status: string;
  details?: any;
}
