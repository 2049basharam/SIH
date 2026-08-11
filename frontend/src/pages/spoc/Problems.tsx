import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Search } from 'lucide-react';
import api from '../../api';

interface Problem {
  id: number;
  problem_id: string;
  external_id: string;
  title: string;
  organization: string;
  theme: string;
  category: string;
  description: string;
  version: number;
}

const Problems: React.FC = () => {
  const { showToast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const endpoint = search.trim() ? `/problems/search?q=${encodeURIComponent(search)}` : '/problems';
      const res = await api.get(endpoint);
      setProblems(res.data);
    } catch (err) {
      showToast('Failed to load problem statements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProblems();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>SIH Problem Statements Cache</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            List of official problem statements synchronized from national repositories.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', minWidth: '300px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by ID, title, theme..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div>Searching problem statements database...</div>
      ) : problems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No problem statements found matching your query.
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1.25rem' }}>
          {problems.map((p) => (
            <div key={p.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-info" style={{ fontWeight: 700 }}>{p.problem_id}</span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Version {p.version}</span>
              </div>
              <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.3' }}>
                {p.title}
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>Ministry/Org:</strong> {p.organization} | <strong>Theme:</strong> {p.theme} | <strong>Category:</strong> {p.category}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                {p.description.substring(0, 160)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Problems;
