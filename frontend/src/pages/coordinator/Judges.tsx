import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { UserCheck, Plus } from 'lucide-react';
import api from '../../api';
import type { JudgeProfile } from '../../types';

const CoordinatorJudges: React.FC = () => {
  const { showToast } = useToast();

  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const fetchJudges = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coordinator/judges');
      setJudges(res.data);
    } catch (err) {
      showToast('Error loading judge list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleOpenCreateModal = () => {
    setFullName('');
    setEmail('');
    setOrganization('');
    setDesignation('');
    setPassword('password123'); // default password
    setShowModal(true);
  };

  const handleSaveJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coordinator/judges', {
        full_name: fullName.trim(),
        email: email.trim(),
        organization: organization.trim(),
        designation: designation.trim(),
        password: password
      });
      showToast('Judge account created successfully!', 'success');
      setShowModal(false);
      fetchJudges();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create judge account';
      showToast(errMsg, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserCheck size={20} color="var(--color-primary)" />
          Hackathon Evaluation Judges
        </h3>
        
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Add Judge Account
        </button>
      </div>

      {/* Judges Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading judges...</div>
        ) : judges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No judges registered. Add judge credentials to start evaluations.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Judge ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Organization</th>
                <th>Designation</th>
              </tr>
            </thead>
            <tbody>
              {judges.map((j) => (
                <tr key={j.id}>
                  <td>J-{j.id}</td>
                  <td style={{ fontWeight: 600, color: 'white' }}>{j.full_name}</td>
                  <td>{j.email}</td>
                  <td>{j.organization}</td>
                  <td>{j.designation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create Judge Account</h3>
            
            <form onSubmit={handleSaveJudge}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Organization *</label>
                <input type="text" className="form-control" placeholder="e.g. TCS Research, IIT Madras" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Designation *</label>
                <input type="text" className="form-control" placeholder="e.g. Lead Scientist, Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Sign-in Password *</label>
                <input type="text" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinatorJudges;
