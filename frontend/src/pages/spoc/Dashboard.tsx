import React, { useEffect, useState } from 'react';
import { 
  Users, Layers, Award, UserCheck, 
  Send, BarChart3, RefreshCw
} from 'lucide-react';
import api from '../../api';

interface DashboardStats {
  college: string;
  spoc_name: string;
  students: number;
  teams: number;
  finalized: number;
  problems: number;
  submissions: number;
  judges: number;
  coordinators: number;
  evaluated: number;
  shortlisted: number;
}

const SpocDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spoc/dashboard');
      setStats(res.data);
    } catch (err) {
      setError('Failed to retrieve dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '3rem' }}>Retrieving administrative data...</div>;
  }

  if (error || !stats) {
    return <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: '3rem' }}>{error || 'Dashboard unavailable'}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner Card */}
      <div className="card" style={styles.bannerCard}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Smart India Hackathon 2026
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.college}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back, <strong>{stats.spoc_name}</strong>. Here is the real-time overview of your college's internal hackathon selection funnel.
          </p>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid-4" style={{ gap: '1.25rem' }}>
        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, background: 'rgba(249, 115, 22, 0.1)' }}>
            <Users size={22} color="var(--color-primary)" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.students}</div>
            <div style={styles.statLabel}>Students Registered</div>
          </div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, background: 'rgba(59, 130, 246, 0.1)' }}>
            <Layers size={22} color="#3b82f6" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.teams}</div>
            <div style={styles.statLabel}>Teams Formed</div>
          </div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, background: 'rgba(16, 185, 129, 0.1)' }}>
            <Award size={22} color="var(--color-success)" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.finalized}</div>
            <div style={styles.statLabel}>Finalized Teams</div>
          </div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={{ ...styles.iconBg, background: 'rgba(99, 102, 241, 0.1)' }}>
            <Send size={22} color="#6366f1" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.submissions}</div>
            <div style={styles.statLabel}>Submissions Completed</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid-3" style={{ gap: '1.25rem' }}>
        <div className="card" style={styles.miniCard}>
          <div style={styles.miniHeader}>
            <UserCheck size={18} color="var(--color-primary)" />
            <span style={styles.miniLabel}>Evaluation Panel</span>
          </div>
          <div style={styles.miniValue}>{stats.judges}</div>
          <div style={styles.miniText}>Expert Judges Assigned</div>
        </div>

        <div className="card" style={styles.miniCard}>
          <div style={styles.miniHeader}>
            <Users size={18} color="#3b82f6" />
            <span style={styles.miniLabel}>Coordinators</span>
          </div>
          <div style={styles.miniValue}>{stats.coordinators}</div>
          <div style={styles.miniText}>Event Administrators</div>
        </div>

        <div className="card" style={styles.miniCard}>
          <div style={styles.miniHeader}>
            <BarChart3 size={18} color="var(--color-success)" />
            <span style={styles.miniLabel}>Selection Status</span>
          </div>
          <div style={styles.miniValue}>{stats.shortlisted}</div>
          <div style={styles.miniText}>Teams Recommended for Shortlist</div>
        </div>
      </div>
      
      {/* Quick Action Control Board */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>SPOC Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={() => window.location.href='/spoc/coordinators'} className="btn btn-primary">
            Manage Coordinators
          </button>
          <button onClick={() => window.location.href='/spoc/judges'} className="btn btn-secondary">
            Manage Judges
          </button>
          <button onClick={() => window.location.href='/spoc/sync'} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={14} /> SIH Sync Controller
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  bannerCard: {
    padding: '2.5rem',
    borderLeft: '4px solid var(--color-primary)',
    background: 'linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(249, 115, 22, 0.02))',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
  },
  iconBg: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  miniCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  miniHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  miniLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  miniValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '0.5rem',
  },
  miniText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  }
};

export default SpocDashboard;
