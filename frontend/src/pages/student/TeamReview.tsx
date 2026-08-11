import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../api';
import type { Team, Event } from '../../types';
import { AIInsightCard, AIWarningCard, AIProcessingIndicator, AIUnavailableState } from '../../components/intelligence/AIComponents';

const TeamReview: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  
  // AI Composition States
  const [intelData, setIntelData] = useState<any>(null);
  const [intelLoading, setIntelLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const teamRes = await api.get('/student/team');
        setTeam(teamRes.data);
        const eventRes = await api.get('/student/event');
        setEvent(eventRes.data);
        
        try {
          setIntelLoading(true);
          const intelRes = await api.get(`/intelligence/team/${teamRes.data.id}/composition`);
          setIntelData(intelRes.data);
        } catch (err) {
          console.error("AI composition check offline");
        } finally {
          setIntelLoading(false);
        }
      } catch (err) {
        showToast('Error loading team review details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Preparing review checklist...</div>;
  }

  if (!team || !event) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Team details not found.</div>;
  }

  // Verification calculations
  const teamSize = team.members?.length || 0;
  const targetSize = event.settings!.team_size;
  const isSizeOk = teamSize === targetSize;

  const femaleCount = team.members?.filter(m => m.student.gender === 'F').length || 0;
  const targetFemales = event.settings!.min_female_members;
  const isFemaleOk = femaleCount >= targetFemales;

  const isLeaderSelected = team.leader_id != null;
  const hasLeader = team.members?.some(m => m.student_id === team.leader_id) || false;

  const isSameCollege = team.members?.every(m => m.student.college === user?.profile?.college) ?? false;

  const isEligible = isSizeOk && isFemaleOk && isLeaderSelected && hasLeader && isSameCollege;

  const handleFinalize = async () => {
    try {
      await api.post('/student/team/finalize');
      showToast('Team locked and finalized successfully!', 'success');
      navigate('/student/team');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Finalization failed. Please verify constraints.';
      showToast(errMsg, 'error');
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/student/team" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Team
        </Link>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Final Team Review</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Please review your team composition, gender representation, and leadership role assignment below. Once finalized, these details will be locked.
        </p>

        {/* Team Details Summary */}
        <div style={styles.summaryBlock}>
          <div style={styles.summaryRow}>
            <span style={styles.label}>Team Name</span>
            <span style={styles.value}>{team.name}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.label}>Leader</span>
            <span style={styles.value}>{team.leader?.full_name} ({team.leader?.student_id})</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.label}>College</span>
            <span style={styles.value}>{team.leader?.college}</span>
          </div>
        </div>

        {/* Checklist */}
        <div style={{ margin: '2rem 0' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Eligibility Checklist</h3>
          <div style={styles.checklist}>
            <div style={styles.checkRow}>
              <span style={styles.checkDot(isSizeOk)}>✓</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>Team Size</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Requires exactly {targetSize} members. Current: {teamSize}
                </p>
              </div>
            </div>

            <div style={styles.checkRow}>
              <span style={styles.checkDot(isFemaleOk)}>✓</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>Female Membership</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Requires at least {targetFemales} female member. Current: {femaleCount}
                </p>
              </div>
            </div>

            <div style={styles.checkRow}>
              <span style={styles.checkDot(isSameCollege)}>✓</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>College Verification</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All members must study at {user?.profile?.college}
                </p>
              </div>
            </div>

            <div style={styles.checkRow}>
              <span style={styles.checkDot(isLeaderSelected && hasLeader)}>✓</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>Team Leader Role</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Requires one member designated as team leader.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Composition Analysis */}
        {intelLoading ? (
          <AIProcessingIndicator message="Analyzing team branch and skillset diversity..." />
        ) : intelData ? (
          <AIInsightCard title="AI Team Composition Analysis" confidence={intelData.confidence} confidenceScore={intelData.confidence_score}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>Technical Diversity: <strong style={{ color: 'var(--color-primary)' }}>{intelData.technical_diversity}</strong></span>
                <span>Domain Diversity: <strong style={{ color: 'var(--color-secondary)' }}>{intelData.domain_diversity}</strong></span>
                <span>Role Coverage: <strong style={{ color: 'var(--color-success)' }}>{intelData.role_coverage}</strong></span>
              </div>
              {intelData.gaps && intelData.gaps.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ color: '#f97316' }}>Recommended Enhancements:</strong>
                  <ul style={{ paddingLeft: '20px', margin: '4px 0', color: 'var(--text-secondary)' }}>
                    {intelData.gaps.map((gap: string, i: number) => <li key={i}>{gap}</li>)}
                  </ul>
                </div>
              )}
              {intelData.warnings && intelData.warnings.length > 0 && (
                <div>
                  {intelData.warnings.map((w: string, i: number) => (
                    <AIWarningCard key={i} message={w} severity="MEDIUM" />
                  ))}
                </div>
              )}
            </div>
          </AIInsightCard>
        ) : (
          <AIUnavailableState />
        )}

        {/* Agreement and Submit */}
        {isEligible ? (
          <div style={styles.actionBlock}>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)} 
                style={{ scale: '1.2' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'white' }}>
                I have carefully verified all team details. I understand that members cannot be changed after locking.
              </span>
            </label>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
              disabled={!termsAccepted}
              onClick={() => setShowConfirmModal(true)}
            >
              Finalize & Lock Team
            </button>
          </div>
        ) : (
          <div className="card" style={styles.errorBanner}>
            <AlertCircle size={20} color="var(--color-danger)" />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>Team Ineligible for Finalization</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Please return to the Team page and fix any unsatisfied checklist items (e.g. recruit more members, include female students).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <ShieldCheck size={48} color="var(--color-warning)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Lock Team Configuration?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Once finalized, your team details will be locked and cannot normally be changed. Are you sure you wish to proceed?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleFinalize}>
                Confirm Lock
              </button>
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  summaryBlock: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
  },
  label: {
    color: 'var(--text-muted)',
  },
  value: {
    fontWeight: 600,
    color: 'white',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  checkRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '0.75rem',
    borderRadius: '8px',
  },
  checkDot: (ok: boolean) => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: ok ? 'var(--color-success-bg)' : 'rgba(255, 255, 255, 0.05)',
    color: ok ? 'var(--color-success)' : 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  }),
  actionBlock: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    marginTop: '1.5rem',
  }
};

export default TeamReview;
