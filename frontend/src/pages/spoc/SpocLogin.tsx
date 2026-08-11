import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

const SpocLogin: React.FC = () => {
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const role = await login(email.trim(), password);
      if (role !== 'spoc') {
        showToast('Access denied. You do not have SPOC privileges.', 'error');
        logout();
        setLoading(false);
        return;
      }

      showToast('Welcome, College SPOC!', 'success');
      navigate('/spoc/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Incorrect email or password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <ShieldCheck size={36} color="#f97316" />
          </div>
          <h2 style={styles.title}>College SPOC Login</h2>
          <p style={styles.subtitle}>
            Authoritative SIH administration control tower
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">SPOC Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input 
                type="email" 
                className="form-control" 
                placeholder="e.g. spoc@sih.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={styles.portalLinks}>
          <p style={styles.switchText}>Access other portals:</p>
          <div style={styles.linksGrid}>
            <Link to="/student/login" style={styles.portalLink}>Student</Link>
            <Link to="/coordinator/login" style={styles.portalLink}>Coordinator</Link>
            <Link to="/judge/login" style={styles.portalLink}>Judge</Link>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            This is a secure college administrative endpoint. Public registration is disabled.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '2rem',
    position: 'relative' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 60%)',
    pointerEvents: 'none' as const,
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '1.75rem 2.25rem',
    border: 'none',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: 'rgba(249, 115, 22, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.75rem',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem',
    color: 'var(--text-primary)',
    fontWeight: '800'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
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
    marginTop: '0.25rem',
  },
  portalLinks: {
    marginTop: '1.25rem',
    textAlign: 'center' as const,
  },
  switchText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.35rem'
  },
  linksGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  portalLink: {
    fontSize: '0.8rem',
    color: '#22c55e',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    background: 'rgba(34, 197, 94, 0.1)',
    transition: 'background 0.2s',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
  },
  footerText: {
    color: '#ef4444',
    fontSize: '0.8rem',
    lineHeight: '1.4',
    fontWeight: '600'
  }
};

export default SpocLogin;
