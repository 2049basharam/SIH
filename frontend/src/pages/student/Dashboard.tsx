import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, AlertTriangle, FileText } from 'lucide-react';
import api from '../../api';
import type { Event, Team } from '../../types';
import { formatDate } from '../../utils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get('/student/event');
        setEvent(eventRes.data);
        
        try {
          const teamRes = await api.get('/student/team');
          setTeam(teamRes.data);
        } catch (teamErr) {
          // Student might not have a team yet
          setTeam(null);
        }
        
        const annRes = await api.get('/student/announcements');
        setAnnouncements(annRes.data.slice(0, 3)); // show top 3
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading dashboard details...</div>;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'badge-warning';
      case 'ADMIN_UNLOCKED': return 'badge-info';
      case 'FINALIZED': return 'badge-success';
      case 'SUBMITTED': return 'badge-success';
      case 'SHORTLISTED': return 'badge-success';
      case 'WAITLISTED': return 'badge-warning';
      case 'NOT_SELECTED': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const isLocked = team && ['FINALIZED', 'SUBMITTED', 'SHORTLISTED', 'WAITLISTED'].includes(team.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={styles.welcomeBanner}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Hello, {user?.profile?.full_name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px' }}>
            Welcome to the Internal Selection Portal for Smart India Hackathon. From here you can manage your team, select problem statements, and submit your project ideas.
          </p>
        </div>
        <div style={styles.bannerBadge}>SIH 2026</div>
      </div>

      {/* Team Alert/Status */}
      {!team ? (
        <div className="card" style={{ ...styles.alertCard, borderColor: 'var(--color-warning)' }}>
          <AlertTriangle size={24} color="var(--color-warning)" />
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>You are not in a team yet</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              To participate in the selection process, you must either create a new team or be added to an existing team by its leader.
            </p>
          </div>
          <Link to="/student/team/create" className="btn btn-primary">
            Create Team
          </Link>
        </div>
      ) : (
        <div className="card" style={styles.statusCard}>
          <div style={styles.statusDetail}>
            <div style={styles.statusHeader}>
              <h3 style={{ fontSize: '1.25rem' }}>Team: <span style={{ color: 'var(--color-primary)' }}>{team.name}</span></h3>
              <span className={`badge ${getStatusBadgeClass(team.status)}`}>
                {team.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="grid-3" style={{ marginTop: '1.25rem' }}>
              <div style={styles.statMini}>
                <span style={styles.statMiniLabel}>Leader</span>
                <span style={styles.statMiniVal}>{team.leader?.full_name}</span>
              </div>
              <div style={styles.statMini}>
                <span style={styles.statMiniLabel}>Members</span>
                <span style={styles.statMiniVal}>{team.members?.length} / {event?.settings?.team_size}</span>
              </div>
              <div style={styles.statMini}>
                <span style={styles.statMiniLabel}>Submission Status</span>
                <span style={styles.statMiniVal}>
                  {team.submissions && team.submissions.length > 0 ? 'Submitted' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={styles.statusAction}>
            <Link to="/student/team" className="btn btn-secondary" style={{ width: '100%' }}>
              Manage Team
            </Link>
            {!isLocked && (
              <Link to="/student/team" className="btn btn-primary" style={{ width: '100%' }}>
                Finalize & Lock
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Grid: Events & Announcements */}
      <div className="grid-2">
        {/* Timeline Deadlines */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--color-primary)" />
            Important Timeline
          </h3>
          
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineContent}>
                <div style={styles.timelineHeader}>
                  <span style={styles.timelineTitle}>Registration Period</span>
                  <span className="badge badge-info">Active</span>
                </div>
                <span style={styles.timelineDate}>
                  Closes {event ? formatDate(event.registration_end) : ''}
                </span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineContent}>
                <div style={styles.timelineHeader}>
                  <span style={styles.timelineTitle}>Team Finalization Lock</span>
                </div>
                <span style={styles.timelineDate}>
                  Deadline: {event ? formatDate(event.team_finalization_deadline, true) : ''}
                </span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineContent}>
                <div style={styles.timelineHeader}>
                  <span style={styles.timelineTitle}>Idea Submission Deadline</span>
                </div>
                <span style={styles.timelineDate}>
                  Deadline: {event ? formatDate(event.submission_deadline, true) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--color-secondary)" />
            Recent Announcements
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No announcements available.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} style={styles.annItem}>
                  <div style={styles.annMeta}>
                    <span style={{ fontWeight: 600, color: 'white' }}>{ann.title}</span>
                    <span className={`badge ${ann.priority === 'HIGH' ? 'badge-danger' : 'badge-info'}`} style={{ scale: '0.85' }}>
                      {ann.priority}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {ann.message}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                    Published: {new Date(ann.publish_time).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  welcomeBanner: {
    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
    border: '1px solid rgba(249, 115, 22, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2.5rem',
  },
  bannerBadge: {
    background: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    color: 'var(--color-primary)',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
  },
  alertCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    borderLeft: '4px solid var(--color-warning)',
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    borderLeft: '4px solid var(--color-primary)',
    flexWrap: 'wrap' as const,
  },
  statusDetail: {
    flex: 1,
    minWidth: '280px',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statMini: {
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(0, 0, 0, 0.02)',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  },
  statMiniLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  statMiniVal: {
    fontSize: '0.95rem',
    fontWeight: 600,
    marginTop: '0.15rem',
    color: 'var(--text-primary)',
  },
  statusAction: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    minWidth: '200px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    position: 'relative' as const,
    paddingLeft: '1.5rem',
  },
  timelineItem: {
    position: 'relative' as const,
  },
  timelineDot: {
    position: 'absolute' as const,
    left: '-1.5rem',
    top: '6px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--color-primary)',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.25)',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineTitle: {
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  timelineDate: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
  annItem: {
    background: 'rgba(0, 0, 0, 0.01)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    borderRadius: '8px',
    padding: '1rem',
  },
  annMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
};

export default Dashboard;
