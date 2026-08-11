import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

interface AuditLog {
  id: number;
  actor_id: number;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: number | null;
  reason: string | null;
  created_at: string;
}

const AuditLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/spoc/audit-logs');
        setLogs(res.data);
      } catch (err) {
        showToast('Failed to load audit logs', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>System Audit Logs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time record of all SPOC and coordinator administrative actions.
        </p>
      </div>

      {loading ? (
        <div>Loading audit trail...</div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No administrative actions have been logged yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Role</th>
                <th>Action</th>
                <th>Entity Affected</th>
                <th>Reason / Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                      {log.actor_role}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{log.action}</strong>
                  </td>
                  <td>
                    {log.entity} {log.entity_id ? `(#${log.entity_id})` : ''}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {log.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
