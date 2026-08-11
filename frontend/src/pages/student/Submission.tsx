import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FileCode, Send, HelpCircle, AlertCircle, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import api from '../../api';
import type { Team, Event, ProblemStatement, Submission } from '../../types';
import { AIInsightCard, AIProcessingIndicator } from '../../components/intelligence/AIComponents';

const SubmissionPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Selection/Submission State
  const [activeProblem, setActiveProblem] = useState<ProblemStatement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Readiness States
  const [readinessData, setReadinessData] = useState<any>({});
  const [readinessLoading, setReadinessLoading] = useState<any>({});
  
  const handleCheckReadiness = async (subId: number) => {
    try {
      setReadinessLoading((prev: any) => ({ ...prev, [subId]: true }));
      // 1. Trigger background analyze run
      await api.post(`/intelligence/submission/${subId}/analyze`);
      
      // 2. Fetch the cached analysis (completed instantaneously in mock/rest flow)
      const res = await api.get(`/intelligence/submission/${subId}/readiness`);
      setReadinessData((prev: any) => ({ ...prev, [subId]: res.data }));
      showToast('Solution readiness check completed!', 'success');
    } catch (err) {
      showToast('AI readiness engine temporarily offline.', 'info');
    } finally {
      setReadinessLoading((prev: any) => ({ ...prev, [subId]: false }));
    }
  };

  // Form Fields
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [problemUnderstanding, setProblemUnderstanding] = useState<string>('');
  const [currentSituation, setCurrentSituation] = useState<string>('');
  const [proposedSolution, setProposedSolution] = useState<string>('');
  const [innovation, setInnovation] = useState<string>('');
  const [targetUsers, setTargetUsers] = useState<string>('');
  const [technicalApproach, setTechnicalApproach] = useState<string>('');
  const [technologyStack, setTechnologyStack] = useState<string>('');
  const [implementationPlan, setImplementationPlan] = useState<string>('');
  const [expectedImpact, setExpectedImpact] = useState<string>('');
  const [scalability, setScalability] = useState<string>('');
  const [futureScope, setFutureScope] = useState<string>('');
  
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pptUrl, setPptUrl] = useState<string>('');
  const [imagesUrl, setImagesUrl] = useState<string>('');
  const [demoVideoUrl, setDemoVideoUrl] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [prototypeUrl, setPrototypeUrl] = useState<string>('');

  const fetchData = async () => {
    try {
      const eventRes = await api.get('/student/event');
      setEvent(eventRes.data);
      
      try {
        const teamRes = await api.get('/student/team');
        setTeam(teamRes.data);
        
        const subRes = await api.get('/student/submissions');
        setSubmissions(subRes.data);
      } catch (teamErr) {
        setTeam(null);
      }
    } catch (err) {
      console.error('Error fetching submission dependencies');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenSubmissionForm = (prob: ProblemStatement) => {
    setActiveProblem(prob);
    setIsSubmitting(true);
    
    // Check if submission already exists to prefill
    const existing = submissions.find(s => s.problem_statement_id === prob.id);
    if (existing) {
      setProjectTitle(existing.project_title || '');
      setProblemUnderstanding(existing.problem_understanding || '');
      setCurrentSituation(existing.current_situation || '');
      setProposedSolution(existing.proposed_solution || '');
      setInnovation(existing.innovation || '');
      setTargetUsers(existing.target_users || '');
      setTechnicalApproach(existing.technical_approach || '');
      setTechnologyStack(existing.technology_stack || '');
      setImplementationPlan(existing.implementation_plan || '');
      setExpectedImpact(existing.expected_impact || '');
      setScalability(existing.scalability || '');
      setFutureScope(existing.future_scope || '');
      setPdfUrl(existing.pdf_url || '');
      setPptUrl(existing.ppt_url || '');
      setImagesUrl(existing.images_url || '');
      setDemoVideoUrl(existing.demo_video_url || '');
      setGithubUrl(existing.github_url || '');
      setPrototypeUrl(existing.prototype_url || '');
    } else {
      // Clear fields
      setProjectTitle('');
      setProblemUnderstanding('');
      setCurrentSituation('');
      setProposedSolution('');
      setInnovation('');
      setTargetUsers('');
      setTechnicalApproach('');
      setTechnologyStack('');
      setImplementationPlan('');
      setExpectedImpact('');
      setScalability('');
      setFutureScope('');
      setPdfUrl('');
      setPptUrl('');
      setImagesUrl('');
      setDemoVideoUrl('');
      setGithubUrl('');
      setPrototypeUrl('');
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProblem || !team) return;
    
    const payload = {
      problem_statement_id: activeProblem.id,
      project_title: projectTitle,
      problem_understanding: problemUnderstanding,
      current_situation: currentSituation,
      proposed_solution: proposedSolution,
      innovation: innovation,
      target_users: targetUsers,
      technical_approach: technicalApproach,
      technology_stack: technologyStack,
      implementation_plan: implementationPlan,
      expected_impact: expectedImpact,
      scalability: scalability,
      future_scope: futureScope,
      pdf_url: pdfUrl || undefined,
      ppt_url: pptUrl || undefined,
      images_url: imagesUrl || undefined,
      demo_video_url: demoVideoUrl || undefined,
      github_url: githubUrl || undefined,
      prototype_url: prototypeUrl || undefined,
    };

    try {
      const res = await api.post('/student/submissions', payload);
      showToast('Proposal submitted successfully!', 'success');
      
      // Update submissions list
      const updatedSubs = [...submissions];
      const idx = updatedSubs.findIndex(s => s.problem_statement_id === activeProblem.id);
      if (idx > -1) {
        updatedSubs[idx] = res.data;
      } else {
        updatedSubs.push(res.data);
      }
      setSubmissions(updatedSubs);
      setIsSubmitting(false);
      setActiveProblem(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to submit proposal';
      showToast(errMsg, 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading submission dashboard...</div>;
  }

  const isLeader = team && team.leader_id === user?.profile?.id;
  const isTeamFinalized = team && team.status !== 'DRAFT';
  const hasSelectedProblems = team && team.selected_problems && team.selected_problems.length > 0;
  
  // Deadline check
  const isDeadlinePassed = event ? new Date() > new Date(event.submission_deadline) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Deadline Info banner */}
      <div className="card" style={styles.deadlineBanner(isDeadlinePassed)}>
        <Calendar size={22} color={isDeadlinePassed ? 'var(--color-danger)' : 'var(--color-primary)'} />
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'white' }}>
            {isDeadlinePassed ? 'Submission Window Closed' : 'Submission Window Open'}
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {event ? `Idea selection submission closes on: ${new Date(event.submission_deadline).toLocaleString()}` : ''}
          </p>
        </div>
      </div>

      {!isTeamFinalized ? (
        <div className="card" style={styles.warningCard}>
          <AlertCircle size={22} color="var(--color-warning)" />
          <div>
            <h4 style={{ color: 'white', marginBottom: '0.15rem' }}>Finalize Team First</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your team must be fully finalized and locked before you can proceed to create and submit idea proposals.
            </p>
          </div>
        </div>
      ) : !hasSelectedProblems ? (
        <div className="card" style={styles.warningCard}>
          <HelpCircle size={22} color="var(--color-info)" />
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'white', marginBottom: '0.15rem' }}>Select Problem Statements</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No problem statements selected. Go to the Problems tab and choose problem statements to submit proposals.
            </p>
          </div>
        </div>
      ) : isSubmitting && activeProblem ? (
        /* Submission Proposal Form */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1rem' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{activeProblem.problem_id}</span>
              <h2 style={{ fontSize: '1.4rem' }}>Submit Proposal: {activeProblem.title}</h2>
            </div>
            <button className="btn btn-secondary" onClick={() => { setIsSubmitting(false); setActiveProblem(null); }}>
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitProposal}>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input 
                type="text" 
                className="form-control" 
                value={projectTitle} 
                onChange={(e) => setProjectTitle(e.target.value)} 
                required 
                disabled={isDeadlinePassed}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Problem Understanding *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={problemUnderstanding} 
                  onChange={(e) => setProblemUnderstanding(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Situation *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={currentSituation} 
                  onChange={(e) => setCurrentSituation(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Proposed Solution *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={proposedSolution} 
                  onChange={(e) => setProposedSolution(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Innovation / Key Differentiators *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={innovation} 
                  onChange={(e) => setInnovation(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Target Users *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={targetUsers} 
                  onChange={(e) => setTargetUsers(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Technical Approach *</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={technicalApproach} 
                  onChange={(e) => setTechnicalApproach(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Technology Stack *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={technologyStack} 
                  placeholder="e.g. React, Node.js, TensorFlow, AWS"
                  onChange={(e) => setTechnologyStack(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Implementation Plan *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={implementationPlan} 
                  onChange={(e) => setImplementationPlan(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Expected Impact *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={expectedImpact} 
                  onChange={(e) => setExpectedImpact(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Scalability *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={scalability} 
                  onChange={(e) => setScalability(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Future Scope *</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={futureScope} 
                  onChange={(e) => setFutureScope(e.target.value)} 
                  required 
                  disabled={isDeadlinePassed}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', margin: '1.5rem 0 1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
              Attachments & Links
            </h3>
            
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">PDF Proposal URL</label>
                <input type="url" className="form-control" placeholder="https://" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
              <div className="form-group">
                <label className="form-label">PPT Slides URL</label>
                <input type="url" className="form-control" placeholder="https://" value={pptUrl} onChange={(e) => setPptUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
              <div className="form-group">
                <label className="form-label">Images/UI Mockups URL</label>
                <input type="url" className="form-control" placeholder="https://" value={imagesUrl} onChange={(e) => setImagesUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Demo Video URL</label>
                <input type="url" className="form-control" placeholder="https://" value={demoVideoUrl} onChange={(e) => setDemoVideoUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub Repository URL</label>
                <input type="url" className="form-control" placeholder="https://" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
              <div className="form-group">
                <label className="form-label">Live Prototype URL</label>
                <input type="url" className="form-control" placeholder="https://" value={prototypeUrl} onChange={(e) => setPrototypeUrl(e.target.value)} disabled={isDeadlinePassed} />
              </div>
            </div>

            {!isDeadlinePassed && isLeader && (
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }}>
                <Send size={18} /> Submit Proposal / Update Version
              </button>
            )}
          </form>
        </div>
      ) : (
        /* Selected Problem statement list with submissions status */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {team.selected_problems?.map((tp) => {
            const p = tp.problem_statement;
            const sub = submissions.find(s => s.problem_statement_id === p.id);
            return (
              <div key={p.id} className="card" style={styles.proposalCard}>
                <div style={styles.proposalHeader}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{p.problem_id}</span>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Category: {p.category} | Theme: {p.theme}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {sub ? (
                      <span className="badge badge-success">
                        Submitted (v{sub.version})
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        Pending Submission
                      </span>
                    )}

                    {!isDeadlinePassed && isLeader && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleOpenSubmissionForm(p)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        {sub ? 'Edit Proposal' : 'Create Proposal'}
                      </button>
                    )}
                  </div>
                </div>

                {sub && (
                  <div style={styles.proposalDetailPreview}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, color: 'white' }}>Project: {sub.project_title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Last Updated: {new Date(sub.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                      <strong>Solution Summary:</strong> {sub.proposed_solution.slice(0, 200)}...
                    </p>

                    <div style={styles.linksRow}>
                      {sub.pdf_url && <a href={sub.pdf_url} target="_blank" rel="noreferrer" style={styles.link}><FileCode size={14} /> Proposal PDF <ExternalLink size={12} /></a>}
                      {sub.ppt_url && <a href={sub.ppt_url} target="_blank" rel="noreferrer" style={styles.link}>PPT Presentation <ExternalLink size={12} /></a>}
                      {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" style={styles.link}>GitHub <ExternalLink size={12} /></a>}
                      {sub.demo_video_url && <a href={sub.demo_video_url} target="_blank" rel="noreferrer" style={styles.link}>Demo Video <ExternalLink size={12} /></a>}
                    </div>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                      <button 
                        type="button"
                        className="btn" 
                        onClick={() => handleCheckReadiness(sub.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.8rem',
                          background: 'rgba(249, 115, 22, 0.1)',
                          border: '1px solid rgba(249, 115, 22, 0.2)',
                          color: 'var(--color-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                        disabled={readinessLoading[sub.id]}
                      >
                        <Sparkles size={12} />
                        {readinessLoading[sub.id] ? 'Analyzing Readiness...' : 'Check Solution Readiness with AI'}
                      </button>

                      {readinessLoading[sub.id] && (
                        <AIProcessingIndicator message="Analyzing proposed solution and code repository structure..." />
                      )}

                      {readinessData[sub.id] && !readinessLoading[sub.id] && (
                        <AIInsightCard 
                          title="AI Solution Readiness & Gap Analysis" 
                          confidence={readinessData[sub.id].confidence_level} 
                          confidenceScore={readinessData[sub.id].confidence}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>Readiness Score:</span>
                              <strong style={{ color: 'var(--color-success)', fontSize: '1.25rem' }}>{readinessData[sub.id].readiness_score}%</strong>
                            </div>

                            {readinessData[sub.id].metrics && (
                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.75rem' }}>Understanding: <strong>{readinessData[sub.id].metrics.problem_understanding}%</strong></span>
                                <span style={{ fontSize: '0.75rem' }}>Clarity: <strong>{readinessData[sub.id].metrics.solution_clarity}%</strong></span>
                                <span style={{ fontSize: '0.75rem' }}>Tech Detail: <strong>{readinessData[sub.id].metrics.technical_detail}%</strong></span>
                                <span style={{ fontSize: '0.75rem' }}>Innovation: <strong>{readinessData[sub.id].metrics.innovation}%</strong></span>
                              </div>
                            )}

                            {readinessData[sub.id].gaps && readinessData[sub.id].gaps.length > 0 && (
                              <div>
                                <strong style={{ fontSize: '0.8rem', color: '#f97316' }}>Identified Gaps:</strong>
                                <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginTop: '4px' }}>
                                  {readinessData[sub.id].gaps.map((gap: string, idx: number) => <li key={idx}>{gap}</li>)}
                                </ul>
                              </div>
                            )}

                            {readinessData[sub.id].repository_health && (
                              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                                <strong style={{ fontSize: '0.825rem', color: 'white' }}>GitHub Repository Health:</strong>
                                <div style={{ display: 'flex', gap: '1.5rem', margin: '4px 0', fontSize: '0.75rem' }}>
                                  <span>README: <strong>{readinessData[sub.id].repository_health.readme_score}%</strong></span>
                                  <span>Structure: <strong>{readinessData[sub.id].repository_health.structure_score}%</strong></span>
                                  <span>Testing: <strong>{readinessData[sub.id].repository_health.testing_score}%</strong></span>
                                </div>
                                <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '20px', marginTop: '4px' }}>
                                  {readinessData[sub.id].repository_health.recommendations?.map((rec: string, idx: number) => <li key={idx}>{rec}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </AIInsightCard>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  deadlineBanner: (passed: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    borderLeft: `4px solid ${passed ? 'var(--color-danger)' : 'var(--color-primary)'}`,
    background: passed ? 'rgba(239, 68, 68, 0.05)' : 'rgba(99, 102, 241, 0.05)',
    border: passed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
  }),
  warningCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    borderLeft: '4px solid var(--color-warning)',
    background: 'rgba(245, 158, 11, 0.05)',
  },
  proposalCard: {
    borderLeft: '4px solid var(--color-primary)',
  },
  proposalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  proposalDetailPreview: {
    marginTop: '1.25rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '1.25rem',
  },
  linksRow: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap' as const,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.85rem',
  }
};

export default SubmissionPage;
