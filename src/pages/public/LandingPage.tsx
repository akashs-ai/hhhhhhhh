import React, { useState } from 'react';
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
  Compass,
} from 'lucide-react';
import { CampusExperience } from '../../components/CampusExperience/CampusExperience';
import PerspectiveTunnelHero from '../../components/ui/perspective-tunnel-hero';
import HalftoneWordmarkFooter from '../../components/ui/halftone-wordmark-footer';


interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [viewState, setViewState] = useState<'tour' | 'hero'>('tour');
  const [isEnteringHero, setIsEnteringHero] = useState(false);

  const handleTourComplete = () => {
    setIsEnteringHero(true);
    setViewState('hero');
    setTimeout(() => {
      setIsEnteringHero(false);
    }, 500);
  };

  return (
    <>
      {/* 1. Cinematic Campus Parallax Experience */}
      {viewState === 'tour' && (
        <CampusExperience
          onReachHero={handleTourComplete}
          onSkipToLogin={onSignIn}
        />
      )}

      {/* 2. Hero Landing Page Section */}
      <div
        className={`min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col transition-opacity duration-500 ease-out ${
          viewState === 'tour' ? 'hidden' : isEnteringHero ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Top Header - Glassmorphic with backdrop blur */}
        <header className="bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 border-b border-white/50 shadow-[0_4px_24px_0_rgba(0,0,0,0.04)] sticky top-0 z-40 px-6 lg:px-16 py-3 flex items-center justify-between transition-all">
          <div className="flex items-center space-x-3">
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
            <button
              type="button"
              onClick={() => setViewState('tour')}
              className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-blue-600 font-semibold cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Campus Tour</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onSignIn}
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

      {/* Perspective 3D Tunnel Hero Section */}
      <section id="home" className="w-full">
        <PerspectiveTunnelHero onGetStarted={onGetStarted} onSignIn={onSignIn} />
      </section>

      {/* Key Metric Highlights Bar */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 border-b border-slate-200/60 py-12 px-6 lg:px-16">
        {/* Soft ambient light behind metrics */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
          <div className="group relative rounded-2xl p-5 border border-slate-200/50 bg-white/60 backdrop-blur-xs shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-blue-200/80 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.05)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            <div className="text-4xl lg:text-5xl font-black text-blue-600 tracking-tight transition-transform duration-300 group-hover:scale-105">5</div>
            <div className="text-xs font-bold text-slate-800 mt-1.5">User Roles</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Admin, HOD, Faculty, Student, Club</div>
          </div>
          <div className="group relative rounded-2xl p-5 border border-slate-200/50 bg-white/60 backdrop-blur-xs shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-blue-200/80 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.05)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            <div className="text-4xl lg:text-5xl font-black text-blue-600 tracking-tight transition-transform duration-300 group-hover:scale-105">4+</div>
            <div className="text-xs font-bold text-slate-800 mt-1.5">Scheduling Modules</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Academic, Exam, Venues, Reschedules</div>
          </div>
          <div className="group relative rounded-2xl p-5 border border-slate-200/50 bg-white/60 backdrop-blur-xs shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-blue-200/80 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.05)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            <div className="text-4xl lg:text-5xl font-black text-blue-600 tracking-tight transition-transform duration-300 group-hover:scale-105">100%</div>
            <div className="text-xs font-bold text-slate-800 mt-1.5">Clash-Free</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Deterministic Constraint Solvers</div>
          </div>
          <div className="group relative rounded-2xl p-5 border border-slate-200/50 bg-white/60 backdrop-blur-xs shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:border-blue-200/80 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.05)] hover:-translate-y-0.5 transition-all duration-300 ease-out">
            <div className="text-4xl lg:text-5xl font-black text-blue-600 tracking-tight transition-transform duration-300 group-hover:scale-105">All in 1</div>
            <div className="text-xs font-bold text-slate-800 mt-1.5">Campus Scheduling</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Continuous Real-Time Synchronization</div>
          </div>
        </div>
      </section>

      {/* Architectural Capabilities Section */}
      <section id="features" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-blue-50/20 py-20 px-6 lg:px-16 border-b border-slate-200/60">
        {/* Subtle, low-opacity ambient light effects */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-400/[0.035] rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 -right-48 w-96 h-96 bg-indigo-400/[0.035] rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_15%,rgba(59,130,246,0.03),transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
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
            <div className="group relative p-7 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50/90 border border-blue-100/70 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Auto Clash Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simultaneously monitors classroom allocations, instructor working hours, and student batch overlaps.
                Instantly flags and auto-resolves scheduling collisions prior to semester publishing.
              </p>
              <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Zero Room Overlap Algorithm Active</span>
                </span>
                <span className="font-bold text-blue-600">99.98% Efficiency</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-7 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50/90 border border-blue-100/70 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5-Role Real-Time Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unified permission matrix tailored for Administrators, HODs, Coordinators, Faculty, and Students.
                Changes in rooms or lecture slots propagate across all personal timetables in under 200ms.
              </p>
              <div className="pt-3 flex flex-wrap gap-1.5 border-t border-slate-100">
                {['Admin', 'Coordinator', 'Faculty', 'Student', 'Club Leads'].map((role) => (
                  <span
                    key={role}
                    className="text-[10px] bg-slate-50/80 border border-slate-200/60 px-2 py-0.5 rounded-md font-medium text-slate-600 shadow-2xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-7 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50/90 border border-blue-100/70 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Venue Booking (Spectra)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized oversight for auditoriums, smart seminar halls, and laboratory blocks. Club leads and faculty
                reserve spaces with immediate Dean endorsement and calendar locks.
              </p>
              <div className="pt-3 flex flex-wrap gap-2 text-[10px] font-medium border-t border-slate-100">
                <span className="bg-slate-50/80 border border-slate-200/60 px-2 py-1 rounded-md text-slate-700 shadow-2xs">
                  Seminar Hall (Cap: 200)
                </span>
                <span className="bg-slate-50/80 border border-slate-200/60 px-2 py-1 rounded-md text-slate-700 shadow-2xs">
                  Conf. Room (Cap: 50)
                </span>
                <span className="bg-slate-50/80 border border-slate-200/60 px-2 py-1 rounded-md text-slate-700 shadow-2xs">
                  Auditorium (Cap: 500)
                </span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-7 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50/90 border border-blue-100/70 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Academic Rescheduling & Disruptions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When sudden faculty leave or institutional holidays occur, the disruption engine proposes compensatory
                slot recommendations with lowest impact on syllabus progress.
              </p>
              <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
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
      <section id="personas" className="relative overflow-hidden bg-gradient-to-b from-slate-50/40 via-white to-slate-50/60 py-20 px-6 lg:px-16 border-b border-slate-200/60 w-full">
        {/* Ambient subtle light backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_75%)]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12">
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
            <div className="group relative bg-white/95 backdrop-blur-xs border border-slate-200/70 rounded-2xl p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 border border-blue-100/60 px-2.5 py-1 rounded-full w-fit inline-block shadow-2xs">
                  Control Plane
                </span>
                <h3 className="text-base font-bold text-slate-900">Department Chairs & HODs</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-level workload balancing, faculty teaching allotment constraints, lab venue audits, and accreditation
                  compliance matrices.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600 border-t border-slate-100 group-hover:text-blue-700 transition-colors">
                <span>Workload Analytics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-xs border border-slate-200/70 rounded-2xl p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 border border-blue-100/60 px-2.5 py-1 rounded-full w-fit inline-block shadow-2xs">
                  Instructors
                </span>
                <h3 className="text-base font-bold text-slate-900">Faculty & Schedule Coordinators</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mark availability preferences, submit immediate substitute teacher requests, initiate room changes, and
                  track exam invigilation duties.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600 border-t border-slate-100 group-hover:text-blue-700 transition-colors">
                <span>1-Click Proposal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-xs border border-slate-200/70 rounded-2xl p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:border-blue-300/70 hover:shadow-[0_12px_28px_rgba(37,99,235,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 border border-blue-100/60 px-2.5 py-1 rounded-full w-fit inline-block shadow-2xs">
                  Learners
                </span>
                <h3 className="text-base font-bold text-slate-900">Students & Student Bodies</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Daily agenda timelines, mid-term seating rosters, venue requisition for hackathons or symposiums, and live
                  disruption alerts.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-blue-600 border-t border-slate-100 group-hover:text-blue-700 transition-colors">
                <span>Personalized View</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Engine Preview Section */}
      <section id="solver" className="relative overflow-hidden bg-slate-900 text-white py-18 px-6 lg:px-16 border-t border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.08] rounded-full blur-3xl" />
          <div className="absolute -top-32 left-1/4 w-[400px] h-[400px] bg-indigo-500/[0.06] rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
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
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/20 active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
              >
                <span>Try Timetable Generator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-950/90 backdrop-blur-xs border border-slate-800/90 rounded-2xl p-5 font-mono text-xs shadow-2xl hover:border-slate-700/80 transition-colors duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[11px] text-slate-400">
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
              <div className="mt-2 p-2 bg-slate-900/90 border border-slate-800/80 rounded-lg flex items-center justify-between text-[10px]">
                <span className="text-slate-300">Final Fitness Score: 99.4%</span>
                <span className="text-blue-400 font-bold">Verified Clash-Free</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blue CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-16 px-6 text-center border-t border-blue-500/30">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(255,255,255,0.12),transparent_70%)]" />

        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 border border-white/20 px-3 py-1 rounded-full shadow-2xs">
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
              className="bg-white text-blue-700 font-bold text-xs px-6 py-3 rounded-xl shadow-lg hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
            >
              Sign In to Portal
            </button>
            <button
              onClick={onGetStarted}
              className="bg-blue-800/60 border border-blue-400/40 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-blue-800 transition-all cursor-pointer"
            >
              Read CIT Governance Docs
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Halftone Wordmark Canvas Footer */}
      <HalftoneWordmarkFooter
        wordmark="EXPO"
        label="Chilika Institute of Technology"
        meta="© 2026 · Autonomous Academic Scheduling Architecture"
        preset="night"
      />
    </div>
  </>
  );
};
