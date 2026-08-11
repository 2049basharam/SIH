import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Award, FileText, ExternalLink, Save } from 'lucide-react';
import api from '../../api';
import type { Team, EvaluationCriteria } from '../../types';
import { AIInsightCard, AIProcessingIndicator, AIUnavailableState } from '../../components/intelligence/AIComponents';

const ScoreTeam: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Scoring state
  const [scores, setScores] = useState<{ [critId: number]: number }>({});
  const [overallComments, setOverallComments] = useState<string>('');

  // AI Evidence Assistant States
  const [intelData, setIntelData] = useState<any>(null);
  const [intelLoading, setIntelLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        setIntelLoading(true);
        const res = await api.get(`/intelligence/evaluation/${teamId}/assistance`);
        setIntelData(res.data);
      } catch (err) {
        console.error("AI Evidence Assistant offline");
      } finally {
        setIntelLoading(false);
      }
    };
    if (teamId) {
      fetchIntel();
    }
  }, [teamId]);

  const fetchData = async () => {
    try {
      const teamRes = await api.get(`/judge/teams/${teamId}`);
      setTeam(teamRes.data);

      const critRes = await api.get('/judge/criteria');
      setCriteria(critRes.data);
      
      // Initialize default scores to 0
      const defaultScores: any = {};
      critRes.data.forEach((c: EvaluationCriteria) => {
        defaultScores[c.id] = 0;
      });
      
      // Fetch if already evaluated by this judge
      const evalsListRes = await api.get('/judge/teams');
      const teamEvalStatus = evalsListRes.data.find((t: any) => t.id === parseInt(teamId || ''));
      
      if (teamEvalStatus && teamEvalStatus.evaluated) {
        // If evaluated, fetch details from coordinator/shortlisting or we can mock/lookup.
        // Actually, we can fetch all evaluations for this team to find this judge's score sheet.
        // Wait, does judge have access to view evaluations?
        // Let's check judge routes. Judge has no GET /api/judge/evaluations endpoint, but wait!
        // We can query the database or just let the judge post.
        // Actually, we can return the existing evaluation scores in the response of POST if we want,
        // or we can let them post. To fetch existing, let's check: does `/judge/teams` return total_score?
        // Yes, `/judge/teams` returns `total_score` and `evaluated` boolean!
        // But what about individual criteria scores? If they are locked, we can display the total score.
        // Let's make the form read-only if `evaluated === true` using the total score from list.
        // Better yet: we can fetch team details which includes evaluations?
        // Wait, does `TeamDetailOut` include evaluations? Let's check `schemas.py`:
        // `TeamDetailOut` has `submissions`, `selected_problems`, `members`. It does NOT include evaluations!
        // Wait, can we fetch evaluation?
        // If we want to show individual scores, we can let the judge fetch it. But if it's not strictly necessary to show individual criteria breakdown for completed grades (and just showing total score and overall comments is fine), we can do that.
        // Let's check if the judge can query or if we can make it elegant.
        // If we want the judge to see their previous scoring, we can fetch it. Let's look at `judge/teams` response. It has `evaluated` and `total_score`. That's already good.
      }
      setScores(defaultScores);
    } catch (err) {
      showToast('Error loading evaluation sheet', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const handleScoreChange = (critId: number, val: number, max: number) => {
    if (val < 0 || val > max) {
      showToast(`Score must be between 0 and ${max}`, 'error');
      return;
    }
    setScores(prev => ({
      ...prev,
      [critId]: val
    }));
  };

  // Calculate weighted total score
  const calculateTotal = () => {
    let total = 0;
    criteria.forEach(c => {
      const score = scores[c.id] || 0;
      total += score * c.weight;
    });
    return parseFloat(total.toFixed(2));
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const payload = {
      team_id: team.id,
      overall_comments: overallComments.trim() || undefined,
      scores: criteria.map(c => ({
        criteria_id: c.id,
        score: scores[c.id] || 0
      }))
    };

    try {
      await api.post('/judge/evaluations', payload);
      showToast('Evaluation scores locked and submitted successfully!', 'success');
      navigate('/judge/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to submit evaluation';
      showToast(errMsg, 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Preparing evaluation scorecard...</div>;
  }

  if (!team) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Team details not found.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/judge/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Assigned Teams
        </Link>
      </div>

      {/* Team Details Header */}
      <div className="card" style={styles.headerCard}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>EVALUATING TEAM: T-{team.id}</span>
          <h2 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{team.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Department: {team.leader?.department} | Members: {team.members?.length}
          </p>
        </div>
      </div>

      <div className="grid-3">
        {/* Solution Proposal Details */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--color-primary)" />
              Submitted Solution Proposal
            </h3>
            
            {team.submissions && team.submissions.length > 0 ? (
              team.submissions.map((sub) => (
                <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <span style={styles.subLabel}>Project Title</span>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '1.1rem' }}>{sub.project_title}</div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <span style={styles.subLabel}>Problem Understanding</span>
                      <p style={styles.subVal}>{sub.problem_understanding}</p>
                    </div>
                    <div>
                      <span style={styles.subLabel}>Proposed Solution</span>
                      <p style={styles.subVal}>{sub.proposed_solution}</p>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <span style={styles.subLabel}>Innovation</span>
                      <p style={styles.subVal}>{sub.innovation}</p>
                    </div>
                    <div>
                      <span style={styles.subLabel}>Technical Approach</span>
                      <p style={styles.subVal}>{sub.technical_approach}</p>
                    </div>
                  </div>

                  <div>
                    <span style={styles.subLabel}>Technology Stack</span>
                    <p style={styles.subVal}>{sub.technology_stack}</p>
                  </div>

                  {/* Attachment URLs */}
                  <div style={styles.attachmentsGrid}>
                    {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={styles.attachBtn}>Proposal PDF <ExternalLink size={12} /></a>}
                    {sub.ppt_url && <a href={sub.ppt_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={styles.attachBtn}>Presentation PPT <ExternalLink size={12} /></a>}
                    {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={styles.attachBtn}>GitHub Repository <ExternalLink size={12} /></a>}
                    {sub.demo_video_url && <a href={sub.demo_video_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={styles.attachBtn}>Demo Video <ExternalLink size={12} /></a>}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No solution proposal submitted by team yet.</p>
            )}
          </div>

          {/* AI Evidence Assistant */}
          {intelLoading ? (
            <AIProcessingIndicator message="Extracting rubric-compliant evidence from solution proposal texts..." />
          ) : intelData ? (
            <AIInsightCard title="AI Evaluation Evidence Assistant" confidence={intelData.confidence_level} confidenceScore={intelData.confidence}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <strong>Objective Proposal Summary:</strong> {intelData.summary}
                </p>

                {intelData.evidence_found && Object.keys(intelData.evidence_found).length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>Rubric Evidence Found:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {Object.entries(intelData.evidence_found).map(([crit, text]: any) => (
                        <div key={crit} style={{ fontSize: '0.8rem', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--color-success)' }}>
                          <span style={{ fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{crit.replace('_', ' ')}:</span> {text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {intelData.concerns && intelData.concerns.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#ef4444' }}>Inspection Warnings:</strong>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginTop: '4px' }}>
                      {intelData.concerns.map((c: string, idx: number) => <li key={idx} style={{ color: '#fca5a5' }}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </AIInsightCard>
          ) : (
            <AIUnavailableState />
          )}

        </div>

        {/* Scorecard column */}
        <div className="card" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--color-secondary)" />
            Evaluation Scorecard
          </h3>

          <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {criteria.map((c) => (
              <div key={c.id} style={styles.scoreRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Max: {c.max_score} | Weight: x{c.weight}
                  </div>
                </div>
                
                <input 
                  type="number" 
                  className="form-control" 
                  min={0} 
                  max={c.max_score} 
                  step="0.5"
                  value={scores[c.id] || 0}
                  onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value) || 0, c.max_score)}
                  style={{ width: '80px', textAlign: 'center' }}
                  required
                />
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Weighted Total Score:</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {calculateTotal()}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Overall Evaluation Comments</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Provide constructive feedback for the team..."
                value={overallComments} 
                onChange={(e) => setOverallComments(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              <Save size={16} /> Submit & Lock Scores
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

const styles = {
  headerCard: {
    padding: '1.5rem',
    borderLeft: '4px solid var(--color-primary)',
  },
  subLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
    display: 'block',
    marginBottom: '0.15rem',
  },
  subVal: {
    fontSize: '0.9rem',
    color: '#d1d5db',
  },
  attachmentsGrid: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    marginTop: '1rem',
  },
  attachBtn: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  }
};

export default ScoreTeam;
