import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Plus, Sparkles } from 'lucide-react';
import api from '../../api';

interface Announcement {
  id: number;
  title: string;
  message: string;
  priority: string;
  audience: string;
  publish_time: string;
}

const Announcements: React.FC = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [audience, setAudience] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [drafting, setDrafting] = useState(false);

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
    try {
      setLoading(true);
      await api.get('/spoc/settings'); // To get SPOC context then announcements
      const annRes = await api.get('/coordinator/announcements'); // Share endpoint or spoc
      setAnnouncements(annRes.data);
    } catch (err) {
      showToast('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/spoc/announcements', {
        title: title.trim(),
        message: message.trim(),
        priority,
        audience
      });
      showToast('Announcement broadcasted successfully!', 'success');
      setTitle('');
      setMessage('');
      setShowCreateModal(false);
      fetchAnnouncements();
    } catch (err) {
      showToast('Failed to publish announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>College Announcements</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Publish urgent alerts, dates, or selection guidelines.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} />
          Create Announcement
        </button>
      </div>

      {loading ? (
        <div>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No announcements published yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((ann) => (
            <div key={ann.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${
                  ann.priority === 'HIGH' ? 'badge-danger' : 
                  ann.priority === 'MEDIUM' ? 'badge-info' : 'badge-success'
                }`}>
                  {ann.priority} Priority
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(ann.publish_time).toLocaleString()}
                </span>
              </div>
              <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{ann.title}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ann.message}</p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <strong>Audience:</strong> {ann.audience}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Announcement</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Announcement Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Venue Change / Lab Instructions" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Broadcast Message *</label>
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
                <textarea 
                  className="form-control" 
                  placeholder="Detailed description of the guidelines..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ minHeight: '120px' }}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="ALL">All Participants</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="JUDGES">Judges Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish'}
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

export default Announcements;
