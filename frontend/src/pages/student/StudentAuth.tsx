import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const collegeDepartments: { [key: string]: string[] } = {
  "Narasaraopeta Engineering College (Autonomous), Narasaraopeta": [
    "Computer Science & Engineering (CSE)",
    "CSE (Artificial Intelligence & Machine Learning - AI&ML)",
    "CSE (Data Science - DS)",
    "CSE (Cyber Security)",
    "Information Technology (IT)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ],
  "Mittapalli College of Engineering, Guntur": [
    "Computer Science & Engineering (CSE)",
    "CSE (Artificial Intelligence)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ],
  "Tirumala Engineering College, Narasaraopeta": [
    "Computer Science & Engineering (CSE)",
    "CSE (Artificial Intelligence & Machine Learning)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ],
  "Narasaraopeta Institute of Technology, Narasaraopeta": [
    "Computer Science & Engineering (CSE)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ],
  "RVR & JC College of Engineering, Guntur": [
    "Computer Science & Engineering (CSE)",
    "CSE (AI & ML)",
    "CSE (Data Science)",
    "CSE (IoT)",
    "Information Technology (IT)",
    "Chemical Engineering",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ],
  "Vasireddy Venkatadri Institute of Technology (VVIT), Guntur": [
    "Computer Science & Engineering (CSE)",
    "Information Technology (IT)",
    "CSE (Artificial Intelligence & Machine Learning)",
    "CSE (Data Science)",
    "CSE (Internet of Things)",
    "Electronics & Communication Engineering (ECE)",
    "Electrical & Electronics Engineering (EEE)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)"
  ]
};

const defaultDepartments = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication Engineering (ECE)",
  "Electrical & Electronics Engineering (EEE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Metallurgical Engineering"
];

const StudentAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register fields
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>("Computer Science & Engineering (CSE)");
  const [branch, setBranch] = useState<string>('CSE');
  const [year, setYear] = useState<number>(3);
  const [college, setCollege] = useState<string>("Narasaraopeta Engineering College (Autonomous), Narasaraopeta");

  useEffect(() => {
    if (location.pathname === '/student/register') {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [location.pathname]);

  const activeDepartments = collegeDepartments[college] || defaultDepartments;

  const handleCollegeChange = (val: string) => {
    setCollege(val);
    const deps = collegeDepartments[val] || defaultDepartments;
    if (!deps.includes(department)) {
      setDepartment(deps[0]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please enter both email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const role = await login(loginEmail, loginPassword);
      if (role !== 'student') {
        showToast('Access denied. This login portal is for Students only.', 'error');
        logout();
        setLoading(false);
        return;
      }
      showToast('Welcome to the Student Portal!', 'success');
      navigate('/student/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Invalid email or password';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !studentId || !fullName || !department || !branch || !college) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/student', {
        email: regEmail,
        password: regPassword,
        student_id: studentId,
        full_name: fullName,
        gender,
        phone: phone || undefined,
        department,
        branch,
        year,
        college
      });
      showToast('Registration successful! You can now log in.', 'success');
      setIsRegister(false);
      navigate('/student/login');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed. Please check inputs.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      <div 
        className="card" 
        style={{ 
          ...styles.card, 
          maxWidth: isRegister ? '600px' : '460px' 
        }}
      >
        <div style={{
          ...styles.slidingPane,
          transform: isRegister ? 'translateX(-50%)' : 'translateX(0)'
        }}>
          {/* ================= LOGIN SLIDE ================= */}
          <div style={{
            ...styles.formContainer,
            maxHeight: isRegister ? '0px' : '700px',
            opacity: isRegister ? 0 : 1,
            overflow: 'hidden',
            paddingTop: isRegister ? 0 : '2.5rem',
            paddingBottom: isRegister ? 0 : '2.5rem',
            transition: 'max-height 0.4s ease, opacity 0.3s ease, padding 0.4s ease',
          }}>
            <div style={styles.header}>
              <img src="/sih-logo.png" alt="Smart India Hackathon Logo" style={styles.logoImg} />
              <h2 style={styles.title}>Student Portal</h2>
              <p style={styles.subtitle}>Sign in to access your team dashboard</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. student@sih.edu"
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="••••••••"
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
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
                <Link to="/coordinator/login" style={styles.portalLink}>Coordinator</Link>
                <Link to="/judge/login" style={styles.portalLink}>Judge</Link>
                <Link to="/spoc/login" style={styles.portalLink}>SPOC</Link>
              </div>
            </div>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                New student? 
                <span 
                  onClick={() => { setIsRegister(true); navigate('/student/register'); }}
                  style={styles.toggleLink}
                >
                  {' '}Register Student Profile
                </span>
              </p>
            </div>
          </div>

          {/* ================= REGISTER SLIDE ================= */}
          <div style={{
            ...styles.formContainer,
            maxHeight: isRegister ? '1100px' : '0px',
            opacity: isRegister ? 1 : 0,
            overflow: 'hidden',
            paddingTop: isRegister ? '2.5rem' : 0,
            paddingBottom: isRegister ? '2.5rem' : 0,
            transition: 'max-height 0.4s ease, opacity 0.3s ease, padding 0.4s ease',
          }}>
            <div style={styles.header}>
              <img src="/sih-logo.png" alt="Smart India Hackathon Logo" style={styles.logoImg} />
              <h2 style={styles.title}>Register Profile</h2>
              <p style={styles.subtitle}>Create a student profile to join/form teams</p>
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={regEmail} 
                    onChange={(e) => setRegEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={regPassword} 
                    onChange={(e) => setRegPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Roll Number / Student ID *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={studentId} 
                    placeholder="e.g. 2026SIH001"
                    onChange={(e) => setStudentId(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select 
                    className="form-control" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value as any)}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select 
                    className="form-control" 
                    value={year} 
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={branch} 
                    placeholder="e.g. CSE"
                    onChange={(e) => setBranch(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
                <select 
                  className="form-control" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {activeDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">College *</label>
                <input 
                  type="text" 
                  list="college-list-auth"
                  className="form-control" 
                  placeholder="Search or type your college..."
                  value={college} 
                  onChange={(e) => handleCollegeChange(e.target.value)} 
                  required 
                />
                <datalist id="college-list-auth">
                  <option value="Narasaraopeta Engineering College (Autonomous), Narasaraopeta" />
                  <option value="Mittapalli College of Engineering, Guntur" />
                  <option value="Tirumala Engineering College, Narasaraopeta" />
                  <option value="Narasaraopeta Institute of Technology, Narasaraopeta" />
                  <option value="RVR & JC College of Engineering, Guntur" />
                  <option value="Vasireddy Venkatadri Institute of Technology (VVIT), Guntur" />
                  <option value="Indian Institute of Technology (IIT), Madras" />
                  <option value="Indian Institute of Technology (IIT), Delhi" />
                  <option value="Indian Institute of Technology (IIT), Bombay" />
                  <option value="Indian Institute of Technology (IIT), Kanpur" />
                  <option value="Indian Institute of Technology (IIT), Kharagpur" />
                  <option value="Indian Institute of Technology (IIT), Roorkee" />
                  <option value="Indian Institute of Technology (IIT), Guwahati" />
                  <option value="Indian Institute of Technology (IIT), Hyderabad" />
                  <option value="Indian Institute of Technology (IIT), BHU Varanasi" />
                  <option value="Indian Institute of Technology (IIT), Dhanbad" />
                  <option value="Indian Institute of Technology (IIT), Indore" />
                  <option value="Indian Institute of Technology (IIT), Patna" />
                  <option value="Indian Institute of Technology (IIT), Gandhinagar" />
                  <option value="National Institute of Technology (NIT), Trichy" />
                  <option value="National Institute of Technology (NIT), Karnataka Surathkal" />
                  <option value="National Institute of Technology (NIT), Rourkela" />
                  <option value="National Institute of Technology (NIT), Warangal" />
                  <option value="National Institute of Technology (NIT), Calicut" />
                  <option value="Visvesvaraya National Institute of Technology (VNIT), Nagpur" />
                  <option value="Malaviya National Institute of Technology (MNIT), Jaipur" />
                  <option value="Motilal Nehru National Institute of Technology (MNNIT), Allahabad" />
                  <option value="Birla Institute of Technology and Science (BITS), Pilani" />
                  <option value="Birla Institute of Technology and Science (BITS), Goa" />
                  <option value="Birla Institute of Technology and Science (BITS), Hyderabad" />
                  <option value="International Institute of Information Technology (IIIT), Hyderabad" />
                  <option value="International Institute of Information Technology (IIIT), Bangalore" />
                  <option value="Indraprastha Institute of Information Technology (IIIT), Delhi" />
                  <option value="Vellore Institute of Technology (VIT), Vellore" />
                  <option value="SRM Institute of Science and Technology, Chennai" />
                  <option value="Anna University, Chennai" />
                  <option value="Jawaharlal Nehru Technological University (JNTU), Hyderabad" />
                  <option value="Jawaharlal Nehru Technological University (JNTU), Kakinada" />
                  <option value="Jawaharlal Nehru Technological University (JNTU), Anantapur" />
                  <option value="Visvesvaraya Technological University (VTU), Belagavi" />
                  <option value="Savitribai Phule Pune University, Pune" />
                  <option value="College of Engineering (COEP), Pune" />
                  <option value="Veermata Jijabai Technological Institute (VJTI), Mumbai" />
                  <option value="University of Mumbai, Mumbai" />
                  <option value="University of Delhi, Delhi" />
                  <option value="Delhi Technological University (DTU), Delhi" />
                  <option value="Netaji Subhas University of Technology (NSUT), Delhi" />
                  <option value="Jadavpur University, Kolkata" />
                  <option value="Calcutta University, Kolkata" />
                  <option value="Banaras Hindu University (BHU), Varanasi" />
                  <option value="Amity University, Noida" />
                  <option value="Lovely Professional University (LPU), Phagwara" />
                  <option value="Manipal Academy of Higher Education, Manipal" />
                  <option value="Thapar Institute of Engineering and Technology, Patiala" />
                  <option value="PSG College of Technology, Coimbatore" />
                  <option value="R.V. College of Engineering (RVCE), Bangalore" />
                  <option value="PES University, Bangalore" />
                  <option value="M.S. Ramaiah Institute of Technology, Bangalore" />
                  <option value="Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar" />
                  <option value="Amrita Vishwa Vidyapeetham, Coimbatore" />
                  <option value="SASTRA Deemed University, Tanjore" />
                  <option value="Birla Institute of Technology (BIT), Mesra" />
                  <option value="Shiv Nadar University, Dadri" />
                  <option value="Ashoka University, Sonepat" />
                  <option value="Aligarh Muslim University (AMU), Aligarh" />
                  <option value="Jamia Millia Islamia, Delhi" />
                  <option value="Panjab University, Chandigarh" />
                </datalist>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Creating Profile...' : 'Register Profile'}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Already have an account? 
                <span 
                  onClick={() => { setIsRegister(false); navigate('/student/login'); }}
                  style={styles.toggleLink}
                >
                  {' '}Sign In
                </span>
              </p>
            </div>
          </div>
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
    background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.15) 0%, transparent 60%)',
    pointerEvents: 'none' as const,
  },
  card: {
    width: '100%',
    padding: 0,
    border: 'none',
    overflow: 'hidden' as const,
    transition: 'max-width 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  slidingPane: {
    display: 'flex',
    width: '200%',
    transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  formContainer: {
    width: '50%',
    padding: '1.5rem 2rem',
    boxSizing: 'border-box' as const,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
  },
  logoImg: {
    height: '48px',
    objectFit: 'contain' as const,
    marginBottom: '0.75rem',
    filter: 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.45))',
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
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  toggleLink: {
    color: '#f97316',
    fontWeight: 600,
    textDecoration: 'none',
    marginLeft: '0.25rem',
    cursor: 'pointer'
  }
};

export default StudentAuth;
