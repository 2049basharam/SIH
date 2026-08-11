import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

interface Team {
  id: number;
  name: string;
  leader_name: string;
  leader_roll: string;
  members_count: number;
  female_count: number;
  department: string;
  problems: string[];
  status: string;
  average_score: number;
  selection_status: string;
}

const Teams: React.FC = () => {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/coordinator/teams'); // uses college filtered coordinator endpoint
        setTeams(res.data.teams);
      } catch (err) {
        showToast('Failed to retrieve teams list', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>College Teams List</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Overview of all formed hackathon teams and their respective problem selections.
        </p>
      </div>

      {loading ? (
        <div>Retrieving teams directory...</div>
      ) : teams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No teams formed yet under your institution.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Leader Roll</th>
                <th>Leader Name</th>
                <th>Department</th>
                <th>Members</th>
                <th>Problem IDs</th>
                <th>Status</th>
                <th>Avg Score</th>
                <th>Selection Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</td>
                  <td>{t.leader_roll}</td>
                  <td>{t.leader_name}</td>
                  <td>{t.department}</td>
                  <td>{t.members_count} ({t.female_count} Female)</td>
                  <td>
                    {t.problems.map((code) => (
                      <span key={code} className="badge badge-info" style={{ marginRight: '0.2rem' }}>
                        {code}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'FINALIZED' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.average_score}</td>
                  <td>
                    <span className={`badge ${
                      t.selection_status === 'SHORTLISTED' ? 'badge-success' : 
                      t.selection_status === 'WAITLISTED' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {t.selection_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Teams;
