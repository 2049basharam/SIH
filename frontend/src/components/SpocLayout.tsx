import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, UserCheck, 
  Settings, LogOut, ClipboardList, Megaphone, 
  BarChart, RefreshCw, Layers, Sparkles
} from 'lucide-react';

const SpocLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/spoc/login');
  };

  if (!user || user.role !== 'spoc') {
    return null;
  }

  const profile = user.profile;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/sih-logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span className="logo-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>SIH SPOC</span>
        </div>

        <nav className="nav-links" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          <NavLink to="/spoc/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span className="nav-link-text">Dashboard</span>
          </NavLink>
          <NavLink to="/spoc/intelligence" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={18} color="var(--color-primary)" />
            <span className="nav-link-text" style={{ fontWeight: 600 }}>SIH Intelligence</span>
          </NavLink>
          <NavLink to="/spoc/coordinators" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span className="nav-link-text">Coordinators</span>
          </NavLink>
          <NavLink to="/spoc/judges" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserCheck size={18} />
            <span className="nav-link-text">Judges</span>
          </NavLink>
          <NavLink to="/spoc/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} color="#10b981" />
            <span className="nav-link-text">Students</span>
          </NavLink>
          <NavLink to="/spoc/teams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Layers size={18} />
            <span className="nav-link-text">Teams</span>
          </NavLink>
          <NavLink to="/spoc/problems" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span className="nav-link-text">Problem Statements</span>
          </NavLink>
          <NavLink to="/spoc/sync" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <RefreshCw size={18} />
            <span className="nav-link-text">SIH Synchronization</span>
          </NavLink>
          <NavLink to="/spoc/announcements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Megaphone size={18} />
            <span className="nav-link-text">Announcements</span>
          </NavLink>
          <NavLink to="/spoc/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart size={18} />
            <span className="nav-link-text">Reports</span>
          </NavLink>
          <NavLink to="/spoc/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={18} />
            <span className="nav-link-text">Audit Logs</span>
          </NavLink>
          <NavLink to="/spoc/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span className="nav-link-text">Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div>
            <span className="welcome-text">SIH 2026 Admin Portal</span>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginTop: '2px' }}>
              College SPOC: {profile?.college || 'Institution SPOC'}
            </h4>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.full_name || 'Dr. SPOC'}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active College Authority</div>
            </div>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
              SP
            </div>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SpocLayout;
