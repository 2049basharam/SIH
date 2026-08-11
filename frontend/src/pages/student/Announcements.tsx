import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Megaphone, AlertCircle } from 'lucide-react';
import api from '../../api';
import type { Announcement } from '../../types';
import { formatDate } from '../../utils';

const Announcements: React.FC = () => {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/student/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        showToast('Error loading announcements', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading announcements...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Megaphone size={24} color="var(--color-primary)" />
        <h2>All Announcements</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {announcements.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No announcements active at this moment.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="card" style={{ borderLeft: ann.priority === 'HIGH' ? '4px solid var(--color-danger)' : '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>{ann.title}</h3>
                <span className={`badge ${ann.priority === 'HIGH' ? 'badge-danger' : ann.priority === 'MEDIUM' ? 'badge-warning' : 'badge-info'}`}>
                  {ann.priority} Priority
                </span>
              </div>
              <p style={{ color: '#d1d5db', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Target: {ann.audience.replace('_', ' ')}</span>
                <span>Published: {formatDate(ann.publish_time, true)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
