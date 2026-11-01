export interface AssistantFaq {
  id: string;
  question_key: string;
  category: 'General' | 'Student' | 'Faculty' | 'Scheduling' | 'Administration' | 'Accounts & Support';
  question: string;
  answer: string;
  audience: 'all' | 'student' | 'faculty' | 'department_coordinator' | 'admin';
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_FAQS: AssistantFaq[] = [
  // --------------------------------------------------------------------------
  // 1. GENERAL PLATFORM FAQS
  // --------------------------------------------------------------------------
  {
    id: 'faq-gen-01',
    question_key: 'what_is_citschedule',
    category: 'General',
    question: 'What is CITSchedule?',
    answer: 'CITSchedule is the autonomous academic scheduling and operations platform for Chilika Institute of Technology (CIT). It orchestrates timetable optimization, room allocation, examination rosters, conflict prevention, and dynamic venue reservations across all academic departments.',
    audience: 'all',
    is_active: true,
    display_order: 1,
  },
  {
    id: 'faq-gen-02',
    question_key: 'citschedule_capabilities',
    category: 'General',
    question: 'What can I do with CITSchedule?',
    answer: 'With CITSchedule, students can access personalized class timetables and midterm examination schedules with half-capacity desk allocations. Faculty members can view teaching schedules and invigilation duties, submit booking requests, and report disruptions. Department coordinators and administrators can oversee conflict audits, validate timetables using SAT constraint engines, and publish institutional rosters.',
    audience: 'all',
    is_active: true,
    display_order: 2,
  },
  {
    id: 'faq-gen-03',
    question_key: 'dashboard_navigation',
    category: 'General',
    question: 'How do I navigate the dashboard?',
    answer: 'Use the top navigation bar or left sidebar to access your role-specific modules: Timetable (teaching and class slots), Exam Scheduler (assigned desks and papers), Venue Management (booking and availability), and Reports. Role-specific quick metrics and schedule digests are displayed on your main dashboard.',
    audience: 'all',
    is_active: true,
    display_order: 3,
  },

  // --------------------------------------------------------------------------
  // 2. STUDENT FAQS & LIVE DATA QUESTIONS
  // --------------------------------------------------------------------------
  {
    id: 'faq-stu-01',
    question_key: 'view_class_timetable',
    category: 'Student',
    question: 'How can I view my class timetable?',
    answer: 'Navigate to the Timetable tab in the navigation bar to inspect your weekly lectures, labs, room allocations, and faculty contacts.',
    audience: 'student',
    is_active: true,
    display_order: 10,
  },
  {
    id: 'faq-stu-02',
    question_key: 'check_exam_schedule',
    category: 'Student',
    question: 'How can I check my examination schedule?',
    answer: 'Open the Student Exam Scheduler module to view your midterm examination dates, timing shifts, assigned halls, and seating capacities.',
    audience: 'student',
    is_active: true,
    display_order: 11,
  },
  {
    id: 'faq-stu-03',
    question_key: 'department_timetable',
    category: 'Student',
    question: "How can I find my department's timetable?",
    answer: "Select your department from the filter dropdown in the Timetable view to see all scheduled sessions for your engineering cohort.",
    audience: 'student',
    is_active: true,
    display_order: 12,
  },
  {
    id: 'faq-stu-04',
    question_key: 'report_scheduling_conflict',
    category: 'Student',
    question: 'What should I do if I notice a scheduling conflict?',
    answer: 'If you detect an overlap between two lectures or an examination collision, immediately inform your Department Academic Coordinator or contact the Dean of Academics office. Administrators can trigger a formal SAT constraint audit to resolve the conflict.',
    audience: 'student',
    is_active: true,
    display_order: 13,
  },

  // --------------------------------------------------------------------------
  // 3. FACULTY FAQS & LIVE DATA QUESTIONS
  // --------------------------------------------------------------------------
  {
    id: 'faq-fac-01',
    question_key: 'faculty_view_schedule',
    category: 'Faculty',
    question: 'How can faculty members view their schedules?',
    answer: 'Faculty members can log in to view their weekly teaching periods, assigned lecture halls, and designated examination invigilation responsibilities.',
    audience: 'faculty',
    is_active: true,
    display_order: 20,
  },
  {
    id: 'faq-fac-02',
    question_key: 'report_timetable_problem',
    category: 'Faculty',
    question: 'How can I report a timetable problem?',
    answer: 'Faculty members can report scheduling disruptions (such as faculty leave, emergency venue maintenance, or equipment failure) using the Disruptions tab. The system will calculate affected sessions and propose a minimally disruptive schedule diff.',
    audience: 'faculty',
    is_active: true,
    display_order: 21,
  },

  // --------------------------------------------------------------------------
  // 4. SCHEDULING & VENUE FAQS
  // --------------------------------------------------------------------------
  {
    id: 'faq-sch-01',
    question_key: 'conflict_detection_work',
    category: 'Scheduling',
    question: 'How does timetable conflict detection work?',
    answer: 'CITSchedule employs constraint satisfaction algorithms (including Boolean SAT solvers) to enforce zero room double-booking, zero cohort overlaps, mandatory teaching breaks, and strict half-capacity spacing in exam halls.',
    audience: 'all',
    is_active: true,
    display_order: 30,
  },
  {
    id: 'faq-sch-02',
    question_key: 'resolve_scheduling_conflicts',
    category: 'Scheduling',
    question: 'How can scheduling conflicts be resolved?',
    answer: 'Conflicts are identified by running a Global Conflict Audit in the Exam Scheduler or Schedule Validation module. Department coordinators can adjust allocations or trigger automated re-solving.',
    audience: 'all',
    is_active: true,
    display_order: 31,
  },
  {
    id: 'faq-sch-03',
    question_key: 'classrooms_venues_managed',
    category: 'Scheduling',
    question: 'How are classrooms and venues managed?',
    answer: 'Classrooms, computer laboratories, and seminar halls are indexed with seating capacities, accessible equipment, and room types. Users can check venue saturation and reserve spaces through Venue Management.',
    audience: 'all',
    is_active: true,
    display_order: 32,
  },

  // --------------------------------------------------------------------------
  // 5. ADMINISTRATION FAQS
  // --------------------------------------------------------------------------
  {
    id: 'faq-adm-01',
    question_key: 'admin_manage_schedules',
    category: 'Administration',
    question: 'How can administrators manage timetable schedules?',
    answer: 'Administrators and Department Coordinators can create proposed schedule versions, execute python-based solver optimizations, review constraint violation reports, and promote compliant proposals to the official approved master timetable.',
    audience: 'admin',
    is_active: true,
    display_order: 40,
  },
  {
    id: 'faq-adm-02',
    question_key: 'authorized_reports',
    category: 'Administration',
    question: 'How can authorized users generate reports?',
    answer: 'Authorized administrators can access the Reports section to view faculty workload distributions, venue utilization matrices, cohort weekly hours, and examination seating allocations.',
    audience: 'admin',
    is_active: true,
    display_order: 41,
  },
  {
    id: 'faq-adm-03',
    question_key: 'manage_disruptions',
    category: 'Administration',
    question: 'How can scheduling disruptions be managed?',
    answer: 'When a disruption is submitted, coordinators review the affected cohort, calculate the stability score of candidate adjustments, and approve proposed diffs without invalidating unaffected sessions.',
    audience: 'admin',
    is_active: true,
    display_order: 42,
  },

  // --------------------------------------------------------------------------
  // 6. ACCOUNTS & SUPPORT FAQS
  // --------------------------------------------------------------------------
  {
    id: 'faq-acc-01',
    question_key: 'access_account',
    category: 'Accounts & Support',
    question: 'How do I access my account?',
    answer: 'Students sign in securely using Google Sign-In with their institutional or personal Google account. Professors and Administrators log in using their institutional email and password credentials on their designated portal tabs.',
    audience: 'all',
    is_active: true,
    display_order: 50,
  },
  {
    id: 'faq-acc-02',
    question_key: 'auth_error_troubleshooting',
    category: 'Accounts & Support',
    question: 'What should I do if I encounter an authentication error?',
    answer: 'If you encounter an INVALID_CREDENTIALS or session expiration error, click "Sign In Again" or clear your browser cache. Ensure you are accessing the correct role portal (Student vs Professor vs HOD/Admin) and using your verified credentials.',
    audience: 'all',
    is_active: true,
    display_order: 51,
  },
  {
    id: 'faq-acc-03',
    question_key: 'assistant_availability',
    category: 'Accounts & Support',
    question: 'Why might some assistant questions be unavailable?',
    answer: 'The CIT Assistant operates in verified Database Mode to provide accurate, authoritative answers directly from the institution\'s PostgreSQL database. Custom AI-generated questions are currently in Beta Mode while LLM integrations undergo institutional compliance verification.',
    audience: 'all',
    is_active: true,
    display_order: 52,
  },
];
