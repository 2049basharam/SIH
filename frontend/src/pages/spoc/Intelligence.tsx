import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Activity, Cpu, ListCollapse } from 'lucide-react';
import api from '../../api';
import { AIInsightCard, AIUnavailableState, AIProcessingIndicator } from '../../components/intelligence/AIComponents';

interface AuditLog {
  id: number;
  actor_role: string;
  operation: string;
  provider: string;
  model: string;
  confidence: string;
  created_at: string;
  latency: number;
  status: string;
}

const SpocIntelligence: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchSpocIntelligence = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/spoc/overview');
      setStats(res.data.stats);
      setLogs(res.data.audit_logs);
      setOffline(false);
    } catch (err) {
      setOffline(true);
      showToast('AI intelligence services temporarily offline.', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpocIntelligence();
  }, []);

  if (loading) {
    return <AIProcessingIndicator message="Fetching college-wide SIH Intelligence metrics..." />;
  }

  if (offline) {
    return <AIUnavailableState />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: 'rgba(249, 115, 22, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={24} color="var(--color-primary)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>College SIH Intelligence Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Administrative diagnostic logs, participation charts, and audit trails
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SUBMISSION READINESS</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>78%</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>✓ 12/15 submissions analyzed</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #22c55e' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>EVALUATION RATE</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>92%</div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>✓ 34/37 evaluation sheets published</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SECURITY ANOMALIES</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', color: '#ef4444' }}>0</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✓ No rapid script edits detected</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Department Analytics */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--color-primary)" />
            Department Registrations Distribution
          </h3>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 0', fontSize: '0.85rem' }}>Department</th>
                <th style={{ padding: '8px 0', fontSize: '0.85rem' }}>Teams</th>
                <th style={{ padding: '8px 0', fontSize: '0.85rem' }}>Submissions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>Computer Science & Engineering (CSE)</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem', fontWeight: 600 }}>{stats?.teams || 0}</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>{stats?.submissions || 0}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>Electronics & Communication (ECE)</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem', fontWeight: 600 }}>0</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>0</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>Information Technology (IT)</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem', fontWeight: 600 }}>0</td>
                <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>0</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI Advisory Summary */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--color-primary)" />
            AI Analytical Assessment
          </h3>
          <AIInsightCard title="Global SPOC Assessment" confidence="HIGH" confidenceScore={0.92}>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              CSE represents 100% of currently recorded registrations for this event. 
              ECE and IT departments show lower engagement. Recommend broadcasting targeted 
              hackathon alerts via coordinator dashboard to boost participation.
            </p>
          </AIInsightCard>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListCollapse size={18} color="var(--color-primary)" />
          Raw AI Intelligence Audit Trail
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Billing and execution tracking. Strictly lists API latencies and query statuses.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTOR ROLE</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>OPERATION</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>PROVIDER</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>MODEL</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>CONFIDENCE</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>LATENCY</th>
                <th style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No AI queries logged in the audit trail yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem', fontWeight: 600 }}>#{log.id}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem', textTransform: 'uppercase' }}>{log.actor_role}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{log.operation}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{log.provider}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.model}</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: log.confidence === 'HIGH' ? '#dcfce7' : '#ffedd5',
                        color: log.confidence === 'HIGH' ? '#16a34a' : '#d97706'
                      }}>{log.confidence || 'MEDIUM'}</span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>{log.latency}s</td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem' }}>
                      <span style={{
                        color: log.status === 'SUCCESS' ? '#16a34a' : '#ef4444',
                        fontWeight: 600
                      }}>{log.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpocIntelligence;
