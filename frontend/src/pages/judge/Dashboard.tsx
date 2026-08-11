import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Award, HelpCircle } from 'lucide-react';
import api from '../../api';

interface JudgeTeam {
  id: number;
  name: string;
  leader_name: string;
  department: string;
  status: string;
  evaluated: boolean;
  total_score: number;
}

const JudgeDashboard: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState<JudgeTeam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchJudgeTeams = async () => {
    try {
      const res = await api.get('/judge/teams');
      setTeams(res.data);
    } catch (err) {
      showToast('Error loading evaluation assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgeTeams();
  }, []);

  const handleEvaluateClick = (teamId: number) => {
    navigate(`/judge/evaluation/${teamId}`);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Fetching team assignments...</div>;
  }

  // Count metrics
  const pendingCount = teams.filter(t => !t.evaluated).length;
  const completedCount = teams.filter(t => t.evaluated).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Metrics Row */}
      <div className="grid-3" style={{ maxWidth: '600px' }}>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Award size={24} color="var(--color-primary)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Teams</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{teams.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <HelpCircle size={24} color="var(--color-warning)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Evaluation</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pendingCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Award size={24} color="var(--color-success)" />
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Graded Completed</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Teams list */}
      <div className="table-container">
        {teams.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            No finalized teams are currently available for evaluation.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Leader Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Evaluation Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>T-{t.id}</td>
                  <td style={{ fontWeight: 600, color: 'white' }}>{t.name}</td>
                  <td>{t.leader_name}</td>
                  <td>{t.department}</td>
                  <td>
                    <span className="badge badge-info">{t.status.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <span className={`badge ${t.evaluated ? 'badge-success' : 'badge-warning'}`}>
                      {t.evaluated ? 'Graded' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{t.evaluated ? t.total_score : '--'}</td>
                  <td>
                    <button 
                      className={`btn ${t.evaluated ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => handleEvaluateClick(t.id)}
                    >
                      {t.evaluated ? 'View Grades' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default JudgeDashboard;
