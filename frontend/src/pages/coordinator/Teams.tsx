import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../../api';

interface SimpleTeam {
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

const TeamsList: React.FC = () => {
  const { showToast } = useToast();

  const [teams, setTeams] = useState<SimpleTeam[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectionFilter, setSelectionFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coordinator/teams', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          selection_status: selectionFilter || undefined,
          department: deptFilter || undefined,
          page,
          limit
        }
      });
      setTeams(res.data.teams);
      setTotal(res.data.total);
    } catch (err) {
      showToast('Error loading teams list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [page, statusFilter, selectionFilter, deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // reset to page 1 on new search
    fetchTeams();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-warning">Draft</span>;
      case 'ADMIN_UNLOCKED': return <span className="badge badge-info">Unlocked</span>;
      case 'FINALIZED': return <span className="badge badge-success">Finalized</span>;
      case 'SUBMITTED': return <span className="badge badge-success">Submitted</span>;
      case 'SHORTLISTED': return <span className="badge badge-success">Shortlisted</span>;
      case 'WAITLISTED': return <span className="badge badge-warning">Waitlisted</span>;
      case 'NOT_SELECTED': return <span className="badge badge-danger">Not Selected</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const departments = [
    "Computer Science", "Information Technology", "Electronics", "Electrical", "Mechanical"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Search & Filters */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
          <div style={styles.searchField}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Team, Leader, Roll No, Email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ border: 'none', background: 'transparent' }}
            />
          </div>

          <div style={styles.filtersGroup}>
            <div style={styles.filterField}>
              <Filter size={14} color="var(--text-muted)" />
              <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={styles.select}>
                <option value="">All States</option>
                <option value="DRAFT">Draft</option>
                <option value="FINALIZED">Finalized</option>
                <option value="ADMIN_UNLOCKED">Unlocked</option>
                <option value="SUBMITTED">Submitted</option>
              </select>
            </div>

            <div style={styles.filterField}>
              <select className="form-control" value={selectionFilter} onChange={(e) => { setSelectionFilter(e.target.value); setPage(1); }} style={styles.select}>
                <option value="">All Selections</option>
                <option value="PENDING">Pending</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="WAITLISTED">Waitlisted</option>
                <option value="NOT_SELECTED">Not Selected</option>
              </select>
            </div>

            <div style={styles.filterField}>
              <select className="form-control" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} style={styles.select}>
                <option value="">All Depts</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Filter</button>
        </form>
      </div>

      {/* Teams Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading teams list...</div>
        ) : teams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No teams matching criteria found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Leader</th>
                <th>Members</th>
                <th>Females</th>
                <th>Department</th>
                <th>Selected Problems</th>
                <th>Avg Score</th>
                <th>Status</th>
                <th>Nomination</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>T-{t.id}</td>
                  <td style={{ fontWeight: 600, color: 'white' }}>{t.name}</td>
                  <td>
                    <div>{t.leader_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.leader_roll}</div>
                  </td>
                  <td>{t.members_count}</td>
                  <td style={{ color: t.female_count > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                    {t.female_count}
                  </td>
                  <td>{t.department}</td>
                  <td>
                    {t.problems.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                    ) : (
                      t.problems.map(p => (
                        <span key={p} className="badge badge-info" style={{ marginRight: '0.25rem', scale: '0.9' }}>{p}</span>
                      ))
                    )}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{t.average_score}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td>
                    <span className={`badge ${t.selection_status === 'SHORTLISTED' ? 'badge-success' : t.selection_status === 'WAITLISTED' ? 'badge-warning' : t.selection_status === 'NOT_SELECTED' ? 'badge-danger' : 'badge-info'}`}>
                      {t.selection_status}
                    </span>
                  </td>
                  <td>
                    <Link to={`/coordinator/teams/${t.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div style={styles.paginationRow}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Showing {teams.length} of {total} teams
          </span>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem' }} 
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem' }} 
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
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
    minWidth: '220px',
  },
  filtersGroup: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
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
  select: {
    border: 'none',
    background: 'transparent',
    width: 'auto',
    paddingRight: '1.5rem',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
  }
};

export default TeamsList;
