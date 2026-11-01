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
  avatarUrl?: string;
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

export interface VenueItem {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  accessible: boolean;
  features: string[];
  allowed_uses: string[];
  status?: 'available' | 'occupied' | 'maintenance';
  current_status?: 'available' | 'occupied' | 'maintenance';
  status_label?: string;
  maintenance_block?: {
    id?: string;
    room_id?: string;
    day: string;
    periods: number[];
    date?: string;
    start_time?: string;
    end_time?: string;
    reason: string;
    created_by?: string;
    created_at?: string;
  } | null;
  active_booking?: {
    id: string;
    title: string;
    requester: string;
  } | null;
}

export interface WaitlistItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  venue_id: string;
  day: string;
  period: number;
  date?: string;
  purpose?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
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
  description?: string;
  submitted_at: string;
  submitted_by?: string;
  status: 'proposed' | 'approved' | 'rejected' | 'pending' | 'revision_requested';
  type?: 'faculty_unavailability' | 'room_reallocation' | 'emergency_closure' | 'general';
  severity?: 'urgent' | 'warning' | 'normal';
  course_id?: string;
  course_name?: string;
  cohort?: string;
  student_count?: number;
  department?: string;
  instructor_name?: string;
  original_slot?: {
    day: string;
    date?: string;
    start_period?: number;
    end_period?: number;
    time_window?: string;
    room_id: string;
    room_name?: string;
    faculty_id?: string;
    faculty_name?: string;
    reason?: string;
  };
  replacement_slot?: {
    day: string;
    date?: string;
    start_period?: number;
    end_period?: number;
    time_window?: string;
    room_id: string;
    room_name?: string;
    substitute_faculty_id?: string;
    substitute_faculty_name?: string;
    match_rank?: string;
  };
  reason?: string;
  rejection_reason?: string;
  revision_notes?: string;
  decided_by?: string;
  decided_at?: string;
  changes?: any[];
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
