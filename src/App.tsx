import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { premiumEase } from './components/ui/motion';
import { UserItem, TimetableSession, Booking, ExamItem, DisruptionItem } from './types';
import { INITIAL_USERS } from './data/demoData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { RoleSelectLogin } from './pages/public/RoleSelectLogin';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTimetable } from './pages/admin/AdminTimetable';
import { AdminExamScheduler } from './pages/admin/AdminExamScheduler';
import { AdminVenueBooking } from './pages/admin/AdminVenueBooking';
import { AdminDisruptions } from './pages/admin/AdminDisruptions';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAIAssistant } from './pages/admin/AdminAIAssistant';

// Shared Pages (Coordinator & Student)
import { StudentDashboard } from './pages/shared/StudentDashboard';
import { StudentTimetable } from './pages/shared/StudentTimetable';
import { StudentExamScheduler } from './pages/shared/StudentExamScheduler';
import { StudentVenueBooking } from './pages/shared/StudentVenueBooking';
import { StudentReports } from './pages/shared/StudentReports';
import { StudentAIAssistant } from './pages/shared/StudentAIAssistant';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyTimetable } from './pages/faculty/FacultyTimetable';
import { FacultyExamScheduler } from './pages/faculty/FacultyExamScheduler';
import { FacultyVenueBooking } from './pages/faculty/FacultyVenueBooking';
import { FacultyRequests } from './pages/faculty/FacultyRequests';
import { FacultyAIAssistant } from './pages/faculty/FacultyAIAssistant';
import { FacultyReports } from './pages/faculty/FacultyReports';

export default function App() {
  // Navigation & Authentication state
  const [currentView, setCurrentView] = useState<'app' | 'landing' | 'login'>('app');
  const [currentUser, setCurrentUser] = useState<UserItem>(INITIAL_USERS[0]); // Default to Dr. S. Panda (Admin)
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Backend live state integration
  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [disruptions, setDisruptions] = useState<DisruptionItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Restore authenticated session from localStorage if present
  useEffect(() => {
    const savedToken = localStorage.getItem('cit_auth_token');
    if (savedToken) {
      fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const u = data.data;
            setCurrentUser({
              id: u.id,
              name: u.name,
              role: u.role,
              roleLabel:
                u.role === 'admin'
                  ? 'Dean Academics (Admin)'
                  : u.role === 'department_coordinator'
                  ? `${u.department || 'CSE'} Coordinator`
                  : u.role === 'faculty'
                  ? `Faculty (${u.department || 'CSE'})`
                  : u.role === 'club'
                  ? u.clubName || 'Club Lead'
                  : `Student (${u.studentGroupId || 'CSE-2A'})`,
              department: u.department,
              facultyId: u.facultyId,
              studentGroupId: u.studentGroupId,
              clubName: u.clubName,
              email: u.email,
              token: savedToken,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch initial data from existing backend API routes
  const refreshBackendData = async () => {
    setLoadingData(true);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${currentUser.token}`,
      };

      // Timetable
      const ttRes = await fetch('/api/timetable', { headers }).catch(() => null);
      if (ttRes && ttRes.ok) {
        const json = await ttRes.json();
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data);
        }
      }

      // Bookings
      const bkRes = await fetch('/api/bookings', { headers }).catch(() => null);
      if (bkRes && bkRes.ok) {
        const json = await bkRes.json();
        if (json.success && Array.isArray(json.data)) {
          setBookings(json.data);
        }
      }

      // Exams
      const exRes = await fetch('/api/exams', { headers }).catch(() => null);
      if (exRes && exRes.ok) {
        const json = await exRes.json();
        if (json.success && Array.isArray(json.data)) {
          setExams(json.data);
        }
      }

      // Disruptions
      const disRes = await fetch('/api/disruptions', { headers }).catch(() => null);
      if (disRes && disRes.ok) {
        const json = await disRes.json();
        if (json.success && Array.isArray(json.data)) {
          setDisruptions(json.data);
        }
      }
    } catch (err) {
      console.warn('Backend data sync notice:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    refreshBackendData();
  }, [currentUser]);

  // Real-time synchronization: listen for application mutations
  useEffect(() => {
    const handleMutation = () => {
      refreshBackendData();
    };
    window.addEventListener('cit:data-mutated', handleMutation);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshBackendData();
      }
    }, 45000);
    return () => {
      window.removeEventListener('cit:data-mutated', handleMutation);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Handle User Switching
  const handleSelectUser = (user: UserItem) => {
    setCurrentUser(user);
    if (user.token) {
      localStorage.setItem('cit_auth_token', user.token);
    }
    setCurrentTab('dashboard');
    setCurrentView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('cit_auth_token');
    setCurrentView('login');
  };

  // 1. Render Public Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setCurrentView('login')}
        onSignIn={() => setCurrentView('login')}
      />
    );
  }

  // 2. Render Role Selection and Login Page
  if (currentView === 'login') {
    return (
      <RoleSelectLogin
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentTab('dashboard');
          setCurrentView('app');
        }}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  // 3. Render Authenticated Application Shell
  const renderRolePage = () => {
    const role = currentUser.role;

    // --- ADMIN ROLE (8 Pages) ---
    if (role === 'admin') {
      switch (currentTab) {
        case 'dashboard':
          return (
            <AdminDashboard
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onTriggerGenerate={() => setCurrentTab('timetable')}
            />
          );
        case 'timetable':
          return <AdminTimetable currentUser={currentUser} sessions={sessions} />;
        case 'exams':
          return <AdminExamScheduler currentUser={currentUser} exams={exams} />;
        case 'bookings':
          return <AdminVenueBooking currentUser={currentUser} bookings={bookings} />;
        case 'disruptions':
          return <AdminDisruptions currentUser={currentUser} disruptions={disruptions} />;
        case 'requests':
          return <AdminRequests currentUser={currentUser} />;
        case 'reports':
          return <AdminReports currentUser={currentUser} />;
        case 'ai-assistant':
          return <AdminAIAssistant currentUser={currentUser} />;
        default:
          return (
            <AdminDashboard
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
      }
    }

    // --- FACULTY ROLE (6 Primary Navigation Pages) ---
    if (role === 'faculty') {
      switch (currentTab) {
        case 'dashboard':
          return (
            <FacultyDashboard
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
        case 'timetable':
          return <FacultyTimetable currentUser={currentUser} />;
        case 'exams':
          return (
            <FacultyExamScheduler
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
        case 'bookings':
          return <FacultyVenueBooking currentUser={currentUser} />;
        case 'requests':
          return <FacultyRequests currentUser={currentUser} />;
        case 'ai-assistant':
          return (
            <FacultyAIAssistant
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
        case 'reports':
          // Accessible via deep link or report view
          return <FacultyReports currentUser={currentUser} />;
        default:
          return (
            <FacultyDashboard
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          );
      }
    }

    // --- COORDINATOR & STUDENT ROLES (Shared Frontend Design, Distinct Permissions) ---
    switch (currentTab) {
      case 'dashboard':
        if (role === 'department_coordinator') {
          return (
            <AdminDashboard
              currentUser={currentUser}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onTriggerGenerate={() => setCurrentTab('timetable')}
            />
          );
        }
        return (
          <StudentDashboard
            currentUser={currentUser}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );
      case 'timetable':
        return <StudentTimetable currentUser={currentUser} sessions={sessions} />;
      case 'exams':
        return <StudentExamScheduler currentUser={currentUser} exams={exams} />;
      case 'bookings':
        if (role === 'department_coordinator') {
          return <AdminVenueBooking currentUser={currentUser} bookings={bookings} />;
        }
        return <StudentVenueBooking currentUser={currentUser} bookings={bookings} />;
      case 'reports':
        if (role === 'department_coordinator') {
          return <AdminReports currentUser={currentUser} />;
        }
        return (
          <StudentReports
            currentUser={currentUser}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );
      case 'ai-assistant':
        if (role === 'department_coordinator') {
          return <AdminAIAssistant currentUser={currentUser} />;
        }
        return <StudentAIAssistant currentUser={currentUser} />;
      default:
        return (
          <StudentDashboard
            currentUser={currentUser}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex flex-1">
        {/* Left Role-Specific Sidebar */}
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onLogout={handleLogout}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
            onLogout={handleLogout}
            onOpenPublicLanding={() => setCurrentView('landing')}
          />

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentUser.id}-${currentUser.role}-${currentTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: premiumEase }}
                className="min-h-full"
              >
                {renderRolePage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
