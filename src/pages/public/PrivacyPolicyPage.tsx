import React from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Calendar,
  Cpu,
  FileText,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
  Key,
  Trash2,
  UserCheck,
  Building,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBackToHome: () => void;
  onSignIn: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBackToHome,
  onSignIn,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Glassmorphic Navigation Bar */}
      <header className="bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 border-b border-white/50 shadow-[0_4px_24px_0_rgba(0,0,0,0.04)] sticky top-0 z-40 px-6 lg:px-16 py-3 flex items-center justify-between transition-all">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToHome}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
              CITSchedule
            </span>
            <span className="text-[11px] font-medium text-slate-500 tracking-tight mt-1 leading-none">
              Chilika Institute of Technology
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 sm:px-8 py-10 sm:py-14 space-y-12">
        {/* Header Hero Banner */}
        <section className="space-y-4 border-b border-slate-200/80 pb-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/70 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Institutional Compliance & Data Governance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            This Privacy Policy describes the policies and practices of Chilika Institute of Technology (“CIT”) regarding the collection, storage, processing, and protection of information across the <strong>CITSchedule Academic Scheduling Platform</strong>. We are committed to safeguarding institutional and personal academic records with strict technical and administrative safeguards.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Effective Date:</span>
            <span>November 1, 2026</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Platform:</span>
            <span>CITSchedule v4.8</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">Database Engine:</span>
            <span>Neon Serverless PostgreSQL</span>
          </div>
        </section>

        {/* Quick Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Zero Commercial Tracking</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We do not use advertising trackers, marketing cookies, or behavioral telemetry. Your academic activity is never sold or monetized.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Neon PostgreSQL Security</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Institutional records are hosted on Neon Serverless PostgreSQL with SSL/TLS transport encryption and encryption at rest.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Separated Google Scopes</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Sign-In is strictly for authentication. Google Calendar sync is a completely optional feature with independent, user-revocable permissions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Role-Isolated AI Processing</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemini queries are strictly filtered to your authorized role and are never retained to train third-party AI models.
            </p>
          </div>
        </section>

        {/* Section 1: Introduction and Scope */}
        <section id="introduction" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            1. Introduction and Scope
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              CITSchedule is the official academic operational scheduling, examination orchestration, and venue management system of <strong>Chilika Institute of Technology (CIT)</strong>. This system is designed to schedule semester courses, invigilation duties, lab sessions, and institutional venues while eliminating scheduling conflicts.
            </p>
            <p>
              This policy governs all users accessing CITSchedule, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Students:</strong> Accessing personal timetables, mid-term seating plans, venue requisitions, and disruption announcements.</li>
              <li><strong>Faculty Members:</strong> Viewing allocated lecture hours, requesting leave substitutes, and managing classroom schedules.</li>
              <li><strong>Departmental Coordinators & HODs:</strong> Structuring departmental curricula, workload allotments, and laboratory allocations.</li>
              <li><strong>Club Leads & Student Bodies:</strong> Reserving smart seminar halls, auditoriums, and symposium spaces.</li>
              <li><strong>System Administrators & Deans:</strong> Overseeing platform security, database integrity, and governance compliance.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Information Collected */}
        <section id="information-collected" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            2. Information We Collect
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We collect and process only the minimum information necessary to authenticate users, prevent scheduling collisions, and manage academic resources:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>A. Identity & Authentication Profile Data</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When you sign in, we record your full display name (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">display_name</code>), institutional email or Google account email (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">email</code>), account role, and profile picture avatar URL (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">avatar_url</code>). For Google-authenticated users, we securely store your stable Google subject identifier (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">google_id</code>) to match your authorized records on subsequent logins.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>B. Academic & Institutional Metadata</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Academic association details including assigned department (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">department_code</code>), student cohort group (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">student_group_id</code>, e.g., CSE-2A, CSE-3), student roll number, faculty instructor code (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">faculty_id</code>), enrolled courses, and club organization names.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>C. Scheduling, Venue & Disruption Records</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Classroom session timings, lecture day/period assignments, venue booking reservations (room, start time, end time, purpose, and endorsement status), examination rosters, and schedule disruption notices (substitute faculty assignments and rescheduled slots).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>D. Technical Session & Audit Logs</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cryptographic authorization bearer tokens stored locally in your browser’s <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>, timestamps of logins, and immutable system audit logs (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">audit_logs</code> table) recording significant administrative actions such as schedule approvals and venue locks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How Information is Used */}
        <section id="how-information-is-used" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            3. How We Use Your Information
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Your data is processed strictly for educational and institutional operational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>Authentication and Access Control:</strong> Verifying user identity, restoring active sessions, and ensuring strict role-based access control (RBAC) across student, faculty, and administrative views.</li>
              <li><strong>Autonomous Timetable Generation:</strong> Inputting class batches, room capacities, and faculty preferences into the Constraint Satisfaction Problem (CSP) solver engine to construct clash-free timetables.</li>
              <li><strong>Venue Scheduling & Conflict Prevention:</strong> Managing reservations for auditoriums and laboratories, preventing double-bookings.</li>
              <li><strong>Disruption Management:</strong> Notifying students and instructors of sudden schedule adjustments, classroom relocations, or holiday compensatory slots.</li>
              <li><strong>Optional Google Calendar Sync:</strong> Synchronizing approved academic events to your personal Google Calendar upon your explicit request.</li>
              <li><strong>AI Academic Assistance:</strong> Answering schedule-related inquiries via the integrated Google Gemini assistant using role-scoped context.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Database Storage using Neon PostgreSQL */}
        <section id="database-storage" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 4</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            4. Database Storage Using Neon PostgreSQL
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              All persistent application data is stored in a dedicated <strong>Neon Serverless PostgreSQL</strong> relational database:
            </p>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Architecture & Storage Guarantees:</span>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 leading-relaxed">
                <li><strong>Encryption in Transit:</strong> All connections between our backend API server and Neon PostgreSQL require TLS/SSL encryption enforced via <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">sslmode=require</code>. Unencrypted plain-text database connections are strictly rejected.</li>
                <li><strong>Encryption at Rest:</strong> Neon infrastructure enforces AES-256 block-level encryption for all underlying stored database volumes, tablespaces, and backups.</li>
                <li><strong>Relational Isolation:</strong> Structured relational tables (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">users</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">authorized_students</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">timetable_sessions</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">bookings</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">exams</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">disruptions</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">audit_logs</code>) maintain referential integrity.</li>
                <li><strong>Server-Side Secret Isolation:</strong> Database connection strings (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">DATABASE_URL</code>) reside exclusively in secure server-side environment variables and are never bundled into client JavaScript.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5: Google Sign-In and Google Calendar Integration */}
        <section id="google-integrations" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 5</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            5. Google Sign-In and Google Calendar Integration
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              CITSchedule integrates with Google services for two distinct purposes. It is vital to understand the strict boundary between authentication and calendar access:
            </p>

            {/* Distinction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box A: Google Sign-In */}
              <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-700">A. Google Sign-In (Authentication)</h3>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    <strong>Purpose:</strong> Authenticate student and faculty identity without storing passwords.
                  </p>
                  <p>
                    <strong>OAuth Scopes:</strong> Minimal standard identity scopes only (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">openid</code>, <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">email</code>, <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">profile</code>).
                  </p>
                  <p>
                    <strong>Verification:</strong> Google ID tokens (JWT) or OAuth access tokens are validated server-side against Google's tokeninfo endpoint. We never trust unverified browser parameters.
                  </p>
                  <p className="text-slate-700 font-semibold">
                    Important: Google Sign-In DOES NOT request, grant, or require access to your Google Calendar.
                  </p>
                </div>
              </div>

              {/* Box B: Google Calendar Integration */}
              <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-700">B. Google Calendar Sync (Optional Feature)</h3>
                </div>
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    <strong>Purpose:</strong> Optional two-way synchronization of approved timetables and personal conflict detection.
                  </p>
                  <p>
                    <strong>Explicit Consent:</strong> Only activated when a user manually clicks "Connect Google Calendar" inside the platform.
                  </p>
                  <p>
                    <strong>OAuth Scopes:</strong> Requires separate explicit authorization for <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">https://www.googleapis.com/auth/calendar</code>.
                  </p>
                  <p>
                    <strong>Disconnection:</strong> You can disconnect your Google Calendar at any time with one click (<code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">POST /api/calendar/disconnect</code>), which permanently purges your stored synchronization tokens.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              CITSchedule adheres to the Google API Services User Data Policy, including the Limited Use requirements. Information obtained through Google APIs is never utilized to serve advertisements or transferred to third-party brokers.
            </p>
          </div>
        </section>

        {/* Section 6: AI Features and Third-Party Services */}
        <section id="ai-features" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 6</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            6. AI Features and Third-Party Services
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              CITSchedule integrates specific third-party services necessary for advanced scheduling and artificial intelligence:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Google Gemini API (@google/genai)</span>
                  </h3>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-mono px-2 py-0.5 rounded font-semibold">gemini-2.5-flash</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our interactive AI assistant provides natural-language timetable querying and rescheduling suggestions. The assistant operates under a <strong>strict role-scoped context builder</strong>: students only have their specific cohort’s schedule injected into prompts; faculty only see their teaching hours. Prompts are transmitted via server-side encrypted calls to Google Gemini. Queries are processed ephemerally and are not used to train underlying models.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Decoupled Python Constraint Solver (CSP)</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Timetable optimization calculations are executed by an autonomous constraint satisfaction solver (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">solver_service.py</code>). This solver processes abstract relational matrices (room capacity constraints, lecture hours, day periods) and contains no personal contact information or private student credentials.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>Cloud Hosting & Serverless Infrastructure (Vercel)</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Application frontends and serverless API endpoints are deployed on <strong>Vercel</strong> edge infrastructure. Vercel processes inbound web requests and enforces HTTPS transport security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Data Sharing and Security */}
        <section id="data-sharing" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 7</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            7. Data Sharing and Security Practices
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We maintain a rigorous zero-trust security architecture across the platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>No Commercial Sale of Data:</strong> We never sell, monetize, or trade student, faculty, or institutional data to advertising networks, commercial data brokers, or marketing entities.</li>
              <li><strong>Server-Side Authorization:</strong> Every backend endpoint enforces role-based checks. Even if frontend code is manipulated, server-side route guards reject unauthorized actions.</li>
              <li><strong>Encrypted Communications:</strong> Enforced HTTPS/TLS 1.3 across all client-to-server and server-to-database requests.</li>
              <li><strong>Secure Environment Secret Management:</strong> All private secrets (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">DATABASE_URL</code>, <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">GOOGLE_CLIENT_SECRET</code>) are stored in encrypted environment configurations and are never accessible to client browsers.</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Data Retention and Deletion */}
        <section id="data-retention" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 8</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            8. Data Retention and Account/Data Deletion Requests
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We retain personal data only for as long as necessary to fulfill academic operational mandates:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong>Active Academic Year:</strong> Student cohort rosters and faculty teaching allotments are retained throughout the active academic semester and for statutory audit periods.</li>
              <li><strong>Account Deletion:</strong> Students and staff who graduate or leave the institution may request account deactivation, removal of Google profile linkages, or deletion of personal booking records.</li>
              <li><strong>How to Submit a Deletion Request:</strong> Send an official request from your registered email address to the Office of the Dean of Academics at <a href="mailto:dean.academics@cit.ac.in" className="text-blue-600 underline font-medium">dean.academics@cit.ac.in</a> or the designated privacy desk at <a href="mailto:privacy@cit.ac.in" className="text-blue-600 underline font-medium">privacy@cit.ac.in</a>. Requests are validated and processed within 30 institutional working days.</li>
              <li><strong>Immediate Calendar Unlinking:</strong> You do not need to submit an email request to unlink Google Calendar; you can disconnect your Google Calendar instantaneously via the platform settings.</li>
            </ul>
          </div>
        </section>

        {/* Section 9: Cookies, Sessions, and Authentication */}
        <section id="cookies-and-sessions" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 9</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            9. Cookies, Sessions, and Client Storage
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              CITSchedule operates with minimal client-side state:
            </p>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>No Tracking Cookies:</strong> We do not deploy third-party advertising, analytics, or profiling cookies on your device.
              </p>
              <p>
                <strong>Local Session Bearer Tokens:</strong> When you authenticate, a secure authorization token is stored in your browser’s <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">window.localStorage</code> under the key <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">cit_auth_token</code>. This allows your authenticated session to persist as you navigate between timetable modules.
              </p>
              <p>
                <strong>Session Termination:</strong> Clicking "Sign Out" immediately wipes the bearer token from your browser’s local storage and notifies the server to invalidate the session.
              </p>
            </div>
          </div>
        </section>

        {/* Section 10: User Privacy Rights */}
        <section id="user-rights" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 10</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            10. User Privacy Rights
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              As a user of the CITSchedule platform, you are entitled to the following privacy protections:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900">Right to Access</span>
                <p className="text-[11px] text-slate-600">View your assigned timetable, course groups, and venue bookings anytime via your dashboard.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900">Right to Rectification</span>
                <p className="text-[11px] text-slate-600">Request correction of inaccurate departmental, roll number, or teaching assignment records.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900">Right to Data Portability</span>
                <p className="text-[11px] text-slate-600">Export your approved timetable schedule into standard iCalendar (.ics) format for personal use.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <span className="text-xs font-bold text-slate-900">Right to Revoke Integrations</span>
                <p className="text-[11px] text-slate-600">Revoke Google Calendar synchronization permissions at any moment without penalty.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 11: Contact Information */}
        <section id="contact-information" className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 11</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            11. Contact Information for Privacy Questions
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact the institution’s designated academic and technical administrative offices:
            </p>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">
                  Chilika Institute of Technology (CIT)
                </div>
                <div className="text-xs text-slate-500">
                  Office of the Dean of Academics & Campus IT Operations
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 block">Primary Administrative Contact:</span>
                  <a href="mailto:dean.academics@cit.ac.in" className="text-blue-600 hover:underline font-mono">
                    dean.academics@cit.ac.in
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 block">Designated Privacy & Compliance Desk:</span>
                  <a href="mailto:privacy@cit.ac.in" className="text-blue-600 hover:underline font-mono">
                    privacy@cit.ac.in
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
                <strong>Notice:</strong> The email addresses above represent the provisioned administrative contacts within the platform codebase. If your department or institutional governance mandates a physical mailing address or dedicated Data Protection Officer (DPO) registration, you can update this section accordingly.
              </div>
            </div>
          </div>
        </section>

        {/* Section 12: Policy Updates */}
        <section id="policy-updates" className="space-y-4 border-b border-slate-200/80 pb-12">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <span className="w-6 h-px bg-blue-600"></span>
            <span>Section 12</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            12. Policy Updates
          </h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We may periodically revise this Privacy Policy to reflect updates to campus regulations, technology infrastructure, or relevant data governance laws. When updates are published, the “Effective Date” at the top of this document will be revised accordingly. Material modifications affecting student or faculty privacy rights will be highlighted through an in-portal banner notification.
            </p>
            <p className="text-xs text-slate-500">
              Last modified: <strong>November 1, 2026</strong>.
            </p>
          </div>
        </section>

        {/* Bottom Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CITSchedule Home</span>
          </button>

          <button
            type="button"
            onClick={onSignIn}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Proceed to Login Portal</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/70 py-8 px-6 lg:px-16 text-xs text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-semibold text-slate-800">Chilika Institute of Technology • Academic Operations Suite</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              © 2026 CIT Scheduling Platform. All institutional rights reserved.
            </div>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Systems Operational</span>
            </span>
            <span>• Neon Encrypted</span>
            <span>• Governance</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
