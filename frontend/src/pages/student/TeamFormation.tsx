import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Users, UserPlus, Trash2, ShieldAlert, Award, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../api';
import type { Team, Event } from '../../types';

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

const TeamFormation: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Custom Member Registration Form
  const [memberRoll, setMemberRoll] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [memberDept, setMemberDept] = useState<string>('');
  const [memberBranch, setMemberBranch] = useState<string>('CSE');
  const [memberYear, setMemberYear] = useState<number>(3);
  const [memberEmail, setMemberEmail] = useState<string>('');
  const [memberPhone, setMemberPhone] = useState<string>('');
  const [memberGender, setMemberGender] = useState<'M' | 'F' | 'Other'>('M');
  const [searching, setSearching] = useState<boolean>(false);
  
  // Edit Mode
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');

  const userCollege = user?.profile?.college || "Narasaraopeta Engineering College (Autonomous), Narasaraopeta";
  const activeDepartments = collegeDepartments[userCollege] || defaultDepartments;

  useEffect(() => {
    if (activeDepartments.length > 0) {
      setMemberDept(activeDepartments[0]);
    }
  }, [userCollege]);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/student/team');
      setTeam(res.data);
      setEditedName(res.data.name);
    } catch (err) {
      setTeam(null);
    }
  };

  const fetchEvent = async () => {
    try {
      const res = await api.get('/student/event');
      setEvent(res.data);
    } catch (err) {
      console.error('Error fetching event rules');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEvent();
      await fetchTeam();
      setLoading(false);
    };
    init();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      showToast('Please enter a team name', 'error');
      return;
    }
    if (!event) return;
    try {
      const res = await api.post('/student/teams', {
        name: newTeamName,
        event_id: event.id
      });
      setTeam(res.data);
      showToast('Team created successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create team. Ensure name is unique.';
      showToast(errMsg, 'error');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberRoll.trim() || !memberName.trim() || !memberEmail.trim() || !team) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setSearching(true);
    try {
      const res = await api.post('/student/team/members/custom', {
        student_id: memberRoll.trim(),
        full_name: memberName.trim(),
        gender: memberGender,
        email: memberEmail.trim(),
        phone: memberPhone.trim() || undefined,
        department: memberDept,
        branch: memberBranch.trim(),
        year: memberYear
      });
      setTeam(res.data);
      // Reset form
      setMemberRoll('');
      setMemberName('');
      setMemberEmail('');
      setMemberPhone('');
      setMemberGender('M');
      showToast(`${memberName} registered and added to the team!`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to add team member';
      showToast(errMsg, 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveMember = async (studentId: number) => {
    if (!team) return;
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const res = await api.delete(`/student/team/members/${studentId}`);
        setTeam(res.data);
        showToast('Member removed successfully.', 'success');
      } catch (err: any) {
        const errMsg = err.response?.data?.detail || 'Failed to remove member';
        showToast(errMsg, 'error');
      }
    }
  };

  const handleRenameTeam = async () => {
    if (!editedName.trim() || !team) return;
    try {
      const res = await api.put('/student/team', {
        name: editedName
      });
      setTeam(res.data);
      setIsEditingName(false);
      showToast('Team renamed successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to rename team';
      showToast(errMsg, 'error');
    }
  };

  const handleSetLeader = async (leaderId: number) => {
    if (!team) return;
    if (window.confirm('Are you sure you want to hand over leadership? Only the leader can finalize team details.')) {
      try {
        const res = await api.put('/student/team', {
          leader_id: leaderId
        });
        setTeam(res.data);
        showToast('Leadership transferred successfully.', 'info');
      } catch (err: any) {
        const errMsg = err.response?.data?.detail || 'Failed to transfer leadership';
        showToast(errMsg, 'error');
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading team information...</div>;
  }

  const isLeader = team && team.leader_id === user?.profile?.id;
  const isLocked = team && ['FINALIZED', 'SUBMITTED', 'SHORTLISTED', 'WAITLISTED'].includes(team.status);

  // Female count calculation
  const femaleCount = team?.members?.filter(m => m.student.gender === 'F').length || 0;
  const satisfiesFemale = event ? femaleCount >= event.settings!.min_female_members : false;
  const satisfiesSize = event && team ? team.members!.length === event.settings!.team_size : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {!team ? (
        /* Create Team Form */
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Users size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
            <h2>Create a New Team</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Assemble a team of {event?.settings?.team_size} members to submit your hackathon ideas.
            </p>
          </div>

          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Cyber Busters" 
                value={newTeamName} 
                onChange={(e) => setNewTeamName(e.target.value)} 
                required 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Note: Team name must be unique and cannot contain your college name words.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Team
            </button>
          </form>
        </div>
      ) : (
        /* View Team Form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Team Header Status */}
          <div className="card" style={styles.teamHeaderCard}>
            <div style={{ flex: 1 }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)} 
                    style={{ maxWidth: '300px' }}
                  />
                  <button className="btn btn-primary" onClick={handleRenameTeam}>Save</button>
                  <button className="btn btn-secondary" onClick={() => setIsEditingName(false)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.75rem' }}>{team.name}</h2>
                  {isLeader && !isLocked && (
                    <span 
                      style={styles.editLink} 
                      onClick={() => { setEditedName(team.name); setIsEditingName(true); }}
                    >
                      Rename
                    </span>
                  )}
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Created At: {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <span className={`badge ${isLocked ? 'badge-success' : 'badge-warning'}`}>
                {team.status.replace('_', ' ')}
              </span>
              
              {isLeader && !isLocked && (
                <Link to="/student/team/review" className="btn btn-primary">
                  Review & Finalize <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>

          {/* Validation Banner warnings */}
          {!isLocked && (
            <div className="card" style={styles.checklistCard}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Finalization Checklist</h3>
              <div className="grid-2">
                <div style={styles.checkItem}>
                  <CheckCircle size={16} color={satisfiesSize ? 'var(--color-success)' : 'var(--text-muted)'} />
                  <span>Team Size: {team.members?.length} / {event?.settings?.team_size} members</span>
                </div>
                <div style={styles.checkItem}>
                  <CheckCircle size={16} color={satisfiesFemale ? 'var(--color-success)' : 'var(--text-muted)'} />
                  <span>Female Representation: {femaleCount} / {event?.settings?.min_female_members} required</span>
                </div>
              </div>
            </div>
          )}

          {/* Grid: Members list & add member */}
          <div className="grid-3">
            {/* Members List */}
            <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3>Team Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {team.members?.map((m) => {
                  const isMemLeader = m.student_id === team.leader_id;
                  const isMe = m.student.user_id === user?.id;
                  return (
                    <div key={m.student_id} style={styles.memberRow}>
                      <div className="avatar" style={{ background: isMemLeader ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined }}>
                        {isMemLeader ? <Award size={18} /> : m.student.full_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.student.full_name}</span>
                          {isMe && <span className="badge badge-info" style={{ scale: '0.8' }}>You</span>}
                          {isMemLeader && <span className="badge badge-warning" style={{ scale: '0.8' }}>Leader</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.student.student_id} | {m.student.department} | Year {m.student.year} | {m.student.gender === 'F' ? 'Female' : 'Male'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {m.student.phone || 'No phone'} | {m.student.college}
                        </div>
                      </div>
                      
                      {isLeader && !isLocked && !isMemLeader && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handleSetLeader(m.student_id)}
                          >
                            Set Leader
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '4px' }}
                            onClick={() => handleRemoveMember(m.student_id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Member panel */}
            {isLeader && !isLocked ? (
              <form onSubmit={handleAddMember} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', height: 'fit-content' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <UserPlus size={20} color="var(--color-primary)" />
                  Add Team Member
                </h3>
                
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Roll Number / Student ID *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 2026SIH012" 
                    value={memberRoll} 
                    onChange={(e) => setMemberRoll(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rahul Sharma" 
                    value={memberName} 
                    onChange={(e) => setMemberName(e.target.value)} 
                    required
                  />
                </div>

                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Gender *</label>
                    <select 
                      className="form-control" 
                      value={memberGender} 
                      onChange={(e) => setMemberGender(e.target.value as any)}
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Year *</label>
                    <select 
                      className="form-control" 
                      value={memberYear} 
                      onChange={(e) => setMemberYear(parseInt(e.target.value))}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Department *</label>
                  <select 
                    className="form-control" 
                    value={memberDept} 
                    onChange={(e) => setMemberDept(e.target.value)}
                  >
                    {activeDepartments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Branch *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. CSE" 
                    value={memberBranch} 
                    onChange={(e) => setMemberBranch(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Email ID *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="e.g. rahul@gmail.com" 
                    value={memberEmail} 
                    onChange={(e) => setMemberEmail(e.target.value)} 
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="e.g. 9876543210" 
                    value={memberPhone} 
                    onChange={(e) => setMemberPhone(e.target.value)} 
                  />
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={searching}
                >
                  {searching ? 'Registering...' : 'Add Team Member'}
                </button>
              </form>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
                <ShieldAlert size={28} color="var(--color-info)" />
                <h4>Team Locked</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isLocked 
                    ? 'This team has been finalized. Member additions, deletions, and name changes are disabled.' 
                    : 'Only the designated team leader can manage members or make changes.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  teamHeaderCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2rem',
    borderLeft: '4px solid var(--color-primary)',
  },
  editLink: {
    color: 'var(--color-primary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  checklistCard: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px dashed rgba(99, 102, 241, 0.25)',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    background: 'rgba(0, 0, 0, 0.015)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    borderRadius: '8px',
    padding: '1rem',
  }
};

export default TeamFormation;
