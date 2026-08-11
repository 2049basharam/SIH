import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';
import api from '../api';

interface InvitationDetails {
  email: string;
  role: string;
  full_name: string;
  expires_at: string;
}

const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing. Please check your link.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auth/invitation/${token}`);
        setDetails(res.data);
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'This invitation link is invalid or has expired.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !details) return;

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setActivating(true);
    try {
      await api.post(`/auth/invitation/${token}/activate`, {
        password: password
      });
      showToast('Account activated successfully! You can now log in.', 'success');
      navigate('/student/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Activation failed';
      showToast(msg, 'error');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <ShieldCheck size={36} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>Activate Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Set a secure password to activate your SIH college event account.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Verifying invitation details...
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <AlertTriangle size={32} color="var(--color-danger)" />
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '1rem' }}>Verification Failed</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
              {error}
            </p>
            <button onClick={() => navigate('/student/login')} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }}>
              Return to Login
            </button>
          </div>
        ) : details ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.detailsCard}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>INVITATION FOR:</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '1rem' }}>
                {details.full_name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{details.email}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                  Role: {details.role}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Set Password *</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="At least 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} style={styles.inputIcon} />
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Re-enter password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={activating}
            >
              {activating ? 'Activating Account...' : 'Activate & Continue'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    background: 'rgba(249, 115, 22, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '1rem 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  detailsCard: {
    background: '#f8fafc',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    borderRadius: '8px',
    padding: '1.25rem',
    marginBottom: '0.5rem',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: '#94a3b8',
  },
  input: {
    paddingLeft: '40px',
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginTop: '0.5rem',
  }
};

export default ActivateAccount;
