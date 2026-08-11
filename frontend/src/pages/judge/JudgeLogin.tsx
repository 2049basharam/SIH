import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const JudgeLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const role = await login(email, password);
      if (role !== 'judge') {
        showToast('Access denied. This login portal is for Judges only.', 'error');
        logout();
        setLoading(false);
        return;
      }
      showToast('Welcome to the Judge Evaluation Console!', 'success');
      navigate('/judge/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Invalid email or password';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <img src="/sih-logo.png" alt="Smart India Hackathon Logo" style={styles.logoImg} />
          <h2 style={styles.title}>Judge Login</h2>
          <p style={styles.subtitle}>Sign in to evaluate solutions and record scores</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Judge Email</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="e.g. judge@sih.edu"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.portalLinks}>
          <p style={styles.switchText}>Access other portals:</p>
          <div style={styles.linksGrid}>
            <Link to="/student/login" style={styles.portalLink}>Student</Link>
            <Link to="/coordinator/login" style={styles.portalLink}>Coordinator</Link>
            <Link to="/spoc/login" style={styles.portalLink}>SPOC</Link>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Judges are invited by the College SPOC. Use the invitation link sent to your email to activate.
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
    background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
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
  logoImg: {
    height: '48px',
    objectFit: 'contain' as const,
    marginBottom: '0.75rem',
    filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.45))',
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
    color: '#f97316',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    background: 'rgba(249, 115, 22, 0.1)',
    transition: 'background 0.2s',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
  },
  footerText: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    lineHeight: '1.4'
  }
};

export default JudgeLogin;
