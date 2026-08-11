import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Settings, Save } from 'lucide-react';
import api from '../../api';

const CoordinatorSettings: React.FC = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Event state fields
  const [name, setName] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [collegeName, setCollegeName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Deadlines
  const [regStart, setRegStart] = useState<string>('');
  const [regEnd, setRegEnd] = useState<string>('');
  const [lockDeadline, setLockDeadline] = useState<string>('');
  const [probDeadline, setProbDeadline] = useState<string>('');
  const [subDeadline, setSubDeadline] = useState<string>('');
  const [evalStart, setEvalStart] = useState<string>('');
  const [evalEnd, setEvalEnd] = useState<string>('');
  const [shortlistDate, setShortlistDate] = useState<string>('');

  // Rules Settings
  const [teamSize, setTeamSize] = useState<number>(6);
  const [minFemales, setMinFemales] = useState<number>(1);
  const [sameCollege, setSameCollege] = useState<boolean>(true);
  const [allowMultiTeam, setAllowMultiTeam] = useState<boolean>(false);
  const [probLimit, setProbLimit] = useState<number>(2);
  const [shortlistLimit, setShortlistLimit] = useState<number>(25);
  const [waitlistLimit, setWaitlistLimit] = useState<number>(5);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/coordinator/settings');
      const e = res.data;
      setName(e.name);
      setAcademicYear(e.academic_year);
      setCollegeName(e.college_name);
      setDescription(e.description || '');
      
      // format datetime-local strings
      const formatDT = (dt: string) => dt ? dt.slice(0, 16) : '';
      setRegStart(formatDT(e.registration_start));
      setRegEnd(formatDT(e.registration_end));
      setLockDeadline(formatDT(e.team_finalization_deadline));
      setProbDeadline(formatDT(e.problem_selection_deadline));
      setSubDeadline(formatDT(e.submission_deadline));
      setEvalStart(formatDT(e.evaluation_start));
      setEvalEnd(formatDT(e.evaluation_end));
      setShortlistDate(formatDT(e.shortlisting_date));
      
      const s = e.settings;
      if (s) {
        setTeamSize(s.team_size);
        setMinFemales(s.min_female_members);
        setSameCollege(s.same_college);
        setAllowMultiTeam(s.multi_team_membership_allowed);
        setProbLimit(s.problem_statements_limit);
        setShortlistLimit(s.shortlist_size);
        setWaitlistLimit(s.waitlist_size);
      }
    } catch (err) {
      showToast('Error loading event settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Parse datetime strings to ISO UTC
    const toISO = (val: string) => val ? new Date(val).toISOString() : new Date().toISOString();
    
    const payload = {
      name: name.trim(),
      academic_year: academicYear.trim(),
      college_name: collegeName.trim(),
      description: description.trim() || undefined,
      registration_start: toISO(regStart),
      registration_end: toISO(regEnd),
      team_finalization_deadline: toISO(lockDeadline),
      problem_selection_deadline: toISO(probDeadline),
      submission_deadline: toISO(subDeadline),
      evaluation_start: toISO(evalStart),
      evaluation_end: toISO(evalEnd),
      shortlisting_date: toISO(shortlistDate),
      settings: {
        team_size: teamSize,
        min_female_members: minFemales,
        same_college: sameCollege,
        multi_team_membership_allowed: allowMultiTeam,
        team_leader_required: true,
        team_name_unique: true,
        team_name_no_institute: true,
        problem_statements_limit: probLimit,
        shortlist_size: shortlistLimit,
        waitlist_size: waitlistLimit,
        evaluation_method: 'judge_average'
      }
    };

    try {
      await api.put('/coordinator/settings', payload);
      showToast('Event settings saved successfully!', 'success');
      fetchSettings(); // reload to confirm
    } catch (err) {
      showToast('Failed to save event parameters', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading event parameters...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
          <Settings size={22} color="var(--color-primary)" />
          Event Configuration & Rules Settings
        </h2>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Core Metadata */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>General Metadata</h3>
          
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input type="text" className="form-control" placeholder="e.g. 2025-2026" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">College Name *</label>
              <input type="text" className="form-control" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Event Description</label>
            <textarea className="form-control" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Deadlines */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Timeline & Deadlines</h3>
          
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Registration Start *</label>
              <input type="datetime-local" className="form-control" value={regStart} onChange={(e) => setRegStart(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Registration End *</label>
              <input type="datetime-local" className="form-control" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Team Finalization Deadline *</label>
              <input type="datetime-local" className="form-control" value={lockDeadline} onChange={(e) => setLockDeadline(e.target.value)} required />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Problem Selection Deadline *</label>
              <input type="datetime-local" className="form-control" value={probDeadline} onChange={(e) => setProbDeadline(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Idea Submission Deadline *</label>
              <input type="datetime-local" className="form-control" value={subDeadline} onChange={(e) => setSubDeadline(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Evaluation Start *</label>
              <input type="datetime-local" className="form-control" value={evalStart} onChange={(e) => setEvalStart(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2" style={{ maxWidth: '66.6%' }}>
            <div className="form-group">
              <label className="form-label">Evaluation End *</label>
              <input type="datetime-local" className="form-control" value={evalEnd} onChange={(e) => setEvalEnd(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Shortlisting Date *</label>
              <input type="datetime-local" className="form-control" value={shortlistDate} onChange={(e) => setShortlistDate(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* SIH Rules */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>SIH Event Constraints Configuration</h3>
          
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Required Team Size *</label>
              <input type="number" className="form-control" min={2} max={10} value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Min Female Members *</label>
              <input type="number" className="form-control" min={0} max={5} value={minFemales} onChange={(e) => setMinFemales(parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Problems Selection Limit *</label>
              <input type="number" className="form-control" min={1} max={5} value={probLimit} onChange={(e) => setProbLimit(parseInt(e.target.value))} required />
            </div>
          </div>

          <div className="grid-2" style={{ maxWidth: '66.6%' }}>
            <div className="form-group">
              <label className="form-label">Target Shortlist Count *</label>
              <input type="number" className="form-control" min={1} value={shortlistLimit} onChange={(e) => setShortlistLimit(parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Waitlist Count *</label>
              <input type="number" className="form-control" min={0} value={waitlistLimit} onChange={(e) => setWaitlistLimit(parseInt(e.target.value))} required />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={sameCollege} onChange={(e) => setSameCollege(e.target.checked)} style={{ scale: '1.2' }} />
                <span>Enforce Same College Requirement</span>
              </label>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={allowMultiTeam} onChange={(e) => setAllowMultiTeam(e.target.checked)} style={{ scale: '1.2' }} />
                <span>Allow Multiple Team Memberships (Warning: breaks standard SIH rules)</span>
              </label>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration Parameters'}
        </button>
      </form>
    </div>
  );
};

export default CoordinatorSettings;
