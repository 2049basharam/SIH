import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit3 } from 'lucide-react';
import api from '../../api';
import type { ProblemStatement } from '../../types';

const CoordinatorProblems: React.FC = () => {
  const { showToast } = useToast();

  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Create / Edit Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Form fields
  const [problemId, setProblemId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [theme, setTheme] = useState<string>('');
  const [category, setCategory] = useState<string>('AI/ML');
  const [description, setDescription] = useState<string>('');
  const [expectedSolution, setExpectedSolution] = useState<string>('');
  const [technologyArea, setTechnologyArea] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<boolean>(true);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/student/problems?search=${search}`);
      setProblems(res.data);
    } catch (err) {
      showToast('Error loading problem statements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleOpenCreateModal = () => {
    setEditId(null);
    setProblemId('');
    setTitle('');
    setOrganization('');
    setTheme('');
    setCategory('AI/ML');
    setDescription('');
    setExpectedSolution('');
    setTechnologyArea('');
    setActiveStatus(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: ProblemStatement) => {
    setEditId(p.id);
    setProblemId(p.problem_id);
    setTitle(p.title);
    setOrganization(p.organization);
    setTheme(p.theme);
    setCategory(p.category);
    setDescription(p.description);
    setExpectedSolution(p.expected_solution || '');
    setTechnologyArea(p.technology_area || '');
    setActiveStatus(p.active_status);
    setShowModal(true);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      problem_id: problemId.trim(),
      title: title.trim(),
      organization: organization.trim(),
      theme: theme.trim(),
      category,
      description: description.trim(),
      expected_solution: expectedSolution.trim() || undefined,
      technology_area: technologyArea.trim() || undefined,
      active_status: activeStatus
    };

    try {
      if (editId) {
        // Edit
        await api.put(`/coordinator/problems/${editId}`, payload);
        showToast('Problem statement updated successfully!', 'success');
      } else {
        // Create
        await api.post('/coordinator/problems', payload);
        showToast('Problem statement created successfully!', 'success');
      }
      setShowModal(false);
      fetchProblems();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to save problem statement';
      showToast(errMsg, 'error');
    }
  };

  const toggleActive = async (p: ProblemStatement) => {
    try {
      await api.put(`/coordinator/problems/${p.id}`, {
        problem_id: p.problem_id,
        title: p.title,
        organization: p.organization,
        theme: p.theme,
        category: p.category,
        description: p.description,
        expected_solution: p.expected_solution || undefined,
        technology_area: p.technology_area || undefined,
        active_status: !p.active_status
      });
      showToast(`Status updated for ${p.problem_id}`, 'success');
      fetchProblems();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const categories = [
    "AI/ML", "Agriculture", "Healthcare", "Education", "Smart Cities",
    "Cybersecurity", "FinTech", "Environment", "Transportation",
    "IoT", "Robotics", "Blockchain", "Social Impact", "Other"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Actions header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search problem statements..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={fetchProblems}>Search</button>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Add Problem Statement
        </button>
      </div>

      {/* Problems List */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
        ) : problems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No problems found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Organization</th>
                <th>Theme</th>
                <th>Category</th>
                <th>Tech Area</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.problem_id}</td>
                  <td style={{ color: 'white', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </td>
                  <td>{p.organization}</td>
                  <td>{p.theme}</td>
                  <td>{p.category}</td>
                  <td>{p.technology_area || 'N/A'}</td>
                  <td>
                    <span 
                      className={`badge ${p.active_status ? 'badge-success' : 'badge-danger'}`} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleActive(p)}
                    >
                      {p.active_status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => handleOpenEditModal(p)}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              {editId ? 'Edit Problem Statement' : 'New Problem Statement'}
            </h3>

            <form onSubmit={handleSaveProblem}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Problem ID *</label>
                  <input type="text" className="form-control" placeholder="e.g. SIH-1601" value={problemId} onChange={(e) => setProblemId(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Organization *</label>
                  <input type="text" className="form-control" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Theme *</label>
                  <input type="text" className="form-control" value={theme} onChange={(e) => setTheme(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Expected Solution</label>
                <textarea className="form-control" rows={2} value={expectedSolution} onChange={(e) => setExpectedSolution(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Technology Area</label>
                <input type="text" className="form-control" placeholder="e.g. IoT, NLP, Blockchain" value={technologyArea} onChange={(e) => setTechnologyArea(e.target.value)} />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={activeStatus} onChange={(e) => setActiveStatus(e.target.checked)} style={{ scale: '1.2' }} />
                  <span>Problem Statement Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinatorProblems;
