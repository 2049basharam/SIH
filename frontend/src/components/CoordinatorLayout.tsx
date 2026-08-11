import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, BarChart, Megaphone, FileDown, Settings, ShieldCheck, LogOut 
} from 'lucide-react';

const CoordinatorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/student/login'); // use same login endpoint
  };

  if (!user || user.role !== 'coordinator') {
    return null;
  }

  const profile = user.profile;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/sih-logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span className="logo-text">SIH Spoc</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/coordinator/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard />
            <span className="nav-link-text">Dashboard</span>
          </NavLink>
          <NavLink to="/coordinator/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users />
            <span className="nav-link-text">Manage Teams</span>
          </NavLink>
          <NavLink to="/coordinator/problems" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen />
            <span className="nav-link-text">Problems</span>
          </NavLink>
          <NavLink to="/coordinator/judges" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserCheck />
            <span className="nav-link-text">Judges</span>
          </NavLink>
          <NavLink to="/coordinator/shortlisting" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart />
            <span className="nav-link-text">Shortlisting</span>
          </NavLink>
          <NavLink to="/coordinator/announcements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Megaphone />
            <span className="nav-link-text">Announcements</span>
          </NavLink>
          <NavLink to="/coordinator/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileDown />
            <span className="nav-link-text">Reports</span>
          </NavLink>
          <NavLink to="/coordinator/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings />
            <span className="nav-link-text">Settings</span>
          </NavLink>
          <NavLink to="/coordinator/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck />
            <span className="nav-link-text">Audit Logs</span>
          </NavLink>
        </nav>

        <div className="nav-link" onClick={handleLogout} style={{ marginTop: 'auto', borderLeft: 'none' }}>
          <LogOut />
          <span className="nav-link-text">Logout</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Coordinator Portal</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>SIH Selection Control Tower</p>
          </div>
          
          <div className="user-profile-badge">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}>
              {profile?.full_name?.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.full_name}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{profile?.staff_id} | {profile?.department}</div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default CoordinatorLayout;
