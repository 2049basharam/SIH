import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { 
  UserPlus, Copy, Check 
} from 'lucide-react';
import api from '../../api';

interface Coordinator {
  id: number;
  profile_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string | null;
  status: 'INVITED' | 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  created_at: string;
  invitation_token: string | null;
}

const CoordinatorManagement: React.FC = () => {
  const { showToast } = useToast();
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering (CSE)');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [creating, setCreating] = useState(false);
  
  // Generated Token display
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spoc/coordinators');
      setCoordinators(res.data);
    } catch (err) {
      showToast('Failed to retrieve coordinators list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !department.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/spoc/coordinators', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        department: department.trim(),
        designation: designation.trim() || undefined
      });

      const invitationToken = res.data.token;
      const activationUrl = `${window.location.origin}/activate-account?token=${invitationToken}`;
      setGeneratedLink(activationUrl);
      
      // Reset form fields
      setFullName('');
      setEmail('');
      setPhone('');
      
      // Fetch new list
      await fetchCoordinators();
      showToast('Coordinator account provisioned successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create coordinator account';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      await api.patch(`/spoc/users/${userId}/status`, { status: newStatus });
      showToast(`Account status updated to ${newStatus}`, 'success');
      fetchCoordinators();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update account status';
      showToast(msg, 'error');
    }
  };

  const handleResetInvitation = async (userId: number) => {
    try {
      const res = await api.post(`/spoc/users/${userId}/invitation`);
      const invitationToken = res.data.token;
      const activationUrl = `${window.location.origin}/activate-account?token=${invitationToken}`;
      setGeneratedLink(activationUrl);
      showToast('New invitation token issued successfully!', 'success');
      fetchCoordinators();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to reissue invitation token';
      showToast(msg, 'error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast('Invitation link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Coordinators Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Provision event administrative accounts and monitor activity logs.
          </p>
        </div>
        <button onClick={() => { setGeneratedLink(''); setShowCreateModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={16} />
          Create Coordinator
        </button>
      </div>

      {/* Generated Token Banner */}
      {generatedLink && (
        <div className="card" style={styles.tokenBanner}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <h4 style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Active Invitation Generated</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Share this activation link with the coordinator. They can use it to set a password and activate their account:
            </p>
            <div style={styles.copyContainer}>
              <input type="text" className="form-control" value={generatedLink} readOnly style={styles.copyInput} />
              <button onClick={copyToClipboard} className="btn btn-secondary" style={styles.copyBtn}>
                {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Table Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Retrieving coordinators registry...</div>
      ) : coordinators.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No coordinators registered yet. Click Create Coordinator to invite one.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coordinators.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.full_name}</div>
                    {c.designation && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.designation}</div>}
                  </td>
                  <td>{c.email}</td>
                  <td>{c.department}</td>
                  <td>
                    <span className={`badge ${
                      c.status === 'ACTIVE' ? 'badge-success' : 
                      c.status === 'INVITED' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {c.status === 'INVITED' && (
                        <button 
                          onClick={() => handleResetInvitation(c.id)}
                          className="btn btn-secondary" 
                          style={styles.actionBtn}
                        >
                          Reset Invitation
                        </button>
                      )}
                      {c.status === 'ACTIVE' ? (
                        <button 
                          onClick={() => handleStatusUpdate(c.id, 'DISABLED')}
                          className="btn btn-danger" 
                          style={styles.actionBtn}
                        >
                          Disable
                        </button>
                      ) : c.status === 'DISABLED' || c.status === 'SUSPENDED' ? (
                        <button 
                          onClick={() => handleStatusUpdate(c.id, 'ACTIVE')}
                          className="btn btn-success" 
                          style={styles.actionBtn}
                        >
                          Enable
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Coordinator</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Prof. Rajesh Kumar" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email ID *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. rajesh@college.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="e.g. 9876543210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE)</option>
                  <option value="Information Technology (IT)">Information Technology (IT)</option>
                  <option value="Electronics & Communication Engineering (ECE)">Electronics & Communication Engineering (ECE)</option>
                  <option value="Electrical & Electronics Engineering (EEE)">Electrical & Electronics Engineering (EEE)</option>
                  <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
                  <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Associate Professor" 
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  tokenBanner: {
    borderLeft: '4px solid var(--color-primary)',
    background: 'rgba(249, 115, 22, 0.03)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  copyContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  copyInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    background: '#f1f5f9',
  },
  copyBtn: {
    padding: '0 1rem',
  },
  actionBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '2.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
};

export default CoordinatorManagement;
