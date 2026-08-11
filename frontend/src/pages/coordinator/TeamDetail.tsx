import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Unlock, Award, FileText, ExternalLink, Activity } from 'lucide-react';
import api from '../../api';
import type { Team } from '../../types';

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Unlock Modal/Form
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>('');

  const fetchTeamDetail = async () => {
    try {
      const res = await api.get(`/coordinator/teams/${id}`);
      setTeam(res.data);
    } catch (err) {
      showToast('Error loading team details', 'error');
    }
  };

  const fetchLogsAndEvals = async () => {
    try {
      const logsRes = await api.get('/coordinator/audit-logs');
      // filter logs for this team
      const teamLogs = logsRes.data.filter((l: any) => l.entity === 'Team' && l.entity_id === parseInt(id || ''));
      setAuditLogs(teamLogs);
      
      // Fetch evaluations
      await api.get('/coordinator/shortlisting');
    } catch (err) {
      console.error('Error fetching logs or evals');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTeamDetail();
      await fetchLogsAndEvals();
      setLoading(false);
    };
    init();
  }, [id]);

  const handleUnlockTeam = async () => {
    if (!unlockReason.trim()) {
      showToast('A reason is required to unlock a team', 'error');
      return;
    }
    try {
      const res = await api.post(`/coordinator/teams/${id}/unlock`, {
        reason: unlockReason
      });
      setTeam(res.data);
      setShowUnlockModal(false);
      setUnlockReason('');
      showToast('Team unlocked successfully. Members notified.', 'success');
      fetchLogsAndEvals(); // refresh audits
    } catch (err) {
      showToast('Failed to unlock team', 'error');
    }
  };

  const handleManualSelection = async (statusVal: string) => {
    try {
      await api.post('/coordinator/shortlisting', {
        actions: [{
          team_id: parseInt(id || ''),
          selection_status: statusVal,
          reason: 'Manual adjustment from team details page'
        }]
      });
      showToast(`Team selection status updated to: ${statusVal}`, 'success');
      fetchTeamDetail();
    } catch (err) {
      showToast('Failed to update selection status', 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading team particulars...</div>;
  }

  if (!team) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Team not found.</div>;
  }

  const isLocked = ['FINALIZED', 'SUBMITTED', 'SHORTLISTED', 'WAITLISTED'].includes(team.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/coordinator/teams" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Teams list
        </Link>
      </div>

      {/* Team Header card */}
      <div className="card" style={styles.headerCard}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TEAM ID: T-{team.id}</span>
            <span className={`badge ${team.status === 'FINALIZED' || team.status === 'SUBMITTED' ? 'badge-success' : 'badge-warning'}`}>
              {team.status.replace('_', ' ')}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{team.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Leader: {team.leader?.full_name} | {team.leader?.student_id} | {team.leader?.department}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isLocked && (
            <button className="btn btn-danger" onClick={() => setShowUnlockModal(true)}>
              <Unlock size={16} /> Unlock Team
            </button>
          )}

          <select 
            className="form-control"
            value={team.selection_status}
            onChange={(e) => handleManualSelection(e.target.value)}
            style={{ width: 'auto', background: 'rgba(255,255,255,0.06)' }}
          >
            <option value="PENDING">PENDING</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="WAITLISTED">WAITLISTED</option>
            <option value="NOT_SELECTED">NOT SELECTED</option>
          </select>
        </div>
      </div>

      <div className="grid-3">
        {/* Members column */}
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>Team Members</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {team.members?.map((m) => {
              const isMemLeader = m.student_id === team.leader_id;
              return (
                <div key={m.student_id} style={styles.memberRow}>
                  <div className="avatar" style={{ background: isMemLeader ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined }}>
                    {isMemLeader ? <Award size={18} /> : m.student.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'white' }}>{m.student.full_name}</span>
                      {isMemLeader && <span className="badge badge-warning" style={{ scale: '0.8' }}>Leader</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.student.student_id} | {m.student.department} | Year {m.student.year} | {m.student.gender === 'F' ? 'Female' : 'Male'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {m.student.email} | {m.student.phone || 'No phone'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Problems Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
          <h3>Selected Problems</h3>
          {team.selected_problems?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No problems selected by team yet.</p>
          ) : (
            team.selected_problems?.map((tp) => (
              <div key={tp.problem_statement.id} style={styles.problemMiniCard}>
                <span className="badge badge-info">{tp.problem_statement.problem_id}</span>
                <div style={{ fontWeight: 600, color: 'white', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                  {tp.problem_statement.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Category: {tp.problem_statement.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Idea Proposal Submissions */}
      {team.submissions && team.submissions.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--color-primary)" />
            Solution Proposal submissions
          </h3>
          {team.submissions.map((sub) => (
            <div key={sub.id} style={styles.submissionBlock}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Project: {sub.project_title}</span>
                <span className="badge badge-success">v{sub.version}</span>
              </div>

              <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={styles.subHeading}>Problem Understanding</h4>
                  <p style={styles.subText}>{sub.problem_understanding}</p>
                </div>
                <div>
                  <h4 style={styles.subHeading}>Proposed Solution</h4>
                  <p style={styles.subText}>{sub.proposed_solution}</p>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={styles.subHeading}>Innovation</h4>
                  <p style={styles.subText}>{sub.innovation}</p>
                </div>
                <div>
                  <h4 style={styles.subHeading}>Technical Approach</h4>
                  <p style={styles.subText}>{sub.technical_approach}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={styles.subHeading}>Technology Stack</h4>
                <p style={styles.subText}>{sub.technology_stack}</p>
              </div>

              {/* Links */}
              <div style={styles.linksRow}>
                {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem' }}><FileText size={14} /> Proposal PDF <ExternalLink size={12} /></a>}
                {sub.ppt_url && <a href={sub.ppt_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem' }}>PPT Presentation <ExternalLink size={12} /></a>}
                {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem' }}>GitHub Codebase <ExternalLink size={12} /></a>}
                {sub.demo_video_url && <a href={sub.demo_video_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.5rem' }}>Demo Video <ExternalLink size={12} /></a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs and evaluations */}
      <div className="grid-2">
        {/* Audit Log tracking */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--color-secondary)" />
            Audit Action Trail
          </h3>
          <div style={styles.logList}>
            {auditLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No coordinator actions recorded for this team.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>{log.action}</span>
                    <span style={{ color: '#6b7280' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.reason && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Reason: "{log.reason}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Judging & Scores */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-success)" />
            Evaluation Details
          </h3>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weighted Average Score</span>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{team.average_score}</div>
          </div>
        </div>
      </div>

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Unlock Team: {team.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Unlocking will set the status back to `ADMIN_UNLOCKED`. The team leader will be required to review and finalize details again. A reason is mandatory.
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Unlock *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="e.g. Incorrect phone number entered for member 3" 
                value={unlockReason} 
                onChange={(e) => setUnlockReason(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setShowUnlockModal(false); setUnlockReason(''); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleUnlockTeam}>
                Unlock Team
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  headerCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2rem',
    borderLeft: '4px solid var(--color-primary)',
    flexWrap: 'wrap' as const,
    gap: '1.5rem',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    padding: '1rem',
  },
  problemMiniCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
  },
  submissionBlock: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '1.5rem',
  },
  subHeading: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
    letterSpacing: '0.02em',
  },
  subText: {
    fontSize: '0.95rem',
    color: '#d1d5db',
  },
  linksRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.25rem',
    flexWrap: 'wrap' as const,
  },
  logList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  logItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '6px',
    padding: '0.75rem',
  }
};

export default TeamDetail;
