import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Trophy, Save } from 'lucide-react';
import api from '../../api';
import { AIInsightCard } from '../../components/intelligence/AIComponents';

interface RankItem {
  rank: number;
  team_id: number;
  name: string;
  problems: string[];
  average_score: number;
  selection_status: string;
  status: string;
  eval_count: number;
}

const Shortlisting: React.FC = () => {
  const { showToast } = useToast();

  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Track changes made in UI before saving
  const [decisions, setDecisions] = useState<{ [teamId: number]: { selection_status: string, reason: string } }>({});

  // AI Shortlisting States
  const [insights, setInsights] = useState<any>(null);
  const [intelLoading, setIntelLoading] = useState<boolean>(false);

  const fetchInsights = async (evId: number) => {
    try {
      setIntelLoading(true);
      const res = await api.get(`/intelligence/shortlisting/insights/${evId}`);
      setInsights(res.data);
    } catch (err) {
      console.error("AI Shortlisting Insights offline");
    } finally {
      setIntelLoading(false);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coordinator/shortlisting');
      setRanking(res.data.ranking);
      
      const initialDecisions: any = {};
      res.data.ranking.forEach((r: RankItem) => {
        initialDecisions[r.team_id] = {
          selection_status: r.selection_status,
          reason: 'Coordinator rank review nomination'
        };
      });
      setDecisions(initialDecisions);
    } catch (err) {
      showToast('Error fetching proposed rankings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchRanking();
      try {
        const eventRes = await api.get('/coordinator/settings');
        await fetchInsights(eventRes.data.id);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handleDecisionChange = (teamId: number, statusVal: string) => {
    setDecisions(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        selection_status: statusVal
      }
    }));
  };

  const handleSaveDecisions = async () => {
    const actions = Object.keys(decisions).map(teamId => ({
      team_id: parseInt(teamId),
      selection_status: decisions[parseInt(teamId)].selection_status,
      reason: decisions[parseInt(teamId)].reason
    }));

    try {
      await api.post('/coordinator/shortlisting', { actions });
      showToast('Shortlisting decisions saved and published successfully!', 'success');
      fetchRanking(); // reload
    } catch (err) {
      showToast('Failed to save selection status', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top action block */}
      <div className="card" style={styles.topBanner}>
        <div style={{ flex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
            <Trophy size={20} color="var(--color-primary)" />
            Internal Hackathon Leaderboard & Shortlisting
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Review teams sorted by average evaluation scores. You can modify nomination statuses manually, then click Publish.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleSaveDecisions}>
          <Save size={16} /> Publish Shortlist Decisions
        </button>
      </div>

      {/* AI Insights Card */}
      {insights && !intelLoading && (
        <AIInsightCard title="AI Shortlisting Insights" confidence="HIGH" confidenceScore={0.94}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{insights.summary}</p>
            {insights.observations && insights.observations.length > 0 && (
              <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0 }}>
                {insights.observations.map((obs: string, idx: number) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            )}
          </div>
        </AIInsightCard>
      )}

      {/* Rankings List */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Calculating score aggregates...</div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No evaluated teams found. Ensure judges have submitted scorecard evaluations.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Selected Problems</th>
                <th>Avg score (100)</th>
                <th>Evaluations</th>
                <th>State</th>
                <th>Nomination Status</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => {
                const currentDecision = decisions[r.team_id]?.selection_status || r.selection_status;
                return (
                  <tr key={r.team_id} style={styles.rowStyle(currentDecision)}>
                    <td style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>
                      #{r.rank}
                    </td>
                    <td>T-{r.team_id}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{r.name}</td>
                    <td>
                      {r.problems.map(p => (
                        <span key={p} className="badge badge-info" style={{ marginRight: '0.25rem' }}>{p}</span>
                      ))}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--color-secondary)' }}>
                      {r.average_score}
                    </td>
                    <td>{r.eval_count} judges</td>
                    <td>
                      <span className="badge badge-info">{r.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <select 
                        className="form-control"
                        value={currentDecision}
                        onChange={(e) => handleDecisionChange(r.team_id, e.target.value)}
                        style={styles.decisionSelect(currentDecision)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="SHORTLISTED">SHORTLISTED</option>
                        <option value="WAITLISTED">WAITLISTED</option>
                        <option value="NOT_SELECTED">NOT SELECTED</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

const styles = {
  topBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.75rem',
    borderLeft: '4px solid var(--color-primary)',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  rowStyle: (decision: string) => {
    if (decision === 'SHORTLISTED') {
      return { background: 'rgba(16, 185, 129, 0.03)' };
    }
    if (decision === 'WAITLISTED') {
      return { background: 'rgba(245, 158, 11, 0.02)' };
    }
    return {};
  },
  decisionSelect: (decision: string) => {
    let borderColor = 'rgba(255,255,255,0.08)';
    let color = 'white';
    if (decision === 'SHORTLISTED') {
      borderColor = 'var(--color-success)';
      color = 'var(--color-success)';
    } else if (decision === 'WAITLISTED') {
      borderColor = 'var(--color-warning)';
      color = 'var(--color-warning)';
    } else if (decision === 'NOT_SELECTED') {
      borderColor = 'var(--color-danger)';
      color = 'var(--color-danger)';
    }
    return {
      width: 'auto',
      background: 'rgba(10,15,30,0.6)',
      borderColor,
      color,
      fontWeight: 600,
      fontSize: '0.85rem',
    };
  }
};

export default Shortlisting;
