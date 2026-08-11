import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Users, FileText, CheckCircle, Award, Layers, Trophy, Sparkles } from 'lucide-react';
import api from '../../api';
import type { CoordinatorStats, Event } from '../../types';
import { AIInsightCard, AIWarningCard, AIProcessingIndicator, AIUnavailableState } from '../../components/intelligence/AIComponents';

const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/coordinator/dashboard');
      setStats(statsRes.data);
      
      const eventRes = await api.get('/coordinator/settings');
      setEvent(eventRes.data);
    } catch (err) {
      showToast('Error loading dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await api.put(`/coordinator/settings/status?status_str=${newStatus}`);
      setEvent(res.data);
      showToast(`Event status updated to: ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast('Failed to update event status', 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading selection metrics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Event Details and status controller */}
      <div className="card" style={styles.eventControlCard}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Active Event: {event?.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Academic Year: {event?.academic_year} | Current Stage: <strong style={{ color: 'var(--color-primary)' }}>{event?.status.replace('_', ' ')}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Change Stage:</label>
          <select 
            className="form-control"
            value={event?.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ width: 'auto', background: 'rgba(255,255,255,0.06)' }}
          >
            <option value="DRAFT">Draft</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="REGISTRATION_CLOSED">Registration Closed</option>
            <option value="SUBMISSION_OPEN">Submission Open</option>
            <option value="SUBMISSION_CLOSED">Submission Closed</option>
            <option value="INTERNAL_HACKATHON">Internal Hackathon</option>
            <option value="EVALUATION">Evaluation</option>
            <option value="SHORTLISTING">Shortlisting</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Registration */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Registration & Assembly
            </h3>
            <div className="grid-4">
              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <Users size={22} color="var(--color-primary)" />
                  <span style={styles.metricTitle}>Registered Students</span>
                </div>
                <div style={styles.metricValue}>{stats.total_students}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <Layers size={22} color="var(--color-secondary)" />
                  <span style={styles.metricTitle}>Teams Created</span>
                </div>
                <div style={styles.metricValue}>{stats.teams_created}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <CheckCircle size={22} color="var(--color-success)" />
                  <span style={styles.metricTitle}>Teams Finalized</span>
                </div>
                <div style={styles.metricValue}>{stats.teams_finalized}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <Users size={22} color="var(--color-danger)" />
                  <span style={styles.metricTitle}>Incomplete Teams</span>
                </div>
                <div style={styles.metricValue}>{stats.incomplete_teams}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Submissions & Judging */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Idea Submissions & Judging
            </h3>
            <div className="grid-4">
              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <FileText size={22} color="var(--color-primary)" />
                  <span style={styles.metricTitle}>Problems Selected</span>
                </div>
                <div style={styles.metricValue}>{stats.teams_with_problems}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <FileText size={22} color="var(--color-success)" />
                  <span style={styles.metricTitle}>Completed Proposals</span>
                </div>
                <div style={styles.metricValue}>{stats.submissions_completed}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <Users size={22} color="var(--color-warning)" />
                  <span style={styles.metricTitle}>Participating Teams</span>
                </div>
                <div style={styles.metricValue}>{stats.participating_teams}</div>
              </div>

              <div className="card" style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <Award size={22} color="var(--color-success)" />
                  <span style={styles.metricTitle}>Evaluated Teams</span>
                </div>
                <div style={styles.metricValue}>{stats.evaluated_teams}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Final Selection */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nomination / Shortlist Status
            </h3>
            <div className="grid-3">
              <div className="card" style={{ ...styles.metricCard, borderLeft: '4px solid var(--color-success)' }}>
                <div style={styles.metricHeader}>
                  <Trophy size={22} color="var(--color-success)" />
                  <span style={styles.metricTitle}>Shortlisted / Nominated</span>
                </div>
                <div style={styles.metricValue}>{stats.shortlisted_teams}</div>
              </div>

              <div className="card" style={{ ...styles.metricCard, borderLeft: '4px solid var(--color-warning)' }}>
                <div style={styles.metricHeader}>
                  <Award size={22} color="var(--color-warning)" />
                  <span style={styles.metricTitle}>Waitlisted Teams</span>
                </div>
                <div style={styles.metricValue}>{stats.waitlisted_teams}</div>
              </div>

              <div className="card" style={{ ...styles.metricCard, borderLeft: '4px solid var(--color-danger)' }}>
                <div style={styles.metricHeader}>
                  <Users size={22} color="var(--color-danger)" />
                  <span style={styles.metricTitle}>Not Selected</span>
                </div>
                <div style={styles.metricValue}>{stats.not_selected_teams}</div>
              </div>
            </div>
          </div>

          {/* Section 4: Coordinator AI Intelligence Center */}
          {event && <CoordinatorIntelligenceWidget eventId={event.id} />}

        </div>
      )}
    </div>
  );
};

interface IntelligenceData {
  anomalies: any[];
  risk_index: number;
  summary: string;
  reminders: any[];
  admin_alerts: any[];
}

const CoordinatorIntelligenceWidget: React.FC<{ eventId: number }> = ({ eventId }) => {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/intelligence/coordinator/overview/${eventId}`);
        setData(res.data);
        setOffline(false);
      } catch (err) {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) {
      fetchIntel();
    }
  }, [eventId]);

  if (loading) {
    return <AIProcessingIndicator message="Analyzing selection scoring anomalies and logs..." />;
  }

  if (offline) {
    return <AIUnavailableState />;
  }

  const hasAlerts = (data?.anomalies.length || 0) > 0 || (data?.admin_alerts.length || 0) > 0;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{
        fontSize: '1.1rem',
        marginBottom: '1rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Sparkles size={18} color="var(--color-primary)" />
        Coordinator AI Intelligence Center
      </h3>
      
      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Alerts & Anomalies Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Scoring & Script Outliers</h4>
          {hasAlerts ? (
            <div>
              {data?.anomalies.map((a, i) => (
                <AIWarningCard key={`score-anom-${i}`} message={a.description} severity={a.severity} />
              ))}
              {data?.admin_alerts.map((a, i) => (
                <AIWarningCard key={`admin-anom-${i}`} message={a.description} severity={a.severity} />
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
              ✓ No judge deviation, evaluation variance, or scripting anomalies flagged.
            </div>
          )}
        </div>

        {/* Workflow Reminders Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Submission Upload Checklists</h4>
          {data?.reminders && data.reminders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.reminders.map((rem, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{rem.team_name}</strong>
                  <span style={{
                    color: rem.status === 'WARNING' ? '#f97316' : '#94a3b8',
                    fontSize: '0.75rem'
                  }}>{rem.reason}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
              ✓ All finalized teams have active GitHub and PPT proposal links.
            </div>
          )}
        </div>
      </div>

      {/* AI Summary explanation card */}
      {data?.summary && (
        <AIInsightCard title="SIH Selection Risk Insights" confidence="HIGH" confidenceScore={1.0 - (data.risk_index / 100.0)}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {data.summary}
          </p>
        </AIInsightCard>
      )}
    </div>
  );
};

const styles = {
  eventControlCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.75rem',
    borderLeft: '4px solid var(--color-primary)',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1.5rem',
    justifyContent: 'center',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  metricTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  },
  metricValue: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: 'white',
    lineHeight: 1,
  }
};

export default Dashboard;
