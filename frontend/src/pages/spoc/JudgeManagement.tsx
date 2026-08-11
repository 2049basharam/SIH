import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { 
  UserPlus, Copy, Check 
} from 'lucide-react';
import api from '../../api';

interface Judge {
  id: number;
  profile_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string;
  designation: string;
  expertise: string | null;
  status: 'INVITED' | 'ACTIVE' | 'DISABLED' | 'SUSPENDED';
  created_at: string;
  invitation_token: string | null;
}

const JudgeManagement: React.FC = () => {
  const { showToast } = useToast();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [expertise, setExpertise] = useState('');
  const [creating, setCreating] = useState(false);

  // Generated Link state
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchJudges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spoc/judges');
      setJudges(res.data);
    } catch (err) {
      showToast('Failed to retrieve judges panel', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !organization.trim() || !designation.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/spoc/judges', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        organization: organization.trim(),
        designation: designation.trim(),
        expertise: expertise.trim() || undefined
      });

      const invitationToken = res.data.token;
      const activationUrl = `${window.location.origin}/activate-account?token=${invitationToken}`;
      setGeneratedLink(activationUrl);

      setFullName('');
      setEmail('');
      setPhone('');
      setOrganization('');
      setDesignation('');
      setExpertise('');

      await fetchJudges();
      showToast('Judge account provisioned successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create judge account';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      await api.patch(`/spoc/users/${userId}/status`, { status: newStatus });
      showToast(`Account status updated to ${newStatus}`, 'success');
      fetchJudges();
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
      fetchJudges();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Judges Evaluation Panel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Invite external domain experts and industry leaders to evaluate internal selections.
          </p>
        </div>
        <button onClick={() => { setGeneratedLink(''); setShowCreateModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={16} />
          Invite Judge
        </button>
      </div>

      {generatedLink && (
        <div className="card" style={styles.tokenBanner}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <h4 style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Active Judge Invitation Generated</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Share this activation link with the judge to complete setup:
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Retrieving judges registry...</div>
      ) : judges.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No judges registered yet. Click Invite Judge to get started.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Judge Name</th>
                <th>Affiliation</th>
                <th>Domain Expertise</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {judges.map((j) => (
                <tr key={j.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{j.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.email}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-primary)' }}>{j.organization}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.designation}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {j.expertise || 'General Tech'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      j.status === 'ACTIVE' ? 'badge-success' : 
                      j.status === 'INVITED' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {j.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {j.status === 'INVITED' && (
                        <button 
                          onClick={() => handleResetInvitation(j.id)}
                          className="btn btn-secondary" 
                          style={styles.actionBtn}
                        >
                          Reissue Link
                        </button>
                      )}
                      {j.status === 'ACTIVE' ? (
                        <button 
                          onClick={() => handleStatusUpdate(j.id, 'DISABLED')}
                          className="btn btn-danger" 
                          style={styles.actionBtn}
                        >
                          Disable
                        </button>
                      ) : j.status === 'DISABLED' || j.status === 'SUSPENDED' ? (
                        <button 
                          onClick={() => handleStatusUpdate(j.id, 'ACTIVE')}
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

      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Invite External Judge</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Dr. Anand Shekar" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email ID *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. anand@industry.com" 
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
                  placeholder="e.g. 9123456780" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organization *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Microsoft / IIT Madras" 
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Principal Architect / Professor" 
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Domain Expertise (optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Machine Learning, Cloud Systems, IoT" 
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Sending Invitation...' : 'Issue Invitation'}
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

export default JudgeManagement;
