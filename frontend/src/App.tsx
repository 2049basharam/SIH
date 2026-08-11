import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import StudentLayout from './components/StudentLayout';
import CoordinatorLayout from './components/CoordinatorLayout';
import JudgeLayout from './components/JudgeLayout';

// Shared Pages
import StudentAuth from './pages/student/StudentAuth';
import CoordinatorLogin from './pages/coordinator/CoordinatorLogin';
import JudgeLogin from './pages/judge/JudgeLogin';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import TeamFormation from './pages/student/TeamFormation';
import TeamReview from './pages/student/TeamReview';
import Problems from './pages/student/Problems';
import Submission from './pages/student/Submission';
import Announcements from './pages/student/Announcements';
import Notifications from './pages/student/Notifications';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import TeamsList from './pages/coordinator/Teams';
import TeamDetail from './pages/coordinator/TeamDetail';
import CoordinatorProblems from './pages/coordinator/Problems';
import CoordinatorJudges from './pages/coordinator/Judges';
import Shortlisting from './pages/coordinator/Shortlisting';
import CoordinatorAnnouncements from './pages/coordinator/Announcements';
import Reports from './pages/coordinator/Reports';
import CoordinatorSettings from './pages/coordinator/Settings';
import AuditLogs from './pages/coordinator/AuditLogs';

// Judge Pages
import JudgeDashboard from './pages/judge/Dashboard';
import ScoreTeam from './pages/judge/ScoreTeam';

// SPOC Layout
import SpocLayout from './components/SpocLayout';

// SPOC Pages
import SpocLogin from './pages/spoc/SpocLogin';
import SpocDashboard from './pages/spoc/Dashboard';
import CoordinatorManagement from './pages/spoc/CoordinatorManagement';
import JudgeManagement from './pages/spoc/JudgeManagement';
import SihSynchronization from './pages/spoc/SihSynchronization';
import SpocAuditLogs from './pages/spoc/AuditLogs';
import SpocReports from './pages/spoc/Reports';
import SpocSettings from './pages/spoc/Settings';
import SpocProblems from './pages/spoc/Problems';
import SpocAnnouncements from './pages/spoc/Announcements';
import SpocStudents from './pages/spoc/Students';
import SpocTeams from './pages/spoc/Teams';
import SpocIntelligence from './pages/spoc/Intelligence';

// Account Activation
import ActivateAccount from './pages/ActivateAccount';

// Route guards
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Authenticating Session...</div>;
  if (!token || (user && user.role !== 'student')) {
    return <Navigate to="/student/login" replace />;
  }
  return <>{children}</>;
};

const CoordinatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Authenticating Session...</div>;
  if (!token || (user && user.role !== 'coordinator')) {
    return <Navigate to="/coordinator/login" replace />;
  }
  return <>{children}</>;
};

const JudgeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Authenticating Session...</div>;
  if (!token || (user && user.role !== 'judge')) {
    return <Navigate to="/judge/login" replace />;
  }
  return <>{children}</>;
};

const SpocRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '3rem' }}>Authenticating Session...</div>;
  if (!token || (user && user.role !== 'spoc')) {
    return <Navigate to="/spoc/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Auth */}
            <Route path="/student/login" element={<StudentAuth />} />
            <Route path="/student/register" element={<StudentAuth />} />
            <Route path="/coordinator/login" element={<CoordinatorLogin />} />
            <Route path="/judge/login" element={<JudgeLogin />} />

            {/* Student Portal */}
            <Route path="/student" element={<StudentRoute><StudentLayout /></StudentRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="team" element={<TeamFormation />} />
              <Route path="team/create" element={<TeamFormation />} />
              <Route path="team/review" element={<TeamReview />} />
              <Route path="problems" element={<Problems />} />
              <Route path="submission" element={<Submission />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Coordinator Portal */}
            <Route path="/coordinator" element={<CoordinatorRoute><CoordinatorLayout /></CoordinatorRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CoordinatorDashboard />} />
              <Route path="teams" element={<TeamsList />} />
              <Route path="teams/:id" element={<TeamDetail />} />
              <Route path="problems" element={<CoordinatorProblems />} />
              <Route path="judges" element={<CoordinatorJudges />} />
              <Route path="shortlisting" element={<Shortlisting />} />
              <Route path="announcements" element={<CoordinatorAnnouncements />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<CoordinatorSettings />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Judge Portal */}
            <Route path="/judge" element={<JudgeRoute><JudgeLayout /></JudgeRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<JudgeDashboard />} />
              <Route path="evaluation/:teamId" element={<ScoreTeam />} />
            </Route>

            {/* SPOC Login */}
            <Route path="/spoc/login" element={<SpocLogin />} />

            {/* Account Activation */}
            <Route path="/activate-account" element={<ActivateAccount />} />

            {/* SPOC Portal */}
            <Route path="/spoc" element={<SpocRoute><SpocLayout /></SpocRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SpocDashboard />} />
              <Route path="coordinators" element={<CoordinatorManagement />} />
              <Route path="judges" element={<JudgeManagement />} />
              <Route path="students" element={<SpocStudents />} />
              <Route path="teams" element={<SpocTeams />} />
              <Route path="problems" element={<SpocProblems />} />
              <Route path="sync" element={<SihSynchronization />} />
              <Route path="announcements" element={<SpocAnnouncements />} />
              <Route path="reports" element={<SpocReports />} />
              <Route path="audit-logs" element={<SpocAuditLogs />} />
              <Route path="settings" element={<SpocSettings />} />
              <Route path="intelligence" element={<SpocIntelligence />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/student/login" replace />} />
            <Route path="*" element={<Navigate to="/student/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
