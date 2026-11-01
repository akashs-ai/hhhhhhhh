import React from 'react';
import {
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { CampusExperience } from '../../components/CampusExperience/CampusExperience';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <CampusExperience
      onSkipToLogin={onSignIn}
      onLoginSubmit={() => onSignIn()}
    >
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 lg:px-16 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            C
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight">CITSchedule</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                Chilika Institute of Technology
              </span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
          <a href="#home" className="text-blue-600 hover:text-blue-700 transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#personas" className="hover:text-slate-900 transition-colors">
            Stakeholders
          </a>
          <a href="#solver" className="hover:text-slate-900 transition-colors">
            Solver Engine
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSignIn}
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="px-6 lg:px-16 pt-12 pb-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/60 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Autonomous Algorithmic Solver • Sub-Second Conflict Detection</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Smarter <span className="text-blue-600">Scheduling</span>
              <br />
              for a Better Campus
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              A unified autonomous platform for class timetables, conflict-free examination matrices, venue
              choreography, and dynamic rescheduling — precision engineered for CIT.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold text-xs shadow-2xs hover:bg-slate-50 transition-colors flex items-center space-x-2"
              >
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* Hero Visual Card with Mock Preview */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 p-5 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-radial from-blue-600/10 to-transparent opacity-60"></div>
              
              {/* Floating feature pills matching screenshot */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>CIT Campus Operations Center</span>
                  </div>
                  <span className="text-[10px] text-blue-400 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700 font-mono">
                    SAT v4.8 Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3 shadow-md">
                    <div className="text-blue-400 flex items-center space-x-1.5 text-xs font-bold">
                      <Calendar className="w-4 h-4" />
                      <span>Timetable</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">★ Auto Generate</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">320 weekly slots verified</div>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3 shadow-md">
                    <div className="text-blue-400 flex items-center space-x-1.5 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Exam Suite</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">Zero Clash Seatings</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">18 blocks allocated</div>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3 shadow-md">
                    <div className="text-blue-400 flex items-center space-x-1.5 text-xs font-bold">
                      <Building2 className="w-4 h-4" />
                      <span>Venue Booking</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">Spectra Infrastructure</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sound boundary checks</div>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3 shadow-md">
                    <div className="text-blue-400 flex items-center space-x-1.5 text-xs font-bold">
                      <Bot className="w-4 h-4" />
                      <span>AI Assistant</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">Smart Suggestions</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sub-second recovery</div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-900/40 border border-blue-700/50 rounded-xl text-left">
                  <div className="text-[11px] font-semibold text-blue-200">Autonomous Schedule Integrity</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    100% hard constraints satisfied with minimal perturbation guarantee.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Big Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-10 border-t border-slate-200">
          <div>
            <div className="text-4xl lg:text-5xl font-black text-blue-600">5</div>
            <div className="text-xs font-bold text-slate-800 mt-1">User Roles</div>
            <div className="text-[11px] text-slate-500">Admin, HOD, Faculty, Student, Club</div>
          </div>
          <div>
            <div className="text-4xl lg:text-5xl font-black text-blue-600">4+</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Scheduling Modules</div>
            <div className="text-[11px] text-slate-500">Academic, Exam, Venues, Reschedules</div>
          </div>
          <div>
            <div className="text-4xl lg:text-5xl font-black text-blue-600">100%</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Clash-Free</div>
            <div className="text-[11px] text-slate-500">Deterministic Constraint Solvers</div>
          </div>
          <div>
            <div className="text-4xl lg:text-5xl font-black text-blue-600">All in 1</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Campus Scheduling</div>
            <div className="text-[11px] text-slate-500">Continuous Real-Time Synchronization</div>
          </div>
        </div>
      </section>

      {/* Architectural Capabilities Section */}
      <section id="features" className="bg-white py-16 px-6 lg:px-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              ARCHITECTURAL CAPABILITIES
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Everything CIT Needs in One System
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              From high-frequency departmental lectures to institution-wide semester assessments, CITSchedule handles
              complex resource constraints without human error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Auto Clash Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simultaneously monitors classroom allocations, instructor working hours, and student batch overlaps.
                Instantly flags and auto-resolves scheduling collisions prior to semester publishing.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Zero Room Overlap Algorithm Active</span>
                </span>
                <span className="font-bold text-blue-600">99.98% Efficiency</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5-Role Real-Time Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unified permission matrix tailored for Administrators, HODs, Coordinators, Faculty, and Students.
                Changes in rooms or lecture slots propagate across all personal timetables in under 200ms.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-200">
                {['Admin', 'Coordinator', 'Faculty', 'Student', 'Club Leads'].map((role) => (
                  <span
                    key={role}
                    className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-600"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Venue Booking (Spectra)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized oversight for auditoriums, smart seminar halls, and laboratory blocks. Club leads and faculty
                reserve spaces with immediate Dean endorsement and calendar locks.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-medium border-t border-slate-200">
                <span className="bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-700">
                  Seminar Hall (Cap: 200)
                </span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-700">
                  Conf. Room (Cap: 50)
                </span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-700">
                  Auditorium (Cap: 500)
                </span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Academic Rescheduling & Disruptions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When sudden faculty leave or institutional holidays occur, the disruption engine proposes compensatory
                slot recommendations with lowest impact on syllabus progress.
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Automated Student SMS & App Broadcast</span>
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="personas" className="py-16 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">TAILORED PERSONAS</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Built For Every Academic Stakeholder
            </h2>
            <p className="text-xs text-slate-500 max-w-md mt-2 md:mt-0">
              CITSchedule adapts its visual workspace based on institutional authentication, giving administrators deep
              control and students pure clarity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Control Plane
            </span>
            <h3 className="text-base font-bold text-slate-900">Department Chairs & HODs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-level workload balancing, faculty teaching allotment constraints, lab venue audits, and accreditation
              compliance matrices.
            </p>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Workload Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Instructors
            </span>
            <h3 className="text-base font-bold text-slate-900">Faculty & Schedule Coordinators</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mark availability preferences, submit immediate substitute teacher requests, initiate room changes, and
              track exam invigilation duties.
            </p>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>1-Click Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Learners
            </span>
            <h3 className="text-base font-bold text-slate-900">Students & Student Bodies</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Daily agenda timelines, mid-term seating rosters, venue requisition for hackathons or symposiums, and live
              disruption alerts.
            </p>
            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Personalized View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Engine Preview Section */}
      <section id="solver" className="bg-slate-900 text-white py-14 px-6 lg:px-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">AUTONOMOUS ENGINE</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Generate Semestral Schedules in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Define core departmental subjects, theory-to-lab constraints, faculty maximum daily hours, and let
              CITSchedule solve optimal room rosters without overlaps.
            </p>

            <ul className="space-y-2 text-xs text-slate-300 pt-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Avoid consecutive heavy theory classes</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Automatic multi-hour laboratory blocks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Faculty preferred time window weighting</span>
              </li>
            </ul>

            <div className="pt-4">
              <button
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md inline-flex items-center space-x-2"
              >
                <span>Try Timetable Generator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                <span className="ml-2 text-slate-300 font-semibold">CIT Schedule Matrix Solver v3.4</span>
              </div>
              <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
            </div>

            <div className="mt-3 space-y-2 text-[11px] text-slate-300">
              <div className="text-blue-400">
                [OPTIMIZER] Initializing Constraint Satisfaction Algorithm (Genetic Heuristic v4.2)...
              </div>
              <div className="text-emerald-400">✓ Loaded 64 Faculty availability profiles</div>
              <div className="text-emerald-400">✓ Cross matched 14 Smart Laboratories for Block 4</div>
              <div className="text-slate-400">
                [COMPUTE] 0 Room Clashes, 0 Faculty Collisions detected. (Latency: 0.42s)
              </div>
              <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between text-[10px]">
                <span className="text-slate-300">Final Fitness Score: 99.4%</span>
                <span className="text-blue-400 font-bold">Verified Clash-Free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blue CTA Banner */}
      <section className="bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-14 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full">
            Autonomous Campus Governance
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Elevate CIT's Academic Workflow?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Join hundreds of faculty members, coordinators, and thousands of students already experiencing frictionless
            timetable schedules.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={onSignIn}
              className="bg-white text-blue-700 font-bold text-xs px-6 py-3 rounded-xl shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
            >
              Sign In to Portal
            </button>
            <button
              onClick={onGetStarted}
              className="bg-blue-800/60 border border-blue-400/40 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-blue-800 transition-all"
            >
              Read CIT Governance Docs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 lg:px-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-800">Chilika Institute of Technology • Academic Operations Suite</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              © 2026 CIT Scheduling Platform. Autonomous Scheduling Architecture.
            </div>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Systems Operational</span>
            </span>
            <span>• Governance</span>
            <span>• SLA & Audit</span>
          </div>
        </div>
      </footer>
    </div>
  </CampusExperience>
  );
};
