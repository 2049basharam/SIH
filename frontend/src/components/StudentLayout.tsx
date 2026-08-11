import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, Send, Megaphone, Bell, LogOut 
} from 'lucide-react';
import api from '../api';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      const unread = res.data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  if (!user || user.role !== 'student') {
    return null;
  }

  const profile = user.profile;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/sih-logo.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span className="logo-text">SIH Selection</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard />
            <span className="nav-link-text">Dashboard</span>
          </NavLink>
          <NavLink to="/student/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users />
            <span className="nav-link-text">My Team</span>
          </NavLink>
          <NavLink to="/student/problems" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen />
            <span className="nav-link-text">Problems</span>
          </NavLink>
          <NavLink to="/student/submission" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Send />
            <span className="nav-link-text">Submission</span>
          </NavLink>
          <NavLink to="/student/announcements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Megaphone />
            <span className="nav-link-text">Announcements</span>
          </NavLink>
          <NavLink to="/student/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <div style={{ position: 'relative' }}>
              <Bell />
              {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount}</span>}
            </div>
            <span className="nav-link-text">Notifications</span>
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
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Student Portal</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{profile?.college}</p>
          </div>
          
          <div className="user-profile-badge">
            <div className="avatar">
              {profile?.full_name?.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.full_name}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{profile?.student_id} | {profile?.branch}</div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  unreadBadge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: 'white',
    fontSize: '0.65rem',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  }
};

export default StudentLayout;
