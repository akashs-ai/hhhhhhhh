import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  X,
  Calendar,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { UserItem } from '../../types';
import { googleSignIn } from '../../services/googleAuth';

export type LoginCategory = 'student' | 'professor' | 'hod_admin';

interface RoleSelectLoginProps {
  currentUser?: UserItem | null;
  onLoginSuccess: (user: UserItem) => void;
  onBackToLanding: () => void;
  onLogout?: () => void;
}

export const RoleSelectLogin: React.FC<RoleSelectLoginProps> = ({
  currentUser,
  onLoginSuccess,
  onBackToLanding,
  onLogout,
}) => {
  // Exactly three authoritative user categories
  const [activeCategory, setActiveCategory] = useState<LoginCategory>('student');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Password Recovery Dialog
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Student Google OAuth Dialog for local/test fallback
  const [showStudentGooglePrompt, setShowStudentGooglePrompt] = useState(false);
  const [studentGoogleEmail, setStudentGoogleEmail] = useState('');

  // Development/Demo Mode detection
  const [authConfig, setAuthConfig] = useState<{
    isDevelopment: boolean;
    demoAuthAllowed: boolean;
    googleOAuthConfigured: boolean;
  }>({
    isDevelopment: Boolean(import.meta.env.DEV || import.meta.env.MODE !== 'production'),
    demoAuthAllowed: true, // Optimistically enabled for local development
    googleOAuthConfigured: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  });

  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthConfig({
            isDevelopment: Boolean(data.isDevelopment),
            demoAuthAllowed: Boolean(data.demoAuthAllowed),
            googleOAuthConfigured: Boolean(data.googleOAuthConfigured),
          });
        }
      })
      .catch(() => {
        // Quiet fallback
      });
  }, []);

  // Switch category and clear errors
  const handleCategoryChange = (category: LoginCategory) => {
    setActiveCategory(category);
    setErrorMessage(null);
    setSuccessNotice(null);
    setPassword('');
    if (category === 'student') {
      setEmail('');
    } else if (category === 'professor' && !email) {
      setEmail('prof.turing@cit.ac.in');
    } else if (category === 'hod_admin' && !email) {
      setEmail('dean.academics@cit.ac.in');
    }
  };

  // 1. Password-based authentication for Professor and HOD/Admin
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          category: activeCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || 'Authentication failed. Please verify your institutional credentials.'
        );
      }

      if (rememberMe && data.token) {
        localStorage.setItem('cit_auth_token', data.token);
      }

      const user: UserItem = {
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

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to authenticate with CIT servers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Google OAuth authentication for Students
  const handleStudentGoogleAuth = async (tokenOrEmail?: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      let payloadToSend: { credential?: string; access_token?: string } = {};
      const gClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

      if (tokenOrEmail) {
        // Specific student email or test token from modal
        const clean = tokenOrEmail.trim();
        payloadToSend = clean.startsWith('test-') || clean.startsWith('mock-')
          ? { credential: clean }
          : { credential: `test-google-token:${clean}` };
      } else if (gClientId) {
        // Real Google Identity Services popup
        try {
          const authRes = await googleSignIn();
          if (!authRes || !authRes.accessToken) {
            // User closed popup
            setIsSubmitting(false);
            return;
          }
          payloadToSend = { access_token: authRes.accessToken };
        } catch (oauthErr: any) {
          throw new Error(oauthErr?.message || 'Google OAuth sign-in failed.');
        }
      } else {
        // In development / demo environment without Google Client ID, open the verified Google Student prompt
        setShowStudentGooglePrompt(true);
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/auth/google-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message ||
            'Access Denied: Google account is not authorized as an enrolled CIT student.'
        );
      }

      if (rememberMe && data.token) {
        localStorage.setItem('cit_auth_token', data.token);
      }

      const user: UserItem = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        roleLabel: data.user.roleLabel,
        department: data.user.department,
        studentGroupId: data.user.studentGroupId,
        email: data.user.email,
        token: data.token,
        avatar: data.user.avatarUrl,
        avatarUrl: data.user.avatarUrl,
      };

      setShowStudentGooglePrompt(false);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate via Google Workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2b. Direct Development Demo Student Login (Sandbox Mode Only)
  const handleDemoStudentLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/demo-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to authenticate demo student.');
      }

      if (rememberMe && data.token) {
        localStorage.setItem('cit_auth_token', data.token);
      }

      const user: UserItem = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        roleLabel: data.user.roleLabel,
        department: data.user.department,
        studentGroupId: data.user.studentGroupId,
        email: data.user.email,
        token: data.token,
        avatar: data.user.avatarUrl,
        avatarUrl: data.user.avatarUrl,
      };

      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing in as demo student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Password Recovery Handler
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setRecoveryError('Please enter a valid institutional email address.');
      return;
    }

    setRecoverySubmitting(true);
    setRecoveryError(null);
    setRecoveryMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          category: activeCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Unable to process password recovery request.');
      }

      setRecoveryMessage(
        data.message ||
          'If an institutional account exists with this address, password setup instructions have been sent.'
      );
    } catch (err: any) {
      setRecoveryError(err.message || 'Error sending password recovery email.');
    } finally {
      setRecoverySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-16 py-3.5 flex items-center justify-between shadow-2xs">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={onBackToLanding}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onBackToLanding()}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:bg-blue-700 transition-colors">
            C
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight">CITSchedule</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Chilika Institute of Technology
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToLanding}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Public Landing Page
          </button>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 cit-box-blend">
          {/* Header & Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-3 shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome to CIT Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
              Sign in to access your synchronized academic timetable, venue reservations, and examination dashboard.
            </p>
          </div>

          {/* Already Signed In Banner */}
          {currentUser && currentUser.token && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-slate-800 cit-box-blend">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Active Session Detected</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                You are currently signed in as <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.roleLabel || currentUser.role}).
              </p>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => onLoginSuccess(currentUser)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    Switch Account
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Category Selector (Exactly 3 categories) */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl flex space-x-1 mb-6 border border-slate-200/60">
            {/* Student Tab */}
            <button
              type="button"
              onClick={() => handleCategoryChange('student')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeCategory === 'student'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Student</span>
            </button>

            {/* Professor Tab */}
            <button
              type="button"
              onClick={() => handleCategoryChange('professor')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeCategory === 'professor'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Professor</span>
            </button>

            {/* HOD / Admin Tab */}
            <button
              type="button"
              onClick={() => handleCategoryChange('hod_admin')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeCategory === 'hod_admin'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>HOD / Admin</span>
            </button>
          </div>

          {/* Feedback & Error Notices */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 cit-box-blend">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5 cit-box-blend">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <div className="flex-1 font-medium leading-relaxed">{successNotice}</div>
            </div>
          )}

          {/* ===============================================================
              CATEGORY FLOW 1: STUDENT (Google OAuth & Demo Sandbox)
              =============================================================== */}
          {activeCategory === 'student' && (
            <div className="space-y-4 cit-box-blend">
              {/* Development & Testing Mode Banner */}
              {authConfig.demoAuthAllowed ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs">Development & Testing Mode Active</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Sandbox
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Student enrollment restrictions are relaxed in development mode. You can sign in with personal Google accounts (e.g. @gmail.com) without pre-enrollment or launch a simulated demo session below.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-slate-700">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Student Identity Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Students must sign in using their authorized institutional Google Workspace account. Only active, enrolled CIT students are granted access.
                  </p>
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                type="button"
                onClick={() => handleStudentGoogleAuth()}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Verifying Student Account...</span>
                  </>
                ) : (
                  <>
                    {/* Google G Logo SVG */}
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
                    <span>Continue with Google Workspace</span>
                  </>
                )}
              </button>

              {/* Demo Student One-Click Login (Development / Demo Mode Only) */}
              {authConfig.demoAuthAllowed && (
                <div className="space-y-2 pt-1">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
                      or simulated demo access
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoStudentLogin}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 text-amber-950 font-bold text-xs sm:text-sm shadow-2xs hover:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                        <span>Launching Demo Session...</span>
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4 text-amber-600" />
                        <span>Sign In as Demo Student (Sandbox)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-500 text-center leading-normal px-2">
                    * Uses demo identity <span className="font-mono text-slate-700 font-semibold">student.demo@gmail.com</span> for display and testing only. This is not a real or usable Gmail account.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{authConfig.demoAuthAllowed ? 'Demo Sandbox Mode' : 'Authorized CIT Domain Required'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStudentGooglePrompt(true)}
                  className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                >
                  Verify Specific Google Email
                </button>
              </div>
            </div>
          )}

          {/* ===============================================================
              CATEGORY FLOW 2 & 3: PROFESSOR & HOD/ADMIN (Email + Password)
              =============================================================== */}
          {activeCategory !== 'student' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 cit-box-blend">
              {/* Category Info Header */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start space-x-2.5">
                {activeCategory === 'professor' ? (
                  <>
                    <Briefcase className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 font-semibold">Professor Authentication: </strong>
                      Sign in with your assigned faculty email and institutional passphrase.
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800 font-semibold">HOD / Admin Access: </strong>
                      Administrative credentials require institutional authorization and are central-audited.
                    </div>
                  </>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="cit-login-email">
                  {activeCategory === 'professor' ? 'Faculty Email Address' : 'Administrator Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cit-login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activeCategory === 'professor' ? 'prof.turing@cit.ac.in' : 'dean.academics@cit.ac.in'
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700" htmlFor="cit-login-password">
                    Institutional Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cit-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.985] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeCategory === 'professor' ? 'Sign In as Professor' : 'Sign In as Administrator'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Institutional Account Help & Provisioning Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Need assistance or initial credentials? Contact{' '}
              <span className="text-slate-600 font-medium">support@cit.ac.in</span> or Academic Affairs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 Chilika Institute of Technology. All rights reserved. • Academic Platform v2.4
      </footer>

      {/* ===============================================================
          MODAL 1: FORGOT PASSWORD RECOVERY
          =============================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cit-page-blend">
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative cit-box-blend"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              onClick={() => {
                setShowForgotModal(false);
                setRecoveryMessage(null);
                setRecoveryError(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 id="forgot-password-title" className="text-base font-bold text-slate-900">
                  Reset Institutional Password
                </h3>
                <p className="text-xs text-slate-500">
                  Password setup for registered faculty and administrative staff.
                </p>
              </div>
            </div>

            {recoveryMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{recoveryMessage}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordRecovery} className="space-y-4">
                {recoveryError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>{recoveryError}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="recovery-email">
                    Institutional Email Address
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="your.name@cit.ac.in"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoverySubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
                  >
                    {recoverySubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Recovery Instructions</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===============================================================
          MODAL 2: STUDENT GOOGLE EMAIL VERIFICATION PROMPT
          =============================================================== */}
      {showStudentGooglePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cit-page-blend">
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative cit-box-blend"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-oauth-prompt-title"
          >
            <button
              onClick={() => setShowStudentGooglePrompt(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 id="student-oauth-prompt-title" className="text-base font-bold text-slate-900">
                  Student Google Account Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Verify enrolled CIT student identity via Google OAuth.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter your Google Workspace student email to verify enrollment records. Unauthorized or non-student Google accounts will be rejected by institutional policy.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="student-google-email">
                  Google Account Email
                </label>
                <input
                  id="student-google-email"
                  type="email"
                  value={studentGoogleEmail}
                  onChange={(e) => setStudentGoogleEmail(e.target.value)}
                  placeholder="e.g. aarav.cse3@cit.ac.in or 2025CSE1042@cit.ac.in"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 self-center">Pre-authorized test students:</span>
                <button
                  type="button"
                  onClick={() => setStudentGoogleEmail('aarav.cse3@cit.ac.in')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full"
                >
                  aarav.cse3@cit.ac.in
                </button>
                <button
                  type="button"
                  onClick={() => setStudentGoogleEmail('priya.y1a@cit.ac.in')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full cursor-pointer"
                >
                  priya.y1a@cit.ac.in
                </button>
                <button
                  type="button"
                  onClick={() => setStudentGoogleEmail('student.demo@gmail.com')}
                  className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full cursor-pointer"
                >
                  student.demo@gmail.com (Demo)
                </button>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStudentGooglePrompt(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleStudentGoogleAuth(studentGoogleEmail || 'aarav.cse3@cit.ac.in')}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Authenticate Student</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
