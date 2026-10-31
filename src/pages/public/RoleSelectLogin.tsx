import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  KeyRound,
  Briefcase,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserItem, UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/demoData';

interface RoleSelectLoginProps {
  onLoginSuccess: (user: UserItem) => void;
  onBackToLanding: () => void;
}

export const RoleSelectLogin: React.FC<RoleSelectLoginProps> = ({
  onLoginSuccess,
  onBackToLanding,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map roles to descriptions & icons
  const roleCards = [
    {
      role: 'admin' as UserRole,
      title: 'Admin',
      description: 'Full access, policy engine & override control',
      icon: Lock,
      defaultUser: INITIAL_USERS[0],
    },
    {
      role: 'department_coordinator' as UserRole,
      title: 'Coordinator',
      description: 'Departmental class grids & scheduling matrix',
      icon: Users,
      defaultUser: INITIAL_USERS[1],
    },
    {
      role: 'faculty' as UserRole,
      title: 'Faculty',
      description: 'Manage classes, labs, disruptions & invigilation',
      icon: Briefcase,
      defaultUser: INITIAL_USERS[2],
    },
    {
      role: 'student' as UserRole,
      title: 'Student',
      description: 'Schedules, exam halls & venue shifts',
      icon: GraduationCap,
      defaultUser: INITIAL_USERS[3],
    },
    {
      role: 'club' as UserRole,
      title: 'Club & Events',
      description: 'Auditoriums, amphitheaters & student fests',
      icon: Sparkles,
      defaultUser: INITIAL_USERS[4],
    },
    {
      role: 'admin' as UserRole, // HOD uses admin elevated capabilities
      title: 'HOD',
      description: 'Department oversight, approvals & resource audit',
      icon: Building2,
      defaultUser: INITIAL_USERS[5],
      isHOD: true,
    },
  ];

  const currentRoleCard = roleCards.find(
    (c) => c.role === selectedRole && (!c.isHOD || selectedRole === 'admin')
  ) || roleCards[3];

  const handleRoleSelect = (card: typeof roleCards[0]) => {
    setSelectedRole(card.role);
    setErrorMessage(null);
    if (card.defaultUser) {
      setUsernameOrEmail(card.defaultUser.email || card.defaultUser.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password: password,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed. Please verify credentials.');
      }

      if (rememberMe && data.token) {
        localStorage.setItem('cit_auth_token', data.token);
      }

      const authenticatedUser: UserItem = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        roleLabel: data.user.roleLabel,
        department: data.user.department,
        facultyId: data.user.facultyId,
        studentGroupId: data.user.studentGroupId,
        clubName: data.user.clubName,
        email: data.user.email,
        token: data.token,
      };

      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to authenticate with CIT server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleWorkspaceSSO = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Connect to auth backend for Institutional SSO with selected role
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Institutional Google Workspace SSO failed.');
      }

      if (data.token) {
        localStorage.setItem('cit_auth_token', data.token);
      }

      const authenticatedUser: UserItem = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        roleLabel: data.user.roleLabel,
        department: data.user.department,
        facultyId: data.user.facultyId,
        studentGroupId: data.user.studentGroupId,
        clubName: data.user.clubName,
        email: data.user.email,
        token: data.token,
      };

      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Institutional SSO connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-16 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToLanding}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            C
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 tracking-tight">CITSchedule</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
              Chilika Institute of Technology
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
          <button onClick={onBackToLanding} className="hover:text-blue-600 transition-colors">
            Home
          </button>
          <button onClick={onBackToLanding} className="hover:text-slate-900 transition-colors">
            Features
          </button>
          <button onClick={onBackToLanding} className="hover:text-slate-900 transition-colors">
            About
          </button>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onLoginSuccess(INITIAL_USERS[0])}
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2"
          >
            Sign In
          </button>
          <button
            onClick={() => onLoginSuccess(INITIAL_USERS[3])}
            className="text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 py-8">
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Academic Operations <span className="text-blue-600">Access Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Chilika Institute of Technology timetable choreography, classroom allocations, exam governance, and asset
              reservation systems.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Security Protocol</div>
              <div className="text-xs font-bold">CAS / OAuth 2.0 Enabled</div>
            </div>
          </div>
        </div>

        {/* 2-Column Selection & Login Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Role Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">STEP 01 • IDENTIFICATION</p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">Choose your operational role</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                6 Access Profiles
              </span>
            </div>

            {/* 6 Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roleCards.map((card, idx) => {
                const Icon = card.icon;
                const isSelected = selectedRole === card.role && (!card.isHOD || idx === 5);

                return (
                  <button
                    key={`${card.title}-${idx}`}
                    type="button"
                    onClick={() => handleRoleSelect(card)}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                    )}

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="text-sm font-bold text-slate-900">{card.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">{card.description}</div>

                    {isSelected && (
                      <div className="mt-3 w-full h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Helper Notice */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Need multi-role elevation? Contact Registrar Academic Wing (Admin Block, Level 2).</span>
              </div>
              <span className="font-bold underline cursor-pointer text-blue-700 ml-2">Guidelines</span>
            </div>

            {/* 3 Capabilities Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zero Clash Engine</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Heuristic scheduling resolving faculty & room overlaps
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Spectra Venues</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Digital room booking for 48 lecture theatres & lab wings
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Real-Time Sync</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Push notifications when emergency reschedule occurs
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>{selectedRole.toUpperCase().replace('_', ' ')} ACCESS</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Autumn 2026
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-black text-slate-900">
                  {currentRoleCard.title} Login
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in to access your timetable, exam schedule, venue bookings, and more.
                </p>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Roll Number / Email</label>
                    <span className="text-[10px] text-slate-400 font-mono">CIT Institutional UID</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder={
                        selectedRole === 'student'
                          ? 'e.g. 2025CSE1042 or user@cit.ac.in'
                          : 'e.g. user@cit.ac.in'
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button type="button" className="text-[10px] font-semibold text-blue-600 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter institutional passphrase"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Remember this workstation</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">CIT-Lab Secure</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Authenticating Credentials...' : 'Sign In to CITSchedule'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-white px-3 text-[11px] text-slate-400 font-medium">Or continue with</span>
              </div>

              {/* Google Workspace SSO Button */}
              <button
                type="button"
                onClick={handleGoogleWorkspaceSSO}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 transition-all flex items-center justify-center space-x-2.5 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Chilika Google Workspace</span>
              </button>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2 text-[10px] text-slate-400">
                <div>New semester admission or faculty joiner? <span className="text-blue-600 font-semibold cursor-pointer">Contact Administrator</span></div>
                <div className="flex justify-center space-x-3">
                  <span className="hover:underline cursor-pointer">Exam Regulations</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer">Server Telemetry</span>
                  <span>•</span>
                  <span className="hover:underline cursor-pointer">Help Desk (x4021)</span>
                </div>
                <div className="pt-1 flex items-center justify-center space-x-2 text-slate-500 font-mono">
                  <span>Single Sign-On Node: Odisha-CIT-01</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-emerald-600 font-bold">ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wide Smart Campus Initiative Banner */}
        <div className="mt-12 rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
              CHILIKA SMART CAMPUS INITIATIVE
            </div>
            <div className="text-lg font-black mt-0.5">Autonomous Academic Scheduling Architecture</div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>12,450 Active Students</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>418 Faculty</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>87 Specialized Labs</span>
            </span>
          </div>
        </div>

        {/* 4 Bottom Metric Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div>
            <div className="text-3xl font-black text-blue-600">100%</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">Clash-Free Timetables</div>
            <div className="text-[10px] text-slate-500">Zero room, faculty, or cohort collisions guaranteed by SAT-solvers.</div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600">48+</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">Managed Venues</div>
            <div className="text-[10px] text-slate-500">Auditoriums, seminar theatres, drawing halls, and PC clusters.</div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600">8 sec</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">Disruption Recovery</div>
            <div className="text-[10px] text-slate-500">Emergency room reallocation and dynamic rescheduling.</div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600">14,000</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">Concurrent Queries</div>
            <div className="text-[10px] text-slate-500">Optimized for semester exam publishing peaks.</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 lg:px-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-800">Chilika Institute of Technology</span> • Academic Operations Suite
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Systems Operational</span>
            </span>
            <span>Governance</span>
            <span>SLA & Audit</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
