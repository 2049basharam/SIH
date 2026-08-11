import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, CheckCircle2, AlertCircle, Sparkles, Cpu } from 'lucide-react';
import api from '../../api';
import type { ProblemStatement, Team, Event } from '../../types';
import { AIInsightCard, AIProcessingIndicator, AIUnavailableState } from '../../components/intelligence/AIComponents';

const Problems: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // AI Matching States
  const [ideaQuery, setIdeaQuery] = useState('');
  const [recs, setRecs] = useState<any>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  
  // AI Explainer States
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [explainingLoading, setExplainingLoading] = useState(false);
  const [compatData, setCompatData] = useState<any>(null);
  
  const handleMatchProblems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaQuery.trim() || !event) return;
    try {
      setRecsLoading(true);
      const res = await api.post('/intelligence/problems/recommend', {
        idea: ideaQuery,
        event_id: event.id
      });
      setRecs(res.data);
      showToast('AI Recommendations generated!', 'success');
    } catch (err) {
      showToast('AI recommendation engine temporarily offline.', 'info');
    } finally {
      setRecsLoading(false);
    }
  };

  const handleExplainProblem = async (problemId: number) => {
    if (explainingId === problemId) {
      setExplainingId(null);
      setExplanationData(null);
      setCompatData(null);
      return;
    }
    try {
      setExplainingId(problemId);
      setExplainingLoading(true);
      
      const explainRes = await api.get(`/intelligence/problems/explain/${problemId}`);
      setExplanationData(explainRes.data);
      
      if (team) {
        try {
          const compatRes = await api.get(`/intelligence/problems/compatibility/${team.id}/${problemId}`);
          setCompatData(compatRes.data);
        } catch (err) {
          setCompatData(null);
        }
      }
    } catch (err) {
      showToast('AI Explainer temporarily offline.', 'info');
    } finally {
      setExplainingLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await api.get(`/student/problems?search=${searchQuery}&category=${categoryFilter}`);
      setProblems(res.data);
    } catch (err) {
      showToast('Error loading problem statements', 'error');
    }
  };

  const fetchTeamAndEvent = async () => {
    try {
      const eventRes = await api.get('/student/event');
      setEvent(eventRes.data);
      
      try {
        const teamRes = await api.get('/student/team');
        setTeam(teamRes.data);
        
        // Populate current selections
        const currentSelections = teamRes.data.selected_problems?.map((p: any) => p.problem_statement.id) || [];
        setSelectedIds(currentSelections);
      } catch (teamErr) {
        setTeam(null);
      }
    } catch (err) {
      console.error('Error fetching event data');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTeamAndEvent();
      await fetchProblems();
      setLoading(false);
    };
    init();
  }, [categoryFilter]); // Refetch on category filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProblems();
  };

  const handleToggleSelectProblem = async (problemId: number) => {
    if (!team) return;
    if (team.leader_id !== user?.profile?.id) {
      showToast('Only the team leader can select problem statements', 'error');
      return;
    }
    if (team.status === 'DRAFT') {
      showToast('You must finalize your team first before selecting problems', 'error');
      return;
    }
    if (!event) return;

    let updatedSelection = [...selectedIds];
    const index = updatedSelection.indexOf(problemId);
    
    if (index > -1) {
      // Remove
      updatedSelection.splice(index, 1);
    } else {
      // Add
      if (updatedSelection.length >= event.settings!.problem_statements_limit) {
        showToast(`You can select a maximum of ${event.settings!.problem_statements_limit} problem statements`, 'error');
        return;
      }
      updatedSelection.push(problemId);
    }

    try {
      const res = await api.post('/student/team/problems', updatedSelection);
      setTeam(res.data);
      setSelectedIds(updatedSelection);
      showToast('Problem statements selection updated successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update problem selection';
      showToast(errMsg, 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading problem statements...</div>;
  }

  const isLeader = team && team.leader_id === user?.profile?.id;
  const isTeamFinalized = team && team.status !== 'DRAFT';

  // Available Categories
  const categories = [
    "AI/ML", "Agriculture", "Healthcare", "Education", "Smart Cities",
    "Cybersecurity", "FinTech", "Environment", "Transportation",
    "IoT", "Robotics", "Blockchain", "Social Impact", "Other"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner warnings */}
      {!isTeamFinalized && (
        <div className="card" style={styles.warningCard}>
          <AlertCircle size={22} color="var(--color-warning)" />
          <div>
            <h4 style={{ color: 'white', marginBottom: '0.15rem' }}>Team Finalization Required</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              You can search and browse problem statements now, but your team must be **Finalized and Locked** before you can select problems.
            </p>
          </div>
        </div>
      )}

      {/* Selections Panel */}
      {isTeamFinalized && (
        <div className="card" style={styles.selectedPanel}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="var(--color-primary)" />
            Your Selected Problems ({selectedIds.length} / {event?.settings?.problem_statements_limit})
          </h3>
          <div style={styles.selectedGrid}>
            {selectedIds.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No problems selected yet. Select from the registry below.</p>
            ) : (
              problems.filter(p => selectedIds.includes(p.id)).map(p => (
                <div key={p.id} style={styles.selectedItem}>
                  <div style={{ fontWeight: 600, color: 'white' }}>{p.problem_id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI Recommendations Matcher */}
      {isTeamFinalized && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            AI Problem Statement Matcher
          </h3>
          <form onSubmit={handleMatchProblems} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Describe your project solution idea or interest domain in 1-2 sentences:</label>
              <textarea 
                className="form-control"
                rows={2}
                placeholder="e.g. We want to build an AI vision system to detect crop diseases from mobile camera leaf images..."
                value={ideaQuery}
                onChange={(e) => setIdeaQuery(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={recsLoading}>
              {recsLoading ? 'Analyzing & Matching...' : 'Match Problem Statements'}
            </button>
          </form>

          {recsLoading && <AIProcessingIndicator message="Comparing your idea against synchronized official SIH problem statement embeddings..." />}

          {recs && !recsLoading && (
            <AIInsightCard title="AI Recommendations Analysis" confidence={recs.confidence_level} confidenceScore={recs.confidence}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {recs.analysis}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recs.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="badge badge-info" style={{ margin: 0 }}>{rec.problem_id}</span>
                      <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>{Math.round(rec.match_score * 100)}% Match</strong>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>{rec.explanation}</p>
                    {rec.evidence && rec.evidence.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ✓ Evidence: {rec.evidence.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AIInsightCard>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
          <div style={styles.searchField}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Title, ID, Description..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ border: 'none', background: 'transparent' }}
            />
          </div>
          
          <div style={styles.filterField}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              className="form-control" 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: 'auto', paddingRight: '2rem' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {/* Problems Registry */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {problems.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No problem statements match your criteria.</p>
        ) : (
          problems.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <div key={p.id} className="card" style={styles.problemCard(isSelected)}>
                <div style={styles.probHeader}>
                  <div>
                    <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{p.problem_id}</span>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Org: <strong style={{ color: '#ffffff' }}>{p.organization}</strong> | Theme: {p.theme} | Category: <span style={{ color: 'var(--color-secondary)' }}>{p.category}</span>
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => handleExplainProblem(p.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={14} />
                      {explainingId === p.id ? 'Hide Explain' : 'AI Explainer'}
                    </button>

                    {isTeamFinalized && isLeader && (
                      <button 
                        className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleSelectProblem(p.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        {isSelected ? 'Deselect' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                  <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{p.description}</p>
                </div>

                {(p.technology_area || p.expected_solution) && (
                  <div style={styles.probFooter}>
                    {p.technology_area && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Tech Stack: <strong style={{ color: 'white' }}>{p.technology_area}</strong>
                      </span>
                    )}
                  </div>
                )}

                {explainingId === p.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                    {explainingLoading ? (
                      <AIProcessingIndicator message="Extracting target audience, architecture suggestions, and technical skills..." />
                    ) : explanationData ? (
                      <AIInsightCard title="AI-Generated Explanation & Stack" confidence={explanationData.confidence_level} confidenceScore={explanationData.confidence}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: 'white' }}>Problem Interpretation:</strong>
                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{explanationData.summary}</p>
                          </div>

                          <div className="grid-2" style={{ gap: '1rem' }}>
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'white' }}>Key Constraints:</strong>
                              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', marginTop: '4px' }}>
                                {explanationData.constraints?.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                              </ul>
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'white' }}>Recommended Skills:</strong>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                {explanationData.skills?.map((s: string, idx: number) => (
                                  <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Difficulty Chart */}
                          {explanationData.difficulty_analysis && (
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Cpu size={14} /> Difficulty Estimations (Not official SIH rating)
                              </strong>
                              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem' }}>Technical Complexity: <strong>{explanationData.difficulty_analysis.technical_complexity}/10</strong></div>
                                <div style={{ fontSize: '0.75rem' }}>Data Complexity: <strong>{explanationData.difficulty_analysis.data_complexity}/10</strong></div>
                                <div style={{ fontSize: '0.75rem' }}>Implementation: <strong>{explanationData.difficulty_analysis.implementation_difficulty}/10</strong></div>
                                <div style={{ fontSize: '0.75rem' }}>Hardware Required: <strong>{explanationData.difficulty_analysis.hardware_requirement}/10</strong></div>
                              </div>
                            </div>
                          )}

                          {/* Team Compatibility */}
                          {compatData && (
                            <div style={{
                              borderLeft: '4px solid var(--color-success)',
                              backgroundColor: 'rgba(34, 197, 94, 0.03)',
                              padding: '0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.825rem'
                            }}>
                              <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: '4px' }}>
                                Team Compatibility: {compatData.match_percentage}%
                              </div>
                              <p style={{ color: 'var(--text-secondary)' }}>{compatData.advisory_summary}</p>
                              {compatData.missing_skills?.length > 0 && (
                                <div style={{ color: '#f97316', fontSize: '0.75rem', marginTop: '4px' }}>
                                  ⚠ Missing: {compatData.missing_skills.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </AIInsightCard>
                    ) : (
                      <AIUnavailableState />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  warningCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    borderLeft: '4px solid var(--color-warning)',
    background: 'rgba(245, 158, 11, 0.05)',
  },
  selectedPanel: {
    borderLeft: '4px solid var(--color-primary)',
    background: 'rgba(99, 102, 241, 0.03)',
  },
  selectedGrid: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    marginTop: '0.5rem',
  },
  selectedItem: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    minWidth: '150px',
    maxWidth: '220px',
  },
  searchBar: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  searchField: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.25rem 0.75rem',
    minWidth: '200px',
  },
  filterField: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.25rem 0.5rem',
  },
  problemCard: (selected: boolean) => ({
    borderLeft: selected ? '4px solid var(--color-success)' : '1px solid rgba(255, 255, 255, 0.05)',
    background: selected ? 'rgba(16, 185, 129, 0.02)' : undefined,
  }),
  probHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  probFooter: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
  }
};

export default Problems;
