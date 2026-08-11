import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut } from 'lucide-react';

const JudgeLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/student/login'); // use same login endpoint
  };

  if (!user || user.role !== 'judge') {
    return null;
  }

  const profile = user.profile;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/sih-logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span className="logo-text">SIH Evaluation</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/judge/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard />
            <span className="nav-link-text">Assigned Teams</span>
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
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Judge Dashboard</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Evaluation & Grading Panel</p>
          </div>
          
          <div className="user-profile-badge">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              {profile?.full_name?.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.full_name}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{profile?.designation} | {profile?.organization}</div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default JudgeLayout;
