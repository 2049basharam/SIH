import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Plus, Sparkles } from 'lucide-react';
import api from '../../api';
import type { Announcement } from '../../types';
import { formatDate } from '../../utils';

const CoordinatorAnnouncements: React.FC = () => {
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Form fields
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [audience, setAudience] = useState<string>('ALL');
  const [audienceMetadata, setAudienceMetadata] = useState<string>('');
  const [drafting, setDrafting] = useState<boolean>(false);

  const handleGenerateDraft = async () => {
    if (!message.trim()) {
      showToast('Please type some rough points in the message box first', 'info');
      return;
    }
    try {
      setDrafting(true);
      const res = await api.post('/intelligence/announcement/draft', { rough_text: message });
      setMessage(res.data.draft);
      showToast('Draft updated with AI suggestions. Review before publishing!', 'success');
    } catch (err) {
      showToast('AI Drafting service offline.', 'info');
    } finally {
      setDrafting(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coordinator/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      showToast('Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setTitle('');
    setMessage('');
    setPriority('MEDIUM');
    setAudience('ALL');
    setAudienceMetadata('');
    setShowModal(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coordinator/announcements', {
        title: title.trim(),
        message: message.trim(),
        priority,
        audience,
        audience_metadata: audienceMetadata.trim() || undefined
      });
      showToast('Announcement published successfully!', 'success');
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to publish announcement';
      showToast(errMsg, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone size={20} color="var(--color-primary)" />
          Broadcast System Announcements
        </h3>
        
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={16} /> Create Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No announcements published yet.</div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="card" style={{ borderLeft: ann.priority === 'HIGH' ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{ann.title}</h4>
                <span className={`badge ${ann.priority === 'HIGH' ? 'badge-danger' : ann.priority === 'MEDIUM' ? 'badge-warning' : 'badge-info'}`}>
                  {ann.priority}
                </span>
              </div>
              <p style={{ color: '#d1d5db', fontSize: '0.95rem' }}>{ann.message}</p>
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Audience Target: {ann.audience} {ann.audience_metadata ? `(${ann.audience_metadata})` : ''}</span>
                <span>Published: {formatDate(ann.publish_time, true)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Publish Announcement</h3>
            
            <form onSubmit={handleSaveAnnouncement}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Message *</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDraft} 
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    disabled={drafting}
                  >
                    <Sparkles size={12} />
                    {drafting ? 'Drafting...' : 'Draft with AI'}
                  </button>
                </div>
                <textarea className="form-control" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Audience *</label>
                  <select className="form-control" value={audience} onChange={(e) => setAudience(e.target.value)}>
                    <option value="ALL">All Students</option>
                    <option value="NO_TEAM">Students Without Team</option>
                    <option value="DRAFT_TEAMS">Draft Teams</option>
                    <option value="FINALIZED_TEAMS">Finalized Teams</option>
                    <option value="SUBMITTED_TEAMS">Submitted Teams</option>
                    <option value="SHORTLISTED_TEAMS">Shortlisted Teams</option>
                    <option value="WAITLISTED_TEAMS">Waitlisted Teams</option>
                    <option value="DEPARTMENT">Specific Department</option>
                  </select>
                </div>
              </div>

              {audience === 'DEPARTMENT' && (
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Computer Science" 
                    value={audienceMetadata} 
                    onChange={(e) => setAudienceMetadata(e.target.value)} 
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinatorAnnouncements;
