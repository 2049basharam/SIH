import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Bell, Check } from 'lucide-react';
import api from '../../api';
import type { Notification } from '../../types';
import { formatDate } from '../../utils';

const Notifications: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/student/notifications');
      setNotifications(res.data);
    } catch (err) {
      showToast('Error loading notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/student/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      showToast('Notification marked as read', 'success');
    } catch (err) {
      showToast('Failed to update notification', 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading notifications...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '750px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={24} color="var(--color-primary)" />
        <h2>Your Notifications</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="card" style={styles.notifCard(n.is_read)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: n.is_read ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: '0.25rem' }}>{n.title}</h4>
                  <p style={{ color: n.is_read ? '#6b7280' : '#d1d5db', fontSize: '0.9rem' }}>{n.message}</p>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                    {formatDate(n.created_at, true)}
                  </span>
                </div>

                {!n.is_read && (
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', borderRadius: '4px' }}
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as read"
                  >
                    <Check size={16} color="var(--color-success)" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  notifCard: (isRead: boolean) => ({
    borderLeft: isRead ? '4px solid rgba(255, 255, 255, 0.1)' : '4px solid var(--color-primary)',
    background: isRead ? 'rgba(255, 255, 255, 0.01)' : 'rgba(99, 102, 241, 0.02)',
  })
};

export default Notifications;
